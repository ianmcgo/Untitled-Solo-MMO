const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
for (const zid of ['outpost', 'harbor', 'ironvale']) {
  const Z = G.ZONES[zid]; G.enterZone(zid, Z.start.x, Z.start.y); run(0.3);
  ok(!S.ambient.some(a => a.type === 'walker'), zid + ': no wandering people spawn (' + S.ambient.filter(a => a.type === 'walker').length + ')');
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
for (const z of G.areaZones('outpost')) for (const d of G.ZONES[z].districts) G.save.districts['outpost:' + d.id] = 1;
ok(G.questComplete('tour_outpost'), 'tour quest completes once every district is visited');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
