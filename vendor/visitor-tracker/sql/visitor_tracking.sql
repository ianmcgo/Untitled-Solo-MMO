create table if not exists public.site_stats (
  key text primary key,
  value bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.site_stats enable row level security;
revoke all on public.site_stats from anon, authenticated;
insert into public.site_stats (key, value) values ('title_views', 0) on conflict (key) do nothing;

create table if not exists public.site_views_daily (
  day date primary key,
  views bigint not null default 0
);
alter table public.site_views_daily enable row level security;
revoke all on public.site_views_daily from anon, authenticated;

create table if not exists public.site_country_views (
  country char(2) primary key,
  views bigint not null default 0,
  last_seen timestamptz not null default now(),
  first_seen timestamptz not null default now()
);
alter table public.site_country_views enable row level security;
revoke all on public.site_country_views from anon, authenticated;

create table if not exists public.site_country_daily (
  day date not null,
  country char(2) not null,
  views bigint not null default 0,
  primary key (day, country)
);
alter table public.site_country_daily enable row level security;
revoke all on public.site_country_daily from anon, authenticated;

create table if not exists public.site_hour_views (
  hour smallint primary key check (hour between 0 and 23),
  views bigint not null default 0
);
alter table public.site_hour_views enable row level security;
revoke all on public.site_hour_views from anon, authenticated;
insert into public.site_hour_views (hour, views)
select g, 0 from generate_series(0, 23) g
on conflict (hour) do nothing;

create table if not exists public.site_device_daily (
  day date not null,
  device text not null check (device in ('mobile', 'desktop')),
  views bigint not null default 0,
  primary key (day, device)
);
alter table public.site_device_daily enable row level security;
revoke all on public.site_device_daily from anon, authenticated;

create or replace function public.request_country()
 returns text
 language plpgsql
 stable
 set search_path to ''
as $function$
declare
  c text;
begin
  begin
    c := upper(btrim(coalesce((nullif(current_setting('request.headers', true), '')::json) ->> 'cf-ipcountry', '')));
  exception when others then
    c := '';
  end;
  if c !~ '^[A-Z]{2}$' or c in ('XX', 'T1') then
    c := 'ZZ';
  end if;
  return c;
end
$function$;

create or replace function public.bump_site_views()
 returns bigint
 language plpgsql
 volatile security definer
 set search_path to ''
as $function$
declare
  n bigint;
  c text := public.request_country();
  d date := (now() at time zone 'utc')::date;
  h smallint := extract(hour from (now() at time zone 'utc'))::smallint;
begin
  insert into public.site_stats (key, value, updated_at) values ('title_views', 1, now())
  on conflict (key) do update set value = public.site_stats.value + 1, updated_at = now()
  returning value into n;
  insert into public.site_views_daily (day, views) values (d, 1)
  on conflict (day) do update set views = public.site_views_daily.views + 1;
  insert into public.site_country_views (country, views, last_seen, first_seen) values (c, 1, now(), now())
  on conflict (country) do update set views = public.site_country_views.views + 1, last_seen = now();
  insert into public.site_country_daily (day, country, views) values (d, c, 1)
  on conflict (day, country) do update set views = public.site_country_daily.views + 1;
  insert into public.site_hour_views (hour, views) values (h, 1)
  on conflict (hour) do update set views = public.site_hour_views.views + 1;
  return n;
end
$function$;
grant execute on function public.bump_site_views() to anon, authenticated, service_role;

create or replace function public.get_site_views()
 returns bigint
 language sql
 stable security definer
 set search_path to ''
as $function$
  select coalesce((select s.value from public.site_stats s where s.key = 'title_views'), 0)
$function$;
grant execute on function public.get_site_views() to anon, authenticated, service_role;

create or replace function public.get_country_views()
 returns table (country text, views bigint, last_seen timestamptz)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select v.country::text, v.views, v.last_seen
  from public.site_country_views v
  order by v.views desc, v.country
$function$;
grant execute on function public.get_country_views() to anon, authenticated, service_role;

create or replace function public.get_country_firsts()
 returns table (country text, first_seen timestamptz)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select v.country::text, v.first_seen
  from public.site_country_views v
$function$;
grant execute on function public.get_country_firsts() to anon, authenticated, service_role;

create or replace function public.my_country()
 returns text
 language sql
 stable
 set search_path to ''
as $function$
  select public.request_country()
$function$;
grant execute on function public.my_country() to anon, authenticated, service_role;

create or replace function public.get_daily_views(n integer default 30)
 returns table (day date, views bigint)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select d::date as day, coalesce(v.views, 0)::bigint as views
  from generate_series(
    ((now() at time zone 'utc')::date - (greatest(1, least(coalesce(n, 30), 365)) - 1)),
    (now() at time zone 'utc')::date,
    interval '1 day'
  ) as d
  left join public.site_views_daily v on v.day = d::date
  order by d
$function$;
grant execute on function public.get_daily_views(integer) to anon, authenticated, service_role;

create or replace function public.get_country_daily(n integer default 30)
 returns table (day date, country text, views bigint)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select c.day, c.country::text, c.views
  from public.site_country_daily c
  where c.day > (now() at time zone 'utc')::date - greatest(1, least(coalesce(n, 30), 90))
  order by c.day, c.country
$function$;
grant execute on function public.get_country_daily(integer) to anon, authenticated, service_role;

create or replace function public.get_hour_views()
 returns table (hour integer, views bigint)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select h.hour::integer, h.views from public.site_hour_views h order by h.hour
$function$;
grant execute on function public.get_hour_views() to anon, authenticated, service_role;

create or replace function public.bump_site_view_device(p_device text)
 returns void
 language plpgsql
 volatile security definer
 set search_path to ''
as $function$
declare
  k text := case when lower(coalesce(p_device, '')) = 'mobile' then 'mobile' else 'desktop' end;
begin
  insert into public.site_device_daily (day, device, views) values ((now() at time zone 'utc')::date, k, 1)
  on conflict (day, device) do update set views = public.site_device_daily.views + 1;
end
$function$;
grant execute on function public.bump_site_view_device(text) to anon, authenticated, service_role;

create or replace function public.get_device_views(n integer default 30)
 returns table (day date, device text, views bigint)
 language sql
 stable security definer
 set search_path to ''
as $function$
  select d.day, d.device, d.views
  from public.site_device_daily d
  where d.day > (now() at time zone 'utc')::date - greatest(1, least(coalesce(n, 30), 365))
  order by d.day, d.device
$function$;
grant execute on function public.get_device_views(integer) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
