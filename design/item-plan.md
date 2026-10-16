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

## Scope v2 (supersedes the phases above where they conflict)
Decision: replace the game's own spells, potions and gear with the FFXI data, level 20 and below only. Everything else in the files is ignored for now.

Sizes: 1,912 equipment pieces (level 20 and below), 113 spell scrolls (110 spells), 94 potion-type items (69 without +1 to +3). Source tables come from tools/items-import/parse.py.

Current game facts the plan builds on
- SPELLS in data.js has about 60 hand-made spells with mp, cast, recast, power and per-job levels; scrolls are generated from it (scroll_<id>, shop for level 10 and below, Vela for 17 and below).
- newSave gives every spell whose job table has a level 1 entry (game.js line 89), so BLM already starts with Stone and WHM with Cure and Dia. After the change a new character gets only the starting spells of the chosen main job.
- ITEMS has 11 use-items; levelCap is 20.

Phases
A. Data tables (no game change). Extend parse.py to emit scrolls (spell, school, every job and level, effect text) and potions with effect text. Hand-write the FFXI numbers the files lack: MP cost, cast time, recast, and base power per spell, taken from FFXI values. Review the tables before use.
B. Spells. Replace SPELLS with the 44 early spells plus the other scroll types in the 113 (ninjutsu, summoning, geomancy, songs, rolls, threnodys, bar-ra, en- spells). Use FFXI job levels exactly (WHM Cure 1, Cure II 11, Dia 3, Banish 5, and so on). Remove game-only spells that have no FFXI match, or keep them clearly marked as extras if you prefer. Keep scroll items one per spell; duplicate items (Cure, Dia, Stone) merge into one id and keep both ids as aliases so old saves still load.
C. Starting spells. New character gets: BLM Stone; WHM Cure (and Dia at its level, 3); RDM Dia (RDM 1) and the level 1 spells of its job table; BRD Knight's Minne; other jobs get their level 1 entries. Saves that already exist keep their learned list and gain missing spells at level-up as now.
D. Potions. Replace the 11 use-items with the 94 (stack, effect, price, shop and drop tables). Items without a level are tiered by hand: Potion, Hi-Potion, Ether, Hi-Ether, Antidote, Eye Drops, Echo Drops, Panacea, Remedy, Reraiser and stat potions are buyable at level 20 and below; Elixirs and the rest are drops or locked. Food stays as it is.
E. Equipment. Import the 1,912 pieces with FFXI level, jobs, slot, race, weapon skill, damage, delay and parsed stats. Map weapon skill ids and slot bitmasks to the game's slots; stats the game lacks are converted to the nearest stat or dropped (a list is kept in design.md). Rename to original names only if you choose; otherwise use the FFXI names. Old gear stays for existing saves until a conversion is agreed.
F. FFXI rules. Audit and change: damage formula (fSTR, pDIF, delay and TP), hit rate, evasion, defense, MP and HP growth, regen and refresh, cast time and recast, interruption, enmity, TP gain, weapon skill levels, skill caps by job and level, resting and heal-per-tick. Each rule is a small change with a unit test; none is done by eye.
G. Balance. Rebuild mob stats against the new gear: target time-to-kill and damage taken per job at levels 1, 5, 10, 15, 20 (even match, easy prey, tough, too tough conning), with and without the new gear and with mercenaries. Tune mob HP, attack and defense, XP and gil, vendor prices and drop rates until the existing bot runs and unit tests pass and the targets hold. This phase is the longest and gets repeated per slice.
H. Release slices: 17.0 potions and scrolls (B to D), 17.1 weapons, 17.2 armor, 17.3 rules (F), then G after each. Each release: tests, Help and Updates entries, design.md, push.

Risks
- Wholesale rule changes break existing saves and bot tests; keep a save migration and run the unit suite after every slice.
- FFXI numbers for MP, cast and recast are not in the files; I would enter them from memory or the wiki and some may be wrong. They get checked in review.
- FFXI formulas are partly unpublished; "exactly like FFXI" means as close as the known formulas allow.
- The Project is out of room, so this file lives only in the repo for now.

Suggested model: Sonnet for A to E and H; Opus for F and G (formula design and balance).
