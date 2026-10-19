const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const src = require('fs').readFileSync('../src/menu4.js', 'utf8') + require('fs').readFileSync('../src/hud4.js', 'utf8');
ok(!/S\.zone && S\.zone\.residence/.test(src), 'storage and the menu use the zone id for the residence check');
ok(!G.ZONES.residence.residence, 'zone data has no residence flag (so checks must use the zone id)');
const roles = Object.keys(G.VENDOR_ROLES);
ok(roles.length === 6, 'six vendor roles');
for (const town of ['outpost', 'harbor', 'ironvale']) {
  const zs = G.areaZones(town).map(id => G.ZONES[id]), vs = zs.flatMap(Z => Z.npcs.filter(n => /^v_/.test(n.id)).map(n => Object.assign({ Z }, n)));
  ok(vs.length === 6 && new Set(vs.map(n => n.id)).size === 6, town + ' has six vendors');
  ok(!zs.some(Z => Z.npcs.some(n => n.id === 'pell')), town + ' has no Pell');
  const bad = vs.filter(n => (n.Z.houses || []).some(b => Math.abs(n.x - b.x) < b.w / 2 + 12 && Math.abs(n.y - b.y) < b.h / 2 + 12));
  ok(!bad.length, town + ' vendors stand clear of buildings (' + bad.map(n => n.id) + ')');
}
ok(!G.NPCS.pell, 'Pell is gone');
for (const r of roles) {
  const st = G.vendorStock(r, 'outpost'), pool = G.VENDOR_POOL[r];
  ok(st.length === Math.min(r === 'jeweler' ? 5 : 10, pool.length), r + ' stocks ' + st.length + ' (pool of ' + pool.length + ')');
  ok(st.every(id => (G.ITEMS[id].lv || 0) <= (r === 'jeweler' ? 11 : 5)), r + ' stays within its level cap');
  ok(JSON.stringify(st) === JSON.stringify(G.vendorStock(r, 'outpost')), r + ' stock is steady within a day');
}
ok(G.VENDOR_POOL.armorer.every(id => ['head', 'body', 'hands', 'legs', 'feet', 'back', 'waist', 'sub'].includes(G.ITEMS[id].slot)), 'armorer sells armor only');
ok(G.VENDOR_POOL.weaponsmith.every(id => ['main', 'ranged', 'ammo'].includes(G.ITEMS[id].slot)), 'weaponsmith sells weapons only');
ok(G.VENDOR_POOL.spellsmith.every(id => G.ITEMS[id].spell || G.ITEMS[id].recipe), 'spellsmith sells scrolls only');
ok(G.VENDOR_POOL.jeweler.every(id => ['ring', 'neck'].includes(G.ITEMS[id].slot)), 'jeweler sells rings and necklaces only');
ok(G.VENDOR_POOL.tradesman.some(id => G.ITEMS[id].kind === 'tool') && G.VENDOR_POOL.quartermaster.some(id => G.ITEMS[id].kind === 'food'), 'tradesman has tools, quartermaster has food');
const a = G.vendorStock('armorer', 'outpost').join(), b = G.vendorStock('armorer', 'ironvale').join(); ok(a !== b || G.VENDOR_POOL.armorer.length <= 10, 'towns stock different items');
G.enterZone('outpost', 800, 700); for (let i = 0; i < 12; i++) tick(1000 / 60);
ok(G.shopList('v:armorer').length === G.vendorStock('armorer', 'outpost').length, 'shop window lists the vendor stock');
ok(!G.NPCS.vela && !G.ZONES.harbor.npcs.some(n => n.id === 'vela'), 'Vela is gone');
ok(G.vendorStock('jeweler', 'outpost').length === 5 && G.VENDOR_POOL.jeweler.length === 10, 'the jeweler shows 5 of a pool of ' + G.VENDOR_POOL.jeweler.length);
ok(['outpost', 'harbor', 'ironvale'].map(t => G.vendorStock('jeweler', t).join()).filter((v, i, a) => a.indexOf(v) === i).length > 1, 'jeweler stock differs by town');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
(function(){let ok=true;const ids=["x_potion","hi_ether","super_ether","reraiser","hi_reraiser","super_reraiser","chapel_sigil"];
for(const i of ids){const rec=G.RECIPES.some(r=>r.out===i);const drop=Object.values(G.FAMILIES).some(f=>f.loot.some(l=>l[0]===i));if(!rec||!drop){ok=false;console.log("FAIL drop/recipe",i,rec,drop)}}
if(G.VENDOR_POOL.quartermaster.length!==10){ok=false;console.log("FAIL qm pool",G.VENDOR_POOL.quartermaster.length)}
console.log(ok?"ok retired goods droppable and craftable, quartermaster 10":"")})();
