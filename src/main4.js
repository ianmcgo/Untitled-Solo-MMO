function onKey(e) {
  const k = e.key.toLowerCase();
  if (UI.confirmOpen) { const cb = $("confirmBox"); if (k === "escape") cb.querySelector(".no").click(); else if (k === "arrowup" || k === "arrowdown") { cb.querySelectorAll(".cbA button").forEach(b => b.classList.toggle("sel")); } else if (k === "enter" || k === " ") (cb.querySelector(".cbA button.sel") || cb.querySelector(".yes")).click(); e.preventDefault(); return; }
  if (!UI.started) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.type !== "range") return;
  const menuKeys = { g: "equipment", i: "inventory", c: "character", k: "skills", b: "actions", j: "quests", m: "map", h: "help", n: "craft", p: "party", y: "bestiary", o: "achievements" };
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
  if (k === "tab") { e.preventDefault(); cycleTarget(); return; }
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
    activateSlot(e.shiftKey ? 1 : 0, idx);
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
  "<b>Companions.</b> Brann at the Mercenary Hall hires out fighters, healers and mages. A hiring fee, then a small daily wage.",
  "<b>Night falls.</b> Bats and restless bones come out after dark. Some rare monsters only appear at certain hours.",
  "<b>Home point.</b> Touch a crystal to set where you return after being defeated.",
  "<b>Weekdays.</b> Each day of the week favours one element. Spells of that element hit 10% harder.",
  "<b>Support jobs.</b> At level 5, Tobin can teach you to fight with a second job at half your level.",
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
  window.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", () => { if (UI.started) saveGame(); });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && UI.started) saveGame(); });
  window.addEventListener("keyup", e => { S.keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => { S.keys = {}; });
  VIEW.booting = true;
  rotateTip();
  const tipTimer = setInterval(rotateTip, 5000);
  loaderShow("LEID'ANAV REBORN", "A frontier tale");
  await frames(2);
  loaderProgress(0.1, "Waking the world…");
  await frames(1);
  initAudio();
  initViewA();
  loaderProgress(0.35, "Weaving cloth and leather…");
  await frames(1);
  initViewB();
  loaderProgress(0.7, "Opening the roster…");
  await frames(1);
  initHud();
  $("btnEngage").onclick = () => toggleEngage(true);
  $("btnTarget").onclick = () => { cycleTarget(); sfx("select"); };
  $("btnTalk").onclick = talkNearest;
  $("btnHome").onclick = returnHome;
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
    try {
      if (UI.started && !VIEW.loading) {
        if (!S.ko) step(dt); else S.time += dt;
        if (typeof tickRemotes === "function") { tickRemotes(dt); netRtTick(); }
        age(dt);
        draw(dt);
        updateHud(dt);
        updateAudio();
      } else if (UI.creating && UI.pv) renderPreview(now);
      else if (UI.showcase && UI.pv) renderShowcase(now);
    } catch (e) { reportError(e, "frame"); }
  }
  requestAnimationFrame(frame);
  showTitle();
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
    showAccount();
  };
  b.onclick = go;
  window.addEventListener("keydown", go);
}

const CC = { job: "WAR", look: null, name: "" };
const STARTER_GEAR = { WAR: { main: "bronze_sword", head: "bronze_cap", body: "leather_vest" }, WHM: { main: "ash_club", head: "bronze_cap", body: "linen_robe" }, BLM: { main: "ash_staff", head: "bronze_cap", body: "linen_robe" } };
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

async function openRoster() {
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
  $("ldSub").textContent = "Choose your character";
  $("ldStart").style.display = "none";
  const r = loadRoster();
  r.chars.sort((a, b) => (b.played || 0) - (a.played || 0));
  let h = '<div class="ccList">';
  for (const c of r.chars) {
    const j = JOBS[c.job] || JOBS.WAR;
    h += '<div class="ccCard" data-id="' + c.id + '"><div class="ccPor" style="background:' + j.color + '22;border-color:' + j.color + '">' + j.icon + '</div><div class="ccInfo"><b>' + esc(c.name) + '</b><span>' + esc(((RACES[(c.look || {}).race] || RACES.human).name) + " " + j.name) + " Lv." + c.lv + ' · ' + esc(c.zone) + '</span><small>Last played ' + fmtAgo(c.played || c.created) + '</small></div><div class="ccBtns"><button class="pri" data-play="' + c.id + '">Play</button><button class="del" data-del="' + c.id + '" title="Delete">🗑</button></div></div>';
  }
  if (!r.chars.length) h += '<div class="ccEmpty">No characters yet. Create one to begin your journey.</div>';
  h += "</div>";
  if (NET.localOnly && NET.localOnly.length) h += '<div class="ccEmpty" style="margin-top:6px">' + NET.localOnly.length + " character" + (NET.localOnly.length > 1 ? "s" : "") + " from this browser (" + NET.localOnly.map(c => esc(c.name)).join(", ") + ') can be moved to your account. <button data-upload="1">Upload to my account</button></div>';
  h += '<div class="ccFoot">' + (r.chars.length < MAX_CHARS ? '<button class="pri" data-new="1">＋ New character</button>' : '<span class="sub">Character limit reached (' + MAX_CHARS + ').</span>') + '<span class="sub">' + r.chars.length + " / " + MAX_CHARS + " characters · " + esc(NET.user ? NET.user.email : "") + ' <button data-signout="1">Sign out</button></span></div>';
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
    if (b && b.dataset.signout) { netSignOut().then(() => showLogin("signin")); return; }
    if (b && b.dataset.upload) { acctBusy("Uploading characters…"); netUploadLocal().then(res => { acctBusy(res.join(" · ")); setTimeout(openRoster, 2200); }); return; }
    if (b && b.dataset.new) { showCharCreate(); return; }
    const card = e.target.closest(".ccCard");
    if (card) enterWorld(card.dataset.id);
  };
}

function showCharCreate() {
  const r = loadRoster();
  CC.job = "WAR";
  const randomLook = () => {
    const race = RACE_ORDER[Math.floor(Math.random() * RACE_ORDER.length)];
    const l = { race, build: RACES[race].sex != null ? RACES[race].sex : Math.floor(Math.random() * 2), skin: Math.floor(Math.random() * SKIN_TONES.length), hairStyle: 0, hairColor: Math.floor(Math.random() * HAIR_COLORS.length), height: Math.floor(Math.random() * 5), girth: Math.floor(Math.random() * 5) };
    const st = HAIR_BY_SEX[l.build];
    l.hairStyle = HAIR_STYLES.indexOf(st[Math.floor(Math.random() * st.length)]);
    return l;
  };
  CC.look = randomLook();
  CC.look.race = "human"; CC.look.build = 0; CC.look.skin = 1; CC.look.height = 2; CC.look.girth = 2;
  CC.look.hairStyle = HAIR_STYLES.indexOf(HAIR_BY_SEX[0][0]);
  CC.name = "";
  $("ldSub").textContent = "Create your character";
  const box = $("charSel");
  box.innerHTML = '<div class="ccForm"><div id="ccPv"><div class="lbl" id="ccLbl"></div></div><div class="ccOpts">' +
    '<label>Name<input id="ccName" type="text" maxlength="12" autocomplete="off" spellcheck="false" placeholder="2–12 letters"></label>' +
    '<div class="ccSec">Job</div><div class="ccJobs">' + BASE_JOBS.map(j => '<button data-job="' + j + '" style="--jc:' + JOBS[j].color + '">' + JOBS[j].icon + " " + JOBS[j].name + "</button>").join("") + '</div><div class="sub" id="ccJobBlurb"></div>' +
    '<div class="ccSec">Appearance <small>· drag the model to turn it</small></div><div class="ccLook" id="ccLook"></div>' +
    '<div class="ccWarn">⚠ Appearance is permanent. It can\'t be changed after creation.</div>' +
    '<div class="ccErr" id="ccErr"></div>' +
    '<div class="ccAct"><button data-back="1">◂ Back</button><button class="pri" data-create="1">Begin your journey</button></div></div></div>';
  UI.creating = true;
  if (typeof attachPreview === "function") {
    const wrap = $("ccPv");
    attachPreview("ccPv");
    if (UI.pv && !UI.pv.failed) { UI.pv.rot = 0.4; UI.pv.sig = null; }
  }
  const paint = () => {
    if (UI.pv) { const g = Object.assign({}, STARTER_GEAR[CC.job]); delete g.head; UI.pv.override = { job: CC.job, gear: g, look: CC.look }; }
    box.querySelectorAll("[data-job]").forEach(b => b.classList.toggle("on", b.dataset.job === CC.job));
    $("ccJobBlurb").textContent = JOB_BLURB[CC.job];
    const l = CC.look;
    const sw = c => '<span class="sw" style="background:#' + c.toString(16).padStart(6, "0") + '"></span>';
    const row = (k, label, n, val) => '<div class="ccRow"><span>' + label + '</span><button data-look="' + k + '" data-d="-1">‹</button><b>' + val + '</b><button data-look="' + k + '" data-d="1">›</button></div>';
    const styles = HAIR_BY_SEX[l.build];
    if (!styles.includes(HAIR_STYLES[l.hairStyle])) l.hairStyle = HAIR_STYLES.indexOf(styles[0]);
    const rc = RACES[l.race] || RACES.human;
    const sexRow = rc.sex != null ? '<div class="ccRow"><span>Sex</span><b style="flex:1;text-align:center">' + (rc.sex ? "Female" : "Male") + ' <small style="color:var(--muted)">(' + rc.name + " only)</small></b></div>" : row("build", "Sex", 2, l.build ? "Female" : "Male");
    $("ccLook").innerHTML = row("race", "Race", RACE_ORDER.length, rc.icon + " " + rc.name) + '<div class="sub" style="margin:-2px 0 6px">' + esc(rc.blurb) + "</div>" + sexRow + row("skin", "Skin", SKIN_TONES.length, sw(SKIN_TONES[l.skin])) + row("hairStyle", "Hair", styles.length, HAIR_STYLE_NAMES[HAIR_STYLES[l.hairStyle]] + ' <small style="color:var(--muted)">' + (styles.indexOf(HAIR_STYLES[l.hairStyle]) + 1) + "/" + styles.length + "</small>") + row("hairColor", "Hair colour", HAIR_COLORS.length, sw(HAIR_COLORS[l.hairColor])) + row("height", "Height", 5, BODY_HEIGHT_NAMES[l.height == null ? 2 : l.height]) + row("girth", "Build", 5, BODY_GIRTH_NAMES[l.girth == null ? 2 : l.girth]) + '<div class="ccRow"><button data-rand="1" style="flex:1">🎲 Randomize all</button></div>';
    $("ccLbl").innerHTML = esc(CC.name || "Adventurer") + "<small>" + (RACES[CC.look.race] || RACES.human).name + " " + JOBS[CC.job].name + " Lv.1</small>";
  };
  paint();
  const nm = $("ccName");
  nm.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") create(); });
  nm.addEventListener("input", () => { CC.name = nm.value.replace(/[^A-Za-z' -]/g, "").slice(0, 12); if (nm.value !== CC.name) nm.value = CC.name; $("ccErr").textContent = ""; paint(); });
  setTimeout(() => nm.focus(), 50);
  const create = async () => {
    const name = CC.name.trim().replace(/^./, c => c.toUpperCase());
    const why = validCharName(name, r);
    if (why) { $("ccErr").textContent = why; sfx("error"); nm.focus(); return; }
    const btn = box.querySelector("[data-create]");
    if (btn.disabled) return;
    btn.disabled = true; btn.textContent = "Creating…";
    const id = createChar({ name, job: CC.job, look: CC.look });
    try { await netCreateChar(id, loadChar(id)); }
    catch (e) { deleteChar(id); btn.disabled = false; btn.textContent = "Begin your journey"; $("ccErr").textContent = netErr(e); sfx("error"); return; }
    enterWorld(id, true);
  };
  box.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.job) { CC.job = b.dataset.job; sfx("tab"); paint(); return; }
    if (b.dataset.look) {
      const k = b.dataset.look, d = parseInt(b.dataset.d, 10);
      if (k === "hairStyle") {
        const styles = HAIR_BY_SEX[CC.look.build];
        const i = styles.indexOf(HAIR_STYLES[CC.look.hairStyle]);
        CC.look.hairStyle = HAIR_STYLES.indexOf(styles[(i + d + styles.length) % styles.length]);
      } else if (k === "race") {
        const i = RACE_ORDER.indexOf(CC.look.race || "human");
        CC.look.race = RACE_ORDER[(i + d + RACE_ORDER.length) % RACE_ORDER.length];
        const sx = RACES[CC.look.race].sex;
        if (sx != null && CC.look.build !== sx) { CC.look.build = sx; CC.look.hairStyle = HAIR_STYLES.indexOf(HAIR_BY_SEX[sx][0]); }
      } else {
        const n = { build: 2, skin: SKIN_TONES.length, hairColor: HAIR_COLORS.length, height: 5, girth: 5 }[k];
        const cur = CC.look[k] == null ? (k === "height" || k === "girth" ? 2 : 0) : CC.look[k];
        CC.look[k] = k === "height" || k === "girth" ? clamp(cur + d, 0, n - 1) : (cur + d + n) % n;
        if (k === "build") CC.look.hairStyle = HAIR_STYLES.indexOf(HAIR_BY_SEX[CC.look.build][0]);
      }
      sfx("click"); paint(); return;
    }
    if (b.dataset.rand) { CC.look = randomLook(); sfx("click"); paint(); return; }
    if (b.dataset.back) { UI.creating = false; releasePreview(); sfx("close"); showCharSelect(); return; }
    if (b.dataset.create) create();
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
  log(fresh ? "A new adventure begins. Talk to Captain Rhea for work, Brann to hire companions, Tobin to change jobs, Pell to trade." : "Welcome back, " + save.name + ".", "npc");
  if (S.storageFull) { log("Your browser's storage for this site is full or blocked, so this character won't be saved between visits. Use System → Save to file to keep a copy, or clear space (other games or sites on the same address share it).", "foe"); if (typeof toast === "function") toast("⚠️", "Storage full", "Progress won't be kept. Save to file in System.", "r-epic"); }
  const h = fresh ? { zone: "outpost", x: ZONES.outpost.start.x, y: ZONES.outpost.start.y } : resumePos();
  enterZone(h.zone, h.x, h.y);
  if (h.face != null) player.face = h.face;
  if (save.buddyOut && save.buddy && typeof summonBuddy === "function") summonBuddy();
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
