const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; if (!c || process.env.V) console.log((c ? 'PASS ' : 'FAIL ') + m); };
const towns = Object.keys(G.ZONES).filter(k => G.ZONES[k].theme === 'town' && !G.ZONES[k].indoor);
for (const zid of towns) {
  const z = G.ZONES[zid], walls = G.cityWallRects(z), lanes = (z.paths || []).filter(p => p.lane);
  for (const h of z.houses || []) {
    const nm = zid + ' ' + (h.sign || h.type || 'house') + '@' + Math.round(h.x) + ',' + Math.round(h.y), r = G.houseRect(h);
    const d = G.houseDoor(h), own = lanes.find(p => Math.hypot(p.pts[0][0] - d.x, p.pts[0][1] - d.y) < 2);
    const hit = G.rectOnRoad(z, r, -2, own);
    ok(!hit, nm + ' stands clear of the roads');
    ok(!(z.houses || []).some(o => o !== h && G.rectsHit(r, G.houseRect(o), 4)), nm + ' does not overlap another building');
    ok(!walls.some(w => G.rectsHit(r, w, 2)), nm + ' does not overlap a city wall');
    if (!h.fixed) ok(!!G.doorRay(z, h, h.rot || 0, 100), nm + ' door faces a street within 100');
  }
  for (const n of z.npcs) {
    const d = G.NPCS[n.id];
    if (!d || d.prop || d.crystal || d.warpstone) continue;
    ok(G.roadGap(z, n.x, n.y, true) >= 10, zid + ' ' + n.id + ' stands off the road (' + Math.round(G.roadGap(z, n.x, n.y, true)) + ')');
    ok(!(z.houses || []).some(h => G.inRect(n.x, n.y, G.houseRect(h), 6)), zid + ' ' + n.id + ' is not inside a building');
    if (n.id.startsWith('v_')) {
      const h = z.houses.find(q => q.shop === n.id);
      ok(!!h, zid + ' ' + n.id + ' has a shop building');
      if (!h) continue;
      const dd = G.houseDoor(h, 34), [dx, dy] = G.houseDir(h);
      ok(Math.hypot(n.x - dd.x, n.y - dd.y) <= 50, zid + ' ' + n.id + ' stands at its shop door');
      ok(Math.abs(n.face - Math.atan2(dy, dx)) < 0.01, zid + ' ' + n.id + ' faces the street');
    }
  }
  for (const s of z.stalls || []) ok(G.roadGap(z, s.x, s.y, true) >= 14, zid + ' stall@' + s.x + ',' + s.y + ' is off the road');
  if (G.VENDOR_TOWNS[zid]) ok(z.npcs.filter(n => n.id.startsWith('v_')).length === 6, zid + ' has six vendors');
}
console.log(fails ? fails + ' FAILED' : 'townlayout: all passed (' + towns.join(', ') + ')');
process.exit(fails ? 1 : 0);
