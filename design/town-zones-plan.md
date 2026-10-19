# Town zones plan (street-first towns, districts as zones)

Status: D0 done (audit, no release). D1 done in 18.93.0. D2 next.

## Request
Vendors stood in the road; some vendors and buildings did not face the road. Split every district of a town into its own zone, much bigger and more detailed. Added later: loading into a zone should fade in, the same way leaving a zone fades out.

## D0 audit findings (2026-10-19)
- 55 offenders across Outpost (23), Harbor (15), Ironvale (17): vendors 1-34 px into roads, ~30 doors >100 px from any road, 4 buildings on roads.
- Causes: vendors placed at shop.y + h/2 + 34 (always south of the shop); offRoadGroup only moved folk within 110 px of a stall or desk; houses could only face south (rot 0) or east (rot 1); hud4 minimap, view3d camera test and clearOfRoads swapped w/h for rot houses although w/h are world extents; hand-typed shop points.
- Audit and map-drawing scripts were throwaway; test/townlayout.js now does the same checks.

## Phases
| Phase | Model | Scope |
|---|---|---|
| D0 | Sonnet | Audit (done). |
| D1 | Opus | Four-way facing, frontage pass (auto-face, setback, footpaths), vendors in doorways, folk off roads, validator test/townlayout.js. Done 18.93.0. |
| D2 | Opus | District-to-zone split engine: each district becomes its own zone (ids `<town>_<district>`, Market keeps `outpost`), gate halls become zone lines, warp stones become free in-town warps, `zv` save migration, map/minimap per district with a city overview, gateHop removed for split towns. Includes zone fade-in after the loading screen (mirror of the leave fade). |
| D3 | Opus | Outpost districts enlarged to about 2400x1800 each and re-detailed street-first: street graph, lots with frontage, more homes, alleys, props. Frontage pass and townlayout test must pass. |
| D4 | Sonnet | Saltreach Harbor same treatment. |
| D5 | Sonnet | Ironvale same treatment. |
| D6 | Sonnet | Help, Updates, docs, full test sweep, travel-time tuning, quest/NPC references to old coordinates. |

## Rules for future town data (from D1)
- House `w`,`h` are the world footprint. `rot` 0..3 = door south, east, north, west. Use houseDir/houseDoor/houseLocal/houseAng (data.js); never `h.rot ? ... : ...`.
- Do not hand-set rot or exact setbacks: frontage(z) picks the side whose door ray reaches a road first (blocked by other buildings, city walls, zone edge), then moves the building along its facing axis so the door is 46-80 px (vendor shops) or 8-60 px (others) from the road edge if the lot is free, then adds a 30 px `lane: true` footpath when the door is still far. `fixed: true` (or a door exit within 40 px, e.g. the residence) opts out.
- Vendors stand at houseDoor(shop, 34), facing the street (zone npc `face`, game npc `idleFace`); trade props flank the door.
- clearOfRoads also keeps things out of city walls and out of each vendor shop's front corridor (124 px deep, shop width + 48).
- NPCs defined in NPCS after the offRoad pass (e.g. ferry_harbor) are not nudged: place them by hand.
