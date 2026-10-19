const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const Z = G.ZONES.outpost;
ok(Z.districts.length === 5 && Z.gates.length === 8, 'the Outpost has five districts joined by eight gate halls');
ok(['market', 'gov', 'res', 'ind', 'gate'].every(id => Z.districts.some(d => d.id === id)), 'Market, Government, Residential, Industrial and Eastgate districts');
G.enterZone('outpost', Z.start.x, Z.start.y); run(0.6);
ok(S.district === 'market', 'you arrive in the Market District');
ok(G.districtAt(Z, 790, 262).id === 'gov' && G.districtAt(Z, 780, 1210).id === 'ind' && G.districtAt(Z, 200, 760).id === 'res', 'Rhea is in Government, Garrick in Industrial, your residence in Residential');
const rects = G.cityWallRects(Z);
ok(rects.length > 8 && !rects.some(r => !r.tower && 1000 > r.x && 1000 < r.x + r.w && 470 > r.y && 470 < r.y + r.h), 'the walls leave a gap at each gate hall');
P().x = 1000; P().y = 520; for (let i = 0; i < 90; i++) { P().y -= 2; G.keepOutOfRects(P()); }
ok(P().y < 440, 'you can walk north through the Government gate (' + Math.round(P().y) + ')');
P().x = 800; P().y = 520; for (let i = 0; i < 90; i++) { P().y -= 2; G.keepOutOfRects(P()); }
ok(P().y > 470, 'the wall stops you away from the gate (' + Math.round(P().y) + ')');
G.enterZone('outpost', Z.start.x, Z.start.y); run(0.2);
S.moveTarget = { x: 790, y: 300 };
run(25);
ok(G.dist(P(), { x: 790, y: 300 }) < 10, 'click-to-move routes through the gate hall into another district (' + Math.round(P().x) + ',' + Math.round(P().y) + ')');
ok(S.district === 'gov' && G.save.districts['outpost:gov'], 'entering the Government District is recorded');
const al = S.party[1];
if (al) { ok(G.dist(al, P()) < 160, 'your party follows you through the gate (' + Math.round(G.dist(al, P())) + ' px)'); }
G.enterZone('outpost', 300, 1100); run(0.2);
S.moveTarget = { x: 860, y: 1240 }; run(30);
ok(G.dist(P(), { x: 860, y: 1240 }) < 12, 'routes from Residential to Industrial (' + Math.round(P().x) + ',' + Math.round(P().y) + ')');
S.moveTarget = { x: 1700, y: 300 }; run(40);
ok(G.dist(P(), { x: 1700, y: 300 }) < 10, 'routes from Industrial to Eastgate (' + Math.round(P().x) + ',' + Math.round(P().y) + ')');
const sv = G.normalizeSave(Object.assign({}, G.save, { zv: 1, loc: { zone: 'outpost', x: 610, y: 440 } }));
ok(sv.loc.x === Z.start.x && sv.loc.y === Z.start.y && sv.zv === 3, 'old saves standing in the old Outpost are moved to the Market plaza');
{ const hx = G.ZONES.hollow.exits.find(e => e.to === 'outpost'); ok(G.districtAt(Z, hx.tx, hx.ty).id === 'gate', 'Rocky Hollow leads into Eastgate'); }
ok(G.districtName('outpost', 1000, 760) === 'Market District', 'districtName names the district');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
