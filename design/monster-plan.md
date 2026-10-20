# Monster Models, Movement and Hate: Plan

Goal: monsters that look and move like believable creatures (natural legs and arms, weighty walking, planted feet) and a threat system where how you hit decides who the monster turns on.

## Where things stand (checked 19.3.0)

- Hate already exists as enmity: `addEnmity(m, e, amt)` in game.js. Every hit adds `40 + 2 x damage`, abilities and spells add fixed values from data.js, Sentinel doubles it, enmity decays 4% per second, and `updateMob` always attacks `topEnmity(m)`.
- Missing: any difference between physical, magic and ability hate; any crit bonus; any per-family bias; any switching delay (a mob flips the moment another number is higher).
- Humanoid monsters (goblin, orc, reefkin, crag talon, treant, skeleton, ghoul) are built by `humanEntry` in rig.js with `familyLook` and `familyExtras`, and moved by `poseHuman` in anim.js. Quadrupeds use `quadEntry`, `poseQuad`, `quadGait`, `quadLegIK`. Others have their own entries: crawler, crab, bee, bat, worm, hare, toad, fish, mandrake, shroom.
- Unknown until measured: how much of the human foot planting (`humanLegIK`) reaches monsters, and whether `applyDamage` knows a hit was a critical. Phase M0 and H1 settle both.

## Phases

Each phase ships as one version, with a build, rules tests, render sheets, version bump, Help and Updates text, design notes and a push.

### M0: Audit (DONE, no version bump)
- Render contact sheets (walk, run, idle, attack) for every family with test/modellab.js, test/studio.js and test/gaitsheet.js.
- Measure stance slide, ground penetration, joint gaps and stride versus speed per family with test/gaitprobe.js.
- Output: design/monster-audit.md, a ranked list of the worst offenders. Everything below is ordered by that list.
- Result: goblin gait is the largest measurable defect (planted foot slides up to 1.5 m/s); quadruped slide needs a new foot probe before M3; most non-humanoid gaps are in attack poses. test/gaitsheet.js was fixed (it failed on the release build because GridHelper is not bundled; other sheet scripts have the same problem).

### M1: Natural legs and arms for humanoid monsters
- Legs: tapered lofted thigh, knee, calf and ankle with the body-fitted rings used for players; bent-knee hunched stance for goblins, orcs and reefkin; digitigrade hind legs for crag talons; root-bound legs for treants.
- Arms: lofted shoulder, elbow and wrist; hands sized to the weapon or claw; weight hangs forward on hunched families.
- Proportions per family from the existing `FAMILY_SHAPE` table so silhouettes stay readable.

### M2: Walking and running that match the body
- Stride length from leg length and actual speed (monster speed is family speed x `mobSpeedMul`), so feet stop sliding.
- Reuse `humanLegIK` for humanoid monsters; add hip sway, counter-swinging arms, a settle step when they stop.
- Idle variety, aggro alert pose, a lunge on attack and a recoil on hit, scaled by monster size.

### M3: Four-legged animals
- Shaped legs (shoulder and haunch masses, carpus and hock, tapered shins, hooves or paws) for sheep, lizards, longnecks, deer, dogs and cats.
- Tune `QUAD_GAITS` per animal; lizard sprawl gets a body wave; check slopes with the grounding probe.

### M4: Many-legged, winged and legless monsters
- Crawler: each leg lifts, reaches and plants in a travelling wave with the body ripple.
- Crab sideways scuttle, bee and bat wing beats with body bob, worm undulation, hare hop with ear and tail follow-through, toad hop.

### H1: Hate core (rules only)
- Each monster's list holds two numbers per player or companion: cumulative hate (stays) and volatile hate (fades fast). Highest total is the target. Provoke, Flash and similar abilities add mostly volatile hate.
- Hitting builds hate: every hit adds hate that grows with damage, so steady hitting wins over time.
- Criticals add extra hate (`CONFIG.critHate`, starting guess 1.5x).
- Family bias in data.js, `hate: { phys, magic, ability, heal, crit }`, each defaulting to 1. Starting profiles (guesses, tuned later): skeletons and orcs favour physical, worms, bats and casters favour magic, birds favour abilities and heals, bosses ignore the crit bonus.
- Target switching needs a lead of 10% over the current target and waits 1 s, so mobs stop ping-ponging.
- Companion tank AI and healer AI read the same numbers; proxies in shared zones keep sending amounts to the host.
- Tests: new unit test for each bias, crit bonus, decay and switching.

### H2: Hate readability
- Target box shows who the monster is attacking and a small hate bar for you; monsters flash an alert icon when they swap target; Inspect and the Database tell you what a family dislikes most once you have fought it enough.
- Help and Updates explain the system.

### Wrap-up
- design.md section per phase, Help rewrite, Updates entries, version log, push.

## Order

1. M0 (cheap, tells us where the pain is)
2. H1 and H2 (small, independent; can go first if you prefer)
3. M1, M2, M3, M4 in the order the audit ranks them

## Model per phase (guess, confirmed before each phase starts)

- M0: Sonnet 5.5.
- M1: Opus for the leg and arm loft rework, drop to Sonnet for the per-family tuning.
- M2: Opus (foot planting and stride maths), Sonnet for the polish.
- M3 and M4: Sonnet 5.5 (many render-and-adjust loops); Opus only if the crawler wave needs a new rig structure.
- H1 and H2: Sonnet 5.5.

## Risks

- Rigid skinned shapes limit how smooth a bend can look; keep triangle counts inside the per-tier budgets (monsters 1,000 to 5,000).
- Hate numbers need playtesting: a bot sim (tools/balance/sim.js) should be rerun after H1 to make sure tanks still hold monsters.
- Shared-zone monsters are host-run, so hate profile changes must stay deterministic on the host.
