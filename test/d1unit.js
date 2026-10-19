const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const FAM = G.FAMILIES, restricted = id => G.lootRestricted(id);
const loose = [];
for (const [k, f] of Object.entries(FAM)) {
  if (f.nm || f.boss) continue;
  for (const [id] of f.loot || []) if (restricted(id) && !G.mobJobOk(f)) loose.push(k + ':' + id);
  if (f.gil && !G.mobJobOk(f)) loose.push(k + ':gil');
}
ok(loose.length === 0, 'no gear, weapon, scroll or crystal field on a non-humanoid family ' + loose.join(','));
for (const [k, f] of Object.entries(FAM)) {
  if (f.nm || f.boss || !G.mobJobOk(f)) continue;
  for (const [id] of f.loot || []) if (restricted(id)) ok(Object.keys(G.JOBS).some(j => G.lootJobOk(j, 99, id)), k + ' ' + id + ' can be carried by some job');
}
const mk = (key, lv, job) => { const m = G.buildMob(key, lv, 100, 100, 0, job === undefined ? false : job); m.job = job || null; return m; };
const sword = Object.keys(G.ITEMS).find(id => G.ITEMS[id].kind === 'equip' && G.ITEMS[id].src === 'drop' && Array.isArray(G.ITEMS[id].jobs) && !G.ITEMS[id].jobs.includes('BLM') && G.ITEMS[id].jobs.includes('WAR') && G.ITEMS[id].lv >= 4);
const lv = G.ITEMS[sword].lv;
ok(G.lootJobOk('WAR', lv, sword) && !G.lootJobOk('WAR', lv - 1, sword), 'item level gates the drop');
ok(!G.lootJobOk('BLM', 99, sword), 'a job that cannot wear it never carries it');
ok(G.lootJobOk('BLM', 5, 'scroll_stone') && !G.lootJobOk('THF', 99, 'scroll_stone') && !G.lootJobOk('BLM', 0, 'scroll_blizzard'), 'scroll needs the spell job and level');
const beast = mk('hill_lizard', 20, null);
ok(!G.lootAllowed(beast, sword) && !G.lootAllowed(beast, 'scroll_stone') && G.lootAllowed(beast, 'potion'), 'a beast carries no gear or scrolls but still carries potions');
ok(!G.mobDropsCrystals(beast), 'a beast gives no crystals');
const gob = mk('goblin', 20, 'WAR');
ok(G.mobDropsCrystals(gob) && G.lootAllowed(gob, sword), 'a warrior goblin can carry a warrior item at level');
ok(!G.lootAllowed(mk('goblin', lv - 1, 'WAR'), sword), 'below the item level it cannot');
ok(!G.lootAllowed(mk('goblin', 30, 'BLM'), sword), 'wrong job cannot');
const nm = { fam: { nm: true, loot: [] }, lv: 1, job: null };
ok(G.lootAllowed(nm, sword) && G.mobDropsCrystals(nm), 'named monsters can carry anything and drop crystals');
G.enterZone('outpost');
G.save.jobs.WAR.lv = 15; G.refreshPlayer(true);
const stats = (m, n) => { let items = 0, gil = 0; for (let i = 0; i < n; i++) { G.save.inventory = []; const g0 = G.save.gil; G.dropLoot(m, []); items += G.save.inventory.filter(s => restricted(s.id)).length; gil += G.save.gil - g0; } return { items, gil }; };
G.CONFIG.scrollDrop = 1;
const sb = stats(beast, 400);
ok(sb.items === 0 && sb.gil === 0, 'four hundred beast kills: no gear, scrolls or crystals (' + sb.items + ',' + sb.gil + ')');
let tro = 0; for (let i = 0; i < 400; i++) { G.save.inventory = []; G.dropLoot(beast, []); tro += G.save.inventory.filter(x => /^trophy_/.test(x.id)).length; }
ok(tro > 100 && tro < 300, 'beasts drop trade goods instead (' + tro + ' in 400)');
ok(G.trophyFor(beast).id === 'trophy_hide_3' && G.trophyFor(mk('hill_lizard', 5, null)).id === 'trophy_hide_1' && G.trophyFor(mk('bomb', 12, null)).id === 'trophy_core_2', 'trade goods match the beast and its level');
ok(!G.trophyFor(mk('goblin', 20, 'WAR')) && !G.trophyFor(nm), 'humanoids and named monsters drop no trade goods');
ok(Object.keys(G.ITEMS).filter(id => /^trophy_/.test(id)).every(id => G.sellPrice(id) > 0 && G.ahTradable(id)), 'trade goods sell to shops and the auction house');
for (const [k, f] of Object.entries(FAM)) if (!f.nm && !f.boss && !f.summoned && !G.mobJobOk(f) && f.model && !G.TROPHY_KIND[f.model]) ok(false, 'trade good kind for ' + k + ' model ' + f.model);
const sh = stats(mk('orc_grunt', 20, 'WAR'), 400);
ok(sh.gil > 0, 'humanoid kills pay crystals');
let bad = 0, got = 0;
G.CONFIG.scrollDrop = 0.5;
for (const job of Object.keys(G.JOBS)) for (const key of ['goblin', 'orc_grunt', 'fishfolk', 'skeleton']) {
  const m = mk(key, 12, job);
  for (let i = 0; i < 150; i++) {
    G.save.inventory = [];
    G.dropLoot(m, []);
    for (const s of G.save.inventory) if (restricted(s.id)) { got++; if (!G.lootJobOk(job, 12, s.id)) bad++; }
  }
}
ok(got > 20, 'job-matched gear and scrolls do drop from humanoids (' + got + ')');
ok(bad === 0, 'no humanoid ever drops an item its job and level could not use (' + bad + ')');
process.exit(fails ? 1 : 0);
