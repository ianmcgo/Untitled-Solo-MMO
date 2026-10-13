const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [html, out, vw, vh, mobile, only] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  page.setDefaultTimeout(240000);
  await page.goto('file://' + html, { timeout: 240000 });
  await page.waitForSelector('#loading.ready', { timeout: 240000 });
  await page.screenshot({ path: out + '-roster-empty.png' });
  await page.click('[data-new]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out + '-create.png' });
  await page.click('[data-job="BLM"]'); await page.click('[data-look="hairStyle"][data-d="1"]'); await page.click('[data-look="skin"][data-d="1"]');
  await page.fill('#ccName', 'Tessa');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-create2.png' });
  await page.click('[data-create]');
  await page.waitForFunction(() => UI.started, null, { timeout: 200000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-first-login.png' });
  const roster = await page.evaluate(() => ({ chars: loadRoster().chars.map(c => c.name + ':' + c.job), name: save.name, job: save.mainJob, look: save.look, gear: save.gear.main }));
  console.log('roster', JSON.stringify(roster));
  await page.evaluate(() => { const id = createChar({ name: 'Bram', job: 'WAR', look: { build: 1, skin: 3, hairStyle: 1, hairColor: 4 } }); const r = loadRoster(); r.current = S.charId; saveRoster(r); });
  await page.evaluate(`window.setH = h => { const v = vana(); let d = h - v.hour - v.minute / 60; if (d < 0) d += 24; S.timeShift += d * 3600000 / 25; };`);
  const scenes = [
    { name: 'jump', js: `setH(10); VIEW.yaw = player.face + 2.4; tryJump(); VIEW.jumpStart = S.time - 0.08; for (let i = 0; i < 6; i++) { S.time += 0.016; draw(0.016); }`, wait: 100 },
    { name: 'jump2', js: `VIEW.jumpStart = S.time - 0.38; for (let i = 0; i < 8; i++) { S.time += 0.016; draw(0.016); }`, wait: 100 },
    { name: 'jump3', js: `VIEW.jumpStart = S.time - 0.62; for (let i = 0; i < 8; i++) { S.time += 0.016; draw(0.016); }`, wait: 100 },
    { name: 'jump4', js: `VIEW.jumpStart = S.time - 0.8; for (let i = 0; i < 6; i++) { S.time += 0.016; draw(0.016); }`, wait: 100 },
    { name: 'advjobs', js: `setH(10); save.jobsUnlocked.PLD = save.jobsUnlocked.RDM = true; save.gil = 9000; setJob('PLD', null); giveItem('kite_shield',1,true); equip('kite_shield'); giveItem('scale_mail',1,true); equip('scale_mail'); hireMerc('dorn'); hireMerc('lisette'); save.jobs.PLD.lv = 7; refreshPlayer(true); S.party.forEach(p => { if (p !== player) { p.lv = 7; } }); syncAllies(true); player.x = 700; player.y = 470; VIEW.yaw = player.face + Math.PI; VIEW.dist = 6;`, wait: 3500 },
    { name: 'advjobs-fight', pre: `enterZone('hollow', 700, 1250);`, js: `S.mobs.forEach(m=>{ if (dist(m,player)>400) m.despawned = true; }); const m = buildMob('goblin', 6, player.x + 60, player.y, 0); S.mobs.push(m); player.target = m; toggleEngage(false); for (let i = 0; i < 60 * 9; i++) { S.time += 1/60; step(1/60); } VIEW.yaw = player.face - 0.6;`, wait: 2500 },
    { name: 'town-tab', js: `setH(10); save.gil = 3000; hireMerc('mira'); hireMerc('kael'); player.x = 700; player.y = 470; cycleTarget();`, wait: 2500 },
    { name: 'rest', js: `player.hp = 30; runCommand('/rest'); VIEW.yaw = player.face + Math.PI;`, wait: 4000 },
    { name: 'popup', js: `runCommand('/stand'); showVersionPopup({ version: '9.9.9', title: 'Test release' }); $('chatIn').value = '/rest'; $('chatIn').focus();`, wait: 1500 },
    { name: 'ruins', pre: `$('verPop').style.display='none'; $('chatIn').blur();`, js: `setH(11); enterZone('hollow', 2515, 900);`, wait: 250 },
    { name: 'ruins2', pre: `1`, js: `player.face = -Math.PI/2; VIEW.yaw = -Math.PI/2; S.mobs.forEach(m=>m.state='idle');`, wait: 5000 },
    { name: 'outcrop', js: `player.x = 1100; player.y = 1600; player.face = Math.PI; VIEW.yaw = Math.PI;`, wait: 4000 },
    { name: 'chain', js: `player.x = 2600; player.y = 1200; save.jobs.WAR.lv = 4; refreshPlayer(true); for (let k=0;k<3;k++){ const m = buildMob('goblin', 4, 2650, 1300, 0); S.mobs.push(m); m.enmity.set(player, 5); onKO(m, player); } const g = buildMob('grimtooth', 6, 2680, 1260, 31); S.mobs.push(g); player.target = g; player.face = 0.8; VIEW.yaw = 0.8;`, wait: 3500 },
    { name: 'den-mouth', pre: `setH(12); enterZone('den', 120, 800);`, js: `player.face = 0; VIEW.yaw = 0; S.mobs.forEach(m=>m.state='idle');`, wait: 5000 },
    { name: 'den-throne', js: `player.x = 1700; player.y = 800; player.face = 0; VIEW.yaw = 0; S.mobs.forEach(m=>m.state='idle');`, wait: 4000 },
    { name: 'den-ray', js: `VIEW.pitch = 0.34; VIEW.dist = 8; VIEW.yaw = 0; player.x = 1700; player.y = 800;`, wait: 3000 },
    { name: 'den-top', js: `player.x = 1700; player.y = 800; VIEW.pitch = 1.1; VIEW.dist = 16; VIEW.yaw = 0;`, wait: 3000 },
    { name: 'loadshow', pre: `enterZone('hollow', 120, 1100);`, js: ``, wait: 1, shotLoading: true },
    { name: 'home-door', pre: `setH(21); enterZone('outpost', 262, 440);`, js: `player.face = -Math.PI/2; VIEW.yaw = -Math.PI/2; VIEW.dist = 9;`, wait: 4000 },
    { name: 'home-night', js: `setH(23.5); for (let i = 0; i < 60 * 6; i++) { S.time += 1/60; step(1/60); } player.x = 610; player.y = 440; VIEW.yaw = -Math.PI/2;`, wait: 3500 },
    { name: 'home-in', pre: `setH(12); enterZone('residence', 200, 250);`, js: `save.gil = 9000; ['wooden_chair','wooden_table','simple_bed','storage_chest','floor_lamp','round_rug','bookshelf','hearth','potted_plant'].forEach(id => giveItem(id, 1, true)); placeFurniture('round_rug', 4, 3, 0); placeFurniture('wooden_table', 4, 3, 0); placeFurniture('wooden_chair', 3, 4, 1); placeFurniture('simple_bed', 7, 0, 0); placeFurniture('storage_chest', 2, 0, 0); placeFurniture('floor_lamp', 9, 4, 0); placeFurniture('bookshelf', 4, 0, 0); placeFurniture('hearth', 0, 3, 0); placeFurniture('potted_plant', 9, 0, 0); player.x = 200; player.y = 270; player.face = -Math.PI/2; VIEW.yaw = -Math.PI/2; VIEW.dist = 9; VIEW.pitch = 0.5;`, wait: 4000 },
    { name: 'home-pip', js: `player.x = 110; player.y = 120; VIEW.yaw = Math.PI * 1.25; VIEW.dist = 5; player.target = S.npcs.find(n => n.id === 'pip');`, wait: 2500 },
    { name: 'home-arrange', js: `openMenu('home'); UI.pick = 'wooden_chair'; renderModal();`, wait: 1500 },
    { name: 'home-storage', js: `openMenu('storage');`, wait: 1500 },
    { name: 'credits', js: `openMenu('credits');`, wait: 1500 },
    { name: 'settings', js: `openMenu('settings');`, wait: 1500 },
    { name: 'crypt-hall', pre: `setH(12); save.jobs[save.mainJob].lv = 10; refreshPlayer(true); enterZone('crypt', 620, 700);`, js: `S.mobs.forEach(m=>m.state='idle'); player.face = 0; VIEW.yaw = 0; VIEW.dist = 10;`, wait: 5000 },
    { name: 'crypt-lit', js: `for (const el of brazierOrder()) { const n = S.npcs.find(x => x.id === 'brazier_' + el); TALK.talkBrazier(n); S.dialog.all[0].fn(); } player.x = 1000; player.y = 700; VIEW.yaw = 0;`, wait: 3000 },
    { name: 'crypt-throne', js: `save.keyItems.push('crypt_key'); player.x = 1900; player.y = 700; VIEW.yaw = 0; VIEW.dist = 12; S.mobs.forEach(m=>m.state='idle');`, wait: 4000 },
    { name: 'crypt-king', js: `const k = S.mobs.find(m => m.famKey === 'hollow_king'); player.x = k.x - 140; player.y = k.y + 20; player.target = k; k.hp = Math.floor(k.maxHp * 0.5); k.state = 'combat'; k.enmity.set(player, 100); k.target = player; bossPhases(k, player); VIEW.yaw = 0; VIEW.dist = 9;`, wait: 2500 },
    { name: 'crypt-chest', js: `const c = S.npcs.find(x => x.id === 'chest_sent_a'); player.x = c.x; player.y = c.y + 60; openChest(c); VIEW.yaw = -Math.PI/2; VIEW.dist = 6;`, wait: 2500 },
    { name: 'crypt-map', js: `for (let x=100;x<2600;x+=200) for (let y=100;y<1400;y+=200){ player.x=x; player.y=y; revealFog(); } player.x=900; player.y=700; openMenu('map');`, wait: 2000 },
    { name: 'map', pre: `closeModal(); enterZone('hollow', 120, 1100);`, js: ``, wait: 1 },
    { name: 'map2', pre: `enterZone('hollow', 120, 1100);`, js: `for (let x=100;x<3200;x+=250) for (let y=100;y<2200;y+=250){ player.x=x; player.y=y; revealFog(); checkLandmarks(); } player.x=120; player.y=1100; openMenu('map');`, wait: 2500 },
    { name: 'help', js: `openMenu('help');`, wait: 1500 },
    { name: 'help-nm', js: `document.querySelectorAll('.help details').forEach((d,i)=>d.open = i===5||i===6); document.querySelector('#mBody').scrollTop = 0;`, wait: 1000 },
    { name: 'updates', js: `openMenu('updates');`, wait: 1500 },
    { name: 'inventory', js: `giveItem('raiders_ring',1,true); giveItem('scavenger_cap',1,true); giveItem('chieftain_cap',1,true); giveItem('hi_potion',2,true); openMenu('inventory'); UI.sel = save.inventory.findIndex(s=>s.id==='raiders_ring'); renderModal();`, wait: 1500 }
  ].filter(s => !only || only.split(',').includes(s.name));
  for (const sc of scenes) {
    try {
      if (sc.pre) { await page.evaluate('(()=>{' + sc.pre + '})()'); if (sc.shotLoading) { await page.waitForTimeout(700); await page.screenshot({ path: out + '-' + sc.name + '-loading.png' }); } await page.waitForFunction(() => !VIEW.loading, null, { timeout: 200000 }); }
      await page.evaluate('(()=>{' + sc.js + '})()');
    } catch (e) { errs.push('scene ' + sc.name + ': ' + e.message); }
    await page.waitForTimeout(sc.wait);
    await page.screenshot({ path: out + '-' + sc.name + '.png' });
    console.log('shot', sc.name);
  }
  await page.evaluate(() => { closeModal(); logoutToSelect(); });
  await page.waitForSelector('#loading.ready', { timeout: 240000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-roster.png' });
  console.log('roster2', JSON.stringify(await page.evaluate(() => loadRoster().chars.map(c => c.name + ':' + c.job + ':' + c.lv))));
  await page.click('.ccCard[data-id]');
  await page.waitForFunction(() => UI.started, null, { timeout: 200000 });
  console.log('relogin', await page.evaluate(() => save.name + ' ' + S.zone.name));
  const ray = await page.evaluate(() => { const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2(0, 0), W3.camera); return rc.intersectObjects(W3.scene.children, true).slice(0, 4).map(h => (h.object.name || h.object.type) + ':' + h.distance.toFixed(2) + ':' + (h.object.geometry && h.object.geometry.type)); }); console.log('ray', JSON.stringify(ray)); console.log('gs', await page.evaluate(() => [0,20,40,60,80,100,120,160].map(d => groundY(player.x - d, player.y).toFixed(2)).join(' ')));
  const info = await page.evaluate(() => ({ px: Math.round(player.x), py: Math.round(player.y), gy: groundY(player.x, player.y).toFixed(2), cam: W3.camera.position.toArray().map(v => v.toFixed(1)), eff: VIEW.camEff, dist: VIEW.dist, pitch: VIEW.pitch, target: player.target && player.target.name, chain: document.getElementById('chainCt').textContent, lm: Object.keys(save.landmarks).length }));
  console.log(JSON.stringify(info));
  console.log(errs.length ? 'CONSOLE:\n' + [...new Set(errs)].join('\n') : 'no console errors');
  await browser.close();
})();
