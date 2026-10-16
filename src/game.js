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
const isSide = e => isParty(e) || (!!e && e.kind === "remote");
const claimId = e => (e && e.kind === "remote" ? e.id : S.charId || "me");
function claimOk(m, who) {
  if (!m || !m.claim) return true;
  const remote = !!who && who.kind === "remote";
  const id = remote ? who.id : S.charId || "me";
  if (m.claim === id || m.claim === "me") return true;
  if (!remote) return typeof netIsMate === "function" && netIsMate(m.claim);
  const c = S.others && S.others.get(m.claim);
  const cp = m.claim === S.charId ? (typeof NET_PT !== "undefined" ? NET_PT.id : null) : c && c.pid;
  return !!cp && cp === who.pid;
}
function claimState(m) { return !m || !m.claim || !m.alive ? "" : claimOk(m) ? "mine" : "other"; }
function claimName(m) { if (!m.claim) return ""; if (m.claim === S.charId || m.claim === "me") return "you"; const o = S.others && S.others.get(m.claim); return o ? o.name : "another adventurer"; }
const isMate = e => !!e && e.kind === "remote" && typeof netIsMate === "function" && netIsMate(e.id);
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
  const id = areaOf(zoneId || S.zoneId), tbl = WEATHER[id];
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
function gameDate() {
  const day = Math.floor((Date.now() + S.timeShift - VANA_EPOCH) * 25 / 60000 / 1440);
  const y = 880 + Math.floor(day / 360), d = ((day % 360) + 360) % 360;
  return y + "/" + String(Math.floor(d / 30) + 1).padStart(2, "0") + "/" + String(d % 30 + 1).padStart(2, "0");
}
function clockText() { const v = vana(); return DAY_NAMES[v.dayIndex] + " " + String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0"); }

const DMG_RED = "#ff2a20";
function popText(e, text, color, size, life, yOff, dmg) {
  S.floaters.push({ x: e.x + rand(-10, 10), y: e.y, h: (e.radius || 14) + 4 + (yOff || 0), text: String(text), color, size: size || 16, t: 0, life: life || 1.0, dmg: !!dmg, drift: rand(-1, 1) });
}

function ring(e, color, grow, life, kind) {
  S.effects.push({ x: e.x, y: e.y, t: 0, life: life || 0.5, color, r0: e.radius || 14, r1: (e.radius || 14) + (grow || 30), kind: kind || "ring" });
}

function newSkillSet() { return { sword: 0, club: 0, staff: 0, greataxe: 0, h2h: 0, healing: 0, divine: 0, elemental: 0, enfeebling: 0, enhancing: 0 }; }

function newSave() {
  const jobs = {}, skills = {};
  for (const j in JOBS) { jobs[j] = { lv: 1, xp: 0 }; skills[j] = newSkillSet(); }
  return {
    mercDefs: {}, mercDay: { day: -1, ids: [] }, mercFallen: {},
    spells: Object.keys(SPELLS).filter(id => Object.values(SPELLS[id].jobs).includes(1)),
    v: 2, rv: CONFIG.ruleVer, name: "Adventurer", mainJob: "WAR", subJob: null, supportUnlocked: false,
    jobs, skills,
    gear: { main: "bronze_sword", head: "bronze_cap", body: "bronze_harness" },
    inventory: [{ id: "potion", qty: 3 }],
    gil: CONFIG.startGil,
    quests: Object.fromEntries(Object.keys(QUESTS).map(k => [k, "none"])),
    mountCoat: "teal", coats: ["teal"], saddle: false, blessing: 0, buddies: [], buddyNames: {}, friends: [], blocked: [], lsActive: null, lfg: false, seekMsg: "", buddy: null, buddyOut: false, race: { best: null, medals: {} }, mountLicense: false, jobsUnlocked: { PLD: false, RDM: false, THF: false, MNK: false, RNG: false, SMN: false, DRK: false, BRD: false }, look: { build: 0, hairStyle: 0, hairColor: 1 },
    hired: [], zsplit: Object.fromEntries(Object.keys(ZONE_SPLITS).map(k => [k, 1])), home: { zone: "outpost", npc: "crystal_town" }, keyItems: [], timers: {}, landmarks: {}, districts: {}, zv: 3, qprog: {}, crypt: { solved: false, lit: [] }, storage: [], furniture: [], crafts: { smithing: 0, woodworking: 0, clothcraft: 0, alchemy: 0, cooking: 0 }, food: null, gatherSkill: { mining: 0, logging: 0, harvesting: 0, fishing: 0 }, gardens: {}, harvests: 0, created: Date.now(),
    stance: "assist", mercGear: {}, mercInv: {}, bond: {}, mercPaid: {}, mercContract: {}, oldFriends: {}, mercWageSeen: {}, mercHireLv: {}, bestiary: {}, recipes: Object.fromEntries(RECIPE_START.map(id => [id, 1])), seen: { items: {}, npcs: {} }, ach: {}, nmKilled: {}, discovered: [], stats: { kills: 0, nm: 0, sc: 0, mb: 0, crafts: 0, hq: 0, gathers: 0, kos: 0, jumps: 0, trades: 0, ahSold: 0, ahBought: 0, bounties: 0, lotsWon: 0, fish: 0, bigFish: 0, meals: 0, ride: 0, summons: 0, rngKills: 0, bfWins: 0, dmgDealt: 0, dmgTaken: 0, bigHit: 0, spellsCast: 0, abilitiesUsed: 0, itemsUsed: 0, killGil: 0, walk: 0 }, board: { day: 0, done: [] }, story: { ch: 0, step: 0, prog: 0, done: false }, market: { press: {}, bought: { day: -1, t: {} }, listings: [], box: [] }, guild: { gp: 0, total: 0, active: {}, day: 0, done: [] }, augments: {}
  };
}

function normalizeSave(d) {
  if (!d || typeof d !== "object" || !d.jobs || !d.gear || !Array.isArray(d.inventory)) return null;
  if (d.rv !== CONFIG.ruleVer) return null;
  const b = newSave();
  const out = Object.assign(b, d);
  out.jobs = Object.assign(newSave().jobs, d.jobs);
  if (out.look && out.look.face >= 8) out.look = Object.assign({}, out.look, { face: out.look.face % 8 });
  out.skills = newSave().skills;
  if (d.skills) for (const j in out.skills) Object.assign(out.skills[j], d.skills[j] || {});
  out.quests = Object.assign(newSave().quests, d.quests || {});
  if (out.bestiary) for (const k in out.bestiary) if (!out.bestiary[k] || !out.bestiary[k].kills) delete out.bestiary[k];
  if (!d.zv && out.loc && ZONE_SCALE[out.loc.zone]) { out.loc = Object.assign({}, out.loc, { x: Math.round(out.loc.x * ZONE_SCALE[out.loc.zone]), y: Math.round(out.loc.y * ZONE_SCALE[out.loc.zone]) }); }
  if ((d.zv || 0) < 2 && out.loc && out.loc.zone === "outpost") out.loc = { zone: "outpost", x: ZONES.outpost.start.x, y: ZONES.outpost.start.y };
  if ((d.zv || 0) < 3 && out.loc && (out.loc.zone === "harbor" || out.loc.zone === "ironvale")) out.loc = { zone: out.loc.zone, x: ZONES[out.loc.zone].start.x, y: ZONES[out.loc.zone].start.y };
  out.zv = 3;
  out.zsplit = d.zsplit;
  migrateSplits(out);
  if (!out.districts || typeof out.districts !== "object") out.districts = {};
  out.look = Object.assign(newSave().look, d.look || {});
  out.stats = Object.assign(newSave().stats, d.stats || {});
  out.recipes = Object.assign({}, d.recipes || {});
  if (!d.recipes) { for (const r of RECIPES) if (r.lv <= Math.floor((d.crafts && d.crafts[r.craft]) || 0)) out.recipes[r.id] = 1; for (const id of RECIPE_START) out.recipes[id] = 1; }
  out.seen = { items: Object.assign({}, d.seen && d.seen.items), npcs: Object.assign({}, d.seen && d.seen.npcs) };
  for (const s of out.inventory) out.seen.items[s.id] = 1;
  for (const k in out.gear) out.seen.items[out.gear[k]] = 1;
  for (const s of d.storage || []) if (s && ITEMS[s.id]) out.seen.items[s.id] = 1;
  if (!["assist", "follow", "hold"].includes(out.stance)) out.stance = "assist";
  delete out.look.skin;
  out.mountLicense = !!d.mountLicense;
  out.hired = (Array.isArray(d.hired) ? d.hired : []).filter(id => MERCS[id] || (d.mercDefs && d.mercDefs[id])).slice(0, CONFIG.maxParty - 1);
  out.home = d.home && ZONES[d.home.zone] && ZONES[d.home.zone].safe && NPCS[d.home.npc] && ZONES[d.home.zone].npcs.some(n => n.id === d.home.npc) ? d.home : newSave().home;
  out.inventory = d.inventory.filter(s => s && ITEMS[s.id] && s.qty > 0);
  out.gear = {};
  for (const key in d.gear || {}) { const id = d.gear[key]; if (!id || !ITEMS[id] || ITEMS[id].kind !== "equip") continue; const k = slotFor(id, out.gear, key === "ring" ? "ring1" : key); if (!out.gear[k]) out.gear[k] = id; }
  out.jobsUnlocked = Object.assign(newSave().jobsUnlocked, d.jobsUnlocked || {});
  checkJobUnlocksIn(out);
  out.jobPopups = (Array.isArray(d.jobPopups) ? d.jobPopups : []).filter(j => JOBS[j]);
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
  out.friends = Array.isArray(d.friends) ? d.friends.filter(x => typeof x === "string").slice(0, 50) : [];
  out.blocked = Array.isArray(d.blocked) ? d.blocked.filter(x => typeof x === "string").slice(0, 50) : [];
  out.lsActive = typeof d.lsActive === "string" ? d.lsActive : null;
  out.lfg = !!d.lfg;
  out.seekMsg = typeof d.seekMsg === "string" ? d.seekMsg.slice(0, 40) : "";
  out.inventory = out.inventory.filter(x => {
    const it = ITEMS[x.id], pid = it && it.kind === "pet" ? it.pet : null;
    if (!pid || !BUDDIES[pid] || out.buddies.includes(pid)) return true;
    out.buddies.push(pid);
    if (x.qty > 1) { x.qty--; return true; }
    return false;
  });
  if (!out.buddies.includes(out.buddy)) out.buddy = out.buddies[0] || null;
  out.buddyOut = !!out.buddyOut && !!out.buddy;
  out.market = Object.assign(newSave().market, d.market && typeof d.market === "object" ? d.market : {});
  if (!Array.isArray(out.market.listings)) out.market.listings = [];
  if (!Array.isArray(out.market.box)) out.market.box = [];
  out.market.listings = out.market.listings.filter(l => l && ITEMS[l.id]);
  if (out.market.local) out.market.local.lots = (Array.isArray(out.market.local.lots) ? out.market.local.lots : []).filter(l => l && ITEMS[l.id] && l.qty > 0 && l.price > 0);
  out.market.box = out.market.box.filter(b => b && ((ITEMS[b.id] && b.qty > 0) || b.gil > 0));
  out.story = Object.assign(newSave().story, d.story && typeof d.story === "object" ? d.story : {});
  out.guild = Object.assign(newSave().guild, d.guild && typeof d.guild === "object" ? d.guild : {});
  if (!out.guild.active || typeof out.guild.active !== "object") out.guild.active = {};
  if (!Array.isArray(out.guild.done)) out.guild.done = [];
  if (!Array.isArray(out.crypt.lit)) out.crypt.lit = [];
  if (!Array.isArray(d.spells)) out.spells = Object.keys(SPELLS).filter(id => Object.entries(SPELLS[id].jobs).some(([j, l]) => out.jobs[j] && out.jobs[j].lv >= l));
  out.spells = out.spells.filter(id => SPELLS[id]);
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

const PLAY = { offline: false };
const ROSTER_ON = "usr_roster_v1", ROSTER_OFF = "usr_off_roster_v1";
const MAX_CHARS = 5;
const charKey = id => (PLAY.offline ? "usr_off_char_" : "usr_char_") + id;
function rosterKey() { return PLAY.offline ? ROSTER_OFF : ROSTER_ON; }

function charSummary(id, d, prev) {
  return { id, name: d.name || "Adventurer", job: d.mainJob, lv: d.jobs[d.mainJob].lv, zone: d.home && ZONES[d.home.zone] ? ZONES[d.home.zone].name : "Ashenreach Outpost", look: Object.assign({}, d.look), created: d.created || (prev && prev.created) || Date.now(), played: Date.now(), gil: d.gil };
}

const OLD_CHARS = [];

function saveIsOld(raw) {
  try { const d = JSON.parse(raw); return !!d && typeof d === "object" && d.rv !== CONFIG.ruleVer; } catch (e) { return false; }
}

function purgeOldChars(r) {
  let cut = false;
  r.chars = r.chars.filter(c => {
    const raw = STORE.get(charKey(c.id));
    if (!raw || !saveIsOld(raw)) return true;
    STORE.remove(charKey(c.id));
    OLD_CHARS.push(c.name);
    if (r.current === c.id) r.current = null;
    cut = true;
    return false;
  });
  return cut;
}

function loadRoster() {
  let r = null;
  try { r = JSON.parse(STORE.get(rosterKey())); } catch (e) {}
  if (r && Array.isArray(r.chars)) { if (purgeOldChars(r)) saveRoster(r); return r; }
  r = { chars: [], current: null };
  try {
    const raw = PLAY.offline ? null : STORE.get(CONFIG.saveKey);
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

function saveRoster(r) { STORE.set(rosterKey(), JSON.stringify(r)); }

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
  d.spells = Object.keys(SPELLS).filter(id => SPELLS[id].jobs[d.mainJob] === 1 && !SPELLS[id].drop);
  d.look = Object.assign(newSave().look, opts.look || {});
  if (!RACES[d.look.race]) d.look.race = "human";
  if (RACES[d.look.race].sex != null) d.look.build = RACES[d.look.race].sex;
  if (d.mainJob === "WHM") d.gear = { main: "ash_club", head: "bronze_cap", body: "robe" };
  else if (d.mainJob === "BLM") d.gear = { main: "ash_staff", head: "bronze_cap", body: "robe" };
  d.inventory = [{ id: "potion", qty: 3 }];
  if (PLAY.offline) d.offline = true;
  const id = PLAY.offline ? "o" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36) : typeof NET !== "undefined" && NET.member && typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "c" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
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
  if (!!d.offline !== PLAY.offline) return false;
  const r = loadRoster();
  r.current = id;
  saveRoster(r);
  S.charId = id;
  save = d;
  S.timeShift = +d.timeShift || 0;
  return true;
}

function saveGame() {
  try {
    if (player && player.alive && !S.ko && S.zoneId && ZONES[S.zoneId]) save.loc = { zone: S.zoneId, x: Math.round(player.x), y: Math.round(player.y), face: +(player.face || 0).toFixed(2) };
    const txt = JSON.stringify(save);
    if (S.charId) {
      STORE.set(charKey(S.charId), txt);
      if (typeof netMarkDirty === "function") netMarkDirty(S.charId);
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

function jobReqMet(sv, j) {
  const r = JOB_REQ[j];
  return !!r && Object.keys(r).every(k => sv.jobs[k] && sv.jobs[k].lv >= r[k]);
}

function checkJobUnlocksIn(sv) {
  sv.jobsUnlocked = sv.jobsUnlocked || {};
  const got = [];
  let again = true;
  while (again) {
    again = false;
    for (const j in JOB_REQ) if (JOBS[j] && !sv.jobsUnlocked[j] && jobReqMet(sv, j)) { sv.jobsUnlocked[j] = true; got.push(j); again = true; }
  }
  return got;
}

function checkJobUnlocks() {
  const got = checkJobUnlocksIn(save);
  if (!got.length) return got;
  save.jobPopups = (save.jobPopups || []).concat(got);
  for (const j of got) log("You can now become " + (/^[AEIOU]/.test(JOBS[j].name) ? "an " : "a ") + JOBS[j].name + ". Change to it with Pip at your residence.", "npc");
  sfx("unlock");
  checkAchievements();
  saveGame();
  return got;
}

function jobProgressHint() {
  const locked = Object.keys(JOB_REQ).filter(j => JOBS[j] && !jobUnlocked(j));
  if (!locked.length) return "You have learned every trade I know. Nothing more to open.";
  let best = 99, started = false;
  for (const j of locked) {
    const r = JOB_REQ[j];
    const miss = Object.keys(r).reduce((a, k) => a + Math.max(0, r[k] - ((save.jobs[k] && save.jobs[k].lv) || 0)), 0);
    best = Math.min(best, miss);
    if (Object.keys(r).some(k => save.jobs[k] && save.jobs[k].lv >= r[k])) started = true;
  }
  if (best <= 3) return "You are nearly ready for something new. A little more work on the trades you know.";
  if (started) return "You have made a start on a few paths. Keep at it, and don't neglect the old trades.";
  return "Keep training the trades you know. One leans on another, and the next will open in time.";
}

function jobPopupTick() {
  if (!save.jobPopups || !save.jobPopups.length || typeof gameConfirm !== "function") return;
  if (typeof UI !== "undefined" && UI.confirmOpen) return;
  if (!calmNow()) return;
  const j = save.jobPopups[0];
  const done = () => { save.jobPopups.shift(); saveGame(); };
  if (!JOBS[j]) { done(); return; }
  gameConfirm("New job unlocked: " + JOBS[j].name + "!", (JOB_FLAVOUR[j] || "") + " Change jobs with Pip at your residence.", done, { yes: "Continue", noBtn: false, onNo: done, tag: "jobpop" });
}

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
  if (sp.kind === "heal" || sp.kind === "cleanse") return "healing";
  if (sp.kind === "warp") return "enhancing";
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
    if (it.wtype && slot === "main") { dmg = it.dmg; delay = it.delay; wtype = it.wtype; }
    if (it.stats) for (const k in it.stats) g[k] = (g[k] || 0) + it.stats[k];
    if (augs && augs[id]) for (const [k, v] of augs[id]) g[k] = (g[k] || 0) + v;
  }
  const rwp = ch.gear.ranged && ITEMS[ch.gear.ranged];
  if (rwp && rwp.wtype === "archery") {
    const amm = ch.gear.ammo && ITEMS[ch.gear.ammo];
    dmg = rwp.dmg + (amm && amm.dmg ? Math.round(amm.dmg * CONFIG.ammoDmgMul) : 0); delay = rwp.delay; wtype = "archery";
  }
  const fd = ch.kind === "pc" && typeof save !== "undefined" && save.food && foodLeft() > 0 && ITEMS[save.food.id] ? ITEMS[save.food.id].food : null;
  if (fd) for (const k in fd) g[k] = (g[k] || 0) + fd[k];
  for (const k of ATTRS) s[k] = Math.round(s[k] + g[k]);
  for (const el of RES_ELEMENTS) s["res_" + el] = g["res_" + el] || 0;
  s.chr = Math.round(6 + 0.65 * (lv - 1) + (ch.job === "BRD" ? 3 + 0.35 * (lv - 1) : 0) + (ch.sub === "BRD" ? 1 + 0.1 * subLv : 0) + (g.chr || 0));
  if (ch.job === "MNK" && wtype === "h2h") { dmg += 2 + Math.floor(lv * 0.5); delay = Math.max(1.6, delay * 0.8); }
  s.dmg = dmg;
  s.delay = delay;
  s.wtype = wtype;
  ch.stats = s;
  const wsk = skillOf(ch, wtype);
  const rc = ch.kind === "pc" && typeof save !== "undefined" && save.look ? RACES[save.look.race] || RACES.human : null;
  if (rc) for (const k in rc.attrs) s[k] = Math.max(1, Math.round(s[k] + rc.attrs[k] * (1 + lv / 20)));
  s.maxHp = Math.round((hp + g.hp + CONFIG.hpLvBonus * (lv - 1)) * (rc ? rc.hp : 1));
  s.maxMp = Math.round((mp * CONFIG.mpMul + g.mp) * (rc && mp > 0 ? rc.mp : 1) * (ch.kind === "pc" && mp > 0 ? 1 + buddyPerk("mp") : 1));
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
  if (ch.kind === "pc") ch.speed = CONFIG.runSpeed * (rc ? rc.speed : 1);
  ch.hp = ch.hp == null ? s.maxHp : Math.min(ch.hp, s.maxHp);
  ch.mp = ch.mp == null ? s.maxMp : Math.min(ch.mp, s.maxMp);
  ch.color = ch.mercId ? MERCS[ch.mercId].color : ch.pet ? (ch.color || "#4dd0e1") : JOBS[ch.job].color;
}

function makeChar(o) {
  return Object.assign({
    kind: "pc", hp: null, mp: null, tp: 0, x: 0, y: 0, px: 0, py: 0, radius: 14, speed: CONFIG.runSpeed, swingTimer: 2,
    engaged: false, target: null, attackTarget: null, alive: true, casting: null, recasts: {}, buffs: {},
    moving: false, flash: 0, stillSince: 0, regenerating: false, gear: {}, face: 0, lastSwing: -9, lastHit: -9, lastWS: -9
  }, o);
}

const RATE_ORDER = { A: 5, B: 4, C: 3, D: 2, E: 1 };
const AUTO_GEAR_CACHE = {};
function autoGear(job, lv, role) {
  const key = job + ":" + lv + ":" + (role || "");
  if (AUTO_GEAR_CACHE[key]) return AUTO_GEAR_CACHE[key];
  const rate = SKILL_RATINGS[job] || {};
  const pool = Object.keys(GEAR_DATA).filter(id => { const g = GEAR_DATA[id]; return g.src === "shop" && !g.hq && g.lv <= lv && (g.jobs === "ALL" || g.jobs.includes(job)); });
  const better = (a, b) => !b || GEAR_DATA[a].lv > GEAR_DATA[b].lv || (GEAR_DATA[a].lv === GEAR_DATA[b].lv && GEAR_DATA[a].price > GEAR_DATA[b].price);
  const best = slot => { let b = null; for (const id of pool) if (GEAR_DATA[id].slot === slot && better(id, b)) b = id; return b; };
  const out = {};
  let w = null, wr = -1;
  for (const id of pool) {
    const g = GEAR_DATA[id];
    if (g.slot !== "main" || !g.wtype || g.wtype === "instrument") continue;
    const r = RATE_ORDER[rate[g.wtype]] || 0;
    if (r > wr || (r === wr && better(id, w))) { w = id; wr = r; }
  }
  if (w) out.main = w;
  if (job === "RNG" || (rate.archery && RATE_ORDER[rate.archery] >= 4)) {
    let b = null;
    for (const id of pool) if (GEAR_DATA[id].slot === "ranged" && GEAR_DATA[id].wtype === "archery" && better(id, b)) b = id;
    if (b) out.ranged = b;
    let a = null;
    for (const id of pool) if (GEAR_DATA[id].slot === "ammo" && GEAR_DATA[id].dmg && better(id, a)) a = id;
    if (a && b) out.ammo = a;
  }
  for (const slot of ["head", "body", "hands", "legs", "feet"]) { const b = best(slot); if (b) out[slot] = b; }
  if (job === "PLD" || role === "tank") { const b = best("sub"); if (b) out.sub = b; }
  return AUTO_GEAR_CACHE[key] = out;
}

function mercGear(m, lv) {
  return autoGear(MERCS[m].job, lv, MERCS[m].role);
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
  for (const slot in own) if (ITEMS[own[slot]] && ITEMS[own[slot]].lv <= lv) g[slotKeys(ITEMS[own[slot]].slot)[0]] = own[slot];
  return g;
}

function mercUpgrade(id, itemId) {
  const why = mercCanWear(id, itemId);
  if (why) return false;
  const it = ITEMS[itemId], cur = mercGearFor(id, player.lv)[slotKeys(it.slot)[0]];
  return !cur || gearScore(itemId) > gearScore(cur);
}

function giveMercGear(id, itemId) {
  const why = mercCanWear(id, itemId);
  const nm = MERCS[id].name;
  if (why) { log(why, "sys"); sfx("error"); return why; }
  const it = ITEMS[itemId];
  if (!invCount(itemId)) return "You don't have that.";
  if (!mercUpgrade(id, itemId)) {
    const msg = nm + " says the " + it.name + " is no better than what they wear.";
    log(msg, "party"); sfx("error");
    return msg;
  }
  removeItem(itemId, 1);
  const own = save.mercGear[id] = save.mercGear[id] || {};
  const sk = slotKeys(it.slot)[0], eff = mercGearFor(id, player.lv)[sk];
  if (eff && !mercBagAdd(id, eff)) giveItem(eff, 1, true);
  own[sk] = itemId;
  log("You give " + an(it.name) + " to " + nm + ". They put it on and keep the old piece to sell.", "you");
  partySay(S.party.find(p => p.mercId === id), "gift", true);
  sfx("equip");
  syncAllies(false);
  saveGame();
  return "";
}

function mercSalePrice(itemId) { return Math.max(1, Math.round(marketPrice(itemId) * 1.5)); }

function buyFromMerc(id, idx) {
  const bag = mercBag(id), e = bag[idx];
  if (!e || !e.sale) return "They don't have that.";
  const it = ITEMS[e.id], price = mercSalePrice(e.id);
  if (save.gil < price) { log("You can't afford the " + it.name + " (" + price + " crystals).", "sys"); sfx("error"); return "Not enough crystals."; }
  if (it.rare && hasItem(e.id)) { log("You already possess " + an(it.name) + ".", "sys"); sfx("error"); return "Already owned."; }
  const stack = it.stack || 1;
  if (save.inventory.length >= CONFIG.inventorySize && !save.inventory.some(x => x.id === e.id && x.qty < stack)) { log("Your bag is full.", "sys"); sfx("error"); return "Bag full."; }
  save.gil -= price;
  giveItem(e.id, 1, true);
  e.qty--;
  if (e.qty <= 0) bag.splice(idx, 1);
  log("You buy " + an(it.name) + " from " + MERCS[id].name + " for " + price + " crystals.", "loot");
  sfx("coin");
  saveGame();
  return "";
}

function mercForSale(id) { return (save.mercInv && save.mercInv[id] || []).reduce((a, x) => a + (x.sale ? x.qty : 0), 0); }

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
    if (m) { log(MERCS[id].name + ": " + (MERC_PERSONAL[id] || MERC_PERSONAL_GEN)[after - 1], "party"); buildStats(m); }
    sfx("unlock");
    uiEvent("bond", { id, lv: after });
  }
}

function mercFee(id, lv) {
  const m = MERCS[id];
  if (!m) return 0;
  if (!m.gen) return m.fee;
  lv = lv || player.lv;
  const mul = { tank: 1.1, healer: 1.15, burster: 1.2, bard: 1.15, hybrid: 1.1 }[m.role] || 1;
  return Math.round((40 + 18 * lv) * mul / 5) * 5;
}

function gearScore(id) {
  const it = ITEMS[id];
  if (!it) return -1;
  return (it.lv || 0) * 1000 + (it.dmg || 0) + Object.values(it.stats || {}).reduce((a, b) => a + b, 0);
}

function mercSync(id, lv) {
  const own = save.mercGear[id] = save.mercGear[id] || {}, bag = mercBag(id), nm = MERCS[id] ? MERCS[id].name : id;
  let changed = false;
  for (const sk of Object.keys(own)) {
    const it = ITEMS[own[sk]];
    if (!it) { delete own[sk]; continue; }
    if ((it.lv || 0) <= lv) continue;
    bag.push({ id: own[sk], qty: 1, sale: false });
    log(nm + " puts away the " + it.name + " until they can wear it again.", "party");
    delete own[sk];
    changed = true;
  }
  const kept = bag.filter(x => !x.sale && ITEMS[x.id] && (ITEMS[x.id].lv || 0) <= lv).sort((a, b) => gearScore(b.id) - gearScore(a.id));
  for (const k of kept) {
    const it = ITEMS[k.id], sk = slotKeys(it.slot)[0], cur = mercGearFor(id, lv)[sk];
    bag.splice(bag.indexOf(k), 1);
    if (!it.jobs.includes(MERCS[id].job) || (cur && gearScore(cur) >= gearScore(k.id))) { bag.push({ id: k.id, qty: 1, sale: true }); continue; }
    if (own[sk]) bag.push({ id: own[sk], qty: 1, sale: true });
    own[sk] = k.id;
    log(nm + " puts the " + it.name + " back on.", "party");
    changed = true;
  }
  return changed;
}

function mercLevelBase(id, lv) {
  const m = MERCS[id], hl = (save.mercHireLv && save.mercHireLv[id]) || lv;
  if (m.gen) return mercFee(id, lv);
  return m.fee * lv / Math.max(1, hl);
}

function mercGearAdd(id, lv) {
  const own = save.mercGear[id] || {}, m = MERCS[id], plain = autoGear(m.job, lv, m.role);
  let add = 0;
  for (const sk in own) {
    const it = ITEMS[own[sk]];
    if (!it || (it.lv || 0) > lv) continue;
    const pl = ITEMS[plain[sk]], plv = pl ? pl.lv || 0 : it.lv || 0;
    add += COMPANION_CFG.gearWage * Math.max(1, (it.lv || 0) - plv) + (it.hq ? COMPANION_CFG.hqWage : 0);
  }
  return add;
}

function mercWage(id, lv) {
  lv = lv || player.lv;
  return Math.max(10, Math.ceil(mercLevelBase(id, lv) * COMPANION_CFG.wageRate * (1 + mercGearAdd(id, lv))));
}

function mercContract(id) {
  save.mercContract = save.mercContract || {};
  if (!save.mercContract[id]) save.mercContract[id] = { endSec: (save.playSec || 0) + COMPANION_CFG.contractSec };
  return save.mercContract[id];
}

function mercContractLeft(id) { return Math.max(0, mercContract(id).endSec - (save.playSec || 0)); }

function migrateMercContracts() {
  if (save.mercPaid && Object.keys(save.mercPaid).length) save.mercPaid = {};
  for (const id of save.hired) mercContract(id);
}

function mercPayReady() { return calmNow(); }

function calmNow() {
  return player.alive && !partyInCombat() && !S.exitWalk && !S.walkIn && !S.modal && !S.dialog && !S.zoneCooldown && !player.synth && !zoneLoadingOn();
}

function zoneLoadingOn() {
  const el = typeof document !== "undefined" && document.getElementById ? document.getElementById("loading") : null;
  return !!(el && el.classList && typeof el.classList.contains === "function" && el.classList.contains("on"));
}

function mercPayDue() {
  for (const id of save.hired) if (MERCS[id] && mercContractLeft(id) <= 0) return id;
  return null;
}

function mercPay(id, pay) {
  if (!save.hired.includes(id)) return "";
  const w = mercWage(id), nm = MERCS[id].name;
  if (pay && save.gil >= w) {
    save.gil -= w;
    const c = mercContract(id);
    c.endSec = Math.max(c.endSec, save.playSec || 0) + COMPANION_CFG.contractSec;
    log("You pay " + nm + " " + w + " crystals for another hour.", "sys");
    sfx("coin");
    saveGame();
    return "";
  }
  log(pay ? "You can't pay " + nm + ". " + nm + " heads back to the Mercenary Hall." : nm + " goes unpaid and heads back to the Mercenary Hall.", "foe");
  mercLeave(id);
  sfx("error");
  return pay ? "Not enough crystals." : "Refused.";
}

function mercLeave(id) {
  const m = MERCS[id];
  save.oldFriends = save.oldFriends || {};
  save.oldFriends[id] = { left: save.playSec || 0, hall: "outpost", lv: player.lv, fee: m.fee };
  const ofKeys = Object.keys(save.oldFriends);
  while (ofKeys.length > COMPANION_CFG.oldFriendsMax) {
    const oldest = ofKeys.reduce((a, k) => save.oldFriends[k].left < save.oldFriends[a].left ? k : a, ofKeys[0]);
    ofKeys.splice(ofKeys.indexOf(oldest), 1);
    delete save.oldFriends[oldest];
    if (save.mercDefs[oldest] && !(save.mercDay && save.mercDay.ids.includes(oldest))) { delete save.mercDefs[oldest]; delete MERCS[oldest]; }
  }
  const i = save.hired.indexOf(id);
  if (i >= 0) save.hired.splice(i, 1);
  if (save.mercContract) delete save.mercContract[id];
  if (save.mercBodies) delete save.mercBodies[id];
  if (save.mercDown) delete save.mercDown[id];
  rebuildParty();
  saveGame();
}

function mercBribe(id) {
  const of = save.oldFriends && save.oldFriends[id];
  if (!of) return 0;
  return (of.fee || MERCS[id].fee) + COMPANION_CFG.bribePerLv * player.lv;
}

function rehireFriend(id) {
  const of = save.oldFriends && save.oldFriends[id], m = MERCS[id];
  if (!of || !m) return "They aren't here.";
  if (save.hired.length >= CONFIG.maxParty - 1) { log("Your party is full. Dismiss someone first.", "sys"); sfx("error"); return "Party full."; }
  const b = mercBribe(id);
  if (save.gil < b) { log(m.name + " won't come back for less than " + b + " crystals.", "sys"); sfx("error"); return "Not enough crystals."; }
  save.gil -= b;
  delete save.oldFriends[id];
  save.mercHireLv = save.mercHireLv || {};
  save.mercHireLv[id] = player.lv;
  if (m.gen) m.fee = mercFee(id);
  save.hired.push(id);
  save.mercContract = save.mercContract || {};
  save.mercContract[id] = { endSec: (save.playSec || 0) + COMPANION_CFG.contractSec };
  save.mercWageSeen = save.mercWageSeen || {};
  save.mercWageSeen[id] = mercWage(id);
  rebuildParty();
  log(m.name + " takes your " + b + " crystals and rejoins you.", "loot");
  partySay(S.party.find(p => p.mercId === id), "hire", true);
  sfx("unlock");
  saveGame();
  return "";
}

function tickWages() {
  mercDefsSync();
  migrateMercContracts();
  save.mercWageSeen = save.mercWageSeen || {};
  for (const id of save.hired) {
    if (!MERCS[id]) continue;
    const w = mercWage(id), was = save.mercWageSeen[id];
    if (was && w > was) log(MERCS[id].name + ": My rate is going up to " + w + " crystals an hour.", "party");
    save.mercWageSeen[id] = w;
  }
  const id = mercPayDue();
  if (!id || !mercPayReady()) return;
  if (S.time < (S.mercAskAt || 0)) return;
  S.mercAskAt = S.time + 20;
  if (typeof mercPayPrompt === "function") mercPayPrompt(id);
  else mercPay(id, true);
}

function summonPet(a, sp) {
  if (a !== player) return;
  if (S.pet) releasePet(null);
  const P = PETS[sp.pet];
  const pet = makeChar({ kind: "ally", pet: true, petKey: sp.pet, name: P.name, job: "MNK", sub: null, role: "pet", speed: CONFIG.runSpeed * 1.15, lv: player.lv });
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

function activateAutomaton(a) {
  if (a !== player) return;
  if (S.pet) releasePet(null);
  const pet = makeChar({ kind: "ally", pet: true, automaton: true, petKey: "automaton", name: "Automaton", job: "WAR", sub: null, role: "pet", speed: CONFIG.runSpeed * 1.15, lv: player.lv });
  pet.gear = {};
  pet.x = player.x + Math.cos(player.face) * 30; pet.y = player.y + Math.sin(player.face) * 30;
  pet.px = pet.x; pet.py = pet.y;
  buildStats(pet);
  pet.color = "#ab47bc";
  S.pet = pet;
  S.party.push(pet);
  log("You wind the key, and your automaton clicks to life!", "you");
  popText(pet, "Automaton", pet.color, 13, 1.2, 14);
  vfx("buff", { tgt: pet, id: "activate" });
  sfx("equip", pet);
}
function castGeo(a, t, sp, id) {
  const g = GEO_AURAS[id];
  if (g.self) { a.indi = { id, until: S.time + 180 }; log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". " + (a === player ? "An aura settles around you." : "An aura settles around them."), cls(a)); }
  else { a.luopan = { id, x: t.x, y: t.y, until: S.time + 180, mp: sp.mp }; log(subj(a) + " " + vb(a, "plant") + " a luopan: " + sp.name + ".", cls(a)); if (isMob(t)) aggro(t, a); }
  popText(a, sp.name, "#" + g.col.toString(16).padStart(6, "0"), 13, 1.2, 14);
  sfx("buff", a); vfx("buff", { tgt: a, id });
}
function tickGeo(dt) {
  S.geoT = (S.geoT || 0) + dt;
  if (S.geoT < 1) return;
  S.geoT = 0;
  S.geoBeat = ((S.geoBeat || 0) + 1) % 3;
  for (const c of S.party) {
    if (c.indi) {
      if (S.time > c.indi.until || !c.alive) c.indi = null;
      else { const g = GEO_AURAS[c.indi.id]; for (const p of S.party) if (p.alive && dist(p, c) < 300) { p.buffs[g.buff] = { until: S.time + 2.5 }; if (g.buff === "geo_vigor" && S.geoBeat === 0 && p.hp < p.maxHp) { const h = Math.min(p.maxHp - p.hp, Math.max(2, Math.round(p.maxHp * 0.03))); p.hp += h; } } }
    }
    if (c.luopan) {
      if (S.time > c.luopan.until || !c.alive) c.luopan = null;
      else { const g = GEO_AURAS[c.luopan.id]; for (const m of S.mobs) if (m.alive && Math.hypot(m.x - c.luopan.x, m.y - c.luopan.y) < 140) m.buffs[g.buff] = { until: S.time + 2.5 }; }
    }
  }
}
function artsMatch(a, sp) {
  const white = sp.kind === "heal" || sp.kind === "buff" || sp.kind === "dot" || sp.kind === "cleanse";
  const black = sp.kind === "nuke" || sp.kind === "debuff" || sp.kind === "drain" || sp.kind === "aspir";
  return (a.buffs.light_arts && white) || (a.buffs.dark_arts && black);
}
function callBeast(a) {
  if (a !== player) return;
  if (S.pet) releasePet(null);
  const B = BEASTS.filter(b => player.lv >= b.lv).pop() || BEASTS[0];
  const pet = makeChar({ kind: "ally", pet: true, beast: B.fam, petKey: "beast_" + B.fam, name: B.name, job: "WAR", sub: null, role: "pet", speed: CONFIG.runSpeed * 1.15, lv: player.lv });
  pet.gear = {};
  pet.fam = FAMILIES[B.fam];
  pet.x = player.x + Math.cos(player.face) * 30; pet.y = player.y + Math.sin(player.face) * 30;
  pet.px = pet.x; pet.py = pet.y;
  buildStats(pet);
  pet.color = "#8d6e63";
  S.pet = pet;
  S.party.push(pet);
  S.petTick = S.time + 3;
  log("You whistle, and a " + B.name + " bounds to your side!", "you");
  popText(pet, B.name, pet.color, 13, 1.2, 14);
  vfx("mount", { tgt: pet });
  sfx("mount", pet);
}
function rollDice(a, kind, add) {
  const prev = a.lastRoll && a.lastRoll.kind === kind && S.time - a.lastRoll.at < 180 ? a.lastRoll.total : 0;
  const die = randInt(1, 6), total = add ? prev + die : die;
  const name = kind === "valor_roll" ? "Valor Roll" : "Hawk Roll";
  if (total > 7) {
    for (const p of S.party) if (p.buffs[kind]) delete p.buffs[kind];
    a.lastRoll = null;
    log(subj(a) + " " + vb(a, "roll") + " a " + die + " for " + total + ". Bust! " + name + " is lost.", cls(a));
    popText(a, "Bust!", "#c62828", 15, 1.2, 14);
    sfx("error", a);
    return;
  }
  const lucky = kind === "valor_roll" ? 5 : 4;
  const pow = (kind === "valor_roll" ? [0, 4, 5, 6, 7, 14, 9, 16] : [0, 3, 4, 5, 10, 6, 7, 12])[total];
  for (const p of S.party) if (p.alive && dist(p, a) < 300) { p.buffs[kind] = { until: S.time + 180, pow }; ring(p, "#ffd54f", 24, 0.5); }
  a.lastRoll = { kind, total, at: S.time };
  log(subj(a) + " " + vb(a, "roll") + (add ? " again: a " + die + ", total " + total : " a " + total) + (total === lucky ? ". Lucky!" : ".") + " " + name + ": " + (kind === "valor_roll" ? "attack +" + pow + "%" : "accuracy +" + pow) + " for the party.", cls(a));
  popText(a, "🎲 " + total + (total === lucky ? " Lucky!" : ""), "#ffd54f", 16, 1.3, 14);
  sfx("coin", a);
}
function blueLearnFrom(m, mv) {
  if (player.job !== "BLU" || !player.alive || dist(m, player) > 400) return;
  const id = BLUE_LEARN[mv.name];
  if (!id || save.spells.includes(id) || SPELLS[id].jobs.BLU > player.lv) return;
  if (Math.random() > 0.5) return;
  save.spells.push(id);
  log("You watch the " + m.name + "'s " + mv.name + " closely... and learn it! New blue magic: " + SPELLS[id].name + ".", "loot");
  popText(player, "Learned " + SPELLS[id].name, "#42a5f5", 14, 1.4, 14);
  sfx("unlock");
  saveGame();
}
function castBluePhys(a, t, sp) {
  let dmg = Math.max(1, Math.floor(baseDmg(a, t) * pDIF(a, t) * sp.mul * (1 + skillOf(a, "blue") * 0.004)));
  if (a.buffs.burst_affinity) { dmg = Math.floor(dmg * 1.5); delete a.buffs.burst_affinity; }
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " takes " + dmg + " damage.", cls(a));
  sfx("crit", t); vfx("hit", { src: a, tgt: t, crit: true, slash: false });
  applyDamage(a, t, dmg, { color: "#42a5f5", size: 20, enmity: 60 + dmg });
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
  if (pet.automaton) { if (!pet.alive || player.job !== "PUP" || !player.alive) releasePet(pet.alive ? "Your automaton winds down." : "Your automaton breaks down."); return; }
  if (pet.beast) { if (!pet.alive || player.job !== "BST" || !player.alive) releasePet(pet.alive ? "Your " + pet.name + " wanders back into the wild." : "Your " + pet.name + " is too hurt to go on."); return; }
  if (!pet.alive || player.job !== "SMN" || !player.alive) { releasePet("Your " + pet.name + " fades away."); return; }
  if (S.time >= S.petTick) {
    S.petTick = S.time + 3;
    const cost = 1 + Math.floor(player.lv / 6);
    if (player.mp < cost) { releasePet("You run out of MP and your " + pet.name + " fades away."); return; }
    player.mp -= cost;
  }
}

function makeMerc(id) {
  return makeChar({ kind: "ally", mercId: id, name: MERCS[id].name, job: MERCS[id].job, sub: null, role: MERCS[id].role, speed: CONFIG.runSpeed * 1.08, nextNuke: 0 });
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
    mercSync(a.mercId, a.lv);
    a.gear = mercGearFor(a.mercId, a.lv);
    a.hp = null; a.mp = null;
    buildStats(a);
    if (!full && a.alive && hpPct > 0) { a.hp = Math.max(1, Math.round(a.maxHp * hpPct)); a.mp = Math.round(a.maxMp * mpPct); }
    if (!a.alive) a.hp = 0;
  }
}

const MERC_ROLES = { WAR: ["tank", "dd"], WHM: ["healer", "support"], BLM: ["nuker", "burster"], PLD: ["tank"], RDM: ["hybrid"], THF: ["dd"], RNG: ["dd"], DRK: ["dd"], BRD: ["bard"], MNK: ["dd"], SAM: ["dd"], NIN: ["tank", "dd"], DRG: ["dd"], BST: ["dd"], BLU: ["dd"], COR: ["dd"], PUP: ["dd"], DNC: ["dd"], SCH: ["hybrid"], GEO: ["hybrid"], RUN: ["tank"] };
const MERC_ROLE_TEXT = { tank: "Holds enemy attention and keeps them off you.", dd: "Deals steady damage and works skillchains.", healer: "Keeps the party alive with cures.", support: "Backs up the healer and weakens foes.", nuker: "Blasts enemies with elemental magic.", burster: "Saves MP to magic-burst your skillchains.", hybrid: "Fights in melee, debuffs and heals in a pinch.", bard: "Keeps songs on the party and lulls extra foes." };
const MERC_SYL = [["Al", "Bre", "Cas", "Da", "El", "Fa", "Gor", "Hal", "Is", "Jo", "Ka", "Lo", "Mar", "Ne", "Or", "Pe", "Quin", "Ro", "Sa", "Tor", "Ul", "Va", "Wy", "Ys", "Zan"], ["ra", "en", "ric", "li", "dor", "mi", "wen", "so", "thar", "ny", "vel", "ris", "do", "ka", "len", "bry", "ti", "mon"], ["", "", "n", "s", "a", "el", "or", "is", "e"]];
const MERC_TRAITS = ["Quiet but dependable.", "Talks too much in a fight.", "Fresh from the frontier.", "A veteran of the Hollow wars.", "Saving up for a farm.", "Never misses breakfast.", "Owes Brann a favour.", "Hums while working.", "Keeps a lucky charm.", "Wants a story worth telling."];
function mercDayNum() { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); }
function mercDefsSync() {
  if (!save.mercDefs) save.mercDefs = {};
  for (const id in save.mercDefs) MERCS[id] = save.mercDefs[id];
}
function genMercDef(rnd, id) {
  const jobs = Object.keys(MERC_ROLES).filter(j => JOBS[j] && jobUnlocked(j));
  if (!jobs.length) jobs.push("WAR");
  const job = jobs[Math.floor(rnd() * jobs.length)], roles = MERC_ROLES[job], role = roles[Math.floor(rnd() * roles.length)];
  const s = MERC_SYL, nm = s[0][Math.floor(rnd() * s[0].length)] + s[1][Math.floor(rnd() * s[1].length)] + s[2][Math.floor(rnd() * s[2].length)];
  const lv = player.lv, mul = { tank: 1.1, healer: 1.15, burster: 1.2, bard: 1.15, hybrid: 1.1 }[role] || 1;
  const hue = Math.floor(rnd() * 360);
  return { gen: true, name: nm, job, role, fee: Math.round((40 + 18 * lv) * mul / 5) * 5, color: "hsl(" + hue + ",60%,72%)", look: { build: rnd() < 0.5 ? 0 : 1, hairStyle: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10][Math.floor(rnd() * 10)], hairColor: Math.floor(rnd() * 8), face: Math.floor(rnd() * 8) }, desc: "A " + JOBS[job].name + ". " + MERC_ROLE_TEXT[role] + " " + MERC_TRAITS[Math.floor(rnd() * MERC_TRAITS.length)] };
}
function mercPool(dayOverride) {
  mercDefsSync();
  const day = dayOverride != null ? dayOverride : mercDayNum();
  if (!save.mercDay || save.mercDay.day !== day) {
    for (const id of (save.mercDay && save.mercDay.ids) || []) if (!save.hired.includes(id) && !(save.oldFriends && save.oldFriends[id])) { delete save.mercDefs[id]; delete MERCS[id]; }
    const rnd = seeded(hashStr(String(save.created || 1) + ":merc:" + day));
    const ids = [];
    for (let i = 0; i < CONFIG.mercDaily; i++) { let id = "m" + day + "_" + i; while (save.mercDefs[id]) id += "x"; save.mercDefs[id] = genMercDef(rnd, id); MERCS[id] = save.mercDefs[id]; ids.push(id); }
    save.mercDay = { day, ids };
  }
  return save.mercDay.ids.filter(id => MERCS[id] && !save.mercFallen[id] && (save.hired.includes(id) || jobUnlocked(MERCS[id].job)));
}
function mercFallTick() {
  for (const p of S.party) if (p.mercId && p.fallAt && S.time >= p.fallAt) {
    const id = p.mercId, nm = MERCS[id] ? MERCS[id].name : p.name;
    p.fallAt = 0;
    save.mercFallen[id] = Date.now();
    const i = save.hired.indexOf(id);
    if (i >= 0) save.hired.splice(i, 1);
    if (save.mercContract) delete save.mercContract[id];
    if (save.mercDefs[id] && !(save.mercDay && save.mercDay.ids.includes(id))) delete save.mercDefs[id];
    log(nm + " has fallen and will not be coming back.", "foe");
    rebuildParty();
    saveGame();
    return;
  }
}
function rebuildParty() {
  mercDefsSync();
  const old = S.party;
  S.party = [player];
  if (S.pet) S.party.push(S.pet);
  save.hired.forEach((id, i) => {
    const body = save.mercBodies && save.mercBodies[id];
    if (body && body.zone !== S.zoneId) return;
    let m = old.find(p => p.mercId === id);
    if (!m) {
      m = makeMerc(id);
      m.lv = player.lv;
      mercSync(id, m.lv);
      m.gear = mercGearFor(id, m.lv);
      buildStats(m);
      const o = followOffset(i + 1);
      m.x = player.x + o.x; m.y = player.y + o.y; m.px = m.x; m.py = m.y;
      m.mounted = !!player.mounted;
      if (body) { m.x = body.x; m.y = body.y; m.px = m.x; m.py = m.y; m.alive = false; m.hp = 0; m.koUntil = body.until; m.mounted = false; }
    }
    S.party.push(m);
  });
  uiPartyChanged();
}

function mercAvailable(id) {
  if (!MERCS[id] || (save.mercFallen && save.mercFallen[id])) return false;
  if (!JOBS[MERCS[id].job] || !jobUnlocked(MERCS[id].job)) return false;
  if (MERCS[id].gen) return true;
  const r = MERCS[id].requires;
  if (r && r.quest && save.quests[r.quest] !== "done") return false;
  if (r && r.job && !jobUnlocked(r.job)) return false;
  return true;
}

function mercLockedReason(id) {
  const r = MERCS[id].requires || {};
  if (r.job || !jobUnlocked(MERCS[id].job)) return "Unlocks as you learn more jobs";
  if (r.quest) return "Unlocks after " + QUESTS[r.quest].name;
  return "";
}

function hireMerc(id) {
  const m = MERCS[id];
  if (!mercAvailable(id) || save.hired.includes(id)) return;
  if (save.hired.length >= CONFIG.maxParty - 1) { log("Your party is full. Dismiss someone first.", "sys"); sfx("error"); return; }
  const fee = mercFee(id);
  if (save.gil < fee) { log("You can't afford " + m.name + "'s fee (" + fee + " crystals).", "sys"); sfx("error"); return; }
  save.gil -= fee;
  if (m.gen) m.fee = fee;
  save.mercHireLv = save.mercHireLv || {};
  save.mercHireLv[id] = player.lv;
  save.hired.push(id);
  save.mercContract = save.mercContract || {};
  save.mercContract[id] = { endSec: (save.playSec || 0) + COMPANION_CFG.contractSec };
  save.mercWageSeen = save.mercWageSeen || {};
  if (save.oldFriends) delete save.oldFriends[id];
  rebuildParty();
  save.mercWageSeen[id] = mercWage(id);
  log("You hire " + m.name + " at level " + player.lv + " for " + fee + " crystals.", "loot");
  partySay(S.party.find(p => p.mercId === id), "hire", true);
  sfx("unlock");
  saveGame();
}

function dismissMerc(id, quiet) {
  const i = save.hired.indexOf(id);
  if (i < 0) return;
  save.hired.splice(i, 1);
  if (save.mercContract) delete save.mercContract[id];
  if (save.mercBodies) delete save.mercBodies[id];
  if (save.mercDown) delete save.mercDown[id];
  rebuildParty();
  if (!quiet) log(MERCS[id].name + " leaves the party.", "sys");
  if (MERCS[id].gen && !(save.mercDay && save.mercDay.ids.includes(id))) delete save.mercDefs[id];
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

function arrivalSpot(i, x, y, face) {
  const k = Math.ceil(i / 2), side = i % 2 ? 1 : -1, d = CONFIG.arriveGap + 24 * k, z = S.zone;
  let a = face + Math.PI + side * 0.45, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
  if (px < 50 || py < 50 || px > z.w - 50 || py > z.h - 50) { a = face + side * 0.45; px = x + Math.cos(a) * d; py = y + Math.sin(a) * d; }
  return { x: px, y: py };
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

function mobCurve(L) {
  const c = CONFIG.mobCurve, ls = c.lv, o = {};
  for (const k of ["hp", "att", "dmg"]) {
    const v = c[k];
    if (L <= ls[0]) { o[k] = v[0]; continue; }
    if (L >= ls[ls.length - 1]) { o[k] = v[v.length - 1]; continue; }
    let i = 0; while (L > ls[i + 1]) i++;
    const t = (L - ls[i]) / (ls[i + 1] - ls[i]);
    o[k] = v[i] + (v[i + 1] - v[i]) * t;
  }
  return o;
}

function buildMob(famKey, L, x, y, spawnIdx) {
  const f = famOf(famKey);
  const st = { str: 6 + 0.9 * L, dex: 6 + 0.8 * L, vit: 6 + 0.8 * L, agi: 6 + 0.8 * L, int: (f.int || 6) + 0.7 * L, mnd: 6 + 0.7 * L };
  for (const k of ATTRS) st[k] = Math.round(st[k]);
  const easy = f.nm || f.boss || L > 6 ? 1 : 0.55 + 0.075 * (L - 1), easyA = f.nm || f.boss || L > 6 ? 1 : 0.75 + 0.05 * (L - 1);
  const cv = mobCurve(L);
  st.maxHp = Math.round((70 + 40 * L) * f.hpMul * easy * cv.hp);
  st.att = Math.round((16 + 5.5 * L) * f.attMul * easyA * cv.att);
  st.def = Math.round((10 + 4.5 * L) * f.defMul);
  st.acc = Math.round(62 + 4 * L);
  st.eva = Math.round((48 + 3.5 * L + (f.eva || 0)) * (easy < 1 ? 0.8 : 1));
  st.dmg = (6 + 1.25 * L) * easyA * cv.dmg;
  st.delay = f.delay;
  return {
    id: ++S.mobSeq, kind: "mob", famKey, fam: f, name: f.name, lv: L, stats: st, aggro: f.aggro, passive: !f.aggro, hp: st.maxHp, maxHp: st.maxHp, mp: 0, maxMp: 0, tp: 0,
    x, y, px: x, py: y, home: { x, y }, radius: Math.round(f.radius * (f.scale || 1)), color: f.color, speed: f.speed * CONFIG.mobSpeedMul, delay: f.delay, swingTimer: f.delay,
    state: "idle", enmity: new Map(), face: Math.random() * Math.PI * 2, alive: true, buffs: {}, chain: null, burst: null,
    spawnIdx, wanderTimer: 0, wanderDir: { x: 0, y: 0 }, readying: null, flash: 0, casting: null, recasts: {}, deadAt: 0, target: null, moving: false,
    lastSwing: -9, lastHit: -9, lastWS: -9
  };
}

function stat(e, k) {
  let v = e.stats[k];
  const b = e.buffs;
  if (b.weakened && (k === "att" || k === "def" || k === "acc")) v *= 0.85;
  if (k === "att" && b.berserk) v *= 1.25;
  if (k === "att" && b.warcry) v *= 1.2;
  if (k === "att" && b.last_resort) v *= 1.25;
  if (k === "def" && b.last_resort) v *= 0.85;
  if (k === "att" && b.minuet) v = b.minuet.flat ? v + b.minuet.pow : v * (1 + b.minuet.pow);
  if (k === "def" && b.minne) v += b.minne.pow;
  if (k === "att" && b.blight) v *= 0.9;
  if (k === "acc" && b.madrigal) v += b.madrigal.pow;
  if (k === "eva" && b.mambo) v += b.mambo.pow;
  if (k === "acc" && b.rasp) v -= b.rasp.sd;
  if (k === "def" && b.choke) v -= b.choke.sd;
  if (k === "def" && b.berserk) v *= 0.75;
  if (k === "def" && b.dia) v *= 0.9;
  if (k === "def" && b.sentinel) v *= 1.5;
  if (k === "def" && b.protect) v = b.protect.pow > 1 ? v + b.protect.pow : v * 1.15;
  if (k === "acc" && b.flash) v *= 1 - (b.flash.pow != null ? b.flash.pow : 0.4);
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
  if (!e || !e.alive || !isSide(e) || !m.alive) return;
  if (e.buffs && e.buffs.sentinel) amt *= 2;
  if (m.proxy) { if (isParty(e)) netMobEnmity(m, amt); return; }
  m.enmity.set(e, (m.enmity.get(e) || 0) + amt);
}

function swingDelay(e) { return e.delay * (e.buffs && e.buffs.slow ? 1 + (e.buffs.slow.pow != null ? e.buffs.slow.pow : 0.25) : 1) * (e.buffs && e.buffs.march ? 1 - e.buffs.march.pow : 1); }

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
  if (!m.alive || !t || !t.alive || !isSide(t)) return;
  if (m.proxy) { if (isParty(t)) netMobEnmity(m, 1); return; }
  if (!m.claim) m.claim = claimId(t);
  if (!m.enmity.has(t)) m.enmity.set(t, 1);
  if (m.state === "combat") return;
  m.state = "combat";
  m.swingTimer = Math.max(m.swingTimer, 1.2);
  log("The " + m.name + " notices " + obj(t) + "!", "foe");
  popText(m, "!", "#ff5252", 22, 0.8);
  sfx("aggro", m);
  mobVoice(m, "aggro");
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
  if (isMob(tgt) && src && isParty(src) && !claimOk(tgt)) return;
  if (src === player && tgt !== player) { save.stats.dmgDealt += amt; if (amt > save.stats.bigHit) save.stats.bigHit = amt; }
  if (tgt === player) save.stats.dmgTaken += amt;
  if (opt.el && tgt.buffs && tgt.buffs.shell && !isMob(tgt)) amt = Math.max(0, Math.round(amt * (1 - tgt.buffs.shell.pow)));
  if (opt.el && BAR_EL[opt.el] && tgt.buffs && tgt.buffs[BAR_EL[opt.el]] && !isMob(tgt)) amt = Math.max(0, Math.round(amt * (1 - tgt.buffs[BAR_EL[opt.el]].pow)));
  if (opt.el && !isMob(tgt) && tgt.stats && tgt.stats["res_" + opt.el]) amt = Math.max(0, Math.round(amt * (1 - Math.min(0.5, tgt.stats["res_" + opt.el] / 100))));
  if (tgt.buffs && !isMob(tgt) && src && isMob(src)) {
    if (tgt.buffs.runes && tgt.buffs.runes.list) amt = Math.round(amt * (1 - 0.05 * tgt.buffs.runes.list.length));
    if (tgt.buffs.vallation) amt = Math.round(amt * 0.8);
  }
  if (isMob(tgt) && tgt.buffs && tgt.buffs.geo_frail) amt = Math.round(amt * 1.12);
  if (tgt.proxy) {
    netMobHit(tgt, amt, opt.enmity != null ? opt.enmity : 40 + amt * 2);
    tgt.flash = 0.15;
    tgt.lastHit = S.time;
    if (src && src !== tgt) tgt.lastHitAng = Math.atan2(src.y - tgt.y, src.x - tgt.x);
    if (opt.pop !== false) popText(tgt, opt.text != null ? opt.text : amt, opt.color || DMG_RED, (opt.size || 16) + 6, opt.life || 1.25, opt.yOff, opt.text == null);
    return;
  }
  tgt.hp = Math.max(0, tgt.hp - amt);
  if (isMob(tgt) && amt > 0 && tgt.hp > 0 && Math.random() < 0.22) mobVoice(tgt, "hurt");
  tgt.flash = 0.15;
  tgt.lastHit = S.time;
  if (src && src !== tgt) tgt.lastHitAng = Math.atan2(src.y - tgt.y, src.x - tgt.x);
  if (opt.pop !== false) popText(tgt, opt.text != null ? opt.text : amt, opt.color || (isMob(tgt) ? DMG_RED : "#ff5a48"), (opt.size || 16) + 6, opt.life || 1.25, opt.yOff, opt.text == null);
  if (isMob(tgt)) {
    if (src && isSide(src)) {
      if (!tgt.claim) tgt.claim = claimId(src);
      addEnmity(tgt, src, opt.enmity != null ? opt.enmity : 40 + amt * 2);
      aggro(tgt, src);
    }
  } else {
    touch(tgt);
    if (amt > 0 && tgt.resting && src && isMob(src)) standUp(tgt, tgt !== player);
    if (tgt.mounted) dismount("You're thrown from the saddle!");
    if (tgt.casting && Math.random() < CONFIG.interruptChance) { if (tgt.buffs.aquaveil) { tgt.buffs.aquaveil.n--; popText(tgt, "Aquaveil", "#4fc3f7", 12, 0.9, 12); if (tgt.buffs.aquaveil.n <= 0) delete tgt.buffs.aquaveil; } else interruptCast(tgt); }
  }
  if (isMob(tgt) && tgt.casting && amt > 0 && Math.random() < 0.3) interruptCast(tgt);
  if (tgt.buffs && tgt.buffs.sleep && amt > 0) { delete tgt.buffs.sleep; if (isMob(tgt)) log("The " + tgt.name + " wakes up!", "sys"); }
  if (tgt.hp <= 0) onKO(tgt, src);
}

function mobReach(m) { return isMob(m) && m.fam.range ? m.fam.range : CONFIG.meleeRange; }

function swingSound(a) {
  if (isMob(a)) { const h = ["goblin", "chieftain", "orc", "skeleton", "ghoul", "fishfolk", "birdfolk", "treant"].includes(a.fam.model); return h ? (a.fam.model === "orc" || a.fam.model === "treant" || (a.fam.scale || 1) >= 1.3 ? "swing_heavy" : "swing_light") : "swing_claw"; }
  const w = a.gear && a.gear.main && ITEMS[a.gear.main] ? ITEMS[a.gear.main].wtype : null;
  return ["greataxe", "scythe", "gkatana", "gsword", "club", "staff", "polearm", "axe"].includes(w) ? "swing_heavy" : "swing_light";
}
function swing(a, d) {
  const tpGain = Math.round(CONFIG.tpPerDelay * a.delay);
  a.lastSwing = S.time;
  sfx(swingSound(a), a);
  if (a.buffs && a.buffs.paralyze && Math.random() < (a.buffs.paralyze.pow != null ? a.buffs.paralyze.pow : 0.25)) {
    log(subj(a) + " " + vb(a, "are", "is") + " paralyzed.", cls(a));
    popText(a, "Paralyzed", "#b3e5fc", 13, 0.9, 10);
    return;
  }
  if (d.buffs && (d.buffs.third_eye || d.buffs.shadows) && !isMob(d) && !(isMob(a) && a.fam.range)) {
    if (d.buffs.third_eye) { delete d.buffs.third_eye; log(subj(d) + " " + vb(d, "anticipate", "anticipates") + " the attack and " + vb(d, "step", "steps") + " aside.", cls(d)); popText(d, "Third Eye", "#e0a060", 13, 0.9); }
    else { const sh = d.buffs.shadows; sh.n--; if (sh.n <= 0) delete d.buffs.shadows; log("A shadow image takes the blow for " + obj(d) + (sh.n > 0 ? " (" + sh.n + " left)." : ". The last image is gone."), cls(d)); popText(d, "Shadow", "#b0bec5", 13, 0.9); }
    sfx("miss", a); vfx("miss", { src: a, tgt: d });
    if (isMob(a)) a.tp = Math.min(CONFIG.tpMax, a.tp + Math.round(CONFIG.tpPerDelay * a.delay));
    return;
  }
  if (a.buffs && a.buffs.twin_strike && !a.twinning) {
    const tw = a.buffs.twin_strike;
    tw.left = (tw.left == null ? 3 : tw.left) - 1;
    if (tw.left <= 0) delete a.buffs.twin_strike;
    a.twinning = true; swing(a, d); a.twinning = false;
    if (!d.alive) return;
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
  if (!sneak && Math.random() * 100 >= hitChance(a, d, (b.hasso ? 10 : 0) + (b.hawk_roll ? b.hawk_roll.pow : 0) + (d.buffs && d.buffs.stepped ? d.buffs.stepped.n * 5 : 0))) {
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
  if (b.hasso) dmg = Math.floor(dmg * 1.12);
  if (b.dragon_spirit) dmg = Math.floor(dmg * 1.15);
  if (b.valor_roll) dmg = Math.floor(dmg * (1 + b.valor_roll.pow / 100));
  if (b.geo_fury) dmg = Math.floor(dmg * 1.1);
  if (b.vallation && isMob(d)) addEnmity(d, a, 30);
  if (b.weaken) dmg = Math.floor(dmg * 0.85);
  if (b.soulfire && a.hp > 1) { const burn = Math.min(a.hp - 1, Math.floor(a.hp * 0.06)); a.hp -= burn; dmg += Math.floor(burn * 1.6); }
  a.tp = Math.min(CONFIG.tpMax, a.tp + tpGain + (boost ? 100 : 0));
  d.tp = Math.min(CONFIG.tpMax, d.tp + Math.round(tpGain / 3));
  if (crit) S.shake = Math.max(S.shake, 0.1);
  const wt = isMob(a) ? "blunt" : (["sword", "greataxe", "archery", "gkatana", "katana", "polearm", "axe", "gsword"].includes(a.stats.wtype) ? "slash" : "blunt");
  sfx(crit ? "crit" : wt === "slash" ? "slash" : "blunt", a);
  vfx("hit", { src: a, tgt: d, crit, slash: wt === "slash" });
  log(subj(a) + " " + vb(a, "hit") + " " + obj(d) + " for " + dmg + (crit ? " (critical)" : "") + ".", cls(a));
  applyDamage(a, d, dmg, { text: crit ? dmg + "!" : dmg, color: crit ? "#ffeb3b" : undefined, size: crit ? 21 : 16 });
  if (d.alive && !bow) for (const k of EN_KEYS) if (b[k]) applyDamage(a, d, b[k].pow, { color: ELEMENT_COLORS[EN_EL[k]], size: 13, enmity: 0, el: EN_EL[k] });
  if (a.alive && d.alive && !bow) {
    for (const k of ["blaze_spikes", "ice_spikes"]) {
      const sk = d.buffs && d.buffs[k];
      if (!sk) continue;
      const sp = SPELLS[k], el = sp.spikes.el;
      popText(d, sp.name, ELEMENT_COLORS[el], 12, 0.9, 12);
      applyDamage(d, a, sk.pow, { color: ELEMENT_COLORS[el], size: 13, enmity: 0, el });
      if (sp.spikes.para && a.alive && Math.random() < sp.spikes.para && !a.buffs.paralyze) a.buffs.paralyze = { until: S.time + 10, src: d, pow: 0.15 };
    }
  }
  if (b.blood_blade && a.alive) { const heal = Math.min(a.maxHp - a.hp, Math.floor(dmg * 0.4)); if (heal > 0) { a.hp += heal; popText(a, "+" + heal, "#9ad06b", 13, 0.8); } }
  if (a.job === "MNK" && a.stats.wtype === "h2h" && d.alive && !a.kicking && Math.random() < 0.14) {
    a.kicking = true;
    log(subj(a) + " " + vb(a, "follow") + " up with a kick!", cls(a));
    swing(a, d);
    a.kicking = false;
  }
}

function onKO(e, src) {
  if (e.proxy) return;
  e.alive = false;
  e.engaged = false;
  e.casting = null;
  e.readying = null;
  e.attackTarget = null;
  if (isMob(e)) {
    e.deadAt = S.time;
    log("The " + e.name + " is defeated.", "you");
    sfx("defeat", e);
    mobVoice(e, "die");
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
    const mine = !e.claim || e.claim === S.charId || e.claim === "me";
    if ((byParty || (src && isParty(src))) && mine) killRewards(e);
    if (typeof netMobDied === "function") netMobDied(e);
  } else {
    if (e.buffs && e.buffs.reraise && S.time < e.buffs.reraise.until) { const pct = e.buffs.reraise.pct; delete e.buffs.reraise; revive(e, pct, "Reraise"); return; }
    e.hp = 0;
    e.tp = 0;
    log(e === player ? "You were defeated." : e.name + " was defeated.", "foe");
    sfx("ko", e);
    vfx("ko", { tgt: e });
    e.mounted = false;
    if (e === player) for (const p of S.party) p.mounted = false;
    for (const m of S.mobs) m.enmity.delete(e);
    if (e !== player) partySay(e, "ko", true);
    e.koUntil = Date.now() + CONFIG.koMinutes * 60000; e.koAt = S.time; e.casting = null; e.engaged = false; e.attackTarget = null; e.buffs = {};
    if (e.mercId) { save.mercDown = save.mercDown || {}; save.mercDown[e.mercId] = e.koUntil; save.mercBodies = save.mercBodies || {}; save.mercBodies[e.mercId] = { zone: S.zoneId, x: e.x, y: e.y, until: e.koUntil }; log(e.name + " is down. Raise them or use an Ember Plume before an hour passes.", "foe"); }
    if (e === player) { save.stats.kos++; S.ko = true; S.chase = false; S.moveTarget = null; player.engaged = false; player.attackTarget = null; save.ko = { until: e.koUntil }; player.target = null; if (typeof tgtCmdClose === "function") tgtCmdClose(); if (typeof mainCmdClose === "function" && UI.mm) mainCmdClose(); showKO(true); saveGame(); }
  }
}

function killRewards(e) {
  try { conquestKill(e); expKill(e); } catch (err) {}
  save.stats.kills++;
  rareRecipeDrop(e);
  if (player.job === "RNG") save.stats.rngKills++;
  noteBeast(e, true);
  if (e.fam.nm) { save.stats.nm++; save.nmKilled[e.famKey] = (save.nmKilled[e.famKey] || 0) + 1; }
  for (const id of save.hired) if (S.party.some(p => p.mercId === id)) addBond(id, e.fam.nm ? 4 : xpFor(e.lv, player.lv) > 0 ? 1 : 0);
  const mates = typeof netPartyNear === "function" ? netPartyNear(e.x, e.y) : [];
  const pn = 1 + mates.length, top = Math.max(player.lv, ...mates.map(m => m.lv || 1));
  const xp = pn > 1 ? Math.round(xpFor(e.lv, top) * partyShare(pn) * player.lv / top) : xpFor(e.lv, player.lv);
  let ch = 0;
  if (xp > 0) { ch = advanceChain(); gainXp(Math.round(xp * (1 + CONFIG.chainStep * ch)), ch); } else log("No experience gained (too weak).", "sys");
  const gilShare = dropLoot(e, mates);
  if (pn > 1) netPartyKill(e, mates, top, pn, ch, gilShare);
  bountyKill(e);
  storyKill(e);
  questKillCredit(e.famKey);
  if (e.famKey === "chieftain" && save.quests.chieftain === "active") {
    save.quests.chieftain = "killed";
    log("Quest updated: report the Chieftain's defeat to Captain Rhea.", "npc");
    sfx("notify");
  }
  const talker = S.party.filter(p => p !== player && p.alive);
  if (talker.length && Math.random() < 0.3) partySay(pick(talker), "victory");
  if (xp > 0 && !S.mobs.some(m => m !== e && m.alive && m.state === "combat" && S.party.some(p => m.enmity && m.enmity.has(p)))) sfx("victory");
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

function partyShare(n) { return CONFIG.partyShare[Math.min(n, CONFIG.partyShare.length - 1)]; }

function questKillCredit(fam) {
  for (const id in QUESTS) {
    const q = QUESTS[id];
    if (!q.kill || save.quests[id] !== "active") continue;
    if (q.kill.fam !== fam) continue;
    const n = (save.qprog[id] || 0) + 1;
    save.qprog[id] = Math.min(q.kill.n, n);
    if (n <= q.kill.n) { log("Quest progress: " + q.kill.name + " " + Math.min(n, q.kill.n) + "/" + q.kill.n + ".", "npc"); if (n === q.kill.n) { log("Quest updated: report to " + q.giver + ".", "npc"); sfx("notify"); } }
  }
}

function xpNeed(lv) { return lv >= CONFIG.levelCap ? 0 : CONFIG.xpTable[lv]; }

function gainXp(n, chain, quiet) {
  const j = save.jobs[save.mainJob];
  if (j.lv >= CONFIG.levelCap) { if (!quiet) log("You are at the level cap.", "sys"); return; }
  if (buddyPerk("xp")) n = Math.round(n * (1 + buddyPerk("xp")));
  if (player && player.buffs && player.buffs.boon) n = Math.round(n * 1.1);
  if (!chain || chain >= 0) n = Math.round(n * conquestXpMul());
  j.xp += n;
  log((chain > 0 ? "EXP chain #" + chain + "! " : "") + "You gain " + n + " experience points.", "you");
  popText(player, "+" + n + " XP" + (chain > 0 ? " · Chain " + chain : ""), chain > 0 ? "#ffd54f" : "#9ad06b", 14, 1.2, 16);
  let leveled = false;
  const lv0 = j.lv;
  while (j.lv < CONFIG.levelCap && j.xp >= xpNeed(j.lv)) { j.xp -= xpNeed(j.lv); j.lv++; leveled = true; }
  if (j.lv >= CONFIG.levelCap) j.xp = 0;
  if (leveled) {
    refreshPlayer(true);
    log("You reach level " + j.lv + "!", "loot");
    const nw = Object.values(SPELLS).filter(sp => sp.jobs[save.mainJob] && sp.jobs[save.mainJob] <= j.lv && sp.jobs[save.mainJob] > lv0 && !save.spells.includes(sp.id));
    if (nw.length) log("You can now learn " + nw.map(sp => sp.name).join(", ") + ". Look for " + (nw.length > 1 ? "their scrolls" : "its scroll") + " in shops or from monsters.", "sys");
    popText(player, "Level Up!", "#ffd54f", 24, 2, 30);
    ring(player, "#ffd54f", 50, 0.9, "burst");
    S.shake = 0.2;
    sfx("levelup");
    vfx("levelup", { tgt: player });
    checkJobUnlocks();
  }
  saveGame();
}

function invCount(id) { return save.inventory.filter(s => s.id === id).reduce((n, s) => n + s.qty, 0); }

function giveItem(id, n, quiet) {
  const it = ITEMS[id];
  if (save.seen) save.seen.items[id] = 1;
  if (it.kind === "pet" && n === 1 && save.buddies && !save.buddies.includes(it.pet) && learnBuddy(it.pet)) return true;
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

let GEAR_RESERVED = null;
function gearDrop(m, mates) {
  if (m.fam.boss || m.fam.nm || Math.random() >= 0.06) return;
  if (!GEAR_RESERVED) {
    GEAR_RESERVED = new Set();
    const scan = o => { if (typeof o === "string") GEAR_RESERVED.add(o); else if (Array.isArray(o)) o.forEach(scan); else if (o && typeof o === "object") for (const k in o) scan(o[k]); };
    for (const f of [FAMILIES, typeof NM_FAMILIES !== "undefined" ? NM_FAMILIES : {}]) for (const k in f) scan(f[k].loot);
    for (const k in QUESTS) scan(QUESTS[k].reward);
    scan(BATTLEFIELD.rewards); scan(GUILD_SHOP);
  }
  const c = GEAR_DROP_IDS.filter(id => !GEAR_RESERVED.has(id) && ITEMS[id].lv >= m.lv - 3 && ITEMS[id].lv <= m.lv + 1);
  if (!c.length) return;
  lootGive(c[Math.floor(Math.random() * c.length)], mates);
}

function lootGive(id, mates) {
  if (S.party.length > 1 || (mates && mates.length)) { const pe = addToPool(id); if (mates && mates.length && typeof netPoolOut === "function") netPoolOut(pe, mates); return; }
  giveItem(id, 1);
}

function dropLoot(m, mates) {
  mates = mates || [];
  for (const [id, chance, minLv] of m.fam.loot || []) {
    if (minLv && m.lv < minLv) continue;
    if (ITEMS[id].kind === "key") { giveKeyItem(id); continue; }
    if (ITEMS[id].kind === "crystal" && (!blessed() || xpFor(m.lv, player.lv) <= 0)) continue;
    if (Math.random() >= chance * (player.job === "THF" ? 1.2 : 1) + buddyPerk("drop")) continue;
    if (ITEMS[id].rare && hasItem(id)) { log("You already possess " + an(ITEMS[id].name) + ". It is lost.", "sys"); continue; }
    lootGive(id, mates);
  }
  gearDrop(m, mates);
  if (Math.random() < CONFIG.scrollDrop && xpFor(m.lv, player.lv) > 0) {
    const pool = Object.values(SPELLS).filter(sp => ITEMS["scroll_" + sp.id] && sp.minLv >= m.lv - 4 && sp.minLv <= m.lv + 3);
    if (pool.length) lootGive("scroll_" + pool[Math.floor(Math.random() * pool.length)].id, mates);
  }
  const gr = m.fam.gil || (!m.fam.nm && !m.fam.boss && xpFor(m.lv, player.lv) > 0 ? CONFIG.mobGil : null);
  if (gr) {
    const total = Math.round(rand(gr[0], gr[1]) * m.lv);
    const g = mates.length ? Math.floor(total / (1 + mates.length)) : total;
    save.gil += g; save.stats.killGil += g;
    log("You obtain " + g + " crystals" + (mates.length ? " (party share)" : "") + ".", "loot");
    sfx("coin");
    return mates.length ? g : 0;
  }
  return 0;
}

function addToPool(id) {
  S.pool = S.pool || [];
  const e = { id, until: S.time + CONFIG.poolTime, lots: {}, mine: null, seq: ++S.mobSeq };
  S.pool.push(e);
  log("The " + ITEMS[id].name + " goes into the treasure pool.", "loot");
  sfx("loot");
  uiEvent("pool", { id });
  return e;
}

function mercBag(id) { return (save.mercInv = save.mercInv || {})[id] || (save.mercInv[id] = []); }
function mercBagRoom(id, itemId) {
  const bag = mercBag(id), stack = ITEMS[itemId].stack || 1;
  return bag.length < CONFIG.inventorySize || bag.some(x => x.id === itemId && x.qty < stack);
}
function mercBagAdd(id, itemId) {
  const bag = mercBag(id), stack = ITEMS[itemId].stack || 1;
  const s0 = bag.find(x => x.id === itemId && x.qty < stack);
  if (s0) { s0.qty++; return true; }
  if (bag.length >= CONFIG.inventorySize) return false;
  bag.push({ id: itemId, qty: 1, sale: true });
  return true;
}
function mercBagCount(id) { return (save.mercInv && save.mercInv[id] || []).reduce((a, x) => a + x.qty, 0); }
function mercWants(merc, itemId) {
  const it = ITEMS[itemId];
  if (it.kind === "equip" && mercCanWear(merc.mercId, itemId)) return false;
  return mercBagRoom(merc.mercId, itemId);
}
function mercTownSellLocal(id) {
  const bag = save.mercInv[id], sale = bag.filter(x => x.sale);
  let listed = 0, gone = 0;
  for (const e of sale) { if (mercConsign(id, e)) listed += e.qty; else gone += e.qty; }
  save.mercInv[id] = bag.filter(x => !x.sale);
  mercSellLog(id, listed, gone);
}

function mercSellLog(id, listed, gone) {
  log(MERCS[id].name + " puts " + listed + " item" + (listed === 1 ? "" : "s") + " up at the auction house" + (gone ? " and sells " + gone + " more to a shop" : "") + ".", "party");
}

function mercTownSellDue(id) {
  const bag = save.mercInv && save.mercInv[id];
  return !!bag && bag.length >= Math.ceil(CONFIG.inventorySize / 2) && bag.some(x => x.sale && x.qty > 0);
}

function mercTownSell() {
  if (!S.zone || S.zone.theme !== "town" || !save.mercInv) return;
  for (const id of save.hired) {
    if (!mercTownSellDue(id)) continue;
    if (typeof netMarketOnline === "function" && netMarketOnline()) mercTownSellOnline(id);
    else mercTownSellLocal(id);
  }
}

function mercTownSellOnline(id) {
  S.consigning = S.consigning || {};
  if (S.consigning[id]) return;
  S.consigning[id] = true;
  netMercConsign(id).then(d => { mercSellLog(id, d.listed || 0, d.gone || 0); }, e => {
    if (netMissing(e)) { NET.market = false; if (mercTownSellDue(id)) mercTownSellLocal(id); saveGame(); }
  }).finally(() => { delete S.consigning[id]; });
}

function poolUpgrade(merc, id) {
  const it = ITEMS[id], cur = merc.gear[slotKeys(it.slot)[0]];
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
  if (e.net && typeof netLotOut === "function") netLotOut(e);
  sfx("select");
  tickPool(true);
}

function tickPool(force) {
  if (!S.pool || !S.pool.length) return;
  for (const e of S.pool.slice()) {
    if (e.net && !e.net.owner) {
      if (e.mine == null && S.time >= e.until) { e.mine = 1 + Math.floor(Math.random() * 999); log("Time's up: you lot " + e.mine + " on the " + ITEMS[e.id].name + ".", "loot"); if (typeof netLotOut === "function") netLotOut(e); }
      if (S.time > e.until + 20) S.pool.splice(S.pool.indexOf(e), 1);
      continue;
    }
    for (const m of S.party) {
      if (m === player || !m.mercId || e.lots[m.mercId] != null) continue;
      if (S.time < e.until - CONFIG.poolTime + 1.5) continue;
      if (mercWants(m, e.id)) { e.lots[m.mercId] = 1 + Math.floor(Math.random() * 999); log(m.name + " lots " + e.lots[m.mercId] + " on the " + ITEMS[e.id].name + ".", "party"); }
      else e.lots[m.mercId] = 0;
    }
    const netIn = !e.net || e.net.ids.every(id => e.net.lots[id] != null || !netIsMate(id));
    const allIn = e.mine != null && netIn && S.party.every(m => m === player || !m.mercId || e.lots[m.mercId] != null);
    if (!allIn && S.time < e.until + (e.net ? 3 : 0)) continue;
    if (e.mine == null) { e.mine = 1 + Math.floor(Math.random() * 999); log("Time's up: you lot " + e.mine + " on the " + ITEMS[e.id].name + ".", "loot"); }
    S.pool.splice(S.pool.indexOf(e), 1);
    let best = e.mine, who = e.mine > 0 ? "me" : null;
    for (const k in e.lots) if (e.lots[k] > best) { best = e.lots[k]; who = k; }
    if (e.net) for (const k in e.net.lots) if (e.net.lots[k] > best && netIsMate(k)) { best = e.net.lots[k]; who = "net:" + k; }
    if (e.net) netWinOut(e, who === "me" ? S.charId : !who ? null : who.startsWith("net:") ? who.slice(4) : "merc", who === "me" ? save.name : !who ? "" : who.startsWith("net:") ? NET_PT.members.get(who.slice(4)).name : MERCS[who].name);
    if (!who) { log("Nobody wanted the " + ITEMS[e.id].name + ". It is lost.", "sys"); continue; }
    if (who.startsWith("net:")) { log(NET_PT.members.get(who.slice(4)).name + " obtains the " + ITEMS[e.id].name + ".", "loot"); continue; }
    if (who === "me") { save.stats.lotsWon++; giveItem(e.id, 1); continue; }
    const it = ITEMS[e.id], own = save.mercGear[who] = save.mercGear[who] || {};
    const wm = S.party.find(p => p.mercId === who);
    if (it.kind === "equip" && wm && poolUpgrade(wm, e.id)) {
      const sk = slotKeys(it.slot)[0], old = own[sk];
      own[sk] = e.id;
      if (old && !mercBagAdd(who, old)) giveItem(old, 1, true);
      log(MERCS[who].name + " obtains the " + it.name + " and puts it on.", "party");
      syncAllies(false);
    } else if (mercBagAdd(who, e.id)) {
      log(MERCS[who].name + " obtains the " + it.name + " and keeps it to sell.", "party");
    } else {
      log(MERCS[who].name + "'s bag is full. The " + it.name + " is lost.", "sys");
    }
    partySay(S.party.find(p => p.mercId === who), "gift", true);
    syncAllies(false);
  }
  if (force) saveGame();
}

function eatFood(id) {
  const it = ITEMS[id];
  if (player.engaged || inCombatWith(player)) { log("You can't eat during a fight.", "sys"); sfx("error"); return; }
  if (save.food && foodLeft() > 0 && save.food.id !== id) log("You set aside the " + ITEMS[save.food.id].name + " and eat something else.", "sys");
  removeItem(id, 1);
  save.food = { id, endSec: (save.playSec || 0) + CONFIG.foodMinutes * 60 };
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
  if (save.hotbars && save.hotbars[save.mainJob]) save.hotbars[save.mainJob].petV2 = false;
  log(BUDDIES[id].name + " joins you as a pet! Open Pets in the Commands menu to summon it.", "loot");
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
  const b = { kind: "buddy", buddy: true, petId: save.buddy, name: buddyName(save.buddy), alive: true, x: player.x - Math.cos(player.face) * 36, y: player.y - Math.sin(player.face) * 36, px: 0, py: 0, face: player.face, speed: CONFIG.runSpeed * 1.2, radius: 8, buffs: {}, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9, wander: 0, idleT: 0 };
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

function addWildlife(id) {
  const z = S.zone, r = seeded(hashStr(id + "wild")), rects = zoneRects(z);
  const free = (x, y) => x > 200 && y > 200 && x < z.w - 200 && y < z.h - 200 && !rects.some(q => x > q.x - 40 && x < q.x + q.w + 40 && y > q.y - 40 && y < q.y + q.h + 40) && !(z.water || []).some(w => Math.hypot(x - w.x, y - w.y) < w.r + 40);
  const spot = () => { for (let k = 0; k < 40; k++) { const x = r() * z.w, y = r() * z.h; if (free(x, y)) return [x, y]; } return null; };
  const mk = (type, x, y, o) => S.ambient.push(Object.assign({ kind: "ambient", ambient: true, wild: true, type, seed: 0, x, y, px: x, py: y, home: { x, y }, roam: 120, pi: 0, face: r() * 6.28, speed: 60, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9, wait: r() * 4 }, o));
  const snowy = z.palette === "snow", wet = z.mist;
  for (let h = 0; h < (snowy ? 1 : 2); h++) { const p = spot(); if (p) for (let i = 0; i < 3; i++) mk("deer", p[0] + (r() - 0.5) * 120, p[1] + (r() - 0.5) * 120, { col: snowy ? 0xb8b0a4 : 0x8a6a48, roam: 180, speed: 70, time: "day", shy: true }); }
  for (let f = 0; f < 2; f++) { const p = spot(); if (p) for (let i = 0; i < 4; i++) mk("bird", p[0] + (r() - 0.5) * 80, p[1] + (r() - 0.5) * 80, { col: wet ? 0x3a3a34 : snowy ? 0xe8ecf0 : 0x6a5a4a, roam: 500, speed: 150, fly: 7 + r() * 5, time: "day", dry: true, wait: 0 }); }
}
function cityLife(z, id) {
  const rs = zoneRects(z);
  const free = (d, x, y) => x > d.x + 70 && x < d.x + d.w - 70 && y > d.y + 70 && y < d.y + d.h - 70 && !rs.some(r => x > r.x - 36 && x < r.x + r.w + 36 && y > r.y - 36 && y < r.y + r.h + 36);
  const stoneOf = did => { const n = z.npcs.find(q => q.id === "warpstone_" + id + "_" + did); return n ? { x: n.x, y: n.y + 90 } : null; };
  for (const d of z.districts) {
    const cfg = CITY_LIFE[d.id] || [2, 1], c = stoneOf(d.id) || { x: d.x + d.w / 2, y: d.y + d.h / 2 };
    const make = (tag, i, rad, extra) => {
      const r = seeded(hashStr(id + d.id + tag + i)), pts = [];
      for (let t = 0; t < 60 && pts.length < 4; t++) {
        const ang = r() * 6.283, rr = 70 + r() * rad, x = Math.round(c.x + Math.cos(ang) * rr), y = Math.round(c.y + Math.sin(ang) * rr);
        if (free(d, x, y)) pts.push([x, y]);
      }
      if (pts.length < 2) return;
      pts.sort((a, b) => Math.atan2(a[1] - c.y, a[0] - c.x) - Math.atan2(b[1] - c.y, b[0] - c.x));
      S.ambient.push(Object.assign({ kind: "ambient", ambient: true, type: "walker", seed: hashStr(id + d.id + tag + i) % 997, x: pts[0][0], y: pts[0][1], px: pts[0][0], py: pts[0][1], home: { x: c.x, y: c.y }, roam: 60, path: pts, pi: 0, face: 0, speed: 50, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9, wait: r() * 4, district: d.id }, extra));
    };
    for (let i = 0; i < cfg[0]; i++) make("day", i, 230, { time: "day" });
    for (let i = 0; i < Math.ceil(cfg[0] / 3); i++) make("night", i, 200, { time: "night", speed: 44 });
    for (let i = 0; i < cfg[1]; i++) make("guard", i, 320, { look: i % 2 ? "guard_f" : "guard", speed: 40, guard: true });
  }
}
function ambientAwake(a) {
  if (a.time === "day" && isNight()) return false;
  if (a.time === "night" && !isNight()) return false;
  if (a.dry && /rain|storm|snow|blizzard/.test(weatherNow() || "")) return false;
  return true;
}
function tickAmbient(dt) {
  for (const a of S.ambient || []) {
    a.away = !ambientAwake(a);
    if (a.away) continue;
    if (a.shy && player && dist(a, player) < 140 && !a.flee) { const ang = Math.atan2(a.y - player.y, a.x - player.x); a.tx = a.x + Math.cos(ang) * 260; a.ty = a.y + Math.sin(ang) * 260; a.flee = true; a.wait = 0; a.speedBase = a.speedBase || a.speed; a.speed = a.speedBase * 2.6; }
    if (a.path) {
      const p = a.path[a.pi % a.path.length];
      if (a.wait > 0) { a.wait -= dt; continue; }
      if (moveToward(a, p[0], p[1], dt, 6)) { a.pi++; a.wait = 1 + Math.random() * 4; }
      continue;
    }
    if (a.wait > 0) { a.wait -= dt; continue; }
    if (a.tx == null) { a.tx = a.home.x + (Math.random() - 0.5) * a.roam * 2; a.ty = a.home.y + (Math.random() - 0.5) * a.roam * 2; }
    if (moveToward(a, a.tx, a.ty, dt, 4)) { a.tx = null; a.wait = a.fly ? 0 : 1.5 + Math.random() * 5; if (a.flee) { a.flee = false; a.speed = a.speedBase; a.home = { x: a.x, y: a.y }; } }
    keepOutOfColliders(a);
  }
}

function blessingMinutes() { return Math.min(BLESSING.maxMin, BLESSING.baseMin + BLESSING.perRankMin * guildRank()); }
function migratePlayTimers() {
  if (!save) return;
  const ps = save.playSec || 0;
  if (save.blessing) { save.blessEnd = ps + Math.max(0, (save.blessing - Date.now()) / 1000); save.blessing = 0; }
  const f = save.food;
  if (f && f.until != null) { f.endSec = ps + Math.max(0, (f.until - Date.now()) / 1000); delete f.until; }
}
function blessLeft() { migratePlayTimers(); return save.blessEnd ? Math.max(0, save.blessEnd - (save.playSec || 0)) : 0; }
function foodLeft() { migratePlayTimers(); return save.food && save.food.endSec != null ? Math.max(0, save.food.endSec - (save.playSec || 0)) : 0; }
function blessed() { return blessLeft() > 0; }

function giveBlessing() {
  const mins = blessingMinutes();
  save.blessEnd = (save.playSec || 0) + mins * 60;
  save.stats.blessings = (save.stats.blessings || 0) + 1;
  log("You receive the City Blessing. Monsters will yield essences for " + mins + " minutes of play time.", "loot");
  popText(player, "City Blessing", "#ffd54f", 14, 1.2, 14);
  ring(player, "#ffd54f", 30, 0.8, "sparkle");
  sfx("buff", player);
  vfx("buff", { tgt: player, id: "blessing" });
  tickBlessing();
  saveGame();
}

function tickBlessing() {
  const left = blessLeft();
  if (!save.blessEnd) { if (player.buffs.blessing) delete player.buffs.blessing; return; }
  if (left <= 0) { save.blessEnd = 0; delete player.buffs.blessing; log("The City Blessing fades. Visit a gate guard for another.", "sys"); return; }
  if (!player.buffs.blessing) player.buffs.blessing = { until: S.time + left + 1 };
  else player.buffs.blessing.until = S.time + left + 1;
}

function tickFood() {
  const f = save.food;
  if (!f) { if (player.buffs.food) delete player.buffs.food; return; }
  const left = foodLeft();
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
  if (!zkey(FISH, S.zoneId)) return "Nothing bites here.";
  const w = nearWater(player);
  if (!w) return "Stand at the water's edge to fish.";
  if (player.engaged || inCombatWith(player)) return "You can't fish during a fight.";
  if (player.mounted) return "Dismount first.";
  if (invCount("bait") < 1) return "You're out of Fishing Bait. Pell sells it.";
  if (player.resting) standUp(player, true);
  removeItem("bait", 1);
  player.face = Math.atan2(w.y - player.y, w.x - player.x);
  const rainy = ["rain", "storm"].includes(weatherNow());
  S.fish = { state: "wait", at: S.time + rand(FISH_CFG.waitMin, FISH_CFG.waitMax) * (rainy ? 0.75 : 1), x: player.x, y: player.y, since: S.time };
  log("You cast your line.", "you");
  sfx("cast_line", player);
  return "";
}

function stopFishing(msg) {
  if (!S.fish) return;
  S.fish = null;
  if (msg) log(msg, "sys");
}

function pickFish() {
  const w = weatherNow();
  const tbl = zkey(FISH, S.zoneId).filter(f => !f[3] || f[3] === w);
  const tot = tbl.reduce((a, f) => a + f[2], 0);
  let r = Math.random() * tot;
  for (const f of tbl) { r -= f[2]; if (r <= 0) return f; }
  return tbl[0];
}

function reelFish() {
  const f = S.fish;
  if (!f || f.state !== "bite") return;
  S.fish = null; player.reelAt = S.time;
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
  if (f.state === "wait" && S.time >= f.at) { f.state = "bite"; f.until = S.time + FISH_CFG.bite; log("Something's biting! Reel it in!", "loot"); sfx("splash", player); sfx("notify", player); uiEvent("bite", {}); }
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
    enterZone("marsh", 640 * zsc("marsh"), 2050 * zsc("marsh"));
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

const AH_DAILY = { equip: 10, ammo: 5, use: 10, scroll: 3, food: 10, mat: 10 };

function ahGroup(id) {
  const it = ITEMS[id];
  if (it.kind === "equip") return it.slot === "ammo" ? "ammo" : it.hq ? "equip" : null;
  if (it.kind === "food") return "food";
  if (it.kind === "use") return it.spell ? "scroll" : "use";
  return "mat";
}

function ahTowns() {
  if (S.ahTownList) return S.ahTownList;
  return S.ahTownList = Object.keys(ZONES).filter(z => ZONES[z].theme === "town" && (ZONES[z].houses || []).some(b => b.type === "auction"));
}

function ahHere() { return ahTowns().includes(S.zoneId) ? S.zoneId : ahTowns()[0]; }

function ahTownName(z) { return ZONES[z] ? ZONES[z].city || ZONES[z].name : z; }

function ahDaily(town) {
  town = town || ahHere();
  const day = marketDay(), lv = player.lv;
  S.ahDay = S.ahDay || {};
  const c = S.ahDay[town];
  if (c && c.day === day && c.lv === lv) return c.set;
  const pools = {};
  for (const id of Object.keys(ITEMS).sort()) {
    if (!ahTradable(id)) continue;
    const g = ahGroup(id);
    if (!g || (ITEMS[id].lv || 0) > lv + 1) continue;
    (pools[g] = pools[g] || []).push(id);
  }
  const set = new Set();
  for (const g in pools) {
    const pool = pools[g], r = seeded(hashStr("ahdaily:" + town + ":" + g + ":" + day));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    pool.slice(0, AH_DAILY[g]).forEach(id => set.add(id));
  }
  S.ahDay[town] = { day, lv, set };
  return set;
}

function ahMarketSet() {
  const u = new Set();
  for (const t of ahTowns()) for (const id of ahDaily(t)) u.add(id);
  return u;
}

function ahBoughtOf(town) {
  const day = marketDay();
  if (!save.market.bought || save.market.bought.day !== day || !save.market.bought.t) save.market.bought = { day, t: {} };
  return save.market.bought.t[town] || (save.market.bought.t[town] = {});
}

function ahStockAt(id, town) {
  const it = ITEMS[id], bought = ahBoughtOf(town), day = marketDay();
  if (!ahDaily(town).has(id)) return 0;
  if (it.kind === "equip" && it.slot !== "ammo") return Math.max(0, 1 - (bought[id] || 0));
  const r = seeded(hashStr(id + ":" + town + ":" + day));
  const base = it.price > 3000 ? 1 : it.price > 800 ? 2 : it.price > 150 ? 4 : 8;
  const n = Math.floor(r() * (base + 1)) + (ahCategory(id) === "materials" || ahCategory(id) === "consumables" ? Math.ceil(base / 2) : 0);
  return Math.max(0, n - (bought[id] || 0));
}

function ahStock(id) { return ahTowns().reduce((a, t) => a + ahStockAt(id, t), 0); }

function ahStockLines(id) { return ahTowns().map(t => ({ town: t, name: ahTownName(t), n: ahStockAt(id, t), here: t === ahHere() })); }

function marketLocalLots() { return (save.market.local && Array.isArray(save.market.local.lots)) ? save.market.local.lots : []; }

function marketLocal() {
  const L = save.market.local = save.market.local || {};
  if (!Array.isArray(L.lots)) L.lots = [];
  if (L.lastTick == null) L.lastTick = save.playSec || 0;
  if (!L.lastSale) L.lastSale = {};
  return L;
}

function mercLotCount() { return marketLocalLots().filter(l => l.kind === "merc").length; }

function mercConsign(id, entry) {
  const L = marketLocal();
  if (!ahTradable(entry.id) || mercLotCount() >= AH_CFG.mercLotCap) return false;
  L.lots.push({ id: entry.id, qty: entry.qty, price: marketPrice(entry.id) * entry.qty, kind: "merc", seller: MERCS[id] ? MERCS[id].name : "?", owner: save.name || "", merc: id, t: save.playSec || 0, seq: (L.seq = (L.seq || 0) + 1) });
  return true;
}

function townPayBox(gil, note) {
  save.market.box.push({ gil, note });
}

function townEligible(price, qty, id) { return price / qty <= marketPrice(id) * AH_CFG.townBuyCeil; }

function townPick(cands, sellerOf, ageOf) {
  const L = marketLocal(), by = new Map();
  for (const c of cands) { const k = sellerOf(c); if (!by.has(k)) by.set(k, []); by.get(k).push(c); }
  let best = null;
  for (const [k, list] of by) { const last = L.lastSale[k] == null ? -Infinity : L.lastSale[k]; if (!best || last < best.last) best = { k, last, list }; }
  if (!best) return null;
  return { seller: best.k, item: best.list.reduce((a, b) => ageOf(b) < ageOf(a) ? b : a) };
}

function townBuyOnce(town) {
  const L = marketLocal(), tn = ahTownName(town);
  let bought = null;
  const pl = save.market.listings.filter(l => townEligible(l.price, l.qty, l.id));
  if (pl.length) {
    const p = townPick(pl, () => "player:" + (save.name || "you"), l => l.exp - AH_CFG.expireMs);
    const l = p.item, i = save.market.listings.indexOf(l);
    save.market.listings.splice(i, 1);
    save.gil += l.price;
    save.stats.ahSold = (save.stats.ahSold || 0) + 1;
    addPress(l.id, -0.02 * l.qty);
    L.lastSale[p.seller] = save.playSec || 0;
    log("Auction: " + tn + " bought your " + (l.qty > 1 ? l.qty + " " + ITEMS[l.id].name + "s" : ITEMS[l.id].name) + " for " + l.price + " crystals!", "loot");
    sfx("coin");
    uiEvent("ahsold", { id: l.id, price: l.price });
    bought = l;
  } else {
    const ml = L.lots.filter(l => l.kind === "merc" && townEligible(l.price, l.qty, l.id));
    if (!ml.length) return null;
    const p = townPick(ml, l => "merc:" + (l.merc || l.seller), l => l.seq || 0);
    const l = p.item;
    L.lots.splice(L.lots.indexOf(l), 1);
    L.lastSale[p.seller] = save.playSec || 0;
    townPayBox(l.price, l.seller + " sold " + (l.qty > 1 ? l.qty + " " + ITEMS[l.id].name + "s" : ITEMS[l.id].name) + " to " + tn);
    log("Auction: " + tn + " bought " + l.seller + "'s " + ITEMS[l.id].name + (l.qty > 1 ? " ×" + l.qty : "") + ". " + l.price + " crystals are in your delivery box.", "loot");
    bought = l;
  }
  if (bought && Math.random() < AH_CFG.relistChance) L.lots.push({ id: bought.id, qty: bought.qty, price: Math.ceil(bought.price * AH_CFG.relistMarkup), kind: "town", seller: tn, owner: "", town, t: save.playSec || 0, seq: (L.seq = (L.seq || 0) + 1) });
  return bought;
}

function tickTownBuying() {
  const L = marketLocal(), now = save.playSec || 0;
  let steps = Math.floor((now - L.lastTick) / AH_CFG.townBuySec);
  if (steps <= 0) return 0;
  L.lastTick += steps * AH_CFG.townBuySec;
  steps = Math.min(steps, AH_CFG.townBuyMaxSteps);
  let n = 0;
  for (let s = 0; s < steps; s++) for (const t of ahTowns()) if (townBuyOnce(t)) n++;
  if (n) { checkAchievements(); saveGame(); }
  return n;
}

function marketLines(id, online) {
  const out = [];
  for (const t of ahTowns()) { const n = ahStockAt(id, t); if (n > 0) out.push({ kind: "town", stock: true, seller: ahTownName(t), owner: "", town: t, qty: n, unit: marketPrice(id), price: marketPrice(id) * n }); }
  marketLocalLots().forEach((l, i) => { if (l.id === id) out.push({ kind: l.kind || "player", seller: l.seller || "", owner: l.owner || "", qty: l.qty, unit: l.price / l.qty, price: l.price, local: i }); });
  for (const l of online || []) {
    if (l.item !== id) continue;
    const kind = l.kind === "merc" ? "merc" : l.kind === "town" ? "town" : "player";
    out.push({ kind, seller: kind === "merc" ? l.merc_name || l.seller_name : l.seller_name, owner: l.seller_name, qty: l.qty, unit: l.price / l.qty, price: l.price, lot: l.id, own: l.seller === S.charId });
  }
  return out.sort((a, b) => a.unit - b.unit);
}

function marketItems(online) {
  const u = ahMarketSet();
  for (const l of marketLocalLots()) if (ITEMS[l.id]) u.add(l.id);
  for (const l of online || []) if (ITEMS[l.item]) u.add(l.item);
  return u;
}

function ahBuyLocal(i) {
  const l = marketLocalLots()[i];
  if (!l || !ITEMS[l.id]) return "That lot is gone.";
  if (save.gil < l.price) return "You need " + l.price + " crystals.";
  if (!giveItem(l.id, l.qty, true)) return "Your bag is full.";
  save.gil -= l.price;
  save.market.local.lots.splice(i, 1);
  if (l.kind === "merc") townPayBox(l.price, l.seller + " sold " + ITEMS[l.id].name + " to you");
  save.stats.ahBought = (save.stats.ahBought || 0) + l.qty;
  log("You buy " + (l.qty > 1 ? l.qty + " " + ITEMS[l.id].name + "s" : an(ITEMS[l.id].name)) + " from " + (l.seller || "the market") + " for " + l.price + " crystals.", "loot");
  sfx("coin");
  saveGame();
  return "";
}

function ahBuy(id, qty, town) {
  qty = Math.max(1, qty || 1);
  if (!ahTradable(id)) return "That isn't sold here.";
  if ((town ? ahStockAt(id, town) : ahStock(id)) < qty) return "Not enough on the market today.";
  const cost = marketPrice(id) * qty;
  if (save.gil < cost) return "You need " + cost + " crystals.";
  if (!giveItem(id, qty, true)) return "Your bag is full.";
  save.gil -= cost;
  let need = qty;
  for (const t of town ? [town] : [ahHere()].concat(ahTowns().filter(x => x !== ahHere()))) {
    const take = Math.min(need, ahStockAt(id, t));
    if (take > 0) { const b = ahBoughtOf(t); b[id] = (b[id] || 0) + take; need -= take; }
    if (need <= 0) break;
  }
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
  for (const b of save.market.box) { if (b.gil) { save.gil += b.gil; got++; continue; } if (giveItem(b.id, b.qty, true)) got++; else left.push(b); }
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
  if (typeof player !== "undefined" && ch === player && typeof save !== "undefined" && Array.isArray(save.spells) && !save.spells.includes(sp.id)) return false;
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
    if (a.buffs.silence) return "You are silenced.";
    if (recastLeft(a, "ma:" + act.id) > 0) return sp.name + " is not ready.";
    if (a.mp < sp.mp) return "Not enough MP.";
    if (sp.target === "enemy" && (!t || !isMob(t) || !t.alive)) return "No valid target.";
    if (sp.target === "ally" && (!t || !(isParty(t) || (a === player && isMate(t))) || !t.alive)) return "Invalid target.";
    if (sp.target === "dead" && (!t || !(isParty(t) || (a === player && isMate(t))) || t.alive || t === a)) return "Target a KO'd party member.";
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
    if (t.proxy) netChainOut(t);
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
  if (t.proxy) netChainOut(t);
}

function doAbility(a, id, t) {
  const ab = ABILITIES[id];
  a.lastJA = S.time; a.lastJAId = id;
  if (a === player) save.stats.abilitiesUsed++;
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
  if (ab.tp) {
    if (a.tp < ab.tp) { log("Not enough TP for " + ab.name + " (" + ab.tp + " needed).", "sys"); a.recasts["ja:" + id] = 0; sfx("error"); return; }
    a.tp -= ab.tp;
  }
  if (id === "activate") { activateAutomaton(a); return; }
  if (id === "full_circle" || id === "mending_halation") {
    if (!a.luopan) { log("You have no luopan out.", "sys"); a.recasts["ja:" + id] = 0; return; }
    if (id === "full_circle") { const back = Math.floor(a.luopan.mp / 2); a.mp = Math.min(a.maxMp, a.mp + back); log(subj(a) + " " + vb(a, "dismiss", "dismisses") + " the luopan and " + vb(a, "recover", "recovers") + " " + back + " MP.", cls(a)); }
    else { for (const p of S.party) if (p.alive && dist(p, a) < 300) { const h = Math.min(p.maxHp - p.hp, Math.round(p.maxHp * 0.2)); p.hp += h; popText(p, "+" + h, "#9ad06b", 14, 1); vfx("cure", { tgt: p }); } log(subj(a) + " " + vb(a, "shatter") + " the luopan in a wave of healing light.", cls(a)); sfx("cure", a); }
    a.luopan = null;
    return;
  }
  if (id === "kindle_rune" || id === "rime_rune" || id === "gale_rune" || id === "stone_rune") {
    const el = { kindle_rune: "fire", rime_rune: "ice", gale_rune: "wind", stone_rune: "earth" }[id];
    const r = a.buffs.runes && S.time < a.buffs.runes.until ? a.buffs.runes : { list: [] };
    r.list.push(el); if (r.list.length > 3) r.list.shift();
    r.until = S.time + 300;
    a.buffs.runes = r;
    log(subj(a) + " " + vb(a, "carve") + " " + an(ab.name) + " (" + r.list.length + "/3).", cls(a));
    popText(a, ab.name, ELEMENT_COLORS[el], 13, 1, 14); ring(a, ELEMENT_COLORS[el], 22, 0.4); sfx("buff", a);
    return;
  }
  if (id === "lunge") {
    const r = a.buffs.runes;
    if (!r || !r.list.length) { log("You have no runes to release.", "sys"); a.recasts["ja:" + id] = 0; return; }
    let dmg = 0;
    for (const el of r.list) dmg += (a.lv * 6 + a.stats.int * 1.2) * ((t.fam.weak && t.fam.weak[el]) || 1);
    dmg = Math.round(dmg * rand(0.9, 1.1));
    const el0 = r.list[r.list.length - 1];
    delete a.buffs.runes;
    log(subj(a) + " " + vb(a, "lunge") + " and " + vb(a, "release") + " " + (a === player ? "your" : "their") + " runes! The " + t.name + " takes " + dmg + " damage.", cls(a));
    vfx("nuke", { src: a, tgt: t, el: el0 }); sfx(el0, t);
    applyDamage(a, t, dmg, { color: ELEMENT_COLORS[el0], size: 22, enmity: ab.enmity + dmg });
    return;
  }
  if (id === "repair" || id === "tune_up") {
    const pet = S.pet;
    if (!pet || !pet.automaton || !pet.alive) { log("You have no automaton out.", "sys"); a.recasts["ja:" + id] = 0; return; }
    if (id === "repair") { const heal = Math.min(pet.maxHp - pet.hp, Math.round(pet.maxHp * 0.5)); pet.hp += heal; log("You repair your automaton. It recovers " + heal + " HP.", "you"); popText(pet, "+" + heal, "#9ad06b", 15, 1.1); sfx("equip", pet); }
    else { pet.buffs.warcry = { until: S.time + 60 }; log("You tune up your automaton. Its attack rises!", "you"); popText(pet, "Tune Up", "#ab47bc", 14, 1.1); ring(pet, "#ab47bc", 26, 0.5); sfx("buff", pet); }
    return;
  }
  if (id === "healing_waltz" || id === "group_waltz") {
    const near = S.party.filter(p => p.alive && dist(p, a) < 300);
    const tgts = id === "group_waltz" ? near : [near.slice().sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0] || a];
    const amt = Math.round(a.lv * 9 + a.stats.mnd * 2 + a.stats.agi);
    for (const p of tgts) { const h = Math.min(p.maxHp - p.hp, id === "group_waltz" ? Math.round(amt * 0.7) : amt); p.hp += h; popText(p, "+" + h, "#9ad06b", 15, 1.1); vfx("cure", { tgt: p }); }
    log(subj(a) + " " + vb(a, "dance", "dances") + " " + ab.name + (tgts.length === 1 && tgts[0] !== a ? " for " + tgts[0].name : "") + ".", cls(a));
    sfx("cure", a);
    return;
  }
  if (id === "quick_step") {
    const st = t.buffs.stepped;
    t.buffs.stepped = { until: S.time + 60, n: Math.min(5, (st ? st.n : 0) + 1), src: a };
    log(subj(a) + " " + vb(a, "use") + " Quick Step. The " + t.name + " is off balance (" + t.buffs.stepped.n + ").", cls(a));
    popText(t, "Step " + t.buffs.stepped.n, "#f06292", 13, 0.9); addEnmity(t, a, ab.enmity); aggro(t, a); sfx("miss", a);
    return;
  }
  if (id === "rising_flourish") {
    const n = t.buffs.stepped ? t.buffs.stepped.n : 0;
    if (!n) { log("The " + t.name + " isn't off balance. Use Quick Step first.", "sys"); a.recasts["ja:" + id] = 0; return; }
    delete t.buffs.stepped;
    const dmg = Math.max(1, Math.floor(baseDmg(a, t) * pDIF(a, t) * (1 + 0.5 * n)));
    log(subj(a) + " " + vb(a, "use") + " Rising Flourish! The " + t.name + " takes " + dmg + " damage.", cls(a));
    popText(a, "Rising Flourish", "#f06292", 14, 1.1, 14); sfx("crit", t); vfx("hit", { src: a, tgt: t, crit: true, slash: true });
    applyDamage(a, t, dmg, { enmity: ab.enmity + dmg, size: 20 });
    return;
  }
  if (id === "light_arts" || id === "dark_arts") {
    delete a.buffs.light_arts; delete a.buffs.dark_arts;
    a.buffs[id] = { until: S.time + 7200 };
    log(subj(a) + " " + vb(a, "turn") + " to " + ab.name + ".", cls(a));
    popText(a, ab.name, id === "light_arts" ? "#fff59d" : "#9575cd", 14, 1.2, 14); sfx("buff", a); vfx("buff", { tgt: a, id });
    return;
  }
  if (id === "call_beast") { callBeast(a); return; }
  if (id === "reward") {
    const pet = S.pet;
    if (!pet || !pet.beast || !pet.alive) { log("You have no beast to reward.", "sys"); a.recasts["ja:" + id] = 0; return; }
    const heal = Math.min(pet.maxHp - pet.hp, Math.round(pet.maxHp * 0.4));
    pet.hp += heal;
    log("You give your " + pet.name + " a treat. It recovers " + heal + " HP.", "you");
    popText(pet, "+" + heal, "#9ad06b", 15, 1.1); vfx("cure", { tgt: pet }); sfx("cure", pet);
    return;
  }
  if (id === "feral_howl") {
    t.buffs.weaken = { until: S.time + 30 };
    log(subj(a) + " " + vb(a, "let") + " out a Feral Howl. The " + t.name + " cowers!", cls(a));
    popText(t, "Cowed", "#8d6e63", 13, 1); ring(a, "#8d6e63", 40, 0.6); sfx("provoke", a);
    addEnmity(t, a, ab.enmity); aggro(t, a);
    return;
  }
  if (id === "phantom_roll") { rollDice(a, "valor_roll", false); return; }
  if (id === "hawk_roll") { rollDice(a, "hawk_roll", false); return; }
  if (id === "double_down") {
    if (!a.lastRoll) { log("You have no roll to double down on.", "sys"); a.recasts["ja:" + id] = 0; return; }
    rollDice(a, a.lastRoll.kind, true); return;
  }
  if (id === "quick_shot") {
    const dmg = Math.max(1, Math.round((10 + a.lv * 4 + a.stats.agi * 0.8) * rand(0.9, 1.15)));
    a.face = Math.atan2(t.y - a.y, t.x - a.x);
    log(subj(a) + " " + vb(a, "fire") + " a Quick Shot! The " + t.name + " takes " + dmg + " damage.", cls(a));
    vfx("arrow", { src: a, tgt: t }); sfx("blunt", t);
    applyDamage(a, t, dmg, { enmity: ab.enmity + dmg });
    if (t.alive) aggro(t, a);
    return;
  }
  if (id === "meditate") {
    a.tp = Math.min(CONFIG.tpMax, a.tp + 400);
    log(subj(a) + " " + vb(a, "meditate", "meditates") + " and " + vb(a, "gain", "gains") + " 400 TP.", cls(a));
    popText(a, "Meditate", "#e0a060", 14, 1.2, 14);
    ring(a, "#e0a060", 30, 0.6); sfx("buff", a); vfx("buff", { tgt: a, id: "meditate" });
    return;
  }
  if (id === "smoke_step") {
    for (const m of S.mobs) if (m.alive && m.enmity && m.enmity.has(a)) m.enmity.set(a, Math.floor(m.enmity.get(a) / 2));
    log(subj(a) + " " + vb(a, "vanish", "vanishes") + " in a puff of smoke. Enemies lose track of " + (a === player ? "you" : "them") + ".", cls(a));
    popText(a, "Smoke Step", "#78909c", 14, 1.2, 14);
    vfx("interrupt", { tgt: a }); sfx("buff", a);
    return;
  }
  if (id === "jump" || id === "high_jump") {
    const high = id === "high_jump";
    a.face = Math.atan2(t.y - a.y, t.x - a.x);
    a.jumpAt = S.time; a.jumpHigh = high;
    let dmg = Math.max(1, Math.floor(baseDmg(a, t) * pDIF(a, t) * (high ? 1.9 : 1.45)));
    if (a.buffs.dragon_spirit) dmg = Math.floor(dmg * 1.15);
    a.tp = Math.min(CONFIG.tpMax, a.tp + (high ? 150 : 100));
    log(subj(a) + " " + vb(a, "use") + " " + ab.name + "! The " + t.name + " takes " + dmg + " damage.", cls(a));
    popText(a, ab.name, "#5c8adb", 14, 1.1, 18);
    sfx("crit", t); vfx("hit", { src: a, tgt: t, crit: true, slash: false });
    applyDamage(a, t, dmg, { enmity: ab.enmity + dmg, size: 20 });
    if (high && t.alive && t.enmity && t.enmity.has(a)) t.enmity.set(a, Math.floor(t.enmity.get(a) / 2));
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
  a.casting = { id, sp, t, start: S.time, end: S.time + sp.cast * (sp.kind === "song" && a.buffs.encore ? 0.34 : 1) * (artsMatch(a, sp) ? 0.8 : 1) };
  if (t !== a) a.face = Math.atan2(t.y - a.y, t.x - a.x);
  if (a === player) { S.moveTarget = null; S.chase = false; }
  log(subj(a) + " " + vb(a, "start") + " casting " + sp.name + (t !== a ? " on " + obj(t) : "") + ".", cls(a));
  sfx("cast", a);
  vfx("cast", { src: a, sp });
}

function interruptCast(e) {
  if (!e.casting) return;
  e.lastIntr = S.time;
  log(e === player ? "Your casting is interrupted." : e.name + "'s casting is interrupted.", cls(e));
  popText(e, "Interrupted", "#bbbbbb", 12, 0.9, 14);
  sfx("interrupt", e);
  vfx("interrupt", { tgt: e });
  e.casting = null;
}

function finishCast(a) {
  const { sp, t, id } = a.casting;
  a.casting = null;
  if (a === player) save.stats.spellsCast++;
  if (sp.kind === "raise") { if (t.alive) { log(sp.name + " has no effect: " + (t === player ? "you are" : t.name + " is") + " not KO'd.", "missc"); return; } if (t.kind === "remote") { if (typeof netCastOn === "function") netCastOn(a, t, sp, id); log(subj(a) + " " + vb(a, "cast") + " " + sp.name + " on " + t.name + ".", cls(a)); return; } log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ".", cls(a)); revive(t, sp.pow, a === player ? null : a.name); return; }
  if (!t.alive) { log(sp.name + " fizzles: the target is gone.", cls(a)); return; }
  const white = sp.kind === "heal" || sp.kind === "buff" || sp.kind === "dot";
  const free = white && a.buffs.penury;
  const cost = free ? 0 : Math.ceil(sp.mp * (artsMatch(a, sp) ? 0.9 : 1));
  if (a.mp < cost) { log("Not enough MP for " + sp.name + ".", cls(a)); return; }
  if (dist(a, t) > CONFIG.castRange + 40) { log(sp.name + " fizzles: the target moved out of range.", cls(a)); return; }
  if (free) delete a.buffs.penury;
  a.mp -= cost;
  a.recasts["ma:" + id] = S.time + sp.recast;
  touch(a);
  if (a === player) trySkillUp(spellSkill(sp), isMob(t) ? t.lv : null);
  if (isMate(t)) { netCastOn(a, t, sp, id); return; }
  if (sp.kind === "heal") castHeal(a, t, sp);
  else if (sp.kind === "nuke") castNuke(a, t, sp);
  else if (sp.kind === "bluephys") castBluePhys(a, t, sp);
  else if (sp.kind === "geo") castGeo(a, t, sp, id);
  else if (sp.kind === "dot") castDia(a, t, sp);
  else if (sp.kind === "debuff") castDebuff(a, t, sp);
  else if (sp.kind === "buff") castBuff(a, t, sp);
  else if (sp.kind === "cleanse") castCleanse(a, t, sp);
  else if (sp.kind === "warp") castWarp(a, sp);
  else if (sp.kind === "summon") summonPet(a, sp);
  else if (sp.kind === "song") castSong(a, sp);
  else if (sp.kind === "drain" || sp.kind === "aspir") castDrain(a, t, sp);
  if (a !== player && a.mp < a.maxMp * 0.15) partySay(a, "lowmp");
}

function cureAmount(a, sp) {
  const power = Math.floor(a.stats.mnd / 2) + Math.floor(a.stats.vit / 4) + skillOf(a, "healing");
  const tier = sp.cure.t.find(x => power < x[0]);
  return Math.max(sp.cure.min, Math.floor((power - tier[3]) / tier[1] + tier[2]));
}
function healAmount(a, sp) {
  if (sp.cure) {
    let c = cureAmount(a, sp);
    if (a.buffs.divine_seal) { c *= 2; delete a.buffs.divine_seal; }
    return c;
  }
  let amt = (sp.power + a.stats.mnd * sp.mnd + skillOf(a, "healing") * 0.3) * (1 + 0.06 * (a.lv - 1));
  if (a.buffs.divine_seal) { amt *= 2; delete a.buffs.divine_seal; }
  return Math.round(amt * rand(0.95, 1.05));
}

function castHeal(a, t, sp) {
  const amt = healAmount(a, sp);
  const group = sp.aoe ? S.party.filter(p => p.alive && dist(p, t) <= sp.aoe) : [t];
  const parts = [];
  let total = 0;
  for (const g of group) {
    const real = Math.max(0, Math.min(amt, g.maxHp - g.hp));
    g.hp += real;
    total += real;
    parts.push(subj(g) + " " + vb(g, "recover") + " " + real + " HP");
    if (real > 0) {
      popText(g, "+" + real, "#9ad06b", 18);
      ring(g, "#9ad06b", 30, 0.6, "sparkle");
      sfx("cure", g);
      vfx("cure", { src: a, tgt: g, big: sp.power > 40 || !!sp.aoe });
    } else popText(g, "No effect", "#bbbbbb", 13, 0.9);
  }
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". " + parts.join(", ") + ".", cls(a));
  if (a !== player && t !== a) partySay(a, "cure");
  for (const m of S.mobs) if (m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty)) addEnmity(m, a, total * 1.5);
}

function magicHit(a, t, sp) {
  return clamp(70 + 0.8 * skillOf(a, spellSkill(sp)) - 3.5 * t.lv + 3 * (a.lv - t.lv) + 3.5 * a.lv, 25, 95);
}

function castNuke(a, t, sp) {
  const list = sp.aoe ? S.mobs.filter(m => m.alive && (m === t || dist(m, t) <= sp.aoe)) : [t];
  for (const m of list) if (m.alive) nukeOne(a, m, sp);
}
function nukeOne(a, t, sp) {
  const dStat = a.stats[sp.stat] - t.stats[sp.stat];
  let dmg = sp.k != null
    ? sp.power + sp.k * Math.max(-40, Math.min(dStat, 50)) + sp.k2 * Math.max(0, Math.min(dStat, 100) - 50)
    : (sp.power + 1.5 * Math.max(0, dStat)) * (1 + 0.08 * (a.lv - 1));
  if (sp.k != null && t.fam.undead && sp.element === "light") dmg *= 1.5;
  dmg *= (t.fam.weak && t.fam.weak[sp.element]) || 1;
  if (t.buffs["threnody_" + sp.element]) dmg *= 1 + t.buffs["threnody_" + sp.element].pow;
  if (sp.element === dayElement()) dmg *= 1.1;
  if (sp.element && sp.element === weatherElement()) dmg *= 1.1;
  if (sp.blue && a.buffs.burst_affinity) { dmg *= 1.5; delete a.buffs.burst_affinity; }
  if (!sp.blue && a.buffs.ebullience) { dmg *= 1.3; delete a.buffs.ebullience; }
  if (a.buffs.geo_focus) dmg *= 1.12;
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

const SONG_KEYS = ["minuet", "paeon", "ballad", "madrigal", "march", "minne", "mambo", "pastoral", "operetta"];
const SONG_RES = { poison: "pastoral", silence: "operetta" };

function applySong(p, a, sp) {
  const have = SONG_KEYS.filter(k => p.buffs[k] && k !== sp.song).sort((x, y) => p.buffs[x].until - p.buffs[y].until);
  while (have.length >= 2) delete p.buffs[have.shift()];
  let pow;
  if (sp.base != null) {
    pow = sp.base;
    const sk = skillOf(a, "singing");
    if (sk > sp.sreq) pow = sp.div ? Math.floor(sp.base + (sk - sp.sreq) / sp.div) : sp.sreq > 0 ? sp.base + 1 : sp.base;
    pow = Math.min(sp.cap, pow);
  } else {
    const sk = (1 + skillOf(a, "singing") / 400) * (1 + ((a.stats && a.stats.chr) || 0) / 500);
    pow = sp.song === "madrigal" ? Math.round(sp.pow * sk) : sp.pow * sk;
  }
  p.buffs[sp.song] = { until: S.time + sp.dur, pow, src: a, next: S.time + 3, id: sp.name, flat: sp.base != null };
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
  let amt, resist = 1;
  if (sp.absorb) {
    const top = skillOf(a, "dark") * sp.absorb[0] + sp.absorb[1];
    amt = top * rand(0.5, 1);
    if (t.fam.undead) { log(sp.name + " has no effect on the " + t.name + ".", cls(a)); return; }
    if (Math.random() * 100 >= magicHit(a, t, sp)) resist = 0.5;
    amt = Math.max(1, Math.floor(amt * resist));
  } else {
    amt = (sp.power + skillOf(a, "dark") * 0.25 + Math.max(0, a.stats.int - t.stats.int)) * (1 + 0.07 * (a.lv - 1));
    if (Math.random() * 100 >= magicHit(a, t, sp)) resist = 0.5;
    amt = Math.max(1, Math.round(amt * resist * rand(0.9, 1.1) * (mp ? 0.6 : 1)));
  }
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
  const landed = !immune && (sp.buff === "flash" && !sp.stat || Math.random() * 100 < magicHit(a, t, sp) + 10);
  ring(t, col, 30, 0.5, "element");
  sfx(sp.element === "light" ? "light" : "cast", t);
  vfx("nuke", { src: a, tgt: t, el: sp.element, dia: true });
  if (!landed) { log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ", but the " + t.name + " resists.", cls(a)); popText(t, "Resist", "#bbbbbb", 13, 0.9); addEnmity(t, a, 20); aggro(t, a); return; }
  const dS = sp.stat ? Math.max(-40, Math.min(40, a.stats[sp.stat] - t.stats[sp.stat])) : 0;
  const pw = sp.buff === "slow" ? Math.max(0.073, Math.min(0.292, 0.146 + dS * 0.0018)) : sp.buff === "paralyze" ? Math.max(0.05, Math.min(0.25, 0.15 + dS * 0.0025)) : sp.buff === "flash" && sp.stat ? Math.max(0.05, Math.min(0.5, (dS + 80) / 400)) : null;
  t.buffs[sp.buff] = { until: S.time + sp.dur, src: a };
  if (pw != null) t.buffs[sp.buff].pow = pw;
  if (sp.thr) t.buffs[sp.buff].pow = sp.thr;
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " is " + { flash: "blinded", slow: "slowed", paralyze: "paralyzed", sleep: "lulled to sleep", stun: "stunned", bind: "bound in place", silence: "silenced" }[sp.buff] || "weakened to " + sp.element + ".", cls(a));
  popText(t, sp.name, col, 14, 1.1);
  if (sp.buff === "stun" && t.readying) { t.readying = null; t.tp = Math.floor(t.tp / 2); log("The " + t.name + "'s " + t.fam.tpMove.name + " is cut short!", cls(a)); }
  if (sp.buff === "sleep") { t.swingTimer = Math.max(t.swingTimer, 1); t.readying = null; }
  addEnmity(t, a, sp.enmity || 60);
  aggro(t, a);
}

const EN_KEYS = ["enthunder", "enstone", "enaero"];
const EN_EL = { enthunder: "lightning", enstone: "earth", enaero: "wind" };
const BAR_EL = { fire: "barfire", earth: "barstone", water: "barwater", wind: "baraero" };
const BAR_ST = { poison: "barpoison", paralyze: "barparalyze", flash: "barblind", sleep: "barsleep" };
function applyBuffTo(a, t, sp) {
  const b = t.buffs[sp.buff] = { until: S.time + sp.dur + (sp.rnd ? 60 * Math.floor(Math.random() * 3) : 0), src: a };
  if (sp.pow != null) b.pow = sp.pow;
  if (sp.bar) b.pow = Math.min(0.35, (40 + Math.floor(skillOf(a, "enhancing") / 5)) / 400);
  if (sp.barst) b.pow = 0.5;
  if (sp.buff === "shadows") b.n = sp.n + (a.lv >= 12 && !sp.exact ? 1 : 0);
  if (sp.spikes) b.pow = Math.max(1, Math.min(sp.spikes.max, Math.floor((a.stats.int + 50) / sp.spikes.div)));
  if (sp.en) { const sk = skillOf(a, "enhancing"); b.pow = sk > 150 ? Math.floor(sk / 20) + 5 : Math.max(Math.floor(Math.sqrt(sk)) - 1, 1); }
  if (sp.buff === "aquaveil") b.n = sp.n + (skillOf(a, "enhancing") > 300 ? 1 : 0);
  popText(t, sp.name, "#9ad06b", 13, 1.1, 14);
  ring(t, "#9ad06b", 26, 0.5);
  vfx("buff", { tgt: t, id: sp.buff });
}
function castBuff(a, t, sp) {
  const group = sp.party ? S.party.filter(p => p.alive && dist(p, t) <= 300) : [t];
  for (const g of group) applyBuffTo(a, g, sp);
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + " on " + (sp.party ? "the party" : obj(t)) + ".", cls(a));
  sfx("buff", t);
  for (const m of S.mobs) if (m.alive && m.state === "combat" && group.some(g => m.enmity.has(g))) addEnmity(m, a, 30);
}
function castCleanse(a, t, sp) {
  const gone = sp.cleanse.filter(k => t.buffs[k]);
  for (const k of sp.cleanse) delete t.buffs[k];
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + " on " + obj(t) + (gone.length ? ". " + gone.map(k => BUFF_NAMES[k] || k).join(", ") + " is cured." : ", but nothing happens."), cls(a));
  popText(t, gone.length ? "Cured" : sp.name, "#9ad06b", 13, 1.1, 14);
  ring(t, "#fff59d", 26, 0.5, "sparkle");
  sfx("heal", t);
  vfx("buff", { tgt: t, id: "cleanse" });
}
function castWarp(a, sp) {
  if (a !== player) return;
  log("You are drawn back to your home point.", "sys");
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
}
function inflictStatus(m, tg, key, dur, pow) {
  const bar = BAR_ST[key], song = SONG_RES[key];
  if (song && tg.buffs[song] && Math.random() < Math.min(0.75, tg.buffs[song].pow / 50)) { popText(tg, "Resisted", "#bbbbbb", 12, 0.9, 12); return false; }
  if (bar && tg.buffs[bar] && Math.random() < tg.buffs[bar].pow) { popText(tg, "Resisted", "#bbbbbb", 12, 0.9, 12); return false; }
  const b = tg.buffs[key] = { until: S.time + dur, src: m };
  if (pow != null) b.pow = pow;
  if (key === "poison") { b.tick = 1 + Math.floor(tg.lv / 5); b.next = S.time + 3; b.el = "dark"; }
  popText(tg, BUFF_NAMES[key] || key, "#d7b46a", 12, 0.9, 12);
  return true;
}

function dotTick(a, d) {
  if (d.pot) { const v = a.stats[d.pot]; return 1 + (v > 150 ? 4 : v > 100 ? 3 : v > 70 ? 2 : v > 40 ? 1 : 0); }
  if (!d.skill) return d.tick;
  const raw = skillOf(a, d.skill) / d.div;
  return Math.max(d.min || 1, Math.min(d.max || 999, d.ceil ? Math.ceil(raw) : raw));
}
function castDia(a, t, sp) {
  const list = sp.aoe ? S.mobs.filter(m => m.alive && (m === t || dist(m, t) <= sp.aoe)) : [t];
  for (const m of list) if (m.alive) diaOne(a, m, sp);
}
function diaOne(a, t, sp) {
  const el = sp.element || "light", key = sp.buff || "dia";
  if (sp.dot) {
    ring(t, ELEMENT_COLORS[el], 30, 0.5, "element");
    sfx(el === "light" ? "light" : "cast", t);
    vfx("nuke", { src: a, tgt: t, el, dia: true });
    const up = key === "dia" ? t.buffs.blight : key === "blight" ? t.buffs.dia : null;
    if (up) { delete t.buffs[key === "dia" ? "blight" : "dia"]; }
    for (const r of sp.replaces || []) delete t.buffs[r];
    if (Math.random() * 100 >= magicHit(a, t, sp) + 15) { log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ", but the " + t.name + " resists.", cls(a)); popText(t, "Resist", "#bbbbbb", 13, 0.9); addEnmity(t, a, 20); aggro(t, a); return; }
    const direct = Math.round(sp.power);
    log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + (direct > 0 ? " takes " + direct + " damage and" : "") + " is afflicted with " + sp.name + ".", cls(a));
    if (direct > 0) applyDamage(a, t, direct, { color: ELEMENT_COLORS[el], size: 16, enmity: 120 });
    else { addEnmity(t, a, 120); aggro(t, a); }
    if (t.alive) {
      const tk = dotTick(a, sp.dot);
      t.buffs[key] = { until: S.time + sp.dot.dur, next: S.time + 3, tick: tk, src: a, el, sd: (tk - 1) * 2 + 5 };
    }
    return;
  }
  const dmg = Math.round(sp.power * (1 + 0.08 * (a.lv - 1)));
  ring(t, ELEMENT_COLORS[el], 30, 0.5, "element");
  sfx(el === "light" ? "light" : "cast", t);
  vfx("nuke", { src: a, tgt: t, el, dia: true });
  log(subj(a) + " " + vb(a, "cast") + " " + sp.name + ". The " + t.name + " takes " + dmg + " damage and is afflicted with " + sp.name + ".", cls(a));
  applyDamage(a, t, dmg, { color: ELEMENT_COLORS[el], size: 16, enmity: 120 });
  if (t.alive) t.buffs[key] = { until: S.time + 30, next: S.time + 3, tick: Math.max(1, Math.round(1 + a.lv * 0.4)), src: a, el };
}

function spellLearnable(sp, ch) { ch = ch || player; const subLv = ch.sub ? Math.floor(ch.lv / 2) : 0; return Object.entries(sp.jobs).some(([j, l]) => (j === ch.job && ch.lv >= l) || (j === ch.sub && subLv >= l)); }
function learnSpell(itemId) {
  const it = ITEMS[itemId], sp = SPELLS[it.spell];
  if (!sp) return;
  if (save.spells.includes(sp.id)) { log("You already know " + sp.name + ".", "sys"); sfx("error"); return; }
  if (!spellLearnable(sp)) { log("You can't learn " + sp.name + " right now. Your main or support job must be " + Object.entries(sp.jobs).map(([j, l]) => JOBS[j].name + " at Lv." + l).join(" or ") + " (a support job counts at half your level).", "sys"); sfx("error"); return; }
  if (!removeItem(itemId, 1)) return;
  save.spells.push(sp.id);
  log("You learn " + sp.name + "!", "loot");
  popText(player, "Learned " + sp.name, "#9fe8ff", 15, 2, 30);
  sfx("unlock");
  if (typeof syncHotbar === "function") syncHotbar();
  saveGame();
}
function useItem(id) {
  const it = ITEMS[id];
  if (!it || (!player.alive && !it.revive)) return;
  if (player.casting) { log("You cannot use items while casting.", "sys"); return; }
  if (S.time < S.itemReadyAt) { log("You must wait " + fmt(S.itemReadyAt - S.time) + "s to use another item.", "sys"); return; }
  if (invCount(id) < 1) return;
  save.stats.itemsUsed++;
  if (it.enchant === "warp") { S.itemReadyAt = S.time + 5; castWarp(player); return; }
  if (it.kind === "food") { eatFood(id); return; }
  if (it.spell) { learnSpell(id); return; }
  if (it.recipe) { learnRecipe(id); return; }
  if (it.kind === "pet") { if (learnBuddy(it.pet)) removeItem(id, 1); return; }
  if (it.fishing) { const why = startFishing(); if (why) { log(why, "sys"); sfx("error"); } return; }
  if (it.revive) {
    const t = !player.alive ? player : (isParty(player.target) || isMate(player.target)) && !player.target.alive ? player.target : S.party.find(p => p !== player && !p.alive);
    if (!t) { log("Target a KO'd party member to use the " + it.name + ".", "sys"); sfx("error"); return; }
    if (t !== player && dist(t, player) > CONFIG.castRange) { log(t.name + " is too far away.", "sys"); sfx("error"); return; }
    removeItem(id, 1); S.itemReadyAt = S.time + 3;
    log(t === player ? "You use " + an(it.name) + "." : "You use " + an(it.name) + " on " + t.name + ".", "you");
    if (t.kind === "remote") { if (typeof netCastOn === "function") netCastOn(player, t, SPELLS.raise, "raise", it.revive); } else revive(t, it.revive, null);
    return;
  }
  if (it.reraise) {
    player.buffs.reraise = { until: S.time + (it.rrSecs || 3600), pct: it.reraise };
    log("You use " + an(it.name) + ". Reraise will bring you back if you are KO'd.", "you");
    ring(player, "#fff4c0", 26, 0.5, "sparkle");
    sfx("potion", player);
    removeItem(id, 1);
    S.itemReadyAt = S.time + CONFIG.itemRecast;
    return;
  }
  const hpGain = it.heal || (it.healPct ? Math.round(player.maxHp * it.healPct) : 0), mpGain = it.mpRestore || (it.mpPct ? Math.round(player.maxMp * it.mpPct) : 0);
  if (!hpGain && !mpGain) return;
  if ((!hpGain || player.hp >= player.maxHp) && (!mpGain || player.mp >= player.maxMp)) { log(hpGain && mpGain ? "Your HP and MP are already full." : hpGain ? "Your HP is already full." : "Your MP is already full.", "sys"); sfx("error"); return; }
  if (hpGain) {
    const real = Math.min(hpGain, player.maxHp - player.hp);
    player.hp += real;
    popText(player, "+" + real, "#9ad06b", 18);
    log("You use " + an(it.name) + " and recover " + real + " HP.", "you");
  }
  if (mpGain) {
    const real = Math.min(mpGain, player.maxMp - player.mp);
    player.mp += real;
    popText(player, "+" + real + " MP", "#64b5f6", 16, 1, hpGain ? 20 : 0);
    log("You use " + an(it.name) + " and recover " + real + " MP.", "you");
  }
  ring(player, "#9ad06b", 24, 0.4, "sparkle");
  sfx("potion", player);
  vfx("potion", { tgt: player, mp: !!mpGain && !hpGain });
  removeItem(id, 1);
  S.itemReadyAt = S.time + CONFIG.itemRecast;
}

function tickBuffs(e) {
  for (const id in e.buffs) {
    const b = e.buffs[id];
    if (b.tick && b.next && b.src && S.time >= b.next && e.alive) {
      b.next += 3;
      applyDamage(b.src, e, b.tick, { color: ELEMENT_COLORS[b.el || "light"], size: 13, enmity: b.tick });
    }
    if ((id === "paeon" || id === "ballad") && S.time >= b.next && e.alive) {
      b.next += 3;
      const amt = b.flat ? Math.round(b.pow) : Math.round(b.pow * (1 + e.lv / 5));
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
  const hop = S.zone && S.zone.gates ? gateHop(e, tx, ty) : null;
  if (hop) { stepToward(e, hop.x, hop.y, dt, 0, speedMul); return false; }
  return stepToward(e, tx, ty, dt, stop, speedMul);
}
function stepToward(e, tx, ty, dt, stop, speedMul) {
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
  rects = rects.concat((z.walls || []).map(r => ({ x: r.x, y: r.y, w: r.w, h: r.h })), cityWallRects(z));
  if (z.ruins) {
    for (const [x1, y1, x2, y2] of z.ruins.walls) rects.push({ x: Math.min(x1, x2) - 14, y: Math.min(y1, y2) - 14, w: Math.abs(x2 - x1) + 28, h: Math.abs(y2 - y1) + 28 });
    for (const [x, y] of z.ruins.pillars) rects.push({ x: x - 16, y: y - 16, w: 32, h: 32 });
  }
  z._rects = rects;
  return rects;
}

const GATE_HALF = 55;
function cityWallRects(z) {
  if (z._cwr) return z._cwr;
  const out = [], T = 15;
  for (const [x1, y1, x2, y2] of z.cityWalls || []) {
    const horiz = y1 === y2, a = horiz ? Math.min(x1, x2) : Math.min(y1, y2), b = horiz ? Math.max(x1, x2) : Math.max(y1, y2);
    const cuts = (z.gates || []).filter(g => !!g.horiz === horiz && (horiz ? Math.abs(g.y - y1) < 2 && g.x > a && g.x < b : Math.abs(g.x - x1) < 2 && g.y > a && g.y < b)).map(g => horiz ? g.x : g.y).sort((p, q) => p - q);
    let st = a;
    for (const c of cuts.concat([b + GATE_HALF])) {
      const en = Math.min(b, c - GATE_HALF);
      if (en - st > 4) out.push(horiz ? { x: st, y: y1 - T, w: en - st, h: T * 2 } : { x: x1 - T, y: st, w: T * 2, h: en - st });
      st = c + GATE_HALF;
    }
  }
  for (const g of z.gates || []) for (const sd of [-1, 1]) {
    const cx = g.horiz ? g.x + sd * (GATE_HALF + 18) : g.x, cy = g.horiz ? g.y : g.y + sd * (GATE_HALF + 18);
    out.push({ x: cx - 22, y: cy - 22, w: 44, h: 44, tower: true });
  }
  return z._cwr = out;
}
function segRect(x1, y1, x2, y2, r, pad) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy], q = [x1 - (r.x - pad), r.x + r.w + pad - x1, y1 - (r.y - pad), r.y + r.h + pad - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}
function gateHop(e, tx, ty) {
  const z = S.zone;
  if (!z || !z.gates || !z.cityWalls) return null;
  if (!cityWallRects(z).some(r => segRect(e.x, e.y, tx, ty, r, 6))) return null;
  let best = null, bd = 1e9;
  for (const g of z.gates) {
    const n = g.horiz ? e.y - g.y : e.x - g.x, m = g.horiz ? ty - g.y : tx - g.x;
    if (!m || (n * m > 0 && Math.abs(n) > 40)) continue;
    const d = Math.hypot(g.x - e.x, g.y - e.y) + Math.hypot(tx - g.x, ty - g.y);
    if (d < bd) { bd = d; best = g; }
  }
  if (!best) return null;
  const g = best, n = g.horiz ? e.y - g.y : e.x - g.x, m = g.horiz ? ty - g.y : tx - g.x, lat = g.horiz ? e.x - g.x : e.y - g.y;
  const k = Math.abs(n) < 50 && Math.abs(lat) < 45 ? Math.sign(m) * 75 : (Math.sign(n) || -Math.sign(m)) * 45;
  return g.horiz ? { x: g.x, y: g.y + k } : { x: g.x + k, y: g.y };
}
function districtAt(z, x, y) {
  for (const d of (z && z.districts) || []) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return null;
}
function zoneSubtitle(zid) { const r = regionOf(zid), b = zoneBand(zid), a = areaOf(zid); return [a !== zid ? areaName(a) : "", r ? CONQUEST.regions[r].name : "", bandText(b)].filter(Boolean).join(" · "); }
function districtName(zid, x, y) { const d = districtAt(ZONES[zid], x, y); return d ? d.name : ""; }
function markDistrict(d) {
  if (!d) return false;
  if (!save.districts) save.districts = {};
  const key = S.zoneId + ":" + d.id, fresh = !save.districts[key];
  if (fresh) save.districts[key] = Date.now();
  return fresh;
}
function checkDistrict() {
  if (!S.zone.districts || !player.alive) return;
  const d = districtAt(S.zone, player.x, player.y), id = d ? d.id : null;
  if (id === S.district) return;
  S.district = id;
  if (!d) return;
  const fresh = markDistrict(d);
  log("You enter the " + d.name + " of " + (S.zone.city || S.zone.name) + ".", "sys");
  uiEvent("district", { d, fresh });
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
  if (aOnly && (a === player ? S.moveTarget || S.chase : a.moving !== false)) { a.x -= ny * push * 0.7; a.y += nx * push * 0.7; }
  if (!aOnly) { b.x -= nx * push; b.y -= ny * push; }
}

function autoAttack(a, dt) {
  const t = a.attackTarget;
  if (!a.engaged || !t) return;
  if (!t.alive) { a.engaged = false; a.attackTarget = null; return; }
  if (isMob(t) && !claimOk(t)) { a.engaged = false; a.attackTarget = null; if (a === player) log("The " + t.name + " is claimed by " + claimName(t) + ".", "sys"); return; }
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
  if (a.sight && d <= a.sight * visMul()) {
    if (d <= 60) return true;
    const diff = Math.abs(normAng(Math.atan2(p.y - m.y, p.x - m.x) - m.face));
    if (diff <= Math.PI * 0.45) return true;
  }
  if (a.sound && d <= a.sound && p.moving && !p.buffs.sneak) return true;
  if (a.magic && d <= a.magic && p.casting) return true;
  if (a.lowhp && d <= a.lowhp && p.hp / p.maxHp < 0.5 && !p.buffs.deodorize) return true;
  return false;
}

function updateMob(m, dt) {
  if (!m.alive) return;
  if (m.proxy) { netProxyStep(m, dt); return; }
  tickBuffs(m);
  if (!m.alive) return;
  if (m.chain && S.time > m.chain.closeAt) m.chain = null;
  if (m.burst && S.time > m.burst.until) m.burst = null;
  if ((m.state === "idle" || m.state === "return") && m.hp < m.maxHp && S.time - (m.lastHit || -99) > 5) m.hp = Math.min(m.maxHp, m.hp + m.maxHp * CONFIG.mobRegen * dt);
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
    if (m.state === "idle" && S.others && S.others.size) for (const o of S.others.values()) if (o.alive && o.placed && o.job && detects(m, o)) { aggro(m, o); break; }
    return;
  }
  if (m.state === "combat") {
    for (const [e, v] of m.enmity) m.enmity.set(e, Math.max(1, v * (1 - 0.04 * dt)));
    const t = topEnmity(m);
    if (!t) {
      if (t) log("The " + m.name + " loses interest.", "sys");
      m.state = "return";
      m.enmity.clear();
      m.readying = null;
      m.target = null;
      m.claim = null;
      return;
    }
    m.target = t;
    if (m.buffs.sleep || m.buffs.stun) { m.readying = null; if (m.casting) m.casting = null; return; }
    bossPhases(m, t);
    if (m.readying) {
      m.readying.t -= dt;
      if (m.readying.t <= 0) execTpMove(m);
      return;
    }
    if (m.casting) {
      m.face = Math.atan2(m.casting.t.y - m.y, m.casting.t.x - m.x);
      if (S.time >= m.casting.end) finishMobCast(m);
      return;
    }
    if (m.fam.spells && !m.buffs.silence && S.time >= (m.nextCast || 0) && dist(m, t) <= CONFIG.castRange && startMobCast(m, t)) return;
    if (!m.buffs.bind) moveToward(m, t.x, t.y, dt, mobReach(m) - 8);
    m.face = Math.atan2(t.y - m.y, t.x - m.x);
    m.swingTimer -= dt;
    if (m.swingTimer <= 0) {
      if (dist(m, t) <= mobReach(m)) {
        if (t.kind === "remote") { m.lastSwing = S.time; m.tp = Math.min(CONFIG.tpMax, m.tp + Math.round(CONFIG.tpPerDelay * m.delay)); netMobAttack(m, t, "sw"); }
        else swing(m, t);
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
      for (const p of S.party) if (p.alive && dist(p, m) <= f.pulse.r) { vfx("nuke", { src: m, tgt: p, el: f.pulse.el }); applyDamage(m, p, Math.round(f.pulse.dmg * m.lv * rand(0.9, 1.1)), { color: "#4fc3f7", size: 18, el: f.pulse.el }); }
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

function startMobCast(m, t) {
  if (t.kind === "remote") return false;
  const kin = S.mobs.filter(o => o.alive && o !== m && o.fam.spells && o.hp < o.maxHp * 0.5 && dist(o, m) <= CONFIG.castRange);
  const woundedSelf = m.hp < m.maxHp * 0.5 ? m : kin[0];
  let pick = null, tg = t;
  const cure = m.fam.spells.find(x => x.heal);
  if (cure && woundedSelf && Math.random() < 0.7) { pick = cure; tg = woundedSelf; }
  else {
    const offense = m.fam.spells.filter(x => !x.heal && !(x.status && t.buffs[x.status[0]]));
    if (!offense.length) return false;
    pick = offense[Math.floor(Math.random() * offense.length)];
  }
  const sp = SPELLS[pick.id];
  m.casting = { id: pick.id, sp, spec: pick, t: tg, start: S.time, end: S.time + Math.max(1.5, sp.cast + 1) };
  m.nextCast = S.time + rand(m.fam.castGap[0], m.fam.castGap[1]);
  log("The " + m.name + " starts casting " + sp.name + ".", "foe");
  popText(m, sp.name, "#ba68c8", 13, 1.2, 14);
  sfx("cast", m);
  vfx("cast", { src: m, sp });
  return true;
}
function finishMobCast(m) {
  const { sp, spec, t } = m.casting;
  m.casting = null;
  if (!t.alive) return;
  if (spec.heal) {
    const amt = Math.round(t.maxHp * spec.heal);
    t.hp = Math.min(t.maxHp, t.hp + amt);
    log("The " + m.name + " casts " + sp.name + ". The " + t.name + " recovers " + amt + " HP.", "foe");
    popText(t, "+" + amt, "#9ad06b", 16);
    ring(t, "#9ad06b", 28, 0.5, "sparkle");
    return;
  }
  log("The " + m.name + " casts " + sp.name + " on " + obj(t) + ".", "foe");
  ring(t, ELEMENT_COLORS[sp.element] || "#ce93d8", 32, 0.5, "element");
  vfx("nuke", { src: m, tgt: t, el: sp.element, dia: true });
  if (spec.status) { inflictStatus(m, t, spec.status[0], spec.status[1], spec.status[2]); return; }
  const dmg = Math.floor(baseDmg(m, t) * spec.mul * rand(0.9, 1.1));
  log(subj(t) + " " + vb(t, "take") + " " + dmg + " damage.", "foe");
  applyDamage(m, t, dmg, { color: ELEMENT_COLORS[sp.element], size: 20, el: sp.element });
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
  blueLearnFrom(m, mv);
  vfx("tpmove", { src: m, tgt: t, mv });
  if (S.others && S.others.size && !m.proxy) for (const o of S.others.values()) if (o.alive && (o === t || (mv.aoe && dist(o, t) <= mv.aoe))) netMobAttack(m, o, "tp");
  const targets = (mv.aoe ? S.party.filter(p => p.alive && dist(p, t) <= mv.aoe) : [t]).filter(x => x.kind !== "remote");
  for (const tg of targets) {
    let total = 0;
    for (let h = 0; h < (mv.hits || 1); h++) total += Math.floor(baseDmg(m, tg) * mv.mul * pDIF(m, tg));
    ring(tg, "#ff7043", mv.aoe || 30, 0.6, "burst");
    log(subj(tg) + " " + vb(tg, "take") + " " + total + " damage.", "foe");
    applyDamage(m, tg, total, { color: "#ff8a80", size: 22, el: mv.el });
    if (mv.slow && tg.alive) { tg.buffs.slow = { until: S.time + 20, src: m }; popText(tg, "Slowed", "#d7b46a", 12, 0.9, 12); }
    if (mv.sleepy && tg.alive && !tg.buffs.sleep && Math.random() < 0.5 && tg !== player && !(tg.buffs.barsleep && Math.random() < tg.buffs.barsleep.pow)) { tg.buffs.sleep = { until: S.time + 6, src: m }; popText(tg, "Asleep", "#b39ddb", 12, 0.9, 12); }
    if (mv.status && tg.alive) inflictStatus(m, tg, mv.status[0], mv.status[1], mv.status[2]);
    if (mv.drain && m.alive) { const heal = Math.min(total, m.maxHp - m.hp); m.hp += heal; if (heal > 0) popText(m, "+" + heal, "#9ad06b", 16); }
  }
  if (mv.explode && m.alive && !m.proxy) { m.hp = 0; onKO(m, m); }
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
  if (a.kiting) { const nt = closestOf({ x: tx, y: ty }, allyThreats()); if (nt && dist({ x: tx, y: ty }, nt) < CONFIG.allyKiteDist) return; }
  if (dist(a, player) > 700 && !partyInCombat()) { a.x = player.x - Math.cos(player.face) * 40 + rand(-20, 20); a.y = player.y - Math.sin(player.face) * 40 + rand(-20, 20); a.px = a.x; a.py = a.y; return; }
  if (Math.hypot(tx - a.x, ty - a.y) > 12) moveToward(a, tx, ty, dt, 4, (a.mounted ? mountMul() : 1) * (Math.hypot(tx - a.x, ty - a.y) > 160 ? 1.4 : 1));
}

function allyTry(a, act, t) {
  if (!act || checkAction(a, act, t)) return false;
  perform(a, act, t);
  return true;
}

function allyThreats() {
  return S.mobs.filter(m => m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty));
}

function closestOf(a, list) {
  let best = null, bd = 1e9;
  for (const m of list) { const d = dist(a, m); if (d < bd) { bd = d; best = m; } }
  return best;
}

function fleeFrom(a, list, dt, mul) {
  let vx = 0, vy = 0;
  for (const m of list) {
    const dx = a.x - m.x, dy = a.y - m.y, d = Math.hypot(dx, dy);
    if (d > 700) continue;
    const w = 300 / Math.max(d, 40);
    vx += (dx / Math.max(d, 1)) * w;
    vy += (dy / Math.max(d, 1)) * w;
  }
  const pd = dist(a, player);
  if (pd > 520) { vx += ((player.x - a.x) / pd) * 1.5; vy += ((player.y - a.y) / pd) * 1.5; }
  if (Math.hypot(vx, vy) < 0.01) return false;
  const step = a.speed * mul * dt;
  if (!a.fleeChk) a.fleeChk = { x: a.x, y: a.y, t: S.time };
  else if (S.time - a.fleeChk.t >= 0.6) {
    if (Math.hypot(a.x - a.fleeChk.x, a.y - a.fleeChk.y) < a.speed * mul * 0.6 * 0.35) { a.fleeTurn = (Math.random() < 0.5 ? -1 : 1) * 1.2; a.fleeTurnUntil = S.time + 1.5; }
    a.fleeChk = { x: a.x, y: a.y, t: S.time };
  }
  const ang = Math.atan2(vy, vx) + (S.time < (a.fleeTurnUntil || 0) ? a.fleeTurn : 0);
  a.x += Math.cos(ang) * step;
  a.y += Math.sin(ang) * step;
  a.face = ang;
  return true;
}

function allyMode(a, threatened, still) {
  if (!a.mercId) return null;
  const f = a.hp / a.maxHp;
  const full = a.hp >= a.maxHp * 0.995 && (a.maxMp <= 0 || a.mp >= a.maxMp * 0.99);
  const pd = dist(a, player);
  if (a.retreat === "rest") {
    if (full || (!threatened && pd > 600)) a.retreat = null;
  } else if (f < CONFIG.allyRestHp && (threatened || pd <= 450)) a.retreat = "rest";
  else if (a.retreat === "sit") {
    if (full || threatened || !still || pd > 600) a.retreat = null;
  } else if (!threatened && still && f <= CONFIG.allySitHp && pd <= 450) a.retreat = "sit";
  else if (a.retreat === "kite") { if (f > CONFIG.allyKiteExit) a.retreat = null; }
  else if (f <= CONFIG.allyKiteHp) a.retreat = "kite";
  if (!a.retreat) { a.fleeTurnUntil = 0; a.fleeChk = null; }
  return a.retreat || null;
}

function restAI(a, dt, threats, hold) {
  for (const m of threats) {
    if (!m.enmity.has(a)) continue;
    const held = [...m.enmity.keys()].some(e => e !== a && e.alive && isParty(e));
    if (held || m.target !== a || dist(a, m) > CONFIG.allyRestDist) m.enmity.delete(a);
  }
  a.engaged = false; a.attackTarget = null; a.target = null;
  if (!hold) {
    const chased = threats.some(m => m.enmity.has(a));
    const near = closestOf(a, threats);
    if ((chased || (near && dist(a, near) < CONFIG.allyKiteDist)) && fleeFrom(a, threats, dt, 1)) { if (a.resting) standUp(a, true); return; }
  }
  if (a.resting) return;
  if (canRest(a)) startRest(a);
}

function raiseAI(a, dt, still) {
  const down = S.party.find(p => p !== a && !p.alive && (p !== player || S.ko));
  if (!down) return false;
  const acts = actionList(a).filter(x => x.kind === "ma" && SPELLS[x.id] && SPELLS[x.id].kind === "raise").sort((p, q) => SPELLS[q.id].pow - SPELLS[p.id].pow);
  const act = acts.find(x => a.mp >= SPELLS[x.id].mp && !(a.recasts && a.recasts[x.id] > S.time));
  if (!act) return false;
  if ([...S.mobs].some(m => m.alive && m.target === a && m.state === "combat") && a.hp / a.maxHp < 0.5) return false;
  if (dist(a, down) > CONFIG.castRange * 0.8) {
    if (still) return false;
    moveToward(a, down.x, down.y, dt, CONFIG.castRange * 0.6);
    a.face = Math.atan2(down.y - a.y, down.x - a.x);
    return true;
  }
  if (allyTry(a, act, down)) { partySay(a, "raise"); return true; }
  return false;
}

function updateAlly(a, dt) {
  if (!a.alive) { a.retreat = null; a.kiting = false; return; }
  if (a.casting) return;
  if (a.mounted) { a.engaged = false; a.attackTarget = null; follow(a, dt); return; }
  const stance = save.stance || "assist";
  const tgt = stance === "follow" ? null : partyBattleTarget();
  const role = a.role;
  const hx = a.x, hy = a.y;
  if (stance === "hold" && !a.holdAt) a.holdAt = { x: a.x, y: a.y };
  if (stance !== "hold") a.holdAt = null;
  if (a.mercId) {
    const threats = allyThreats();
    const still = !player.moving && !player.engaged && S.time - (player.stillSince || 0) >= 1;
    const mode = allyMode(a, threats.length > 0, still);
    a.kiting = mode === "kite" && stance !== "hold";
    if (a.resting && !mode && !player.resting) standUp(a, true);
    if (mode === "rest" || mode === "sit") {
      restAI(a, dt, threats, stance === "hold");
      if (stance === "hold") { a.x = hx; a.y = hy; }
      return;
    }
    if (a.kiting) {
      const near = closestOf(a, threats);
      if (near && dist(a, near) < CONFIG.allyKiteDist - 15 && fleeFrom(a, threats, dt, 1)) { a.engaged = false; a.attackTarget = null; a.target = null; return; }
    }
  } else a.kiting = false;
  if (raiseAI(a, dt, a.kiting)) return;
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
  a.target = tgt;
  if (a.kiting && !(a.stats && a.stats.wtype === "archery")) { a.engaged = false; a.attackTarget = null; }
  else {
    a.attackTarget = tgt;
    a.engaged = true;
    moveToward(a, tgt.x, tgt.y, dt, reach(a) - 8);
    autoAttack(a, dt);
  }
  const acts = actionList(a);
  if (a.role === "tank") {
    const prov = acts.find(x => x.id === "provoke");
    if (prov && !a.kiting && tgt.state === "combat" && topEnmity(tgt) !== a && allyTry(a, prov, tgt)) return;
    const flash = acts.find(x => x.id === "flash");
    if (flash && !a.kiting && tgt.state === "combat" && (topEnmity(tgt) !== a || !tgt.buffs.flash) && allyTry(a, flash, tgt)) return;
    const sent = acts.find(x => x.id === "sentinel");
    if (sent && !a.kiting && tgt.state === "combat" && (a.hp < a.maxHp * 0.5 || topEnmity(tgt) !== a) && allyTry(a, sent, a)) return;
    const bash = acts.find(x => x.id === "shield_bash");
    if (bash && !a.kiting && tgt.readying && allyTry(a, bash, tgt)) return;
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
  const blt = acts.find(x => x.id === "bio");
  if (blt && !tgt.buffs.bio && tgt.state === "combat" && a.mp > a.maxMp * 0.4 && allyTry(a, blt, tgt)) return;
  for (const id of ["focus", "boost", "sneak_attack", "sharpshot", "barrage", "last_resort", "soulfire", "blood_blade"]) {
    const x = acts.find(q => q.id === id);
    if (x && !a.buffs[id] && dist(a, tgt) <= reach(a) && allyTry(a, x, a)) return;
  }
  if (smartAct(a, tgt, acts)) return;
  allyWeaponSkill(a, tgt, acts);
}

function bardAI(a, tgt, dt) {
  const acts = actionList(a);
  const songs = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "song");
  const best = {};
  for (const x of songs) { const sp = SPELLS[x.id]; if (!best[sp.song] || SPELLS[best[sp.song].id].pow < sp.pow) best[sp.song] = x; }
  const fighting = !!tgt && tgt.state === "combat";
  const casterHeavy = S.party.filter(p => p.alive && p.maxMp > 0 && p.role !== "dd" && p.role !== "tank").length >= 2;
  const order = fighting ? ["minuet", "madrigal", "minne", "paeon"] : ["paeon"];
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
    const lull = acts.find(x => x.id === "foe_lullaby");
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
  if (S.time >= (a.nextNuke || 0) && a.mp > a.maxMp * (a.kiting ? 0.1 : 0.6)) {
    const nukes = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "nuke").sort((p, q) => { const wp = (tgt.fam.weak || {})[SPELLS[p.id].element] || 1, wq = (tgt.fam.weak || {})[SPELLS[q.id].element] || 1; return SPELLS[q.id].power * wq - SPELLS[p.id].power * wp; });
    if (nukes.length && allyTry(a, nukes[0], tgt)) { a.nextNuke = S.time + (a.kiting ? rand(3, 5) : rand(9, 13)); return true; }
  }
  return false;
}

function smartAct(a, tgt, acts) {
  if (S.time < (a.nextSmart || 0)) return false;
  a.nextSmart = S.time + 1.5;
  const healer = S.party.some(p => p !== a && p.alive && (p.role === "healer" || p.role === "support") && !p.casting);
  const heals = acts.filter(x => x.kind === "ma" && SPELLS[x.id].kind === "heal").sort((p, q) => SPELLS[q.id].power - SPELLS[p.id].power);
  if (heals.length) {
    let low = null;
    for (const p of S.party) if (p.alive && (!low || p.hp / p.maxHp < low.hp / low.maxHp)) low = p;
    if (low && low.hp / low.maxHp < (healer ? 0.3 : 0.45)) for (const h of heals) if (allyTry(a, h, low)) return true;
  }
  for (const x of acts) {
    if (x.kind !== "ja") continue;
    const ab = ABILITIES[x.id];
    if (!ab || ab.target !== "self" || !ab.buff || a.buffs[ab.buff] || x.id === "provoke") continue;
    if (ab.hpBelow && a.hp > a.maxHp * ab.hpBelow) continue;
    if (dist(a, tgt) <= reach(a) + 20 && tgt.state === "combat" && allyTry(a, x, a)) return true;
  }
  if (tgt.state !== "combat" || dist(a, tgt) > CONFIG.castRange) return false;
  if (a.maxMp > 0 && a.mp > a.maxMp * 0.35) {
    const debuffs = acts.filter(x => x.kind === "ma" && (SPELLS[x.id].kind === "debuff" || SPELLS[x.id].kind === "dot") && !tgt.buffs[x.id] && !tgt.buffs[SPELLS[x.id].buff || x.id] && (x.id !== "silence" || tgt.fam.spells));
    for (const d of debuffs) if (allyTry(a, d, tgt)) return true;
  }
  if (a.maxMp > 0 && a.mp > a.maxMp * (a.kiting ? 0.1 : 0.55) && S.time >= (a.nextNuke || 0) && tgt.hp > tgt.maxHp * 0.2) {
    const weak = tgt.fam.weak || {};
    const nukes = acts.filter(x => x.kind === "ma" && (SPELLS[x.id].kind === "nuke" || SPELLS[x.id].kind === "drain")).sort((p, q) => (SPELLS[q.id].power || 0) * (weak[SPELLS[q.id].element] || 1) - (SPELLS[p.id].power || 0) * (weak[SPELLS[p.id].element] || 1));
    for (const n of nukes) if (allyTry(a, n, tgt)) { a.nextNuke = S.time + (a.kiting ? rand(3, 6) : rand(10, 14)); return true; }
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

function meleeIfSafe(a, tgt, dt, acts) {
  const safe = !a.kiting && a.hp > a.maxHp * 0.6 && (tgt.target !== a || a.hp > a.maxHp * 0.8);
  if (!safe || tgt.state !== "combat") { a.engaged = false; a.attackTarget = null; return false; }
  a.attackTarget = tgt; a.target = tgt; a.engaged = true;
  moveToward(a, tgt.x, tgt.y, dt, reach(a) - 8);
  autoAttack(a, dt);
  allyWeaponSkill(a, tgt, acts || actionList(a));
  return true;
}

function keepCasterRange(a, tgt, dt) {
  const d = dist(a, tgt);
  if (d > (a.kiting ? CONFIG.castRange - 5 : 200)) moveToward(a, tgt.x, tgt.y, dt, a.kiting ? CONFIG.allyKiteDist : 170);
  else if (d < 110) { const ang = Math.atan2(a.y - tgt.y, a.x - tgt.x); a.x += Math.cos(ang) * a.speed * 0.6 * dt; a.y += Math.sin(ang) * a.speed * 0.6 * dt; a.face = ang + Math.PI; }
}

function healEstimate(a, sp) {
  if (sp.cure) return cureAmount(a, sp);
  return (sp.power + a.stats.mnd * sp.mnd + skillOf(a, "healing") * 0.3) * (1 + 0.06 * (a.lv - 1));
}

function healerSupport(a, acts, tgt) {
  if (S.time < (a.nextSupport || 0)) return false;
  a.nextSupport = S.time + 2;
  const reach = CONFIG.castRange - 30;
  for (const x of acts) {
    const sp = x.kind === "ma" && SPELLS[x.id];
    if (!sp || sp.kind !== "cleanse") continue;
    const p = S.party.find(q => q.alive && sp.cleanse.some(k => q.buffs[k]) && dist(a, q) <= reach);
    if (p && allyTry(a, x, p)) return true;
  }
  if (!tgt || tgt.state !== "combat" || a.mp < a.maxMp * 0.5) return false;
  for (const key of ["protect", "shell"]) {
    const opts = acts.filter(x => x.kind === "ma" && SPELLS[x.id] && SPELLS[x.id].kind === "buff" && SPELLS[x.id].buff === key).sort((p, q) => (SPELLS[q.id].party ? 1 : 0) - (SPELLS[p.id].party ? 1 : 0));
    if (!opts.length) continue;
    const p = S.party.find(q => q.alive && !q.buffs[key] && dist(a, q) <= reach);
    if (p && opts.some(x => allyTry(a, x, p))) return true;
  }
  return false;
}

function healerAI(a, tgt, dt) {
  const acts = actionList(a);
  const healAt = a.role === "healer" ? 0.75 : 0.5;
  const otherHealer = S.party.some(p => p !== a && p.alive && p.role === "healer" && !p.casting);
  const needy = S.party.filter(p => p.alive && p.hp < p.maxHp * healAt && (a.role === "healer" || !otherHealer || p.hp < p.maxHp * 0.35)).sort((p, q) => p.hp / p.maxHp - q.hp / q.maxHp);
  if (needy.length) {
    const inRange = needy.filter(p => dist(a, p) <= CONFIG.castRange - 30);
    if (inRange.length) {
      const low = inRange[0], miss = low.maxHp - low.hp;
      const cga = acts.find(x => x.id === "curaga");
      if (cga && inRange.filter(p => dist(p, low) <= 300).length >= 2 && allyTry(a, cga, low)) return;
      const seal = acts.find(x => x.id === "divine_seal");
      if (seal && low.hp < low.maxHp * 0.35 && !a.buffs.divine_seal && allyTry(a, seal, a)) return;
      const heals = acts.filter(x => x.kind === "ma" && SPELLS[x.id] && SPELLS[x.id].kind === "heal").sort((p, q) => SPELLS[p.id].power - SPELLS[q.id].power);
      const order = heals.filter(x => healEstimate(a, SPELLS[x.id]) >= miss).concat(heals.filter(x => healEstimate(a, SPELLS[x.id]) < miss).reverse());
      for (const c of order) if (allyTry(a, c, low)) return;
    } else if (!a.kiting) {
      moveToward(a, needy[0].x, needy[0].y, dt, CONFIG.castRange - 60);
      return;
    }
  }
  if (healerSupport(a, acts, tgt)) return;
  if (tgt) {
    const dia = acts.find(x => x.id === "dia");
    const diaMp = a.role === "support" ? 0.25 : 0.5;
    if (dia && !tgt.buffs.dia && a.mp > a.maxMp * diaMp && dist(a, tgt) <= CONFIG.castRange && allyTry(a, dia, tgt)) return;
    const banish = acts.find(x => x.id === "banish");
    if (a.role === "support" && banish && tgt.fam.weak && tgt.fam.weak.light >= 1.5 && a.mp > a.maxMp * 0.4 && allyTry(a, banish, tgt)) return;
    if (meleeIfSafe(a, tgt, dt, acts)) return;
    keepCasterRange(a, tgt, dt);
    return;
  }
  a.engaged = false; a.attackTarget = null;
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
  const reserve = a.role === "burster" && tgt.chain ? 0.2 : CONFIG.allyMpReserve;
  if (S.time >= a.nextNuke && a.mp > a.maxMp * reserve && tgt.state === "combat" && tgt.hp > tgt.maxHp * 0.1) {
    const ranked = nukes.slice().sort((p, q) => {
      const wp = (tgt.fam.weak || {})[SPELLS[p.id].element] || 1, wq = (tgt.fam.weak || {})[SPELLS[q.id].element] || 1;
      return SPELLS[q.id].power * wq - SPELLS[p.id].power * wp;
    });
    for (const n of ranked) if (allyTry(a, n, tgt)) { a.nextNuke = S.time + rand(1.2, 2.4); return; }
  }
  const dbf = acts.find(x => x.kind === "ma" && (SPELLS[x.id].kind === "debuff" || SPELLS[x.id].kind === "dot") && !tgt.buffs[x.id] && a.mp > a.maxMp * 0.15);
  if (dbf && tgt.state === "combat" && allyTry(a, dbf, tgt)) return;
  if (a.mp <= a.maxMp * 0.1 && meleeIfSafe(a, tgt, dt, acts)) return;
  a.engaged = false; a.attackTarget = null;
  keepCasterRange(a, tgt, dt);
}

function exitEdgeAngle(ex, z) {
  if (ex.kind === "door" || ex.ask) return null;
  if (ex.x <= 0) return Math.PI;
  if (ex.x + ex.w >= z.w) return 0;
  if (ex.y <= 0) return -Math.PI / 2;
  if (ex.y + ex.h >= z.h) return Math.PI / 2;
  return null;
}

function startExitWalk(ex) {
  const a = exitEdgeAngle(ex, S.zone);
  if (a == null || typeof zoneFadeOut !== "function" || !player.alive) { enterZone(ex.to, ex.tx, ex.ty); return true; }
  S.exitWalk = { ex, a, t: 0 };
  S.moveTarget = null; S.chase = false; S.pendingTalk = null;
  standUp(player, true);
  zoneFadeOut();
  if (typeof prefetchZone === "function") prefetchZone(ex.to);
  return false;
}

function inwardAngle(z, x, y) {
  const d = [[x, 0], [z.w - x, Math.PI], [y, Math.PI / 2], [z.h - y, -Math.PI / 2]].sort((p, q) => p[0] - q[0])[0];
  return d[0] < CONFIG.walkInEdge ? d[1] : null;
}

function autoWalk(a, dt) {
  const sp = player.speed * (player.mounted ? mountMul() : 1);
  player.face = a;
  player.x += Math.cos(a) * sp * dt;
  player.y += Math.sin(a) * sp * dt;
  touch(player);
  if (player.casting) player.casting = null;
}

function updatePlayer(dt) {
  if (!player.alive) { S.exitWalk = null; S.walkIn = null; return; }
  if (S.exitWalk) { S.exitWalk.t += dt; autoWalk(S.exitWalk.a, dt); return; }
  if (S.walkIn) {
    S.walkIn.t += dt;
    autoWalk(S.walkIn.a, dt);
    keepInZone(player);
    if (S.walkIn.t >= CONFIG.walkInTime) S.walkIn = null;
    return;
  }
  const mv = inputVector();
  let moved = false;
  if (mv.x || mv.y) {
    S.moveTarget = null; S.chase = false; S.pendingTalk = null;
    const len = Math.hypot(mv.x, mv.y);
    const sp = player.speed * Math.min(1, len) * (S.keys && S.keys.shift && !player.mounted ? CONFIG.sprintMul : 1) * (player.mounted ? mountMul() : 1) * (player.buffs && player.buffs.flee ? 1.8 : 1) * weatherSlow();
    player.x += (mv.x / len) * sp * dt;
    player.y += (mv.y / len) * sp * dt;
    const lockT = player.engaged && player.target && player.target !== player && player.target.alive !== false && !player.mounted ? player.target : null;
    player.face = lockT ? Math.atan2(lockT.y - player.y, lockT.x - player.x) : Math.atan2(mv.y, mv.x);
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

function canRest(p) { return p.alive && !p.engaged && !p.casting && !p.mounted; }

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
  if (player.engaged) { player.engaged = false; player.attackTarget = null; }
  if (player.casting) { log("You can't rest while casting.", "sys"); sfx("error"); return; }
  S.moveTarget = null; S.chase = false; S.pendingTalk = null;
  startRest(player);
  log("You sit down and rest.", "you");
  for (const a of S.party) if (a !== player && canRest(a) && !partyInCombat()) startRest(a);
}

function regen(p, dt) {
  if (p.resting && (!canRest(p) || p.moving)) standUp(p, p !== player);
  const can = p.alive && !p.engaged && !p.casting && S.time - p.stillSince >= CONFIG.regenDelay && (p.resting || !inCombatWith(p));
  const rest = can && p.resting && S.time - p.restSince >= CONFIG.restDelay;
  p.regenerating = can && (p.hp < p.maxHp || p.mp < p.maxMp);
  p.restHealing = rest && (p.hp < p.maxHp || p.mp < p.maxMp);
  if (!can) return;
  const rb = rest && p === player ? 1 + buddyPerk("rest") : 1;
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * (rest ? CONFIG.restHp : CONFIG.regenHp) * dt * rb);
  p.mp = Math.min(p.maxMp, p.mp + p.maxMp / CONFIG.mpMul * (rest ? CONFIG.restMp : CONFIG.regenMp) * dt * rb);
}

function tickCasting(e) {
  if (e.casting && S.time >= e.casting.end) finishCast(e);
}

function partyInCombat() {
  return S.mobs.some(m => m.alive && m.state === "combat" && [...m.enmity.keys()].some(isParty));
}

function enterZone(id, x, y, opt) {
  const prev = S.zoneId;
  S.exitWalk = null; S.walkIn = null;
  S.fish = null;
  if (S.race && !RACE.zones.includes(id)) S.race = null;
  if (S.bf && id !== BATTLEFIELD.zone) { if (!S.bf.won) log("You leave the Chapel Depths. The battle is lost.", "sys"); S.bf = null; }
  S.zoneId = id;
  S.zone = ZONES[id];
  if (S.party.some(p => p.mercId) || (save.mercBodies && Object.keys(save.mercBodies).length)) rebuildParty();
  if (!canRideHere()) for (const p of S.party) p.mounted = false;
  S.mobs = [];
  for (const p of S.party) { p.retreat = null; p.kiting = false; }
  S.effects = [];
  S.floaters = [];
  S.spawnAt = [];
  closeDialog();
  S.moveTarget = null; S.chase = false; S.pendingTalk = null;
  player.x = x; player.y = y;
  const home = ZONES[id].npcs.find(n => NPCS[n.id] && NPCS[n.id].crystal && Math.hypot(n.x - x, n.y - y) < 120);
  player.face = home ? Math.atan2(home.y - y, home.x - x) : Math.atan2(ZONES[id].h / 2 - y, ZONES[id].w / 2 - x);
  if (opt && opt.walkIn) { const ia = inwardAngle(ZONES[id], x, y); if (ia != null) { player.face = ia; S.walkIn = { a: ia, t: 0 }; } }
  S.party.forEach((p, i) => {
    p.engaged = false; p.target = null; p.attackTarget = null; p.casting = null;
    if (i > 0 && !(p.mercId && !p.alive)) { const o = arrivalSpot(i, x, y, player.face); p.x = o.x; p.y = o.y; keepInZone(p); keepOutOfColliders(p); }
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
  S.npcs = S.zone.npcs.map(n => Object.assign({ id: n.id, x: n.x, y: n.y, radius: 14, kind: "npc", face: Math.PI / 2, post: { x: n.x, y: n.y }, home: n.home, sleep: n.sleep, away: false, speed: CONFIG.npcSpeed }, NPCS[n.id]));
  S.gatherAt = [];
  if (FEATURES.gathering && S.zone.gather) for (const type in S.zone.gather) {
    const g = S.zone.gather[type];
    const picks = g.at.slice().sort(() => Math.random() - 0.5).slice(0, g.n);
    for (const [gx, gy] of picks) spawnGather(type, gx, gy);
  }
  S.ambient = [];
  for (const a of S.zone.ambient || []) for (let i = 0; i < (a.type === "walker" ? 0 : a.n || 1); i++) {
    const r = seeded(hashStr(id + a.type + i));
    const x = a.x + (r() - 0.5) * (a.r || 60), y = a.y + (r() - 0.5) * (a.r || 60);
    S.ambient.push({ kind: "ambient", ambient: true, type: a.type, seed: a.type === "walker" ? hashStr(id + S.ambient.length) % 997 : 0, col: a.col, scale: a.scale, time: a.time, look: a.look, x, y, px: x, py: y, home: { x: a.x, y: a.y }, roam: a.r || 60, path: a.path, pi: 0, face: r() * 6.28, speed: a.type === "walker" ? 55 : a.type === "dog" ? 90 : 40, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9, wait: r() * 4 });
  }
  if ((S.zone.theme || "field") === "field" && !S.zone.indoor) addWildlife(id);
  for (const n of S.npcs) if (n.only) n.away = !npcOn(n);
  for (const n of S.npcs) if (n.sleep && npcAsleep(n)) { n.away = true; const d = npcDoor(n); if (d) { n.x = d.x; n.y = d.y; } }
  const rnd = seeded(hashStr(id));
  S.decor = [];
  const nRocks = S.zone.theme === "town" ? 6 : S.zone.theme === "cave" ? 26 : S.zone.theme === "crypt" ? 0 : 30;
  for (let i = 0; i < nRocks; i++) S.decor.push({ x: 40 + rnd() * (S.zone.w - 80), y: 40 + rnd() * (S.zone.h - 80), r: 6 + rnd() * 16, a: rnd() * Math.PI });
  S.zoneCooldown = 1;
  mercTownSell();
  { const dd = districtAt(S.zone, x, y); S.district = dd ? dd.id : null; markDistrict(dd); }
  S.lastPeriod = period();
  log("Entering " + S.zone.name + (zoneBand(id) ? " (" + bandText(zoneBand(id)) + ")" : "") + ".", "sys");
  { const rg = regionOf(id); if (rg) { const c = conquestState(); log(CONQUEST.regions[rg].name + " is held by " + CONQUEST.nations[c.held[rg]].name + "." + (c.nation && c.held[rg] === c.nation ? " Your nation's banner flies here: +5% experience." : ""), "sys"); } }
  if (prev !== id) sfx("zone");
  onZoneEntered();
  saveGame();
  if (typeof netJoinZone === "function") netJoinZone(id);
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
function npcOn(n) { return n.only === "night" ? isNight() : n.only === "day" ? !isNight() : weatherMatch(n.only); }
function updateNpcs(dt) {
  for (const n of S.npcs) {
    if (n.only) {
      const on = npcOn(n);
      if (n.away === on) { n.away = !on; if (on && n.only === "night" && dist(n, player) < 900) log(n.name.split(",")[0] + " sets up shop by lantern light.", "sys"); if (on && n.only === "sandstorm" && dist(n, player) < 1500) log("Something shimmers in the sandstorm to the south-west...", "sys"); if (!on && player.target === n) player.target = null; }
      continue;
    }
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
  player.gatherAt = S.time; player.gatherType = type;
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
function recipeKnown(r) { return !!(save.recipes && save.recipes[r.id]); }
function learnRecipe(itemId) {
  const it = ITEMS[itemId], r = RECIPES.find(x => x.id === it.recipe);
  if (!r) return;
  if (recipeKnown(r)) { log("You already know the recipe for " + ITEMS[r.out].name + ".", "sys"); sfx("error"); return; }
  if (!removeItem(itemId, 1)) return;
  save.recipes[r.id] = 1;
  log("You learn the recipe for " + ITEMS[r.out].name + " (" + CRAFTS[r.craft].name + " Lv." + r.lv + ").", "loot");
  sfx("unlock");
  saveGame();
  if (S.modal) renderModal();
}
function rareRecipeDrop(e) {
  if (!e || !e.fam || e.fam.peaceful || xpFor(e.lv, player.lv) <= 0) return;
  const chance = e.fam.boss ? 0.5 : e.fam.nm ? 0.25 : 0.015;
  if (Math.random() >= chance) return;
  const pool = RARE_RECIPES.filter(r => !recipeKnown(r) && invCount("rcp_" + r.id) < 1 && r.lv >= e.lv - 5 && r.lv <= e.lv + 3);
  if (!pool.length) return;
  const r = pick(pool);
  giveItem("rcp_" + r.id, 1);
}
function recipeMatsOk(r) { return Object.keys(r.mats).every(id => invCount(id) >= r.mats[id]) && invCount(CRAFTS[r.craft].crystal) >= 1; }
function synthChance(r) { return clamp(65 + 7 * (craftSkill(r.craft) - r.lv) + buddyPerk("craft") * 100, 5, 95); }
function synthHqChance(r) { return r.hq ? clamp(5 * (craftSkill(r.craft) - r.lv), 0, 50) : 0; }
function canSynth(r) {
  if (!FEATURES.crafting) return "Crafting isn't available yet.";
  if (!player.alive) return "You are KO'd.";
  if (player.engaged || inCombatWith(player) || partyInCombat()) return "You can't craft during a fight.";
  if (player.casting) return "You are casting.";
  if (player.synth) return "You're already crafting.";
  if (player.mounted) return "Dismount first.";
  if (!recipeKnown(r)) return "You haven't learned that recipe.";
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
  log("You begin crafting " + ITEMS[r.out].name + " with " + an(ITEMS[CRAFTS[r.craft].crystal].name) + ".", "you");
  sfx("cast", player); sfx("craft", player);
  vfx("cast", { src: player, sp: { kind: "nuke", element: ITEMS[CRAFTS[r.craft].crystal].element } });
  return "";
}
function cancelSynth(msg) {
  if (!player.synth) return;
  player.synth = null;
  log(msg || "Your crafting is interrupted.", "sys");
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
    log("Crafting complete: " + (r.qty > 1 ? r.qty + " × " : "") + ITEMS[out].name + (hq ? " (high quality!)" : "") + ".", "loot");
    sfx(hq ? "levelup" : "unlock", player);
    vfx("burst", { tgt: player, el });
  } else {
    for (const id in r.mats) if (Math.random() < 0.5) removeItem(id, Math.max(1, Math.floor(r.mats[id] / 2)));
    log("The craft fails. The essence fades and some ingredients are lost.", "foe");
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

function weatherMatch(w) { if (!w) return true; const now = weatherNow(); return Array.isArray(w) ? w.includes(now) : w === now; }
function spawnOpts(sp) { return [sp].concat(sp.alts || []).filter(o => (!o.time || o.time === period()) && weatherMatch(o.weather)); }
function visMul() { const th = S.zone && S.zone.theme; if (!S.zone || th === "cave" || th === "crypt" || th === "house" || th === "town") return 1; return { fog: 0.6, sandstorm: 0.5, blizzard: 0.6, rain: 0.85, storm: 0.8, snow: 0.9 }[weatherNow()] || 1; }
function weatherSlow() { const th = S.zone && S.zone.theme; if (!S.zone || th !== "field") return 1; const w = weatherNow(); return w === "blizzard" || w === "sandstorm" ? 0.85 : 1; }
function updateWeatherSpawns() {
  const w = weatherNow();
  if (w === S.lastWx) return;
  const first = S.lastWx === undefined;
  S.lastWx = w;
  if (first || !S.zone.spawns) return;
  for (const m of S.mobs) {
    const sp = S.zone.spawns[m.spawnIdx];
    const ow = m.spawnOpt ? m.spawnOpt.weather : sp && sp.weather;
    if (m.alive && sp && ow && !weatherMatch(ow) && m.state === "idle") { m.alive = false; m.deadAt = S.time - 2; m.despawned = true; S.spawnAt[m.spawnIdx] = S.time + 5; }
  }
  for (let i = 0; i < (S.zone.spawns || []).length; i++) { const sp = S.zone.spawns[i]; if (spawnHas(sp, o => o.weather && weatherMatch(o.weather)) && !S.mobs.some(m => m.alive && m.spawnIdx === i)) S.spawnAt[i] = Math.min(S.spawnAt[i] || 1e9, S.time + 3); }
  if (w && WEATHER_INFO[w]) log("The weather turns: " + WEATHER_INFO[w].name.toLowerCase() + (w === "sandstorm" || w === "blizzard" ? ". Movement is slower and you can't see far." : w === "fog" ? ". Monsters won't spot you from as far away." : "."), "sys");
}
function spawnAllowed(sp) { if (sp.bf && !(S.bf && !S.bf.won)) return false; return spawnOpts(sp).length > 0; }
function spawnHas(sp, pred) { return [sp].concat(sp.alts || []).some(pred); }

function spawnMob(i, wantNm) {
  const sp = S.zone.spawns[i];
  if (!spawnAllowed(sp)) { S.spawnAt[i] = S.time + 5; return; }
  const opts = spawnOpts(sp);
  const o = (wantNm && opts.find(x => x.nm && x.nm.id === wantNm)) || opts.find(x => x.nm && (storyWants(x.nm.id) || (typeof netWanted === "function" && netWanted(x.nm.id)))) || opts[Math.floor(Math.random() * opts.length)];
  let fam = o.fam, lv = randInt(o.lv[0], o.lv[1]);
  if (FEATURES.nms && o.nm && (!o.nm.time || o.nm.time === period())) {
    const key = "nm:" + o.nm.id;
    const story = storyWants(o.nm.id) || (typeof netWanted === "function" && netWanted(o.nm.id));
    if ((story || !(save.timers[key] > Date.now())) && !S.mobs.some(m => m.alive && m.famKey === o.nm.id) && (story || Math.random() < o.nm.chance)) {
      fam = o.nm.id; lv = o.nm.lv;
      if (S.time > 1 && Math.hypot(sp.x - player.x, sp.y - player.y) < 900) { log("You sense a powerful presence nearby...", "foe"); sfx("notify"); }
    }
  }
  const mob = buildMob(fam, lv, sp.x, sp.y, i);
  mob.spawnOpt = o;
  if (o.passive && !mob.fam.nm) { mob.aggro = null; mob.passive = true; }
  S.mobs.push(mob);
  S.spawnAt[i] = null;
}

function beastKey(m) { return BESTIARY[m.famKey] ? m.famKey : null; }

function noteBeast(m, kill) {
  const k = beastKey(m);
  if (!k) return;
  let b = save.bestiary[k];
  if (!b && !kill) return;
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
  try { updateWeatherSpawns(); expTick(); } catch (err) {}
  const per = period();
  if (per === S.lastPeriod) return;
  S.lastPeriod = per;
  if (!S.zone.indoor && S.zone.theme !== "cave" && S.zone.theme !== "crypt") log(per === "night" ? "Night falls over " + S.zone.name + "." : "The sun rises over " + S.zone.name + ".", "sys");
  for (const m of S.mobs) {
    const sp = S.zone.spawns[m.spawnIdx];
    const ot = m.spawnOpt ? m.spawnOpt.time : sp && sp.time;
    if (m.alive && sp && ot && ot !== per && m.state === "idle") {
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
  if (typeof save !== "undefined" && save) save.playSec = (save.playSec || 0) + dt;
  for (const e of S.party.concat(S.mobs)) { e.px = e.x; e.py = e.y; }
  updatePlayer(dt);
  for (const a of S.party) if (a !== player) { try { updateAlly(a, dt); } catch (e) { if (typeof reportError === "function") reportError(e, "companion"); } }
  mercFallTick();
  for (const m of S.mobs) updateMob(m, dt);
  updateNpcs(dt);
  for (const p of S.party) { if (p.alive) { tickBuffs(p); tickCasting(p); } }
  const bodies = S.party.concat(S.mobs).filter(e => e.alive && !e.proxy);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) separate(bodies[i], bodies[j]);
  for (const m of S.mobs) if (m.proxy && m.alive) for (const p of S.party) if (p.alive) separate(p, m, true);
  for (const n of S.npcs) if (!n.away) for (const p of S.party) separate(p, n, true);
  for (const e of bodies) { if (e === player && S.exitWalk) continue; keepOutOfWater(e); keepOutOfRects(e); keepInZone(e); }
  for (const e of S.party.concat(S.mobs)) {
    e.moving = Math.hypot(e.x - e.px, e.y - e.py) > 0.05;
    if (e.moving && isParty(e)) e.stillSince = S.time;
  }
  for (const p of S.party) regen(p, dt);
  S.zoneCooldown = Math.max(0, S.zoneCooldown - dt);
  if (S.exitWalk && S.exitWalk.t >= CONFIG.exitWalkTime) { const ex = S.exitWalk.ex; S.exitWalk = null; enterZone(ex.to, ex.tx, ex.ty, { walkIn: true }); return; }
  if (S.zoneCooldown <= 0 && player.alive && !S.exitWalk) {
    let onAsk = null;
    for (const ex of S.zone.exits) if (circleRect(player, ex, 8) && (!ex.weather || weatherMatch(ex.weather))) {
      if (ex.ask && typeof gameConfirm === "function") { onAsk = ex; continue; }
      if (startExitWalk(ex)) return;
      break;
    }
    if (onAsk && S.exitAsked !== onAsk) {
      S.exitAsked = onAsk;
      const ex = onAsk;
      gameConfirm(ex.label, ex.ask, () => { S.exitAsked = null; enterZone(ex.to, ex.tx, ex.ty); }, { yes: ex.yes || "Enter", no: "Not now", tag: "exit" });
    } else if (!onAsk && S.exitAsked && !circleRect(player, S.exitAsked, 40)) { S.exitAsked = null; if (typeof gameConfirmClose === "function") gameConfirmClose("exit"); }
  }
  S.lmTimer -= dt;
  if (S.lmTimer <= 0) { S.lmTimer = 0.5; if ((S.jobChk = (S.jobChk || 0) + 1) % 4 === 0) { checkJobUnlocks(); jobPopupTick(); } checkLandmarks(); checkDistrict(); tickGather(); gardenTick(); scanBeasts(); S.achTimer = (S.achTimer || 0) + 1; if (S.achTimer % 4 === 0) { checkAchievements(); tickWages(); tickFood(); tickBlessing(); } }
  tickSynth(dt);
  if (S.pool && S.pool.length) tickPool(false);
  if (S.fish) tickFish();
  if (S.race) tickRace();
  if (S.pet) tickPet();
  tickGeo(dt);
  tickFerry();
  tickBuddy(dt);
  tickAmbient(dt);
  tickStory();
  if (S.time >= (S.ahNext || 0)) { S.ahNext = S.time + 1; tickTownBuying(); if (save.market.listings.length) tickAuction(); }
  if (S.bf) tickBattlefield();
  if (player.moving) { const dd = Math.hypot(player.x - player.px, player.y - player.py) / 20; if (player.mounted) save.stats.ride += dd; else save.stats.walk += dd; }
  S.periodTimer -= dt;
  if (S.periodTimer <= 0) { S.periodTimer = 1; updatePeriod(); }
  if (typeof netMobsLocal !== "function" || netMobsLocal()) S.spawnAt.forEach((t, i) => { if (t != null && S.time >= t) spawnMob(i); });
  S.mobs = S.mobs.filter(m => m.alive || S.time - m.deadAt < 2.5);
  if (partyInCombat()) S.lastCombat = S.time;
  const calm = S.time - S.lastCombat;
  koTick();
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
  const f = m.fam || {}, soft = !f.nm && !f.boss && m.lv <= 6 ? (m.lv <= 3 ? 1 : 0) + (!f.aggro && m.lv <= 4 ? 1 : 0) : 0;
  const d = m.lv - soft - player.lv;
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
  if (changed && e && !quiet && typeof sfx === "function") sfx("target");
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

function npcTargets(r) {
  return S.npcs.filter(n => !n.away && !n.gone && dist(n, player) < r);
}

function cycleNpcTarget() {
  const list = npcTargets(1200).sort((a, b) => dist(a, player) - dist(b, player));
  if (!list.length) return false;
  setTarget(tabNext(list), true);
  sfx("select");
  return true;
}

function cycleObjectTarget() {
  const list = npcTargets(1200).filter(n => n.crystal || n.warpstone || n.prop).sort((a, b) => dist(a, player) - dist(b, player));
  if (!list.length) { log("No objects nearby.", "sys"); return; }
  setTarget(tabNext(list), true);
  sfx("select");
}

function cycleTarget() {
  if (S.zone.safe) { if (!cycleNpcTarget()) log("No one nearby.", "sys"); return; }
  const mobs = S.mobs.filter(m => m.alive && !m.despawned && dist(m, player) < 450);
  const list = mobs.concat(npcTargets(260)).sort((a, b) => dist(a, player) - dist(b, player));
  if (!list.length) { if (!cycleNpcTarget()) log("No enemies nearby.", "sys"); return; }
  const t = tabNext(list);
  setTarget(t, !isMob(t));
  sfx("select");
}

function nearestMob() {
  let best = null, bd = 450;
  for (const m of S.mobs) if (m.alive && claimOk(m) && dist(m, player) < bd) { bd = dist(m, player); best = m; }
  return best;
}

function autoRunOn() { return typeof VIEW !== "undefined" && !!VIEW.settings && !!VIEW.settings.autoRun; }

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
  if (!claimOk(t)) { log("The " + t.name + " is claimed by " + claimName(t) + ".", "sys"); sfx("error"); return; }
  player.target = t;
  if (player.engaged) { setTarget(t); return; }
  player.engaged = true;
  player.attackTarget = t;
  player.swingTimer = Math.min(player.swingTimer, 1.0);
  touch(player);
  if (fromTap && autoRunOn()) S.chase = true;
  log("You engage the " + t.name + ".", "you");
}

function mountMul() { return CONFIG.mountSpeed * (save.saddle ? SADDLE_BONUS : 1) * (player && player.mounted && S.zone && !S.zone.safe && (S.zone.openRange || onRoad(player)) ? CONFIG.roadBonus : 1); }

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
  enterZone(RACE.start.zone, RACE.start.x, RACE.start.y);
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
  if (!RACE.zones.includes(S.zoneId) || !player.mounted || !player.alive) { endRace("You left the course. The Hollow Run is over."); return; }
  if (t > RACE.limit) { endRace("Time's up! Try the Hollow Run again with Ysolde."); return; }
  const cp = RACE.checkpoints[r.next];
  if (cp.zone !== S.zoneId || Math.hypot(player.x - cp.x, player.y - cp.y) > RACE.radius) return;
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
  if (sp.target === "ally") return (isParty(player.target) || isMate(player.target)) && player.target.alive ? player.target : player;
  if (sp.target === "dead") return (isParty(player.target) || isMate(player.target)) && !player.target.alive ? player.target : S.party.find(p => p !== player && !p.alive) || null;
  return isMob(player.target) ? player.target : player.attackTarget;
}

function playerAct(act) {
  if (!act || S.ko) return;
  if (player.mounted) dismount("You dismount.");
  let t = resolveTarget(act);
  if (!t && act.kind !== "ws") { const n = nearestMob(); if (n) { player.target = n; t = resolveTarget(act); } }
  const why = checkAction(player, act, t) || (isMob(t) && !claimOk(t) ? "The " + t.name + " is claimed by " + claimName(t) + "." : "");
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
  if (save.seen && NPCS[n.id]) save.seen.npcs[n.id] = 1;
  player.target = n;
  player.face = Math.atan2(n.y - player.y, n.x - player.x);
  n.face = Math.atan2(player.y - n.y, player.x - n.x);
  const st = storyStep();
  if (st && st.type === "talk" && st.npc === n.id && storyReady()) { storyScene(n.name, st.text, 0, () => advanceStory()); return; }
  if (expTalk(n)) return;
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
  const i = (S.zone.spawns || []).findIndex(sp => spawnHas(sp, o => o.nm && o.nm.id === fam));
  if (i < 0) return;
  for (const m of S.mobs) if (m.spawnIdx === i && m.alive) { m.alive = false; m.despawned = true; m.deadAt = S.time - 99; }
  S.mobs = S.mobs.filter(m => !(m.spawnIdx === i && m.despawned));
  spawnMob(i, fam);
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
  if (!st || st.type !== "visit" || !inArea(st.zone, S.zoneId) || !storyReady() || S.dialog || !player.alive) return;
  const lm = (S.zone.landmarks || []).find(l => l.id === st.lm);
  if (!lm || Math.hypot(player.x - lm.x, player.y - lm.y) > lm.r) return;
  storyScene(lm.name, st.text, 0, () => advanceStory());
}

function questMarker(n) {
  const q = save.quests, lv = player.lv;
  for (const id in QUESTS) if (QUESTS[id].npc === n.id && QUESTS[id].intro && (questOfferable(id) || questComplete(id))) return true;
  if (n.id === "rhea") return q.pouches === "none" || (q.pouches === "active" && invCount("goblin_pouch") >= 3) || (q.bones === "done" && q.chieftain === "none" && lv >= 7) || q.chieftain === "killed";
  if (n.id === "ysolde") return !save.mountLicense && lv >= CONFIG.mountLevel && (q.riding === "none" || (q.riding === "active" && save.gil >= 300 && invCount("healing_herb") >= 3));
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
  sfx("fanfare");
}

function questOfferable(id) {
  const q = QUESTS[id];
  return save.quests[id] === "none" && player.lv >= (q.lv || 1) && (!q.pre || save.quests[q.pre] === "done") && (!(q.reward && q.reward.unlock) || jobUnlocked(q.reward.unlock));
}
const tourDone = zid => ZONES[zid].districts.every(d => save.districts && save.districts[zid + ":" + d.id]);
const QUEST_CHECKS = { tour_outpost: () => tourDone("outpost"), tour_harbor: () => tourDone("harbor"), tour_ironvale: () => tourDone("ironvale"), furniture: () => save.furniture.length >= 2, harvest: () => save.harvests >= 1 };
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
  if (typeof sfx === "function") sfx("chest", n);
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
    const pl = conquestState().nation !== "ash" ? [{ label: "Pledge to the Ashenreach League", fn: () => { closeDialog(); pledge("ash"); } }] : [];
    if (q.pouches !== "none" && pl.length && !questOptions("rhea", n).length) { openDialog(n.name, "The League needs every blade it can get. Fight under our banner and every monster you put down in the wilds strengthens our hold on that region. " + conquestReport(), pl); return; }
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
    const opts = [
      { label: "Why do I have to unlock jobs?", fn: () => openDialog(n.name, "No trade is learned from nothing. A thief learns his footwork from a fighter, a scholar her letters from a healer's books. Master a few trades and the ones built on them open to you. I won't tell you which leans on which; that's half the fun.", [{ label: "How am I doing?", fn: () => openDialog(n.name, jobProgressHint(), []) }]) },
      { label: "How am I doing?", fn: () => openDialog(n.name, jobProgressHint(), []) }
    ];
    const adv = [];
    if (player.lv >= 6) {
      const turnIn = (id, mats, label) => {
        if (mats.every(([it, k]) => invCount(it) >= k)) adv.push({ label, fn: () => { mats.forEach(([it, k]) => removeItem(it, k)); q[id] = "done"; log("Quest complete: " + QUESTS[id].name + ".", "npc"); giveReward(QUESTS[id].reward); refreshPlayer(false); saveGame(); closeDialog(); openModal("job"); } });
      };
      if (q.pld === "none" && jobUnlocked("PLD")) adv.push({ label: "Ask about the Paladin's oath", fn: () => openDialog(n.name, "A Paladin stands between the party and harm: sword and shield, Cures for the wounded, Flash to blind the foe. Bring me 2 Bone Chips from the undead and 1 Iron Ore from the Den's raiders, and I'll hear your oath.", [{ label: "Accept", fn: () => { q.pld = "active"; log("Quest accepted: " + QUESTS.pld.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }]) });
      else if (q.pld === "active") turnIn("pld", [["bone_chip", 2], ["iron_ore", 1]], "Take the Paladin's oath");
      if (q.rdm === "none" && jobUnlocked("RDM")) adv.push({ label: "Ask about the Red Mage's arts", fn: () => openDialog(n.name, "A Red Mage does a little of everything well: blade in hand, Slow and Paralyze on the enemy, a nuke when it counts, a Cure in a pinch. Bring me 2 Worm Silk, 1 Fire Essence and 1 Water Essence for the scarlet dye, and we'll begin.", [{ label: "Accept", fn: () => { q.rdm = "active"; log("Quest accepted: " + QUESTS.rdm.name + ".", "npc"); sfx("notify"); saveGame(); closeDialog(); } }]) });
      else if (q.rdm === "active") turnIn("rdm", [["worm_silk", 2], ["fire_crystal", 1], ["water_crystal", 1]], "Present the dye materials");
      adv.push(...questOptions("tobin", n));
    }
    const advNote = (q.pld === "active" ? " The oath needs 2 Bone Chips and 1 Iron Ore." : "") + (q.rdm === "active" ? " The scarlet lessons need 2 Worm Silk, 1 Fire Essence and 1 Water Essence." : "");
    if (!save.supportUnlocked) {
      if (player.lv < CONFIG.supportUnlockLevel) {
        openDialog(n.name, "Every job keeps its own level and its own weapon skills. Come back when you've reached level " + CONFIG.supportUnlockLevel + ", and I'll teach you to call on a second job." + (adv.length ? advNote : ""), opts.concat(adv));
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
              refreshPlayer(false); saveGame(); closeDialog(); log("Set your support job with Pip at your residence.", "npc");
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
    const mins = blessingMinutes(), left = blessed() ? Math.ceil(blessLeft() / 60) : 0;
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
    const st = expStep();
    openDialog(n.name, line + (st && !st.final ? " " + expReport() : ""), [{ label: "Guild bounties and shop", fn: () => { closeDialog(); openModal("guild"); } }].concat(expOptions()));
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
  talkFerry(n) {
    const to = ZONES[n.ferryTo];
    openDialog(n.name, n.ferryTo === "gullisle" ? "The ferry runs out to Gull Isle and back. Fair seas today. " + CONFIG.ferryCost + " crystals a head." : "Ready to head back to Saltreach? " + CONFIG.ferryCost + " crystals.", [
      { label: "Sail to " + to.name + " (" + CONFIG.ferryCost + " crystals)", fn: () => { closeDialog(); startFerry(n.ferryTo); } }
    ]);
  },
  talkTarqa(n) {
    const g = questOptions("tarqa", n);
    openDialog(n.name, g.length ? "Welcome to the camp, traveller. Sit by the fire. The wind always has news, and so do I." : "The wind is quiet today. Ride well.", g);
  },
  talkEssa(n) {
    openDialog(n.name, "Bread, stew, potions. Everything a long ride needs. The plateau doesn't have many shops.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "essa"; openModal("shop"); } }
    ]);
  },
  talkRider(n) {
    openDialog(n.name, "Out here there are no roads to slow you down. On the open plateau your mount runs as fast as it does on any road. Give it its head!", []);
  },
  talkLuna(n) {
    openDialog(n.name, "Shh, keep your voice down; the stars are listening. Tonics brewed under the moon, and a few trinkets you won't find by daylight. I'm gone at dawn.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "luna"; openModal("shop"); } }
    ]);
  },
  talkMirage(n) {
    openDialog(n.name, "The air ripples like water. Through it you glimpse a garden of glass that isn't there when the wind drops. Step into it before the storm ends.", []);
  },
  talkBoat(n) {
    openDialog(n.name, "The river runs under the rock wall to the far landing. I'll row you across, no charge. Mind your hands; things live in the water.", [
      { label: "Ride across the river", fn: () => { closeDialog(); startFerry(S.zoneId, n.boatTo.x, n.boatTo.y, 0, "You climb into the boat and push off into the dark water... (4 seconds)", 4); } }
    ]);
  },
  talkWend(n) {
    const g = questOptions("wend", n);
    openDialog(n.name, g.length ? "Ah, company! Sit, sit. Mind the gulls; they bite." : "The gulls and I thank you. Come back any time.", g);
  },
  talkBrisa(n) {
    const g = questOptions("brisa", n).concat(conquestState().nation !== "iron" ? [{ label: "Pledge to the Ironvale Compact", fn: () => { closeDialog(); pledge("iron"); } }] : []);
    openDialog(n.name, g.length ? "Welcome to Ironvale, traveller. Stone walls, hot forges, and more work than hands. Pull up a crate." : "The pass is quiet for now. Come back when you've grown a little.", g);
  },
  talkHaldor(n) {
    openDialog(n.name, "Mythril. Light as steel's ghost and twice as hard. You won't find finer this side of the mountains, and you won't find it cheaper either.", [
      { label: "Trade", fn: () => { closeDialog(); S.shopKind = "haldor"; openModal("shop"); } }
    ]);
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
        { label: "Stable (coats and saddle)", fn: () => { closeDialog(); openModal("stable"); } },
        { label: "Run the Hollow course", fn: () => { closeDialog(); const why = startRace(); if (why) { log(why, "sys"); sfx("error"); } } }
      ]);
      return;
    }
    if (player.lv < CONFIG.mountLevel) { openDialog(n.name, "Thornstriders are proud beasts. They won't carry a greenhorn. Reach level " + CONFIG.mountLevel + " and come see me about a riding license.", []); return; }
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
    openDialog(n.name, hired ? "Your company's holding up, I hope. I get new faces every day, any trade you like, and they'll fight at your side as long as they draw breath. Lose one and they're gone for good, so look after them." : "Nobody walks the Hollow alone for long. Every day five new fighters come through my hall, all kinds. They match your strength and grow with you. Pay their fee for the first hour, then a wage for every hour after. And mind them: the fallen don't come back.", [
      { label: "Hire or dismiss companions", fn: () => { closeDialog(); openModal("mercs"); } }
    ].concat(questOptions("brann", n)));
  },
  talkPip(n) {
    const placed = save.furniture.length;
    const g = questOptions("pip", n);
    openDialog(n.name, placed ? "Welcome home! " + placed + " piece" + (placed === 1 ? "" : "s") + " of furniture, " + storageUsed() + "/" + storageCap() + " storage slots used. What do you need?" : "Oh! You must be the new tenant. I'm Pip. I mind the cottage: I'll keep your things and arrange whatever furniture you bring. It's a bit bare in here. Odette by the west wall sells furniture.", [
      { label: "Change jobs", fn: () => { closeDialog(); openModal("job"); } },
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
  talkLookout(n) {
    const first = !(save.poi || {})[n.id];
    save.poi = save.poi || {};
    let found = 0;
    for (const lm of S.zone.landmarks || []) { const key = S.zoneId + ":" + lm.id; if (!save.landmarks[key]) { save.landmarks[key] = Date.now(); found++; } }
    const names = (S.zone.landmarks || []).map(l => l.name).join(", ");
    if (first) { save.poi[n.id] = Date.now(); gainXp(60, 0, true); log("From the top of the lookout you can see the whole of " + S.zone.name + ". (+60 EXP)", "loot"); }
    openDialog(n.name, "You climb the ladder and look out over " + S.zone.name + ". You can make out " + names + "." + (found ? " " + found + " new place" + (found === 1 ? "" : "s") + " marked on your map." : ""), []);
    saveGame();
  },
  talkShrine(n) {
    save.poi = save.poi || {};
    const cd = save.timers["shrine:" + n.id] || 0;
    if (cd > Date.now()) { const m = Math.ceil((cd - Date.now()) / 60000); openDialog(n.name, "The candles have burned low. Come back in about " + m + " minute" + (m === 1 ? "" : "s") + ".", []); return; }
    openDialog(n.name, "A small stone shrine with a ring of candles. Travellers leave a crystal here for luck.", [{ label: "Pray (10 crystals)", fn: () => {
      closeDialog();
      if (save.gil < 10) { log("You don't have 10 crystals to leave.", "sys"); return; }
      save.gil -= 10;
      if (!save.poi[n.id]) { save.poi[n.id] = Date.now(); gainXp(40, 0, true); }
      save.timers["shrine:" + n.id] = Date.now() + 60 * 60000;
      player.buffs.boon = { until: S.time + 30 * 60 };
      log("A warm light settles over you. Shrine's Favour: +10% experience for 30 minutes.", "loot");
      ring(player, "#ffe8a0", 30, 0.8, "sparkle"); vfx("buff", { tgt: player, id: "boon" }); sfx("buff", player);
      saveGame();
    } }]);
  },
  talkLore(n) {
    save.poi = save.poi || {};
    const first = !save.poi[n.id];
    if (first) { save.poi[n.id] = Date.now(); gainXp(50, 0, true); log("You read the " + n.name.toLowerCase() + ". (+50 EXP)", "loot"); saveGame(); }
    openDialog(n.name, zkey(POI_LORE, S.zoneId) || "The words are too worn to read.", []);
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
  talkSign(n) {
    const lines = (S.zone.exits || []).filter(e => ZONES[e.to] && e.kind !== "door").map(e => {
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2, dx = cx - player.x, dy = cy - player.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : "north");
      return ZONES[e.to].name + ": " + dir + ", about " + Math.max(1, Math.round(Math.hypot(dx, dy) / 100)) * 10 + " yalms";
    });
    openDialog("Signpost", "Carved arrows point the way. " + lines.join(". ") + ".", []);
  },
  talkCamp(n) {
    openDialog(n.name, "A sheltered camp with a tent and a smouldering fire. Crystals stand only in towns, so rest here and press on.", []);
  },
  talkDistrictSign(n) {
    const z = S.zone, here = districtAt(z, n.x, n.y);
    const lines = z.districts.filter(d => !here || d.id !== here.id).map(d => {
      const cx = d.x + d.w / 2, cy = d.y + d.h / 2, dx = cx - n.x, dy = cy - n.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "east" : "west") : (dy > 0 ? "south" : "north");
      return d.icon + " " + d.name + ": " + dir + ", about " + Math.max(1, Math.round(Math.hypot(dx, dy) / 100)) * 10 + " yalms";
    });
    openDialog("District Signpost", (here ? "You are in the " + here.name + ". " : "") + lines.join(". ") + ".", []);
  },
  talkWarpStone(n) { openWarpStone(n); },
  talkCrystal(n) {
    save.attuned = save.attuned || {};
    if (!save.attuned[n.id]) { save.attuned[n.id] = S.zoneId; log("You attune to the " + n.name + ". You can now warp here from other crystals.", "loot"); }
    const hurt = S.party.some(p => !p.alive || p.hp < p.maxHp || p.mp < p.maxMp);
    for (const p of S.party) { p.alive = true; p.hp = p.maxHp; p.mp = p.maxMp; }
    if (hurt) { ring(n, "#80deea", 60, 0.9, "sparkle"); sfx("cure", n); vfx("crystal", { at: n }); }
    saveGame();
    const isHome = save.home.zone === S.zoneId && save.home.npc === n.id;
    const opts = isHome || !S.zone.safe ? [] : [
      { label: "Set as home point", fn: () => { save.home = { zone: S.zoneId, npc: n.id }; log("Home point set: " + S.zone.name + ".", "npc"); sfx("unlock"); saveGame(); closeDialog(); } }
    ];
    const dests = Object.keys(save.attuned).filter(id => id !== n.id && NPCS[id] && ZONES[save.attuned[id]]);
    if (dests.length) opts.push({ label: "Warp (" + CONFIG.warpCost + " crystals)", fn: () => {
      closeDialog();
      if (typeof promptChoice === "function") promptChoice("Warp to which crystal?", dests.map(id => ({ label: NPCS[id].name + " (" + ZONES[save.attuned[id]].name + ")", fn: () => warpTo(id) })));
    } });
    openDialog(n.name, "The crystal's light washes over your party. HP and MP restored." + (isHome ? " This is your home point." : S.zone.safe ? " You can make this your home point: you'll return here if you fall." : " Camp crystals can't be home points, but you can warp here from any crystal you've touched."), opts);
  }
};

function warpStoneList() {
  const out = [];
  for (const id in NPCS) if (NPCS[id].warpstone && save.warps && save.warps[id]) out.push(id);
  return out;
}
function warpStoneCost(id) { return NPCS[id].warpZone === S.zoneId ? 0 : CONFIG.warpCost; }
function warpToStone(id) {
  const def = NPCS[id], z = def && ZONES[def.warpZone], c = z && z.npcs.find(q => q.id === id);
  if (!c) return;
  const cost = warpStoneCost(id);
  if (save.gil < cost) { log("Warping there costs " + cost + " crystals.", "sys"); return; }
  if (player.engaged || S.party.some(p => p.engaged)) { log("You can't warp in the middle of a fight.", "sys"); return; }
  save.gil -= cost;
  log(cost ? "The stone flares, and the world folds around you." : "The stone hums and you step through to " + def.name.replace("Warp Stone: ", "") + ".", "loot");
  vfx("crystal", { at: player });
  closeDialog();
  if (def.warpZone !== S.zoneId) { enterZone(def.warpZone, c.x, c.y + 70); return; }
  player.x = c.x; player.y = c.y + 70; S.moveTarget = null; S.chase = false;
  S.party.forEach((p, i) => { if (i > 0 && !(p.mercId && !p.alive)) { const o = arrivalSpot(i, player.x, player.y, player.face); p.x = o.x; p.y = o.y; keepInZone(p); keepOutOfColliders(p); p.px = p.x; p.py = p.y; } });
  player.px = player.x; player.py = player.y;
  sfx("unlock");
  if (typeof checkDistrict === "function") checkDistrict();
}
function openWarpStone(n) {
  save.warps = save.warps || {};
  if (!save.warps[n.id]) { save.warps[n.id] = true; log("You attune to the " + NPCS[n.id].name + ".", "loot"); saveGame(); }
  const dests = warpStoneList().filter(id => id !== n.id);
  if (!dests.length) { openDialog(NPCS[n.id].name, "A waist-high stone humming with pale light. Touch other warp stones to travel between them. Stones in the same city are free; stones in other cities cost " + CONFIG.warpCost + " crystals.", []); return; }
  const near = dests.filter(id => NPCS[id].warpZone === S.zoneId), far = dests.filter(id => NPCS[id].warpZone !== S.zoneId);
  const opts = [];
  if (near.length) opts.push({ label: "Warp within " + (S.zone.city || S.zone.name) + " (free)", fn: () => { closeDialog(); promptChoice("Warp to which district?", near.map(id => ({ label: NPCS[id].name.replace("Warp Stone: ", ""), fn: () => warpToStone(id) }))); } });
  if (far.length) opts.push({ label: "Warp to another city (" + CONFIG.warpCost + " crystals)", fn: () => { closeDialog(); promptChoice("Warp to which stone?", far.map(id => ({ label: NPCS[id].name.replace("Warp Stone: ", "") + " (" + ZONES[NPCS[id].warpZone].name + ")", fn: () => warpToStone(id) }))); } });
  openDialog(NPCS[n.id].name, "The stone hums as you touch it. Pick a stone you have already touched.", opts);
}
function warpCommand() {
  const n = S.npcs.find(q => NPCS[q.id] && NPCS[q.id].warpstone && dist(q, player) < 160);
  if (!n) { log("You must be next to a warp stone to use /warp.", "sys"); return; }
  openWarpStone(n);
}

function warpTo(id) {
  const zid = save.attuned && save.attuned[id], z = ZONES[zid];
  const c = z && z.npcs.find(q => q.id === id);
  if (!c) return;
  if (save.gil < CONFIG.warpCost) { log("Warping costs " + CONFIG.warpCost + " crystals.", "sys"); return; }
  if (player.engaged || S.party.some(p => p.engaged)) { log("You can't warp in the middle of a fight.", "sys"); return; }
  save.gil -= CONFIG.warpCost;
  log("The crystal flares, and the world folds around you.", "loot");
  vfx("crystal", { at: player });
  enterZone(zid, c.x, c.y + 80);
}
function onRoad(e) {
  for (const p of S.zone.paths || []) for (let i = 0; i < p.pts.length - 1; i++) {
    const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((e.x - a[0]) * dx + (e.y - a[1]) * dy) / l));
    if (Math.hypot(e.x - a[0] - dx * t, e.y - a[1] - dy * t) < p.w * 0.6) return true;
  }
  return false;
}
function startFerry(to, x, y, cost, msg, secs) {
  if (S.ferry) return;
  const fare = cost == null ? CONFIG.ferryCost : cost;
  if (save.gil < fare) { log("The ferry costs " + fare + " crystals.", "sys"); return; }
  if (player.engaged || S.party.some(p => p.engaged)) { log("Finish your fight before boarding.", "sys"); return; }
  save.gil -= fare;
  const fn = to !== "gullisle" && ZONES[to] && ZONES[to].npcs.find(q => NPCS[q.id] && NPCS[q.id].ferryTo);
  const dest = x != null ? { x, y } : to === "gullisle" ? { x: 440, y: 900 } : fn ? { x: fn.x - 70, y: fn.y } : { x: 560, y: 720 };
  S.ferry = { to, x: dest.x, y: dest.y, at: S.time + (secs || 6), boat: to === S.zoneId };
  log(msg || "You board the ferry. The sails fill, and the coast slips away... (6 seconds)", "npc");
  sfx("zone");
}
function tickFerry() {
  if (!S.ferry || S.time < S.ferry.at) return;
  const f = S.ferry;
  S.ferry = null;
  if (f.boat && f.to === S.zoneId) {
    for (const p of S.party) if (p.alive) { p.x = f.x + (p === player ? 0 : (Math.random() - 0.5) * 40); p.y = f.y + (p === player ? 0 : 30); p.px = p.x; p.py = p.y; }
    save.stats.boatRides = (save.stats.boatRides || 0) + 1;
    log("The boat scrapes onto the far landing.", "npc");
    return;
  }
  enterZone(f.to, f.x, f.y);
  log("The ferry bumps against the dock at " + ZONES[f.to].name + ".", "npc");
}
function expStep() { const e = save.exped; if (!e) return null; const X = EXPEDITIONS[e.id]; return X ? X.steps[e.step] : null; }
function expAdvance(msg) {
  const e = save.exped, X = EXPEDITIONS[e.id];
  e.step++; e.count = 0;
  const nx = X.steps[e.step];
  log((msg ? msg + " " : "") + "Expedition: " + X.name + " — " + (nx ? "next: " + nx.text : "complete!"), "npc");
  sfx("quest"); saveGame();
}
function expTick() {
  const st = expStep();
  if (!st) return;
  if (st.type === "zone" && inArea(st.zone, S.zoneId)) expAdvance("You reach " + ZONES[st.zone].name + ".");
  else if (st.type === "visit" && inArea(st.zone, S.zoneId)) { const lm = (S.zone.landmarks || []).find(l => l.id === st.lm); if (lm && Math.hypot(player.x - lm.x, player.y - lm.y) < lm.r) expAdvance("You stand at " + lm.name + "."); }
}
function expKill(m) {
  const st = expStep();
  if (!st || st.type !== "kill" || m.famKey !== st.fam) return;
  save.exped.count = (save.exped.count || 0) + 1;
  if (save.exped.count >= st.n) expAdvance("That makes " + st.n + ".");
  else log("Expedition: " + save.exped.count + "/" + st.n + " " + FAMILIES[st.fam].name + ".", "npc");
}
function expTalk(n) {
  const st = expStep();
  if (!st || st.type !== "talk" || st.npc !== n.id || st.final) return false;
  openDialog(n.name, st.say || "...", []);
  expAdvance();
  return true;
}
function expOptions() {
  const e = save.exped, st = expStep(), out = [];
  if (st && st.final) out.push({ label: "Report: " + EXPEDITIONS[e.id].name, fn: () => {
    const X = EXPEDITIONS[e.id], R = X.reward;
    closeDialog();
    save.expDone = save.expDone || {}; save.expDone[e.id] = Date.now();
    save.exped = null;
    gainXp(R.xp, 0); save.gil += R.gil; if (R.item) giveItem(R.item, 1);
    log("Expedition complete: " + X.name + "! You receive " + R.gil + " crystals" + (R.item ? " and " + an(ITEMS[R.item].name) : "") + ".", "loot");
    sfx("fanfare"); saveGame();
  } });
  else if (!e) for (const id in EXPEDITIONS) {
    const X = EXPEDITIONS[id];
    if ((save.expDone || {})[id] || player.lv < X.lv) continue;
    out.push({ label: "Expedition: " + X.name, fn: () => { openDialog("Maera, Adventurers' Guild", X.intro, [{ label: "Set out", fn: () => { save.exped = { id, step: 0, count: 0 }; closeDialog(); log("Expedition started: " + X.name + " — " + X.steps[0].text, "npc"); sfx("notify"); saveGame(); } }]); } });
  }
  return out;
}
function expReport() {
  const st = expStep();
  if (!st) return "You're not on an expedition. Maera at the Adventurers' Guild hands them out from level 12.";
  return "Expedition: " + EXPEDITIONS[save.exped.id].name + " — " + st.text + (st.type === "kill" ? " (" + (save.exped.count || 0) + "/" + st.n + ")" : "");
}
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

function koTick() {
  const now = Date.now();
  if (S.ko && player.koUntil && now >= player.koUntil) { log("An hour has passed. You are carried back to your home point.", "warn"); returnHome(); return; }
  if (save.mercBodies) for (const id of Object.keys(save.mercBodies)) {
    const b = save.mercBodies[id];
    if (now < b.until || S.party.some(p => p.mercId === id)) continue;
    delete save.mercBodies[id];
    if (save.mercDown) delete save.mercDown[id];
    if (CONFIG.mercPermadeath) { save.mercFallen[id] = now; const i = save.hired.indexOf(id); if (i >= 0) save.hired.splice(i, 1); if (save.mercContract) delete save.mercContract[id]; log((MERCS[id] ? MERCS[id].name : "A companion") + " has fallen and will not be coming back.", "foe"); }
    else dismissMerc(id, true);
    return;
  }
  for (const a of S.party) {
    if (a === player || a.alive || !a.mercId || !a.koUntil || now < a.koUntil) continue;
    a.koUntil = 0;
    if (save.mercDown) delete save.mercDown[a.mercId];
    if (save.mercBodies) delete save.mercBodies[a.mercId];
    if (CONFIG.mercPermadeath) { a.fallAt = S.time; mercFallTick(); return; }
    log(a.name + " limps back to the Mercenary Hall.", "foe");
    dismissMerc(a.mercId, true);
    return;
  }
}

function revive(t, pct, by) {
  if (!t || t.alive) return false;
  t.alive = true; t.hp = Math.max(1, Math.round(t.maxHp * pct)); t.mp = Math.round(t.maxMp * pct); t.tp = 0;
  t.koUntil = 0; t.buffs = { weakened: { until: S.time + CONFIG.weakenedSecs } }; t.stillSince = S.time;
  if (t.mercId && save.mercDown) delete save.mercDown[t.mercId];
  if (t.mercId && save.mercBodies) delete save.mercBodies[t.mercId];
  if (t === player) { S.ko = false; save.ko = null; showKO(false); log((by ? by + " revives you" : "You are revived") + ". You keep your experience.", "heal"); }
  else log(t.name + " is revived" + (by ? " by " + by : "") + ".", "heal");
  popText(t, "Revived", "#8cff98", 18, 1.4);
  ring(t, "#fff4c0", 30, 0.8, "sparkle");
  vfx("levelup", { tgt: t });
  sfx("cure", t);
  saveGame();
  return true;
}

function restoreKO() {
  const now = Date.now();
  for (const a of S.party) if (a.mercId && save.mercDown && save.mercDown[a.mercId] > now) { a.alive = false; a.hp = 0; a.koUntil = save.mercDown[a.mercId]; }
  if (save.ko && save.ko.until) {
    if (save.ko.until > now) { player.alive = false; player.hp = 0; player.koUntil = save.ko.until; S.ko = true; showKO(true); }
    else { save.ko = null; returnHome(); }
  }
}

function giveUpKO() {
  if (!S.ko) return;
  gameConfirm ? gameConfirm("Back to Home Point", "Return to your home point now? You'll lose experience. Anyone could still raise you if you wait.", () => returnHome(), { yes: "Return", no: "Wait" }) : returnHome();
}

function returnHome() {
  save.ko = null;
  const j = save.jobs[save.mainJob];
  const loss = Math.min(j.xp, Math.floor(xpNeed(j.lv) * CONFIG.deathXpLossPct));
  if (loss > 0 && j.lv < CONFIG.levelCap) { j.xp -= loss; log("You lose " + loss + " experience points.", "foe"); }
  S.ko = false;
  showKO(false);
  for (const p of S.party) { if (p.mercId && !p.alive) continue; p.alive = true; p.hp = p.maxHp; p.mp = p.maxMp; p.tp = 0; p.buffs = {}; p.mounted = false; p.koUntil = 0; }
  player.buffs.weakened = { until: S.time + CONFIG.weakenedSecs };
  const h = homePos();
  enterZone(h.zone, h.x, h.y);
}

function canEquip(id) {
  const it = ITEMS[id];
  if (!it.jobs.includes(save.mainJob)) return "Not usable by " + save.mainJob;
  if (it.lv > save.jobs[save.mainJob].lv) return "Requires Lv." + it.lv;
  return "";
}

function equip(id, want) {
  const why = canEquip(id);
  if (why) { log(why + ".", "sys"); sfx("error"); return; }
  const it = ITEMS[id];
  if (!removeItem(id, 1)) return;
  const key = slotFor(id, save.gear, want);
  const old = save.gear[key];
  if (old) giveItem(old, 1, true);
  save.gear[key] = id;
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
  if (!jobUnlocked(main)) { log("You haven't unlocked that job yet.", "sys"); sfx("error"); return; }
  if (sub && !save.supportUnlocked) { log("Support jobs are locked. Talk to Tobin.", "sys"); return; }
  if (sub && !jobUnlocked(sub)) { log("You haven't unlocked that job yet.", "sys"); sfx("error"); return; }
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

function conquestDay() { return Math.floor((Date.now() + (S.timeShift || 0)) / 86400000); }
function regionOf(zoneId) { const a = areaOf(zoneId); for (const r in CONQUEST.regions) if (CONQUEST.regions[r].zones.includes(zoneId) || CONQUEST.regions[r].zones.includes(a)) return r; return null; }
function conquestState() {
  const c = save.conquest || (save.conquest = { day: conquestDay(), pts: {}, held: {}, nation: null });
  for (const r in CONQUEST.regions) if (!c.held[r]) c.held[r] = CONQUEST.regions[r].start;
  const d = conquestDay();
  if (c.day !== d) {
    for (const r in CONQUEST.regions) {
      const p = c.pts[r] || {};
      const tally = { ash: (p.ash || 0) + (c.nation === "ash" ? 0 : CONQUEST.rivalDaily), iron: (p.iron || 0) + (c.nation === "iron" ? 0 : CONQUEST.rivalDaily), beast: (p.beast || 0) + CONQUEST.beastDaily };
      tally[c.held[r]] += CONQUEST.holdBonus;
      c.held[r] = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    }
    c.day = d; c.pts = {};
  }
  return c;
}
function conquestKill(m) {
  const c = conquestState(), r = regionOf(S.zoneId);
  if (!r || !c.nation) return;
  const p = c.pts[r] || (c.pts[r] = {});
  p[c.nation] = (p[c.nation] || 0) + Math.max(1, Math.round(m.lv / 2));
}
function heldCount(side) { const c = conquestState(); return Object.values(c.held).filter(x => x === side).length; }
function conquestPriceMul() {
  const c = conquestState();
  if (!c.nation) return 1;
  const mine = heldCount(c.nation), beast = heldCount("beast");
  return mine >= 3 ? 0.9 : beast >= 3 ? 1.1 : 1;
}
function conquestXpMul() {
  const c = conquestState(), r = regionOf(S.zoneId);
  return r && c.nation && c.held[r] === c.nation ? 1.05 : 1;
}
function buyPrice(id) { return Math.max(1, Math.round(ITEMS[id].price * CONFIG.shopMul * conquestPriceMul())); }
function conquestReport() {
  const c = conquestState(), N = CONQUEST.nations;
  const lines = Object.keys(CONQUEST.regions).map(r => { const R = CONQUEST.regions[r], p = c.pts[r] || {}; return R.name + ": held by " + N[c.held[r]].short + (c.nation ? " (today: your nation " + (p[c.nation] || 0) + " points)" : ""); });
  return (c.nation ? "You fight for the " + N[c.nation].name + ". " : "You haven't pledged to a nation. Talk to Captain Rhea in Ashenreach or Brisa in Ironvale. ") + lines.join(". ") + ". Standings are tallied once a day.";
}
function pledge(side) {
  const c = conquestState();
  c.nation = side;
  log("You pledge yourself to the " + CONQUEST.nations[side].name + ". Your victories in the wilds now count toward its hold on each region.", "loot");
  sfx("unlock"); saveGame();
}
function sellPrice(id) { const it = ITEMS[id]; return it.rare || it.ex ? 0 : Math.floor(it.price / 4 * (1 + buddyPerk("sell"))); }

function buy(id) {
  const it = ITEMS[id], price = buyPrice(id);
  if (save.gil < price) { log("You cannot afford the " + it.name + ".", "sys"); sfx("error"); return; }
  if (!giveItem(id, 1, true)) return;
  save.gil -= price;
  log("You buy " + an(it.name) + " for " + price + " crystals.", "loot");
  sfx("buy");
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
  if (d.offline && !PLAY.offline) { log("That save belongs to an offline character. Offline characters can never be brought online.", "foe"); sfx("error"); return; }
  if (PLAY.offline) d.offline = true;
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

const EMOTES = { wave: "waves", bow: "bows", cheer: "cheers", dance: "dances", laugh: "laughs", nod: "nods", clap: "claps", point: "points", salute: "salutes", panic: "panics", cry: "cries", thumbsup: "gives a thumbs up", shrug: "shrugs", think: "thinks it over", beckon: "beckons", stretch: "stretches", kneel: "kneels", flex: "flexes" };
const EMOTE_LEN = { dance: 5, panic: 3, stretch: 3.2, kneel: 3.4, beckon: 2.8, think: 3 };
const emoteLen = id => EMOTE_LEN[id] || 2.4;
const COMMANDS = [
  ["/rest", "Sit down and recover HP and MP quickly. Also /heal or /sit. Type it again or move to stand up."],
  ["/pet", "Summon or dismiss your equipped pet."],
  ["/say text", "Talk to players near you (or just type without a slash). Also /s."],
  ["/shout text", "Talk to everyone in this area. Also /sh."],
  ["/tell Name text", "Private message to a player anywhere. Also /t. /r replies to the last tell."],
  ["/who", "List players online and where they are."],
  ["/warp", "Open the warp menu when you are standing next to a warp stone."],
  ["/invite Name", "Invite a player to your party (up to 6 players). Also /pcmd add Name."],
  ["/join · /decline", "Accept or turn down a party invitation."],
  ["/p text", "Talk to your party, wherever they are. Also /party text."],
  ["/leave", "Leave your party."],
  ["/kick Name", "Party leader only: remove a player from the party."],
  ["/trade Name", "Ask a nearby player to trade items and crystals."],
  ["/l text", "Talk to your active linkshell. /l1, /l2, /l3 pick a linkshell by its place in the Social window. /lsjoin accepts an invitation."],
  ["/friend add|remove Name", "Manage your friend list. /friend on its own lists who's online. You're told when friends come online."],
  ["/search [words]", "Find adventurers online. Words can be a job (WHM), a level (12) or range (10-15), an area, a name, 'lfg' or 'here'. Also /sea."],
  ["/seek [message]", "Toggle looking for a party, with an optional short message others see in /search. Also /lfg."],
  ["/blacklist add|remove Name", "Hide messages, invitations and trade requests from a player. Also /bl."],
  ["/social", "Open the Social window: search, friends, linkshells and blacklist."],
  ["/fish", "Cast a line at the water's edge (needs a Willow Rod and Fishing Bait). Type it again when something bites to reel in."],
  ["/weather", "Show the current weather and its element bonus."],
  ["/stance assist|follow|hold", "Tell your companions how to fight: assist your target, follow without attacking, or hold their ground."],
  ["/party", "Open the Party tab: players, companions, stance, gear, bond and wages. Also P."],
  ["/bestiary", "Open the bestiary. Also Y."],
  ["/achievements", "Open your achievements."],
  ["/stand", "Stand up."],
  ["/attack", "Attack your target, or the nearest enemy. Also /a."],
  ["/target name", "Target the nearest character whose name matches. Also /ta."],
  ["/assist [Name]", "Target what your party is fighting, or what a named player nearby has targeted."],
  ["/check", "Inspect your target: how tough it looks and whether it is hostile. Also /c."],
  ["/cast spell", "Cast a spell by name, e.g. /cast cure. Also /ma."],
  ["/ja ability", "Use a job ability, e.g. /ja provoke."],
  ["/ws name", "Use a weapon skill, e.g. /ws fast blade."],
  ["/item name", "Use an item, e.g. /item potion."],
  ["/mount, /dismount", "Call or dismiss your Thornstrider."],
  ["/jump", "Jump."],
  ["/craft", "Open the Crafting window."],
  ["/time", "Show the game time and weekday."],
  ["/where", "Show your zone and position."],
  ["/clear", "Clear the chat log."],
  ["/fps", "Show or hide the frame-rate counter."],
  ["/perf", "Show how long the game took to start and to load recent zones."],
  ["/clearcache", "Delete the saved ground textures and item icons so they are rebuilt (use if something looks wrong after an update)."],
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
  if (player && text && (text[0] !== "/" || /^\/(s|say|sh|shout|p|party|l\d?|t|tell|r|reply) /.test(text))) player.talkUntil = S.time + Math.min(5, 0.6 + text.length * 0.04);
  text = String(text || "").trim();
  if (!text) return;
  if (text[0] !== "/") { if (typeof netChat === "function") netChat("say", text); else log(save.name + ": " + text, "say"); return; }
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
    case "s": case "say": if (typeof netChat === "function") netChat("say", arg); else log(save.name + ": " + arg, "say"); return;
    case "sh": case "shout": if (typeof netChat === "function") netChat("shout", arg); else log(save.name + " shouts: " + arg, "shout"); return;
    case "t": case "tell": { const s2 = arg.indexOf(" "); if (typeof netTell === "function") netTell(s2 < 0 ? arg : arg.slice(0, s2), s2 < 0 ? "" : arg.slice(s2 + 1)); else log("Tells need the game server.", "sys"); return; }
    case "r": case "reply": if (typeof NET_RT !== "undefined" && NET_RT.lastTell) netTell(NET_RT.lastTell, arg); else log("Nobody has sent you a tell yet.", "sys"); return;
    case "warp": warpCommand(); return;
    case "who": if (typeof netWho === "function") netWho(); else log("You're playing alone.", "sys"); return;
    case "pet": { const why = toggleBuddy(); if (why) { log(why, "sys"); sfx("error"); } return; }
    case "stance": setStance((arg || "").toLowerCase().trim()); return;
    case "fish": { if (S.fish && S.fish.state === "bite") { reelFish(); return; } const why = startFishing(); if (why) { log(why, "sys"); sfx("error"); } return; }
    case "weather": { const w = weatherNow(); log(w ? "Weather: " + WEATHER_INFO[w].name + (WEATHER_INFO[w].el ? " (" + WEATHER_INFO[w].el + " spells +10%)" : "") + "." : "No weather here.", "sys"); return; }
    case "party": if (arg && typeof netPartyChat === "function") { netPartyChat(arg); return; } if (typeof openMenu === "function") openMenu("party"); return;
    case "p": if (typeof netPartyChat === "function") netPartyChat(arg); else log("Party chat needs the game server.", "sys"); return;
    case "invite": case "pinvite": if (typeof netPartyInvite === "function") netPartyInvite(arg); else log("Parties need the game server.", "sys"); return;
    case "pcmd": { const [sub, ...rest] = arg.split(/\s+/); const who = rest.join(" "); if (typeof netPartyInvite !== "function") { log("Parties need the game server.", "sys"); return; } if (sub === "add") netPartyInvite(who); else if (sub === "leave") netPartyLeave(); else if (sub === "kick" || sub === "remove") netPartyKick(who); else log("Usage: /pcmd add|leave|kick Name", "sys"); return; }
    case "join": if (typeof netPartyJoin === "function") netPartyJoin(); return;
    case "decline": if (typeof netPartyDecline === "function") netPartyDecline(); return;
    case "leave": if (typeof netPartyLeave === "function") netPartyLeave(); return;
    case "kick": if (typeof netPartyKick === "function") netPartyKick(arg); return;
    case "l": case "linkshell": if (typeof netLsChat === "function") netLsChat(arg); else log("Linkshells need the game server.", "sys"); return;
    case "l1": case "l2": case "l3": if (typeof netLsChat === "function") netLsChat(arg, +cmd[1] - 1); return;
    case "lsjoin": if (typeof netLsJoin === "function") netLsJoin().catch(e => log(netAhErr(e), "sys")); return;
    case "friend": case "friends": case "fl": { const [sub, ...rest] = arg.split(/\s+/); if (typeof netFriend === "function") netFriend((sub || "list").toLowerCase(), rest.join(" ")); return; }
    case "blacklist": case "bl": { const [sub, ...rest] = arg.split(/\s+/); if (typeof netBlock === "function") netBlock((sub || "list").toLowerCase(), rest.join(" ")); return; }
    case "search": case "sea": if (typeof netSearchLog === "function") netSearchLog(arg); else log("Search needs the game server.", "sys"); return;
    case "seek": case "lfg": if (typeof netSeek === "function") netSeek(arg ? true : !save.lfg, arg || null); return;
    case "social": if (typeof openMenu === "function") openMenu("social"); return;
    case "trade": if (typeof netTradeAsk === "function") netTradeAsk(arg || (player.target && player.target.kind === "remote" ? player.target.name : "")); else log("Trading needs the game server.", "sys"); return;
    case "bestiary": case "beasts": case "database": if (typeof openMenu === "function") { UI.dbCat = "beasts"; openMenu("database"); } return;
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
      if (arg && typeof netAssist === "function") { netAssist(arg); return; }
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
    case "conquest": case "regions": log(conquestReport(), "sys"); break;
    case "expedition": case "exp": log(expReport(), "sys"); break;
    case "time": case "clock": { const v = vana(); log("Leid'anav: " + gameDate() + " (" + DAY_NAMES[v.dayIndex] + ") " + String(v.hour).padStart(2, "0") + ":" + String(v.minute).padStart(2, "0") + " · " + (isNight() ? "night" : "day") + " · " + dayElement() + " spells +10% today.", "sys"); log("Earth: " + new Date().toLocaleString([], { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }), "sys"); return; }
    case "where": case "pos": log(S.zone.name + " (" + Math.round(player.x) + ", " + Math.round(player.y) + ")", "sys"); return;
    case "clear": if (typeof clearLog === "function") clearLog(); return;
    case "clearcache": if (typeof cacheClear === "function") cacheClear().then(() => log("Saved textures and icons cleared. They rebuild on the next load.", "sys")); return;
    case "perf": if (typeof PERF !== "undefined") { for (const l of PERF.table()) log(l, "sys"); const pr = PERF.props(); log(pr.length ? "Props above ground: " + pr.slice(0, 4).map(x => x.mesh + " " + x.high + "/" + x.count + " up to " + x.maxAbove).join("; ") : "No props float above the ground.", "sys"); } return;
    case "fps": if (typeof VIEW !== "undefined" && VIEW.settings) { VIEW.settings.fps = !VIEW.settings.fps; saveSettings(VIEW.settings); log("FPS counter " + (VIEW.settings.fps ? "on" : "off") + ".", "sys"); } return;
    case "help": case "?": case "commands": for (const [c, d] of COMMANDS) log(c + " — " + d, "sys"); return;
  }
  if (EMOTES[cmd]) {
    const t = player.target && player.target !== player ? (isMob(player.target) ? " at the " : " at ") + player.target.name : "";
    log(save.name + " " + EMOTES[cmd] + t + ".", "say");
    if (player.resting) standUp(player, true);
    player.emote = { id: cmd, at: S.time };
    if (player.target && player.target !== player) player.face = Math.atan2(player.target.y - player.y, player.target.x - player.x);
    if (typeof netEmote === "function") netEmote(cmd);
    return;
  }
  log("Unknown command: /" + cmd + ". Type /help for a list.", "sys");
  sfx("error");
}
