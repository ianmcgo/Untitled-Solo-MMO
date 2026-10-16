const fs = require('fs');
const [oldF, newF, outF] = process.argv.slice(2);
const O = JSON.parse(fs.readFileSync(oldF)), N = JSON.parse(fs.readFileSync(newF));
const key = r => r.job + ':' + r.lv;
const om = Object.fromEntries(O.map(r => [key(r), r]));
const f1 = v => v == null ? '–' : (Math.round(v * 10) / 10).toString();
const pct = v => v == null ? '–' : Math.round(v * 100) + '%';
const med = a => { const b = a.filter(x => x != null).sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
const LV = [1, 5, 10, 15, 20], D = ['easy', 'even', 'tough'];
let md = '# Balance baseline (18.1): 17.3.0 vs 18.0.0\n\nSolo duels, each job at levels 1, 5, 10, 15, 20 in best shop gear it can wear (no +1, no rare), weapon and magic skills at cap. Monsters: Goblin and Hill Lizard at level -3 (easy), even, +2 (tough), 5 fights each per family. The player uses weapon skills, nukes above 30% MP and Cure below 45% HP; no potions, no companions. TTK = average seconds for won fights; Win = fights won; HP lost = share of max HP gone at the end (100% = KO).\n\n';
md += '## Summary by level (median over 22 jobs)\n\n| Lv | Diff | Win 17.3 | Win 18.0 | TTK 17.3 | TTK 18.0 | HP lost 17.3 | HP lost 18.0 |\n|---|---|---|---|---|---|---|---|\n';
for (const lv of LV) for (const d of D) {
  const o = O.filter(r => r.lv === lv).map(r => r.diffs[d]), n = N.filter(r => r.lv === lv).map(r => r.diffs[d]);
  md += `| ${lv} | ${d} | ${pct(med(o.map(x => x.win)))} | ${pct(med(n.map(x => x.win)))} | ${f1(med(o.map(x => x.ttk)))} | ${f1(med(n.map(x => x.ttk)))} | ${pct(med(o.map(x => x.hpLoss)))} | ${pct(med(n.map(x => x.hpLoss)))} |\n`;
}
md += '\n## Player stats (median over jobs)\n\n| Lv | Att 17.3 | Att 18.0 | Def 17.3 | Def 18.0 | Weapon DMG 17.3 | 18.0 | Delay 17.3 | 18.0 | HP 17.3 | 18.0 |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const lv of LV) {
  const o = O.filter(r => r.lv === lv).map(r => r.ps), n = N.filter(r => r.lv === lv).map(r => r.ps);
  const m = (a, k) => f1(med(a.map(x => x[k])));
  md += `| ${lv} | ${m(o, 'att')} | ${m(n, 'att')} | ${m(o, 'def')} | ${m(n, 'def')} | ${m(o, 'dmg')} | ${m(n, 'dmg')} | ${m(o, 'delay')} | ${m(n, 'delay')} | ${m(o, 'hp')} | ${m(n, 'hp')} |\n`;
}
md += '\n## Even fights per job (Win / TTK / HP lost)\n\n| Job | ' + LV.map(l => 'Lv ' + l + ' 17.3 | Lv ' + l + ' 18.0').join(' | ') + ' |\n|---|' + LV.map(() => '---|---').join('|') + '|\n';
const jobs = [...new Set(N.map(r => r.job))];
const cell = r => r ? `${pct(r.diffs.even.win)} / ${f1(r.diffs.even.ttk)}s / ${pct(r.diffs.even.hpLoss)}` : '–';
for (const j of jobs) md += `| ${j} | ` + LV.map(l => cell(om[j + ':' + l]) + ' | ' + cell(N.find(r => r.job === j && r.lv === l))).join(' | ') + ' |\n';
md += '\n## Flags (even fights, 18.0 vs 17.3)\n\n';
const flags = [];
for (const r of N) {
  const o = om[key(r)]; if (!o) continue;
  const a = o.diffs.even, b = r.diffs.even;
  if (b.win < a.win - 0.25) flags.push(`- ${r.job} ${r.lv}: win ${pct(a.win)} -> ${pct(b.win)} (weapon ${r.gear.main || '-'}${r.gear.ranged ? ' + ' + r.gear.ranged : ''}, dmg ${r.ps.dmg}/${r.ps.delay}s vs ${o.ps.dmg}/${o.ps.delay}s)`);
  else if (a.ttk && b.ttk && b.ttk > a.ttk * 1.4) flags.push(`- ${r.job} ${r.lv}: slower kills ${f1(a.ttk)}s -> ${f1(b.ttk)}s (dmg ${r.ps.dmg}/${r.ps.delay}s vs ${o.ps.dmg}/${o.ps.delay}s)`);
  else if (a.ttk && b.ttk && b.ttk < a.ttk / 1.4) flags.push(`- ${r.job} ${r.lv}: faster kills ${f1(a.ttk)}s -> ${f1(b.ttk)}s`);
  else if (b.win > a.win + 0.25) flags.push(`- ${r.job} ${r.lv}: win ${pct(a.win)} -> ${pct(b.win)}`);
}
md += (flags.join('\n') || '- none') + '\n';
md += '\n## Gear used in 18.0 (main / range, body)\n\n| Job | ' + LV.join(' | ') + ' |\n|---|' + LV.map(() => '---').join('|') + '|\n';
for (const j of jobs) md += `| ${j} | ` + LV.map(l => { const r = N.find(x => x.job === j && x.lv === l); return r ? (r.gear.main || '-') + (r.gear.ranged ? '+' + r.gear.ranged : '') + ', ' + (r.gear.body || '-') : '–'; }).join(' | ') + ' |\n';
fs.writeFileSync(outF, md);
console.log(md.split('\n## Even')[0]);
console.log('flags', flags.length);
