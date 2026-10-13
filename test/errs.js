const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  const errs = [];
  page.on('console', m => errs.push(m.type() + ': ' + m.text().slice(0, 300)));
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  await page.addInitScript(() => localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })));
  const t0 = Date.now();
  await page.goto('file:///home/claude/build/dist/index.html', { timeout: 120000 });
  console.log('loaded in', Date.now() - t0, 'ms');
  await page.waitForTimeout(6000);
  const st = await page.evaluate(() => ({ t: S.time, views: VIEW.views.size, fx: FX.ready, atlas: !!RIG.atlas }));
  console.log(JSON.stringify(st));
  console.log([...new Set(errs)].slice(0, 15).join('\n'));
  await browser.close();
})();
