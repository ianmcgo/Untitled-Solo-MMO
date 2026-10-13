const S = {
  time: 0, zoneId: "outpost", zone: null, party: [], mobs: [], npcs: [], effects: [], floaters: [], decor: [],
  shake: 0, keys: {}, moveTarget: null, chase: false, pendingTalk: null, zoneCooldown: 0,
  lastCombat: -999, itemReadyAt: 0, mobSeq: 0, spawnAt: [], nmDeadUntil: {}, ko: false, dialog: null,
  modal: null, saveTimer: 0, macroKey: "", macros: [], lastPeriod: null, periodTimer: 0, timeShift: 0,
  sayCooldown: {}, partyKey: "", chain: { n: -1, until: 0 }, lastTab: -9, lmTimer: 0, charId: null
};
let save, player;

const $ = id => document.getElementById(id);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rand = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const normAng = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const an = n => (/^[aeiou]/i.test(n) ? "an " : "a ") + n;
const fmt = s => s < 10 ? s.toFixed(1) : String(Math.ceil(s));
const isMob = e => !!e && e.kind === "mob";
const isParty = e => !!e && (e.kind === "pc" || e.kind === "ally");
const subj = e => e === player ? "You" : isMob(e) ? "The " + e.name : e.name;
const obj = e => e === player ? "you" : isMob(e) ? "the " + e.name : e.name;
const vb = (e, v, s) => e === player ? v : (s || v + "s");
const cls = e => e === player ? "you" : isMob(e) ? "foe" : "ally";

function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

const VANA_EPOCH = Date.UTC(2002, 0, 1);
function vana() {
  const mins = (Date.now() + S.timeShift - VANA_EPOCH) * 25 / 60000;
  const day = Math.floor(mins / 1440);
  const m = mins - day * 1440;
  return { hour: Math.floor(m / 60), minute: Math.floor(m % 60), frac: m / 1440, dayIndex: ((day % 8) + 8) % 8 };
}
function isNight() { const h = vana().hour; return h >= 18 || h < 6; }
function period() { return isNight() ? "night" : "day"; }
function dayElement() { return DAY_ELEMENTS[vana().dayIndex]; }
function clockText() { const v = vana(); return DAY_NAMES[v.dayIndex] + " " + String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0"); }

function popText(e, text, color, size, life, yOff) {
  S.floaters.push({ x: e.x + rand(-10, 10), y: e.y, h: (e.radius || 14) + 4 + (yOff || 0), text: String(text), color, size: size || 16, t: 0, life: life || 1.0 });
}

function ring(e, color, grow, life, kind) {
  S.effects.push({ x: e.x, y: e.y, t: 0, life: life || 0.5, color, r0: e.radius || 14, r1: (e.radius || 14) + (grow || 30), kind: kind || "ring" });
}

function newSkillSet() { return { sword: 0, club: 0, staff: 0, greataxe: 0, h2h: 0, healing: 0, divine: 0, elemental: 0, enfeebling: 0, enhancing: 0 }; }

function newSave() {
  const jobs = {}, skills = {};
  for (const j in JOBS) { jobs[j] = { lv: 1, xp: 0 }; skills[j] = newSkillSet(); }
  return {
    v: 2, name: "Adventurer", mainJob: "WAR", subJob: null, supportUnlocked: false,
    jobs, skills,
    gear: { main: "bronze_sword", head: "bronze_cap", body: "leather_vest" },
    inventory: [{ id: "ash_club", qty: 1 }, { id: "ash_staff", qty: 1 }, { id: "linen_robe", qty: 1 }, { id: "potion", qty: 3 }],
    gil: CONFIG.startGil,
    quests: Object.fromEntries(Object.keys(QUESTS).map(k => [k, "none"])),
    mountLicense: false, jobsUnlocked: { PLD: false, RDM: false }, look: { build: 0, skin: 1, hairStyle: 0, hairColor: 1 },
    hired: [], home: { zone: "outpost", npc: "crystal_town" }, keyItems: [], timers: {}, landmarks: {}, qprog: {}, created: Date.now()
  };
}

function normalizeSave(d) {
  if (!d || typeof d !== "object" || !d.jobs || !d.gear || !Array.isArray(d.inventory)) return null;
  const b = newSave();
  const out = Object.assign(b, d);
  out.jobs = Object.assign(newSave().jobs, d.jobs);
  out.skills = newSave().skills;
  if (d.skills) for (const j in out.skills) Object.assign(out.skills[j], d.skills[j] || {});
  out.quests = Object.assign(newSave().quests, d.quests || {});
  out.look = Object.assign(newSave().look, d.look || {});
  out.mountLicense = !!d.mountLicense;
  out.hired = (Array.isArray(d.hired) ? d.hired : []).filter(id => MERCS[id]).slice(0, CONFIG.maxParty - 1);
  out.home = d.home && ZONES[d.home.zone] && NPCS[d.home.npc] ? d.home : newSave().home;
  out.inventory = d.inventory.filter(s => s && ITEMS[s.id] && s.qty > 0);
  out.gear = {};
  for (const slot of SLOTS) if (d.gear[slot] && ITEMS[d.gear[slot]]) out.gear[slot] = d.gear[slot];
  out.jobsUnlocked = Object.assign(newSave().jobsUnlocked, d.jobsUnlocked || {});
  for (const j in ADVANCED_JOBS) if (out.quests[ADVANCED_JOBS[j].quest] === "done") out.jobsUnlocked[j] = true;
  if (!JOBS[out.mainJob] || !jobUnlockedIn(out, out.mainJob)) out.mainJob = "WAR";
  if (out.subJob && (!JOBS[out.subJob] || !out.supportUnlocked || !jobUnlockedIn(out, out.subJob))) out.subJob = null;
  out.gil = Math.max(0, Math.floor(out.gil || 0));
  out.timers = d.timers && typeof d.timers === "object" ? d.timers : {};
  out.name = String(d.name || "Adventurer").slice(0, 12);
  out.landmarks = d.landmarks && typeof d.landmarks === "object" ? d.landmarks : {};
  out.qprog = d.qprog && typeof d.qprog === "object" ? d.qprog : {};
  return out;
}

const ROSTER_KEY = "usr_roster_v1";
const MAX_CHARS = 8;
const charKey = id => "usr_char_" + id;

function charSummary(id, d, prev) {
  return { id, name: d.name || "Adventurer", job: d.mainJob, lv: d.jobs[d.mainJob].lv, zone: d.home && ZONES[d.home.zone] ? ZONES[d.home.zone].name : "Ashenreach Outpost", look: Object.assign({}, d.look), created: d.created || (prev && prev.created) || Date.now(), played: Date.now(), gil: d.gil };
}

function loadRoster() {
  let r = null;
  try { r = JSON.parse(localStorage.getItem(ROSTER_KEY)); } catch (e) {}
  if (r && Array.isArray(r.chars)) return r;
  r = { chars: [], current: null };
  try {
    const raw = localStorage.getItem(CONFIG.saveKey);
    if (raw) {
      const d = normalizeSave(JSON.parse(raw));
      if (d) {
        const id = "c" + Date.now().toString(36);
        localStorage.setItem(charKey(id), JSON.stringify(d));
        r.chars.push(charSummary(id, d));
        r.current = id;
      }
    }
  } catch (e) {}
  saveRoster(r);
  return r;
}

function saveRoster(r) { try { localStorage.setItem(ROSTER_KEY, JSON.stringify(r)); } catch (e) {} }

function loadChar(id) {
  try {
    const raw = localStorage.getItem(charKey(id));
    if (raw) { const d = normalizeSave(JSON.parse(raw)); if (d) return d; }
  } catch (e) {}
  return null;
}

function createChar(opts) {
  const r = loadRoster();
  const d = newSave();
  d.name = opts.name;
  d.mainJob = JOBS[opts.job] ? opts.job : "WAR";
  d.look = Object.assign(newSave().look, opts.look || {});
  if (d.mainJob === "WHM") { d.gear = { main: "ash_club", head: "bronze_cap", body: "linen_robe" }; d.inventory = [{ id: "bronze_sword", qty: 1 }, { id: "ash_staff", qty: 1 }, { id: "leather_vest", qty: 1 }, { id: "potion", qty: 3 }]; }
  else if (d.mainJob === "BLM") { d.gear = { main: "ash_staff", head: "bronze_cap", body: "linen_robe" }; d.inventory = [{ id: "bronze_sword", qty: 1 }, { id: "ash_club", qty: 1 }, { id: "leather_vest", qty: 1 }, { id: "potion", qty: 3 }]; }
  const id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  try { localStorage.setItem(charKey(id), JSON.stringify(d)); } catch (e) {}
  r.chars.push(charSummary(id, d));
  r.current = id;
  saveRoster(r);
  return id;
}

function deleteChar(id) {
  const r = loadRoster();
  r.chars = r.chars.filter(c => c.id !== id);
  if (r.current === id) r.current = null;
  try { localStorage.removeItem(charKey(id)); } catch (e) {}
  saveRoster(r);
}

function validCharName(name, roster) {
  const n = String(name || "").trim();
  if (n.length < 2 || n.length > 12) return "Names are 2 to 12 letters.";
  if (!/^[A-Za-z][A-Za-z' -]*$/.test(n)) return "Letters only, please.";
  if ((roster || loadRoster()).chars.some(c => c.name.toLowerCase() === n.toLowerCase())) return "You already have a character called " + n + ".";
  return null;
}

function selectChar(id) {
  const d = loadChar(id);
  if (!d) return false;
  const r = loadRoster();
  r.current = id;
  saveRoster(r);
  S.charId = id;
  save = d;
  return true;
}

function saveGame() {
  try {
    const txt = JSON.stringify(save);
    if (S.charId) {
      localStorage.setItem(charKey(S.charId), txt);
      const r = loadRoster();
      const i = r.chars.findIndex(c => c.id === S.charId);
      const sum = charSummary(S.charId, save, i >= 0 ? r.chars[i] : null);
      if (i >= 0) r.chars[i] = sum; else r.chars.push(sum);
      saveRoster(r);
    }
    localStorage.setItem(CONFIG.saveKey, txt);
  } catch (e) {}
}

function loadGame() {
  const r = loadRoster();
  if (r.current && selectChar(r.current)) return save;
  if (r.chars.length && selectChar(r.chars[0].id)) return save;
  return newSave();
}

function exportSaveText() {
  return JSON.stringify({ game: "untitled-solo-rpg", v: 2, saved: new Date().toISOString(), data: save }, null, 1);
}

function importSaveText(text) {
  let d;
  try { d = JSON.parse(text); } catch (e) { return null; }
  if (d && (d.game === "ashenreach" || d.game === "untitled-solo-rpg") && d.data) d = d.data;
  return normalizeSave(d);
}

function jobUnlockedIn(sv, j) { return !!JOBS[j] && (!JOBS[j].advanced || !!(sv.jobsUnlocked && sv.jobsUnlocked[j])); }
function jobUnlocked(j) { return jobUnlockedIn(save, j); }

function capFor(rating, lv) {
  if (!rating || lv < 1) return 0;
  const r = RATING_CAP[rating];
  return Math.floor(r[0] + r[1] * lv);
}

function skillCap(ch, skill) {
  const main = capFor((SKILL_RATINGS[ch.job] || {})[skill], ch.lv);
  const sub = ch.sub && MAGIC_SKILLS.includes(skill) ? capFor((SKILL_RATINGS[ch.sub] || {})[skill], Math.floor(ch.lv / 2)) : 0;
  return Math.max(main, sub);
}

function skillOf(ch, skill) {
  if (ch === player) return Math.min((save.skills[ch.job] || {})[skill] || 0, skillCap(ch, skill));
  return skillCap(ch, skill);
}

function spellSkill(sp) {
  if (sp.kind === "heal") return "healing";
  if (sp.kind === "debuff") return "enfeebling";
  if (sp.kind === "buff") return "enhancing";
  if (sp.kind === "dot" || sp.element === "light") return "divine";
  return "elemental";
}

function trySkillUp(skill, targetLv) {
  if (targetLv != null && targetLv - player.lv <= -4) return;
  const cap = skillCap(player, skill);
  const sk = save.skills[player.job];
  const cur = sk[skill] || 0;
  if (cap <= 0 || cur >= cap) return;
  if (Math.random() >= clamp(0.12 + 0.05 * (cap - cur), 0.05, 0.6)) return;
  const gain = Math.random() < 0.15 ? 0.2 : 0.1;
  const before = Math.floor(cur);
  sk[skill] = Math.min(cap, Math.round((cur + gain) * 10) / 10);
  log("Your " + SKILL_NAMES[skill].toLowerCase() + " skill rises " + gain.toFixed(1) + " points.", "skill");
  const now = Math.floor(sk[skill]);
  if (now > before) {
    log("Your " + SKILL_NAMES[skill].toLowerCase() + " skill reaches level " + now + ".", "skill");
    for (const id in WEAPON_SKILLS) {
      const ws = WEAPON_SKILLS[id];
      if (ws.wtype === skill && ws.skill > before && ws.skill <= now) {
        log("You learn the weapon skill " + ws.name + "!", "loot");
        popText(player, "New: " + ws.name, "#ffd54f", 15, 2, 30);
        sfx("xp");
      }
    }
    buildStats(player);
  }
}

function jobAttr(job, k, lv) { const v = JOBS[job][k]; return v[0] + v[1] * (lv - 1); }

function buildStats(ch) {
  const lv = ch.lv;
  const subLv = ch.sub ? Math.floor(lv / 2) : 0;
  const s = {};
  for (const k of ATTRS) s[k] = jobAttr(ch.job, k, lv) + (subLv > 0 ? jobAttr(ch.sub, k, subLv) * 0.25 : 0);
  const hp = jobAttr(ch.job, "hp", lv) + (subLv > 0 ? jobAttr(ch.sub, "hp", subLv) * 0.4 : 0);
  const mainMp = JOBS[ch.job].mp[0] > 0 ? jobAttr(ch.job, "mp", lv) : 0;
  const subMp = subLv > 0 && JOBS[ch.sub].mp[0] > 0 ? jobAttr(ch.sub, "mp", subLv) : 0;
  const mp = mainMp > 0 ? mainMp + subMp * 0.4 : subMp * 0.5;
  const g = { hp: 0, mp: 0, acc: 0, att: 0, def: 0, eva: 0 };
  for (const k of ATTRS) g[k] = 0;
  let dmg = 3, delay = 2.4, wtype = "h2h";
  for (const slot of SLOTS) {
    const id = ch.gear[slot];
    if (!id) continue;
    const it = ITEMS[id];
    if (it.wtype) { dmg = it.dmg; delay = it.delay; wtype = it.wtype; }
    if (it.stats) for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k];
  }
  for (const k of ATTRS) s[k] = Math.round(s[k] + g[k]);
  s.dmg = dmg;
  s.delay = delay;
  s.wtype = wtype;
  ch.stats = s;
  const wsk = skillOf(ch, wtype);
  s.maxHp = Math.round(hp + g.hp);
  s.maxMp = Math.round(mp + g.mp);
  s.acc = Math.round(58 + s.dex * 0.5 + 0.6 * wsk + lv + g.acc);
  s.att = Math.round(10 + s.str + 4 * lv + g.att);
  s.def = Math.round(8 + s.vit * 0.5 + 3 * lv + g.def);
  s.eva = Math.round(50 + s.agi * 0.5 + 3 * lv + g.eva);
  ch.maxHp = s.maxHp;
  ch.maxMp = s.maxMp;
  ch.delay = delay;
  ch.hp = ch.hp == null ? s.maxHp : Math.min(ch.hp, s.maxHp);
  ch.mp = ch.mp == null ? s.maxMp : Math.min(ch.mp, s.maxMp);
  ch.color = ch.mercId ? MERCS[ch.mercId].color : JOBS[ch.job].color;
}

function makeChar(o) {
  return Object.assign({
    kind: "pc", hp: null, mp: null, tp: 0, x: 0, y: 0, px: 0, py: 0, radius: 14, speed: 140, swingTimer: 2,
    engaged: false, target: null, attackTarget: null, alive: true, casting: null, recasts: {}, buffs: {},
    moving: false, flash: 0, stillSince: 0, regenerating: false, gear: {}, face: 0, lastSwing: -9, lastHit: -9, lastWS: -9
  }, o);
}

function mercGear(m, lv) {
  const role = MERCS[m].role, job = MERCS[m].job;
  if (job === "WAR" && role === "tank") return lv >= 5 ? { main: "bronze_greataxe", head: "bronze_cap", body: "scale_mail", legs: "leather_trousers" } : { main: "bronze_greataxe", head: "bronze_cap", body: "leather_vest", legs: "leather_trousers" };
  if (job === "WAR") return lv >= 6 ? { main: "iron_sword", head: "bronze_cap", body: "scale_mail", hands: "leather_gloves" } : { main: "bronze_sword", head: "bronze_cap", body: "leather_vest", hands: "leather_gloves" };
  if (job === "WHM") return lv >= 5 ? { main: "maple_wand", body: "cotton_robe", feet: lv >= 3 ? "leather_boots" : undefined } : { main: "ash_club", body: "linen_robe" };
  if (job === "PLD") return lv >= 6 ? { main: "iron_sword", head: "bronze_cap", body: "scale_mail", ring: "kite_shield", legs: "leather_trousers" } : { main: "bronze_sword", head: "bronze_cap", body: "leather_vest", ring: "kite_shield" };
  if (job === "RDM") return lv >= 6 ? { main: "iron_sword", body: "scarlet_tabard", hands: "leather_gloves", feet: "leather_boots" } : { main: "bronze_sword", body: "linen_robe", feet: "leather_boots" };
  return lv >= 6 ? { main: "holly_staff", body: "cotton_robe" } : { main: "ash_staff", body: "linen_robe" };
}

function makeMerc(id) {
  return makeChar({ kind: "ally", mercId: id, name: MERCS[id].name, job: MERCS[id].job, sub: null, role: MERCS[id].role, speed: 150, nextNuke: 0 });
}

function refreshPlayer(full) {
  player.job = save.mainJob;
  player.sub = save.supportUnlocked ? save.subJob : null;
  player.lv = save.jobs[save.mainJob].lv;
  player.gear = save.gear;
  if (full) { player.hp = null; player.mp = null; }
  buildStats(player);
  syncAllies(full);
}

function syncAllies(full) {
  for (const a of S.party) {
    if (a === player) continue;
    const hpPct = a.maxHp ? a.hp / a.maxHp : 1;
    const mpPct = a.maxMp ? a.mp / a.maxMp : 1;
    a.lv = player.lv;
    a.gear = mercGear(a.mercId, a.lv);
    a.hp = null; a.mp = null;
    buildStats(a);
    if (!full && a.alive && hpPct > 0) { a.hp = Math.max(1, Math.round(a.maxHp * hpPct)); a.mp = Math.round(a.maxMp * mpPct); }
    if (!a.alive) a.hp = 0;
  }
}

function rebuildParty() {
  const old = S.party;
  S.party = [player];
  save.hired.forEach((id, i) => {
    let m = old.find(p => p.mercId === id);
    if (!m) {
      m = makeMerc(id);
      m.lv = player.lv;
      m.gear = mercGear(id, m.lv);
      buildStats(m);
      const o = followOffset(i + 1);
      m.x = player.x + o.x; m.y = player.y + o.y; m.px = m.x; m.py = m.y;
      m.mounted = !!player.mounted;
    }
    S.party.push(m);
  });
  uiPartyChanged();
}

function mercAvailable(id) {
  const r = MERCS[id].requires;
  if (!JOBS[MERCS[id].job]) return false;
  if (r && r.quest && save.quests[r.quest] !== "done") return false;
  if (r && r.job && !jobUnlocked(r.job)) return false;
  return true;
}

function mercLockedReason(id) {
  const r = MERCS[id].requires || {};
  if (r.job) return "Unlocks with the " + JOBS[r.job].name + " job (Tobin, level " + ADVANCED_JOBS[r.job].lv + ")";
  if (r.quest) return "Unlocks after " + QUESTS[r.quest].name;
  return "";
}

function hireMerc(id) {
  const m = MERCS[id];
  if (!mercAvailable(id) || save.hired.includes(id)) return;
  if (save.hired.length >= CONFIG.maxParty - 1) { log("Your party is full. Dismiss someone first.", "sys"); sfx("error"); return; }
  if (save.gil < m.fee) { log("You can't afford " + m.name + "'s fee (" + m.fee + " gil).", "sys"); sfx("error"); return; }
  save.gil -= m.fee;
  save.hired.push(id);
  rebuildParty();
  log("You hire " + m.name + " for " + m.fee + " gil.", "loot");
  partySay(S.party.find(p => p.mercId === id), "hire", true);
  sfx("unlock");
  saveGame();
}

function dismissMerc(id) {
  const i = save.hired.indexOf(id);
  if (i < 0) return;
  save.hired.splice(i, 1);
  rebuildParty();
  log(MERCS[id].name + " leaves the party.", "sys");
  saveGame();
}

function partySay(m, kind, force) {
  if (!m || !m.alive && kind !== "ko") return;
  const key = m.mercId || m.name;
  if (!force && S.time < (S.sayCooldown[key] || 0)) return;
  if (!force && Math.random() > 0.6) return;
  S.sayCooldown[key] = S.time + 8;
  log(m.name + ": " + pick(MERC_LINES[kind]), "party");
}

function followOffset(i) {
  const offs = [{ x: 0, y: 0 }, { x: -40, y: 26 }, { x: -40, y: -26 }, { x: -72, y: 0 }, { x: -76, y: 42 }, { x: -76, y: -42 }];
  return offs[i] || offs[5];
}

function famOf(key) {
  if (FAMILIES[key]) return FAMILIES[key];
  const n = NM_FAMILIES[key];
  if (!n) return null;
  if (!n._merged) n._merged = Object.assign({}, FAMILIES[n.base], n, { nm: true, linkGroup: FAMILIES[n.base].linkGroup || n.base, key });
  return n._merged;
}

function buildMob(famKey, L, x, y, spawnIdx) {
  const f = famOf(famKey);
  const st = { str: 6 + 0.9 * L, dex: 6 + 0.8 * L, vit: 6 + 0.8 * L, agi: 6 + 0.8 * L, int: (f.int || 6) + 0.7 * L, mnd: 6 + 0.7 * L };
  for (const k of ATTRS) st[k] = Math.round(st[k]);
  st.maxHp = Math.round((70 + 40 * L) * f.hpMul);
  st.att = Math.round((16 + 5.5 * L) * f.attMul);
  st.def = Math.round((10 + 4.5 * L) * f.defMul);
  st.acc = Math.round(62 + 4 * L);
  st.eva = Math.round(48 + 3.5 * L + (f.eva || 0));
  st.dmg = 6 + 1.25 * L;
  st.delay = f.delay;
  return {
    id: ++S.mobSeq, kind: "mob", famKey, fam: f, name: f.name, lv: L, stats: st, hp: st.maxHp, maxHp: st.maxHp, mp: 0, maxMp: 0, tp: 0,
    x, y, px: x, py: y, home: { x, y }, radius: Math.round(f.radius * (f.scale || 1)), color: f.color, speed: f.speed, delay: f.delay, swingTimer: f.delay,
    state: "idle", enmity: new Map(), face: Math.random() * Math.PI * 2, alive: true, buffs: {}, chain: null, burst: null,
    spawnIdx, wanderTimer: 0, wanderDir: { x: 0, y: 0 }, readying: null, flash: 0, casting: null, recasts: {}, deadAt: 0, target: null, moving: false,
    lastSwing: -9, lastHit: -9, lastWS: -9
  };
}

function stat(e, k) {
  let v = e.stats[k];
  const b = e.buffs;
  if (k === "att" && b.berserk) v *= 1.25;
  if (k === "def" && b.berserk) v *= 0.75;
  if (k === "def" && b.dia) v *= 0.9;
  if (k === "def" && b.sentinel) v *= 1.5;
  if (k === "def" && b.protect) v *= 1.15;
  if (k === "acc" && b.flash) v *= 0.6;
  return v;
}

function hitChance(a, d, bonus) { return clamp(75 + (stat(a, "acc") + (bonus || 0) - stat(d, "eva")) / 2, CONFIG.hitFloor, CONFIG.hitCap); }

function pDIF(a, d) {
  const r = stat(a, "att") / Math.max(1, stat(d, "def"));
  return rand(clamp(r - 0.375, 0, 2), clamp(r + 0.375, 0.5, 2));
}

function baseDmg(a, d) { return Math.max(1, a.stats.dmg + clamp(Math.floor((a.stats.str - d.stats.vit) / 4), -4, 8)); }

function ftpAt(tp, table) {
  const t = clamp((tp - 1000) / 1000, 0, 2);
  const i = Math.min(1, Math.floor(t));
  return table[i] + (table[i + 1] - table[i]) * (t - i);
}

function findChain(openProps, closeProps) {
  for (const [o, c, r] of SC_TABLE) if (openProps.includes(o) && closeProps.includes(c)) return r;
  return null;
}

function recastLeft(e, key) { return Math.max(0, (e.recasts[key] || 0) - S.time); }

function addEnmity(m, e, amt) {
  if (!e || !e.alive || !isParty(e) || !m.alive) return;
  if (e.buffs && e.buffs.sentinel) amt *= 2;
  m.enmity.set(e, (m.enmity.get(e) || 0) + amt);
}

function swingDelay(e) { return e.delay * (e.buffs && e.buffs.slow ? 1.25 : 1); }

function topEnmity(m) {
  let best = null, bv = -1;
  for (const [e, v] of m.enmity) {
    if (!e.alive) { m.enmity.delete(e); continue; }
    if (v > bv) { bv = v; best = e; }
  }
  return best;
}

function inCombatWith(e) {
  return S.mobs.some(m => m.alive && m.state === "combat" && m.enmity.has(e));
}

function aggro(m, t) {
  if (!m.alive || !t || !t.alive || !isParty(t)) return;
  if (!m.enmity.has(t)) m.enmity.set(t, 1);
  if (m.state === "combat") return;
  m.state = "combat";
  m.swingTimer = Math.max(m.swingTimer, 1.2);
  log("The " + m.name + " notices " + obj(t) + "!", "foe");
  popText(m, "!", "#ff5252", 22, 0.8);
  sfx("aggro", m);
  if (!m.fam.link) return;
  const grp = m.fam.linkGroup || m.famKey;
  for (const o of S.mobs) {
    if (o === m || !o.alive || o.state === "combat" || !o.fam.link) continue;
    if ((o.fam.linkGroup || o.famKey) !== grp || dist(o, m) > CONFIG.linkRange) continue;
    o.state = "combat";
    o.enmity.set(t, 1);
    o.swingTimer = 1.5;
    log("The " + o.name + " links!", "foe");
    popText(o, "!", "#ff5252", 22, 0.8);
  }
}

function touch(e) { if (isParty(e)) e.stillSince = S.time; }

function applyDamage(src, tgt, amt, opt) {
  opt = opt || {};
  if (!tgt.alive) return;
  amt = Math.max(0, Math.round(amt));
  tgt.hp = Math.max(0, tgt.hp - amt);
  tgt.flash = 0.15;
  tgt.lastHit = S.time;
  if (opt.pop !== false) popText(tgt, opt.text != null ? opt.text : amt, opt.color || (isMob(tgt) ? (src === player ? "#ffffff" : "#b3d9ff") : "#ff8a80"), opt.size || 16, opt.life, opt.yOff);
  if (isMob(tgt)) {
    if (src && isParty(src)) {
      addEnmity(tgt, src, opt.enmity != null ? opt.enmity : 40 + amt * 2);
      aggro(tgt, src);
    }
  } else {
    touch(tgt);
    if (tgt.mounted) dismount("You're thrown from the saddle!");
    if (tgt.casting && Math.random() < CONFIG.interruptChance) interruptCast(tgt);
  }
  if (tgt.hp <= 0) onKO(tgt, src);
}

function swing(a, d) {
  const tpGain = Math.round(CONFIG.tpPerDelay * a.delay);
  a.lastSwing = S.time;
  if (a.buffs && a.buffs.paralyze && Math.random() < 0.25) {
    log(subj(a) + " " + vb(a, "are", "is") + " paralyzed.", cls(a));
    popText(a, "Paralyzed", "#b3e5fc", 13, 0.9, 10);
    return;
  }
  if (a === player) trySkillUp(a.stats.wtype, d.lv);
  if (Math.random() * 100 >= hitChance(a, d)) {
    log(subj(a) + " " + vb(a, "miss", "misses") + " " + obj(d) + ".", cls(a));
    popText(d, "Miss", "#bbbbbb", 14, 0.8);
    sfx("miss", a);
    vfx("miss", { src: a, tgt: d });
    if (isMob(d)) aggro(d, a);
    return;
  }
  const crit = Math.random() * 100 < CONFIG.critPct;
  const dmg = Math.floor(baseDmg(a, d) * pDIF(a, d) * (crit ? CONFIG.critMult : 1));
  a.tp = Math.min(CONFIG.tpMax, a.tp + tpGain);
  d.tp = Math.min(CONFIG.tpMax, d.tp + Math.round(tpGain / 3));
  if (crit) S.shake = Math.max(S.shake, 0.1);
  const wt = isMob(a) ? "blunt" : (a.stats.wtype === "sword" || a.stats.wtype === "greataxe" ? "slash" : "blunt");
  sfx(crit ? "crit" : wt === "slash" ? "slash" : "blunt", a);
  vfx("hit", { src: a, tgt: d, crit, slash: wt === "slash" });
  log(subj(a) + " " + vb(a, "hit") + " " + obj(d) + " for " + dmg + (crit ? " (critical)" : "") + ".", cls(a));
  applyDamage(a, d, dmg, { text: crit ? dmg + "!" : dmg, color: crit ? "#ffeb3b" : undefined, size: crit ? 21 : 16 });
}

function onKO(e, src) {
  e.alive = false;
  e.engaged = false;
  e.casting = null;
  e.readying = null;
  e.attackTarget = null;
  if (isMob(e)) {
    e.deadAt = S.time;
    log("The " + e.name + " is defeated.", "you");
    sfx("defeat", e);
    vfx("defeat", { tgt: e });
    const respawn = e.fam.respawn || CONFIG.respawn;
    const placeholderNm = !!NM_FAMILIES[e.famKey];
    S.spawnAt[e.spawnIdx] = S.time + (placeholderNm ? CONFIG.respawn : respawn);
    if (e.fam.nm) {
      save.timers["nm:" + e.famKey] = Date.now() + respawn * 1000;
      if (!placeholderNm) S.nmDeadUntil[S.zoneId + ":" + e.spawnIdx] = S.time + respawn;
    }
    for (const p of S.party) if (p.attackTarget === e) { p.attackTarget = null; p.engaged = false; }
    if (S.chase && player.attackTarget == null) S.chase = false;
    const byParty = [...e.enmity.keys()].some(isParty);
    if (byParty || (src && isParty(src))) {
      const xp = xpFor(e.lv, player.lv);
      if (xp > 0) { const ch = advanceChain(); gainXp(Math.round(xp * (1 + CONFIG.chainStep * ch)), ch); } else log("No experience gained (too weak).", "sys");
      dropLoot(e);
      for (const id in QUESTS) {
        const q = QUESTS[id];
        if (!q.kill || save.quests[id] !== "active") continue;
        if (q.kill.fam !== e.famKey) continue;
        const n = (save.qprog[id] || 0) + 1;
        save.qprog[id] = Math.min(q.kill.n, n);
        if (n <= q.kill.n) { log("Quest progress: " + q.kill.name + " " + Math.min(n, q.kill.n) + "/" + q.kill.n + ".", "npc"); if (n === q.kill.n) { log("Quest updated: report to " + q.giver + ".", "npc"); sfx("notify"); } }
      }
      if (e.famKey === "chieftain" && save.quests.chieftain === "active") {
        save.quests.chieftain = "killed";
        log("Quest updated: report the Chieftain's defeat to Captain Rhea.", "npc");
        sfx("notify");
      }
      const talker = S.party.filter(p => p !== player && p.alive);
      if (talker.length && Math.random() < 0.3) partySay(pick(talker), "victory");
    }
  } else {
    e.hp = 0;
    e.tp = 0;
    log(e === player ? "You were defeated." : e.name + " was defeated.", "foe");
    sfx("ko", e);
    vfx("ko", { tgt: e });
    e.mounted = false;
    if (e === player) for (const p of S.party) p.mounted = false;
    for (const m of S.mobs) m.enmity.delete(e);
    if (e !== player) partySay(e, "ko", true);
    if (e === player) { S.ko = true; S.chase = false; S.moveTarget = null; showKO(true); }
  }
}

function xpFor(mobLv, plLv) {
  const d = mobLv - plLv;
  if (d <= -4) return 0;
  return Math.round((25 + 15 * mobLv) * clamp(1 + 0.2 * d, 0.2, 2));
}

function advanceChain() {
  const c = S.chain;
  c.n = S.time < c.until ? Math.min(c.n + 1, CONFIG.chainMax) : 0;
  c.until = S.time + CONFIG.chainWindow;
  return c.n;
}

function chainInfo() {
  const c = S.chain;
  if (c.n < 0 || S.time >= c.until) return null;
  return { n: c.n, left: c.until - S.time, frac: (c.until - S.time) / CONFIG.chainWindow, next: Math.min(c.n + 1, CONFIG.chainMax) };
}

function xpNeed(lv) { return lv >= CONFIG.levelCap ? 0 : CONFIG.xpTable[lv]; }

function gainXp(n, chain, quiet) {
  const j = save.jobs[save.mainJob];
  if (j.lv >= CONFIG.levelCap) { if (!quiet) log("You are at the level cap.", "sys"); return; }
  j.xp += n;
  log((chain > 0 ? "EXP chain #" + chain + "! " : "") + "You gain " + n + " experience points.", "you");
  popText(player, "+" + n + " XP" + (chain > 0 ? " · Chain " + chain : ""), chain > 0 ? "#ffd54f" : "#9ad06b", 14, 1.2, 16);
  let leveled = false;
  while (j.lv < CONFIG.levelCap && j.xp >= xpNeed(j.lv)) { j.xp -= xpNeed(j.lv); j.lv++; leveled = true; }
  if (j.lv >= CONFIG.levelCap) j.xp = 0;
  if (leveled) {
    refreshPlayer(true);
    log("You reach level " + j.lv + "!", "loot");
    popText(player, "Level Up!", "#ffd54f", 24, 2, 30);
    ring(player, "#ffd54f", 50, 0.9, "burst");
    S.shake = 0.2;
    sfx("levelup");
    vfx("levelup", { tgt: player });
  }
  saveGame();
}

function invCount(id) { return save.inventory.filter(s => s.id === id).reduce((n, s) => n + s.qty, 0); }

function giveItem(id, n, quiet) {
  const it = ITEMS[id];
  const stack = it.stack || 1;
  let left = n;
  for (const s of save.inventory) {
    if (left <= 0) break;
    if (s.id === id && s.qty < stack) { const add = Math.min(stack - s.qty, left); s.qty += add; left -= add; }
  }
  while (left > 0) {
    if (save.inventory.length >= CONFIG.inventorySize) { log("Your inventory is full. " + it.name + " is lost.", "sys"); return false; }
    const add = Math.min(stack, left);
    save.inventory.push({ id, qty: add });
    left -= add;
  }
  if (!quiet) { log("You obtain " + (n > 1 ? n + " " + it.name + "s" : an(it.name)) + ".", "loot"); sfx("loot"); uiEvent("item", { id, n }); }
  return true;
}

function removeItem(id, n) {
  if (invCount(id) < n) return false;
  let left = n;
  for (let i = save.inventory.length - 1; i >= 0 && left > 0; i--) {
    const s = save.inventory[i];
    if (s.id !== id) continue;
    const take = Math.min(s.qty, left);
    s.qty -= take;
    left -= take;
    if (s.qty <= 0) save.inventory.splice(i, 1);
  }
  return true;
}

function hasItem(id) { return invCount(id) > 0 || Object.values(save.gear).includes(id); }

function itemRarity(id) {
  const it = ITEMS[id];
  if (!it) return "common";
  if (it.rarity) return it.rarity;
  if (it.rare) return "rare";
  if (it.hq || ["iron_ore", "iron_ingot", "bone_chip", "silk_cloth", "hi_potion"].includes(id)) return "uncommon";
  return "common";
}

function dropLoot(m) {
  for (const [id, chance, minLv] of m.fam.loot || []) {
    if (minLv && m.lv < minLv) continue;
    if (Math.random() >= chance) continue;
    if (ITEMS[id].rare && hasItem(id)) { log("You already possess " + an(ITEMS[id].name) + ". It is lost.", "sys"); continue; }
    giveItem(id, 1);
  }
  if (m.fam.gil) {
    const g = Math.round(rand(m.fam.gil[0], m.fam.gil[1]) * m.lv);
    save.gil += g;
    log("You obtain " + g + " gil.", "loot");
    sfx("coin");
  }
}

function knows(ch, sp) {
  const subLv = ch.sub ? Math.floor(ch.lv / 2) : 0;
  for (const j in sp.jobs) {
    if (j === ch.job && sp.jobs[j] <= ch.lv) return true;
    if (j === ch.sub && subLv > 0 && sp.jobs[j] <= subLv) return true;
  }
  return false;
}

function actionList(ch) {
  const out = [];
  const subLv = ch.sub ? Math.floor(ch.lv / 2) : 0;
  const wsk = Math.floor(skillOf(ch, ch.stats.wtype));
  for (const id in WEAPON_SKILLS) { const ws = WEAPON_SKILLS[id]; if (ws.wtype === ch.stats.wtype && ws.skill <= wsk) out.push({ kind: "ws", id, name: ws.name }); }
  for (const id in ABILITIES) { const ab = ABILITIES[id]; if ((ab.job === ch.job && ab.lv <= ch.lv) || (ab.job === ch.sub && subLv > 0 && ab.lv <= subLv)) out.push({ kind: "ja", id, name: ab.name }); }
  for (const id in SPELLS) if (knows(ch, SPELLS[id])) out.push({ kind: "ma", id, name: SPELLS[id].name });
  return out;
}

function checkAction(a, act, t) {
  if (!a.alive) return "You are KO'd.";
  if (a.casting) return "You are casting.";
  if (act.kind === "ws") {
    if (a.tp < 1000) return "Not enough TP.";
    if (!a.engaged || !t || !isMob(t) || !t.alive) return "You must be engaged to use a weapon skill.";
    if (dist(a, t) > CONFIG.meleeRange) return "Target is out of range.";
    return "";
  }
  if (act.kind === "ja") {
    const ab = ABILITIES[act.id];
    if (recastLeft(a, "ja:" + act.id) > 0) return ab.name + " is not ready.";
    if (ab.target === "enemy") {
      if (!t || !isMob(t) || !t.alive) return "No valid target.";
      if (dist(a, t) > CONFIG.abilityRange) return "Target is out of range.";
    }
    return "";
  }
  if (act.kind === "ma") {
    const sp = SPELLS[act.id];
    if (recastLeft(a, "ma:" + act.id) > 0) return sp.name + " is not ready.";
    if (a.mp < sp.mp) return "Not enough MP.";
    if (sp.target === "enemy" && (!t || !isMob(t) || !t.alive)) return "No valid target.";
    if (sp.target === "ally" && (!t || !isParty(t) || !t.alive)) return "Invalid target.";
    if (dist(a, t) > CONFIG.castRange) return "Target is out of range.";
    return "";
  }
  return "";
}

function perform(a, act, t) {
  if (a.resting) standUp(a, a !== player);
  touch(a);
  if (act.kind === "ws") doWS(a, act.id, t);
  else if (act.kind === "ja") doAbility(a, act.id, t);
  else if (act.kind === "ma") startCast(a, act.id, t);
}

function doWS(a, id, t) {
  const ws = WEAPON_SKILLS[id];
  const tpUsed = a.tp;
  a.tp = 0;
  a.lastWS = S.time;
  a.face = Math.atan2(t.y - a.y, t.x - a.x);
  const fTP = ftpAt(tpUsed, ws.ftp);
  log(subj(a) + " " + vb(a, "use") + " " + ws.name + " (" + tpUsed + " TP).", cls(a));
  popText(a, ws.name, "#ffd54f", 13, 1.2, 14);
  sfx("ws", a);
  vfx("ws", { src: a, tgt: t, ws });
  if (Math.random() * 100 >= hitChance(a, t, CONFIG.wsAccBonus)) {
    log(subj(a) + " " + vb(a, "miss", "misses") + "! " + ws.name + " has no effect.", cls(a));
    popText(t, "Miss", "#bbbbbb", 18, 0.9);
    ring(t, "#888888", 20, 0.4);
    aggro(t, a);
    return;
  }
  const dmg = Math.max(1, Math.floor(baseDmg(a, t) * fTP * pDIF(a, t)));
  t.tp = Math.min(CONFIG.tpMax, t.tp + 40);
  ring(t, "#ffd54f", 40, 0.5);
  S.shake = Math.max(S.shake, 0.2);
  log("The " + t.name + " takes " + dmg + " damage.", cls(a));
  vfx("wsHit", { src: a, tgt: t, ws });
  applyDamage(a, t, dmg, { color: "#ffd54f", size: 26, life: 1.3, enmity: 80 + dmg * 2 });
  resolveChain(a, t, ws, dmg);
}

function resolveChain(a, t, ws, dmg) {
  if (!t.alive) return;
  const now = S.time;
  const c = t.chain;
  const result = c && now >= c.openAt && now <= c.closeAt ? findChain(c.props, ws.props) : null;
  if (!result) {
    t.chain = { props: ws.props.slice(), lv: 0, name: ws.name, openAt: now + CONFIG.chainDelay, closeAt: now + CONFIG.chainDelay + CONFIG.chainWindow, by: a };
    if (a !== player) partySay(a, "ws");
    return;
  }
  const p = SC_PROPS[result];
  const scDmg = Math.max(1, Math.floor(dmg * CONFIG.scMult[p.lv]));
  const col = ELEMENT_COLORS[p.el[0]];
  log("Skillchain: " + result + "! The " + t.name + " takes " + scDmg + " damage.", "sc");
  popText(t, "Skillchain: " + result, col, 18, 1.8, 38);
  p.el.forEach((el, i) => ring(t, ELEMENT_COLORS[el], 55 + i * 20, 0.8, "pillar"));
  S.shake = Math.max(S.shake, 0.3);
  sfx("skillchain", t);
  vfx("skillchain", { tgt: t, name: result, el: p.el, lv: p.lv });
  if (a !== player) partySay(a, "close");
  applyDamage(a, t, scDmg, { color: col, size: 24, life: 1.4, enmity: scDmg, yOff: 14 });
  if (!t.alive) return;
  t.burst = { el: p.el, lv: p.lv, name: result, until: now + CONFIG.burstWindow };
  t.chain = { props: [result], lv: p.lv, name: result, openAt: now + CONFIG.chainDelay, closeAt: now + CONFIG.chainDelay + CONFIG.chainWindow, by: a };
}

function doAbility(a, id, t) {
  const ab = ABILITIES[id];
  a.recasts["ja:" + id] = S.time + ab.recast;
  if (id === "provoke") {
    log(subj(a) + " " + vb(a, "use") + " Provoke on the " + t.name + ".", cls(a));
    ring(t, "#ff5252", 30, 0.5);
    popText(t, "Provoke", "#ff8a80", 13, 1);
    sfx("provoke", a);
    vfx("provoke", { src: a, tgt: t });
    addEnmity(t, a, ab.enmity);
    aggro(t, a);
    if (a !== player) partySay(a, "provoke");
    return;
  }
  if (id === "shield_bash") {
    const dmg = Math.max(1, Math.round((8 + a.lv * 3) * rand(0.9, 1.1)));
    log(subj(a) + " " + vb(a, "use") + " Shield Bash on the " + t.name + " for " + dmg + " damage.", cls(a));
    sfx("blunt", a);
    vfx("hit", { src: a, tgt: t, crit: true, slash: false });
    if (t.readying) { t.readying = null; log("The " + t.name + "'s " + t.fam.tpMove.name + " is interrupted!", cls(a)); popText(t, "Interrupted", "#bbbbbb", 12, 0.9, 14); sfx("interrupt", t); }
    if (t.casting) interruptCast(t);
    applyDamage(a, t, dmg, { enmity: ab.enmity });
    if (t.alive) aggro(t, a);
    return;
  }
  if (id === "convert") {
    const hp = a.hp, mp = a.mp;
    a.hp = Math.max(1, Math.min(a.maxHp, mp));
    a.mp = Math.min(a.maxMp, hp);
    log(subj(a) + " " + vb(a, "use") + " Convert. HP " + hp + " → " + a.hp + ", MP " + mp + " → " + a.mp + ".", cls(a));
    popText(a, "Convert", "#f48fb1", 14, 1.2, 14);
    ring(a, "#f48fb1", 30, 0.6);
    sfx("buff", a);
    vfx("buff", { tgt: a, id: "convert" });
    return;
  }
  a.buffs[ab.buff] = { until: S.time + ab.dur };
  log(subj(a) + " " + vb(a, "use") + " " + ab.name + ".", cls(a));
  popText(a, ab.name, "#9ad06b", 13, 1.2, 14);
  ring(a, "#9ad06b", 26, 0.5);
  sfx("buff", a);
  vfx("buff", { tgt: a, id: ab.buff });
}

function startCast(a, id, t) {
  const sp = SPELLS[id];
  a.casting = { id, sp, t, start: S.time, end: S.time + sp.cast };
  if (t !== a) a.face = Math.atan2(t.y - a.y, t.x - a.x);
  if (a === player) { S.moveTarget = null; S.chase = false; }
  log(subj(a) + " " + vb(a, "start") + " casting " + sp.name + (t !== a ? " on " + obj(t) : "") + ".", cls(a));
  sfx("cast", a);
  vfx("cast", { src: a, sp });
}

function interruptCast(e) {
  if (!e.casting) return;
  log(e === player ? "Your casting is interrupted." : e.name + "'s casting is interrupted.", cls(e));
  popText(e, "Interrupted", "#bbbbbb", 12, 0.9, 14);
  sfx("interrupt", e);
  vfx("interrupt", { tgt: e });
  e.casting = null;
}

function finishCast(a) {
  const { sp, t, id } = a.casting;
  a.casting = null;
  if (!t.alive) { log(sp.name + " fizzles: the target is gone.", cls(a)); return; }
  if (a.mp < sp.mp) { log("Not enough MP for " + sp.name + ".", cls(a)); return; }
  if (dist(a, t) > CONFIG.castRange + 40) { log(sp.name + " fizzles: the target moved out of range.", cls(a)); return; }
  a.mp -= sp.mp;
  a.recasts["ma:" + id] = S.time + sp.recast;
  touch(a);
  if (a === player) trySkillUp(spellSkill(sp), isMob(t) ? t.lv : null);
  if (sp.kind === "heal") castHeal(a, t, sp);
  else if (sp.kind === "nuke") castNuke(a, t, sp);
  else if (sp.kind === "dot") castDia(a, t, sp);
  else if (sp.kind === "debuff") castDebuff(a, t, sp);
  else if (sp.kind === "buff") castBuff(a, t, sp);
  if (a !== player && a.mp < a.maxMp * 0.15) partySay(a, "lowmp");
}

function castHeal(a, t, sp) {
  let amt = (sp.power + a.stats.mnd * sp.mnd + skillOf(a, "healing") * 0.3) * (1 + 0.06 * (a.lv - 1));
  if (a.buffs.divine_seal) { amt *= 2; delete a.buffs.divine_seal; }
  amt = Math.round(amt * rand(0.95, 1.05));
  const real = Math.min(amt, t.maxHp - t.hp);
  t.hp += real;
  popText(t, "+" + real, "#9ad06b", 18);
  ring(t, "#9ad06b", 30, 0.6, "sparkle");
  sfx("cure", t);
  vfx("cure", { src: a, tgt: t, big: sp.power > 40 });
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". " + subj(t) + " " + vb(t, "recover") + " " + real + " HP.", cls(a));
  if (a !== player && t !== a) partySay(a, "cure");
  for (const m of S.mobs) if (m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty)) addEnmity(m, a, real * 1.5);
}

function magicHit(a, t, sp) {
  return clamp(70 + 0.8 * skillOf(a, spellSkill(sp)) - 3.5 * t.lv + 3 * (a.lv - t.lv) + 3.5 * a.lv, 25, 95);
}

function castNuke(a, t, sp) {
  const dStat = Math.max(0, a.stats[sp.stat] - t.stats[sp.stat]);
  let dmg = (sp.power + 1.5 * dStat) * (1 + 0.08 * (a.lv - 1));
  dmg *= (t.fam.weak && t.fam.weak[sp.element]) || 1;
  if (sp.element === dayElement()) dmg *= 1.1;
  let resist = 1;
  if (Math.random() * 100 >= magicHit(a, t, sp)) resist = Math.random() < 0.75 ? 0.5 : 0.25;
  dmg *= resist;
  if (a.buffs.elemental_seal) { dmg *= 1.5; delete a.buffs.elemental_seal; }
  let burst = false;
  if (t.burst && S.time <= t.burst.until && t.burst.el.includes(sp.element)) { dmg *= CONFIG.burstMult[t.burst.lv]; burst = true; }
  dmg = Math.max(1, Math.round(dmg * rand(0.95, 1.05)));
  const col = ELEMENT_COLORS[sp.element];
  ring(t, col, 36, 0.6, "element");
  sfx(sp.element, t);
  vfx("nuke", { src: a, tgt: t, el: sp.element, resisted: resist < 1 });
  if (burst) {
    popText(t, "Magic Burst!", col, 18, 1.6, 38);
    ring(t, col, 70, 0.8, "burst");
    S.shake = Math.max(S.shake, 0.25);
    sfx("burst", t);
    vfx("burst", { tgt: t, el: sp.element });
    if (a !== player) partySay(a, "burst", true);
  }
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". " + (burst ? "Magic Burst! " : "") + "The " + t.name + " takes " + dmg + " damage" + (resist < 1 ? " (resisted)" : "") + ".", burst ? "sc" : cls(a));
  applyDamage(a, t, dmg, { color: col, size: burst ? 26 : 20, enmity: 60 + dmg * 1.5 });
}

function castDebuff(a, t, sp) {
  const col = ELEMENT_COLORS[sp.element] || "#ddd";
  const landed = sp.buff === "flash" || Math.random() * 100 < magicHit(a, t, sp) + 10;
  ring(t, col, 30, 0.5, "element");
  sfx(sp.element === "light" ? "light" : "cast", t);
  vfx("nuke", { src: a, tgt: t, el: sp.element, dia: true });
  if (!landed) { log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ", but the " + t.name + " resists.", cls(a)); popText(t, "Resist", "#bbbbbb", 13, 0.9); addEnmity(t, a, 20); aggro(t, a); return; }
  t.buffs[sp.buff] = { until: S.time + sp.dur, src: a };
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " is " + { flash: "blinded", slow: "slowed", paralyze: "paralyzed" }[sp.buff] + ".", cls(a));
  popText(t, sp.name, col, 14, 1.1);
  addEnmity(t, a, sp.enmity || 60);
  aggro(t, a);
}

function castBuff(a, t, sp) {
  t.buffs[sp.buff] = { until: S.time + sp.dur, src: a };
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + " on " + obj(t) + ".", cls(a));
  popText(t, sp.name, "#9ad06b", 13, 1.1, 14);
  ring(t, "#9ad06b", 26, 0.5);
  sfx("buff", t);
  vfx("buff", { tgt: t, id: sp.buff });
  for (const m of S.mobs) if (m.alive && m.state === "combat" && m.enmity.has(t)) addEnmity(m, a, 30);
}

function castDia(a, t, sp) {
  const dmg = Math.round(sp.power * (1 + 0.08 * (a.lv - 1)));
  ring(t, ELEMENT_COLORS.light, 30, 0.5, "element");
  sfx("light", t);
  vfx("nuke", { src: a, tgt: t, el: "light", dia: true });
  log(subj(a) + " " + vb(a, "cast") + " Dia. The " + t.name + " takes " + dmg + " damage and is afflicted with Dia.", cls(a));
  applyDamage(a, t, dmg, { color: ELEMENT_COLORS.light, size: 16, enmity: 120 });
  if (t.alive) t.buffs.dia = { until: S.time + 30, next: S.time + 3, tick: Math.max(1, Math.round(1 + a.lv * 0.4)), src: a };
}

function useItem(id) {
  const it = ITEMS[id];
  if (!player.alive || !it) return;
  if (player.casting) { log("You cannot use items while casting.", "sys"); return; }
  if (S.time < S.itemReadyAt) { log("You must wait " + fmt(S.itemReadyAt - S.time) + "s to use another item.", "sys"); return; }
  if (invCount(id) < 1) return;
  if (it.heal) {
    const real = Math.min(it.heal, player.maxHp - player.hp);
    player.hp += real;
    popText(player, "+" + real, "#9ad06b", 18);
    log("You use " + an(it.name) + " and recover " + real + " HP.", "you");
  } else if (it.mpRestore) {
    const real = Math.min(it.mpRestore, player.maxMp - player.mp);
    player.mp += real;
    popText(player, "+" + real + " MP", "#64b5f6", 16);
    log("You use " + an(it.name) + " and recover " + real + " MP.", "you");
  } else return;
  ring(player, "#9ad06b", 24, 0.4, "sparkle");
  sfx("potion", player);
  vfx("potion", { tgt: player, mp: !!it.mpRestore });
  removeItem(id, 1);
  S.itemReadyAt = S.time + CONFIG.itemRecast;
}

function tickBuffs(e) {
  for (const id in e.buffs) {
    const b = e.buffs[id];
    if (id === "dia" && S.time >= b.next && e.alive) {
      b.next += 3;
      applyDamage(b.src, e, b.tick, { color: ELEMENT_COLORS.light, size: 13, enmity: b.tick });
    }
    if (S.time >= b.until) {
      delete e.buffs[id];
      if (e === player) log(BUFF_NAMES[id] + " wears off.", "sys");
    }
  }
}

function moveToward(e, tx, ty, dt, stop, speedMul) {
  const dx = tx - e.x, dy = ty - e.y;
  const d = Math.hypot(dx, dy);
  if (d <= stop) return true;
  const step = Math.min(e.speed * (speedMul || 1) * dt, d - stop);
  e.x += (dx / d) * step;
  e.y += (dy / d) * step;
  e.face = Math.atan2(dy, dx);
  return false;
}

function keepInZone(e) {
  const w = 24, z = S.zone;
  e.x = clamp(e.x, w + e.radius, z.w - w - e.radius);
  e.y = clamp(e.y, w + e.radius, z.h - w - e.radius);
}

function keepOutOfWater(e) {
  if (!FEATURES.water || !S.zone.water) return;
  for (const w of S.zone.water) {
    const d = Math.hypot(e.x - w.x, e.y - w.y);
    const min = w.r + e.radius * 0.6;
    if (d < min) {
      const nx = d > 0.001 ? (e.x - w.x) / d : 1, ny = d > 0.001 ? (e.y - w.y) / d : 0;
      e.x = w.x + nx * min;
      e.y = w.y + ny * min;
    }
  }
}

function zoneRects(z) {
  if (z._rects) return z._rects;
  let rects = (z.houses || []).map(r => ({ x: r.x - r.w / 2, y: r.y - r.h / 2, w: r.w, h: r.h })).concat((z.stalls || []).map(r => ({ x: r.x - 26, y: r.y - 16, w: 52, h: 32 })));
  rects = rects.concat((z.walls || []).map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h })));
  if (z.ruins) {
    for (const [x1, y1, x2, y2] of z.ruins.walls) rects.push({ x: Math.min(x1, x2) - 14, y: Math.min(y1, y2) - 14, w: Math.abs(x2 - x1) + 28, h: Math.abs(y2 - y1) + 28 });
    for (const [x, y] of z.ruins.pillars) rects.push({ x: x - 16, y: y - 16, w: 32, h: 32 });
  }
  z._rects = rects;
  return rects;
}

function keepOutOfRects(e) {
  const rects = zoneRects(S.zone);
  for (const r of rects) {
    const nx = clamp(e.x, r.x, r.x + r.w), ny = clamp(e.y, r.y, r.y + r.h);
    const dx = e.x - nx, dy = e.y - ny;
    const d = Math.hypot(dx, dy);
    if (d >= e.radius) continue;
    if (d > 0.001) { e.x = nx + dx / d * e.radius; e.y = ny + dy / d * e.radius; continue; }
    const pl = e.x - r.x, pr = r.x + r.w - e.x, pt = e.y - r.y, pb = r.y + r.h - e.y;
    const m = Math.min(pl, pr, pt, pb);
    if (m === pl) e.x = r.x - e.radius; else if (m === pr) e.x = r.x + r.w + e.radius; else if (m === pt) e.y = r.y - e.radius; else e.y = r.y + r.h + e.radius;
  }
}

function separate(a, b, aOnly) {
  const d = dist(a, b);
  const min = a.radius + b.radius - 4;
  if (d <= 0 || d >= min) return;
  const nx = (a.x - b.x) / d, ny = (a.y - b.y) / d;
  const push = aOnly ? min - d : (min - d) / 2;
  a.x += nx * push; a.y += ny * push;
  if (!aOnly) { b.x -= nx * push; b.y -= ny * push; }
}

function autoAttack(a, dt) {
  const t = a.attackTarget;
  if (!a.engaged || !t) return;
  if (!t.alive) { a.engaged = false; a.attackTarget = null; return; }
  if (a.casting) return;
  a.swingTimer -= dt;
  if (a.swingTimer <= 0) {
    if (dist(a, t) <= CONFIG.meleeRange) { a.face = Math.atan2(t.y - a.y, t.x - a.x); swing(a, t); a.swingTimer = swingDelay(a); }
    else a.swingTimer = 0;
  }
}

function detects(m, p) {
  if (p.mounted) return false;
  const a = m.fam.aggro;
  if (!a) return false;
  const d = dist(m, p);
  if (a.sight && d <= a.sight) {
    if (d <= 36) return true;
    const diff = Math.abs(normAng(Math.atan2(p.y - m.y, p.x - m.x) - m.face));
    if (diff <= Math.PI / 3) return true;
  }
  if (a.sound && d <= a.sound && p.moving) return true;
  if (a.magic && d <= a.magic && p.casting) return true;
  if (a.lowhp && d <= a.lowhp && p.hp / p.maxHp < 0.5) return true;
  return false;
}

function updateMob(m, dt) {
  if (!m.alive) return;
  tickBuffs(m);
  if (!m.alive) return;
  if (m.chain && S.time > m.chain.closeAt) m.chain = null;
  if (m.burst && S.time > m.burst.until) m.burst = null;
  if (m.state === "idle") {
    m.wanderTimer -= dt;
    if (m.wanderTimer <= 0) {
      m.wanderTimer = rand(1.5, 3.5);
      const ang = rand(0, Math.PI * 2);
      m.wanderDir = Math.random() < 0.6 ? { x: Math.cos(ang), y: Math.sin(ang) } : { x: 0, y: 0 };
      if (m.wanderDir.x || m.wanderDir.y) m.face = ang;
    }
    const nx = m.x + m.wanderDir.x * m.speed * 0.3 * dt;
    const ny = m.y + m.wanderDir.y * m.speed * 0.3 * dt;
    if (Math.hypot(nx - m.home.x, ny - m.home.y) < 70) { m.x = nx; m.y = ny; }
    for (const p of S.party) if (p.alive && detects(m, p)) { aggro(m, p); break; }
    return;
  }
  if (m.state === "combat") {
    for (const [e, v] of m.enmity) m.enmity.set(e, Math.max(1, v * (1 - 0.04 * dt)));
    const t = topEnmity(m);
    if (!t || Math.hypot(m.x - m.home.x, m.y - m.home.y) > CONFIG.leash) {
      if (t) log("The " + m.name + " loses interest.", "sys");
      m.state = "return";
      m.enmity.clear();
      m.readying = null;
      m.target = null;
      return;
    }
    m.target = t;
    if (m.readying) {
      m.readying.t -= dt;
      if (m.readying.t <= 0) execTpMove(m);
      return;
    }
    moveToward(m, t.x, t.y, dt, CONFIG.meleeRange - 8);
    m.face = Math.atan2(t.y - m.y, t.x - m.x);
    m.swingTimer -= dt;
    if (m.swingTimer <= 0) {
      if (dist(m, t) <= CONFIG.meleeRange) {
        swing(m, t);
        m.swingTimer = swingDelay(m);
        if (m.alive && m.tp >= 1000 && m.fam.tpMove) {
          m.readying = { t: 1.0, target: t, start: S.time };
          log("The " + m.name + " readies " + m.fam.tpMove.name + ".", "foe");
          popText(m, m.fam.tpMove.name, "#ff8a65", 13, 1.2, 14);
          sfx("tpready", m);
        }
      } else m.swingTimer = 0;
    }
    return;
  }
  if (m.state === "return") {
    if (!m.returnSince) m.returnSince = S.time;
    if (S.time - m.returnSince > 8) { m.x = m.home.x; m.y = m.home.y; }
    if (moveToward(m, m.home.x, m.home.y, dt, 2, 1.3)) {
      m.returnSince = 0;
      m.state = "idle";
      m.hp = m.maxHp;
      m.tp = 0;
      m.chain = null;
      m.burst = null;
      m.buffs = {};
    }
  }
}

function execTpMove(m) {
  const mv = m.fam.tpMove;
  const t = m.readying.target;
  m.readying = null;
  m.tp = 0;
  m.lastWS = S.time;
  if (!t.alive) return;
  log("The " + m.name + " uses " + mv.name + ".", "foe");
  sfx("tpmove", m);
  vfx("tpmove", { src: m, tgt: t, mv });
  const targets = mv.aoe ? S.party.filter(p => p.alive && dist(p, t) <= mv.aoe) : [t];
  for (const tg of targets) {
    let total = 0;
    for (let h = 0; h < (mv.hits || 1); h++) total += Math.floor(baseDmg(m, tg) * mv.mul * pDIF(m, tg));
    ring(tg, "#ff7043", mv.aoe || 30, 0.6, "burst");
    log(subj(tg) + " " + vb(tg, "take") + " " + total + " damage.", "foe");
    applyDamage(m, tg, total, { color: "#ff8a80", size: 22 });
    if (mv.drain && m.alive) { const heal = Math.min(total, m.maxHp - m.hp); m.hp += heal; if (heal > 0) popText(m, "+" + heal, "#9ad06b", 16); }
  }
  S.shake = Math.max(S.shake, 0.2);
}

function partyBattleTarget() {
  if (player.alive && player.engaged && player.attackTarget && player.attackTarget.alive) return player.attackTarget;
  let best = null, bd = 1e9;
  for (const m of S.mobs) {
    if (!m.alive || m.state !== "combat") continue;
    if (![...m.enmity.keys()].some(isParty)) continue;
    const d = dist(m, player);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}

function follow(a, dt) {
  if (a.resting) return;
  const o0 = followOffset(S.party.indexOf(a)), mf = a.mounted ? 1.9 : 1, o = { x: o0.x * mf, y: o0.y * mf };
  const cos = Math.cos(player.face), sin = Math.sin(player.face);
  const tx = player.x + o.x * cos - o.y * sin, ty = player.y + o.x * sin + o.y * cos;
  if (dist(a, player) > 700 && !partyInCombat()) { a.x = player.x - Math.cos(player.face) * 40 + rand(-20, 20); a.y = player.y - Math.sin(player.face) * 40 + rand(-20, 20); a.px = a.x; a.py = a.y; return; }
  if (Math.hypot(tx - a.x, ty - a.y) > 12) moveToward(a, tx, ty, dt, 4, (a.mounted ? CONFIG.mountSpeed : 1) * (Math.hypot(tx - a.x, ty - a.y) > 160 ? 1.4 : 1));
}

function allyTry(a, act, t) {
  if (!act || checkAction(a, act, t)) return false;
  perform(a, act, t);
  return true;
}

function updateAlly(a, dt) {
  if (!a.alive || a.casting) return;
  if (a.mounted) { a.engaged = false; a.attackTarget = null; follow(a, dt); return; }
  const tgt = partyBattleTarget();
  const role = a.role;
  if (role === "healer" || role === "support") healerAI(a, tgt, dt);
  else if (role === "nuker" || role === "burster") nukerAI(a, tgt, dt);
  else meleeAI(a, tgt, dt);
}

function meleeAI(a, tgt, dt) {
  if (!tgt) { a.engaged = false; a.attackTarget = null; a.target = null; follow(a, dt); return; }
  if (a.attackTarget !== tgt) a.swingTimer = Math.min(a.swingTimer, 1.2);
  a.attackTarget = tgt;
  a.target = tgt;
  a.engaged = true;
  moveToward(a, tgt.x, tgt.y, dt, CONFIG.meleeRange - 8);
  autoAttack(a, dt);
  const acts = actionList(a);
  if (a.role === "tank") {
    const prov = acts.find(x => x.id === "provoke");
    if (prov && tgt.state === "combat" && topEnmity(tgt) !== a && allyTry(a, prov, tgt)) return;
    const flash = acts.find(x => x.id === "flash");
    if (flash && tgt.state === "combat" && (topEnmity(tgt) !== a || !tgt.buffs.flash) && allyTry(a, flash, tgt)) return;
    const sent = acts.find(x => x.id === "sentinel");
    if (sent && tgt.state === "combat" && (a.hp < a.maxHp * 0.5 || topEnmity(tgt) !== a) && allyTry(a, sent, a)) return;
    const bash = acts.find(x => x.id === "shield_bash");
    if (bash && tgt.readying && allyTry(a, bash, tgt)) return;
    const cure = acts.find(x => x.id === "cure");
    if (cure && a.hp < a.maxHp * 0.4 && !S.party.some(p => p !== a && p.alive && p.role === "healer") && allyTry(a, cure, a)) return;
  }
  if (a.role === "hybrid" && hybridMagic(a, tgt, acts)) return;
  const bers = acts.find(x => x.id === "berserk");
  if (bers && a.role !== "tank" && dist(a, tgt) <= CONFIG.meleeRange && allyTry(a, bers, a)) return;
  if (bers && a.role === "tank" && a.hp > a.maxHp * 0.7 && dist(a, tgt) <= CONFIG.meleeRange && allyTry(a, bers, a)) return;
  allyWeaponSkill(a, tgt, acts);
}

function hybridMagic(a, tgt, acts) {
  const living = S.party.filter(p => p.alive);
  let low = null;
  for (const p of living) if (!low || p.hp / p.maxHp < low.hp / low.maxHp) low = p;
  const healer = S.party.some(p => p !== a && p.alive && p.role === "healer" && !p.casting);
  const cure = acts.find(x => x.id === "cure");
  if (cure && low && low.hp / low.maxHp < (healer ? 0.3 : 0.5) && a.mp > a.maxMp * 0.2 && allyTry(a, cure, low)) return true;
  const conv = acts.find(x => x.id === "convert");
  if (conv && a.mp < a.maxMp * 0.15 && a.hp > a.maxHp * 0.6 && allyTry(a, conv, a)) return true;
  if (tgt.state !== "combat" || dist(a, tgt) > CONFIG.castRange) return false;
  for (const id of ["dia", "slow", "paralyze"]) {
    const sp = acts.find(x => x.id === id);
    if (sp && !tgt.buffs[id] && a.mp > a.maxMp * 0.3 && allyTry(a, sp, tgt)) return true;
  }
  if (tgt.burst && S.time <= tgt.burst.until) {
    const nk = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "nuke" && tgt.burst.el.includes(SPELLS[x.id].element)).sort((p, q) => SPELLS[q.id].power - SPELLS[p.id].power)[0];
    if (nk && allyTry(a, nk, tgt)) return true;
  }
  if (S.time >= (a.nextNuke || 0) && a.mp > a.maxMp * 0.6) {
    const nukes = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "nuke").sort((p, q) => { const wp = (tgt.fam.weak || {})[SPELLS[p.id].element] || 1, wq = (tgt.fam.weak || {})[SPELLS[q.id].element] || 1; return SPELLS[q.id].power * wq - SPELLS[p.id].power * wp; });
    if (nukes.length && allyTry(a, nukes[0], tgt)) { a.nextNuke = S.time + rand(9, 13); return true; }
  }
  return false;
}

function allyWeaponSkill(a, tgt, acts) {
  if (a.tp < 1000 || dist(a, tgt) > CONFIG.meleeRange) return;
  const wss = acts.filter(x => x.kind === "ws");
  if (!wss.length) return;
  const c = tgt.chain;
  if (c && S.time < c.openAt) return;
  if (c && S.time <= c.closeAt && c.by !== a) {
    let choice = null, best = 0;
    for (const w of wss) {
      const r = findChain(c.props, WEAPON_SKILLS[w.id].props);
      if (r && SC_PROPS[r].lv > best) { best = SC_PROPS[r].lv; choice = w; }
    }
    if (choice) { allyTry(a, choice, tgt); return; }
  }
  const patience = a.role === "dd" ? 1000 : 1300;
  if (a.tp >= patience) allyTry(a, wss[wss.length - 1], tgt);
}

function keepCasterRange(a, tgt, dt) {
  const d = dist(a, tgt);
  if (d > 170) moveToward(a, tgt.x, tgt.y, dt, 140);
  else if (d < 90) { const ang = Math.atan2(a.y - tgt.y, a.x - tgt.x); a.x += Math.cos(ang) * a.speed * 0.6 * dt; a.y += Math.sin(ang) * a.speed * 0.6 * dt; a.face = ang + Math.PI; }
}

function healerAI(a, tgt, dt) {
  const acts = actionList(a);
  const living = S.party.filter(p => p.alive);
  let low = null;
  for (const p of living) if (!low || p.hp / p.maxHp < low.hp / low.maxHp) low = p;
  const healAt = a.role === "healer" ? 0.65 : 0.5;
  const otherHealer = S.party.some(p => p !== a && p.alive && p.role === "healer" && !p.casting);
  if (low && low.hp / low.maxHp < healAt && (a.role === "healer" || !otherHealer || low.hp / low.maxHp < 0.35)) {
    const pct = low.hp / low.maxHp;
    const seal = acts.find(x => x.id === "divine_seal");
    if (seal && pct < 0.35 && !a.buffs.divine_seal && allyTry(a, seal, a)) return;
    const c2 = acts.find(x => x.id === "cure2");
    const c1 = acts.find(x => x.id === "cure");
    const order = c2 && low.maxHp - low.hp > 70 ? [c2, c1] : [c1, c2];
    if (dist(a, low) > CONFIG.castRange - 30) { moveToward(a, low.x, low.y, dt, CONFIG.castRange - 60); return; }
    for (const c of order) if (allyTry(a, c, low)) return;
  }
  if (tgt) {
    const dia = acts.find(x => x.id === "dia");
    const diaMp = a.role === "support" ? 0.25 : 0.5;
    if (dia && !tgt.buffs.dia && a.mp > a.maxMp * diaMp && dist(a, tgt) <= CONFIG.castRange && allyTry(a, dia, tgt)) return;
    const banish = acts.find(x => x.id === "banish");
    if (a.role === "support" && banish && tgt.fam.weak && tgt.fam.weak.light >= 1.5 && a.mp > a.maxMp * 0.4 && allyTry(a, banish, tgt)) return;
    keepCasterRange(a, tgt, dt);
    return;
  }
  follow(a, dt);
}

function nukerAI(a, tgt, dt) {
  if (!tgt) { follow(a, dt); return; }
  const acts = actionList(a);
  const nukes = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "nuke");
  if (tgt.burst && S.time <= tgt.burst.until) {
    const match = nukes.filter(x => tgt.burst.el.includes(SPELLS[x.id].element)).sort((p, q) => SPELLS[q.id].power - SPELLS[p.id].power);
    for (const n of match) {
      if (checkAction(a, n, tgt)) continue;
      const seal = acts.find(x => x.id === "elemental_seal");
      if (seal && (a.role === "burster" || Math.random() < 0.3)) allyTry(a, seal, a);
      if (allyTry(a, n, tgt)) return;
    }
  }
  const reserve = a.role === "burster" ? 0.8 : 0.45;
  if (S.time >= a.nextNuke && a.mp > a.maxMp * reserve && tgt.state === "combat" && tgt.hp > tgt.maxHp * 0.15) {
    const ranked = nukes.slice().sort((p, q) => {
      const wp = (tgt.fam.weak || {})[SPELLS[p.id].element] || 1, wq = (tgt.fam.weak || {})[SPELLS[q.id].element] || 1;
      return SPELLS[q.id].power * wq - SPELLS[p.id].power * wp;
    });
    for (const n of ranked) if (allyTry(a, n, tgt)) { a.nextNuke = S.time + rand(7, 10); return; }
  }
  keepCasterRange(a, tgt, dt);
}

function updatePlayer(dt) {
  if (!player.alive) return;
  const mv = inputVector();
  let moved = false;
  if (mv.x || mv.y) {
    S.moveTarget = null; S.chase = false; S.pendingTalk = null;
    const len = Math.hypot(mv.x, mv.y);
    const sp = player.speed * Math.min(1, len) * (player.mounted ? CONFIG.mountSpeed : 1);
    player.x += (mv.x / len) * sp * dt;
    player.y += (mv.y / len) * sp * dt;
    player.face = Math.atan2(mv.y, mv.x);
    moved = true;
  } else if (S.moveTarget) {
    moved = true;
    if (moveToward(player, S.moveTarget.x, S.moveTarget.y, dt, 3, player.mounted ? CONFIG.mountSpeed : 1)) S.moveTarget = null;
  } else if (S.chase && player.attackTarget && player.attackTarget.alive) {
    if (dist(player, player.attackTarget) > CONFIG.meleeRange - 4) { moveToward(player, player.attackTarget.x, player.attackTarget.y, dt, CONFIG.meleeRange - 10); moved = true; }
  }
  if (moved) {
    touch(player);
    if (player.casting) { log("You move and interrupt your casting.", "you"); player.casting = null; sfx("interrupt", player); }
  }
  keepInZone(player);
  if (S.pendingTalk && dist(player, S.pendingTalk) <= CONFIG.talkRange) {
    const n = S.pendingTalk;
    S.pendingTalk = null;
    S.moveTarget = null;
    talkTo(n);
  }
  if (player.engaged) touch(player);
  autoAttack(player, dt);
}

function canRest(p) { return p.alive && !p.engaged && !p.casting && !p.mounted && !inCombatWith(p); }

function startRest(p) {
  if (p.resting) return;
  p.resting = true;
  p.restSince = S.time;
  p.moveTarget = null;
}

function standUp(p, quiet) {
  if (!p.resting) return;
  p.resting = false;
  p.stillSince = S.time;
  if (p === player) {
    if (!quiet) log("You stand up.", "you");
    for (const a of S.party) if (a !== player) a.resting = false;
  }
}

function toggleRest() {
  if (!player) return;
  if (player.resting) { standUp(player); return; }
  if (!player.alive) return;
  if (player.mounted) { log("You can't rest while riding.", "sys"); sfx("error"); return; }
  if (player.engaged || inCombatWith(player)) { log("You can't rest while monsters are attacking you.", "sys"); sfx("error"); return; }
  if (player.casting) { log("You can't rest while casting.", "sys"); sfx("error"); return; }
  S.moveTarget = null; S.chase = false; S.pendingTalk = null;
  startRest(player);
  log("You sit down and rest.", "you");
  for (const a of S.party) if (a !== player && canRest(a) && !partyInCombat()) startRest(a);
}

function regen(p, dt) {
  if (p.resting && (!canRest(p) || p.moving)) standUp(p, p !== player);
  const can = p.alive && !p.engaged && !p.casting && S.time - p.stillSince >= CONFIG.regenDelay && !inCombatWith(p);
  const rest = can && p.resting && S.time - p.restSince >= CONFIG.restDelay;
  p.regenerating = can && (p.hp < p.maxHp || p.mp < p.maxMp);
  p.restHealing = rest && (p.hp < p.maxHp || p.mp < p.maxMp);
  if (!can) return;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * (rest ? CONFIG.restHp : CONFIG.regenHp) * dt);
  p.mp = Math.min(p.maxMp, p.mp + p.maxMp * (rest ? CONFIG.restMp : CONFIG.regenMp) * dt);
}

function tickCasting(e) {
  if (e.casting && S.time >= e.casting.end) finishCast(e);
}

function partyInCombat() {
  return S.mobs.some(m => m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty));
}

function enterZone(id, x, y) {
  const prev = S.zoneId;
  S.zoneId = id;
  S.zone = ZONES[id];
  if (!canRideHere()) for (const p of S.party) p.mounted = false;
  S.mobs = [];
  S.effects = [];
  S.floaters = [];
  S.spawnAt = [];
  closeDialog();
  S.moveTarget = null; S.chase = false; S.pendingTalk = null;
  player.x = x; player.y = y;
  const home = ZONES[id].npcs.find(n => NPCS[n.id] && NPCS[n.id].crystal && Math.hypot(n.x - x, n.y - y) < 120);
  player.face = home ? Math.atan2(home.y - y, home.x - x) : Math.atan2(ZONES[id].h / 2 - y, ZONES[id].w / 2 - x);
  S.party.forEach((p, i) => {
    p.engaged = false; p.target = null; p.attackTarget = null; p.casting = null;
    if (i > 0) { const o = followOffset(i); p.x = x + o.x; p.y = y + o.y; }
    p.px = p.x; p.py = p.y;
    p.stillSince = S.time;
  });
  S.zone.spawns.forEach((sp, i) => {
    const until = S.nmDeadUntil[id + ":" + i];
    if (until && until > S.time) { S.spawnAt[i] = until; return; }
    const fixed = FAMILIES[sp.fam] && FAMILIES[sp.fam].nm && save.timers["nm:" + sp.fam];
    if (fixed && fixed > Date.now()) { S.spawnAt[i] = S.time + (fixed - Date.now()) / 1000; return; }
    spawnMob(i);
  });
  S.npcs = S.zone.npcs.map(n => Object.assign({ id: n.id, x: n.x, y: n.y, radius: 14, kind: "npc", face: Math.PI / 2 }, NPCS[n.id]));
  const rnd = seeded(hashStr(id));
  S.decor = [];
  const nRocks = S.zone.theme === "town" ? 6 : S.zone.theme === "cave" ? 26 : 30;
  for (let i = 0; i < nRocks; i++) S.decor.push({ x: 40 + rnd() * (S.zone.w - 80), y: 40 + rnd() * (S.zone.h - 80), r: 6 + rnd() * 16, a: rnd() * Math.PI });
  S.zoneCooldown = 1;
  S.lastPeriod = period();
  log("Entering " + S.zone.name + ".", "sys");
  if (prev !== id) sfx("zone");
  onZoneEntered();
  saveGame();
}

function spawnAllowed(sp) { return !sp.time || sp.time === period(); }

function spawnMob(i) {
  const sp = S.zone.spawns[i];
  if (!spawnAllowed(sp)) { S.spawnAt[i] = S.time + 5; return; }
  let fam = sp.fam, lv = randInt(sp.lv[0], sp.lv[1]);
  if (FEATURES.nms && sp.nm && (!sp.nm.time || sp.nm.time === period())) {
    const key = "nm:" + sp.nm.id;
    if (!(save.timers[key] > Date.now()) && !S.mobs.some(m => m.alive && m.famKey === sp.nm.id) && Math.random() < sp.nm.chance) {
      fam = sp.nm.id; lv = sp.nm.lv;
      if (S.time > 1 && Math.hypot(sp.x - player.x, sp.y - player.y) < 900) { log("You sense a powerful presence nearby...", "foe"); sfx("notify"); }
    }
  }
  S.mobs.push(buildMob(fam, lv, sp.x, sp.y, i));
  S.spawnAt[i] = null;
}

function checkLandmarks() {
  const lms = S.zone.landmarks;
  if (!lms || !player.alive) return;
  for (const lm of lms) {
    const key = S.zoneId + ":" + lm.id;
    if (save.landmarks[key] || Math.hypot(player.x - lm.x, player.y - lm.y) > lm.r) continue;
    save.landmarks[key] = Date.now();
    log("You discover " + lm.name + "!", "loot");
    uiEvent("landmark", lm);
    gainXp(lm.xp, 0, true);
    saveGame();
  }
}

function updatePeriod() {
  const per = period();
  if (per === S.lastPeriod) return;
  S.lastPeriod = per;
  if (!S.zone.indoor && S.zone.theme !== "cave") log(per === "night" ? "Night falls over " + S.zone.name + "." : "The sun rises over " + S.zone.name + ".", "sys");
  for (const m of S.mobs) {
    const sp = S.zone.spawns[m.spawnIdx];
    if (m.alive && sp && sp.time && sp.time !== per && m.state === "idle") {
      m.alive = false;
      m.deadAt = S.time - 2;
      m.despawned = true;
      S.spawnAt[m.spawnIdx] = S.time + 5;
    }
  }
}

function circleRect(c, r, m) {
  const nx = clamp(c.x, r.x, r.x + r.w), ny = clamp(c.y, r.y, r.y + r.h);
  return Math.hypot(c.x - nx, c.y - ny) <= c.radius + m;
}

function step(dt) {
  S.time += dt;
  for (const e of S.party.concat(S.mobs)) { e.px = e.x; e.py = e.y; }
  updatePlayer(dt);
  for (const a of S.party) if (a !== player) updateAlly(a, dt);
  for (const m of S.mobs) updateMob(m, dt);
  for (const p of S.party) { if (p.alive) { tickBuffs(p); tickCasting(p); } }
  const bodies = S.party.concat(S.mobs).filter(e => e.alive);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) separate(bodies[i], bodies[j]);
  for (const n of S.npcs) for (const p of S.party) separate(p, n, true);
  for (const e of bodies) { keepOutOfWater(e); keepOutOfRects(e); keepInZone(e); }
  for (const e of S.party.concat(S.mobs)) {
    e.moving = Math.hypot(e.x - e.px, e.y - e.py) > 0.05;
    if (e.moving && isParty(e)) e.stillSince = S.time;
  }
  for (const p of S.party) regen(p, dt);
  S.zoneCooldown = Math.max(0, S.zoneCooldown - dt);
  if (S.zoneCooldown <= 0 && player.alive) {
    for (const ex of S.zone.exits) if (circleRect(player, ex, 8)) { enterZone(ex.to, ex.tx, ex.ty); return; }
  }
  S.lmTimer -= dt;
  if (S.lmTimer <= 0) { S.lmTimer = 0.5; checkLandmarks(); }
  S.periodTimer -= dt;
  if (S.periodTimer <= 0) { S.periodTimer = 1; updatePeriod(); }
  S.spawnAt.forEach((t, i) => { if (t != null && S.time >= t) spawnMob(i); });
  S.mobs = S.mobs.filter(m => m.alive || S.time - m.deadAt < 2.5);
  if (partyInCombat()) S.lastCombat = S.time;
  const calm = S.time - S.lastCombat;
  for (const a of S.party) {
    if (a === player || a.alive || !player.alive || calm <= CONFIG.allyReviveAfter) continue;
    a.alive = true; a.hp = Math.round(a.maxHp * 0.3); a.x = player.x - 20; a.y = player.y + 20; a.stillSince = S.time;
    log(a.name + " gets back up.", "ally");
  }
  for (const p of S.party) if (p.target && isMob(p.target) && !S.mobs.includes(p.target)) p.target = null;
  S.saveTimer += dt;
  if (S.saveTimer > 20) { S.saveTimer = 0; saveGame(); }
}

function age(dt) {
  for (const fx of S.effects) fx.t += dt;
  S.effects = S.effects.filter(fx => fx.t < fx.life);
  for (const f of S.floaters) f.t += dt;
  S.floaters = S.floaters.filter(f => f.t < f.life);
  S.shake = Math.max(0, S.shake - dt);
  for (const e of S.party.concat(S.mobs)) e.flash = Math.max(0, e.flash - dt);
}

function conOf(m) {
  const d = m.lv - player.lv;
  if (d <= -4) return ["Too Weak", "#9e9e9e"];
  if (d <= -2) return ["Easy Prey", "#64b5f6"];
  if (d === -1) return ["Decent Challenge", "#81c784"];
  if (d === 0) return ["Even Match", "#ffffff"];
  if (d <= 2) return ["Tough", "#ffd54f"];
  if (d === 3) return ["Very Tough", "#ff8a65"];
  return ["Incredibly Tough", "#e53935"];
}

function setTarget(e) {
  player.target = e;
  if (isMob(e) && player.engaged && e !== player.attackTarget && e.alive) {
    player.attackTarget = e;
    log("You switch targets to the " + e.name + ".", "you");
  }
}

function tabNext(list) {
  const fresh = S.time - S.lastTab > 2 || !list.includes(player.target);
  S.lastTab = S.time;
  return fresh ? list[0] : list[(list.indexOf(player.target) + 1) % list.length];
}

function cycleNpcTarget() {
  const people = S.npcs.filter(n => !n.crystal && dist(n, player) < 1200).sort((a, b) => dist(a, player) - dist(b, player));
  const crystals = S.npcs.filter(n => n.crystal && dist(n, player) < 1200).sort((a, b) => dist(a, player) - dist(b, player));
  const list = people.concat(crystals);
  if (!list.length) return false;
  player.target = tabNext(list);
  sfx("select");
  return true;
}

function cycleTarget() {
  if (S.zone.safe) { if (!cycleNpcTarget()) log("No one nearby.", "sys"); return; }
  const list = S.mobs.filter(m => m.alive && !m.despawned && dist(m, player) < 450).sort((a, b) => dist(a, player) - dist(b, player));
  if (!list.length) { if (!cycleNpcTarget()) log("No enemies nearby.", "sys"); return; }
  setTarget(tabNext(list));
  sfx("select");
}

function nearestMob() {
  let best = null, bd = 450;
  for (const m of S.mobs) if (m.alive && dist(m, player) < bd) { bd = dist(m, player); best = m; }
  return best;
}

function toggleEngage(fromTap) {
  if (!player.alive) return;
  standUp(player);
  if (player.mounted) dismount("You dismount and draw your weapon.");
  if (player.engaged && (!isMob(player.target) || player.target === player.attackTarget)) {
    player.engaged = false; player.attackTarget = null; S.chase = false;
    log("You disengage.", "sys");
    return;
  }
  const t = isMob(player.target) && player.target.alive ? player.target : nearestMob();
  if (!t) { log("No enemy to engage.", "sys"); return; }
  player.target = t;
  if (player.engaged) { setTarget(t); return; }
  player.engaged = true;
  player.attackTarget = t;
  player.swingTimer = Math.min(player.swingTimer, 1.0);
  touch(player);
  if (fromTap) S.chase = true;
  log("You engage the " + t.name + ".", "you");
}

function canRideHere() { return !!S.zone && S.zone.theme === "field"; }

function toggleMount() {
  if (!player || S.ko) return;
  if (player.mounted) { dismount("You dismount."); return; }
  if (!save.mountLicense) { log("You don't have a riding license yet. Ysolde, the Outpost stablemaster, can help.", "sys"); sfx("error"); return; }
  if (!canRideHere()) { log("Your Thornstrider won't come into " + (S.zone.theme === "town" ? "town" : "here") + ". Call it in open country.", "sys"); sfx("error"); return; }
  if (!player.alive || player.casting || player.engaged || partyInCombat()) { log("You can't call your mount during a fight.", "sys"); sfx("error"); return; }
  standUp(player, true);
  for (const p of S.party) if (p.alive) { p.mounted = true; p.engaged = false; p.attackTarget = null; p.casting = null; }
  S.chase = false;
  log("You whistle for your Thornstrider and swing into the saddle.", "you");
  vfx("mount", { tgt: player });
  sfx("mount");
}

function dismount(msg) {
  if (!player.mounted) return;
  for (const p of S.party) p.mounted = false;
  if (msg) log(msg, "sys");
  vfx("mount", { tgt: player, off: true });
}

function resolveTarget(act) {
  if (act.kind === "ws") return player.attackTarget;
  if (act.kind === "ja") return ABILITIES[act.id].target === "self" ? player : (isMob(player.target) ? player.target : player.attackTarget);
  const sp = SPELLS[act.id];
  if (sp.target === "ally") return isParty(player.target) && player.target.alive ? player.target : player;
  return isMob(player.target) ? player.target : player.attackTarget;
}

function playerAct(act) {
  if (!act || S.ko) return;
  if (player.mounted) dismount("You dismount.");
  let t = resolveTarget(act);
  if (!t && act.kind !== "ws") { const n = nearestMob(); if (n) { player.target = n; t = resolveTarget(act); } }
  const why = checkAction(player, act, t);
  if (why) { log(why, "sys"); sfx("error"); return; }
  perform(player, act, t);
}

function nearNpc() {
  let best = null, bd = CONFIG.talkRange + 20;
  for (const n of S.npcs) { const d = dist(n, player); if (d < bd) { bd = d; best = n; } }
  return best;
}

function talkNearest() {
  const n = nearNpc();
  if (n) { talkTo(n); return; }
  if (player.target && player.target.kind === "npc") { S.pendingTalk = player.target; S.moveTarget = { x: player.target.x, y: player.target.y }; return; }
  log("There is no one nearby to talk to.", "sys");
}

function talkTo(n) {
  player.target = n;
  player.face = Math.atan2(n.y - player.y, n.x - player.x);
  n.face = Math.atan2(player.y - n.y, player.x - n.x);
  TALK[n.talk](n);
}

function questMarker(n) {
  const q = save.quests, lv = player.lv;
  for (const id in QUESTS) if (QUESTS[id].npc === n.id && QUESTS[id].intro && (questOfferable(id) || questComplete(id))) return true;
  if (n.id === "rhea") return q.pouches === "none" || (q.pouches === "active" && invCount("goblin_pouch") >= 3) || (q.bones === "done" && q.chieftain === "none" && lv >= 7) || q.chieftain === "killed";
  if (n.id === "ysolde") return !save.mountLicense && lv >= 5 && (q.riding === "none" || (q.riding === "active" && save.gil >= 300 && invCount("healing_herb") >= 3));
  if (n.id === "tobin") return (q.support === "none" && lv >= CONFIG.supportUnlockLevel) || (q.support === "active" && invCount("bat_wing") >= 2 && invCount("worm_silk") >= 1) || (lv >= 6 && ((q.pld === "none" || q.rdm === "none") || (q.pld === "active" && invCount("bone_chip") >= 2 && invCount("iron_ore") >= 1) || (q.rdm === "active" && invCount("worm_silk") >= 2 && invCount("fire_crystal") >= 1 && invCount("water_crystal") >= 1)));
  return false;
}

function giveReward(r) {
  if (r.xp) gainXp(r.xp);
  if (r.gil) { save.gil += r.gil; log("You receive " + r.gil + " gil.", "loot"); sfx("coin"); }
  if (r.item) giveItem(r.item, r.qty || 1);
  if (r.items) for (const [id, n] of r.items) giveItem(id, n);
  if (r.unlock) { save.jobsUnlocked[r.unlock] = true; log("You can now become a " + JOBS[r.unlock].name + ". Ask Tobin to change jobs.", "npc"); }
  sfx("fanfare");
}

function questOfferable(id) {
  const q = QUESTS[id];
  return save.quests[id] === "none" && player.lv >= (q.lv || 1) && (!q.pre || save.quests[q.pre] === "done");
}
function questComplete(id) {
  const q = QUESTS[id];
  if (save.quests[id] !== "active") return false;
  if (q.kill) return (save.qprog[id] || 0) >= q.kill.n;
  if (q.items) return Object.keys(q.items).every(it => invCount(it) >= q.items[it]);
  return false;
}
function acceptQuest(id) {
  save.quests[id] = "active";
  if (QUESTS[id].kill) save.qprog[id] = 0;
  log("Quest accepted: " + QUESTS[id].name + ".", "npc");
  sfx("notify");
  saveGame();
}
function completeQuest(id) {
  const q = QUESTS[id];
  if (q.items) for (const it in q.items) removeItem(it, q.items[it]);
  save.quests[id] = "done";
  log("Quest complete: " + q.name + ".", "npc");
  giveReward(q.reward);
  saveGame();
}
function questOptions(npcId, n) {
  const out = [];
  for (const id in QUESTS) {
    const q = QUESTS[id];
    if (q.npc !== npcId || !q.intro) continue;
    if (questOfferable(id)) out.push({ label: "Ask about " + q.name, fn: () => openDialog(n.name, q.intro, [{ label: "Accept", fn: () => { acceptQuest(id); closeDialog(); } }]) });
    else if (questComplete(id)) out.push({ label: q.turnLabel || "Report: " + q.name, fn: () => { openDialog(n.name, q.turn, [{ label: "Collect the reward", fn: () => { completeQuest(id); closeDialog(); } }]); } });
    else if (save.quests[id] === "active" && q.progress) out.push({ label: q.name + " (" + questProgressText(id) + ")", fn: () => openDialog(n.name, q.progress, []) });
  }
  return out;
}
function questProgressText(id) {
  const q = QUESTS[id];
  if (q.kill) return q.kill.name + " " + Math.min(q.kill.n, save.qprog[id] || 0) + "/" + q.kill.n;
  if (q.items) return Object.keys(q.items).map(it => ITEMS[it].name + " " + Math.min(q.items[it], invCount(it)) + "/" + q.items[it]).join(", ");
  return "";
}

const TALK = {
  talkRhea(n) {
    const q = save.quests;
    if (q.pouches === "none") {
      openDialog(n.name, "Goblins out in Rocky Hollow keep raiding our supply crates. Bring me 3 Goblin Pouches as proof you've thinned them out, and I'll make it worth your while.", [
        { label: "Accept", fn: () => { q.pouches = "active"; log("Quest accepted: " + QUESTS.pouches.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
      ]);
      return;
    }
    if (q.pouches === "active") {
      const have = invCount("goblin_pouch");
      if (have >= 3) {
        openDialog(n.name, "Three pouches! That'll keep them quiet for a while. Take this ring. It was mine when I was green like you.", [
          { label: "Hand over the pouches", fn: () => { removeItem("goblin_pouch", 3); q.pouches = "done"; log("Quest complete: " + QUESTS.pouches.name + ".", "npc"); giveReward(QUESTS.pouches.reward); saveGame(); closeDialog(); } }
        ]);
      } else openDialog(n.name, "You have " + have + " of 3 Goblin Pouches. The goblins east of here in Rocky Hollow carry them. If the work is too much alone, Brann at the Mercenary Hall has swords for hire.", questOptions("rhea", n));
      return;
    }
    const g = questOptions("rhea", n);
    if (q.chieftain === "none" && q.bones === "done" && player.lv >= 7) {
      openDialog(n.name, "Scouts say the raids are led by a Goblin Chieftain holed up at the back of the Goblin Den, past the Hollow. He's dangerous. Bring a full party, and don't fight his guards all at once.", [
        { label: "I'll handle him", fn: () => { q.chieftain = "active"; log("Quest accepted: " + QUESTS.chieftain.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
      ].concat(g));
      return;
    }
    if (q.chieftain === "active") { openDialog(n.name, "The Chieftain still lives. He's at the far end of the Goblin Den.", g); return; }
    if (q.chieftain === "killed") {
      openDialog(n.name, "You actually did it. The Outpost owes you. Here's your bounty. And word's spread: a Black Mage named Vesper wants to fight beside you. Ask Brann.", [
        { label: "Collect the bounty", fn: () => { q.chieftain = "done"; log("Quest complete: " + QUESTS.chieftain.name + ".", "npc"); giveReward(QUESTS.chieftain.reward); log("Vesper is now available at the Mercenary Hall.", "npc"); saveGame(); closeDialog(); } }
      ].concat(g));
      return;
    }
    if (g.length) { openDialog(n.name, q.chieftain === "done" ? "The Den's quieter, but the Hollow never is. There's always work." : player.lv < 7 && q.bones === "done" ? "Get a little stronger before I send you after the Chieftain. Meanwhile, there's work." : "There's work for a steady hand.", g); return; }
    openDialog(n.name, q.chieftain === "done" ? "Quiet days, thanks to you. Keep your blade sharp." : q.bones === "done" && player.lv < 7 ? "Rest up and get stronger. When you're level 7, I'll tell you about the Chieftain." : "Keep at it. Come back when you've grown.", []);
  },
  talkTobin(n) {
    const q = save.quests;
    const opts = [{ label: "Change jobs", fn: () => { closeDialog(); openModal("job"); } }];
    const adv = [];
    if (player.lv >= 6) {
      const turnIn = (id, mats, label) => {
        if (mats.every(([it, k]) => invCount(it) >= k)) adv.push({ label, fn: () => { mats.forEach(([it, k]) => removeItem(it, k)); q[id] = "done"; log("Quest complete: " + QUESTS[id].name + ".", "npc"); giveReward(QUESTS[id].reward); refreshPlayer(false); saveGame(); closeDialog(); openModal("job"); } });
      };
      if (q.pld === "none") adv.push({ label: "Ask about the Paladin's oath", fn: () => openDialog(n.name, "A Paladin stands between the party and harm: sword and shield, Cures for the wounded, Flash to blind the foe. Bring me 2 Bone Chips from the undead and 1 Iron Ore from the Den's raiders, and I'll hear your oath.", [{ label: "Accept", fn: () => { q.pld = "active"; log("Quest accepted: " + QUESTS.pld.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }]) });
      else if (q.pld === "active") turnIn("pld", [["bone_chip", 2], ["iron_ore", 1]], "Take the Paladin's oath");
      if (q.rdm === "none") adv.push({ label: "Ask about the Red Mage's arts", fn: () => openDialog(n.name, "A Red Mage does a little of everything well: blade in hand, Slow and Paralyze on the enemy, a nuke when it counts, a Cure in a pinch. Bring me 2 Worm Silk, 1 Fire Crystal and 1 Water Crystal for the scarlet dye, and we'll begin.", [{ label: "Accept", fn: () => { q.rdm = "active"; log("Quest accepted: " + QUESTS.rdm.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }]) });
      else if (q.rdm === "active") turnIn("rdm", [["worm_silk", 2], ["fire_crystal", 1], ["water_crystal", 1]], "Present the dye materials");
    }
    const advNote = (q.pld === "active" ? " The oath needs 2 Bone Chips and 1 Iron Ore." : "") + (q.rdm === "active" ? " The scarlet lessons need 2 Worm Silk, 1 Fire Crystal and 1 Water Crystal." : "");
    if (!save.supportUnlocked) {
      if (player.lv < CONFIG.supportUnlockLevel) {
        openDialog(n.name, "Every job keeps its own level and its own weapon skills. Come back when you've reached level " + CONFIG.supportUnlockLevel + ", and I'll teach you to call on a second job.", opts);
        return;
      }
      if (q.support === "none") {
        openDialog(n.name, "Level " + player.lv + " already? Then you're ready to learn a support job. Prove your patience: bring me 2 Bat Wings and 1 Worm Silk. Bats only stir at night, mind you." + advNote, opts.concat([
          { label: "Accept", fn: () => { q.support = "active"; log("Quest accepted: " + QUESTS.support.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
        ], adv));
        return;
      }
      if (q.support === "active") {
        if (invCount("bat_wing") >= 2 && invCount("worm_silk") >= 1) {
          openDialog(n.name, "Wings and silk, as promised. Good. From now on you may set a support job here. It runs at half your level and lends you its spells and abilities.", [
            { label: "Hand them over", fn: () => {
              removeItem("bat_wing", 2); removeItem("worm_silk", 1);
              q.support = "done"; save.supportUnlocked = true;
              log("Quest complete: " + QUESTS.support.name + ". Support jobs unlocked!", "npc");
              giveReward(QUESTS.support.reward);
              refreshPlayer(false); saveGame(); closeDialog(); openModal("job");
            } }
          ].concat(adv));
        } else openDialog(n.name, "You have " + invCount("bat_wing") + " of 2 Bat Wings and " + invCount("worm_silk") + " of 1 Worm Silk. Bats come out at night in Rocky Hollow; worms tunnel there day and night." + advNote, opts.concat(adv));
        return;
      }
    }
    if (adv.length) { openDialog(n.name, "Level " + player.lv + ". You've outgrown the basic callings. I can teach the advanced jobs to those who prove themselves." + advNote, opts.concat(adv)); return; }
    openDialog(n.name, "Your support job runs at half your main job's level. A Warrior with White Mage support can cure; a White Mage with Black Mage support can nuke." + (player.lv < 6 ? " Reach level 6 and I'll tell you about the advanced jobs." : ""), opts);
  },
  talkPell(n) {
    openDialog(n.name, "Potions, ethers, arms and armor. Gil talks, friend.", [
      { label: "Trade", fn: () => { closeDialog(); openModal("shop"); } }
    ].concat(questOptions("pell", n)));
  },
  talkYsolde(n) {
    const q = save.quests;
    if (save.mountLicense) { openDialog(n.name, "Your Thornstrider's been fed and brushed. Call it in open country with the Mount button or R. It won't come into town or caves, and it bolts if anything hits you, so dismount before a fight.", []); return; }
    if (player.lv < 5) { openDialog(n.name, "Thornstriders are proud beasts. They won't carry a greenhorn. Reach level 5 and come see me about a riding license.", []); return; }
    if (q.riding === "none") {
      openDialog(n.name, "You've got the look of someone who's walked the Hollow too many times. A riding license costs 300 gil, plus 3 Healing Herbs for the beast's feed. Hares and worms in the Hollow carry them.", [
        { label: "I'll get them", fn: () => { q.riding = "active"; log("Quest accepted: " + QUESTS.riding.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
      ]);
      return;
    }
    const herbs = invCount("healing_herb");
    if (save.gil >= 300 && herbs >= 3) {
      openDialog(n.name, "Herbs and coin. Good. She's yours: a Thornstrider, antlers and all. Treat her well.", [
        { label: "Pay 300 gil and hand over the herbs", fn: () => {
          save.gil -= 300; removeItem("healing_herb", 3);
          q.riding = "done"; save.mountLicense = true;
          log("Quest complete: " + QUESTS.riding.name + ". You can now ride a Thornstrider. Press R or Mount in open country.", "npc");
          giveReward(QUESTS.riding.reward);
          saveGame(); closeDialog();
        } }
      ]);
    } else openDialog(n.name, "You have " + herbs + " of 3 Healing Herbs and " + save.gil + " of 300 gil.", []);
  },
  talkBrann(n) {
    const hired = save.hired.length;
    openDialog(n.name, hired ? "Your company's holding up, I hope. Need more swords, or fewer mouths to feed?" : "Nobody walks the Hollow alone for long. My people fight for coin: pay their fee once and they'll follow you anywhere. Up to five at a time.", [
      { label: "Hire or dismiss companions", fn: () => { closeDialog(); openModal("mercs"); } }
    ].concat(questOptions("brann", n)));
  },
  talkCrystal(n) {
    for (const p of S.party) { p.alive = true; p.hp = p.maxHp; p.mp = p.maxMp; }
    ring(n, "#80deea", 60, 0.9, "sparkle");
    sfx("cure", n);
    vfx("crystal", { at: n });
    saveGame();
    const isHome = save.home.zone === S.zoneId && save.home.npc === n.id;
    openDialog(n.name, "The crystal's light washes over your party. HP and MP restored." + (isHome ? " This is your home point." : " You can make this your home point: you'll return here if you fall."), isHome ? [] : [
      { label: "Set as home point", fn: () => { save.home = { zone: S.zoneId, npc: n.id }; log("Home point set: " + S.zone.name + ".", "npc"); sfx("unlock"); saveGame(); closeDialog(); } }
    ]);
  }
};

function homePos() {
  const z = ZONES[save.home.zone];
  const c = z.npcs.find(n => n.id === save.home.npc) || z.npcs.find(n => NPCS[n.id] && NPCS[n.id].crystal);
  return c ? { zone: save.home.zone, x: c.x, y: c.y + 80 } : { zone: "outpost", x: ZONES.outpost.start.x, y: ZONES.outpost.start.y };
}

function returnHome() {
  const j = save.jobs[save.mainJob];
  const loss = Math.min(j.xp, Math.floor(xpNeed(j.lv) * CONFIG.deathXpLossPct));
  if (loss > 0 && j.lv < CONFIG.levelCap) { j.xp -= loss; log("You lose " + loss + " experience points.", "foe"); }
  S.ko = false;
  showKO(false);
  for (const p of S.party) { p.alive = true; p.hp = p.maxHp; p.mp = p.maxMp; p.tp = 0; p.buffs = {}; p.mounted = false; }
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
}

function canEquip(id) {
  const it = ITEMS[id];
  if (!it.jobs.includes(save.mainJob)) return "Not usable by " + save.mainJob;
  if (it.lv > save.jobs[save.mainJob].lv) return "Requires Lv." + it.lv;
  return "";
}

function equip(id) {
  const why = canEquip(id);
  if (why) { log(why + ".", "sys"); sfx("error"); return; }
  const it = ITEMS[id];
  if (!removeItem(id, 1)) return;
  const old = save.gear[it.slot];
  if (old) giveItem(old, 1, true);
  save.gear[it.slot] = id;
  if (it.slot === "main") { player.tp = 0; player.swingTimer = it.delay; }
  log("You equip the " + it.name + ".", "you");
  sfx("equip");
  refreshPlayer(false);
  saveGame();
}

function unequip(slot) {
  const id = save.gear[slot];
  if (!id) return;
  if (save.inventory.length >= CONFIG.inventorySize) { log("Your inventory is full.", "sys"); return; }
  delete save.gear[slot];
  giveItem(id, 1, true);
  if (slot === "main") player.tp = 0;
  log("You unequip the " + ITEMS[id].name + ".", "you");
  refreshPlayer(false);
  saveGame();
}

function setJob(main, sub) {
  if (sub === main) sub = null;
  if (!jobUnlocked(main)) { log(JOBS[main].name + " is locked. Tobin can teach it once you reach level " + ADVANCED_JOBS[main].lv + ".", "sys"); sfx("error"); return; }
  if (sub && !save.supportUnlocked) { log("Support jobs are locked. Talk to Tobin.", "sys"); return; }
  if (sub && !jobUnlocked(sub)) { log(JOBS[sub].name + " is locked. Tobin can teach it once you reach level " + ADVANCED_JOBS[sub].lv + ".", "sys"); sfx("error"); return; }
  save.mainJob = main;
  save.subJob = sub;
  for (const slot of SLOTS) {
    const id = save.gear[slot];
    if (id && canEquip(id)) { delete save.gear[slot]; giveItem(id, 1, true); }
  }
  player.tp = 0;
  player.buffs = {};
  player.recasts = {};
  refreshPlayer(true);
  log("You are now a level " + player.lv + " " + JOBS[main].name + (sub ? " with " + JOBS[sub].name + " support (Lv." + Math.floor(player.lv / 2) + ")" : "") + ".", "npc");
  sfx("unlock");
  saveGame();
}

function shopList() {
  return SHOP.filter(id => {
    const it = ITEMS[id];
    if (it.kind === "tool" && !FEATURES.gathering) return false;
    if ((it.kind === "crystal" || ["copper_ore", "ash_log", "healing_herb"].includes(id)) && !FEATURES.crafting) return false;
    return true;
  });
}

function sellPrice(id) { const it = ITEMS[id]; return it.rare || it.ex ? 0 : Math.floor(it.price / 4); }

function buy(id) {
  const it = ITEMS[id];
  if (save.gil < it.price) { log("You cannot afford the " + it.name + ".", "sys"); sfx("error"); return; }
  if (!giveItem(id, 1, true)) return;
  save.gil -= it.price;
  log("You buy " + an(it.name) + " for " + it.price + " gil.", "loot");
  sfx("coin");
  saveGame();
}

function sell(id) {
  const p = sellPrice(id);
  if (p <= 0) { log("Pell won't buy that.", "sys"); sfx("error"); return; }
  if (!removeItem(id, 1)) return;
  save.gil += p;
  log("You sell " + an(ITEMS[id].name) + " for " + p + " gil.", "loot");
  sfx("coin");
  saveGame();
}

function startNewGame() {
  save = newSave();
  saveGame();
  S.nmDeadUntil = {};
  initParty();
  clearLog();
  log("A new adventure begins.", "npc");
  const z = ZONES.outpost;
  enterZone("outpost", z.start.x, z.start.y);
}

function applyLoadedSave(d) {
  if (S.charId) d.created = (loadRoster().chars.find(c => c.id === S.charId) || {}).created || d.created;
  save = d;
  saveGame();
  S.nmDeadUntil = {};
  initParty();
  clearLog();
  log("Save loaded. Welcome back.", "npc");
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
}

function initParty() {
  player = makeChar({ kind: "pc", name: save.name || "Adventurer" });
  S.party = [player];
  S.ko = false;
  showKO(false);
  refreshPlayer(true);
  rebuildParty();
  S.macroKey = "";
}

const EMOTES = { wave: "waves", bow: "bows", cheer: "cheers", dance: "dances", laugh: "laughs", nod: "nods", clap: "claps", point: "points", salute: "salutes", panic: "panics", cry: "cries", thumbsup: "gives a thumbs up" };
const COMMANDS = [
  ["/rest", "Sit down and recover HP and MP quickly. Also /heal or /sit. Type it again or move to stand up."],
  ["/stand", "Stand up."],
  ["/attack", "Attack your target, or the nearest enemy. Also /a."],
  ["/target name", "Target the nearest character whose name matches. Also /ta."],
  ["/assist", "Target what your party is fighting."],
  ["/check", "Check your target's level and difficulty. Also /c."],
  ["/cast spell", "Cast a spell by name, e.g. /cast cure. Also /ma."],
  ["/ja ability", "Use a job ability, e.g. /ja provoke."],
  ["/ws name", "Use a weapon skill, e.g. /ws fast blade."],
  ["/item name", "Use an item, e.g. /item potion."],
  ["/mount, /dismount", "Call or dismiss your Thornstrider."],
  ["/jump", "Jump."],
  ["/time", "Show the game time and weekday."],
  ["/where", "Show your zone and position."],
  ["/clear", "Clear the chat log."],
  ["/wave, /bow, /cheer…", "Emotes: " + Object.keys(EMOTES).join(", ") + "."],
  ["/help", "List commands."]
];

function findNamed(list, q) {
  q = q.toLowerCase().trim();
  if (!q) return null;
  const hits = list.filter(e => e.name && e.name.toLowerCase().includes(q)).sort((a, b) => dist(a, player) - dist(b, player));
  return hits[0] || null;
}

function actByName(kind, q) {
  q = q.toLowerCase().replace(/["']/g, "").trim();
  const list = actionList(player).filter(a => a.kind === kind);
  const nm = a => (kind === "ma" ? SPELLS[a.id].name : kind === "ja" ? ABILITIES[a.id].name : WEAPON_SKILLS[a.id].name).toLowerCase();
  return list.find(a => nm(a) === q) || list.find(a => nm(a).startsWith(q)) || list.find(a => nm(a).includes(q)) || null;
}

function runCommand(text) {
  text = String(text || "").trim();
  if (!text) return;
  if (text[0] !== "/") { log(save.name + ": " + text, "say"); return; }
  const sp = text.indexOf(" ");
  const cmd = (sp < 0 ? text.slice(1) : text.slice(1, sp)).toLowerCase();
  const arg = sp < 0 ? "" : text.slice(sp + 1).trim();
  const castBy = kind => {
    if (!arg) { log("Usage: /" + cmd + " name", "sys"); return; }
    const a = actByName(kind, arg);
    if (!a) { log("You don't know " + (kind === "ma" ? "a spell" : kind === "ja" ? "an ability" : "a weapon skill") + " called \"" + arg + "\".", "sys"); sfx("error"); return; }
    playerAct({ kind: a.kind, id: a.id, name: a.name });
  };
  switch (cmd) {
    case "rest": case "heal": case "sit": toggleRest(); return;
    case "stand": if (player.resting) standUp(player); else log("You're already standing.", "sys"); return;
    case "attack": case "a": toggleEngage(false); return;
    case "target": case "ta": {
      if (!arg) { cycleTarget(); return; }
      const t = findNamed(S.mobs.filter(m => m.alive && !m.despawned && dist(m, player) < 900).concat(S.npcs, S.party), arg);
      if (!t) { log("No one called \"" + arg + "\" nearby.", "sys"); sfx("error"); return; }
      if (isMob(t)) setTarget(t); else player.target = t;
      sfx("select");
      return;
    }
    case "assist": {
      const t = partyBattleTarget();
      if (!t) { log("Your party isn't fighting anything.", "sys"); return; }
      setTarget(t); sfx("select");
      return;
    }
    case "check": case "c": {
      const t = player.target;
      if (!isMob(t)) { log(t ? t.name + " is not an enemy." : "You have no target.", "sys"); return; }
      const [c] = conOf(t);
      const f = t.fam;
      const aggro = f.aggro ? Object.keys(f.aggro).map(k => ({ sight: "sight", sound: "sound", magic: "magic", lowhp: "low HP" }[k])).join(", ") : "passive";
      log("The " + t.name + " (Lv." + t.lv + ") seems like " + (c === "Too Weak" ? "too weak to be worthwhile" : c === "Easy Prey" ? "easy prey" : c === "Decent Challenge" ? "a decent challenge" : c === "Even Match" ? "an even match" : c === "Tough" ? "a tough opponent" : c === "Very Tough" ? "a very tough opponent" : "an incredibly tough opponent") + ". Detects by: " + aggro + "." + (f.nm ? " It is a notorious monster!" : ""), "sys");
      return;
    }
    case "cast": case "ma": castBy("ma"); return;
    case "ja": castBy("ja"); return;
    case "ws": castBy("ws"); return;
    case "item": case "use": {
      const q = arg.toLowerCase();
      const s = save.inventory.find(x => ITEMS[x.id].kind === "use" && ITEMS[x.id].name.toLowerCase() === q) || save.inventory.find(x => ITEMS[x.id].kind === "use" && ITEMS[x.id].name.toLowerCase().includes(q));
      if (!s || !q) { log("You don't have a usable item called \"" + arg + "\".", "sys"); sfx("error"); return; }
      useItem(s.id);
      return;
    }
    case "mount": if (!player.mounted) toggleMount(); return;
    case "dismount": if (player.mounted) dismount("You dismount."); return;
    case "jump": if (typeof tryJump === "function") tryJump(); return;
    case "time": case "clock": log(clockText() + " · " + (isNight() ? "night" : "day") + " · " + dayElement() + " spells +10% today.", "sys"); return;
    case "where": case "pos": log(S.zone.name + " (" + Math.round(player.x) + ", " + Math.round(player.y) + ")", "sys"); return;
    case "clear": if (typeof clearLog === "function") clearLog(); return;
    case "help": case "?": case "commands": for (const [c, d] of COMMANDS) log(c + " — " + d, "sys"); return;
  }
  if (EMOTES[cmd]) {
    const t = player.target && player.target !== player ? (isMob(player.target) ? " at the " : " at ") + player.target.name : "";
    log(save.name + " " + EMOTES[cmd] + t + ".", "say");
    return;
  }
  log("Unknown command: /" + cmd + ". Type /help for a list.", "sys");
  sfx("error");
}
