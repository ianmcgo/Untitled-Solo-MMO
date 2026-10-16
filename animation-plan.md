# Animation Plan: classic MMO-style feel

Goal: combat and movement that read like the original: weighty, readable, tied to weapon type and stance. Each phase ships as one version, is checked with render sheets (test/swingsheet2.js, test/drawsheet.js), and updates the Updates and Help text.

## Phase 1: Combat core (next)
- Engage/disengage: step into stance on Fight, relax on disengage (blend already exists via an.fight; add a short settle).
- Auto-attack rhythm: weapon delay drives swing timing; add a recovery pose and a faint pause between rounds instead of back-to-back swings.
- Hit reactions: monster flinch on hit (small recoil, scaled by damage), stagger on crits, player flinch when hit.
- Per-weapon swing sets, same 5-phase keyframe method used for staff (wind-up, strike, follow-through, recovery): sword (diagonal slash, thrust, backhand), dagger (fast alternating stabs), axe/club (overhead chop), greataxe/scythe (wide horizontal sweep), polearm (thrust and sweep), bow (draw, hold, release), h2h (alternating punches, kick finisher).
- Dual-wield: alternate main/sub hand swings.

## Phase 2: Weapon skills
- One distinct pose and effect per weapon type: leap, spin, rising slash, charge-up glow, staff glow strike.
- Short freeze-frame at impact, brighter slash trail, camera nudge.
- TP-gain flash and skill name text timing synced to the impact frame.

## Phase 3: Magic and abilities
- Casting: hands raised, staff or hands glow, cast bar synced to the pose; different pose per magic school (black: palms forward; white: arms out; summoner: staff raised).
- Job abilities: short signature poses (provoke shout, steal lunge, sneak crouch, meditate sit).
- Spell release flourish, interrupt flinch.

## Phase 4: Locomotion and idle
- Run, walk, strafe, backpedal, turn-in-place and jump with proper foot planting; race-specific gait (pipkin short quick steps, ursan heavy strides) already partly present.
- Idle variety: shifting weight, looking around, stretching; rested (sit/heal) pose with HP/MP regen.
- Weapon sway and cloth/hair secondary motion.

## Phase 5: Death, emotes, extras
- Knockdown death and getting-up; KO pose for monsters.
- Emote set (wave, bow, cheer, point, sit, laugh) with chat commands.
- Mount idle and ride animations; fishing/crafting/gathering poses.

## Phase 6: Monsters
- Per-family attack and idle sets: goblins (club swing), crawlers (lunge and bite), beasts (pounce), birds (peck), skeletons (stiff slash).
- Aggro roar/alert pose, spawn pop-in, defeat collapse or dissolve.

## Phase 6b: Specific monster fixes (requested)
- Caterpillar (crawler): every leg moves on its own in a travelling wave from head to tail, each leg lifting, reaching and planting in turn, with the body segments rippling to match.
- Rabbit (hare): rebuild like a Rarab. No front legs or arms at all, body stands semi-upright on long hind legs, long ears and tail, and it moves in hops. Idle shows a slight upright sway and ear twitch.

## Method and risks
- Reference stills are guides, not copies; match feel, not exact frames.
- Our rig is FK-only (no IK), so hand-on-weapon contact needs per-pose tuning and checks in side and front renders.
- Animations stay data-like keyframes in anim.js; notes live in design.md.
- Cost: Phase 1 is the largest; each weapon family is about one iteration of render and adjust.
- Unknown: whether the original's exact timing (delay, animation lengths) should be matched; guess is to match feel only.

## Model per phase (guess, confirmed before each phase starts)
- Phase 1 combat core: Sonnet 5.5 (many small render-and-adjust loops); switch to Opus only if the dual-wield or bow work gets stuck.
- Phase 2 weapon skills: Sonnet 5.5.
- Phase 3 magic and abilities: Sonnet 5.5.
- Phase 4 locomotion and idle: Opus (foot-planting and gait maths are harder to get right).
- Phase 5 death, emotes, extras: Sonnet 5.5.
- Phase 6 and 6b monsters: Sonnet 5.5 (Opus only if the caterpillar leg wave needs a new rig structure).

## Release rule
Every phase: model check first, then build, tests, version bump, Updates and Help text, design notes, push to GitHub, send index.html.
