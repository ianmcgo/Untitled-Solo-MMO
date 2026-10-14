const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out, listArg, posesArg, colsArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 1000, height: 700 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(q => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: q })); } catch (e) {} }, process.env.QUALITY || 'low');
  await mockLogin(page, html); await page.evaluate(l => { window.SHOT_L = l; }, process.env.SHOT_L || '1');
  const list = JSON.parse(listArg), poses = (posesArg || 'idle,walk,swing').split(','), cols = +(colsArg || 6);
  const url = await page.evaluate(async ({ DY, RR, list, poses, cols, TS }) => {
    const T = TS;
    const sheet = document.createElement('canvas');
    const rows = Math.ceil(list.length * poses.length / cols);
    sheet.width = cols * T; sheet.height = rows * T;
    const g2 = sheet.getContext('2d');
    g2.fillStyle = '#20242c'; g2.fillRect(0, 0, sheet.width, sheet.height);
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x8a96a8); studio.environment = W3.scene.environment || null;
    studio.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.6 * (+(window.SHOT_L || 1))));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2 * (+(window.SHOT_L || 1))); sun.position.set(3, 6, 4); studio.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x6a7a5a }));
    floor.rotation.x = -Math.PI / 2; studio.add(floor);
    const grid = new THREE.GridHelper(40, 160, 0x4a5a3a, 0x5a6a4a); grid.position.y = 0.002; studio.add(grid);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 100);
    const R = W3.renderer;
    const rt = new THREE.WebGLRenderTarget(T, T, { samples: 4 });
    const buf = new Uint8Array(T * T * 4);
    const img = g2.createImageData(T, T);
    const mk = spec => {
      const [type, id] = spec.split(':');
      if (type === 'mob') { const m = buildMob(id, 5, 0, 0, null); return m; }
      if (type === 'npc') { const n = Object.assign({}, NPCS[id] || {}, { kind: 'npc', id, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0 }); return n; }
      if (type === 'race') { const [race, job, build, hs, fc] = id.split('/'); const lk = Object.assign({}, save.look, { race, build: +build || 0 }); if (hs) lk.hairStyle = HAIR_STYLES.indexOf(hs); if (fc) lk.face = +fc; const gear = {}; if (id.split('/')[5]) gear.head = id.split('/')[5]; const e = { kind: 'remote', remote: true, id: 'lab' + id, name: 'Lab', job, lv: 10, look: lk, gear, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0, recasts: {} }; return e; }
      if (type === 'amb') return { kind: 'ambient', ambient: true, type: id, seed: 3, x: 0, y: 0, face: 0, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9 };
    };
    let k = 0;
    for (const spec of list) {
      const e = mk(spec);
      if (!e) continue;
      e.x = player.x; e.y = player.y; e.face = 0.6;
      const v = viewFor(e);
      if (!v) continue;
      W3.scene.remove(v.group); studio.add(v.group);
      for (const pose of poses) {
        e.moving = false; e.engaged = false; e.state = 'idle'; e.casting = null;
        const step = (n, f) => { for (let i = 0; i < n; i++) { S.time += 0.033; if (f) f(i); syncEntity(e, 0.033); } };
        step(25);
        if (pose === 'walk') step(22, () => { e.px = e.x; e.x += 4; e.moving = true; });
        if (pose === 'run') step(17, () => { e.px = e.x; e.x += 9; e.moving = true; });
        if (pose === 'swing') { e.engaged = true; e.state = 'combat'; step(10); e.lastSwing = S.time; step(5); }
        if (pose === 'ws') { e.engaged = true; e.state = 'combat'; step(10); e.lastWS = S.time; step(9); }
        if (pose === 'hit') { e.lastHit = S.time; step(3); }
        if (pose === 'talk' || pose === 'talk2') { e.talkUntil = S.time + 9; step(pose === 'talk' ? 7 : 9); }
        if (pose === 'cast') { e.casting = { id: 'fire', sp: SPELLS.fire || SPELLS.cure, start: S.time, end: S.time + 3 }; step(15); }
        v.group.position.set(0, 0, 0);
        v.group.rotation.y = 0;
        v.group.updateMatrixWorld(true);
        const hb = v.mesh.skeleton.bones.find(b => b.name === 'head');
        const box = new THREE.Box3().setFromObject(v.mesh, true);
        const sz = box.getSize(new THREE.Vector3());
        const c = hb ? hb.getWorldPosition(new THREE.Vector3()) : box.getCenter(new THREE.Vector3());
        const fq = new THREE.Quaternion(); if (hb) hb.getWorldQuaternion(fq);
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(fq); fwd.y = 0; fwd.normalize();
        const side = new THREE.Vector3(fwd.z, 0, -fwd.x);
        const hs = Math.max(0.14, sz.y * 0.11);
        c.y += hs * DY;
        const r = hs * RR;
        const d = r / Math.tan(15 * Math.PI / 180);
        const ang = { front: [1, 0], q: [0.8, 0.6], side: [0.05, 1], back: [-1, 0.1], talk: [1, 0], talk2: [0.8, 0.6] }[pose] || [0.8, 0.6];
        cam.position.copy(c).addScaledVector(fwd, d * ang[0]).addScaledVector(side, d * ang[1]); cam.position.y += d * 0.08;
        cam.lookAt(c);
        cam.updateProjectionMatrix();
        R.toneMappingExposure = 0.85 * (+(window.SHOT_L || 1)); R.setRenderTarget(rt); R.render(studio, cam); R.readRenderTargetPixels(rt, 0, 0, T, T, buf); R.setRenderTarget(null);
        for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const si = ((T - 1 - y) * T + x) * 4, di = (y * T + x) * 4; img.data[di] = buf[si]; img.data[di + 1] = buf[si + 1]; img.data[di + 2] = buf[si + 2]; img.data[di + 3] = 255; }
        const px = (k % cols) * T, py = Math.floor(k / cols) * T;
        g2.putImageData(img, px, py);
        g2.fillStyle = 'rgba(0,0,0,.55)'; g2.fillRect(px, py, T, 16); g2.fillStyle = '#fff'; g2.font = '11px sans-serif'; g2.fillText(spec.split(':')[1] + ' · ' + pose, px + 4, py + 12);
        k++;
      }
      studio.remove(v.group); destroyView(v); VIEW.views.delete(e);
    }
    return sheet.toDataURL('image/png');
  }, { DY: +(process.env.SHOT_DY || 0.75), RR: +(process.env.SHOT_R || 1.6), list, poses, cols, TS: +(process.env.SHOT_T || 220) });
  require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' || ') : 'ok ' + out);
  await browser.close();
})();
