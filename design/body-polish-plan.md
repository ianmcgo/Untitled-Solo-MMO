# Body polish plan

Status: phase 1 done (18.81.0); phases 2 to 4 awaiting go-ahead.

## Requests
1. Nekari tails: rounder at the curve, sway gently left and right at all times (idle, walk, run).
2. Ursan tails: blocky and disconnected at the curve; slightly round the bend and join the segments.
3. Female bodies (all races): round bust instead of a flat chest.
4. Weapons: no floating or off-body placement; weapons attach to the body (hand, hip, back sheath) without clipping into it.
5. Waistline lowered on Human, Nekari and Elari bodies (hips/waist ring in rig.js body build, pr.waist and torso split).
6. Ursan: remove the large ring/band around the middle; make the chest less blocky.
7. Nekari ears: more cat-like (wider triangular base, rounded tip, slight forward cup with pink inner, angled outward) so they no longer read as horns.
8. Female Human, Nekari and Elari: round, full buttocks with a defined dark crease line down the middle; underwear or clothing always stays on (no nudity). Breasts and buttocks get jiggle physics.

## Phases
- Phase 1 (Opus, done 18.81.0): body shape. Bust, waistline, Ursan chest and belly band. Contact sheets of every race, both sexes, front and side, with and without armour (gear torso layers must still fit the new shapes).
- Phase 2 (Sonnet): tails and Nekari ears. Curved tapered chains with smooth joints for Ursan and Nekari; Nekari continuous sway driven by time, blended with existing motion.
- Phase 3 (Opus): weapon attachment. Audit every weapon type in held, sheathed and back positions per race and build; fix offsets and add clearance so no mesh intersects the body or goes off body.

- Phase 4 (Opus): female hip shape and jiggle. Rounder glute volumes on the hips loft (two lobes, dark crease seam drawn as a thin inset strip on the back of the hips, hidden under robes, skirts and leg armour). Jiggle: small spring bones (bustL/R, gluteL/R) parented to chest and hips, driven by a damped spring on the parent's velocity and the walk/run/jump/land cycle; amplitude capped, softer under plate, off for Pipkin and male builds; a setting to turn it off.

## Checks
- test/h6unit.js, race and gear render contact sheets, npm run check.
- Update Help (character section) and Updates per release; one version bump per phase.
