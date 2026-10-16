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
12. **Town sell-off:** when the party enters a town zone and a mercenary's bag is half full or more (15 of 30), they sell all their for-sale items. Those items become shared market listings (see "Town auction houses"), the pouch disappears and the bag frees up.
    - Kept items are not sold; I took "all items" to mean everything they had up for sale.
    - The crystals from sales go to the owner's auction delivery box (see "Town auction houses").
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

## Town auction houses (revised 2026-10-16, second pass)
What exists today (I got this wrong in the first draft, which said there was no shared market):
- Two markets already exist. The NPC market is local: `ahDaily()` and `ahStock()` with `marketPrice`, one rotation for the whole world, bought counts in `save.market.bought`. The player market is shared online: Supabase `public.ah_listings` (RLS: members see open lots), `ah_post`, `ah_buy`, `ah_expire`, delivery box `game_private.ah_box`, client in net.js (`netAhList`, `netAhBuy`, ...) and the Players view in the auction window. Listings last 48 hours, 10 lots per seller, 3% fee.
- Every town zone (Ashenreach Outpost, Saltreach Harbor, Ironvale) already has an auction house and auctioneer (Corvin, Selene, Orla).

Target:
1. **Every town has an auction house.** The three towns already do. Rule for future towns: any zone with `theme: "town"` must have an auction building and auctioneer. A unit test checks this so a new town cannot ship without one.
2. **Per-town NPC stock.** Each auction house has its own rotating NPC inventory: seeds add the zone id (`ahdaily:<town>:<group>:<day>`, stock `<id>:<town>:<day>`) and bought counts are kept per town. This is the "separate randomly rotating inventory" from the earlier request.
3. **Mercenary sell-off goes to the shared player market.** The items a mercenary sells when you enter town become shared listings that every online player can see and buy in the Players view, tagged "<Mercenary>, hired by <player>" (and the seller shown as the owner).
   - **No expiry:** these listings stay until someone buys them. Listings with `kind = 'merc'` skip the 48 hour expiry and the 10-lot cap.
   - **Price:** the normal market price (`marketPrice`), no listing fee.
   - **Proceeds:** the crystals go to the owner's delivery box (`ah_box`), as for player lots, and can be collected at any auction house. This replaces my earlier "earnings are not tracked" line.
   - **Offline play:** with no connection (or in offline mode), the listings go to a local consignment list (`save.ahConsign`) and are posted to the shared market the next time you play online. Local listings are visible only to you until then.
4. **Seeing other players' mercenary items:** the Players view gets a filter "Mercenary goods". No extra work beyond the shared listings.
5. Buying uses `ah_buy` as today, so there is no new buy path.

Server work needed (not done, not run): extend `ah_listings` with `kind text default 'player'` and `merc_name text`; a `public.ah_consign(my_char, items jsonb)` function that inserts merc listings (server-side check that the character is online, the items come from its mercInv and are removed from there, and a cap of 50 per call); make `ah_expire` and `ah_post` ignore `kind = 'merc'`; add the sale proceeds to the box on `ah_buy`. This is a Supabase migration; it must be applied to the live project before M5 ships, so it needs your go-ahead when we get there.

| Phase | Model | Work |
|---|---|---|
| M5a Per-town NPC stock | Sonnet | Per-town seeds and stock, per-town bought counts with save migration, town auction test, Help and Updates. No dependency on M1. |
| M5b Shared merc listings | Opus | SQL migration plus `ah_consign`, client `netAhConsign`, offline consignment queue and flush, Players view tags and filter, proceeds to the box. Depends on M1 (sell-off) and on you approving the live migration. |

Open questions (guesses used if not answered)
- The previous message said "auction house should be shared". I read it as: the mercenary items are shared with other players. I kept the NPC rotation per town, as you asked before. If you meant the NPC stock should be one shared list for every town, tell me and I will drop M5a.

## Decisions (answered 2026-10-16)
0. Cap: at most 300 mercenary listings per player on the shared market. When a sell-off would go over the cap, the extra items are deleted from the mercenary's bag as if sold to a shop. Nothing is returned or consigned, and the player gets no crystals for them. The server enforces the cap in `ah_consign`, which returns the count that were accepted so the client can drop the rest. In the offline queue the same cap applies to the local list.
1. Bribe: full hire fee plus 100 crystals per level.
2. Items with no auction value: vendor value x 3, then the 1.5x markup.
3. Given gear that isn't better: handed back.
4. Online parties: mercenaries lot only on the owner's pool; other players' rules are unchanged. Sold mercenary goods are visible to all online players (see "Town auction houses").
5. Contract: 1 hour of play time; it counts down only while playing.
6. Old Friends: up to 8, oldest dropped first.
7. Bags: normal bag size. A full bag means they pass on everything. Half full or more on entering town means they sell all their for-sale items, which disappear.
