const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, zonesArg] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 600, height: 400 } })).newPage();
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await mockLogin(page, html);
  const zones = JSON.parse(zonesArg);
  for (const zid of zones) {
    await page.evaluate(id => { S.zoneCooldown = 0; enterZone(id); }, zid);
    await page.waitForFunction(id => !zoneLoadingOn() && W3.field && S.zoneId === id && W3.field.zone === S.zone, zid, { timeout: 150000 });
    const r = await page.evaluate(() => {
      const f = W3.field; let terrain = null; const rocks = [];
      W3.scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position.count === f.cols * f.rows) terrain = o; if (o.isInstancedMesh && o.count > 3) rocks.push(o); });
      if (!terrain) return { err: 'no terrain' };
      terrain.updateMatrixWorld(true);
      const rc = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
      const out = []; let n = 0, hf = 0;
      for (const im of rocks) {
        im.geometry.computeBoundingBox(); const minY = im.geometry.type === 'IcosahedronGeometry' ? im.geometry.boundingBox.min.y : 0;
        for (let i = 0; i < im.count; i++) {
          im.getMatrixAt(i, m); if (!m.elements[0] && !m.elements[5] && !m.elements[10]) continue; m.decompose(p, q, s);
          const bottom = p.y + minY * s.y;
          rc.set(new THREE.Vector3(p.x, p.y + 80, p.z), down);
          const hit = rc.intersectObject(terrain, false)[0];
          n++;
          if (!hit) { out.push({ x: Math.round(p.x / U), y: Math.round(p.z / U), gap: 99, why: 'nohit' }); continue; }
          const gap = bottom - hit.point.y; if (im.geometry.type !== 'IcosahedronGeometry' && gap < 1.2) continue;
          const hfy = f.heightAt(p.x / U, p.z / U);
          if (gap > 0.35) out.push({ x: Math.round(p.x / U), y: Math.round(p.z / U), gap: +gap.toFixed(2), mesh: +hit.point.y.toFixed(2), hf: +hfy.toFixed(2), sc: +s.x.toFixed(2), e: Math.round(f.outsideE(p.x / U, p.z / U)) });
        }
      }
      out.sort((a, b) => b.gap - a.gap);
      return { n, floating: out.length, nohit: out.filter(o => o.why).length, worst: out.slice(0, 5) };
    });
    console.log(zid, JSON.stringify(r));
  }
  await browser.close();
})();
