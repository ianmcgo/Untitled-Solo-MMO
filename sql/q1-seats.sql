insert into game_private.config (k, v) values ('max_online', '20') on conflict (k) do nothing;

create table if not exists game_private.seats (player uuid primary key, since timestamptz not null default now(), beat timestamptz not null default now());
create table if not exists game_private.queue (player uuid primary key, joined timestamptz not null default clock_timestamp(), polled timestamptz not null default now());
revoke all on game_private.seats, game_private.queue from public, anon, authenticated;

create or replace function game_private.seat_cap() returns int
language sql stable as $$
  select coalesce((select v::int from game_private.config where k = 'max_online'), 20)
$$;

create or replace function public.has_seat() returns boolean
language sql stable security definer set search_path = public, game_private as $$
  select game_private.seat_cap() <= 0 or public.is_admin()
    or exists (select 1 from game_private.seats s where s.player = auth.uid() and s.beat > now() - interval '120 seconds')
$$;

create or replace function public.queue_join() returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare me uuid := auth.uid(); cap int; used int; ahead int; total int; mj timestamptz;
begin
  if not public.is_member() then raise exception 'Not allowed'; end if;
  cap := game_private.seat_cap();
  perform pg_advisory_xact_lock(hashtext('game_seats'));
  delete from game_private.seats where beat < now() - interval '120 seconds';
  delete from game_private.queue where polled < now() - interval '30 seconds';
  if cap <= 0 or public.is_admin() then
    select count(*) into used from game_private.seats;
    select count(*) into total from game_private.queue;
    return jsonb_build_object('state', 'play', 'online', used, 'max', cap, 'queue', total, 'admin', public.is_admin());
  end if;
  update game_private.seats set beat = now() where player = me;
  if not found then
    insert into game_private.queue (player) values (me) on conflict (player) do update set polled = now();
    select joined into mj from game_private.queue where player = me;
    select count(*) into used from game_private.seats;
    select count(*) into ahead from game_private.queue q where (q.joined, q.player) < (mj, me);
    if ahead < cap - used then
      delete from game_private.queue where player = me;
      insert into game_private.seats (player) values (me);
    else
      select count(*) into total from game_private.queue;
      return jsonb_build_object('state', 'wait', 'ahead', ahead, 'online', used, 'max', cap, 'queue', total);
    end if;
  end if;
  delete from game_private.queue where player = me;
  select count(*) into used from game_private.seats;
  select count(*) into total from game_private.queue;
  return jsonb_build_object('state', 'play', 'online', used, 'max', cap, 'queue', total);
end $$;

create or replace function public.queue_leave() returns void
language plpgsql security definer set search_path = public, game_private as $$
begin
  delete from game_private.seats where player = auth.uid();
  delete from game_private.queue where player = auth.uid();
end $$;

create or replace function game_private.my_char(cid uuid) returns public.characters
language plpgsql as $$
declare c public.characters;
begin
  if not public.is_member() then raise exception 'Not allowed'; end if;
  if not public.has_seat() then raise exception 'You no longer have a place on the server. Log in again to rejoin.'; end if;
  select * into c from public.characters where id = cid and owner = auth.uid() for update;
  if not found then raise exception 'Not your character'; end if;
  return c;
end $$;

drop policy if exists chars_select on public.characters;
drop policy if exists chars_insert on public.characters;
drop policy if exists chars_update on public.characters;
drop policy if exists chars_delete on public.characters;
create policy chars_select on public.characters for select using ((owner = auth.uid() and public.has_seat()) or public.is_admin());
create policy chars_insert on public.characters for insert with check (owner = auth.uid() and public.is_member() and public.has_seat() and (select count(*) from public.characters c where c.owner = auth.uid()) < 5);
create policy chars_update on public.characters for update using (owner = auth.uid() and public.is_member() and public.has_seat()) with check (owner = auth.uid());
create policy chars_delete on public.characters for delete using (owner = auth.uid() and public.has_seat());

revoke all on function game_private.seat_cap() from public, anon, authenticated;
revoke all on function public.has_seat(), public.queue_join(), public.queue_leave() from public, anon;
grant execute on function public.has_seat(), public.queue_join(), public.queue_leave() to authenticated;

insert into game_private.config (k, v) values ('schema', '8') on conflict (k) do update set v = greatest(game_private.config.v::int, 8)::text;
