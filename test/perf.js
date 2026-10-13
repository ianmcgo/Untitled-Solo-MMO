const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
  await page.addInitScript(() => localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })));
  await page.goto('file:///home/claude/build/dist/index.html', { timeout: 120000 });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => {
    const T = {};
    const time = (n, f) => { const a = performance.now(); f(); T[n] = (T[n] || 0) + performance.now() - a; };
    let t0 = performance.now(); RIG.atlas = null; buildAtlas(); T.atlas = performance.now() - t0;
    save.gil = 2000; ['kael','mira','sable','rook','fen'].forEach(hireMerc);
    enterZone('hollow', 300, 520);
    t0 = performance.now(); for (let i = 0; i < 10; i++) step(1/60); T.step10 = performance.now() - t0;
    const dt = 1/60; for (let i = 0; i < 3; i++) { for (const p of S.party) syncEntity(p, dt); for (const m of S.mobs) syncEntity(m, dt); for (const n of S.npcs) syncNpc(n, dt); }
    for (let i = 0; i < 10; i++) {
      time('cam', () => updateCamera(dt));
      time('sky', () => updateSky(false));
      time('ents', () => { for (const p of S.party) syncEntity(p, dt); for (const m of S.mobs) syncEntity(m, dt); for (const n of S.npcs) syncNpc(n, dt); });
      time('fx', () => updateFX(dt));
      time('labels', () => { updateLabels(); updateFloaters(); });
      time('hud', () => updateHud());
      time('render', () => W3.renderer.render(W3.scene, W3.camera));
    }
    for (const k in T) if (!['atlas','step10'].includes(k)) T[k] = +(T[k] / 10).toFixed(2);
    T.atlas = +T.atlas.toFixed(0); T.step10 = +T.step10.toFixed(1);
    T.views = VIEW.views.size; T.calls = W3.renderer.info.render.calls; T.tris = W3.renderer.info.render.triangles; T.geoCache = RIG.cache.size; T.modelTris = [...RIG.cache.entries()].map(([k,e]) => k.slice(0,12) + ':' + Math.round(e.geo.attributes.position.count/3)).join(' ');
    return T;
  });
  console.log(JSON.stringify(r));
  await browser.close();
})();
