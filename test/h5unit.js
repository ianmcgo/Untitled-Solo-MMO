const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const src = require('fs').readFileSync('../src/menu4.js', 'utf8') + require('fs').readFileSync('../src/hud4.js', 'utf8');
ok(!/S\.zone && S\.zone\.residence/.test(src), 'storage and the menu use the zone id for the residence check');
ok(!G.ZONES.residence.residence, 'zone data has no residence flag (so checks must use the zone id)');
const roles = Object.keys(G.VENDOR_ROLES);
ok(roles.length === 6, 'six vendor roles');
for (const town of ['outpost', 'harbor', 'ironvale']) {
  const Z = G.ZONES[town]; const vs = Z.npcs.filter(n => /^v_/.test(n.id));
  ok(vs.length === 6 && new Set(vs.map(n => n.id)).size === 6, town + ' has six vendors');
  ok(!Z.npcs.some(n => n.id === 'pell'), town + ' has no Pell');
  const bad = vs.filter(n => (Z.houses || []).some(b => Math.abs(n.x - b.x) < b.w / 2 + 12 && Math.abs(n.y - b.y) < b.h / 2 + 12));
  ok(!bad.length, town + ' vendors stand clear of buildings (' + bad.map(n => n.id) + ')');
}
ok(!G.NPCS.pell, 'Pell is gone');
for (const r of roles) {
  const st = G.vendorStock(r, 'outpost'), pool = G.VENDOR_POOL[r];
  ok(st.length === Math.min(10, pool.length), r + ' stocks ' + st.length + ' of a pool of ' + pool.length);
  ok(st.every(id => (G.ITEMS[id].lv || 0) <= 5 && !G.ITEMS[id].hq), r + ' only sells level 5 or lower');
  ok(JSON.stringify(st) === JSON.stringify(G.vendorStock(r, 'outpost')), r + ' stock is steady within a day');
}
ok(G.VENDOR_POOL.armorer.every(id => ['head', 'body', 'hands', 'legs', 'feet', 'back', 'waist', 'sub'].includes(G.ITEMS[id].slot)), 'armorer sells armor only');
ok(G.VENDOR_POOL.weaponsmith.every(id => ['main', 'ranged', 'ammo'].includes(G.ITEMS[id].slot)), 'weaponsmith sells weapons only');
ok(G.VENDOR_POOL.spellsmith.every(id => G.ITEMS[id].spell), 'spellsmith sells scrolls only');
ok(G.VENDOR_POOL.jeweler.every(id => ['ring', 'neck'].includes(G.ITEMS[id].slot)), 'jeweler sells rings and necklaces only');
ok(G.VENDOR_POOL.tradesman.some(id => G.ITEMS[id].kind === 'tool') && G.VENDOR_POOL.quartermaster.some(id => G.ITEMS[id].kind === 'food'), 'tradesman has tools, quartermaster has food');
const a = G.vendorStock('armorer', 'outpost').join(), b = G.vendorStock('armorer', 'ironvale').join(); ok(a !== b, 'towns stock different items');
G.enterZone('outpost', 800, 700); for (let i = 0; i < 12; i++) tick(1000 / 60);
ok(G.shopList('v:armorer').length === G.vendorStock('armorer', 'outpost').length, 'shop window lists the vendor stock');
const lost = G.SHOP.filter(id => !G.VENDOR_POOL.armorer.concat(G.VENDOR_POOL.weaponsmith, G.VENDOR_POOL.tradesman, G.VENDOR_POOL.quartermaster, G.VENDOR_POOL.spellsmith, G.VENDOR_POOL.jeweler).includes(id) && !G.SHOPS.vela.includes(id));
ok(!lost.length, 'every old shop item is still sold somewhere (' + lost.slice(0, 4) + ')');
for (const town of ['outpost', 'harbor', 'ironvale']) {
  const ids = G.ZONES[town].npcs.map(n => n.id);
  ok(ids.includes('auction_' + town) && G.NPCS['auction_' + town].prop === 'kiosk', town + ' has an auction kiosk');
  ok(!ids.some(i => ['corvin', 'selene', 'orla'].includes(i)), town + ' has no auctioneer person');
  ok(ids.some(i => G.NPCS[i] && G.NPCS[i].talk === 'talkTobin'), town + ' has a job master');
  ok(ids.some(i => G.NPCS[i] && G.NPCS[i].talk === 'talkYsolde'), town + ' has a stablemaster');
}
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
