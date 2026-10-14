create extension if not exists pgcrypto;

create schema if not exists game_private;
revoke all on schema game_private from public, anon, authenticated;

create table if not exists game_private.config (k text primary key, v text not null);
revoke all on game_private.config from public, anon, authenticated;
insert into game_private.config (k, v) values ('level_cap', '20') on conflict (k) do nothing;
insert into game_private.config (k, v) values ('bag_size', '30') on conflict (k) do nothing;
insert into game_private.config (k, v) values ('schema', '5') on conflict (k) do update set v = greatest(game_private.config.v::int, 5)::text;

create table if not exists game_private.audit (id bigserial primary key, at timestamptz not null default now(), char_id uuid, char_name text, owner uuid, kind text not null, detail text);
create table if not exists game_private.trade_offers (me uuid primary key, peer uuid not null, mine jsonb not null, theirs jsonb not null, created_at timestamptz not null default now(), status text not null default 'open', result jsonb);
create table if not exists game_private.trade_log (id bigserial primary key, at timestamptz not null default now(), a uuid, b uuid, a_gave jsonb, b_gave jsonb);
revoke all on game_private.audit, game_private.trade_offers, game_private.trade_log from public, anon, authenticated;

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
  if exists (select 1 from public.players p where p.id = auth.uid() and p.banned) then raise exception 'This account has been banned.'; end if;
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
    'schema', (select v from game_private.config where k = 'schema'),
    'trades_7d', (select count(*) from game_private.trade_log where at > now() - interval '7 days'),
    'ah_open', (select count(*) from public.ah_listings where status = 'open'),
    'linkshells', (select count(*) from public.linkshells),
    'ah_sold_7d', (select count(*) from public.ah_listings where status = 'sold' and sold_at > now() - interval '7 days'),
    'audit', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select a.at, a.char_name, a.kind, a.detail, p.email from game_private.audit a left join public.players p on p.id = a.owner order by a.at desc limit 50) x),
    'banned_list', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select email from public.players where banned order by email limit 100) x),
    'online_list', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select email, last_seen from public.players where last_seen > now() - interval '5 minutes' order by last_seen desc limit 50) x),
    'recent', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (select c.name, c.summary ->> 'job' as job, c.summary ->> 'lv' as lv, c.summary ->> 'zone' as zone, p.email, c.updated_at from public.characters c left join public.players p on p.id = c.owner order by c.updated_at desc limit 50) x)
  ) into r;
  return r;
end $$;

revoke all on function public.join_game(text), public.touch_player(), public.admin_set_signup_code(text), public.admin_stats() from public, anon;
grant execute on function public.join_game(text), public.touch_player(), public.admin_set_signup_code(text), public.admin_stats(), public.is_admin(), public.is_member() to authenticated;
grant select, insert, update, delete on public.characters to authenticated;
grant select on public.players to authenticated;

create or replace function public.check_character_save() returns trigger
language plpgsql security definer set search_path = public, game_private as $$
declare cap int; bag int; og numeric; ng numeric; secs numeric; maxlv int; oldmax int; n int;
begin
  new.updated_at := now();
  if current_setting('game.server', true) = '1' then return new; end if;
  if new.owner <> old.owner then raise exception 'A character cannot change owner'; end if;
  if lower(new.name) <> lower(old.name) then raise exception 'A character cannot change name'; end if;
  select coalesce((select v::int from game_private.config where k = 'level_cap'), 20) into cap;
  select coalesce((select v::int from game_private.config where k = 'bag_size'), 30) into bag;
  select coalesce(max((x.value ->> 'lv')::int), 1) into maxlv from jsonb_each(case when jsonb_typeof(new.data -> 'jobs') = 'object' then new.data -> 'jobs' else '{}'::jsonb end) x;
  select coalesce(max((x.value ->> 'lv')::int), 1) into oldmax from jsonb_each(case when jsonb_typeof(old.data -> 'jobs') = 'object' then old.data -> 'jobs' else '{}'::jsonb end) x;
  if maxlv > cap then raise exception 'Level above the level cap'; end if;
  n := case when jsonb_typeof(new.data -> 'inventory') = 'array' then jsonb_array_length(new.data -> 'inventory') else 0 end;
  if n > 200 then raise exception 'Bag holds too many items'; end if;
  ng := coalesce((new.data ->> 'gil')::numeric, 0);
  og := coalesce((old.data ->> 'gil')::numeric, 0);
  if ng < 0 or ng > 999999999 then raise exception 'Crystal count out of range'; end if;
  secs := greatest(1, extract(epoch from now() - old.updated_at));
  if ng - og > 5000 + 200 * secs then
    insert into game_private.audit (char_id, char_name, owner, kind, detail) values (new.id, new.name, new.owner, 'crystals', 'gained ' || (ng - og) || ' crystals in ' || round(secs) || ' s');
  end if;
  if maxlv - oldmax > 3 then
    insert into game_private.audit (char_id, char_name, owner, kind, detail) values (new.id, new.name, new.owner, 'level', 'jumped from level ' || oldmax || ' to ' || maxlv);
  end if;
  if n > bag then
    insert into game_private.audit (char_id, char_name, owner, kind, detail) values (new.id, new.name, new.owner, 'bag', n || ' items in a ' || bag || '-slot bag');
  end if;
  return new;
end $$;
revoke all on function public.check_character_save() from public, anon, authenticated;
drop trigger if exists characters_check on public.characters;
create trigger characters_check before update on public.characters for each row execute function public.check_character_save();
create or replace function public.reject_offline_character() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if jsonb_typeof(new.data) = 'object' and (new.data ? 'offline') and coalesce(new.data ->> 'offline', 'false') <> 'false' then
    raise exception 'Offline characters can never be brought online';
  end if;
  return new;
end $$;
revoke all on function public.reject_offline_character() from public, anon, authenticated;
drop trigger if exists characters_no_offline on public.characters;
create trigger characters_no_offline before insert or update on public.characters for each row execute function public.reject_offline_character();

create or replace function game_private.offer_key(o jsonb) returns text
language sql immutable as $$
  select coalesce((select string_agg((e ->> 'id') || ':' || ((e ->> 'qty')::int)::text, ',' order by e ->> 'id', (e ->> 'qty')::int) from jsonb_array_elements(case when jsonb_typeof(o -> 'items') = 'array' then o -> 'items' else '[]'::jsonb end) e), '') || '|' || coalesce((o ->> 'gil')::bigint, 0)::text
$$;

create or replace function game_private.inv_take(inv jsonb, item text, n int) returns jsonb
language plpgsql as $$
declare arr jsonb := '[]'::jsonb; e jsonb; have int; rest int := n; i int; q int;
begin
  select coalesce(sum((x ->> 'qty')::int), 0) into have from jsonb_array_elements(inv) x where x ->> 'id' = item;
  if n is null or n <= 0 or have < n then raise exception 'Not enough % in the bag', item; end if;
  for i in reverse jsonb_array_length(inv) - 1 .. 0 loop
    e := inv -> i;
    if rest > 0 and e ->> 'id' = item then
      q := (e ->> 'qty')::int;
      if q <= rest then rest := rest - q; e := null;
      else e := jsonb_set(e, '{qty}', to_jsonb(q - rest)); rest := 0; end if;
    end if;
    if e is not null then arr := jsonb_build_array(e) || arr; end if;
  end loop;
  return arr;
end $$;

create or replace function game_private.inv_give(inv jsonb, item text, n int, st int) returns jsonb
language plpgsql as $$
declare res jsonb := '[]'::jsonb; e jsonb; q int; add int; rest int := n; i int; cap int := greatest(1, least(coalesce(st, 1), 999));
begin
  if n is null or n <= 0 then raise exception 'Bad item count'; end if;
  for i in 0 .. jsonb_array_length(inv) - 1 loop
    e := inv -> i;
    if rest > 0 and e ->> 'id' = item and (e ->> 'qty')::int < cap then
      q := (e ->> 'qty')::int; add := least(cap - q, rest);
      e := jsonb_set(e, '{qty}', to_jsonb(q + add)); rest := rest - add;
    end if;
    res := res || jsonb_build_array(e);
  end loop;
  while rest > 0 loop
    add := least(cap, rest);
    res := res || jsonb_build_array(jsonb_build_object('id', item, 'qty', add));
    rest := rest - add;
  end loop;
  return res;
end $$;

create or replace function public.trade_offer(my_char uuid, peer_char uuid, mine jsonb, theirs jsonb) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare a public.characters; b public.characters; po game_private.trade_offers; bag int; ainv jsonb; binv jsonb; e jsonb; ag bigint; bg bigint; agive bigint; bgive bigint;
begin
  if not public.is_member() then raise exception 'Not allowed'; end if;
  if my_char = peer_char then raise exception 'Not allowed'; end if;
  if not exists (select 1 from public.characters where id = my_char and owner = auth.uid()) then raise exception 'Not your character'; end if;
  if jsonb_typeof(mine -> 'items') <> 'array' or jsonb_typeof(theirs -> 'items') <> 'array' then raise exception 'Bad offer'; end if;
  if jsonb_array_length(mine -> 'items') > 8 or jsonb_array_length(theirs -> 'items') > 8 then raise exception 'Too many items in the trade'; end if;
  if coalesce((mine ->> 'gil')::bigint, 0) < 0 or coalesce((theirs ->> 'gil')::bigint, 0) < 0 then raise exception 'Bad offer'; end if;
  perform pg_advisory_xact_lock(hashtext(least(my_char::text, peer_char::text) || greatest(my_char::text, peer_char::text)));
  delete from game_private.trade_offers where created_at < now() - interval '10 minutes';
  insert into game_private.trade_offers (me, peer, mine, theirs, created_at, status, result) values (my_char, peer_char, mine, theirs, now(), 'open', null)
    on conflict (me) do update set peer = excluded.peer, mine = excluded.mine, theirs = excluded.theirs, created_at = now(), status = 'open', result = null;
  select * into po from game_private.trade_offers where me = peer_char and peer = my_char and status = 'open' and created_at > now() - interval '60 seconds';
  if not found then return jsonb_build_object('status', 'pending'); end if;
  if game_private.offer_key(po.mine) <> game_private.offer_key(theirs) or game_private.offer_key(po.theirs) <> game_private.offer_key(mine) then return jsonb_build_object('status', 'mismatch'); end if;
  select * into a from public.characters where id = my_char for update;
  select * into b from public.characters where id = peer_char for update;
  if b.id is null then raise exception 'The other character no longer exists'; end if;
  select coalesce((select v::int from game_private.config where k = 'bag_size'), 30) into bag;
  ainv := case when jsonb_typeof(a.data -> 'inventory') = 'array' then a.data -> 'inventory' else '[]'::jsonb end;
  binv := case when jsonb_typeof(b.data -> 'inventory') = 'array' then b.data -> 'inventory' else '[]'::jsonb end;
  for e in select * from jsonb_array_elements(mine -> 'items') loop
    ainv := game_private.inv_take(ainv, e ->> 'id', (e ->> 'qty')::int);
    binv := game_private.inv_give(binv, e ->> 'id', (e ->> 'qty')::int, (e ->> 'st')::int);
  end loop;
  for e in select * from jsonb_array_elements(po.mine -> 'items') loop
    binv := game_private.inv_take(binv, e ->> 'id', (e ->> 'qty')::int);
    ainv := game_private.inv_give(ainv, e ->> 'id', (e ->> 'qty')::int, (e ->> 'st')::int);
  end loop;
  ag := coalesce((a.data ->> 'gil')::bigint, 0); bg := coalesce((b.data ->> 'gil')::bigint, 0);
  agive := coalesce((mine ->> 'gil')::bigint, 0); bgive := coalesce((po.mine ->> 'gil')::bigint, 0);
  if ag < agive or bg < bgive then raise exception 'Not enough crystals for the trade'; end if;
  ag := ag - agive + bgive; bg := bg - bgive + agive;
  if jsonb_array_length(ainv) > bag or jsonb_array_length(binv) > bag then raise exception 'Not enough room in a bag for the trade'; end if;
  perform set_config('game.server', '1', true);
  update public.characters set data = jsonb_set(jsonb_set(data, '{inventory}', ainv), '{gil}', to_jsonb(ag)) where id = a.id;
  update public.characters set data = jsonb_set(jsonb_set(data, '{inventory}', binv), '{gil}', to_jsonb(bg)) where id = b.id;
  perform set_config('game.server', '0', true);
  update game_private.trade_offers set status = 'done', result = jsonb_build_object('inventory', binv, 'gil', bg) where me = peer_char;
  delete from game_private.trade_offers where me = my_char;
  insert into game_private.trade_log (a, b, a_gave, b_gave) values (a.id, b.id, mine, po.mine);
  return jsonb_build_object('status', 'done', 'inventory', ainv, 'gil', ag);
end $$;

create or replace function public.trade_status(my_char uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare o game_private.trade_offers;
begin
  if not exists (select 1 from public.characters where id = my_char and owner = auth.uid()) then raise exception 'Not your character'; end if;
  select * into o from game_private.trade_offers where me = my_char;
  if not found then return jsonb_build_object('status', 'none'); end if;
  if o.status = 'done' then delete from game_private.trade_offers where me = my_char; return jsonb_build_object('status', 'done') || o.result; end if;
  return jsonb_build_object('status', 'pending');
end $$;

create or replace function public.trade_cancel(my_char uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare o game_private.trade_offers;
begin
  if not exists (select 1 from public.characters where id = my_char and owner = auth.uid()) then raise exception 'Not your character'; end if;
  select * into o from game_private.trade_offers where me = my_char for update;
  if not found then return jsonb_build_object('status', 'none'); end if;
  delete from game_private.trade_offers where me = my_char;
  if o.status = 'done' then return jsonb_build_object('status', 'done') || o.result; end if;
  return jsonb_build_object('status', 'cancelled');
end $$;

create or replace function public.admin_set_ban(target text, ban boolean) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.players set banned = ban
    where (lower(email) = lower(target) or id in (select owner from public.characters where lower(name) = lower(target)))
      and lower(coalesce(email, '')) <> 'ianmcgon@gmail.com';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.trade_offer(uuid, uuid, jsonb, jsonb), public.trade_status(uuid), public.trade_cancel(uuid), public.admin_set_ban(text, boolean) from public, anon;
grant execute on function public.trade_offer(uuid, uuid, jsonb, jsonb), public.trade_status(uuid), public.trade_cancel(uuid), public.admin_set_ban(text, boolean) to authenticated;

create table if not exists public.ah_listings (
  id bigserial primary key,
  seller uuid not null references public.characters(id) on delete cascade,
  seller_owner uuid not null,
  seller_name text not null,
  item text not null,
  qty int not null check (qty > 0),
  st int not null default 1,
  price bigint not null check (price > 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  status text not null default 'open',
  buyer uuid,
  buyer_name text,
  sold_at timestamptz
);
create index if not exists ah_listings_open on public.ah_listings (item, price) where status = 'open';
create index if not exists ah_listings_seller on public.ah_listings (seller, status);
alter table public.ah_listings enable row level security;
drop policy if exists ah_select on public.ah_listings;
create policy ah_select on public.ah_listings for select using (public.is_member() and (status = 'open' or seller_owner = auth.uid()));
revoke all on public.ah_listings from anon;
grant select on public.ah_listings to authenticated;

create table if not exists game_private.ah_box (id bigserial primary key, char_id uuid not null, kind text not null, item text, qty int not null default 0, st int not null default 1, gil bigint not null default 0, note text, created_at timestamptz not null default now());
create index if not exists ah_box_char on game_private.ah_box (char_id);
revoke all on game_private.ah_box from public, anon, authenticated;

create or replace function game_private.char_save(cid uuid, inv jsonb, g bigint) returns void
language plpgsql as $$
begin
  perform set_config('game.server', '1', true);
  update public.characters set data = jsonb_set(jsonb_set(data, '{inventory}', inv), '{gil}', to_jsonb(g)) where id = cid;
  perform set_config('game.server', '0', true);
end $$;

create or replace function game_private.my_char(cid uuid) returns public.characters
language plpgsql as $$
declare c public.characters;
begin
  if not public.is_member() then raise exception 'Not allowed'; end if;
  select * into c from public.characters where id = cid and owner = auth.uid() for update;
  if not found then raise exception 'Not your character'; end if;
  return c;
end $$;

create or replace function game_private.ah_expire(cid uuid) returns void
language plpgsql as $$
declare l public.ah_listings;
begin
  for l in select * from public.ah_listings where seller = cid and status = 'open' and expires_at < now() for update loop
    update public.ah_listings set status = 'expired' where id = l.id;
    insert into game_private.ah_box (char_id, kind, item, qty, st, note) values (cid, 'returned', l.item, l.qty, l.st, 'Unsold');
  end loop;
end $$;

create or replace function public.ah_post(my_char uuid, item text, qty int, price bigint, st int) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; inv jsonb; g bigint; fee bigint; n int; lid bigint;
begin
  c := game_private.my_char(my_char);
  if item is null or item !~ '^[a-z0-9_]{1,40}$' then raise exception 'Bad item'; end if;
  if qty is null or qty < 1 or qty > greatest(1, least(coalesce(st, 1), 999)) then raise exception 'You can list one stack at a time'; end if;
  if price is null or price < 1 or price > 99999999 then raise exception 'Set a price between 1 and 99,999,999'; end if;
  perform game_private.ah_expire(my_char);
  select count(*) into n from public.ah_listings where seller = my_char and status = 'open';
  if n >= 10 then raise exception 'You can have 10 lots up with other players at once'; end if;
  fee := greatest(1, ceil(price * 0.03));
  inv := case when jsonb_typeof(c.data -> 'inventory') = 'array' then c.data -> 'inventory' else '[]'::jsonb end;
  g := coalesce((c.data ->> 'gil')::bigint, 0);
  if g < fee then raise exception 'The listing fee is % crystals', fee; end if;
  inv := game_private.inv_take(inv, item, qty);
  g := g - fee;
  perform game_private.char_save(my_char, inv, g);
  insert into public.ah_listings (seller, seller_owner, seller_name, item, qty, st, price) values (my_char, auth.uid(), c.name, item, qty, greatest(1, least(coalesce(st, 1), 999)), price) returning id into lid;
  return jsonb_build_object('id', lid, 'inventory', inv, 'gil', g, 'fee', fee);
end $$;

create or replace function public.ah_buy(my_char uuid, lot bigint) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; l public.ah_listings; g bigint;
begin
  c := game_private.my_char(my_char);
  select * into l from public.ah_listings where id = lot for update;
  if not found or l.status <> 'open' or l.expires_at < now() then raise exception 'That lot is no longer for sale'; end if;
  if l.seller = my_char then raise exception 'That is your own lot'; end if;
  g := coalesce((c.data ->> 'gil')::bigint, 0);
  if g < l.price then raise exception 'You need % crystals', l.price; end if;
  g := g - l.price;
  perform game_private.char_save(my_char, case when jsonb_typeof(c.data -> 'inventory') = 'array' then c.data -> 'inventory' else '[]'::jsonb end, g);
  update public.ah_listings set status = 'sold', buyer = my_char, buyer_name = c.name, sold_at = now() where id = lot;
  insert into game_private.ah_box (char_id, kind, item, qty, st, note) values (my_char, 'bought', l.item, l.qty, l.st, l.seller_name);
  insert into game_private.ah_box (char_id, kind, item, qty, gil, note) values (l.seller, 'sold', l.item, l.qty, l.price, c.name);
  return jsonb_build_object('gil', g, 'item', l.item, 'qty', l.qty, 'price', l.price);
end $$;

create or replace function public.ah_cancel(my_char uuid, lot bigint) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; l public.ah_listings;
begin
  c := game_private.my_char(my_char);
  select * into l from public.ah_listings where id = lot and seller = my_char for update;
  if not found or l.status <> 'open' then raise exception 'That lot is no longer up'; end if;
  update public.ah_listings set status = 'cancelled' where id = lot;
  insert into game_private.ah_box (char_id, kind, item, qty, st, note) values (my_char, 'returned', l.item, l.qty, l.st, 'Withdrawn');
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.ah_box_list(my_char uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters;
begin
  c := game_private.my_char(my_char);
  perform game_private.ah_expire(my_char);
  return (select coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'kind', b.kind, 'item', b.item, 'qty', b.qty, 'gil', b.gil, 'note', b.note, 'at', b.created_at) order by b.id), '[]'::jsonb) from game_private.ah_box b where b.char_id = my_char);
end $$;

create or replace function public.ah_collect(my_char uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; inv jsonb; nxt jsonb; g bigint; b game_private.ah_box; bag int; got int := 0; left_ int := 0;
begin
  c := game_private.my_char(my_char);
  perform game_private.ah_expire(my_char);
  select coalesce((select v::int from game_private.config where k = 'bag_size'), 30) into bag;
  inv := case when jsonb_typeof(c.data -> 'inventory') = 'array' then c.data -> 'inventory' else '[]'::jsonb end;
  g := coalesce((c.data ->> 'gil')::bigint, 0);
  for b in select * from game_private.ah_box where char_id = my_char order by id for update loop
    if b.kind = 'sold' then
      g := least(999999999, g + b.gil); got := got + 1;
      delete from game_private.ah_box where id = b.id;
    else
      nxt := game_private.inv_give(inv, b.item, b.qty, b.st);
      if jsonb_array_length(nxt) > bag then left_ := left_ + 1;
      else inv := nxt; got := got + 1; delete from game_private.ah_box where id = b.id; end if;
    end if;
  end loop;
  if got > 0 then perform game_private.char_save(my_char, inv, g); end if;
  return jsonb_build_object('inventory', inv, 'gil', g, 'got', got, 'left', left_);
end $$;

create or replace function public.ah_history(item text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (select l.price, l.qty, l.sold_at, l.seller_name, l.buyer_name from public.ah_listings l where l.item = ah_history.item and l.status = 'sold' order by l.sold_at desc limit 10) x
$$;

revoke all on function public.ah_post(uuid, text, int, bigint, int), public.ah_buy(uuid, bigint), public.ah_cancel(uuid, bigint), public.ah_box_list(uuid), public.ah_collect(uuid), public.ah_history(text) from public, anon;
grant execute on function public.ah_post(uuid, text, int, bigint, int), public.ah_buy(uuid, bigint), public.ah_cancel(uuid, bigint), public.ah_box_list(uuid), public.ah_collect(uuid), public.ah_history(text) to authenticated;

create table if not exists public.linkshells (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 16 and name ~ '^[A-Za-z][A-Za-z ]*[A-Za-z]$'),
  color text not null default '#7fd3ff' check (color ~ '^#[0-9a-fA-F]{6}$'),
  owner_char uuid references public.characters(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists linkshells_name on public.linkshells (lower(name));
alter table public.linkshells enable row level security;
revoke all on public.linkshells from anon, authenticated;

create table if not exists public.ls_members (
  ls_id uuid not null references public.linkshells(id) on delete cascade,
  char_id uuid not null references public.characters(id) on delete cascade,
  char_name text not null,
  rank text not null default 'pearl' check (rank in ('leader', 'sack', 'pearl')),
  joined_at timestamptz not null default now(),
  primary key (ls_id, char_id)
);
create index if not exists ls_members_char on public.ls_members (char_id);
alter table public.ls_members enable row level security;
revoke all on public.ls_members from anon, authenticated;

create table if not exists game_private.ls_invites (ls_id uuid not null, char_name text not null, by_name text, expires_at timestamptz not null, primary key (ls_id, char_name));
revoke all on game_private.ls_invites from public, anon, authenticated;

create or replace function game_private.ls_rank_of(lsid uuid, cid uuid) returns text
language sql stable as $$ select rank from public.ls_members where ls_id = lsid and char_id = cid $$;

create or replace function public.ls_mine(my_char uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
begin
  perform game_private.my_char(my_char);
  return (select coalesce(jsonb_agg(jsonb_build_object('id', l.id, 'name', l.name, 'color', l.color, 'rank', m.rank,
    'members', (select coalesce(jsonb_agg(jsonb_build_object('name', x.char_name, 'rank', x.rank) order by case x.rank when 'leader' then 0 when 'sack' then 1 else 2 end, x.char_name), '[]'::jsonb) from public.ls_members x where x.ls_id = l.id)
  ) order by m.joined_at), '[]'::jsonb) from public.ls_members m join public.linkshells l on l.id = m.ls_id where m.char_id = my_char);
end $$;

create or replace function public.ls_create(my_char uuid, name text, color text) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; g bigint; lid uuid;
begin
  c := game_private.my_char(my_char);
  if (select count(*) from public.ls_members where char_id = my_char) >= 3 then raise exception 'You can be in up to 3 linkshells'; end if;
  if exists (select 1 from public.linkshells where lower(linkshells.name) = lower(ls_create.name)) then raise exception 'That linkshell name is taken'; end if;
  g := coalesce((c.data ->> 'gil')::bigint, 0);
  if g < 500 then raise exception 'A new linkshell costs 500 crystals'; end if;
  g := g - 500;
  perform game_private.char_save(my_char, case when jsonb_typeof(c.data -> 'inventory') = 'array' then c.data -> 'inventory' else '[]'::jsonb end, g);
  insert into public.linkshells (name, color, owner_char) values (trim(ls_create.name), coalesce(color, '#7fd3ff'), my_char) returning id into lid;
  insert into public.ls_members (ls_id, char_id, char_name, rank) values (lid, my_char, c.name, 'leader');
  return jsonb_build_object('id', lid, 'gil', g);
end $$;

create or replace function public.ls_invite(my_char uuid, ls uuid, target text) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; t public.characters; r text;
begin
  c := game_private.my_char(my_char);
  r := game_private.ls_rank_of(ls, my_char);
  if r is null or r = 'pearl' then raise exception 'Only the leader or a sack holder can invite'; end if;
  select * into t from public.characters where lower(characters.name) = lower(target);
  if not found then raise exception 'Nobody is called %', target; end if;
  if exists (select 1 from public.ls_members where ls_id = ls and char_id = t.id) then raise exception '% is already in this linkshell', t.name; end if;
  if (select count(*) from public.ls_members where ls_id = ls) >= 100 then raise exception 'This linkshell is full'; end if;
  insert into game_private.ls_invites (ls_id, char_name, by_name, expires_at) values (ls, lower(t.name), c.name, now() + interval '10 minutes')
    on conflict (ls_id, char_name) do update set by_name = excluded.by_name, expires_at = excluded.expires_at;
  return jsonb_build_object('name', t.name, 'ls', (select name from public.linkshells where id = ls));
end $$;

create or replace function public.ls_join(my_char uuid, ls uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters;
begin
  c := game_private.my_char(my_char);
  if not exists (select 1 from game_private.ls_invites where ls_id = ls and char_name = lower(c.name) and expires_at > now()) then raise exception 'That invitation has expired'; end if;
  if (select count(*) from public.ls_members where char_id = my_char) >= 3 then raise exception 'You can be in up to 3 linkshells'; end if;
  insert into public.ls_members (ls_id, char_id, char_name) values (ls, my_char, c.name) on conflict do nothing;
  delete from game_private.ls_invites where ls_id = ls and char_name = lower(c.name);
  return public.ls_mine(my_char);
end $$;

create or replace function public.ls_leave(my_char uuid, ls uuid) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare r text; nxt uuid;
begin
  perform game_private.my_char(my_char);
  r := game_private.ls_rank_of(ls, my_char);
  if r is null then raise exception 'You are not in that linkshell'; end if;
  delete from public.ls_members where ls_id = ls and char_id = my_char;
  if r = 'leader' then
    select char_id into nxt from public.ls_members where ls_id = ls order by case rank when 'sack' then 0 else 1 end, joined_at limit 1;
    if nxt is null then delete from public.linkshells where id = ls;
    else update public.ls_members set rank = 'leader' where ls_id = ls and char_id = nxt; end if;
  end if;
  return public.ls_mine(my_char);
end $$;

create or replace function public.ls_set(my_char uuid, ls uuid, target text, action text) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare r text; tr text; tid uuid;
begin
  perform game_private.my_char(my_char);
  r := game_private.ls_rank_of(ls, my_char);
  select char_id, rank into tid, tr from public.ls_members where ls_id = ls and lower(char_name) = lower(target);
  if tid is null then raise exception 'Nobody called % is in this linkshell', target; end if;
  if tid = my_char then raise exception 'Use Leave for yourself'; end if;
  if action = 'kick' then
    if r is null or r = 'pearl' or tr = 'leader' or (r = 'sack' and tr <> 'pearl') then raise exception 'You can''t remove that member'; end if;
    delete from public.ls_members where ls_id = ls and char_id = tid;
  elsif action in ('sack', 'pearl') then
    if r is distinct from 'leader' then raise exception 'Only the leader can change ranks'; end if;
    update public.ls_members set rank = action where ls_id = ls and char_id = tid;
  elsif action = 'leader' then
    if r is distinct from 'leader' then raise exception 'Only the leader can hand over the linkshell'; end if;
    update public.ls_members set rank = 'sack' where ls_id = ls and char_id = my_char;
    update public.ls_members set rank = 'leader' where ls_id = ls and char_id = tid;
  else raise exception 'Unknown action'; end if;
  return public.ls_mine(my_char);
end $$;

revoke all on function public.ls_mine(uuid), public.ls_create(uuid, text, text), public.ls_invite(uuid, uuid, text), public.ls_join(uuid, uuid), public.ls_leave(uuid, uuid), public.ls_set(uuid, uuid, text, text) from public, anon;
grant execute on function public.ls_mine(uuid), public.ls_create(uuid, text, text), public.ls_invite(uuid, uuid, text), public.ls_join(uuid, uuid), public.ls_leave(uuid, uuid), public.ls_set(uuid, uuid, text, text) to authenticated;
