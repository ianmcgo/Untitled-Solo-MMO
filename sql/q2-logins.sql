create table if not exists game_private.login_log (
  id bigserial primary key,
  player uuid not null,
  email text,
  char_name text,
  started timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  ended timestamptz,
  reason text
);
create index if not exists login_log_open on game_private.login_log (player) where ended is null;
create index if not exists login_log_started on game_private.login_log (started desc);
revoke all on game_private.login_log from public, anon, authenticated;

create or replace function game_private.login_touch(me uuid) returns void
language plpgsql as $$
begin
  update game_private.login_log set ended = last_seen, reason = 'timed out' where ended is null and last_seen < now() - interval '120 seconds';
  update game_private.login_log set last_seen = now() where player = me and ended is null;
  if not found then
    insert into game_private.login_log (player, email) values (me, (select p.email from public.players p where p.id = me));
  end if;
  delete from game_private.login_log where started < now() - interval '30 days';
end $$;

create or replace function game_private.login_close(me uuid, why text) returns void
language sql as $$
  update game_private.login_log set ended = now(), last_seen = now(), reason = left(coalesce(why, 'logged out'), 30) where player = me and ended is null
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
    perform game_private.login_touch(me);
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
  perform game_private.login_touch(me);
  select count(*) into used from game_private.seats;
  select count(*) into total from game_private.queue;
  return jsonb_build_object('state', 'play', 'online', used, 'max', cap, 'queue', total);
end $$;

create or replace function public.queue_leave() returns void
language plpgsql security definer set search_path = public, game_private as $$
begin
  perform game_private.login_close(auth.uid(), 'logged out');
  delete from game_private.seats where player = auth.uid();
  delete from game_private.queue where player = auth.uid();
end $$;

create or replace function public.queue_leave(why text) returns void
language plpgsql security definer set search_path = public, game_private as $$
begin
  perform game_private.login_close(auth.uid(), case when why in ('logged out', 'signed out', 'idle', 'idle at character screen', 'left') then why else 'logged out' end);
  delete from game_private.seats where player = auth.uid();
  delete from game_private.queue where player = auth.uid();
end $$;

create or replace function public.session_char(name text) returns void
language sql security definer set search_path = public, game_private as $$
  update game_private.login_log l set char_name = left(name, 16)
  where l.player = auth.uid() and l.ended is null
    and exists (select 1 from public.characters c where c.owner = auth.uid() and c.name = session_char.name)
$$;

create or replace function public.admin_logins(lim int) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update game_private.login_log set ended = last_seen, reason = 'timed out' where ended is null and last_seen < now() - interval '120 seconds';
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.started desc), '[]'::jsonb) from (
    select l.id, l.email, l.char_name, l.started, l.last_seen, l.ended, l.reason, (l.ended is null) as online
    from game_private.login_log l order by l.started desc limit greatest(1, least(coalesce(lim, 100), 500))) x);
end $$;

revoke all on function game_private.login_touch(uuid), game_private.login_close(uuid, text) from public, anon, authenticated;
revoke all on function public.queue_leave(text), public.session_char(text), public.admin_logins(int) from public, anon;
grant execute on function public.queue_leave(), public.queue_leave(text), public.session_char(text), public.admin_logins(int) to authenticated;

insert into game_private.config (k, v) values ('schema', '9') on conflict (k) do update set v = greatest(game_private.config.v::int, 9)::text;
