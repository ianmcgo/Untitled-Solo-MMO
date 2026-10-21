const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const C = G.CONFIG;
G.enterZone('hollow', G.ZONES.hollow.start.x, G.ZONES.hollow.start.y); run(0.5);
const p = P();
const mk = (fam, lv) => { const m = G.buildMob(fam, lv || 5, p.x + 40, p.y, null); m.aggro = null; m.link = false; S.mobs.push(m); return m; };
const fake = (name, role) => ({ kind: 'ally', name, role, alive: true, hp: 300, maxHp: 300, mp: 100, maxMp: 100, buffs: {}, x: p.x + 20, y: p.y + 20, stats: {}, lv: 5, recasts: {}, inventory: [] });

S.mobs = [];
const g = mk('goblin'), sk = mk('skeleton'), w = mk('worm'), bird = mk('birdfolk'), bee = mk('honey_bee');
ok(G.hateBias(sk, 'phys') > 1 && G.hateBias(sk, 'magic') < 1, 'skeletons dislike steel more than spells');
ok(G.hateBias(w, 'magic') > 1 && G.hateBias(w, 'phys') < 1, 'worms dislike spells more than steel');
ok(G.hateBias(bird, 'ability') > 1 && G.hateBias(bird, 'heal') > 1, 'birdfolk dislike abilities and heals');
ok(G.hateBias(g, 'heal') === 1 && G.hateBias(g, 'crit') === 1, 'goblins default to 1 where no profile entry exists');
const nm = Object.keys(G.NM_FAMILIES).find(k => G.FAMILIES[G.NM_FAMILIES[k].base].model === 'skeleton' || G.NM_FAMILIES[k].base === 'ghoul');
if (nm) { const boss = Object.assign({}, { fam: Object.assign({}, G.FAMILIES[G.NM_FAMILIES[nm].base], { nm: true }) }); ok(G.hateBias(boss, 'crit') === 1, 'notorious monsters ignore the crit bonus'); }

const total = (m, e) => G.hateOf(m, e);
G.addEnmity(sk, p, 100, { kind: 'phys' });
G.addEnmity(w, p, 100, { kind: 'phys' });
ok(total(sk, p) > total(w, p) * 1.3, 'the same hit builds more hate on a skeleton than on a worm (' + total(sk, p).toFixed(0) + ' vs ' + total(w, p).toFixed(0) + ')');
const w2 = mk('worm'); G.addEnmity(w2, p, 100, { kind: 'magic' });
ok(total(w2, p) > total(w, p) * 1.5, 'a spell builds more hate on a worm than a hit does');

const a = mk('goblin'), b = mk('goblin');
G.addEnmity(a, p, 100, { kind: 'phys' });
G.addEnmity(b, p, 100, { kind: 'phys', crit: true });
ok(Math.abs(total(b, p) / total(a, p) - C.critHate) < 0.01, 'a critical hit draws ' + C.critHate + 'x hate');

const d = mk('goblin');
G.addEnmity(d, p, 100, { kind: 'phys' });
const before = d.enmity.get(p); const c0 = before.c, v0 = before.v;
ok(c0 > 0 && v0 > 0, 'a hit splits into cumulative and volatile hate (' + c0.toFixed(0) + ' / ' + v0.toFixed(0) + ')');
for (let i = 0; i < 60 * 5; i++) G.decayHate(d, 1 / 60);
const after = d.enmity.get(p);
ok(after.v < v0 * 0.5 && after.c > c0 * 0.9, 'after 5 s the volatile part is mostly gone and the cumulative part mostly stays (' + after.c.toFixed(0) + ' / ' + after.v.toFixed(0) + ')');

const tank = fake('Tank', 'tank'), mage = fake('Mage', 'nuker');
const m = mk('goblin'); m.state = 'combat';
S.party = [p, tank, mage];
G.addEnmity(m, tank, 100, { kind: 'phys' }); m.target = tank; m.swapAt = -9;
G.addEnmity(m, mage, 100, { kind: 'phys' });
ok(G.pickHateTarget(m) === tank, 'equal hate does not steal the target');
m.enmity.get(mage).c += 8;
ok(G.pickHateTarget(m) === tank, 'a lead under 10% does not steal the target');
m.enmity.get(mage).c += 20;
ok(G.pickHateTarget(m) === mage, 'a lead over 10% takes the target');
m.target = mage; m.swapAt = S.time;
m.enmity.get(tank).c += 200;
ok(G.pickHateTarget(m) === mage, 'a fresh swap holds for a second even against a bigger lead');
m.swapAt = S.time - 2;
ok(G.pickHateTarget(m) === tank, 'after the hold the bigger lead wins');
mage.alive = false;
m.target = mage;
ok(G.pickHateTarget(m) === tank, 'a dead target is dropped at once');
mage.alive = true;

const pv = mk('goblin');
G.addEnmity(pv, tank, 600, { kind: 'volatile' });
const h = pv.enmity.get(tank);
ok(h.v >= h.c && h.v > 250, 'at least half of Goad is volatile');
ok(G.hateOf(pv, tank) >= 600, 'Goad lands its full 600 on a plain goblin');
tank.buffs.sentinel = { until: 999 };
const sv = mk('goblin'); G.addEnmity(sv, tank, 100, { kind: 'phys' });
ok(Math.abs(G.hateOf(sv, tank) - 200 * G.hateBias(sv, 'phys')) < 0.01, 'Bulwark doubles hate');
delete tank.buffs.sentinel;

const h1 = mk('goblin'), h2 = mk('hill_lizard'), idle = mk('goblin');
h1.state = h2.state = 'combat';
G.addEnmity(h1, p, 50); G.addEnmity(h2, p, 50);
const healer = fake('Healer', 'healer'); S.party = [p, tank, mage, healer];
healer.stats = { mnd: 20, vit: 10, int: 5, str: 5 }; healer.job = 'WHM'; healer.skills = {};
const sp = G.SPELLS.cure;
p.hp = Math.max(1, p.maxHp - 60);
G.castHeal(healer, p, sp);
ok(G.hateOf(h1, healer) > 0 && G.hateOf(h2, healer) > 0, 'a cure draws hate from every monster fighting the party');
ok(G.hateOf(idle, healer) === 0, 'a cure draws nothing from monsters not in the fight');
ok(G.hateOf(h1, healer) !== G.hateOf(h2, healer) || G.hateBias(h1, 'heal') === G.hateBias(h2, 'heal'), 'heal hate follows the family bias');

S.mobs = []; S.party = [p];
const hold = mk('goblin', 6); hold.state = 'combat';
const tk = fake('Tank', 'tank'); tk.x = p.x + 10; tk.y = p.y;
S.party = [p, tk];
G.addEnmity(hold, tk, 300, { kind: 'phys' });
G.addEnmity(hold, p, 100, { kind: 'phys' });
hold.target = tk;
let onTank = 0, n = 0;
for (let i = 0; i < 60 * 90; i++) {
  if (i % 1800 === 0) G.addEnmity(hold, tk, 600, { kind: 'volatile' });
  if (i % 180 === 0) G.addEnmity(hold, tk, 100, { kind: 'phys' });
  if (i % 180 === 90) G.addEnmity(hold, p, 130, { kind: 'phys', crit: i % 900 === 90 });
  G.decayHate(hold, 1 / 60);
  const t = G.pickHateTarget(hold); if (t !== hold.target) { hold.swapAt = i / 60; hold.target = t; }
  n++; if (hold.target === tk) onTank++;
}
ok(onTank / n > 0.85, 'a Provoking tank holds a goblin against a harder hitter with the odd critical (' + Math.round(100 * onTank / n) + '% of the time)');

process.exit(fails ? 1 : 0);
