const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await mockLogin(page, html);
  console.log('title', await page.title(), 'icon', await page.evaluate(() => !!document.querySelector('link[rel=icon]')));
  await page.evaluate(() => { for (const k of Object.keys(BESTIARY).slice(0, 8)) { save.bestiary[k] = { kills: 3 }; THUMBS.cache.set(k, renderThumb(k)); } openMenu('bestiary'); });
  await page.waitForTimeout(3000);
  console.log('thumbs', await page.evaluate(() => THUMBS.cache.size + ' queue ' + THUMBS.queue.length + ' err ' + THUMBS.err));
  await page.screenshot({ path: out });
  console.log(errs.length ? 'ERRORS ' + errs.join(' || ') : 'ok');
  await browser.close();
})();
