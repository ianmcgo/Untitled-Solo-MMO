const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2]));
const med = a => { a = a.filter(x => x != null).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
const lvs = [...new Set(d.map(r => r.lv))].sort((a, b) => a - b);
const ds = Object.keys(d[0].diffs);
const f = v => v == null ? '  -  ' : (Math.round(v * 100) + '%').padStart(5);
for (const lv of lvs) {
  const rs = d.filter(r => r.lv === lv);
  console.log('Lv' + String(lv).padEnd(3) + ds.map(k => k + ' win' + f(med(rs.map(r => r.diffs[k].win))) + ' mean' + f(rs.reduce((s, r) => s + r.diffs[k].win, 0) / rs.length) + ' hp' + f(med(rs.map(r => r.diffs[k].hpLoss))) + ' ttk ' + String(Math.round(med(rs.map(r => r.diffs[k].ttk)) || 0)).padStart(3)).join(' | '));
}
