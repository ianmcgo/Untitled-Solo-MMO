function onKey(e) {
  const k = e.key.toLowerCase();
  if (S.modal) {
    if (k === "escape") closeModal();
    else if (k === "i") { if (S.modal === "items") closeModal(); else openModal("items"); }
    else if (k === "c") { if (S.modal === "status") closeModal(); else openModal("status"); }
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
  if (k === "e" || k === "enter") { talkNearest(); return; }
  if (k === "i") { openModal("items"); return; }
  if (k === "c") { openModal("status"); return; }
  if (k === "k") { openModal("skills"); return; }
  if (k === "r") { toggleMount(); return; }
  if (k === "escape") { if (player.casting) { player.casting = null; log("You stop casting.", "sys"); } else if (player.engaged) toggleEngage(false); else player.target = null; return; }
  if (/^[0-9]$/.test(k)) { const idx = k === "0" ? 9 : parseInt(k, 10) - 1; playerAct(S.macros[idx]); return; }
  if (k.startsWith("arrow")) e.preventDefault();
  S.keys[k] = true;
}

function boot() {
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", e => { S.keys[e.key.toLowerCase()] = false; });
  window.addEventListener("blur", () => { S.keys = {}; });
  $("modal").addEventListener("click", onModalClick);
  $("btnEngage").onclick = () => toggleEngage(true);
  $("btnTarget").onclick = cycleTarget;
  $("btnTalk").onclick = talkNearest;
  $("btnItems").onclick = () => openModal("items");
  $("btnStatus").onclick = () => openModal("status");
  $("btnSettings").onclick = () => openModal("settings");
  $("btnHome").onclick = returnHome;
  if ($("btnMount")) $("btnMount").onclick = toggleMount;
  initView();
  save = loadGame();
  initParty();
  log("Welcome to the Outpost. Talk to Captain Rhea for work, Brann to hire companions, Tobin to change jobs, Pell to trade.", "npc");
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    step(dt);
    age(dt);
    draw(dt);
    updateHud();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

boot();
