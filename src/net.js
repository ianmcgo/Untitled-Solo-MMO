const NET_CFG = { url: "https://mztqrqgtlvviwwftrqhs.supabase.co", key: "sb_publishable_wldVf5Bla7j_1_7m_2b3nQ_6df091Ad", admin: "ianmcgon@gmail.com", saveEvery: 15000, beat: 60000 };
const NET = { sb: null, user: null, session: null, member: false, ready: false, dirty: {}, saving: false, lastSave: 0, lastErr: "", beatAt: 0 };
const NET_PENDING = "usr_pending_code";
const isUuid = s => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ""));

function netInit() {
  if (NET.sb) return NET.sb;
  if (typeof SUPA === "undefined") return null;
  NET.sb = SUPA.createClient(NET_CFG.url, NET_CFG.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "usr_auth" } });
  NET.sb.auth.onAuthStateChange((ev, session) => { NET.session = session; NET.user = session ? session.user : null; });
  return NET.sb;
}

function netIsAdmin() { return !!(NET.user && String(NET.user.email || "").toLowerCase() === NET_CFG.admin); }
function netErr(e) { const m = (e && (e.message || e.error_description || e.msg)) || String(e || "Unknown error"); return /fetch|network|Failed/i.test(m) ? "Can't reach the game server. Check your connection and try again." : m; }

async function netRestore() {
  const sb = netInit();
  if (!sb) return false;
  try {
    const { data } = await sb.auth.getSession();
    NET.session = data.session; NET.user = data.session ? data.session.user : null;
    if (!NET.user) return false;
    return await netEnsureMember();
  } catch (e) { NET.lastErr = netErr(e); return false; }
}

async function netEnsureMember(code) {
  const sb = NET.sb;
  const { data: mem, error } = await sb.rpc("is_member");
  if (error) throw error;
  if (mem) { NET.member = true; return true; }
  const c = code || (() => { try { return localStorage.getItem(NET_PENDING); } catch (e) { return null; } })();
  if (!c && !netIsAdmin()) { NET.member = false; return false; }
  const { error: e2 } = await sb.rpc("join_game", { code: c || "" });
  if (e2) throw e2;
  try { localStorage.removeItem(NET_PENDING); } catch (e) {}
  NET.member = true;
  return true;
}

async function netSignIn(email, password) {
  const sb = netInit();
  if (!sb) throw new Error("The game server library didn't load.");
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  NET.session = data.session; NET.user = data.user;
  return await netEnsureMember();
}

async function netSignUp(email, password, code) {
  const sb = netInit();
  if (!sb) throw new Error("The game server library didn't load.");
  try { localStorage.setItem(NET_PENDING, code); } catch (e) {}
  const { data, error } = await sb.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  if (!data.session) return "confirm";
  NET.session = data.session; NET.user = data.user;
  await netEnsureMember(code);
  return "ok";
}

async function netSignOut() {
  await netFlush();
  try { netLeaveAll(); } catch (e) {}
  try { await NET.sb.auth.signOut(); } catch (e) {}
  NET.user = null; NET.session = null; NET.member = false;
  try { localStorage.removeItem(ROSTER_KEY); } catch (e) {}
}

function netSummary(id, d) { const s = charSummary(id, d); return { job: s.job, lv: s.lv, zone: s.zone, look: s.look, gil: s.gil, created: s.created, played: Date.now() }; }

async function netPullRoster() {
  const sb = NET.sb;
  const { data, error } = await sb.from("characters").select("id,name,summary,updated_at").eq("owner", NET.user.id).order("updated_at", { ascending: false });
  if (error) throw error;
  const local = loadRoster();
  let stash = [];
  try { stash = JSON.parse(STORE.get("usr_local_chars") || "[]"); } catch (e) {}
  for (const c of local.chars) if (!isUuid(c.id) && !stash.some(x => x.id === c.id)) stash.push(c);
  stash = stash.filter(c => STORE.get(charKey(c.id)));
  STORE.set("usr_local_chars", JSON.stringify(stash));
  NET.localOnly = stash;
  const r = { chars: [], current: local.current };
  for (const row of data) r.chars.push(Object.assign({ id: row.id, name: row.name, job: "WAR", lv: 1, zone: "Ashenreach Outpost", look: {} }, row.summary || {}, { played: Date.parse(row.updated_at) || Date.now() }));
  saveRoster(r);
  return r;
}

async function netFetchChar(id) {
  const { data, error } = await NET.sb.from("characters").select("data").eq("id", id).single();
  if (error) throw error;
  const d = normalizeSave(data.data);
  if (!d) throw new Error("That character's save is damaged.");
  STORE.set(charKey(id), JSON.stringify(d));
  return d;
}

async function netCreateChar(id, d) {
  const { error } = await NET.sb.from("characters").insert({ id, name: d.name, data: d, summary: netSummary(id, d) });
  if (error) { if (error.code === "23505") throw new Error("The name " + d.name + " is already taken on this server."); throw error; }
}

async function netDeleteChar(id) {
  if (!isUuid(id)) return;
  const { error } = await NET.sb.from("characters").delete().eq("id", id);
  if (error) throw error;
}

async function netUploadLocal() {
  const out = [];
  for (const c of NET.localOnly || []) {
    const d = loadChar(c.id);
    if (!d) continue;
    const nid = crypto.randomUUID();
    try { await netCreateChar(nid, d); STORE.set(charKey(nid), JSON.stringify(d)); STORE.remove(charKey(c.id)); c.done = true; out.push(c.name + " ✓"); }
    catch (e) { out.push(c.name + ": " + netErr(e)); }
  }
  NET.localOnly = (NET.localOnly || []).filter(c => !c.done);
  STORE.set("usr_local_chars", JSON.stringify(NET.localOnly));
  return out;
}

function netMarkDirty(id) { if (NET.member && isUuid(id)) NET.dirty[id] = true; }

async function netFlush(keepalive) {
  if (!NET.member || NET.saving) return;
  const ids = Object.keys(NET.dirty);
  if (!ids.length) return;
  NET.saving = true;
  for (const id of ids) {
    const raw = STORE.get(charKey(id));
    if (!raw) { delete NET.dirty[id]; continue; }
    let d; try { d = JSON.parse(raw); } catch (e) { delete NET.dirty[id]; continue; }
    const body = { data: d, summary: netSummary(id, d), name: d.name, updated_at: new Date().toISOString() };
    try {
      if (keepalive && NET.session) {
        const txt = JSON.stringify(body);
        await fetch(NET_CFG.url + "/rest/v1/characters?id=eq." + id, { method: "PATCH", keepalive: txt.length < 60000, headers: { apikey: NET_CFG.key, Authorization: "Bearer " + NET.session.access_token, "Content-Type": "application/json", Prefer: "return=minimal" }, body: txt });
      } else {
        const { error } = await NET.sb.from("characters").update(body).eq("id", id);
        if (error) throw error;
      }
      delete NET.dirty[id];
      NET.lastSave = Date.now();
      if (NET.lastErr) { NET.lastErr = ""; if (typeof log === "function") log("Reconnected. Your progress is saved on the server again.", "sys"); }
    } catch (e) {
      const m = netErr(e);
      if (m !== NET.lastErr && typeof log === "function") log("Couldn't save to the server (" + m + "). Your progress is kept on this device and will be sent when the connection returns.", "foe");
      NET.lastErr = m;
    }
  }
  NET.saving = false;
}

function netTick() {
  if (!NET.member) return;
  const now = Date.now();
  if (now - NET.lastSave > NET_CFG.saveEvery && Object.keys(NET.dirty).length) netFlush();
  netTrack();
  if (now - NET.beatAt > NET_CFG.beat) { NET.beatAt = now; NET.sb.rpc("touch_player").then(() => {}, () => {}); }
}

async function netAdminStats() {
  const { data, error } = await NET.sb.rpc("admin_stats");
  if (error) throw error;
  return data;
}

async function netAdminSetCode(code) {
  const { error } = await NET.sb.rpc("admin_set_signup_code", { code });
  if (error) throw error;
}

if (typeof window !== "undefined") {
  setInterval(() => { try { netTick(); } catch (e) {} }, 3000);
  window.addEventListener("pagehide", () => { netFlush(true); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") netFlush(true); });
}

const NET_RT = { zone: null, zch: null, wch: null, lastSend: 0, lastSig: "", lastPos: "", sw: 0, ws: 0, ht: 0, swT: -9, wsT: -9, htT: -9, lastTell: null, lastChat: 0, online: [] };

function netMeta() { return { id: S.charId, name: save.name, job: player.job, sub: player.sub, lv: player.lv, look: save.look, gear: Object.assign({}, save.gear), coat: save.mountCoat, zone: S.zoneId }; }

function netJoinZone(zoneId) {
  if (!NET.member || !NET.sb || !S.charId) return;
  if (NET_RT.zone === zoneId && NET_RT.zch) return;
  netLeaveZone();
  NET_RT.zone = zoneId;
  try {
    const ch = NET.sb.channel("zone:" + zoneId, { config: { broadcast: { self: false }, presence: { key: S.charId } } });
    ch.on("broadcast", { event: "mv" }, m => netOnMove(m.payload));
    ch.on("broadcast", { event: "chat" }, m => netOnChat(m.payload));
    ch.on("presence", { event: "sync" }, () => netOnPresence(ch.presenceState()));
    ch.subscribe(st => { if (st === "SUBSCRIBED") { NET_RT.lastSig = ""; NET_RT.lastPos = ""; netTrack(); } });
    NET_RT.zch = ch;
  } catch (e) { NET_RT.zch = null; }
  netWorld();
}

function netLeaveZone() {
  if (NET_RT.zch) { try { NET.sb.removeChannel(NET_RT.zch); } catch (e) {} }
  NET_RT.zch = null; NET_RT.zone = null;
  S.others = new Map();
}

function netLeaveAll() {
  netLeaveZone();
  if (NET_RT.wch) { try { NET.sb.removeChannel(NET_RT.wch); } catch (e) {} }
  NET_RT.wch = null;
}

function netTrack() {
  if (!NET_RT.zch || !player) return;
  const m = netMeta(), sig = JSON.stringify(m);
  if (sig === NET_RT.lastSig) return;
  NET_RT.lastSig = sig;
  Promise.resolve(NET_RT.zch.track(m)).catch(() => {});
  if (NET_RT.wch) Promise.resolve(NET_RT.wch.track({ name: save.name, zone: S.zoneId, lv: player.lv, job: player.job })).catch(() => {});
}

function netWorld() {
  if (NET_RT.wch || !NET.member) return;
  try {
    const ch = NET.sb.channel("world", { config: { broadcast: { self: false }, presence: { key: S.charId || NET.user.id } } });
    ch.on("broadcast", { event: "tell" }, m => netOnTell(m.payload));
    ch.on("presence", { event: "sync" }, () => { NET_RT.online = Object.values(ch.presenceState()).map(a => a[0]).filter(Boolean); });
    ch.subscribe(st => { if (st === "SUBSCRIBED") Promise.resolve(ch.track({ name: save.name, zone: S.zoneId, lv: player.lv, job: player.job })).catch(() => {}); });
    NET_RT.wch = ch;
  } catch (e) { NET_RT.wch = null; }
}

function netRtTick() {
  if (!NET_RT.zch || !player || !S.charId) return;
  if (player.lastSwing !== NET_RT.swT) { NET_RT.swT = player.lastSwing; NET_RT.sw++; }
  if (player.lastWS !== NET_RT.wsT) { NET_RT.wsT = player.lastWS; NET_RT.ws++; }
  if (player.lastHit !== NET_RT.htT) { NET_RT.htT = player.lastHit; NET_RT.ht++; }
  const now = Date.now();
  const st = (player.mounted ? 1 : 0) | (player.resting ? 2 : 0) | (player.engaged ? 4 : 0) | (player.alive ? 0 : 8);
  const p = { id: S.charId, x: Math.round(player.x), y: Math.round(player.y), f: +(player.face || 0).toFixed(2), st, sw: NET_RT.sw, ws: NET_RT.ws, wid: player.lastWSId || null, ht: NET_RT.ht, c: player.casting ? player.casting.id : null, hp: Math.round(100 * player.hp / Math.max(1, player.maxHp)) };
  const sig = JSON.stringify(p);
  const gap = sig === NET_RT.lastPos ? 2000 : 120;
  if (now - NET_RT.lastSend < gap) return;
  NET_RT.lastSend = now; NET_RT.lastPos = sig;
  Promise.resolve(NET_RT.zch.send({ type: "broadcast", event: "mv", payload: p })).catch(() => {});
}

function netRemote(meta) {
  if (!meta || !meta.id || meta.id === S.charId) return null;
  if (!S.others) S.others = new Map();
  let o = S.others.get(meta.id);
  if (!o) {
    o = { kind: "remote", remote: true, id: meta.id, x: player ? player.x : 0, y: player ? player.y : 0, tx: null, ty: null, face: 0, tf: 0, alive: true, radius: 14, speed: 140, buffs: {}, hp: 100, maxHp: 100, tp: 0, mp: 0, maxMp: 0, recasts: {}, lastSwing: -9, lastWS: -9, lastHit: -9, casting: null, seen: S.time, placed: false };
    S.others.set(meta.id, o);
  }
  o.name = meta.name || o.name || "Adventurer";
  if (meta.job) { o.job = meta.job; o.sub = meta.sub; o.lv = meta.lv; o.look = meta.look || {}; o.gear = meta.gear || {}; o.coat = meta.coat; }
  o.seen = S.time;
  return o;
}

function netOnPresence(state) {
  const live = new Set();
  for (const key in state) { const m = state[key] && state[key][0]; if (!m || m.id === S.charId) continue; live.add(m.id); netRemote(m); }
  for (const id of [...(S.others || new Map()).keys()]) if (!live.has(id)) S.others.delete(id);
}

function netOnMove(p) {
  if (!p || !p.id || p.id === S.charId || !S.others) return;
  const o = S.others.get(p.id);
  if (!o || !o.job) return;
  o.seen = S.time;
  o.tx = p.x; o.ty = p.y; o.tf = p.f;
  if (!o.placed) { o.x = p.x; o.y = p.y; o.face = p.f; o.px = o.x; o.py = o.y; o.placed = true; }
  o.mounted = !!(p.st & 1); o.resting = !!(p.st & 2); o.engaged = !!(p.st & 4); o.alive = !(p.st & 8);
  if (o.swc != null && p.sw !== o.swc) o.lastSwing = S.time;
  if (o.wsc != null && p.ws !== o.wsc) { o.lastWS = S.time; o.lastWSId = p.wid; }
  if (o.htc != null && p.ht !== o.htc) { o.lastHit = S.time; o.flash = 0.15; }
  o.swc = p.sw; o.wsc = p.ws; o.htc = p.ht;
  if (p.c && (!o.casting || o.casting.id !== p.c) && SPELLS[p.c]) o.casting = { id: p.c, sp: SPELLS[p.c], t: o, start: S.time, end: S.time + SPELLS[p.c].cast };
  if (!p.c) o.casting = null;
  o.hp = p.hp;
}

function tickRemotes(dt) {
  if (!S.others || !S.others.size) return;
  for (const [id, o] of S.others) {
    if (S.time - o.seen > 25) { S.others.delete(id); continue; }
    if (o.tx == null) continue;
    const d = Math.hypot(o.tx - o.x, o.ty - o.y);
    if (d > 500) { o.x = o.tx; o.y = o.ty; }
    else if (d > 0.5) { const k = Math.min(1, dt * 7); o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; }
    o.face += normAng(o.tf - o.face) * Math.min(1, dt * 10);
  }
}

const cleanChat = t => String(t || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 120);

function netChat(kind, text) {
  text = cleanChat(text);
  if (!text) return;
  if (Date.now() - NET_RT.lastChat < 700) { log("You're talking too fast.", "sys"); return; }
  NET_RT.lastChat = Date.now();
  log((kind === "shout" ? save.name + " shouts: " : save.name + ": ") + text, kind);
  if (kind === "say") popText(player, "💬 " + text.slice(0, 40), "#f4f1e8", 12, 3.5, 30);
  if (!NET_RT.zch) return;
  Promise.resolve(NET_RT.zch.send({ type: "broadcast", event: "chat", payload: { id: S.charId, name: save.name, kind, text, x: Math.round(player.x), y: Math.round(player.y) } })).catch(() => {});
}

function netOnChat(p) {
  if (!p || p.id === S.charId) return;
  const text = cleanChat(p.text), name = cleanChat(p.name).slice(0, 12);
  if (!text) return;
  if (p.kind === "say" && player && Math.hypot(p.x - player.x, p.y - player.y) > 900) return;
  log((p.kind === "shout" ? name + " shouts: " : name + ": ") + text, p.kind === "shout" ? "shout" : "say");
  const o = S.others && S.others.get(p.id);
  if (o && p.kind === "say") popText(o, "💬 " + text.slice(0, 40), "#f4f1e8", 12, 3.5, 30);
  if (typeof sfx === "function") sfx("tab");
}

function netTell(to, text) {
  text = cleanChat(text); to = cleanChat(to);
  if (!to || !text) { log("Usage: /t Name message", "sys"); return; }
  if (to.toLowerCase() === String(save.name).toLowerCase()) { log("You can't send a tell to yourself.", "sys"); return; }
  if (!NET_RT.online.some(o => String(o.name).toLowerCase() === to.toLowerCase())) { log(to + " isn't online right now.", "sys"); return; }
  if (Date.now() - NET_RT.lastChat < 700) { log("You're talking too fast.", "sys"); return; }
  NET_RT.lastChat = Date.now();
  log(">> " + to + ": " + text, "tell");
  if (NET_RT.wch) Promise.resolve(NET_RT.wch.send({ type: "broadcast", event: "tell", payload: { to: to.toLowerCase(), from: save.name, text } })).catch(() => {});
}

function netOnTell(p) {
  if (!p || String(p.to) !== String(save.name || "").toLowerCase()) return;
  const from = cleanChat(p.from).slice(0, 12), text = cleanChat(p.text);
  if (!text) return;
  NET_RT.lastTell = from;
  log(from + " >> " + text, "tell");
  if (typeof sfx === "function") sfx("notify");
}

function netWho() {
  const list = NET_RT.online.filter(o => o && o.name);
  if (!list.length) { log("Nobody else is online (or the server isn't connected).", "sys"); return; }
  log(list.length + " online: " + list.map(o => o.name + " (" + (JOBS[o.job] ? o.job : "?") + o.lv + ", " + (ZONES[o.zone] ? ZONES[o.zone].name : "?") + ")").join(", "), "sys");
}
