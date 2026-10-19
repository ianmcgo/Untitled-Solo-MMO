# Combat interrupts, body and movement plan

Status: planned (not started).

## Requests
1. Fix the failing goblin tests.
2. Spell casting is interrupted by being hit physically; abilities are interruptible the same way.
3. Underwear for women matches the supplied reference: black halter triangle top with neck and back ties, small front triangle bottom with thin side-string ties and bows at the hips.
4. Female shoulders are too broad.
5. Another body smoothing and realism round.
6. More realistic movement.

## Findings
- p6unit "a goblin aggroes on sight": passes on a quiet run, fails when weather fog or the rolled job and facing shorten sight. Test is not deterministic (it relies on the random mob job, weather and face 0). Fix the test by pinning weather, job and facing; confirm the game rule itself with an extra check at several angles.
- p55unit "Red Mage starts with Dia and Bard with Knight's Minne" and "Summoner starts with Carbuncle only": the second job-start rule was changed after 17.0; check which side is stale (test or newSave spell grant at game.js line 89) before changing either.
- Casting interrupt today: damage to a caster rolls CONFIG.interruptChance (0.4) for the player and a flat 0.3 for mobs; Aquaveil absorbs. Magic hits only count in the same branch; physical melee is not singled out.
- Mob special moves ("readying", 1.0 s wind-up) can only be cut by the player stun or sleep effects, or the interrupt ability path at game.js 2909.
- Player abilities (doAbility) and weapon skills (doWS) fire instantly, so nothing exists to interrupt.

## Design
- Every physical hit (melee, ranged, weapon skill, physical monster move) that lands on a caster interrupts the cast. Magic damage keeps the existing chance. Aquaveil still absorbs hits first. Interrupted casts refund no MP and start a short recast lock.
- Weapon skills and long job abilities get a short wind-up (weapon skill about 0.8 s; abilities that already feel heavy, such as Provoke, stay instant) shown as a thin bar like casting; a physical hit during the wind-up cancels it with the "interrupted" text, TP spent is lost for weapon skills only if the hit lands in the final 25% of the wind-up (decision: default; tell me if you want it always lost or never lost).
- Mob special moves: a physical hit has a flat 35 percent chance to interrupt the readying, higher with more stacked hits; stun still always cuts.
- Settings: a switch in Settings, Gameplay to keep the old chance rule.

## Look
- Underwear top: black triangle cups with thin edge binding, halter neck strap that ties in a small bow behind the neck, a thin back band with a bow, strings between the cups. Cups are opaque dark mesh tone so they never read as bare.
- Underwear bottom: small front triangle, thin side strings that tie in a bow on each hip, thin back strap; no waistband ring. Default colour black; keep dye/recolour support if present.
- Pipkin and all women builds use the same set scaled to the build. Men's boxers unchanged.
- Women's shoulders: narrow the shoulder width (sw and chest cx at the shoulder ring in rig.js, female branches only) by about 8 to 10 percent on Human, Nekari and Elari, and 6 percent on Ursan women; clavicle slope increases slightly, arm attach points move in with it, pauldrons and robes rescale from the same value.
- Smoothing round: contact sheets front, side and back for every race and sex; fix remaining facets at neck, armpit, waist, hips and knees by adding rings or normal blending; tighten limb ratios (thinner wrists and ankles, tapered calves); check gear layers still fit.

## Movement
- Gait: heel-first foot plant and toe-off, pelvis drop and lateral weight shift over the planted leg, shoulders counter-rotate against the hips, arm swing opposite to the legs with elbow bend growing with speed, slight vertical bob at double the step rate.
- Starts, stops and turns: lean into acceleration, a small settle on stopping, body leans into curves and the torso turns toward the camera-forward direction before the feet.
- Run: stronger forward lean, higher knee drive, shorter ground contact, arm pump.
- Turning in place steps the feet; idle weight shift persists.
- Jump and landing: crouch, take-off extension, knee-absorbing landing scaled by fall height.
- Keep the per-race styles (Pipkin quick, Ursan heavy, Nekari sway, Elari measured). Mobs keep their own gait code; humanoid monsters share the new human gait.

## Phases
- Phase 1 (Sonnet): goblin and starting-spell tests fixed; physical-hit cast interrupt; ability and weapon-skill wind-up with interrupt; mob move interrupt; tests (new test/i1unit.js); Help, Updates, design.md.
- Phase 2 (Opus): new underwear set, female shoulder width, smoothing round; contact sheets of all races, both sexes, with and without gear; Help, Updates.
- Phase 3 (Opus): movement realism in anim.js (poseHuman, humanLegIK); frame-sequence checks of walk, run, stop, turn, jump, land for each race; Help, Updates.

## Checks
- test/h6unit.js, race and gear contact sheets, new interrupt tests, npm run check.
- One version bump and release per phase, pushed to GitHub.
