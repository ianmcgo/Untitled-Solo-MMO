const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, specArg, speedsArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const out = await page.evaluate(({ specs, speeds }) => {
    const res = [];
    window.groundY = () => 0; window.footGround = () => 0;
    for (const spec of specs) for (const sp of speeds) {
      const e = buildMob(spec, 5, 0, 0, null); e.x = 0; e.y = 0; e.face = 0;
      const v = viewFor(e), B = v.bones, q = v.meta.quad || {}, sc = v.scale || 1;
      const legs = ['FL', 'FR', 'BL', 'BR'].map(n => B['shin' + n]).filter(Boolean);
      if (legs.length < 4) { res.push({ spec, err: 'no quad shins' }); continue; }
      const mesh = v.mesh, pos = mesh.geometry.attributes.position, si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, bones = mesh.skeleton.bones;
      const tipLocal = legs.map(b => { const bi = bones.indexOf(b); let best = null, by = 9; for (let i = 0; i < pos.count; i++) { let w = 0; for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === bi) w += sw.getComponent(i, k); if (w < 0.6) continue; const y = pos.getY(i); if (y < by) { by = y; best = i; } } const p = new THREE.Vector3().fromBufferAttribute(pos, best); return b.worldToLocal(mesh.localToWorld(p.clone())); });
      const dt = 1 / 120, frames = [];
      let minY = 9, minAll = 9;
      for (let i = 0; i < 720; i++) {
        S.time += dt; e.px = e.x; e.x += sp * dt; e.moving = sp > 0; syncEntity(e, dt);
        v.group.updateMatrixWorld(true);
        const ps = legs.map((b, k) => b.localToWorld(tipLocal[k].clone()));
        if (i > 240) frames.push(ps);
        if (i > 240) for (const p of ps) minY = Math.min(minY, p.y);
      }
      const slides = [];
      for (let i = 1; i < frames.length; i++) for (let k = 0; k < 4; k++) {
        const a = frames[i - 1][k], b = frames[i][k], yk = Math.min(a.y, b.y);
        if (yk < minY + 0.03 * sc) slides.push(Math.hypot(b.x - a.x, b.z - a.z) / dt);
      }
      slides.sort((a, b) => a - b);
      const tmp = new THREE.Vector3();
      let vMin = 9;
      for (let i = 0; i < pos.count; i += 3) { tmp.fromBufferAttribute(pos, i); mesh.applyBoneTransform(i, tmp); mesh.localToWorld(tmp); vMin = Math.min(vMin, tmp.y); }
      res.push({ spec, ms: +(sp * 0.05).toFixed(2), gait: v.an.gait && v.an.gait.name, slideMed: slides.length ? +slides[slides.length >> 1].toFixed(3) : null, slide90: slides.length ? +slides[(slides.length * 0.9) | 0].toFixed(3) : null, stanceFrac: +(slides.length / (frames.length * 4)).toFixed(2), tipMinY: +minY.toFixed(3), meshMinY: +vMin.toFixed(3), legL: +((q.leg || 0) * sc).toFixed(3) });
      W3.scene.remove(v.group); destroyView(v); VIEW.views.delete(e);
    }
    return res;
  }, { specs: JSON.parse(specArg), speeds: JSON.parse(speedsArg) });
  for (const r of out) console.log(JSON.stringify(r));
  await browser.close();
})();
