const H = require('./harness.js'); const { G } = H; const S = G.S; let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const z = G.ZONES.frost;
ok(!!z.cacheId && !z.npcs.some(n => n.id === z.cacheId), 'cache is not a fixed npc');
G.CONFIG.cacheChance = 1;
let c = G.dailyCache(z);
ok(c && c.id === z.cacheId, 'cache rolls in');
G.save.created = 111; const a = G.dailyCache(z);
ok(a && G.dailyCache(z).x === a.x && G.dailyCache(z).y === a.y, 'same spot all day');
G.CONFIG.cacheChance = 0.3; let n = 0;
for (let i = 1; i <= 300; i++) { G.save.created = i; if (G.dailyCache(z)) n++; }
ok(n > 50 && n < 130, 'rare: about 30% of days (' + n + '/300)');
G.CONFIG.cacheChance = 1; G.save.created = 5;
const npc = Object.assign({ id: z.cacheId, x: 1, y: 1 }, G.NPCS[z.cacheId]);
G.openChest(npc);
ok(npc.gone === true && G.dailyCache(z) === null, 'cache vanishes after opening and stays gone today');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
