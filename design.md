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
| `src/three-entry.js` | Which parts of three.js get bundled (core, Sky, Water, composer passes, geometry merging; no bloom since 16.19.0) |
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
  - Swings by weapon (18.19): the weapon is held forward in the fight stance and swung across at the target. One-handed slash has three variants (sweep right to left, back sweep, lunge with a short step forward), club smash and two-handed cleave sweep with the chest turning, staff and polearm thrust, alternating punches, claw swipes for ghouls.
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
Each main job has its own two pages (`save.hotbars[job]`), like macro books. When you learn an action it drops into the first free slot automatically; page 2 starts with Potion, Ether and Hi-Potion. Slots show an icon tinted by type (spell element, weapon skill gold, ability green), the hotkey, MP cost or item count, a cooldown sweep with seconds left, dimming when unusable, a gold glow on weapon skills when you have 1000 TP, a "→ Fusion" style chip when a weapon skill would continue the open skillchain, and a "Burst!" chip on spells that would magic-burst. Actions your current job can't use stay on the bar but dimmed. Keys 1–0 fire the Ctrl line, Shift/Alt/Tab+1–0 the other three lines (v18.6.0), [ and ] switch pages. The Action Bar menu tab lets you place, swap, clear and reset slots, and items can be added from the inventory.

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
- Shift+Tab (`cycleObjectTarget`): objects only (crystals, warp stones, signposts and other prop NPCs within 1200 px, by distance), in any zone. Plain Tab in a field zone with monsters within 450 px cycles monsters only.
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
- Items (replaced by classic MMO gear in 18.0.0; see "Equipment (v18.0.0)"): mats toad_oil, mire_reed. ITEM_LOOK entries for old ids were removed; autoLook covers new ids.
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
- Gear for the new jobs is now classic MMO gear (see "Equipment (v18.0.0)"). JOB_TINT and ITEM_LOOK entries for the new jobs and bodies still apply.
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
- Gear is classic MMO gear since 18.0.0. Companion corin (RNG dd) gets gear from autoGear with a bow in Range and arrows in Ammo, plus MERC_PERSONAL. Achievements summoner, sniper (stats.summons, stats.rngKills).
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
- Guild rewards are classic MMO pieces since 18.0.0 (desperado_ring, leaping_boots, armored_ring, healing_harness, variable_ring in GUILD_SHOP). Achievements bounty, silver, mythril.
- Tests: test/p18unit.js; p6unit townsfolk bed count now >= 7. p5shots scenes maera, guild.

## Phase 20: Dark Knight and Bard (v6.1.0)
- Jobs DRK, BRD (ADVANCED_JOBS lv 10; quests drk "The Shadowed Path" (2 crypt_dust, 3 bone_chip → bronze_scythe) and brd "A Traveler's Song" (3 mire_reed, 2 bat_wing → minstrel_coat), both from Tobin). jobsUnlocked gains DRK/BRD.
- New weapon type `scythe` (COMBAT_SKILLS, SKILL_NAMES): WS slice 5, nightreap 22, spiral_reap 40, grim_harvest 75. Items are classic MMO Zaghnals and Scythes since 18.0.0. Rig weapon kind "scythe" (pole + curved extruded blade), held/stowed like the greataxe and uses the cleave animation.
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
- Hotkeys: plain digit → UI.page line (Main = page 0), Shift → 1, Alt → 2, Tab held → 3. No Ctrl line (Ctrl+digit is blocked by guardKeys and acts as plain).
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

## Halls, caster melee, phone Status (v9.8.2)
- data.js: edge exits (not doors, not indoor zones) get e.hall = CONFIG.hallField (380) or hallTown (180) and e.lane; two wall rects form a corridor; exitInner(z,e) gives the inner end (+60). Every exit's tx/ty is set to the inner point of the paired exit in the destination. world3d exitMask carves border cliffs along the full hall depth and lane width.
- game.js meleeIfSafe(a,tgt,dt,acts): casters/healers melee when HP > 60% and not being hit (or HP > 80%); else keepCasterRange.
- Phone CSS (≤600px): narrower #mCmd, compact #stM rows (KV grid max-content/1fr, craft grid 1fr auto 30px), windows full width, #ui.modalOn hides #mCmd. Status list header has ◀ back (data-mc="back"). mobMenu steps back. Slim windows show #mHead ✕ on touch. fmtPlay → h:mm:ss.
- test/mocklogin clicks Play Online when the mode choice appears.
- normalizeSave keeps hired ids found in d.mercDefs (generated companions were dropped on load). COMPANION_CFG.dayMs = 24 h real, wageRate 1. companionInfo(p) (party row tap): countdown, wage, Pay now, Dismiss. Paths ending near a hall exit are rerouted via exitInner then the exit centre.
- Capture-phase pointerdown outside #tCmd (and its companions: mobBar, dialog, confirm, ffSide, mpBox) closes the target command box.

## v9.8.3
- #ui.modalOn hides #mCmd at ≤1020px. tabStorage outside S.zone.residence is a read-only slim list; store/retrieve actions refuse outside the residence. #log always uses --ffStripe (overrides .min/.lite phone styles). Capture pointerdown outside #menu .win/#mCard/#mCmd closes the window (desktop returns to main menu; narrow closes both); outside #mCmd/#stOv closes the main menu; ignored while a dialog/confirm is open or when tapping the log/top bars/mobile buttons.

## v9.8.4
- MAX_CHARS 5 (client); setup.sql chars_insert policy count < 5, schema 6 (NET_SCHEMA 6). Local-upload offer removed from the character list.

## v9.8.5
- #mobBar width matches #ffSide per breakpoint (210/168px), buttons flex. #logTap: invisible bottom-left zone on touch shown only while #chat.gone; tap → openChatInput. Phone #chat.min made #log pointer-events none, so taps never arrived; now forced auto on coarse pointers, touchend + click handlers, and openChatInput focuses synchronously (inside the gesture) so the phone keyboard opens.

## Phase 49: G2 terrain detail (v9.9.0)
- textures.js texGray(key,S,fn) → mean-centred grayscale tiling detail; texGrassDetail, texDirtDetail, texRockDetail.
- world3d terrainDetail(mat, field): onBeforeCompile adds vWP/vWN varyings; after map_fragment multiplies the baked macro albedo by a detail value: grass vs dirt chosen by macro greenness, triplanar rock by slope (0.22–0.45) or cave/crypt, faded with camera distance (30–90 m); rock areas desaturate toward warm grey. customProgramCacheKey "terrainDetail". Enabled on all qualities (CONFIG.terrainDetailLow).

## Phase 50: G3 plants and props (v9.10.0)
- buildVegetation: leafy2 (branching trunk + 6-clump canopy), bushes (quality 60/160/260), flower clusters (80/260/500, 5 colours via instanceColor, not in snow), fallen logs (fields, colliders). tintInst gives per-instance colour variation. Merged geometries must all be indexed or all non-indexed (Icosahedron is non-indexed → stem.toNonIndexed()).
- loadZoneAsync error path also resolves VIEW.zoneWaiters so enterWorld never hangs.

## Phase 51: G4 water (v9.11.0)
- buildWater: per pond foam ring (foamTex, double-sided, UV scroll + pulse), 2–4 ripple rings that respawn at random points every 3.2 s, waterfall (curved plane with scrolling fallTex + mist sprite) when a field pond is within r+420 of the zone edge and the terrain 140 units beyond is > 2.5 m above water. W3.waterFx animated by updateWaterFx (called from updateSky). Water colour 0x1e5a68, distortion 1.6.

## Phase 52: G5 town buildings (v9.12.0)
- textures.js texPlaster, texShingle. buildTown: per house style = hash(zone+index) % 3; styles 1–2 add plaster upper box, corner/mid beams and cross braces; all get window frames, sills, shutters (colour by style), flower boxes (style 1), door frame, lantern (emissive via W3.windowMats) + additive glow sprite (W3.lampGlows, opacity follows night), stone chimney. Barrels/crates instanced around houses (placeable). Roof material switched to shingles.

## Phase 53: G6 faces and hair (v9.13.0)
- rig.js atlas is now ATLAS_W×ATLAS_H = 1536×1024, 6×4 cells (ATLAS_COLS/ROWS); REGIONS gains face2..face8 (paint fn falls back to base name). paintFace(g, ox, oy, variant) draws 8 variants (iris colour, eye shape, lashes on even, brow weight/tilt, freckles 3, lids 6, mouth shape). humanEntry uses region "face"+(L.face+1). Look carries face (baseFromLook, walkerLook, NPC hash, generated mercs); char creation Face row (FACE_NAMES).
- HAIR_STYLES appended braid, mohawk, twintails, topknot (indices stable). hairPieces: mohawk crest (no full cap), topknot ball+tie, braid chain on hairTail, twintails. hairTail bone for long/ponytail/braid/twintails.

## Phase 54: G7 monster proportions (v9.14.0)
- Measured the user's reference meshes for proportions only (bounding ratios and slice profiles, extents / height): bee length ≈ 2.0, wing span ≈ 1.3; crawler (reared) length ≈ height, body width ≈ 0.8; fish-type length ≈ 2.0, fin span ≈ 1.05; sheep length ≈ 1.4, width ≈ 0.7. Tool: scratch stlprof.py (binary STL → extents + 10 slices). Designs stay original; only ratios used.
- rig.js: crawler segments r 0.205–0.23, Y0 0.27, last two segments and head lifted (lift()), longer legs, headTop 0.72 (now len/h 2.4). Bee abdomen sz 1.7 + 4 rings, longer stinger, wings span 0.42. Fish body sy 1.15, pectoral fins r 0.16. Sheep leg 0.47, bodyLen 0.74, bodyY 0.55.

## Phase 55: G8 grounding (v9.15.0)
- models3d syncEntity: SLOPE_KINDS (crawler, worm, quad, crab, fish, hare) sample ground ± halfLen (0.42 × mesh bbox z × scale) along facing; pitch = −atan2(front−back, 2·halfLen) clamped ±0.6, eased, Euler order YXZ; y = max(footGround − 0.02, max(front, back) − |sin pitch|·halfLen·0.9). Measured min vertex height above ground on a 1.1 m/40-unit slope: crawler −0.002, worm 0.10, sheep 0.03, lizard 0.05 (scratch slope.js).
- Existing: footGround (max of 4 samples), keepOutOfColliders/Rects (trees, rocks, logs, props, houses, walls), separate() between bodies.

## Phase 56: G9 shadows and depth (v9.16.0)
- models3d viewFor adds a shared blob shadow plane (radial canvas, opacity 0.7 low / 0.35 otherwise, polygonOffset) under every non-flying, non-prop entity; long bodies stretch 1.8×.
- (Removed in 16.19.0) rig.js charMaterial onBeforeCompile adds fresnel rim (RIM uniforms shared, cache key charRim); updateSky sets RIM colour from sun (cool at night) and strength (0.4 night → 0.28 day, 0.18 caves).
- High quality uses PCFSoftShadowMap.

## Phase 57: G10 motion (v9.17.0)
- `player.emote = {id, at}` set by emote commands (game.js); stands up if resting, faces target. `poseHuman` (anim.js) plays a per-emote pose block before the yaw logic; lengths: dance 5s, panic 3s, others 2.4s; uses setP/addP/env and v.rootOff.
- net.js `netEmote(id)` broadcasts event "emo" {id, e}; listener sets `o.emote` on the matching `S.others` entry.
- Start/stop smoothing (`an.spd`), idle variety (`idleAct`), cast and hit reactions already existed and were kept.

## Phase 58: G11 effects (v9.18.0)
- effects3d.js `residue(el, g, s)` after every `nuke`: per-element lingering particles; timed ones use `addItem(new Object3D, life, fn)` as a ticker.
- `VFX.ws` stores `v.wsEl` (first skillchain property's element from `SC_PROPS`); `updateTrail` tints the WS trail with it and sheds tip sparks; `wsHit` adds an element burst + shockwave.
- `VFX.hit` adds gravity sparks (white for slash, orange for blunt) and a dust ring for blunt/crits.
- `updateWeatherFx(dt)` (called from `updateFX` in try/catch): rain/storm splashes near the player, storm lightning every 7–16s (`WFX.next`) with delayed `sfx("lightning")`, wind leaves/dust, blizzard snow, fog wisps (also in `S.zone.mist`), field fireflies when `W3.daylight < 0.35` and dry. Counts drop on low quality. Skipped in cave/crypt/house.
- `fxFootstep` dust is white in snow/blizzard.

## Phase 59: G12 finish (v9.19.0)
- High: EffectComposer uses a HalfFloat MSAA (4 samples) target; passes Render → Bloom → Output → `W3.grade` (ShaderPass `GRADE_SHADER`: tint, saturation, contrast, vignette, applied after OutputPass in sRGB).
- `gradeTick(dayAmt, golden, gloom, cave)` called from `updateSky` sets uniforms.
- `autoQuality(P)` in the perf tick: 12 straight seconds below 24 fps at min pixel ratio drops the composer, then sun shadows, with a toast each time.
- Default quality: touch devices with ≤4 cores count as low-memory → Low.

## Phase 60: M1 mesh pipeline (v10.0.0)
- Bodies were already continuous-ish: rigid pieces per bone + `bridgeGaps` + `smoothJoints` 2-bone weight blending. M1 adds detail control + LOD rather than a rewrite.
- rig.js `RIG.segK` (default 1) scales segment counts in every g* helper via `sgK(n, default)`.
- `buildEntityRig` sets `inst.lodEntry()` → cached entry `"lo|"+sig` built with segK 0.5 (same bone defs).
- models3d `updateLod(v, e)` (start of `syncEntity`): beyond `LOD_DIST[quality]` (low 16 / medium 24 / high 32, × view scale, 10% hysteresis) builds a second SkinnedMesh sharing `v.mesh.material` and skeleton (`bind(skeleton, bindMatrix)`), added to the same parent; toggles visibility. Player never LODs. Bone count mismatch disables LOD for that view.
- Hands (non-skull): palm ball, curled finger taper + fingertip ball, thumb taper; `hk` = girth × 1.25 for doll (pipkin).
- Measured: humans ~4.7–7.4k tris near; far roughly half.

## Phase 61: M2 painted textures (v10.1.0)
- `RigBuilder.bakeShade()` (in `finish` after smoothJoints, skipped if `noBake`): multiplies vertex colours by k = (0.87 + 0.18·(0.5+0.5·normal.y)) × ground fade (0.86→1 over bottom 18% of height) × joint darkening (up to −12% where second skin weight > 0).
- (Removed in 16.19.0, see CLASSIC_PAINT) REGION_PAINT: cloth folds (tiling sin + fbm), hem + stitch lines near v edges; leather pores, ridge creases, lighter worn edges; metal dents, edge highlights, rust patches (rougher, less metal); skin fine fbm. All fbm calls use matching periods so u wraps without seams.

## Phase 62: M3 faces/hair (v10.2.0)
- anim.js lids: eased blink (sin over 0.16s), 20% double-blink; expression: laugh/cry 0.5 squint, panic wide (no blink), casting 0.3, resting 0.55, dead 1.
- rig.js `hairPieces` (uncovered, non-mohawk): fringe cards (5, or 7 for bob/long, none for spiky) = flattened tapers (flat 0.3) on head; 2 side locks per side (longer for bob/long). Long: smaller back ellipsoid + 7 strand cards on the hair tail bone.

## Phase 63: M4 gear sets (v10.3.0)
- rig.js: ITEM_LOOK gained 18 previously unlooked items. `autoLook(id)` builds a look from slot + name keywords (`MAT_TINT` colour table, metal keywords, lv ≥ 14 gold trim); `lookFor` uses ITEM_LOOK → `ITEMS[id].look` → autoLook.
- New look flags: `gauntlets` (cuff cylinder + ring on forearm, knuckle plate on hand), `greaves` colour (knee cop + front shin plate), `collar` (fur ring). Top type `plate` = mail skirt + front breastplate (chest) + abdomen plate (spine) using `top.plate`. Head types `furhat`, `widebrim`; `crown` uses `H.color`, optional glowing `H.gem`, radius adapts to hair.
- weaponEntry: blade colour by id keywords; `glowC` for lv ≥ 14 frost/sea/royal/warlord ids. Swords/daggers: fuller strip (glow if glowC), 3 grip wraps, crossguard end balls. Greataxe grip + glow ring; scythe glow finial; staff bigger orb at lv ≥ 14 and gold bands at lv ≥ 11.

## Phase 64: M5 races in motion (v10.4.0)
- `R.meta.race` (pipkin via L.doll, ursan, nekari, elari, human). View `stride` per race: pipkin 1.05, elari 1.85, ursan 2.05 (human 1.7).
- Ear bones `earL`/`earR` (children of head) for elf/pip/cat ears via `earBone(s)` in humanEntry.
- poseHuman race block (not mounted/resting/dead): pipkin bounce + head bob + wider arms + idle hip sway; ursan forward lean, chest roll, heavier dip, arms out; nekari hip/spine sway, crouch in fight; elari upright, small arm swing.
- Ears: random twitch every 2–7s; flatten by fight, recent hit (`an.hitStart` < 0.6s) and run. Tail: lash/raise with `an.fight`, faster wag.

## Phase 65: M6 monsters/NPCs (v10.5.0)
- rig.js `mobVariant(m)` = hash(famKey:id) % 3 (NM always 0). `varyMobLook(ml, vr)`: non-human → `col` darker (vr1) or warmer (vr2); human → top colour ×0.8/×1.15, vr1 adds cap/helm if no head/leafHead/crest, vr2 adds pauldrons (if sleeved) and belt.
- models3d `viewFor`: non-NM mob scale × (1 ± up to 6%) from hash("sz"+id).
- NPC_LOOK `odette` added; every NPCS entry now has a bespoke look (others fall back to walkerLook).

## Phase 66: Z1 distance/backdrops (v10.6.0)
- world3d `BACKDROP[zoneId]` {h[3], col[3], snow, sea, mark}; field zones without an entry use hollow's. Skipped for cave/crypt/house.
- `buildBackdrop(field, root)` (after buildWater): 3 ridge strips (128 segs) at radius half-diagonal +70/+190/+380 around zone centre; base = mean edge height − 6; height = fbm × h[L] + (maxTerrain − base) × R/half × 0.9 so tops clear the rim; sea gaps cut height; vertex colours = bottom 0.74 / top 0.88 (snow 1.0). MeshBasic, fog off.
- Landmark group (`mark`: tower/tree/peak/light) on layer 1; `W3.beacon` lamp brightens at night.
- `updateBackdrop(fogC, dayAmt)` from updateSky: colour = base × (0.35+0.65·day) lerped to fog by 0.42/0.62/0.8 per layer (aerial perspective).

## Phase 67: Z2 bigger zones (v10.7.0)
- data.js `ZONE_SCALE` {hollow 1.5, frost 1.4, marsh 1.4}; `scaleZone(z, k)` runs before spreadSpawns and the hall/exit passes: scales w/h, walls, landmarks (+r), spawns, npcs, water (+r), paths, ruins, gather spots, start; exits keep thickness, span scales, centre scales, re-snapped to edge. Sets `z.cs = 15` (terrain cell) and `z.vegK = k` (trees/rocks/small/tufts × k). `zsc(id)` helper.
- `ZONE_FEATURES` (original coords, scaled): plateau {x,y,r,h} and ravine {pts,w,d}; applied in buildFieldSteps `raw()` (reduced on paths).
- `RACE` built from `RACE_BASE` scaled (checkpoints, start, limit, medal times).
- Exit/path reroute: paths whose endpoint lies outside the zone near an exit get lane points (approach 150 past inner, inner, centre) before the outside tail; inner endpoints keep the old logic but skip when the other end is outside.
- Save migration: normalizeSave scales `loc` for scaled zones when the saved data lacks `zv`; sets `zv = 1`.
- Inbound tx/ty need no change (recomputed from exitInner).
- Tests updated: p5 sizes, p11 water position, p14 race time, p3 engage near a mob.

## Phase 68: Z3 life (v10.8.0)
- game.js `addWildlife(id)` (field zones, at zone load after zone.ambient): deer herds (2, or 1 in snow; `shy` flee ×2.6 speed when player < 140px), 2 bird flocks (`fly` 7–12 world units, roam 500, `dry`), 2 road travellers on paths[0] (inside-bounds points, ping-pong loop) + a dog. Entries carry `time` ("day") and `wild`.
- `ambientAwake(a)` (time/dry vs weather) → `a.away`; models3d hides away ambients and lifts `fly` entities with a slow bob. poseBird flaps continuously and tucks legs when flying.
- rig: ambient types `bird` (birdEntry) and `deer` (quadEntry).
- effects3d (in updateWeatherFx): butterflies = up to 7 (3 low) random-walk anchors emitting short particles (day, dry, field, not snow); fish jumps every 4–9s in a water circle near the player (splash + arc + delayed splash).
- audio.js `AMBX`: looping noise through filters on the amb bus — rain (bandpass 2.6k), wind (lowpass, LFO, brighter when windy; base on frost), surf (harbor, swell LFO); critters via oscillators: frogs (marsh night), crickets (field night), birdsong (field day, not snow). `ambxTick` from updateAudio, throttled 0.5s; skipped in HTML-audio fallback.

## Phase 69: Z4 points of interest (v10.9.0)
- data.js tail: `poiSpot(z, cx, cy, rad)` spiral search for a free spot (bounds 160, walls 70, water 70, ruin segments 90, spawns 110, npcs 140). For hollow/frost/marsh adds NPCS `lookout_<z>`, `shrine_<z>`, `tablet_<z>` (prop tablet), `cache_<z>` (prop chest, chest "vault", talkChest) near landmarks 0/2/4/last and pushes to `z.npcs`. `POI_IDS` (non-cache), `POI_LORE[zone]`, achievement `wayfarer`.
- game.js TALK: `talkLookout` (marks all zone landmarks, first visit +60 xp), `talkShrine` (10 crystals, 1h cooldown in `save.timers["shrine:"+id]`, buff `boon` 30 min → gainXp ×1.1, first +40 xp), `talkLore` (first read +50 xp). `save.poi[id]` = first-visit time.
- models3d propView: `lookout` (4 posts, deck, roof, ladder, flag), `shrine` (stone altar, orb, candles, warm light). hud4 minimap shows `n.poi` dots (purple; cache gold).

## Phase 70: Z5 travel (v10.10.0)
- data.js tail: camps for hollow/frost/marsh via poiSpot near the middle landmark: NPCS `campcrystal_<z>` (crystal, talkCrystal, camp) + `camp_<z>` (prop camp, talkCamp, poi "camp") 90px east. Signposts `sign_<z>_<i>` (prop sign, talkSign, signTo) beside each hall's inner end (offset lane+45 sideways) in non-cave, non-house zones.
- game.js: talkCrystal attunes (`save.attuned[id] = zone`), "Set as home point" only when `S.zone.safe` (town-only home rule kept; p1 test asserts no crystal_hollow), "Warp" option → promptChoice → `warpTo(id)` (CONFIG.warpCost 50, not while engaged; enterZone at crystal +80y). `talkSign` lists exits with compass direction and distance (px/10 "yalms"). `onRoad(e)` (path w×0.6); `mountMul` × CONFIG.roadBonus 1.15 on roads outside safe zones (p3 speed bound widened).
- models3d propView: `sign` (post + two arms), `camp` (tent cone, stone ring, fire, logs, light); syncNpc flickers `v.campFire`.
- Ferry deferred to phase 79 (Gull Isle) since it needs the island zone.

## Phase 71: Samurai, Ninja, Dragoon (v11.0.0)
- data.js block before `const SHOP`: ALL_JOBS += SAM/NIN/DRG; ADVANCED_JOBS lv 12 (quests sam/nin/drg); JOBS stats; COMBAT_SKILLS += gkatana/katana/polearm; MAGIC_SKILLS += ninjutsu; SKILL_NAMES; SKILL_RATINGS; 12 WEAPON_SKILLS; ABILITIES meditate/hasso/third_eye (SAM), smoke_step/twin_strike (NIN), jump/high_jump/dragon_spirit (DRG); SPELLS shadow_veil (buff "shadows", n 2 +1 at lv12), flame/frost/gale_shuriken (nukes, skill ninjutsu), binding_thread (debuff bind); 12 weapons (bronze/iron/steel in SHOP, frost tier at vela); WAR armour also fits SAM/DRG, THF armour fits NIN. Quests appended at file end.
- game.js: doAbility meditate (+400 TP), smoke_step (halve enmity on all mobs), jump/high_jump (×1.45/×1.9 base dmg, +100/150 TP, high halves enmity; sets `a.jumpAt/jumpHigh`). swing(): defender `third_eye` or `shadows` (count n) negate non-ranged hits first; hasso +10 acc ×1.12 dmg; dragon_spirit ×1.15; new wtypes count as slash. castBuff sets shadows.n. castDebuff text for bind. Merc gear and MERC_ROLES for new jobs.
- twin_strike: swing() recurses once per attack while the buff has `left` (3) charges; `a.twinning` guards recursion.
- rig: JOB_TINT for new jobs; weaponEntry `gkatana`/`katana` (curved extruded blade, wrapped grip, round guard, edge strip/glow) and `polearm` (long shaft, two grips, spearhead + side prongs). anim: gkatana = cleave/two-hand stance; polearm = thrust/staff stance; jump arc pose (rootOff up to 2.2/3.2). models3d attach/sheathe rules include new kinds.
- Tests: p31unit (quests, abilities, shadows, Third Eye, Jump). harness exports `aggro`.

## Phase 72: Beastmaster, Blue Mage, Corsair (v11.1.0)
- data.js block before `const SHOP`: jobs BST/BLU/COR (lv 14 quests bst/blu/cor appended at file end), skill `axe` + magic `blue`, 4 axe WS, abilities call_beast/reward/feral_howl (BST), burst_affinity (BLU), phantom_roll ("Valor Roll")/quick_shot/hawk_roll/double_down (COR). 10 blue spells `blu_*` (`blue: true`, skill "blue", kinds bluephys/debuff/drain/nuke) and `BLUE_LEARN` move-name → id; scroll generator skips `sp.blue`. `BEASTS` tiers (hill_lizard 1, pond_crab 8, mountain_ram 14). Axes bronze–steel at SHOP, frost at vela. Equip rules: COR on daggers/swords, BLU on swords/clubs; armour WAR→BST, RDM→BLU, THF→COR.
- game.js: `callBeast` (ally pet with `beast`, `fam`, job WAR; tickPet releases on job change/death, no upkeep), Reward, Feral Howl (`weaken` ×0.85 attacker dmg), `rollDice(a, kind, add)` (d6; Double Down adds; >7 busts; tables valor [..,14 at 5,..16 at 7], hawk [..,10 at 4,..12 at 7]; party within 300 px, 3 min; `a.lastRoll`), Quick Shot, `castBluePhys` (baseDmg × pDIF × mul × (1+blue skill×0.004)), Burst Affinity also boosts blue nukes, `blueLearnFrom(m, mv)` in execTpMove (BLU within 400 px, 50%, level gate). swing: valor_roll damage, hawk_roll accuracy, weaken.
- rig: beast pets render via mobLook → lizard/crab/sheep entries (`beast|fam` sig); JOB_TINT for BST/BLU/COR; weaponEntry `axe`.
- Tests: p32unit.

## Phase 73: Puppetmaster, Dancer, Scholar (v11.2.0)
- data.js block before `const SHOP`: jobs PUP/DNC/SCH (lv 16 quests pup/dnc/sch at file end). Abilities: activate/repair/tune_up (PUP); healing_waltz (tp 200), quick_step (tp 100), rising_flourish, group_waltz (tp 400) (DNC); light_arts/dark_arts/penury/ebullience (SCH). SCH gets every non-song, non-summon, non-blue spell with WHM/BLM level ≤ 18 at that level +2 (max 20). `AUTOMATON_LOOK`. Equip rules: h2h→PUP, dagger→DNC, staff/club→SCH; MNK armour→PUP, THF→DNC, BLM/WHM→SCH.
- game.js: doAbility charges `ab.tp` first (refunds recast if short). `activateAutomaton` (ally pet `automaton`, job WAR; tickPet releases on job change/break). Repair 50%, Tune Up = pet `warcry` 60 s. Waltzes heal (lv×9 + mnd×2 + agi; group ×0.7). Quick Step `stepped` {n≤5} → +5 acc per step for any attacker (swing hitChance). Rising Flourish ×(1+0.5n). `artsMatch(a, sp)`: light = heal/buff/dot, dark = nuke/debuff/drain/aspir → cast ×0.8 (startCast) and MP ×0.9 (finishCast). Penury: white spell free. Ebullience: non-blue nuke ×1.3.
- rig: automaton pet = humanEntry(AUTOMATON_LOOK); JOB_TINT for PUP/DNC/SCH.
- Tests: p33unit.

## Phase 74: Geomancer, Rune Fencer (v11.3.0)
- data.js block before `const SHOP`: jobs GEO/RUN (lv 18 quests geo/run at file end), skill `gsword`, magic `geomancy`, 4 gsword WS. `GEO_AURAS` (indi_vigor/indi_fury/indi_focus self auras; geo_torpor/geo_frailty/geo_languor luopans) → SPELLS kind "geo". Abilities full_circle, mending_halation (GEO); kindle/rime/gale/stone_rune, lunge, vallation (RUN). Great swords bronze–steel at SHOP, frost at vela. Equip: club→GEO; WHM/BLM armour→GEO; WAR/PLD armour→RUN.
- game.js: `castGeo` sets `a.indi {id, until}` or `a.luopan {id, x, y, until, mp}`; `tickGeo(dt)` (each 1 s from step) refreshes aura buffs on party within 300 px (vigor heals 3% every 3 s) and luopan debuffs on mobs within 140 px (slow / geo_frail / weaken). geo_fury ×1.10 melee, geo_focus ×1.12 nukes, geo_frail ×1.12 damage taken by mobs (applyDamage). Runes: `buffs.runes {list ≤3, until 300 s}`; applyDamage from mobs ×(1−0.05·runes) and ×0.8 with vallation; Lunge sums (lv×6+int×1.2)×weakness per rune. Vallation hits add 30 enmity.
- effects3d `updateGeoFx`: ring decal around an aura caster (300 px) and luopan ring + spinning gem (140 px).
- rig: weaponEntry handles `gsword` via the sword path (longer, wider, long grip, wide guard); anim/models3d treat gsword as two-handed.
- Tests: p34unit; harness exports applyDamage.

## Phase 75: Ironvale, second city (v12.0.0)
- data.js: `ZONES.ironvale` (1400×1100, safe town, palette snow) defined before ZONE_SCALE; Frostspire gets an east exit (original coords x 2976, y 1080) — scaled with the zone; tx/ty auto from exitInner. NPCs (file tail): brisa (talkBrisa → questOptions), haldor (talkHaldor → shop "haldor"), orla (talkAuction), crystal_ironvale (home point allowed, safe), guard_ironvale, shared trade_board. WEATHER.ironvale.
- Haldor's mythril tier was removed in 18.0.0. `SHOPS.haldor` now lists every +1 item of level 14 or higher plus iron_ingot, potions and ether.
- Quests smokeline (kill 6 frost_stonechucker, lv 18) and orerun (4 iron ore + 3 frost shards, lv 17). Achievement `ironvale`.
- rig: NPC_LOOK brisa/haldor/orla; MAT_TINT mythril/ironvale. world3d: BACKDROP and ATMOS entries for ironvale.
- Tests: p35unit.

## Phase 76: Sunscar Desert (v12.1.0)
- data.js (before ZONE_SCALE): families dune_lizard, sand_crab, sun_wasp, dune_worm, cinder_bomb via tierFam; NM `sandmaw` (worm base) → ITEMS.dunestrider_boots; `ZONES.sunscar` (3000×2200, field, palette "desert", lv 17–20, north exit to Ironvale; Ironvale gets a south exit and road). Bestiary entries at file tail (BESTIARY is defined late). WEATHER.sunscar, achievement `sunscar`.
- textures `TERRAIN_THEMES.desert`. world3d buildVegetation: `desert` → 85% of trees become instanced cacti (trunk + two arms, tinted), no flowers, tufts ×0.25. BACKDROP/ATMOS sunscar.
- Spawn spacing (3 cells of max(w,h)/15) keeps 8 camps; the rest become alts.
- Tests: p36unit; harness exports NM_FAMILIES.

## Phase 77: Verdant Jungle (v12.2.0)
- data.js (before ZONE_SCALE): families vine_crawler, jade_hornet, jungle_sapling, bloom_mandrake, jade_toad; NM `old_mossback` (treant_elder base) → canopy_cloak; `ZONES.verdant` (3000×2400, palette "jungle", mist, vegK 1.6, lv 17–20; west exit to the marsh). Marsh gets an east exit (orig x 2776, y 700) and its middle path extended to it. WEATHER.verdant (rainy), achievement `verdant`, bestiary at file tail.
- textures `TERRAIN_THEMES.jungle`; world3d: jungle trees ×1.35 scale, all broadleaf; BACKDROP/ATMOS verdant.
- Bug fix: dropLoot scroll pool now requires `ITEMS["scroll_" + id]` (blue spells have no scrolls; undefined item crashed giveItem).
- Tests: p37unit.

## Phase 78: Cinder Peak (v12.3.0)
- data.js (before ZONE_SCALE): families magma_lizard, obsidian_crab, magma_worm, ash_orc (orc_grunt), cinder_bones (skeleton); NM `pyreclaw` (hill_lizard base, night) → pyre_ring (res_fire 10). `ZONES.cinder` (2800×2400, palette "volcanic", lv 18–20, lava = zone water; no FISH entry so no fishing). Sunscar gets an east exit (orig x 2976, y 950) and a trail from the Red Spire. WEATHER.cinder, achievement `cinder`, bestiary at file tail.
- textures `TERRAIN_THEMES.volcanic`. world3d: volcanic vegetation (trees ×0.08, rocks ×1.8, small ×1.5, tufts ×0.06, no bushes/flowers); rock material tinted dark (volcanic) or sandy (desert); lava water = emissive orange MeshStandardMaterial with scrolling normal map. effects3d: rising embers and falling ash near the player in volcanic zones.
- Tests: p38unit.

## Phase 79: Gull Isle and the ferry (v12.4.0)
- data.js: families reef_crab, shore_lizard, gale_talon (birdfolk), isle_snapper; NM `old_saltjaw` → saltjaw_earring; gull_charm (quest `isle_supper` from Old Wend). `ZONES.gullisle` (2200×1800, palette "beach", `island: true`, no exits, 8 large water circles around the edges as the sea, gulls ambient). NPCs ferry_harbor (Saltreach docks), ferry_isle, wend (file tail). FISH.gullisle, WEATHER, achievement `gullisle`, CONFIG.ferryCost 100.
- game.js: talkFerry → `startFerry(to)` (fare, not in a fight; `S.ferry {to,x,y,at: +6 s}`), `tickFerry()` from step enters the destination. talkWend → questOptions("wend").
- world3d: `zone.island` skips the edge cliff raise in buildFieldSteps and skips backdrop ridges (open sea horizon). textures `TERRAIN_THEMES.beach`. rig NPC_LOOK ferryman, wend.
- Tests: p39unit.

## Phase 80: The Red Spire (v12.5.0)
- data.js (before ZONE_SCALE): `SPIRE_FLOORS` → zones spire1..spire4 (1000×800, crypt theme, west exit down / east exit up, 4 spawns per floor, lv 17–18 → 20–21) and `spire_top` (boss `spire_warden` lv 23 = hollow_king clone, scale 1.9, Spire Collapse AoE; loot warden_blade (gsword, RUN), spire_mantle). Sunscar gets a door exit at the Red Spire (2600,600) → spire1; spire1's west exit returns beside the door (tx/ty kept because the door has no hall).
- rig mobLook `spire_warden` (skull, red plate with glowing trim, horned helm, greatsword). Achievement `spire` uses `save.nmKilled.spire_warden`.
- Tests: p40unit.

## Phase 81: Underdeep River (v12.6.0)
- data.js (before ZONE_SCALE): families glow_bat, pale_crab, lumicap (shroomling), deep_worm; NM `lumicap_matron` → lumen_earring; items glowcap, glowfin, blind_eel. `ZONES.underdeep` (3200×1000 cave, `glow: true`, divider wall x 1550–1670, river = 12 water circles along y≈800, boatmen boat_west/boat_east). Verdant gets a door exit (2700,2100). FISH.underdeep, achievement `underdeep` (save.stats.boatRides).
- game.js: `startFerry(to, x, y, cost, msg, secs)` generalised; same-zone trips (`boat`) move the alive party to the far landing and count boatRides. talkBoat.
- world3d `buildGlow(field, root)` for `z.glow`: ~160 instanced emissive mushrooms and crystals + 4 coloured point lights.
- Tests: p41unit.

## Phase 82: Windreach Highlands (v12.7.0)
- data.js (before ZONE_SCALE): families plains_hare, plains_lizard, wind_wasp, highland_longneck, highland_orc; NM `thunderhoof` (longneck, day) → windrunner_boots; nomad_sash/nomad_cloak quest rewards. `ZONES.highlands` (4000×3000, palette "highland", `openRange: true`, lv 10–15). Hollow gets a north exit (orig x 1250) and a road from the junction (1650,1050) around Mirror Lake. NPCs tarqa (quests orcraid, feltwork), essa (SHOPS.essa), nomad_rider, camps camp_nomad_a/b. WEATHER, achievement `highlands`.
- game.js: mountMul road bonus applies anywhere in `openRange` zones. talkTarqa/talkEssa/talkRider.
- textures `TERRAIN_THEMES.highland`; world3d highland trees ×0.35, rocks ×0.8; BACKDROP/ATMOS highlands. rig NPC_LOOK tarqa/essa/nomad.
- Tests: p42unit.

## Phase 83: Region control (v13.0.0)
- data.js `CONQUEST` {nations ash/iron/beast, regions vale/mire/coast/peaks/sands with zone lists and start holders, beastDaily 30, rivalDaily 20, holdBonus 40}.
- game.js: `conquestState()` (lazy `save.conquest {day, pts, held, nation}`; on a new real day tallies pts + beast daily + rival daily (if not your nation) + holder bonus → `held`, resets pts). `conquestKill(m)` from killRewards (+max(1, lv/2) for your nation in the current region). `conquestPriceMul()` (0.9 if your nation holds ≥3, 1.1 if beasts ≥3) via `buyPrice(id)` (buy(), shop list and buy prompt). `conquestXpMul()` +5% in held regions (gainXp). `pledge(side)` from Rhea (when she has nothing else) and Brisa options. `/conquest` command; region line on zone entry.
- Tests: p43unit; harness exports conquestState, killRewards, heldCount, buyPrice.

## Phase 84: Weather that matters (v13.1.0)
- data.js: WEATHER_INFO.sandstorm (el earth); sunscar/cinder tables include it. Spawn entries may carry `weather` (string or array); alts keep it. Tail adds weather-only spawns: sunscar dune_worm (sandstorm), frost ice_wight (blizzard, coords × zsc), marsh drowned (fog) — pushed after spacing so they are separate points.
- game.js: `weatherMatch(w)`, `spawnOpts` filters by weather; `updateWeatherSpawns()` (from updatePeriod each tick) despawns idle mismatched weather spawns, schedules newly valid ones, logs the change. `visMul()` (fog 0.6, sandstorm 0.5, blizzard 0.6, rain 0.85, storm 0.8, snow 0.9 outdoors) scales `detects` sight. `weatherSlow()` 0.85 on foot/mounted in blizzard/sandstorm in field zones.
- world3d updateSky: sandstorm = gloom 0.5, tan fog lerp, fog ×0.2, fast clouds. effects3d: sandstorm blows tan dust (blizzard branch).
- Tests: p44unit; harness exports visMul, weatherSlow.

## Phase 85: Expeditions (v13.2.0)
- data.js tail: `EXPEDITIONS` {wilds lv 12, fire lv 17, ends lv 19} with `steps` of type zone / visit (zone + landmark id) / kill (fam, n) / talk (npc, say); last step `final` talk to maera. Reward items trailblazer_boots, explorers_ring, pathfinder_mantle; achievement `expeditions` (save.expDone).
- game.js: `save.exped {id, step, count}`; `expTick` (zone/visit checks, from updatePeriod each tick), `expKill` (killRewards), `expTalk` (talkTo before TALK; non-final talk steps show `say`), `expOptions()` added to talkMaera (offer by level when idle; "Report" on the final step), `expReport()` + `/expedition`.
- Tests: p45unit.

## Phase 86: World atlas (v13.3.0)
- menu4 `worldMapSVG()` rewritten: `ATLAS_POS` fixed layout for every zone (spire floors collapse to spire1 = "Red Spire"); `atlasLinks()` from all exits (doors dashed) + the Gull Isle ferry (blue dashed). Known = save.discovered + outpost + residence + current; neighbours of known show as ???; others hidden. Known field zones coloured by their region holder (CONQUEST), towns gold; "% mapped" from save.explored. Footer: discovered count and nation legend. Shown under "Atlas" in the Map window.
- Achievement `atlas` (Cartographer): all 16 atlas areas discovered.

## Phase 87: Night- and weather-only content (v13.4.0)
- NPC `only` field ("night" | "day" | weather name): `npcOn(n)`; set at zone load and kept in updateNpcs (away when off; messages on appear). Luna (outpost plaza 660,470, only night, SHOPS.luna: moon_tonic, nightglass_earring, ether, hi_potion). `mirage_shimmer` prop (only sandstorm; models3d prop "mirage" = translucent shimmering column + light, bob).
- Exits may carry `weather` (and the exit loop skips them when it doesn't match): Sunscar door (380,1480) → `ZONES.mirage` (1400×1000 desert, mist, lv 20 spawns, NM sandglass_wisp (bomb base) → mirage_veil, cache_mirage vault chest, landmark Glass Garden). Highlands second longneck spawn has NM gloamhorn (night) → gloam_ring. Achievement `mirage`.
- Tests: p46unit (harness exports vana); p5 NM unique rate rule (25–35%) respected.

## Phase 88: sculpted heads (v13.5.0) — plan Q1
- Master plan for phases 88–115 lives in design/model-plan.md (models, sound and icons, environments, cities, wilderness).
- rig.js `HEAD_PROFILES` (human0/human1/elari/pipkin/ursan/nekari/goblin/orc/skull/ghoul/fish/beast/plain): jaw, chin, brow, sock, cheek, nose, noseW, lips, long, muzzle, neckR. `headProfile(L)` picks by L.headShape, else skull/goblin nose/tusks/fin ears/beak-leaf-needles/claws+noFace/noFace/race/sex; female non-human races soften brow/jaw/nose.
- `headRadial(P, x, y, z, feat)`: radius factor for a unit direction (front +z). Macro terms: jaw taper (x² on the lower half), lower-face lengthening, chin, nape, occiput, temples, front flattening, muzzle, and the under-jaw cut-in (jawline jl from -0.58 at the sides to -0.88 at the chin; below it the horizontal radius is pulled to neckR 0.42 so the head meets the neck with no bubble). Feature terms (feat=true) are Gaussians in face angles a = atan2(x, z), b = -asin(y): brow, eye sockets at `FACE_PX` (eyeA 12 px, eyeB = the painted eye row), cheekbones, nose ridge + alae, lips with mouth crease, chin knob.
- `gHead(P, hc, hr)`: own grid (not SphereGeometry) with density warped toward the face (`densityMap`), 44×30 at segK 1; uv = phi/2π, 1-θ/π mapped through the regionUV margin (`headUV`) so the face cell's pixel 64 is exactly front (the old sphere was 0.1 rad off). Seam and pole normals averaged. `HEAD_SCALE` [0.87, 1.04, 1.0].
- `gLid` builds blink lids from the same surface (+0.016) over each painted eye; anim.js lid rotation unchanged. `warpToHead(g, P, hc, hr)` warps any shell built around the head centre with the macro shape (used by beards).
- Hair: `hairEdgeFn(st)` = hairline angle per style (keys at 0, 0.75, 1.45, 2.2, π rad from the front, with a wave); `gHairShell` is a head-following shell from crown to that edge (thicker on top); `gHairLocks` lays 24 tapered strips over the edge (swept fringe on short styles, longer bangs on bob/long/twintails). Spiky keeps its spikes; mohawk unchanged. `hairPoint` samples the shell. Beards are a warped front shell from below the lips plus a two-piece moustache.
- `paintFace` rewritten (drawn in 256-unit space, scaled to ATLAS_CELL): socket and under-eye shading, almond sclera, radial iris with dark limbal ring, pupil, two highlights, top lid shadow, lash line (+ outer lashes on even faces), lower lid line, lid crease, filled tapered brows with hair strokes, cheek blush, nose side shadows, bridge/tip highlights, nostrils, cupid's-bow upper lip, fuller lower lip with highlight, mouth line (smile per face), chin shadow, freckles (face 4).
- Skull mobs: mandible ring, chin block, rami to the ears, 2×10 teeth, dark sockets behind glowing eyes, nasal cavity. Glow eyes for all noFace mobs sit in the sculpted sockets. Helm cheek guards follow the narrower jaw.
- Cactus (`look.cactus`, `cactusBody` with `gRibbed` lathe ribs and `cactusSpines`): ribbed column over hips/chest/head bones, carved eyes and mouth, flower (gold for cactus_king, crown ring), saguaro arms (horizontal upper arm on upArm, upright forearm on foreArm), ribbed stub legs and root feet. Uses the human skeleton so all human animation works.
- Atlas: `ATLAS_CELL` is 512 on High (3072×2048), 256 otherwise; painters get 256-space pixel coords, normal-map slope scaled by PK.
- Test tool: test/headshot.js `<html> <out> '[specs]' front,q,side,back <cols>` (env SHOT_T tile px, QUALITY low|medium|high; race spec race/job/build/hairStyle/face).
- Known limits: hair locks are single-sided strips (double-sided material); beards are one shell; face paint is still one texture cell per face (Q4/Q5 bring more).

## Phase 89: lofted bodies, movement speed, foot planting (v13.6.0) — plan Q2
- `gLoft(rings, seg, capFirst, capLast, v0, v1)`: tube through superellipse cross-sections {y, x, z, rx, rz, f (front depth mult), b (back), p (exponent)}; winding follows ring direction; caps optional; seam normals averaged. `blendW(y, [[y, bone, halfWidth]...])` gives two-bone weights across joints. `RigBuilder.addW(geo, bone, color, region, wfn)` writes explicit skin weights and marks `userData.rig.pre` so `smoothJoints` skips it.
- Human torso = two lofts sharing the belt ring: pelvis (crotch, glutes deeper at the back, hips; legs colour or robe colour) and torso (waist, ribcage, chest/bust front depth, shoulder line, trapezius slope, neck base), weights hips→spine→chest→neck. Arms: one loft per segment colour (deltoid cap tucked into the torso, biceps front fullness, elbow, forearm muscle, wrist), weights chest 0.3 at the shoulder top, upArm/foreArm across the elbow (±0.035), foreArm/hand at the wrist. Legs: one loft (inside the pelvis, upper thigh, knee with front bulge, calf back bulge, ankle), hips 0.35 at the top, thigh/shin across the knee (±0.04), shin/foot at the ankle. Old shoulder/elbow/knee balls and limb tapers removed (skeletons keep their bones look).
- Speeds: `CONFIG.runSpeed` 100 px/s (5 m/s; was 140), `mobSpeedMul` 0.72 on family speeds, `npcSpeed` 45, companions ×1.08, pets ×1.15, buddy ×1.2, remote players runSpeed. Mount ×2.2 unchanged.
- Gait (beat sheet, human, leg length L ≈ 0.86 m): walk 1.3 m/s, cycle 1.4 m, duty 0.62, ~1.9 steps/s, heel strike 42% of stance length ahead of the hip, toe-off with heel lift when out of reach, swing arc 6 cm; run 5 m/s, cycle up to 1.4 × 1.9, duty 0.34, ~4 steps/s, swing arc 16 cm, hips 3 cm lower. Arms counter-swing (existing), hips bob highest mid-stance.
- `strideEff(v, spd)` = stride × (1 + 0.9·run) capped at 1.25·L/duty (short legs take quicker steps); used by both the phase integrator (`trackEvents`) and the IK so planted feet move exactly with the ground. Base strides: human 1.4, elari 1.55, ursan 1.65, pipkin 0.85.
- `humanLegIK(v, an, w, run)` runs after `applyPose` (not eased, so no lag slide): per foot, phase → stance (z from +0.42D to −0.58D, D = duty·stride) or swing (smoothstep + sine lift, toes up); hip joint from hips quaternion + root offset; out-of-reach targets lift the ankle (heel raise, foot pitched); two-bone solve in the sagittal plane, knee forward; thigh set by quaternion inv(hips)·Rx(angle) so hip twist/roll don't drag the feet; weight `an.ikW` eases with speed and drops to 0 when mounted, resting, sitting, dead, jumping or during a weapon skill.
- Verification (test/gaitprobe.js, phase-based stance frames, horizontal world speed of the ankle): planted-foot median 0.005 m/s walking, 0.014–0.024 at 3.6 m/s, 0.03–0.04 running (was 0.8 / 3.2). test/gaitsheet.js renders side/three-quarter contact sheets (`<html> <out> <spec> <px/s> side|q <frames>`).
- Fixed: effects3d `updateTrail` used `L` before its declaration (crashed during gold weapon-skill trails).
- Known limits: IK is sagittal only (no terrain slope or step-up IK yet); monsters with non-human rigs keep their old cycles (phase 98).

## v13.6.1: classic command menu
- template4 tail CSS: #ffTop/#ffNetBox at top 13px so the on-border labels (-9px) are on screen; .ffLbl 12px italic outlined. #mCmd: navy panel, light border with inset rules, overflow visible (so the pointer can stick out), `.ffMLeg` legend ("Commands", or "Status" in the Status list) centred on the top border, page arrows small under it; `.ffb` lavender pills, `.sel` brown-orange with orange text, `.cur` an inline SVG silver pointer at left -58px (-42px on phones).
- hud4: main menu header markup gains `.ffMLeg`; NPC/object targets show no "NPC" tag or talk hint (only the ❗ line), name green for props/crystals; empty #tInfo/#tToT/#tChain hidden; npc target box hides bars.

## Phase 90: hands, feet, animal heads, knock-outs and raising (v13.7.0) — plan Q3
- Hands (rig.js humanEntry, non-skull): wrist ball, palm box + flattened ball, four two-segment fingers on new bone `fingersL/R` (knuckle line at wrY − 0.078·hk), two-segment thumb on `thumbL/R`. anim.js poseHuman sets curl on those bones every frame: relaxed 0.35 (+ slow breathing wobble), 1.3 right hand when a weapon is drawn, 1.2 left for two-handed weapons, 1.55 fists when barehanded and fighting (curl is a z rotation, sign by side; thumb x/z).
- Feet: `gSweepZ(rings, seg, capA, capB)` lofts superellipse rings along +z (normals auto-corrected). Foot = heel → arch → ball → toes, sole flat on y 0; boots ×1.08 with a darker sole slab and toe cap; barefoot adds five toes (big toe inside).
- Animal heads: `animalHead(R, bone, o)` = skull sweep (cranium, brow, cheek, muzzle, nose cap), lower jaw sweep, nose pad, nostrils, eyes with catch-lights, brow ridges, optional mouth line; options r, snout, mw (muzzle width), flat, eye, eyeK. quadEntry uses it; ears are flattened tapers with an inner skin layer (`droop` for sheep). Tuned: sheep snout .75 droop, lizard snout .9 mw 1.1 flat .62 mouthLine, longneck 1.0/.75, deer .85/.72, dog .75/.78, cat .22.
- Knock-outs: onKO sets `koUntil` = now + CONFIG.koMinutes (60, real time) and clears buffs; the player gets `save.ko` (persists; `restoreKO()` on login re-applies or sends home if expired) and the world keeps running (main loops always call step). `koTick()` (in step): player timeout → returnHome; companion timeout → permadeath (`mercFallTick`) or dismissed back to the hall. `revive(t, pct, by)` restores pct HP/MP, buff `weakened` (CONFIG.weakenedSecs 180; att/def/acc ×0.85 in stat()), clears save.ko/mercDown. returnHome also applies Weakened. `giveUpKO()` confirms then returns home.
- Raise: SPELLS raise (WHM 12, RDM 17, PLD 18, 50 MP, 8 s, pow .25) and raise2 (WHM 18, 90 MP, pow .5), kind "raise", target "dead" (checkAction/resolveTarget accept KO'd party members or mates). finishCast handles raise before the alive check; remote mates get netCastOn → fx kind "raise" → netOnFx revives the receiver. Item ember_plume (revive .2, 1200, Pell) on the targeted or first KO'd party member within cast range. `raiseAI(a, dt)` runs before role AI: walks into range of a KO'd member and casts the best affordable raise unless hurt and targeted. MERC_LINES.raise.
- KO box: #ko is now a small box at top-left under the Commands bar ("Time Left: mm:ss" + orange "Back to Home Point" pill); the Commands label reads K.O. and Help explains the choice; menus close and the target clears on KO.
- Colours: hud4 `logTone(msg, cls)` maps lines to say/pchat/tell/ls/shout/yell (chat), ws (WS, crits, skillchains, bursts: gold), heal (green), mpc/buff (blue), hurt (damage taken: pink), missc (misses/resists: purple), warn (errors, KOs, bad status: red), dmg (white). view3d name plates: NPC green, players/calm mobs white, aggressive or attacking mobs red, claimed by others purple, party cyan (k-party), companions/pets yellow (k-ally), dead/far grey. Target box name follows the same rules.
- Target box (engaged): only name, slim salmon HP bar and the Locked arrows (TP/swing/chain/info rows hidden).
- Tests: p47unit (Raise/Ember Plume exist, KO lasts an hour, stays down, revive keeps XP + Weakened, timeout sends home with XP loss); p29unit updated (KO'd hire can be raised; permadeath only after the hour).

## Phase 91: detailed textures (v13.8.0) — plan Q4
- (Removed in 16.19.0) REGION_PAINT painters now receive float 256-space pixel coords (X, Y) so detail sharpens on the 512 px High atlas (chain keeps integer coords). cloth: plain weave (2-unit cells, warp/weft sine threads, over/under checker), slub value noise, folds, hem, two dashed stitch rows, edge wear. leather: ridge grain + pebble pores, saddle stitch with holes (9-unit period) along both edges, creases, scratches, burnished edges. metal: fine brushing, scratch lines, dents, rust, engraved scroll band (ev 0.06–0.15, sine scroll), rivet row (18 per u). trim: diamonds + curl motif + diagonal thread stitch. fur: strands + clumps; hair: two-scale strands, root darkening, sheen; scale: 16×12 rows with rims and specks; feather: split barbs; wood: knots; bone: pores; skin/face: pores; chain: staggered rows with top highlight; quilt: dashed seams.
- Atlas build reuses a base painter's cell for variants (face2…face8 copy the face base before their paint layer), and several fbm calls became single value-noise lookups: build time (test machine, software GL) 530 ms Low / 2.0 s High (was ~0.5 / 2.2 s before this phase).

## Phase 92: faces and expression (v13.9.0) — plan Q5
- `FACE_PAINTS` 8 painted face cells, `FACE_COUNT` 16: faces 8–15 reuse paint `face % 8` with a bone-structure variant in headProfile (nose ×1.18, jaw −0.06, cheek +0.025, lips ×1.15, chin +0.03, brow +0.015). FACE_NAMES has 16 names.
- Painted-face heads (not noFace/skull) get bones `jaw` (child of head, behind the ear line) and `mouth` (on the mouth surface point at b = 0.437). The head is added with addW: vertices below the lips (b 0.44→0.58) and in front (|a| < 1.3→0.7) blend to `jaw`. A dark mouth-interior patch (gHeadPatch, a ±0.14, b ±0.05, +0.006) is bound to `mouth`. Both bones are rigid and skipped by bridgeGaps.
- anim.js (after the leg IK): mouth target = KO 0.35 / talking (e.talkUntil) syllable flaps / weapon skill shout 0.9 / laugh, cheer flaps / panic 0.8 / cry tremble / hit 0.5 / casting chant / attack grunt; eased (rate 18/s); `mouth.scale.y` = 0.04 + m, `jaw.rotation.x` = 0.16·m.
- talkUntil: hud4 openDialog sets it on the matching NPC (length-based, max 6 s); runCommand (say/shout/party/linkshell/tell) on the player; net chat on remote players.

## Phase 93: hair and cloth (v14.0.0) — plan Q6, plus requests
- Spring secondary motion (anim.js `sprAx(state, key, target, dt, k, c)`: spring–damper, semi-implicit, 12 ms substeps; `clothSprings(v, e, an, dt, t)` after the leg IK). Inputs: run/walk blend, forward acceleration (d spd/dt), signed yaw rate, gait bob, KO. Cape: 3 bones (`cape` on chest, `cape2`, `cape3`), plane 6×12 curved around the back with addW weights by height; lift 0.04 + 0.38·run + 0.14·walk + accel, lower sections add bob and flutter. hairTail: lift with run/accel/bob, sway with turn and stride. Tabards: front/back panels split at the waist onto `tabF`/`tabB` (children of hips); the front flap is pushed by forward thighs, the back by trailing thighs; trims ride the flaps. Old addP cape/hair lines removed.
- Hairstyles appended (indices stable): wavy (long + zigzag strands), pixie (short choppy locks), sidepart (swept fringe), dreads (16 locs, back ones on hairTail), curly (shell vol 0.2 + 60 curl balls). HAIR_BY_SEX extended; hairEdgeFn keys added.
- Hair under headgear: `gHairShell(..., thMin)` builds only the band below θ = 0.4π (vol 0.05) plus the edge locks when the head is covered; spiky/curly fall back to a short band. cap/helm/horned domes and rims are built with HEAD_SCALE and `warpToHead`, so they follow the narrower head; helms add a slim nasal and two cheek guards (front patches rotated ±1.25 rad).
- world3d `buildExits` returns immediately (no exit arches).
- Title/loading/character-select CSS (template4 tail): navy radial background, striped crest, outlined italic title, striped bars/tips/panels, orange Press Start, lavender buttons, orange primary buttons.
- Spawns: CONFIG.spawnGapCells 1.4 (was 3), spawnExitCells 1.2 (was 2); the spacing pass skips points inside walls or water; after spacing, critter options (no aggro, not NM) lose `time: "day"` so they appear day and night. Hollow 22 points (was 8). `conOf` softens starter levels: lv ≤ 3 counts one level lower and passive lv ≤ 4 one more (non-NM).
- Tests: p1unit (critters keep spawning at night), p24unit (spacing uses CONFIG).

## Phase 94: armour and weapons (v14.1.0) — plan Q7
- humanEntry keeps the body loft rings in `BODY` (up/tw torso, arm{L,R} {up, fa1, fa2, w}, leg{L,R} {rings, w}); `shellOf(rings, off)` grows each ring by off. Armour pieces are lofts over those rings with the same skin weights, so they follow the body: plate = torso rings 1–6 +0.016 with a centre ridge and two waist bands; pauldrons = arm cap rings 0–3 +0.02 (wider) + two lames; gauntlets = forearm rings +0.011 + gold cuff; greaves = leg rings between knee+0.065 and ankle+0.06 +0.014, knee cop and a gold band; boots = leg rings below bootTop +0.008 with a turned top ring. Fallbacks to the old pieces when rings are absent.
- weaponEntry: sword/dagger/gsword tiers by item level (1: bar guard; 2 (lv ≥ 8): short block + swept quillons + langet; 3 (lv ≥ 15): taller quillons, gems on both faces of the guard and the pommel). Other kinds: band at lv ≥ 8, gold band + gem at lv ≥ 15.
- Title: #ldTip hidden in the ready state, #ldVer pinned under #ldCred; #ldCred hidden on the roster screen. Test tools: studio race spec takes a 4th field of comma-separated item ids; studio/headshot use the scene environment map.

## Phase 95: NPCs, swing, look-at, damage numbers (v14.2.0) — plan Q8, plus requests
- `NPC_HELD` (rig.js) maps NPC id/model → prop kind; `heldProp(R, kind, sd, hx, wrY, gi)` builds it on the hand bone (ledger/book/scroll/basket in the left hand, the rest right). buildEntityRig: `held = L.held ?? NPC_HELD[id] ?? NPC_HELD[model]`. walkerLook: 14-colour palette, 6 top types, hats, cape/collar/gloves/girth odds, random held prop. Outpost has one ambient walker (the second was removed on request).
- Swing beat sheet (anim.js slash, ak 0..1 over 0.5 s, a = wind-up ease, b = strike ease): var0 overhead chop — handR x +0.5a (cock back) → −1.7b (snap, blade leads, ends forward-down); var1 side sweep — handR x +1.5a (blade lies flat, sweeps right→left); var2 stab — handR x −0.3a → +2.7b (blade points ahead along the arm). Smash/cleave overhead: handR x 0.6a − 1.3b. Weapon grip offset in placeWeapon (0.016, −0.074, 0.012). Verified with contact sheets (sheet tool: forces skinned meshes visible; studio meshes otherwise read visible=false so weapons vanished).
- Look-at: models3d `lookTargetOf(e)` sets `v.lookTgt` (player → its target ≤900; NPC → player when targeted/talking ≤700 or within 130; mob → its fight target ≤1200 or player when targeted ≤600; allies → attack target). anim `headLook(v, dt)` runs inside applyPose for kinds human/quad/hare/mandrake/bird: target head (or ground +1.0/1.3) in group-local space, yaw minus hips+spine+chest twist, clamp ±1.25 (ignored past 2.1), pitch −0.55..0.5, split 62% head / 38% neck, weight lookW eases at 4/s, angles at 7/s. The old NPC head-turn add was removed (chest twist kept). Never name a view field `look` (collides); it is `lookTgt`. Headless rAF barely ticks: probes must step syncEntity manually.
- Damage numbers: popText gains `dmg` flag (numeric applyDamage pops), colour DMG_RED #ff2a20 (#ff5a48 on party), size +6, life 1.25. updateFloaters: dmg pops from 1.25 m, scale 0.4→1.5→1 in 0.2 of life, rises, drifts sideways, last 38% fizzles (blur up to 2.6 px, letter-spacing, squash, flicker). `VIEW.settings.dmgNums` (Config → Interface) hides them.
- Torso: ring superellipse default p 2.1 (was 2.3); chest width capped by shoulders (`cx0 = min(gi,1.04)·W`, `cx1 = min(gi,1.1)·W·1.04`), waist 0.93/0.95, shoulder rings step down from shY−0.025 to neck so the trapezius slopes; arm caps start at shY+0.004. Neck taper 0.064/0.054 (male) or 0.056/0.046 (female) × girth, slight forward lean. Pipkin foot scale 0.8 (was 1.15). Skin/face albedo 0.8/0.82, face roughness 0.64.
- HUD: `#ui.hasTop #ffStat` top 54 px and `#stOv` 56 px so status icons clear the Commands bar.
- Audio: unlock on any pointer/key/touch calls startAudio, resumes the context and plays one silent buffer; main4 runs step/view/audio in separate try/catch; `audioNag()` toasts if the context isn't running 2.5 s after starting.

## Phase 96: beastmen and bosses (v14.3.0) — plan Q9
- `FAMILY_SHAPE` (rig.js) by fam.model → { family, hunch, prop }; `familyLook(L, m)` runs in buildEntityRig after varyMobLook and sets L.family / L.hunch / merged prop, L.boss for boss/nm/scale ≥ 1.3, L.banner from `BOSS_BANNER` (chieftain, orc_warlord, mirelord_gax, rimefang). tide_priest/drowned use ghoul extras.
- `familyExtras(R, L, D)` (called from humanEntry before R.meta): orc spikes on pauldrons (upArm bones), 9-tooth necklace + cord, bracers; goblin hip pouches, bone charm, knee pads (shin bones); reef dorsal fin and forearm fins via `finPlane` (gMembrane rotated into the YZ plane), gill slits on neck; talon 6 arm feathers per side, 5-feather tail fan, 3 toe claws; treant shoulder branches with leaf balls, forearm twigs, 4 roots per foot, moss pads, knot hole; ghoul/undead 7 rag strips at the hips, ghoul spine bumps; boss banner pole + waving flag on chest.
- Posture: R.meta.hunch → poseHuman adds spine 0.55h, chest 0.45h, neck −0.45h, head −0.4h, upper arms 0.3h, root −0.08h. Hunch: goblin 0.2, chieftain 0.14, orc 0.1, reef 0.24, talon 0.12, treant 0.07, ghoul 0.32, skeleton 0.04.

## Phase 97: critters (v14.4.0) — plan Q10
- Fur shells: `RIG.shellLayers` = 5 on High (set in buildAtlas, 0 otherwise; 0 while building LOD entries). RigBuilder.buildShells(minY) clones pieces whose region is in `SHELL_REGIONS` (fur 1, feather 0.6, hair 0.45), pushes vertices out along normals by len·f (len = 2.2% of model height clamped 0.006–0.03, droop 0.35·d down) and adds a `shell` attribute (layer fraction). instantiate adds a second SkinnedMesh bound to the same skeleton with `shellMaterial()` (shared, DoubleSide, onBeforeCompile hashes floor(vMapUv·1800) and discards below 0.08 + 0.86·shell; tips brighten). Hidden with the main mesh when LOD swaps (child of mesh).
- batEntry: 2 finger bones on the inner membrane, 3 on the outer, thumb claw, 3-toe feet, chest ruff. shroomEntry: 28 radial gills under the cap, stalk skirt. wormEntry: extra ring per segment and 6 bristles per segment. hareEntry: 3 whiskers a side. toadEntry: 4 padded toes per front foot.

## Phase 98: planted feet, quadruped gaits, spell learning (v14.5.0) — plan Q11, plus requests
- Beat sheet (turn in place): yaw change while idle is absorbed by the pelvis; at |debt| > 0.5 rad, or > 0.12 rad after 0.3 s quiet, a shuffle step runs for 0.22 + 0.18·|debt| s: lead leg (turn side) lifts in the first 60%, trail leg in the last 60% (thigh −0.32, shin +0.6, foot −0.25 at peak), root rises 1.2 cm, debt eases to 0 (smoothstep). New yaw during a step goes to tX and carries over.
- `turnInPlace(v, e, an, P, amp, dt)` (anim.js) tracks group yaw (an.tYaw/tD/tStep/tX/tQuiet), resets while moving (amp > 0.08), dead, mounted, resting or on a > 1.2 rad snap. It sets `v.tipYaw`; `applyPose` removes last frame's offset before smoothing and adds hips.y −= tip, spine.y += tip after it (unsmoothed, so planted feet don't lag). Metric (sway ±0.25 rad): feet world drift ≈ 1 cm.
- Quadrupeds: `QUAD_GAITS` walk (duty 0.66, BL 0 FL 0.25 FR 0.75 BR 0.5), sprawl (0.8; 0/0.45/0.95/0.5), trot (0.45, diagonal pairs), gallop (0.35; 0.13/0.37/0.63/0.87). `quadGait` picks by Froude v²/(gL) (walk < 0.45 < trot < 2.4 < gallop; sprawlers = scale-region quads: sprawl < 2.2 < trot), blends duty/offsets over 0.3 s, returns bob/pitch/roll. `quadLegIK` (after applyPose, weight qikW fades out on death, qikF drops for front legs while readying) places each foot at z = D/2 → −D/2 in stance and a smoothstep arc in swing, depth = 0.9·(Lt + Ls), two-bone sagittal IK; front joint protrudes forward (carpus), hind backward (hock). Body lowered 9.8% of leg length. `strideEff` for quads = leg·0.7·scale/duty so stance reach fits. quadEntry meta.quad gained leg, bodyY, sprawl.
- Metrics (side probe, flat ground): stance slide median — sheep 0.047/0.053 m/s (walk/trot), dog 0.030/0.036, longneck 0.075/0.095, lizard sprawl 0.09; measured duty within 0.03 of target. Gallop still slides ~0.3 m/s (body pitch) — acceptable at that speed.
- Spells: `spellLearnable(sp, ch)` = main job at level or support job at floor(lv/2), same rule as `knows`. Scroll items hide "Add to action bar". Test p48unit.

## Phase 99: interface sounds (v14.6.0) — plan T1
- `UI_SYNTH` (audio.js): per sound a list of partials [type, f0, f1, startAt, dur, gain, lowpass?]; types sine/square/triangle (exponential pitch glide f0→f1), noise (shared 0.3 s white buffer through a Q 1.2 bandpass at f0), bell (sine carrier + 3.5× modulator, index decays from 0.9·f0 → 1 over dur). Envelope: 6 ms attack, exponential decay to 0.0008. `uiSynth(name, vol)` builds the graph into AUDIO.bus.ui and disconnects after it ends.
- `sfx()` prefers UI_SYNTH over clips for the same name (replaces clips for select, tab, click, close, open, error, notify, coin, equip, quest, unlock, toast, xp); new names cursor, tell, pchat, target, page, buy. Cursor throttle 35 ms. UI_SOUNDS includes the new names (ui bus).
- Hooks: arrow keys in dialogs, target command menu, main command menu and modal lists → cursor; `uiHoverSounds()` (hud4, started after initAudio) plays cursor on mouse pointerover of buttons/items/data-a/data-mc/data-tc/data-o (mouse only, once per element); setTarget (changed, not quiet) → target; netOnTell → tell; netOnPChat → pchat; buy() → buy.

## Phase 100: more sound effects (v14.7.0) — plan T2
- `WORLD_SYNTH` (audio.js) uses the UI synth engine on the sfx bus with pan; new partial type `sweep` (looped noise through a Q 2.2 bandpass gliding f0→f1). `uiSynth(name, vol, {mul, len, pan})` scales pitch by mul and timing by len. `sfx(name, e, o)`: o.vol/mul/len; steps and swings get ±8% random pitch.
- Footsteps: `surfaceAt(e)` → wood (house), stone (town/cave/crypt), snow (snow palette, frost zone, snow/blizzard weather), sand (desert palette, desert/cinder zones), grass. fxFootstep plays step_<surface> for the player and for others within 260 (mobs 0.7 × scale up to 1.6, others 0.45).
- `swingSound(a)` in swing(): humanoid mob families → swing_light (orc/treant/scale ≥ 1.3 → heavy), other mobs → swing_claw; players by weapon (greataxe, scythe, gkatana, gsword, club, staff, polearm, axe → heavy).
- `MOB_VOICE` by fam.model → v_* sound; `mobVoice(m, mode)` aggro (1×), hurt (22% of hits, pitch 1.12, len 0.6, vol 0.6), die (pitch 0.72, len 1.6); pitch / sqrt(scale × 1.1 for NMs).
- chest (openChest), craft (synth start), cast_line (startFishing), splash (bite). AMBX crowd layer (bandpass 480–600 Hz, 0.07 day / 0.025 night in towns), cave/crypt drips every 1.2–4.7 s.
- 2D rules build stubs: mobVoice, surfaceAt in hud.js.

## Phase 101: painted item icons (v14.8.0) — plan T3
- src/icons.js (build 4, after hud4): `buildItemIcons()` runs once at boot (main4, after uiHoverSounds) and paints every ITEMS entry into a 48 px cell of a 24-column canvas atlas; ICONS.map[id] = [col, row, painted]. A <style> rule `.iico` uses the atlas as a data URL with background-size cols×1.45em, so icons scale with the surrounding font. Each ITEMS[id].icon becomes `<i class="iico" style="background-position:…em">` (original emoji kept in it.emoji); every icon consumer already writes innerHTML.
- Painters: icoWeapon (by wtype, rotated 45°, metal palette from icoMetal: name keywords then level tiers bronze < 8 < iron < 15 < steel < 25 < gold; lv ≥ 8 gold guard, lv ≥ 15 or rare gem), icoArmour (by slot; cloth/leather/metal fabric from name keywords and colour words), icoConsumable (scrolls with element ribbon, crystals/essences by element, potion/ether/tonic flasks, keys), icoMaterial (ore, ingot, log, herb, cloth, fish/eel, bone/tooth/dust, feather, shell/scale, hide/pouch). Anything else draws its emoji on the tile. icoFrame adds rarity corners (itemRarity).

## Phase 102: terrain and cliffs (v14.9.0) — plan E1
Style branch: retro MMO (painted albedo, vertex-colour layers, strong fog colour). References used from memory: early-2000s MMO valleys with banded cliff faces and cart tracks.
- Strata (terrainDetail shader): yb = y·0.62 + rockDetail(xz·0.035)·1.1 + sin(0.045x + 0.03z)·0.35; per-layer hash tint between warm (1.1, 1.02, 0.9) and cool (0.88, 0.92, 1.0) ×0.9–1.1; ledge darkening 0.78→1 over the bottom 18% of each band, 7% highlight at the top; weight smoothstep(0.35, 0.65, slope), damped in caves.
- `buildCliffs(field, root)`: jittered grid (36 px, caves 30) over the whole field incl. margin; keeps cells with height gradient > 0.55 or outside weight > 0.35, off paths/exits; 55%/80% acceptance; oriented halfway between the slope normal and up, random yaw, sunk 0.2·s; scale 0.9–2.3 (×1.6 outside the play area). Geometry `cliffChunkGeo(seed)`: 3–5 stacked noisy boxes (strata slabs) with per-slab vertex shade, lighter lips and darker undersides. Three variants, instanced, tinted ±11%, cast shadows. Caps: low 180, medium 320, high 520 per variant.
- Ruts: field.rutWeight(px, py) → [rut, centre]; ruts at ±0.17·path width (band 0.035–0.075 w, wobbled by noise), centre strip within 0.05–0.1 w. Albedo bake darkens ruts 32% and blends the centre 40% back to grass (field theme only).
- `buildPathEdges`: small noisy stones every 22–52 px at 0.42–0.54·w from the centre line (field theme), no shadows.

## Phase 103: foliage and props (v14.10.0) — plan E2
- `buildProps(field, root)` (world3d.js, field/town themes) after buildPathEdges. Quality multiplier K = low 0.4, medium 1, high 1.6. Rules: ferns (not desert/volcanic/snow) where noise(0.004) > 0.45, 220·K (jungle 420, ×1.7 size); reeds on every water ring (min(160, r·0.9)·K, ×1.6 marsh) plus marsh patches where noise(0.006) > 0.55; mushroom clusters 70·K (instance colours red/cream/brown/ochre); stumps 14·K (30 in desert/volcanic/snow, tinted per palette); desert skulls+bones 18·K; up to 2 carts beside a random path (50% tipped and sunk) with a 24 px collider; 2–3 fence runs of 5–10 49 px segments wandering near z.start.
- Geometry builders: fernGeo (7 tapered curled fronds, normals up), reedGeo (9 stems + cattail heads), shroomClusterGeo (4 caps), fenceGeo (2 posts + 2 rails), cartGeo (bed, sides, shafts, 2 spoked wheels), stumpGeo (stump + 2 roots), skullGeo. Plants share the leaf atlas and addWind (fern 0.06, reed 0.09).

## Phase 104: light and atmosphere (v14.11.0) — plan E3
- `initAtmosFx()` (world3d.js, lazily from updateAtmosFx): 9 additive DoubleSide planes with a soft vertical beam texture (shaftTex, 64×256), each with random offset in a 44 m cell grid around the camera, width 1.4–4 m, length 14–24 m; plus 260 additive Points motes (texGlow, size 0.07) recycled in a 30×30×6 m box around the camera.
- `updateAtmosFx(dir, dayAmt, gloom, cave, indoor, golden, fogC)` called from updateSky. Shaft strength: forest-type field zones dayAmt·(0.7 + 0.9·golden)·(1 − gloom) when the sun is up; caves 0.55 with a fixed sky-crack direction (0.25, 1, 0.15); none indoors; ×0.6 on Low. Each beam is snapped to its cell, aligned to the light direction, yawed to face the camera, faded 4–10 m in and 22–34 m out, opacity (0.15 ± 0.05)·strength. Mote opacity: indoor 0.35, cave 0.7, forest 0.25 + 0.5·golden, open 0.12, × (1 − gloom) × max(dayAmt, 0.4); colour = sun colour (cave blue-white) blended 20% to fog.
- Cave crystals: first 2/4/6 clusters (low/medium/high) get a PointLight (cluster colour, 7, range 16, decay 1.6) flagged crystal; pulse 6 ± 1.5 at 1.3 rad/s in the torch loop.
- Terrain bake: wet band where shoreWeight 0.55–0.95 darkens up to 32% (blue kept more).

## Phase 105: dungeons (v14.12.0) — plan E4
- `wallEdges(z)` walks every wall rect edge in 40 px steps and keeps runs whose outward side (8 px out) is open floor (not in another wall or outside the zone); returns {ax, ay, bx, by, nx, ny}.
- `buildDungeon(field, root)` after buildCrypt for crypt and cave themes. Crypt: each run becomes a 6.2 m brick box (0.7 m thick, set 6 px into the wall) merged into one mesh with world-scaled UVs (`boxUV`, 2.2 m per texture repeat) and per-wall vertex shade; pilasters every 110 px (instanced, UV v ×3, caps top and bottom); sconces at odd pilasters with a PointLight on ~70% (cap low 4, medium 8, high 12, joining W3.torchLights flicker); cobweb quads (webTex) on half the runs; 3 sarcophagi in vault/throne/sentinel landmarks (1 elsewhere, 26 px colliders); 40 bones/urns 12–60 px from walls. Cave: timber frames on 55% of runs every 160–280 px; crates/barrels in 1–3s around 55% of torches.
- Terrain bake (crypt, inside the walls): running-bond flagstones 46 px with noise-jittered rows, mortar lines < 3.5% of a stone darkened 40%, per-stone value 0.6–0.85.

## Phase 106: city districts (v15.0.0) — plan C1
- Data: a town zone may carry `city`, `districts` [{id,name,x,y,w,h,color,icon}], `cityWalls` (axis-aligned segments) and `gates` [{x,y,a,b,horiz}]. Districts stay inside one zone so NPC ids, quests, tests, weather, fishing and conquest keyed by zone id keep working; no extra loading screens.
- Outpost is 2000×1500: Residential x<560, Eastgate x>1440, Government y<470, Market 470–1060 (plaza + crystal at 1000,760), Industrial y>1060. Eight gate halls (gap ±GATE_HALF=55 px). Hollow ↔ Outpost exit is at the Eastgate edge; residence door is on the Residential house at (200,760).
- Collision: `cityWallRects(z)` cuts each wall at its gates (30 px thick) and adds 44 px tower squares beside every gap; appended to `zoneRects` (cached `_cwr`).
- Routing: `moveToward` calls `gateHop` first. If the straight line hits a wall rect, pick the gate whose line separates the mover and target (min path length), go to an approach point 45 px before the gap, then through to 75 px past it. Gates already crossed (same side, >40 px away) are skipped, so chains of gates work. The old body is `stepToward`. Followers, NPCs, click-to-move and chasing all use it.
- `separate(aOnly)` also slides the mover sideways (0.7 × push) while it's walking, so a straight route through the crystal doesn't stall.
- District tracking: `checkDistrict` (0.5 s tick) sets `S.district`; changes log, call `uiEvent("district")` (title card with the city as subtitle, first-visit toast, page sound) and record `save.districts["zone:id"]`. The zone-entry title shows the current district as its subtitle.
- Save: `zv` 2. Older saves standing in the outpost are moved to `start` (the old coordinates now land in walls or houses).
- 3D `buildCityWalls`: wall pieces ≈140 px long (each sits on its own lowest ground point), 4.4 m tall with brick world-UVs (`uvBox`), a cap and instanced merlons on both edges; per gate two 8.2 m towers with pyramid shingle roofs, a lintel, a stone half-torus arch and district-coloured banners with a gold trim on each face. `placeable` keeps scatter off walls and gates.
- Map: districts get a 15% tint, walls and towers are drawn, and visited districts are labelled in their colour.

## Phase 107: Outpost city (v15.1.0) — plan C2
- Houses with a `type` (home, shop, hall, barracks, guard, cityhall, auction, forge, mill, warehouse) skip the old house loops and are built by `buildCityBuildings`. Optional per house: `floors`, `sign` (canvas text via `texSign`), `signCol`, `awning` colour, `flag` colour, `tint` (plaster colour 0–3), `roof` (0–3).
- Draw-call budget: everything static goes through `cityBatch()` — geometry is made non-indexed, stripped to position/normal/uv, transformed by local × building matrix and merged per material at the end (about 20 meshes for the whole city). Only signs, awnings, flags, sails, clock faces/hands, glows and the forge light stay separate.
- Building recipe: stone plinth, `floors` × 3 m storeys (timber types jetty 0.22 m per storey and get corner posts, floor beams and braces), front and back windows every 2.3 m (skipping the door bay on the ground floor), side windows when deep, gable roof (`roofGeo`) with matching gable wall shapes, dormer, chimney, framed door with step and lantern.
- Type extras: awning + bracket sign (shop), portico columns and pediment (auction), chimney with ember cap + hearth glow + flickering point light in `W3.torchLights` (forge), four-blade sails in `W3.spinners` (mill), crane and crates (warehouse), clock tower with two faces whose hands follow `vana()` in `updateCityAnim` (cityhall), waving flag (barracks, guard, cityhall).
- Zone extras: `plazas` (extra paved circles, used by terrain and map), `fountains` (basin, column, bowl, gilded finial, water disc, spray cone, collider r 48), `gardens` (soil bed, rows of plants, picket fence with a front gap), `dummies`, `racks`, `benches` (all colliders), `paved` (town paths drawn as cobbles), `outerWall` (perimeter wall 5.2 m with merlons, corner towers, a gatehouse at every non-door exit with the city name sign; replaces the palisade).
- Outpost data: City Hall at the north end of the Government square; Maera's Guild is house 18 (her home index moved). Industrial gained Woodworkers (19) and Alchemists (20) halls; Garrick and the anvil sit north of the street.

## Phase 108: Harbor and Ironvale (v15.2.0) — plan C3
- Saltreach (`cityStyle: "harbor"`, `outerWall: "new"` walls the north, east and west only; the south is the sea) and Ironvale (`"mountain"`) reuse the district, gate, wall and building systems from phases 106-107 with CITY_STYLES palettes, lighthouses, slipways and mines. `zv` 3 resets saved positions in old Harbor/Ironvale layouts.
- Hireling bodies: when a hireling is KO'd `save.mercBodies[id] = {zone,x,y,until}` is written next to `mercDown`. `rebuildParty` skips hired ids whose body is in another zone and places the body (alive false, koUntil) when its zone is entered; `enterZone` calls `rebuildParty` after changing `S.zoneId` and never teleports a fallen hireling to the player. `returnHome` no longer heals fallen hirelings. `koTick` expires bodies in other zones (dismiss, or permanent fall when `CONFIG.mercPermadeath`). `revive` and `dismissMerc` clear the body.
- Revive items: `ITEMS.phoenix_down` (revive 0.5) beside `ember_plume`. `useItem` allows `it.revive` items while KO'd and then targets the player with no range check.
- UI fixes: label occlusion test (`occluders`, `labelHidden`), tagged auto-closing exit prompt, `#dialog` width max-content, loading screen hides version/tip/credit until ready, showcase on mobile, hidden roster scrollbar and compact mobile creator CSS.
- Test: test/p50unit.js (bodies stay put, Phoenix Down on hireling and self).

## Phase 109: Warp stones (v15.3.0) — plan C4
- `WARP_STONES` in data.js maps zone → district → [x, y]; positions were picked by a scan for the free point nearest each district centre (clear of `zoneRects` by 70 and of NPCs by 90). Each becomes `NPCS["warpstone_<zone>_<district>"]` (model crystal, `warpstone: true`, `talk: "talkWarpStone"`, `warpZone`, `warpDistrict`) and is pushed to the zone npcs.
- `save.warps[id] = true` on first touch. `openWarpStone` lists attuned stones: same zone free, other zone `CONFIG.warpCost`. `warpToStone` teleports locally inside the zone (party repositioned, `checkDistrict`) or calls `enterZone` for another city. Blocked while engaged. `/warp` finds a stone within 160 px. Map dot colour #ff9ff3.
- Test: test/p51unit.js.

## Phase 110: City life (v15.4.0) — plan C5
- `cityLife(z, id)` runs in `enterZone` for zones with districts. `CITY_LIFE[districtId] = [crowd, guards]` in data.js. For each district it samples waypoints around the district's warp stone (+90 px) that are inside the district inset by 70 and 36 px clear of `zoneRects`, sorted by angle into a loop, and spawns ambient walkers: `crowd` day walkers, `ceil(crowd/3)` night walkers (`time` night, slower) and `guards` patrols (`look` guard / guard_f from `NPC_LOOK`, `guard: true`). Ambient entries now carry `time` and `look`; rig.js picks the NPC look when `look` is set.
- District signposts: `dsign_<zone>_<district>` NPCs beside each warp stone (+60, +6), `talkDistrictSign` lists other districts with compass direction and distance.
- Audio: in `ambxTick` the crowd layer is multiplied by a per-district factor and the surf layer by 1.4 on the Docks, 1 Fish Market, 0.6 Harbor Square, 0.35 elsewhere.
- Quests: `tour_outpost`, `tour_harbor`, `tour_ironvale` use `check` with `QUEST_CHECKS` and `tourDone(zid)` against `save.districts`.
- Test: test/p52unit.js.

## Phase 110.1: Anime faces (v15.5.0) — Track 0
- `paintFace(g, ox, oy, v, fem)` replaced. The head UV is not isotropic: 1 px across ≈ 1/43 rad × 0.87 hr, 1 px down ≈ 1/86.7 rad × 1.04 hr, so the paint is drawn in a local space `translate(64,120) scale(1,1.7)` where units are square on the model. Eye centres at ±15.5, mouth at y 26 (canvas ≈ +44, matching the mouth bone at b 0.437), nose tick at y 13–15.6, brows at −(up + 5.5).
- `EYE[v] = [rx, up, dn, tilt, lidDrop, irisScale]`, `BROW[v]`, `IRIS[v]`, mouth width and smile per face. Face order: Bright, Calm, Keen, Freckled, Gentle, Fierce, Sleepy, Proud (`FACE_NAMES`, `FACE_COUNT` 8). Female paint: eyes ×1.05/×1.08, lash width 2.6 plus three flick lashes, lip tint, blush 0.32 (male 0.12).
- Atlas: `ATLAS_COLS` 8 (2048 × 1024 at 256 cells), regions face … face16. Face cell = face % 8 + (build 1 ? 8 : 0).
- `headProfile` for human/elari/pipkin/ursan/nekari: nose × 0.3, sock × 0.2, brow × 0.3, lips × 0.25, cheek × 0.4 (cheek bulges made dark creases on Pipkin). The old "face ≥ 8 changes bone structure" rule is gone; `normalizeSave` maps look.face ≥ 8 to face % 8.
- `FACE_PX.eyeA` 15.5 px. Lids (`gLid`) cover a ±0.31 × (−0.26…+0.17) rad patch; rest rotation −0.7 (anim.js) so the raised lid clears the brows.
- Hair: fringe styles (bob, long, twintails, wavy) front edge −0.5 / −0.42 and front locks 0.13 long so they stop at the brows.
- Test tool: test/faceshot.js (own WebGL renderer with ACES so render targets are tone mapped like the game; poses front, q, lid0, lidh).

## Phase 112: Rocky Hollow and Windreach in three zones (v16.1.0) — Track 5

- Calls: the split block (helpers + splitZone/migrateSplits) now sits in data.js right after spreadSpawns, before exit halls, camps, POIs and signposts, so those generate per part. Order: extra Highland spawns pushed, splitZone("hollow"), splitZone("highlands"), then computeBand for unfixed zones.
- Hollow (4800x3300, cut at x 1650 and 3300): hollow = West Meadows (band 1–3, keeps Outpost exit), hollow_lake = Mirror Lake (3–5, Marsh south exit, Highlands north exit), hollow_ruins = Eastern Ruins (5–7, Den exit). Highlands (4000x3000, cut at y 2000 and 1000): highlands = Windreach Foothills (arrival from the Hollow), highlands_plateau (nomad camp, Tarqa, Essa), highlands_ridge = Eagle Ridge (Rider's Rest). Added 4 spawns to the Foothills and 5 to the Ridge so each has 5+.
- splitZone changes: other zones' exits that pointed at src are re-pointed using the src zone's own exit back to them (their tx/ty were still unscaled); spawns are clamped 80 px inside the part.
- Weather: weatherNow uses the area id for table and seed, so all parts share weather. Fishing, lore, backdrop, atmosphere use zkey.
- Hollow Run: RACE.zones lists the three parts; RACE.start and every checkpoint carry zone plus part-local x,y (splitLocal). tickRace only counts a checkpoint in its zone; crossing between parts keeps the run; leaving the Hollow ends it. The HUD tracker shows "in <zone>" for a checkpoint elsewhere, and the minimap dot and beacon only show in the checkpoint's zone.
- POI_PLAN: shrine in West Meadows, lookout in Mirror Lake, tablet and cache in Eastern Ruins (ids keep the old "_hollow" suffix so saves keep them); each part has its own camp crystal (campcrystal_hollow, _hollow_lake, _hollow_ruins). The lookout reveals only its own zone's landmarks. Highlands has no camps or POIs yet (phase 115).
- Creator: the face and hair steps skip the zoom camera on touch devices. 16.1.0 tested width only (innerWidth > 700), which missed sideways phones; 16.1.1 uses ccTouch() in main4.js (width 720 or less, coarse pointer, or any touch points).
- Tests: p54unit now checks the real split (bands, spawns, paired edges, exits, signposts, POIs, weather, race, migration of Hollow and Highlands positions, edge crossing). Older tests that assumed one Hollow zone were pointed at the right part (p5, p6, p6b, p8, p11, p14, p20, p24, p42).

## Phase 111: Region framework (v16.0.0) — Track 5

Terms: region = conquest region (CONQUEST.regions, e.g. The Vale). Area = one wild place on the atlas (Rocky Hollow). Zone = one loaded map. An area may hold several zones.

- data.js tail: AREA_NAMES, ZONE_SPLITS, areaOf(zid) (zone.area or its own id), areaZones, areaName, inArea(ref, zid), areaVisited(save, area), zkey(table, zid) (zone entry, else area entry), computeBand/zoneBand/areaBand/bandText. Bands come from spawn levels (weather-only spawns excluded) unless a split part sets band (bandFixed). Red Spire floors carry area "spire"; ATLAS_POS key is now "spire".
- splitZone(src, parts): parts = [{ id, name, rect: [x0,y0,x1,y1], band?, start? }] in final (post-ZONE_SCALE) coordinates; rects snap to 50 px so explored fog slices exactly. Keep src as the id of the part that holds the old main entrance so outside references keep working. It copies theme/palette/mist/openRange/cs/vegK, partitions spawns, npcs, landmarks, water, walls, props, ambient, torches, pillars, ruins, paths (any point inside), features, gather nodes (n scaled), exits; adds paired edge exits (160 long, placed where a road crosses the shared edge, else mid-edge, flagged edge: true); re-points every other zone's exits by target point; records ZONE_SPLITS[src] and AREA_NAMES[src] (old name).
- migrateSplits(save) runs in normalizeSave with save.zsplit marking done splits (newSave marks all). Moves loc by rect, home/attuned by crystal npc id, landmark keys by landmark id, adds discovered parts, slices explored strings per part.
- Re-pointed: regionOf uses area fallback; story and expedition visit/zone steps use inArea; achievements use areaVisited; FISH, POI_LORE, BACKDROP, ATMOS use zkey; footstep/wind audio use areaOf; atlasNode = areaOf, atlas explored = mean over the area's zones, atlas label shows band and % mapped.
- UI: zoneSubtitle(zid) = area (if differs) · region · band; used by the zone banner (hud4), the Map window line and the entry log.
- Test: test/p54unit.js splits Rocky Hollow into three parts at runtime and checks spawns, landmarks, paired edges, re-pointed exits (Den → east part, Marsh/Highlands → middle), migration (position, landmarks, fog, discovered, run-once), entering each part and walking across an edge.
- Notes for 112+: call splitZone at the very end of data.js after all late pushes (frost/marsh weather spawns, camps, signposts, POIs). Signposts are generated per exit before the split, so edge exits need signposts generated after splitting. RACE (Hollow Run course) is tied to zone "hollow"; check its course stays inside the kept part or move it. ZONE_FEATURES/ravines that cross a cut are copied to both parts. p18unit and p21unit are occasionally flaky (time of day); rerun before suspecting a regression.

## Phase 110.4: Creator preview fix (v15.7.1) — Track 0

- rig.js human meta now carries headC (head centre height) and headR. menu4.js renderPreview focus camera aims at headC minus a quarter head radius and stands 7.8 head radii away, so the face stays centred for every race and size (before, it scaled with headTop, which pointed ears and hair inflate).
- While UI.creating the preview never auto-turns or snaps back to front; it starts facing forward (rot 0) and only moves when dragged.

## Phase 110.3: Creation polish and skin removal (v15.7.0) — Track 0

- Skin tones removed: classic MMO had no skin choice. save.look.skin is no longer written (normalizeSave deletes it from old saves). rig.js RACE_SKIN maps race to a SKIN_TONES index (human 1, elari 0, pipkin 0, ursan 2, nekari 1) and baseFromLook uses it. CC_FACE_SKIN is gone; ccFaceThumb(v, fem, race) uses the race tone, and thumbnails are cached per race.
- Name and job step now shows a .ccSum summary (race, gender, face, hair, size) and a Start over button (data-restart) that resets the look, step and name. The preview keeps turning on that step because focus is 0.
- Status screen (statusLeftHTML) shows race, gender symbol and size under the name.
- Click sounds already existed on every creator button.
- Test: test/p53unit.js creates all 1536 race/gender/face/hair/size combinations and checks they save and load intact with no skin field.

## Phase 110.2: Creation flow (v15.6.0) — Track 0
- `showCharCreate` (main4.js) is a stepper: `CC_STEPS` race, gender, face, hair, size, name; `ccSteps(look)` drops gender when `RACES[race].sex` is set. `CC.step` indexes the filtered list. `paint()` rebuilds `#ccSteps`, `#ccStepT`, `#ccBody`; the name input is wired only when the name step renders. The Next button carries `data-create` on the last step (tests click `[data-next]` until `#ccName` exists, then `[data-create]`).
- Face drives hairstyle and skin like classic MMO face types: `CC_FACE_HAIR[sex][face]`, `CC_FACE_SKIN[sex][face]`, applied by `ccApplyFace` whenever race, gender or face changes. Saved looks still store hairStyle and skin, so old characters and the renderer are unchanged.
- Size: `CC_SIZES` Small (height 0, girth 1), Medium (2, 2), Large (4, 3). Cosmetic only, as in classic MMO (the plan line about a stat effect was wrong: classic MMO sizes don't change stats).
- Face thumbnails: `ccFaceThumb` paints the face into a skin-filled canvas with `paintFace` and crops x 26–102, y 66–174 (cell units) to 72 × 60, which also undoes the 1.7 vertical paint stretch. Cached per face/sex/cell size in `CC.thumbs`.
- Preview (`renderPreview`): `pv.focus` 1 on face and hair steps; `pv.fz` eases the camera from full body to head (y 0.62→0.95 of head-top, z 2.15→0.53, look-at 0.5→0.92) and eases `pv.rot` to the nearest front-facing turn instead of spinning.
- CSS: `.ccSteps`, `.ccStepT`, `.ccGrid` (`.ccRaces`, `.ccTwo`, `.ccSizes`, `.ccFaces` 4 columns, `.ccHair` 8 or 4 on phones), `.ccCard2`, `.ccFaceB`, `.ccSw`, `.ccInfo2`; selected state forced with `#charSel … .on` because the FF theme overrides button colours with !important.
- Screenshot tool: /tmp ccshot.js (offline play, walks every step at 1100 × 720 and 412 × 780; no page scroll on either).

## Track 6: Classic look (v16.2.0–16.10.0)
Full notes and the remaining plan are in design/mmo-look-plan.md. Summary:
- 116 (16.2.0): Classic look is the default. classicCharMaterial (Lambert with light bands, a lift floor and metal shine), an outline pass (back-face skinned shell child of each rig mesh), and the Look and Outlines settings in Config → Graphics. Offline character creation fixed.
- 117 (16.3.0): CLASSIC_PAINT hand-painted region painters, 256 px atlas cells, nearest magnification.
- 118 (16.4.0): RIG.segK 0.55/0.45/0.38 (High/Medium/Low) in Classic, mitten hands, bigger hands and feet, cuffs, collars, boot flares.
- 124 (16.10.0): district-coded mixed-race walkers (DISTRICT_DRESS, walkerCoded), lantern night walkers.
- 123 (16.9.0): monster level-band tints (boldTint/mobBand), chunky quads, NM decor via RIG.hook + nmDecor/NM_DECOR.
- 122 (16.8.0): chunky weapons (gT/gR/fat in weaponEntry), weapon outlines, extruded shields with crest cross, kite shape.
- 121 (16.7.0): Job style: JOB_STYLE per job × 4 tiers (levels 1/5/10/16) replaces armour visuals in Classic; attire setting; 9 new head types, head decor options, oversized pauldrons. Details in design/mmo-look-plan.md.
- 120 (16.6.0): Classic face finish: hard-edged face tones, 4-band iris, bolder lid ink, inner-ear shapes, no banding on skin.
- 119 (16.5.0): gHairClumps thick hair clumps, fuller shell, smooth shading on skin and faces (mr red channel).

## Companion retreat, rest and healing priority (v16.21.0)

- Scope: only hired mercenaries (`a.mercId`); pets, beasts and automatons never retreat. Config keys: `allyKiteHp` 0.5, `allyKiteExit` 0.7, `allyRestHp` 0.25, `allyKiteDist` 200, `allyRestDist` 300 (was 420), `allySitHp` 0.75, `allyMpReserve` 0.04.
- Modes (`allyMode(a, threatened)` sets `a.retreat`): "kite" from HP at or below 50% until above 70%; "rest" from HP under 25% (only if a threat exists or the player is within 450 px) until HP and MP are full. Rest is also dropped when no threat exists and the player is over 600 px away. `a.kiting` = kite mode and stance not hold.
- `updateAlly`: threats come from `allyThreats()` (living combat mobs with a party member in enmity). Rest mode calls `restAI` and returns. Kite mode flees (`fleeFrom`) whenever the nearest threat is closer than `allyKiteDist - 15`, clearing engaged/attackTarget/target; otherwise the role AI runs with `a.kiting` set. `raiseAI(a, dt, still)` will not walk toward a body while kiting. A companion that rested by itself stands up when its mode ends (unless the player is resting). Hold stance never flees; position is restored at the end, and rest happens in place.
- `fleeFrom(a, list, dt, mul)`: sums unit vectors away from threats within 700 px weighted 300/d, adds a pull toward the player when over 520 px away, moves at `a.speed * mul`. Wall check every 0.6 s: if progress is under 35% of expected, `fleeTurn` (plus or minus 1.2 rad) applies for 1.5 s.
- `restAI`: deletes the companion from `m.enmity` of mobs that are not targeting it, or are over `allyRestDist` away, so `canRest` (which fails while `inCombatWith`) can pass; keeps fleeing while chased or a threat is within `allyKiteDist`; then `startRest`. `regen` already stands a unit up if it can't rest.
- Kiting behaviour per role: `meleeAI` skips approach and autoAttack for non-archers (archers keep bow range and shoot) and skips provoke, flash, sentinel and shield bash; `hybridMagic` and `smartAct` nuke above 10% MP with 3 to 6 s gaps; `meleeIfSafe` is false; `follow` does not step toward a formation point within `allyKiteDist` of a threat; `keepCasterRange` approaches only beyond `castRange - 5`.
- Ranged roles (`nukerAI`): nuke reserve is `allyMpReserve` (0.2 for a burster while a chain is open), `nextNuke` gap 1.2 to 2.4 s, stop nuking only under 10% target HP, debuffs above 15% MP, melee only at 10% MP or less when not kiting, otherwise `keepCasterRange` (approach beyond 200 to 170, back off under 110).
- `healerAI`: `needy` = living party members under healAt (healer 0.75; support 0.5, or under 0.35 when another healer exists) sorted by HP% ascending. Heals the lowest one within `castRange - 30`; if none is in range it walks toward the lowest unless kiting. Spell choice from every heal-kind spell sorted by power: the smallest whose `healEstimate` covers the missing HP, else the largest; Divine Seal under 35%.
- `enterZone` clears `retreat` and `kiting` on the party.
- Check by hand: a mercenary at about 45% HP backs off to about 200 px and still casts or shoots; under 25% it runs, mobs lose it beyond 420 px, it sits (`resting`) and stands at full HP and MP.
- v16.23.0: new mode "sit" in `allyMode(a, threatened, still)`: no threat, player still (not moving, not engaged, 1 s), HP at or below `allySitHp` 0.75 and player within 450 px; ends at full HP and MP, when a threat appears, the player moves, or the player is over 600 px away. Handled by `restAI` like rest. `restAI` now drops a companion from a mob's enmity at once when another living party member also holds enmity (so resting works mid-fight); otherwise it flees until the mob is over `allyRestDist` (now 300) away.
- v16.24.0: `canRest` no longer checks `inCombatWith`, so anyone can sit mid-fight; `toggleRest` disengages the player instead of refusing. `regen` heals a resting unit even with enmity (`p.resting || !inCombatWith(p)`). `applyDamage` stands a resting target up when a mob deals damage (`standUp`, quiet for companions). `restAI` flees first and only then sits.
- Admin panel (v16.22.0): `adminLiveHtml()` in menu4.js renders a This session block (ping, last save, unsaved count, sent/received, players online, players in zone, monster host from `NET_SH`, zone, version) and the world-presence player list (`NET_RT.online`) at the top of `tabAdmin`. It uses client state only, so it needs no server setup change. `adminReport()` also carries ping and the online list.

## Roadmap (planned phases)
Graphics goal: early-2000s classic MMO look (painted textures, warm fog, big skies, readable silhouettes) within browser/phone budgets. Every graphics phase keeps a low/normal/high quality tier and checks fps on the low tier.
- 45 (9.5.0) Mercenary guild: DONE.
- 46 (9.6.0) Remaining classic windows + Help rewrite: DONE.
- 47 (9.7.0) Offline play: DONE.
- 48 (9.8.0) G1 Sky and light: DONE.
- 49 (9.9.0) G2 Terrain: DONE (detail splat; cliff meshes left to G3/G12).
- 50 (9.10.0) G3 Plants and props: DONE.
- 51 (9.11.0) G4 Water: DONE (streams left out).
- 52 (9.12.0) G5 Towns and buildings: DONE (banners and residence interior detail deferred).
- 53 (9.13.0) G6 Characters: faces + hair DONE; smoother joints/cloth physics continue in M1–M5.
- 54 (9.14.0) G7 Monsters: proportion pass DONE; per-family sculpt + textures continue in M6.
- 55 (9.15.0) G8 Grounding and collision: DONE.
- 56 (9.16.0) G9 Shadows and depth: DONE (SSAO skipped for phone budget).
- 57 (9.17.0) G10 Motion: DONE (animated, networked emotes). Was: smoother turns/starts/stops, idle variety, better attack, cast and hit reactions, emotes.
- 58 (9.18.0) DONE. G11 Effects: particle spell effects per element, weapon-skill trails, hit sparks, level-up and crystal effects, rain/snow/mist weather particles.
- 59 (9.19.0) DONE. G12 Camera and finish: anti-aliasing, subtle bloom and colour grade, depth fog tuning, auto quality for phones, final performance pass.
Model detail track (era-style detail comes mostly from painted textures on ~2–3k-triangle models, so textures carry most of the work):
- 60 (10.0.0) DONE (segment scaling + distance LOD + hands; no full re-skin). M1 Mesh pipeline: replace primitive-part bodies with continuous lofted/lathed meshes per race (smooth shoulders, hips, necks, hands with fingers grouped), triangle budgets per tier, LOD levels.
- 61 (10.1.0) DONE. M2 Painted texture system: canvas-painted texture atlases per model (cloth weave, leather grain, metal engraving, trim, shading baked in), per-region UVs, seeded variation.
- 62 (10.2.0) DONE. M3 Faces and hair: painted face atlases (eyes, lashes, brows, lips, cheek shading) with 8 faces per race, blink/mouth flaps, carded hair meshes with alpha strands and 12 styles.
- 63 (10.3.0) DONE. M4 Gear sets: unique meshes per armour piece (pauldrons, gauntlets, greaves, hoods, robes) and tiered visual sets; weapons with detailed silhouettes (guards, wraps, engraved blades) and glow on high tiers.
- 64 (10.4.0) DONE. M5 Races in motion: per-race proportions, skeleton tweaks and animation sets (small folk bounce, big folk heavy steps, tails/ears that react).
- 65 (10.5.0) DONE (variants + size jitter; no new sculpts). M6 Monsters and NPCs: per-family sculpted meshes + painted textures + tier variants (colour, size, armour, accessories); every named NPC gets a unique outfit.
World scale track:
- 66 (10.6.0) DONE. Z1 Distance: far-terrain impostors, mountain/skyline backdrops per zone, longer draw distance with aerial perspective fog, landmarks visible from far away.
- 67 (10.7.0) DONE (scaling + plateaus/ravines; no new caves yet). Z2 Bigger zones: existing fields 2–3x larger with sub-regions (plateaus, canyons, ravines, ridges), multiple entrances, hidden pockets and caves.
- 68 (10.8.0) DONE. Z3 Life: ambient wildlife (birds, butterflies, fish, deer), wandering travellers and caravans, per-area ambient sound, ecology that changes by time and weather.
- 69 (10.9.0) DONE (lookouts, shrines, tablets, caches; wrecks/NM lairs not yet). Z4 Points of interest: lookouts, shrines, wrecks, ruins, hidden chests, rare gathering spots, NM lairs, lore tablets; map regions and discovery rewards.
- 70 (10.10.0) DONE (camps are warp points, not home points; ferry moved to phase 79). Z5 Travel: roads with signposts, mount routes, a ferry between harbor and an island, crystal warps with costs, outpost camps that act as home points.
- 71 DONE (11.0.0) SAM/NIN/DRG. 72 DONE (11.1.0) BST/BLU/COR. 73 DONE (11.2.0) PUP/DNC/SCH. 74 DONE (11.3.0) GEO/RUN. All twenty-two jobs done.
New zones (one per release; each gets its own monsters, NM, gathering, quests, landmarks and music mood):
- 75 DONE (12.0.0, Ironvale: town, mythril smith, 2 quests; guild/missions/residence not yet) Second city: a rival/allied nation with its own shops, guilds, missions, residence option and a distinct building style; road link to the Outpost region.
- 76 DONE (12.1.0; buried temple not yet) Sunscar Desert: dunes, buried temple, sandworm NM, daytime heat that drains MP (shade/water items counter it).
- 77 DONE (12.2.0) Verdant Jungle: dense canopy, rope bridges, vine-covered ruins.
- 78 DONE (12.3.0) Cinder Peak: volcano, lava flows, fire elementals, top-tier smithing ore.
- 79 DONE (12.4.0) Gull Isle: coastal island reached by ferry; sea cliffs, pirate caves, lighthouse.
- 80 DONE (12.5.0) The Spire: multi-floor tower dungeon, harder per floor, boss at the top.
- 81 DONE (12.6.0) Underdeep River: underground river by boat, glowing caves, fishing.
- 82 DONE (12.7.0) Highland plateau: open grassland, large mount area, nomad camps.
World systems:
- 83 DONE (13.0.0) Regions with control status: each region shows which side holds it; affects shop stock and prices.
- 84 DONE (13.1.0) Weather that matters: sandstorms, blizzards, fog change spawns and view distance.
- 85 DONE (13.2.0) Expeditions: multi-zone quests far from home.
- 86 DONE (13.3.0) World map atlas: fills in as you explore, every zone joined up.
- 87 DONE (13.4.0) Night-only and weather-only content: monsters, areas and NPCs that appear only at certain times or weather.
- Pending on the user's side: run the latest setup.sql (schema 6) in Supabase.

## Version log

| Version | Change |
|---|---|
| 16.17.0 | Phase 126: Classic effects (banded sprites, thick rings, outlined numbers); Tab targets objects. |
| 16.18.0 | Phase 127: Classic polish (cliff chunk detail by tier, no character normal map in Classic). |
| 16.19.0 | Modern look removed; Classic is the only look (see design/mmo-look-plan.md "One look"). |
| 16.20.0 | Time box and Wait (hud4.js openTimeBox/startWait/tickWait/stopWait/timeSyncCheck); calmer update popups (menu4.js checkForUpdate). |
| 16.16.0 | Phase 125: Classic world match (posterised textures, banded world lighting chunk, no bloom, shorter fog). |
| 16.15.1 | offRoadGroup in data.js: stalls/desks move together with NPCs standing at them; warp stones and dsigns also avoid plazas (r+extra). |
| 16.15.0 | Nameplate range per kind in updateLabels (npc 260, mob 450, other 700; target and party always). build.mjs now also writes root version.json (it was stale at 16.10.0, so the update popup never fired); update check every 5 min plus on tab focus. |
| 16.14.1 | renderMCard shows the Current Crystals gilBox for modal "auction" as well as "shop". |
| 16.14.0 | Drag-yaw inverted by default (settings.invertX, default true); Tab (cycleNpcTarget) includes warp stones in the crystal group. |
| 16.13.1 | #tgtAct moved to first child of #ffSide (above #ffTBox), FF .ffb pill style; no per-frame world projection. |
| 16.13.0 | Offline play gate (showOfflineGate/verifyOfflinePassword in main4.js): account email+password verified with a throwaway non-persistent Supabase client; salted SHA-256 cached in localStorage ashenreach_offline_gate for no-network checks. Client-side only, so it deters casual use rather than being real security. |
| 16.12.0 | Mobile target button (#tgtAct, tgtActFor/updateTgtAct/tgtActPress in hud4.js): Talk/Use/Inspect/Harvest/Fight above the target; Fight engages without chase and opens the command box. S.chase now only set when settings.autoRun (autoRunOn in game.js, Config > Camera). |
| 16.11.0 | Warp stones are statues (propView "statue", prop+warpstone flag); offRoad pass in data.js moves benches, racks, dummies, props, stalls, lamps, signposts and statues clear of z.paths and houses. Ambient walkers removed (cityLife no longer called, zone walker ambients and road travellers skipped); only animals roam. |
| 16.10.0 | Phase 124: townsfolk coded by district and race (Track 6). |
| 16.9.0 | Phase 123: bold monsters, level-band colours, NM crowns/horns/auras (Track 6). |
| 16.8.0 | Phase 122: bold weapons and shields (Track 6). |
| 16.7.0 | Phase 121: Job style, iconic tiered outfits for all 22 jobs (Track 6). |
| 16.6.0 | Phase 120: Classic face finish (Track 6). |
| 16.5.0 | Phase 119: chunky hair clumps, smooth skin shading (Track 6). |
| 16.4.0 | Phase 118: chunky humans, lower segment counts, mitten hands, cuffs, collars, boot flares (Track 6). |
| 16.3.0 | Phase 117: hand-painted atlas, crisp textures (Track 6). |
| 16.2.0 | Phase 116: Classic look (Lambert bands, outlines, Look setting), offline creation fix (Track 6). |
| 16.1.1 | Creator preview never zooms on touch devices (ccTouch). |
| 16.1.2 | renderPreview forces focus 0 and fz 0 while UI.creating and ccTouch(), so a stale pv.fz can never zoom the creator camera on touch screens. Real-phone zoom was not reproducible headlessly; a stale cached build is the other suspect. |
| 16.1.3-16.1.5 | Real cause of the phone "zoom": the preview column was only 107-133 px wide (aspect 0.27-0.46), so the fixed camera cropped the arms at the sides. renderPreview now pulls the camera back by wm = clamp(0.7 / aspect, 1, 1.9) and lowers the look-at slightly; mobile creator column 42% with minmax(0,1fr); at 360 px and below faces and hair use two columns. Panel still overflows slightly at 320 px wide (known, rare). |
| 16.1.6 | Race face paints: atlas now 8x6 cells; face17-24 = paintFaceUrsan (8 variants), face25-32 = paintFacePipkin (8 variants, used for both sexes); faceReg in humanEntry picks by L.ears/L.doll; paintFaceFor(race,...) also drives creator thumbnails. RACE_SKINCOL overrides skin (ursan 0x8a9a74 gray-green, pipkin 0xf2c9aa); raceSkinColor(race). Ursan: ear = small skin taper, no beard, tail uses scale region in skin colour and is longer/thicker, armR x1.3, headR 0.19, neck 0.05, head profile lips 0.2 (higher lips draw a dark mouth-patch box), excluded from the anime feature reduction. Pipkin: rounder cheeks/jaw profile. |
| 16.1.7 | Head profiles: jaw/chin/long raised for human0/1, elari, nekari, pipkin (jaw 0.3), ursan (jaw 0.24). Ursan skin 0x8e9688. Pipkin eyes rx 7.2, painted brown button nose (radial gradient + highlight) replaces the pink blob. |
| 16.1.8 | Pipkin RACE_BODY neck -0.05 (head drops onto the shoulders). |
| 16.1.9 | Ursan RACE_BODY neck -0.04; ursan tail radii 0.055/0.045/0.012 and length about 0.36 below hips. |
| 17.3.0 | Area spells, Spikes, En-spells, Shock/Rasp/Choke, Requiem, Threnodies, Mambo, Pastoral, Operetta. See "Area spells and songs (v17.3.0)". |
| 18.0.0 | classic MMO equipment: 788 pieces at level 20 and below replace every old item. See "Equipment (v18.0.0)". |
| 18.1 | Tools only: tools/balance/sim.js, runsim.sh, report.js (fight simulator). Baseline in design/balance-18.1.md. |
| 18.2.0 | Player power: delay curve, WTYPE_MULT, DMG_LV_K, ammoDmgMul, hpLvBonus, mpMul. Results in design/balance-18.2.md. |
| 18.3.0 | Monster curve: CONFIG.mobCurve scales mob HP, attack and damage by level. Results in design/balance-18.3.md. |
| 18.4.0 | Economy: gentler gear prices, CONFIG.mobGil for every XP-giving monster, Ryl./Lgn. shop regex fix. Model in design/economy-18.4.md. |
| 18.5.0 | Gear recipes: 128 generated recipes (shop item + its +1 as HQ). Coverage check. Test p58unit.js. |
| 18.5.1 | Monsters chase until you zone (combat leash check removed from updateMob; CONFIG.leash unused); Shift+Tab cycleObjectTarget; |
| 18.6.0 | Hotbar has 4 lines: pages[0] Ctrl (and plain digits), [1] Shift, [2] Alt, [3] Tab (hotbar() pads old saves to 4). Tab is held-modifier: onKey sets UI.tabHeld/tabUsed/tabShift, keyup of Tab runs cycleTarget/cycleObjectTarget only if no digit was used. Hotkeys tab lists four lines; UI.page/pager still show lines 0-1. |
| 18.7.0 | Pinned hotbar: #barWrap shown again (CSS hides only #xpRow; body.noHotbar from settings.hotbar === false via applyUiSettings, toggle in Config > Interface). #bottom sits centered above the log. UI.page 0-3 (setPage mod 4, #pgNum shows Ctrl/Shft/Alt/Tab); plain digits fire UI.page, Ctrl+digit line 0. |
| 18.8.0 | Camera inversion split: settings.invertX/invertY apply to mouse/touch drag; settings.keyInvertX/keyInvertY (default off) flip arrow keys and Q/E (kx, ky in the camera key code). Config > Camera has four toggles. |
| 18.9.0 | gilBox (renderMCard) is a one-line "Crystals  N" row (flex row), shown for shop, auction, forge, furnishings, stable, mercs, guild, home, job, craft, board, storage; equipment .gilB matches. |
| 18.10.0 | Market equipment (superseded by 18.11.0): 10 seeded-random hq (+1) tradable equip per market day (S.ahEq cache); ahStock for equip = 1 if listed today else 0; buy list shows only those. Auction rows carry data-hv; renderMCard shows itemCard for modal "auction" (hover, else UI.ahSel / UI.pmSel). Auction window class "fit" (max-content width). |
| 18.11.0 | Market stock: ahDaily() (replaces ahEquipToday) = seeded daily picks per ahGroup (equip hq 10, ammo 5, use 10, scroll 3, food 10, mat 10; AH_DAILY), only items with lv <= player lv + 1; cached in S.ahDay by day and level. ahStock is 0 for unlisted ids; buy list = ahDaily set. |
| 18.12.0 | Tab: cycleTarget lists mobs (450 px) and NPCs/objects (260 px, whole zone range in safe zones) together by distance and targets on keydown (cycleNpcTarget/cycleObjectTarget in game.js). Hotbar: slot.hud === false hides a slot from the HUD bar (Hotkeys tab button slothud); #barWrap uses the ffStripe style, #barGrip drags it (translate offset in settings.barPos, clamped by barPosApply, double-click resets). Equipment: .eqSide.two puts the fit list and .eqCards side by side. CONFIG.supportUnlockLevel 10, CONFIG.mountLevel 20 (quests support/riding lv, Ysolde, hud chips). Humanoid families (goblin, orc, fishfolk, birdfolk and casters; not NMs) gil [1, 2] per level. |
| 18.13.0 | Hotbar: body.barEmpty (set in buildActionBar when no slot has hud !== false) hides #barWrap; #barClose calls closeHotBar (sets hud = false on every slot); setPage skips lines with nothing shown (lineShown). main4 guardKeys (capture listener) preventDefaults Ctrl/Alt/Meta + digit; onKey ignores Ctrl/Meta + non-digit; toggleFullscreen (hud4) requests fullscreen and navigator.keyboard.lock(), Config > Interface button data-a="fullscreen". |
| 18.14.0 | CONFIG.shopMul 10 multiplies buyPrice (store buy prices only; sell prices, mercenary fees, auction and stable unchanged). Camp crystals removed (data.js camp loop only adds the camp prop). Old saves may still hold campcrystal_* attunements; the warp list ignores ids without an NPC.. Empty hotkey slots do nothing (activateSlot). settings.autoFull requests fullscreen + keyboard lock on the first pointerdown after start (main4). |
| 18.15.0 | Ctrl hotkey line removed: page 0 is now the Main line (plain digits and Ctrl+digit use UI.page), labels Main/Shft/Alt/Tab in hud4 pgNum and menu4 tabActions. Saved hotbar data unchanged. |
| 18.16.0 | Database (menu4 tabDatabase, key Y, TAB_INFO.database, replaces bestiary tab/command): categories DB_CATS items/equipment/magic/abilities/jobs/people/places/beasts, UI.dbCat. Only shows owned/learned/leveled/met content: save.seen.items (giveItem hook plus dbSyncSeen from inventory/gear/storage, normalizeSave backfill), save.seen.npcs (talkTo), save.spells, ABILITIES where jobs[job].lv >= ab.lv, jobs lv>1 or main/sub, save.discovered, save.bestiary. People pictures use beastThumb(key, cb, entity) with an npc entity (models3d renderThumb accepts an entity). Achievements gained a Stats tab (UI.achView, tabStats, STAT_GROUPS); new save.stats counters dmgDealt, dmgTaken, bigHit, spellsCast, abilitiesUsed, itemsUsed, killGil. Command page 1: Party/Search/Linkshell/Friend List/Communication replaced by one Social entry (offline filter now trade and social). Party frame bars gap 13px so HP/MP numbers do not overlap. |
| 18.16.1 | CSS: .iCl overflow-wrap anywhere (unbroken WAR/MNK/... job lists); inside .beast cards .iCard loses frame/padding and .iCh is hidden, so Database equipment entries do not repeat the name. |
| 18.17.0 | Help became the Guide: tabHelp collects sec(title, body) into secs and renders one HELP_CATS topic at a time (UI.helpCat, handler helpcat); first match of the category regexes wins, unmatched sections land in Getting started. New 'Every menu and key' section from guideRef() is generated from MAIN_CMDS, STATUS_CMDS, TAB_INFO keys and COMMANDS. MAIN_CMDS entry renamed Guide, TAB_INFO.help = Guide. Help button removed from Config More row. Fixed missing comma in tabHelp World table (Help threw before). Slim windows (isSlim: inventory, shop, quests, magic, abilities, storage-view) get lHead with data-a slimclose (closeModal then mainCmdOpen if UI.menuFromMain); slim-abilities/magic/inventory/quests/storage width max-content. Inventory has Items/Key Items view (UI.invView); Key Items and Trade removed from MAIN_CMDS (Trade stays in the player target menu). Mobile (<=760px) equipment: .eqL hidden with !important, single column. Achievements window gets class fit; tabStats expanded (job levels, craft/gather skills, creatures, NMs, bag use; stats.walk counted next to ride). @time no longer calls mainCmdClose and #timeBox is excluded from the outside-click closers. |
| 18.18.0 | Recipe scrolls: data.js RECIPE_START (lv0 base recipes, known at start) and items rcp_<recipeId> (kind use, recipe field; r_ ones sold in SHOP/SHOPS.vela, g_ ones are RARE_RECIPES: rare drops via rareRecipeDrop(e) in killRewards (0.015, nm 0.25, boss 0.5, recipe lv within mob lv -5..+3) and added to every other quest reward with lv>=3 as reward.items). save.recipes {id:1}; normalizeSave grandfathers recipes with lv <= craft skill. recipeKnown gates canSynth, csMatches, craft book, usable bag list; learnRecipe via useItem. Inventory list auto-sorted in invSorted (Sort removed), Drop button in lHead (dropsel), tap prompt only when there is Use/Equip/Add to bar; coarse-pointer #dialog sits at the bottom while a window is open. anim.js idle 4 hand no longer crosses the head (upArmR z -0.7); models3d placeWeapon sheathed weapons farther back (bz - 0.04/0.045, staff lean 0.78). |
| 17.2.0 | Carbuncle start, Spirit scrolls from rare Elementals, goblin spellcaster monsters (mob casting), Silence spell. See "Elementals and mob casters (v17.2.0)". |
| 17.1.0 | Status magic: cure, Bar, party buff, Aquaveil, Blink, Sneak, Deodorize and Warp spells; monster-inflicted statuses. See "Status magic (v17.1.0)". |
| 17.0.0 | classic MMO spells and potions: SPELLS/ITEMS potion family rebuilt from classic MMO data; rule version 17 wipes older saves. See "classic MMO rules (v17.0.0)". |
| 16.24.0 | /rest works in combat; a hit while resting stands you up. |
| 16.23.0 | Mercenaries at 75% or less rest when you stand still; rest works mid-fight; shorter flee distance. |
| 16.22.0 | Admin panel shows session info and players online. |
| 16.21.0 | Companion retreat and rest, ranged casters use all MP, healers heal lowest HP first (see Companion retreat section). |
| 16.1.10 | Default human neck 0.075 -> 0.02 (RACE_BODY human, nekari and the humanEntry default; also shortens NPC necks). Elari unchanged. |
| 16.1.0 | Phase 112: Rocky Hollow and Windreach Highlands split into three zones each. |
| 16.0.0 | Phase 111: region framework (areas, zone splitting, save migration, level bands). |
| 15.7.1 | Creator preview: face-centred camera, no auto-turn. |
| 15.7.0 | Phase 110.3: skin tones removed, creation summary and Start over, race and size on Status. |
| 15.6.0 | Phase 110.2: step-by-step character creation (race, gender, face, hair colour, size, name and job). |
| 15.5.0 | Phase 110.1: anime faces (8 face types, male/female paints, smoother heads, fringes at the brows). |
| 15.4.0 | Phase 110: city life: crowds, guard patrols, district signposts, district ambience, tour quests. |
| 15.3.0 | Phase 109: warp stones in every district, free in-city warps, paid inter-city warps, /warp. |
| 15.2.0 | Phase 108: Harbor and Ironvale districts, hireling bodies persist an hour, Phoenix Down, mobile and label fixes. |
| 15.1.0 | Phase 107: city buildings (multi-storey, signs, awnings, clock tower, windmill, forge, warehouse), fountain square, gardens, outer wall and gatehouse, cobbled streets. |
| 15.0.0 | Phase 106: Outpost split into five walled districts with gate halls, banners, district titles and map labels, gate routing for movement. |
| 14.12.0 | Phase 105: brick crypt walls, pilasters, torch sconces, flagstones, sarcophagi, bones, urns, cobwebs; cave timber supports and crates. |
| 14.11.0 | Phase 104: sunbeams, cave light shafts, dust motes, crystal light pools, wet shorelines. |
| 14.10.0 | Phase 103: ferns, reeds, mushrooms, carts, fences, stumps and per-region prop sets. |
| 14.9.0 | Phase 102: strata on cliffs, instanced rock outcrops, wheel-rutted roads with edging stones. |
| 14.8.0 | Phase 101: painted item icon atlas (weapons by type and metal, armour by slot, consumables, materials, rarity frames). |
| 14.7.0 | Phase 100: surface footsteps, weapon swings, monster voices, chests, crafting, fishing, town crowd and cave drips. |
| 14.6.0 | Phase 99: synthesized classic MMO-style interface sounds (cursor, confirm, cancel, open/close, error, target, equip, coins, chat chimes). |
| 14.5.0 | Phase 98: turn-in-place foot planting, quadruped walk/trot/gallop IK, spell learning by main/support job. |
| 14.4.0 | Phase 97: fur/feather shells on High, critter details (bat fingers, shroom gills, worm bristles, whiskers, toes). |
| 14.3.0 | Phase 96: beastman family silhouettes and gear, hunched postures, boss banners. |
| 14.2.0 | Phase 95: NPC props and wardrobe, wrist-led swings, head look-at, red damage numbers + toggle, V torsos and necks, smaller Pipkin feet, status icon spacing, audio unlock. |
| 14.1.0 | Phase 94: body-fitted armour shells, weapon tiers, title tidy-up. |
| 14.0.0 | Phase 93: spring capes/hair/tabards, 5 hairstyles, hair under helmets, fitted helmets, no exit arches, blue title screens, denser starter spawns, critters at night. |
| 13.9.0 | Phase 92: 16 faces, talking mouths and jaw, expressions. |
| 13.8.0 | Phase 91: woven cloth, stitched leather, engraved metal, embroidered trim, faster atlas. |
| 13.7.0 | Phase 90: fingers, feet, animal heads, hour-long KO with Raise/Ember Plume, classic text colours, simpler target box. |
| 13.6.1 | Classic command menu styling, readable top labels, compact object target box. |
| 13.6.0 | Phase 89: lofted bodies, slower movement, foot-planting leg IK, trail crash fix. |
| 13.5.0 | Phase 88: sculpted heads, realistic faces and hair, skull jaws, cactus Needlekin, 512 px atlas on High. |
| 4.8.0 | Phase 7: performance settings and balance check (above). |
| 9.0.1 | Phase 40b: log auto-hide with pin, separate Network box. |
| 9.1.0 | Phase 41: main menu window, in-world Status screen, map bottom-left, Commands box split. |
| 9.2.0 | Phase 42: in-world windows, talk in log + prompt box, shrinking log, compass map, seated rest. |
| 9.16.0 | Phase 56: blob shadows, rim light, soft shadows on high. |
| 9.17.0 | Phase 57: animated emotes, shared with other players. |
| 9.18.0 | Phase 58: spell residue, element WS trails, hit sparks, weather particles. |
| 9.19.0 | Phase 59: MSAA composer, colour grade, auto quality fallback. |
| 10.0.0 | Phase 60: hands, segment scaling, distance LOD models. |
| 10.1.0 | Phase 61: baked painted shading, richer cloth/leather/metal/skin. |
| 10.2.0 | Phase 62: hair locks/strands, eased blinks, eye expressions. |
| 10.3.0 | Phase 63: looks for all armour, plate/gauntlets/greaves/hats, weapon detail and glow. |
| 10.4.0 | Phase 64: race gaits, ear bones and reactions, tail lashing. |
| 10.5.0 | Phase 65: monster variants and size jitter, Odette outfit. |
| 10.6.0 | Phase 66: layered backdrop ridges, landmarks, aerial perspective. |
| 10.7.0 | Phase 67: Hollow ×1.5, Frost/Marsh ×1.4, plateaus and ravines. |
| 10.8.0 | Phase 68: wildlife, travellers, butterflies, fish, procedural ambience. |
| 10.9.0 | Phase 69: lookouts, shrines, lore tablets, hidden caches, Wayfarer. |
| 10.10.0 | Phase 70: camps, crystal warps, signposts, road riding bonus. |
| 11.0.0 | Phase 71: Samurai, Ninja, Dragoon jobs, three weapon types. |
| 11.1.0 | Phase 72: Beastmaster, Blue Mage, Corsair. |
| 11.2.0 | Phase 73: Puppetmaster, Dancer, Scholar. |
| 11.3.0 | Phase 74: Geomancer, Rune Fencer. |
| 12.0.0 | Phase 75: Ironvale, mythril gear, Brisa quests. |
| 12.1.0 | Phase 76: Sunscar Desert. |
| 12.2.0 | Phase 77: Verdant Jungle; scroll drop fix. |
| 12.3.0 | Phase 78: Cinder Peak volcano. |
| 12.4.0 | Phase 79: Gull Isle and the ferry. |
| 12.5.0 | Phase 80: The Red Spire tower dungeon. |
| 12.6.0 | Phase 81: Underdeep River. |
| 12.7.0 | Phase 82: Windreach Highlands. |
| 13.0.0 | Phase 83: Regions and nations (conquest). |
| 13.1.0 | Phase 84: Weather that matters. |
| 13.2.0 | Phase 85: Expeditions. |
| 13.3.0 | Phase 86: World atlas. |
| 13.4.0 | Phase 87: Night and weather secrets. |
| 9.15.0 | Phase 55: slope pitch for long-bodied monsters, no sinking. |
| 9.14.0 | Phase 54: monster proportions from reference measurements (crawler, bee, fish, sheep). |
| 9.13.0 | Phase 53: 8 faces, 4 new hairstyles, wider character atlas. |
| 9.12.0 | Phase 52: timber framing, plaster, shutters, lanterns, chimneys, shingles, barrels/crates. |
| 9.11.0 | Phase 51: water tint, shore foam, ripples, waterfalls. |
| 9.10.0 | Phase 50: layered trees, bushes, flowers, logs, tint variation. |
| 9.9.0 | Phase 49: tiled terrain detail, slope rock. |
| 9.8.6 | Tap-to-type fix on phones, phone Status shows all boxes. |
| 9.8.5 | Phone buttons fit the side column; tap bottom-left to type. |
| 9.8.4 | 5 characters per account (client + server), upload offer removed. |
| 9.8.3 | Phone window/menu overlap, read-only View House, blue log on phones. |
| 9.8.2 | Exit halls with inward arrivals, caster melee when safe, phone Status layout, back buttons. |
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

## Time box and waiting (v16.20.0)
- Main menu "Time" (`@time`) closes the main menu and calls `openTimeBox()` (hud4.js). `UI.timeBox = { view: "menu" | "wait" | "run", hours }`; panel `#timeBox` (template4 CSS, FF stripe).
- `WAIT_CFG = { secPerHour: 5, maxHours: 24, msPerHour: 144000 }` (one game hour = 144 s real at the 25× clock).
- `waitBlocked()`: `othersOnline() > 0` (world presence `NET_RT.online` minus own name; 0 offline or not a member) → "others online"; `!S.zone.safe` → "enemies are near"; dead, engaged or KO → "can't wait right now". Rechecked every frame while waiting.
- `S.wait = { hours, done, total }`; `tickWait(dt)` (called at the top of updateHud) adds real elapsed seconds (performance.now, capped at 1 s per frame, so slow frame rates keep 5 s per hour) × msPerHour / secPerHour to `S.timeShift`, redraws the clock every 0.05 s. `stopWait` writes `save.timeShift`, saves and logs.
- `selectChar` restores `S.timeShift = save.timeShift`. `timeSyncCheck()` runs on world presence sync: if others are online and the shift is non-zero, it resets to 0 and logs.
- Side effects of a shift: vana(), weather slots, AH market ticks and conquestDay all read `S.timeShift`.

## Update check (v16.20.0)
- `checkForUpdate`: throttled to once per 60 s (manual skips it), one request at a time, one visibilitychange listener.
- localStorage `usr_ver_dismissed` (Later; holds until a newer version), `usr_reload_target` + `usr_reload_at` (set on Reload; if the page still loads an older build, no auto popup for that target for 15 min, and showWhatsNew logs a note). Cleared when up to date.
- The popup always names the newest version (`#verPop[data-ver]`), so several releases in a row give one popup.

## classic MMO rules (v17.0.0)
- Save gate: `CONFIG.ruleVer = 17`, `newSave().rv`; `normalizeSave` returns null on mismatch. `loadRoster` calls `purgeOldChars`; deleted names go to `OLD_CHARS` and `showCharSelect` (main4.js) shows a notice. `netFetchChar` (net.js) deletes old online characters.
- `createChar`: `spells` = every id in SPELLS whose `jobs[mainJob] === 1`.
- Data in data.js SPELLS (generated by `tools/items-import/gen17.py` from Windower `spells.lua`): 26 specs plus 8 spirits. Songs cost 0 MP.
- Cure: `cure {min, t:[[powerLimit, divisor, constant, basepower]]}`; power = floor(MND/2)+floor(VIT/4)+Healing skill (`cureAmount`, `healAmount`).
- Nukes: `power`, `k` (slope per stat difference up to 50), `k2` (50 to 100), `stat`; no level multiplier; undead take 1.5x from light.
- DoT (Dia, Bio, Poison): `dot {dur, tick|skill, div, ceil, min, max}`; Dia and Bio replace each other (`castDia`, `tickBuffs`).
- Drain and Aspir: `absorb [mult, const]`, max = skill*mult+const, minimum half.
- Songs: `base, sreq, cap, mult, div`; power = floor(base + (skill-sreq)/div), capped; buffs stored `flat: true`. `SONG_KEYS` includes minne.
- Debuffs: potency from stat difference. Slow `pow` 0.073-0.292, Paralyze 0.05-0.25, Blind 0.05-0.5 via buff `flash`.
- Buffs added: poison, shell (-11% elemental damage via `opt.el` in `applyDamage`), minne (flat defense), reraise (`{until, pct}`; consumed in `onKO`).
- Items: generated by `tools/items-import/potions17.py`; `healPct`/`mpPct` (Elixirs), `reraise` + `rrSecs`. Prices = classic MMO BaseSell x 40/130. Raise, Phoenix Down and Ember Plume are removed; Raise-kind code paths in game.js and net.js remain but no spell uses them.
- Assumed, not verified: Reraise strengths 0.5 / 1 / 1.
- Deferred to 17.1: AoE spells, status cures, Bar-/En- spells, equipment import (level 20 and below), mob and economy balance. Plan in design/item-plan.md.
- Tests: test/p55unit.js covers starting spells, purge, cure numbers, potions, Elixir, Reraise, Stone, Fire, Bio.

## Status magic (v17.1.0)
- Spell kinds added in data.js SPELLS: `cleanse` (`cleanse: [buffKeys]`, castCleanse), `warp` (castWarp, player only, enterZone to homePos), and buff flags `party` (applies to all alive party within 300 of target), `bar` (element), `barst` (status), `n` and `exact` (shadow count; `exact` skips the level 12 bonus), `rnd` (random 0-120 s added to duration).
- castBuff now loops over the party group and calls `applyBuffTo`. Bar-element pow = min(0.35, (40 + floor(Enhancing/5)) / 400): my approximation of classic MMO's MDEF bonus (40 + skill/5) as a damage cut. Bar-status pow = 0.5 resist chance: also my approximation.
- `BAR_EL` maps fire/earth/water/wind to barfire/barstone/barwater/baraero and is applied in `applyDamage` when `opt.el` is set. `BAR_ST` maps poison/paralyze/flash/sleep to their Bar buffs and is used by `inflictStatus` and the Mandrake sleep.
- Aquaveil: `n` = 1 (2 above 300 Enhancing); `applyDamage` spends one when an interruption roll succeeds.
- Sneak ignores `aggro.sound`; Deodorize ignores `aggro.lowhp` (in `detects`).
- Silence: buff `silence`; `checkAction` refuses all spells. No monster casts spells in this game, so the Silence spell itself is deferred.
- Monster statuses: tpMove `status: [buffKey, seconds, pow]` applied in `execTpMove` via `inflictStatus` (poison ticks 1 + floor(lv/5) every 3 s). Assigned: Final Sting and Spore Cloud poison, Tongue Lash paralyze, Sand Spit blind, Shrieking Chant and Drowning Tide silence.
- Mercenary healers: `healerSupport` cures statuses first, then keeps Protect and Shell (party version preferred) on the party while fighting at over 50% MP.
- Protectra uses Protect's +15 (LandSandBoat lists 20; Protect itself uses 15 in the game, kept consistent).
- Deferred to 17.2: Curaga, Diaga, Banishga, Stonega, Waterga, Spikes, En- spells, Shock/Rasp/Choke, Foe Requiem, Threnodies, Sheepfoe Mambo, Herb Pastoral, Scop's Operetta, Silence.
- Tests: test/p56unit.js.

## Elementals and mob casters (v17.2.0)
- SPELLS flag `drop: true` marks the eight Spirit summons: excluded from `createChar` starting spells and from the shops (data.js scroll loop `continue`). Carbuncle (`PETS.carbuncle`, light, pact Searing Light) is the SMN level 1 starter (5 MP, 5 s cast from classic MMO data).
- Eight NM_FAMILIES `<el>_elemental` with loot `scroll_<spirit>` at 0.3. Each is a rare spawn (chance 0.07) attached to an existing placeholder spawn: fire/cinder (magma_lizard), ice/frost (frost_bomb, night), earth/underdeep (deep_worm), air/sunscar (dune_lizard 1800,700), thunder/verdant (jade_hornet, day), water/gullisle (fishfolk), light/highlands (wind_wasp, day), dark/crypt (ghoul, night). Spawns past a zone's width are dropped at load, so check a new placeholder shows in `G.ZONES[z].spawns`.
- Mob casting: family `spells: [{id, mul | status:[buffKey, secs, pow] | heal}]`, `castGap:[min,max]`, `range`. `updateMob` combat branch: `startMobCast` picks cure on a wounded ally (70%) else a random offence spell not already on the target; `finishMobCast` resolves after `max(1.5, cast+1)` s. Damage = `baseDmg * mul`, element passes through `applyDamage` so Shell and Bar spells work. Statuses go through `inflictStatus`. Hits interrupt a mob cast with 30% chance; sleep and stun cancel it; `buffs.silence` blocks starting one. Mobs never target remote players.
- Goblin casters: goblin_apprentice (Hollow, stone), den_conjurer (Den, stone/poison/cure), mire_hexer (Marsh, water/poison/slow/silence), frost_shaman (Frostspire, blizzard/paralyze/blind/silence/cure). Look variants in rig.js `goblinLook` keyed by `m.famKey`.
- Silence spell: WHM 15, RDM 18, 16 MP, 3 s cast, 10 s recast, 120 s (Windower). Mercenary `smartAct` casts it only at targets with `fam.spells`.
- Test p15unit "the sprite fades when MP runs out" is flaky (also on 17.1.0).
- Tests: test/p56unit.js (elementals, goblin casters, silence).

## Area spells and songs (v17.3.0)
- `aoe: radius` on a spell: `castHeal` heals party members within it of the target (Curaga 300); `castNuke` and `castDia` loop mobs within it (`nukeOne`, `diaOne`; Banishga, Stonega, Waterga, Diaga use 170). Single-target spells are unchanged.
- Curaga uses the old classic MMO formula mapped onto the `cure.t` table (divisor doubled because the old formula halves power first).
- Nuke powers for the -ga spells and Shock/Rasp/Choke tick are mine, interpolated between neighbouring tiers; LandSandBoat has no per-spell damage constants. Level, MP, cast and recast are Windower values.
- DoT ticks are generic: `tickBuffs` damages any buff with `tick`, `next` and `src`. `dot.pot: "int"` gives tick 1 to 5 by caster INT (>40, >70, >100, >150, as `getElementalDebuffPotency`). `sd` = (tick-1)*2+5 is stored for Rasp (accuracy) and Choke (defense) in `stat()`. `replaces: [...]` deletes other DoTs on cast. Shock's MND loss is not modelled.
- Spikes: buff `blaze_spikes`/`ice_spikes` with `pow` = clamp(floor((INT+50)/div), 1, max) (div 12 max 25; div 20 max 15), applied in `swing` against non-ranged attackers; Ice Spikes paralyzes 30% for 10 s (my guess). En-spells: `enthunder/enstone/enaero`, `pow` from Enhancing skill (floor(sqrt)-1 up to 150, then skill/20+5), added after each melee hit as elemental damage.
- Threnody: debuff `threnody_<element>` with `pow` 0.25; read in `nukeOne` only. classic MMO lowers elemental resistance by 50: my 25% is an approximation.
- Mambo (`mambo`, evasion), Pastoral and Operetta (`pastoral`, `operetta`: resist Poison and Silence via `SONG_RES`, chance min(0.75, pow/50): my approximation) join `SONG_KEYS` (two-song limit). Foe Requiem I/II are `dot` spells with buff `requiem`.
- Mercenary fixes: `healEstimate` now uses `cureAmount` for table cures; `healerAI` casts Curaga when two or more allies within 300 are hurt; `bardAI` uses `foe_lullaby` and the current song keys.
- Tests: test/p57unit.js.

## Equipment (v18.0.0)
Source of truth for gear. Everything old (167 pieces) is gone; saves reset (CONFIG.ruleVer 18).

### Data and files
- `src/gear.js` (loaded first in every build) defines `GEAR_DATA`, one line per item, generated. data.js copies it into `ITEMS` just before `const SHOP` (`jobs: "ALL"` becomes `ALL_J`). Do not edit by hand.
- `tools/items-import/gear18_filter.py` picks the pieces from the Windower table (`gear.json` from `parse.py`): level 1 to 20, minus costumes, event outfits, crafting-guild gear, fishing gear, tokens and novelty items; the Warp Ring is kept. At level 1 only real starters stay (weapon DMG above 2, armor DEF 2 or more or a real stat, or a nation, race, Bronze, Brass, Ash, Copper name; instruments always).
- `gear18.py <gear.json> src/gear.js` writes `GEAR_DATA`. It also writes `gear18-index.json` (id, slot, level, wtype, src, name, jobs). `gear18-flags.json` carries `rare`, `nm`, `ex` and `rarity` from the old reward items onto their replacements. `gear18_map.js` and `gear18_apply.js` did the one-time old to new id swap.
- Ids: lower-case name without apostrophes, `_` between words; `+1` becomes `_hq`, `+2` `_hq2`. Duplicates get `_2`. Ids starting with a digit are quoted.

### Mapping rules
- Slots from the classic MMO bitmask: main, sub, ranged, ammo, head, body, hands, legs, feet, neck, waist, ear (two), ring (two), back. Jobs from bits 1 to 22 (all 22 jobs set means `ALL_J`). Race restrictions are ignored.
- Weapon skill ids: 1 h2h, 2 dagger, 3 sword, 4 gsword, 5 axe, 6 greataxe, 7 scythe, 8 polearm, 9 katana, 10 gkatana, 11 club, 12 staff, 25 and 26 archery (bows, crossbows and guns all count as archery), 27 throwing, 41 and 42 instrument.
- Melee `dmg` = classic MMO DMG x WTYPE_MULT[type] x (1 + 0.015 x item level), rounded (h2h uses DMG + 3). WTYPE_MULT (fitted in 18.2 so each weapon type keeps its 17.3 damage per second): sword 1.15, dagger 1.5, club 0.95, staff 1.05, greataxe 1.1, gsword 0.95, axe 1.05, h2h 1.1, scythe 0.8, polearm 1.0, katana 1.4, gkatana 1.0, archery and throwing 1.0. Melee `delay` = 1.9 x (classic MMO delay / 183)^0.75 seconds (dagger 1.9, sword 2.3, staff 3.2, great axe 4.1); h2h 2.6. Ranged `delay` is delay / 120. Ammo keeps `dmg`.
- Stats: DEF def, HP hp, MP mp, STR DEX VIT AGI INT MND CHR, Attack att, Accuracy acc, Evasion eva. Ranged Accuracy and Ranged Attack become acc and att only on Range and Ammo items. Dropped: Haste, Enmity, HP%, MP%, skill bonuses, latent and special effects.
- Prices (18.4): `30 + 40 * lv^1.5` times a slot factor (main and body 1, ranged 0.9, legs and sub 0.8, head, hands and feet 0.7, neck, ear, ring, back and waist 0.6; ammo price / 6, at least 2), x1.4 for +1. Sell price stays price / 4.
- Job quests whose classic MMO weapon is above level 1 also give a level 1 weapon: Samurai gets Tachi (Lv8) plus Harpoon, Rune Fencer gets Claymore (Lv10) plus Bronze Sword (`reward.items`). Blue Mage, Corsair, Dancer, Scholar, Bard and Summoner rewards are level 1 pieces. The Warp Ring has `enchant: "warp"`; Use in the bag casts Warp (5 s item delay).

### Engine
- `gearStats` (game.js): a bow in `ranged` sets wtype archery, dmg = bow dmg + ammo dmg x CONFIG.ammoDmgMul (0.5), delay = bow delay; the main hand then only adds stats.
- Player power (18.2): `maxHp` adds CONFIG.hpLvBonus x (level - 1) (3 per level) and `maxMp` uses job MP x CONFIG.mpMul (1.35); passive and resting MP regen divide maxMp by mpMul so regen per second is unchanged (a bigger pool, not faster refill). Both replace the HP and MP that the old invented gear carried. Instruments and throwing items are stat sticks.
- `gearDrop(m)` after `dropLoot`: 6% per kill for non-boss, non-NM monsters to drop one `src: "drop"` item whose level is within monster level -3 to +1, excluding ids that appear in boss or NM loot, quest rewards, battlefield or guild shop (`GEAR_RESERVED`, built on first use).
- `autoGear(job, lv, role)` dresses companions: best Main by the job's weapon rating then level, best Head, Body, Hands, Legs, Feet at or below their level from `src: "shop"` non-HQ items usable by the job; Range plus Ammo for rangers; a shield for PLD and tanks. `STARTER_GEAR` and `newSave` use bronze_sword, bronze_cap, bronze_harness (WAR) and robe, ash_club or ash_staff (WHM, BLM).

### Sources
- `src: "shop"` (328 items): plain names (not +1, not a set or notable weapon). Level 10 and below go to Pell's `SHOP`, 11 to 20 to `SHOPS.vela`.
- `src: "drop"` (460 items): +1 items, set pieces (Anu's, Enyo's, Nemain's, Njord's, Platoon, nation sets), notable weapons. HQ items of level 14+ are also sold by Haldor (63). Reward items keep their flags: boss and NM loot, quest rewards, guild shop, battlefield.
- Old to new reward mapping is in design/gear-map.md.

### Not done
- Balance: monster HP and attack, XP, prices and damage tuning for the new gear.
- Crafting (18.5): data.js after `RECIPES` generates `g_<id>` recipes for every `src: "shop"` item (not ammo) that has an `<id>_hq`, unless a hand-made recipe already outputs it. Craft by name (`GEAR_CRAFT_RULES`, first match): bone -> alchemy; cloth and leather words -> clothcraft; wood words, bows, staves, clubs, wands, clogs -> woodworking; else smithing. Mats (+1 of the main mat for main, body, ranged): smithing bronze_ingot x2 under level 7, bronze_ingot + iron_ingot 7-12, iron_ingot x2 from 13; woodworking ash_lumber x2 (+ heartwood from 10); clothcraft silk_cloth + lizard_skin (leather words) or worm_silk (+ wool_tuft from 10); alchemy bone_chip x2 (+ crab_shell from 10). Recipe level = item level (cap 20); HQ chance is the usual 5% per skill point above. Many recipes share the same ingredients; the crafting window lists every match (exact first, up to 30) and the player picks one.
- Coverage check (18.5): every job has a shop weapon, head, body, hands, legs and feet in the 1-5 band. Bands with no new piece (mage hands 16-20, PUP main 6-10) keep the earlier piece; not filled.
- Windower short names stay abbreviated (Brz., Lgn., Ryl.Ftm.).
- Tests: p7, p10, p22, p31 and p35 changed for the new items (levels, drops, Haldor); other tests only had ids swapped. Run test/p57unit.js style files with `node build.mjs 1` first.

## Balance tools (18.1)
- `tools/balance/sim.js <game.js> <out.json> <JOB|all> <trials>` loads a build-1 `dist/game.js` through test/harness.js (adds SKILL_RATINGS and ALL_JOBS to the exports), dresses the job in the best non-HQ, non-rare gear at levels 1, 5, 10, 15, 20, sets skills to cap, and duels Goblin and Hill Lizard at level -3, 0, +2. It records win rate, deaths, time to kill and HP lost plus player stats.
- `runsim.sh <game.js> <outdir> <trials>` runs all 22 jobs 8 at a time (about 15 minutes at 3 trials) and writes `all.json`. Copy dist/game.js first if you will rebuild during the run.
- `report.js <old.json> <new.json> <out.md>` writes the comparison (summary by level, player stats, per-job even fights, flags, gear used).
- The baseline is 17.3.0 built from git e6506d9 in a worktree. Note 17.3 itself is not tuned for solo play: even fights at level 10+ are lost solo there too, so compare versions, not absolute wins.
- Open after 18.2: level 5 even fights (DEF 38 vs 50, classic MMO armor tier gap between level 1 and 7 pieces) and level 20 easy fights (50% vs 90%). Both go to the monster pass (18.3). The `src` regex escaped dots were fixed in 18.4 (shop 298, drop 490).
- 18.3 monster curve: `CONFIG.mobCurve = { lv: [1,5,10,15,20], hp, att, dmg }`, linear between points and clamped outside, read by `mobCurve(L)` in buildMob. Values hp 1/0.85/0.8/0.78/0.74, att and dmg 1/0.9/0.9/0.87/0.85. Applies to every monster (families, NMs, bosses) on top of the level 1-6 newbie ramp and family multipliers. Fitted with `iter` runs (10 jobs, 3 trials) then a full run.
- Target (solo, shop gear, skills at cap, median over jobs; mean in brackets): Easy Prey win ~100% (80-99%), HP lost 30-60%; Even Match ~50% (40-55%); Tough 0% (0-11%). Level 1 is left as is (even 100%, tough 5%). 18.3 results in design/balance-18.3.md.
- Sim knobs: env SIM_CURVE (JSON merged into mobCurve), SIM_JOBS, SIM_LEVELS, SIM_DIFFS. `tools/balance/summ.js all.json` prints win, mean win, HP lost and TTK by level.
- 18.4 economy: `tools/balance/econ.js <game.js> <sim all.json>` prints per level kills/hr, XP/hr, hours per level, crystals/hr (drops, materials at sell price, 6% gear drops) and the cost and hours of a full shop set; design/economy-18.4.md compares 17.3. `CONFIG.mobGil = [2, 4]` (crystals x monster level) is paid in dropLoot for any non-NM, non-boss monster that gives XP and has no own `gil`. Targets: a full set in about 1 to 6 hours of solo hunting at every level; the level 16 dip comes from poor-loot families in Frostspire and Underdeep.

## Publishing note
- GitHub Pages serves the repo root `index.html` and `version.json`. `node build.mjs 4` writes both (and dist/); build 1 (tests) does not touch the root files. Commit the root index.html with every release; 16.18.0 to 16.20.0 were once pushed without it, so Pages stayed on 16.17.0.

## 18.19.0: status, item choices, swings
- Status Profile (`statusPanelHTML`, menu4.js) shows only Race, Home Point, Guild Rank, Guild Points and the guild bar. The Adventure block (story, achievements, defeated) was removed.
- Item choices on phones: in `hud4.js` the per-frame dialog placement puts the choice box below both the menu window and `#mCard` (the item card) when the box does not fit beside the window.
- `anim.js` melee block: fight stance raises the weapon arm forward (`upArmR` about -1.2 one-handed, -1.1 two-handed); slash, smash and cleave poses keep the arm forward at about -1.4 and sweep with arm z and chest yaw; the third slash variant lunges with `rootOff[2]`. Checked with test/swingsheet.js (side and top views).
- Text rule: Help, Updates and in-game messages must not name other games. 17.0, 18.0 and 18.5 update entries were reworded.

## 18.19.1: weapon direction
- Weapon direction in the world is the sum of pitch (x rotation) along spine, upArm, foreArm and hand. With the arm raised forward (about -1.8 total) a blade points straight up, so blade weapons add `handR` +1.45 in the fight stance and in every slash, smash and cleave pose to bring the blade level.
- Staff and polearm: the tip is on the long side of the grip and pointed backward when the arm was raised. `anim.js` now sets `v.weapon.rotation.z = PI * an.fight` for them, so the tip leads in a fight and points up at rest.
- Wind-up amplitudes were reduced (arm z about 0.3 to 0.6 instead of 1.0) so the weapon never swings behind the body.
- Check with `node test/swingsheet.js dist/index.html out.png <weaponId> human <variant 0-2> side|top`.

## 18.19.2: two-handed staves, monster eyes
- Staff and polearm fight stance (\`anim.js\`, the \`sw\` block) and the thrust pose put the left arm on the shaft: \`upArmL\` -0.95 with z -0.5 and \`foreArmL\` -0.15 (the right arm keeps -0.9 and -0.6). Checked with test/swingsheet.js side and top views; hands sit close together on the shaft.
- Eyes (\`rig.js\`, head block that reads \`L.eyesGlow\`): the eye position had no side sign, so both eyes landed on the same side. It now uses \`s\`. Humanoid monsters (noFace with eyesGlow, not skull, not claws) get a cream sclera, a glowing iris and a dark pupil; skulls keep dark sockets with a glow; claw monsters (ghouls) keep a plain glow. Check with \`node test/faceshot.js dist/index.html out.png '["mob:den_goblin"]' idle 3\`.

## 18.19.3: staff swing, hat fit
- attackKind staff returns "staffswing" (anim.js swing block): wind-up arms up (upArmR -2.0, upArmL -1.85), chest yaw -0.7 (right), strike drops arms and yaws to +0.2, spine leans forward. Polearm remains "thrust".
- Pointy hat (rig.js): added cloth dome (same as cap) under brim so no skin shows between hat and head.
- placeWeapon (models3d.js): sheathed staff uses its own pose pos (0,-0.1,bz-0.045) rot z 1.2 so it clears wide hats; other two-handers keep z 0.78.
- Test render for hats: JOB=BLM (uppercase) with test/swingsheet2.js; absolute html path required.

## 18.19.4: weapon draw animation, weapon scale, pipkin chin, hat height
- models3d.js placeWeapon is now a state machine: v.wTarget (wanted), v.wTr {to,t0,dur,switched} (transition), v.wBlend (world-preserving reparent blend after the switch at p=0.5). Constants WEAPON_DRAW_TIME 2.0, WEAPON_SHEATHE_TIME 3.0. snapWeapon sets final parent/pose. Instant snap for first call, mobs, dead, mounted, alwaysDrawn, or attacking while drawing.
- weaponPose(v, drawn) holds the hand and sheath poses. weaponBodyK scales weapon by sqrt((leg+torso)/1.38) clamped 0.7..1.15 (pipkin 0.7, ursan 1.12).
- anim.js: if v.wTr, reach pose (upArmR -2.55, foreArmR -1.25, chest/spine lean) weighted by a bump r (0 to 1 to 0 across the transition). Staff z flip skipped while v.wBlend.
- rig.js: pipkin face params jaw 0.52, chin 0, long -0.06. Pointy hat base lowered to hc+hr*0.34, dome angle 0.46pi.
- test/drawsheet.js: MODE=draw|sheathe STEP=<seconds> JOB=BLM IDLE=1 node drawsheet.js <abs html> <png> <weaponId> <race> 0 <side|back|front|backclose>.

## 18.19.5: staff combat loop, pipkin face
- anim.js staff stance (sw block): upArmR -0.5, foreArmR -0.8, upArmL -1.0 z -0.4, foreArmL -0.65, handR -1.15 z 0.3, spine yaw 0.12. Polearm keeps the old forward stance.
- staffswing keyframes via kf(S,W,K): t1 wind-up 0-0.3, t2 strike 0.3-0.48, t3 recovery 0.58-0.92 back to stance. Wind-up upArmR -1.9, handR -0.5, chest yaw -0.75. Strike upArmR -1.0, handR -0.1, chest yaw +0.65, rootOff z +0.08. Positive handR pitch points the staff head down.
- rig.js pipkin face: jaw 0.64, cheek 0.14, long -0.11, chin 0.
- Not done: staff weapon skill leap variant; approach step uses normal movement.
- test/swingsheet2.js with JOB=BLM renders swings; /tmp rb scripts not kept.

## 18.19.6: weapon swing sets (animation plan phase 1)
- anim.js kfMaker(ak,a,b,c0,c1) returns kf(S,W,K): stance to wind-up to strike, then recovery back to stance.
- attackKind: dagger "stab", axe "chop", archery "shoot", staff "staffswing", polearm "thrust" (aVar 1 = wide sweep), h2h "punch" (aVar 0 right jab, 1 left jab, 2 kick). Sword and club/cleave sets unchanged.
- Engage settle: spine and knee bend scaled by sin(pi*an.fight) while the stance blends in.
- Not done: dual-wield (the game has no off-hand weapon); sword and club sets could be moved to kf later.

## 18.19.7: weapon skill moves (animation plan phase 2)
- anim.js wsClass(v) maps weapon to staff, dagger, polearm, bow or fist; wsPose handles styles 1-3 for those (style 3 single blow, 2 chained blows (5 for dagger), 1 spin). Other weapons and style 0 (leap) keep the original generic poses.
- Blows use kfMaker (wind-up, strike, recovery) per blow with alternating sides.
- Existing camera shake on WS (game.js doWS) kept. Not done: hit-stop freeze, per-weapon glow, bow style 1 variant.
- test/wssheet.js: WS=<skill id> JOB=WAR IDLE=1 STEP=0.09 MODE=none node wssheet.js <abs html> <png> <weapon id> human 0 side.

## 18.19.8: spell release, ability poses, interrupt flinch (animation plan phase 3)
- game.js: doAbility sets a.lastJA and a.lastJAId; interruptCast sets e.lastIntr.
- anim.js: an.ja/jaStart/jaId and an.intr/intrStart tracked with the other event stamps; an.cSchool remembers the last cast school for the release flourish.
- JA_CLASS maps ability id to shout, grab, bash, sneak, calm, leap, roll, dance, aim; anything else is "power". jaDuration and jaPose hold the poses.
- Casting pose per school already existed; release flourish is now per school, interrupt flinch 0.5s.
- Not done: staff glow while casting.
- test/jasheet.js: WS=<ability id> (reuses the env name) JOB=WAR IDLE=1 STEP=0.08 node jasheet.js <abs html> <png> <weapon id> human 0 side.

## 18.19.9: movement and idle (animation plan phase 4)
- game.js: joystick/keyboard movement keeps player.face on the target while engaged (lockT), not mounted. No speed penalty when back-pedalling.
- anim.js trackEvents: an.mf/an.ms = smoothed cos/sin of move direction relative to facing; phase runs backward when an.mf < -0.3. Guard against undefined mf (caused NaN collapse during testing).
- Walk block: legK reduces stride on side/back moves, thigh roll on strafe, hips yaw into the step with chest counter-yaw, RACE_GAIT (bob, arm, roll, lean) per race.
- Sheathed weapon bounce uses v.wBaseRot saved in snapWeapon.
- Idle acts 5 (brush shoulder) and 6 (scuff ground) added; existing sit/rest, cape and hair springs unchanged.
- test/walksheet.js: treadmill test (moves an.lx/ly not e.x). DIR=0|90|180 ENG=1 STEP=0.06 MODE=none.

## 18.19.10: death, emotes, work poses (animation plan phase 5)
- Death in poseHuman: stagger (0.25s), knees (0.15-0.55s), topple (0.5-1.2s). deadVar 1 back, -1 side-back, 2 face-down; an.deadRot stores the final root rotation so the rise starts from the same lie. Rise 1.5s: lie to kneel with a hand push, then stand.
- EMOTE_LEN and emoteLen(id) in game.js drive emote duration in all three anim.js places (pose, blink mood, mouth). New emotes: shrug, think, beckon, stretch, kneel, flex.
- Work poses (player only, amp<0.2, not casting/mounted/resting): fishing uses S.fish (state wait/bite, since for the cast swing) and player.reelAt (0.8s reel); crafting uses player.synth; gathering uses player.gatherAt/gatherType stamps set in doGather (mining and logging overhead swing, harvesting crouch).
- Not done: monster KO poses (phase 6), rod prop, remote players do not show work poses.

## 18.19.11: monsters (animation plan phase 6)
- trackEvents sets an.alertStart when a mob's state first becomes "combat" (an.pst tracks previous state; the first frame never alerts).
- mobAlert(v, e, an, P) is a shared 0.9s rear/flare pose chosen by bone presence (body/neck/legF, armL/R, wings, t3-t5, upArm humanoid). Called in human (mobs only), bird, crawler, quad, hare, crab, mandrake.
- Quad attack is now crouch, leap (forward 0.45, up 0.3) and bite. Crawler adds a forward surge. Bird gained peck attack, hit flinch and death tumble. Undead humanoids (v.style.family "undead") quantize attack progress to fifths for a stiff look.
- Not done: spawn pop-in, per-family defeat dissolve, bat/bee/fish/worm/shroom alerts. Caterpillar leg wave and rabbit rebuild are phase 6b.
- test/mobsheet.js: WS=<attack|alert|hit|dead>:<FAMILIES key> STEP=0.06 CY=0.5 DIST=4 node mobsheet.js <abs html> <png> x human 0 side.

## 18.19.12: crawler legs, rarab hare (animation plan phase 6b)
- crawlerEntry: each leg is its own bone lL<i>/lR<i> parented to segment t<i>. poseCrawler drives a stance/swing cycle per pair with phase cyc + (5 - i) * 0.95 (head first), stance 62%, lift by z roll, slow idle shuffle when still.
- hareEntry now builds a rarab with meta.kind "rarab": bones hips, body, head, ear/ear2 L/R, legB/footB L/R, tail; no front legs. Toad still uses kind "hare" and poseHare.
- poseRarab: hop cycle from an.ph (air 58%, land 42%), body leans into hops, ears stream back, idle sway, nod and random ear twitches; crouch-spring attack, readying crouch, hit flinch, side flop on death. Stride 1.1. Added to SLOPE_KINDS and LOOK_KINDS; dispatch in models3d.js and menu4.js.
- mobsheet.js gained ACT walk (treadmill via an.lx, SPD env).

## 18.19.13: rod and gathering tool props
- models3d.js: buildTool(kind) makes pickaxe, hatchet, sickle and rod from primitives with plain Lambert materials (no outline). toolWant(v, e) picks the tool for the player only: rod while S.fish or within 0.8s of player.reelAt, otherwise a gather tool within 0.9s of player.gatherAt. placeTool(v, e) is called after placeWeapon in syncEntity; it parents the prop to handR, scales it in over 0.18s by weaponBodyK, and hides the weapon only when it is in hand.
- Rod hand rotation x = 2.45 (about 45 degrees forward and up with the fishing arm pose). The line is a thin cylinder and the float a half red, half white sphere with a stem, both children of v.group so they use group-local coordinates; float flies out after the cast swing (0.45-0.75s), bobs, dips and jitters on a bite, and reels in over 0.8s.
- Remote players do not show tools. Item-specific tool tiers are not modelled.
- test/evsheet.js: WS=work:fish (MODE=bite), work:gather:mining|logging|harvesting, work:craft.

## 18.20.0: sprint, victory fanfare, sky, play-time timers, collision, model fixes

**Sprint.** `CONFIG.sprintMul` (1.45) multiplies keyboard movement speed in `updatePlayer` while `S.keys.shift` is held and the player is not mounted. Touch and click-to-move are unchanged. Gait speed follows actual movement, so the run cycle appears on its own.

**Victory fanfare.** `victoryDef()` in `audio.js` builds the `UI_SYNTH.victory` note list: three-note pickups on E5 then F5 into held G5 and A5, a rising G-A-B run and a held C6 with chords and a bass note. A new `"brass"` voice type in `uiSynth` uses a sawtooth, low-pass filter and a sustained envelope (attack, hold to 60% of the note, then decay). `sfx("victory")` ducks the music for 4.2 s. It is called at the end of the mob kill handler in `game.js` when the kill gave experience (`xp > 0`) and no other living mob in combat has any party member on its enmity list.

**Sky.** `W3.sunDisc` is a solid sprite (`sunTex`) placed 880 units along the sun direction, tinted toward orange by the `golden` factor and faded by weather gloom. The moon sprites now use the unclamped opposite of the sun direction (`moonSky`) and fade in through `moonUp` as they clear the horizon, so the moon sets and rises instead of sitting at the horizon. The clamped `moonDir` is still used for night lighting only. Moon disc scale 50, moon glow 110.

**Play-time timers.** City Blessing is `save.blessEnd` and meals are `save.food.endSec`, both in `save.playSec` seconds (play time only advances in `step`). `migratePlayTimers()` converts old wall-clock `save.blessing` and `save.food.until` the first time they are read. `blessLeft()` and `foodLeft()` give seconds remaining. Combat buffs already ran on `S.time`.

**Status popups.** `statusPopTick()` in `hud4.js` owns the `#stPop` element and a capture-phase document click listener. Status icons carry `data-st` keys (`bless`, `food`, `b:<buff>`, `rest`); `statusInfo(key)` returns name, seconds left and a description, and the popup text is refreshed each HUD update.

**Menu arrows.** `KB_SEL` in `menu4.js` adds `.item[data-a]` rows to the keyboard-navigable set, so the auction house, forge, guild and similar windows work with arrow keys. The highlighted row's `data-hv` item drives the side card and help line. `.item.kb` gets the same outline as buttons.

**Companion arrival.** `arrivalSpot(i, x, y, face)` places companion `i` at `CONFIG.arriveGap` (95) plus 24 per pair, behind the player and fanned 0.45 rad to each side; if that lands within 50 units of a zone edge it uses the front instead. Used by `enterZone` and warp stones, followed by `keepInZone` and `keepOutOfColliders`.

**Collision.** In `world3d.js` every large rock now adds a collider (radius 0.85 of its visual radius; before, only rocks with scale above 1.3 did) and outer stalagmites add one (0.7 of base radius). Pebbles (small rocks) still do not block.

**Models.** Bee eyes (`beeEntry`): radius 0.04, 12 segments, centred on the head surface, plus a highlight ball. `quadEntry` has a `slim` mode: the torso is a `gSweepZ` loft (`TORSO` ring table) with a tucked waist and deeper chest, shoulder and haunch balls on the leg bones, thicker upper legs and thin cannon bones with a knee ball. Deer, dog and cat use it with narrower `bodyW`. Pipkin gait: `RACE_GAIT.pipkin.leg` 0.6 scales thigh and knee swing and the Pipkin stride is 1.3 (was 0.85), so legs step less often and swing less.

## 18.21.0: payload trim and load timing
- build.mjs phase 4 minifies the game script with esbuild (`min: true`); dist/game.js stays unminified so test/harness.js keeps working. src/three-entry.js lists only the THREE names the code uses (regenerate the list with grep `THREE\.\w+` if new ones are added, otherwise it is undefined at runtime).
- Supabase bundle is embedded as `<script type="text/plain" id="supaSrc">` and evaluated on demand by `supaLoad()` in net.js (called from `netInit` and offline sign-in).
- PERF (view3d.js): boot marks, per-zone step timings, worst frame gap, `PERF.props()` floating-prop scan, `/perf` command. Numbers and findings in design/load-baseline.md.

## 18.22.0: start-up overlap
- Item icon atlas is built by `itemIconSteps()` (generator in icons.js) driven by `buildItemIconsAsync()` in about 10 ms ticks after `showTitle()`. `iconsReady()` is awaited in `loadZoneInner` before the zone is released, so item icons are always ready in the world. `buildItemIcons()` is the synchronous form for tools.
- `uploadTexturesAsync` calls `renderer.initTexture` for zone textures in 6 ms slices before compileAsync.
- Measured (SwiftShader headless): title at 1.7 s instead of 4.8 s; icons finish about 5.5 s. First draw after build still takes 5 to 10 s here: `renderer.render` spends it waiting for program links (programs build in 24 ms but link lazily in the driver). `compileAsync` only avoids that where KHR_parallel_shader_compile exists; cannot verify on a real GPU from the test rig. A per-material `renderer.compile(obj)` slicing was tried and gave no gain (reverted).

## 18.23.0: IndexedDB cache (Phase 3)
- src/cache.js: database `leidanav_cache_v1`, store `blobs`, records `{ v: CACHE_VER, t, blob, meta }`. CACHE_VER is `__PKGVER__` (replaced by the build), so any release invalidates everything; `cachePrune()` on open deletes other versions and keeps the newest 24 terrain (`t|` keys) and 2 icon (`i|` keys) records. Every call fails soft to null (private mode, quota, no IndexedDB).
- Terrain: key `t|<zoneId>|<size>` (`terrainKey()`, `terrainSize()` in world3d.js). `buildZoneAsync` reads it first and decodes with createImageBitmap into `W3.terrainPre`; `bakeTerrainAlbedoSteps` draws it into a canvas and skips painting. On a miss the painted canvas is stored as WebP 0.95 (PNG where WebP encode is missing) before `toTexture` posterizes it, so the hit path posterizes the same input.
- Icons: key `i|<count>|<first id>|<last id>`, PNG plus meta `{cols, rows, map}`. `iconsFromCache()` applies it through `applyIconAtlas` with a blob URL.
- Measured: return visit icons ready at 1.1 s (was about 6 s), terrain painting 1.5 s down to about 40 ms read. Rig atlas (buildAtlas, several float maps) is not cached.
- `/clearcache` empties the store.
- Any change to terrain painting or icon drawing needs a version bump (always true by project rule), otherwise old pictures would show.

## Plans index
- design/merc-loot-plan.md: mercenary loot, sale pouch, level sync, play-time contracts, Old Friends (not built).

## 18.24.0: walk-out and walk-in zoning (Phase 5)
- Edge exits (rect touching the zone border, not `kind: "door"`, no `ask`) go through `startExitWalk(ex)`: `S.exitWalk = { ex, a, t }`. `updatePlayer` auto-walks along `exitEdgeAngle` (input ignored), step skips `keepInZone` for the player, and after `CONFIG.exitWalkTime` (0.75 s) step calls `enterZone(to, tx, ty, { walkIn: true })`. In builds without view3d (`zoneFadeOut` missing) it enters at once, so tests keep their old behaviour.
- `enterZone` with `walkIn` sets `S.walkIn = { a, t }` when the target is within `CONFIG.walkInEdge` (700; exit targets sit 220 to 640 from an edge) of an edge; the player faces inward and companions are placed behind by `arrivalSpot`. Step does not run while `VIEW.loading`, so the walk-in starts when the loader hides and lasts `CONFIG.walkInTime` (0.9 s).
- Fade: `#zfade` (fixed, z 31, created on demand). `zoneFadeOut()` fades it to black in 0.45 s and sets `VIEW.fadeIn`; `onZoneEntered` fades it off in 0.2 s to reveal the loader; `loaderHide` sets it black instantly, hides the loader and fades it out in 0.6 s.
- `prefetchZone(id)` starts the IndexedDB terrain read for the target during the walk; `buildZoneAsync` uses `W3.terrainFetch` when the key matches.
- Not done from the plan: building the next zone during the walk. The zone build tears down the current zone (`W3.zoneRoot`, `W3.field` are global), so it would need a second scene root. The black fade hides the stall instead.

## 18.25.0: natural exits (Phase 5b)
- `footY(field, px, py, rw)` (world3d.js) returns the lowest ground height within a footprint radius; boulders, small rocks, outer stalagmites and cliff chunks use it instead of `heightAt` at their centre, so slope rocks bury their high side. Measured cause of the floating rock: large rocks centred on a steep slope overhung the drop.
- `exitMask` now meanders: inward from `into` 50 to 200 units the lane centre shifts by fbm noise up to 0.35 lane widths, the lane varies about plus or minus 35% in width, the lane edge is jittered by noise and the transition widened from 50 to 125 units (sloped sides). The mouth at the zone edge stays straight so it lines up with the exit rectangle and the path. `ex.lane` and `ex.hall` keep their meaning.
- `buildExitBackdrops` adds a 520 x 150 plane (fogged, transparent) 1500 zone units beyond each edge exit with a three-layer ridge silhouette canvas texture tinted from the destination's `TERRAIN_THEMES` palette (cached per palette in `EXIT_TEX`). It is not generated from the destination's terrain; that was the plan's idea and was judged too costly.
- Limits: exits still read as a hall between two slopes, only less so; the zone interiors beyond a hall are unchanged. Looked at on hollow, frost and outpost in a headless browser at midday and at night only.

## 18.26.0: release guard (Phase 6)
- `npm run check` (tools/release-check.mjs) builds phase 4 and fails if index.html is over 6.2 MB, the title screen appears later than 3.5 s (headless, software GL) or the second load does not use the icon cache or has icons ready later than 2.5 s. `--write` appends the row to the "Release history" table in design/load-baseline.md (replaces the same version); `--no-browser` checks only the size. Run it with `--write` before each release; budgets are the constants at the top of the file and should be tightened when numbers improve.
- Config > Interface > Load timings (`UI.perfShow`, action `perfshow`) lists `PERF.table()` inline; same data as `/perf`.

## 18.27.0: treasure pool for everything, companion bags (M1)
- `lootGive(id, mates)`: with a party (S.party longer than 1, or online mates) every mob drop goes to `addToPool`, otherwise `giveItem`. Used by `dropLoot` (except key items and crystals, which keep their direct rules), `gearDrop` and scroll drops. Other sources (gathering, fishing, quest rewards) are unchanged.
- Companion bag: `save.mercInv[id] = [{ id, qty, sale: true }]`, `CONFIG.inventorySize` slots, helpers `mercBag`, `mercBagRoom`, `mercBagAdd`, `mercBagCount`. `mercWants(merc, itemId)` is the lot rule: false for gear they cannot wear (`mercCanWear`) or with no room; true otherwise (replaces `poolUpgrade` as the lot test).
- Winning: a wearable upgrade (`poolUpgrade`) is put on and the old piece goes to their bag (or to the player if the bag is full); anything else goes to their bag. Nothing goes to the player any more.
- `mercTownSell()` (called from `enterZone` after the zone is set): in a `theme: "town"` zone, a hired companion whose bag has at least half of `CONFIG.inventorySize` slots used loses the whole bag, as if sold to a shop; no crystals are paid. M5 will turn these into market listings.
- The old rule that companions only lot on upgrades and send replaced gear to the player is gone. Tests in p10unit.js updated.
- design/online-queue-plan.md: 20-player online cap and wait queue (not built).

## 18.28.0: companion level sync, plain gear, kill-only bestiary (M2)
- `mercFee(id, lv)`: generated mercenaries' fee is recomputed from the player's current level (same formula as `genMercDef`); fixed mercenaries keep `MERCS[id].fee`. `hireMerc` charges it, stores it on the def and records `save.mercHireLv[id]` (used by M4 wages).
- `gearScore(id)`: item level x 1000 + damage + summed stats; used to rank kept gear.
- `mercSync(id, lv)`: run from `syncAllies` and `rebuildParty` before `mercGearFor`. Worn pieces (`save.mercGear`) above `lv` move into the bag as `{ sale: false }` (allowed to exceed 30 slots). Kept items at or below `lv` go back on if they beat the effective slot (`mercGearFor`), the displaced own piece becomes for sale; kept items that are no longer an upgrade (or not for the job) become for sale.
- `autoGear` was already plain (shop, not HQ); M2 only tests it.
- `mercTownSell` sells only `sale` entries and keeps kept ones (M1 bug fix); the half-full threshold counts all bag entries.
- Bestiary: `noteBeast(m, false)` no longer creates entries, only a kill does; `normalizeSave` drops entries with zero kills.
- Tests: test/m2unit.js (sync down/up, kept items, fee, plain gear, balance table at 1/10/20/40/60, bestiary). p7unit and p12unit updated (bestiary rule, meals on play time).

## 18.29.0: companion sheet, pouch and shop (M3)
- Clicking a companion row in the party box (hud4.js `buildParty`) sets `UI.mercSheet = id` and opens the Party tab; `tabParty` renders `mercSheet(id)` (menu4.js) while it is set. Actions: `msheet` (open/close), `mbuy` (`id:index`), `mgive`, `mtake`. `companionInfo` (wage prompt) is no longer reached from the row; M4 will replace it with the payment prompt.
- Pouch: `<span class="pouch">👝` in each party row, shown by `updateParty` when `mercForSale(id) > 0`.
- `mercSalePrice(itemId)` = round(`marketPrice` x 1.5), min 1. `buyFromMerc(id, idx)` checks crystals, rare ownership and bag room, moves one item.
- `mercUpgrade(id, itemId)`: wearable and `gearScore` higher than the effective piece (`mercGearFor`). `giveMercGear` hands the item back with a log line if not an upgrade; otherwise equips it and puts the old effective piece in the companion's bag for sale (or into your bag if theirs is full).
- Tests: test/m2unit.js (buying, pouch, give rules), p7unit.js updated.
- design/job-unlock-plan.md: job unlock tree (not built).

## 18.30.0: contracts, rising wages, Old Friends (M4)
- Data: `save.mercContract[id] = { endSec }` on `save.playSec`; `save.oldFriends[id] = { left, hall: "outpost", lv, fee }`; `save.mercWageSeen[id]` (last announced wage); `save.mercHireLv[id]`. `save.mercPaid` is emptied by `migrateMercContracts` (hired companions get a fresh hour). COMPANION_CFG: `contractSec 3600`, `gearWage 0.02`, `hqWage 0.05`, `bribePerLv 100`, `wageRate 1`.
- Wage: `mercWage(id, lv) = max(10, ceil(mercLevelBase x wageRate x (1 + mercGearAdd)))`. `mercLevelBase`: daily (generated) companions use `mercFee(id, lv)`; fixed ones scale `fee x lv / hireLv`. `mercGearAdd`: per own worn piece at or below lv, 2% x max(1, item lv - plain piece lv in that slot) + 5% if HQ. Plain gear adds nothing, so a fresh hire's wage equals the fee. Guessed numbers, open for balance.
- `tickWages` (every 2 s from the landmark timer): migrates, announces raises, then if `mercPayDue()` and `mercPayReady()` (alive, `!partyInCombat()`, no exit/walk-in, no modal or dialog, `zoneCooldown` 0, no synth, loader off via `zoneLoadingOn()`) calls `mercPayPrompt(id)` (hud4.js; Pay/I can't pay/Refuse, no Never mind). Re-asks at most every 20 s if the dialog is dismissed. Without the UI (tests) it pays automatically.
- `mercPay(id, pay)`: pays and extends from max(end, now), or calls `mercLeave(id)`, which records the Old Friend and keeps defs, gear, bag and bond. `mercPool` day rollover and `offers` skip Old Friends.
- `mercBribe(id)` = stored fee + 100 x player level. `rehireFriend(id)` checks party room and crystals, rehires at the current level with a new contract.
- UI: Party tab contract line with Pay now (`mpay`), Brann window "Old Friends" section (`rehire`). `companionInfo` removed.
- Fix: `addBond` used `MERC_PERSONAL[id]`, which daily companions don't have; now falls back to `MERC_PERSONAL_GEN`.
- Tests: test/m4unit.js; p7unit.js updated.

## 18.31.0: per-town auction stock (M5a) and Old Friends cap
- `ahTowns()` = zones with `theme: "town"` and a house of `type: "auction"` (cached in `S.ahTownList`). `ahHere()` = current zone if it is one, else the first. `ahTownName(z)` = zone `city` or name.
- `ahDaily(town)` caches `S.ahDay[town]`; seed `ahdaily:<town>:<group>:<day>`. `ahMarketSet()` is the union used by the Buy list. `ahStockAt(id, town)` seeds `<id>:<town>:<day>` and subtracts `save.market.bought.t[town][id]`; `ahStock(id)` sums all towns; `ahStockLines(id)` feeds the item card.
- `save.market.bought` is now `{ day, t: { town: { id: n } } }`; any older shape resets on the first read (`ahBoughtOf`).
- `ahBuy` takes from `ahHere()` first, then the other towns in zone order. Prices are global (`marketPrice`), unchanged.
- `COMPANION_CFG.oldFriendsMax = 8`; `mercLeave` drops the entry with the smallest `left` and frees its generated def.
- Tests: test/m5aunit.js (towns have a house and an auctioneer, own rotation, per-town counts, migration, cap).
- M5b will merge player and mercenary lots into the same list; the Buy list is still town-stock only.

## 18.32.0: one market list (M5b)
- `AH_KINDS` (data.js): town 🏛 gold, player 👤 green, merc ⚔ violet, with labels.
- `marketLines(id, online)` returns the sellers for one item sorted by price per item: town lines from `ahStockAt` per town, local lots from `save.market.local.lots` (`{ id, qty, price, kind, seller, owner }`, M5c will fill it), and online lots (`kind` defaults to player; `merc_name` shown for mercenaries). `marketItems(online)` is the union of items to list. `ahBuy(id, qty, town)` buys from one town; `ahBuyLocal(i)` buys a local lot (pays the price, removes the lot; proceeds to the seller are M5c work). Online lots still buy through `netAhBuy` (`pmbuy`).
- UI: the Players tab and `pmView` are removed. `tabAuction` Buy view has the Show filter (`UI.ahSrc`, action `ahsrc`), per-row kind counts and minimum price, and `ahDetail` lists the lines with a coloured left border. Online lots load through `pmLoad` when the player is online.
- `normalizeSave` filters `save.market.local.lots`.
- Tests: test/m5bunit.js.

## 18.33.0: offline market, town buying, companion lots (M5c)
- `save.market.local = { lots, lastTick, lastSale, seq }` (`marketLocal()` creates it). Lots: `{ id, qty, price, kind: "merc"|"town", seller, owner, merc|town, t, seq }`.
- `mercTownSell` now consigns each for-sale bag entry with `mercConsign(id, entry)` (market price x qty, no fee, `ahTradable` only, cap `AH_CFG.mercLotCap` 300 merc lots). Untradable or over-cap entries are deleted (sold to a shop for nothing).
- `tickTownBuying()` runs from the 1 s auction tick on play time: every `AH_CFG.townBuySec` (1200) each town calls `townBuyOnce(town)`, capped at `townBuyMaxSteps` (36) steps per catch-up. `townBuyOnce`: player listings (`save.market.listings`) first, then merc lots; only lots with unit price at most `townBuyCeil` (1.25) x market. `townPick` rotates sellers by `lastSale[seller]` (never paid first) and takes the seller's oldest lot (player listings by creation time, merc lots by `seq`). Town relistings are never bought.
- Player listing sale pays gil at once (as before); merc lot sale pays the delivery box via `townPayBox(gil, note)`. Box entries can now be `{ gil, note }`; `ahCollect` adds the crystals, `normalizeSave` keeps them.
- Relist: `Math.random() < relistChance` (0.25) adds a town lot at `ceil(price x 1.03)`; never expires, buyable via `ahBuyLocal`.
- `ahBuyLocal` on a merc lot pays its price into the box (you are the owner offline).
- The random `tickAuction` sale of player listings is unchanged and still runs alongside.
- Until M5d, online players use the same local market too (nothing is sent to the server).
- Tests: test/m5cunit.js.

## 18.34.0: job unlock tree (J1)
- Starting jobs: Warrior, White Mage, Black Mage, Thief (from 18.34.3) (the non-advanced ones).
- JOB_REQ (data.js) maps each of the 19 non-starting jobs to required job levels; JOB_FLAVOUR holds Tobin's lines. jobReqMet(sv,j) checks levels reached.
- checkJobUnlocksIn(sv) sets sv.jobsUnlocked and returns the new ones; used silently in normalizeSave (no popups on load). checkJobUnlocks() runs after level up and every 4th landmark tick, logs a line and queues save.jobPopups.
- jobPopupTick shows queued popups via gameConfirm (tag jobpop, no No button) only when calmNow() and no confirm is open.
- giveReward no longer unlocks jobs. questOfferable hides quests whose reward.unlock job is locked; Tobin's PLD/RDM offers are guarded by jobUnlocked. Quests are now post-unlock initiations giving first weapons.
- tabJob skips locked jobs; mercLockedReason says "Unlocks as you learn more jobs"; setJob refuses locked jobs.
- talkTobin: "Why do I have to unlock jobs?" and "How am I doing?" (jobProgressHint, never names jobs).
- Tests: j1unit.js; older tests pre-unlock jobs.
- 18.34.2: mercenary hiring follows jobs. genMercDef picks only unlocked jobs, mercAvailable requires jobUnlocked(MERCS[id].job) for generated and named companions, mercPool hides locked-job offers unless hired, the old hall list skips locked non-hired companions.
- Achievements: unlock_<JOB> for each JOB_REQ job, jobs_bronze/silver/gold (6/12/18 open jobs) and jobs_all, via jobsOpenCount (data.js after ACHIEVEMENTS).
- 18.34.3: Thief is no longer advanced and has no JOB_REQ entry, so it starts open (WAR, WHM, BLM, THF); no unlock_THF achievement.

## 18.35.0: online market (M5d)
- SQL: sql/m5d-market.sql (schema 7) and sql/m5d-item-ref.sql (generated by `cd test && node genrefs.js`, also writes sql/m5d-run.sql). build.mjs bundles setup.sql + both into SETUP_SQL for Admin → Copy setup SQL. NET_SCHEMA = 7.
- ah_listings gains kind (player/merc/town), merc, merc_name, town; seller/seller_owner nullable (town lots). Merc and town lots expire 'infinity'.
- game_private.ah_item_ref(item, price): base ITEMS price, the server's value for town ceilings (1.25x) and merc lot prices (price x qty). Rerun genrefs.js and the SQL when items are added or repriced.
- public.ah_consign(my_char, merc, merc_name): takes all sale entries from data.mercInv[merc], lists those with a ref (cap 300 open merc lots), the rest are gone; saves the bag; returns {listed, gone, bag}.
- public.ah_market(): member only, runs game_private.ah_town_tick() (advisory lock, at most once a minute via ah_clock, per town 20 min steps from ah_towns.last_buy, cap 36) and returns open lots.
- ah_town_pick(kind) picks by oldest ah_seller_sale.at per seller key (player:<char> / merc:<char>:<merc>), then oldest lot; ah_town_buy marks sold (buyer_name = town), boxes the crystals ('sold', note "Town" or "Town (Merc)"), 25% relist at ceil(price*1.03).
- ah_post counts only kind='player' lots; ah_expire only player lots; ah_buy skips seller box for town lots.
- Client: netAhList uses ah_market, falls back to the old select when netMissing; netAhMine reads kind/merc_name; netServerOp(fn,args,apply) applies the returned merc bag before saving; netMercConsign; mercTownSell → mercTownSellOnline when netMarketOnline(), falling back (NET.market=false) to mercTownSellLocal.
- marketLines marks town daily stock with stock:true; the Buy UI uses l.stock (not kind) to choose town-stock buying, so relisted town lots buy as lots.
- Tested against local Postgres 16 with auth stubs (fresh install, upgrade, rerun, town tick order, relist, box payout). Tests: m5dunit.js.

## 18.35.1: pet button and pets off the bag
- hotbar() (hud4.js): characters with a pet get a one-time (hb.petV2) move of the Pet command to the first free slot of page 0 (command bar 1); if page 0 is full it falls back to any free slot. learnBuddy resets hb.petV2 for the current job so a new pet re-places the button.
- giveItem: a kind "pet" item that is not already owned calls learnBuddy and returns true without adding to the inventory, so pet items never take a bag slot. A duplicate is handled as a normal item. Test: pet1unit.js.
- 18.35.2: MAIN_CMDS page 1 gains ["Pets", "pets"] after Map; mainCmdItems hides it until save.buddies has a pet.
- 18.35.3: normalizeSave turns unowned pet items in the inventory into learned pets (one item each, buddy defaults to the first pet); Pets is always in MAIN_CMDS page 1.

## 18.36.0: server places, waiting line, idle log-out (Q1)
- SQL sql/q1-seats.sql (schema 8, bundled into SETUP_SQL after the m5d files): config max_online (default 20, 0 = no limit), game_private.seats(player, since, beat) and game_private.queue(player, joined, polled).
- public.queue_join(): member only; advisory lock; drops seats with beat older than 120 s and queue rows not polled for 30 s; admin or cap 0 = play without a seat; a seated player refreshes beat; otherwise joins/refreshes the queue and takes a seat when the number ahead (by joined, player) is below the free seats. Returns {state play|wait, ahead, online, max, queue}. Used both for the first join and as the 30 s seat heartbeat.
- public.queue_leave(): drops the caller's seat and queue row (sign out, idle log-out, Leave the line).
- public.has_seat(): admin, cap 0 or a fresh seat. Added to characters RLS (select/insert/update/delete) and to game_private.my_char, so loading, saving and every market/trade/linkshell RPC need a place.
- Client net.js: netQueueJoin (missing function or non-object reply = no queue, NET.queueOff), netQueueLeave(keepalive), netSeatStart (5 s timer, netSeatTick every NET_CFG.seatBeat 30 s; a 'wait' reply = netSeatLost: sessionStorage usr_requeue + reload, which skips the mode screen back into the line), netIdleTick (VIEW.settings.idleMin 5..60, default 30; warning gameConfirm tag idle at 60 s left; netIdleLogout saves, flushes, leaves the queue, sets sessionStorage usr_idle and reloads to the mode screen with the note). UI.lastInput is set by capture listeners in main4.js.
- main4.js: openRoster → queueGate (polls every 5 s, showQueue screen with #position and Leave the line) before loading characters.
- Config → Online (menu4 tabSettings, action idlemin) and the Network box #ffNetOn show NET.online.
- Tested on local Postgres 16 as role authenticated (cap, FIFO, leave, 120 s timeout, admin exempt, RLS blocks reads/saves without a seat, cap 0) and in Playwright with a mock server (queue screen, seat, idle warning and log-out, seat loss).
- 18.36.0 also: petToBag(id) / petItemOf(id) (game.js) and the Pets window's Unequip to bag button (action petbag): dismisses, removes from save.buddies, unequips and pushes the pet item directly into the bag (bypassing giveItem, which would re-learn it). Pets without an item (ash_sprite) can't be unequipped.
- 18.36.1: netIdleTick uses NET_CFG.selectIdleMin (15) while !UI.started (character select/creation, seated online), else the Config setting; netIdleLogout(min, sel) words the note accordingly.

## 18.37.0: login log (admin)
- SQL sql/q2-logins.sql (schema 9, bundled last): game_private.login_log(player, email, char_name, started, last_seen, ended, reason), kept 30 days. login_touch(me) opens or refreshes the caller's open session and closes any not seen for 120 s as 'timed out'; it is called from queue_join on every 'play' reply (first join and the 30 s heartbeat, admin included). queue_join is redefined here (supersedes the q1 copy). queue_leave() closes with 'logged out'; overload queue_leave(why) accepts logged out / signed out / idle / idle at character screen / left. public.session_char(name) records the character played (only the caller's own). public.admin_logins(lim) is admin only.
- Client: netQueueLeave(keepalive, why) (falls back to the no-arg call), netSessionChar in netTick, netAdminLogins; Admin tab adminLoginsHtml after Online now, refreshed by Refresh.
- 18.37.1: #pool gets a max-width 720px rule after the desktop right-side placement (which pushed it off the left edge on phones): left-aligned above the compass, width capped to the screen, scrolls if long.


## 18.38.0 Walking flower bulbs (H0 of design/humanoid-job-plan.md)
- New rig kind `bulb` (rig.js `bulbEntry(col, leaf)`, poses in anim.js `poseBulb`, dispatched in models3d.js, voice `v_creak` in audio.js). Bones: root, body, sprout, sprout2, legL, legR. Body is a round brown bulb with a papery tapered top, ridges, root hairs and two eyes; no arms.
- Families `sapling` (model bulb, tint brown 0x8a6238, tint2 leaf 0x6aa84a, scale 1.3) and `jungle_sapling` (tint 0x5e5a30, tint2 0x2e6b2e, scale 1.45) use it. Stats, loot and spawns unchanged. TP move renamed Leaf Lash to Sprout Lash.
- Pose: waddle (legs alternate, body rolls), sprout sways, attack rears the sprout back then whips it forward, readying shakes the sprout, hit squashes the body, death topples sideways with the sprout drooping.
- Elder Treant, Old Mossback and Rime Treant keep model treant.


## 18.39.0 Monster jobs (H1 of design/humanoid-job-plan.md)
- Data (data.js, before FEATURES): MOB_JOB_MODELS (goblin, orc, fishfolk, birdfolk, skeleton, ghoul), MOB_JOB_WEAPON (weapon type per job for weapon skills), MOB_JOB_STATS ([hp, att, def, eva+, delay] multipliers), MOB_CASTERS (jobs whose job big move is a spell), MOB_ABIL_BUFFS (self-buff abilities mobs may use; all already handled generically by stat() and swing()), MOB_ABIL_HEALS (chakra, healing_waltz: HP fraction), MOB_HEAL (cure fraction), MOB_DEBUFF (spell id -> [status, dur, pow]), MOB_BUFF (spell id -> buff key), MOB_RENAMED (removed caster families -> plain family, used by normalizeSave to merge bestiary kills).
- game.js: mobJobOk(f) (humanoid model, not nm/boss/summoned), rollMobJob() (all JOBS, WAR WHM BLM THF weight 1.5), mobSpellSpec(id, job), mobKit(job, lv) -> { spells (max 4: best heal, best nuke, random status/dot, random buff), abil, big (code "sp:<spell>" for MOB_CASTERS with a nuke, else "ws:<weapon skill>" with skill <= 5 + 3*lv), gap }, mobBigMove(m, code) ("f"/"" = family tpMove; ws mul = ftp[0] + 0.1; spell mul = (1.2 + 0.045*joblv)*1.3, no pDIF, element), mobMoveName(m), mobReady(m, t) (50/50 family vs kit.big), mobBuffPow(key, lv), mobUseAbility(m) (every 12-20 s, recast >= 30 s, heals only under 50% HP).
- buildMob(famKey, L, x, y, spawnIdx, jobWant): jobWant string forces a job, false forces none, undefined rolls when eligible. Mob gets job, kit, spells, castGap; job stats change maxHp, att, def, eva, delay.
- Mob casting uses m.spells/m.castGap (not fam.*). startMobCast: heal wounded self/any fighting mob in range 70%, else self buff 35%, else offense (nuke, status, dot); never Sleep on the player. finishMobCast handles heal, buff (120 s, pow from mobBuffPow, paeon ticks), status, dot (inflictStatus then tick = spell tick + lv/5 every 3 s), damage, drain.
- readying carries move; execTpMove uses readying.move, spell moves skip pDIF and draw a nuke vfx; BLU learning only from family moves. Interrupt texts, hud.js, hud4.js use mobMoveName.
- net.js mob snapshot rows add index 19 job and 20 readied move code; proxies build with that job (false when host sends none) and resolve the move with mobBigMove.
- Removed families: goblin_apprentice, den_conjurer, mire_hexer, frost_shaman, birdfolk_priest (spawns now goblin, den_goblin, mire_goblin, frost_goblin, birdfolk). scroll_stone 2% on den_goblin, scroll_blizzard 1.5% on frost_goblin. rig.js still has look entries for the old keys (unused; H2 replaces looks).
- Tests: test/h1unit.js; p56unit and p24unit updated.


## 18.40.0 Monster job looks (H2 of design/humanoid-job-plan.md)
- rig.js `jobMobLook(L, e)` runs in buildEntityRig after familyLook for any human-kind mob with `e.job` that is not nm/boss. It reuses the player job outfits: `JOB_STYLE[job](jobStyleTier(lv), JOB_TINT[job])`, clears JOB_STYLE_SLOTS from the family look and lays the job outfit on top, keeping the family body (skin, ears, tusks, beak, crest, skull, prop, eyes).
- Birdfolk, fishfolk and skeletons stay barefoot (boots, shoes, greaves removed); skeletons keep bone legs unless the outfit has legs. Crested birdfolk get a cap instead of a helm, kabuto or winged helm.
- `mobPalette(e)` tints clothing 32% toward a home colour: frost_/ice_/rime_/glacier keys pale blue, mire_/bog_ swamp green, drowned and fishfolk sea-dark, birdfolk sand, skeleton faded grey, ghoul dark. mobVariant shades the top colour (variant 1 darker, 2 lighter).
- `mobGearFor(job, lv)` (cached per job and level) picks the highest-level non-HQ main weapon of MOB_JOB_WEAPON[job] at or under the mob level, plus a shield for PLD, and builds weapon and shield looks through lookForGear. h2h jobs (MNK, PUP) carry nothing. Mobs whose family has `range` keep the family weapon (bow or rocks).
- Rig cache keys include the whole look (stableKey), so each job and tier is its own cached entry.


## 18.41.0 Monster pets (H3 of design/humanoid-job-plan.md)
- data.js (end): MOB_PET_JOBS (SMN Spirit, BST Familiar, PUP Puppet, GEO Luopan), ZONE_ELEMENT (palette or theme -> element; zone `element` overrides, The Mirage = lightning), MOB_PET_EL (element -> display name, PETS key for colours and pact, opposite element), generated FAMILIES pet_<element> (model "wisp", summoned, mobPet, no loot, hpMul 0.55, tpMove = PETS pact mul 1.6 with element, weak to the opposite element 1.3). MOB_ROLLS (COR phantom_roll -> valor_roll, hawk_roll -> hawk_roll, pow table by d6).
- game.js: zoneElement(z), spawnMobPet(owner) (only from spawnMob, so host only; builds pet at owner level - 1 with no job, sets pet.petOf / owner.pet, name "<Element> <Spirit|Familiar|Puppet|Luopan>"), petStep(m, dt) (runs before idle logic: despawns if owner gone, home follows owner, leaves combat when owner does, follows owner when idle or returning).
- aggro() also aggroes owner.pet and pet.petOf. onKO: owner KO despawns its pet ("fades away"); pets never call killRewards.
- mobUseAbility: COR rolls d6 and gives the buff (90 s) to itself, its pet and fighting packmates of the same link group within 220. swing() already reads valor_roll and hawk_roll pow.
- rig.js: mobLook model "wisp" -> kind wisp (col tint, col2 eye), drawn with wispEntry (meta kind bat, uses bat pose).
- Online: the host spawns pets; proxies see them as ordinary pet_<element> mobs named by family ("Water Spirit"), without the owner link.
- Tests: test/h3unit.js.

## 18.42.0 Know your foe (H4)
- hud4.js: mob target window #tLv shows JOBS[job].name (not for pets); inspectText appends "It fights like a <Job>."
- game.js: rollMobJob(avoid) rerolls up to 4 times against jobs of living same-linkGroup mobs within linkRange*1.5 (packJobs(f, x, y), read at buildMob). noteBeast and scanBeasts add m.job to save.bestiary[k].jobs; menu4 dbBeasts prints "Seen fighting as".
- data.js MOB_JOB_STATS balance: index = sqrt((att/delay) * hp*(0.6+0.4*def)*(1+eva/400)); fighters 1.02 to 1.09, casters 0.8 to 0.92 (spells make up the rest). MNK and PLD were outliers: MNK now [1.05, 1, 0.95, 4, 0.88], PLD [1.12, 0.95, 1.15, 0, 1].
- Tests: test/h4unit.js.

## 18.43.0 Auction prices match the shops
- game.js marketPrice = ITEMS.price * CONFIG.shopMul * AH_CFG.shopRatio (1.5) * marketMult * (1 + press). The old cap of 95% of base price for items in shops (inShops) is gone, since the AH is now meant to sit above shop prices. AH_CFG.shopRatio in data.js is the knob. Conquest price changes are not included.
- Everything priced from marketPrice scales with it: town buy ceiling (townBuyCeil 1.25), merc lots, mercSalePrice (1.5x), the sell-screen suggestion.
- Known side effect: buying at a shop and listing at the auction house is now profitable (about 1.5x minus the 3% fee); limited only by 7 listings and the slow town buying rate.

## 18.44.0 Six vendors in every town
- data.js (after the SHOP build loops): VENDOR_ROLES (armorer, weaponsmith, tradesman, quartermaster, spellsmith, jeweler: item test, work pose, held prop, greeting), VENDOR_POOL[role] = SHOP + SHOPS.marn items with ITEMS.lv <= 5, not hq, not recipe, matching the role. Old SHOP items that fit no pool (recipes, lv 6 to 10 gear and scrolls, X-potions...) are pushed onto SHOPS.vela so nothing becomes unobtainable.
- VENDOR_TOWNS gives per-town names and spots for outpost, harbor, ironvale. NPC ids are v_<role>_<town> (tradesman: v_trade_<town>), model vend_<role> (looks in rig.js NPC_LOOK, held props in NPC_HELD), talk talkVendor, def field shop = role. VENDOR_WORK feeds anim.js idle poses. Positions pass through the later off-road pass, so final spots differ slightly from the table.
- game.js vendorStock(role, town): seeded shuffle by role, town and boardDay(), first 10, sorted by price. shopList("v:<role>") uses it with S.zoneId. The jeweler's pool only has 4 items at level 5 or less (shop-sold rings and necklaces); drop-only rings are not added.
- Pell removed (NPCS, zone list, look, tables). His quests (tour_outpost, herbs, silk) are now given by v_trade_outpost (Hale). The old Pell's Goods building is signed Market Hall.
- Storage bug: menu4 and hud4 tested S.zone.residence, a flag no zone has, so the residence always showed the read-only view. They now test S.zoneId === "residence".
- Tests: test/h5unit.js; p25, p5c and p6 updated for Hale.

## 18.45.0 Auction kiosks and town services
- Auction: NPCS auction_<town> (prop "kiosk", talk talkAuction, name "Auction Counter") replace corvin, selene and orla (defs, zone entries and rig looks removed). models3d.js propView builds the kiosk (counter, glass, red roof, lit gold sign, point light). Positions are the old auctioneers' spots by each auction building.
- TOWN_SERVICES (data.js, next to VENDOR_TOWNS): harbor and ironvale get job_<town> (model tobin_b, talkTobin) and stable_<town> (model ysolde_b, talkYsolde). They reuse the Tobin and Ysolde dialog code as is; model variants are copies of the originals with other skin or hair (rig.js, after NPC_LOOK). No home or sleep fields, so they never go indoors.
- talkTobin calls questOptions("tobin", n) with a literal id, so the extra job masters offer the same job quests as Tobin.

## 18.46.0 Smaller saplings, apart rabbit ears
- data.js: sapling scale 0.33, jungle_sapling 0.36 (was 1.3 and 1.45). buildMob radius now has a floor of 8 so the tiny bulbs stay targetable.
- rig.js bulbEntry eyes: flat white (y 0.5), small pupil, dark-bulb-colour upper lid ball and thin lower lid for a squint.
- Hare ears: the L bone leaned inward with positive z and the R bone with negative z, so the tips touched. anim.js hare poses (idle, hop, twitch, listen, hit) now use negative z for L and positive for R (outward). rig.js hareEntry ear geometry sits 0.01 to 0.015 further apart.

## 18.47.0 Treasure pool window style
- template4.html: #pool no longer has the glass class; override rules after the phone media rule give it the FF panel look (var(--ffStripe) background, var(--ffEdge) border, ffHead-style title, italic row text, gradient pill buttons; .pri uses the bright command gradient). hud4.js header is now <div class="ph"><span>Treasure Pool</span></div>. Position rules are unchanged.

## 18.48.0 Vela removed, strict vendor levels
- Vela (NPC, look, talk, zone entry) removed; her building is signed Outfitters Hall. SHOPS.vela remains as a data list; only its rings and necklaces feed the jeweler.
- VENDOR_SOURCE = SHOP + SHOPS.marn without hq. Every vendor pool is level <= VENDOR_MAXLV (5), except the jeweler: VENDOR_SOURCE_JEWEL (adds Vela's rings and necklaces) up to VENDOR_JEWEL_MAXLV (11), exactly 10 items. VENDOR_ROLES.jeweler.stock = 5, so he shows a random 5 of those 10 per day and town (vendorStock uses the role stock, default VENDOR_STOCK 10). Vendors with fewer than 10 at their cap show fewer. The spellsmith test is spell or recipe.
- Level data behind this: shop rings and necklaces are level 1 (4 items), 7 (4), 10 (1), 11 (1) and 14 (18). Level 7 gives 8, level 11 gives exactly 10 (no randomness), level 14 gives 28.
- Chapel Sigil, X-Potion, Hi-Ether, Super Ether and Reraiser are no longer sold by anyone (Chapel Sigil still drops from the Drowned).


## 18.49.0 Retired shop goods become drops and recipes
- Quartermaster pool (VENDOR_SOURCE) now also includes every non-rare food; 10 items total at level 5 or lower, so stock is always the same 10.
- Alchemy RECIPES added: r_x_potion (8), r_hi_ether (10), r_super_ether (13), r_chapel_sigil (12, bone_chip + reef_scale), r_reraiser (15), r_hi_reraiser (18), r_super_reraiser (22). Recipe scrolls rcp_<id> are generated automatically.
- Loot additions in FAMILIES: skeleton, ghoul, ice_wight, drowned, orc_stonechucker, royal_guard, crypt_sentinel, hollow_king (chances 0.03 to 0.3, higher for stronger items). Reraiser descriptions no longer say "Not sold yet".


## 18.50.0 Natural exits, low haze (exit phase 1 + part of phase 2)
- Haze cylinder (W3.haze) is world-anchored: buildExitBackdrops sets W3.hazeY = lowest ground height at edge exits; haze centre = hazeY + 40 (since 18.56.0), height 400, texture 1024 tall, clear above hazeY+70, 0.35 at +30, 0.85 at -10, opaque by hazeY-40. Falls back to camera y - 175 when a zone has no edge exits.
- exitMask lateral falloff widened from fixed 125 to lane-15..lane+spread, spread = 170 + fbm*230 (seed 527), with a softened curve; gives sloped, varying pass sides.
- cliffChunkGeo uses noisy icosahedra (scaled w, h*0.75, d) instead of boxes; noise 0.45 lateral.
- Waterfalls need steep terrain within 22-40 units behind the lake edge, no exit within 420 and exitMask < 0.05 along 160 units.
- Carts: exit clearance 420, exitMask <= 0.02, outsideE < -80. Big rocks: exitMask <= 0.1.
- poiSpot (camps, lookouts, shrines, tablets, caches): 260 from zone edge and 480 from any edge exit; all 20 POIs still place.
- Exit backdrop panels (exitRidgeTex planes 1500 out) are disabled unless CONFIG.exitPanels is set: they floated past the end of the terrain and read as floating slabs. Haze plus the BACKDROP hill rings fill exits now.
- BACKDROP hill rings now reach 400 below lowY so no sky gap shows under them through a pass (that gap made them look like floating slabs).
- BACKDROP ring silhouettes: N=384 points, height = 0.3 + 0.5*fbm(freq 3) + 0.35*ridge(freq 11) so the skyline through a pass is jagged rather than a near-straight line.
- Visual check tool: Playwright with test/mocklogin.js works again (scratch script teleports to each exit and screenshots).


## 18.51.0 Visitor counter on the title screen
- Counter lives in the FreeSpace 4X Supabase project (puiypjgnbqddudbfghuy), table public.leidanav_views (single row, RLS on, no policies) with security definer RPCs leidanav_bump_views() / leidanav_get_views() executable by anon. Migration name leidanav_views_counter. The game's own database and NET_SCHEMA (9) are untouched.
- Client (src/net.js): VIEWS state with its own anonymous client (viewsClient, no session persistence) using that project's publishable key; viewsTick() runs from showTitle(). Bumps once per browser per day (localStorage usr_views_day), otherwise reads; caches usr_views_last for offline display. Count animates up over 1.4 s. If the RPC fails and nothing is cached the panel stays hidden.
- UI: #ldViews in #loading (template4.html), bottom-right (raised to 58px above the bottom under 860px wide so it clears the centred credit line), only on the ready title screen. Uses --ffStripe / --ffEdge / --ffFont; light blue live, grey linking, red offline.


## 18.52.0 Visitor origins (globe plan phase 1)
- Server (FreeSpace 4X project, migration leidanav_visit_origins), modelled on the xw_* set there: public.ln_visit (id, ts, country default ZZ; one row per counted visit) and public.ln_device (day, device, views). RLS on, no policies; everything goes through security definer RPCs granted to anon: leidanav_bump_views() (inserts a row with public.request_country(), the existing cf-ipcountry helper, returns the total), leidanav_get_views(), ln_bump_device(p_device), ln_country_views(), ln_country_firsts(), ln_daily_views(n), ln_country_daily(n), ln_hour_views(), ln_device_views(n), ln_my_country(). The one earlier leidanav_views count was carried over as a ZZ row; leidanav_views is no longer read.
- Client: net.js viewsTick also calls ln_bump_device (mobile = hover:none + pointer:coarse) on the first count of the day. src/visitors.js (added to the phase-4 file list after net.js): VG_PLACES (250 codes with lat, lon and name, copied from the website for the later globe), VG state, vgFetch (all reads in parallel, cached 60 s), vgOpen/vgClose/vgRender. #vgWin overlay with tiles, 14-day chart, device bar, ranked country list (own country highlighted). A capture-phase keydown listener swallows keys while the window is open so Esc closes it instead of starting the game; showTitle's start handler also ignores input while VG.open.
- Flags are emoji; Windows shows them as letter pairs (the website embeds a flag font, not copied to keep size down).
- Phase 2 globe done in 18.53.0, phase 3 extras in 18.54.0.


## 18.53.0 Visitor globe (globe plan phase 2)
- src/visitors.js gains VG_SHAPES (country outlines, polyline-encoded, copied from the website), vgShapes decoder, vgRing (antimeridian-safe ring path onto an equirectangular canvas), vgHeat (deep blue -> cyan -> white), vgBake (2048x1024 canvas: navy sea, graticule with a gold equator, countries shaded by sqrt(views/max), selected country outlined gold).
- Globe uses the game's THREE build with its own small WebGLRenderer inside #vgGlobe: textured sphere, additive back-side halo shader, additive glow sprites per visited country (gold for ln_my_country) that pulse. vgVec(lat, lon) matches SphereGeometry UVs: phi = lon + 180, theta = 90 - lat.
- Controls: pointer drag (yaw/pitch, pitch clamped), wheel zoom 2..6.5, auto-spin after 2.5 s idle, tap (under 6 px of movement) raycasts the sphere UV to lat/lon and selects the nearest visited country within 12 deg. vgSelect(code) rebakes, eases the globe to face the country (vgFocus) and updates #vgSel; list rows (data-c) select too.
- vgRender keeps the existing canvas across re-renders (moves it into the new #vgGlobe, sets G.host); the loop reads G.host size. vgClose/vgGlobeStop cancels the loop and disposes the renderer and textures. If WebGL fails the globe area hides.


## 18.54.0 Visitor origins extras (globe plan phase 3)
- VG_POP (population in millions per country code, copied from the website); vgPopOf, vgPer (views per million), vgReach ("1 in N people").
- VG state adds cmp, cmpMode, arcs (default on), perCap. Toolbar buttons [data-vgt=arcs|cap] sit over the globe (.vgTools). perCap changes vgBake shading (sqrt(per)/sqrt(maxPer)) and vgRows order and the list values.
- Arcs: in vgPins, a THREE.Line per visited country along the great circle from ln_my_country (slerp, lifted by 0.08 + 0.12*angle at the middle) plus a gold sprite that travels along it each frame. three-entry.js now exports Line.
- vgFetch also loads ln_country_daily(30) -> D.cdaily[code][day] and turns ln_country_firsts into D.firsts. vgCard(code) shows visits, share, rank, per-1M, first/last seen, reach and an inline SVG 30-day sparkline (vgSpark). #vgSel shows one or two cards plus Compare / Clear. vgSelect: in compare mode the next pick becomes VG.cmp; picking a new main country clears cmp.
- Busiest hours: ln_hour_views is UTC; shifted by -getTimezoneOffset() into local hours, peak bar gold.
- #vgFind filters rows in place (no re-render, keeps focus); Enter selects the first visible row. The capture keydown guard lets keys through to #vgFind.


## 18.55.0 Rugged mountain passes (exit plan phase 2 finish)
- buildFieldSteps raw(): for the edge-mountain term, where 0.02 < exitMask < 0.995 a band weight sin(pi*min(1, em*1.15)) * sstep(-140, 40, outsideE) blends the height toward terraces (step = amps[2]*(0.16 + 0.1*value noise 531), soft riser via sstep(0.55, 1, frac)) at 55% and adds lumps (fbm 533 and ridge 535), only where the mountain is already over ~0.5 high. Result: ledges and bumps on pass sides, pass floor untouched.
- buildVegetation: pass boulders, 34 per non-door exit, placed within 450 of the exit centre where 0.12 <= exitMask <= 0.88 and outsideE > -160, off paths; sunk by footY minus 0.3*size, tilted slightly, with colliders. Uses the shared rock instanced mesh.


## 18.56.0 Distant hills through every pass (exit plan phase 3)
- buildBackdrop: gaps[] = one entry per edge exit (angle from the backdrop centre, floor height at the exit, distance). For each ring vertex a Gaussian window (width atan2(70, R - d/2) * (1 + 0.25*layer)) lowers the ring from its full height (which clears the tallest zone mountain) to gapFloor - lowY + hill*(0.35 + 0.25*layer) + 2 + 4*layer, so each layer's jagged skyline shows through the pass and the layers step back.
- Ring strips now have three rows (lowY-400, a foot row near the gap floor, top) with vertex colours 0.6 / 0.66 / 0.95, giving a darker foot and lighter top before the fog tint in updateBackdrop.
- Haze gradient softened (see the 18.50.0 note).
- Exit audit (Playwright, noon, 40 units inside each edge exit looking out): outpost, hollow, hollow_lake, hollow_ruins, harbor, frost, marsh, ironvale, sunscar, cinder, verdant, mirage, highlands, highlands_plateau, highlands_ridge. No floating props found. Caves and crypts have no outdoor haze or backdrop and were not shot. Scratch script: shots2.js in the scratchpad (args: zones, out prefix, distance back, pitch, camera distance, yaw offset); it sets S.timeShift to noon.

## 18.57.0 Racial starting clothes
- data.js after the Windower gear load: `RACE_GEAR_ALIAS` (old id to new id), the seven old shop ids are deleted from GEAR_DATA, `RACE_GEAR_ROWS` adds ten body pieces (`src: "race"`, `race: <RACES key>`, lv 1, DEF 2, price 70, jobs ALL). gear.js is untouched, so regenerating it with gear18.py stays safe; the old ids come back from the generator and are deleted again here.
- Pieces: human_vest / human_tunic, elari_jerkins / elari_bodice, ursan_surcoat / ursan_tunic, nekari_separates / nekari_tunic, pipkin_kaftan / pipkin_tunic (first = Warrior, second = mage).
- `src: "race"` keeps them out of everything keyed on shop or drop: the SHOP and Vela loop, GEAR_DROP_IDS and gearDrop, the generated g_ recipes, and autoGear (companions). `ahTradable` also rejects any item with `race`. They can still be sold to an NPC.
- `starterBody(race, job)` (RACE_START_BODY, RACE_MAGE_JOBS = WHM BLM RDM SMN SCH GEO count as mage) is used by createChar (overrides body after the old WHM/BLM kit) and by the character-creator preview in main4.js.
- `canEquip` returns "Only <Race> can wear this" when `it.race` differs from save.look.race. itemCard shows "<Race> only" instead of "All Races".
- `migrateRaceGearIds(d)` runs first in normalizeSave: if the save JSON holds an old id it rewrites every quoted old id to the new one (gear, bag, storage, merc gear, seen). A non-matching race keeps what it already wears.
- Tests: test/p62unit.js (starter body for 5 races x WAR/WHM/BLM, not in shops/auction/recipes, race lock on equip, old-id save migration). p5bunit's companion-gear check now expects Lisette's linen_robe only (its old `&&`/`||` mix passed on that branch anyway).

## 18.58.0 Racial trousers
- Same mechanism as 18.57.0 (`RACE_GEAR_ROWS` now carries a slot): five legs pieces, `src: "race"`, DEF 2, price 56: human_pants, elari_chausses, ursan_braguette, nekari_loincloth, pipkin_braccae. `RACE_START_LEGS` and `starterLegs(race)` (every race, every job) set `gear.legs` in createChar and in the creator preview.
- Removed from GEAR_DATA: elvaan_f_chausses, hume_slacks. `RACE_GEAR_ALIAS` maps them (and the renamed elv_m_chausses, galkan_braguette, hume_pants, mithran_loincloth, tarutaru_braccae) to the new ids; migrateRaceGearIds builds its regex from the alias keys.
- 18.58.1: the piece is "Ursan Braguette" (id ursan_braguette); 18.58.0 briefly had "Baguette", and ursan_baguette is aliased forward in migrateRaceGearIds. "Nekari Loincloth" is my reading of "mithran loincloth" (matches the other race renames).
- Tests: p62unit also checks starter legs for all five races, the fifteen pieces, and the legs id migration.

## 18.59.0 City gear
- data.js `GEAR_RENAME` (old id to [new id, new name]) runs after the race-gear deletes: it copies the GEAR_DATA entry (and its _hq entry if one exists, named "... +1") under the new id and deletes the old one. Renamed: windurstian_slops to city_slops, san_dorian_vest to city_vest, san_dorian_tunic to city_tunic, bastokan_harness to city_harness. Stats, jobs, lv 15 and `src: "drop"` are untouched.
- The renames are merged into `RACE_GEAR_ALIAS`, so migrateRaceGearIds rewrites old ids in saves (the regex is built from the alias keys, which is why that object now holds every id rename).
- Left alone on purpose: Kingdom Tunic/Vest, Republic Harness, Federation Slops (the other nations' pieces) and the older design/balance-18.x.md tables, which are frozen sim output and still show bastokan_harness.

## 18.60.0 City weapons
- GEAR_RENAME gained eleven weapons: san_dorian_sword to city_sword, san_dorian_bow to city_bow, windurstian_bow to city_bow_2 ("City Bow II"), bas_crossbow to city_crossbow, san_dorian_cesti to city_cesti, bastokan_axe to city_axe, bas_knuckles to city_knuckles, windurstian_staff to city_staff_2 ("City Staff II"), bastokan_scythe to city_scythe, windurstian_club to city_club, bastokan_staff to city_staff (Rare, NM, still in BATTLEFIELD.rewards, which now lists city_staff).
- Two pairs collapse to the same name, so the second of each pair got a "II" and a `_2` id. Rule used: San d'Orian first, then Bastokan, then Windurstian gets the plain name. Easy to change in GEAR_RENAME.
- Saves migrate through the same alias map (migrateRaceGearIds).

## 18.61.0 An empty bag
- newSave and createChar no longer give 3 potions: `inventory: []`. Existing saves are untouched (normalizeSave keeps what they hold). Tests that counted on starting potions give or buy their own; p5cunit's bones quest still pays potions as a reward.


## 18.62.0 Underwear
- rig.js `applyUnderwear(L, gear, on)` runs at the end of lookFor (both the job-style path and the early-return path). `on` is true only for the player, remote players and the Equipment preview (5th lookFor arg), so NPCs, mercs and mobs are untouched.
- Empty `gear.body` sets `L.top` to `{type:"bare"}` in skin colour with no sleeves, drops pauldrons, collar and cape, and sets `L.under.top`. Empty `gear.legs` sets `L.legs` to skin and `L.under.low`, drops greaves. Both empty also drops the belt. Gloves, boots and weapons are unaffected.
- `L.under.top`: bikini (women), bandeau (Pipkin women, `L.doll`), none for men. `L.under.low`: boxer (men), thong (women), brief (Pipkin women).
- humanEntry draws them as white cloth shells: boxer and brief are `shellOf(lowR)` plus the upper rings of each leg loft (boxer reaches 0.17 below the hip joint, brief 0.06); thong is a waist string ring, a front patch ball and a back string; bikini is two cup balls, a band ring and two neck straps; bandeau is one thick band ring.
- Job outfits (JOB_STYLE) still apply to every filled slot. Verified by screenshot only (no phase-1 test, rig is 3D-only).

## 18.62.1 Pipkin underwear
- applyUnderwear no longer special-cases `L.doll`: all women get bikini and thong. The bandeau and brief branches in humanEntry (and the brief leg shell) are now unused by the look code.

## 18.63.0 Turnip starters
- data.js `TURNIP_ROWS` adds turnip_sword (sword 5/2.28), turnip_knife (dagger 4/2.05), turnip_rod (club 3/2.88), turnip_staff (staff 4/3.66, from reference image). Jobs lists copied from the reference images; rod and staff share WHM BLM SMN SCH GEO. `src: "race"` plus `starter: true` keeps them out of shops, drops, recipes and autoGear; ahTradable excludes `starter`.
- `starterWeapon(job)`: WAR sword, THF knife, WHM rod, BLM staff, every other job still bronze_sword (unspecified, easy to extend via STARTER_WEAPON).
- createChar sets `d.gear = { main }` then body and legs, so no head slot. newSave default gear drops the cap. main4 STARTER_GEAR is built from starterWeapon.
- SETTINGS_DEFAULT.attire is now "gear" (show worn armor). Saved settings override it, so existing players keep their choice. Underwear logic applies in both attire modes.
- test/p63unit.js covers the starters, no helmet, exclusion from shop, auction, drops and recipes.

## 18.63.1 Turnip Staff stats
- turnip_staff set to DMG 4, delay 3.66, jobs WAR MNK WHM BLM RDM BST BRD SMN SCH GEO per the reference image (was guessed).

## 18.63.2 Three starting jobs
- createChar accepts only BASE_JOBS (WAR, WHM, BLM) and falls back to WAR; the creator UI already listed only those. STARTER_WEAPON dropped THF, so turnip_knife exists but nothing grants it. setJob never grants gear: it only moves gear the new job cannot equip back to the bag.

## 18.63.3 Thief starts again
- data.js `START_JOBS` = WAR, THF, WHM, BLM drives createChar and the creator job buttons (BASE_JOBS unchanged, still used elsewhere). STARTER_WEAPON has THF: turnip_knife again. Corrects 18.63.2, which wrongly limited creation to three jobs.

## 18.64.0 Connected shoulders
- rig.js humanEntry upper-arm loft: the first four rings changed from radius 0.022/0.044/0.055/0.057 (tuck 0.024/0.016/0.007/0) to 0.04/0.057/0.063/0.06 (tuck 0.052/0.032/0.014/0), so the arm top overlaps the torso shoulder rings instead of ending in a small cap. Weights unchanged (armW blends upArm and chest above shY-0.03). Arm rest pose and bones untouched; the natural gap below the armpit remains.

## 18.65.0 Stout Pipkin
- RACE_BODY.pipkin now leg 0.36, torso 0.34, arm 0.33, girth 1.18 (female 1.14), waist 1.12 (1.06), shoulder 0.15 (0.142), hip 0.085 (0.087), headR 0.2, neck -0.05 (was leg 0.34, torso 0.3, arm 0.3, girth 1.0/0.96, shoulder 0.125/0.118, hip 0.072/0.074). Limb radii scale with girth, so limbs thicken with it.
- rig.js `subdivRings(rings)` inserts one Catmull-Rom midpoint ring (fields y x z rx rz f b p) between every pair of loft rings. gLoft calls it when `RIG.loftSub` is set. humanEntry is now a wrapper that sets `RIG.loftSub = L.doll ? 1 : 0` around humanEntryBase and resets it in finally, so only Pipkin pay the extra triangles.
- Reference was a Tarutaru-style sheet: head about a third of height, thick short limbs, wide hips, chunky hands. Not yet done: neck scarf, boot cuffs, sleeve-length tops. The flat shoulder shelf where the torso top meets the head remains.

## 18.65.1 Pipkin head and legs
- humanEntry wrapper also sets HEAD_SCALE[0]=1.12 and [1]=0.96 for L.doll (default 0.87, 1.04) and restores both in finally, so Pipkin heads are wide and round; hair and ear code read the same array. Pip ears now start at hr*1.0 and end at hr*1.12+0.17 with base radius hr*0.3 (inner ear hr*0.16).
- Leg loft radii get `dk` = 1.2 for L.doll; RACE_BODY.pipkin hip is 0.1 (both builds) so thicker legs keep a gap. Still different from the reference: hair is a spiky cap rather than a smooth bowl, no boot cuffs, no baggy trouser shape.

## 18.66.0 Smooth bodies
- humanEntry wrapper: `RIG.loftSub = !L.skull && RIG.segK >= 0.37 ? 1 : 0`, so every non-skeleton humanoid gets Catmull-Rom midpoint rings (subdivRings) and gLoft uses at least 16 radial sides instead of 8 when loftSub is set. Low quality (segK 0.38) still qualifies; LOD entries (segK <= 0.357) do not. This removes the octagonal cross-sections and flat facets at shoulders and legs.
- Hand palm: the gBox block is replaced by a rounded gBall (0.034*hk, scale 0.5/1.05/1.15).
- RACE_BODY.pipkin: leg 0.26 (minimum: leg ring offsets in humanEntry need knee..hip about 0.18 apart or rings cross), torso 0.46, arm 0.42, girth 1.15/1.12, waist 1.1/1.04, shoulder 0.16/0.152, hip 0.115, headR 0.165. HEAD_SCALE for doll is 1.25 x 0.97 (default 0.87 x 1.04). Leg radius factor dk 1.35. Ears follow HEAD_SCALE[0].
- Target from the reference sheet: head ~25% of height, legs ~27%, torso+hips ~49%, arms to mid-thigh, round head wider than tall. Remaining gaps: smooth bowl hair, boot cuffs, baggy trousers, scarf.

## 18.66.1 Pipkin torso and legs
- RACE_BODY.pipkin: leg 0.2, torso 0.38, arm 0.38, hip 0.1, headR 0.15; leg radius factor dk 1.05; head profile cheek 0.14 to 0.03.
- Short bodies broke loft ring ordering (rings use absolute offsets from hipJ, spineY, chestY, shY). Fixes for L.doll only: `monoRings` drops upper-torso rings closer than 0.016 in y (upR0 to upR); the leg gets its own 8-ring list (hipJ+0.06 down to ank+0.01); the pelvis lowR rings below hipJ+0.01 are scaled rx 0.72, rz 0.85 so the crotch bulb stops intersecting the thighs (that intersection was the jagged edge at the top of the legs).
- If another short race is added, reuse these three guards instead of tuning absolute offsets.

## 18.67.0 Chibi Pipkin
- RACE_BODY.pipkin: torso 0.26, arm 0.24, shoulder 0.125/0.118, hip 0.088, girth 1.1/1.08, waist 1.0/0.96, headR 0.16 (leg 0.2 unchanged). Doll-only factors: arm ring radius ak 0.85, hand scale 0.62 (was 1.25, replaces every `L.doll ? 1.25 : 1`), leg radius dk 0.95, hipR and waistR times hsc 0.78, HEAD_SCALE 1.12 x 1.05 (near-spherical).
- monoRings is now direction-agnostic (abs gap 0.014) and also guards the upper-arm, forearm and wrist ring lists for L.doll. The upper torso rings above chestY are tapered for L.doll (rx times 1 - 0.38 t^2, rz times 1 - 0.25 t^2, t = height fraction from chestY to neckY) so no funnel forms at the neck.
- Bikini band ring moved to chestY - 0.04 at 0.156 * cx0 so it hugs the torso on every build.

## 18.68.0 Round Pipkin face
- Head profile pipkin jaw 0.64 to 0.1 (headRadial narrows the lower half by jaw*x^2, so a high value gave a V-shaped chin).
- humanEntryBase: `fl = L.doll ? 0.045 : 0` pushes the forearm, wrist, hand, finger and thumb bones and their geometry outward (`sw + offset + fl`, forearm at half), so short Pipkin arms hang clear of the thick thighs.
- chestY factor 0.62 to 0.5 of torso for L.doll (lower chest and bone); foot scale for doll 0.8 to 0.58; bikini band radius 0.122 * cx0 for doll.

## 18.69.0 Plump Pipkin
- Doll upper torso no longer reuses the human ring list. `dollUp` is a dedicated 7-ring loft (belt, waist at 0.93 hipR, bust at 0.9 hipR, mid chest and shoulders from sw 1.05/0.95, then two neck rings) passed through monoRings, so the back is one round surface. The earlier funnel taper and the flat panel at the upper back came from squeezing the human list.
- Doll female: hsc 0.9 (male 0.8), dk 1.02 (male 0.95), RACE_BODY.pipkin female girth 1.22, waist 1.3, hip 0.095; male waist 1.2. Waist ring radius is tied to hipR rather than the human waist taper, giving a round plump trunk.
- Wrists: for doll the last forearm-1 ring is scaled 0.92 and the forearm-2 rings 0.92, 0.82, 0.72, 0.70 so the forearm tapers into the palm (palm ball is 0.034 * hk).
- Feet: `fz` 0.7 shortens foot length for doll (the z positions of every foot ring and the toe ball).

## 18.70.0 Tidy town and slower fights
Rounding: every heal, drain, potion and restore amount passes through Math.round before it is applied or shown; cureAmount already integer.
Pace: CONFIG.combatPace 1.15 multiplies swingDelay for players, allies and mobs; TP per swing unchanged, so TP per second falls too; damage not changed.
Auction: auction_<town> is an NPC (model auction_clerk, talk talkAuction, work pose count) placed flush to the building front wall between the portico columns; desks removed. Positions outpost 724,1036; harbor 1088,366; ironvale 726,531.
Vendors: VENDOR_TOWNS.at order armorer, weaponsmith, tradesman, quartermaster, spellsmith, jeweler, spread by district.
Party UI: Party tab removed (TAB_ALIAS party to social). tabSocial prepends tabParty (companion sheet, stance, wages) and works offline. Party row click: setTarget plus tgtCmdOpen; allies (kind ally in S.party) get root items Magic, Companion (key details opens Social with mercSheet), Check, Cancel.
Swipe: document touchstart/touchend in hud4 init; from right 36 px edge, dx at least 70 left within 700 ms opens mainCmdOpen; swipe right closes root menu.

## 18.71.0 Auction house and menu tidy
Outpost auction building moved to (860,565) facing the market plaza (front y 610, clerk auction_outpost at 894,626); lamp (880,640) moved to (945,650); path (880,732)-(894,640) links it to the main road. Earlier spot (690,975) faced the y=1060 district wall: never place a south-facing front within a wall's 120 px.
Auction type: CITY_TYPES.auction has flag true and data rects carry flag #c9a227; front sign scale up to 2.1 and side sign 1.6 for type auction (world3d buildCityBuildings).
Auction tab: .ahBar filter rows, .ahBox with .ahHead and .ahRow (name, Lv, source counts, price), listing rows .ahLine (seller, amount, each, controls); My lots rows reuse .ahLine. Mobile (max 720 px) drops the source and each columns.
Target command list (#tCmd.list): menu window gradient with stripe, rows like inventory cells, selection is the blue highlight with white outline.

## 18.72.0 Calmer small legs, dogs and cats
anim.js: legRel(v) = human leg length (shin+foot bone lengths times scale) / 0.86, capped 1. runOf(v, spd) scales speed by 0.6 + 0.4 legRel before the run blend (used by strideEff, poseHuman, humanLegIK). strideEff(v, spd, ik): phase stride = max(leg-limited stride, nominal stride times 0.8 + 0.2 legRel), so short legs cycle near human cadence; ik true returns the leg-limited stride times 0.55 + 0.45 legRel for foot excursion (feet glide a little on Pipkin, accepted). Lift times 0.45 + 0.55 legRel. Humans, Elari, Ursan, Nekari unchanged (legRel 1).
Quads: phase stride floor S * 0.55; quadLegIK uses strideEff(..., true). meta.quad.digi (dog, cat): stride excursion cap 0.55 L (others 0.76), lift min(0.2 L, 0.02 + 0.22 D).
rig.js quadEntry o.digi (slim only): thick tapered upper leg plus shoulder or haunch ball, knee ball, shin as two tapers through a mid joint (hind: hock at y 0.3 L, z minus 0.1 L; fore: wrist at y 0.14 L), paw ball lighter than coat with three toe balls. Shin still ends at the IK foot point.
game.js tickAmbient: dog and cat pick a pace per trip: 70% walk (dog 26, cat 18 px/s), 23% trot (48, 32), 7% run (90, 60). Spawn speed was dog 90 (always gallop).
Tools: test sheet script for ambient animals lives only in scratch; gaitsheet.js uses THREE.GridHelper which the custom THREE build lacks, so use a textured plane.

## 18.73.0 Smoother heroes and softer faces
rig.js RigBuilder.weldNormals (in finish, after smoothJoints, before bakeShade): hashes every vertex position (2e-4 m grid) across all pieces and averages normals within 0.45 dot of each other, so coincident seams (loft UV seam, shell joins) shade continuously. Hard edges past about 63 degrees stay hard.
Arms (humanEntryBase): when upper arm, forearm and wrist share color and region they are one gLoft (rings up + fa1 + fa2, weights armW, wrist blend wrW); otherwise split as before. Non-doll heroes get a deltoid ball (0.056 gi, at shoulder minus 0.058) weighted upArm and chest by height and outward offset. Arm ring radii times 1.08 (ak), hands times 1.1 (bone pivots unchanged, small fist skew accepted).
Torso: bust 0.09 female, 0.03 male (was 0.16 / 0.08); female non-robe tops add two skin or top-colored breast balls on chest. Last torso ring at neckY + 0.012 radius 0.058 so it tucks inside the neck taper.
Faces: HEAD_PROFILES human1 jaw 0.47, chin 0.02, cheek 0.07, nose 0.13, long -0.02; nekari jaw 0.44 chin 0.04; other female builds jaw +0.06, chin times 0.4, long -0.04, cheek +0.02. gHead min 30 by 22 segments.
Face texture: FACE_WARP (warpLut density bumps, x centre 0.25 sigma 0.1 gain 2.6; y centre 0.53 sigma 0.15 gain 1.8) remaps headUV so the face gets about 3x the texels. paintFaceWarped paints each face at 4x into a reused transparent canvas, resamples through the inverse warp and composites (premultiplied source-over) straight into the atlas ImageData before putImageData. Never read the atlas canvas back (that path cost 8 to 11 s in software GL). Atlas build about 0.87 s vs 0.69 s before (swiftshader). Atlas mag filter is now Linear (was Nearest).
Underwear uses region plain and color e6ded2 (cloth region read as shiny metal).
Note: some gear names (Elvaan, Hume, Galkan, Mithran items in gear.js) use another game's race names; rename pending user decision.
Tools: hero sheets are rendered by a scratch script (studio scene, exposure 1, skinTone 1); modellab player check showed no new islands and gaps within 0.003 m of before.

## 18.74.0 Towns resell what they buy
AH_CFG.relistChance 0.5 (was 0.25), relistCap 40 town-kind local lots. game.js townRelist(l, town) pushes a kind "town" lot at price times relistMarkup (1.03); called from townBuyOnce (player and companion lots) and from tickAuction real-time sales (town ahHere()).

## 18.75.0 Visitor tracker on the standard package
Source of truth: vendor/visitor-tracker (the user's standard package, unchanged). tools/vtrack-gen.mjs generates src/vtrack.js: recolors CSS and JS (cyan to #9fd0ff, light cyan to #c8d0ff, magenta to gold #f1cf73, purples to game blues, near-black backgrounds to navy, green to #6fe3ff), swaps the monospace font for --ffFont (flag font first), appends overrides that make #vc-panel sit inside #ldViews with the old box look, injects flag font plus CSS as a style tag, puts the panel markup in #ldViews and the overlay at the end of body, and adds VisitorTracker.start (once) so counting starts from showTitle (autoStart false keeps supaLoad off the load path). Rerun node tools/vtrack-gen.mjs after any package or theme change; never hand-edit src/vtrack.js.
Backend unchanged (FreeSpace 4X project): the adapter maps the standard RPC names to the game's own set (bump_site_views to leidanav_bump_views, get_site_views to leidanav_get_views, get_country_views, get_country_firsts, my_country, get_daily_views, get_country_daily, get_hour_views, bump_site_view_device, get_device_views to the ln_ versions). ln_daily_views and ln_hour_views are sparse, so the adapter fills missing days (UTC, n up to 365) and hours with zeros. The site_ tables in that project belong to FreeSpace 4X; do not point the game at them.
Counting follows the package: once per tab session per local day (sessionStorage leidanav_vc_day), last count in localStorage leidanav_vc_last. Refresh every minute while the title is showing (isActive). Title start ignores clicks on #ldViews and input while #vg-overlay is open.
Removed: src/visitors.js, #vgWin CSS, old #ldViews inner markup and CSS, net.js viewsSet/viewsTick/viewsHtml/viewsToday (viewsClient and VIEWS url/key kept for the adapter). Page size +195 KB (flag font 105 KB).
Test: scratch Playwright script routes *.supabase.co and mocks the ln_ RPCs; desktop and 390 px phone checked, no page errors.

## 18.76.0 Per-race face and hair table
rig.js: HAIR_TONES (named hex colours) and RACE_FACE_HAIR[race][build] = array of 9 strings "style:colorA,colorB,colorC" (faces 1-8 plus barber-only face 9); null row for the missing sex of Nekari (female only) and Ursan (male only). faceHairEntry(race, build, face) returns { style, colors }. Styles are existing HAIR_STYLES names used as stand-ins until phases 2-4 add the new ones (plan in design/hair-race-plan.md).
Look fields: hairStyle (HAIR_STYLES index, stored), hairColor (palette index), hairCol (optional exact colour number, wins when present; absent on old saves). baseFromLook reads hairCol first.
main4.js: ccApplyFace(l, keepCol) sets hairStyle and, unless keepCol, hairCol = first face colour; ccFaceColors(l); Hair colour step shows data-hv swatches (face colours) then data-hc palette; choosing a palette swatch deletes hairCol. randomLook picks a face colour 70% of the time, otherwise a palette colour. CC_FACE_HAIR removed.
Old characters are untouched (no migration); companions and NPCs keep hairStyle and hairColor.

## 18.77.0 Human and Elari hairstyles (hair plan phase 2)
HAIR_STYLES appended (indices 16-30): shaggy, tousled, slickback, sweptlong, asymbob, slickbun, sidetail, layered, longshag, feathered, messy, crownbraid, flipbob, highbun, hime. Never reorder: saves store the index.
rig.js HAIR_DEF[style]: k (5 hairline offsets front to back, like hairEdgeFn K), fringe, blunt (flat bangs), vol (shell lift), fl/bl (front/back strand length scale), rough (length jitter), mess (random sweep), sw (front side sweep), asym (one side lower, + x side), back (slick: front strands skipped for |a| < 1.1, clump roots pulled toward crown), n (clump count), noClumps, tail (gets the hairTail sway bone), x (extra piece key).
hairStrand(st, k, a, front, clump) returns { len, sweep, lift } for gHairLocks (covered) and gHairClumps (bare); existing styles keep their old numbers.
hairExtras(R, HP, st, hc, hr, c, TB, covered) builds x pieces: slick/slicklong (7 strips over the crown, long back for sweptlong), long (hairLongBack), lowbun, sidetail (+x side, over the shoulder, sways), layers (15 shoulder strips), asym (curtain on the long side), feather (12 backward spikes, bare only), stray (one strand across the face), crown (22 balls around the head, bare only), flip (12 outward flicks), highbun (bare only, with tie), hime (long back plus two face-framing side locks). hairStrip chains tapers with joint balls. hairLongBack is the old long/wavy back.
Head-covered check: all 15 build under a cap with no errors; buns, crown and feathered spikes hide under hats.
RACE_FACE_HAIR now uses the new styles for Human and Elari (and Nekari 8/9, Pipkin female 5). Still stand-ins: Pipkin, Nekari and Ursan shapes (phase 3), beards, goatee, headbands, clips and paints (phase 4).
Tools: scratch hero.js mode head (front 1.5708, three 0.8, side 0.02, back -1.5708; camera H*0.95) for contact sheets; deletes look.hairCol so the palette index shows.

## 18.78.0 Pipkin, Nekari and Ursan hairstyles (hair plan phase 3)
HAIR_STYLES 31-46: bowl, bowlpeak, tuft, pineapple, poof, odango, puffs, twinspike, fringe, wildmane, mane_flare, mane_horn, mane_slick, mane_lion, mane_side, mane_crest.
New HAIR_DEF key crown: thMin for the bare shell (mane_side leaves the crown bald).
New extras: peak (cone on top), antenna (curl), pineapple (top bun with tie and 6 leaves), poof (front ball plus up-swept back tail), odango (two top buns with ties), puffs (low side balls with ribbon bows, shown under hats), twinspike (4 spikes per side, sway bone), wild (14 outward spikes), flare (2 rows of 7 per side), horn (2 horn tufts, back fringe), maneback (heavy back lobe plus 7 long strands), lion (3 rings of 16, top ring hidden under hats), crest (7 midline spikes plus back fringe). Flare, horn, lion and crest also add a back fur lobe.
Positions use hairPoint where possible so they follow each race's head scale (Pipkin heads are much larger; positions in hc/hr offsets alone sank inside the shell).
Ursan beards (all faces) are phase 4.
Tools: scratch hero.js mode phead (camera H*2.0, centre H*0.78) for Pipkin framing.

## 18.79.0 Face extras (hair plan phase 4)
RACE_FACE_HAIR strings take an optional third field: "style:colors:extra1,extra2". faceHairEntry returns extras (array). ccApplyFace copies them to look.extras (deleted when none), so old saves (no extras) never change.
baseFromLook: look.extras -> base.extras (minus beard); "beard" sets base.beard = hair colour, plus longBeard for Ursan.
rig.js faceExtras(R, L, HP, hc, hr, covered), called after hairPieces when L.extras exists. Keys: goatee (chin ball plus moustache), tattoo (forehead lines, hair colour), paint (red bands under eyes), markings (blue vertical lines), stripes (3 dark cheek stripes per side), headband (red cloth ring plus knot tails), band (blue hairband over the crown), circlet (gold ring plus blue glow gem), clips (2 gold bars per side), clip (one bar with gem, +x side), beads (side locks with 3 beads), ribbons (bows on both sides), ornament (gold pin through the high bun with red bead), toptuft (3 spikes on top). Hidden under hats: headband, band, circlet, clips, clip, ornament, toptuft.
Face marks are thin plain-region tapers lying 1.2-1.4% off the head surface (hairPoint), not atlas paint, so no new face textures were needed. Head angles: forehead th about 1.05-1.2, cheeks 1.7-1.9, mouth 1.95 (moustache), chin 2.3; front ph = PI/2.
Assigned: Human M 5 tattoo+goatee, 6 headband+paint, 7 beard, 9 beard+markings; Elari M 8 beard; Elari F 3 clip, 5 ornament; Pipkin F 2 and 8 clips, 6 beads; Nekari 2 headband+stripes, 4 beads, 6 headband, 7 band, 8 circlet; Ursan all beard, 9 toptuft.
Test: h6unit checks extras parsing.

## 18.80.0 Town barbers (hair plan phase 5)
data.js: BARBER_FEE 1000, BARBER_NAMES per town; NPCS["barber_"+town] model barber, talk talkBarber, VENDOR_WORK "work". NPC entries: outpost (1085,681), harbor (1240,431), ironvale (1200,631), each behind a new stall at the same x and 9 px lower (counter faces south to the road): outpost beside the y=760 road, harbor y=500 road, ironvale y=700 road.
world3d.js stalls take sign (texSign above the canopy front on two chains) and pole (six red and white cylinders, gold cap, right side). rig.js NPC_LOOK.barber (layered hair, apron), NPC_HELD brush.
game.js talkBarber: poor players get a closing line and no option (openDialog closes on empty options); otherwise one option calls barberOpen.
main4.js: showCharCreate(edit) is reused: CC.edit swaps the loading overlay in (classes on ready roster, title BARBER), starts from save.look, race from raceOfLook, steps face, hair, size, confirm (ccSteps), preview uses save.gear without head and player level, 9th face button data-special (look.special = 1, face 0, uses table entry 8 via ccFaceIdx), random button rerolls face, colour and size only, Back at step 0 and the cancel button call barberClose. barberConfirm re-checks the fee, subtracts it, merges face, special, hairStyle, hairColor, hairCol, extras, height and girth into save.look, saves, logs. Net meta sync follows automatically through netTrack. Fee is charged only on confirm.
look.special persists in saves (deleted when 0); game.js load normalisation only touches face >= 8, so it is safe.
Tests: h7unit.js (talk handler and NPC placement per town, poor and rich dialog). Browser check by scratch script: poor open blocked, cancel keeps gil and look, pay deducts 1000 and applies look.

## 18.81.0 Body shapes (body polish plan phase 1)
rig.js humanEntryBase torso: bust = fem ? (robe ? 0.2 : 0.09) : 0.03 front factor on chest rings; urs = L.ears === "ursan"; lowW = !doll && !urs moves ring 1 to beltY + 0.55 (spineY - beltY) and the waist ring to spineY + 0.24 (chestY - spineY) (was the spine/chest midpoint).
Female bust balls (non-doll, non-robe): r 0.056 gi at x ±0.057 gi, y chestY + 0.004, z cz 0.172 0.92, scale 0.98/0.94/0.96, coloured as the top. BODY.bust {y, front, r} is recorded; bikini cups use it (doll keeps the old flat cups). Plate shell rings within 1.6 r of bust y raise front factor f so the shell clears bust front + 0.014.
Ursan: bodyProp waist 1.3 -> 1.02 (removed the mid-torso bulge); torso rings 2..8 rz up to +16%, rx up to -5%, p 1.95; shoulder rings 6..10 rx x [1.03, 1.12, 1.22, 1.14, 1.06] for a sloping trapezius; upper arm top rings domed (smaller radius, more tuck); deltoid ball skipped (it made the sharp shoulder corner); boxer waistband ring skipped.
Remaining body plan phases: 2 tails and Nekari ears, 3 weapon attachment, 4 female hips and jiggle.

## 18.82.0 Tails and Nekari ears (body polish plan phase 2)
rig.js tail block: one chain for every tail type. pts lists [dy, dz, radius] per joint (cat 7 points S curve, ursan 7 points thicker, generic 6 points); each segment is a gTaper with a ball joint at every interior point so the bend is round; segments 0-1 skin to bone tail, 2-3 to tail2, 4-5 to tail3 (new bone chained under tail2; bones sit at points 0, 2 and 4). Tip ball closes the end.
anim.js humanoid tail block: when P.tail3 exists it adds idle-independent sway (sin t*1.5, phase lagged per bone) on tail, tail2 and tail3 yaw on top of the existing wag; addP ignores missing bones so other rigs are unaffected.
Nekari ears: local ear() builds a 3-sided cylinder (triangle cross section) scaled thin in z, base 0.52 hr tapering to 0.11 hr over about 0.9 hr, outward tilt 0.8 hr, rounded tip ball, pink inner (0xd89a9a) slightly forward. Still skipped when a helm, hood, horned, winged, kabuto, turban, ninjahood or jester head piece is worn.
Remaining body plan phases: 3 weapon attachment, 4 female hips and jiggle.

## 18.83.0 Weapons on the body (body polish plan phase 3)
rig.js backZOf(BODY, L, gi, sw, chestY): meta.backZ is now the real back surface of the torso loft, max of rz*b - z over BODY.up rings within chestY -0.12..+0.14, plus 0.016 gi for plate, at least 0.15 gi + 0.02 with a cape, plus 0.008. Falls back to the old formula when there is no loft (skull rigs). The old formula overshot by about 4 cm on humans and 13 cm on Ursan.
models3d.js weaponPose stowed: z = backZ - WEAPON_HALF_T[kind] (half thickness of the weapon's grip and head: dagger and katana 0.014, sword 0.018, staff, scythe and archery 0.02, axe, club and great axe 0.022 to 0.024). Rotations unchanged (one-handers hang blade down across the back, two-handers diagonal, staff low diagonal). Drawn pose in hand unchanged; checked visually.
rig.js outlineMaterial: objectNormal only exists in MeshBasic shaders with skinning or envmap, so the outline shell on weapons (plain meshes) failed to compile; it now uses objectNormal when defined and the normal attribute otherwise.
Test harness note: /tmp hero.js must hide v.lo and show v.mesh before each render, otherwise the far LOD mesh is drawn and weapons (children of hi-LOD bones) vanish.
Remaining body plan phase: 4 female hips and jiggle.

## 18.84.0 Hips and body physics (body polish plan phase 4, plan complete)
rig.js humanEntryBase (fem, non-doll, non-robe): bones bustL/bustR (children of chest at the bust ball centres) now carry the bust balls and bikini cups. backAt(y) interpolates the back surface (rz*b - z) of lowR + upR. Glutes when no skirt top (tunic, mail, plate, tabard, rags hide them): bones gluteL/gluteR under hips at x ±0.05 gi, y hipJ - 0.006, z = -(backAt - 0.8 r + 0.017), ball r 0.072 gi scaled 0.94/1.12/0.8, coloured as the legwear (or skin), weights 0.72 glute + 0.28 thigh so they follow the stride; brief/boxer adds a +0.006 white shell. Crease: four tapered dark strips (0x1a0f0c, flat 0.55) at x 0 from beltY - 0.045 to hipJ - 0.058 on the back surface (+0.0016, or +0.0075 over briefs). Thong back strap follows backAt + 0.004 in the crease when glutes exist.
meta.jig { bust: 1 (0.5 under mail, 0 under plate), glute: 1 } or null.
anim.js bodyJiggle(v, an, dt), called after clothSprings in the humanoid animator: per group (bust on chest, glute on hips) reads the parent bone's world acceleration (finite differences, capped at 60), rotates it into the parent's frame, injects -a * 0.55 * amp into per-axis springs (sprAx, bust k 170 c 5.2, glute k 210 c 6.4) and offsets both bones' positions from rest, clamped to bust 1.1 cm vertical (x 35%, z 60%), glute 0.8 cm. VIEW.settings.noJiggle (Graphics button "Body physics") snaps bones to rest. Measured in a walk sim: peak 1.3 cm bust, 0.8 cm glute, under 1 mm within a second of stopping.
Test harness: hero.js mode "hips" (back, back three-quarter, profile, walking back view).

## 18.85.0 Fuller sculpted hips (replaces the 18.84.0 glute balls)
rig.js humanEntryBase, gOn = fem, non-doll, non-robe, no skirt top: the hips loft (lowR) and the bottom of the torso loft (upR rings 0..2) are densified (dens: 4 linear rings between each pair), lofted at 64 segments and sculpted. zMod(x, y, z): two ellipsoid lobes at x ±0.075 gi, y hipJ - 0.012, semi-axes x 0.088 gi, y 0.058 below / 0.112 above, z depth 0.07 gi, centre z so the peak sits gA = 0.035 gi behind the original back; the lobe surface is smooth-min blended (radius 0.034) with the body and faded to nothing over the outer 30% of the ellipse so there is no edge. sculpt(g, kz, ex) moves only back-facing vertices (blend by angle around the body, not by ring) and recomputes normals; ex lifts thin items (waistbands) off the surface. Waistband rings for thong and briefs, brief shell, thong strap and crease use the same surface.
Glute bones sit at the lobe centres; skin weight to the glute bone = 0.75 x local depth / gA. Glute and bust bones are rigid in smoothJoints (so joint smoothing does not overwrite their weights) and exempt from the bakeShade joint darkening (softBones); both of those caused banding.
Thigh lofts are not sculpted (tried; it z-fought with the hips surface).

## 18.86.0 Drop rules, phase 1
game.js: lootRestricted(id) = equip kind or scroll_ id. lootJobOk(job, lv, id): scroll needs SPELLS[spell].jobs[job] <= lv; equip needs item.jobs ALL or including job, and item.lv <= lv. lootAllowed(m, id): unrestricted items pass; NM or boss passes; otherwise mobJobOk(fam) (humanoid models in MOB_JOB_MODELS, not NM/boss/summoned) and lootJobOk(m.job, m.lv, id). dropLoot skips failing entries (no reroll). gearDrop and the random scroll drop run only for humanoids with a job and pick only job and level fit candidates. mobDropsCrystals(m): NM, boss or humanoid; others get no crystals (the fam.gil field was removed from treant_elder, cactus, bomb, bog_toad; they inherit into tier copies). Essences (kind crystal items) are unchanged and still need the blessing.
Test: test/d1unit.js (table-wide check that no non-humanoid, non-NM family lists gear, scroll or gil; rule spot checks; 400 beast kills give nothing; every humanoid job and family drop is job and level legal). Harness exports lootJobOk, lootAllowed, mobDropsCrystals, lootRestricted.
Phase 2 (Opus): rebalance tables, see design/drop-rules-plan.md.

## 18.87.0 Drop rules, phase 2 (trade goods and rebalance)
data.js: TROPHY_KIND maps beast model to kind (hide: sheep lizard longneck hare toad bat worm; chitin: crab crawler bee; fibre: mandrake shroom bulb treant cactus; scale: fish; core: bomb wisp; unknown models fall back to hide). TROPHY_TIERS: L1-9 price 228 chance 0.1->0.6, L10-19 700 0.3->0.6, L20-29 1100 0.4->0.6, L30+ 1500 0.4->0.6 (chance ramps linearly with level inside the tier). TROPHY_NAMES gives grade names; items trophy_<kind>_<1..4>, kind mat, trophy true, stack 12.
game.js trophyFor(m): null for NM, boss, summoned, pets, humanoids; dropLoot rolls it after gearDrop when xpFor > 0, with the THF and buddy drop bonuses.
CONFIG.mobGil 2-4 -> 3-5 (now humanoid only). The gil 1-2 overrides on goblin, den_goblin, orc_grunt, orc_stonechucker, fishfolk, birdfolk, mire_goblin, frost_goblin (and their tier copies) were removed, so all humanoids use mobGil. CONFIG.gearDropHum 0.08 (was 0.06 for every monster). Scroll drop stays CONFIG.scrollDrop 0.05, humanoid only, job-matched.
Bestiary (menu4): beasts list "trade <kind>", humanoids "crystals, gear and scrolls its job can use".
Model: tools/balance/drops.js (spawn-weighted value per kill by level, sell price = price/4). Value per kill, 18.85 -> 18.87: L1 11->11, L5 32->29, L10 77->62, L12 94->73, L15 118->101, L16 130->98, L20 187->128. Humanoid kills about equal to before (L10 73->72, L20 157->158); beasts about 0.45 to 0.6 of before at L10+. Accepted: 18.4 had doubled income and set costs dropped, so about 0.7x at L15-20 still buys a full set in roughly 6-7 hours at L20.
Test: d1unit trade goods checks (rate, kind and tier, none from humanoids or NMs, sellable and AH tradable, every beast model mapped). p58unit line 16 inverted: beasts give no crystals.

## 18.88.0 Vendor shops, phase 1 (assignment and placement)
data.js: VENDOR_TOWNS[town] = { names, shops: { role: { x, y, w, h, sign, district } } } replaces the old `at` points. VENDOR_SHOP_LOOK[role] gives the building type (forge for armorer and weaponsmith, shop with a coloured awning for the rest), sign colour and awning. The vendor loop appends one house per vendor to ZONES[town].houses (type, floors 1, sign, signCol, awning, roof i%4, shop: vendor npc id), appended last so NPC `home` indexes stay valid, and places the vendor at (x, y + h/2 + 34): the doorway of a south-facing door (houses always face +y).
Districts: outpost armorer and weaponsmith ind, tradesman gate (Eastgate, nearest gatherers' exit), quartermaster, spellsmith, jeweler market. harbor armorer and weaponsmith yard, tradesman fish, quartermaster, spellsmith, jeweler square. ironvale armorer, weaponsmith and tradesman forge, quartermaster and jeweler market, spellsmith gate. Sizes 96 to 120 wide, 72 deep.
Spots were found by a grid search (script not kept): inside the district with 30 px edge margin, 22 px from other buildings plus 72 px of clear door front, 16 px off roads, off plazas, fountains, stalls (the outpost stall at 1180,960 was not a blocker candidate but nothing needed moving), exits (60 px) and gates (120 px), and clear of fixed NPCs. Props, lamps, benches and warpstones are decor that the existing offRoadGroup pass already pushes out of buildings, so they were ignored.
hud4.js zone map: houses with `shop` draw their sign text on the map.
Test: test/v1unit.js (every vendor has a shop and stands at its door; shop in the right district; no overlap with buildings, stalls, roads or exits; vendor clear of buildings; at least three districts per town; no NPC inside a shop).
Known rough edges for phase 2 (Opus art pass): vendors in cramped spots (outpost Weaponsmith beside the warpstone and district signpost), shops facing the back of existing houses in Saltreach Harbor north row and Ironvale Smelters' Row, no trade props yet, shop interiors are not enterable (talk at the door).

## 18.89.0 Vendor shops, phase 2 (storefronts and street-facing spots)
Placement redone by hand from a scored search: vendor point (door + 34 px) near a road or plaza, no building within about 50 px in front, 60 px from other NPCs, 100 px between vendors. Shop doors always face south (rot is not used: the 3D mesh and the colliders disagree on which of w and h is the x extent when rot is set, see the residence house at outpost 200,760; left alone). Final spots are in VENDOR_TOWNS.shops. Ironvale: weaponsmith and armorer forge south end, tradesman gate ward (west), spellsmith keep (north-east corner, 120 px from the keep-forge gate), quartermaster and jeweler market. Garrick moved from 820,1205 to 795,1250.
world3d.js: houses with `trade` (set by the vendor loop) call shopFront(bt, M, B, hs, bw, fz, PL, dh, dw, z, root, rnd) inside buildCityBuildings: a round emblem plane (texTradeIcon(trade), canvas-drawn shield, sword, pick, flask, scroll, gem) hung under the side sign bracket, and per-trade props in building-local space at x = +-(bw/2 - 0.75), z = fz + 0.55 (door and vendor stay clear at x = 0). Props are batched into the city batch except a few small separate meshes (potions, orb, candle flames, glass case, gems). Each prop group pushes a collider (r 10 to 16 px) into z.colliders.
Later fixes in the same release: Ironvale armorer 1610,1120 and weaponsmith 1470,1120 (the mine at 1690,1250 has a 70 px collider and rails running west along y 1250); Ironvale tradesman 94,420 (a terrain ridge at y 530 to 590 near x 40 to 160). Warp stones moved so they do not stand in front of a storefront: outpost ind 980,1260 -> 1240,1228 (between the Woodworkers and Alchemists halls), harbor yard 1480,544 -> 1400,600. The random house-front crate scatter skips shop houses. Shop forges skip their point light on low quality.
Test v1unit adds: open ground in front of the door, no NPC within 60 px of a vendor, no NPC in the storefront view (shop width + 20, 120 px out), clear of mines, slipways, lighthouses and fountains.
Visual check: every storefront rendered with a fixed camera (render hook sets W3.camera before each render), day and night; all 18 read as their trade.

## 18.90.0 Interrupts (combat polish phase 1)
CONFIG: mobPhysInterrupt 0.75, readyInterrupt 0.35, wsWind 0.8, wsLoseTpAt 0.75. Setting VIEW.settings.classicInterrupt (Settings, Combat) restores the old chance-only rule everywhere (classicInterrupt()).
applyDamage opt.phys marks physical damage: melee and bow swing, weapon skill, physical monster move (phys: !mv.el). With phys and the rule on, the old per-hit chance rolls are skipped and physInterrupt(tgt) runs instead: party and player casts always interrupt (Aquaveil absorbs one via aquaveilAbsorbs), monster casts 75%, a player or party winding is interrupted, a monster readying is cut 35%. Zero-damage hits do nothing.
Weapon skill wind-up: perform() calls startWind (e.winding = { id, t, name, start, end }); tickWinding in tickCasting fires doWS when the time is up and the target is alive, in range and TP is still 1000 or more. interruptWind keeps TP unless the hit lands in the last 25 percent. Moving (moveToward, click move), Escape (main4.js) and KO clear it. Items, rest, auto-attack, party AI and checkAction treat winding like casting. Cast bar (hud4.js) shows it. Abilities (doAbility) stay instant.
Tests: test/i1unit.js (16 checks). p6unit goblin aggro moved to 45 px (always seen, ignoring weather); p55unit start-job checks match START_JOBS (RDM, BRD and SMN are advanced jobs); p34unit and p15unit stop mob swings during casts; p15 sprite-fade test holds MP at 0 (regen made it flaky).
Next: phase 2 (Opus), see design/combat-body-move-plan.md.

## 18.91.0 Underwear, female shoulders, waist smoothing (phase 2)
rig.js humanEntryBase: sw0 = pr.shoulder (torso width scale W, plate W2 and tail use sw0); sw = sw0 * 0.87 for women (0.95 Pipkin) drives arm sockets, arm rings and shoulder gear. Upper torso rings (upR0) for women scale rx by 1 - 0.13 * smoothRange(chestY + 0.01, chestY + 0.09, y), so the shoulder line narrows but waist and bust stay.
Torso densify: densCR(rings, a, b) (Catmull-Rom, 4 extra rings per segment, using neighbours across the hips/chest join) replaces the old linear dens for the glute build (gOn). lowL = densCR(allR, 0, nLo - 1), upL = densCR(allR, nLo - 1, nLo + 1) + upR.slice(3). The linear version left a corner at the spY ring that read as a box at the hips.
Underwear helpers: uwFront(rings, x, y, back) gives the loft surface z (superellipse |x/rx|^p + |z/(rz f)|^p = 1, ring params lerped by y); uwRing(rings, y0, off, n, yBack) samples a ring around the body, rising to yBack at the back; uwPath, uwStrand (gTaper chain with ball joints), uwBow (two loops + two tails + knot facing a normal); gWrapTri(tri, n, zAt) builds a subdivided triangle draped on z = zAt(x, y), winding fixed to face +z.
Colours: strings UWK 0x121014; fabric UWC = skin lerped 68% to UWK on the "cloth" region, so it reads as sheer black but stays opaque.
Top ("bikini"): per side triangle A (inner bottom), B (outer bottom), T (apex) around the bust centre (bX, bY, bZ, bR; Pipkin uses a pseudo bust at 0.051 gi, chestY + 0.02), z = max(chest surface + 0.0035, bust ellipsoid + 0.006); cup weights go to bust bone inside 0.85 bR and fade to chest by 1.2 bR (so jiggle carries the cup). Edge binding on the two upper edges, halter from apex to neck side and round to a bow at the back of the neck (neck bone), underband ring at cY - 0.8 bR raised over the bust, back bow.
Bottom ("thong"): waist string ring at beltY - 0.02 in front rising to max(beltY + 0.012, top of glute ellipsoid gcy + gayU + 0.004) at the back (user request: back string on the waist above the buttocks), glute-sculpted at the back with zMod; front triangle from the string (+-0.07 gi hx0) to hipJ - 0.068; side bindings; strap under the crotch and up the glute crease to the raised back string; a bow at each hip.
Visual check: contact sheets (front, three-quarter, side, back) of Human, Elari, Nekari, Pipkin women and a Human man, bare and with robe, mail, breastplate, vest, trousers and tunic.

## 18.92.0 Natural movement (phase 3)
anim.js gaitDynamics(v, e, an, P, amp, run, dt), called after turnInPlace in poseHuman: acceleration (d an.spd / dt) drives a spring (an.gst.acc, k 70, d 9, target clamp(acc * 0.022, -0.22, 0.2)) pitching spine, chest, head and arms (lean in on set-off, rock back and settle on stop); yaw rate of v.group.rotation.y drives a bank spring (an.gst.bank, target spd * yawRate / 9.8 * 0.5, clamp 0.2) applied as hips roll (negative z leans toward +x, the inside of the turn), spine counter-roll and head level; head leads into the turn (yaw), hips yaw slightly against.
poseHuman walk block: pelvis drop and lateral weight shift on c1 (stance midpoint: L at ph 0, R at ph pi): hips z +c1 * 0.055, chest -0.04, rootOff x c1 * 0.012, scaled by walk * (1 - run) and reduced when strafing. Vertical bob split: walk peaks at mid-stance (|c1|), run peaks in flight (1 - |c1|) with a lower base; head counter-bobs. Arm swing 0.4 rad walking, 0.55 running (was scaled by amp, so walking arms barely moved); running elbows -0.85 rad, upper arms biased back 0.2 and crossing slightly; hips pitch 0.07 forward at a run.
humanLegIK: stance st 0 at heel strike (front) to 1 at toe-off; toe (positive = plantarflex) = -heel strike (0.3 walk, 0.06 run, fading by st 0.2) + toe-off off0 (0.5 walk, 0.7 run) from st 0.62 (0.5 run); ankle raised fl * sin(toe-off) so the toe stays on the ground (fl = 0.1 scaled by leg length); swing continues from the toe-off angle and height, lifts (0.06 + 0.17 run), toes up for clearance and dorsiflexes for the next heel strike.
Checks: gait sheets (side, 18 frames, walk 30 px/s and run 100 px/s) before and after; test/gaitprobe.js planted-foot speed before and after for Human, Ursan, Pipkin, Elari.
Additions in 18.92.0 (user requests during phase 3):
NPC faces: rig.js npcFace(L, seed) picks a creation preset (faceHairEntry(race, build, face), race from ears/doll, face = seed % (presets - 1), skipping the special last one) for NPC and ambient walker looks; sets L.face, hair style (not when bald, head covered or L.keepHair) keeping the NPC hair colour, and preset extras (beard removed) when the look has none. Skipped for noFace, skull, cactus, family, boss, tusks, beak looks.
Hood: an extra closed cap (gPartSphere hr * 1.21, theta 0 to 0.43 pi, down to the brow) over the scalp; the old front gap left the scalp and fringe showing.
Bust: bR 0.062 gi (was 0.056), bX 0.054 gi (was 0.057), bY chestY - 0.002, ball scale (1, 0.95, 1); spheres overlap at the midline for a cleavage V, plus a thin darkened-skin crease strip along the intersection when the top is bare. Underwear cups follow (inner corners 0.9 bR, apex 0.02 bR inward).
Glutes: zMod rewritten as a surface offset instead of a fixed-depth ellipsoid cap: depth = gA * sxk^0.85 * fy, sxk = 1 - ((x - +-gcx) / gax)^2, fy = (1 - ty^2)^1.7 above the centre (tangent into the lower back) and sqrt(1 - ty^2.4) below (rounded, tucks under at the fold). gA 0.05 gi, gcx 0.072 gi, gcy hipJ - 0.022, gax 0.092 gi, gay 0.048, gayU 0.15. Back waist string height gcy + 0.82 gayU.
Gait fix: the lateral root shift made planted feet slide sideways (walk planted speed 0.006 -> 0.047 m/s); replaced by a spine roll. Running planted speed is slightly higher than before (about 0.05 vs 0.035 m/s, about 1% of run speed), not traced to a single change.

## 18.92.1 Fuller hips (user reference: a drawn back view)
Glute params: gA 0.064 gi, gcx 0.086 gi, gax 0.097 gi (more lobe separation; midline depth about a quarter of the peak), gcy hipJ - 0.03, gay 0.056, gayU 0.155; upper profile (1 - ty^2)^1.35, lower sqrt(1 - ty^2.6).
bumpC(y) = max(bump(0, y), 0.9 * bump(0.009 gi, y)) gives the visible cleft surface (the loft chords across the valley sit outside the analytic midline); the crease line and the thong back strap use it.
Thong: uwRing takes a dip (0.03 with glutes) that lowers the back of the waist string in a V within |cos t| < 0.34; the back strap is 15 points from the V bottom down the cleft to hipJ - 0.072, then under the crotch to the front triangle, radius 0.0032, colour 0x060507.

## 18.92.2 Anvils, zone runs, Maris, round glutes
models3d.js addAnvil(group, meta): NPCs whose work is "hammer" (NPC_WORK or VENDOR_WORK) and kind human get a static anvil set in the view group (stump scaled to top at 0.74 hipsY, base, waist, face, horn cone, glowing bar MeshBasicMaterial, tongs), shared geometry in VIEW.anvil, placed at (-0.13, 0, 0.4) * hipsY/0.97, rotated -0.25. v.anvilGlow is the bar material; anim.js hammer work brightens it after the strike (c 0.7 to 0.9). destroyView disposes it.
Zone exits: CONFIG.exitWalkTime 1.05, zoneFadeOut fades over 1.0 s. startExitWalk uses player.face when the exit is not on a zone edge (doors, ask exits), skipped when mounted; ask exits call startExitWalk after the confirm.
Maris: NPC_LOOK.v_jeweler_outpost (end of rig.js, after RACE_BODY) is a Pipkin woman (baseFromLook race pipkin, build 1, face 3, puffs hair) in the jeweler coat.
Boots: humanEntryBase boot shell needs at least one leg ring below bootTop (Pipkin legs have none), else the taper fallback.
Glutes: upper profile fy = smoothstep(1 - ty)^0.55 (round dome, eases into the back), gcy hipJ - 0.02, gay 0.064, gayU 0.13.

## 18.92.3 Glute profile (user reference: side outline should round under into a fold)
rig.js: gcy hipJ - 0.03 (was - 0.02), gay 0.05, gayU 0.14; below centre fy = sqrt(1 - ty^2) (circular underside). BODY.sculptLeg (was null) insets the back of each thigh (+0.013 gi toward the front, weighted by back-facing angle around the leg centre at +-pr.hip) in a band peaking at foldY = gcy - 0.94 gay, so the buttock overhangs the thigh and leaves a fold.
Back strap: rides at max(bumpC, 0.62 * bump(0.028 gi, y)) so it bridges partly out of the cleft and stays visible from behind.

## 18.93.0 Street fronts (town zones plan D1, design/town-zones-plan.md)
Supersedes the "houses always face +y" and "rot is not used" notes in 18.88.0/18.89.0. House w,h are world extents; rot 0..3 = door +y, +x, -y, -x; mesh angle rot * PI/2 (makeRotationY maps local +z to (sin, cos)).
data.js: GATE_HALF, cityWallRects and segRect moved here from game.js (needed at load). New helpers HOUSE_DIRS, houseDir, houseAng, houseLocal (local w/d, swapped for odd rot), houseDoor(h, off), houseRect, inRect, rectsHit, roadGap(z,x,y,noLanes), rectOnRoad, doorRay(z,h,rot,maxT) (4 px steps from the front centre; null if a building, wall or zone edge comes first), lotFree, frontage(z). frontage runs on every theme town zone after the vendor loop, before the offRoad pass: shops first, then auto-face (ties keep the current rot, 20 px bonus), setback move along the facing axis to SHOP_FRONT {46,80,tgt 56} or HOME_FRONT {8,60,tgt 24} when lotFree, lanes (w 30, lane: true) for doors still past hi + 6, then vendor spots at houseDoor(shop, 34) (lateral +-26 when a lane leaves the door) with npc.face and npc.shopFront.
offRoad pass: clearOfRoads uses world w/h, rejects city walls (20 px) and vendor front corridors; every folk NPC (not shopFront) is nudged with extra 16.
game.js: npcDoor uses houseDoor(hs, 22); npcs get idleFace from zone npc face; every non-prop NPC without a sleep schedule turns back to idleFace after talk.
world3d.js simple and city houses use houseLocal/houseAng. hud4.js minimap draws world w/h and a gold door tick per typed house. view3d.js camera-in-house test uses world w/h.
Data moves: outpost main road starts at x 300 (was 100, through the residence house), Eastgate N-S road 250..1270 (was 120..1400 through guardhouse and stables), south cross road to x 1880, Stables 1820,1360, guardhouse x 1700, Rhea 860,290; shop points outpost quartermaster 720,850, spellsmith 1350,870; harbor armorer 1620,640, tradesman 450,590, jeweler 700,600, ferry 960,1092, stable_harbor 1420,620; ironvale armorer 1490,1280, spellsmith 760,290.
Tests: new test/townlayout.js (buildings clear of roads, walls and each other; non-fixed doors reach a street within 100 px; folk >= 10 px off roads and out of buildings; vendors at door +34 facing it; stalls >= 14 px off roads; six vendors). v1unit generalised to any door direction (doorRay for open ground, corridor along houseDir, lanes ignored for the shop-off-road check). p49unit routes start at 300,1100 and stop at 860,1240 (Garrick and the new Provisions lot sat on the old waypoints). harness exports the new helpers.
Known: click-to-move from the x 1000 road junction in Industrial toward Eastgate wedges on the market gate tower beside the Woodworkers hall (old layout, unchanged); p33unit, p34unit and h3unit are occasionally flaky (pass on rerun, also before this change).

## 18.94.0 Districts become zones (town zones plan D2, design/town-zones-plan.md)
data.js tail: splitTown(src) runs last in data.js for outpost, harbor, ironvale (after frontage, offRoad, warp stones, signposts and every NPCS def). Parts = districts with outer 24 px margins snapped to the zone edge. The part holding the crystal keeps the town id (outpost = Market, harbor = Harbor Square, ironvale = Market Square); others are <town>_<district> (outpost_res, _gov, _ind, _gate; harbor_fish, _yard, _docks; ironvale_gate, _keep, _south, _forge). Zone name = city + " " + district name without a leading "The" (Ashenreach Market District, Saltreach Docks). Each part: area = town, town = town, splitFrom, off [x0, y0] (global offset), districts = [district with rect 0,0,w,h], outerWall = string of sides that face another district or were walled in the original (harbor docks keeps its open south), copies theme/safe/paved/city/cityStyle/palette/mist/cs/music. Partitioned by position (nearest part when outside every part): houses (npc home indexes remapped; an NPC whose home lands in another part loses home and sleep), npcs, props, ambient (path shifted), water, fountains, gardens, stalls, spawns, plazas, plaza, stable, walls (by centre), lamps/benches/dummies/racks/torches/lighthouses/slipways/mines/boats ([x, y, ...]), docks (top-left rects by centre), exits (by centre, clamped), paths (any segment touching the part, all points shifted). cityWalls and gates are dropped: each gate becomes a pair of edge exits { gate: true, lane: GATE_HALF + 20, no hall } 110 long at the gate position, arriving 96 px inside. Other zones' exits into the town are re-pointed by their tx/ty (global) to the part and shifted. NPCS[warpstone].warpZone = its part; NPCS with ferryTo the town point at the part holding a ferry NPC (ferry_isle -> harbor_docks). ZONE_SPLITS[town] = { w, h, town: true, parts }, AREA_NAMES[town] = old name.
Layout support (runs before the split, in the single-zone coordinates): GATE_HALF/cityWallRects/segRect live in data.js; gateZones(z) (cached z._gz) = per gate 2*(GATE_HALF+30) wide, 260 deep across the wall, per non-door exit the exit +-60 px and hall + 110 deep; lotFree(z, h, x, y, hard) also needs the rect inside h.district (set at frontage start), walls pad 24 (new zone walls reach 32 px in), no gate zone; hard mode (overlap pad 4, no road/plaza checks) decides relocation. frontage first relocates any building failing hard lotFree to the nearest free lot (8 px rings to 480, 32 angles). clearOfRoads keeps points 140 px off each gate across and GATE_HALF + 30 along; offRoadGroup keeps every item in its original district.
migrateSplits: explored slicing samples cell centres (floor((p0 + i*50 + 25)/50)) so parts off the 50 px grid still carry fog. normalizeSave: zv < 2/3 resets mark that town in zsplit so the reset start (already local) is not moved again. enterZone(id) without x/y uses the zone start.
game.js: markDistrict and the district keys use areaOf (save.districts keys stay "outpost:gov"); tourDone(area) checks every district of every part; talkDistrictSign lists all districts of the area using off; warpStoneCost free within the same area; openWarpStone groups by cost; ahTowns returns areas and ahHere the current area; vendor stock uses areaOf. audio surf uses areaOf. view3d loaderHide always fades from black over 0.8 s. menu4 tabMap adds citySVG() (city overview from ZONE_SPLITS parts, gates where p.id < e.to, outside roads, player at off + x/y).
Data moves for D2: outpost Auction House x 845, Woodworkers 1150 (w 130), Alchemists 1290,1145 (120x76); harbor Auction House 1065 (w 150); ironvale south home 750 (w 120) and warehouse 1050 (w 110), Scrolls 1065,285 (90x72), Supplies x 100, Jewels 700,830, Brisa 1150,300, guard_ironvale 200,620.
Tests: townlayout iterates every district zone (walls 36 px, paired gates, gate arrivals clear of buildings and people, sleepers keep their house) plus six vendors per area. harness: G.meet(id) enters the zone holding an NPC (all 30 test npc() helpers fall back to it), G.zoneOfNpc, splitLocal, areaZones, ZONE_SPLITS, warpStoneCost. p49unit rewritten for district zones (paired gates, walking through a gate, save migration from old global coordinates, residence and Hollow re-pointing). Updated: h5, h7, m5a, p5, p6, p13, p17, p22, p35, p36, p39, p51, p52, p54, v1 (gate exits need 30 px, not 50).
Known: beyond the inner walls each district shows empty terrain where the neighbour used to be (D3: skyline or backdrop). Headless Chromium here draws about one frame every few seconds, so the fade timing was checked in code, not on screen.

## 18.95.0 Ashenreach rebuilt (town zones plan D3, design/town-zones-plan.md)
data.js (right before ZONES.den.exits.push): OUTPOST_PLAN per district (district-local coords, off = global offset; districts 2400x1800 in a cross: gov 2400,0; res 0,1800; market 2400,1800; gate 4800,1800; ind 2400,3600; source zone 7200x5400, corners unused), OUTPOST_GATES (4 gates, all on the Market's walls), OUT_FILL (per district building mix: type, share, width range, depth range, floors), OUT_SIGNS (decorative shop names, each used once per district), OUT_AWNINGS. buildOutpostCity() builds ZONES.outpost: districts, cityWalls, gates, streets -> paths (trees flag, district), landmark houses (key -> npc home by key), npcs/props/water/gardens/stalls/fountains/plazas/ambient/dressing/exits/dummies/racks/benches, then a lot filler: for every street segment and side, step along it placing buildings (type by OUT_FILL) at setback 26 (58 for shops) facing the street (rot set), if the rect is inside the district with 60 px margin, 22 px from other houses, off reserve rects, gate boxes (200x320 across the wall), exit boxes, gardens, stalls, plazas/water/fountains, npcs/props/dressing, and 6 px off every road; ind/gate houses sometimes get barrels/crates beside them. Lamps every 230 px alternating sides at road edge + 16; trees on trees streets every 170 px both sides at edge + 34. Seed "ashenreach-city-1". VENDOR_TOWNS.outpost and WARP_STONES.outpost hold the new global points; residence exit back tx/ty 2050,2750; Hollow exit into the Outpost tx/ty 7070,2700.
zone.dressing [{ t: tree|well|cart|planter|hay|statue, x, y, rot?, s? }] drawn in buildCityBuildings (batched, colliders); splitTown carries it (TOWN_OBJ_KEYS).
settleTownFolk(z) runs on the three towns right before splitTown: folk NPCs (not props, crystals, warp stones) that are within 70 px of an already-settled NPC move to the nearest spot in the same district that is clearOfRoads(16) and 70 px from everyone; vendors and NPCs at a stall (45 px) are anchors. Then each folk NPC (not vendors) gets face: toward its stall or desk if within 45/50 px, else toward the nearest point of a non-lane road.
After splitTown: each part gets z.ghost = { rects (other parts within 900 px, local), paths (their non-lane paths shifted), houses (their houses shifted, within 900 px) }; gate exits get a signpost NPC gsign_<zone>_<i> named "To <zone name>" (signTo), placed by the gate at the first clear spot (lane + 40/80/130 sideways, 70/110/160 in); every sign_ NPC is re-pointed to its nearest non-gate exit and renamed "To <zone name>". talkSign leads with "This way to X." TOWN_LAYOUT { outpost: 2 }; save.tl; normalizeSave moves a loc in an area whose layout version is newer than d.tl to that area's start (the Market for the Outpost).
world3d: buildFieldSteps treats sides touched by a ghost rect as inside (edgeE ignores them: no hills, no outside trees or rocks), and paints ghost paths; pathW uses per-segment bounding boxes (painting dropped from ~20 s to ~2 s per district in the headless test browser). buildSkyline draws ghost houses 60..620 px outside the zone as plain blocks with windows (lit at night via W3.windowMats) and roofs. Outer-wall gaps for gate exits show the destination district's name and colour on the lintel board and hang district-colour banners on both towers.
Tests: townlayout adds people 60 px apart, facing the street within 0.35 rad (unless at a stall or desk), and a "To ..." signpost within 400 px of every town exit. p49: four gates (eight exits), save from before the rebuild lands on the Market start, a current save keeps its spot. p5 Tab test stands next to Odette.
Known: the plan's corner squares are empty (nothing is drawn there; walls on those sides face open country). p18unit is occasionally flaky (time of day).

## 18.96.0 Saltreach rebuilt (town zones plan D4, design/town-zones-plan.md)
data.js: buildOutpostCity became buildCity(C), C = { seed, name, city, cityStyle?, outerWall?, plan, fill, gates, signs, cargo?, w, h, walls, start: [district, x, y], reserve? }. Outpost uses it unchanged (same seed, same output). Plan districts may set w/h (default OUT_DW x OUT_DH), open (sides with no outer wall, passed to splitTown through the district) and extra point lists: docks (rects), boats, lighthouses, slipways, lamps. Ambient walker paths are offset with the district. exitBox is side-aware (n, s, e, w).
HARBOR_PLAN (data.js, after the Outpost): source zone 7200x3600, no corner districts: fish 0,0 / square 2400,0 / yard 4800,0 across the top, docks 2400,1800 under the square. Square is the hub (crystal kept: ids harbor, harbor_fish, harbor_yard, harbor_docks as before). HARBOR_GATES: fish|square, square|yard (vertical), square|docks (horizontal). Fish and yard have open "s" (sea quay); docks keep side walls and the south is open through outerWall "new". Exits: marsh on the square's north edge, frost on the yard's east edge. HARBOR_SHOPS holds the six vendor shop points (also fed to buildCity as reserve so lots do not take them); VENDOR_TOWNS.harbor.shops points at it. WARP_STONES.harbor re-pointed. TOWN_LAYOUT.harbor = 2 (old Saltreach saves load on the square start).
Sea: HBR_SEA(y, r, xs) circle rows with centres past the district's south edge. Keep circle reach out of the next district: fish circles stop at x 1950 (r 420), yard circles start at 600, docks circles are inside docks (a centre on a district boundary lands in the district on the lower or right side).
Layout test (townlayout) covers all four harbor zones with no changes. Known: the Ironvale plan (D5) still needs the same treatment.

## 18.97.0 Ironvale rebuilt (town zones plan D5, design/town-zones-plan.md)
data.js: IRONVALE_PLAN, IRN_FILL, IRN_SIGNS, IRONVALE_GATES, IRONVALE_SHOPS replace the old ZONES.ironvale literal; ZONES.ironvale = buildCity({ ..., cityStyle: "mountain", palette: "snow", cargo: ["forge", "gate"] }). Same cross as Ashenreach: keep 2400,0 / gate 0,1800 / market 2400,1800 / forge 4800,1800 / south 2400,3600 in a 7200x5400 source zone (corners empty). Four gates, all on Market Square. Exits: frost on the Gate Ward west edge (street ends at -100 so the exit hall extends it), sunscar on the South Ward south edge. buildCity now also copies C.palette and offsets mines and torches. TOWN_LAYOUT.ironvale = 2 (old Ironvale saves load on the Market start). Vendors: IRONVALE_SHOPS (forge armorer and weaponsmith, gate tradesman, market quartermaster and jeweler, keep spellsmith), WARP_STONES.ironvale re-pointed, frost and sunscar exits into Ironvale re-pointed.
Layout test covers all five zones unchanged. Remaining: D6 (sweep).

## 18.98.0 City sweep (town zones plan D6, design/town-zones-plan.md)
data.js: fixWalkers(z) runs on the three big town zones right after settleTownFolk (before splitTown): any ambient walker whose route cuts through a building is re-routed to a straight run along the nearest long street of its district (ends 300 px in from the street ends). It must run after frontage (houses move) and uses districtAt, which returns the district object. townlayout test now checks walker routes avoid buildings and water in every town zone.
Travel times (runSpeed 100 px/s, sprintMul 1.45): district edge to crystal about 888 to 1188 px (9 to 12 s), a 2400 px district about 24 s (16 s sprinting). Left as is; warp stones are free inside a city.
Help: hub wording, new building names for Saltreach and Ironvale, Getting around tip. Quest and NPC text checked: no stale coordinates (tour quests list district names only).
Plan complete (D0 to D6). Known: the empty corner squares of the Ashenreach and Ironvale crosses and the empty corners of the Saltreach source zone are not drawn.

## 18.99.0 Menu fixes (Phase 1 of the layout request)
hud4.js `statusToggle()`: if UI.mm.sub is "status" it closes the main command menu, else `mainCmdOpen()` then page 0, back 0, sub "status", sel 0. main4.js onKey: "c" removed from `menuKeys`; handled before `menuKeys` in both the modal branch and the free branch. Old key opened S.modal "character" directly.
`gameConfirm` opts: `center` toggles class `mid` on #confirmBox (inline bottom cleared; CSS `#confirmBox.mid.on` centres it) and `narrow` toggles class `narrow` (`.cb` 250 px, text wraps). Log Out (hud4 mainCmdDo) uses center; the defeat prompt in game.js giveUpKO uses narrow.
itemCard (menu4.js): the race tag is empty unless `it.race` is set; then "<Race> only".
Help (screen section, main menu line) and the Updates list carry the new C behaviour. Remaining phases: 2 signs (one per real store, text fitted), 3 layout (nothing on roads, residential barber and furnishing, small gate halls, auction clerk inside, warp stones by roads, gates placed where each city's quests are, and a Government district clerk who changes your character name for 10000 crystals).

## 19.0.0 One sign per shop (Phase 2 of the layout request)
world3d.js buildTown: a house with `hs.sign` gets one front plane (the old side bracket sign, its iron arms and the `T.sign` bracket are removed); `shopFront` no longer draws the hanging `texTradeIcon` circle (the function stays unused). `texSign(text, col)` measures the text: bold Georgia from 30 px down to 18 to fit 212 px; if still too wide and it has a space, wraps on the space nearest the middle (26 px down to 12); a single long word shrinks down to 10 px.
data.js buildCity fill pass: filler `shop` buildings are turned into type `home` with no sign and no awning, and filler `hall` buildings no longer get a random sign. The `pick` calls are kept (results discarded) so the seeded random sequence, and therefore every layout, is unchanged. `C.signs` / `OUT_SIGNS` / `HBR_SIGNS` / `IRN_SIGNS` are now unused by the fill pass. Named plan buildings and vendor shops (`sign` set in the plan or VENDOR_SHOP_LOOK) keep their one sign; the Barber stall keeps its stall sign.
Checked: contact sheet of all 44 distinct sign names fits; townlayout.js passes; p5, p6, p35, p51, p52 pass.

## 19.0.1 Auction timing fix
game.js: `tickAuction` only expires lots now (the old per-minute `saleChance` roll that sold player lots is gone; `saleChance` stays unused). Player listings carry `town` (ahHere() at listing). `tickTownBuying` keeps `marketLocal().townNext[town]` in Date.now ms: first call schedules now + townBuySec; when due, steps = floor(late / period) + 1 (capped at townBuyMaxSteps), each step one `townBuyOnce(town)`. `townBuyOnce` takes only player lots with `(l.town || ahTowns()[0]) === town`, `Date.now() - l.t >= townBuySec` and townEligible; otherwise a mercenary lot (any town, as before). `L.lastTick` (play-seconds clock) is no longer used. menu4 Sell view: eligibility line from townEligible instead of the sale-chance wording. Tests: m5cunit (real-time clock, one lot per town per 20 min, other towns don't buy), p21unit (lot remembers its town).

## 19.1.0 Gates, homes and roads (Phase 3 of the layout request)
- data.js `gateDistrict(o)` builds a 1000x800 gate zone (800x1000 for north/south exits) in a canonical frame (inner city gate at x 0, exit at x W, street along the middle) and transforms it by `o.side` (e/w/s/n): one street, a guard post (`key: guard`), stables (`key: stables`), the exit, the guard, a stablemaster (`home: stables`), an optional quest giver (`home: guard`), a stable decor and two hay piles. `noFill: true` makes buildCity skip the random street fill for that district. Districts may set `w`/`h`.
- Gate zones: Ashenreach `gate` (Eastgate, off [4800, 2300], guard_east, ysolde, rhea). Saltreach `ngate` (North Gate, guard_north, stable_harbor, ilsa) and `egate` (East Gate, guard_pass, stable_harbor_e); Saltreach shifted down 1000 px (all offsets, HARBOR_SHOPS, HARBOR_GATES, walls), source 8200x4600. Ironvale `gate` (Gate Ward, guard_ironvale, stable_ironvale, brisa) and `sgate` (South Gate, guard_ironvale_s, stable_ironvale_s); Ironvale shifted left 1400 px (offsets, IRONVALE_SHOPS, IRONVALE_GATES, walls), source 5800x6400. Ashenreach source is 5800x5400. Exits must stay on the source zone edge so the hall pass and exit re-pointing work; inner gates line up with the neighbouring district's edge.
- `z.stables` (array) replaces the single `z.stable` before the split; splitTown gives each part the stable decor inside it.
- Residential (Ashenreach): Furnishings house (`shop: "odette"`, so frontage stands Odette at its door), the barber stall and barber_outpost, and the Supplies vendor shop, all within about 250 px of the residence door; the residence is about 260 px from the arrival point from the Market. Ironvale barber moved to the South Ward. Saltreach has no residential district; its barber stays on Harbor Square.
- Auction houses carry `shop: "auction_<town>"`, so frontage places the clerk at the door (same rule as vendors). Registrars (`registrar_outpost` at the Hall of Records, `registrar_ironvale` at the Council Hall) use the same `shop` link. NPC look `registrar` in rig.js.
- frontage: door footpaths (lanes) try lateral offsets 0, ±20, ±40, ±60 so they don't cut through a neighbouring house (offset lanes start with a point at the door centre, so the vendor/own-lane checks still find them); unsigned filler houses with no street in reach or no clear lane are dropped (npc `home` indexes are remapped).
- WARP_STONES is generated from each city's districts (centres) and `placeWarpStone(z)` runs after splitTown on every town part: candidates every 24 px along non-lane streets at w/2 + 44 to either side, scored by distance to the zone centre, checked by `spotFree` (road gap, houses, walls, water, plazas, fountains, exit halls, people, stalls, props, benches, lamps, gardens, stable, shop fronts; a second `lax` pass for small zones), with a free spot for the district signpost along the road. Sets `face` toward the road and `ax/ay` (the road edge in front), used by warpToStone as the arrival point and as the part's start when splitTown took it from the stone (`startWs`). models3d rotates every non-bobbing prop by its `idleFace`.
- `keepOffRoads(z)` runs last on every zone with paths: people 16, props/signs 26, stalls 32, props r+2, dressing by type (tree 24, planter 20, statue 26, well 28, cart 36, hay 20, scaled by s), benches 20, racks 22, dummies 16, lamps 8, stable 42 px from any road edge including footpaths; plaza centres are exempt. Folk inside a building are also moved out. Moved folk re-face the nearest street.
- world3d: field `roadGap(px, py)`; `placeable` also refuses spots within `opts.clr` (16) of any road edge unless `opts.path >= 1`; road edge stones sit 6 to 14 px outside the road.
- Name change: `RENAME_COST` 10000; TALK.talkRegistrar → modal `rename` (tabRename, input #renIn, data-a rename). game.js `renameCheck`, `renameChar` (offline: roster uniqueness, takes crystals; online: `netServerOp("rename_character", { new_name })`), `applyRename`. SQL sql/q3-names-towns.sql (schema 10, NET_SCHEMA 10, added to SETUP_SQL): `rename_character` (member, owner, format, unique, cost from config `rename_cost`, updates name, data.name, data.gil, summary.name, linkshell member names, open listings, audit row); `ah_post` gains `town` (old 5-arg version dropped; client retries without town on an old server); `ah_town_pick(want, tid)` only takes player lots 20 minutes old and listed in that town (or with no town).
- TOWN_LAYOUT 3 for all three towns (saved positions in a town reset to its centre once). Tour quests count the new gate zones.
- Tests: test/offroad.js (every zone: npcs, stalls, props, dressing, benches, racks, dummies, lamps, gardens, stable, gather points vs road edges), test/p59unit.js (rename, gate zones, NPC homes, auction clerks, residence distance, warp stones). Updated p5, p13, p49, p51, v1. Harness exports renameChar, closeDialog.


## 19.2.0 Fair drops and local markets (Phase 4)
- data.js (end of file): `applyDropRates()` runs once after all families exist. Ordinary families: non-gear, non-scroll, non-key entries map through `dropTier` (c>=0.2 -> 10-15%, 0.05-0.2 -> 1-5%, 0.01-0.05 -> 0.2-0.8%, below 0.01 and 1.0 unchanged). NM/boss families: equipment (not ammo) maps through `nmGearTier` to 10-20%. Gear and scroll entries in ordinary families keep their chance. `trophyFor` chance goes through `dropTier`. `gearDrop` and `scrollDrop` untouched.
- `applyGearPrices()`: items with `hq` and id `<base>_hq` cost `CONFIG.hqMul` (2) times base; `<base>_hqN` cost `CONFIG.hqPlusMul` (3) times. NM equipment (`nm`, not `ex`) is priced at `CONFIG.nmMul` (3) times the median price of plain gear in the same slot (same wtype for main) within 2 levels (widening to 5).
- `sellPrice` = floor(price * shopMul * `CONFIG.vendorBuy` (0.5)); only `ex` and non-NM `rare` items refuse. `ahTradable` allows NM rare gear; buying a rare you hold is refused (ahBuy, ahBuyLocal, pmbuy).
- Town buying: `AH_CFG.townBuyCeil` 1; `townCeil(id)` = round(price * shopMul * shopRatio * ceil) with no drift; `townEligible` uses it.
- Local markets: `ahMarketSet` = `ahDaily(ahHere())`; `ahStock` = here only; `lotHere(town)` (no town = visible anywhere) filters `marketLines`, `marketItems`, `ahBuyLocal`; `ahBuy` refuses another city's stock; merc lots carry `town`.
- Server: sql/q4-economy.sql (schema 11): `ah_buy(my_char, lot, here)` rejects other cities' lots, `ah_consign(..., town)` stores the city, `ah_town_pick` ceiling 1.0 of the item reference price. sql/m5d-item-ref.sql regenerated (price * shopMul * shopRatio) by test/genrefs.js. net.js falls back to the old signatures if the new ones are missing.
- Tests: test/p60unit.js; m5a, m5c, m5d, p5, p21, p25 updated for the new rules.

## 19.2.1 Mercenary Hall in every city
- data.js: houses `mercs` in Harbor Square (780,1240, `shop: "merc_harbor"`) and the Keep (720,1240, `shop: "merc_ironvale"`); NPCs `merc_harbor` (Dorrin) and `merc_ironvale` (Hild) use `talkBrann`, which only adds quests when `n.id === "brann"`. Models `brann_h` and `brann_i` in rig.js NPC_LOOK. The hire modal text no longer names Brann.

## 19.3.0 Music for every mood
- audio/gen.py: `fight()` builds three battle themes (`battle_easy`, `battle_tough`, `battle_deadly`); `mood(base, kind)` derives night/rain/storm/snow/fog versions of the outpost, hollow and residence themes (retime + circular reverb/lowpass, storm adds taiko and a drone, snow adds bells). Run `python3 audio/gen.py <name>` then delete the .wav files; build.mjs bundles every mp3 in audio/out.
- audio.js: `victoryDef(1|2|3)` give synth sounds `victory`, `victory2`, `victory3`; game.js picks one at random. Playing any of them sets `AUDIO.victoryUntil` (now + 4.2 s) and clears combat state; `desiredMusic` returns null until then and `updateAudio` fades the battle loop out in 0.15 s.
- `desiredMusic` tracks `AUDIO.tier` (max of `conOf` over enemies fighting the party and the engaged target: 1 weak/easy, 2 fair, 3 tough/very tough, 4 incredibly tough), latched while combat lasts. Boss/NM keeps `music_boss`.
- `areaMusic(theme)` + `MUSIC_MOOD`: weather (storm, rain, snow/blizzard, fog) beats night beats the base theme; caves and crypts have one track.

## 19.4.0 Monsters on their feet (monster plan M2, design/monster-plan.md, audit in design/monster-audit.md)
- Cause of goblin sliding: `strideEff` returned two different strides for short legs. The phase integrator used `max(Sl, S·(0.8 + 0.2·rel))` while the leg IK used `Sl·(0.55 + 0.45·rel)`, so with legRel 0.58 the planted foot covered 63% of the ground the body did. Slide = (1 − ik/phase) × speed matched the measured 0.47 m/s and 1.48 m/s exactly.
- Views now carry `v.mob` (models3d `viewFor`). For mob views `strideEff` returns the IK stride for both uses, and `runOf` uses `spd / sqrt(legRel)` (Froude-style) instead of `spd · (0.6 + 0.4·legRel)`, so short legs break into a run sooner and take longer, airier strides instead of a frantic walk. Player races are unchanged (Pipkin players still use the old formula; same slide bug, left for a player-gait pass).
- Settle step: `trackEvents` sets `an.stepping` while a human-rig mob moves faster than 0.8 m/s; once it slows it advances `an.ph` (3π/s) to the next multiple of π (the swing foot passing the planted one) with the IK weight held at 1, then the IK fades and the lifted foot drops into the rest pose. `poseHuman` adds a 0.45 s weight-catch dip when amp falls from above 0.3 to below 0.12 (root −0.032, spine, knees, arms).
- Monster idles: `MOB_IDLES[fam.model]` lists which `idleAct` poses a monster may use (1 look around, 2 stretch, 3 weight shift, 4 scratch, 6 foot scuff); only in `state === "idle"`, not casting or readying, first after 1.5–5.5 s, then every 4–11 s. Players and NPCs keep the old 6–14 s random set.
- Measured (test/gaitprobe.js, planted-foot median): goblin 0.47 → 0.009 m/s walking, 1.48 → 0.09 m/s chasing (about 1 cm per step at 5.5 steps/s; the residue is lateral hip-joint sway the sagittal IK ignores). Ghoul 0.10 → 0.04, Reefkin 0.14 → 0.04 at chase. Model lab: humanoid mob joint gaps stay under 0.5% of height, no page errors.
- gaitprobe now classifies stance with `runOf` (it assumed human run blending before). At 30 fps sampling it overstates slide for fast steppers (the edge frames include touch-down); sample at 120 fps when cadence is above about 4 steps/s.
- Not done in this phase (moved): robe skirts still kick forward on robed goblins and orcs (M1), quadruped and critter gaits (M3, M4).

## 19.5.0 Heavier orcs, rooted treants, real robes (monster plan M1, plus Pipkin stride)
- Stride rule is now one formula for every human rig: `strideEff` returns `Sl·(0.55 + 0.45·rel)` for both the phase integrator and the IK, where `Sl = min(S, (1.25 + 0.9·run·(1 − rel))·L/duty)`; the second term lets short legs over-reach at a run so a Pipkin at 5 m/s takes 13 steps/s rather than 21. `runOf` is `spd / sqrt(legRel)` for everyone. The settle step (`an.stepping`) applies to players, remote players and mercenaries as well as mobs. Pipkin planted-foot slide 0.95 → 0.03 m/s walking, 3.96 → 0.34 m/s at full run (the residue is the price of a half-height body at full speed).
- Robe skirt (`humanEntry`, top type robe or coat): replaced the two thigh-bound half-cylinders with one 7-ring loft from `hipJ + 0.05` to the hem. Two new rigid bones `robeF` / `robeB` (children of hips, ±0.1·gi in z). Weights by angle around the body: within 0.5 rad of front → robeF, within 0.5 rad of back → robeB, the 0.5–1.0 rad bands blend into the nearest thigh, sides → that side's thigh; the top 12 cm blends to hips so the belt stays attached. Hem trim is a second small loft with the same weights (an unweighted `add` with glow when `glowTrim`). `clothSprings` drives robeF from the leading thigh angle, run, acceleration and the mob hunch, and robeB from the trailing thigh, run and bob (spring 60/8 and 55/7). Both bones are in the bridge-skip and rigid sets.
- `L.limb { thigh, calf, upArm, foreArm }` radius multipliers read by the leg loft (`dkY`) and arm loft (`akY`), split at the knee and elbow. `FAMILY_SHAPE` sets them: orc 1.3/1.2/1.35/1.25 with prop girth 1.15, shoulder 0.225, leg 0.8, arm 0.66; treant 1.45/1.55/1.2/1.05 with leg 0.66; ghoul 0.88/0.82/0.85/0.8. `familyLook` merges `sh.limb` the same way as `sh.prop`.
- Treant style is `heavy` (models3d `styleFor`) instead of `prowl`: arms hang at the sides, a slow 0.9 rad/s shoulder sway, spine/chest sway, thighs splayed ±0.12, feet turned out ±0.2.
- Checked: model lab on all 117 families, no page errors, no islands, worst humanoid gap 1.18% (ghoul weapon-skill shoulder, unchanged). Sheets for Tobin, a BLM goblin, a WAR orc and the treant elder (walk, chase, stop, idle).
- Not done: NPC robes also get the new skirt (same code path), which is intended. Quadrupeds and critters are M3/M4.

## 19.6.0 Beasts on four feet (monster plan M3)
- New probe test/quadprobe.js `<html> '["fam",…]' '[px/s,…]'`: for each quad it finds the lowest vertex bound to each shin bone, tracks that point at 120 fps, and reports stance slide (median and 90th percentile of the planted-foot speed when within 3 cm of its lowest height), stance fraction, foot and mesh minimum height, and leg length. The old gaitprobe only tracked hip bones for quads and was meaningless.
- Causes found: (1) `strideEff` had two different quad strides, phase `max(Sq, S·0.55)` vs IK `Sq`, the same bug as the goblins; (2) `quadLegIK` assumed `Ls = leg·0.5` and `dRest = 0.9·(Lt+Ls)`, which left feet hovering 2–7 cm and the stance window mostly unplanted; (3) the lizard alert, attack-rear and hit poses pitch the body about its centre, which on a 0.7 m tail drives the tail 20–50 cm underground.
- quadEntry now records `meta.quad.hipY = B − 0.02`, `Lt = L·0.5 − 0.02`, `Ls = B − L·0.5 − lowestOnBone("shinFL")` (new RigBuilder method: lowest vertex among pieces bound to that bone). quadLegIK solves to `dRest = hipY + rootOff[1] − 0.004` with `reach = 0.995·(Lt+Ls)` and clamps depth above `|Lt − Ls|`. `strideEff` for quads is one formula, `min(S·1.6, reach/duty)` with reach = (Lt+Ls)·(digi 0.55, sprawl 0.9, else 0.76)·scale, and `D = strideLocal·duty·mv` with no second cap.
- Sprawlers: gait stays `sprawl` up to Froude 6 (was 2.2) so lizards never blend into a trot mid-chase; sprawl duty 0.7 (was 0.8); body yaw S-wave `±0.05·sin(ph)` with neck, head and tail counter-yaw; no standing crouch (`rootOff −leg·0.06` for other quads, was 0.098 for all). Alert, attack and hit poses scale body pitch by 0.45–0.55 for sprawlers, counter-rotate `tail`/`tail2` and lift the root; death roll 0.9 rad (was 1.5).
- Plain quad legs (non-slim branch: sheep, ram, lizards, longnecks, Thunderhoof, Gloamhorn): haunch/shoulder ball blended 40% body / 60% leg by height (`addW`), upper leg taper 1.45–1.7× legR to a knee ball, tapered shin, then a hoof (pastern taper + flattened hoof ball on `bone`) or a pad with three toe tapers for lizards. `o.legMass` overrides the haunch size (longneck 0.7). Sheep: hip 0.15, legR 0.05, headR 0.145, neckR 0.1. Longneck: hip 0.24, legR 0.095.
- Tail and neck seated: a ball at each joint, the tail taper starts `tailR·0.4` inside the body, tail2 has a joint ball; neck gets a body-side ball and starts `neckR·0.3` inside. Lizard spines continue down the tail bound to `tail`/`tail2` (they were all on `body` and floated when the tail moved).
- Measured (quadprobe, walk / chase): sheep slide 0.19 → 0.07 / 0.43 → 0.12 m/s; longneck 0.23 → 0.09 / 0.81 → 0.15; lizard 0.54 → 0.20 / 1.3 → 0.31 (the sagittal IK cannot follow the lateral hip swing of a sprawler, so this is the floor without a 3D IK). Model lab: lizard sink 40–88% → 7–15% of height, gaps 8–26% → 4–11%; sheep and longneck gaps 0.1–0.3%. No page errors, no islands.
- Known: modellab reports −22% idle sink on scaled lizards (frost, Pyreclaw) at its test spot; that is the slope pitch sampling real terrain under a 1.3× body, not a rig fault (unscaled lizards at the same spot read −3%).

## 19.7.0 Crawlers, crabs and worms (monster plan M4)
- Measurement: the stock model lab runs at a sloped test spot, so long or wide bodies (worm 2.3 m, crab 1.2 m) read sink from the terrain, not the rig. M4 numbers come from a flat-ground copy of modellab (groundY and footGround forced to 0) plus a lowest-vertex probe that names the bone that digs in per pose (idle, walk 1.2 m/s, run 3.4 m/s, swing, hit, readying). Both live in the session scratchpad; the flat lab is the one to recreate if these families are touched again.
- Crab: legs now pivot at the shell edge (x 0.22, was 0.28, with hip balls on the body and a leg ball at the pivot so the joint stays closed) and each leg has a `knee` bone at the first taper joint. `poseCrab` keeps its own phase `an.cph` (rate `π·spd/(A·reach·cos yaw)`, capped at 30 rad/s so legs do not blur at chase speed); legs alternate in two sets (even/odd leg index, mirrored per side) with yaw sweep `A = 0.3 + 0.2·mv` and lift `max(0, cos p)` split 0.45 hip / 0.7 knee so lifting never drives a foot down. The body yaws 0.55·mv so the crab goes side-on while moving. The strike no longer pitches the body (it yawed and pitched −0.2, which put the far claw and legs 11–20% of height underground); it yaws 0.3 and lifts the root 3 cm; hit roll 0.06 (was pitch −0.2). Claw joint ball on the arm, arm root ball on the body.
- Crawler: joint balls between segments (parent-bound ball with the next segment's radius and a slightly different ellipsoid so the surfaces cross; concentric balls of different radii still read as a gap) and a head joint ball on t5. The body ripple is now an absolute pitch per segment (`pit(i) − pit(i−1)` applied locally) so the cumulative bend is bounded; before, six 0.07 rad pitches with the same sign stacked and pushed the lifted front legs 4 cm under. Leg wave uses its own phase `an.cph` (capped at 3.2 cycles/s; crawler legs are too short to carry 1.2 m/s honestly, so they slide at speed rather than blur), lift 0.45–0.85 rad, sweep 0.3–0.65 rad; legs fade to 30% amplitude when stopped.
- Worm: segments are built sitting on the ground (`yc(i) = 0.92·r + 0.02`, bones at the segment centres) instead of all at y 0.32, which floated the thin tail 12 cm and the head 6 cm. Joint balls between segments. Vertical ripple uses the bounded absolute-pitch form with a π/2 phase step (the old 0.1 rad cumulative ripple over eight segments sagged the chain 18 cm once segments were grounded); lateral S-wave `sin(1.2·ph − 0.9i)·(0.05 + 0.15·mv)`; head segments hold −0.1/−0.12 nose-up while moving. Attack: rear stays up (ease to 1 by 0.4) and the strike only brings the head to a slight dip (net +0.15 rad) instead of easing the rear out and stacking +0.85 rad nose-down, which was the −35% sink; hit recoils up and sideways rather than dipping; death roll sinks 4 cm not 12.
- Toad (`poseHare`, hare-rig kind "hare"): a hop cycle like the hare's (air 55% of the cycle with root lift 0.2·mv, hind legs −0.9 rad in the air and +0.05 on landing, front legs −0.5 / +0.08, body −0.25 / +0.15, head follows). The old walk rotated the hind legs ±0.95 rad about a hip 20 cm up, which drove the 24 cm foot box 12 cm underground. Joint balls at the hip, shoulder and neck; readying crouch added.
- Mandrake: shoulder and hip balls (the arm taper started inside the body by 3 cm with a 4.5 cm radius); leg swing is asymmetric (−0.8 back, −0.3 forward) so the forward swing no longer digs the foot in. Fish: fin plate moved from x 0.25 to 0.21 so it meets the body, plus a fin root ball. Bat: shoulder ball at the wing root. Bee: tail joint ball, strike curl 0.7/0.9 (was 0.9/1.2).
- Measured (flat lab, % of height; before → after): crab worst gap 6.3–10.4 → 1.2, strike sink 11–20 → 0–2.6; crawler gap 3–4.7 → 1.3–3, sink 5–6.5 → 0.2–1.1; worm sink 23–37 → 2–4 and idle float 11 → 0, gap 5.8 → 2–3; toad sink 17 → 1–3, gap 7 → 2.3–4.9; mandrake gap 8.8 → 3.8; fish gap 4.4 → 2; bat 7 → 6 and bee 7 → 5 (membrane and tail rigs have too few vertices for the nearest-vertex metric at low quality; the joint balls close them visibly). No page errors, no islands, 62 unit tests pass.
- Known: crab legs slide above ~1.6 m/s and crawler legs above ~0.3 m/s (phase caps); the lab's gap metric is noisy below about 3% on coarse low-quality spheres; hares were already fine and were not changed.

## 19.8.0 Hate that remembers (monster plan H1)
- Storage: `m.enmity` is still a Map keyed by attacker, but each value is `{ c, v }` (cumulative, volatile); `hateEntry(m, e)` upgrades a bare number in place so older code and tests that `set(e, 50)` still work. `hateOf(m, e)` is the total, `hateScale(m, e, mul)` halves both parts (Smoke Step, High Jump). Proxies keep no local table; `addEnmity` on a proxy queues `(amount, kind)` per `nid|kind` and `netShTick` sends `{ nid, d: 0, en, k }`; `netMobHit` carries `k` too and the host applies it with `raw: true` (the sender already applied bias, crit and Sentinel, so the host stays deterministic for everyone).
- `addEnmity(m, e, amt, opt)`: `opt.kind` is one of `HATE_SPLIT` keys (phys 60% cumulative, magic 50%, ability 50%, heal 70%, volatile 50%); the amount is multiplied by `hateBias(m, kind)` (volatile reads the ability bias), by `CONFIG.critHate` (1.5) × `hateBias(m, "crit")` when `opt.crit`, and by 2 under Sentinel. `applyDamage` passes its `opt` through, so damage call sites tag `kind`/`crit` once; `swing` passes `crit`. `hateAmount` does the same maths for the proxy path. Every ability and spell call site is tagged: weapon skills and swings phys, Provoke and Shield Bash volatile, other abilities ability, cures heal, songs, buffs, nukes, debuffs, drains and resists magic; a debuff whose `enmity` is 150 or more (Flash) is volatile.
- `hateBias(m, k)`: `fam.hate[k]` override, else `HATE_PROFILES[fam.model][k]`, else 1; `crit` is 1 for `fam.nm` or `fam.boss`. Profiles (data.js): skeleton phys 1.3 / magic 0.8 / crit 1.3; orc phys 1.3; worm magic 1.4 / phys 0.8; bat magic 1.35; crab magic 1.25; fishfolk magic 1.3 / heal 1.2; birdfolk ability 1.35 / heal 1.3 / phys 0.9; treant magic 1.3; ghoul heal 1.3; mandrake heal 1.3; lizard crit 1.3; bee ability 1.2 / crit 1.2; hare ability 1.2; goblin ability 1.15; bomb crit 0.8.
- Decay (`decayHate`, combat only): cumulative `× (1 − 0.01·dt)` floored at 1, volatile `× (1 − 0.04·dt) − 5·dt` floored at 0 (CONFIG hateDecayC, hateDecayV, hateDrainV). The first cut (volatile 8%/s + 25/s drain, Provoke 95% volatile) let a 30%-harder hitter take a goblin off a Provoking tank 72% of the time; at a 1%/s cumulative decay the pool is ~100 s of income, so Provoke only matters at steady state if half of it is cumulative. With 50/50 and the slower volatile fade the same scenario holds 100%.
- Switching (`pickHateTarget`): keeps `m.target` unless it is dead or gone from the table; a challenger needs `hate > current × (1 + CONFIG.hateLead 0.1) + 1`, and no swap happens within `CONFIG.hateHold` 1 s of the last (`m.swapAt`; `m.swapFrom` is kept for the H2 alert). `updateMob` logs nothing on a swap yet.
- Flash now exists (SPELLS.flash: PLD 7, 25 MP, 0.5 s cast, 45 s recast, blind pow 0.3 for 12 s, enmity 180 volatile). Help, Dorn's blurb and the tank AI referenced it but no spell was defined, so `acts.find(x => x.id === "flash")` was always empty. `castDebuff` honours a fixed `sp.pow`.
- Companion AI: `hateLead(m, a)` = a's hate ÷ the highest other party member's; tanks Provoke when they are not the target or lead < 1.25, Flash when not the target or lead < 1.5, Sentinel at < 50% HP, not the target, or lead < 1.1. `hateRisk(a, m)` is true when another fighter is alive and `a` is the target or within 85% of the leader: healers skip Dia, Banish and melee and just keep range; nukers skip free nukes (bursts still fire).
- Hold sim (scratchpad h1/holdsim.js: level 10 player + Kael + Mira vs level 10 monster, 6 fights each, target share of combat time): WAR vs goblin tank 100% (old 100%); BLM vs goblin tank 71 / player 25 / Mira 4, 3.7 swaps per fight (old 64 / 30 / 6, 5 swaps); WHM vs goblin tank 100%; BLM vs worm (magic 1.4) player 67 / tank 23 — the bias is visible; BLM vs skeleton (magic 0.8) tank 66; WAR vs worm tank 94, vs skeleton 98.
- Tests: test/h8unit.js (bias per kind, NM crit, crit 1.5×, split and decay, lead and hold rules, dead target, Provoke, Sentinel, cure hate on every engaged monster only, 90 s hold sim). Known pre-existing failure untouched: test/d1unit.js "beasts drop trade goods instead (54 in 400)".
- Saves never stored enmity (mobs respawn on load), so nothing migrates; `netPromote` and proxy snapshots build `{ c, v }` entries.

## 19.9.0 Reading the room (monster plan H2)
- Target frame: new `#tHate` row (template4.html, hud4.js `updateTarget`): shown only for a living monster in combat with a non-empty hate table. Label "On you" / "On <name>" from `m.target` (falls back to `topEnmity`), bar width = `hateOf(m, player) / hateOf(m, top)` clamped to 100, percent text, `.top` class (red gradient) when the holder is the player, gold otherwise. So red-below-full = someone is about to pull, gold-near-full = you are about to pull. Visible in both the glass and the ffSide layout (ffSide hides the other info rows; this one is kept at 10px).
- Swap alert: `hateSwap(m, from, to)` in game.js replaces the inline `swapAt/swapFrom` assignment in `updateMob`. Proxies and non-party targets return early. Onto the player: log "<Monster> turns on you!" (foe colour) every time, `popText` "‼" 28px red, red `ring`. Onto a companion: log "<Monster> turns on <name>!" (sys) throttled to one per 2 s per monster via `m.swapLog`, "!" 22px gold, gold ring. The floaters/effects already render in 3D, so no new sprite code.
- Temper text: `HATE_WORDS` (phys steel, magic spells, ability job abilities, heal healers, crit critical hits), `hateTemper(fam)` builds "Resents X [and Y] most; shrugs off Z." from `hateBias` (so `fam.hate` overrides and the NM crit rule apply), or "No particular grudge; it fights whoever hurts it most." when every bias is 1. `temperLine(fam, bestiaryEntry)` gates it on kills ≥ 5 (NM 1), else "Fight it more to learn its temper (N more)." Used in `inspectText` (hud4.js, skipped for monster pets) and `dbBeasts` (menu4.js, after the behaviour line).
- Help: three bullets in Combat (reading hate, swap alert, temper). Updates entry 19.9.0.
- Tests: test/h9unit.js (16 checks: temper wording per family, flat profile, kill thresholds incl. NM, swap fields, log text, floater glyphs, ring, throttle). harness exports `hateTemper`, `temperLine`, `hateSwap`. Screenshot check in the scratchpad (h2/hateshot.js) confirmed the row in the ffSide layout at 1280×720 and the Database lines.
- Known: the bar reads the hate table once per HUD frame via `topEnmity`, which also prunes dead entries; harmless but it means the HUD does a little rules work. Remote (shared-zone) monsters only show the row when the proxy has a local hate table, which it usually does not.

## 19.10.0 Room to breathe (town plan T1)
- Found: of 631 houses across the three cities (every district and gate zone counted), almost all had no NPC, no door exit and no shop (for example Ashenreach Government 46 of 50, Saltreach Docks 26 of 26). Floating audit on 19.9.0 (new `test/floatcheck.js`, 1172 objects in the 17 town zones): 0 floating, 0 sunk, so the old placement was already seated; the audit now guards the new fillers. Vendor walk-ups: all clear already. Signs: 27 of the signed buildings had no NPC, shop or door behind them.
- Prune: `buildCity` rolls each street slot; a slot keeps its house with probability 0.6 on a 56 wide street and 0.36 on narrower ones. Dropped slots get a filler 60% of the time (`placeFiller`, data.js) and are added to `reserve` so later houses do not crowd them. Houses 631 to 323 (Ashenreach 228 to 122, Saltreach 178 to 93, Ironvale 225 to 108). Fixed and key houses are never rolled.
- Fillers: `FILLER_MENUS` (res, market, civic, work) picked by `fillerMenu` from the district's fill weights; Saltreach non-residential districts add `netrack`, Ironvale work districts `minecart` and others `woodpile`; Saltreach also gets a fixed `boatramp` on Harbor Square and The Docks. Types are `z.gardens` (garden), `z.props` (crates, barrels, anvil, with collision radius), and `z.dressing` entries with `t` of well, cart, shrine, tower, forge, laundry, netrack, minecart, woodpile, boatramp, tree (courtyard, plus two benches). Models are in `buildCityBuildings` (world3d.js, the dressing loop); footprint radii for seating are `DRESS_R`. Net new objects: Ashenreach +72, Saltreach +65, Ironvale +56 (193).
- Seating: `footY(field, x, y, rw)` seats stalls, props and dressing on the lowest point of the footprint; `footGround` in models3d.js does the same for prop NPCs (ring of 14 units).
- floatcheck usage: `node test/floatcheck.js /abs/path/index.html ['["zone",...]'] [limit]` (headless, needs a phase 4 build; about 5 minutes for all zones, 11 on a busy machine); `LIST=1` prints the zone list. It samples footprint corners and edges against `W3.field.heightAt` and reports bases more than 5 cm above or 15 cm (35 cm for tall props) below ground; exit code 1 on any hit. Result on 19.10.0: 1222 objects over towns and fields, 0 floating, 1 sunk (the Mire Camp prop at 3322,1120 on a steep marsh slope, 0.37 m on the uphill side; existed before, left).
- Sign audit: `auditSigns(z)` (data.js, after `settleTownFolk`) removes `h.sign` (kept as `h.hadSign`) from any house that is not a shop, a home, an NPC's `home`, a door exit target or within 60 of an NPC, and strips stall signs with no NPC nearby. 25 removed: Ashenreach Barracks, Chapel of the Dawn, Market Hall, The Ember Mug, Woodworkers, Alchemists, Tannery; Saltreach Fish Market, Smokehouse, Net Loft, Chandlery, Harbor Master, Outfitters Hall, Sailors' Rest, Shipwright, Sawmill, Ropewalk, Customs, Pilots' Hall; Ironvale Frost Guard, Hearth Chapel, General Store, Anvil & Ale, Hearthstone Inn, Grain Store. Ironvale's Job Master gained `shop: "job_ironvale"` so it keeps its sign. Sign data: `z.houses[i].sign` (text), `.signCol`, `.shop` (vendor npc id), `.home` (residence); vendor signs are drawn by `shopFront`, building name boards in `buildCityBuildings`. `test/townlayout.js` now fails any sign without a shop, NPC or door.
- Vendors: walk-up test in `test/townlayout.js` marches 200 units out of each vendor along its facing and fails on a building (other than its own shop), stall, dressing, prop, garden, water or city wall before the street. Nothing needed moving on 19.9.0 and nothing needed moving after the prune. `buildCity` keys now include the district (`did:key`) so two districts can reuse a key.
- Residence: the residence house carries `home: true`; `homeSignText()` gives "Home of <name>" and `refreshHomeSign()` (called from `applyRename`) repaints the sign texture. `zoneMapCanvas` draws a gold house with "Home" at the residence door exit on the Map, `drawMinimap` a gold house arrow. `watchProgress` fires once per character when the zone has a `residence` exit: sets `save.homeShown`, banner "YOUR RESIDENCE", toast and log line.
- Warp stones: house shuffling moved Ashenreach Government's stone landing; `test/p51unit.js` now reads the stone's `ax`/`ay` from the zone entry instead of assuming y + 70.
- Updates tab: items now render `<b>` as bold (the escape turned it into literal tags); checked in the built game.
- Tests: all unit tests pass except the known `test/d1unit.js` beasts drop trade goods check; `test/townlayout.js` passes with the new walk-up and sign checks.
- Residuals: fields were audited for floating but not pruned or given fillers (T4); the marsh camp slope; fillers are static, so no ambient life (by request); T2 and T3 should add set pieces through the same `z.dressing` and `DRESS_R` path.


## 19.11.0 House rules
- Hotkey bar: `#bottom` is now docked right, `width = #ffSide.offsetWidth` and `bottom = ffSide height + 10 (+ mpBox / mobBar heights when shown)`, set every frame in the HUD update (hud4.js, next to the mobBar line); z-index 5 so it draws over `#ffSide` (4). `#actionBar` is a 5-column grid, square slots, `row-gap 14px` for the labels. The first load of this version resets `settings.barPos` once (`settings.barDocked`). The grip drag still adds a translate on top of the dock.
- Event log: `#chat.lite #log` is clickable; a pointerdown on `#log` sets `UI.chatPin` and `UI.logClick`; while pinned the log shows `logFull() * 2` rows with `overflow-y:auto`, history cap 500 lines (was 250). A pointerdown outside `#chat, #btnChat, #logTap` unpins only click-pinned logs; Esc and the chat button still work as before.
- Quest tracker: `#tracker` moved out of `#topRight` to `#ui`, top-left under the top bar (`top = 46px`, or below `#ffStat` while the combat bars show). `trackerEntries()` builds Story (`storyChapter/storyStep`), Quests (`questProgress`) and Bounties (`save.guild.active`) rows. `trackerBlocked()` hides it while `S.modal`, `S.dialog`, `UI.confirmOpen`, `UI.cmd` or the status overlay (`#ui.stOn`) are open. The Settings toggle `settings.tracker` already existed and now covers all rows. The old `display:none` at the smallest width was removed.
- XP: `giveReward` and `rewardChips` ignore `xp`, `bountyReward` has no `xp`, `fillTrade` gives none. Landmark discovery, battlefields and kills still give XP.
- Group XP: `partyShare(n) = clamp(1 - CONFIG.partyXpCut * (n - 1), CONFIG.partyXpFloor, 1)` with cut 0.25, floor 0.2; the old `CONFIG.partyShare` table is gone. `killRewards` uses `n = 1 + network mates + mercsWith()` (mercenaries have `mercId`; pets do not count). Solo kills with mercenaries now also use the share; network mates receive `partyShare(n)` of their own party size.
- Mercenaries: `CONFIG.maxParty` 6 → 4 (player + 3). `normalizeSave` still slices `hired` to `maxParty - 1`, so older saves keep their first three. Achievement "Full Party" now needs 3.
- Auction: `ahEssenceFee(id) = max(1, ceil(base price / 1000))` Essence crystals (items with `kind: "crystal"`, any element) on top of the crystal fee; `spendEssence` takes from the element held most. Listing an Essence stack needs the fee besides the lot. `ahDaily` skips `kind: "crystal"`, so towns never stock Essence themselves; `townRelist` and the mercenary consign path are untouched, so sold Essence is relisted normally. `ahCategory` files slots `main`, `ranged` and `ammo` under Weapons.
- Icons: ranged items now keep their own `wtype` for icons (`instrument`, `throwing`); new flute, horn (name /horn|cornette/) and harp drawings and a boomerang curve in icons.js. Other ranged items still draw as bows.
- Floating rocks: `placeable()` (and the exit-pass rock loop, which was the real culprit) now rejects points within two cells of the field edge or outside it. The exit-pass loop picked points up to 450 units from an exit with no bounds check, and `heightAt` clamps to the grid edge, so rocks off the mesh hung at the edge height. Verified with a raycast probe (scratch `rockray.js`): for every instanced object, ray down onto the terrain mesh and compare, instead of comparing against `heightAt` as test/floatcheck.js does. Before: West Meadows 58 of 807 rocks had no ground below them; after: 0 of 2,826 instances.
- Tests: new test/q1unit.js (party share, no quest XP, Essence fee tiers, no Essence in daily stock, listing spends Essence); test/p1unit.js now hires three; test/harness.js exports `partyShare`, `mercsWith`, `ahEssenceFee`, `essenceHeld`, `giveReward`, `bountyReward`, `ahDaily`.
- New test/meshcheck.js `<abs html> '["zone",…]'` prints, per zone, how many instanced objects float more than 0.35 m above (rocks) or sit off the terrain mesh (everything), with the worst five.


## 19.12.0 Skylines and Steps (town plan T2) plus requests
- T2 data (data.js, before `roadPts`): `DEPTH_ZONES` per district zone (pieces: belltower, spire, chimney, crane, beacon; optional terrace lift; optional loading scene), `STREET_KIT` per district role, `depthSpot` (30-unit grid search), `depthTerrace(z, lift)` (plaza or big-hall plinth, ramp 32, removes soft objects inside, builds `z.terrace`, `z.terraceWalls`, `z.terraceSteps` and a `terrace` feature), `cityDepth(zid)`, then `z.ghost.marks` for skyline silhouettes of neighbouring districts.
- Render (world3d.js): `terrace` feature lifts heights in `buildFieldSteps`; `setPiece` models for the new dressing types and `fxAdd` smoke/flame via `W3.cityFx`, animated in `updateCityAnim`; terrace walls get colliders; `buildSkyline` draws `G.marks`. `DRESS_R` has radii for the new types; test/floatcheck.js DR table too.
- Mercenary slots: `mercSlots()` = 1/2/3 at highest job level 5/10/15 (0 below 5); `mercFull()`; `CONFIG.mercSlotFloorLv` is a test-only floor. Hire and rehire both check it.
- Guild: `GUILD_PERKS` (data.js): potion 4, ether 8, `guild_scroll` 30 (Bronze), crystal 90 (Iron), common 250 (Silver), uncommon 700 (Gold), rare 1800 (Mythril). `guildPerkItem` seeds by created+day+perk; pools in `guildPool` (mat, equip, spell scrolls, recipes; scroll/recipe rarity by price <150/<500/else); `save.guild.bought` resets with the day; `guildBuy("g_...")` routes to `guildBuyPerk`. `guild_scroll` (`guildWarp`) enters `outpost` start.
- Auction: `ahList(id, qty, price, essId)` spends the chosen Essence; menu4 `ahEssPick`/`ahEssRow`, `UI.ahEss`.
- Hidden Cache: `z.cacheId` instead of a fixed npc; `dailyCache(z)` (seeded by created+id+day, `CONFIG.cacheChance` 0.25, `poiSpot`) appended in `enterZone`; `openChest` on a `poi: "cache"` sets `save.cacheDone[id] = day` and `n.gone`. Chest lid is now box geometry (the half-cylinder rendered inside out).
- Mob names: `buildMob` name = family name + job name when a job is rolled.
- Bat: `poseBat` guards missing wing bones (`setZ`).
- Audio: `victoryDef` lead and bell an octave lower.
- Tests: g1unit.js (guild perks, scroll, essence choice), c1unit.js (cache), p1unit.js slot gating; p7/p10/p29/p50 set `mercSlotFloorLv`.
- Known: d1unit trade-goods check is random-sensitive; marsh camp sunk 0.37 m.


## 19.13.0 Finding your way (town plan T3) plus requests
- Services (game.js, before `boardToday`): `SERVICE_BY_SHOP` (vendor roles) and `SERVICE_BY_TALK` (talk handler to icon and label), `serviceOf(def)`, `townServices(area)` (per NPC: label, icon, zone, local x/y, area x/y, district name/id), `compassWord`, `serviceDirections`, `guardWhere(n, kind)` (nearest by area coordinates; sets `S.guide` only when the target is in the current zone), `guardMenu(n, more)` (shop kinds first, "Other services..." second page). `TALK.talkGuard` gets a "Where can I find...?" option.
- Signpost: `TALK.talkDistrictSign` lists the current district shops and, per other district, direction plus its shop kinds.
- UI: minimap draws `serviceOf` icons (counter-rotated emoji) and the `S.guide` diamond (cleared within 70 units); the zone map prefixes icons and draws the guide star; `citySVG` has a ring and "You are here" text; `cityIntro()` (hud4, called on zone change) shows a banner with district chips once per city (`save.cityIntro[area]`).
- Residence: `delivery_box` NPC (chest prop, `talkDeliveryBox`) collects `save.market.box` via `ahCollect` and the online box via `netAhCollect`; the auction window no longer has Collect buttons.
- Auction: listings never expire (`tickAuction` no longer returns lots; `exp` removed; `townPick` uses `l.t`); tab renamed My listings. Online player lots still expire server side (48 h, not changeable in the client).
- Warp stone first touch: ring, vfx, sound, popText and the "attuned" log line.
- Barber: `renderPreview` is now called from the in-game frame branch in main4.js while `UI.creating`, which was why the preview was blank in game. `.ccFaces` uses `minmax(0, 1fr)`, face images fill the tile.
- Hotbar: `#bottom #actionBar .slot` uses `contain: size` and `min-height: 0` so image icons cannot stretch a slot.
- Tests: t3unit.js (services, signpost, guard, menu size).


## 19.13.1 Listings that stay
- Online player lots: `ah_listings.expires_at` defaulted to now + 48 hours (sql/setup.sql). sql/r1-no-expiry.sql sets the column default to `infinity` and sets open player lots to `infinity`. It must be run in the game's Supabase SQL editor (project mztqrqgtlvviwwftrqhs; the connected Supabase tools only see FreeSpace 4X and Void Drift). Existing queries (`expires_at > now()`) keep working with infinity.
- Client: `pmLeft` shows "no time limit" when the date is not finite or more than ~10 years away; help text no longer mentions 48 hours.


## 19.13.2 Fresh bounties
- `guildDay()` = `boardDay()` + floor(`save.waitHours` / 24); `stopWait` adds the hours waited to `save.waitHours`. Only the guild board and guild daily supplies use it (market, caches and trade board stay on the real day).
- `guildToday()`: the old three, then for each rank r in 1..rank one extra bounty of tier r (not already chosen).
- Phone CSS (template4.html, end of the dock block): pager on top, 4 slot columns, `.ic` absolutely centred, target name ellipsised inside `#ffSide #target`.
- GUILD_SHOP (fixed gear: Guild Ring, boots, sigil, rings, harness) emptied and its section hidden; GUILD_PERKS (potion, ether, warp, random crystal/finds) unchanged.
- Merc lot sales (town buys, or you buying one) no longer call townPayBox: proceeds vanish. Delivery Box talk text updated.
- Backdrop `mark: "tree"` removed from hollow/marsh/verdant (it drew a giant gray floating tree silhouette on the horizon).

## 19.13.3 Guild tidy-up
- GUILD_SHOP emptied and its list section hidden; GUILD_PERKS (incl. random daily finds) restored after a wrong removal in 19.13.2.

## 19.14.0 Weapon grip and carry (W1) and wait fix
- Wait fix: a wait that finishes now adds exactly its hours to `save.waitHours` (it used to add `done/msPerHour`, which finished a hair under 24 so the guild day never advanced); `guildDay` adds 0.002 before flooring.
- Carry: `HIP_KINDS` in models3d.js (sword, katana, dagger, axe, club; value = backward tilt) mount the weapon on the `hips` bone at the left hip (`thighL.x + 0.07`), blade down, tilted back, tip flared out; `carryBone(v)` picks hips or chest everywhere the weapon is parented. Others keep the back pose.
- Draw/sheathe arm pose: `HIP_DRAW` in anim.js reaches the right arm across to the left hip for the same kinds; others keep the over-shoulder reach. Timings unchanged (W2 will rework draw timing and remove `wBlend`).
- Scratch pose test: a script forcing `v.wTr.t0` every frame to freeze a draw phase, screenshot from behind and front.

## 19.15.0 Quick draw (W2)
- `WEAPON_DRAW_TIME` 0.35 s, `WEAPON_SHEATHE_TIME` 0.45 s (were 2 and 3). The weapon swaps parent (carry bone <-> `handR`) at half the transition with `attach` so world position is unchanged, then `v.wEase` (renamed from `wBlend`, 35% of the transition) eases only its local pose in the new parent, so it never travels freely. A swing during a draw snaps it to the hand after 0.05 s.
- Arm poses in anim.js (`v.wTr` block) scale with `wTr.dur`, so they speed up automatically.

## 19.16.0 Off the beaten path (T4)
- data.js `addFieldFeatures(zid)` (after splits, before POI_PLAN) builds `z.sites` for each outdoor zone: one site per landmark not in `FEATURE_SKIP` (landmarks that already have built things), kind rotates clearing / overlook / ruin from `hashStr(zid) % 3`. `featureSpot` searches around the landmark for a spot 30–340 beyond a path edge (`pathGap`), clear of exits (460), walls, water, NPCs, spawns, ruins and other sites.
- ruin: appends three broken wall runs and two pillars to `z.ruins` (so `buildRuins` draws them and game.js turns them into collision rects). overlook: also pushes a `plateau` terrain feature (r 170, h 2.4, `site: true`) into `z.features` so it sits on a small rise. Note `z.features` = terrain features (ravine/plateau/terrace); sites are `z.sites`.
- world3d `buildSites` draws clearings (ring of 7–9 standing stones and a flat altar stone) and overlooks (five low wall blocks in an arc facing the nearest zone edge, a bench, a four-stone cairn), with colliders. `placeable` keeps vegetation/props `r + 25` away from every site.
- POI_PLAN extended to sunscar, verdant, cinder, gullisle and the three highlands zones (kinds split so ids `kind_area` stay unique); POI_LORE added for sunscar, verdant, cinder, gullisle, highlands. `poiSpot` first looks for a spot 40–230 from a path edge and away from sites, then falls back to the old search.
- Floating audit (test/meshcheck.js) over all outdoor zones: results in the release notes below.
- `instanced()` hides (zero scale, index kept) any instance placed outside the terrain grid, and the water-edge reed ring requires `onTerrain`. Audit before: Gull Isle 235 off-mesh (233 reeds around the sea circle, 2 others at the grid edge), Windreach Foothills 1; all other outdoor zones 0.

## 19.17.0 Stand your ground
- hud4.js `drawWait` builds the Time box once (`el.dataset.mode = "run"`) and updates `.tbNow`, `.tbBar i` and `.tbProg` in place via `setHtml`/`setTxt`; it used to rebuild innerHTML about every 50 ms, which swallowed the Stop click. `renderTimeBox` and `closeTimeBox` set and clear `dataset.mode`.
- game.js `allyStandTick` (before `keepCasterRange`): a ranged hire (`allyRanged`) whose back-off (`noteBackoff` sets `a.backAt`) keeps happening while a threat targets it within `CONFIG.allyKiteDist` for `CONFIG.allyChaseSecs` sets `a.standUntil = S.time + CONFIG.allyStandSecs`. While standing, `keepCasterRange` skips the 110 px back-off and `a.kiting` is false. Resting or sitting modes and the low-HP kite flee branch do not stand, so dying hires keep running. Death and zone change reset `standUntil` and `chaseT`.
- data.js CONFIG: `allyStandSecs: 30`, `allyChaseSecs: 1.5`. Test: test/p31unit.js.
- Blade orientation check: stance and swing sheets for sword, dagger, axe, club, tachi, greataxe, great sword, kunai, polearm, scythe, staff show forward-pointing blades; no pose change made.
- animation-plan.md touched in the release commit to carry a neutral commit message.

## 19.18.0 Welcome tour
- hud4.js `TUT_STEPS` (icon, title, html) holds the 14 tutorial pages; `tutOpen(i)` renders into `#tutBox` (template4.html, z-index 62 above the confirm box), `tutClose()` sets `save.tutSeen = 1` and saves, `tutStart()` closes any menu and opens page 0, `tutInit()` (called before `boot()` in main4.js) wires Next, Back and Skip and a capture-phase keydown (Esc closes, Enter or right arrow next, left arrow back) active only while `TUT.on`.
- main4.js `enterWorld` end: if `!save.tutSeen`, opens the tour after 2.2 s. Existing characters have no flag, so they see it once. The flag is part of the character save.
- menu4.js: Config, More row gets `data-a="tutorial"` handled in the action chain; Help Controls gets a Tutorial line; Updates 19.18.0.
- The word "Capstone" from the request is not a game term; the crystals and warp stones page was written as the closest match. Edit that page in `TUT_STEPS` if something else was meant.
- Test: scratch Playwright run (mock login): auto-show, Enter x2 reaches page 3, Esc closes and sets `tutSeen`, Config button replays, Skip closes; no page errors.
