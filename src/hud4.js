const UI = {
  page: 0, partyKey: "", slots: [], slotKey: "", lastMini: 0, mapCache: null, chatFilter: "all", toastQ: [],
  watch: null, hpGhost: 0, ghostTarget: null, actKeys: null, actCtx: "", trackerMin: false, slotText: [], phone: false, lastFog: 0,
  prevZone: null, menuSig: "", menuSigAt: 0, sel: null, pick: null, filter: "all", cmp: null, pv: null, frameT: 0
};
const ACT_ICON = { last_resort: "🩸", soulfire: "🔥", blood_blade: "🗡️", encore: "🎶", steal: "🫳", sneak_attack: "🗡️", flee: "💨", boost: "👊", focus: "🎯", chakra: "🧘", sharpshot: "🎯", barrage: "🏹", shadowbind: "⛓️", release: "🌀", blood_pact: "🔮", siphon: "💠", provoke: "❗", berserk: "💢", divine_seal: "✚", elemental_seal: "✦", sentinel: "🛡️", shield_bash: "💥", convert: "🔄" };
const SPELL_ICON = { cure: "✚", cure2: "✚", dia: "☀", banish: "✴", protect: "🔰", shell: "🔮", slow: "🐌", paralyze: "🧊", stone: "◆", water: "💧", aero: "🌀", fire: "🔥", blizzard: "❄", poison: "☠️", bio: "☣", drain: "🩸", aspir: "🌀", blind: "🕶", bind: "⛓", sleep: "💤", knights_minne: "🛡", valor_minuet: "🎵", armys_paeon: "💚", armys_paeon2: "💚", sword_madrigal: "🎯", foe_lullaby: "💤", carbuncle: "💎", silence: "🤐", fire_spirit: "🔥", ice_spirit: "❄", air_spirit: "🌪️", earth_spirit: "◆", thunder_spirit: "⚡", water_spirit: "💧", light_spirit: "✨", dark_spirit: "🌑" };
const KIND_ORDER = { use: 0, equip: 1, crystal: 2, mat: 3, tool: 4, furniture: 5 };
const TAB_INFO = {
  character: ["Character", "👤", "C"], inventory: ["Inventory", "🎒", "I"], skills: ["Skills", "📈", "K"], actions: ["Hotkeys", "✨", "B"],
  quests: ["Quests", "📜", "J"], map: ["Map", "🗺️", "M"], settings: ["Config", "⚙️", ""], system: ["System", "💾", ""],
  shop: ["Shop", "💠", ""], job: ["Jobs", "🎓", ""], mercs: ["Mercenaries", "🛡️", ""], help: ["Help", "❓", "H"], updates: ["Updates", "📰", ""],
  craft: ["Crafting", "⚒️", "N"], storage: ["Storage", "📦", ""], home: ["Arrange", "🏠", ""], furnishings: ["Furnishings", "🪑", ""], credits: ["Credits", "🎬", ""],
  party: ["Party", "👥", "P"], forge: ["Forge", "🔨", ""], stable: ["Stable", "🦖", ""], board: ["Trade Board", "📋", ""], admin: ["Admin", "🛡️", ""], trade: ["Trade", "🤝", ""], equipment: ["Equipment", "🛡️", "G"], magic: ["Magic", "✦", ""], abilities: ["Abilities", "⚡", ""], keyitems: ["Key Items", "🗝️", ""], social: ["Social", "💬", ""], database: ["Database", "📚", "Y"], pets: ["Pets", "🐾", ""], auction: ["Auction House", "⚖️", ""], guild: ["Adventurers' Guild", "⚔️", ""], achievements: ["Achievements", "🏆", "O"]
};
const MAIN_TABS = ["character", "equipment", "inventory", "skills", "actions", "party", "social", "craft", "quests", "database", "achievements", "map", "settings"];
const TAB_ALIAS = { items: "inventory", status: "character", equip: "character" };

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function reportError(e, where) {
  console.error(where, e);
  const key = where + ":" + (e && e.message);
  UI.errSeen = UI.errSeen || {};
  if (UI.errSeen[key]) return;
  UI.errSeen[key] = 1;
  const at = String((e && e.stack) || "").split("\n")[1] || "";
  try { log("⚠ Game error (" + where + "): " + (e && e.message) + " " + at.trim().slice(0, 120) + ". The game kept running; please tell the developer.", "foe"); } catch (e2) {}
}
function log(msg, c) {
  const el = $("log");
  if (!el) return;
  const near = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  const d = document.createElement("div");
  d.className = logTone(msg, c || "sys");
  d.textContent = msg;
  if (typeof S !== "undefined") { UI.logRows = logFull(); UI.logAt = S.time || 0; }
  el.appendChild(d);
  while (el.children.length > 250) el.removeChild(el.firstChild);
  if (near || $("chat").classList.contains("min")) el.scrollTop = el.scrollHeight;
}
function logTone(msg, c) {
  if (["say", "pchat", "tell", "ls", "shout", "yell", "npc", "loot", "sc"].includes(c)) return c;
  const m = String(msg);
  if (/^You can'?t|^You cannot|^Not enough|^Can'?t |too far|out of range|is full|Unable|failed to|^You need|^There'?s no/i.test(m)) return "warn";
  if (/defeated|has fallen|is KO|knocked out|(is|are) (poisoned|silenced|paralyzed|slowed|asleep|stunned|bound|blinded)|wears? off and/i.test(m) && c !== "you") return "warn";
  if (/\(critical\)|critical hit|Magic Burst|Skillchain|\(\d+ TP\)|learn the weapon skill/i.test(m)) return "ws";
  if (/\b(recover|recovers|restore|restores|regain|regains)\b[^.]*\b\d+ MP\b|\bMP\b[^.]*\brestored/i.test(m)) return "mpc";
  if (/\b(recover|recovers|restore|restores|heal|heals)\b[^.]*\b\d+ HP\b/i.test(m)) return "heal";
  if (/gains? the effect|is protected|feels? (stronger|faster|steadier|sharper)|\b(Protect|Shell|Haste|Regen|Refresh|Berserk|Warcry|Sentinel|Focus|Boost|Hasso|Valor Roll)\b.*\b(gain|gains|cast|casts|use|uses)\b/i.test(m) && c !== "foe") return "buff";
  if (/\bmiss(es)?\b|resists?\b|no effect/i.test(m)) return "missc";
  if (c === "foe") return "hurt";
  if (c === "you" || c === "ally" || c === "party" || c === "cast" || c === "skill") return c === "party" ? "party" : "dmg";
  return c;
}
function clearLog() { $("log").innerHTML = ""; }
function showKO(on) { $("ko").style.display = on ? "flex" : "none"; }

function openDialog(who, text, opts) {
  opts = opts || [];
  const offer = opts.some(o => /^(Accept|I'll handle him|I'll get them)$/.test(o.label));
  const paras = String(text || "").split(/\n+/).filter(Boolean);
  { const sp = S.npcs && S.npcs.find(n => n.name === who || (n.name && who && n.name.split(",")[0] === who.split(",")[0])); if (sp) sp.talkUntil = S.time + Math.min(6, 0.6 + String(text || "").length * 0.035); }
  if (!S.dialog || S.dialog.text !== text) paras.forEach((p, i) => log((i ? "  " : who + " : ") + p, "npc"));
  UI.logRows = logFull(); UI.logAt = S.time;
  if (opts.length === 1 && /^(Trade|Shop|Buy)\b/.test(opts[0].label)) { S.dialog = null; $("dialog").style.display = "none"; opts[0].fn(); return; }
  if (!opts.length) { closeDialog(); return; }
  const story = opts.length === 1 && /^(Next|Continue)$/.test(opts[0].label);
  const q = story ? "" : offer ? "Will you accept this quest?" : (paras.length && /\?$/.test(paras[paras.length - 1]) ? paras[paras.length - 1].split(/(?<=[.!])\s+/).pop() : "What will you do?");
  S.dialog = { who, text, opts, sel: 0 };
  $("dlgWho").textContent = "";
  $("dlgText").textContent = q;
  const all = story ? opts.slice() : opts.concat([{ label: offer ? "Decline" : "Never mind", fn: () => { if (offer) log("You decline for now.", "sys"); closeDialog(); } }]);
  S.dialog.all = all;
  renderDlgOpts();
  $("dialog").style.display = "block";
  sfx("open");
}
function promptChoice(q, opts) {
  S.dialog = { who: "", text: "", opts, sel: 0, all: opts.concat([{ label: "Never mind", fn: closeDialog }]) };
  $("dlgWho").textContent = "";
  $("dlgText").textContent = q || "";
  renderDlgOpts();
  $("dialog").style.display = "block";
  sfx("open");
}
function renderDlgOpts() {
  const d = S.dialog, box = $("dlgOpts");
  if (!d || !box) return;
  box.innerHTML = "";
  d.all.forEach((o, i) => {
    const b = document.createElement("button");
    b.className = "dOpt" + (i === d.sel ? " sel" : "");
    b.innerHTML = '<span class="cur">➤</span>' + esc(o.label);
    b.onmouseenter = () => { if (S.dialog && S.dialog.sel !== i) { S.dialog.sel = i; renderDlgOpts(); } };
    b.onclick = () => { sfx("select"); o.fn(); };
    box.appendChild(b);
  });
}
function dlgKey(k) {
  const d = S.dialog;
  if (!d) return;
  const n = d.all.length;
  if (k === "arrowup") { d.sel = (d.sel - 1 + n) % n; sfx("cursor"); renderDlgOpts(); }
  else if (k === "arrowdown") { d.sel = (d.sel + 1) % n; sfx("cursor"); renderDlgOpts(); }
  else if (k === "enter" || k === " ") { sfx("select"); d.all[d.sel].fn(); }
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
  if (a.kind === "cmd") return a.id === "pet" ? (save.buddy && BUDDIES[save.buddy] ? BUDDIES[save.buddy].icon : "🐾") : "💤";
  if (a.kind === "ws") return "⚔";
  if (a.kind === "ja") return ACT_ICON[a.id] || "✦";
  return SPELL_ICON[a.id] || "✧";
}
function actName(a) {
  if (!a) return "";
  if (a.kind === "item") return ITEMS[a.id] ? ITEMS[a.id].name : a.id;
  if (a.kind === "cmd") return a.id === "pet" ? "Pet" : "Rest";
  if (a.kind === "ws") return WEAPON_SKILLS[a.id].name;
  if (a.kind === "ja") return ABILITIES[a.id].name;
  return SPELLS[a.id].name;
}
function actDesc(a) {
  if (a.kind === "item") return ITEMS[a.id].desc || "";
  if (a.kind === "cmd" && a.id === "pet") return "Summon or dismiss your equipped pet (/pet). Choose pets in the Pets window.";
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
  while (hb.pages.length < 4) hb.pages.push(new Array(10).fill(null));
  if (!hb.petAdded && save.buddies && save.buddies.length) {
    hb.petAdded = true;
    if (!hb.pages.some(pg => pg.some(x => x && x.kind === "cmd" && x.id === "pet"))) {
      for (const pg of hb.pages) { const i = pg.findIndex(x => !x); if (i >= 0) { pg[i] = { kind: "cmd", id: "pet" }; break; } }
    }
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
function barPosApply() {
  const w = $("barWrap"), p = VIEW.settings.barPos || { x: 0, y: 0 };
  w.style.transform = "translate(" + p.x + "px," + p.y + "px)";
  const r = w.getBoundingClientRect();
  if (!r.width) return;
  let dx = 0, dy = 0;
  if (r.left < 0) dx = -r.left; else if (r.right > innerWidth) dx = innerWidth - r.right;
  if (r.top < 0) dy = -r.top; else if (r.bottom > innerHeight) dy = innerHeight - r.bottom;
  if (dx || dy) w.style.transform = "translate(" + (p.x + dx) + "px," + (p.y + dy) + "px)";
}

function initBarDrag() {
  const w = $("barWrap"), g = $("barGrip");
  barPosApply();
  window.addEventListener("resize", barPosApply);
  g.addEventListener("pointerdown", e => {
    e.preventDefault();
    const p0 = VIEW.settings.barPos || { x: 0, y: 0 }, sx = e.clientX, sy = e.clientY;
    g.setPointerCapture(e.pointerId);
    const mv = ev => { VIEW.settings.barPos = { x: Math.round(p0.x + ev.clientX - sx), y: Math.round(p0.y + ev.clientY - sy) }; barPosApply(); };
    const up = () => {
      g.removeEventListener("pointermove", mv);
      g.removeEventListener("pointerup", up);
      g.removeEventListener("pointercancel", up);
      const m = new DOMMatrixReadOnly(getComputedStyle(w).transform);
      VIEW.settings.barPos = { x: Math.round(m.m41), y: Math.round(m.m42) };
      saveSettings(VIEW.settings);
    };
    g.addEventListener("pointermove", mv);
    g.addEventListener("pointerup", up);
    g.addEventListener("pointercancel", up);
  });
  g.addEventListener("dblclick", () => { VIEW.settings.barPos = { x: 0, y: 0 }; barPosApply(); saveSettings(VIEW.settings); });
}

function buildActionBar() {
  const el = $("actionBar");
  el.innerHTML = "";
  UI.slots = [];
  const pages = hotbar().pages;
  document.body.classList.toggle("barEmpty", !pages.some(lineShown));
  if (!lineShown(pages[UI.page])) { const k = pages.findIndex(lineShown); if (k >= 0) UI.page = k; }
  const pg = pages[UI.page];
  for (let i = 0; i < 10; i++) {
    const a = pg[i];
    const b = document.createElement("button");
    b.className = "slot" + (a ? " " + a.kind : " empty") + (a && a.hud === false ? " nohud" : "");
    if (a) b.style.background = actTint(a);
    b.innerHTML = '<span class="hk">' + ((i + 1) % 10) + '</span><span class="ic">' + actIcon(a) + '</span><span class="cost"></span><span class="cd"></span><span class="cdt"></span><span class="nmL">' + esc(actName(a)) + "</span>";
    b.title = a ? actName(a) + " — " + actDesc(a) : "Empty slot. Assign actions in the menu (B).";
    b.onclick = () => activateSlot(UI.page, i);
    el.appendChild(b);
    UI.slots.push({ el: b, a, cost: b.querySelector(".cost"), cd: b.querySelector(".cd"), cdt: b.querySelector(".cdt"), chip: null, last: {} });
  }
  $("pgNum").textContent = ["Main", "Shft", "Alt", "Tab"][UI.page];
  if (typeof VIEW !== "undefined" && VIEW.settings) barPosApply();
}
function toggleFullscreen() {
  const d = document;
  if (d.fullscreenElement) { d.exitFullscreen(); return; }
  const p = d.documentElement.requestFullscreen ? d.documentElement.requestFullscreen({ navigationUI: "hide" }) : null;
  if (p) p.then(() => { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock().catch(() => {}); log("Fullscreen on. The browser now passes more shortcuts to the game.", "sys"); }).catch(() => log("Your browser would not enter fullscreen.", "sys"));
}

function lineShown(pg) { return pg.some(a => a && a.hud !== false); }
function setPage(p) {
  const pages = hotbar().pages, dir = p < UI.page || (UI.page === 0 && p === -1) ? -1 : 1;
  let n = (p + 4) % 4;
  for (let k = 0; k < 4 && !lineShown(pages[n]); k++) n = (n + dir + 4) % 4;
  UI.page = n; buildActionBar(); sfx("tab");
}
function closeHotBar() {
  for (const pg of hotbar().pages) for (const a of pg) if (a) a.hud = false;
  saveGame(); buildActionBar(); sfx("close");
  log("Hotkey bar hidden. Choose which hotkeys appear on it in Hotkeys (B).", "sys");
}
function activateSlot(page, i) {
  const a = hotbar().pages[page][i];
  if (page === UI.page && UI.slots[i]) { const el = UI.slots[i].el; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  if (!a) return;
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
    if (a.kind === "cmd") { ready = player.alive && (a.id !== "pet" || !!save.buddy); cost = a.id === "pet" ? (S.buddy ? "on" : "") : (player.resting ? "on" : ""); }
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
function partyRows() {
  if (typeof NET_PT === "undefined" || !NET_PT.id) return S.party;
  return S.party.concat(netPartyList().map(m => { m.kind = "netmember"; return m; }));
}
function companionInfo(p) {
  const id = p.mercId, m = MERCS[id];
  const due = save.mercPaid[id] || Date.now() + COMPANION_CFG.dayMs, left = Math.max(0, due - Date.now());
  const h = Math.floor(left / 3600000), mn = Math.floor(left % 3600000 / 60000);
  const q = m.name + " · " + JOBS[m.job].name + " Lv" + p.lv + ". Next wage " + mercWage(id) + " crystals in " + h + "h " + String(mn).padStart(2, "0") + "m (you have " + save.gil.toLocaleString() + ").";
  promptChoice(q, [
    { label: "Pay now (" + mercWage(id) + " crystals)", fn: () => { closeDialog(); const w = mercWage(id); if (save.gil < w) { log("You don't have enough crystals.", "sys"); sfx("error"); return; } save.gil -= w; save.mercPaid[id] = Math.max(Date.now(), save.mercPaid[id] || 0) + COMPANION_CFG.dayMs; log("You pay " + m.name + " another day's wage (" + w + " crystals).", "sys"); sfx("coin"); saveGame(); } },
    { label: "Dismiss " + m.name, fn: () => { closeDialog(); gameConfirm("Dismiss " + m.name + "?", "They'll go back to the Mercenary Hall.", () => dismissMerc(id), { yes: "Dismiss" }); } }
  ]);
}
function buildParty() {
  const el = $("party");
  el.innerHTML = "";
  partyRows().forEach((p, i) => {
    const row = document.createElement("div");
    row.className = "pf glass";
    const job = JOBS[p.job] || { icon: "?", color: "#ccc" };
    row.innerHTML = '<div class="por" style="border-color:' + (p.color || job.color) + '">' + job.icon + "<em></em></div><div><div class=\"top\"><span class=\"nm\"></span><span class=\"jb\"></span></div><div class=\"bars\">" +
      '<div class="bar hp"><i></i><b></b></div><div class="bar mp"><i></i><b></b></div><div class="bar tp"><i></i><b></b></div>' + '</div></div><div class="bufs"></div><div class="bar cast cb"><i></i></div>';
    if (p.kind === "netmember") row.classList.add("net");
    row.onclick = () => {
      sfx("select");
      if (p.mercId && MERCS[p.mercId]) { setTarget(p); companionInfo(p); return; }
      if (p.kind !== "netmember") { setTarget(p); return; }
      const o = S.others && S.others.get(p.id);
      if (o) { setTarget(o); tgtCmdOpen(o); } else log(p.name + " is in " + (ZONES[p.zone] ? ZONES[p.zone].name : "another area") + ".", "sys");
    };
    const q = s => row.querySelector(s);
    const bars = row.querySelectorAll(".bars .bar");
    p.ui = { row, nm: q(".nm"), jb: q(".jb"), lv: q(".por em"), hp: bars[0].firstChild, hpT: bars[0].lastChild, mp: bars[1].firstChild, mpT: bars[1].lastChild, mpBar: bars[1], tp: bars[2].firstChild, bufs: q(".bufs"), cb: q(".cb"), cbI: q(".cb i") };
    el.appendChild(row);
  });
}
function updateParty() {
  const rows = partyRows();
  const key = rows.map(p => (p.kind === "netmember" ? p.id : p.mercId || "me") + p.job).join(",");
  if (key !== UI.partyKey) { UI.partyKey = key; buildParty(); }
  for (const p of rows) {
    const u = p.ui;
    if (!u) continue;
    setTxt(u.nm, p === player ? save.name || "You" : p.name);
    setTxt(u.jb, (UI.phone ? jobTag(p) : (JOBS[p.job] ? JOBS[p.job].name : p.job) + (p.sub ? "/" + p.sub : "")) + (p.mounted ? " 🦖" : "") + (p.kind === "netmember" && p.zone && p.zone !== S.zoneId ? " · " + (ZONES[p.zone] ? ZONES[p.zone].name : "away") : ""));
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
    u.row.classList.toggle("sel", player.target === p || (p.kind === "netmember" && player.target && player.target.id === p.id));
    if (p.kind === "netmember") u.row.classList.toggle("far", p.zone !== S.zoneId);
    u.row.classList.toggle("ko", !p.alive);
  }
}

function updateTarget() {
  if (UI.cmd && (player.target !== UI.cmd.t || !UI.cmd.t.alive)) tgtCmdClose();
  const t = player.target;
  const box = $("target");
  if (!t || !(isMob(t) || isParty(t) || t.kind === "npc" || t.kind === "remote") || (isMob(t) && t.despawned)) { if (box.style.display !== "none") box.style.display = "none"; UI.ghostTarget = null; return; }
  if (box.style.display !== "block") box.style.display = "block";
  box.classList.remove("npc");
  let pct = 0;
  if (t !== UI.ghostTarget) { UI.ghostTarget = t; UI.hpGhost = isMob(t) || isParty(t) || t.kind === "remote" ? t.hp / t.maxHp : 0; }
  if (isMob(t)) {
    const [c, col] = conOf(t);
    setTxt($("tName"), t.name);
    const cs = claimState(t);
    $("tName").style.color = !t.alive ? "#a0a0a8" : cs === "other" ? "#c77dff" : cs === "mine" || ffMobAttacking(t) || (t.aggro && !t.passive) ? "#ff5a48" : "#ffffff";
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
    if (t.claim && t.alive && claimName(t) !== "you") info += " · claimed by " + claimName(t);
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
    $("tName").style.color = t === player ? "#ffffff" : t.mercId || t.pet ? "#ffe45c" : "#7ee8ff";
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
  } else if (t.kind === "remote") {
    const mate = isMate(t);
    setTxt($("tName"), t.name);
    $("tName").style.color = mate ? "#7ee8ff" : "#ffffff";
    setTxt($("tLv"), (t.job ? t.job + t.lv + (t.sub ? "/" + t.sub : "") : "") + (mate ? " · Party" : " · Player"));
    $("tTag").style.display = "none";
    pct = 100 * t.hp / Math.max(1, t.maxHp);
    setTxt($("tHpT"), mate ? Math.ceil(t.hp) + " / " + t.maxHp : Math.ceil(pct) + "%");
    setW($("tTp"), mate ? 100 * (t.tp || 0) / CONFIG.tpMax : 0);
    setW($("tSwing"), t.casting ? 100 * clamp((S.time - t.casting.start) / (t.casting.end - t.casting.start), 0, 1) : 0);
    setTxt($("tToT"), "");
    $("tWarn").style.display = "none";
    setTxt($("tInfo"), !t.alive ? "KO" : mate ? (t.maxMp ? "MP " + Math.floor(t.mp) + "/" + t.maxMp + " · " : "") + "Your party" : (UI.phone ? "Tap again for options" : "Click again for options"));
    setHtml($("tChain"), "");
  } else {
    setTxt($("tName"), t.name);
    $("tName").style.color = "#8cff98";
    setTxt($("tLv"), "");
    box.classList.add("npc");
    $("tTag").style.display = "none";
    pct = 0;
    setTxt($("tHpT"), "");
    setW($("tTp"), 0); setW($("tSwing"), 0);
    setTxt($("tToT"), "");
    $("tWarn").style.display = "none";
    setTxt($("tInfo"), questMarker(t) ? "❗ Has something for you" : "");
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
  for (const d of z.districts || []) { g.fillStyle = d.color + "26"; g.fillRect(d.x, d.y, d.w, d.h); }
  for (const q of (z.plaza ? [z.plaza] : []).concat(z.plazas || [])) { g.fillStyle = "#9b8c6c"; g.beginPath(); g.arc(q.x, q.y, q.r, 0, 7); g.fill(); }
  for (const f of z.fountains || []) { g.fillStyle = "#5a9ad0"; g.beginPath(); g.arc(f.x, f.y, 44, 0, 7); g.fill(); }
  for (const gd of z.gardens || []) { g.fillStyle = "#4f7a34"; g.fillRect(gd.x - gd.w / 2, gd.y - gd.h / 2, gd.w, gd.h); }
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
  if (z.cityWalls) for (const r of cityWallRects(z)) { g.fillStyle = r.tower ? "#8a8578" : "#6d685c"; g.fillRect(r.x, r.y, r.w, r.h); g.strokeStyle = "rgba(0,0,0,.6)"; g.lineWidth = 4; g.strokeRect(r.x, r.y, r.w, r.h); }
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

function gridRef(x, y) {
  const z = S.zone, c = Math.max(z.w, z.h) / 15;
  return String.fromCharCode(65 + clamp(Math.floor(x / c), 0, 15)) + "-" + (1 + clamp(Math.floor(y / c), 0, 14));
}
function drawMinimap() {
  const wrap = $("mmWrap");
  if (!wrap) return;
  if (VIEW.settings && VIEW.settings.compass === false) { wrap.style.display = "none"; return; }
  wrap.style.display = "";
  const cv = $("minimap");
  const W = cv.width, R = W / 2;
  const g = cv.getContext("2d");
  const view = S.zone.indoor ? 240 : 420;
  const sc = (R - 6) / view;
  const yaw = VIEW.yaw;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, W);
  const bg = g.createRadialGradient(R, R, 4, R, R, R - 2);
  bg.addColorStop(0, "rgba(235,240,255,.55)"); bg.addColorStop(0.7, "rgba(170,180,210,.38)"); bg.addColorStop(1, "rgba(120,130,170,.5)");
  g.beginPath(); g.arc(R, R, R - 3, 0, 7); g.fillStyle = bg; g.fill();
  g.lineWidth = 3; g.strokeStyle = "rgba(240,244,255,.75)"; g.stroke();
  g.save();
  g.beginPath(); g.arc(R, R, R - 4, 0, 7); g.clip();
  g.translate(R, R);
  g.rotate(-Math.PI / 2 - yaw);
  g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 1.5;
  for (const r of [0.33, 0.66]) { g.beginPath(); g.arc(0, 0, (R - 4) * r, 0, 7); g.stroke(); }
  g.beginPath(); g.moveTo(-R, 0); g.lineTo(R, 0); g.moveTo(0, -R); g.lineTo(0, R); g.stroke();
  g.scale(sc, sc);
  g.translate(-player.x, -player.y);
  const dot = (x, y, r, col) => { g.beginPath(); g.arc(x, y, r / sc, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = 1.5 / sc; g.strokeStyle = "rgba(0,0,0,.6)"; g.stroke(); };
  for (const n of S.npcs) {
    if (n.away || (n.prop && n.prop !== "gather" && n.prop !== "chest" && !n.poi)) continue;
    if (NPCS[n.id] && NPCS[n.id].crystal) dot(n.x, n.y, 6, "#7ff3ff");
    else if (NPCS[n.id] && NPCS[n.id].warpstone) dot(n.x, n.y, 6, "#ff9ff3");
    else if (n.poi) dot(n.x, n.y, 5, n.poi === "cache" ? "#ffd54f" : "#b39ddb");
    else if (n.prop) dot(n.x, n.y, 5, n.prop === "chest" ? "#ffd54f" : "#c8e6a0");
    else dot(n.x, n.y, 6, questMarker(n) ? "#ffd54f" : "#7dff9a");
  }
  for (const mb of S.mobs) {
    if (!mb.alive || mb.despawned) continue;
    if (dist(mb, player) > 360 && player.target !== mb && !(mb.state === "combat" && mb.enmity && [...mb.enmity.keys()].some(isParty))) continue;
    dot(mb.x, mb.y, mb.fam.nm ? 8 : 6, mb.state === "combat" ? "#ff4a4a" : "#ffb070");
  }
  if (S.race && RACE.checkpoints[S.race.next] && RACE.checkpoints[S.race.next].zone === S.zoneId) { const cp = RACE.checkpoints[S.race.next]; dot(cp.x, cp.y, 10, "rgba(255,213,79,.9)"); }
  for (const p of S.party) if (p !== player) dot(p.x, p.y, 6, p.alive ? "#62b6ff" : "#555");
  g.restore();
  g.beginPath(); g.arc(R, R, 8, 0, 7); g.fillStyle = "#ff6ad5"; g.fill(); g.lineWidth = 2; g.strokeStyle = "#fff"; g.stroke();
  const rx = wrap.clientWidth / 2 - 6, ry = rx * 0.42;
  const base = -Math.PI / 2 - yaw - Math.PI / 2;
  [["mmN", 0], ["mmE", Math.PI / 2], ["mmS", Math.PI], ["mmW", -Math.PI / 2]].forEach(([id, off]) => {
    const el = $(id); if (!el) return;
    const a = base + off;
    el.style.transform = "translate(" + (Math.cos(a) * rx).toFixed(1) + "px," + (Math.sin(a) * ry).toFixed(1) + "px)";
  });
  const v = vana();
  setTxt($("mmTime"), String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0") + " (" + gridRef(player.x, player.y) + ")");
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
  yes.className = "yes sel " + (opts.danger ? "danger" : "pri");
  no.className = "no";
  yes.onmouseenter = () => { yes.classList.add("sel"); no.classList.remove("sel"); };
  no.onmouseenter = () => { no.classList.add("sel"); yes.classList.remove("sel"); };
  const ch = $("chat");
  box.style.bottom = "calc(" + ((ch && !ch.classList.contains("gone") ? ch.offsetHeight : 0) + 16) + "px + var(--sab))";
  box.querySelector(".cbB").textContent = text || title;
  box.classList.add("on");
  S.keys = {};
  const close = () => { box.classList.remove("on"); yes.onclick = no.onclick = null; UI.confirmOpen = false; UI.confirmTag = null; UI.confirmClose = null; };
  UI.confirmOpen = true; UI.confirmTag = opts.tag || null; UI.confirmClose = close;
  yes.onclick = () => { close(); if (typeof sfx === "function") sfx("select"); onYes(); };
  no.onclick = () => { close(); if (typeof sfx === "function") sfx("close"); if (opts.onNo) opts.onNo(); };
  if (typeof sfx === "function") sfx("open");
}

function gameConfirmClose(tag) {
  if (!UI.confirmOpen || (tag && UI.confirmTag !== tag) || !UI.confirmClose) return;
  UI.confirmClose();
  if (typeof sfx === "function") sfx("close");
}

const TGT_INSPECT = { sign: 1, board: 1, tablet: 1, lookout: 1, mirage: 1, shrine: 1 };
function tgtActFor(t) {
  if (!t || S.ko || S.modal || S.dialog || !player.alive) return null;
  if (isMob(t)) return t.alive ? { label: "Fight", fight: true } : null;
  if (t.kind !== "npc" || t.away || t.gone) return null;
  if (t.prop === "gather") return { label: "Harvest" };
  if (t.prop) return { label: TGT_INSPECT[t.prop] ? "Inspect" : "Use" };
  if (t.crystal || (NPCS[t.id] && NPCS[t.id].warpstone)) return { label: "Use" };
  return { label: "Talk" };
}
function updateTgtAct() {
  const el = $("tgtAct");
  if (!el) return;
  const t = player.target, touch = (typeof VIEW !== "undefined" && VIEW.touch) || matchMedia("(pointer: coarse)").matches;
  const a = touch ? tgtActFor(t) : null;
  if (!a || (UI.cmd && UI.cmd.t === t)) { if (el.classList.contains("on")) el.classList.remove("on"); return; }
  if (el.textContent !== a.label) el.textContent = a.label;
  el.classList.toggle("fight", !!a.fight);
  el.classList.add("on");
}
function tgtActPress() {
  const t = player.target, a = tgtActFor(t);
  if (!a) return;
  if (isMob(t)) {
    if (!claimOk(t)) { log("The " + t.name + " is claimed by " + claimName(t) + ".", "sys"); sfx("error"); return; }
    if (!(player.engaged && player.attackTarget === t)) toggleEngage(false);
    tgtCmdOpen(t);
    return;
  }
  if (dist(player, t) <= CONFIG.talkRange) { talkTo(t); return; }
  S.pendingTalk = t;
  S.moveTarget = { x: t.x, y: t.y };
}

function tgtCmdOpen(t) {
  if (!t || (!isMob(t) && t.kind !== "remote" && t !== player) || (isMob(t) && !t.alive)) { tgtCmdClose(); return; }
  UI.cmd = { t, page: "root", info: "", sel: 0 };
  renderTgtCmd();
}

function tgtCmdClose() {
  UI.cmd = null;
  UI.ffHelp = "";
  const el = $("tCmd");
  if (el) { el.classList.remove("on"); el.innerHTML = ""; }
}

function inspectText(t) {
  const [c] = conOf(t);
  const tough = { "Too Weak": "It seems too weak to be worthwhile.", "Easy Prey": "It seems like easy prey.", "Decent Challenge": "It seems like a decent challenge.", "Even Match": "It seems like an even match.", "Tough": "It looks tough.", "Very Tough": "It looks very tough.", "Incredibly Tough": "It looks incredibly tough." }[c] || "It is hard to judge.";
  const mood = t.passive || !t.fam.aggro ? "It looks peaceful unless provoked." : "It looks hostile.";
  return tough + " " + mood + (t.fam.nm ? " It is a notorious monster!" : "");
}

function cmdHelpOf(a) {
  if (a.kind === "ma") return SPELLS[a.id].desc || SPELLS[a.id].name;
  if (a.kind === "ja") return ABILITIES[a.id].desc || ABILITIES[a.id].name;
  if (a.kind === "ws") return (WEAPON_SKILLS[a.id] && WEAPON_SKILLS[a.id].desc) || "Weapon skill. Needs 1000 TP.";
  return "";
}

function cmdItems(c) {
  const t = c.t, mob = isMob(t), self = t === player, mate = t.kind === "remote" && isMate(t);
  const it = (key, label, help, o) => Object.assign({ key, label, help }, o || {});
  if (c.page === "root") {
    if (mob) {
      const eng = player.engaged && player.attackTarget === t;
      return [eng ? it("disengage", "Disengage", "Stop auto-attack and let go of the target.") : it("attack", "Attack", "Start auto-attack."), it("switch", "Switch Target", "Target the next enemy nearby."), it("ma", "Magic", "Cast a spell on the target.", { arrow: true }), it("ja", "Abilities", "Use a job ability or weapon skill.", { arrow: true }), it("items", "Items", "Use an item from your bag.", { arrow: true }), it("check", "Check", "Size up how strong the target is.")];
    }
    if (self) return [it("ma", "Magic", "Cast a spell on yourself or your party.", { arrow: true }), it("ja", "Abilities", "Use a job ability.", { arrow: true }), it("items", "Items", "Use an item from your bag.", { arrow: true }), it("rest", player.resting ? "Stand" : "Heal", player.resting ? "Stand up." : "Sit and recover HP and MP quickly."), it("menu", "Main Menu", "Open the main menu."), it("chat", "Chat", "Show the event log and type a message."), it("close", "Cancel", "Close this menu.")];
    return [mate ? it("ma", "Magic", "Cast a spell on your party member.", { arrow: true }) : it("invite", "Invite", "Invite this player to your party."), it("trade", "Trade", "Ask this player to trade."), it("tell", "Tell", "Send this player a private message."), it("check", "Check", "See this player's job and level."), it("close", "Cancel", "Close this menu.")];
  }
  let acts = [];
  if (c.page === "ma") acts = actionList(player).filter(a => a.kind === "ma" && (mob ? SPELLS[a.id].target === "enemy" : self ? SPELLS[a.id].target !== "enemy" : SPELLS[a.id].target === "ally" && (SPELLS[a.id].kind === "heal" || SPELLS[a.id].kind === "buff")));
  else if (c.page === "ja") acts = actionList(player).filter(a => mob ? a.kind === "ws" || (a.kind === "ja" && ABILITIES[a.id].target === "enemy") : a.kind === "ja" && ABILITIES[a.id].target !== "enemy");
  else if (c.page === "items") {
    const seen = new Set();
    for (const sl of save.inventory) { const I = ITEMS[sl.id]; if (!I || seen.has(sl.id) || !(I.kind === "use" || I.kind === "food")) continue; seen.add(sl.id); acts.push({ kind: "item", id: sl.id, name: I.name + " ×" + invCount(sl.id) }); }
  }
  c.acts = acts;
  const out = acts.map((a, i) => it("act" + i, (a.kind === "item" ? (ITEMS[a.id].icon || "") + " " + a.name : actName(a)), a.kind === "item" ? itemDesc(a.id) : cmdHelpOf(a), { off: a.kind !== "item" && !!checkAction(player, a, t) }));
  if (!out.length) out.push(it("none", c.page === "items" ? "No usable items" : "Nothing to use", c.page === "ma" ? "You know no spells for this target." : c.page === "ja" ? "You have nothing to use on this target." : "You have no items you can use here.", { off: true }));
  out.push(it("back", "Back", "Return to the previous menu."));
  return out;
}

function renderTgtCmd() {
  const el = $("tCmd"), c = UI.cmd;
  if (!el || !c) return;
  const items = cmdItems(c);
  c.items = items;
  c.sel = clamp(c.sel || 0, 0, items.length - 1);
  const t = c.t;
  const title = c.page === "root" ? (t === player ? save.name : t.name) : c.page === "ma" ? "Magic" : c.page === "ja" ? "Abilities" : "Items";
  const list = c.page !== "root";
  el.classList.toggle("list", list);
  let h = list ? "" : '<div class="ffMHead">' + esc(title) + "</div>";
  items.forEach((it, i) => {
    const a = list && c.acts && it.key && it.key.startsWith("act") ? c.acts[+it.key.slice(3)] : null;
    const orb = a ? (a.kind === "ma" ? '<span class="orb" style="--oc:' + (ELEMENT_COLORS[SPELLS[a.id].element] || "#9fe8ff") + '"></span>' : a.kind === "item" ? '<span class="ico">' + (ITEMS[a.id].icon || "📦") + "</span>" : '<span class="orb" style="--oc:' + (a.kind === "ws" ? "#ffb070" : "#b0ffb0") + '"></span>') : "";
    const lbl = a && a.kind === "item" ? a.name : it.label;
    h += '<button data-tc="' + i + '" class="ffb' + (i === c.sel ? " sel" : "") + (it.off ? " off" : "") + '"><span class="cur">➤</span>' + orb + '<span class="lb">' + esc(lbl) + "</span>" + (it.arrow ? '<span class="ar">▶</span>' : "") + "</button>";
  });
  if (c.info) h += '<div class="tcInfo">' + esc(c.info) + "</div>";
  el.innerHTML = h;
  el.classList.add("on");
  UI.ffHelp = items[c.sel] ? items[c.sel].help : "";
  renderMpBox();
}
function renderMpBox() {
  const box = $("mpBox"), c = UI.cmd;
  if (!box) return;
  const it = c && c.items && c.items[c.sel], a = it && it.key && it.key.startsWith("act") && c.acts ? c.acts[+it.key.slice(3)] : null;
  if (!a || (a.kind !== "ma" && a.kind !== "ja" && a.kind !== "ws")) { box.classList.remove("on"); return; }
  const rk = a.kind === "ma" ? "ma:" + a.id : "ja:" + a.id, rc = a.kind === "ws" ? 0 : recastLeft(player, rk);
  const cost = a.kind === "ma" ? SPELLS[a.id].mp + "" : a.kind === "ws" ? "1000 TP" : "—";
  const nx = rc > 0 ? Math.floor(rc / 60) + ":" + String(Math.ceil(rc % 60)).padStart(2, "0") : "0:00";
  box.innerHTML = '<div class="r"><em>' + (a.kind === "ma" ? "MP Cost" : "Cost") + "</em><b>" + cost + '</b></div><div class="r"><em>Next</em><b>' + nx + "</b></div>";
  box.classList.add("on");
  const side = $("ffSide");
  box.style.bottom = "calc(" + ((side ? side.offsetHeight : 0) + 12) + "px + var(--sab))";
}

function tgtCmdHover(i) {
  const c = UI.cmd;
  if (!c || !c.items || c.sel === i) return;
  c.sel = i;
  const el = $("tCmd");
  el.querySelectorAll(".ffb").forEach((b, k) => b.classList.toggle("sel", k === i));
  UI.ffHelp = c.items[i] ? c.items[i].help : "";
}

function tgtCmdKey(k) {
  const c = UI.cmd;
  if (!c) return;
  const n = (c.items || []).length;
  if (k === "arrowup") { c.sel = (c.sel - 1 + n) % n; sfx("cursor"); renderTgtCmd(); }
  else if (k === "arrowdown") { c.sel = (c.sel + 1) % n; sfx("cursor"); renderTgtCmd(); }
  else if (k === "enter" || k === "arrowright") onTgtCmd(String(c.sel));
  else if (k === "arrowleft" || k === "backspace") { if (c.page !== "root") { c.page = "root"; c.sel = 0; sfx("close"); renderTgtCmd(); } else tgtCmdClose(); }
  else if (k === "escape") tgtCmdClose();
}

function onTgtCmd(idx) {
  const c = UI.cmd;
  if (!c) return;
  const it = c.items && c.items[+idx];
  if (!it) return;
  const t = c.t, key = it.key;
  if (it.off && key !== "back") { sfx("error"); return; }
  sfx("select");
  if (key === "close" || key === "none") { tgtCmdClose(); return; }
  if (key === "back") { c.page = "root"; c.sel = 0; renderTgtCmd(); return; }
  if (key === "ma" || key === "ja" || key === "items") { c.page = key; c.sel = 0; renderTgtCmd(); return; }
  if (key === "check") { const info = t.kind === "remote" ? t.name + " · " + (JOBS[t.job] ? JOBS[t.job].name : "?") + " " + t.lv + (t.sub && JOBS[t.sub] ? " / " + JOBS[t.sub].name : "") + "." : inspectText(t); log((t.kind === "remote" ? "" : "The " + t.name + ": ") + info, "sys"); c.info = null; renderTgtCmd(); return; }
  if (key === "attack") { player.target = t; toggleEngage(true); tgtCmdClose(); return; }
  if (key === "disengage") { if (player.engaged) toggleEngage(false); player.engaged = false; player.attackTarget = null; S.chase = false; player.target = null; tgtCmdClose(); return; }
  if (key === "switch") { tgtCmdClose(); cycleTarget(); return; }
  if (key === "rest") { tgtCmdClose(); toggleRest(); return; }
  if (key === "menu") { tgtCmdClose(); mainCmdOpen(); return; }
  if (key === "chat") { tgtCmdClose(); openChatInput(""); return; }
  if (key === "invite") { netPartyInvite(t.name); tgtCmdClose(); return; }
  if (key === "trade") { netTradeAsk(t.name); tgtCmdClose(); return; }
  if (key === "tell") { tgtCmdClose(); const inp = $("chatIn"); if (inp) { inp.value = "/t " + t.name + " "; inp.focus(); } return; }
  if (key.startsWith("act")) {
    const a = c.acts && c.acts[+key.slice(3)];
    if (!a) return;
    if (a.kind === "item") { useItem(a.id); renderTgtCmd(); return; }
    if (t !== player) player.target = t;
    playerAct(a);
    tgtCmdClose();
  }
}

function uiHoverSounds() {
  if (UI.hoverSnd) return;
  UI.hoverSnd = true;
  let last = null;
  document.addEventListener("pointerover", ev => {
    if (ev.pointerType && ev.pointerType !== "mouse") return;
    const el = ev.target && ev.target.closest && ev.target.closest("button, .item, [data-a], [data-mc], [data-tc], [data-o], .ffMI, .opt > *");
    if (!el || el === last) return;
    last = el;
    if (el.disabled || el.classList.contains("off")) return;
    sfx("cursor");
  }, { passive: true });
}

function uiEvent(type, d) {
  if (type === "target") { tgtCmdOpen(d); return; }
  if (type === "ach") { toast(d.icon, "Achievement unlocked", d.name, "r-epic"); return; }
  if (type === "bond") { toast("💞", "Bond level " + d.lv, MERCS[d.id].name, "r-rare"); return; }
  if (type === "bf") { toast("🔱", "Victory!", d.prize ? ITEMS[d.prize].name : "The chapel is quiet", "r-epic"); return; }
  if (type === "race") { UI.mmForce = true; return; }
  if (type === "pool") { toast("🎲", "Treasure pool", ITEMS[d.id].name, "r-rare"); return; }
  if (type === "buddy") { toast(BUDDIES[d.id].icon, "New pet", BUDDIES[d.id].name, "r-rare"); return; }
  if (type === "ahsold") { toast("⚖️", "Sold at auction", ITEMS[d.id].name + " · +" + d.price + " 💠", "r-rare"); return; }
  if (type === "story") { banner("CHAPTER COMPLETE", d.name, rewardChips(d.reward)); return; }
  if (type === "guildrank") { banner(GUILD_RANKS[d.rank][0].toUpperCase() + " RANK", "Adventurers' Guild", ["🛒 New guild rewards"]); return; }
  if (type === "beast") { toast("📖", "Bestiary", d.name, "r-uncommon"); return; }
  if (type === "item") {
    const it = ITEMS[d.id];
    if (!it) return;
    const r = itemRarity(d.id);
    toast(it.icon || "📦", r === "epic" ? "Epic item!" : r === "rare" ? "Rare item!" : r === "uncommon" ? "Uncommon item" : "Obtained", (d.n > 1 ? d.n + " × " : "") + it.name, "r-" + r);
  }
  if (type === "district") { zoneTitle(d.d.name, S.zone.city || S.zone.name); if (d.fresh) toast(d.d.icon || "🏙️", "District discovered", d.d.name); sfx("page"); return; }
  if (type === "landmark") { toast("🧭", "Landmark discovered", d.name, "r-rare"); sfx("unlock"); }
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
    if (lv === CONFIG.mountLevel && !save.mountLicense) chips.push("💬 Ysolde wants a word");
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
    zoneTitle(S.zone.name, first ? ["Discovered", zoneSubtitle(S.zoneId)].filter(Boolean).join(" · ") : districtName(S.zoneId, player.x, player.y) || zoneSubtitle(S.zoneId));
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
    setTxt($("castName"), "Crafting " + ITEMS[c.r.out].name + "…");
    setW($("castFill"), 100 * (S.time - c.start) / (c.end - c.start));
  } else cb.style.display = "none";
  const eng = $("btnEngage");
  eng.classList.toggle("on", player.engaged);
  setTxt($("engLbl"), player.engaged ? (isMob(player.target) && player.target !== player.attackTarget ? "Switch" : "Disengage") : "Attack");
  const nn = nearNpc();
  const talk = $("btnTalk");
  talk.disabled = !nn;
  talk.classList.toggle("hot", !!nn && questMarker(nn));
  setTxt($("talkLbl"), nn ? (NPCS[nn.id] && NPCS[nn.id].crystal ? "Crystal" : NPCS[nn.id] && NPCS[nn.id].warpstone ? "Warp" : nn.name.split(/[ ,]/)[0].slice(0, 8)) : "Talk");
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
  const d = cp ? (cp.zone === S.zoneId ? Math.round(Math.hypot(player.x - cp.x, player.y - cp.y) / 20) + " m" : "in " + esc(ZONES[cp.zone].name)) : "";
  setHtml(el, '🏁 <b>' + t.toFixed(1) + 's</b> <span class="sub">/ ' + RACE.limit + "s</span> · " + (cp ? "Checkpoint " + (r.next + 1) + "/" + RACE.checkpoints.length + ": " + esc(cp.name) + " · " + d : ""));
}

function updateHud(dt) {
  tickWait(dt);
  updatePool();
  updateRace();
  updateFish();
  UI.phone = window.innerWidth <= 720;
  updateParty();
  updateTarget();
  updateFF();
  updateTgtAct();
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
  $("tCmd").addEventListener("mouseover", e => { const b = e.target.closest("[data-tc]"); if (b) tgtCmdHover(+b.dataset.tc); });
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
  initBarDrag();
  $("barClose").onclick = closeHotBar;
  $("pgUp").onclick = () => setPage(UI.page - 1);
  $("pgDn").onclick = () => setPage(UI.page + 1);
  $("mmWrap").onclick = () => openMenu("map");
  document.addEventListener("pointerdown", e => {
    const t = e.target;
    if (UI.cmd && !t.closest("#tCmd, #mobBar, #dialog, #confirmBox, #ffSide, #mpBox")) tgtCmdClose();
    if (UI.confirmOpen || S.dialog || t.closest("#mobBar, #dialog, #confirmBox, #chat, #ffTop, #ffNetBox, #logTap")) return;
    if (S.modal && !t.closest("#menu .win, #mCard, #mCmd")) { const back = UI.menuFromMain; closeModal(); if (back && !matchMedia("(max-width: 1020px)").matches) mainCmdOpen(); else if (back) mainCmdClose(); return; }
    if (!S.modal && UI.mm && !t.closest("#mCmd, #stOv")) mainCmdClose();
  }, true);
  $("mobTarget").onclick = e => { e.stopPropagation(); cycleTarget(); sfx("select"); };
  $("mobMenu").onclick = e => { e.stopPropagation(); if (S.modal) { const back = UI.menuFromMain; closeModal(); if (back) mainCmdOpen(); } else if (UI.mm && UI.mm.sub) mainCmdKey("escape"); else if (UI.mm) mainCmdClose(); else mainCmdOpen(); };
  const tapType = e => { if (!matchMedia("(pointer: coarse)").matches || S.modal || e.target.closest("#chatTabs, #chatIn")) return; e.preventDefault(); e.stopPropagation(); openChatInput(""); };
  $("log").addEventListener("touchend", tapType);
  $("log").addEventListener("click", tapType);
  $("logTap").addEventListener("touchend", tapType);
  $("logTap").addEventListener("click", tapType);
  $("btnMenu").onclick = () => S.modal ? closeModal() : UI.mm ? mainCmdClose() : mainCmdOpen();
  $("mCmd").addEventListener("click", e => { const b = e.target.closest("[data-mc]"); if (!b) return; e.stopPropagation(); const v = b.dataset.mc; if (v === "back") { mainCmdKey("escape"); return; } if ((v === "prev" || v === "next") && !UI.mm.sub) { UI.mm.page = 1 - UI.mm.page; UI.mm.sel = 0; sfx("tab"); renderMainCmd(); } else mainCmdDo(+v); });
  $("mBody").addEventListener("mouseover", e => { const hs = e.target.closest("[data-hs]"); if (hs && S.modal) { UI.modalHelp = hs.dataset.hs; return; } const b = e.target.closest("[data-hv]"); if (!b || !S.modal || UI.hov === b.dataset.hv) return; UI.hov = b.dataset.hv; const it = ITEMS[UI.hov]; if (it) UI.modalHelp = it.desc || it.name; renderMCard(); });
  $("mCmd").addEventListener("mouseover", e => { const b = e.target.closest("[data-mc]"); if (!b || !UI.mm || isNaN(+b.dataset.mc)) return; const i = +b.dataset.mc; if (UI.mm.sel !== i) { UI.mm.sel = i; $("mCmd").querySelectorAll(".ffb").forEach((x, k) => x.classList.toggle("sel", k === i)); UI.ffHelp = mainCmdHelp(mainCmdItems()[i]); if (UI.mm.sub) renderStatusOv(); } });
  $("btnChat").onclick = () => chatToggle();
  const ci = $("chatIn");
  UI.cmdHist = []; UI.cmdIdx = 0;
  ci.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter") {
      const v = ci.value.trim();
      ci.value = "";
      if (v) { UI.cmdHist.push(v); if (UI.cmdHist.length > 30) UI.cmdHist.shift(); UI.cmdIdx = UI.cmdHist.length; runCommand(v); }
      ci.blur();
      if (UI.chatTyping) { UI.chatTyping = false; UI.chatPin = false; }
    } else if (e.key === "Escape") { ci.value = ""; ci.blur(); UI.chatTyping = false; chatToggle(false); }
    else if (e.key === "ArrowUp") { if (UI.cmdIdx > 0) { UI.cmdIdx--; ci.value = UI.cmdHist[UI.cmdIdx]; } e.preventDefault(); }
    else if (e.key === "ArrowDown") { if (UI.cmdIdx < UI.cmdHist.length) { UI.cmdIdx++; ci.value = UI.cmdHist[UI.cmdIdx] || ""; } e.preventDefault(); }
  });
  ci.addEventListener("focus", () => { S.keys = {}; });

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const mm = $("minimap");
  mm.width = mm.height = Math.round(150 * dpr * 1.2);
  initMenu();
}

function ffDefaultHelp(t) {
  if (!t) return "";
  if (t === player) return "Choose a command for yourself.";
  if (isMob(t)) return player.engaged && player.attackTarget === t ? "Auto-attack is on. Press F or choose Disengage to stop." : claimOk(t) ? "Start auto-attack." : "This monster is claimed by " + claimName(t) + ".";
  if (t.kind === "npc") return t.crystal ? "Touch the crystal." : t.warpstone ? "Touch the warp stone." : "Talk.";
  if (t.kind === "remote") return "Player commands.";
  if (isParty(t)) return "Party member.";
  return "";
}

function ffMobAttacking(m) { return m && m.alive && m.state === "combat" && m.target && (m.target === player || isParty(m.target) || (m.target.kind === "remote" && isMate(m.target))); }

function updateFF() {
  const ui = $("ui"), t = player.target;
  ui.classList.toggle("isKO", !!S.ko);
  if (S.ko) {
    const left = Math.max(0, (player.koUntil || Date.now()) - Date.now()), mm = Math.floor(left / 60000), ss = Math.floor(left / 1000) % 60;
    setTxt($("koTime"), String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0"));
  }
  const tOk = !!t && (t === player || t.kind === "npc" || t.kind === "remote" || isParty(t) || (isMob(t) && t.alive && !t.despawned));
  ui.classList.toggle("hasTop", tOk || !!UI.cmd || !!UI.mm || !!S.modal || !!S.ko);
  const cmdLbl = S.modal && TAB_INFO[S.modal] ? (S.modal === "inventory" ? "Items " + save.inventory.length + "/" + CONFIG.inventorySize : TAB_INFO[S.modal][0]) : UI.mm && UI.mm.sub === "status" ? "Status" : UI.cmd && UI.cmd.page === "ma" ? "Magic List" : UI.cmd && UI.cmd.page === "ja" ? "Ability List" : UI.cmd && UI.cmd.page === "items" ? "Item List" : "Commands";
  const cmdL = S.ko && !S.modal && !UI.cmd && !UI.mm ? "K.O." : cmdLbl;
  if (UI.cmdLbl !== cmdL) { UI.cmdLbl = cmdL; setTxt(document.querySelector("#ffTop .ffCmd"), cmdL); }
  if (tOk || UI.cmd || UI.mm || S.modal || S.ko) {
    setTxt($("ffHelp"), S.modal ? UI.modalHelp || tabHelpLine(S.modal) : UI.cmd || UI.mm ? UI.ffHelp || "" : S.ko ? "You've been knocked out. Go back to your home point (you'll lose experience)." : ffDefaultHelp(t));
    if (UI.mm && UI.mm.sub && Date.now() - (UI.stAt || 0) > 500) { UI.stAt = Date.now(); renderStatusOv(); }
    const now = Date.now();
    if (now - (UI.netAt || 0) > 1000) {
      UI.netAt = now;
      const on = typeof NET !== "undefined" && NET.member;
      let pct = "—";
      if (on) {
        const live = NET_RT.zch && (NET_RT.zch.state === "joined" || NET_RT.zch.state === "joining");
        const lag = NET.ping || 120;
        pct = live ? clamp(Math.round(100 - Math.max(0, lag - 150) / 12), 5, 100) + "%" : NET.lastErr ? "0%" : "50%";
      }
      if (PLAY.offline) pct = "Offline";
      setTxt($("ffNetPct"), pct);
      setTxt($("ffNetS"), "S " + (typeof NET_RT !== "undefined" ? (NET_RT.sent || 0) % 1000 : 0));
      setTxt($("ffNetR"), "R " + (typeof NET_RT !== "undefined" ? (NET_RT.recv || 0) % 1000 : 0));
    }
  }
  const ci = $("chatIn"), typing = document.activeElement === ci;
  const full = logFull(), force = typing || UI.chatPin || !!S.dialog;
  if (UI.logRows == null) { UI.logRows = 3; UI.logAt = S.time; }
  if (force) { UI.logRows = full; UI.logAt = S.time; }
  else if (UI.logRows > 3 && S.time - (UI.logAt || 0) > 8 && S.time - (UI.logShrinkAt || 0) > 1.2) { UI.logRows--; UI.logShrinkAt = S.time; }
  const rows = Math.min(full, UI.logRows), chat = $("chat"), lg = $("log");
  chat.classList.toggle("gone", rows <= 0);
  chat.classList.toggle("lite", !(typing || UI.chatPin));
  if (rows > 0 && UI.logShown !== rows) { UI.logShown = rows; const lh = parseFloat(getComputedStyle(lg).lineHeight) || 16.5; lg.style.height = Math.round(rows * lh + 10) + "px"; lg.scrollTop = lg.scrollHeight; }
  if (rows <= 0) UI.logShown = 0;
  const mw = $("mmWrap");
  if (mw) { mw.style.bottom = rows > 0 ? "calc(" + (chat.offsetHeight + 16) + "px + var(--sab))" : ""; mw.style.visibility = S.dialog || S.modal || UI.cmd || UI.confirmOpen ? "hidden" : ""; }
  const mb = $("mobBar"), sd = $("ffSide"); if (mb && sd) { const mp = $("mpBox"); mb.style.bottom = "calc(" + (sd.offsetHeight + 12 + (mp && mp.classList.contains("on") ? mp.offsetHeight + 6 : 0)) + "px + var(--sab))"; }
  const tc = $("tCmd"); if (tc) tc.style.bottom = "calc(" + ((rows > 0 ? chat.offsetHeight : 0) + 14) + "px + var(--sab))";
  if (UI.cmd && Date.now() - (UI.mpAt || 0) > 400) { UI.mpAt = Date.now(); renderMpBox(); } else if (!UI.cmd) { const mb = $("mpBox"); if (mb) mb.classList.remove("on"); }
  const dg = $("dialog"), mw2 = S.modal && document.querySelector("#menu .win");
  if (S.dialog && mw2) { const r = mw2.getBoundingClientRect(), fits = r.right + 6 + dg.offsetWidth <= innerWidth - 6; dg.style.top = Math.round(fits ? r.top : Math.min(r.bottom + 6, innerHeight - dg.offsetHeight - 6)) + "px"; dg.style.left = Math.round(fits ? r.right + 6 : Math.max(6, r.left)) + "px"; dg.style.bottom = "auto"; }
  else if (S.dialog) { dg.style.top = "auto"; dg.style.left = ""; }
  if (S.dialog && !mw2) $("dialog").style.bottom = "calc(" + ((rows > 0 ? chat.offsetHeight : 0) + 16) + "px + var(--sab))";
  $("btnChat") && $("btnChat").classList.toggle("on", !!UI.chatPin);
  const combat = player.engaged || inCombatWith(player);
  $("ffStat").classList.toggle("combat", !!combat && player.alive);
  if (combat) {
    const rows = $("ffBars").children;
    const set = (r, v, max) => { setW(r.querySelector("i"), max ? 100 * v / max : 0); setTxt(r.querySelector("b"), String(Math.floor(v))); };
    set(rows[0], Math.ceil(player.hp), player.maxHp); set(rows[1], player.mp, player.maxMp); set(rows[2], player.tp, CONFIG.tpMax);
  }
  const icons = [];
  if (blessed()) icons.push(['<div class="ffIc crys" title="City Blessing · ' + fmtDur(save.blessing - Date.now()) + '"></div>', "bless"]);
  if (save.food && save.food.until > Date.now() && ITEMS[save.food.id]) icons.push(['<div class="ffIc" title="' + esc(ITEMS[save.food.id].name) + " · " + fmtDur(save.food.until - Date.now()) + '">' + (ITEMS[save.food.id].icon || "🍖") + "</div>", "food" + save.food.id]);
  const BAD = { slow: 1, paralyze: 1, poison: 1, sleep: 1, bind: 1, blind: 1, silence: 1, weight: 1, dia: 1, bio: 1, stun: 1, blight: 1, flash: 1 };
  for (const k of Object.keys(player.buffs || {})) { if (k === "blessing") continue; const b = player.buffs[k]; icons.push(['<div class="ffIc' + (BAD[k] ? " bad" : "") + '" title="' + esc(BUFF_NAMES[k] || k) + (b && b.until ? " · " + Math.ceil(b.until - S.time) + "s" : "") + '">' + (BUFF_ICONS[k] || "•") + "</div>", k]); }
  if (player.resting) icons.push(['<div class="ffIc" title="Healing">💤</div>', "rest"]);
  const sig = icons.map(i => i[1]).join(",");
  if (sig !== UI.ffIconSig) { UI.ffIconSig = sig; $("ffIcons").innerHTML = icons.map(i => i[0]).join(""); }
  const side = $("ffSide");
  const showT = tOk && t !== player;
  side.classList.toggle("hasT", showT);
  $("target").style.display = showT ? "block" : "none";
  if (showT && isMob(t)) {
    const atk = ffMobAttacking(t), cs = claimState(t);
    $("tName").style.color = !t.alive ? "#a0a0a8" : atk || cs === "mine" || (t.aggro && !t.passive) ? "#ff5a48" : cs === "other" ? "#c77dff" : "#ffffff";
  }
  $("target").classList.toggle("locked", showT && isMob(t) && player.engaged && player.attackTarget === t);
  const solo = S.party.length <= 1 && !(typeof NET_PT !== "undefined" && NET_PT.id);
  setTxt($("ffPHead").firstChild, solo ? "Solo" : "Party");
}

function openChatInput(pre) {
  UI.chatPin = true; UI.chatTyping = true;
  UI.logRows = logFull(); UI.logAt = S.time;
  const ch = $("chat"); ch.classList.remove("lite", "gone", "min");
  const ci = $("chatIn"); ci.value = pre || "";
  ci.style.display = "block";
  try { ci.focus({ preventScroll: true }); ci.setSelectionRange(ci.value.length, ci.value.length); } catch (e) {}
  setTimeout(() => { ci.style.display = ""; if (document.activeElement !== ci) ci.focus(); }, 60);
}
function logFull() { return innerWidth < 900 ? 6 : 8; }
function logEsc() {
  if (!UI.logRows || UI.logRows <= 0) return false;
  UI.chatPin = false;
  const ci = $("chatIn"); if (ci && document.activeElement === ci) ci.blur();
  UI.logRows = Math.min(UI.logRows, logFull()) - 1; UI.logAt = -999;
  return true;
}
function chatToggle(force) {
  UI.chatPin = force == null ? !UI.chatPin : force;
  if (!UI.chatPin) { const ci = $("chatIn"); if (ci && document.activeElement === ci) ci.blur(); UI.logRows = 3; UI.logAt = -999; }
  if (typeof sfx === "function") sfx("click");
}

const MAIN_CMDS = [
  [["Status", "character", "View your job, levels, HP/MP/TP, attributes and experience."], ["Equipment", "equipment", "Equip weapons and armor."], ["Magic", "magic", "View the spells you know by type and cast them."], ["Items", "inventory", "View, use and sort the items in your bag."], ["Crafting", "craft", "Combine an essence and ingredients to craft something."], ["Abilities", "abilities", "View and use job abilities and weapon skills."], ["Trade", "@trade", "Trade items or crystals with your current target."], ["Social", "social", "Who is online, friends, linkshells, party search and the blacklist."], ["Map", "map", "View the map of this area."]],
  [["Quests", "quests", "Your story chapter and current and finished quests."], ["Key Items", "keyitems", "Important items that can't be traded or dropped."], ["View House", "storage", "Look at what's kept in your residence storage."], ["Database", "database", "Everything you've owned, learned, met and visited: items, gear, magic, abilities, jobs, people, places and creatures."], ["Achievements", "achievements", "Your achievements."], ["Hotkeys", "actions", "Set what the number keys do."], ["Config", "settings", "Change the game's options."], ["Help", "help", "How everything works."], ["Updates", "updates", "What's new in each version."], ["Time", "@time", "Check the time, or wait in town for hours to pass."], ["Log Out", "@logout", "Return to the character selection screen."]]
];

const STATUS_CMDS = [["Profile", "profile", ""], ["Job Levels", "jobs", "View the levels of the jobs you know."], ["Combat Skl.", "combat", "View current combat skills."], ["Magic Skl.", "magic", "View current magic skills."], ["Craft Skl.", "craft", "View current craft and gathering skills."], ["Currencies", "cur", "View your crystals and guild points."], ["Play Time", "time", "View your total time spent adventuring."]];
function mainCmdHelp(it) { return UI.mm && UI.mm.sub === "status" && it[1] === "profile" ? "Title: " + playerTitle() : it[2]; }
function tabHelpLine(tab) {
  for (const pg of MAIN_CMDS) for (const it of pg) if (it[1] === tab) return it[2];
  const x = { shop: "Buy and sell merchandise.", storage: "Move items between your bag and your residence.", job: "Change your job.", mercs: "Hire companions.", board: "Take on work from the board.", guild: "Adventurers' Guild bounties and shop.", auction: "Buy and sell with other adventurers.", home: "Arrange your residence.", furnishings: "Buy furniture.", forge: "Improve your gear.", pets: "Your pets.", stable: "Your mount.", trade: "Trade with another player.", system: "Save, characters and account.", admin: "Server tools." };
  return x[tab] || "";
}
function mainCmdItems() {
  if (UI.mm.sub === "status") return STATUS_CMDS;
  let pg = MAIN_CMDS[UI.mm.page].slice();
  if (PLAY.offline) pg = pg.filter(it => !["@trade", "social"].includes(it[1]));
  const mi = pg.findIndex(it => it[1] === "map");
  if (mi >= 0 && S.zone && S.zone.residence) pg[mi] = ["Residence", "home", "Arrange furniture and use your residence."];
  return pg;
}

function mainCmdOpen() {
  if (S.modal) closeModal();
  tgtCmdClose();
  UI.mm = { page: UI.mm ? UI.mm.page : 0, sel: UI.mm ? UI.mm.sel : 0 };
  renderMainCmd();
  sfx("open");
}
function mainCmdClose() { UI.mm = null; const el = $("mCmd"); if (el) { el.classList.remove("on"); el.innerHTML = ""; } UI.ffHelp = ""; renderStatusOv(); }
function renderMainCmd() {
  const el = $("mCmd"), m = UI.mm;
  if (!el || !m) return;
  const items = mainCmdItems();
  m.sel = clamp(m.sel, 0, items.length - 1);
  let h = m.sub === "status" ? '<div class="ffMLeg">Status</div><div class="ffMHead sub"><button class="pg" data-mc="back">◀</button><span>Status</span><span style="width:26px"></span></div>' : '<div class="ffMLeg">Commands</div><div class="ffMHead"><button class="pg" data-mc="prev">◀</button><span>' + (m.page + 1) + " / 2</span><button class=\"pg\" data-mc=\"next\">▶</button></div>";
  items.forEach((it, i) => { h += '<button data-mc="' + i + '" class="ffb' + (i === m.sel ? " sel" : "") + (it[1] === "home" ? " gold" : "") + '"><span class="cur">➤</span><span class="lb">' + esc(it[0]) + "</span></button>"; });
  el.innerHTML = h;
  el.classList.add("on");
  UI.ffHelp = mainCmdHelp(items[m.sel]);
  renderStatusOv();
}
function mainCmdDo(i) {
  const it = mainCmdItems()[i];
  if (!it) return;
  const k = it[1];
  sfx("select");
  if (UI.mm.sub === "status") { UI.mm.sel = i; renderMainCmd(); return; }
  if (k === "character") { if (S.modal) closeModal(); UI.mm.back = i; UI.mm.sub = "status"; UI.mm.sel = 0; renderMainCmd(); return; }
  UI.mm.sel = i; renderMainCmd();
  if (k === "@logout") mainCmdClose();
  if (k === "@trade") { const t = player.target; if (t && t.kind === "remote") netTradeAsk(t.name); else log("Target another player first, then choose Trade.", "sys"); return; }
  if (k === "@time") { mainCmdClose(); openTimeBox(); return; }
  if (k === "@logout") { gameConfirm("Log out", "Return to the character selection screen?", () => { saveGame(); logoutToSelect(); }, { yes: "Log out" }); return; }
  openMenu(k);
}
function mainCmdKey(k) {
  const m = UI.mm;
  if (!m) return;
  const n = mainCmdItems().length;
  if (k === "arrowup") { m.sel = (m.sel - 1 + n) % n; sfx("cursor"); renderMainCmd(); }
  else if (k === "arrowdown") { m.sel = (m.sel + 1) % n; sfx("cursor"); renderMainCmd(); }
  else if ((k === "arrowleft" || k === "arrowright") && m.sub) return;
  else if ((k === "escape" || k === "backspace") && m.sub) { m.sub = null; m.sel = m.back || 0; sfx("close"); renderMainCmd(); }
  else if (k === "arrowleft" || k === "arrowright") { m.page = 1 - m.page; m.sel = 0; sfx("tab"); renderMainCmd(); }
  else if (k === "enter") mainCmdDo(m.sel);
  else if (k === "escape" || k === "backspace") { mainCmdClose(); sfx("close"); }
}

const WAIT_CFG = { secPerHour: 5, maxHours: 24, msPerHour: 144000 };
function hhmm(v) { return String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0"); }
function othersOnline() {
  if (PLAY.offline || typeof NET === "undefined" || !NET.member || typeof NET_RT === "undefined") return 0;
  const me = String(save.name || "").toLowerCase();
  return (NET_RT.online || []).filter(o => o && String(o.name || "").toLowerCase() !== me).length;
}
function timeBoxEl() {
  let el = $("timeBox");
  if (!el) { el = document.createElement("div"); el.id = "timeBox"; el.className = "glass"; $("ui").appendChild(el); }
  el.style.display = "block";
  return el;
}
function closeTimeBox() { const el = $("timeBox"); if (el) el.style.display = "none"; if (UI.timeBox) UI.timeBox = null; }
function timeNowHTML() {
  const v = vana();
  return '<div class="tbClock">' + (isNight() ? "🌙 " : "☀️ ") + hhmm(v) + '</div><div class="tbSub">' + gameDate() + " · " + DAY_NAMES[v.dayIndex] + " (" + dayElement() + ")</div>";
}
function openTimeBox(view) {
  if (S.wait) return;
  UI.timeBox = { view: view || "menu", hours: (UI.timeBox && UI.timeBox.hours) || 8 };
  renderTimeBox();
  sfx("open");
}
function renderTimeBox(msg) {
  const tb = UI.timeBox; if (!tb) return;
  const el = timeBoxEl();
  if (tb.view === "menu") {
    el.innerHTML = '<div class="vpT">Time</div><div class="vpB">' + timeNowHTML() + '</div><div class="vpA"><button data-t="now" class="pri">Current time</button><button data-t="wait">Wait</button><button data-t="close">Close</button></div>';
  } else if (tb.view === "wait") {
    const v = vana(), to = (v.hour + tb.hours) % 24;
    el.innerHTML = '<div class="vpT">Wait</div><div class="vpB">' + (msg ? '<div class="tbWarn">' + msg + "</div>" : "") + 'How many hours?<div class="tbPick"><button data-t="minus">−</button><b>' + tb.hours + " h</b><button data-t=\"plus\">+</button></div><input type=\"range\" min=\"1\" max=\"" + WAIT_CFG.maxHours + '" value="' + tb.hours + '" data-t="range"><div class="tbSub">Now ' + hhmm(v) + " → about " + String(to).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0") + '</div></div><div class="vpA"><button data-t="go" class="pri">Wait ' + tb.hours + ' h</button><button data-t="back">Back</button></div>';
    const r = el.querySelector("input[type=range]");
    if (r) r.oninput = () => { tb.hours = +r.value; renderTimeBox(); };
  }
  el.onclick = e => {
    const b = e.target.closest("button"); if (!b) return;
    const t = b.dataset.t;
    if (t === "close") { closeTimeBox(); sfx("close"); }
    else if (t === "now") { closeTimeBox(); runCommand("/clock"); }
    else if (t === "wait") { tb.view = "wait"; sfx("select"); renderTimeBox(); }
    else if (t === "back") { tb.view = "menu"; sfx("close"); renderTimeBox(); }
    else if (t === "minus") { tb.hours = Math.max(1, tb.hours - 1); sfx("tab"); renderTimeBox(); }
    else if (t === "plus") { tb.hours = Math.min(WAIT_CFG.maxHours, tb.hours + 1); sfx("tab"); renderTimeBox(); }
    else if (t === "go") startWait(tb.hours);
    else if (t === "stop") stopWait(true);
  };
}
function waitBlocked() {
  if (othersOnline() > 0) return "Other adventurers are in the world right now, so time can't be sped up. Time only passes faster when you're the only one online.";
  if (!S.zone || !S.zone.safe) return "You can't wait here. Enemies are near. Find a town first.";
  if (player && (!player.alive || player.engaged || S.ko)) return "You can't wait right now.";
  return null;
}
function startWait(h) {
  const why = waitBlocked();
  if (why) { log(why, "sys"); sfx("error"); renderTimeBox(why); return; }
  S.wait = { hours: h, done: 0, total: h * WAIT_CFG.msPerHour };
  UI.timeBox.view = "run";
  sfx("select");
  log("You settle in to wait " + h + (h === 1 ? " hour." : " hours."), "sys");
  drawWait();
}
function drawWait() {
  const w = S.wait; if (!w) return;
  const el = timeBoxEl(), h = w.done / WAIT_CFG.msPerHour;
  el.innerHTML = '<div class="vpT">Waiting…</div><div class="vpB">' + timeNowHTML() + '<div class="tbBar"><i style="width:' + (w.done / w.total * 100).toFixed(1) + '%"></i></div><div class="tbSub">' + Math.floor(h) + " of " + w.hours + ' h</div></div><div class="vpA"><button data-t="stop">Stop</button></div>';
  el.onclick = e => { const b = e.target.closest("button"); if (b && b.dataset.t === "stop") stopWait(true); };
}
function tickWait(dt) {
  const w = S.wait; if (!w) return;
  const why = waitBlocked();
  if (why) { stopWait(false); log("Your wait is interrupted. " + why, "sys"); return; }
  const now = performance.now(), rt = Math.min(1, (now - (w.last || now)) / 1000); w.last = now;
  const step = Math.min(w.total - w.done, rt * WAIT_CFG.msPerHour / WAIT_CFG.secPerHour);
  w.done += step; S.timeShift += step;
  w.ui = (w.ui || 0) + rt;
  if (w.ui > 0.05) { w.ui = 0; drawWait(); }
  if (w.done >= w.total - 1) stopWait(false, true);
}
function stopWait(byPlayer, finished) {
  const w = S.wait; if (!w) return;
  S.wait = null;
  save.timeShift = S.timeShift;
  saveGame();
  const v = vana(), h = Math.round(w.done / WAIT_CFG.msPerHour * 10) / 10;
  log((finished ? "You waited " + w.hours + (w.hours === 1 ? " hour" : " hours") : "You stop waiting after " + h + (h === 1 ? " hour" : " hours")) + ". It is now " + hhmm(v) + " on " + DAY_NAMES[v.dayIndex] + ".", "sys");
  sfx(finished ? "notify" : "close");
  closeTimeBox();
}
function timeSyncCheck() {
  if (!S.timeShift || othersOnline() === 0) return;
  if (S.wait) stopWait(false);
  S.timeShift = 0; save.timeShift = 0;
  log("Another adventurer came online, so your clock rejoins the world's time.", "sys");
}
