const CONFIG = {
  levelCap: 10,
  meleeRange: 42,
  tpMax: 3000,
  tpPerDelay: 40,
  hitCap: 95,
  hitFloor: 20,
  critPct: 5,
  critMult: 1.5,
  wsAccBonus: 20,
  chainDelay: 1.0,
  chainWindow: 6.0,
  burstWindow: 8.0,
  scMult: { 1: 0.5, 2: 0.6 },
  burstMult: { 1: 1.35, 2: 1.5 },
  interruptChance: 0.4,
  castRange: 230,
  abilityRange: 230,
  talkRange: 70,
  xpTable: [0, 200, 400, 650, 950, 1300, 1700, 2200, 2850, 3600],
  chainWindow: 60,
  chainMax: 5,
  chainStep: 0.1,
  respawn: 30,
  leash: 520,
  linkRange: 150,
  inventorySize: 30,
  storageBase: 20,
  itemRecast: 3,
  deathXpLossPct: 0.1,
  regenDelay: 3,
  regenHp: 0.006,
  regenMp: 0.008,
  restHp: 0.035,
  restMp: 0.045,
  restDelay: 2,
  allyRegen: 0.05,
  allyReviveAfter: 6,
  outOfCombatAfter: 3,
  maxParty: 6,
  supportUnlockLevel: 5,
  synthTime: 3,
  craftCap: 20,
  tile: 40,
  saveKey: "ashenreach_save_v2",
  settingsKey: "ashenreach_settings_v1",
  startGil: 100,
  mountSpeed: 2.2
};

const ELEMENT_COLORS = { fire: "#ff7043", ice: "#81d4fa", wind: "#9ccc65", earth: "#d7b46a", lightning: "#ce93d8", water: "#4fc3f7", light: "#fff59d", dark: "#9575cd" };

const SC_PROPS = {
  Liquefaction: { lv: 1, el: ["fire"] },
  Scission: { lv: 1, el: ["earth"] },
  Reverberation: { lv: 1, el: ["water"] },
  Detonation: { lv: 1, el: ["wind"] },
  Impaction: { lv: 1, el: ["lightning"] },
  Induration: { lv: 1, el: ["ice"] },
  Compression: { lv: 1, el: ["dark"] },
  Transfixion: { lv: 1, el: ["light"] },
  Fusion: { lv: 2, el: ["fire", "light"] },
  Fragmentation: { lv: 2, el: ["wind", "lightning"] },
  Gravitation: { lv: 2, el: ["earth", "dark"] },
  Distortion: { lv: 2, el: ["water", "ice"] }
};

const SC_TABLE = [
  ["Liquefaction", "Impaction", "Fusion"],
  ["Distortion", "Fusion", "Fusion"],
  ["Induration", "Reverberation", "Fragmentation"],
  ["Gravitation", "Fragmentation", "Fragmentation"],
  ["Detonation", "Compression", "Gravitation"],
  ["Fusion", "Gravitation", "Gravitation"],
  ["Transfixion", "Scission", "Distortion"],
  ["Fragmentation", "Distortion", "Distortion"],
  ["Impaction", "Liquefaction", "Liquefaction"],
  ["Scission", "Liquefaction", "Liquefaction"],
  ["Liquefaction", "Scission", "Scission"],
  ["Detonation", "Scission", "Scission"],
  ["Transfixion", "Reverberation", "Reverberation"],
  ["Scission", "Reverberation", "Reverberation"],
  ["Scission", "Detonation", "Detonation"],
  ["Compression", "Detonation", "Detonation"],
  ["Impaction", "Detonation", "Detonation"],
  ["Reverberation", "Impaction", "Impaction"],
  ["Induration", "Impaction", "Impaction"],
  ["Reverberation", "Induration", "Induration"],
  ["Induration", "Compression", "Compression"],
  ["Transfixion", "Compression", "Compression"],
  ["Compression", "Transfixion", "Transfixion"]
];

const ATTRS = ["str", "dex", "vit", "agi", "int", "mnd"];
const SLOTS = ["main", "head", "body", "hands", "legs", "feet", "ring"];
const SLOT_NAMES = { main: "Main", head: "Head", body: "Body", hands: "Hands", legs: "Legs", feet: "Feet", ring: "Ring" };
const ALL_JOBS = ["WAR", "WHM", "BLM", "PLD", "RDM"];
const BASE_JOBS = ["WAR", "WHM", "BLM"];
const ADVANCED_JOBS = { PLD: { quest: "pld", lv: 6 }, RDM: { quest: "rdm", lv: 6 } };

const JOBS = {
  WAR: { name: "Warrior", color: "#e57373", icon: "⚔️", hp: [70, 14], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [9, 0.8], agi: [7, 0.7], int: [6, 0.5], mnd: [6, 0.5] },
  WHM: { name: "White Mage", color: "#eeeeee", icon: "✚", hp: [52, 10], mp: [22, 7], str: [7, 0.6], dex: [7, 0.6], vit: [7, 0.7], agi: [7, 0.6], int: [7, 0.7], mnd: [10, 1.0] },
  BLM: { name: "Black Mage", color: "#9575cd", icon: "✦", hp: [46, 9], mp: [26, 8], str: [6, 0.5], dex: [7, 0.6], vit: [6, 0.5], agi: [7, 0.7], int: [10, 1.0], mnd: [7, 0.6] },
  PLD: { name: "Paladin", color: "#90caf9", icon: "🛡️", hp: [68, 13], mp: [12, 4], str: [8, 0.8], dex: [7, 0.7], vit: [10, 1.0], agi: [6, 0.6], int: [5, 0.4], mnd: [8, 0.8], advanced: true },
  RDM: { name: "Red Mage", color: "#f48fb1", icon: "🎩", hp: [56, 11], mp: [20, 6], str: [7, 0.7], dex: [8, 0.8], vit: [7, 0.6], agi: [7, 0.7], int: [8, 0.8], mnd: [8, 0.8], advanced: true }
};

const WEAPON_SKILLS = {
  fast_blade: { name: "Fast Blade", wtype: "sword", skill: 5, props: ["Scission", "Detonation"], ftp: [1.5, 2.0, 2.5] },
  burning_blade: { name: "Burning Blade", wtype: "sword", skill: 22, props: ["Liquefaction"], ftp: [1.8, 2.6, 3.4] },
  red_lotus_blade: { name: "Red Lotus Blade", wtype: "sword", skill: 40, props: ["Liquefaction", "Detonation"], ftp: [2.2, 3.0, 3.8] },
  shining_strike: { name: "Shining Strike", wtype: "club", skill: 5, props: ["Impaction"], ftp: [1.6, 2.2, 2.8] },
  seraph_strike: { name: "Seraph Strike", wtype: "club", skill: 27, props: ["Impaction"], ftp: [2.0, 2.8, 3.6] },
  brainshaker: { name: "Brainshaker", wtype: "club", skill: 40, props: ["Reverberation"], ftp: [1.8, 2.4, 3.0] },
  heavy_swing: { name: "Heavy Swing", wtype: "staff", skill: 5, props: ["Impaction"], ftp: [1.5, 2.0, 2.5] },
  rock_crusher: { name: "Rock Crusher", wtype: "staff", skill: 22, props: ["Impaction"], ftp: [1.8, 2.5, 3.2] },
  earth_crusher: { name: "Earth Crusher", wtype: "staff", skill: 40, props: ["Detonation", "Impaction"], ftp: [2.1, 2.9, 3.7] },
  shield_break: { name: "Shield Break", wtype: "greataxe", skill: 5, props: ["Impaction"], ftp: [1.6, 2.2, 2.8] },
  iron_tempest: { name: "Iron Tempest", wtype: "greataxe", skill: 22, props: ["Scission"], ftp: [1.9, 2.7, 3.5] },
  sturmwind: { name: "Sturmwind", wtype: "greataxe", skill: 40, props: ["Reverberation", "Scission"], ftp: [2.2, 3.0, 3.8] }
};

const ABILITIES = {
  provoke: { name: "Provoke", job: "WAR", lv: 1, recast: 30, target: "enemy", enmity: 600, desc: "Draws the target's attention to you." },
  berserk: { name: "Berserk", job: "WAR", lv: 3, recast: 60, target: "self", buff: "berserk", dur: 30, desc: "Attack +25%, Defense −25% for 30 s." },
  divine_seal: { name: "Divine Seal", job: "WHM", lv: 3, recast: 60, target: "self", buff: "divine_seal", dur: 60, desc: "Your next Cure heals twice as much." },
  elemental_seal: { name: "Elemental Seal", job: "BLM", lv: 3, recast: 60, target: "self", buff: "elemental_seal", dur: 60, desc: "Your next nuke deals 50% more damage." },
  sentinel: { name: "Sentinel", job: "PLD", lv: 3, recast: 90, target: "self", buff: "sentinel", dur: 30, desc: "Defense +50% and every action draws double enmity for 30 s." },
  shield_bash: { name: "Shield Bash", job: "PLD", lv: 6, recast: 60, target: "enemy", enmity: 350, desc: "Bashes the target for light damage and interrupts its casting or TP move." },
  convert: { name: "Convert", job: "RDM", lv: 8, recast: 120, target: "self", desc: "Swaps your current HP and MP." }
};

const BUFF_NAMES = { berserk: "Berserk", divine_seal: "Divine Seal", elemental_seal: "Elemental Seal", dia: "Dia", sentinel: "Sentinel", flash: "Flash", slow: "Slow", paralyze: "Paralyze", protect: "Protect" };
const BUFF_ICONS = { berserk: "💢", divine_seal: "✚", elemental_seal: "✦", dia: "☀", sentinel: "🛡️", flash: "✨", slow: "🐌", paralyze: "⚡", protect: "🔰" };

const SPELLS = {
  cure: { name: "Cure", jobs: { WHM: 1, PLD: 5, RDM: 3 }, mp: 8, cast: 2.0, recast: 5, kind: "heal", power: 22, mnd: 1.0, target: "ally", desc: "Restores HP." },
  cure2: { name: "Cure II", jobs: { WHM: 6 }, mp: 22, cast: 2.25, recast: 6, kind: "heal", power: 60, mnd: 1.5, target: "ally", desc: "Restores a lot of HP." },
  dia: { name: "Dia", jobs: { WHM: 1, RDM: 1 }, mp: 6, cast: 1.0, recast: 6, kind: "dot", element: "light", power: 5, target: "enemy", desc: "Light damage over time and lowers defense." },
  banish: { name: "Banish", jobs: { WHM: 4 }, mp: 12, cast: 1.5, recast: 10, kind: "nuke", element: "light", power: 22, stat: "mnd", target: "enemy", desc: "Light damage. Strong against undead." },
  stone: { name: "Stone", jobs: { BLM: 1, RDM: 4 }, mp: 4, cast: 1.0, recast: 5, kind: "nuke", element: "earth", power: 12, stat: "int", target: "enemy", desc: "Earth damage." },
  water: { name: "Water", jobs: { BLM: 3, RDM: 6 }, mp: 5, cast: 1.25, recast: 5, kind: "nuke", element: "water", power: 15, stat: "int", target: "enemy", desc: "Water damage." },
  aero: { name: "Aero", jobs: { BLM: 5, RDM: 8 }, mp: 6, cast: 1.5, recast: 6, kind: "nuke", element: "wind", power: 19, stat: "int", target: "enemy", desc: "Wind damage." },
  fire: { name: "Fire", jobs: { BLM: 6, RDM: 10 }, mp: 8, cast: 1.75, recast: 6, kind: "nuke", element: "fire", power: 24, stat: "int", target: "enemy", desc: "Fire damage." },
  blizzard: { name: "Blizzard", jobs: { BLM: 8 }, mp: 10, cast: 2.0, recast: 7, kind: "nuke", element: "ice", power: 30, stat: "int", target: "enemy", desc: "Ice damage." },
  thunder: { name: "Thunder", jobs: { BLM: 10 }, mp: 12, cast: 2.25, recast: 8, kind: "nuke", element: "lightning", power: 37, stat: "int", target: "enemy", desc: "Lightning damage." },
  flash: { name: "Flash", jobs: { PLD: 7 }, mp: 10, cast: 0.5, recast: 30, kind: "debuff", element: "light", buff: "flash", dur: 12, enmity: 300, target: "enemy", desc: "Blinds the target (accuracy −40%) for 12 s and draws a lot of enmity." },
  slow: { name: "Slow", jobs: { RDM: 5 }, mp: 9, cast: 2.0, recast: 10, kind: "debuff", element: "earth", buff: "slow", dur: 60, enmity: 80, target: "enemy", desc: "The target attacks 25% slower for 60 s." },
  paralyze: { name: "Paralyze", jobs: { RDM: 7 }, mp: 10, cast: 2.0, recast: 10, kind: "debuff", element: "ice", buff: "paralyze", dur: 45, enmity: 80, target: "enemy", desc: "The target sometimes freezes up and loses its attack for 45 s." },
  protect: { name: "Protect", jobs: { WHM: 7, PLD: 9, RDM: 9 }, mp: 9, cast: 2.0, recast: 10, kind: "buff", buff: "protect", dur: 600, target: "ally", desc: "Defense +15% for 10 minutes." }
};

const SKILL_NAMES = { sword: "Sword", club: "Club", staff: "Staff", greataxe: "Great Axe", h2h: "Hand-to-Hand", healing: "Healing Magic", divine: "Divine Magic", elemental: "Elemental Magic", enfeebling: "Enfeebling Magic", enhancing: "Enhancing Magic" };
const COMBAT_SKILLS = ["sword", "club", "staff", "greataxe", "h2h"];
const MAGIC_SKILLS = ["healing", "divine", "elemental", "enfeebling", "enhancing"];
const SKILL_RATINGS = {
  WAR: { sword: "B", club: "B", staff: "B", greataxe: "A", h2h: "D" },
  WHM: { club: "B", staff: "C", h2h: "E", healing: "B", divine: "C", enhancing: "B" },
  BLM: { club: "D", staff: "C", h2h: "E", elemental: "B", enfeebling: "C" },
  PLD: { sword: "A", club: "B", staff: "C", greataxe: "D", h2h: "D", healing: "C", divine: "B", enhancing: "C" },
  RDM: { sword: "B", club: "D", staff: "D", h2h: "E", healing: "C", divine: "D", elemental: "C", enfeebling: "B", enhancing: "B" }
};
const RATING_CAP = { A: [3, 5.5], B: [3, 5], C: [2, 4.5], D: [2, 4], E: [1, 3.5] };
const SPELL_SKILL = { heal: "healing", dot: "divine", nuke: null, debuff: "enfeebling", buff: "enhancing" };

const GATHER = {
  mining: { name: "Mining", tool: "pickaxe", icon: "⛏️", verb: "dig" },
  logging: { name: "Logging", tool: "hatchet", icon: "🪓", verb: "chop" },
  harvesting: { name: "Harvesting", tool: "sickle", icon: "🌾", verb: "harvest" }
};

const ALL_J = ALL_JOBS;
const ITEMS = {
  potion: { name: "Potion", kind: "use", icon: "🧪", heal: 60, price: 40, stack: 12, desc: "Restores 60 HP." },
  potion_hq: { name: "Potion +1", kind: "use", icon: "🧪", hq: true, heal: 85, price: 60, stack: 12, desc: "Restores 85 HP." },
  hi_potion: { name: "Hi-Potion", kind: "use", icon: "⚗️", heal: 150, price: 160, stack: 12, desc: "Restores 150 HP." },
  ether: { name: "Ether", kind: "use", icon: "💧", mpRestore: 40, price: 100, stack: 12, desc: "Restores 40 MP." },
  ether_hq: { name: "Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 55, price: 140, stack: 12, desc: "Restores 55 MP." },
  fire_crystal: { name: "Fire Crystal", kind: "crystal", icon: "🔥", element: "fire", price: 30, stack: 12, desc: "Used in Smithing synthesis." },
  wind_crystal: { name: "Wind Crystal", kind: "crystal", icon: "🌪️", element: "wind", price: 30, stack: 12, desc: "Used in Woodworking synthesis." },
  earth_crystal: { name: "Earth Crystal", kind: "crystal", icon: "🪨", element: "earth", price: 30, stack: 12, desc: "Used in Clothcraft synthesis." },
  water_crystal: { name: "Water Crystal", kind: "crystal", icon: "🌊", element: "water", price: 30, stack: 12, desc: "Used in Alchemy synthesis." },
  copper_ore: { name: "Copper Ore", kind: "mat", icon: "🟫", price: 20, stack: 12, desc: "Smelt into Bronze Ingots." },
  iron_ore: { name: "Iron Ore", kind: "mat", icon: "⬛", price: 80, stack: 12, desc: "Smelt into Iron Ingots." },
  bronze_ingot: { name: "Bronze Ingot", kind: "mat", icon: "🟧", price: 60, stack: 12, desc: "Smithing material." },
  iron_ingot: { name: "Iron Ingot", kind: "mat", icon: "⬜", price: 220, stack: 12, desc: "Smithing material." },
  ash_log: { name: "Ash Log", kind: "mat", icon: "🪵", price: 15, stack: 12, desc: "Cut into Ash Lumber." },
  ash_lumber: { name: "Ash Lumber", kind: "mat", icon: "🪵", price: 40, stack: 12, desc: "Woodworking material." },
  healing_herb: { name: "Healing Herb", kind: "mat", icon: "🌿", price: 12, stack: 12, desc: "Alchemy material." },
  silk_cloth: { name: "Silk Cloth", kind: "mat", icon: "🧵", price: 110, stack: 12, desc: "Clothcraft material." },
  pickaxe: { name: "Pickaxe", kind: "tool", icon: "⛏️", price: 60, stack: 12, desc: "Needed for Mining points. May break." },
  hatchet: { name: "Hatchet", kind: "tool", icon: "🪓", price: 60, stack: 12, desc: "Needed for Logging points. May break." },
  sickle: { name: "Sickle", kind: "tool", icon: "🌾", price: 50, stack: 12, desc: "Needed for Harvesting points. May break." },
  goblin_pouch: { name: "Goblin Pouch", kind: "mat", icon: "👝", price: 40, stack: 12, desc: "A grimy pouch. Captain Rhea wants these." },
  bat_wing: { name: "Bat Wing", kind: "mat", icon: "🦇", price: 32, stack: 12, desc: "Leathery. Used in Clothcraft and Alchemy." },
  worm_silk: { name: "Worm Silk", kind: "mat", icon: "🪱", price: 48, stack: 12, desc: "Spin into Silk Cloth." },
  bone_chip: { name: "Bone Chip", kind: "mat", icon: "🦴", price: 60, stack: 12, desc: "Used in advanced recipes." },
  bronze_sword: { name: "Bronze Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 6, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 1, price: 80 },
  bronze_sword_hq: { name: "Bronze Sword +1", kind: "equip", icon: "🗡️", hq: true, slot: "main", wtype: "sword", dmg: 7, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 1, price: 200, stats: { acc: 2 } },
  iron_sword: { name: "Iron Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 10, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 6, price: 900 },
  iron_sword_hq: { name: "Iron Sword +1", kind: "equip", icon: "🗡️", hq: true, slot: "main", wtype: "sword", dmg: 11, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 6, price: 1800, stats: { acc: 3, att: 3 } },
  ash_club: { name: "Ash Club", kind: "equip", icon: "🏏", slot: "main", wtype: "club", dmg: 5, delay: 2.6, jobs: ["WAR", "WHM", "PLD", "RDM"], lv: 1, price: 60 },
  maple_wand: { name: "Maple Wand", kind: "equip", icon: "🪄", slot: "main", wtype: "club", dmg: 8, delay: 2.6, jobs: ["WHM", "BLM", "RDM"], lv: 5, price: 700, stats: { mnd: 2, int: 1 } },
  ash_staff: { name: "Ash Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 7, delay: 3.4, jobs: ALL_J, lv: 1, price: 70 },
  ash_staff_hq: { name: "Ash Staff +1", kind: "equip", icon: "🦯", hq: true, slot: "main", wtype: "staff", dmg: 8, delay: 3.4, jobs: ALL_J, lv: 1, price: 180, stats: { int: 1, mnd: 1 } },
  holly_staff: { name: "Holly Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 11, delay: 3.6, jobs: ALL_J, lv: 6, price: 950, stats: { int: 2, mnd: 2, mp: 8 } },
  bronze_greataxe: { name: "Bronze Greataxe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 14, delay: 4.0, jobs: ["WAR"], lv: 1, price: 150 },
  bronze_cap: { name: "Bronze Cap", kind: "equip", icon: "⛑️", slot: "head", jobs: ALL_J, lv: 1, price: 50, stats: { def: 2 } },
  bronze_cap_hq: { name: "Bronze Cap +1", kind: "equip", icon: "⛑️", hq: true, slot: "head", jobs: ALL_J, lv: 1, price: 130, stats: { def: 3, hp: 5 } },
  chieftain_cap: { name: "Chieftain's Cap", kind: "equip", icon: "👑", ex: true, rarity: "epic", slot: "head", jobs: ALL_J, lv: 5, price: 2000, stats: { def: 4, hp: 10, str: 2, dex: 2, int: 2, mnd: 2 } },
  leather_vest: { name: "Leather Vest", kind: "equip", icon: "🦺", slot: "body", jobs: ALL_J, lv: 1, price: 120, stats: { def: 4, hp: 6 } },
  kite_shield: { name: "Kite Shield", kind: "equip", icon: "🛡️", slot: "ring", jobs: ["PLD", "WAR"], lv: 3, price: 450, stats: { def: 5, hp: 6 }, shield: true, desc: "Worn on the off hand. Counts as your accessory slot." },
  scarlet_tabard: { name: "Scarlet Tabard", kind: "equip", icon: "👘", slot: "body", jobs: ["RDM"], lv: 5, price: 1050, stats: { def: 6, mp: 10, int: 1, mnd: 1, str: 1 } },
  scale_mail: { name: "Scale Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR", "PLD"], lv: 5, price: 1100, stats: { def: 9, hp: 15 } },
  linen_robe: { name: "Linen Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 1, price: 110, stats: { def: 3, mp: 10 } },
  linen_robe_hq: { name: "Linen Robe +1", kind: "equip", icon: "👘", hq: true, slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 1, price: 260, stats: { def: 4, mp: 15 } },
  cotton_robe: { name: "Cotton Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 5, price: 1000, stats: { def: 6, mp: 18, int: 1, mnd: 1 } },
  leather_gloves: { name: "Leather Gloves", kind: "equip", icon: "🧤", slot: "hands", jobs: ALL_J, lv: 2, price: 90, stats: { def: 2, dex: 1 } },
  leather_trousers: { name: "Leather Trousers", kind: "equip", icon: "👖", slot: "legs", jobs: ALL_J, lv: 2, price: 110, stats: { def: 3 } },
  leather_boots: { name: "Leather Boots", kind: "equip", icon: "🥾", slot: "feet", jobs: ALL_J, lv: 3, price: 100, stats: { def: 2, agi: 1 } },
  captains_ring: { name: "Captain's Ring", kind: "equip", icon: "💍", ex: true, slot: "ring", jobs: ALL_J, lv: 1, price: 0, stats: { hp: 12, mp: 12, acc: 5, att: 5 } },
  raiders_ring: { name: "Raider's Ring", kind: "equip", icon: "💍", rare: true, slot: "ring", jobs: ALL_J, lv: 4, price: 0, stats: { str: 2, acc: 4, att: 4 } },
  duskwing_boots: { name: "Duskwing Boots", kind: "equip", icon: "🥾", rare: true, slot: "feet", jobs: ALL_J, lv: 4, price: 0, stats: { def: 3, agi: 3, eva: 4 } },
  silkworm_gloves: { name: "Silkworm Gloves", kind: "equip", icon: "🧤", rare: true, slot: "hands", jobs: ["WHM", "BLM", "RDM"], lv: 4, price: 0, stats: { def: 2, int: 2, mnd: 2, mp: 10 } },
  scavenger_cap: { name: "Scavenger's Cap", kind: "equip", icon: "⛑️", rarity: "uncommon", slot: "head", jobs: ALL_J, lv: 3, price: 300, stats: { def: 3, agi: 1, hp: 4 } },
  nightwing_gloves: { name: "Nightwing Gloves", kind: "equip", icon: "🧤", rarity: "uncommon", slot: "hands", jobs: ALL_J, lv: 4, price: 340, stats: { def: 2, dex: 2, acc: 2 } },
  burrower_trousers: { name: "Burrower's Trousers", kind: "equip", icon: "👖", rarity: "uncommon", slot: "legs", jobs: ALL_J, lv: 3, price: 320, stats: { def: 4, vit: 2 } },
  hare_charm: { name: "Hare Charm", kind: "equip", icon: "💍", rarity: "uncommon", slot: "ring", jobs: ALL_J, lv: 1, price: 260, stats: { agi: 2, eva: 3 } },
  bonecharm_ring: { name: "Bonecharm Ring", kind: "equip", icon: "💍", rarity: "uncommon", slot: "ring", jobs: ALL_J, lv: 4, price: 420, stats: { int: 2, mnd: 2, mp: 6 } },
  gravedigger_boots: { name: "Gravedigger's Boots", kind: "equip", icon: "🥾", rarity: "uncommon", slot: "feet", jobs: ALL_J, lv: 7, price: 700, stats: { def: 4, vit: 2, hp: 8 } },
  raider_helm: { name: "Raider Helm", kind: "equip", icon: "⛑️", rarity: "rare", slot: "head", jobs: ["WAR", "PLD"], lv: 7, price: 900, stats: { def: 6, str: 2, att: 3 } },
  crypt_key: { name: "Crypt Key", kind: "key", icon: "🗝️", rare: true, ex: true, rarity: "epic", price: 0, desc: "A heavy iron key taken from the Crypt Sentinel. Opens the throne room door of the Sunken Crypt." },
  sentinel_greaves: { name: "Sentinel's Greaves", kind: "equip", icon: "👖", rare: true, rarity: "rare", slot: "legs", jobs: ["WAR", "PLD"], lv: 9, price: 0, stats: { def: 7, vit: 3, hp: 12 } },
  hollow_crown: { name: "Hollow Crown", kind: "equip", icon: "👑", rare: true, ex: true, rarity: "epic", slot: "head", jobs: ALL_J, lv: 10, price: 0, stats: { def: 6, hp: 15, mp: 15, str: 2, dex: 2, int: 3, mnd: 3 } },
  kings_blade: { name: "King's Blade", kind: "equip", icon: "🗡️", rare: true, ex: true, rarity: "epic", slot: "main", wtype: "sword", dmg: 14, delay: 2.5, jobs: ["WAR", "PLD", "RDM"], lv: 10, price: 0, stats: { acc: 5, att: 6, str: 2 } },
  ashen_medallion: { name: "Ashen Medallion", kind: "equip", icon: "🏅", ex: true, rarity: "epic", slot: "ring", jobs: ALL_J, lv: 9, price: 0, stats: { hp: 20, mp: 20, acc: 6, att: 6, def: 4 } },
  crypt_dust: { name: "Crypt Dust", kind: "mat", icon: "⚱️", rarity: "uncommon", price: 140, stack: 12, desc: "Grave dust that glitters faintly. Alchemists pay well for it." },
  wardens_robe: { name: "Warden's Robe", kind: "equip", icon: "👘", rare: true, slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 8, price: 0, stats: { def: 8, mp: 25, int: 3, mnd: 3 } },
  simple_bed: { name: "Simple Bed", kind: "furniture", icon: "🛏️", fp: [2, 3], price: 300, model: "bed", desc: "A sturdy bed with a wool blanket." },
  wooden_table: { name: "Wooden Table", kind: "furniture", icon: "🪑", fp: [2, 2], price: 200, model: "table", desc: "Seats four, if you have four chairs." },
  wooden_chair: { name: "Wooden Chair", kind: "furniture", icon: "🪑", fp: [1, 1], price: 80, model: "chair", desc: "Simple and solid." },
  storage_chest: { name: "Storage Chest", kind: "furniture", icon: "🧰", fp: [1, 1], price: 400, model: "chest", storage: 10, desc: "Adds 10 storage slots while placed." },
  wardrobe: { name: "Wardrobe", kind: "furniture", icon: "🚪", fp: [2, 1], price: 900, model: "wardrobe", storage: 15, desc: "Adds 15 storage slots while placed." },
  bookshelf: { name: "Bookshelf", kind: "furniture", icon: "📚", fp: [2, 1], price: 500, model: "bookshelf", storage: 5, desc: "Adds 5 storage slots while placed." },
  potted_plant: { name: "Potted Plant", kind: "furniture", icon: "🪴", fp: [1, 1], price: 60, model: "plant", desc: "A cheerful fern." },
  floor_lamp: { name: "Floor Lamp", kind: "furniture", icon: "🕯️", fp: [1, 1], price: 150, model: "lamp", desc: "A warm glow for long evenings." },
  round_rug: { name: "Round Rug", kind: "furniture", icon: "⭕", fp: [2, 2], price: 180, model: "rug", desc: "Soft underfoot." },
  hearth: { name: "Stone Hearth", kind: "furniture", icon: "🔥", fp: [2, 1], price: 1200, model: "hearth", desc: "Crackles pleasantly." },
  goblin_totem: { name: "Goblin Totem", kind: "furniture", icon: "🗿", ex: true, rarity: "epic", fp: [1, 1], price: 0, model: "totem", desc: "Trophy from the Goblin Chieftain." }
};

const SHOP = ["potion", "ether", "pickaxe", "hatchet", "sickle", "fire_crystal", "wind_crystal", "earth_crystal", "water_crystal", "copper_ore", "ash_log", "healing_herb", "bronze_sword", "ash_club", "ash_staff", "leather_vest", "linen_robe", "leather_gloves", "leather_trousers", "leather_boots", "maple_wand", "cotton_robe", "scale_mail", "kite_shield", "scarlet_tabard", "iron_sword", "holly_staff"];
const FURNITURE_SHOP = ["wooden_chair", "potted_plant", "floor_lamp", "round_rug", "wooden_table", "simple_bed", "storage_chest", "bookshelf", "wardrobe", "hearth"];

const CRAFTS = {
  smithing: { name: "Smithing", crystal: "fire_crystal", icon: "⚒️" },
  woodworking: { name: "Woodworking", crystal: "wind_crystal", icon: "🪚" },
  clothcraft: { name: "Clothcraft", crystal: "earth_crystal", icon: "🧶" },
  alchemy: { name: "Alchemy", crystal: "water_crystal", icon: "⚗️" }
};

const RECIPES = [
  { id: "r_bronze_ingot", craft: "smithing", lv: 0, mats: { copper_ore: 2 }, out: "bronze_ingot" },
  { id: "r_bronze_cap", craft: "smithing", lv: 2, mats: { bronze_ingot: 1 }, out: "bronze_cap", hq: "bronze_cap_hq" },
  { id: "r_bronze_sword", craft: "smithing", lv: 3, mats: { bronze_ingot: 2, ash_lumber: 1 }, out: "bronze_sword", hq: "bronze_sword_hq" },
  { id: "r_iron_ingot", craft: "smithing", lv: 6, mats: { iron_ore: 2 }, out: "iron_ingot" },
  { id: "r_scale_mail", craft: "smithing", lv: 8, mats: { iron_ingot: 2, bronze_ingot: 1 }, out: "scale_mail" },
  { id: "r_iron_sword", craft: "smithing", lv: 10, mats: { iron_ingot: 2, ash_lumber: 1 }, out: "iron_sword", hq: "iron_sword_hq" },
  { id: "r_ash_lumber", craft: "woodworking", lv: 0, mats: { ash_log: 1 }, out: "ash_lumber" },
  { id: "r_ash_club", craft: "woodworking", lv: 1, mats: { ash_lumber: 1 }, out: "ash_club" },
  { id: "r_ash_staff", craft: "woodworking", lv: 2, mats: { ash_lumber: 2 }, out: "ash_staff", hq: "ash_staff_hq" },
  { id: "r_wooden_chair", craft: "woodworking", lv: 3, mats: { ash_lumber: 2 }, out: "wooden_chair" },
  { id: "r_wooden_table", craft: "woodworking", lv: 5, mats: { ash_lumber: 3 }, out: "wooden_table" },
  { id: "r_storage_chest", craft: "woodworking", lv: 7, mats: { ash_lumber: 3, bronze_ingot: 1 }, out: "storage_chest" },
  { id: "r_holly_staff", craft: "woodworking", lv: 9, mats: { ash_lumber: 2, bone_chip: 2 }, out: "holly_staff" },
  { id: "r_silk_cloth", craft: "clothcraft", lv: 0, mats: { worm_silk: 2 }, out: "silk_cloth" },
  { id: "r_linen_robe", craft: "clothcraft", lv: 2, mats: { silk_cloth: 2 }, out: "linen_robe", hq: "linen_robe_hq" },
  { id: "r_leather_gloves", craft: "clothcraft", lv: 3, mats: { bat_wing: 2, silk_cloth: 1 }, out: "leather_gloves" },
  { id: "r_leather_boots", craft: "clothcraft", lv: 4, mats: { bat_wing: 2, silk_cloth: 1 }, out: "leather_boots" },
  { id: "r_round_rug", craft: "clothcraft", lv: 5, mats: { silk_cloth: 3 }, out: "round_rug" },
  { id: "r_cotton_robe", craft: "clothcraft", lv: 8, mats: { silk_cloth: 4, bone_chip: 1 }, out: "cotton_robe" },
  { id: "r_potion", craft: "alchemy", lv: 0, mats: { healing_herb: 2 }, out: "potion", qty: 2, hq: "potion_hq" },
  { id: "r_potted_plant", craft: "alchemy", lv: 2, mats: { healing_herb: 3 }, out: "potted_plant" },
  { id: "r_ether", craft: "alchemy", lv: 3, mats: { healing_herb: 1, bat_wing: 1 }, out: "ether", hq: "ether_hq" },
  { id: "r_hi_potion", craft: "alchemy", lv: 6, mats: { potion: 2, bone_chip: 1 }, out: "hi_potion" }
];

const MERCS = {
  kael: { name: "Kael", job: "WAR", role: "tank", fee: 120, color: "#ef9a9a", desc: "A steady Warrior. Holds enemy attention with Provoke and closes skillchains." },
  rook: { name: "Rook", job: "WAR", role: "dd", fee: 140, color: "#ffab91", desc: "A reckless Warrior. Hits hard with Berserk and opens skillchains for others to close." },
  mira: { name: "Mira", job: "WHM", role: "healer", fee: 150, color: "#f5f5f5", desc: "A calm White Mage. Cures whoever is hurt most and saves Divine Seal for emergencies." },
  fen: { name: "Fen", job: "WHM", role: "support", fee: 150, color: "#e0f2f1", desc: "A cheerful White Mage. Keeps Dia up, Banishes the undead and backs up the healer." },
  sable: { name: "Sable", job: "BLM", role: "nuker", fee: 180, color: "#b39ddb", desc: "A sharp Black Mage. Nukes weaknesses and holds MP to magic-burst your skillchains." },
  dorn: { name: "Dorn", job: "PLD", role: "tank", fee: 260, color: "#90caf9", requires: { job: "PLD" }, desc: "A stalwart Paladin. Flash and Sentinel hold attention, Cures keep him standing, Shield Bash stops TP moves." },
  lisette: { name: "Lisette", job: "RDM", role: "hybrid", fee: 260, color: "#f48fb1", requires: { job: "RDM" }, desc: "A quick Red Mage. Fights in melee, keeps Dia, Slow and Paralyze on the target, nukes when MP allows and backs up the healer." },
  vesper: { name: "Vesper", job: "BLM", role: "burster", fee: 400, color: "#7e57c2", requires: { quest: "chieftain" }, desc: "A Black Mage who lives for the magic burst. Elemental Seal on every one." }
};

const MERC_LINES = {
  hire: ["Ready when you are.", "Lead the way.", "Let's get to work."],
  ws: ["Opening a skillchain!", "Here it comes!", "Hah!"],
  close: ["Closing it!", "Skillchain!", "Got it!"],
  burst: ["Magic burst!", "Bursting!", "Now!"],
  cure: ["Hang in there!", "Healing you!", "Got you."],
  provoke: ["Over here!", "Eyes on me!"],
  ko: ["Ugh... sorry...", "I'm down!"],
  lowmp: ["Running low on MP.", "I need a moment for MP."],
  victory: ["Nice work.", "That's that.", "Next!"]
};

const FEATURES = { crafting: false, gathering: false, residence: false, nms: true, water: true, mounts: false };

const FAMILIES = {
  goblin: { name: "Goblin", color: "#8a9a5b", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 140 }, link: true, tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.4], ["fire_crystal", 0.3], ["copper_ore", 0.25], ["potion", 0.08]], gil: [3, 6], model: "goblin" },
  bat: { name: "Cave Bat", color: "#6d5a8a", radius: 11, hpMul: 0.7, attMul: 0.9, defMul: 0.8, eva: 10, delay: 2.4, speed: 125, aggro: { sound: 110 }, link: false, tpMove: { name: "Wing Slap", mul: 1.9 }, weak: { ice: 1.25 }, loot: [["bat_wing", 0.4], ["wind_crystal", 0.3], ["ether", 0.05]], model: "bat" },
  worm: { name: "Tunnel Worm", color: "#b8866a", radius: 14, hpMul: 1.2, attMul: 0.85, defMul: 1.1, delay: 3.4, speed: 55, int: 4, aggro: { magic: 130 }, link: false, tpMove: { name: "Sand Spit", mul: 1.5, aoe: 60 }, weak: { wind: 1.25 }, loot: [["worm_silk", 0.35], ["earth_crystal", 0.3], ["healing_herb", 0.25], ["ether", 0.06]], model: "worm" },
  ghoul: { name: "Ghoul", color: "#9fbfa0", radius: 15, hpMul: 1.1, attMul: 1.1, defMul: 1.0, delay: 3.0, speed: 85, aggro: { sound: 120, lowhp: 200 }, link: true, tpMove: { name: "Vampiric Claw", mul: 1.8, drain: true }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.3], ["ether", 0.08], ["hi_potion", 0.05]], model: "ghoul" },
  den_goblin: { name: "Goblin Raider", color: "#6f7f45", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 140 }, link: true, linkGroup: "goblin", tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["fire_crystal", 0.3], ["iron_ore", 0.15], ["ash_log", 0.2], ["hi_potion", 0.05]], gil: [3, 6], model: "goblin" },
  skeleton: { name: "Wandering Bones", color: "#e8e2cf", radius: 15, hpMul: 1.0, attMul: 1.05, defMul: 1.1, delay: 3.0, speed: 80, aggro: { sound: 120, lowhp: 180 }, link: true, tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.25], ["ether", 0.06]], model: "skeleton" },
  hare: { name: "Meadow Hare", color: "#c8a27a", radius: 11, hpMul: 0.6, attMul: 0.8, defMul: 0.8, eva: 6, delay: 2.6, speed: 115, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["healing_herb", 0.35], ["earth_crystal", 0.2], ["potion", 0.06]], model: "hare" },
  crypt_sentinel: { name: "Crypt Sentinel", color: "#80cbc4", radius: 17, hpMul: 3.0, attMul: 1.25, defMul: 1.3, delay: 3.2, speed: 85, aggro: { sight: 170, sound: 150 }, link: true, linkGroup: "undead", tpMove: { name: "Grave Sweep", mul: 1.7, aoe: 80 }, weak: { light: 1.5, fire: 1.2 }, nm: true, scale: 1.5, aura: "#80cbc4", respawn: 600, loot: [["crypt_key", 1], ["bone_chip", 1], ["ether", 0.6], ["sentinel_greaves", 0.3]], gil: [20, 30], model: "skeleton" },
  royal_guard: { name: "Royal Guard", color: "#c0c8d8", radius: 15, hpMul: 1.1, attMul: 1.15, defMul: 1.1, delay: 3.0, speed: 95, aggro: null, link: true, linkGroup: "undead", tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.5], ["water_crystal", 0.3]], model: "skeleton", summoned: true },
  hollow_king: { name: "Hollow King", color: "#ffd54f", radius: 20, hpMul: 3.8, attMul: 1.3, defMul: 1.25, delay: 3.4, speed: 90, aggro: { sight: 200 }, link: false, tpMove: { name: "Sovereign's Wrath", mul: 2.1, aoe: 100 }, weak: { light: 1.4, fire: 1.15 }, nm: true, boss: true, scale: 1.75, aura: "#ffd54f", respawn: 600, loot: [["hollow_crown", 0.3], ["kings_blade", 0.3], ["bone_chip", 1], ["hi_potion", 0.8], ["ether", 0.8]], gil: [60, 80], model: "skeleton", phases: [0.66, 0.33], enrage: 0.2 },
  chieftain: { name: "Goblin Chieftain", color: "#7d8a3a", radius: 20, hpMul: 1.8, attMul: 1.0, defMul: 1.0, delay: 3.2, speed: 100, aggro: { sight: 170 }, link: true, linkGroup: "goblin", tpMove: { name: "Goblin Rush", mul: 0.7, hits: 3 }, weak: { ice: 1.2 }, nm: true, respawn: 180, loot: [["chieftain_cap", 0.3], ["goblin_totem", 0.3], ["raider_helm", 0.25], ["iron_sword", 0.2], ["goblin_pouch", 1], ["ether", 0.5], ["iron_ore", 0.8]], gil: [30, 40], model: "chieftain" }
};

const NM_FAMILIES = {
  grimtooth: { hint: "Goblin Camp, eastern Rocky Hollow · any time", base: "goblin", name: "Grimtooth", hpMul: 2.4, attMul: 1.15, defMul: 1.1, scale: 1.3, aura: "#ff5252", loot: [["raiders_ring", 0.3], ["scavenger_cap", 0.35], ["goblin_pouch", 1], ["fire_crystal", 1], ["hi_potion", 0.3]], gil: [12, 16], respawn: 300 },
  duskwing: { hint: "Old Fort Ruins, Rocky Hollow · night", base: "bat", name: "Duskwing", hpMul: 2.2, attMul: 1.1, eva: 18, scale: 1.6, aura: "#b388ff", loot: [["duskwing_boots", 0.3], ["nightwing_gloves", 0.35], ["bat_wing", 1], ["wind_crystal", 1], ["ether", 0.3]], respawn: 300 },
  king_wiggles: { hint: "Burrow Flats, southern Rocky Hollow · day", base: "worm", name: "King Wiggles", hpMul: 2.6, attMul: 1.05, scale: 1.5, aura: "#ffd54f", loot: [["silkworm_gloves", 0.3], ["burrower_trousers", 0.35], ["hare_charm", 0.3], ["worm_silk", 1], ["earth_crystal", 1], ["ether", 0.3]], respawn: 300 },
  ossuary_warden: { hint: "Bone Pit, Goblin Den · any time", base: "ghoul", name: "Ossuary Warden", hpMul: 2.3, attMul: 1.15, scale: 1.35, aura: "#69f0ae", loot: [["wardens_robe", 0.3], ["gravedigger_boots", 0.35], ["bonecharm_ring", 0.3], ["bone_chip", 1], ["water_crystal", 1], ["hi_potion", 0.4]], respawn: 360 }
};

const RARITY = { common: ["Common", "#e8e8e8"], uncommon: ["Uncommon", "#6fd36f"], rare: ["Rare", "#6aa9ff"], epic: ["Epic", "#c48cff"] };

const DAY_NAMES = ["Emberday", "Stoneday", "Tideday", "Galeday", "Frostday", "Stormday", "Dawnday", "Duskday"];
const DAY_ELEMENTS = ["fire", "earth", "water", "wind", "ice", "lightning", "light", "dark"];

const ZONES = {
  outpost: {
    name: "Ashenreach Outpost", w: 1100, h: 800, safe: true, theme: "town",
    exits: [
      { x: 1076, y: 350, w: 24, h: 100, to: "hollow", tx: 120, ty: 1100, label: "Rocky Hollow" },
      { x: 222, y: 400, w: 26, h: 40, to: "residence", tx: 200, ty: 250, label: "Your Residence", kind: "door" }
    ],
    npcs: [
      { id: "rhea", x: 560, y: 210, home: 4, sleep: [22, 6] }, { id: "tobin", x: 840, y: 250, home: 1, sleep: [20, 7] }, { id: "pell", x: 380, y: 520, home: 0, sleep: [21, 6.5] },
      { id: "brann", x: 780, y: 560, home: 2, sleep: [23, 7.5] }, { id: "crystal_town", x: 560, y: 420 }, { id: "ysolde", x: 890, y: 500, home: 2, sleep: [19.5, 5.5] },
      { id: "odette", x: 330, y: 330, home: 0, sleep: [21.5, 6] }
    ],
    spawns: [],
    water: [{ x: 250, y: 640, r: 75 }],
    plaza: { x: 560, y: 420, r: 150 },
    paths: [
      { w: 56, pts: [[560, 420], [820, 410], [1100, 400], [1500, 400]] },
      { w: 40, pts: [[560, 420], [560, 200]] },
      { w: 36, pts: [[560, 420], [700, 330], [840, 250]] },
      { w: 36, pts: [[560, 420], [470, 480], [380, 520]] },
      { w: 36, pts: [[560, 420], [680, 500], [780, 560]] }
    ],
    houses: [{ x: 230, y: 230, w: 150, h: 110, rot: 0 }, { x: 860, y: 120, w: 140, h: 100, rot: 0 }, { x: 980, y: 640, w: 120, h: 120, rot: 1 }, { x: 160, y: 420, w: 110, h: 130, rot: 1 }, { x: 560, y: 90, w: 180, h: 90, rot: 0 }],
    stalls: [{ x: 380, y: 560, color: "#b5651d" }, { x: 780, y: 600, color: "#7b1fa2" }, { x: 330, y: 365, color: "#2e7d32" }],
    lamps: [[470, 330], [650, 330], [470, 510], [650, 510]],
    stable: { x: 970, y: 500, rot: -Math.PI / 2 },
    start: { x: 610, y: 440 }
  },
  residence: {
    name: "Your Residence", w: 400, h: 320, safe: true, theme: "house", indoor: true,
    exits: [{ x: 176, y: 296, w: 48, h: 24, to: "outpost", tx: 262, ty: 420, label: "Outpost", kind: "door" }],
    npcs: [{ id: "pip", x: 60, y: 60 }],
    spawns: [],
    start: { x: 200, y: 250 },
    grid: { cols: 10, rows: 8, blocked: [[0, 0], [1, 0], [0, 1], [1, 1], [4, 7], [5, 7], [4, 6], [5, 6]] }
  },
  hollow: {
    name: "Rocky Hollow", w: 3200, h: 2200, theme: "field",
    exits: [
      { x: 0, y: 1050, w: 24, h: 100, to: "outpost", tx: 990, ty: 400, label: "Outpost" },
      { x: 3176, y: 1030, w: 24, h: 100, to: "den", tx: 120, ty: 800, label: "Goblin Den" }
    ],
    npcs: [],
    walls: [{ x: 850, y: 1380, w: 170, h: 440 }, { x: 1980, y: 180, w: 400, h: 170 }, { x: 2330, y: 1820, w: 440, h: 150 }],
    ruins: {
      walls: [[2370, 500, 2520, 500, 2.6], [2600, 500, 2730, 500, 1.4], [2730, 500, 2730, 620, 2.2], [2730, 700, 2730, 800, 1.0], [2370, 800, 2450, 800, 1.8], [2580, 800, 2730, 800, 2.4], [2370, 500, 2370, 640, 2.0], [2370, 720, 2370, 800, 1.2]],
      pillars: [[2450, 580, 3.4], [2650, 580, 2.0], [2450, 720, 1.2], [2650, 720, 3.0], [2200, 560, 2.6], [2860, 900, 1.6]]
    },
    landmarks: [
      { id: "meadow", name: "Shepherd's Meadow", x: 480, y: 1300, r: 240, xp: 40 },
      { id: "mirror", name: "Mirror Lake", x: 1250, y: 650, r: 300, xp: 50 },
      { id: "burrow", name: "Burrow Flats", x: 1450, y: 1900, r: 260, xp: 60 },
      { id: "reed", name: "Reed Pond", x: 2000, y: 1500, r: 200, xp: 50 },
      { id: "fort", name: "Old Fort Ruins", x: 2550, y: 650, r: 230, xp: 80 },
      { id: "camp", name: "Goblin Camp", x: 2650, y: 1450, r: 230, xp: 80 },
      { id: "egate", name: "Eastern Gate", x: 3000, y: 1080, r: 170, xp: 40 }
    ],
    spawns: [
      { fam: "hare", lv: [1, 2], x: 350, y: 1300, time: "day" }, { fam: "hare", lv: [1, 2], x: 620, y: 1450, time: "day" }, { fam: "hare", lv: [1, 2], x: 420, y: 800, time: "day" },
      { fam: "worm", lv: [1, 2], x: 700, y: 1250 }, { fam: "worm", lv: [1, 2], x: 300, y: 1700 }, { fam: "worm", lv: [2, 2], x: 600, y: 420 },
      { fam: "goblin", lv: [1, 2], x: 750, y: 800 }, { fam: "goblin", lv: [1, 2], x: 500, y: 1800 }, { fam: "goblin", lv: [1, 1], x: 420, y: 950 },
      { fam: "hare", lv: [1, 1], x: 250, y: 1000, time: "day" }, { fam: "worm", lv: [1, 1], x: 380, y: 1250 }, { fam: "bat", lv: [1, 1], x: 450, y: 1150, time: "night" },
      { fam: "bat", lv: [1, 2], x: 700, y: 650, time: "night" }, { fam: "bat", lv: [1, 2], x: 300, y: 1500, time: "night" },
      { fam: "goblin", lv: [2, 3], x: 1350, y: 1200 }, { fam: "goblin", lv: [2, 3], x: 1400, y: 1250 }, { fam: "goblin", lv: [2, 3], x: 1700, y: 800 },
      { fam: "hare", lv: [2, 3], x: 1100, y: 1150, time: "day" }, { fam: "worm", lv: [2, 3], x: 1000, y: 400 },
      { fam: "bat", lv: [2, 3], x: 1550, y: 500, time: "night" }, { fam: "skeleton", lv: [3, 4], x: 1800, y: 1300, time: "night" },
      { fam: "worm", lv: [3, 4], x: 1250, y: 1850 }, { fam: "worm", lv: [3, 4], x: 1650, y: 1950, nm: { id: "king_wiggles", lv: 5, chance: 0.15, time: "day" } }, { fam: "worm", lv: [3, 3], x: 1500, y: 2050 },
      { fam: "hare", lv: [3, 3], x: 1150, y: 2000, time: "day" },
      { fam: "goblin", lv: [4, 4], x: 2450, y: 900 }, { fam: "goblin", lv: [4, 4], x: 2250, y: 650 },
      { fam: "skeleton", lv: [4, 5], x: 2550, y: 620, time: "night" }, { fam: "skeleton", lv: [4, 5], x: 2800, y: 420, time: "night" }, { fam: "skeleton", lv: [4, 5], x: 2150, y: 450, time: "night" },
      { fam: "bat", lv: [3, 4], x: 2500, y: 700, time: "night", nm: { id: "duskwing", lv: 6, chance: 0.12 } }, { fam: "bat", lv: [3, 4], x: 2600, y: 650, time: "night" },
      { fam: "goblin", lv: [4, 5], x: 2600, y: 1400 }, { fam: "goblin", lv: [4, 5], x: 2650, y: 1480 }, { fam: "goblin", lv: [4, 5], x: 2750, y: 1420 },
      { fam: "goblin", lv: [5, 5], x: 2850, y: 1600, nm: { id: "grimtooth", lv: 6, chance: 0.15 } }, { fam: "goblin", lv: [5, 6], x: 2500, y: 1650 }
    ],
    water: [{ x: 1250, y: 650, r: 170 }, { x: 2000, y: 1500, r: 90 }],
    paths: [
      { w: 46, pts: [[-500, 1100], [0, 1100], [400, 1120], [800, 1010], [1200, 980], [1650, 1050], [2100, 1150], [2500, 1160], [2900, 1150], [3200, 1080], [3700, 1080]] },
      { w: 34, pts: [[2100, 1150], [2300, 950], [2515, 860], [2515, 650]] },
      { w: 34, pts: [[1650, 1050], [1550, 1450], [1420, 1850]] },
      { w: 30, pts: [[2500, 1160], [2650, 1450]] }
    ],
    gather: {
      mining: { n: 3, at: [[300, 300], [1000, 250], [2900, 1900], [200, 2000], [1250, 2100], [2850, 300]], loot: [["copper_ore", 0.6], ["iron_ore", 0.08], ["fire_crystal", 0.1], ["earth_crystal", 0.1]] },
      logging: { n: 3, at: [[140, 600], [560, 1950], [3000, 600], [880, 200], [1900, 650], [2100, 2050]], loot: [["ash_log", 0.75], ["wind_crystal", 0.15]] },
      harvesting: { n: 3, at: [[250, 1450], [900, 650], [1750, 1350], [2350, 1450], [500, 1000], [1300, 1600]], loot: [["healing_herb", 0.7], ["worm_silk", 0.1], ["water_crystal", 0.12]] }
    },
    start: { x: 70, y: 1100 }
  },
  den: {
    name: "Goblin Den", w: 2400, h: 1600, theme: "cave",
    exits: [{ x: 0, y: 750, w: 24, h: 100, to: "hollow", tx: 3080, ty: 1090, label: "Rocky Hollow" }],
    npcs: [],
    walls: [{ x: 0, y: 0, w: 760, h: 520 }, { x: 0, y: 1080, w: 760, h: 520 }, { x: 1000, y: 700, w: 620, h: 200 }, { x: 1620, y: 0, w: 180, h: 520 }, { x: 1620, y: 1080, w: 180, h: 520 }],
    landmarks: [
      { id: "mouth", name: "Den Mouth", x: 380, y: 800, r: 230, xp: 80 },
      { id: "pool", name: "Underground Pool", x: 1250, y: 380, r: 260, xp: 100 },
      { id: "pit", name: "Bone Pit", x: 1250, y: 1250, r: 260, xp: 120 },
      { id: "throne", name: "Chieftain's Throne", x: 2100, y: 800, r: 280, xp: 150 }
    ],
    spawns: [
      { fam: "bat", lv: [5, 6], x: 350, y: 640 }, { fam: "bat", lv: [5, 6], x: 520, y: 980 },
      { fam: "den_goblin", lv: [5, 6], x: 560, y: 760 }, { fam: "den_goblin", lv: [5, 6], x: 600, y: 820 },
      { fam: "den_goblin", lv: [6, 7], x: 880, y: 300 }, { fam: "den_goblin", lv: [6, 7], x: 880, y: 1300 },
      { fam: "bat", lv: [5, 6], x: 1450, y: 250 }, { fam: "worm", lv: [6, 7], x: 1050, y: 200 },
      { fam: "den_goblin", lv: [6, 7], x: 1200, y: 560 }, { fam: "den_goblin", lv: [6, 7], x: 1260, y: 600 },
      { fam: "ghoul", lv: [7, 8], x: 1100, y: 1300 }, { fam: "ghoul", lv: [7, 8], x: 1180, y: 1360 }, { fam: "ghoul", lv: [7, 8], x: 1450, y: 1250 },
      { fam: "skeleton", lv: [7, 8], x: 1350, y: 1450 }, { fam: "ghoul", lv: [8, 9], x: 1250, y: 1050, nm: { id: "ossuary_warden", lv: 10, chance: 0.15 } },
      { fam: "den_goblin", lv: [7, 8], x: 1950, y: 600 }, { fam: "den_goblin", lv: [7, 8], x: 1950, y: 1000 }, { fam: "den_goblin", lv: [8, 8], x: 2050, y: 800 },
      { fam: "chieftain", lv: [11, 11], x: 2220, y: 800 }
    ],
    water: [{ x: 1300, y: 260, r: 100 }],
    paths: [
      { w: 40, pts: [[-500, 800], [0, 800], [400, 800], [880, 800], [950, 480], [1400, 560], [1710, 640], [2150, 800]] },
      { w: 40, pts: [[880, 800], [950, 1120], [1400, 1120], [1710, 960], [2150, 800]] }
    ],
    torches: [[300, 640], [300, 960], [850, 600], [850, 1000], [1050, 560], [1520, 420], [1050, 1250], [1450, 1350], [1900, 560], [1900, 1040], [2280, 660], [2280, 940]],
    gather: {
      mining: { n: 3, at: [[200, 600], [700, 1000], [1100, 150], [1500, 1500], [2300, 500], [2300, 1100]], loot: [["iron_ore", 0.45], ["copper_ore", 0.3], ["fire_crystal", 0.15]] }
    },
    start: { x: 70, y: 800 }
  }
};

ZONES.crypt = {
  name: "Sunken Crypt", w: 2600, h: 1400, theme: "crypt",
  exits: [{ x: 0, y: 650, w: 24, h: 100, to: "den", tx: 1200, ty: 1480, label: "Goblin Den" }],
  npcs: [
    { id: "brazier_fire", x: 700, y: 400 }, { id: "brazier_wind", x: 1100, y: 400 }, { id: "brazier_earth", x: 700, y: 1000 }, { id: "brazier_water", x: 1100, y: 1000 },
    { id: "crypt_tablet", x: 900, y: 345 },
    { id: "chest_sent_a", x: 1340, y: 110 }, { id: "chest_sent_b", x: 1660, y: 110 }, { id: "chest_vault", x: 1500, y: 1290 }, { id: "chest_king", x: 2480, y: 450 },
    { id: "crypt_throne", x: 2500, y: 700 }
  ],
  walls: [
    { x: 0, y: 0, w: 600, h: 450 }, { x: 0, y: 950, w: 600, h: 450 },
    { x: 600, y: 0, w: 700, h: 300 }, { x: 600, y: 1100, w: 700, h: 300 },
    { x: 1200, y: 300, w: 100, h: 260 }, { x: 1200, y: 840, w: 100, h: 260 },
    { x: 1300, y: 0, w: 400, h: 60 }, { x: 1300, y: 300, w: 100, h: 150 }, { x: 1550, y: 300, w: 150, h: 150 },
    { x: 1300, y: 950, w: 100, h: 150 }, { x: 1550, y: 950, w: 150, h: 150 }, { x: 1300, y: 1340, w: 400, h: 60 },
    { x: 1700, y: 0, w: 900, h: 350 }, { x: 1700, y: 1050, w: 900, h: 350 }, { x: 1700, y: 350, w: 40, h: 210 }, { x: 1700, y: 840, w: 40, h: 210 }
  ],
  barriers: [
    { id: "brazier_gate", x: 1200, y: 560, w: 100, h: 280, name: "sealed gate", solved: "braziers", closedMsg: "The gate is sealed. Four braziers stand in this hall; a tablet on the north wall hints at the order." },
    { id: "throne_door", x: 1700, y: 560, w: 40, h: 280, name: "throne door", key: "crypt_key", closedMsg: "The throne door is locked. The Crypt Sentinel to the north holds the key." }
  ],
  pillars: [[650, 500], [650, 900], [1150, 500], [1150, 900], [900, 480], [900, 920], [1350, 500], [1650, 500], [1350, 900], [1650, 900], [1850, 450], [1850, 950], [2150, 450], [2150, 950], [2450, 450], [2450, 950]],
  landmarks: [
    { id: "entrance", name: "Entrance Hall", x: 300, y: 700, r: 220, xp: 100 },
    { id: "brazier", name: "Brazier Hall", x: 900, y: 700, r: 260, xp: 150 },
    { id: "cross", name: "The Crossroads", x: 1475, y: 700, r: 200, xp: 120 },
    { id: "sentinel", name: "Sentinel's Rest", x: 1500, y: 180, r: 200, xp: 150 },
    { id: "vault", name: "The Vault", x: 1500, y: 1220, r: 200, xp: 150 },
    { id: "throne", name: "Throne Room", x: 2200, y: 700, r: 320, xp: 200 }
  ],
  spawns: [
    { fam: "bat", lv: [9, 9], x: 200, y: 520 }, { fam: "bat", lv: [9, 10], x: 450, y: 880 }, { fam: "skeleton", lv: [9, 9], x: 380, y: 620 }, { fam: "skeleton", lv: [9, 10], x: 500, y: 780 },
    { fam: "skeleton", lv: [9, 10], x: 800, y: 600 }, { fam: "skeleton", lv: [9, 10], x: 1000, y: 820 }, { fam: "skeleton", lv: [10, 10], x: 900, y: 700 }, { fam: "ghoul", lv: [10, 10], x: 1000, y: 560 },
    { fam: "ghoul", lv: [10, 10], x: 1380, y: 620 }, { fam: "ghoul", lv: [10, 11], x: 1600, y: 780 }, { fam: "skeleton", lv: [10, 11], x: 1500, y: 520 }, { fam: "skeleton", lv: [10, 11], x: 1420, y: 860 },
    { fam: "skeleton", lv: [10, 11], x: 1400, y: 200 }, { fam: "skeleton", lv: [10, 11], x: 1600, y: 220 }, { fam: "crypt_sentinel", lv: [11, 11], x: 1500, y: 160 },
    { fam: "ghoul", lv: [10, 11], x: 1400, y: 1200 }, { fam: "ghoul", lv: [11, 11], x: 1600, y: 1220 }, { fam: "ghoul", lv: [10, 11], x: 1500, y: 1150 },
    { fam: "skeleton", lv: [11, 11], x: 1950, y: 560 }, { fam: "skeleton", lv: [11, 11], x: 1950, y: 850 }, { fam: "hollow_king", lv: [12, 12], x: 2320, y: 700 }
  ],
  water: [],
  paths: [
    { w: 44, pts: [[-500, 700], [0, 700], [600, 700], [1200, 700], [1700, 700], [2300, 700]] },
    { w: 36, pts: [[1475, 700], [1475, 450], [1475, 180]] },
    { w: 36, pts: [[1475, 700], [1475, 950], [1475, 1220]] }
  ],
  torches: [[150, 480], [150, 920], [640, 330], [1160, 330], [640, 1070], [1160, 1070], [1330, 480], [1670, 480], [1330, 920], [1670, 920], [1330, 90], [1670, 90], [1330, 1310], [1670, 1310], [1780, 380], [1780, 1020], [2560, 380], [2560, 1020], [2300, 400], [2300, 1000]],
  start: { x: 70, y: 700 }
};
ZONES.den.exits.push({ x: 1150, y: 1576, w: 100, h: 24, to: "crypt", tx: 120, ty: 700, label: "Sunken Crypt" });
ZONES.den.paths.push({ w: 34, pts: [[1250, 1120], [1200, 1400], [1200, 1600], [1200, 2100]] });

const BRAZIER_LINES = { fire: "the flame that wakes the dawn", wind: "the breath that carries the ash", earth: "the stone that keeps the dead", water: "the tide that quiets all" };
const CHEST_LOOT = {
  common: [["bone_chip", 0.9], ["crypt_dust", 0.7], ["ether", 0.5], ["hi_potion", 0.5], ["water_crystal", 0.6], ["iron_ore", 0.4]],
  vault: [["crypt_dust", 1], ["hi_potion", 0.8], ["ether", 0.8], ["iron_ingot", 0.5], ["silk_cloth", 0.5], ["bone_chip", 1]],
  king: [["crypt_dust", 1], ["hi_potion", 1], ["ether", 1], ["iron_ingot", 0.8], ["silk_cloth", 0.8]]
};

const NPCS = {
  rhea: { name: "Captain Rhea", model: "rhea", talk: "talkRhea" },
  tobin: { name: "Tobin, Job Master", model: "tobin", talk: "talkTobin" },
  pell: { name: "Pell, Merchant", model: "pell", talk: "talkPell" },
  odette: { name: "Odette, Furnishings", model: "odette", talk: "talkOdette", shop: "furniture" },
  brann: { name: "Brann, Mercenary Hall", model: "brann", talk: "talkBrann" },
  ysolde: { name: "Ysolde, Stablemaster", model: "ysolde", talk: "talkYsolde" },
  crystal_town: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  crystal_hollow: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  pip: { name: "Pip the Nubbin", prop: "nubbin", talk: "talkPip" },
  brazier_fire: { name: "Brazier of Flame", prop: "brazier", element: "fire", talk: "talkBrazier" },
  brazier_wind: { name: "Brazier of Wind", prop: "brazier", element: "wind", talk: "talkBrazier" },
  brazier_earth: { name: "Brazier of Earth", prop: "brazier", element: "earth", talk: "talkBrazier" },
  brazier_water: { name: "Brazier of Tides", prop: "brazier", element: "water", talk: "talkBrazier" },
  crypt_tablet: { name: "Worn Inscription", prop: "tablet", talk: "talkTablet" },
  chest_sent_a: { name: "Treasure Chest", prop: "chest", chest: "common", talk: "talkChest" },
  chest_sent_b: { name: "Treasure Chest", prop: "chest", chest: "common", talk: "talkChest" },
  chest_vault: { name: "Vault Chest", prop: "chest", chest: "vault", talk: "talkChest" },
  chest_king: { name: "Royal Coffer", prop: "chest", chest: "king", needsKill: "hollow_king", talk: "talkChest" },
  crypt_throne: { name: "Hollow Throne", prop: "throne", talk: "talkThrone" }
};

const QUESTS = {
  pouches: { name: "Pouches for the Captain", giver: "Captain Rhea", npc: "rhea", lv: 1, desc: "Bring Captain Rhea 3 Goblin Pouches. Goblins in Rocky Hollow carry them.", reward: { xp: 300, gil: 300, item: "captains_ring" } },
  home: { name: "Make It Home", giver: "Odette", npc: "odette", lv: 1, check: "furniture", desc: "Buy or craft two pieces of furniture and have Pip place them in your residence (the door is on the west house of the Outpost).", reward: { xp: 100, gil: 0, item: "potted_plant" },
    intro: "Every adventurer needs somewhere to hang their helm. The cottage by the west wall is yours; my cousin Pip keeps it. Put two pieces of furniture in it and I'll throw in something green for the windowsill.", progress: "Two pieces placed, that's all. Chairs are cheap. Talk to Pip at the cottage to arrange them.", turn: "Two pieces placed! It's a home now. Here, a potted fern for the sill." },
  herbs: { name: "Herbs for the Stall", giver: "Pell", npc: "pell", lv: 1, items: { healing_herb: 3 }, desc: "Bring Pell 3 Healing Herbs for his stall. Meadow Hares and Tunnel Worms in Rocky Hollow carry them.", reward: { xp: 120, gil: 100, items: [["pickaxe", 1], ["hatchet", 1]] },
    intro: "My herb jars are empty and the hares won't deliver. Bring me 3 Healing Herbs and I'll pay in coin and tools. Hares and worms past the east gate carry them.", progress: "Still short on herbs. Hares graze by day; worms are about day and night.", turn: "Fresh herbs! Here's your coin, and a pickaxe and hatchet besides. Hang on to them; the hills are full of ore and timber." },
  nightwings: { name: "Night Wings", giver: "Brann", npc: "brann", lv: 2, kill: { fam: "bat", n: 4, name: "Cave Bat" }, desc: "Defeat 4 Cave Bats for Brann. Bats only come out in Rocky Hollow at night.", reward: { xp: 200, gil: 150 },
    intro: "My recruits keep coming back with bat bites. Cull 4 Cave Bats in the Hollow and I'll pay a bounty. They only fly at night, so bring a light heart.", progress: "Bats still flapping about out there. Night's the time.", turn: "Four bats down. That's a bounty well earned." },
  bones: { name: "Bones in the Ruins", giver: "Captain Rhea", npc: "rhea", lv: 4, pre: "pouches", kill: { fam: "skeleton", n: 5, name: "Wandering Bones" }, desc: "Defeat 5 Wandering Bones. They walk the Old Fort Ruins in eastern Rocky Hollow at night.", reward: { xp: 350, gil: 300, item: "potion", qty: 3 },
    intro: "Something's stirring the dead at the Old Fort Ruins, east along the road. Wandering Bones by night. Put 5 of them back in the ground and report to me.", progress: "The bones still walk. The ruins, at night.", turn: "Five of them laid to rest. You're becoming someone this Outpost can count on." },
  grimtooth: { name: "Grimtooth's Bounty", giver: "Captain Rhea", npc: "rhea", lv: 6, pre: "bones", kill: { fam: "grimtooth", n: 1, name: "Grimtooth" }, desc: "Defeat Grimtooth, the notorious goblin who leads the camp in eastern Rocky Hollow. He appears now and then among the goblins there.", reward: { xp: 500, gil: 400, item: "hi_potion", qty: 2 },
    intro: "There's a goblin called Grimtooth running the camp in the east of the Hollow. Red bandana, black eyes, mean as winter. He shows himself now and then among his gang. Bring him down and the bounty's yours.", progress: "Grimtooth still has his head. Watch the goblin camp; he turns up when a goblin there is replaced.", turn: "Grimtooth, finished. The camp will scatter without him. Take the bounty." },
  hollowking: { name: "The Hollow King", giver: "Captain Rhea", npc: "rhea", lv: 9, pre: "warden", kill: { fam: "hollow_king", n: 1, name: "The Hollow King" }, desc: "Defeat the Hollow King on his throne at the end of the Sunken Crypt, below the Goblin Den's Bone Pit. Light the braziers to pass the gate; the Crypt Sentinel holds the throne door's key.", reward: { xp: 2000, gil: 3000, item: "ashen_medallion" },
    intro: "Under the Den's Bone Pit lies the Sunken Crypt, and on its throne sits the thing that stirs the dead: the Hollow King. The old way in is sealed by braziers, and a Sentinel holds the throne key. Bring a full party. End him, and the Outpost will give you its highest honour.", progress: "The King still sits his throne. Braziers first, then the Sentinel's key, then the throne room.", turn: "The Hollow King is dust. Wear this medallion with pride: no one in Ashenreach has earned it before." },
  warden: { name: "The Warden's Vigil", giver: "Captain Rhea", npc: "rhea", lv: 8, pre: "chieftain", kill: { fam: "ossuary_warden", n: 1, name: "Ossuary Warden" }, desc: "Defeat the Ossuary Warden, a notorious ghoul that haunts the Bone Pit of the Goblin Den.", reward: { xp: 800, gil: 800, item: "ether", qty: 3 },
    intro: "With the Chieftain gone, the Den's worst is a ghoul the scouts call the Ossuary Warden. It keeps the Bone Pit. End its vigil and I'll pay well.", progress: "The Warden still haunts the Bone Pit. It appears among the ghouls there.", turn: "The Warden is finished. The dead can rest, and so can you. Here." },
  support: { name: "A Second Calling", giver: "Tobin", npc: "tobin", lv: 5, desc: "Reach level 5, then bring Tobin 2 Bat Wings and 1 Worm Silk. Bats only come out at night.", reward: { xp: 300, gil: 0 } },
  riding: { name: "Riding License", giver: "Ysolde", npc: "ysolde", lv: 5, desc: "Reach level 5, then bring Ysolde 300 crystals and 3 Healing Herbs. Hares and worms in Rocky Hollow drop herbs.", reward: { xp: 200, gil: 0 } },
  pld: { name: "The Oath of Steel", giver: "Tobin", npc: "tobin", lv: 6, desc: "Reach level 6, then bring Tobin 2 Bone Chips and 1 Iron Ore to take the Paladin's oath. Undead drop bone; goblin raiders in the Den carry iron.", reward: { xp: 400, gil: 0, unlock: "PLD" } },
  rdm: { name: "Scarlet Lessons", giver: "Tobin", npc: "tobin", lv: 6, desc: "Reach level 6, then bring Tobin 2 Worm Silk, 1 Fire Crystal and 1 Water Crystal to study the Red Mage's arts.", reward: { xp: 400, gil: 0, unlock: "RDM" } },
  chieftain: { name: "The Goblin Chieftain", giver: "Captain Rhea", npc: "rhea", lv: 7, pre: "bones", desc: "Defeat the Goblin Chieftain at the back of the Goblin Den, then report to Captain Rhea.", reward: { xp: 900, gil: 1500, item: "ether", qty: 3 } }
};

const FURNITURE_MODELS = { bed: { w: 2, h: 3 }, table: { w: 2, h: 2 }, chair: { w: 1, h: 1 }, chest: { w: 1, h: 1 }, wardrobe: { w: 2, h: 1 }, bookshelf: { w: 2, h: 1 }, plant: { w: 1, h: 1 }, lamp: { w: 1, h: 1 }, rug: { w: 2, h: 2, flat: true }, hearth: { w: 2, h: 1 }, totem: { w: 1, h: 1 } };

function spreadSpawns(zone, minD) {
  const sp = zone.spawns;
  for (let iter = 0; iter < 60; iter++) {
    let moved = false;
    for (let i = 0; i < sp.length; i++) for (let j = i + 1; j < sp.length; j++) {
      const a = sp[i], b = sp[j];
      if (FAMILIES[a.fam] && FAMILIES[a.fam].nm) continue;
      if (FAMILIES[b.fam] && FAMILIES[b.fam].nm) continue;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= minD) continue;
      if (d < 1) { dx = 1; dy = 0; d = 1; }
      const push = (minD - d) / 2 + 1;
      a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push;
      moved = true;
    }
    for (const s of sp) {
      s.x = Math.max(80, Math.min(zone.w - 80, Math.round(s.x))); s.y = Math.max(80, Math.min(zone.h - 80, Math.round(s.y)));
      const blocks = (zone.walls || []).map(r => [r.x - 40, r.y - 40, r.w + 80, r.h + 80]);
      if (zone.ruins) { for (const [x1, y1, x2, y2] of zone.ruins.walls) blocks.push([Math.min(x1, x2) - 50, Math.min(y1, y2) - 50, Math.abs(x2 - x1) + 100, Math.abs(y2 - y1) + 100]); for (const [x, y] of zone.ruins.pillars) blocks.push([x - 50, y - 50, 100, 100]); }
      for (const w of zone.water || []) blocks.push([w.x - w.r - 40, w.y - w.r - 40, (w.r + 40) * 2, (w.r + 40) * 2]);
      for (const [bx, by, bw, bh] of blocks) {
        if (s.x <= bx || s.x >= bx + bw || s.y <= by || s.y >= by + bh) continue;
        const pl = s.x - bx, pr = bx + bw - s.x, pt = s.y - by, pb = by + bh - s.y, m = Math.min(pl, pr, pt, pb);
        if (m === pl) s.x = bx - 1; else if (m === pr) s.x = bx + bw + 1; else if (m === pt) s.y = by - 1; else s.y = by + bh + 1;
        moved = true;
      }
    }
    if (!moved) break;
  }
}
for (const id in ZONES) if (ZONES[id].spawns.length) spreadSpawns(ZONES[id], id === "hollow" ? 170 : 120);

const PASSIVE_SPAWNS = { hollow: [[1, 2], [1, 1]], den: [] };
for (const sp of ZONES.hollow.spawns) if (sp.fam === "worm" || (sp.fam === "goblin" && sp.lv[1] <= 2)) sp.passive = true;
