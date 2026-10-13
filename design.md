# Untitled Solo RPG — Design Notes

(Working title; the game was called Ashenreach until v4.1. Ashenreach Outpost is still the starting town and `ashenreach_*` localStorage keys are kept so old saves load.) A single-player MMO in one HTML file, built to play and feel like classic MMO, with hired NPC companions instead of other players. Names, art and music are original. The full roadmap lives in the plan doc ("Ashenreach: Complete Game Plan"); this file explains how the code works and is updated at the end of every phase.

## Phase status

| Phase | Status |
|---|---|
| P1 Foundation (rules) | Done |
| P2 3D world | Done |
| P3 Characters and effects | Done |
| P4 Interface, audio, loading screens, jumping | Done |
| P5a Bigger zones, NMs live, drop tables, XP chains, discovery XP, characters, chat commands | Done (v4.2.0) |
| P5b Paladin and Red Mage | Done (v4.3.0) |
| P5c Quests (11) | Done (v4.4.0) |
| P5d Sunken Crypt | Done (v4.5.0) |
| P6a Residence, Pip, storage, furniture | Done (v4.6.0) |
| P6b Gardening, crafting, gathering | Done (v4.7.0) |
| P7 Test and tune | Done (v4.8.0) |

---

## Source layout and build

The game is written as separate source files and assembled into one `index.html` by `build.mjs`.

| File | What it holds |
|---|---|
| `src/data.js` | Every tunable table: `CONFIG`, jobs, weapon skills, abilities, spells, items, shops, crafts, mercenaries, monster families, notorious monsters, zones, NPCs, quests, `FEATURES` flags |
| `src/game.js` | The rules: state `S`, saving, stats, skills, combat, magic, skillchains, AI, zones, spawning, the clock, NPC dialogue, jobs, shop |
| `src/hud.js` | Log, dialog box, menus (items, equip, status, skills, quests, settings, shop, jobs, mercenaries), party and target panels, action buttons |
| `src/view2d.js` | Phase 1 top-down renderer (kept for the rules tests) |
| `src/three-entry.js` | Which parts of three.js get bundled (core, Sky, Water, bloom post-processing, geometry merging) |
| `src/textures.js` | Procedural texture generator: noise, normal maps, every surface texture, the baked terrain texture |
| `src/world3d.js` | Renderer, terrain, vegetation, buildings, cave dressing, gates, water, sky, sun, moon, stars, clouds, fog, lighting by time of day |
| `src/rig.js` | Character, monster, mount and weapon models built in code: the painted texture atlas, the skinned-mesh builder, gear-to-appearance rules, NPC and mercenary looks |
| `src/anim.js` | Procedural animation: humans, bats, worms, hares and the Thornstrider |
| `src/effects3d.js` | Particles, spell and skillchain effects, magic circles, weapon trails, light flashes |
| `src/models3d.js` | Creates, positions and animates each entity's model; weapons drawn or sheathed; mounted riders |
| `src/view3d.js` | Nameplates, floating numbers, target cursor, aggro decals, camera and touch/mouse/keyboard input, graphics and appearance settings |
| `src/main.js` | Keyboard, buttons, boot and the main loop (Phase 3 build) |
| `src/audio.js` | Music, ambience and sound playback (Phase 4) |
| `src/hud4.js` | The modern MMO HUD: party and target frames, minimap, clock, quest tracker, action bar, chat tabs, toasts, banners (Phase 4) |
| `src/menu4.js` | The system menu: character with 3D preview, inventory, skills, action bar editor, quests, map, settings, system, and the NPC shop/jobs/mercenary tabs (Phase 4) |
| `src/main4.js` | Phase 4 keyboard, the loading screen, boot and main loop |
| `audio/gen.py` | Offline music and sound generator (Python, numpy, scipy, ffmpeg); output in `audio/out/` |
| `src/template2d.html`, `src/template3d.html`, `src/template4.html` | Page layout and CSS for each phase |

`node build.mjs 1` builds the 2D rules build used by the automated tests; `node build.mjs 4` builds the current game into `dist/index.html` (build 3 is kept for reference). Build 4 also reads every MP3 in `audio/out/` and embeds it in the page as a JSON data block. The 3D build bundles three.js (minified, about 760 KB) into the same file, so the game works offline. The rules never touch the screen directly; they call a few hooks (`log`, `openDialog`, `openModal`, `showKO`, `sfx`, `inputVector`, `onZoneEntered`) that the interface files provide. That split lets automated tests run thousands of fights without a browser.

`FEATURES` in `data.js` switches on systems as their phase lands (crafting, gathering, residence, notorious monsters, water, mounts). Data for later phases already exists but stays dormant until its flag is on.

---

## Phase 1 rules

### Starting solo and hiring companions
- You start alone with 100 gil. Brann at the Mercenary Hall (Outpost) hires companions for a one-time fee; dismissing is free, rehiring costs the fee again.
- Party size is up to 6 (you plus 5), as in classic MMO. Companions match your level and get gear for their level.
- Eight companions exist; five are available now:

| Name | Job | Role | Fee | AI |
|---|---|---|---|---|
| Kael | WAR | tank | 120 | Engages your target, Provokes whenever he isn't top of enmity, closes skillchains |
| Rook | WAR (sword) | damage | 140 | Berserk on cooldown, weapon skills at 1000 TP to open chains |
| Mira | WHM | healer | 150 | Cures the lowest member under 65%, Divine Seal under 35%, Dia when MP allows |
| Fen | WHM | support | 150 | Dia, Banish on undead, backup Cures under 50% |
| Sable | BLM | nuker | 180 | Magic-bursts open chains with a matching element, otherwise nukes the target's weakness every 7–10 s while MP is above 45% |
| Vesper | BLM | burster | 400 | Unlocks after The Goblin Chieftain; holds MP for bursts and uses Elemental Seal on each |
| Dorn, Lisette | PLD, RDM | — | 260 | Unlock with those advanced jobs (Phase 5) |

- Companions speak in party chat (blue italics) when they open or close chains, burst, cure or fall.
- Followers fan out behind you in a fixed formation. KO'd companions get back up at 30% HP after 6 calm seconds.

### Regeneration by standing still
- Stand still for 3 s while not engaged, not casting and not targeted by any enemy: HP refills 0.6%/s and MP 0.8%/s (a trickle). Companions follow the same rule; the party frame shows 🌿.
- `/rest` (or the Rest action, `kind: "cmd"`, placed on action-bar page 2) sits you down: after 2 s, HP refills 3.5%/s and MP 4.5%/s. Companions sit with you when nothing is fighting the party. Moving, acting, mounting, engaging or being attacked stands everyone up (`regen` checks `canRest`). `S.party[i].resting`; the party frame shows 💤. The sitting pose is in `poseHuman` (`an.sit`).

### Home points and death
- Talk to a Home Point Crystal (Outpost, Rocky Hollow) to restore your party and, if you choose, set it as your home point.
- On defeat you lose 10% of your current level's XP requirement (never below 0 XP, never a level) and return to your home point with full HP and MP.

### Combat and magic skills
- Skills: sword, club, staff, great axe, hand-to-hand, healing, divine, elemental. Each job keeps its own skill levels.
- Caps come from the job's rating (A–E) and level: `cap = base + per-level × level` with A 3+5.5, B 3+5, C 2+4.5, D 2+4, E 1+3.5. Magic skills can also use the support job's rating at half level.
- Each swing (hit or miss) and each finished spell can raise the matching skill by 0.1 (sometimes 0.2). Chance is `0.12 + 0.05 × (cap − skill)`, clamped 5–60%, so it slows near the cap. Enemies four or more levels below you give nothing.
- Skill raises accuracy (`58 + DEX/2 + 0.6 × skill + level + gear`), cure strength (+0.3 HP per healing skill point) and spell accuracy.
- Weapon skills unlock by weapon skill, not level: tier 1 at 5, tier 2 at 22, tier 3 at 40. The log announces each one.
- Companions are treated as fully skilled for their level.

### Support jobs unlocked by quest
- Support jobs start locked. At level 5, Tobin offers "A Second Calling": bring 2 Bat Wings and 1 Worm Silk. Bats only appear at night.

### Real-time clock
- Game time runs 25× real time (one game day = 57.6 real minutes) and is computed from the real clock, so it keeps moving while the game is closed.
- Day is 6:00–18:00, night 18:00–6:00. The top bar shows the weekday and time.
- Eight weekdays (Emberday, Stoneday, Tideday, Galeday, Frostday, Stormday, Dawnday, Duskday) each boost nukes of their element by 10%.
- Spawns can be day-only or night-only. When the hour turns, idle monsters of the wrong time fade out and the right ones appear. In Rocky Hollow: hares by day; bats and Wandering Bones at night; goblins and worms always.

### Saving
- Progress autosaves in the browser every 20 s and on every important event.
- Settings → Save to file downloads `untitled-solo-rpg-save-YYYYMMDD.json` (older `ashenreach` save files still load); Load from file restores one (it's validated first, and you're asked to confirm). Bad files are rejected.

### Tests run for Phase 1
- 24 rule checks (hiring limits and fees, day/night spawns, standing regen, skill caps and weapon-skill unlocks, the support quest, home points, XP loss without de-leveling, save-file round trip and rejection, every menu tab) all pass.
- 40-minute bot playthroughs from a solo start as WAR, WHM and BLM: no runtime errors; first hire after 8–15 minutes, full party of six by 27–38 minutes, reaching level 5–7.

---

## Phase 2: the 3D world

### Coordinates
The rules still run on a flat map measured in "px" (the Phase 1 units). The 3D view maps 1 px to 0.05 m (`U` in `world3d.js`): map x becomes world x, map y becomes world z, and height comes from the terrain. A character's radius of 14 px is 0.7 m; the Rocky Hollow map is 80 × 50 m plus 32 m of hills on each side.

### Terrain (`buildField`, `buildTerrain`)
- A height grid every 12 px (8 px indoors) covers the zone plus a 640 px margin.
- Height = gentle low-frequency hills + mid-frequency bumps (amplitudes per theme: town 0.7/0.12 m, field 2.6/0.35 m, cave 0.8/0.45 m).
- Paths and the town plaza are flattened. Lakes get a level shelf and a 1.7 m basin, and every lake in a zone shares one water level so a single reflective surface works.
- Past the walkable edge the ground rises into ridged cliffs (town 6 m, field 11 m, cave 13 m), except in a corridor at each exit.
- The terrain's colour texture is baked once per zone (1024–2048 px, about 4–7 cm per texel) by `bakeTerrainAlbedo`:
  - grass (two tones by large-scale noise), dirt patches, worn dirt paths, a cobbled plaza in town (Voronoi stones), sand at lake shores, and rock on steep slopes and cliffs, all with fine speckle;
  - a tiling detail normal map (every 3 m) adds close-up bumpiness.

### Generated textures (`textures.js`)
Every texture is painted in code at load time, as a colour map plus a normal map derived from a height field (Sobel): terrain detail, rock, cave rock with moss, bark, pine and leaf foliage, wood planks, stone bricks, roof shingles, striped awning cloth, cobblestones, grass blades (with transparency), water ripples, clouds, and a soft glow sprite.

### World dressing
- **Outpost:** five timber houses on stone footings with shingle roofs, doors and windows that glow at night; a pointed-log palisade with a gap at the gate; two market stalls (Pell, Brann); crates; four lamp posts whose lights switch on at night; a pond. Houses and stalls are solid in the rules (`keepOutOfRects`).
- **Rocky Hollow:** about 420 pines and broadleaf trees and 160 boulders on the slopes, small rocks and up to 6,000 grass tufts on the floor, two lakes, wooden gates at each exit.
- **Goblin Den:** cave rock and stalagmites, seven flickering torches with real lights, glowing crystal clusters, an underground pool.
- Trees and grass sway in the wind (a vertex shader tweak). Trees, rocks and grass are instanced so thousands cost only a few draw calls.

### Sky, time and light (`updateSky`)
- The sun follows the game clock: it rises around 5:30, peaks at noon and sets around 18:30.
- A physical sky (three.js `Sky`, Preetham model) gives blue days and orange dawns and dusks. A cloud layer drifts overhead; stars and a moon fade in at night.
- The sky is rendered into an environment map every 10 seconds (or when the sun moves noticeably), so ambient light and reflections match the hour.
- A directional sun or moon casts shadows in a 64 m box that follows you. A hemisphere light fills shadows with sky colour.
- Fog colour tracks the horizon (blue by day, orange at dusk, deep blue at night); exposure rises at night so it stays playable. A soft lantern light around you switches on at night and in caves.
- Caves skip the sky and use dark fog, dim cool fill light and torches.
- Filmic (ACES) tone mapping throughout.

### Water (`buildWater`)
- Medium and High quality use three.js `Water`: a planar reflection of the scene, scrolling generated ripple normals, sun glints and fog. The reflection texture is 512 px on High and 256 px on Medium.
- Low quality uses a cheaper glossy material with scrolling ripples and sky reflections, no mirror pass.
- Water is impassable in the rules (`keepOutOfWater`).

### Characters and monsters (Phase 2 placeholders, replaced in Phase 3)
- People are simple jointed figures (capsule limbs, head, hair, eyes) dressed by job: Warrior in red with steel pauldrons and a helm, White Mage in a white robe and hood, Black Mage in a dark robe and pointed hat. They hold their equipped weapon type.
- Monsters have their own shapes: goblins (small, pointed ears, sack, dagger), Wandering Bones (pale, glowing eyes, sword), ghouls (hunched), bats (flapping wings, hovering), worms (undulating segments), hares, and the Chieftain (bigger, horned helm, red cape, great axe). Notorious monsters get a pulsing coloured aura.
- Animation: walking with arm and leg swing, a weapon swing on each attack, an overhead weapon-skill swing, arms raised while casting, a flinch and white flash when hit, toppling over when defeated.
- Phase 3 replaces these with fuller models and animation.

### On-screen labels and effects
- Nameplates float over everyone nearby: con colour for monsters, "❗" over quest-givers, "☠" on NMs, HP bars for party members, your target and anything fighting, and cast or TP-move bars.
- Damage numbers and other pop-up text float up from the hit point.
- Effects: expanding ground rings, magic bursts (glowing sphere and ring), skillchain light pillars and healing sparkles, all additive-blended.
- The target gets an classic MMO-style spinning arrow above its head and a ground ring: yellow when selected, red when engaged, blue for party members.
- Idle aggressive monsters near you show their aggro range on the ground: a red cone for sight, a blue ring for sound, purple for magic, red for low HP. Settings can hide these.

### Camera and controls (classic MMO style)
- Third-person chase camera, 8 m back by default. Drag (mouse or one finger) to orbit and tilt, pinch or mouse wheel to zoom from 2.5 to 16 m.
- Arrow keys or Q also turn the camera. V toggles first person.
- With auto-follow on, the camera eases in behind you whenever you move forward and you haven't touched it for 1.2 s. It never dips below the ground.
- WASD moves relative to the camera.
- On touch screens, pressing the lower-left part of the view brings up a virtual joystick under your thumb.
- Tap or click a character to target it; tap the target again to engage and walk into range. Tap the ground to walk there.

### Graphics settings (Settings tab)
| Setting | Low | Medium (phones) | High (desktop) |
|---|---|---|---|
| Shadows | Off | 1024 px | 2048 px |
| Water | Glossy, no mirror | Reflections at 256 px | Reflections at 512 px |
| Grass tufts | None | 2,500 | 6,000 |
| Terrain texture | 1024 px | 1536 px | 2048 px |
| Bloom | Off | Off | On |
| Resolution cap | 1× | 1.5× | 2× |

The setting saves in the browser and reloads the scene. Camera auto-follow, invert-vertical, sensitivity and aggro-range display are toggles in the same tab.

### Tests run for Phase 2
- Headless Chromium screenshots of the Outpost at noon and night, Rocky Hollow at dawn, afternoon, dusk and midnight, and the Goblin Den, at phone and desktop sizes. They were checked for exposure, sky, shadows, water reflections, labels and console errors (none).
- Browser input test: keyboard movement, Tab targeting, mouse-drag camera, touch tap, engage-and-chase and the Settings tab all run without errors.
- The Phase 1 rule checks (24) all still pass and the bot playthrough still runs cleanly with the new collision and arrival points.

### Known limits after Phase 2
- Character models are placeholders (Phase 3).
- The HUD is still the Phase 1 panels under the 3D view; Phase 4 brings the modern MMO HUD, minimap and audio.
- Frame rate couldn't be measured meaningfully here (the test browser renders in software). Use Low or Medium on older phones.

---

## Phase 3: characters, animation, effects and the mount

### How the models are built (`rig.js`)
- **One mesh per character.** Every character, monster and mount is assembled from simple shapes (spheres, tapered cylinders, lathed torsos, boxes, rings, membranes, extruded blades), then merged into a single skinned mesh with its own skeleton.
  - Each shape is rigidly bound to one bone, so a character costs one draw call (two if it has glowing parts such as eyes or markings).
  - Merged geometry is cached by appearance, so ten goblins share one geometry and only their skeletons differ.
- **Painted texture atlas.** One 1024 × 1024 atlas is generated at start-up (about 0.4 s). It holds 16 materials: skin, a painted face, woven cloth, stitched leather, brushed metal, hair strands, embroidered trim, fur, bone, scales, feathers, wood grain, chain mail, quilting, a flat region and a glow region.
  - Each has a matching normal map and a roughness/metalness map, so metal shines and cloth stays matte.
  - Part colours come from vertex colours multiplied over the atlas, which is how one atlas serves every outfit.
  - The face (eyes with highlights, lashes, brows, mouth, blush) is painted onto the head's wrap-around texture.
- **Humans.** Built from a 20-bone skeleton with two builds (A and B), torsos lathed from a body profile, hair in seven styles, beards, ears and noses.
- **Clothing follows equipped gear.**

| Slot / item | Look |
|---|---|
| No body gear | Simple shirt in the job's colour |
| Leather Vest | Leather vest over a job-coloured shirt, belt with buckle |
| Scale Mail | Chain-mail torso, steel skirt, steel pauldrons |
| Linen / Cotton Robe | Split floor-length robe in the job's colour (WHM white with red trim, BLM navy with gold), wide sleeves, collar and hem trim, sash |
| Warden's Robe | Dark robe with glowing green trim |
| Bronze Cap, Chieftain's Cap | Metal cap; horned helm with guards |
| Gloves, trousers, boots | Cover hands, legs and lower legs in leather or cloth |
| Main weapon | Sword, club, wand, staff (glowing orb), great axe or dagger, each modelled |

- **Companions** have fixed faces and hair (for example Mira long blonde, Sable dark ponytail, Rook spiky black, Dorn grey beard) and wear the gear their level gives them. Healers no longer wear helmets.
- **NPCs:**
  - Rhea: blue tabard over chain, cape, sword.
  - Tobin: bald, long white beard, purple robe, staff.
  - Pell: bandana and apron.
  - Brann: a big fur-vested mercenary with a great axe.
  - Ysolde: green riding coat.
- **Monsters:**
  - Goblins: hunched and big-nosed, with long ears, glowing eyes, a bandana or cap and a pack.
  - Goblin Raiders and the Chieftain: the Chieftain is larger, with a horned helm, red cape and great axe. Grimtooth has a black bandana and red eyes.
  - Wandering Bones: a skeleton with ribcage, glowing cyan eyes and a rusty sword.
  - Ghouls: gaunt and hunched, with claws and red eyes. The Ossuary Warden is hooded with green eyes.
  - Cave Bats: wing membranes on a two-joint wing.
  - Tunnel Worms: eight segments with a toothed mouth.
  - Meadow Hares.
  - Notorious monsters are scaled up and trail coloured motes.
- **Appearance editor:** Settings → Appearance cycles your build, skin tone (5), hair style (7) and hair colour (8). The model updates immediately and the choice is saved, including in save files.

### Animation (`anim.js`)
Poses are computed every frame from the game state, layered, and eased toward the target, so states blend smoothly.
- **Humans:**
  - Idle breathing and looking around; walk and run cycles tied to distance travelled, so feet don't slide.
  - A combat stance when engaged.
  - Swings by weapon: diagonal sword slash, overhead club smash, two-handed axe cleave, staff thrust, alternating punches, claw swipes for ghouls.
  - Weapon skill: crouch, leap, spin and slam.
  - Casting: hands raised and chanting, then a release flourish.
  - A flinch when hit, an arm-raised wind-up for monster TP moves, falling backward when KO'd, and a seated riding pose.
  - Goblins hop and hunch; ghouls prowl with arms forward.
- **Weapons are drawn only when needed**, as in classic MMO: in hand while engaged, casting or mid-swing, otherwise sheathed on the back. Monsters always hold theirs.
- **Bats** flap (faster when moving), dive to attack, rear back for TP moves and drop when killed. **Worms** undulate, rear and strike. **Hares** hop with ear twitches and kick.
- **Weapon trails:** sword, club and axe swings leave a fading trail, blue-white for normal hits and gold for weapon skills.
- Defeated monsters lie still, then sink away after about 1.5 s with a puff of smoke and rising motes.

### Effects (`effects3d.js`)
- **Particles.** Two GPU particle layers (3,500 glowing and 1,200 smoke particles) each draw in a single call. Effects reuse a pool of four flash lights so shaders never recompile mid-fight.
- **Melee:**

| Event | Effect |
|---|---|
| Melee hit | Sparks plus a slash arc (blades) or impact flash; criticals add a gold flash and light |
| Miss | Small puff |
| Weapon skill | Gold motes converge on you, then a big impact, ground shockwave and light flash tinted by the skill's element |
| Skillchain | One or two coloured light pillars (by the chain's elements), double shockwave, spiralling particles, a strong light and a screen flash |
| Magic burst | Expanding element sphere, shockwave, 140 particles, screen flash |

- **Spells:**

| Spell | Effect |
|---|---|
| Fire | Fireball burst with embers, smoke and orange light |
| Blizzard | Ice shards erupt from the ground, then shatter |
| Stone | Rocks burst up and tumble with dust |
| Aero | Swirling wind column |
| Water | Rising water column with splash |
| Thunder | Jagged lightning bolts from the sky with a violet flash |
| Dia, Banish | Beam of light with falling motes |
| Cure | Green pillar with rising sparkles |
| Casting | A rotating rune circle under the caster in the spell's colour, motes rising from the circle and hands |
| Buffs | Rising rings: red for Berserk, gold or violet for seals |
| Provoke | Red streak to the target |

- **Monster TP moves:**
  - Bomb Toss: a lobbed bomb that explodes.
  - Wing Slap: a wind slash.
  - Sand Spit: a sand stream and dust cloud.
  - Vampiric Claw: three red claws, with life drained back to the ghoul.
  - Goblin Rush: three quick strikes.
  - Others: an impact.
  - A red aura gathers while a TP move is readied.
- **Other events:**
  - Level-up: a golden pillar, rings and fountain.
  - Potions: bubbles.
  - Home Point crystals: a sparkle fountain.
  - Interrupted casts: a puff.
  - KO: dust.
  - Regenerating characters: faint green motes.
  - Running: dust at the feet.

### The Thornstrider (mount)
- **Look:** an antlered, feathered raptor with glowing cyan markings, amber eyes, a red saddle blanket, a leather saddle, stirrups and reins. One stands beside Ysolde in the Outpost.
- **Riding License quest:** Ysolde, Stablemaster, near the east gate. At level 5, bring 300 gil and 3 Healing Herbs (hares and worms drop them) to earn the license, plus 200 XP.
- **Riding rules:**
  - Press **R** or the Mount button in open country (not in town or caves) when not fighting.
  - You move 2.2× faster, and monsters don't notice riders.
  - Your companions ride their own Thornstriders and spread out wider.
  - Engaging, acting, being hit, entering town or a cave, or being KO'd dismounts the whole party.
- **Animation:** a digitigrade run cycle with tail sway, neck bob and idle head turns. Riders sit in the saddle and bounce with the gait.

### Tests run for Phase 3
- **Rules:** the 24 Phase 1 checks still pass. 13 new checks pass covering Ysolde, the license quest, town and level limits, the 2.2× speed, monsters ignoring riders, dismount on engage and on entering town, and save files.
- **Bot playthroughs:** no errors for WAR, WHM and BLM.
- **Browser stress run:** 9,000 frames of party combat with every effect enabled (295 hits, 18 weapon skills, 4 skillchains, 3 magic bursts, 61 nukes, 39 kills, mounting and dismounting) produced no errors and no leftover effect objects. Every remaining effect type (all seven TP moves, every element, level-up, potion, KO, crystal) was triggered directly without errors.
- **Screenshots** were checked at phone (390 × 844) and desktop sizes on Low, Medium and High quality: faces, the party lineup, NPCs, every monster, swings, the weapon-skill leap, casting circles, each spell, skillchain plus burst with bloom, and the mounted party.
- **Performance:** animating 21 characters takes about 1.4 ms of CPU per frame. Humanoids are 4,000–6,400 triangles, monsters 1,000–5,000. The software renderer used for testing can't measure real GPU frame rates.

### Known limits after Phase 3
- Shapes are rigidly skinned, so joints bend like a jointed figure rather than with smooth skin. Faces don't change expression.
- The camera can pass through large objects (the Home Point Crystal, trees), as in classic MMO.
- Automated bot runs died more often this time for weaker solo starts. That's likely because the game clock put them at night, when Wandering Bones and bats come out near the paths. Early-night difficulty will be tuned in Phase 7.
- Sound and the modern HUD arrive in Phase 4.

---

## Phase 4: interface, audio, loading screens and jumping

### Layout
The 3D view now fills the whole screen and the interface floats on top of it, like a modern MMO. Everything lives in `#ui`, which ignores touches except on its own panels, so taps and drags on empty screen still reach the world.

| Area | Contents |
|---|---|
| Top left | Party frames: job icon portrait with level badge, name, job, HP/MP numbers, a thin TP bar, buff icons, a cast bar. Tap to target. |
| Top centre | Target frame: name in its difficulty colour, level and difficulty word, NOTORIOUS tag, HP with a trailing "damage ghost", TP and swing bars, who it is attacking, a pulsing warning when it readies a TP move, chips for the open skillchain (with a draining window bar), the magic-burst element and Dia. NPC targets show only their name. |
| Top right | Round minimap that turns with the camera (an N marker rides the rim), then zone name, clock with weekday in its element colour, quest/sound/menu buttons, and the quest tracker. Tapping the minimap opens the Map. |
| Bottom left | Chat log with All / Combat / Loot / System tabs and a collapse arrow. |
| Bottom centre | Cast bar, the action bar (2 pages × 10 slots), and the XP bar with level, XP numbers and gil. |
| Bottom right | Round buttons: Attack (glows red when engaged; becomes Switch/Disengage), Target, Talk (shows the nearby NPC's name, glows when they have something for you), Jump, Mount (after the license). |
| Middle right | Toasts for items, quests, discoveries, new abilities and unlocks. |
| Centre | Level-up and quest-complete banners, and zone titles. |

Phone portrait (width up to 720 px): compact party frames without portraits, the target frame squeezed between party and minimap, a smaller minimap, chat collapsed to a three-line fade (taps pass through it to the joystick), the action bar as 2 rows of 5 on the right with the big buttons above it, and a thin XP bar along the very bottom. The left lower part of the screen stays free for the movement joystick. Short landscape screens get a compact variant. Safe-area insets are respected on notched phones.

DOM updates are cached (`setTxt`, `setW`, `setHtml` only write when a value changes); the minimap, clock and tracker refresh about 16 times a second.

### Minimap and map
`zoneMapCanvas` paints each zone once into an offscreen canvas (ground by theme, paths, plaza, water, houses, stalls, lamps, torches, exits). The minimap draws that image rotated so the camera's forward direction points up, then adds people, monsters (difficulty colours; notorious monsters get a red ring; monsters fighting you get a red outline), party members, the crystal and your move target, with your arrow showing which way you face.

Fog of war: each zone is split into 50 px cells; every half second the cells within 260 px of you are marked explored in `save.explored[zone]` (a string of 0/1). The Map tab draws the zone map, darkens unexplored cells with soft edges, and labels exits, people and the home point only once you've seen them. Below it, a world map shows how zones connect; places you haven't visited read "???". `save.discovered` lists visited zones; your first visit shows a "Discovered" toast and title.

### Action bar
Each main job has its own two pages (`save.hotbars[job]`), like classic MMO macro books. When you learn an action it drops into the first free slot automatically; page 2 starts with Potion, Ether and Hi-Potion. Slots show an icon tinted by type (spell element, weapon skill gold, ability green), the hotkey, MP cost or item count, a cooldown sweep with seconds left, dimming when unusable, a gold glow on weapon skills when you have 1000 TP, a "→ Fusion" style chip when a weapon skill would continue the open skillchain, and a "Burst!" chip on spells that would magic-burst. Actions your current job can't use stay on the bar but dimmed. Keys 1–0 fire the shown page, Shift+1–0 the other page, [ and ] switch pages. The Action Bar menu tab lets you place, swap, clear and reset slots, and items can be added from the inventory.

### Toasts and banners
`uiEvent("item")` (called by `giveItem`) makes an item toast; rare and exclusive items get a purple frame. `watchProgress` compares state each frame to spot level-ups, quest changes, the mount license, support jobs and zone changes. A level-up banner lists HP/MP gains, every new ability or spell, and quests that just opened (A Second Calling and Riding License at level 5). Quest completion shows a banner with the rewards and plays the fanfare. New weapon skills from skill-ups (not level-ups) get their own toast.

### System menu (☰ or Esc)
| Tab | Key | What it does |
|---|---|---|
| Character | C | Live 3D preview of your character (drag to turn; it slowly spins), paperdoll of the seven slots (tap one to see matching items), full stats, job levels, appearance options. "Compare on character" from the inventory shows green and red stat changes. |
| Inventory | I | 30-slot grid with icons, stack counts and rarity borders (gear blue, high quality green, rare purple, exclusive orange). Filters, Sort, and a detail panel with Use, Equip, Compare, Add to action bar and Drop (rare items warn). |
| Skills | K | Each skill with a progress bar to its cap and the next weapon skill. |
| Action Bar | B | Editor described above. |
| Quests | J | Every quest with status, giver, progress and rewards. |
| Map | M | Zone map with fog of war and the world map. |
| Settings | | Sound sliders, graphics, camera, aggro ranges, appearance, quest tracker and action-name toggles. |
| System | | Save to file, Load from file, New game, time and weekday, controls, about. |

Talking to Pell, Tobin or Brann opens the menu on the Shop, Jobs or Mercenaries tab. The character preview uses a second small WebGL renderer that shares the game's meshes and textures; it only renders while the Character tab is open. The menu re-renders itself when your bag, gear, gil, level, job, party or quests change.

### Loading screens
Loading used to freeze the page: the browser had to parse a 4 MB script and build the atlas, textures and terrain before it could paint anything. Now:
- The audio (about 3 MB) sits in a non-executing JSON block (`<script type="application/json" id="audioData">`), so the browser no longer compiles it as JavaScript. `audioData()` reads it the first time sound starts.
- The title screen is plain HTML at the top of the page, so it paints right away.
- `boot()` is async and does its heavy steps one per frame (renderer, atlas and effects, save and party, zone), moving the progress bar and status line between them, with rotating gameplay tips.
- When everything is ready it shows **Begin your journey** (new game) or **Continue** with your name, job, level and zone. That tap also starts the audio, which browsers require.
- Every zone change shows the same screen in a lighter style with the zone name: `onZoneEntered` sets `VIEW.loading`, waits two frames so the screen is visible, builds the zone, draws one frame to compile shaders, then hides it (at least 0.45 s, so it doesn't flicker). The game pauses while loading so nothing attacks you.

### Jumping
Space (or the Jump button) makes you hop: a 0.62 s arc about 0.85 m high, or 1.1 m on your Thornstrider, with a whoosh going up and a footstep or hoof on landing. It's visual only, so it doesn't change combat or movement rules. You can't jump while casting, KO'd, or with a menu or dialog open. `jumpHeight` adds the offset in `syncEntity`; the camera doesn't bob with it.

### Audio (`audio.js`)
All sound is pre-rendered; nothing is synthesised while you play. Clips are decoded once with the Web Audio API and played as buffers, which allows true volume control on iPhone, gapless music loops and stereo panning. Without Web Audio it falls back to pooled `<audio>` elements.

Mixer: master → music (with a duck stage), effects, ambience, interface. Settings (`ashenreach_audio_v1` in localStorage): master 80, music 55, effects 85, ambience 50, interface 60, mute.

Music:
| Situation | Track |
|---|---|
| Outpost | Outpost theme (3/4, flute and harp) |
| Rocky Hollow by day / night | Hollow theme / Hollow night (slow flute, harp, bells) |
| Goblin Den | Den theme |
| In combat (any monster fighting your party, outside towns) | Battle theme, crossfades in over 0.6 s |
| Fighting a notorious monster or boss | Boss theme |
| Residence, Sunken Crypt | Rendered now; used when those areas arrive in P5–P6 |

Battle music keeps playing for 4 s after the last monster stops fighting, then the field music fades back in over 2 s and resumes where it left off (if within 2 minutes). Level-ups and quest fanfares duck the music. Loops trim the MP3 encoder delay (`loopBounds`) so they don't click or gap.

Ambience: birds and breeze by day, crickets at night, drips and rumble in caves; none indoors.

Effects use names from the rules (`sfx(name, entity)`). Sounds from other characters get quieter with distance (silent beyond about 860 px / 43 m) and are panned left or right relative to the camera. Hits, misses, footsteps and clicks vary pitch slightly. The same clip can't retrigger within 45 ms, and at most 28 voices play at once. Interface sounds (click, select, tab, open, close, toast, coin, unlock, error, notify, xp) are SoundWeaver's pre-rendered UI sounds converted to small MP3s.

| Files | Contents |
|---|---|
| Music (48 kbps mono) | outpost 31 s, hollow 37 s, hollow_night 53 s, den 44 s, battle 25 s, boss 23 s, crypt 50 s, residence 34 s |
| Ambience (40 kbps) | day, night, cave |
| Effects (64 kbps) | 34 combat, magic, movement and event sounds including the new mount whistle, hoof, footstep, jump, level-up jingle, quest chime, loot sparkle and equip clink |

Total audio is about 2.3 MB of MP3 (3.1 MB as embedded text). The whole game file is about 4.2 MB.

### Tests run for Phase 4
- Rules: all 24 Phase 1 checks and 13 Phase 3 checks pass; the 30-minute bot playthrough runs with 0 errors.
- Browser (Chromium, software rendering): screenshots at 1280×720 and 390×844 of town, combat (with skillchain, burst and TP-move warning), level-up, night, every menu tab, the dialog box, the title screen and a zone loading screen; no console errors.
- Phone interactions with real taps: Target, Attack, page switch, potion from the action bar, menu open and close, inventory selection, and the touch joystick all work.
- Stress run: 9,000 simulated frames with the HUD, menus and audio active, no errors and no leaked effect objects.
- Audio: all 51 clips decode, the right music and ambience play by zone and time, battle music starts in combat.
- Load: the page's load event now fires in about 0.3 s with the title screen showing (it used to block for about 15 s in the software renderer with nothing on screen).

### Known limits after Phase 4
- XP chains and discovery XP are shown in the plan for P5; the XP bar has room for the chain counter but it stays empty for now.
- Jumping has no special pose yet (the body lifts as a whole).
- Real-GPU frame rates still need checking on actual phones (P7).

---

## Phase 5a: a bigger world, characters and chat commands (v4.2.0)

### Zones
- Rocky Hollow is 3200×2200 and the Goblin Den 2400×1600 (sizes from the plan). Both get `walls` (rectangles that become steep rocky ridges in `buildField` via `wallE`, and solid in the rules via `zoneRects`), `landmarks` (name, centre, radius, discovery XP) and more spawn points, laid out so levels rise from west to east.
- Rocky Hollow has `ruins`: wall segments `[x1, y1, x2, y2, height]` and pillars `[x, y, height]`, built by `buildRuins` from crumbled brick boxes, mossy caps, fallen columns and instanced rubble. They are solid (`zoneRects` pads each by 14 px) and the minimap/map draws them.
- The Den is four chambers (Den Mouth, Underground Pool, Bone Pit, Chieftain's Throne) joined by two passages; the `walls` carve the rock between them. Floor stalagmites were shrunk so they don't block the camera in the passages.
- The camera now pulls in when terrain sits between it and the player (`VIEW.camEff`, sampled along the camera ray in `updateCamera`).
- Zone building is incremental: `buildZone3DSteps` is a generator (field, terrain bake, vegetation, buildings, water), driven by `buildZoneAsync`, which yields a frame every ~28 ms and moves the loading bar. `runSteps` runs the same generators synchronously for tests.
- Monsters more than 1700 px away are hidden (`syncEntity`). Companions more than 700 px behind you teleport to your side when nothing is fighting (`follow`). A monster that can't reach home in 8 s snaps home (`returnSince`).
- `test/p5unit.js` checks that every spawn, NPC and path is clear of walls and water.

### Notorious monsters
- `FEATURES.nms` is on. A placeholder spawn with `nm` may pop the NM instead (`spawnMob`) when `save.timers["nm:<id>"]` (real-clock ms) has passed, no copy is alive, and the chance roll succeeds; a nearby pop logs "You sense a powerful presence". Defeating an NM stores its cooldown (`respawn` s, 300–360) on the real clock so it stays down offline; the placeholder respawns normally. Fixed NMs (the Chieftain) use the same timer and `enterZone` delays their spawn by the time left.
- NM hints (where/when) live in `NM_FAMILIES[id].hint` and feed the Help tab.

### Drops and rarity
- Loot entries are `[item, chance, minMobLevel?]`. Rates follow the plan: materials 15–40%, uncommon 5–10%, gear 1–5%, NM/boss uniques 30%. Seven new monster gear pieces (`scavenger_cap`, `nightwing_gloves`, `burrower_trousers`, `hare_charm`, `bonecharm_ring`, `gravedigger_boots`, `raider_helm`).
- `itemRarity(id)` → common / uncommon / rare / epic (explicit `rarity`, else `rare` flag, else HQ and a few named materials are uncommon). `RARITY` holds the names and colours; CSS classes `r-common … r-epic` on inventory cells, slots and toasts.
- `rare: true` items can't be held twice: `dropLoot` discards a second copy. `ex: true` items can't be sold (quest rewards, boss trophies).

### XP
- `CONFIG.xpTable` is 200 / 400 / 650 / 950 / 1300 / 1700 / 2200 / 2850 / 3600 (level 2 to 10).
- EXP chains: each XP-giving kill within `chainWindow` (60 s) of the last raises `S.chain.n` to at most `chainMax` (5); kill XP is multiplied by `1 + chainStep × n`. `chainInfo()` feeds the ⛓ counter on the XP bar (`#chainCt`).
- Discovery XP: `checkLandmarks` runs twice a second; entering a landmark circle the first time stores `save.landmarks["zone:id"]`, logs it, toasts and gives its XP. The Map tab lists found landmarks and labels them.

### Targeting
- Tab / the Target button: in a safe zone, the closest person (NPCs first, crystals last); elsewhere the closest enemy within 450 px, falling back to people. Pressing again within 2 s cycles by distance (`tabNext`, `S.lastTab`).

### Characters (roster)
- Saves are per character: roster in `localStorage["usr_roster_v1"]` (`{ chars: [summary…], current }`), each character in `usr_char_<id>`. `loadRoster` migrates a legacy single save (`ashenreach_save_v2`) into the first character; `saveGame` still mirrors the current character to the legacy key.
- `createChar({ name, job, look })` builds a fresh save with job-appropriate starting gear; `validCharName` enforces 2–12 letters and unique names; `MAX_CHARS` is 8; `deleteChar`, `selectChar`, `logoutToSelect` (saves, clears `current`, reloads).
- Boot (`main4.js`) initialises the renderer and atlas, then `showCharSelect` fills `#charSel` on the title screen. `showCharCreate` shows the name, job and appearance form with the live 3D preview (`attachPreview("ccPv")`, `UI.pv.override` makes `renderPreview` draw a prospective character without a helmet). `enterWorld(id)` loads the character, builds the zone with the progress bar, and starts the game; the click doubles as the audio unlock gesture.
- Appearance can't be changed after creation: the Settings appearance section is gone (`appearanceHTML` returns nothing).

### Chat commands
- The input under the chat log (`#chatIn`, `/` focuses it) runs `runCommand(text)`. Plain text is said (`say` class). Commands: /rest /heal /sit, /stand, /attack, /target name, /assist, /check, /cast, /ja, /ws, /item, /mount, /dismount, /jump, /time, /where, /clear, /help and the `EMOTES`. `COMMANDS` is the list shown by /help and the Help tab.

### Loading and versions
- Zone changes show the loading screen with a spinner ring around the crest and a bar driven by the incremental build (above).
- `build.mjs` writes `dist/version.json` (`{ version, built, title }`) and stamps `GAME_VERSION`. `initVersionCheck` fetches `version.json` next to the page (or from the GitHub raw URL when opened from a file) after 4 s, every 10 min and when the tab becomes visible; a newer version shows `#verPop` with Reload now (saves first) / Later. `showWhatsNew` shows the top `UPDATES` entry once per version (`localStorage["usr_seen_version"]`). System → Check for updates runs it by hand.
- Publishing: push `index.html` and `version.json` together; the GitHub Pages site at ianmcgo.github.io/Untitled-Solo-MMO serves both.

### Jumping
- `jumpPhase(e)` splits a jump into windup (0.11 s), air (0.64 s, sine arc, 0.9 m) and landing (0.22 s). `poseHuman` crouches, tucks the legs, raises then spreads the arms and lands in a crouch; landing plays the footstep and dust.

### Help and Updates
- `tabHelp` (H key, ❓ button) is built from the live data (XP table, NM table, quests, commands), so it stays accurate as data changes. `tabUpdates` (📰) renders `UPDATES`, the version log kept in `menu4.js`; add an entry per release.

### Tests
- `test/p5unit.js`: zone layout checks, Tab targeting, chains, landmarks, solid walls and pillars, NM cooldowns and pops, Rare duplicates, level-gated drops, rarity tiers, drop-rate bounds, companions catching up, Chieftain cooldown, resting vs standing, companions sitting, standing up on move, command aliases, /target, /check, unknown commands and plain speech.
- `test/p5shots.js <index.html> <out> <w> <h> <mobile> [scenes]`: drives character creation, logs in, screenshots jump frames, the town, resting, the version popup, the ruins, chains with an NM, the Den, the map, Help, Updates and the inventory, logs out and logs back in.

## Phase 5b: Paladin and Red Mage (v4.3.0)

- `JOBS.PLD` and `JOBS.RDM` carry `advanced: true`. `ADVANCED_JOBS` maps each to its Tobin quest (`pld`, `rdm`) and unlock level (6). `BASE_JOBS` is what character creation offers. `save.jobsUnlocked` records unlocks; `normalizeSave` also derives them from completed quests and resets a locked main or support job to WAR / none. `jobUnlocked(j)` gates `setJob`, the Jobs tab, support-job choice and `mercAvailable` (Dorn requires PLD, Lisette RDM).
- Tobin's dialogue builds an `adv` option list at level 6+ (ask / accept / turn in for each job) and appends it to every branch, so the support-job conversation never hides it. `giveReward` handles `reward.unlock`.
- New spell kinds: `debuff` (`castDebuff`: Flash always lands and draws `enmity`; Slow/Paralyze roll `magicHit` + 10) and `buff` (`castBuff`, Protect). Skills `enfeebling` and `enhancing` were added to `newSkillSet`, `MAGIC_SKILLS` and `SPELL_SKILL`. Effects: `stat()` applies Sentinel (def ×1.5), Protect (def ×1.15), Flash (acc ×0.6); `swingDelay(e)` applies Slow (×1.25) in `autoAttack` and `updateMob`; `swing` skips 25% of a paralyzed attacker's swings; `addEnmity` doubles under Sentinel.
- Abilities: Sentinel (buff), Shield Bash (`doAbility`: light damage, clears `readying`, interrupts casting, 350 enmity), Convert (swap HP and MP, clamped to maxima).
- Companion AI: tanks also use Flash when not on top or when it has worn off, Sentinel under 50% HP or when losing hate, Shield Bash on a readied TP move, and a self-Cure under 40% with no healer in the party. `hybridMagic` (role `hybrid`, Lisette) runs before melee: emergency Cure, Convert at low MP, keeps Dia/Slow/Paralyze on the target, bursts open skillchains, and nukes every 9–13 s above 60% MP. `mercGear` has PLD and RDM sets.
- Gear: swords, Ash Club, Scale Mail, robes and the NM pieces list PLD/RDM where classic MMO would. New items Kite Shield (accessory slot, `shield: true`) and Scarlet Tabard (RDM). `rig.js` draws a shield on the left forearm (`L.shield`), a cloth tabard with the job colour, a feathered hat (`L.hat` → `head.type "feathered"`), and the 5a drop gear.
- HUD: target chips for Flash/Slow/Paralyze with seconds left; icons for the new actions; level-6 banner hint.
- Tests: `test/p5bunit.js` (locks, Tobin flow for both quests, action lists, shield slot, Slow/Paralyze/Flash/Sentinel/Shield Bash/Convert effects, companions casting, save-file round trip). `p1bot.js` accepts PLD and RDM (unlocking them and hiring Lisette/Dorn).

## Phase 5c: quests (v4.4.0)

- `QUESTS` entries now carry `npc`, `lv`, optional `pre` (quest that must be done), and either `kill: { fam, n, name }` or `items: { id: n }`, plus `intro`, `progress` and `turn` text. Quests with those texts are handled generically: `questOptions(npcId, n)` builds the dialogue options (ask → accept, progress line, report → collect), `questOfferable`, `questComplete`, `acceptQuest`, `completeQuest` (removes items, sets done, `giveReward`). `giveReward` also takes `items: [[id, n]]` and `unlock`.
- Kill progress lives in `save.qprog[id]`; `onKO` increments it for any active kill quest whose `fam` matches the monster's `famKey` (NM keys work too) and logs the count, then "report to" at the target.
- Hand-written dialogues (Rhea, Pell, Brann) append `questOptions` to their option lists so every quest an NPC has shows in one conversation. Rhea's chain: Pouches → Bones in the Ruins (lv 4) → Grimtooth's Bounty (lv 6) and The Goblin Chieftain (lv 7) → The Warden's Vigil (lv 8, after the Chieftain). `questMarker` is generic for those quests.
- `questProgress` (tracker/journal) and the Phase 1 HUD handle kill/items quests generically; both hide quests you haven't accepted.
- Quest list (11): Pouches for the Captain, Herbs for the Stall, Night Wings, Bones in the Ruins, A Second Calling, Riding License, The Oath of Steel, Scarlet Lessons, Grimtooth's Bounty, The Goblin Chieftain, The Warden's Vigil. The Hollow King (P5d), Make It Home and Green Thumb (P6) come with their content.
- Tests: `test/p5cunit.js`.

## Phase 5d: the Sunken Crypt (v4.5.0)

- Zone `crypt` (2600×1400, theme `crypt`): `walls` carve the six rooms, `barriers` are doors (`brazier_gate` opens when `save.crypt.solved`; `throne_door` when `save.keyItems` has `crypt_key`); `barrierOpen`, `closedBarrierRects` (solid in `keepOutOfRects`), and a bump message with a 6 s cooldown in `updatePlayer`. `pillars` are drawn by `buildCrypt`, which also builds portcullis gates (`W3.barrierMeshes`, bars rise in `syncBarriers`) and the throne. Entry is a new south exit in the Den's Bone Pit.
- Theme `crypt` is treated like a cave for sky, fog and water but with a brighter cool fill, more torch lights, no crystals, few rocks, and its own terrain palette and map colours.
- Props: NPCs with `prop` (`brazier` + `element`, `tablet`, `chest` + `chest` table, `throne`) get a `propView` in `models3d.js` (flames and lights follow `brazierLit`, chest lids follow `chestState`, the coffer's chains show while sealed). They are targetable and talkable like NPCs; the minimap draws them.
- Braziers: `brazierOrder()` is a seeded permutation from `save.created`; the tablet reads `BRAZIER_LINES` in that order. `talkBrazier` lights the next brazier in order (stored in `save.crypt.lit`) or snuffs all and `spawnExtra`s two skeletons (`spawnIdx null`, no respawn). All four lit sets `save.crypt.solved`.
- Key items: `ITEMS[id].kind === "key"`; `dropLoot` routes them to `giveKeyItem` (`save.keyItems`, never duplicated, toast + log).
- Chests: `chestState` (sealed / empty / closed), `openChest` rolls `CHEST_LOOT[table]` (guarantees Crypt Dust), gives gil and sets `save.timers["chest:<id>"]` for 20 real minutes.
- Boss: `FAMILIES.hollow_king` (`boss: true`, `phases: [0.66, 0.33]`, `enrage: 0.2`). `bossPhases` runs each combat tick: summons two `royal_guard` per phase (`summonedBy`), enrage raises attack ×1.5, delay ×0.7 and sets `auraOverride` (red motes). `bossReset` on leash/return despawns guards and clears the enrage. `crypt_sentinel` is a fixed NM (600 s real-time cooldown) with the key in its loot. Names: `Hollow King` (the log adds "The").
- Quest `hollowking` (Rhea, lv 9, after Warden) is a generic kill quest; reward includes the Ashen Medallion (Ex).
- Rig: looks for the King (crown, cape, tabard), Sentinel (helm, mail, great axe) and Royal Guards.
- Tests: `test/p5dunit.js` (layout, exit, gate solid, brazier order/wrong/right, key drop, door, phases, enrage, coffer sealing, chest loot and refill, save round trip, cooldown). `p5shots.js` has crypt scenes.

## Phase 6a: residence, Pip, storage and the rest of the batch (v4.6.0)

- **Residence.** Door exit (`kind: "door"`) on the west cottage of the Outpost → `ZONES.residence` (theme `house`, indoor, 10×8 `grid`). `buildHouse` draws floor, walls, door frame, windows with lights and beams; `syncFurniture` rebuilds `W3.furnRoot` from `save.furniture` whenever it changes (`furnitureMesh` per `ITEMS[id].model`). Furniture is solid through `furnitureRects()` in `keepOutOfRects` (rugs are `flat`). Pip is a prop NPC (`prop: "nubbin"`) with its own view (bobbing fuzzball that faces the player).
- **Storage** (`save.storage`): `storageCap()` = `CONFIG.storageBase` + placed furniture `storage`; `storeItem(bagIdx)` / `retrieveItem(storageIdx)` respect stacks and capacity; key items can't be stored. Menu tab `storage` (via Pip).
- **Furniture** (`save.furniture` = `{ id, c, r, rot }`): `furnFoot`, `furnCells`, `furnFits` (bounds, `grid.blocked`, overlaps unless one piece is flat), `placeFurniture`, `removeFurniture` (refuses if stored items wouldn't fit), `rotateFurniture`. Menu tab `home` (via Pip) draws the grid; `furnishings` is Odette's shop (`FURNITURE_SHOP`). Quest `home` uses `check: "furniture"` (`QUEST_CHECKS`).
- **NPC schedules.** Outpost NPC entries carry `home` (house index) and `sleep: [bed, wake]` in game hours. `updateNpcs` walks a sleeping NPC to `npcDoor` (front of the house, by its rotation) and sets `away`; in the morning they reappear at the door and walk back to `post`. Away NPCs aren't drawn, labelled, targetable, talkable or on the minimap. `moveToward` now stops within `stop + 0.05` (a float edge kept NPCs 6.0000 px from the door).
- **Monsters.** `spreadSpawns` relaxes spawn points apart (170 px in the Hollow, 120 elsewhere) and out of walls/water at load; wander radius is 150 (field) / 90. Spawns can be `passive` (set for low-level goblins and worms in the Hollow): `buildMob` copies `aggro` per mob and `detects` reads `m.aggro`; passive mobs only fight when attacked and the target frame says "passive". Detection types and aggro decals are no longer shown (`updateAggroHints` disabled; setting removed).
- **Loot.** Only NMs drop equipment: regular family loot lists hold materials and consumables; the 5a drop gear moved onto the NM tables; chests hold materials and consumables.
- **Currency** text is "crystals" (💠); identifiers stay `gil`. **Home points** only in town (the Hollow crystal is gone; `normalizeSave` resets a non-town home).
- **Menus.** `MAIN_TABS` is character/inventory/skills/actions/quests/map/settings; Help, Updates, System and Credits are buttons under Settings (and keyboard H). System lost Controls/About (Help has controls). `tabCredits` and the title-screen `#ldCred` carry the maker's links. The Character tab lists only jobs with progress. `gameConfirm(title, text, onYes, opts)` replaces every `confirm()` (`#confirmBox`, Enter/Esc). The what's-new card after an update is a toast + log line.
- **Loading showcase.** Zone loading screens show a random subject from `LORE` (monster family, NM or NPC) rendered with the preview renderer (`startShowcase` / `renderShowcase` / `stopShowcase`, `showcaseEntity` fakes an entity for `buildEntityRig`).
- Tests: `test/p6unit.js` (door, Odette, bedtimes and returns, no talking indoors, Pip, storage cap, placement rules, Storage Chest capacity, quest completion, store/retrieve, pack-away refusal, rotation, solidity, save round trip, passive monsters, spawn spacing).

## Phase 6b: gathering, crafting, gardening (v4.7.0)

- `FEATURES.crafting/gathering/residence` are on; the shop now lists tools, crystals and raw materials.
- **Gathering.** On zone entry, `n` points per type are picked from `zone.gather[type].at` and created as prop NPCs (`prop: "gather"`, `gtype`, `uses` 1–3, `loot`) by `spawnGather`; `propView` draws an ore rock, log pile or herb patch, the minimap a coloured dot. `doGather` needs `GATHER[type].tool`, refuses in combat, rolls the loot (skill adds 1% per point), raises `save.gatherSkill[type]` (to 20), breaks the tool at `max(5, 25 − skill)`%, and on the last use `retireGather` hides it and queues a replacement at another free spot in `S.gatherAt` (45 s, `tickGather`).
- **Crafting.** `RECIPES` (existing data). `synthChance` = clamp(65 + 7 × (skill − lv), 5, 95); `synthHqChance` = clamp(5 × (skill − lv), 0, 50) when the recipe has `hq`. `canSynth` (not in combat, crystal and mats present, not casting/mounted), `startSynth` sets `player.synth` for `CONFIG.synthTime`; `tickSynth` cancels it if anything attacks you; `finishSynth` consumes the crystal, on success the mats and gives the item (HQ variant on the HQ roll), on failure loses about half of each mat at 50% each. Skill rises 0.1–0.5 (70% chance) on recipes within 2 levels below or above, to `CONFIG.craftCap`. The cast bar shows "Synthesizing …". Tab `craft` (key N, `/craft`).
- **Gardening.** `ITEMS.flowerpot` (`garden: true`, model `pot`) and seeds (`kind: "seed"`, `grows: { item | crystal, n, bonus, rare }`). `save.gardens[furnitureIndex] = { seed, stage, since, watered, crystal }`. `gardenTick` (twice a second) advances a watered plant one stage per `GARDEN_STAGE_MS` (10 min real time) and clears `watered`; dry plants wait. `plantSeed`, `waterGarden`, `feedGarden` (one crystal, sets the element), `harvestGarden` (+2 yield on a matching crystal; wildgrass gives crystals of the fed element; moonbloom rolls a rare material). `removeFurniture` refuses on a planted pot and re-indexes `save.gardens` when another piece is removed. `syncFurniture` draws sprout/leaves/flowers by stage, a glow if fed and a blue ring when it needs water. Controls live in the Arrange tab's detail panel.
- Quest `greenthumb` (Pip, `check: "harvest"`, `save.harvests`); `home` now rewards a flowerpot and herb seeds. `SEED_SHOP` is sold by Odette.
- **No pointless healing effects.** `castHeal` skips the cure effect at 0 HP restored ("No effect"); `useItem` refuses HP items at full HP and MP items at full MP; the crystal only sparkles if someone was hurt; regen motes only while something is actually missing.
- **Zone-change crash fix.** The loading showcase is skipped on phones, Low quality and low-memory devices, and `releasePreview()` disposes the preview WebGL context after loading, after character creation and when the Character tab closes, so only one extra context ever exists.
- Tests: `test/p6bunit.js`.

## Phase 7: test and tune (v4.8.0)

- **Performance.** `perfTick()` (called from `draw`) counts frames against `performance.now()` once a second. With `settings.adaptive` (default on) two slow seconds (< 28 fps) drop `W3.pr` by 0.15 (floor 0.6) and six fast ones (> 52 fps) raise it by 0.1 up to `W3.prCap` (the quality's pixel-ratio cap), via `setPixelRatio` + `resizeRenderer`. `settings.fps` (or `/fps`) shows `#fpsBox` (fps, render scale, draw calls). `settings.draw` (`near` / `normal` / `far` → `DRAW_DIST` 1000 / 1700 / 2600 px) is the monster culling distance in `syncEntity`, and name plates use 60% of it (max 900). Devices reporting `navigator.deviceMemory < 4` default to Low quality.
- **Balance.** `test/p1bot.js` now uses `/rest` when hurt (set `BOT_REST=0` to disable) and accepts `BOT_HOUR` to force the game hour. 30-minute runs: WAR/WHM/BLM reach 4–6 by day (0–1 defeats) and 4–6 by night (0–3 defeats). Night needs no extra tuning now that resting is fast.

## Version log

| Version | Change |
|---|---|
| 4.8.0 | Phase 7: performance settings and balance check (above). |
| 4.7.0 | Phase 6b: gathering, crafting, gardening; no heal effects at full; preview context released (above). |
| 4.6.x | Skin palette, creation preview fix, hair lists by sex. |
| 4.6.0 | Phase 6a: residence, Pip, storage, NPC schedules, passive monsters, NM-only gear, crystals, menu rework, in-game confirms, loading showcase (above). |
| 4.5.0 | Phase 5d: the Sunken Crypt (above). Creation labels sex instead of build. |
| 4.4.0 | Phase 5c: quests (above). |
| 4.3.0 | Phase 5b: Paladin and Red Mage (above). |
| 4.2.0 | Phase 5a (above). |
| 4.1.0 | Renamed the game to Untitled Solo RPG. Title screen shows version and build date/time (`package.json` version, stamped by `build.mjs`). Save keys unchanged. Source pushed to GitHub. |
| 4.0 | Phase 4 build: interface, audio, loading screens, jumping. |
