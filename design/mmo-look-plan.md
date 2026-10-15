# Track 6: Classic look (phases 116–127)

Goal: make models look like an early-2000s online RPG: painted textures, soft flat lighting, chunky silhouettes, thick hair, iconic job gear. Original art only. Same rules as model-plan.md: one phase per version, Help + Updates, design notes, build, tests, push, index.html delivered. Keep Low/Medium/High tiers and check Low on phones.

User decisions (2026-10-15): Classic is the default look and Modern stays as a setting. Real outline pass, not just painted seams. Texture scaling: crisp up close (nearest magnification), smooth at a distance (mipmaps).

Version numbers: Track 6 took 16.2.0–16.5.0, so the remaining Track 5 phases move to the next free minor (113 → 16.6.0 or later).

## Phases
| Phase | Ver | Name | Scope | Model |
|---|---|---|---|---|
| 116 ✅ | 16.2.0 | Classic shading | Lambert material with light bands, a fixed metal shine, an outline pass and a Look setting | Sonnet |
| 117 ✅ | 16.3.0 | Painted atlas | Hand-painted region painters, 256 px cells on every tier, nearest magnification | Opus |
| 118 ✅ | 16.4.0 | Chunky humans | Lower segment counts, mitten hands, bigger hands and feet, cuffs, collars, boot flares | Opus |
| 119 ✅ | 16.5.0 | Chunky hair | 12–14 thick clumps per style, fuller shell, smooth shading on skin and faces | Opus |
| 120 ✅ | 16.6.0 | Face finish | 3-tone face shading, ink eyelid line, cleaner ears per race | Sonnet |
| 121 | | Iconic gear sets | 3–4 tiered looks per job for all 22 jobs (WAR horned helm, BLM pointed hat, RDM feather hat, DRG winged helm…), oversized shoulders, cuffs, boots | Opus |
| 122 | | Weapons and shields | Chunkier weapons, bolder guards and heads, painted crests; match the item icons | Sonnet |
| 123 | | Bold monsters | Families as chunky painted shapes recoloured per tier; NMs get extra parts | Opus |
| 124 | | NPCs and townsfolk | Outfits coded by race, job and district | Sonnet |
| 125 | | World match | Terrain, trees, props, sky and fog in the same painted style; bloom off in Classic | Sonnet |
| 126 | | Classic effects | Bold sprite and ring spell effects, painted numbers | Sonnet |
| 127 | | Polish | Performance on all tiers, real-phone check, contact sheets, remove dead PBR paths | Sonnet |

## Phase 116: Classic shading (v16.2.0)
- Settings `look` ("classic" by default, or "modern") and `outline` (null = automatic, which means on unless the quality is Low; true or false when the player sets it). They are in SETTINGS_DEFAULT. Config → Graphics has Classic look, Modern look and Outlines buttons, which use action `gfx` with `key:value`. Any change saves and reloads. `classicOn()` and `outlineOn()` are in rig.js next to RIM.
- `charMaterial()` returns `classicCharMaterial()` in Classic. It is a MeshLambertMaterial (atlas map, vertex colours, double-sided; scene.environment still lights it as soft ambient). A fragment patch before `opaque_fragment` does three things:
  - takes the lit/albedo ratio and blends it 50% toward 3 bands;
  - applies a floor of `CLASSIC.lift` × albedo (0.13 at night, 0.26 by day, 0.2 in caves; set in updateSky);
  - adds a fixed view-space shine on metal (blue channel of the atlas mr map × `CLASSIC.metal`).
- `shellMaterial()` (fur shells) uses Lambert in Classic, with cache key furShellC.
- `outlineMaterial()` is a shared MeshBasicMaterial (BackSide, colour 0x140c1c). Its vertex shader pushes skinned vertices along objectNormal by 0.004 + 0.0009 × view distance. `instantiate()` adds a second SkinnedMesh (same geometry, skeleton and bind matrix) as a child of the main mesh when `outlineOn()` is true and `meta.noOutline` is not set. Being a child, it hides with the main mesh on LOD swaps, so far LODs have no outline. Cost: one extra draw per character.
- In Classic, bloom strength is 0.1 (was 0.22) and grade saturation is +0.1.
- Fix: main4 `create()` skips `netCreateChar` in offline play. Before this, offline characters could not be created.

## Phase 117: Painted atlas (v16.3.0)
- `CLASSIC_PAINT` (rig.js, before buildAtlas) overrides REGION_PAINT painters in Classic:
  - `PST(x, n)` posterises a value to n tones.
  - Painters write only albedo (o[0]). Height is 0, so the normal map is flat; Classic does not use it.
  - Metal keeps o[3] for the shine.
- Shapes per region, with periods kept integer in u so wraps stay seamless:
  - cloth: painted folds (sine on u × 5 + noise) in 3 tones, crease ink, darker hem band, ink line, dashed stitch;
  - leather: 3-tone panels, bright edge, ink seam, stitch dashes;
  - metal: 4-tone cosine band along v, a bright wavy highlight at v 0.3, a dark line at 0.74, bevelled edge, rivets;
  - hair: 11 clumps across u with ink separations and a shine band;
  - fur: V tufts;
  - scales: 4-tone rings;
  - feathers, wood grain, bone cracks, chain, quilt diamonds;
  - skin: nearly flat, 3-tone blotches at ±0.05;
  - face base: flat 0.86.
- Classic forces ATLAS_CELL 256 on every tier and sets `RIG.atlas.map.magFilter = NearestFilter`; mipmaps stay linear.

## Phase 118: Chunky humans (v16.4.0)
- buildAtlas sets `RIG.segK` in Classic: high 0.55, medium 0.45, low 0.38 (Modern 1). All g* helpers scale segments through sgK, so monsters and weapons get lighter too. The LOD entry uses `min(0.5, segK × 0.65)`.
- humanEntry `CH = classicOn()`:
  - hand scale hk × 1.18;
  - fingers replaced by a two-ball mitten on the `fingers` bone, and a one-segment thumb, so the finger-curl animation still works;
  - wrist rings × 1.16;
  - flared cuff (gCyl r 0.041 → 0.06, h 0.075) on long, non-wide sleeves, with the trim ring moved onto the cuff;
  - raised collar (gCyl on chest at shY + 0.03, r 0.072 → 0.086) for every top except robe, fur and bare;
  - boot-top flare (gCyl at bootTop, r 0.066 → 0.086) when boots are worn;
  - feet fk × 1.12.
- Triangles for a human WAR: about 9,700 → 3,000 on Medium, 3,700 on High and 2,600 on Low. The head and face are about 1,000 of these, kept on purpose for faces.

## Phase 119: Chunky hair (v16.5.0)
- `gHairClumps(P, hc, hr, st)` (rig.js, before hairPieces) replaces gHairLocks for uncovered hair in Classic. It builds 12 clumps (14 for pixie), merged into one geometry. Each clump is a 4-sided tube that tapers to a point over 4 rows:
  - left and right points at radius offset 0.075 → 0.025;
  - an outer ridge at 0.13 → 0.045;
  - an inner point at 0.015 under the shell.
- Clumps follow the same edge, sweep and fringe rules as the locks. Length is × 1.3 + 0.02. UVs give each clump 1/n of u, so the painted hair cell gives about one dark line per clump.
- Spiky, mohawk, curly and dreads keep their own pieces. Hair under helmets still uses gHairLocks.
- The gHairShell volume is × 1.35 in Classic (when uncovered).
- Smooth skin: buildAtlas writes 40 into the red channel of the mr map for skin and face cells, and 255 everywhere else. The Classic shader reads it and blends the light bands only 10% on skin and faces, versus 50% elsewhere, so faces are not blotchy.

## Phase 120: Face finish (v16.6.0)
- paintFace (rig.js) in Classic (`CLF = classicOn()`): `soft()` draws two hard-edged ellipses (55% and 45% of the alpha, inner at 0.55 radius) instead of a radial gradient. Flat tones under the eyes: jaw shade, nose-side wedge, lit forehead ellipse. Iris gradient has 4 hard bands. Upper lid ink 3.0 (3.6 female), crease line darker (0.6 alpha, width 1.1).
- Ears: after the default ear code, a darker inner shape (`shadeHex(skin, 0.74)`) for elf (taper on earBone), pipkin (taper), goblin (taper) and the default round ear (small ball). Not added for cat, fin, ursan, skull or doll.
- Banding on skin and faces (mr red channel below 0.5) is now 0 (was 0.1). This removed the hard diagonal cheek shadow seen in the creator.
- Ursan and pipkin face painters are unchanged.

## Testing tools used (scratch, not in the repo)
- Headless Chromium (`/opt/pw-browsers/chromium`, `--use-gl=swiftshader`) driving the title, then Play Offline, then the creator. Screenshots of the creator preview (clip 284,176 220×290). The face step zooms on the head; click `[data-face=n]` and `[data-sex=n]` to change faces and sexes.
- Entering the world takes about 2–3 minutes in software GL. Wait for `#loading` to lose `on`, and run one browser at a time.
- Triangle counts: `humanEntry(lookFor(job, gear, baseFromLook({race})))` with RIG.segK set, then count index entries / 3.

## Open
- Outlines can show gaps at hard-normal seams. Far LODs have no outline.
- Hair under helmets is still thin locks.
- Real-phone frame rate not measured yet.
