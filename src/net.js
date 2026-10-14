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
