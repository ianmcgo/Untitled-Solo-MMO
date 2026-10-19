# Town zones plan (street-first towns, districts as zones)

Status: D0 done (audit, no release). D1 done in 18.93.0. D2 done in 18.94.0. D3 done in 18.95.0. D4 done in 18.96.0. D5 (Ironvale) next.

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
| D2 | Opus | Done 18.94.0: splitTown (data.js tail), gate exits, area-aware warps/AH/vendors/tour, save migration through migrateSplits, city overview map, fade-in on every zone load. |
| D3 | Opus | Done 18.95.0 (buildOutpostCity, ghost skyline, gate signs, settleTownFolk). Was: author the Outpost districts as their own zone data (replace splitTown for outpost, keep ids and npc ids), add a skyline/backdrop beyond inner walls; districts enlarged to about 2400x1800 each and re-detailed street-first: street graph, lots with frontage, more homes, alleys, props. Frontage pass and townlayout test must pass. |
| D4 | Sonnet | Done 18.96.0 (buildCity(C), HARBOR_PLAN, cross-less layout with Docks under the square). Was: Saltreach Harbor: write a HARBOR_PLAN for buildOutpostCity's generator (generalise it to buildCity(plan, seed)), districts ~2400x1800, docks along the sea side with piers, keep ids and NPC ids, bump TOWN_LAYOUT.harbor. |
| D5 | Sonnet | Ironvale: same with an IRONVALE_PLAN (mountain style, keep on high ground), bump TOWN_LAYOUT.ironvale. |
| D6 | Sonnet | Help, Updates, docs, full test sweep, travel-time tuning, quest/NPC references to old coordinates. |

## Rules for future town data (from D1)
- House `w`,`h` are the world footprint. `rot` 0..3 = door south, east, north, west. Use houseDir/houseDoor/houseLocal/houseAng (data.js); never `h.rot ? ... : ...`.
- Do not hand-set rot or exact setbacks: frontage(z) picks the side whose door ray reaches a road first (blocked by other buildings, city walls, zone edge), then moves the building along its facing axis so the door is 46-80 px (vendor shops) or 8-60 px (others) from the road edge if the lot is free, then adds a 30 px `lane: true` footpath when the door is still far. `fixed: true` (or a door exit within 40 px, e.g. the residence) opts out.
- Vendors stand at houseDoor(shop, 34), facing the street (zone npc `face`, game npc `idleFace`); trade props flank the door.
- clearOfRoads also keeps things out of city walls and out of each vendor shop's front corridor (124 px deep, shop width + 48).
- NPCs defined in NPCS after the offRoad pass (e.g. ferry_harbor) are not nudged: place them by hand.

## Notes from D2
- Town zone data is still written as one big zone and split at load. D3 can either keep that (enlarge the source zone) or author each district zone directly; if authored directly, set area/town/off/outerWall/districts the way splitTown does and register ZONE_SPLITS so old saves migrate.
- gateZones, the 24 px wall pad and district containment in lotFree are what keep buildings out of gates and off the new walls; keep them when enlarging.

## Notes from D3
- User feedback folded into D3: every town exit has a "To ..." signpost; NPCs face the street and keep 70 px apart (validator: 60); inner gates show the next district (ghost skyline and paths, no hills) with district-colour banners.
- The generator is Outpost-specific in name (buildOutpostCity, OUTPOST_PLAN); D4 should generalise it before writing the Harbor plan.

## Notes from D4
- buildCity(C) is generic now (see design.md 18.96.0). D5: write IRONVALE_PLAN + IRONVALE_GATES and call buildCity with cityStyle "mountain", palette "snow" (copy via zone extras: buildCity only sets name/city/cityStyle/outerWall, so add palette to C if needed), keep ids ironvale, ironvale_gate/keep/south/forge, bump TOWN_LAYOUT.ironvale.
- Water circles must not reach into another district; vendor shop points are passed as reserve so lots leave them free.
- Plans without corner districts work: the source zone just has empty space (fish and yard get open "s").
