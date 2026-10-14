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
function weatherNow(zoneId) {
  const id = zoneId || S.zoneId, tbl = WEATHER[id];
  if (!tbl) return null;
  const mins = (Date.now() + S.timeShift - VANA_EPOCH) * 25 / 60000;
  const slot = Math.floor(mins / 180);
  const r = seeded(hashStr(id + ":w:" + slot))();
  const tot = tbl.reduce((a, w) => a + w[1], 0);
  let acc = 0;
  for (const [k, w] of tbl) { acc += w / tot; if (r < acc) return k; }
  return tbl[0][0];
}
function weatherElement() { const w = weatherNow(); return w && WEATHER_INFO[w].el || null; }
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
    inventory: [{ id: "potion", qty: 3 }],
    gil: CONFIG.startGil,
    quests: Object.fromEntries(Object.keys(QUESTS).map(k => [k, "none"])),
    mountCoat: "teal", coats: ["teal"], saddle: false, blessing: 0, buddies: [], buddyNames: {}, buddy: null, buddyOut: false, race: { best: null, medals: {} }, mountLicense: false, jobsUnlocked: { PLD: false, RDM: false, THF: false, MNK: false, RNG: false, SMN: false, DRK: false, BRD: false }, look: { build: 0, skin: 1, hairStyle: 0, hairColor: 1 },
    hired: [], home: { zone: "outpost", npc: "crystal_town" }, keyItems: [], timers: {}, landmarks: {}, qprog: {}, crypt: { solved: false, lit: [] }, storage: [], furniture: [], crafts: { smithing: 0, woodworking: 0, clothcraft: 0, alchemy: 0, cooking: 0 }, food: null, gatherSkill: { mining: 0, logging: 0, harvesting: 0, fishing: 0 }, gardens: {}, harvests: 0, created: Date.now(),
    stance: "assist", mercGear: {}, bond: {}, mercPaid: {}, bestiary: {}, ach: {}, nmKilled: {}, discovered: [], stats: { kills: 0, nm: 0, sc: 0, mb: 0, crafts: 0, hq: 0, gathers: 0, kos: 0, jumps: 0, trades: 0, ahSold: 0, ahBought: 0, bounties: 0, lotsWon: 0, fish: 0, bigFish: 0, meals: 0, ride: 0, summons: 0, rngKills: 0, bfWins: 0 }, board: { day: 0, done: [] }, story: { ch: 0, step: 0, prog: 0, done: false }, market: { press: {}, bought: { day: -1, n: {} }, listings: [], box: [] }, guild: { gp: 0, total: 0, active: {}, day: 0, done: [] }, augments: {}
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
  out.stats = Object.assign(newSave().stats, d.stats || {});
  if (!["assist", "follow", "hold"].includes(out.stance)) out.stance = "assist";
  if (typeof SKIN_TONES !== "undefined") out.look.skin = Math.min(Math.max(0, out.look.skin || 0), SKIN_TONES.length - 1);
  out.mountLicense = !!d.mountLicense;
  out.hired = (Array.isArray(d.hired) ? d.hired : []).filter(id => MERCS[id]).slice(0, CONFIG.maxParty - 1);
  out.home = d.home && ZONES[d.home.zone] && ZONES[d.home.zone].safe && NPCS[d.home.npc] && ZONES[d.home.zone].npcs.some(n => n.id === d.home.npc) ? d.home : newSave().home;
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
  out.keyItems = (Array.isArray(d.keyItems) ? d.keyItems : []).filter(id => ITEMS[id] && ITEMS[id].kind === "key");
  out.crypt = Object.assign({ solved: false, lit: [] }, d.crypt || {});
  out.storage = (Array.isArray(d.storage) ? d.storage : []).filter(s => s && ITEMS[s.id] && s.qty > 0);
  out.furniture = (Array.isArray(d.furniture) ? d.furniture : []).filter(f => f && ITEMS[f.id] && ITEMS[f.id].kind === "furniture" && Number.isInteger(f.c) && Number.isInteger(f.r));
  out.crafts = Object.assign(newSave().crafts, d.crafts || {});
  out.gatherSkill = Object.assign(newSave().gatherSkill, d.gatherSkill || {});
  out.gardens = d.gardens && typeof d.gardens === "object" ? d.gardens : {};
  out.harvests = d.harvests || 0;
  out.buddies = (Array.isArray(d.buddies) ? d.buddies : []).filter(id => BUDDIES[id]);
  out.buddyNames = d.buddyNames && typeof d.buddyNames === "object" ? d.buddyNames : {};
  if (!out.buddies.includes(out.buddy)) out.buddy = null;
  out.buddyOut = !!out.buddyOut && !!out.buddy;
  out.market = Object.assign(newSave().market, d.market && typeof d.market === "object" ? d.market : {});
  if (!Array.isArray(out.market.listings)) out.market.listings = [];
  if (!Array.isArray(out.market.box)) out.market.box = [];
  out.market.listings = out.market.listings.filter(l => l && ITEMS[l.id]);
  out.market.box = out.market.box.filter(b => b && ITEMS[b.id] && b.qty > 0);
  out.story = Object.assign(newSave().story, d.story && typeof d.story === "object" ? d.story : {});
  out.guild = Object.assign(newSave().guild, d.guild && typeof d.guild === "object" ? d.guild : {});
  if (!out.guild.active || typeof out.guild.active !== "object") out.guild.active = {};
  if (!Array.isArray(out.guild.done)) out.guild.done = [];
  if (!Array.isArray(out.crypt.lit)) out.crypt.lit = [];
  return out;
}

const MEM_STORE = new Map();
const STORE = {
  get(k) {
    if (MEM_STORE.has(k)) return MEM_STORE.get(k);
    try { return localStorage.getItem(k); } catch (e) { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); MEM_STORE.delete(k); return true; } catch (e) {}
    try { localStorage.removeItem(CONFIG.saveKey); localStorage.setItem(k, v); MEM_STORE.delete(k); return true; } catch (e) {}
    MEM_STORE.set(k, v);
    if (!S.storageWarned) {
      S.storageWarned = true;
      S.storageFull = true;
      if (typeof log === "function") log("Your browser's storage is full or blocked, so this character can't be saved between visits. Use System → Save to file to keep a copy, or free up space for this site.", "foe");
    }
    return false;
  },
  remove(k) { MEM_STORE.delete(k); try { localStorage.removeItem(k); } catch (e) {} }
};

const ROSTER_KEY = "usr_roster_v1";
const MAX_CHARS = 8;
const charKey = id => "usr_char_" + id;

function charSummary(id, d, prev) {
  return { id, name: d.name || "Adventurer", job: d.mainJob, lv: d.jobs[d.mainJob].lv, zone: d.home && ZONES[d.home.zone] ? ZONES[d.home.zone].name : "Ashenreach Outpost", look: Object.assign({}, d.look), created: d.created || (prev && prev.created) || Date.now(), played: Date.now(), gil: d.gil };
}

function loadRoster() {
  let r = null;
  try { r = JSON.parse(STORE.get(ROSTER_KEY)); } catch (e) {}
  if (r && Array.isArray(r.chars)) return r;
  r = { chars: [], current: null };
  try {
    const raw = STORE.get(CONFIG.saveKey);
    if (raw) {
      const d = normalizeSave(JSON.parse(raw));
      if (d) {
        const id = "c" + Date.now().toString(36);
        STORE.set(charKey(id), JSON.stringify(d));
        r.chars.push(charSummary(id, d));
        r.current = id;
      }
    }
  } catch (e) {}
  saveRoster(r);
  return r;
}

function saveRoster(r) { STORE.set(ROSTER_KEY, JSON.stringify(r)); }

function loadChar(id) {
  try {
    const raw = STORE.get(charKey(id));
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
  if (!RACES[d.look.race]) d.look.race = "human";
  if (RACES[d.look.race].sex != null) d.look.build = RACES[d.look.race].sex;
  if (d.mainJob === "WHM") d.gear = { main: "ash_club", head: "bronze_cap", body: "linen_robe" };
  else if (d.mainJob === "BLM") d.gear = { main: "ash_staff", head: "bronze_cap", body: "linen_robe" };
  d.inventory = [{ id: "potion", qty: 3 }];
  const id = "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  STORE.set(charKey(id), JSON.stringify(d));
  r.chars.push(charSummary(id, d));
  r.current = id;
  saveRoster(r);
  return id;
}

function deleteChar(id) {
  const r = loadRoster();
  r.chars = r.chars.filter(c => c.id !== id);
  if (r.current === id) r.current = null;
  STORE.remove(charKey(id));
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
    if (player && player.alive && !S.ko && S.zoneId && ZONES[S.zoneId]) save.loc = { zone: S.zoneId, x: Math.round(player.x), y: Math.round(player.y), face: +(player.face || 0).toFixed(2) };
    const txt = JSON.stringify(save);
    if (S.charId) {
      STORE.set(charKey(S.charId), txt);
      const r = loadRoster();
      const i = r.chars.findIndex(c => c.id === S.charId);
      const sum = charSummary(S.charId, save, i >= 0 ? r.chars[i] : null);
      if (i >= 0) r.chars[i] = sum; else r.chars.push(sum);
      saveRoster(r);
    }
    if (!S.charId) STORE.set(CONFIG.saveKey, txt);
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

function reach(e) { return e && e.stats && e.stats.wtype === "archery" ? CONFIG.bowRange : CONFIG.meleeRange; }

function spellSkill(sp) {
  if (sp.skill) return sp.skill;
  if (sp.kind === "summon") return "summoning";
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
  const augs = ch.kind === "pc" && typeof save !== "undefined" && save.augments ? save.augments : null;
  for (const slot of SLOTS) {
    const id = ch.gear[slot];
    if (!id) continue;
    const it = ITEMS[id];
    if (it.wtype) { dmg = it.dmg; delay = it.delay; wtype = it.wtype; }
    if (it.stats) for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k];
    if (augs && augs[id]) for (const [k, v] of augs[id]) g[k] = (g[k] || 0) + v;
  }
  const fd = ch.kind === "pc" && typeof save !== "undefined" && save.food && save.food.until > Date.now() && ITEMS[save.food.id] ? ITEMS[save.food.id].food : null;
  if (fd) for (const k in fd) g[k] = (g[k] || 0) + fd[k];
  for (const k of ATTRS) s[k] = Math.round(s[k] + g[k]);
  if (ch.job === "MNK" && wtype === "h2h") { dmg += 2 + Math.floor(lv * 0.5); delay = Math.max(1.6, delay * 0.8); }
  s.dmg = dmg;
  s.delay = delay;
  s.wtype = wtype;
  ch.stats = s;
  const wsk = skillOf(ch, wtype);
  const rc = ch.kind === "pc" && typeof save !== "undefined" && save.look ? RACES[save.look.race] || RACES.human : null;
  if (rc) for (const k in rc.attrs) s[k] = Math.max(1, Math.round(s[k] + rc.attrs[k] * (1 + lv / 20)));
  s.maxHp = Math.round((hp + g.hp) * (rc ? rc.hp : 1));
  s.maxMp = Math.round((mp + g.mp) * (rc && mp > 0 ? rc.mp : 1) * (ch.kind === "pc" && mp > 0 ? 1 + buddyPerk("mp") : 1));
  s.acc = Math.round(58 + s.dex * 0.5 + 0.6 * wsk + lv + g.acc);
  s.att = Math.round((10 + s.str + 4 * lv + g.att) * (rc && rc.attMul ? rc.attMul : 1));
  if (rc && rc.rangedAcc && wtype === "archery") s.acc += rc.rangedAcc;
  s.def = Math.round(8 + s.vit * 0.5 + 3 * lv + g.def);
  s.eva = Math.round(50 + s.agi * 0.5 + 3 * lv + g.eva + (ch.kind === "pc" ? buddyPerk("eva") : 0));
  if (ch.mercId && typeof save !== "undefined" && save.bond) {
    const k = 1 + bondLevel(ch.mercId) * COMPANION_CFG.bondBonus;
    s.maxHp = Math.round(s.maxHp * k); s.maxMp = Math.round(s.maxMp * k); s.att = Math.round(s.att * k); s.def = Math.round(s.def * k); s.acc = Math.round(s.acc * k);
  }
  ch.maxHp = s.maxHp;
  ch.maxMp = s.maxMp;
  ch.delay = delay;
  if (ch.kind === "pc") ch.speed = 140 * (rc ? rc.speed : 1);
  ch.hp = ch.hp == null ? s.maxHp : Math.min(ch.hp, s.maxHp);
  ch.mp = ch.mp == null ? s.maxMp : Math.min(ch.mp, s.maxMp);
  ch.color = ch.mercId ? MERCS[ch.mercId].color : ch.pet ? (ch.color || "#4dd0e1") : JOBS[ch.job].color;
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
  if (job === "THF") return lv >= 11 ? { main: "steel_dagger", body: "brigand_vest", hands: "leather_gloves", feet: "leather_boots" } : lv >= 6 ? { main: "iron_dagger", body: "brigand_vest", feet: "leather_boots" } : { main: "bronze_dagger", body: "leather_vest" };
  if (job === "RNG") return lv >= 11 ? { main: "steel_longbow", body: "hunters_coat", feet: "leather_boots", hands: "leather_gloves" } : lv >= 6 ? { main: "yew_bow", body: "hunters_coat", feet: "leather_boots" } : { main: "shortbow", body: "leather_vest" };
  if (job === "DRK") return lv >= 11 ? { main: "steel_scythe", body: "shadow_plate", head: "iron_helm", hands: "leather_gloves" } : lv >= 6 ? { main: "iron_scythe", body: "shadow_plate", head: "bronze_cap" } : { main: "bronze_scythe", body: "leather_vest", head: "bronze_cap" };
  if (job === "BRD") return lv >= 14 ? { main: "steel_dagger", body: "troubadour_coat", feet: "leather_boots", hands: "leather_gloves" } : lv >= 6 ? { main: "iron_dagger", body: "minstrel_coat", feet: "leather_boots" } : { main: "bronze_dagger", body: "linen_robe" };
  if (job === "MNK") return lv >= 11 ? { main: "steel_claws", body: "training_gi", legs: "leather_trousers" } : lv >= 6 ? { main: "iron_knuckles", body: "training_gi" } : { main: "leather_cesti", body: "leather_vest" };
  if (job === "RDM") return lv >= 6 ? { main: "iron_sword", body: "scarlet_tabard", hands: "leather_gloves", feet: "leather_boots" } : { main: "bronze_sword", body: "linen_robe", feet: "leather_boots" };
  return lv >= 6 ? { main: "holly_staff", body: "cotton_robe" } : { main: "ash_staff", body: "linen_robe" };
}

function mercCanWear(id, itemId) {
  const it = ITEMS[itemId], m = MERCS[id];
  if (!it || it.kind !== "equip") return "That isn't equipment.";
  if (!it.jobs.includes(m.job)) return m.name + " can't use that.";
  if (it.lv > player.lv) return "Requires Lv." + it.lv + ".";
  return "";
}

function mercGearFor(id, lv) {
  const g = Object.assign({}, mercGear(id, lv));
  const own = save.mercGear[id] || {};
  for (const slot in own) if (ITEMS[own[slot]] && ITEMS[own[slot]].lv <= lv) g[slot] = own[slot];
  return g;
}

function giveMercGear(id, itemId) {
  const why = mercCanWear(id, itemId);
  if (why) { log(why, "sys"); sfx("error"); return why; }
  const it = ITEMS[itemId];
  if (!removeItem(itemId, 1)) return "You don't have that.";
  const own = save.mercGear[id] = save.mercGear[id] || {};
  if (own[it.slot]) giveItem(own[it.slot], 1, true);
  own[it.slot] = itemId;
  log("You give " + an(it.name) + " to " + MERCS[id].name + ".", "you");
  partySay(S.party.find(p => p.mercId === id), "gift", true);
  sfx("equip");
  syncAllies(false);
  saveGame();
  return "";
}

function takeMercGear(id, slot) {
  const own = save.mercGear[id];
  if (!own || !own[slot]) return;
  if (save.inventory.length >= CONFIG.inventorySize && !save.inventory.some(x => x.id === own[slot])) { log("Your bag is full.", "sys"); sfx("error"); return; }
  giveItem(own[slot], 1, true);
  log(MERCS[id].name + " hands back the " + ITEMS[own[slot]].name + ".", "you");
  delete own[slot];
  syncAllies(false);
  saveGame();
}

function bondLevel(id) {
  const b = save.bond[id] || 0, st = COMPANION_CFG.bondSteps;
  let lv = 0;
  for (let i = 1; i < st.length; i++) if (b >= st[i]) lv = i;
  return lv;
}

function addBond(id, n) {
  const before = bondLevel(id);
  save.bond[id] = (save.bond[id] || 0) + n;
  const after = bondLevel(id);
  if (after > before) {
    const m = S.party.find(p => p.mercId === id);
    log("Your bond with " + MERCS[id].name + " grows to level " + after + ".", "loot");
    if (m) { log(MERCS[id].name + ": " + MERC_PERSONAL[id][after - 1], "party"); buildStats(m); }
    sfx("unlock");
    uiEvent("bond", { id, lv: after });
  }
}

function mercWage(id) { return Math.max(10, Math.ceil(MERCS[id].fee * COMPANION_CFG.wageRate)); }

function tickWages() {
  const now = Date.now();
  for (const id of save.hired.slice()) {
    if (!save.mercPaid[id]) save.mercPaid[id] = now + COMPANION_CFG.dayMs;
    if (now < save.mercPaid[id]) continue;
    if (partyInCombat()) return;
    const w = mercWage(id);
    if (save.gil >= w) {
      save.gil -= w;
      save.mercPaid[id] = now + COMPANION_CFG.dayMs;
      log("You pay " + MERCS[id].name + " a day's wage (" + w + " crystals).", "sys");
    } else {
      log(MERCS[id].name + " hasn't been paid and heads back to the Mercenary Hall.", "foe");
      delete save.mercPaid[id];
      dismissMerc(id, true);
      sfx("error");
    }
    saveGame();
  }
}

function summonPet(a, sp) {
  if (a !== player) return;
  if (S.pet) releasePet(null);
  const P = PETS[sp.pet];
  const pet = makeChar({ kind: "ally", pet: true, petKey: sp.pet, name: P.name, job: "MNK", sub: null, role: "pet", speed: 160, lv: player.lv });
  pet.gear = {};
  pet.x = player.x + Math.cos(player.face) * 30; pet.y = player.y + Math.sin(player.face) * 30;
  pet.px = pet.x; pet.py = pet.y;
  buildStats(pet);
  pet.color = "#" + P.col.toString(16).padStart(6, "0");
  S.pet = pet;
  S.party.push(pet);
  S.petTick = S.time + 3;
  save.stats.summons++;
  log("You call forth the " + P.name + "!", "you");
  popText(pet, P.name, pet.color, 13, 1.2, 14);
  vfx("buff", { tgt: pet, id: "summon" });
  sfx("burst", pet);
}

function releasePet(msg) {
  const pet = S.pet;
  if (!pet) return;
  S.pet = null;
  S.party = S.party.filter(p => p !== pet);
  for (const m of S.mobs) m.enmity && m.enmity.delete(pet);
  if (player.target === pet) player.target = null;
  if (msg) log(msg, "sys");
}

function tickPet() {
  const pet = S.pet;
  if (!pet) return;
  if (!pet.alive || player.job !== "SMN" || !player.alive) { releasePet("Your " + pet.name + " fades away."); return; }
  if (S.time >= S.petTick) {
    S.petTick = S.time + 3;
    const cost = 1 + Math.floor(player.lv / 6);
    if (player.mp < cost) { releasePet("You run out of MP and your " + pet.name + " fades away."); return; }
    player.mp -= cost;
  }
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
    if (a.pet) { a.lv = player.lv; a.hp = null; buildStats(a); a.color = "#" + PETS[a.petKey].col.toString(16).padStart(6, "0"); continue; }
    const hpPct = a.maxHp ? a.hp / a.maxHp : 1;
    const mpPct = a.maxMp ? a.mp / a.maxMp : 1;
    a.lv = player.lv;
    a.gear = mercGearFor(a.mercId, a.lv);
    a.hp = null; a.mp = null;
    buildStats(a);
    if (!full && a.alive && hpPct > 0) { a.hp = Math.max(1, Math.round(a.maxHp * hpPct)); a.mp = Math.round(a.maxMp * mpPct); }
    if (!a.alive) a.hp = 0;
  }
}

function rebuildParty() {
  const old = S.party;
  S.party = [player];
  if (S.pet) S.party.push(S.pet);
  save.hired.forEach((id, i) => {
    let m = old.find(p => p.mercId === id);
    if (!m) {
      m = makeMerc(id);
      m.lv = player.lv;
      m.gear = mercGearFor(id, m.lv);
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
  if (save.gil < m.fee) { log("You can't afford " + m.name + "'s fee (" + m.fee + " crystals).", "sys"); sfx("error"); return; }
  save.gil -= m.fee;
  save.hired.push(id);
  save.mercPaid[id] = Date.now() + COMPANION_CFG.dayMs;
  rebuildParty();
  log("You hire " + m.name + " for " + m.fee + " crystals.", "loot");
  partySay(S.party.find(p => p.mercId === id), "hire", true);
  sfx("unlock");
  saveGame();
}

function dismissMerc(id, quiet) {
  const i = save.hired.indexOf(id);
  if (i < 0) return;
  save.hired.splice(i, 1);
  delete save.mercPaid[id];
  rebuildParty();
  if (!quiet) log(MERCS[id].name + " leaves the party.", "sys");
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
    id: ++S.mobSeq, kind: "mob", famKey, fam: f, name: f.name, lv: L, stats: st, aggro: f.aggro, passive: !f.aggro, hp: st.maxHp, maxHp: st.maxHp, mp: 0, maxMp: 0, tp: 0,
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
  if (k === "att" && b.warcry) v *= 1.2;
  if (k === "att" && b.last_resort) v *= 1.25;
  if (k === "def" && b.last_resort) v *= 0.85;
  if (k === "att" && b.minuet) v *= 1 + b.minuet.pow;
  if (k === "att" && b.blight) v *= 0.9;
  if (k === "acc" && b.madrigal) v += b.madrigal.pow;
  if (k === "def" && b.berserk) v *= 0.75;
  if (k === "def" && b.dia) v *= 0.9;
  if (k === "def" && b.sentinel) v *= 1.5;
  if (k === "def" && b.protect) v *= 1.15;
  if (k === "acc" && b.flash) v *= 0.6;
  if (k === "acc" && b.focus) v += 25;
  if (k === "acc" && b.sharpshot) v += 40;
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

function swingDelay(e) { return e.delay * (e.buffs && e.buffs.slow ? 1.25 : 1) * (e.buffs && e.buffs.march ? 1 - e.buffs.march.pow : 1); }

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
  if (src && src !== tgt) tgt.lastHitAng = Math.atan2(src.y - tgt.y, src.x - tgt.x);
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
  if (tgt.buffs && tgt.buffs.sleep && amt > 0) { delete tgt.buffs.sleep; if (isMob(tgt)) log("The " + tgt.name + " wakes up!", "sys"); }
  if (tgt.hp <= 0) onKO(tgt, src);
}

function mobReach(m) { return isMob(m) && m.fam.range ? m.fam.range : CONFIG.meleeRange; }

function swing(a, d) {
  const tpGain = Math.round(CONFIG.tpPerDelay * a.delay);
  a.lastSwing = S.time;
  if (a.buffs && a.buffs.paralyze && Math.random() < 0.25) {
    log(subj(a) + " " + vb(a, "are", "is") + " paralyzed.", cls(a));
    popText(a, "Paralyzed", "#b3e5fc", 13, 0.9, 10);
    return;
  }
  if (a === player) trySkillUp(a.stats.wtype, d.lv);
  const b = a.buffs || {};
  const sneak = !!b.sneak_attack, boost = !!b.boost;
  if (sneak) delete b.sneak_attack;
  if (boost) delete b.boost;
  const bow = (a.stats && a.stats.wtype === "archery") || (isMob(a) && a.fam.range);
  if (bow) vfx("arrow", { src: a, tgt: d });
  if (bow && b.barrage && !a.volley) {
    delete b.barrage;
    a.volley = true;
    log(subj(a) + " " + vb(a, "loose") + " a Barrage!", cls(a));
    for (let k = 0; k < 3 && d.alive; k++) swing(a, d);
    a.volley = false;
    return;
  }
  if (!sneak && Math.random() * 100 >= hitChance(a, d)) {
    log(subj(a) + " " + vb(a, "miss", "misses") + " " + obj(d) + ".", cls(a));
    popText(d, "Miss", "#bbbbbb", 14, 0.8);
    sfx("miss", a);
    vfx("miss", { src: a, tgt: d });
    if (isMob(d)) aggro(d, a);
    return;
  }
  const critPct = CONFIG.critPct + (a.job === "THF" ? 5 : 0) + (b.focus ? 10 : 0);
  const crit = sneak || Math.random() * 100 < critPct;
  let dmg = Math.floor(baseDmg(a, d) * pDIF(a, d) * (crit ? CONFIG.critMult : 1));
  if (sneak) { dmg += Math.floor(a.stats.dex * 0.8); popText(a, "Sneak Attack", "#a1887f", 12, 1, 14); }
  if (boost) dmg = Math.floor(dmg * 1.5);
  if (b.soulfire && a.hp > 1) { const burn = Math.min(a.hp - 1, Math.floor(a.hp * 0.06)); a.hp -= burn; dmg += Math.floor(burn * 1.6); }
  a.tp = Math.min(CONFIG.tpMax, a.tp + tpGain + (boost ? 100 : 0));
  d.tp = Math.min(CONFIG.tpMax, d.tp + Math.round(tpGain / 3));
  if (crit) S.shake = Math.max(S.shake, 0.1);
  const wt = isMob(a) ? "blunt" : (a.stats.wtype === "sword" || a.stats.wtype === "greataxe" || a.stats.wtype === "archery" ? "slash" : "blunt");
  sfx(crit ? "crit" : wt === "slash" ? "slash" : "blunt", a);
  vfx("hit", { src: a, tgt: d, crit, slash: wt === "slash" });
  log(subj(a) + " " + vb(a, "hit") + " " + obj(d) + " for " + dmg + (crit ? " (critical)" : "") + ".", cls(a));
  applyDamage(a, d, dmg, { text: crit ? dmg + "!" : dmg, color: crit ? "#ffeb3b" : undefined, size: crit ? 21 : 16 });
  if (b.blood_blade && a.alive) { const heal = Math.min(a.maxHp - a.hp, Math.floor(dmg * 0.4)); if (heal > 0) { a.hp += heal; popText(a, "+" + heal, "#9ad06b", 13, 0.8); } }
  if (a.job === "MNK" && a.stats.wtype === "h2h" && d.alive && !a.kicking && Math.random() < 0.14) {
    a.kicking = true;
    log(subj(a) + " " + vb(a, "follow") + " up with a kick!", cls(a));
    swing(a, d);
    a.kicking = false;
  }
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
    if (e.spawnIdx != null) S.spawnAt[e.spawnIdx] = S.time + (placeholderNm ? CONFIG.respawn : respawn);
    if (e.fam.nm) {
      save.timers["nm:" + e.famKey] = Date.now() + respawn * 1000;
      if (!placeholderNm) S.nmDeadUntil[S.zoneId + ":" + e.spawnIdx] = S.time + respawn;
    }
    for (const p of S.party) if (p.attackTarget === e) { p.attackTarget = null; p.engaged = false; }
    if (S.chase && player.attackTarget == null) S.chase = false;
    const byParty = [...e.enmity.keys()].some(isParty);
    if (byParty || (src && isParty(src))) {
      save.stats.kills++;
      if (player.job === "RNG") save.stats.rngKills++;
      noteBeast(e, true);
      if (e.fam.nm) { save.stats.nm++; save.nmKilled[e.famKey] = (save.nmKilled[e.famKey] || 0) + 1; }
      for (const id of save.hired) if (S.party.some(p => p.mercId === id)) addBond(id, e.fam.nm ? 4 : xpFor(e.lv, player.lv) > 0 ? 1 : 0);
      const xp = xpFor(e.lv, player.lv);
      if (xp > 0) { const ch = advanceChain(); gainXp(Math.round(xp * (1 + CONFIG.chainStep * ch)), ch); } else log("No experience gained (too weak).", "sys");
      dropLoot(e);
      bountyKill(e);
      storyKill(e);
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
    if (e === player) { save.stats.kos++; S.ko = true; S.chase = false; S.moveTarget = null; showKO(true); }
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
  if (buddyPerk("xp")) n = Math.round(n * (1 + buddyPerk("xp")));
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

function giveKeyItem(id) {
  if (save.keyItems.includes(id)) return false;
  save.keyItems.push(id);
  log("You obtain the key item " + ITEMS[id].name + ".", "loot");
  sfx("unlock");
  uiEvent("item", { id, n: 1 });
  saveGame();
  return true;
}

function dropLoot(m) {
  for (const [id, chance, minLv] of m.fam.loot || []) {
    if (minLv && m.lv < minLv) continue;
    if (ITEMS[id].kind === "key") { giveKeyItem(id); continue; }
    if (ITEMS[id].kind === "crystal" && (!blessed() || xpFor(m.lv, player.lv) <= 0)) continue;
    if (Math.random() >= chance * (player.job === "THF" ? 1.2 : 1) + buddyPerk("drop")) continue;
    if (ITEMS[id].rare && hasItem(id)) { log("You already possess " + an(ITEMS[id].name) + ". It is lost.", "sys"); continue; }
    if (ITEMS[id].kind === "equip" && S.party.length > 1) { addToPool(id); continue; }
    giveItem(id, 1);
  }
  if (m.fam.gil) {
    const g = Math.round(rand(m.fam.gil[0], m.fam.gil[1]) * m.lv);
    save.gil += g;
    log("You obtain " + g + " crystals.", "loot");
    sfx("coin");
  }
}

function addToPool(id) {
  S.pool = S.pool || [];
  S.pool.push({ id, until: S.time + CONFIG.poolTime, lots: {}, mine: null, seq: ++S.mobSeq });
  log("The " + ITEMS[id].name + " goes into the treasure pool.", "loot");
  sfx("loot");
  uiEvent("pool", { id });
}

function poolUpgrade(merc, id) {
  const it = ITEMS[id], cur = merc.gear[it.slot];
  if (mercCanWear(merc.mercId, id)) return false;
  if (!cur) return true;
  const c = ITEMS[cur];
  return (it.lv || 0) > (c.lv || 0) || ((it.lv || 0) === (c.lv || 0) && (it.dmg || 0) + Object.values(it.stats || {}).reduce((a, b) => a + b, 0) > (c.dmg || 0) + Object.values(c.stats || {}).reduce((a, b) => a + b, 0));
}

function lotPool(seq, pass) {
  const e = (S.pool || []).find(x => x.seq === seq);
  if (!e || e.mine != null) return;
  if (pass) { e.mine = 0; log("You pass on the " + ITEMS[e.id].name + ".", "sys"); }
  else { e.mine = 1 + Math.floor(Math.random() * 999); log("You lot " + e.mine + " on the " + ITEMS[e.id].name + ".", "loot"); }
  sfx("select");
  tickPool(true);
}

function tickPool(force) {
  if (!S.pool || !S.pool.length) return;
  for (const e of S.pool.slice()) {
    for (const m of S.party) {
      if (m === player || !m.mercId || e.lots[m.mercId] != null) continue;
      if (S.time < e.until - CONFIG.poolTime + 1.5) continue;
      if (poolUpgrade(m, e.id)) { e.lots[m.mercId] = 1 + Math.floor(Math.random() * 999); log(m.name + " lots " + e.lots[m.mercId] + " on the " + ITEMS[e.id].name + ".", "party"); }
      else e.lots[m.mercId] = 0;
    }
    const allIn = e.mine != null && S.party.every(m => m === player || !m.mercId || e.lots[m.mercId] != null);
    if (!allIn && S.time < e.until) continue;
    if (e.mine == null) { e.mine = 1 + Math.floor(Math.random() * 999); log("Time's up: you lot " + e.mine + " on the " + ITEMS[e.id].name + ".", "loot"); }
    S.pool.splice(S.pool.indexOf(e), 1);
    let best = e.mine, who = e.mine > 0 ? "me" : null;
    for (const k in e.lots) if (e.lots[k] > best) { best = e.lots[k]; who = k; }
    if (!who) { log("Nobody wanted the " + ITEMS[e.id].name + ". It is lost.", "sys"); continue; }
    if (who === "me") { save.stats.lotsWon++; giveItem(e.id, 1); continue; }
    const it = ITEMS[e.id], own = save.mercGear[who] = save.mercGear[who] || {};
    if (own[it.slot]) giveItem(own[it.slot], 1, true);
    own[it.slot] = e.id;
    log(MERCS[who].name + " obtains the " + it.name + " and puts it on.", "party");
    partySay(S.party.find(p => p.mercId === who), "gift", true);
    syncAllies(false);
  }
  if (force) saveGame();
}

function eatFood(id) {
  const it = ITEMS[id];
  if (player.engaged || inCombatWith(player)) { log("You can't eat during a fight.", "sys"); sfx("error"); return; }
  if (save.food && save.food.until > Date.now() && save.food.id !== id) log("You set aside the " + ITEMS[save.food.id].name + " and eat something else.", "sys");
  removeItem(id, 1);
  save.food = { id, until: Date.now() + CONFIG.foodMinutes * 60000 };
  save.stats.meals++;
  player.buffs.food = { until: S.time + CONFIG.foodMinutes * 60 };
  log("You eat the " + it.name + ". " + foodText(it.food) + " for " + CONFIG.foodMinutes + " minutes.", "you");
  popText(player, it.name, "#ffcc80", 13, 1.2, 14);
  sfx("cure", player);
  refreshPlayer(false);
  saveGame();
}

function foodText(fd) { return Object.keys(fd).map(k => STAT_LABELS[k] + " +" + fd[k]).join(", "); }

function buddyPerk(k) { return 0; }
function buddyName(id) { return save.buddyNames[id] || BUDDIES[id].name; }

function learnBuddy(id) {
  if (!BUDDIES[id]) return false;
  if (save.buddies.includes(id)) { log("You already have " + an(BUDDIES[id].name) + ".", "sys"); return false; }
  save.buddies.push(id);
  if (!save.buddy) save.buddy = id;
  log(BUDDIES[id].name + " joins you as a pet! Open the Pets window to summon it.", "loot");
  sfx("unlock");
  uiEvent("buddy", { id });
  checkAchievements();
  saveGame();
  return true;
}

function equipBuddy(id) {
  if (!save.buddies.includes(id)) return "You don't have that pet.";
  const out = save.buddyOut;
  if (out) dismissBuddy(true);
  save.buddy = id;
  if (out) summonBuddy();
  saveGame();
  return "";
}

function nameBuddy(id, name) {
  name = String(name || "").replace(/[^A-Za-z' -]/g, "").trim().slice(0, 12);
  if (!save.buddies.includes(id)) return "You don't have that pet.";
  if (name.length < 2) delete save.buddyNames[id]; else save.buddyNames[id] = name.replace(/^./, c => c.toUpperCase());
  if (S.buddy && S.buddy.petId === id) S.buddy.name = buddyName(id);
  saveGame();
  return "";
}

function summonBuddy() {
  if (!save.buddy || !BUDDIES[save.buddy]) return "Choose a pet first.";
  if (S.zone && S.zone.battlefield) return "Pets stay out of the battlefield.";
  if (S.buddy) dismissBuddy(true);
  const B = BUDDIES[save.buddy];
  const b = { kind: "buddy", buddy: true, petId: save.buddy, name: buddyName(save.buddy), alive: true, x: player.x - Math.cos(player.face) * 36, y: player.y - Math.sin(player.face) * 36, px: 0, py: 0, face: player.face, speed: 170, radius: 8, buffs: {}, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9, wander: 0, idleT: 0 };
  b.px = b.x; b.py = b.y;
  S.buddy = b;
  save.buddyOut = true;
  log(b.name + " comes to your side.", "sys");
  ring(b, "#ffd54f", 18, 0.5, "sparkle");
  sfx("buff", b);
  refreshPlayer(false);
  saveGame();
  return "";
}

function dismissBuddy(quiet) {
  if (!S.buddy) return;
  const b = S.buddy;
  S.buddy = null;
  save.buddyOut = false;
  if (!quiet) { log(b.name + " curls up and vanishes into your pack.", "sys"); sfx("close"); }
  refreshPlayer(false);
  saveGame();
}

function toggleBuddy() {
  if (S.buddy) { dismissBuddy(false); return ""; }
  return summonBuddy();
}

function tickBuddy(dt) {
  const b = S.buddy;
  if (!b) return;
  if (!player.alive || S.ko || (S.zone && S.zone.battlefield)) { dismissBuddy(true); return; }
  const mounted = player.mounted;
  const behind = { x: player.x - Math.cos(player.face) * 26 + Math.sin(player.face) * 34, y: player.y - Math.sin(player.face) * 26 - Math.cos(player.face) * 34 };
  const d = Math.hypot(behind.x - b.x, behind.y - b.y);
  if (d > 650) { b.x = behind.x; b.y = behind.y; b.px = b.x; b.py = b.y; return; }
  if (d > 14) {
    b.wander = 0;
    moveToward(b, behind.x, behind.y, dt, 6, (mounted ? mountMul() : 1) * (d > 120 ? 1.5 : 1));
  } else {
    b.idleT += dt;
    if (b.idleT > 4 + (b.wander || 0)) { b.idleT = 0; b.wander = 2 + Math.random() * 4; b.wx = player.x + rand(-50, 50); b.wy = player.y + rand(-50, 50); }
    if (b.wander > 0 && b.wx != null) { if (moveToward(b, b.wx, b.wy, dt, 4, 0.5)) b.wx = null; }
    else b.face += normAng(Math.atan2(player.y - b.y, player.x - b.x) - b.face) * Math.min(1, dt * 3);
  }
  b.resting = !!player.resting;
  keepOutOfColliders(b);
}

function blessingMinutes() { return Math.min(BLESSING.maxMin, BLESSING.baseMin + BLESSING.perRankMin * guildRank()); }
function blessed() { return !!(save.blessing && save.blessing > Date.now()); }

function giveBlessing() {
  const mins = blessingMinutes();
  save.blessing = Date.now() + mins * 60000;
  save.stats.blessings = (save.stats.blessings || 0) + 1;
  log("You receive the City Blessing. Monsters will yield essences for " + mins + " minutes.", "loot");
  popText(player, "City Blessing", "#ffd54f", 14, 1.2, 14);
  ring(player, "#ffd54f", 30, 0.8, "sparkle");
  sfx("buff", player);
  vfx("buff", { tgt: player, id: "blessing" });
  tickBlessing();
  saveGame();
}

function tickBlessing() {
  if (!save.blessing) { if (player.buffs.blessing) delete player.buffs.blessing; return; }
  const left = (save.blessing - Date.now()) / 1000;
  if (left <= 0) { save.blessing = 0; delete player.buffs.blessing; log("The City Blessing fades. Visit a gate guard for another.", "sys"); return; }
  if (!player.buffs.blessing) player.buffs.blessing = { until: S.time + left + 1 };
  else player.buffs.blessing.until = S.time + left + 1;
}

function tickFood() {
  const f = save.food;
  if (!f) { if (player.buffs.food) delete player.buffs.food; return; }
  const left = (f.until - Date.now()) / 1000;
  if (left <= 0) { save.food = null; delete player.buffs.food; log("The effects of your " + (ITEMS[f.id] ? ITEMS[f.id].name : "meal") + " wear off.", "sys"); refreshPlayer(false); return; }
  if (!player.buffs.food) player.buffs.food = { until: S.time + left + 1 };
  else player.buffs.food.until = S.time + left + 1;
}

function nearWater(e, reach) {
  for (const w of S.zone.water || []) if (Math.hypot(e.x - w.x, e.y - w.y) < w.r + (reach || FISH_CFG.reach)) return w;
  return null;
}

function startFishing() {
  if (!player.alive) return "You are KO'd.";
  if (S.fish) return "You're already fishing.";
  if (invCount("fishing_rod") < 1 && invCount("sea_rod") < 1) return "You need a fishing rod. Pell and Marn sell them.";
  if (!FISH[S.zoneId]) return "Nothing bites here.";
  const w = nearWater(player);
  if (!w) return "Stand at the water's edge to fish.";
  if (player.engaged || inCombatWith(player)) return "You can't fish during a fight.";
  if (player.mounted) return "Dismount first.";
  if (invCount("bait") < 1) return "You're out of Fishing Bait. Pell sells it.";
  if (player.resting) standUp(player, true);
  removeItem("bait", 1);
  player.face = Math.atan2(w.y - player.y, w.x - player.x);
  const rainy = ["rain", "storm"].includes(weatherNow());
  S.fish = { state: "wait", at: S.time + rand(FISH_CFG.waitMin, FISH_CFG.waitMax) * (rainy ? 0.75 : 1), x: player.x, y: player.y };
  log("You cast your line.", "you");
  sfx("click", player);
  return "";
}

function stopFishing(msg) {
  if (!S.fish) return;
  S.fish = null;
  if (msg) log(msg, "sys");
}

function pickFish() {
  const w = weatherNow();
  const tbl = FISH[S.zoneId].filter(f => !f[3] || f[3] === w);
  const tot = tbl.reduce((a, f) => a + f[2], 0);
  let r = Math.random() * tot;
  for (const f of tbl) { r -= f[2]; if (r <= 0) return f; }
  return tbl[0];
}

function reelFish() {
  const f = S.fish;
  if (!f || f.state !== "bite") return;
  S.fish = null;
  const [id, lv] = pickFish();
  const skill = save.gatherSkill.fishing || 0;
  const chance = clamp(62 + (skill - lv) * 6 + (invCount("sea_rod") > 0 ? 10 : 0) + buddyPerk("fish") * 100, 12, 95);
  if (Math.random() * 100 >= chance) { log("You reel in hard, but the line goes slack. It got away.", "sys"); sfx("miss", player); return; }
  save.stats.fish++;
  if (id === "tidecaller_tuna") save.stats.tuna = (save.stats.tuna || 0) + 1;
  if (ITEMS[id].rarity === "rare") { save.stats.bigFish++; S.shake = Math.max(S.shake, 0.15); }
  giveItem(id, 1);
  log("You catch " + an(ITEMS[id].name) + "!", "loot");
  if (skill < FISH_CFG.cap && Math.random() < (lv >= skill - 2 ? 0.55 : 0.2)) {
    save.gatherSkill.fishing = Math.round((skill + (lv > skill ? 0.3 : 0.1)) * 10) / 10;
    log("Fishing skill rises to " + save.gatherSkill.fishing.toFixed(1) + ".", "sys");
  }
  saveGame();
}

function tickFish() {
  const f = S.fish;
  if (!f) return;
  if (!player.alive || Math.hypot(player.x - f.x, player.y - f.y) > 6 || player.engaged || inCombatWith(player)) { stopFishing("You reel in your line."); return; }
  if (f.state === "wait" && S.time >= f.at) { f.state = "bite"; f.until = S.time + FISH_CFG.bite; log("Something's biting! Reel it in!", "loot"); sfx("notify", player); uiEvent("bite", {}); }
  else if (f.state === "bite" && S.time > f.until) { S.fish = null; log("The fish slips the hook.", "sys"); }
}

function enterBattlefield() {
  if (invCount("chapel_sigil") < 1) return "You need a Chapel Sigil.";
  if (partyInCombat()) return "Not during a fight.";
  removeItem("chapel_sigil", 1);
  if (player.mounted) dismount(null);
  enterZone(BATTLEFIELD.zone, ZONES[BATTLEFIELD.zone].start.x, ZONES[BATTLEFIELD.zone].start.y);
  S.bf = { t0: S.time, until: S.time + BATTLEFIELD.minutes * 60, won: false };
  S.spawnAt = S.zone.spawns.map(() => S.time + 3);
  log("The sigil crumbles and the door grinds open. Defeat the Tidebound Priest within " + BATTLEFIELD.minutes + " minutes!", "foe");
  sfx("notify");
  return "";
}

function tickBattlefield() {
  const b = S.bf;
  if (!b || b.won) return;
  if (S.ko || !S.party.some(p => p.alive)) { S.bf = null; return; }
  if (S.time >= b.until) {
    S.bf = null;
    log("The water rises and sweeps you out of the chapel. Time's up.", "foe");
    enterZone("marsh", 640, 2050);
    return;
  }
  const boss = S.mobs.find(m => m.famKey === "tide_priest");
  if (b.seen && boss && !boss.alive && !b.won) winBattlefield();
  if (boss && boss.alive) b.seen = true;
}

function winBattlefield() {
  S.bf.won = true;
  save.stats.bfWins++;
  for (const m of S.mobs) if (m.alive && m.summonedBy) onKO(m, player);
  const pool = BATTLEFIELD.rewards.filter(id => !hasItem(id));
  const prize = pool.length ? pick(pool) : null;
  log("The Tidebound Priest sinks beneath the water. The chapel falls silent.", "loot");
  if (prize) giveItem(prize, 1);
  save.gil += BATTLEFIELD.gil;
  log("You obtain " + BATTLEFIELD.gil + " crystals.", "loot");
  gainXp(BATTLEFIELD.xp);
  sfx("fanfare");
  uiEvent("bf", { prize });
  saveGame();
}

function boardDay() { return Math.floor(Date.now() / 86400000); }

function ahTradable(id) { const it = ITEMS[id]; return !!it && it.price > 0 && !it.rare && !it.ex && !it.nm && it.kind !== "key" && it.kind !== "furniture"; }
function ahCategory(id) { const it = ITEMS[id]; if (it.kind === "equip") return it.slot === "main" ? "weapons" : "armor"; if (it.kind === "food" || it.kind === "use") return "consumables"; return "materials"; }
function marketTick() { return Math.floor(((Date.now() + S.timeShift - VANA_EPOCH) * 25 / 60000) / AH_CFG.tickMins); }
function marketDay(tk) { return Math.floor((tk == null ? marketTick() : tk) * AH_CFG.tickMins / 1440); }

function marketNews(day) {
  const r = seeded(hashStr("news:" + day)), cats = Object.keys(AH_CATS);
  const up = cats[Math.floor(r() * cats.length)];
  let down = cats[Math.floor(r() * cats.length)];
  if (down === up) down = cats[(cats.indexOf(up) + 2) % cats.length];
  return { up, down, text: [AH_NEWS[up][0], AH_NEWS[down][1]] };
}

function marketMult(id, tk) {
  const h = hashStr(id), p1 = (h % 1000) / 159, p2 = (Math.floor(h / 1000) % 1000) / 211;
  let m = 1 + 0.16 * Math.sin(tk * 0.83 + p1) + 0.09 * Math.sin(tk * 0.31 + p2) + 0.05 * Math.sin(tk * 2.1 + p1 * p2);
  const n = marketNews(marketDay(tk)), c = ahCategory(id);
  if (c === n.up) m *= 1.2;
  if (c === n.down) m *= 0.85;
  return m;
}

function pressOf(id) {
  const p = save.market.press[id];
  if (!p) return 0;
  return p.v * Math.pow(0.85, Math.max(0, marketTick() - p.tk));
}

function addPress(id, d) { save.market.press[id] = { v: clamp(pressOf(id) + d, -0.3, 0.4), tk: marketTick() }; }

function marketPrice(id, tk) {
  const now = marketTick(), t = tk == null ? now : tk;
  const v = Math.max(1, Math.round(ITEMS[id].price * marketMult(id, t) * (1 + (t === now ? pressOf(id) : 0))));
  return inShops(id) ? Math.min(v, Math.floor(ITEMS[id].price * 0.95)) : v;
}

function inShops(id) {
  if (!S.shopSet) { S.shopSet = new Set(SHOP); for (const k in SHOPS) for (const x of SHOPS[k]) S.shopSet.add(x); }
  return S.shopSet.has(id);
}

function priceHistory(id, n) { const now = marketTick(), out = []; for (let i = n - 1; i >= 0; i--) out.push(marketPrice(id, now - i)); return out; }

function ahStock(id) {
  const day = marketDay(), it = ITEMS[id];
  if (save.market.bought.day !== day) save.market.bought = { day, n: {} };
  const r = seeded(hashStr(id + ":" + day));
  const base = it.price > 3000 ? 1 : it.price > 800 ? 2 : it.price > 150 ? 4 : 8;
  const n = Math.floor(r() * (base + 1)) + (ahCategory(id) === "materials" || ahCategory(id) === "consumables" ? Math.ceil(base / 2) : 0);
  return Math.max(0, n - (save.market.bought.n[id] || 0));
}

function ahBuy(id, qty) {
  qty = Math.max(1, qty || 1);
  if (!ahTradable(id)) return "That isn't sold here.";
  if (ahStock(id) < qty) return "Not enough on the market today.";
  const cost = marketPrice(id) * qty;
  if (save.gil < cost) return "You need " + cost + " crystals.";
  if (!giveItem(id, qty, true)) return "Your bag is full.";
  save.gil -= cost;
  save.market.bought.n[id] = (save.market.bought.n[id] || 0) + qty;
  save.stats.ahBought = (save.stats.ahBought || 0) + qty;
  addPress(id, 0.03 * qty);
  log("You buy " + (qty > 1 ? qty + " " + ITEMS[id].name + "s" : an(ITEMS[id].name)) + " at auction for " + cost + " crystals.", "loot");
  sfx("coin");
  saveGame();
  return "";
}

function ahFee(price) { return Math.max(1, Math.ceil(price * AH_CFG.fee)); }

function ahList(id, qty, price) {
  qty = Math.max(1, Math.floor(qty || 1)); price = Math.floor(price || 0);
  if (!ahTradable(id)) return "You can't sell that at auction.";
  if (invCount(id) < qty) return "You don't have that many.";
  if (qty > (ITEMS[id].stack || 1)) return "You can list one stack at a time.";
  if (price < 1) return "Set a price.";
  if (save.market.listings.length >= AH_CFG.maxListings) return "You can have " + AH_CFG.maxListings + " lots up at once.";
  const fee = ahFee(price);
  if (save.gil < fee) return "The listing fee is " + fee + " crystals.";
  save.gil -= fee;
  removeItem(id, qty);
  const now = Date.now();
  save.market.listings.push({ id, qty, price, t: now, next: now + AH_CFG.checkMs, exp: now + AH_CFG.expireMs });
  log("You put " + (qty > 1 ? qty + " " + ITEMS[id].name + "s" : an(ITEMS[id].name)) + " up for auction at " + price + " crystals (fee " + fee + ").", "sys");
  sfx("coin");
  saveGame();
  return "";
}

function ahCancel(i) {
  const l = save.market.listings[i];
  if (!l) return;
  save.market.listings.splice(i, 1);
  save.market.box.push({ id: l.id, qty: l.qty });
  log("You withdraw your " + ITEMS[l.id].name + ". It's waiting in your delivery box.", "sys");
  saveGame();
}

function ahCollect() {
  const left = [];
  let got = 0;
  for (const b of save.market.box) { if (giveItem(b.id, b.qty, true)) got++; else left.push(b); }
  save.market.box = left;
  if (got) { log("You collect " + got + " lot" + (got > 1 ? "s" : "") + " from your delivery box.", "loot"); sfx("loot"); }
  saveGame();
  return left.length ? "Your bag is full; some items are still in the box." : "";
}

function saleChance(l) {
  const unit = l.price / l.qty, ratio = marketPrice(l.id) * 1.1 / unit;
  return clamp(0.25 * ratio * ratio * ratio, 0.01, 0.85);
}

function tickAuction() {
  const now = Date.now();
  let changed = false;
  for (let i = save.market.listings.length - 1; i >= 0; i--) {
    const l = save.market.listings[i];
    let sold = false, n = 0;
    while (!sold && now >= l.next && l.next < l.exp && n++ < 300) {
      l.next += AH_CFG.checkMs;
      if (Math.random() < saleChance(l)) sold = true;
    }
    if (now >= l.next && !sold) l.next = Math.max(l.next, now - AH_CFG.checkMs);
    if (sold) {
      save.market.listings.splice(i, 1);
      save.gil += l.price;
      save.stats.ahSold = (save.stats.ahSold || 0) + 1;
      addPress(l.id, -0.02 * l.qty);
      log("Auction: your " + (l.qty > 1 ? l.qty + " " + ITEMS[l.id].name + "s" : ITEMS[l.id].name) + " sold for " + l.price + " crystals!", "loot");
      sfx("coin");
      uiEvent("ahsold", { id: l.id, price: l.price });
      changed = true;
    } else if (now >= l.exp) {
      save.market.listings.splice(i, 1);
      save.market.box.push({ id: l.id, qty: l.qty });
      log("Auction: your " + ITEMS[l.id].name + " didn't sell and is back in your delivery box.", "sys");
      changed = true;
    }
  }
  if (changed) { checkAchievements(); saveGame(); }
}

function guildRank(total) {
  const t = total != null ? total : save.guild.total;
  let r = 0;
  for (let i = 0; i < GUILD_RANKS.length; i++) if (t >= GUILD_RANKS[i][1]) r = i;
  return r;
}

function guildDay() {
  const day = boardDay();
  if (save.guild.day !== day) { save.guild.day = day; save.guild.done = []; }
  return day;
}

function guildToday() {
  const day = guildDay(), rank = guildRank();
  const rnd = seeded(hashStr(String(save.created || 1) + ":g" + day + ":" + rank));
  const pool = GUILD_BOUNTIES.filter(b => b.tier <= rank);
  const top = pool.filter(b => b.tier >= rank - 1);
  const out = [];
  if (top.length) out.push(top[Math.floor(rnd() * top.length)]);
  const rest = pool.filter(b => !out.includes(b));
  while (out.length < GUILD_DAILY && rest.length) out.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0]);
  return out;
}

function bountyReward(b) { return { gp: b.gp, gil: b.gp * 8, xp: b.gp * (b.lv + 2) * 2 }; }

function takeBounty(id) {
  const b = guildToday().find(x => x.id === id);
  if (!b) return "That bounty isn't posted today.";
  if (save.guild.active[id] != null) return "You already have that bounty.";
  if (save.guild.done.includes(id)) return "You've already finished that bounty today.";
  if (Object.keys(save.guild.active).length >= GUILD_ACTIVE) return "You can carry " + GUILD_ACTIVE + " bounties at once.";
  save.guild.active[id] = 0;
  log("Bounty accepted: " + bountyName(b) + ".", "npc");
  sfx("notify");
  saveGame();
  return "";
}

function bountyName(b) { const f = FAMILIES[b.fam] || NM_FAMILIES[b.fam]; return (b.nm ? "Hunt " : "Cull " + b.n + " ") + (f ? f.name : b.fam); }

function dropBounty(id) {
  if (save.guild.active[id] == null) return;
  delete save.guild.active[id];
  log("Bounty abandoned.", "sys");
  saveGame();
}

function bountyKill(e) {
  for (const id in save.guild.active) {
    const b = GUILD_BOUNTIES.find(x => x.id === id);
    if (!b || b.fam !== e.famKey) continue;
    const n = save.guild.active[id];
    if (n >= b.n) continue;
    save.guild.active[id] = n + 1;
    log("Bounty: " + bountyName(b) + " " + (n + 1) + "/" + b.n + "." + (n + 1 === b.n ? " Report to Maera." : ""), "npc");
    if (n + 1 === b.n) sfx("notify");
  }
}

function turnInBounty(id) {
  const b = GUILD_BOUNTIES.find(x => x.id === id);
  if (!b || save.guild.active[id] == null) return "You don't have that bounty.";
  if (save.guild.active[id] < b.n) return "That bounty isn't finished yet.";
  delete save.guild.active[id];
  guildDay();
  if (!save.guild.done.includes(id)) save.guild.done.push(id);
  const r = bountyReward(b), before = guildRank();
  save.guild.gp += r.gp; save.guild.total += r.gp;
  save.gil += r.gil;
  save.stats.bounties = (save.stats.bounties || 0) + 1;
  log("Bounty complete: +" + r.gp + " guild points, +" + r.gil + " crystals.", "loot");
  sfx("coin");
  gainXp(r.xp);
  const after = guildRank();
  if (after > before) { log("Guild rank up! You are now " + GUILD_RANKS[after][0] + " rank.", "lvl"); sfx("levelup"); uiEvent("guildrank", { rank: after }); }
  checkAchievements();
  saveGame();
  return "";
}

function guildBuy(id) {
  const e = GUILD_SHOP.find(x => x.id === id);
  if (!e) return "Not for sale.";
  if (guildRank() < e.rank) return "You need " + GUILD_RANKS[e.rank][0] + " rank for that.";
  if (save.guild.gp < e.gp) return "You need " + e.gp + " guild points.";
  const it = ITEMS[id];
  if (it.ex && (invCount(id) || Object.values(save.gear).includes(id))) return "You already own one.";
  if (!giveItem(id, 1)) return "Your bag is full.";
  save.guild.gp -= e.gp;
  sfx("coin");
  saveGame();
  return "";
}

function boardToday() {
  const day = boardDay();
  if (save.board.day !== day) save.board = { day, done: [] };
  const rnd = seeded(hashStr(String(save.created || 1) + ":" + day));
  const pool = TRADE_REQUESTS.slice();
  const out = [];
  while (out.length < TRADE_DAILY && pool.length) out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  return out;
}

function fillTrade(id) {
  const r = boardToday().find(x => x.id === id);
  if (!r) return "That request is gone.";
  if (save.board.done.includes(id)) return "Already filled today.";
  for (const it in r.items) if (invCount(it) < r.items[it]) return "You need " + r.items[it] + " " + ITEMS[it].name + ".";
  for (const it in r.items) removeItem(it, r.items[it]);
  save.board.done.push(id);
  save.stats.trades++;
  save.gil += r.gil;
  log("Trade filled for " + r.who + ": +" + r.gil + " crystals.", "loot");
  sfx("coin");
  gainXp(r.xp);
  saveGame();
  return "";
}

function augmentCost(id, reforge) {
  const lv = Math.max(1, ITEMS[id].lv || 1);
  return { gil: lv * (reforge ? AUGMENT_CFG.reforgeGilPerLv : AUGMENT_CFG.gilPerLv), mats: AUGMENT_CFG.mats };
}

function canAugment(id, reforge) {
  const it = ITEMS[id];
  if (!it || it.kind !== "equip") return "Only equipment can be augmented.";
  if (!hasItem(id)) return "You don't have that.";
  const cur = save.augments[id] || [];
  if (!reforge && cur.length >= AUGMENT_CFG.max) return "That piece can't take more augments. Try reforging.";
  if (reforge && !cur.length) return "Nothing to reforge yet.";
  const c = augmentCost(id, reforge);
  if (save.gil < c.gil) return "You need " + c.gil + " crystals.";
  for (const m in c.mats) if (invCount(m) < c.mats[m]) return "You need " + c.mats[m] + " " + ITEMS[m].name + ".";
  return "";
}

function rollAugment(taken) {
  const opts = AUGMENT_STATS.filter(a => !taken.includes(a[0]));
  const [k, lo, hi] = pick(opts);
  return [k, lo + Math.floor(Math.random() * (hi - lo + 1))];
}

function augmentItem(id, reforge) {
  const why = canAugment(id, reforge);
  if (why) { sfx("error"); return why; }
  const c = augmentCost(id, reforge);
  save.gil -= c.gil;
  for (const m in c.mats) removeItem(m, c.mats[m]);
  let cur = reforge ? [] : (save.augments[id] || []).slice();
  const n = reforge ? (save.augments[id] || []).length : 1;
  for (let i = 0; i < n; i++) cur.push(rollAugment(cur.map(a => a[0])));
  save.augments[id] = cur;
  log("Garrick " + (reforge ? "reforges" : "augments") + " your " + ITEMS[id].name + ": " + cur.map(([k, v]) => STAT_LABELS[k] + " +" + v).join(", ") + ".", "loot");
  sfx("unlock");
  refreshPlayer(false);
  saveGame();
  return "";
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
    if (dist(a, t) > reach(a)) return "Target is out of range.";
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
  a.lastWSId = id;
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
  if (isParty(a)) save.stats.sc++;
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
  if (id === "shadowbind") {
    t.buffs.bind = { until: S.time + 12 };
    log(subj(a) + " " + vb(a, "use") + " Shadowbind. The " + t.name + " is pinned in place!", cls(a));
    popText(t, "Bound", "#b39ddb", 13, 1);
    ring(t, "#7e57c2", 30, 0.8);
    sfx("buff", a);
    addEnmity(t, a, ab.enmity);
    aggro(t, a);
    return;
  }
  if (id === "release") {
    if (!S.pet) { log("You have no sprite out.", "sys"); return; }
    releasePet("You release your " + S.pet.name + ".");
    return;
  }
  if (id === "blood_pact") {
    const pet = S.pet;
    if (!pet || !pet.alive) { log("You need a sprite out for a Blood Pact.", "sys"); a.recasts["ja:" + id] = 0; sfx("error"); return; }
    const P = PETS[pet.petKey];
    let dmg = Math.round((24 + a.lv * 7 + a.stats.int * 1.2 + skillOf(a, "summoning") * 0.8) * rand(0.9, 1.1));
    if (t.fam.weak && t.fam.weak[P.el]) dmg = Math.round(dmg * t.fam.weak[P.el]);
    pet.face = Math.atan2(t.y - pet.y, t.x - pet.x);
    log(pet.name + " uses " + P.pact + "! The " + t.name + " takes " + dmg + " damage.", cls(a));
    popText(pet, P.pact, "#4dd0e1", 13, 1.2, 14);
    vfx("nuke", { src: pet, tgt: t, el: P.el });
    sfx(P.el, t);
    if (a === player) trySkillUp("summoning", t.lv);
    applyDamage(pet, t, dmg, { color: ELEMENT_COLORS[P.el], size: 22, enmity: ab.enmity + dmg });
    return;
  }
  if (id === "siphon") {
    if (!S.pet || !S.pet.alive) { log("You need a sprite out to siphon from.", "sys"); a.recasts["ja:" + id] = 0; sfx("error"); return; }
    const gain = Math.min(a.maxMp - a.mp, 20 + a.lv * 3);
    a.mp += gain;
    log(subj(a) + " " + vb(a, "draw") + " " + gain + " MP from the " + S.pet.name + ".", cls(a));
    popText(a, "+" + gain + " MP", "#64b5f6", 14, 1);
    sfx("buff", a);
    return;
  }
  if (id === "steal") {
    a.face = Math.atan2(t.y - a.y, t.x - a.x);
    const pool = (t.fam.loot || []).filter(([it]) => ITEMS[it] && ITEMS[it].kind !== "equip" && ITEMS[it].kind !== "key");
    const chance = clamp(45 + (a.stats.dex - t.stats.agi) * 2 + (a.lv - t.lv) * 3, 10, 85);
    aggro(t, a);
    addEnmity(t, a, ab.enmity);
    if (t.stolen || !pool.length || Math.random() * 100 >= chance) { log(subj(a) + " " + vb(a, "fail") + " to steal anything from the " + t.name + ".", cls(a)); popText(t, "Steal failed", "#bbbbbb", 12, 0.9); sfx("miss", a); t.stolen = true; return; }
    t.stolen = true;
    const it = pick(pool)[0];
    log(subj(a) + " " + vb(a, "steal") + " " + an(ITEMS[it].name) + " from the " + t.name + "!", cls(a));
    popText(t, "Stolen!", "#a1887f", 14, 1);
    sfx("coin", a);
    if (a === player) giveItem(it, 1);
    return;
  }
  if (id === "warcry") {
    for (const p of S.party) if (p.alive && dist(p, a) < 300) { p.buffs.warcry = { until: S.time + ab.dur }; ring(p, "#ff8a65", 24, 0.5); }
    log(subj(a) + " " + vb(a, "let") + " out a Warcry! The party's attack rises.", cls(a));
    popText(a, "Warcry!", "#ff8a65", 15, 1.2, 14);
    sfx("provoke", a);
    return;
  }
  if (id === "chakra") {
    const heal = Math.min(a.maxHp - a.hp, Math.round(a.stats.vit * 3 + a.lv * 8));
    a.hp += heal;
    log(subj(a) + " " + vb(a, "use") + " Chakra and " + vb(a, "recover", "recovers") + " " + heal + " HP.", cls(a));
    popText(a, heal > 0 ? "+" + heal : "No effect", heal > 0 ? "#9ad06b" : "#bbbbbb", 16, 1.2, 14);
    if (heal > 0) { ring(a, "#ffb74d", 30, 0.6); sfx("cure", a); vfx("cure", { tgt: a }); }
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
  a.casting = { id, sp, t, start: S.time, end: S.time + sp.cast * (sp.kind === "song" && a.buffs.encore ? 0.34 : 1) };
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
  else if (sp.kind === "summon") summonPet(a, sp);
  else if (sp.kind === "song") castSong(a, sp);
  else if (sp.kind === "drain" || sp.kind === "aspir") castDrain(a, t, sp);
  if (a !== player && a.mp < a.maxMp * 0.15) partySay(a, "lowmp");
}

function castHeal(a, t, sp) {
  let amt = (sp.power + a.stats.mnd * sp.mnd + skillOf(a, "healing") * 0.3) * (1 + 0.06 * (a.lv - 1));
  if (a.buffs.divine_seal) { amt *= 2; delete a.buffs.divine_seal; }
  amt = Math.round(amt * rand(0.95, 1.05));
  const real = Math.max(0, Math.min(amt, t.maxHp - t.hp));
  t.hp += real;
  if (real > 0) {
    popText(t, "+" + real, "#9ad06b", 18);
    ring(t, "#9ad06b", 30, 0.6, "sparkle");
    sfx("cure", t);
    vfx("cure", { src: a, tgt: t, big: sp.power > 40 });
  } else popText(t, "No effect", "#bbbbbb", 13, 0.9);
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
  if (sp.element && sp.element === weatherElement()) dmg *= 1.1;
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
    if (isParty(a)) save.stats.mb++;
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

const SONG_KEYS = ["minuet", "paeon", "ballad", "madrigal", "march"];

function applySong(p, a, sp) {
  const have = SONG_KEYS.filter(k => p.buffs[k] && k !== sp.song).sort((x, y) => p.buffs[x].until - p.buffs[y].until);
  while (have.length >= 2) delete p.buffs[have.shift()];
  const sk = 1 + skillOf(a, "singing") / 400;
  p.buffs[sp.song] = { until: S.time + sp.dur, pow: sp.song === "madrigal" ? Math.round(sp.pow * sk) : sp.pow * sk, src: a, next: S.time + 3, id: sp.name };
}

function castSong(a, sp) {
  const hit = S.party.filter(p => p.alive && dist(p, a) <= 300);
  for (const p of hit) { applySong(p, a, sp); ring(p, "#ffd54f", 24, 0.5, "sparkle"); }
  log(subj(a) + " " + vb(a, "sing") + " " + sp.name + ". " + hit.length + (hit.length === 1 ? " ally is" : " allies are") + " inspired.", cls(a));
  popText(a, "♪ " + sp.name, "#ffd54f", 13, 1.2, 14);
  sfx("buff", a);
  vfx("buff", { tgt: a, id: "song" });
  for (const m of S.mobs) if (m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty)) addEnmity(m, a, 20 + hit.length * 8);
}

function castDrain(a, t, sp) {
  const mp = sp.kind === "aspir";
  let amt = (sp.power + skillOf(a, "dark") * 0.25 + Math.max(0, a.stats.int - t.stats.int)) * (1 + 0.07 * (a.lv - 1));
  let resist = 1;
  if (Math.random() * 100 >= magicHit(a, t, sp)) resist = 0.5;
  amt = Math.max(1, Math.round(amt * resist * rand(0.9, 1.1) * (mp ? 0.6 : 1)));
  ring(t, ELEMENT_COLORS.dark, 30, 0.5, "element");
  sfx("cast", t);
  vfx("nuke", { src: t, tgt: a, el: "dark", dia: true });
  if (mp) {
    const real = Math.min(amt, a.maxMp - a.mp);
    a.mp += real;
    log(subj(a) + " " + vb(a, "cast") + " " + sp.name + " and " + vb(a, "draw") + " " + real + " MP from the " + t.name + ".", cls(a));
    popText(a, "+" + real + " MP", "#64b5f6", 14, 1);
    addEnmity(t, a, 60);
    aggro(t, a);
    return;
  }
  const dealt = Math.min(amt, t.hp);
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " loses " + dealt + " HP" + (resist < 1 ? " (resisted)" : "") + ".", cls(a));
  applyDamage(a, t, amt, { color: ELEMENT_COLORS.dark, size: 18, enmity: 80 + amt });
  const heal = Math.min(dealt, a.maxHp - a.hp);
  if (heal > 0) { a.hp += heal; popText(a, "+" + heal, "#9ad06b", 16); }
}

function castDebuff(a, t, sp) {
  const col = ELEMENT_COLORS[sp.element] || "#ddd";
  const immune = sp.buff === "sleep" && t.fam.boss;
  const landed = !immune && (sp.buff === "flash" || Math.random() * 100 < magicHit(a, t, sp) + 10);
  ring(t, col, 30, 0.5, "element");
  sfx(sp.element === "light" ? "light" : "cast", t);
  vfx("nuke", { src: a, tgt: t, el: sp.element, dia: true });
  if (!landed) { log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ", but the " + t.name + " resists.", cls(a)); popText(t, "Resist", "#bbbbbb", 13, 0.9); addEnmity(t, a, 20); aggro(t, a); return; }
  t.buffs[sp.buff] = { until: S.time + sp.dur, src: a };
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " is " + { flash: "blinded", slow: "slowed", paralyze: "paralyzed", sleep: "lulled to sleep", stun: "stunned" }[sp.buff] + ".", cls(a));
  popText(t, sp.name, col, 14, 1.1);
  if (sp.buff === "stun" && t.readying) { t.readying = null; t.tp = Math.floor(t.tp / 2); log("The " + t.name + "'s " + t.fam.tpMove.name + " is cut short!", cls(a)); }
  if (sp.buff === "sleep") { t.swingTimer = Math.max(t.swingTimer, 1); t.readying = null; }
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
  const el = sp.element || "light", key = sp.buff || "dia";
  const dmg = Math.round(sp.power * (1 + 0.08 * (a.lv - 1)));
  ring(t, ELEMENT_COLORS[el], 30, 0.5, "element");
  sfx(el === "light" ? "light" : "cast", t);
  vfx("nuke", { src: a, tgt: t, el, dia: true });
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " takes " + dmg + " damage and is afflicted with " + sp.name + ".", cls(a));
  applyDamage(a, t, dmg, { color: ELEMENT_COLORS[el], size: 16, enmity: 120 });
  if (t.alive) t.buffs[key] = { until: S.time + 30, next: S.time + 3, tick: Math.max(1, Math.round(1 + a.lv * 0.4)), src: a, el };
}

function useItem(id) {
  const it = ITEMS[id];
  if (!player.alive || !it) return;
  if (player.casting) { log("You cannot use items while casting.", "sys"); return; }
  if (S.time < S.itemReadyAt) { log("You must wait " + fmt(S.itemReadyAt - S.time) + "s to use another item.", "sys"); return; }
  if (invCount(id) < 1) return;
  if (it.kind === "food") { eatFood(id); return; }
  if (it.kind === "pet") { if (learnBuddy(it.pet)) removeItem(id, 1); return; }
  if (it.fishing) { const why = startFishing(); if (why) { log(why, "sys"); sfx("error"); } return; }
  if (it.heal && player.hp >= player.maxHp) { log("Your HP is already full.", "sys"); sfx("error"); return; }
  if (it.mpRestore && player.mp >= player.maxMp) { log("Your MP is already full.", "sys"); sfx("error"); return; }
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
    if ((id === "dia" || id === "blight") && S.time >= b.next && e.alive) {
      b.next += 3;
      applyDamage(b.src, e, b.tick, { color: ELEMENT_COLORS[b.el || "light"], size: 13, enmity: b.tick });
    }
    if ((id === "paeon" || id === "ballad") && S.time >= b.next && e.alive) {
      b.next += 3;
      const amt = Math.round(b.pow * (1 + e.lv / 5));
      if (id === "paeon") { const r = Math.min(amt, e.maxHp - e.hp); e.hp += r; }
      else { const r = Math.min(Math.ceil(amt / 2), e.maxMp - e.mp); e.mp += r; }
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
  if (d <= stop + 0.05) return true;
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

function barrierOpen(b) {
  if (b.solved === "braziers") return !!save.crypt.solved;
  if (b.key) return save.keyItems.includes(b.key);
  return false;
}
function closedBarrierRects(z) {
  return (z.barriers || []).filter(b => !barrierOpen(b)).map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, barrier: b }));
}

function keepOutOfColliders(e) {
  const cs = S.zone.colliders;
  if (!cs || !cs.length) return;
  const er = e.radius * 0.55;
  for (const c of cs) {
    const m = c.r + er, dx = e.x - c.x, dy = e.y - c.y;
    if (dx > m || dx < -m || dy > m || dy < -m) continue;
    const d = Math.hypot(dx, dy);
    if (d >= m) continue;
    if (d < 0.001) { e.x = c.x + m; continue; }
    e.x = c.x + dx / d * m; e.y = c.y + dy / d * m;
  }
}

function keepOutOfRects(e) {
  keepOutOfColliders(e);
  const rects = zoneRects(S.zone).concat(closedBarrierRects(S.zone), S.zoneId === "residence" ? furnitureRects() : []);
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
    if (dist(a, t) <= reach(a)) { a.face = Math.atan2(t.y - a.y, t.x - a.x); swing(a, t); a.swingTimer = swingDelay(a); }
    else a.swingTimer = 0;
  }
}

function detects(m, p) {
  if (p.mounted) return false;
  const a = m.aggro;
  if (!a) return false;
  const d = dist(m, p);
  if (a.sight && d <= a.sight) {
    if (d <= 60) return true;
    const diff = Math.abs(normAng(Math.atan2(p.y - m.y, p.x - m.x) - m.face));
    if (diff <= Math.PI * 0.45) return true;
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
    if (Math.hypot(nx - m.home.x, ny - m.home.y) < (S.zone.theme === "field" ? 150 : 90)) { m.x = nx; m.y = ny; }
    for (const p of S.party) if (p.alive && detects(m, p)) { aggro(m, p); break; }
    return;
  }
  if (m.state === "combat") {
    for (const [e, v] of m.enmity) m.enmity.set(e, Math.max(1, v * (1 - 0.04 * dt)));
    const t = topEnmity(m);
    if (!t || (!S.zone.battlefield && Math.hypot(m.x - m.home.x, m.y - m.home.y) > CONFIG.leash)) {
      if (t) log("The " + m.name + " loses interest.", "sys");
      m.state = "return";
      m.enmity.clear();
      m.readying = null;
      m.target = null;
      return;
    }
    m.target = t;
    if (m.buffs.sleep || m.buffs.stun) { m.readying = null; return; }
    bossPhases(m, t);
    if (m.readying) {
      m.readying.t -= dt;
      if (m.readying.t <= 0) execTpMove(m);
      return;
    }
    if (!m.buffs.bind) moveToward(m, t.x, t.y, dt, mobReach(m) - 8);
    m.face = Math.atan2(t.y - m.y, t.x - m.x);
    m.swingTimer -= dt;
    if (m.swingTimer <= 0) {
      if (dist(m, t) <= mobReach(m)) {
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
    if (m.fam.boss && m.phase) bossReset(m);
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

function spawnExtra(famKey, lv, x, y) {
  const m = buildMob(famKey, lv, x, y, null);
  S.mobs.push(m);
  return m;
}

function bossPhases(m, t) {
  const f = m.fam;
  if (!f.boss) return;
  m.phase = m.phase || 0;
  const frac = m.hp / m.maxHp;
  if (f.phases && m.phase < f.phases.length && frac <= f.phases[m.phase]) {
    m.phase++;
    log("The " + m.name + " " + (f.addsText || "calls for his Royal Guards!"), "foe");
    popText(m, "Rise!", "#ffd54f", 18, 1.4, 30);
    ring(m, "#ffd54f", 70, 0.9, "burst");
    sfx("tpready", m);
    vfx("levelup", { tgt: m });
    for (const sgn of [-1, 1]) {
      const g = spawnExtra(f.adds || "royal_guard", Math.max(1, m.lv - 2), m.x + sgn * 60, m.y + 40);
      g.summonedBy = m;
      aggro(g, t);
      addEnmity(g, t, 50);
    }
    S.shake = Math.max(S.shake, 0.3);
  }
  if (f.pulse && frac <= f.pulse.at && S.time >= (m.nextPulse || 0)) {
    if (!m.nextPulse) { m.nextPulse = S.time + 4; log("The water around the " + m.name + " begins to churn...", "foe"); }
    else {
      m.nextPulse = S.time + f.pulse.every;
      log("The " + m.name + " unleashes " + f.pulse.name + "!", "foe");
      popText(m, f.pulse.name, "#4fc3f7", 18, 1.4, 30);
      ring(m, "#4fc3f7", f.pulse.r * 0.6, 1.0, "burst");
      S.shake = Math.max(S.shake, 0.35);
      sfx(f.pulse.el, m);
      for (const p of S.party) if (p.alive && dist(p, m) <= f.pulse.r) { vfx("nuke", { src: m, tgt: p, el: f.pulse.el }); applyDamage(m, p, Math.round(f.pulse.dmg * m.lv * rand(0.9, 1.1)), { color: "#4fc3f7", size: 18 }); }
    }
  }
  if (f.enrage && !m.enraged && frac <= f.enrage) {
    m.enraged = true;
    m.stats.att = Math.round(m.stats.att * 1.5);
    m.delay = m.fam.delay * 0.7;
    m.auraOverride = "#ff5252";
    log("The " + m.name + " is enraged!", "foe");
    popText(m, "Enraged!", "#ff5252", 20, 1.6, 30);
    ring(m, "#ff5252", 60, 0.8, "burst");
    sfx("aggro", m);
  }
}

function bossReset(m) {
  m.phase = 0;
  if (m.enraged) { m.enraged = false; m.auraOverride = null; m.delay = m.fam.delay; m.stats.att = Math.round((16 + 5.5 * m.lv) * m.fam.attMul); }
  for (const g of S.mobs) if (g.summonedBy === m && g.alive) { g.alive = false; g.deadAt = S.time - 2; g.despawned = true; }
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
    if (mv.explode && m.alive) { m.hp = 0; onKO(m, m); }
    if (mv.slow && tg.alive) { tg.buffs.slow = { until: S.time + 20, src: m }; popText(tg, "Slowed", "#d7b46a", 12, 0.9, 12); }
    if (mv.sleepy && tg.alive && !tg.buffs.sleep && Math.random() < 0.5 && tg !== player) { tg.buffs.sleep = { until: S.time + 6, src: m }; popText(tg, "Asleep", "#b39ddb", 12, 0.9, 12); }
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
  if (Math.hypot(tx - a.x, ty - a.y) > 12) moveToward(a, tx, ty, dt, 4, (a.mounted ? mountMul() : 1) * (Math.hypot(tx - a.x, ty - a.y) > 160 ? 1.4 : 1));
}

function allyTry(a, act, t) {
  if (!act || checkAction(a, act, t)) return false;
  perform(a, act, t);
  return true;
}

function updateAlly(a, dt) {
  if (!a.alive || a.casting) return;
  if (a.mounted) { a.engaged = false; a.attackTarget = null; follow(a, dt); return; }
  const stance = save.stance || "assist";
  const tgt = stance === "follow" ? null : partyBattleTarget();
  const role = a.role;
  const hx = a.x, hy = a.y;
  if (stance === "hold" && !a.holdAt) a.holdAt = { x: a.x, y: a.y };
  if (stance !== "hold") a.holdAt = null;
  if (role === "healer" || role === "support") healerAI(a, tgt, dt);
  else if (role === "nuker" || role === "burster") nukerAI(a, tgt, dt);
  else if (role === "bard") { if (!bardAI(a, tgt, dt)) meleeAI(a, tgt, dt); }
  else meleeAI(a, tgt, dt);
  if (stance === "hold") { a.x = hx; a.y = hy; }
}

function setStance(st) {
  if (!["assist", "follow", "hold"].includes(st)) { log("Stances: assist, follow, hold.", "sys"); return; }
  save.stance = st;
  for (const a of S.party) if (a !== player) { a.holdAt = null; if (st === "follow") { a.engaged = false; a.attackTarget = null; } }
  log({ assist: "Your companions will fight your target.", follow: "Your companions will stay at your side and won't attack. Healers still heal.", hold: "Your companions will hold their ground. They fight only what comes to them." }[st], "party");
  sfx("select");
  saveGame();
}

function meleeAI(a, tgt, dt) {
  if (!tgt) { a.engaged = false; a.attackTarget = null; a.target = null; follow(a, dt); return; }
  if (a.attackTarget !== tgt) a.swingTimer = Math.min(a.swingTimer, 1.2);
  a.attackTarget = tgt;
  a.target = tgt;
  a.engaged = true;
  moveToward(a, tgt.x, tgt.y, dt, reach(a) - 8);
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
  const chak = acts.find(x => x.id === "chakra");
  if (chak && a.hp < a.maxHp * 0.5 && allyTry(a, chak, a)) return;
  const stl = acts.find(x => x.id === "steal");
  if (stl && !tgt.stolen && tgt.state === "combat" && allyTry(a, stl, tgt)) return;
  const drn = acts.find(x => x.id === "drain");
  if (drn && a.hp < a.maxHp * 0.6 && tgt.state === "combat" && allyTry(a, drn, tgt)) return;
  const stn = acts.find(x => x.id === "stun");
  if (stn && tgt.readying && allyTry(a, stn, tgt)) return;
  const blt = acts.find(x => x.id === "blight");
  if (blt && !tgt.buffs.blight && tgt.state === "combat" && a.mp > a.maxMp * 0.4 && allyTry(a, blt, tgt)) return;
  for (const id of ["focus", "boost", "sneak_attack", "sharpshot", "barrage", "last_resort", "soulfire", "blood_blade"]) {
    const x = acts.find(q => q.id === id);
    if (x && !a.buffs[id] && dist(a, tgt) <= reach(a) && allyTry(a, x, a)) return;
  }
  allyWeaponSkill(a, tgt, acts);
}

function bardAI(a, tgt, dt) {
  const acts = actionList(a);
  const songs = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "song");
  const best = {};
  for (const x of songs) { const sp = SPELLS[x.id]; if (!best[sp.song] || SPELLS[best[sp.song].id].pow < sp.pow) best[sp.song] = x; }
  const fighting = !!tgt && tgt.state === "combat";
  const casterHeavy = S.party.filter(p => p.alive && p.maxMp > 0 && p.role !== "dd" && p.role !== "tank").length >= 2;
  const order = fighting ? ["minuet", "march", "madrigal", casterHeavy ? "ballad" : "paeon", "paeon", "ballad"] : ["paeon", "ballad"];
  const want = [];
  for (const k of order) if (best[k] && !want.includes(k) && want.length < 2) want.push(k);
  const near = S.party.filter(p => p.alive && dist(p, a) <= 260);
  if (!fighting && !near.some(p => p.hp < p.maxHp * 0.9 || (p.maxMp && p.mp < p.maxMp * 0.8))) return false;
  for (const k of want) {
    if (near.some(p => !p.buffs[k] || p.buffs[k].until - S.time < 12)) {
      if (dist(a, player) > 220) return false;
      if (allyTry(a, best[k], a)) return true;
    }
  }
  if (fighting) {
    const lull = acts.find(x => x.id === "drowsy_lullaby");
    const extra = S.mobs.find(m => m.alive && m !== tgt && m.state === "combat" && !m.buffs.sleep && !m.fam.boss && [...m.enmity.keys()].some(isParty) && dist(a, m) <= CONFIG.castRange);
    if (lull && extra && allyTry(a, lull, extra)) return true;
  }
  return false;
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
  if (a.tp < 1000 || dist(a, tgt) > reach(a)) return;
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
    const sp = player.speed * Math.min(1, len) * (player.mounted ? mountMul() : 1) * (player.buffs && player.buffs.flee ? 1.8 : 1);
    player.x += (mv.x / len) * sp * dt;
    player.y += (mv.y / len) * sp * dt;
    player.face = Math.atan2(mv.y, mv.x);
    moved = true;
  } else if (S.moveTarget) {
    moved = true;
    if (moveToward(player, S.moveTarget.x, S.moveTarget.y, dt, 3, player.mounted ? mountMul() : 1)) S.moveTarget = null;
  } else if (S.chase && player.attackTarget && player.attackTarget.alive) {
    if (dist(player, player.attackTarget) > reach(player) - 4) { moveToward(player, player.attackTarget.x, player.attackTarget.y, dt, reach(player) - 10); moved = true; }
  }
  if (moved) {
    touch(player);
    if (player.casting) { log("You move and interrupt your casting.", "you"); player.casting = null; sfx("interrupt", player); }
  }
  keepInZone(player);
  if (moved && S.time - (S.barrierMsgAt || -9) > 6) for (const r of closedBarrierRects(S.zone)) {
    if (player.x > r.x - 30 && player.x < r.x + r.w + 30 && player.y > r.y - 30 && player.y < r.y + r.h + 30) { S.barrierMsgAt = S.time; log(r.barrier.closedMsg, "sys"); sfx("error"); break; }
  }
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
  const rb = rest && p === player ? 1 + buddyPerk("rest") : 1;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * (rest ? CONFIG.restHp : CONFIG.regenHp) * dt * rb);
  p.mp = Math.min(p.maxMp, p.mp + p.maxMp * (rest ? CONFIG.restMp : CONFIG.regenMp) * dt * rb);
}

function tickCasting(e) {
  if (e.casting && S.time >= e.casting.end) finishCast(e);
}

function partyInCombat() {
  return S.mobs.some(m => m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty));
}

function enterZone(id, x, y) {
  const prev = S.zoneId;
  S.fish = null;
  if (S.race && id !== RACE.zone) S.race = null;
  if (S.bf && id !== BATTLEFIELD.zone) { if (!S.bf.won) log("You leave the Chapel Depths. The battle is lost.", "sys"); S.bf = null; }
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
  S.npcs = S.zone.npcs.map(n => Object.assign({ id: n.id, x: n.x, y: n.y, radius: 14, kind: "npc", face: Math.PI / 2, post: { x: n.x, y: n.y }, home: n.home, sleep: n.sleep, away: false, speed: 60 }, NPCS[n.id]));
  S.gatherAt = [];
  if (FEATURES.gathering && S.zone.gather) for (const type in S.zone.gather) {
    const g = S.zone.gather[type];
    const picks = g.at.slice().sort(() => Math.random() - 0.5).slice(0, g.n);
    for (const [gx, gy] of picks) spawnGather(type, gx, gy);
  }
  for (const n of S.npcs) if (n.sleep && npcAsleep(n)) { n.away = true; const d = npcDoor(n); if (d) { n.x = d.x; n.y = d.y; } }
  const rnd = seeded(hashStr(id));
  S.decor = [];
  const nRocks = S.zone.theme === "town" ? 6 : S.zone.theme === "cave" ? 26 : S.zone.theme === "crypt" ? 0 : 30;
  for (let i = 0; i < nRocks; i++) S.decor.push({ x: 40 + rnd() * (S.zone.w - 80), y: 40 + rnd() * (S.zone.h - 80), r: 6 + rnd() * 16, a: rnd() * Math.PI });
  S.zoneCooldown = 1;
  S.lastPeriod = period();
  log("Entering " + S.zone.name + ".", "sys");
  if (prev !== id) sfx("zone");
  onZoneEntered();
  saveGame();
}

function npcDoor(n) {
  const hs = (S.zone.houses || [])[n.home];
  if (!hs) return null;
  return hs.rot ? { x: hs.x + hs.w / 2 + 22, y: hs.y } : { x: hs.x, y: hs.y + hs.h / 2 + 22 };
}
function npcAsleep(n) {
  if (!n.sleep) return false;
  const v = vana();
  const h = v.hour + v.minute / 60;
  const [bed, wake] = n.sleep;
  return bed > wake ? (h >= bed || h < wake) : (h >= bed && h < wake);
}
function updateNpcs(dt) {
  for (const n of S.npcs) {
    if (!n.sleep) continue;
    const door = npcDoor(n);
    if (!door) continue;
    const asleep = npcAsleep(n);
    if (asleep) {
      if (n.away) continue;
      if (!n.heading) { n.heading = true; if (dist(n, player) < 700) log(n.name.split(",")[0] + " heads home for the night.", "sys"); }
      n.moving = true;
      if (moveToward(n, door.x, door.y, dt, 6, 1)) { n.away = true; n.heading = false; n.moving = false; if (player.target === n) player.target = null; if (S.pendingTalk === n) S.pendingTalk = null; }
    } else {
      if (n.away) { n.away = false; n.x = door.x; n.y = door.y; if (dist(n, player) < 700) log(n.name.split(",")[0] + " steps out for the day.", "sys"); }
      n.heading = false;
      if (dist(n, n.post) > 6) { n.moving = true; moveToward(n, n.post.x, n.post.y, dt, 4, 1); }
      else { n.moving = false; if (Math.abs(normAng(n.face - Math.PI / 2)) > 0.05 && !(player.target === n && dist(n, player) < CONFIG.talkRange)) n.face += normAng(Math.PI / 2 - n.face) * Math.min(1, dt * 4); }
    }
  }
}

function spawnGather(type, gx, gy) {
  const g = S.zone.gather[type];
  const n = { id: "gather_" + type + "_" + (++S.mobSeq), x: gx, y: gy, radius: 12, kind: "npc", face: 0, prop: "gather", gtype: type, name: GATHER[type].name + " Point", talk: "talkGather", uses: randInt(1, 3), loot: g.loot, away: false };
  S.npcs.push(n);
  return n;
}
function retireGather(n) {
  n.away = true;
  n.gone = true;
  if (player.target === n) player.target = null;
  const type = n.gtype, g = S.zone.gather[type];
  const taken = S.npcs.filter(x => x.prop === "gather" && x.gtype === type && !x.gone).map(x => x.x + "," + x.y);
  const free = g.at.filter(([x, y]) => !taken.includes(x + "," + y) && !(x === n.x && y === n.y));
  const next = free.length ? pick(free) : [n.x, n.y];
  S.gatherAt.push({ type, at: Date.now() + GATHER_RESPAWN_MS, x: next[0], y: next[1] });
}
function tickGather() {
  if (!S.gatherAt || !S.gatherAt.length) return;
  const now = Date.now();
  for (let i = S.gatherAt.length - 1; i >= 0; i--) {
    const r = S.gatherAt[i];
    if (now < r.at) continue;
    S.gatherAt.splice(i, 1);
    spawnGather(r.type, r.x, r.y);
  }
  S.npcs = S.npcs.filter(n => !n.gone);
}
function gatherTool(type) { return GATHER[type].tool; }
function doGather(n) {
  if (n.gone || n.uses <= 0) return;
  const type = n.gtype, tool = gatherTool(type), G = GATHER[type];
  if (invCount(tool) < 1) { log("You need " + an(ITEMS[tool].name) + " to " + G.verb + " here. Pell sells them.", "sys"); sfx("error"); return; }
  if (player.engaged || inCombatWith(player)) { log("You can't " + G.verb + " while fighting.", "sys"); sfx("error"); return; }
  if (player.resting) standUp(player, true);
  const skill = save.gatherSkill[type] || 0;
  player.face = Math.atan2(n.y - player.y, n.x - player.x);
  sfx(type === "mining" ? "blunt" : type === "logging" ? "slash" : "miss", player);
  vfx("hit", { src: player, tgt: n, crit: false, slash: type === "logging" });
  let got = null;
  for (const [id, chance] of n.loot) if (Math.random() < chance * (1 + skill * 0.01 + buddyPerk("gather"))) { got = id; break; }
  save.stats.gathers++;
  if (got) { giveItem(got, 1); log("You " + G.verb + " up " + an(ITEMS[got].name) + ".", "loot"); }
  else { log("You " + G.verb + " but find nothing worth keeping.", "sys"); }
  if (skill < 20 && Math.random() < 0.45) { save.gatherSkill[type] = Math.round((skill + (Math.random() < 0.3 ? 0.3 : 0.1)) * 10) / 10; log(G.name + " skill rises to " + save.gatherSkill[type].toFixed(1) + ".", "sys"); }
  const breakPct = Math.max(5, 25 - skill);
  if (Math.random() * 100 < breakPct) { removeItem(tool, 1); log("Your " + ITEMS[tool].name + " breaks!", "foe"); sfx("interrupt", player); }
  n.uses--;
  if (n.uses <= 0) { log("The " + n.name.toLowerCase() + " is exhausted.", "sys"); retireGather(n); }
  saveGame();
}

function craftSkill(c) { return save.crafts[c] || 0; }
function recipeMatsOk(r) { return Object.keys(r.mats).every(id => invCount(id) >= r.mats[id]) && invCount(CRAFTS[r.craft].crystal) >= 1; }
function synthChance(r) { return clamp(65 + 7 * (craftSkill(r.craft) - r.lv) + buddyPerk("craft") * 100, 5, 95); }
function synthHqChance(r) { return r.hq ? clamp(5 * (craftSkill(r.craft) - r.lv), 0, 50) : 0; }
function canSynth(r) {
  if (!FEATURES.crafting) return "Crafting isn't available yet.";
  if (!player.alive) return "You are KO'd.";
  if (player.engaged || inCombatWith(player) || partyInCombat()) return "You can't synthesize during a fight.";
  if (player.casting) return "You are casting.";
  if (player.synth) return "You're already synthesizing.";
  if (player.mounted) return "Dismount first.";
  if (invCount(CRAFTS[r.craft].crystal) < 1) return "You need " + an(ITEMS[CRAFTS[r.craft].crystal].name) + ".";
  if (!recipeMatsOk(r)) return "You're missing ingredients.";
  return "";
}
function startSynth(id) {
  const r = RECIPES.find(x => x.id === id);
  if (!r) return "Unknown recipe.";
  const why = canSynth(r);
  if (why) { log(why, "sys"); sfx("error"); return why; }
  if (player.resting) standUp(player, true);
  player.synth = { r, start: S.time, end: S.time + CONFIG.synthTime };
  S.moveTarget = null; S.chase = false;
  log("You begin synthesizing " + ITEMS[r.out].name + " with " + an(ITEMS[CRAFTS[r.craft].crystal].name) + ".", "you");
  sfx("cast", player);
  vfx("cast", { src: player, sp: { kind: "nuke", element: ITEMS[CRAFTS[r.craft].crystal].element } });
  return "";
}
function cancelSynth(msg) {
  if (!player.synth) return;
  player.synth = null;
  log(msg || "Your synthesis is interrupted.", "sys");
  sfx("interrupt", player);
}
function finishSynth() {
  const r = player.synth.r;
  player.synth = null;
  const crystal = CRAFTS[r.craft].crystal;
  removeItem(crystal, 1);
  const skill = craftSkill(r.craft);
  const roll = Math.random() * 100;
  const el = ITEMS[crystal].element;
  if (roll < synthChance(r)) {
    const hq = r.hq && Math.random() * 100 < synthHqChance(r);
    for (const id in r.mats) removeItem(id, r.mats[id]);
    const out = hq ? r.hq : r.out;
    giveItem(out, r.qty || 1);
    save.stats.crafts++; if (hq) save.stats.hq++;
    log("Synthesis complete: " + (r.qty > 1 ? r.qty + " × " : "") + ITEMS[out].name + (hq ? " (high quality!)" : "") + ".", "loot");
    sfx(hq ? "levelup" : "unlock", player);
    vfx("burst", { tgt: player, el });
  } else {
    for (const id in r.mats) if (Math.random() < 0.5) removeItem(id, Math.max(1, Math.floor(r.mats[id] / 2)));
    log("The synthesis fails. The essence fades and some ingredients are lost.", "foe");
    sfx("interrupt", player);
    vfx("interrupt", { tgt: player });
  }
  if (skill < CONFIG.craftCap && r.lv >= skill - 2) {
    const gain = r.lv >= skill ? (Math.random() < 0.5 ? 0.3 : 0.5) : 0.1;
    if (Math.random() < 0.7) { save.crafts[r.craft] = Math.min(CONFIG.craftCap, Math.round((skill + gain) * 10) / 10); log(CRAFTS[r.craft].name + " skill rises to " + save.crafts[r.craft].toFixed(1) + ".", "sys"); }
  }
  saveGame();
}
function tickSynth(dt) {
  if (!player.synth) return;
  if (player.engaged || inCombatWith(player) || !player.alive) { cancelSynth(); return; }
  if (S.time >= player.synth.end) finishSynth();
}

function gardenOf(i) { return save.gardens[i] || null; }
function gardenStage(g) {
  if (!g) return 0;
  return g.stage;
}
function gardenReady(g) { return g && g.stage >= 3; }
function gardenNeedsWater(g) { return g && g.stage < 3 && !g.watered; }
function gardenTick() {
  const now = Date.now();
  for (const k in save.gardens) {
    const g = save.gardens[k];
    if (g.stage >= 3 || !g.watered) continue;
    if (now - g.since >= GARDEN_STAGE_MS) { g.stage++; g.since = now; g.watered = false; if (S.zoneId === "residence") log("Your " + ITEMS[g.seed].name.replace(/ Seeds?| Sapling/, "") + " plant " + (g.stage >= 3 ? "is ready to harvest!" : "has grown. It needs water."), "npc"); S.furnDirty = true; }
  }
}
function plantSeed(i, seedId) {
  const f = save.furniture[i];
  if (!f || !ITEMS[f.id].garden) return "That isn't a flowerpot.";
  if (save.gardens[i]) return "Something is already planted there.";
  if (invCount(seedId) < 1 || ITEMS[seedId].kind !== "seed") return "You don't have those seeds.";
  removeItem(seedId, 1);
  save.gardens[i] = { seed: seedId, stage: 0, since: Date.now(), watered: false, crystal: null };
  log("You plant " + ITEMS[seedId].name + " in the flowerpot. Water it to get it growing.", "npc");
  sfx("select");
  saveGame();
  return "";
}
function waterGarden(i) {
  const g = save.gardens[i];
  if (!g) return "Nothing is planted there.";
  if (g.stage >= 3) return "It's ready to harvest.";
  if (g.watered) return "It's already watered. Come back in a while.";
  g.watered = true;
  g.since = Date.now();
  log("You water the plant.", "npc");
  sfx("water", player);
  saveGame();
  return "";
}
function feedGarden(i, crystalId) {
  const g = save.gardens[i];
  if (!g) return "Nothing is planted there.";
  if (g.crystal) return "It has already been fed an essence.";
  if (!ITEMS[crystalId] || ITEMS[crystalId].kind !== "crystal" || invCount(crystalId) < 1) return "You don't have that crystal.";
  removeItem(crystalId, 1);
  g.crystal = ITEMS[crystalId].element;
  log("You feed the plant " + an(ITEMS[crystalId].name) + ". It glows faintly.", "npc");
  sfx("buff", player);
  saveGame();
  return "";
}
function harvestGarden(i) {
  const g = save.gardens[i];
  if (!g) return "Nothing is planted there.";
  if (g.stage < 3) return "It isn't ready yet.";
  const gr = ITEMS[g.seed].grows;
  let n = randInt(gr.n[0], gr.n[1]);
  const matched = gr.bonus && g.crystal === gr.bonus;
  if (matched) n += 2;
  if (gr.crystal) {
    const el = g.crystal || "earth";
    const id = { fire: "fire_crystal", wind: "wind_crystal", earth: "earth_crystal", water: "water_crystal" }[el] || "earth_crystal";
    giveItem(id, n);
  } else {
    giveItem(gr.item, n);
    if (gr.rare && Math.random() < (g.crystal === gr.bonus ? 0.6 : 0.3)) giveItem(pick(gr.rare), 1);
  }
  delete save.gardens[i];
  save.harvests = (save.harvests || 0) + 1;
  log("You harvest the plant." + (matched ? " The essence made it thrive." : ""), "loot");
  sfx("levelup");
  S.furnDirty = true;
  saveGame();
  return "";
}

function spawnAllowed(sp) { if (sp.bf && !(S.bf && !S.bf.won)) return false; return !sp.time || sp.time === period(); }

function spawnMob(i) {
  const sp = S.zone.spawns[i];
  if (!spawnAllowed(sp)) { S.spawnAt[i] = S.time + 5; return; }
  let fam = sp.fam, lv = randInt(sp.lv[0], sp.lv[1]);
  if (FEATURES.nms && sp.nm && (!sp.nm.time || sp.nm.time === period())) {
    const key = "nm:" + sp.nm.id;
    const story = storyWants(sp.nm.id);
    if ((story || !(save.timers[key] > Date.now())) && !S.mobs.some(m => m.alive && m.famKey === sp.nm.id) && (story || Math.random() < sp.nm.chance)) {
      fam = sp.nm.id; lv = sp.nm.lv;
      if (S.time > 1 && Math.hypot(sp.x - player.x, sp.y - player.y) < 900) { log("You sense a powerful presence nearby...", "foe"); sfx("notify"); }
    }
  }
  const mob = buildMob(fam, lv, sp.x, sp.y, i);
  if (sp.passive && !mob.fam.nm) { mob.aggro = null; mob.passive = true; }
  S.mobs.push(mob);
  S.spawnAt[i] = null;
}

function beastKey(m) { return BESTIARY[m.famKey] ? m.famKey : null; }

function noteBeast(m, kill) {
  const k = beastKey(m);
  if (!k) return;
  let b = save.bestiary[k];
  if (!b) {
    b = save.bestiary[k] = { seen: Date.now(), kills: 0, zones: [] };
    log("New bestiary entry: " + (FAMILIES[k] ? FAMILIES[k].name : NM_FAMILIES[k] && NM_FAMILIES[k].name || m.name) + ".", "sys");
    uiEvent("beast", { k, name: m.name });
  }
  if (!b.zones.includes(S.zoneId)) b.zones.push(S.zoneId);
  if (kill) b.kills++;
}

function scanBeasts() {
  for (const m of S.mobs) if (m.alive && !m.despawned && dist(m, player) < 320 && !save.bestiary[m.famKey]) noteBeast(m, false);
}

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (save.ach[a.id]) continue;
    let ok = false;
    try { ok = a.test(save); } catch (e) { ok = false; }
    if (!ok) continue;
    save.ach[a.id] = Date.now();
    log("Achievement unlocked: " + a.name + "!", "loot");
    sfx("levelup");
    uiEvent("ach", a);
  }
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
    saveGame();
  }
}

function updatePeriod() {
  const per = period();
  if (per === S.lastPeriod) return;
  S.lastPeriod = per;
  if (!S.zone.indoor && S.zone.theme !== "cave" && S.zone.theme !== "crypt") log(per === "night" ? "Night falls over " + S.zone.name + "." : "The sun rises over " + S.zone.name + ".", "sys");
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
  updateNpcs(dt);
  for (const p of S.party) { if (p.alive) { tickBuffs(p); tickCasting(p); } }
  const bodies = S.party.concat(S.mobs).filter(e => e.alive);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) separate(bodies[i], bodies[j]);
  for (const n of S.npcs) if (!n.away) for (const p of S.party) separate(p, n, true);
  for (const e of bodies) { keepOutOfWater(e); keepOutOfRects(e); keepInZone(e); }
  for (const e of S.party.concat(S.mobs)) {
    e.moving = Math.hypot(e.x - e.px, e.y - e.py) > 0.05;
    if (e.moving && isParty(e)) e.stillSince = S.time;
  }
  for (const p of S.party) regen(p, dt);
  S.zoneCooldown = Math.max(0, S.zoneCooldown - dt);
  if (S.zoneCooldown <= 0 && player.alive) {
    let onAsk = null;
    for (const ex of S.zone.exits) if (circleRect(player, ex, 8)) {
      if (ex.ask && typeof gameConfirm === "function") { onAsk = ex; continue; }
      enterZone(ex.to, ex.tx, ex.ty); return;
    }
    if (onAsk && S.exitAsked !== onAsk) {
      S.exitAsked = onAsk;
      const ex = onAsk;
      gameConfirm(ex.label, ex.ask, () => { S.exitAsked = null; enterZone(ex.to, ex.tx, ex.ty); }, { yes: "Enter", no: "Not now" });
    } else if (!onAsk) S.exitAsked = null;
  }
  S.lmTimer -= dt;
  if (S.lmTimer <= 0) { S.lmTimer = 0.5; checkLandmarks(); tickGather(); gardenTick(); scanBeasts(); S.achTimer = (S.achTimer || 0) + 1; if (S.achTimer % 4 === 0) { checkAchievements(); tickWages(); tickFood(); tickBlessing(); } }
  tickSynth(dt);
  if (S.pool && S.pool.length) tickPool(false);
  if (S.fish) tickFish();
  if (S.race) tickRace();
  if (S.pet) tickPet();
  tickBuddy(dt);
  tickStory();
  if (S.time >= (S.ahNext || 0)) { S.ahNext = S.time + 1; if (save.market.listings.length) tickAuction(); }
  if (S.bf) tickBattlefield();
  if (player.mounted && player.moving) save.stats.ride += Math.hypot(player.x - player.px, player.y - player.py) / 20;
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
  if (S.saveTimer > 15) { S.saveTimer = 0; saveGame(); }
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

function setTarget(e, quiet) {
  const changed = player.target !== e;
  player.target = e;
  if (isMob(e) && e.alive) noteBeast(e, false);
  if (isMob(e) && e.alive && !quiet && changed) uiEvent("target", e);
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
  const people = S.npcs.filter(n => !n.crystal && !n.away && !n.prop && dist(n, player) < 1200).sort((a, b) => dist(a, player) - dist(b, player));
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

function mountMul() { return CONFIG.mountSpeed * (save.saddle ? SADDLE_BONUS : 1); }

function buyCoat(id) {
  const c = MOUNT_COATS[id];
  if (!c) return "No such coat.";
  if (!save.coats.includes(id)) {
    if (save.gil < c.price) return "That costs " + c.price + " crystals.";
    save.gil -= c.price;
    save.coats.push(id);
    log("Ysolde dyes your Thornstrider " + c.name + " for " + c.price + " crystals.", "loot");
  } else log("Your Thornstrider is now " + c.name + ".", "sys");
  save.mountCoat = id;
  sfx("coin");
  saveGame();
  return "";
}

function buySaddle() {
  if (save.saddle) return "You already own the Swift Saddle.";
  if (save.gil < SADDLE_PRICE) return "The Swift Saddle costs " + SADDLE_PRICE + " crystals.";
  save.gil -= SADDLE_PRICE;
  save.saddle = true;
  log("You buy the Swift Saddle. Your Thornstrider runs " + Math.round((SADDLE_BONUS - 1) * 100) + "% faster.", "loot");
  sfx("unlock");
  saveGame();
  return "";
}

function startRace() {
  if (!save.mountLicense) return "You need a riding license.";
  if (partyInCombat()) return "Not during a fight.";
  if (S.pet) releasePet(null);
  enterZone(RACE.zone, RACE.start.x, RACE.start.y);
  for (const p of S.party) if (p.alive) { p.mounted = true; p.engaged = false; p.attackTarget = null; }
  S.race = { t0: S.time, next: 0 };
  log("The Hollow Run! Ride through " + RACE.checkpoints.length + " checkpoints, starting at " + RACE.checkpoints[0].name + ". The clock is running.", "loot");
  sfx("notify");
  uiEvent("race", {});
  return "";
}

function endRace(msg) {
  if (!S.race) return;
  S.race = null;
  if (msg) log(msg, "sys");
  uiEvent("race", {});
}

function tickRace() {
  const r = S.race;
  if (!r) return;
  const t = S.time - r.t0;
  if (S.zoneId !== RACE.zone || !player.mounted || !player.alive) { endRace("You left the course. The Hollow Run is over."); return; }
  if (t > RACE.limit) { endRace("Time's up! Try the Hollow Run again with Ysolde."); return; }
  const cp = RACE.checkpoints[r.next];
  if (Math.hypot(player.x - cp.x, player.y - cp.y) > RACE.radius) return;
  r.next++;
  sfx("select");
  if (r.next < RACE.checkpoints.length) { log("Checkpoint " + r.next + "/" + RACE.checkpoints.length + " at " + cp.name + " (" + t.toFixed(1) + "s). Next: " + RACE.checkpoints[r.next].name + ".", "loot"); uiEvent("race", {}); return; }
  S.race = null;
  const best = save.race.best;
  if (best == null || t < best) save.race.best = Math.round(t * 10) / 10;
  const medal = RACE.medals.find(m => t <= m[1]);
  let msg = "Finish! " + t.toFixed(1) + " seconds" + (best == null || t < best ? " (personal best)" : " (best " + best + "s)") + ".";
  if (medal) {
    msg += " " + medal[0][0].toUpperCase() + medal[0].slice(1) + " medal!";
    if (!save.race.medals[medal[0]]) { save.race.medals[medal[0]] = Date.now(); save.gil += medal[2]; msg += " First " + medal[0] + ": +" + medal[2] + " crystals."; }
  } else msg += " No medal this time.";
  log(msg, "loot");
  sfx("levelup");
  uiEvent("race", {});
  saveGame();
}

function canRideHere() { return !!S.zone && S.zone.theme === "field"; }

function toggleMount() {
  if (!player || S.ko) return;
  if (player.mounted) { dismount("You dismount."); return; }
  if (!save.mountLicense) { log("You don't have a riding license yet. Ysolde, the Outpost stablemaster, can help.", "sys"); sfx("error"); return; }
  if (!canRideHere()) { log("Your Thornstrider won't come into " + (S.zone.theme === "town" ? "town" : "here") + ". Call it in open country.", "sys"); sfx("error"); return; }
  if (!player.alive || player.casting || player.engaged || partyInCombat()) { log("You can't call your mount during a fight.", "sys"); sfx("error"); return; }
  standUp(player, true);
  if (S.pet) releasePet("Your " + S.pet.name + " fades as you mount.");
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
  if (sp.target === "self") return player;
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
  for (const n of S.npcs) { if (n.away) continue; const d = dist(n, player); if (d < bd) { bd = d; best = n; } }
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
  const st = storyStep();
  if (st && st.type === "talk" && st.npc === n.id && storyReady()) { storyScene(n.name, st.text, 0, () => advanceStory()); return; }
  TALK[n.talk](n);
}

function storyChapter() { return save.story.done ? null : STORY[save.story.ch] || null; }
function storyStep() { const c = storyChapter(); return c ? c.steps[save.story.step] : null; }
function storyReady() { const c = storyChapter(); return !!c && (save.story.step > 0 || player.lv >= c.lv); }
function storyWants(fam) { const st = storyStep(); return !!st && st.type === "kill" && st.fam === fam && storyReady(); }

function storyScene(who, pages, i, done) {
  const last = i >= pages.length - 1;
  openDialog(who, pages[i], [{ label: last ? "Continue" : "Next", fn: () => { if (last) { closeDialog(); done(); } else storyScene(who, pages, i + 1, done); } }]);
}

function advanceStory() {
  const c = storyChapter(), st = storyStep();
  if (!c || !st) return;
  if (st.key) giveKeyItem(st.key);
  save.story.step++;
  save.story.prog = 0;
  if (save.story.step >= c.steps.length) {
    save.story.ch++;
    save.story.step = 0;
    if (save.story.ch >= STORY.length) { save.story.done = true; learnBuddy("ash_sprite"); }
    log("Story chapter complete: " + c.name + ".", "lvl");
    uiEvent("story", { name: c.name, reward: c.reward });
    giveReward(c.reward);
    checkAchievements();
  } else {
    const nx = storyStep();
    log("Story: " + nx.goal, "npc");
    sfx("notify");
    if (nx.type === "kill" && st.summon) summonStoryFoe(st.summon);
  }
  saveGame();
}

function summonStoryFoe(fam) {
  const i = (S.zone.spawns || []).findIndex(sp => sp.nm && sp.nm.id === fam);
  if (i < 0) return;
  for (const m of S.mobs) if (m.spawnIdx === i && m.alive) { m.alive = false; m.despawned = true; m.deadAt = S.time - 99; }
  S.mobs = S.mobs.filter(m => !(m.spawnIdx === i && m.despawned));
  spawnMob(i);
}

function storyKill(e) {
  const st = storyStep();
  if (!st || st.type !== "kill" || st.fam !== e.famKey || !storyReady()) return;
  save.story.prog++;
  if (save.story.prog >= st.n) advanceStory();
  else log("Story: " + (FAMILIES[st.fam] || NM_FAMILIES[st.fam] || {}).name + " " + save.story.prog + "/" + st.n + ".", "npc");
}

function tickStory() {
  const st = storyStep();
  if (!st || st.type !== "visit" || st.zone !== S.zoneId || !storyReady() || S.dialog || !player.alive) return;
  const lm = (S.zone.landmarks || []).find(l => l.id === st.lm);
  if (!lm || Math.hypot(player.x - lm.x, player.y - lm.y) > lm.r) return;
  storyScene(lm.name, st.text, 0, () => advanceStory());
}

function questMarker(n) {
  const q = save.quests, lv = player.lv;
  for (const id in QUESTS) if (QUESTS[id].npc === n.id && QUESTS[id].intro && (questOfferable(id) || questComplete(id))) return true;
  if (n.id === "rhea") return q.pouches === "none" || (q.pouches === "active" && invCount("goblin_pouch") >= 3) || (q.bones === "done" && q.chieftain === "none" && lv >= 7) || q.chieftain === "killed";
  if (n.id === "ysolde") return !save.mountLicense && lv >= 5 && (q.riding === "none" || (q.riding === "active" && save.gil >= 300 && invCount("healing_herb") >= 3));
  if (n.id === "tobin") return (q.support === "none" && lv >= CONFIG.supportUnlockLevel) || (q.support === "active" && invCount("bat_wing") >= 2 && invCount("worm_silk") >= 1) || (lv >= 6 && ((q.pld === "none" || q.rdm === "none") || (q.pld === "active" && invCount("bone_chip") >= 2 && invCount("iron_ore") >= 1) || (q.rdm === "active" && invCount("worm_silk") >= 2 && invCount("fire_crystal") >= 1 && invCount("water_crystal") >= 1)));
  if (n.talk === "talkGuard") return !blessed();
  { const st = storyStep(); if (st && st.type === "talk" && st.npc === n.id && storyReady()) return true; }
  if (n.id === "maera") return Object.keys(save.guild.active).some(id => { const b = GUILD_BOUNTIES.find(x => x.id === id); return b && save.guild.active[id] >= b.n; }) || (player.lv >= 2 && !save.guild.total && !Object.keys(save.guild.active).length);
  return false;
}

function giveReward(r) {
  if (r.xp) gainXp(r.xp);
  if (r.gil) { save.gil += r.gil; log("You receive " + r.gil + " crystals.", "loot"); sfx("coin"); }
  if (r.item) giveItem(r.item, r.qty || 1);
  if (r.items) for (const [id, n] of r.items) giveItem(id, n);
  if (r.unlock) { save.jobsUnlocked[r.unlock] = true; log("You can now become a " + JOBS[r.unlock].name + ". Ask Tobin to change jobs.", "npc"); }
  sfx("fanfare");
}

function questOfferable(id) {
  const q = QUESTS[id];
  return save.quests[id] === "none" && player.lv >= (q.lv || 1) && (!q.pre || save.quests[q.pre] === "done");
}
const QUEST_CHECKS = { furniture: () => save.furniture.length >= 2, harvest: () => save.harvests >= 1 };
function questComplete(id) {
  const q = QUESTS[id];
  if (save.quests[id] !== "active") return false;
  if (q.kill) return (save.qprog[id] || 0) >= q.kill.n;
  if (q.items) return Object.keys(q.items).every(it => invCount(it) >= q.items[it]);
  if (q.check) return !!QUEST_CHECKS[q.check]();
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
  if (q.check === "furniture") return "Furniture placed " + Math.min(2, save.furniture.length) + "/2";
  if (q.check === "harvest") return "Harvests " + Math.min(1, save.harvests) + "/1";
  if (q.kill) return q.kill.name + " " + Math.min(q.kill.n, save.qprog[id] || 0) + "/" + q.kill.n;
  if (q.items) return Object.keys(q.items).map(it => ITEMS[it].name + " " + Math.min(q.items[it], invCount(it)) + "/" + q.items[it]).join(", ");
  return "";
}

function brazierOrder() {
  const els = ["fire", "wind", "earth", "water"];
  const rnd = seeded(hashStr(String(save.created || 1) + "braziers"));
  for (let i = els.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [els[i], els[j]] = [els[j], els[i]]; }
  return els;
}
function brazierLit(el) { return save.crypt.solved || save.crypt.lit.includes(el); }
function chestOpenUntil(n) { return save.timers["chest:" + n.id] || 0; }
function chestState(n) {
  if (n.needsKill && !(save.timers["nm:" + n.needsKill] > Date.now())) return "sealed";
  return chestOpenUntil(n) > Date.now() ? "empty" : "closed";
}
function openChest(n) {
  const table = CHEST_LOOT[n.chest] || CHEST_LOOT.common;
  let got = 0;
  for (const [id, chance] of table) {
    if (Math.random() >= chance) continue;
    if (ITEMS[id].rare && hasItem(id)) continue;
    if (giveItem(id, 1)) got++;
  }
  if (!got) giveItem("crypt_dust", 1);
  const g = randInt(40, 90) * (n.chest === "king" ? 4 : n.chest === "vault" ? 2 : 1);
  save.gil += g;
  log("You find " + g + " crystals in the " + n.name.toLowerCase() + ".", "loot");
  sfx("coin");
  save.timers["chest:" + n.id] = Date.now() + 20 * 60 * 1000;
  ring(n, "#ffd54f", 40, 0.7, "sparkle");
  vfx("levelup", { tgt: n });
  saveGame();
}

function storageCap() {
  let cap = CONFIG.storageBase;
  for (const f of save.furniture) cap += ITEMS[f.id].storage || 0;
  return cap;
}
function storageCount() { return save.storage.reduce((n, s) => n + s.qty, 0); }
function storageUsed() { return save.storage.length; }
function storeItem(idx) {
  const s = save.inventory[idx];
  if (!s) return false;
  const it = ITEMS[s.id];
  if (it.kind === "key") return false;
  const stack = it.stack || 1;
  let left = s.qty;
  for (const t of save.storage) if (t.id === s.id && t.qty < stack && left > 0) { const add = Math.min(stack - t.qty, left); t.qty += add; left -= add; }
  while (left > 0) {
    if (save.storage.length >= storageCap()) break;
    const add = Math.min(stack, left);
    save.storage.push({ id: s.id, qty: add });
    left -= add;
  }
  const moved = s.qty - left;
  if (!moved) { log("Your storage is full.", "sys"); sfx("error"); return false; }
  s.qty = left;
  if (s.qty <= 0) save.inventory.splice(idx, 1);
  log("You store " + (moved > 1 ? moved + " " + it.name + "s" : an(it.name)) + ".", "sys");
  sfx("select");
  saveGame();
  return true;
}
function retrieveItem(idx) {
  const s = save.storage[idx];
  if (!s) return false;
  const it = ITEMS[s.id];
  const before = s.qty;
  const free = CONFIG.inventorySize - save.inventory.length;
  let can = 0;
  for (const t of save.inventory) if (t.id === s.id) can += (it.stack || 1) - t.qty;
  can += free * (it.stack || 1);
  const take = Math.min(before, can);
  if (take <= 0) { log("Your bag is full.", "sys"); sfx("error"); return false; }
  giveItem(s.id, take, true);
  s.qty -= take;
  if (s.qty <= 0) save.storage.splice(idx, 1);
  log("You take " + (take > 1 ? take + " " + it.name + "s" : an(it.name)) + " out of storage.", "sys");
  sfx("select");
  saveGame();
  return true;
}
function furnFoot(id, rot) {
  const it = ITEMS[id];
  const fp = it.fp || [1, 1];
  return rot % 2 ? { w: fp[1], h: fp[0] } : { w: fp[0], h: fp[1] };
}
function furnCells(f) {
  const { w, h } = furnFoot(f.id, f.rot || 0);
  const out = [];
  for (let r = f.r; r < f.r + h; r++) for (let c = f.c; c < f.c + w; c++) out.push([c, r]);
  return out;
}
function furnFits(id, c, r, rot, skip) {
  const g = S.zone.grid || ZONES.residence.grid;
  const { w, h } = furnFoot(id, rot);
  if (c < 0 || r < 0 || c + w > g.cols || r + h > g.rows) return "Doesn't fit there.";
  const flat = !!(ITEMS[id].fp && FURNITURE_MODELS[ITEMS[id].model] && FURNITURE_MODELS[ITEMS[id].model].flat);
  for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) {
    if (g.blocked.some(([bc, br]) => bc === cc && br === rr)) return "That spot is blocked.";
    for (const f of save.furniture) {
      if (f === skip) continue;
      const otherFlat = !!(FURNITURE_MODELS[ITEMS[f.id].model] && FURNITURE_MODELS[ITEMS[f.id].model].flat);
      if (flat || otherFlat) continue;
      if (furnCells(f).some(([fc, fr]) => fc === cc && fr === rr)) return "Something is already there.";
    }
  }
  return "";
}
function placeFurniture(id, c, r, rot) {
  if (invCount(id) < 1) return "You don't have that.";
  const why = furnFits(id, c, r, rot || 0, null);
  if (why) return why;
  removeItem(id, 1);
  save.furniture.push({ id, c, r, rot: rot || 0 });
  log("Pip places the " + ITEMS[id].name + ".", "npc");
  sfx("unlock");
  saveGame();
  S.furnDirty = true;
  return "";
}
function removeFurniture(i) {
  const f = save.furniture[i];
  if (!f) return "";
  if (save.gardens[i]) return "Harvest or clear the plant first.";
  if (ITEMS[f.id].storage && storageUsed() > storageCap() - ITEMS[f.id].storage) return "Your stored items wouldn't fit without it.";
  if (save.inventory.length >= CONFIG.inventorySize && !save.inventory.some(s => s.id === f.id && s.qty < (ITEMS[f.id].stack || 1))) return "Your bag is full.";
  save.furniture.splice(i, 1);
  const moved = {};
  for (const k in save.gardens) { const n = +k; if (n > i) moved[n - 1] = save.gardens[k]; else if (n < i) moved[n] = save.gardens[k]; }
  save.gardens = moved;
  giveItem(f.id, 1, true);
  log("Pip packs away the " + ITEMS[f.id].name + ".", "npc");
  sfx("select");
  saveGame();
  S.furnDirty = true;
  return "";
}
function rotateFurniture(i) {
  const f = save.furniture[i];
  if (!f) return "";
  const rot = ((f.rot || 0) + 1) % 4;
  const why = furnFits(f.id, f.c, f.r, rot, f);
  if (why) return why;
  f.rot = rot;
  saveGame();
  S.furnDirty = true;
  return "";
}
function furnitureRects() {
  const g = ZONES.residence.grid;
  const cw = ZONES.residence.w / g.cols, ch = ZONES.residence.h / g.rows;
  const out = [];
  for (const f of save.furniture) {
    const m = FURNITURE_MODELS[ITEMS[f.id].model];
    if (m && m.flat) continue;
    const { w, h } = furnFoot(f.id, f.rot || 0);
    out.push({ x: f.c * cw + 4, y: f.r * ch + 4, w: w * cw - 8, h: h * ch - 8 });
  }
  return out;
}

const TALK = {
  talkRhea(n) {
    const q = save.quests;
    if (q.pouches === "none") {
      openDialog(n.name, "Goblins out in Rocky Hollow keep raiding our supply crates. Bring me 3 Goblin Pouches as proof you've thinned them out, and I'll make it worth your while.", [
        { label: "Accept", fn: () => { q.pouches = "active"; log("Quest accepted: " + QUESTS.pouches.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
      ].concat(questOptions("rhea", n)));
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
      if (q.rdm === "none") adv.push({ label: "Ask about the Red Mage's arts", fn: () => openDialog(n.name, "A Red Mage does a little of everything well: blade in hand, Slow and Paralyze on the enemy, a nuke when it counts, a Cure in a pinch. Bring me 2 Worm Silk, 1 Fire Essence and 1 Water Essence for the scarlet dye, and we'll begin.", [{ label: "Accept", fn: () => { q.rdm = "active"; log("Quest accepted: " + QUESTS.rdm.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }]) });
      else if (q.rdm === "active") turnIn("rdm", [["worm_silk", 2], ["fire_crystal", 1], ["water_crystal", 1]], "Present the dye materials");
      adv.push(...questOptions("tobin", n));
    }
    const advNote = (q.pld === "active" ? " The oath needs 2 Bone Chips and 1 Iron Ore." : "") + (q.rdm === "active" ? " The scarlet lessons need 2 Worm Silk, 1 Fire Essence and 1 Water Essence." : "");
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
  talkGarrick(n) {
    openDialog(n.name, "Gear's only as good as the hands that finish it. Bring me iron ore, a fire essence and some crystals, and I'll work a little extra into any piece you own: up to two augments each. Don't like what you got? I can reforge it.", [
      { label: "Augment gear", fn: () => { closeDialog(); openModal("forge"); } }
    ]);
  },
  talkGuard(n) {
    const mins = blessingMinutes(), left = blessed() ? Math.ceil((save.blessing - Date.now()) / 60000) : 0;
    const rank = GUILD_RANKS[guildRank()][0];
    openDialog(n.name, (left ? "Your City Blessing holds for another " + left + " minute" + (left > 1 ? "s" : "") + ". " : "Heading out? Monsters only yield essences to those who carry the City Blessing, and it fades after a while. ") + "At " + rank + " rank the blessing lasts " + mins + " minutes. Shall I renew it?", [
      { label: left ? "Renew the City Blessing (" + mins + " min)" : "Receive the City Blessing (" + mins + " min)", fn: () => { closeDialog(); giveBlessing(); } }
    ]);
  },
  talkAuction(n) {
    const box = save.market.box.length, lots = save.market.listings.length, news = marketNews(marketDay());
    openDialog(n.name, "Welcome to the auction house. Buy from other adventurers, or put your own goods up and let the market find a buyer. " + news.text[0] + (lots ? " You have " + lots + " lot" + (lots > 1 ? "s" : "") + " up." : "") + (box ? " There's something waiting in your delivery box." : ""), [
      { label: "Browse the auction house", fn: () => { closeDialog(); UI.ahView = "buy"; openModal("auction"); } },
      { label: "Sell at auction", fn: () => { closeDialog(); UI.ahView = "sell"; openModal("auction"); } }
    ]);
  },
  talkMaera(n) {
    const g = save.guild, rk = guildRank(), ready = Object.keys(g.active).filter(id => { const b = GUILD_BOUNTIES.find(x => x.id === id); return b && g.active[id] >= b.n; }).length;
    const line = !g.total && !Object.keys(g.active).length ? "Welcome to the Adventurers' Guild. Every day I post bounties on monsters that are giving folk trouble. Finish them for crystals and guild points; points raise your rank and buy things you won't find in any shop." : ready ? "Back already? Let's see what you've brought in." : "You're " + GUILD_RANKS[rk][0] + " rank with " + g.gp + " guild points to spend. Today's bounties are on the board behind me.";
    openDialog(n.name, line, [{ label: "Guild bounties and shop", fn: () => { closeDialog(); openModal("guild"); } }]);
  },
  talkBoard(n) {
    const left = boardToday().filter(r => !save.board.done.includes(r.id)).length;
    openDialog(n.name, "Notes pinned to the board ask for supplies. " + (left ? left + " request" + (left > 1 ? "s are" : " is") + " still open today." : "Every request is filled for today. New notes go up tomorrow."), [
      { label: "Read the requests", fn: () => { closeDialog(); openModal("board"); } }
    ]);
  },
  talkChapelDoor(n) {
    const have = invCount("chapel_sigil");
    openDialog(n.name, "A sealed door half-sunk in black water. A socket in the stone is shaped like a sigil. Something vast breathes beyond it." + (have ? " You carry " + have + " Chapel Sigil" + (have > 1 ? "s" : "") + "." : " You need a Chapel Sigil. The Drowned sometimes carry them, and Vela in Saltreach sells them."), have ? [
      { label: "Use a Chapel Sigil and enter (" + BATTLEFIELD.minutes + "-minute battle)", fn: () => { closeDialog(); const why = enterBattlefield(); if (why) { log(why, "sys"); sfx("error"); } } }
    ] : []);
  },
  talkIlsa(n) {
    const g = questOptions("ilsa", n);
    openDialog(n.name, g.length ? "Welcome to Saltreach. Ships, fish and salt; that's the harbor. I always have work for steady hands." : "Fair winds. Come back when you're stronger and I may have more work.", g);
  },
  talkMarn(n) {
    openDialog(n.name, "Fresh off the boats! Rods, bait, flour and salt, and a hot meal if you're hungry. I'll buy your catch too.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "marn"; openModal("shop"); } }
    ].concat(questOptions("marn", n)));
  },
  talkVela(n) {
    openDialog(n.name, "Harbor-forged steel and sailcloth. Lighter than what they sell up the road, and tougher. Not cheap, mind.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "vela"; openModal("shop"); } }
    ]);
  },
  talkPell(n) {
    openDialog(n.name, "Potions, ethers, arms and armor. Crystals talks, friend.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "pell"; openModal("shop"); } }
    ].concat(questOptions("pell", n)));
  },
  talkYsolde(n) {
    const q = save.quests;
    if (save.mountLicense) {
      openDialog(n.name, "Your Thornstrider's been fed and brushed. Call it in open country with the Mount button or R. I can dye her coat, sell you a faster saddle, or time you on the Hollow Run." + (save.race.best != null ? " Your best run: " + save.race.best + "s." : ""), [
        { label: "Pets", fn: () => { closeDialog(); openModal("pets"); } },
        { label: "Stable (coats and saddle)", fn: () => { closeDialog(); openModal("stable"); } },
        { label: "Run the Hollow course", fn: () => { closeDialog(); const why = startRace(); if (why) { log(why, "sys"); sfx("error"); } } }
      ]);
      return;
    }
    if (player.lv < 5) { openDialog(n.name, "Thornstriders are proud beasts. They won't carry a greenhorn. Reach level 5 and come see me about a riding license. Until then, if you've found a small creature on the road, I can help you look after it.", [{ label: "Pets", fn: () => { closeDialog(); openModal("pets"); } }]); return; }
    if (false) { openDialog(n.name, "Thornstriders are proud beasts. They won't carry a greenhorn. Reach level 5 and come see me about a riding license.", []); return; }
    if (q.riding === "none") {
      openDialog(n.name, "You've got the look of someone who's walked the Hollow too many times. A riding license costs 300 crystals, plus 3 Healing Herbs for the beast's feed. Hares and worms in the Hollow carry them.", [
        { label: "I'll get them", fn: () => { q.riding = "active"; log("Quest accepted: " + QUESTS.riding.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }
      ]);
      return;
    }
    const herbs = invCount("healing_herb");
    if (save.gil >= 300 && herbs >= 3) {
      openDialog(n.name, "Herbs and coin. Good. She's yours: a Thornstrider, antlers and all. Treat her well.", [
        { label: "Pay 300 crystals and hand over the herbs", fn: () => {
          save.gil -= 300; removeItem("healing_herb", 3);
          q.riding = "done"; save.mountLicense = true;
          log("Quest complete: " + QUESTS.riding.name + ". You can now ride a Thornstrider. Press R or Mount in open country.", "npc");
          giveReward(QUESTS.riding.reward);
          saveGame(); closeDialog();
        } }
      ]);
    } else openDialog(n.name, "You have " + herbs + " of 3 Healing Herbs and " + save.gil + " of 300 crystals.", []);
  },
  talkBrann(n) {
    const hired = save.hired.length;
    openDialog(n.name, hired ? "Your company's holding up, I hope. Need more swords, or fewer mouths to feed?" : "Nobody walks the Hollow alone for long. My people fight for coin: pay their fee to hire them, then a daily wage to keep them. They'll follow you anywhere. Up to five at a time.", [
      { label: "Hire or dismiss companions", fn: () => { closeDialog(); openModal("mercs"); } }
    ].concat(questOptions("brann", n)));
  },
  talkPip(n) {
    const placed = save.furniture.length;
    const g = questOptions("pip", n);
    openDialog(n.name, placed ? "Welcome home! " + placed + " piece" + (placed === 1 ? "" : "s") + " of furniture, " + storageUsed() + "/" + storageCap() + " storage slots used. What do you need?" : "Oh! You must be the new tenant. I'm Pip. I mind the cottage: I'll keep your things and arrange whatever furniture you bring. It's a bit bare in here. Odette by the west wall sells furniture.", [
      { label: "Storage", fn: () => { closeDialog(); openModal("storage"); } },
      { label: "Arrange furniture", fn: () => { closeDialog(); openModal("home"); } }
    ].concat(g));
  },
  talkOdette(n) {
    openDialog(n.name, "Chairs, tables, beds, a good hearth, and seeds for the flowerpots. Everything a cottage wants. Pip at your place will set it all up.", [
      { label: "Browse furniture and seeds", fn: () => { closeDialog(); openModal("furnishings"); } }
    ].concat(questOptions("odette", n)));
  },
  talkGather(n) { doGather(n); },
  talkBrazier(n) {
    const el = n.element;
    if (brazierLit(el)) { openDialog(n.name, save.crypt.solved ? "The brazier burns steadily. The gate stands open." : "The brazier is already lit. " + (4 - save.crypt.lit.length) + " more to go.", []); return; }
    openDialog(n.name, "A cold brazier of " + { fire: "blackened iron", wind: "pale silver", earth: "rough granite", water: "blue-green bronze" }[el] + ". It could be lit.", [
      { label: "Light it", fn: () => {
        closeDialog();
        const order = brazierOrder();
        if (order[save.crypt.lit.length] === el) {
          save.crypt.lit.push(el);
          log("The " + n.name + " flares to life.", "npc");
          sfx(el === "fire" ? "fire" : el);
          vfx("nuke", { src: player, tgt: n, el });
          ring(n, ELEMENT_COLORS[el], 40, 0.8, "burst");
          if (save.crypt.lit.length >= 4) {
            save.crypt.solved = true;
            log("Stone grinds on stone. The sealed gate rises; the way to the crossroads is open.", "npc");
            sfx("unlock");
            S.shake = 0.4;
            uiEvent("landmark", { name: "The sealed gate opens", xp: 0 });
          }
        } else {
          save.crypt.lit = [];
          log("The flames gutter and die in every brazier. Something stirs in the dark.", "foe");
          sfx("interrupt", n);
          vfx("interrupt", { tgt: n });
          for (const sgn of [-1, 1]) { const sk = spawnExtra("skeleton", 9, 900 + sgn * 70, 700); aggro(sk, player); addEnmity(sk, player, 60); }
        }
        saveGame();
      } }
    ]);
  },
  talkTablet(n) {
    const order = brazierOrder();
    openDialog(n.name, "Worn letters, still legible: \"Wake them as the verse runs. First " + BRAZIER_LINES[order[0]] + "; then " + BRAZIER_LINES[order[1]] + "; then " + BRAZIER_LINES[order[2]] + "; and last, " + BRAZIER_LINES[order[3]] + ". Err, and the dead will answer.\"", []);
  },
  talkChest(n) {
    const st = chestState(n);
    if (st === "sealed") { openDialog(n.name, "The coffer is bound with pale chains. They will not loosen while the King sits his throne.", []); return; }
    if (st === "empty") { const m = Math.ceil((chestOpenUntil(n) - Date.now()) / 60000); openDialog(n.name, "Empty. The crypt refills its hoards in time; try again in about " + m + " minute" + (m === 1 ? "" : "s") + ".", []); return; }
    openDialog(n.name, n.chest === "king" ? "A royal coffer, its chains fallen away." : "A heavy chest, lid shut. Something rattles inside.", [{ label: "Open it", fn: () => { closeDialog(); openChest(n); } }]);
  },
  talkThrone(n) {
    openDialog(n.name, save.timers["nm:hollow_king"] > Date.now() ? "The throne stands empty. For now." : "A throne of black stone, cold as the grave. Its king is never far.", []);
  },
  talkCrystal(n) {
    const hurt = S.party.some(p => !p.alive || p.hp < p.maxHp || p.mp < p.maxMp);
    for (const p of S.party) { p.alive = true; p.hp = p.maxHp; p.mp = p.maxMp; }
    if (hurt) { ring(n, "#80deea", 60, 0.9, "sparkle"); sfx("cure", n); vfx("crystal", { at: n }); }
    saveGame();
    const isHome = save.home.zone === S.zoneId && save.home.npc === n.id;
    openDialog(n.name, "The crystal's light washes over your party. HP and MP restored." + (isHome ? " This is your home point." : " You can make this your home point: you'll return here if you fall."), isHome ? [] : [
      { label: "Set as home point", fn: () => { save.home = { zone: S.zoneId, npc: n.id }; log("Home point set: " + S.zone.name + ".", "npc"); sfx("unlock"); saveGame(); closeDialog(); } }
    ]);
  }
};

function resumePos() {
  const l = save.loc;
  if (l && ZONES[l.zone] && isFinite(l.x) && isFinite(l.y) && l.x > 0 && l.y > 0 && l.x < ZONES[l.zone].w && l.y < ZONES[l.zone].h) return l;
  return homePos();
}

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
  if (S.pet) releasePet("Your " + S.pet.name + " fades away.");
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

function shopListFor(kind) { return kind === "furniture" ? FURNITURE_SHOP.slice() : shopList(); }

function shopList(kind) {
  const src = kind && SHOPS[kind] ? SHOPS[kind] : SHOP;
  return src.filter(id => {
    const it = ITEMS[id];
    if (it.kind === "tool" && !FEATURES.gathering) return false;
    if ((it.kind === "crystal" || ["copper_ore", "ash_log", "healing_herb"].includes(id)) && !FEATURES.crafting) return false;
    return true;
  });
}

function sellPrice(id) { const it = ITEMS[id]; return it.rare || it.ex ? 0 : Math.floor(it.price / 4 * (1 + buddyPerk("sell"))); }

function buy(id) {
  const it = ITEMS[id];
  if (save.gil < it.price) { log("You cannot afford the " + it.name + ".", "sys"); sfx("error"); return; }
  if (!giveItem(id, 1, true)) return;
  save.gil -= it.price;
  log("You buy " + an(it.name) + " for " + it.price + " crystals.", "loot");
  sfx("coin");
  saveGame();
}

function sell(id) {
  const p = sellPrice(id);
  if (p <= 0) { log("Pell won't buy that.", "sys"); sfx("error"); return; }
  if (!removeItem(id, 1)) return;
  save.gil += p;
  log("You sell " + an(ITEMS[id].name) + " for " + p + " crystals.", "loot");
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
  ["/pet", "Summon or dismiss your equipped pet."],
  ["/fish", "Cast a line at the water's edge (needs a Willow Rod and Fishing Bait). Type it again when something bites to reel in."],
  ["/weather", "Show the current weather and its element bonus."],
  ["/stance assist|follow|hold", "Tell your companions how to fight: assist your target, follow without attacking, or hold their ground."],
  ["/party", "Open the Party tab: companions, stance, gear, bond and wages. Also P."],
  ["/bestiary", "Open the bestiary. Also Y."],
  ["/achievements", "Open your achievements."],
  ["/stand", "Stand up."],
  ["/attack", "Attack your target, or the nearest enemy. Also /a."],
  ["/target name", "Target the nearest character whose name matches. Also /ta."],
  ["/assist", "Target what your party is fighting."],
  ["/check", "Inspect your target: how tough it looks and whether it is hostile. Also /c."],
  ["/cast spell", "Cast a spell by name, e.g. /cast cure. Also /ma."],
  ["/ja ability", "Use a job ability, e.g. /ja provoke."],
  ["/ws name", "Use a weapon skill, e.g. /ws fast blade."],
  ["/item name", "Use an item, e.g. /item potion."],
  ["/mount, /dismount", "Call or dismiss your Thornstrider."],
  ["/jump", "Jump."],
  ["/craft", "Open the synthesis window (also the Crafting tab)."],
  ["/time", "Show the game time and weekday."],
  ["/where", "Show your zone and position."],
  ["/clear", "Clear the chat log."],
  ["/fps", "Show or hide the frame-rate counter."],
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
    case "pet": { const why = toggleBuddy(); if (why) { log(why, "sys"); sfx("error"); } return; }
    case "stance": setStance((arg || "").toLowerCase().trim()); return;
    case "fish": { if (S.fish && S.fish.state === "bite") { reelFish(); return; } const why = startFishing(); if (why) { log(why, "sys"); sfx("error"); } return; }
    case "weather": { const w = weatherNow(); log(w ? "Weather: " + WEATHER_INFO[w].name + (WEATHER_INFO[w].el ? " (" + WEATHER_INFO[w].el + " spells +10%)" : "") + "." : "No weather here.", "sys"); return; }
    case "party": if (typeof openMenu === "function") openMenu("party"); return;
    case "bestiary": case "beasts": if (typeof openMenu === "function") openMenu("bestiary"); return;
    case "achievements": case "ach": if (typeof openMenu === "function") openMenu("achievements"); return;
    case "stand": if (player.resting) standUp(player); else log("You're already standing.", "sys"); return;
    case "attack": case "a": toggleEngage(false); return;
    case "target": case "ta": {
      if (!arg) { cycleTarget(); return; }
      const t = findNamed(S.mobs.filter(m => m.alive && !m.despawned && dist(m, player) < 900).concat(S.npcs.filter(n => !n.away), S.party), arg);
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
      const tough = { "Too Weak": "seems too weak to be worthwhile", "Easy Prey": "seems like easy prey", "Decent Challenge": "seems like a decent challenge", "Even Match": "seems like an even match", "Tough": "looks tough", "Very Tough": "looks very tough", "Incredibly Tough": "looks incredibly tough" }[c] || "is hard to judge";
      log("The " + t.name + " " + tough + ". " + (t.passive || !t.fam.aggro ? "It looks peaceful unless provoked." : "It looks hostile.") + (t.fam.nm ? " It is a notorious monster!" : ""), "sys");
      return;
    }
    case "cast": case "ma": castBy("ma"); return;
    case "ja": castBy("ja"); return;
    case "ws": castBy("ws"); return;
    case "item": case "use": {
      const q = arg.toLowerCase();
      const s = save.inventory.find(x => ["use", "food"].includes(ITEMS[x.id].kind) && ITEMS[x.id].name.toLowerCase() === q) || save.inventory.find(x => ["use", "food"].includes(ITEMS[x.id].kind) && ITEMS[x.id].name.toLowerCase().includes(q));
      if (!s || !q) { log("You don't have a usable item called \"" + arg + "\".", "sys"); sfx("error"); return; }
      useItem(s.id);
      return;
    }
    case "mount": if (!player.mounted) toggleMount(); return;
    case "dismount": if (player.mounted) dismount("You dismount."); return;
    case "jump": if (typeof tryJump === "function") tryJump(); return;
    case "craft": case "synth": openModal("craft"); return;
    case "time": case "clock": log(clockText() + " · " + (isNight() ? "night" : "day") + " · " + dayElement() + " spells +10% today.", "sys"); return;
    case "where": case "pos": log(S.zone.name + " (" + Math.round(player.x) + ", " + Math.round(player.y) + ")", "sys"); return;
    case "clear": if (typeof clearLog === "function") clearLog(); return;
    case "fps": if (typeof VIEW !== "undefined" && VIEW.settings) { VIEW.settings.fps = !VIEW.settings.fps; saveSettings(VIEW.settings); log("FPS counter " + (VIEW.settings.fps ? "on" : "off") + ".", "sys"); } return;
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
