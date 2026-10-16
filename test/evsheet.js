const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('/home/claude/untitled-solo-mmo/test/mocklogin');
(async () => {
  const [html, out, wpn, race, varWant, view] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const url = await page.evaluate(({ wpn, race, varWant, view, ENV }) => {
    const T = 220, cols = 6, N = 12;
    const sheet = document.createElement('canvas'); sheet.width = cols * T; sheet.height = Math.ceil(N / cols) * T; const g2 = sheet.getContext('2d');
    const studio = new THREE.Scene(); studio.background = new THREE.Color(0x8a96a8);
    studio.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 6, 4); studio.add(sun);
    studio.add(new THREE.GridHelper(40, 80, 0x333333, 0x556655));
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    const R = W3.renderer, rt = new THREE.WebGLRenderTarget(T, T, { samples: 4 }), buf = new Uint8Array(T * T * 4), img = g2.createImageData(T, T);
    const e0 = { kind: 'remote', remote: true, id: 'gsx', name: 'G', job: (ENV.JOB||'warrior'), lv: 10, look: Object.assign({}, save.look, { race: race || 'human', build: 0 }, ENV.LOOK ? JSON.parse(ENV.LOOK) : {}), gear: { main: wpn }, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0, recasts: {}, engaged: !ENV.IDLE, state: ENV.IDLE?'idle':'combat' };
    const e = ENV.WS.startsWith('work') ? player : e0; if (e === player) { e.x = 0; e.y = 0; e.face = 0; e.mounted = false; e.resting = false; e.engaged = false; e.alive = true; }
    window.groundY = () => 0; window.footGround = () => 0;
    const v = viewFor(e); W3.scene.remove(v.group); studio.add(v.group); const dt = 1 / 60;
    for (let i = 0; i < 30; i++) { S.time += dt; syncEntity(e, dt); }
    e.engaged = true; for (let i = 0; i < 120; i++) { S.time += dt; syncEntity(e, dt); } e.engaged = false; for (let i = 0; i < 300; i++) { S.time += dt; syncEntity(e, dt); }
    const A = ENV.WS;
    if (A === 'death') { e.alive = false; }
    else if (A === 'rise') { e.alive = false; for (let i = 0; i < 150; i++) { S.time += dt; syncEntity(e, dt); } e.alive = true; }
    else if (A.startsWith('emote:')) e.emote = { id: A.slice(6), at: S.time };
    else if (A === 'work:fish') S.fish = { state: ENV.MODE === 'bite' ? 'bite' : 'wait', at: S.time + 99, since: S.time };
    else if (A === 'work:craft') e.synth = { start: S.time, end: S.time + 5 };
    else if (A.startsWith('work:gather')) { e.gatherAt = S.time; e.gatherType = A.slice(12); }
    S.time += dt; syncEntity(e, dt);
    for (let k = 0; k < N; k++) {
      for (let j = 0; j < Math.round((+ENV.STEP||0.2)/dt); j++) { S.time += dt; syncEntity(e, dt); }
      v.group.updateMatrixWorld(true);
      v.group.traverse(o => { if (o.isSkinnedMesh) o.visible = true; }); v.group.updateMatrixWorld(true);
      const c = v.group.position.clone(); c.y += (+ENV.CY||1.1); const d = (+ENV.DIST||3.6);
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(v.group.quaternion), rt2 = new THREE.Vector3(1, 0, 0).applyQuaternion(v.group.quaternion);
      const dir = view === 'back' ? fwd.clone().multiplyScalar(-1).add(rt2.clone().multiplyScalar(0.5)).normalize() : view === 'backclose' ? fwd.clone().multiplyScalar(-1).add(rt2.clone().multiplyScalar(0.4)).normalize() : view === 'side' ? rt2.clone().multiplyScalar(-1) : view === 'top' ? new THREE.Vector3(0, 1, 0).add(fwd.clone().multiplyScalar(0.01)) : fwd.clone().add(rt2.clone().multiplyScalar(-0.6)).normalize();
      cam.position.copy(c).add(dir.multiplyScalar(d)); if (view === 'top') cam.up.copy(fwd); cam.lookAt(c);
      R.setRenderTarget(rt); R.render(studio, cam); R.readRenderTargetPixels(rt, 0, 0, T, T, buf); R.setRenderTarget(null);
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const si = ((T - 1 - y) * T + x) * 4, di = (y * T + x) * 4; img.data[di] = buf[si]; img.data[di + 1] = buf[si + 1]; img.data[di + 2] = buf[si + 2]; img.data[di + 3] = 255; }
      g2.putImageData(img, (k % cols) * T, Math.floor(k / cols) * T);
      g2.fillStyle = '#fff'; g2.font = '12px sans-serif'; g2.fillText(k + ' ' + (v.weapon.parent && v.weapon.parent.name), (k % cols) * T + 4, Math.floor(k / cols) * T + 14);
    }
    return sheet.toDataURL('image/png');
  }, { wpn, race, varWant, view, ENV: { WS: process.env.WS, MODE: process.env.MODE, STEP: process.env.STEP, LOOK: process.env.LOOK, JOB: process.env.JOB, IDLE: process.env.IDLE, CY: process.env.CY, DIST: process.env.DIST } });
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log('ok'); await browser.close();
})();
