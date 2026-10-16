const fs = require('fs'), path = require('path');
const [gamePath, simPath] = process.argv.slice(2);
const harnessSrc = fs.readFileSync(path.join(__dirname, '../../test/harness.js'), 'utf8').replace('globalThis.G={', 'globalThis.G={SKILL_RATINGS,ALL_JOBS,xpFor,sellPrice,GEAR_DROP_IDS:typeof GEAR_DROP_IDS!=="undefined"?GEAR_DROP_IDS:[],');
const tmp = path.join(__dirname, '.harness_ext_' + process.pid + '.js');
fs.writeFileSync(tmp, harnessSrc);
process.argv[2] = gamePath;
const { G } = require(tmp);
fs.unlinkSync(tmp);
const sim = simPath ? JSON.parse(fs.readFileSync(simPath)) : null;
const med = a => { a = a.filter(x => x != null).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
const I = G.ITEMS, C = G.CONFIG;
const simAt = (lv, k) => { if (!sim) return null; const pts = [1, 5, 10, 15, 20]; let lo = pts.filter(p => p <= lv).pop(), hi = pts.find(p => p >= lv); const v = p => med(sim.filter(r => r.lv === p).map(r => k === 'ttk' ? r.diffs.even.ttk : r.diffs.even.hpLoss)); if (lo === hi) return v(lo); const t = (lv - lo) / (hi - lo); return v(lo) + (v(hi) - v(lo)) * t; };
const fams = {};
for (const z in G.ZONES) for (const sp of G.ZONES[z].spawns || []) { if (!sp.fam || !sp.lv) continue; const f = G.FAMILIES[sp.fam]; if (!f || f.nm || f.boss) continue; const [a, b] = Array.isArray(sp.lv) ? sp.lv : [sp.lv, sp.lv]; (fams[sp.fam] = fams[sp.fam] || []).push([a, b]); }
const ok = (it, job, lv) => it.kind === 'equip' && !it.hq && !it.rare && !it.nm && !it.ex && it.price && it.lv <= lv && (!it.src || it.src === 'shop') && it.jobs.includes(job);
function setCost(job, lv) {
  let total = 0;
  const RATE = { A: 5, B: 4, C: 3, D: 2, E: 1 }, rate = G.SKILL_RATINGS[job] || {};
  let w = null, wr = -1;
  for (const id in I) { const it = I[id]; if (!ok(it, job, lv) || it.slot !== 'main' || !it.wtype) continue; const r = RATE[rate[it.wtype]] || 0; if (r > wr || (r === wr && (!w || it.lv > I[w].lv))) { w = id; wr = r; } }
  if (w) total += I[w].price;
  for (const s of ['head', 'body', 'hands', 'legs', 'feet', 'neck', 'waist', 'back', 'ear', 'ring']) { let b = null; for (const id in I) { const it = I[id]; if (ok(it, job, lv) && it.slot === s && (!b || it.lv > I[b].lv || (it.lv === I[b].lv && it.price > I[b].price))) b = id; } if (b) total += I[b].price * (s === 'ear' || s === 'ring' ? 2 : 1); }
  return total;
}
const rows = [];
let cumHours = 0;
for (let L = 1; L <= 20; L++) {
  const per = [];
  for (const k in fams) {
    if (!fams[k].some(([a, b]) => a <= L && L <= b)) continue;
    const f = G.FAMILIES[k];
    let v = 0;
    const gr = f.gil || C.mobGil; if (gr) v += (gr[0] + gr[1]) / 2 * L;
    for (const [id, ch, minLv] of f.loot || []) { const it = I[id]; if (!it || it.kind === 'key' || it.kind === 'crystal' || it.kind === 'equip' || (minLv && L < minLv)) continue; v += ch * G.sellPrice(id); }
    per.push(v);
  }
  const pool = G.GEAR_DROP_IDS.filter(id => I[id].lv >= L - 3 && I[id].lv <= L + 1);
  const gearV = pool.length ? 0.06 * pool.reduce((s, id) => s + G.sellPrice(id), 0) / pool.length : 0;
  const lootV = per.length ? per.reduce((a, b) => a + b, 0) / per.length : 0;
  const ttk = simAt(L, 'ttk') || 40, hl = simAt(L, 'hp') || 0.5;
  const cycle = ttk + hl / C.restHp + 20;
  const kph = 3600 / cycle, xp = G.xpFor(L, L);
  const hrsLevel = L < 20 ? C.xpTable[L] / (xp * kph) : 0;
  cumHours += hrsLevel;
  const jobs = ['WAR', 'WHM', 'BLM', 'THF', 'PLD', 'MNK', 'RDM', 'RNG'];
  const set = med(jobs.map(j => setCost(j, L)));
  rows.push({ L, fams: per.length, kph: Math.round(kph), xpHr: Math.round(xp * kph), hrsLevel: +hrsLevel.toFixed(2), cumHours: +cumHours.toFixed(1), lootPerKill: Math.round(lootV), gearPerKill: Math.round(gearV), gilHr: Math.round((lootV + gearV) * kph), gilHrNoGear: Math.round(lootV * kph), setCost: set, hrsForSet: +(set / ((lootV + gearV) * kph)).toFixed(2) });
}
console.log(JSON.stringify(rows));
