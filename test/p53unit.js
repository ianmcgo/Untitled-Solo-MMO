const H = require('./harness.js'); const G = H.G;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
let n = 0, bad = 0;
for (const race of G.RACE_ORDER) for (const build of [0, 1]) {
  const sx = G.RACES[race].sex; if (sx != null && sx !== build) continue;
  for (let face = 0; face < 8; face++) for (let hc = 0; hc < 8; hc++) for (const [h, g] of [[0, 1], [2, 2], [4, 3]]) {
    const id = G.createChar({ name: 'Tester' + n, job: 'WAR', look: { race, build, face, hairStyle: face, hairColor: hc, height: h, girth: g } });
    const c = G.loadChar(id); const l = c && c.look;
    n++; if (!l || l.race !== race || l.build !== build || l.face !== face || l.hairColor !== hc || l.height !== h || l.girth !== g || 'skin' in l) bad++;
  }
}
ok(n > 700 && bad === 0, n + ' race/gender/face/hair/size combinations save and load intact without skin (' + bad + ' bad)');
const old = G.normalizeSave(Object.assign({}, G.loadChar(G.loadRoster().chars[0].id), { look: { build: 0, skin: 3, hairStyle: 0, hairColor: 1 } }));
ok(!('skin' in old.look), 'old saved skin values are dropped');
if (fails) { console.log('FAILED'); process.exit(1); } console.log('ALL PASSED');
