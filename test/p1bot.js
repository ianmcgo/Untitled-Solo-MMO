const H = require('./harness.js'); const { G, tick, alllog } = H; const S = G.S; const P = () => G.player;
const job = process.argv[3] || 'WAR', sub = process.argv[4] || null, minutes = +(process.argv[5] || 30);
const order = ['mira', 'kael', 'sable', 'rook', 'fen'];
let errors = 0, deaths = 0, hires = [];
if (job === 'PLD' || job === 'RDM') { G.save.jobsUnlocked[job] = true; G.setJob(job, null); if (job === 'RDM') G.equip('linen_robe'); }
else if (job !== 'WAR') { G.setJob(job, null); G.giveItem(job === 'BLM' ? 'ash_staff' : 'ash_club', 1, true); G.giveItem('linen_robe', 1, true); G.equip(job === 'BLM' ? 'ash_staff' : 'ash_club'); G.equip('linen_robe'); }
const mercOrder = { PLD: ['mira', 'sable', 'lisette', 'rook', 'fen'], RDM: ['kael', 'mira', 'dorn', 'sable', 'fen'] }[job];
if (mercOrder) { order.length = 0; order.push(...mercOrder); G.save.jobsUnlocked.PLD = G.save.jobsUnlocked.RDM = true; }
G.enterZone('hollow', 70, 1100);
const pickTarget = () => { const p = P(); let best = null, bd = 1e9; for (const m of S.mobs) { if (!m.alive || m.lv > p.lv + (S.party.length > 2 ? 1 : 0) || m.famKey === 'chieftain') continue; if (S.party.length < 3 && S.mobs.some(o => o !== m && o.alive && o.fam.link && m.fam.link && G.dist(o, m) < 160)) continue; const d = G.dist(m, p); if (d < bd) { bd = d; best = m; } } return best; };
const steps = minutes * 3600;
const skillLog = [];
for (let i = 0; i < steps; i++) {
  try { tick(1000 / 60); } catch (e) { errors++; if (errors < 4) console.log('ERR', e.stack.split('\n').slice(0, 4).join('\n')); }
  if (S.ko) { deaths++; G.returnHome(); G.enterZone('hollow', 70, 1100); continue; }
  if (S.zoneId !== 'hollow') G.enterZone('hollow', 70, 500);
  if (i % 6) continue;
  const p = P();
  if (i % (3600 * 5) === 0) skillLog.push('t' + Math.round(i / 3600) + 'm lv' + p.lv + ' sword ' + G.save.skills[job][p.stats.wtype] + '/' + G.skillCap(p, p.stats.wtype));
  const nextHire = order.find(id => !G.save.hired.includes(id));
  const inCombat = S.mobs.some(m => m.alive && m.state === 'combat' && m.enmity.size);
  if (!inCombat && nextHire && G.save.gil < G.MERCS[nextHire].fee) { const val = G.save.inventory.filter(x => G.ITEMS[x.id].kind === 'mat' && x.id !== 'goblin_pouch').reduce((n, x) => n + Math.floor(G.ITEMS[x.id].price / 4) * x.qty, 0); if (G.save.gil + val >= G.MERCS[nextHire].fee) { for (const x of G.save.inventory.slice()) if (G.ITEMS[x.id].kind === 'mat' && x.id !== 'goblin_pouch') for (let q = x.qty; q > 0; q--) G.sell(x.id); } }
  if (!inCombat && nextHire && G.save.gil >= G.MERCS[nextHire].fee) { G.hireMerc(nextHire); hires.push(nextHire + '@' + Math.round(i / 3600) + 'm'); continue; }
  if (p.casting) continue;
  if (p.engaged && p.attackTarget) {
    for (const a of G.actionList(p)) {
      if (a.kind === 'ws' && p.tp >= 1000) { G.playerAct(a); break; }
      if (a.kind === 'ma' && ['stone', 'water', 'aero', 'fire', 'blizzard', 'thunder', 'banish'].includes(a.id) && p.mp > p.maxMp * 0.3) { G.playerAct(a); if (p.casting) break; }
      if (a.kind === 'ma' && a.id === 'cure' && p.hp < p.maxHp * 0.5) { G.playerAct(a); if (p.casting) break; }
      if (a.kind === 'ja' && a.id !== 'provoke') G.playerAct(a);
    }
    if (p.hp < p.maxHp * 0.3 && G.save.inventory.some(s => s.id === 'potion')) G.useItem('potion');
    continue;
  }
  if (!inCombat && (p.hp < p.maxHp * 0.85 || (p.maxMp && p.mp < p.maxMp * 0.6) || S.party.some(a => a.alive && a.hp < a.maxHp * 0.7))) { S.moveTarget = null; continue; }
  const t = inCombat ? S.mobs.find(m => m.alive && m.state === 'combat' && m.enmity.size) : pickTarget();
  if (t) { p.target = t; G.toggleEngage(true); }
}
const s = G.save, cnt = r => alllog.filter(x => r.test(x)).length;
console.log(JSON.stringify({ job: job + '/' + (sub || '-'), lv: s.jobs[job].lv, xp: s.jobs[job].xp, gil: s.gil, party: S.party.length, hires, deaths, errors, kills: cnt(/is defeated/), sc: cnt(/^Skillchain/), mb: cnt(/Magic Burst/), skillups: cnt(/skill rises/), learned: cnt(/You learn the weapon skill/), regen: 0 }));
console.log(skillLog.join(' | '));
