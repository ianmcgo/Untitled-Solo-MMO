const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
const fs = require('fs');
(async () => {
  const [html, out, scenesFile, w, h, q] = process.argv.slice(2);
  const scenes = JSON.parse(fs.readFileSync(scenesFile, 'utf8'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: +(w || 1280), height: +(h || 720) } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/WebSocket|ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await page.addInitScript(qq => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: qq || 'medium', tutorialDone: true })); } catch (e) {} }, q);
  await mockLogin(page, html);
  await page.evaluate(() => { document.querySelectorAll('.toast').forEach(x => x.remove()); const sk = document.querySelector('#tutBox .skip'); if (sk && document.getElementById('tutBox').classList.contains('on')) sk.click(); });
  for (const s of scenes) {
    if (s.js) { try { const r = await page.evaluate(s.js); if (r !== undefined && r !== null) console.log(s.name, '->', typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { errs.push(s.name + ' eval: ' + e.message.slice(0, 300)); } }
    if (s.wait !== undefined) await page.waitForTimeout(s.wait);
    if (s.wait === undefined) await page.waitForTimeout(1200);
    if (s.wf) { try { await page.waitForFunction(s.wf, null, { timeout: 120000 }); } catch (e) { errs.push(s.name + ' wait: ' + e.message.slice(0, 120)); } await page.waitForTimeout(800); }
    if (s.shot !== false) await page.screenshot({ path: out + '-' + s.name + '.png' });
  }
  console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 12).join('\n') : 'ok');
  await browser.close();
})();
