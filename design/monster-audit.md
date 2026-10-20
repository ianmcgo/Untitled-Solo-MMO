# Monster Audit (M0, measured on 19.3.0)

Tools: test/modellab.js (joint gaps, ground sink, hover, islands across every family, 117 monsters), test/gaitprobe.js (planted-foot slide at 1.25 and 3.4 m/s), test/gaitsheet.js (side-view walk sheets, 12 frames at 3.4 m/s). Raw output lived in the session scratchpad; numbers below are the findings.

Reading the numbers: gap and sink are percent of model height. Sink is the lowest vertex under the ground over all poses (negative = digging in). Slide is the speed of a planted foot in m/s (should be under 0.05).

## Limits of this audit
- gaitprobe tracks `footL/footR` for humanoids but only the hip bones `legBL/legBR` for quadrupeds, toads and hares, so quadruped slide numbers are not valid. M3 needs a proper foot probe (shin tip) before tuning.
- Crabs, crawlers, worms, bees, bats and fish have no gait metric at all; only the visual sheets and modellab cover them.
- Only walk sheets were rendered. Idle, attack and hit sheets are to be rendered at the start of each fix phase for the families being changed.
- Sheets are dark (the studio light is dim for the classic material), which hides small gaps; the numbers are the better evidence.
- Flying monsters (bats, bees, wasps, fish, elementals) report large positive hover by design; ignore their sink.

## Ranked offenders

| Rank | Family (kind) | Evidence | Fix lands in |
|---|---|---|---|
| 1 | Goblin and all goblin variants (human rig) | Planted foot slides 0.47 m/s walking and 1.48 m/s at chase speed (others are 0.01 to 0.14). Visually a mincing hunched shuffle that does not match the ground speed. | M2 |
| 2 | Orc grunt, stonechucker, warlord (human rig) | No slide (0.01 to 0.03), but legs are long and thin like a human, arms hang stiff and thin in front. Reads as lanky, not brutish. | M1 |
| 3 | Robed monsters: reefkin priests, crag chanters, tide priest (human rig) | The robe skirt is a rigid plate that kicks forward with each step; slide 0.05 to 0.14. | M1 and M2 |
| 4 | Ghoul and drowned (human rig) | Slide 0.10 at chase speed; stiff reaching arms, no weight shift. Gaps fine (under 1.3%). | M2 |
| 5 | Treant, cactus (human rig) | Slide fine (0.04); one arm held out rigid, legs move like a human, nothing rooted or heavy. | M1 |
| 6 | Lizards (quad, sprawl): hill, bog, dune, frost, plains, magma, shore | Sink 40 to 51% of height (limbs and tail below ground in some poses), shore lizard neck gap 18.8% in weapon-skill pose, tail gap 8 to 10%. Walk sheet shows very small, almost still legs. | M3 |
| 7 | Sheep, longneck (quad) | Spindly stick legs under a heavy body, tiny head; legs barely extend in the sheet. Slide not measurable (see limits). | M3 |
| 8 | Hare and toads (hare rig) | Toad leg/body gap 11 to 12% while walking and sink 18 to 33% on jade and bog toads; hares look nearly static while moving. | M3 and M4 |
| 9 | Crabs (crab) | Claw/arm gap 11% in swing, sink 25 to 54% (legs in the ground), legs nearly motionless in the walk sheet. | M4 |
| 10 | Crawlers (crawler) | Segment gaps 4 to 5% (vine crawler worst), legs not visibly waving. Already in the plan as a travelling leg wave. | M4 |
| 11 | Worms and leeches (worm) | Segment gap 10 to 13% at run, sink 41 to 72% (rearing digs in), body floats about 21% of height at idle. | M4 |
| 12 | Bats (bat) | Wing/body gap 12 to 14% in idle and run poses. | M4 |
| 13 | Bees, wasps, hornets (bee) | Tail/body gap 10 to 12.5% in the swing pose. | M4 |
| 14 | Mandrakes (mandrake) | Arm/body gap 7 to 8% on attacks. | M4 |
| 15 | Fish (fish) | Fin gap 7 to 8% on hit. | M4 |

## Fine as they are
- Skeletons, birdfolk, treants, orcs: planted foot slide under 0.05 m/s at both speeds. Skeleton walk sheet shows a clean stride.
- All humanoid families: joint gaps 1.3% or less, sink 4% or less, no floating pieces (islands).
- Shrooms: gaps under 1%.

## Suggested order for M1 to M4
1. M2 goblin gait first (biggest measurable defect on the most common monster).
2. M1 orc, robed and treant limbs.
3. M3 lizards, then sheep and longneck, after building the quadruped foot probe.
4. M4 crab, crawler, worm, then bat, bee, mandrake, fish, toad gaps.
