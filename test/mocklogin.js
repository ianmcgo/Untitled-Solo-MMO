module.exports = async function mockLogin(page, html, name) {
  const db = { chars: {}, member: false };
  const user = { id: '11111111-2222-3333-4444-555555555555', email: 'ianmcgon@gmail.com', aud: 'authenticated', role: 'authenticated' };
  const sess = () => ({ access_token: 'tok', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'ref', user });
  await page.route('https://mztqrqgtlvviwwftrqhs.supabase.co/**', async route => {
    const req = route.request(), url = new URL(req.url()), m = req.method(), p = url.pathname;
    const json = (o, st) => route.fulfill({ status: st || 200, contentType: 'application/json', body: JSON.stringify(o) });
    if (p === '/auth/v1/token') return json(sess());
    if (p === '/auth/v1/user') return json(user);
    if (p === '/rest/v1/rpc/is_member') return json(db.member);
    if (p === '/rest/v1/rpc/join_game') { db.member = true; return json(true); }
    if (p.startsWith('/rest/v1/rpc/')) return json([]);
    if (p === '/rest/v1/characters') {
      const sel = url.searchParams.get('select') || '';
      if (m === 'GET') { const idf = url.searchParams.get('id'); if (idf) { const c = db.chars[idf.replace('eq.', '')]; return json(sel === 'data' ? { data: c.data } : c); } return json(Object.values(db.chars).map(c => ({ id: c.id, name: c.name, summary: c.summary, updated_at: c.updated_at }))); }
      if (m === 'POST') { const b = JSON.parse(req.postData()); for (const r of Array.isArray(b) ? b : [b]) db.chars[r.id] = Object.assign({ updated_at: new Date().toISOString() }, r); return route.fulfill({ status: 201, body: '' }); }
      if (m === 'PATCH') return route.fulfill({ status: 204 });
    }
    return json([]);
  });
  page.setDefaultTimeout(300000);
  await page.goto('file://' + html);
  await page.waitForSelector('#loading.ready');
  await page.click('#ldStart'); await page.waitForTimeout(1200);
  await page.fill('#acEmail', 'ianmcgon@gmail.com'); await page.fill('#acPw', 'secret1'); await page.click('[data-go]'); await page.waitForTimeout(2500);
  await page.click('[data-new]'); await page.waitForTimeout(2000);
  await page.fill('#ccName', name || 'Tessa'); await page.click('[data-create]');
  await page.waitForFunction(() => UI.started, null, { timeout: 280000 });
  await page.waitForTimeout(1000);
  return db;
};
