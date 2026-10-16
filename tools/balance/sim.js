const fs = require('fs'), path = require('path');
const [gamePath, outPath, jobsArg, trialsArg] = process.argv.slice(2);
const harnessSrc = fs.readFileSync(path.join(__dirname, '../../test/harness.js'), 'utf8').replace('globalThis.G={', 'globalThis.G={SKILL_RATINGS,ALL_JOBS,');
const tmp = path.join(__dirname, '.harness_ext_' + process.pid + '.js');
fs.writeFileSync(tmp, harnessSrc);
process.argv[2] = gamePath;
const CURVE = process.env.SIM_CURVE ? JSON.parse(process.env.SIM_CURVE) : null;
const H = require(tmp);
const { G, tick } = H; const S = G.S; const P = () => G.player;
const RATE = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const LEVELS = process.env.SIM_LEVELS ? process.env.SIM_LEVELS.split(',').map(Number) : [1, 5, 10, 15, 20];
const DIFFS = [['easy', -3], ['even', 0], ['tough', 2]].filter(d => !process.env.SIM_DIFFS || process.env.SIM_DIFFS.split(',').includes(d[0]));
const FAMS = ['goblin', 'hill_lizard'];
const TRIALS = +(trialsArg || 4);
const NUKES = ['stone', 'water', 'aero', 'fire', 'blizzard', 'thunder', 'banish', 'dia'];

function gearFor(job, lv) {
  const I = G.ITEMS, rate = G.SKILL_RATINGS[job] || {};
  const ok = id => { const it = I[id]; if (it.kind !== 'equip' || it.hq || it.rare || it.nm || it.ex || !it.price || it.lv > lv) return false; return it.jobs.includes(job); };
  const pool = Object.keys(I).filter(ok);
  const better = (a, b) => !b || I[a].lv > I[b].lv || (I[a].lv === I[b].lv && I[a].price > I[b].price);
  const best = slot => { let b = null; for (const id of pool) if (I[id].slot === slot && better(id, b)) b = id; return b; };
  const g = {};
  let w = null, wr = -1;
  for (const id of pool) { const it = I[id]; if (it.slot !== 'main' || !it.wtype || it.wtype === 'instrument') continue; const r = RATE[rate[it.wtype]] || 0; if (r > wr || (r === wr && better(id, w))) { w = id; wr = r; } }
  if (w) g.main = w;
  if (job === 'RNG') {
    let b = null; for (const id of pool) if (I[id].slot === 'ranged' && I[id].wtype === 'archery' && better(id, b)) b = id;
    if (b) { g.ranged = b; let a = null; for (const id of pool) if (I[id].slot === 'ammo' && I[id].dmg && better(id, a)) a = id; if (a) g.ammo = a; }
  }
  for (const s of ['head', 'body', 'hands', 'legs', 'feet', 'neck', 'waist', 'back']) { const b = best(s); if (b) g[s] = b; }
  if (job === 'PLD' || job === 'WAR') { const b = best('sub'); if (b && !I[b].wtype) g.sub = b; }
  return g;
}

function setup(job, lv) {
  G.save.jobsUnlocked[job] = true;
  if (!G.save.jobs[job]) G.save.jobs[job] = { lv: 1, xp: 0 };
  G.save.jobs[job].lv = lv;
  G.setJob(job, null);
  G.save.gear = gearFor(job, lv);
  G.refreshPlayer(true);
  const p = P();
  const sk = G.save.skills[job] = G.save.skills[job] || {};
  for (const k of ['h2h', 'dagger', 'sword', 'gsword', 'axe', 'greataxe', 'scythe', 'polearm', 'katana', 'gkatana', 'club', 'staff', 'archery', 'healing', 'divine', 'elemental', 'enfeebling', 'enhancing', 'dark', 'singing', 'summoning', 'ninjutsu', 'evasion', 'shield', 'parry', 'guard']) sk[k] = G.skillCap(p, k);
  G.refreshPlayer(true);
}

function fight(fam, mlv) {
  const p = P();
  S.mobs = [];
  p.hp = p.maxHp; p.mp = p.maxMp; p.tp = 0; p.buffs = {}; p.alive = true; p.casting = null; S.ko = false;
  const m = G.buildMob(fam, Math.max(1, mlv), p.x + 30, p.y, null);
  m.aggro = null; m.link = false; S.mobs.push(m);
  p.target = m; G.toggleEngage(true);
  const mhp = m.maxHp, t0 = S.time; let dealt = 0;
  for (let i = 0; i < 60 * 180; i++) {
    tick(1000 / 60);
    S.mobs = S.mobs.filter(x => x === m);
    if (!m.alive || !p.alive || S.ko) break;
    if (i % 6) continue;
    if (p.casting) continue;
    if (!p.engaged) { p.target = m; G.toggleEngage(true); }
    for (const a of G.actionList(p)) {
      if (a.kind === 'ws' && p.tp >= 1000) { G.playerAct(a); break; }
      if (a.kind === 'ma' && /^cure/.test(a.id) && p.hp < p.maxHp * 0.45 && p.mp >= 8) { G.playerAct(a); if (p.casting) break; }
      if (a.kind === 'ma' && NUKES.includes(a.id) && p.mp > p.maxMp * 0.3) { G.playerAct(a); if (p.casting) break; }
    }
  }
  return { win: !m.alive && p.alive && !S.ko, dead: !p.alive || S.ko, secs: S.time - t0, hpLoss: 1 - Math.max(0, p.hp) / p.maxHp, mhp, matt: m.att || (m.stats && m.stats.att), mdef: m.def || (m.stats && m.stats.def) };
}

if (CURVE) Object.assign(G.CONFIG.mobCurve, CURVE);
G.enterZone('hollow', G.ZONES.hollow.start.x, G.ZONES.hollow.start.y);
for (let i = 0; i < 30; i++) tick(1000 / 60);
const jobs = (jobsArg && jobsArg !== 'all' ? jobsArg.split(',') : G.ALL_JOBS.slice());
const out = [];
for (const job of jobs) for (const lv of LEVELS) {
  setup(job, lv);
  const st = P().stats, gear = Object.assign({}, G.save.gear);
  const row = { job, lv, gear, ps: { hp: P().maxHp, mp: P().maxMp, att: st.att, acc: st.acc, def: st.def, eva: st.eva, dmg: st.dmg, delay: st.delay, wtype: st.wtype }, diffs: {} };
  for (const [dn, dl] of DIFFS) {
    const rs = [];
    for (const fam of FAMS) for (let t = 0; t < TRIALS; t++) { setup(job, lv); rs.push(fight(fam, lv + dl)); }
    const n = rs.length, avg = k => rs.reduce((s, r) => s + r[k], 0) / n;
    const wins = rs.filter(r => r.win);
    row.diffs[dn] = { win: wins.length / n, death: rs.filter(r => r.dead).length / n, ttk: wins.length ? wins.reduce((s, r) => s + r.secs, 0) / wins.length : null, hpLoss: avg('hpLoss'), mhp: avg('mhp') };
  }
  out.push(row);
  process.stderr.write(job + ' ' + lv + ' ');
}
fs.writeFileSync(outPath, JSON.stringify(out));
try { fs.unlinkSync(tmp); } catch (e) {}
