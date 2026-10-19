const fs = require('fs'), path = require('path');
const [gamePath] = process.argv.slice(2);
const harnessSrc = fs.readFileSync(path.join(__dirname, '../../test/harness.js'), 'utf8').replace('globalThis.G={', 'globalThis.G={sellPrice,GEAR_DROP_IDS:typeof GEAR_DROP_IDS!=="undefined"?GEAR_DROP_IDS:[],');
const tmp = path.join(__dirname, '.harness_drops_' + process.pid + '.js');
fs.writeFileSync(tmp, harnessSrc);
process.argv[2] = gamePath;
const { G } = require(tmp);
fs.unlinkSync(tmp);
const I = G.ITEMS, C = G.CONFIG, JOBS = Object.keys(G.JOBS);
const old = { treant_elder: [12, 20], cactus: [8, 14], bomb: [8, 14], bog_toad: [6, 10], frost_bomb: [8, 14], cinder_bomb: [8, 14], rime_treant: [12, 20], jade_toad: [6, 10] };
const fams = {};
for (const z in G.ZONES) for (const sp of G.ZONES[z].spawns || []) { if (!sp.fam || !sp.lv) continue; const f = G.FAMILIES[sp.fam]; if (!f || f.nm || f.boss) continue; const [a, b] = Array.isArray(sp.lv) ? sp.lv : [sp.lv, sp.lv]; (fams[sp.fam] = fams[sp.fam] || []).push([a, b, sp.n || 1]); }
const scrollV = (L, job) => { const pool = Object.values(G.SPELLS).filter(sp => I['scroll_' + sp.id] && sp.minLv >= L - 4 && sp.minLv <= L + 3 && (!job || G.lootJobOk(job, L, 'scroll_' + sp.id))); return pool.length ? pool.reduce((s, sp) => s + G.sellPrice('scroll_' + sp.id), 0) / pool.length : 0; };
const gearV = (L, job) => { const pool = G.GEAR_DROP_IDS.filter(id => I[id].lv >= L - 3 && I[id].lv <= L + 1 && (!job || G.lootJobOk(job, L, id))); return pool.length ? pool.reduce((s, id) => s + G.sellPrice(id), 0) / pool.length : 0; };
const gch = C.gearDropHum || 0.06, sch = C.scrollDropHum || C.scrollDrop;
const rows = [];
for (let L = 1; L <= 30; L++) {
  let oT = 0, nT = 0, n = 0, hum = 0, bO = 0, bN = 0, nb = 0, hO = 0, hN = 0;
  for (const k in fams) {
    const w = fams[k].filter(([a, b]) => a <= L && L <= b).reduce((s, x) => s + x[2], 0);
    if (!w) continue;
    const f = G.FAMILIES[k], h = G.mobJobOk(f);
    let mat = 0;
    for (const [id, ch, minLv] of f.loot || []) { const it = I[id]; if (!it || it.kind === 'key' || it.kind === 'crystal' || it.kind === 'equip' || /^scroll_/.test(id) || (minLv && L < minLv)) continue; mat += ch * G.sellPrice(id); }
    const og = old[k] || f.gil || C.mobGil, oldV = mat + (og[0] + og[1]) / 2 * L + 0.06 * gearV(L) + C.scrollDrop * scrollV(L);
    let newV = mat;
    if (!h) { const tr = G.trophyFor({ fam: f, lv: L }); if (tr) newV += tr.chance * G.sellPrice(tr.id); }
    if (h) { const g = f.gil || C.mobGil; newV += (g[0] + g[1]) / 2 * L; newV += JOBS.reduce((s, j) => s + gch * gearV(L, j) + sch * scrollV(L, j), 0) / JOBS.length; }
    oT += oldV * w; nT += newV * w; n += w; if (h) { hum += w; hO += oldV * w; hN += newV * w; } else { bO += oldV * w; bN += newV * w; nb += w; }
  }
  if (!n) continue;
  rows.push({ L, humanoidShare: +(hum / n).toFixed(2), oldPerKill: Math.round(oT / n), newPerKill: Math.round(nT / n), ratio: +(nT / oT).toFixed(2), beastOld: nb ? Math.round(bO / nb) : 0, beastNew: nb ? Math.round(bN / nb) : 0, humOld: hum ? Math.round(hO / hum) : 0, humNew: hum ? Math.round(hN / hum) : 0 });
}
console.table(rows);
process.exit(0);
