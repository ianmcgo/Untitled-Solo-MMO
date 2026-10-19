const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
G.enterZone('hollow_lake', 600, 1800); run(0.5);
for (const m of S.mobs) m.alive = false;
const mob = S.mobs.find(m => m.famKey === 'goblin') || S.mobs[0];
mob.alive = true; mob.hp = mob.maxHp = 5000; mob.state = 'idle'; mob.x = P().x + 40; mob.y = P().y; mob.enmity.clear();
const reset = () => { P().casting = null; P().winding = null; P().buffs = {}; P().alive = true; P().hp = P().maxHp = 900; P().mp = P().maxMp = 300; P().tp = 0; mob.hp = 5000; };
const realRandom = Math.random;
const withRandom = (v, f) => { Math.random = () => v; try { f(); } finally { Math.random = realRandom; } };

reset(); G.save.spells = G.save.spells || []; 
P().casting = { id: 'stone', sp: G.SPELLS.stone, t: mob, start: S.time, end: S.time + 5 };
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { phys: true }));
ok(!P().casting, 'a physical hit always interrupts a cast');

P().casting = { id: 'stone', sp: G.SPELLS.stone, t: mob, start: S.time, end: S.time + 5 };
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { el: 'fire' }));
ok(!!P().casting, 'a magic hit keeps the chance rule (no interrupt on a high roll)');

P().casting = { id: 'stone', sp: G.SPELLS.stone, t: mob, start: S.time, end: S.time + 5 };
P().buffs.aquaveil = { n: 1, until: S.time + 60 };
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { phys: true }));
ok(!!P().casting && !P().buffs.aquaveil, 'Aquaveil absorbs one physical interrupt');
P().casting = null;

P().casting = { id: 'stone', sp: G.SPELLS.stone, t: mob, start: S.time, end: S.time + 5 };
withRandom(0.99, () => G.applyDamage(mob, P(), 0, { phys: true }));
ok(!!P().casting, 'a hit that does no damage does not interrupt');
P().casting = null;

G.VIEW.settings = G.VIEW.settings || {}; G.VIEW.settings.classicInterrupt = true;
P().casting = { id: 'stone', sp: G.SPELLS.stone, t: mob, start: S.time, end: S.time + 5 };
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { phys: true }));
ok(!!P().casting, 'the old interrupt setting restores the chance rule');
P().casting = null; G.VIEW.settings.classicInterrupt = false;

const wsId = Object.keys(G.WEAPON_SKILLS).find(id => G.WEAPON_SKILLS[id].wtype === P().stats.wtype && G.WEAPON_SKILLS[id].skill <= 1) || Object.keys(G.WEAPON_SKILLS)[0];
const ws = { kind: 'ws', id: wsId };
const engage = () => { reset(); P().x = mob.x - 30; P().y = mob.y; P().tp = 1500; P().engaged = true; P().attackTarget = mob; P().target = mob; mob.state = 'combat'; mob.enmity.set(P(), 10); };

engage(); G.perform(P(), ws, mob);
ok(!!P().winding && P().tp === 1500, 'a weapon skill starts a wind-up and keeps the TP');
ok(G.checkAction(P(), { kind: 'ma', id: 'stone' }, mob) !== '', 'no other action can start during the wind-up');
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { phys: true }));
ok(!P().winding && P().tp === 1500, 'an early physical hit cancels the wind-up and keeps the TP');

engage(); G.perform(P(), ws, mob); P().winding.start = S.time - 0.7; P().winding.end = S.time + 0.1;
withRandom(0.99, () => G.applyDamage(mob, P(), 10, { phys: true }));
ok(!P().winding && P().tp === 0, 'a late physical hit cancels the wind-up and the TP is lost');

engage(); G.perform(P(), ws, mob); const hp0 = mob.hp;
for (let i = 0; i < 70; i++) { P().tp = Math.max(P().tp, 1000); tick(1000 / 60); if (!P().winding) break; }
ok(!P().winding && P().lastWSId === wsId, 'an uninterrupted wind-up fires the weapon skill');

engage(); G.perform(P(), ws, mob); P().tp = 1500;
P().winding.end = S.time + 0.05; mob.alive = false; run(0.2); mob.alive = true;
ok(!P().winding, 'the wind-up ends cleanly if the target dies');

engage(); mob.readying = { t: 1, target: P(), start: S.time, move: { name: 'Bomb Toss' } };
withRandom(0.1, () => G.applyDamage(P(), mob, 10, { phys: true }));
ok(!mob.readying, 'a physical hit can cut a monster move wind-up');
mob.readying = { t: 1, target: P(), start: S.time, move: { name: 'Bomb Toss' } };
withRandom(0.9, () => G.applyDamage(P(), mob, 10, { phys: true }));
ok(!!mob.readying, 'but not on a high roll');
mob.readying = null;

mob.casting = { id: 'stone', sp: G.SPELLS.stone, spec: {}, t: P(), start: S.time, end: S.time + 5 };
withRandom(0.1, () => G.applyDamage(P(), mob, 10, { phys: true }));
ok(!mob.casting, 'a physical hit interrupts a monster cast on a low roll');
mob.casting = { id: 'stone', sp: G.SPELLS.stone, spec: {}, t: P(), start: S.time, end: S.time + 5 };
withRandom(0.9, () => G.applyDamage(P(), mob, 10, { phys: true }));
ok(!!mob.casting, 'and not on a high roll');
mob.casting = null;

console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
