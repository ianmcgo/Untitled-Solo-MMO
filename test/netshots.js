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
    if (p === '/rest/v1/rpc/admin_stats') return json({ players: 1, online: 1, characters: Object.keys(db.chars).length, signups_7d: 1, banned: 0, db_size: '9 MB', chars_size: '64 kB', code_set: true, schema: '2', trades_7d: 3, audit: [{ at: new Date().toISOString(), char_name: 'Zed', email: 'zed@x.com', kind: 'crystals', detail: 'gained 899900 crystals in 1 s' }], banned_list: [{ email: 'zed@x.com' }], online_list: [{ email: user.email, last_seen: new Date().toISOString() }], recent: Object.values(db.chars).map(c => ({ name: c.name, job: c.summary.job, lv: c.summary.lv, zone: c.summary.zone, email: user.email, updated_at: c.updated_at })) });
    if (p === '/rest/v1/rpc/trade_offer') {
      const b = JSON.parse(req.postData()); db.trade = b;
      return json({ status: 'pending' });
    }
    if (p === '/rest/v1/rpc/trade_status' || p === '/rest/v1/rpc/trade_cancel') {
      const t = db.trade; if (!t) return json({ status: 'none' });
      const c = db.chars[t.my_char]; let inv = JSON.parse(JSON.stringify(c.data.inventory));
      for (const it of t.mine.items) { let n = it.qty; for (let i = inv.length - 1; i >= 0 && n > 0; i--) if (inv[i].id === it.id) { const k = Math.min(n, inv[i].qty); inv[i].qty -= k; n -= k; if (!inv[i].qty) inv.splice(i, 1); } }
      for (const it of t.theirs.items) inv.push({ id: it.id, qty: it.qty });
      db.trade = null; db.tradesDone = (db.tradesDone || 0) + 1;
      return json({ status: 'done', inventory: inv, gil: c.data.gil - t.mine.gil + t.theirs.gil });
    }
    if (p === '/rest/v1/ah_listings') {
      const mine = url.searchParams.get('seller');
      db.ah = db.ah || [{ id: 11, seller: 'abc', seller_name: 'Mira', item: 'healing_herb', qty: 6, price: 120, expires_at: new Date(Date.now() + 40 * 3600000).toISOString() }, { id: 12, seller: 'def', seller_name: 'Brum', item: 'healing_herb', qty: 1, price: 30, expires_at: new Date(Date.now() + 3 * 3600000).toISOString() }, { id: 13, seller: 'def', seller_name: 'Brum', item: 'bronze_sword', qty: 1, price: 900, expires_at: new Date(Date.now() + 20 * 3600000).toISOString() }];
      return json(mine ? db.ah.filter(l => 'eq.' + l.seller === mine) : db.ah);
    }
    if (p === '/rest/v1/rpc/ah_box_list') return json(db.box || [{ id: 1, kind: 'sold', item: 'potion', qty: 1, gil: 80, note: 'Brum' }]);
    if (p === '/rest/v1/rpc/ah_history') return json([{ price: 100, qty: 6 }, { price: 25, qty: 1 }]);
    if (p === '/rest/v1/rpc/ah_buy') { const b = JSON.parse(req.postData()); const l = db.ah.find(x => x.id === b.lot); db.ah = db.ah.filter(x => x !== l); const c = db.chars[b.my_char]; c.data.gil -= l.price; db.box = [{ id: 2, kind: 'bought', item: l.item, qty: l.qty, gil: 0 }]; return json({ gil: c.data.gil, item: l.item, qty: l.qty, price: l.price }); }
    if (p === '/rest/v1/rpc/ah_collect') { const b = JSON.parse(req.postData()); const c = db.chars[b.my_char]; const inv = c.data.inventory.slice(); let g = c.data.gil; for (const x of db.box || []) { if (x.kind === 'sold') g += x.gil; else inv.push({ id: x.item, qty: x.qty }); } const got = (db.box || []).length; db.box = []; return json({ inventory: inv, gil: g, got, left: 0 }); }
    if (p === '/rest/v1/rpc/ls_mine') return json([{ id: '7e734105-1bcd-421b-8a3b-10386912409b', name: 'Ember Guard', color: '#ff8844', rank: 'leader', members: [{ name: 'Tessa', rank: 'leader' }, { name: 'Mira', rank: 'sack' }, { name: 'Brum', rank: 'pearl' }] }]);
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
  for (let i = 0; i < 8 && !(await page.$('#ccName')); i++) { await page.click('[data-next]'); await page.waitForTimeout(150); }
  await page.fill('#ccName', 'Tessa'); await page.click('[data-create]');
  await page.waitForFunction(() => UI.started, null, { timeout: 200000 });
  await page.waitForTimeout(1500);
  console.log('chars on server', Object.values(db.chars).map(c => c.name + ':' + c.summary.job));
  await page.evaluate(() => { save.gil = 4242; saveGame(); return netFlush(); });
  await page.waitForTimeout(800);
  console.log('gil on server', Object.values(db.chars)[0].data.gil);
  await page.evaluate(() => {
    netOnPresence({ abc: [{ id: 'abc', name: 'Mira', job: 'WHM', lv: 5, look: { race: 'nekari', build: 1, skin: 2, hairStyle: HAIR_STYLES.indexOf(HAIR_BY_SEX[1][0]), hairColor: 6 }, gear: { main: 'ash_club', body: 'linen_robe' } }], def: [{ id: 'def', name: 'Brum', job: 'WAR', lv: 7, look: { race: 'ursan', build: 0, skin: 1, hairColor: 2 }, gear: { main: 'butterfly_axe', body: 'scale_mail' } }] });
    netOnMove({ id: 'abc', x: player.x + 70, y: player.y - 20, f: Math.PI, st: 0, sw: 0, ws: 0, ht: 0, c: null, hp: 100 });
    netOnMove({ id: 'def', x: player.x + 40, y: player.y - 90, f: Math.PI / 2, st: 4, sw: 0, ws: 0, ht: 0, c: null, hp: 80 });
    VIEW.yaw = Math.PI * 0.5; VIEW.dist = 7; player.face = 0;
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { netOnChat({ id: 'abc', name: 'Mira', kind: 'say', text: 'Hi! Want to party?', x: player.x + 70, y: player.y - 20 }); netOnMove({ id: 'def', x: player.x + 40, y: player.y - 90, f: Math.PI / 2, st: 4, sw: 1, ws: 0, ht: 0, c: null, hp: 80 }); netOnMove({ id: 'abc', x: player.x + 70, y: player.y - 20, f: Math.PI, st: 0, sw: 0, ws: 0, ht: 0, c: 'cure', hp: 100 }); NET_RT.online = [{ name: 'Mira', zone: 'outpost', lv: 5, job: 'WHM' }]; runCommand('/t mira Sure, coming!'); netOnTell({ to: save.name.toLowerCase(), from: 'Mira', text: 'Great, meet at the gate' }); runCommand('/who'); runCommand('hello everyone'); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-others.png' });
  console.log('others', await page.evaluate(() => [...S.others.values()].map(o => o.name + ':' + o.job + ':' + !!VIEW.views.get(o)).join(',')));
  const party = await page.evaluate(() => {
    const r = {};
    runCommand('/invite Mira');
    r.pid = !!NET_PT.id;
    netOnPartyPresence({ me: [{ id: S.charId, name: save.name, t: NET_PT.me }], abc: [{ id: 'abc', name: 'Mira', t: NET_PT.me + 5 }] });
    netOnPSt({ id: 'abc', job: 'WHM', sub: 'BLM', lv: 5, zone: S.zoneId, x: Math.round(player.x + 70), y: Math.round(player.y - 20), hp: 80, maxHp: 120, mp: 40, maxMp: 60, tp: 300, alive: true, b: ['protect'] });
    r.leader = netIsLeader(); r.near = netPartyNear(player.x, player.y).length;
    const j = save.jobs[save.mainJob], xp0 = j.xp + j.lv * 100000, g0 = save.gil;
    netOnKill({ id: 'abc', ids: [S.charId], zone: S.zoneId, x: Math.round(player.x), y: Math.round(player.y), mlv: player.lv + 2, top: 5, n: 2, ch: 1, gil: 12, fam: 'rabbit' });
    r.xp = (j.xp + j.lv * 100000) - xp0; r.gil = save.gil - g0;
    netOnPool({ id: 'abc', ids: [S.charId], key: 'abc:1', item: 'bronze_dagger', dur: 30 });
    r.pool = S.pool.length;
    const e = S.pool[S.pool.length - 1]; lotPool(e.seq, false);
    const d0 = invCount('bronze_dagger');
    netOnWin({ id: 'abc', key: 'abc:1', win: S.charId, name: save.name, item: 'bronze_dagger' });
    r.won = invCount('bronze_dagger') - d0;
    netOnPool({ id: 'abc', ids: [S.charId], key: 'abc:2', item: 'bronze_sword', dur: 30 });
    player.hp = Math.max(1, player.maxHp - 30);
    const hp0 = player.hp;
    netOnFx({ id: 'abc', to: S.charId, kind: 'heal', sp: 'cure', amt: 25 });
    netOnFx({ id: 'abc', to: S.charId, kind: 'buff', sp: 'protect' });
    r.healed = player.hp - hp0; r.prot = !!player.buffs.protect;
    netOnPChat({ id: 'abc', text: 'Nice pull!' });
    runCommand('/p Thanks!');
    const o = S.others.get('abc'); setTarget(o); tgtCmdOpen(o); onTgtCmd('ma');
    r.mate = isMate(o); r.cureOk = checkAction(player, { kind: 'ma', id: 'cure' }, o);
    return r;
  });
  console.log('party', JSON.stringify(party));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-party.png' });
  const trade = await page.evaluate(() => {
    const r = {};
    tgtCmdClose();
    netTradeOpen('Mira', 'abc');
    const give = save.inventory.find(s => tradeable(s.id)).id;
    r.give = give; r.addMsg = netTradeAdd(give, 1);
    netOnToff({ to: save.name.toLowerCase(), from: 'Mira', items: [{ id: 'healing_herb', qty: 3 }, { id: 'potion', qty: 1 }], gil: 50 });
    return r;
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-trade.png' });
  console.log('trade', JSON.stringify(await page.evaluate(g => {
    const h0 = invCount('healing_herb'), gv0 = invCount(g), gil0 = save.gil;
    netTradeAccept();
    const waiting = !!NET_PT.trade && NET_PT.trade.myOk;
    netOnTcf({ to: save.name.toLowerCase(), from: 'Mira', h: netTradeMyHash() });
    window.TR0 = { h0, gv0, gil0, waiting };
    return 1;
  }, trade.give)));
  await page.waitForTimeout(5000);
  console.log('trade2', JSON.stringify(await page.evaluate(g => ({ waiting: TR0.waiting, herbs: invCount('healing_herb') - TR0.h0, gave: TR0.gv0 - invCount(g), gil: save.gil - TR0.gil0, open: !!NET_PT.trade, lock: !!NET.saveLock, modal: S.modal }), trade.give)));
  console.log('server trades', db.tradesDone || 0);
  const shared = await page.evaluate(() => {
    const r = {};
    if (S.modal) closeModal();
    window.SENT = [];
    if (NET_RT.zch) NET_RT.zch.send = m => { window.SENT.push(m); return Promise.resolve('ok'); };
    const me = { id: S.charId, v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT };
    netElect({ me: [me], abc: [{ id: 'abc', v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT - 5000, h: 1 }] });
    r.nonHost = NET_SH.on && !NET_SH.host; r.cleared = S.mobs.length;
    r.req = SENT.some(m => m.event === 'req');
    const fk = 'orc_grunt', lv = player.lv;
    const row = (hp, fl, bf) => ['abcd1', fk, lv, Math.round(player.x + 40), Math.round(player.y + 10), 3.1, hp, 400, 1, S.charId, fl, -1, 0, 0, 200, bf || ''];
    netOnMs({ id: 'abc', f: 1, m: [row(400, 0)] });
    const m = NET_SH.map.get('abcd1');
    r.proxy = !!m && m.proxy && S.mobs.includes(m);
    r.inCombat = inCombatWith(player);
    setTarget(m); player.engaged = true; player.attackTarget = m;
    for (let i = 0; i < 4; i++) swing(player, m);
    r.hits = SENT.filter(x => x.event === 'hit').length;
    r.predHp = m.hp;
    m.buffs.dia = { until: S.time + 30, next: S.time + 3, tick: 4, src: player, el: 'light' };
    NET_SH.lastFlush = 0; netShTick();
    r.deb = SENT.some(x => x.event === 'deb' && x.payload.k === 'dia');
    const hp0 = player.hp;
    for (let i = 0; i < 6; i++) netOnMat({ id: 'abc', nid: 'abcd1', to: S.charId, k: 'sw' });
    r.mobHitMe = hp0 - player.hp;
    player.hp = player.maxHp;
    netOnMs({ id: 'abc', f: 0, m: [row(300, 2, 'dia:25')] });
    r.readying = !!m.readying; r.diaHost = !!(m.buffs.dia && m.buffs.dia.host);
    const k0 = save.stats.kills;
    netOnDie({ id: 'abc', nid: 'abcd1', claim: S.charId });
    r.dead = !m.alive; r.reward = save.stats.kills - k0;
    netOnMs({ id: 'abc', f: 1, m: [] });
    r.mapAfter = NET_SH.map.size;
    netElect({ me: [Object.assign({}, me, { t: NET_SH.joinT - 9000 })], abc: [{ id: 'abc', v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT - 5000 }] });
    r.host = NET_SH.on && NET_SH.host;
    const mob = spawnExtra(fk, lv, player.x + 60, player.y + 30);
    SENT.length = 0; NET_SH.lastSnap = 0; NET_SH.lastFull = 0; netShTick();
    const ms = SENT.find(x => x.event === 'ms');
    r.snapRows = ms ? ms.payload.m.length : 0;
    const mira = S.others.get('abc'); mira.alive = true; mira.x = mob.x + 20; mira.y = mob.y; mira.placed = true;
    netOnHit({ id: 'abc', nid: mob.nid, d: 25, en: 80 });
    r.claim = mob.claim; r.mobHp = mob.maxHp - mob.hp; r.mobTgt = topEnmity(mob) === mira;
    for (let i = 0; i < 80; i++) { S.time += 0.1; updateMob(mob, 0.1); }
    r.mat = SENT.filter(x => x.event === 'mat' && x.payload.to === 'abc').length;
    const k1 = save.stats.kills;
    netOnHit({ id: 'abc', nid: mob.nid, d: 99999, en: 10 });
    r.die = (SENT.find(x => x.event === 'die') || {}).payload;
    r.hostReward = save.stats.kills - k1;
    return r;
  });
  console.log('shared', JSON.stringify(shared));
  const claims = await page.evaluate(() => {
    const r = {};
    SENT.length = 0;
    netElect({ me: [{ id: S.charId, v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT + 9000 }], abc: [{ id: 'abc', v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT - 5000, h: 1 }] });
    const row = (nid, claim, ch, bu) => [nid, 'orc_grunt', player.lv, Math.round(player.x + 40), Math.round(player.y), 0, 400, 400, 1, 'def', 0, -1, 0, 0, 0, '', claim, ch || 0, bu || 0];
    netOnMs({ id: 'abc', f: 1, m: [row('c1', 'def'), row('c2', 'abc', ['Impaction', 0, 'Spinning Slash', -1, 4], 0)] });
    const c1 = NET_SH.map.get('c1'), c2 = NET_SH.map.get('c2');
    r.c1state = claimState(c1); r.c2state = claimState(c2);
    setTarget(c1); toggleEngage(false); r.engagedC1 = player.engaged && player.attackTarget === c1;
    const before = SENT.filter(x => x.event === 'hit').length;
    applyDamage(player, c1, 10); r.blockedHit = SENT.filter(x => x.event === 'hit').length === before;
    r.c2chain = !!c2.chain && c2.chain.props[0] === 'Impaction';
    resolveChain(player, c2, { props: ['Detonation'], name: 'Test' }, 50);
    r.scSent = SENT.some(x => x.event === 'sc');
    netOnMove({ id: 'abc', x: player.x + 70, y: player.y - 20, f: 0, st: 0, sw: 0, ws: 0, ht: 0, c: null, hp: 100, tg: 'c2' });
    player.target = null; runCommand('/assist Mira'); r.assist = player.target === c2;
    netElect({ me: [{ id: S.charId, v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT - 99999 }], abc: [{ id: 'abc', v: GAME_VERSION, zone: S.zoneId, t: NET_SH.joinT }] });
    const mob = spawnExtra('orc_grunt', player.lv, player.x + 80, player.y);
    applyDamage(player, mob, 5);
    r.myClaim = mob.claim === S.charId;
    const brum = S.others.get('def'); brum.alive = true; brum.pid = null;
    const hp0 = mob.hp;
    netOnHit({ id: 'def', nid: netNid(mob), d: 30, en: 10 }); r.brumBlocked = mob.hp === hp0;
    const mira = S.others.get('abc'); mira.pid = NET_PT.id; mira.alive = true;
    netOnHit({ id: 'abc', nid: mob.nid, d: 30, en: 10 }); r.miraAllowed = mob.hp === hp0 - 30;
    return r;
  });
  console.log('claims', JSON.stringify(claims));
  await page.evaluate(() => { if (S.modal) closeModal(); UI.ahView = 'players'; openMenu('auction'); });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { UI.pmSel = 'healing_herb'; renderModal(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out + '-players-ah.png' });
  const ah = await page.evaluate(async () => { const h0 = invCount('healing_herb'), g0 = save.gil; await netAhBuy(12); return { herbs: invCount('healing_herb') - h0, gil: save.gil - g0, lock: !!NET.saveLock }; });
  console.log('ah', JSON.stringify(ah));
  const social = await page.evaluate(async () => {
    const r = {};
    if (S.modal) closeModal();
    await netLsRefresh();
    r.ls = NET_LS.list.length; r.active = save.lsActive === NET_LS.list[0].id;
    NET_RT.online = [{ name: 'Tessa', zone: S.zoneId, lv: player.lv, job: player.job }, { name: 'Brum', zone: 'outpost', lv: 7, job: 'WAR', lfg: 1, cmt: 'need a healer', ls: 'Ember Guard' }];
    NET_RT.friendSeen = null; netFriendWatch();
    runCommand('/friend add Mira');
    NET_RT.online.push({ name: 'Mira', zone: S.zoneId, lv: 5, job: 'WHM', sub: 'BLM', lfg: 1, cmt: 'cures for hire' });
    netFriendWatch();
    r.friendOnline = [...document.querySelectorAll('#log div')].some(d => /Mira has come online/.test(d.textContent));
    r.search = netSearch('whm').map(o => o.name).join(); r.lfg = netSearch('lfg').length; r.range = netSearch('6-8').map(o => o.name).join();
    runCommand('/l Hello shell');
    netOnLsChat(NET_LS.list[0].id, { name: 'Mira', text: 'hi from the shell' });
    netOnLsChat(NET_LS.list[0].id, { name: 'Stranger', text: 'spoof' });
    r.lsLines = [...document.querySelectorAll('#log div.ls')].map(d => d.textContent).join(' / ');
    runCommand('/blacklist add Brum');
    netOnTell({ to: save.name.toLowerCase(), from: 'Brum', text: 'buy gil' });
    r.blocked = ![...document.querySelectorAll('#log div')].some(d => /buy gil/.test(d.textContent));
    runCommand('/seek need a tank');
    r.meta = netWorldMeta();
    openMenu('social');
    return r;
  });
  console.log('social', JSON.stringify(social));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out + '-social.png' });
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
