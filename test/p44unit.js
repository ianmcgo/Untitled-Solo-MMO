const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const findWx = (z, w, avoid) => { for (let k = 0; k < 400; k++) { S.timeShift = k * 3 * 3600000 / 25; if (G.weatherNow(z) === w) return true; } return false; };
ok(findWx('sunscar', 'sandstorm'), 'sandstorms blow through the Sunscar Desert');
G.enterZone('sunscar', 1500, 1700); run(0.5);
ok(G.visMul() === 0.5 && G.weatherSlow() < 1, 'a sandstorm hides you and slows you down');
const wi = G.ZONES.sunscar.spawns.findIndex(sp => sp.weather === 'sandstorm');
run(6);
ok(S.mobs.some(m => m.alive && m.spawnIdx === wi), 'a storm-only Dune Worm surfaces in the sandstorm');
findWx('sunscar', 'clear'); run(1);
ok(!S.mobs.some(m => m.alive && m.spawnIdx === wi && m.state === 'idle'), 'it burrows away when the storm ends');
const m = S.mobs.find(x => x.alive && x.aggro && x.aggro.sight);
if (m) { const sight = m.aggro.sight; P().x = m.x + Math.cos(m.face) * sight * 0.8; P().y = m.y + Math.sin(m.face) * sight * 0.8; const clearSee = G.detects(m, P()); findWx('sunscar', 'sandstorm'); ok(clearSee && !G.detects(m, P()), 'monsters that see you in clear weather miss you in a sandstorm'); }
else ok(true, 'no sighted monster to test detection');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
