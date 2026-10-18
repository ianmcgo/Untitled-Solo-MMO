# Body polish plan

Status: planned, awaiting go-ahead.

## Requests
1. Nekari tails: rounder at the curve, sway gently left and right at all times (idle, walk, run).
2. Ursan tails: blocky and disconnected at the curve; slightly round the bend and join the segments.
3. Female bodies (all races): round bust instead of a flat chest.
4. Weapons: no floating or off-body placement; weapons attach to the body (hand, hip, back sheath) without clipping into it.
5. Waistline lowered on Human, Nekari and Elari bodies (hips/waist ring in rig.js body build, pr.waist and torso split).
6. Ursan: remove the large ring/band around the middle; make the chest less blocky.

## Phases
- Phase 1 (Opus): body shape. Bust, waistline, Ursan chest and belly band. Contact sheets of every race, both sexes, front and side, with and without armour (gear torso layers must still fit the new shapes).
- Phase 2 (Sonnet): tails. Curved tapered chains with smooth joints for Ursan and Nekari; Nekari continuous sway driven by time, blended with existing motion.
- Phase 3 (Opus): weapon attachment. Audit every weapon type in held, sheathed and back positions per race and build; fix offsets and add clearance so no mesh intersects the body or goes off body.

## Checks
- test/h6unit.js, race and gear render contact sheets, npm run check.
- Update Help (character section) and Updates per release; one version bump per phase.
