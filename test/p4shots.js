const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [out, vw, vh, mobile, only] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: +vw, height: +vh }, deviceScaleFactor: 1, isMobile: mobile === '1', hasTouch: mobile === '1' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  const tg = Date.now(); await page.goto('file:///home/claude/build/dist/index.html', { timeout: 240000 }); console.log('goto', Date.now() - tg); await page.screenshot({ path: '/tmp/claude-0/-home-claude/b43fe5de-490f-5892-97a8-08a89eb39ea3/scratchpad/p4/loading-' + 'p4shots' + '.png' }).catch(()=>{}); await page.waitForSelector('#loading.ready', { timeout: 240000 }); console.log('ready', Date.now() - tg); await page.screenshot({ path: '/tmp/claude-0/-home-claude/b43fe5de-490f-5892-97a8-08a89eb39ea3/scratchpad/p4/ready.png' }); await page.click('#ldStart');
  page.setDefaultTimeout(240000);
  await page.waitForTimeout(500);
  await page.waitForTimeout(1500);
  const setup = `window.setH = h => { const v = vana(); let d = h - v.hour - v.minute / 60; if (d < 0) d += 24; S.timeShift += d * 3600000 / 25; };`;
  await page.evaluate(setup);
  const scenes = [
    { name: 'town', js: `setH(10); save.gil = 1450; giveItem('potion', 4); giveItem('ether', 2); giveItem('iron_sword', 1); giveItem('raiders_ring', 1); giveItem('bat_wing',2); save.quests.pouches='active'; giveItem('goblin_pouch',2); hireMerc('mira'); hireMerc('kael'); hireMerc('sable'); player.target = S.npcs.find(n=>n.id==='rhea');`, wait: 5000 },
    { name: 'combat', pre: `setH(14); enterZone('hollow', 650, 330);`, js: ` S.mobs.forEach(m=>{ if (dist(m,player)>500) m.despawned=true; }); const m = S.mobs.filter(m=>m.alive&&!m.despawned).sort((a,b)=>dist(a,player)-dist(b,player))[0]; player.target=m; toggleEngage(true); player.tp=1200; m.chain={props:['Impaction'],openAt:S.time-0.5,closeAt:S.time+5}; m.burst={el:['earth','lightning'],until:S.time+6}; m.readying={t:0.4}; S.party[2]&&(S.party[2].casting={id:'cure',sp:SPELLS.cure,t:player,start:S.time,end:S.time+4});`, wait: 6000 },
    { name: 'levelup', js: `S.mobs.forEach(m=>m.state='idle'); toggleEngage(false); gainXp(xpNeed(save.jobs[save.mainJob].lv)); `, wait: 2500 },
    { name: 'night', pre: `setH(22); enterZone('hollow', 300, 520);`, js: ``, wait: 6000 },
    { name: 'menu-char', js: `openMenu('character');`, wait: 4000 },
    { name: 'menu-inv', js: `openMenu('inventory'); UI.sel = save.inventory.findIndex(s=>s.id==='iron_sword'); renderModal();`, wait: 2000 },
    { name: 'menu-actions', js: `openMenu('actions');`, wait: 1500 },
    { name: 'menu-map', js: `player.x=900; revealFog(); player.x=300; openMenu('map');`, wait: 2000 },
    { name: 'menu-quests', js: `openMenu('quests');`, wait: 1500 },
    { name: 'menu-settings', js: `openMenu('settings');`, wait: 1500 },
    { name: 'dialog', pre: `closeModal(); enterZone('outpost', 640, 300);`, js: ` talkTo(S.npcs.find(n=>n.id==='rhea'));`, wait: 5000 }
  ].filter(s => !only || only.split(',').includes(s.name));
  for (const sc of scenes) {
    if (sc.pre) { await page.evaluate('(()=>{' + sc.pre + '})()'); await page.screenshot({ path: out + '-' + sc.name + '-loading.png' }); await page.waitForFunction(() => !VIEW.loading, null, { timeout: 120000 }); }
    try { await page.evaluate('(()=>{' + sc.js + '})()'); } catch (e) { errs.push('scene ' + sc.name + ': ' + e.message); }
    await page.waitForTimeout(sc.wait);
    await page.screenshot({ path: out + '-' + sc.name + '.png' });
    console.log('shot', sc.name);
  }
  const au = await page.evaluate(() => ({ ready: AUDIO.ready, ctx: AUDIO.ctx && AUDIO.ctx.state, buffers: Object.keys(AUDIO.buffers).length, music: AUDIO.music && AUDIO.music.name, amb: AUDIO.amb && AUDIO.amb.name, voices: AUDIO.voices }));
  console.log('audio', JSON.stringify(au));
  console.log(errs.length ? 'CONSOLE:\n' + [...new Set(errs)].join('\n') : 'no console errors');
  await browser.close();
})();
