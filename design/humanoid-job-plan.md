# Humanoid monster jobs plan (drafted 2026-10-16, not built)

Requested 2026-10-16: humanoid monsters can be any job of the game and know the spells and abilities of that job at their level. Each job has its own armour and weapon on the monster (cosmetic only). The Wandering Sapling stops being humanoid and becomes a walking brown flower bulb.

## What exists today
- `FAMILIES` (data.js) is one entry per monster kind. A family has one `model` (goblin, orc, fishfolk, birdfolk, skeleton, ghoul, treant...), one `tpMove`, and optionally `spells` (list of `{id, mul|status|heal}`) and `castGap`. Casters are separate families: Goblin Apprentice, Conjurer, Mire Hexer, Frost Shaman, Crag Chanter. `tierFam(base, o)` copies a family for the later zones.
- Casting: `startMobCast` and `finishMobCast` (game.js) handle only cure (heal), nukes by `mul`, and `status` debuffs. No buffs, no damage-over-time, no abilities.
- Looks: `mobLook` (rig.js) returns a fixed `look` per family key (`goblinLook(variant)` for goblins). Seven existing goblin variants are already "jobs in disguise" (raider = thief, apprentice/conjurer/hexer/shaman = casters, chieftain = warrior).
- Players: `SPELLS[id].jobs = { JOB: level }`, `ABILITIES[id] = { job, lv }`, `WEAPON_SKILLS[id] = { wtype, skill }` already say what each job knows at each level.
- Weapons the rig can draw today: sword, dagger, staff, club, greataxe, gsword, polearm, archery. Scythe, katana, h2h and instruments are not drawn on monsters yet.
- Sapling: `sapling` family (model `treant`, rig kind `human` with leaf head) and `jungle_sapling` (a `tierFam` copy, so it inherits the model). Elder Treant, Old Mossback and the Rime Treant stay treants.

## Design

### 1. Which monsters get jobs
Humanoid families only: goblins (all variants), orcs, Reefkin, Crag Talons, skeletons, ghouls and the drowned. Animals, plants, bombs, bats, worms and the like never get a job. Named monsters and bosses keep their hand-made look and kit (they may be given a fixed job later).

### 2. Job roll
- Any humanoid can be any job. No lore tables and no per-family job lists: the roll is uniform over every job (guess: each job equally likely, with a small bonus to the three starting jobs so ordinary fights are not all exotic).
- Goblin Conjurer and Frost Shaman are removed in H1 (families, looks and loot rows). Their spawn spots become the plain goblin family of that zone (Goblin Raider, Frost Goblin), which now rolls a job like every other humanoid, so casters still appear but at random. Their scroll drops (Stone, Blizzard) move to the plain goblin loot lists at the same low chance. Guess: Goblin Apprentice, Mire Hexer and Crag Chanter get the same treatment, since a fixed caster family no longer has a reason to exist; tell me if you want any of those kept.

- Rolled in `spawnMob`/`buildMob` and stored on the mob (`m.job`). Linked packs (`linkGroup`) roll with a bias so a pack of three is usually a mix of roles, not three of the same.

### 3. Kit from job and level
- Spells: all `SPELLS` entries where `jobs[job] <= mob level`, trimmed to a short list (at most 4): the best heal, the best nuke, one debuff, one buff. Mob level is capped like players are (a level 6 goblin RDM has Gleam, Cure, Protect, not Cure II).
- Abilities: `ABILITIES` entries with `job` and `lv <= mob level`. Mobs use the self buffs (Frenzy, Surge, Shadow Strike, Desperate Oath...) and only a short whitelist of the rest. Skip abilities that need a pet or player-only state.
- Big moves (when TP is full): 50% the family's own monster ability (Bomb Toss, Battle Roar, Water Lance, Talon Dive...), 50% a job move. A job move is a spell for a caster job (the best nuke, debuff or heal-aoe it knows, cast as an instant TP-style move with the spell's element and effect) or a weapon skill for a fighting job (from `WEAPON_SKILLS` for its weapon type and level). If the job has no job move at that level, it uses the family ability. Ordinary casting between TP moves still uses the trimmed spell list.
- Stats: small multipliers per job on HP, attack, defence, evasion and magic (WAR/PLD/DRK hit harder and tougher, MNK fast, THF evasive, BLM/WHM/RDM soft). Total strength stays near the family baseline so level bands, XP and loot do not change.
- Casting code: extend `startMobCast`/`finishMobCast` to handle buffs (Protect, Haste, enspells), damage-over-time (Gleam, Poison), debuffs from `SPELLS` directly (no hand-written `status` arrays) and ability use. Mobs follow the same silence, stun and sleep rules as now.
- Pet jobs (SMN, BST, PUP, GEO) are allowed. A pet job mob brings a pet, always an elemental pet matched to the map type: forest and jungle earth, marsh and coast water, desert and volcano fire, snow and glacier ice, high crags and plains wind, ruins and crypts dark, holy ground light (the zone's element; table lives in data.js as `ZONE_ELEMENT`). The pet is a small elemental sprite of that element (reuse the player summoner sprites and the existing `summoned` mob support, as the Hollow King adds do). Summoner: the pet is out from the start and uses its blood pact. Beastmaster, Puppetmaster, Geomancer: same pet, different name and look (a tame spirit, a clockwork elemental, a luopan sprite). The pet dies with its owner, fights beside it, never counts for XP or loot, and does not link outside its pack.
- Corsair and Bard have no pet. Bard mobs use damage and debuff songs and a simple buff song; Corsair uses its dice rolls as party-wide buffs on its pack (guess).

### 4. Cosmetic gear per job
A `JOB_LOOK` table in rig.js gives each job its top, head, pauldrons, cape, belt and weapon (type and id) using the pieces the rig already draws:
| Job | Armour | Weapon |
|---|---|---|
| WAR | mail, cap or helm, pauldrons | sword (club for orcs) |
| MNK | vest and wraps, headband | claws or fists |
| THF | leather tunic, bandana or hood | dagger |
| WHM | white robe, hood | staff or club |
| BLM | dark robe, pointed hood | staff |
| RDM | feathered cap, tabard | sword |
| PLD | plate, helm, tabard | sword (shield sub, new) |
| DRK | black mail, horned helm | greataxe or scythe |
| RNG | leather vest, hood | bow |
| BRD | tunic, feathered cap | harp (new, small) |
| NIN | dark wraps, mask | two daggers |
| SAM | lamellar, kabuto-style helm | katana (new) |
| DRG | scale mail, winged helm | polearm |
| BLU, RUN, SCH, DNC, others | picked in H2 (SCH = robe and book, DNC = sash and fans, RUN = tabard and runic sword, BLU = patched cloth) | |
The family supplies skin, ears, tusks, beak and proportions; the job supplies the clothes. Family palettes tint the job pieces (Frost = pale blue-white, Mire = swamp green, Crag = feathered trims). Everything is cosmetic: gear never changes stats or drops.

### 5. Names and UI
- Target window and `/check` show the job and level ("Goblin Thief Lv5"); name in the log stays the family name. Guess: a short job tag, not a new name per job.
- Bestiary: lists the jobs you have seen for the family.
- Help and Updates: a "Monster jobs" section in Help (general words: some monsters fight like fighters, heal, curse or sneak); an Updates entry per release.

### 6. Wandering Sapling (not humanoid)
- New rig `kind: "bulb"` in rig.js (same family as the mandrake, shroom and crab kinds, which are already non-humanoid): a round brown flower bulb body with a papery skin and a few root hairs, two eyes on the front, two short stubby legs that waddle, and one green sprout with two small leaves growing out of the top of the head.
- Attack: the sprout rears back and whips down on the target (`swing` pose replaced by a sprout lash). Idle: the sprout sways; walk: the body bobs side to side.
- `sapling` and `jungle_sapling` use it (jungle: green and darker, thorned sprout). Both stay Plantoids. Help and bestiary text change from "young treants" to "walking bulbs". Elder Treant, Old Mossback, the Rime Treant and their sounds are untouched. Tint and the creak voice sound stay.
- No stat change.

## Phases
| Phase | Model | Work |
|---|---|---|
| H0 (done 18.38.0) | Sonnet | Wandering Sapling bulb model, animation, bestiary and Help/Updates. Independent of the rest and a quick release. |
| H1 (done 18.39.0) | Opus | Data: job roll at spawn (uniform, any job); kit from job and level; generalised mob casting and abilities; weapon-skill TP moves; stat modifiers; unit tests (every job at several levels, no job picks a spell above its level, silenced/stunned mobs behave). |
| H2 (done 18.40.0) | Opus | `JOB_LOOK` table and the new props (shield, katana, harp, claws, bow on monsters); family palettes; screenshot check of every job on every humanoid family at low, medium and high quality. |
| H3 (done 18.41.0) | Opus | Pet jobs: `ZONE_ELEMENT` table, elemental pets for SMN, BST, PUP and GEO mobs, pet AI and cleanup, tests. |
| H4 (done 18.42.0) | Sonnet | Names and UI (target job tag, bestiary), packs mix jobs, balance pass against the 18.x balance notes, Help, Updates, tests. |

Guess: H1 and H2 can ship together as one release if H1 is quick, otherwise H1 ships first with plain looks.

## Open questions (guesses used if not answered)
- Roll odds: uniform over all jobs with a small bonus to WAR, WHM, BLM and THF. Guess: yes.
- Does each mob give exactly the player's kit, or the trimmed four spells? Guess: trimmed, so fights do not turn into a spell storm.
- Job tag in the name ("Goblin Thief") or only in the target window? Guess: target window and check only.
- Strangler Sapling (jungle) also becomes a bulb? Guess: yes, same model with a green and thorny tint.
- Named monsters and bosses: keep their hand-made kit, no random job. Guess: yes.
- Pets of one mob: exactly one elemental pet, level equal to the owner's minus 1. Guess: yes.
