const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, specArg, speedsArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const out = await page.evaluate(({ specs, speeds, process_dump }) => {
    const res = [];
    for (const spec of specs) {
      const [type, id] = spec.split(':');
      for (const sp of speeds) {
        let e;
        if (type === 'mob') e = buildMob(id, 5, 0, 0, null);
        else { const [race, job, build] = id.split('/'); e = { kind: 'remote', remote: true, id: 'gp' + id + sp, name: 'G', job, lv: 10, look: Object.assign({}, save.look, { race, build: +build || 0 }), gear: {}, x: 0, y: 0, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0, recasts: {} }; }
        e.x = player.x; e.y = player.y; e.face = 0;
        const v = viewFor(e);
        const bones = v.mesh.skeleton.bones;
        const feet = ['footL', 'footR', 'legBL', 'legBR', 'shinBL', 'shinBR'].map(n => bones.find(b => b.name === n)).filter(Boolean).slice(0, 2);
        const dt = 1 / 30, w = new THREE.Vector3();
        let prev = null, planted = [], steps = 0, lastLow = -1, frames = [], minY = 9;
        for (let i = 0; i < 150; i++) {
          S.time += dt; e.px = e.x; e.x += sp * dt; e.moving = true;
          syncEntity(e, dt);
          v.group.updateMatrixWorld(true);
          const ps = feet.map(b => b.getWorldPosition(new THREE.Vector3()).clone());
          if (prev && i > 30) {
            const sps = ps.map((p, k) => Math.hypot(p.x - prev[k].x, p.z - prev[k].z) / dt);
            const an = v.an, run = Math.min(1, Math.max(0, (an.spd - 1.2) / 4)), bp = (0.62 - 0.28 * run) * Math.PI;
            const stq = k => { let q = an.ph + (k ? Math.PI : 0); q = Math.atan2(Math.sin(q), Math.cos(q)); return Math.abs(q) < bp * 0.8; };
            frames.push([ps[0].y, ps[1].y, sps[0], sps[1], stq(0), stq(1)]);
            minY = Math.min(minY, ps[0].y, ps[1].y);
            const low = ps[0].y < ps[1].y ? 0 : 1;
            if (low !== lastLow) { steps++; lastLow = low; }
          }
          prev = ps;
        }
        for (const f of frames) for (const k of [0, 1]) if (f[4 + k]) planted.push(f[2 + k]);
        planted.sort((a, b) => a - b);
        res.push({ dump: process_dump ? frames.slice(0, 40).map(f => f.map(x => +x.toFixed(3))) : undefined, spec, pxs: sp, ms: +(sp * 0.05).toFixed(2), plantedMedian: +planted[planted.length >> 1].toFixed(3), planted90: +planted[(planted.length * 0.9) | 0].toFixed(3), plantedFrac: +(planted.length / frames.length / 2).toFixed(2), stepsPerSec: +(steps / (119 * dt)).toFixed(2) });
        W3.scene.remove(v.group); destroyView(v); VIEW.views.delete(e);
      }
    }
    return res;
  }, { specs: JSON.parse(specArg), speeds: JSON.parse(speedsArg), process_dump: !!process.env.DUMP });
  for (const r of out) console.log(JSON.stringify(r));
  await browser.close();
})();
