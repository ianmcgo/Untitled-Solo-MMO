alter table public.ah_listings add column if not exists kind text not null default 'player';
alter table public.ah_listings add column if not exists merc text;
alter table public.ah_listings add column if not exists merc_name text;
alter table public.ah_listings add column if not exists town text;
alter table public.ah_listings alter column seller drop not null;
alter table public.ah_listings alter column seller_owner drop not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'ah_listings_kind_chk') then
    alter table public.ah_listings add constraint ah_listings_kind_chk check (kind in ('player', 'merc', 'town'));
  end if;
end $$;
create index if not exists ah_listings_kind_open on public.ah_listings (kind, created_at) where status = 'open';

create table if not exists game_private.ah_item_ref (item text primary key, price bigint not null check (price > 0));
create table if not exists game_private.ah_towns (id text primary key, name text not null, last_buy timestamptz not null default now());
create table if not exists game_private.ah_seller_sale (k text primary key, at timestamptz not null);
create table if not exists game_private.ah_clock (id int primary key, at timestamptz not null);
revoke all on game_private.ah_item_ref, game_private.ah_towns, game_private.ah_seller_sale, game_private.ah_clock from public, anon, authenticated;

create or replace function game_private.ah_expire(cid uuid) returns void
language plpgsql as $$
declare l public.ah_listings;
begin
  for l in select * from public.ah_listings where seller = cid and kind = 'player' and status = 'open' and expires_at < now() for update loop
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
  select count(*) into n from public.ah_listings l where l.seller = my_char and l.kind = 'player' and l.status = 'open';
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
  insert into game_private.ah_box (char_id, kind, item, qty, st, note) values (my_char, 'bought', l.item, l.qty, l.st, coalesce(l.merc_name, l.seller_name));
  if l.seller is not null then
    insert into game_private.ah_box (char_id, kind, item, qty, gil, note) values (l.seller, 'sold', l.item, l.qty, l.price, case when l.kind = 'merc' then c.name || ' (' || coalesce(l.merc_name, 'a companion') || ')' else c.name end);
  end if;
  return jsonb_build_object('gil', g, 'item', l.item, 'qty', l.qty, 'price', l.price);
end $$;

create or replace function game_private.ah_seller_key(l public.ah_listings) returns text
language sql immutable as $$
  select case when l.kind = 'merc' then 'merc:' || l.seller || ':' || coalesce(l.merc, '') else 'player:' || l.seller end
$$;

create or replace function game_private.ah_town_pick(want text) returns public.ah_listings
language plpgsql as $$
declare l public.ah_listings;
begin
  select a.* into l from public.ah_listings a
    join game_private.ah_item_ref r on r.item = a.item
    left join game_private.ah_seller_sale s on s.k = game_private.ah_seller_key(a)
    where a.status = 'open' and a.kind = want and a.seller is not null and a.expires_at > now() and a.price <= ceil(r.price * a.qty * 1.25)
    order by s.at asc nulls first, a.created_at asc, a.id asc
    limit 1 for update of a skip locked;
  return l;
end $$;

create or replace function game_private.ah_town_buy(t game_private.ah_towns, l public.ah_listings) returns void
language plpgsql as $$
begin
  update public.ah_listings set status = 'sold', buyer = null, buyer_name = t.name, sold_at = now() where id = l.id;
  insert into game_private.ah_box (char_id, kind, item, qty, gil, note) values (l.seller, 'sold', l.item, l.qty, l.price, case when l.kind = 'merc' then t.name || ' (' || coalesce(l.merc_name, 'a companion') || ')' else t.name end);
  insert into game_private.ah_seller_sale (k, at) values (game_private.ah_seller_key(l), clock_timestamp()) on conflict (k) do update set at = excluded.at;
  if random() < 0.25 then
    insert into public.ah_listings (seller, seller_owner, seller_name, item, qty, st, price, kind, town, expires_at)
      values (null, null, t.name, l.item, l.qty, l.st, ceil(l.price * 1.03), 'town', t.id, 'infinity');
  end if;
end $$;

create or replace function game_private.ah_town_tick() returns int
language plpgsql as $$
declare t game_private.ah_towns; due int; steps int; s int; l public.ah_listings; n int := 0; lastrun timestamptz;
begin
  if not pg_try_advisory_xact_lock(hashtext('ah_town_tick')) then return 0; end if;
  select at into lastrun from game_private.ah_clock where id = 1;
  if lastrun is not null and lastrun > now() - interval '1 minute' then return 0; end if;
  insert into game_private.ah_clock (id, at) values (1, now()) on conflict (id) do update set at = excluded.at;
  for t in select * from game_private.ah_towns order by id loop
    due := floor(extract(epoch from now() - t.last_buy) / 1200)::int;
    if due <= 0 then continue; end if;
    update game_private.ah_towns set last_buy = last_buy + make_interval(secs => 1200 * due) where id = t.id;
    steps := least(36, due);
    for s in 1..steps loop
      l := game_private.ah_town_pick('player');
      if l.id is null then l := game_private.ah_town_pick('merc'); end if;
      exit when l.id is null;
      perform game_private.ah_town_buy(t, l);
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;

create or replace function public.ah_market() returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
begin
  if not public.is_member() then raise exception 'Not allowed'; end if;
  perform game_private.ah_town_tick();
  return (select coalesce(jsonb_agg(to_jsonb(x) order by x.price), '[]'::jsonb) from (
    select id, seller, seller_name, item, qty, price, expires_at, kind, merc_name, town from public.ah_listings
    where status = 'open' and expires_at > now() order by price limit 600) x);
end $$;

create or replace function public.ah_consign(my_char uuid, merc text, merc_name text) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; bag jsonb; keep jsonb := '[]'::jsonb; e jsonb; n int; room int; listed int := 0; gone int := 0; ref bigint; q int; nm text;
begin
  c := game_private.my_char(my_char);
  if merc is null or merc !~ '^[A-Za-z0-9_]{1,40}$' then raise exception 'Bad companion'; end if;
  nm := left(coalesce(nullif(btrim(merc_name), ''), 'Companion'), 24);
  bag := c.data -> 'mercInv' -> merc;
  if bag is null or jsonb_typeof(bag) <> 'array' then return jsonb_build_object('listed', 0, 'gone', 0, 'bag', '[]'::jsonb); end if;
  select count(*) into n from public.ah_listings l where l.seller = my_char and l.kind = 'merc' and l.status = 'open';
  room := greatest(0, 300 - n);
  for e in select value from jsonb_array_elements(bag) loop
    if (e -> 'sale') is distinct from 'true'::jsonb then keep := keep || jsonb_build_array(e); continue; end if;
    q := greatest(0, least(coalesce((e ->> 'qty')::int, 0), 999));
    if q = 0 then continue; end if;
    ref := null;
    select r.price into ref from game_private.ah_item_ref r where r.item = e ->> 'id';
    if ref is not null and room > 0 then
      insert into public.ah_listings (seller, seller_owner, seller_name, item, qty, st, price, kind, merc, merc_name, expires_at)
        values (my_char, auth.uid(), c.name, e ->> 'id', q, q, greatest(1, ref * q), 'merc', merc, nm, 'infinity');
      room := room - 1; listed := listed + q;
    else
      gone := gone + q;
    end if;
  end loop;
  perform set_config('game.server', '1', true);
  update public.characters set data = jsonb_set(data, array['mercInv', merc], keep) where id = my_char;
  perform set_config('game.server', '0', true);
  return jsonb_build_object('listed', listed, 'gone', gone, 'bag', keep);
end $$;

revoke all on function game_private.ah_seller_key(public.ah_listings), game_private.ah_town_pick(text), game_private.ah_town_buy(game_private.ah_towns, public.ah_listings), game_private.ah_town_tick() from public, anon, authenticated;
revoke all on function public.ah_market(), public.ah_consign(uuid, text, text), public.ah_post(uuid, text, int, bigint, int), public.ah_buy(uuid, bigint) from public, anon;
grant execute on function public.ah_market(), public.ah_consign(uuid, text, text), public.ah_post(uuid, text, int, bigint, int), public.ah_buy(uuid, bigint) to authenticated;

insert into game_private.config (k, v) values ('schema', '7') on conflict (k) do update set v = greatest(game_private.config.v::int, 7)::text;
