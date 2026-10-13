const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const file = process.argv[2], out = process.argv[3] || 'shot', script = process.argv[4] || '';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  for (const [name, vp] of [['phone', { width: 390, height: 844 }], ['desktop', { width: 1280, height: 800 }]]) {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1 });
    page.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    page.on('pageerror', e => errs.push(name + ' pageerror: ' + e.message));
    await page.goto('file://' + file);
    await page.waitForTimeout(2500);
    if (script) { await page.evaluate(script); await page.waitForTimeout(2500); }
    await page.screenshot({ path: out + '-' + name + '.png' });
    const fps = await page.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / ((performance.now() - t0) / 1000)); } requestAnimationFrame(f); }));
    console.log(name, 'fps~', fps.toFixed(1));
    await page.close();
  }
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
  await browser.close();
})();
