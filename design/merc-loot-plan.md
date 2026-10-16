# Mercenary loot, trade and contract plan (drafted 2026-10-16, not built)

Requested 2026-10-16. Builds on the existing treasure pool (`addToPool`, `lotPool`, `tickPool` in game.js), `mercCanWear`, `autoGear`, `save.mercGear`, `tickWages` and `dismissMerc`.

## Today (v18.23.0)
- Only some drops go to the pool. Mercenaries lot only when the item is an upgrade for them (`poolUpgrade`); a winner equips it at once and the old piece goes to the player.
- Wages are charged on the wall clock (`save.mercPaid` = Date.now() + dayMs) and only skip while in combat. Unpaid mercenaries are dismissed back to the hall with no way back except rehiring.
- Gear comes from `autoGear(job, lv, role)` at hire; mercenaries do not level sync to the player's job level.

## Target rules
1. **Everything goes to the pool** while in a party (mercenaries or online party). Solo play keeps direct drops.
2. **Mercenaries lot on every item**, except equipment they cannot wear (job, race, level after sync), which they pass. Random lot 1 to 999 as now.
3. **A winner keeps the item in their own inventory** (`save.mercInv[id]`, list of `{ id, qty, forSale, price }`).
   - Equipment better than what they wear: they put it on, and the replaced piece goes up for sale.
   - Anything else they do not equip goes up for sale.
4. **Merchant pouch:** a mercenary with items for sale shows a small pouch icon by their name in the party list (bottom right).
5. **Mercenary sheet:** clicking a mercenary in the party list opens a sheet showing their worn gear (all slots), their for-sale list, and their kept (unsellable) items.
6. **Buying:** for-sale items cost 1.5 times the item's auction house value. The player pays crystals and the item moves to the player's inventory.
7. **Level sync:** mercenaries are hired at the player's current level and sync to the player's current job level whenever it changes (job change, level up or down).
   - Gear they can no longer wear after a sync goes to their kept inventory. It is never sold, and comes back into use when the level allows.
8. **Starting gear:** level-appropriate plain gear only, with no named items and no +1 or HQ variants. `autoGear` gets a `plain` flag.
9. **Giving gear:** from the mercenary sheet, the player picks an item from their own bag and gives it with "Wear this".
   - If it is wearable and better, they equip it and put the old piece up for sale.
   - If it is not better, they say so and hand it back. Open question 3 covers whether they should keep it instead.
10. **Contracts on play time:**
    - The contract is 1 hour of play time, counted on `save.playSec`, the same as Blessing and meals. Logging out pauses it.
    - When it runs out, the payment request waits until all of these are true: out of combat, not zoning, no menu or dialog open.
    - The mercenary then asks for payment in a dialog: Pay (wage) or Refuse.
11. **Bags:** each mercenary has a normal bag of `CONFIG.inventorySize` slots (30 today), with stacks counting the same as the player's.
    - With a full bag they pass on every lot.
    - Kept items (gear above their synced level) take up bag slots.
12. **Town sell-off:** when the party enters a town zone and a mercenary's bag is half full or more (15 of 30), they sell all their for-sale items. Those items move to that town's auction house as consigned listings (see "Town auction houses"), the pouch disappears and the bag frees up.
    - Kept items are not sold; I took "all items" to mean everything they had up for sale.
    - Their earnings are not tracked.
13. **Refuse or can't pay:** the mercenary leaves for the nearest Mercenary Hall and appears in a new hall tab, **Old Friends**. Their gear, inventory and bond are kept.
14. **Bribe to return:** rehiring from Old Friends costs their full hire fee plus 100 crystals per level (their synced level at rehire), paid instead of the normal fee, and they rejoin at the player's level (synced).

## Data
- save.mercInv[id]: `[{ id, qty, sale: true|false }]`. Kept items have sale false.
- save.mercContract[id]: `{ endSec }` on play time. Migrate from mercPaid on first read, like `migratePlayTimers`.
- save.oldFriends[id]: `{ left: playSec, hall: zoneId, lv }`.
- Mercenary sync: `mercSyncLv(m)` sets `m.lv` to the player's level, rebuilds stats, and moves gear above the level cap into kept inventory.

## Phases
| Phase | Model | Work |
|---|---|---|
| M1 Pool, lots and bags | Sonnet | All party drops go to the pool. Mercenaries lot on everything, and pass on gear they can't wear or when their bag is full. Winners store items in mercInv and equip only upgrades. Town sell-off at half-full bags. Pool log lines and tests. |
| M2 Sync and plain gear | Opus | Hire at player level, sync to the job level on change, move gear above the cap to kept inventory and restore it later, plain `autoGear`. Touches combat stats, so it needs balance tests. |
| M3 Sheet, pouch and trade | Sonnet | Pouch icon in the party list, the mercenary sheet (worn gear, for sale, kept), buying at 1.5x the auction value, giving an item with "Wear this", keyboard navigation, Help and Updates. |
| M4 Contracts and Old Friends | Opus | Play-time contracts with save migration, a payment prompt gated on combat, zoning and menus, Refuse or can't-pay sends them to Old Friends at the nearest hall, a level-based bribe, and rehiring with gear and bond kept. |

## Town auction houses (added 2026-10-16)
Today there is one market for the whole world: `ahDaily()` picks a rotating set from a seed made from the market day and the player's level, and `ahStock(id)` sets stock per day. Every auctioneer (Corvin, Selene, Orla) shows the same goods.

Target:
1. **Separate stock per town.** Each town with an auction house has its own rotating inventory.
   - The seed adds the town's zone id: `ahdaily:<town>:<group>:<day>`, and stock seeds `<id>:<town>:<day>`.
   - `save.market.bought` is kept per town (`save.market.bought[town]`).
   - `UI.ahTown` is set from the auctioneer you talk to.
2. **Mercenary sell-off goes to that town's auction house.** When the town sell-off fires (rule 12), every for-sale item becomes a listing in `save.ahConsign[town]` (`[{ id, qty, from: mercId, at: playSec }]`).
   - In a town with no auction house, the items go to the nearest town that has one.
3. **Consigned listings never expire** and do not rotate. They leave only when the player buys them.
   - They show first in Browse with a "From <mercenary>" tag.
   - They are priced at the normal market price (`marketPrice`), not the 1.5x direct-sale markup.
4. Buying from consigned listings uses the same `ahBuy` path. It takes from `ahConsign` first, then from the daily stock.

| Phase | Model | Work |
|---|---|---|
| M5 Town markets | Sonnet | Per-town seeds and stock, per-town bought counts with save migration, consigned listings from mercenary sell-offs, the Browse tag, Help and Updates. Depends on M1. |

Open questions (guesses used if not answered)
- "Until a player buys it": online play has no shared auction table today, so consigned listings are per save and only you can buy them. A shared online market would need server work and is out of scope.
- No cap on consigned listings was asked for. They could pile up over months; I suggest a soft cap of 300 per town, oldest dropped. This is not applied unless you say so.

## Decisions (answered 2026-10-16)
1. Bribe: full hire fee plus 100 crystals per level.
2. Items with no auction value: vendor value x 3, then the 1.5x markup.
3. Given gear that isn't better: handed back.
4. Online parties: mercenaries lot only on the owner's pool; other players' rules are unchanged.
5. Contract: 1 hour of play time; it counts down only while playing.
6. Old Friends: up to 8, oldest dropped first.
7. Bags: normal bag size. A full bag means they pass on everything. Half full or more on entering town means they sell all their for-sale items, which disappear.
