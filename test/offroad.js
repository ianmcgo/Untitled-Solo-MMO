const H = require('./harness.js'); const { G } = H;
const V = process.env.V;
let fails = 0; const bad = {};
const R_DRESS = { tree: 22, planter: 18, statue: 24, well: 26, cart: 34, hay: 18 };
function gap(z, x, y) {
  let g = 1e9;
  for (const p of z.paths || []) for (let i = 0; i < p.pts.length - 1; i++) {
    const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L));
    g = Math.min(g, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) - p.w / 2);
  }
  return g;
}
function plazaCentre(z, x, y) { return (z.plaza ? [z.plaza] : []).concat(z.plazas || []).some(q => Math.hypot(x - q.x, y - q.y) < 40); }
function check(zid, z, kind, x, y, r) {
  if (plazaCentre(z, x, y)) return;
  const g = gap(z, x, y);
  if (g < r) { fails++; (bad[zid + ' ' + kind] = bad[zid + ' ' + kind] || []).push(Math.round(x) + ',' + Math.round(y) + ' (' + Math.round(g) + '<' + r + ')'); }
}
for (const zid of Object.keys(G.ZONES)) {
  const z = G.ZONES[zid];
  if (!(z.paths || []).length) continue;
  for (const n of z.npcs || []) { const d = G.NPCS[n.id]; if (!d) continue; check(zid, z, 'npc ' + n.id, n.x, n.y, d.prop || d.crystal || d.warpstone ? 24 : 14); }
  for (const s of z.stalls || []) check(zid, z, 'stall', s.x, s.y, 30);
  for (const p of z.props || []) check(zid, z, 'prop ' + p.type, p.x, p.y, p.r || 22);
  for (const d of z.dressing || []) check(zid, z, 'dressing ' + d.t, d.x, d.y, (R_DRESS[d.t] || 20) * (d.s || 1));
  for (const q of z.benches || []) check(zid, z, 'bench', q[0], q[1], 18);
  for (const q of z.racks || []) check(zid, z, 'rack', q[0], q[1], 20);
  for (const q of z.dummies || []) check(zid, z, 'dummy', q[0], q[1], 14);
  for (const q of z.lamps || []) check(zid, z, 'lamp', q[0], q[1], 6);
  for (const q of z.gardens || []) for (const [cx, cy] of [[q.x - q.w / 2, q.y - q.h / 2], [q.x + q.w / 2, q.y - q.h / 2], [q.x - q.w / 2, q.y + q.h / 2], [q.x + q.w / 2, q.y + q.h / 2], [q.x, q.y]]) check(zid, z, 'garden', cx, cy, 6);
  if (z.stable) check(zid, z, 'stable', z.stable.x, z.stable.y, 40);
  for (const t in z.gather || {}) for (const q of (z.gather[t].at || [])) check(zid, z, 'gather ' + t, q[0] != null ? q[0] : q.x, q[1] != null ? q[1] : q.y, 20);
}
for (const k in bad) console.log('FAIL ' + k + ': ' + bad[k].length + (V ? ' ' + bad[k].join(' ') : ' e.g. ' + bad[k].slice(0, 3).join(' ')));
console.log(fails ? fails + ' FAILED' : 'offroad: all passed');
process.exit(fails ? 1 : 0);
