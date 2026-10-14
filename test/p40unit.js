const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const door = G.ZONES.sunscar.exits.find(e => e.to === 'spire1');
ok(door && door.kind === 'door', 'a door in the Sunscar Desert leads into the Red Spire');
let lv = 0;
for (let f = 1; f <= 4; f++) {
  G.enterZone('spire' + f, 500, 400); run(0.3);
  const top = Math.max(...S.mobs.map(m => m.lv));
  ok(top >= lv, 'floor ' + f + ' monsters are at least as strong as the floor below (' + top + ')');
  lv = top;
  S.mobs = []; S.spawnAt = S.spawnAt.map(() => null);
  const ex = G.ZONES['spire' + f].exits.find(e => e.x > 500);
  P().x = ex.x - 5; P().y = ex.y + ex.h / 2; run(1.5);
}
ok(S.zoneId === 'spire_top', 'climbing the east stairs of floor 4 reaches the summit');
const boss = S.mobs.find(m => m.famKey === 'spire_warden');
ok(boss && boss.lv === 23 && boss.fam.boss, 'the Spire Warden waits at the summit');
ok(G.ITEMS.warden_blade && G.ITEMS.spire_mantle, 'the Warden guards a greatsword and a mantle');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
