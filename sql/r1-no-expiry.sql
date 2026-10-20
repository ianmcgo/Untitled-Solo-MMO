alter table public.ah_listings alter column expires_at set default 'infinity';
update public.ah_listings set expires_at = 'infinity' where status = 'open' and kind = 'player';
select kind, count(*) as open_lots, min(expires_at) as soonest, max(expires_at) as latest from public.ah_listings where status = 'open' group by kind;
