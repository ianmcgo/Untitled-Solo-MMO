const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(() => localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })));
  await page.goto('file:///home/claude/build/dist/index.html');
  await page.waitForSelector('#loading.ready', { timeout: 240000 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ started: UI.started, js: VIEW.jumpStart != null, h: (VIEW.jumpStart = S.time - 0.3, jumpHeight(player)).toFixed(2) }));
  console.log(JSON.stringify(r), errs.join('|') || 'no errors');
  await browser.close();
})();
