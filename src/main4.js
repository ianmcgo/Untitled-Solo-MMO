function guardKeys(e) {
  if (!UI.started) return;
  if (/^(Digit|Numpad)[0-9]$/.test(e.code || "") && (e.ctrlKey || e.altKey || e.metaKey)) e.preventDefault();
}

function onKey(e) {
  const k = e.key.toLowerCase();
  if (UI.confirmOpen) { const cb = $("confirmBox"); if (k === "escape") cb.querySelector(".no").click(); else if (k === "arrowup" || k === "arrowdown") { cb.querySelectorAll(".cbA button").forEach(b => b.classList.toggle("sel")); } else if (k === "enter" || k === " ") (cb.querySelector(".cbA button.sel") || cb.querySelector(".yes")).click(); e.preventDefault(); return; }
  if (!UI.started) return;
  if ((e.ctrlKey || e.metaKey) && !/^(Digit|Numpad)[0-9]$/.test(e.code || "")) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.type !== "range") return;
  const menuKeys = { g: "equipment", i: "inventory", c: "character", k: "skills", b: "actions", j: "quests", m: "map", h: "help", n: "craft", p: "party", y: "database", o: "achievements" };
  if (S.dialog) {
    if (k === "escape") closeDialog();
    if (["arrowup", "arrowdown", "enter", " "].includes(k)) { e.preventDefault(); dlgKey(k); return; }
    const n = parseInt(k, 10);
    if (n >= 1 && n <= S.dialog.all.length) S.dialog.all[n - 1].fn();
    return;
  }
  if (S.modal) {
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "escape", "backspace"].includes(k) && modalKey(k)) { e.preventDefault(); return; }
    if (k === "escape" && S.modal === "quests" && UI.qCat) { UI.qCat = null; UI.qSel = null; renderModal(); sfx("close"); }
    else if (k === "escape") { closeModal(); if (UI.menuFromMain) mainCmdOpen(); }
    else if (menuKeys[k]) { if (S.modal === menuKeys[k]) closeModal(); else openMenu(menuKeys[k]); }
    return;
  }
  if (S.fish && S.fish.state === "bite" && (k === " " || k === "spacebar" || k === "enter" || k === "f")) { e.preventDefault(); reelFish(); return; }
  if (UI.mm && ["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "escape", "backspace"].includes(k)) { e.preventDefault(); mainCmdKey(k); return; }
  if (UI.cmd && ["arrowup", "arrowdown", "arrowleft", "arrowright", "enter", "escape", "backspace"].includes(k)) { e.preventDefault(); tgtCmdKey(k); return; }
  if (k === "tab") { e.preventDefault(); if (!e.repeat) { UI.tabHeld = true; if (e.shiftKey) cycleObjectTarget(); else cycleTarget(); } return; }
  if (k === "/") { e.preventDefault(); openChatInput("/"); return; }
  if (k === "l" && !S.modal) { chatToggle(); return; }
  if (k === "f") { toggleEngage(false); return; }
  if (k === "enter") { const t = player.target; if (t && (isMob(t) && t.alive || t.kind === "remote")) tgtCmdOpen(t); else if (t && t.kind === "npc") talkNearest(); else if (t === player) tgtCmdOpen(player); else { e.preventDefault(); openChatInput(""); } return; }
  if (menuKeys[k]) { openMenu(menuKeys[k]); return; }
  if (k === "r") { toggleMount(); return; }
  if (k === " " || k === "spacebar") { e.preventDefault(); if (e.shiftKey) tryJump(); else openChatInput(""); return; }
  if (k === "[") { setPage(UI.page - 1); return; }
  if (k === "]") { setPage(UI.page + 1); return; }
  if (k === "escape" && UI.cmd) { tgtCmdClose(); return; }
  if (k === "escape") {
    if (player.casting) { player.casting = null; log("You stop casting.", "sys"); }
    else if (player.target && !player.engaged) player.target = null;
    else if (logEsc()) {}
    else mainCmdOpen();
    return;
  }
  if (k === "-" || k === "insert") { mainCmdOpen(); return; }
  const code = e.code || "";
  const dm = /^Digit([0-9])$/.exec(code);
  const digit = dm ? dm[1] : /^[0-9]$/.test(k) ? k : null;
  if (digit !== null) {
    const idx = digit === "0" ? 9 : parseInt(digit, 10) - 1;
    e.preventDefault();
    if (UI.tabHeld) UI.tabUsed = true;
    activateSlot(UI.tabHeld ? 3 : e.altKey ? 2 : e.shiftKey ? 1 : UI.page, idx);
    return;
  }
  if (k === "e" && !S.keys.e && nearNpc() && dist(nearNpc(), player) <= CONFIG.talkRange) { talkNearest(); return; }
  if (k.startsWith("arrow")) e.preventDefault();
  S.keys[k] = true;
}

const TIPS = [
  "<b>Rest.</b> Standing still only trickles HP and MP back. Type /rest to sit and heal properly.",
  "<b>Rest.</b> Stand still out of combat and your HP and MP slowly come back.",
  "<b>Check before you fight.</b> A monster's name colour shows how tough it is compared to you.",
  "<b>Skillchains.</b> Use a weapon skill right after an ally's to chain them, then nuke the matching element for a magic burst.",
  "<b>Companions.</b> Brann at the Mercenary Hall hires out fighters, healers and mages. A hiring fee for the first hour, then an hourly wage.",
  "<b>Night falls.</b> Bats and restless bones come out after dark. Some rare monsters only appear at certain hours.",
  "<b>Home point.</b> Touch a crystal to set where you return after being defeated.",
  "<b>Weekdays.</b> Each day of the week favours one element. Spells of that element hit 10% harder.",
  "<b>Support jobs.</b> At level 10, Tobin can teach you to fight with a second job at half your level.",
  "<b>Backups.</b> Your game saves in this browser. Save to a file from the System menu to keep a copy."
];
function rotateTip() {
  const el = $("ldTip");
  if (!el) return;
  el.innerHTML = TIPS[Math.floor(Math.random() * TIPS.length)];
}

async function boot() {
  window.addEventListener("contextmenu", e => { if (!(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA"))) e.preventDefault(); });
  window.addEventListener("dragstart", e => e.preventDefault());
  window.addEventListener("keydown", guardKeys, true);
  window.addEventListener("pointerdown", () => { if (!UI.autoFullDone && UI.started && VIEW.settings.autoFull) { UI.autoFullDone = true; if (!document.fullscreenElement) toggleFullscreen(); } }, true);
  window.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", () => { if (UI.started) saveGame(); });
  const seen = () => { UI.lastInput = Date.now(); };
  for (const ev of ["keydown", "pointerdown", "wheel", "touchstart"]) window.addEventListener(ev, seen, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && UI.started) saveGame(); });
  window.addEventListener("keyup", e => {
    S.keys[e.key.toLowerCase()] = false;
    if (e.key === "Tab" && UI.tabHeld) {
      UI.tabHeld = false;
    }
  });
  window.addEventListener("blur", () => { S.keys = {}; UI.tabHeld = false; });
  VIEW.booting = true;
  PERF.mark("boot");
  rotateTip();
  const tipTimer = setInterval(rotateTip, 5000);
  loaderShow("LEID'ANAV REBORN", "A frontier tale");
  await frames(2);
  loaderProgress(0.1, "Waking the world…");
  await frames(1);
  initAudio();
  PERF.mark("audio");
  if (typeof uiHoverSounds === "function") uiHoverSounds();
  initViewA();
  PERF.mark("renderer");
  loaderProgress(0.35, "Weaving cloth and leather…");
  await frames(1);
  initViewB();
  PERF.mark("atlas+fx");
  loaderProgress(0.7, "Opening the roster…");
  await frames(1);
  initHud();
  PERF.mark("hud");
  $("btnEngage").onclick = () => toggleEngage(true);
  $("tgtAct").onclick = e => { e.stopPropagation(); tgtActPress(); };
  $("btnTarget").onclick = () => { cycleTarget(); sfx("select"); };
  $("btnTalk").onclick = talkNearest;
  $("btnHome").onclick = giveUpKO;
  $("btnMount").onclick = toggleMount;
  $("btnJump").onclick = tryJump;
  loaderProgress(1, "");
  await frames(1);
  clearInterval(tipTimer);
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    requestAnimationFrame(frame);
    PERF.frame();
    if (UI.started && !VIEW.loading) {
      try { step(dt); } catch (e) { reportError(e, "step"); }
      try { if (typeof tickRemotes === "function") { tickRemotes(dt); netRtTick(); } } catch (e) { reportError(e, "net"); }
      try { age(dt); } catch (e) { reportError(e, "age"); }
      try { draw(dt); } catch (e) { reportError(e, "draw"); }
      try { updateHud(dt); } catch (e) { reportError(e, "hud"); }
      try { updateAudio(); audioNag(); } catch (e) { reportError(e, "audio"); }
    } else {
      try { if (UI.creating && UI.pv) renderPreview(now); else if (UI.showcase && UI.pv) renderShowcase(now); } catch (e) { reportError(e, "frame"); }
    }
  }
  requestAnimationFrame(frame);
  PERF.mark("title");
  showTitle();
  buildItemIconsAsync();
}

function audioNag() {
  const need = AUDIO.ready && AUDIO.ctx && AUDIO.ctx.state !== "running" && !(AUDIO.settings && AUDIO.settings.muted) && !document.hidden;
  if (need && !UI.audioNagAt) UI.audioNagAt = performance.now();
  if (!need) UI.audioNagAt = 0;
  if (need && performance.now() - UI.audioNagAt > 2500 && !UI.audioNagShown) { UI.audioNagShown = true; if (typeof toast === "function") toast("🔇", "Sound is paused by your browser", "Tap or press any key to turn it on."); log("Sound is paused by your browser. Tap the screen or press any key to turn it on.", "warn"); }
}

function showTitle() {
  const ld = $("loading");
  ld.classList.add("ready");
  ld.classList.remove("roster", "zone");
  $("ldTitle").textContent = "LEID'ANAV REBORN";
  $("ldSub").textContent = "A frontier tale";
  $("charSel").style.display = "none";
  const b = $("ldStart");
  b.innerHTML = "Press Start<small>" + (matchMedia("(pointer: coarse)").matches ? "Tap to begin" : "Click or press any key") + "</small>";
  b.style.display = "";
  let done = false;
  const go = e => {
    if (done) return;
    if (e && e.type === "keydown" && (e.target.tagName === "INPUT" || e.key === "Tab")) return;
    done = true;
    window.removeEventListener("keydown", go);
    b.onclick = null;
    if (typeof sfx === "function") sfx("select");
    showModeChoice();
  };
  b.onclick = go;
  window.addEventListener("keydown", go);
}

function showModeChoice() {
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  $("ldStart").style.display = "none";
  let note = "", rq = "";
  try { note = sessionStorage.getItem("usr_idle") || ""; sessionStorage.removeItem("usr_idle"); rq = sessionStorage.getItem("usr_requeue") || ""; sessionStorage.removeItem("usr_requeue"); } catch (e) {}
  if (rq) { UI.queueNote = rq; PLAY.offline = false; showAccount(); return; }
  $("ldSub").textContent = "How do you want to play?";
  const box = $("charSel");
  box.innerHTML = '<div class="ccOpts" style="max-width:420px;margin:0 auto;text-align:center">' + (note ? '<div class="ccEmpty" style="margin-bottom:10px">' + esc(note) + "</div>" : "") + '<div class="ccAct" style="flex-direction:column;gap:10px"><button class="pri" data-play="on">Play Online</button><div class="sub">Sign in and play with others. Your characters are saved on the server.</div><button data-play="off">Play Offline</button><div class="sub">No account needed. Offline characters are saved on this device only, play solo with companions, and can never be brought online.</div></div></div>';
  box.style.display = "block";
  box.onclick = e => {
    const b = e.target.closest("[data-play]");
    if (!b) return;
    if (typeof sfx === "function") sfx("select");
    if (b.dataset.play === "off") { showOfflineGate(""); } else { PLAY.offline = false; showAccount(); }
  };
}

const OFFLINE_GATE_KEY = "ashenreach_offline_gate";
async function gateHash(email, salt, pw) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email + ":" + salt + ":" + pw));
  return Array.from(new Uint8Array(d)).map(x => x.toString(16).padStart(2, "0")).join("");
}
async function verifyOfflinePassword(email, pw) {
  email = email.trim().toLowerCase();
  let cache = null;
  try { cache = JSON.parse(localStorage.getItem(OFFLINE_GATE_KEY) || "null"); } catch (e) {}
  let net = true;
  try {
    if (!supaLoad()) throw new Error("Failed to fetch");
    const c = SUPA.createClient(NET_CFG.url, NET_CFG.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    const { error } = await c.auth.signInWithPassword({ email, password: pw });
    if (error) {
      if (/fetch|network|Failed/i.test(error.message || "")) throw error;
      throw new Error(/confirm/i.test(error.message || "") ? "Confirm your email first, then try again." : "Wrong email or password.");
    }
    const salt = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(x => x.toString(16)).join("");
    try { localStorage.setItem(OFFLINE_GATE_KEY, JSON.stringify({ e: email, s: salt, h: await gateHash(email, salt, pw) })); } catch (e) {}
    return;
  } catch (e) {
    if (!/fetch|network|Failed/i.test(e.message || "")) throw e;
    net = false;
  }
  if (!net && cache && cache.e === email && cache.h === await gateHash(email, cache.s, pw)) return;
  if (!net && cache && cache.e === email) throw new Error("Wrong email or password.");
  throw new Error("Can't reach the server to check your password. Connect once to unlock offline play on this device.");
}

function showOfflineGate(err) {
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  $("ldStart").style.display = "none";
  $("ldSub").textContent = "Offline play needs your account password";
  let last = "";
  try { last = (JSON.parse(localStorage.getItem(OFFLINE_GATE_KEY) || "null") || {}).e || ""; } catch (e) {}
  const box = $("charSel");
  box.innerHTML = '<div class="ccOpts" style="max-width:360px;margin:0 auto"><label>Email<input id="ofEmail" type="email" autocomplete="email" spellcheck="false" value="' + esc(last) + '"></label><label>Password<input id="ofPw" type="password" autocomplete="current-password" spellcheck="false"></label><div class="ccErr" id="ofErr">' + esc(err || "") + '</div><div class="ccAct"><button class="pri" data-go="1">Unlock offline play</button></div><div class="sub" style="text-align:center;margin-top:8px"><button data-back="1">Back</button></div><div class="sub" style="text-align:center;margin-top:10px;opacity:.7">Use the email and password of your online account. Once checked, this device remembers it so you can play with no connection.</div></div>';
  box.style.display = "block";
  const val = id => $(id).value;
  const submit = async () => {
    const btn = box.querySelector("[data-go]");
    if (btn.disabled) return;
    const email = val("ofEmail").trim();
    if (!email || !val("ofPw")) { $("ofErr").textContent = "Enter your email and password."; if (typeof sfx === "function") sfx("error"); return; }
    btn.disabled = true; btn.textContent = "Checking…";
    try { await verifyOfflinePassword(email, val("ofPw")); PLAY.offline = true; showCharSelect(); }
    catch (e) { btn.disabled = false; btn.textContent = "Unlock offline play"; $("ofErr").textContent = e.message || "Could not check the password."; if (typeof sfx === "function") sfx("error"); }
  };
  box.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") submit(); }));
  box.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.go) submit();
    else if (b.dataset.back) { if (typeof sfx === "function") sfx("close"); showModeChoice(); }
  };
  setTimeout(() => { const f = $(last ? "ofPw" : "ofEmail"); if (f) f.focus(); }, 50);
}

const CC = { job: "WAR", look: null, name: "", step: 0, thumbs: {} };
const STARTER_GEAR = { WAR: { main: "bronze_sword", head: "bronze_cap", body: "bronze_harness" }, WHM: { main: "ash_club", head: "bronze_cap", body: "robe" }, BLM: { main: "ash_staff", head: "bronze_cap", body: "robe" } };
const JOB_BLURB = { PLD: "", RDM: "", THF: "", MNK: "", WAR: "Front-line fighter. Great axes and swords, Provoke to hold attention, Berserk to hit harder. The simplest start.", WHM: "Healer. Cures keep the party alive, Dia and Banish wear enemies down. Hire a Warrior early.", BLM: "Nuker. Elemental spells hit hard and magic-burst skillchains. Fragile; hire a tank first." };

function fmtAgo(t) {
  const d = Date.now() - t;
  if (d < 60000) return "just now";
  if (d < 3600000) return Math.floor(d / 60000) + " min ago";
  if (d < 86400000) return Math.floor(d / 3600000) + " h ago";
  return Math.floor(d / 86400000) + " d ago";
}

function acctBusy(msg) {
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  $("ldStart").style.display = "none";
  $("ldSub").textContent = msg;
  const box = $("charSel");
  box.innerHTML = '<div class="ccEmpty">' + esc(msg) + "</div>";
  box.style.display = "block";
}

async function showAccount() {
  acctBusy("Connecting to the server…");
  let ok = false;
  try { ok = await netRestore(); } catch (e) {}
  if (ok) { await openRoster(); return; }
  showLogin(NET.user ? "member" : "signin", NET.lastErr);
}

function showQueue(d) {
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  $("ldStart").style.display = "none";
  $("ldSub").textContent = "The server is full";
  const box = $("charSel");
  box.innerHTML = '<div class="ccOpts" style="max-width:380px;margin:0 auto;text-align:center">' + (UI.queueNote ? '<div class="ccErr" style="margin-bottom:8px">' + esc(UI.queueNote) + "</div>" : "") + '<div class="ccEmpty" style="font-size:18px"><b>You are #' + ((d.ahead || 0) + 1) + ' in line</b></div><div class="sub" style="margin:6px 0 10px">' + (d.online != null ? d.online + " of " + d.max + " players are online. " : "") + (d.ahead ? d.ahead + (d.ahead === 1 ? " person is" : " people are") + " ahead of you." : "You're next.") + " Keep this page open; you'll join as soon as a place frees up.</div><div class=\"ccAct\" style=\"justify-content:center\"><button data-leaveq=\"1\">Leave the line</button></div><div class=\"sub\" style=\"margin-top:10px;opacity:.7\">Play Offline is still available from the start screen.</div></div>";
  box.style.display = "block";
}

async function queueGate() {
  const my = (UI.queueRun = (UI.queueRun || 0) + 1);
  let left = false;
  $("charSel").onclick = e => {
    const b = e.target.closest("[data-leaveq]");
    if (!b) return;
    left = true;
    if (typeof sfx === "function") sfx("close");
    netQueueLeave(false, "left").then(() => showModeChoice());
  };
  for (;;) {
    if (left || UI.queueRun !== my) return false;
    let d;
    try { d = await netQueueJoin(); }
    catch (e) { if (left || UI.queueRun !== my) return false; acctBusy("Can't reach the server. Retrying…"); await new Promise(r => setTimeout(r, NET_CFG.queuePoll)); continue; }
    if (left || UI.queueRun !== my) return false;
    if (d.state === "play") { UI.queueNote = ""; netSeatStart(); if (UI.queued && typeof sfx === "function") sfx("unlock"); UI.queued = false; return true; }
    UI.queued = true;
    showQueue(d);
    await new Promise(r => setTimeout(r, NET_CFG.queuePoll));
  }
}

async function openRoster() {
  acctBusy("Checking for a place on the server…");
  if (!(await queueGate())) return;
  acctBusy("Loading your characters…");
  try { await netPullRoster(); } catch (e) { showLogin("signin", netErr(e)); return; }
  showCharSelect();
}

function showLogin(mode, err) {
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  $("ldStart").style.display = "none";
  $("ldSub").textContent = mode === "signup" ? "Create an account" : mode === "member" ? "Finish joining" : "Sign in";
  const f = (id, label, type, ac) => '<label>' + label + '<input id="' + id + '" type="' + type + '" autocomplete="' + ac + '" spellcheck="false"></label>';
  let h = '<div class="ccOpts" style="max-width:360px;margin:0 auto">';
  if (mode === "member") h += '<div class="sub" style="margin-bottom:6px">Signed in as ' + esc(NET.user.email) + ". Enter the sign-up password to join this server.</div>" + f("acCode", "Sign-up password", "password", "off");
  else {
    h += f("acEmail", "Email", "email", "email") + f("acPw", "Password", "password", mode === "signup" ? "new-password" : "current-password");
    if (mode === "signup") h += f("acPw2", "Confirm password", "password", "new-password") + f("acCode", "Sign-up password (ask the server owner)", "password", "off");
  }
  h += '<div class="ccErr" id="acErr">' + esc(err || "") + '</div><div class="ccAct"><button class="pri" data-go="1">' + (mode === "signup" ? "Create account" : mode === "member" ? "Join" : "Sign in") + "</button></div>";
  h += '<div class="sub" style="text-align:center;margin-top:8px">' + (mode === "signin" ? '<button data-mode="signup">Create an account</button>' : mode === "signup" ? '<button data-mode="signin">I already have an account</button>' : '<button data-out="1">Sign out</button>') + "</div>";
  h += '<div class="sub" style="text-align:center;margin-top:10px;opacity:.7">An account and an internet connection are needed to play. Your characters are saved on the server.</div></div>';
  const box = $("charSel");
  box.innerHTML = h;
  box.style.display = "block";
  box.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") submit(); }));
  const first = box.querySelector("input"); if (first) setTimeout(() => first.focus(), 50);
  const val = id => { const el = $(id); return el ? el.value : ""; };
  const fail = m => { $("acErr").textContent = m; if (typeof sfx === "function") sfx("error"); };
  async function submit() {
    const btn = box.querySelector("[data-go]");
    if (btn.disabled) return;
    try {
      if (mode === "member") {
        if (!val("acCode")) return fail("Enter the sign-up password.");
        btn.disabled = true; btn.textContent = "Joining…";
        await netEnsureMember(val("acCode"));
        await openRoster(); return;
      }
      const email = val("acEmail").trim(), pw = val("acPw");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail("Enter a valid email address.");
      if (pw.length < 6) return fail("Passwords are at least 6 characters.");
      if (mode === "signup") {
        if (pw !== val("acPw2")) return fail("The passwords don't match.");
        if (!val("acCode")) return fail("Enter the sign-up password.");
        btn.disabled = true; btn.textContent = "Creating…";
        const r = await netSignUp(email, pw, val("acCode"));
        if (r === "confirm") { showLogin("signin", "Account created. Check your email and click the confirmation link, then sign in here."); return; }
        await openRoster(); return;
      }
      btn.disabled = true; btn.textContent = "Signing in…";
      const member = await netSignIn(email, pw);
      if (!member) { showLogin("member"); return; }
      await openRoster();
    } catch (e) { btn.disabled = false; btn.textContent = mode === "signup" ? "Create account" : mode === "member" ? "Join" : "Sign in"; fail(netErr(e)); }
  }
  box.onclick = async e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.go) { submit(); return; }
    if (b.dataset.mode) { if (typeof sfx === "function") sfx("tab"); showLogin(b.dataset.mode); return; }
    if (b.dataset.out) { await netSignOut(); showLogin("signin"); }
  };
}

function showCharSelect() {
  UI.creating = false;
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  ld.classList.remove("zone");
  $("ldTitle").textContent = "LEID'ANAV REBORN";
  $("ldSub").textContent = PLAY.offline ? "Choose your offline character" : "Choose your character";
  $("ldStart").style.display = "none";
  const r = loadRoster();
  r.chars.sort((a, b) => (b.played || 0) - (a.played || 0));
  let h = '';
  if (OLD_CHARS.length) { h += '<div class="ccEmpty" style="margin-bottom:8px">Updates 17.0 and 18.0 changed the rules (spells, potions and gear). These characters could not be kept and were deleted: ' + esc(OLD_CHARS.join(', ')) + '. Please create a new character.</div>'; OLD_CHARS.length = 0; }
  h += '<div class="ccList">';
  for (const c of r.chars) {
    const j = JOBS[c.job] || JOBS.WAR;
    h += '<div class="ccCard" data-id="' + c.id + '"><div class="ccPor" style="background:' + j.color + '22;border-color:' + j.color + '">' + j.icon + '</div><div class="ccInfo"><b>' + esc(c.name) + '</b><span>' + esc(((RACES[(c.look || {}).race] || RACES.human).name) + " " + j.name) + " Lv." + c.lv + ' · ' + esc(c.zone) + '</span><small>Last played ' + fmtAgo(c.played || c.created) + '</small></div><div class="ccBtns"><button class="pri" data-play="' + c.id + '">Play</button><button class="del" data-del="' + c.id + '" title="Delete">🗑</button></div></div>';
  }
  if (!r.chars.length) h += '<div class="ccEmpty">No characters yet. Create one to begin your journey.</div>';
  h += "</div>";
  if (false) h += '<div class="ccEmpty" style="margin-top:6px">' + NET.localOnly.length + " character" + (NET.localOnly.length > 1 ? "s" : "") + " from this browser (" + NET.localOnly.map(c => esc(c.name)).join(", ") + ') can be moved to your account. <button data-upload="1">Upload to my account</button></div>';
  h += '<div class="ccFoot">' + (r.chars.length < MAX_CHARS ? '<button class="pri" data-new="1">＋ New character</button>' : '<span class="sub">Character limit reached (' + MAX_CHARS + ').</span>') + '<span class="sub">' + r.chars.length + " / " + MAX_CHARS + " characters · " + (PLAY.offline ? 'Offline (this device only) <button data-mode="1">Play online instead</button>' : esc(NET.user ? NET.user.email : "") + ' <button data-signout="1">Sign out</button>') + "</span></div>";
  const box = $("charSel");
  box.innerHTML = h;
  box.style.display = "block";
  box.onclick = e => {
    const b = e.target.closest("button");
    if (b && b.dataset.play) { enterWorld(b.dataset.play); return; }
    if (b && b.dataset.del) {
      const c = r.chars.find(x => x.id === b.dataset.del);
      if (c) gameConfirm("Delete " + c.name + "?", "This character and everything they own will be gone for good.", async () => { try { await netDeleteChar(c.id); deleteChar(c.id); showCharSelect(); } catch (err) { acctBusy("Couldn't delete: " + netErr(err)); setTimeout(showCharSelect, 2500); } }, { yes: "Delete", danger: true });
      return;
    }
    if (b && b.dataset.mode) { PLAY.offline = false; showModeChoice(); return; }
    if (b && b.dataset.signout) { netSignOut().then(() => showLogin("signin")); return; }
    if (b && b.dataset.upload) { acctBusy("Uploading characters…"); netUploadLocal().then(res => { acctBusy(res.join(" · ")); setTimeout(openRoster, 2200); }); return; }
    if (b && b.dataset.new) { showCharCreate(); return; }
    const card = e.target.closest(".ccCard");
    if (card) enterWorld(card.dataset.id);
  };
}

const CC_FACE_HAIR = [["short", "sidepart", "spiky", "ponytail", "long", "topknot", "curly", "braid"], ["bob", "long", "ponytail", "twintails", "wavy", "bun", "pixie", "braid"]];
const CC_SIZES = [["Small", 0, 1], ["Medium", 2, 2], ["Large", 4, 3]];
const CC_STEPS = [["race", "Race"], ["gender", "Gender"], ["face", "Face"], ["hair", "Hair colour"], ["size", "Size"], ["name", "Name & job"]];
function ccApplyFace(l) {
  const sx = l.build ? 1 : 0, f = (l.face || 0) % FACE_COUNT;
  l.hairStyle = HAIR_STYLES.indexOf(CC_FACE_HAIR[sx][f]);
}
function ccTouch() { try { return window.innerWidth <= 720 || window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0; } catch (e) { return false; } }
function ccSizeOf(l) { const i = CC_SIZES.findIndex(s => s[1] === l.height && s[2] === l.girth); return i < 0 ? 1 : i; }
function ccSteps(l) { return CC_STEPS.filter(s => s[0] !== "gender" || RACES[l.race].sex == null); }
function ccFaceThumb(v, fem, race) {
  const k = ATLAS_CELL / 256, c = document.createElement("canvas"), g = c.getContext("2d");
  c.width = ATLAS_CELL; c.height = ATLAS_CELL;
  g.fillStyle = "#" + raceSkinColor(race).toString(16).padStart(6, "0"); g.fillRect(0, 0, c.width, c.height);
  paintFaceFor(race, g, 0, 0, v, fem);
  const t = document.createElement("canvas"); t.width = 72; t.height = 60;
  const tg = t.getContext("2d");
  tg.drawImage(c, 26 * k, 66 * k, 76 * k, 108 * k, 0, 0, 72, 60);
  return t.toDataURL();
}
function ccRaceStats(rc) {
  const a = rc.attrs || {}, out = [];
  if (rc.hp !== 1) out.push("HP " + (rc.hp > 1 ? "+" : "") + Math.round((rc.hp - 1) * 100) + "%");
  if (rc.mp !== 1) out.push("MP " + (rc.mp > 1 ? "+" : "") + Math.round((rc.mp - 1) * 100) + "%");
  for (const s of ["str", "dex", "vit", "agi", "int", "mnd"]) if (a[s]) out.push(s.toUpperCase() + " " + (a[s] > 0 ? "+" : "") + a[s]);
  if (rc.speed && rc.speed !== 1) out.push("Speed " + (rc.speed > 1 ? "+" : "") + Math.round((rc.speed - 1) * 100) + "%");
  return out.length ? out.join(" · ") : "No bonuses or penalties";
}

function showCharCreate() {
  const r = loadRoster();
  CC.job = "WAR";
  CC.step = 0;
  const randomLook = () => {
    const race = RACE_ORDER[Math.floor(Math.random() * RACE_ORDER.length)];
    const l = { race, build: RACES[race].sex != null ? RACES[race].sex : Math.floor(Math.random() * 2), hairColor: Math.floor(Math.random() * HAIR_COLORS.length), face: Math.floor(Math.random() * FACE_COUNT) };
    const sz = CC_SIZES[Math.floor(Math.random() * 3)]; l.height = sz[1]; l.girth = sz[2];
    ccApplyFace(l);
    return l;
  };
  CC.look = { race: "human", build: 0, face: 0, hairColor: 1, height: 2, girth: 2 };
  ccApplyFace(CC.look);
  CC.name = "";
  CC.thumbs = {};
  $("ldSub").textContent = "Create your character";
  const box = $("charSel");
  box.innerHTML = '<div class="ccForm"><div id="ccPv"><div class="lbl" id="ccLbl"></div></div><div class="ccOpts">' +
    '<div class="ccSteps" id="ccSteps"></div><div class="ccStepT" id="ccStepT"></div><div class="ccBody" id="ccBody"></div>' +
    '<div class="ccErr" id="ccErr"></div>' +
    '<div class="ccAct"><button data-prev="1">◂ Back</button><button data-rand="1" title="Random look">🎲</button><button class="pri" data-next="1">Next ▸</button></div></div></div>';
  UI.creating = true;
  if (typeof attachPreview === "function") {
    attachPreview("ccPv");
    if (UI.pv && !UI.pv.failed) { UI.pv.rot = 0; UI.pv.spinInit = 0; UI.pv.sig = null; }
  }
  const label = () => { $("ccLbl").innerHTML = esc(CC.name || "Adventurer") + "<small>" + (RACES[CC.look.race] || RACES.human).name + " " + (CC.look.build ? "♀" : "♂") + " · " + CC_SIZES[ccSizeOf(CC.look)][0] + "</small>"; };
  const thumb = (v, fem) => { const key = v + "|" + fem + "|" + CC.look.race + "|" + ATLAS_CELL; if (!CC.thumbs[key]) { try { CC.thumbs[key] = ccFaceThumb(v, fem, CC.look.race); } catch (e) { CC.thumbs[key] = ""; } } return CC.thumbs[key]; };
  const paint = () => {
    const l = CC.look, steps = ccSteps(l);
    CC.step = Math.max(0, Math.min(CC.step, steps.length - 1));
    const st = steps[CC.step][0];
    if (UI.pv) { const g = Object.assign({}, STARTER_GEAR[CC.job]); delete g.head; UI.pv.override = { job: CC.job, gear: g, look: l }; UI.pv.focus = (st === "face" || st === "hair") && !ccTouch() ? 1 : 0; }
    $("ccSteps").innerHTML = steps.map((s, i) => '<button data-goto="' + i + '" class="' + (i === CC.step ? "on" : i < CC.step ? "done" : "") + '">' + (i + 1) + '<small>' + s[1] + "</small></button>").join("");
    $("ccStepT").textContent = (CC.step + 1) + ". " + steps[CC.step][1];
    const sel = (on) => on ? " on" : "";
    let h = "";
    if (st === "race") {
      h = '<div class="ccGrid ccRaces">' + RACE_ORDER.map(k => { const rc = RACES[k]; return '<button data-race="' + k + '" class="ccCard2' + sel(l.race === k) + '"><b>' + rc.icon + " " + rc.name + "</b>" + (rc.sex != null ? '<small class="lock">' + (rc.sex ? "Female only" : "Male only") + "</small>" : "") + "</button>"; }).join("") + "</div>";
      const rc = RACES[l.race];
      h += '<div class="ccInfo2"><div>' + esc(rc.blurb) + '</div><div class="st">' + ccRaceStats(rc) + "</div></div>";
    } else if (st === "gender") {
      h = '<div class="ccGrid ccTwo">' + [["0", "♂ Male"], ["1", "♀ Female"]].map(([v, n]) => '<button data-sex="' + v + '" class="ccCard2' + sel(String(l.build) === v) + '"><b>' + n + "</b></button>").join("") + "</div>";
    } else if (st === "face") {
      const fem = l.build === 1;
      h = '<div class="ccGrid ccFaces">' + FACE_NAMES.map((n, i) => { const src = thumb(i, fem); return '<button data-face="' + i + '" class="ccFaceB' + sel((l.face || 0) === i) + '">' + (src ? '<img alt="" src="' + src + '">' : "") + "<small>" + (i + 1) + ". " + n + "</small></button>"; }).join("") + "</div>";
      h += '<div class="ccInfo2"><div>Each face comes with its own hairstyle: ' + esc(HAIR_STYLE_NAMES[HAIR_STYLES[l.hairStyle]] || "") + ".</div></div>";
    } else if (st === "hair") {
      h = '<div class="ccGrid ccHair">' + HAIR_COLORS.map((c, i) => '<button data-hc="' + i + '" class="ccSw' + sel(l.hairColor === i) + '" style="--c:#' + c.toString(16).padStart(6, "0") + '"><span></span></button>').join("") + "</div>";
    } else if (st === "size") {
      const cur = ccSizeOf(l);
      h = '<div class="ccGrid ccSizes">' + CC_SIZES.map((s, i) => '<button data-size="' + i + '" class="ccCard2' + sel(cur === i) + '"><b>' + s[0] + "</b><small>" + BODY_HEIGHT_NAMES[s[1]] + ", " + BODY_GIRTH_NAMES[s[2]].toLowerCase() + "</small></button>").join("") + "</div>";
      h += '<div class="ccInfo2"><div>Size is only for looks; it does not change your stats.</div></div>';
    } else {
      h = '<label>Name<input id="ccName" type="text" maxlength="12" autocomplete="off" spellcheck="false" placeholder="2–12 letters" value="' + esc(CC.name) + '"></label>' +
        '<div class="ccSec">Job</div><div class="ccJobs">' + BASE_JOBS.map(j => '<button data-job="' + j + '" style="--jc:' + JOBS[j].color + '"' + (CC.job === j ? ' class="on"' : "") + ">" + JOBS[j].icon + " " + JOBS[j].name + "</button>").join("") + '</div><div class="sub" id="ccJobBlurb">' + esc(JOB_BLURB[CC.job]) + "</div>" +
        '<div class="ccSum">' + [["Race", RACES[l.race].name], ["Gender", l.build ? "Female" : "Male"], ["Face", FACE_NAMES[(l.face || 0) % FACE_NAMES.length]], ["Hair", HAIR_STYLE_NAMES[HAIR_STYLES[l.hairStyle]] || ""], ["Size", CC_SIZES[ccSizeOf(l)][0]]].map(x => "<span><em>" + x[0] + "</em>" + esc(x[1]) + "</span>").join("") + '</div>' +
        '<button class="ccRestart" data-restart="1">↺ Start over</button>' +
        '<div class="ccWarn">⚠ Appearance is permanent. It can\'t be changed after creation.</div>';
    }
    $("ccBody").innerHTML = h;
    const last = CC.step === steps.length - 1;
    const nx = box.querySelector("[data-next]");
    nx.textContent = last ? "Begin your journey" : "Next ▸";
    nx.dataset.create = last ? "1" : "";
    box.querySelector("[data-prev]").textContent = CC.step ? "◂ Back" : "◂ Characters";
    label();
    if (last) {
      const nm = $("ccName");
      nm.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") create(); });
      nm.addEventListener("input", () => { CC.name = nm.value.replace(/[^A-Za-z' -]/g, "").slice(0, 12); if (nm.value !== CC.name) nm.value = CC.name; $("ccErr").textContent = ""; label(); });
      if (window.innerWidth > 700) setTimeout(() => nm.focus(), 50);
    }
  };
  paint();
  const create = async () => {
    const name = CC.name.trim().replace(/^./, c => c.toUpperCase());
    const why = validCharName(name, r);
    const nm = $("ccName");
    if (why) { $("ccErr").textContent = why; sfx("error"); if (nm) nm.focus(); return; }
    const btn = box.querySelector("[data-next]");
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Creating…";
    const look = Object.assign({}, CC.look);
    const id = createChar({ name, job: CC.job, look });
    try { if (!PLAY.offline) await netCreateChar(id, loadChar(id)); }
    catch (e) { deleteChar(id); btn.disabled = false; btn.textContent = "Begin your journey"; $("ccErr").textContent = netErr(e); sfx("error"); return; }
    enterWorld(id, true);
  };
  box.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    const l = CC.look;
    if (b.dataset.restart) { CC.look = { race: "human", build: 0, face: 0, hairColor: 1, height: 2, girth: 2 }; ccApplyFace(CC.look); CC.step = 0; CC.name = ""; sfx("close"); paint(); return; }
    if (b.dataset.job) { CC.job = b.dataset.job; sfx("tab"); box.querySelectorAll("[data-job]").forEach(x => x.classList.toggle("on", x.dataset.job === CC.job)); $("ccJobBlurb").textContent = JOB_BLURB[CC.job]; if (UI.pv) { const g = Object.assign({}, STARTER_GEAR[CC.job]); delete g.head; UI.pv.override = { job: CC.job, gear: g, look: l }; } return; }
    if (b.dataset.race) { l.race = b.dataset.race; const sx = RACES[l.race].sex; if (sx != null) l.build = sx; ccApplyFace(l); sfx("click"); paint(); return; }
    if (b.dataset.sex != null && b.dataset.sex !== "") { l.build = +b.dataset.sex; ccApplyFace(l); sfx("click"); paint(); return; }
    if (b.dataset.face != null && b.dataset.face !== "") { l.face = +b.dataset.face; ccApplyFace(l); sfx("click"); paint(); return; }
    if (b.dataset.hc != null && b.dataset.hc !== "") { l.hairColor = +b.dataset.hc; sfx("click"); paint(); return; }
    if (b.dataset.size != null && b.dataset.size !== "") { const s = CC_SIZES[+b.dataset.size]; l.height = s[1]; l.girth = s[2]; sfx("click"); paint(); return; }
    if (b.dataset.goto != null && b.dataset.goto !== "") { const i = +b.dataset.goto; if (i <= CC.step || i <= ccSteps(l).length - 1) { CC.step = i; sfx("tab"); paint(); } return; }
    if (b.dataset.rand) { const keep = CC.step; CC.look = randomLook(); CC.step = keep; sfx("click"); paint(); return; }
    if (b.dataset.prev) { if (CC.step > 0) { CC.step--; sfx("close"); paint(); return; } UI.creating = false; releasePreview(); sfx("close"); showCharSelect(); return; }
    if (b.dataset.next) { if (b.dataset.create) { create(); return; } CC.step++; sfx("click"); paint(); return; }
  };
}

async function enterWorld(id, fresh) {
  if (UI.started || UI.entering) return;
  if (!fresh && isUuid(id)) {
    acctBusy("Loading character…");
    try { await netFetchChar(id); } catch (e) { acctBusy("Couldn't load that character: " + netErr(e)); setTimeout(showCharSelect, 2500); return; }
  }
  if (!selectChar(id)) { showCharSelect(); return; }
  UI.entering = true;
  UI.creating = false;
  if (UI.pv) UI.pv.override = null;
  releasePreview();
  startAudio();
  sfx("select");
  const ld = $("loading");
  ld.classList.remove("ready", "roster");
  $("charSel").style.display = "none";
  $("ldSub").textContent = fresh ? "A new adventure begins" : "Welcome back, " + (save.name || "Adventurer");
  loaderProgress(0.05, "Reading your journal…");
  await frames(2);
  S.nmDeadUntil = {};
  initParty();
  UI.watch = null; UI.slotKey = ""; UI.actKeys = null; UI.partyKey = "";
  clearLog();
  log(fresh ? "A new adventure begins. Talk to Captain Rhea for work, Brann to hire companions, Pip at your residence to change jobs, Pell to trade." : "Welcome back, " + save.name + ".", "npc");
  if (S.storageFull) { log("Your browser's storage for this site is full or blocked, so this character won't be saved between visits. Use System → Save to file to keep a copy, or clear space (other games or sites on the same address share it).", "foe"); if (typeof toast === "function") toast("⚠️", "Storage full", "Progress won't be kept. Save to file in System.", "r-epic"); }
  const h = fresh ? { zone: "outpost", x: ZONES.outpost.start.x, y: ZONES.outpost.start.y } : resumePos();
  enterZone(h.zone, h.x, h.y);
  if (h.face != null) player.face = h.face;
  if (save.buddyOut && save.buddy && typeof summonBuddy === "function") summonBuddy();
  restoreKO();
  await zoneReady();
  VIEW.booting = false;
  UI.started = true;
  UI.entering = false;
  sfx("zone");
  loaderHide();
  zoneTitle(S.zone.name, fresh ? "Your story begins" : "");
  initVersionCheck();
}

async function logoutToSelect() {
  saveGame();
  try { await netFlush(); netLeaveAll(); } catch (e) {}
  const r = loadRoster();
  r.current = null;
  saveRoster(r);
  location.reload();
}

boot();
