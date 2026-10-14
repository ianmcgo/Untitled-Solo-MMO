const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out, w, h] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: +(w || 1280), height: +(h || 720) } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  await page.evaluate(() => { hireMerc && (save.gil = 5000, hireMerc('kael')); mainCmdOpen(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-menu.png' });
  await page.evaluate(() => { mainCmdClose(); const n = S.npcs.find(n => n.prop === 'tablet' || n.prop === 'board') || S.npcs[0]; setTarget(n); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out + '-target.png' });
  console.log(errs.length ? errs.join('\n') : 'ok');
  await browser.close();
})();
