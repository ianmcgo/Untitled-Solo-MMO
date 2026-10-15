# Item import and balance plan (draft, nothing built yet)

## Decisions (user)
- Make every item, including those above the level cap. Items above what the game supports exist in data but are locked: not sold, not dropped, not craftable, until the level cap and content catch up. Raising the cap or adding a zone later only changes the unlock level.

## What the files contain (corrected)
- items.lua already carries level, jobs (bitmask), slots (bitmask), races, weapon skill id, damage and delay for all 15,527 weapons and armor. Stats are only in item_descriptions.lua as text (DEF, DMG, Delay, attribute and combat lines).
- Level spread: 1,912 items at level 20 or below (1,146 at level 1, many are event or placeholder pieces), about 13,600 above 20, most at 75 to 99.
- Armor slot bitmasks: 16 head, 32 body, 64 hands, 128 legs, 256 feet, 512 neck, 1024 waist, 2 sub, 24576 ears, 6144 rings, 32768 back. Weapon slots 3 main, 8 ranged, 4 ammo.
- Only 277 items at level 20 or below have no parsed stats.
- Tool: tools/items-import/parse.py builds a gear table (id, name, level, jobs, slots, skill, damage, delay, stats). Output is not committed.

## Open questions
1. Names: original names or the real item names? Plan assumes original unless told otherwise.
2. Stats the game lacks (haste, store TP, enmity, skill bonuses): drop, convert, or build as systems.
3. Order: weapons first or armor first.

## Phases
1. Pipeline (offline tool, not shipped): parse the three files into one table (id, name, category, slot guess, DMG, Delay, DEF, stats). Output a CSV for review. Check: every row parses, no duplicates by name.
2. Mapping rules: slot map to the game's 16 slots; weapon type map to the 12+ weapon skills; stat map and dropped-stat list. Written into design.md as a table.
3. Curve: define per-level budgets from today's gear (dmg/delay/DEF/stat points at levels 1 to 20), then place each imported item by percentile within its slot and weapon type. Rescale values; never copy raw numbers from higher-level gear.
4. Generator: emits items into data.js the same way the mythril tier is generated, with looks (autoLook), icons (automatic), prices from the curve, ids prefixed so saves are untouched.
5. Distribution: shops by town tier, drops by monster level, craft recipes, NM and boss drops, guild shop, quest rewards. Rule: every item has at least one source; rare items cap at the current rarity rates.
6. Balance pass: simulate time to kill and damage taken per job at levels 1, 5, 10, 15, 20 with and without the new gear; adjust monster HP/attack or the curve until fights land in the current target range (the existing bot runs and unit tests are the baseline). Mercenary gear tiers use the same table.
7. Release in slices (for example 17.0 weapons 1 to 10, 17.1 armor 1 to 10), each with tests, Help and Updates entries, and a push.

## Locking rule
Each generated item gets unlockLevel = max(item level, content tier). Shops, drop tables, crafts, and quest rewards only list items whose unlockLevel is at or below the current cap. Locked items are hidden from loot and shop lists but stay in the item table so ids never change.

## Rough size
Phase 1 to 3: two to three sessions. Each release slice after that: one session. The balance pass repeats per slice. Start only after the five decisions above.
