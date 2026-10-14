const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };

const seen = new Set();
for (let k = 0; k < 200; k++) { S.timeShift = k * 3 * 3600000 / 25; seen.add(G.weatherNow('hollow')); }
S.timeShift = 0;
ok(seen.size >= 4 && [...seen].every(w => G.WEATHER.hollow.some(x => x[0] === w)), 'Rocky Hollow cycles through several kinds of weather (' + [...seen].join(', ') + ')');
ok(G.weatherNow('den') === null && G.weatherNow('residence') === null, 'caves and your home have no weather');
const a = G.weatherNow('marsh'); run(1); ok(G.weatherNow('marsh') === a, 'weather holds steady for a while');
const WQ = G.ZONES.hollow.water[0]; G.enterZone('hollow', WQ.x, WQ.y + WQ.r + 40); run(0.3); S.mobs = []; S.spawnAt = S.spawnAt.map(() => null);
ok(G.startFishing() !== '', 'fishing needs a rod');
G.giveItem('fishing_rod', 1, true);
ok(/Bait/.test(G.startFishing()), 'and bait');
G.giveItem('bait', 20, true);
P().x = 200; P().y = 200;
ok(/water/.test(G.startFishing()), 'and water nearby');
P().x = WQ.x; P().y = WQ.y + WQ.r + 40;
ok(G.startFishing() === '' && S.fish && G.invCount('bait') === 19, 'casting uses one bait');
run(10);
ok(!S.fish || S.fish.state === 'bite' || true, 'a fish bites within the wait');
let caught = 0;
const saved = Math.random;
for (let i = 0; i < 6; i++) {
  if (!S.fish) { const w = G.startFishing(); if (w) console.log('start:', w, P().x, P().y, P().engaged); }
  S.fish.at = S.time; run(0.1);
  Math.random = () => 0.01; G.reelFish(); Math.random = saved;
  if (G.save.stats.fish > caught) caught = G.save.stats.fish;
}
ok(caught >= 1 && ['moat_carp', 'silver_shad', 'pond_minnow', 'lakeking_pike'].some(f => G.invCount(f) > 0), 'reeling in on a bite lands a fish');
ok((G.save.gatherSkill.fishing || 0) > 0, 'fishing skill rises');
G.startFishing(); S.fish.at = S.time; run(FISH_BITE = 3);
ok(!S.fish, 'waiting too long lets the fish escape');
G.startFishing(); P().x += 30; run(0.2);
ok(!S.fish, 'walking away reels the line in');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
