const H = require('./harness.js'); const { G } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const inR = (h, x, y, pad) => { const w = h.rot ? h.h : h.w, hh = h.rot ? h.w : h.h; return Math.abs(x - h.x) < w / 2 + pad && Math.abs(y - h.y) < hh / 2 + pad; };
const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
for (const town of ['outpost', 'harbor', 'ironvale']) {
  const z = G.ZONES[town], T = G.VENDOR_TOWNS[town], roles = Object.keys(G.VENDOR_ROLES), dists = new Set();
  for (const r of roles) {
    const id = 'v_' + (r === 'tradesman' ? 'trade' : r) + '_' + town, n = z.npcs.find(q => q.id === id), sh = z.houses.find(h => h.shop === id);
    ok(!!n && !!sh, town + ' ' + r + ' has a shop and stands at it');
    if (!n || !sh) continue;
    ok(Math.abs(n.x - sh.x) < 2 && Math.abs(n.y - (sh.y + sh.h / 2 + 34)) < 2, town + ' ' + r + ' stands at the door');
    const d = G.districtAt(z, sh.x, sh.y); ok(!!d && d.id === T.shops[r].district, town + ' ' + r + ' shop is in its district (' + (d && d.id) + ')');
    dists.add(d && d.id);
    ok(!!sh.sign, town + ' ' + r + ' shop has a sign');
    ok(!z.houses.some(o => o !== sh && inR(o, sh.x, sh.y, 0) || o !== sh && Math.abs(o.x - sh.x) < (o.w + sh.w) / 2 + 10 && Math.abs(o.y - sh.y) < (o.h + sh.h) / 2 + 10), town + ' ' + r + ' shop overlaps no building');
    ok(!z.houses.some(o => o !== sh && inR(o, n.x, n.y, 12)), town + ' ' + r + ' vendor stands clear of buildings');
    ok(!(z.paths || []).some(p => p.pts.slice(0, -1).some((a, i) => segD(sh.x, sh.y, a, p.pts[i + 1]) < p.w / 2 + 6 || [[sh.x - sh.w / 2, sh.y - sh.h / 2], [sh.x + sh.w / 2, sh.y - sh.h / 2], [sh.x - sh.w / 2, sh.y + sh.h / 2], [sh.x + sh.w / 2, sh.y + sh.h / 2]].some(c => segD(c[0], c[1], a, p.pts[i + 1]) < p.w / 2 + 6))), town + ' ' + r + ' shop sits off the roads');
    ok(!z.houses.some(o => o !== sh && Math.abs(o.x - sh.x) < (o.w + sh.w) / 2 && o.y - o.h / 2 > sh.y && o.y - o.h / 2 < n.y + 50), town + ' ' + r + ' has open ground in front of the door');
    const big = [].concat((z.mines || []).map(m => [m[0], m[1], 90]), (z.slipways || []).map(m => [m[0], m[1], 100]), (z.lighthouses || []).map(m => [m[0], m[1], 70]), (z.fountains || []).map(f => [f.x, f.y, 90]));
    const hitBig = big.filter(([bx, by, br]) => Math.hypot(Math.max(Math.abs(bx - sh.x) - sh.w / 2, 0), Math.max(Math.abs(by - sh.y) - sh.h / 2, 0)) < br || Math.hypot(bx - n.x, by - n.y) < br + 10);
    ok(hitBig.length === 0, town + ' ' + r + ' clear of mines, slipways, lighthouses and fountains');
    const front = z.npcs.filter(q => q !== n && Math.abs(q.x - sh.x) < sh.w / 2 + 20 && q.y > sh.y + sh.h / 2 && q.y < sh.y + sh.h / 2 + 120).map(q => q.id);
    ok(front.length === 0, town + ' ' + r + ' storefront view is not blocked ' + front.join(','));
    const near = z.npcs.filter(q => q !== n && !/^(sign_)/.test(q.id) && Math.hypot(q.x - n.x, q.y - n.y) < 60).map(q => q.id);
    ok(near.length === 0, town + ' ' + r + ' vendor has room around them ' + near.join(','));
    ok(!(z.stalls || []).some(s => Math.abs(s.x - sh.x) < sh.w / 2 + 40 && Math.abs(s.y - sh.y) < sh.h / 2 + 30), town + ' ' + r + ' shop clear of stalls');
    for (const e of z.exits || []) ok(!(sh.x + sh.w / 2 + 50 > e.x && sh.x - sh.w / 2 - 50 < e.x + e.w && sh.y + sh.h / 2 + 50 > e.y && sh.y - sh.h / 2 - 50 < e.y + e.h), town + ' ' + r + ' shop clear of exit ' + e.label);
  }
  ok(dists.size >= 3, town + ' vendors spread over at least three districts (' + [...dists].join(',') + ')');
  const trade = ['armorer', 'weaponsmith', 'tradesman'].filter(r => ['ind', 'forge', 'yard', 'fish', 'gate'].includes(T.shops[r].district));
  ok(trade.length === 3, town + ' smiths and tradesman are in working districts');
  for (const n of z.npcs) { if (/^(v_|warpstone_|dsign_|sign_)/.test(n.id)) continue; const sh = z.houses.find(h => h.shop && inR(h, n.x, n.y, 4)); ok(!sh, town + ' ' + n.id + ' is not inside a shop'); }
}
ok(G.VENDOR_TOWNS.outpost.shops.armorer.district === 'ind', 'outpost armorer works in the industrial district');
process.exit(fails ? 1 : 0);
