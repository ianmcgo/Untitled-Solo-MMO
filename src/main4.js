function onKey(e) {
  const k = e.key.toLowerCase();
  if (UI.confirmOpen) { if (k === "escape") $("confirmBox").querySelector(".no").click(); if (k === "enter") $("confirmBox").querySelector(".yes").click(); e.preventDefault(); return; }
  if (!UI.started) return;
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.type !== "range") return;
  const menuKeys = { i: "inventory", c: "character", k: "skills", b: "actions", j: "quests", m: "map", h: "help", n: "craft", p: "party", y: "bestiary", o: "achievements" };
  if (S.modal) {
    if (k === "escape") closeModal();
    else if (menuKeys[k]) { if (S.modal === menuKeys[k]) closeModal(); else openMenu(menuKeys[k]); }
    return;
  }
  if (S.dialog) {
    if (k === "escape") closeDialog();
    const n = parseInt(k, 10);
    if (n >= 1 && n <= S.dialog.all.length) S.dialog.all[n - 1].fn();
    return;
  }
  if (S.fish && S.fish.state === "bite" && (k === " " || k === "spacebar" || k === "enter" || k === "f")) { e.preventDefault(); reelFish(); return; }
  if (k === "tab") { e.preventDefault(); cycleTarget(); return; }
  if (k === "/") { e.preventDefault(); const ci = $("chatIn"); ci.value = "/"; ci.focus(); return; }
  if (k === "f") { toggleEngage(false); return; }
  if (k === "enter") { talkNearest(); return; }
  if (menuKeys[k]) { openMenu(menuKeys[k]); return; }
  if (k === "r") { toggleMount(); return; }
  if (k === " " || k === "spacebar") { e.preventDefault(); tryJump(); return; }
  if (k === "[") { setPage(UI.page - 1); return; }
  if (k === "]") { setPage(UI.page + 1); return; }
  if (k === "escape" && UI.cmd) { tgtCmdClose(); return; }
  if (k === "escape") {
    if (player.casting) { player.casting = null; log("You stop casting.", "sys"); }
    else if (player.target && !player.engaged) player.target = null;
    else openMenu("character");
    return;
  }
  const code = e.code || "";
  const dm = /^Digit([0-9])$/.exec(code);
  const digit = dm ? dm[1] : /^[0-9]$/.test(k) ? k : null;
  if (digit !== null) {
    const idx = digit === "0" ? 9 : parseInt(digit, 10) - 1;
    activateSlot(e.shiftKey ? 1 - UI.page : UI.page, idx);
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
  loaderShow("UNTITLED SOLO RPG", "A frontier tale");
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
    if (UI.started && !VIEW.loading) {
      if (!S.ko) step(dt);
      age(dt);
      draw(dt);
      updateHud(dt);
      updateAudio();
    } else if (UI.creating && UI.pv) renderPreview(now);
    else if (UI.showcase && UI.pv) renderShowcase(now);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  showTitle();
}

function showTitle() {
  const ld = $("loading");
  ld.classList.add("ready");
  ld.classList.remove("roster", "zone");
  $("ldTitle").textContent = "UNTITLED SOLO RPG";
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
    showCharSelect();
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

function showCharSelect() {
  UI.creating = false;
  const ld = $("loading");
  ld.classList.add("ready", "roster");
  ld.classList.remove("zone");
  $("ldTitle").textContent = "UNTITLED SOLO RPG";
  $("ldSub").textContent = "Choose your character";
  $("ldStart").style.display = "none";
  const r = loadRoster();
  r.chars.sort((a, b) => (b.played || 0) - (a.played || 0));
  let h = '<div class="ccList">';
  for (const c of r.chars) {
    const j = JOBS[c.job] || JOBS.WAR;
    h += '<div class="ccCard" data-id="' + c.id + '"><div class="ccPor" style="background:' + j.color + '22;border-color:' + j.color + '">' + j.icon + '</div><div class="ccInfo"><b>' + esc(c.name) + '</b><span>' + esc(j.name) + " Lv." + c.lv + ' · ' + esc(c.zone) + '</span><small>Last played ' + fmtAgo(c.played || c.created) + '</small></div><div class="ccBtns"><button class="pri" data-play="' + c.id + '">Play</button><button class="del" data-del="' + c.id + '" title="Delete">🗑</button></div></div>';
  }
  if (!r.chars.length) h += '<div class="ccEmpty">No characters yet. Create one to begin your journey.</div>';
  h += "</div>";
  h += '<div class="ccFoot">' + (r.chars.length < MAX_CHARS ? '<button class="pri" data-new="1">＋ New character</button>' : '<span class="sub">Character limit reached (' + MAX_CHARS + ').</span>') + '<span class="sub">' + r.chars.length + " / " + MAX_CHARS + " characters</span></div>";
  const box = $("charSel");
  box.innerHTML = h;
  box.style.display = "block";
  box.onclick = e => {
    const b = e.target.closest("button");
    if (b && b.dataset.play) { enterWorld(b.dataset.play); return; }
    if (b && b.dataset.del) {
      const c = r.chars.find(x => x.id === b.dataset.del);
      if (c) gameConfirm("Delete " + c.name + "?", "This character and everything they own will be gone for good.", () => { deleteChar(c.id); showCharSelect(); }, { yes: "Delete", danger: true });
      return;
    }
    if (b && b.dataset.new) { showCharCreate(); return; }
    const card = e.target.closest(".ccCard");
    if (card) enterWorld(card.dataset.id);
  };
}

function showCharCreate() {
  const r = loadRoster();
  CC.job = "WAR";
  const randomLook = () => {
    const l = { build: Math.floor(Math.random() * 2), skin: Math.floor(Math.random() * SKIN_TONES.length), hairStyle: 0, hairColor: Math.floor(Math.random() * HAIR_COLORS.length), height: Math.floor(Math.random() * 5), girth: Math.floor(Math.random() * 5) };
    const st = HAIR_BY_SEX[l.build];
    l.hairStyle = HAIR_STYLES.indexOf(st[Math.floor(Math.random() * st.length)]);
    return l;
  };
  CC.look = randomLook();
  CC.look.height = 2; CC.look.girth = 2;
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
    $("ccLook").innerHTML = row("build", "Sex", 2, l.build ? "Female" : "Male") + row("skin", "Skin", SKIN_TONES.length, sw(SKIN_TONES[l.skin])) + row("hairStyle", "Hair", styles.length, HAIR_STYLE_NAMES[HAIR_STYLES[l.hairStyle]] + ' <small style="color:var(--muted)">' + (styles.indexOf(HAIR_STYLES[l.hairStyle]) + 1) + "/" + styles.length + "</small>") + row("hairColor", "Hair colour", HAIR_COLORS.length, sw(HAIR_COLORS[l.hairColor])) + row("height", "Height", 5, BODY_HEIGHT_NAMES[l.height == null ? 2 : l.height]) + row("girth", "Build", 5, BODY_GIRTH_NAMES[l.girth == null ? 2 : l.girth]) + '<div class="ccRow"><button data-rand="1" style="flex:1">🎲 Randomize all</button></div>';
    $("ccLbl").innerHTML = esc(CC.name || "Adventurer") + "<small>" + JOBS[CC.job].name + " Lv.1</small>";
  };
  paint();
  const nm = $("ccName");
  nm.addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") create(); });
  nm.addEventListener("input", () => { CC.name = nm.value.replace(/[^A-Za-z' -]/g, "").slice(0, 12); if (nm.value !== CC.name) nm.value = CC.name; $("ccErr").textContent = ""; paint(); });
  setTimeout(() => nm.focus(), 50);
  const create = () => {
    const name = CC.name.trim().replace(/^./, c => c.toUpperCase());
    const why = validCharName(name, r);
    if (why) { $("ccErr").textContent = why; sfx("error"); nm.focus(); return; }
    const id = createChar({ name, job: CC.job, look: CC.look });
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
  await zoneReady();
  VIEW.booting = false;
  UI.started = true;
  UI.entering = false;
  sfx("zone");
  loaderHide();
  zoneTitle(S.zone.name, fresh ? "Your story begins" : "");
  initVersionCheck();
}

function logoutToSelect() {
  saveGame();
  const r = loadRoster();
  r.current = null;
  saveRoster(r);
  location.reload();
}

boot();
