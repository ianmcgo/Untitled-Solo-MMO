# Vendor shops plan

Status: planned, awaiting go-ahead.

## Request
Every vendor stands outside their own shop building instead of all vendors sharing market stalls. Spread them around town: some in the industrial district (district key "ind"; smiths, ore and lumber sellers, crafting suppliers, guild masters), not only the market.

## Scope
- List every vendor NPC per town (data.js NPCS, VENDOR_WORK, stalls) and assign each a district by trade: market (food, potions, general goods, clothes), industrial (weapons, armour, smithing, woodworking, ores, tools), harbor (fish, bait, boats) where the town has one.
- Shop building per vendor (world3d.js): small storefront with door, awning, hanging sign (texSign, trade icon and name), window, varied roof and colours from a seeded palette; vendor stands at the doorway facing the street, idle work animation kept.
- Placement: on street edges using the existing district layout and road grid; keep collision, walk paths, fast travel points and the auction house clear; no overlap with existing buildings.
- Market keeps a few open stalls for flavour.
- Map and minimap labels for shops; Help (Towns) and Updates entries.

## Phases
1. Assignment table and placement (Sonnet): move vendors, reuse existing building generator for storefronts.
2. Storefront art pass (Opus): per-trade signs, props outside (anvil, barrels, crates, racks), visual check of every town.
