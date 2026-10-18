# Visitor Tracker + Origins Globe

A drop-in visit counter ("VISITOR LOG" panel) that opens a holographic globe showing where visitors come from. Extracted from FreeSpace 4x v1.23.1. No frameworks, no build step. Backend is Supabase (Postgres functions), and visits are stored by country only.

## What is in this zip

| Path | What it is |
| --- | --- |
| `sql/visitor_tracking.sql` | One file for the whole backend: tables, functions, permissions. Run once in the Supabase SQL editor. |
| `src/visitor-tracker.html` | The markup: the small counter panel and the full-screen globe overlay. |
| `src/visitor-tracker.css` | All styles (about 27 KB). Everything is prefixed `.vc-` or `.vg-`, so it will not touch your site. |
| `src/visitor-tracker.js` | All behaviour (about 168 KB, includes the world map data). One global: `VisitorTracker`. |
| `src/flag-font.css` | Optional. Embedded font that makes country flag emoji show on Windows (about 105 KB). |
| `demo/index.html` | A working demo with a fake backend. Open it through any local web server to see everything before wiring your own. |
| `NOTES.md` | How it works, data rules, limits, customization, troubleshooting. |

## Quick start (5 steps)

1. **Backend.** In your Supabase project, open SQL Editor and run `sql/visitor_tracking.sql`. It is safe to run twice.
2. **Copy files.** Put the three `src` files you need (`visitor-tracker.css`, `visitor-tracker.js`, and optionally `flag-font.css`) where your site serves static files.
3. **Markup.** Paste the contents of `src/visitor-tracker.html` into your page, right before `</body>`. Add the two stylesheet links in `<head>`:
   ```html
   <link rel="stylesheet" href="/flag-font.css">
   <link rel="stylesheet" href="/visitor-tracker.css">
   ```
4. **Configure and load the script** (after the markup, and after your Supabase client exists):
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script>
     const supabase = window.supabase.createClient('https://YOUR-PROJECT.supabase.co', 'YOUR-PUBLIC-ANON-KEY');
     window.VisitorTrackerConfig = {
       getClient: function () { return supabase; },
       storagePrefix: 'mysite',
       brand: { line1: 'MY SITE', line2: 'NAME', tagline: 'YOUR TAGLINE', url: 'mysite.com', note: 'Visit us today', file: 'mysite' }
     };
   </script>
   <script src="/visitor-tracker.js"></script>
   ```
5. **Test.** Reload the page. The panel at the bottom right should change from LINKING to UPLINK and show a count. Click it to open the globe.

Use the public anon key only (never the service key). The functions are `security definer` and the tables are locked, so the anon key can only call the listed functions.

## Configuration (`window.VisitorTrackerConfig`)

| Option | Default | Meaning |
| --- | --- | --- |
| `getClient` | `() => window.supabaseClient` | Returns your Supabase client (anything with `rpc(name, args)` that resolves to `{ data, error }`). |
| `storagePrefix` | `'vt'` | Prefix for the browser storage keys. Use a unique one per site. |
| `onSound` | none | Optional function called with a sound name (`vgopen`, `vgnew`, `vgmile`) so you can play your own sounds. |
| `isActive` | always true | Return false to pause the periodic count refresh while your counter is hidden (for example when another screen is showing). |
| `autoStart` | `true` | Count this visit automatically on load. |
| `brand` | placeholders | Text for the share card picture: `line1` (small gradient word), `line2` (large gold word), `tagline`, `url`, `note`, and `file` (download file name prefix). |

API: `VisitorTracker.open()`, `VisitorTracker.close()`, `VisitorTracker.count(true)` (force a refresh).

## Where to put the panel

The panel is `position: fixed` at the bottom right (see `.vc-panel` in the CSS). Change `right` and `bottom` there, or hide it and open the globe from your own button with `VisitorTracker.open()`. Edit the words in the HTML (for example "VISITOR LOG", "OPEN ORIGIN MAP", and the globe title "VISITOR ORIGINS · TERRA") freely.

See `NOTES.md` for details and limits.
