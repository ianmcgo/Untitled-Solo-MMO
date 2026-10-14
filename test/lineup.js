const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out, setsArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const sets = JSON.parse(setsArg);
  for (const set of sets) {
    await page.evaluate(set => {
      if (S.modal) closeModal();
      const hh = vana(); let d = 11 - hh.hour; if (d < 0) d += 24; S.timeShift += d * 3600000 / 25;
      for (const m of S.mobs) { m.despawned = true; m.alive = false; }
      S.mobs = [];
      window.LINE = [];
      const n = set.mobs.length, sp = set.gap || 45;
      set.mobs.forEach((fk, i) => {
        const m = buildMob(fk, 3, player.x - (n - 1) * sp / 2 + i * sp, player.y - (set.far || 70), null);
        m.aggro = null; m.passive = true; m.face = Math.PI / 2 + (set.face || 0);
        S.mobs.push(m); LINE.push(m);
      });
      player.face = -Math.PI / 2; VIEW.first = true; document.querySelectorAll('#hud,#chat,#party,#target,#minimap,#bar,.toast').forEach(x => x.style.visibility = 'hidden');
      VIEW.yaw = -Math.PI / 2 + (set.yaw || 0); VIEW.pitch = set.pitch || 0.25; VIEW.dist = set.dist || 9;
      window.POSE = set.pose || "idle";
    }, set);
    for (let f = 0; f < 50; f++) {
      await page.evaluate(f => {
        for (const m of LINE) {
          if (POSE === "walk") { m.x += 0.0; m.moving = true; m.px = m.x - 3; }
          if (POSE === "swing" && f === 30) m.lastSwing = S.time;
          if (POSE === "swing") { m.state = "combat"; }
        }
      }, f);
      await page.waitForTimeout(40);
    }
    await page.waitForTimeout(set.wait || 600);
    await page.screenshot({ path: out + '-' + set.name + '.png' });
  }
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' || ') : 'no page errors');
  await browser.close();
})();
