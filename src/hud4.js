const UI = {
  page: 0, partyKey: "", slots: [], slotKey: "", lastMini: 0, mapCache: null, chatFilter: "all", toastQ: [],
  watch: null, hpGhost: 0, ghostTarget: null, actKeys: null, actCtx: "", trackerMin: false, slotText: [], phone: false, lastFog: 0,
  prevZone: null, menuSig: "", menuSigAt: 0, sel: null, pick: null, filter: "all", cmp: null, pv: null, frameT: 0
};
const ACT_ICON = { last_resort: "🩸", soulfire: "🔥", blood_blade: "🗡️", encore: "🎶", steal: "🫳", sneak_attack: "🗡️", flee: "💨", boost: "👊", focus: "🎯", chakra: "🧘", sharpshot: "🎯", barrage: "🏹", shadowbind: "⛓️", release: "🌀", blood_pact: "🔮", siphon: "💠", provoke: "❗", berserk: "💢", divine_seal: "✚", elemental_seal: "✦", sentinel: "🛡️", shield_bash: "💥", convert: "🔄" };
const SPELL_ICON = { blight: "☠️", drain: "🩸", mind_drain: "🌀", stun: "💫", battle_minuet: "🎵", mending_paeon: "💚", drowsy_lullaby: "💤", wellspring_ballad: "💧", keen_madrigal: "🎯", swift_march: "🥁", mending_paeon2: "💚", battle_minuet2: "🎵", cure3: "✚", banish2: "✴", stone2: "◆", water2: "💧", aero2: "🌀", fire2: "🔥", blizzard2: "❄", ember_sprite: "🔥", frost_sprite: "❄", gale_sprite: "🌪️", cure: "✚", cure2: "✚", dia: "☀", banish: "✴", stone: "◆", water: "💧", aero: "🌀", fire: "🔥", blizzard: "❄", thunder: "⚡", flash: "✨", slow: "🐌", paralyze: "🧊", protect: "🔰" };
const KIND_ORDER = { use: 0, equip: 1, crystal: 2, mat: 3, tool: 4, furniture: 5 };
const TAB_INFO = {
  character: ["Character", "👤", "C"], inventory: ["Inventory", "🎒", "I"], skills: ["Skills", "📈", "K"], actions: ["Action Bar", "✨", "B"],
  quests: ["Quests", "📜", "J"], map: ["Map", "🗺️", "M"], settings: ["Settings", "⚙️", ""], system: ["System", "💾", ""],
  shop: ["Shop", "💠", ""], job: ["Jobs", "🎓", ""], mercs: ["Mercenaries", "🛡️", ""], help: ["Help", "❓", "H"], updates: ["Updates", "📰", ""],
  craft: ["Crafting", "⚒️", "N"], storage: ["Storage", "📦", ""], home: ["Arrange", "🏠", ""], furnishings: ["Furnishings", "🪑", ""], credits: ["Credits", "🎬", ""],
  party: ["Party", "👥", "P"], forge: ["Forge", "🔨", ""], stable: ["Stable", "🦖", ""], board: ["Trade Board", "📋", ""], guild: ["Adventurers' Guild", "⚔️", ""], bestiary: ["Bestiary", "📖", "Y"], achievements: ["Achievements", "🏆", "O"]
};
const MAIN_TABS = ["character", "inventory", "skills", "actions", "party", "craft", "quests", "bestiary", "achievements", "map", "settings"];
const TAB_ALIAS = { items: "inventory", status: "character", equip: "character" };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function log(msg, c) {
  const el = $("log");
  if (!el) return;
  const near = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  const d = document.createElement("div");
  d.className = c || "sys";
  d.textContent = msg;
  el.appendChild(d);
  while (el.children.length > 250) el.removeChild(el.firstChild);
  if (near || $("chat").classList.contains("min")) el.scrollTop = el.scrollHeight;
}
function clearLog() { $("log").innerHTML = ""; }
function showKO(on) { $("ko").style.display = on ? "flex" : "none"; }

function openDialog(who, text, opts) {
  const offer = (opts || []).some(o => /^(Accept|I'll handle him|I'll get them)$/.test(o.label));
  if (offer) text += "\n\nWill you accept this quest?";
  S.dialog = { who, text, opts };
  $("dlgWho").textContent = who;
  $("dlgText").textContent = text;
  const box = $("dlgOpts");
  box.innerHTML = "";
  const all = (opts || []).concat([{ label: offer ? "Decline" : "Close", fn: () => { if (offer) log("You decline for now.", "sys"); closeDialog(); } }]);
  all.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = (UI.phone ? "" : (i + 1) + ". ") + o.label;
    b.onclick = () => { sfx("select"); o.fn(); };
    box.appendChild(b);
  });
  S.dialog.all = all;
  $("dialog").style.display = "block";
  sfx("open");
}
function closeDialog() {
  if (S.dialog) sfx("close");
  S.dialog = null;
  const d = $("dialog");
  if (d) d.style.display = "none";
}
function uiPartyChanged() { UI.partyKey = ""; }

function rarityOf(id) { return "r-" + itemRarity(id); }
function rarityTag(id) { const r = RARITY[itemRarity(id)]; return '<span style="color:' + r[1] + '">' + r[0] + "</span>"; }
function itemDesc(id) {
  const it = ITEMS[id];
  const tags = RARITY[itemRarity(id)][0] + " · " + (it.rare ? "Rare (one only) · " : "") + (it.ex ? "Ex (can't be sold) · " : "") + (it.hq ? "High quality · " : "");
  if (it.kind !== "equip") return tags + (it.desc || "");
  const parts = [SLOT_NAMES[it.slot]];
  if (it.wtype) parts.push(SKILL_NAMES[it.wtype] + " DMG " + it.dmg + " Delay " + it.delay);
  if (it.stats) for (const k in it.stats) parts.push(k.toUpperCase() + "+" + it.stats[k]);
  parts.push("Lv." + it.lv + " " + it.jobs.join("/"));
  return tags + parts.join(" · ");
}

function actIcon(a) {
  if (!a) return "";
  if (a.kind === "item") return (ITEMS[a.id] && ITEMS[a.id].icon) || "❔";
  if (a.kind === "cmd") return "💤";
  if (a.kind === "ws") return "⚔";
  if (a.kind === "ja") return ACT_ICON[a.id] || "✦";
  return SPELL_ICON[a.id] || "✧";
}
function actName(a) {
  if (!a) return "";
  if (a.kind === "item") return ITEMS[a.id] ? ITEMS[a.id].name : a.id;
  if (a.kind === "cmd") return "Rest";
  if (a.kind === "ws") return WEAPON_SKILLS[a.id].name;
  if (a.kind === "ja") return ABILITIES[a.id].name;
  return SPELLS[a.id].name;
}
function actDesc(a) {
  if (a.kind === "item") return ITEMS[a.id].desc || "";
  if (a.kind === "cmd") return "Sit down to recover HP and MP quickly (/rest). Use again or move to stand.";
  if (a.kind === "ws") { const w = WEAPON_SKILLS[a.id]; return "Weapon skill · 1000 TP · " + w.props.join("/"); }
  if (a.kind === "ja") { const b = ABILITIES[a.id]; return "Ability · recast " + b.recast + "s · " + (b.desc || ""); }
  const s = SPELLS[a.id];
  return s.mp + " MP · cast " + s.cast + "s · " + (s.desc || "");
}
function actTint(a) {
  if (!a) return "";
  if (a.kind === "ma") { const s = SPELLS[a.id]; const c = s.element ? ELEMENT_COLORS[s.element] : "#8fe0a8"; return "radial-gradient(circle at 50% 35%, " + c + "55, #141722 75%)"; }
  if (a.kind === "ws") return "radial-gradient(circle at 50% 35%, #6b5420, #141722 75%)";
  if (a.kind === "ja") return "radial-gradient(circle at 50% 35%, #2f6a40, #141722 75%)";
  if (a.kind === "cmd") return "radial-gradient(circle at 50% 35%, #2c4a6a, #141722 75%)";
  return "radial-gradient(circle at 50% 35%, #3b3355, #141722 75%)";
}

function hotbar() {
  if (!save.hotbars || typeof save.hotbars !== "object") save.hotbars = {};
  let hb = save.hotbars[save.mainJob];
  if (!hb || !Array.isArray(hb.pages)) {
    hb = save.hotbars[save.mainJob] = { pages: [new Array(10).fill(null), new Array(10).fill(null)], seen: [] };
    hb.pages[1][0] = { kind: "item", id: "potion" };
    hb.pages[1][1] = { kind: "item", id: "ether" };
    hb.pages[1][2] = { kind: "item", id: "hi_potion" };
  }
  if (!hb.restAdded) {
    hb.restAdded = true;
    if (!hb.pages.some(pg => pg.some(x => x && x.kind === "cmd"))) {
      const pg = hb.pages[1];
      const i = pg.findIndex(x => !x);
      if (i >= 0) pg[i] = { kind: "cmd", id: "rest" };
    }
  }
  return hb;
}
function syncHotbar() {
  const list = actionList(player);
  const ctx = player.job + "/" + (player.sub || "") + "/" + player.stats.wtype;
  const keys = list.map(a => a.kind + ":" + a.id);
  const sig = keys.join(",");
  if (sig === UI.slotKey) return;
  const hb = hotbar();
  const fresh = [];
  for (const a of list) {
    const k = a.kind + ":" + a.id;
    if (hb.seen.includes(k)) continue;
    hb.seen.push(k);
    fresh.push(a);
    outer: for (const pg of hb.pages) for (let i = 0; i < 10; i++) if (!pg[i]) { pg[i] = { kind: a.kind, id: a.id }; break outer; }
  }
  if (UI.actKeys && UI.actCtx === ctx) {
    const gained = list.filter(a => !UI.actKeys.includes(a.kind + ":" + a.id));
    if (gained.length && !(UI.leveledAt && performance.now() - UI.leveledAt < 1500)) gained.forEach(a => toast(actIcon(a), a.kind === "ws" ? "New weapon skill" : a.kind === "ma" ? "New spell" : "New ability", actName(a)));
    if (gained.length) sfx("unlock");
  }
  UI.actKeys = keys;
  UI.actCtx = ctx;
  UI.slotKey = sig;
  if (fresh.length) saveGame();
  buildActionBar();
}
function knownAct(a) {
  if (!a) return false;
  if (a.kind === "item" || a.kind === "cmd") return true;
  return actionList(player).some(x => x.kind === a.kind && x.id === a.id);
}
function buildActionBar() {
  const el = $("actionBar");
  el.innerHTML = "";
  UI.slots = [];
  const pg = hotbar().pages[UI.page];
  for (let i = 0; i < 10; i++) {
    const a = pg[i];
    const b = document.createElement("button");
    b.className = "slot" + (a ? " " + a.kind : " empty");
    if (a) b.style.background = actTint(a);
    b.innerHTML = '<span class="hk">' + ((i + 1) % 10) + '</span><span class="ic">' + actIcon(a) + '</span><span class="cost"></span><span class="cd"></span><span class="cdt"></span><span class="nmL">' + esc(actName(a)) + "</span>";
    b.title = a ? actName(a) + " — " + actDesc(a) : "Empty slot. Assign actions in the menu (B).";
    b.onclick = () => activateSlot(UI.page, i);
    el.appendChild(b);
    UI.slots.push({ el: b, a, cost: b.querySelector(".cost"), cd: b.querySelector(".cd"), cdt: b.querySelector(".cdt"), chip: null, last: {} });
  }
  $("pgNum").textContent = UI.page + 1;
}
function setPage(p) { UI.page = (p + 2) % 2; buildActionBar(); sfx("tab"); }
function activateSlot(page, i) {
  const a = hotbar().pages[page][i];
  if (page === UI.page && UI.slots[i]) { const el = UI.slots[i].el; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  if (!a) { openMenu("actions"); return; }
  if (a.kind === "cmd") { runCommand("/" + a.id); return; }
  if (a.kind === "item") {
    if (invCount(a.id) < 1) { log("You don't have any " + ITEMS[a.id].name + "s.", "sys"); sfx("error"); return; }
    useItem(a.id);
    return;
  }
  if (!knownAct(a)) { log("You can't use " + actName(a) + " as your current job.", "sys"); sfx("error"); return; }
  playerAct({ kind: a.kind, id: a.id, name: actName(a) });
}
function setTxt(el, v) { if (el._v !== v) { el._v = v; el.textContent = v; } }
function setHtml(el, v) { if (el._h !== v) { el._h = v; el.innerHTML = v; } }
function setW(el, pct) { const v = clamp(pct, 0, 100).toFixed(1) + "%"; if (el._w !== v) { el._w = v; el.style.width = v; } }

function updateActionBar() {
  syncHotbar();
  const at = player.attackTarget;
  const chainOpen = at && at.chain && S.time >= at.chain.openAt && S.time <= at.chain.closeAt;
  UI.slots.forEach(s => {
    const a = s.a;
    if (!a) return;
    let cost = "", cdLeft = 0, cdTotal = 1, ready = true, chip = "", burst = false;
    if (a.kind === "cmd") { ready = player.alive; cost = player.resting ? "on" : ""; }
    else if (a.kind === "item") {
      const n = invCount(a.id);
      cost = "×" + n;
      cdLeft = Math.max(0, S.itemReadyAt - S.time); cdTotal = CONFIG.itemRecast;
      ready = n > 0 && cdLeft <= 0 && player.alive;
    } else if (!knownAct(a)) { ready = false; cost = "—"; }
    else {
      const act = { kind: a.kind, id: a.id };
      const t = resolveTarget(act);
      const why = checkAction(player, act, t);
      ready = !why || /target|range|engaged/i.test(why) && a.kind !== "ws";
      if (a.kind === "ws") {
        ready = player.tp >= 1000;
        cost = player.tp >= 1000 ? "TP" : "";
        if (chainOpen && ready) { const r = findChain(at.chain.props, WEAPON_SKILLS[a.id].props); if (r) chip = "→ " + r; }
      } else if (a.kind === "ja") {
        cdLeft = recastLeft(player, "ja:" + a.id); cdTotal = ABILITIES[a.id].recast;
      } else {
        const sp = SPELLS[a.id];
        cost = String(sp.mp);
        cdLeft = recastLeft(player, "ma:" + a.id); cdTotal = sp.recast;
        if (player.mp < sp.mp) ready = false;
        const tt = isMob(player.target) ? player.target : at;
        if (sp.element && tt && tt.burst && S.time <= tt.burst.until && tt.burst.el.includes(sp.element)) { burst = true; chip = "Burst!"; }
      }
    }
    if (cdLeft > 0) ready = false;
    setTxt(s.cost, cost);
    const frac = cdLeft > 0 ? cdLeft / cdTotal : 0;
    const bg = frac > 0 ? "conic-gradient(rgba(0,0,0,.72) " + (frac * 100).toFixed(1) + "%, rgba(0,0,0,.12) 0)" : "";
    if (s.cd._bg !== bg) { s.cd._bg = bg; s.cd.style.background = bg; }
    setTxt(s.cdt, cdLeft > 0 ? (cdLeft >= 10 ? Math.ceil(cdLeft) : cdLeft.toFixed(1)) : "");
    s.el.classList.toggle("dim", !ready);
    s.el.classList.toggle("ready", a.kind === "ws" && ready);
    s.el.classList.toggle("burst", burst);
    if (chip !== (s.chipV || "")) {
      s.chipV = chip;
      if (s.chip) { s.chip.remove(); s.chip = null; }
      if (chip) { s.chip = document.createElement("span"); s.chip.className = "chip" + (burst ? " b" : ""); s.chip.textContent = chip; s.el.appendChild(s.chip); }
    }
  });
}

function jobTag(p) { if (p.pet) return "Sprite"; return p.job + p.lv + (p.sub ? "/" + p.sub + Math.floor(p.lv / 2) : ""); }
function buildParty() {
  const el = $("party");
  el.innerHTML = "";
  S.party.forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "pf glass";
    const job = JOBS[p.job] || { icon: "?", color: "#ccc" };
    row.innerHTML = '<div class="por" style="border-color:' + (p.color || job.color) + '">' + job.icon + "<em></em></div><div><div class=\"top\"><span class=\"nm\"></span><span class=\"jb\"></span></div><div class=\"bars\">" +
      '<div class="bar hp"><i></i><b></b></div><div class="bar mp"><i></i><b></b></div><div class="bar tp"><i></i><b></b></div>' + (p === player ? '<div class="bar xp" title="Experience"><i id="pfXp"></i></div>' : "") + '</div></div><div class="bufs"></div><div class="bar cast cb"><i></i></div>';
    row.onclick = () => { setTarget(p); sfx("select"); };
    const q = s => row.querySelector(s);
    const bars = row.querySelectorAll(".bars .bar");
    p.ui = { row, nm: q(".nm"), jb: q(".jb"), lv: q(".por em"), hp: bars[0].firstChild, hpT: bars[0].lastChild, mp: bars[1].firstChild, mpT: bars[1].lastChild, mpBar: bars[1], tp: bars[2].firstChild, bufs: q(".bufs"), cb: q(".cb"), cbI: q(".cb i") };
    el.appendChild(row);
  });
}
function updateParty() {
  const key = S.party.map(p => (p.mercId || "me") + p.job).join(",");
  if (key !== UI.partyKey) { UI.partyKey = key; buildParty(); }
  for (const p of S.party) {
    const u = p.ui;
    if (!u) continue;
    setTxt(u.nm, p === player ? save.name || "You" : p.name);
    setTxt(u.jb, (UI.phone ? jobTag(p) : (JOBS[p.job] ? JOBS[p.job].name : p.job) + (p.sub ? "/" + p.sub : "")) + (p.mounted ? " 🦖" : ""));
    setTxt(u.lv, String(p.lv));
    setW(u.hp, 100 * p.hp / p.maxHp);
    setTxt(u.hpT, String(Math.ceil(p.hp)));
    u.mpBar.style.display = p.maxMp > 0 ? "" : "none";
    setW(u.mp, p.maxMp ? 100 * p.mp / p.maxMp : 0);
    setTxt(u.mpT, p.maxMp ? String(Math.floor(p.mp)) : "");
    setW(u.tp, 100 * p.tp / CONFIG.tpMax);
    const bf = Object.keys(p.buffs || {}).map(k => "<span title=\"" + (BUFF_NAMES[k] || k) + "\">" + (BUFF_ICONS[k] || "•") + "</span>").join("") + (p.resting ? '<span title="Resting: fast recovery">💤</span>' : p.regenerating ? '<span title="Recovering slowly. Type /rest to sit and heal faster.">🌿</span>' : "") + (p.engaged ? '<span title="Engaged">⚔</span>' : "");
    setHtml(u.bufs, bf);
    const cast = p.casting ? (S.time - p.casting.start) / (p.casting.end - p.casting.start) : -1;
    u.cb.style.display = cast >= 0 ? "" : "none";
    if (cast >= 0) setW(u.cbI, cast * 100);
    u.row.classList.toggle("sel", player.target === p);
    u.row.classList.toggle("ko", !p.alive);
  }
}

function updateTarget() {
  if (UI.cmd && (player.target !== UI.cmd.t || !UI.cmd.t.alive)) tgtCmdClose();
  const t = player.target;
  const box = $("target");
  if (!t || !(isMob(t) || isParty(t) || t.kind === "npc") || (isMob(t) && t.despawned)) { if (box.style.display !== "none") box.style.display = "none"; UI.ghostTarget = null; return; }
  if (box.style.display !== "block") box.style.display = "block";
  box.classList.remove("npc");
  let pct = 0;
  if (t !== UI.ghostTarget) { UI.ghostTarget = t; UI.hpGhost = isMob(t) || isParty(t) ? t.hp / t.maxHp : 0; }
  if (isMob(t)) {
    const [c, col] = conOf(t);
    setTxt($("tName"), t.name);
    $("tName").style.color = t.fam.nm ? "#ff8a65" : "#f0d9a8";
    setTxt($("tLv"), "");
    $("tTag").style.display = t.fam.nm ? "inline-block" : "none";
    pct = 100 * t.hp / t.maxHp;
    setTxt($("tHpT"), Math.ceil(pct) + "%");
    setW($("tTp"), 100 * t.tp / CONFIG.tpMax);
    setW($("tSwing"), t.state === "combat" && t.alive ? 100 * clamp(1 - t.swingTimer / t.delay, 0, 1) : 0);
    setTxt($("tToT"), t.target && t.alive && t.state === "combat" ? "→ " + (t.target === player ? "You" : t.target.name || "") : "");
    const w = $("tWarn");
    if (t.readying && t.alive) { w.style.display = "block"; setTxt(w, "⚠ Readying " + t.fam.tpMove.name + "!"); } else w.style.display = "none";
    let info = !t.alive ? "Defeated" : t.state === "combat" ? "In combat" : t.state === "return" ? "Returning" : "Idle";
    if (player.engaged && player.attackTarget === t && t.alive) info += dist(player, t) <= reach(player) ? " · in range" : " · too far";
    setTxt($("tInfo"), info);
    let ch = "";
    if (t.chain && S.time <= t.chain.closeAt) {
      const open = S.time >= t.chain.openAt;
      const left = open ? (t.chain.closeAt - S.time) / (t.chain.closeAt - t.chain.openAt) : 1;
      ch += '<span class="chip">⛓ ' + esc(t.chain.props.join("/")) + (open ? '<span class="w"><i style="width:' + (left * 100).toFixed(0) + '%"></i></span>' : " …") + "</span>";
    }
    if (t.burst && S.time <= t.burst.until) ch += '<span class="chip" style="color:' + ELEMENT_COLORS[t.burst.el[0]] + ";border-color:" + ELEMENT_COLORS[t.burst.el[0]] + '">✦ Burst ' + t.burst.el.join("/") + " " + fmt(t.burst.until - S.time) + "s</span>";
    if (t.buffs && t.buffs.dia) ch += '<span class="chip" style="color:#fff59d;border-color:#fff59d">☀ Dia</span>';
    for (const [k, col] of [["flash", "#fff59d"], ["slow", "#d7b46a"], ["paralyze", "#81d4fa"]]) if (t.buffs && t.buffs[k]) ch += '<span class="chip" style="color:' + col + ';border-color:' + col + '">' + BUFF_ICONS[k] + " " + BUFF_NAMES[k] + " " + Math.ceil(t.buffs[k].until - S.time) + "s</span>";
    setHtml($("tChain"), ch);
  } else if (isParty(t)) {
    setTxt($("tName"), t === player ? save.name || "You" : t.name);
    $("tName").style.color = "#9fd0ff";
    setTxt($("tLv"), jobTag(t) + " · Party");
    $("tTag").style.display = "none";
    pct = 100 * t.hp / t.maxHp;
    setTxt($("tHpT"), Math.ceil(t.hp) + " / " + t.maxHp);
    setW($("tTp"), 100 * t.tp / CONFIG.tpMax);
    setW($("tSwing"), t.casting ? 100 * (S.time - t.casting.start) / (t.casting.end - t.casting.start) : 0);
    setTxt($("tToT"), "");
    $("tWarn").style.display = "none";
    const bf = Object.keys(t.buffs).map(k => BUFF_NAMES[k]).join(", ");
    setTxt($("tInfo"), (t.alive ? (t.maxMp ? "MP " + Math.floor(t.mp) + "/" + t.maxMp : "Ready") : "KO") + (bf ? " · " + bf : ""));
    setHtml($("tChain"), "");
  } else {
    setTxt($("tName"), t.name);
    $("tName").style.color = "#ead9ae";
    setTxt($("tLv"), "NPC");
    box.classList.add("npc");
    $("tTag").style.display = "none";
    pct = 0;
    setTxt($("tHpT"), "");
    setW($("tTp"), 0); setW($("tSwing"), 0);
    setTxt($("tToT"), "");
    $("tWarn").style.display = "none";
    setTxt($("tInfo"), (questMarker(t) ? "❗ Has something for you · " : "") + (UI.phone ? "Tap again to talk" : "Tap again or press E to talk"));
    setHtml($("tChain"), "");
  }
  setW($("tHp"), pct);
  if (pct / 100 < UI.hpGhost) UI.hpGhost = Math.max(pct / 100, UI.hpGhost - 0.012); else UI.hpGhost = pct / 100;
  setW($("tHpG"), UI.hpGhost * 100);
}

function questProgress(id) {
  const st = save.quests[id];
  const ok = (n, m) => '<span class="' + (n >= m ? "ok" : "") + '">' + Math.min(n, m) + "/" + m + "</span>";
  if (st === "killed") return ["Report to " + QUESTS[id].giver];
  if (st !== "active") return [];
  if (id === "pouches") return ["Goblin Pouch " + ok(invCount("goblin_pouch"), 3)];
  if (id === "support") return player.lv < CONFIG.supportUnlockLevel ? ["Reach level " + CONFIG.supportUnlockLevel] : ["Bat Wing " + ok(invCount("bat_wing"), 2), "Worm Silk " + ok(invCount("worm_silk"), 1)];
  if (id === "riding") return ["Healing Herb " + ok(invCount("healing_herb"), 3), "Crystals " + ok(save.gil, 300)];
  if (id === "chieftain") return ["Defeat the Goblin Chieftain in the Goblin Den"];
  const q = QUESTS[id];
  if (q.kill) return [q.kill.name + " " + ok(save.qprog[id] || 0, q.kill.n)];
  if (q.items) return Object.keys(q.items).map(it => ITEMS[it].name + " " + ok(invCount(it), q.items[it]));
  return [];
}
function updateTracker() {
  const act = Object.keys(QUESTS).filter(id => save.quests[id] === "active" || save.quests[id] === "killed");
  const el = $("tracker");
  if (!act.length || (VIEW.settings && VIEW.settings.tracker === false)) { el.style.display = "none"; return; }
  el.style.display = "block";
  el.classList.toggle("min", UI.trackerMin);
  let h = '<h4 data-tr="1"><span>Quests (' + act.length + ")</span><span>" + (UI.trackerMin ? "▸" : "▾") + "</span></h4>";
  for (const id of act) h += '<div class="q"><b>' + esc(QUESTS[id].name) + "</b>" + questProgress(id).map(l => "<div>· " + l + "</div>").join("") + "</div>";
  setHtml(el, h);
}

function updateTopRight() {
  setTxt($("zoneName"), S.zone.name);
  const v = vana();
  const el = DAY_ELEMENTS[v.dayIndex];
  const wx = weatherNow(), wi = wx && WEATHER_INFO[wx];
  setHtml($("clock"), (wi ? '<span title="' + wi.name + '">' + (isNight() && wi.nightIcon ? wi.nightIcon : wi.icon) + "</span> " : isNight() ? "🌙 " : "☀️ ") + String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0") + ' <span class="el" style="color:' + ELEMENT_COLORS[el] + ";border-color:" + ELEMENT_COLORS[el] + '88">' + DAY_NAMES[v.dayIndex] + "</span>");
}

function zoneMapCanvas(zoneId) {
  if (UI.mapCache && UI.mapCache.id === zoneId) return UI.mapCache;
  const z = ZONES[zoneId];
  const k = 0.5;
  const c = document.createElement("canvas");
  c.width = Math.ceil(z.w * k); c.height = Math.ceil(z.h * k);
  const g = c.getContext("2d");
  g.scale(k, k);
  const pal = { town: ["#5b5440", "#7a6d52"], field: ["#3f5530", "#5a6d3b"], cave: ["#2d2925", "#3c3732"], house: ["#4a3a2a", "#5d4935"], crypt: ["#26252c", "#34333c"], snow: ["#b8c4cc", "#dfe7ec"] }[z.palette === "snow" ? "snow" : z.theme] || ["#333", "#444"];
  const grd = g.createRadialGradient(z.w / 2, z.h / 2, 50, z.w / 2, z.h / 2, Math.max(z.w, z.h) * 0.7);
  grd.addColorStop(0, pal[1]); grd.addColorStop(1, pal[0]);
  g.fillStyle = grd; g.fillRect(0, 0, z.w, z.h);
  const rnd = seeded(hashStr(zoneId + "map"));
  for (let i = 0; i < 260; i++) { g.fillStyle = "rgba(0,0,0," + (rnd() * 0.12).toFixed(3) + ")"; g.beginPath(); g.arc(rnd() * z.w, rnd() * z.h, 6 + rnd() * 30, 0, 7); g.fill(); }
  if (z.plaza) { g.fillStyle = "#9b8c6c"; g.beginPath(); g.arc(z.plaza.x, z.plaza.y, z.plaza.r, 0, 7); g.fill(); }
  g.lineCap = "round"; g.lineJoin = "round";
  for (const p of z.paths || []) {
    g.strokeStyle = z.theme === "cave" ? "#55493c" : z.theme === "crypt" ? "#4a4852" : "#a8946a"; g.lineWidth = p.w;
    g.beginPath(); p.pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  }
  for (const w of z.water || []) {
    const wg = g.createRadialGradient(w.x, w.y, 4, w.x, w.y, w.r);
    wg.addColorStop(0, z.palette === "snow" ? "#cfe6f2" : "#3d7fb8"); wg.addColorStop(1, z.palette === "snow" ? "#9cc4da" : "#2a5b8c");
    g.fillStyle = wg; g.beginPath(); g.arc(w.x, w.y, w.r, 0, 7); g.fill();
    g.strokeStyle = "rgba(190,230,255,.5)"; g.lineWidth = 3; g.stroke();
  }
  for (const h of z.houses || []) {
    const w = h.rot ? h.h : h.w, hh = h.rot ? h.w : h.h;
    g.fillStyle = "#4a2f22"; g.fillRect(h.x - w / 2, h.y - hh / 2, w, hh);
    g.strokeStyle = "#2a1a12"; g.lineWidth = 4; g.strokeRect(h.x - w / 2, h.y - hh / 2, w, hh);
  }
  for (const s of z.stalls || []) { g.fillStyle = s.color; g.fillRect(s.x - 26, s.y - 14, 52, 28); }
  for (const [x, y] of z.lamps || []) { g.fillStyle = "#ffd77a"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); }
  for (const [x, y] of z.torches || []) { g.fillStyle = "#ff9a3d"; g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }
  for (const b of z.barriers || []) { g.fillStyle = "#8a7a4a"; g.fillRect(b.x, b.y, b.w, b.h); }
  for (const [x, y] of z.pillars || []) { g.fillStyle = "#6a6872"; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); }
  for (const r of z.walls || []) {
    g.fillStyle = z.theme === "cave" ? "#151310" : z.theme === "crypt" ? "#121218" : "#4d4a40"; g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 14;
    g.beginPath(); g.roundRect ? g.roundRect(r.x, r.y, r.w, r.h, 40) : g.rect(r.x, r.y, r.w, r.h); g.fill(); g.stroke();
  }
  if (z.ruins) {
    g.strokeStyle = "#b9b2a0"; g.lineWidth = 26; g.lineCap = "butt";
    for (const [x1, y1, x2, y2] of z.ruins.walls) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    g.fillStyle = "#cfc8b4";
    for (const [x, y] of z.ruins.pillars) { g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); }
    g.lineCap = "round";
  }
  if (z.theme === "town") { g.strokeStyle = "#3b2a1c"; g.lineWidth = 10; g.strokeRect(20, 20, z.w - 40, z.h - 40); }
  else { g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 30; g.strokeRect(0, 0, z.w, z.h); }
  for (const e of z.exits || []) { g.fillStyle = "rgba(241,207,115,.85)"; g.fillRect(e.x, e.y, e.w, e.h); }
  UI.mapCache = { id: zoneId, c, k, z };
  return UI.mapCache;
}

function drawMinimap() {
  const cv = $("minimap");
  const W = cv.width, R = W / 2;
  const g = cv.getContext("2d");
  const m = zoneMapCanvas(S.zoneId);
  const view = S.zone.indoor ? 240 : 430;
  const sc = R / view;
  const yaw = VIEW.yaw;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, W);
  g.fillStyle = "#0b0d14"; g.fillRect(0, 0, W, W);
  g.save();
  g.translate(R, R);
  g.rotate(-Math.PI / 2 - yaw);
  g.scale(sc, sc);
  g.translate(-player.x, -player.y);
  g.drawImage(m.c, 0, 0, m.z.w, m.z.h);
  const dot = (x, y, r, col, ring) => { g.beginPath(); g.arc(x, y, r / sc, 0, 7); g.fillStyle = col; g.fill(); if (ring) { g.lineWidth = 2 / sc; g.strokeStyle = ring; g.stroke(); } };
  for (const n of S.npcs) {
    if (n.away) continue;
    if (NPCS[n.id] && NPCS[n.id].crystal) { g.save(); g.translate(n.x, n.y); g.rotate(Math.PI / 4); g.fillStyle = "#7ff3ff"; const s = 7 / sc; g.fillRect(-s / 2, -s / 2, s, s); g.restore(); }
    else if (n.prop === "brazier") dot(n.x, n.y, 4, brazierLit(n.element) ? ELEMENT_COLORS[n.element] : "#555", "#000");
    else if (n.prop === "chest") dot(n.x, n.y, 4, chestState(n) === "closed" ? "#ffd54f" : "#7a6a3a", "#000");
    else if (n.prop === "gather") dot(n.x, n.y, 4, { mining: "#b0bec5", logging: "#a1887f", harvesting: "#aed581" }[n.gtype], "#000");
    else if (n.prop) dot(n.x, n.y, 3.5, "#bbb", "#000");
    else dot(n.x, n.y, 5, questMarker(n) ? "#ffd54f" : "#ead9ae", "#000");
  }
  for (const mb of S.mobs) {
    if (!mb.alive || mb.despawned) continue;
    if (dist(mb, player) > 360 && player.target !== mb && !(mb.state === "combat" && mb.enmity && [...mb.enmity.keys()].some(isParty))) continue;
    dot(mb.x, mb.y, mb.fam.nm ? 6 : 4, mb.passive ? "#c8b48a" : "#e07a5f", mb.fam.nm ? "#ff4d6d" : mb.state === "combat" ? "#ff2a2a" : "#000");
  }
  if (S.race && RACE.checkpoints[S.race.next]) { const cp = RACE.checkpoints[S.race.next]; dot(cp.x, cp.y, 9, "rgba(255,213,79,.85)", "#000"); }
  for (const p of S.party) if (p !== player) dot(p.x, p.y, 4.5, p.alive ? "#62b6ff" : "#555", "#001b33");
  if (S.moveTarget) { g.strokeStyle = "#fff"; g.lineWidth = 2 / sc; const s = 5 / sc; g.beginPath(); g.moveTo(S.moveTarget.x - s, S.moveTarget.y - s); g.lineTo(S.moveTarget.x + s, S.moveTarget.y + s); g.moveTo(S.moveTarget.x + s, S.moveTarget.y - s); g.lineTo(S.moveTarget.x - s, S.moveTarget.y + s); g.stroke(); }
  g.restore();
  g.save();
  g.translate(R, R);
  g.rotate((player.face || 0) - yaw);
  g.beginPath(); g.moveTo(11, 0); g.lineTo(-7, -7); g.lineTo(-3, 0); g.lineTo(-7, 7); g.closePath();
  g.fillStyle = "#fff"; g.fill(); g.lineWidth = 1.5; g.strokeStyle = "#000"; g.stroke();
  g.restore();
  const vg = g.createRadialGradient(R, R, R * 0.7, R, R, R);
  vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = vg; g.fillRect(0, 0, W, W);
  const na = -Math.PI / 2 - yaw - Math.PI / 2;
  const nEl = $("mmN"), rr = $("mmWrap").clientWidth / 2 - 10;
  nEl.style.transform = "translate(" + (Math.cos(na) * rr).toFixed(1) + "px," + (Math.sin(na) * rr).toFixed(1) + "px)";
}

function exploredFor(id) {
  if (!save.explored || typeof save.explored !== "object") save.explored = {};
  const z = ZONES[id];
  const cols = Math.ceil(z.w / 50), rows = Math.ceil(z.h / 50);
  let s = save.explored[id];
  if (typeof s !== "string" || s.length !== cols * rows) s = save.explored[id] = "0".repeat(cols * rows);
  return { s, cols, rows };
}
function revealFog() {
  const f = exploredFor(S.zoneId);
  const r = S.zone.indoor ? 1000 : 260;
  const arr = f.s.split("");
  let ch = false;
  const c0 = Math.max(0, Math.floor((player.x - r) / 50)), c1 = Math.min(f.cols - 1, Math.floor((player.x + r) / 50));
  const r0 = Math.max(0, Math.floor((player.y - r) / 50)), r1 = Math.min(f.rows - 1, Math.floor((player.y + r) / 50));
  for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
    const i = y * f.cols + x;
    if (arr[i] === "1") continue;
    if (Math.hypot(x * 50 + 25 - player.x, y * 50 + 25 - player.y) <= r) { arr[i] = "1"; ch = true; }
  }
  if (ch) save.explored[S.zoneId] = arr.join("");
}

function toast(icon, title, text, cls) {
  const box = $("toasts");
  const t = document.createElement("div");
  t.className = "toast glass" + (cls ? " " + cls : "");
  t.innerHTML = '<span class="ti">' + icon + "</span><div><b>" + esc(title) + "</b>" + esc(text || "") + "</div>";
  box.appendChild(t);
  while (box.children.length > 4) box.removeChild(box.firstChild);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 450); }, 3600);
}
function banner(big, small, chips) {
  const b = $("banner");
  b.innerHTML = '<div class="big">' + esc(big) + '</div><div class="sm">' + esc(small || "") + "</div>" + (chips && chips.length ? '<div class="un">' + chips.map(c => "<span>" + c + "</span>").join("") + "</div>" : "");
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
}
function zoneTitle(name, sub) {
  const z = $("zoneTitle");
  z.innerHTML = (sub ? "<small>" + esc(sub) + "</small>" : "") + esc(name);
  z.classList.remove("show"); void z.offsetWidth; z.classList.add("show");
}

function gameConfirm(title, text, onYes, opts) {
  const box = $("confirmBox");
  if (!box) { onYes(); return; }
  opts = opts || {};
  box.querySelector(".cbT").textContent = title;
  box.querySelector(".cbB").textContent = text;
  const yes = box.querySelector(".yes"), no = box.querySelector(".no");
  yes.textContent = opts.yes || "OK";
  no.textContent = opts.no || "Cancel";
  yes.className = "yes " + (opts.danger ? "danger" : "pri");
  box.classList.add("on");
  S.keys = {};
  const close = () => { box.classList.remove("on"); yes.onclick = no.onclick = null; UI.confirmOpen = false; };
  UI.confirmOpen = true;
  yes.onclick = () => { close(); if (typeof sfx === "function") sfx("select"); onYes(); };
  no.onclick = () => { close(); if (typeof sfx === "function") sfx("close"); if (opts.onNo) opts.onNo(); };
  if (typeof sfx === "function") sfx("open");
}

function tgtCmdOpen(t) {
  if (!isMob(t) || !t.alive) { tgtCmdClose(); return; }
  UI.cmd = { t, page: "root", info: "" };
  renderTgtCmd();
}

function tgtCmdClose() {
  UI.cmd = null;
  const el = $("tCmd");
  if (el) { el.classList.remove("on"); el.innerHTML = ""; }
}

function inspectText(t) {
  const [c] = conOf(t);
  const tough = { "Too Weak": "It seems too weak to be worthwhile.", "Easy Prey": "It seems like easy prey.", "Decent Challenge": "It seems like a decent challenge.", "Even Match": "It seems like an even match.", "Tough": "It looks tough.", "Very Tough": "It looks very tough.", "Incredibly Tough": "It looks incredibly tough." }[c] || "It is hard to judge.";
  const mood = t.passive || !t.fam.aggro ? "It looks peaceful unless provoked." : "It looks hostile.";
  return tough + " " + mood + (t.fam.nm ? " It is a notorious monster!" : "");
}

function renderTgtCmd() {
  const el = $("tCmd"), c = UI.cmd;
  if (!el || !c) return;
  const t = c.t;
  let h = "";
  const btn = (key, label, cls) => '<button data-tc="' + key + '"' + (cls ? ' class="' + cls + '"' : "") + ">" + label + "</button>";
  if (c.page === "root") {
    const eng = player.engaged && player.attackTarget === t;
    h += '<div class="tcHead"><span>' + esc(t.name) + "</span>" + btn("close", "✕") + "</div>";
    h += btn("attack", eng ? "✋ Disengage" : "⚔ Fight", "pri") + btn("ma", "✦ Magic") + btn("ja", "⚡ Abilities") + btn("inspect", "🔍 Inspect");
    if (c.info) h += '<div class="tcInfo">' + esc(c.info) + "</div>";
  } else {
    const acts = actionList(player).filter(a => c.page === "ma" ? a.kind === "ma" && SPELLS[a.id].target === "enemy" : a.kind === "ws" || (a.kind === "ja" && ABILITIES[a.id].target === "enemy"));
    c.acts = acts;
    h += '<div class="tcHead"><span>' + (c.page === "ma" ? "Magic" : "Abilities") + " · " + esc(t.name) + "</span>" + btn("back", "◂") + "</div>";
    if (!acts.length) h += '<div class="tcInfo">' + (c.page === "ma" ? "You know no spells to use on an enemy." : "You have no abilities to use on an enemy.") + "</div>";
    acts.forEach((a, i) => { const why = checkAction(player, a, t); h += btn("act" + i, actIcon(a) + " " + esc(actName(a)), why ? "off" : ""); });
  }
  el.innerHTML = h;
  el.classList.add("on");
}

function onTgtCmd(key) {
  const c = UI.cmd;
  if (!c) return;
  const t = c.t;
  sfx("select");
  if (key === "close") { tgtCmdClose(); return; }
  if (key === "back") { c.page = "root"; renderTgtCmd(); return; }
  if (key === "ma" || key === "ja") { c.page = key; renderTgtCmd(); return; }
  if (key === "inspect") { c.info = inspectText(t); log("The " + t.name + ": " + c.info, "sys"); renderTgtCmd(); return; }
  if (key === "attack") { player.target = t; toggleEngage(true); tgtCmdClose(); return; }
  if (key.startsWith("act")) {
    const a = c.acts && c.acts[+key.slice(3)];
    if (!a) return;
    player.target = t;
    playerAct(a);
    tgtCmdClose();
  }
}

function uiEvent(type, d) {
  if (type === "target") { tgtCmdOpen(d); return; }
  if (type === "ach") { toast(d.icon, "Achievement unlocked", d.name + (d.gil ? " · +" + d.gil + " 💠" : ""), "r-epic"); return; }
  if (type === "bond") { toast("💞", "Bond level " + d.lv, MERCS[d.id].name, "r-rare"); return; }
  if (type === "bf") { toast("🔱", "Victory!", d.prize ? ITEMS[d.prize].name : "The chapel is quiet", "r-epic"); return; }
  if (type === "race") { UI.mmForce = true; return; }
  if (type === "pool") { toast("🎲", "Treasure pool", ITEMS[d.id].name, "r-rare"); return; }
  if (type === "story") { banner("CHAPTER COMPLETE", d.name, rewardChips(d.reward)); return; }
  if (type === "guildrank") { banner(GUILD_RANKS[d.rank][0].toUpperCase() + " RANK", "Adventurers' Guild", ["🛒 New guild rewards"]); return; }
  if (type === "beast") { toast("📖", "Bestiary", d.name, "r-uncommon"); return; }
  if (type === "item") {
    const it = ITEMS[d.id];
    if (!it) return;
    const r = itemRarity(d.id);
    toast(it.icon || "📦", r === "epic" ? "Epic item!" : r === "rare" ? "Rare item!" : r === "uncommon" ? "Uncommon item" : "Obtained", (d.n > 1 ? d.n + " × " : "") + it.name, "r-" + r);
  }
  if (type === "landmark") { toast("🧭", "Landmark discovered", d.name + (player.lv < CONFIG.levelCap ? " · +" + d.xp + " XP" : ""), "r-rare"); sfx("unlock"); }
}

function watchProgress() {
  const w = UI.watch;
  const j = save.mainJob;
  const lv = save.jobs[j].lv;
  if (!w) { if (!save.discovered) save.discovered = []; if (!save.discovered.includes(S.zoneId)) save.discovered.push(S.zoneId); UI.watch = { job: j, lv, quests: Object.assign({}, save.quests), maxHp: player.maxHp, maxMp: player.maxMp, zone: S.zoneId, gil: save.gil, mount: save.mountLicense, sup: save.supportUnlocked }; return; }
  if (w.job === j && lv > w.lv) {
    UI.leveledAt = performance.now();
    const chips = [];
    const dh = player.maxHp - w.maxHp, dm = player.maxMp - w.maxMp;
    if (dh > 0) chips.push("❤ HP +" + dh);
    if (dm > 0) chips.push("💧 MP +" + dm);
    const before = UI.actKeys || [];
    for (const a of actionList(player)) if (!before.includes(a.kind + ":" + a.id)) chips.push(actIcon(a) + " " + esc(actName(a)));
    if (lv === CONFIG.supportUnlockLevel && !save.supportUnlocked) chips.push("💬 Tobin wants a word");
    if (lv === 5 && !save.mountLicense) chips.push("💬 Ysolde wants a word");
    if (lv === 6 && Object.keys(ADVANCED_JOBS).some(j => !jobUnlocked(j))) chips.push("💬 Tobin can teach advanced jobs");
    if (lv >= CONFIG.levelCap) chips.push("⭐ Level cap reached");
    banner("LEVEL " + lv, JOBS[j].name, chips);
  }
  for (const id in QUESTS) {
    const a = w.quests[id], b = save.quests[id];
    if (a === b) continue;
    if (b === "active" && a === "none") toast("📜", "Quest accepted", QUESTS[id].name);
    else if (b === "killed") toast("⚔", "Objective complete", "Report to " + QUESTS[id].giver);
    else if (b === "done") { banner("QUEST COMPLETE", QUESTS[id].name, rewardChips(QUESTS[id].reward)); }
  }
  if (save.mountLicense && !w.mount) toast("🦖", "Mount unlocked", "Press R or the Mount button in open country.");
  if (save.supportUnlocked && !w.sup) toast("🎓", "Support jobs unlocked", "Talk to Tobin to set one.");
  if (S.zoneId !== w.zone) {
    const first = !(save.discovered || []).includes(S.zoneId);
    if (!save.discovered) save.discovered = [];
    if (first) { save.discovered.push(S.zoneId); toast("🧭", "Discovered", S.zone.name); }
    zoneTitle(S.zone.name, first ? "Discovered" : "");
  }
  Object.assign(w, { job: j, lv, quests: Object.assign({}, save.quests), maxHp: player.maxHp, maxMp: player.maxMp, zone: S.zoneId, mount: save.mountLicense, sup: save.supportUnlocked });
}
function rewardChips(r) {
  const out = [];
  if (!r) return out;
  if (r.xp) out.push("✨ " + r.xp + " XP");
  if (r.gil) out.push("💠 " + r.gil + " crystals");
  if (r.item) out.push((ITEMS[r.item].icon || "📦") + " " + esc(ITEMS[r.item].name) + (r.qty > 1 ? " ×" + r.qty : ""));
  if (r.items) for (const [id, n] of r.items) out.push((ITEMS[id].icon || "📦") + " " + esc(ITEMS[id].name) + (n > 1 ? " ×" + n : ""));
  if (r.unlock) out.push(JOBS[r.unlock].icon + " " + JOBS[r.unlock].name + " unlocked");
  return out;
}

function updateBottom() {
  const j = save.jobs[save.mainJob];
  setTxt($("lvl"), "Lv " + player.lv + " " + player.job + (player.sub ? "/" + player.sub + Math.floor(player.lv / 2) : ""));
  const need = xpNeed(j.lv);
  setW($("xpfill"), need ? 100 * j.xp / need : 100);
  if ($("pfXp")) setW($("pfXp"), need ? 100 * j.xp / need : 100);
  setTxt($("xpt"), need ? j.xp + " / " + need + " XP (" + Math.floor(100 * j.xp / need) + "%)" : "Level cap");
  setTxt($("crystals"), "💠 " + save.gil);
  const ci = chainInfo();
  const cc = $("chainCt");
  setTxt(cc, ci ? "⛓ " + (ci.n > 0 ? "Chain " + ci.n + " · " : "") + "next +" + Math.round(ci.next * CONFIG.chainStep * 100) + "% · " + Math.ceil(ci.left) + "s" : "");
  cc.title = ci ? "Defeat another monster within " + Math.ceil(ci.left) + " s for a " + Math.round(ci.next * CONFIG.chainStep * 100) + "% XP bonus." : "";
  const cb = $("castBar");
  if (player.casting) {
    cb.style.display = "block";
    const c = player.casting;
    setTxt($("castName"), (c.sp ? c.sp.name : "Casting") + (c.t && c.t !== player ? " → " + (c.t.name || "") : "") + "…");
    setW($("castFill"), 100 * (S.time - c.start) / (c.end - c.start));
  } else if (player.synth) {
    cb.style.display = "block";
    const c = player.synth;
    setTxt($("castName"), "Synthesizing " + ITEMS[c.r.out].name + "…");
    setW($("castFill"), 100 * (S.time - c.start) / (c.end - c.start));
  } else cb.style.display = "none";
  const eng = $("btnEngage");
  eng.classList.toggle("on", player.engaged);
  setTxt($("engLbl"), player.engaged ? (isMob(player.target) && player.target !== player.attackTarget ? "Switch" : "Disengage") : "Attack");
  const nn = nearNpc();
  const talk = $("btnTalk");
  talk.disabled = !nn;
  talk.classList.toggle("hot", !!nn && questMarker(nn));
  setTxt($("talkLbl"), nn ? (NPCS[nn.id] && NPCS[nn.id].crystal ? "Crystal" : nn.name.split(/[ ,]/)[0].slice(0, 8)) : "Talk");
  const bm = $("btnMount");
  bm.classList.toggle("has", !!save.mountLicense);
  setTxt($("mountLbl"), player.mounted ? "Dismount" : "Mount");
}

function updatePool() {
  const el = $("pool");
  if (!el) return;
  const p = S.pool || [];
  if (!p.length) { if (el.classList.contains("on")) { el.classList.remove("on"); el.innerHTML = ""; UI.poolSig = ""; } return; }
  const sig = p.map(e => e.seq + ":" + e.mine + ":" + Math.ceil(e.until - S.time)).join("|");
  if (sig === UI.poolSig) return;
  UI.poolSig = sig;
  el.classList.add("on");
  el.innerHTML = '<div class="ph">🎲 TREASURE POOL</div>' + p.map(e => '<div class="pe"><span>' + (ITEMS[e.id].icon || "📦") + "</span><b>" + esc(ITEMS[e.id].name) + " <small>" + Math.max(0, Math.ceil(e.until - S.time)) + "s</small></b>" + (e.mine == null ? '<button data-lot="' + e.seq + '" class="pri">Lot</button><button data-pass="' + e.seq + '">Pass</button>' : "<small>" + (e.mine ? "Lot " + e.mine : "Passed") + "</small>") + "</div>").join("");
}

function updateFish() {
  const el = $("fishBox");
  if (!el) return;
  const f = S.fish;
  const key = f ? f.state : "";
  if (key === UI.fishKey) return;
  UI.fishKey = key;
  el.classList.toggle("on", !!f);
  el.classList.toggle("bite", key === "bite");
  el.innerHTML = !f ? "" : key === "bite" ? '<b>🎣 Something\'s biting!</b><button data-fish="reel" class="pri">Reel in! (Space)</button>' : '<span>🎣 Waiting for a bite…</span><button data-fish="stop">Stop</button>';
}

function updateRace() {
  const el = $("raceBox");
  if (!el) return;
  const r = S.race, b = S.bf && !S.bf.won ? S.bf : null;
  el.classList.toggle("on", !!(r || b));
  if (b) { const left = Math.max(0, b.until - S.time); setHtml(el, "🔱 <b>" + Math.floor(left / 60) + ":" + String(Math.floor(left % 60)).padStart(2, "0") + "</b> <span class=\"sub\">· Defeat the Tidebound Priest</span>"); return; }
  if (!r) return;
  const t = S.time - r.t0, cp = RACE.checkpoints[r.next];
  const d = cp ? Math.round(Math.hypot(player.x - cp.x, player.y - cp.y) / 20) : 0;
  setHtml(el, '🏁 <b>' + t.toFixed(1) + 's</b> <span class="sub">/ ' + RACE.limit + "s</span> · " + (cp ? "Checkpoint " + (r.next + 1) + "/" + RACE.checkpoints.length + ": " + esc(cp.name) + " · " + d + " m" : ""));
}

function updateHud(dt) {
  updatePool();
  updateRace();
  updateFish();
  UI.phone = window.innerWidth <= 720;
  updateParty();
  updateTarget();
  updateBottom();
  watchProgress();
  updateActionBar();
  const now = performance.now();
  if (now - UI.lastMini > 60) { UI.lastMini = now; drawMinimap(); updateTopRight(); updateTracker(); }
  if (now - UI.lastFog > 500) { UI.lastFog = now; revealFog(); }
  if (S.modal) updateMenu(now);
}

function initHud() {
  $("fishBox").addEventListener("click", e => { const b = e.target.closest("[data-fish]"); if (!b) return; e.stopPropagation(); if (b.dataset.fish === "reel") reelFish(); else stopFishing("You reel in your line."); UI.fishKey = null; });
  for (const ev of ["pointerdown", "touchstart", "mousedown"]) $("fishBox").addEventListener(ev, e => e.stopPropagation(), { passive: true });
  $("pool").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; e.stopPropagation(); if (b.dataset.lot) lotPool(+b.dataset.lot, false); else if (b.dataset.pass) lotPool(+b.dataset.pass, true); UI.poolSig = ""; });
  for (const ev of ["pointerdown", "touchstart", "mousedown"]) $("pool").addEventListener(ev, e => e.stopPropagation(), { passive: true });
  $("tCmd").addEventListener("click", e => { const b = e.target.closest("[data-tc]"); if (b) { e.stopPropagation(); onTgtCmd(b.dataset.tc); } });
  for (const ev of ["pointerdown", "touchstart", "mousedown"]) $("tCmd").addEventListener(ev, e => e.stopPropagation(), { passive: true });
  $("chatTabs").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "chatTog") { const c = $("chat"); c.classList.toggle("min"); b.textContent = c.classList.contains("min") ? "▴" : "▾"; $("log").scrollTop = 1e9; sfx("click"); return; }
    UI.chatFilter = b.dataset.f;
    $("chatTabs").querySelectorAll("button[data-f]").forEach(x => x.classList.toggle("on", x === b));
    $("log").className = "glass" + (UI.chatFilter === "all" ? "" : " f-" + UI.chatFilter);
    $("log").scrollTop = 1e9;
    sfx("tab");
  });
  if (window.innerWidth <= 720) { $("chat").classList.add("min"); $("chatTog").textContent = "▴"; }
  $("tracker").addEventListener("click", e => { if (e.target.closest("[data-tr]")) { UI.trackerMin = !UI.trackerMin; updateTracker(); sfx("click"); } else openMenu("quests"); });
  $("pgUp").onclick = () => setPage(UI.page - 1);
  $("pgDn").onclick = () => setPage(UI.page + 1);
  $("mmWrap").onclick = () => openMenu("map");
  $("btnMenu").onclick = () => S.modal ? closeModal() : openMenu("character");
  const ci = $("chatIn");
  UI.cmdHist = []; UI.cmdIdx = 0;
  ci.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
      const v = ci.value.trim();
      ci.value = "";
      if (v) { UI.cmdHist.push(v); if (UI.cmdHist.length > 30) UI.cmdHist.shift(); UI.cmdIdx = UI.cmdHist.length; runCommand(v); }
      ci.blur();
    } else if (e.key === "Escape") { ci.value = ""; ci.blur(); }
    else if (e.key === "ArrowUp") { if (UI.cmdIdx > 0) { UI.cmdIdx--; ci.value = UI.cmdHist[UI.cmdIdx]; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (UI.cmdIdx < UI.cmdHist.length) { UI.cmdIdx++; ci.value = UI.cmdHist[UI.cmdIdx] || ""; } e.preventDefault(); }
  });
  ci.addEventListener("focus", () => { S.keys = {}; });

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const mm = $("minimap");
  mm.width = mm.height = Math.round(150 * dpr * 1.2);
  initMenu();
}
