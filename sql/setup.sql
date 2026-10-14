create extension if not exists pgcrypto;

create schema if not exists game_private;
revoke all on schema game_private from public, anon, authenticated;

create table if not exists game_private.config (k text primary key, v text not null);
revoke all on game_private.config from public, anon, authenticated;

create table if not exists public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  banned boolean not null default false
);
alter table public.players enable row level security;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 12),
  data jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists characters_name_lower on public.characters (lower(name));
create index if not exists characters_owner on public.characters (owner);
alter table public.characters enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email') = 'ianmcgon@gmail.com', false)
$$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.players p where p.id = auth.uid() and not p.banned)
$$;

drop policy if exists players_select on public.players;
create policy players_select on public.players for select using (id = auth.uid() or public.is_admin());

drop policy if exists chars_select on public.characters;
drop policy if exists chars_insert on public.characters;
drop policy if exists chars_update on public.characters;
drop policy if exists chars_delete on public.characters;
create policy chars_select on public.characters for select using (owner = auth.uid() or public.is_admin());
create policy chars_insert on public.characters for insert with check (owner = auth.uid() and public.is_member() and (select count(*) from public.characters c where c.owner = auth.uid()) < 8);
create policy chars_update on public.characters for update using (owner = auth.uid() and public.is_member()) with check (owner = auth.uid());
create policy chars_delete on public.characters for delete using (owner = auth.uid());

create or replace function public.join_game(code text) returns boolean
language plpgsql security definer set search_path = public as $$
declare want text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.is_member() then return true; end if;
  if public.is_admin() then
    insert into public.players (id, email) values (auth.uid(), auth.jwt() ->> 'email') on conflict (id) do nothing;
    return true;
  end if;
  select v into want from game_private.config where k = 'signup_code';
  if want is null or code is distinct from want then raise exception 'Wrong sign-up password'; end if;
  insert into public.players (id, email) values (auth.uid(), auth.jwt() ->> 'email') on conflict (id) do nothing;
  return true;
end $$;

create or replace function public.touch_player() returns void
language sql security definer set search_path = public as $$
  update public.players set last_seen = now() where id = auth.uid()
$$;

create or replace function public.admin_set_signup_code(code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if char_length(coalesce(code, '')) < 4 then raise exception 'Use at least 4 characters'; end if;
  insert into game_private.config (k, v) values ('signup_code', code) on conflict (k) do update set v = excluded.v;
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  select jsonb_build_object(
    'players', (select count(*) from public.players),
    'banned', (select count(*) from public.players where banned),
    'online', (select count(*) from public.players where last_seen > now() - interval '5 minutes'),
    'characters', (select count(*) from public.characters),
    'signups_7d', (select count(*) from public.players where joined_at > now() - interval '7 days'),
    'db_size', pg_size_pretty(pg_database_size(current_database())),
    'chars_size', pg_size_pretty(pg_total_relation_size('public.characters')),
    'code_set', exists (select 1 from game_private.config where k = 'signup_code'),
    'online_list', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select email, last_seen from public.players where last_seen > now() - interval '5 minutes' order by last_seen desc limit 50) x),
    'recent', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select c.name, c.summary ->> 'job' as job, c.summary ->> 'lv' as lv, c.summary ->> 'zone' as zone, p.email, c.updated_at from public.characters c left join public.players p on p.id = c.owner order by c.updated_at desc limit 50) x)
  ) into r;
  return r;
end $$;

revoke all on function public.join_game(text), public.touch_player(), public.admin_set_signup_code(text), public.admin_stats() from public, anon;
grant execute on function public.join_game(text), public.touch_player(), public.admin_set_signup_code(text), public.admin_stats(), public.is_admin(), public.is_member() to authenticated;
grant select, insert, update, delete on public.characters to authenticated;
grant select on public.players to authenticated;
