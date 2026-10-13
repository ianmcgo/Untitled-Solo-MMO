const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } });
  page.setDefaultTimeout(600000);
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await page.addInitScript(() => localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })));
  await page.goto('file:///home/claude/build/dist/index.html', { timeout: 240000 });
  await page.waitForSelector('#loading.ready', { timeout: 240000 }); await page.click('#ldStart'); await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const out = { errors: [], kills: 0 };
    const origVfx = VFX; const seen = {};
    for (const k in origVfx) { const f = origVfx[k]; origVfx[k] = d => { seen[k] = (seen[k] || 0) + 1; return f(d); }; }
    save.jobs.WAR.lv = 6; save.supportUnlocked = true; save.subJob = 'BLM'; refreshPlayer(true);
    save.gil = 5000; ['kael', 'mira', 'sable', 'rook', 'fen'].forEach(hireMerc);
    save.mountLicense = true;
    enterZone('hollow', 300, 500);
    const dt = 1 / 30;
    for (let i = 0; i < 9000; i++) {
      try {
        step(dt); age(dt);
        if (i % 20 === 0) { draw(dt); updateHud(dt); updateAudio(); } if (i % 1500 === 700) openMenu(["character","inventory","map","actions","quests","skills"][(i/1500|0)%6]); if (i % 1500 === 760) closeModal();
        if (S.ko) { returnHome(); enterZone('hollow', 300, 500); }
        if (i % 6 === 0 && !player.engaged && !player.casting) {
          const inC = S.mobs.some(m => m.alive && m.state === 'combat' && m.enmity.size);
          if (i % 3000 === 0) { toggleMount(); }
          else if (player.mounted && i % 3000 === 900) toggleMount();
          else if (!player.mounted) {
            let best = null, bd = 1e9; for (const m of S.mobs) { if (!m.alive || m.famKey === 'chieftain') continue; const d = dist(m, player); if (d < bd) { bd = d; best = m; } }
            const t = inC ? S.mobs.find(m => m.alive && m.state === 'combat' && m.enmity.size) : best;
            if (t) { player.target = t; toggleEngage(true); }
          }
        }
        if (player.engaged && player.tp >= 1000 && i % 6 === 0) { const ws = actionList(player).filter(a => a.kind === 'ws').pop(); if (ws) playerAct(ws); }
        if (player.engaged && !player.casting && i % 90 === 0) { const sp = actionList(player).find(a => a.kind === 'ma' && SPELLS[a.id].kind === 'nuke'); if (sp) playerAct(sp); }
      } catch (e) { out.errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]); if (out.errors.length > 5) break; }
    }
    out.seen = seen;
    out.items = FX.items.length; out.particles = FX.add.n + FX.smoke.n; out.views = VIEW.views.size;
    out.mem = W3.renderer.info.memory;
    return out;
  });
  console.log(JSON.stringify(r));
  console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no console errors');
  await browser.close();
})();
