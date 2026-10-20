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

### M1: Natural legs and arms for humanoid monsters (DONE in 19.5.0: orc, treant, ghoul builds; robe skirt)
- Legs: tapered lofted thigh, knee, calf and ankle with the body-fitted rings used for players; bent-knee hunched stance for goblins, orcs and reefkin; digitigrade hind legs for crag talons; root-bound legs for treants.
- Arms: lofted shoulder, elbow and wrist; hands sized to the weapon or claw; weight hangs forward on hunched families.
- Proportions per family from the existing `FAMILY_SHAPE` table so silhouettes stay readable.

### M2: Walking and running that match the body (humanoid part DONE in 19.4.0)
- Stride length from leg length and actual speed (monster speed is family speed x `mobSpeedMul`), so feet stop sliding.
- Reuse `humanLegIK` for humanoid monsters; add hip sway, counter-swinging arms, a settle step when they stop.
- Idle variety, aggro alert pose, a lunge on attack and a recoil on hit, scaled by monster size.

### M3: Four-legged animals (DONE in 19.6.0)
- Shaped legs (shoulder and haunch masses, carpus and hock, tapered shins, hooves or paws) for sheep, lizards, longnecks, deer, dogs and cats.
- Tune `QUAD_GAITS` per animal; lizard sprawl gets a body wave; check slopes with the grounding probe.

### M4: Many-legged, winged and legless monsters (DONE in 19.7.0)
- Crawler: each leg lifts, reaches and plants in a travelling wave with the body ripple.
- Crab sideways scuttle, bee and bat wing beats with body bob, worm undulation, hare hop with ear and tail follow-through, toad hop.

### H1: Hate core (DONE in 19.8.0)
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

## Added: Town environment track (T1–T4), requested 2026-10-20

Goal: towns that are fun to explore, easy to read, and feel deep. Fewer empty houses, nothing floating, no signs to things that do nothing, vendors reachable, your own house obvious.

### T1: Prune and place (audit first)
- Count the houses per city with no NPC, no door exit and no shop; remove about half of them, keeping the ones that frame streets and squares. Replace some with varied fillers: a well, a market cart, a garden plot, a shrine, stacked crates, a courtyard with a tree, a watchtower stub, an open-air forge, a laundry line, a boat ramp (Saltreach), a mine cart siding (Ironvale).
- Floating check: an automated pass that samples every placed object's footprint against the terrain and reports anything whose base is more than a few cm above ground or sunk; fix by re-seating or adding a plinth.
- Sign audit: every sign is tied to an NPC, shop, door, warp stone or district that exists; signs for nothing are removed; shop signs face the street and match the vendor's trade.
- Vendor access: each vendor's talk spot has a clear walk-up (no stall, fence or wall between the street and the NPC); verified with the path tool used for spawns.
- Residence: a sign ("Home" with the character's name) over the door, a map and minimap marker, and a one-time title card plus log line on first entry to the Residential district.

### T2: Variety and depth per city
- Each city gets 3–4 distinct set pieces that are visible from a distance (clock tower, lighthouse, mine head, great hall, bridge, aqueduct arch) and a landmark at each gate.
- Height: terraces, steps and low walls so districts sit at different levels; a raised square or a sunken market.
- Street dressing with per-district palettes: Residential (gardens, washing, benches), Market (awnings, crates, hanging goods), Industrial (smoke, barrels, racks), Government (banners, lamps, statues), Docks (ropes, nets, barrels, gulls), Keep (torches, armour stands).
- Ambient life stays off (per the earlier request) except animals; add a few static "scenes" (two NPC props talking, a cart being loaded) that need no walkers.

### T3: Wayfinding
- District signposts list the shops in that district, not just directions; a "You are here" dot on the Map; shops get icons on the minimap when within range.
- The first visit to a city plays a short title sequence naming the districts and what each is for.
- Guards point you to the nearest vendor of a given kind when asked ("Where is the armourer?").

### T4: Field variety (later)
- Same floating and sign audit for the field zones; more varied clearings, overlooks and ruins; POIs visible from paths.

Order: T1 first (it is mostly cleanup and can ship alone), then T2 and T3 together, T4 after the monster phases. Model: Sonnet for T1 and T3, Opus for T2 (layout and terrain work).

## Added: Weapon handling (W1–W2), requested 2026-10-20

Goal: weapons sit in the hand correctly, are carried at the hip (not the back) except bows and long staff-type weapons, and drawing a weapon is a hand-to-hip motion rather than the weapon floating to the hand.

### W1: Grip and carry
- Per weapon kind a grip frame: where the hand closes on the handle (offset along the handle, roll of the blade in the palm), so swords, daggers, axes, clubs, katanas and great weapons all sit between thumb and fingers rather than through the palm. Verified with close-up hand sheets front, side and top for every kind at rest, fight stance and mid-swing.
- Carry positions: one-handed swords, daggers, axes, clubs, katanas and great katanas hang at the left hip (angled back, hilt forward); scythes, great axes, great swords and polearms across the back; bows and staffs on the back as now. Shields stay on the left forearm or back.
- Fingers close around the handle (the curl values already exist); the thumb wraps the far side.

### W2: Draw and sheathe
- Draw: the right hand goes to the hip (or over the shoulder for back-carried weapons), closes, and the weapon leaves the carry point attached to the hand from that instant; a short arc brings it to the ready. Sheathe is the reverse. Two-handed weapons add the left hand joining the grip at the end of the draw.
- The old blend (`v.wBlend`, weapon lerping through space) is removed; the weapon is always parented either to the carry bone or the hand.
- Timing: 0.35 s draw, 0.45 s sheathe; interruptible by a swing (snap to hand).

Order: W1 then W2, one release each; Sonnet for both, Opus only if the grip frames fight the swing poses.
