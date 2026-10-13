const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
G.save.story.done = true;
G.enterZone('outpost'); run(0.2);
ok(G.RACE_ORDER.length === 5 && G.RACE_ORDER.every(r => G.RACES[r]), 'five playable races');
const stats = {};
for (const r of G.RACE_ORDER) {
  G.save.look.race = r; G.save.mainJob = 'BLM'; G.save.jobs.BLM.lv = 20; G.refreshPlayer(true);
  stats[r] = { hp: P().maxHp, mp: P().maxMp, int: P().stats.int, str: P().stats.str, att: P().stats.att, vit: P().stats.vit, spd: P().speed };
}
console.log(JSON.stringify(stats));
ok(stats.ursan.hp > stats.human.hp && stats.human.hp > stats.elari.hp && stats.elari.hp > stats.pipkin.hp, 'HP: Ursan > Human > Elari > Pipkin');
ok(stats.pipkin.mp > stats.elari.mp && stats.elari.mp > stats.human.mp && stats.human.mp > stats.ursan.mp, 'MP: Pipkin > Elari > Human > Ursan');
ok(stats.pipkin.int > stats.nekari.int && stats.nekari.int > stats.human.int && stats.human.int > stats.ursan.int, 'INT: Pipkin best, Ursan worst');
ok(stats.ursan.str > stats.human.str && stats.pipkin.att < stats.human.att, 'Ursan strong, Pipkin weak hitters');
ok(stats.pipkin.spd > stats.human.spd && stats.nekari.spd > stats.human.spd && stats.ursan.spd < stats.human.spd, 'Pipkin and Nekari fast, Ursan slow');
ok(stats.nekari.hp < stats.human.hp && stats.nekari.hp > stats.pipkin.hp, 'Nekari a bit frail');
G.save.look.race = 'elari'; G.save.mainJob = 'WAR'; G.save.gear.main = 'shortbow'; G.refreshPlayer(true); const ea = P().stats.acc;
G.save.look.race = 'human'; G.refreshPlayer(true);
ok(ea > P().stats.acc, 'Elari aim better with bows');
const id1 = G.createChar({ name: 'Brum', job: 'WAR', look: { race: 'ursan', build: 1 } });
const id2 = G.createChar({ name: 'Mira', job: 'WAR', look: { race: 'nekari', build: 0 } });
const ro = G.loadRoster().chars;
ok(ro.find(c => c.id === id1).look.build === 0 && ro.find(c => c.id === id2).look.build === 1, 'Ursan are always male and Nekari always female');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
