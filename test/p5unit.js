const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const inRect = (x, y, r, m) => x > r.x - m && x < r.x + r.w + m && y > r.y - m && y < r.y + r.h + m;

for (const zid of ['hollow', 'den']) {
  const z = G.ZONES[zid];
  const rects = G.zoneRects(z);
  const bad = [];
  z.spawns.forEach((sp, i) => {
    if (sp.x < 60 || sp.y < 60 || sp.x > z.w - 60 || sp.y > z.h - 60) bad.push(i + ' edge');
    for (const r of rects) if (inRect(sp.x, sp.y, r, 30)) bad.push(i + ' wall');
    for (const w of z.water || []) if (Math.hypot(sp.x - w.x, sp.y - w.y) < w.r + 30) bad.push(i + ' water');
  });
  for (const n of z.npcs) for (const r of rects) if (inRect(n.x, n.y, r, 40)) bad.push('npc ' + n.id);
  for (const p of z.paths) for (let k = 0; k < p.pts.length - 1; k++) for (let t = 0; t <= 1; t += 0.02) {
    const x = p.pts[k][0] + (p.pts[k + 1][0] - p.pts[k][0]) * t, y = p.pts[k][1] + (p.pts[k + 1][1] - p.pts[k][1]) * t;
    if (x < 0 || x > z.w) continue;
    for (const r of rects) if (inRect(x, y, r, 20)) { bad.push('path ' + Math.round(x) + ',' + Math.round(y)); break; }
    for (const w of z.water || []) if (Math.hypot(x - w.x, y - w.y) < w.r + 20) { bad.push('path in water ' + Math.round(x) + ',' + Math.round(y)); break; }
  }
  ok(!bad.length, zid + ' layout: spawns, NPCs and paths clear of walls and water ' + bad.slice(0, 6).join('; '));
}
ok(G.ZONES.hollow.w === 3200 && G.ZONES.hollow.h === 2200 && G.ZONES.den.w === 2400 && G.ZONES.den.h === 1600, 'zone sizes match the plan');

{ const v = G.vana(); let d = 10 - v.hour - v.minute / 60; if (d < 0) d += 24; S.timeShift += d * 3600000 / 25; }
G.enterZone('outpost', 610, 440);
G.cycleTarget();
const near = S.npcs.filter(n => !n.crystal && !n.away && !n.prop).sort((a, b) => G.dist(a, P()) - G.dist(b, P()))[0];
ok(P().target === near, 'Tab in town targets the closest person (' + near.name + ')');
G.cycleTarget();
ok(P().target !== near && P().target && P().target.kind === 'npc', 'Tab again cycles to the next person');
run(3); G.cycleTarget();
ok(P().target === near, 'after a pause, Tab goes back to the closest');
P().x = 900; P().y = 480; run(3); G.cycleTarget();
const near2 = S.npcs.filter(n => !n.crystal && !n.away && !n.prop).sort((a, b) => G.dist(a, P()) - G.dist(b, P()))[0];
ok(P().target === near2, 'after moving, Tab picks the new closest (' + near2.name + ')');

G.enterZone('hollow', 120, 1100); run(1);
const m = G.buildMob('goblin', 1, 200, 1100, 0); S.mobs.push(m);
G.save.jobs.WAR.lv = 1; G.save.jobs.WAR.xp = 0; G.refreshPlayer(true);
const base = G.xpFor(1, 1);
m.enmity.set(P(), 10); G.onKO(m, P());
const x1 = G.save.jobs.WAR.xp;
const m2 = G.buildMob('goblin', 1, 200, 1100, 0); S.mobs.push(m2); m2.enmity.set(P(), 10); G.onKO(m2, P());
const x2 = G.save.jobs.WAR.xp - x1;
ok(x1 === base && x2 === Math.round(base * 1.1), 'EXP chain: second kill gives +10% (' + x1 + ', ' + x2 + ')');
for (let k = 0; k < 6; k++) { const mm = G.buildMob('goblin', 1, 200, 1100, 0); S.mobs.push(mm); mm.enmity.set(P(), 10); G.onKO(mm, P()); }
ok(G.chainInfo().n === 5, 'chain caps at 5 (+50%)');
run(61);
ok(G.chainInfo() === null, 'chain expires after 60 s');

G.save.jobs.WAR.lv = 3; G.save.jobs.WAR.xp = 0; G.refreshPlayer(true);
const lm = G.ZONES.hollow.landmarks.find(l => l.id === 'fort');
P().x = lm.x; P().y = lm.y + 60; run(1);
ok(G.save.landmarks['hollow:fort'] && G.save.jobs.WAR.xp === 0, 'discovering the Old Fort Ruins logs it without XP');
run(1);
ok(G.save.jobs.WAR.xp === 0, 'a landmark only logs once');

const wall = G.ZONES.hollow.walls[0];
P().x = wall.x + wall.w / 2; P().y = wall.y + 30; G.keepOutOfRects(P());
ok(!inRect(P().x, P().y, wall, -1), 'rock outcrops are solid');
const pil = G.ZONES.hollow.ruins.pillars[0];
P().x = pil[0]; P().y = pil[1]; G.keepOutOfRects(P());
ok(G.dist(P(), { x: pil[0], y: pil[1] }) > 20, 'ruin pillars are solid');

const GI = G.ZONES.hollow.spawns.findIndex(sp => sp.nm && sp.nm.id === 'grimtooth');
const g = G.buildMob('grimtooth', 6, 2850, 1600, GI); S.mobs.push(g); g.enmity.set(P(), 10);
G.save.inventory = G.save.inventory.filter(s => s.id !== 'raiders_ring');
G.onKO(g, P());
ok(G.save.timers['nm:grimtooth'] > Date.now() + 290000, 'NM cooldown is stored on the real clock');
const fam = G.famOf('goblin');
const saved = Math.random; Math.random = () => 0;
G.spawnMob(GI);
const popped = S.mobs[S.mobs.length - 1];
ok(popped.famKey === 'goblin', 'NM cannot pop again during its cooldown');
delete G.save.timers['nm:grimtooth']; S.mobs = S.mobs.filter(x => x.famKey !== 'grimtooth');
S.mobs = S.mobs.filter(x => x !== popped); G.spawnMob(GI);
ok(S.mobs[S.mobs.length - 1].famKey === 'grimtooth', 'NM pops from its placeholder once the cooldown is over');
G.giveItem('raiders_ring', 1, true);
const before = G.invCount('raiders_ring');
G.dropLoot(G.buildMob('grimtooth', 6, 0, 0, GI));
ok(G.invCount('raiders_ring') === before, 'a Rare item already held is lost instead of duplicated');
let regularGear = false;
for (const k in G.FAMILIES) if (!G.FAMILIES[k].nm) for (const [id] of G.FAMILIES[k].loot) if (G.ITEMS[id].kind === 'equip') regularGear = true;
ok(!regularGear, 'regular monsters never drop equipment');
ok(Object.keys(G.NM_FAMILIES).every(k => G.NM_FAMILIES[k].loot.some(([id]) => G.ITEMS[id].kind === 'equip')), 'every notorious monster drops equipment');
Math.random = saved;
ok(G.itemRarity('potion') === 'common' && G.itemRarity('hi_potion') === 'uncommon' && G.itemRarity('raiders_ring') === 'rare' && G.itemRarity('chieftain_cap') === 'epic', 'rarity tiers');
let gearOk = true;
for (const k in G.FAMILIES) for (const [id, ch] of G.FAMILIES[k].loot) { const it = G.ITEMS[id]; if (!it) gearOk = false; }
for (const k in G.NM_FAMILIES) { const u = G.NM_FAMILIES[k].loot[0]; if (u[1] < 0.25 || u[1] > 0.35) gearOk = false; }
ok(gearOk, 'drop rates: NM uniques 25–35%');

G.save.gil = 5000; G.hireMerc('kael'); S.mobs = []; S.spawnAt = []; run(1);
const ally = S.party.find(p => p !== P());
if (ally) { ally.x = P().x + 1500; run(1); ok(G.dist(ally, P()) < 300, 'companions left behind catch up'); }
G.enterZone('den', 70, 800); run(1);
ok(S.mobs.length >= 15, 'Goblin Den spawns (' + S.mobs.length + ')');
G.save.timers['nm:chieftain'] = Date.now() + 60000;
G.enterZone('den', 70, 800); run(1);
ok(!S.mobs.some(x => x.famKey === 'chieftain'), 'Chieftain stays down while its real-time cooldown runs');

G.enterZone('outpost', 610, 440); run(1);
P().hp = Math.round(P().maxHp * 0.3); const h0 = P().hp; run(10);
const slow = P().hp - h0;
P().hp = Math.round(P().maxHp * 0.3); const h1 = P().hp;
G.runCommand('/rest'); run(10);
const fast = P().hp - h1;
ok(P().resting && fast > slow * 3, 'standing still heals slowly (' + slow + ' HP/10s), /rest heals fast (' + fast + ' HP/10s)');
ok(S.party.filter(p => p !== P()).every(p => p.resting), 'companions sit down with you');
S.keys.d = true; run(0.5); S.keys.d = false;
ok(!P().resting && S.party.every(p => !p.resting), 'moving stands everyone up');
G.runCommand('/heal'); ok(P().resting, '/heal is an alias for /rest'); G.runCommand('/rest'); ok(!P().resting, '/rest again stands up');
G.enterZone('hollow', 300, 1300); run(1);
const mob = S.mobs.filter(m => m.alive).sort((a, b) => G.dist(a, P()) - G.dist(b, P()))[0];
G.runCommand('/target ' + mob.name.split(' ')[0].toLowerCase());
ok(P().target && P().target.name === mob.name, '/target by name');
const n0 = H.alllog.length; G.runCommand('/check');
ok(H.alllog.slice(n0).some(l => /seems like/.test(l)), '/check describes the target');
G.runCommand('/nonsense'); ok(H.alllog.slice(-1)[0].startsWith('Unknown command'), 'unknown commands are reported');
G.runCommand('hello there'); ok(H.alllog.slice(-1)[0].endsWith(': hello there'), 'plain text is said in chat');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
