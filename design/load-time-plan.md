# Load time and zoning plan (drafted 2026-10-16, not yet built)

Baseline at v18.19.13: dist/index.html 6.37 MB, single file. Order: CSS, HTML, THREE bundle (full namespace), game scripts, audio JSON block (about 3.1 MB, does not compress). Boot: renderer, atlas (0.5 s low / 2.0 s high), effects, icon atlas, save and party, zone build in 28 ms slices, compileAsync (6 s cap). data.js runs heavy generation at parse time. localStorage is shared per github.io origin, so any cache must use IndexedDB.

Models: S = Sonnet, O = Opus.

| Phase | Model | Work |
|---|---|---|
| 0 Measure | S | performance.mark around every boot and zone-change step, /perf table, 4x CPU and slow 4G run, section size breakdown, list props placed off terrain. Output design/load-baseline.md |
| 1 Payload | S | named three imports (tree shaking), minify game JS, drop unused audio, shrink long tracks, load Supabase only for Play Online. Target 25 to 40% smaller |
| 2 Overlap | S | paint title first, run renderer, atlases, effects and shader warm-up in idle slices on menu screens, decode audio per need |
| 3 Cache | O | atlas, icon atlas and zone terrain bakes as WebP blobs in IndexedDB keyed by version, quality and cell size; createImageBitmap on return visits; paint fallback |
| 5 Smooth zone exit | O | see below |
| 5b Natural exits | S | see below |
| 4 Workers | O, optional | OffscreenCanvas painters only if Phase 0 still shows painting dominates after 3 |
| 6 Guard | S | size and boot-time check in release.sh, timings in Config > Interface, baseline updated each release |

Open decision: split build (long-cached vendor bundle and separate audio files, several files per release) versus single file. Single file would still ship for offline play.

## Phase 5: smooth zone exit
The loading screen stays. What changes is how it is reached.
1. On reaching a zone edge the game takes control: the character keeps walking out, companions follow, input and camera lock.
2. During that walk (1.5 to 2 s) the next zone's save, terrain, models and texture uploads run in about 4 ms slices per frame.
3. About 0.4 s into the walk the screen fades into the loading screen with an overlay that does not depend on the build.
4. If the build finished, the loading screen shows its minimum 0.45 s and fades out; otherwise it stays with the progress bar and keeps animating.
5. On arrival the new zone fades in with the character walking in from the matching exit, then control returns.
Doors, warp stones, ferries and boats keep their current fade. Guess to verify in Phase 0: the freeze comes from zone build, texture upload and shader compile starting on the same frame.

## Phase 5b: natural exits
- Floating rocks seen through exits: likely props scattered with a ground height from outside the exit. Place every prop on the exit's own ground height and drop any prop not near the surface. Phase 0 lists props by height above ground.
- Exits read as carved paths: winding path with varying width, sloped and broken rock walls blended into terrain with outcrops, scree, biome trees and shrubs; forest trail, desert wash, mountain pass by zone type. Keep hall length so Phase 5 timing holds. Check collision still matches.
- White void at the end of outside exits: the ground ends and fog colour shows. Replace with a distant tinted backdrop of the destination zone (layered ridges, silhouettes by biome) generated from its low-resolution terrain and cached by Phase 3, with ground continuing into fog.
- Unknown: how many zones share one exit generator and one fog backdrop.
