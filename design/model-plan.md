# Master plan from v13.4.0 (phases 88–115)

Done one phase at a time; each phase = new version, Help + Updates text, design docs, build, tests, push to GitHub, index.html delivered.
Rules: no code comments; keep low/medium/high quality tiers; check Low on phones; original names and art (era-style look, nothing copied).

## Track 0: classic MMO-style character creation (priority, before Track 5)
Requested 2026-10-14. Goal: recreate the feel of the classic MMO creation screen with an original look (no copied art or names). Flow is exactly four steps: Race → Gender (skipped for Ursan, locked male, and Nekari, locked female, like Galka and Mithra) → Face type → Hair color → Physical size (small, medium, large). Name and starting job stay on a final confirm step. Faces move to a cartoon/anime style like classic MMO: large glossy eyes, small nose and mouth, soft jaw, simple eyebrows. Opus recommended for 110.1 (face meshes and paint), Sonnet is enough for 110.2 and 110.3.
| Phase | Ver | Name | Scope |
|---|---|---|---|
| 110.1 ✅ | 15.5.0 | Anime faces | Redo the face paint and head shape for all five races in a stylised cartoon/anime style: big shaded eyes with highlights, tiny nose, small mouth, thin brows, softer jaw and cheeks; 8 face types per race and gender (replaces the current 16 realistic faces; old saves map to the nearest type); expressions, lip-sync and look-at keep working |
| 110.2 ✅ | 15.6.0 | Creation flow | Rebuild the creator as four sequential screens with a live 3D preview on the left and Back/Next: Race (five races with blurb and stat bonuses) → Gender (skipped for locked-gender races) → Face type (grid of eight) → Hair color (palette of 8 to 10 colours; hair style comes from the face type) → Physical size (Small, Medium, Large, changing height and build; cosmetic only, as in classic MMO). Fits phones without scrolling; saves old characters unchanged |
| 110.3 | 15.7.0 | Confirm and polish | Final summary screen with name entry, starting job and a rotating preview; click sounds; a "start over" button; size shown on the Status screen; Help and Updates updated; tests for every race/gender/face/hair/size combination |

## Track 1: models (88–98)
| Phase | Ver | Name | Scope |
|---|---|---|---|
| 88 | 13.5.0 | Sculpted heads | Parametric head mesh (jaw, chin, brow, eye sockets, cheekbones, nose, lips) per race and per monster type; realistic face paint (almond eyes, iris, lashes, brows, nostrils, lips); hair shell with hairline and fringe instead of cards; skeleton mandible; cactus monster rebuilt as a real ribbed cactus; atlas 512 px per cell on High |
| 89 | 13.6.0 | Lofted bodies | One continuous body skin per race (shoulders, chest, hips, neck flow), 2–3 bone weights across joints |
| 90 | 13.7.0 | Hands, feet, animal heads | Five-finger hands with grip/fist/open poses; shaped feet and boots; muzzles and skulls for quadrupeds, hares, bats, lizards, birds |
| 91 | 13.8.0 | Textures | Higher-detail painted atlas (cloth weave, leather grain, engraved metal, embroidery, wear), baked shading, per-region normals |
| 92 | 13.9.0 | Faces and expression | 16 faces per race; jaw and brow bones; talk, emote and combat expressions; mouth movement in dialogue |
| 93 | 14.0.0 | Hair and cloth | Layered hair, 16 styles; swinging capes, robe skirts, sleeves, tabards, long hair |
| 94 | 14.1.0 | Armour and weapons | Armour fitted to the new bodies; tiered sets per job (22 jobs); detailed weapons (bevels, engraving, gems, glow) |
| 95 ✅ | 14.2.0 | NPCs | Unique outfits and held props for every named NPC; townsfolk wardrobe generator |
| 96 ✅ | 14.3.0 | Beastmen and bosses | Goblins, orcs, Reefkin, Crag Talons, treants, undead, bosses rebuilt; family textures; armour variants |
| 97 ✅ | 14.4.0 | Critters | Bee, crawler, sheep, lizard, crab, toad, bat, worm, fish, mandrake, shroom, Thornstrider rebuilt; fur/feather shells on High |
| 98 ✅ | 14.5.0 | Monster limbs and motion | Every monster gets real jointed arms/legs; gaits per body plan (biped, quadruped walk/trot/gallop, six-legged, crab, bird, wings, serpent); feet planted on terrain; weight shift and follow-through; attack, hit, idle and death poses |

## Track 2: sound and icons (99–101)
| 99 ✅ | 14.6.0 | Interface sounds | Classic menu sounds everywhere: cursor move, confirm, cancel, error, window open/close, page turn, tab, target, equip, buy/sell, chat tell/party chime, level-up, quest |
| 100 ✅ | 14.7.0 | More sound effects | Footsteps per surface (grass, stone, wood, snow, sand, water), per-weapon swings and hits, per-element spells, monster voices per family (idle, aggro, hurt, death), doors, chests, crafting, fishing, mount, weather, town crowds |
| 101 ✅ | 14.8.0 | Item icons | Painted icons for every item instead of emoji: weapons by type and tier (sword, dagger, axe, great axe, scythe, staff, club, bow, katana, polearm...), armour by slot, materials, food, scrolls, key items; rarity frames |

## Track 3: environments (102–105)
| 102 ✅ | 14.9.0 | Terrain and cliffs | Rock cliff meshes with strata instead of smooth ridges; higher-detail ground textures (grass, dirt, sand, snow, moss); paths with edging stones and wheel ruts |
| 103 ✅ | 14.10.0 | Foliage and props | Denser, layered trees and bushes, ferns, reeds, mushrooms, fences, carts, signs, bridges, ruins with arches, campfires; per-zone prop sets |
| 104 ✅ | 14.11.0 | Light and atmosphere | Light shafts, better water shores, distant scenery, colour per zone and hour, cave lighting |
| 105 ✅ | 14.12.0 | Dungeons | Cave and crypt walls with real rock/brick meshes, stairs, pillars, doors, torches and set dressing |

## Track 4: cities (106–110)
| 106 ✅ | 15.0.0 | District framework | Towns split into districts (residential, market, industrial, government, plus harbor/gate) joined by gate halls; district banners, map names, saved location per district |
| 107 ✅ | 15.1.0 | Outpost city | Residential (houses, residence, Pip, gardens), Market (Pell, Odette, Luna, auction, Trade Board, stalls), Industrial (Garrick's forge, crafting halls, mill, warehouses), Government (Rhea's barracks, Guild/Maera, Mercenary Hall/Brann, Tobin, city hall); laid-out streets, plazas, walls, gates, multi-storey buildings with detailed facades |
| 108 ✅ | 15.2.0 | Harbor and Ironvale | Same for Saltreach (docks, fish market, ferry) and Ironvale (mines, smelters, keep); a distinct building style per city |
| 109 ✅ | 15.3.0 | Warp stones | A warp stone in every district: free warps within the city, paid warps to attuned stones in other cities; /warp; minimap icon |
| 110 ✅ | 15.4.0 | City life | Townsfolk with district schedules, guard patrols, market crowds, side quests per district, district music and ambience, signposts |

## Track 5: wilderness (111–115)
| 111 | 16.0.0 | Region framework | Each wilderness area becomes a region of several connected zones; save migration; atlas, conquest, quests, bounties, expeditions re-pointed; level band per zone |
| 112 | 16.1.0 | Rocky Hollow + Windreach | Hollow in 3 zones (West Meadows 1–3, Mirror Lake 3–5, Eastern Ruins 5–7), Highlands in 3 |
| 113 | 16.2.0 | Marsh, Frost, Jungle | 2–3 zones each |
| 114 | 16.3.0 | Desert, Cinder, Gull Isle | 2–3 zones each |
| 115 | 16.4.0 | Points of interest | 4–6 spots per zone: caves, camps, wrecks, NM lairs, overlooks, waterfalls, rare gathering, lore ruins, small puzzles and treasure |

## Added on request (done)
- v14.2.0: head look-at, red damage numbers + toggle, V torsos/necks, Pipkin feet, status icon spacing, remove one Outpost walker, audio unlock.
- v14.5.0 (with 98): feet planted when turning in place; spells learnable only by main job (or support job at half level) at the spell's level; no action-bar option on spell scrolls.

Open questions: real-phone cost of 512 px atlas cells and cloth physics (High only for now); more zones means more loading screens (about 1–2 s each on phones), still better than one huge map for frame rates.
