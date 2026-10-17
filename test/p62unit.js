const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const want = { human: ['human_vest', 'human_tunic'], elari: ['elari_jerkins', 'elari_bodice'], ursan: ['ursan_surcoat', 'ursan_tunic'], nekari: ['nekari_separates', 'nekari_tunic'], pipkin: ['pipkin_kaftan', 'pipkin_tunic'] };
let n = 0;
for (const race in want) for (const [job, i] of [['WAR', 0], ['WHM', 1], ['BLM', 1]]) {
  const d = G.loadChar(G.createChar({ name: 'R' + (n++) + 'x', job, look: { race } }));
  ok(d.gear.body === want[race][i], race + ' ' + job + ' starts in ' + want[race][i]);
}
const legs = { human: 'human_pants', elari: 'elari_chausses', ursan: 'ursan_baguette', nekari: 'nekari_loincloth', pipkin: 'pipkin_braccae' };
for (const race in legs) { const d = G.loadChar(G.createChar({ name: 'L' + race, job: 'WHM', look: { race } })); ok(d.gear.legs === legs[race], race + ' starts in ' + legs[race]); }
const ids = [].concat(...Object.values(want), Object.values(legs));
const shopIds = new Set([].concat(G.SHOP, ...Object.values(G.SHOPS).map(s => Array.isArray(s) ? s : s.items || [])));
ok(ids.every(id => G.ITEMS[id] && G.ITEMS[id].kind === 'equip' && G.ITEMS[id].race), 'fifteen race pieces exist as race-locked items');
ok(ids.every(id => !shopIds.has(id)), 'no race piece is in any shop');
ok(ids.every(id => !G.ahTradable(id)), 'no race piece can be auctioned');
ok(ids.every(id => !G.RECIPES.some(r => r.out === id)), 'no race piece can be crafted');
ok(ids.every(id => G.GEAR_DATA[id].src === 'race'), 'race pieces are neither shop nor drop sources');
ok(['hume_tunic', 'hume_vest', 'elvaan_jerkin', 'elvaan_bodice', 'galkan_surcoat', 'mithran_separates', 'tarutaru_kaftan', 'elv_m_chausses', 'elvaan_f_chausses', 'galkan_braguette', 'hume_pants', 'hume_slacks', 'mithran_loincloth', 'tarutaru_braccae'].every(id => !G.ITEMS[id]), 'old ids are gone');
ok(G.ITEMS.human_tunic.name === 'Human Tunic' && G.ITEMS.elari_jerkins.name === 'Elari Jerkins' && G.ITEMS.pipkin_kaftan.name === 'Pipkin Kaftan', 'renamed items');
const d = G.loadChar(G.createChar({ name: 'Wearer', job: 'WAR', look: { race: 'human' } }));
G.applyLoadedSave(d);
G.giveItem('elari_bodice', 1);
G.equip('elari_bodice');
ok(G.save.gear.body === 'human_vest', 'a human cannot wear an Elari piece');
G.giveItem('human_tunic', 1);
G.equip('human_tunic');
ok(G.save.gear.body === 'human_tunic', 'a human can wear a Human piece');
const old = JSON.parse(JSON.stringify(d)); old.gear.body = 'hume_vest'; old.inventory.push({ id: 'elvaan_bodice', qty: 1 }); old.gear.legs = 'hume_slacks';
const nd = G.normalizeSave(old);
ok(nd.gear.body === 'human_vest' && nd.inventory.some(s => s.id === 'elari_bodice') && nd.gear.legs === 'human_pants', 'old saves are migrated to the new ids');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
