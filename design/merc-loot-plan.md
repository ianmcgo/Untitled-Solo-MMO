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
10b. **Wages rise with level and gear:** today `mercWage(id)` is the hire fee times `COMPANION_CFG.wageRate` (a flat amount, minimum 10). Target: wage = base wage x level factor x gear factor, recomputed each time the contract is due and shown in the payment prompt and the mercenary sheet.
   - **Level factor:** the wage follows the synced level (rule 7): fee scaled by the mercenary's level against the level they were hired at, so a mercenary hired at level 10 who is now synced to level 20 costs about twice the base.
   - **Gear factor:** each worn piece adds to the wage by its item level and rarity (for example +2% of base per item level above the level-appropriate plain gear, summed over worn slots). Plain starting gear adds nothing, so a fresh hire costs the same as today. Gear they carry but cannot wear adds nothing.
   - **Level down:** when you sync to a lower job level the wage drops with it, but gear that is no longer worn stops counting.
   - **Notice:** when a raise happens (level up or better gear equipped) the mercenary says so in the log and the party tooltip shows the new wage ("Next wage N crystals").
   - **Bribe:** the bribe to return (rule 14) uses the full hire fee at the time of leaving plus 100 per level, not the raised wage.
   - Open question: the exact percentages are guesses (level factor linear in level, gear +2% of base per item level above plain). I don't know the right feel; it needs a balance pass with M2 so wages don't outrun kill income.

11. **Bags:** each mercenary has a normal bag of `CONFIG.inventorySize` slots (30 today), with stacks counting the same as the player's.
    - With a full bag they pass on every lot.
    - Kept items (gear above their synced level) take up bag slots.
12. **Town sell-off:** when the party enters a town zone and a mercenary's bag is half full or more (15 of 30), they sell all their for-sale items. Those items become market listings under the mercenary's name (see "One market"), the pouch disappears and the bag frees up.
    - Kept items are not sold; I took "all items" to mean everything they had up for sale.
    - The crystals from sales go to the owner's auction delivery box (see "One market").
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
| M4 Contracts and Old Friends | Opus | Play-time contracts with save migration, wages that rise with level and gear (rule 10b), a payment prompt gated on combat, zoning and menus, Refuse or can't-pay sends them to Old Friends at the nearest hall, a level-based bribe, and rehiring with gear and bond kept. |

## One market: town, player and mercenary listings (revised 2026-10-16, third pass)
What exists today: two separate markets. The NPC market is local (`ahDaily()`, `ahStock()`, `marketPrice`, bought counts in `save.market.bought`, one rotation for the whole world). The player market is shared online (Supabase `public.ah_listings`, `ah_post`, `ah_buy`, `ah_expire`, delivery box `game_private.ah_box`, client in net.js, the Players view in the auction window). Listings last 48 hours, 10 lots per seller, 3% fee. All three town zones (Ashenreach Outpost, Saltreach Harbor, Ironvale) already have an auction house (Corvin, Selene, Orla).

Target: **one market, one list**, with three kinds of seller, each labelled and coloured differently:
| Seller | Label | Colour (also an icon, so colour is not the only cue) |
|---|---|---|
| Town (the AI market) | the town's name, e.g. "Ashenreach" | gold, 🏛 |
| Player | the player's name, e.g. "Tessa" | green, 👤 |
| Mercenary | the mercenary's name, e.g. "Brann" | violet, ⚔ |
The Buy view and the Players view merge into one list with a filter (All, Town, Players, Mercenaries). Sorting is by price as today.

Rules
1. **Every town has an auction house.** Already true for the three towns. A unit test fails if a zone with `theme: "town"` has no auction building and auctioneer.
2. **Town listings** (the AI): each town keeps its own rotating stock, generated from seeds that include the zone id (`ahdaily:<town>:<group>:<day>`, stock `<id>:<town>:<day>`). Each town's stock shows in the unified list under that town's name, with the per-town bought counts. Any auction house shows the whole market, not only its own town's stock.
3. **Mercenary listings:** the items a mercenary sells when you enter town become market listings under the mercenary's name (and the owner's name in the tooltip). They do not expire and do not count toward the 10-lot cap, with the 300-listing cap from decision 0. The price is the normal market price and there is no listing fee. Crystals from a sale go to the owner's delivery box.
4. **Town buying (staggered):** each town buys from the market at a slow, steady pace, one lot at a time.
   - It buys **player listings first**. It takes turns between sellers (round robin): each purchase goes to the seller whose last town sale is the oldest (sellers never paid by a town come first), and from that seller it takes their oldest listing. One player listing 100 items therefore doesn't make everyone else wait. Mercenary listings rotate the same way between owners. Only when no player listing is available does it buy **mercenary listings**, using the same turn-taking. It never buys its own listings.
   - A lot is eligible only if its price is at most the current market price times 1.25, so it doesn't buy bad deals.
   - The seller is paid the listed price through the delivery box, as for a player buyer.
5. **Relisting:** about 25% of what a town buys is relisted under the town's name at 3% more than it paid. Each purchase rolls once for the whole lot. The relisted lots never expire and do not count toward any cap, but stay in the town's stock for the same day-based rotation (they are not removed when the stock rotates).
6. **Offline play is the same market with only you in it.** The town listings, your own lots and your mercenaries' lots all appear. The towns buy your lots on a play-time schedule. The offline market is stored in `save.market.local`: `{ lots: [...], lastTick }`, and is separate from the online table. When you next play online, your offline lots are not copied online (decision: no cross-posting; see open questions).
7. **Buying** uses the same path for every seller kind (`ahBuy` for town stock, `ah_buy` online for player and mercenary lots).

Server work needed (not done, not run): extend `ah_listings` with `kind text default 'player'` (player, merc, town), `merc_name`, `town`; `public.ah_consign(my_char, items jsonb)` for mercenary sell-offs (validates the character, removes the items from its mercInv, enforces the 300 cap and returns how many were accepted); `game_private.ah_town_tick()` (needs a per-seller `last_town_sale` timestamp for the rotation), run lazily at the start of every `ah_list` call and at most once a minute, which buys the lots due (player first, then merc) and posts relistings; make `ah_expire` and `ah_post` ignore `kind in ('merc','town')`; credit sale proceeds to the box. This is a Supabase migration applied to the live project, so it needs your go-ahead when we get there.

| Phase | Model | Work |
|---|---|---|
| M5a Per-town stock | Sonnet | Per-town seeds and stock, per-town bought counts with save migration, the auction-house-in-every-town test. No dependency on M1. |
| M5b Unified list | Sonnet | One merged list with the filter and the three labels, colours and icons; Help and Updates. Works on local data first. |
| M5c Offline market | Opus | `save.market.local`, town buying and relisting on play time, mercenary listings from sell-off, proceeds to the player's box. Depends on M1. |
| M5d Online market | Opus | SQL migration, `ah_consign`, `ah_town_tick`, client calls and list merge. Depends on M5c, M1 and your approval of the live migration. |

Open questions (guesses used if not answered)
- **Town buying pace:** one lot per town every 20 minutes of real time online (computed when someone loads the market) and one lot per 20 minutes of play time offline. I don't know the right feel; this is a guess.
- **Cross-posting:** offline lots stay in your save and are not posted online later. Say if you want the opposite.
- **Relist price base:** 3% above what the town paid, rounded up.
- **Buy ceiling:** 1.25 times the market price.
- **Mercenary vs player priority:** as you said, strictly players first. A merc lot only sells to a town when no eligible player lot is left in that town's market, which with an active market could take a long time.

## Decisions (answered 2026-10-16)
0. Cap: at most 300 mercenary listings per player on the shared market. When a sell-off would go over the cap, the extra items are deleted from the mercenary's bag as if sold to a shop. Nothing is returned or consigned, and the player gets no crystals for them. The server enforces the cap in `ah_consign`, which returns the count that were accepted so the client can drop the rest. In the offline queue the same cap applies to the local list.
1. Bribe: full hire fee plus 100 crystals per level.
2. Items with no auction value: vendor value x 3, then the 1.5x markup.
3. Given gear that isn't better: handed back.
4. Online parties: mercenaries lot only on the owner's pool; other players' rules are unchanged. Sold mercenary goods are visible to all online players (see "One market").
5. Contract: 1 hour of play time; it counts down only while playing.
6. Old Friends: up to 8, oldest dropped first.
7. Bags: normal bag size. A full bag means they pass on everything. Half full or more on entering town means they sell all their for-sale items, which disappear.
