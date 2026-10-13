# Untitled Solo RPG: project handoff (formerly Ashenreach)

Everything needed to continue Ashenreach in the "Solo MMO" project.

## What to upload to the project
1. `ashenreach-source.zip`: the full source, build script, audio generator and tests (no build output).
2. `design.md`: how the code works, phase by phase. Add it to project knowledge.
3. `HANDOFF.md`: this file. Add it to project knowledge.
4. `index.html`: the playable Phase 4 build (4.2 MB). Keep it to play; it doesn't need to be in project knowledge.

Plan doc (roadmap, requirements, time estimates): "Ashenreach: Complete Game Plan", https://claude.ai/code/artifact/5fff6655-cb6c-4329-9150-558a2355a7f5

## Suggested project instructions
Paste this into the project's custom instructions:

> We're building Ashenreach, a single-player MMO in one self-contained index.html that plays and feels as close to Final Fantasy XI as possible, with a modern MMO HUD and progression, and hired NPC companions instead of other players. All names and art are original. Source is in ashenreach-source.zip; read design.md and HANDOFF.md before changing anything. Rules: no comments in code, explanations go in design.md. Deliver index.html (and the updated design.md) at the end of each phase. Phone first. Decisions so far: level cap 10, never de-level, one-time mercenary fee.

## Status
| Phase | Status |
|---|---|
| P1 Foundation (rules) | Done |
| P2 3D world, sky, water | Done |
| P3 Characters, animation, effects, mount | Done |
| P4 HUD, system menu, map, music and sound, loading screens, jumping | Done |
| P5a Bigger zones, NMs live, drop tables, XP chains, discovery XP, character roster, chat commands, /rest, loading bars, update popup | Done (v4.2.0) |
| P5b Paladin and Red Mage with Dorn and Lisette | Next |
| P5c Quests (to 11) | Not started |
| P5d Sunken Crypt | Not started |
| P6 Life systems: residence and Pip, storage, furniture, gardening, crafting, gathering | Not started |
| P7 Test and tune (night difficulty, phone frame rate) | Not started |

## How to build and test
Needs Node 18+, and for audio Python 3 with numpy and scipy plus ffmpeg.
```
npm install                      # three, esbuild
node build.mjs 4                 # the game -> dist/index.html
node build.mjs 1                 # 2D rules build -> dist/game.js, used by the tests
cd test && node p1unit.js; node p3unit.js; node p5unit.js; node p1bot.js ../dist/game.js
python3 audio/gen.py sfx|music|amb   # re-render sounds into audio/out/
```
Browser tests (Playwright + Chromium): `test/p5shots.js <abs path to dist/index.html> <out prefix> <w> <h> <mobile 0|1> [scene,scene]`, plus the older `test/p4*.js`. Build 4 again after build 1, since both write `dist/`.

Publishing: GitHub Pages serves `index.html` and `version.json` from the repo root; copy both from `dist/` and push. The in-game update popup reads `version.json`.

## Open notes
- Bot runs die more at night (skeletons and bats near the paths). Tune in P7.
- XP chain counter has a slot on the XP bar but no rules yet (P5).
- Jump has no special pose yet.
