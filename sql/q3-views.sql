create table if not exists game_private.site_views (id int primary key default 1 check (id = 1), n bigint not null default 0);
revoke all on game_private.site_views from public, anon, authenticated;
insert into game_private.site_views (id, n) values (1, 0) on conflict (id) do nothing;

create or replace function public.bump_site_views() returns bigint language plpgsql security definer set search_path = public, game_private as $$
declare v bigint;
begin
  update game_private.site_views set n = n + 1 where id = 1 returning n into v;
  return v;
end $$;

create or replace function public.get_site_views() returns bigint language sql stable security definer set search_path = public, game_private as $$
  select n from game_private.site_views where id = 1
$$;

revoke all on function public.bump_site_views(), public.get_site_views() from public;
grant execute on function public.bump_site_views(), public.get_site_views() to anon, authenticated;

insert into game_private.config (k, v) values ('schema', '10') on conflict (k) do update set v = greatest(game_private.config.v::int, 10)::text;
