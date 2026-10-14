# Untitled Solo RPG — Design Notes

(Working title; the game was called Ashenreach until v4.1. Ashenreach Outpost is still the starting town and `ashenreach_*` localStorage keys are kept so old saves load.) A single-player MMO in one HTML file, built as a classic party-based fantasy MMO, with hired NPC companions instead of other players. Names, art and music are original. The full roadmap lives in the plan doc ("Ashenreach: Complete Game Plan"); this file explains how the code works and is updated at the end of every phase.

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
- Party size is up to 6 (you plus 5). Companions match your level and get gear for their level.
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

### Camera and controls (the genre style)
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
- **Appearance:** chosen once on the character creation screen (sex, skin, hair style by sex, hair colour) and saved with the character; it can't be changed afterwards.

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
- **Weapons are drawn only when needed**: in hand while engaged, casting or mid-swing, otherwise sheathed on the back. Monsters always hold theirs.
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
- The camera can pass through large objects (the Home Point Crystal, trees).
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
Each main job has its own two pages (`save.hotbars[job]`), like macro books. When you learn an action it drops into the first free slot automatically; page 2 starts with Potion, Ether and Hi-Potion. Slots show an icon tinted by type (spell element, weapon skill gold, ability green), the hotkey, MP cost or item count, a cooldown sweep with seconds left, dimming when unusable, a gold glow on weapon skills when you have 1000 TP, a "→ Fusion" style chip when a weapon skill would continue the open skillchain, and a "Burst!" chip on spells that would magic-burst. Actions your current job can't use stay on the bar but dimmed. Keys 1–0 fire the shown page, Shift+1–0 the other page, [ and ] switch pages. The Action Bar menu tab lets you place, swap, clear and reset slots, and items can be added from the inventory.

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
- Gear: swords, Ash Club, Scale Mail, robes and the NM pieces list PLD/RDM where the genre usually would. New items Kite Shield (accessory slot, `shield: true`) and Scarlet Tabard (RDM). `rig.js` draws a shield on the left forearm (`L.shield`), a cloth tabard with the job colour, a feathered hat (`L.hat` → `head.type "feathered"`), and the 5a drop gear.
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

## Hotfix 4.8.1: aggro, targeting, residence
- Aggro: only families with `aggro: null` (hare) are passive; the Hollow passive-spawn rule and PASSIVE_SPAWNS are gone. `detects()` sight: always within 60 px, else a ±81° cone (0.45π). Goblin sight 165; worm `{ magic: 130, sound: 90 }`. Hints stay off (`updateAggroHints` is `if (false)`).
- Target command box: `setTarget(e, quiet)` fires `uiEvent("target", e)` when the target changes to a live mob. hud4: `tgtCmdOpen/Close`, `renderTgtCmd`, `onTgtCmd(key)` render into `#tCmd` inside `#target` (pages root / ma / ja). Actions go through `playerAct`. `inspectText(t)` = con phrase + hostile/peaceful + NM. Clicking a mob in view3d always targets and opens the box (click again closes); Esc closes it first. `updateTarget` closes it when the target changes or dies.
- Levels hidden: `tLv` blank for mobs, names use neutral #f0d9a8 (NM #ff8a65), `/check` uses the inspect wording. `updateLabels` hides names on untargeted mobs/NPCs (quest NPCs keep a bare ❗).
- Quest offers: hud4 `openDialog` detects an Accept / "I'll handle him" / "I'll get them" option, appends "Will you accept this quest?" and labels Close "Decline". `#dlgText` is `white-space: pre-line`.
- Body: `look.height`, `look.girth` (0–4, default 2). rig.js `bodyProp(l)` turns them into `L.prop` (leg/torso/arm scale with height; girth, waist, shoulder, hip with build); `baseFromLook()` is shared by `playerBase()` and menu4 `lookBase()`. Creation rows Height / Build plus `data-rand` Randomize all (`randomLook()` in showCharCreate).
- Helmets (cap/helm/horned): dome ends at 0.37π and the brim ring sits at hc + 0.47 hr so the painted eyes (atlas face cell, y≈120) stay visible.
- Residence: terrain mesh hidden in the house theme (it z-fought the floor at y 0); ceiling beams removed; camera boom shortens when a sample leaves the room (14 px inset, y ≤ 3.1), min 0.9 indoors. Exits may carry `ask`: the step loop shows `gameConfirm` once per approach (`S.exitAsked`); the rules build (no gameConfirm) still walks straight through. Residence exit lands at x 288 so it no longer re-triggers the door.
- Location: `saveGame()` writes `save.loc {zone,x,y,face}`; autosave every 15 s plus pagehide / hidden tab. Login uses `resumePos()` (valid loc, else home point).
- Tests: p6unit now checks only hares are passive and a goblin aggroes on sight; p5shots has helm, door-ask, labels, tgtmenu, tgtmagic scenes.

## Phase 8: companions 2.0, bestiary, achievements (v4.9.0)
- Data (data.js tail): `COMPANION_CFG { dayMs 3456000 (one game day), wageRate 0.15, bondSteps [0,20,60,130,250,420], bondBonus 0.03, maxBond 5 }`, `MERC_PERSONAL[id][0..4]` (line said at each bond level), `MERC_LINES.gift`, `BESTIARY[famKey] { type, lore }` (15 entries: base families + NMs), `ACHIEVEMENTS [{ id, icon, name, desc, gil, test(save) }]` (29).
- Save: `stance`, `mercGear[id][slot]`, `bond[id]` points, `mercPaid[id]` (ms timestamp), `bestiary[k] { seen, kills, zones }`, `ach[id]` (unlock time), `nmKilled[k]`, `discovered` default [], `stats { kills, nm, sc, mb, crafts, hq, gathers, kos, jumps }` (merged in normalizeSave).
- Gear: `mercGearFor(id, lv)` = `mercGear()` defaults overlaid by `save.mercGear[id]` (pieces above your level are ignored). `mercCanWear`, `giveMercGear`, `takeMercGear`. Used by `syncAllies` and `rebuildParty`.
- Bond: `bondLevel`, `addBond` (onKO: +1 per XP kill, +4 NM, for every hired companion present). `buildStats` multiplies maxHp/maxMp/att/def/acc by 1 + 0.03·bond for allies.
- Wages: `hireMerc` sets `mercPaid = now + dayMs`. `tickWages()` (every 2 s): if expired and no fight, pay `mercWage(id)` = max(10, ceil(fee·0.15)) and set `now + dayMs` (offline time is free), else `dismissMerc(id, true)` with a message.
- Stance: `setStance(st)`; `updateAlly` passes no battle target on follow; on hold it runs the AI then restores the companion's position (they still swing at anything in reach and still heal/cast).
- Bestiary: `noteBeast(m, kill)` on target, on party kill, and from `scanBeasts()` (mobs within 320 px, every 0.5 s). Tab: seen → type, habitat (from zone spawns), lore; 1 kill → aggro senses, link, TP move; 5 kills (1 for NMs) → weaknesses, loot list.
- Achievements: `checkAchievements()` every 2 s; pays `gil`, logs, `uiEvent("ach")` toast. Counters hook skillchain close, magic burst, finishSynth (crafts/hq), doGather, player KO, view3d `tryJump`.
- UI: tabs party (P), bestiary (Y), achievements (O) in MAIN_TABS; commands /stance, /party, /bestiary, /achievements. Target command box `#tCmd` is its own glass panel at bottom right (header with name + ✕, then Fight/Magic/Abilities/Inspect; sub-pages show a ◂ back button). `#btnTarget`, `#btnEngage`, `#btnTalk` are hidden by CSS; `#btnJump` shows only on coarse pointers.
- Limbs: `RigBuilder.smoothJoints()` (run in `finish` when a rig has more than 6 bones) gives each non-glow vertex near a joint a second bone weight: own joint → parent, child joint → child, with radius/max per joint (`J` table: elbow 0.085/0.5, knee 0.095/0.5, wrist/ankle ~0.05, shoulder/hip/spine 0.075–0.1 at 0.35). anim.js walk: knee flex 1.0 (+0.35 running) in swing plus slight stance flex, toe-off foot roll, elbows bend 0.14–0.52 with the forward swing.
- Colliders: world3d `buildVegetation` resets `zone.colliders` and adds trees (r = 4.6·scale px); lamps and torches add r 4. game.js `keepOutOfColliders(e)` (called from `keepOutOfRects`) pushes bodies out using 0.55 × their radius. The rules build has no colliders (no trees).
- Residence stall fix: no window PointLights (one room light 14/26); `loadZoneAsync` awaits `renderer.compileAsync(scene, camera)` (6 s cap) before showing the zone.
- Element items renamed to Fire/Wind/Earth/Water Essence (ids still `*_crystal`, kind `crystal`, labelled "Essence"). Currency stays crystals.
- Tests: test/p7unit.js (wages, leaving, bond stats, give/take gear, stances, kill stats, bestiary, achievements, colliders). harness exports the new functions. p5shots scenes: walk, walk2, walk3, exit-home, party, bestiary, bestiary2, achieve, tcmd.

## Phase 9: level 15 and the Ashen Marsh (v5.0.0)
- CONFIG.levelCap 15; xpTable extended (4450, 5400, 6450, 7600, 8850). Stats grow linearly, so nothing else needed changing.
- Spells: cure3 (WHM 13), banish2 (WHM 15), stone2/water2/aero2/fire2/blizzard2 (BLM 11–15, stone2 RDM 15); cure2 now also PLD 11, RDM 14.
- Items: steel_sword, steel_greataxe, oak_staff, oak_club, chain_mail, wizards_robe, iron_helm, wool_hat (in SHOP); marsh_boots (quest), NM drops croaker_charm, gax_cleaver, mire_mantle; mats toad_oil, mire_reed. ITEM_LOOK entries added in rig.js.
- Families: bog_toad (sound), bog_leech (magic + lowhp, worm model with `tint`), mire_goblin (sight 175, linkGroup "mire"), drowned (ghoul model, sound + lowhp, night spawns), marsh_hare (critter, hare model with `tint`). NMs old_croaker (base bog_toad, day, lv 15) and mirelord_gax (base mire_goblin, lv 16). mobLook reads `f.tint` for worm/hare; goblinLook variants "mire" (hooded) and "gax" (horned, mail, cape, greataxe).
- Toad model: rig.js `toadEntry(col)` uses the hare's bone names (body/head/ear*/legF*/legB*) and meta.kind "hare", so it reuses the hare hop animation. Eyes sit on the ear bones.
- Zone `ZONES.marsh` (2800×2400, theme field, `palette: "marsh"`, `mist: true`), defined after the den exit push. Linked from Rocky Hollow's south edge (exit at x 1550) to the marsh's north edge (x 1350); Hollow got a path down to the exit. 6 landmarks, 30 spawns, 7 ponds, ruins (Drowned Chapel), 3 walls, gather points (mining 2, logging 3, harvesting 4).
- Visuals: textures.js TERRAIN_THEMES.marsh, chosen by `z.palette || z.theme`. world3d fog: zones with `mist` lerp the fog colour toward #8a9a8c and use near 16–30 / far 110–210 (night–day). `W3.mistColor` is cached.
- Quests: `mire` (Rhea, lv 10, 6 bog_toad, reward marsh_boots), `mirelord` (Brann, lv 13, pre mire, kill mirelord_gax). Rhea's first-offer dialog (pouches) now also lists questOptions.
- Bestiary +7 entries; achievements lv15 and marsh.
- Tests: test/p8unit.js (cap, spells at 11/15, exit link, marsh spawns, spacing, gather points, toad aggro, hare peaceful, quest flow). p1bot takes BOT_ZONE and BOT_LV (level 10 WAR in the marsh: lv 11 in 15 min, 2 defeats). p5shots scenes marsh, toad, marsh-night.

## Phase 10: Thief and Monk (v5.1.0)
- JOBS THF (dex/agi, no MP) and MNK (hp 76+15/lv, vit/str), both `advanced`. ALL_JOBS (and so ALL_J gear) includes them. ADVANCED_JOBS THF {quest thf, lv 6}, MNK {quest mnk, lv 6}. jobsUnlocked default has THF/MNK.
- Skills: new `dagger` combat skill (SKILL_NAMES, COMBAT_SKILLS). Ratings THF dagger A, MNK h2h A / staff B / club C; WAR and RDM dagger B, BLM dagger D.
- Weapon skills: quick_sting, venom_bite, gale_edge (dagger 5/22/40); twin_fist, rising_knee, iron_palm (h2h 5/22/40).
- Abilities: THF steal (lv 1, 90 s; chance 45 + 2·(DEX−AGI) + 3·lv diff, 10–85%; one try per mob via `t.stolen`; non-equip, non-key loot), sneak_attack (5; buff consumed by next swing: auto-hit, crit, +0.8·DEX), flee (10; ×1.8 run speed in updatePlayer). MNK boost (1; next hit ×1.5 and +100 TP), focus (5; +25 acc in `stat()`, +10% crit), chakra (10; heal VIT·3 + lv·8). Buff names/icons added.
- Passives: THF main +5% crit; Treasure Hunter (`dropLoot` chance ×1.2 when player.job is THF). MNK with h2h: Martial Arts in buildStats (dmg + 2 + 0.5·lv, delay ×0.8, min 1.6) and a 14% follow-up kick (re-entrant `swing` guarded by `a.kicking`).
- Unlock quests (generic, via Tobin; `adv.push(...questOptions("tobin", n))` at lv 6+): thf "Light Fingers" (3 goblin_pouch, 1 bat_wing → bronze_dagger + unlock), mnk "The Open Hand" (2 bone_chip, 3 healing_herb → leather_cesti + unlock). `giveReward` already handles `unlock`.
- Gear: bronze/iron/steel_dagger (lv 1/6/11, delay 1.9), leather_cesti/iron_knuckles/steel_claws (h2h, 2.6), brigand_vest (THF/RDM 5), training_gi (MNK 5). All in SHOP. JOB_TINT and ITEM_LOOK entries for the new jobs and bodies.
- Companions: wren (THF dd, 240) and tamsin (MNK dd, 260), `requires: { job }`. mercGear tiers for THF/MNK; MERC_BASE looks; MERC_PERSONAL lines. meleeAI now uses chakra (<50% HP), steal (once per mob in combat), focus/boost/sneak_attack when in reach.
- anim.js: fists (h2h or a player/ally with no weapon) take a boxing guard while engaged; attackKind "punch" already existed.
- Tests: test/p9unit.js. p1bot sets up THF/MNK (15 min: THF lv 5, MNK lv 7 with full party; MA damage trimmed to 2 + 0.5·lv after that run). p5shots scene monk.

## Phase 11: treasure pool, Trade Board, Forge (v5.2.0)
- Treasure pool: `dropLoot` sends equipment to `addToPool(id)` when the party has companions (S.pool entries `{ id, until, lots{mercId: roll|0}, mine: roll|0|null, seq }`, CONFIG.poolTime 45 s). `tickPool` (every step while non-empty): after 1.5 s each companion lots 1-999 if `poolUpgrade` (wearable and higher level, or same level with more dmg+stats) else 0; resolves once everyone has decided or time runs out (player auto-lots on timeout). Winner: player gets giveItem (+stats.lotsWon); a companion gets save.mercGear[slot] (old piece to your bag). All pass: lost. `lotPool(seq, pass)`. HUD `#pool` panel (above chat; phones higher) built by `updatePool()` with a change signature; uiEvent("pool") toast. The pool lives only in S (not saved).
- Trade Board: prop NPC `trade_board` (models3d `board` prop: posts, plank, roof, pinned notes) at Outpost (640, 300); TALK.talkBoard opens modal "board". `TRADE_REQUESTS` (14) and `TRADE_DAILY` 3; `boardToday()` picks 3 with a seed of save.created + UTC day; `save.board { day, done[] }` resets on a new day; `fillTrade(id)` pays gil + XP, stats.trades.
- Forge: NPC `garrick` (NPC_LOOK: bald, long beard, dark apron, club; home 2, sleeps 22-6.5) at (690, 640); TALK.talkGarrick opens modal "forge". `save.augments[itemId] = [[stat, value], ...]` (max 2, `AUGMENT_STATS` ranges, `STAT_LABELS`). `augmentCost` (60/lv, reforge 40/lv, mats iron_ore + fire_crystal), `canAugment`, `augmentItem(id, reforge)` (reforge rerolls the same count without duplicate stats). buildStats adds augments only for `ch.kind === "pc"` (the player and statsFor copies). Inventory detail shows augments.
- cycleNpcTarget skips props. Achievements trader, augment, lotwin. Tests: test/p10unit.js; p5unit/p6unit adjusted (7 townsfolk with bed times).

## Phase 12: fishing and weather (v5.3.0)
- Weather: data `WEATHER[zoneId] = [[kind, weight], ...]` (outpost, hollow, marsh; other zones have none) and `WEATHER_INFO[kind] { name, icon, nightIcon?, el? }`. game.js `weatherNow(zoneId)` picks by a seed of zone + 3-game-hour slot (about 7.2 real minutes), so it is the same for everyone and survives reloads. `weatherElement()`; nukes get ×1.1 when the spell element matches (stacks with the day element). `/weather`. HUD clock shows the weather icon.
- Weather visuals (world3d `updateSky`): `gloom` (rain/storm 0.55, cloudy 0.35, fog 0.3) dims the sun and greys the fog; fog ×0.45 and rain ×0.7 on fog distances; wind/storm speed up cloud drift (`W3.cloudOff`); storm lightning flashes add to hemi intensity for 0.18 s with sfx("lightning"). `updateRain(amt, windy)`: a LineSegments rain box (700 drops on low, 1600 otherwise) following the camera, recycled when below ground.
- Fishing: items fishing_rod (kind use, `fishing: true`; useItem starts fishing; can go on the action bar), bait (mat, 1 per cast), fish pond_minnow, moat_carp, silver_shad, lakeking_pike (rare), mud_eel, bog_perch, ghost_koi (rare). `FISH[zoneId] = [[id, lv, weight, weather?]]`, `FISH_CFG { waitMin 3, waitMax 9, bite 2.4, reach 70, cap 20 }`.
- Flow: `startFishing()` (needs rod, bait, `nearWater` within r + 70 px, no fight, not mounted) sets `S.fish { state: "wait", at, x, y }` (rain/storm wait ×0.75). `tickFish()` turns it to "bite" for 2.4 s (uiEvent "bite"), then escape; moving > 6 px, fighting or changing zone cancels. `reelFish()` picks a fish (weather-gated entries), success 62 + 6·(skill − lv) clamped 12–95, skill-up chance, stats.fish / bigFish. `/fish` casts or reels.
- UI: `#fishBox` (center bottom; pulses gold on a bite) with Reel/Stop; Space, Enter or F reels during a bite (main4 onKey). Skills tab now lists Mining, Logging, Harvesting and Fishing. Trade Board gained fish requests (t_carp, t_eel). Achievements angler, bigcatch.
- Tests: test/p11unit.js (weather variety, none indoors, stable slot, rod/bait/water checks, catch, skill, escape, walk-away). p10unit clears requested items first so starting potions don't satisfy a request. p5shots scenes rain, fog.

## Hotfix 5.3.1: storage fallback and title screen
- Cause of "Begin your journey returns to the create screen" on phones: localStorage writes threw (quota full; every page on ianmcgo.github.io shares one origin's storage), so createChar saved nothing, selectChar failed and the empty roster sent the player back to creation. Reproduced in Playwright by making setItem throw for usr_ keys.
- game.js `STORE { get, set, remove }` wraps localStorage. On a failed set it removes the legacy CONFIG.saveKey copy and retries, then falls back to an in-memory `MEM_STORE` and sets `S.storageFull` (one log line). All roster/char reads and writes go through STORE. `saveGame` no longer writes the legacy CONFIG.saveKey copy once a character id exists (it is still read once for migration). enterWorld logs and toasts a warning when S.storageFull.
- Title screen: boot ends in `showTitle()` (loading screen in "ready" state with #ldStart "Press Start", tap or any key) which then calls `showCharSelect()`. p5shots clicks #ldStart first and saves a -title shot.

## Phase 13: food and cooking, cleaner HUD (v5.4.0)
- CRAFTS.cooking (fire essence); 7 recipes r_grilled_minnow ... r_pike_feast (lv 0-16, 2-3 servings). Mats grain_flour, rock_salt in SHOP. Food items `kind: "food"` with `food: { stat: bonus }`.
- `eatFood(id)` (no eating in a fight) stores `save.food { id, until (Date.now based) }`, CONFIG.foodMinutes 30, stats.meals; useItem routes food there. buildStats adds the food bonus for `kind === "pc"` while active. `tickFood()` (every 2 s) keeps a `player.buffs.food` mirror (BUFF "Well Fed" 🍲) and clears it on expiry with a refresh. `foodText()` formats bonuses with STAT_LABELS. Inventory shows Eat + bonus line; foods can go on the action bar; /item finds foods. Trade requests t_stew, t_bread; achievements fed, chef.
- HUD: `#actionBar` is a wrapping flex row; `#actionBar .slot.empty` is hidden (the menu's .barEdit still shows empty slots); an empty bar shows a hint via :has(). Removed the solo tip (#soloTip) and the top-right Quests/Sound buttons (J and Settings remain).
- Tests: test/p12unit.js. Helper scripts used per release: build 1 + all unit tests, then build 4 + copy + commit + push.

## Phase 14: Saltreach Harbor (v5.5.0)
- Zone `ZONES.harbor` (1400x1000, safe, theme town), defined just before ZONES.marsh. Linked: marsh south exit (x 2200, y 2376) to harbor north exit (x 450). Marsh got a path to its exit. Sea = three big water circles off the south edge; plaza, 5 houses, 2 stalls, 5 lamps. New zone fields `docks: [[x, y, w, h]]` (plank deck + posts) and `boats: [[x, y, rot]]` (hull, mast, sail) built in world3d `buildTown`.
- NPCs: ilsa (quests; talkIlsa), marn (shop "marn"), vela (shop "vela"), crystal_harbor (home point; normalizeSave accepts any safe zone crystal), and the shared `trade_board` id (same board, same daily requests). NPC_LOOK entries for the three.
- Shops: `SHOPS { marn, vela }` + `SHOP_NAMES`; `shopList(kind)` falls back to SHOP (Pell). Talk handlers set `S.shopKind` before opening the shop modal; tabShop reads it.
- Items: sea_rod (fishing; +10 catch chance; startFishing accepts either rod), harbor_bream, sea_bass, tidecaller_tuna (rare; stats.tuna), grilled_bass food + r_grilled_bass (Cooking 12), level 13-14 gear (tidesteel_sword, boarding_axe, coral_staff, tidesteel_dagger, shark_claws, harbor_mail, sailcloth_robe, corsair_jerkin, gull_hat), tide_ring (quest reward).
- Quests: catchday (Ilsa, lv 6, 3 harbor_bream, sea_rod), saltsteel (Ilsa, lv 12, 5 mire_goblin, tide_ring). FISH.harbor, WEATHER.harbor. Achievements harbor, tuna.
- Tests: test/p13unit.js. p5shots scenes harbor, harbor2.

## Phase 15: mounts and gear fit (v5.6.0)
- FEATURES.mounts true (the riding system already worked; the flag is informational). `mountMul()` = CONFIG.mountSpeed x SADDLE_BONUS (1.15) if save.saddle; used for player, click-move and ally follow.
- Coats: `MOUNT_COATS { teal, crimson, sable, gold, ivory }` (main/dark/glow colors, price). rig `thornstriderEntry(coat)`, `buildMount(coatId)` caches per coat ("thornstrider|id"). models3d rebuilds a rider's mount when `save.mountCoat` changes (all riders use the player's coat; the stable decor stays teal). save.coats (owned), save.mountCoat, save.saddle. `buyCoat`, `buySaddle`; modal "stable" (tabStable) from Ysolde's dialog.
- Hollow Run: `RACE { zone hollow, start, checkpoints[5], radius 90, limit 75, medals [[gold,26,1200],[silver,36,600],[bronze,50,300]] }`. `startRace()` enters the Hollow at the start and mounts the party; S.race { t0, next }. `tickRace()` (each step) checks zone/mounted/alive/time, advances checkpoints, finishes with best time (save.race.best) and first-medal payouts (save.race.medals). enterZone clears a race when leaving the course zone. HUD #raceBox (timer, next checkpoint, distance), minimap gold dot, models3d `syncBeacon()` gold column + ring at the next checkpoint. stats.ride accumulates mounted movement /20. Achievements racer, rider.
- Gear fit (rig.js humanEntry): belt and robe sash rings use the hip radius (0.152 / fem 0.165x1.08, x gi) + 6 mm and are squashed to 0.72 depth like the body lathe; buckle sits on the front. Robe skirt halves start at the hip radius and flare to 0.23, depth 0.78; tunic/mail skirts depth 0.76. Pauldrons 0.068 radius, lower on the shoulder. Weapons scaled after build (sword 0.86, staff 0.84, greataxe 0.86, club 0.9; tips scaled too). Sheathed weapons sit at `meta.backZ` (chest depth + 3 cm) instead of a fixed -0.19.
- HUD: #btnMount shows only on coarse pointers when licensed (class "has"); minimap mob dots no longer use con colors.
- Tests: test/p14unit.js; p5shots scenes stable, race, race2, lineup, lineup2, fitBLM, fitBLMside, fitWAR, fitWARfight.

## Phase 16: Ranger and Summoner (v5.7.0)
- JOBS RNG, SMN (advanced; ADVANCED_JOBS quests rng/smn at lv 6 through Tobin's generic questOptions). ALL_JOBS includes both. Skills: COMBAT archery, MAGIC summoning; ratings RNG archery A, SMN summoning A; WAR archery D, THF archery C.
- Ranged: `reach(e)` = CONFIG.bowRange 230 for wtype archery, else meleeRange; used by autoAttack, player chase, meleeAI approach, ally WS and WS checks. Mobs are unchanged (they still need melee range). swing(): archery fires vfx("arrow") (particle streak in effects3d) and consumes the `barrage` buff to loose 3 swings (guarded by a.volley). `sharpshot` adds +40 acc in stat(). `shadowbind` sets mob buffs.bind (12 s); updateMob skips moveToward while bound. WS piercing_arrow / flaming_volley / gale_arrow (archery 5/22/40). Bow weapon model kind "archery" (curved limbs, grip, string; steel/yew tints).
- Summoner: spells ember_sprite / frost_sprite / gale_sprite (kind "summon", target "self"; resolveTarget returns the player). `summonPet` builds an ally `{ pet: true, petKey, job "MNK" stats, role "pet" }` in S.pet and S.party (meleeAI fights). `PETS[key] { name, el, col, eye, pact, weak }`. `tickPet` drains 1 + lv/6 MP every 3 s and releases on 0 MP, death, job change or not SMN; mounting or starting a race releases it. rebuildParty keeps S.pet; syncAllies rebuilds pet stats at your level. Abilities release, blood_pact (24 + 7·lv + 1.2·INT + 0.8·summoning skill, x element weakness, dealt by the pet), siphon (MP 20 + 3·lv). Pet model = batEntry(col, eye) via rigSigFor "pet|key"; party frame tag "Sprite".
- Gear: shortbow, yew_bow, steel_longbow, hunters_coat, sprite_staff, evoker_robe (SHOP). Companion corin (RNG dd) with mercGear tiers and MERC_PERSONAL. Achievements summoner, sniper (stats.summons, stats.rngKills).
- Tests: test/p15unit.js; p5shots scenes ranger, summoner.

## Phase 17: battlefield and HUD moves (v5.8.0)
- Battlefield zone `ZONES.depths` (1200x900, theme crypt, `battlefield: true`): corner walls, 4 pillars, a pool, exit west to the marsh. Spawn `{ fam: "tide_priest", lv 16, bf: true }`; `spawnAllowed` blocks `bf` spawns unless `S.bf` is active and not won. Bosses don't leash in battlefield zones.
- Entry: prop NPC `chapel_door` (tablet prop) pushed onto ZONES.marsh at (600, 2120); TALK.talkChapelDoor; `enterBattlefield()` consumes a `chapel_sigil`, enters at the zone start, sets `S.bf { t0, until (+15 min), won }` and schedules the boss 3 s later. `tickBattlefield()` (per step): wipe/KO clears S.bf, timeout sweeps you to the marsh, boss death after it was seen calls `winBattlefield()` (kills leftover adds, gives one un-owned item from BATTLEFIELD.rewards, 1500 gil, 3000 XP, stats.bfWins, uiEvent "bf"). enterZone away from depths clears S.bf.
- Boss family `tide_priest` (hpMul 3.2, attMul 1.1, delay 3.6, TP move Drowning Tide AoE 1.6, weak lightning/light, phases [0.65] with `adds: "drowned"` and `addsText`, `pulse { at 0.5, every 22, dmg 4·lv, r 170, Maelstrom, water }`, enrage 0.2). bossPhases now reads `f.adds`/`f.addsText` (default royal_guard) and runs the pulse. Tuned with a rules-build sim (lv 15 WAR + 5 companions at skill cap: 5/6 wins in ~70 s). Look: skull, hooded teal robe with glowing trim, staff. Bestiary entry.
- Items chapel_sigil (Drowned 12% drop, Vela shop), tide_crown, abyssal_staff, drowned_blade, priest_mantle, tidebreaker_bow (nm, epic). `BATTLEFIELD { zone, minutes 15, rewards, gil, xp }`. Achievement priest. HUD #raceBox doubles as the battlefield timer.
- HUD: the player's party frame has a 4 px XP bar (`#pfXp`); the bottom XP bar (#xpbar) is hidden; on phones #xpRow is hidden, the chat sits bottom-left (width 100vw - 3 slots - 60, max 60vw) and the action bar is 3 wide, wrapping upward. Minimap shows mobs only within 360 px, targeted, or fighting the party.
- Creation defaults: male, skin index 1, first male hairstyle, average height and build.
- Tests: test/p16unit.js; p5shots scenes chapel, depths, depths2.

## Phase 18: level 20 and Frostspire Pass (v5.9.0)
- CONFIG.levelCap 20; xpTable adds 10200, 11650, 13200, 14850, 16600. p8unit now checks cap/table consistency instead of a fixed 15.
- `ZONES.frost` (3000x2400, theme field, palette "snow" in TERRAIN_THEMES): west exit to harbor (1330, 430); harbor east exit at (1376, 380) to (110, 1200). Landmarks gate, icefall, frozenlake, cairns, summit. Four rock walls; cairn ruins. Spawns lv 15-20; NMs rimefang (Icefall, any time, lv 21) and frost_wight (cairns, night).
- Families: snow_hare (peaceful, day), ice_bat (sound, night, link), frost_goblin (sight 185, link, goblinLook "frost"), ice_wight (sound + lowhp, night, skeleton icy look), glacier_worm (magic). All weak to fire. Bestiary entries for all + NMs.
- WEATHER.frost: snow, clear, blizzard, cloudy, fog. WEATHER_INFO snow/blizzard map to element ice. world3d `updateRain(amt, windy, snow)`: snow uses white slow particles; snow is a separate `W3.snow` Points cloud (`updateSnow`, round `flakeTex`, swaying drift; windy = faster, sideways) and rain is hidden; blizzard multiplies fog distance by 0.22 and snowy gloom lerps fog toward 0xc4ccd4. Snow palette: lake drawn as a still ice disc (pale, low roughness), 85% pines, foliage tinted and lifted by emissive for a frosted look, minimap uses snow colors and an ice lake.
- Spells cure4 (WHM 19), thunder2 (BLM 17), fire3 (BLM 20), stone_sprite (SMN 15, PETS.stone). Ability warcry (WAR 15): `buffs.warcry` on party members within 300 px; stat() multiplies att by 1.2.
- Tier-4 weapon skills at skill 75 (vorpal_arc, shadow_fang, moonfall, earthshaker, ruinous_cleave, thousand_palms, starfall_arrow).
- Items frost_shard; Frostforged gear lv 16-17 + fur_hat in SHOPS.vela; NM drops rimefang_axe, frost_ring, wight_shroud. Quest frozencargo (Ilsa, lv 16, 6 frost_goblin, fur_hat). Achievements lv20, frost.
- Tests: test/p17unit.js; p5shots scenes frost, blizzard. harness exports WEAPON_SKILLS.

## Phase 19: Adventurers' Guild (v6.0.0)
- NPC `maera` (outpost 455,255; sleeps 22.5-6.5; rig look in rig.js) -> TALK.talkMaera -> modal "guild" (tabGuild in menu4; TAB_INFO.guild). questMarker shows for her when a bounty is ready or before the first bounty (lv 2+).
- Data: GUILD_RANKS [name, totalPoints, color] Copper 0 / Bronze 100 / Iron 300 / Silver 700 / Gold 1500 / Mythril 3000. GUILD_BOUNTIES {id, fam, n, where, lv, gp, tier, nm?} tiers 0-4 across all zones; NM hunts n 1. GUILD_SHOP {id, gp, rank}. GUILD_DAILY 3, GUILD_ACTIVE 3.
- Save `guild { gp, total, active: {id: kills}, day, done: [] }`; normalizeSave fills it for old saves. stats.bounties.
- game.js: guildRank(total), guildDay() (resets done on a new UTC day, shared boardDay), guildToday() (seeded by created + day + rank; first pick from tiers >= rank-1, rest from all tiers <= rank), bountyReward (gil = gp*8, xp = gp*(lv+2)*2), takeBounty/dropBounty/turnInBounty/guildBuy, bountyKill(e) called in the kill handler after dropLoot (matches famKey, works for NM keys). Rank-up -> uiEvent "guildrank" banner. Guild gear is ex (one owned).
- Items guild_ring (Bronze), pathfinder_boots (Iron), silver_insignia (Silver), guild_greatcoat (Gold), mythril_crest (Mythril). Achievements bounty, silver, mythril.
- Tests: test/p18unit.js; p6unit townsfolk bed count now >= 7. p5shots scenes maera, guild.

## Phase 20: Dark Knight and Bard (v6.1.0)
- Jobs DRK, BRD (ADVANCED_JOBS lv 10; quests drk "The Shadowed Path" (2 crypt_dust, 3 bone_chip → bronze_scythe) and brd "A Traveler's Song" (3 mire_reed, 2 bat_wing → minstrel_coat), both from Tobin). jobsUnlocked gains DRK/BRD.
- New weapon type `scythe` (COMBAT_SKILLS, SKILL_NAMES): WS slice 5, nightreap 22, spiral_reap 40, grim_harvest 75. Items bronze/iron/steel_scythe (Pell SHOP), rime_scythe (Vela). Rig weapon kind "scythe" (pole + curved extruded blade), held/stowed like the greataxe and uses the cleave animation.
- New magic skills `dark` and `singing`. Spells may carry `skill` which spellSkill() returns first.
- DRK: abilities last_resort (att ×1.25, def ×0.85), soulfire (each swing burns 6% current HP, adds 1.6× that to damage), blood_blade (heals 40% of melee damage). Spells blight (kind dot, buff "blight": ticks like dia with its element; att ×0.9 on the target), drain (kind drain), mind_drain (kind aspir; 60% amount to MP), stun (debuff "stun", 4 s, cancels readying and halves TP). castDia generalized by sp.element / sp.buff. castDrain handles drain/aspir.
- BRD: songs are spells with kind "song", `song` key (minuet, paeon, ballad, madrigal, march), `pow`, dur 120. castSong → applySong for party within 300 px; each member keeps at most 2 song buffs (oldest by expiry dropped). pow scales ×(1 + singing/400). stat(): minuet att ×(1+pow), madrigal acc +pow; swingDelay ×(1−march.pow); tickBuffs: paeon HP and ballad MP every 3 s (pow×(1+lv/5), MP half). Encore (BRD 15) cuts song cast time to 34%. drowsy_lullaby: debuff "sleep" 30 s, bosses immune; sleeping/stunned mobs skip their combat step; any damage > 0 clears sleep (applyDamage).
- Gear access: a loop after ITEMS adds DRK to WAR swords/great axes and WAR armor, and BRD to all daggers and RDM armor. New armor shadow_plate, minstrel_coat, troubadour_coat (+ ITEM_LOOK), JOB_TINT for both jobs.
- Mercs mordrin (DRK dd: meleeAI uses drain under 60% HP, stun on readied moves, blight, and the DRK self-buffs) and lyra (role "bard": bardAI picks the 2 best known songs by priority, refreshes when any nearby ally lacks one or < 12 s left, sings Paeon/Ballad out of combat when people are hurt/low MP, lullabies a second monster; otherwise meleeAI). mercGear entries for both; MERC_BASE looks; MERC_PERSONAL lines.
- Tests: test/p19unit.js; p1bot supports DRK/BRD (merc orders include lyra/mordrin). harness exports MERCS. p5shots scenes drk, brd.

## Phase 21: main story (v6.2.0)
- `STORY` (data.js): 8 chapters {name, lv, reward, steps[]}. Step types: talk {npc, text[]}, visit {zone, lm, text[], key?, summon?}, kill {fam, n}. `goal` is the Quests-window line. Chapter lv gates step 0 only (storyReady).
- Save `story { ch, step, prog, done }` (normalizeSave fills it). game.js: storyChapter/storyStep/storyReady/storyWants, storyScene (paged openDialog, last page "Continue"), advanceStory (gives step.key key item, moves on, chapter reward via giveReward + uiEvent "story" banner + checkAchievements; when a visit step has `summon`, summonStoryFoe(fam) replaces that NM spawn's mob and spawns the NM immediately), storyKill (kill handler), tickStory (per step: visit steps fire when inside the landmark radius and no dialog is open).
- talkTo plays the story scene instead of the NPC's normal dialog when that NPC has the current talk step (talk again for the normal menu). questMarker shows for that NPC.
- spawnMob NM roll: if storyWants(nm id) the NM spawns with chance 1 and ignores its timer.
- New NM ashen_herald (base ice_wight, lv 22, hpMul 5.5) on a new frost spawn at the summit (2700, 330; nm chance 0, story only). Drops cinder_mantle (epic body). Items ashen_shard (key), ember_ring (final reward). Achievement story.
- Quests tab shows storyBlock() above quests. Story icon is 🕯️; scene buttons read Next / Continue. Tests: test/p20unit.js (p8unit sets story.done so Rhea's normal dialog shows); p5shots scenes story, storyq.

## Phase 22: auction house (v6.3.0)
- NPCs corvin (outpost 430,430) and selene (harbor 560,420) → TALK.talkAuction → modal "auction" (tabAuction: views buy / sell / lots; UI.ahView, ahCat, ahSel, ahQty, ahPrice, ahMsg). Rig looks in rig.js.
- Data: AH_CATS (materials, consumables, weapons, armor), AH_CFG { fee 0.03, maxListings 7, checkMs 60000, expireMs 3 h, tickMins 360 }, AH_NEWS (boom/bust lines per category). Achievement auction (10 sales).
- Tradable: price > 0, not rare/ex/nm/key/furniture (ahTradable). Category: equip main → weapons, other equip → armor, food/use → consumables, else materials.
- Price: marketTick() = game minutes / 360 (6 game hours ≈ 14.4 real min); marketDay = tick·360/1440. marketMult = 1 + 0.16 sin(0.83t + p1) + 0.09 sin(0.31t + p2) + 0.05 sin(2.1t + p1p2) (phases from hashStr(id)), ×1.2 for the day's news "up" category, ×0.85 for "down". Player pressure save.market.press[id] {v, tk} (−0.3..0.4) decays ×0.85 per tick; buying +0.03/unit, a lot selling −0.02/unit. Items in SHOP/SHOPS (inShops, cached in S.shopSet) are capped at 95% of shop price (no buy-from-shop/list arbitrage). priceHistory(id, n) for the sparkline.
- Stock: ahStock seeded by id + market day (1-8 by price band, materials/consumables get extra); bought counts in save.market.bought {day, n}.
- Listings save.market.listings [{id, qty, price, t, next, exp}]: ahList takes the fee and items; tickAuction (every 1 s of game step while listings exist) rolls each overdue minute: saleChance = clamp(0.25·(1.1·market/unit)^3, 0.01, 0.85); sale pays gil, stats.ahSold, toast uiEvent "ahsold"; expiry or ahCancel moves the lot to save.market.box; ahCollect returns box items. Works offline because checks run on Date.now catch-up (≤300 per lot per pass).
- normalizeSave fills save.market. menuSig includes listing/box counts and marketTick so the window refreshes.
- Tests: test/p21unit.js; p5shots scenes ahbuy, ahsell (use onMenuClick).

## Phase 23: races and the City Blessing (v6.4.0)
- `RACES` (data.js): human, elari, pipkin, ursan, nekari {name, icon, sex (null | 0 | 1 forced), hp, mp multipliers, speed, attrs {stat: delta}, attMul?, rangedAcc?, blurb}; RACE_ORDER. save.look.race (default human; createChar forces build for single-sex races). buildStats: attrs scale ×(1 + lv/20), HP/MP multipliers (MP only if the job has MP), attMul, rangedAcc when wtype archery, player.speed = 140 × race speed.
- Body: rig.js RACE_BODY[race][build] base proportions (leg, torso, arm, girth, waist, shoulder, hip, headR, neck); bodyProp applies the height/girth sliders on top. Proportions were sanity-checked against reference meshes (ursan ≈ 1.25× human height/1.5× girth, elari ≈ 1.1×, pipkin ≈ 0.5× with a big head). baseFromLook adds race features: elari pointed ears, pipkin stubby ears, nekari cat ears (hidden under helm/hood/horned) + "cat" tail, ursan round bear ears, short beard and thick "ursan" tail. Tail bones tail/tail2 on hips; anim.js wags them (faster when running).
- Creation: Race row (cycles RACE_ORDER, shows blurb; Sex row locked for single-sex races); random look picks a race. Roster cards and the character sheet show the race.
- City Blessing: NPCs guard_east (outpost 985,345), guard_north (harbor 530,80), guard_pass (harbor 1330,340); rig looks guard/guard_f (tabard, helm/cap). TALK.talkGuard → giveBlessing(): save.blessing = now + blessingMinutes() (BLESSING.baseMin 60 + perRankMin 30 × guild rank, max 210), buff "blessing" mirrored from Date.now by tickBlessing (runs with tickFood). dropLoot skips kind "crystal" unless blessed() and xpFor(m.lv, player.lv) > 0. questMarker shows ❗ on guards while unblessed. stats.blessings.
- Tests: test/p22unit.js; p5shots scenes race_*, guard.

## Phase 24: pets (v6.5.0)
- `BUDDIES` (data.js): id → {name, icon, model (hare | bat | wisp | worm | goblin), col, eye, scale, perk {k: v}, lore}. BUDDY_PERK_TEXT renders perks. BUDDY_SHOP [[id, price]] sold by Ysolde (Pets window shows her pens when she is within 200 px). Pet items are ITEMS kind "pet" with `pet: id` (egg_*), used from the bag → learnBuddy. Sources: NM loot (rimefang snow kit, duskwing shade kit, gax pocket goblin, herald ember wisp), FISH.harbor egg_tide_wisp, GUILD_SHOP egg_frost_wisp (Iron), story completion learns ash_sprite. Achievement petkeeper (5).
- Save: buddies [], buddyNames {}, buddy (equipped id), buddyOut. normalizeSave filters. S.buddy is the live entity {kind "buddy", buddy: true, petId, name}: not in S.party or S.mobs (no enmity, untargetable; view pick hidden; labels skipped). view3d draw/alive checks and updateLabels include S.buddy.
- game.js: learnBuddy, equipBuddy (re-summons if out), nameBuddy (2–12 letters), summonBuddy/dismissBuddy/toggleBuddy, buddyPerk(k) (0 unless out), tickBuddy (follows a point 26 px behind and 34 px beside the player, 1.5× speed when > 120 px, teleports > 650 px, wanders a little when idle, dismissed in battlefields/KO), /pet command, hotbar cmd "pet" auto-added once a pet is owned (hud4 hotbar(), petAdded flag). enterWorld re-summons when buddyOut.
- Perks wired: xp (gainXp), rest (restTick multiplier for the player), eva/mp (buildStats), gather (doGather), fish (reelFish chance), sell (sellPrice), drop (dropLoot), craft (synthChance).
- Rig: rigSigFor "buddy|id"; buildEntityRig picks hareEntry/batEntry/wispEntry (new: glow orb with trailing tails, bat pose)/wormEntry/goblin humanEntry without weapon or sack; viewFor scales by BUDDIES.scale.
- Tests: test/p23unit.js; p5shots scenes pet, pet2, pet3, petmenu.

## Phase 24b: pet and reward changes (v6.5.1)
- Pets give no bonuses: buddyPerk() always returns 0 (call sites kept for future use), BUDDIES entries have no perk, BUDDY_SHOP is empty (Ysolde's pens and the guild egg removed). Pet items are very rare drops: hare/bat/worm/ice_bat loot 0.4–0.5% (egg_meadow_kit, egg_batling, egg_wormlet, egg_frost_wisp), NM eggs 3–8%, egg_tide_wisp fish weight 0.03. Ash Sprite still from the story.
- No XP for landmark discovery (checkLandmarks no longer calls gainXp; toast has no XP line) and no crystals for achievements (ACHIEVEMENTS entries have no gil; checkAchievements/toast/tab show none).

## Phase 25: critter families (v6.6.0)
- New rig entries (rig.js): beeEntry(col, col2) striped body + 4 membrane wings, kind "bee"; crawlerEntry(col, col2) 6 segments t0..t5 + head, side legs, kind "crawler"; quadEntry(o) generic four-legged rig (body/neck/head/tail/tail2, legF*/shinF*/legB*/shinB*) used by sheepEntry (wool balls, hooves), lizardEntry (scale region, spines, glow eyes, long tail) and longneckEntry (tall), kind "quad" with meta.quad.stride; crabEntry (flat shell, 2 arms+claws, 8 legs), kind "crab"; mandrakeEntry (round body, leaf crown bone "leaf"), kind "mandrake"; shroomEntry (stalk + part-sphere cap with spots), kind "shroom"; fishEntry (hovering body, fins, tail2), kind "fish". mobLook maps fam.model to these kinds with tint/tint2; buildEntityRig makes the entries; models3d dispatches poseBee/poseCrawler/poseQuad/poseCrab/poseMandrake/poseShroom/poseFish (anim.js). Stride per kind in viewFor.
- Poses share the trackEvents contract (spd, ph, aStart, hitStart, readying, dead): bee flutters at 40 Hz and lunges; crawler undulates and rears for a strike; quad trots with diagonal pairs, grazes when idle, wags tail; crab scuttles sideways, snips, pinches with alternating claws; mandrake hops; shroom bobs and headbutts; fish hovers 0.1 above ground and leaps.
- Families (FAMILIES): honey_bee, grass_crawler, meadow_sheep, hill_lizard (scale 1.3), pond_crab, mandrake, shroomling, lake_snapper (Rocky Hollow, lv 1–6), longneck (marsh 11–13). All aggro null (passive); bees/sheep/mandrakes link. TP moves: `slow: true` applies a 20 s slow, `sleepy: true` 50% sleep (6 s) on companions (execTpMove). Loot adds mats honeycomb, wool_tuft, lizard_skin, crab_shell, crawler_cocoon, mandrake_leaf, spore_cap, longneck_hide. Bestiary entries. Spawns added to ZONES.hollow (near the gate and around the lakes) and ZONES.marsh.
- World: boulders with s > 1.3 push a collider (r ≈ max(sx, sz)·0.8/U) in buildVegetation; updateCamera pulls the camera in when a sample point lies inside a house footprint (rot-aware, +10 px margin) below roof height (ground + 6).
- Tests: p6unit passive check now "no fam.aggro". p5shots scenes zoo, zoo2.

## Phase 26: humanoid and big families (v6.7.0)
- humanEntry extensions (rig.js): L.skinRegion (body paint region; SKR replaces "skin" for head, neck, arms, hands, bare feet), ears "fin" (finColor, scale region) and "none", L.tusks, L.needles (spines on the head), L.beak (two-part beak), L.crest (feather crest), L.leafHead (leaf canopy for treants).
- mobLook: model "orc" (grunt club / stonechucker bow / warlord great axe; tusks, broad build), "fishfolk" (scale skin, fins, dagger; chief has horned helm and staff), "birdfolk" (feather skin, beak, crest; priests/oracle in robes with staff), "treant" (wood skin, leaf head, claws; elder big), "cactus" (needles, crown for king), "bomb" → bombEntry (glowing sphere with face and lit fuse, bat pose). styleFor: treant prowl/claws, fishfolk and orc hunch.
- Mob ranged attacks: fam.range (px) → mobReach(m) replaces meleeRange for approach and swing; ranged mobs show the arrow vfx. TP move `explode: true` kills the user after the blast (bomb Self-Destruct).
- Families: orc_grunt, orc_stonechucker (range 200), fishfolk ("Reefkin"), birdfolk ("Crag Talon"), birdfolk_priest ("Crag Chanter", magic aggro), sapling (passive), treant_elder (scale 1.3), cactus ("Needlekin", range 170), bomb ("Ember Bomb"). Mats orc_tooth, reef_scale, crag_feather, heartwood, cactus_needle, bomb_ash. Spawns: Hollow east/south (saplings 3–5, orcs 5–6, night bombs 5–6); marsh (Reefkin SE shore 11–13, orc camp NW 12–14, Crag roost W 12–14, Elder Treant 13–14, Needlekin NE 10–12). Variant keys reserved in mobLook for later tiers (orc_warlord, frost_stonechucker, fishfolk_chief, crag_oracle, old_rootfather, rime_treant, cactus_king, frost_bomb, ashen_bomb).
- Tests: test/p24unit.js (passive/aggressive split, ranged stonechucker, bomb self-destruct, crawler slow); p6bunit clears mobs before synthesis. p5shots scene zoo3.

## Phase 27: world repopulation (v6.8.0)
- Placement rule: near town entrances only passive critters (aggro null); aggressive families (beastmen, undead, big monsters) further in. Hollow early goblin/worm spawns near the gate were swapped for bees, crawlers, mandrakes and sheep. Bats, ice bats and bog leeches are now passive (critters).
- Tier variants: data.js `tierFam(base, overrides)` clones a FAMILIES entry; `Object.assign(FAMILIES, {...})` adds bog/rime_crawler, marsh_hornet/frost_wasp, bog/frost_lizard, mud/ice_crab, mountain_ram, marsh_mandrake, bog_shroom, marsh/ice_snapper, frost_stonechucker, frost_bomb, rime_treant (name + tint/tint2 + stats/loot tweaks; model shared, so mobLook colours them). Bestiary entries for each. Spawns: marsh (10–13) and frost (15–19).
- NMs: silkmother (base grass_crawler, Burrow Flats placeholder at 1550,1950, chance 0.15; silkweave_mantle, silk_gloves), orc_warlord "Gorruk the Warlord" (marsh orc camp 720,640, chance 0.12; warlord_cleaver, warlord_band).
- Quest silk (Pell, lv 2, 6 grass_crawler → silk_gloves_q). GUILD_BOUNTIES add b_crawler, b_beehive, b_lizard, b_orc, b_silkmother, b_bogcrawler, b_reefkin, b_crag, b_warlord, b_rimecrawler, b_frostbomb.
- Tests: test/p25unit.js (tiers differ in name/colour and progress by zone; nothing aggressive near the Hollow gate; NMs; quest; bounties).

## Phase 28: animation upgrade (v6.9.0)
- trackEvents: aVar cycles 0..2 per swing; WS start records an.wsStyle = wsStyle(e.lastWSId) (doWS sets a.lastWSId; skill ≥ 75 → 0 leaping slam, ≥ 40 → 1 spin (rootRot[1] 2π), ≥ 22 → 2 three-hit flurry, else 3 stepping lunge). Hits record an.hitSide from e.lastHitAng (applyDamage sets tgt.lastHitAng = angle to the source) relative to facing. KO sets an.deadVar (±1 side); revival sets an.rise.
- poseHuman: slash variants (0 overhead diagonal, 1 horizontal sweep, 2 rising backhand with step), smash/cleave variant 1 wide horizontal arc. Idle actions for non-mobs standing still out of combat every 9–19 s (look around, stretch, weight shift, scratch head; 2.6 s each). Turn-in-place foot shuffle from facing change rate (normAngA). Cast pose by castSchool(e): heal/buff, song, summon, dark, debuff, elemental. Directional flinch. KO: knees buckle (0.35 s) then fall back with a side tilt; rise: 1.4 s kneel-to-stand.
- main4 frame loop: while S.ko, S.time still advances (no step) so the KO animation plays under the defeat dialog.
- p5shots scenes an_heal, an_song, an_summon, an_ws, an_idle, an_ko. (Headless software rendering is very slow under the defeat overlay, so an_ko screenshots catch the fall early.)

## Phase 29: living towns and character polish (v7.0.0)
- Faces: humanEntry adds bone "lids" (child of head at head centre) with two skin-coloured spherical patches over the painted eyes (φ = π/2 ± 0.4, θ ≈ 1.467 rad, r = 1.016·hr). poseHuman keeps lids rotated up −0.55 rad onto the forehead (invisible, skin on skin) and swings them to 0 to blink (every 2.5–6 s for 0.16 s), when KO'd, and half-closed while sitting. Only faces (not noFace mobs).
- Hair: long/ponytail back pieces moved to bone "hairTail" (hairPieces(…, tailBone)); sways with run/walk. Cape on bone "cape" (child of chest at the shoulders), lifts with speed and flutters.
- NPCs: anim.js NPC_WORK id → work pose (hammer, count, read, work, arms, guard, look) when the player is not near; within ~130 px (or targeted) the head and chest turn toward the player (an.look blend).
- Ambient life: ZONES[*].ambient [{type: chicken|dog|cat|gull|walker, x, y, n, r, col, path}] → S.ambient entities (kind "ambient", not targetable, no labels) built in enterZone, moved by tickAmbient (wander within r, or walk a path loop with pauses). Rigs: birdEntry (chicken/gull, kind "bird", poseBird pecks and flaps), quadEntry dog/cat, walkerLook(seed) random townsfolk for humanEntry. view3d syncs them and keeps their views alive.
- Town props: ZONES[*].props [{type: anvil|crates|desk|barrels, x, y, rot, r}] built in world3d after stalls; each adds a collider. Outpost: anvil+forge by Garrick, desks for Maera and Corvin, barrels; Saltreach: crates by Marn, desk for Selene, barrels.
- p5shots scenes town7, face7, harbor7.

## Phase 30: accounts and the game server (v8.0.0) — multiplayer phase 8
- Backend: Supabase project mztqrqgtlvviwwftrqhs (publishable key in src/net.js; it is meant to be public). The connected Supabase MCP account does NOT own this project, so schema changes are run by the owner in the SQL editor. Schema in sql/setup.sql (idempotent): schema game_private (config table, no API access) holds `signup_code`; public.players (id = auth user, email, joined_at, last_seen, banned); public.characters (uuid id, owner, unique lower(name), data jsonb, summary jsonb, timestamps). RLS: owners read/write their own characters (admin can read all); inserts need membership and < 8 characters. Functions (security definer): is_admin() (JWT email = ianmcgon@gmail.com), is_member(), join_game(code) (checks game_private signup_code; admin joins without it), touch_player(), admin_set_signup_code(code), admin_stats() (counts, sizes, online list, recent characters).
- The sign-up password is NOT in the client bundle: setup.sql only creates the table; the owner inserts the code once (sent in chat) or sets it from the Admin panel.
- Client: build 4 bundles @supabase/supabase-js as global SUPA (src/supa-entry.js) and injects sql/setup.sql as SETUP_SQL. src/net.js: NET state, netInit/netRestore/netSignIn/netSignUp (stores the sign-up password as usr_pending_code until the first confirmed login)/netEnsureMember/netSignOut, roster pull (server is the source of truth; summaries written to the local roster cache; pre-server local characters stashed in usr_local_chars and offered for one-time upload), netFetchChar (fresh copy before entering), netCreateChar (unique-name error), netDeleteChar, dirty tracking from saveGame → netFlush every 15 s, on pagehide/visibility hidden (fetch keepalive PATCH), heartbeat touch_player every 60 s, admin RPCs.
- UI: title Start → showAccount (restore session → roster, else login). showLogin modes signin / signup (email, password, confirm, sign-up password) / member (signed in but not joined). Character select shows email, Sign out, and the local upload offer. Character creation inserts on the server before entering. System tab: server save status, Save to server now, Sign out (Load from file removed to stop save editing). Settings → 🛡️ Admin (only for the admin email; server enforces): stats tiles, online list, recent characters, change sign-up password, copy setup SQL / diagnostics SQL / server report.
- Walk polish: spine, chest and hips roll with each step; neck and head bob and counter-rotate.
- Tests: rules tests unchanged (build 1 has no net.js); test/netshots.js drives the real page against a mocked Supabase (page.route) for login, wrong password, create, save PATCH, admin and system screens.
- Known limits: saves are client-authoritative (a determined player can edit their own data); server-side validation comes with the shared-world phase.

## Phase 31: other players and chat (v8.1.0) — multiplayer phase 9
- Supabase Realtime, no new tables. Channel `zone:<zoneId>`: presence key = character id, meta {id,name,job,sub,lv,look,gear,coat,zone}; broadcast "mv" {id,x,y,f,st(sit/ko/mount),anim} and "chat" {id,name,mode say|shout,text}. Channel "world": presence (online list for /who) and broadcast "tell" {from,to,text}.
- net.js: NET_RT holds channels; netJoinZone(id) called at end of enterZone (leaves the old zone channel); netLeaveAll on logout; netRtTick sends mv every 120 ms when moved, 2 s keepalive otherwise; netTrack refreshes presence meta on gear/job/level change (from netTick).
- Remote players live in S.others as kind "remote" entities; netOnMove sets a target, tickRemotes lerps position/facing and drops entities that leave presence. Rendered via rig signature "r|…" (baseFromLook), green name labels with job and level, not targetable, no collisions.
- Chat: plain text = say (zone); /say /s, /shout /sh (zone, bold orange), /tell /t name msg, /reply /r, /who. cleanChat trims to 120 chars and strips control chars and <>; one line per 700 ms ("You're talking too fast."). Chat log tab "Chat"; say bubbles (first 40 chars) via popText.
- Known limits: names in broadcasts are client-claimed (spoofable); monsters, loot and NPC state remain per-client; no party/trade yet (phase 10).
- Tests: netshots.js mocks presence/mv/chat/tell and screenshots the outpost with two remote players.

## Phase 32: parties and trading (v8.2.0) — multiplayer phase 10
- All in src/net.js (NET_PT), no new tables. Config in data.js CONFIG: partyMax 6, partyRange 900, partyShare [1,1,.6,.45,.37,.32,.28] (index = players nearby), tradeRange 250, tradeSlots 8.
- World channel events (addressed by lowercase name in `to`): pinv/pdecl (party invite), trq/tok/tno (trade request), toff (offer), tcf (accept with hash), tcx (cancel).
- Party channel `party:<pid>` (pid = charId prefix + time, made by the inviter): presence meta {id,name,t(join ms)}; leader = smallest t (inviter). Broadcasts: pst (stats every 0.5 s on change, 4 s keepalive: job/sub/lv/zone/x/y/hp/mp/tp/alive/buff keys), pchat, kill, pool, lot, win, kick, fx. Members map NET_PT.members (id → stats, at = last pst). netPartyNear = members in same zone, alive, within partyRange, fresh < 12 s.
- XP (game.js kill code): pn = 1 + near mates; top = highest level among them; each gets round(xpFor(mobLv, top) * partyShare(pn) * ownLv / top), chain multiplier from the killer's chain. Killer sends kill {ids, n, top, ch, gil, fam}; recipients re-check zone + distance, gainXp, add gil share, kills++, questKillCredit(fam) (factored out of kill code), bountyKill({famKey}).
- Loot: dropLoot(m, mates) — equip goes to pool when companions or mates; addToPool returns the entry; netPoolOut tags e.net {key, owner, ids, lots}. Non-owner clients mirror the entry (e.net.owner false), auto-lot at timeout, drop 20 s after. Owner resolves when all ids lotted (or left) or until+3 s, highest of own/merc/net lots, broadcasts win {win: charId | "merc" | null}. Gil split floor(total / pn). Other drops stay with the killer.
- Cross-player magic: isMate(e) = remote entity whose id is a party member. checkAction/resolveTarget accept mates for ally spells; finishCast → netCastOn (heal sends healAmount(), buff sends spell id); receiver netOnFx validates spell kind, range, clamps amount, applies.
- Remote players are now pickable: tap → target box (remote branch in updateTarget) + command box (Invite/Magic, Trade, Tell, Check). Party frame rows from partyRows() = S.party + net members (class net, far = other zone; tap targets if in zone).
- Trade: NET_PT.trade {name,id,mine,theirs,myOk,theirOk(hash),msg}. Any offer change sends toff and clears both accepts. Accept → netTradeCheck (own items/gil still there, bag room via tradeRoom (conservative: existing slots + new stacks), rare duplicates, distance) → tcf with tradeHash(both offers sorted by name). Both sides execute independently when hashes match, then saveGame + netFlush. tradeable = not key, not ex. Closing the Trade tab cancels (closeModal guard). Menu re-renders via netPartySig in menuSig.
- Commands: /invite (/pinvite, /pcmd add|leave|kick), /join, /decline, /leave, /kick, /p and /party text, /trade [Name]. Log class pchat (cyan), included in the Chat filter.
- Known limits: everything is client-trusted (a modified client could fake kills, lots or trades); trade execution is two independent commits, so a crash between them can lose or duplicate; monsters still per-client, so mates fight separate copies. Server-side validation and shared monsters are phase 11.
- Tests: netshots.js simulates invite, presence, pst, kill share, pool lot/win, heal/buff fx, party chat, target command box, and a full trade.

## Phase 33: shared monsters (v8.3.0) — multiplayer phase 11a
- Zone host authority, all in src/net.js (NET_SH) plus hooks in game.js. Zone presence meta adds t (zone join ms), v (GAME_VERSION), h (1 when I am the active host), away (document.hidden). Visibility change re-tracks.
- netElect(state) on every zone presence sync: peers = same version + same zone; sharing on when > 1 peer and zone isn't a battlefield (netShareable). Host = among non-away peers, those claiming h first (sticky), else all; lowest t then id. Transitions: lose host / join with existing host → netDemote (drop local mobs and spawn timers, send req); gain host or left alone → netPromote (proxies become real mobs: home from spawn point, enmity from last target, spawn timers for empty spawn slots at 4–25 s).
- Host: netSnap every 160 ms (changed rows) and full every 2 s; row = [nid, famKey, lv, x, y, face, hp, maxHp, state 0/1/2, targetCharId, flags(1 dead,2 readying,4 passive), spawnIdx, swingCount, wsCount, tp, "buff:secs,..."]. nid = host charId prefix + seq (kept across host changes). Events handled: hit {nid,d,en} (applyDamage from the remote entity, or enmity+aggro when d = 0), deb {nid,k,dur,tick,el,pow} (debuff with remote src), req (force full), want {ids} (story NMs the others need; spawnMob treats netWanted ids like storyWants for 60 s). Mob swings/TP moves on a remote target send mat {nid,to,k: sw|tp} instead of resolving locally; TP AoE also sends mat to every remote in range. onKO → netMobDied sends die {nid, claim}.
- Non-host: proxies are normal mob entities with proxy = true in S.mobs (map NET_SH.map). updateMob → netProxyStep (interpolate, expire chain/burst). applyDamage on a proxy → netMobHit (predicted HP for 0.9 s, then host HP wins); addEnmity/aggro on a proxy → enmity queue flushed every 250 ms as hit d=0; new local debuffs on proxies relayed as deb (sentBuff), host buffs mirrored with remaining seconds. mat → swing(proxy, player) or execTpMove(proxy) locally against my own stats. die → netProxyKO (visual), and killRewards(m) if claim is me. Full snapshot removes proxies not listed. Proxies excluded from separation except pushing my own party; no spawns while non-host.
- Claim: m.claim set on first damage or aggro (claimId: remote id or own charId), cleared when the mob returns home. onKO rewards only if claim is me (or unset). killRewards(e) is the old reward block (XP with party share, loot, bounties, story, quests, bond).
- isSide(e) = party or remote player: used by addEnmity, aggro, applyDamage enmity. Host idle detection also checks S.others (moving flag from tickRemotes). Remote entities get alive = false when removed so enmity drops them.
- Known limits: companions are local only (their attacks count as their owner's; mobs can't target other players' companions); skillchain/burst windows and boss phases are host-local; clients trust each other.
- Tests: netshots.js "shared" block covers demote, proxy creation, hits, debuff relay, mat swings, readying flag, die + reward, promote, snapshot, remote hit/claim, mob attacking a remote, kill with remote claim.

## Phase 34: claims and party combat (v8.4.0) — multiplayer phase 11b
- claimOk(m, who) in game.js: unclaimed, claimed by me/"me", or (local actor) claim is a party mate; for a remote actor (host check) claim is that actor, or claimer's party id equals actor's (pid from zone presence meta p = NET_PT.id; my own pid when I'm the claimer). claimState(m) → "mine"/"other"/"" drives name colors (view3d labels, target box: #ff6b6b mine, #c77dff other); claimName for messages and target info.
- Enforcement: applyDamage ignores party damage to a mob that isn't claimOk (covers spells, WS, companions); playerAct and toggleEngage refuse with a message; autoAttack disengages; nearestMob skips claimed. Host netOnHit/netOnDeb/netOnSc reject remote actors failing claimOk.
- Snapshot row gains [16] claim id, [17] chain [props, lv, name, openIn, closeIn], [18] burst [els, lv, name, untilIn] (relative seconds, 0.1 s). Non-host keeps its own chain/burst for 1.5 s after changing them (scLocalUntil) and sends sc {nid, c, b} from resolveChain on proxies; host validates and applies (with skillchain visuals). Decoders validate props against SC_PROPS/SC_TABLE and elements against ELEMENT_COLORS.
- Non-host shows other players' damage as blue numbers from host HP drops outside the prediction window (hostHp). NM proxies announce "You sense a powerful presence" when created near you.
- mv payload gains tg (nid of my current mob target); netAssist(name) targets that mob (/assist Name). Remote party mates' labels are blue.
- Tests: netshots "claims" block (claim colors, engage refusal, blocked hit, chain decode/relay, assist, host claim, non-party hit rejected, party hit accepted).

## Phase 35: server checks (v8.5.0) — schema 2
- Server setup is versioned: game_private.config 'schema' (setup.sql sets it to max(existing, N)); client NET_SCHEMA; admin_stats returns schema and the Admin panel shows "Server update needed" when behind. The owner updates by copying setup SQL from Admin and running it (idempotent). Config also holds level_cap (20) and bag_size (30).
- Save trigger public.check_character_save (before update on characters, security definer, no client execute): sets updated_at; skips when set_config('game.server','1') (server RPCs); refuses owner/name changes, any job lv > level_cap, inventory > 200 entries, crystals < 0 or > 999,999,999; audits (game_private.audit) crystal gains > 5000 + 200/s since last save, level jumps > 3 per save, bags over bag_size.
- Atomic trades: game_private.trade_offers (one open offer per character), trade_log. public.trade_offer(my_char, peer_char, mine, theirs): member + owner checks, ≤ 8 items, advisory lock per pair, upsert my offer; if the peer's mirrored offer (offer_key = sorted id:qty list + gil, ignoring stack info) is open and < 60 s old, lock both rows, inv_take/inv_give (stack sizes from the giver's st), crystal and bag checks, write both characters (game.server flag), mark the peer's offer done with its result, log, return {status: done, inventory, gil}. Else pending or mismatch. trade_status / trade_cancel return the stored result when the other side finished it. Any exception rolls back everything.
- Client: netTradeFinish (async) → saveGame + netFlushNow (wait out an in-flight save) → NET.saveLock (netFlush does nothing while locked so stale bags can't overwrite the server) → trade_offer → done: netTradeApply (replace inventory and crystals from the server, unlock, save) / pending: poll trade_status every 1.2 s for 24 s, then trade_cancel (which may still return done) / mismatch: fail. If the RPC is missing (server not updated), falls back to the old two-sided local trade (netTradeLocal). tcx while busy calls trade_cancel. netTradeCancel is refused while the server step runs.
- Bans: admin_set_ban(target email or character name, bool), never the admin. join_game raises for banned accounts; RLS already blocks saves (is_member excludes banned). Admin panel: trades tile, setup version tile, suspicious saves, banned list, ban/unban box. Diagnostics SQL lists config (code hidden), audit, trade log and open offers.
- Tested against a local Postgres 16 with a Supabase auth shim (roles anon/authenticated, auth.uid/jwt from request settings): setup runs twice cleanly; level cap, rename, crystal audit, completed trade with stacking, missing-item dupe refused (whole call rolled back), mismatch, foreign character refused, ban + join refused, admin can't ban self. Shim lives in the session scratchpad only.
- Limits: saves are still written by the client, so the server can only refuse impossible values and flag odd ones; items gained in the few seconds between a trade's start and finish on the waiting side are replaced by the server's bag.

## Phase 36: player auction house (v8.6.0) — schema 3
- SQL: public.ah_listings (seller char fk cascade, seller_owner, seller_name, item, qty, st, price total, expires 48 h, status open/sold/cancelled/expired, buyer, sold_at); RLS select = member and (open or own). game_private.ah_box (char_id, kind bought/sold/returned, item, qty, st, gil, note). Helpers: game_private.my_char (member + owner + row lock), char_save (writes inventory + gil with the game.server flag), ah_expire (open + past expiry → expired + returned box row). RPCs (definer, authenticated only): ah_post(my_char, item, qty, price, st) (≤ one stack, ≤ 10 open lots, fee max(1, ceil(3%)), takes items from the server copy), ah_buy(my_char, lot) (not own lot, pays, item → buyer box, crystals → seller box), ah_cancel, ah_box_list, ah_collect (crystals always; items while the bag has room), ah_history(item) (last 10 sales). admin_stats adds ah_open, ah_sold_7d. inv_take error now "Not enough <item> in the bag".
- Client (net.js): netServerOp(fn, args) = saveGame → netFlushNow → saveLock → rpc → netApplyServerBag (inventory/gil from server) → unlock + save. netAhList/Mine/Box/History reads, netAhPost/Buy (then auto-collect)/Cancel (then collect)/Collect. netAhWatch every 60 s from netTick: new "sold" box rows → log + toast (first run only seeds). netAhErr turns missing-function errors into "admin needs to run setup SQL". NET_SCHEMA = 3.
- UI (menu4): Auction tab gains 🌐 Players view (pmView: categories incl. All, grouped by item with cheapest unit price, detail with every lot sorted by unit price, Buy, recent sales); Sell detail has "Sell to the market" and "🌐 Offer to players"; My lots shows player box + player lots (Withdraw) above market lots. pmLoad caches 20 s; pmAct runs an async op with UI.pmBusy.
- Tested: local Postgres (post, stack limit, missing item, insufficient crystals, buy, double buy refused, box list, collect both sides, cancel by non-owner refused, withdraw + collect, history, expiry return, RLS hides sold rows from others); netshots mocks listing/box/history/buy/collect and screenshots the Players view.
- release.sh now runs node --check on dist/game.js (a missing parenthesis in menu4 slipped past the rules tests once).

## Phase 37: social (v8.7.0) — schema 4
- Save fields (normalizeSave/newSave): friends[] (≤ 50 names), blocked[] (≤ 50), lsActive (linkshell id), lfg, seekMsg (≤ 40). Friends/blacklist are per character and client-side only.
- World presence meta = netWorldMeta(): name, zone, lv, job, sub, lfg, cmt (seek message when lfg), ls (active linkshell name); netTrack re-tracks the world channel when it changes (lastWSig). netFriendWatch on each world sync logs friends coming online/offline (first sync only seeds).
- netSearch(words): numbers = level, a-b = range, lfg/seek, here, job codes, else name/area/linkshell substring. netSearchLog for /search.
- Blacklist checks (netBlocked) in netOnChat, netOnTell, netOnPInv (auto-decline), netOnTrq (auto-decline), netOnLsChat, netOnLsInv.
- Linkshells (SQL): public.linkshells (name 3–16 letters with inner spaces, unique lower, color hex, owner_char), public.ls_members (rank leader/sack/pearl, ≤ 100 per shell, ≤ 3 shells per character), game_private.ls_invites (10 min). Tables have no client grants; everything through definer RPCs: ls_mine, ls_create (500 crystals via char_save), ls_invite (leader/sack), ls_join (needs invite), ls_leave (leader hand-off to the oldest sack, else oldest member; empty shell deleted), ls_set (kick: leader any non-leader, sack only members; sack/pearl rank changes and leader hand-off: leader only). admin_stats adds linkshells.
- Client (NET_LS): netLsRefresh on world join → netLsSet subscribes "ls:<id>" channels (events lsc chat, lsx refresh ping). Chat shows only if the sender's name is in the member list. Invites: ls_invite RPC then world broadcast lsinv {to, from, ls, lsName} → confirm → ls_join. Commands /l, /l1–/l3, /lsjoin, /friend, /blacklist (/bl), /search (/sea), /seek (/lfg), /social. Log class ls (green), in the Chat filter.
- UI: Social tab (MAIN_TABS after Party): LFG toggle/message, online list with filter shortcuts, friends with status, linkshell cards with member chips and rank/kick buttons, new linkshell, blacklist chips. menuSig includes online/friends/linkshell state.
- Limits: linkshell channels are realtime broadcast channels; someone who learned a shell's id and spoofed a member name could post into it. Friend alerts depend on world presence (no offline mail).
- Tested on local Postgres (create, name check, invite needs rank, join needs invite, kick rules, rank change, leader leave hand-off, last leave deletes, direct table reads refused) and in netshots (ls refresh, friend alerts, search filters, /l and spoof rejection, blacklist, seek meta, Social screenshot).

## Phase 38: attached bodies (v8.8.0) — model realism 1/5, rename
- Game renamed Leid'anav Reborn (title, loading, menu header, credits, report, save-file messages). Favicon: assets/icon.svg (shield + crystal) embedded as an SVG data URI link in template4.html.
- RigBuilder (rig.js) finish(): attachIslands → bridgeGaps → smoothJoints → meta.minY.
  - add() records userData.rig {bone, color, region, glow} per piece.
  - findIslands(): union-find over all pieces on a voxel grid (cell 2×tol, tol = 1.5% of model height); anything outside the largest cluster is an island. With window.RIG_CHECK, meta.islands lists them (lab only).
  - attachIslands(): up to 4 passes; island clusters within 25% H move onto the nearest main point (slight overlap). Islands touching the ground (min y < 3% H, e.g. paws) get a thin connector tube instead.
  - bridgeGaps(): bones whose pieces don't touch the nearest ancestor-with-pieces (tol 1.2% H) get a ball at the joint (child), a strut from the child's nearest point to the joint (child) and one from the parent's nearest point (parent), so rotation keeps them connected. Skips lids, saddle, hairTail, noBridgeBones.
  - smoothJoints(): all non-rigid bones (every rig) blend with the parent near the joint by axial distance along the bone axis within a lateral radius. Table J for human bone names [axial r, max weight, lateral]; other bones r = clamp(0.35 × segment, 0.025, 0.1), lateral 2.2r, weight 0.5. Options jointScale, rigidBones.
- Rig fixes: mandrake leaf stem reaches the leaves; hare and toad hind legs have shins; ursan RACE_BODY shoulder 0.30, girth 1.45, waist 1.32, headR 0.155, arm 0.84 (reference sculpt).
- Bestiary portraits (models3d.js THUMBS): renderThumb(famKey) renders the rig off-scene in a small lit studio to a 128 px render target (exposure 1.25), returns a PNG data URL; beastThumb queues one per 16 ms and re-renders the bestiary every 3.
- Ysolde no longer offers or mentions pets.
- Test tools: mocklogin.js (shared mock + sign-in + create), modellab.js (race×job, NPCs, all mob families, ambient, pets × idle/walk/run/swing/WS/hit/cast: posed surface gap vs rest, built gaps, ground penetration and idle hover via groundY under every vertex, islands), studio.js (contact sheets), lineup.js, bestshot.js, thumbtime.js. Run on a copy of dist/index.html (build 1 overwrites dist). Reference renders: scratchpad stlview.py (automatic landmarks unreliable on posed sculpts).
- Results: worst posed separation 8.5% → under 1.2% of height for humanoids and quadrupeds; remaining flags are overlapping-sphere chains (crawler/worm). Open: feet dipping into ground in some poses (humans ~4%, small folk ~13%), crawlers/worms sinking when rearing, slopes.

## Phase 39: classic interface (v8.9.0)
- Theme tokens in template4.html: --ffFont (Verdana/Tahoma bold), --ffStripe (blue-purple horizontal stripes), --ffEdge (white rule). Applied to HUD panels, all menu windows (#menu .win, nav pills with orange selected state, h2/h3 italic outlined), dialog, confirm box and buttons (glossy blue pills; .pri/.on orange; .danger red).
- New HUD markup: #ffTop (Commands label, #ffHelp text, Help label, #ffNet with %, S/R counters), shown via #ui.hasTop when anything is targeted or the command menu is open (minimap shifts down). #ffStat (top left): #ffBars HP/MP/TP shown only with class .combat (engaged or inCombatWith(player)); MP row always shown; #ffIcons always shown (blessing = CSS crystal, food, buffs with bad-status tint, resting). #ffSide (bottom right) wraps #target (restyled; #tLock "◀ Locked ▶" when engaged on it; mob name green calm / red when ffMobAttacking / purple claimed by others) and #party (rows restyled; XP bar removed) under a Party/Solo head.
- Removed from view: #barWrap (action bar), #xpRow. Hotkeys 1–0 still work through the saved hotbar (tab renamed Hotkeys). #bottom (cast bar), #dialog, #fishBox, #pool moved above the log; #chat spans left to #ffSide; log restyled (bold white outlined text; casting lines are class cast → yellow; tells pink, party cyan, linkshell green).
- updateFF() in hud4.js runs each HUD tick: help text (UI.ffHelp from the highlighted menu item, else ffDefaultHelp), network (NET.ping from touch_player timing, channel state; NET_RT.sent/recv counted in netZoneSend/netWorldSend/mv send and netOnMove/netOnMs), stat panel, icon strip (signature-cached), side panel classes. ffMobAttacking(m) = in combat targeting me, my party or a party mate.
- Command menu rewrite (hud4): cmdItems(c) builds pages per target type — mob root: Attack|Disengage, Switch Target, Magic▶, Abilities▶, Items▶, Check; self (tgtCmdOpen(player)): Magic (non-enemy spells), Abilities (non-enemy JAs), Items, Heal/Stand, Cancel; remote player: Magic (mates)/Invite, Trade, Tell, Check, Cancel. Submenus list actions with help text from desc; Items = usable/food items. Disengage also clears the target. UI.cmd.sel highlighted (orange pill + ➤ cursor), hover updates help; keyboard via tgtCmdKey from main4 onKey (↑↓ select, Enter/→ confirm, ←/Backspace back, Esc close). Enter with a monster/player targeted opens its menu; near an NPC talks; otherwise opens the self menu. Tapping yourself opens the self menu. Menu sits left above the log.
- Name plates (view3d updateLabels): setting plates (Settings → Interface, default on) shows names for everyone in range; classes k-pc (white, cyan edge), k-npc (green glow), k-mob (pale gold; red when attacking you; purple claimed by others; orange NM). Off = target only.
- Target cursor (makeCursor): group of octahedron gem + flattened cone tip + dark notch, VIEW.cursor.material shared; colour copper by default, for monsters (or players while choosing magic) blue ≤ 85% of range, yellow ≤ 108%, red beyond; range = reach(player) or CONFIG.castRange on the Magic page. Ground ring green/red by attacking state.
- Character tab: ffStatusBlock (name, main/sub job levels, Ilv = average lv of equipped gear, Su placeholder, HP/MP/TP, STR…CHR, Level/EXP/NEXT LEVEL) and ffJobLevels (two-column; base jobs + unlocked advanced; main yellow, sub pink). New derived stat chr in buildStats (6 + 0.65/lv, BRD bonus, gear chr); songs scale by 1 + chr/500.
- Skills tab: only panels — Combat Skills, Magic Skills (skills of spells you actually know), Craft Skills (rank names CRAFT_RANKS: Amateur…Veteran per 10 levels, plus Fishing), Gathering Skills. No progress bars.
- Crafting tab (tabCrafting): UI.cs {crystal, mats[≤8], hover}; essence slot + 8 slots + OK/Cancel; "Craft this combination of" lists recipes whose essence matches and that contain the chosen mats (★ exact); tapping a result fills the slots if you have the ingredients; description box; bag list of essences/materials with remaining counts; craft rank line; "Recipe notes" toggles the old list (tabCraftBook). Wording "synthesis" → "crafting" everywhere visible.
- Inventory: compact list cells (icon, name, count; rarity colours); storage lists use .ffList rows.
- Tests: test/hudshot.js (HUD in combat with menu, Character, Crafting, Inventory, Skills screenshots).

## Phase 40: equipment and classic windows (v9.0.0)
- SLOTS (data.js) = main, sub, ranged, ammo, head, neck, ear1, ear2, body, hands, ring1, ring2, back, waist, legs, feet. Item slot types stay single words (ring/ear map to pairs via SLOT_PAIRS); slotKeys(type), slotFor(id, gear, want) pick the box (first empty of a pair unless asked). SLOT_NAMES covers keys and types.
- normalizeSave re-homes old gear (ring → ring1, shields → sub, medallion/charm → neck). equip(id, want) uses slotFor. Mercenary gear and pool upgrades use slotKeys(type)[0]; PLD kit uses sub. buildStats only takes weapon dmg/delay from main; copies res_<element> (RES_ELEMENTS) into stats; applyDamage reduces damage taken by res% (cap 50%) when opt.el is given (boss pulse, TP moves with mv.el).
- Item changes: kite_shield → sub; ashen_medallion, croaker_charm → neck. New items: leather_gorget, mage_pendant, spirit_torque (neck); copper/beetle/silver/ember earrings (ear); travelers_cape, wolf_mantle, mage_cape (back); leather_belt, warriors_belt, silk_sash (waist); buckler (sub); sling (ranged); pebble_pouch, wooden_arrows (ammo). Pell's SHOP gets the starter pieces, Vela the better ones. ITEM_LOOK: capes → L.cape, belts → L.belt, buckler → shield.
- UI (menu4): tabEquipment (4×4 eqGrid of boxes, Attack/Defense, 8 resist dots; selecting a box opens eqPop with Remove + fitting items, greyed with canEquip reason; first tap previews (itemCard + ▼ + equipped card), second tap equips into that box). itemCard(id): icon, name, Rare/Ex tags, [Slot] All Races, DMG/Delay/DEF/stats/resists/augments, desc, Lv + jobs (All Jobs when every job), <Item Level>. Inventory detail uses itemCard. Equipment tab key G.
- Character tab = ffStatusBlock + ffJobLevels (+ appearance options); removed preview, attributes table and progress list. Storage tab = mcBox two-column transfer list (Storage n/cap | Bag). Bestiary hides unmet creatures.
- Tests: p5bunit shield assertions now check gear.sub. hudshot adds storage and equipment screenshots.

## Phase 40b: tidier screen (v9.0.1)
- #chat gets class gone (fade/slide, no pointer events) unless: a valid target, command menu open, chat input focused, UI.chatPin (💬 #btnChat in #trBtns, key L, chatToggle()), a dialog, or S.time < UI.chatFlashUntil (log() sets +6 s for tell/pchat/ls/say/shout/loot/npc lines). Esc (game or chat input) unpins/blur when nothing is targeted.
- Network moved out of #ffTop into its own #ffNetBox (top right, 140 px); #ffTop ends 150 px from the right. Both show with #ui.hasTop.

## Phase 41: main menu window and Status screen (v9.1.0)
- hud4 MAIN_CMDS (2 pages) → #mCmd. UI.mm = {page, sel, sub, back}. mainCmdOpen/Close/render/Do/Key; main4 routes arrows/enter/esc/backspace when UI.mm. Esc with nothing targeted, "-"/Insert and ☰ open it.
- Status (key "character") sets UI.mm.sub="status": list = STATUS_CMDS (profile/jobs/combat/magic/craft/cur/time). Esc/backspace returns to menu at UI.mm.back. ←/→ ignored in sub.
- renderStatusOv (menu4) fills #stOv (#stL left sheet + level box, #stM centre page via statusPanelHTML(key)); #ui.stOn hides #ffStat. updateFF refreshes it every 500 ms. mainCmdHelp: profile help = "Title: " + playerTitle() (latest achievement).
- gearBonus() sums gear+augment stats for green "+n"; base shown = stats - bonus. save.playSec accumulates in step(dt). fmtPlay formats.
- #ffTop: .ffCmd and .ffBar are separate boxes (transparent container).
- #mmWrap lives in #ui bottom-left; hidden by CSS while #chat is visible.
- menu4 tabMagic/tabAbilities/tabKeyItems with mcast/mact.

## Phase 42: windows in the world (v9.2.0)
- #menu is transparent, pointer-events none; .win is a top-left panel (no #mNav, no h2). updateFF sets #ffTop .ffCmd to TAB_INFO[S.modal][0] and help via tabHelpLine(tab) (MAIN_CMDS help or a small map). openMenu closes any dialog.
- openDialog (hud4): logs "Who : text" (class npc) per paragraph; no opts → nothing shown; single Trade/Shop/Buy option → runs it at once; otherwise S.dialog {sel} and #dialog becomes a small prompt above the log (renderDlgOpts, dlgKey ↑↓ Enter). Story pages (single Next/Continue) show no question and no back-out option.
- gameConfirm keeps #confirmBox but CSS makes it the same small prompt above the log; .yes/.no rows with .sel, main4 arrows toggle, Enter clicks .sel.
- Event log rows: UI.logRows (logFull() = 8, 6 under 900px). log() resets to full + UI.logAt. updateFF shrinks one row per 1.2 s after 8 s idle down to 3; logEsc() removes one row (Esc order: casting → unengaged target → log row → main menu). rows 0 → #chat.gone. #chat.lite hides tabs/input unless typing or pinned (L / self menu Chat).
- Compass map: drawMinimap draws a dish (no zone image) into #minimap, CSS scaleY(.42) inside #mmDisc; letters #mmN/E/S/W placed on an ellipse; #mmTime = vana time + gridRef (15x15 lettered grid). #mmWrap bottom follows #chat height; hidden while S.dialog/S.modal. Setting VIEW.settings.compass.
- #clockBox/#trBtns hidden. Self command menu gained Main Menu and Chat (phones).
- Rest pose: anim.js sitPlan(v) from bone lengths (thighL.y, |shinL|, |footL|): thigh -1.85, shin solved so the seat sits ~0.1H above ankle height; root drop = hipJ - seat; tail lifted. Probe: test/sitlab.js.
- /clock: gameDate() (360-day years from 880) + Earth time.
- #ffNetBox matches #ffTop (top +4px, 34px).

## Phase 43: classic lists (v9.3.0)
- menu4 SLIM_TABS {inventory, shop, quests, magic, abilities} → .win.slim (320px, no #mHead); equipment → .win.wide. listRow()/orbRow() build .lr rows (data-hv = item id for hover card, data-hs = help text).
- #mCard (inside #menu, before .win) holds gilBox/cardBox/qCard; renderMCard positions it just under the window. UI.hov = hovered item; UI.modalHelp = Help bar text (reset in openMenu).
- promptChoice(q, opts) (hud4) = S.dialog prompt without logging. When a window is open the prompt sits beside it (updateFF sets top/left); otherwise above the log. main4 handles S.dialog keys before S.modal.
- Items: isel → invActions(i). Shop: UI.shopMode buy/sell; shopbuy/shopsell prompts (1/3/12 for stackables; sell 1/all). Quests: UI.qCat (story/cur/done/guild) → UI.qSel → questCardHTML; Esc goes back a level.
- Equipment: .eqW = .eqL (statusLeftHTML(true) + crystals) + existing .eqWrap. CSS for #stL also applies to .eqL via :is().
- Target command lists: #tCmd.list for pages ma/ja/items (orbs by element); Commands label Magic/Ability/Item List; renderMpBox → #mpBox above #ffSide (MP Cost, Next recast).
- #ffSide split into #ffTBox and #ffPBox. Unified box style: dialog, confirm, mCard, tCmd, mCmd, menu .win, tracker, mpBox use --ffStripe.
- Compass hidden while UI.cmd/S.dialog/S.modal/confirm. Enter with no target focuses #chatIn.
- Mob regen: idle/return mobs gain CONFIG.mobRegen (4%) max HP per second after 5 s without a hit.

## Phase 44: spell scrolls and keyboard windows (v9.4.0)
- data.js tail generates ITEMS.scroll_<spell> (kind use, spell, lv = min job level, price 30+lv²·14) and sets SPELLS[id].id/minLv; lv≤10 → SHOP, 11–17 → SHOPS.vela. Hollow spawns thinned (x<1300, 170 spacing, time-aware, NMs kept).
- save.spells: newSave = all level-1 spells; normalizeSave migrates old saves to all spells reachable by current job levels. knows() requires save.spells for the player only (mercs unchanged). useItem → learnSpell (spellLearnable = any job level ≥ requirement). gainXp logs newly learnable spells. dropLoot: CONFIG.scrollDrop (5%) scroll for spells with minLv in [lv-4, lv+3].
- buildMob: lv≤6 non-NM mobs get easy (HP 0.55→0.925), easyA (att/dmg 0.75→1.0), eva ×0.8.
- modalKey(k) (menu4): equipment grid nav (UI.eq.slot, UI.eq.list, eqFits), SLIM_TABS row nav (.kb, UI.kbRow), fallback button nav (UI.kbBtn). main4 calls it first in the S.modal block.
- UI.menuFromMain set in openMenu when UI.mm is open; Esc reopens main menu only then. Job change moved to Pip; Tobin keeps unlock quests. cycleNpcTarget includes prop "nubbin". Exits take ask + yes labels (residence exit asks).
- rig.js NPC look fallback: NPC_LOOK[id] || NPC_LOOK[NPCS[id].model] || walkerLook(hash) (props/crystals excluded).
- Chat: openChatInput(pre) pins+unhides #chat and focuses #chatIn (Enter with no target, Space, /, self menu Chat); Shift+Space = jump. Walk: arm swing 0.3(+0.12 run)·min(amp,1), forearm and chest twist reduced.
- Hotkeys: Ctrl+digit → line 0, Shift+digit → line 1, plain digit → line 0.
- CSS: Help/Network labels on top border (gradient top lines with gap), darker shorter pill buttons, blue scrollbars, #mHead .meta hidden.

## Phase 45: mercenary guild (v9.5.0)
- game.js: MERC_ROLES (job → roles with existing ally AI), name syllables, traits. genMercDef(rnd) → {gen, name, job, role, fee (40+18·lv)·roleMul, color, look, desc}. mercPool(dayOverride) refreshes once per local day: drops unhired defs, generates CONFIG.mercDaily (5) seeded by save.created+day, ids "m<day>_<i>" (x-suffixed if taken). save.mercDefs registered into MERCS by mercDefsSync (rebuildParty, tickWages, mercPool). rig.js uses MERCS[id].look via baseFromLook.
- Permadeath (CONFIG.mercPermadeath): onKO sets e.fallAt = +4 s; mercFallTick (in step) removes from save.hired, marks save.mercFallen[id], deletes stale defs, rebuilds party. mercAvailable false for fallen; generated mercs need no unlocks. dismissMerc drops defs not in today's pool.
- tabMercs: today's offers, your company, fallen count, time to refresh. Brann dialog updated.
- Robustness: frame loop wraps work in try/catch (rAF requested first); loadZoneAsync wraps loadZoneInner and clears VIEW.loading on error; reportError(e, where) logs once per message to the event log.
- Test: p29unit (pool, same-day stability, daily change, level, permadeath, no rehire). harness exports mercPool.

## Phase 45b: spawn spacing (v9.5.1)
- data.js tail (after spreadSpawns): per zone, cell = max(w,h)/15 (same grid as gridRef). Keep fixed NM/boss spawns, then greedily keep points (placeholder-NM and bf first, then farthest from exits) that are ≥ CONFIG.spawnExitCells (2) cells from exit centres and not within CONFIG.spawnGapCells (3) cells on both axes of a kept point. Every dropped spawn becomes an option in the nearest non-fixed kept point's alts [{fam, lv, time, nm, passive}].
- game.js: spawnOpts(sp) = [sp, ...alts] valid for the period; spawnAllowed true if any; spawnMob(i, wantNm) picks a story/wanted NM option first, else random; mob.spawnOpt kept for period despawns; summonStoryFoe and NM lookups (spawnHas, bestiary zones, netWanted ids) search alts.
- Tests updated for sparse spawns (p1, p5, p5d, p6, p17, p24, p25).

## Phase 46: classic windows everywhere (v9.6.0)
- template4 CSS: #mBody h3 → pale gradient title bar; #mBody .item → flat rows with separators; details/summary → classic headings; range sliders accent blue; .sub/.d use --ffFont.
- Help text updated (first hire via daily hall, Heal via self menu, Config names, compass map, Party window, Pip job changes); intro log line points to Pip; mercenary role labels.

## Phase 47: offline play (v9.7.0)
- game.js: PLAY.offline; rosterKey() (usr_roster_v1 / usr_off_roster_v1); charKey prefix usr_char_ / usr_off_char_. createChar marks d.offline and uses "o…" ids offline. selectChar refuses a save whose offline flag doesn't match the mode. applyLoadedSave refuses offline saves while online; offline loads get the mark.
- main4: showTitle → showModeChoice (Play Online → showAccount, Play Offline → showCharSelect). Offline select footer: "Play online instead". Logout reloads to the title.
- net.js: netMarkDirty/netFlush skip offline saves; netCreateChar throws for offline; NET_SCHEMA 5.
- hud4: offline hides Trade/Search/Linkshell/Friend List/Communication in the main menu; Network shows Offline. Residence entry replaces Map by key.
- setup.sql (schema 5): trigger characters_no_offline (before insert or update) rejects data.offline.
- Test p30unit; harness exports PLAY, loadChar, charKey, STORE.

## Phase 48: G1 sky and light (v9.8.0)
- world3d.js: W3.clouds2 (higher, slower, scaled layer), W3.sunGlow (additive sprite at sun dir, warmer/larger in golden hour), W3.moonDisc (moonTex(phase) canvas, phase from game day % 24), W3.haze (open cylinder, hazeTex vertical alpha, coloured with fog), ATMOS per zone {tint, haze, far, clouds} blended into fog/hemi colour, fog distance and cloud opacity. Cloud colour picks up golden-hour tint. Stars rotate with time of day.
- Mobile: #mobBar (Target → cycleTarget, Menu → toggle main menu/close window) above #ffSide (and above #mpBox when shown); jump hidden on coarse pointers; tapping #log on touch opens openChatInput.
- Toasts and #verPop: blue stripe style, top centre. showWhatsNew uses the entry for GAME_VERSION (was UPDATES[0], which is the misplaced 6.5.0 Pets entry); tabUpdates sorts newest first (verNum).

## Companion AI pass (v9.8.1)
- smartAct(a, tgt, acts) (every 1.5 s, after the hard-coded ability list in meleeAI): emergency heals from any heal spell (threshold 0.45, 0.3 with a healer), any self-buff JA with a buff not active, debuff/dot spells not on the target (MP > 35%), best nuke/drain by power × weakness (MP > 55%, 10–14 s gap).
- healerAI: support role melees when ≥60% HP and nobody needs healing. nukerAI: reserve 0.3 (nuker), 0.5 burster (0.8 while a chain is open), shorter gaps, casts debuffs too.
- step(): each updateAlly wrapped in try/catch → reportError("companion").

## Roadmap (planned phases)
Graphics goal: early-2000s classic MMO look (painted textures, warm fog, big skies, readable silhouettes) within browser/phone budgets. Every graphics phase keeps a low/normal/high quality tier and checks fps on the low tier.
- 45 (9.5.0) Mercenary guild: DONE.
- 46 (9.6.0) Remaining classic windows + Help rewrite: DONE.
- 47 (9.7.0) Offline play: DONE.
- 48 (9.8.0) G1 Sky and light: DONE.
- 49 (9.9.0) G2 Terrain: painted texture splatting (grass/dirt/path/rock/sand/snow) by height/slope/zone, detail textures up close, cliff and rock-face meshes, smoother height variety, path decals.
- 50 (9.10.0) G3 Plants and props: layered-canopy trees, conifers, bushes, flowers, instanced grass tufts with wind sway, scattered rocks, logs, fences; distance fade/LOD.
- 51 (9.11.0) G4 Water: animated reflective water with depth tint, shoreline foam, ripples, waterfalls and streams.
- 52 (9.12.0) G5 Towns and buildings: textured stone/plaster/timber walls, tiled roofs, windows/doors with frames, lanterns, banners, market stalls, crates; residence interior detail; light pools at night.
- 53 (9.13.0) G6 Characters: higher-detail heads and faces (eyes, brows, mouths), hair meshes with strands/ponytails, smoother limb joints, gear with trims, layered cloth (skirts/tabards/capes) that moves, per-race silhouettes.
- 54 (9.14.0) G7 Monsters: per-family detail pass with painted textures, using the uploaded reference files for proportions only (original designs).
- 55 (9.15.0) G8 Grounding and collision (was model phase 2/3): feet on slopes, no sinking crawlers/worms, no clipping through walls/props/other characters.
- 56 (9.16.0) G9 Shadows and depth: soft sun shadow maps (quality tiers), blob shadows on low, light ambient occlusion, rim light on characters.
- 57 (9.17.0) G10 Motion (was model phase 4): smoother turns/starts/stops, idle variety, better attack, cast and hit reactions, emotes.
- 58 (9.18.0) G11 Effects: particle spell effects per element, weapon-skill trails, hit sparks, level-up and crystal effects, rain/snow/mist weather particles.
- 59 (9.19.0) G12 Camera and finish: anti-aliasing, subtle bloom and colour grade, depth fog tuning, auto quality for phones, final performance pass.
Model detail track (era-style detail comes mostly from painted textures on ~2–3k-triangle models, so textures carry most of the work):
- 60 (10.0.0) M1 Mesh pipeline: replace primitive-part bodies with continuous lofted/lathed meshes per race (smooth shoulders, hips, necks, hands with fingers grouped), triangle budgets per tier, LOD levels.
- 61 (10.1.0) M2 Painted texture system: canvas-painted texture atlases per model (cloth weave, leather grain, metal engraving, trim, shading baked in), per-region UVs, seeded variation.
- 62 (10.2.0) M3 Faces and hair: painted face atlases (eyes, lashes, brows, lips, cheek shading) with 8 faces per race, blink/mouth flaps, carded hair meshes with alpha strands and 12 styles.
- 63 (10.3.0) M4 Gear sets: unique meshes per armour piece (pauldrons, gauntlets, greaves, hoods, robes) and tiered visual sets; weapons with detailed silhouettes (guards, wraps, engraved blades) and glow on high tiers.
- 64 (10.4.0) M5 Races in motion: per-race proportions, skeleton tweaks and animation sets (small folk bounce, big folk heavy steps, tails/ears that react).
- 65 (10.5.0) M6 Monsters and NPCs: per-family sculpted meshes + painted textures + tier variants (colour, size, armour, accessories); every named NPC gets a unique outfit.
World scale track:
- 66 (10.6.0) Z1 Distance: far-terrain impostors, mountain/skyline backdrops per zone, longer draw distance with aerial perspective fog, landmarks visible from far away.
- 67 (10.7.0) Z2 Bigger zones: existing fields 2–3x larger with sub-regions (plateaus, canyons, ravines, ridges), multiple entrances, hidden pockets and caves.
- 68 (10.8.0) Z3 Life: ambient wildlife (birds, butterflies, fish, deer), wandering travellers and caravans, per-area ambient sound, ecology that changes by time and weather.
- 69 (10.9.0) Z4 Points of interest: lookouts, shrines, wrecks, ruins, hidden chests, rare gathering spots, NM lairs, lore tablets; map regions and discovery rewards.
- 70 (10.10.0) Z5 Travel: roads with signposts, mount routes, a ferry between harbor and an island, crystal warps with costs, outpost camps that act as home points.
- 71–74 (11.0.0–11.3.0) New jobs in groups: SAM/NIN/DRG, BST/BLU/COR, PUP/DNC/SCH, GEO/RUN.
New zones (one per release; each gets its own monsters, NM, gathering, quests, landmarks and music mood):
- 75 (12.0.0) Second city: a rival/allied nation with its own shops, guilds, missions, residence option and a distinct building style; road link to the Outpost region.
- 76 (12.1.0) Sunscar Desert: dunes, buried temple, sandworm NM, daytime heat that drains MP (shade/water items counter it).
- 77 (12.2.0) Verdant Jungle: dense canopy, rope bridges, vine-covered ruins.
- 78 (12.3.0) Cinder Peak: volcano, lava flows, fire elementals, top-tier smithing ore.
- 79 (12.4.0) Gull Isle: coastal island reached by ferry; sea cliffs, pirate caves, lighthouse.
- 80 (12.5.0) The Spire: multi-floor tower dungeon, harder per floor, boss at the top.
- 81 (12.6.0) Underdeep River: underground river by boat, glowing caves, fishing.
- 82 (12.7.0) Highland plateau: open grassland, large mount area, nomad camps.
World systems:
- 83 (13.0.0) Regions with control status: each region shows which side holds it; affects shop stock and prices.
- 84 (13.1.0) Weather that matters: sandstorms, blizzards, fog change spawns and view distance.
- 85 (13.2.0) Expeditions: multi-zone quests far from home.
- 86 (13.3.0) World map atlas: fills in as you explore, every zone joined up.
- 87 (13.4.0) Night-only and weather-only content: monsters, areas and NPCs that appear only at certain times or weather.
- Pending on the user's side: run the latest setup.sql (schema 5) in Supabase.

## Version log

| Version | Change |
|---|---|
| 4.8.0 | Phase 7: performance settings and balance check (above). |
| 9.0.1 | Phase 40b: log auto-hide with pin, separate Network box. |
| 9.1.0 | Phase 41: main menu window, in-world Status screen, map bottom-left, Commands box split. |
| 9.2.0 | Phase 42: in-world windows, talk in log + prompt box, shrinking log, compass map, seated rest. |
| 9.8.1 | Smarter generic companion AI, per-companion error isolation. |
| 9.8.0 | Phase 48: layered clouds, sun glow, moon phases, horizon haze, zone atmosphere; mobile buttons; blue top toasts. |
| 9.7.0 | Phase 47: offline play with separate storage and server-side rejection. |
| 9.6.0 | Phase 46: classic styling for all remaining windows, Help rewrite. |
| 9.5.1 | Spawn points 3 grid squares apart, clear of exits, alternate monsters per point. |
| 9.5.0 | Phase 45: generated daily mercenaries, permadeath, freeze-proof loop. |
| 9.4.0 | Phase 44: spell scrolls, keyboard windows, Pip jobs, easier start, Ctrl/Shift hotkeys, UI polish. |
| 9.3.1 | mainCmdDo keeps UI.mm open (only Log Out closes it); mainCmdOpen keeps sel; Status closes any window. |
| 9.3.0 | Phase 43: slim Items/Shop/Quests/Magic lists, equipment layout, Magic List + MP box, split side boxes, mob regen. |
| 9.0.0 | Phase 40: 16 equipment slots, Equipment window, item cards, resistances, slim Character, storage transfer screen. |
| 8.9.0 | Phase 39: classic interface (command bar, combat status, target/party panel, log, command menu, plates, cursor, status/skills/crafting/bag windows). |
| 8.8.0 | Phase 38: rename to Leid'anav Reborn, favicon, joint blending/bridges/islands for all rigs, bestiary portraits. |
| 8.7.0 | Phase 37: Social window, friends, linkshells, LFG, /search, blacklist. |
| 8.6.0 | Phase 36: player auction house (server listings, delivery box, sale alerts). |
| 8.5.0 | Phase 35: save checks + audit, atomic server trades, bans, setup versioning. |
| 8.4.0 | Phase 34: claim rules, cross-player skillchains/bursts, /assist Name. |
| 8.3.0 | Phase 33: shared monsters with zone host authority, claims. |
| 8.2.0 | Phase 32: player parties (shared XP, pool, crystals, cures), trading. |
| 8.1.0 | Phase 31: see other players in your zone, say/shout/tell/who chat. |
| 8.0.0 | Phase 30: Supabase accounts, cloud saves, sign-up password, admin panel; offline play removed. |
| 7.0.0 | Phase 29: blinking, hair and cape sway, NPC work poses and look-at, ambient animals and walkers, town props. |
| 6.9.0 | Phase 28: swing/WS/cast variety, idle fidgets, turn shuffle, directional flinch, KO and rise. |
| 6.8.0 | Phase 27: difficulty-based placement, tiered names/colours, Silkmother, Gorruk, Silk for Sale. |
| 6.7.0 | Phase 26: orcs, Reefkin, Crag Talons, treants, Needlekin, bombs; ranged mobs. |
| 6.6.0 | Phase 25: nine critter families with models and animations; rock colliders; camera stays out of houses. |
| 6.5.1 | Phase 24b: pets give no bonuses and are rare drops; no XP for landmarks; no crystals for achievements. |
| 6.5.0 | Phase 24: ten pets that follow you, Pets window, /pet, perks. |
| 6.4.0 | Phase 23: five playable races, gate guards and the City Blessing (essences need it). |
| 6.3.0 | Phase 22: auction houses with moving prices, stock, listings and delivery box. |
| 6.2.0 | Phase 21: eight-chapter main story, Ashen Herald, Ember of Ashenreach. |
| 6.1.0 | Phase 20: Dark Knight and Bard, scythes, songs, Mordrin and Lyra. |
| 6.0.0 | Phase 19: Adventurers' Guild, daily bounties, ranks, guild point shop. |
| 5.9.0 | Phase 18: level 20, Frostspire Pass, snow weather, Warcry, tier-4 weapon skills. |
| 5.8.0 | Phase 17: Chapel Depths battlefield; XP bar in party frame, phone chat bottom-left, minimap range, creation defaults. |
| 5.7.0 | Phase 16: Ranger and Summoner jobs, sprites, bows, Corin. |
| 5.6.0 | Phase 15: Thornstrider coats, Swift Saddle, Hollow Run time trial; gear fit fixes. |
| 5.5.0 | Phase 14: Saltreach Harbor town, Ilsa/Marn/Vela, sea fishing, level 13-14 gear. |
| 5.4.0 | Phase 13: cooking craft, meals with timed buffs; action bar hides empty slots; removed solo tip and Quests/Sound buttons. |
| 5.3.1 | Hotfix: storage-full fallback (phone character start), title screen. |
| 5.3.0 | Phase 12: fishing, weather (visuals and element bonuses). |
| 5.2.0 | Phase 11: treasure pool, Trade Board, Garrick augments. |
| 5.1.0 | Phase 10: Thief and Monk jobs, dagger/h2h weapon skills and gear, Wren and Tamsin. |
| 5.0.0 | Phase 9: level cap 15, Ashen Marsh, tier II spells, level 11 gear, 2 NMs, 2 quests. |
| 4.9.0 | Phase 8: companions 2.0, bestiary, achievements, smoother limbs, colliders, essences. |
| 4.8.1 | Hotfix: aggro restored, target command box, hidden levels, residence fixes, location save, body sliders. |
| 4.7.0 | Phase 6b: gathering, crafting, gardening; no heal effects at full; preview context released (above). |
| 4.6.x | Creation preview fix, hair lists by sex. |
| 4.6.0 | Phase 6a: residence, Pip, storage, NPC schedules, passive monsters, NM-only gear, crystals, menu rework, in-game confirms, loading showcase (above). |
| 4.5.0 | Phase 5d: the Sunken Crypt (above). Creation labels sex instead of build. |
| 4.4.0 | Phase 5c: quests (above). |
| 4.3.0 | Phase 5b: Paladin and Red Mage (above). |
| 4.2.0 | Phase 5a (above). |
| 4.1.0 | Renamed the game to Untitled Solo RPG. Title screen shows version and build date/time (`package.json` version, stamped by `build.mjs`). Save keys unchanged. Source pushed to GitHub. |
| 4.0 | Phase 4 build: interface, audio, loading screens, jumping. |
