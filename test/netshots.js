const { chromium } = require('/opt/npm-tools/node_modules/playwright');
(async () => {
  const [html, out] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errs = [], calls = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  const db = { chars: {}, member: false };
  const user = { id: '11111111-2222-3333-4444-555555555555', email: 'ianmcgon@gmail.com', aud: 'authenticated', role: 'authenticated' };
  const sess = () => ({ access_token: 'tok', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'ref', user });
  await page.route('https://mztqrqgtlvviwwftrqhs.supabase.co/**', async route => {
    const req = route.request(), url = new URL(req.url()), m = req.method(), p = url.pathname;
    calls.push(m + ' ' + p + url.search.slice(0, 60));
    const json = (o, st) => route.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (p === '/auth/v1/token') { const b = JSON.parse(req.postData() || '{}'); if (b.password !== 'secret1') return json({ error: 'invalid_grant', error_description: 'Invalid login credentials' }, 400); return json(sess()); }
    if (p === '/auth/v1/signup') return json(sess());
    if (p === '/auth/v1/user') return json(user);
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204 });
    if (p === '/rest/v1/rpc/is_member') return json(db.member);
    if (p === '/rest/v1/rpc/join_game') { db.member = true; return json(true); }
    if (p === '/rest/v1/rpc/touch_player') return route.fulfill({ status: 204 });
    if (p === '/rest/v1/rpc/admin_stats') return json({ players: 1, online: 1, characters: Object.keys(db.chars).length, signups_7d: 1, banned: 0, db_size: '9 MB', chars_size: '64 kB', code_set: true, online_list: [{ email: user.email, last_seen: new Date().toISOString() }], recent: Object.values(db.chars).map(c => ({ name: c.name, job: c.summary.job, lv: c.summary.lv, zone: c.summary.zone, email: user.email, updated_at: c.updated_at })) });
    if (p === '/rest/v1/characters') {
      const sel = url.searchParams.get('select') || '';
      if (m === 'GET') {
        const idf = url.searchParams.get('id');
        if (idf) { const c = db.chars[idf.replace('eq.', '')]; return json(sel === 'data' ? { data: c.data } : c); }
        return json(Object.values(db.chars).map(c => ({ id: c.id, name: c.name, summary: c.summary, updated_at: c.updated_at })));
      }
      if (m === 'POST') { const b = JSON.parse(req.postData()); const rows = Array.isArray(b) ? b : [b]; for (const r of rows) db.chars[r.id] = Object.assign({ updated_at: new Date().toISOString() }, r); return route.fulfill({ status: 201, body: '' }); }
      if (m === 'PATCH') { const id = url.searchParams.get('id').replace('eq.', ''); const b = JSON.parse(req.postData()); Object.assign(db.chars[id], b); return route.fulfill({ status: 204 }); }
      if (m === 'DELETE') { const id = url.searchParams.get('id').replace('eq.', ''); delete db.chars[id]; return route.fulfill({ status: 204 }); }
    }
    return json({ message: 'not mocked ' + p }, 404);
  });
  page.setDefaultTimeout(240000);
  await page.goto('file://' + html);
  await page.waitForSelector('#loading.ready');
  await page.click('#ldStart'); await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-login.png' });
  await page.fill('#acEmail', 'Ianmcgon@gmail.com'); await page.fill('#acPw', 'wrong12'); await page.click('[data-go]'); await page.waitForTimeout(1200);
  console.log('wrongpw', await page.textContent('#acErr'));
  await page.fill('#acPw', 'secret1'); await page.click('[data-go]'); await page.waitForTimeout(2500);
  await page.screenshot({ path: out + '-roster.png' });
  await page.click('[data-new]'); await page.waitForTimeout(2500);
  await page.fill('#ccName', 'Tessa'); await page.click('[data-create]');
  await page.waitForFunction(() => UI.started, null, { timeout: 200000 });
  await page.waitForTimeout(1500);
  console.log('chars on server', Object.values(db.chars).map(c => c.name + ':' + c.summary.job));
  await page.evaluate(() => { save.gil = 4242; saveGame(); return netFlush(); });
  await page.waitForTimeout(800);
  console.log('gil on server', Object.values(db.chars)[0].data.gil);
  await page.evaluate(() => {
    netOnPresence({ abc: [{ id: 'abc', name: 'Mira', job: 'WHM', lv: 5, look: { race: 'nekari', build: 1, skin: 2, hairStyle: HAIR_STYLES.indexOf(HAIR_BY_SEX[1][0]), hairColor: 6 }, gear: { main: 'ash_club', body: 'linen_robe' } }], def: [{ id: 'def', name: 'Brum', job: 'WAR', lv: 7, look: { race: 'ursan', build: 0, skin: 1, hairColor: 2 }, gear: { main: 'bronze_greataxe', body: 'scale_mail' } }] });
    netOnMove({ id: 'abc', x: player.x + 70, y: player.y - 20, f: Math.PI, st: 0, sw: 0, ws: 0, ht: 0, c: null, hp: 100 });
    netOnMove({ id: 'def', x: player.x + 40, y: player.y - 90, f: Math.PI / 2, st: 4, sw: 0, ws: 0, ht: 0, c: null, hp: 80 });
    VIEW.yaw = Math.PI * 0.5; VIEW.dist = 7; player.face = 0;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { netOnChat({ id: 'abc', name: 'Mira', kind: 'say', text: 'Hi! Want to party?', x: player.x + 70, y: player.y - 20 }); netOnMove({ id: 'def', x: player.x + 40, y: player.y - 90, f: Math.PI / 2, st: 4, sw: 1, ws: 0, ht: 0, c: null, hp: 80 }); netOnMove({ id: 'abc', x: player.x + 70, y: player.y - 20, f: Math.PI, st: 0, sw: 0, ws: 0, ht: 0, c: 'cure', hp: 100 }); NET_RT.online = [{ name: 'Mira', zone: 'outpost', lv: 5, job: 'WHM' }]; runCommand('/t mira Sure, coming!'); netOnTell({ to: save.name.toLowerCase(), from: 'Mira', text: 'Great, meet at the gate' }); runCommand('/who'); runCommand('hello everyone'); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-others.png' });
  console.log('others', await page.evaluate(() => [...S.others.values()].map(o => o.name + ':' + o.job + ':' + !!VIEW.views.get(o)).join(',')));
  await page.evaluate(() => openMenu('settings')); await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-settings.png' });
  await page.evaluate(() => openMenu('admin')); await page.waitForTimeout(2000);
  await page.screenshot({ path: out + '-admin.png' });
  await page.evaluate(() => openMenu('system')); await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-system.png' });
  console.log('calls', calls.length, [...new Set(calls.map(c => c.split('?')[0]))].join(' | '));
  console.log(errs.length ? 'ERRORS ' + errs.join(' || ') : 'no console errors');
  await browser.close();
})();
