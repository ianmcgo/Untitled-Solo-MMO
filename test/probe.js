const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  await page.addInitScript(() => { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); });
  await page.goto('file:///home/claude/build/dist/index.html', { timeout: 240000 }); page.setDefaultTimeout(240000);
  await page.waitForTimeout(3000);
  const r = await page.evaluate(process.argv[2]);
  console.log(JSON.stringify(r, null, 1).slice(0, 3000));
  await browser.close();
})();
