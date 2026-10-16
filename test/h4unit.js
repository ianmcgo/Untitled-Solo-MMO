const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
G.enterZone('marsh', 1900, 700); for (let i = 0; i < 12; i++) tick(1000 / 60); S.mobs = []; S.spawnAt = S.spawnAt.map(() => null);
const w = G.buildMob('mire_goblin', 8, P().x + 100, P().y, null, 'THF'); S.mobs.push(w);
const hud = require('fs').readFileSync('../src/hud4.js', 'utf8'); ok(/It fights like a/.test(hud) && /JOBS\[t\.job\]\.name : ""/.test(hud), 'check and target window show the job');
const plain = G.buildMob('mire_goblin', 8, P().x + 100, P().y, null, false); ok(plain.job === null, 'jobless monster has no job');
const pk = G.packJobs(G.FAMILIES.mire_goblin, w.x, w.y); ok(pk && pk.length === 1 && pk[0] === 'THF', 'pack sees neighbour jobs');
let same = 0, N = 400; for (let i = 0; i < N; i++) { const m = G.buildMob('mire_goblin', 8, w.x + 20, w.y, null); if (m.job === 'THF') same++; }
ok(same / N < 0.03, 'pack neighbours rarely share a job (' + same + '/' + N + ')');
let far = 0; for (let i = 0; i < N; i++) { const m = G.buildMob('mire_goblin', 8, w.x + 900, w.y + 900, null); if (m.job === 'THF') far++; }
ok(far / N > 0.03, 'distant mobs roll freely (' + far + '/' + N + ')');
const m = G.buildMob('mire_goblin', 8, P().x + 50, P().y, null, 'WHM'); m.alive = true; S.mobs.push(m);
const k = 'mire_goblin'; delete G.save.bestiary[k]; G.save.bestiary[k] = { seen: 1, kills: 1, zones: [] };
S.mobs = [m]; P().x = m.x; P().y = m.y; G.scanBeasts();
ok(G.save.bestiary[k].jobs && G.save.bestiary[k].jobs.includes('WHM'), 'bestiary records the job seen');
G.scanBeasts(); ok(G.save.bestiary[k].jobs.length === 1, 'job recorded once');
const sc = j => { const [h, a, d, e, dl] = G.MOB_JOB_STATS[j]; return Math.sqrt((a / dl) * h * (0.6 + 0.4 * d) * (1 + e / 400)); };
const vals = Object.keys(G.MOB_JOB_STATS).map(sc); ok(Math.max(...vals) < 1.12 && Math.min(...vals) > 0.78, 'job power index stays in band (' + Math.min(...vals).toFixed(2) + ' to ' + Math.max(...vals).toFixed(2) + ')');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
