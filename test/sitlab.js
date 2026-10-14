const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const races = await page.evaluate(() => Object.keys(RACES));
  const res = [];
  for (const race of races) {
    await page.evaluate(race => { save.look.race = race; VIEW.views.forEach((v, e) => { if (e === player) { destroyView(v); VIEW.views.delete(e); } }); buildStats(player); if (!window._mv) { window._mv = 1; player.x += 120; player.y -= 260; } player.engaged = false; setTarget(null); standUp(player, true); startRest(player); player.face = 0.6; VIEW.yaw = player.face + 1.9; VIEW.pitch = 0.12; VIEW.dist = 9; VIEW.pitch = 0.35; VIEW.lastManual = S.time + 999; chatToggle(false); document.getElementById('chat').classList.add('gone'); document.querySelectorAll('.toast,#upd,#updBar').forEach(x => x.remove()); }, race);
    await page.waitForTimeout(7000);
    const r = await page.evaluate(() => {
      const v = viewFor(player), mesh = v.mesh, tmp = new THREE.Vector3(), wp = new THREE.Vector3();
      v.group.updateMatrixWorld(true); mesh.skeleton.update();
      const n = mesh.geometry.attributes.position.count;
      let minAbove = 1e9, maxY = -1e9, minY = 1e9;
      for (let i = 0; i < n; i++) { mesh.getVertexPosition(i, tmp); wp.copy(tmp).applyMatrix4(mesh.matrixWorld); const a = wp.y - groundY(wp.x / U, wp.z / U); if (a < minAbove) { minAbove = a; const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight; let bi = si.getX(i), bw = sw.getX(i); for (const q of [1,2,3]) if (sw.getComponent(i,q) > bw) { bw = sw.getComponent(i,q); bi = si.getComponent(i,q); } window._lb = mesh.skeleton.bones[bi].name; } if (wp.y > maxY) maxY = wp.y; if (wp.y < minY) minY = wp.y; }
      const bw = new THREE.Vector3(); const dbg = {}; for (const n of ['hips','thighR','shinR','footR']) { const b = v.bones[n]; b.getWorldPosition(bw); dbg[n] = [+b.rotation.x.toFixed(2), +(bw.y - groundY(bw.x / U, bw.z / U)).toFixed(3)]; } return { dbg, root: +v.bones.root.position.y.toFixed(2), bone: window._lb, sit: v._sit && Object.fromEntries(Object.entries(v._sit).map(([k, x]) => [k, +x.toFixed(2)])), minAbove: +minAbove.toFixed(3), H: +(maxY - minY).toFixed(3) };
    });
    await page.screenshot({ path: out + '-' + race + '.png' });
    res.push(race + ' ' + JSON.stringify(r));
  }
  console.log(res.join('\n'));
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' || ') : 'ok');
  await browser.close();
})();
