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
  return [save.gil, save.inventory.map(s => s.id + s.qty).join(), Object.values(save.gear).join(), player.lv, save.mainJob, save.subJob, S.party.length, save.mountLicense, JSON.stringify(save.quests), S.zoneId, save.storage.length, save.furniture.length].join("|");
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
  for (const t of ["shop", "job", "mercs", "storage", "home", "furnishings"]) if (S.modal === t) tabs.unshift(t);
  for (const t of ["help", "updates", "system", "credits"]) if (S.modal === t) tabs.push(t);
  $("mNav").innerHTML = '<div class="ttl">UNTITLED SOLO RPG</div>' + tabs.map(t => '<button data-tab="' + t + '"' + (t === S.modal ? ' class="on"' : "") + "><span>" + TAB_INFO[t][1] + "</span>" + TAB_INFO[t][0] + (TAB_INFO[t][2] ? '<span class="k">' + TAB_INFO[t][2] + "</span>" : "") + "</button>").join("") + '<button class="x" data-tab="close">✕ Close</button>';
  $("mHead").innerHTML = "<h2>" + TAB_INFO[S.modal][0] + '</h2><span class="meta">💠 ' + save.gil + " crystals · " + save.inventory.length + "/" + CONFIG.inventorySize + ' bag</span><button class="close" data-tab="close">✕</button>';
  const R = { character: tabCharacter, inventory: tabInventory, skills: tabSkills, actions: tabActions, quests: tabQuests, map: tabMap, help: tabHelp, updates: tabUpdates, settings: tabSettings, system: tabSystem, shop: tabShop, job: tabJob, mercs: tabMercs, storage: tabStorage, home: tabHome, furnishings: tabFurnishings, credits: tabCredits }[S.modal];
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
  for (const jb in JOBS) { if (jb !== save.mainJob && jb !== save.subJob && save.jobs[jb].lv <= 1 && !save.jobs[jb].xp) continue; h += '<div class="item"><div>' + JOBS[jb].icon + " " + JOBS[jb].name + ' <span class="sub">Lv.' + save.jobs[jb].lv + "</span></div><span class=\"d\">" + (jb === save.mainJob ? "Main job" : jb === save.subJob ? "Support job" : "") + "</span></div>"; }
  h += "</div>";
  if (typeof appearanceHTML === "function") h += appearanceHTML();
  h += "</div></div>";
  return h;
}

function attachPreview(wrapId) {
  const wrap = $(wrapId || "pvWrap");
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

function previewEntity(o) {
  const job = o ? o.job : player.job;
  const gear = o ? o.gear : save.gear;
  const wt = gear.main && ITEMS[gear.main] ? ITEMS[gear.main].wtype : "h2h";
  const stats = o ? { wtype: wt, dmg: 1, acc: 1, eva: 1, att: 1, def: 1, str: 1, dex: 1, vit: 1, agi: 1, int: 1, mnd: 1, maxHp: 1, maxMp: 1 } : player.stats;
  return { kind: "pc", job, sub: o ? null : player.sub, lv: o ? 1 : player.lv, gear: Object.assign({}, gear), alive: true, engaged: false, casting: null, moving: false, mounted: false, x: 0, y: 0, face: 0, lastSwing: -9, lastHit: -9, lastWS: -9, buffs: {}, tp: 0, hp: 1, maxHp: 1, mp: 0, maxMp: 0, radius: 14, regenerating: false, stats, swingTimer: 2, delay: o ? 3 : player.delay, resting: false };
}
function lookBase(look) {
  const l = look || {};
  return { build: l.build || 0, skin: SKIN_TONES[l.skin || 0], hair: { style: HAIR_STYLES[l.hairStyle || 0], color: HAIR_COLORS[l.hairColor || 0] } };
}
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
  tobin: ["Tobin, Job Master, teaches support jobs at level 5 and the advanced jobs at level 6.", "Tobin is early to bed, early to rise: 20:00 to 7:00."],
  pell: ["Pell buys and sells potions, ethers, arms and armour. Crystals talk.", "Pell keeps late hours for a merchant: he shuts at 21:00."],
  brann: ["Brann runs the Mercenary Hall. One fee hires a companion for good; dismissing is free.", "Brann drinks till 23:00 and is up by half past seven."],
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
  UI.showcase = null;
  const wrap = $("ldPv");
  if (wrap) wrap.style.display = "none";
  if (UI.pv && UI.pv.sig && UI.pv.sig.startsWith("show:")) UI.pv.sig = null;
}

function invSorted() {
  return save.inventory.map((s, i) => ({ s, i })).filter(({ s }) => {
    const it = ITEMS[s.id];
    if (UI.filter === "use") return it.kind === "use";
    if (UI.filter === "gear") return it.kind === "equip";
    if (UI.filter === "mat") return it.kind === "mat" || it.kind === "crystal" || it.kind === "tool";
    if (UI.filter === "rare") return it.rare || it.ex || it.kind === "furniture" || ["rare", "epic"].includes(itemRarity(s.id));
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
    h += '<div class="detail"><div class="hd"><span class="ic">' + (it.icon || "📦") + "</span><div><b>" + esc(it.name) + (s.qty > 1 ? " ×" + s.qty : "") + '</b><div class="tags">' + [rarityTag(s.id), it.rare ? "Rare (one only)" : "", it.ex ? "Ex" : "", it.hq ? "High quality" : "", { use: "Usable", equip: "Equipment", mat: "Material", crystal: "Crystal", tool: "Tool", furniture: "Furniture" }[it.kind] || "", sellPrice(s.id) ? "Sells for " + sellPrice(s.id) + " crystals" : "Can't be sold"].filter(Boolean).join(" · ") + "</div></div></div>";
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
  const ids = Object.keys(QUESTS).filter(id => save.quests[id] !== "none").sort((a, b) => order.indexOf(save.quests[a]) - order.indexOf(save.quests[b]));
  if (!ids.length) return '<div class="sub">You have no quests yet. Talk to the people of the Outpost. A ❗ over someone means they have work for you.</div>';
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
  h += "<h3>Interface</h3><div class=\"opt\">" + btn("toggle", "tracker", "Quest tracker " + (s.tracker !== false ? "on" : "off"), s.tracker !== false) + btn("toggle", "names", "Action names " + (s.names !== false ? "on" : "off"), s.names !== false) + "</div>";
  h += '<h3>More</h3><div class="opt"><button data-a="open" data-v="help">❓ Help</button><button data-a="open" data-v="updates">📰 Updates</button><button data-a="open" data-v="system">💾 System</button><button data-a="open" data-v="credits">🎬 Credits</button></div><div class="sub">Help also opens with H. Saving, loading, changing character and checking for updates are under System.</div>';
  return h;
}
function tabSystem() {
  let h = "<h3>Save data</h3>";
  h += '<div class="sub" style="margin-bottom:8px">Your progress saves automatically in this browser. Save to a file for a backup, or load a file to restore one or move to another device.</div>';
  h += '<div class="opt"><button data-a="savefile">💾 Save to file</button><button data-a="loadfile">📂 Load from file</button></div>';
  h += "<h3>Character</h3><div class=\"sub\" style=\"margin-bottom:8px\">" + esc(save.name) + " · " + JOBS[save.mainJob].name + " Lv." + player.lv + " · " + loadRoster().chars.length + " of " + MAX_CHARS + " characters.</div>";
  h += '<div class="opt"><button data-a="logout">👥 Change character</button></div>';
  h += '<input type="file" id="loadInput" accept=".json,application/json" style="display:none">';
  h += "<h3>Time</h3><div class=\"sub\">" + clockText() + " · " + (isNight() ? "night" : "day") + " · Today's element: " + dayElement() + " (+10% to " + dayElement() + " spells). One game day lasts 57.6 real minutes.</div>";
  h += '<h3>Updates</h3><div class="sub" style="margin-bottom:6px">' + BUILD_INFO + '</div><div class="opt"><button data-a="checkupd">🔄 Check for updates</button><button data-a="open" data-v="updates">📰 What changed</button></div>';
  return h;
}
function tabShop() {
  let h = '<div class="sub" style="margin-bottom:6px">Pell buys and sells. 💠 ' + save.gil + " gil</div><h3>Buy</h3>";
  shopList().forEach(id => { h += '<div class="item"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">' + (ITEMS[id].icon || "") + "</span><div><div>" + esc(ITEMS[id].name) + '</div><div class="d">' + esc(itemDesc(id)) + '</div></div></div><button data-a="buy" data-v="' + id + '"' + (save.gil < ITEMS[id].price ? " disabled" : "") + ">" + ITEMS[id].price + " gil</button></div>"; });
  h += "<h3>Sell</h3>";
  const sellable = save.inventory.filter(s => sellPrice(s.id) > 0);
  if (!sellable.length) h += '<div class="sub">Nothing to sell.</div>';
  sellable.forEach(s => { h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="sell" data-v="' + s.id + '">' + sellPrice(s.id) + " gil</button></div>"; });
  return h;
}
function tabCredits() {
  const link = (url, label, icon) => '<a class="credLink" href="' + url + '" target="_blank" rel="noopener">' + icon + " " + esc(label) + "</a>";
  let h = '<div class="credits"><div class="credT">Untitled Solo RPG</div><div class="credBy">A game made by <b>Ian McGonigal</b></div>';
  h += '<div class="credLinks">' + link("https://ianmcgo.github.io/cabalcoffers/#ebay", "Cabal Coffers store", "🛒") + link("https://www.patreon.com/c/ianmcg", "Support on Patreon", "💛") + link("https://ianmcgo.github.io/website/", "Ian's other works", "🌐") + "</div>";
  h += '<div class="sub" style="margin-top:14px">All names, art, music and sound in this game are original. Inspired by the classic MMORPGs of the early 2000s. ' + BUILD_INFO + "</div></div>";
  return h;
}

function tabFurnishings() {
  let h = '<div class="sub" style="margin-bottom:6px">Odette sells furniture for your residence. 💠 ' + save.gil + " crystals · Pip at the cottage places it.</div><h3>Buy</h3>";
  FURNITURE_SHOP.forEach(id => { const it = ITEMS[id]; const fp = it.fp || [1, 1]; h += '<div class="item"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:20px">' + (it.icon || "") + "</span><div><div>" + esc(it.name) + ' <span class="sub">' + fp[0] + "×" + fp[1] + (it.storage ? " · +" + it.storage + " storage" : "") + '</span></div><div class="d">' + esc(it.desc || "") + '</div></div></div><button data-a="buy" data-v="' + id + '"' + (save.gil < it.price ? " disabled" : "") + ">" + it.price + " gil</button></div>"; });
  h += "<h3>Sell</h3>";
  const sellable = save.inventory.filter(s => ITEMS[s.id].kind === "furniture" && sellPrice(s.id) > 0);
  if (!sellable.length) h += '<div class="sub">No furniture to sell.</div>';
  sellable.forEach(s => { h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="sell" data-v="' + s.id + '">' + sellPrice(s.id) + " gil</button></div>"; });
  return h;
}

function tabStorage() {
  const cap = storageCap();
  let h = '<div class="sub" style="margin-bottom:6px">Pip keeps your things. ' + storageUsed() + " / " + cap + " storage slots (" + CONFIG.storageBase + " base" + (cap > CONFIG.storageBase ? " + " + (cap - CONFIG.storageBase) + " from furniture" : "") + ") · bag " + save.inventory.length + "/" + CONFIG.inventorySize + "</div>";
  h += '<div class="charGrid"><div><h3>Bag → storage</h3>';
  const bag = save.inventory.map((s, i) => ({ s, i })).filter(({ s }) => ITEMS[s.id].kind !== "key");
  if (!bag.length) h += '<div class="sub">Your bag is empty.</div>';
  for (const { s, i } of bag) h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="store" data-v="' + i + '">Store</button></div>';
  h += '</div><div><h3>Storage → bag</h3>';
  if (!save.storage.length) h += '<div class="sub">Nothing stored yet.</div>';
  save.storage.forEach((s, i) => { h += '<div class="item"><div>' + (ITEMS[s.id].icon || "") + " " + esc(ITEMS[s.id].name) + (s.qty > 1 ? " ×" + s.qty : "") + '</div><button data-a="retrieve" data-v="' + i + '">Take</button></div>'; });
  h += "</div></div>";
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
    h += '<div class="detail"><div class="hd"><span class="ic">' + (ITEMS[f.id].icon || "📦") + "</span><div><b>" + esc(ITEMS[f.id].name) + '</b><div class="tags">Tile ' + f.c + "," + f.r + " · " + (f.rot || 0) * 90 + "°" + (ITEMS[f.id].storage ? " · +" + ITEMS[f.id].storage + " storage" : "") + '</div></div></div><div class="acts"><button data-a="rotf" data-v="' + UI.furnSel + '">↻ Rotate</button><button data-a="packf" data-v="' + UI.furnSel + '">Pack away</button></div></div>';
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
  let h = '<div class="sub" style="margin-bottom:6px">Party ' + S.party.length + " / " + CONFIG.maxParty + " · 💠 " + save.gil + " crystals · Fees are paid once per hire.</div>";
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
  else if (a === "open") { openMenu(v); return; }
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
  else if (a === "loadfile") { $("loadInput").click(); return; }
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
    "Character creation now says Sex: Male or Female, and has eight skin tones including dark ones. Some companions and townsfolk have darker skin too.",
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
    "Two advanced jobs. At level 6, Tobin offers The Oath of Steel (Paladin: 2 Bone Chips, 1 Iron Ore) and Scarlet Lessons (Red Mage: 2 Worm Silk, 1 Fire Crystal, 1 Water Crystal).",
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
  { v: "2.0", title: "Phase 2: the 3D world", items: ["3D terrain, trees, water reflections, a physical sky, sun, moon and stars that follow the game clock.", "FFXI-style camera and touch controls."] },
  { v: "1.0", title: "Phase 1: the rules", items: ["Combat, TP, weapon skills, skillchains, magic bursts, enmity, con colours and aggro.", "Hired companions, standing regen, home points, skills, support jobs and the real-time clock."] }
];

function tabUpdates() {
  let h = '<div class="sub" style="margin-bottom:8px">' + BUILD_INFO + "</div>";
  for (const u of UPDATES) h += '<div class="upd"><h4>v' + u.v + " · " + esc(u.title) + (u.date ? "<small>" + u.date + "</small>" : "") + "</h4><ul>" + u.items.map(i => "<li>" + esc(i) + "</li>").join("") + "</ul></div>";
  return h;
}

function tabHelp() {
  const sec = (title, body, open) => "<details" + (open ? " open" : "") + "><summary>" + title + "</summary>" + body + "</details>";
  const ul = arr => "<ul>" + arr.map(x => "<li>" + x + "</li>").join("") + "</ul>";
  const tbl = (head, rows) => "<table><tr>" + head.map(x => "<th>" + x + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map(x => "<td>" + x + "</td>").join("") + "</tr>").join("") + "</table>";
  let h = '<div class="help">';
  h += sec("🌅 Getting started", ul([
    "You start alone in Ashenreach Outpost with 100 crystals. Talk to <b>Captain Rhea</b> for work, <b>Brann</b> to hire companions, <b>Tobin</b> to change jobs, <b>Pell</b> to buy and sell, and <b>Ysolde</b> for the mount.",
    "Leave by the east gate into Rocky Hollow. Hares, worms and small goblins near the gate are good first targets.",
    "Your first hire is a big boost: Mira (White Mage) heals, Kael (Warrior) tanks. A full party is you plus five.",
    "Standing still out of combat recovers HP and MP slowly. To heal properly, type <b>/rest</b> (or use the Rest action on action bar page 2) to sit down. Resting is about six times faster. Moving, attacking or getting hit stands you up."
  ]), true);
  h += sec("👥 Characters", ul([
    "On the title screen you pick a character or create a new one: name (2–12 letters), job, sex and appearance. <b>Appearance is permanent</b>, so take your time.",
    "You can keep up to " + MAX_CHARS + " characters. Each has its own levels, gear, crystals, quests and companions. System → Change character goes back to the select screen.",
    "Deleting a character on the select screen is permanent."
  ]));
  h += sec("💬 Chat commands", "<p>Type in the box under the chat log, or press <b>/</b> to start a command. Plain text is said out loud.</p>" + tbl(["Command", "What it does"], COMMANDS.map(([c, d]) => [esc(c), esc(d)])));
  h += sec("🎮 Controls", ul([
    "<b>Phone:</b> left thumb moves · drag elsewhere to look · pinch to zoom · tap a character to target, tap again to attack or talk · Target button picks the nearest.",
    "<b>Keyboard:</b> WASD move · arrows or Q/E turn · V first person · <b>Tab</b> targets the nearest enemy (or the nearest person in town); press again within 2 s to cycle · F attack · Enter or E talk · Space jump · R mount.",
    "1–0 use the action bar (Shift for page 2) · [ ] switch page · Esc menu · C character · I inventory · K skills · B action bar · J quests · M map · H help."
  ]));
  h += sec("⚔️ Combat", ul([
    "Auto-attack swings on your weapon's delay. Each hit builds <b>TP</b>; at 1000 TP you can use a weapon skill (more TP makes it stronger).",
    "<b>Skillchains:</b> a weapon skill opens a chain; a matching weapon skill within about 6 s closes it for bonus damage. The target frame shows the open chain and its element.",
    "<b>Magic bursts:</b> cast a spell of the skillchain's element while the burst window is open for +35–50% damage.",
    "<b>Enmity:</b> monsters attack whoever has the most hate. Cures and big hits draw hate; Provoke steals it.",
    "<b>Con colours:</b> " + [["Too Weak", "#9e9e9e"], ["Easy Prey", "#64b5f6"], ["Decent Challenge", "#81c784"], ["Even Match", "#fff"], ["Tough", "#ffd54f"], ["Very Tough", "#ff8a65"], ["Incredibly Tough", "#e53935"]].map(([n, c]) => '<span style="color:' + c + '">' + n + "</span>").join(" · ") + ". Too Weak gives no XP.",
    "<b>Debuffs:</b> Slow makes a monster swing 25% slower, Paralyze makes it lose some swings, Flash cuts its accuracy by 40%. They show on the target frame with the time left. Shield Bash interrupts a readied TP move.",
    "<b>Aggro:</b> some monsters attack on sight, some when they hear you moving nearby, undead smell weakness when your HP is low, and some are peaceful until attacked (the target frame says <i>passive</i>). Learn each kind by watching it; nothing on screen gives their range away."
  ]));
  h += sec("🛡️ Jobs and companions", tbl(["Job", "Role", "Highlights"], [
    ["Warrior", "Tank or damage", "Provoke, Berserk, great axe A, sword B"],
    ["White Mage", "Healer", "Cure, Cure II, Dia, Banish, Protect, Divine Seal"],
    ["Black Mage", "Nuker", "Stone → Thunder, Elemental Seal, magic bursts"],
    ["Paladin (advanced)", "Tank", "Sword A, Cure, Flash, Protect, Sentinel, Shield Bash, shields"],
    ["Red Mage (advanced)", "Hybrid", "Sword B, Dia, Cure, nukes, Slow, Paralyze, Convert"]
  ]) + ul([
    "<b>Advanced jobs</b> unlock at level 6 through Tobin: <i>The Oath of Steel</i> (Paladin: 2 Bone Chips, 1 Iron Ore) and <i>Scarlet Lessons</i> (Red Mage: 2 Worm Silk, 1 Fire Crystal, 1 Water Crystal). Each job keeps its own level.",
    "Support jobs unlock at level 5 through Tobin's quest <i>A Second Calling</i> and run at half your level.",
    "Companions cost a one-time fee, match your level and talk in party chat. Knocked-out companions get back up after 6 calm seconds. If one is left far behind, they catch up. When you /rest, they sit with you."
  ]));
  h += sec("📈 Experience", ul([
    "XP needed per level: " + CONFIG.xpTable.slice(1).map((x, i) => "Lv" + (i + 1) + "→" + (i + 2) + " " + x).join(" · ") + ". Level cap " + CONFIG.levelCap + ".",
    "Kill XP scales with the monster's con. Tougher monsters give much more.",
    "<b>EXP chains:</b> defeat another monster within " + CONFIG.chainWindow + " s of your last XP kill for +" + Math.round(CONFIG.chainStep * 100) + "% per chain, up to +" + Math.round(CONFIG.chainMax * CONFIG.chainStep * 100) + "%. The ⛓ counter by the XP bar shows the bonus and time left.",
    "<b>Discovery:</b> landmarks give bonus XP the first time you reach them (🧭 toast). The Map shows how many you've found in each zone.",
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
  ]) + ul(["<b>Only notorious monsters drop equipment.</b> Regular monsters drop materials, crystals and consumables; gear comes from NMs, quests and Pell's shop.", "<b>Rare</b> items can only be held once. If one drops while you already have it, it's lost.", "<b>Ex</b> items (quest rewards, boss trophies) can't be sold."]));
  h += sec("🗺️ World", tbl(["Area", "Levels", "Highlights"], [
    ["Ashenreach Outpost", "Safe", "Shops, jobs, companions, stables, home point"],
    ["Rocky Hollow", "1–6", "Meadow, two lakes, Old Fort Ruins, Goblin Camp, Burrow Flats, 3 NMs"],
    ["Goblin Den", "5–11", "Four chambers: Den Mouth, Underground Pool, Bone Pit (exit to the Crypt), Chieftain's Throne"],
    ["Sunken Crypt", "9–12", "Brazier puzzle, the Crypt Sentinel and its key, the vault, the Hollow King"]
  ]) + ul(["The clock runs 25× real time (one game day is 57.6 minutes) and keeps going while you're away. Day is 6:00–18:00.", "Hares graze by day; bats and Wandering Bones come out at night. Goblins, worms and ghouls are always around.", "Eight weekdays each boost one element's spells by 10%.", "Home Point Crystals are found only in towns. They restore your party and can be set as your return point."]));
  h += sec("🏚️ The Sunken Crypt", ul([
    "Enter from the Bone Pit at the bottom of the Goblin Den. Bring a full party of level 9 or higher.",
    "<b>Brazier Hall:</b> read the Worn Inscription on the north wall, then light the four braziers in that order (tap one and choose Light it). The wrong order snuffs them and raises two skeletons. The right order opens the sealed gate to the crossroads.",
    "<b>North:</b> the Crypt Sentinel, a level 11 notorious skeleton. It drops the <b>Crypt Key</b> (a key item; it doesn't take a bag slot) which opens the throne door. Two treasure chests.",
    "<b>South:</b> the vault, guarded by ghouls, with the best chest.",
    "<b>Throne room:</b> the Hollow King, level 12. At 66% and 33% HP he calls two Royal Guards: kill them or hold them, and keep healing. Below 20% he enrages (hits harder and faster). He returns every 10 real minutes. The Royal Coffer opens while he's down.",
    "Chests refill 20 real minutes after you open them. Key items and crypt progress are saved with your character."
  ]));
  h += sec("📜 Quests", "<p>Nobody hands you quests at the start: talk to people. A ❗ over someone means they have work for you, or you're ready to report back. Kill quests count in the log and the tracker. The journal (J) lists what you've accepted.</p>" + tbl(["Quest", "Giver", "Level", "Task"], Object.keys(QUESTS).map(id => [esc(QUESTS[id].name), esc(QUESTS[id].giver), String(QUESTS[id].lv || 1), esc(QUESTS[id].desc)])));
  h += sec("🏠 Your residence", ul([
    "The door is on the west cottage of Ashenreach Outpost. <b>Pip the Nubbin</b> lives there.",
    "<b>Storage:</b> Pip keeps " + CONFIG.storageBase + " slots of items, plus 10 for a placed Storage Chest, 5 for a Bookshelf and 15 for a Wardrobe. Stored items don't count against your bag.",
    "<b>Furniture:</b> Odette by the west wall sells it. Ask Pip to arrange: pick a piece, tap a tile on the 10×8 grid; tap a placed piece to rotate or pack it away. The door tiles and Pip's corner are blocked; rugs can sit under other pieces.",
    "Odette's quest <i>Make It Home</i> rewards a potted plant for placing two pieces."
  ]));
  h += sec("🌙 Townsfolk", ul([
    "People in the Outpost go home at night and come back out in the morning, each at their own hour: Ysolde 19:30–5:30, Tobin 20:00–7:00, Pell 21:00–6:30, Odette 21:30–6:00, Rhea 22:00–6:00, Brann 23:00–7:30 (game time).",
    "While someone is indoors you can't talk or trade with them. The Home Point Crystal is always there."
  ]));
  h += sec("🦖 Mount", ul(["Earn the Riding License from Ysolde at level 5 (300 crystals and 3 Healing Herbs).", "Press R or the Mount button in open country. You move 2.2× faster and monsters ignore you. Engaging, being hit or entering town or a cave dismounts you."]));
  h += sec("💾 Saving and updates", ul(["Each character saves automatically in this browser every 20 s and after important events.", "System → Save to file makes a backup of the current character you can load on another device.", "The game checks for new versions and shows a popup offering to reload. You can also use System → Check for updates."]));
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
  const u = UPDATES[0];
  toast("📰", "Updated to v" + GAME_VERSION, u.title + " · see the Updates tab");
  log("Updated to v" + GAME_VERSION + ": " + u.title + ". Open Updates (📰) for details.", "sys");
}

function initVersionCheck() {
  showWhatsNew();
  setTimeout(() => checkForUpdate(false), 4000);
  setInterval(() => checkForUpdate(false), 10 * 60 * 1000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkForUpdate(false); });
}
