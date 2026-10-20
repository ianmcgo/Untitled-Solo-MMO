drop function if exists public.ah_buy(uuid, bigint);
create or replace function public.ah_buy(my_char uuid, lot bigint, here text default null) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; l public.ah_listings; g bigint;
begin
  c := game_private.my_char(my_char);
  select * into l from public.ah_listings where id = lot for update;
  if not found or l.status <> 'open' or l.expires_at < now() then raise exception 'That lot is no longer for sale'; end if;
  if l.seller = my_char then raise exception 'That is your own lot'; end if;
  if l.town is not null and here is not null and l.town <> here then raise exception 'That lot can only be bought in the city it is listed in'; end if;
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
revoke all on function public.ah_buy(uuid, bigint, text) from public, anon;
grant execute on function public.ah_buy(uuid, bigint, text) to authenticated;

drop function if exists public.ah_consign(uuid, text, text);
create or replace function public.ah_consign(my_char uuid, merc text, merc_name text, town text default null) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; tw text; bag jsonb; keep jsonb := '[]'::jsonb; e jsonb; n int; room int; listed int := 0; gone int := 0; ref bigint; q int; nm text;
begin
  c := game_private.my_char(my_char);
  if merc is null or merc !~ '^[A-Za-z0-9_]{1,40}$' then raise exception 'Bad companion'; end if;
  tw := case when town in (select id from game_private.ah_towns) then town else null end;
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
      insert into public.ah_listings (seller, seller_owner, seller_name, item, qty, st, price, kind, merc, merc_name, expires_at, town)
        values (my_char, auth.uid(), c.name, e ->> 'id', q, q, greatest(1, ref * q), 'merc', merc, nm, 'infinity', tw);
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
revoke all on function public.ah_consign(uuid, text, text, text) from public, anon;
grant execute on function public.ah_consign(uuid, text, text, text) to authenticated;

create or replace function game_private.ah_town_pick(want text, tid text) returns public.ah_listings
language plpgsql as $$
declare l public.ah_listings;
begin
  select a.* into l from public.ah_listings a
    join game_private.ah_item_ref r on r.item = a.item
    left join game_private.ah_seller_sale s on s.k = game_private.ah_seller_key(a)
    where a.status = 'open' and a.kind = want and a.seller is not null and a.expires_at > now() and a.price <= ceil(r.price * a.qty)
      and a.created_at <= now() - interval '20 minutes'
      and (want <> 'player' or a.town is null or a.town = tid)
    order by s.at asc nulls first, a.created_at asc, a.id asc
    limit 1 for update of a skip locked;
  return l;
end $$;
revoke all on function game_private.ah_town_pick(text, text) from public, anon, authenticated;

insert into game_private.config (k, v) values ('schema', '11') on conflict (k) do update set v = greatest(game_private.config.v::int, 11)::text;
