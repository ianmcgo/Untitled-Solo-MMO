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
  const folk = z.npcs.filter(n => { const d = G.NPCS[n.id]; return d && !d.prop && !d.crystal && !d.warpstone; });
  for (const n of folk) {
    const near = folk.filter(o => o !== n && Math.hypot(o.x - n.x, o.y - n.y) < 60).map(o => o.id);
    ok(!near.length, zid + ' ' + n.id + ' has room around them ' + near.join(','));
    if (n.id.startsWith('v_')) continue;
    if ((z.stalls || []).some(s => Math.hypot(s.x - n.x, s.y - n.y) < 45) || (z.props || []).some(p => p.type === 'desk' && Math.hypot(p.x - n.x, p.y - n.y) < 50)) continue;
    let bd = 1e9, ang = 0;
    for (const p of z.paths || []) { if (p.lane) continue; for (let i = 0; i < p.pts.length - 1; i++) { const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, tt = Math.max(0, Math.min(1, ((n.x - a[0]) * dx + (n.y - a[1]) * dy) / L)), qx = a[0] + dx * tt, qy = a[1] + dy * tt, dd = Math.hypot(n.x - qx, n.y - qy); if (dd < bd) { bd = dd; ang = Math.atan2(qy - n.y, qx - n.x); } } }
    const f = n.face == null ? Math.PI / 2 : n.face, diff = Math.abs(Math.atan2(Math.sin(f - ang), Math.cos(f - ang)));
    ok(bd > 1e8 || diff < 0.35, zid + ' ' + n.id + ' faces the street (off by ' + diff.toFixed(2) + ')');
  }
  for (const e of (z.exits || []).filter(e => e.kind !== 'door' && G.ZONES[e.to])) ok(z.npcs.some(n => G.NPCS[n.id] && G.NPCS[n.id].signTo === e.to && Math.hypot(n.x - e.x - e.w / 2, n.y - e.y - e.h / 2) < 400 && /^To /.test(G.NPCS[n.id].name)), zid + ' exit to ' + e.to + ' has a signpost naming it');
  for (const n of z.npcs) if (n.sleep) ok(n.home != null && !!(z.houses || [])[n.home], zid + ' ' + n.id + ' sleeps in a house in the same district');
  for (const s of z.stalls || []) ok(G.roadGap(z, s.x, s.y, true) >= 14, zid + ' stall@' + s.x + ',' + s.y + ' is off the road');
  const sides = typeof z.outerWall === 'string' ? z.outerWall : z.outerWall ? 'nesw' : '';
  for (const h of z.houses || []) {
    const r = G.houseRect(h), nm = zid + ' ' + (h.sign || h.type || 'house') + '@' + Math.round(h.x) + ',' + Math.round(h.y);
    ok(!(sides.includes('n') && r.y < 36 || sides.includes('s') && r.y + r.h > z.h - 36 || sides.includes('w') && r.x < 36 || sides.includes('e') && r.x + r.w > z.w - 36), nm + ' stays clear of the district walls');
  }
  for (const e of (z.exits || []).filter(e => e.gate)) {
    const to = G.ZONES[e.to], back = to && (to.exits || []).find(q => q.gate && q.to === zid);
    ok(!!back, zid + ' gate to ' + e.to + ' has a gate back');
    if (!to) continue;
    ok(!(to.houses || []).some(h => G.inRect(e.tx, e.ty, G.houseRect(h), 30)), zid + ' gate to ' + e.to + ' arrives clear of buildings');
    ok(!(to.npcs || []).some(n => Math.hypot(n.x - e.tx, n.y - e.ty) < 40), zid + ' gate to ' + e.to + ' arrives clear of people');
    ok(!(z.houses || []).some(h => G.rectsHit(G.houseRect(h), { x: e.x - 30, y: e.y - 30, w: e.w + 60, h: e.h + 60 }, 0)), zid + ' gate to ' + e.to + ' is not blocked by a building');
  }
}
for (const t of Object.keys(G.VENDOR_TOWNS)) ok(Object.keys(G.ZONES).filter(k => G.areaOf(k) === t).reduce((s, k) => s + G.ZONES[k].npcs.filter(n => n.id.startsWith('v_')).length, 0) === 6, t + ' has six vendors');
for (const zid of towns) {
  const z = G.ZONES[zid];
  for (const a of z.ambient || []) {
    if (!a.path) continue;
    let hit = false;
    for (let i = 0; i < a.path.length && !hit; i++) { const q = a.path[i], r = a.path[(i + 1) % a.path.length]; for (let k = 0; k <= 1; k += 0.05) { const x = q[0] + (r[0] - q[0]) * k, y = q[1] + (r[1] - q[1]) * k; if ((z.houses || []).some(h => G.inRect(x, y, G.houseRect(h), 6)) || (z.water || []).some(w => Math.hypot(x - w.x, y - w.y) < w.r)) { hit = true; break; } } }
    ok(!hit, zid + ' walker route stays off buildings and water');
  }
}
console.log(fails ? fails + ' FAILED' : 'townlayout: all passed (' + towns.join(', ') + ')');
process.exit(fails ? 1 : 0);
