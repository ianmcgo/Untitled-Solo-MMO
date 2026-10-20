create or replace function public.rename_character(my_char uuid, new_name text) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; g bigint; cost bigint; nm text; old text;
begin
  c := game_private.my_char(my_char);
  if new_name is null or new_name !~ '^[A-Za-z]{2,12}$' then raise exception 'Names are 2 to 12 letters, no spaces'; end if;
  nm := upper(left(new_name, 1)) || lower(substr(new_name, 2));
  if lower(nm) = lower(c.name) then raise exception 'That is already your name'; end if;
  if exists (select 1 from public.characters where lower(name) = lower(nm)) then raise exception 'That name is taken'; end if;
  cost := coalesce((select v::bigint from game_private.config where k = 'rename_cost'), 10000);
  g := coalesce((c.data ->> 'gil')::bigint, 0);
  if g < cost then raise exception 'You need % crystals', cost; end if;
  old := c.name;
  perform set_config('game.server', '1', true);
  update public.characters set name = nm, data = jsonb_set(jsonb_set(data, '{name}', to_jsonb(nm)), '{gil}', to_jsonb(g - cost)), summary = jsonb_set(coalesce(summary, '{}'::jsonb), '{name}', to_jsonb(nm)) where id = my_char;
  update public.ls_members set char_name = nm where char_id = my_char;
  update public.ah_listings set seller_name = nm where seller = my_char and status = 'open' and kind = 'player';
  perform set_config('game.server', '0', true);
  insert into game_private.audit (char_id, char_name, owner, kind, detail) values (my_char, nm, c.owner, 'rename', old || ' -> ' || nm);
  return jsonb_build_object('name', nm, 'gil', g - cost);
end $$;
revoke all on function public.rename_character(uuid, text) from public, anon;
grant execute on function public.rename_character(uuid, text) to authenticated;

drop function if exists public.ah_post(uuid, text, int, bigint, int);
create or replace function public.ah_post(my_char uuid, item text, qty int, price bigint, st int, town text default null) returns jsonb
language plpgsql security definer set search_path = public, game_private as $$
declare c public.characters; inv jsonb; g bigint; fee bigint; n int; lid bigint; tw text;
begin
  c := game_private.my_char(my_char);
  if item is null or item !~ '^[a-z0-9_]{1,40}$' then raise exception 'Bad item'; end if;
  if qty is null or qty < 1 or qty > greatest(1, least(coalesce(st, 1), 999)) then raise exception 'You can list one stack at a time'; end if;
  if price is null or price < 1 or price > 99999999 then raise exception 'Set a price between 1 and 99,999,999'; end if;
  tw := case when town in (select id from game_private.ah_towns) then town else null end;
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
  insert into public.ah_listings (seller, seller_owner, seller_name, item, qty, st, price, town) values (my_char, auth.uid(), c.name, item, qty, greatest(1, least(coalesce(st, 1), 999)), price, tw) returning id into lid;
  return jsonb_build_object('id', lid, 'inventory', inv, 'gil', g, 'fee', fee);
end $$;
revoke all on function public.ah_post(uuid, text, int, bigint, int, text) from public, anon;
grant execute on function public.ah_post(uuid, text, int, bigint, int, text) to authenticated;

drop function if exists game_private.ah_town_pick(text);
create or replace function game_private.ah_town_pick(want text, tid text) returns public.ah_listings
language plpgsql as $$
declare l public.ah_listings;
begin
  select a.* into l from public.ah_listings a
    join game_private.ah_item_ref r on r.item = a.item
    left join game_private.ah_seller_sale s on s.k = game_private.ah_seller_key(a)
    where a.status = 'open' and a.kind = want and a.seller is not null and a.expires_at > now() and a.price <= ceil(r.price * a.qty * 1.25)
      and a.created_at <= now() - interval '20 minutes'
      and (want <> 'player' or a.town is null or a.town = tid)
    order by s.at asc nulls first, a.created_at asc, a.id asc
    limit 1 for update of a skip locked;
  return l;
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
      l := game_private.ah_town_pick('player', t.id);
      if l.id is null then l := game_private.ah_town_pick('merc', t.id); end if;
      exit when l.id is null;
      perform game_private.ah_town_buy(t, l);
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;
revoke all on function game_private.ah_town_pick(text, text), game_private.ah_town_tick() from public, anon, authenticated;

insert into game_private.config (k, v) values ('schema', '10') on conflict (k) do update set v = greatest(game_private.config.v::int, 10)::text;
