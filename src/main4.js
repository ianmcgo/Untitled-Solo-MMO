function onKey(e) {
  if (!UI.started) return;
  const k = e.key.toLowerCase();
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") && e.target.type !== "range") return;
  const menuKeys = { i: "inventory", c: "character", k: "skills", b: "actions", j: "quests", m: "map" };
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
  if (k === "tab") { e.preventDefault(); cycleTarget(); return; }
  if (k === "f") { toggleEngage(false); return; }
  if (k === "enter") { talkNearest(); return; }
  if (menuKeys[k]) { openMenu(menuKeys[k]); return; }
  if (k === "r") { toggleMount(); return; }
  if (k === " " || k === "spacebar") { e.preventDefault(); tryJump(); return; }
  if (k === "[") { setPage(UI.page - 1); return; }
  if (k === "]") { setPage(UI.page + 1); return; }
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
  "<b>Rest.</b> Stand still out of combat and your HP and MP slowly come back.",
  "<b>Check before you fight.</b> A monster's name colour shows how tough it is compared to you.",
  "<b>Skillchains.</b> Use a weapon skill right after an ally's to chain them, then nuke the matching element for a magic burst.",
  "<b>Companions.</b> Brann at the Mercenary Hall hires out fighters, healers and mages for a one-time fee.",
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
  window.addEventListener("keydown", onKey);
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
  loaderProgress(0.25, "Weaving cloth and leather…");
  await frames(1);
  initViewB();
  loaderProgress(0.45, "Reading your journal…");
  await frames(1);
  save = loadGame();
  initParty();
  initHud();
  $("btnEngage").onclick = () => toggleEngage(true);
  $("btnTarget").onclick = () => { cycleTarget(); sfx("select"); };
  $("btnTalk").onclick = talkNearest;
  $("btnHome").onclick = returnHome;
  $("btnMount").onclick = toggleMount;
  $("btnJump").onclick = tryJump;
  log("Welcome to the Outpost. Talk to Captain Rhea for work, Brann to hire companions, Tobin to change jobs, Pell to trade.", "npc");
  loaderProgress(0.55, "Raising the land…");
  await frames(1);
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
  await zoneReady();
  VIEW.booting = false;
  clearInterval(tipTimer);
  const lv = save.jobs[save.mainJob].lv;
  const fresh = lv <= 1 && save.jobs[save.mainJob].xp === 0;
  const ld = $("loading");
  $("ldStart").innerHTML = fresh ? "Begin your journey" : "Continue<small>" + esc(save.name || "Adventurer") + " · " + JOBS[save.mainJob].name + " Lv." + lv + " · " + esc(S.zone.name) + "</small>";
  ld.classList.add("ready");
  const start = () => {
    if (UI.started) return;
    UI.started = true;
    startAudio();
    sfx("zone");
    ld.classList.remove("ready");
    loaderHide();
    zoneTitle(S.zone.name, "");
  };
  $("ldStart").onclick = start;
  window.addEventListener("keydown", e => { if (!UI.started && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); start(); } });
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
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
