function openMenu(tab) {
  tab = TAB_ALIAS[tab] || tab || "character";
  const was = !!S.modal;
  if (!was) UI.menuFromMain = !!UI.mm;
  if (S.dialog) closeDialog();
  UI.hov = null; UI.modalHelp = null; if (tab !== S.modal) { UI.kbRow = null; UI.kbBtn = null; } if (tab === "quests" && !was) { UI.qCat = null; UI.qSel = null; } if (tab === "shop" && S.modal !== "shop") UI.shopMode = "buy";
  S.modal = tab;
  $("menu").style.display = "block";
  $("ui").classList.add("modalOn");
  S.keys = {};
  if (typeof VIEW !== "undefined" && VIEW.joy) { VIEW.joy.active = false; VIEW.joy.x = 0; VIEW.joy.y = 0; $("joy").style.display = "none"; }
  UI.sel = null; UI.pick = null; UI.cmp = null;
  renderModal();
  sfx(was ? "tab" : "open");
}
function openModal(tab) { openMenu(tab); }
function closeModal() {
  if (!S.modal) return;
  if (S.modal === "trade" && typeof NET_PT !== "undefined" && NET_PT.trade) { S.modal = null; netTradeCancel(); S.modal = "trade"; }
  if (S.modal === "character") releasePreview();
  S.modal = null;
  $("menu").style.display = "none";
  $("ui").classList.remove("modalOn");
  sfx("close");
}

function menuSig() {
  return [typeof netPartySig === "function" ? netPartySig() : "", typeof NET_LS !== "undefined" ? NET_LS.at + ":" + !!NET_LS.invite + ":" + NET_RT.online.map(o => o && o.name + o.zone + o.lv + o.lfg).join() + save.friends.join() + save.blocked.join() + save.lfg : "", save.buddy, save.buddyOut, save.buddies.length, JSON.stringify(save.buddyNames), JSON.stringify(save.market.listings.length), save.market.box.length, marketTick(), JSON.stringify(save.guild), save.mountCoat, save.saddle, JSON.stringify(save.augments), save.board.done.length, save.stance, JSON.stringify(save.mercGear), JSON.stringify(save.oldFriends), Math.floor((save.playSec || 0) / 60), UI.mercSheet, JSON.stringify(save.mercInv), Object.keys(save.bestiary).length, Object.keys(save.ach).length, save.gil, save.inventory.map(s => s.id + s.qty).join(), Object.values(save.gear).join(), player.lv, save.mainJob, save.subJob, S.party.length, save.mountLicense, JSON.stringify(save.quests), S.zoneId, save.storage.length, save.furniture.length, JSON.stringify(save.gardens), JSON.stringify(save.crafts), !!player.synth].join("|");
}
function updateMenu(now) {
  if (S.modal === "character") renderPreview(now);
  if (S.modal === "map" && now - (UI.mapAt || 0) > 250) { UI.mapAt = now; drawZoneMap(); }
  if (now - UI.menuSigAt > 400) {
    UI.menuSigAt = now;
    const sig = menuSig();
    if (sig !== UI.menuSig && S.modal !== "settings") renderModal();
  }
}

function renderModal() {
  if (!S.modal) return;
  UI.menuSig = menuSig();
  const tabs = MAIN_TABS.slice();
  for (const t of ["shop", "job", "mercs", "storage", "home", "furnishings", "forge", "board", "guild", "auction", "pets", "stable", "rename", "admin"]) if (S.modal === t) tabs.unshift(t);
  if (S.modal === "trade" || (typeof NET_PT !== "undefined" && NET_PT.trade)) tabs.unshift("trade");
  for (const t of ["help", "updates", "system", "credits"]) if (S.modal === t) tabs.push(t);
  $("mNav").innerHTML = '<div class="ttl">LEID\'ANAV REBORN</div>' + tabs.map(t => '<button data-tab="' + t + '"' + (t === S.modal ? ' class="on"' : "") + "><span>" + TAB_INFO[t][1] + "</span>" + TAB_INFO[t][0] + (TAB_INFO[t][2] ? '<span class="k">' + TAB_INFO[t][2] + "</span>" : "") + "</button>").join("") + '<button class="x" data-tab="close">✕ Close</button>';
  $("mHead").innerHTML = "<h2>" + TAB_INFO[S.modal][0] + '</h2><span class="meta">💠 ' + save.gil + " crystals · " + save.inventory.length + "/" + CONFIG.inventorySize + ' bag</span><button class="close" data-tab="close">✕</button>';
  const R = { character: tabCharacter, inventory: tabInventory, skills: tabSkills, actions: tabActions, quests: tabQuests, map: tabMap, help: tabHelp, updates: tabUpdates, settings: tabSettings, system: tabSystem, shop: tabShop, job: tabJob, mercs: tabMercs, party: tabParty, forge: tabForge, board: tabBoard, admin: tabAdmin, guild: tabGuild, auction: tabAuction, pets: tabPets, trade: tabTrade, equipment: tabEquipment, magic: tabMagic, abilities: tabAbilities, keyitems: tabKeyItems, social: tabSocial, stable: tabStable, rename: tabRename, database: tabDatabase, achievements: tabAchievements, storage: tabStorage, home: tabHome, furnishings: tabFurnishings, credits: tabCredits, craft: tabCraft }[S.modal];
  $("mBody").innerHTML = R ? R() : "";
  if (UI.kbBtn != null && !isSlim(S.modal) && S.modal !== "equipment") { const b = [...document.querySelectorAll(KB_SEL)].filter(x => x.offsetParent)[UI.kbBtn]; if (b) b.classList.add("kb"); }
  if (UI.kbRow != null && isSlim(S.modal)) { const rows = document.querySelectorAll("#mBody .lr:not(.empty)"); if (rows[UI.kbRow]) rows[UI.kbRow].classList.add("kb"); }
  const win = document.querySelector("#menu .win");
  if (win) win.className = "win" + (isSlim(S.modal) ? " slim slim-" + S.modal : "") + (S.modal === "equipment" ? " wide" : "") + (S.modal === "auction" || S.modal === "achievements" ? " fit" : "");
  renderMCard();
  if (S.modal === "character") attachPreview();
  if (S.modal === "map") { UI.mapAt = 0; drawZoneMap(); }
  const li = $("loadInput");
  if (li) li.onchange = onLoadFile;
}

function statsFor(gear) {
  const ch = Object.assign({}, player, { gear, hp: null, mp: null, stats: null });
  buildStats(ch);
  return ch.stats;
}
const STAT_ROWS = [["maxHp", "HP"], ["maxMp", "MP"], ["str", "STR"], ["dex", "DEX"], ["vit", "VIT"], ["agi", "AGI"], ["int", "INT"], ["mnd", "MND"], ["att", "Attack"], ["acc", "Accuracy"], ["def", "Defense"], ["eva", "Evasion"], ["dmg", "Weapon DMG"], ["delay", "Delay"]];
function statDeltaHTML(base, next, compact) {
  const out = [];
  for (const [k, l] of STAT_ROWS) {
    const d = Math.round((next[k] - base[k]) * 100) / 100;
    if (!d) continue;
    const good = k === "delay" ? d < 0 : d > 0;
    out.push('<span class="' + (good ? "up" : "dn") + '">' + l + " " + (d > 0 ? "+" : "") + d + "</span>");
  }
  return out.length ? out.join(compact ? " " : "") : '<span class="sub">No stat change</span>';
}

function ffStatusBlock() {
  const p = player, j = save.jobs[save.mainJob], need = xpNeed(j.lv);
  const gear = SLOTS.map(sl => save.gear[sl]).filter(id => id && ITEMS[id] && ITEMS[id].kind === "equip");
  const ilv = gear.length ? Math.round(gear.reduce((n, id) => n + (ITEMS[id].lv || 1), 0) / gear.length) : 0;
  const row = (l, v, cls) => '<div class="ffr' + (cls ? " " + cls : "") + '"><em>' + l + "</em><b>" + v + "</b></div>";
  let h = '<div class="ffStatus">';
  h += '<div class="ffr nm"><b>' + esc(save.name || "Adventurer") + "</b></div>";
  h += row("Lv" + p.lv, esc(JOBS[p.job].name));
  if (p.sub && JOBS[p.sub]) h += row("Lv" + Math.floor(p.lv / 2), esc(JOBS[p.sub].name));
  h += row("Ilv", ilv + ' <span class="su">Su —</span>');
  h += '<div class="ffsep"></div>' + row("HP", Math.ceil(p.hp) + " / " + p.maxHp, "hp") + row("MP", Math.floor(p.mp) + " / " + p.maxMp, "mp") + row("TP", Math.floor(p.tp), "tp");
  h += '<div class="ffsep"></div>';
  for (const [k, l] of [["str", "STR"], ["dex", "DEX"], ["vit", "VIT"], ["agi", "AGI"], ["int", "INT"], ["mnd", "MND"], ["chr", "CHR"]]) h += row(l, p.stats[k] != null ? p.stats[k] : "—", "at");
  h += '<div class="ffsep"></div>' + row("Level", j.lv) + row("EXP", need ? j.xp : "—") + row("NEXT LEVEL", need ? need - j.xp : "MAX", "nx");
  return h + "</div>";
}

function ffJobLevels() {
  const known = Object.keys(JOBS).filter(j => !JOBS[j].advanced || (save.jobsUnlocked && save.jobsUnlocked[j]));
  let h = '<div class="ffStatus ffJobs"><div class="ffHead"><span>Job Levels</span></div><div class="ffJG">';
  for (const j of known) {
    const lv = save.jobs[j] ? save.jobs[j].lv : 1;
    h += '<div class="ffr' + (j === save.mainJob ? " main" : j === save.subJob ? " sub" : "") + '"><em>' + esc(JOBS[j].name) + "</em><b>" + lv + "</b></div>";
  }
  return h + "</div></div>";
}

function orbRow(a, v, col, name, right, help, off) {
  return '<button class="lr' + (off ? " dim" : "") + '" data-a="' + a + '" data-v="' + v + '" data-hs="' + esc(help || "") + '"><span class="cur">➤</span><span class="orb" style="--oc:' + col + '"></span><span class="nm">' + esc(name) + "</span>" + (right != null ? '<span class="rt">' + right + "</span>" : "") + "</button>";
}
function tabMagic() {
  UI.modalHelp = UI.modalHelp || "Select a spell.";
  const acts = actionList(player).filter(a => a.kind === "ma");
  if (!acts.length) return '<div class="lHead"><button data-a="slimclose">✕ Close</button></div><div class="lList"><div class="lr empty"><span class="nm">Your current jobs know no magic.</span></div></div>';
  let h = '<div class="lHead"><button data-a="slimclose">✕ Close</button></div><div class="lList">';
  for (const a of acts) { const sp = SPELLS[a.id], rc = recastLeft(player, "ma:" + a.id); h += orbRow("mcast", a.id, ELEMENT_COLORS[sp.element] || "#9fe8ff", sp.name, rc > 0 ? Math.ceil(rc) + "s" : sp.mp + " MP", sp.desc || sp.name, sp.mp > player.mp); }
  return h + "</div>";
}

function tabAbilities() {
  UI.modalHelp = UI.modalHelp || "Select an ability.";
  const acts = actionList(player).filter(a => a.kind === "ja" || a.kind === "ws");
  let h = '<div class="lHead"><button data-a="slimclose">✕ Close</button></div><div class="lList">';
  if (!acts.length) h += '<div class="lr empty"><span class="nm">None yet.</span></div>';
  for (const a of acts) { const rc = a.kind === "ja" ? recastLeft(player, "ja:" + a.id) : 0; h += orbRow("mact", a.kind + ":" + a.id, a.kind === "ws" ? "#ffb070" : "#b0ffb0", actName(a), rc > 0 ? Math.ceil(rc) + "s" : a.kind === "ws" ? "1000 TP" : "", cmdHelpOf(a), a.kind === "ws" && player.tp < 1000); }
  return h + "</div>";
}

function tabKeyItems() {
  const ks = (save.keyItems || []).filter(id => ITEMS[id]);
  let h = '<div class="ffStatus ffSk" style="max-width:520px"><div class="ffHead"><span>Key Items</span></div>';
  if (!ks.length) h += '<div class="mcR empty"><span class="nm dim">No key items yet.</span></div>';
  for (const id of ks) h += '<div class="mcR"><span class="ic">' + (ITEMS[id].icon || "🗝️") + '</span><span class="nm" title="' + esc(ITEMS[id].desc || "") + '">' + esc(ITEMS[id].name) + "</span></div>";
  return h + "</div>";
}

function tabCharacter() {
  let h = '<div class="ffPanels">' + ffStatusBlock() + ffJobLevels() + "</div>";
  if (typeof appearanceHTML === "function") h += appearanceHTML();
  return h;
}

const STAT_LABEL_CARD = { def: "DEF", hp: "HP", mp: "MP", str: "STR", dex: "DEX", vit: "VIT", agi: "AGI", int: "INT", mnd: "MND", chr: "CHR", att: "Attack", acc: "Accuracy", eva: "Evasion" };
function itemCard(id) {
  const it = ITEMS[id];
  if (!it) return "";
  const tags = [];
  if (it.rare) tags.push("Rare");
  if (it.ex) tags.push("Ex");
  let h = '<div class="iCard"><div class="iCh"><span class="ic">' + (it.icon || "📦") + '</span><b>' + esc(it.name) + "</b>" + tags.map(t => '<span class="tg">' + t + "</span>").join("") + "</div>";
  if (it.kind === "equip") {
    h += '<div class="iCl">[' + (SLOT_NAMES[it.slot] || it.slot) + "] " + (it.race ? RACES[it.race].name + " only" : "") + "</div>";
    const parts = [];
    if (it.wtype) parts.push("DMG:" + it.dmg, "Delay:" + Math.round(it.delay * 100));
    const st = it.stats || {};
    if (st.def) parts.push("DEF:" + st.def);
    for (const k of ["hp", "mp", "str", "dex", "vit", "agi", "int", "mnd", "chr", "att", "acc", "eva"]) if (st[k]) parts.push(STAT_LABEL_CARD[k] + (st[k] > 0 ? "+" : "") + st[k]);
    for (const el of RES_ELEMENTS) if (st["res_" + el]) parts.push(el.charAt(0).toUpperCase() + el.slice(1) + " Res+" + st["res_" + el]);
    if (augText(id)) parts.push(augText(id));
    if (parts.length) h += '<div class="iCl">' + esc(parts.join(" ")) + "</div>";
    if (it.desc) h += '<div class="iCl q">"' + esc(it.desc) + '"</div>';
    const jobs = it.jobs.length >= ALL_JOBS.length ? "All Jobs" : it.jobs.join("/");
    h += '<div class="iCl"><span class="' + (it.lv > player.lv ? "bad" : "") + '">Lv.' + (it.lv || 1) + "</span> " + esc(jobs) + '</div><div class="iLv">&lt;Item Level:' + (it.lv || 1) + "&gt;</div>";
  } else h += '<div class="iCl">' + esc(itemDesc(id)) + "</div>";
  return h + "</div>";
}

function tabEquipment() {
  UI.eq = UI.eq || { slot: null, hover: null };
  const q = UI.eq, st = player.stats;
  let h = '<div class="eqW"><div class="eqL">' + statusLeftHTML(true) + '<div class="stBox gilB"><em>Crystals</em><b>' + save.gil.toLocaleString() + '</b></div></div><div class="eqWrap"><div class="eqBox"><div class="eqGrid">';
  for (const sl of SLOTS) {
    const id = save.gear[sl];
    h += '<button class="eqS' + (q.slot === sl ? " sel" : "") + (id ? " on" : "") + '" data-a="eqslot" data-v="' + sl + '" title="' + (id ? esc(ITEMS[id].name) : SLOT_NAMES[sl]) + '">' + (id ? '<span class="ic">' + (ITEMS[id].icon || "📦") + "</span>" : '<span class="lbl">' + SLOT_NAMES[sl] + "</span>") + "</button>";
  }
  h += '</div><div class="eqStats"><span>Attack <b>' + st.att + "</b></span><span>Defense <b>" + st.def + '</b></span></div><div class="eqRes">';
  for (const el of RES_ELEMENTS) h += '<span title="' + el + ' resistance"><i style="background:' + ELEMENT_COLORS[el] + '"></i>' + (st["res_" + el] || 0) + "</span>";
  h += "</div></div>";
  h += '<div class="eqSide' + (q.slot ? " two" : "") + '">';
  if (!q.slot) h += '<div class="iCard"><div class="iCl">Choose an equipment box to change what goes there.</div></div>';
  else {
    const cur = save.gear[q.slot];
    const fits = [...new Set(save.inventory.map(x => x.id))].filter(id => ITEMS[id].kind === "equip" && slotKeys(ITEMS[id].slot).includes(q.slot));
    h += '<div class="eqPop' + (q.list ? " kbl" : "") + '"><div class="eqPH">' + SLOT_NAMES[q.slot] + "</div>";
    if (cur) h += '<button class="mcR" data-a="equnq" data-v="' + q.slot + '"><span class="ic">✕</span><span class="nm">Remove ' + esc(ITEMS[cur].name) + "</span></button>";
    for (const id of fits) { const why = canEquip(id); h += '<button class="mcR' + (q.hover === id ? " hv" : "") + '" data-a="eqpick" data-v="' + id + '"><span class="ic">' + (ITEMS[id].icon || "📦") + '</span><span class="nm' + (why ? " dim" : "") + '">' + esc(ITEMS[id].name) + "</span>" + (why ? '<span class="q bad">' + esc(why.replace("Requires ", "")) + "</span>" : "") + "</button>"; }
    if (!fits.length && !cur) h += '<div class="mcR empty"><span class="nm dim">Nothing in your bag fits here.</span></div>';
    h += '</div><div class="eqCards">';
    if (q.hover && ITEMS[q.hover]) { h += itemCard(q.hover); if (cur) h += '<div class="eqArrow">▼</div>' + itemCard(cur); if (!canEquip(q.hover)) h += '<button class="pri" data-a="eqpick" data-v="' + q.hover + '" style="margin-top:6px">Equip</button>'; }
    else if (cur) h += itemCard(cur);
    h += "</div>";
  }
  return h + "</div></div></div>";
}

function attachPreview(wrapId) {
  const wrap = $(wrapId || "pvWrap");
  if (!wrap || typeof THREE === "undefined") return;
  if (!UI.pv) {
    try {
      const canvas = document.createElement("canvas");
      canvas.id = "pvCanvas";
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.25;
      const scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x3a2d22, 1.4));
      const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(2, 4, 3); scene.add(key);
      const rim = new THREE.DirectionalLight(0x9fc3ff, 1.6); rim.position.set(-3, 2.5, -3); scene.add(rim);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 40), new THREE.MeshStandardMaterial({ color: 0x2b2f42, roughness: 0.9 }));
      disc.rotation.x = -Math.PI / 2; scene.add(disc);
      const cam = new THREE.PerspectiveCamera(30, 0.75, 0.1, 50);
      UI.pv = { r, scene, cam, canvas, sig: null, holder: null, rot: 0.5, drag: null, last: 0, ent: null, view: null };
      canvas.addEventListener("pointerdown", e => { UI.pv.drag = e.clientX; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener("pointermove", e => { if (UI.pv.drag != null) { UI.pv.rot += (e.clientX - UI.pv.drag) * 0.012; UI.pv.drag = e.clientX; UI.pv.spinPause = performance.now(); } });
      canvas.addEventListener("pointerup", () => { UI.pv.drag = null; });
      canvas.addEventListener("pointercancel", () => { UI.pv.drag = null; });
    } catch (e) { UI.pv = { failed: true }; }
  }
  if (UI.pv.failed) return;
  wrap.insertBefore(UI.pv.canvas, wrap.firstChild);
  UI.pv.sized = 0;
}

function releasePreview() {
  const pv = UI.pv;
  if (!pv || pv.failed) return;
  try {
    if (pv.holder) { pv.scene.remove(pv.holder); pv.view && pv.view.mat && pv.view.mat.dispose(); }
    pv.r.dispose();
    pv.r.forceContextLoss();
    if (pv.canvas.parentNode) pv.canvas.parentNode.removeChild(pv.canvas);
  } catch (e) {}
  UI.pv = null;
}

function previewEntity(o) {
  const job = o ? o.job : player.job;
  const gear = o ? o.gear : save.gear;
  const wt = gear.main && ITEMS[gear.main] ? ITEMS[gear.main].wtype : "h2h";
  const stats = o ? { wtype: wt, dmg: 1, acc: 1, eva: 1, att: 1, def: 1, str: 1, dex: 1, vit: 1, agi: 1, int: 1, mnd: 1, maxHp: 1, maxMp: 1 } : player.stats;
  return { kind: "pc", job, sub: o ? null : player.sub, lv: o ? 1 : player.lv, gear: Object.assign({}, gear), alive: true, engaged: false, casting: null, moving: false, mounted: false, x: 0, y: 0, face: 0, lastSwing: -9, lastHit: -9, lastWS: -9, buffs: {}, tp: 0, hp: 1, maxHp: 1, mp: 0, maxMp: 0, radius: 14, regenerating: false, stats, swingTimer: 2, delay: o ? 3 : player.delay, resting: false };
}
function lookBase(look) { return baseFromLook(look); }
function renderPreview(now) {
  const pv = UI.pv;
  if (!pv || pv.failed || !pv.canvas.isConnected) return;
  const dt = Math.min(0.05, (now - (pv.last || now)) / 1000);
  pv.last = now;
  const w = pv.canvas.clientWidth, h = pv.canvas.clientHeight;
  if (!w || !h) return;
  if (pv.sized !== w * 10000 + h) { pv.sized = w * 10000 + h; pv.r.setSize(w, h, false); pv.cam.aspect = w / h; pv.cam.updateProjectionMatrix(); }
  const o = pv.override;
  const L = o ? lookFor(o.job, o.gear, lookBase(o.look), o.lv, true) : lookFor(player.job, save.gear, playerBase(), player.lv, true);
  const sig = stableKey(L) + (o ? "|cc" : "");
  if (sig !== pv.sig) {
    if (pv.holder) { pv.scene.remove(pv.holder); pv.view && pv.view.mat && pv.view.mat.dispose(); }
    const entry = entryFor("h|" + sig, () => humanEntry(L));
    const inst = instantiate(entry);
    const holder = new THREE.Group();
    holder.add(inst.mesh);
    const weapon = makeWeapon(L.weapon, L.weaponId);
    pv.view = { group: holder, mesh: inst.mesh, bones: inst.bones, mat: inst.mat, meta: inst.meta, kind: "human", weapon, weaponKind: L.weapon, alwaysDrawn: false, weaponDrawn: null, style: "pc", stride: 1.7, scale: 1, mount: null, sink: 0 };
    pv.ent = previewEntity(o);
    pv.scene.add(holder);
    pv.holder = holder;
    pv.sig = sig;
    pv.top = inst.meta.headTop || 1.8; pv.hc = inst.meta.headC || pv.top - 0.17; pv.hr = inst.meta.headR || 0.14;
  }
  { const top = pv.top || 1.8, ft = (UI.creating && ccTouch()) ? 0 : (pv.focus || 0); if (ft === 0 && UI.creating && ccTouch()) pv.fz = 0; pv.fz = (pv.fz == null ? ft : pv.fz) + (ft - (pv.fz == null ? ft : pv.fz)) * Math.min(1, (dt || 0.016) * 5); const f = pv.fz; const fy = (pv.hc || top - 0.17) - (pv.hr || 0.14) * 0.25, fz = (pv.hr || 0.14) * 7.8; const wm = Math.min(1.9, Math.max(1, 0.7 / (pv.cam.aspect || 0.75))); pv.cam.position.set(0, top * (0.62 + 0.33 * f) * (1 - f) + (fy + 0.01) * f, top * 2.15 * wm * (1 - f) + fz * f); pv.cam.lookAt(0, top * (0.5 - 0.1 * (wm - 1) / 0.9) * (1 - f) + fy * f, 0); }
  if (UI.creating) { if (pv.rot === undefined || pv.spinInit !== 1) { pv.spinInit = 1; pv.rot = 0; } }
  else if (pv.focus && (!pv.spinPause || now - pv.spinPause > 2500)) { const tgt = Math.round(pv.rot / (Math.PI * 2)) * Math.PI * 2; pv.rot += (tgt - pv.rot) * Math.min(1, dt * 3); }
  else if (!pv.spinPause || now - pv.spinPause > 2500) pv.rot += dt * 0.35;
  pv.holder.rotation.y = pv.rot;
  try { poseHuman(pv.view, pv.ent, dt || 0.016); placeWeapon(pv.view, pv.ent); } catch (e) {}
  pv.r.render(pv.scene, pv.cam);
}

const LORE = {
  goblin: ["Goblins raid the Outpost's supply crates and carry what they steal in grimy pouches.", "A goblin's bomb toss hurts everyone near the target. Spread out."],
  den_goblin: ["Goblin Raiders are the Den's veterans: better armed, and they always come in groups.", "Raiders carry iron ore from the Den's tunnels."],
  bat: ["Cave Bats stir at nightfall and hunt by sound. Stand still and they pass you by.", "Bat wings go into Clothcraft and Alchemy."],
  worm: ["Tunnel Worms sense magic. They're slow, tough, and spin silk worth selling.", "Worms are about day and night; the hares aren't."],
  ghoul: ["Ghouls smell weakness. A party with low HP draws them from across a chamber.", "Light and fire burn the undead. Banish and Fire hit ghouls hard."],
  skeleton: ["Wandering Bones walk the Old Fort Ruins by night and the Crypt at all hours.", "Bone chips from the dead go into advanced recipes."],
  hare: ["Meadow Hares graze by day and never start a fight. Good first targets.", "Hares carry healing herbs, which the Tradesman and Ysolde both want."],
  chieftain: ["The Goblin Chieftain rules the back of the Den. His Goblin Rush is three quick strikes; keep the healer back.", "His cap is a trophy few wear."],
  grimtooth: ["Grimtooth leads the goblin camp in eastern Rocky Hollow. He appears among his gang now and then.", "Notorious monsters stay down for minutes of real time after they fall."],
  duskwing: ["Duskwing haunts the Old Fort Ruins on dark nights. Faster and far harder to hit than any bat.", "Its boots make the wearer lighter on their feet."],
  king_wiggles: ["King Wiggles burrows beneath Burrow Flats by day. Twice the worm, twice the silk.", "Its gloves are prized by mages."],
  ossuary_warden: ["The Ossuary Warden keeps the Bone Pit of the Goblin Den. Its hood hides eyes that glow green.", "The Warden's Robe is the best mage body in the land."],
  crypt_sentinel: ["The Crypt Sentinel guards the key to the Hollow King's throne room.", "Its great axe sweeps the whole room: don't bunch up."],
  hollow_king: ["The Hollow King stirs the dead of Ashenreach from his throne under the Den.", "At two thirds and one third of his health he calls Royal Guards; below a fifth he enrages."],
  royal_guard: ["Royal Guards rise at the Hollow King's call and fall when he does."],
  rhea: ["Captain Rhea commands the Outpost's garrison and pays bounties on goblins and worse.", "Rhea turns in at 22:00 and is back on the plaza at dawn."],
  tobin: ["Tobin, Job Master, teaches support jobs at level 10 and the advanced jobs at level 6. Change jobs with Pip at your residence.", "Tobin is early to bed, early to rise: 20:00 to 7:00."],
  brann: ["Brann runs the Mercenary Hall. Five new fighters arrive every day, and a companion who falls is gone for good.", "Brann drinks till 23:00 and is up by half past seven."],
  ysolde: ["Ysolde, Stablemaster, issues riding licenses for the Thornstrider at level 20.", "Ysolde beds down with the beasts at 19:30."],
  odette: ["Odette sells furnishings for your residence, and her cousin Pip keeps it.", "Odette closes up at 21:30."]
};
const LORE_KEYS = Object.keys(LORE);

function showcaseEntity(key) {
  if (NPC_LOOK[key]) return { kind: "npc", id: key, name: NPCS[key] ? NPCS[key].name : key, alive: true, x: 0, y: 0, face: 0, buffs: {}, lastSwing: -9, lastHit: -9, lastWS: -9, resting: false, moving: false, casting: null };
  const f = famOf(key);
  if (!f) return null;
  return { kind: "mob", famKey: key, fam: f, name: f.name, lv: 1, alive: true, state: "idle", x: 0, y: 0, face: 0, buffs: {}, radius: f.radius, lastSwing: -9, lastHit: -9, lastWS: -9, tp: 0, hp: 1, maxHp: 1, mp: 0, maxMp: 0, moving: false, casting: null, readying: null, enmity: new Map(), stats: { wtype: "sword", dmg: 1, acc: 1, eva: 1, att: 1, def: 1 }, swingTimer: 2, delay: 3 };
}

function renderShowcase(now) {
  const pv = UI.pv;
  if (!pv || pv.failed || !pv.canvas.isConnected || !UI.showcase) return;
  const dt = Math.min(0.05, (now - (pv.last || now)) / 1000);
  pv.last = now;
  const w = pv.canvas.clientWidth, h = pv.canvas.clientHeight;
  if (!w || !h) return;
  if (pv.sized !== w * 10000 + h) { pv.sized = w * 10000 + h; pv.r.setSize(w, h, false); pv.cam.aspect = w / h; pv.cam.updateProjectionMatrix(); }
  const sc = UI.showcase;
  if (pv.sig !== "show:" + sc.key) {
    if (pv.holder) { pv.scene.remove(pv.holder); pv.view && pv.view.mat && pv.view.mat.dispose(); }
    const e = showcaseEntity(sc.key);
    const inst = buildEntityRig(e);
    if (!inst) return;
    const holder = new THREE.Group();
    holder.add(inst.mesh);
    const s = e.kind === "mob" ? (e.fam.scale || 1) : 1;
    holder.scale.setScalar(s);
    pv.view = { group: holder, mesh: inst.mesh, bones: inst.bones, mat: inst.mat, meta: inst.meta, kind: inst.meta.kind, weapon: inst.weapon, weaponKind: inst.weaponKind, alwaysDrawn: inst.alwaysDrawn, weaponDrawn: null, style: styleFor(e), stride: 1.7, scale: s, mount: null, sink: 0 };
    pv.ent = e;
    pv.scene.add(holder);
    pv.holder = holder;
    pv.sig = "show:" + sc.key;
    const top = (inst.meta.headTop || 1.8) * s;
    pv.cam.position.set(0, top * 0.6, top * 2.2);
    pv.cam.lookAt(0, top * 0.48, 0);
    pv.rot = 0.6;
  }
  pv.rot += dt * 0.5;
  pv.holder.rotation.y = pv.rot;
  try {
    const v = pv.view, e = pv.ent;
    if (v.kind === "human") { poseHuman(v, e, dt); placeWeapon(v, e); }
    else if (v.kind === "bat") poseBat(v, e, dt);
    else if (v.kind === "worm") poseWorm(v, e, dt);
    else if (v.kind === "hare") poseHare(v, e, dt);
    else if (v.kind === "rarab") poseRarab(v, e, dt);
  } catch (err) {}
  pv.r.render(pv.scene, pv.cam);
}

function startShowcase() {
  const wrap = $("ldPv");
  if (!wrap || typeof attachPreview !== "function" || !RIG.atlas) return;
  if (UI.showcase) return;
  attachPreview("ldPv");
  if (!UI.pv || UI.pv.failed) return;
  const key = LORE_KEYS[Math.floor(Math.random() * LORE_KEYS.length)];
  const lines = LORE[key];
  UI.showcase = { key, text: lines[Math.floor(Math.random() * lines.length)] };
  UI.pv.override = null;
  UI.pv.sig = null;
  const e = showcaseEntity(key);
  $("ldPvName").textContent = e ? e.name : "";
  $("ldPvText").textContent = UI.showcase.text;
  wrap.style.display = "block";
}
function stopShowcase() {
  const was = !!UI.showcase;
  UI.showcase = null;
  const wrap = $("ldPv");
  if (wrap) wrap.style.display = "none";
  if (was) releasePreview();
}

function invSorted() {
  return save.inventory.map((s, i) => ({ s, i })).filter(({ s }) => {
    const it = ITEMS[s.id];
    if (UI.filter === "use") return it.kind === "use" || it.kind === "food";
    if (UI.filter === "gear") return it.kind === "equip";
    if (UI.filter === "mat") return it.kind === "mat" || it.kind === "crystal" || it.kind === "tool";
    if (UI.filter === "rare") return it.rare || it.ex || it.kind === "furniture" || ["rare", "epic"].includes(itemRarity(s.id));
    return true;
  }).sort((x, y) => (KIND_ORDER[ITEMS[x.s.id].kind] - KIND_ORDER[ITEMS[y.s.id].kind]) || ITEMS[x.s.id].name.localeCompare(ITEMS[y.s.id].name));
}
const KB_SEL = "#mBody button[data-a]:not([disabled]), #mBody [data-a].mcR, #mBody a[data-a], #mBody .item[data-a]";
const SLIM_TABS = { inventory: 1, shop: 1, quests: 1, magic: 1, abilities: 1 };
function isSlim(t) { return !!SLIM_TABS[t] || (t === "storage" && !(S.zoneId === "residence")); }
function listRow(a, v, id, qty, name, right, sel, cls) {
  return '<button class="lr' + (sel ? " sel" : "") + (cls ? " " + cls : "") + '" data-a="' + a + '" data-v="' + v + '"' + (id ? ' data-hv="' + id + '"' : "") + '><span class="cur">➤</span>' + (qty != null ? '<span class="lq">' + (qty > 1 ? qty : "") + "</span>" : "") + '<span class="ic">' + (id && ITEMS[id] ? ITEMS[id].icon || "📦" : "•") + '</span><span class="nm">' + esc(name) + "</span>" + (right != null ? '<span class="rt">' + right + "</span>" : "") + "</button>";
}
function tabInventory() {
  UI.modalHelp = "Select an item.";
  const tabs = '<button data-a="invview" data-v="bag"' + (UI.invView !== "keys" ? ' class="on"' : "") + '>Items</button><button data-a="invview" data-v="keys"' + (UI.invView === "keys" ? ' class="on"' : "") + ">Key Items</button>";
  if (UI.invView === "keys") {
    const ks = (save.keyItems || []).filter(id => ITEMS[id]);
    let k = '<div class="lHead">' + tabs + '<button data-a="slimclose">✕ Close</button></div><div class="lList">';
    if (!ks.length) k += '<div class="lr empty"><span class="nm">No key items yet.</span></div>';
    for (const id of ks) k += listRow("noop", id, id, null, ITEMS[id].name, null, false, "");
    return k + "</div>";
  }
  let list = invSorted();
  if (UI.slotFilter) list = list.filter(({ s }) => ITEMS[s.id].kind === "equip" && slotKeys(ITEMS[s.id].slot).includes(UI.slotFilter));
  let h = '<div class="lHead">' + (UI.sel != null && save.inventory[UI.sel] ? '<button data-a="dropsel">Drop</button>' : "") + tabs + '<button data-a="slimclose">✕ Close</button></div><div class="lList">';
  if (!list.length) h += '<div class="lr empty"><span class="nm">Your bag is empty.</span></div>';
  for (const { s, i } of list) h += listRow("isel", i, s.id, s.qty, ITEMS[s.id].name, null, UI.sel === i, rarityOf(s.id));
  return h + "</div>";
}
function invActions(i) {
  const s = save.inventory[i];
  if (!s) return;
  const it = ITEMS[s.id], o = [];
  if (it.kind === "use" || it.kind === "food") { o.push({ label: it.kind === "food" ? "Eat" : "Use", fn: () => { closeDialog(); useItem(s.id); renderModal(); } }); if (!it.spell) o.push({ label: "Add to action bar", fn: () => { closeDialog(); placeOnBar({ kind: "item", id: s.id }); } }); }
  if (it.enchant) o.push({ label: "Use", fn: () => { closeDialog(); useItem(s.id); renderModal(); } });
  if (it.kind === "equip") o.push({ label: "Equip", fn: () => { closeDialog(); const why = canEquip(s.id); if (why) { log(why + ".", "sys"); sfx("error"); } else { equip(s.id); UI.sel = null; } renderModal(); } });
  if (o.length) promptChoice(it.name, o);
}
function renderMCard() {
  const el = $("mCard");
  if (!el) return;
  let id = UI.hov, h = "";
  if (S.modal === "inventory") { const s = save.inventory[UI.sel]; id = id || (s && s.id); }
  if (S.modal === "auction") id = id || (UI.ahView === "players" ? UI.pmSel : UI.ahSel);
  if (["shop", "auction", "forge", "furnishings", "stable", "mercs", "guild", "home", "job", "craft", "board", "storage"].includes(S.modal)) { h += '<div class="gilBox"><em>Crystals</em><b>' + save.gil.toLocaleString() + "</b></div>"; }
  if (S.modal === "quests" && UI.qSel && QUESTS[UI.qSel]) h += '<div class="qCard">' + questCardHTML(UI.qSel) + "</div>";
  else if ((S.modal === "inventory" || S.modal === "shop" || S.modal === "auction") && id && ITEMS[id]) h += '<div class="cardBox">' + itemCard(id) + (S.modal === "inventory" && augText(id) ? '<div class="sub" style="color:#ce93d8">✨ ' + esc(augText(id)) + "</div>" : "") + "</div>";
  el.innerHTML = h;
  el.classList.toggle("on", !!h);
  const win = document.querySelector("#menu .win");
  el.style.bottom = "auto";
  el.style.top = win ? Math.round(win.getBoundingClientRect().bottom + 6) + "px" : "";
}
function questCardHTML(id) {
  const q = QUESTS[id], st = save.quests[id];
  let h = '<div class="qT">' + esc(q.name) + '</div><div class="qS">' + ({ none: "Not started", active: "In progress", killed: "Ready to report", done: "Complete" }[st] || "") + "</div>";
  if (q.desc) h += '<div class="qD">' + esc(q.desc) + "</div>";
  const pr = questProgress(id);
  if (pr.length) h += '<div class="qD">' + pr.map(l => esc(l)).join("<br>") + "</div>";
  const rc = rewardChips(q.reward);
  if (rc.length) h += '<div class="qD">Reward: ' + rc.join(" · ") + "</div>";
  return h;
}

const CRAFT_RANKS = [[0, "Amateur"], [10, "Recruit"], [20, "Initiate"], [30, "Novice"], [40, "Apprentice"], [50, "Journeyman"], [60, "Craftsman"], [70, "Artisan"], [80, "Adept"], [90, "Veteran"]];
function craftRank(v) { let r = CRAFT_RANKS[0][1]; for (const [lv, n] of CRAFT_RANKS) if (v >= lv) r = n; return r; }
function ffSkillPanels() {
  const cur = sk => Math.floor(Math.min((save.skills[player.job] || {})[sk] || 0, skillCap(player, sk)));
  const panel = (title, rows, two) => '<div class="ffStatus ffSk' + (two ? " two" : "") + '"><div class="ffHead"><span>' + title + '</span></div><div class="ffJG">' + rows.join("") + "</div></div>";
  const r = (n, v, extra) => '<div class="ffr"><em>' + esc(n) + '</em><b class="bl">' + v + (extra ? ' <span class="cap">' + extra + "</span>" : "") + "</b></div>";
  const comb = COMBAT_SKILLS.filter(sk => skillCap(player, sk) > 0).map(sk => r(SKILL_NAMES[sk], cur(sk)));
  const known = MAGIC_SKILLS.filter(sk => skillCap(player, sk) > 0 && actionList(player).some(a => a.kind === "ma" && spellSkill(SPELLS[a.id]) === sk));
  const magic = known.map(sk => r(SKILL_NAMES[sk].replace(" Magic", ""), cur(sk)));
  let h = '<div class="ffPanels">';
  if (comb.length) h += panel("Combat Skills", comb, true);
  if (magic.length) h += panel("Magic Skills", magic, true);
  const crafts = Object.keys(CRAFTS).map(c => { const v = Math.floor(craftSkill(c)); return '<div class="ffr cr"><em>' + esc(CRAFTS[c].name) + '</em><b class="bl">' + craftRank(v) + '</b><b class="lv">(' + v + ")</b></div>"; });
  crafts.unshift('<div class="ffr cr"><em>Fishing</em><b class="bl">' + craftRank(save.gatherSkill.fishing || 0) + '</b><b class="lv">(' + (save.gatherSkill.fishing || 0) + ")</b></div>");
  h += '<div class="ffStatus ffSk craft"><div class="ffHead"><span>Craft Skills</span></div>' + crafts.join("") + "</div>";
  return h + "</div>";
}

function tabSkills() {
  let h = '<div class="sub" style="margin-bottom:10px">Skills rise as you use them, up to a cap set by your job and level. Each job keeps its own skills. Weapon skills unlock at weapon skill 5, 22, 40 and 75.</div>';
  h += ffSkillPanels();
  const g = [["mining", "Mining"], ["logging", "Logging"], ["harvesting", "Harvesting"]].map(([k, l]) => '<div class="ffr cr"><em>' + l + '</em><b class="bl">' + craftRank(save.gatherSkill[k] || 0) + '</b><b class="lv">(' + (save.gatherSkill[k] || 0) + ")</b></div>");
  h += '<div class="ffPanels"><div class="ffStatus ffSk craft"><div class="ffHead"><span>Gathering Skills</span></div>' + g.join("") + "</div></div>";
  return h;
}

function tabActions() {
  const hb = hotbar();
  let h = '<div class="sub">Tap an action, then tap a slot to place it. Tap two slots to swap them. Select a slot, then Hide from HUD or Show on HUD to choose whether it appears on the pinned bar (its hotkey still works; hidden slots are dimmed here). With no slot shown the bar disappears; the ✕ on the bar hides every slot. Four lines of ten: plain 1–9 and 0 fire the line shown on the pinned bar (Main by default); hold <b>Shift</b>, <b>Alt</b> or <b>Tab</b> and press a number for those lines.</div>';
  hb.pages.forEach((pg, p) => {
    h += "<h3>" + ["Main", "Shift", "Alt", "Tab"][p] + " line</h3><div class=\"barEdit\">";
    pg.forEach((a, i) => { h += '<button class="slot' + (a ? " " + a.kind : " empty") + (UI.pick && UI.pick[0] === p && UI.pick[1] === i ? " pick" : "") + (a && a.hud === false ? " nohud" : "") + '" data-a="slotpick" data-v="' + p + "," + i + '"' + (a ? ' style="background:' + actTint(a) + '"' : "") + ' title="' + esc(actName(a)) + '"><span class="hk">' + ((i + 1) % 10) + '</span><span class="ic">' + actIcon(a) + "</span></button>"; });
    h += "</div>";
  });
  h += '<div class="opt"><button data-a="slotclear"' + (UI.pick ? "" : " disabled") + '>Clear selected slot</button><button data-a="slothud"' + (UI.pick && hb.pages[UI.pick[0]][UI.pick[1]] ? "" : " disabled") + '>' + (UI.pick && hb.pages[UI.pick[0]][UI.pick[1]] && hb.pages[UI.pick[0]][UI.pick[1]].hud === false ? "Show selected on HUD" : "Hide selected from HUD") + '</button><button data-a="barreset">Reset to defaults</button></div>';
  const known = actionList(player).map(a => ({ kind: a.kind, id: a.id }));
  const items = ["potion", "hi_potion", "ether", "potion_hq", "ether_hq", "fishing_rod"].concat(Object.keys(ITEMS).filter(k => ITEMS[k].kind === "food")).filter(id => invCount(id) > 0 || id === "potion" || id === "ether").map(id => ({ kind: "item", id }));
  const groups = [["Weapon skills", known.filter(a => a.kind === "ws")], ["Abilities", known.filter(a => a.kind === "ja")], ["Spells", known.filter(a => a.kind === "ma")], ["Items", items]];
  const onBar = new Set(hb.pages.flat().filter(Boolean).map(a => a.kind + ":" + a.id));
  for (const [title, list] of groups) {
    if (!list.length) continue;
    h += "<h3>" + title + '</h3><div class="acts2">';
    for (const a of list) {
      const k = a.kind + ":" + a.id;
      h += '<div class="actRow' + (UI.selAct === k ? " sel" : "") + (onBar.has(k) ? " on" : "") + '" data-a="actpick" data-v="' + k + '"><span class="ic" style="background:' + actTint(a) + '">' + actIcon(a) + "</span><div><div>" + esc(actName(a)) + (onBar.has(k) ? ' <span class="sub">· on bar</span>' : "") + '</div><div class="d">' + esc(actDesc(a)) + "</div></div></div>";
    }
    h += "</div>";
  }
  if (!known.length) h += '<div class="sub">You have no actions yet. Weapon skills unlock as your weapon skill rises.</div>';
  return h;
}

function storyBlock() {
  const done = save.story.done, c = storyChapter(), st = storyStep();
  let h = '<h3 style="margin-top:0">🕯️ Main story</h3>';
  if (done) return h + '<div class="item" style="display:block"><b style="font-family:var(--serif)">The story is complete</b><div class="sub">The ash has stopped falling. Thank you for playing through it.</div></div>';
  const ready = storyReady();
  const prog = st && st.type === "kill" ? " (" + save.story.prog + "/" + st.n + ")" : "";
  h += '<div class="item" style="display:block"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-family:var(--serif)">Chapter ' + (save.story.ch + 1) + ": " + esc(c.name) + '</b><span class="sub">' + (save.story.ch + 1) + " / " + STORY.length + '</span></div><div class="sub" style="margin-top:4px">' + (ready ? esc(st.goal + prog) : "Reach level " + c.lv + " to continue the story.") + "</div></div>";
  return h;
}

function tabQuests() {
  const cur = Object.keys(QUESTS).filter(id => save.quests[id] === "active" || save.quests[id] === "killed");
  const done = Object.keys(QUESTS).filter(id => save.quests[id] === "done");
  UI.modalHelp = UI.qSel && QUESTS[UI.qSel] ? QUESTS[UI.qSel].name : UI.qCat ? "Select a quest." : "Select a category.";
  let h = '<div class="lHead"><button data-a="slimclose">✕ Close</button></div><div class="lList">';
  if (!UI.qCat) {
    h += listRow("qcat", "story", null, null, "Story", storyChapter() ? "" : "✓", false);
    h += listRow("qcat", "cur", null, null, "Current", cur.length, false);
    h += listRow("qcat", "done", null, null, "Completed", done.length, false);
    if (save.guild && Object.keys(save.guild.active || {}).length) h += listRow("qcat", "guild", null, null, "Guild Bounties", Object.keys(save.guild.active).length, false);
    h += "</div>";
    return h;
  }
  h += listRow("qback", "", null, null, "◀ Back", null, false, "back");
  if (UI.qCat === "story") h += "</div>" + storyBlock();
  else if (UI.qCat === "guild") { for (const id of Object.keys(save.guild.active)) { const b = GUILD_BOUNTIES.find(x => x.id === id); if (b) h += listRow("noop", id, null, null, b.name || id, save.guild.active[id] + "/" + (b.n || b.count || ""), false); } h += "</div>"; }
  else {
    const ids = UI.qCat === "cur" ? cur : done;
    if (!ids.length) h += '<div class="lr empty"><span class="nm">' + (UI.qCat === "cur" ? "No quests right now. A ❗ over someone means they have work for you." : "Nothing finished yet.") + "</span></div>";
    for (const id of ids) h += listRow("qsel", id, null, null, QUESTS[id].name, save.quests[id] === "killed" ? "!" : "", UI.qSel === id, save.quests[id] === "killed" ? "rdy" : "");
    h += "</div>";
  }
  return h;
}

function tabMap() {
  let h = '<div class="mapBox"><canvas id="mapCanvas"></canvas></div><div class="legend"><span><i style="background:#fff"></i>You</span><span><i style="background:#62b6ff"></i>Party</span><span><i style="background:#ead9ae"></i>People</span><span><i style="background:#ffd54f"></i>Quest</span><span><i style="background:#7ff3ff"></i>Home point</span><span><i style="background:#f1cf73;border-radius:2px"></i>Exit</span><span><i style="background:#111;border:1px solid #555"></i>Unexplored</span></div>';
  const f = exploredFor(S.zoneId);
  const pct = Math.round(100 * f.s.split("").filter(c => c === "1").length / f.s.length);
  h += '<div class="sub" style="margin-top:4px">' + esc([S.zone.name, zoneSubtitle(S.zoneId)].filter(Boolean).join(" · ")) + " · " + pct + "% explored</div>";
  const lms = S.zone.landmarks || [];
  if (lms.length) {
    const found = lms.filter(l => save.landmarks[S.zoneId + ":" + l.id]);
    h += '<div class="sub" style="margin-top:4px">🧭 Landmarks ' + found.length + "/" + lms.length + (found.length ? ": " + found.map(l => esc(l.name)).join(" · ") : " · explore to find them for bonus XP") + "</div>";
  }
  const cs = citySVG();
  if (cs) h += "<h3>" + esc(areaName(areaOf(S.zoneId))) + "</h3>" + cs;
  h += "<h3>Atlas</h3>" + worldMapSVG();
  return h;
}
function citySVG() {
  const a = areaOf(S.zoneId), sp = ZONE_SPLITS[a];
  if (!sp || !sp.town) return "";
  let s = '<svg viewBox="-10 -10 ' + (sp.w + 20) + " " + (sp.h + 20) + '" style="width:100%;max-width:520px;display:block;background:#15170f;border-radius:12px;border:1px solid var(--edge)">';
  const gates = [];
  for (const p of sp.parts) {
    const z = ZONES[p.id], d = (z.districts || [])[0] || { color: "#888", name: z.name, icon: "" }, here = p.id === S.zoneId, seen = (save.districts || {})[a + ":" + d.id] || here;
    s += '<rect x="' + p.x0 + '" y="' + p.y0 + '" width="' + (p.x1 - p.x0) + '" height="' + (p.y1 - p.y0) + '" fill="' + d.color + '" fill-opacity="' + (here ? 0.55 : seen ? 0.3 : 0.1) + '" stroke="' + (here ? "#fff" : "#000") + '" stroke-width="' + (here ? 10 : 6) + '"/>';
    s += '<text x="' + (p.x0 + p.x1) / 2 + '" y="' + (p.y0 + p.y1) / 2 + '" text-anchor="middle" font-size="' + Math.min(64, (p.x1 - p.x0) / 7) + '" font-weight="700" fill="#f4ead0" stroke="#000" stroke-width="6" paint-order="stroke">' + esc((d.icon || "") + " " + (seen ? d.name : "???")) + "</text>";
    for (const e of z.exits || []) if (e.gate && p.id < e.to) gates.push([p.x0 + e.x + e.w / 2, p.y0 + e.y + e.h / 2]);
    for (const e of z.exits || []) if (!e.gate && e.kind !== "door" && ZONES[e.to] && areaOf(e.to) !== a) { const ex = p.x0 + e.x + e.w / 2, an = ex < sp.w * 0.2 ? "start" : ex > sp.w * 0.8 ? "end" : "middle"; s += '<text x="' + Math.min(sp.w - 10, Math.max(10, ex)) + '" y="' + Math.min(sp.h - 20, Math.max(40, p.y0 + e.y + e.h / 2 - 30)) + '" text-anchor="' + an + '" font-size="40" fill="#f1cf73" stroke="#000" stroke-width="5" paint-order="stroke">→ ' + esc(e.label) + "</text>"; }
  }
  for (const [x, y] of gates) s += '<circle cx="' + x + '" cy="' + y + '" r="22" fill="#e8dcb8" stroke="#000" stroke-width="5"/>';
  const o = S.zone.off || [0, 0];
  s += '<circle cx="' + (player.x + o[0]) + '" cy="' + (player.y + o[1]) + '" r="44" fill="none" stroke="#ff6ad5" stroke-width="6"/><circle cx="' + (player.x + o[0]) + '" cy="' + (player.y + o[1]) + '" r="26" fill="#fff" stroke="#000" stroke-width="6"/><text x="' + Math.min(sp.w - 140, Math.max(140, player.x + o[0])) + '" y="' + (player.y + o[1] - 62) + '" text-anchor="middle" font-size="48" font-weight="700" fill="#fff" stroke="#000" stroke-width="7" paint-order="stroke">You are here</text>';
  return s + "</svg>";
}
function drawZoneMap() {
  const cv = $("mapCanvas");
  if (!cv) return;
  const m = zoneMapCanvas(S.zoneId);
  const z = m.z;
  const cw = cv.clientWidth || 600;
  const maxH = Math.max(220, window.innerHeight * 0.55);
  let s = cw / z.w;
  if (z.h * s > maxH) s = maxH / z.h;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = Math.round(z.w * s), H = Math.round(z.h * s);
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + "px"; cv.style.height = H + "px"; }
  const g = cv.getContext("2d");
  g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
  g.drawImage(m.c, 0, 0, z.w, z.h);
  const f = exploredFor(S.zoneId);
  const fc = document.createElement("canvas");
  fc.width = f.cols + 2; fc.height = f.rows + 2;
  const fg = fc.getContext("2d");
  fg.fillStyle = "rgba(6,7,11,.93)";
  fg.fillRect(0, 0, fc.width, fc.height);
  for (let y = 0; y < f.rows; y++) for (let x = 0; x < f.cols; x++) if (f.s[y * f.cols + x] === "1") fg.clearRect(x + 1, y + 1, 1, 1);
  g.imageSmoothingEnabled = true;
  g.drawImage(fc, -50, -50, fc.width * 50, fc.height * 50);
  const lbl = (t, x, y, col) => { g.font = "bold " + (12 / s).toFixed(1) + "px system-ui"; g.textAlign = "center"; g.lineWidth = 3 / s; g.strokeStyle = "#000"; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y); };
  const seen = (x, y) => { const cx = Math.floor(x / 50), cy = Math.floor(y / 50); return f.s[cy * f.cols + cx] === "1"; };
  for (const d of z.districts || []) if (seen(d.x + d.w / 2, d.y + d.h / 2) || (save.districts || {})[areaOf(S.zoneId) + ":" + d.id]) { g.globalAlpha = 0.85; lbl(d.name.toUpperCase(), d.x + d.w / 2, d.y + 30 / s, d.color); g.globalAlpha = 1; }
  for (const e of z.exits || []) if (seen(e.x + e.w / 2, e.y + e.h / 2)) lbl("→ " + e.label, clamp(e.x + e.w / 2, 70 / s, z.w - 70 / s), e.y + e.h / 2, "#f1cf73");
  for (const n of S.npcs) {
    if (!seen(n.x, n.y)) continue;
    const cr = NPCS[n.id] && NPCS[n.id].crystal;
    g.beginPath(); g.arc(n.x, n.y, 6 / s, 0, 7); g.fillStyle = cr ? "#7ff3ff" : questMarker(n) ? "#ffd54f" : "#ead9ae"; g.fill();
    const sv = serviceOf(NPCS[n.id]);
    lbl((questMarker(n) ? "❗ " : "") + (sv ? sv.icon + " " : "") + n.name.split(",")[0], n.x, n.y - 10 / s, cr ? "#7ff3ff" : "#ead9ae");
  }
  if (S.guide && S.guide.zone === S.zoneId) { g.beginPath(); g.arc(S.guide.x, S.guide.y, 9 / s, 0, 7); g.fillStyle = "#ffd54f"; g.fill(); g.lineWidth = 2 / s; g.strokeStyle = "#000"; g.stroke(); lbl("★ " + S.guide.label, S.guide.x, S.guide.y - 14 / s, "#ffd54f"); }
  for (const p of S.party) if (p !== player) { g.beginPath(); g.arc(p.x, p.y, 5 / s, 0, 7); g.fillStyle = "#62b6ff"; g.fill(); }
  for (const l of z.landmarks || []) if (save.landmarks[S.zoneId + ":" + l.id]) lbl("🧭 " + l.name, l.x, l.y, "#e9dcb4");
  g.save(); g.translate(player.x, player.y); g.rotate(player.face || 0); g.scale(1 / s, 1 / s);
  g.beginPath(); g.moveTo(12, 0); g.lineTo(-8, -8); g.lineTo(-3, 0); g.lineTo(-8, 8); g.closePath(); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#000"; g.stroke();
  g.restore();
}
const ATLAS_POS = { highlands: [300, 40], residence: [60, 140], outpost: [150, 140], hollow: [300, 140], den: [460, 140], crypt: [600, 190], depths: [150, 260], marsh: [300, 260], verdant: [460, 260], underdeep: [600, 300], harbor: [300, 370], gullisle: [140, 450], frost: [460, 370], ironvale: [610, 380], sunscar: [600, 470], cinder: [730, 420], spire: [740, 520] };
function atlasNode(id) { return areaOf(id); }
function atlasLinks() {
  const out = new Set();
  for (const id in ZONES) for (const e of ZONES[id].exits || []) { const a = atlasNode(id), b = atlasNode(e.to); if (a !== b && ATLAS_POS[a] && ATLAS_POS[b]) out.add([a, b].sort().join("|") + (e.kind === "door" ? "|door" : "")); }
  out.add("gullisle|harbor|ferry");
  return [...out].map(k => k.split("|"));
}
function atlasExplored(a) { const zs = areaZones(a); return zs.length ? zs.reduce((n, z) => n + zoneExplored(z), 0) / zs.length : 0; }
function zoneExplored(id) { const s = save.explored && save.explored[id]; if (typeof s !== "string" || !s.length) return 0; let n = 0; for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 49) n++; return n / s.length; }
function worldMapSVG() {
  const known = new Set((save.discovered || []).map(atlasNode).concat(["outpost", "residence", atlasNode(S.zoneId)]));
  const near = new Set();
  const links = atlasLinks();
  for (const [a, b] of links) { if (known.has(a)) near.add(b); if (known.has(b)) near.add(a); }
  const c = typeof conquestState === "function" ? conquestState() : null;
  const holderCol = id => { if (!c) return "#6c7d4a"; const r = regionOf(id); return r ? CONQUEST.nations[c.held[r]].color : "#c8b070"; };
  let s = '<svg viewBox="0 0 800 580" style="width:100%;max-width:760px;display:block;background:radial-gradient(ellipse at 40% 40%,#2c3324,#11130e);border-radius:12px;border:1px solid var(--edge)">';
  for (const [a, b, kind] of links) {
    if (!(known.has(a) || known.has(b))) continue;
    const [x1, y1] = ATLAS_POS[a], [x2, y2] = ATLAS_POS[b], both = known.has(a) && known.has(b);
    s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (kind === "ferry" ? "#4fc3f7" : both ? "#a8946a" : "#555") + '" stroke-width="3"' + (kind || !both ? ' stroke-dasharray="6 6"' : "") + "/>";
  }
  let total = 0, seen = 0;
  for (const id in ATLAS_POS) {
    total++;
    const isKnown = known.has(id), isNear = near.has(id);
    if (isKnown) seen++;
    if (!isKnown && !isNear) continue;
    const [x, y] = ATLAS_POS[id], here = atlasNode(S.zoneId) === id, z = ZONES[id] || ZONES[areaZones(id)[0]];
    const name = areaName(id), pct = Math.round(atlasExplored(id) * 100), band = bandText(areaBand(id));
    const fill = here ? "#f1cf73" : isKnown ? (z.safe || id === "residence" ? "#c8b070" : holderCol(id)) : "#333";
    s += '<g><circle cx="' + x + '" cy="' + y + '" r="' + (here ? 13 : 10) + '" fill="' + fill + '" stroke="#000" stroke-width="2"/>' + (here ? '<circle cx="' + x + '" cy="' + y + '" r="19" fill="none" stroke="#f1cf73" stroke-width="2"/>' : "");
    s += '<text x="' + x + '" y="' + (y + 28) + '" text-anchor="middle" font-size="12" font-family="Georgia,serif" fill="' + (isKnown ? "#ecebe6" : "#777") + '">' + (isKnown ? esc(name) : "???") + "</text>";
    if (isKnown && !z.safe && id !== "residence" && (pct > 0 || band)) s += '<text x="' + x + '" y="' + (y + 41) + '" text-anchor="middle" font-size="10" fill="#b8b090">' + [band, pct > 0 ? pct + "% mapped" : ""].filter(Boolean).join(" · ") + "</text>";
    s += "</g>";
  }
  s += '<text x="12" y="570" font-size="12" fill="#cfc8a8" font-family="Georgia,serif">Areas discovered: ' + seen + " / " + total + (c ? " · " + Object.keys(CONQUEST.nations).map(k => '<tspan fill="' + CONQUEST.nations[k].color + '">● ' + CONQUEST.nations[k].short + "</tspan>").join(" ") : "") + "</text>";
  s += "</svg>";
  return s;
}

function tabSettings() {
  let h = typeof audioSettingsHTML === "function" ? audioSettingsHTML() : "";
  if (typeof graphicsSettingsHTML === "function") h += graphicsSettingsHTML();
  const s = VIEW.settings;
  const btn = (a, v, label, on) => '<button data-a="' + a + '" data-v="' + v + '"' + (on ? ' class="on"' : "") + ">" + label + "</button>";
  h += "<h3>Interface</h3><div class=\"opt\">" + btn("toggle", "tracker", "Quest tracker " + (s.tracker !== false ? "on" : "off"), s.tracker !== false) + btn("toggle", "plates", "Name plates " + (s.plates !== false ? "on" : "off"), s.plates !== false) + btn("toggle", "compass", "Compass map " + (s.compass !== false ? "on" : "off"), s.compass !== false) + btn("toggle", "dmgNums", "Damage numbers " + (s.dmgNums !== false ? "on" : "off"), s.dmgNums !== false) + btn("toggle", "hotbar", "Pinned hotkeys " + (s.hotbar !== false ? "on" : "off"), s.hotbar !== false) + btn("fullscreen", "", document.fullscreenElement ? "Fullscreen on (free keys)" : "Fullscreen (free keys)", !!document.fullscreenElement) + btn("toggle", "autoFull", "Fullscreen on start " + (s.autoFull ? "on" : "off"), !!s.autoFull) + btn("perfshow", "", "Load timings " + (UI.perfShow ? "shown" : "hidden"), !!UI.perfShow) + "</div>" + (UI.perfShow && typeof PERF !== "undefined" ? '<div class="sub" style="white-space:pre-wrap;font-size:11px;max-height:180px;overflow:auto">' + esc(PERF.table().join("\n")) + "</div>" : "");
  if (typeof NET !== "undefined" && NET.user && !PLAY.offline) {
    const im = Math.max(5, Math.min(60, +VIEW.settings.idleMin || 30));
    h += '<h3>Online</h3><div class="sub" style="margin-bottom:6px">' + (NET.online && NET.online.max > 0 ? NET.online.n + " of " + NET.online.max + " players online" + (NET.online.queue ? ", " + NET.online.queue + " waiting" : "") + ". " : "") + "If you don't touch anything for this long you are logged out, so your place can go to someone waiting. You get a one-minute warning first.</div><div class=\"opt\">" + [5, 15, 30, 45, 60].map(m => '<button data-a="idlemin" data-v="' + m + '"' + (im === m ? ' class="on"' : "") + ">" + m + " min</button>").join("") + "</div>";
  }
  h += '<h3>More</h3><div class="opt"><button data-a="tutorial">🎓 Tutorial</button><button data-a="open" data-v="updates">📰 Updates</button><button data-a="open" data-v="system">💾 System</button><button data-a="open" data-v="credits">🎬 Credits</button>' + (typeof netIsAdmin === "function" && netIsAdmin() ? '<button data-a="open" data-v="admin">🛡️ Admin</button>' : "") + '</div><div class="sub">Help also opens with H. Saving, loading, changing character and checking for updates are under System.</div>';
  return h;
}
function tabSystem() {
  let h = "<h3>Save data</h3>";
  const acct = typeof NET !== "undefined" && NET.user;
  h += '<div class="sub" style="margin-bottom:8px">' + (acct ? "Signed in as " + esc(NET.user.email) + ". Your progress saves to the game server automatically" + (NET.lastErr ? ' <span style="color:#ff8a80">(offline: ' + esc(NET.lastErr) + ")</span>" : NET.lastSave ? " (last saved " + fmtAgo(NET.lastSave) + ")" : "") + "." : "Your progress saves automatically.") + " You can also download a copy of this character for safekeeping.</div>";
  h += '<div class="opt"><button data-a="savefile">💾 Download a copy</button>' + (acct ? '<button data-a="syncnow">☁️ Save to server now</button><button data-a="signout">🚪 Sign out</button>' : "") + "</div>";
  h += "<h3>Character</h3><div class=\"sub\" style=\"margin-bottom:8px\">" + esc(save.name) + " · " + JOBS[save.mainJob].name + " Lv." + player.lv + " · " + loadRoster().chars.length + " of " + MAX_CHARS + " characters.</div>";
  h += '<div class="opt"><button data-a="logout">👥 Change character</button></div>';
  h += '<input type="file" id="loadInput" accept=".json,application/json" style="display:none">';
  h += "<h3>Time</h3><div class=\"sub\">" + clockText() + " · " + (isNight() ? "night" : "day") + " · Today's element: " + dayElement() + " (+10% to " + dayElement() + " spells). One game day lasts 57.6 real minutes.</div>";
  h += '<h3>Updates</h3><div class="sub" style="margin-bottom:6px">' + BUILD_INFO + '</div><div class="opt"><button data-a="checkupd">🔄 Check for updates</button><button data-a="open" data-v="updates">📰 What changed</button></div>';
  return h;
}
function tabShop() {
  const kind = S.shopKind && (SHOPS[S.shopKind] || S.shopKind.startsWith("v:")) ? S.shopKind : "marn", mode = UI.shopMode === "sell" ? "sell" : "buy";
  UI.modalHelp = mode === "buy" ? "Buy merchandise." : "Sell merchandise.";
  let h = '<div class="lHead"><button data-a="shopmode" data-v="buy"' + (mode === "buy" ? ' class="on"' : "") + '>Buy</button><button data-a="shopmode" data-v="sell"' + (mode === "sell" ? ' class="on"' : "") + ">Sell</button></div><div class=\"lList\">";
  if (mode === "buy") for (const id of shopList(kind)) h += listRow("shopbuy", id, id, null, ITEMS[id].name, buyPrice(id).toLocaleString(), UI.hov === id, save.gil < buyPrice(id) ? "dim" : "");
  else {
    const seen = new Set();
    for (const s of save.inventory) { if (seen.has(s.id) || sellPrice(s.id) <= 0) continue; seen.add(s.id); h += listRow("shopsell", s.id, s.id, invCount(s.id), ITEMS[s.id].name, sellPrice(s.id).toLocaleString(), UI.hov === s.id); }
    if (!seen.size) h += '<div class="lr empty"><span class="nm">Nothing to sell.</span></div>';
  }
  return h + "</div>";
}
function tabCredits() {
  const link = (url, label, icon) => '<a class="credLink" href="' + url + '" target="_blank" rel="noopener">' + icon + " " + esc(label) + "</a>";
  let h = '<div class="credits"><div class="credT">Leid\'anav Reborn</div><div class="credBy">A game made by <b>Ian McGonigal</b></div>';
  h += '<div class="credLinks">' + link("https://ianmcgo.github.io/cabalcoffers/#ebay", "Cabal Coffers store", "🛒") + link("https://www.patreon.com/c/ianmcg", "Support on Patreon", "💛") + link("https://ianmcgo.github.io/website/", "Ian's other works", "🌐") + "</div>";
  h += '<div class="sub" style="margin-top:14px">All names, art, music and sound in this game are original. Inspired by the classic MMORPGs of the early 2000s. ' + BUILD_INFO + "</div></div>";
  return h;
}

const CRYSTAL_WORD = { fire_crystal: "Heat", wind_crystal: "Wind", earth_crystal: "Earth", water_crystal: "Water", ice_crystal: "Ice", lightning_crystal: "Lightning", light_crystal: "Light", dark_crystal: "Dark" };
function craftCrystals() { return [...new Set(Object.values(CRAFTS).map(c => c.crystal))]; }
function csCounts() { const n = {}; for (const id of UI.cs.mats) n[id] = (n[id] || 0) + 1; return n; }
function csMatches() {
  const cs = UI.cs, n = csCounts();
  if (!cs.crystal) return [];
  return RECIPES.filter(r => recipeKnown(r) && CRAFTS[r.craft].crystal === cs.crystal && Object.keys(n).every(id => (r.mats[id] || 0) >= n[id])).map(r => ({ r, exact: Object.keys(r.mats).every(id => n[id] === r.mats[id]) && Object.keys(n).every(id => r.mats[id]) }));
}
function tabCrafting() {
  UI.cs = UI.cs || { crystal: null, mats: [], hover: null };
  const cs = UI.cs;
  const slot = (id, a, v, big) => '<button class="csS' + (big ? " big" : "") + (id ? " on" : "") + '" data-a="' + a + '" data-v="' + v + '" title="' + (id ? esc(ITEMS[id].name) : "") + '">' + (id ? '<span>' + (ITEMS[id].icon || "📦") + "</span>" : "") + "</button>";
  let h = '<div class="csWrap"><div class="csPane"><div class="csHead">Crafting</div><div class="csGrid">';
  h += '<div class="csCry">' + (cs.crystal ? '<div class="csEl">' + (CRYSTAL_WORD[cs.crystal] || "") + "</div>" : '<div class="csEl dim">Crystal</div>') + slot(cs.crystal, "csclr", "crystal", true) + "</div>";
  h += '<div class="csMats">';
  for (let i = 0; i < 8; i++) h += slot(cs.mats[i], "csrem", i);
  h += '</div><div class="csBtns"><button class="ffb2" data-a="csok">OK</button><button class="ffb2" data-a="cscancel">Cancel</button></div></div></div>';
  const m = csMatches().sort((x, y) => (y.exact - x.exact) || x.r.lv - y.r.lv);
  h += '<div class="csPane csRes"><div class="csHead">Craft this combination of</div><div class="csList">';
  if (!cs.crystal) h += '<div class="csHint">Choose a crystal and ingredients from your bag below.</div>';
  else if (!m.length) h += '<div class="csHint">Nothing you know uses these.</div>';
  for (const { r, exact } of m.slice(0, 30)) h += '<button class="csRow' + (exact ? " exact" : "") + '" data-a="csfill" data-v="' + r.id + '"><span>' + (ITEMS[r.out].icon || "") + " " + esc(ITEMS[r.out].name) + (r.qty > 1 ? " ×" + r.qty : "") + "</span>" + (exact ? '<span class="st">★</span>' : '<span class="lvl">' + esc(CRAFTS[r.craft].name) + " " + r.lv + "</span>") + "</button>";
  h += "</div></div></div>";
  const hv = cs.hover && ITEMS[cs.hover] ? cs.hover : null;
  h += '<div class="csDesc">' + (hv ? '<span class="ic">' + (ITEMS[hv].icon || "📦") + "</span><div><b>" + esc(ITEMS[hv].name) + "</b><div>" + esc(itemDesc(hv)) + "</div></div>" : '<div class="dim">Tap an item to see what it is.</div>') + "</div>";
  if (UI.craftMsg) h += '<div class="sub" style="color:#ffd070;margin:6px 0">' + esc(UI.craftMsg) + "</div>";
  const n = csCounts();
  const usable = [...new Set(save.inventory.map(x => x.id))].filter(id => craftCrystals().includes(id) || RECIPES.some(r => recipeKnown(r) && r.mats[id]));
  h += '<h3>Your bag</h3><div class="inv csBag">';
  if (!usable.length) h += '<div class="sub" style="padding:6px">No crystals or crafting materials in your bag.</div>';
  for (const id of usable) { const left = invCount(id) - (n[id] || 0) - (cs.crystal === id ? 1 : 0); h += '<button class="cell' + (left <= 0 ? " off" : "") + '" data-a="csadd" data-v="' + id + '"><span class="ic">' + (ITEMS[id].icon || "📦") + '</span><span class="inm">' + esc(ITEMS[id].name) + '</span><span class="q">' + left + "</span></button>"; }
  h += "</div>";
  h += '<div class="csSk">' + Object.keys(CRAFTS).map(c => '<span>' + CRAFTS[c].icon + " " + CRAFTS[c].name + ' <b>' + craftRank(Math.floor(craftSkill(c))) + "</b> (" + Math.floor(craftSkill(c)) + ")</span>").join("") + '</div><div style="margin-top:8px"><button data-a="craftbook">' + (UI.craftBook ? "Hide recipe notes" : "📜 Recipe notes") + "</button></div>";
  if (UI.craftBook) h += tabCraftBook();
  return h;
}

function tabCraft() { return tabCrafting(); }

function tabCraftBook() {
  if (!UI.craft) UI.craft = "smithing";
  const c = UI.craft;
  let h = '<div class="invTop">' + Object.keys(CRAFTS).map(k => '<button data-a="craftsel" data-v="' + k + '"' + (k === c ? ' class="on"' : "") + ">" + CRAFTS[k].icon + " " + CRAFTS[k].name + ' <span class="sub">' + craftSkill(k).toFixed(1) + "</span></button>").join("") + "</div>";
  h += '<div class="sub" style="margin-bottom:8px">' + CRAFTS[c].name + " skill " + craftSkill(c).toFixed(1) + " / " + CONFIG.craftCap + " · needs " + an(ITEMS[CRAFTS[c].crystal].name) + " (have " + invCount(CRAFTS[c].crystal) + ") · about " + CONFIG.synthTime + " s per synthesis, anywhere outside combat.</div>";
  const list = RECIPES.filter(r => r.craft === c && recipeKnown(r)).sort((a, b) => a.lv - b.lv);
  if (!list.length) h += '<div class="sub">You know no recipes for this craft yet. Learn them from Recipe scrolls.</div>';
  for (const r of list) {
    const ok = recipeMatsOk(r);
    const why = canSynth(r);
    const mats = Object.keys(r.mats).map(id => '<span class="' + (invCount(id) >= r.mats[id] ? "ok" : "bad") + '">' + esc(ITEMS[id].name) + " " + Math.min(invCount(id), r.mats[id]) + "/" + r.mats[id] + "</span>").join(" · ");
    h += '<div class="item" style="align-items:flex-start"><div><div>' + (ITEMS[r.out].icon || "") + " " + esc(ITEMS[r.out].name) + (r.qty > 1 ? " ×" + r.qty : "") + ' <span class="sub">Lv.' + r.lv + " · " + synthChance(r) + "% success" + (r.hq ? " · HQ " + synthHqChance(r) + "%" : "") + '</span></div><div class="d">' + mats + '</div></div><button data-a="synth" data-v="' + r.id + '"' + (why ? " disabled" : "") + ' title="' + esc(why || "Craft") + '">Craft</button></div>';
  }
  if (UI.craftMsg) h += '<div class="sub" style="color:#ff8a80;margin-top:6px">' + esc(UI.craftMsg) + "</div>";
  return h;
}

function tabFurnishings() {
  let h = '<div class="sub" style="margin-bottom:6px">Odette sells furniture and seeds for your residence. 💠 ' + save.gil + " crystals · Pip at the cottage places it.</div><h3>Buy</h3>";
  FURNITURE_SHOP.concat(SEED_SHOP).forEach(id => { const it = ITEMS[id]; const fp = it.fp || [1, 1]; h += '<div class="item"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">' + (it.icon || "") + "</span><div><div>" + esc(it.name) + ' <span class="sub">' + fp[0] + "×" + fp[1] + (it.storage ? " · +" + it.storage + " storage" : "") + '</span></div><div class="d">' + esc(it.desc || "") + '</div></div></div><button data-a="buy" data-v="' + id + '"' + (save.gil < it.price ? " disabled" : "") + ">" + it.price + " gil</button></div>"; });
  h += "<h3>Sell</h3>";
  const sellable = save.inventory.filter(s => (ITEMS[s.id].kind === "furniture" || ITEMS[s.id].kind === "seed") && sellPrice(s.id) > 0);
  if (!sellable.length) h += '<div class="sub">No furniture or seeds to sell.</div>';
  sellable.forEach(s => { h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="sell" data-v="' + s.id + '">' + sellPrice(s.id) + " gil</button></div>"; });
  return h;
}

function tabStorage() {
  const cap = storageCap();
  if (!(S.zoneId === "residence")) {
    UI.modalHelp = "What Pip is keeping for you at your residence.";
    let h = '<div class="lHead"><button data-a="slimclose">✕ Close</button></div><div class="lList">';
    if (!save.storage.length) h += '<div class="lr empty"><span class="nm">Nothing in storage. Visit Pip at your residence to store things.</span></div>';
    for (const s of save.storage) h += listRow("noop", s.id, s.id, s.qty, ITEMS[s.id].name, null, false, rarityOf(s.id));
    return h + '</div><div class="sub" style="margin-top:6px">' + storageUsed() + " / " + cap + " slots used. You can only move items in or out at your residence.</div>";
  }
  const rowI = (s, a, v) => '<button class="mcR" data-a="' + a + '" data-v="' + v + '"><span class="ic">' + (ITEMS[s.id].icon || "📦") + '</span><span class="nm' + (ITEMS[s.id].kind === "equip" ? " eq" : "") + '">' + esc(ITEMS[s.id].name) + "</span>" + (s.qty > 1 ? '<span class="q">' + s.qty + "</span>" : "") + "</button>";
  let h = '<div class="mcBox"><div class="mcTop"><div class="mcT">Storage <sup>' + storageUsed() + "/" + cap + '</sup></div><div class="mcMsg">Select item to move.</div></div><div class="mcCols">';
  h += '<div class="mcCol"><div class="mcLbl">Storage</div>';
  save.storage.forEach((s, i) => { h += rowI(s, "retrieve", i); });
  for (let k = save.storage.length; k < Math.min(cap, save.storage.length + 8); k++) h += '<div class="mcR empty"><span class="ic"></span></div>';
  h += '</div><div class="mcCol"><div class="mcLbl">Bag ' + save.inventory.length + "/" + CONFIG.inventorySize + "</div>";
  const bag = save.inventory.map((s, i) => ({ s, i })).filter(({ s }) => ITEMS[s.id].kind !== "key");
  for (const { s, i } of bag) h += rowI(s, "store", i);
  if (!bag.length) h += '<div class="mcR empty"><span class="ic"></span><span class="nm dim">Your bag is empty.</span></div>';
  h += "</div></div></div>";
  h += '<div class="sub" style="margin-top:6px">Pip keeps your things. ' + CONFIG.storageBase + " base slots" + (cap > CONFIG.storageBase ? " + " + (cap - CONFIG.storageBase) + " from furniture" : "") + ". Tap an item on either side to move it across.</div>";
  return h;
}

function tabHome() {
  const g = ZONES.residence.grid;
  const own = save.inventory.filter(s => ITEMS[s.id].kind === "furniture");
  let h = '<div class="sub" style="margin-bottom:6px">Pick a piece, then tap a tile to place it. Tap a placed piece to rotate or pack it away. Dark tiles are blocked (the door and Pip\'s corner). Rugs can sit under other pieces.</div>';
  h += '<div class="homeTop">' + own.map(s => '<button data-a="pickf" data-v="' + s.id + '"' + (UI.pick === s.id ? ' class="on"' : "") + ">" + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + (ITEMS[s.id].fp ? ' <span class="sub">' + furnFoot(s.id, UI.pickRot || 0).w + "×" + furnFoot(s.id, UI.pickRot || 0).h + "</span>" : "") + "</button>").join("");
  if (!own.length) h += '<span class="sub">No furniture in your bag. Odette in the Outpost sells it.</span>';
  if (UI.pick) h += '<button data-a="pickrot">↻ Rotate (' + ((UI.pickRot || 0) * 90) + "°)</button>";
  h += "</div>";
  const occ = {};
  save.furniture.forEach((f, i) => { for (const [c, r] of furnCells(f)) { const k = c + "," + r; if (!occ[k] || FURNITURE_MODELS[ITEMS[occ[k].id].model].flat) occ[k] = Object.assign({ i }, f); } });
  h += '<div class="homeGrid" style="grid-template-columns:repeat(' + g.cols + ',1fr)">';
  for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
    const blocked = g.blocked.some(([bc, br]) => bc === c && br === r);
    const f = occ[c + "," + r];
    let cls = "ht" + (blocked ? " blk" : "") + (f ? " occ" : "");
    let inner = blocked ? (c <= 1 && r <= 1 ? "🌱" : "🚪") : f ? (ITEMS[f.id].icon || "📦") : "";
    if (UI.pick && !f && !blocked && !furnFits(UI.pick, c, r, UI.pickRot || 0, null)) cls += " ok";
    h += '<button class="' + cls + '" data-a="' + (f ? "furn" : "cell") + '" data-v="' + (f ? f.i : c + "," + r) + '" title="' + (f ? esc(ITEMS[f.id].name) : blocked ? "Blocked" : "Tile " + c + "," + r) + '">' + inner + "</button>";
  }
  h += "</div>";
  if (UI.furnSel != null && save.furniture[UI.furnSel]) {
    const f = save.furniture[UI.furnSel];
    h += '<div class="detail"><div class="hd"><span class="ic">' + (ITEMS[f.id].icon || "📦") + "</span><div><b>" + esc(ITEMS[f.id].name) + '</b><div class="tags">Tile ' + f.c + "," + f.r + " · " + (f.rot || 0) * 90 + "°" + (ITEMS[f.id].storage ? " · +" + ITEMS[f.id].storage + " storage" : "") + "</div></div></div>";
    if (ITEMS[f.id].garden) {
      const g = gardenOf(UI.furnSel);
      if (!g) {
        const seeds = save.inventory.filter(s => ITEMS[s.id].kind === "seed");
        h += '<div class="sub" style="margin-top:6px">Empty flowerpot. ' + (seeds.length ? "Plant:" : "Odette sells seeds.") + '</div><div class="acts">' + seeds.map(s => '<button data-a="plant" data-v="' + UI.furnSel + ":" + s.id + '">' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + " ×" + s.qty + "</button>").join("") + "</div>";
      } else {
        const stageName = ["Seeded", "Sprout", "Growing", "Ready to harvest"][g.stage];
        const left = g.stage < 3 && g.watered ? Math.max(0, Math.ceil((GARDEN_STAGE_MS - (Date.now() - g.since)) / 60000)) : null;
        h += '<div class="sub" style="margin-top:6px">' + esc(ITEMS[g.seed].name) + " · " + stageName + " (stage " + Math.min(3, g.stage) + "/3)" + (g.stage < 3 ? (g.watered ? " · next stage in about " + left + " min" : " · <b style=\"color:#81d4fa\">needs water</b>") : "") + (g.crystal ? " · fed " + g.crystal : " · not fed") + "</div>";
        h += '<div class="acts">';
        if (g.stage < 3 && !g.watered) h += '<button data-a="water" data-v="' + UI.furnSel + '">💧 Water</button>';
        if (!g.crystal) { const cr = save.inventory.filter(s => ITEMS[s.id].kind === "crystal"); h += cr.map(s => '<button data-a="feed" data-v="' + UI.furnSel + ":" + s.id + '">' + (ITEMS[s.id].icon || "") + " Feed " + esc(ITEMS[s.id].name) + "</button>").join(""); }
        if (g.stage >= 3) h += '<button data-a="harvest" data-v="' + UI.furnSel + '" class="pri">🌿 Harvest</button>';
        h += "</div>";
      }
    }
    h += '<div class="acts"><button data-a="rotf" data-v="' + UI.furnSel + '">↻ Rotate</button><button data-a="packf" data-v="' + UI.furnSel + '">Pack away</button></div></div>';
  }
  if (UI.homeMsg) h += '<div class="sub" style="color:#ff8a80;margin-top:6px">' + esc(UI.homeMsg) + "</div>";
  return h;
}

function tabJob() {
  let h = "<h3>Main job</h3>";
  for (const jb in JOBS) {
    if (!jobUnlocked(jb)) continue;
    h += '<div class="item"><div>' + JOBS[jb].icon + " " + JOBS[jb].name + ' <span class="sub">Lv.' + save.jobs[jb].lv + "</span></div>" + (jb === save.mainJob ? '<span class="d">Current</span>' : '<button data-a="main" data-v="' + jb + '">Set main</button>') + "</div>";
  }
  h += "<h3>Support job</h3>";
  if (!save.supportUnlocked) h += '<div class="sub">Locked. ' + (player.lv < CONFIG.supportUnlockLevel ? "Reach level " + CONFIG.supportUnlockLevel + " and talk to Tobin." : "Complete Tobin's quest, A Second Calling.") + "</div>";
  else {
    h += '<div class="sub" style="margin-bottom:6px">Runs at half your main level (currently Lv.' + Math.floor(player.lv / 2) + ").</div>";
    for (const jb of ["none"].concat(Object.keys(JOBS).filter(jobUnlocked))) {
      if (jb === save.mainJob) continue;
      const cur = (save.subJob || "none") === jb;
      h += '<div class="item"><div>' + (jb === "none" ? "None" : JOBS[jb].icon + " " + JOBS[jb].name) + "</div>" + (cur ? '<span class="d">Current</span>' : '<button data-a="sub" data-v="' + jb + '">Set support</button>') + "</div>";
    }
  }
  return h;
}
function tabMercs() {
  const pool = mercPool(), full = mercFull();
  const d = new Date(), mid = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  UI.modalHelp = "Hire a companion. They fight at your level; if they fall, they're gone for good.";
  const row = (id, btn) => { const m = MERCS[id]; return '<div class="mRow"><span class="por" style="border-color:' + m.color + '">' + (JOBS[m.job] ? JOBS[m.job].icon : "⚔") + '</span><div class="mInfo"><b>' + esc(m.name) + '</b> <span class="sub">' + esc(JOBS[m.job].name) + " · Lv" + player.lv + " · " + esc({ dd: "Damage", tank: "Tank", healer: "Healer", support: "Support", nuker: "Nuker", burster: "Burster", hybrid: "Hybrid", bard: "Bard" }[m.role] || m.role) + '</span><div class="d">' + esc(m.desc || "") + "</div></div>" + btn + "</div>"; };
  let h = '<div class="sub" style="margin-bottom:6px">The Mercenary Hall has ' + pool.length + " fighters for hire today. New faces arrive in " + fmtDur(mid - d) + ". Party " + S.party.length + " / " + CONFIG.maxParty + " · 💠 " + save.gil.toLocaleString() + ". Mercenary slots: " + save.hired.length + " / " + mercSlots() + (mercSlots() < 3 ? " (" + (mercSlots() < 1 ? "Lv5" : mercSlots() < 2 ? "Lv10" : "Lv15") + " in any job opens the next)" : "") + ". The fee covers the first hour of play; after that each asks for an hourly wage.</div><h3>For hire today</h3>";
  const offers = pool.filter(id => !save.hired.includes(id) && !(save.oldFriends && save.oldFriends[id]));
  if (!offers.length) h += '<div class="sub">Everyone available today has already joined you. Come back tomorrow.</div>';
  for (const id of offers) h += row(id, '<button data-a="hire" data-v="' + id + '"' + (save.gil < mercFee(id) || full ? " disabled" : "") + ">Hire · " + mercFee(id) + " 💠</button>");
  h += "<h3>Your company</h3>";
  if (!save.hired.length) h += '<div class="sub">No one has joined you yet.</div>';
  for (const id of save.hired) if (MERCS[id]) h += row(id, '<button data-a="dismiss" data-v="' + id + '">Dismiss</button>');
  const ofs = Object.keys(save.oldFriends || {}).filter(id => MERCS[id]);
  h += "<h3>🍺 Old Friends</h3>";
  if (!ofs.length) h += '<div class="sub">Nobody. Companions you refuse to pay, or can\'t pay, wait here with their gear, bag and bond.</div>';
  else h += '<div class="sub" style="margin-bottom:4px">They left when their pay ran out. To come back they want their full hiring fee plus 100 crystals per level, and they rejoin at your level with their gear, bag and bond.</div>';
  for (const id of ofs) h += row(id, '<button data-a="rehire" data-v="' + id + '"' + (save.gil < mercBribe(id) || full ? " disabled" : "") + ">Bribe · " + mercBribe(id) + " 💠</button>");
  const fallen = Object.keys(save.mercFallen || {}).length;
  if (fallen) h += '<div class="sub" style="margin-top:8px">🕯️ ' + fallen + " companion" + (fallen > 1 ? "s have" : " has") + " fallen in your service.</div>";
  return h;
}

function fmtDur(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m";
}

function partyPlayersHtml() {
  if (typeof NET_PT === "undefined") return "";
  let h = "<h3>👥 Players</h3>";
  if (NET_PT.invite) h += '<div class="item" style="border-color:#c9a227"><span><b>' + esc(NET_PT.invite.from) + '</b> invites you to their party.</span><div style="display:flex;gap:6px"><button class="pri" data-a="pjoin">Join</button><button data-a="pdecl">Decline</button></div></div>';
  if (!NET_PT.id) {
    h += '<div class="item"><span class="sub">You\'re not in a party. Invite a player here, with /invite Name, or tap them and choose Invite. Up to ' + CONFIG.partyMax + ' players.</span><button class="pri" data-a="pinv">Invite</button></div>';
    return h + "<h3>🛡️ Companions</h3>";
  }
  const lead = netLeaderName(), me = netIsLeader();
  const row = (name, job, lv, zone, hp, maxHp, extra) => '<div class="item"><div><b>' + (name === lead ? "👑 " : "") + esc(name) + '</b> <span class="sub">' + esc(job) + lv + " · " + esc(ZONES[zone] ? ZONES[zone].name : "?") + " · HP " + Math.ceil(hp) + "/" + maxHp + "</span></div>" + (extra || "") + "</div>";
  h += row(save.name, player.job, player.lv, S.zoneId, player.hp, player.maxHp, '<button data-a="pleave">Leave</button>');
  for (const m of netPartyList()) h += row(m.name, m.job, m.lv, m.zone, m.hp, m.maxHp, me ? '<button data-a="pkick" data-v="' + esc(m.name) + '">Remove</button>' : "");
  if (me && netPartySize() < CONFIG.partyMax) h += '<div style="margin:6px 0"><button class="pri" data-a="pinv">Invite a player</button></div>';
  h += '<div class="sub" style="margin:4px 0 8px">Kills share experience with party members in the same area and within about ' + Math.round(CONFIG.partyRange / 100) + ' strides. Gear drops go into a shared treasure pool for everyone nearby to lot on, and crystals are split. Party chat: /p text.</div>';
  return h + "<h3>🛡️ Companions</h3>";
}

function tabTrade() {
  const t = typeof NET_PT !== "undefined" ? NET_PT.trade : null;
  if (!t) return '<div class="sub">No trade open. Tap a player and choose Trade, or type /trade Name.</div>';
  const myH = netTradeMyHash(), theyOk = t.theirOk && t.theirOk === myH;
  const list = (side, mine) => (side.items.length ? side.items.map(s => '<div class="ln"><span>' + (ITEMS[s.id].icon || "📦") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + "</span>" + (mine ? '<button data-a="trem" data-v="' + s.id + '" style="padding:0 7px">✕</button>' : "") + "</div>").join("") : '<div class="sub">Nothing yet.</div>') + '<div class="ln"><span>💠 ' + side.gil + " crystals</span>" + (mine ? '<button data-a="tgil" style="padding:0 7px">Set</button>' : "") + "</div>";
  let h = '<div class="sub" style="margin-bottom:8px">Trading with <b>' + esc(t.name) + '</b>. Changing either offer clears both acceptances. The trade goes through when you both accept the same offers.</div>';
  if (t.msg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(t.msg) + "</div>";
  h += '<div class="trd"><div class="side' + (t.myOk ? " ok" : "") + '"><b>Your offer</b>' + (t.myOk ? ' <span class="sub">✓ accepted</span>' : "") + list(t.mine, true) + '</div><div class="side' + (theyOk ? " ok" : "") + '"><b>' + esc(t.name) + "'s offer</b>" + (theyOk ? ' <span class="sub">✓ accepted</span>' : "") + list(t.theirs, false) + "</div></div>";
  h += '<div style="display:flex;gap:8px;margin:10px 0"><button class="pri" data-a="tacc"' + (t.myOk ? " disabled" : "") + ">" + (t.myOk ? "Waiting…" : "Accept trade") + '</button><button data-a="tcan">Cancel</button></div>';
  const bag = save.inventory.filter(s => tradeable(s.id));
  const seen = new Set();
  h += "<h3>Your bag</h3>";
  if (!bag.length) h += '<div class="sub">Nothing you can trade. Key items and items marked Exclusive stay with you.</div>';
  for (const s of bag) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    const free = invCount(s.id) - netTradeOffered(s.id);
    if (free <= 0) continue;
    h += '<div class="item"><span>' + (ITEMS[s.id].icon || "📦") + " " + esc(ITEMS[s.id].name) + ' <span class="sub">×' + free + '</span></span><div style="display:flex;gap:6px"><button data-a="tadd" data-v="' + s.id + '">Add 1</button>' + (free > 1 ? '<button data-a="taddall" data-v="' + s.id + '">Add all</button>' : "") + "</div></div>";
  }
  return h;
}

function tabSocial() {
  const party = '<h3>👥 Party and companions</h3>' + tabParty();
  if (typeof NET_LS === "undefined" || !NET.member) return party + '<h3>🌐 Online</h3><div class="sub">Online features need the game server.</div>';
  if (!NET_LS.at && !NET_LS.loading) netLsRefresh().then(() => { if (S.modal === "social") renderModal(); });
  let h = party + (UI.socMsg ? '<div class="sub" style="color:#ffd54f;margin-bottom:6px">' + esc(UI.socMsg) + "</div>" : "");
  h += '<h3>🔎 Looking for a party</h3><div class="item"><div><b>' + (save.lfg ? "On" : "Off") + '</b><div class="sub">' + (save.lfg ? esc(save.seekMsg || "No message") + " · others see 🔎 next to your name in search" : "Turn on to let others know you want a party.") + '</div></div><div style="display:flex;gap:6px"><button data-a="socseekmsg">Message</button><button class="' + (save.lfg ? "" : "pri") + '" data-a="socseek">' + (save.lfg ? "Stop" : "Start") + "</button></div></div>";
  const q = UI.socQ || "";
  const res = netSearch(q).slice(0, 40);
  h += '<h3>🌐 Online now (' + NET_RT.online.length + ')</h3><div class="opt" style="margin-bottom:6px"><button data-a="socq">🔍 Filter' + (q ? ": " + esc(q) : "") + "</button>" + (q ? '<button data-a="socqclear">✕</button>' : "") + '<button data-a="socqlfg">🔎 Looking for party</button><button data-a="socqhere">📍 This area</button></div>';
  if (!res.length) h += '<div class="sub">Nobody matches.</div>';
  for (const o of res) {
    const me = netLc(o.name) === netLc(save.name), fr = (save.friends || []).some(f => netLc(f) === netLc(o.name));
    h += '<div class="item"><div><b>' + (o.lfg ? "🔎 " : "") + esc(o.name) + (fr ? " ⭐" : "") + '</b> <span class="sub">' + (JOBS[o.job] ? o.job : "?") + o.lv + (o.sub ? "/" + esc(o.sub) : "") + " · " + esc(ZONES[o.zone] ? ZONES[o.zone].name : "?") + (o.ls ? " · 🔗 " + esc(o.ls) : "") + "</span>" + (o.cmt ? '<div class="sub">"' + esc(o.cmt) + '"</div>' : "") + "</div>" + (me ? '<span class="sub">You</span>' : '<div style="display:flex;gap:4px;flex-wrap:wrap"><button data-a="soctell" data-v="' + esc(o.name) + '">Tell</button><button data-a="socinv" data-v="' + esc(o.name) + '">Invite</button>' + (fr ? "" : '<button data-a="socfadd" data-v="' + esc(o.name) + '">+ Friend</button>') + "</div>") + "</div>";
  }
  h += "<h3>⭐ Friends (" + (save.friends || []).length + ")</h3>";
  if (!(save.friends || []).length) h += '<div class="sub">No friends yet. Use + Friend above or /friend add Name. You\'re told when they come online.</div>';
  for (const f of save.friends || []) {
    const o = netOnline(f);
    h += '<div class="item"><div><b>' + esc(f) + '</b> <span class="sub">' + (o ? "🟢 " + (JOBS[o.job] ? o.job : "") + o.lv + " · " + esc(ZONES[o.zone] ? ZONES[o.zone].name : "?") : "⚪ offline") + '</span></div><div style="display:flex;gap:4px">' + (o ? '<button data-a="soctell" data-v="' + esc(f) + '">Tell</button><button data-a="socinv" data-v="' + esc(f) + '">Invite</button>' : "") + '<button data-a="socfdel" data-v="' + esc(f) + '">Remove</button></div></div>';
  }
  h += "<h3>🔗 Linkshells</h3>";
  if (NET_LS.invite) h += '<div class="item" style="border-color:#a5d6a7"><span><b>' + esc(NET_LS.invite.from) + "</b> invites you to <b>" + esc(NET_LS.invite.name) + '</b>.</span><button class="pri" data-a="lsjoin">Join</button></div>';
  if (NET_LS.err) h += '<div class="sub">' + esc(NET_LS.err) + "</div>";
  else if (!NET_LS.at) h += '<div class="sub">Loading…</div>';
  else if (!NET_LS.list.length) h += '<div class="sub">A linkshell is a chat group that stays together across areas, like a guild. Make one (500 crystals) and invite friends, or ask someone to invite you. Talk with /l.</div>';
  NET_LS.list.forEach((l, i) => {
    const act = l.id === save.lsActive, boss = l.rank === "leader", sack = l.rank === "sack";
    h += '<div class="item" style="display:block;border-color:' + esc(l.color) + '"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="color:' + esc(l.color) + '">🔗 ' + esc(l.name) + '</b> <span class="sub">/l' + (i + 1) + " · " + (boss ? "Leader" : sack ? "Sack holder" : "Member") + " · " + l.members.length + ' members</span></div><div style="display:flex;gap:4px;flex-wrap:wrap">' + (act ? '<span class="sub">Active (/l)</span>' : '<button data-a="lsact" data-v="' + l.id + '">Make active</button>') + (boss || sack ? '<button data-a="lsinv" data-v="' + l.id + '">Invite</button>' : "") + '<button data-a="lsleave" data-v="' + l.id + '">Leave</button></div></div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">' + l.members.map(m => { const on = !!netOnline(m.name); return '<span class="chip" style="font-size:11px">' + (m.rank === "leader" ? "👑 " : m.rank === "sack" ? "🎒 " : "") + (on ? "🟢 " : "") + esc(m.name) + (boss && m.rank !== "leader" ? ' <button data-a="lsrank" data-v="' + l.id + "|" + esc(m.name) + "|" + (m.rank === "sack" ? "pearl" : "sack") + '" style="padding:0 4px" title="' + (m.rank === "sack" ? "Make member" : "Make sack holder") + '">' + (m.rank === "sack" ? "▼" : "▲") + '</button><button data-a="lsrank" data-v="' + l.id + "|" + esc(m.name) + '|kick" style="padding:0 4px" title="Remove">✕</button>' : sack && m.rank === "pearl" ? ' <button data-a="lsrank" data-v="' + l.id + "|" + esc(m.name) + '|kick" style="padding:0 4px" title="Remove">✕</button>' : "") + "</span>"; }).join("") + "</div></div>";
  });
  if (NET_LS.at && !NET_LS.err && NET_LS.list.length < 3) h += '<div style="margin:6px 0"><button data-a="lsnew">➕ New linkshell (500 💠)</button></div>';
  h += "<h3>🚫 Blacklist</h3>" + ((save.blocked || []).length ? save.blocked.map(b => '<span class="chip" style="font-size:11px">' + esc(b) + ' <button data-a="socbdel" data-v="' + esc(b) + '" style="padding:0 4px">✕</button></span>').join(" ") : '<div class="sub">Nobody. Use /blacklist add Name to hide someone.</div>');
  return h;
}

function socAct(p, ok) { p.then(() => { UI.socMsg = ok || ""; renderModal(); }, e => { UI.socMsg = netAhErr(e); renderModal(); }); }

function mercSheet(id) {
  const m = MERCS[id], a = S.party.find(p => p.mercId === id);
  if (!m) { UI.mercSheet = null; return ""; }
  const gear = a ? a.gear : mercGearFor(id, player.lv), own = save.mercGear[id] || {}, bag = mercBag(id);
  let h = '<div style="margin-bottom:8px"><button data-a="msheet" data-v="">← All companions</button></div>';
  h += '<div class="item" style="display:block"><b style="color:' + m.color + '">' + esc(m.name) + '</b> <span class="sub">' + JOBS[m.job].name + " · " + m.role + " · Lv" + (a ? a.lv : player.lv) + (a ? " · HP " + a.hp + "/" + a.maxHp : "") + "</span></div>";
  h += "<h3>Wearing</h3>" + '<div style="display:flex;flex-wrap:wrap;gap:4px">' + (SLOTS.filter(sl => gear[sl]).map(sl => '<span class="chip" style="font-size:11px">' + esc(sl) + ": " + (ITEMS[gear[sl]].icon || "") + " " + esc(ITEMS[gear[sl]].name) + (own[sl] ? ' <button data-a="mtake" data-v="' + id + ":" + sl + '" style="padding:0 5px" title="Take it back">↩</button>' : "") + "</span>").join("") || '<span class="sub">Nothing.</span>') + "</div>";
  const sale = bag.map((x, i) => ({ x, i })).filter(e => e.x.sale);
  h += "<h3>👝 For sale</h3>";
  if (!sale.length) h += '<div class="sub">Nothing for sale. They sell what they carry when you reach a town with their bag at least half full.</div>';
  for (const { x, i } of sale) {
    const pr = mercSalePrice(x.id), it = ITEMS[x.id];
    h += '<div class="item" style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span>' + (it.icon || "") + " " + esc(it.name) + (x.qty > 1 ? " ×" + x.qty : "") + '</span><button data-a="mbuy" data-v="' + id + ":" + i + '"' + (save.gil < pr ? " disabled" : "") + ">Buy · " + pr + " 💠</button></div>";
  }
  const kept = bag.filter(x => !x.sale);
  h += "<h3>Kept (never sold)</h3>" + (kept.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px">' + kept.map(x => '<span class="chip" style="font-size:11px">' + (ITEMS[x.id].icon || "") + " " + esc(ITEMS[x.id].name) + " · Lv" + (ITEMS[x.id].lv || 1) + "</span>").join("") + "</div>" : '<div class="sub">Nothing. Gear they cannot wear at your level is kept here.</div>');
  h += '<div class="sub" style="margin-top:6px">🎒 Bag ' + bag.length + "/" + CONFIG.inventorySize + " slots</div>";
  const eq = save.inventory.filter(x => ITEMS[x.id].kind === "equip" && !mercCanWear(id, x.id));
  h += "<h3>Give gear</h3>";
  if (!eq.length) h += '<div class="sub">Nothing in your bag that ' + esc(m.name) + " can wear at your level.</div>";
  else h += '<div class="sub" style="margin-bottom:4px">If it is better than what they wear, they put it on and sell the old piece. If not, they hand it back.</div><div style="display:flex;flex-wrap:wrap;gap:4px">' + eq.map(x => '<button data-a="mgive" data-v="' + id + ":" + x.id + '" style="font-size:11px;padding:2px 7px"' + (mercUpgrade(id, x.id) ? "" : ' title="Not better than what they wear"') + ">" + (ITEMS[x.id].icon || "") + " Wear this: " + esc(ITEMS[x.id].name) + (mercUpgrade(id, x.id) ? " ⬆" : "") + "</button>").join("") + "</div>";
  return h;
}

function tabParty() {
  if (UI.mercSheet && save.hired.includes(UI.mercSheet)) return mercSheet(UI.mercSheet);
  UI.mercSheet = null;
  let h = partyPlayersHtml() + '<div class="sub" style="margin-bottom:8px">Stance: how your companions fight. Each companion works on a 1-hour contract of play time. When it runs out they ask for the next hour once the fight is over; refuse or can\'t pay and they go back to the Mercenary Hall, where you can bribe them to return under Old Friends.</div>';
  h += '<div style="display:flex;gap:6px;margin-bottom:10px">' + [["assist", "⚔ Assist", "Fight your target"], ["follow", "🚶 Follow", "Stay close, don't attack"], ["hold", "✋ Hold", "Stand ground"]].map(([k, l, d]) => '<button data-a="stance" data-v="' + k + '" title="' + d + '"' + (save.stance === k ? ' class="pri"' : "") + ">" + l + "</button>").join("") + "</div>";
  if (!save.hired.length) return h + '<div class="item"><span class="sub">No companions yet. Brann at the Mercenary Hall in the Outpost (or Dorrin in Saltreach, Hild in Ironvale) hires them out.</span></div>';
  const bagEq = save.inventory.filter(x => ITEMS[x.id].kind === "equip");
  for (const id of save.hired) {
    const m = MERCS[id], a = S.party.find(p => p.mercId === id);
    const bl = bondLevel(id), st = COMPANION_CFG.bondSteps, b = save.bond[id] || 0;
    const next = bl < COMPANION_CFG.maxBond ? st[bl + 1] : null;
    const pct = next ? Math.round(100 * (b - st[bl]) / (next - st[bl])) : 100;
    h += '<div class="item" style="display:block">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="color:' + m.color + '">' + esc(m.name) + "</b> <span class=\"sub\">" + JOBS[m.job].name + " · " + m.role + (a ? " · HP " + a.hp + "/" + a.maxHp : "") + '</span></div><span><button data-a="msheet" data-v="' + id + '">Sheet' + (mercForSale(id) ? " 👝" : "") + '</button> <button data-a="dismiss" data-v="' + id + '">Dismiss</button></span></div>';
    h += '<div class="sub" style="margin:4px 0">💞 Bond ' + bl + "/" + COMPANION_CFG.maxBond + " (+" + Math.round(bl * COMPANION_CFG.bondBonus * 100) + '% stats)</div><div class="bar" style="height:6px;margin-bottom:6px"><i style="width:' + pct + '%;background:#f48fb1"></i></div>';
    h += '<div class="sub">💠 Contract: ' + fmtDur(mercContractLeft(id) * 1000) + " of play left · next hour " + mercWage(id) + ' crystals <button data-a="mpay" data-v="' + id + '" style="font-size:11px;padding:1px 6px"' + (save.gil < mercWage(id) ? " disabled" : "") + ">Pay now</button></div>";
    h += '<div class="sub">🎒 Bag ' + (save.mercInv && save.mercInv[id] ? save.mercInv[id].length : 0) + "/" + CONFIG.inventorySize + " slots · " + mercBagCount(id) + " items kept to sell. They sell everything when you reach a town with their bag at least half full.</div>";
    const own = save.mercGear[id] || {};
    const gear = a ? a.gear : mercGearFor(id, player.lv);
    h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">' + SLOTS.filter(sl => gear[sl]).map(sl => '<span class="chip" style="font-size:11px">' + esc(ITEMS[gear[sl]].name) + (own[sl] ? ' <button data-a="mtake" data-v="' + id + ":" + sl + '" style="padding:0 5px">↩</button>' : "") + "</span>").join("") + "</div>";
    const can = bagEq.filter(x => !mercCanWear(id, x.id));
    if (can.length) h += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px"><span class="sub">Give:</span>' + can.map(x => '<button data-a="mgive" data-v="' + id + ":" + x.id + '" style="font-size:11px;padding:2px 7px">' + (ITEMS[x.id].icon || "") + " " + esc(ITEMS[x.id].name) + "</button>").join("") + "</div>";
    h += "</div>";
  }
  return h;
}

function beastHabitat(k) {
  const out = [];
  for (const z in ZONES) if (ZONES[z].spawns.some(sp => [sp].concat(sp.alts || []).some(o => o.fam === k || (o.nm && o.nm.id === k)))) out.push(ZONES[z].name);
  return out;
}

const DB_CATS = [["items", "🧪", "Items"], ["equipment", "🛡️", "Equipment"], ["magic", "✦", "Magic"], ["abilities", "⚡", "Abilities"], ["jobs", "🎓", "Jobs"], ["people", "👥", "People"], ["places", "🗺️", "Places"], ["beasts", "📖", "Bestiary"]];

function dbSyncSeen() {
  if (!save.seen) save.seen = { items: {}, npcs: {} };
  for (const s of save.inventory) save.seen.items[s.id] = 1;
  for (const k in save.gear) if (save.gear[k]) save.seen.items[save.gear[k]] = 1;
  for (const s of save.storage || []) if (s && ITEMS[s.id]) save.seen.items[s.id] = 1;
}
function dbPic(icon, thumb, color) {
  return '<div class="bpic"' + (color ? ' style="background:radial-gradient(circle at 50% 40%,' + color + '66,rgba(10,14,28,.85))"' : "") + ">" + (thumb ? '<img src="' + thumb + '" alt="">' : '<span style="font-size:38px;color:#fff">' + icon + "</span>") + "</div>";
}
function dbCard(pic, title, lines) {
  return '<div class="item beast" style="display:flex;gap:10px;align-items:flex-start">' + pic + '<div style="flex:1;min-width:0"><b>' + title + "</b>" + lines.filter(Boolean).map(l => '<div class="sub" style="margin-top:3px">' + l + "</div>").join("") + "</div></div>";
}
function dbCount(have, total, what) {
  return '<div class="sub" style="margin-bottom:8px">' + have + " / " + total + " " + what + " recorded.</div>";
}
function dbThumbReady() { if (S.modal === "database") renderModal(); }

function dbItems(equip) {
  const ids = Object.keys(ITEMS).filter(id => (ITEMS[id].kind === "equip") === equip);
  const have = ids.filter(id => save.seen.items[id]);
  let h = dbCount(have.length, ids.length, equip ? "pieces of equipment" : "items") + '<div class="sub" style="margin-bottom:8px">Anything you have owned is recorded here.</div>';
  for (const id of have) {
    const it = ITEMS[id];
    if (equip) {
      h += dbCard(dbPic(it.icon || "📦", null, "#8aa4d8"), esc(it.name), [itemCard(id)]);
    } else {
      const tags = [it.kind, it.rarity, it.rare ? "Rare" : "", it.ex ? "Ex" : ""].filter(Boolean).join(" · ");
      h += dbCard(dbPic(it.icon || "📦", null, "#8aa4d8"), esc(it.name), [esc(itemDesc(id)), esc(tags) + (it.price ? " · Value " + it.price + " crystals" : "") + (it.stack > 1 ? " · Stacks to " + it.stack : ""), "You carry " + invCount(id)]);
    }
  }
  return h;
}
function dbMagic() {
  const ids = Object.keys(SPELLS), have = ids.filter(id => save.spells.includes(id));
  let h = dbCount(have.length, ids.length, "spells");
  for (const id of have) {
    const sp = SPELLS[id], jb = Object.keys(sp.jobs).map(j => j + " " + sp.jobs[j]).join(", ");
    const el = sp.el || sp.element, col = el && ELEMENT_COLORS[el] ? ELEMENT_COLORS[el] : "#b39ddb";
    h += dbCard(dbPic(sp.kind === "heal" ? "💚" : sp.kind === "buff" ? "✨" : "🔮", null, col), esc(sp.name), [esc(sp.desc || ""), "MP " + sp.mp + " · Cast " + sp.cast + "s · Recast " + sp.recast + "s" + (el ? " · " + esc(el) : ""), "Learned by: " + esc(jb)]);
  }
  return h;
}
function dbAbilities() {
  const ids = Object.keys(ABILITIES), have = ids.filter(id => (save.jobs[ABILITIES[id].job] || { lv: 0 }).lv >= ABILITIES[id].lv);
  let h = dbCount(have.length, ids.length, "abilities");
  for (const id of have) {
    const ab = ABILITIES[id], jb = JOBS[ab.job];
    h += dbCard(dbPic(jb ? jb.icon : "⚡", null, jb ? jb.color : "#ffd54f"), esc(ab.name), [esc(ab.desc || ""), esc(jb ? jb.name : ab.job) + " Lv." + ab.lv + " · Recast " + ab.recast + "s · Target: " + esc(ab.target || "self")]);
  }
  return h;
}
function dbJobs() {
  const ids = Object.keys(JOBS).filter(j => (save.jobs[j] && save.jobs[j].lv > 1) || j === save.mainJob || j === save.subJob);
  let h = dbCount(ids.length, Object.keys(JOBS).length, "jobs");
  for (const j of ids) {
    const jb = JOBS[j], lv = save.jobs[j].lv;
    const abil = Object.keys(ABILITIES).filter(id => ABILITIES[id].job === j && ABILITIES[id].lv <= lv).map(id => ABILITIES[id].name);
    const spl = Object.keys(SPELLS).filter(id => SPELLS[id].jobs[j] && SPELLS[id].jobs[j] <= lv).map(id => SPELLS[id].name);
    h += dbCard(dbPic(jb.icon, null, jb.color), esc(jb.name) + " (" + j + ")" + (j === save.mainJob ? " · main" : j === save.subJob ? " · support" : ""), ["Level " + lv + " · Experience " + (save.jobs[j].xp || 0), "Base HP " + jb.hp[0] + " · MP " + jb.mp[0], "Abilities: " + (abil.length ? esc(abil.join(", ")) : "none yet"), "Magic: " + (spl.length ? esc(spl.join(", ")) : "none yet")]);
  }
  return h;
}
function dbWhere(npcId) {
  const out = [];
  for (const z in ZONES) if ((ZONES[z].npcs || []).some(n => n.id === npcId)) out.push(ZONES[z].name);
  return out;
}
function dbPeople() {
  const ids = Object.keys(NPCS).filter(id => !NPCS[id].prop), have = ids.filter(id => save.seen.npcs[id]);
  let h = dbCount(have.length, ids.length, "people") + '<div class="sub" style="margin-bottom:8px">Talk to someone to add them.</div>';
  for (const id of have) {
    const n = NPCS[id], key = "npc:" + id;
    const pic = typeof beastThumb === "function" ? beastThumb(key, dbThumbReady, Object.assign({ id, kind: "npc", x: 0, y: 0, face: 0, radius: 14 }, n)) : null;
    const where = dbWhere(id);
    h += dbCard(dbPic("👤", pic, "#a5d6a7"), esc(n.name), ["Found in: " + esc(where.join(", ") || "various places")]);
  }
  return h;
}
function dbPlaces() {
  const ids = Object.keys(ZONES).filter(z => (save.discovered || []).includes(z) || z === S.zoneId), seen = new Set(ids);
  let h = dbCount(ids.length, Object.keys(ZONES).length, "places");
  for (const z of ids) {
    const zn = ZONES[z], ex = [...new Set((zn.exits || []).map(e => ZONES[e.to] ? ZONES[e.to].name : null).filter(Boolean))];
    const folk = (zn.npcs || []).filter(n => save.seen.npcs[n.id] && NPCS[n.id]).map(n => NPCS[n.id].name);
    const beasts = Object.keys(BESTIARY).filter(k => save.bestiary[k] && beastHabitat(k).includes(zn.name)).map(k => (FAMILIES[k] || NM_FAMILIES[k] || { name: k }).name || k);
    const ico = zn.safe ? "🏘️" : zn.theme === "town" ? "🏘️" : zn.theme === "field" ? "🌾" : "🗺️";
    h += dbCard(dbPic(ico, null, "#d8a838"), esc(zn.name) + (zn.safe ? " · safe" : ""), [esc(zn.city ? "City of " + zn.city : "Theme: " + (zn.theme || "field")), "Leads to: " + esc(ex.join(", ") || "nowhere"), "People you know here: " + esc(folk.join(", ") || "none yet"), "Creatures met here: " + esc(beasts.join(", ") || "none yet")]);
  }
  return h;
}

function tabDatabase() {
  dbSyncSeen();
  if (!DB_CATS.some(c => c[0] === UI.dbCat)) UI.dbCat = "items";
  let h = '<div class="opt" style="flex-wrap:wrap;margin-bottom:8px">' + DB_CATS.map(c => '<button data-a="dbcat" data-v="' + c[0] + '"' + (c[0] === UI.dbCat ? ' class="pri"' : "") + ">" + c[1] + " " + c[2] + "</button>").join("") + "</div>";
  const fn = { items: () => dbItems(false), equipment: () => dbItems(true), magic: dbMagic, abilities: dbAbilities, jobs: dbJobs, people: dbPeople, places: dbPlaces, beasts: dbBeasts }[UI.dbCat];
  return h + fn();
}

const STAT_GROUPS = [
  ["Combat", [["Monsters defeated", "kills"], ["Notorious monsters", "nm"], ["Times KO'd", "kos"], ["Damage dealt", "dmgDealt"], ["Damage taken", "dmgTaken"], ["Biggest hit", "bigHit"], ["Spells cast", "spellsCast"], ["Abilities used", "abilitiesUsed"], ["Skillchains", "sc"], ["Magic bursts", "mb"], ["Ranger kills", "rngKills"], ["Battlefields won", "bfWins"], ["Summons", "summons"]]],
  ["Crafting and gathering", [["Items crafted", "crafts"], ["High-quality results", "hq"], ["Gathered", "gathers"], ["Fish caught", "fish"], ["Big fish", "bigFish"], ["Meals eaten", "meals"], ["Items used", "itemsUsed"]]],
  ["Economy", [["Crystals from monsters", "killGil"], ["Trades", "trades"], ["Auction purchases", "ahBought"], ["Auction sales", "ahSold"], ["Bounties", "bounties"], ["Lots won", "lotsWon"]]],
  ["Travel", [["Distance walked", "walk"], ["Distance ridden", "ride"], ["Jumps", "jumps"], ["Boat rides", "boatRides"], ["Blessings", "blessings"]]]
];
function tabStats() {
  const st = save.stats || {}, num = v => Math.round(v || 0).toLocaleString();
  const lvls = Object.keys(JOBS).map(j => save.jobs[j].lv), jobsMax = lvls.filter(l => l >= 75).length;
  const done = Object.keys(QUESTS).filter(q => save.quests[q] === "done").length;
  const lore = [["Playing time", fmtPlay(save.playSec)], ["Highest job level", Math.max(...lvls)], ["Jobs above level 1", lvls.filter(l => l > 1).length + " / " + lvls.length], ["Achievements", ACHIEVEMENTS.filter(a => save.ach[a.id]).length + " / " + ACHIEVEMENTS.length], ["Quests completed", done + " / " + Object.keys(QUESTS).length], ["Places discovered", (save.discovered || []).length + " / " + Object.keys(ZONES).length], ["Creatures recorded", Object.keys(save.bestiary).length + " / " + Object.keys(BESTIARY).length], ["Items discovered", Object.keys(save.seen.items).length + " / " + Object.keys(ITEMS).length], ["Spells learned", save.spells.length + " / " + Object.keys(SPELLS).length], ["People met", Object.keys(save.seen.npcs).length], ["Crystals held", num(save.gil)], ["Companions hired", (save.hired || []).length]];
  const row = (k, v) => '<div class="item" style="display:flex;justify-content:space-between;align-items:center"><span>' + esc(k) + "</span><b>" + esc(String(v)) + "</b></div>";
  const bk = Object.keys(save.bestiary), totalKills = bk.reduce((n, k) => n + (save.bestiary[k].kills || 0), 0);
  const top = bk.sort((a, b) => (save.bestiary[b].kills || 0) - (save.bestiary[a].kills || 0))[0];
  const topName = top && save.bestiary[top].kills ? ((FAMILIES[top] || NM_FAMILIES[top] || {}).name || top) + " (" + save.bestiary[top].kills + ")" : "none yet";
  const nmDone = Object.keys(save.nmKilled || {}).length, nmTot = Object.keys(NM_FAMILIES).length;
  const qs = Object.keys(QUESTS), qActive = qs.filter(q => save.quests[q] === "active" || save.quests[q] === "killed").length;
  const cr = save.crafts || {}, gs = save.gatherSkill || {};
  const more = [["Creatures defeated (by kind)", totalKills.toLocaleString()], ["Most defeated", topName], ["Notorious monsters beaten", nmDone + " / " + nmTot], ["Quests in progress", qActive], ["Key items held", (save.keyItems || []).length], ["Items in bag", save.inventory.length + " / " + CONFIG.inventorySize], ["Items in storage", (save.storage || []).length], ["Furniture owned", (save.furniture || []).length], ["Pets learned", (save.buddies || []).length], ["Guild points earned", ((save.guild && save.guild.total) || 0).toLocaleString()], ["Main job", JOBS[save.mainJob].name + " " + save.jobs[save.mainJob].lv], ["Support job", save.subJob ? JOBS[save.subJob].name + " " + save.jobs[save.subJob].lv : "none"]];
  const jobsHave = Object.keys(JOBS).filter(j => save.jobs[j].lv > 1).sort((a, b) => save.jobs[b].lv - save.jobs[a].lv);
  const skillsRows = Object.keys(cr).map(k => [k.charAt(0).toUpperCase() + k.slice(1), Math.floor(cr[k] || 0)]).concat(Object.keys(gs).map(k => [k.charAt(0).toUpperCase() + k.slice(1), Math.floor(gs[k] || 0)]));
  let h = "<h3>Adventure</h3>" + lore.concat(more).map(r => row(r[0], r[1])).join("");
  if (jobsHave.length) h += "<h3>Job levels</h3>" + jobsHave.map(j => row(JOBS[j].name, "Lv." + save.jobs[j].lv)).join("");
  h += "<h3>Craft and gather skills</h3>" + skillsRows.map(r => row(r[0], r[1])).join("");
  for (const g of STAT_GROUPS) h += "<h3>" + g[0] + "</h3>" + g[1].map(r => row(r[0], num(st[r[1]]))).join("");
  return h;
}

function dbBeasts() {
  const keys = Object.keys(BESTIARY);
  const known = keys.filter(k => save.bestiary[k]);
  let h = '<div class="sub" style="margin-bottom:8px">' + known.length + " / " + keys.length + " creatures recorded. Defeat a creature to add it; defeat more to learn more.</div>";
  for (const k of keys) {
    const b = save.bestiary[k];
    const f = FAMILIES[k] || (NM_FAMILIES[k] && Object.assign({}, FAMILIES[NM_FAMILIES[k].base], NM_FAMILIES[k], { nm: true }));
    if (!b || !f) continue;
    const info = BESTIARY[k];
    let body = '<div class="sub">' + info.type + (f.nm ? " · Notorious" : "") + " · Seen in " + esc(beastHabitat(k).join(", ") || "unknown parts") + " · Defeated " + b.kills + "</div>";
    body += '<div style="margin:5px 0;font-size:13px">' + esc(info.lore) + "</div>";
    if (b.jobs && b.jobs.length) body += '<div class="sub">Seen fighting as: ' + esc(b.jobs.map(j => JOBS[j] ? JOBS[j].name : j).join(", ")) + "</div>";
    if (b.kills >= 1) {
      const ag = f.aggro ? Object.keys(f.aggro).map(x => ({ sight: "hunts by sight", sound: "hears footsteps", magic: "senses magic", lowhp: "smells weakness" }[x])).join(", ") : "peaceful unless provoked";
      body += '<div class="sub">Behaviour: ' + ag + (f.link ? " · calls for help" : "") + (f.tpMove ? " · special: " + esc(f.tpMove.name) : "") + "</div>";
    } else body += '<div class="sub">Defeat one to learn its habits.</div>';
    body += '<div class="sub">' + esc(temperLine(f, b)) + "</div>";
    const need = f.nm ? 1 : 5;
    if (b.kills >= need) {
      const weak = Object.keys(f.weak || {});
      const loot = (f.loot || []).map(([id]) => ITEMS[id] ? ITEMS[id].name : id);
      if (!f.nm && !f.boss && mobJobOk(f)) loot.push("crystals", "gear and scrolls its job can use");
      else if (!f.nm && !f.boss && !f.summoned) loot.push("trade " + ({ hide: "hides", chitin: "chitin", fibre: "fibre", scale: "scales", core: "cores" }[TROPHY_KIND[f.model] || "hide"]));
      body += '<div class="sub">Weak to: ' + (weak.length ? weak.join(", ") : "nothing in particular") + "</div>";
      body += '<div class="sub">Known to carry: ' + esc(loot.join(", ")) + "</div>";
    } else if (b.kills >= 1) body += '<div class="sub">Defeat ' + (need - b.kills) + " more to learn its weaknesses and spoils.</div>";
    const pic = typeof beastThumb === "function" ? beastThumb(k, () => { if (S.modal === "database") renderModal(); }) : null;
    h += '<div class="item beast" style="display:flex;gap:10px;align-items:flex-start"><div class="bpic">' + (pic ? '<img src="' + pic + '" alt="">' : '<span>' + (typeof THUMBS !== "undefined" && THUMBS.cache.has(k) ? "?" : "…") + "</span>") + '</div><div style="flex:1;min-width:0"><b>' + (f.nm ? "☠ " : "") + esc(f.name) + "</b>" + body + "</div></div>";
  }
  return h;
}

function augText(id) {
  const a = save.augments[id];
  return a && a.length ? a.map(([k, v]) => STAT_LABELS[k] + " +" + v).join(", ") : "";
}

function tabForge() {
  const c0 = AUGMENT_CFG;
  let h = '<div class="sub" style="margin-bottom:8px">Each augment costs ' + c0.gilPerLv + ' crystals per item level, ' + Object.keys(c0.mats).map(m => c0.mats[m] + " " + ITEMS[m].name).join(" and ") + ". Up to " + c0.max + " augments per piece; reforging rerolls them all for " + c0.reforgeGilPerLv + " crystals per level plus the same materials. Augments apply to every copy of that item you own.</div>";
  if (UI.forgeMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.forgeMsg) + "</div>";
  const ids = [...new Set(Object.values(save.gear).concat(save.inventory.filter(x => ITEMS[x.id].kind === "equip").map(x => x.id)))].filter(Boolean);
  if (!ids.length) return h + '<div class="item"><span class="sub">You have no equipment.</span></div>';
  for (const id of ids) {
    const it = ITEMS[id], cur = save.augments[id] || [];
    const worn = Object.values(save.gear).includes(id);
    const c = augmentCost(id, false), r = augmentCost(id, true);
    h += '<div class="item"><div><b>' + (it.icon || "") + " " + esc(it.name) + "</b>" + (worn ? ' <span class="sub">(equipped)</span>' : "") + '<div class="sub">' + (cur.length ? "✨ " + esc(augText(id)) : "No augments") + "</div></div><div style=\"display:flex;gap:5px\">" +
      (cur.length < c0.max ? '<button data-a="augment" data-v="' + id + '"' + (canAugment(id, false) ? " disabled" : "") + ">Augment · " + c.gil + " 💠</button>" : "") +
      (cur.length ? '<button data-a="reforge" data-v="' + id + '"' + (canAugment(id, true) ? " disabled" : "") + ">Reforge · " + r.gil + " 💠</button>" : "") + "</div></div>";
  }
  return h;
}

function tabStable() {
  let h = '<div class="sub" style="margin-bottom:8px">Ysolde can dye your Thornstrider. Once bought, you can switch between coats for free.</div>';
  if (UI.stableMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.stableMsg) + "</div>";
  for (const id in MOUNT_COATS) {
    const c = MOUNT_COATS[id], own = save.coats.includes(id), cur = save.mountCoat === id;
    h += '<div class="item"><div style="display:flex;gap:10px;align-items:center"><span style="width:26px;height:26px;border-radius:50%;background:#' + c.main.toString(16).padStart(6, "0") + ";border:3px solid #" + c.glow.toString(16).padStart(6, "0") + '"></span><b>' + esc(c.name) + "</b></div>" + (cur ? '<span class="sub">Current</span>' : '<button data-a="coat" data-v="' + id + '">' + (own ? "Use" : "Buy · " + c.price + " 💠") + "</button>") + "</div>";
  }
  h += "<h3>Saddle</h3>";
  h += '<div class="item"><div><b>Swift Saddle</b><div class="sub">Your Thornstrider runs ' + Math.round((SADDLE_BONUS - 1) * 100) + "% faster. Companions keep up.</div></div>" + (save.saddle ? '<span class="sub">Owned ✓</span>' : '<button data-a="saddle">Buy · ' + SADDLE_PRICE + " 💠</button>") + "</div>";
  h += "<h3>The Hollow Run</h3>";
  h += '<div class="sub">Ride through ' + RACE.checkpoints.length + " checkpoints across Rocky Hollow: " + RACE.checkpoints.map(c => c.name).join(" → ") + ". Medals: " + RACE.medals.map(m => m[0] + " under " + m[1] + "s (first time +" + m[2] + " 💠)").join(", ") + ". Best: " + (save.race.best != null ? save.race.best + "s" : "none yet") + ".</div>";
  return h;
}

function tabRename() {
  let h = '<div class="sub" style="margin-bottom:8px">Your name is <b>' + esc(save.name || "") + '</b>. A new name costs ' + RENAME_COST.toLocaleString() + ' crystals: 2 to 12 letters, no spaces, and not already taken.</div>';
  h += '<div class="opt"><input id="renIn" type="text" maxlength="12" placeholder="New name" style="height:32px;padding:0 8px;border-radius:6px;border:1px solid var(--edge2);background:rgba(10,12,20,.8);color:#f2efe6"><button class="pri" data-a="rename"' + (UI.renBusy ? " disabled" : "") + '>Change name</button></div>';
  if (UI.renMsg) h += '<div class="sub" style="margin-top:6px;color:' + (UI.renOk ? "#9be29b" : "#ff8a80") + '">' + esc(UI.renMsg) + "</div>";
  return h;
}

function tabBoard() {
  const list = boardToday();
  let h = '<div class="sub" style="margin-bottom:8px">Townsfolk pin up requests each day. Fill them for crystals and experience. New notes go up at midnight (UTC).</div>';
  if (UI.boardMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.boardMsg) + "</div>";
  for (const r of list) {
    const done = save.board.done.includes(r.id);
    const need = Object.keys(r.items).map(it => ITEMS[it].name + " " + Math.min(invCount(it), r.items[it]) + "/" + r.items[it]).join(", ");
    const ready = Object.keys(r.items).every(it => invCount(it) >= r.items[it]);
    h += '<div class="item"' + (done ? ' style="opacity:.5"' : "") + "><div><b>" + esc(r.who) + '</b><div class="sub">Wants: ' + esc(need) + " · Pays " + r.gil + " 💠</div></div>" + (done ? '<span class="sub">Filled ✓</span>' : '<button data-a="trade" data-v="' + r.id + '"' + (ready ? "" : " disabled") + ">Hand over</button>") + "</div>";
  }
  return h;
}

function tabPets() {
  const have = save.buddies, cur = save.buddy;
  let h = '<div class="sub" style="margin-bottom:8px">Pets follow you around for company. They never fight, can\'t be attacked and give no bonuses. Equip one, then summon it here or with /pet. Unequip to bag turns the equipped pet back into its item.</div>';
  if (UI.petMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.petMsg) + "</div>";
  if (cur && BUDDIES[cur]) {
    const B = BUDDIES[cur];
    h += '<div class="item" style="border-color:#c9a227"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:28px">' + B.icon + "</span><div><b>" + esc(buddyName(cur)) + '</b> <span class="sub">· ' + esc(B.name) + '</span><div class="sub">' + esc(B.lore) + "</div></div></div><div style=\"display:flex;gap:6px\"><button data-a=\"petname\" data-v=\"" + cur + '">Rename</button><button class="pri" data-a="petsummon">' + (S.buddy ? "Dismiss" : "Summon") + "</button>" + (petItemOf(cur) ? '<button data-a="petbag" data-v="' + cur + '">Unequip to bag</button>' : "") + "</div></div>";
  } else h += '<div class="sub" style="margin-bottom:8px">No pet equipped.</div>';
  h += "<h3>Your pets (" + have.length + ")</h3>";
  if (!have.length) h += '<div class="sub">None yet. Pets are very rare drops from monsters and notorious monsters, a rare catch in Saltreach, and a gift at the end of the story.</div>';
  for (const id of have) {
    const B = BUDDIES[id];
    h += '<div class="item"' + (id === cur ? ' style="border-color:#c9a227"' : "") + '><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">' + B.icon + "</span><div><b>" + esc(buddyName(id)) + (save.buddyNames[id] ? ' <span class="sub">(' + esc(B.name) + ")</span>" : "") + '</b><div class="sub">' + esc(B.lore) + "</div></div></div>" + (id === cur ? '<span class="sub">Equipped ✓</span>' : '<button data-a="petsel" data-v="' + id + '">Equip</button>') + "</div>";
  }
  const others = Object.keys(BUDDIES).filter(id => !have.includes(id) && !BUDDY_SHOP.some(s => s[0] === id));
  if (others.length) h += '<h3>Still to find</h3><div class="sub">' + others.map(id => BUDDIES[id].icon + " " + BUDDIES[id].name).join(" · ") + "</div>";
  return h;
}

function sparkline(vals, w, h) {
  const lo = Math.min(...vals), hi = Math.max(...vals), rg = Math.max(1, hi - lo);
  const pts = vals.map((v, i) => (i / (vals.length - 1) * w).toFixed(1) + "," + (h - 3 - (v - lo) / rg * (h - 6)).toFixed(1)).join(" ");
  const up = vals[vals.length - 1] >= vals[0];
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" style="display:block"><polyline points="' + pts + '" fill="none" stroke="' + (up ? "#8fd66a" : "#ff8a80") + '" stroke-width="2" stroke-linejoin="round"/></svg>';
}

function ahTrend(id) { const hst = priceHistory(id, 3); const d = (hst[2] - hst[0]) / Math.max(1, hst[0]); return d > 0.03 ? '<span style="color:#8fd66a">▲</span>' : d < -0.03 ? '<span style="color:#ff8a80">▼</span>' : '<span class="sub">▬</span>'; }

function ahEssPick() {
  const have = essenceIds().filter(k => invCount(k) > 0);
  if (UI.ahEss && have.includes(UI.ahEss)) return UI.ahEss;
  return have.sort((a, b) => invCount(b) - invCount(a))[0] || null;
}
function ahEssRow() {
  const pick = ahEssPick(), ids = essenceIds().filter(k => invCount(k) > 0);
  if (!ids.length) return '<div class="sub" style="margin-top:4px">You hold no Essence crystals.</div>';
  return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:6px"><span class="sub">Pay Essence with</span>' + ids.map(k => '<button data-a="ahess" data-v="' + k + '"' + (k === pick ? ' class="pri"' : "") + ">" + (ITEMS[k].icon || "") + " " + esc(ITEMS[k].name) + " ×" + invCount(k) + "</button>").join("") + "</div>";
}
function ahDetail(id) {
  const it = ITEMS[id], hist = priceHistory(id, 12), cur = hist[hist.length - 1], base = it.price;
  let h = '<div class="item" style="display:block;border-color:#c9a227"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + esc(itemDesc(id)) + '</div></div><div style="text-align:right"><b>' + cur + ' 💠</b><div class="sub">usual ' + base + "</div></div></div>";
  h += '<div style="margin:8px 0 2px">' + sparkline(hist, 240, 46) + '</div><div class="sub">Price over the last three game days: low ' + Math.min(...hist) + ", high " + Math.max(...hist) + ".</div>";
  const q = UI.ahQty || 1;
  if (UI.ahView === "sell") {
    const unit = UI.ahPrice / q, tn = ahTownName(ahHere()), mins = Math.round(AH_CFG.townBuySec / 60);
    const speed = townEligible(UI.ahPrice, q, id) ? "can be bought by " + tn + " (it buys one lot every " + mins + " real minutes, from lots up at least " + mins + " minutes)" : "is too high for " + tn + " to buy (it pays up to " + townCeil(id) + " each)";
    h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px"><span class="sub">Qty</span><button data-a="ahqty" data-v="-1">−</button><b>' + q + '</b><button data-a="ahqty" data-v="1">+</button><span class="sub" style="margin-left:10px">Price</span><button data-a="ahprice" data-v="-0.1">−10%</button><b>' + UI.ahPrice + ' 💠</b><button data-a="ahprice" data-v="0.1">+10%</button></div>';
    h += '<div class="sub" style="margin-top:6px">' + Math.round(unit) + " each · fee " + ahFee(UI.ahPrice) + " 💠 (" + Math.round(AH_CFG.fee * 100) + "%, not refunded) + " + ahEssenceFee(UI.ahSel) + " Essence (you have " + essenceHeld() + ") · at this price it " + speed + '.</div>' + ahEssRow() + '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button data-a="ahlist">Sell to the market</button>' + (typeof netAhPost === "function" && NET.member ? '<button data-a="pmpost"' + (UI.pmBusy ? " disabled" : "") + '>🌐 Offer to players</button>' : "") + '</div><div class="sub" style="margin-top:4px">The town buys at most one of your lots every 20 real minutes. Players can buy your lot at exactly your price, with no time limit (same 3% fee).</div>';
  } else {
    const P = typeof pmLoad === "function" && typeof netAhList === "function" && NET.member ? pmLoad(false) : null;
    const lines = marketLines(id, P && P.at ? P.list : []).filter(l => !UI.ahSrc || UI.ahSrc === "all" || l.kind === UI.ahSrc);
    if (!lines.length) h += '<div class="sub" style="margin-top:8px">Nobody is selling this' + (UI.ahSrc && UI.ahSrc !== "all" ? " in this filter" : " right now") + ".</div>";
    if (lines.length) h += '<div class="ahBox" style="margin-top:8px"><div class="ahLine" style="color:#c8d0ff;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;border-bottom:2px solid rgba(220,224,255,.5)"><span>Seller</span><span>Amount</span><span class="un">Price</span><span class="ctl"></span></div>';
    for (const l of lines) {
      const k = AH_KINDS[l.kind], q1 = Math.min(q, l.qty), cost = l.stock ? l.unit * q1 : l.price, poor = save.gil < cost;
      const buyBtn = '<button data-a="' + (l.lot != null ? "pmbuy" : "ahbuylocal") + '" data-v="' + (l.lot != null ? l.lot : l.local) + '"' + (poor || UI.pmBusy ? " disabled" : "") + ">Buy · " + cost + " 💠</button>";
      const stockBtn = '<button data-a="ahqty" data-v="-1">−</button><b>' + q1 + '</b><button data-a="ahqty" data-v="1">+</button><button data-a="ahbuy" data-v="' + l.town + '"' + (poor ? " disabled" : "") + ">Buy · " + cost + " 💠</button>";
      h += '<div class="ahLine" style="border-left:3px solid ' + k.color + '"><span style="color:' + k.color + '" title="' + esc(l.owner ? "Sold for " + l.owner : k.label) + '">' + k.icon + " " + esc(l.seller) + "</span><span>" + (l.stock ? l.qty + " in stock" : "× " + l.qty) + '</span><span class="un">' + Math.round(l.unit) + ' each</span><span class="ctl">' + (l.own ? '<span class="sub">Yours</span>' : l.stock ? stockBtn : buyBtn) + "</span></div>";
    }
    if (lines.length) h += "</div>";
  }
  return h + "</div>";
}

function pmLoad(force) {
  const P = UI.pm = UI.pm || {};
  if (typeof netAhList !== "function" || P.loading || (!force && P.at && Date.now() - P.at < 20000)) return P;
  P.loading = true;
  Promise.all([netAhList(), netAhMine(), netAhBox()]).then(([list, mine, box]) => { Object.assign(P, { list, mine, box, at: Date.now(), err: "" }); }, e => { P.err = netAhErr(e); P.at = Date.now(); }).finally(() => { P.loading = false; if (S.modal === "auction") renderModal(); });
  return P;
}

function pmLeft(t) { const ms = Date.parse(t) - Date.now(); if (!(ms < 3e11)) return "no time limit"; const m = Math.max(0, Math.round(ms / 60000)); return (m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m") + " left"; }

function pmAct(p, ok) {
  UI.pmBusy = true; UI.ahMsg = ""; renderModal();
  p.then(() => { UI.ahMsg = ok || ""; }, e => { UI.ahMsg = netAhErr(e); }).finally(() => { UI.pmBusy = false; pmLoad(true); renderModal(); });
}

function tabAuction() {
  const view = UI.ahView || "buy", cat = UI.ahCat || "materials", news = marketNews(marketDay());
  let h = '<div class="sub" style="margin-bottom:6px">📰 ' + esc(news.text[0]) + " " + esc(news.text[1]) + "</div>";
  h += '<div class="ahBar"><span class="lbl">View</span>' + [["buy", "Buy"]].concat([["sell", "Sell"], ["lots", "My listings (" + save.market.listings.length + ")" + (save.market.box.length ? " · 📦" : "")]]).map(([k, l]) => '<button data-a="ahview" data-v="' + k + '"' + (view === k ? ' class="on" style="border-color:#c9a227;color:#f1cf73"' : "") + ">" + l + "</button>").join("") + "</div>";
  if (UI.ahMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.ahMsg) + "</div>";
  if (UI.pmBusy) h += '<div class="sub" style="color:#ffd54f;margin-bottom:6px">Talking to the game server…</div>';
  if (view === "lots" && typeof netAhList === "function" && NET.member) {
    const P = pmLoad(false);
    h += "<h3>🌐 With other players</h3>";
    if (P.err) h += '<div class="sub">' + esc(P.err) + "</div>";
    else if (!P.at) h += '<div class="sub">Loading…</div>';
    else {
      if ((P.box || []).length) h += '<div class="item"><div><b>📦 Player delivery box</b><div class="sub">' + P.box.map(b => b.kind === "sold" ? "💠 " + b.gil + " (sold " + (ITEMS[b.item] ? ITEMS[b.item].name : "?") + " to " + esc(b.note || "") + ")" : (ITEMS[b.item] ? ITEMS[b.item].name : "?") + (b.qty > 1 ? " ×" + b.qty : "") + (b.kind === "returned" ? " (returned)" : "")).join(", ") + '</div></div><span class="sub">Collect at your residence</span></div>';
      const pmine = (P.mine || []).filter(l => l.kind !== "merc");
      if (!pmine.length) h += '<div class="sub">You have nothing up for other players. Listings have no time limit and stay up until they sell or you withdraw them.</div>';
      for (const l of pmine) h += '<div class="ahLine"><span>' + (ITEMS[l.item] ? (ITEMS[l.item].icon || "") + " " + esc(ITEMS[l.item].name) : "?") + (l.qty > 1 ? " ×" + l.qty : "") + "</span><span>" + l.price + ' 💠</span><span class="un">' + pmLeft(l.expires_at) + '</span><span class="ctl"><button data-a="pmcancel" data-v="' + l.id + '"' + (UI.pmBusy ? " disabled" : "") + ">Withdraw</button></span></div>";
    }
    h += "<h3>🏛️ With the market</h3>";
  }
  if (view === "lots") {
    if (save.market.box.length) h += '<div class="item"><div><b>📦 Delivery box</b><div class="sub">' + save.market.box.map(b => b.gil ? "💠 " + b.gil + (b.note ? " (" + esc(b.note) + ")" : "") : ITEMS[b.id].name + (b.qty > 1 ? " ×" + b.qty : "")).join(", ") + '</div></div><span class="sub">Collect at your residence</span></div>';
    if (!save.market.listings.length) h += '<div class="sub">You have nothing up for auction. Listings have no time limit: they stay up until they sell or you withdraw them, and keep selling while you are away.</div>';
    save.market.listings.forEach((l, i) => {
      const up = Math.max(0, Math.floor((Date.now() - (l.t || Date.now())) / 60000));
      h += '<div class="ahLine"><span>' + (ITEMS[l.id].icon || "") + " " + esc(ITEMS[l.id].name) + (l.qty > 1 ? " ×" + l.qty : "") + "</span><span>" + l.price + ' 💠</span><span class="un">' + (up >= 1440 ? Math.floor(up / 1440) + "d " : "") + (up >= 60 ? Math.floor(up % 1440 / 60) + "h " : "") + (up % 60) + 'm listed</span><span class="ctl"><button data-a="ahcancel" data-v="' + i + '">Withdraw</button></span></div>';
    });
    const om = UI.pm && UI.pm.at && Array.isArray(UI.pm.mine) && typeof netAhList === "function" && NET.member ? UI.pm.mine.filter(l => l.kind === "merc" && ITEMS[l.item]).map(l => ({ id: l.item, qty: l.qty, price: l.price, seller: l.merc_name || "Companion", online: true })) : [];
    const ml = marketLocalLots().filter(l => l.kind === "merc").concat(om);
    h += '<h3 style="color:' + AH_KINDS.merc.color + '">⚔ Your companions\' lots (' + ml.length + " / " + AH_CFG.mercLotCap + ")</h3>";
    if (!ml.length) h += '<div class="sub">None. When you reach a town with a companion\'s bag at least half full, they list what they carry here. Towns buy these slowly, after any lots of yours; the crystals go to your delivery box.</div>';
    for (const l of ml) h += '<div class="ahLine" style="border-left:3px solid ' + AH_KINDS.merc.color + '"><span>' + (ITEMS[l.id].icon || "") + " " + esc(ITEMS[l.id].name) + (l.qty > 1 ? " ×" + l.qty : "") + "</span><span>" + l.price + ' 💠</span><span class="un">' + esc(l.seller) + '</span><span class="ctl">' + (l.online ? "🌐" : "") + "</span></div>";
    return h;
  }
  const online = view === "buy" && typeof pmLoad === "function" && typeof netAhList === "function" && NET.member ? pmLoad(false) : null;
  const olist = online && online.at ? online.list : [];
  if (view === "buy") h += '<div class="ahBar"><span class="lbl">Source</span>' + [["all", "All", "#c9a227"]].concat(Object.keys(AH_KINDS).map(k => [k, AH_KINDS[k].icon + " " + AH_KINDS[k].label, AH_KINDS[k].color])).map(([k, l, c]) => '<button data-a="ahsrc" data-v="' + k + '"' + ((UI.ahSrc || "all") === k ? ' style="border-color:' + c + ";color:" + c + '"' : "") + ">" + l + "</button>").join("") + (online ? '<button data-a="pmrefresh" style="padding:0 8px" title="Refresh player lots">🔄</button>' : "") + (online && online.err ? '<span class="sub" style="color:#ff8a80">' + esc(online.err) + "</span>" : "") + "</div>";
  if (view === "buy") h += '<div class="ahBar"><span class="lbl">Type</span>' + Object.keys(AH_CATS).map(k => '<button data-a="ahcat" data-v="' + k + '"' + (cat === k ? ' style="border-color:#c9a227;color:#f1cf73"' : "") + ">" + AH_CATS[k] + (news.up === k ? " ▲" : news.down === k ? " ▼" : "") + "</button>").join("") + "</div>";
  if (UI.ahSel && ITEMS[UI.ahSel]) h += ahDetail(UI.ahSel);
  const src = UI.ahSrc || "all", lineCache = {};
  const linesOf = id => lineCache[id] || (lineCache[id] = marketLines(id, olist).filter(l => src === "all" || l.kind === src));
  const ids = view === "buy" ? Object.keys(ITEMS).filter(id => ahTradable(id) && ahCategory(id) === cat && marketItems(olist).has(id) && linesOf(id).length).sort((a, b) => (ITEMS[a].lv || 0) - (ITEMS[b].lv || 0) || ITEMS[a].price - ITEMS[b].price) : [...new Set(save.inventory.map(s => s.id))].filter(ahTradable);
  if (!ids.length) h += '<div class="sub">' + (view === "sell" ? "Nothing in your bag can be sold at auction. Ex items, key items and furniture can't be listed." : "Nothing here right now.") + "</div>";
  let rows = "";
  for (const id of ids) {
    const it = ITEMS[id];
    const srcTxt = view === "sell" ? "you have " + invCount(id) : Object.keys(AH_KINDS).map(k => { const n = linesOf(id).filter(l => l.kind === k).reduce((x, l) => x + l.qty, 0); return n ? '<span style="color:' + AH_KINDS[k].color + '">' + AH_KINDS[k].icon + " " + n + "</span>" : ""; }).filter(Boolean).join(" ");
    rows += '<div class="ahRow ' + rarityOf(id) + (UI.ahSel === id ? " on" : "") + '" data-a="ahsel" data-v="' + id + '" data-hv="' + id + '"><span class="nm">' + (it.icon || "") + " <b>" + esc(it.name) + '</b></span><span class="lv">' + (it.lv || "–") + '</span><span class="sr src">' + srcTxt + '</span><span class="pr">' + (view === "sell" ? marketPrice(id) : Math.round(linesOf(id)[0].unit)) + " 💠 " + ahTrend(id) + "</span></div>";
  }
  if (rows) h += '<div class="ahBox"><div class="ahHead"><span>Item</span><span class="lv">Lv</span><span class="sr">' + (view === "sell" ? "Bag" : "For sale") + '</span><span class="pr" style="text-align:right">Price</span></div>' + rows + "</div>";
  return h;
}

const ADMIN_DIAG_SQL = [
  "select table_schema, table_name from information_schema.tables where table_schema in ('public', 'game_private') order by 1, 2;",
  "select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2;",
  "select p.proname, pg_get_function_identity_arguments(p.oid) as args from pg_proc p where p.pronamespace = 'public'::regnamespace order by 1;",
  "select (select count(*) from public.players) as players, (select count(*) from public.characters) as characters, (select count(*) from auth.users) as auth_users, (select count(*) from auth.users where email_confirmed_at is null) as unconfirmed;",
  "select c.name, c.summary ->> 'job' as job, c.summary ->> 'lv' as lv, p.email, c.updated_at, pg_column_size(c.data) as bytes from public.characters c left join public.players p on p.id = c.owner order by c.updated_at desc limit 50;",
  "select email, joined_at, last_seen, banned from public.players order by last_seen desc limit 50;",
  "select k, case when k = 'signup_code' then '(hidden)' else v end as v from game_private.config order by k;",
  "select at, char_name, kind, detail from game_private.audit order by at desc limit 50;",
  "select at, a, b, a_gave, b_gave from game_private.trade_log order by at desc limit 20;",
  "select me, peer, status, created_at from game_private.trade_offers order by created_at desc;"
].join("\n\n");

function copyText(t) {
  try { navigator.clipboard.writeText(t); return; } catch (e) {}
  const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove();
}

function adminReport() {
  return JSON.stringify({ game: "Leid'anav Reborn", build: typeof BUILD_INFO !== "undefined" ? BUILD_INFO : "", server: NET_CFG.url, admin: NET.user && NET.user.email, lastSave: NET.lastSave ? new Date(NET.lastSave).toISOString() : null, lastError: NET.lastErr || null, ping: NET.ping || null, online: (NET_RT.online || []).map(o => o && [o.name, o.job, o.lv, o.zone]), stats: UI.adminStats || null, error: UI.adminErr || null }, null, 1);
}

function adminLiveHtml() {
  const on = NET_RT.online || [];
  const host = typeof NET_SH !== "undefined" ? (NET_SH.on ? (NET_SH.host ? "you" : "another player") : "not shared") : "–";
  const kv = (k, v) => '<div class="item" style="display:block;text-align:center;min-width:110px"><div class="sub">' + k + '</div><b style="font-size:16px">' + esc(String(v)) + "</b></div>";
  let h = '<h3>This session</h3><div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">' + kv("Ping", NET.ping ? NET.ping + " ms" : "–") + kv("Last save", NET.lastSave ? fmtAgo(NET.lastSave) : "never") + kv("Unsaved changes", Object.keys(NET.dirty).length) + kv("Sent / received", (NET_RT.sent || 0) + " / " + (NET_RT.recv || 0)) + kv("Players online", on.length) + kv("Players in zone", S.others ? S.others.size : 0) + kv("Monster host", host) + kv("Zone", S.zone ? S.zone.name : "–") + kv("Game version", GAME_VERSION) + "</div>";
  if (NET.lastErr) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">Last save error: ' + esc(NET.lastErr) + "</div>";
  h += "<h3>Players online now (" + on.length + ")</h3>" + (on.length ? on.map(o => '<div class="sub">' + esc(o.name || "?") + " · " + esc(o.job || "") + (o.sub ? "/" + esc(o.sub) : "") + " Lv." + esc(o.lv || "") + " · " + esc(o.zone || "") + (o.lfg ? " · looking for party" : "") + (o.ls ? " · " + esc(o.ls) : "") + "</div>").join("") : '<div class="sub">Nobody online.</div>');
  return h;
}

function adminDur(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min";
}

function adminLoginsHtml() {
  if (typeof netAdminLogins !== "function") return "";
  if (!UI.adminLogins && !UI.adminLoginsErr && !UI.adminLoginsBusy) {
    UI.adminLoginsBusy = true;
    netAdminLogins(100).then(l => { UI.adminLogins = l; }, e => { UI.adminLoginsErr = netMissing(e) ? "The login log needs server setup version 9. Copy the setup SQL below and run it." : netErr(e); }).finally(() => { UI.adminLoginsBusy = false; if (S.modal === "admin") renderModal(); });
  }
  let h = "<h3>Logins</h3>";
  if (UI.adminLoginsErr) return h + '<div class="sub">' + esc(UI.adminLoginsErr) + "</div>";
  if (!UI.adminLogins) return h + '<div class="sub">Loading…</div>';
  if (!UI.adminLogins.length) return h + '<div class="sub">No logins recorded yet.</div>';
  const when = t => new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const now = Date.now();
  h += '<div class="sub" style="margin-bottom:4px">Newest first, last 30 days. A session starts when a player gets a place on the server and ends when they log out, are logged out for being idle, or stop answering for 2 minutes.</div>';
  for (const l of UI.adminLogins) {
    const st = Date.parse(l.started), end = l.ended ? Date.parse(l.ended) : now;
    h += '<div class="sub" style="padding:3px 0;border-bottom:1px solid rgba(255,255,255,.08)">' + (l.online ? "🟢 " : "⚪ ") + "<b>" + esc(l.email || "?") + "</b>" + (l.char_name ? " · " + esc(l.char_name) : "") + " · " + esc(when(st)) + " · " + adminDur(end - st) + (l.online ? " · <b style=\"color:#9ccc65\">still in</b>" : " · " + esc(l.reason || "ended")) + "</div>";
  }
  return h;
}

function tabAdmin() {
  if (typeof netIsAdmin !== "function" || !netIsAdmin()) return '<div class="sub">Admins only.</div>';
  if (!UI.adminStats && !UI.adminErr && !UI.adminLoading) { UI.adminLoading = true; netAdminStats().then(s => { UI.adminStats = s; UI.adminLoading = false; if (S.modal === "admin") renderModal(); }, e => { UI.adminErr = netErr(e); UI.adminLoading = false; if (S.modal === "admin") renderModal(); }); }
  const st = UI.adminStats;
  let h = '<div class="sub" style="margin-bottom:8px">Server: ' + esc(NET_CFG.url) + " · signed in as " + esc(NET.user.email) + " · " + esc(typeof BUILD_INFO !== "undefined" ? BUILD_INFO : "") + "</div>";
  if (UI.adminMsg) h += '<div class="sub" style="color:#ffd54f;margin-bottom:6px">' + esc(UI.adminMsg) + "</div>";
  h += adminLiveHtml();
  if (UI.adminErr) h += '<div class="item" style="display:block;border-color:#ff8a80"><b>Couldn\'t read server stats</b><div class="sub">' + esc(UI.adminErr) + '. If the database hasn\'t been set up yet, copy the setup SQL below and run it in the Supabase SQL editor.</div></div>';
  else if (!st) h += '<div class="sub">Loading server stats…</div>';
  else {
    const tile = (k, v) => '<div class="item" style="display:block;text-align:center;min-width:110px"><div class="sub">' + k + '</div><b style="font-size:20px">' + esc(String(v)) + "</b></div>";
    const sv = +(st.schema || 1);
    if (sv < NET_SCHEMA) h += '<div class="item" style="display:block;border-color:#ffd54f"><b>Server update needed</b><div class="sub">This version of the game needs server setup version ' + NET_SCHEMA + ' (the server has ' + sv + '). Press Copy setup SQL below, paste it into the Supabase SQL editor and press Run. It is safe to run again; nothing is deleted.</div></div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">' + tile("Trades (7 days)", st.trades_7d != null ? st.trades_7d : "–") + tile("Server setup", "v" + sv) + tile("Accounts", st.players) + tile("Online now", st.online) + tile("Characters", st.characters) + tile("New (7 days)", st.signups_7d) + tile("Banned", st.banned) + tile("Database", st.db_size) + tile("Saves", st.chars_size) + tile("Sign-up password", st.code_set ? "set" : "NOT SET") + "</div>";
    h += "<h3>Online now</h3>" + (st.online_list && st.online_list.length ? st.online_list.map(o => '<div class="sub">' + esc(o.email) + " · " + fmtAgo(Date.parse(o.last_seen)) + "</div>").join("") : '<div class="sub">Nobody else right now.</div>');
    h += adminLoginsHtml();
    h += "<h3>Suspicious saves</h3>" + (st.audit && st.audit.length ? st.audit.map(a => '<div class="sub">⚠ ' + esc(a.char_name || "?") + " (" + esc(a.email || "?") + ") · " + esc(a.kind) + ": " + esc(a.detail || "") + " · " + fmtAgo(Date.parse(a.at)) + "</div>").join("") : '<div class="sub">Nothing flagged.</div>');
    h += "<h3>Banned accounts</h3>" + (st.banned_list && st.banned_list.length ? st.banned_list.map(b => '<div class="sub">' + esc(b.email) + "</div>").join("") : '<div class="sub">None.</div>');
    h += "<h3>Recently saved characters</h3>" + (st.recent || []).map(c => '<div class="sub">' + esc(c.name) + " · " + esc(c.job || "") + " Lv." + esc(c.lv || "") + " · " + esc(c.zone || "") + " · " + esc(c.email || "") + " · " + fmtAgo(Date.parse(c.updated_at)) + "</div>").join("");
  }
  h += '<h3>Sign-up password</h3><div class="sub" style="margin-bottom:6px">New players need this to create an account. It\'s stored on the server, never in the game\'s code.</div><div class="opt"><input id="adCode" type="text" placeholder="New sign-up password" style="height:32px;padding:0 8px;border-radius:6px;border:1px solid var(--edge2);background:rgba(10,12,20,.8);color:#f2efe6"><button data-a="admincode">Change</button></div>';
  h += '<h3>Ban or unban</h3><div class="sub" style="margin-bottom:6px">Enter an email address or a character name. A banned account can\'t sign in to play or save. Your own account can\'t be banned.</div><div class="opt"><input id="adBan" type="text" placeholder="Email or character name" style="height:32px;padding:0 8px;border-radius:6px;border:1px solid var(--edge2);background:rgba(10,12,20,.8);color:#f2efe6"><button data-a="adminban" data-v="1" class="danger">Ban</button><button data-a="adminban" data-v="0">Unban</button></div>';
  h += '<h3>For Claude</h3><div class="sub" style="margin-bottom:6px">Copy these and paste them to Claude (or into the Supabase SQL editor) when something needs fixing.</div><div class="opt"><button data-a="admincopy" data-v="setup">📋 Copy setup SQL</button><button data-a="admincopy" data-v="diag">📋 Copy diagnostics SQL</button><button data-a="admincopy" data-v="report">📋 Copy server report</button><button data-a="adminrefresh">🔄 Refresh</button></div>';
  return h;
}

function tabGuild() {
  const g = save.guild, rk = guildRank(), R0 = GUILD_RANKS[rk], nx = GUILD_RANKS[rk + 1];
  let h = '<div class="item"><div><b style="color:' + R0[2] + '">' + R0[0] + ' rank</b><div class="sub">' + g.total + " guild points earned" + (nx ? " · " + (nx[1] - g.total) + " more for " + nx[0] : " · highest rank") + '</div></div><span class="sub">🎖️ ' + g.gp + " to spend</span></div>";
  if (nx) h += '<div style="height:6px;background:#0004;border-radius:3px;margin:4px 0 10px"><div style="height:6px;border-radius:3px;background:' + nx[2] + ";width:" + Math.round((g.total - R0[1]) / (nx[1] - R0[1]) * 100) + '%"></div></div>';
  if (UI.guildMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.guildMsg) + "</div>";
  const row = (b, btn, extra) => {
    const r = bountyReward(b);
    return '<div class="item"><div><b>' + (b.nm ? "★ " : "") + esc(bountyName(b)) + '</b><div class="sub">' + esc(b.where) + " · suggested level " + b.lv + "+" + (extra || "") + " · " + r.gp + " 🎖️ · " + r.gil + " 💠</div></div>" + btn + "</div>";
  };
  const act = Object.keys(g.active);
  h += "<h3>Your bounties (" + act.length + "/" + GUILD_ACTIVE + ")</h3>";
  if (!act.length) h += '<div class="sub">None. Take one from today\'s list.</div>';
  for (const id of act) {
    const b = GUILD_BOUNTIES.find(x => x.id === id);
    if (!b) continue;
    const n = g.active[id], done = n >= b.n;
    h += row(b, done ? '<button data-a="bturn" data-v="' + id + '">Turn in</button>' : '<button data-a="bdrop" data-v="' + id + '">Abandon</button>', " · " + Math.min(n, b.n) + "/" + b.n);
  }
  h += "<h3>Today's bounties</h3>";
  for (const b of guildToday()) {
    const fin = g.done.includes(b.id), have = g.active[b.id] != null;
    h += row(b, fin ? '<span class="sub">Done ✓</span>' : have ? '<span class="sub">Taken</span>' : '<button data-a="btake" data-v="' + b.id + '">Accept</button>');
  }
  h += '<div class="sub" style="margin:4px 0 8px">New bounties go up at midnight (UTC), or when you have waited a full day in town. Each rank you earn adds one more, harder bounty to the board.</div>';
  h += "<h3>Daily supplies</h3><div class=\"sub\" style=\"margin-bottom:4px\">One of each per day. Prices climb steeply with each rank; stock changes at midnight (UTC) or after you wait a full day.</div>";
  guildDay();
  for (const p of GUILD_PERKS) {
    const id = guildPerkItem(p), it = id && ITEMS[id], lock = rk < p.rank, got = g.bought.includes(p.id);
    if (!it) continue;
    h += '<div class="item ' + rarityOf(id) + '"' + (lock ? ' style="opacity:.5"' : "") + "><div><b>" + (it.icon || "") + " " + esc(lock && p.pick ? "???" : it.name) + '</b><div class="sub">' + esc(p.label) + (lock ? "" : " · " + esc(itemDesc(id))) + "</div></div>" + (lock ? '<span class="sub">🔒 ' + GUILD_RANKS[p.rank][0] + "</span>" : got ? '<span class="sub">Bought today ✓</span>' : '<button data-a="gbuy" data-v="' + p.id + '"' + (g.gp < p.gp ? " disabled" : "") + ">" + p.gp + " 🎖️</button>") + "</div>";
  }
  if (GUILD_SHOP.length) h += "<h3>Guild rewards</h3>";
  for (const e of GUILD_SHOP) {
    const it = ITEMS[e.id], lock = rk < e.rank;
    h += '<div class="item ' + rarityOf(e.id) + '"' + (lock ? ' style="opacity:.5"' : "") + '><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + esc(itemDesc(e.id)) + "</div></div>" + (lock ? '<span class="sub">🔒 ' + GUILD_RANKS[e.rank][0] + "</span>" : '<button data-a="gbuy" data-v="' + e.id + '"' + (g.gp < e.gp ? " disabled" : "") + ">" + e.gp + " 🎖️</button>") + "</div>";
  }
  return h;
}

function tabAchievements() {
  const tabs = '<div class="opt" style="margin-bottom:8px"><button data-a="achview" data-v="list"' + (UI.achView !== "stats" ? ' class="pri"' : "") + '>🏆 Achievements</button><button data-a="achview" data-v="stats"' + (UI.achView === "stats" ? ' class="pri"' : "") + ">📊 Stats</button></div>";
  if (UI.achView === "stats") return tabs + tabStats();
  const got = ACHIEVEMENTS.filter(a => save.ach[a.id]).length;
  let h = tabs + '<div class="sub" style="margin-bottom:8px">' + got + " / " + ACHIEVEMENTS.length + " unlocked.</div>";
  for (const a of ACHIEVEMENTS) {
    const t = save.ach[a.id];
    h += '<div class="item" style="' + (t ? "" : "opacity:.55") + '"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:22px">' + (t ? a.icon : "🔒") + "</span><div><b>" + esc(a.name) + '</b><div class="sub">' + esc(a.desc) + "</div></div></div>" + '<span class="sub">' + (t ? new Date(t).toLocaleDateString() : "") + "</span></div>";
  }
  return h;
}

function downloadSave() {
  const text = exportSaveText();
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  const d = new Date();
  a.href = URL.createObjectURL(blob);
  a.download = "untitled-solo-rpg-save-" + d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + ".json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  log("Save file downloaded.", "sys");
  toast("💾", "Saved", "Save file downloaded.");
}
function onLoadFile(ev) {
  const f = ev.target.files && ev.target.files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const d = importSaveText(String(r.result));
    if (!d) { log("That file isn't a Leid'anav Reborn save.", "sys"); sfx("error"); return; }
    gameConfirm("Load this save?", "Your current progress for this character will be replaced by the file.", () => {
      closeModal();
      applyLoadedSave(d);
      UI.watch = null; UI.slotKey = ""; UI.actKeys = null; UI.partyKey = "";
      toast("📂", "Loaded", "Save file restored.");
    }, { yes: "Load" });
  };
  r.readAsText(f);
}

function onMenuClick(e) {
  if (e.target === $("menu")) { closeModal(); return; }
  const t = e.target.closest("[data-tab],[data-a]");
  if (!t) return;
  if (t.dataset.tab) {
    if (t.dataset.tab === "close") closeModal();
    else { S.modal = t.dataset.tab; UI.sel = null; UI.pick = null; UI.slotFilter = null; renderModal(); sfx("tab"); }
    return;
  }
  e.preventDefault();
  const a = t.dataset.a, v = t.dataset.v;
  if (a === "mute") { toggleMute(); renderModal(); return; }
  if (a === "toggle" && (v === "tracker" || v === "names" || v === "plates" || v === "compass" || v === "dmgNums" || v === "hotbar")) { VIEW.settings[v] = VIEW.settings[v] === false; saveSettings(VIEW.settings); applyUiSettings(); renderModal(); sfx("click"); return; }
  if (typeof handleSettingAction === "function" && handleSettingAction(a, v)) { renderModal(); sfx("click"); return; }
  const hb = hotbar();
  if (a === "filter") { UI.filter = v; UI.sel = null; sfx("tab"); }
  else if (a === "sel") { UI.sel = UI.sel === +v ? null : +v; sfx("select"); }
  else if (a === "isel") { UI.sel = +v; UI.hov = null; sfx("select"); renderModal(); invActions(+v); return; }
  else if (a === "qcat") { UI.qCat = v; UI.qSel = null; sfx("select"); }
  else if (a === "qback") { UI.qCat = null; UI.qSel = null; sfx("close"); }
  else if (a === "qsel") { UI.qSel = v; sfx("select"); }
  else if (a === "noop") { return; }
  else if (a === "shopmode") { UI.shopMode = v; UI.hov = null; sfx("tab"); }
  else if (a === "shopbuy") { const it = ITEMS[v]; UI.hov = v; renderMCard(); const o = [1, 3, 12].filter(n => n === 1 || it.stack !== false && it.kind !== "equip").map(n => ({ label: "Buy " + n + " (" + (buyPrice(v) * n).toLocaleString() + " crystals)", fn: () => { closeDialog(); for (let k = 0; k < n; k++) { if (save.gil < buyPrice(v)) break; buy(v); } renderModal(); } })); promptChoice(it.name, o); return; }
  else if (a === "shopsell") { const it = ITEMS[v], n = invCount(v), p = sellPrice(v); UI.hov = v; renderMCard(); const o = [{ label: "Sell 1 (" + p + " crystals)", fn: () => { closeDialog(); sell(v); renderModal(); } }]; if (n > 1) o.push({ label: "Sell all " + n + " (" + (p * n).toLocaleString() + " crystals)", fn: () => { closeDialog(); for (let k = 0; k < n; k++) sell(v); renderModal(); } }); promptChoice(it.name, o); return; }
  else if (a === "mcast") { closeModal(); playerAct({ kind: "ma", id: v, name: SPELLS[v].name }); return; }
  else if (a === "mact") { const [kd, id] = v.split(":"); closeModal(); playerAct({ kind: kd, id, name: kd === "ws" ? WEAPON_SKILLS[id].name : ABILITIES[id].name }); return; }
  else if (a === "eqslot") { UI.eq = UI.eq || {}; UI.eq.slot = UI.eq.slot === v ? null : v; UI.eq.hover = null; UI.eq.list = false; sfx("select"); renderModal(); return; }
  else if (a === "eqpick") { const q = UI.eq; if (q.hover === v) { const why = canEquip(v); if (why) { log(why + ".", "sys"); sfx("error"); } else { equip(v, q.slot); q.hover = null; } } else { q.hover = v; sfx("tab"); } renderModal(); return; }
  else if (a === "equnq") { unequip(v); UI.eq.hover = null; renderModal(); return; }
  else if (a === "slotinv") { const id = save.gear[v]; UI.slotFilter = v; S.modal = "inventory"; UI.filter = "all"; UI.sel = null; if (id) UI.cmp = null; sfx("tab"); }
  else if (a === "clearslot") { UI.slotFilter = null; }
  else if (a === "use") { useItem(v); }
  else if (a === "equip") { equip(v); UI.sel = null; UI.cmp = null; }
  else if (a === "compare") { UI.cmp = v; S.modal = "character"; sfx("tab"); }
  else if (a === "unequip") unequip(v);
  else if (a === "drop") {
    const s = save.inventory[+v];
    if (!s) return;
    const it = ITEMS[s.id];
    gameConfirm("Drop " + (s.qty > 1 ? s.qty + " × " : "") + it.name + "?", it.rare || it.ex ? "You may not be able to get it again." : "It will be gone for good.", () => {
      const i = save.inventory.indexOf(s);
      if (i >= 0) save.inventory.splice(i, 1);
      log("You drop " + (s.qty > 1 ? s.qty + " " + it.name + "s" : an(it.name)) + ".", "sys");
      UI.sel = null; saveGame(); renderModal();
    }, { yes: "Drop", danger: true });
    return;
  }
  else if (a === "tobar") { placeOnBar({ kind: "item", id: v }); }
  else if (a === "actpick") { UI.selAct = UI.selAct === v ? null : v; UI.pick = null; sfx("select"); }
  else if (a === "slotpick") {
    const [p, i] = v.split(",").map(Number);
    if (UI.selAct) {
      const [kind, id] = UI.selAct.split(":");
      for (const pg of hb.pages) for (let k = 0; k < 10; k++) if (pg[k] && pg[k].kind === kind && pg[k].id === id) pg[k] = null;
      hb.pages[p][i] = { kind, id };
      UI.selAct = null; sfx("equip");
    } else if (UI.pick) {
      const [p0, i0] = UI.pick;
      const tmp = hb.pages[p0][i0]; hb.pages[p0][i0] = hb.pages[p][i]; hb.pages[p][i] = tmp;
      UI.pick = null; sfx("equip");
    } else { UI.pick = [p, i]; sfx("select"); }
    saveGame(); buildActionBar();
  }
  else if (a === "slothud") { if (UI.pick) { const sl = hb.pages[UI.pick[0]][UI.pick[1]]; if (sl) { if (sl.hud === false) delete sl.hud; else sl.hud = false; saveGame(); buildActionBar(); sfx("click"); } } }
  else if (a === "fullscreen") { toggleFullscreen(); }
  else if (a === "perfshow") { UI.perfShow = !UI.perfShow; sfx("click"); }
  else if (a === "slotclear") { if (UI.pick) { hb.pages[UI.pick[0]][UI.pick[1]] = null; UI.pick = null; saveGame(); buildActionBar(); sfx("close"); } }
  else if (a === "barreset") { delete save.hotbars[save.mainJob]; UI.slotKey = ""; UI.pick = null; syncHotbar(); saveGame(); sfx("click"); }
  else if (a === "buy") buy(v);
  else if (a === "sell") sell(v);
  else if (a === "main") setJob(v, save.subJob);
  else if (a === "sub") setJob(save.mainJob, v === "none" ? null : v);
  else if (a === "hire") hireMerc(v);
  else if (a === "dismiss") dismissMerc(v);
  else if (a === "stance") setStance(v);
  else if (a === "augment") { UI.forgeMsg = augmentItem(v, false); renderModal(); return; }
  else if (a === "reforge") { UI.forgeMsg = augmentItem(v, true); renderModal(); return; }
  else if (a === "coat") { UI.stableMsg = buyCoat(v); renderModal(); return; }
  else if (a === "saddle") { UI.stableMsg = buySaddle(); renderModal(); return; }
  else if (a === "pinv") { const nm = prompt("Invite which player?", ""); if (nm) netPartyInvite(nm); renderModal(); return; }
  else if (a === "pjoin") { netPartyJoin(); renderModal(); return; }
  else if (a === "pdecl") { netPartyDecline(); renderModal(); return; }
  else if (a === "pleave") { gameConfirm("Leave party", "Leave your party?", () => { netPartyLeave(); renderModal(); }, { yes: "Leave", danger: true }); return; }
  else if (a === "pkick") { netPartyKick(v); renderModal(); return; }
  else if (a === "tadd" || a === "taddall") { const t = NET_PT.trade; if (t) t.msg = netTradeAdd(v, a === "taddall" ? invCount(v) - netTradeOffered(v) : 1); sfx("select"); renderModal(); return; }
  else if (a === "trem") { netTradeRemove(v); sfx("close"); renderModal(); return; }
  else if (a === "tgil") { const t = NET_PT.trade; if (!t) return; const g = prompt("How many crystals will you offer? (You have " + save.gil + ")", String(t.mine.gil)); if (g !== null) t.msg = netTradeGil(g); renderModal(); return; }
  else if (a === "tacc") { netTradeAccept(); renderModal(); return; }
  else if (a === "tcan") { netTradeCancel(); return; }
  else if (a === "petsel") { UI.petMsg = equipBuddy(v); renderModal(); return; }
  else if (a === "petbag") { UI.petMsg = petToBag(v); renderModal(); return; }
  else if (a === "petsummon") { UI.petMsg = toggleBuddy(); renderModal(); return; }
  else if (a === "petbuy") { const e = BUDDY_SHOP.find(x => x[0] === v); if (!e) return; if (save.gil < e[1]) { UI.petMsg = "You need " + e[1] + " crystals."; sfx("error"); } else { save.gil -= e[1]; learnBuddy(v); UI.petMsg = ""; } renderModal(); return; }
  else if (a === "petname") { const cur = save.buddyNames[v] || ""; const nm = prompt("Name your " + BUDDIES[v].name + " (2–12 letters, blank to reset):", cur); if (nm !== null) { UI.petMsg = nameBuddy(v, nm); renderModal(); } return; }
  else if (a === "ahview") { UI.ahView = v; UI.ahSel = null; UI.ahMsg = ""; renderModal(); return; }
  else if (a === "ahcat") { UI.ahCat = v; UI.ahSel = null; renderModal(); return; }
  else if (a === "ahsel") { UI.ahSel = v; UI.ahMsg = ""; const it = ITEMS[v]; UI.ahQty = UI.ahView === "sell" ? Math.min(invCount(v), it.stack || 1) : 1; UI.ahPrice = marketPrice(v) * UI.ahQty; renderModal(); return; }
  else if (a === "ahqty") { const it = ITEMS[UI.ahSel]; const max = UI.ahView === "sell" ? Math.min(invCount(UI.ahSel), it.stack || 1) : Math.min(ahStock(UI.ahSel), it.stack || 1); UI.ahQty = clamp((UI.ahQty || 1) + (+v), 1, Math.max(1, max)); UI.ahPrice = marketPrice(UI.ahSel) * UI.ahQty; renderModal(); return; }
  else if (a === "ahess") { UI.ahEss = v; renderModal(); return; }
  else if (a === "ahprice") { UI.ahPrice = Math.max(1, Math.round(UI.ahPrice * (1 + (+v)))); renderModal(); return; }
  else if (a === "ahbuy") { UI.ahMsg = ahBuy(UI.ahSel, UI.ahQty || 1, v || undefined); UI.ahQty = 1; renderModal(); return; }
  else if (a === "ahlist") { UI.ahMsg = ahList(UI.ahSel, UI.ahQty || 1, UI.ahPrice, ahEssPick()); if (!UI.ahMsg) UI.ahSel = null; renderModal(); return; }
  else if (a === "ahcancel") { ahCancel(+v); renderModal(); return; }
  else if (a === "dropsel") { if (UI.sel != null) onMenuClick({ target: { closest: () => ({ dataset: { a: "drop", v: String(UI.sel) } }) }, preventDefault() {} }); return; }
  else if (a === "invview") { UI.invView = v; UI.sel = null; renderModal(); return; }
  else if (a === "slimclose") { const back = UI.menuFromMain; closeModal(); if (back) mainCmdOpen(); return; }
  else if (a === "helpcat") { UI.helpCat = v; renderModal(); return; }
  else if (a === "dbcat") { UI.dbCat = v; renderModal(); return; }
  else if (a === "achview") { UI.achView = v; renderModal(); return; }
  else if (a === "socseek") { netSeek(!save.lfg, null); renderModal(); return; }
  else if (a === "socseekmsg") { const m = prompt("Looking-for-party message (up to 40 characters):", save.seekMsg || ""); if (m !== null) netSeek(true, m); renderModal(); return; }
  else if (a === "socq") { const m = prompt("Filter: job (WHM), level (12) or range (10-15), area, name, lfg, here", UI.socQ || ""); if (m !== null) UI.socQ = m; renderModal(); return; }
  else if (a === "socqclear") { UI.socQ = ""; renderModal(); return; }
  else if (a === "socqlfg") { UI.socQ = "lfg"; renderModal(); return; }
  else if (a === "socqhere") { UI.socQ = "here"; renderModal(); return; }
  else if (a === "soctell") { closeModal(); const inp = $("chatIn"); if (inp) { inp.value = "/t " + v + " "; inp.focus(); } return; }
  else if (a === "socinv") { netPartyInvite(v); renderModal(); return; }
  else if (a === "socfadd") { netFriend("add", v); renderModal(); return; }
  else if (a === "socfdel") { netFriend("remove", v); renderModal(); return; }
  else if (a === "socbdel") { netBlock("remove", v); renderModal(); return; }
  else if (a === "lsjoin") { socAct(netLsJoin()); return; }
  else if (a === "lsact") { save.lsActive = v; saveGame(); netTrack(); UI.socMsg = "Active linkshell changed. /l talks there."; renderModal(); return; }
  else if (a === "lsinv") { const nm = prompt("Invite which character to the linkshell?", ""); if (nm) socAct(netLsInvite(v, nm), "Invitation sent."); return; }
  else if (a === "lsleave") { gameConfirm("Leave linkshell", "Leave this linkshell? You'll need a new invitation to come back.", () => socAct(netLsLeave(v)), { yes: "Leave", danger: true }); return; }
  else if (a === "lsrank") { const [id, nm, act] = v.split("|"); socAct(netLsSetRank(id, nm, act)); return; }
  else if (a === "lsnew") { const nm = prompt("Name your linkshell (3–16 letters):", ""); if (!nm) return; const cols = ["#7fd3ff", "#a5d6a7", "#ffd54f", "#ff8a65", "#ce93d8", "#f48fb1"]; socAct(netLsCreate(nm, cols[Math.floor(Math.random() * cols.length)]), "Linkshell created. Invite people from here."); return; }
  else if (a === "pmrefresh") { pmLoad(true); renderModal(); return; }
  else if (a === "ahsrc") { UI.ahSrc = v; UI.ahSel = null; renderModal(); return; }
  else if (a === "ahbuylocal") { UI.ahMsg = ahBuyLocal(+v); renderModal(); return; }
  else if (a === "pmbuy") { const pl = UI.pm && UI.pm.list ? UI.pm.list.find(x => x.id === +v) : null; if (pl && ITEMS[pl.item] && ITEMS[pl.item].rare && hasItem(pl.item)) { UI.ahMsg = "You already possess " + an(ITEMS[pl.item].name) + "."; renderModal(); return; } pmAct(netAhBuy(+v)); return; }
  else if (a === "pmcancel") { pmAct(netAhCancel(+v)); return; }
  else if (a === "pmcollect") { pmAct(netAhCollect()); return; }
  else if (a === "pmpost") { const id = UI.ahSel, q = UI.ahQty || 1, pr = UI.ahPrice; pmAct(netAhPost(id, q, pr).then(() => { UI.ahSel = null; }), "Your lot is up for other players."); return; }
  else if (a === "ahcollect") { UI.ahMsg = ahCollect(); renderModal(); return; }
  else if (a === "btake") { UI.guildMsg = takeBounty(v); renderModal(); return; }
  else if (a === "bdrop") { dropBounty(v); UI.guildMsg = ""; renderModal(); return; }
  else if (a === "bturn") { UI.guildMsg = turnInBounty(v); renderModal(); return; }
  else if (a === "gbuy") { UI.guildMsg = guildBuy(v); renderModal(); return; }
  else if (a === "trade") { UI.boardMsg = fillTrade(v); renderModal(); return; }
  else if (a === "msheet") { UI.mercSheet = v || null; renderModal(); }
  else if (a === "mpay") { mercPay(v, true); }
  else if (a === "rehire") { rehireFriend(v); }
  else if (a === "mbuy") { const [id, i] = v.split(":"); buyFromMerc(id, +i); }
  else if (a === "mgive") { const [id, it] = v.split(":"); giveMercGear(id, it); }
  else if (a === "mtake") { const [id, sl] = v.split(":"); takeMercGear(id, sl); }
  else if (a === "open") { openMenu(v); return; }
  else if (a === "craftbook") { UI.craftBook = !UI.craftBook; renderModal(); return; }
  else if (a === "csadd") {
    const cs = UI.cs; UI.craftMsg = ""; cs.hover = v;
    if (craftCrystals().includes(v) && !cs.crystal) { cs.crystal = v; sfx("select"); }
    else { const used = cs.mats.filter(x => x === v).length + (cs.crystal === v ? 1 : 0); if (cs.mats.length < 8 && used < invCount(v) && !craftCrystals().includes(v)) { cs.mats.push(v); sfx("select"); } else sfx("error"); }
    renderModal(); return;
  }
  else if (a === "csrem") { const cs = UI.cs, i = +v; if (cs.mats[i]) { cs.hover = cs.mats[i]; cs.mats.splice(i, 1); sfx("close"); } renderModal(); return; }
  else if (a === "csclr") { const cs = UI.cs; if (cs.crystal) { cs.hover = cs.crystal; cs.crystal = null; sfx("close"); } renderModal(); return; }
  else if (a === "cscancel") { UI.cs = { crystal: null, mats: [], hover: null }; UI.craftMsg = ""; sfx("close"); renderModal(); return; }
  else if (a === "csfill") {
    const r = RECIPES.find(x => x.id === v); if (!r) return;
    const cs = UI.cs; cs.hover = r.out;
    if (!recipeMatsOk(r)) { UI.craftMsg = "You're missing ingredients for " + ITEMS[r.out].name + "."; renderModal(); return; }
    cs.crystal = CRAFTS[r.craft].crystal; cs.mats = [];
    for (const id in r.mats) for (let k = 0; k < r.mats[id]; k++) cs.mats.push(id);
    sfx("select"); renderModal(); return;
  }
  else if (a === "csok") {
    const hit = csMatches().find(x => x.exact);
    if (!hit) { UI.craftMsg = UI.cs.crystal ? "That combination doesn't make anything you know." : "Choose a crystal first."; sfx("error"); renderModal(); return; }
    const why = startSynth(hit.r.id);
    if (why) { UI.craftMsg = why; sfx("error"); renderModal(); return; }
    UI.cs = { crystal: null, mats: [], hover: null }; UI.craftMsg = ""; closeModal(); return;
  }
  else if (a === "craftsel") { UI.craft = v; UI.craftMsg = ""; sfx("tab"); renderModal(); return; }
  else if (a === "synth") { UI.craftMsg = startSynth(v); closeModal(); return; }
  else if (a === "plant") { const [i, id] = v.split(":"); UI.homeMsg = plantSeed(+i, id); if (UI.homeMsg) sfx("error"); renderModal(); return; }
  else if (a === "water") { UI.homeMsg = waterGarden(+v); if (UI.homeMsg) sfx("error"); renderModal(); return; }
  else if (a === "feed") { const [i, id] = v.split(":"); UI.homeMsg = feedGarden(+i, id); if (UI.homeMsg) sfx("error"); renderModal(); return; }
  else if (a === "harvest") { UI.homeMsg = harvestGarden(+v); if (UI.homeMsg) sfx("error"); renderModal(); return; }
  else if ((a === "store" || a === "retrieve") && !(S.zoneId === "residence")) { log("You can only move items in or out of storage at your residence.", "sys"); sfx("error"); return; }
  else if (a === "store") { storeItem(+v); renderModal(); return; }
  else if (a === "retrieve") { retrieveItem(+v); renderModal(); return; }
  else if (a === "pickf") { UI.pick = UI.pick === v ? null : v; UI.furnSel = null; UI.homeMsg = ""; sfx("tab"); renderModal(); return; }
  else if (a === "pickrot") { UI.pickRot = ((UI.pickRot || 0) + 1) % 4; sfx("click"); renderModal(); return; }
  else if (a === "cell") {
    if (!UI.pick) { UI.homeMsg = "Pick a piece of furniture first."; renderModal(); return; }
    const [c, r] = v.split(",").map(Number);
    const why = placeFurniture(UI.pick, c, r, UI.pickRot || 0);
    UI.homeMsg = why;
    if (why) sfx("error"); else if (invCount(UI.pick) < 1) UI.pick = null;
    renderModal(); return;
  }
  else if (a === "furn") { UI.furnSel = +v; UI.pick = null; UI.homeMsg = ""; sfx("select"); renderModal(); return; }
  else if (a === "rotf") { UI.homeMsg = rotateFurniture(+v); if (UI.homeMsg) sfx("error"); else sfx("click"); renderModal(); return; }
  else if (a === "packf") { UI.homeMsg = removeFurniture(+v); if (UI.homeMsg) sfx("error"); else UI.furnSel = null; renderModal(); return; }
  else if (a === "savefile") { downloadSave(); return; }
  else if (a === "tutorial") { tutStart(); return; }
  else if (a === "checkupd") { checkForUpdate(true); return; }
  else if (a === "loadfile") { return; }
  else if (a === "syncnow") { saveGame(); netFlush().then(() => renderModal()); return; }
  else if (a === "idlemin") { VIEW.settings.idleMin = Math.max(5, Math.min(60, +v || 30)); saveSettings(VIEW.settings); UI.lastInput = Date.now(); renderModal(); return; }
  else if (a === "signout") { closeModal(); saveGame(); netFlush().then(() => netSignOut()).then(() => location.reload()); return; }
  else if (a === "adminrefresh") { UI.adminStats = null; UI.adminErr = ""; UI.adminLogins = null; UI.adminLoginsErr = ""; renderModal(); return; }
  else if (a === "admincopy") { copyText(v === "setup" ? SETUP_SQL : v === "diag" ? ADMIN_DIAG_SQL : adminReport()); UI.adminMsg = "Copied to the clipboard."; renderModal(); return; }
  else if (a === "rename") { const nm = (($("renIn") || {}).value || "").trim(); if (!nm || UI.renBusy) return; UI.renBusy = true; renameChar(nm).then(err => { UI.renBusy = false; UI.renOk = !err; UI.renMsg = err || "Done. You are now " + save.name + "."; if (err) sfx("error"); renderModal(); }); renderModal(); return; }
  else if (a === "adminban") { const tg = (($("adBan") || {}).value || "").trim(); if (!tg) return; netAdminBan(tg, v === "1").then(n => { UI.adminMsg = n ? (v === "1" ? "Banned " : "Unbanned ") + tg + "." : "No account matched " + tg + "."; UI.adminStats = null; renderModal(); }, e => { UI.adminMsg = netErr(e); renderModal(); }); return; }
  else if (a === "admincode") { const c = ($("adCode") || {}).value || ""; netAdminSetCode(c).then(() => { UI.adminMsg = "Sign-up password changed."; renderModal(); }, e => { UI.adminMsg = netErr(e); renderModal(); }); return; }
  else if (a === "logout") { closeModal(); logoutToSelect(); return; }
  renderModal();
}
function placeOnBar(a) {
  const hb = hotbar();
  if (hb.pages.flat().some(x => x && x.kind === a.kind && x.id === a.id)) { toast(actIcon(a), "Already on your bar", actName(a)); return; }
  for (let p = 0; p < hb.pages.length; p++) for (let i = 0; i < 10; i++) if (!hb.pages[p][i]) { hb.pages[p][i] = a; saveGame(); buildActionBar(); toast(actIcon(a), "Added to page " + (p + 1), actName(a)); sfx("equip"); return; }
  toast("⚠", "Action bar full", "Clear a slot in the Action Bar menu.");
  sfx("error");
}
function applyUiSettings() {
  const s = VIEW.settings;
  document.body.classList.toggle("noNames", s.names === false);
  document.body.classList.toggle("noHotbar", s.hotbar === false);
}
function initMenu() {
  const m = $("menu");
  m.addEventListener("click", onMenuClick);
  m.addEventListener("input", e => {
    const k = e.target.dataset && e.target.dataset.vol;
    if (!k) return;
    setVolume(k, e.target.value / 100);
    const b = e.target.parentNode.querySelector("b");
    if (b) b.textContent = e.target.value;
  });
  m.addEventListener("change", e => { if (e.target.dataset && e.target.dataset.vol) sfx("click"); });
  applyUiSettings();
}

const BUILD_INFO = "__VERSION__";
const UPDATES = [
  { v: "19.18.0", date: "2026-10-21", title: "Welcome tour", items: [
    "<b>Popup tutorial.</b> On first login a short tour explains controls, menus and buttons, quests, guild bounties, battles, finding the map, crystals and warp stones, what happens when you fall, the auction house, companions, crafting and scrolls.",
    "<b>Skip and replay.</b> Skip it at any time with the Skip button or Esc. Replay it from Config, More, Tutorial. Characters you already had see it once on their next login."
  ] },
  { v: "19.17.0", date: "2026-10-21", title: "Stand your ground", items: [
    "<b>Stop works while waiting.</b> The Stop button in the Time box now responds the moment you press it; the box no longer redraws under your finger.",
    "<b>Ranged companions stand and fight.</b> A caster or archer companion who keeps backing away but is still chased now turns, stands and fights for 30 seconds before trying to run again. A companion who is running because they are badly hurt keeps running."
  ] },
  { v: "19.16.0", date: "2026-10-20", title: "Off the beaten path", items: [
    "<b>Field sites.</b> Landmarks in the wilds now have something to find just off the road: stone circles in clearings, overlooks on small rises with a bench and cairn, and the broken walls of small ruins.",
    "<b>Points of interest everywhere.</b> Sunscar Desert, Verdant Jungle and Cinder Peak each gain a Lookout Tower, Wayside Shrine, Weathered Tablet and Hidden Cache; Gull Isle gains a shrine, tablet and cache; the Windreach Highlands a shrine, lookout, tablet and cache across their three zones. New tablets tell each area's story.",
    "<b>Within sight of the road.</b> Lookouts, shrines and tablets now stand a short walk from a path, so you can spot them while travelling."
  ] },
  { v: "19.15.0", date: "2026-10-20", title: "Quick draw", items: [
    "<b>Drawing and sheathing are quick.</b> Your hand goes to the hip (or over the shoulder for back-carried weapons), closes on the weapon, and it comes away with the hand. A draw takes about a third of a second and a sheathe about half a second, and a swing cuts either short.",
    "<b>No more floating weapon.</b> The weapon is always held by your hand or sits on your hip or back, never drifting through the air between them."
  ] },
  { v: "19.14.0", date: "2026-10-20", title: "Weapons at the hip", items: [
    "<b>Hip carry.</b> Swords, katanas, daggers, axes and clubs now hang at your left hip, blade angled back, instead of on your back. Drawing one is a reach across to the hip; staves, polearms, great weapons and bows stay on your back.",
    "<b>Waiting a day fixed.</b> A full day waited in the Time menu now always counts, so the guild board and daily supplies refresh (a wait that ended a hair under 24 hours used to be lost)."
  ] },
  { v: "19.13.3", date: "2026-10-20", title: "Guild tidy-up", items: [
    "<b>Gear list removed.</b> The fixed Guild rewards gear list (rings, boots, sigil, harness) no longer appears under the daily supplies. The daily random finds (crystal, common, uncommon, rare) are back as before."
  ] },
  { v: "19.13.2", date: "2026-10-20", title: "Fresh bounties", items: [
    "<b>New bounties after waiting.</b> Waiting a full day in town (the Time menu) now brings a fresh guild board and daily supplies, as well as midnight UTC.",
    "<b>Harder bounties with rank.</b> Each guild rank you earn adds one more, harder bounty to the daily board on top of the usual three.",
    "<b>Distant tree removed.</b> The giant gray tree seen floating on the horizon outside Ashenreach is gone.",
    "<b>Companion sales fizzle.</b> Crystals from lots your companions sell are no longer sent to your delivery box.",
    "<b>Phone layout.</b> The hotkey bar has its pager on top and bigger slots so icons stay inside them, and a long target name is cut off inside its box."
  ] },
  { v: "19.13.1", date: "2026-10-20", title: "Listings that stay", items: [
    "<b>Offers to other players no longer expire.</b> The listing shows no time limit and stays up until it sells or you withdraw it. (The online market needs a one-line database update for this; see sql/r1-no-expiry.sql.)"
  ] },
  { v: "19.13.0", date: "2026-10-20", title: "Finding your way", items: [
    "<b>District signposts list the shops.</b> Talk to a district signpost to see which shops and services are in the district you are in, and what each other district has, with directions.",
    "<b>Guards know every shop.</b> Ask a gate guard \"Where can I find...?\" and pick a shop or service. They give the nearest one, its district and direction, and mark it on your map if it is in the same district.",
    "<b>Map and minimap.</b> The city map shows a ringed \"You are here\" dot, and shops and services show their icons on the minimap and the district map.",
    "<b>First visit to a city</b> shows a title card naming its districts and what each is for.",
    "<b>Delivery Box at your residence.</b> Everything you sell at the auction house is collected from the Delivery Box in your residence. The auction house only shows what is waiting.",
    "<b>No time limit on auction listings.</b> They stay up until they sell or you withdraw them. The My lots view is now called My listings. Offers to other players are still limited by the online market.",
    "<b>Warp stones.</b> Touching one for the first time now plays a magic effect and tells you that you have attuned to it.",
    "<b>Barber.</b> The 3D preview now appears while you choose a look, and the face tiles are an even size.",
    "<b>Hotkey bar.</b> Every slot is now the same square size."
  ] },
  { v: "19.12.0", date: "2026-10-20", title: "Skylines and Steps", items: [
    "<b>City set pieces.</b> Every district now has landmarks you can spot from a distance: clock and bell towers, slender spires, tall chimneys with drifting smoke, harbour cranes, and a flaming beacon post at each gate. Neighbouring districts show their tall landmarks on the skyline.",
    "<b>Height in the cities.</b> The Government plaza, the Saltreach Hall square and the Ironvale Keep square stand on low terraces with stone retaining walls and steps where the roads meet them.",
    "<b>Street dressing by district.</b> Markets get goods racks and barrel stacks, civic districts banners and armour stands, workshops woodpiles, docks rope coils and net racks, gates banners and armour stands. Some squares have a cart being loaded.",
    "<b>Mercenary slots follow your jobs.</b> You can hire <b>one</b> mercenary once any job reaches Lv5, <b>two</b> at Lv10 and <b>three</b> at Lv15 or higher. Anyone already hired stays.",
    "<b>Adventurers' Guild daily shop.</b> Spend guild points on a Potion and an Ether from the start, a Guild Warp Scroll (carries you to the Ashenreach market) at Bronze, a random crystal at Iron, a random common find at Silver, uncommon at Gold and rare at Mythril. One of each per day, and prices climb steeply with rank. Hi-Potions are no longer sold there.",
    "<b>Auction Essence choice.</b> When you list a lot you now pick which element of Essence pays the listing cost.",
    "<b>Hidden Caches are rare.</b> A cache now appears on only some days (about one in four) in the zones that have them, at a different random spot each day, and it crumbles away once you open it.",
    "<b>Monster jobs in their names.</b> A monster with a job is named for it, such as Goblin White Mage.",
    "<b>Fixes.</b> The treasure chest lid now draws properly. A bat animation crash is fixed. Victory music is an octave lower and no longer shrill."
  ] },
  { v: "19.11.0", date: "2026-10-20", title: "House rules", items: [
    "<b>Hotkey bar.</b> It now sits directly above the Target box, exactly as wide as the boxes under it (two rows of five), and always draws on top of them instead of hiding behind. Your old dragged position is reset once; you can still drag it by the grip.",
    "<b>Event log history.</b> Click the event log to open it and scroll back through up to 500 old lines. Click the world or press Esc to close it.",
    "<b>Quest tracker.</b> Accepted quests, your current story step and accepted bounties now show at the top left of the screen with their progress. It hides itself while a window, menu or dialog is open, and you can switch it off under Settings (Quest tracker).",
    "<b>No XP from errands.</b> Quests, bounties, Trade Board requests and story steps now pay crystals, items and guild points only. Kills are the only way to level.",
    "<b>Groups level slower.</b> Each extra party member cuts your share of kill XP by 25% (minimum 20%): 75% with one companion, 50% with two, 25% with three.",
    "<b>Three mercenaries at most.</b> A full party is you plus three. Saves that had more keep their first three.",
    "<b>Auction house.</b> Listing a lot now also costs Essence crystals of any element: 1 per 1,000 of the item's base price, rounded up. Towns never put Essence in their daily listings, but Essence that players or mercenaries sell to a town is relisted like anything else. Bows, instruments, throwing weapons and ammunition are now filed under Weapons, and flutes, horns, harps and boomerangs have their own icons instead of looking like bows.",
    "<b>Floating rocks fixed.</b> Rocks scattered near zone exits could be placed past the edge of the ground and hang in the air. Nothing is placed off the terrain any more, and every placed object in every zone was checked against the real ground mesh."
  ] },
  { v: "19.10.0", date: "2026-10-20", title: "Room to breathe", items: [
    "<b>Fewer empty houses.</b> About half of the houses with nobody home, no door and no shop are gone (Ashenreach 228 to 122, Saltreach 178 to 93, Ironvale 225 to 108, counting every district). The ones that frame streets and squares stay.",
    "<b>Little scenes in the gaps.</b> Gardens, courtyards with a tree and benches, wells, shrines, market carts, crates and barrels, laundry lines, an open-air forge and watchtower stubs; Saltreach adds net racks and boat ramps, Ironvale mine carts and woodpiles. They block like furniture, so walk around them.",
    "<b>Signs that mean something.</b> 25 signs on buildings that did nothing (Barracks, Chapel, Market Hall, taverns, workshops, the Fish Market row and so on) are gone. Every sign left belongs to a shop, an NPC or a door, faces the street and matches the trade.",
    "<b>Your residence stands out.</b> A sign over the door reads Home of and your name (it follows a rename), a gold house shows on the map and the minimap, and the first time you enter the Residential District a title card and a log line point it out.",
    "<b>Nothing floats.</b> Every placed object in every town and field zone was checked against the ground; camps and other prop NPCs now sit on the lowest point of their footing.",
    "<b>Updates tab bold text fixed.</b> Bold in this list used to show as literal tags.",
    "<b>Help</b> covers the residence marker, the first-visit card and the open spaces."
  ] },
  { v: "19.9.0", date: "2026-10-20", title: "Reading the room", items: [
    "<b>Hate bar.</b> Target a monster that is fighting and the target frame shows who it is on and a bar for your share of the top hate. Red: it is on you (below full means someone is about to take it). Gold: it is on someone else and the bar is how close you are to pulling it.",
    "<b>Swap alert.</b> When a monster turns on someone new, a ! flashes over it with a ring and the log says who it turned on. A red ‼ means it just turned on you.",
    "<b>Temper.</b> Inspect and the Database now tell you what a family resents most and what it shrugs off, once you have defeated five of them (one for a notorious monster). Before that they tell you how many more to fight.",
    "<b>Help</b> explains how to read the hate bar, the swap alert and tempers."
  ] },
  { v: "19.8.0", date: "2026-10-20", title: "Hate that remembers", items: [
    "<b>Two kinds of hate.</b> Every monster now keeps two scores for each of you: a lasting grudge that builds with every hit, spell and cure and fades slowly, and a hot flash of anger that fades within about a minute. The monster attacks whoever has the highest total.",
    "<b>Criticals sting.</b> A critical hit draws half again as much hate as a normal hit of the same size. Notorious monsters and bosses are too proud to care about criticals.",
    "<b>Monsters have tastes.</b> Skeletons, orcs and lizards hold a grudge against steel; worms, bats, crabs, treants and Reefkin against spells; Crag Talons against job abilities and healers; ghouls and mandrakes against whoever keeps curing. The same action can be worth up to 40% more or 20% less depending on who you hit.",
    "<b>No more ping-pong.</b> A monster only turns on someone new once they lead the current target's hate by 10%, and it then sticks with the new target for at least a second.",
    "<b>Flash.</b> Paladins learn Flash at level 7: a half-second cast that blinds the target for 12 s and lands a heavy burst of hot hate. Provoke is half lasting grudge, half hot anger, so it both grabs a monster and keeps it.",
    "<b>Smarter companions.</b> Tank companions Provoke, Flash and Sentinel when their lead slips rather than only after they lose the monster; healers and nukers stop throwing extra spells when they are about to steal it.",
    "<b>Shared zones.</b> Hate sent to the zone host now carries its kind so the host applies the same family tastes everyone sees locally."
  ] },
  { v: "19.7.0", date: "2026-10-20", title: "Crawlers, crabs and worms", items: [
    "<b>Crabs scuttle.</b> Crabs turn half-side-on when they move and step their eight legs in two alternating sets, with a knee in each leg so the feet lift clear of the ground. Their strikes no longer drive the far claw and legs into the dirt.",
    "<b>Crawlers walk on their legs.</b> Each pair of legs lifts, reaches and plants in a wave that runs down the body, and the segments are sealed at the joints so nothing opens up when a crawler rears.",
    "<b>Worms lie on the ground.</b> Every segment now rests on the soil instead of the tail floating a hand's width above it, worms wind side to side as they move, and rearing, striking and flinching keep the head above ground.",
    "<b>Toads hop.</b> Bog and jade toads and Old Croaker push off with their hind legs, tuck the front legs in the air and land on all four, instead of walking on sunken feet.",
    "<b>Joints closed</b> on bats (wing root), bees, wasps and hornets (tail), mandrakes (shoulders and hips) and snappers (fin roots)."
  ] },
  { v: "19.6.0", date: "2026-10-20", title: "Beasts on four feet", items: [
    "<b>Sheep, rams and longnecks have real legs:</b> a haunch and shoulder mass, a knee, a tapered shin and a hoof, in place of the stick legs. Sheep also got a bigger head.",
    "<b>Four-legged feet stay planted.</b> Walks, trots and gallops now move each foot with the ground; the hooves no longer skate.",
    "<b>Lizards no longer sink.</b> Hill, bog, dune, frost, plains, magma and shore lizards and Pyreclaw keep their belly, legs and tail above ground when they rear, strike, flinch or are alerted, flex side to side as they sprawl along, and carry a ridge of spines down a tail that moves with the body."
  ] },
  { v: "19.5.0", date: "2026-10-20", title: "Heavier orcs, rooted treants, real robes", items: [
    "<b>Orcs are built like orcs:</b> thick thighs and calves, heavy upper arms, a broad chest and shoulders set forward.",
    "<b>Treants stand like trees:</b> a short, thick trunk of a leg with splayed root feet, branch arms hanging low, and a slow sway while they wait.",
    "<b>Ghouls and the drowned are thinner</b> through the limbs.",
    "<b>Robes hang properly.</b> On monsters and townsfolk alike, a robe is now one garment: the front and back panels swing with each stride and settle when you stop instead of the two halves flapping open like doors.",
    "<b>Pipkin feet stay planted.</b> Pipkin adventurers had the same skating step as goblins did; they now take quick short steps and finish a step when they stop."
  ] },
  { v: "19.4.0", date: "2026-10-20", title: "Monsters on their feet", items: [
    "<b>Goblins no longer skate.</b> Their feet stay planted on the ground with each step: short legs now take quicker steps, and they break into a proper run when they chase you.",
    "<b>Beastmen and undead finish their step when they stop</b> and settle their weight instead of gliding to a halt.",
    "<b>Monsters have idle habits:</b> while they wander, goblins, orcs, Reefkin, Crag Talons, treants, ghouls, skeletons and Needlekin look around, shift their weight, scratch, stretch or scuff a foot."
  ] },
  { v: "19.3.0", date: "2026-10-20", title: "Music for every mood", items: [
    "<b>Battle music now matches the monster:</b> four themes for weak or easy, fair, tough or very tough, and incredibly tough monsters. Notorious Monsters and bosses keep their own theme.",
    "<b>Victory stops the battle music at once.</b> One of three victory fanfares plays at random, then the area music fades back in.",
    "<b>Area music changes with the time and weather:</b> towns, fields and homes have night, rain and snow versions, fields also have storm and fog versions, and storms in town use the rain music."
  ] },
  { v: "19.2.1", date: "2026-10-20", title: "A Mercenary Hall in every city", items: [
    "<b>Saltreach and Ironvale now have a Mercenary Hall.</b> Dorrin keeps the one on Harbor Square (south-west corner, beside Sailors' Rest) and Hild keeps the one in the Keep (south-west, across from the Hearth Chapel). They hire out the same fighters as Brann in Ashenreach, so you can hire or dismiss companions in any city.",
    "Brann is still the only one with quests."
  ] },
  { v: "19.2.0", date: "2026-10-20", title: "Fair drops and local markets", items: [
    "<b>Drop rates changed:</b> ordinary monster drops are now common (10-15%), uncommon (1-5%) or rare (under 1%), and Notorious Monster gear drops at 10-20%. Gear and spell scroll drops are unchanged. Trade goods (hides, chitin and so on) follow the same tiers.",
    "<b>Merchants buy at half the shop price</b> (it was a fortieth), so the crystals you get for gear and materials are much higher than before.",
    "<b>The auction house pays up to 1.5 times the shop price</b> for lots in its own city.",
    "<b>+1 gear costs twice the plain version, +2 and +3 three times.</b> Notorious Monster gear is no longer Rare: it can be traded at the auction house and sold to merchants, at about three times the price of similar gear.",
    "<b>Auction lots only sell in their own city.</b> You can only see and buy shop stock, player lots, companion lots and relisted goods from the city you are standing in. Lots sent to the server also carry their city.",
    "<b>Server setup:</b> run the latest setup SQL (Settings, Admin) so online lots are limited to their city and towns use the new price ceiling."
  ] },
  { v: "19.1.0", date: "2026-10-20", title: "Gates, homes and roads", items: [
    "<b>Every city exit is now a small gate zone</b> with just a guard post, the gate guard (City Blessing) and a stablemaster. Ashenreach Eastgate shrank to a single short street. Saltreach gains a North Gate (to the Ashen Marsh) and an East Gate (to Frostspire Pass), and Ironvale's Gate Ward shrank and gains a South Gate (to the Sunscar Desert).",
    "<b>City quests are at the gates:</b> Captain Rhea waits in Eastgate, Ilsa in Saltreach North Gate and Brisa in Ironvale Gate Ward.",
    "<b>Your residence is easy to reach:</b> it sits just inside the Residential District gate from the Market, and Odette's Furnishings and the barber are now right next to it. Ironvale's barber moved to the South Ward (homes). Saltreach has no residential district, so its barber stays on Harbor Square.",
    "<b>Auction clerks stand at the Auction House door</b> instead of out on the plaza.",
    "<b>Warp stones moved</b> beside a street near the middle of every district, facing the road. You now arrive on the street in front of the stone. Every new gate zone has one too.",
    "<b>Nothing stands in the roads:</b> trees, people, stalls, carts, benches, lamps, rocks and signs are kept off streets and footpaths everywhere, and footpaths to doors no longer cut through the house next door.",
    "<b>New: change your name.</b> Aurel the Registrar (Hall of Records, Ashenreach Government District) and Ingrid (Council Hall, Ironvale Keep) change your name for 10,000 crystals. Playing online needs the admin to run the latest setup SQL first.",
    "Online town buying now also waits 20 minutes before buying a player's lot and only buys lots listed in that town (also needs the latest setup SQL).",
    "The Supplies shop moved from Eastgate to the Residential District, near your residence (Ashenreach) and from the Gate Ward to the South Ward (Ironvale). The district tour quests now include the new gate zones. Your position in a city resets to its central square once."
  ] },
  { v: "19.0.1", date: "2026-10-19", title: "Auction timing fix", items: [
    "<b>Towns now buy your auction lots on a real 20-minute clock.</b> An old rule was still selling lots by chance every minute, so several could go at once. That rule is gone.",
    "Each town buys at most one of your lots every 20 real minutes, only lots you listed in that town, and only once a lot has been up for 20 minutes. The clock keeps running while you are offline.",
    "The Sell view now says whether your price is low enough for the town to buy (it pays up to 1.25 times the market price)."
  ] },
  { v: "19.0.0", date: "2026-10-19", title: "One sign per shop", items: [
    "<b>Every shop and hall now has exactly one sign,</b> on its front. The extra side sign and the hanging trade icon are gone.",
    "<b>Signs for shops that don't exist are gone.</b> The filler buildings along the streets (Bakery, Tailor, Net Maker and the like) are now plain houses with no sign or awning; only buildings you can actually visit are named.",
    "<b>Sign text always fits its board.</b> Long names such as Adventurers' Guild and Chapel of the Dawn shrink to fit, and very long ones wrap onto two lines."
  ] },
  { v: "18.99.0", date: "2026-10-19", title: "Menu fixes", items: [
    "<b>C now opens the command menu with your Status showing</b> (the same as choosing Status from the main menu). Press C again to close it, or Esc to step back to the command list.",
    "<b>The defeat prompt is much narrower</b> and wraps its text instead of stretching across the screen.",
    "<b>The Log Out prompt now appears in the middle of the screen.</b>",
    "<b>Item cards only mention races when there is a restriction.</b> Gear anyone can wear no longer says All Races; race-locked gear still shows the race it needs."
  ] },
  { v: "18.98.0", date: "2026-10-19", title: "City sweep", items: [
    "Final pass over the rebuilt cities: every walking route (the townsfolk and animals that stroll the streets) now stays on the road and clear of buildings and water; several routes in Saltreach and Ironvale used to clip through houses.",
    "Help now describes each city as a hub around its central square, lists the new Saltreach and Ironvale buildings, and has a short Getting around tip with walking, sprinting and warp-stone times.",
    "Checked quest and townsfolk text against the new layouts: the district tour quests, guards, signposts and warp stones all point at the right places."
  ] },
  { v: "18.97.0", date: "2026-10-19", title: "Ironvale rebuilt", items: [
    "<b>Ironvale is rebuilt and much bigger.</b> Its five districts are now each about 2400 by 1800 (roughly four times the old size), laid out as a cross around Market Square with a planned street grid. Every house, shop and hall faces a street, and the stone mountain look is kept.",
    "<b>Market Square</b> (centre): the crystal plaza, stalls and the barber, the General Store, Auction House, Job Master, Anvil & Ale, the stables and dozens of small named shops (Nail Maker, Furrier, Pickmaker, Lantern Maker and more). <b>The Keep</b> (north): the keep itself with Brisa, the Frost Guard barracks, the Council Hall and the Hearth Chapel. <b>Gate Ward</b> (west): the guard post, Frostgate Lodge and the road to Frostspire Pass. <b>South Ward</b> (south): rows of homes, the Hearthstone Inn, a grain store and the road to the Sunscar Desert. <b>Smelters' Row</b> (east): smelters, warehouses, Haldor's Mythrilsmith, the Armory and Arms shops and the mine.",
    "Gates match Ashenreach and Saltreach: district-colour city gates, a \"To ...\" signpost at every exit and a view of the next district through the gate. Districts now join through Market Square only (four gates).",
    "If you logged out anywhere in Ironvale, you load onto Market Square next to the crystal."
  ] },
  { v: "18.96.0", date: "2026-10-19", title: "Saltreach rebuilt", items: [
    "<b>Saltreach Harbor is rebuilt and much bigger.</b> Its four districts are now each about 2400 by 1800 (roughly four times the old size) with a planned street grid, and every house, shop and warehouse faces a street. Harbor Square sits in the middle with the Fish Market to the west, Shipwrights' Row to the east and The Docks to the south.",
    "<b>The Fish Market</b> has a plaza of fish stalls (Marn's is the blue one), Smokehouse, Net Loft, Chandlery and a quay street along the sea with fishing piers and moored boats. <b>Harbor Square</b> holds the crystal plaza, the Harbor Master's hall, the Auction House, the Outfitters Hall, Sailors' Rest, the Job Master and the barber's stall, with the road north to the Ashen Marsh. <b>Shipwrights' Row</b> has the Shipwright, a sawmill, ropewalk, stables, three slipways and the guard post on the road to Frostspire Pass. <b>The Docks</b> are warehouses, Customs and the Pilots' Hall above a long waterfront with five piers, a lighthouse and the Gull Isle ferry at the middle pier.",
    "Dozens of small named shops line the streets (Net Maker, Sailmaker, Chandler, Smokehouse, Tide Tables, Tackle Shop and more), with lamps, planters, wells, carts and hay. Gulls wheel over the water.",
    "The harbor districts use the same gates as Ashenreach: city gates in the colour of the district beyond, a \"To ...\" signpost at every exit, and a view of the next district's rooftops through the gate. Harbor Square has three gates (west, east, south).",
    "The Fish Market and Shipwrights' Row open onto the sea on their south side, with piers to fish from.",
    "If you logged out anywhere in Saltreach, you load onto Harbor Square next to the crystal."
  ] },
  { v: "18.95.0", date: "2026-10-19", title: "Ashenreach rebuilt", items: [
    "<b>Ashenreach Outpost is rebuilt and much bigger.</b> The five districts are now laid out as a cross around the Market, each about 2400 by 1800 (roughly four times the old size), with a planned street grid: main avenues through the gates, ring roads and side lanes, and houses and shops on both sides of every street.",
    "New landmarks: City Hall above a fountain square, the Hall of Records, the Chapel of the Dawn, The Ember Mug tavern, the Tannery, the Wayfarer's Inn, the Gate Watch, a park with a pond in the Residential District, a caravan yard in Eastgate and dozens of small named shops (Bakery, Tailor, Potter, Cartographer and more).",
    "Street dressing: shade trees on the main avenues, lamps along every street, planters, wells, carts, hay bales and statues.",
    "<b>Gates look like part of town:</b> through a gate and over the walls you now see the next district's streets and rooftops instead of open hills. City gates hang the colour of the district beyond and carry its name over the arch.",
    "<b>Every zone exit in town has a signpost</b> reading \"To ...\" with the place it leads to, including the roads out of the city.",
    "<b>People face the street and keep their distance:</b> every townsperson in all three cities now faces the nearest street (the barber and Maera face their counter), and no two people stand closer than about 7 yalms.",
    "The Market now has four gates, one to each district (north, south, east, west). Districts no longer connect to each other directly except through the Market.",
    "If you logged out anywhere in Ashenreach, you load onto the Market plaza next to the crystal.",
    "Ground and roads load faster in towns."
  ] },
  { v: "18.94.0", date: "2026-10-19", title: "Districts become zones", items: [
    "<b>Every city district is now its own zone.</b> Ashenreach Outpost (5 districts), Saltreach Harbor (4) and Ironvale (5) are split along their walls. Walking through a gate hall zones you into the next district with a short loading screen, the same way roads between areas work.",
    "District zones have city names: Ashenreach Market District, Ashenreach Eastgate, Saltreach Docks, Ironvale Keep and so on. The zone banner shows the district with the city underneath.",
    "Each district is walled on every side that faces another district, with a gate between two towers wherever a gate hall used to be.",
    "<b>Fade in:</b> every zone now fades in from black when it finishes loading, including warps, doors, your home point and logging in, not only after zone lines.",
    "<b>City overview on the map:</b> the Map window shows every district of the city you are in, the gates between them, the roads out of town and where you stand.",
    "Warp stones still warp you between districts of the same city for free (now a quick zone change). Home points, crystals, the auction house, vendor stock and the district tour quests work across the whole city.",
    "The Gull Isle ferry sails from Saltreach Docks. Rocky Hollow leads into Ashenreach Eastgate, your residence opens onto the Residential District, Frostspire Pass into Ironvale Gate Ward or Saltreach Shipwrights' Row, and the Sunscar road into Ironvale South Ward.",
    "Saves are moved automatically: if you logged out in a city, you load into the district you were standing in.",
    "Buildings and people no longer stand in gate passages or against the district walls. A few buildings moved a little to make room, and Ironvale's Scrolls shop moved beside the Keep road.",
    "Signposts list the other districts with directions."
  ] },
  { v: "18.93.0", date: "2026-10-19", title: "Street fronts", items: [
    "<b>Every door faces a street.</b> Buildings in Ashenreach Outpost, Saltreach Harbor and Ironvale can now face north, south, east or west, and each one turns to face its nearest street instead of a wall or a back garden.",
    "<b>Vendors are out of the road.</b> All eighteen vendors now stand just beside their shop door, facing the street, with room to walk past. Shops that sat on or against a road were moved back to give them a proper storefront.",
    "Buildings that sat on a road (the Outpost stables, guardhouse and city hall) were moved or the road trimmed. Doors set back from the street get a short footpath to it.",
    "Several shops moved to better lots: Outpost Provisions and Scrolls (south side of the Market), Harbor Armory (east of the Shipwrights' road), Supplies and Jewels; Ironvale Armory (south of the Arms shop) and Scrolls (beside the Keep road).",
    "Townsfolk, signposts, boards and warp stones no longer stand in the road, inside a building, against a city wall or in front of a shop window. Captain Rhea now waits beside the Barracks rather than on the street.",
    "Vendors and other townsfolk turn back to face the street after you finish talking to them.",
    "<b>Map:</b> each building's door is marked with a gold tick, and buildings turned east or west are now drawn the right shape."
  ] },
  { v: "18.92.3", date: "2026-10-19", title: "Glute profile", items: [
    "<b>Buttocks reshaped in profile</b>: they now slope out from the waist to a full curve that sits lower, round under at the bottom and meet the back of the thigh in a soft fold, instead of tapering into the leg.",
    "The black back strap now stays visible all the way down the crease."
  ] },
  { v: "18.92.2", date: "2026-10-19", title: "Anvils and zone runs", items: [
    "<b>Smiths have something to hammer:</b> every Armorer, Weaponsmith and Garrick now works at an anvil on a wooden stump with a glowing bar of metal and tongs, and the metal flares brighter each time the hammer lands.",
    "<b>Maris</b>, the Outpost jeweler, is now a Pipkin.",
    "<b>Zone lines:</b> touching a zone line now has you run forward for about a second while the screen fades fully to black, then the next area fades in. Doorways and exits that ask first now do the same run instead of cutting straight to the loading screen.",
    "<b>Rounder hips:</b> in profile the buttocks are now a full round dome that eases into the lower back, not a point.",
    "Fixed a model error for Pipkin townsfolk wearing boots."
  ] },
  { v: "18.92.1", date: "2026-10-19", title: "Fuller hips", items: [
    "<b>Women's buttocks are fuller and rounder</b>: two clearly separate lobes that rise smoothly out of the lower back, stay round all the way down in profile and tuck under into a clean fold above the thigh.",
    "<b>Thong:</b> the waist string now dips in a small V at the centre of the back, and a solid black string runs from the V all the way down between the buttocks and under, instead of disappearing partway."
  ] },
  { v: "18.92.0", date: "2026-10-19", title: "Natural movement", items: [
    "<b>Heel to toe:</b> every step now lands on the heel, rolls flat and pushes off from the toes, so the back foot peels up off the ground instead of sliding flat.",
    "<b>Walking:</b> the hips rise and sway over the standing leg and drop on the swinging side, the shoulders roll the other way, and the arms swing properly from the shoulder.",
    "<b>Running:</b> elbows bend and pump, knees drive higher, the body leans further forward, and you dip on each landing and rise between strides instead of bobbing like a walk.",
    "<b>Starts, stops and turns:</b> you lean into setting off, rock back and settle when you stop, bank into curves while running, and the head turns into the turn first.",
    "Applies to every race (each keeps its own style) and to townsfolk and humanoid monsters.",
    "<b>Townsfolk use the new face and hair choices</b> from character creation: every NPC and passer-by now gets one of the creation presets for their race (face, hairstyle and face details), keeping their own hair colour. Bald, hooded and helmeted NPCs keep their look.",
    "<b>Hoods now cover the top of the head</b>, so hooded NPCs and players no longer show a bare scalp and stray fringe under the hood.",
    "<b>Women's bodies:</b> a fuller bust (about 10% larger) set closer together with natural cleavage, and buttocks that curve out smoothly from the lower back, round fully from top to bottom in profile and tuck under at the fold instead of looking flat."
  ] },
  { v: "18.91.0", date: "2026-10-19", title: "New underwear and slimmer shoulders", items: [
    "<b>New women's underwear set</b>: a smoky black triangle bikini top with fine edge binding, a halter that ties in a bow behind the neck and a thin band that ties in a bow across the back, plus a matching string thong with a small front triangle, a bow on each hip and a waist string that rises to sit on the waist above the buttocks. Every race wears it, scaled to their build, including Pipkins.",
    "<b>Women's shoulders are narrower</b> (about 13% on Humans, Elari and Nekari, 5% on Pipkins), with the upper chest tapering in to match. The waist, hips and bust are unchanged, and armour, robes and shoulder guards follow the new shoulder line.",
    "<b>Smoother waist:</b> the hard ridge where the hips met the waist is gone; the torso now curves smoothly from waist to hips on all women.",
    "Men's boxers are unchanged."
  ] },
  { v: "18.90.0", date: "2026-10-19", title: "Interrupts", items: [
    "<b>Physical hits interrupt casting.</b> Any melee hit, arrow, weapon skill or physical monster move that lands on a caster ends the cast at once. Aquaveil absorbs one interrupt. Monsters that cast are thrown off 75% of the time. Magic hits keep the old 40% chance.",
    "<b>Weapon skills have a short wind-up</b> (about 0.8 s, shown on the cast bar). Moving or Escape cancels it and keeps the TP; a physical hit cancels it too, and the TP is lost if it lands in the last quarter. Party members follow the same rules.",
    "<b>Monster TP moves can be cut short:</b> a physical hit has a 35% chance to interrupt a monster that is readying one.",
    "New setting: Settings, Combat, <b>Old interrupt rule</b> to go back to the chance-only rule.",
    "Test fixes: the goblin sight test no longer depends on weather, the starting-spell test matches the advanced job rules, and two summon tests no longer fail by chance."
  ] },
  { v: "18.89.0", date: "2026-10-19", title: "Storefronts", items: [
    "<b>Every vendor shop now shows its trade</b>: a round hanging emblem sign (shield, sword, pick, flask, scroll or gem) and wares outside the door: an armour stand and shield at the Armory, a weapon rack and anvil at the Arms shop, crates, sacks, a pick and a hatchet at Supplies, barrels and a table of bread and potions at Provisions, a lectern, candles and a glowing orb at Scrolls, and a glass case of gems and a strongbox at Jewels.",
    "<b>Shops were moved so every vendor faces an open street</b>, not the back of another building. Outpost market shops now line the main road; Ironvale's smiths share the open south end of Smelters' Row, its Tradesman sits by the west gate, and its Spellsmith beside the Keep.",
    "Garrick now stands between the two smithing shops in the Outpost's industrial district, and the Outpost industrial and Harbor shipyard warp stones moved a little so they no longer block a shop front."
  ] },
  { v: "18.88.0", date: "2026-10-19", title: "Vendor shops", items: [
    "<b>Every vendor now stands outside their own shop</b> in all three towns, with a signed storefront (Armory, Arms, Supplies, Provisions, Scrolls, Jewels). They no longer share open market stalls.",
    "<b>Vendors are spread over the districts:</b> the Armorer and Weaponsmith work in the industrial districts (the Shipwrights' Row at the harbor, Smelters' Row in Ironvale), the Tradesman in a gatherer's spot (Eastgate, Fish Market, Smelters' Row), and the Quartermaster, Spellsmith and Jeweler in the markets and squares.",
    "Shop names appear on the town map. The market keeps its open stalls and barbers for flavour.",
    "Next step: a storefront art pass with trade props and a look at every town."
  ] },
  { v: "18.87.0", date: "2026-10-19", title: "Trade goods", items: [
    "<b>Beasts now drop trade goods</b>: hides, chitin, fibre, scales or elemental cores depending on the creature, in four grades by level (Coarse, Fine, Choice, Prime). Sell them to any shop or on the auction house. This replaces the crystals beasts used to pay.",
    "<b>Humanoid monsters pay more crystals</b> and drop job-matched gear a little more often, so they are now the best source of money and equipment.",
    "Overall income per kill is about the same at low levels and around a quarter lower at levels 15 to 20; humanoid camps pay about what they did before.",
    "The bestiary now lists trade goods for beasts, and crystals plus job gear for humanoids."
  ] },
  { v: "18.86.0", date: "2026-10-19", title: "Drop rules", items: [
    "<b>Gear, weapons and spell scrolls now drop only from notorious monsters, bosses and humanoid monsters</b> whose job and level could use the item. A monster never carries gear for another job or above its level.",
    "<b>Crystals (money) drop only from humanoids, notorious monsters and bosses.</b> Beasts, plants, insects and bombs no longer pay crystals; essences and materials still drop as before.",
    "Next step: rebalance the loot tables so beasts drop more materials and humanoids get job-themed gear."
  ] },
  { v: "18.85.0", date: "2026-10-19", title: "Fuller hips", items: [
    "<b>Hips are about twice as wide and twice as tall</b> on female Human, Elari and Nekari bodies, and they are now shaped directly into the body surface, so they blend seamlessly into the lower back, sides and thighs with no visible join.",
    "The dark crease line, thong strap, briefs and waistbands follow the new shape. Body physics still applies (Settings, Graphics, Body physics)."
  ] },
  { v: "18.84.0", date: "2026-10-18", title: "Hips and body physics", items: [
    "<b>Rounder, fuller hips</b> on female Human, Elari and Nekari bodies, with a dark crease line down the middle. Underwear and legwear follow the new shape (the thong strap now sits in the crease). Hidden under robes, coats and armour skirts.",
    "<b>Body physics:</b> the bust and hips now bounce and settle softly as you walk, run, jump, land and swing. It is subtle, damped quickly when you stop, toned down under mail and off under plate.",
    "<b>New setting:</b> Settings, Graphics, <b>Body physics on/off</b>."
  ] },
  { v: "18.83.0", date: "2026-10-18", title: "Weapons on the body", items: [
    "<b>Sheathed weapons now rest against your back</b> instead of floating behind you. The gap is worked out from each body's real shape, so Ursan, Pipkin, slim and broad builds all wear their weapon snugly, with just enough room that it never sinks into the body. Plate armour and capes push it out a little so it sits on top of them.",
    "Each weapon type keeps its own clearance (daggers and katanas sit closest, great axes and clubs a little further out).",
    "<b>Fixed:</b> the dark outline around weapons failed to draw on some graphics drivers; weapons now get the same outline as characters."
  ] },
  { v: "18.82.0", date: "2026-10-18", title: "Tails and cat ears", items: [
    "<b>Nekari ears are now cat ears:</b> wide triangular ears with a rounded tip and a pink inner, instead of thin horn-like spikes.",
    "<b>Nekari tails are rounder</b> and curve smoothly in an S shape, and they now sway gently left and right all the time, whether you stand still, walk or run.",
    "<b>Ursan tails are connected and rounded</b> at the curve. The blocky, separated pieces are replaced by one smooth tapered tail."
  ] },
  { v: "18.81.0", date: "2026-10-18", title: "Body shapes", items: [
    "<b>Rounder bust on female bodies</b> (Human, Elari, Nekari): the chest now has a full, rounded profile instead of a flat one. Shirts, vests and mail follow it, plate breastplates bulge to fit over it, and robes show a softer curve.",
    "<b>Lower waistline</b> on Human, Elari and Nekari bodies, both builds: the narrowest point of the torso sits lower, closer to the hips.",
    "<b>Ursan torso reworked:</b> the belly bulge around the middle is gone, the chest is deeper and rounder instead of a flat wide box, and the shoulders slope smoothly into the arms with no sharp corner. The underwear waistband ring is removed.",
    "Pipkin bodies are unchanged."
  ] },
  { v: "18.80.0", date: "2026-10-18", title: "Town barbers", items: [
    "<b>A barber in every town</b> (Corrin in Ashenreach Outpost, Maelle in the harbor town, Sunniva in Ironvale), at a red-and-white striped stall with a Barber sign, beside the main road.",
    "<b>Change your look for 1000 crystals:</b> talk to the barber and the creation screen opens with your race, gender and name locked. You can change face (including a ninth, barber-only face), hair, hair colour and size, with a live preview in your own gear (without a hat).",
    "Nothing is charged until you press Pay. Cancel or Back from the first step costs nothing. If you have under 1000 crystals the barber says so and the screen does not open.",
    "Your companions' looks are not affected."
  ] },
  { v: "18.79.0", date: "2026-10-18", title: "Beards, headbands and face marks", items: [
    "<b>Faces now come with their own extras:</b> beards and a goatee, headbands, a hairband, a gold circlet with a gem, hair clips, beaded side locks, ribbons and a bun pin.",
    "<b>Face marks:</b> a forehead tattoo, war paint under the eyes, cheek stripes for Nekari and blue markings for the crested Human face.",
    "Every Ursan face is bearded (a long beard), and the barber-only Ursan face has a small top tuft.",
    "Hats hide headbands, circlets, clips, pins and tufts; beads, ribbons, beards and face marks always show. Existing characters keep their current look."
  ] },
  { v: "18.78.0", date: "2026-10-18", title: "Pipkin, Nekari and Ursan hair", items: [
    "<b>16 new hairstyles</b>: for Pipkin, Bowl, Peaked bowl, Tuft (with an antenna curl), Pineapple, Poof, Twin buns, Side puffs with ribbons and Spiky tails; for Nekari, Long fringe and Wild mane.",
    "<b>Ursan manes:</b> Flared, Horned, Slick, Lion, Side (bare crown) and Crest manes replace the borrowed human styles, with a heavy fur ruff at the back.",
    "Pipkin, Nekari and Ursan faces now use these styles. Hats tuck in buns, peaks and crests. Existing characters keep their current hairstyle."
  ] },
  { v: "18.77.0", date: "2026-10-18", title: "Fifteen new hairstyles", items: [
    "<b>15 new hairstyles</b> for Human and Elari faces: Shaggy, Tousled, Slicked back, Long swept back, Uneven bob, Low bun, Side tail, Layered, Long shag, Feathered, Messy, Crown braid, Flipped bob, High bun and Long with bangs.",
    "Human and Elari faces now use these styles instead of the stand-ins, so the face list matches its intended look. Hats and helmets tuck the new styles in like the old ones.",
    "Long styles and the side tail sway as you move. Existing characters keep the hairstyle they already have."
  ] },
  { v: "18.76.0", date: "2026-10-18", title: "Hair table for every race", items: [
    "<b>Every race now has its own eight faces and hairstyles</b> in character creation: Human, Elari, Pipkin, Nekari and Ursan each pick from their own face-to-hair list.",
    "<b>Three hair colours per face:</b> the Hair colour step shows the colours that suit your face first, then a <b>More colours</b> palette.",
    "Existing characters keep the look they already have. Some new hairstyles use the nearest current style for now; the new styles arrive in the next updates."
  ] },
  { v: "18.75.0", date: "2026-10-18", title: "New visitor globe", items: [
    "<b>Visitor counter rebuilt on the standard Visitor Log design</b>, in the game's blue window colors. All earlier visit history is kept.",
    "<b>Bigger globe:</b> full-screen with pins, arcs, a night side, Per 1M shading, a Replay of how visits grew, a moon for unknown origins, and country flags on every platform.",
    "<b>Three panels:</b> Overview (goals, streak, reach, badges, share card), Trends (30 days, arrival hour, weekday, 365-day calendar, devices, discovery timeline) and Origins (search, sort, continents, compare, country cards).",
    "Visits now count once per browser tab per day."
  ] },
  { v: "18.74.0", date: "2026-10-18", title: "Towns resell what they buy", items: [
    "<b>Towns relist your goods:</b> whenever a town buys one of your auction lots (or a companion's), there is now a 50% chance it puts the item back up for sale under the town's name at a small markup. You and other shoppers can buy it back from the Buy list.",
    "Each town can hold up to 40 of these resale lots at once."
  ] },
  { v: "18.73.0", date: "2026-10-18", title: "Smoother heroes and softer faces", items: [
    "<b>Arms attach properly:</b> each arm is now one smooth piece from shoulder to wrist (no band or seam at the elbow), and a rounded shoulder blends the arm into the torso so it no longer looks like a stick pinned to the side.",
    "<b>Seamless shading:</b> where body parts meet (neck, shoulders, wrists, hips) the lighting now flows across the join instead of showing a hard line. The ring at the base of long necks is gone.",
    "<b>Sharper faces:</b> eyes, brows and mouths are painted at much higher detail and no longer look blocky up close, and heads are rounder and smoother.",
    "<b>Prettier female faces and figures:</b> a softer oval face with a smaller chin, fuller cheeks, a shapelier bust, and a slimmer chest on male bodies.",
    "<b>Fuller arms and hands</b> on all non-Pipkin heroes, and matte cotton underwear instead of shiny grey."
  ] },
  { v: "18.72.0", date: "2026-10-18", title: "Calmer small legs, better dogs and cats", items: [
    "<b>Small characters stop scurrying:</b> Pipkin and other short-legged bodies take about the same number of steps per second as a Human instead of four times as many. Their steps are shorter, their feet lift less, and they lean into a run less at normal speed.",
    "<b>Dogs and cats rebuilt:</b> real animal legs with a backward-bending hock on the hind legs, thicker upper legs that blend into the shoulders and haunches, and rounded paws with toes, instead of thin sticks.",
    "<b>Dogs and cats stroll:</b> they mostly walk around town, sometimes trot, and only rarely break into a run. Their stride and paw lift are smaller, so the legs no longer fling out behind them."
  ] },
  { v: "18.71.0", date: "2026-10-18", title: "Auction house and menu tidy", items: [
    "<b>Ashenreach auction house moved onto the market plaza:</b> it now faces the home point crystal, reached by a path from the main road, instead of facing the city wall. The clerk stands at its door.",
    "<b>Easier to spot:</b> the Auction House sign is larger, with a gold banner on the roof, in all three towns.",
    "<b>Auction menu on one line per row:</b> every item and every listing is one row (name, level, stock, price) under a column header, with View, Source and Type filter bars.",
    "<b>My lots</b> rows are one line each too: item, price, time left, Withdraw.",
    "<b>Spell, ability and item lists</b> opened from a target now use the same blue window and highlight as the main menu lists."
  ] },
  { v: "18.70.0", date: "2026-10-18", title: "Tidy town and slower fights", items: [
    "<b>Whole numbers:</b> heals, drains, potions and other restored amounts are rounded to whole numbers.",
    "<b>Slightly slower combat:</b> everyone swings about 15% less often, so fights last a little longer. Damage per hit is unchanged.",
    "<b>Auction clerk:</b> the auction counter is now a clerk standing against the front wall of the auction building, facing out, with no table in front.",
    "<b>Vendors spread out:</b> the six vendors in each town now stand in different districts instead of one cluster.",
    "<b>Party in the Social menu:</b> companion stance, gear, wages, bag and contracts moved into the Social menu (P). The separate Party tab is gone.",
    "<b>Tap a party member:</b> tapping a party or companion box selects them and opens a command window (Magic, Companion sheet, Check).",
    "<b>Phone swipe:</b> swipe left from the right screen edge to open the commands menu, and swipe right to close it."
  ] },
  { v: "18.69.0", date: "2026-10-17", title: "Plump Pipkin", items: [
    "<b>Smooth back:</b> the Pipkin upper body is one continuous rounded shape, so the back and shoulders no longer show flat panels or hard edges.",
    "<b>Fuller waist, rounder female Pipkin:</b> the waist is wider, and female Pipkin are plumper through the body, hips and thighs.",
    "<b>Slimmer wrists</b> that taper smoothly into the hands, and <b>shorter feet</b>."
  ]},
  { v: "18.68.0", date: "2026-10-17", title: "Round Pipkin face", items: [
    "<b>Pipkin faces are fully round</b>: the jaw no longer tapers to a point.",
    "<b>Chest lowered</b> on Pipkin, <b>feet made smaller</b>, and the arms now hang slightly away from the body so <b>hands no longer clip into the legs</b>."
  ]},
  { v: "18.67.0", date: "2026-10-17", title: "Chibi Pipkin", items: [
    "<b>Pipkin proportions halved where it counts:</b> the torso is about half as long, the arms about half as long, and the hands about half the size. The head is rounder.",
    "The Pipkin neck and shoulders now taper into the head instead of flaring out, and the bikini top band sits flush on the chest."
  ]},
  { v: "18.66.1", date: "2026-10-17", title: "Pipkin torso and legs", items: [
    "<b>Pipkin torso is shorter</b> and the legs are slimmer and shorter, with a smoother hip.",
    "<b>Softer Pipkin faces:</b> the cheekbones are no longer pronounced."
  ]},
  { v: "18.66.0", date: "2026-10-17", title: "Smooth bodies", items: [
    "<b>Pipkin rebuilt to the reference sheet:</b> a big, wide, round head with large pointed ears, a shorter torso, short thick legs and stout arms.",
    "<b>Rounder bodies for every humanoid.</b> Limbs, torso and legs now use twice the rings and at least 16 sides, so silhouettes are smooth instead of faceted. Hands have rounded palms instead of blocks.",
    "Characters drawn at long range or on Low graphics keep the lighter, faster meshes."
  ]},
  { v: "18.65.1", date: "2026-10-17", title: "Pipkin head and legs", items: [
    "<b>Pipkin heads are wider and rounder</b>, with larger pointed ears set on the sides of the head.",
    "<b>Pipkin legs are thicker</b> and set further apart for a sturdy, short-legged stance."
  ]},
  { v: "18.65.0", date: "2026-10-17", title: "Stout Pipkin", items: [
    "<b>Pipkin bodies reshaped.</b> Broader shoulders, a rounder torso, wider hips and thicker, sturdier limbs give the chunky, big-headed proportions of a Pipkin adventurer.",
    "<b>Smoother joins.</b> Pipkin shoulders, arms, torso and legs are built from extra intermediate rings, so curves flow instead of showing flat facets at the joints."
  ]},
  { v: "18.64.0", date: "2026-10-17", title: "Connected shoulders", items: [
    "<b>Arms now join the torso.</b> The top of each upper arm is thicker and tucks into the shoulder, so arms no longer look like separate tubes floating beside the body. Applies to every humanoid, including Ursan and Pipkin."
  ]},
  { v: "18.63.3", date: "2026-10-17", title: "Thief starts again", items: [
    "<b>Thief is a starting job.</b> New characters can start as a Warrior, Thief, White Mage or Black Mage, and Thieves start with the Turnip Knife. Other jobs are unlocked in play."
  ]},
  { v: "18.63.2", date: "2026-10-17", title: "Three starting jobs", items: [
    "New characters can only start as a Warrior, White Mage or Black Mage; other jobs are unlocked in play. Changing jobs never gives you new armor or items.",
    "Thieves no longer start with the Turnip Knife; it remains in the game but nothing hands it out yet."
  ]},
  { v: "18.63.1", date: "2026-10-17", title: "Turnip Staff stats", items: [
    "Turnip Staff now has DMG 4, delay 366 and can be used by War, Mnk, Whm, Blm, Rdm, Bst, Brd, Smn, Sch and Geo."
  ]},
  { v: "18.63.0", date: "2026-10-17", title: "Turnip starters", items: [
    "<b>New starting weapons.</b> Warriors start with a Turnip Sword, Thieves with a Turnip Knife, White Mages with a Turnip Rod and Black Mages with a Turnip Staff. They cannot be bought, sold at auction, dropped or crafted.",
    "<b>No starting helmet.</b> New characters begin with no head armor.",
    "<b>Armor you wear is now shown by default.</b> The Settings option now defaults to Show gear instead of Job style. Anyone who already chose an option keeps it."
  ]},
  { v: "18.62.1", date: "2026-10-17", title: "Pipkin underwear", items: [
    "Pipkin women now wear the same white string thong and bikini top as other women."
  ]},
  { v: "18.62.0", date: "2026-10-17", title: "Underwear", items: [
    "<b>Empty body or leg slots now show underwear.</b> With no body armor equipped, the chest is bare; with no leg armor, you wear underwear. Each slot is handled separately, so a shirt with no pants (or the reverse) works.",
    "Men wear plain white boxers. Women wear a skimpy white string thong and a white string bikini top. Pipkin women wear the same string set, scaled to their build.",
    "Applies to your character in game, the Equipment preview and other players. Job outfits only show when the slot is filled."
  ]},
  { v: "18.61.0", date: "2026-10-17", title: "An empty bag", items: [
    "<b>New characters no longer start with potions.</b> Your bag begins empty; buy potions in town. Existing characters keep what they have."
  ]},
  { v: "18.60.0", date: "2026-10-17", title: "City weapons", items: [
    "Eleven level 15 weapons lost their nation names: <b>City Sword, City Bow, City Bow II, City Crossbow, City Cesti, City Axe, City Knuckles, City Staff, City Staff II, City Scythe and City Club</b>. The Rare City Staff is still the Battlefield reward. Stats, jobs and drops are unchanged, and anything you own has been renamed."
  ]},
  { v: "18.59.0", date: "2026-10-17", title: "City gear", items: [
    "Four level 15 pieces lost their nation names and are now <b>City Slops, City Vest, City Tunic and City Harness</b>. Their stats, jobs and drops are unchanged, and anything you already own has been renamed."
  ]},
  { v: "18.58.1", date: "2026-10-17", title: "Ursan Braguette spelling", items: [
    "The Ursan legwear is spelled <b>Ursan Braguette</b>. Characters made on 18.58.0 keep theirs under the corrected name."
  ]},
  { v: "18.58.0", date: "2026-10-17", title: "Racial trousers", items: [
    "<b>Every race now also starts in its own legwear:</b> Human Pants, Elari Chausses, Ursan Braguette, Nekari Loincloth and Pipkin Braccae. Only that race can wear its pair, and every new character begins wearing it.",
    "Like the race body pieces, they are not sold in shops or at the auction house, and they can't be dropped by monsters or crafted.",
    "Renamed: Hume Pants are now Human Pants, Elv. M Chausses are Elari Chausses, Galkan Braguette is Ursan Braguette, Mithran Loincloth is Nekari Loincloth and Tarutaru Braccae is Pipkin Braccae. Elvaan F Chausses and Hume Slacks are gone; anything you owned of them was turned into Elari Chausses and Human Pants."
  ]},
  { v: "18.57.0", date: "2026-10-17", title: "Racial starting clothes", items: [
    "<b>Every race now starts in its own clothes.</b> Humans wear a Human Vest (Warrior) or Human Tunic (mages), Elari an Elari Jerkins or Elari Bodice, Ursan an Ursan Surcoat or Ursan Tunic, Nekari Nekari Separates or a Nekari Tunic, and Pipkin a Pipkin Kaftan or Pipkin Tunic.",
    "These ten body pieces can only be worn by their own race. They are not sold in shops or at the auction house, and they can't be dropped by monsters or crafted.",
    "Renamed: Hume Tunic and Hume Vest are now Human Tunic and Human Vest, Elvaan Jerkin and Bodice are Elari Jerkins and Elari Bodice, Galkan Surcoat is Ursan Surcoat, Mithran Separates is Nekari Separates and Tarutaru Kaftan is Pipkin Kaftan. Existing characters keep any of these they own.",
    "Item cards now show which race can wear a piece, and the equipment list tells you when your race can't wear it."
  ]},
  { v: "18.56.0", date: "2026-10-16", title: "Distant hills through every pass", items: [
    "<b>Looking out through any pass you now see layered hills</b> fading into the mist, instead of a flat grey wall with a straight edge. The distant hill rings dip at each exit so their jagged skyline shows through the gap, and they shade from darker at the foot to hazier at the top.",
    "The haze beyond each area fades in more gradually, so there is no hard line where it starts.",
    "Every outdoor exit in all 15 outdoor areas and towns was checked for floating scenery; none was found."
  ]},
  { v: "18.55.0", date: "2026-10-16", title: "Rugged mountain passes", items: [
    "<b>The slopes either side of every pass are rougher:</b> uneven ledges and shelves step up the hillside, the ground is lumpy instead of smooth, and boulders of different sizes sit half-buried along the slopes."
  ]},
  { v: "18.54.0", date: "2026-10-16", title: "Visitor origins extras", items: [
    "<b>Arcs:</b> glowing lines run from your country to every country that has visited, with a light travelling along each one. Toggle them with the Arcs button on the globe.",
    "<b>Per 1M:</b> shade the globe and rank the list by visits per million people instead of total visits.",
    "<b>Country cards:</b> tapping a country shows its visits, share, rank, visits per million, when it was first and last seen, how many people per visit it has reached, and a 30-day trend line. Press Compare and pick a second country to see them side by side.",
    "<b>Busiest hours</b> chart in your own time zone, and a <b>Find a country</b> search box above the list (Enter jumps to the first match)."
  ]},
  { v: "18.53.0", date: "2026-10-16", title: "Visitor globe", items: [
    "<b>Visitor Origins now opens on a spinning globe.</b> Countries are shaded from deep blue to white by how many visits they have sent, with a glowing pin on each one (gold for your own country). Drag to spin, scroll to zoom, and tap a country or a row in the list to swing the globe to it and see its visits."
  ]},
  { v: "18.52.0", date: "2026-10-16", title: "Visitor origins window", items: [
    "<b>Click the Visitors box</b> on the title screen to open Visitor Origins: total visits, how many countries, today's visits, your own country, a 14-day bar chart, the desktop and mobile split, and every country ranked with a flag, a bar and when it was last seen. Refresh with ⟳; close with ✕, a click outside or Esc.",
    "Visits now record the visitor's country (from their network) and device type. Earlier visits show as Unknown. A rotating globe view comes next."
  ]},
  { v: "18.51.1", date: "2026-10-16", title: "Visitor counter uses its own table", items: [
    "<b>Visitor counter.</b> The title screen shows how many times the game has been opened, in the game's blue window style, counting each player once per day. The light glows blue when it is connected and red when the server can't be reached (it then shows the last count seen).",
    "The count is kept in its own table on a separate server, so the game's save server and Admin setup are unchanged."
  ]},
  { v: "18.50.0", date: "2026-10-16", title: "Natural exits, low haze", items: [
    "<b>Haze only shows through exits.</b> The grey band no longer rises above the mountains around the edge of every area; it now sits just below ground level and only fills the gap you see through a pass.",
    "<b>Gentler, uneven slopes at every exit.</b> The mountains either side of a pass now slope up at a varying angle instead of forming steep straight walls, and the cliff rocks are rounded boulders instead of stacked flat slabs.",
    "<b>No more floating scenery at exits.</b> Waterfalls only appear against a real cliff face away from exits, wrecked wagons keep well clear of passes and the mountain edge, boulders stay off pass slopes, and camps, lookouts, shrines, tablets and caches are placed away from exits. The flat distant panels that hung in the air beyond each pass are gone, and the distant hill rings now reach down out of sight with jagged, uneven skylines."
  ]},
  { v: "18.49.0", date: "2026-10-16", title: "Retired shop goods become drops and recipes", items: [
    "<b>X-Potion, Hi-Ether, Super Ether, Reraiser, Hi-Reraiser, Super Reraiser and Chapel Sigil are now dropped and crafted.</b> Ghouls, Ice Wights, Drowned, Royal Guards, Crypt Sentinels and the Hollow King can drop them (rarer the stronger the item). Alchemy recipes make all seven from Hi-Potions, Ethers, Bone Chips, Silk Cloth and Reef Scales, and the recipe scrolls drop and appear on the auction house like any other recipe.",
    "<b>Quartermasters stock every ordinary cooked meal</b> (Grilled Minnow, Eel Pie and Perch Chowder were missing), so all ten potions and meals at level 5 or lower are on offer. Only ten exist at that level today; the stronger potions are now drops and crafts instead."
  ]},
  { v: "18.48.1", date: "2026-10-16", title: "Jeweler capped at level 11", items: [
    "<b>The Jeweler now sells rings and necklaces up to level 11</b> (10 items), with a random 5 on his shelf each day and each town. Every other vendor stays at level 5 or lower."
  ]},
  { v: "18.48.0", date: "2026-10-16", title: "Vela retires, strict vendor levels", items: [
    "<b>Vela is gone.</b> Her level 6 to 20 gear, scrolls, potions and Chapel Sigils are no longer sold anywhere in town. Monsters, crafters, Haldor and the auction house cover them.",
    "<b>Vendors sell nothing above level 5, except the Jeweler</b>, who sells rings and necklaces up to level 11 (there are only 4 at level 5 or lower) and shows a random 5 of those 10 each day. Other vendors may show fewer than 10 items when their trade has fewer.",
    "Spellsmiths now sell recipe scrolls (level 5 or lower) as well as spell scrolls."
  ]},
  { v: "18.47.0", date: "2026-10-16", title: "Treasure pool matches the game's windows", items: [
    "<b>The treasure pool panel now uses the same window style as the rest of the game</b>: striped blue background, light edge, a centred title bar, italic item names and rounded Lot and Pass buttons."
  ]},
  { v: "18.46.0", date: "2026-10-16", title: "Smaller saplings, apart rabbit ears", items: [
    "<b>Wandering and Strangler Saplings are about a quarter of their old size</b> and look sleepy: heavy lids and tiny pupils instead of wide staring eyes.",
    "<b>Hare ears now stay apart.</b> They used to lean in and touch at the tips; they now lean slightly outward when idle, hopping, twitching or listening."
  ]},
  { v: "18.45.0", date: "2026-10-16", title: "Auction kiosks and town services", items: [
    "<b>The auction house is now a windowed kiosk</b> with a gold sign: walk up to the Auction Counter by the auction building and press Talk. It replaces Corvin, Selene and Orla in all three towns.",
    "<b>Every town now has a Job Master and a Stablemaster.</b> Maren and Dagny teach and change jobs in Saltreach and Ironvale just like Tobin, and Fenn and Hild run the stables, riding licence, coats and saddles just like Ysolde.",
    "The Job Masters and Stablemasters in Saltreach and Ironvale stay at their posts all day and night."
  ]},
  { v: "18.44.0", date: "2026-10-16", title: "Six vendors in every town", items: [
    "<b>Every town now has six vendors:</b> an Armorer (armor), a Weaponsmith (weapons, bows and ammo), a Tradesman (gathering tools and raw materials), a Quartermaster (potions and food), a Spellsmith (scrolls) and a Jeweler (rings and necklaces). Find them in the market of Ashenreach, south of the plaza in Saltreach and beside the shop in Ironvale.",
    "Each vendor shows up to 10 items from their trade, all level 5 or lower, and the selection changes every day and from town to town. The Jeweler only has four things in his trade at that level.",
    "<b>Pell is gone.</b> His shop sign is now the Market Hall, and Hale the Tradesman gives the Outpost quests Pell used to give. Gear, scrolls and recipes above level 5 that Pell used to sell are now at Vela's in Saltreach.",
    "<b>Fixed:</b> storage at your residence let you look but not move items. You can now store and take items out again when you are in your residence."
  ]},
  { v: "18.43.0", date: "2026-10-16", title: "Auction prices match the shops", items: [
    "<b>Auction house prices are now 1.5 times the shop price</b> for the same item (they used to be a tenth of it). Prices still drift with the daily news and with how much people buy and sell.",
    "Companion lots, town buying of your listings and the suggested sell price all follow the new level, so selling spoils at auction pays far better than selling them to a shop."
  ]},
  { v: "18.42.0", date: "2026-10-16", title: "Know your foe", items: [
    "<b>The target window shows a monster's job</b> (Thief, White Mage, Paladin...) next to its name, and <b>Check</b> now says how it fights.",
    "<b>The Bestiary lists the jobs you have seen</b> each creature fighting as.",
    "<b>Packs mix their roles:</b> neighbours in a goblin, orc, Reefkin or Crag Talon pack avoid rolling the same job, so a group is more likely a fighter, a healer and a caster than three copies.",
    "<b>Balance:</b> monsters that roll Monk hit a little softer and monsters that roll Paladin are a little less sturdy, so no job outclasses the rest."
  ]},
  { v: "18.41.0", date: "2026-10-16", title: "Monster pets", items: [
    "<b>Pet jobs for monsters:</b> a beastman Summoner, Beastmaster, Puppetmaster or Geomancer now brings a little elemental pet (a Spirit, Familiar, Puppet or Luopan) that follows it around and fights with it.",
    "<b>The pet's element comes from the map:</b> earth in Rocky Hollow, caves and the jungle; water in the marsh and on the coast; ice in the snow; fire in the desert and on Cinder Peak; wind in the highlands; lightning in the Mirage; dark in crypts and the Red Spire.",
    "Hit the pet and its master joins in, and the other way round. The pet uses its element's pact as a big move and is weak to the opposite element. It fades when its master is defeated and gives no experience or drops.",
    "<b>Corsair</b> monsters now roll Valor Roll and Hawk Roll, raising their pack's attack or accuracy for 90 seconds."
  ]},
  { v: "18.40.0", date: "2026-10-16", title: "Monsters dress for their job", items: [
    "<b>You can now see a monster's job.</b> Goblins, orcs, Reefkin, Crag Talons, skeletons, ghouls and the drowned wear their job's outfit: White Mages in white robes, Black Mages in pointed hats, Red Mages in feathered caps, Warriors and Paladins in mail and plate, Samurai in red lamellar, Ninjas in dark wraps and so on, using the same styles adventurers wear. Higher-level monsters wear the better tiers.",
    "Each one carries its job's weapon: great axes, sword and shield, scythes, great katanas, katanas, spears, bows, daggers, staves and clubs. Monks and Puppetmasters fight bare-handed.",
    "Colours suit where they live: pale and frosty in the snow, swampy green in the marsh, sandy for Crag Talons, sea-dark for Reefkin and the drowned, faded on skeletons and ghouls.",
    "Orc Stonechuckers and other throwers and archers keep their own bow or rocks. Notorious monsters keep their own look. It is all cosmetic: stats and drops are unchanged."
  ]},
  { v: "18.39.0", date: "2026-10-16", title: "Monsters have jobs", items: [
    "<b>Beastmen and undead now have jobs.</b> Every goblin, orc, Reefkin, Crag Talon, skeleton, ghoul and drowned one rolls a job when it appears, and it can be any of the 22 jobs. It knows that job's spells and abilities up to its own level: healers cure their friends, Black Mages nuke, Red Mages slow and paralyze, Bards sing, Warriors go Berserk, Thieves Sneak Attack, Monks Boost and Chakra, Samurai Hasso and more.",
    "<b>Big moves are now 50/50:</b> a beastman's TP move is either its own monster move (Bomb Toss, Battle Roar, Talon Dive...) or a move from its job: a big instant spell for mage jobs, a weapon skill for fighting jobs.",
    "Jobs change toughness a little: Paladins and Rune Fencers have more HP and defence, Monks and Thieves are quicker or harder to hit, mages are softer. Overall strength, experience and drops are unchanged.",
    "<b>Removed:</b> Goblin Apprentice, Goblin Conjurer, Mire Hexer, Frost Shaman and Crag Chanter. Their places are now taken by ordinary goblins and Crag Talons, which can roll any caster job themselves. The Stone and Blizzard scrolls now drop (rarely) from Goblin Raiders and Frost Goblins. Old bestiary kills move to the ordinary entry.",
    "Online: the host's monsters share their job and readied move with everyone in the zone.",
    "Coming next: job armour and weapons on each monster, then pet jobs with elemental pets."
  ]},
  { v: "18.38.0", date: "2026-10-16", title: "Walking flower bulbs", items: [
    "<b>Wandering Saplings are no longer little tree-men.</b> They are now walking brown flower bulbs with big eyes, stubby legs, root hairs and a green sprout growing out of their heads. They waddle along, their sprout sways, and they hit you by whipping it down (Sprout Lash).",
    "<b>Strangler Saplings</b> in the jungle are the same kind of bulb, bigger, darker and thornier. Their strength, drops and where they live are unchanged. Elder Treants, Old Mossback and the Rime Treant stay as walking trees.",
    "Bestiary text and Help updated to match."
  ]},
  { v: "18.37.1", date: "2026-10-16", title: "Treasure pool fits on phones", items: [
    "<b>Fixed:</b> on phones the treasure pool (Lot / Pass) was cut off at the left edge. It now sits fully on screen above the compass, and long item names are shortened to fit.",
  ]},
  { v: "18.37.0", date: "2026-10-16", title: "Login log for the admin", items: [
    "<b>Admin → Logins:</b> a list of who logged in, when, which character they played, how long they stayed, and whether they are still in (🟢 still in) or how they left (logged out, signed out, idle, idle at character screen, timed out). Newest first, the last 30 days.",
    "<b>Server owners:</b> run the latest setup SQL (Admin → Copy setup SQL), server version 9.",
  ]},
  { v: "18.36.1", date: "2026-10-16", title: "Idle log-out on the character screen", items: [
    "<b>Character screen:</b> sitting on the character select or creation screen for 15 minutes without input now logs you out too (with the same one-minute warning), so you don't hold a server place while away.",
  ]},
  { v: "18.36.0", date: "2026-10-16", title: "Server places and the waiting line", items: [
    "<b>Unequip a pet:</b> the Pets window has an Unequip to bag button that turns the equipped pet back into its item (it needs a free bag slot). Use the item to make it your pet again. The Ash Sprite has no item form and stays with you.",
    "<b>20 players online at once.</b> When the server is full, Play Online puts you in a line that shows your place and how many are ahead. You join automatically when a place frees up, and you can leave the line at any time.",
    "<b>Reconnecting:</b> a dropped connection keeps your place for about 2 minutes. If you were gone longer you go back in line with a message saying why.",
    "<b>Idle log-out:</b> after 30 minutes without input you are logged out (with a one-minute warning) so someone waiting can play. Set 5 to 60 minutes in Config → Online.",
    "<b>Online count</b> in the Network box (👥 12/20) and in Config → Online.",
    "<b>Server owners:</b> run the latest setup SQL (Admin → Copy setup SQL), server version 8. The player limit is the max_online setting in the server's config table (0 turns the limit off). Until then there is no limit or line; the idle log-out works either way.",
  ]},
  { v: "18.35.3", date: "2026-10-16", title: "Pet items in your bag become pets", items: [
    "<b>Fixed:</b> pet items you already had in your bag (from before 18.35.1) now turn into pets when you log in, so they show in the Pets window and free their bag slot. Your first pet is equipped automatically.",
    "<b>Pets</b> is always on page 1 of the Commands menu now, even before you own a pet.",
  ]},
  { v: "18.35.2", date: "2026-10-16", title: "Pets in the Commands menu", items: [
    "<b>Pets</b> is now on page 1 of the Commands menu (after Map). It opens the Pets window, where you can summon, dismiss, choose and name your pet.",
  ]},
  { v: "18.35.1", date: "2026-10-16", title: "Pet button on command bar 1", items: [
    "<b>Pet button:</b> the Pet button now sits on command bar 1 (the first free slot) for any character that owns a pet, including characters that already had one. Press it, or type /pet, to summon or dismiss your pet.",
    "<b>Pets take no bag space:</b> a pet item now joins you the moment you get it, even with a full bag, and never sits in your bag. A pet you already have is not used a second time.",
  ]},
  { v: "18.35.0", date: "2026-10-16", title: "Online market", items: [
    "<b>Companions sell online:</b> when you play online, a companion's sell-off in town goes to the shared market under their name, visible to every player. Up to 300 companion lots per player; they never expire and are priced at each item's usual value. Items without a market value are sold to a shop as before.",
    "<b>Towns buy online:</b> every 20 minutes of real time each town buys one lot from the shared market: players' lots first, then companions', taking turns between sellers and starting with each seller's oldest lot. Only lots priced at most 1.25 times an item's usual value are bought. About a quarter go back up under the town's name at 3% more, and anyone can buy them.",
    "<b>Crystals</b> from these sales arrive in your player delivery box (My listings → With other players). Your companions' online lots show under Your companions' lots, marked 🌐.",
    "<b>Fixed:</b> buying a lot a town had relisted took the item from the town's daily stock instead of buying that lot.",
    "<b>Server owners:</b> run the latest setup SQL (Admin → Copy setup SQL), server version 7. Until then companions keep using the offline market list.",
  ]},
  { v: "18.34.3", date: "2026-10-16", title: "Thief from the start", items: [
    "<b>Thief is open from the start</b>, alongside Warrior, White Mage and Black Mage. Jobs that needed Thief level 5 can now be reached through it, and the Thief's own job-trade quest from Tobin is available straight away.",
  ]},
  { v: "18.34.2", date: "2026-10-16", title: "Hire only unlocked jobs, job achievements", items: [
    "<b>Job achievements:</b> one for every job you unlock, plus Bronze (6 jobs), Silver (12), Gold (18) and Every Trade (all jobs).",
    "<b>Brann's fighters for hire</b> now come only from jobs you have unlocked, and named companions whose job is still locked stay hidden. Companions you already hired are kept.",
  ]},
  { v: "18.34.1", date: "2026-10-16", title: "Jobs unlock as you grow (text fix)", items: [
    "Help and Updates now correctly say that Warrior, White Mage and Black Mage are the three jobs open from the start.",
  ]},
  { v: "18.34.0", date: "2026-10-16", title: "Jobs unlock as you grow", items: [
    "<b>Job unlock tree:</b> Warrior, White Mage, Black Mage and Thief start open. Every other job opens when earlier jobs reach a set level (for example, a second fighting job after Warrior level 5, the top summoning job after three mage jobs at level 10).",
    "<b>Pop-up:</b> when a level up meets a requirement, a pop-up tells you which job you can now take. Several unlocks queue up and show one after another when it is calm.",
    "<b>Hidden until unlocked:</b> Pip's job-change list at your residence and the companion lists no longer show locked jobs.",
    "<b>Ask Tobin:</b> two new questions: why jobs must be unlocked, and how you are doing, with a hint about what to train next.",
    "<b>Old job quests</b> are offered only after the job is unlocked and are now initiations that give the job's first weapon. Existing characters keep every job they had and gain any they already qualify for, with no pop-ups.",
  ]},
  { v: "18.33.0", date: "2026-10-16", title: "Companions sell at the auction house", items: [
    "<b>Companion lots:</b> when a companion with a half-full bag reaches town, their goods go up at the auction house under their name (⚔, violet) at the market price, with no fee, instead of disappearing. My lots shows them, up to 300.",
    "<b>Towns buy from the market:</b> every 20 minutes of real time each town buys one lot: yours first (only lots listed in that town and up for 20 minutes), then your companions', taking turns between sellers. Lots priced above 1.25 times the market price are left alone.",
    "<b>Crystals in the box:</b> what your companions' lots earn is not paid to you; the crystals simply fizzle away.",
    "<b>Town relistings:</b> about a quarter of what a town buys goes back up under the town's name (🏛, gold) at 3% more. These never expire.",
    "Over the 300-lot cap, extra items are sold to a shop and you get nothing for them."
  ] },
  { v: "18.32.0", date: "2026-10-16", title: "One market list", items: [
    "<b>One list:</b> the auction house Buy view now shows every seller together: 🏛 towns (in gold), 👤 players (green) and ⚔ mercenaries (violet), each under its own name. The separate Players tab is gone.",
    "<b>Filter:</b> use Show: All, Towns, Players or Mercenaries to narrow the list.",
    "Each row shows how many each kind has and the cheapest price per item. Open an item to see every seller, sorted by price, and buy from the one you like. Hover a mercenary's name to see whose it is.",
    "Town stock lines keep the quantity buttons; player and mercenary lots are bought whole."
  ] },
  { v: "18.31.0", date: "2026-10-16", title: "Every town has its own auction stock", items: [
    "<b>Per-town stock:</b> Ashenreach, Saltreach and Ironvale each stock their auction house differently each day, and each keeps its own count of what has sold out.",
    "The list shows the whole market. Open an item to see how many each town has. Buying takes from the town you are in first, then the others.",
    "Old Friends at the Mercenary Hall now keeps up to 8. When a ninth leaves, the one who left longest ago is dropped.",
    "Old sold-out counts from before this update reset once."
  ] },
  { v: "18.30.0", date: "2026-10-16", title: "Contracts and Old Friends", items: [
    "<b>Hourly contracts on play time:</b> the hiring fee covers one hour of play. The clock only runs while you play. Wages are no longer paid once a real day.",
    "<b>Payment request:</b> when the hour is up, the companion asks for the next hour once you are out of combat, done zoning and have no menus open. Pay, or refuse.",
    "<b>Wages rise with level and gear:</b> the wage follows your level and goes up with better gear they wear. They tell you when their rate goes up. The Party tab shows the time left, the next wage and a Pay now button.",
    "<b>Old Friends:</b> refuse, or be unable to pay, and the companion goes back to the Mercenary Hall. Brann's window has a new Old Friends section where you can bribe them back (full hiring fee plus 100 crystals per level). They keep their gear, bag and bond and rejoin at your level.",
    "Existing companions start a fresh one-hour contract.",
    "Fix: daily companions no longer cause an error when your bond with them grows."
  ] },
  { v: "18.29.0", date: "2026-10-16", title: "Companion sheet and shop", items: [
    "<b>Companion sheet:</b> click a companion in the party box (bottom right) or press Sheet in the Social menu to see what they wear, what they have for sale, the gear they are keeping, and their bag.",
    "<b>Pouch:</b> a 👝 appears by a companion's name in the party box whenever they have something for sale.",
    "<b>Buying:</b> items a companion has for sale cost 1.5 times the auction house value. Press Buy on the sheet to pay and take one.",
    "<b>Wear this:</b> give a companion a piece of gear from your bag. If it is better than what they wear they put it on and keep the old piece to sell. If it is not better they say so and you keep it.",
    "Companions are now only offered gear they can wear at your level."
  ] },
  { v: "18.28.0", date: "2026-10-16", title: "Companions sync to your level", items: [
    "<b>Hired at your level:</b> a companion's hiring fee now follows your current level, and they join at that level.",
    "<b>Wayfinding:</b> district signposts list the shops in each district, gate guards answer \"Where can I find...?\" and mark the shop on your map, shops show icons on the minimap, and the city map has a You are here dot. The first visit to a city names its districts.",
    "<b>Monster jobs:</b> a monster with a job carries it in its name, such as Goblin White Mage.",
    "<b>Level sync:</b> when you level up, level down or change jobs, companions sync to your new level. Gear they can no longer wear is put away in their bag as a kept item and goes back on when your level allows. Kept items are never sold.",
    "<b>Plain starting gear:</b> companions start in plain shop gear for their level, never +1 or named pieces.",
    "<b>Bestiary:</b> only creatures you have defeated are recorded. Entries for creatures you had only seen have been removed.",
    "Fix: a companion's town sell-off no longer sells gear they have put away."
  ] },
  { v: "18.27.0", date: "2026-10-16", title: "Everything goes to the treasure pool", items: [
    "<b>All drops are rolled for:</b> with anyone else in your party, every item a monster drops (materials, potions, scrolls and gear) goes into the treasure pool instead of straight into your bag. Crystals are still split and key items still go straight to you.",
    "<b>Companions roll on everything:</b> they lot on any item, except gear they can't wear. If they win, the item goes into their own bag. Better gear for their job is worn at once and the old piece goes into their bag; anything else they keep to sell.",
    "<b>Companion bags:</b> each companion has a normal 30-slot bag. With a full bag they pass on every roll. When you enter a town and a companion's bag is half full or more, they sell all the items they carry and the items are gone. Their old gear no longer comes back to your bag.",
    "The Social menu shows each companion's bag."
  ] },
  { v: "18.26.0", date: "2026-10-16", title: "Load timings in Config", items: [
    "<b>Load timings:</b> Config > Interface has a new Load timings button that shows how long start-up and your recent zone loads took, step by step. The same list is available with /perf.",
    "Behind the scenes, every release is now checked against a file-size limit and a start-up time limit, so downloads and loading can't quietly get slower."
  ] },
  { v: "18.25.0", date: "2026-10-16", title: "Natural zone exits", items: [
    "<b>No more floating rocks:</b> boulders, small rocks, cliff chunks and cave spikes now sit on the lowest point under them, so ones on a slope are buried on the high side instead of hanging over the low side.",
    "<b>Softer, winding exits:</b> the hall leading to a zone exit now bends gently, varies in width and has sloped, uneven sides instead of two straight cut walls.",
    "<b>Distant view through exits:</b> at the end of an outside exit you now see layered hills tinted like the zone you are heading to, fading into the haze, instead of a flat white band."
  ] },
  { v: "18.24.0", date: "2026-10-16", title: "Walking between zones", items: [
    "<b>No more snap when you reach a zone edge:</b> your character keeps walking out of the zone on their own while the screen fades to the loading screen, so the game no longer stops dead the moment you touch the exit.",
    "<b>Walking in:</b> after the loading screen, the new zone fades in with your character walking a few steps in from the edge, then control comes back to you. Companions arrive behind you.",
    "The next zone's saved ground picture is fetched during the walk, so return trips load a little sooner. Doors, warp stones, ferries and exits that ask first keep the old quick fade."
  ] },
  { v: "18.23.0", date: "2026-10-16", title: "Return visits load faster", items: [
    "<b>Saved textures:</b> after a zone's ground is painted once, the picture is kept in your browser. Coming back to that zone (or reloading the game) skips the painting step, which was the slowest part of building a zone.",
    "<b>Saved item icons:</b> the item icon sheet is kept the same way, so after the first start the icons are ready almost instantly.",
    "Saved pictures belong to one game version and are thrown away automatically when the game updates. Up to 24 zones are kept, oldest dropped first. Type <b>/clearcache</b> to remove them by hand."
  ] },
  { v: "18.22.0", date: "2026-10-16", title: "Faster start-up", items: [
    "<b>Faster start-up:</b> the title screen now appears about 3 seconds sooner on a slow test setup (1.7 s instead of 4.8 s). Item icons are drawn in the background while you read the title, then finished before you enter the world.",
    "<b>Smoother zone loading:</b> zone textures are sent to the graphics card in small slices while the loading screen animates, instead of all at once on the first frame. Gains depend on your device."
  ] },
  { v: "18.21.0", date: "2026-10-16", title: "Smaller download and load timing", items: [
    "<b>Smaller download:</b> the game code is now compacted and the 3D library only includes the parts the game uses, cutting the file by about 9% (6.39 MB to 5.83 MB). Sound is unchanged.",
    "<b>Faster start:</b> the online-account library is only unpacked when you open Play Online or offline sign-in, so the title screen appears sooner.",
    "<b>Load timing:</b> type <b>/perf</b> to see how long the game took to start and to load your recent zones, step by step. It is meant for finding slow spots and for bug reports."
  ] },
  { v: "18.20.0", date: "2026-10-16", title: "Sprint, victory fanfare and a living sky", items: [
    "<b>Sprint:</b> hold Shift while moving to run about 45% faster on foot.",
    "<b>Victory fanfare:</b> winning a battle plays a short triumphant brass fanfare once the last monster that was fighting you falls. Monsters too weak to give experience stay quiet.",
    "<b>Sun and moon:</b> a visible sun disc and a bigger moon now travel across the sky with the game clock, with the sun reddening near the horizon and the moon rising after sunset and setting at dawn. The moon is no longer parked at the horizon in daytime.",
    "<b>Status icons:</b> click or tap a status icon at the top left to see its name and time left.",
    "<b>City Blessing and meals now count down on play time.</b> Logging out pauses them, so a blessing no longer runs out while you are away. Existing blessings and meals convert to the time they had left.",
    "<b>Menus:</b> arrow keys now move the highlight in the auction house and every other window with selectable rows, and Enter picks the highlighted row.",
    "<b>Companions arrive farther from you</b> when you enter a new area, so they no longer crowd or bump you as you load in.",
    "<b>Rocks block movement:</b> every rock and large cave spike now has a body, so you and your companions can no longer walk through them.",
    "<b>Bees:</b> the eyes are now rounded and sit in the head with a small highlight, instead of floating off its sides.",
    "<b>Deer, dogs and cats:</b> slimmer, deeper-chested bodies instead of round barrels, with shoulder and haunch muscle and thinner lower legs that bend more naturally.",
    "<b>Pipkin:</b> take shorter, calmer leg steps when walking."
  ] },
  { v: "18.19.13", date: "2026-10-16", title: "Rods and gathering tools", items: [
    "<b>Fishing rod:</b> a long rod appears in your hands while you fish, with a line and a red-and-white float. The float bobs while you wait, dips and jitters when a fish bites, and is pulled back to you as you reel.",
    "<b>Gathering tools:</b> your pickaxe, hatchet or sickle appears in your hand for each swing, then vanishes. Your own weapon is hidden while a tool is in hand.",
    "Tools scale with your race's body size, like weapons."
  ] },
  { v: "18.19.12", date: "2026-10-16", title: "Caterpillar legs and new hares", items: [
    "<b>Crawler legs</b> now move one pair at a time in a wave from head to tail, each lifting, reaching and planting in turn, with the body rippling to match.",
    "<b>Hares rebuilt:</b> no front legs, a round body standing upright on big hind feet, long two-part ears and a puff tail. They hop to move, sway and twitch their ears while idle, spring forward to attack and flop over when defeated.",
    "Meadow, marsh and snow hares, and the hare buddy, all use the new look. Toads keep their old model."
  ] },
  { v: "18.19.11", date: "2026-10-16", title: "Monster moves", items: [
    "<b>Aggro alert:</b> when a monster notices you it rears up, flares its arms or wings, or raises its head with a short shake before it attacks.",
    "<b>Pounces and lunges:</b> four-legged beasts crouch, leap and snap; crawlers surge forward as they bite.",
    "<b>Birds</b> now peck, flinch when hit and tumble when defeated.",
    "<b>Undead fight stiffly:</b> skeletons and other undead swing in jerky, stepped motions."
  ] },
  { v: "18.19.10", date: "2026-10-16", title: "Falls, emotes and work poses", items: [
    "<b>Knock-outs play out in stages:</b> you stagger, drop to your knees, then topple backward, forward or sideways. Getting raised now pushes up from the ground the way you fell.",
    "<b>Six new emotes:</b> /shrug, /think, /beckon, /stretch, /kneel and /flex. Others nearby see them too.",
    "<b>Work poses:</b> fishing has a cast swing, a patient hold, a jerk on a bite and a cranking reel; crafting hunches over the work with tapping hands; mining and logging swing overhead and harvesting crouches to pull."
  ] },
  { v: "18.19.9", date: "2026-10-16", title: "Movement and idle", items: [
    "<b>Locked-on movement:</b> while you're auto-attacking, you keep facing your target as you move. Moving sideways sidesteps with your hips turned into the step, and moving away back-pedals with your legs stepping backward.",
    "<b>Race gaits:</b> Pipkin bounce with quick, swinging arms; Ursan sway side to side with a heavy lean; Elari glide with less bob; Nekari run low and springy.",
    "<b>Sheathed weapons bounce</b> gently on your back as you run.",
    "<b>Two new idle moves:</b> brushing off a shoulder and scuffing the ground with a boot."
  ] },
  { v: "18.19.8", date: "2026-10-16", title: "Spell release and ability poses", items: [
    "<b>Spell release flourish for each school:</b> elemental and debuff spells snap forward, healing and support spells sweep arms outward, summons slam down, dark magic draws back, and songs end with a bow-arm flick.",
    "<b>Interrupted casts flinch:</b> if a cast is broken you recoil with a shake instead of just dropping your arms.",
    "<b>Job abilities have their own poses:</b> shouts (Provoke, Warcry, Feral Howl) throw the head back with arms wide; Steal and Shield Bash lunge; Sneak Attack, Smoke Step and Flee crouch low; Meditate, Chakra, Focus and similar calm abilities bring the hands together; Jump leaps; rolls flick the dice arm; dances spin; shots aim a bow; other self-buffs pull your fists in."
  ] },
  { v: "18.19.7", date: "2026-10-16", title: "Weapon skill moves", items: [
    "<b>Weapon skills now match your weapon:</b> staves raise overhead and slam down, or swing three times; daggers lunge in quick flurries; polearms drive forward in thrusts; bows draw and loose; fists throw jabs, a haymaker or a spinning kick.",
    "<b>Tiers still scale the move:</b> low-level skills are a single heavy blow, mid-level skills chain blows, high-level skills spin, and the top skills leap."
  ] },
  { v: "18.19.6", date: "2026-10-16", title: "Weapon swing sets", items: [
    "<b>Every weapon now swings its own way:</b> daggers jab fast with a short lunge, axes raise overhead and chop down, bows draw the string back and release, polearms thrust or sweep wide, and fists alternate jabs with a kick.",
    "<b>Swings have a full rhythm:</b> wind-up, strike, follow-through and a recovery back to your guard before the next swing.",
    "<b>Fight settle:</b> drawing into a fight now drops you into a slight crouch before you square up."
  ] },
  { v: "18.19.5", date: "2026-10-16", title: "Staff combat loop", items: [
    "<b>Staff guard stance:</b> in a fight you now hold the staff across your body in both hands, low hand at the hip, high hand at the chest, head angled up over your shoulder.",
    "<b>Full staff swing:</b> twist away and raise the staff behind your shoulder (wind-up), pivot the hips and bring it down in a wide arc, connect at chest height in front of you, follow through, then pull it back to the guard stance before the next swing.",
    "<b>Pipkin faces:</b> rounder cheeks with a small, soft chin and a shorter lower face."
  ] },
  { v: "18.19.4", date: "2026-10-16", title: "Weapon draw animation", items: [
    "<b>Drawing and sheathing are animated:</b> you reach for your weapon and pull it free (about a third of a second), and put it away the same way (about half a second). Attacking mid-draw finishes the draw at once.",
    "<b>Weapons fit the wielder:</b> small races such as Pipkin now carry smaller weapons, and large races such as Ursan carry slightly bigger ones.",
    "<b>Pipkin chins trimmed:</b> narrower, shorter jaw and no chin bulge.",
    "<b>Pointed hats sit lower</b> and have a fuller lining, so no skin shows between the hat and the head."
  ] },
  { v: "18.19.3", date: "2026-10-16", title: "Staff swing, hat fit", items: [
    "<b>Staff attacks are now a two-handed swing:</b> you raise the staff to your upper right, then bring it down across the front of you instead of poking with it. Polearms still thrust.",
    "<b>Pointed hats fit snugly:</b> a cloth lining now fills the gap that showed skin between the hat and your head.",
    "<b>Sheathed staves clear your hat:</b> a staff on your back now rests low and slanted, so it no longer pokes through a pointed hat."
  ] },
  { v: "18.19.2", date: "2026-10-16", title: "Two-handed staves, monster eyes", items: [
    "<b>Staves are held in both hands</b> in a fight and when you thrust: your left hand now grips the shaft beside your right.",
    "<b>Monster eyes:</b> goblins, orcs, reef folk, bird folk and other humanoid monsters now have two real eyes (white, a glowing coloured iris and a pupil). Before, only one glowing spot showed. Skeletons keep their glowing sockets and ghouls keep their glowing eyes, now on both sides."
  ] },
  { v: "18.19.1", date: "2026-10-16", title: "Weapons face forward", items: [
    "<b>Combat animation fix:</b> swords, axes and clubs now point forward at the enemy through the whole swing instead of pointing up and back, and staves and polearms are held with the tip leading instead of trailing behind you.",
    "The wind-up before each swing is smaller, so the weapon stays out in front of you."
  ] },
  { v: "18.19.0", date: "2026-10-16", title: "Cleaner status, forward swings", items: [
    "<b>Status:</b> the Profile page no longer has an Adventure section. It now shows race, home point, guild rank and guild points.",
    "<b>Phones:</b> when you choose an item, its choices (Use, Equip, Drop and so on) now appear below the item card instead of covering it, so you can read the item's details while you decide.",
    "<b>Combat animation:</b> characters now hold their weapon out in front of them in a fight and swing it across toward the enemy, instead of raising it overhead. One-handed weapons, two-handed weapons, clubs and staves all use the new forward stance.",
    "<b>Text cleanup:</b> Help and Updates no longer mention other games by name."
  ] },
  { v: "18.18.0", date: "2026-10-15", title: "Recipe scrolls", items: [
    "<b>Crafting recipes are now learned from Recipe scrolls</b>, like spell scrolls. Read one (Use from Items) to learn it. You start knowing only the basic materials: Bronze Ingot, Ash Lumber, Silk Cloth, Potion and Grilled Minnow. Crafting and the recipe book only show recipes you know.",
    "<b>Common recipe scrolls are sold in shops</b> (Pell for level 10 and under, Vela after that): early gear, furniture, potions, ethers and cooking.",
    "<b>+1 recipes are rare.</b> The recipes for gear that can come out as the +1 version drop rarely from monsters of about the right level (more often from notorious monsters and bosses) or come as quest rewards.",
    "Characters that already crafted keep the recipes their craft skill could make.",
    "Items are sorted automatically and the Sort button is gone. Tapping an item no longer asks to drop it; use the Drop button at the top. Choices now appear at the bottom of the screen on phones.",
    "<b>Animation:</b> the head-scratch idle no longer pushes the hand through the head, and sheathed staves, polearms and swords sit farther from the back so they clip less through robes and capes."
  ] },
  { v: "18.17.0", date: "2026-10-15", title: "Game guide", items: [
    "<b>Help is now the Guide.</b> The Guide command (second page of the main menu, or H) opens a guide split into six topics: All functions, Getting started, Combat and jobs, The world, Crafting and economy, and Social and records.",
    "<b>All functions</b> lists every command in the main menu with its key and what it does, the Status sub-menu, and every chat command, always matching the game as it is.",
    "The Help button is gone from Config, and Help no longer fails to open (a typo in the World section broke it).",
    "<b>Items, Magic, Abilities, Quests and View House are now as wide as their text</b> and have a ✕ Close button. Closing one leaves the command menu open.",
    "<b>The Time box leaves the command menu open.</b>",
    "<b>Key Items is a tab inside Items</b> (Items / Key Items) and is gone from the command menu.",
    "<b>Trade is gone from the command menu.</b> Target another player and choose Trade from their menu.",
    "<b>The Achievements window is as wide as its text</b>, and Stats has many more rows: job levels, craft and gather skills, most defeated creature, notorious monsters beaten, quests in progress, bag and storage use, guild points and distance walked (walking counts from this version).",
    "<b>Database entries no longer spill out of their boxes on phones.</b>",
    "<b>The Equipment window fits a phone screen</b> without scrolling sideways or up and down."
  ] },
  { v: "18.16.1", date: "2026-10-15", title: "Database mobile fit", items: [
    "<b>Equipment entries in the Database no longer spill out of their box on phones.</b> Long job lists now wrap, and the doubled name and frame are gone."
  ] },
  { v: "18.16.0", date: "2026-10-15", title: "Database, stats and Social button", items: [
    "<b>New Database (Y)</b> replaces the Bestiary button. Tabs for Items, Equipment, Magic, Abilities, Jobs, People, Places and the Bestiary, each with details and a picture. It only lists what you have owned, learned, leveled, talked to, visited or met.",
    "<b>Achievements has a Stats tab</b> with your play time, fights, damage, spells, crafting, gathering, fishing, trading and travel counts. Damage, spells, abilities and items used start counting from this version.",
    "<b>One Social button</b> on the first command page replaces Party, Search, Linkshell and Friend List, which all opened the same window. Party is still on P and in the window tabs.",
    "<b>HP and MP numbers no longer overlap</b> in the party panel at the bottom right."
  ] },
  { v: "18.15.0", date: "2026-10-15", title: "Ctrl hotkey line removed", items: [
    "<b>The Ctrl hotkey line is gone</b>, since browsers keep Ctrl+number for switching tabs. The old Ctrl line is now the <b>Main</b> line: plain 1–9 and 0 fire it, and your saved slots are kept.",
    "Shift, Alt and Tab still hold their own lines of ten. The pinned bar label reads Main, Shft, Alt or Tab."
  ] },
  { v: "18.14.0", date: "2026-10-15", title: "Pricier shops, no camp crystals", items: [
    "<b>Empty hotkey slots do nothing</b> instead of opening the Hotkeys window. If Ctrl+number does nothing, your browser is keeping it for tab switching: turn on Fullscreen (free keys) in Config > Interface, or use plain 1–0 or Alt+1–0.",
    "<b>Everything in the shops costs 10 times as much.</b> Selling prices, mercenary fees, the stable and the Auction House are unchanged.",
    "<b>Camp crystals are gone.</b> Crystals stand only in towns now, so warping and healing by crystal happen there. Camps keep their tent and fire as scenery."
  ] },
  { v: "18.13.0", date: "2026-10-15", title: "Hotkey bar close button", items: [
    "<b>The hotkey bar has a ✕ button.</b> It hides every hotkey on the bar; pick which ones come back in Hotkeys (B) with Show on HUD.",
    "<b>The bar only appears when at least one hotkey is set to show on it.</b> With none shown, there is no empty box, and the ▲ ▼ buttons skip lines with nothing to show.",
    "<b>Browser shortcuts no longer steal your hotkeys:</b> Ctrl, Alt and Cmd + number are blocked from switching browser tabs while the game is open, and Ctrl+letter combinations no longer trigger game keys. Some browsers still reserve a few of these. Config > Interface > <i>Fullscreen (free keys)</i> (or <i>Fullscreen on start</i>) asks the browser (Chrome and Edge) to pass every shortcut to the game."
  ] },
  { v: "18.12.0", date: "2026-10-15", title: "Tab fix, hotkey bar styling and level gates", items: [
    "<b>Tab now targets the nearest thing first.</b> Walk up to a warp stone, signpost, crystal or person and press Tab to target it. In the field, monsters within range and objects within arm's reach are cycled together by distance.",
    "<b>The hotkey bar looks like the other blue windows</b> and can be moved: drag the ⠿ grip at its left edge (double-click it to put it back). Its position is remembered when you reload.",
    "<b>Choose what shows on the bar:</b> in Hotkeys, select a slot and press Hide from HUD or Show on HUD. Hidden slots still work with their keys.",
    "<b>The equipment window no longer needs a scrollbar:</b> the list of gear that fits a slot and the item cards sit side by side.",
    "<b>Support jobs now unlock at level 10</b> (Tobin's quest A Second Calling) and <b>the Riding License at level 20</b> (Ysolde). Characters that already have them keep them.",
    "<b>Humanoid monsters (goblins, orcs, Reefkin, Crag birdfolk and their casters) now drop only a few crystals</b> each, 1 to 2 per level."
  ] },
  { v: "18.11.0", date: "2026-10-15", title: "Smaller daily Auction House stock", items: [
    "<b>The market now lists only a daily random selection:</b> 10 kinds of consumables, 5 kinds of ammo, 3 spell scrolls, 10 kinds of food, 10 kinds of materials and the 10 pieces of +1 equipment.",
    "<b>Nothing is listed more than one level above yours</b>, so the market always matches where you are. The selection changes every game day (and when you level up)."
  ] },
  { v: "18.10.0", date: "2026-10-15", title: "Auction House: daily gear and item cards", items: [
    "<b>The market now sells only 10 pieces of equipment a day</b>, picked at random, and every one is a +1 piece (or better). One of each is on offer, and the list changes every game day. Materials and consumables are unchanged.",
    "<b>Point at or pick anything in the Auction House</b> and its item card appears beside the window, the same card you get from your inventory.",
    "The Auction House window is now only as wide as its text."
  ] },
  { v: "18.9.0", date: "2026-10-15", title: "Crystals on every shop window", items: [
    "The balance box now reads <b>Crystals</b> with the number on the same line, instead of two lines headed Current Crystals.",
    "It shows below every window where you can pay crystals: shops, the Auction House, the Forge, furnishings, the stable, mercenaries, the guild, your residence, job change, crafting, the Trade Board and storage."
  ] },
  { v: "18.8.0", date: "2026-10-15", title: "Separate mouse and keyboard camera inversion", items: [
    "<b>Camera inversion is now set separately for the mouse and the keyboard</b> (Config > Camera): Mouse invert horizontal and vertical, and Keyboard invert horizontal and vertical (arrow keys, Q and E).",
    "Your existing mouse settings are kept. Keyboard inversion starts off."
  ] },
  { v: "18.7.0", date: "2026-10-15", title: "Pinned hotkey bar", items: [
    "<b>Your hotkeys are pinned to the screen</b>, centered above the event log. Tap a slot to use it, or press its number.",
    "The ▲ ▼ buttons beside the bar (and [ and ]) switch between the Ctrl, Shift, Alt and Tab lines; the label shows which line you are viewing. Plain 1–0 fire the line shown.",
    "Turn the bar off or on under Config > Interface > Pinned hotkeys. Place actions in Hotkeys (B)."
  ] },
  { v: "18.6.0", date: "2026-10-15", title: "Four hotkey lines", items: [
    "<b>Hotkeys now have four lines of ten:</b> Ctrl, Shift, Alt and Tab. Hold the key and press 1–9 or 0. Set each line in Hotkeys. Plain 1–0 still use the Ctrl line.",
    "Hold Tab and press a number for the Tab line. Shift+Tab cycles nearby objects.",
    "New slots from learning actions fill all four lines in order."
  ] },
  { v: "18.5.1", date: "2026-10-15", title: "Chasing monsters and object targeting", items: [
    "<b>Monsters now chase you until you leave the zone.</b> They no longer give up after a set distance from home; they only stop when you zone, defeat them, or are defeated.",
    "<b>Shift+Tab</b> cycles nearby objects (signposts, warp stones, crystals, shrines and tablets), even when monsters are close. Plain Tab still targets monsters first.",
    "Plain 1–0 fire the Ctrl line, because browsers often keep Ctrl+number for switching tabs."
  ] },
  { v: "18.5.0", date: "2026-10-15", title: "Crafting gear", items: [
    "<b>128 new recipes:</b> every shop item that has a +1 version can now be crafted, and a good synthesis can come out as the +1. Smithing makes metal weapons and armor, Woodworking makes bows, staves, clubs, wands, shields and clogs, Clothcraft makes cloth and leather pieces, and Alchemy makes bone gear.",
    "Recipes use the materials you already gather and loot: Bronze and Iron Ingots, Ash Lumber, Silk Cloth, Worm Silk, Lizard Skin, Bone Chips, and Heartwood, Wool Tufts or Crab Shells from level 10. The recipe level is the item's level.",
    "The crafting window now lists exact matches first and shows up to 30 recipes for the ingredients you put in.",
    "Checked: every job can find shop gear for its weapon, head, body, hands, legs and feet from level 1, so nobody is stuck without a piece."
  ] },
  { v: "18.4.0", date: "2026-10-15", title: "Economy", items: [
    "<b>Gear is cheaper:</b> shop prices follow a gentler curve (a level 10 piece costs about 40% of what it did, level 20 about 35%). Neck, ear, ring, back and waist pieces cost less than armor. A full level-appropriate set now takes about 1 to 6 hours of hunting instead of up to dozens.",
    "<b>Every monster drops crystals:</b> anything that still gives you XP drops 2 to 4 crystals per level of the monster. Beastmen keep their bigger purses.",
    "<b>Shop fix:</b> Royal and Legionnaire gear (Ryl. and Lgn.) were wrongly sold in shops; they now come from monsters like the other set pieces.",
    "Sell prices are still a quarter of the shop price, so gear and drops sell for less than before. XP needed per level is unchanged (about 13 hours of solo hunting to reach 20)."
  ] },
  { v: "18.3.0", date: "2026-10-15", title: "Monster balance", items: [
    "<b>Monsters retuned for the new gear:</b> from level 5 up, monsters have less HP (down to 74% at level 20) and hit a little softer (down to 85%). Level 1 to 4 monsters are unchanged.",
    "<b>What to expect alone:</b> Easy Prey is almost always a safe kill, an Even Match is about half and half, and Tough monsters need companions. Before this, even fights from level 10 up were nearly always lost solo.",
    "Notorious monsters, bosses, Elementals and goblin casters get the same scaling, so they stay just as hard compared to normal monsters of their level.",
    "Prices, XP and drop rates come next."
  ] },
  { v: "18.2.0", date: "2026-10-15", title: "Gear balance: player power", items: [
    "<b>Weapons retuned:</b> two-handed weapons swing faster (a Great Axe now swings every 4.1 s instead of 5.2 s) and each weapon type's damage was matched to how strong it was before the new gear arrived. Daggers, katanas, swords and hand-to-hand hit harder; scythes a little softer. Higher-level weapons gain a little extra damage.",
    "<b>More HP and MP:</b> every character gains 3 HP per level, and MP from your jobs is 35% higher. This replaces the HP and MP the old invented gear used to give.",
    "<b>Rangers toned down:</b> arrows and bolts now add half their damage to your bow (they added all of it).",
    "<b>Samurai and Rune Fencer quests</b> now also give a weapon you can use at level 1 (a Harpoon and a Bronze Sword), since the Tachi and Claymore need levels 8 and 10. Blue Mage, Corsair, Dancer, Scholar, Bard and Summoner quests give level 1 gear.",
    "Monster strength, prices and drop rates come next."
  ] },
  { v: "18.0.0", date: "2026-10-15", title: "New equipment", items: [
    "<b>All gear was replaced:</b> 788 weapons and armor from level 1 to 20 with set names, levels, jobs and slots (Bronze Dagger, Brass Harness, Hunter's Longbow, Warrior's Belt and more). Every older invented piece is gone, and characters from before this update could not be kept.",
    "<b>Left out on purpose:</b> costumes, event outfits (Yukata, Decennial and summer sets), crafting-guild uniforms, fishing gear and novelty pieces. The Warp Ring is kept: use it from your bag to return to your home point.",
    "<b>Range and Ammo are real now:</b> a bow or crossbow in the Range slot makes your attacks ranged shots, and the arrow or bolt in Ammo adds its damage. Flutes, harps and boomerangs sit in the same slot.",
    "<b>Where to get it:</b> Pell sells plain gear to level 10 and Vela levels 11 to 20. Haldor sells +1 gear from level 14. Monsters occasionally drop gear near their own level, and bosses and notorious monsters keep their rare pieces.",
    "<b>Companions dress themselves</b> from the new gear by job and level, so every job gets a sensible weapon, armor and shield.",
    "<b>Still to come:</b> damage, defense, prices and monster strength have not been rebalanced for the new gear yet. Stats the game does not have (haste, enmity, skill bonuses) are left out for now."
  ] },
  { v: "17.3.0", date: "2026-10-15", title: "Area spells, En-spells and songs", items: [
    "<b>Area spells:</b> Curaga (WHM 16), Banishga (WHM 15), Diaga (WHM 18, RDM 15), Stonega (BLM 15) and Waterga (BLM 19) hit or heal everything near the target. Hired healers cast Curaga when two or more allies are hurt.",
    "<b>Spikes and En-spells:</b> Blaze Spikes (BLM 10, RDM 20) and Ice Spikes (BLM 20) damage anything that hits you in melee (Ice Spikes can paralyze it). Enthunder (RDM 16), Enstone (18) and Enaero (20) add elemental damage to your own hits.",
    "<b>Damage over time:</b> Shock (BLM 16), Rasp (18, lowers accuracy) and Choke (20, lowers defense) replace one another. Foe Requiem (BRD 7) and II (17) tick on a monster.",
    "<b>New Bard songs:</b> Herb Pastoral (9) resists Poison, Scop's Operetta (19) resists Silence, Sheepfoe Mambo (13) raises evasion, and six Threnodies (Light 10, Dark 12, Earth 14, Water 16, Wind 18, Fire 20) make a monster take 25% more of that element. A person still holds two songs at a time.",
    "<b>Fixes:</b> hired healers now pick the Cure that fits the wound (they always chose the biggest), and hired Bards use Foe Lullaby and the new songs."
  ] },
  { v: "17.2.0", date: "2026-10-15", title: "Elementals and goblin spellcasters", items: [
    "<b>Summoners now start with Carbuncle.</b> The eight Spirits (Fire, Ice, Air, Earth, Thunder, Water, Light, Dark) are no longer sold. Each one's scroll drops from a rare Elemental (about a 30% drop): Fire Elemental at Cinder Peak, Ice Elemental in Frostspire Pass (night), Earth Elemental in Underdeep River, Air Elemental in the Sunscar Desert, Thunder Elemental in the Verdant Jungle (day), Water Elemental on Gull Isle, Light Elemental on the Windreach Highlands (day) and Dark Elemental in the Sunken Crypt (night). Check Notorious Monsters in the Help for hints.",
    "<b>Goblin spellcasters:</b> Goblin Apprentice (Rocky Hollow), Goblin Conjurer (Goblin Den), Mire Hexer (Ashen Marsh) and Frost Shaman (Frostspire Pass). They stand back and cast Stone, Water, Blizzard, Poison, Slow, Paralyze, Blind, Silence and Cure, can be interrupted by hits, and the healers mend their friends.",
    "<b>Silence</b> (White Mage 15, Red Mage 18, 120 s) now has a use: a silenced monster cannot cast. Hired healers use it on spellcasters."
  ] },
  { v: "17.1.0", date: "2026-10-15", title: "Status magic", items: [
    "<b>New support spells (levels 20 and under):</b> Poisona (WHM 6), Paralyna (9), Blindna (14), Silena (19); Protectra (7) and Shellra (17) for the whole party; Aquaveil (WHM 10, RDM 12), Blink (19), Deodorize (15) and Sneak (20); Warp (BLM 17).",
    "<b>Bar spells:</b> Barstone, Barwater, Baraero and Barfire cut damage of their element; Barsleep, Barpoison, Barparalyze and Barblind halve the chance of that status. White Mages cast the party versions (Barstonra and so on), Red Mages the single-target ones. Scrolls are in the shops.",
    "<b>Monsters now inflict statuses:</b> Honey Bees and Shroomlings poison, Bog Toads paralyze, worms blind, and the Crag Chanter and Tidebound Priest silence. Silence stops you casting.",
    "Hired White Mages now cure these statuses and keep Protect and Shell up on the party during a fight. Fixed Dark Knights re-casting Bio."
  ] },
  { v: "17.0.0", date: "2026-10-15", title: "New spells and potions", items: [
    "<b>Spells and potions were rebuilt.</b> Names, levels, MP costs, cast and recast times and effects were all reworked. Cure, Cure II, Dia, Banish, Protect, Shell, Slow, Paralyze, Stone, Water, Aero, Fire, Blizzard, Poison, Bio, Drain, Aspir, Blind, Bind and Sleep replace the old list. Spells with no new match (Thunder, Flash, Stun, Blight, Raise and the rest) are gone.",
    "<b>Real formulas:</b> Cure heals by MND, VIT and Healing skill; nukes scale with the gap between your magic stat and the monster's; Dia and Bio are damage over time and replace each other; Drain and Aspir steal HP and MP; Poison ticks; Shell cuts elemental damage by 11%; Slow, Paralyze and Blind are stronger the more your stat beats the target's.",
    "<b>Bard songs</b> are now Knight's Minne, Valor Minuet, Army's Paeon (I and II), Sword Madrigal and Foe Lullaby, cost no MP and use a song-power formula based on your singing skill. <b>Summoners</b> call the eight Spirits (Fire, Ice, Air, Earth, Thunder, Water, Light, Dark).",
    "<b>Potions:</b> Potion, Hi-Potion, X-Potion and Max Potion; Ether, Hi-Ether, Super Ether and Pro-Ether (each in three stronger +1 to +3 grades); Elixir and Hi-Elixir restore HP and MP together. Reraiser, Hi-Reraiser and Super Reraiser give a one-hour Reraise. Phoenix Down and Ember Plume are removed.",
    "<b>New characters</b> start knowing their main job's level 1 spells: Black Mage starts with Stone, White Mage with Cure, Red Mage with Dia, and so on.",
    "<b>Old saves are not compatible.</b> A character from before this version is deleted when the game finds it, and you are asked to create a new one. Online characters are cleared the same way."
  ] },
  { v: "16.24.0", date: "2026-10-15", title: "Rest in combat", items: [
    "You can now /rest while monsters are fighting your party, even when one has you on its list. Resting disengages you first. If an enemy hits you while you sit, you stand up and stop resting.",
    "Resting heals at the normal sitting rate during a fight. Mercenaries use the same rule, so a hurt one that is hit while sitting stands and moves away again."
  ] },
  { v: "16.23.0", date: "2026-10-15", title: "Resting mercenaries", items: [
    "A mercenary at 75% health or less now sits down and /rests on their own once the fighting is over and you stand still, until HP and MP are full. They stand up and follow as soon as you move or something attacks.",
    "Resting during a fight works now: a mercenary below 25% health who isn't the only one a monster is hunting drops off its target list at once, steps clear of the fight and sits. If the monster is chasing only them, they run a shorter way (about 300 steps instead of 420) before sitting."
  ] },
  { v: "16.22.0", date: "2026-10-15", title: "Admin session info", items: [
    "Config → More → Admin now opens with a This session block: ping, last save, unsaved changes, packets sent and received, players online, players in your zone, who hosts the shared monsters, current zone and game version.",
    "Below it a new list shows every player online right now with job, level, zone, party search and linkshell. Server totals, suspicious saves, bans and recent characters are still underneath."
  ] },
  { v: "16.21.0", date: "2026-10-15", title: "Mercenaries know when to run", items: [
    "Hired mercenaries now back off when hurt. At half health or less they run to a safe distance (about 200 steps from the enemies) and keep fighting from range with spells or bows. Fighters with no ranged attack stay back and use their abilities, and tanks stop pulling aggro until they recover. They go back to normal above 70% health.",
    "Below 25% health a mercenary runs clear of the fight, drops out of the monsters' attention and sits down to /rest until HP and MP are full. If they are chased they keep running first; a monster that is too far away loses interest in them. On Hold stance they rest in place instead of running.",
    "Casters and ranged jobs now use nearly all of their MP (down to about 4%) in quick succession and stay at range instead of running in to melee between spells. They only swing a weapon when almost out of MP.",
    "Healers now heal the party member with the lowest health first, up to 75% for a healer, and pick the smallest cure that covers the damage (using Cure III and IV when they know them). Mercenaries who are running away can still heal and cast from where they stand."
  ] },
  { v: "16.20.0", date: "2026-10-15", title: "Waiting", items: [
    "Current Time in the main menu is now Time. It opens a box with the clock and two choices: Current time (writes the time to the log as before) or Wait.",
    "Wait: pick 1 to 24 hours. In a town, with no other adventurer online, the clock ticks forward one game hour every 5 seconds until it reaches that time; Stop ends it early. Outside a town it says enemies are near, and with other players online it explains that time can't be sped up."
  ] },
  { v: "16.19.0", date: "2026-10-15", title: "One look", items: [
    "Update popups are calmer: you get one popup for the newest version only, Later is remembered until an even newer version comes out, and if a reload lands on an older copy while the web host catches up, it waits 15 minutes instead of asking again and again.",
    "The Modern look is gone. The painted Classic look is now the only look, and Config → Graphics no longer has a look switch. Outlines and Job style / Show gear are still there.",
    "The game file is smaller and loads a little faster, since the unused reflective shading, smooth eye and face painting, finger-by-finger hands, old weapon and shield shapes and the glow effect were removed."
  ] },
  { v: "16.18.0", date: "2026-10-15", title: "Classic polish", items: [
    "Cliff rocks use fewer triangles on Low and Medium, so the world draws faster on phones and older computers. They look the same from a normal distance.",
    "The Classic look no longer builds a character bump map it never used, so characters load a little faster and use less memory."
  ] },
  { v: "16.17.0", date: "2026-10-15", title: "Classic effects", items: [
    "In the Classic look spell and hit effects are bolder: the glowing sparks are flat, hard-edged discs in a few tones and about a third bigger, shockwave rings are thick double rings, and light pillars are built from three flat bands.",
    "Damage and healing numbers get a thick dark outline and a hard drop shadow, and fade out without blurring.",
    "Tab now targets objects too (signs, boards, tablets, chests, braziers, gathering points, camps, crystals and warp stones), after the people nearby."
  ] },
  { v: "16.16.0", date: "2026-10-15", title: "World match", items: [
    "In the Classic look the world now matches the characters: ground, bark, leaves, stonework and sky textures use a few flat painted tones, lighting on terrain, trees and buildings falls in soft bands, clouds are blockier, and the distance haze closes in sooner.",
    "The glow effect is off in the Classic look. The Modern look is unchanged."
  ] },
  { v: "16.15.1", date: "2026-10-15", title: "Off the roads, again", items: [
    "Warp stones and their district signposts now also keep out of the paved plazas, not only the dirt roads.",
    "Townspeople who work at a stall or desk (Marn, Maera and the others) are moved off the roads together with their table, so nobody stands in the middle of a road."
  ] },
  { v: "16.15.0", date: "2026-10-15", title: "Closer names", items: [
    "Name labels over people, objects and monsters now appear only when you are fairly close (people and objects within a short walk, monsters a little further). Your target and party members always keep their names.",
    "The new-version popup with its Reload button is checked more often (every 5 minutes and whenever you return to the game tab), and the published version file was out of date, which is why no popup appeared recently; that is fixed."
  ] },
  { v: "16.14.1", date: "2026-10-15", title: "Auction balance", items: [
    "The Auction House now shows a Current Crystals box below its window, so you can see your balance while you buy and post."
  ] },
  { v: "16.14.0", date: "2026-10-15", title: "Camera and Tab", items: [
    "Dragging to turn the camera left and right is now inverted. Config, Camera has an Invert horizontal switch to change it back.",
    "Tab now targets warp stones as well as crystals and people, so you can reach a stone without tapping it."
  ] },
  { v: "16.13.1", date: "2026-10-15", title: "Target button placement", items: [
    "The Talk / Use / Inspect / Harvest / Fight button now sits directly above the Target panel instead of floating over the target, and uses the same blue and gold style as the command menu."
  ] },
  { v: "16.13.0", date: "2026-10-15", title: "Offline password", items: [
    "Playing offline now asks for the email and password of your online account before you can open the offline characters. The password is checked with the server, then remembered on that device (as a one-way hash) so offline play keeps working with no connection afterwards.",
    "If you have never signed in on a device and it is offline, connect once to unlock offline play there."
  ] },
  { v: "16.12.0", date: "2026-10-15", title: "Target button", items: [
    "On a touch screen, targeting something now puts a button above the Target panel, styled like the command menu: Talk for people, Use or Inspect for objects (signs, boards and tablets are Inspect; crystals, warp stones, chests, braziers and camps are Use), Harvest for gathering points, and Fight for monsters.",
    "Fight engages the monster and opens its command box (magic, abilities, items) in one tap.",
    "Attacking no longer makes you run to the monster. If you want the old behaviour, turn on Auto-run to target in Config, Camera."
  ] },
  { v: "16.11.0", date: "2026-10-15", title: "Clear roads", items: [
    "Random wandering people are gone: city walkers, night walkers, patrolling guards and road travellers no longer spawn. Every named NPC stays at a fixed spot. Animals still roam.",
    "Warp stones are now stone statues: a robed figure on a plinth holding a glowing crystal.",
    "Warp stones, signposts, benches, practice dummies, weapon racks, crates, barrels, stalls and lamps no longer stand in the middle of roads and paths in the cities and fields; they sit beside them instead."
  ] },
  { v: "16.10.0", date: "2026-10-15", title: "Townsfolk", items: [
    "In the Classic look the people walking through the cities are a mix of the five races (human, elari, pipkin, ursan and nekari), each with its own proper body, and they dress for where they are: clerks in mortarboards and trimmed coats in the Government District and the Keep, bandanas and baskets in the markets, aproned smiths with hammers in the Industrial District and Smelters' Row, travellers in coats, capes and wide hats at the gates, sailors in tricornes with oars and spyglasses at the harbour.",
    "Night walkers carry lanterns and wear dark capes.",
    "Named townspeople keep their own outfits."
  ] },
  { v: "16.9.0", date: "2026-10-15", title: "Bold monsters", items: [
    "In the Classic look beasts and creatures use bolder, more saturated painted colours, and four-legged animals have bigger heads and thicker legs and necks.",
    "Monsters are recoloured by level, so you can judge a creature at a glance: levels 1–5 keep the family colour, 6–10 shift a shade, 11–15 shift further and darken, and 16 and up turn deep and dark.",
    "Notorious monsters now stand out: a crown, horns or bone spikes on the head, a ridge of spikes along the back (glowing on some) and a glowing ring at their feet. Old Croaker, King Wiggles, the Lumicap Matron and the Sandglass Wisp wear crowns.",
    "Humanoid monsters (goblins, orcs, skeletons and the rest) keep their own looks."
  ] },
  { v: "16.8.0", date: "2026-10-15", title: "Bold weapons and shields", items: [
    "In the Classic look weapons are chunkier: wider, thicker blades, bigger crossguards, thicker shafts and grips, larger axe, spear and scythe heads and bigger staff orbs and club heads.",
    "Weapons now have the same dark outline as characters.",
    "Shields are bigger and bolder: round shields have a rim, a cross emblem in the crest colour and studs, and the Kite Shield is now a proper kite shape with a crest cross."
  ] },
  { v: "16.7.0", date: "2026-10-15", title: "Job style", items: [
    "New in the Classic look: Job style. Every adventurer now wears their job's signature outfit, and it gets grander at levels 5, 10 and 16, so you can tell a job at a glance.",
    "All 22 jobs have four looks each, for example horned helms for Warriors, tall pointed hats for Black Mages, hoods with red trim for White Mages, feathered hats for Red Mages, winged helms for Dragoons, kabuto for Samurai, hoods for Ninjas, tricornes for Corsairs, jester hats for Puppetmasters, circlets for Dancers and mortarboards for Scholars.",
    "Higher tiers add oversized shoulder guards (some with spikes), capes, collars, gauntlets and greaves.",
    "Weapons and shields always show. To see the armour you have equipped instead, choose Show gear in Config → Graphics.",
    "Mercenaries with their own outfits keep them."
  ] },
  { v: "16.6.0", date: "2026-10-15", title: "Face finish", items: [
    "In the Classic look faces are shaded in a few flat tones (shadow under the jaw, a nose shadow, a lit forehead, hard-edged blush) instead of soft gradients.",
    "Eyes have a bolder ink upper lid, a stronger lid crease and banded iris colours so they stay readable from a distance.",
    "Ears get a darker inner shape on humans, elves, pipkin and goblins.",
    "Ursan, pipkin and the other special faces keep their own look."
  ] },
  { v: "16.5.0", date: "2026-10-15", title: "Chunky hair", items: [
    "In the Classic look hair is built from 12 to 14 thick, pointed clumps with dark lines between them and a painted shine band, instead of thin strips. Hair also sits a little fuller on the head.",
    "Skin and faces shade smoothly instead of in light bands, so faces no longer look blotchy.",
    "Hair under hats and helmets is unchanged."
  ] },
  { v: "16.4.0", date: "2026-10-15", title: "Chunkier characters", items: [
    "In the Classic look characters and monsters are built from fewer, bolder shapes, about a third of the old triangle count (around 3,000 for a person on Medium), so they read more like an early-2000s online RPG and run lighter on phones.",
    "Bigger hands with fingers grouped into one shape, thicker wrists and feet, flared cuffs on long sleeves, a raised collar on shirts, vests and armour, and flared boot tops.",
    "Far-away characters use an even simpler model. The Modern look is unchanged."
  ] },
  { v: "16.3.0", date: "2026-10-15", title: "Painted textures", items: [
    "In the Classic look every material is now hand-painted instead of photo-like: cloth has painted folds with dark creases and stitched hems, leather has painted panels, bright edges and stitching, metal has painted shine bands, bevelled edges and rivets, hair has clumps with dark lines and a shine band, and fur, scales, feathers, bone, wood, chain and quilting all use bold shapes with a few tones and dark ink lines.",
    "Textures stay crisp up close (no blur) and smooth out at a distance.",
    "The Modern look keeps the old textures."
  ] },
  { v: "16.2.0", date: "2026-10-15", title: "Classic look", items: [
    "Fixed: creating a character in offline play was refused with an \"Offline characters can never be brought online\" message.",
    "New Classic look (now the default): characters, monsters, NPCs and weapons use painted, softly lit shading with simple light bands and a small fixed shine on metal, instead of reflective shading. Glow is gentler and colours are a little richer.",
    "Dark outlines now trace characters and monsters. Outlines are on for Medium and High and off for Low.",
    "Config → Graphics has Classic look, Modern look and Outlines on/off. Changing any of them reloads the game."
  ] },
  { v: "6.5.0", date: "2026-10-13", title: "Pets", items: [
    "Ten pets that follow you around: Meadow Kit, Snow Kit, Shade Kit, Batling, Wormlet, Pocket Goblin, and the Ember, Frost, Tide and Ash wisps. They don't fight and can't be attacked.",
    "Each pet gives one small perk while it's out, such as extra experience, faster resting, better gathering or fishing, higher sell prices or a bigger drop chance.",
    "New Pets window: equip a pet, give it a name, and summon or dismiss it. The Pet button joins your action bar once you own one, and /pet toggles it. Your pet is remembered between sessions.",
    "Ysolde sells three pets. Others come from notorious monsters (Duskwing, Mirelord Gax, Rimefang, the Ashen Herald), fishing in Saltreach, the Adventurers' Guild shop, and finishing the main story. New achievement: Pet Keeper."
  ] },
  { v: "16.1.10", date: "2026-10-15", title: "Shorter necks for Humans and Nekari", items: [
    "Humans and Nekari now have much shorter necks, as do the townspeople, so heads sit closer to the shoulders."
  ] },
  { v: "16.1.9", date: "2026-10-15", title: "Ursan: no neck, smaller tail", items: [
    "Ursan heads now sit right on their shoulders, and their lizard tail is shorter and slimmer."
  ] },
  { v: "16.1.8", date: "2026-10-15", title: "Pipkin have no neck", items: [
    "Pipkin heads now sit right down on their shoulders, with no visible neck."
  ] },
  { v: "16.1.7", date: "2026-10-15", title: "More humanoid faces", items: [
    "Every player race now has a narrower jaw and a defined chin instead of a round ball of a head; Pipkin and Ursan especially.",
    "Ursan skin is now a cool gray with only a hint of green.",
    "Pipkin have little brown button noses and slightly smaller eyes."
  ] },
  { v: "16.1.6", date: "2026-10-15", title: "Ursan and Pipkin redesigned", items: [
    "Ursan are now big, gray-green lizard-skinned brutes: heavy brow, small deep-set eyes, a stern frown, a thick neck, a broad frame, thicker arms and a long lizard tail. The bear ears and beard are gone.",
    "Pipkin are now cute and doll-like: big round dark eyes with a shine, a tiny nose, rosy cheeks, a small smile, a rounder face and warm peach skin.",
    "Each race has its own eight face choices, shown in the creator's face step."
  ] },
  { v: "16.1.5", date: "2026-10-15", title: "Creator fits narrow phones", items: [
    "The character creation preview on narrow phones was cropping the character at the sides, which looked like a zoom. The camera now pulls back to fit the whole body, and the preview column is wider.",
    "On very narrow phones (360 px wide or less) the face and hair choices use two columns, and the panel no longer runs off the side of the screen."
  ] },
  { v: "16.1.2", date: "2026-10-15", title: "Creator camera locked on touch screens", items: [
    "On phones and tablets the creation preview always uses the fixed full-length camera, whatever step you are on."
  ] },
  { v: "16.1.1", date: "2026-10-15", title: "Creator preview on phones", items: [
    "Character creation no longer zooms in on the face on phones and tablets, including when held sideways; the preview stays full-length."
  ] },
  { v: "16.1.0", date: "2026-10-15", title: "Rocky Hollow and Windreach in three zones", items: [
    "Rocky Hollow is now three zones: West Meadows (Lv 1–3, from the Outpost), Mirror Lake (Lv 3–5, with the roads to the Ashen Marsh and the Windreach Highlands) and Eastern Ruins (Lv 5–7, with the Old Fort and the way to the Goblin Den). Walk off the east or west edge to cross between them.",
    "Windreach Highlands is now three zones: Windreach Foothills (Lv 10–13, where the road from the Hollow arrives), Windreach Plateau (Lv 11–14, with the nomad camp, Tarqa and Essa) and Eagle Ridge (Lv 11–14, with Rider's Rest). Walk north to climb.",
    "Each zone has its own name, level range, monsters, gathering spots, signposts and camp crystal (Hollow). The new Highland zones have more monsters to fight.",
    "The Hollow Run now crosses all three Hollow zones; the next checkpoint's zone is shown in the tracker.",
    "Weather is shared across a whole area. Your position, found landmarks, explored map, camp attunement and quest progress carried over from the old Hollow and Highlands.",
    "Character creation on a phone no longer zooms in on the face (fixed properly in 16.1.1)."
  ] },
  { v: "16.0.0", date: "2026-10-15", title: "Region framework", items: [
    "Every outdoor zone now has a level range. It shows on the banner when you arrive (with its region), in the chat log, in the Map window and under each area on the atlas.",
    "Behind the scenes, wild areas can now be split into several connected zones joined at their edges, like the classics. The next updates use this to split Rocky Hollow, the Windreach Highlands and the other wilds.",
    "Saves are ready for it: when an area is split, your position, found landmarks, explored map, home point and crystal attunements move to the right new zone automatically.",
    "Quests, the story, expeditions, achievements, conquest, fishing and the atlas now treat all zones of one area as that area. The Red Spire's five floors show as one place on the atlas."
  ] },
  { v: "15.7.1", date: "2026-10-15", title: "Creator preview fix", items: [
    "The character preview in creation now stays centred on the face for every race and size on the Face and Hair colour steps.",
    "The preview no longer turns by itself. It faces forward, and you can drag it to turn the model."
  ] },
  { v: "15.7.0", date: "2026-10-14", title: "Creation polish", items: [
    "Skin tones are gone from character creation, as in the classics. Your skin now comes from your race, and faces no longer change it. Existing characters keep their looks.",
    "The last creation step now shows a summary of your choices (race, gender, face, hair, size) beside the turning preview, with a Start over button that resets everything.",
    "Your race, gender and size now show on the Status screen under your name."
  ] },
  { v: "15.6.0", date: "2026-10-14", title: "New character creation", items: [
    "Character creation is now a step-by-step flow like the classic online RPGs: Race → Gender → Face → Hair colour → Size → Name and job.",
    "Race: pick from five cards, with each race's description and its HP, MP and attribute bonuses. Ursan (always male) and Nekari (always female) skip the Gender step.",
    "Face: choose from eight painted face portraits. Each face comes with its own hairstyle, so there is no separate hairstyle picker.",
    "Hair colour: a palette of eight colours.",
    "Size: Small, Medium or Large. It is only for looks and doesn't change your stats.",
    "The 3D preview zooms in on the face for the Face and Hair colour steps and turns to face you.",
    "Numbered tabs along the top let you jump back to any step; 🎲 rolls a random look; Back returns to the previous step.",
    "Everything fits on a phone screen without scrolling. Existing characters keep their looks."
  ] },
  { v: "15.5.0", date: "2026-10-14", title: "Anime faces", items: [
    "Every player race and townsperson now has a cartoon/anime face in the spirit of classic online RPGs: large glossy eyes with two highlights, a tall shaded iris, a thick upper lash line, a tiny nose and a small mouth.",
    "Eight face types: Bright, Calm, Keen, Freckled, Gentle, Fierce, Sleepy and Proud. Each has its own eye shape (round, narrow, upturned, droopy, half-lidded), eye colour, brows and mouth.",
    "Men and women have separate face paints: women get heavier lashes with a flick at the corner, a lip tint and a blush.",
    "Faces are smoother: smaller nose, shallower eye sockets and softer cheeks.",
    "Fringes (bob, long, twin tails, wavy) now stop at the brows so the eyes show.",
    "Blinking and closing the eyes when knocked out still work with the larger eyes.",
    "Characters that used faces 9 to 16 now use the matching face from the first eight."
  ] },
  { v: "15.4.0", date: "2026-10-14", title: "City life", items: [
    "The three cities are busier. Every district has townsfolk walking their own routes by day, a few night-walkers after dark, and guards on patrol (two in the Government District, Keep and Eastgate).",
    "The markets and fish market are crowded; the residential wards are quieter.",
    "Warp stones are robed stone statues holding a glowing crystal (Tab targets them and other objects too). A district signpost stands beside every warp stone and tells you which way the other districts lie and how far.",
    "Ambience follows the district: crowd noise swells in the markets and fades in the wards, and the surf is loudest on the Docks.",
    "Three new quests for touring each city: Know Your City (Pell), Harbor Rounds (Marn) and The Ironvale Circuit (Brisa). Walk through every district, then report back."
  ] },
  { v: "15.3.0", date: "2026-10-14", title: "Warp stones", items: [
    "Every district of Ashenreach Outpost, Saltreach Harbor and Ironvale now has a warp stone, shown as a pink dot on the map.",
    "Touch a stone to attune to it. From any stone you can warp for free to any attuned stone in the same city, or to an attuned stone in another city for " + CONFIG.warpCost + " crystals. Not during a fight.",
    "New command: /warp opens the warp menu when you stand next to a stone."
  ] },
  { v: "15.2.0", date: "2026-10-14", title: "Harbor, Ironvale and fixes", items: [
    "Saltreach Harbor and Ironvale are now districted cities with their own look. Saltreach has timber and whitewashed harbor buildings, a lighthouse, slipways and a sea wall on the south side; Ironvale has dark stone halls, smelters, a keep and mine heads, with snow on the roofs.",
    "Fallen hirelings now stay where they died for an hour instead of following you to town. Walk back and raise them before the hour is up, or they leave the party.",
    "New item: Phoenix Down (3500 crystals at Pell's) revives a KO'd hireling, party member or friend with half their HP. If you are KO'd yourself, open your items and use it to get back up. Ember Plume now works the same way for a fifth of your HP.",
    "Names and labels no longer show through walls and buildings.",
    "Prompts such as the exit confirmation close when you walk away, and the box is only as wide as its text.",
    "The loading screen no longer shows the version, fun fact or credits; the 3D model showcase appears again on phones.",
    "The character select screen fits on a phone without a scroll bar, and the character creator fits too.",
    "The item menu can be closed on a phone and items have a Use button."
  ] },
  { v: "15.1.0", date: "2026-10-14", title: "Outpost city", items: [
    "Every building in Ashenreach Outpost has been rebuilt as a proper city building: stone plinths, two- and three-storey houses with timber framing and overhanging upper floors, gable walls, windows with frames, sills, shutters and flower boxes, doors with steps and a lantern that lights at night, and chimneys.",
    "Government District: Rhea's stone barracks with training dummies, a weapon rack and the Ashenreach flag; the new City Hall, three storeys with a clock tower whose hands follow the in-game time; Maera's Adventurers' Guild; Brann's Mercenary Hall; Tobin's Job Master hall; and a square with a fountain and benches.",
    "Market District: Pell's Goods and Odette's Furnishings are two-storey shops with striped awnings and hanging signs; Corvin's Auction House has a columned porch; benches line the plaza.",
    "Industrial District: Garrick's smithy with a tall glowing chimney and a forge hearth that lights the street, a working windmill with turning sails, a warehouse with a loading crane and crates, and new Woodworkers' and Alchemists' halls.",
    "Residential District: townhouses in four plaster colours with fenced vegetable gardens.",
    "The city is now ringed by a stone outer wall with corner towers, and the road to Rocky Hollow leaves through a great gatehouse with the city's name over the arch.",
    "Streets are paved with cobblestones throughout the city."
  ] },
  { v: "15.0.0", date: "2026-10-14", title: "City districts", items: [
    "Ashenreach Outpost has grown into a walled city of five districts: the Market District around the home point crystal, the Government District to the north, the Residential District to the west, the Industrial District to the south and Eastgate, which leads out to Rocky Hollow.",
    "Districts are divided by stone walls with crenellations and joined by gate halls: twin towers with tiled roofs, an arched passage and banners in each district's colour on either side.",
    "Walking into a district shows its name on screen and logs it; the first visit to each one pops a District discovered notice.",
    "The map tints each district, draws the walls and gate halls, and labels the districts you've visited.",
    "Clicking to walk, chasing a target and your companions following you now route through the nearest gate hall instead of walking into a wall. You also slide around people in the way instead of stopping dead.",
    "Townsfolk have moved to their districts: Rhea, Maera, Brann and Tobin in Government; Pell, Odette, Corvin, Luna and the Trade Board in the Market; Garrick in Industrial; Ysolde and the stables in Eastgate; your residence in Residential.",
    "Logging out saves which district you're in, and you resume there. If you last saved in the old Outpost, you start in the Market plaza by the crystal."
  ] },
  { v: "14.12.0", date: "2026-10-14", title: "Dungeons", items: [
    "Crypts are now built halls: every wall is a real brick wall with stone pilasters, iron wall sconces with burning torches that light the corridors, and flagstone floors with mortar lines.",
    "Crypt halls are dressed with stone sarcophagi in the vault, throne room and sentinel's rest, scattered skulls and bones, clay urns along the walls and cobwebs in the upper corners.",
    "Caves get timber mine supports along the rock walls, and crates and barrels piled near the goblins' torches."
  ] },
  { v: "14.11.0", date: "2026-10-14", title: "Light and atmosphere", items: [
    "Sunbeams: soft shafts of light slant down through the open country in daytime, angled along the sun and glowing warmer and stronger at dawn and dusk. They fade in rain, fog and overcast weather.",
    "Caves get pale blue light shafts falling from cracks above, and their glowing crystal clusters now light the ground around them in teal and violet pools, gently pulsing.",
    "Drifting motes of dust and pollen float in the air around you: golden in the sun, blue-white underground, faint indoors.",
    "Shorelines have a darker band of wet sand right at the water's edge."
  ] },
  { v: "14.10.0", date: "2026-10-14", title: "Foliage and props", items: [
    "Wild areas are dressed with more plant life: fern patches in the meadows (big fronds in the jungle), reed beds around every pond and through the marsh, and clusters of red, pale and brown mushrooms.",
    "Props tell a story along the roads: an abandoned cart or two beside the track (some tipped over and half sunk), old fence lines wandering near the entrance of each area, and tree stumps.",
    "Each region gets its own set: bleached skulls and bones in the desert, charred stumps on the volcanic slopes, frosted stumps in the snow, extra reeds in the marsh.",
    "Reeds, ferns and plants sway with the same wind as the trees and grass."
  ] },
  { v: "14.9.0", date: "2026-10-14", title: "Terrain and cliffs", items: [
    "Cliffs and steep slopes show layered rock strata: wavy bands of warmer and cooler stone with darker ledges at the base of each layer, instead of one flat grey.",
    "Rocky outcrops: stacked, broken stone slabs now sit along steep slopes and the edges of every outdoor area, leaning with the hillside and partly buried, in three different shapes and tints so no two look the same.",
    "Dirt roads have two worn wheel ruts with a strip of grass down the middle, and loose edging stones scattered along their sides."
  ] },
  { v: "14.8.0", date: "2026-10-14", title: "Painted item icons", items: [
    "Items now have painted icons instead of emoji, drawn when the game starts:",
    "Weapons lie on the diagonal like classic item art, one shape per type: swords with fullers and quillons, daggers, katanas with wrapped grips and round guards, great swords, axes and double-bladed great axes, flanged clubs, staves with glowing orbs, spears, scythes and bows. The metal changes with the item (bronze, iron, steel, mythril, gold, bone, frost, ember, shadow) and higher-level weapons get gold guards and gems.",
    "Armour by slot: helmets (horned ones too), hats, hoods and circlets; mail, plate, tunics and robes in their own colours; gauntlets and gloves; greaves and trousers; boots; capes; belts; shields; arrows; and gold rings, earrings and necklaces set with coloured gems.",
    "Potions and ethers in glass flasks, spell scrolls tied with a ribbon in the spell's element colour, crystals and essences as faceted gems, keys, and materials (ore, ingots, logs, herbs, cloth, fish, bones, teeth, feathers, shells and hides).",
    "Uncommon, rare and epic items get green, blue and purple corner frames.",
    "Food, furniture, seeds and pets keep their pictures, now on the same tiles."
  ] },
  { v: "14.7.0", date: "2026-10-14", title: "More sound effects", items: [
    "Footsteps change with the ground: soft grass, hard stone in towns and caves, hollow wood indoors, crunching snow and hissing sand. Nearby companions and monsters make footsteps too, heavier for big monsters.",
    "Every swing has a whoosh: a quick swish for swords and daggers, a deep heavy whoosh for great weapons, clubs, staves and polearms, and a sharp swipe for claws and fangs.",
    "Monsters have voices by family: goblins jabber, orcs roar, Reefkin gurgle, Crag Talons chirp, treants and cacti creak, skeletons clatter, ghouls moan, bombs crackle, bats screech, worms rumble, bees buzz, lizards and crawlers hiss, sheep bleat, toads croak and hares squeak. They call out when they notice you, cry out sometimes when hit and give a lower, longer cry when they fall. Bigger monsters sound deeper.",
    "Treasure chests creak open with a chime; crafting rings with hammer strikes; fishing has a line-cast whoosh and a splash when something bites.",
    "Towns have a low crowd murmur (quieter at night), and caves and crypts drip."
  ] },
  { v: "14.6.0", date: "2026-10-14", title: "Interface sounds", items: [
    "New classic-style menu sounds throughout the interface, made in the game rather than played from recordings so they stay crisp and quiet:",
    "A soft high tick when the cursor moves (arrow keys in any menu or list, or pointing at a button with the mouse); a bright two-note chime when you confirm; a falling blip when you back out or close a window; a quick rising shimmer when a window opens; a dull double buzz for anything you can't do.",
    "A crisp tick when you pick a new target, a metal clink when you equip gear, a coin ping when crystals change hands and a three-note chime when you buy.",
    "Chat chimes: a three-note bell for an incoming tell and a softer two-note bell for party chat.",
    "Quest, unlock and notice sounds are now gentle bell arpeggios.",
    "All of these follow the Interface volume slider in Config."
  ] },
  { v: "14.5.0", date: "2026-10-14", title: "Planted feet and four-legged gaits", items: [
    "Feet stay planted when people and monsters turn on the spot: the hips hold still while the upper body turns, then they take a quick shuffle step to catch up, instead of their feet sliding left and right.",
    "Four-legged creatures (sheep, longnecks, lizards, dogs, deer, cats and the rest) now walk with real gaits chosen by their size and speed: a four-beat walk, a diagonal trot, and a gallop when they run flat out. Lizards use a low sprawling walk.",
    "Each leg plants its foot and holds it on the ground while the body passes over, then lifts and swings forward in an arc, so the feet no longer slide. Legs stand slightly bent and the body bobs with the gait.",
    "Spells can only be learned while your main job, or your support job at half your level, is high enough for that spell. A Warrior with a level 20 White Mage on the shelf can't read a Cure II scroll until White Mage is set as main or support.",
    "Spell scrolls no longer offer \"Add to action bar\"."
  ] },
  { v: "14.4.0", date: "2026-10-14", title: "Critters", items: [
    "Fur and feathers: on High quality, furry and feathered creatures (bees, bats, hares, sheep, dogs, cats, Crag Talons and others) grow layered fur shells, so their coats look soft and fuzzy instead of painted on.",
    "Bats have finger bones running through their wing membranes, a thumb claw and clawed feet.",
    "Shroomlings have gills under the cap and a skirt ring on the stalk.",
    "Worms have finer ring bands and bristles along their bellies.",
    "Hares have whiskers; toads have splayed, padded toes."
  ] },
  { v: "14.3.0", date: "2026-10-14", title: "Beastmen and bosses", items: [
    "Every beastman family now has its own build and gear on top of the sculpted heads:",
    "Goblins stoop forward and carry belt pouches, a bone charm and knee pads. Orcs wear spiked pauldrons, tooth necklaces and leather bracers.",
    "Reefkin have a webbed dorsal fin down the back, fins along the forearms and gill slits, and lean forward like swimmers on land.",
    "Crag Talons have flight feathers trailing from the forearms, a fanned tail and clawed feet.",
    "Treants are thick-trunked with branches growing from the shoulders and forearms, leafy tufts, moss and spreading roots for feet.",
    "Ghouls are hunched with a bony spine ridge and hanging rags; skeletons wear tattered loincloths.",
    "Bosses and notorious monsters are marked out: the Goblin Chieftain, Gorruk the Warlord, Mirelord Gax and Rimefang carry war banners on their backs."
  ] },
  { v: "14.2.0", date: "2026-10-14", title: "Townsfolk, swordplay and damage numbers", items: [
    "Named NPCs now hold their trade: Garrick and Haldor carry forge hammers, the clerks keep ledgers, Tobin a tome, guards their spears, the ferryman an oar, Wend a fishing rod, Luna a lantern and more.",
    "Background townsfolk get a fuller wardrobe (shirts, vests, aprons, tunics, robes and coats; bandanas, wide-brim and fur hats; capes, collars and gloves) and sometimes carry a basket, broom, tankard, book, walking staff or scroll.",
    "Heads turn to look at things: you look at your target, people turn their head to face you when you target them, talk to them or walk close, and monsters watch whoever they're fighting or you when you target them.",
    "Sword swings fixed: the wrist now snaps through the cut, so the blade leads the overhead chop, lies flat through the side sweep and points ahead in the stab instead of swinging backwards. The grip sits deeper in the fist.",
    "Red damage numbers pop out of whoever is hit, rise, then fizzle away. Turn them off in Config → Interface → Damage numbers.",
    "Rounder, V-shaped chests that slope from the neck into the shoulders instead of square boxes; Ursan chests are no longer wider than their shoulders. Thicker, natural necks.",
    "Pipkin feet are smaller. Skin is a touch less shiny in bright sun.",
    "Status icons now sit below the Commands bar instead of under it.",
    "One of the Outpost's background walkers is gone.",
    "Sound now starts on your first tap, click or key press, even if the browser held it back; a note appears if sound is still blocked."
  ] },
  { v: "14.1.0", date: "2026-10-14", title: "Fitted armour and finer weapons", items: [
    "Armour is now shaped to the body underneath it: breastplates wrap the chest and waist with a centre ridge and riveted bands, pauldrons cap the shoulder in layers, vambraces follow the forearm, greaves follow the shin with a knee cop, and boots hug the calf with a turned top. Everything bends with the body instead of floating.",
    "Swords and daggers show their tier: plain bars on starter blades, swept crossguards from level 8, and jewelled guards and pommels from level 15. Other high-level weapons gain metal bands and a set gem.",
    "Title screen: the tip line is gone, the version now sits under the credit line, and the credit is hidden on character select."
  ] },
  { v: "14.0.0", date: "2026-10-14", title: "Flowing capes and hair, five new hairstyles", items: [
    "Capes are now cloth in three hinged sections driven by spring physics: they hang still when you stand, stream back when you run, swing out on turns and settle with a little bounce when you stop.",
    "Ponytails, braids and long hair swing with your stride and lag behind turns; tabard flaps are pushed by your legs and flutter when running.",
    "Five new hairstyles: Wavy, Pixie, Side part, Locs and Curly (16 in all).",
    "Helmets, caps and hats no longer make you look bald: your fringe, sides and back hair show beneath the rim. Helmets now fit the shape of the head, with a nose guard and cheek guards that follow the face.",
    "The wooden arches at zone exits are gone.",
    "The title, loading and character select screens use the same blue striped boxes, white-bordered panels and pill buttons as the in-game menus.",
    "More to fight close to town: the bigger fields now have about two to three times as many spawn points, and the first ones are only a short walk from the gate. Level 1–2 critters near town show as easy prey or a decent challenge for new characters.",
    "Critters (hares, bees, sheep, mandrakes and the like) stay out at night. Night adds its own harder monsters rather than emptying the fields."
  ] },
  { v: "13.9.0", date: "2026-10-14", title: "Faces that talk", items: [
    "16 faces to choose from (was 8). Since 15.5.0 there are 8 anime-style faces instead.",
    "Mouths move. Townsfolk talk while their lines appear in the log, you and other players talk when you chat, and the jaw drops with each syllable.",
    "Expressions: a shout on weapon skills, a grimace when hit, chanting while casting, open-mouthed laughs, cheers and panics, a trembling mouth when crying, and a slack jaw when knocked out. Eyes still blink and squint as before."
  ] },
  { v: "13.8.0", date: "2026-10-14", title: "Detailed textures", items: [
    "Clothing is woven: over-and-under threads, uneven slubs, folds, double-stitched hems and frayed, lighter edges.",
    "Leather has a pebbled grain, saddle stitching with holes along the edges, creases, scratches and burnished borders.",
    "Metal shows fine brushing and scratches, engraved scrollwork bands near the edges and a row of rivets, with dents and rust in the hollows.",
    "Embroidered trim has diamond and scroll motifs with visible thread stitching; quilting has stitched seams; chain mail links are staggered and catch the light.",
    "Hair strands, fur clumps, scales with rims, split feathers, knotted wood grain, porous bone and skin with fine pores.",
    "Character textures now paint faster at start-up on every quality setting."
  ] },
  { v: "13.7.0", date: "2026-10-14", title: "Hands, feet, animal heads and raising the fallen", items: [
    "Hands now have five fingers and a thumb. They relax at your sides, close around a drawn weapon and make fists when you fight barehanded.",
    "Feet are shaped with a heel, arch and toes; boots get a darker sole and toe cap, and bare feet show toes.",
    "Animals have real heads: sheep, deer, dogs, cats, lizards and longnecks get a skull, brow, eyes with highlights, a muzzle with nostrils, a lower jaw and shaped ears (droopy for sheep, pointed for deer and dogs, a wide flat mouth for lizards).",
    "Knock-outs work like a classic MMO: you fall and stay down for up to an hour while a Time Left box counts down. Raise (White Mage 12, Red Mage 17, Paladin 18), Raise II (White Mage 18) or an Ember Plume (Pell's shop) bring you back with no experience lost. Back to Home Point gives up early and costs experience as before.",
    "Companions stay down when they fall instead of getting back up on their own. Healing companions walk over and raise anyone who is down. A companion left down for an hour returns to the Mercenary Hall.",
    "Text colours follow the classic scheme: green names for townsfolk, white for players and calm monsters, red for aggressive monsters or anything attacking your party, cyan for party members, yellow for companions and pets, grey for the fallen or far away. In the log: white for say and normal hits, cyan party chat, yellow tells, green linkshell, orange shouts, gold for weapon skills and criticals, green healing, blue MP and buffs, pink damage taken, purple misses, red warnings.",
    "The target box is simpler when you attack: name, a slim HP bar and the Locked arrows, with no timers."
  ] },
  { v: "13.6.1", date: "2026-10-14", title: "Classic command menu", items: [
    "The main menu is restyled: a dark navy panel with a fine border, a Commands label sitting on the top edge, lavender pill buttons with bold italic outlined text, an orange pill for the selection, and a silver pointer that sticks out past the left edge of the box.",
    "The Help, Network and Commands labels are no longer cut off at the top of the screen.",
    "Targeting a person or object shows a compact box with just the name (green for objects); people with something for you still show the ❗ line. Party HP bars are a warm salmon colour."
  ] },
  { v: "13.6.0", date: "2026-10-14", title: "Smooth bodies and natural movement", items: [
    "Bodies are now one smooth skin: chest, waist, hips, shoulders, arms and legs flow into each other instead of being built from balls and tubes. Shoulders, biceps, forearms, thighs, knees and calves have real shape, and joints bend without gaps.",
    "Everyone moves at a calmer pace. You run at about 5 m/s instead of 7, companions and pets keep up at a similar pace, monsters chase at roughly two-thirds of your speed, and townsfolk stroll.",
    "Feet now plant on the ground: each foot stays put while it carries weight, rolls from heel to toe and lifts in a smooth arc, so characters and humanoid monsters no longer skate. Longer, slower strides when running.",
    "Fixed a crash that could stop the game during weapon-skill trails."
  ] },
  { v: "13.5.0", date: "2026-10-14", title: "Sculpted heads", items: [
    "Heads are no longer balls. Every race now has a sculpted head with a jawline, chin, brow, eye sockets, cheekbones, a real nose and lips, and a slim neck that meets the jaw cleanly.",
    "New realistic face painting: almond eyes with a coloured iris, pupil and highlights, lash lines, eyelid creases, natural brows, nostrils, shaped lips and soft shading. The eyes blink with lids that follow the new face shape.",
    "Hair is now shaped to the head with a proper hairline, fringe and layered locks instead of flat cards. Beards wrap the jaw and come with a moustache.",
    "Monsters get sculpted heads too: goblins and orcs have heavy brows and jaws, Reefkin have wide fish mouths, ghouls are gaunt, and skeletons have hollow eye sockets, a nose cavity, teeth and a jaw.",
    "Needlekin now look like real cacti: a ribbed green column with upturned arms, rows of spines, root feet and a flower on top (gold for the king).",
    "On High quality, character textures are painted at twice the resolution, so faces, cloth and armour look sharper up close."
  ] },
  { v: "13.4.0", date: "2026-10-14", title: "Night and weather secrets", items: [
    "Luna, the Moonlit Peddler, now sets up in the Ashenreach plaza after dark with Moon Tonics and the Nightglass Earring. She's gone by dawn.",
    "During sandstorms a shimmering mirage appears in the south-west of the Sunscar Desert. Step into it to find the Mirage: a hidden glass garden with level 20 monsters, a treasure cache and the Sandglass Wisp, which may drop the Mirage Veil. The way in vanishes when the storm passes.",
    "Gloamhorn, a new notorious monster, grazes the eastern Windreach Highlands only at night and may drop the Gloam Ring.",
    "New achievement: Seen Through."
  ] },
  { v: "13.3.0", date: "2026-10-14", title: "World atlas", items: [
    "The world map in the Map window is now a full atlas of every area, joined by roads, doors and the Gull Isle ferry.",
    "It fills in as you travel: places you've been are named and coloured by whoever holds their region, places next to them show as ???, and everything else stays hidden. Each area shows how much of it you've mapped.",
    "New achievement: Cartographer, for setting foot in every area on the atlas."
  ] },
  { v: "13.2.0", date: "2026-10-14", title: "Expeditions", items: [
    "Maera at the Adventurers' Guild now offers expeditions: long journeys that send you across several areas, talking to people and standing at far-off landmarks before you report back.",
    "Three to start: Across the Wilds (level 12), Fire and Water (level 17) and The Ends of the Map (level 19), rewarding the Trailblazer Boots, the Explorer's Ring and the Pathfinder's Mantle.",
    "Type /expedition to see your next leg. New achievement: Far Traveller."
  ] },
  { v: "13.1.0", date: "2026-10-14", title: "Weather that matters", items: [
    "New weather: sandstorms sweep the Sunscar Desert (and sometimes Cinder Peak), turning the air tan and blowing dust across the dunes.",
    "Weather now affects play: fog, blizzards and sandstorms (and to a lesser extent rain and storms) cut how far monsters can see you, and blizzards and sandstorms slow you down on foot.",
    "Some monsters only come out in certain weather and leave when it turns: a storm-only Dune Worm in sandstorms, Ice Wights in Frostspire blizzards, and Drowned Ones in the marsh fog. A message tells you when the weather changes."
  ] },
  { v: "13.0.0", date: "2026-10-14", title: "Regions and nations", items: [
    "The wilds are now five regions (the Vale, the Mire, the Coast, the Peaks and the Sands), each held by the Ashenreach League, the Ironvale Compact or the Beastmen.",
    "Pledge to a nation with Captain Rhea or Brisa. Every monster you defeat in a region adds points for your nation, and once a day the region goes to whoever earned the most.",
    "Holding regions matters: shops are 10% cheaper while your nation holds three or more, 10% dearer if the Beastmen do, and you earn 5% more experience in regions your nation holds.",
    "New command: /conquest shows the standings. Entering an area tells you who holds it."
  ] },
  { v: "12.7.0", date: "2026-10-14", title: "Windreach Highlands", items: [
    "A new road leads north out of Rocky Hollow to the Windreach Highlands: a huge open plateau of golden grass for levels 10–15. Mounts run at full road speed anywhere on it.",
    "Nomads camp in the middle of the plateau. Tarqa the chief has two quests (rewarding the Nomad Sash and Nomad Cloak), Essa sells supplies, and Rider's Rest offers a second camp.",
    "Plains Hares, Plains Lizards, Wind Wasps, Highland Longnecks and Highland Orcs roam the grass; Thunderhoof may drop the Windrunner Boots. New achievement: Wide Open Sky."
  ] },
  { v: "12.6.0", date: "2026-10-14", title: "Underdeep River", items: [
    "A cave door near the south-east of the Verdant Jungle leads down into the Underdeep: a long cavern lit by glowing mushrooms and crystals, with a dark river running through it.",
    "A rock wall splits the cavern; Boatman Ferro rows you across the river to the far landing for free. New achievement: Down the River.",
    "Level 16–20 monsters: Glow Bats, Pale Crabs, Lumicaps and Deep Worms. The Lumicap Matron may drop the Lumen Earring. New materials: Glowcap.",
    "The river has its own fish: Glowfin and the rare Blind Eel."
  ] },
  { v: "12.5.0", date: "2026-10-14", title: "The Red Spire", items: [
    "A tower dungeon has opened in the Sunscar Desert: walk up to the door at the Red Spire landmark to climb inside.",
    "Four floors of scorched undead, Ashen Orcs, Magma Lizards, Obsidian Crabs and Cinder Bombs, each floor tougher than the last. Take the stairs on the east side to climb, the west side to go back down.",
    "The Spire Warden, a level 23 boss, waits at the summit. It may drop the Warden's Greatsword (for Rune Fencers) or the Spire Mantle. New achievement: Top of the Spire."
  ] },
  { v: "12.4.0", date: "2026-10-14", title: "Gull Isle", items: [
    "A ferry now sails from the Saltreach Harbor docks to Gull Isle and back. Talk to Ferryman Coll; the crossing costs " + CONFIG.ferryCost + " crystals and takes a few seconds at sea.",
    "Gull Isle is a level 12–16 island with beaches, a palm grove, cliffs and a shipwreck cove, surrounded by open sea. Reef Crabs, Shore Lizards, Gale Talons, Reefkin and Isle Snappers live there, and Old Saltjaw may drop the Saltjaw Earring.",
    "Old Wend, the island's only resident, has a quest that rewards the Gull Charm. Sea fishing is good off the island's shores.",
    "New achievement: Island Hopper."
  ] },
  { v: "12.3.0", date: "2026-10-14", title: "Cinder Peak", items: [
    "A new area east of the Sunscar Desert: Cinder Peak, a volcano for levels 18–20. Black rock, drifting ash, rising embers and pools of glowing lava.",
    "New monsters: Magma Lizards, Obsidian Crabs, Magma Worms, Ashen Orcs and Cinder Bones, with Cinder Bombs after dark. Pyreclaw, a giant fire lizard, may drop the Pyre Ring.",
    "Five landmarks, plenty of mining spots, and a new achievement: Trial by Fire.",
    "Rocks in the desert are now sand-coloured to match the dunes."
  ] },
  { v: "12.2.0", date: "2026-10-14", title: "Verdant Jungle", items: [
    "A new area east of the Ashen Marsh: the Verdant Jungle, for levels 17–20. Giant trees, warm rain most days and a green mist between the trunks.",
    "New monsters: Vine Crawlers, Jade Hornets, Strangler Saplings, Bloom Mandrakes and Jade Toads, with Crag Talon raiders camped by the Overgrown Temple. Old Mossback, the oldest walking tree, may drop the Canopy Cloak.",
    "Five landmarks, logging and harvesting spots, and a new achievement: Into the Green.",
    "Fixed: killing monsters could sometimes fail to give loot after Blue Mage magic was added, because a random scroll drop could pick a blue spell that has no scroll."
  ] },
  { v: "12.1.0", date: "2026-10-14", title: "Sunscar Desert", items: [
    "A new area south of Ironvale: the Sunscar Desert, for levels 17–20. Golden dunes, red rock mesas, stands of cactus, and a lone oasis.",
    "New monsters: Dune Lizards, Sand Crabs, Sun Wasps by day, Dune Worms and Cinder Bombs by night, plus the Needlekin. A huge worm called Sandmaw hunts the Singing Dunes and may drop the Dunestrider Boots.",
    "Five landmarks to discover, mining and harvesting spots, mostly clear weather with the odd sand-blowing wind, and a new achievement: Sunburnt."
  ] },
  { v: "12.0.0", date: "2026-10-14", title: "Ironvale", items: [
    "A second city: Ironvale, a stone town high in the mountains at the east end of Frostspire Pass. It has its own home point crystal, trade board and auction house.",
    "Haldor the mythrilsmith sells level 19 mythril weapons for every weapon type, plus Mythril Mail, a Mythril Helm and the Ironvale Robe.",
    "Brisa the quartermaster has two new quests: Smoke on the Pass (rewarding the Ironvale Ring) and The Ore Run.",
    "New achievement: Mountain Welcome."
  ] },
  { v: "11.3.0", date: "2026-10-14", title: "Geomancer and Rune Fencer", items: [
    "Geomancer: wrap the party in auras of Vigor, Fury or Focus, and plant a glowing luopan by your foes that slows them, makes them frail or saps their strength. Full Circle and Mending Halation turn the luopan back into MP or healing.",
    "Rune Fencer: a great-sword tank who carves fire, ice, wind and earth runes to blunt incoming blows, then hurls them all at once with Lunge. Vallation braces for the worst.",
    "Both are taught by Tobin from level 18. With these, all twenty-two jobs are in the game, and mercenaries can be any of them."
  ] },
  { v: "11.2.0", date: "2026-10-14", title: "Puppetmaster, Dancer and Scholar", items: [
    "Puppetmaster: fight with your fists alongside a wind-up automaton. Repair it when it's battered and Tune Up its punches.",
    "Dancer: build TP with your daggers and spend it on waltzes that heal the party, steps that leave a monster off balance, and a Rising Flourish that cashes the steps in.",
    "Scholar: a student of both white and black magic. Switch between Light Arts and Dark Arts for faster, cheaper spells of that school, with Penury and Ebullience for a free cure or a harder nuke.",
    "All three are taught by Tobin from level 16. Mercenaries can be any of them."
  ] },
  { v: "11.1.0", date: "2026-10-14", title: "Beastmaster, Blue Mage and Corsair", items: [
    "Beastmaster: whistle up a lizard, crab or great ram to fight beside you, reward it with treats and cow your foes with a Feral Howl. Wields the new axe weapon type.",
    "Blue Mage: learn magic by watching monsters. Stand close when a hare kicks, a crab pinches or an orc roars, and you may learn to do it yourself. Ten blue spells to collect, plus Burst Affinity.",
    "Corsair: roll the dice for the party. Valor Roll raises attack, Hawk Roll raises accuracy, and Double Down risks a bust for a bigger bonus. Quick Shot fires a pistol.",
    "All three are taught by Tobin from level 14. Mercenaries can now be any of them too."
  ] },
  { v: "11.0.0", date: "2026-10-14", title: "Samurai, Ninja and Dragoon", items: [
    "Three new advanced jobs, taught by Tobin from level 12. Samurai: a two-handed tachi, Meditate for a burst of TP, the Hasso stance and Third Eye to slip the next blow. Ninja: a quick katana, Shadow Veil images that soak up hits, fire, frost and wind shuriken, Binding Thread, Smoke Step and Twin Strike. Dragoon: the lance, Jump and High Jump leap attacks and Dragon Spirit.",
    "Three new weapon types (great katana, katana and polearm) with four weapon skills each, new weapon models, and bronze to frostforged weapons from Pell and Vela. Ninjutsu scrolls can be bought or found like other spells.",
    "Mercenaries can now be Samurai, Ninja or Dragoons too."
  ] },
  { v: "10.10.0", date: "2026-10-14", title: "Travel", items: [
    "Camps in Rocky Hollow, Frostspire Pass and the Ashen Marsh, each with a tent, campfire and camp crystal that restores your party.",
    "Crystal warps: touching a crystal attunes you to it, and from any crystal you can warp to another attuned crystal for " + CONFIG.warpCost + " crystals. Home points still only work in towns.",
    "Signposts at every entrance of the outdoor areas point the way and give the distance to each neighbouring area.",
    "Riding on a road outside town is " + Math.round((CONFIG.roadBonus - 1) * 100) + "% faster than riding cross-country."
  ] },
  { v: "10.9.0", date: "2026-10-14", title: "Points of interest", items: [
    "Rocky Hollow, Frostspire Pass and the Ashen Marsh each have four new places to find: a Lookout Tower that marks every landmark in the area on your map, a Wayside Shrine that grants Shrine's Favour (+10% experience for 30 minutes) for a 10-crystal offering, a Weathered Tablet with a piece of local history, and a Hidden Cache vault chest.",
    "First visits to lookouts, shrines and tablets give bonus experience. They appear as purple dots on the compass map (caches in gold).",
    "New achievement: Wayfarer, for visiting every lookout, shrine and tablet."
  ] },
  { v: "10.8.0", date: "2026-10-14", title: "Living world", items: [
    "The wilds are alive: small herds of deer graze in the fields by day and bolt when you get close, flocks of birds circle overhead (and shelter when it rains or snows), butterflies flit over the grass on fine days, and fish leap from lakes and ponds.",
    "Travellers walk the main roads by day, one with a dog at their heels.",
    "Each area sounds different: rain patters, wind gusts and howls in storms and on the high pass, waves wash against the harbour, birds sing in the daytime fields, crickets chirp at night, and frogs croak in the marsh after dark. The Ambience slider in Settings controls all of it."
  ] },
  { v: "10.7.0", date: "2026-10-14", title: "Wider lands", items: [
    "Rocky Hollow is half again as large in each direction, and Frostspire Pass and the Ashen Marsh are 40% larger. Monster camps, landmarks, gathering spots, lakes and roads have all spread out, so there's more open country between fights.",
    "New terrain to explore: raised plateaus with rocky slopes and shallow ravines cut across each of these areas.",
    "More trees, rocks and grass fill the extra space. The Hollow Run course is longer, with more time allowed and adjusted medal times.",
    "If you logged out in one of these areas, you'll be placed at the matching spot in the bigger version."
  ] },
  { v: "10.6.0", date: "2026-10-14", title: "Distant horizons", items: [
    "Outdoor areas now sit in a wider world: three layers of distant hills and mountains ring every field and town, fading into the haze the further away they are, and darkening at night.",
    "Each area has its own skyline: rolling hills around the Outpost and Rocky Hollow, snow-capped peaks above Frostspire Pass, low misty ridges around the Ashen Marsh, and open sea gaps around Saltreach Harbor.",
    "Far landmarks: a watchtower on the hills, a giant tree on the ridge, a great ice peak and a lighthouse whose lamp glows brighter at night."
  ] },
  { v: "10.5.0", date: "2026-10-14", title: "Monster variety", items: [
    "Monsters of the same kind no longer look like clones: each one is a little bigger or smaller, and they come in three looks with darker or warmer colouring. Humanoid monsters may wear a cap or helmet, shoulder guards or a belt. Notorious monsters keep their signature look.",
    "Odette the furnisher has her own outfit, so every named townsperson now dresses as themselves."
  ] },
  { v: "10.4.0", date: "2026-10-14", title: "Races in motion", items: [
    "Each race moves its own way. Pipkins take quick bouncy steps with a little head bob and a swaying idle. Ursans walk with long, heavy strides, a forward lean and rolling shoulders. Nekari sway their hips and crouch lower in a fight. Elari stand tall with a measured, graceful stride.",
    "Ears are alive: Nekari, Elari and Pipkin ears twitch now and then, flatten back in combat or when you're hit, and lie back when running.",
    "Tails lash and rise when a fight starts and wag faster while in combat."
  ] },
  { v: "10.3.0", date: "2026-10-14", title: "Gear you can see", items: [
    "Every piece of armour now shows on your character. Pieces that used to be invisible (Harbor Mail, Frostforged Mail, Sailcloth and Frostweave robes, the Cinderweave and Priest's mantles, Guild Greatcoat, Snowfur Coat, Wight's Shroud, Gull Feather Hat, Fur Hat, the Tide and Hollow crowns, Pathfinder Boots, Silk Gloves, Sentinel's Greaves and more) each have their own look.",
    "New armour shapes: breastplates over mail, metal gauntlets with flared cuffs and knuckle plates, greaves with knee guards, fur collars, fur hats, wide-brimmed feathered hats and jewelled crowns.",
    "Weapons have more detail: wrapped grips, a fuller down the blade and capped crossguards. Higher-level frost, sea, royal and warlord weapons glow along the blade, head or tip."
  ] },
  { v: "10.2.0", date: "2026-10-14", title: "Faces and hair II", items: [
    "Hair has real locks now: a fringe of strands over the forehead, side locks framing the face (longer for bob and long styles), and long hair falls in separate strands down the back.",
    "Blinks are smooth and sometimes come in pairs. Eyes squint when laughing or crying, go wide in a panic, narrow in focus while casting, and droop when resting."
  ] },
  { v: "10.1.0", date: "2026-10-14", title: "Painted look", items: [
    "Characters, companions and monsters now have soft painted shading built in: tops catch the light, undersides and joints are a little darker, and the lower legs fade slightly toward the ground.",
    "Cloth has folds and stitched hems, leather has pores, creases and worn edges, metal has hammered dents, bright worn edges and the odd patch of rust, and skin has finer texture."
  ] },
  { v: "10.0.0", date: "2026-10-14", title: "Model detail I", items: [
    "Characters have proper hands now: a palm, a group of fingers that curls forward, and a separate thumb, sized to each race.",
    "Characters and monsters further from the camera switch to a lighter version of their model, so crowded towns and big pulls run smoother. You won't notice the switch at normal distances; it happens sooner on Low graphics."
  ] },
  { v: "9.19.0", date: "2026-10-14", title: "Finishing touches", items: [
    "High graphics now has smoother edges and a colour grade that follows the day: warm at sunrise and sunset, cooler and softer at night, duller in bad weather, with a light vignette around the screen edges.",
    "If the game keeps running slowly even at its lowest render scale, it now turns off glow effects, then sun shadows, and tells you.",
    "Phones and tablets with fewer processor cores start on Low graphics automatically."
  ] },
  { v: "9.18.0", date: "2026-10-14", title: "Effects", items: [
    "Spells leave something behind: fire smoulders with rising embers, ice leaves a cold mist, water drips down, earth throws up dust, wind scatters leaves, lightning crackles for a moment, light leaves glowing motes and dark magic leaves shadowy wisps.",
    "Weapon skills now trail the colour of their element, shed sparks from the blade, and finish with a burst and ground ring in that colour.",
    "Melee hits throw sparks (cool white for blades, orange for blunt weapons), and heavy blows kick up dust.",
    "Weather particles: rain splashes, distant lightning with delayed thunder, blowing leaves and dust in wind, sideways snow in blizzards, drifting fog, fireflies on clear field nights, and snowy footsteps."
  ] },
  { v: "9.17.0", date: "2026-10-14", title: "Motion", items: [
    "Emotes are now fully animated: wave, bow, cheer, dance, laugh, nod, clap, point, salute, panic, cry and thumbs up each have their own movement. Using one stands you up if you were resting and turns you to face your target.",
    "Other players in your zone see your emotes play out too."
  ] },
  { v: "9.16.0", date: "2026-10-14", title: "Shadows and depth", items: [
    "Every character, companion and monster now has a soft shadow on the ground beneath it, so they look planted. On the Low setting (where sun shadows are off) this is their only shadow and is a bit darker.",
    "Characters and monsters get a gentle rim of light around their edges that picks up the sun's colour by day and a cool blue at night, so they stand out from the background.",
    "Sun shadows are softer-edged on the High setting."
  ] },
  { v: "9.15.0", date: "2026-10-14", title: "Grounding", items: [
    "Long-bodied monsters (crawlers, worms, sheep and other four-legged beasts, crabs, fish-like monsters and hares) now tilt to follow hills and slopes, so their noses and tails no longer sink into the ground or float in the air.",
    "Checked on the steepest slopes in Rocky Hollow: crawlers, worms, sheep and lizards all stay on top of the ground."
  ] },
  { v: "9.14.0", date: "2026-10-14", title: "Monster proportions", items: [
    "Crawlers are chunkier, stand taller and carry their front segments raised, with longer legs, instead of lying flat.",
    "Bees and hornets have a longer striped abdomen and stinger and smaller, tidier wings.",
    "Snappers and other fish-like monsters have deeper bodies and larger side fins.",
    "Sheep stand a little taller on longer legs with a more compact body."
  ] },
  { v: "9.13.0", date: "2026-10-14", title: "Faces and hair", items: [
    "Eight faces to choose from when you create a character (Bright, Calm, Keen, Freckled, Gentle, Fierce, Sleepy, Proud), each with its own eye colour and shape, brows, lashes and mouth. Existing characters keep the original face; townsfolk, travellers and hired companions now have varied faces.",
    "Four new hairstyles: a long braid tied with a ribbon, a crest (mohawk), twin tails and a topknot. Companions from the Mercenary Hall can have them too.",
    "Character textures are sharper because the texture sheet has room for the new faces."
  ] },
  { v: "9.12.0", date: "2026-10-14", title: "Town buildings", items: [
    "Houses come in three styles: plain plank, and two timber-framed styles with a plastered upper storey, dark corner posts, a mid beam and cross braces.",
    "Every house has framed windows with sills and coloured shutters, a framed door, a stone chimney and a wooden lantern by the door that glows warmly at night. Some have flower boxes under the windows.",
    "Roofs are tiled with overlapping shingles instead of a flat texture.",
    "Barrels and crates are stacked around the houses."
  ] },
  { v: "9.11.0", date: "2026-10-14", title: "Water", items: [
    "Lakes and ponds have a bluer, deeper tint instead of looking grey, and calmer reflections.",
    "A soft band of foam laps around every shoreline and slowly drifts.",
    "Little ripples spread across the water now and then.",
    "Lakes close to a cliff get a waterfall pouring down into them, with spray at the bottom."
  ] },
  { v: "9.10.0", date: "2026-10-14", title: "Plants and props", items: [
    "A second kind of broadleaf tree with a taller trunk, branching limbs and a fuller, layered canopy.",
    "Bushes along the edges of fields and towns, clusters of wildflowers in five colours in the grass, and fallen logs near the field edges (you can't walk through the logs).",
    "Every tree and bush has a slightly different shade of green so woods don't look copy-pasted. Bushes and flowers sway in the wind.",
    "Fewer bushes and flowers on the Low graphics setting to keep phones smooth.",
    "If an area ever fails to load, the game now carries on instead of getting stuck on the loading screen."
  ] },
  { v: "9.9.0", date: "2026-10-14", title: "Terrain detail", items: [
    "The ground now has close-up texture: grass has fine blade streaks, dirt paths and bare earth show grit and pebbles, and the textures fade out smoothly into the distance so far fields don't shimmer.",
    "Steep slopes and cliff faces automatically turn to grey rock with texture that wraps around the cliff instead of stretching.",
    "Caves and crypts get rockier floors.",
    "Works on every graphics setting."
  ] },
  { v: "9.8.6", date: "2026-10-14", title: "Tap to type", items: [
    "Phones: tapping the event log now opens the typing box and keyboard (the phone log used to ignore taps)."
  ] },
  { v: "9.8.5", date: "2026-10-14", title: "Phone buttons", items: [
    "Phones: the Target and Menu buttons are now exactly as wide as the boxes below them, so they no longer overlap the event log.",
    "Phones: tapping the event log (or the bottom-left of the screen when the log is hidden) opens the typing box and the keyboard. Before, the small phone log ignored taps.",
    "Check now only writes its result in the event log instead of also showing it under the command box.",
    "Phones: the Status screen now shows everything: the chosen page on top, then your status sheet (name, jobs, HP/MP/TP, attributes) and the level/EXP box underneath."
  ] },
  { v: "9.8.4", date: "2026-10-14", title: "Five characters", items: [
    "Each account can now have up to 5 characters (was 8). The server enforces it too once the latest setup SQL is run (server version 6). Accounts that already have more keep them but can't make new ones until they're under 5.",
    "Removed the \"Upload to my account\" option from the character list."
  ] },
  { v: "9.8.3", date: "2026-10-14", title: "Phone windows and storage", items: [
    "On phones and narrow screens the main menu now hides while a window (Achievements, Quests, Key Items and so on) is open, so the two no longer overlap. Use Menu or ✕ to go back.",
    "View House only shows what's in storage. Moving items in and out of storage now only works at your residence with Pip.",
    "The event log uses the blue striped style on phones too.",
    "Tapping or clicking outside a window closes it, and tapping outside the main menu closes the menu."
  ] },
  { v: "9.8.2", date: "2026-10-14", title: "Gate halls and phone layout", items: [
    "Every area exit now sits at the end of a narrow hall with rock walls on both sides, and you arrive at the inner end of the matching hall, well inside the area, so you can't back out by accident right after arriving.",
    "Companions of every job now fight in melee while they wait for spells and abilities, as long as it seems safe. They only step back to cast from range when they're hurt or the monster is beating on them.",
    "Phones: the Status screen fits properly. Rows no longer squash together, text is smaller, Play Time reads like 0:07:12, and Guild Rank and Guild Points are separate rows. The main menu is narrower and hides while a window is open.",
    "Back button (◀) on the Status list returns to the main menu. On phones, the Menu button also steps back (window → main menu → closed), and list windows show a ✕ to close.",
    "Companions you hire now stay with you when you log out and back in (a bug was dropping them on load).",
    "Wages are now paid once per real day (24 hours) instead of once per game day, at the same amount as the hiring fee. Tap a companion in the Party box to see the countdown to their next wage and how much it is, pay early, or dismiss them.",
    "Clicking or tapping anywhere outside the target command box closes it.",
    "Fixed the test harness login for the new Play Online / Play Offline screen."
  ] },
  { v: "9.8.1", date: "2026-10-14", title: "Smarter companions", items: [
    "Companions now use any of their job's abilities and spells sensibly: self-boosts when a fight starts, debuffs like Dia, Slow, Paralyze and Blight on the target while they have MP, nukes picked for the target's weakness, and emergency cures when someone is in trouble and no healer is free.",
    "Support companions (such as a support White Mage) now join the fight in melee when nobody needs healing. Healers stay back and keep casting.",
    "Black Mages nuke more often instead of holding most of their MP, while burst specialists still save MP when a skillchain is coming.",
    "If something goes wrong with one companion, the others keep fighting instead of all stopping."
  ] },
  { v: "9.8.0", date: "2026-10-14", title: "Sky and light", items: [
    "A second, higher cloud layer drifts more slowly than the first for depth, and clouds glow orange and pink around sunrise and sunset.",
    "The sun has a soft glow that grows and warms near the horizon. The moon now shows its phase, which changes from one game day to the next.",
    "A horizon haze blends the land into the sky so distant areas fade softly.",
    "Each area has its own air: the Outpost warm, Rocky Hollow golden, the Ashen Marsh hazy green with a shorter view, Frostspire Pass crisp and blue with a longer view, and Saltreach Harbor a salty sea haze.",
    "The stars turn slowly across the night sky.",
    "Phones: the Jump button is gone (Shift+Space still jumps on a keyboard). New Target and Menu buttons sit above the boxes in the bottom right, and tapping anywhere in the event log opens the typing box.",
    "Achievement, item and update notices now use the blue striped style and pop up at the top of the screen.",
    "Fixed the update notice always naming the old Pets update; it now names the current version's update. The Updates list is in newest-first order."
  ] },
  { v: "9.7.0", date: "2026-10-14", title: "Offline play", items: [
    "After Press Start you now choose Play Online or Play Offline. Offline needs no account or internet connection.",
    "Offline characters have their own list, are saved only on this device, and play solo with companions and every non-player system (quests, crafting, gathering, the NPC market, guild bounties and more). Parties with other players, trades, tells, linkshells, search and the players' auction house are hidden.",
    "Offline characters can never be brought online. They are stored apart from online characters, carry an offline mark that the game refuses to upload or load into an online character, and the server itself rejects any save carrying that mark.",
    "The Network box shows Offline while you play offline.",
    "Server owners: run the latest setup SQL (Admin → Copy setup SQL). It adds the server-side offline check (server version 5)."
  ] },
  { v: "9.6.0", date: "2026-10-14", title: "Classic windows everywhere", items: [
    "Every remaining window (Party, Mercenaries, Bestiary, Achievements, Social, Config, Map, Help, Updates, Job, Guild, Auction and more) now uses the classic style: section headings as pale title bars, flat striped rows instead of rounded cards, blue sliders and the same font throughout.",
    "Help sections open as classic headings, and the Help text was rewritten for the current screen: windows in the world, the compass map, talking in the log, Pip for job changes, the daily Mercenary Hall and permadeath, Config instead of Settings, and no more mentions of the old side menu, action bar pages or top-right buttons.",
    "Mercenary roles now read Damage, Tank, Healer and so on.",
    "The welcome message points you to Pip for job changes."
  ] },
  { v: "9.5.1", date: "2026-10-14", title: "Room to breathe", items: [
    "Monster spawn points in every area are now at least 3 map squares apart (the squares shown under the compass, like G-8), and none sit within 2 squares of an area's entrances or exits.",
    "No monster types were lost: each spawn point now takes turns between the monsters that used to live around it, so every creature and notorious monster still appears in its area, just far fewer at once.",
    "Fixed notorious monsters and bosses keep their own spots."
  ] },
  { v: "9.5.0", date: "2026-10-13", title: "Mercenary guild", items: [
    "Brann's Mercenary Hall now has 5 randomly generated fighters for hire each day, with their own names, looks, jobs, roles and personalities. Any job can turn up, with no level requirement, and the list changes at midnight.",
    "Companions always fight at your level and grow with you.",
    "Permadeath: a companion who is knocked out leaves your company for good a few seconds later and can never be hired again. The Mercenary Hall keeps count of the fallen.",
    "Companions you already had stay with you (under the same rules). The old fixed list of named companions is no longer offered.",
    "Safety: if something in the game throws an error, the game now keeps running and writes a short error note in the event log instead of freezing. Please send that note if you see one."
  ] },
  { v: "9.4.0", date: "2026-10-13", title: "Spell scrolls", items: [
    "Spells are now learned from scrolls. Read a Scroll of (spell) from your items to learn it, if any of your jobs is high enough level for it. Spells you already had from your levels are kept.",
    "Pell sells scrolls for spells up to level 10, Vela in Saltreach sells levels 11–17, and any monster may drop a scroll for spells near its level. When you level up, the log tells you which new spells you can now learn.",
    "Walking looks calmer: smaller arm swing and less twisting through the chest.",
    "Space (or Enter with nothing targeted) opens the typing box in the event log. Jump moved to Shift+Space.",
    "Hotkeys have lines: plain 1–9 and 0 fire the Main line, and holding Shift fires the Shift line.",
    "Every window can be used with the arrow keys: ↑ ↓ move through lists (Items, Shop, Quests, Magic, Abilities), Enter chooses. In Equipment the arrows move between the 16 boxes, Enter opens that box's choices, ↑ ↓ pick and Enter equips, ← or Esc goes back. Other windows (Crafting, Config and so on) step through their buttons.",
    "Pip now changes your job (and support job); Tobin still teaches support and advanced jobs. Tab can target Pip.",
    "Closing a window you opened through Pip (or anyone else) no longer opens the main menu; only windows opened from the main menu return to it.",
    "Leaving your residence asks first, just like going in.",
    "The east gate guard and Odette now appear properly instead of being invisible.",
    "Rocky Hollow near the Outpost has fewer monsters spread further apart, and level 1–6 monsters are easier: less HP, weaker hits and easier to land blows on.",
    "Help and Network labels sit in the top border of their boxes. Menu buttons are a darker blue and a little shorter. Scroll bars are blue to match. Crystal and bag info no longer shows at the top of windows."
  ] },
  { v: "9.3.1", date: "2026-10-13", title: "Menu stays open", items: [
    "Choosing something from the main menu (Items, Equipment, Quests and so on) keeps the menu open on the right while the window shows on the left. Pick another entry to switch windows; Esc closes the window and puts you back on the same menu entry."
  ] },
  { v: "9.3.0", date: "2026-10-13", title: "Classic lists", items: [
    "Items is a slim list in the top left (the Commands box shows how full your bag is, like Items 11/30). Point at an item to see its card under the list; choose it to get Use, Eat, Equip, Add to action bar or Drop in a small box.",
    "Shops are a slim Buy/Sell list with prices, your crystals and the item's card underneath. Choose an item to buy or sell one, a few or all of them.",
    "Quests open on Story, Current, Completed (and Guild Bounties when you have any). Pick one to see its description, progress and reward under the list. Esc goes back a level.",
    "The Equipment window now has your status and crystals on the left, the 16 equipment boxes in the middle and the choices and item cards on the right.",
    "Choosing Magic, Abilities or Items from a command menu turns it into a Magic List (or Ability/Item List): coloured orbs by element, the spell's description in the Help bar, and an MP Cost / Next box above the target frame showing the cost and recast time. Magic and Abilities from the main menu use the same lists.",
    "Target and Party are now separate boxes in the bottom right.",
    "Every box (choices, item cards, windows, the quest tracker and the command menus) now uses the same blue striped style as the event log.",
    "The compass map hides while a command menu, choice box or window is open on the left so nothing overlaps.",
    "Enter with nothing targeted now starts typing in the event log. With a person targeted it talks to them; with yourself targeted it opens your own menu.",
    "Monsters that aren't fighting slowly regain their health (about 4% a second once they've gone 5 seconds without being hit)."
  ] },
  { v: "9.2.0", date: "2026-10-13", title: "Windows in the world", items: [
    "Menus no longer cover the screen. Each one opens as a window in the top left with its name in the Commands box and a short description in the Help bar; the old side list of menus is gone. Esc closes the window and returns to the main menu.",
    "Talking to people no longer opens a box in the middle of the screen. What they say appears in the event log, and any choices appear in a small box above the log (↑ ↓ to choose, Enter to confirm, Esc to back out). Merchants with nothing else to say open their shop straight away.",
    "Yes/no questions (log out, selling, invitations and so on) use the same small box above the log.",
    "The event log shrinks to three lines when nothing is happening. Each Esc hides one more line until it's gone; new messages bring it back. The tabs and typing box only show while you're typing (/) or have chat open.",
    "New compass map above the event log: a tilted dish with N, E, S and W, dots for people, monsters and your party, plus the time and your map square (like G-8). Turn it off in Config → Interface. It drops to the bottom when the log is hidden.",
    "The zone name, clock and the 💬 and ☰ buttons are gone from the top right. Open the main menu with Esc, - or by tapping yourself (Main Menu), and open chat with / , L or tapping yourself (Chat).",
    "Current Time writes the Leid'anav date and time and your own date and time to the event log.",
    "Resting now sits you down on the ground with your knees up instead of squatting, and no part of you sinks into the ground.",
    "The Network box lines up with the Commands and Help bars."
  ] },
  { v: "9.1.0", date: "2026-10-13", title: "Main menu window", items: [
    "Esc (with nothing targeted), - or the ☰ button opens the main menu as a command window in the top right under the Network box. It has two pages; ← → or the arrows at the top switch pages.",
    "Page 1: Status, Equipment, Magic, Items, Crafting, Abilities, Party, Trade, Search, Linkshell, Friend List and Map (Residence while you're at home). Page 2: Quests, Key Items, View House, Bestiary, Achievements, Hotkeys, Config, Help, Updates, Current Time, Communication and Log Out.",
    "Settings are now called Config.",
    "New Status screen: choosing Status keeps you in the world and shows your status sheet on the left (with gear bonuses in green beside each attribute), a level box with EXP and the next level, and a Status list on the right: Profile, Job Levels, Combat Skl., Magic Skl., Craft Skl., Currencies and Play Time. Moving through the list shows each page in the middle; Esc goes back to the menu.",
    "Profile shows your title (your most recent achievement) in the Help bar, plus race, home point, guild rank and story progress. Play time is now counted.",
    "New Magic, Abilities and Key Items windows from the menu. Tap a spell or ability to use it.",
    "The Commands label is now its own box, separate from the Help bar.",
    "The map moved to the bottom left and only shows while the event log is hidden."
  ] },
  { v: "9.0.1", date: "2026-10-13", title: "Tidier screen", items: [
    "The event log and typing box slide away when nothing is targeted. They come back when you target something, press / to type, someone talks to you or you find loot, or when you pin them with the 💬 button (or L). Esc hides them.",
    "The Network box is now separate from the Commands bar."
  ] },
  { v: "9.0.0", date: "2026-10-13", title: "Equipment and classic windows", items: [
    "New Equipment window (G) with 16 slots: Main, Sub, Range, Ammo, Head, Neck, two Ears, Body, Hands, two Rings, Back, Waist, Legs and Feet. Tap a box for a pop-up list of what fits, with item cards comparing your choice to what you're wearing.",
    "Attack, Defense and resistance to all eight elements show under the slots. Resistance now reduces elemental damage from monsters.",
    "New gear for the new slots: gorgets and pendants, earrings, capes and mantles, belts and sashes, a shell_shield, a flute and ammo (Pell and Vela). Capes, belts and shields show on your character.",
    "Shields now go in the Sub slot instead of a ring slot; existing saves move them automatically.",
    "Item cards everywhere in the classic style: slot, stats, jobs, level and item level.",
    "The Character window is now just your status sheet and Job Levels (no picture, attributes list or progress list).",
    "Residence storage is a two-column transfer screen: tap an item on either side to move it.",
    "The bestiary only lists creatures you've met."
  ] },
  { v: "8.9.0", date: "2026-10-13", title: "Classic interface", items: [
    "A new interface in the classic style: striped blue panels, white outlined lettering and glossy command buttons throughout, including every menu window and dialog.",
    "Command bar across the top when something is targeted: it explains the highlighted command, with your connection strength and traffic on the right.",
    "HP, MP and TP appear top left while you're fighting. Your status icons sit beside them all the time; the City Blessing shows as a blue crystal.",
    "Bottom right: the Target panel (green name while it's calm, red once it's attacking you, Locked while you're fighting it) and the Party (or Solo) panel.",
    "The event log runs along the whole bottom in bold white lettering; spell casting shows in yellow.",
    "The command menu (left, above the log) has Attack/Disengage, Switch Target, Magic, Abilities, Items and Check, with a cursor and keyboard control. Disengage also lets go of the target. Tap yourself or press Enter with nothing targeted for your own commands.",
    "The action bar, XP bar and bottom crystal/job line are gone. Hotkeys 1–0 still work.",
    "Name plates for players (white with blue edges), people (glowing green) and monsters (red when they're attacking you); turn them off in Settings.",
    "The target cursor is a small crystal arrow: blue when the target is in range, yellow near the edge, red out of range.",
    "Character shows a status sheet (job, sub job, item level, HP/MP/TP, STR to CHR, level, EXP, next level) and Job Levels for unlocked jobs. New CHR stat strengthens songs.",
    "Skills shows Combat, Magic (only magic you know), Craft and Gathering skill sheets with ranks.",
    "Crafting is a new window: an essence slot and 8 ingredient slots, OK and Cancel, a list of what the combination can make, and item descriptions. Recipe notes keep the full list.",
    "The bag is a compact list with names and counts."
  ] },
  { v: "8.8.0", date: "2026-10-13", title: "Leid'anav Reborn: attached bodies", items: [
    "The game is now called Leid'anav Reborn, with a new crystal-and-shield icon in the browser tab.",
    "Every character, NPC and monster model was checked in idle, walking, running, attacking, weapon skill, hit and casting poses. Joints now bend smoothly instead of pulling apart: torsos stay on hips, heads on necks, arms on shoulders, and monster legs, wings, fins and tails stay attached.",
    "Parts that were built floating are now joined: crawler bands, lizard spines, crab eye stalks, cactus needles, mandrake leaf stems, skeleton shoulders, the hind legs of hares and toads, and more.",
    "The big race is broader in the shoulders and bulkier with a smaller head, to match its reference sculpt.",
    "The bestiary now shows a picture of each creature you've met.",
    "Ysolde the stablemaster sticks to mounts now; pets are managed from the Pets window."
  ] },
  { v: "8.7.0", date: "2026-10-13", title: "Social", items: [
    "New Social window: everyone online with job, level, area and linkshell, with Tell, Invite and + Friend buttons and filters.",
    "Friend list with online alerts (/friend).",
    "Linkshells: create one (500 crystals), invite members, promote sack holders, and chat across the whole world with /l. Up to 3 per character.",
    "Looking-for-party flag with a short message (/seek), shown in search.",
    "/search by job, level range, area, name, lfg or here.",
    "Blacklist (/blacklist) hides a player's messages and requests."
  ] },
  { v: "8.6.0", date: "2026-10-13", title: "Player auction house", items: [
    "New 🌐 Players section at the auction house: buy lots that other adventurers have put up, at their prices, with seller names, time left and recent sale prices.",
    "Offer to players: put an item up for other players (3% fee, up to 10 lots).",
    "Sales, purchases and returns go through the game server and a player delivery box, so nothing can be duplicated.",
    "You're told when another player buys your lot, even if you're out in the field.",
    "My listings shows your player lots and market lots separately. The simulated market is unchanged."
  ] },
  { v: "8.5.0", date: "2026-10-13", title: "Server checks", items: [
    "Trades now happen on the game server in one step, so items can't be duplicated or lost if someone disconnects halfway.",
    "The server checks every save: levels above the cap, impossible crystal counts and name changes are refused, and unusual jumps are flagged for the admin.",
    "Admin panel: suspicious saves, banned accounts, a ban/unban box, trade count and a notice when the server setup needs updating.",
    "Banned accounts can no longer sign in to play."
  ] },
  { v: "8.4.0", date: "2026-10-13", title: "Claims and party combat", items: [
    "Monster claims: once a player claims a monster, only they and their party can attack it. Red names are yours or your party's, purple names belong to someone else, and the target window says who.",
    "Skillchains and magic bursts now work between players in a party fighting a shared monster.",
    "Damage from other players shows over the monster in blue.",
    "/assist Name targets what another player has targeted.",
    "Party members' names show in blue in the world.",
    "A notorious monster appearing nearby is announced to everyone in the area."
  ] },
  { v: "8.3.0", date: "2026-10-13", title: "Shared monsters", items: [
    "Monsters are now shared: everyone in an area sees the same monsters, in the same places, with the same HP. Parties can finally fight the same goblin together.",
    "One player's game runs each area's monsters. If they leave or switch away from the game, another player takes over without anything resetting.",
    "Monsters notice, chase and attack any player, and their special moves hit everyone caught in range.",
    "The first player to hit (or be attacked by) a monster claims it; the claimer gets the experience and loot, shared with their party as before.",
    "Spells such as Dia, Slow and Paralyze on a shared monster work for everyone.",
    "/who now shows which player is running the area's monsters. Battlefields stay private."
  ] },
  { v: "8.2.0", date: "2026-10-13", title: "Parties and trading", items: [
    "Party up with other players: invite up to 6 with /invite, the Social menu, or by tapping a player. Accept with the popup or /join.",
    "Party members show in your party frame with HP, MP and TP, and in the Social menu with their area.",
    "Shared experience: kills share XP with party members nearby, based on the highest level member. Bigger parties earn more in total.",
    "Shared loot: every drop goes into a treasure pool everyone nearby can lot on, and crystals are split.",
    "Party kills count toward quests and guild bounties for everyone nearby.",
    "Cure and Protect now work on other players in your party.",
    "Trading: trade items and crystals with a nearby player. Both players see both offers and must accept the same deal.",
    "Tap another player to Invite, Trade, Tell or Check them. Party chat with /p."
  ] },
  { v: "8.1.0", date: "2026-10-13", title: "Other players and chat", items: [
    "You can now see other players in your area: their race, gear and name, walking, riding, fighting, casting and resting in real time.",
    "Chat: type to say something to players nearby (with a speech bubble), /shout for the whole area, /tell Name message for a private message anywhere (/r to reply), and /who to see who's online.",
    "New Chat tab in the log for player messages only.",
    "Monsters aren't shared yet: each player still fights their own copy. Parties, trading and shared monsters come in the next updates."
  ] },
  { v: "8.0.0", date: "2026-10-13", title: "Accounts and the game server", items: [
    "The game now runs on a shared server. Sign in with your email and password on the title screen; creating an account needs the sign-up password from the server owner.",
    "Your characters are saved on the server, so they follow you to any device. An internet connection is required; offline play has ended.",
    "Characters made in this browser before the server can be uploaded to your account once from the character screen.",
    "Character names are unique across the whole server.",
    "System now shows when you last saved to the server, with Save to server now and Sign out. Load from file is gone (saves live on the server now); Download a copy still works as a backup.",
    "Walking looks less stiff: the back sways and twists with each step and the head bobs gently."
  ] },
  { v: "7.0.0", date: "2026-10-13", title: "Living towns and character polish", items: [
    "Characters blink, close their eyes when knocked out and half-close them while resting. Long hair and ponytails sway as you move, and capes stream out behind you when you run.",
    "Townsfolk now work at their posts: Garrick hammers at a new anvil and forge, Pell and the auctioneers count coin at their desks, Maera and Tobin read, the guards keep watch, Rhea and Brann stand with arms folded, and Ilsa scans the sea with a hand over her eyes. They turn to look at you when you come close.",
    "The Outpost and Saltreach are busier: chickens, a dog and a cat in the Outpost, gulls and a harbor cat in Saltreach, and townsfolk walking their rounds.",
    "New town props: Garrick's anvil and forge, desks for the guild and auction house, barrels and crates. They block movement like other furniture."
  ] },
  { v: "6.9.0", date: "2026-10-13", title: "Animation upgrade", items: [
    "Three swing variations for every weapon type (overhead, sweep and backhand for blades; overhead and wide arc for axes and clubs), so auto-attacks no longer look identical.",
    "Weapon skills now animate by tier: quick flurries for the first tier, a stepping lunge for the second, a full spin for the third, and the leaping slam for the strongest.",
    "Casting poses depend on the magic: hands raised together for healing and buffs, an outstretched hand for enfeebles, hands low and hunched for dark magic, arms thrown wide for summons, and a swaying performer's stance for songs.",
    "Characters fidget when idle (looking around, stretching, shifting weight, scratching their head), shuffle their feet when turning on the spot, flinch away from the side they were hit on, buckle at the knees before falling when knocked out, and get up from a kneel when raised.",
    "Animations keep playing while the defeat window is open."
  ] },
  { v: "6.8.0", date: "2026-10-13", title: "The world, repopulated", items: [
    "Monsters are now placed by difficulty. Near the Outpost gate you'll only meet peaceful critters (bees, crawlers, sheep, mandrakes); goblins, worms, orcs and the undead are further in.",
    "The same kinds of monster get new names and colours the deeper you go: Grass, Bog and Rime Crawlers; Honey Bees, Marsh Hornets and Frost Wasps; Hill, Bog and Frost Lizards; Pond, Mud and Ice Crabs; Lake, Marsh and Ice Snappers; Meadow Sheep and Mountain Rams; Mandrakes and Marsh Mandrakes; Shroomlings and Bog Shrooms; Stonechuckers, Bombs and Treants of the frost.",
    "Bats, Ice Bats and Bog Leeches are now critters too: they leave you alone unless you attack.",
    "New notorious monsters: the Silkmother (a giant crawler in Burrow Flats; Silkweave Mantle, Silk Gloves) and Gorruk the Warlord (the marsh orc camp; Warlord's Cleaver, Warlord's Band).",
    "New quest: Pell's Silk for Sale (6 Grass Crawlers). New guild bounties for crawlers, bees, lizards, orcs, Reefkin, Crag Talons, frost bombs, the Silkmother and Gorruk."
  ] },
  { v: "6.7.0", date: "2026-10-13", title: "Orcs, Reefkin, Crag Talons and more", items: [
    "New aggressive families with their own looks: Orc Grunts and Orc Stonechuckers (who throw from range), Reefkin fish-folk, Crag Talons and Crag Chanters (beaked bird-folk), Elder Treants, Needlekin (cactus folk who fire needles from range) and Ember Bombs (which explode when cornered).",
    "Wandering Saplings, young treants, are peaceful until bothered.",
    "Where to find them: saplings, orcs and night-time bombs deeper in Rocky Hollow; Reefkin, orc war bands, Crag Talons, an Elder Treant and Needlekin in the Ashen Marsh.",
    "New materials: Orc Tooth, Reefkin Scale, Crag Feather, Heartwood, Cactus Needle and Bomb Ash. New bestiary entries."
  ] },
  { v: "6.6.0", date: "2026-10-13", title: "New critters", items: [
    "Nine new monster families with their own models and animations: Honey Bees, Grass Crawlers, Meadow Sheep, Mandrakes, Hill Lizards, Pond Crabs, Shroomlings and Lake Snappers in Rocky Hollow, and Marsh Longnecks in the Ashen Marsh.",
    "All of them are peaceful until attacked. Bees, sheep and mandrakes defend each other. Crawlers spit Sticky Thread (slow); mandrakes scatter Dream Dust (companions may doze off); lizards whip their tails; shroomlings puff a Spore Cloud; longnecks stomp.",
    "New materials: Honeycomb, Wool Tuft, Lizard Skin, Crab Shell, Crawler Cocoon, Mandrake Leaf, Spore Cap and Longneck Hide, plus bestiary entries for all nine.",
    "Boulders now block movement, and the camera no longer passes inside houses when you're outside."
  ] },
  { v: "6.5.1", date: "2026-10-13", title: "Pet and discovery changes", items: [
    "Pets no longer give any bonuses; they're companions only.",
    "Pets are now very rare drops instead of shop purchases: hares, bats, worms and ice bats drop kits about once in 250 kills, notorious monsters a few percent of the time, and the Tide Wisp is a rare catch. Ysolde no longer sells pets and the Frost Wisp left the guild shop. ",
    "Discovering landmarks no longer gives experience, and achievements no longer pay crystals. Both are for bragging rights only."
  ] },
  { v: "6.4.0", date: "2026-10-13", title: "Five Races and the City Blessing", items: [
    "Five playable races at character creation: Human (balanced), Elari (tall, long-eared; strong magic and bow accuracy, less HP), Pipkin (small and doll-like, with big round eyes and rosy cheeks; the best casters, fast, but weak and frail), Ursan (huge gray-green lizard-skinned brutes with a tail; the most HP and strength, poor magic, a little slow; male only) and Nekari (cat-eared and tailed; fast and nimble with good magic, slightly less HP; female only).",
    "Race changes your body shape, ears and tail, and gives modest stat bonuses and penalties. Existing characters are Human.",
    "City Blessing: gate guards now stand at every town exit. Monsters only yield elemental essences while you carry the blessing, which lasts 60 minutes at Copper rank and 30 minutes more per guild rank (up to 3½ hours). Talk to a guard before you head out.",
    "The character sheet and roster now show your race."
  ] },
  { v: "6.3.0", date: "2026-10-13", title: "The Auction House", items: [
    "Auction houses open in Ashenreach Outpost (Corvin, west of the crystal) and Saltreach Harbor (Selene, by the crystal).",
    "Prices move all the time. Each item drifts up and down over the game day, daily market news pushes one category up and another down, and your own buying and selling nudges prices too.",
    "Buy: browse Materials, Consumables, Weapons and Armor. Each item has a limited stock that refreshes every game day, a price chart for the last three game days and a trend arrow.",
    "Sell: put up to " + 7 + " lots up for auction at your own price (3% listing fee). Cheaper lots sell faster. Lots keep selling while you're away; listings never expire; withdraw one and it goes to your delivery box.",
    "Items sold in shops never fetch more than the shop price, and Rare, Ex and key items can't be auctioned. New achievement: Market Savvy."
  ] },
  { v: "6.2.0", date: "2026-10-13", title: "The Main Story: Embers of Ashenreach", items: [
    "A main story in eight chapters. Ash is falling over the Outpost, and the trail leads from the Old Fort Ruins through the Goblin Den, the Sunken Crypt, the Drowned Chapel and Saltreach Harbor to the top of Frostspire Pass.",
    "Captain Rhea starts it at level 3. Chapters unlock at levels 3, 7, 10, 12, 14, 16 and 19. Talking to the right person, reaching the right place or defeating the right foe moves the story on, with story scenes along the way.",
    "The Quests window now shows your current story chapter and goal at the top. People with the next story scene have a ❗ over them.",
    "Story foes: Rimefang shows himself when the story brings you to Icefall Camp, and a new boss, the Ashen Herald, waits at the Summit Overlook. It drops the Cinderweave Mantle.",
    "Finishing the story earns the Ember of Ashenreach ring and the Keeper of the Embers achievement."
  ] },
  { v: "6.1.0", date: "2026-10-13", title: "Dark Knight and Bard", items: [
    "New advanced job: Dark Knight (Tobin's The Shadowed Path, level 10). Scythes, Last Resort, Soulfire and Blood Blade, plus dark magic: Blight, Drain, Mind Drain and Stun.",
    "New advanced job: Bard (Tobin's A Traveler's Song, level 10). Party songs for attack, accuracy, attack speed, HP and MP over time; Drowsy Lullaby puts a monster to sleep; Encore speeds up your singing.",
    "New weapon type: scythes, with four weapon skills (Slice, Nightreap, Spiral Reap, Grim Harvest). Bronze, Iron and Steel Scythes at Pell's, the Rimefrost Scythe at Vela's.",
    "New gear: Shadow Plate, Minstrel's Coat (Pell) and Troubadour's Coat (Vela). Dark Knights can wear warrior armor and use swords and great axes; Bards can wear red mage clothing and use daggers.",
    "New companions at the Mercenary Hall: Mordrin, a Dark Knight, and Lyra, a Bard who keeps two songs on the party and lulls extra monsters to sleep. Each joins once you've unlocked their job."
  ] },
  { v: "6.0.0", date: "2026-10-13", title: "The Adventurers' Guild", items: [
    "Maera has opened the Adventurers' Guild in Ashenreach Outpost, just west of Captain Rhea.",
    "Three bounties go up every day (midnight UTC). Accept up to three at a time, defeat the monsters anywhere in the world, and turn them in to Maera for guild points, crystals and experience.",
    "Six guild ranks: Copper, Bronze, Iron, Silver, Gold and Mythril. Each rank brings harder bounties, including hunts for notorious monsters.",
    "Spend guild points on guild rewards: Potions, Ethers, Chapel Sigils, and five pieces of guild gear (Guild Ring, Pathfinder Boots, Silver Insignia, Guild Greatcoat, Mythril Crest).",
    "Three new achievements: On the Books, Silver Standing and Mythril Legend."
  ] },
  { v: "5.9.0", date: "2026-10-13", title: "Level 20 and Frostspire Pass", items: [
    "Level cap raised to 20.",
    "New area: Frostspire Pass (levels 15–20), through the east exit of Saltreach Harbor, with five landmarks and falling snow. Blizzards thicken the air.",
    "New monsters: Snow Hare, Ice Bat, Frost Goblin, Ice Wight and Glacier Worm. New notorious monsters: Rimefang and The Frost Wight, with the Frost Ring, Rimefang's Axe and the Wight Shroud.",
    "New spells and abilities: Cure IV (WHM 19), Thunder II (BLM 17), Fire III (BLM 20), Stone Sprite (SMN 15) and Warcry (WAR 15, +20% attack for nearby allies).",
    "Tier-four weapon skills at skill 75: Vorpal Arc, Shadow Fang, Moonfall, Earthshaker, Ruinous Cleave, Thousand Palms and Starfall Arrow.",
    "Frostforged gear (level 16–17) and the Fur Hat at Vela's in Saltreach. New quest: Ilsa's Frozen Cargo. New achievements for reaching level 20 and entering the pass."
  ] },
  { v: "5.8.0", date: "2026-10-13", title: "Battlefield: the Chapel Depths", items: [
    "New battlefield: use a Chapel Sigil at the sealed door in the Drowned Chapel (Ashen Marsh) to fight the Tidebound Priest, a level 16 boss with summoned Drowned, a Maelstrom area attack and an enrage, against a 15-minute timer.",
    "Win one of five new level 15 treasures (Tide Crown, Abyssal Staff, Drowned Blade, Priest's Mantle, Tidebreaker Bow) plus crystals and XP. New achievement: Tidebreaker.",
    "Chapel Sigils drop from the Drowned.",
    "Screen changes: your XP bar now sits under your health in your party frame; on phones the chat log sits in the bottom-left corner and the action bar stacks three wide on the right.",
    "The title screen\u2019s Visitors box counts how many times the game has been opened (once per browser tab per day). UPLINK: connected. OFFLINE: showing the last count seen. Click it (or press Enter on it) for Visitor Origins: a globe you can drag, scroll or pinch to zoom, with pins and arcs from your country, a Night shade, Per 1M shading, a Replay of how visits grew and a Sound toggle. Unknown visits sit on the moon.",
    "Visitor Origins side panel: <b>Overview</b> (top origin, latest contact, your country's rank, farthest origin, visit streak, next visit and country goals, world reach, countries reached out of 195 with a Missing list, a continent bar you can tap to filter, badges and Save Share Card), <b>Trends</b> (last 30 days, arrival hour in your time, weekday average, a 365-day calendar, desktop vs mobile, and the order countries first arrived) and <b>Origins</b> (search, sort, continent filter, Compare two countries and a country card you can share). Close with ✕, Close or Esc.",
    "Area exits are mountain passes: the slopes on either side rise unevenly in rocky ledges scattered with boulders, and the haze beyond the pass marks the way to the next area. You arrive at the inner end of the pass.",
    "Monster spawn points are at least 3 map squares apart and never within 2 squares of an entrance or exit. Each point takes turns between the creatures that live in that part of the area.",
    "Monsters only show on the minimap when they're near you (or fighting your party, or targeted).",
    "Character creation now starts as male with the second-lightest skin tone."
  ] },
  { v: "5.7.0", date: "2026-10-13", title: "Ranger and Summoner", items: [
    "New advanced job: Ranger. Bows (Shortbow, Yew Bow, Steel Longbow) fire from range, so you can stay back while the monster comes to you. Sharpshot, Barrage and Shadowbind; weapon skills Piercing Arrow, Flaming Volley and Gale Arrow. Arrows streak across to the target.",
    "New advanced job: Summoner. Call an Ember, Frost or Gale Sprite to fight beside you (it joins your party frame and drains a little MP every 3 seconds). Blood Pact makes it unleash its element; Elemental Siphon pulls MP back; Release sends it home.",
    "Unlock both from Tobin at level 6: Steady Aim and The Calling. New gear: bows, Hunter's Coat, Sprite Staff, Evoker's Robe.",
    "New companion: Corin the Ranger (unlocked with the job). New achievements: First Calling and Sharp Eye.",
    "The target frame's in-range check now knows about bow range. New icons for every job ability and tier II spell."
  ] },
  { v: "5.6.0", date: "2026-10-13", title: "Mounts: stable, saddle and the Hollow Run", items: [
    "Ysolde's stable: five Thornstrider coats to buy and switch between, and a Swift Saddle (+15% riding speed).",
    "The Hollow Run: a timed ride through five checkpoints across Rocky Hollow, with gold, silver and bronze medals that pay out the first time and a saved best time.",
    "Better fitting gear: belts and robe sashes now hug the waist, robe and tunic skirts no longer flare out from the body, shoulder pads are smaller and sit on the shoulder, weapons are scaled down to fit the hand, and sheathed weapons rest against the back.",
    "Monster dots on the minimap no longer reveal how tough they are (orange for hostile, tan for peaceful). The Mount button only shows on phones; use R on a keyboard.",
    "New achievements: Thornstrider Racer and Saddle Sore."
  ] },
  { v: "5.5.0", date: "2026-10-13", title: "Saltreach Harbor", items: [
    "New town: Saltreach Harbor, south of the Ashen Marsh, with docks, boats, a home point crystal and its own trade board.",
    "New people: Ilsa the harbor master (two quests), Marn the fishmonger (rods, bait, cooking supplies, meals) and Vela the outfitter (level 13–14 gear for every job).",
    "New fish: Harbor Bream, Sea Bass and the rare Tidecaller Tuna. New Sea Rod (+10% catch rate) and a Grilled Sea Bass recipe.",
    "New achievements: Sea Air and Tidecaller."
  ] },
  { v: "5.4.0", date: "2026-10-13", title: "Food and cooking", items: [
    "New craft: Cooking. Seven recipes from Grilled Minnow to the Pike Feast, made from your catches, herbs, Grain Flour and Rock Salt (new at Pell's).",
    "Meals give 30 real minutes of bonuses such as HP, MP, Attack, Defense and stats. One meal at a time; the Well Fed buff shows on your party frame.",
    "The Trade Board can ask for Carp Stew and Herb Bread. New achievements: Well Fed and Head Chef.",
    "Cleaner screen: the action bar hides empty slots (assign actions from the Action Bar menu, B), the \"Solo. Hire companions\" note is gone, and the Quests and Sound buttons are removed from the top right (quests are on J and in the menu; sound is in Settings)."
  ] },
  { v: "5.3.1", date: "2026-10-13", title: "Fix: starting a new character on phones", items: [
    "Fixed: pressing Begin your journey could drop you back on the character screen when the browser's storage for the site was full or blocked (other pages on the same web address share that space). The game now starts anyway, warns you that progress can't be kept, and points you to System → Save to file.",
    "The game also stops writing a second backup copy of your save, which halves how much storage it uses.",
    "New title screen: the game opens on the title with a Press Start button, then shows your characters."
  ] },
  { v: "5.3.0", date: "2026-10-13", title: "Fishing and weather", items: [
    "Fishing: buy a Willow Rod and bait from Pell, cast at any pond or lake, and reel in when something bites. Seven fish across the Outpost, Rocky Hollow and the Ashen Marsh, including two rare catches. Fishing skill shows in the Skills tab.",
    "Weather: outdoor areas now have clear skies, clouds, rain, wind, fog and thunderstorms that change every few game hours. Rain falls, storms flash and rumble, fog closes in, clouds race in the wind.",
    "Weather affects magic: rain, wind and storms boost water, wind and lightning spells by 10%.",
    "Two new achievements: Angler and The Big One. The Trade Board can now ask for fish."
  ] },
  { v: "5.2.0", date: "2026-10-13", title: "Treasure pool, Trade Board and the Forge", items: [
    "Treasure pool: with companions in your party, equipment drops go into a pool above the chat. Lot or Pass; companions lot on upgrades for their job and wear what they win.",
    "Trade Board in the Outpost: three supply requests a day for crystals and XP.",
    "Garrick the smith: augment any equipment with up to two random stat bonuses, or reforge to reroll them. Augments show in the item details.",
    "Three new achievements: Odd Jobs, Tinkerer and Lucky Roll.",
    "Tab in town skips signs and boards and goes straight to people."
  ] },
  { v: "5.1.0", date: "2026-10-13", title: "Thief and Monk", items: [
    "New advanced job: Thief. Daggers (A), Steal (lift an item off a monster), Sneak Attack (next hit is a sure critical with bonus damage), Flee (run 80% faster). Thieves crit 5% more often, and Treasure Hunter raises drop chances by 20% while you're a Thief.",
    "New advanced job: Monk. Hand-to-Hand (A) with Martial Arts (faster, harder fists), a 14% chance to follow up with a kick, Boost (next hit +50% and extra TP), Focus (accuracy and crits) and Chakra (heal yourself). Monks raise their fists in a boxing guard.",
    "Unlock both from Tobin at level 6: Light Fingers (3 Goblin Pouches, 1 Bat Wing) and The Open Hand (2 Bone Chips, 3 Healing Herbs).",
    "New weapon skills: Quick Sting, Venom Bite, Gale Edge (dagger) and Twin Fist, Rising Knee, Iron Palm (hand-to-hand).",
    "New gear: Bronze, Iron and Steel Daggers; Leather Cesti, Iron Knuckles and Steel Claws; Brigand Vest and Training Gi. Warriors, Red Mages and Black Mages can use daggers too.",
    "New companions: Wren the Thief and Tamsin the Monk (unlocked with their jobs)."
  ] },
  { v: "5.0.0", date: "2026-10-13", title: "Level 15 and the Ashen Marsh", items: [
    "Level cap raised to 15 for every job. XP for levels 11–15: 4,450 · 5,400 · 6,450 · 7,600 · 8,850.",
    "New area: the Ashen Marsh, south of Rocky Hollow (levels 9–16). Misty ponds, a sunken causeway, a goblin stilt village and a drowned chapel.",
    "New monsters: Bog Toad (a brand-new model), Bog Leech, Mire Goblin, the Drowned and Reed Hares. Two notorious monsters: Old Croaker and Mirelord Gax.",
    "New spells: Cure III (WHM 13), Banish II (WHM 15), Stone II, Water II, Aero II, Fire II and Blizzard II (BLM 11–15; Stone II for RDM at 15). Paladins learn Cure II at 11, Red Mages at 14.",
    "New gear at level 10–14: Steel Sword, Steel Greataxe, Oak Staff, Oak Club, Chain Mail, Wizard's Robe, Iron Helm and Wool Hat in Pell's shop; Croaker Charm, Gax's Cleaver and Mire Mantle from the new NMs.",
    "New quests: Into the Mire (Captain Rhea) and The Mirelord (Brann). Captain Rhea now lists her other jobs alongside her first one.",
    "Bestiary gains 7 entries; two new achievements (Veteran, Into the Mire)."
  ] },
  { v: "4.9.0", date: "2026-10-13", title: "Companions 2.0, bestiary and achievements", items: [
    "Social menu (P), Party section: set your companions' stance (Assist, Follow, Hold), give them gear from your bag and see bond and wages. /stance works too.",
    "Bond: companions grow closer as you fight together. Each bond level up to 5 adds 3% to their stats and unlocks a personal line.",
    "Wages: hiring fee covers the first game day, then each companion takes a daily wage. If you can't pay, they head back to the Mercenary Hall.",
    "Bestiary (Y): creatures are recorded when you meet them, with more detail as you defeat them.",
    "Achievements (O): 29 to unlock.",
    "The command box for a targeted monster now sits in the bottom-right corner. The round Attack, Target and Talk buttons are gone (phones keep Jump).",
    "Smoother limbs: arms and legs now bend at the elbows, knees, shoulders and hips instead of hinging like a doll's, and walking bends the knees and elbows more.",
    "You can no longer walk through trees, lamp posts or torches.",
    "Elemental crystals are now Fire, Wind, Earth and Water Essence. Crystals are still the currency.",
    "Leaving the residence no longer stalls: the room uses fewer lights and the game warms up graphics while the loading screen is still up."
  ] },
  { v: "4.8.1", date: "2026-10-13", title: "Hotfix: aggro, targeting, residence", items: [
    "Monsters are aggressive again. Only critters (hares) are peaceful until attacked. Goblins see a little farther and wider, and worms now also hear you walking nearby. Detection ranges stay hidden.",
    "Targeting a monster opens a command box under the target frame: Attack, Magic, Abilities and Inspect. Inspect tells you how tough it looks and whether it's hostile. Esc or ✕ closes it.",
    "Monster levels and toughness colours are no longer shown on names or the target frame (notorious monsters still glow orange). /check gives the same reading as Inspect.",
    "Names over monsters and townsfolk only show when you target them. A ❗ still marks people with work for you.",
    "Quest offers end with \"Will you accept this quest?\" and a Decline button.",
    "Character creation: choose height (short to very tall) and build (slim to heavy), and a Randomize all button.",
    "Helmets and caps sit higher so you can see your character's eyes.",
    "Residence: the floor no longer flickers, the ceiling beams are gone, and the camera stays inside the room. The door asks before you go in, and leaving no longer drops you back on the doorstep.",
    "Your location saves every 15 seconds and when you close or hide the tab. Logging back in puts you where you left off."
  ] },
  { v: "4.8.0", date: "2026-10-13", title: "Phase 7: test and tune", items: [
    "Performance settings: draw distance (near / normal / far) hides far monsters and name plates; auto resolution lowers the render scale when the frame rate drops below about 28 fps and raises it again when there's headroom; an FPS counter (also /fps).",
    "Phones with little memory now start on Low graphics automatically.",
    "Balance check with the new /rest: 30-minute test runs reach level 4–6 with 0–3 defeats, by day and by night, so night difficulty is left as is."
  ] },
  { v: "4.7.0", date: "2026-10-13", title: "Phase 6b: gathering, crafting, gardening", items: [
    "Gathering: Mining, Logging and Harvesting points in Rocky Hollow and the Goblin Den (rocks with ore, log piles, herb patches). Each needs a Pickaxe, Hatchet or Sickle from Pell. Tools break 25% of the time, less as your gathering skill rises. Points run dry after 1–3 uses and reappear elsewhere 45 s later.",
    "Crafting (N or the Crafting tab, or /craft): Smithing, Woodworking, Clothcraft and Alchemy with 23 recipes. One elemental essence plus ingredients, 3 seconds, anywhere outside combat. Success starts at 65% and moves 7% per skill level; working above a recipe's level can make high-quality +1 items. Failure breaks the crystal and loses some ingredients. Skills cap at 20.",
    "Gardening: place a Flowerpot at home, plant seeds, water at each of three 10-minute real-time stages, and feed an elemental essence for a bigger harvest. Herb Seeds, Ash Saplings and Wildgrass Seeds (grows essences) from Odette; Moonbloom Seeds are a rare drop.",
    "New quest: Green Thumb (Pip): harvest a flowerpot. Make It Home now rewards a flowerpot and herb seeds.",
    "Healing effects no longer play when there's nothing to heal: Cure on a full-HP target shows 'No effect', potions and ethers won't be used at full, and the crystal only sparkles if someone needed it.",
    "Fix: the loading-screen model now only shows on larger screens, and its 3D view is released after loading, to stop phones running out of graphics memory on zone changes."
  ] },
  { v: "4.6.4", date: "2026-10-13", title: "Creation fixes", items: ["Hair style and colour now update on the character creation preview (and the character tab preview refreshes properly when gear changes).", "Male and female characters have their own hair style lists (male: short, spiky, long, ponytail, shaved; female: long, ponytail, bob, bun, short)."] },
  { v: "4.6.0", date: "2026-10-13", title: "Phase 6a: your residence, Pip and storage", items: [
    "Your residence: the door is on the west cottage of the Outpost. Pip the Nubbin keeps it. Odette sells furniture by the west wall.",
    "Storage with Pip: 20 slots, plus 10 for a placed Storage Chest, 5 for a Bookshelf and 15 for a Wardrobe. You can't pack a piece away if your stored items wouldn't fit.",
    "Arrange furniture on the 10×8 floor grid: pick a piece, tap a tile; tap a placed piece to rotate or pack it away. Rugs can sit under other pieces. Furniture is solid and shows in 3D.",
    "New quest: Make It Home (Odette): place two pieces of furniture.",
    "Townsfolk have bedtimes: Ysolde turns in at 19:30, Tobin at 20:00, Pell at 21:00, Odette at 21:30, Rhea at 22:00, Brann at 23:00, and each walks home, then back out in the morning. You can't trade or talk while they're indoors.",
    "Some monsters are peaceful until attacked (low-level goblins and worms in the Hollow); the target frame says passive. Monsters now spread out more and wander wider.",
    "Detection types and aggro rings are no longer shown. Learn each monster by watching it.",
    "Only notorious monsters drop equipment; regular monsters drop materials and consumables.",
    "Money is now crystals instead of gil.",
    "Home points exist only in towns; the Rocky Hollow crystal is gone.",
    "Menus: Help, Updates, System and Credits are buttons under Settings. Controls and About moved into Help and Credits. Nothing uses browser pop-ups any more: confirmations are in-game.",
    "Title screen and Credits carry the maker's links.",
    "Loading screens show a random character or monster from the game, slowly turning, with a line about it.",
    "The Rest tip and other loading tips mention that standing still only trickles.",
    "New characters start with only their race's clothes, a Turnip weapon for their job (Warrior sword, Thief knife, White Mage rod, Black Mage staff; not sold, auctioned, dropped or crafted), no helmet, and an empty bag (no potions). Changing jobs never hands out equipment; buy or earn it.",
    "Take off body or leg armor and your character shows underwear: white boxers for men; for women a smoky black triangle bikini top that ties behind the neck and across the back, and a matching string thong with a small front triangle, bows on each hip, a waist string that sits on the waist above the buttocks and dips in a V at the back, and a black string running down between the buttocks. Each slot is independent."
  ] },
  { v: "4.5.0", date: "2026-10-13", title: "Phase 5d: the Sunken Crypt", items: [
    "A new dungeon under the Goblin Den's Bone Pit: entrance hall, Brazier Hall, the crossroads, the Sentinel's room to the north, the vault to the south and the throne room. Levels 9–12.",
    "Brazier puzzle: light the four braziers in the order the worn inscription gives. A wrong order snuffs them and raises two skeletons; the right order opens the sealed gate.",
    "The Crypt Sentinel (level 11) guards the north room and drops the Crypt Key, a key item that opens the throne door.",
    "The Hollow King, level 12. He calls two Royal Guards at 66% and 33% HP and enrages below 20%. Comes back every 10 minutes of real time. Drops the Hollow Crown and the King's Blade.",
    "Treasure chests: two in the Sentinel's room, a richer one in the vault, and the Royal Coffer that unseals once the King falls. They refill after 20 real minutes.",
    "New quest: The Hollow King (Captain Rhea, level 9, after The Warden's Vigil). Reward: 2,000 XP, 3,000 crystals and the Ashen Medallion.",
    "Six crypt landmarks for discovery XP, the crypt music, stone pillars, portcullis gates and a throne.",
    "Character creation now says Sex: Male or Female.",
    "Right-click menus and accidental text selection are turned off; only the chat box selects text.",
    "Feet no longer sink into slopes: characters stand on the highest ground under them."
  ] },
  { v: "4.4.0", date: "2026-10-13", title: "Phase 5c: eleven quests", items: [
    "Five new quests. Pell: Herbs for the Stall (3 Healing Herbs; pays crystals plus a pickaxe and hatchet). Brann: Night Wings (defeat 4 Cave Bats). Captain Rhea's chain: Bones in the Ruins (5 Wandering Bones at the Old Fort Ruins, level 4), Grimtooth's Bounty (level 6), The Goblin Chieftain (now level 7, after the bones) and The Warden's Vigil (defeat the Ossuary Warden, level 8).",
    "Kill quests count in the chat log and the tracker as you go, and the NPC's ❗ returns when you're ready to report.",
    "Quest givers show every job they have for you in one conversation; progress lines tell you what's left.",
    "A few more low-level monsters near the west gate of Rocky Hollow, so the first levels go quicker."
  ] },
  { v: "4.3.0", date: "2026-10-13", title: "Phase 5b: Paladin and Red Mage", items: [
    "Two advanced jobs. At level 6, Tobin offers The Oath of Steel (Paladin: 2 Bone Chips, 1 Iron Ore) and Scarlet Lessons (Red Mage: 2 Worm Silk, 1 Fire Essence, 1 Water Essence).",
    "Paladin: sword A, Cure at 5, Flash at 7 (blinds and draws heavy enmity), Protect at 9; abilities Sentinel (Defense +50%, double enmity) and Shield Bash (damage, interrupts TP moves and spells). Kite Shield in the accessory slot.",
    "Red Mage: Dia, Cure, Stone, Water, Aero, Fire plus Slow (attacks 25% slower) and Paralyze (lost swings); Convert at 8 swaps HP and MP. Scarlet Tabard with a feathered hat.",
    "Dorn (Paladin tank) and Lisette (Red Mage hybrid) can be hired from Brann once their job is unlocked. Dorn uses Flash, Sentinel, Shield Bash and self-Cures; Lisette fights in melee, keeps Dia, Slow and Paralyze up, nukes and backs up the healer.",
    "New skills: Enfeebling and Enhancing Magic. White Mages learn Protect at 7.",
    "Monster debuffs show as chips on the target frame with their time left.",
    "Either advanced job can also be set as a support job once unlocked."
  ] },
  { v: "4.2.0", date: "2026-10-13", title: "Phase 5a: a bigger world", items: [
    "Character creation: choose a name, job and appearance before you start. Race, gender and name are permanent, but the town barber can change your face, hair, hair colour and size later. Keep up to 8 characters and pick one on the character select screen each time you play, like an MMO. System → Change character logs out to that screen.",
    "Chat commands: type in the box under the chat log (or press /). /rest sits you down to recover HP and MP quickly; standing still now only recovers a little. /help lists everything, including /target, /check, /cast, /ws, /item and emotes (/wave, /bow, /cheer, /dance, /laugh, /nod, /clap, /point, /salute, /panic, /cry, /thumbsup, /shrug, /think, /beckon, /stretch, /kneel, /flex), which play a short animation that others nearby can see.",
    "A Rest action is on page 2 of the action bar.",
    "Real loading screens: every area change shows a progress bar that moves while the land is shaped, instead of freezing.",
    "New-version popup: the game checks for updates and offers to reload. After an update, a what's-new card shows the changes.",
    "Jumping has a real animation: crouch, tuck, arms up, land.",
    "Quests no longer appear in the journal until you've accepted them from someone.",
    "Rocky Hollow is now four times larger (3200×2200): Shepherd's Meadow, Mirror Lake, Burrow Flats, Reed Pond, the Old Fort Ruins and a Goblin Camp, with rocky outcrops.",
    "The Goblin Den is now four chambers joined by passages: Den Mouth, Underground Pool, Bone Pit and the Chieftain's Throne.",
    "Notorious monsters are live. Grimtooth, Duskwing, King Wiggles and the Ossuary Warden pop from placeholder monsters. Their cooldowns run on the real clock, so a defeated NM stays down while you're offline.",
    "Drop tables reworked to MMO rates: materials 15–40%, uncommon items 5–10%, gear 1–5%, NM and boss uniques 30%.",
    "Seven new gear drops from regular monsters, from the Hare Charm to the Raider Helm.",
    "Item rarity colours: common white, uncommon green, rare blue, epic purple. Rare items can only be held once; Ex items can't be sold.",
    "EXP chains: defeat monsters back to back (within 60 s) for +10% XP per chain, up to +50%. The counter sits next to the XP bar.",
    "Discovery XP: find the 11 landmarks across Rocky Hollow and the Goblin Den for bonus XP.",
    "Smoother XP curve: 200 XP for level 2 up to 3,600 XP for level 10.",
    "Tab now targets the closest person in town, and the closest enemy in the field; press again within 2 s to cycle by distance.",
    "Companions catch up if they get left behind, and monsters stuck on a wall go home.",
    "New Help (H) and Updates buttons."
  ] },
  { v: "4.1.0", date: "2026-10-13", title: "A new name", items: [
    "The game is now called Untitled Solo RPG. Ashenreach Outpost keeps its name.",
    "The title screen shows the version and build time.",
    "Old saves and save files still load."
  ] },
  { v: "4.0", date: "2026-10-13", title: "Phase 4: interface and sound", items: [
    "Modern MMO HUD: party and target frames, minimap, quest tracker, action bar, chat tabs, toasts and banners.",
    "System menu with character preview, inventory, skills, action bar editor, quests, map with fog of war, settings and system.",
    "Music, ambience and sound effects for every zone, time of day and battle.",
    "Loading screens, Begin/Continue on the title screen, and jumping."
  ] },
  { v: "3.0", title: "Phase 3: characters and effects", items: ["Detailed characters, monsters and the Thornstrider mount, with gear that changes your look.", "Procedural animation, spell and skillchain effects, weapon trails.", "Riding License quest."] },
  { v: "2.0", title: "Phase 2: the 3D world", items: ["3D terrain, trees, water reflections, a physical sky, sun, moon and stars that follow the game clock.", "Classic MMO camera and touch controls."] },
  { v: "1.0", title: "Phase 1: the rules", items: ["Combat, TP, weapon skills, skillchains, magic bursts, enmity, con colours and aggro.", "Hired companions, standing regen, home points, skills, support jobs and the real-time clock."] }
];

function verNum(v) { return String(v).split(".").reduce((n, x) => n * 1000 + (parseInt(x, 10) || 0), 0); }
function updatesSorted() { return UPDATES.slice().sort((a, b) => verNum(b.v) - verNum(a.v)); }
function tabUpdates() {
  let h = '<div class="sub" style="margin-bottom:8px">' + BUILD_INFO + "</div>";
  for (const u of updatesSorted()) h += '<div class="upd"><h4>v' + u.v + " · " + esc(u.title) + (u.date ? "<small>" + u.date + "</small>" : "") + "</h4><ul>" + u.items.map(i => "<li>" + esc(i).replace(/&lt;(\/?)b&gt;/g, "<$1b>") + "</li>").join("") + "</ul></div>";
  return h;
}

const HELP_CATS = [
  ["ref", "📋", "All functions", /^📋 Every menu/],
  ["start", "🌅", "Getting started", /Getting started|Controls|Chat commands|Characters|Offline|Accounts|Updates|Falling|Time and waiting|Weather|Performance|The screen/],
  ["combat", "⚔️", "Combat and jobs", /Combat|Pets|Jobs and companions|Experience|Notorious|Loot|Treasure|Equipment|Mount|Races|Blessing|Party and companions|Battlefield/],
  ["world", "🗺️", "The world", /Cities|City life|Warp|^🗺️ World|Expeditions|Night and weather|Atlas|Areas|Regions|Exploring|Frostspire|Saltreach|Marsh|Crypt|Main story|Quests|Townsfolk/],
  ["craft", "⚒️", "Crafting and economy", /Auction|Guild|Trade Board|Gathering|Crafting|Cooking|Gardening|Fishing|residence/],
  ["social", "💬", "Social and records", /Other players|Parties with|Social|Trading|Database|Achievements/]
];
function guideRef() {
  const tbl = (head, rows) => "<table><tr>" + head.map(x => "<th>" + x + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map(x => "<td>" + x + "</td>").join("") + "</tr>").join("") + "</table>";
  const keyOf = t => TAB_INFO[t] && TAB_INFO[t][2] ? TAB_INFO[t][2] : "";
  let h = "<p>Open the menu with Esc (or - or Insert, or tap yourself). It has two pages of commands, switched with ◀ ▶. Every command and what it does:</p>";
  MAIN_CMDS.forEach((pg, i) => { h += "<b>Commands, page " + (i + 1) + "</b>" + tbl(["Command", "Key", "What it does"], pg.map(it => [esc(it[0]), esc(keyOf(it[1])), esc(it[2])])); });
  h += "<b>Status sub-menu</b>" + tbl(["Entry", "What it shows"], STATUS_CMDS.map(it => [esc(it[0]), esc(it[2] || "Your race, home point and guild rank.")]));
  h += "<b>Slash commands</b> (type in the chat box)" + tbl(["Command", "What it does"], COMMANDS.map(c => ["<code>" + esc(c[0]) + "</code>", esc(c[1])]));
  return h;
}

function tabHelp() {
  const secs = [];
  const sec = (title, body) => { secs.push([title, body]); return ""; };
  const ul = arr => "<ul>" + arr.map(x => "<li>" + x + "</li>").join("") + "</ul>";
  const tbl = (head, rows) => "<table><tr>" + head.map(x => "<th>" + x + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map(x => "<td>" + x + "</td>").join("") + "</tr>").join("") + "</table>";
  let h = '<div class="help">';
  h += sec("🌅 Getting started", ul([
    "You start alone in Ashenreach Outpost with 100 crystals. Talk to <b>Captain Rhea</b> for work, <b>Brann</b> to hire companions, <b>Pip</b> (in your residence) to change jobs, the <b>market vendors</b> to buy and sell, and <b>Ysolde</b> for the mount.",
    "Leave through Eastgate, the small gate zone east of the Market, into Rocky Hollow. Captain Rhea, the gate guard (City Blessing) and Ysolde the stablemaster all wait there. Hares, worms and small goblins a short walk from the gate are good first targets (monsters keep away from entrances and exits).",
    "Your first hire is a big boost: Brann's Mercenary Hall has five new fighters every day, at your level. A healer and a tank make a strong start. A full party is you plus three. Fallen companions are gone for good.",
    "Standing still out of combat recovers HP and MP slowly. To heal properly, type <b>/rest</b> (or tap yourself and choose Heal) to sit down. Resting is about six times faster. You can rest during a fight too (it disengages you first). Moving, attacking or getting hit stands you up."
  ]), true);
  h += sec("🏙️ Cities and districts", ul([
    "<b>Every city district is its own zone.</b> Each city is a hub of walled districts around a central square (Ashenreach and Ironvale around the Market, Saltreach around Harbor Square), and walking through a gate hall between two districts zones you into the next one: you walk out, the screen fades, a short loading screen shows the district's name, and you walk in through the matching gate on the other side. The banner shows the district (for example <b>Ashenreach Eastgate</b>) with the city underneath.",
    "<b>Ashenreach Outpost</b> is laid out like a cross, each district about four times bigger than before, with streets lined by houses and shops. <b>Market District</b> (centre): the home point crystal on the plaza ringed by market stalls, the Market Hall, the Auction House (its clerk stands at the door), The Ember Mug tavern, the Provisions, Scrolls and Jewels shops, the Trade Board and Luna at night. <b>Government District</b> (north): City Hall with its clock above a fountain square, the Barracks and its training yard, Brann's Mercenary Hall, the Hall of Records (Aurel the Registrar changes names), the Chapel of the Dawn, Maera's Adventurers' Guild and Tobin the Job Master. <b>Residential District</b> (west): your residence just inside the gate from the Market, with Odette's Furnishings, the barber and the Supplies shop a few steps away, rows of townhouses with vegetable gardens and wells, and a park with a pond. <b>Industrial District</b> (south): Garrick's Smithy, the Armory and Arms shops, Woodworkers, Alchemists, the Tannery, the mill and warehouses. <b>Eastgate</b> (east): a small gate zone with only the guard post, Captain Rhea (city quests), the gate guard (City Blessing), Ysolde's stables and the road to Rocky Hollow.",
    "Saltreach Harbor faces the sea on the south: <b>Fish Market</b> (west, fish stalls, Marn and the fishing piers), <b>Harbor Square</b> (centre, home point crystal, auction house, Harbor Master building and the barber), <b>Shipwrights' Row</b> (east, slipways), <b>The Docks</b> (south, five piers, the lighthouse and the Gull Isle ferry), and two small gate zones: <b>North Gate</b> (off Harbor Square: Ilsa with the city quests, the gate guard, a stablemaster and the road to the Ashen Marsh) and <b>East Gate</b> (off Shipwrights' Row: the gate guard, a stablemaster and the road to Frostspire Pass). Ironvale is a cross around Market Square: <b>The Keep</b> (north, the Frost Guard and the Council Hall, where Ingrid the Registrar changes names), <b>Market Square</b> (centre, home point crystal, auction house and Job Master), <b>South Ward</b> (south, homes, the barber and the Supplies shop), <b>Smelters' Row</b> (east, smelters, the Mythrilsmith and the mine), and two small gate zones: <b>Gate Ward</b> (west of Market Square: Brisa with the city quests, the gate guard, a stablemaster and the road to Frostspire Pass) and <b>South Gate</b> (below South Ward: the gate guard, a stablemaster and the road to the Sunscar Desert).",
    "Each district is walled on every side that faces another district. The gates between districts are city gates: two towers hung with the colour of the district beyond, a name board over the arch, and a signpost beside it reading <b>To ...</b>. Looking through a gate or over the walls you see the rooftops and streets of the next district, not open country. Gates that lead out of the city (to Rocky Hollow, Frostspire Pass and so on) have a signpost naming the place too.",
    "Your first visit to each district counts as a discovery, and the district tour quests count them across the whole city. The map (M) shows the district you are in, and under it a <b>city overview</b>: every district of the city in its colour, the gates between them as round markers, roads out of the city, and a white dot where you stand. Districts you have not visited show as ???.",
    "Click-to-move stays inside your district: to reach another district, walk to its gate (or use a warp stone). Your companions zone with you.",
    "Every building faces a street: doors can point north, south, east or west, whichever way the nearest street lies. A door set back from the street has a short footpath out to it, and the map marks each door with a gold tick.",
    "Only buildings that do something carry a sign: Mercenary Hall, Hall of Records, Adventurers' Guild, Job Master, Furnishings, Auction House, Smithy, Mythrilsmith, Council Hall and Stables, plus the vendor shops (Provisions, Scrolls, Jewels, Armory, Arms, Supplies). A sign always faces the street and names what the vendor sells. Unsigned buildings are homes. The clock on City Hall shows the time of day in Leid'anav hours, and the windmill turns all day. Streets have lamps, trees, planters, wells, carts and hay.",
    "Saltreach adds a Mercenary Hall and Job Master of its own and Ironvale a Council Hall; every gate zone has a Stables. Buildings that used to wear a sign for nothing (Barracks, Chapel, Market Hall, tavern, Woodworkers, Fish Market, Customs and the like) are now plain houses.",
    "<b>Open spaces:</b> about half of the empty houses were cleared and the gaps hold little scenes: gardens, courtyards with a tree and benches, wells, shrines, market carts, stacked crates and barrels, laundry lines, an open-air forge and a watchtower stub; Saltreach adds net racks and a boat ramp, Ironvale mine carts and woodpiles. You can walk between them but not through them.",
    "<b>Your residence:</b> the house in the Residential District has a sign reading Home of and your name (it changes if you rename), a gold house marker on the map and the minimap, and the first time you enter the district a title card and log line point it out.",
    "<b>Nothing stands in the roads.</b> Trees, people, stalls, benches, lamps, carts and every other object are kept off the streets and footpaths, in the cities and in the wilds.",
    "<b>Changing your name:</b> the Registrar in the Hall of Records (Ashenreach Government District) or the Council Hall (Ironvale Keep) enters a new name for " + RENAME_COST.toLocaleString() + " crystals: 2 to 12 letters, not already taken. Online, the game server checks the name and takes the crystals.",
    "<b>Getting around:</b> a district is about 240 yalms wide, so crossing one on foot takes roughly 24 seconds (about 16 sprinting with Shift), and a gate to the central square is about 12. Every district has a warp stone near its middle, standing beside a street and facing it; touching one makes the trip instant inside a city (you arrive on the street in front of the stone), and your companions follow through the gates.",
  ]));
  h += sec("🚶 City life", ul([
    "Every person in the cities and fields stands at a fixed spot facing the nearest street (vendors face out of their shop doors; the barber and the guild desk face their counter), with room around them: no one wanders, spawns at random or patrols. Only animals roam.",
    "<b>Strong potions:</b> X-Potions, Hi-Ethers, Super Ethers, Reraisers and Chapel Sigils are not sold. Undead and ghoul-type monsters drop them, and Alchemy recipes craft them from Hi-Potions, Ethers, Bone Chips, Silk Cloth and Reef Scales.",
    "<b>Vendors:</b> every vendor stands just beside the door of their own small shop, facing the street and clear of the road, spread across the districts: smiths and tradesmen in the working districts, food, scrolls and jewellery near the markets. Each shop has a name board, a round hanging sign with its trade emblem (shield, sword, pick, flask, scroll, gem) and its wares outside: an armour stand and shield at the Armory, a weapon rack and anvil at the Arms shop, crates, sacks and tools at Supplies, barrels and a food table at Provisions, a lectern and glowing orb at Scrolls, a glass case of gems at Jewels. Shop names also show on the map. Every town has six: an <b>Armorer</b>, a <b>Weaponsmith</b>, a <b>Tradesman</b> (gathering tools and raw materials), a <b>Quartermaster</b> (potions and food), a <b>Spellsmith</b> (scrolls) and a <b>Jeweler</b> (rings and necklaces). Each sells up to 10 items of level 5 or lower, which change every day and differ from town to town. The Jeweler is the exception: he sells rings and necklaces up to level 11, since so few are level 5 or lower, but only 5 of those 10 are on his shelf each day. Anything higher is at Haldor in Ironvale, the auction house, or from crafters and monsters.",
    "Tour quests: Hale the Tradesman (Outpost), Marn (Saltreach) and Brisa (Ironvale) pay you for walking through every district of their city."
  ]));
  h += sec("🌀 Warp stones", ul([
    "Each district of the three cities has a warp stone (pink dot on the map). Touch one to attune it. Warps inside the same city are free and take you to that district's zone; warps to a stone in another city cost " + CONFIG.warpCost + " crystals. You can't warp while fighting. Type /warp beside a stone to open the menu. Crystals still handle home points and camp warps."
  ]));
  h += sec("💀 Falling and reviving", ul([
    "A hireling who falls stays where they died for an hour. They do not follow you through gates or zone changes, and returning to your home point does not heal them. Walk back before the hour ends or they leave the party. There is no Raise spell in this version.",
    "<b>Reraise:</b> a <b>Reraiser</b> (a Quartermaster sometimes stocks it) puts a Reraise effect on you for an hour. If you fall while it lasts, you stand back up at once with half your HP (Hi-Reraiser and Super Reraiser: full HP) and no experience loss."
  ]));
  h += sec("📴 Offline play", ul([
    "Offline play asks for the email and password of your online account each time you start the game. It is checked with the server once, then remembered on that device so it works with no connection afterwards.",
    "Choose <b>Play Offline</b> after Press Start to play without a connection (it asks for your online account password first). Offline characters live only on this device, in their own list (up to " + MAX_CHARS + ").",
    "Everything that doesn't need other players works offline: quests, story, companions, crafting, gathering, fishing, the NPC market and guild bounties.",
    "Offline characters can never be moved online, uploaded or loaded into an online character. Use System → Save to file to back one up on the same or another device's offline list."
  ]));
  h += sec("👥 Characters", ul([
    "The game opens on the title screen; press Start (or tap) to see your characters. There you pick a character or create a new one: name (2–12 letters), job, race, gender, face, hair colour and size. <b>Randomize all</b> rolls a whole new look. <b>Race, gender and name are permanent</b>; the barber in each town can restyle the rest later. Body shapes differ by race and build: female bodies have a rounded bust that armour and robes shape around, Human, Elari and Nekari have a natural lower waist, and Ursan have a broad barrel chest with sloping shoulders. Nekari have cat ears and a swaying tail; Ursan have a thick rounded tail. Female Human, Elari and Nekari bodies have rounded hips and soft body physics on the bust and hips (turn it off in Settings, Graphics, Body physics). Out of combat your weapon rests against your back; it is drawn into your hand when you engage, cast or attack.",
    "Logging in puts you back where you were: your location saves every 15 seconds and when the tab closes.",
    "Creating a character takes six short steps, in the spirit of classic online RPGs: <b>Race</b> (Human, Elari, Pipkin, Ursan or Nekari, with their stat bonuses) → <b>Gender</b> (skipped for Ursan, always male, and Nekari, always female) → <b>Face</b> (eight anime-style faces: Bright, Calm, Keen, Freckled, Gentle, Fierce, Sleepy and Proud; each race has its own set, and each face comes with its own hairstyle (47 styles in all, from Shaggy and Crown braid to Pipkin twin buns and Ursan lion manes), any extras that suit it (beards, headbands, circlets, clips, beads, ribbons, tattoos, war paint or cheek stripes) and three hair colours; skin comes from your race) → <b>Hair colour</b> (the three colours for your face, then a <b>More colours</b> palette) → <b>Size</b> (Small, Medium or Large; looks only, no effect on stats) → <b>Name and job</b> (with a summary of your choices and a <b>Start over</b> button). Back returns to the previous step, the numbered tabs jump between steps you have seen, and 🎲 picks a random look. The preview zooms in on the face for the Face and Hair colour steps; drag it to turn the model. Set Graphics to High for the sharpest faces.",
    "You can keep up to " + MAX_CHARS + " characters. Each has its own levels, gear, crystals, quests and companions. System → Change character goes back to the select screen.",
    "Deleting a character on the select screen is permanent."
  ]));
  h += sec("💬 Chat commands", "<p>Type in the box under the chat log, or press <b>/</b> to start a command. Plain text is said out loud.</p>" + tbl(["Command", "What it does"], COMMANDS.map(([c, d]) => [esc(c), esc(d)])));
  h += sec("🎮 Controls", ul([
    "<b>Tutorial:</b> a popup tour of the whole game opens on your first login. Use Next and Back (or Enter and the arrow keys), Skip tutorial or Esc to leave, and replay it from Config, More, Tutorial.",
    "<b>Event log history:</b> click the event log to open it, then scroll with the wheel or drag to read up to 500 old lines. Click anywhere in the world, or press Esc, to close it again.",
    "<b>Hotkey bar:</b> it sits directly above the Target box and is as wide as the boxes under it, in two rows of five, and always draws on top of them. You can still drag it by the ⠿ grip (double-click to put it back).",
    "<b>Camera drag:</b> dragging left or right turns the camera the opposite way (inverted). Config, Camera has separate Mouse and Keyboard switches for inverting horizontal (left and right) and vertical (up and down); the keyboard ones affect the arrow keys and Q and E.",
    "<b>Target button (touch):</b> a button sits above the Target panel (in the same blue and gold style as the command menu): Talk (people), Use or Inspect (objects), Harvest (gathering points) or Fight (monsters; engages and opens the command box). Attacking never makes you run to the monster unless you turn on Auto-run to target in Config, Camera.",
    "Movement: you run at about 5 metres a second (more on roads and much more mounted). <b>Hold Shift to sprint</b> about 45% faster on foot; letting go returns you to a normal run. Most monsters chase at around two-thirds of that, so you can usually get away on foot if you start early. Characters move with a natural gait: feet stay planted, roll from heel to toe and push off, hips sway over the standing leg, arms swing (and pump with bent elbows at a run), the body leans forward as you set off, rocks back as you stop, and banks into turns.",
    "<b>Phone:</b> left thumb moves · drag elsewhere to look · pinch to zoom · tap a monster to target it and open its command menu on the left above the log (Attack/Disengage, Switch Target, Magic, Abilities, Items, Check); tap a person to talk; tap yourself for your own Magic, Abilities, Items and Heal.",
    "<b>Keyboard:</b> Shift+Tab cycles nearby objects (signposts, warp stones, crystals, shrines) even with monsters around · Monsters chase you until you leave the zone · Tab or clicking a monster targets it and opens its command menu; ↑ ↓ choose, Enter or → confirm, ← back, Esc close · Enter with a monster targeted opens the menu, with a person targeted talks, with nothing targeted starts typing in the log · WASD move · arrows or Q/E turn · V first person · <b>Tab</b> targets the nearest enemy (or the nearest person in town); press again within 2 s to cycle · F attack · Enter or E talk · Shift+Space jump · Space or Enter (nothing targeted) type in the log · R mount.",
    "<b>Menus:</b> in the auction house, shops, forge, guild, storage and other windows, ↑ ↓ ← → move the highlight over every row and button, the side card shows the highlighted item, and Enter picks it. Esc closes.",
    "<b>Status icons:</b> the round icons at the top left are your blessings, meals and effects. Click or tap one to see its name and time remaining; tap again or elsewhere to close. Everything counts down on play time, not on the clock.",
    "Hotkeys: plain 1–0 use the line shown on the pinned bar (Main by default), Shift+1–0 the Shift line, Alt+1–0 the Alt line and Tab held + 1–0 the Tab line (Tab targets the nearest person, monster or object first). There is no Ctrl line, because browsers keep Ctrl+number for switching tabs. Tab targets when you release it; set them in Hotkeys · Esc closes the command menu; with nothing open it opens the main menu (- or Insert too) · C character · I inventory · K skills · B hotkeys · P party · J quests · Y bestiary · O achievements · M map · H help."
  ]));
  h += sec("⚔️ Combat", ul([
    "<b>Targeting:</b> when you target a monster a command box opens under the target frame: Attack, Magic (spells you can cast on it), Abilities (job abilities and weapon skills) and Inspect. Names over monsters and townsfolk only appear when targeted. Esc or ✕ closes the box.",
    "<b>Inspect</b> (or /check) tells you how tough a monster looks and whether it is hostile. Monster levels are never shown, so learn by inspecting.",
    "Auto-attack swings on your weapon's delay. Each hit builds <b>TP</b>; at 1000 TP you can use a weapon skill (more TP makes it stronger).",
    "<b>Skillchains:</b> a weapon skill opens a chain; a matching weapon skill within about 6 s closes it for bonus damage. The target frame shows the open chain and its element.",
    "<b>Magic bursts:</b> cast a spell of the skillchain's element while the burst window is open for +35–50% damage.",
    "<b>Hate:</b> every monster keeps a score for each person fighting it and attacks the highest. Each score has a lasting part (builds with every hit, spell, ability and cure; fades about 1% a second) and a hot part (fades within a minute). Bigger hits draw more hate, so steady damage wins over time; a cure draws hate from every monster fighting your party.",
    "<b>Criticals</b> draw 1.5x the hate of a normal hit of the same size. Notorious monsters ignore that bonus.",
    "<b>Family tastes:</b> skeletons, orcs and lizards resent steel; worms, bats, crabs, treants, Reefkin and mandrakes resent spells; Crag Talons, bees and hares resent job abilities; Crag Talons, ghouls, mandrakes and longnecks resent healers. A resented action is worth up to 40% more hate, a tolerated one 10–20% less.",
    "<b>Why a monster turns:</b> it switches to someone new only when they lead the current target by 10% or more, and then holds the new target for a second before it will change again. Provoke (600, half of it hot) grabs a monster at once; Flash (Paladin 7) and Sentinel keep it; Smoke Step and High Jump halve what a monster holds against you.",
    "<b>Reading hate:</b> while a monster you target is fighting, the target frame shows who it is on (\"On you\" or a companion's name) and a hate bar: your hate as a share of whoever holds the most. Red means it is on you; gold means it is on someone else. A red bar below full means someone is close to pulling it off you; a gold bar near full means you are about to pull it.",
    "<b>Swap alert:</b> when a monster turns on someone new a ! flashes over it with a ring and the log says who it turned on. A double ‼ in red means it turned on you; shed hate, or get ready to take hits.",
    "<b>Temper:</b> Inspect and the Database tell you what a family resents most and shrugs off once you have defeated five of them (one for a notorious monster). Until then they say how many more to fight.",
    "<b>Inspect readings</b>, weakest to strongest: " + [["Too Weak", "#9e9e9e"], ["Easy Prey", "#64b5f6"], ["Decent Challenge", "#81c784"], ["Even Match", "#fff"], ["Tough", "#ffd54f"], ["Very Tough", "#ff8a65"], ["Incredibly Tough", "#e53935"]].map(([n, c]) => '<span style="color:' + c + '">' + n + "</span>").join(" · ") + ". Too Weak gives no XP. Name plates no longer give this away; only Inspect does.",
    "<b>Learning spells:</b> read a scroll from your Items. It works only if your main job is at the spell's level, or your support job is (support jobs count at half your main level). The log tells you which job and level the scroll needs.",
    "<b>Graphics quality:</b> High adds fur and feather layers on creatures and sharper textures. If your device struggles, Normal or Low keeps every model but drops those extras.",
    "<b>Crawlers, crabs, worms and toads:</b> crawlers walk their leg pairs in a wave down the body; crabs go half-side-on and step their legs in two alternating sets; worms lie flat and wind side to side; toads hop and land on all four feet. Watch a worm or crawler rear up: that is the wind-up for a strike.",
    "<b>Four-legged beasts:</b> sheep, rams and longnecks have haunches, knees and hooves, and their feet stay planted as they walk, trot and gallop. Lizards keep their belly off the ground, flex their spine side to side as they sprawl along, and carry a ridged tail that follows the body.",
    "<b>Builds:</b> orcs are thick through the thigh and arm with a broad, forward-set chest; treants stand splay-footed on a stumpy trunk with their branch arms hanging low and sway as they stand; ghouls and the drowned are wasted and thin. Robes on casters hang as one garment that swings with the stride rather than flapping open.",
    "<b>Body language:</b> beastmen and undead pause on their rounds to look around, shift their weight, scratch or scuff a foot, so a monster standing still is not always asleep. When one stops running it takes a last step and settles before turning. Short-legged goblins scurry with quick steps and break into a crouched run when they chase you.",
    "<b>Reading a beastman:</b> each family has its own silhouette. Goblins stoop with pouches and packs, orcs are broad with spiked shoulders, Reefkin have fins, Crag Talons have feathered arms and tails, treants have branches and roots. A war banner on the back marks a boss.",
    "<b>Debuffs:</b> Slow, Paralyze and Blind weaken a monster in proportion to how much your magic stat beats its own: Slow makes it swing slower, Paralyze makes it lose swings, Blind cuts its accuracy. Poison and Bio drain its HP over time, Bind pins it, Sleep (Black Mage 20) and Foe Lullaby put it to sleep until it is hit. They show on the target frame with the time left. <b>Monsters fight back:</b> bees and spore-clouds poison you, toads paralyze, worms blind and priests silence (silenced, you cannot cast). White Mage cures them with Poisona, Paralyna, Blindna and Silena; the Bar-status spells halve the chance of catching them. <b>Area spells</b> (Curaga, Banishga, Stonega, Waterga, Diaga) affect everything near the target, so mind your pulls. <b>Spikes</b> (Blaze, Ice) hurt whoever hits you in melee; <b>En-spells</b> add elemental damage to your own hits. Shock, Rasp and Choke are damage over time that replace each other (Rasp lowers accuracy, Choke lowers defense). Bar-element spells (Barfire, Barstone, Barwater, Baraero and the party versions ending in -ra) cut damage of that element. Aquaveil blocks a spell interruption, Blink gives two shadow images, Sneak hides you from monsters that hear you and Deodorize from those that smell weakness. Shield Bash interrupts a readied TP move. <b>Monster casters:</b> any beastman or undead can be a mage (see Monster jobs). A hit can interrupt a cast, and a monster hit by your Silence cannot cast at all. Kill the healer first.",
    "<b>Where danger lives:</b> monsters are placed by difficulty. Peaceful critters crowd the areas near towns; aggressive beastmen, undead and big monsters live deeper in. The same kind of monster changes name and colour as it gets stronger further out (Grass → Bog → Rime Crawler, Honey Bee → Marsh Hornet → Frost Wasp, and so on).",
    "<b>Monster jobs:</b> goblins, orcs, Reefkin, Crag Talons, skeletons, ghouls and the drowned each have a job, just like you, and it can be any job in the game. A monster knows the spells and abilities of its job up to its own level: a level 5 goblin White Mage casts Cure and Dia, a level 15 orc Warrior uses Berserk and Warcry, a Black Mage hurls Stone or Aero, a Red Mage paralyzes and Protects itself, a Bard sings Minne and Minuet. Fighters lean on job abilities (Berserk, Boost, Sneak Attack, Hasso, Last Resort, Chakra...). Each monster carries a short list (a heal, a nuke, a status spell and a self buff at most), so watch the cast bar and interrupt or silence it. Tough jobs (Paladin, Rune Fencer, Monk) have more HP; mages are softer. Notorious monsters and critters keep their own kit. <b>The target window and Check tell you the job, and the Bestiary remembers every job you have seen a creature use.</b> Neighbours in a pack avoid sharing a job. <b>You can tell the job by the outfit:</b> each monster wears its job's clothes (the same styles adventurers wear, darker or paler to suit its home: frosty for snow goblins, swampy in the marsh, sandy for Crag Talons, faded on the undead) and carries its job's weapon (Warriors great axes, Paladins sword and shield, Dark Knights scythes, Samurai great katanas, Ninjas katanas, Dragoons spears, Rangers bows, mages staves and clubs). Better gear shows on higher levels. Monks and Puppetmasters fight bare-handed. Throwers and archers keep their own bows and rocks. The looks are cosmetic only.",
    "<b>Monster pets:</b> beastmen who roll Summoner, Beastmaster, Puppetmaster or Geomancer bring a small elemental pet that floats beside them: a Spirit (Summoner), Familiar (Beastmaster), Puppet (Puppetmaster) or Luopan (Geomancer). Its element comes from the land: earth in Rocky Hollow, the caves and the jungle, water in the marsh and on the coast, ice in the snow, fire in the desert and Cinder Peak, wind in the highlands, lightning in the Mirage, dark in crypts and the Red Spire. The pet joins any fight its master starts, and hitting the pet draws the master too. Its big move is its element's pact (Aqua Burst, Flame Burst, Rock Throw...), and it is weak to the opposing element. It vanishes when its master falls and gives no experience or drops, so take down the master first. <b>Corsairs</b> roll dice (Valor Roll, Hawk Roll) that raise the attack or accuracy of their whole pack for a minute and a half.",
    "<b>Interrupts:</b> any physical hit (melee, arrows, weapon skills, physical monster moves) interrupts a spell the moment it lands, for you, your party and monsters alike (a monster has a 75% chance to be thrown off). Aquaveil still absorbs one interrupt. Magic damage keeps the old 40% chance. Stand clear of melee before casting, or let the tank hold the monster. Settings, Combat, Old interrupt rule on restores the chance-only rule.",
    "<b>Where weapons are carried:</b> swords, katanas, daggers, axes and clubs hang at your left hip and you draw them with your right hand from there. Staves, polearms, great weapons and bows ride on your back, as before.",
    "<b>Weapon skill wind-up:</b> a weapon skill now takes about 0.8 seconds to ready, shown on the cast bar. Moving, or Escape, cancels it and keeps your TP. A physical hit cancels it too, and if the hit lands in the last quarter of the wind-up the TP is lost. Abilities are still instant. A physical hit has a 35% chance to cut a monster's TP move short while it readies.",
    "<b>Big moves:</b> when a beastman's TP is full it picks one of two moves, about half the time each: its own monster move (Bomb Toss, Battle Roar, Water Lance, Talon Dive...) or a move from its job. Mage jobs unleash their best nuke as an instant big spell; fighting jobs use a weapon skill of their weapon (Fast Blade, Quick Sting, Twin Fist...). The name shows over its head and on the target frame while it readies, and Shield Bash or Stun still cut it short.",
    "<b>Critters:</b> bees, crawlers, sheep, mandrakes, lizards, crabs, shroomlings, snappers, hares, bats, leeches and longnecks never start a fight. Some watch out for each other (bees, sheep, mandrakes): hit one and its neighbours join in. Watch their special moves: Sticky Thread slows, Dream Dust can put companions to sleep, Spore Cloud and Tail Whip hit everyone nearby.",
    "<b>Wandering Saplings and Strangler Saplings</b> are walking flower bulbs: a round brown body with eyes, stubby legs, root hairs and a green sprout on top. They never start a fight. When bothered they rear the sprout back and lash with it (Sprout Lash). Fire hurts them most. Elder Treants and Old Mossback are still great walking trees.",
    "<b>Ranged and dangerous:</b> Orc Stonechuckers and Needlekin attack from a distance, so close in or pull them around a corner. Ember Bombs swell up and Self-Destruct, a big area blast that also destroys the bomb; kill them fast or step away when they ready it. Elder Treants shake the ground around them.",
    "<b>Aggro:</b> some monsters attack on sight, some when they hear you moving nearby, undead smell weakness when your HP is low, and critters like hares are peaceful until attacked (Inspect says <i>peaceful unless provoked</i>). Learn each kind by watching it; nothing on screen gives their range away."
  ]));
  h += sec("🐾 Pets", ul([
    "Pets are small companions that follow you around for company. They never fight, can't be attacked and give no bonuses: " + Object.keys(BUDDIES).map(id => BUDDIES[id].icon + " " + BUDDIES[id].name).join(", ") + ".",
    "Open <b>Pets</b> on page 1 of the Commands menu to equip one, rename it, and summon or dismiss it. The <b>Pet button</b> on command bar 1 and <b>/pet</b> both toggle your equipped pet. A summoned pet comes back when you log in.",
    "A pet item you get joins you at once and never takes a bag slot, even when your bag is full.",
    "<b>Unequip to bag</b> in the Pets window turns the equipped pet back into its item (needs a free bag slot), for example to trade it. Use the item again to get the pet back. The Ash Sprite has no item form.",
    "Pets are <b>very rare</b>. Hares, bats, worms and ice bats drop their kits about once in 250 kills; Duskwing, Mirelord Gax, Rimefang and the Ashen Herald drop theirs a few percent of the time; the Tide Wisp is a one-in-a-few-hundred catch in Saltreach; the Ash Sprite joins you when you finish the main story. A pet item you get joins you straight away.",
    "Pets stay out of battlefields and vanish when you're knocked out; summon them again afterwards. Achievement: Pet Keeper (five pets)."
  ]));
  h += sec("🧬 Races", tbl(["Race", "Sex", "Traits"], RACE_ORDER.map(r => [RACES[r].icon + " " + RACES[r].name, RACES[r].sex == null ? "Either" : RACES[r].sex ? "Female only" : "Male only", RACES[r].blurb])) + ul([
    "Every race starts in its own clothes: a Warrior piece and a mage piece for the body (Human Vest and Tunic, Elari Jerkins and Bodice, Ursan Surcoat and Tunic, Nekari Separates and Tunic, Pipkin Kaftan and Tunic) plus legwear (Human Pants, Elari Chausses, Ursan Braguette, Nekari Loincloth, Pipkin Braccae) that only that race can wear.",
    "Pick a race at character creation. It's permanent, like the rest of your appearance. Race shapes your body and gives small stat bonuses and penalties that grow a little with level; your job still matters far more.",
    "Elari get extra accuracy with bows. Pipkin and Nekari move faster; Ursan a little slower. HP and MP are multiplied: Ursan +25% HP but −25% MP, Pipkin −20% HP but +30% MP."
  ]));
  h += sec("🏰 The City Blessing", ul([
    "Gate guards stand at every town exit: Aldo at the Outpost's east gate, Senna and Tomas at Saltreach's two gates. Talk to one before you leave and they'll bless you.",
    "<b>Elemental essences only drop while you're blessed</b>, and only from monsters that still give you experience. Everything else (materials, consumables, notorious monster gear) drops as usual.",
    "The blessing lasts " + BLESSING.baseMin + " minutes at Copper guild rank, " + BLESSING.perRankMin + " minutes more per Adventurers' Guild rank, up to " + BLESSING.maxMin + " minutes at Mythril. It counts down only while you are playing, so logging out pauses it. The 🏰 icon at the top left shows it's active (tap it to see the time left), and a guard with a ❗ means you've no blessing.",
    "You can renew it any time; renewing restarts the timer."
  ]));
  h += sec("🛡️ Jobs and companions", tbl(["Job", "Role", "Highlights"], [
    ["Warrior", "Tank or damage", "Provoke, Berserk, Warcry (level 15: +20% attack for nearby allies), great axe A, sword B"],
    ["White Mage", "Healer", "Cure (1), Dia (3), Paralyze (4), Banish (5), Poisona (6), Protect and Protectra (7), Barstonra and Barsleepra, Barwatera and Paralyna (9), Aquaveil and Barpoisonra (10), Cure II (11), Slow (13), Baraera, Blindna (14), Deodorize, Silence and Banishga (15), Curaga (16: heals everyone near the target), Shell and Shellra, Barfira (17), Diaga, Blink and Silena (19), Sneak (20). Divine Seal"],
    ["Black Mage", "Nuker", "Stone (1), Poison (3), Blind (4), Water (5), Bind (7), Aero (9), Bio and Blaze Spikes (10), Drain (12), Fire (13), Stonega (15: Stone on everything near the target), Shock (16), Blizzard (17), Warp (17: 100 MP, teleports you to your home point), Rasp (18), Waterga (19), Sleep, Choke and Ice Spikes (20). Elemental Seal, magic bursts"],
    ["Paladin (advanced)", "Tank", "Sword A, Cure (5), Banish (7), Protect (10), Cure II (17), Shell (20), Sentinel, Shield Bash, shields"],
    ["Red Mage (advanced)", "Hybrid", "Sword B, Dia (1), Cure (3), Stone (4), Poison (5), Paralyze (6), Protect, Barstone (5), Barsleep (7), Water, Blind, Bind, Bio, Barpoison (10), Aquaveil (12), Barparalyze, Slow, Cure II (14), Deodorize, Diaga, Aero, Enthunder (16), Enstone (18), Fire (19), Sneak, Enaero and Blaze Spikes (20), Convert"],
    ["Thief (advanced)", "Damage", "Dagger A, Steal, Sneak Attack (sure critical), Flee; +5% critical hits; Treasure Hunter (+20% drop chance)"],
    ["Ranger (advanced)", "Ranged damage", "Archery A: shoots from 230 range, Sharpshot (+40 accuracy), Barrage (next shot fires 3 arrows), Shadowbind (pin a monster for 12 s)"],
    ["Summoner (advanced)", "Pet mage", "Summoning A: you start with Carbuncle. The eight Spirits (Fire, Ice, Air, Earth, Thunder, Water, Light, Dark) are learned from scrolls dropped by rare Elementals (see below). Your summon fights beside you and drains MP every 3 s; Blood Pact (its elemental attack), Elemental Siphon (MP back), Release"],
    ["Dark Knight (advanced)", "Damage", "Scythe A (new weapon type), great axe and sword B. Last Resort (+25% attack, −15% defense), Soulfire (10: hits burn your own HP for extra damage), Blood Blade (15: hits drain HP). Dark Magic: Stone (5), Poison (6), Drain (10), Water (11), Bio (15), Aero (17), Aspir (20: steals MP), Bind (20)"],
    ["Bard (advanced)", "Support", "Songs cost no MP, reach every ally within range and last 2 minutes; each person holds two songs and a third replaces the oldest. Knight's Minne (1: defense), Valor Minuet (3: attack), Army's Paeon (5: HP over time), Sword Madrigal (11: accuracy), Army's Paeon II (15), Foe Lullaby (16: puts monsters to sleep; bosses are immune), Foe Requiem (7) and II (17: damage over time), Herb Pastoral (9: resist Poison), Light (10), Dark (12), Earth (14), Water (16), Wind (18) and Fire (20) Threnodies (the monster takes 25% more of that element), Sheepfoe Mambo (13: evasion), Scop's Operetta (19: resist Silence), Encore (15: songs sing three times faster). Dagger B"],
    ["Monk (advanced)", "Damage", "Hand-to-Hand A, Martial Arts (faster, stronger fists), kick attacks, Boost, Focus, Chakra"],
    ["Samurai (advanced)", "Damage", "Great Katana A (new weapon type), polearm B. Meditate (gain 400 TP), Hasso (5: +12% damage, +10 accuracy for 2 min), Third Eye (15: the next melee attack on you misses). Weapon skills: Rising Edge, Crescent Cut (22), Ember Arc (40), Heaven's Divide (75)"],
    ["Ninja (advanced)", "Tank / damage", "Katana A (new weapon type), dagger B, Ninjutsu A. Shadow Veil (3: 2 shadow images, 3 from level 12; each soaks one melee hit), Flame (2), Frost (6) and Gale (10) Shuriken, Binding Thread (8: roots the target for 10 s). Smoke Step (5: halves enmity on every monster), Twin Strike (15: next three attacks hit twice)"],
    ["Dragoon (advanced)", "Damage", "Polearm A (new weapon type), staff B. Jump (leap attack, +100 TP), High Jump (10: harder leap, halves the target's enmity toward you), Dragon Spirit (15: +15% damage for 60 s). Weapon skills: Piercing Thrust, Wind Lance (22), Drake Dive (40), Sky Rend (75)"],
    ["Beastmaster (advanced)", "Damage / pet", "Axe A (new weapon type), scythe B. Call Beast (a Scaleback lizard; a Pincher crab from 8; a Great Ram from 14) that fights beside you and stays until you change job or it falls. Reward (5: heals the beast 40%), Feral Howl (15: target's attack −15% for 30 s). Weapon skills: Cleaving Chop, Wild Hack (22), Feral Rend (40), Primal Fury (75)"],
    ["Blue Mage (advanced)", "Damage / magic", "Sword A, club B, Blue Magic A. Learns spells by standing within reach when a monster uses its special move (about half the time, if your level is high enough): Hind Kick (hares), Sticky Thread (crawlers, slows), Dream Dust (mandrakes, sleep), Snapjaw (snappers), Big Pinch (crabs), Tail Whip (lizards), Blood Drain (leeches), Water Lance (Reefkin), Battle Roar (orc grunts), Boulder Toss (orc stonechuckers). Burst Affinity (5: next blue spell +50%). Blue magic can't be bought as scrolls"],
    ["Corsair (advanced)", "Damage / support", "Dagger A, sword B. Valor Roll (party attack +4–16% for 3 min; 5 is lucky), Hawk Roll (8: party accuracy +3–12; 4 is lucky), Double Down (10: roll again and add it; over 7 busts and the roll is lost), Quick Shot (5: pistol shot)"],
    ["Puppetmaster (advanced)", "Damage / pet", "Hand-to-Hand A. Activate (an automaton that fights beside you until it breaks or you change job), Repair (5: heals it 50%), Tune Up (15: its attack +20% for 60 s)"],
    ["Dancer (advanced)", "Damage / healing", "Dagger A. Abilities spend TP: Healing Waltz (200 TP: heals the most hurt party member nearby), Quick Step (5, 100 TP: target off balance, +5 accuracy against it per step, up to 5), Rising Flourish (10: spends all steps on one bigger hit), Group Waltz (15, 400 TP: heals the party)"],
    ["Scholar (advanced)", "Magic", "Learns most white and black magic two levels after the mages (up to level 20 spells). Light Arts (healing, divine and enhancing spells 20% faster, 10% cheaper) or Dark Arts (elemental, enfeebling and dark); Penury (10: next white spell free), Ebullience (15: next elemental spell +30%)"],
    ["Geomancer (advanced)", "Support", "Club B, Geomancy A. Auras follow you and affect the party nearby: Vigor (HP over time), Fury (5: attack +10%), Focus (11: spell damage +12%). Wards plant a luopan by the target that affects monsters near it: Torpor (3: slow), Frailty (8: they take 12% more damage), Languor (15: they deal 15% less). One aura and one luopan at a time, 3 minutes each. Full Circle (5: dismiss the luopan for half its MP back), Mending Halation (15: shatter it to heal the party 20%)"],
    ["Rune Fencer (advanced)", "Tank", "Great Sword A (new weapon type), sword and great axe B. Kindle, Rime (3), Gale (5) and Stone (7) Runes: hold up to three; each cuts damage you take by 5%. Lunge (10: release every rune as elemental damage), Vallation (15: damage taken −20% for 30 s, and your hits draw extra enmity). Weapon skills: Rune Cleave, Glyph Rend (22), Ward Breaker (40), Final Verse (75)"]
  ]) + ul([
    "<b>Jobs unlock as you grow.</b> Warrior, White Mage, Black Mage and Thief start open. Every other job opens once you have trained earlier jobs to a set level; a message and a pop-up tell you when you qualify, and Pip at your residence then lets you change to it. Locked jobs are hidden from the job menu.",
    "<b>Job achievements:</b> each job you unlock earns its own achievement; Bronze, Silver and Gold mark 6, 12 and 18 open jobs, and Every Trade needs them all.",
    "<b>Companions follow your jobs:</b> Brann only offers fighters whose job you have unlocked.",
    "<b>Ask Tobin</b> (or the Job Master in any town) why jobs must be unlocked, or how you are doing: he gives a vague hint about what to train next without naming the job.",
    "<b>Initiation quests:</b> Tobin's old job quests are offered only after the job is unlocked. They no longer unlock anything but still give the job's first weapon.",
    "Support jobs unlock at level 10 through Tobin's quest <i>A Second Calling</i> and run at half your level.",
    "Companions cost a hiring fee (it covers the first hour of play) and then a wage for each further hour. If you refuse or can't pay, they go back to the Mercenary Hall as Old Friends. They match your level and talk in party chat. Knocked-out companions get back up after 6 calm seconds. If one is left far behind, they catch up. When you /rest, they sit with you."
  ]));
  h += sec("📈 Experience", ul([
    "XP needed per level: " + CONFIG.xpTable.slice(1).map((x, i) => "Lv" + (i + 1) + "→" + (i + 2) + " " + x).join(" · ") + ". Level cap " + CONFIG.levelCap + ".",
    "Kill XP scales with the monster's con. Tougher monsters give much more.",
    "Every monster that still gives XP drops a few crystals (2 to 4 per level of the monster). Beastmen such as goblins and orcs carry more.",
    "Fighting alone in shop gear, an Easy Prey monster is almost always a safe kill, an Even Match is about a coin flip (much safer with companions), and a Tough one usually needs help.",
    "<b>EXP chains:</b> defeat another monster within " + CONFIG.chainWindow + " s of your last XP kill for +" + Math.round(CONFIG.chainStep * 100) + "% per chain, up to +" + Math.round(CONFIG.chainMax * CONFIG.chainStep * 100) + "%. The ⛓ counter by the XP bar shows the bonus and time left.",
    "<b>Discovery:</b> landmarks are logged the first time you reach them (🧭 in the event log); they give no experience. The Map shows how many you've found in each zone.",
    "Quests, bounties, Trade Board requests and story steps never give experience. They pay crystals, items and guild points. Fighting is how you level.",
    "<b>Groups:</b> every extra party member (mercenaries and other players) cuts your share of each kill's experience by 25%, down to a minimum of 20%. Two in the party is 75%, three is 50%, four is 25%. A bigger party is safer, not faster.",
    "When you are knocked out you fall and stay down for up to an hour. A Reraise effect (from a Reraiser) stands you straight back up with no loss. Otherwise press Back to Home Point: you return home and lose 10% of your current level's XP requirement (you never lose a level). After returning home you are Weakened for three minutes (attack, defence and accuracy -15%).", "Companions who fall stay down too, and there is no Raise to bring them back, so walk to them before the hour ends or they go back to the Mercenary Hall (hall recruits are lost for good)."
  ]));
  const nmRows = Object.keys(NM_FAMILIES).map(k => { const n = NM_FAMILIES[k], u = ITEMS[n.loot[0][0]]; return ["☠ " + n.name, n.hint || "", (FAMILIES[n.base] || {}).name || "", u ? u.name : ""]; });
  h += sec("☠ Notorious monsters", "<p>Rare, stronger versions of normal monsters with a coloured aura. They sometimes appear in place of a regular monster (its placeholder) when it respawns. After one is defeated it can't appear again for about 5 minutes of real time, even while you're offline. Each has a unique drop with about a 30% chance.</p>" + tbl(["Name", "Where and when", "Pops from", "Unique drop"], nmRows) + "<p>The Goblin Chieftain at the back of the Goblin Den is a fixed boss that returns every 3 minutes.</p>");
  h += sec("💎 Loot and rarity", tbl(["Rarity", "Typical items", "Drop rate"], [
    ['<span style="color:' + RARITY.common[1] + '">Common</span>', "Materials, crystals, potions", "15–40%"],
    ['<span style="color:' + RARITY.uncommon[1] + '">Uncommon</span>', "Ether, Hi-Potion, high-quality items", "5–10%"],
    ['<span style="color:' + RARITY.rare[1] + '">Rare</span>', "Notorious monster uniques and gear", "30–35%"],
    ['<span style="color:' + RARITY.epic[1] + '">Epic</span>', "Boss trophies", "about 30%"]
  ]) + ul(["<b>Who drops what:</b> equipment, weapons and spell scrolls drop only from notorious monsters, bosses, and humanoid monsters (goblins, orcs, Reefkin, Crag Talons, skeletons, ghouls) whose job and level could actually use the item. A goblin Black Mage can carry black magic and robes, a warrior orc axes and armour; none carries anything above its level. Beasts, plants, insects and the like drop only materials, food, potions, <b>trade goods</b> and (only while you carry the <b>City Blessing</b>) elemental essences. <b>Crystals</b> (money) come only from humanoids, notorious monsters and bosses.", "<b>Trade goods:</b> beasts drop hides, chitin, fibre, scales or elemental cores, depending on the creature. They come in four grades by the monster's level (Coarse, Fine, Choice, Prime; cores go Dim, Glowing, Bright, Radiant). Tougher monsters within a grade drop them more often. They exist to be sold to any shop or on the auction house, and are how beast hunting pays. Monsters too weak to give experience drop none.", "<b>Rare</b> items can only be held once. If one drops while you already have it, it's lost.", "<b>Ex</b> items (quest rewards, boss trophies) can't be sold."]));
  h += sec("🗺️ World", tbl(["Area", "Levels", "Highlights"], [
    ["Ashenreach Outpost", "Safe", "Shops, jobs, companions, stables, Adventurers' Guild, auction house, home point"],
    ["Rocky Hollow", "1–6", "Peaceful bees, crawlers, sheep and mandrakes near the gate; lizards, crabs, snappers and saplings further in; goblins, worms, undead (night), orcs and bombs (night) deep in. Old Fort Ruins, Goblin Camp, Burrow Flats, 4 NMs"],
    ["Goblin Den", "5–11", "Four chambers: Den Mouth, Underground Pool, Bone Pit (exit to the Crypt), Chieftain's Throne"],
    ["Sunken Crypt", "9–12", "Brazier puzzle, the Crypt Sentinel and its key, the vault, the Hollow King"],
    ["Saltreach Harbor", "Safe", "South of the Ashen Marsh. Harbor master Ilsa (quests), Marn (fishing, food), an auction clerk, a job master and a stablemaster, home point, trade board, docks"],
    ["Frostspire Pass", "15–20", "East of Saltreach Harbor. Snow and blizzards, Frost Gate, Icefall Camp, Frozen Lake, Whispering Cairns, Summit Overlook, 2 NMs"],
    ["Ashen Marsh", "9–16 (orc camp, Reefkin shore, Crag Talon roost)", "South of Rocky Hollow. Misty ponds, Sunken Causeway, Croaker's Pool, Mire Village, Drowned Chapel, 2 NMs"],
    ["Ironvale", "Safe", "East of Frostspire Pass. A stone mountain city: Brisa the quartermaster (quests), Haldor the smith (high-quality +1 gear, level 14 and up), an auction clerk, a job master and a stablemaster, home point, trade board"],
    ["Sunscar Desert", "17–20", "South of Ironvale. Sand, cacti and red mesas: Dune Lizards, Sand Crabs, Sun Wasps (day), Dune Worms, Needlekin, Cinder Bombs (night). Sunscar Gate, Titan's Ribs, the Glass Oasis, the Singing Dunes (NM Sandmaw) and the Red Spire"],
    ["Verdant Jungle", "17–20", "East of the Ashen Marsh. Huge trees, warm rain and green mist: Vine Crawlers, Jade Hornets (day), Strangler Saplings, Bloom Mandrakes (day), Jade Toads and a Crag Talon war band by the Overgrown Temple. Old Mossback, an ancient treant, walks the Heart of the Canopy"],
    ["Cinder Peak", "18–20", "East of the Sunscar Desert. A volcano of black rock, ash and glowing lava pools: Magma Lizards, Obsidian Crabs, Magma Worms, Ashen Orcs, Cinder Bombs and Cinder Bones (night). The NM Pyreclaw suns itself on the Crater Rim at night. Rich mining; no fishing in lava"],
    ["Gull Isle", "12–16", "Reached by ferry from the Saltreach docks (Ferryman Coll, " + CONFIG.ferryCost + " crystals each way, about 6 seconds at sea). Beaches, a palm grove and the Gullsrest Cliffs: Reef Crabs, Shore Lizards, Gale Talons, Reefkin and Isle Snappers. Old Wend has a favour to ask; the NM Old Saltjaw lurks in Wreck Cove. Good sea fishing"],
    ["Red Spire", "17–23", "A tower dungeon entered by a door at the Red Spire in the Sunscar Desert. Four floors, each harder than the last (17–18 up to 20–21), climbed by the stairs on the east side; the Spire Warden (level 23 boss) holds the summit and may drop the Warden's Greatsword or the Spire Mantle. Bring a full party"],
    ["Underdeep River", "16–20", "A glowing cavern under the Verdant Jungle (door near the jungle's south-east). A rock wall splits it in two: Boatman Ferro rows you across the river for free. Glow Bats, Pale Crabs, Lumicaps and Deep Worms; the Lumicap Matron (NM) lights the Glimmer Grotto. Fish for Glowfin and the rare Blind Eel"],
    ["Windreach Highlands", "10–15", "North of Rocky Hollow. A wide golden plateau: ride anywhere at road speed. The nomad camp (Tarqa the chief with two quests, Essa the trader) and Rider's Rest are camps. Plains Hares, Plains Lizards, Wind Wasps, Highland Longnecks and Highland Orcs; Thunderhoof (NM) roams the Stormgrass Flats by day"],
  ]) + ul(["The clock runs 25× real time (one game day is 57.6 minutes) and keeps going while you're away. Day is 6:00–18:00.", "Hares graze by day; bats and Wandering Bones come out at night. Goblins, worms and ghouls are always around.", "Eight weekdays each boost one element's spells by 10%.", "Home Point Crystals are found only in towns. They restore your party and can be set as your return point."]));
  h += sec("🗺️ Expeditions", ul([
    "Maera at the Adventurers' Guild hands out long journeys across several areas. Each has a list of legs; the next one is shown when you talk to her or type /expedition.",
    "<i>Across the Wilds</i> (level 12): reach Ironvale, speak to Brisa, find Titan's Ribs in the Sunscar Desert, then report back. Reward: Trailblazer Boots.",
    "<i>Fire and Water</i> (level 17): the Molten Lake on Cinder Peak, 4 Magma Worms, the Glimmer Grotto in the Underdeep, then Old Wend on Gull Isle. Reward: Explorer's Ring.",
    "<i>The Ends of the Map</i> (level 19): the Standing Stones (Windreach Highlands), the Overgrown Temple (Verdant Jungle) and the Red Spire Summit. Reward: Pathfinder's Mantle.",
    "One expedition at a time. Finish all three for the Far Traveller achievement."
  ]));
  h += sec("🌙 Night and weather secrets", ul([
    "Some things only happen at certain times or in certain weather.",
    "<b>Luna, the Moonlit Peddler</b>, sets up in the Ashenreach plaza only at night (18:00–6:00) and sells Moon Tonics and the Nightglass Earring.",
    "<b>The Mirage</b>: during a sandstorm, the air shimmers in the south-west of the Sunscar Desert. Walk into it to enter a hidden glass garden with level 20 monsters, a treasure cache and the Sandglass Wisp (NM). When the storm ends, the way in closes.",
    "<b>Gloamhorn</b>, a dusk-coloured longneck, only grazes the eastern Windreach Highlands at night.",
    "Weather-only monsters (see Weather) also come and go with the sky."
  ]));
  h += sec("🧭 Atlas", ul([
    "The Map window shows the area you're in (with fog over parts you haven't walked) and, below it, the atlas of the whole world.",
    "The atlas fills in as you travel. Areas you've visited are named and coloured by the nation or Beastmen holding their region; areas next to them show as ???. Each wild area shows how much of it you've mapped. Roads are solid lines, doors and the ferry dashed.",
    "Each wild area on the atlas shows its monster level range (for example Lv 1–7) and how much of it you've mapped. The Red Spire's floors count as one area.",
    "Visit every area on the atlas for the Cartographer achievement."
  ]));
  h += sec("📍 Areas, zones and levels", ul([
    "Every outdoor zone has a level range, worked out from the monsters that live there. You see it on the banner when you enter (with the region's name), in the chat log, in the Map window and on the atlas.",
    "Big wild areas are split into several connected zones, each with its own name and level range, like the classics. Rocky Hollow (West Meadows, Mirror Lake, Eastern Ruins) and the Windreach Highlands (Foothills, Plateau, Eagle Ridge) are done; more follow. You walk from one to the next across the edge of the map; the atlas still shows the whole area as one place.",
    "When an area is split, your character is moved to the matching spot in the new zone, landmarks you found and the parts of the map you explored are kept, and quests, expeditions, achievements and conquest treat all its zones as the same area."
  ]));
  h += sec("🚩 Regions and nations", ul([
    "The wilds are split into five regions: the Vale (Rocky Hollow, Goblin Den, Sunken Crypt, Windreach Highlands), the Mire (Ashen Marsh, Chapel Depths, Verdant Jungle, Underdeep), the Coast (Gull Isle), the Peaks (Frostspire Pass) and the Sands (Sunscar Desert, Cinder Peak, Red Spire). Each is held by the Ashenreach League, the Ironvale Compact or the Beastmen.",
    "Pledge to a nation by talking to Captain Rhea (Ashenreach) or Brisa (Ironvale). Every monster you defeat in a region adds points for your nation there (about half its level).",
    "Once a day the points are tallied: the side with the most takes the region. The current holder gets a defence bonus, the Beastmen always push, and the rival nation gains some ground on its own.",
    "While your nation holds three or more regions, shop prices are 10% lower; if the Beastmen hold three or more, prices are 10% higher. Fighting in a region your nation holds gives +5% experience.",
    "Type /conquest to see who holds each region and your nation's points today. Entering an area tells you who holds it."
  ]));
  h += sec("🧭 Exploring the wilds", ul([
    "Every outdoor area hides points of interest: Rocky Hollow (spread over its three zones), Frostspire Pass, the Ashen Marsh, Sunscar Desert, Verdant Jungle and Cinder Peak have four each; Gull Isle three; the Windreach Highlands (over their three zones) four. They are shown as purple (and gold for caches) dots on the compass map and stand within sight of a path.",
    "<b>Field sites</b>: many landmarks also have something to see just off the road: a <b>stone circle</b> in a clearing, an <b>overlook</b> on a small rise with a bench, a low wall and a cairn, or the <b>broken walls of an old ruin</b>. Trees and rocks keep clear of them.",
    "<b>Lookout Tower</b>: climb it to see the whole area. Every landmark there is marked as discovered, and your first climb gives 60 EXP.",
    "<b>Wayside Shrine</b>: leave 10 crystals to pray and receive Shrine's Favour (🕯️), +10% experience for 30 minutes. Each shrine can be used once an hour. Your first prayer at each gives 40 EXP.",
    "<b>Weathered Tablet</b>: a piece of the area's history. Reading one for the first time gives 50 EXP.",
    "<b>Hidden Cache</b>: a vault chest with crystals and treasure. It shows up only on some days, somewhere different in its zone each day, and it vanishes once opened.",
    "<b>Camps</b>: Rocky Hollow (one in each of its three zones), Frostspire Pass and the Ashen Marsh each have a camp with a tent and a fire. Crystals stand only in towns, and touching one restores your party and attunes you to it. From any crystal you can <b>warp</b> to another one you've attuned to for " + CONFIG.warpCost + " crystals (not during a fight). Home points can still only be set in towns.",
    "<b>Signposts</b> stand at every way in and out of an outdoor area; read one for the direction and rough distance to each neighbouring area.",
    "<b>Roads</b>: riding along a road outside town is " + Math.round((CONFIG.roadBonus - 1) * 100) + "% faster than riding cross-country. On the open plateau of the Windreach Highlands you get that speed everywhere.",
    "Visit every lookout, shrine and tablet for the <b>Wayfarer</b> achievement. Deer, birds, butterflies, leaping fish and road travellers are just scenery and can't be fought."
  ]));
  h += sec("🔱 Battlefield: the Chapel Depths", ul([
    "A sealed door stands in the Drowned Chapel ruins of the Ashen Marsh. A <b>Chapel Sigil</b> opens it (the Drowned sometimes carry one, and Alchemists can craft them from Bone Chips and Reef Scales). The sigil is used up when you enter.",
    "Inside, defeat the <b>Tidebound Priest</b> (level 16 boss) within " + BATTLEFIELD.minutes + " minutes. At 65% HP it raises two Drowned; below half it casts Maelstrom on everyone near it every 22 seconds; below 20% it enrages. It never leashes inside the chapel.",
    "Victory: " + BATTLEFIELD.gil + " crystals, " + BATTLEFIELD.xp + " XP and one treasure you don't own yet: Tide Crown, Abyssal Staff, Drowned Blade, Priest's Mantle or Tidebreaker Bow. Leaving, wiping or running out of time ends the attempt.",
    "Bring a full party of level 15s, food, and potions. The timer shows at the top of the screen."
  ]));
  h += sec("⚖️ Auction house", ul([
    "<b>Listing needs Essence.</b> On top of the " + Math.round(AH_CFG.fee * 100) + "% crystal fee, every lot you list costs Essence crystals of any element (Fire, Wind, Earth or Water): 1 for an item with a base price up to 1,000, 2 up to 2,000, 3 up to 3,000, and so on. It is spent when you list and not refunded.",
    "<b>Categories:</b> bows, crossbows, instruments, throwing weapons and ammunition are all listed under Weapons.",
    "<b>No Essence on the shelves.</b> A town's daily listings never include Essence crystals. Essence only turns up on the Buy view when a player or a mercenary sold it to a town, and then towns relist it like anything else.",
    "A <b>Crystals</b> box under the window shows your balance on the same line as the number, in every shop, the Auction House, Forge, stable, guild, mercenary hall, crafting and other windows where you pay.",
    "Walk up to the <b>Auction Clerk</b>, who stands at the door of the Auction House (a pillared building with a gold banner) in Ashenreach, Saltreach and Ironvale, and press Talk. In Ashenreach it is on the market plaza next to the home point crystal. Every town has its own auction house.",
    "<b>One list.</b> The Buy view shows every seller together: 🏛 towns in gold, 👤 players in green and ⚔ mercenaries in violet. Use Show to filter, and open an item to see all sellers sorted by price. Hover a mercenary's name to see whose it is.",
    "<b>Towns buy too.</b> Every 20 minutes of real time (it keeps counting while you are offline), each town buys one lot. It only buys your lots that were listed in that town and have been up for at least 20 minutes, paying you at once; if you have none ready it buys one of your companions' lots, taking turns between sellers and starting with each seller's oldest lot. A town only buys a lot priced at no more than 1.25 times the market price. Half the time, a town puts what it buys (including lots that sell while you are away) back up under its own name (🏛, gold) at 3% more, up to 40 resale lots. These never expire.",
    "<b>Online, the market is shared.</b> When you play online, your companions' sell-offs go to the shared market under their names (up to 300 lots per player, no expiry, priced at each item's usual value), and every player sees them. The towns buy on real time there: every 20 minutes each town buys one lot, players' lots first and companions' lots after, taking turns between sellers. Crystals from these sales go to your player delivery box. A town's relisted lots show under its name and anyone can buy them.",
    "<b>Offline</b> the market is your own: your lots, your companions' lots and the towns, with town buying counted in real time. Offline lots are never copied online.",
    "<b>Each city is its own market.</b> Every city's auction house has its own daily stock and sold-out counts, and you can only buy lots listed in the city you are standing in (shop stock, other players' lots, companions' lots and the city's relisted goods). To buy something from another city, go there.",
    "<b>Auction and merchant pay:</b> a city's auction house buys your lots at up to 1.5 times the shop price of the item (one lot every 20 real minutes, only lots listed in that city). Merchants buy anything sellable at half the shop price. Notorious Monster gear can now be sold to merchants and traded at the auction house.",
    "<b>Drop rates:</b> ordinary monster drops are common (10-15%), uncommon (1-5%) or rare (under 1%). Notorious Monster gear drops at 10-20%. Gear and scroll drops from ordinary monsters have not changed.",
    "<b>Gear prices:</b> +1 gear is worth twice the plain version, +2 and +3 three times, and Notorious Monster gear about three times similar gear for its slot and level.",
    "<b>Prices move.</b> Every item drifts around its usual value through the game day (a new price every 6 game hours, about 14 real minutes). Each game day the market news lifts one category (▲) and lowers another (▼). Buying pushes a price up; your lots selling pull it down; both effects fade.",
    "<b>Auction prices follow the shops:</b> the going rate for an item is " + AH_CFG.shopRatio + " times what a shop charges for it, and it still drifts up and down with the daily news and with how much people buy and sell.",
    "Each game day the market stocks only a random handful: 10 pieces of +1 (high-quality) equipment (one of each), 5 kinds of ammo, 10 kinds of potions and other consumables, 3 spell scrolls, 10 kinds of food and 10 kinds of materials. Nothing is listed above your level + 1. Point at any entry to see its item card.",
    "<b>Buying:</b> pick a category and tap an item for its price chart and today's stock (stock refreshes each game day). Weapons and armor more than 5 levels above you are hidden.",
    "<b>Selling:</b> choose an item and quantity (up to one stack), adjust the price, and pay a " + Math.round(AH_CFG.fee * 100) + "% listing fee. The window tells you how quickly it's likely to sell. Up to " + AH_CFG.maxListings + " lots at once; there is no time limit: a listing stays up until it sells or you withdraw it, and keeps selling while you're away. Crystals from a sale go straight to you.",
    "Everything you sell, withdraw or have delivered goes to the <b>Delivery Box in your residence</b> (the chest near the door); walk home and use Collect everything. The My listings view shows what is waiting. Rare, Ex, key items and furniture can't be auctioned.",
    "<b>🌐 Players:</b> lots put up by other adventurers. Pick a category and an item to see every lot, its seller, time left and recent player sale prices, then Buy. Purchases go straight to your bag (or your delivery box if it's full). Everything is handled by the game server, so a sale can't be duplicated.",
    "<b>Offer to players:</b> in Sell, choose the item, quantity and price, then press <b>🌐 Offer to players</b> instead of Sell to the market. Players see it until it sells or you withdraw it, and pay exactly your price. The same 3% fee applies. Up to 10 player lots at once.",
    "When a player buys your lot you get a message wherever you are; the crystals wait in your <b>Delivery Box at your residence</b> until you collect them there. Offers have no time limit; withdraw one and it goes back to the box."
  ]));
  h += sec("🕯️ Main story: Embers of Ashenreach", ul([
    "Eight chapters. Talk to <b>Captain Rhea</b> at level 3 to begin. Your current chapter and goal are always at the top of the Quests window, and a ❗ marks the person with your next story scene.",
    "Chapters unlock at levels " + STORY.map(c => c.lv).filter((v, i, a) => a.indexOf(v) === i).join(", ") + ". The story takes you through every area in the game, so bring companions for the later chapters.",
    "Some chapters need a boss: the Hollow King (Sunken Crypt), the Tidebound Priest (Chapel Depths battlefield; you need a Chapel Sigil), Rimefang (appears when the story brings you to Icefall Camp) and the Ashen Herald (level 22, at the Summit Overlook).",
    "Story steps only count while that step is current: kills before then don't count.",
    "Each chapter pays experience and crystals. The final chapter gives the Ember of Ashenreach, a level 19 ring for every job."
  ]));
  h += sec("⚔️ The Adventurers' Guild", ul([
    "Talk to <b>Maera</b> in Ashenreach Outpost (west of Captain Rhea) to open the guild window.",
    "<b>Bounties:</b> " + GUILD_DAILY + " are posted each day (new ones at midnight UTC, or after you wait a full day in town), plus one extra, harder bounty for every rank you have earned. Accept up to " + GUILD_ACTIVE + " at once. Kills count anywhere, with or without companions. Each bounty can be finished once per day; you can abandon one to free a slot.",
    "Rewards per bounty: guild points 🎖️ and eight crystals per point (no experience). ★ bounties are notorious monster hunts and pay the most.",
    "<b>Ranks</b> (by total points earned; spending doesn't lower your rank): " + GUILD_RANKS.map(r => r[0] + " " + r[1]).join(" · ") + ". Each rank posts harder bounties.",
    "<b>Daily supplies</b> (one of each per day; resets at midnight UTC or after you wait a full day in town): Potion and Ether from the start, Guild Warp Scroll (carries you to the Ashenreach market) at Bronze, one random crystal at Iron, one random common find at Silver, uncommon at Gold, rare at Mythril. A find is a material, piece of equipment, spell scroll or recipe. Prices climb steeply with each rank.",
  ]));
  h += sec("❄️ Frostspire Pass", ul([
    "Through the east exit of Saltreach Harbor. The highest area so far (levels 15–20). It snows most of the time; blizzards thicken the air and cut how far you can see.",
    "<b>Snow Hares</b> are peaceful (by day). <b>Ice Bats</b> hear you and hunt in packs at night. <b>Frost Goblins</b> see a long way across the snow and call each other. <b>Glacier Worms</b> sense magic. At night <b>Ice Wights</b> rise at the cairns and smell weakness. Everything here is weak to fire.",
    "Notorious monsters: <b>Rimefang</b> (Icefall Camp, any time; drops Rimefang's Axe and the Frost Ring) and <b>The Frost Wight</b> (Whispering Cairns, at night; drops the Wight Shroud and the Frost Ring).",
    "Quest: Ilsa's <i>Frozen Cargo</i> (level 16, 6 Frost Goblins, rewards a Fur Hat).",
    "Frost Shards drop from the pass's monsters."
  ]));
  h += sec("⚓ Saltreach Harbor", ul([
    "A second town, through the south exit of the Ashen Marsh. You can set your home point at its crystal.",
    "<b>Ilsa</b>, the harbor master: <i>Catch of the Day</i> (level 6, 3 Harbor Bream → Sea Rod) and <i>Salt and Steel</i> (level 12, 5 Mire Goblins → Tide Ring).",
    "<b>Marn</b> sells rods (the Sea Rod adds 10% to your catch rate), bait, flour, salt, ready meals and potions.",
    "Fish from the piers of the Fish Market, Shipwrights' Row and The Docks: Harbor Bream, Sea Bass and the rare Tidecaller Tuna. Sea Bass cooks into Grilled Sea Bass (Cooking 12)."
  ]));
  h += sec("🐸 The Ashen Marsh", ul([
    "Through the south exit of Rocky Hollow. Thick mist cuts how far you can see, especially at night.",
    "<b>Bog Toads</b> hear footsteps. <b>Bog Leeches</b> taste magic and blood (they come for casters and the wounded). <b>Mire Goblins</b> see far and call each other. At night the <b>Drowned</b> rise around the chapel. <b>Reed Hares</b> are peaceful.",
    "Notorious monsters: <b>Old Croaker</b> (Croaker's Pool, by day; drops the Croaker Charm) and <b>Mirelord Gax</b> (Mire Village; drops Gax's Cleaver and the Mire Mantle).",
    "Quests: Captain Rhea's <i>Into the Mire</i> (level 10, 6 Bog Toads, rewards Marsh Boots) and Brann's <i>The Mirelord</i> (level 13).",
    "Gathering: iron-rich ore, willow logs and Mire Reeds."
  ]));
  h += sec("🏚️ The Sunken Crypt", ul([
    "Enter from the Bone Pit at the bottom of the Goblin Den. Bring a full party of level 9 or higher.",
    "<b>Brazier Hall:</b> read the Worn Inscription on the north wall, then light the four braziers in that order (tap one and choose Light it). The wrong order snuffs them and raises two skeletons. The right order opens the sealed gate to the crossroads.",
    "<b>North:</b> the Crypt Sentinel, a level 11 notorious skeleton. It drops the <b>Crypt Key</b> (a key item; it doesn't take a bag slot) which opens the throne door. Two treasure chests.",
    "<b>South:</b> the vault, guarded by ghouls, with the best chest.",
    "<b>Throne room:</b> the Hollow King, level 12. At 66% and 33% HP he calls two Royal Guards: kill them or hold them, and keep healing. Below 20% he enrages (hits harder and faster). He returns every 10 real minutes. The Royal Coffer opens while he's down.",
    "Chests refill 20 real minutes after you open them. Key items and crypt progress are saved with your character."
  ]));
  h += sec("📜 Quests", "<p>Nobody hands you quests at the start: talk to people. A ❗ over someone means they have work for you, or you're ready to report back. Kill quests count in the log and the tracker. The journal (J) lists what you've accepted.</p><p><b>Tracker:</b> your accepted quests, current story step and accepted bounties are listed at the top left of the screen with their progress. Click it to open the journal, click its title to fold it, and it hides itself while a window, menu or dialog is open. Turn it off in Settings (Quest tracker).</p>" + tbl(["Quest", "Giver", "Level", "Task"], Object.keys(QUESTS).map(id => [esc(QUESTS[id].name), esc(QUESTS[id].giver), String(QUESTS[id].lv || 1), esc(QUESTS[id].desc)])));
  h += sec("👥 Party and companions (P, in the Social menu)", ul([
    "<b>Hiring:</b> you can lead <b>one</b> mercenary once any job reaches Lv5, <b>two</b> at Lv10 and <b>three</b> at Lv15 or higher. Brann's Mercenary Hall has 5 new fighters every day (the list changes at midnight). They can be any job, with no level requirement. You hire them at your current level and the fee follows your level.",
    "<b>Level sync:</b> companions always match your current job level. When you level up, level down or change jobs they sync with you. Gear they can no longer wear is put away as a kept item in their bag (never sold) and goes back on when your level allows, unless they have found something better by then. Their starting gear is plain shop gear, never +1 or named pieces.",
    "<b>Fallen companions are gone for good.</b> If a companion is knocked out, they leave your company a few seconds later and can never be hired again. Keep them healed, and pull back when a fight turns.",
    "<b>Ranged companions stand their ground:</b> a caster or archer who keeps backing away but is still being chased turns and fights in place for 30 seconds before trying to run again. One who is running because they are badly hurt keeps running.",
    "<b>Hurt mercenaries:</b> when the fight is over and you stand still, a mercenary at 75% health or less sits and rests to full. In a fight, at 50% health or less they run to a safe distance and fight from range (spells, bows, abilities) until they are above 70%. Under 25% they run clear and /rest until HP and MP are full. On Hold stance they stay put and rest where they are. Casters spend nearly all their MP and stay at range; healers always heal the lowest-health member first.",
    "<b>Stance:</b> Assist (fight your target), Follow (stay close and never attack; healers still heal) or Hold (stand where they are and only fight what comes to them). Set it in the Party window or with /stance.",
    "<b>Companion sheet:</b> click a companion in the party box, or press Sheet in the Party window. It shows what they wear, what they have for sale (👝 shows by their name when there is something), what they are keeping, and their bag.",
    "<b>Buying from companions:</b> their for-sale items cost 1.5 times the auction house value. Press Buy on the sheet.",
    "<b>Gear:</b> give companions equipment from your bag with Wear this. It must suit their job and your level. If it is better than what they wear they put it on and keep the old piece to sell; if not, they say so and you keep it. Tap ↩ on a piece to take it back. Their own kit fills any empty slot.",
    "<b>Bond:</b> companions who fight beside you grow closer: 1 point per kill that gives XP, 4 per notorious monster. Each bond level (up to 5) adds 3% to their HP, MP, attack, defense and accuracy, and they'll tell you a little about themselves.",
    "<b>Contracts:</b> the hiring fee covers one hour of play time. The clock only runs while you play, so logging out pauses it. When the hour is up, the companion asks for the next hour's wage as soon as you are out of combat, finished zoning and have every menu closed. Pay, or refuse.",
    "<b>Wages rise:</b> the hourly wage goes up with your level (they sync to it) and with better gear they wear, and comes down if you sync down. They tell you in the log when their rate goes up. The Party tab shows the time left and the next wage, with Pay now to add an hour early.",
    "<b>Old Friends:</b> a companion you refuse, or can't pay, goes back to Brann's Mercenary Hall and waits under Old Friends with their gear, bag and bond. To win them back you pay a bribe: their full hiring fee plus 100 crystals per level. They rejoin at your current level."
  ]));
  h += sec("🎣 Fishing", ul([
    "Buy a <b>Willow Rod</b> and <b>Fishing Bait</b> from a Tradesman. Stand at the edge of a pond or lake and use the rod (from your bag or the Items command) or type <b>/fish</b>. Each cast uses one bait. You raise the rod in both hands, a line and red-and-white float settle on the water, and the float dips and jitters when something bites.",
    "Wait for a bite, then press <b>Reel in!</b> (or Space, Enter or F) within about 2 seconds. Walking away, fighting or changing area pulls your line in.",
    "Catches: Outpost pond: Pond Minnow, Moat Carp. Rocky Hollow lakes: Moat Carp, Silver Shad, and the rare Lakeking Pike. Ashen Marsh ponds: Mud Eel, Bog Perch, and the rare Ghost Koi, which only bites in rain or storms.",
    "Fishing skill (up to 20) raises your catch rate against tougher fish. Fish sell well to any vendor, and the Trade Board sometimes asks for Moat Carp or Mud Eels."
  ]));
  h += sec("🕰️ Time and waiting", ul([
    "The <b>sun</b> and <b>moon</b> cross the sky with the game clock: the sun rises in the east around 06:00 and sets in the west around 18:00, turning orange near the horizon; the moon climbs after sunset and sets at dawn. Its shape follows the day of the cycle. Caves and buildings have no sky.",
    "A game day passes in about 58 real minutes (one game hour is about 2.4 real minutes). Night runs from 18:00 to 06:00 and brings different monsters.",
    "Main menu → Time opens a box: <b>Current time</b> writes the Leid'anav date, time and day element plus your own date and time to the log; <b>Wait</b> lets you pick 1 to 24 hours with − / + or the slider. While waiting, the <b>Stop</b> button ends the wait at once.",
    "Waiting only works in a town (enemies are near anywhere else) and only when no other adventurer is online, because everyone online shares one clock. The clock then races ahead, one game hour every 5 seconds, and the sky, weather, shops and night monsters follow. Stop ends it early. Leaving town, a fight or another player coming online interrupts it.",
    "Time you skip is saved with your character. If another adventurer comes online later, your clock rejoins the world's time."
  ]));
  h += sec("🌦️ Weather", ul([
    "Each outdoor area has its own weather, changing every 3 game hours (about 7 real minutes): clear, cloudy, rain, wind, fog or thunderstorms. The icon next to the clock shows it; /weather tells you more.",
    "Rain boosts water spells by 10%, wind boosts wind spells and thunderstorms boost lightning spells. This stacks with the day's element.",
    "Rain and storms make fish bite sooner. Fog and rain shorten how far you can see. The Ashen Marsh is foggy and wet more often than not.",
    "Weather changes the fight: in fog, blizzards and sandstorms (and a little in rain and storms) monsters can't spot you from as far away, and blizzards and sandstorms slow you down on foot. Some monsters only appear in certain weather: a storm-only Dune Worm in Sunscar sandstorms, Ice Wights in Frostspire blizzards and Drowned Ones in the marsh fog. They leave when the weather turns.",
    "You can see the weather around you: raindrops splash on the ground, distant lightning lights up the sky before the thunder arrives, wind carries leaves and dust, blizzards blow snow sideways and fog drifts past at ground level. On clear nights in the fields, fireflies come out. Snow kicks up under your feet in snowy weather."
  ]));
  h += sec("🎲 Treasure pool", ul([
    "With anyone else in the party, every item a monster drops goes into the treasure pool (the panel above the log) instead of straight into your bag. Crystals are split and key items go to you.",
    "Press <b>Lot</b> to roll 1–999 or <b>Pass</b>. Companions lot on everything except gear they can't wear, and pass when their 30-slot bag is full. Highest lot wins. A companion who wins a better piece wears it (the old one goes into their bag); anything else goes into their bag to sell.",
    "When you reach a town and a companion's bag is at least half full, they put everything they have for sale up at the auction house under their own name (⚔, violet), at the market price with no fee. The towns buy these lots slowly and the crystals go to your delivery box. Your companions can have up to 300 lots up between them; anything over that is sold to a shop and you get nothing for it. Kept gear (put away after a level sync) is never sold, but it does take bag slots. The Party tab shows each bag. You can still give them gear from the Party tab.",
    "If you don't choose within 45 seconds you lot automatically. If everyone passes, the item is lost."
  ]));
  h += sec("📋 Trade Board and 🔨 Forge", ul([
    "The <b>Trade Board</b> by the north path of the Outpost posts three requests a day (new ones at midnight UTC): hand over the materials for crystals.",
    "<b>Garrick the smith</b>, by the stalls, augments equipment: each augment adds a random bonus (STR, DEX, VIT, AGI, INT, MND, Attack, Defense, Accuracy, Evasion, HP or MP). Up to 2 per piece. Cost: 60 crystals per item level, 1 Iron Ore and 1 Fire Essence. Reforging rerolls all of a piece's augments for 40 crystals per level plus the same materials.",
    "Augments belong to the item type: every copy of that item you own shares them. They only apply to you, not to companions wearing the same piece."
  ]));
  h += sec("📚 Database (Y)", ul([
    "The Database is your record of the world, in eight tabs: Items, Equipment, Magic, Abilities, Jobs, People, Places and Bestiary. Each entry has a picture and details.",
    "It only lists what you have found: items and gear you have owned, spells you have learned, abilities of jobs you have leveled to, jobs above level 1 (and your current ones), people you have talked to, places you have visited and creatures you have met.",
    "<b>Bestiary:</b> a creature is recorded the first time you defeat it; just seeing one doesn't count. Defeat one to learn how it hunts and its special attack; defeat five (or one notorious monster) to learn its elemental weaknesses and what it carries.",
    "/bestiary and /database open it too."
  ]));
  h += sec("🏆 Achievements (O) and Stats", ul([
    "Achievements track hunting, notorious monsters, skillchains, bursts, levels, quests, exploring, crafting, gathering, gardening, your home, companions, the Database and more.",
    "They give no rewards: they are a record of what you have done.",
    "The <b>Stats</b> tab inside Achievements counts what you have done: play time, job levels, craft and gather skills, creatures defeated by kind, distance walked and ridden, monsters defeated, damage dealt and taken, your biggest hit, spells cast, abilities and items used, crafting, gathering, fishing, trading, auction sales and distance ridden. Damage, spell, ability and item counts begin at version 18.16."
  ]));
  h += sec("🏠 Your residence", ul([
    "The door is on the west cottage of Ashenreach Outpost; walking into it asks if you want to go in. <b>Pip the Nubbin</b> lives there.",
    "<b>Storage:</b> Pip keeps " + CONFIG.storageBase + " slots of items, plus 10 for a placed Storage Chest, 5 for a Bookshelf and 15 for a Wardrobe. Stored items don't count against your bag.",
    "<b>Furniture:</b> Odette by the west wall sells it. Ask Pip to arrange: pick a piece, tap a tile on the 10×8 grid; tap a placed piece to rotate or pack it away. The door tiles and Pip's corner are blocked; rugs can sit under other pieces.",
    "Odette's quest <i>Make It Home</i> rewards a potted plant for placing two pieces."
  ]));
  h += sec("🌙 Townsfolk", ul([
    "People in the Outpost go home at night and come back out in the morning, each at their own hour: Ysolde 19:30–5:30, Tobin 20:00–7:00 (the job masters and stablemasters in Saltreach and Ironvale stay at their posts), Odette 21:30–6:00, Rhea 22:00–6:00, Brann 23:00–7:30 (game time).",
    "While someone is indoors you can't talk or trade with them. The Home Point Crystal is always there."
  ]));
  h += sec("⛏️ Gathering", ul([
    "Look for ore rocks, log piles and herb patches in Rocky Hollow and the Goblin Den (grey, brown and green dots on the compass map). Tap one to gather.",
    "Each needs a tool from a Tradesman: Pickaxe (mining), Hatchet (logging), Sickle (harvesting). A tool breaks 25% of the time, minus 1% per skill level (never below 5%).",
    "A point runs dry after 1–3 uses and a new one appears elsewhere 45 seconds later. Gathering raises its own skill, up to 20."
  ]));
  h += sec("⚒️ Crafting", ul([
    "<b>Recipes are learned from Recipe scrolls.</b> You start knowing only the basic materials (Bronze Ingot, Ash Lumber, Silk Cloth, Potion, Grilled Minnow). Spellsmiths sell recipe scrolls along with spell scrolls. Rare recipes for gear that can come out as the +1 version drop rarely from monsters of about the right level (notorious monsters and bosses more often) or come as quest rewards. Read a scroll with Use from Items.",
    "Open the Crafting window (N, or /craft). Put an essence in the big slot on the left and up to 8 ingredients in the small slots by tapping them in your bag. The right side lists what that combination can make; ★ means the combination is exact. Press OK to craft, Cancel to clear. Tapping a result fills in the slots for you when you have the ingredients. Recipe notes lists every recipe you can learn. It takes " + CONFIG.synthTime + " seconds and works anywhere outside combat; being attacked interrupts it.",
    "Each craft uses one elemental essence: Fire for Smithing and Cooking, Wind for Woodworking, Earth for Clothcraft, Water for Alchemy.",
    "Success starts at 65% when your skill equals the recipe level and moves 7% per level (5–95%). Each level above the recipe adds 5% chance of a high-quality +1 item, up to 50%. A failure uses up the essence and loses some ingredients.",
    "Skill rises on recipes near or above your level, up to " + CONFIG.craftCap + "."
  ]) + tbl(["Craft", "Essence", "Makes"], Object.keys(CRAFTS).map(k => [CRAFTS[k].icon + " " + CRAFTS[k].name, ITEMS[CRAFTS[k].crystal].name, (l => l.length > 12 ? l.slice(0, 10).join(", ") + " and " + (l.length - 10) + " more" : l.join(", "))(RECIPES.filter(r => r.craft === k).sort((x, y) => x.lv - y.lv).map(r => ITEMS[r.out].name))])));
  h += sec("🍳 Cooking and food", ul([
    "Cooking is a craft (Crafting in the main menu) that turns fish, herbs, Grain Flour and Rock Salt (Tradesmen sell both) into meals. Each recipe makes 2–3 servings.",
    "Eat a meal from your bag or the Items command for " + CONFIG.foodMinutes + " minutes of play time of bonuses (it only counts down while you're playing). One meal at a time: eating another replaces it. You can't eat mid-fight.",
    "Meals: " + Object.keys(ITEMS).filter(k => ITEMS[k].kind === "food").map(k => ITEMS[k].name + " (" + foodText(ITEMS[k].food) + ")").join(" · ") + "."
  ]));
  h += sec("🌱 Gardening", ul([
    "Place a Flowerpot in your residence (Odette sells them), then select it in Arrange to plant, water, feed and harvest.",
    "A plant grows through three stages of 10 real minutes each, but only while watered: water it at every stage.",
    "Feed it one crystal. A matching crystal grows extra: Earth for herbs, Wind for ash, Water for moonbloom. Wildgrass grows crystals of whichever element you feed it.",
    "Seeds: Herb Seeds (3–6 Healing Herbs), Ash Sapling (2–4 Ash Logs), Wildgrass Seeds (2–4 crystals), Moonbloom Seeds (Ethers and a chance at rare materials; a rare drop)."
  ]));
  h += sec("🦖 Mount", ul(["Earn the Riding License from Ysolde at level 20 (300 crystals and 3 Healing Herbs).", "Press R (or the Mount button on phones) in open country. You move 2.2× faster and monsters ignore you. Your companions ride too. Engaging, being hit or entering town or a cave dismounts you.", "<b>Stable</b> (talk to Ysolde): dye your Thornstrider Marsh Teal, Ember Crimson, Night Sable, Dune Gold or Frost Ivory (pay once, switch freely), and buy the Swift Saddle for 15% more speed.", "<b>The Hollow Run</b>: Ysolde times you through 5 checkpoints across Rocky Hollow (a gold column and a yellow minimap dot mark the next one). Gold under 26 s, silver under 36 s, bronze under 50 s; each medal pays out the first time. Dismounting, leaving or going over 75 s ends the run."]));
  h += sec("📱 Performance", ul([
    "Zone exits wind and widen, rocks sit on the ground rather than hovering over slopes, and the end of an outside exit shows hazy hills tinted like the zone beyond.",
    "Walking off the edge of a zone hands control to the game for about a second: you walk out, the screen fades to the loading screen, and you walk in on the other side. Doors and warps go straight to the loading screen. Every time a zone finishes loading (zone lines, doors, warps, home point, logging in) the world fades in from black.",
    "The game keeps painted ground textures and the item icon sheet in your browser so return visits load faster. They reset on every update; <b>/clearcache</b> removes them if anything looks wrong.",
    "Config > Interface > <b>Load timings</b> shows the same start-up and zone-load list as <b>/perf</b> without typing.",
    "Type <b>/perf</b> in chat to list how long start-up and your last few zone loads took, step by step, plus any props floating above the ground.",
    "Config → Performance: <b>Draw distance</b> (near hides monsters beyond about 50 m, far shows them out to 130 m), <b>Auto resolution</b> (lowers the render scale when the frame rate drops, raises it when it recovers) and an <b>FPS counter</b> (or type /fps).",
    "Config → Graphics: Low turns off shadows, water reflections and grass and is best for older phones. Phones with little memory start on Low."
  ]));
  h += sec("👥 Other players and chat", ul([
    "Other adventurers in the same area appear in the world with their own race, gear and name (in green), moving, fighting and casting in real time.",
    "Type in the chat box to <b>say</b> something to players near you (a speech bubble appears over your head). <b>/shout</b> reaches everyone in the area, <b>/tell Name message</b> reaches one player anywhere (<b>/r</b> replies), and <b>/who</b> lists who's online and where.",
    "While typing (/), the <b>Chat</b> tab in the log shows only player messages.",
    "Tap or click another player to see their job and level and to Invite, Trade, send a Tell or Check them.",
    "<b>Shared monsters:</b> when other adventurers are in your area, everyone sees and fights the same monsters. One player's game (the first to arrive) runs the area's monsters for everyone; if they leave or put the game in the background, another player takes over without the monsters resetting. /who shows who is running the area.",
    "<b>Claims:</b> the first player to hit a monster, or the player it attacks first, claims it. Only the claimer and their party can attack it, and only the claimer (sharing with their party) gets experience and loot. Name colors: <span style=\"color:#ff6b6b\">red</span> = claimed by you or your party, <span style=\"color:#c77dff\">purple</span> = claimed by someone else. The target window says who. A claim ends when the monster gives up and walks home.",
    "<b>Fighting together:</b> skillchains and magic bursts work across players in the same party: one player opens with a weapon skill, another closes it, and a mage can burst the result. Damage from other players shows in blue over the monster.",
    "<b>/assist Name</b> targets whatever that player nearby is targeting. Party members show with blue names; other players with green.",
    "Your companions still fight beside you, but other players don't see them, and monsters you share treat their attacks as yours.",
    "Battlefields such as the Chapel Depths stay private to you."
  ]));
  h += sec("🤝 Parties with other players", ul([
    "Invite up to " + CONFIG.partyMax + " players: tap them and choose <b>Invite</b>, use the Party window, or type <b>/invite Name</b>. The invited player gets a popup, or can type <b>/join</b> or <b>/decline</b>. Only the leader (👑, the player who has been in the party longest) can invite or remove members.",
    "Party members are listed in the Party panel at the bottom right under your companions, with HP and MP. A faded row means they're in another area; tap a row to target them.",
    "<b>Experience:</b> when anyone in the party defeats a monster, everyone in the same area within about " + Math.round(CONFIG.partyRange / 100) + " strides gets a share. The share is based on the highest level member nearby, so a big gap in levels means less experience for the lower levels. Bigger parties earn more in total (2 players: 60% each, 3: 45%, 4: 37%, 5: 32%, 6: 28%). EXP chains carry over from the player who made the kill.",
    "<b>Loot:</b> every drop from a party kill goes into a shared treasure pool. Everyone nearby can Lot or Pass; the highest lot wins once all have chosen or time runs out. Crystals are split evenly.",
    "Kills by a party member nearby count for your quest and guild bounty tallies too.",
    "<b>Magic on party members:</b> tap a party member and choose Magic, or target them and cast. Cure spells and Protect work on players in your party.",
    "Your companions stay with you and fight only your monsters. Party chat: <b>/p text</b>. Leave with <b>/leave</b>, remove a member with <b>/kick Name</b>."
  ]));
  h += sec("🛡️ Equipment", ul([
    "Open <b>Equipment</b> (G). Sixteen boxes: Main, Sub, Range, Ammo / Head, Neck, Ear, Ear / Body, Hands, Ring, Ring / Back, Waist, Legs, Feet.",
    "<b>Main:</b> one- and two-handed weapons. <b>Sub:</b> shields. <b>Range</b> and <b>Ammo:</b> bows and crossbows (a bow in Range turns your attack into a ranged shot, and the arrow or bolt in Ammo adds half its damage), plus boomerangs and instruments. <b>Neck:</b> gorgets and pendants. <b>Ear</b> and <b>Ring:</b> two of each. <b>Back:</b> capes and mantles. <b>Waist:</b> belts and sashes.",
    "Tap a box to list everything in your bag that fits it; tap an item to see its card (with what you're wearing now underneath for comparison) and tap it again, or press Equip, to put it on. Remove takes the piece off. Items you can't use yet are greyed with the reason.",
    "Under the boxes: your Attack and Defense, and your resistance to the eight elements. Resistance lowers elemental damage from monster special moves and spells, up to half.",
    "Item cards show the slot, every stat, the jobs and level needed, and the item level. Armorers, weaponsmiths and jewelers sell gear up to level 5; Haldor sells +1 gear from level 14. The +1 versions are made by crafters or found; Haldor sells them from level 14.",
    "<b>Race clothes:</b> each race has two starting body pieces (a Warrior one and a mage one) and one pair of legwear that only that race can wear. Your character begins in the right ones for your race and job. They can't be bought, sold at auction, dropped or crafted; the item card shows the race that can wear them.",
    "All equipment runs from level 1 to 20, each piece with its own name, level, jobs and slot. Monsters rarely drop gear close to their own level, and bosses and notorious monsters carry rare pieces. The Warp Ring (Use from your bag) takes you home."
  ]));
  h += sec("🖥️ The screen", ul([
    "<b>Main menu:</b> Esc with nothing targeted, - (or Insert), or tapping yourself and choosing Main Menu opens the main menu window in the top right. ↑ ↓ choose, Enter confirms, ← → switch between its two pages, Esc closes. <b>Status</b> opens the in-world status screen: your sheet on the left (green numbers are bonuses from gear), the chosen page in the middle and the Status list on the right. Press <b>C</b> to open the menu straight on Status (press C again to close it, Esc to step back).",
    "<b>Compass map:</b> sits above the event log (or at the bottom when the log is hidden). The tilted dish turns with your view and shows N/E/S/W, people (green), quest givers (gold), monsters (orange, red when fighting) and your party (blue). Under it are the time and your map square. Tap it for the full map; turn it off in Config → Interface.",
    "<b>Spells</b> are learned by reading scrolls (from shops and monster drops) once one of your jobs is high enough level.",
    "<b>Keyboard in windows:</b> arrows move, Enter chooses, Esc goes back or closes.",
    "<b>Phones:</b> Target and Menu buttons sit above the bottom-right boxes; tap the event log to type.",
    "<b>Lists:</b> Items, Shop, Quests, Magic and Abilities are slim lists in the top left. Point at an entry for its card (under the list) and description (Help bar); choose it for a small box of actions. In a command menu, Magic shows MP Cost and Next (recast) above the target frame.",
    "<b>Bottom right:</b> separate Target and Party boxes.",
    "<b>Signs:</b> every shop and hall you can visit has one sign on its front. Buildings without a sign are ordinary homes.",
    "<b>Windows:</b> menus open in the top left of the screen while the world keeps going. The Commands box shows the window's name and the Help bar explains it. Esc closes it.",
    "<b>Talking:</b> what people say goes into the event log. If there's a choice to make, a small box appears above the log: ↑ ↓ choose, Enter confirm, Esc back out. Yes/no questions use the same box.",
    "<b>Top:</b> the Commands box and the Help bar appear while something is targeted or a menu is open; the Help bar explains the highlighted command. The Network box beside it shows connection strength and messages sent (S) and received (R).",
    "<b>Top left:</b> HP, MP and TP appear while you're in a fight. Status icons beside them show your buffs, food, resting and the City Blessing (blue crystal). Hover or long-press an icon for its name and time left.",
    "<b>Item icons:</b> every item has a painted icon. A green, blue or purple frame marks uncommon, rare and epic items. Weapon metal hints at quality: bronze, iron, steel, then gold-trimmed and gem-set pieces.",
    "<b>Bottom right:</b> Target shows your target's name and HP. Monster names are green while calm and red once they attack you or your party; purple means someone else has claimed it. <b>Locked</b> shows while you're auto-attacking it; while locked you keep facing it as you move, so you sidestep and back-pedal instead of turning away. Disengage to run off freely. Below is Party (or Solo when you're alone) with everyone's HP and MP.",
    "<b>Bottom:</b> the event log. New messages open it fully; after a few quiet seconds it shrinks to three lines. Each Esc hides one more line until it's gone. Press / to type (the tabs and typing box appear), or L to keep it open; on phones tap yourself and choose Chat. Tabs filter combat, loot, system and player chat; type commands in the box under it.",
    "<b>Command menu:</b> opens on the left above the log when you target a monster or player, tap yourself, or press Enter. ↑ ↓ to choose, Enter or → to confirm, ← to go back, Esc to close. Disengage stops attacking and lets go of the target.",
    "<b>Target cursor:</b> the small crystal arrow over your target is blue in range, yellow near the edge of range and red out of range (melee reach, or spell range while you're choosing magic). Some commands can still fail when it's yellow.",
    "<b>Name plates</b> (Config → Interface): players in white with blue edges, people in green, monsters in pale gold (red while attacking you).",
    "<b>Look and outlines:</b> The game has one look, painted in the style of early online RPGs: flatter few-tone ground, bark, leaves and stonework, banded sunlight and shade, shorter distance haze and blocky clouds; chunky low-detail models with big hands, flared cuffs and collars, thick clumped hair and hand-painted textures with a few tones and ink lines, crisp up close. Config → Graphics has Outlines (a dark line around characters and monsters; on for Medium and High and off for Low unless you change them) and Job style / Show gear. Job style dresses everyone in their job's signature outfit (new looks at levels 5, 10 and 16); Show gear draws equipped armour instead, and weapons and shields always show. If the game feels slow on a phone, set Quality to Low or Medium. Townsfolk are a mix of the five races and dress by district (clerks, merchants, smiths, sailors, travellers); night walkers carry lanterns. Monsters change colour with level (new shades at 6, 11 and 16), and notorious monsters wear crowns, horns or spikes with a glowing ring at their feet. Weapons and shields are chunky with crest-painted shields. Faces use a few flat shading tones, an ink eyelid line and darker inner ears. Changing a graphics option reloads the game.",
    "<b>Damage numbers:</b> red numbers pop out of anyone who takes damage and fizzle away. Turn them off in Config → Interface → Damage numbers.",
    "<b>Looking:</b> your character turns its head toward your target; people look at you when you target them or stand close, and monsters watch who they're fighting.",
    "<b>No sound?</b> Browsers only allow sound after you tap, click or press a key. If you still hear nothing, check the volume sliders in Config and your device's mute switch.",
    "<b>Music changes with the fight and the sky:</b> battles have four themes depending on how tough the monster is (easy or weak, fair, tough or very tough, incredibly tough), and Notorious Monsters and bosses have their own. When the last enemy falls the battle music stops at once and one of three victory fanfares plays, picked at random, before the area music returns. Towns, fields and homes also have their own music for night, rain, storms and snow (fields have a foggy theme too).",
    "<b>Interface sounds:</b> the Interface slider in Config controls menu sounds (cursor tick, confirm, cancel, window open and close, errors, target, equip, coins, tell and party chimes). Turn it down to keep music and combat but silence the menus.",
    "<b>Listening:</b> monsters call out when they notice you, so a jabber or a growl behind you is worth turning around for. Footsteps tell you what you're walking on."
  ]));
  h += sec("💬 Social: friends, linkshells and search", ul([
    "Open <b>Social</b> from the first page of the main menu (or /social); it replaces the old Party, Search, Linkshell and Friend List buttons. Party is also on P. It shows who's online, your friends, your linkshells and your blacklist.",
    "<b>Search:</b> filter the online list by job (WHM), level (12) or range (10-15), area, name, <b>lfg</b> or <b>here</b>. /search does the same in chat.",
    "<b>Looking for a party:</b> turn it on (or /seek message) and others see 🔎 and your short message next to your name. Turn it off the same way.",
    "<b>Friends:</b> add up to 50 with + Friend or /friend add Name. You're told when they come online or go offline, and can Tell or Invite them from the list. Your friend list belongs to this character.",
    "<b>Linkshells</b> are chat groups that stay together across areas, like a guild. Make one for 500 crystals; the founder is the leader (👑) and can promote sack holders (🎒) who can also invite and remove members. You can be in up to 3; talk to the active one with <b>/l</b>, or a specific one with /l1, /l2, /l3. Members' linkshell names show in search.",
    "If the leader leaves, the longest-serving sack holder (or member) takes over. When the last member leaves, the linkshell is gone.",
    "<b>Blacklist:</b> /blacklist add Name hides that player's chat, tells, linkshell messages, party invitations and trade requests."
  ]));
  h += sec("🔄 Trading", ul([
    "Stand near another player and tap them, then choose <b>Trade</b>, or type <b>/trade Name</b>. They get a popup to accept.",
    "Add up to " + CONFIG.tradeSlots + " kinds of item and any number of crystals. Both offers show side by side. Changing an offer clears both acceptances, so you always see the final deal before it happens.",
    "The trade goes through when you both press Accept on the same offers. You need room in your bag for what you receive, and you can't receive a Rare item you already have.",
    "Key items and Exclusive items can't be traded. Closing the trade window or walking away cancels it.",
    "Trades are finished on the game server in a single step: the server checks that both players really have the items and crystals and room in their bags, then moves everything at once. If anything is off, nothing changes for either player."
  ]));
  h += sec("🌐 Accounts and saving", ul(["You need an account and an internet connection to play. Sign in on the title screen with your email and password. Creating an account needs the sign-up password from the server owner; you may have to confirm your email first.", "Your characters live on the game server, so sign in from any device to keep playing. Up to 8 characters per account, and every name is unique on the server.", "Progress saves to the server about every 15 seconds and when you close or hide the game. If the connection drops, the game keeps saving on your device and catches up when it's back; System shows when you last saved.", "Characters you made in this browser before accounts existed can be uploaded once from the character screen.", "System → Download a copy saves a backup file of the current character. Sign out from System or the character screen.", "The game owner's account also gets Config → More → Admin: ping, last save, who is online and where, server totals, suspicious saves and bans.", "The server checks each save. Impossible changes (a level above the cap, a negative or enormous crystal count, a renamed character) are refused, and unusual jumps are flagged for the game's admin. Accounts that cheat can be banned."]));
  h += sec("👥 Server places and the line", ul([
    "Up to 20 players can be online at once. When the server is full, Play Online puts you in a line that shows your place (#1 is next) and how many are ahead. Keep the page open; you join as soon as a place frees up. Leave the line at any time and Play Offline is still there.",
    "A place is held while your game keeps in touch with the server. If your connection drops you keep your place for about 2 minutes, so a refresh or a short network blip won't send you to the back of the line.",
    "Not touching anything logs you out after 30 minutes so your place can go to someone waiting. You get a one-minute warning with an I'm here button. Change the time (5 to 60 minutes) in Config → Online. On the character select and creation screens the limit is a fixed 15 minutes.",
    "The Network box shows how many players are online, for example 👥 12/20. The admin account never needs a place.",
    "<b>Admin → Logins</b> lists every session from the last 30 days: who, which character, when they started, how long they stayed, and whether they are still in or how they left (logged out, signed out, idle, timed out).",
  ]));
  h += sec("💾 Updates", ul([ "The game checks for new versions about every 5 minutes and shows one popup for the newest version only, even if several came out. Reload jumps straight to the newest. Later hides it until an even newer version comes out. If a reload still lands on an older copy (the web host can take a few minutes to catch up), it waits 15 minutes before asking again. System → Check for updates checks right away."]));
  sec("📋 Every menu and key", guideRef());
  if (!HELP_CATS.some(c => c[0] === UI.helpCat)) UI.helpCat = "ref";
  const cat = HELP_CATS.find(c => c[0] === UI.helpCat), rest = HELP_CATS.slice(1), isRef = x => HELP_CATS[0][3].test(x[0]);
  const mine = cat[0] === "ref" ? secs.filter(isRef) : secs.filter(x => !isRef(x) && cat[3].test(x[0]) && rest.find(c => c[3].test(x[0])) === cat);
  const extra = cat[0] === "start" ? secs.filter(x => !isRef(x) && !rest.some(c => c[3].test(x[0]))) : [];
  let out = '<div class="help"><div class="opt" style="flex-wrap:wrap;margin-bottom:8px">' + HELP_CATS.map(c => '<button data-a="helpcat" data-v="' + c[0] + '"' + (c[0] === cat[0] ? ' class="pri"' : "") + ">" + c[1] + " " + c[2] + "</button>").join("") + "</div>";
  out += '<p style="margin:0 0 8px">' + (cat[0] === "ref" ? "Every command, key and chat command in the game. Pick a topic above for the full guide." : "Tap a heading to open it.") + "</p>";
  mine.concat(extra).forEach((x, i) => { out += "<details" + (cat[0] === "ref" || i === 0 ? " open" : "") + "><summary>" + x[0] + "</summary>" + x[1] + "</details>"; });
  return out + "</div>";
}

const GAME_VERSION = "__PKGVER__";
const LATEST_URLS = ["version.json", "https://raw.githubusercontent.com/ianmcgo/Untitled-Solo-MMO/main/version.json"];
const PLAY_URL = "https://ianmcgo.github.io/Untitled-Solo-MMO/";

function verCmp(a, b) {
  const pa = String(a).split(".").map(n => parseInt(n, 10) || 0), pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return d > 0 ? 1 : -1; }
  return 0;
}

async function fetchLatest() {
  const urls = location.protocol.startsWith("http") ? LATEST_URLS : LATEST_URLS.slice(1);
  for (const u of urls) {
    try {
      const r = await fetch(u + "?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) continue;
      const j = await r.json();
      if (j && j.version) return j;
    } catch (e) {}
  }
  return null;
}

function verStore(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }

async function checkForUpdate(manual) {
  if (/^__/.test(GAME_VERSION)) return;
  const now = Date.now();
  if (!manual && (UI.verBusy || now - (UI.verLast || 0) < 60000)) return;
  UI.verBusy = true; UI.verLast = now;
  let j = null;
  try { j = await fetchLatest(); } finally { UI.verBusy = false; }
  if (!j) { if (manual) log("Couldn't check for updates right now.", "sys"); return; }
  if (verCmp(j.version, GAME_VERSION) <= 0) { verStore("usr_reload_target", null); if (manual) log("You have the latest version (v" + GAME_VERSION + ").", "sys"); return; }
  if (!manual) {
    if (verStore("usr_ver_dismissed") && verCmp(j.version, verStore("usr_ver_dismissed")) <= 0) return;
    const tried = verStore("usr_reload_target"), at = +(verStore("usr_reload_at") || 0);
    if (tried && verCmp(j.version, tried) <= 0 && now - at < 15 * 60000) return;
    const pop = $("verPop");
    if (pop && pop.style.display === "block" && pop.dataset.ver === j.version) return;
  }
  showVersionPopup(j);
}

function versionPop(html) {
  let el = $("verPop");
  if (!el) { el = document.createElement("div"); el.id = "verPop"; el.className = "glass"; $("ui").appendChild(el); }
  el.innerHTML = html;
  el.style.display = "block";
  return el;
}

function showVersionPopup(j) {
  const web = location.protocol.startsWith("http");
  const el = versionPop('<div class="vpT">✨ New version available</div><div class="vpB">Version <b>v' + esc(j.version) + "</b> is out (you have v" + esc(GAME_VERSION) + ")." + (j.title ? "<br>" + esc(j.title) : "") + '<br><span class="sub">Your progress is saved first, so nothing is lost.</span></div><div class="vpA"><button data-v="reload" class="pri">' + (web ? "Reload now" : "Open latest") + '</button><button data-v="later">Later</button></div>');
  el.dataset.ver = j.version;
  sfx("notify");
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.v === "reload") {
      saveGame();
      verStore("usr_reload_target", j.version); verStore("usr_reload_at", String(Date.now()));
      if (web) { const u = new URL(location.href); u.searchParams.set("v", j.version); location.replace(u.toString()); }
      else window.open(PLAY_URL, "_blank");
    } else { verStore("usr_ver_dismissed", j.version); el.style.display = "none"; sfx("close"); }
  };
}

function showWhatsNew() {
  let seen = null;
  try { seen = localStorage.getItem("usr_seen_version"); localStorage.setItem("usr_seen_version", GAME_VERSION); } catch (e) {}
  const tried = verStore("usr_reload_target");
  if (tried && verCmp(GAME_VERSION, tried) < 0 && !/^__/.test(GAME_VERSION)) log("The newest version (v" + tried + ") hasn't reached this page yet. It will load next time you open the game.", "sys");
  if (/^__/.test(GAME_VERSION) || !seen || seen === GAME_VERSION) return;
  const u = UPDATES.find(x => x.v === GAME_VERSION) || updatesSorted()[0];
  toast("📰", "Updated to v" + GAME_VERSION, u.title + " · see the Updates tab");
  log("Updated to v" + GAME_VERSION + ": " + u.title + ". Open Updates (📰) for details.", "sys");
}

function initVersionCheck() {
  showWhatsNew();
  setTimeout(() => checkForUpdate(false), 4000);
  setInterval(() => checkForUpdate(false), 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkForUpdate(false); });
}

function gearBonus() {
  const g = {};
  const augs = save.augments || {};
  for (const sl of SLOTS) {
    const id = player.gear[sl], it = id && ITEMS[id];
    if (!it) continue;
    if (it.stats) for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k];
    if (augs[id]) for (const [k, v] of augs[id]) g[k] = (g[k] || 0) + v;
  }
  return g;
}
function playerTitle() {
  let best = null;
  for (const a of ACHIEVEMENTS) { const t = save.ach && save.ach[a.id]; if (t && (!best || t > best[0])) best = [t, a.name]; }
  return best ? best[1] : "Fledgling Adventurer";
}
function fmtPlay(sec) {
  sec = Math.floor(sec || 0);
  const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return (d ? d + "d " : "") + h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function statusLeftHTML(noLv) {
  const p = player, j = save.jobs[save.mainJob], need = xpNeed(j.lv), g = gearBonus();
  const gear = SLOTS.map(sl => save.gear[sl]).filter(id => id && ITEMS[id] && ITEMS[id].kind === "equip");
  const ilv = gear.length ? Math.round(gear.reduce((n, id) => n + (ITEMS[id].lv || 1), 0) / gear.length) : 0;
  let h = '<div class="stBox"><div class="ffHead"><span>Status</span></div>';
  h += '<div class="stNm">' + esc(save.name || "Adventurer") + "</div>";
  h += '<div class="stJob main">Lv' + p.lv + " " + esc(JOBS[p.job].name) + "</div>";
  { const lk = save.look || {}; h += '<div class="stJob">' + esc((RACES[lk.race] || RACES.human).name) + " " + (lk.build ? "♀" : "♂") + " · " + CC_SIZES[ccSizeOf(lk)][0] + "</div>"; }
  if (p.sub && JOBS[p.sub]) h += '<div class="stJob">Lv' + Math.floor(p.lv / 2) + " " + esc(JOBS[p.sub].name) + "</div>";
  h += '<div class="stRow"><em>ILv</em><b>' + ilv + ' <small>Su —</small></b></div>';
  h += '<div class="stRow gap"><em>HP</em><b>' + Math.ceil(p.hp) + " / " + p.maxHp + '</b></div><div class="stRow"><em>MP</em><b>' + Math.floor(p.mp) + " / " + p.maxMp + '</b></div><div class="stRow"><em>TP</em><b>' + Math.floor(p.tp) + "</b></div>";
  h += '<div class="stAt">';
  for (const [k, l] of [["str", "STR"], ["dex", "DEX"], ["vit", "VIT"], ["agi", "AGI"], ["int", "INT"], ["mnd", "MND"], ["chr", "CHR"]]) {
    const tot = p.stats[k] || 0, b = Math.round(g[k] || 0);
    h += "<em>" + l + "</em><b>" + (tot - b) + "</b><i>" + (b ? (b > 0 ? "+" : "") + b : "") + "</i>";
  }
  h += "</div></div>";
  if (noLv) return h;
  const pct = need ? Math.max(0, Math.min(100, j.xp / need * 100)) : 100;
  h += '<div class="stBox stLv"><div class="stJob main">Level ' + j.lv + '</div><div class="stK">EXP</div><div class="stV">' + (need ? j.xp.toLocaleString() : "—") + '</div><div class="stK">NEXT Level</div><div class="stV">' + (need ? need.toLocaleString() : "MAX") + '</div><div class="stBar"><span style="width:' + pct + '%"></span></div></div>';
  return h;
}
function statusPanelHTML(k) {
  const sec = (t, body) => '<div class="stTitle">' + t + "</div>" + body;
  const kv = (l, v) => '<div class="stKV"><em>' + l + "</em><b>" + v + "</b></div>";
  const cur = sk => Math.floor(Math.min((save.skills[player.job] || {})[sk] || 0, Math.max(0, skillCap(player, sk))));
  const grid = rows => '<div class="stGrid">' + rows.join("") + "</div>";
  const sr = (n, v, off) => '<div class="stSk' + (off ? " off" : "") + '"><em>' + esc(n) + "</em><b>" + v + "</b></div>";
  if (k === "profile") {
    const rc = RACES[save.look.race] || RACES.human, gr = guildRank(), nx = GUILD_RANKS[gr + 1], tot = save.guild.total || 0;
    const pct = nx ? Math.round((tot - GUILD_RANKS[gr][1]) / (nx[1] - GUILD_RANKS[gr][1]) * 100) : 100;
    let h = sec("Profile", kv("Race:", esc(rc.name || save.look.race)) + kv("Home Point:", esc(ZONES[save.home.zone] ? ZONES[save.home.zone].name : "—")) + kv("Guild Rank:", esc(GUILD_RANKS[gr][0])) + kv("Guild Points:", (save.guild.gp || 0).toLocaleString()) + '<div class="stBar wide"><span style="width:' + pct + '%"></span></div>');
    return h;
  }
  if (k === "jobs") {
    const known = Object.keys(JOBS).filter(j => !JOBS[j].advanced || (save.jobsUnlocked && save.jobsUnlocked[j]));
    return sec("Job Levels", grid(known.map(j => '<div class="stSk' + (j === save.mainJob ? " main" : j === save.subJob ? " sub" : "") + '"><em>' + esc(JOBS[j].name) + "</em><b>" + (save.jobs[j] ? save.jobs[j].lv : 1) + "</b></div>")));
  }
  if (k === "combat") return sec("Combat Skills", grid(COMBAT_SKILLS.map(sk => sr(SKILL_NAMES[sk], skillCap(player, sk) > 0 ? cur(sk) : "—", skillCap(player, sk) <= 0))));
  if (k === "magic") return sec("Magic Skills", grid(MAGIC_SKILLS.map(sk => sr(SKILL_NAMES[sk].replace(" Magic", ""), skillCap(player, sk) > 0 ? cur(sk) : "—", skillCap(player, sk) <= 0))));
  if (k === "craft") {
    const row = (n, v) => '<div class="stCr"><em>' + esc(n) + "</em><b>" + craftRank(v) + "</b><i>(" + v + ")</i></div>";
    let rows = [row("Fishing", save.gatherSkill.fishing || 0)];
    for (const c of Object.keys(CRAFTS)) rows.push(row(CRAFTS[c].name, Math.floor(craftSkill(c))));
    for (const [g, l] of [["mining", "Mining"], ["logging", "Logging"], ["harvesting", "Harvesting"]]) rows.push(row(l, save.gatherSkill[g] || 0));
    return sec("Craft Skills", rows.join(""));
  }
  if (k === "cur") return sec("Currencies", kv("Crystals:", (save.gil || 0).toLocaleString()) + kv("Guild Points:", (save.guild.gp || 0).toLocaleString()) + kv("Points earned:", (save.guild.total || 0).toLocaleString()) + kv("Bounties:", save.stats.bounties || 0));
  if (k === "time") return sec("Play Time", kv("Total:", fmtPlay(save.playSec)) + kv("Started:", new Date(save.created || Date.now()).toLocaleDateString()));
  return "";
}
function renderStatusOv() {
  const el = $("stOv");
  if (!el) return;
  const m = UI.mm;
  if (!m || m.sub !== "status") { el.classList.remove("on"); $("ui").classList.remove("stOn"); return; }
  const it = STATUS_CMDS[m.sel];
  el.innerHTML = '<div id="stL">' + statusLeftHTML() + '</div><div id="stM" class="stBox">' + statusPanelHTML(it[1]) + "</div>";
  el.classList.add("on");
  $("ui").classList.add("stOn");
}

function eqFits(sl) { return [...new Set(save.inventory.map(x => x.id))].filter(id => ITEMS[id].kind === "equip" && slotKeys(ITEMS[id].slot).includes(sl)); }
function modalKey(k) {
  if (S.modal === "equipment") {
    UI.eq = UI.eq || { slot: null, hover: null };
    const q = UI.eq;
    if (q.list) {
      const L = eqFits(q.slot), n = L.length;
      if (k === "escape" || k === "backspace" || k === "arrowleft") { q.list = false; q.hover = null; sfx("close"); renderModal(); return true; }
      if (!n) return k.startsWith("arrow") || k === "enter";
      const i = Math.max(0, L.indexOf(q.hover));
      if (k === "arrowup") { q.hover = L[(i - 1 + n) % n]; sfx("cursor"); renderModal(); return true; }
      if (k === "arrowdown") { q.hover = L[(L.indexOf(q.hover) + 1) % n]; sfx("cursor"); renderModal(); return true; }
      if (k === "enter") { const id = q.hover || L[0], why = canEquip(id); if (why) { log(why + ".", "sys"); sfx("error"); } else { equip(id, q.slot); q.hover = null; q.list = false; } renderModal(); return true; }
      return false;
    }
    let i = Math.max(0, SLOTS.indexOf(q.slot));
    const mv = { arrowleft: -1, arrowright: 1, arrowup: -4, arrowdown: 4 }[k];
    if (mv) { if (q.slot) i = (i + mv + 16) % 16; q.slot = SLOTS[i]; q.hover = null; sfx("tab"); renderModal(); return true; }
    if (k === "enter" && q.slot) { const L = eqFits(q.slot); q.list = true; q.hover = L[0] || null; sfx("select"); renderModal(); return true; }
    return false;
  }
  if (isSlim(S.modal)) {
    const rows = [...document.querySelectorAll("#mBody .lr:not(.empty)")];
    if (!rows.length) return false;
    let i = rows.findIndex(r => r.classList.contains("kb"));
    if (k === "arrowup" || k === "arrowdown") {
      i = i < 0 ? 0 : (i + (k === "arrowup" ? -1 : 1) + rows.length) % rows.length;
      rows.forEach((r, j) => r.classList.toggle("kb", j === i));
      UI.kbRow = i;
      const r = rows[i];
      r.scrollIntoView({ block: "nearest" });
      if (r.dataset.hs) UI.modalHelp = r.dataset.hs;
      if (r.dataset.hv) { UI.hov = r.dataset.hv; const it = ITEMS[UI.hov]; if (it) UI.modalHelp = it.desc || it.name; renderMCard(); }
      sfx("tab");
      return true;
    }
    if (k === "enter" && i >= 0) { rows[i].click(); return true; }
    return false;
  }
  const btns = [...document.querySelectorAll(KB_SEL)].filter(b => b.offsetParent);
  if (!btns.length) return false;
  let i = btns.findIndex(b => b.classList.contains("kb"));
  const d = { arrowup: -1, arrowleft: -1, arrowdown: 1, arrowright: 1 }[k];
  if (d) {
    i = i < 0 ? 0 : (i + d + btns.length) % btns.length;
    btns.forEach((b, j) => b.classList.toggle("kb", j === i));
    UI.kbBtn = i;
    btns[i].scrollIntoView({ block: "nearest" });
    if (btns[i].title) UI.modalHelp = btns[i].title;
    if (btns[i].dataset.hv) { UI.hov = btns[i].dataset.hv; const it = ITEMS[UI.hov]; if (it) UI.modalHelp = it.desc || it.name; renderMCard(); }
    sfx("tab");
    return true;
  }
  if (k === "enter" && i >= 0) { btns[i].click(); return true; }
  return false;
}
