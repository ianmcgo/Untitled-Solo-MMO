# Visitor tracker to the standard package (queued, Phase 5)

Source: visitor-tracker package (sql/visitor_tracking.sql, src/visitor-tracker.js/.css/.html, optional flag-font.css, NOTES.md). Standard backend: site_stats, site_views_daily, site_country_views, site_country_daily, site_hour_views, site_device_daily plus RPCs bump_site_views, get_site_views, get_country_views, get_country_firsts, my_country, get_daily_views, get_country_daily, get_hour_views, bump_site_view_device, get_device_views. Counts once per tab session per UTC day, country from cf-ipcountry, counters only.

Current game: ln_visit rows plus ln_* RPCs and leidanav_* RPCs (FreeSpace 4X Supabase project); client in net.js viewsTick and src/visitors.js (own globe, tiles, chart, list).

Plan:
1. Backend: run the standard SQL in the same Supabase project (safe to rerun); keep ln_* tables. Seed the standard tables from ln_visit and ln_device once (total, per day, per country with first_seen and last_seen, per hour, per device) so no history is lost. Use the Supabase tools, no keys in code.
2. Client: replace viewsTick and visitors.js internals with the package script, configured through VisitorTrackerConfig (getClient returns the game's sb client, storagePrefix, isActive pause on non-title screens, brand text for the share card, onSound mapped to the game sfx). Keep the title Visitors box and open on click via VisitorTracker.open.
3. Look: keep the game's blue window theme. Override package colors in the vg- and vc- CSS (cyan 7ff9ff, magenta da70d6, gold ffd24a, near black 05050f) with the game's variables; panel stays where the Visitors box is now (hide .vc-panel, call open from the box).
4. Size: package JS is 168 KB, CSS 27 KB, flag font 105 KB optional; check npm run check budget, lazy-load on first click if the budget is tight.
5. Remove old code (visitors.js, ln_* client calls); update Help, Updates, design.md; tests; version bump.
Decided: include the flag font and all package features. Done in 18.75.0 (see design.md).
