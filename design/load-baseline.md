# Load baseline (Phase 0, measured 2026-10-16 on v18.20.0 plus PERF marks)

Test rig: headless Chromium, software GL (SwiftShader), low quality, no CPU throttle. CPU-bound steps are representative; GPU upload and shader steps are exaggerated by software rendering. Re-run with `node perf0.js` style script (see "How to measure").

## Payload (v18.20.0)
| Part | Size |
|---|---|
| index.html | 6.39 MB |
| three bundle (full namespace) | 754 KB min |
| supabase bundle | 217 KB min |
| audio JSON (base64 mp3, 32 to 64 kbps mono) | 3,065 KB |
| game JS (unminified) | 2,066 KB |
Audio is 48% of the file. Every audio file is referenced in code; none can be dropped. mp3 base64 does not compress, so transfer size is roughly raw mp3 plus compressed JS.

## Boot (ms since navigation start)
Parse and DOMContentLoaded 338. Audio init done 1,048 (about 700 ms parsing the audio JSON and building the audio graph). Item icons done 4,073: **icons take about 3 s, the largest boot cost**. Renderer 4,359. Atlas and effects 4,785. HUD 4,802. Title shown 4,821.

## Zone load (ms, 8 zones)
| Zone | Build done | First draw done | Worst frame gap |
|---|---|---|---|
| outpost | 5,250 | 15,876 | 10,610 |
| residence | 2,473 | 7,734 | 5,262 |
| hollow | 8,013 | 15,816 | 7,712 |
| den | 4,772 | 13,579 | 8,829 |
| crypt | 4,458 | 15,223 | 10,737 |
| harbor | 8,013 | 17,759 | 9,692 |
| frost | 4,455 | 12,031 | 7,520 |
| marsh | 6,621 | 15,372 | 8,711 |
Per step, typical: Shaping the land 200 to 300 ms; **Painting the ground 1.9 to 3.0 s (largest build step, slices of 100 to 146 ms)**; Growing trees and grass 120 to 190 ms in one slice; buildings 12 to 185 ms; water up to 232 ms in one slice.

Findings
- The worst frame gap (the freeze) is 5 to 10 s and happens after the build is "done": the first `draw()` uploads every texture and compiles shaders in one call. This confirms the guess in the plan. In software GL it is exaggerated; on a real GPU it is smaller but still one long frame.
- Single slices of 100 to 230 ms (terrain painting, vegetation, water) exceed the 28 ms budget because the generators only yield between stages. Phases 2 and 5 should split these.
- compileAsync adds about 30 to 50 ms here (shaders are already compiled by the time it runs).

## Props above ground
Scan of instanced meshes against `field.heightAt` (more than 2.5 units above ground). Clean: residence, hollow, den, frost, marsh. Flagged: outpost 232 box instances up to 5 above (town walls and buildings, expected), harbor 188 box instances up to 5 (same), crypt 26 planes up to 5.3 and 114 geometry instances up to 2.9 near the zone edge (edge distance -2 to -8; check these for the floating rocks seen through exits). Floating rocks are not in instanced props on the open field zones, so Phase 5b needs a visual check of cliffs and backdrop meshes, not of props.

## How to measure
`/perf` in chat prints boot marks, per-step times of the last zone loads, and props above ground. PERF (view3d.js) holds the data: `PERF.report()`, `PERF.props()`. Scripted run: Playwright with test/mocklogin, call `enterZone(id, x, y)` per zone, wait for `VIEW.loading` false, read `PERF.report()`.

## Phase 1 result (v18.21.0)
Minified game JS and named three imports: 6.39 MB to 5.83 MB. The 25 to 40% target is not reachable without changing audio: audio is 3.07 MB and already low bitrate. Options (not done): move audio to separate cached files (split build), or lower bitrates of the eight music tracks (1.9 MB mp3).
