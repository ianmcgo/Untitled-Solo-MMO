# Notes

## What the visitor sees
- **Counter panel:** total visits with a counting animation, a status (LINKING, UPLINK, OFFLINE). Offline shows the last known number from the browser.
- **Globe (click the panel):** drag to rotate, scroll or pinch to zoom, tap pins or countries. Pins and arcs from your country, night mode, per-million mode, a moon with facts, sound toggle, and a replay of how visits grew by country.
- **OVERVIEW tab:** top origin, latest contact, your rank, farthest origin, visit streak, next-goal bars (visit goal and country goal with estimated arrival), world reach, coverage of 195 countries with a MISSING list, a continent bar (tap to filter), badges, and SAVE SHARE CARD.
- **TRENDS tab:** last 30 days, arrival hour (local time), weekday average, 365 day calendar, desktop vs mobile split, discovery timeline (first visit per country).
- **ORIGINS tab:** search, sort (visits, newest, recent, A to Z), continent filter, compare two countries, and a country card with a SHARE THIS COUNTRY button.
- **Share cards:** 1200x630 PNG, shown in a confirm pop-up with DOWNLOAD PNG / CANCEL. If a page blocks downloads (for example inside an iframe), the picture can be saved by right-click or long-press.

## How counting works
1. On load the script calls `bump_site_views` once per browser tab session per local day. After that it only calls `get_site_views` to refresh the number (every 3 minutes while visible).
2. `bump_site_views` adds 1 to: the total, today (UTC), the visitor's country (and that country's day row), and the UTC hour. It also records first-seen for new countries.
3. Right after a counted visit the script sends `bump_site_view_device` with `mobile` or `desktop` (mobile = touch only device: `(hover: none) and (pointer: coarse)`).
4. Country comes from the `cf-ipcountry` request header. Supabase puts its API behind Cloudflare, so this works on hosted Supabase. If the header is missing or unknown the visit is filed under `ZZ` (shown as "Unknown origin" with the moon).
5. The globe loads everything with `get_country_views`, `get_daily_views` (365), `get_country_firsts`, `get_country_daily` (60), `get_hour_views`, `get_device_views` (90), and `my_country`.

## What is stored (and not)
- Only counters: totals per country, per day, per hour, per device type. No IP address, no cookie, no user id, no page URL, no user agent.
- Browser storage on the visitor's device: the last count (to show when offline), the day already counted (session storage), the last tab used, the earned badges, milestone memory, and the sound setting. All keys start with your `storagePrefix`.
- Because nothing personal is stored this normally needs no consent banner, but check the rules that apply to you.

## Honest limits
- **A visit is a page load, not a unique person.** Reach percentages are upper limits. One person on two days counts twice.
- A browser tab session counts once per day; opening in a new tab or after clearing session storage can count again. Anyone can call the public functions and inflate the count; there is no bot filtering.
- Days are UTC. The "today" and weekday figures may differ from a local clock.
- Country population numbers in the code are rounded estimates and will go stale. Border and country lists are simplified (195 sovereign countries counted for coverage).
- Device split and the 365 day calendar start from when you ran the SQL; there is no history before that.
- The globe uses WebGL plus 2D canvases. It was tested in headless Chrome and normal browsers; I did not verify behaviour on very old browsers or with WebGL fully disabled.
- Supabase free projects can pause when unused; the panel will show OFFLINE until it wakes.

## Changing things
- **Look and colors:** edit `visitor-tracker.css`. The main colors are cyan `#7ff9ff`, magenta `#da70d6`, gold `#ffd24a` on near black `#05050f`; search and replace them.
- **Text:** most labels are in `visitor-tracker.html` and as strings in `visitor-tracker.js` (search for the label, for example `NEXT VISIT GOAL`).
- **Goals and badges:** `VG_MILE_TOTAL`, `VG_MILE_NATIONS`, and `VG_BADGES` in the JS.
- **Moon facts:** `VG_MOON_FACTS` in the JS.
- **Different backend:** provide a `getClient` returning an object with `rpc(name, args)` that returns `{ data, error }` for the same function names. The shapes are in the SQL file (see the `returns table (...)` lines). The demo page shows a complete mock.
- **Behind a different CDN or no Cloudflare:** change `request_country()` in the SQL to read the header your host provides (for example `x-vercel-ip-country`).
- **Content Security Policy:** needs `img-src blob: data:`, `font-src data:`, `connect-src` to your Supabase URL, and `script-src` for the script.
- **Size:** about 300 KB total uncompressed (about 100 KB gzipped). The flag font is optional; without it flags show as letters on Windows.

## Troubleshooting
- **Stays on LINKING / shows OFFLINE:** open the browser console. Usually the SQL was not run, `getClient` returns null, the anon key or URL is wrong, or the schema cache needs a refresh (the SQL ends with `notify pgrst, 'reload schema'`).
- **Count works, globe is empty:** `get_country_views` returned no rows, so nothing has been counted with a country yet. Visits made before running the SQL are not included.
- **Everything is "Unknown origin":** the `cf-ipcountry` header is not reaching the database function (see the CDN note above).
- **Devices box missing:** it stays hidden until the first device visits are counted.
- **Panel hidden behind your header:** raise `z-index` of `.vc-panel` and `.vg-overlay` in the CSS.

## Origin
Extracted from FreeSpace 4x v1.23.1 (Oct 12, 2026). The original game code keeps its own copy; changes there will not appear here.
