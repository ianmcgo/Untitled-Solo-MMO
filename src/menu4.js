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
  return [typeof netPartySig === "function" ? netPartySig() : "", typeof NET_LS !== "undefined" ? NET_LS.at + ":" + !!NET_LS.invite + ":" + NET_RT.online.map(o => o && o.name + o.zone + o.lv + o.lfg).join() + save.friends.join() + save.blocked.join() + save.lfg : "", save.buddy, save.buddyOut, save.buddies.length, JSON.stringify(save.buddyNames), JSON.stringify(save.market.listings.length), save.market.box.length, marketTick(), JSON.stringify(save.guild), save.mountCoat, save.saddle, JSON.stringify(save.augments), save.board.done.length, save.stance, JSON.stringify(save.mercGear), Object.keys(save.bestiary).length, Object.keys(save.ach).length, save.gil, save.inventory.map(s => s.id + s.qty).join(), Object.values(save.gear).join(), player.lv, save.mainJob, save.subJob, S.party.length, save.mountLicense, JSON.stringify(save.quests), S.zoneId, save.storage.length, save.furniture.length, JSON.stringify(save.gardens), JSON.stringify(save.crafts), !!player.synth].join("|");
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
  for (const t of ["shop", "job", "mercs", "storage", "home", "furnishings", "forge", "board", "guild", "auction", "pets", "stable", "admin"]) if (S.modal === t) tabs.unshift(t);
  if (S.modal === "trade" || (typeof NET_PT !== "undefined" && NET_PT.trade)) tabs.unshift("trade");
  for (const t of ["help", "updates", "system", "credits"]) if (S.modal === t) tabs.push(t);
  $("mNav").innerHTML = '<div class="ttl">LEID\'ANAV REBORN</div>' + tabs.map(t => '<button data-tab="' + t + '"' + (t === S.modal ? ' class="on"' : "") + "><span>" + TAB_INFO[t][1] + "</span>" + TAB_INFO[t][0] + (TAB_INFO[t][2] ? '<span class="k">' + TAB_INFO[t][2] + "</span>" : "") + "</button>").join("") + '<button class="x" data-tab="close">✕ Close</button>';
  $("mHead").innerHTML = "<h2>" + TAB_INFO[S.modal][0] + '</h2><span class="meta">💠 ' + save.gil + " crystals · " + save.inventory.length + "/" + CONFIG.inventorySize + ' bag</span><button class="close" data-tab="close">✕</button>';
  const R = { character: tabCharacter, inventory: tabInventory, skills: tabSkills, actions: tabActions, quests: tabQuests, map: tabMap, help: tabHelp, updates: tabUpdates, settings: tabSettings, system: tabSystem, shop: tabShop, job: tabJob, mercs: tabMercs, party: tabParty, forge: tabForge, board: tabBoard, admin: tabAdmin, guild: tabGuild, auction: tabAuction, pets: tabPets, trade: tabTrade, equipment: tabEquipment, magic: tabMagic, abilities: tabAbilities, keyitems: tabKeyItems, social: tabSocial, stable: tabStable, bestiary: tabBestiary, achievements: tabAchievements, storage: tabStorage, home: tabHome, furnishings: tabFurnishings, credits: tabCredits, craft: tabCraft }[S.modal];
  $("mBody").innerHTML = R ? R() : "";
  if (UI.kbBtn != null && !SLIM_TABS[S.modal] && S.modal !== "equipment") { const b = [...document.querySelectorAll("#mBody button[data-a]:not([disabled]), #mBody [data-a].mcR, #mBody a[data-a]")].filter(x => x.offsetParent)[UI.kbBtn]; if (b) b.classList.add("kb"); }
  if (UI.kbRow != null && SLIM_TABS[S.modal]) { const rows = document.querySelectorAll("#mBody .lr:not(.empty)"); if (rows[UI.kbRow]) rows[UI.kbRow].classList.add("kb"); }
  const win = document.querySelector("#menu .win");
  if (win) win.className = "win" + (SLIM_TABS[S.modal] ? " slim slim-" + S.modal : "") + (S.modal === "equipment" ? " wide" : "");
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
  if (!acts.length) return '<div class="lList"><div class="lr empty"><span class="nm">Your current jobs know no magic.</span></div></div>';
  let h = '<div class="lList">';
  for (const a of acts) { const sp = SPELLS[a.id], rc = recastLeft(player, "ma:" + a.id); h += orbRow("mcast", a.id, ELEMENT_COLORS[sp.element] || "#9fe8ff", sp.name, rc > 0 ? Math.ceil(rc) + "s" : sp.mp + " MP", sp.desc || sp.name, sp.mp > player.mp); }
  return h + "</div>";
}

function tabAbilities() {
  UI.modalHelp = UI.modalHelp || "Select an ability.";
  const acts = actionList(player).filter(a => a.kind === "ja" || a.kind === "ws");
  let h = '<div class="lList">';
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
    h += '<div class="iCl">[' + (SLOT_NAMES[it.slot] || it.slot) + "] All Races</div>";
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
  let h = '<div class="eqW"><div class="eqL">' + statusLeftHTML(true) + '<div class="stBox gilB"><em>Current Crystals</em><b>' + save.gil.toLocaleString() + '</b></div></div><div class="eqWrap"><div class="eqBox"><div class="eqGrid">';
  for (const sl of SLOTS) {
    const id = save.gear[sl];
    h += '<button class="eqS' + (q.slot === sl ? " sel" : "") + (id ? " on" : "") + '" data-a="eqslot" data-v="' + sl + '" title="' + (id ? esc(ITEMS[id].name) : SLOT_NAMES[sl]) + '">' + (id ? '<span class="ic">' + (ITEMS[id].icon || "📦") + "</span>" : '<span class="lbl">' + SLOT_NAMES[sl] + "</span>") + "</button>";
  }
  h += '</div><div class="eqStats"><span>Attack <b>' + st.att + "</b></span><span>Defense <b>" + st.def + '</b></span></div><div class="eqRes">';
  for (const el of RES_ELEMENTS) h += '<span title="' + el + ' resistance"><i style="background:' + ELEMENT_COLORS[el] + '"></i>' + (st["res_" + el] || 0) + "</span>";
  h += "</div></div>";
  h += '<div class="eqSide">';
  if (!q.slot) h += '<div class="iCard"><div class="iCl">Choose an equipment box to change what goes there.</div></div>';
  else {
    const cur = save.gear[q.slot];
    const fits = [...new Set(save.inventory.map(x => x.id))].filter(id => ITEMS[id].kind === "equip" && slotKeys(ITEMS[id].slot).includes(q.slot));
    h += '<div class="eqPop' + (q.list ? " kbl" : "") + '"><div class="eqPH">' + SLOT_NAMES[q.slot] + "</div>";
    if (cur) h += '<button class="mcR" data-a="equnq" data-v="' + q.slot + '"><span class="ic">✕</span><span class="nm">Remove ' + esc(ITEMS[cur].name) + "</span></button>";
    for (const id of fits) { const why = canEquip(id); h += '<button class="mcR' + (q.hover === id ? " hv" : "") + '" data-a="eqpick" data-v="' + id + '"><span class="ic">' + (ITEMS[id].icon || "📦") + '</span><span class="nm' + (why ? " dim" : "") + '">' + esc(ITEMS[id].name) + "</span>" + (why ? '<span class="q bad">' + esc(why.replace("Requires ", "")) + "</span>" : "") + "</button>"; }
    if (!fits.length && !cur) h += '<div class="mcR empty"><span class="nm dim">Nothing in your bag fits here.</span></div>';
    h += "</div>";
    if (q.hover && ITEMS[q.hover]) { h += itemCard(q.hover); if (cur) h += '<div class="eqArrow">▼</div>' + itemCard(cur); if (!canEquip(q.hover)) h += '<button class="pri" data-a="eqpick" data-v="' + q.hover + '" style="margin-top:6px">Equip</button>'; }
    else if (cur) h += itemCard(cur);
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
  const L = o ? lookFor(o.job, o.gear, lookBase(o.look)) : lookFor(player.job, save.gear, playerBase());
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
    const top = inst.meta.headTop || 1.8;
    pv.cam.position.set(0, top * 0.62, top * 2.15);
    pv.cam.lookAt(0, top * 0.5, 0);
  }
  if (!pv.spinPause || now - pv.spinPause > 2500) pv.rot += dt * 0.35;
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
  hare: ["Meadow Hares graze by day and never start a fight. Good first targets.", "Hares carry healing herbs, which Pell and Ysolde both want."],
  chieftain: ["The Goblin Chieftain rules the back of the Den. His Goblin Rush is three quick strikes; keep the healer back.", "His cap is a trophy few wear."],
  grimtooth: ["Grimtooth leads the goblin camp in eastern Rocky Hollow. He appears among his gang now and then.", "Notorious monsters stay down for minutes of real time after they fall."],
  duskwing: ["Duskwing haunts the Old Fort Ruins on dark nights. Faster and far harder to hit than any bat.", "Its boots make the wearer lighter on their feet."],
  king_wiggles: ["King Wiggles burrows beneath Burrow Flats by day. Twice the worm, twice the silk.", "Its gloves are prized by mages."],
  ossuary_warden: ["The Ossuary Warden keeps the Bone Pit of the Goblin Den. Its hood hides eyes that glow green.", "The Warden's Robe is the best mage body in the land."],
  crypt_sentinel: ["The Crypt Sentinel guards the key to the Hollow King's throne room.", "Its great axe sweeps the whole room: don't bunch up."],
  hollow_king: ["The Hollow King stirs the dead of Ashenreach from his throne under the Den.", "At two thirds and one third of his health he calls Royal Guards; below a fifth he enrages."],
  royal_guard: ["Royal Guards rise at the Hollow King's call and fall when he does."],
  rhea: ["Captain Rhea commands the Outpost's garrison and pays bounties on goblins and worse.", "Rhea turns in at 22:00 and is back on the plaza at dawn."],
  tobin: ["Tobin, Job Master, teaches support jobs at level 5 and the advanced jobs at level 6. Change jobs with Pip at your residence.", "Tobin is early to bed, early to rise: 20:00 to 7:00."],
  pell: ["Pell buys and sells potions, ethers, arms and armour. Crystals talk.", "Pell keeps late hours for a merchant: he shuts at 21:00."],
  brann: ["Brann runs the Mercenary Hall. Five new fighters arrive every day, and a companion who falls is gone for good.", "Brann drinks till 23:00 and is up by half past seven."],
  ysolde: ["Ysolde, Stablemaster, issues riding licenses for the Thornstrider at level 5.", "Ysolde beds down with the beasts at 19:30."],
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
  } catch (err) {}
  pv.r.render(pv.scene, pv.cam);
}

function startShowcase() {
  const wrap = $("ldPv");
  if (!wrap || typeof attachPreview !== "function" || !RIG.atlas) return;
  if (window.innerWidth <= 720 || W3.quality === "low" || (navigator.deviceMemory && navigator.deviceMemory < 4)) return;
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
  });
}
const SLIM_TABS = { inventory: 1, shop: 1, quests: 1, magic: 1, abilities: 1 };
function listRow(a, v, id, qty, name, right, sel, cls) {
  return '<button class="lr' + (sel ? " sel" : "") + (cls ? " " + cls : "") + '" data-a="' + a + '" data-v="' + v + '"' + (id ? ' data-hv="' + id + '"' : "") + '><span class="cur">➤</span>' + (qty != null ? '<span class="lq">' + (qty > 1 ? qty : "") + "</span>" : "") + '<span class="ic">' + (id && ITEMS[id] ? ITEMS[id].icon || "📦" : "•") + '</span><span class="nm">' + esc(name) + "</span>" + (right != null ? '<span class="rt">' + right + "</span>" : "") + "</button>";
}
function tabInventory() {
  UI.modalHelp = "Select an item.";
  let list = invSorted();
  if (UI.slotFilter) list = list.filter(({ s }) => ITEMS[s.id].kind === "equip" && slotKeys(ITEMS[s.id].slot).includes(UI.slotFilter));
  let h = '<div class="lHead"><button data-a="sort">Sort</button></div><div class="lList">';
  if (!list.length) h += '<div class="lr empty"><span class="nm">Your bag is empty.</span></div>';
  for (const { s, i } of list) h += listRow("isel", i, s.id, s.qty, ITEMS[s.id].name, null, UI.sel === i, rarityOf(s.id));
  return h + "</div>";
}
function invActions(i) {
  const s = save.inventory[i];
  if (!s) return;
  const it = ITEMS[s.id], o = [];
  if (it.kind === "use" || it.kind === "food") { o.push({ label: it.kind === "food" ? "Eat" : "Use", fn: () => { closeDialog(); useItem(s.id); renderModal(); } }); o.push({ label: "Add to action bar", fn: () => { closeDialog(); placeOnBar({ kind: "item", id: s.id }); } }); }
  if (it.kind === "equip") o.push({ label: "Equip", fn: () => { closeDialog(); const why = canEquip(s.id); if (why) { log(why + ".", "sys"); sfx("error"); } else { equip(s.id); UI.sel = null; } renderModal(); } });
  o.push({ label: "Drop", fn: () => { closeDialog(); onMenuClick({ target: { closest: () => ({ dataset: { a: "drop", v: String(i) } }) }, preventDefault() {} }); } });
  promptChoice(it.name, o);
}
function renderMCard() {
  const el = $("mCard");
  if (!el) return;
  let id = UI.hov, h = "";
  if (S.modal === "inventory") { const s = save.inventory[UI.sel]; id = id || (s && s.id); }
  if (S.modal === "shop") { h += '<div class="gilBox"><em>Current Crystals</em><b>' + save.gil.toLocaleString() + "</b></div>"; }
  if (S.modal === "quests" && UI.qSel && QUESTS[UI.qSel]) h += '<div class="qCard">' + questCardHTML(UI.qSel) + "</div>";
  else if ((S.modal === "inventory" || S.modal === "shop") && id && ITEMS[id]) h += '<div class="cardBox">' + itemCard(id) + (S.modal === "inventory" && augText(id) ? '<div class="sub" style="color:#ce93d8">✨ ' + esc(augText(id)) + "</div>" : "") + "</div>";
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
  let h = '<div class="sub">Tap an action, then tap a slot to place it. Tap two slots to swap them. Hold <b>Ctrl</b> and press 1–9 or 0 for the Ctrl line, or hold <b>Shift</b> for the Shift line. Plain 1–0 also use the Ctrl line, since some browsers keep Ctrl+number for switching tabs.</div>';
  hb.pages.forEach((pg, p) => {
    h += "<h3>" + (p ? "Shift" : "Ctrl") + " line</h3><div class=\"barEdit\">";
    pg.forEach((a, i) => { h += '<button class="slot' + (a ? " " + a.kind : " empty") + (UI.pick && UI.pick[0] === p && UI.pick[1] === i ? " pick" : "") + '" data-a="slotpick" data-v="' + p + "," + i + '"' + (a ? ' style="background:' + actTint(a) + '"' : "") + ' title="' + esc(actName(a)) + '"><span class="hk">' + ((i + 1) % 10) + '</span><span class="ic">' + actIcon(a) + "</span></button>"; });
    h += "</div>";
  });
  h += '<div class="opt"><button data-a="slotclear"' + (UI.pick ? "" : " disabled") + '>Clear selected slot</button><button data-a="barreset">Reset to defaults</button></div>';
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
  let h = '<div class="lList">';
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
  h += '<div class="sub" style="margin-top:4px">' + esc(S.zone.name) + " · " + pct + "% explored</div>";
  const lms = S.zone.landmarks || [];
  if (lms.length) {
    const found = lms.filter(l => save.landmarks[S.zoneId + ":" + l.id]);
    h += '<div class="sub" style="margin-top:4px">🧭 Landmarks ' + found.length + "/" + lms.length + (found.length ? ": " + found.map(l => esc(l.name)).join(" · ") : " · explore to find them for bonus XP") + "</div>";
  }
  h += "<h3>World</h3>" + worldMapSVG();
  return h;
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
  for (const e of z.exits || []) if (seen(e.x + e.w / 2, e.y + e.h / 2)) lbl("→ " + e.label, clamp(e.x + e.w / 2, 70 / s, z.w - 70 / s), e.y + e.h / 2, "#f1cf73");
  for (const n of S.npcs) {
    if (!seen(n.x, n.y)) continue;
    const cr = NPCS[n.id] && NPCS[n.id].crystal;
    g.beginPath(); g.arc(n.x, n.y, 6 / s, 0, 7); g.fillStyle = cr ? "#7ff3ff" : questMarker(n) ? "#ffd54f" : "#ead9ae"; g.fill();
    lbl((questMarker(n) ? "❗ " : "") + n.name.split(",")[0], n.x, n.y - 10 / s, cr ? "#7ff3ff" : "#ead9ae");
  }
  for (const p of S.party) if (p !== player) { g.beginPath(); g.arc(p.x, p.y, 5 / s, 0, 7); g.fillStyle = "#62b6ff"; g.fill(); }
  for (const l of z.landmarks || []) if (save.landmarks[S.zoneId + ":" + l.id]) lbl("🧭 " + l.name, l.x, l.y, "#e9dcb4");
  g.save(); g.translate(player.x, player.y); g.rotate(player.face || 0); g.scale(1 / s, 1 / s);
  g.beginPath(); g.moveTo(12, 0); g.lineTo(-8, -8); g.lineTo(-3, 0); g.lineTo(-8, 8); g.closePath(); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#000"; g.stroke();
  g.restore();
}
function worldMapSVG() {
  const nodes = { residence: [70, 50], outpost: [120, 110], hollow: [300, 110], den: [480, 110], crypt: [480, 200] };
  const known = save.discovered || [];
  const link = (a, b, dashed) => '<line x1="' + nodes[a][0] + '" y1="' + nodes[a][1] + '" x2="' + nodes[b][0] + '" y2="' + nodes[b][1] + '" stroke="' + (dashed ? "#555" : "#a8946a") + '" stroke-width="3" ' + (dashed ? 'stroke-dasharray="6 6"' : "") + "/>";
  let s = '<svg viewBox="0 0 560 250" style="width:100%;max-width:620px;display:block;background:radial-gradient(ellipse at 40% 40%,#2c3324,#11130e);border-radius:12px;border:1px solid var(--edge)">';
  s += link("residence", "outpost") + link("outpost", "hollow") + link("hollow", "den") + link("den", "crypt", true);
  const node = (id, name) => {
    const [x, y] = nodes[id];
    const here = S.zoneId === id, seen = known.includes(id) || here || id === "outpost";
    return '<g><circle cx="' + x + '" cy="' + y + '" r="' + (here ? 13 : 9) + '" fill="' + (here ? "#f1cf73" : seen ? "#6c7d4a" : "#333") + '" stroke="#000" stroke-width="2"/>' + (here ? '<circle cx="' + x + '" cy="' + y + '" r="19" fill="none" stroke="#f1cf73" stroke-opacity=".5" stroke-width="2"/>' : "") +
      '<text x="' + x + '" y="' + (y + 32) + '" text-anchor="middle" font-size="13" font-family="Georgia,serif" fill="' + (seen ? "#ecebe6" : "#777") + '">' + (seen ? name : "???") + "</text></g>";
  };
  s += node("residence", "Residence") + node("outpost", "Ashenreach Outpost") + node("hollow", "Rocky Hollow") + node("den", "Goblin Den") + node("crypt", "Sunken Crypt");
  s += "</svg>";
  return s;
}

function tabSettings() {
  let h = typeof audioSettingsHTML === "function" ? audioSettingsHTML() : "";
  if (typeof graphicsSettingsHTML === "function") h += graphicsSettingsHTML();
  const s = VIEW.settings;
  const btn = (a, v, label, on) => '<button data-a="' + a + '" data-v="' + v + '"' + (on ? ' class="on"' : "") + ">" + label + "</button>";
  h += "<h3>Interface</h3><div class=\"opt\">" + btn("toggle", "tracker", "Quest tracker " + (s.tracker !== false ? "on" : "off"), s.tracker !== false) + btn("toggle", "plates", "Name plates " + (s.plates !== false ? "on" : "off"), s.plates !== false) + btn("toggle", "compass", "Compass map " + (s.compass !== false ? "on" : "off"), s.compass !== false) + "</div>";
  h += '<h3>More</h3><div class="opt"><button data-a="open" data-v="help">❓ Help</button><button data-a="open" data-v="updates">📰 Updates</button><button data-a="open" data-v="system">💾 System</button><button data-a="open" data-v="credits">🎬 Credits</button>' + (typeof netIsAdmin === "function" && netIsAdmin() ? '<button data-a="open" data-v="admin">🛡️ Admin</button>' : "") + '</div><div class="sub">Help also opens with H. Saving, loading, changing character and checking for updates are under System.</div>';
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
  const kind = S.shopKind && SHOPS[S.shopKind] ? S.shopKind : "pell", mode = UI.shopMode === "sell" ? "sell" : "buy";
  UI.modalHelp = mode === "buy" ? "Buy merchandise." : "Sell merchandise.";
  let h = '<div class="lHead"><button data-a="shopmode" data-v="buy"' + (mode === "buy" ? ' class="on"' : "") + '>Buy</button><button data-a="shopmode" data-v="sell"' + (mode === "sell" ? ' class="on"' : "") + ">Sell</button></div><div class=\"lList\">";
  if (mode === "buy") for (const id of shopList(kind)) h += listRow("shopbuy", id, id, null, ITEMS[id].name, ITEMS[id].price.toLocaleString(), UI.hov === id, save.gil < ITEMS[id].price ? "dim" : "");
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
  return RECIPES.filter(r => CRAFTS[r.craft].crystal === cs.crystal && Object.keys(n).every(id => (r.mats[id] || 0) >= n[id])).map(r => ({ r, exact: Object.keys(r.mats).every(id => n[id] === r.mats[id]) && Object.keys(n).every(id => r.mats[id]) }));
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
  const m = csMatches();
  h += '<div class="csPane csRes"><div class="csHead">Craft this combination of</div><div class="csList">';
  if (!cs.crystal) h += '<div class="csHint">Choose a crystal and ingredients from your bag below.</div>';
  else if (!m.length) h += '<div class="csHint">Nothing you know uses these.</div>';
  for (const { r, exact } of m.slice(0, 14)) h += '<button class="csRow' + (exact ? " exact" : "") + '" data-a="csfill" data-v="' + r.id + '"><span>' + (ITEMS[r.out].icon || "") + " " + esc(ITEMS[r.out].name) + (r.qty > 1 ? " ×" + r.qty : "") + "</span>" + (exact ? '<span class="st">★</span>' : '<span class="lvl">' + esc(CRAFTS[r.craft].name) + " " + r.lv + "</span>") + "</button>";
  h += "</div></div></div>";
  const hv = cs.hover && ITEMS[cs.hover] ? cs.hover : null;
  h += '<div class="csDesc">' + (hv ? '<span class="ic">' + (ITEMS[hv].icon || "📦") + "</span><div><b>" + esc(ITEMS[hv].name) + "</b><div>" + esc(itemDesc(hv)) + "</div></div>" : '<div class="dim">Tap an item to see what it is.</div>') + "</div>";
  if (UI.craftMsg) h += '<div class="sub" style="color:#ffd070;margin:6px 0">' + esc(UI.craftMsg) + "</div>";
  const n = csCounts();
  const usable = [...new Set(save.inventory.map(x => x.id))].filter(id => craftCrystals().includes(id) || RECIPES.some(r => r.mats[id]));
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
  const list = RECIPES.filter(r => r.craft === c).sort((a, b) => a.lv - b.lv);
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
  if (!(S.zone && S.zone.residence)) {
    UI.modalHelp = "What Pip is keeping for you at your residence.";
    let h = '<div class="lList">';
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
    const locked = !jobUnlocked(jb);
    h += '<div class="item"' + (locked ? ' style="opacity:.6"' : "") + '><div>' + JOBS[jb].icon + " " + JOBS[jb].name + ' <span class="sub">' + (locked ? "Locked · " + (player.lv < ADVANCED_JOBS[jb].lv ? "reach level " + ADVANCED_JOBS[jb].lv : "Tobin's quest " + QUESTS[ADVANCED_JOBS[jb].quest].name) : "Lv." + save.jobs[jb].lv) + "</span></div>" + (jb === save.mainJob ? '<span class="d">Current</span>' : locked ? "" : '<button data-a="main" data-v="' + jb + '">Set main</button>') + "</div>";
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
  const pool = mercPool(), full = save.hired.length >= CONFIG.maxParty - 1;
  const d = new Date(), mid = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  UI.modalHelp = "Hire a companion. They fight at your level; if they fall, they're gone for good.";
  const row = (id, btn) => { const m = MERCS[id]; return '<div class="mRow"><span class="por" style="border-color:' + m.color + '">' + (JOBS[m.job] ? JOBS[m.job].icon : "⚔") + '</span><div class="mInfo"><b>' + esc(m.name) + '</b> <span class="sub">' + esc(JOBS[m.job].name) + " · Lv" + player.lv + " · " + esc({ dd: "Damage", tank: "Tank", healer: "Healer", support: "Support", nuker: "Nuker", burster: "Burster", hybrid: "Hybrid", bard: "Bard" }[m.role] || m.role) + '</span><div class="d">' + esc(m.desc || "") + "</div></div>" + btn + "</div>"; };
  let h = '<div class="sub" style="margin-bottom:6px">Brann has ' + pool.length + " fighters for hire today. New faces arrive in " + fmtDur(mid - d) + ". Party " + S.party.length + " / " + CONFIG.maxParty + " · 💠 " + save.gil.toLocaleString() + ". The fee covers the first day; after that each takes a daily wage.</div><h3>For hire today</h3>";
  const offers = pool.filter(id => !save.hired.includes(id));
  if (!offers.length) h += '<div class="sub">Everyone available today has already joined you. Come back tomorrow.</div>';
  for (const id of offers) h += row(id, '<button data-a="hire" data-v="' + id + '"' + (save.gil < MERCS[id].fee || full ? " disabled" : "") + ">Hire · " + MERCS[id].fee + " 💠</button>");
  h += "<h3>Your company</h3>";
  if (!save.hired.length) h += '<div class="sub">No one has joined you yet.</div>';
  for (const id of save.hired) if (MERCS[id]) h += row(id, '<button data-a="dismiss" data-v="' + id + '">Dismiss</button>');
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
  if (typeof NET_LS === "undefined" || !NET.member) return '<div class="sub">Social features need the game server.</div>';
  if (!NET_LS.at && !NET_LS.loading) netLsRefresh().then(() => { if (S.modal === "social") renderModal(); });
  let h = UI.socMsg ? '<div class="sub" style="color:#ffd54f;margin-bottom:6px">' + esc(UI.socMsg) + "</div>" : "";
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

function tabParty() {
  let h = partyPlayersHtml() + '<div class="sub" style="margin-bottom:8px">Stance: how your companions fight. Wages are paid automatically once a real day (tap a companion in the Party box to see the countdown or pay early). If you can\'t pay, they go back to the Mercenary Hall.</div>';
  h += '<div style="display:flex;gap:6px;margin-bottom:10px">' + [["assist", "⚔ Assist", "Fight your target"], ["follow", "🚶 Follow", "Stay close, don't attack"], ["hold", "✋ Hold", "Stand ground"]].map(([k, l, d]) => '<button data-a="stance" data-v="' + k + '" title="' + d + '"' + (save.stance === k ? ' class="pri"' : "") + ">" + l + "</button>").join("") + "</div>";
  if (!save.hired.length) return h + '<div class="item"><span class="sub">No companions yet. Brann at the Mercenary Hall in the Outpost hires them out.</span></div>';
  const bagEq = save.inventory.filter(x => ITEMS[x.id].kind === "equip");
  for (const id of save.hired) {
    const m = MERCS[id], a = S.party.find(p => p.mercId === id);
    const bl = bondLevel(id), st = COMPANION_CFG.bondSteps, b = save.bond[id] || 0;
    const next = bl < COMPANION_CFG.maxBond ? st[bl + 1] : null;
    const pct = next ? Math.round(100 * (b - st[bl]) / (next - st[bl])) : 100;
    const paid = save.mercPaid[id] ? save.mercPaid[id] - Date.now() : 0;
    h += '<div class="item" style="display:block">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b style="color:' + m.color + '">' + esc(m.name) + "</b> <span class=\"sub\">" + JOBS[m.job].name + " · " + m.role + (a ? " · HP " + a.hp + "/" + a.maxHp : "") + '</span></div><button data-a="dismiss" data-v="' + id + '">Dismiss</button></div>';
    h += '<div class="sub" style="margin:4px 0">💞 Bond ' + bl + "/" + COMPANION_CFG.maxBond + " (+" + Math.round(bl * COMPANION_CFG.bondBonus * 100) + '% stats)</div><div class="bar" style="height:6px;margin-bottom:6px"><i style="width:' + pct + '%;background:#f48fb1"></i></div>';
    h += '<div class="sub">💠 Wage ' + mercWage(id) + " crystals per day · next in " + fmtDur(paid) + "</div>";
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

function tabBestiary() {
  const keys = Object.keys(BESTIARY);
  const known = keys.filter(k => save.bestiary[k]);
  let h = '<div class="sub" style="margin-bottom:8px">' + known.length + " / " + keys.length + " creatures recorded. Meet a creature to add it; defeat it to learn more.</div>";
  for (const k of keys) {
    const b = save.bestiary[k];
    const f = FAMILIES[k] || (NM_FAMILIES[k] && Object.assign({}, FAMILIES[NM_FAMILIES[k].base], NM_FAMILIES[k], { nm: true }));
    if (!b || !f) continue;
    const info = BESTIARY[k];
    let body = '<div class="sub">' + info.type + (f.nm ? " · Notorious" : "") + " · Seen in " + esc(beastHabitat(k).join(", ") || "unknown parts") + " · Defeated " + b.kills + "</div>";
    body += '<div style="margin:5px 0;font-size:13px">' + esc(info.lore) + "</div>";
    if (b.kills >= 1) {
      const ag = f.aggro ? Object.keys(f.aggro).map(x => ({ sight: "hunts by sight", sound: "hears footsteps", magic: "senses magic", lowhp: "smells weakness" }[x])).join(", ") : "peaceful unless provoked";
      body += '<div class="sub">Behaviour: ' + ag + (f.link ? " · calls for help" : "") + (f.tpMove ? " · special: " + esc(f.tpMove.name) : "") + "</div>";
    } else body += '<div class="sub">Defeat one to learn its habits.</div>';
    const need = f.nm ? 1 : 5;
    if (b.kills >= need) {
      const weak = Object.keys(f.weak || {});
      const loot = (f.loot || []).map(([id]) => ITEMS[id] ? ITEMS[id].name : id);
      body += '<div class="sub">Weak to: ' + (weak.length ? weak.join(", ") : "nothing in particular") + "</div>";
      body += '<div class="sub">Known to carry: ' + esc(loot.join(", ")) + "</div>";
    } else if (b.kills >= 1) body += '<div class="sub">Defeat ' + (need - b.kills) + " more to learn its weaknesses and spoils.</div>";
    const pic = typeof beastThumb === "function" ? beastThumb(k, () => { if (S.modal === "bestiary") renderModal(); }) : null;
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

function tabBoard() {
  const list = boardToday();
  let h = '<div class="sub" style="margin-bottom:8px">Townsfolk pin up requests each day. Fill them for crystals and experience. New notes go up at midnight (UTC).</div>';
  if (UI.boardMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.boardMsg) + "</div>";
  for (const r of list) {
    const done = save.board.done.includes(r.id);
    const need = Object.keys(r.items).map(it => ITEMS[it].name + " " + Math.min(invCount(it), r.items[it]) + "/" + r.items[it]).join(", ");
    const ready = Object.keys(r.items).every(it => invCount(it) >= r.items[it]);
    h += '<div class="item"' + (done ? ' style="opacity:.5"' : "") + "><div><b>" + esc(r.who) + '</b><div class="sub">Wants: ' + esc(need) + " · Pays " + r.gil + " 💠 + " + r.xp + " XP</div></div>" + (done ? '<span class="sub">Filled ✓</span>' : '<button data-a="trade" data-v="' + r.id + '"' + (ready ? "" : " disabled") + ">Hand over</button>") + "</div>";
  }
  return h;
}

function tabPets() {
  const have = save.buddies, cur = save.buddy;
  let h = '<div class="sub" style="margin-bottom:8px">Pets follow you around for company. They never fight, can\'t be attacked and give no bonuses. Equip one, then summon it here, with the Pet button on your action bar, or with /pet.</div>';
  if (UI.petMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.petMsg) + "</div>";
  if (cur && BUDDIES[cur]) {
    const B = BUDDIES[cur];
    h += '<div class="item" style="border-color:#c9a227"><div style="display:flex;gap:10px;align-items:center"><span style="font-size:28px">' + B.icon + "</span><div><b>" + esc(buddyName(cur)) + '</b> <span class="sub">· ' + esc(B.name) + '</span><div class="sub">' + esc(B.lore) + "</div></div></div><div style=\"display:flex;gap:6px\"><button data-a=\"petname\" data-v=\"" + cur + '">Rename</button><button class="pri" data-a="petsummon">' + (S.buddy ? "Dismiss" : "Summon") + "</button></div></div>";
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

function ahDetail(id) {
  const it = ITEMS[id], hist = priceHistory(id, 12), cur = hist[hist.length - 1], base = it.price;
  let h = '<div class="item" style="display:block;border-color:#c9a227"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + esc(itemDesc(id)) + '</div></div><div style="text-align:right"><b>' + cur + ' 💠</b><div class="sub">usual ' + base + "</div></div></div>";
  h += '<div style="margin:8px 0 2px">' + sparkline(hist, 300, 46) + '</div><div class="sub">Price over the last three game days: low ' + Math.min(...hist) + ", high " + Math.max(...hist) + ".</div>";
  const q = UI.ahQty || 1;
  if (UI.ahView === "sell") {
    const unit = UI.ahPrice / q, chance = saleChance({ id, qty: q, price: UI.ahPrice });
    const speed = chance > 0.5 ? "sells fast" : chance > 0.2 ? "should sell soon" : chance > 0.06 ? "may take a while" : "unlikely to sell";
    h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px"><span class="sub">Qty</span><button data-a="ahqty" data-v="-1">−</button><b>' + q + '</b><button data-a="ahqty" data-v="1">+</button><span class="sub" style="margin-left:10px">Price</span><button data-a="ahprice" data-v="-0.1">−10%</button><b>' + UI.ahPrice + ' 💠</b><button data-a="ahprice" data-v="0.1">+10%</button></div>';
    h += '<div class="sub" style="margin-top:6px">' + Math.round(unit) + " each · fee " + ahFee(UI.ahPrice) + " 💠 (" + Math.round(AH_CFG.fee * 100) + "%, not refunded) · at this price it " + speed + '.</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap"><button data-a="ahlist">Sell to the market</button>' + (typeof netAhPost === "function" && NET.member ? '<button data-a="pmpost"' + (UI.pmBusy ? " disabled" : "") + '>🌐 Offer to players</button>' : "") + '</div><div class="sub" style="margin-top:4px">The market buys over a few hours at its own prices. Players can buy your lot for 48 hours at exactly your price (same 3% fee).</div>';
  } else {
    const st = ahStock(id);
    h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:8px"><span class="sub">' + st + ' on the market today</span>' + (st ? '<button data-a="ahqty" data-v="-1">−</button><b>' + q + '</b><button data-a="ahqty" data-v="1">+</button><button data-a="ahbuy"' + (save.gil < cur * q ? " disabled" : "") + ">Buy for " + cur * q + " 💠</button>" : "") + "</div>";
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

function pmLeft(t) { const m = Math.max(0, Math.round((Date.parse(t) - Date.now()) / 60000)); return m >= 60 ? Math.floor(m / 60) + "h " + (m % 60) + "m" : m + "m"; }

function pmView() {
  const P = pmLoad(false), cat = UI.pmCat || "all";
  let h = '<div class="sub" style="margin-bottom:8px">Lots put up by other adventurers. Prices are set by the sellers. What you buy goes straight to your bag (or your delivery box if it\'s full). <button data-a="pmrefresh" style="padding:0 8px">🔄 Refresh</button></div>';
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + [["all", "All"]].concat(Object.entries(AH_CATS)).map(([k, l]) => '<button data-a="pmcat" data-v="' + k + '"' + (cat === k ? ' style="border-color:#c9a227;color:#f1cf73"' : "") + ">" + l + "</button>").join("") + "</div>";
  if (P.err) return h + '<div class="item" style="display:block;border-color:#ff8a80"><div class="sub">' + esc(P.err) + "</div></div>";
  if (!P.at) return h + '<div class="sub">Loading the player market…</div>';
  const groups = new Map();
  for (const l of P.list || []) { if (cat !== "all" && ahCategory(l.item) !== cat) continue; if (!groups.has(l.item)) groups.set(l.item, []); groups.get(l.item).push(l); }
  const sel = UI.pmSel && groups.get(UI.pmSel);
  if (sel) {
    const it = ITEMS[UI.pmSel];
    P.hist = P.hist || {};
    if (!P.hist[UI.pmSel] && !P.histLoading) { P.histLoading = true; const id = UI.pmSel; netAhHistory(id).then(r => { P.hist[id] = r; }, () => { P.hist[id] = []; }).finally(() => { P.histLoading = false; if (S.modal === "auction") renderModal(); }); }
    const hist = P.hist[UI.pmSel];
    h += '<div class="item" style="display:block;border-color:#c9a227"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + esc(itemDesc(UI.pmSel)) + '</div></div><button data-a="pmsel" data-v="">✕</button></div>';
    h += '<div class="sub" style="margin:6px 0">Recent player sales: ' + (!hist ? "…" : hist.length ? hist.slice(0, 5).map(x => x.price + (x.qty > 1 ? " for " + x.qty : "")).join(", ") : "none yet") + " · market price " + marketPrice(UI.pmSel) + " each</div>";
    for (const l of sel.slice().sort((a, b) => a.price / a.qty - b.price / b.qty)) {
      const own = l.seller === S.charId, poor = save.gil < l.price;
      h += '<div class="item"><div><b>' + (l.qty > 1 ? l.qty + " × " : "") + l.price + ' 💠</b> <span class="sub">' + (l.qty > 1 ? "(" + Math.round(l.price / l.qty) + " each) " : "") + "· " + esc(l.seller_name) + " · " + pmLeft(l.expires_at) + " left</span></div>" + (own ? '<span class="sub">Yours</span>' : '<button data-a="pmbuy" data-v="' + l.id + '"' + (poor || UI.pmBusy ? " disabled" : "") + ">Buy</button>") + "</div>";
    }
    h += "</div>";
  }
  if (!groups.size) h += '<div class="sub">Nobody has anything up in this category right now. Be the first: choose Sell, pick an item and press Offer to players.</div>';
  for (const [id, ls] of [...groups].sort((a, b) => ITEMS[a[0]].name.localeCompare(ITEMS[b[0]].name))) {
    const it = ITEMS[id], best = Math.min(...ls.map(l => l.price / l.qty));
    h += '<div class="item ' + rarityOf(id) + '" data-a="pmsel" data-v="' + id + '" style="cursor:pointer' + (UI.pmSel === id ? ";border-color:#c9a227" : "") + '"><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + ls.length + " lot" + (ls.length > 1 ? "s" : "") + " from players</div></div><span>from " + Math.round(best) + " 💠 each</span></div>";
  }
  return h;
}

function pmAct(p, ok) {
  UI.pmBusy = true; UI.ahMsg = ""; renderModal();
  p.then(() => { UI.ahMsg = ok || ""; }, e => { UI.ahMsg = netAhErr(e); }).finally(() => { UI.pmBusy = false; pmLoad(true); renderModal(); });
}

function tabAuction() {
  const view = UI.ahView || "buy", cat = UI.ahCat || "materials", news = marketNews(marketDay());
  let h = '<div class="sub" style="margin-bottom:6px">📰 ' + esc(news.text[0]) + " " + esc(news.text[1]) + "</div>";
  h += '<div style="display:flex;gap:6px;margin-bottom:8px">' + [["buy", "Buy"]].concat(typeof netAhList === "function" && NET.member ? [["players", "🌐 Players"]] : []).concat([["sell", "Sell"], ["lots", "My lots (" + save.market.listings.length + ")" + (save.market.box.length ? " · 📦" : "")]]).map(([k, l]) => '<button data-a="ahview" data-v="' + k + '"' + (view === k ? ' class="on" style="border-color:#c9a227;color:#f1cf73"' : "") + ">" + l + "</button>").join("") + "</div>";
  if (UI.ahMsg) h += '<div class="sub" style="color:#ff8a80;margin-bottom:6px">' + esc(UI.ahMsg) + "</div>";
  if (UI.pmBusy) h += '<div class="sub" style="color:#ffd54f;margin-bottom:6px">Talking to the game server…</div>';
  if (view === "players") return h + pmView();
  if (view === "lots" && typeof netAhList === "function" && NET.member) {
    const P = pmLoad(false);
    h += "<h3>🌐 With other players</h3>";
    if (P.err) h += '<div class="sub">' + esc(P.err) + "</div>";
    else if (!P.at) h += '<div class="sub">Loading…</div>';
    else {
      if ((P.box || []).length) h += '<div class="item"><div><b>📦 Player delivery box</b><div class="sub">' + P.box.map(b => b.kind === "sold" ? "💠 " + b.gil + " (sold " + (ITEMS[b.item] ? ITEMS[b.item].name : "?") + " to " + esc(b.note || "") + ")" : (ITEMS[b.item] ? ITEMS[b.item].name : "?") + (b.qty > 1 ? " ×" + b.qty : "") + (b.kind === "returned" ? " (returned)" : "")).join(", ") + '</div></div><button data-a="pmcollect"' + (UI.pmBusy ? " disabled" : "") + ">Collect</button></div>";
      if (!(P.mine || []).length) h += '<div class="sub">You have nothing up for other players. Lots stay up for 48 hours; unsold items come back to the box.</div>';
      for (const l of P.mine || []) h += '<div class="item"><div><b>' + (ITEMS[l.item] ? (ITEMS[l.item].icon || "") + " " + esc(ITEMS[l.item].name) : "?") + (l.qty > 1 ? " ×" + l.qty : "") + '</b><div class="sub">Asking ' + l.price + " 💠 · " + pmLeft(l.expires_at) + ' left</div></div><button data-a="pmcancel" data-v="' + l.id + '"' + (UI.pmBusy ? " disabled" : "") + ">Withdraw</button></div>";
    }
    h += "<h3>🏛️ With the market</h3>";
  }
  if (view === "lots") {
    if (save.market.box.length) h += '<div class="item"><div><b>📦 Delivery box</b><div class="sub">' + save.market.box.map(b => ITEMS[b.id].name + (b.qty > 1 ? " ×" + b.qty : "")).join(", ") + '</div></div><button data-a="ahcollect">Collect</button></div>';
    if (!save.market.listings.length) h += '<div class="sub">You have nothing up for auction. Lots stay up for ' + AH_CFG.expireMs / 3600000 + " hours (real time) and keep selling while you're away.</div>";
    save.market.listings.forEach((l, i) => {
      const left = Math.max(0, Math.ceil((l.exp - Date.now()) / 60000));
      h += '<div class="item"><div><b>' + (ITEMS[l.id].icon || "") + " " + esc(ITEMS[l.id].name) + (l.qty > 1 ? " ×" + l.qty : "") + '</b><div class="sub">Asking ' + l.price + " 💠 · market " + marketPrice(l.id) * l.qty + " 💠 · " + (left >= 60 ? Math.floor(left / 60) + "h " : "") + (left % 60) + 'm left</div></div><button data-a="ahcancel" data-v="' + i + '">Withdraw</button></div>';
    });
    return h;
  }
  if (view === "buy") h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">' + Object.keys(AH_CATS).map(k => '<button data-a="ahcat" data-v="' + k + '"' + (cat === k ? ' style="border-color:#c9a227;color:#f1cf73"' : "") + ">" + AH_CATS[k] + (news.up === k ? " ▲" : news.down === k ? " ▼" : "") + "</button>").join("") + "</div>";
  if (UI.ahSel && ITEMS[UI.ahSel]) h += ahDetail(UI.ahSel);
  const ids = view === "buy" ? Object.keys(ITEMS).filter(id => ahTradable(id) && ahCategory(id) === cat && (ITEMS[id].kind !== "equip" || (ITEMS[id].lv || 1) <= player.lv + 5)).sort((a, b) => (ITEMS[a].lv || 0) - (ITEMS[b].lv || 0) || ITEMS[a].price - ITEMS[b].price) : [...new Set(save.inventory.map(s => s.id))].filter(ahTradable);
  if (!ids.length) h += '<div class="sub">' + (view === "sell" ? "Nothing in your bag can be sold at auction. Rare and Ex items, key items and furniture can't be listed." : "Nothing here right now.") + "</div>";
  for (const id of ids) {
    const it = ITEMS[id];
    h += '<div class="item ' + rarityOf(id) + '" data-a="ahsel" data-v="' + id + '" style="cursor:pointer' + (UI.ahSel === id ? ";border-color:#c9a227" : "") + '"><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + (it.lv ? "Lv." + it.lv + " · " : "") + (view === "sell" ? "you have " + invCount(id) : ahStock(id) + " on the market") + '</div></div><span>' + marketPrice(id) + " 💠 " + ahTrend(id) + "</span></div>";
  }
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
  return JSON.stringify({ game: "Leid'anav Reborn", build: typeof BUILD_INFO !== "undefined" ? BUILD_INFO : "", server: NET_CFG.url, admin: NET.user && NET.user.email, lastSave: NET.lastSave ? new Date(NET.lastSave).toISOString() : null, lastError: NET.lastErr || null, stats: UI.adminStats || null, error: UI.adminErr || null }, null, 1);
}

function tabAdmin() {
  if (typeof netIsAdmin !== "function" || !netIsAdmin()) return '<div class="sub">Admins only.</div>';
  if (!UI.adminStats && !UI.adminErr && !UI.adminLoading) { UI.adminLoading = true; netAdminStats().then(s => { UI.adminStats = s; UI.adminLoading = false; if (S.modal === "admin") renderModal(); }, e => { UI.adminErr = netErr(e); UI.adminLoading = false; if (S.modal === "admin") renderModal(); }); }
  const st = UI.adminStats;
  let h = '<div class="sub" style="margin-bottom:8px">Server: ' + esc(NET_CFG.url) + " · signed in as " + esc(NET.user.email) + " · " + esc(typeof BUILD_INFO !== "undefined" ? BUILD_INFO : "") + "</div>";
  if (UI.adminMsg) h += '<div class="sub" style="color:#ffd54f;margin-bottom:6px">' + esc(UI.adminMsg) + "</div>";
  if (UI.adminErr) h += '<div class="item" style="display:block;border-color:#ff8a80"><b>Couldn\'t read server stats</b><div class="sub">' + esc(UI.adminErr) + '. If the database hasn\'t been set up yet, copy the setup SQL below and run it in the Supabase SQL editor.</div></div>';
  else if (!st) h += '<div class="sub">Loading server stats…</div>';
  else {
    const tile = (k, v) => '<div class="item" style="display:block;text-align:center;min-width:110px"><div class="sub">' + k + '</div><b style="font-size:20px">' + esc(String(v)) + "</b></div>";
    const sv = +(st.schema || 1);
    if (sv < NET_SCHEMA) h += '<div class="item" style="display:block;border-color:#ffd54f"><b>Server update needed</b><div class="sub">This version of the game needs server setup version ' + NET_SCHEMA + ' (the server has ' + sv + '). Press Copy setup SQL below, paste it into the Supabase SQL editor and press Run. It is safe to run again; nothing is deleted.</div></div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">' + tile("Trades (7 days)", st.trades_7d != null ? st.trades_7d : "–") + tile("Server setup", "v" + sv) + tile("Accounts", st.players) + tile("Online now", st.online) + tile("Characters", st.characters) + tile("New (7 days)", st.signups_7d) + tile("Banned", st.banned) + tile("Database", st.db_size) + tile("Saves", st.chars_size) + tile("Sign-up password", st.code_set ? "set" : "NOT SET") + "</div>";
    h += "<h3>Online now</h3>" + (st.online_list && st.online_list.length ? st.online_list.map(o => '<div class="sub">' + esc(o.email) + " · " + fmtAgo(Date.parse(o.last_seen)) + "</div>").join("") : '<div class="sub">Nobody else right now.</div>');
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
    return '<div class="item"><div><b>' + (b.nm ? "★ " : "") + esc(bountyName(b)) + '</b><div class="sub">' + esc(b.where) + " · suggested level " + b.lv + "+" + (extra || "") + " · " + r.gp + " 🎖️ · " + r.gil + " 💠 · " + r.xp + " XP</div></div>" + btn + "</div>";
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
  h += '<div class="sub" style="margin:4px 0 8px">New bounties go up at midnight (UTC). Higher ranks unlock harder bounties and notorious monster hunts.</div>';
  h += "<h3>Guild rewards</h3>";
  for (const e of GUILD_SHOP) {
    const it = ITEMS[e.id], lock = rk < e.rank;
    h += '<div class="item ' + rarityOf(e.id) + '"' + (lock ? ' style="opacity:.5"' : "") + '><div><b>' + (it.icon || "") + " " + esc(it.name) + '</b><div class="sub">' + esc(itemDesc(e.id)) + "</div></div>" + (lock ? '<span class="sub">🔒 ' + GUILD_RANKS[e.rank][0] + "</span>" : '<button data-a="gbuy" data-v="' + e.id + '"' + (g.gp < e.gp ? " disabled" : "") + ">" + e.gp + " 🎖️</button>") + "</div>";
  }
  return h;
}

function tabAchievements() {
  const got = ACHIEVEMENTS.filter(a => save.ach[a.id]).length;
  let h = '<div class="sub" style="margin-bottom:8px">' + got + " / " + ACHIEVEMENTS.length + " unlocked.</div>";
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
  if (a === "toggle" && (v === "tracker" || v === "names" || v === "plates" || v === "compass")) { VIEW.settings[v] = VIEW.settings[v] === false; saveSettings(VIEW.settings); applyUiSettings(); renderModal(); sfx("click"); return; }
  if (typeof handleSettingAction === "function" && handleSettingAction(a, v)) { renderModal(); sfx("click"); return; }
  const hb = hotbar();
  if (a === "filter") { UI.filter = v; UI.sel = null; sfx("tab"); }
  else if (a === "sort") { save.inventory.sort((x, y) => (KIND_ORDER[ITEMS[x.id].kind] - KIND_ORDER[ITEMS[y.id].kind]) || ITEMS[x.id].name.localeCompare(ITEMS[y.id].name)); UI.sel = null; saveGame(); sfx("select"); }
  else if (a === "sel") { UI.sel = UI.sel === +v ? null : +v; sfx("select"); }
  else if (a === "isel") { UI.sel = +v; UI.hov = null; sfx("select"); renderModal(); invActions(+v); return; }
  else if (a === "qcat") { UI.qCat = v; UI.qSel = null; sfx("select"); }
  else if (a === "qback") { UI.qCat = null; UI.qSel = null; sfx("close"); }
  else if (a === "qsel") { UI.qSel = v; sfx("select"); }
  else if (a === "noop") { return; }
  else if (a === "shopmode") { UI.shopMode = v; UI.hov = null; sfx("tab"); }
  else if (a === "shopbuy") { const it = ITEMS[v]; UI.hov = v; renderMCard(); const o = [1, 3, 12].filter(n => n === 1 || it.stack !== false && it.kind !== "equip").map(n => ({ label: "Buy " + n + " (" + (it.price * n).toLocaleString() + " crystals)", fn: () => { closeDialog(); for (let k = 0; k < n; k++) { if (save.gil < it.price) break; buy(v); } renderModal(); } })); promptChoice(it.name, o); return; }
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
  else if (a === "petsummon") { UI.petMsg = toggleBuddy(); renderModal(); return; }
  else if (a === "petbuy") { const e = BUDDY_SHOP.find(x => x[0] === v); if (!e) return; if (save.gil < e[1]) { UI.petMsg = "You need " + e[1] + " crystals."; sfx("error"); } else { save.gil -= e[1]; learnBuddy(v); UI.petMsg = ""; } renderModal(); return; }
  else if (a === "petname") { const cur = save.buddyNames[v] || ""; const nm = prompt("Name your " + BUDDIES[v].name + " (2–12 letters, blank to reset):", cur); if (nm !== null) { UI.petMsg = nameBuddy(v, nm); renderModal(); } return; }
  else if (a === "ahview") { UI.ahView = v; UI.ahSel = null; UI.ahMsg = ""; renderModal(); return; }
  else if (a === "ahcat") { UI.ahCat = v; UI.ahSel = null; renderModal(); return; }
  else if (a === "ahsel") { UI.ahSel = v; UI.ahMsg = ""; const it = ITEMS[v]; UI.ahQty = UI.ahView === "sell" ? Math.min(invCount(v), it.stack || 1) : 1; UI.ahPrice = marketPrice(v) * UI.ahQty; renderModal(); return; }
  else if (a === "ahqty") { const it = ITEMS[UI.ahSel]; const max = UI.ahView === "sell" ? Math.min(invCount(UI.ahSel), it.stack || 1) : Math.min(ahStock(UI.ahSel), it.stack || 1); UI.ahQty = clamp((UI.ahQty || 1) + (+v), 1, Math.max(1, max)); UI.ahPrice = marketPrice(UI.ahSel) * UI.ahQty; renderModal(); return; }
  else if (a === "ahprice") { UI.ahPrice = Math.max(1, Math.round(UI.ahPrice * (1 + (+v)))); renderModal(); return; }
  else if (a === "ahbuy") { UI.ahMsg = ahBuy(UI.ahSel, UI.ahQty || 1); UI.ahQty = 1; renderModal(); return; }
  else if (a === "ahlist") { UI.ahMsg = ahList(UI.ahSel, UI.ahQty || 1, UI.ahPrice); if (!UI.ahMsg) UI.ahSel = null; renderModal(); return; }
  else if (a === "ahcancel") { ahCancel(+v); renderModal(); return; }
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
  else if (a === "pmcat") { UI.pmCat = v; UI.pmSel = null; renderModal(); return; }
  else if (a === "pmsel") { UI.pmSel = v || null; renderModal(); return; }
  else if (a === "pmbuy") { pmAct(netAhBuy(+v)); return; }
  else if (a === "pmcancel") { pmAct(netAhCancel(+v)); return; }
  else if (a === "pmcollect") { pmAct(netAhCollect()); return; }
  else if (a === "pmpost") { const id = UI.ahSel, q = UI.ahQty || 1, pr = UI.ahPrice; pmAct(netAhPost(id, q, pr).then(() => { UI.ahSel = null; }), "Your lot is up for other players."); return; }
  else if (a === "ahcollect") { UI.ahMsg = ahCollect(); renderModal(); return; }
  else if (a === "btake") { UI.guildMsg = takeBounty(v); renderModal(); return; }
  else if (a === "bdrop") { dropBounty(v); UI.guildMsg = ""; renderModal(); return; }
  else if (a === "bturn") { UI.guildMsg = turnInBounty(v); renderModal(); return; }
  else if (a === "gbuy") { UI.guildMsg = guildBuy(v); renderModal(); return; }
  else if (a === "trade") { UI.boardMsg = fillTrade(v); renderModal(); return; }
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
  else if ((a === "store" || a === "retrieve") && !(S.zone && S.zone.residence)) { log("You can only move items in or out of storage at your residence.", "sys"); sfx("error"); return; }
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
  else if (a === "checkupd") { checkForUpdate(true); return; }
  else if (a === "loadfile") { return; }
  else if (a === "syncnow") { saveGame(); netFlush().then(() => renderModal()); return; }
  else if (a === "signout") { closeModal(); saveGame(); netFlush().then(() => netSignOut()).then(() => location.reload()); return; }
  else if (a === "adminrefresh") { UI.adminStats = null; UI.adminErr = ""; renderModal(); return; }
  else if (a === "admincopy") { copyText(v === "setup" ? SETUP_SQL : v === "diag" ? ADMIN_DIAG_SQL : adminReport()); UI.adminMsg = "Copied to the clipboard."; renderModal(); return; }
  else if (a === "adminban") { const tg = (($("adBan") || {}).value || "").trim(); if (!tg) return; netAdminBan(tg, v === "1").then(n => { UI.adminMsg = n ? (v === "1" ? "Banned " : "Unbanned ") + tg + "." : "No account matched " + tg + "."; UI.adminStats = null; renderModal(); }, e => { UI.adminMsg = netErr(e); renderModal(); }); return; }
  else if (a === "admincode") { const c = ($("adCode") || {}).value || ""; netAdminSetCode(c).then(() => { UI.adminMsg = "Sign-up password changed."; renderModal(); }, e => { UI.adminMsg = netErr(e); renderModal(); }); return; }
  else if (a === "logout") { closeModal(); logoutToSelect(); return; }
  renderModal();
}
function placeOnBar(a) {
  const hb = hotbar();
  if (hb.pages.flat().some(x => x && x.kind === a.kind && x.id === a.id)) { toast(actIcon(a), "Already on your bar", actName(a)); return; }
  for (let p = 0; p < 2; p++) for (let i = 0; i < 10; i++) if (!hb.pages[p][i]) { hb.pages[p][i] = a; saveGame(); buildActionBar(); toast(actIcon(a), "Added to page " + (p + 1), actName(a)); sfx("equip"); return; }
  toast("⚠", "Action bar full", "Clear a slot in the Action Bar menu.");
  sfx("error");
}
function applyUiSettings() {
  const s = VIEW.settings;
  document.body.classList.toggle("noNames", s.names === false);
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
  { v: "6.5.0", date: "2026-10-13", title: "Pets", items: [
    "Ten pets that follow you around: Meadow Kit, Snow Kit, Shade Kit, Batling, Wormlet, Pocket Goblin, and the Ember, Frost, Tide and Ash wisps. They don't fight and can't be attacked.",
    "Each pet gives one small perk while it's out, such as extra experience, faster resting, better gathering or fishing, higher sell prices or a bigger drop chance.",
    "New Pets window: equip a pet, give it a name, and summon or dismiss it. The Pet button joins your action bar once you own one, and /pet toggles it. Your pet is remembered between sessions.",
    "Ysolde sells three pets. Others come from notorious monsters (Duskwing, Mirelord Gax, Rimefang, the Ashen Herald), fishing in Saltreach, the Adventurers' Guild shop, and finishing the main story. New achievement: Pet Keeper."
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
    "Hotkeys have two lines: hold Ctrl and press 1–9 or 0 for the Ctrl line, or Shift for the Shift line. Plain 1–0 also use the Ctrl line, because many browsers keep Ctrl+number for switching tabs.",
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
    "New gear for the new slots: gorgets and pendants, earrings, capes and mantles, belts and sashes, a buckler, a sling and ammo (Pell and Vela). Capes, belts and shields show on your character.",
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
    "Offer to players: put an item up for other players for 48 hours (3% fee, up to 10 lots).",
    "Sales, purchases and returns go through the game server and a player delivery box, so nothing can be duplicated.",
    "You're told when another player buys your lot, even if you're out in the field.",
    "My lots shows your player lots and market lots separately. The simulated market is unchanged."
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
    "Party up with other players: invite up to 6 with /invite, the Party tab, or by tapping a player. Accept with the popup or /join.",
    "Party members show in your party frame with HP, MP and TP, and in the Party tab with their area.",
    "Shared experience: kills share XP with party members nearby, based on the highest level member. Bigger parties earn more in total.",
    "Shared loot: gear drops go into a treasure pool everyone nearby can lot on, and crystals are split.",
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
    "Five playable races at character creation: Human (balanced), Elari (tall, long-eared; strong magic and bow accuracy, less HP), Pipkin (small and doll-like; the best casters, fast, but weak and frail), Ursan (huge; the most HP and strength, poor magic, a little slow; male only) and Nekari (cat-eared and tailed; fast and nimble with good magic, slightly less HP; female only).",
    "Race changes your body shape, ears and tail, and gives modest stat bonuses and penalties. Existing characters are Human.",
    "City Blessing: gate guards now stand at every town exit. Monsters only yield elemental essences while you carry the blessing, which lasts 60 minutes at Copper rank and 30 minutes more per guild rank (up to 3½ hours). Talk to a guard before you head out.",
    "The character sheet and roster now show your race."
  ] },
  { v: "6.3.0", date: "2026-10-13", title: "The Auction House", items: [
    "Auction houses open in Ashenreach Outpost (Corvin, west of the crystal) and Saltreach Harbor (Selene, by the crystal).",
    "Prices move all the time. Each item drifts up and down over the game day, daily market news pushes one category up and another down, and your own buying and selling nudges prices too.",
    "Buy: browse Materials, Consumables, Weapons and Armor. Each item has a limited stock that refreshes every game day, a price chart for the last three game days and a trend arrow.",
    "Sell: put up to " + 7 + " lots up for auction at your own price (3% listing fee). Cheaper lots sell faster. Lots keep selling while you're away; unsold lots come back to your delivery box after 3 hours.",
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
    "Spend guild points on guild rewards: Hi-Potions, Ethers, Chapel Sigils, and five pieces of guild gear (Guild Ring, Pathfinder Boots, Silver Insignia, Guild Greatcoat, Mythril Crest).",
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
    "Chapel Sigils drop from the Drowned and are sold by Vela.",
    "Screen changes: your XP bar now sits under your health in your party frame; on phones the chat log sits in the bottom-left corner and the action bar stacks three wide on the right.",
    "Area exits are at the end of walled halls; you arrive at the inner end of the hall.",
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
    "Party tab (P): set your companions' stance (Assist, Follow, Hold), give them gear from your bag and see bond and wages. /stance works too.",
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
    "New characters start with only their own job's gear and three potions. Changing jobs never hands out equipment; buy or earn it."
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
    "Character creation: choose a name, job and appearance before you start. Appearance is permanent. Keep up to 8 characters and pick one on the character select screen each time you play, like an MMO. System → Change character logs out to that screen.",
    "Chat commands: type in the box under the chat log (or press /). /rest sits you down to recover HP and MP quickly; standing still now only recovers a little. /help lists everything, including /target, /check, /cast, /ws, /item and emotes.",
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
  for (const u of updatesSorted()) h += '<div class="upd"><h4>v' + u.v + " · " + esc(u.title) + (u.date ? "<small>" + u.date + "</small>" : "") + "</h4><ul>" + u.items.map(i => "<li>" + esc(i) + "</li>").join("") + "</ul></div>";
  return h;
}

function tabHelp() {
  const sec = (title, body, open) => "<details" + (open ? " open" : "") + "><summary>" + title + "</summary>" + body + "</details>";
  const ul = arr => "<ul>" + arr.map(x => "<li>" + x + "</li>").join("") + "</ul>";
  const tbl = (head, rows) => "<table><tr>" + head.map(x => "<th>" + x + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map(x => "<td>" + x + "</td>").join("") + "</tr>").join("") + "</table>";
  let h = '<div class="help">';
  h += sec("🌅 Getting started", ul([
    "You start alone in Ashenreach Outpost with 100 crystals. Talk to <b>Captain Rhea</b> for work, <b>Brann</b> to hire companions, <b>Pip</b> (in your residence) to change jobs, <b>Pell</b> to buy and sell, and <b>Ysolde</b> for the mount.",
    "Leave by the east gate into Rocky Hollow. Hares, worms and small goblins a short walk from the gate are good first targets (monsters keep away from entrances and exits).",
    "Your first hire is a big boost: Brann's Mercenary Hall has five new fighters every day, at your level. A healer and a tank make a strong start. A full party is you plus five. Fallen companions are gone for good.",
    "Standing still out of combat recovers HP and MP slowly. To heal properly, type <b>/rest</b> (or tap yourself and choose Heal) to sit down. Resting is about six times faster. Moving, attacking or getting hit stands you up."
  ]), true);
  h += sec("📴 Offline play", ul([
    "Choose <b>Play Offline</b> after Press Start to play without an account. Offline characters live only on this device, in their own list (up to " + MAX_CHARS + ").",
    "Everything that doesn't need other players works offline: quests, story, companions, crafting, gathering, fishing, the NPC market and guild bounties.",
    "Offline characters can never be moved online, uploaded or loaded into an online character. Use System → Save to file to back one up on the same or another device's offline list."
  ]));
  h += sec("👥 Characters", ul([
    "The game opens on the title screen; press Start (or tap) to see your characters. There you pick a character or create a new one: name (2–12 letters), job, sex, skin, hair, height and build. <b>Randomize all</b> rolls a whole new look. <b>Appearance is permanent</b>, so take your time.",
    "Logging in puts you back where you were: your location saves every 15 seconds and when the tab closes.",
    "You can keep up to " + MAX_CHARS + " characters. Each has its own levels, gear, crystals, quests and companions. System → Change character goes back to the select screen.",
    "Deleting a character on the select screen is permanent."
  ]));
  h += sec("💬 Chat commands", "<p>Type in the box under the chat log, or press <b>/</b> to start a command. Plain text is said out loud.</p>" + tbl(["Command", "What it does"], COMMANDS.map(([c, d]) => [esc(c), esc(d)])));
  h += sec("🎮 Controls", ul([
    "<b>Phone:</b> left thumb moves · drag elsewhere to look · pinch to zoom · tap a monster to target it and open its command menu on the left above the log (Attack/Disengage, Switch Target, Magic, Abilities, Items, Check); tap a person to talk; tap yourself for your own Magic, Abilities, Items and Heal.",
    "<b>Keyboard:</b> Tab or clicking a monster targets it and opens its command menu; ↑ ↓ choose, Enter or → confirm, ← back, Esc close · Enter with a monster targeted opens the menu, with a person targeted talks, with nothing targeted starts typing in the log · WASD move · arrows or Q/E turn · V first person · <b>Tab</b> targets the nearest enemy (or the nearest person in town); press again within 2 s to cycle · F attack · Enter or E talk · Shift+Space jump · Space or Enter (nothing targeted) type in the log · R mount.",
    "Hotkeys: Ctrl+1–0 use the Ctrl line and Shift+1–0 the Shift line (plain 1–0 also use the Ctrl line); set them in Hotkeys · Esc closes the command menu; with nothing open it opens the main menu (- or Insert too) · C character · I inventory · K skills · B hotkeys · P party · J quests · Y bestiary · O achievements · M map · H help."
  ]));
  h += sec("⚔️ Combat", ul([
    "<b>Targeting:</b> when you target a monster a command box opens under the target frame: Attack, Magic (spells you can cast on it), Abilities (job abilities and weapon skills) and Inspect. Names over monsters and townsfolk only appear when targeted. Esc or ✕ closes the box.",
    "<b>Inspect</b> (or /check) tells you how tough a monster looks and whether it is hostile. Monster levels are never shown, so learn by inspecting.",
    "Auto-attack swings on your weapon's delay. Each hit builds <b>TP</b>; at 1000 TP you can use a weapon skill (more TP makes it stronger).",
    "<b>Skillchains:</b> a weapon skill opens a chain; a matching weapon skill within about 6 s closes it for bonus damage. The target frame shows the open chain and its element.",
    "<b>Magic bursts:</b> cast a spell of the skillchain's element while the burst window is open for +35–50% damage.",
    "<b>Enmity:</b> monsters attack whoever has the most hate. Cures and big hits draw hate; Provoke steals it.",
    "<b>Inspect readings</b>, weakest to strongest: " + [["Too Weak", "#9e9e9e"], ["Easy Prey", "#64b5f6"], ["Decent Challenge", "#81c784"], ["Even Match", "#fff"], ["Tough", "#ffd54f"], ["Very Tough", "#ff8a65"], ["Incredibly Tough", "#e53935"]].map(([n, c]) => '<span style="color:' + c + '">' + n + "</span>").join(" · ") + ". Too Weak gives no XP. Name plates no longer give this away; only Inspect does.",
    "<b>Debuffs:</b> Slow makes a monster swing 25% slower, Paralyze makes it lose some swings, Flash cuts its accuracy by 40%. They show on the target frame with the time left. Shield Bash interrupts a readied TP move.",
    "<b>Where danger lives:</b> monsters are placed by difficulty. Peaceful critters crowd the areas near towns; aggressive beastmen, undead and big monsters live deeper in. The same kind of monster changes name and colour as it gets stronger further out (Grass → Bog → Rime Crawler, Honey Bee → Marsh Hornet → Frost Wasp, and so on).",
    "<b>Critters:</b> bees, crawlers, sheep, mandrakes, lizards, crabs, shroomlings, snappers, hares, bats, leeches and longnecks never start a fight. Some watch out for each other (bees, sheep, mandrakes): hit one and its neighbours join in. Watch their special moves: Sticky Thread slows, Dream Dust can put companions to sleep, Spore Cloud and Tail Whip hit everyone nearby.",
    "<b>Ranged and dangerous:</b> Orc Stonechuckers and Needlekin attack from a distance, so close in or pull them around a corner. Ember Bombs swell up and Self-Destruct, a big area blast that also destroys the bomb; kill them fast or step away when they ready it. Elder Treants shake the ground around them.",
    "<b>Aggro:</b> some monsters attack on sight, some when they hear you moving nearby, undead smell weakness when your HP is low, and critters like hares are peaceful until attacked (Inspect says <i>peaceful unless provoked</i>). Learn each kind by watching it; nothing on screen gives their range away."
  ]));
  h += sec("🐾 Pets", ul([
    "Pets are small companions that follow you around for company. They never fight, can't be attacked and give no bonuses: " + Object.keys(BUDDIES).map(id => BUDDIES[id].icon + " " + BUDDIES[id].name).join(", ") + ".",
    "Open the <b>Pets</b> window (the main menu) to equip one, rename it, and summon or dismiss it. <b>/pet</b> toggles your equipped pet. A summoned pet comes back when you log in.",
    "Pets are <b>very rare</b>. Hares, bats, worms and ice bats drop their kits about once in 250 kills; Duskwing, Mirelord Gax, Rimefang and the Ashen Herald drop theirs a few percent of the time; the Tide Wisp is a one-in-a-few-hundred catch in Saltreach; the Ash Sprite joins you when you finish the main story. Pet items are used from your bag.",
    "Pets stay out of battlefields and vanish when you're knocked out; summon them again afterwards. Achievement: Pet Keeper (five pets)."
  ]));
  h += sec("🧬 Races", tbl(["Race", "Sex", "Traits"], RACE_ORDER.map(r => [RACES[r].icon + " " + RACES[r].name, RACES[r].sex == null ? "Either" : RACES[r].sex ? "Female only" : "Male only", RACES[r].blurb])) + ul([
    "Pick a race at character creation. It's permanent, like the rest of your appearance. Race shapes your body and gives small stat bonuses and penalties that grow a little with level; your job still matters far more.",
    "Elari get extra accuracy with bows. Pipkin and Nekari move faster; Ursan a little slower. HP and MP are multiplied: Ursan +25% HP but −25% MP, Pipkin −20% HP but +30% MP."
  ]));
  h += sec("🏰 The City Blessing", ul([
    "Gate guards stand at every town exit: Aldo at the Outpost's east gate, Senna and Tomas at Saltreach's two gates. Talk to one before you leave and they'll bless you.",
    "<b>Elemental essences only drop while you're blessed</b>, and only from monsters that still give you experience. Everything else (materials, consumables, notorious monster gear) drops as usual.",
    "The blessing lasts " + BLESSING.baseMin + " minutes at Copper guild rank, " + BLESSING.perRankMin + " minutes more per Adventurers' Guild rank, up to " + BLESSING.maxMin + " minutes at Mythril. It counts down in real time, even while you're logged out. The 🏰 icon on your party frame shows it's active, and a guard with a ❗ means you've no blessing.",
    "You can renew it any time; renewing restarts the timer."
  ]));
  h += sec("🛡️ Jobs and companions", tbl(["Job", "Role", "Highlights"], [
    ["Warrior", "Tank or damage", "Provoke, Berserk, Warcry (level 15: +20% attack for nearby allies), great axe A, sword B"],
    ["White Mage", "Healer", "Cure through Cure IV (level 19), Dia, Banish, Protect, Divine Seal"],
    ["Black Mage", "Nuker", "Stone → Thunder, tier II nukes (Thunder II at 17), Fire III (level 20), Elemental Seal, magic bursts"],
    ["Paladin (advanced)", "Tank", "Sword A, Cure, Flash, Protect, Sentinel, Shield Bash, shields"],
    ["Red Mage (advanced)", "Hybrid", "Sword B, Dia, Cure, nukes, Slow, Paralyze, Convert"],
    ["Thief (advanced)", "Damage", "Dagger A, Steal, Sneak Attack (sure critical), Flee; +5% critical hits; Treasure Hunter (+20% drop chance)"],
    ["Ranger (advanced)", "Ranged damage", "Archery A: shoots from 230 range, Sharpshot (+40 accuracy), Barrage (next shot fires 3 arrows), Shadowbind (pin a monster for 12 s)"],
    ["Summoner (advanced)", "Pet mage", "Summoning A: Ember, Frost, Gale and (level 15) Stone Sprites fight beside you and drain MP every 3 s; Blood Pact (sprite's elemental attack), Elemental Siphon (MP back), Release"],
    ["Dark Knight (advanced)", "Damage", "Scythe A (new weapon type), great axe and sword B. Last Resort (+25% attack, −15% defense), Soulfire (10: hits burn your own HP for extra damage), Blood Blade (15: hits drain HP). Dark Magic A: Blight (damage over time, lowers attack), Drain (5), Mind Drain (12: steals MP), Stun (17: stops a readied move)"],
    ["Bard (advanced)", "Support", "Songs reach every ally within range and last 2 minutes; each person holds two songs and a third replaces the oldest. Battle Minuet (attack), Mending Paeon (HP over time), Wellspring Ballad (MP over time), Keen Madrigal (accuracy), Swift March (attack speed), Drowsy Lullaby (5: puts a monster to sleep until it's hit; bosses are immune), tier II Paeon (13) and Minuet (17), Encore (15: songs sing three times faster). Dagger B"],
    ["Monk (advanced)", "Damage", "Hand-to-Hand A, Martial Arts (faster, stronger fists), kick attacks, Boost, Focus, Chakra"]
  ]) + ul([
    "<b>Advanced jobs</b> unlock at level 6 through Tobin (then change to them with Pip at your residence): <i>The Oath of Steel</i> (Paladin: 2 Bone Chips, 1 Iron Ore) and <i>Scarlet Lessons</i> (Red Mage: 2 Worm Silk, 1 Fire Essence, 1 Water Essence), <i>Light Fingers</i> (Thief: 3 Goblin Pouches, 1 Bat Wing), <i>The Open Hand</i> (Monk: 2 Bone Chips, 3 Healing Herbs), <i>Steady Aim</i> (Ranger: 3 Bat Wings, 2 Ash Lumber) and <i>The Calling</i> (Summoner: 2 Fire Essences, 2 Wind Essences, 2 Healing Herbs). At level 10 Tobin also teaches <i>The Shadowed Path</i> (Dark Knight: 2 Crypt Dust, 3 Bone Chips) and <i>A Traveler's Song</i> (Bard: 3 Mire Reeds, 2 Bat Wings). Each job keeps its own level.",
    "Support jobs unlock at level 5 through Tobin's quest <i>A Second Calling</i> and run at half your level.",
    "Companions cost a hiring fee (it covers the first day) and then a daily wage, paid automatically once per real day (24 hours). If you can't pay, they go back to the Mercenary Hall. They match your level and talk in party chat. Knocked-out companions get back up after 6 calm seconds. If one is left far behind, they catch up. When you /rest, they sit with you."
  ]));
  h += sec("📈 Experience", ul([
    "XP needed per level: " + CONFIG.xpTable.slice(1).map((x, i) => "Lv" + (i + 1) + "→" + (i + 2) + " " + x).join(" · ") + ". Level cap " + CONFIG.levelCap + ".",
    "Kill XP scales with the monster's con. Tougher monsters give much more.",
    "<b>EXP chains:</b> defeat another monster within " + CONFIG.chainWindow + " s of your last XP kill for +" + Math.round(CONFIG.chainStep * 100) + "% per chain, up to +" + Math.round(CONFIG.chainMax * CONFIG.chainStep * 100) + "%. The ⛓ counter by the XP bar shows the bonus and time left.",
    "<b>Discovery:</b> landmarks are logged the first time you reach them (🧭 in the event log); they give no experience. The Map shows how many you've found in each zone.",
    "Quests give big XP rewards.",
    "Defeat costs 10% of your current level's XP requirement, but you never lose a level."
  ]));
  const nmRows = Object.keys(NM_FAMILIES).map(k => { const n = NM_FAMILIES[k], u = ITEMS[n.loot[0][0]]; return ["☠ " + n.name, n.hint || "", (FAMILIES[n.base] || {}).name || "", u ? u.name : ""]; });
  h += sec("☠ Notorious monsters", "<p>Rare, stronger versions of normal monsters with a coloured aura. They sometimes appear in place of a regular monster (its placeholder) when it respawns. After one is defeated it can't appear again for about 5 minutes of real time, even while you're offline. Each has a unique drop with about a 30% chance.</p>" + tbl(["Name", "Where and when", "Pops from", "Unique drop"], nmRows) + "<p>The Goblin Chieftain at the back of the Goblin Den is a fixed boss that returns every 3 minutes.</p>");
  h += sec("💎 Loot and rarity", tbl(["Rarity", "Typical items", "Drop rate"], [
    ['<span style="color:' + RARITY.common[1] + '">Common</span>', "Materials, crystals, potions", "15–40%"],
    ['<span style="color:' + RARITY.uncommon[1] + '">Uncommon</span>', "Ether, Hi-Potion, high-quality items", "5–10%"],
    ['<span style="color:' + RARITY.rare[1] + '">Rare</span>', "Notorious monster uniques and gear", "30–35%"],
    ['<span style="color:' + RARITY.epic[1] + '">Epic</span>', "Boss trophies", "about 30%"]
  ]) + ul(["<b>Only notorious monsters drop equipment.</b> Regular monsters drop materials, consumables and (only while you carry the <b>City Blessing</b>) elemental essences; gear comes from NMs, quests and Pell's shop.", "<b>Rare</b> items can only be held once. If one drops while you already have it, it's lost.", "<b>Ex</b> items (quest rewards, boss trophies) can't be sold."]));
  h += sec("🗺️ World", tbl(["Area", "Levels", "Highlights"], [
    ["Ashenreach Outpost", "Safe", "Shops, jobs, companions, stables, Adventurers' Guild, auction house, home point"],
    ["Rocky Hollow", "1–6", "Peaceful bees, crawlers, sheep and mandrakes near the gate; lizards, crabs, snappers and saplings further in; goblins, worms, undead (night), orcs and bombs (night) deep in. Old Fort Ruins, Goblin Camp, Burrow Flats, 4 NMs"],
    ["Goblin Den", "5–11", "Four chambers: Den Mouth, Underground Pool, Bone Pit (exit to the Crypt), Chieftain's Throne"],
    ["Sunken Crypt", "9–12", "Brazier puzzle, the Crypt Sentinel and its key, the vault, the Hollow King"],
    ["Saltreach Harbor", "Safe", "South of the Ashen Marsh. Harbor master Ilsa (quests), Marn (fishing, food), Vela (level 13–17 gear), Selene (auction house), home point, trade board, docks"],
    ["Frostspire Pass", "15–20", "East of Saltreach Harbor. Snow and blizzards, Frost Gate, Icefall Camp, Frozen Lake, Whispering Cairns, Summit Overlook, 2 NMs"],
    ["Ashen Marsh", "9–16 (orc camp, Reefkin shore, Crag Talon roost)", "South of Rocky Hollow. Misty ponds, Sunken Causeway, Croaker's Pool, Mire Village, Drowned Chapel, 2 NMs"]
  ]) + ul(["The clock runs 25× real time (one game day is 57.6 minutes) and keeps going while you're away. Day is 6:00–18:00.", "Hares graze by day; bats and Wandering Bones come out at night. Goblins, worms and ghouls are always around.", "Eight weekdays each boost one element's spells by 10%.", "Home Point Crystals are found only in towns. They restore your party and can be set as your return point."]));
  h += sec("🔱 Battlefield: the Chapel Depths", ul([
    "A sealed door stands in the Drowned Chapel ruins of the Ashen Marsh. A <b>Chapel Sigil</b> opens it (the Drowned sometimes carry one; Vela in Saltreach sells them). The sigil is used up when you enter.",
    "Inside, defeat the <b>Tidebound Priest</b> (level 16 boss) within " + BATTLEFIELD.minutes + " minutes. At 65% HP it raises two Drowned; below half it casts Maelstrom on everyone near it every 22 seconds; below 20% it enrages. It never leashes inside the chapel.",
    "Victory: " + BATTLEFIELD.gil + " crystals, " + BATTLEFIELD.xp + " XP and one treasure you don't own yet: Tide Crown, Abyssal Staff, Drowned Blade, Priest's Mantle or Tidebreaker Bow. Leaving, wiping or running out of time ends the attempt.",
    "Bring a full party of level 15s, food, and potions. The timer shows at the top of the screen."
  ]));
  h += sec("⚖️ Auction house", ul([
    "Talk to <b>Corvin</b> in Ashenreach Outpost or <b>Selene</b> in Saltreach Harbor.",
    "<b>Prices move.</b> Every item drifts around its usual value through the game day (a new price every 6 game hours, about 14 real minutes). Each game day the market news lifts one category (▲) and lowers another (▼). Buying pushes a price up; your lots selling pull it down; both effects fade.",
    "Items that shops sell never fetch more than " + 95 + "% of the shop price at auction, so the auction house is for bargains, materials and other adventurers' gear.",
    "<b>Buying:</b> pick a category and tap an item for its price chart and today's stock (stock refreshes each game day). Weapons and armor more than 5 levels above you are hidden.",
    "<b>Selling:</b> choose an item and quantity (up to one stack), adjust the price, and pay a " + Math.round(AH_CFG.fee * 100) + "% listing fee. The window tells you how quickly it's likely to sell. Up to " + AH_CFG.maxListings + " lots at once; each stays up " + AH_CFG.expireMs / 3600000 + " hours (real time) and keeps selling while you're away. Crystals from a sale go straight to you.",
    "Unsold or withdrawn lots go to your <b>delivery box</b>; collect them from the My lots view. Rare, Ex, key items and furniture can't be auctioned.",
    "<b>🌐 Players:</b> lots put up by other adventurers. Pick a category and an item to see every lot, its seller, time left and recent player sale prices, then Buy. Purchases go straight to your bag (or your delivery box if it's full). Everything is handled by the game server, so a sale can't be duplicated.",
    "<b>Offer to players:</b> in Sell, choose the item, quantity and price, then press <b>🌐 Offer to players</b> instead of Sell to the market. Players see it for 48 hours and pay exactly your price. The same 3% fee applies. Up to 10 player lots at once.",
    "When a player buys your lot you get a message wherever you are; the crystals wait in your <b>player delivery box</b> (My lots) until you collect them at any auction house. Unsold lots come back to the box after 48 hours."
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
    "<b>Bounties:</b> " + GUILD_DAILY + " are posted each day (new ones at midnight UTC). Accept up to " + GUILD_ACTIVE + " at once. Kills count anywhere, with or without companions. Each bounty can be finished once per day; you can abandon one to free a slot.",
    "Rewards per bounty: guild points 🎖️, eight crystals per point, and experience scaled to the bounty's suggested level. ★ bounties are notorious monster hunts and pay the most.",
    "<b>Ranks</b> (by total points earned; spending doesn't lower your rank): " + GUILD_RANKS.map(r => r[0] + " " + r[1]).join(" · ") + ". Each rank posts harder bounties.",
    "<b>Guild rewards</b> (spend points): " + GUILD_SHOP.map(e => ITEMS[e.id].name + " " + e.gp + " (" + GUILD_RANKS[e.rank][0] + ")").join(", ") + ". Guild gear is Ex: one of each, and it can't be sold."
  ]));
  h += sec("❄️ Frostspire Pass", ul([
    "Through the east exit of Saltreach Harbor. The highest area so far (levels 15–20). It snows most of the time; blizzards thicken the air and cut how far you can see.",
    "<b>Snow Hares</b> are peaceful (by day). <b>Ice Bats</b> hear you and hunt in packs at night. <b>Frost Goblins</b> see a long way across the snow and call each other. <b>Glacier Worms</b> sense magic. At night <b>Ice Wights</b> rise at the cairns and smell weakness. Everything here is weak to fire.",
    "Notorious monsters: <b>Rimefang</b> (Icefall Camp, any time; drops Rimefang's Axe and the Frost Ring) and <b>The Frost Wight</b> (Whispering Cairns, at night; drops the Wight Shroud and the Frost Ring).",
    "Quest: Ilsa's <i>Frozen Cargo</i> (level 16, 6 Frost Goblins, rewards a Fur Hat).",
    "Frost Shards drop from the pass's monsters. Vela in Saltreach now sells level 16–17 Frostforged gear and the Fur Hat."
  ]));
  h += sec("⚓ Saltreach Harbor", ul([
    "A second town, through the south exit of the Ashen Marsh. You can set your home point at its crystal.",
    "<b>Ilsa</b>, the harbor master: <i>Catch of the Day</i> (level 6, 3 Harbor Bream → Sea Rod) and <i>Salt and Steel</i> (level 12, 5 Mire Goblins → Tide Ring).",
    "<b>Marn</b> sells rods (the Sea Rod adds 10% to your catch rate), bait, flour, salt, ready meals and potions. <b>Vela</b> sells level 13–14 weapons and armor for every job.",
    "Fish from the docks: Harbor Bream, Sea Bass and the rare Tidecaller Tuna. Sea Bass cooks into Grilled Sea Bass (Cooking 12)."
  ]));
  h += sec("🐸 The Ashen Marsh", ul([
    "Through the south exit of Rocky Hollow. Thick mist cuts how far you can see, especially at night.",
    "<b>Bog Toads</b> hear footsteps. <b>Bog Leeches</b> taste magic and blood (they come for casters and the wounded). <b>Mire Goblins</b> see far and call each other. At night the <b>Drowned</b> rise around the chapel. <b>Reed Hares</b> are peaceful.",
    "Notorious monsters: <b>Old Croaker</b> (Croaker's Pool, by day; drops the Croaker Charm) and <b>Mirelord Gax</b> (Mire Village; drops Gax's Cleaver and the Mire Mantle).",
    "Quests: Captain Rhea's <i>Into the Mire</i> (level 10, 6 Bog Toads, rewards Marsh Boots) and Brann's <i>The Mirelord</i> (level 13).",
    "Gathering: iron-rich ore, willow logs and Mire Reeds. Pell sells level 11 steel, oak and chain gear."
  ]));
  h += sec("🏚️ The Sunken Crypt", ul([
    "Enter from the Bone Pit at the bottom of the Goblin Den. Bring a full party of level 9 or higher.",
    "<b>Brazier Hall:</b> read the Worn Inscription on the north wall, then light the four braziers in that order (tap one and choose Light it). The wrong order snuffs them and raises two skeletons. The right order opens the sealed gate to the crossroads.",
    "<b>North:</b> the Crypt Sentinel, a level 11 notorious skeleton. It drops the <b>Crypt Key</b> (a key item; it doesn't take a bag slot) which opens the throne door. Two treasure chests.",
    "<b>South:</b> the vault, guarded by ghouls, with the best chest.",
    "<b>Throne room:</b> the Hollow King, level 12. At 66% and 33% HP he calls two Royal Guards: kill them or hold them, and keep healing. Below 20% he enrages (hits harder and faster). He returns every 10 real minutes. The Royal Coffer opens while he's down.",
    "Chests refill 20 real minutes after you open them. Key items and crypt progress are saved with your character."
  ]));
  h += sec("📜 Quests", "<p>Nobody hands you quests at the start: talk to people. A ❗ over someone means they have work for you, or you're ready to report back. Kill quests count in the log and the tracker. The journal (J) lists what you've accepted.</p>" + tbl(["Quest", "Giver", "Level", "Task"], Object.keys(QUESTS).map(id => [esc(QUESTS[id].name), esc(QUESTS[id].giver), String(QUESTS[id].lv || 1), esc(QUESTS[id].desc)])));
  h += sec("👥 Party and companions (P)", ul([
    "<b>Hiring:</b> Brann's Mercenary Hall has 5 new fighters every day (the list changes at midnight). They can be any job, with no level requirement, and always fight at your level as you grow.",
    "<b>Fallen companions are gone for good.</b> If a companion is knocked out, they leave your company a few seconds later and can never be hired again. Keep them healed, and pull back when a fight turns.",
    "<b>Stance:</b> Assist (fight your target), Follow (stay close and never attack; healers still heal) or Hold (stand where they are and only fight what comes to them). Set it in the Party window or with /stance.",
    "<b>Gear:</b> give companions equipment from your bag in the Party window. It must suit their job and your level. Tap ↩ on a piece to take it back. Their own kit fills any empty slot.",
    "<b>Bond:</b> companions who fight beside you grow closer: 1 point per kill that gives XP, 4 per notorious monster. Each bond level (up to 5) adds 3% to their HP, MP, attack, defense and accuracy, and they'll tell you a little about themselves.",
    "<b>Wages:</b> the hiring fee covers the first real day (24 hours); after that each companion takes the same amount each day. Wages wait until a fight ends. Tap a companion in the Party box to see how long until their next wage and how much, pay early, or dismiss them."
  ]));
  h += sec("🎣 Fishing", ul([
    "Buy a <b>Willow Rod</b> and <b>Fishing Bait</b> from Pell. Stand at the edge of a pond or lake and use the rod (from your bag or the Items command) or type <b>/fish</b>. Each cast uses one bait.",
    "Wait for a bite, then press <b>Reel in!</b> (or Space, Enter or F) within about 2 seconds. Walking away, fighting or changing area pulls your line in.",
    "Catches: Outpost pond: Pond Minnow, Moat Carp. Rocky Hollow lakes: Moat Carp, Silver Shad, and the rare Lakeking Pike. Ashen Marsh ponds: Mud Eel, Bog Perch, and the rare Ghost Koi, which only bites in rain or storms.",
    "Fishing skill (up to 20) raises your catch rate against tougher fish. Fish sell well to Pell, and the Trade Board sometimes asks for Moat Carp or Mud Eels."
  ]));
  h += sec("🌦️ Weather", ul([
    "Each outdoor area has its own weather, changing every 3 game hours (about 7 real minutes): clear, cloudy, rain, wind, fog or thunderstorms. The icon next to the clock shows it; /weather tells you more.",
    "Rain boosts water spells by 10%, wind boosts wind spells and thunderstorms boost lightning spells. This stacks with the day's element.",
    "Rain and storms make fish bite sooner. Fog and rain shorten how far you can see. The Ashen Marsh is foggy and wet more often than not."
  ]));
  h += sec("🎲 Treasure pool", ul([
    "With companions in the party, equipment drops go into the treasure pool (the panel above the log) instead of straight into your bag. Other loot still goes to your bag.",
    "Press <b>Lot</b> to roll 1–999 or <b>Pass</b>. Companions lot only on pieces their job can use that beat what they're wearing. Highest lot wins. If a companion wins, they wear it right away (their old piece comes to your bag).",
    "If you don't choose within 45 seconds you lot automatically. If everyone passes, the item is lost."
  ]));
  h += sec("📋 Trade Board and 🔨 Forge", ul([
    "The <b>Trade Board</b> by the north path of the Outpost posts three requests a day (new ones at midnight UTC): hand over the materials for crystals and XP.",
    "<b>Garrick the smith</b>, by the stalls, augments equipment: each augment adds a random bonus (STR, DEX, VIT, AGI, INT, MND, Attack, Defense, Accuracy, Evasion, HP or MP). Up to 2 per piece. Cost: 60 crystals per item level, 1 Iron Ore and 1 Fire Essence. Reforging rerolls all of a piece's augments for 40 crystals per level plus the same materials.",
    "Augments belong to the item type: every copy of that item you own shares them. They only apply to you, not to companions wearing the same piece."
  ]));
  h += sec("📖 Bestiary (Y)", ul([
    "A creature is recorded the first time you meet it: come within sight or target it. You learn its type, where it lives and a little lore.",
    "Defeat one to learn how it hunts (sight, sound, magic, weakness), whether it calls for help and its special attack.",
    "Defeat five (or one notorious monster) to learn its elemental weaknesses and what it carries."
  ]));
  h += sec("🏆 Achievements (O)", ul([
    "Achievements track hunting, notorious monsters, skillchains, bursts, levels, quests, exploring, crafting, gathering, gardening, your home, companions, the bestiary and more.",
    "They give no rewards: they are a record of what you have done."
  ]));
  h += sec("🏠 Your residence", ul([
    "The door is on the west cottage of Ashenreach Outpost; walking into it asks if you want to go in. <b>Pip the Nubbin</b> lives there.",
    "<b>Storage:</b> Pip keeps " + CONFIG.storageBase + " slots of items, plus 10 for a placed Storage Chest, 5 for a Bookshelf and 15 for a Wardrobe. Stored items don't count against your bag.",
    "<b>Furniture:</b> Odette by the west wall sells it. Ask Pip to arrange: pick a piece, tap a tile on the 10×8 grid; tap a placed piece to rotate or pack it away. The door tiles and Pip's corner are blocked; rugs can sit under other pieces.",
    "Odette's quest <i>Make It Home</i> rewards a potted plant for placing two pieces."
  ]));
  h += sec("🌙 Townsfolk", ul([
    "People in the Outpost go home at night and come back out in the morning, each at their own hour: Ysolde 19:30–5:30, Tobin 20:00–7:00, Pell 21:00–6:30, Odette 21:30–6:00, Rhea 22:00–6:00, Brann 23:00–7:30 (game time).",
    "While someone is indoors you can't talk or trade with them. The Home Point Crystal is always there."
  ]));
  h += sec("⛏️ Gathering", ul([
    "Look for ore rocks, log piles and herb patches in Rocky Hollow and the Goblin Den (grey, brown and green dots on the compass map). Tap one to gather.",
    "Each needs a tool from Pell: Pickaxe (mining), Hatchet (logging), Sickle (harvesting). A tool breaks 25% of the time, minus 1% per skill level (never below 5%).",
    "A point runs dry after 1–3 uses and a new one appears elsewhere 45 seconds later. Gathering raises its own skill, up to 20."
  ]));
  h += sec("⚒️ Crafting", ul([
    "Open the Crafting window (N, or /craft). Put an essence in the big slot on the left and up to 8 ingredients in the small slots by tapping them in your bag. The right side lists what that combination can make; ★ means the combination is exact. Press OK to craft, Cancel to clear. Tapping a result fills in the slots for you when you have the ingredients. Recipe notes lists every recipe you can learn. It takes " + CONFIG.synthTime + " seconds and works anywhere outside combat; being attacked interrupts it.",
    "Each craft uses one elemental essence: Fire for Smithing and Cooking, Wind for Woodworking, Earth for Clothcraft, Water for Alchemy.",
    "Success starts at 65% when your skill equals the recipe level and moves 7% per level (5–95%). Each level above the recipe adds 5% chance of a high-quality +1 item, up to 50%. A failure uses up the essence and loses some ingredients.",
    "Skill rises on recipes near or above your level, up to " + CONFIG.craftCap + "."
  ]) + tbl(["Craft", "Essence", "Makes"], Object.keys(CRAFTS).map(k => [CRAFTS[k].icon + " " + CRAFTS[k].name, ITEMS[CRAFTS[k].crystal].name, RECIPES.filter(r => r.craft === k).map(r => ITEMS[r.out].name).join(", ")])));
  h += sec("🍳 Cooking and food", ul([
    "Cooking is a craft (Crafting in the main menu) that turns fish, herbs, Grain Flour and Rock Salt (Pell sells both) into meals. Each recipe makes 2–3 servings.",
    "Eat a meal from your bag or the Items command for " + CONFIG.foodMinutes + " real minutes of bonuses (it keeps counting while you're away). One meal at a time: eating another replaces it. You can't eat mid-fight.",
    "Meals: " + Object.keys(ITEMS).filter(k => ITEMS[k].kind === "food").map(k => ITEMS[k].name + " (" + foodText(ITEMS[k].food) + ")").join(" · ") + "."
  ]));
  h += sec("🌱 Gardening", ul([
    "Place a Flowerpot in your residence (Odette sells them), then select it in Arrange to plant, water, feed and harvest.",
    "A plant grows through three stages of 10 real minutes each, but only while watered: water it at every stage.",
    "Feed it one crystal. A matching crystal grows extra: Earth for herbs, Wind for ash, Water for moonbloom. Wildgrass grows crystals of whichever element you feed it.",
    "Seeds: Herb Seeds (3–6 Healing Herbs), Ash Sapling (2–4 Ash Logs), Wildgrass Seeds (2–4 crystals), Moonbloom Seeds (Ethers and a chance at rare materials; a rare drop)."
  ]));
  h += sec("🦖 Mount", ul(["Earn the Riding License from Ysolde at level 5 (300 crystals and 3 Healing Herbs).", "Press R (or the Mount button on phones) in open country. You move 2.2× faster and monsters ignore you. Your companions ride too. Engaging, being hit or entering town or a cave dismounts you.", "<b>Stable</b> (talk to Ysolde): dye your Thornstrider Marsh Teal, Ember Crimson, Night Sable, Dune Gold or Frost Ivory (pay once, switch freely), and buy the Swift Saddle for 15% more speed.", "<b>The Hollow Run</b>: Ysolde times you through 5 checkpoints across Rocky Hollow (a gold column and a yellow minimap dot mark the next one). Gold under 26 s, silver under 36 s, bronze under 50 s; each medal pays out the first time. Dismounting, leaving or going over 75 s ends the run."]));
  h += sec("📱 Performance", ul([
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
    "<b>Loot:</b> gear from a party kill goes into a shared treasure pool. Everyone nearby can Lot or Pass; the highest lot wins once all have chosen or time runs out. Other drops go to the player who made the kill. Crystals are split evenly.",
    "Kills by a party member nearby count for your quest and guild bounty tallies too.",
    "<b>Magic on party members:</b> tap a party member and choose Magic, or target them and cast. Cure spells and Protect work on players in your party.",
    "Your companions stay with you and fight only your monsters. Party chat: <b>/p text</b>. Leave with <b>/leave</b>, remove a member with <b>/kick Name</b>."
  ]));
  h += sec("🛡️ Equipment", ul([
    "Open <b>Equipment</b> (G). Sixteen boxes: Main, Sub, Range, Ammo / Head, Neck, Ear, Ear / Body, Hands, Ring, Ring / Back, Waist, Legs, Feet.",
    "<b>Main:</b> one- and two-handed weapons. <b>Sub:</b> shields. <b>Range</b> and <b>Ammo:</b> slings, arrows and other throwing gear (they add accuracy and attack for now). <b>Neck:</b> gorgets and pendants. <b>Ear</b> and <b>Ring:</b> two of each. <b>Back:</b> capes and mantles. <b>Waist:</b> belts and sashes.",
    "Tap a box to list everything in your bag that fits it; tap an item to see its card (with what you're wearing now underneath for comparison) and tap it again, or press Equip, to put it on. Remove takes the piece off. Items you can't use yet are greyed with the reason.",
    "Under the boxes: your Attack and Defense, and your resistance to the eight elements. Resistance lowers elemental damage from monster special moves and spells, up to half.",
    "Item cards show the slot, every stat, the jobs and level needed, and the item level. Pell sells starter neck, ear, back, waist, shield, sling and ammo pieces; Vela in Saltreach sells better ones."
  ]));
  h += sec("🖥️ The screen", ul([
    "<b>Main menu:</b> Esc with nothing targeted, - (or Insert), or tapping yourself and choosing Main Menu opens the main menu window in the top right. ↑ ↓ choose, Enter confirms, ← → switch between its two pages, Esc closes. <b>Status</b> opens the in-world status screen: your sheet on the left (green numbers are bonuses from gear), the chosen page in the middle and the Status list on the right.",
    "<b>Compass map:</b> sits above the event log (or at the bottom when the log is hidden). The tilted dish turns with your view and shows N/E/S/W, people (green), quest givers (gold), monsters (orange, red when fighting) and your party (blue). Under it are the time and your map square. Tap it for the full map; turn it off in Config → Interface.",
    "<b>Spells</b> are learned by reading scrolls (from shops and monster drops) once one of your jobs is high enough level.",
    "<b>Keyboard in windows:</b> arrows move, Enter chooses, Esc goes back or closes.",
    "<b>Phones:</b> Target and Menu buttons sit above the bottom-right boxes; tap the event log to type.",
    "<b>Lists:</b> Items, Shop, Quests, Magic and Abilities are slim lists in the top left. Point at an entry for its card (under the list) and description (Help bar); choose it for a small box of actions. In a command menu, Magic shows MP Cost and Next (recast) above the target frame.",
    "<b>Bottom right:</b> separate Target and Party boxes.",
    "<b>Windows:</b> menus open in the top left of the screen while the world keeps going. The Commands box shows the window's name and the Help bar explains it. Esc closes it.",
    "<b>Talking:</b> what people say goes into the event log. If there's a choice to make, a small box appears above the log: ↑ ↓ choose, Enter confirm, Esc back out. Yes/no questions use the same box.",
    "<b>Top:</b> the Commands box and the Help bar appear while something is targeted or a menu is open; the Help bar explains the highlighted command. The Network box beside it shows connection strength and messages sent (S) and received (R).",
    "<b>Top left:</b> HP, MP and TP appear while you're in a fight. Status icons beside them show your buffs, food, resting and the City Blessing (blue crystal). Hover or long-press an icon for its name and time left.",
    "<b>Bottom right:</b> Target shows your target's name and HP. Monster names are green while calm and red once they attack you or your party; purple means someone else has claimed it. <b>Locked</b> shows while you're auto-attacking it. Below is Party (or Solo when you're alone) with everyone's HP and MP.",
    "<b>Bottom:</b> the event log. New messages open it fully; after a few quiet seconds it shrinks to three lines. Each Esc hides one more line until it's gone. Press / to type (the tabs and typing box appear), or L to keep it open; on phones tap yourself and choose Chat. Tabs filter combat, loot, system and player chat; type commands in the box under it.",
    "<b>Command menu:</b> opens on the left above the log when you target a monster or player, tap yourself, or press Enter. ↑ ↓ to choose, Enter or → to confirm, ← to go back, Esc to close. Disengage stops attacking and lets go of the target.",
    "<b>Target cursor:</b> the small crystal arrow over your target is blue in range, yellow near the edge of range and red out of range (melee reach, or spell range while you're choosing magic). Some commands can still fail when it's yellow.",
    "<b>Name plates</b> (Config → Interface): players in white with blue edges, people in green, monsters in pale gold (red while attacking you)."
  ]));
  h += sec("💬 Social: friends, linkshells and search", ul([
    "Open <b>Social</b> from the menu (or /social). It shows who's online, your friends, your linkshells and your blacklist.",
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
  h += sec("🌐 Accounts and saving", ul(["You need an account and an internet connection to play. Sign in on the title screen with your email and password. Creating an account needs the sign-up password from the server owner; you may have to confirm your email first.", "Your characters live on the game server, so sign in from any device to keep playing. Up to 8 characters per account, and every name is unique on the server.", "Progress saves to the server about every 15 seconds and when you close or hide the game. If the connection drops, the game keeps saving on your device and catches up when it's back; System shows when you last saved.", "Characters you made in this browser before accounts existed can be uploaded once from the character screen.", "System → Download a copy saves a backup file of the current character. Sign out from System or the character screen.", "The server checks each save. Impossible changes (a level above the cap, a negative or enormous crystal count, a renamed character) are refused, and unusual jumps are flagged for the game's admin. Accounts that cheat can be banned."]));
  h += sec("💾 Updates", ul([ "The game checks for new versions and shows a popup offering to reload. You can also use System → Check for updates."]));
  return h + "</div>";
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

async function checkForUpdate(manual) {
  if (/^__/.test(GAME_VERSION)) return;
  const j = await fetchLatest();
  if (!j) { if (manual) log("Couldn't check for updates right now.", "sys"); return; }
  if (verCmp(j.version, GAME_VERSION) > 0) { if (manual || UI.verDismissed !== j.version) showVersionPopup(j); }
  else if (manual) log("You have the latest version (v" + GAME_VERSION + ").", "sys");
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
  sfx("notify");
  el.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.v === "reload") {
      saveGame();
      if (web) { const u = new URL(location.href); u.searchParams.set("v", j.version); location.replace(u.toString()); }
      else window.open(PLAY_URL, "_blank");
    } else { UI.verDismissed = j.version; el.style.display = "none"; sfx("close"); }
  };
}

function showWhatsNew() {
  let seen = null;
  try { seen = localStorage.getItem("usr_seen_version"); localStorage.setItem("usr_seen_version", GAME_VERSION); } catch (e) {}
  if (/^__/.test(GAME_VERSION) || !seen || seen === GAME_VERSION) return;
  const u = UPDATES.find(x => x.v === GAME_VERSION) || updatesSorted()[0];
  toast("📰", "Updated to v" + GAME_VERSION, u.title + " · see the Updates tab");
  log("Updated to v" + GAME_VERSION + ": " + u.title + ". Open Updates (📰) for details.", "sys");
}

function initVersionCheck() {
  showWhatsNew();
  setTimeout(() => checkForUpdate(false), 4000);
  setInterval(() => checkForUpdate(false), 10 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkForUpdate(false); });
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
    const ch = storyChapter();
    let h = sec("Profile", kv("Race:", esc(rc.name || save.look.race)) + kv("Home Point:", esc(ZONES[save.home.zone] ? ZONES[save.home.zone].name : "—")) + kv("Guild Rank:", esc(GUILD_RANKS[gr][0])) + kv("Guild Points:", (save.guild.gp || 0).toLocaleString()) + '<div class="stBar wide"><span style="width:' + pct + '%"></span></div>');
    h += sec("Adventure", kv("Story:", ch ? esc(ch.title || ch.name || "Chapter " + (save.story.ch + 1)) : "Complete") + kv("Achievements:", Object.keys(save.ach || {}).length + " / " + ACHIEVEMENTS.length) + kv("Defeated:", (save.stats.kills || 0).toLocaleString()));
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
      if (k === "arrowup") { q.hover = L[(i - 1 + n) % n]; sfx("tab"); renderModal(); return true; }
      if (k === "arrowdown") { q.hover = L[(L.indexOf(q.hover) + 1) % n]; sfx("tab"); renderModal(); return true; }
      if (k === "enter") { const id = q.hover || L[0], why = canEquip(id); if (why) { log(why + ".", "sys"); sfx("error"); } else { equip(id, q.slot); q.hover = null; q.list = false; } renderModal(); return true; }
      return false;
    }
    let i = Math.max(0, SLOTS.indexOf(q.slot));
    const mv = { arrowleft: -1, arrowright: 1, arrowup: -4, arrowdown: 4 }[k];
    if (mv) { if (q.slot) i = (i + mv + 16) % 16; q.slot = SLOTS[i]; q.hover = null; sfx("tab"); renderModal(); return true; }
    if (k === "enter" && q.slot) { const L = eqFits(q.slot); q.list = true; q.hover = L[0] || null; sfx("select"); renderModal(); return true; }
    return false;
  }
  if (SLIM_TABS[S.modal]) {
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
  const btns = [...document.querySelectorAll("#mBody button[data-a]:not([disabled]), #mBody [data-a].mcR, #mBody a[data-a]")].filter(b => b.offsetParent);
  if (!btns.length) return false;
  let i = btns.findIndex(b => b.classList.contains("kb"));
  const d = { arrowup: -1, arrowleft: -1, arrowdown: 1, arrowright: 1 }[k];
  if (d) {
    i = i < 0 ? 0 : (i + d + btns.length) % btns.length;
    btns.forEach((b, j) => b.classList.toggle("kb", j === i));
    UI.kbBtn = i;
    btns[i].scrollIntoView({ block: "nearest" });
    if (btns[i].title) UI.modalHelp = btns[i].title;
    sfx("tab");
    return true;
  }
  if (k === "enter" && i >= 0) { btns[i].click(); return true; }
  return false;
}
