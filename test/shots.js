const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [file, out, vw, vh, quality] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +vw || 960, height: +vh || 640 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(q => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: q })); } catch (e) {} }, quality || 'medium');
  await page.goto('file://' + file, { timeout: 240000 });
  page.setDefaultTimeout(240000);
  await page.waitForTimeout(4000);
  const scenes = JSON.parse(process.argv[7] || '[]');
  for (const sc of scenes) {
    await page.evaluate('(()=>{' + sc.js + '})()');
    await page.waitForTimeout(sc.wait || 6000);
    await page.screenshot({ path: out + '-' + sc.name + '.png' });
    console.log('shot', sc.name);
  }
  console.log(errs.length ? 'CONSOLE:\n' + [...new Set(errs)].join('\n') : 'no console errors');
  await browser.close();
})();
