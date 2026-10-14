const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await mockLogin(page, html);
  console.log(await page.evaluate(() => {
    const out = [];
    for (const k of ['goblin', 'pond_crab', 'hare', 'orc_grunt']) {
      let t = performance.now(); const m = buildMob(k, 5, 0, 0, null); RIG.cache.clear(); const inst = buildEntityRig(m); const tb = performance.now() - t;
      t = performance.now(); renderThumb(k); out.push(k + ' build ' + tb.toFixed(0) + 'ms thumb ' + (performance.now() - t).toFixed(0) + 'ms');
    }
    return out.join('\n');
  }));
  await browser.close();
})();
