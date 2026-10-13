function openMenu(tab) {
  tab = TAB_ALIAS[tab] || tab || "character";
  const was = !!S.modal;
  S.modal = tab;
  $("menu").style.display = "block";
  S.keys = {};
  if (typeof VIEW !== "undefined" && VIEW.joy) { VIEW.joy.active = false; VIEW.joy.x = 0; VIEW.joy.y = 0; $("joy").style.display = "none"; }
  UI.sel = null; UI.pick = null; UI.cmp = null;
  renderModal();
  sfx(was ? "tab" : "open");
}
function openModal(tab) { openMenu(tab); }
function closeModal() {
  if (!S.modal) return;
  S.modal = null;
  $("menu").style.display = "none";
  sfx("close");
}

function menuSig() {
  return [save.gil, save.inventory.map(s => s.id + s.qty).join(), Object.values(save.gear).join(), player.lv, save.mainJob, save.subJob, S.party.length, save.mountLicense, JSON.stringify(save.quests), S.zoneId].join("|");
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
  for (const t of ["shop", "job", "mercs"]) if (S.modal === t) tabs.unshift(t);
  $("mNav").innerHTML = '<div class="ttl">UNTITLED SOLO RPG</div>' + tabs.map(t => '<button data-tab="' + t + '"' + (t === S.modal ? ' class="on"' : "") + "><span>" + TAB_INFO[t][1] + "</span>" + TAB_INFO[t][0] + (TAB_INFO[t][2] ? '<span class="k">' + TAB_INFO[t][2] + "</span>" : "") + "</button>").join("") + '<button class="x" data-tab="close">✕ Close</button>';
  $("mHead").innerHTML = "<h2>" + TAB_INFO[S.modal][0] + '</h2><span class="meta">🪙 ' + save.gil + " gil · " + save.inventory.length + "/" + CONFIG.inventorySize + ' bag</span><button class="close" data-tab="close">✕</button>';
  const R = { character: tabCharacter, inventory: tabInventory, skills: tabSkills, actions: tabActions, quests: tabQuests, map: tabMap, settings: tabSettings, system: tabSystem, shop: tabShop, job: tabJob, mercs: tabMercs }[S.modal];
  $("mBody").innerHTML = R ? R() : "";
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

function tabCharacter() {
  const s = player.stats;
  const cmp = UI.cmp && ITEMS[UI.cmp] ? statsFor(Object.assign({}, save.gear, { [ITEMS[UI.cmp].slot]: UI.cmp })) : null;
  let h = '<div class="charGrid"><div><div id="pvWrap"><div class="lbl">' + esc(save.name || "Adventurer") + "<small>" + JOBS[player.job].name + " Lv." + player.lv + (player.sub ? " / " + JOBS[player.sub].name + " Lv." + Math.floor(player.lv / 2) : "") + "</small></div></div>";
  h += '<div class="paper">';
  for (const slot of SLOTS) {
    const id = save.gear[slot];
    h += '<div class="gslot ' + (id ? rarityOf(id) : "") + '" data-a="slotinv" data-v="' + slot + '" title="' + (id ? esc(ITEMS[id].name + " — " + itemDesc(id)) : "Empty") + '"><div class="sl">' + SLOT_NAMES[slot] + '</div><div class="ic">' + (id ? ITEMS[id].icon || "◻" : "·") + '</div><div class="nm">' + (id ? esc(ITEMS[id].name) : "—") + "</div></div>";
  }
  h += '<div class="gslot" data-tab="inventory"><div class="sl">Bag</div><div class="ic">🎒</div><div class="nm">' + save.inventory.length + "/" + CONFIG.inventorySize + "</div></div></div></div><div>";
  h += "<h3>Attributes" + (cmp ? ' <span class="sub">· comparing ' + esc(ITEMS[UI.cmp].name) + "</span>" : "") + '</h3><table class="statT">';
  for (const [k, l] of STAT_ROWS) {
    let extra = "";
    if (cmp) { const d = Math.round((cmp[k] - s[k]) * 100) / 100; if (d) extra = ' <span class="' + ((k === "delay" ? d < 0 : d > 0) ? "up" : "dn") + '">' + (d > 0 ? "+" : "") + d + "</span>"; }
    h += "<tr><td>" + l + '</td><td class="v">' + (k === "maxHp" ? Math.ceil(player.hp) + " / " + s[k] : k === "maxMp" ? Math.floor(player.mp) + " / " + s[k] : s[k]) + extra + "</td></tr>";
  }
  h += "<tr><td>Weapon type</td><td class=\"v\">" + SKILL_NAMES[s.wtype] + "</td></tr></table>";
  const j = save.jobs[save.mainJob];
  const need = xpNeed(j.lv);
  h += "<h3>Progress</h3><div class=\"sub\">Experience " + (need ? j.xp + " / " + need + " (" + Math.floor(100 * j.xp / need) + "%)" : "Level cap reached") + " · Home point: " + ZONES[save.home.zone].name + "</div>";
  h += '<div style="margin-top:6px">';
  for (const jb in JOBS) h += '<div class="item"><div>' + JOBS[jb].icon + " " + JOBS[jb].name + ' <span class="sub">Lv.' + save.jobs[jb].lv + "</span></div><span class=\"d\">" + (jb === save.mainJob ? "Main job" : jb === save.subJob ? "Support job" : "") + "</span></div>";
  h += '</div><div class="sub">Change jobs with Tobin, the Job Master in the Outpost. ' + (save.supportUnlocked ? "Support jobs are unlocked." : "Support jobs unlock through Tobin's quest at level " + CONFIG.supportUnlockLevel + ".") + "</div>";
  if (typeof appearanceHTML === "function") h += appearanceHTML();
  h += "</div></div>";
  return h;
}

function attachPreview() {
  const wrap = $("pvWrap");
  if (!wrap || typeof THREE === "undefined") return;
  if (!UI.pv) {
    try {
      const canvas = document.createElement("canvas");
      canvas.id = "pvCanvas";
      const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
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

function previewEntity() {
  return { kind: "pc", job: player.job, sub: player.sub, lv: player.lv, gear: Object.assign({}, save.gear), alive: true, engaged: false, casting: null, moving: false, mounted: false, x: 0, y: 0, face: 0, lastSwing: -9, lastHit: -9, lastWS: -9, buffs: {}, tp: 0, hp: 1, maxHp: 1, mp: 0, maxMp: 0, radius: 14, regenerating: false, stats: player.stats, swingTimer: 2, delay: player.delay };
}
function renderPreview(now) {
  const pv = UI.pv;
  if (!pv || pv.failed || !pv.canvas.isConnected) return;
  const dt = Math.min(0.05, (now - (pv.last || now)) / 1000);
  pv.last = now;
  const w = pv.canvas.clientWidth, h = pv.canvas.clientHeight;
  if (!w || !h) return;
  if (pv.sized !== w * 10000 + h) { pv.sized = w * 10000 + h; pv.r.setSize(w, h, false); pv.cam.aspect = w / h; pv.cam.updateProjectionMatrix(); }
  const L = lookFor(player.job, save.gear, playerBase());
  const sig = stableKey(L);
  if (sig !== pv.sig) {
    if (pv.holder) { pv.scene.remove(pv.holder); pv.view && pv.view.mat && pv.view.mat.dispose(); }
    const entry = entryFor("h|" + sig, () => humanEntry(L));
    const inst = instantiate(entry);
    const holder = new THREE.Group();
    holder.add(inst.mesh);
    const weapon = makeWeapon(L.weapon, L.weaponId);
    pv.view = { group: holder, mesh: inst.mesh, bones: inst.bones, mat: inst.mat, meta: inst.meta, kind: "human", weapon, weaponKind: L.weapon, alwaysDrawn: false, weaponDrawn: null, style: "pc", stride: 1.7, scale: 1, mount: null, sink: 0 };
    pv.ent = previewEntity();
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

function invSorted() {
  return save.inventory.map((s, i) => ({ s, i })).filter(({ s }) => {
    const it = ITEMS[s.id];
    if (UI.filter === "use") return it.kind === "use";
    if (UI.filter === "gear") return it.kind === "equip";
    if (UI.filter === "mat") return it.kind === "mat" || it.kind === "crystal" || it.kind === "tool";
    if (UI.filter === "rare") return it.rare || it.ex || it.kind === "furniture";
    return true;
  });
}
function tabInventory() {
  const f = (k, l) => '<button data-a="filter" data-v="' + k + '"' + (UI.filter === k ? ' class="on"' : "") + ">" + l + "</button>";
  let h = '<div class="invTop">' + f("all", "All") + f("use", "🧪 Usable") + f("gear", "🗡️ Gear") + f("mat", "🪨 Materials") + f("rare", "✦ Rare & other") + '<button class="sp" data-a="sort">Sort</button></div>';
  if (UI.slotFilter) h += '<div class="sub" style="margin-bottom:6px">Showing items for: ' + SLOT_NAMES[UI.slotFilter] + ' · <a href="#" data-a="clearslot" style="color:var(--gold)">show all</a></div>';
  h += '<div class="inv">';
  let list = invSorted();
  if (UI.slotFilter) list = list.filter(({ s }) => ITEMS[s.id].slot === UI.slotFilter);
  for (const { s, i } of list) {
    const it = ITEMS[s.id];
    h += '<button class="cell ' + rarityOf(s.id) + (UI.sel === i ? " sel" : "") + '" data-a="sel" data-v="' + i + '" title="' + esc(it.name) + '"><span class="ic">' + (it.icon || "📦") + "</span>" + (s.qty > 1 ? '<span class="q">' + s.qty + "</span>" : "") + "</button>";
  }
  if (UI.filter === "all" && !UI.slotFilter) for (let k = save.inventory.length; k < CONFIG.inventorySize; k++) h += '<div class="cell empty"></div>';
  h += "</div>";
  const s = save.inventory[UI.sel];
  if (s) {
    const it = ITEMS[s.id];
    h += '<div class="detail"><div class="hd"><span class="ic">' + (it.icon || "📦") + "</span><div><b>" + esc(it.name) + (s.qty > 1 ? " ×" + s.qty : "") + '</b><div class="tags">' + [it.rare ? "Rare" : "", it.ex ? "Exclusive" : "", it.hq ? "High quality" : "", { use: "Usable", equip: "Equipment", mat: "Material", crystal: "Crystal", tool: "Tool", furniture: "Furniture" }[it.kind] || "", sellPrice(s.id) ? "Sells for " + sellPrice(s.id) + " gil" : "Can't be sold"].filter(Boolean).join(" · ") + "</div></div></div>";
    h += '<div class="sub" style="margin-top:6px">' + esc(itemDesc(s.id)) + "</div>";
    if (it.kind === "equip") {
      const base = player.stats;
      const next = statsFor(Object.assign({}, save.gear, { [it.slot]: s.id }));
      const cur = save.gear[it.slot];
      h += '<div class="cmp"><span class="sub">vs ' + (cur ? esc(ITEMS[cur].name) : "nothing") + ":</span> " + statDeltaHTML(base, next, true) + "</div>";
    }
    h += '<div class="acts">';
    if (it.kind === "use") h += '<button data-a="use" data-v="' + s.id + '">Use</button><button data-a="tobar" data-v="' + s.id + '">Add to action bar</button>';
    if (it.kind === "equip") { const why = canEquip(s.id); h += why ? '<span class="sub bad" style="color:#ff8a80">' + esc(why) + "</span>" : '<button data-a="equip" data-v="' + s.id + '">Equip</button>'; h += '<button data-a="compare" data-v="' + s.id + '">Compare on character</button>'; }
    h += '<button data-a="drop" data-v="' + UI.sel + '">Drop</button></div></div>';
  } else h += '<div class="sub" style="margin-top:10px">Tap an item to see details.</div>';
  return h;
}

function tabSkills() {
  let h = '<div class="sub" style="margin-bottom:10px">Skills rise as you use them, up to a cap set by your job and level. Each job keeps its own skills. Weapon skills unlock at weapon skill 5, 22 and 40.</div>';
  h += "<h3>Combat</h3>";
  const row = sk => {
    const cap = skillCap(player, sk);
    if (cap <= 0) return "";
    const cur = Math.min((save.skills[player.job] || {})[sk] || 0, cap);
    const next = Object.values(WEAPON_SKILLS).filter(w => w.wtype === sk && w.skill > Math.floor(cur)).sort((a, b) => a.skill - b.skill)[0];
    return '<div class="item"><div style="flex:1"><div>' + SKILL_NAMES[sk] + (sk === player.stats.wtype ? ' <span class="sub">· equipped</span>' : "") + '</div><div class="bar tp" style="margin:4px 0 2px;height:6px"><i style="width:' + (100 * cur / cap).toFixed(1) + '%"></i></div><div class="d">' + (next ? "Next: " + next.name + " at " + next.skill : cur >= cap ? "Capped for this level" : "") + '</div></div><span style="min-width:70px;text-align:right">' + cur.toFixed(1) + " / " + cap + "</span></div>";
  };
  for (const sk of COMBAT_SKILLS) h += row(sk);
  const mg = MAGIC_SKILLS.map(row).join("");
  if (mg) h += "<h3>Magic</h3>" + mg;
  return h;
}

function tabActions() {
  const hb = hotbar();
  let h = '<div class="sub">Tap an action, then tap a slot to place it. Tap two slots to swap them. Keys 1–0 use page ' + (UI.page + 1) + '; hold Shift for the other page.</div>';
  hb.pages.forEach((pg, p) => {
    h += "<h3>Page " + (p + 1) + (p === UI.page ? ' <span class="sub">· showing</span>' : "") + '</h3><div class="barEdit">';
    pg.forEach((a, i) => { h += '<button class="slot' + (a ? " " + a.kind : " empty") + (UI.pick && UI.pick[0] === p && UI.pick[1] === i ? " pick" : "") + '" data-a="slotpick" data-v="' + p + "," + i + '"' + (a ? ' style="background:' + actTint(a) + '"' : "") + ' title="' + esc(actName(a)) + '"><span class="hk">' + ((i + 1) % 10) + '</span><span class="ic">' + actIcon(a) + "</span></button>"; });
    h += "</div>";
  });
  h += '<div class="opt"><button data-a="slotclear"' + (UI.pick ? "" : " disabled") + '>Clear selected slot</button><button data-a="barreset">Reset to defaults</button></div>';
  const known = actionList(player).map(a => ({ kind: a.kind, id: a.id }));
  const items = ["potion", "hi_potion", "ether", "potion_hq", "ether_hq"].filter(id => invCount(id) > 0 || id === "potion" || id === "ether").map(id => ({ kind: "item", id }));
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

function tabQuests() {
  let h = "";
  const order = ["active", "killed", "none", "done"];
  const ids = Object.keys(QUESTS).sort((a, b) => order.indexOf(save.quests[a]) - order.indexOf(save.quests[b]));
  for (const id of ids) {
    const st = save.quests[id];
    const q = QUESTS[id];
    const label = { none: "Not started", active: "In progress", killed: "Ready to report", done: "Complete" }[st];
    const col = { none: "#888", active: "#f1cf73", killed: "#8fd66a", done: "#6aa9ff" }[st];
    h += '<div class="item" style="display:block' + (st === "done" ? ";opacity:.65" : "") + '"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-family:var(--serif)">' + esc(q.name) + '</b><span class="sub" style="color:' + col + '">' + label + '</span></div><div class="d">From ' + esc(q.giver) + " · " + esc(q.desc) + "</div>";
    const pr = questProgress(id);
    if (pr.length) h += '<div style="margin-top:4px;font-size:12px">' + pr.map(l => "· " + l).join("<br>") + "</div>";
    const rc = rewardChips(q.reward);
    if (rc.length) h += '<div class="d" style="margin-top:4px">Reward: ' + rc.join(" · ") + "</div>";
    h += "</div>";
  }
  return h;
}

function tabMap() {
  let h = '<div class="mapBox"><canvas id="mapCanvas"></canvas></div><div class="legend"><span><i style="background:#fff"></i>You</span><span><i style="background:#62b6ff"></i>Party</span><span><i style="background:#ead9ae"></i>People</span><span><i style="background:#ffd54f"></i>Quest</span><span><i style="background:#7ff3ff"></i>Home point</span><span><i style="background:#f1cf73;border-radius:2px"></i>Exit</span><span><i style="background:#111;border:1px solid #555"></i>Unexplored</span></div>';
  const f = exploredFor(S.zoneId);
  const pct = Math.round(100 * f.s.split("").filter(c => c === "1").length / f.s.length);
  h += '<div class="sub" style="margin-top:4px">' + esc(S.zone.name) + " · " + pct + "% explored</div>";
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
  h += "<h3>Interface</h3><div class=\"opt\">" + btn("toggle", "tracker", "Quest tracker " + (s.tracker !== false ? "on" : "off"), s.tracker !== false) + btn("toggle", "names", "Action names " + (s.names !== false ? "on" : "off"), s.names !== false) + "</div>";
  return h;
}
function tabSystem() {
  let h = "<h3>Save data</h3>";
  h += '<div class="sub" style="margin-bottom:8px">Your progress saves automatically in this browser. Save to a file for a backup, or load a file to restore one or move to another device.</div>';
  h += '<div class="opt"><button data-a="savefile">💾 Save to file</button><button data-a="loadfile">📂 Load from file</button><button data-a="newgame">Start a new game</button></div>';
  h += '<input type="file" id="loadInput" accept=".json,application/json" style="display:none">';
  h += "<h3>Time</h3><div class=\"sub\">" + clockText() + " · " + (isNight() ? "night" : "day") + " · Today's element: " + dayElement() + " (+10% to " + dayElement() + " spells). One game day lasts 57.6 real minutes.</div>";
  h += "<h3>Controls</h3><div class=\"sub\" style=\"line-height:1.7\"><b>Phone:</b> left thumb moves · drag elsewhere to look · pinch to zoom · tap to target, tap again to attack or talk.<br><b>Keyboard:</b> WASD move · drag, arrows or Q/E turn · scroll zoom · V first person · Tab target · F attack · Enter talk · 1–0 action bar (Shift for page 2) · [ ] switch page · R mount · Esc menu · C character · I inventory · K skills · B action bar · J quests · M map.<br>Stand still out of combat to regenerate HP and MP.</div>";
  h += "<h3>About</h3><div class=\"sub\">Untitled Solo RPG · Phase 4 build · all art, music and sound are generated for this game.</div>";
  return h;
}
function tabShop() {
  let h = '<div class="sub" style="margin-bottom:6px">Pell buys and sells. 🪙 ' + save.gil + " gil</div><h3>Buy</h3>";
  shopList().forEach(id => { h += '<div class="item"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">' + (ITEMS[id].icon || "") + "</span><div><div>" + esc(ITEMS[id].name) + '</div><div class="d">' + esc(itemDesc(id)) + '</div></div></div><button data-a="buy" data-v="' + id + '"' + (save.gil < ITEMS[id].price ? " disabled" : "") + ">" + ITEMS[id].price + " gil</button></div>"; });
  h += "<h3>Sell</h3>";
  const sellable = save.inventory.filter(s => sellPrice(s.id) > 0);
  if (!sellable.length) h += '<div class="sub">Nothing to sell.</div>';
  sellable.forEach(s => { h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="sell" data-v="' + s.id + '">' + sellPrice(s.id) + " gil</button></div>"; });
  return h;
}
function tabJob() {
  let h = "<h3>Main job</h3>";
  for (const jb in JOBS) h += '<div class="item"><div>' + JOBS[jb].icon + " " + JOBS[jb].name + ' <span class="sub">Lv.' + save.jobs[jb].lv + "</span></div>" + (jb === save.mainJob ? '<span class="d">Current</span>' : '<button data-a="main" data-v="' + jb + '">Set main</button>') + "</div>";
  h += "<h3>Support job</h3>";
  if (!save.supportUnlocked) h += '<div class="sub">Locked. ' + (player.lv < CONFIG.supportUnlockLevel ? "Reach level " + CONFIG.supportUnlockLevel + " and talk to Tobin." : "Complete Tobin's quest, A Second Calling.") + "</div>";
  else {
    h += '<div class="sub" style="margin-bottom:6px">Runs at half your main level (currently Lv.' + Math.floor(player.lv / 2) + ").</div>";
    for (const jb of ["none"].concat(Object.keys(JOBS))) {
      if (jb === save.mainJob) continue;
      const cur = (save.subJob || "none") === jb;
      h += '<div class="item"><div>' + (jb === "none" ? "None" : JOBS[jb].icon + " " + JOBS[jb].name) + "</div>" + (cur ? '<span class="d">Current</span>' : '<button data-a="sub" data-v="' + jb + '">Set support</button>') + "</div>";
    }
  }
  return h;
}
function tabMercs() {
  let h = '<div class="sub" style="margin-bottom:6px">Party ' + S.party.length + " / " + CONFIG.maxParty + " · 🪙 " + save.gil + " gil · Fees are paid once per hire.</div>";
  for (const id in MERCS) {
    const m = MERCS[id];
    const hired = save.hired.includes(id);
    const avail = mercAvailable(id);
    let btn;
    if (hired) btn = '<button data-a="dismiss" data-v="' + id + '">Dismiss</button>';
    else if (!avail) btn = '<span class="d">' + esc(mercLockedReason(id)) + "</span>";
    else btn = '<button data-a="hire" data-v="' + id + '"' + (save.gil < m.fee || save.hired.length >= CONFIG.maxParty - 1 ? " disabled" : "") + ">Hire · " + m.fee + " gil</button>";
    h += '<div class="item"><div style="display:flex;gap:10px;align-items:center"><span class="por" style="width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:2px solid ' + m.color + ';flex:none">' + (JOBS[m.job] ? JOBS[m.job].icon : "?") + "</span><div><div>" + esc(m.name) + ' <span class="sub">' + (JOBS[m.job] ? JOBS[m.job].name : m.job) + " · " + m.role + '</span></div><div class="d">' + esc(m.desc) + "</div></div></div>" + btn + "</div>";
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
    if (!d) { log("That file isn't an Untitled Solo RPG save.", "sys"); sfx("error"); return; }
    if (typeof confirm === "function" && !confirm("Load this save? Your current progress in this browser will be replaced.")) return;
    closeModal();
    applyLoadedSave(d);
    UI.watch = null; UI.slotKey = ""; UI.actKeys = null; UI.partyKey = "";
    toast("📂", "Loaded", "Save file restored.");
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
  if (a === "toggle" && (v === "tracker" || v === "names")) { VIEW.settings[v] = VIEW.settings[v] === false; saveSettings(VIEW.settings); applyUiSettings(); renderModal(); sfx("click"); return; }
  if (typeof handleSettingAction === "function" && handleSettingAction(a, v)) { renderModal(); sfx("click"); return; }
  const hb = hotbar();
  if (a === "filter") { UI.filter = v; UI.sel = null; sfx("tab"); }
  else if (a === "sort") { save.inventory.sort((x, y) => (KIND_ORDER[ITEMS[x.id].kind] - KIND_ORDER[ITEMS[y.id].kind]) || ITEMS[x.id].name.localeCompare(ITEMS[y.id].name)); UI.sel = null; saveGame(); sfx("select"); }
  else if (a === "sel") { UI.sel = UI.sel === +v ? null : +v; sfx("select"); }
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
    if (typeof confirm === "function" && !confirm("Drop " + (s.qty > 1 ? s.qty + " × " : "") + it.name + "?" + (it.rare || it.ex ? " You may not be able to get it again." : ""))) return;
    save.inventory.splice(+v, 1);
    log("You drop " + (s.qty > 1 ? s.qty + " " + it.name + "s" : an(it.name)) + ".", "sys");
    UI.sel = null; saveGame(); sfx("close");
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
  else if (a === "savefile") { downloadSave(); return; }
  else if (a === "loadfile") { $("loadInput").click(); return; }
  else if (a === "newgame") {
    if (typeof confirm === "function" && !confirm("Erase your progress and start over?")) return;
    startNewGame();
    UI.watch = null; UI.slotKey = ""; UI.actKeys = null; UI.partyKey = "";
    closeModal();
    return;
  }
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
