const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const I = G.ITEMS, C = G.CONFIG;
let bad = [];
for (const k in G.FAMILIES) { const f = G.FAMILIES[k]; if (f.nm || f.boss) continue; for (const [id, ch] of f.loot) { const it = I[id]; if (!it || it.kind === 'equip' || it.kind === 'key' || it.spell || /^scroll_/.test(id) || ch >= 1 || ch <= 0) continue; if (!(ch < 0.01 || (ch >= 0.01 && ch <= 0.05) || (ch >= 0.1 && ch <= 0.15))) bad.push(k + ':' + id + ':' + ch); } }
ok(!bad.length, 'ordinary drops are 10-15%, 1-5% or under 1%' + (bad.length ? ' ' + bad.slice(0, 5) : ''));
let nmBad = [];
for (const k in G.NM_FAMILIES) { for (const [id, ch] of G.NM_FAMILIES[k].loot) { if (I[id] && I[id].kind === 'equip' && I[id].slot !== 'ammo' && (ch < 0.1 || ch > 0.2)) nmBad.push(k + ':' + id + ':' + ch); } }
ok(!nmBad.length, 'NM gear drops 10-20%' + (nmBad.length ? ' ' + nmBad.slice(0, 5) : ''));
ok(Math.abs(G.sellPrice('iron_ore') - Math.floor(I.iron_ore.price * C.shopMul / 2)) <= 1, 'merchants buy at half the shop price');
ok(I.bronze_sword_hq.price === I.bronze_sword.price * 2, '+1 gear costs twice the plain price');
ok(I.potion_hq2.price === I.potion.price * 3 && I.potion_hq3.price === I.potion.price * 3, '+2 and +3 cost three times the plain price');
ok(G.ahTradable('fasting_ring') && G.sellPrice('fasting_ring') > 0, 'NM gear can be traded and sold');
ok(I.fasting_ring.price >= 3 * 40, 'NM gear costs about three times similar gear');
ok(G.townCeil('iron_ore') === Math.round(I.iron_ore.price * C.shopMul * 1.5), 'the town pays up to 1.5 times the shop price');
const here = G.ahHere(), other = G.ahTowns().find(t => t !== here);
const L = G.marketLocal(); L.lots.length = 0;
L.lots.push({ id: 'bat_wing', qty: 1, price: 50, kind: 'town', seller: 'X', owner: '', town: other, seq: 1 }, { id: 'bat_wing', qty: 1, price: 50, kind: 'town', seller: 'Y', owner: '', town: here, seq: 2 });
const lines = G.marketLines('bat_wing', [{ id: 5, item: 'bat_wing', qty: 1, price: 40, kind: 'player', seller: 'z', seller_name: 'Z', town: other }, { id: 6, item: 'bat_wing', qty: 1, price: 40, kind: 'player', seller: 'z', seller_name: 'Z', town: here }]);
ok(!lines.some(l => l.local === 0 || l.lot === 5) && lines.some(l => l.local === 1) && lines.some(l => l.lot === 6), 'only lots from the city you stand in are listed');
G.save.gil = 99999;
ok(/another|listed in|in /i.test(G.ahBuyLocal(0)) && G.marketLocalLots().length === 2, 'a lot from another city cannot be bought');
ok(/only be bought/.test(G.ahBuy([...G.ahDaily(here)][0], 1, other)), 'stock from another city cannot be bought');
console.log(fails ? fails + ' FAILED' : 'all passed');
process.exit(fails ? 1 : 0);
