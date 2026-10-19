# Plan: who may drop gear, weapons and spell scrolls

Status: phase 1 done in 18.86.0 (rule in dropLoot via lootAllowed, humanoid-only crystals, test/d1unit.js). Phase 2 open.

Rule (user request): equipment, weapons and spell scrolls drop only from
1. NMs and bosses, and
2. humanoid monsters that could use the item: the monster's job and level meet the item's job and level requirement (a monster that could not equip or cast it never carries it).

Everything else (beasts, plants, insects, undead without a job, and so on) drops only materials, food, potions and crafting essences.

Crystals (currency): only humanoid mobs drop crystals. Non-humanoid mobs drop none (today every mob falls back to CONFIG.mobGil in dropLoot; the fallback becomes humanoid-only and any gil field on a non-humanoid family is removed). Crafting essences (fire_crystal and the rest) are items, not currency, and are unaffected. Expect a crystal income drop; Phase 2 checks economy-18.4.md numbers and may raise humanoid gil or material sell prices to compensate.

## Scope
- Audit every drop table in data.js (mob families, NM tables, boss tables) and list entries of type gear, weapon or scroll on non-qualifying mobs.
- Add a family flag for humanoid (or reuse the existing family list) and a monster job per humanoid family (the humanoid job plan in design/humanoid-job-plan.md already gives jobs).
- dropLoot (game.js): before rolling a gear, weapon or scroll entry, check the source: NM or boss passes; otherwise it must be humanoid and the mob's job and level must satisfy the item's job list and level. Failing entries are skipped, not rerolled.
- Replace removed gear drops on beasts with materials of similar value so total loot value stays near the same (economy notes in design/economy-18.4.md).
- Humanoid tables: add job-matched gear and scrolls (a Black Mage type can drop black magic scrolls and robes, a Warrior type axes and heavy armour).
- Mercenary loot (design/merc-loot-plan.md) and auction stock are unaffected.

## Tests
- Unit test: for every mob in every zone, every gear, weapon or scroll entry passes the rule (fails the build otherwise).
- Spot checks: a beast never drops gear; an NM always can; a humanoid below the item level never drops it.

## Docs
Help (Loot section) and Updates entries; design.md drops and rarity section.

## Phases
1. Audit and rule check in dropLoot plus the table-wide unit test, humanoid-only crystal drops (Sonnet).
2. Rebalance tables: material replacements for beasts, job-matched drops for humanoids (Opus, needs judgement on values).
