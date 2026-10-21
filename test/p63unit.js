const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const want = { WAR: 'turnip_sword', THF: 'turnip_knife', WHM: 'turnip_rod', BLM: 'turnip_staff' };
const rd = G.loadChar(G.createChar({ name: 'Rdmx', job: 'RDM', look: { race: 'human' } }));
ok(rd.mainJob === 'WAR', 'only War, Rogue, Light Mage and Dark Mage can be chosen at creation');
let n = 0;
for (const job in want) {
  const d = G.loadChar(G.createChar({ name: 'T' + (n++) + 'x', job, look: { race: 'human' } }));
  ok(d.gear.main === want[job], job + ' starts with ' + want[job]);
  ok(!d.gear.head, job + ' starts with no helmet');
  ok(d.inventory.length === 0, job + ' starts with an empty bag');
}
const ids = Object.values(want);
for (const id of ids) ok(G.ITEMS[id] && G.ITEMS[id].starter, id + ' exists');
const shopIds = new Set([].concat(G.SHOP, ...Object.values(G.SHOPS).map(s => Array.isArray(s) ? s : s.items || [])));
ok(ids.every(id => !shopIds.has(id)), 'turnip weapons not in shops');
ok(ids.every(id => !G.ahTradable(id)), 'turnip weapons not tradable at auction');
ok(ids.every(id => G.GEAR_DATA[id].src === 'race'), 'turnip weapons are neither shop nor drop sources');
const rec = JSON.stringify(G.RECIPES || []);
ok(ids.every(id => rec.indexOf('"' + id + '"') < 0), 'turnip weapons not craftable');
ok(G.ITEMS.turnip_sword.dmg === 5 && G.ITEMS.turnip_knife.dmg === 4 && G.ITEMS.turnip_rod.dmg === 3, 'damage values');
console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
