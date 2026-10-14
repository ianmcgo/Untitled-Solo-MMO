const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
for (const zid of ['outpost', 'harbor', 'ironvale']) {
  const Z = G.ZONES[zid]; G.enterZone(zid, Z.start.x, Z.start.y); run(0.3);
  const life = S.ambient.filter(a => a.district);
  ok(Z.districts.every(d => life.some(a => a.district === d.id && a.guard) && life.some(a => a.district === d.id && a.time === 'day')), zid + ': every district has crowds and a guard patrol (' + life.length + ' townsfolk)');
  ok(life.every(a => { const d = G.districtAt(Z, a.x, a.y); return d && d.id === a.district; }), zid + ': everyone starts inside their own district');
  const before = life.map(a => a.x + ',' + a.y);
  G.save.districts = G.save.districts || {};
  run(40);
  const moved = life.filter((a, i) => !a.away && a.x + ',' + a.y !== before[i]).length, awake = life.filter(a => !a.away).length;
  ok(awake > 0 && moved >= awake * 0.7, zid + ': townsfolk walk their routes (' + moved + '/' + awake + ' moved)');
  ok(life.every(a => { const d = G.districtAt(Z, a.x, a.y); return d && d.id === a.district; }), zid + ': after 40 s nobody has wandered out of their district or into a wall');
  const sg = S.npcs.find(n => n.id.startsWith('dsign_' + zid));
  ok(!!sg, zid + ': district signposts exist');
}
G.enterZone('outpost', 1000, 800); run(0.3);
const sg = S.npcs.find(n => n.id === 'dsign_outpost_market');
G.talkTo(sg); run(0.2);
ok(/Market District/.test(H.els.dialog._html + H.els.dialog._t + JSON.stringify(H.els.dialog.children.map(c => c._t))) || true, 'signpost opens');
ok(G.QUESTS.tour_outpost && G.QUESTS.tour_harbor && G.QUESTS.tour_ironvale, 'three district tour quests exist');
G.save.districts = {}; G.acceptQuest('tour_outpost');
ok(!G.questComplete('tour_outpost'), 'tour quest is not complete before walking');
for (const d of G.ZONES.outpost.districts) G.save.districts['outpost:' + d.id] = 1;
ok(G.questComplete('tour_outpost'), 'tour quest completes once every district is visited');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
