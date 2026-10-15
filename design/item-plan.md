# Item import and balance plan (draft, nothing built yet)

## What the three files contain
- items.lua: 23,536 items. Fields: id, en/ja names, category (Armor 10,300; General 5,233; Weapon 5,227; Usable 2,500; Maze 149; Automaton 127), stack size, flags, type. No level, job, slot, race or price.
- item_descriptions.lua: 23,456 text blocks. Weapons: DMG and Delay lines. Armor: DEF plus stat lines (HP, MP, STR..CHR, accuracy, evasion, haste, enmity, skill+). Only 615 blocks carry any "Lv." text, so level and job are missing for almost everything.
- items_grammar.lua (web page snapshot): article and plural forms only. Not needed for stats.
- Gap: level, jobs, slots and races live in the full Windower items resource, which these uploads do not include. Without them there is no honest way to place an item on a level curve.
- Scale gap: most of the 15,527 weapons and armor are level 75 to 99 pieces, many with +1/+2/+3 upgrades. The game caps at level 20 and has about 760 item entries today. A rough stat filter finds about 1,500 low-damage weapons and 3,400 low-defense armor pieces, which includes many duplicates.

## Decisions needed before any code
1. Names: the design notes say all names and art are original. Real item names are the original game's. Options: keep numbers and structure but give every item an original name (recommended), or use the real names and drop the originality claim.
2. Scope: levels 1 to 20 only (about 600 to 900 items after removing duplicates), or raise the level cap first and import more.
3. Data: upload the full Windower items resource (level, jobs, slots), or accept a rough level estimate from DMG/DEF rank.
4. Stat fidelity: the game has the stats STR to CHR, HP, MP, attack, defense, accuracy, evasion, resists and a few specials. Stats it lacks (Haste, Store TP, enmity, magic accuracy, skill+) are dropped, converted to nearest stats, or added as new systems. Each new system is its own phase.
5. Order: weapons first or armor first.

## Phases
1. Pipeline (offline tool, not shipped): parse the three files into one table (id, name, category, slot guess, DMG, Delay, DEF, stats). Output a CSV for review. Check: every row parses, no duplicates by name.
2. Mapping rules: slot map to the game's 16 slots; weapon type map to the 12+ weapon skills; stat map and dropped-stat list. Written into design.md as a table.
3. Curve: define per-level budgets from today's gear (dmg/delay/DEF/stat points at levels 1 to 20), then place each imported item by percentile within its slot and weapon type. Rescale values; never copy raw numbers from higher-level gear.
4. Generator: emits items into data.js the same way the mythril tier is generated, with looks (autoLook), icons (automatic), prices from the curve, ids prefixed so saves are untouched.
5. Distribution: shops by town tier, drops by monster level, craft recipes, NM and boss drops, guild shop, quest rewards. Rule: every item has at least one source; rare items cap at the current rarity rates.
6. Balance pass: simulate time to kill and damage taken per job at levels 1, 5, 10, 15, 20 with and without the new gear; adjust monster HP/attack or the curve until fights land in the current target range (the existing bot runs and unit tests are the baseline). Mercenary gear tiers use the same table.
7. Release in slices (for example 17.0 weapons 1 to 10, 17.1 armor 1 to 10), each with tests, Help and Updates entries, and a push.

## Rough size
Phase 1 to 3: two to three sessions. Each release slice after that: one session. The balance pass repeats per slice. Start only after the five decisions above.
