# Polish plan (from v19.26.0)

Goal: closer to the look and feel of the classic MMO the game is modelled on (low-poly, heavily painted textures, readable silhouettes, warm painted scenery). Each phase is its own version: version and build time on the title screen, Guide and Updates updated, design.md section, index.html pushed.

| Phase | Version | Content | Status |
|---|---|---|---|
| 1 | 19.27.0 | Objectives as plain text under the status icons; Pets menu only after owning a pet | Done |
| 2 | 19.28.0 | Water: no floating sheets, irregular pond shapes, real shorelines | Done |
| 3 | 19.29.0 | Shooting stars at night, birds by day | Done |
| 4 | 19.30.0 | Grass blends with ground; richer painted terrain | Done |
| 5 | 19.31.0 | Weapon grips (blades forward) and keyed swings | Done |
| 6 | 19.32.0 | Bodies: continuous limbs, more segments, proportions | Done |
| 7 | 19.33.0 | Painted detail on gear, skin, fur and scales | Done |
| 8 | 19.34.0 | Softer painted scenery, window glass, night grass | Done |
| 9 | 19.35.0 | Motion (Pipkin cadence) and final polish | |

## Causes found
- Floating water (v19.26.0): each pond's water mesh was a circle of radius (r + 26) × 1.2 at one water level shared by the whole zone. Where the ground around a pond fell below that level (ponds lower than the zone average, slopes beyond r + 110), the disc and its foam ring showed in mid-air as a curved sheet.
- Ponds looked round: `pondLobe` varied the radius only ±17%.
