const H = require('./harness.js'); const { G } = H; let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const outdoor = Object.keys(G.ZONES).filter(k => (G.ZONES[k].theme || 'field') === 'field' && !G.ZONES[k].safe);
let sites = 0, kinds = {};
for (const k of outdoor) {
  const z = G.ZONES[k];
  for (const f of z.sites || []) {
    sites++; kinds[f.kind] = 1;
    const ex = Math.min(...(z.exits || []).map(e => Math.hypot(f.x - e.x - e.w / 2, f.y - e.y - e.h / 2)), 1e9);
    ok(G.pathGap(z, f.x, f.y) > f.r && ex >= 460 && f.x > 300 && f.y > 300 && f.x < z.w - 300 && f.y < z.h - 300, k + ' ' + f.kind + ' site off the road, away from exits and edges');
    ok(!(z.water || []).some(w => Math.hypot(f.x - w.x, f.y - w.y) < w.r + f.r), k + ' ' + f.kind + ' site out of the water');
  }
}
ok(sites >= 16 && kinds.clearing && kinds.overlook && kinds.ruin, 'every kind of field site exists (' + sites + ')');
const ids = new Set(); let dup = false; for (const id of G.POI_IDS) { if (ids.has(id)) dup = true; ids.add(id); }
ok(!dup && G.POI_IDS.length >= 23, 'points of interest have unique ids (' + G.POI_IDS.length + ')');
for (const k of ['sunscar', 'verdant', 'cinder', 'gullisle', 'highlands']) ok(G.zkey(G.POI_LORE, k), k + ' has a tablet story');
let near = 0, all = 0;
for (const k of outdoor) for (const n of G.ZONES[k].npcs || []) { const d = G.NPCS[n.id]; if (!d || !d.poi) continue; all++; if (G.pathGap(G.ZONES[k], n.x, n.y) < 240) near++; }
ok(near / all > 0.8, 'most points of interest stand within sight of a path (' + near + '/' + all + ')');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
