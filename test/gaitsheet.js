const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out, spec, speed, view, n] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const url = await page.evaluate(({ spec, speed, view, N }) => {
    const T = 200, cols = 6, rows = Math.ceil(N / cols);
    const sheet = document.createElement('canvas'); sheet.width = cols * T; sheet.height = rows * T;
    const g2 = sheet.getContext('2d');
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0x8a96a8);
    studio.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 6, 4); studio.add(sun);
    const grid = new THREE.GridHelper(400, 800, 0x333333, 0x556655); studio.add(grid);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    const R = W3.renderer, rt = new THREE.WebGLRenderTarget(T, T, { samples: 4 }), buf = new Uint8Array(T * T * 4), img = g2.createImageData(T, T);
    const [type, id] = spec.split(':');
    let e;
    if (type === 'mob') e = buildMob(id, 5, 0, 0, null);
    else if (type === 'npc') e = Object.assign({}, NPCS[id] || {}, { kind: 'npc', id, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0 });
    else { const [race, job, build] = id.split('/'); e = { kind: 'remote', remote: true, id: 'gs' + id, name: 'G', job, lv: 10, look: Object.assign({}, save.look, { race, build: +build || 0 }), gear: {}, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0, recasts: {} }; }
    e.x = 0; e.y = 0; e.face = 0;
    window.groundY = () => 0; window.footGround = () => 0;
    const v = viewFor(e); W3.scene.remove(v.group); studio.add(v.group);
    const dt = 1 / 30;
    for (let i = 0; i < 40; i++) { S.time += dt; e.px = e.x; e.x += speed * dt; e.moving = true; syncEntity(e, dt); }
    for (let k = 0; k < N; k++) {
      S.time += dt; e.px = e.x; e.x += speed * dt; e.moving = true; syncEntity(e, dt);
      v.group.updateMatrixWorld(true);
      const c = v.group.position.clone(); c.y += 0.8 * v.scale;
      const d = 5.2 * v.scale;
      if (view === 'side') cam.position.set(c.x, c.y + 0.3, c.z + d); else cam.position.set(c.x + d * 0.6, c.y + 0.6, c.z + d * 0.75);
      cam.lookAt(c); cam.updateProjectionMatrix();
      R.setRenderTarget(rt); R.render(studio, cam); R.readRenderTargetPixels(rt, 0, 0, T, T, buf); R.setRenderTarget(null);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const si = ((T - 1 - y) * T + x) * 4, di = (y * T + x) * 4; img.data[di] = buf[si]; img.data[di + 1] = buf[si + 1]; img.data[di + 2] = buf[si + 2]; img.data[di + 3] = 255; }
      g2.putImageData(img, (k % cols) * T, Math.floor(k / cols) * T);
      g2.fillStyle = '#fff'; g2.font = '11px sans-serif'; g2.fillText(String(k), (k % cols) * T + 4, Math.floor(k / cols) * T + 12);
    }
    return sheet.toDataURL('image/png');
  }, { spec, speed: +speed, view: view || 'side', N: +(n || 18) });
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('ok ' + out);
  await browser.close();
})();
