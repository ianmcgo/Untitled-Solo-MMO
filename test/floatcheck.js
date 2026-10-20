const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, zonesArg, limitArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const zones = zonesArg ? JSON.parse(zonesArg) : await page.evaluate(() => Object.keys(ZONES).filter(k => !ZONES[k].indoor && !ZONES[k].battlefield && ZONES[k].theme !== 'house' && (ZONES[k].theme === 'town' || ZONES[k].theme === 'field')));
  const limit = +(limitArg || 12);
  if (process.env.LIST) { console.log(zones.join(' ')); await browser.close(); return; }
  let total = { float: 0, sunk: 0, n: 0 };
  for (const zid of zones) {
    await page.evaluate(id => { S.zoneCooldown = 0; enterZone(id); }, zid);
    await page.waitForFunction(id => !zoneLoadingOn() && W3.field && S.zoneId === id && W3.field.zone === S.zone, zid);
    const r = await page.evaluate(() => {
      const z = S.zone, f = W3.field, H = (x, y) => f.heightAt(x, y), out = [];
      const ring = (x, y, r) => { const pts = []; for (let k = 0; k < 8; k++) pts.push([x + Math.cos(k * Math.PI / 4) * r, y + Math.sin(k * Math.PI / 4) * r]); return pts; };
      const rect = (x, y, w, h) => [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x - w / 2, y + h / 2], [x + w / 2, y + h / 2], [x, y - h / 2], [x, y + h / 2], [x - w / 2, y], [x + w / 2, y]];
      const check = (name, x, y, pts, below, above, seated) => {
        const c0 = H(x, y), hs = pts.map(p => H(p[0], p[1])), lo = Math.min(...hs), hi = Math.max(...hs), c = seated ? Math.min(c0, lo) : c0;
        const fl = c - below - lo, sk = hi - c - above;
        if (fl > 0.05) out.push({ name, x: Math.round(x), y: Math.round(y), kind: 'float', m: +fl.toFixed(2) });
        if (sk > 0) out.push({ name, x: Math.round(x), y: Math.round(y), kind: 'sunk', m: +sk.toFixed(2) });
      };
      let n = 0;
      for (const h of z.houses || []) { n++; check((h.sign || h.type || 'house'), h.x, h.y, rect(h.x, h.y, h.w + 6, h.h + 6), 0.6, 0.3); }
      const DR = { tree: 5, well: 22, cart: 20, planter: 14, hay: 12, statue: 16, shrine: 18, tower: 30, forge: 26, laundry: 22, netrack: 22, minecart: 30, boatramp: 40, woodpile: 14, belltower: 26, spire: 24, chimney: 16, crane: 20, beacon: 14, loading: 20, banner: 3, barrelstack: 8, ropecoil: 7, goodsrack: 12, armorstand: 6 };
      for (const o of z.dressing || []) { n++; check('dressing:' + o.t, o.x, o.y, ring(o.x, o.y, (DR[o.t] || 16) * (o.s || 1)), 0.02, 0.35, true); }
      for (const p of z.props || []) { n++; check('prop:' + p.type, p.x, p.y, ring(p.x, p.y, (p.r || 20) * 0.8), 0.02, 0.35, true); }
      for (const s of z.stalls || []) { n++; check('stall', s.x, s.y, rect(s.x, s.y, 52, 28), 0.02, 0.35, true); }
      for (const [x, y] of z.lamps || []) { n++; check('lamp', x, y, ring(x, y, 6), 0.02, 0.15); }
      for (const [x, y] of z.benches || []) { n++; check('bench', x, y, ring(x, y, 16), 0.02, 0.15); }
      for (const [x, y] of z.dummies || []) { n++; check('dummy', x, y, ring(x, y, 8), 0.02, 0.15); }
      for (const [x, y] of z.racks || []) { n++; check('rack', x, y, ring(x, y, 18), 0.02, 0.15); }
      for (const q of z.fountains || []) { n++; check('fountain', q.x, q.y, ring(q.x, q.y, 48), 0.02, 0.15); }
      for (const g of z.gardens || []) { n++; check('garden', g.x, g.y, rect(g.x, g.y, g.w, g.h), 0.02, 0.15); }
      for (const nn of z.npcs || []) { const d = NPCS[nn.id]; if (!d || !d.prop) continue; n++; check('npc:' + nn.id, nn.x, nn.y, ring(nn.x, nn.y, 14), 0.02, 0.35, true); }
      out.sort((a, b) => b.m - a.m);
      return { n, out };
    });
    const fl = r.out.filter(o => o.kind === 'float').length, sk = r.out.length - fl;
    total.float += fl; total.sunk += sk; total.n += r.n;
    console.log(zid + ': ' + r.n + ' objects, ' + fl + ' floating, ' + sk + ' sunk');
    for (const o of r.out.slice(0, limit)) console.log('  ' + o.kind + ' ' + o.m + 'm ' + o.name + ' @' + o.x + ',' + o.y);
  }
  console.log('TOTAL ' + total.n + ' objects, ' + total.float + ' floating, ' + total.sunk + ' sunk');
  await browser.close();
  process.exit(total.float + total.sunk ? 1 : 0);
})();
