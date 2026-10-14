const NET_SCHEMA = 4;
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
  if (!NET.member || NET.saving || NET.saveLock) return;
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
  if (now - NET.beatAt > NET_CFG.beat) { NET.beatAt = now; const t0 = performance.now(); NET.sb.rpc("touch_player").then(() => { NET.ping = Math.round(performance.now() - t0); }, () => {}); }
  if (S.charId && now - (NET.ahAt || 0) > 60000) { NET.ahAt = now; netAhWatch(); }
}

async function netAdminStats() {
  const { data, error } = await NET.sb.rpc("admin_stats");
  if (error) throw error;
  return data;
}

async function netFlushNow() {
  for (let i = 0; i < 60 && NET.saving; i++) await new Promise(r => setTimeout(r, 100));
  await netFlush();
  return !NET.lastErr && !Object.keys(NET.dirty).length;
}

async function netAdminBan(target, ban) {
  const { data, error } = await NET.sb.rpc("admin_set_ban", { target, ban });
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
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") netFlush(true); NET_RT.lastSig = ""; if (typeof netTrack === "function") netTrack(); });
}

const NET_RT = { zone: null, zch: null, wch: null, lastSend: 0, lastSig: "", lastPos: "", sw: 0, ws: 0, ht: 0, swT: -9, wsT: -9, htT: -9, lastTell: null, lastChat: 0, online: [] };

function netMeta() { return { id: S.charId, name: save.name, job: player.job, sub: player.sub, lv: player.lv, look: save.look, gear: Object.assign({}, save.gear), coat: save.mountCoat, zone: S.zoneId, t: NET_SH.joinT, v: GAME_VERSION, h: NET_SH.on && NET_SH.host ? 1 : 0, away: document.hidden ? 1 : 0, p: typeof NET_PT !== "undefined" ? NET_PT.id : null }; }

function netJoinZone(zoneId) {
  if (!NET.member || !NET.sb || !S.charId) return;
  if (NET_RT.zone === zoneId && NET_RT.zch) { if (NET_SH.on && !NET_SH.host) netDemote(); return; }
  netLeaveZone();
  NET_RT.zone = zoneId;
  netShReset();
  try {
    const ch = NET.sb.channel("zone:" + zoneId, { config: { broadcast: { self: false }, presence: { key: S.charId } } });
    ch.on("broadcast", { event: "mv" }, m => netOnMove(m.payload));
    ch.on("broadcast", { event: "chat" }, m => netOnChat(m.payload));
    for (const [ev, fn] of [["ms", netOnMs], ["hit", netOnHit], ["deb", netOnDeb], ["mat", netOnMat], ["die", netOnDie], ["req", netOnReq], ["want", netOnWant], ["sc", (p) => netOnSc(p)]]) ch.on("broadcast", { event: ev }, m => fn(m.payload));
    ch.on("presence", { event: "sync" }, () => { const st = ch.presenceState(); netOnPresence(st); netElect(st); });
    ch.subscribe(st => { if (st === "SUBSCRIBED") { NET_RT.lastSig = ""; NET_RT.lastPos = ""; netTrack(); } });
    NET_RT.zch = ch;
  } catch (e) { NET_RT.zch = null; }
  netWorld();
}

function netLeaveZone() {
  if (NET_RT.zch) { try { NET.sb.removeChannel(NET_RT.zch); } catch (e) {} }
  NET_RT.zch = null; NET_RT.zone = null;
  if (S.others) for (const o of S.others.values()) o.alive = false;
  S.others = new Map();
  if (NET_SH.on && !NET_SH.host) { S.mobs = S.mobs.filter(m => !m.proxy); }
  NET_SH.on = false; NET_SH.host = true;
}

function netLeaveAll() {
  if (typeof netLsUnsub === "function") netLsUnsub();
  if (typeof netTradeCancel === "function") netTradeCancel(true);
  if (typeof netPartyLeave === "function") netPartyLeave(true);
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
  const wm = JSON.stringify(netWorldMeta());
  if (NET_RT.wch && wm !== NET_RT.lastWSig) { NET_RT.lastWSig = wm; Promise.resolve(NET_RT.wch.track(netWorldMeta())).catch(() => {}); }
}

function netWorld() {
  if (NET_RT.wch || !NET.member) return;
  try {
    const ch = NET.sb.channel("world", { config: { broadcast: { self: false }, presence: { key: S.charId || NET.user.id } } });
    ch.on("broadcast", { event: "tell" }, m => netOnTell(m.payload));
    ch.on("broadcast", { event: "pinv" }, m => netOnPInv(m.payload));
    ch.on("broadcast", { event: "pdecl" }, m => netOnPDecl(m.payload));
    ch.on("broadcast", { event: "trq" }, m => netOnTrq(m.payload));
    ch.on("broadcast", { event: "tok" }, m => netOnTok(m.payload));
    ch.on("broadcast", { event: "tno" }, m => netOnTno(m.payload));
    ch.on("broadcast", { event: "toff" }, m => netOnToff(m.payload));
    ch.on("broadcast", { event: "tcf" }, m => netOnTcf(m.payload));
    ch.on("broadcast", { event: "tcx" }, m => netOnTcx(m.payload));
    ch.on("broadcast", { event: "lsinv" }, m => netOnLsInv(m.payload));
    ch.on("presence", { event: "sync" }, () => { NET_RT.online = Object.values(ch.presenceState()).map(a => a[0]).filter(Boolean); netFriendWatch(); });
    ch.subscribe(st => { if (st === "SUBSCRIBED") { NET_RT.lastWSig = JSON.stringify(netWorldMeta()); Promise.resolve(ch.track(netWorldMeta())).catch(() => {}); } });
    NET_RT.wch = ch;
    netLsRefresh();
  } catch (e) { NET_RT.wch = null; }
}

function netRtTick() {
  if (typeof netPartyTick === "function") netPartyTick();
  netShTick();
  if (!NET_RT.zch || !player || !S.charId) return;
  if (player.lastSwing !== NET_RT.swT) { NET_RT.swT = player.lastSwing; NET_RT.sw++; }
  if (player.lastWS !== NET_RT.wsT) { NET_RT.wsT = player.lastWS; NET_RT.ws++; }
  if (player.lastHit !== NET_RT.htT) { NET_RT.htT = player.lastHit; NET_RT.ht++; }
  const now = Date.now();
  const st = (player.mounted ? 1 : 0) | (player.resting ? 2 : 0) | (player.engaged ? 4 : 0) | (player.alive ? 0 : 8);
  const p = { id: S.charId, x: Math.round(player.x), y: Math.round(player.y), f: +(player.face || 0).toFixed(2), st, sw: NET_RT.sw, ws: NET_RT.ws, wid: player.lastWSId || null, ht: NET_RT.ht, c: player.casting ? player.casting.id : null, hp: Math.round(100 * player.hp / Math.max(1, player.maxHp)), tg: isMob(player.target) && player.target.alive ? netNid(player.target) : null };
  const sig = JSON.stringify(p);
  const gap = sig === NET_RT.lastPos ? 2000 : 120;
  if (now - NET_RT.lastSend < gap) return;
  NET_RT.lastSend = now; NET_RT.lastPos = sig; NET_RT.sent = (NET_RT.sent || 0) + 1;
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
  o.pid = meta.p || null;
  if (meta.job) { o.job = meta.job; o.sub = meta.sub; o.lv = meta.lv; o.look = meta.look || {}; o.gear = meta.gear || {}; o.coat = meta.coat; }
  o.seen = S.time;
  return o;
}

function netOnPresence(state) {
  const live = new Set();
  for (const key in state) { const m = state[key] && state[key][0]; if (!m || m.id === S.charId) continue; live.add(m.id); netRemote(m); }
  for (const id of [...(S.others || new Map()).keys()]) if (!live.has(id)) { S.others.get(id).alive = false; S.others.delete(id); }
}

function netOnMove(p) {
  NET_RT.recv = (NET_RT.recv || 0) + 1;
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
  o.tgNid = p.tg || null;
}

function tickRemotes(dt) {
  if (!S.others || !S.others.size) return;
  for (const [id, o] of S.others) {
    if (S.time - o.seen > 25) { o.alive = false; S.others.delete(id); continue; }
    if (o.tx == null) continue;
    const d = Math.hypot(o.tx - o.x, o.ty - o.y);
    o.moving = d > 2;
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
  if (!text || netBlocked(name)) return;
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
  if (!text || netBlocked(from)) return;
  NET_RT.lastTell = from;
  log(from + " >> " + text, "tell");
  if (typeof sfx === "function") sfx("notify");
}

function netWho() {
  const list = NET_RT.online.filter(o => o && o.name);
  if (!list.length) { log("Nobody else is online (or the server isn't connected).", "sys"); return; }
  if (NET_SH.on) log("Monsters in " + S.zone.name + " are being run by " + netHostName() + ".", "sys");
  log(list.length + " online: " + list.map(o => o.name + " (" + (JOBS[o.job] ? o.job : "?") + o.lv + ", " + (ZONES[o.zone] ? ZONES[o.zone].name : "?") + ")").join(", "), "sys");
}

const NET_PT = { id: null, ch: null, me: 0, members: new Map(), names: new Map(), invite: null, lastSt: 0, stSig: "", trade: null, ask: null };

function netWorldSend(event, payload) {
  if (!NET_RT.wch) return false;
  NET_RT.sent = (NET_RT.sent || 0) + 1;
  Promise.resolve(NET_RT.wch.send({ type: "broadcast", event, payload })).catch(() => {});
  return true;
}
function netPartySend(event, payload) {
  if (!NET_PT.ch) return false;
  Promise.resolve(NET_PT.ch.send({ type: "broadcast", event, payload })).catch(() => {});
  return true;
}
const netLc = s => String(s || "").toLowerCase();
function netOnline(name) { return NET_RT.online.find(o => o && netLc(o.name) === netLc(name)); }
function netInParty() { return !!NET_PT.id; }
function netIsMate(id) { return !!id && NET_PT.members.has(id); }
function netPartyList() { return [...NET_PT.members.values()]; }
function netPartySize() { return NET_PT.id ? 1 + NET_PT.members.size : 1; }
function netIsLeader() {
  if (!NET_PT.id) return true;
  for (const m of NET_PT.members.values()) if ((m.t || 0) < NET_PT.me) return false;
  return true;
}
function netLeaderName() {
  let best = { name: save.name, t: NET_PT.me };
  for (const m of NET_PT.members.values()) if ((m.t || 0) < best.t) best = m;
  return best.name;
}
function netPartyNear(x, y) {
  if (!NET_PT.id) return [];
  const r = CONFIG.partyRange;
  return netPartyList().filter(m => m.zone === S.zoneId && m.alive !== false && m.x != null && Math.hypot(m.x - x, m.y - y) <= r && Date.now() - (m.at || 0) < 12000);
}

function netPartyInvite(name) {
  name = cleanChat(name).slice(0, 12);
  if (!NET.member || !NET_RT.wch) { log("Parties need the game server.", "sys"); return; }
  if (!name) { log("Usage: /invite Name (or target a player and press Invite).", "sys"); return; }
  if (netLc(name) === netLc(save.name)) { log("You can't invite yourself.", "sys"); return; }
  if (!netOnline(name)) { log(name + " isn't online right now.", "sys"); return; }
  if (netPartyList().some(m => netLc(m.name) === netLc(name))) { log(name + " is already in your party.", "sys"); return; }
  if (NET_PT.id && !netIsLeader()) { log("Only the party leader (" + netLeaderName() + ") can invite.", "sys"); return; }
  if (netPartySize() >= CONFIG.partyMax) { log("Your party is full (" + CONFIG.partyMax + " players).", "sys"); return; }
  if (!NET_PT.id) netPartySub((S.charId || "p").slice(0, 8) + Date.now().toString(36));
  netWorldSend("pinv", { to: netLc(name), from: save.name, pid: NET_PT.id });
  log("You invite " + netOnline(name).name + " to your party.", "party");
}

function netOnPInv(p) {
  if (!p || p.to !== netLc(save.name)) return;
  const from = cleanChat(p.from).slice(0, 12);
  if (netBlocked(from)) { netWorldSend("pdecl", { to: netLc(from), from: save.name }); return; }
  if (NET_PT.id || NET_PT.trade) { netWorldSend("pdecl", { to: netLc(from), from: save.name, busy: true }); return; }
  NET_PT.invite = { from, pid: String(p.pid).slice(0, 40), until: Date.now() + 60000 };
  log(from + " invites you to join their party. Type /join to accept or /decline.", "party");
  if (typeof sfx === "function") sfx("notify");
  if (typeof gameConfirm === "function" && !(typeof UI !== "undefined" && UI.confirmOpen)) gameConfirm("Party invitation", from + " invites you to join their party.", () => netPartyJoin(), { yes: "Join", no: "Decline", onNo: () => netPartyDecline() });
}

function netPartyJoin() {
  const inv = NET_PT.invite;
  if (!inv || Date.now() > inv.until) { NET_PT.invite = null; log("You have no party invitation.", "sys"); return; }
  if (NET_PT.id) { log("Leave your current party first.", "sys"); return; }
  NET_PT.invite = null;
  netPartySub(inv.pid);
  log("You join " + inv.from + "'s party.", "party");
}

function netPartyDecline() {
  const inv = NET_PT.invite;
  if (!inv) { log("You have no party invitation.", "sys"); return; }
  NET_PT.invite = null;
  netWorldSend("pdecl", { to: netLc(inv.from), from: save.name });
  log("You decline " + inv.from + "'s invitation.", "sys");
}

function netOnPDecl(p) {
  if (!p || p.to !== netLc(save.name)) return;
  const from = cleanChat(p.from).slice(0, 12);
  log(from + (p.busy ? " is busy (already in a party or trading)." : " declines your invitation."), "party");
  if (NET_PT.id && !NET_PT.members.size) setTimeout(() => { if (NET_PT.id && !NET_PT.members.size) netPartyLeave(true); }, 4000);
}

function netPartySub(pid) {
  if (!NET.sb) return;
  netPartyLeave(true);
  NET_PT.id = pid; NET_PT.me = Date.now(); NET_PT.members = new Map(); NET_PT.stSig = ""; NET_PT.lastSt = 0;
  try {
    const ch = NET.sb.channel("party:" + pid, { config: { broadcast: { self: false }, presence: { key: S.charId } } });
    ch.on("presence", { event: "sync" }, () => netOnPartyPresence(ch.presenceState()));
    ch.on("broadcast", { event: "pst" }, m => netOnPSt(m.payload));
    ch.on("broadcast", { event: "pchat" }, m => netOnPChat(m.payload));
    ch.on("broadcast", { event: "kill" }, m => netOnKill(m.payload));
    ch.on("broadcast", { event: "pool" }, m => netOnPool(m.payload));
    ch.on("broadcast", { event: "lot" }, m => netOnLot(m.payload));
    ch.on("broadcast", { event: "win" }, m => netOnWin(m.payload));
    ch.on("broadcast", { event: "kick" }, m => netOnKick(m.payload));
    ch.on("broadcast", { event: "fx" }, m => netOnFx(m.payload));
    ch.subscribe(st => { if (st === "SUBSCRIBED") Promise.resolve(ch.track({ id: S.charId, name: save.name, t: NET_PT.me })).catch(() => {}); });
    NET_PT.ch = ch;
  } catch (e) { NET_PT.ch = null; NET_PT.id = null; }
  if (typeof uiPartyChanged === "function") uiPartyChanged();
}

function netPartyLeave(quiet) {
  if (!NET_PT.id) { if (!quiet) log("You aren't in a party.", "sys"); return; }
  if (NET_PT.ch) { try { NET_PT.ch.untrack(); } catch (e) {} try { NET.sb.removeChannel(NET_PT.ch); } catch (e) {} }
  NET_PT.ch = null; NET_PT.id = null; NET_PT.members = new Map();
  if (S.pool) S.pool = S.pool.filter(e => !e.net || e.net.owner);
  if (!quiet) log("You leave the party.", "party");
  if (typeof uiPartyChanged === "function") uiPartyChanged();
}

function netOnPartyPresence(state) {
  const live = new Map();
  for (const key in state) { const m = state[key] && state[key][0]; if (!m || !m.id || m.id === S.charId) continue; live.set(m.id, m); }
  for (const [id, m] of live) if (!NET_PT.members.has(id)) {
    if (NET_PT.members.size + 1 >= CONFIG.partyMax + 1) continue;
    NET_PT.members.set(id, { id, name: cleanChat(m.name).slice(0, 12), t: +m.t || 0, at: Date.now(), hp: 1, maxHp: 1, mp: 0, maxMp: 0, tp: 0, lv: 1, job: "WAR", alive: true });
    log(cleanChat(m.name).slice(0, 12) + " joins the party.", "party");
    if (typeof sfx === "function") sfx("notify");
    NET_PT.stSig = "";
  }
  for (const [id, m] of [...NET_PT.members]) if (!live.has(id)) { NET_PT.members.delete(id); log(m.name + " leaves the party.", "party"); }
  if (typeof uiPartyChanged === "function") uiPartyChanged();
}

function netPartyKick(name) {
  if (!NET_PT.id) { log("You aren't in a party.", "sys"); return; }
  if (!netIsLeader()) { log("Only the party leader can remove members.", "sys"); return; }
  const m = netPartyList().find(x => netLc(x.name) === netLc(cleanChat(name)));
  if (!m) { log("Nobody called " + cleanChat(name) + " is in your party.", "sys"); return; }
  netPartySend("kick", { id: m.id, name: m.name });
  log("You remove " + m.name + " from the party.", "party");
}

function netOnKick(p) {
  if (!p) return;
  if (p.id === S.charId) { netPartyLeave(true); log("You have been removed from the party.", "party"); return; }
}

function netPartyChat(text) {
  text = cleanChat(text);
  if (!text) return;
  if (!NET_PT.id) { log("You aren't in a party.", "sys"); return; }
  if (Date.now() - NET_RT.lastChat < 700) { log("You're talking too fast.", "sys"); return; }
  NET_RT.lastChat = Date.now();
  log("(" + save.name + ") " + text, "pchat");
  netPartySend("pchat", { id: S.charId, name: save.name, text });
}

function netOnPChat(p) {
  if (!p || !netIsMate(p.id)) return;
  const text = cleanChat(p.text);
  if (!text) return;
  log("(" + NET_PT.members.get(p.id).name + ") " + text, "pchat");
  if (typeof sfx === "function") sfx("tab");
}

function netPartyTick() {
  if (!NET_PT.ch || !player) return;
  const now = Date.now();
  if (NET_PT.invite && now > NET_PT.invite.until) NET_PT.invite = null;
  const st = { id: S.charId, name: save.name, job: player.job, sub: player.sub || null, lv: player.lv, zone: S.zoneId, x: Math.round(player.x), y: Math.round(player.y), hp: Math.ceil(player.hp), maxHp: player.maxHp, mp: Math.floor(player.mp), maxMp: player.maxMp, tp: Math.floor(player.tp), alive: !!player.alive, b: Object.keys(player.buffs || {}).slice(0, 8) };
  const sig = JSON.stringify(st);
  const gap = sig === NET_PT.stSig ? 4000 : 500;
  if (now - NET_PT.lastSt < gap) return;
  NET_PT.lastSt = now; NET_PT.stSig = sig;
  netPartySend("pst", st);
}

function netOnPSt(p) {
  if (!p || !netIsMate(p.id)) return;
  const m = NET_PT.members.get(p.id);
  m.at = Date.now();
  m.job = JOBS[p.job] ? p.job : m.job; m.sub = JOBS[p.sub] ? p.sub : null;
  m.lv = clamp(+p.lv || 1, 1, CONFIG.levelCap); m.zone = String(p.zone || ""); m.x = +p.x || 0; m.y = +p.y || 0;
  m.maxHp = Math.max(1, +p.maxHp || 1); m.hp = clamp(+p.hp || 0, 0, m.maxHp); m.maxMp = Math.max(0, +p.maxMp || 0); m.mp = clamp(+p.mp || 0, 0, m.maxMp); m.tp = clamp(+p.tp || 0, 0, CONFIG.tpMax);
  m.alive = !!p.alive; m.buffs = {}; for (const k of (Array.isArray(p.b) ? p.b : []).slice(0, 8)) if (typeof k === "string") m.buffs[k] = 1;
  const o = S.others && S.others.get(p.id);
  if (o) { o.mate = true; o.hp = m.hp; o.maxHp = m.maxHp; o.mp = m.mp; o.maxMp = m.maxMp; o.tp = m.tp; }
}

function netPartyKill(e, mates, top, n, ch, gil) {
  netPartySend("kill", { id: S.charId, name: save.name, zone: S.zoneId, x: Math.round(e.x), y: Math.round(e.y), mlv: e.lv, fam: e.famKey, top, n, ch, gil, ids: mates.map(m => m.id) });
}

function netOnKill(p) {
  if (!p || !netIsMate(p.id) || !player) return;
  if (!Array.isArray(p.ids) || !p.ids.includes(S.charId)) return;
  if (p.zone !== S.zoneId || !player.alive || Math.hypot(player.x - p.x, player.y - p.y) > CONFIG.partyRange + 150) return;
  const n = clamp(+p.n || 2, 2, CONFIG.partyMax), top = clamp(+p.top || player.lv, player.lv, CONFIG.levelCap), ch = clamp(+p.ch || 0, 0, CONFIG.chainMax);
  const base = xpFor(clamp(+p.mlv || 1, 1, 99), top);
  const xp = Math.round(base * partyShare(n) * player.lv / top * (1 + CONFIG.chainStep * ch));
  if (xp > 0) gainXp(xp, ch); else log("No experience gained (too weak).", "sys");
  const g = clamp(+p.gil || 0, 0, 5000);
  if (g > 0) { save.gil += g; log("You obtain " + g + " crystals (party share).", "loot"); }
  if (FAMILIES[p.fam] || NM_FAMILIES[p.fam]) { const fe = { famKey: p.fam }; save.stats.kills++; questKillCredit(p.fam); bountyKill(fe); }
  saveGame();
}

function netPoolOut(e, mates) {
  e.net = { key: S.charId + ":" + e.seq, owner: true, ids: mates.map(m => m.id), lots: {} };
  netPartySend("pool", { id: S.charId, name: save.name, key: e.net.key, item: e.id, dur: CONFIG.poolTime, ids: e.net.ids });
}

function netOnPool(p) {
  if (!p || !netIsMate(p.id) || !Array.isArray(p.ids) || !p.ids.includes(S.charId) || !ITEMS[p.item]) return;
  S.pool = S.pool || [];
  const dur = clamp(+p.dur || CONFIG.poolTime, 5, 120);
  S.pool.push({ id: p.item, until: S.time + dur, lots: {}, mine: null, seq: ++S.mobSeq, net: { key: String(p.key), owner: false, from: NET_PT.members.get(p.id).name } });
  log("The " + ITEMS[p.item].name + " goes into the treasure pool.", "loot");
  if (typeof uiEvent === "function") uiEvent("pool", { id: p.item });
}

function netLotOut(e) {
  if (!e.net) return;
  netPartySend("lot", { id: S.charId, name: save.name, key: e.net.key, roll: e.mine });
}

function netOnLot(p) {
  if (!p || !netIsMate(p.id)) return;
  const e = (S.pool || []).find(x => x.net && x.net.key === p.key);
  if (!e) return;
  const roll = clamp(Math.floor(+p.roll || 0), 0, 999);
  if (e.net.owner) e.net.lots[p.id] = roll;
  const nm = NET_PT.members.get(p.id).name;
  log(roll ? nm + " lots " + roll + " on the " + ITEMS[e.id].name + "." : nm + " passes on the " + ITEMS[e.id].name + ".", "party");
}

function netWinOut(e, winId, winName) {
  netPartySend("win", { id: S.charId, key: e.net.key, win: winId, name: winName, item: e.id });
}

function netOnWin(p) {
  if (!p || !netIsMate(p.id)) return;
  const e = (S.pool || []).find(x => x.net && x.net.key === p.key);
  if (!e) return;
  S.pool.splice(S.pool.indexOf(e), 1);
  const it = ITEMS[e.id];
  if (!p.win) { log("Nobody wanted the " + it.name + ". It is lost.", "sys"); return; }
  if (p.win === S.charId) { save.stats.lotsWon++; giveItem(e.id, 1); saveGame(); return; }
  log(cleanChat(p.name).slice(0, 24) + " obtains the " + it.name + ".", "loot");
}

function netCastOn(a, t, sp, id) {
  if (sp.kind === "heal") {
    const amt = healAmount(a, sp);
    netPartySend("fx", { id: S.charId, to: t.id, kind: "heal", sp: id, amt });
    ring(t, "#9ad06b", 30, 0.6, "sparkle"); sfx("cure", t); vfx("cure", { src: a, tgt: t, big: sp.power > 40 });
    log("You cast " + sp.name + " on " + t.name + ".", "you");
  } else if (sp.kind === "buff") {
    netPartySend("fx", { id: S.charId, to: t.id, kind: "buff", sp: id });
    ring(t, "#9ad06b", 26, 0.5); sfx("buff", t); vfx("buff", { tgt: t, id: sp.buff });
    log("You cast " + sp.name + " on " + t.name + ".", "you");
  }
}

function netOnFx(p) {
  if (!p || p.to !== S.charId || !netIsMate(p.id) || !player || !player.alive) return;
  const sp = SPELLS[p.sp], from = NET_PT.members.get(p.id).name;
  if (!sp) return;
  const o = S.others && S.others.get(p.id);
  if (o && Math.hypot(o.x - player.x, o.y - player.y) > CONFIG.castRange + 200) return;
  if (p.kind === "heal" && sp.kind === "heal") {
    const amt = clamp(Math.round(+p.amt || 0), 0, 2000);
    const real = Math.max(0, Math.min(amt, player.maxHp - player.hp));
    player.hp += real;
    if (real > 0) { popText(player, "+" + real, "#9ad06b", 18); ring(player, "#9ad06b", 30, 0.6, "sparkle"); sfx("cure", player); vfx("cure", { tgt: player }); }
    log(from + " casts " + sp.name + ". You recover " + real + " HP.", "party");
  } else if (p.kind === "buff" && sp.kind === "buff") {
    player.buffs[sp.buff] = { until: S.time + sp.dur, src: player };
    popText(player, sp.name, "#9ad06b", 13, 1.1, 14); ring(player, "#9ad06b", 26, 0.5); sfx("buff", player); vfx("buff", { tgt: player, id: sp.buff });
    log(from + " casts " + sp.name + " on you.", "party");
    if (typeof refreshPlayer === "function") refreshPlayer(false);
  }
}

function netTradeAsk(name) {
  name = cleanChat(name).slice(0, 12);
  if (!NET.member || !NET_RT.wch) { log("Trading needs the game server.", "sys"); return; }
  if (NET_PT.trade) { log("You're already trading.", "sys"); return; }
  const o = [...(S.others || new Map()).values()].find(x => netLc(x.name) === netLc(name));
  if (!o) { log((name || "That player") + " isn't in this area.", "sys"); return; }
  if (Math.hypot(o.x - player.x, o.y - player.y) > CONFIG.tradeRange) { log(o.name + " is too far away to trade.", "sys"); return; }
  if (!player.alive || player.engaged) { log("You can't trade right now.", "sys"); return; }
  NET_PT.ask = { name: o.name, id: o.id, until: Date.now() + 30000 };
  netWorldSend("trq", { to: netLc(o.name), from: save.name, fid: S.charId });
  log("You ask " + o.name + " to trade.", "sys");
}

function netOnTrq(p) {
  if (!p || p.to !== netLc(save.name)) return;
  const from = cleanChat(p.from).slice(0, 12);
  if (netBlocked(from)) { netWorldSend("tno", { to: netLc(from), from: save.name }); return; }
  if (NET_PT.trade || !player || !player.alive || player.engaged) { netWorldSend("tno", { to: netLc(from), from: save.name, busy: true }); return; }
  if (typeof sfx === "function") sfx("notify");
  log(from + " wants to trade with you.", "sys");
  const yes = () => { netTradeOpen(from, String(p.fid || "")); netWorldSend("tok", { to: netLc(from), from: save.name, fid: S.charId }); };
  const no = () => netWorldSend("tno", { to: netLc(from), from: save.name });
  if (typeof gameConfirm === "function") gameConfirm("Trade request", from + " wants to trade with you.", yes, { yes: "Trade", no: "Decline", onNo: no }); else no();
}

function netOnTok(p) {
  if (!p || p.to !== netLc(save.name) || !NET_PT.ask || netLc(p.from) !== netLc(NET_PT.ask.name) || Date.now() > NET_PT.ask.until) return;
  NET_PT.ask = null;
  netTradeOpen(cleanChat(p.from).slice(0, 12), String(p.fid || ""));
}

function netOnTno(p) {
  if (!p || p.to !== netLc(save.name)) return;
  if (NET_PT.ask && netLc(p.from) === netLc(NET_PT.ask.name)) NET_PT.ask = null;
  log(cleanChat(p.from).slice(0, 12) + (p.busy ? " is busy right now." : " declines to trade."), "sys");
}

function netTradeOpen(name, id) {
  NET_PT.trade = { name, id, mine: { items: [], gil: 0 }, theirs: { items: [], gil: 0 }, myOk: false, theirOk: "", msg: "" };
  log("Trading with " + name + ".", "sys");
  if (typeof openMenu === "function") openMenu("trade");
}

const tradeHash = (a, b) => { const x = [[netLc(a[0]), a[1]], [netLc(b[0]), b[1]]].sort((p, q) => (p[0] < q[0] ? -1 : 1)); return JSON.stringify(x); };
function netTradeMyHash() { const t = NET_PT.trade; return tradeHash([save.name, t.mine], [t.name, t.theirs]); }

function netTradeOffered(id) { const t = NET_PT.trade; return t ? t.mine.items.filter(s => s.id === id).reduce((n, s) => n + s.qty, 0) : 0; }
function tradeable(id) { const it = ITEMS[id]; return !!it && it.kind !== "key" && !it.ex; }

function netTradeAdd(id, n) {
  const t = NET_PT.trade;
  if (!t) return "";
  if (!tradeable(id)) return "That item can't be traded.";
  n = Math.max(1, Math.floor(n || 1));
  const free = invCount(id) - netTradeOffered(id);
  if (free < n) return "You don't have that many.";
  if (t.mine.items.length >= CONFIG.tradeSlots && !t.mine.items.some(s => s.id === id)) return "Trades hold up to " + CONFIG.tradeSlots + " kinds of item.";
  const s = t.mine.items.find(x => x.id === id);
  if (s) s.qty += n; else t.mine.items.push({ id, qty: n });
  netTradeChanged();
  return "";
}
function netTradeRemove(id) { const t = NET_PT.trade; if (!t) return; t.mine.items = t.mine.items.filter(s => s.id !== id); netTradeChanged(); }
function netTradeGil(g) { const t = NET_PT.trade; if (!t) return ""; g = Math.max(0, Math.floor(+g || 0)); if (g > save.gil) return "You don't have that many crystals."; t.mine.gil = g; netTradeChanged(); return ""; }

function netTradeChanged() {
  const t = NET_PT.trade;
  t.myOk = false; t.theirOk = "";
  netWorldSend("toff", { to: netLc(t.name), from: save.name, items: t.mine.items, gil: t.mine.gil });
}

function netOnToff(p) {
  const t = NET_PT.trade;
  if (!p || !t || p.to !== netLc(save.name) || netLc(p.from) !== netLc(t.name)) return;
  const items = (Array.isArray(p.items) ? p.items : []).slice(0, CONFIG.tradeSlots).filter(s => s && tradeable(s.id)).map(s => ({ id: s.id, qty: clamp(Math.floor(+s.qty || 0), 1, 999) }));
  t.theirs = { items, gil: Math.max(0, Math.floor(+p.gil || 0)) };
  t.myOk = false; t.theirOk = ""; t.msg = "";
  if (typeof sfx === "function") sfx("tab");
}

function tradeRoom(give, get) {
  let need = 0;
  for (const g of get) {
    const st = ITEMS[g.id].stack || 1;
    const space = save.inventory.filter(x => x.id === g.id).reduce((n, x) => n + Math.max(0, st - x.qty), 0);
    need += Math.ceil(Math.max(0, g.qty - space) / st);
  }
  return save.inventory.length + need <= CONFIG.inventorySize;
}

function netTradeCheck() {
  const t = NET_PT.trade;
  if (!t) return "No trade open.";
  for (const s of t.mine.items) if (invCount(s.id) < s.qty) return "You no longer have " + ITEMS[s.id].name + ".";
  if (save.gil < t.mine.gil) return "You don't have that many crystals.";
  for (const s of t.theirs.items) if (ITEMS[s.id].rare && (hasItem(s.id) || t.theirs.items.filter(x => x.id === s.id).reduce((n, x) => n + x.qty, 0) > 1)) return "You can only carry one " + ITEMS[s.id].name + ".";
  if (!tradeRoom(t.mine.items, t.theirs.items)) return "Not enough room in your bag.";
  const o = S.others && S.others.get(t.id);
  if (!o || Math.hypot(o.x - player.x, o.y - player.y) > CONFIG.tradeRange + 60) return t.name + " is too far away.";
  return "";
}

function netTradeAccept() {
  const t = NET_PT.trade;
  if (!t) return;
  const why = netTradeCheck();
  if (why) { t.msg = why; return; }
  if (!t.mine.items.length && !t.mine.gil && !t.theirs.items.length && !t.theirs.gil) { t.msg = "Nothing to trade yet."; return; }
  t.myOk = true; t.msg = "";
  const h = netTradeMyHash();
  netWorldSend("tcf", { to: netLc(t.name), from: save.name, h });
  if (t.theirOk === h) netTradeFinish();
}

function netOnTcf(p) {
  const t = NET_PT.trade;
  if (!p || !t || p.to !== netLc(save.name) || netLc(p.from) !== netLc(t.name)) return;
  t.theirOk = String(p.h || "");
  if (t.myOk && t.theirOk === netTradeMyHash()) netTradeFinish();
}

function netTradeFail(why) {
  const t = NET_PT.trade;
  NET.saveLock = false;
  if (t) netWorldSend("tcx", { to: netLc(t.name), from: save.name, why });
  NET_PT.trade = null;
  log("Trade cancelled: " + why, "sys");
  if (S.modal === "trade" && typeof closeModal === "function") closeModal();
}

function netTradeApply(t, d) {
  const inv = (Array.isArray(d.inventory) ? d.inventory : []).filter(x => x && ITEMS[x.id] && +x.qty > 0).map(x => Object.assign({}, x, { qty: Math.floor(+x.qty) }));
  save.inventory = inv;
  save.gil = Math.max(0, Math.floor(+d.gil || 0));
  NET.saveLock = false;
  t.done = true;
  const got = t.theirs.items.map(s => (s.qty > 1 ? s.qty + " " : "") + ITEMS[s.id].name).concat(t.theirs.gil ? [t.theirs.gil + " crystals"] : []);
  log("Trade with " + t.name + " complete." + (got.length ? " You receive " + got.join(", ") + "." : ""), "loot");
  save.stats.trades = (save.stats.trades || 0) + 1;
  if (typeof sfx === "function") sfx("loot");
  if (NET_PT.trade === t) NET_PT.trade = null;
  saveGame();
  netFlush();
  if (S.modal === "trade" && typeof closeModal === "function") closeModal();
}

async function netTradeFinish() {
  const t = NET_PT.trade;
  if (!t || t.done || t.busy) return;
  const why = netTradeCheck();
  if (why) { netTradeFail(why); return; }
  t.busy = true; t.msg = "Sending the trade to the server…";
  saveGame();
  const ok = await netFlushNow();
  if (NET_PT.trade !== t) return;
  if (!ok) { t.busy = false; netTradeFail("can't reach the game server"); return; }
  NET.saveLock = true;
  const mine = { items: t.mine.items.map(s => ({ id: s.id, qty: s.qty, st: ITEMS[s.id].stack || 1 })), gil: t.mine.gil };
  const theirs = { items: t.theirs.items.map(s => ({ id: s.id, qty: s.qty })), gil: t.theirs.gil };
  let res;
  try {
    const { data, error } = await NET.sb.rpc("trade_offer", { my_char: S.charId, peer_char: t.id, mine, theirs });
    if (error) throw error;
    res = data;
  } catch (e) {
    NET.saveLock = false;
    const m = String((e && (e.message || e.code)) || e);
    if (/PGRST202|trade_offer|schema cache|does not exist/i.test(m + (e && e.code))) { t.busy = false; NET_PT.legacyTrade = true; netTradeLocal(); return; }
    netTradeFail(netErr(e));
    return;
  }
  if (res && res.status === "done") { netTradeApply(t, res); return; }
  if (res && res.status === "mismatch") { netTradeFail("the offers didn't match"); try { await NET.sb.rpc("trade_cancel", { my_char: S.charId }); } catch (e) {} return; }
  t.msg = "Waiting for " + t.name + "…";
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1200));
    if (t.done || NET_PT.trade !== t) return;
    try {
      const { data } = await NET.sb.rpc("trade_status", { my_char: S.charId });
      if (data && data.status === "done") { netTradeApply(t, data); return; }
      if (data && data.status === "none") break;
    } catch (e) {}
  }
  if (NET_PT.trade !== t) return;
  try {
    const { data } = await NET.sb.rpc("trade_cancel", { my_char: S.charId });
    if (data && data.status === "done") { netTradeApply(t, data); return; }
  } catch (e) {}
  netTradeFail("the other player didn't finish the trade");
}

function netTradeLocal() {
  const t = NET_PT.trade;
  if (!t || t.done) return;
  const why = netTradeCheck();
  if (why) { t.msg = why; t.myOk = false; netWorldSend("tcx", { to: netLc(t.name), from: save.name, why }); NET_PT.trade = null; log("Trade cancelled: " + why, "sys"); if (S.modal === "trade" && typeof closeModal === "function") closeModal(); return; }
  t.done = true;
  for (const s of t.mine.items) removeItem(s.id, s.qty);
  save.gil -= t.mine.gil;
  for (const s of t.theirs.items) giveItem(s.id, s.qty, true);
  save.gil += t.theirs.gil;
  const got = t.theirs.items.map(s => (s.qty > 1 ? s.qty + " " : "") + ITEMS[s.id].name).concat(t.theirs.gil ? [t.theirs.gil + " crystals"] : []);
  log("Trade with " + t.name + " complete." + (got.length ? " You receive " + got.join(", ") + "." : ""), "loot");
  save.stats.trades = (save.stats.trades || 0) + 1;
  if (typeof sfx === "function") sfx("loot");
  NET_PT.trade = null;
  saveGame();
  if (typeof netFlush === "function") netFlush();
  if (S.modal === "trade" && typeof closeModal === "function") closeModal();
}

function netTradeCancel(quiet) {
  const t = NET_PT.trade;
  if (!t) return;
  if (t.busy) { if (!quiet) log("The trade is being finished on the server. One moment…", "sys"); return; }
  NET_PT.trade = null;
  netWorldSend("tcx", { to: netLc(t.name), from: save.name });
  if (!quiet) log("You cancel the trade.", "sys");
  if (S.modal === "trade" && typeof closeModal === "function") closeModal();
}

function netOnTcx(p) {
  const t = NET_PT.trade;
  if (!p || !t || p.to !== netLc(save.name) || netLc(p.from) !== netLc(t.name)) return;
  if (t.busy) { NET.sb.rpc("trade_cancel", { my_char: S.charId }).then(({ data }) => { if (data && data.status === "done") netTradeApply(t, data); else { NET.saveLock = false; } }, () => { NET.saveLock = false; }); if (!t.done) { NET_PT.trade = null; log(t.name + " cancels the trade." + (p.why ? " (" + cleanChat(p.why) + ")" : ""), "sys"); if (S.modal === "trade" && typeof closeModal === "function") closeModal(); } return; }
  NET_PT.trade = null;
  log(t.name + " cancels the trade." + (p.why ? " (" + cleanChat(p.why) + ")" : ""), "sys");
  if (S.modal === "trade" && typeof closeModal === "function") closeModal();
}

function netPartySig() {
  return [NET_PT.id, netPartyList().map(m => m.id + m.job + m.lv + m.zone + Math.round(10 * m.hp / m.maxHp)).join(), NET_PT.trade ? JSON.stringify([NET_PT.trade.mine, NET_PT.trade.theirs, NET_PT.trade.myOk, NET_PT.trade.theirOk, NET_PT.trade.msg]) : ""].join("|");
}

const NET_SH = { on: false, host: true, pending: true, hostId: null, joinT: 0, seq: 0, map: new Map(), sigs: new Map(), lastSnap: 0, lastFull: 0, lastFlush: 0, lastWant: 0, wants: new Map(), enQ: new Map() };

function netShareOn() { return NET_SH.on; }
function netMobsLocal() { return !NET_SH.on || NET_SH.host; }
function netWanted(id) { const t = NET_SH.wants.get(id); return !!t && t > Date.now(); }
function netShareable() { return !!S.zone && !S.zone.battlefield && !S.bf; }
function netZoneSend(event, payload) {
  if (!NET_RT.zch) return;
  NET_RT.sent = (NET_RT.sent || 0) + 1;
  Promise.resolve(NET_RT.zch.send({ type: "broadcast", event, payload })).catch(() => {});
}
function netHostName() {
  if (!NET_SH.on) return save.name;
  if (NET_SH.host) return save.name;
  const o = S.others && S.others.get(NET_SH.hostId);
  return o ? o.name : "?";
}

function netShReset() {
  NET_SH.on = false; NET_SH.host = true; NET_SH.pending = true; NET_SH.hostId = S.charId; NET_SH.joinT = Date.now();
  NET_SH.map = new Map(); NET_SH.sigs = new Map(); NET_SH.enQ = new Map(); NET_SH.lastFull = 0; NET_SH.wants = new Map();
}

function netElect(state) {
  const metas = [];
  for (const k in state) { const m = state[k] && state[k][0]; if (m && m.id) metas.push(m); }
  if (!metas.some(m => m.id === S.charId)) return;
  const peers = metas.filter(m => m.v === GAME_VERSION && m.zone === S.zoneId);
  const was = { on: NET_SH.on, host: NET_SH.host };
  const on = netShareable() && peers.length > 1;
  let hostId = S.charId;
  if (on) {
    const awake = peers.filter(m => !m.away);
    const claim = awake.filter(m => m.h);
    const pool = claim.length ? claim : awake.length ? awake : peers;
    hostId = pool.slice().sort((a, b) => (a.t || 0) - (b.t || 0) || (a.id < b.id ? -1 : 1))[0].id;
  }
  const host = hostId === S.charId;
  NET_SH.on = on; NET_SH.host = host; NET_SH.hostId = hostId; NET_SH.pending = false;
  if (!on) { if (was.on && !was.host) netPromote(); }
  else if (host) { if (was.on && !was.host) netPromote(); NET_SH.lastFull = 0; }
  else if (was.host || !was.on) netDemote();
  if (was.on !== on || was.host !== host) { NET_RT.lastSig = ""; if (on && was.on !== on) log(host ? "Other adventurers are here. Monsters in this area are now shared." : "Monsters in this area are shared with other adventurers.", "sys"); }
}

function netPromote() {
  for (const m of S.mobs) {
    if (!m.proxy) continue;
    m.proxy = false;
    if (!m.alive) continue;
    if (m.tx != null) { m.x = m.tx; m.y = m.ty; }
    const sp = m.spawnIdx != null ? S.zone.spawns[m.spawnIdx] : null;
    m.home = sp ? { x: sp.x, y: sp.y } : { x: m.x, y: m.y };
    m.enmity = new Map();
    if (m.target && m.target.alive) m.enmity.set(m.target, 10);
    if (m.state === "combat" && !m.enmity.size) m.state = "return";
    m.aggro = m.passive ? null : m.fam.aggro;
    m.swingTimer = m.delay; m.readying = null;
    for (const k in m.buffs) { const b = m.buffs[k]; if (b.host) b.src = null; delete b.host; if (b.next == null) b.next = S.time + 3; }
  }
  S.spawnAt = [];
  S.zone.spawns.forEach((sp, i) => { if (!S.mobs.some(m => m.alive && m.spawnIdx === i)) S.spawnAt[i] = S.time + rand(4, 25); });
  NET_SH.map = new Map(); NET_SH.sigs = new Map(); NET_SH.lastFull = 0;
}

function netDemote() {
  S.mobs = []; S.spawnAt = [];
  NET_SH.map = new Map(); NET_SH.enQ = new Map();
  for (const p of S.party) if (isMob(p.attackTarget)) { p.attackTarget = null; p.engaged = false; }
  if (isMob(player.target)) player.target = null;
  S.chase = false;
  netZoneSend("req", { id: S.charId });
  NET_SH.lastWant = 0;
}

function netShTick() {
  if (!NET_SH.on || !NET_RT.zch || !player) return;
  const now = Date.now();
  if (NET_SH.host) { netSnap(now); return; }
  if (now - NET_SH.lastFlush >= 250) {
    NET_SH.lastFlush = now;
    for (const [nid, en] of NET_SH.enQ) netZoneSend("hit", { id: S.charId, nid, d: 0, en: Math.round(en) });
    NET_SH.enQ = new Map();
    for (const m of NET_SH.map.values()) {
      if (!m.alive) continue;
      for (const k in m.buffs) {
        const b = m.buffs[k];
        if (b.host || m.sentBuff[k]) continue;
        m.sentBuff[k] = S.time;
        netZoneSend("deb", { id: S.charId, nid: m.nid, k, dur: Math.round(clamp(b.until - S.time, 1, 600)), tick: b.tick || 0, el: b.el || null, pow: b.pow || 0 });
      }
    }
  }
  if (now - NET_SH.lastWant > 20000) {
    NET_SH.lastWant = now;
    const ids = S.zone.spawns.flatMap(sp => [sp].concat(sp.alts || [])).filter(o => o.nm && storyWants(o.nm.id)).map(o => o.nm.id);
    if (ids.length) netZoneSend("want", { id: S.charId, ids });
  }
}

function netNid(m) { if (!m.nid) m.nid = (S.charId || "x").slice(0, 4) + (++NET_SH.seq).toString(36); return m.nid; }

function netSnap(now) {
  if (now - NET_SH.lastSnap < 160) return;
  NET_SH.lastSnap = now;
  const full = now - NET_SH.lastFull > 2000;
  if (full) NET_SH.lastFull = now;
  const out = [];
  for (const m of S.mobs) {
    if (m.proxy) continue;
    const nid = netNid(m);
    if (m.lastSwing !== m._lsw) { m._lsw = m.lastSwing; m._swc = (m._swc || 0) + 1; }
    if (m.lastWS !== m._lws) { m._lws = m.lastWS; m._wsc = (m._wsc || 0) + 1; }
    const t = m.target, tgt = !t ? "" : t === player ? S.charId : t.kind === "remote" ? t.id : "";
    const fl = (m.alive ? 0 : 1) | (m.readying ? 2 : 0) | (m.passive ? 4 : 0);
    const bf = Object.keys(m.buffs).map(k => k + ":" + Math.max(1, Math.ceil(m.buffs[k].until - S.time))).join(",");
    const row = [nid, m.famKey, m.lv, Math.round(m.x), Math.round(m.y), +m.face.toFixed(2), Math.ceil(m.hp), m.maxHp, m.state === "combat" ? 1 : m.state === "return" ? 2 : 0, tgt, fl, m.spawnIdx != null ? m.spawnIdx : -1, m._swc || 0, m._wsc || 0, Math.floor(m.tp), bf, m.claim === "me" ? S.charId : m.claim || "", netEncChain(m.chain), netEncBurst(m.burst)];
    const sig = row.slice(3).join("|");
    if (!full && NET_SH.sigs.get(nid) === sig) continue;
    NET_SH.sigs.set(nid, sig);
    out.push(row);
  }
  if (full) { const live = new Set(S.mobs.map(m => m.nid)); for (const k of [...NET_SH.sigs.keys()]) if (!live.has(k)) NET_SH.sigs.delete(k); }
  if (out.length || full) netZoneSend("ms", { id: S.charId, f: full ? 1 : 0, m: out });
}

function netOnMs(p) {
  NET_RT.recv = (NET_RT.recv || 0) + 1;
  if (!p || !NET_SH.on || NET_SH.host || p.id !== NET_SH.hostId || !Array.isArray(p.m)) return;
  const seen = new Set();
  for (const r of p.m) {
    if (!Array.isArray(r) || r.length < 16) continue;
    const [nid, fk, lv, x, y, f, hp, maxHp, st, tgt, fl, si, swc, wsc, tp, bf, claim, ch, bu] = r;
    if (!famOf(fk)) continue;
    seen.add(nid);
    let m = NET_SH.map.get(nid);
    const dead = fl & 1;
    if (!m) {
      if (dead) continue;
      m = buildMob(fk, clamp(+lv || 1, 1, 99), +x, +y, si >= 0 ? si : null);
      m.proxy = true; m.nid = nid; m.aggro = null; m.sentBuff = {};
      m.face = +f || 0; m._swc = swc; m._wsc = wsc;
      S.mobs.push(m); NET_SH.map.set(nid, m);
      m.hostHp = +hp;
      if (m.fam.nm && dist(m, player) < 900) { log("You sense a powerful presence nearby...", "foe"); sfx("notify"); }
    }
    if (+hp < m.hostHp && S.time >= (m.predUntil || 0) && m.alive) popText(m, m.hostHp - +hp, "#b3d9ff", 14);
    m.hostHp = +hp;
    m.claim = claim || null;
    if (S.time >= (m.scLocalUntil || 0)) { m.chain = netDecChain(ch); m.burst = netDecBurst(bu); }
    m.tx = +x; m.ty = +y; m.tf = +f || 0;
    m.maxHp = Math.max(1, +maxHp || 1);
    m.hp = S.time < (m.predUntil || 0) ? Math.min(+hp, m.predHp) : clamp(+hp, 0, m.maxHp);
    m.state = st === 1 ? "combat" : st === 2 ? "return" : "idle";
    m.passive = !!(fl & 4);
    m.tp = +tp || 0;
    const te = tgt ? (tgt === S.charId ? player : S.others && S.others.get(tgt)) : null;
    m.target = te || null;
    if (te === player) { if (!m.enmity.has(player)) m.enmity = new Map([[player, 1]]); } else if (m.enmity.size) m.enmity = new Map();
    if (fl & 2) {
      if (!m.readying && m.alive && m.fam.tpMove) { m.readying = { t: 1, target: te, start: S.time }; if (dist(m, player) < 900) { log("The " + m.name + " readies " + m.fam.tpMove.name + ".", "foe"); popText(m, m.fam.tpMove.name, "#ff8a65", 13, 1.2, 14); sfx("tpready", m); } }
    } else m.readying = null;
    if (swc !== m._swc) { m._swc = swc; m.lastSwing = S.time; }
    if (wsc !== m._wsc) { m._wsc = wsc; m.lastWS = S.time; }
    const hb = {};
    for (const part of String(bf || "").split(",")) { const [k, sec] = part.split(":"); if (k && /^[a-z_]{2,16}$/.test(k)) hb[k] = clamp(+sec || 1, 1, 3600); }
    for (const k in hb) { if (m.buffs[k]) { m.buffs[k].host = true; m.buffs[k].until = S.time + hb[k]; } else m.buffs[k] = { until: S.time + hb[k], host: true }; }
    for (const k in m.buffs) if (!hb[k] && (m.buffs[k].host || (m.sentBuff[k] != null && S.time - m.sentBuff[k] > 2))) { delete m.buffs[k]; delete m.sentBuff[k]; }
    if (dead && m.alive) netProxyKO(m, false);
  }
  if (p.f) for (const [nid, m] of [...NET_SH.map]) if (!seen.has(nid)) { if (m.alive) { m.alive = false; m.despawned = true; m.deadAt = S.time; } NET_SH.map.delete(nid); }
}

function netProxyStep(m, dt) {
  if (m.chain && S.time > m.chain.closeAt) m.chain = null;
  if (m.burst && S.time > m.burst.until) m.burst = null;
  if (m.tx == null) return;
  const d = Math.hypot(m.tx - m.x, m.ty - m.y);
  if (d > 400) { m.x = m.tx; m.y = m.ty; }
  else if (d > 0.5) { const k = Math.min(1, dt * 8); m.x += (m.tx - m.x) * k; m.y += (m.ty - m.y) * k; }
  m.face += normAng(m.tf - m.face) * Math.min(1, dt * 10);
}

function netMobHit(m, amt, en) {
  const base = S.time < (m.predUntil || 0) ? m.predHp : m.hp;
  m.predHp = Math.max(0, base - amt); m.predUntil = S.time + 0.9; m.hp = m.predHp;
  netZoneSend("hit", { id: S.charId, nid: m.nid, d: amt, en: Math.round(en) });
}

function netMobEnmity(m, en) { NET_SH.enQ.set(m.nid, (NET_SH.enQ.get(m.nid) || 0) + en); }

function netHostMob(nid) { return S.mobs.find(x => x.nid === nid && x.alive && !x.proxy); }

function netOnHit(p) {
  if (!p || !NET_SH.on || !NET_SH.host) return;
  const m = netHostMob(p.nid), src = S.others && S.others.get(p.id);
  if (!m || !src || !src.alive) return;
  if (!claimOk(m, src)) return;
  const d = clamp(Math.round(+p.d || 0), 0, 99999), en = clamp(+p.en || 0, 0, 100000);
  if (d > 0) applyDamage(src, m, d, { enmity: en, color: "#b3d9ff", size: 15 });
  else { addEnmity(m, src, en); aggro(m, src); }
}

function netOnDeb(p) {
  if (!p || !NET_SH.on || !NET_SH.host || !/^[a-z_]{2,16}$/.test(String(p.k))) return;
  const m = netHostMob(p.nid), src = S.others && S.others.get(p.id);
  if (!m || !src || !src.alive || !claimOk(m, src)) return;
  m.buffs[p.k] = { until: S.time + clamp(+p.dur || 1, 1, 600), src, next: S.time + 3, tick: clamp(+p.tick || 0, 0, 500), el: ELEMENT_COLORS[p.el] ? p.el : undefined, pow: clamp(+p.pow || 0, 0, 5) };
  addEnmity(m, src, 30);
  aggro(m, src);
}

function netMobAttack(m, t, k) {
  if (!NET_SH.on || !NET_SH.host || m.proxy || !t || t.kind !== "remote") return;
  netZoneSend("mat", { id: S.charId, nid: netNid(m), to: t.id, k });
}

function netOnMat(p) {
  if (!p || p.to !== S.charId || !NET_SH.on || NET_SH.host || p.id !== NET_SH.hostId || !player.alive) return;
  const m = NET_SH.map.get(p.nid);
  if (!m || !m.alive) return;
  m.face = Math.atan2(player.y - m.y, player.x - m.x);
  if (p.k === "sw") swing(m, player);
  else if (p.k === "tp" && m.fam.tpMove) { m.readying = { t: 0, target: player, start: S.time }; execTpMove(m); }
}

function netMobDied(e) {
  if (!NET_SH.on || !NET_SH.host || e.proxy) return;
  netZoneSend("die", { id: S.charId, nid: netNid(e), claim: e.claim || S.charId });
}

function netOnDie(p) {
  if (!p || !NET_SH.on || NET_SH.host || p.id !== NET_SH.hostId) return;
  const m = NET_SH.map.get(p.nid);
  if (m) netProxyKO(m, p.claim === S.charId);
}

function netProxyKO(m, reward) {
  if (m.alive) {
    m.alive = false; m.hp = 0; m.deadAt = S.time; m.readying = null; m.casting = null;
    const near = dist(m, player) < 900;
    if (near || reward) { log("The " + m.name + " is defeated.", "you"); sfx("defeat", m); vfx("defeat", { tgt: m }); }
    for (const p of S.party) if (p.attackTarget === m) { p.attackTarget = null; p.engaged = false; }
    if (S.chase && player.attackTarget == null) S.chase = false;
  }
  if (reward && !m.rewarded) { m.rewarded = true; killRewards(m); }
}

function netOnReq(p) {
  if (!p || !NET_SH.on || !NET_SH.host) return;
  NET_SH.lastFull = 0;
}

function netOnWant(p) {
  if (!p || !NET_SH.on || !NET_SH.host || !Array.isArray(p.ids)) return;
  for (const id of p.ids.slice(0, 8)) if (NM_FAMILIES[id] || FAMILIES[id]) NET_SH.wants.set(id, Date.now() + 60000);
}

function netEncChain(c) { return c && S.time <= c.closeAt ? [c.props.join("/"), c.lv, c.name, +(c.openAt - S.time).toFixed(1), +(c.closeAt - S.time).toFixed(1)] : 0; }
function netEncBurst(b) { return b && S.time <= b.until ? [b.el.join("/"), b.lv, b.name, +(b.until - S.time).toFixed(1)] : 0; }
function netDecChain(a) {
  if (!Array.isArray(a) || a.length < 5) return null;
  const props = String(a[0]).split("/").filter(x => SC_PROPS[x] || SC_TABLE.some(r => r[0] === x || r[1] === x));
  if (!props.length) return null;
  return { props, lv: clamp(+a[1] || 0, 0, 4), name: String(a[2]).slice(0, 24), openAt: S.time + clamp(+a[3] || 0, -10, 10), closeAt: S.time + clamp(+a[4] || 0, 0, 15), by: null };
}
function netDecBurst(a) {
  if (!Array.isArray(a) || a.length < 4) return null;
  const el = String(a[0]).split("/").filter(x => ELEMENT_COLORS[x]);
  if (!el.length) return null;
  return { el, lv: clamp(+a[1] || 1, 1, 4), name: String(a[2]).slice(0, 24), until: S.time + clamp(+a[3] || 0, 0, 15) };
}

function netChainOut(m) {
  if (!m.proxy || !NET_SH.on) return;
  m.scLocalUntil = S.time + 1.5;
  netZoneSend("sc", { id: S.charId, nid: m.nid, c: netEncChain(m.chain), b: netEncBurst(m.burst) });
}

function netOnSc(p) {
  if (!p || !NET_SH.on || !NET_SH.host) return;
  const m = netHostMob(p.nid), src = S.others && S.others.get(p.id);
  if (!m || !src || !claimOk(m, src)) return;
  const c = netDecChain(p.c), b = netDecBurst(p.b);
  if (c) m.chain = c;
  if (b) m.burst = b;
  if (b && c && c.lv > 0) { popText(m, "Skillchain: " + c.name, ELEMENT_COLORS[b.el[0]], 18, 1.8, 38); sfx("skillchain", m); vfx("skillchain", { tgt: m, name: c.name, el: b.el, lv: c.lv }); }
}

function netAssist(name) {
  const o = [...(S.others || new Map()).values()].find(x => netLc(x.name) === netLc(cleanChat(name)));
  if (!o) { log(cleanChat(name) + " isn't in this area.", "sys"); return; }
  const m = o.tgNid && S.mobs.find(x => x.nid === o.tgNid && x.alive);
  if (!m) { log(o.name + " has no target.", "sys"); return; }
  setTarget(m);
  if (typeof sfx === "function") sfx("select");
  log("You assist " + o.name + ": " + m.name + ".", "sys");
}

function netAhErr(e) {
  const m = String((e && (e.message || e.code)) || e || "");
  if (/PGRST202|PGRST205|Could not find|does not exist|schema cache/i.test(m + " " + ((e && e.code) || ""))) return "The player market isn't set up on the game server yet. The admin needs to run the latest setup SQL (Settings → Admin).";
  return netErr(e).replace(/ in the bag$/, "");
}

function netApplyServerBag(d) {
  if (!d) return;
  if (Array.isArray(d.inventory)) save.inventory = d.inventory.filter(x => x && ITEMS[x.id] && +x.qty > 0).map(x => Object.assign({}, x, { qty: Math.floor(+x.qty) }));
  if (d.gil != null) save.gil = Math.max(0, Math.floor(+d.gil || 0));
}

async function netServerOp(fn, args) {
  if (!NET.member || !NET.sb) throw new Error("This needs the game server.");
  saveGame();
  const ok = await netFlushNow();
  if (!ok) throw new Error("Can't reach the game server. Try again in a moment.");
  NET.saveLock = true;
  try {
    const { data, error } = await NET.sb.rpc(fn, Object.assign({ my_char: S.charId }, args));
    if (error) throw error;
    netApplyServerBag(data);
    return data;
  } finally {
    NET.saveLock = false;
    saveGame();
    netFlush();
  }
}

async function netAhList() {
  const { data, error } = await NET.sb.from("ah_listings").select("id,seller,seller_name,item,qty,price,expires_at").eq("status", "open").gt("expires_at", new Date().toISOString()).order("price", { ascending: true }).limit(400);
  if (error) throw error;
  return (data || []).filter(l => ITEMS[l.item] && ahTradable(l.item));
}

async function netAhMine() {
  const { data, error } = await NET.sb.from("ah_listings").select("id,item,qty,price,expires_at,status").eq("seller", S.charId).eq("status", "open").order("id", { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

async function netAhBox() {
  const { data, error } = await NET.sb.rpc("ah_box_list", { my_char: S.charId });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function netAhHistory(item) {
  const { data, error } = await NET.sb.rpc("ah_history", { item });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function netAhPost(id, qty, price) {
  if (!ahTradable(id)) throw new Error("You can't sell that at auction.");
  if (invCount(id) < qty) throw new Error("You don't have that many.");
  const d = await netServerOp("ah_post", { item: id, qty, price, st: ITEMS[id].stack || 1 });
  log("You offer " + (qty > 1 ? qty + " " + ITEMS[id].name + "s" : an(ITEMS[id].name)) + " to other players for " + price + " crystals (fee " + d.fee + ").", "sys");
  sfx("coin");
  return d;
}

async function netAhBuy(lot) {
  const d = await netServerOp("ah_buy", { lot });
  log("You buy " + (d.qty > 1 ? d.qty + " " + ITEMS[d.item].name + "s" : an(ITEMS[d.item].name)) + " from another player for " + d.price + " crystals.", "loot");
  sfx("coin");
  save.stats.ahBought = (save.stats.ahBought || 0) + d.qty;
  const c = await netServerOp("ah_collect", {});
  return c;
}

async function netAhCancel(lot) {
  const { error } = await NET.sb.rpc("ah_cancel", { my_char: S.charId, lot });
  if (error) throw error;
  log("You withdraw your lot. It goes to your delivery box.", "sys");
  return netAhCollect();
}

async function netAhCollect() {
  const d = await netServerOp("ah_collect", {});
  if (d.got) { log("You collect " + d.got + " deliver" + (d.got > 1 ? "ies" : "y") + " from the auction house.", "loot"); sfx("loot"); }
  if (d.left) log("Your bag is full; " + d.left + " deliver" + (d.left > 1 ? "ies are" : "y is") + " still waiting.", "sys");
  return d;
}

async function netAhWatch() {
  if (!NET.member || !S.charId || typeof player === "undefined" || !player) return;
  try {
    const box = await netAhBox();
    NET.ahSeen = NET.ahSeen || new Set();
    const first = !NET.ahWatched;
    NET.ahWatched = true;
    for (const b of box) {
      if (NET.ahSeen.has(b.id)) continue;
      NET.ahSeen.add(b.id);
      if (first || b.kind !== "sold" || !ITEMS[b.item]) continue;
      log("Auction: " + cleanChat(b.note).slice(0, 12) + " bought your " + (b.qty > 1 ? b.qty + " " + ITEMS[b.item].name + "s" : ITEMS[b.item].name) + " for " + b.gil + " crystals. Collect it at an auction house.", "loot");
      if (typeof uiEvent === "function") uiEvent("ahsold", { id: b.item, price: b.gil });
      sfx("coin");
    }
    NET.ahBoxN = box.length;
  } catch (e) {}
}

const NET_LS = { list: [], chans: new Map(), loading: false, err: "", at: 0 };

function netWorldMeta() {
  const ls = NET_LS.list.find(l => l.id === save.lsActive);
  return { name: save.name, zone: S.zoneId, lv: player ? player.lv : 1, job: player ? player.job : "", sub: player ? player.sub || null : null, lfg: save.lfg ? 1 : 0, cmt: save.lfg ? save.seekMsg || "" : "", ls: ls ? ls.name : "" };
}

function netBlocked(name) { return !!name && (save.blocked || []).some(b => netLc(b) === netLc(name)); }

function netFriendWatch() {
  const now = new Set(NET_RT.online.map(o => netLc(o && o.name)));
  const prev = NET_RT.friendSeen;
  NET_RT.friendSeen = now;
  if (!prev) return;
  for (const f of save.friends || []) {
    const k = netLc(f);
    if (now.has(k) && !prev.has(k)) { log("Friend: " + f + " has come online.", "tell"); if (typeof sfx === "function") sfx("notify"); }
    else if (!now.has(k) && prev.has(k)) log("Friend: " + f + " has gone offline.", "sys");
  }
}

function netFriend(cmd, name) {
  name = cleanChat(name).slice(0, 12);
  save.friends = save.friends || [];
  if (cmd === "list" || !name) {
    if (!save.friends.length) { log("Your friend list is empty. Add someone with /friend add Name.", "sys"); return; }
    log("Friends: " + save.friends.map(f => { const o = netOnline(f); return f + (o ? " (online, " + (ZONES[o.zone] ? ZONES[o.zone].name : "?") + ")" : ""); }).join(", "), "sys");
    return;
  }
  const i = save.friends.findIndex(f => netLc(f) === netLc(name));
  if (cmd === "add") {
    if (netLc(name) === netLc(save.name)) { log("You can't add yourself.", "sys"); return; }
    if (i >= 0) { log(name + " is already on your friend list.", "sys"); return; }
    if (save.friends.length >= 50) { log("Your friend list is full (50).", "sys"); return; }
    const o = netOnline(name);
    save.friends.push(o ? o.name : name.charAt(0).toUpperCase() + name.slice(1));
    log(save.friends[save.friends.length - 1] + " is now on your friend list.", "sys");
  } else if (cmd === "remove" || cmd === "del") {
    if (i < 0) { log(name + " isn't on your friend list.", "sys"); return; }
    log(save.friends[i] + " is removed from your friend list.", "sys");
    save.friends.splice(i, 1);
  } else { log("Usage: /friend add|remove|list Name", "sys"); return; }
  saveGame();
}

function netBlock(cmd, name) {
  name = cleanChat(name).slice(0, 12);
  save.blocked = save.blocked || [];
  if (cmd === "list" || !name) { log(save.blocked.length ? "Blacklist: " + save.blocked.join(", ") : "Your blacklist is empty.", "sys"); return; }
  const i = save.blocked.findIndex(f => netLc(f) === netLc(name));
  if (cmd === "add") {
    if (i >= 0 || netLc(name) === netLc(save.name)) return;
    if (save.blocked.length >= 50) { log("Your blacklist is full (50).", "sys"); return; }
    save.blocked.push(name);
    log("You will no longer see messages, invitations or trade requests from " + name + ".", "sys");
  } else if (cmd === "remove" || cmd === "del") {
    if (i < 0) { log(name + " isn't on your blacklist.", "sys"); return; }
    save.blocked.splice(i, 1);
    log(name + " is removed from your blacklist.", "sys");
  } else { log("Usage: /blacklist add|remove|list Name", "sys"); return; }
  saveGame();
}

function netSeek(on, msg) {
  save.lfg = !!on;
  if (msg != null) save.seekMsg = cleanChat(msg).slice(0, 40);
  log(save.lfg ? "You are now looking for a party" + (save.seekMsg ? " (\"" + save.seekMsg + "\")" : "") + ". Others see 🔎 by your name in /search." : "You are no longer looking for a party.", "sys");
  saveGame();
  netTrack();
}

function netSearch(arg) {
  const words = String(arg || "").toLowerCase().split(/\s+/).filter(Boolean);
  let list = NET_RT.online.filter(o => o && o.name);
  for (const w of words) {
    const rng = w.match(/^(\d+)-(\d+)$/);
    if (rng) list = list.filter(o => o.lv >= +rng[1] && o.lv <= +rng[2]);
    else if (/^\d+$/.test(w)) list = list.filter(o => o.lv === +w);
    else if (w === "lfg" || w === "seek") list = list.filter(o => o.lfg);
    else if (w === "here") list = list.filter(o => o.zone === S.zoneId);
    else if (JOBS[w.toUpperCase()]) list = list.filter(o => o.job === w.toUpperCase());
    else list = list.filter(o => netLc(o.name).includes(w) || (ZONES[o.zone] && netLc(ZONES[o.zone].name).includes(w)) || netLc(o.ls).includes(w));
  }
  return list;
}

function netSearchLog(arg) {
  const list = netSearch(arg);
  if (!list.length) { log("No adventurers match" + (arg ? " \"" + arg + "\"" : "") + ".", "sys"); return; }
  log(list.length + " found: " + list.slice(0, 20).map(o => (o.lfg ? "🔎" : "") + o.name + " " + (JOBS[o.job] ? o.job : "?") + o.lv + (o.sub ? "/" + o.sub : "") + " · " + (ZONES[o.zone] ? ZONES[o.zone].name : "?") + (o.cmt ? " · \"" + cleanChat(o.cmt) + "\"" : "")).join(" | "), "sys");
}

function netLsUnsub() {
  for (const ch of NET_LS.chans.values()) { try { NET.sb.removeChannel(ch); } catch (e) {} }
  NET_LS.chans = new Map();
}

function netLsSet(list) {
  NET_LS.list = (Array.isArray(list) ? list : []).filter(l => l && l.id);
  NET_LS.at = Date.now(); NET_LS.err = "";
  if (!NET_LS.list.some(l => l.id === save.lsActive)) save.lsActive = NET_LS.list[0] ? NET_LS.list[0].id : null;
  const want = new Set(NET_LS.list.map(l => l.id));
  for (const [id, ch] of [...NET_LS.chans]) if (!want.has(id)) { try { NET.sb.removeChannel(ch); } catch (e) {} NET_LS.chans.delete(id); }
  for (const l of NET_LS.list) {
    if (NET_LS.chans.has(l.id)) continue;
    try {
      const ch = NET.sb.channel("ls:" + l.id, { config: { broadcast: { self: false } } });
      ch.on("broadcast", { event: "lsc" }, m => netOnLsChat(l.id, m.payload));
      ch.on("broadcast", { event: "lsx" }, () => netLsRefresh());
      ch.subscribe();
      NET_LS.chans.set(l.id, ch);
    } catch (e) {}
  }
  netTrack();
  if (typeof S !== "undefined" && S.modal === "social" && typeof renderModal === "function") renderModal();
}

async function netLsRefresh() {
  if (!NET.member || !S.charId || NET_LS.loading) return;
  NET_LS.loading = true;
  try {
    const { data, error } = await NET.sb.rpc("ls_mine", { my_char: S.charId });
    if (error) throw error;
    netLsSet(data);
  } catch (e) { NET_LS.err = netAhErr(e); NET_LS.at = Date.now(); }
  NET_LS.loading = false;
}

function netLsOf(idx) {
  if (idx != null) return NET_LS.list[idx] || null;
  return NET_LS.list.find(l => l.id === save.lsActive) || NET_LS.list[0] || null;
}

function netLsChat(text, idx) {
  text = cleanChat(text);
  const l = netLsOf(idx);
  if (!l) { log("You aren't in a linkshell. Make or join one in the Social window.", "sys"); return; }
  if (!text) return;
  if (Date.now() - NET_RT.lastChat < 700) { log("You're talking too fast.", "sys"); return; }
  NET_RT.lastChat = Date.now();
  log("[" + l.name + "] <" + save.name + "> " + text, "ls");
  const ch = NET_LS.chans.get(l.id);
  if (ch) Promise.resolve(ch.send({ type: "broadcast", event: "lsc", payload: { id: S.charId, name: save.name, text } })).catch(() => {});
}

function netOnLsChat(lsid, p) {
  const l = NET_LS.list.find(x => x.id === lsid);
  if (!l || !p) return;
  const name = cleanChat(p.name).slice(0, 12), text = cleanChat(p.text);
  if (!text || netBlocked(name) || !l.members.some(m => netLc(m.name) === netLc(name))) return;
  log("[" + l.name + "] <" + name + "> " + text, "ls");
  if (typeof sfx === "function") sfx("tab");
}

function netLsPing(id) { const ch = NET_LS.chans.get(id); if (ch) Promise.resolve(ch.send({ type: "broadcast", event: "lsx", payload: {} })).catch(() => {}); }

async function netLsCall(fn, args) {
  const { data, error } = await NET.sb.rpc(fn, Object.assign({ my_char: S.charId }, args));
  if (error) throw error;
  return data;
}

async function netLsCreate(name, color) {
  name = String(name || "").trim().replace(/\s+/g, " ");
  if (!/^[A-Za-z][A-Za-z ]{1,14}[A-Za-z]$/.test(name)) throw new Error("Linkshell names are 3–16 letters (spaces allowed inside).");
  const d = await netServerOp("ls_create", { name, color: /^#[0-9a-fA-F]{6}$/.test(color || "") ? color : "#7fd3ff" });
  log("You create the linkshell " + name + " (500 crystals).", "ls");
  save.lsActive = d.id;
  await netLsRefresh();
  return d;
}

async function netLsInvite(lsid, target) {
  target = cleanChat(target).slice(0, 12);
  const d = await netLsCall("ls_invite", { ls: lsid, target });
  netWorldSend("lsinv", { to: netLc(d.name), from: save.name, ls: lsid, lsName: d.ls });
  log("You invite " + d.name + " to " + d.ls + ".", "ls");
  return d;
}

function netOnLsInv(p) {
  if (!p || p.to !== netLc(save.name)) return;
  const from = cleanChat(p.from).slice(0, 12), nm = cleanChat(p.lsName).slice(0, 16), id = String(p.ls || "");
  if (netBlocked(from) || !/^[0-9a-f-]{36}$/.test(id)) return;
  NET_LS.invite = { id, name: nm, from, until: Date.now() + 600000 };
  log(from + " invites you to the linkshell " + nm + ". Accept in the Social window or with /lsjoin.", "ls");
  if (typeof sfx === "function") sfx("notify");
  if (typeof gameConfirm === "function" && !(typeof UI !== "undefined" && UI.confirmOpen)) gameConfirm("Linkshell invitation", from + " invites you to join the linkshell " + nm + ".", () => netLsJoin().catch(e => log(netAhErr(e), "sys")), { yes: "Join", no: "Not now" });
}

async function netLsJoin() {
  const inv = NET_LS.invite;
  if (!inv || Date.now() > inv.until) { NET_LS.invite = null; throw new Error("You have no linkshell invitation."); }
  const d = await netLsCall("ls_join", { ls: inv.id });
  NET_LS.invite = null;
  save.lsActive = inv.id;
  netLsSet(d);
  netLsPing(inv.id);
  log("You join the linkshell " + inv.name + ". Talk with /l.", "ls");
  saveGame();
}

async function netLsLeave(lsid) {
  const l = NET_LS.list.find(x => x.id === lsid);
  const d = await netLsCall("ls_leave", { ls: lsid });
  netLsPing(lsid);
  netLsSet(d);
  log("You leave the linkshell " + (l ? l.name : "") + ".", "ls");
}

async function netLsSetRank(lsid, target, action) {
  const d = await netLsCall("ls_set", { ls: lsid, target, action });
  netLsSet(d);
  netLsPing(lsid);
}
