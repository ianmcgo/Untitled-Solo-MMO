const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
G.save.story.done = true;
for (const f of ['honey_bee', 'grass_crawler', 'meadow_sheep', 'hill_lizard', 'pond_crab', 'mandrake', 'shroomling', 'lake_snapper', 'longneck', 'sapling']) ok(G.FAMILIES[f] && !G.FAMILIES[f].aggro, f + ' is passive');
for (const f of ['orc_grunt', 'orc_stonechucker', 'fishfolk', 'birdfolk', 'treant_elder', 'cactus', 'bomb']) ok(G.FAMILIES[f] && G.FAMILIES[f].aggro, f + ' is aggressive');
for (const zid of ['hollow', 'hollow_lake', 'hollow_ruins']) { const z = G.ZONES[zid], cell = Math.max(z.w, z.h) / 15, all = z.spawns.flatMap(s => [s].concat(s.alts || [])); ok((zid !== 'hollow' || all.some(o => o.fam === 'honey_bee')) && (zid !== 'hollow_ruins' || all.some(o => o.fam === 'orc_stonechucker' || o.fam === 'orc_grunt')) && z.spawns.every(s => z.exits.every(e => Math.hypot(s.x - e.x - e.w / 2, s.y - e.y - e.h / 2) >= G.CONFIG.spawnExitCells * cell)) && z.spawns.every((a, i) => z.spawns.every((b, k) => k === i || Math.abs(a.x - b.x) >= G.CONFIG.spawnGapCells * cell || Math.abs(a.y - b.y) >= G.CONFIG.spawnGapCells * cell)), 'Hollow keeps bees and orcs, spawn points are spaced and clear of the exits'); }
G.enterZone('hollow', 900, 1100); run(0.2); S.mobs = []; S.spawnAt = S.spawnAt.map(() => null);
G.save.jobs.WAR.lv = 8; G.refreshPlayer(true); P().hp = P().maxHp = 9999;
const oc = G.buildMob('orc_stonechucker', 5, P().x + 180, P().y, 0, 'WAR'); S.mobs.push(oc); oc.enmity.set(P(), 10); oc.state = 'combat';
const t0 = G.S.time; run(6);
ok(oc.lastSwing > t0 && G.dist(oc, P()) > 100, 'a Stonechucker attacks from range without closing in');
const bm = G.buildMob('bomb', 5, P().x + 30, P().y, 0); S.mobs.push(bm); bm.enmity.set(P(), 10); bm.state = 'combat'; bm.tp = 1000;
run(0.1); bm.readying = { t: 0.01, target: P(), start: S.time }; const h1 = P().hp; run(0.5);
ok(!bm.alive && P().hp < h1, 'a bomb\'s Self-Destruct kills it and hurts you');
const cr = G.buildMob('grass_crawler', 3, P().x + 30, P().y, 0); S.mobs.push(cr); cr.enmity.set(P(), 10); cr.state = 'combat'; cr.readying = { t: 0.01, target: P(), start: S.time }; run(0.5);
ok(P().buffs.slow, 'Gummed Strand slows you');
for (const id of ['orc_tooth', 'reef_scale', 'crag_feather', 'heartwood', 'cactus_needle', 'bomb_ash', 'honeycomb', 'crawler_cocoon']) ok(!!G.ITEMS[id] && G.BESTIARY.orc_grunt && G.BESTIARY.bomb, id + ' exists');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
