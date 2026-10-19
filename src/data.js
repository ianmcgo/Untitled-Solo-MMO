const CONFIG = {
  terrainDetailLow: true,
  hallField: 380,
  hallTown: 180,
  spawnGapCells: 1.4,
  spawnExitCells: 1.2,
  mobRegen: 0.04,
  mercDaily: 5,
  mercPermadeath: true,
  scrollDrop: 0.05,
  gearDropHum: 0.08,
  levelCap: 20,
  bowRange: 230,
  allyKiteHp: 0.5,
  allyKiteExit: 0.7,
  allyRestHp: 0.25,
  allyKiteDist: 200,
  allyRestDist: 300,
  allySitHp: 0.75,
  allyMpReserve: 0.04,
  foodMinutes: 30, warpCost: 50, roadBonus: 1.15,
  poolTime: 45, partyMax: 6, partyRange: 900, partyShare: [1, 1, 0.6, 0.45, 0.37, 0.32, 0.28], tradeRange: 250, tradeSlots: 8,
  meleeRange: 42,
  tpMax: 3000,
  tpPerDelay: 40,
  combatPace: 1.15,
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
  mobPhysInterrupt: 0.75,
  readyInterrupt: 0.35,
  wsWind: 0.8,
  wsLoseTpAt: 0.75,
  castRange: 230,
  abilityRange: 230,
  talkRange: 70,
  xpTable: [0, 200, 400, 650, 950, 1300, 1700, 2200, 2850, 3600, 4450, 5400, 6450, 7600, 8850, 10200, 11650, 13200, 14850, 16600],
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
  koMinutes: 60,
  weakenedSecs: 180,
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
  supportUnlockLevel: 10,
  mountLevel: 20,
  synthTime: 3,
  craftCap: 20,
  tile: 40,
  saveKey: "ashenreach_save_v2",
  ruleVer: 18,
  hpLvBonus: 3,
  ammoDmgMul: 0.5,
  mpMul: 1.35,
  mobGil: [3, 5],
  shopMul: 10,
  mobCurve: { lv: [1, 5, 10, 15, 20], hp: [1, 0.85, 0.8, 0.78, 0.74], att: [1, 0.9, 0.9, 0.87, 0.85], dmg: [1, 0.9, 0.9, 0.87, 0.85] },
  settingsKey: "ashenreach_settings_v1",
  startGil: 100,
  mountSpeed: 2.2,
  runSpeed: 100,
  sprintMul: 1.45,
  arriveGap: 95,
  exitWalkTime: 1.05,
  walkInTime: 0.9,
  walkInEdge: 600,
  mobSpeedMul: 0.72,
  npcSpeed: 45
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
const SLOTS = ["main", "sub", "ranged", "ammo", "head", "neck", "ear1", "ear2", "body", "hands", "ring1", "ring2", "back", "waist", "legs", "feet"];
const SLOT_NAMES = { main: "Main", sub: "Sub", ranged: "Range", ammo: "Ammo", head: "Head", neck: "Neck", ear1: "Ear", ear2: "Ear", body: "Body", hands: "Hands", ring1: "Ring", ring2: "Ring", back: "Back", waist: "Waist", legs: "Legs", feet: "Feet", ring: "Ring", ear: "Ear" };
const SLOT_PAIRS = { ring: ["ring1", "ring2"], ear: ["ear1", "ear2"] };
function slotKeys(type) { return SLOT_PAIRS[type] || [type]; }
function slotFor(id, gear, want) { const ks = slotKeys(ITEMS[id].slot); if (want && ks.includes(want)) return want; return ks.find(k => !gear[k]) || ks[0]; }
const RES_ELEMENTS = ["fire", "ice", "wind", "earth", "lightning", "water", "light", "dark"];
const ALL_JOBS = ["WAR", "WHM", "BLM", "PLD", "RDM", "THF", "MNK", "RNG", "SMN", "DRK", "BRD"];
const BASE_JOBS = ["WAR", "WHM", "BLM"];
const START_JOBS = ["WAR", "THF", "WHM", "BLM"];
const BARBER_FEE = 1000;
const BARBER_NAMES = { outpost: "Corrin", harbor: "Maelle", ironvale: "Sunniva" };
const JOB_REQ = {
  MNK: { WAR: 5 }, RDM: { WHM: 5, BLM: 5 }, RNG: { THF: 5, MNK: 5 }, SCH: { WHM: 10 }, COR: { SCH: 5, THF: 5 },
  DRK: { WAR: 5, BLM: 5 }, GEO: { MNK: 5 }, BST: { GEO: 5 }, NIN: { THF: 5, WAR: 5 }, PLD: { WAR: 5, WHM: 5 }, DNC: { THF: 5, BLM: 5 },
  BRD: { WHM: 5, THF: 5 }, DRG: { THF: 5, NIN: 5 }, SAM: { WAR: 10 }, SMN: { BLM: 10, WHM: 10, RDM: 10 }, BLU: { BLM: 10, WHM: 10 },
  RUN: { WAR: 10, BLM: 10 }, PUP: { RDM: 10, BLM: 10 }
};
const JOB_FLAVOUR = {
  THF: "Quick hands and quicker feet. You picked up a fighter's footwork and put it to better use.",
  MNK: "A warrior's discipline, turned inward. Your fists are enough.",
  RDM: "Healing and harm, side by side. Two schools of magic taught you to blend them.",
  RNG: "Patience from the shadows and a steady eye for a target.",
  SCH: "Long study in a healer's books has opened a scholar's path.",
  COR: "A scholar's odds and a thief's nerve. Fortune favours the bold.",
  DRK: "Steel and dark spells. A heavier power, and a heavier price.",
  GEO: "The monk's stillness lets you hear the land itself.",
  BST: "Those who read the land can read its creatures too.",
  NIN: "Shadow and steel, moving without a sound.",
  PLD: "Sword and shield, and a healer's mercy. A guardian is born.",
  DNC: "Grace as a weapon, with a little magic in the steps.",
  BRD: "A healer's calm and a thief's cheek make a fine singer.",
  DRG: "The ninja's leap, carried higher on the wing of a spear.",
  SAM: "A warrior's mastery, cut down to a single perfect stroke.",
  SMN: "Three schools of magic, and now something answers when you call.",
  BLU: "Fire and healing taught you how monsters do what they do.",
  RUN: "A warrior's steel, and the old runes of the dark mages.",
  PUP: "Scarlet craft and black art, and a puppet that fights for you."
};
const ADVANCED_JOBS = { PLD: { quest: "pld", lv: 6 }, RDM: { quest: "rdm", lv: 6 }, THF: { quest: "thf", lv: 6 }, MNK: { quest: "mnk", lv: 6 }, RNG: { quest: "rng", lv: 6 }, SMN: { quest: "smn", lv: 6 }, DRK: { quest: "drk", lv: 10 }, BRD: { quest: "brd", lv: 10 } };

const JOBS = {
  WAR: { name: "Warrior", color: "#e57373", icon: "⚔️", hp: [70, 14], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [9, 0.8], agi: [7, 0.7], int: [6, 0.5], mnd: [6, 0.5] },
  WHM: { name: "White Mage", color: "#eeeeee", icon: "✚", hp: [52, 10], mp: [22, 7], str: [7, 0.6], dex: [7, 0.6], vit: [7, 0.7], agi: [7, 0.6], int: [7, 0.7], mnd: [10, 1.0] },
  BLM: { name: "Black Mage", color: "#9575cd", icon: "✦", hp: [46, 9], mp: [26, 8], str: [6, 0.5], dex: [7, 0.6], vit: [6, 0.5], agi: [7, 0.7], int: [10, 1.0], mnd: [7, 0.6] },
  PLD: { name: "Paladin", color: "#90caf9", icon: "🛡️", hp: [68, 13], mp: [12, 4], str: [8, 0.8], dex: [7, 0.7], vit: [10, 1.0], agi: [6, 0.6], int: [5, 0.4], mnd: [8, 0.8], advanced: true },
  RDM: { name: "Red Mage", color: "#f48fb1", icon: "🎩", hp: [56, 11], mp: [20, 6], str: [7, 0.7], dex: [8, 0.8], vit: [7, 0.6], agi: [7, 0.7], int: [8, 0.8], mnd: [8, 0.8], advanced: true },
  THF: { name: "Thief", color: "#a1887f", icon: "🗝️", hp: [58, 11], mp: [0, 0], str: [7, 0.7], dex: [10, 1.0], vit: [7, 0.6], agi: [10, 1.0], int: [6, 0.6], mnd: [6, 0.5] },
  MNK: { name: "Monk", color: "#ffb74d", icon: "👊", hp: [76, 15], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [10, 1.0], agi: [7, 0.7], int: [5, 0.4], mnd: [6, 0.6], advanced: true },
  RNG: { name: "Ranger", color: "#9ccc65", icon: "🏹", hp: [56, 11], mp: [0, 0], str: [7, 0.7], dex: [9, 0.9], vit: [7, 0.6], agi: [10, 1.0], int: [6, 0.5], mnd: [6, 0.5], advanced: true },
  DRK: { name: "Dark Knight", color: "#8e6bbf", icon: "🌑", hp: [64, 13], mp: [10, 3], str: [10, 1.0], dex: [8, 0.8], vit: [8, 0.7], agi: [7, 0.6], int: [8, 0.7], mnd: [5, 0.4], advanced: true },
  BRD: { name: "Bard", color: "#ffd54f", icon: "🎵", hp: [54, 10], mp: [16, 5], str: [7, 0.6], dex: [8, 0.7], vit: [7, 0.6], agi: [7, 0.7], int: [7, 0.6], mnd: [8, 0.8], advanced: true },
  SMN: { name: "Summoner", color: "#4dd0e1", icon: "🔮", hp: [44, 8], mp: [30, 9], str: [5, 0.4], dex: [6, 0.5], vit: [6, 0.5], agi: [6, 0.6], int: [9, 0.9], mnd: [10, 1.0], advanced: true }
};

const WEAPON_SKILLS = {
  slice: { name: "Slice", wtype: "scythe", skill: 5, props: ["Scission"], ftp: [1.6, 2.1, 2.7] },
  nightreap: { name: "Nightreap", wtype: "scythe", skill: 22, props: ["Induration", "Reverberation"], ftp: [1.9, 2.6, 3.3] },
  spiral_reap: { name: "Spiral Reap", wtype: "scythe", skill: 40, props: ["Gravitation", "Scission"], ftp: [2.3, 3.1, 3.9] },
  grim_harvest: { name: "Grim Harvest", wtype: "scythe", skill: 75, props: ["Gravitation", "Distortion"], ftp: [2.7, 3.5, 4.5] },
  fast_blade: { name: "Fast Blade", wtype: "sword", skill: 5, props: ["Scission", "Detonation"], ftp: [1.5, 2.0, 2.5] },
  burning_blade: { name: "Burning Blade", wtype: "sword", skill: 22, props: ["Liquefaction"], ftp: [1.8, 2.6, 3.4] },
  red_lotus_blade: { name: "Red Lotus Blade", wtype: "sword", skill: 40, props: ["Liquefaction", "Detonation"], ftp: [2.2, 3.0, 3.8] },
  shining_strike: { name: "Shining Strike", wtype: "club", skill: 5, props: ["Impaction"], ftp: [1.6, 2.2, 2.8] },
  seraph_strike: { name: "Seraph Strike", wtype: "club", skill: 27, props: ["Impaction"], ftp: [2.0, 2.8, 3.6] },
  brainshaker: { name: "Brainshaker", wtype: "club", skill: 40, props: ["Reverberation"], ftp: [1.8, 2.4, 3.0] },
  heavy_swing: { name: "Heavy Swing", wtype: "staff", skill: 5, props: ["Impaction"], ftp: [1.5, 2.0, 2.5] },
  rock_crusher: { name: "Rock Crusher", wtype: "staff", skill: 22, props: ["Impaction"], ftp: [1.8, 2.5, 3.2] },
  earth_crusher: { name: "Earth Crusher", wtype: "staff", skill: 40, props: ["Detonation", "Impaction"], ftp: [2.1, 2.9, 3.7] },
  quick_sting: { name: "Quick Sting", wtype: "dagger", skill: 5, props: ["Scission"], ftp: [1.4, 1.9, 2.4] },
  venom_bite: { name: "Venom Bite", wtype: "dagger", skill: 22, props: ["Scission", "Impaction"], ftp: [1.8, 2.5, 3.2] },
  gale_edge: { name: "Gale Edge", wtype: "dagger", skill: 40, props: ["Detonation"], ftp: [2.1, 2.9, 3.7] },
  piercing_arrow: { name: "Piercing Arrow", wtype: "archery", skill: 5, props: ["Transfixion"], ftp: [1.6, 2.2, 2.8], ranged: true },
  flaming_volley: { name: "Flaming Volley", wtype: "archery", skill: 22, props: ["Liquefaction", "Transfixion"], ftp: [1.9, 2.6, 3.4], ranged: true },
  gale_arrow: { name: "Gale Arrow", wtype: "archery", skill: 40, props: ["Detonation", "Transfixion"], ftp: [2.3, 3.1, 4.0], ranged: true },
  twin_fist: { name: "Twin Fist", wtype: "h2h", skill: 5, props: ["Impaction"], ftp: [1.5, 2.0, 2.6] },
  rising_knee: { name: "Rising Knee", wtype: "h2h", skill: 22, props: ["Detonation", "Impaction"], ftp: [1.9, 2.6, 3.3] },
  iron_palm: { name: "Iron Palm", wtype: "h2h", skill: 40, props: ["Reverberation", "Impaction"], ftp: [2.2, 3.0, 3.8] },
  vorpal_arc: { name: "Vorpal Arc", wtype: "sword", skill: 75, props: ["Fragmentation", "Scission"], ftp: [2.6, 3.4, 4.4] },
  shadow_fang: { name: "Shadow Fang", wtype: "dagger", skill: 75, props: ["Gravitation", "Transfixion"], ftp: [2.5, 3.3, 4.2] },
  moonfall: { name: "Moonfall", wtype: "club", skill: 75, props: ["Fusion", "Impaction"], ftp: [2.4, 3.2, 4.0] },
  earthshaker: { name: "Earthshaker", wtype: "staff", skill: 75, props: ["Gravitation", "Reverberation"], ftp: [2.5, 3.3, 4.2] },
  ruinous_cleave: { name: "Ruinous Cleave", wtype: "greataxe", skill: 75, props: ["Distortion", "Scission"], ftp: [2.7, 3.6, 4.6] },
  thousand_palms: { name: "Thousand Palms", wtype: "h2h", skill: 75, props: ["Fusion", "Detonation"], ftp: [2.5, 3.3, 4.3] },
  starfall_arrow: { name: "Starfall Arrow", wtype: "archery", skill: 75, props: ["Fragmentation", "Transfixion"], ftp: [2.6, 3.5, 4.5], ranged: true },
  shield_break: { name: "Shield Break", wtype: "greataxe", skill: 5, props: ["Impaction"], ftp: [1.6, 2.2, 2.8] },
  iron_tempest: { name: "Iron Tempest", wtype: "greataxe", skill: 22, props: ["Scission"], ftp: [1.9, 2.7, 3.5] },
  sturmwind: { name: "Sturmwind", wtype: "greataxe", skill: 40, props: ["Reverberation", "Scission"], ftp: [2.2, 3.0, 3.8] }
};

const ABILITIES = {
  provoke: { name: "Provoke", job: "WAR", lv: 1, recast: 30, target: "enemy", enmity: 600, desc: "Draws the target's attention to you." },
  last_resort: { name: "Last Resort", job: "DRK", lv: 1, recast: 120, target: "self", buff: "last_resort", dur: 30, desc: "Attack +25%, Defense −15% for 30 s." },
  soulfire: { name: "Soulfire", job: "DRK", lv: 10, recast: 300, target: "self", buff: "soulfire", dur: 30, desc: "For 30 s, each hit burns some of your own HP to deal extra damage." },
  blood_blade: { name: "Blood Blade", job: "DRK", lv: 15, recast: 600, target: "self", buff: "blood_blade", dur: 30, desc: "For 30 s, your hits drain HP from the target." },
  encore: { name: "Encore", job: "BRD", lv: 15, recast: 300, target: "self", buff: "encore", dur: 60, desc: "Your songs take a third of the time to sing for 60 s." },
  berserk: { name: "Berserk", job: "WAR", lv: 3, recast: 60, target: "self", buff: "berserk", dur: 30, desc: "Attack +25%, Defense −25% for 30 s." },
  divine_seal: { name: "Divine Seal", job: "WHM", lv: 3, recast: 60, target: "self", buff: "divine_seal", dur: 60, desc: "Your next Cure heals twice as much." },
  elemental_seal: { name: "Elemental Seal", job: "BLM", lv: 3, recast: 60, target: "self", buff: "elemental_seal", dur: 60, desc: "Your next nuke deals 50% more damage." },
  sentinel: { name: "Sentinel", job: "PLD", lv: 3, recast: 90, target: "self", buff: "sentinel", dur: 30, desc: "Defense +50% and every action draws double enmity for 30 s." },
  shield_bash: { name: "Shield Bash", job: "PLD", lv: 6, recast: 60, target: "enemy", enmity: 350, desc: "Bashes the target for light damage and interrupts its casting or TP move." },
  steal: { name: "Steal", job: "THF", lv: 1, recast: 90, target: "enemy", enmity: 60, desc: "Try to steal an item the monster is carrying. One theft per monster." },
  sneak_attack: { name: "Sneak Attack", job: "THF", lv: 5, recast: 60, target: "self", buff: "sneak_attack", dur: 30, desc: "Your next hit lands as a critical hit with extra damage from DEX." },
  flee: { name: "Flee", job: "THF", lv: 10, recast: 240, target: "self", buff: "flee", dur: 20, desc: "Run 80% faster for 20 s." },
  sharpshot: { name: "Sharpshot", job: "RNG", lv: 1, recast: 90, target: "self", buff: "sharpshot", dur: 30, desc: "Ranged accuracy +40 for 30 s." },
  barrage: { name: "Barrage", job: "RNG", lv: 5, recast: 120, target: "self", buff: "barrage", dur: 30, desc: "Your next shot looses three arrows." },
  shadowbind: { name: "Shadowbind", job: "RNG", lv: 10, recast: 180, target: "enemy", enmity: 120, desc: "Pins the target's shadow: it can't move for 12 s." },
  release: { name: "Release", job: "SMN", lv: 1, recast: 5, target: "self", desc: "Sends your sprite home." },
  blood_pact: { name: "Blood Pact", job: "SMN", lv: 1, recast: 45, target: "enemy", enmity: 150, desc: "Your sprite unleashes its element on the target. Needs a sprite out." },
  siphon: { name: "Elemental Siphon", job: "SMN", lv: 10, recast: 240, target: "self", desc: "Draws MP from your sprite (it must be out)." },
  warcry: { name: "Warcry", job: "WAR", lv: 15, recast: 180, target: "self", buff: "warcry", dur: 30, desc: "Raises the whole party's attack by 20% for 30 s." },
  boost: { name: "Boost", job: "MNK", lv: 1, recast: 15, target: "self", buff: "boost", dur: 60, desc: "Your next hit deals 50% more damage and builds extra TP." },
  focus: { name: "Focus", job: "MNK", lv: 5, recast: 120, target: "self", buff: "focus", dur: 30, desc: "Accuracy +25 and critical hit rate +10% for 30 s." },
  chakra: { name: "Chakra", job: "MNK", lv: 10, recast: 300, target: "self", desc: "Restores HP based on your VIT and level." },
  convert: { name: "Convert", job: "RDM", lv: 8, recast: 120, target: "self", desc: "Swaps your current HP and MP." }
};

const BUFF_NAMES = { weakened: "Weakened", boon: "Shrine's Favour", blessing: "City Blessing", last_resort: "Last Resort", soulfire: "Soulfire", blood_blade: "Blood Blade", encore: "Encore", minuet: "Minuet", paeon: "Paeon", ballad: "Ballad", madrigal: "Madrigal", march: "March", blight: "Blight", sleep: "Asleep", stun: "Stunned", warcry: "Warcry", sharpshot: "Sharpshot", barrage: "Barrage", bind: "Bound", food: "Well Fed", sneak_attack: "Sneak Attack", flee: "Flee", boost: "Boost", focus: "Focus", berserk: "Berserk", divine_seal: "Divine Seal", elemental_seal: "Elemental Seal", dia: "Dia", sentinel: "Sentinel", flash: "Flash", slow: "Slow", paralyze: "Paralyze", protect: "Protect" };
const BUFF_ICONS = { weakened: "🥀", boon: "🕯️", blessing: "🏰", last_resort: "🩸", soulfire: "🔥", blood_blade: "🗡️", encore: "🎶", minuet: "🎵", paeon: "💚", ballad: "💧", madrigal: "🎯", march: "🥁", blight: "☠️", sleep: "💤", stun: "💫", warcry: "📣", sharpshot: "🎯", barrage: "🏹", bind: "⛓️", food: "🍲", sneak_attack: "🗡️", flee: "💨", boost: "👊", focus: "🎯", berserk: "💢", divine_seal: "✚", elemental_seal: "✦", dia: "☀", sentinel: "🛡️", flash: "✨", slow: "🐌", paralyze: "⚡", protect: "🔰" };
Object.assign(BUFF_NAMES, { enthunder: "Enthunder", enstone: "Enstone", enaero: "Enaero", blaze_spikes: "Blaze Spikes", ice_spikes: "Ice Spikes", shock: "Shock", rasp: "Rasp", choke: "Choke", requiem: "Foe Requiem", mambo: "Sheepfoe Mambo", pastoral: "Herb Pastoral", operetta: "Scop's Operetta", threnody_light: "Light Threnody", threnody_dark: "Dark Threnody", threnody_earth: "Earth Threnody", threnody_water: "Water Threnody", threnody_wind: "Wind Threnody", threnody_fire: "Fire Threnody" });
Object.assign(BUFF_ICONS, { enthunder: "⚡", enstone: "◆", enaero: "🌀", blaze_spikes: "🔥", ice_spikes: "❄", shock: "⚡", rasp: "◆", choke: "🌀", requiem: "🎵", mambo: "🎵", pastoral: "🎵", operetta: "🎵", threnody_light: "✨", threnody_dark: "🌑", threnody_earth: "◆", threnody_water: "💧", threnody_wind: "🌀", threnody_fire: "🔥" });
Object.assign(BUFF_NAMES, { barfire: "Barfire", barstone: "Barstone", barwater: "Barwater", baraero: "Baraero", barsleep: "Barsleep", barpoison: "Barpoison", barparalyze: "Barparalyze", barblind: "Barblind", aquaveil: "Aquaveil", sneak: "Sneak", deodorize: "Deodorize", silence: "Silence", reraise: "Reraise", poison: "Poison", shell: "Shell", minne: "Knight's Minne" });
Object.assign(BUFF_ICONS, { barfire: "🔥", barstone: "◆", barwater: "💧", baraero: "🌀", barsleep: "💤", barpoison: "☠️", barparalyze: "🧊", barblind: "🕶", aquaveil: "🫧", sneak: "👣", deodorize: "🌿", silence: "🤐", reraise: "🪽", poison: "☠️", shell: "🔰", minne: "🎵" });

const SPELLS = {
  cure: { name: "Cure", jobs: { WHM: 1, RDM: 3, PLD: 5 }, mp: 8, cast: 2, recast: 5, kind: "heal", cure: { min: 10, t: [[20, 4, 10, 0], [40, 1.3333, 15, 20], [125, 8.5, 30, 40], [200, 15, 40, 125], [600, 20, 40, 200], [1000000000.0, 999999, 65, 0]] }, target: "ally", desc: "Restores HP. Healing power comes from half your MND, a quarter of your VIT and your Healing Magic skill." },
  cure2: { name: "Cure II", jobs: { WHM: 11, RDM: 14, PLD: 17 }, mp: 24, cast: 2.25, recast: 5.5, kind: "heal", cure: { min: 60, t: [[70, 1, 60, 40], [125, 5.5, 90, 70], [200, 7.5, 100, 125], [400, 10, 110, 200], [700, 20, 130, 400], [1000000000.0, 999999, 145, 0]] }, target: "ally", desc: "Restores a good amount of HP." },
  dia: { name: "Dia", jobs: { WHM: 3, RDM: 1 }, mp: 7, cast: 1, recast: 5, kind: "dot", element: "light", power: 1, dot: { dur: 60, tick: 1 }, buff: "dia", target: "enemy", desc: "Light damage, then 1 damage every 3 s for 60 s. Lowers the target's defense by 10%. Replaces Bio." },
  banish: { name: "Banish", jobs: { WHM: 5, PLD: 7 }, mp: 15, cast: 2, recast: 15, kind: "nuke", element: "light", power: 14, k: 1, k2: 1, stat: "mnd", target: "enemy", skill: "divine", desc: "Light damage. Undead take 50% more." },
  protect: { name: "Protect", jobs: { WHM: 7, RDM: 7, PLD: 10 }, mp: 9, cast: 1, recast: 5, kind: "buff", buff: "protect", pow: 15, target: "ally", desc: "Defense +15 for 30 minutes.", dur: 1800 },
  shell: { name: "Shell", jobs: { WHM: 17, RDM: 17, PLD: 20 }, mp: 18, cast: 1, recast: 5, kind: "buff", buff: "shell", pow: 0.11, target: "ally", desc: "Elemental damage taken -11% for 30 minutes.", dur: 1800 },
  slow: { name: "Slow", jobs: { WHM: 13, RDM: 13 }, mp: 15, cast: 2, recast: 20, kind: "debuff", element: "earth", buff: "slow", stat: "mnd", enmity: 80, target: "enemy", desc: "Slows the target's attacks by 7% to 29% (more when your MND beats its MND).", dur: 180 },
  paralyze: { name: "Paralyze", jobs: { WHM: 4, RDM: 6 }, mp: 6, cast: 3, recast: 10, kind: "debuff", element: "ice", buff: "paralyze", stat: "mnd", enmity: 80, target: "enemy", desc: "The target loses 5% to 25% of its attacks to paralysis (more when your MND beats its MND).", dur: 120 },
  stone: { name: "Stone", jobs: { BLM: 1, RDM: 4, DRK: 5 }, mp: 4, cast: 0.5, recast: 2, kind: "nuke", power: 10, k: 2, k2: 1, stat: "int", element: "earth", target: "enemy", desc: "Earth damage. Grows with how far your INT is above the target's." },
  water: { name: "Water", jobs: { BLM: 5, RDM: 9, DRK: 11 }, mp: 5, cast: 0.5, recast: 2, kind: "nuke", power: 25, k: 1.8, k2: 1, stat: "int", element: "water", target: "enemy", desc: "Water damage." },
  aero: { name: "Aero", jobs: { BLM: 9, RDM: 14, DRK: 17 }, mp: 6, cast: 0.5, recast: 2, kind: "nuke", power: 40, k: 1.6, k2: 1, stat: "int", element: "wind", target: "enemy", desc: "Wind damage." },
  fire: { name: "Fire", jobs: { BLM: 13, RDM: 19 }, mp: 7, cast: 0.5, recast: 2, kind: "nuke", power: 55, k: 1.4, k2: 1, stat: "int", element: "fire", target: "enemy", desc: "Fire damage." },
  blizzard: { name: "Blizzard", jobs: { BLM: 17 }, mp: 8, cast: 0.5, recast: 2, kind: "nuke", power: 70, k: 1.2, k2: 1, stat: "int", element: "ice", target: "enemy", desc: "Ice damage." },
  silence: { name: "Silence", jobs: { WHM: 15, RDM: 18 }, mp: 16, cast: 3, recast: 10, kind: "debuff", element: "wind", buff: "silence", stat: "mnd", enmity: 60, target: "enemy", desc: "Stops a monster from casting spells for 2 minutes.", dur: 120 },
  poison: { name: "Poison", jobs: { BLM: 3, RDM: 5, DRK: 6 }, mp: 5, cast: 1, recast: 5, kind: "dot", element: "water", power: 0, dot: { dur: 90, skill: "enfeebling", div: 25, min: 1 }, buff: "poison", target: "enemy", skill: "enfeebling", desc: "Poisons the target: damage every 3 s for 90 s, stronger with Enfeebling Magic skill." },
  bio: { name: "Bio", jobs: { BLM: 10, RDM: 10, DRK: 15 }, mp: 15, cast: 1.5, recast: 5, kind: "dot", element: "dark", power: 10, dot: { dur: 60, skill: "dark", div: 40, ceil: true, min: 1, max: 3 }, buff: "blight", target: "enemy", skill: "dark", desc: "Dark damage, then up to 3 damage every 3 s for 60 s. Lowers the target's attack by 10%. Replaces Dia." },
  drain: { name: "Drain", jobs: { BLM: 12, DRK: 10 }, mp: 21, cast: 3, recast: 60, kind: "drain", element: "dark", absorb: [1, 20], target: "enemy", skill: "dark", desc: "Steals HP from the target. Ineffective against undead." },
  aspir: { name: "Aspir", jobs: { DRK: 20 }, mp: 10, cast: 3, recast: 60, kind: "aspir", element: "dark", absorb: [0.3, 20], target: "enemy", skill: "dark", desc: "Steals MP from the target. Ineffective against undead." },
  blind: { name: "Blind", jobs: { BLM: 4, RDM: 8 }, mp: 5, cast: 2, recast: 10, kind: "debuff", element: "dark", buff: "flash", stat: "int", enmity: 60, target: "enemy", desc: "Lowers the target's accuracy by 5% to 50% (more when your INT beats its INT).", dur: 180 },
  bind: { name: "Bind", jobs: { BLM: 7, RDM: 11, DRK: 20 }, mp: 8, cast: 2, recast: 40, kind: "debuff", element: "ice", buff: "bind", enmity: 60, target: "enemy", desc: "Holds the target in place.", dur: 60 },
  sleep: { name: "Sleep", jobs: { BLM: 20 }, mp: 19, cast: 2.5, recast: 30, kind: "debuff", element: "dark", buff: "sleep", enmity: 60, target: "enemy", desc: "Puts the target to sleep. Any damage wakes it. Bosses are immune.", dur: 60 },
  poisona: { name: "Poisona", jobs: { WHM: 6 }, mp: 8, cast: 1, recast: 5, kind: "cleanse", cleanse: ["poison"], target: "ally", desc: "Removes Poison from one ally." },
  paralyna: { name: "Paralyna", jobs: { WHM: 9 }, mp: 12, cast: 1, recast: 5, kind: "cleanse", cleanse: ["paralyze"], target: "ally", desc: "Removes Paralysis from one ally." },
  blindna: { name: "Blindna", jobs: { WHM: 14 }, mp: 16, cast: 1, recast: 10, kind: "cleanse", cleanse: ["flash"], target: "ally", desc: "Removes Blindness from one ally." },
  silena: { name: "Silena", jobs: { WHM: 19 }, mp: 24, cast: 1, recast: 5, kind: "cleanse", cleanse: ["silence"], target: "ally", desc: "Removes Silence from one ally." },
  barstone: { name: "Barstone", jobs: { RDM: 5 }, mp: 6, cast: 0.5, recast: 10, kind: "buff", buff: "barstone", bar: "earth", target: "ally", dur: 480, desc: "Cuts earth damage taken for 8 minutes. The bonus grows with your Enhancing skill." },
  barstonra: { name: "Barstonra", jobs: { WHM: 5 }, mp: 12, cast: 0.5, recast: 10, kind: "buff", buff: "barstone", bar: "earth", party: true, target: "ally", dur: 480, desc: "Cuts earth damage taken for the whole party for 8 minutes." },
  barwater: { name: "Barwater", jobs: { RDM: 9 }, mp: 6, cast: 0.5, recast: 10, kind: "buff", buff: "barwater", bar: "water", target: "ally", dur: 480, desc: "Cuts water damage taken for 8 minutes. The bonus grows with your Enhancing skill." },
  barwatera: { name: "Barwatera", jobs: { WHM: 9 }, mp: 12, cast: 0.5, recast: 10, kind: "buff", buff: "barwater", bar: "water", party: true, target: "ally", dur: 480, desc: "Cuts water damage taken for the whole party for 8 minutes." },
  baraero: { name: "Baraero", jobs: { RDM: 13 }, mp: 6, cast: 0.5, recast: 10, kind: "buff", buff: "baraero", bar: "wind", target: "ally", dur: 480, desc: "Cuts wind damage taken for 8 minutes. The bonus grows with your Enhancing skill." },
  baraera: { name: "Baraera", jobs: { WHM: 13 }, mp: 12, cast: 0.5, recast: 10, kind: "buff", buff: "baraero", bar: "wind", party: true, target: "ally", dur: 480, desc: "Cuts wind damage taken for the whole party for 8 minutes." },
  barfire: { name: "Barfire", jobs: { RDM: 17 }, mp: 6, cast: 0.5, recast: 10, kind: "buff", buff: "barfire", bar: "fire", target: "ally", dur: 480, desc: "Cuts fire damage taken for 8 minutes. The bonus grows with your Enhancing skill." },
  barfira: { name: "Barfira", jobs: { WHM: 17 }, mp: 12, cast: 0.5, recast: 10, kind: "buff", buff: "barfire", bar: "fire", party: true, target: "ally", dur: 480, desc: "Cuts fire damage taken for the whole party for 8 minutes." },
  barsleep: { name: "Barsleep", jobs: { RDM: 7 }, mp: 7, cast: 2.5, recast: 10, kind: "buff", buff: "barsleep", barst: "sleep", target: "ally", dur: 480, desc: "Half the chance of sleep from monster attacks, for 8 minutes." },
  barsleepra: { name: "Barsleepra", jobs: { WHM: 7 }, mp: 14, cast: 5, recast: 10, kind: "buff", buff: "barsleep", barst: "sleep", party: true, target: "ally", dur: 480, desc: "Half the chance of sleep from monster attacks for the whole party, for 8 minutes." },
  barpoison: { name: "Barpoison", jobs: { RDM: 10 }, mp: 9, cast: 2.5, recast: 10, kind: "buff", buff: "barpoison", barst: "poison", target: "ally", dur: 480, desc: "Half the chance of poison from monster attacks, for 8 minutes." },
  barpoisonra: { name: "Barpoisonra", jobs: { WHM: 10 }, mp: 18, cast: 5, recast: 10, kind: "buff", buff: "barpoison", barst: "poison", party: true, target: "ally", dur: 480, desc: "Half the chance of poison from monster attacks for the whole party, for 8 minutes." },
  barparalyze: { name: "Barparalyze", jobs: { RDM: 12 }, mp: 11, cast: 2.5, recast: 10, kind: "buff", buff: "barparalyze", barst: "paralyze", target: "ally", dur: 480, desc: "Half the chance of paralyze from monster attacks, for 8 minutes." },
  barparalyzra: { name: "Barparalyzra", jobs: { WHM: 12 }, mp: 22, cast: 5, recast: 10, kind: "buff", buff: "barparalyze", barst: "paralyze", party: true, target: "ally", dur: 480, desc: "Half the chance of paralyze from monster attacks for the whole party, for 8 minutes." },
  barblind: { name: "Barblind", jobs: { RDM: 18 }, mp: 13, cast: 2.5, recast: 10, kind: "buff", buff: "barblind", barst: "flash", target: "ally", dur: 480, desc: "Half the chance of blind from monster attacks, for 8 minutes." },
  barblindra: { name: "Barblindra", jobs: { WHM: 18 }, mp: 26, cast: 5, recast: 10, kind: "buff", buff: "barblind", barst: "flash", party: true, target: "ally", dur: 480, desc: "Half the chance of blind from monster attacks for the whole party, for 8 minutes." },
  protectra: { name: "Protectra", jobs: { WHM: 7 }, mp: 9, cast: 1, recast: 15, kind: "buff", buff: "protect", pow: 15, party: true, target: "ally", dur: 1800, desc: "Defense +15 for the whole party for 30 minutes." },
  shellra: { name: "Shellra", jobs: { WHM: 17 }, mp: 18, cast: 1, recast: 15, kind: "buff", buff: "shell", pow: 0.11, party: true, target: "ally", dur: 1800, desc: "Elemental damage taken -11% for the whole party for 30 minutes." },
  blink: { name: "Blink", jobs: { WHM: 19 }, mp: 20, cast: 6, recast: 10, kind: "buff", buff: "shadows", n: 2, exact: true, target: "self", dur: 300, desc: "Two shadow images absorb the next two melee hits for 5 minutes." },
  aquaveil: { name: "Aquaveil", jobs: { WHM: 10, RDM: 12 }, mp: 12, cast: 5, recast: 10, kind: "buff", buff: "aquaveil", n: 1, target: "self", dur: 600, desc: "Blocks one spell interruption from damage for 10 minutes. Two blocks above 300 Enhancing skill." },
  sneak: { name: "Sneak", jobs: { WHM: 20, RDM: 20 }, mp: 12, cast: 3, recast: 10, kind: "buff", buff: "sneak", target: "ally", dur: 420, rnd: 120, desc: "Monsters that notice you by sound ignore you for about 7 to 9 minutes." },
  deodorize: { name: "Deodorize", jobs: { WHM: 15, RDM: 15 }, mp: 10, cast: 2, recast: 8, kind: "buff", buff: "deodorize", target: "ally", dur: 420, rnd: 120, desc: "Monsters that sniff out the weak ignore you for about 7 to 9 minutes." },
  warp: { name: "Warp", jobs: { BLM: 17 }, mp: 100, cast: 4, recast: 10, kind: "warp", target: "self", desc: "Teleports you to your home point." },
  curaga: { name: "Curaga", jobs: { WHM: 16 }, mp: 60, cast: 4.5, recast: 10, kind: "heal", aoe: 300, cure: { min: 60, t: [[110.5, 2, 20, 0], [170.5, 4, 47.5, 0], [1000000000, 71.3332, 87.62, 0]] }, target: "ally", desc: "Restores HP to every ally near the target." },
  diaga: { name: "Diaga", jobs: { WHM: 18, RDM: 15 }, mp: 12, cast: 1.5, recast: 6, kind: "dot", aoe: 170, element: "light", power: 1, dot: { dur: 60, tick: 1 }, buff: "dia", target: "enemy", desc: "Dia on every enemy near the target: light damage, then 1 damage every 3 s for 60 s." },
  banishga: { name: "Banishga", jobs: { WHM: 15 }, mp: 41, cast: 2.75, recast: 15, kind: "nuke", aoe: 170, element: "light", power: 36, k: 1, k2: 1, stat: "mnd", target: "enemy", skill: "divine", desc: "Light damage to every enemy near the target. Undead take 50% more." },
  stonega: { name: "Stonega", jobs: { BLM: 15 }, mp: 24, cast: 2, recast: 5, kind: "nuke", aoe: 170, element: "earth", power: 62, k: 1.4, k2: 1, stat: "int", target: "enemy", desc: "Earth damage to every enemy near the target." },
  waterga: { name: "Waterga", jobs: { BLM: 19 }, mp: 34, cast: 2, recast: 5, kind: "nuke", aoe: 170, element: "water", power: 78, k: 1.2, k2: 1, stat: "int", target: "enemy", desc: "Water damage to every enemy near the target." },
  blaze_spikes: { name: "Blaze Spikes", jobs: { BLM: 10, RDM: 20 }, mp: 8, cast: 3, recast: 10, kind: "buff", buff: "blaze_spikes", spikes: { el: "fire", div: 12, max: 25 }, target: "self", dur: 180, desc: "Fire damage to anything that hits you in melee, for 3 minutes. Stronger with INT." },
  ice_spikes: { name: "Ice Spikes", jobs: { BLM: 20 }, mp: 16, cast: 3, recast: 10, kind: "buff", buff: "ice_spikes", spikes: { el: "ice", div: 20, max: 15, para: 0.3 }, target: "self", dur: 180, desc: "Ice damage to anything that hits you in melee, and it may be paralyzed, for 3 minutes." },
  enthunder: { name: "Enthunder", jobs: { RDM: 16 }, mp: 12, cast: 3, recast: 10, kind: "buff", buff: "enthunder", en: "lightning", target: "self", dur: 180, desc: "Your melee hits add lightning damage for 3 minutes. Stronger with Enhancing skill." },
  enstone: { name: "Enstone", jobs: { RDM: 18 }, mp: 12, cast: 3, recast: 10, kind: "buff", buff: "enstone", en: "earth", target: "self", dur: 180, desc: "Your melee hits add earth damage for 3 minutes. Stronger with Enhancing skill." },
  enaero: { name: "Enaero", jobs: { RDM: 20 }, mp: 12, cast: 3, recast: 10, kind: "buff", buff: "enaero", en: "wind", target: "self", dur: 180, desc: "Your melee hits add wind damage for 3 minutes. Stronger with Enhancing skill." },
  shock: { name: "Shock", jobs: { BLM: 16 }, mp: 25, cast: 2.5, recast: 10, kind: "dot", element: "lightning", power: 0, dot: { dur: 90, pot: "int" }, buff: "shock", skill: "enfeebling", target: "enemy", desc: "Lightning damage over time for 90 s. Stronger with INT. Rasp and Choke overwrite it." },
  rasp: { name: "Rasp", jobs: { BLM: 18 }, mp: 25, cast: 2.5, recast: 10, kind: "dot", element: "earth", power: 0, dot: { dur: 90, pot: "int" }, buff: "rasp", replaces: ["shock"], skill: "enfeebling", target: "enemy", desc: "Earth damage over time for 90 s and lowers the target's accuracy. Replaces Shock." },
  choke: { name: "Choke", jobs: { BLM: 20 }, mp: 25, cast: 2.5, recast: 10, kind: "dot", element: "wind", power: 0, dot: { dur: 90, pot: "int" }, buff: "choke", replaces: ["rasp"], skill: "enfeebling", target: "enemy", desc: "Wind damage over time for 90 s and lowers the target's defense. Replaces Rasp." },
  foe_requiem: { name: "Foe Requiem", jobs: { BRD: 7 }, mp: 0, cast: 2, recast: 24, kind: "dot", element: "dark", power: 0, dot: { dur: 64, tick: 1 }, buff: "requiem", skill: "singing", target: "enemy", desc: "1 damage every 3 s for 64 s." },
  foe_requiem2: { name: "Foe Requiem II", jobs: { BRD: 17 }, mp: 0, cast: 2, recast: 24, kind: "dot", element: "dark", power: 0, dot: { dur: 80, tick: 2 }, buff: "requiem", skill: "singing", target: "enemy", desc: "2 damage every 3 s for 80 s." },
  light_threnody: { name: "Light Threnody", jobs: { BRD: 10 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "light", buff: "threnody_light", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more light damage for 60 s.", dur: 60 },
  dark_threnody: { name: "Dark Threnody", jobs: { BRD: 12 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "dark", buff: "threnody_dark", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more dark damage for 60 s.", dur: 60 },
  earth_threnody: { name: "Earth Threnody", jobs: { BRD: 14 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "earth", buff: "threnody_earth", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more earth damage for 60 s.", dur: 60 },
  water_threnody: { name: "Water Threnody", jobs: { BRD: 16 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "water", buff: "threnody_water", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more water damage for 60 s.", dur: 60 },
  wind_threnody: { name: "Wind Threnody", jobs: { BRD: 18 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "wind", buff: "threnody_wind", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more wind damage for 60 s.", dur: 60 },
  fire_threnody: { name: "Fire Threnody", jobs: { BRD: 20 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "fire", buff: "threnody_fire", thr: 0.25, enmity: 60, skill: "singing", target: "enemy", desc: "The target takes 25% more fire damage for 60 s.", dur: 60 },
  sheepfoe_mambo: { name: "Sheepfoe Mambo", jobs: { BRD: 13 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "mambo", base: 5, sreq: 85, cap: 48, mult: 5, div: 18, target: "self", skill: "singing", desc: "Party song: evasion +5 and rising with Singing skill, for 2 minutes.", dur: 120 },
  herb_pastoral: { name: "Herb Pastoral", jobs: { BRD: 9 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "pastoral", base: 20, sreq: 200, cap: 80, mult: 8, div: 10, target: "self", skill: "singing", desc: "Party song: 40% or more chance to resist Poison, for 2 minutes.", dur: 120 },
  scops_operetta: { name: "Scop's Operetta", jobs: { BRD: 19 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "operetta", base: 20, sreq: 200, cap: 80, mult: 8, div: 10, target: "self", skill: "singing", desc: "Party song: 40% or more chance to resist Silence, for 2 minutes.", dur: 120 },
  knights_minne: { name: "Knight's Minne", jobs: { BRD: 1 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "minne", base: 8, sreq: 0, cap: 30, mult: 3, div: 10, target: "self", skill: "singing", desc: "Party song: defense +8, rising with Singing skill.", dur: 120 },
  valor_minuet: { name: "Valor Minuet", jobs: { BRD: 3 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "minuet", base: 5, sreq: 50, cap: 32, mult: 3, div: 4.3, target: "self", skill: "singing", desc: "Party song: attack +5, rising with Singing skill.", dur: 120 },
  armys_paeon: { name: "Army's Paeon", jobs: { BRD: 5 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "paeon", base: 1, sreq: 100, cap: 2, mult: 1, div: 0, target: "self", skill: "singing", desc: "Party song: restores 1 HP every 3 s.", dur: 120 },
  armys_paeon2: { name: "Army's Paeon II", jobs: { BRD: 15 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "paeon", base: 2, sreq: 150, cap: 3, mult: 1, div: 0, target: "self", skill: "singing", desc: "Party song: restores 2 HP every 3 s.", dur: 120 },
  sword_madrigal: { name: "Sword Madrigal", jobs: { BRD: 11 }, mp: 0, cast: 8, recast: 24, kind: "song", song: "madrigal", base: 5, sreq: 85, cap: 45, mult: 4.5, div: 18, target: "self", skill: "singing", desc: "Party song: accuracy +5, rising with Singing skill.", dur: 120 },
  foe_lullaby: { name: "Foe Lullaby", jobs: { BRD: 16 }, mp: 0, cast: 2, recast: 24, kind: "debuff", element: "light", buff: "sleep", enmity: 60, target: "enemy", skill: "singing", desc: "Lulls the target to sleep. Any damage wakes it. Bosses are immune.", dur: 45 },
  carbuncle: { name: "Carbuncle", jobs: { SMN: 1 }, mp: 5, cast: 5, recast: 5, kind: "summon", element: "light", pet: "carbuncle", target: "self", desc: "Calls Carbuncle to fight beside you. It slowly drains your MP." },
  fire_spirit: { name: "Fire Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "fire", pet: "ember", target: "self", desc: "Calls a fire spirit to fight beside you. It slowly drains your MP." },
  ice_spirit: { name: "Ice Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "ice", pet: "frost", target: "self", desc: "Calls a ice spirit to fight beside you. It slowly drains your MP." },
  air_spirit: { name: "Air Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "wind", pet: "gale", target: "self", desc: "Calls a air spirit to fight beside you. It slowly drains your MP." },
  earth_spirit: { name: "Earth Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "earth", pet: "stone", target: "self", desc: "Calls a earth spirit to fight beside you. It slowly drains your MP." },
  thunder_spirit: { name: "Thunder Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "lightning", pet: "thunder", target: "self", desc: "Calls a thunder spirit to fight beside you. It slowly drains your MP." },
  water_spirit: { name: "Water Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "water", pet: "water", target: "self", desc: "Calls a water spirit to fight beside you. It slowly drains your MP." },
  light_spirit: { name: "Light Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "light", pet: "light", target: "self", desc: "Calls a light spirit to fight beside you. It slowly drains your MP." },
  dark_spirit: { name: "Dark Spirit", jobs: { SMN: 1 }, drop: true, mp: 10, cast: 1, recast: 5, kind: "summon", element: "dark", pet: "dark", target: "self", desc: "Calls a dark spirit to fight beside you. It slowly drains your MP." }
};

const SKILL_NAMES = { scythe: "Scythe", dark: "Dark Magic", singing: "Singing", archery: "Archery", summoning: "Summoning Magic", dagger: "Dagger", sword: "Sword", club: "Club", staff: "Staff", greataxe: "Great Axe", h2h: "Hand-to-Hand", healing: "Healing Magic", divine: "Divine Magic", elemental: "Elemental Magic", enfeebling: "Enfeebling Magic", enhancing: "Enhancing Magic" };
const COMBAT_SKILLS = ["sword", "dagger", "club", "staff", "greataxe", "scythe", "h2h", "archery"];
const MAGIC_SKILLS = ["healing", "divine", "elemental", "enfeebling", "enhancing", "dark", "summoning", "singing"];
const SKILL_RATINGS = {
  WAR: { archery: "D", sword: "B", dagger: "B", club: "B", staff: "B", greataxe: "A", h2h: "D" },
  WHM: { club: "B", staff: "C", h2h: "E", healing: "B", divine: "C", enhancing: "B" },
  BLM: { club: "D", staff: "C", dagger: "D", h2h: "E", elemental: "B", enfeebling: "C" },
  PLD: { sword: "A", club: "B", staff: "C", greataxe: "D", h2h: "D", healing: "C", divine: "B", enhancing: "C" },
  THF: { dagger: "A", sword: "D", club: "E", h2h: "D", archery: "C" },
  RNG: { archery: "A", dagger: "B", sword: "D", club: "E" },
  SMN: { summoning: "A", staff: "B", club: "C", dagger: "E" },
  MNK: { h2h: "A", staff: "B", club: "C" },
  DRK: { scythe: "A", greataxe: "B", sword: "B", dagger: "C", club: "C", dark: "A", elemental: "C" },
  BRD: { singing: "A", dagger: "B", sword: "C", staff: "C", club: "D" },
  RDM: { sword: "B", dagger: "B", club: "D", staff: "D", h2h: "E", healing: "C", divine: "D", elemental: "C", enfeebling: "B", enhancing: "B" }
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
  potion: { name: "Potion", kind: "use", icon: "🧪", heal: 50, price: 40, stack: 12, desc: "Restores 50 HP." },
  potion_hq: { name: "Potion +1", kind: "use", icon: "🧪", hq: true, heal: 60, price: 48, stack: 12, desc: "Restores 60 HP." },
  potion_hq2: { name: "Potion +2", kind: "use", icon: "🧪", hq: true, heal: 75, price: 60, stack: 12, desc: "Restores 75 HP." },
  potion_hq3: { name: "Potion +3", kind: "use", icon: "🧪", hq: true, heal: 100, price: 80, stack: 12, desc: "Restores 100 HP." },
  hi_potion: { name: "Hi-Potion", kind: "use", icon: "⚗️", heal: 100, price: 77, stack: 12, desc: "Restores 100 HP." },
  hi_potion_hq: { name: "Hi-Potion +1", kind: "use", icon: "⚗️", hq: true, heal: 110, price: 85, stack: 12, desc: "Restores 110 HP." },
  hi_potion_hq2: { name: "Hi-Potion +2", kind: "use", icon: "⚗️", hq: true, heal: 120, price: 92, stack: 12, desc: "Restores 120 HP." },
  hi_potion_hq3: { name: "Hi-Potion +3", kind: "use", icon: "⚗️", hq: true, heal: 130, price: 100, stack: 12, desc: "Restores 130 HP." },
  x_potion: { name: "X-Potion", kind: "use", icon: "⚗️", heal: 150, price: 111, stack: 12, desc: "Restores 150 HP." },
  x_potion_hq: { name: "X-Potion +1", kind: "use", icon: "⚗️", hq: true, heal: 160, price: 119, stack: 12, desc: "Restores 160 HP." },
  x_potion_hq2: { name: "X-Potion +2", kind: "use", icon: "⚗️", hq: true, heal: 170, price: 126, stack: 12, desc: "Restores 170 HP." },
  x_potion_hq3: { name: "X-Potion +3", kind: "use", icon: "⚗️", hq: true, heal: 180, price: 134, stack: 12, desc: "Restores 180 HP." },
  max_potion: { name: "Max-Potion", kind: "use", icon: "⚗️", heal: 500, price: 1588, stack: 12, desc: "Restores 500 HP." },
  max_potion_hq: { name: "Max-Potion +1", kind: "use", icon: "⚗️", hq: true, heal: 550, price: 1747, stack: 12, desc: "Restores 550 HP." },
  max_potion_hq2: { name: "Max-Potion +2", kind: "use", icon: "⚗️", hq: true, heal: 650, price: 2065, stack: 12, desc: "Restores 650 HP." },
  max_potion_hq3: { name: "Max-Potion +3", kind: "use", icon: "⚗️", hq: true, heal: 700, price: 2224, stack: 12, desc: "Restores 700 HP." },
  ether: { name: "Ether", kind: "use", icon: "💧", mpRestore: 20, price: 186, stack: 12, desc: "Restores 20 MP." },
  ether_hq: { name: "Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 25, price: 232, stack: 12, desc: "Restores 25 MP." },
  ether_hq2: { name: "Ether +2", kind: "use", icon: "💧", hq: true, mpRestore: 30, price: 279, stack: 12, desc: "Restores 30 MP." },
  ether_hq3: { name: "Ether +3", kind: "use", icon: "💧", hq: true, mpRestore: 40, price: 372, stack: 12, desc: "Restores 40 MP." },
  hi_ether: { name: "Hi-Ether", kind: "use", icon: "💧", mpRestore: 50, price: 308, stack: 12, desc: "Restores 50 MP." },
  hi_ether_hq: { name: "Hi-Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 55, price: 338, stack: 12, desc: "Restores 55 MP." },
  hi_ether_hq2: { name: "Hi-Ether +2", kind: "use", icon: "💧", hq: true, mpRestore: 60, price: 369, stack: 12, desc: "Restores 60 MP." },
  hi_ether_hq3: { name: "Hi-Ether +3", kind: "use", icon: "💧", hq: true, mpRestore: 70, price: 431, stack: 12, desc: "Restores 70 MP." },
  super_ether: { name: "Super Ether", kind: "use", icon: "💧", mpRestore: 100, price: 408, stack: 12, desc: "Restores 100 MP." },
  super_ether_hq: { name: "Super Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 105, price: 428, stack: 12, desc: "Restores 105 MP." },
  super_ether_hq2: { name: "Super Ether +2", kind: "use", icon: "💧", hq: true, mpRestore: 110, price: 448, stack: 12, desc: "Restores 110 MP." },
  super_ether_hq3: { name: "Super Ether +3", kind: "use", icon: "💧", hq: true, mpRestore: 120, price: 489, stack: 12, desc: "Restores 120 MP." },
  pro_ether: { name: "Pro-Ether", kind: "use", icon: "💧", mpRestore: 250, price: 446, stack: 12, desc: "Restores 250 MP." },
  pro_ether_hq: { name: "Pro-Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 280, price: 500, stack: 12, desc: "Restores 280 MP." },
  pro_ether_hq2: { name: "Pro-Ether +2", kind: "use", icon: "💧", hq: true, mpRestore: 310, price: 553, stack: 12, desc: "Restores 310 MP." },
  pro_ether_hq3: { name: "Pro-Ether +3", kind: "use", icon: "💧", hq: true, mpRestore: 350, price: 625, stack: 12, desc: "Restores 350 MP." },
  elixir: { name: "Elixir", kind: "use", icon: "🍷", healPct: 0.25, mpPct: 0.25, price: 2154, stack: 12, desc: "Restores 25% of your HP and MP." },
  hi_elixir: { name: "Hi-Elixir", kind: "use", icon: "🍷", healPct: 0.5, mpPct: 0.5, price: 2923, stack: 12, desc: "Restores 50% of your HP and MP." },
  reraiser: { name: "Reraiser", kind: "use", icon: "🪽", reraise: 0.5, rrSecs: 3600, price: 400, stack: 12, desc: "Reraise for 60 minutes: if you are KO'd you stand back up with half your HP." },
  hi_reraiser: { name: "Hi-Reraiser", kind: "use", icon: "🪽", reraise: 1, rrSecs: 5400, price: 1200, stack: 12, desc: "A stronger Reraise for 90 minutes: you stand back up with full HP." },
  super_reraiser: { name: "Super Reraiser", kind: "use", icon: "🪽", reraise: 1, rrSecs: 3600, price: 3000, stack: 12, desc: "The strongest Reraise for 60 minutes." },
  fire_crystal: { name: "Fire Essence", kind: "crystal", icon: "🔥", element: "fire", price: 30, stack: 12, desc: "Used in Smithing crafting." },
  wind_crystal: { name: "Wind Essence", kind: "crystal", icon: "🌪️", element: "wind", price: 30, stack: 12, desc: "Used in Woodworking crafting." },
  earth_crystal: { name: "Earth Essence", kind: "crystal", icon: "🪨", element: "earth", price: 30, stack: 12, desc: "Used in Clothcraft crafting." },
  water_crystal: { name: "Water Essence", kind: "crystal", icon: "🌊", element: "water", price: 30, stack: 12, desc: "Used in Alchemy crafting." },
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
  fishing_rod: { name: "Willow Rod", kind: "use", icon: "🎣", price: 150, fishing: true, desc: "Use it beside water (or type /fish) to cast a line. Needs Fishing Bait." },
  bait: { name: "Fishing Bait", kind: "mat", icon: "🪱", price: 4, stack: 24, desc: "One is used per cast." },
  pond_minnow: { name: "Pond Minnow", kind: "mat", icon: "🐟", price: 10, stack: 12, desc: "Tiny and silver. Pip likes them." },
  moat_carp: { name: "Moat Carp", kind: "mat", icon: "🐟", price: 22, stack: 12, desc: "A fat, lazy carp." },
  silver_shad: { name: "Silver Shad", kind: "mat", icon: "🐟", price: 38, stack: 12, desc: "Quick and bony. Tasty grilled." },
  lakeking_pike: { name: "Lakeking Pike", kind: "mat", icon: "🐠", price: 220, stack: 12, rarity: "rare", desc: "A legend of Mirror Lake. Collectors pay well." },
  mud_eel: { name: "Mud Eel", kind: "mat", icon: "🐍", price: 48, stack: 12, desc: "Slippery, strong and ugly." },
  bog_perch: { name: "Bog Perch", kind: "mat", icon: "🐟", price: 64, stack: 12, desc: "Striped green and brown, like the marsh." },
  ghost_koi: { name: "Ghost Koi", kind: "mat", icon: "🐠", price: 320, stack: 12, rarity: "rare", desc: "Pale as moonlight. Said to bite only in bad weather." },
  grain_flour: { name: "Grain Flour", kind: "mat", icon: "🌾", price: 8, stack: 24, desc: "Milled in the Outpost. A cooking staple." },
  rock_salt: { name: "Rock Salt", kind: "mat", icon: "🧂", price: 6, stack: 24, desc: "Coarse salt for the cook pot." },
  grilled_minnow: { name: "Grilled Minnow", kind: "food", icon: "🍢", price: 20, stack: 12, food: { hp: 10, dex: 1 }, desc: "Crunchy and salty." },
  herb_bread: { name: "Herb Bread", kind: "food", icon: "🍞", price: 24, stack: 12, food: { mp: 15, mnd: 2 }, desc: "Warm bread flecked with herbs. Mages swear by it." },
  carp_stew: { name: "Carp Stew", kind: "food", icon: "🍲", price: 40, stack: 12, food: { hp: 25, vit: 2 }, desc: "Hearty and filling." },
  shad_skewer: { name: "Shad Skewer", kind: "food", icon: "🍡", price: 60, stack: 12, food: { att: 8, str: 2, acc: 4 }, desc: "Fighters' food: quick, salty, full of fire." },
  eel_pie: { name: "Eel Pie", kind: "food", icon: "🥧", price: 80, stack: 12, food: { hp: 40, def: 8 }, desc: "A thick-crusted marsh pie. Sits like armour." },
  perch_chowder: { name: "Perch Chowder", kind: "food", icon: "🥣", price: 95, stack: 12, food: { mp: 30, int: 3, mnd: 3 }, desc: "Creamy chowder that clears the head." },
  pike_feast: { name: "Pike Feast", kind: "food", icon: "🍱", price: 260, stack: 12, rarity: "rare", food: { hp: 60, str: 3, vit: 3, att: 12 }, desc: "A banquet built around a Lakeking Pike." },
  sea_rod: { name: "Sea Rod", kind: "use", icon: "🎣", price: 900, fishing: true, desc: "A long, springy rod. +10% catch rate and works anywhere a Willow Rod does." },
  harbor_bream: { name: "Harbor Bream", kind: "mat", icon: "🐟", price: 30, stack: 12, desc: "A silver-pink bream from the harbor." },
  sea_bass: { name: "Sea Bass", kind: "mat", icon: "🐟", price: 70, stack: 12, desc: "Firm, white and prized by cooks." },
  tidecaller_tuna: { name: "Tidecaller Tuna", kind: "mat", icon: "🐠", price: 400, stack: 12, rarity: "rare", desc: "A great blue tuna. Fishers tell stories about the one that got away." },
  grilled_bass: { name: "Grilled Sea Bass", kind: "food", icon: "🐟", price: 110, stack: 12, food: { hp: 35, agi: 3, eva: 6 }, desc: "Charred skin, lemon and salt." },
  ashen_shard: { name: "Ashen Shard", kind: "key", icon: "🕯️", desc: "A sliver of black stone, warm to the touch. Faint letters crawl across it." },
  egg_meadow_kit: { name: "Meadow Kit (pet)", kind: "pet", pet: "meadow_kit", icon: "🐇", rare: true, price: 0, desc: "A tiny hare that followed you home. Use it to make it your pet." },
  egg_batling: { name: "Batling (pet)", kind: "pet", pet: "batling", icon: "🦇", rare: true, price: 0, desc: "A bat pup clinging to your sleeve. Use it to make it your pet." },
  egg_wormlet: { name: "Wormlet (pet)", kind: "pet", pet: "wormlet", icon: "🪱", rare: true, price: 0, desc: "A stubby worm curled in a pot. Use it to make it your pet." },
  egg_snow_kit: { name: "Snow Kit (pet)", kind: "pet", pet: "snow_kit", icon: "🐇", rare: true, price: 0, desc: "A shivering white kit. Use it to make it your pet." },
  egg_tide_wisp: { name: "Tide Wisp (pet)", kind: "pet", pet: "tide_wisp", icon: "💧", rare: true, price: 0, desc: "A bubble of seafoam in a jar. Use it to make it your pet." },
  egg_shade_kit: { name: "Shade Kit (pet)", kind: "pet", pet: "shade_kit", icon: "🐈", rare: true, price: 0, desc: "A black kit curled in a basket. Use it to make it your pet." },
  egg_mini_gob: { name: "Pocket Goblin (pet)", kind: "pet", pet: "mini_gob", icon: "👺", rare: true, price: 0, desc: "A goblin runt in a sack, surprisingly cheerful. Use it to make it your pet." },
  egg_ember_wisp: { name: "Ember Wisp (pet)", kind: "pet", pet: "ember_wisp", icon: "🔥", rare: true, price: 0, desc: "A mote of flame in a lantern. Use it to make it your pet." },
  egg_frost_wisp: { name: "Frost Wisp (pet)", kind: "pet", pet: "frost_wisp", icon: "❄️", rare: true, price: 0, desc: "A shard of cold light in a jar. Use it to make it your pet." },
  chapel_sigil: { name: "Chapel Sigil", kind: "mat", icon: "🔱", price: 400, stack: 3, rarity: "rare", desc: "A tarnished sigil that opens the sealed door of the Drowned Chapel. Used up on entry." },
  frost_shard: { name: "Frost Shard", kind: "mat", icon: "🧊", price: 60, stack: 12, desc: "A shard of ice that never melts." },
  toad_oil: { name: "Toad Oil", kind: "mat", icon: "🫙", price: 40, stack: 12, desc: "Slick and smelly. Alchemists use it in salves." },
  orc_tooth: { name: "Orc Tooth", kind: "mat", icon: "🦷", price: 40, stack: 12, desc: "A chipped orc tusk. Carvers pay for them." },
  reef_scale: { name: "Reefkin Scale", kind: "mat", icon: "🐚", price: 48, stack: 12, desc: "An iridescent scale from a Reefkin. Makes fine lacquer." },
  crag_feather: { name: "Crag Feather", kind: "mat", icon: "🪶", price: 44, stack: 12, desc: "A stiff tawny feather. Fletchers love them." },
  heartwood: { name: "Heartwood", kind: "mat", icon: "🪵", price: 160, stack: 6, desc: "Dense wood from an elder treant. Nearly as hard as iron." },
  cactus_needle: { name: "Cactus Needle", kind: "mat", icon: "📍", price: 30, stack: 12, desc: "A long green needle, sharp as a pin." },
  bomb_ash: { name: "Bomb Ash", kind: "mat", icon: "🌋", price: 55, stack: 12, desc: "Still-warm ash from a burst bomb. Volatile." },
  honeycomb: { name: "Honeycomb", kind: "mat", icon: "🍯", price: 28, stack: 12, desc: "Sweet comb cut from a hive. Cooks and alchemists want it." },
  wool_tuft: { name: "Wool Tuft", kind: "mat", icon: "🧶", price: 22, stack: 12, desc: "Soft sheep's wool. Spins into cloth." },
  lizard_skin: { name: "Lizard Skin", kind: "mat", icon: "🦎", price: 45, stack: 12, desc: "Tough scaled hide. Good for boots and gloves." },
  crab_shell: { name: "Crab Shell", kind: "mat", icon: "🦀", price: 40, stack: 12, desc: "A hard plate of shell. Smiths use it like light armor." },
  crawler_cocoon: { name: "Crawler Cocoon", kind: "mat", icon: "🧵", price: 50, stack: 12, desc: "A bundle of crawler silk. Prized by weavers." },
  mandrake_leaf: { name: "Mandrake Leaf", kind: "mat", icon: "🍃", price: 24, stack: 12, desc: "A fragrant leaf from a mandrake's crown. Soothing when steeped." },
  spore_cap: { name: "Spore Cap", kind: "mat", icon: "🍄", price: 36, stack: 12, desc: "A dried mushroom cap, dusty with spores. Alchemists are careful with it." },
  longneck_hide: { name: "Longneck Hide", kind: "mat", icon: "🟫", price: 90, stack: 6, desc: "A broad, supple hide. Enough for a whole coat." },
  mire_reed: { name: "Mire Reed", kind: "mat", icon: "🌾", price: 25, stack: 12, desc: "Tough marsh reed for weaving." },
  crypt_key: { name: "Crypt Key", kind: "key", icon: "🗝️", rare: true, ex: true, rarity: "epic", price: 0, desc: "A heavy iron key taken from the Crypt Sentinel. Opens the throne room door of the Sunken Crypt." },
  crypt_dust: { name: "Crypt Dust", kind: "mat", icon: "⚱️", rarity: "uncommon", price: 140, stack: 12, desc: "Grave dust that glitters faintly. Alchemists pay well for it." },
  flowerpot: { name: "Flowerpot", kind: "furniture", icon: "🪴", fp: [1, 1], price: 120, model: "pot", garden: true, desc: "Plant a seed, water it and feed it an essence. Grows in real time." },
  herb_seeds: { name: "Herb Seeds", kind: "seed", icon: "🌱", price: 30, stack: 12, grows: { item: "healing_herb", n: [3, 6], bonus: "earth" }, desc: "Grows 3–6 Healing Herbs. Earth Essence adds more." },
  ash_sapling: { name: "Ash Sapling", kind: "seed", icon: "🌳", price: 45, stack: 12, grows: { item: "ash_log", n: [2, 4], bonus: "wind" }, desc: "Grows 2–4 Ash Logs. Wind Essence adds more." },
  wildgrass_seeds: { name: "Wildgrass Seeds", kind: "seed", icon: "🌾", price: 60, stack: 12, grows: { crystal: true, n: [2, 4] }, desc: "Grows 2–4 crystals of whichever element you feed it." },
  moonbloom_seeds: { name: "Moonbloom Seeds", kind: "seed", icon: "🌙", rarity: "rare", price: 0, stack: 12, grows: { item: "ether", n: [2, 3], rare: ["bone_chip", "silk_cloth", "iron_ingot"], bonus: "water" }, desc: "Grows Ethers and sometimes something rarer. Water Essence improves the odds." },
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

for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!Array.isArray(it.jobs) || it.jobs === ALL_J) continue;
  if (it.slot === "main" && ["greataxe", "sword"].includes(it.wtype) && it.jobs.includes("WAR") && !it.jobs.includes("DRK")) it.jobs.push("DRK");
  if (it.slot === "main" && it.wtype === "dagger" && !it.jobs.includes("BRD")) it.jobs.push("BRD");
  if (it.slot !== "main" && it.slot !== "ring" && it.jobs.includes("WAR") && !it.jobs.includes("DRK")) it.jobs.push("DRK");
  if (it.slot !== "main" && it.slot !== "ring" && it.jobs.includes("RDM") && !it.jobs.includes("BRD")) it.jobs.push("BRD");
}

ALL_JOBS.push("SAM", "NIN", "DRG");
Object.assign(ADVANCED_JOBS, { SAM: { quest: "sam", lv: 12 }, NIN: { quest: "nin", lv: 12 }, DRG: { quest: "drg", lv: 12 } });
Object.assign(JOBS, {
  SAM: { name: "Samurai", color: "#e0a060", icon: "🎌", hp: [66, 13], mp: [0, 0], str: [9, 0.95], dex: [9, 0.85], vit: [8, 0.75], agi: [7, 0.7], int: [6, 0.5], mnd: [7, 0.6], advanced: true },
  NIN: { name: "Ninja", color: "#78909c", icon: "🌀", hp: [60, 12], mp: [8, 3], str: [8, 0.8], dex: [9, 0.9], vit: [7, 0.7], agi: [10, 1.0], int: [7, 0.7], mnd: [5, 0.4], advanced: true },
  DRG: { name: "Dragoon", color: "#5c8adb", icon: "🐉", hp: [66, 13], mp: [0, 0], str: [10, 0.95], dex: [8, 0.8], vit: [8, 0.8], agi: [8, 0.75], int: [5, 0.4], mnd: [6, 0.5], advanced: true }
});
COMBAT_SKILLS.push("gkatana", "katana", "polearm");
MAGIC_SKILLS.push("ninjutsu");
Object.assign(SKILL_NAMES, { gkatana: "Great Katana", katana: "Katana", polearm: "Polearm", ninjutsu: "Ninjutsu" });
Object.assign(SKILL_RATINGS, {
  SAM: { gkatana: "A", polearm: "B", sword: "C", archery: "C", dagger: "D", club: "E" },
  NIN: { katana: "A", dagger: "B", sword: "C", archery: "C", h2h: "D", club: "E", ninjutsu: "A" },
  DRG: { polearm: "A", staff: "B", sword: "C", dagger: "D", club: "D" }
});
Object.assign(WEAPON_SKILLS, {
  rising_edge: { name: "Rising Edge", wtype: "gkatana", skill: 5, props: ["Transfixion", "Scission"], ftp: [1.6, 2.2, 2.8] },
  crescent_cut: { name: "Crescent Cut", wtype: "gkatana", skill: 22, props: ["Scission", "Detonation"], ftp: [1.9, 2.7, 3.5] },
  ember_arc: { name: "Ember Arc", wtype: "gkatana", skill: 40, props: ["Liquefaction", "Impaction"], ftp: [2.2, 3.0, 3.9] },
  heavens_divide: { name: "Heaven's Divide", wtype: "gkatana", skill: 75, props: ["Fragmentation", "Scission"], ftp: [2.7, 3.6, 4.6] },
  silent_cut: { name: "Silent Cut", wtype: "katana", skill: 5, props: ["Scission"], ftp: [1.5, 2.0, 2.6] },
  veil_strike: { name: "Veil Strike", wtype: "katana", skill: 22, props: ["Induration", "Detonation"], ftp: [1.8, 2.5, 3.2] },
  mist_fang: { name: "Mist Fang", wtype: "katana", skill: 40, props: ["Reverberation", "Scission"], ftp: [2.1, 2.9, 3.7] },
  night_lotus: { name: "Night Lotus", wtype: "katana", skill: 75, props: ["Gravitation", "Fragmentation"], ftp: [2.5, 3.3, 4.3] },
  piercing_thrust: { name: "Piercing Thrust", wtype: "polearm", skill: 5, props: ["Transfixion"], ftp: [1.6, 2.2, 2.8] },
  wind_lance: { name: "Wind Lance", wtype: "polearm", skill: 22, props: ["Detonation"], ftp: [1.9, 2.6, 3.4] },
  drake_dive: { name: "Drake Dive", wtype: "polearm", skill: 40, props: ["Impaction", "Transfixion"], ftp: [2.2, 3.0, 3.9] },
  sky_rend: { name: "Sky Rend", wtype: "polearm", skill: 75, props: ["Fusion", "Transfixion"], ftp: [2.6, 3.5, 4.5] }
});
Object.assign(ABILITIES, {
  meditate: { name: "Meditate", job: "SAM", lv: 1, recast: 150, target: "self", desc: "Clear your mind and gain 400 TP." },
  hasso: { name: "Hasso", job: "SAM", lv: 5, recast: 60, target: "self", buff: "hasso", dur: 120, desc: "A high two-handed stance: damage +12% and accuracy +10 for 2 minutes." },
  third_eye: { name: "Third Eye", job: "SAM", lv: 15, recast: 45, target: "self", buff: "third_eye", dur: 30, desc: "Read your foe: the next melee attack against you within 30 s misses." },
  smoke_step: { name: "Smoke Step", job: "NIN", lv: 5, recast: 120, target: "self", desc: "Vanish in a puff of smoke, halving the enmity every monster has toward you." },
  twin_strike: { name: "Twin Strike", job: "NIN", lv: 15, recast: 90, target: "self", buff: "twin_strike", dur: 30, desc: "Your next three attacks each strike twice." },
  jump: { name: "Jump", job: "DRG", lv: 1, recast: 60, target: "enemy", enmity: 80, desc: "Leap into the air and drive your weapon down for heavy damage and extra TP." },
  high_jump: { name: "High Jump", job: "DRG", lv: 10, recast: 120, target: "enemy", enmity: 0, desc: "A higher leap: even more damage, and the target forgets half its anger toward you." },
  dragon_spirit: { name: "Dragon Spirit", job: "DRG", lv: 15, recast: 300, target: "self", buff: "dragon_spirit", dur: 60, desc: "Call on the spirit of the wyrm: damage +15% for 60 s." }
});
Object.assign(SPELLS, {
  shadow_veil: { name: "Shadow Veil", jobs: { NIN: 3 }, mp: 8, cast: 1.0, recast: 20, kind: "buff", buff: "shadows", n: 2, dur: 300, skill: "ninjutsu", target: "self", desc: "Creates two shadow images (three from level 12) that each soak up one melee hit." },
  flame_shuriken: { name: "Flame Shuriken", jobs: { NIN: 2 }, mp: 6, cast: 1.0, recast: 12, kind: "nuke", element: "fire", power: 18, stat: "int", skill: "ninjutsu", target: "enemy", desc: "Hurls a burning star. Fire damage." },
  frost_shuriken: { name: "Frost Shuriken", jobs: { NIN: 6 }, mp: 7, cast: 1.0, recast: 12, kind: "nuke", element: "ice", power: 22, stat: "int", skill: "ninjutsu", target: "enemy", desc: "Hurls a star of ice. Ice damage." },
  binding_thread: { name: "Binding Thread", jobs: { NIN: 8 }, mp: 8, cast: 1.2, recast: 30, kind: "debuff", element: "ice", buff: "bind", dur: 10, enmity: 60, skill: "ninjutsu", target: "enemy", desc: "Snares the target so it can't move for 10 s." },
  gale_shuriken: { name: "Gale Shuriken", jobs: { NIN: 10 }, mp: 9, cast: 1.0, recast: 12, kind: "nuke", element: "wind", power: 28, stat: "int", skill: "ninjutsu", target: "enemy", desc: "Hurls a whirling star of wind. Wind damage." }
});
Object.assign(BUFF_NAMES, { hasso: "Hasso", third_eye: "Third Eye", twin_strike: "Twin Strike", dragon_spirit: "Dragon Spirit", shadows: "Shadow Veil", bind: "Bound" });
Object.assign(BUFF_ICONS, { hasso: "🎌", third_eye: "👁️", twin_strike: "⚔️", dragon_spirit: "🐉", shadows: "👥" });
Object.assign(ITEMS, {
});
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!it.jobs || it.slot === "main") continue;
  if (it.jobs.includes("WAR")) { if (!it.jobs.includes("SAM")) it.jobs.push("SAM"); if (!it.jobs.includes("DRG")) it.jobs.push("DRG"); }
  if (it.jobs.includes("THF") && !it.jobs.includes("NIN")) it.jobs.push("NIN");
}
ALL_JOBS.push("BST", "BLU", "COR");
Object.assign(ADVANCED_JOBS, { BST: { quest: "bst", lv: 14 }, BLU: { quest: "blu", lv: 14 }, COR: { quest: "cor", lv: 14 } });
Object.assign(JOBS, {
  BST: { name: "Beastmaster", color: "#8d6e63", icon: "🐾", hp: [62, 12], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [8, 0.8], agi: [7, 0.7], int: [6, 0.5], mnd: [7, 0.7], advanced: true },
  BLU: { name: "Blue Mage", color: "#42a5f5", icon: "🔷", hp: [58, 11], mp: [18, 5], str: [8, 0.8], dex: [8, 0.8], vit: [7, 0.7], agi: [7, 0.7], int: [8, 0.8], mnd: [7, 0.6], advanced: true },
  COR: { name: "Corsair", color: "#c62828", icon: "🎲", hp: [58, 11], mp: [6, 2], str: [8, 0.8], dex: [9, 0.9], vit: [7, 0.7], agi: [9, 0.9], int: [7, 0.7], mnd: [6, 0.5], advanced: true }
});
COMBAT_SKILLS.push("axe");
MAGIC_SKILLS.push("blue");
Object.assign(SKILL_NAMES, { axe: "Axe", blue: "Blue Magic" });
Object.assign(SKILL_RATINGS, {
  BST: { axe: "A", scythe: "B", sword: "C", dagger: "C", club: "D" },
  BLU: { sword: "A", club: "B", dagger: "D", blue: "A" },
  COR: { dagger: "A", sword: "B", archery: "C", h2h: "E" }
});
Object.assign(WEAPON_SKILLS, {
  cleaving_chop: { name: "Cleaving Chop", wtype: "axe", skill: 5, props: ["Detonation", "Impaction"], ftp: [1.5, 2.1, 2.7] },
  wild_hack: { name: "Wild Hack", wtype: "axe", skill: 22, props: ["Scission"], ftp: [1.8, 2.5, 3.3] },
  feral_rend: { name: "Feral Rend", wtype: "axe", skill: 40, props: ["Induration", "Scission"], ftp: [2.1, 2.9, 3.7] },
  primal_fury: { name: "Primal Fury", wtype: "axe", skill: 75, props: ["Fusion", "Fragmentation"], ftp: [2.5, 3.3, 4.3] }
});
Object.assign(ABILITIES, {
  call_beast: { name: "Call Beast", job: "BST", lv: 1, recast: 60, target: "self", desc: "Whistle up a loyal beast to fight at your side: a scaleback lizard, a pincher crab from level 8, or a great ram from level 14." },
  reward: { name: "Reward", job: "BST", lv: 5, recast: 60, target: "self", desc: "Feed your beast a treat, restoring 40% of its HP." },
  feral_howl: { name: "Feral Howl", job: "BST", lv: 15, recast: 90, target: "enemy", enmity: 100, desc: "A savage howl that cows the target: its attack drops 15% for 30 s." },
  burst_affinity: { name: "Burst Affinity", job: "BLU", lv: 5, recast: 90, target: "self", buff: "burst_affinity", dur: 30, desc: "Your next blue magic spell hits 50% harder." },
  phantom_roll: { name: "Valor Roll", job: "COR", lv: 1, recast: 60, target: "self", desc: "Roll a die for the whole party: attack rises by an amount set by the roll (5 is lucky) for 3 minutes." },
  quick_shot: { name: "Quick Shot", job: "COR", lv: 5, recast: 45, target: "enemy", enmity: 60, desc: "A fast pistol shot for moderate damage." },
  hawk_roll: { name: "Hawk Roll", job: "COR", lv: 8, recast: 60, target: "self", desc: "Roll a die for the party: accuracy rises by an amount set by the roll (4 is lucky) for 3 minutes." },
  double_down: { name: "Double Down", job: "COR", lv: 10, recast: 30, target: "self", desc: "Roll again and add it to your last roll. Go over 7 and you bust: the roll's effect is lost." }
});
const BLUE_LEARN = {};
for (const [id, name, lv, def] of [
  ["blu_hind_kick", "Hind Kick", 1, { kind: "bluephys", mul: 1.6, mp: 6 }],
  ["blu_sticky_thread", "Sticky Thread", 2, { kind: "debuff", element: "earth", buff: "slow", dur: 45, enmity: 60, mp: 8 }],
  ["blu_dream_dust", "Dream Dust", 4, { kind: "debuff", element: "light", buff: "sleep", dur: 30, enmity: 40, mp: 10 }],
  ["blu_snapjaw", "Snapjaw", 5, { kind: "bluephys", mul: 1.9, mp: 9 }],
  ["blu_big_pinch", "Big Pinch", 6, { kind: "bluephys", mul: 1.8, mp: 10 }],
  ["blu_tail_whip", "Tail Whip", 8, { kind: "bluephys", mul: 1.7, mp: 11 }],
  ["blu_blood_drain", "Blood Drain", 10, { kind: "drain", element: "dark", power: 18, mp: 12 }],
  ["blu_water_lance", "Water Lance", 13, { kind: "nuke", element: "water", power: 40, stat: "int", mp: 14 }],
  ["blu_battle_roar", "Battle Roar", 14, { kind: "bluephys", mul: 2.0, mp: 16 }],
  ["blu_boulder_toss", "Boulder Toss", 16, { kind: "bluephys", mul: 2.1, mp: 18 }]
]) {
  SPELLS[id] = Object.assign({ name, jobs: { BLU: lv }, cast: 1.5, recast: 12, target: def.kind === "debuff" || def.kind === "nuke" || def.kind === "drain" || def.kind === "bluephys" ? "enemy" : "self", skill: "blue", blue: true, desc: "Blue magic learned from monsters that use " + name + "." + (def.kind === "bluephys" ? " A physical blow." : "") }, def);
  BLUE_LEARN[name] = id;
}
const BEASTS = [{ lv: 1, fam: "hill_lizard", name: "Scaleback" }, { lv: 8, fam: "pond_crab", name: "Pincher" }, { lv: 14, fam: "mountain_ram", name: "Great Ram" }];
Object.assign(BUFF_NAMES, { weaken: "Cowed", burst_affinity: "Burst Affinity", valor_roll: "Valor Roll", hawk_roll: "Hawk Roll" });
Object.assign(BUFF_ICONS, { weaken: "😨", burst_affinity: "🔷", valor_roll: "🎲", hawk_roll: "🦅" });
Object.assign(ITEMS, {
});
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!it.jobs) continue;
  if (it.slot === "main") {
    if ((it.wtype === "dagger" || it.wtype === "sword") && !it.jobs.includes("COR")) it.jobs.push("COR");
    if ((it.wtype === "sword" || it.wtype === "club") && !it.jobs.includes("BLU")) it.jobs.push("BLU");
    continue;
  }
  if (it.jobs.includes("WAR") && !it.jobs.includes("BST")) it.jobs.push("BST");
  if (it.jobs.includes("RDM") && !it.jobs.includes("BLU")) it.jobs.push("BLU");
  if (it.jobs.includes("THF") && !it.jobs.includes("COR")) it.jobs.push("COR");
}
ALL_JOBS.push("PUP", "DNC", "SCH");
Object.assign(ADVANCED_JOBS, { PUP: { quest: "pup", lv: 16 }, DNC: { quest: "dnc", lv: 16 }, SCH: { quest: "sch", lv: 16 } });
Object.assign(JOBS, {
  PUP: { name: "Puppetmaster", color: "#ab47bc", icon: "🎭", hp: [60, 12], mp: [0, 0], str: [8, 0.8], dex: [9, 0.9], vit: [8, 0.8], agi: [8, 0.8], int: [7, 0.7], mnd: [6, 0.6], advanced: true },
  DNC: { name: "Dancer", color: "#f06292", icon: "💃", hp: [58, 11], mp: [0, 0], str: [8, 0.8], dex: [9, 0.9], vit: [7, 0.7], agi: [10, 1.0], int: [6, 0.5], mnd: [8, 0.7], advanced: true },
  SCH: { name: "Scholar", color: "#bcaaa4", icon: "📖", hp: [48, 9], mp: [24, 7], str: [6, 0.5], dex: [7, 0.6], vit: [6, 0.6], agi: [7, 0.6], int: [9, 0.9], mnd: [9, 0.9], advanced: true }
});
Object.assign(SKILL_RATINGS, {
  PUP: { h2h: "A", club: "C", dagger: "D" },
  DNC: { dagger: "A", sword: "D", h2h: "D" },
  SCH: { staff: "C", club: "C", dagger: "D", healing: "C", enhancing: "C", elemental: "B", enfeebling: "D", dark: "D", divine: "D" }
});
Object.assign(ABILITIES, {
  activate: { name: "Activate", job: "PUP", lv: 1, recast: 60, target: "self", desc: "Wind up your automaton and set it fighting. It stays out until it breaks or you change job." },
  repair: { name: "Repair", job: "PUP", lv: 5, recast: 90, target: "self", desc: "Patch up your automaton, restoring half its HP." },
  tune_up: { name: "Tune Up", job: "PUP", lv: 15, recast: 120, target: "self", desc: "Tighten every spring: your automaton's attack rises 20% for 60 s." },
  healing_waltz: { name: "Healing Waltz", job: "DNC", lv: 1, recast: 12, tp: 200, target: "self", desc: "Spend 200 TP to dance a waltz that heals the most hurt party member nearby." },
  quick_step: { name: "Quick Step", job: "DNC", lv: 5, recast: 10, tp: 100, target: "enemy", enmity: 40, desc: "Spend 100 TP on a step that throws the target off balance: everyone's accuracy against it rises 5 per step (up to 5)." },
  rising_flourish: { name: "Rising Flourish", job: "DNC", lv: 10, recast: 20, target: "enemy", enmity: 80, desc: "Spend all the steps on the target in one rising strike that deals more damage per step." },
  group_waltz: { name: "Group Waltz", job: "DNC", lv: 15, recast: 60, tp: 400, target: "self", desc: "Spend 400 TP to heal everyone in the party nearby." },
  light_arts: { name: "Light Arts", job: "SCH", lv: 1, recast: 30, target: "self", desc: "Study white magic: healing, divine and enhancing spells cast 20% faster and cost 10% less MP. Replaces Dark Arts." },
  dark_arts: { name: "Dark Arts", job: "SCH", lv: 1, recast: 30, target: "self", desc: "Study black magic: elemental, enfeebling and dark spells cast 20% faster and cost 10% less MP. Replaces Light Arts." },
  penury: { name: "Penury", job: "SCH", lv: 10, recast: 60, target: "self", buff: "penury", dur: 60, desc: "Your next white magic spell costs no MP." },
  ebullience: { name: "Ebullience", job: "SCH", lv: 15, recast: 90, target: "self", buff: "ebullience", dur: 60, desc: "Your next elemental spell deals 30% more damage." }
});
for (const id in SPELLS) {
  const sp = SPELLS[id];
  if (sp.blue || sp.kind === "song" || sp.kind === "summon" || sp.jobs.SCH) continue;
  const base = Math.min(sp.jobs.WHM || 99, sp.jobs.BLM || 99);
  if (base < 99 && base <= 18) sp.jobs.SCH = Math.min(20, base + 2);
}
const AUTOMATON_LOOK = { skin: 0xc8a070, skinRegion: "wood", noFace: true, eyesGlow: 0x80deea, ears: "none", top: { type: "tunic", color: 0x7a4a8a, region: "cloth" }, legs: 0x5a3a6a, boots: 0x4a3020, gloves: 0x8a6a3a, glovesRegion: "wood", head: { type: "cap", color: 0x6a4a7a }, prop: { girth: 0.9 } };
Object.assign(BUFF_NAMES, { light_arts: "Light Arts", dark_arts: "Dark Arts", penury: "Penury", ebullience: "Ebullience", stepped: "Off Balance" });
Object.assign(BUFF_ICONS, { light_arts: "📖", dark_arts: "📕", penury: "🪶", ebullience: "✒️", stepped: "💃" });
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!it.jobs) continue;
  if (it.slot === "main") {
    if (it.wtype === "h2h" && !it.jobs.includes("PUP")) it.jobs.push("PUP");
    if (it.wtype === "dagger" && !it.jobs.includes("DNC")) it.jobs.push("DNC");
    if ((it.wtype === "staff" || it.wtype === "club") && !it.jobs.includes("SCH")) it.jobs.push("SCH");
    continue;
  }
  if (it.jobs.includes("MNK") && !it.jobs.includes("PUP")) it.jobs.push("PUP");
  if (it.jobs.includes("THF") && !it.jobs.includes("DNC")) it.jobs.push("DNC");
  if ((it.jobs.includes("BLM") || it.jobs.includes("WHM")) && !it.jobs.includes("SCH")) it.jobs.push("SCH");
}
ALL_JOBS.push("GEO", "RUN");
Object.assign(ADVANCED_JOBS, { GEO: { quest: "geo", lv: 18 }, RUN: { quest: "run", lv: 18 } });
Object.assign(JOBS, {
  GEO: { name: "Geomancer", color: "#66bb6a", icon: "🔔", hp: [50, 10], mp: [24, 7], str: [6, 0.5], dex: [7, 0.6], vit: [7, 0.6], agi: [7, 0.6], int: [9, 0.9], mnd: [9, 0.9], advanced: true },
  RUN: { name: "Rune Fencer", color: "#ef5350", icon: "🔺", hp: [70, 14], mp: [10, 3], str: [9, 0.9], dex: [8, 0.8], vit: [9, 0.9], agi: [8, 0.8], int: [7, 0.6], mnd: [7, 0.6], advanced: true }
});
COMBAT_SKILLS.push("gsword");
MAGIC_SKILLS.push("geomancy");
Object.assign(SKILL_NAMES, { gsword: "Great Sword", geomancy: "Geomancy" });
Object.assign(SKILL_RATINGS, {
  GEO: { club: "B", staff: "C", dagger: "D", geomancy: "A", elemental: "C", healing: "D" },
  RUN: { gsword: "A", sword: "B", greataxe: "B", club: "D", enhancing: "C", divine: "D" }
});
Object.assign(WEAPON_SKILLS, {
  rune_cleave: { name: "Rune Cleave", wtype: "gsword", skill: 5, props: ["Scission"], ftp: [1.6, 2.2, 2.9] },
  glyph_rend: { name: "Glyph Rend", wtype: "gsword", skill: 22, props: ["Liquefaction", "Impaction"], ftp: [1.9, 2.7, 3.5] },
  ward_breaker: { name: "Ward Breaker", wtype: "gsword", skill: 40, props: ["Reverberation", "Scission"], ftp: [2.2, 3.0, 3.9] },
  final_verse: { name: "Final Verse", wtype: "gsword", skill: 75, props: ["Fragmentation", "Distortion"], ftp: [2.7, 3.6, 4.6] }
});
const GEO_AURAS = {
  indi_vigor: { name: "Aura of Vigor", lv: 1, mp: 14, self: true, buff: "geo_vigor", col: 0x9ccc65, desc: "An aura around you: party members within reach recover HP every 3 s." },
  geo_torpor: { name: "Ward of Torpor", lv: 3, mp: 16, self: false, buff: "slow", col: 0x8d6e63, desc: "Plants a luopan by the target: monsters near it are slowed." },
  indi_fury: { name: "Aura of Fury", lv: 5, mp: 18, self: true, buff: "geo_fury", col: 0xef5350, desc: "An aura around you: party attack +10% within reach." },
  geo_frailty: { name: "Ward of Frailty", lv: 8, mp: 20, self: false, buff: "geo_frail", col: 0x7e57c2, desc: "Plants a luopan by the target: monsters near it take 12% more damage." },
  indi_focus: { name: "Aura of Focus", lv: 11, mp: 22, self: true, buff: "geo_focus", col: 0x42a5f5, desc: "An aura around you: party spells deal 12% more damage within reach." },
  geo_languor: { name: "Ward of Languor", lv: 15, mp: 26, self: false, buff: "weaken", col: 0xbdbdbd, desc: "Plants a luopan by the target: monsters near it deal 15% less damage." }
};
for (const id in GEO_AURAS) { const g = GEO_AURAS[id]; SPELLS[id] = { name: g.name, jobs: { GEO: g.lv }, mp: g.mp, cast: 2.0, recast: 20, kind: "geo", skill: "geomancy", target: g.self ? "self" : "enemy", desc: g.desc + " Lasts 3 minutes. One aura and one luopan at a time." }; }
Object.assign(ABILITIES, {
  full_circle: { name: "Full Circle", job: "GEO", lv: 5, recast: 30, target: "self", desc: "Dismiss your luopan and recover half the MP it cost." },
  mending_halation: { name: "Mending Halation", job: "GEO", lv: 15, recast: 180, target: "self", desc: "Shatter your luopan to heal everyone near you for 20% of their HP." },
  kindle_rune: { name: "Kindle Rune", job: "RUN", lv: 1, recast: 5, target: "self", desc: "Carve a fire rune (up to 3 runes). Each rune cuts damage you take by 5%." },
  rime_rune: { name: "Rime Rune", job: "RUN", lv: 3, recast: 5, target: "self", desc: "Carve an ice rune (up to 3 runes). Each rune cuts damage you take by 5%." },
  gale_rune: { name: "Gale Rune", job: "RUN", lv: 5, recast: 5, target: "self", desc: "Carve a wind rune (up to 3 runes). Each rune cuts damage you take by 5%." },
  stone_rune: { name: "Stone Rune", job: "RUN", lv: 7, recast: 5, target: "self", desc: "Carve an earth rune (up to 3 runes). Each rune cuts damage you take by 5%." },
  lunge: { name: "Lunge", job: "RUN", lv: 10, recast: 45, target: "enemy", enmity: 200, desc: "Release every rune you hold as a burst of elemental damage." },
  vallation: { name: "Vallation", job: "RUN", lv: 15, recast: 120, target: "self", buff: "vallation", dur: 30, desc: "Brace behind your runes: damage taken −20% for 30 s, and every blow you land draws more attention." }
});
Object.assign(BUFF_NAMES, { geo_vigor: "Aura of Vigor", geo_fury: "Aura of Fury", geo_focus: "Aura of Focus", geo_frail: "Frailty", vallation: "Vallation", runes: "Runes" });
Object.assign(BUFF_ICONS, { geo_vigor: "🌿", geo_fury: "🔥", geo_focus: "🔷", geo_frail: "💔", vallation: "🛡️", runes: "🔺" });
Object.assign(ITEMS, {
});
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!it.jobs) continue;
  if (it.slot === "main") { if (it.wtype === "club" && !it.jobs.includes("GEO")) it.jobs.push("GEO"); continue; }
  if ((it.jobs.includes("WHM") || it.jobs.includes("BLM")) && !it.jobs.includes("GEO")) it.jobs.push("GEO");
  if ((it.jobs.includes("PLD") || it.jobs.includes("WAR")) && !it.jobs.includes("RUN")) it.jobs.push("RUN");
}
const RACE_GEAR_ALIAS = {
  hume_tunic: "human_tunic", hume_vest: "human_vest", elvaan_jerkin: "elari_jerkins", elvaan_bodice: "elari_bodice", galkan_surcoat: "ursan_surcoat", mithran_separates: "nekari_separates", tarutaru_kaftan: "pipkin_kaftan",
  elv_m_chausses: "elari_chausses", elvaan_f_chausses: "elari_chausses", galkan_braguette: "ursan_braguette", ursan_baguette: "ursan_braguette", hume_pants: "human_pants", hume_slacks: "human_pants", mithran_loincloth: "nekari_loincloth", tarutaru_braccae: "pipkin_braccae"
};
for (const id in RACE_GEAR_ALIAS) delete GEAR_DATA[id];
const GEAR_RENAME = { windurstian_slops: ["city_slops", "City Slops"], san_dorian_vest: ["city_vest", "City Vest"], san_dorian_tunic: ["city_tunic", "City Tunic"], bastokan_harness: ["city_harness", "City Harness"],
  san_dorian_sword: ["city_sword", "City Sword"], san_dorian_bow: ["city_bow", "City Bow"], windurstian_bow: ["city_bow_2", "City Bow II"], bas_crossbow: ["city_crossbow", "City Crossbow"], san_dorian_cesti: ["city_cesti", "City Cesti"],
  bastokan_axe: ["city_axe", "City Axe"], bas_knuckles: ["city_knuckles", "City Knuckles"], windurstian_staff: ["city_staff_2", "City Staff II"], bastokan_scythe: ["city_scythe", "City Scythe"], windurstian_club: ["city_club", "City Club"], bastokan_staff: ["city_staff", "City Staff"] };
const GEAR_RENAME_ALIAS = {};
for (const old in GEAR_RENAME) for (const sfx of ["", "_hq"]) {
  if (!GEAR_DATA[old + sfx]) continue;
  const nid = GEAR_RENAME[old][0] + sfx;
  GEAR_DATA[nid] = Object.assign({}, GEAR_DATA[old + sfx], { name: GEAR_RENAME[old][1] + (sfx ? " +1" : "") });
  delete GEAR_DATA[old + sfx];
  GEAR_RENAME_ALIAS[old + sfx] = nid;
}
Object.assign(RACE_GEAR_ALIAS, GEAR_RENAME_ALIAS);
const RACE_GEAR_ROWS = [
  ["human_tunic", "Human Tunic", "human", "🧥", "body"], ["human_vest", "Human Vest", "human", "🧥", "body"], ["human_pants", "Human Pants", "human", "👖", "legs"],
  ["elari_bodice", "Elari Bodice", "elari", "👘", "body"], ["elari_jerkins", "Elari Jerkins", "elari", "🧥", "body"], ["elari_chausses", "Elari Chausses", "elari", "👖", "legs"],
  ["ursan_tunic", "Ursan Tunic", "ursan", "🧥", "body"], ["ursan_surcoat", "Ursan Surcoat", "ursan", "🧥", "body"], ["ursan_braguette", "Ursan Braguette", "ursan", "👖", "legs"],
  ["nekari_tunic", "Nekari Tunic", "nekari", "👘", "body"], ["nekari_separates", "Nekari Separates", "nekari", "👘", "body"], ["nekari_loincloth", "Nekari Loincloth", "nekari", "👖", "legs"],
  ["pipkin_tunic", "Pipkin Tunic", "pipkin", "👘", "body"], ["pipkin_kaftan", "Pipkin Kaftan", "pipkin", "👘", "body"], ["pipkin_braccae", "Pipkin Braccae", "pipkin", "👖", "legs"]
];
for (const [id, name, race, icon, slot] of RACE_GEAR_ROWS) GEAR_DATA[id] = { name, kind: "equip", icon, slot, jobs: "ALL", lv: 1, price: slot === "legs" ? 56 : 70, stats: { def: 2 }, src: "race", race };
const TURNIP_ROWS = [
  ["turnip_sword", "Turnip Sword", "🗡️", "sword", 5, 2.28, ["WAR", "RDM", "THF", "PLD", "DRK", "BST", "BRD", "RNG", "NIN", "DRG", "BLU", "COR", "RUN"]],
  ["turnip_knife", "Turnip Knife", "🔪", "dagger", 4, 2.05, ["WAR", "THF", "PLD", "DRK", "BRD", "RNG", "SAM", "NIN", "DRG", "COR", "PUP", "DNC"]],
  ["turnip_rod", "Turnip Rod", "🏏", "club", 3, 2.88, ["WHM", "BLM", "SMN", "SCH", "GEO"]],
  ["turnip_staff", "Turnip Staff", "🦯", "staff", 4, 3.66, ["WAR", "MNK", "WHM", "BLM", "RDM", "BST", "BRD", "SMN", "SCH", "GEO"]]
];
for (const [id, name, icon, wtype, dmg, delay, jobs] of TURNIP_ROWS) GEAR_DATA[id] = { name, kind: "equip", icon, slot: "main", wtype, dmg, delay, jobs, lv: 1, price: 10, src: "race", starter: true };
const STARTER_WEAPON = { WAR: "turnip_sword", THF: "turnip_knife", WHM: "turnip_rod", BLM: "turnip_staff" };
function starterWeapon(job) { return STARTER_WEAPON[job] || "bronze_sword"; }
const RACE_START_BODY = {
  human: { war: "human_vest", mage: "human_tunic" }, elari: { war: "elari_jerkins", mage: "elari_bodice" },
  ursan: { war: "ursan_surcoat", mage: "ursan_tunic" }, nekari: { war: "nekari_separates", mage: "nekari_tunic" },
  pipkin: { war: "pipkin_kaftan", mage: "pipkin_tunic" }
};
const RACE_START_LEGS = { human: "human_pants", elari: "elari_chausses", ursan: "ursan_braguette", nekari: "nekari_loincloth", pipkin: "pipkin_braccae" };
const RACE_MAGE_JOBS = { WHM: 1, BLM: 1, RDM: 1, SMN: 1, SCH: 1, GEO: 1 };
function starterBody(race, job) { const r = RACE_START_BODY[race] || RACE_START_BODY.human; return RACE_MAGE_JOBS[job] ? r.mage : r.war; }
function starterLegs(race) { return RACE_START_LEGS[race] || RACE_START_LEGS.human; }
const RACE_GEAR_OLD_RE = new RegExp('"(' + Object.keys(RACE_GEAR_ALIAS).join("|") + ')"', "g");
function migrateRaceGearIds(d) {
  const txt = JSON.stringify(d);
  RACE_GEAR_OLD_RE.lastIndex = 0;
  if (!RACE_GEAR_OLD_RE.test(txt)) return d;
  RACE_GEAR_OLD_RE.lastIndex = 0;
  return JSON.parse(txt.replace(RACE_GEAR_OLD_RE, (m, k) => '"' + RACE_GEAR_ALIAS[k] + '"'));
}
for (const id in GEAR_DATA) { const g = GEAR_DATA[id]; ITEMS[id] = Object.assign({}, g, { jobs: g.jobs === "ALL" ? ALL_J : g.jobs.slice() }); }
const GEAR_DROP_IDS = Object.keys(GEAR_DATA).filter(id => GEAR_DATA[id].src === "drop");
const SHOP = ["potion", "ether", "pickaxe", "hatchet", "sickle", "fire_crystal", "wind_crystal", "earth_crystal", "water_crystal", "copper_ore", "ash_log", "healing_herb", "fishing_rod", "bait", "grain_flour", "rock_salt"];
const FURNITURE_SHOP = ["wooden_chair", "potted_plant", "flowerpot", "floor_lamp", "round_rug", "wooden_table", "simple_bed", "storage_chest", "bookshelf", "wardrobe", "hearth"];
const SEED_SHOP = ["herb_seeds", "ash_sapling", "wildgrass_seeds"];
const GARDEN_STAGE_MS = 10 * 60 * 1000;
const GATHER_RESPAWN_MS = 45 * 1000;

const CRAFTS = {
  smithing: { name: "Smithing", crystal: "fire_crystal", icon: "⚒️" },
  woodworking: { name: "Woodworking", crystal: "wind_crystal", icon: "🪚" },
  clothcraft: { name: "Clothcraft", crystal: "earth_crystal", icon: "🧶" },
  alchemy: { name: "Alchemy", crystal: "water_crystal", icon: "⚗️" },
  cooking: { name: "Cooking", crystal: "fire_crystal", icon: "🍳" }
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
  { id: "r_leather_boots", craft: "clothcraft", lv: 4, mats: { bat_wing: 2, silk_cloth: 1 }, out: "ash_clogs" },
  { id: "r_round_rug", craft: "clothcraft", lv: 5, mats: { silk_cloth: 3 }, out: "round_rug" },
  { id: "r_cotton_robe", craft: "clothcraft", lv: 8, mats: { silk_cloth: 4, bone_chip: 1 }, out: "robe" },
  { id: "r_potion", craft: "alchemy", lv: 0, mats: { healing_herb: 2 }, out: "potion", qty: 2, hq: "potion_hq" },
  { id: "r_potted_plant", craft: "alchemy", lv: 2, mats: { healing_herb: 3 }, out: "potted_plant" },
  { id: "r_ether", craft: "alchemy", lv: 3, mats: { healing_herb: 1, bat_wing: 1 }, out: "ether", hq: "ether_hq" },
  { id: "r_hi_potion", craft: "alchemy", lv: 6, mats: { potion: 2, bone_chip: 1 }, out: "hi_potion" },
  { id: "r_x_potion", craft: "alchemy", lv: 8, mats: { hi_potion: 2, bone_chip: 1 }, out: "x_potion", hq: "x_potion_hq" },
  { id: "r_hi_ether", craft: "alchemy", lv: 10, mats: { ether: 2, bone_chip: 1 }, out: "hi_ether", hq: "hi_ether_hq" },
  { id: "r_super_ether", craft: "alchemy", lv: 13, mats: { hi_ether: 2, bone_chip: 2 }, out: "super_ether", hq: "super_ether_hq" },
  { id: "r_chapel_sigil", craft: "alchemy", lv: 12, mats: { bone_chip: 4, reef_scale: 2 }, out: "chapel_sigil" },
  { id: "r_reraiser", craft: "alchemy", lv: 15, mats: { ether: 1, bone_chip: 3, silk_cloth: 1 }, out: "reraiser" },
  { id: "r_hi_reraiser", craft: "alchemy", lv: 18, mats: { reraiser: 2, bone_chip: 2 }, out: "hi_reraiser" },
  { id: "r_super_reraiser", craft: "alchemy", lv: 22, mats: { hi_reraiser: 2, bone_chip: 3 }, out: "super_reraiser" },
  { id: "r_grilled_minnow", craft: "cooking", lv: 0, mats: { pond_minnow: 1, rock_salt: 1 }, out: "grilled_minnow", qty: 2 },
  { id: "r_herb_bread", craft: "cooking", lv: 2, mats: { grain_flour: 2, healing_herb: 1 }, out: "herb_bread", qty: 2 },
  { id: "r_carp_stew", craft: "cooking", lv: 4, mats: { moat_carp: 1, healing_herb: 1, rock_salt: 1 }, out: "carp_stew", qty: 2 },
  { id: "r_shad_skewer", craft: "cooking", lv: 7, mats: { silver_shad: 2, rock_salt: 1 }, out: "shad_skewer", qty: 2 },
  { id: "r_eel_pie", craft: "cooking", lv: 10, mats: { mud_eel: 1, grain_flour: 2 }, out: "eel_pie", qty: 2 },
  { id: "r_perch_chowder", craft: "cooking", lv: 13, mats: { bog_perch: 1, grain_flour: 1, healing_herb: 1 }, out: "perch_chowder", qty: 2 },
  { id: "r_grilled_bass", craft: "cooking", lv: 12, mats: { sea_bass: 1, rock_salt: 1 }, out: "grilled_bass", qty: 2 },
  { id: "r_pike_feast", craft: "cooking", lv: 16, mats: { lakeking_pike: 1, grain_flour: 2, healing_herb: 2 }, out: "pike_feast", qty: 3 }
];
const GEAR_CRAFT_RULES = [
  [/bone/, "alchemy"],
  [/linen|cotton|robe|cape|cuffs|slops|tunic|doublet|hachimaki|kyahan|sitabaki|kenpogi|tekko|mitts|headband|hat|bandana|leather|lizard|dhalmel|rabbit|cesti|solea|gaiters|gloves|trousers|vest|jerkin|mantle|belt|obi|sash|collar|gorget|subligar|hose|slacks|brais|gi$/, "clothcraft"],
  [/ash|maple|willow|holly|yew|elm|lauan|oak|mahogany|chestnut|bow|crossbow|staff|pole|wand|club|harp|flute|piccolo|boomerang|clogs|lantern/, "woodworking"]
];
for (const id in GEAR_DATA) {
  const g = GEAR_DATA[id], hq = id + "_hq";
  if (g.src !== "shop" || g.slot === "ammo" || !GEAR_DATA[hq] || RECIPES.some(r => r.out === id)) continue;
  const n = g.name.toLowerCase(), big = g.slot === "main" || g.slot === "body" || g.slot === "ranged" ? 1 : 0;
  let craft = "smithing";
  for (const [re, c] of GEAR_CRAFT_RULES) if (re.test(n)) { craft = c; break; }
  const mats = {};
  if (craft === "smithing") { if (g.lv < 7) mats.bronze_ingot = 2 + big; else if (g.lv < 13) { mats.bronze_ingot = 1 + big; mats.iron_ingot = 1; } else mats.iron_ingot = 2 + big; }
  else if (craft === "woodworking") { mats.ash_lumber = 2 + big; if (g.lv >= 10) mats.heartwood = 1; }
  else if (craft === "clothcraft") { mats.silk_cloth = 1 + big; if (/leather|lizard|dhalmel|rabbit|cesti|solea|gaiters|belt|collar|gorget|vest|jerkin|mantle/.test(n)) mats.lizard_skin = 1 + big; else mats.worm_silk = 1 + big; if (g.lv >= 10) mats.wool_tuft = 1; }
  else { mats.bone_chip = 2 + big; if (g.lv >= 10) mats.crab_shell = 1; }
  RECIPES.push({ id: "g_" + id, craft, lv: Math.min(CONFIG.craftCap, g.lv), mats, out: id, hq });
}

const MERCS = {
  kael: { name: "Kael", job: "WAR", role: "tank", fee: 120, color: "#ef9a9a", desc: "A steady Warrior. Holds enemy attention with Provoke and closes skillchains." },
  rook: { name: "Rook", job: "WAR", role: "dd", fee: 140, color: "#ffab91", desc: "A reckless Warrior. Hits hard with Berserk and opens skillchains for others to close." },
  mira: { name: "Mira", job: "WHM", role: "healer", fee: 150, color: "#f5f5f5", desc: "A calm White Mage. Cures whoever is hurt most and saves Divine Seal for emergencies." },
  fen: { name: "Fen", job: "WHM", role: "support", fee: 150, color: "#e0f2f1", desc: "A cheerful White Mage. Keeps Dia up, Banishes the undead and backs up the healer." },
  sable: { name: "Sable", job: "BLM", role: "nuker", fee: 180, color: "#b39ddb", desc: "A sharp Black Mage. Nukes weaknesses and holds MP to magic-burst your skillchains." },
  dorn: { name: "Dorn", job: "PLD", role: "tank", fee: 260, color: "#90caf9", requires: { job: "PLD" }, desc: "A stalwart Paladin. Flash and Sentinel hold attention, Cures keep him standing, Shield Bash stops TP moves." },
  lisette: { name: "Lisette", job: "RDM", role: "hybrid", fee: 260, color: "#f48fb1", requires: { job: "RDM" }, desc: "A quick Red Mage. Fights in melee, keeps Dia, Slow and Paralyze on the target, nukes when MP allows and backs up the healer." },
  vesper: { name: "Vesper", job: "BLM", role: "burster", fee: 400, color: "#7e57c2", requires: { quest: "chieftain" }, desc: "A Black Mage who lives for the magic burst. Elemental Seal on every one." },
  wren: { name: "Wren", job: "THF", role: "dd", fee: 240, color: "#a1887f", requires: { job: "THF" }, desc: "A quick-fingered Thief. Steals from everything, opens with Sneak Attack and chains dagger skills." },
  corin: { name: "Corin", job: "RNG", role: "dd", fee: 250, color: "#9ccc65", requires: { job: "RNG" }, desc: "A quiet Ranger. Shoots from range, uses Sharpshot and Barrage, and binds runners in place." },
  mordrin: { name: "Mordrin", job: "DRK", role: "dd", fee: 300, color: "#8e6bbf", requires: { job: "DRK" }, desc: "A grim Dark Knight. Swings a scythe with Last Resort and Soulfire, drains life back when he's hurt, and stuns dangerous moves." },
  lyra: { name: "Lyra", job: "BRD", role: "bard", fee: 300, color: "#ffd54f", requires: { job: "BRD" }, desc: "A bright Bard. Keeps two songs on the party, lulls extra monsters to sleep, and fights with a dagger in between." },
  tamsin: { name: "Tamsin", job: "MNK", role: "dd", fee: 260, color: "#ffb74d", requires: { job: "MNK" }, desc: "A cheerful Monk. Boosts, focuses and pummels, and mends herself with Chakra." }
};

const MERC_LINES = {
  hire: ["Ready when you are.", "Lead the way.", "Let's get to work."],
  raise: ["Hold on, I've got you!", "Up you get!", "Don't you dare stay down."],
  gift: ["For me? Thanks!", "This will help.", "I'll put it to good use."],
  ws: ["Opening a skillchain!", "Here it comes!", "Hah!"],
  close: ["Closing it!", "Skillchain!", "Got it!"],
  burst: ["Magic burst!", "Bursting!", "Now!"],
  cure: ["Hang in there!", "Healing you!", "Got you."],
  provoke: ["Over here!", "Eyes on me!"],
  ko: ["Ugh... sorry...", "I'm down!"],
  lowmp: ["Running low on MP.", "I need a moment for MP."],
  victory: ["Nice work.", "That's that.", "Next!"]
};

const MOB_JOB_MODELS = ["goblin", "orc", "fishfolk", "birdfolk", "skeleton", "ghoul"];
const MOB_JOB_WEAPON = { WAR: "greataxe", MNK: "h2h", WHM: "club", BLM: "staff", RDM: "sword", THF: "dagger", PLD: "sword", DRK: "scythe", BST: "axe", BRD: "dagger", RNG: "archery", SMN: "staff", SAM: "gkatana", NIN: "katana", DRG: "polearm", BLU: "sword", COR: "dagger", PUP: "h2h", DNC: "dagger", SCH: "staff", GEO: "club", RUN: "gsword" };
const MOB_JOB_STATS = { WAR: [1.05, 1.1, 1, 0, 1], MNK: [1.05, 1, 0.95, 4, 0.88], WHM: [0.9, 0.85, 0.95, 0, 1], BLM: [0.85, 0.8, 0.85, 0, 1], RDM: [0.95, 0.9, 0.95, 2, 1], THF: [0.95, 1, 0.95, 8, 0.92], PLD: [1.12, 0.95, 1.15, 0, 1], DRK: [1, 1.15, 0.9, 0, 1], BST: [1.05, 1.05, 1, 0, 1], BRD: [0.95, 0.9, 0.95, 0, 1], RNG: [0.95, 1.05, 0.95, 4, 1], SMN: [0.85, 0.8, 0.85, 0, 1], SAM: [1.05, 1.1, 0.95, 2, 1], NIN: [1, 1, 0.95, 8, 0.92], DRG: [1.05, 1.1, 1, 2, 1], BLU: [1, 1, 1, 0, 1], COR: [0.95, 1, 0.95, 4, 1], PUP: [1, 1, 1, 2, 0.92], DNC: [0.95, 1, 0.95, 8, 0.92], SCH: [0.9, 0.85, 0.9, 0, 1], GEO: [0.9, 0.85, 0.95, 0, 1], RUN: [1.1, 1, 1.1, 2, 1] };
const MOB_CASTERS = { WHM: 1, BLM: 1, RDM: 1, SCH: 1, BRD: 1, GEO: 1, SMN: 1 };
const MOB_ABIL_BUFFS = ["berserk", "warcry", "last_resort", "soulfire", "blood_blade", "sentinel", "sneak_attack", "boost", "focus", "hasso", "twin_strike", "dragon_spirit"];
const MOB_ABIL_HEALS = { chakra: 0.25, healing_waltz: 0.15 };
const MOB_HEAL = { cure: 0.25, cure2: 0.35, curaga: 0.3 };
const MOB_DEBUFF = { slow: ["slow", 25, 0.15], paralyze: ["paralyze", 20, 0.2], silence: ["silence", 15], blind: ["flash", 20, 0.3], bind: ["bind", 10], binding_thread: ["bind", 8], blu_sticky_thread: ["slow", 20, 0.15], sleep: ["sleep", 8], foe_lullaby: ["sleep", 8], blu_dream_dust: ["sleep", 6] };
const MOB_BUFF = { protect: "protect", protectra: "protect", blaze_spikes: "blaze_spikes", ice_spikes: "ice_spikes", enthunder: "enthunder", enstone: "enstone", enaero: "enaero", knights_minne: "minne", valor_minuet: "minuet", sword_madrigal: "madrigal", armys_paeon: "paeon", armys_paeon2: "paeon" };
const MOB_RENAMED = { goblin_apprentice: "goblin", den_conjurer: "den_goblin", mire_hexer: "mire_goblin", frost_shaman: "frost_goblin", birdfolk_priest: "birdfolk" };

const FEATURES = { crafting: true, gathering: true, residence: true, nms: true, water: true, mounts: true };

const FAMILIES = {
  goblin: { name: "Goblin", color: "#8a9a5b", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 165 }, link: true, tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.4], ["fire_crystal", 0.3], ["copper_ore", 0.25], ["potion", 0.08]], model: "goblin" },
  honey_bee: { name: "Honey Bee", color: "#f2c230", radius: 10, hpMul: 0.55, attMul: 0.85, defMul: 0.75, eva: 10, delay: 2.2, speed: 135, aggro: null, link: true, linkGroup: "bees", tpMove: { name: "Final Sting", mul: 2.2, status: ["poison", 30] }, weak: { ice: 1.2 }, loot: [["honeycomb", 0.4], ["wind_crystal", 0.2], ["potion", 0.05]], model: "bee", tint: 0xf2c230, tint2: 0x2a2218, scale: 1.15 },
  grass_crawler: { name: "Grass Crawler", color: "#7fb04a", radius: 14, hpMul: 0.9, attMul: 0.8, defMul: 1.1, eva: 2, delay: 3.4, speed: 70, aggro: null, link: false, tpMove: { name: "Sticky Thread", mul: 1.3, slow: true }, weak: { fire: 1.3 }, loot: [["crawler_cocoon", 0.3], ["worm_silk", 0.25], ["earth_crystal", 0.2], ["potion", 0.05]], model: "crawler", tint: 0x7fb04a },
  meadow_sheep: { name: "Meadow Sheep", color: "#e8e2d6", radius: 15, hpMul: 0.9, attMul: 0.8, defMul: 0.9, eva: 2, delay: 3.0, speed: 100, aggro: null, link: true, linkGroup: "sheep", tpMove: { name: "Rampant Butt", mul: 1.7 }, weak: { fire: 1.1 }, loot: [["wool_tuft", 0.45], ["earth_crystal", 0.2], ["healing_herb", 0.15]], model: "sheep", tint: 0xd8cfc0 },
  hill_lizard: { name: "Hill Lizard", color: "#8a9a4a", radius: 14, hpMul: 1.0, attMul: 1.0, defMul: 1.0, eva: 6, delay: 2.9, speed: 110, aggro: null, link: false, tpMove: { name: "Tail Whip", mul: 1.6, aoe: 60 }, weak: { ice: 1.2 }, loot: [["lizard_skin", 0.35], ["fire_crystal", 0.2], ["potion", 0.06]], model: "lizard", tint: 0x8a9a4a, tint2: 0xd8d4a0, scale: 1.3 },
  pond_crab: { name: "Pond Crab", color: "#b86a4a", radius: 14, hpMul: 1.0, attMul: 0.9, defMul: 1.3, eva: 0, delay: 3.2, speed: 80, aggro: null, link: false, tpMove: { name: "Big Pinch", mul: 1.8 }, weak: { lightning: 1.3 }, loot: [["crab_shell", 0.35], ["water_crystal", 0.25], ["potion", 0.05]], model: "crab", tint: 0xb86a4a },
  mandrake: { name: "Mandrake", color: "#d8b46a", radius: 11, hpMul: 0.7, attMul: 0.85, defMul: 0.85, eva: 8, delay: 2.5, speed: 125, aggro: null, link: true, linkGroup: "mandrake", tpMove: { name: "Dream Dust", mul: 1.2, sleepy: true }, weak: { fire: 1.3 }, loot: [["mandrake_leaf", 0.4], ["healing_herb", 0.25], ["earth_crystal", 0.15]], model: "mandrake", tint: 0xd8b46a, tint2: 0x5aa84a },
  shroomling: { name: "Shroomling", color: "#c8b8a0", radius: 13, hpMul: 1.1, attMul: 0.9, defMul: 1.0, eva: 0, delay: 3.3, speed: 60, int: 7, aggro: null, link: false, tpMove: { name: "Spore Cloud", mul: 1.1, aoe: 70, status: ["poison", 30] }, weak: { fire: 1.4 }, loot: [["spore_cap", 0.35], ["water_crystal", 0.2], ["ether", 0.05]], model: "shroom", tint: 0xd8c8b0, tint2: 0xb04a3a },
  lake_snapper: { name: "Lake Snapper", color: "#5a8ab0", radius: 12, hpMul: 0.9, attMul: 1.05, defMul: 0.9, eva: 8, delay: 2.6, speed: 120, aggro: null, link: false, tpMove: { name: "Snapjaw", mul: 1.9 }, weak: { lightning: 1.3 }, loot: [["moat_carp", 0.3], ["water_crystal", 0.25], ["potion", 0.05]], model: "fish", tint: 0x5a8ab0 },
  longneck: { name: "Marsh Longneck", color: "#b09070", radius: 20, hpMul: 1.8, attMul: 1.1, defMul: 1.1, eva: 2, delay: 3.6, speed: 105, aggro: null, link: false, tpMove: { name: "Stomp", mul: 1.9, aoe: 80 }, weak: { lightning: 1.2 }, loot: [["longneck_hide", 0.35], ["earth_crystal", 0.3], ["hi_potion", 0.06]], model: "longneck", tint: 0xb09070 },
  bat: { name: "Cave Bat", color: "#6d5a8a", radius: 11, hpMul: 0.7, attMul: 0.9, defMul: 0.8, eva: 10, delay: 2.4, speed: 125, aggro: null, link: false, tpMove: { name: "Wing Slap", mul: 1.9 }, weak: { ice: 1.25 }, loot: [["egg_batling", 0.004], ["bat_wing", 0.4], ["wind_crystal", 0.3], ["ether", 0.05]], model: "bat" },
  worm: { name: "Tunnel Worm", color: "#b8866a", radius: 14, hpMul: 1.2, attMul: 0.85, defMul: 1.1, delay: 3.4, speed: 55, int: 4, aggro: { magic: 130, sound: 90 }, link: false, tpMove: { name: "Sand Spit", mul: 1.5, aoe: 60, status: ["flash", 20, 0.25] }, weak: { wind: 1.25 }, loot: [["egg_wormlet", 0.004], ["worm_silk", 0.35], ["earth_crystal", 0.3], ["healing_herb", 0.25], ["ether", 0.06]], model: "worm" },
  ghoul: { name: "Ghoul", color: "#9fbfa0", radius: 15, hpMul: 1.1, attMul: 1.1, defMul: 1.0, delay: 3.0, speed: 85, aggro: { sound: 120, lowhp: 200 }, link: true, tpMove: { name: "Vampiric Claw", mul: 1.8, drain: true }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.3], ["ether", 0.08], ["hi_potion", 0.05], ["x_potion", 0.04], ["hi_ether", 0.03]], model: "ghoul" },
  den_goblin: { name: "Goblin Raider", color: "#6f7f45", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 165 }, link: true, linkGroup: "goblin", tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["fire_crystal", 0.3], ["iron_ore", 0.15], ["ash_log", 0.2], ["hi_potion", 0.05], ["scroll_stone", 0.02]], model: "goblin" },
  orc_grunt: { name: "Orc Grunt", color: "#6f7f4f", radius: 16, hpMul: 1.3, attMul: 1.2, defMul: 1.1, delay: 3.2, speed: 95, aggro: { sight: 190 }, link: true, linkGroup: "orc", tpMove: { name: "Battle Roar", mul: 1.9, aoe: 70 }, weak: { ice: 1.2, light: 1.1 }, loot: [["orc_tooth", 0.3], ["iron_ore", 0.3], ["fire_crystal", 0.25], ["hi_potion", 0.06]], model: "orc" },
  orc_stonechucker: { name: "Orc Stonechucker", color: "#7f8f5f", radius: 15, hpMul: 1.05, attMul: 1.15, defMul: 0.95, delay: 3.6, speed: 100, aggro: { sight: 220 }, link: true, linkGroup: "orc", range: 200, tpMove: { name: "Boulder Toss", mul: 2.1 }, weak: { ice: 1.2, light: 1.1 }, loot: [["orc_tooth", 0.3], ["ash_log", 0.25], ["wind_crystal", 0.25], ["ether", 0.06], ["hi_ether", 0.03]], model: "orc" },
  fishfolk: { name: "Reefkin", color: "#4a8a7a", radius: 15, hpMul: 1.1, attMul: 1.05, defMul: 1.05, eva: 6, delay: 2.9, speed: 105, aggro: { sight: 170, sound: 120 }, link: true, linkGroup: "reefkin", tpMove: { name: "Water Lance", mul: 1.8 }, weak: { lightning: 1.4 }, loot: [["reef_scale", 0.3], ["water_crystal", 0.3], ["harbor_bream", 0.2], ["potion", 0.08]], model: "fishfolk" },
  birdfolk: { name: "Crag Talon", color: "#c8a870", radius: 14, hpMul: 1.0, attMul: 1.1, defMul: 0.95, eva: 10, delay: 2.6, speed: 120, aggro: { sight: 200 }, link: true, linkGroup: "crag", tpMove: { name: "Talon Dive", mul: 1.9 }, weak: { wind: 1.2, ice: 1.2 }, loot: [["crag_feather", 0.35], ["wind_crystal", 0.3], ["potion", 0.08]], model: "birdfolk" },
  sapling: { name: "Wandering Sapling", color: "#6aa84a", radius: 13, hpMul: 0.9, attMul: 0.8, defMul: 1.1, delay: 3.2, speed: 85, aggro: null, link: false, tpMove: { name: "Sprout Lash", mul: 1.5 }, weak: { fire: 1.6 }, loot: [["ash_log", 0.35], ["healing_herb", 0.25], ["earth_crystal", 0.2]], model: "bulb", tint: 0x8a6238, tint2: 0x6aa84a, scale: 0.33 },
  treant_elder: { name: "Elder Treant", color: "#4a3a28", radius: 20, hpMul: 2.0, attMul: 1.2, defMul: 1.4, delay: 3.8, speed: 70, aggro: { sight: 160 }, link: false, tpMove: { name: "Root Quake", mul: 2.0, aoe: 90 }, weak: { fire: 1.6 }, loot: [["heartwood", 0.3], ["ash_log", 0.5], ["earth_crystal", 0.4], ["hi_potion", 0.08]], model: "treant", scale: 1.3 },
  cactus: { name: "Needlekin", color: "#5aa04a", radius: 12, hpMul: 0.9, attMul: 1.0, defMul: 1.2, eva: 4, delay: 3.0, speed: 90, aggro: { sight: 150 }, link: false, range: 170, tpMove: { name: "Thousand Needles", mul: 2.4 }, weak: { fire: 1.3 }, loot: [["cactus_needle", 0.35], ["earth_crystal", 0.25], ["potion", 0.08]], model: "cactus" },
  bomb: { name: "Ember Bomb", color: "#ff7043", radius: 14, hpMul: 0.85, attMul: 1.3, defMul: 0.8, eva: 6, delay: 3.0, speed: 100, aggro: { sight: 160 }, link: false, tpMove: { name: "Self-Destruct", mul: 3.2, aoe: 90, explode: true }, weak: { water: 1.5, ice: 1.4 }, loot: [["bomb_ash", 0.4], ["fire_crystal", 0.4], ["ether", 0.06]], model: "bomb" },
  skeleton: { name: "Wandering Bones", color: "#e8e2cf", radius: 15, hpMul: 1.0, attMul: 1.05, defMul: 1.1, delay: 3.0, speed: 80, aggro: { sound: 120, lowhp: 180 }, link: true, tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.25], ["ether", 0.06], ["x_potion", 0.03]], model: "skeleton" },
  hare: { name: "Meadow Hare", color: "#c8a27a", radius: 11, hpMul: 0.6, attMul: 0.8, defMul: 0.8, eva: 6, delay: 2.6, speed: 115, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["egg_meadow_kit", 0.004], ["healing_herb", 0.35], ["earth_crystal", 0.2], ["potion", 0.06]], model: "hare" },
  crypt_sentinel: { name: "Crypt Sentinel", color: "#80cbc4", radius: 17, hpMul: 3.0, attMul: 1.25, defMul: 1.3, delay: 3.2, speed: 85, aggro: { sight: 170, sound: 150 }, link: true, linkGroup: "undead", tpMove: { name: "Grave Sweep", mul: 1.7, aoe: 80 }, weak: { light: 1.5, fire: 1.2 }, nm: true, scale: 1.5, aura: "#80cbc4", respawn: 600, loot: [["crypt_key", 1], ["bone_chip", 1], ["ether", 0.6], ["freeswords_slops", 0.3], ["super_ether", 0.15], ["reraiser", 0.2]], gil: [20, 30], model: "skeleton" },
  royal_guard: { name: "Royal Guard", color: "#c0c8d8", radius: 15, hpMul: 1.1, attMul: 1.15, defMul: 1.1, delay: 3.0, speed: 95, aggro: null, link: true, linkGroup: "undead", tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.5], ["water_crystal", 0.3], ["reraiser", 0.04], ["x_potion", 0.04], ["super_ether", 0.03]], model: "skeleton", summoned: true },
  hollow_king: { name: "Hollow King", color: "#ffd54f", radius: 20, hpMul: 3.8, attMul: 1.3, defMul: 1.25, delay: 3.4, speed: 90, aggro: { sight: 200 }, link: false, tpMove: { name: "Sovereign's Wrath", mul: 2.1, aoe: 100 }, weak: { light: 1.4, fire: 1.15 }, nm: true, boss: true, scale: 1.75, aura: "#ffd54f", respawn: 600, loot: [["sol_cap", 0.3], ["bee_spatha", 0.3], ["bone_chip", 1], ["hi_potion", 0.8], ["ether", 0.8], ["super_ether", 0.3], ["hi_reraiser", 0.25], ["super_reraiser", 0.1]], gil: [60, 80], model: "skeleton", phases: [0.66, 0.33], enrage: 0.2 },
  bog_toad: { name: "Bog Toad", color: "#5f7a3a", radius: 14, hpMul: 1.15, attMul: 1.0, defMul: 1.0, delay: 3.0, speed: 90, aggro: { sound: 120 }, link: false, tpMove: { name: "Tongue Lash", mul: 1.8, status: ["paralyze", 20, 0.2] }, weak: { ice: 1.25 }, loot: [["toad_oil", 0.45], ["water_crystal", 0.3], ["healing_herb", 0.2], ["hi_potion", 0.05]], model: "toad" },
  bog_leech: { name: "Bog Leech", color: "#5a2a2a", radius: 13, hpMul: 1.1, attMul: 0.95, defMul: 1.1, delay: 3.2, speed: 60, int: 4, aggro: null, link: false, tpMove: { name: "Blood Drain", mul: 1.6, drain: true }, weak: { fire: 1.3 }, loot: [["worm_silk", 0.3], ["water_crystal", 0.3], ["ether", 0.08]], model: "worm", tint: 0x4a2226 },
  mire_goblin: { name: "Mire Goblin", color: "#58663a", radius: 15, hpMul: 1.05, attMul: 1.05, defMul: 1.05, delay: 3.0, speed: 95, aggro: { sight: 175 }, link: true, linkGroup: "mire", tpMove: { name: "Bog Bomb", mul: 1.7, aoe: 75 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.25], ["mire_reed", 0.3], ["fire_crystal", 0.2], ["hi_potion", 0.06]], model: "goblin" },
  drowned: { name: "Drowned One", color: "#6f9a9a", radius: 15, hpMul: 1.2, attMul: 1.1, defMul: 1.05, delay: 3.0, speed: 85, aggro: { sound: 130, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Sodden Grasp", mul: 1.9, drain: true }, weak: { light: 1.5, lightning: 1.2 }, loot: [["chapel_sigil", 0.12], ["bone_chip", 0.35], ["water_crystal", 0.35], ["ether", 0.1], ["hi_potion", 0.06], ["x_potion", 0.04], ["reraiser", 0.03], ["hi_ether", 0.03]], model: "ghoul" },
  marsh_hare: { name: "Reed Hare", color: "#8a7a5a", radius: 11, hpMul: 0.7, attMul: 0.85, defMul: 0.85, eva: 8, delay: 2.6, speed: 120, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["healing_herb", 0.4], ["mire_reed", 0.2], ["potion", 0.08]], model: "hare", tint: 0x8a7a5a },
  tide_priest: { name: "Tidebound Priest", color: "#4dd0e1", radius: 20, hpMul: 3.2, attMul: 1.1, defMul: 1.2, delay: 3.6, speed: 80, int: 6, aggro: { sight: 240, sound: 220 }, link: false, tpMove: { name: "Drowning Tide", mul: 1.6, aoe: 110, status: ["silence", 20] }, weak: { lightning: 1.4, light: 1.3 }, nm: true, boss: true, scale: 1.6, aura: "#4dd0e1", respawn: 30, phases: [0.65], adds: "drowned", addsText: "calls the drowned up from the water!", enrage: 0.2, pulse: { at: 0.5, every: 22, dmg: 4, r: 170, name: "Maelstrom", el: "water" }, loot: [], gil: [40, 60], model: "ghoul" },
  snow_hare: { name: "Snow Hare", color: "#e8eef2", radius: 11, hpMul: 0.75, attMul: 0.85, defMul: 0.85, eva: 10, delay: 2.6, speed: 125, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { fire: 1.2 }, loot: [["healing_herb", 0.4], ["wind_crystal", 0.2], ["potion", 0.1]], model: "hare", tint: 0xeef2f6 },
  ice_bat: { name: "Ice Bat", color: "#9fd8ff", radius: 11, hpMul: 0.85, attMul: 1.0, defMul: 0.9, eva: 12, delay: 2.4, speed: 130, aggro: null, link: true, linkGroup: "icebat", tpMove: { name: "Frost Wing", mul: 1.9 }, weak: { fire: 1.3 }, loot: [["egg_frost_wisp", 0.005], ["bat_wing", 0.4], ["frost_shard", 0.25], ["ether", 0.08]], model: "bat", tint: 0x8ab8d8 },
  frost_goblin: { name: "Frost Goblin", color: "#9aa8a0", radius: 15, hpMul: 1.15, attMul: 1.1, defMul: 1.1, delay: 3.0, speed: 95, aggro: { sight: 185 }, link: true, linkGroup: "frostgob", tpMove: { name: "Ice Bomb", mul: 1.8, aoe: 80 }, weak: { fire: 1.3 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.3], ["frost_shard", 0.3], ["hi_potion", 0.08], ["scroll_blizzard", 0.015]], model: "goblin" },
  ice_wight: { name: "Ice Wight", color: "#b8e0f0", radius: 15, hpMul: 1.25, attMul: 1.15, defMul: 1.15, delay: 3.1, speed: 85, aggro: { sound: 140, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Rime Grasp", mul: 2.0, drain: true }, weak: { fire: 1.4, light: 1.4 }, loot: [["bone_chip", 0.35], ["frost_shard", 0.35], ["ether", 0.1], ["x_potion", 0.04], ["hi_ether", 0.04]], model: "skeleton" },
  glacier_worm: { name: "Glacier Worm", color: "#cfe8f2", radius: 15, hpMul: 1.35, attMul: 1.0, defMul: 1.2, delay: 3.4, speed: 60, int: 5, aggro: { magic: 150 }, link: false, tpMove: { name: "Hail Spit", mul: 1.7, aoe: 70 }, weak: { fire: 1.35 }, loot: [["worm_silk", 0.35], ["frost_shard", 0.25], ["water_crystal", 0.3]], model: "worm", tint: 0xc8e4f0 },
  chieftain: { name: "Goblin Chieftain", color: "#7d8a3a", radius: 20, hpMul: 1.8, attMul: 1.0, defMul: 1.0, delay: 3.2, speed: 100, aggro: { sight: 170 }, link: true, linkGroup: "goblin", tpMove: { name: "Goblin Rush", mul: 0.7, hits: 3 }, weak: { ice: 1.2 }, nm: true, respawn: 180, loot: [["legionnaires_cap", 0.3], ["goblin_totem", 0.3], ["lunar_cap", 0.25], ["iron_sword", 0.2], ["goblin_pouch", 1], ["ether", 0.5], ["iron_ore", 0.8]], gil: [30, 40], model: "chieftain" }
};

function tierFam(base, o) { return Object.assign({}, FAMILIES[base], o); }
Object.assign(FAMILIES, {
  bog_crawler: tierFam("grass_crawler", { name: "Bog Crawler", color: "#7a5a3a", tint: 0x7a5a3a, tint2: 0xc8b080, hpMul: 1.0, attMul: 0.9, loot: [["crawler_cocoon", 0.35], ["worm_silk", 0.3], ["water_crystal", 0.2], ["hi_potion", 0.04]] }),
  rime_crawler: tierFam("grass_crawler", { name: "Rime Crawler", color: "#a8d4e8", tint: 0xa8d4e8, tint2: 0xf0f8ff, hpMul: 1.1, attMul: 1.0, weak: { fire: 1.4 }, loot: [["crawler_cocoon", 0.35], ["frost_shard", 0.25], ["ice_crystal_dummy", 0], ["hi_potion", 0.05]] }),
  marsh_hornet: tierFam("honey_bee", { name: "Marsh Hornet", color: "#b03a2a", tint: 0xb03a2a, tint2: 0x1a1010, attMul: 1.0, loot: [["honeycomb", 0.35], ["wind_crystal", 0.25], ["hi_potion", 0.04]] }),
  frost_wasp: tierFam("honey_bee", { name: "Frost Wasp", color: "#e0f0ff", tint: 0xe0f0ff, tint2: 0x3a5a8a, attMul: 1.05, weak: { fire: 1.4 }, loot: [["honeycomb", 0.3], ["frost_shard", 0.25], ["hi_potion", 0.05]] }),
  bog_lizard: tierFam("hill_lizard", { name: "Bog Lizard", color: "#5a6a3a", tint: 0x5a6a3a, tint2: 0xb0b080, hpMul: 1.05, loot: [["lizard_skin", 0.4], ["water_crystal", 0.2], ["hi_potion", 0.05]] }),
  frost_lizard: tierFam("hill_lizard", { name: "Frost Lizard", color: "#a0c0d0", tint: 0xa0c0d0, tint2: 0xf0f8ff, hpMul: 1.1, weak: { fire: 1.4 }, loot: [["lizard_skin", 0.4], ["frost_shard", 0.25], ["hi_potion", 0.05]] }),
  mud_crab: tierFam("pond_crab", { name: "Mud Crab", color: "#6a5a40", tint: 0x6a5a40, hpMul: 1.05, loot: [["crab_shell", 0.4], ["water_crystal", 0.25], ["hi_potion", 0.04]] }),
  ice_crab: tierFam("pond_crab", { name: "Ice Crab", color: "#9ad0e8", tint: 0x9ad0e8, hpMul: 1.15, weak: { fire: 1.3, lightning: 1.2 }, loot: [["crab_shell", 0.4], ["frost_shard", 0.25], ["hi_potion", 0.05]] }),
  mountain_ram: tierFam("meadow_sheep", { name: "Mountain Ram", color: "#d0d0d8", tint: 0xc8c8d0, hpMul: 1.1, attMul: 1.0, loot: [["wool_tuft", 0.5], ["frost_shard", 0.2], ["hi_potion", 0.04]] }),
  marsh_mandrake: tierFam("mandrake", { name: "Marsh Mandrake", color: "#a08a5a", tint: 0xa08a5a, tint2: 0x3a6a3a, loot: [["mandrake_leaf", 0.45], ["mire_reed", 0.2], ["water_crystal", 0.15]] }),
  bog_shroom: tierFam("shroomling", { name: "Bog Shroom", color: "#8a7aa0", tint: 0xc8c0b0, tint2: 0x6a3a8a, loot: [["spore_cap", 0.4], ["water_crystal", 0.2], ["ether", 0.06]] }),
  marsh_snapper: tierFam("lake_snapper", { name: "Marsh Snapper", color: "#4a6a4a", tint: 0x4a6a4a, loot: [["mud_eel", 0.3], ["water_crystal", 0.25], ["hi_potion", 0.04]] }),
  ice_snapper: tierFam("lake_snapper", { name: "Ice Snapper", color: "#8ad0f0", tint: 0x8ad0f0, weak: { lightning: 1.3, fire: 1.2 }, loot: [["frost_shard", 0.25], ["water_crystal", 0.25], ["hi_potion", 0.05]] }),
  frost_stonechucker: tierFam("orc_stonechucker", { name: "Frost Stonechucker", color: "#7a8a8a", attMul: 1.2, weak: { fire: 1.3 }, loot: [["orc_tooth", 0.35], ["frost_shard", 0.25], ["ether", 0.06]] }),
  frost_bomb: tierFam("bomb", { name: "Frost Bomb", color: "#81d4fa", tpMove: { name: "Self-Destruct", mul: 3.4, aoe: 90, explode: true }, weak: { fire: 1.5 }, loot: [["bomb_ash", 0.4], ["frost_shard", 0.3], ["ether", 0.06]] }),
  rime_treant: tierFam("treant_elder", { name: "Rime Treant", color: "#6a7a80", hpMul: 2.2, loot: [["heartwood", 0.35], ["frost_shard", 0.35], ["hi_potion", 0.08]] })
});
FAMILIES.rime_crawler.loot = FAMILIES.rime_crawler.loot.filter(l => l[0] !== "ice_crystal_dummy");
const TROPHY_KIND = { sheep: "hide", lizard: "hide", longneck: "hide", hare: "hide", toad: "hide", bat: "hide", worm: "hide", crab: "chitin", crawler: "chitin", bee: "chitin", mandrake: "fibre", shroom: "fibre", bulb: "fibre", treant: "fibre", cactus: "fibre", fish: "scale", bomb: "core", wisp: "core" };
const TROPHY_TIERS = [{ lo: 1, hi: 9, c: [0.1, 0.6], price: 228 }, { lo: 10, hi: 19, c: [0.3, 0.6], price: 700 }, { lo: 20, hi: 29, c: [0.4, 0.6], price: 1100 }, { lo: 30, hi: 99, c: [0.4, 0.6], price: 1500 }];
const TROPHY_NAMES = {
  hide: { icon: "🟫", names: ["Coarse Hide", "Fine Hide", "Choice Hide", "Prime Hide"], desc: "A cured pelt or skin. Tanners and traders pay well for it." },
  chitin: { icon: "🐚", names: ["Coarse Chitin", "Fine Chitin", "Choice Chitin", "Prime Chitin"], desc: "A clean plate of shell. Armourers and traders pay well for it." },
  fibre: { icon: "🌿", names: ["Coarse Fibre", "Fine Fibre", "Choice Fibre", "Prime Fibre"], desc: "Tough living fibre. Weavers and traders pay well for it." },
  scale: { icon: "🐟", names: ["Coarse Scales", "Fine Scales", "Choice Scales", "Prime Scales"], desc: "A handful of bright scales. Jewellers and traders pay well for them." },
  core: { icon: "🔮", names: ["Dim Core", "Glowing Core", "Bright Core", "Radiant Core"], desc: "The still-warm heart of an elemental creature. Mages and traders pay well for it." }
};
for (const k in TROPHY_NAMES) TROPHY_TIERS.forEach((t, i) => { ITEMS["trophy_" + k + "_" + (i + 1)] = { name: TROPHY_NAMES[k].names[i], kind: "mat", icon: TROPHY_NAMES[k].icon, price: t.price, stack: 12, trophy: true, desc: TROPHY_NAMES[k].desc }; });

const NM_FAMILIES = {
  silkmother: { hint: "Burrow Flats, Rocky Hollow · any time", base: "grass_crawler", name: "Silkmother", hpMul: 2.6, attMul: 1.1, defMul: 1.3, scale: 1.7, aura: "#c5e1a5", loot: [["rabbit_mantle_hq", 0.3], ["asbestos_mitts", 0.35], ["crawler_cocoon", 1], ["potion", 0.6]], gil: [20, 30], respawn: 480 },
  orc_warlord: { hint: "Orc camp, Ashen Marsh · any time", base: "orc_grunt", name: "Gorruk the Warlord", hpMul: 3.4, attMul: 1.3, defMul: 1.2, scale: 1.35, aura: "#ff7043", loot: [["hellfire_axe", 0.3], ["poisona_ring", 0.35], ["orc_tooth", 1], ["hi_potion", 0.6]], gil: [40, 60], respawn: 600 },
  ashen_herald: { hint: "Summit Overlook, Frostspire Pass · story", base: "ice_wight", name: "The Ashen Herald", hpMul: 5.5, attMul: 1.35, defMul: 1.3, scale: 1.7, aura: "#ff7043", loot: [["garrison_tunica", 0.3], ["egg_ember_wisp", 0.08], ["frost_shard", 1], ["hi_potion", 1], ["ether", 1]], gil: [200, 260], respawn: 60 },
  rimefang: { hint: "Icefall Camp, Frostspire Pass · any time", base: "frost_goblin", name: "Rimefang", hpMul: 3.4, attMul: 1.25, defMul: 1.2, scale: 1.4, aura: "#80d8ff", loot: [["platoon_cutter", 0.3], ["fasting_ring", 0.35], ["egg_snow_kit", 0.04], ["frost_shard", 1], ["ether", 0.6]], gil: [50, 70], respawn: 600 },
  frost_wight: { hint: "Whispering Cairns, Frostspire Pass · night", base: "ice_wight", name: "The Frost Wight", hpMul: 3.6, attMul: 1.25, defMul: 1.25, scale: 1.45, aura: "#b3e5fc", loot: [["barons_saio", 0.3], ["fasting_ring", 0.3], ["bone_chip", 1], ["hi_potion", 0.6]], gil: [50, 70], respawn: 720 },
  old_croaker: { hint: "Croaker's Pool, Ashen Marsh · day", base: "bog_toad", name: "Old Croaker", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.9, aura: "#9ccc65", loot: [["green_scarf", 0.35], ["toad_oil", 1], ["water_crystal", 1], ["hi_potion", 0.5]], gil: [30, 45], respawn: 480 },
  mirelord_gax: { hint: "Mire Village, Ashen Marsh · any time", base: "mire_goblin", name: "Mirelord Gax", hpMul: 3.4, attMul: 1.25, defMul: 1.2, scale: 1.45, aura: "#ffab40", loot: [["moth_axe", 0.3], ["egg_mini_gob", 0.03], ["anglers_tunica", 0.3], ["goblin_pouch", 1], ["iron_ore", 1], ["ether", 0.5]], gil: [40, 60], respawn: 600 },
  grimtooth: { hint: "Goblin Camp, eastern Rocky Hollow · any time", base: "goblin", name: "Grimtooth", hpMul: 2.4, attMul: 1.15, defMul: 1.1, scale: 1.3, aura: "#ff5252", loot: [["safeguard_ring", 0.3], ["destrier_beret", 0.35], ["goblin_pouch", 1], ["fire_crystal", 1], ["hi_potion", 0.3]], gil: [12, 16], respawn: 300 },
  duskwing: { hint: "Old Fort Ruins, Rocky Hollow · night", base: "bat", name: "Duskwing", hpMul: 2.2, attMul: 1.1, eva: 18, scale: 1.6, aura: "#b388ff", loot: [["anglers_boots", 0.3], ["egg_shade_kit", 0.03], ["guerilla_gloves", 0.35], ["bat_wing", 1], ["wind_crystal", 1], ["ether", 0.3]], respawn: 300 },
  king_wiggles: { hint: "Burrow Flats, southern Rocky Hollow · day", base: "worm", name: "King Wiggles", hpMul: 2.6, attMul: 1.05, scale: 1.5, aura: "#ffd54f", loot: [["zealots_mitts", 0.3], ["moonbloom_seeds", 0.4], ["anglers_hose", 0.35], ["saintly_ring", 0.3], ["worm_silk", 1], ["earth_crystal", 1], ["ether", 0.3]], respawn: 300 },
  ossuary_warden: { hint: "Bone Pit, Goblin Den · any time", base: "ghoul", name: "Ossuary Warden", hpMul: 2.3, attMul: 1.15, scale: 1.35, aura: "#69f0ae", loot: [["priests_robe", 0.3], ["anus_gaiters", 0.35], ["bastokan_ring", 0.3], ["bone_chip", 1], ["water_crystal", 1], ["hi_potion", 0.4]], respawn: 360 }
};

const RARITY = { common: ["Common", "#e8e8e8"], uncommon: ["Uncommon", "#6fd36f"], rare: ["Rare", "#6aa9ff"], epic: ["Epic", "#c48cff"] };

const DAY_NAMES = ["Emberday", "Stoneday", "Tideday", "Galeday", "Frostday", "Stormday", "Dawnday", "Duskday"];
const DAY_ELEMENTS = ["fire", "earth", "water", "wind", "ice", "lightning", "light", "dark"];

const ZONES = {
  outpost: {},
  residence: {
    name: "Your Residence", w: 400, h: 320, safe: true, theme: "house", indoor: true,
    exits: [{ x: 176, y: 296, w: 48, h: 24, to: "outpost", tx: 2050, ty: 2750, label: "Outpost", kind: "door", ask: "Leave your residence?", yes: "Leave" }],
    npcs: [{ id: "pip", x: 60, y: 60 }],
    spawns: [],
    start: { x: 200, y: 250 },
    grid: { cols: 10, rows: 8, blocked: [[0, 0], [1, 0], [0, 1], [1, 1], [4, 7], [5, 7], [4, 6], [5, 6]] }
  },
  hollow: {
    name: "Rocky Hollow", w: 3200, h: 2200, theme: "field",
    exits: [
      { x: 0, y: 1050, w: 24, h: 100, to: "outpost", tx: 7070, ty: 2700, label: "Outpost" },
      { x: 3176, y: 1030, w: 24, h: 100, to: "den", tx: 120, ty: 800, label: "Goblin Den" },
      { x: 1550, y: 2176, w: 100, h: 24, to: "marsh", tx: 1400, ty: 95, label: "Ashen Marsh" },
      { x: 1250, y: 0, w: 100, h: 24, to: "highlands", tx: 2000, ty: 2880, label: "Windreach Highlands" }
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
      { fam: "grass_crawler", lv: [3, 4], x: 1550, y: 1950, nm: { id: "silkmother", lv: 6, chance: 0.15 } }, { fam: "grass_crawler", lv: [1, 2], x: 450, y: 1250 },
      { fam: "honey_bee", lv: [1, 2], x: 300, y: 1050, time: "day" }, { fam: "honey_bee", lv: [1, 2], x: 340, y: 1080, time: "day" }, { fam: "grass_crawler", lv: [1, 3], x: 520, y: 1600 }, { fam: "grass_crawler", lv: [2, 3], x: 470, y: 1650 }, { fam: "grass_crawler", lv: [2, 4], x: 900, y: 1500 },
      { fam: "meadow_sheep", lv: [1, 2], x: 250, y: 1400, time: "day" }, { fam: "meadow_sheep", lv: [1, 3], x: 300, y: 1450, time: "day" }, { fam: "mandrake", lv: [2, 3], x: 650, y: 1000, time: "day" }, { fam: "mandrake", lv: [2, 4], x: 700, y: 1040, time: "day" },
      { fam: "hill_lizard", lv: [4, 5], x: 1500, y: 1500 }, { fam: "hill_lizard", lv: [4, 6], x: 1850, y: 1100 }, { fam: "pond_crab", lv: [3, 5], x: 1150, y: 850 }, { fam: "pond_crab", lv: [4, 5], x: 1950, y: 1620 },
      { fam: "shroomling", lv: [4, 6], x: 2050, y: 1900 }, { fam: "shroomling", lv: [5, 6], x: 2150, y: 1950, time: "night" }, { fam: "lake_snapper", lv: [3, 5], x: 1120, y: 500 }, { fam: "honey_bee", lv: [3, 4], x: 1050, y: 1250, time: "day" }, { fam: "grass_crawler", lv: [4, 5], x: 1600, y: 1750 },
      { fam: "sapling", lv: [3, 5], x: 1300, y: 950 }, { fam: "sapling", lv: [4, 5], x: 1900, y: 950 }, { fam: "orc_grunt", lv: [5, 6], x: 2300, y: 1800 }, { fam: "orc_stonechucker", lv: [5, 6], x: 2360, y: 1850 }, { fam: "bomb", lv: [5, 6], x: 2700, y: 300, time: "night" },
      { fam: "hare", lv: [1, 2], x: 350, y: 1300, time: "day" }, { fam: "hare", lv: [1, 2], x: 620, y: 1450, time: "day" }, { fam: "hare", lv: [1, 2], x: 420, y: 800, time: "day" },
      { fam: "grass_crawler", lv: [1, 2], x: 700, y: 1250 }, { fam: "meadow_sheep", lv: [1, 2], x: 300, y: 1700, time: "day" }, { fam: "worm", lv: [2, 3], x: 600, y: 420 },
      { fam: "honey_bee", lv: [1, 2], x: 750, y: 800, time: "day" }, { fam: "grass_crawler", lv: [1, 2], x: 500, y: 1800 }, { fam: "mandrake", lv: [1, 2], x: 420, y: 950, time: "day" },
      { fam: "hare", lv: [1, 1], x: 250, y: 1000, time: "day" }, { fam: "grass_crawler", lv: [1, 1], x: 380, y: 1250 }, { fam: "bat", lv: [1, 1], x: 450, y: 1150, time: "night" },
      { fam: "bat", lv: [1, 2], x: 700, y: 650, time: "night" }, { fam: "bat", lv: [1, 2], x: 300, y: 1500, time: "night" },
      { fam: "goblin", lv: [2, 3], x: 1350, y: 1200 }, { fam: "goblin", lv: [2, 3], x: 1400, y: 1250 }, { fam: "goblin", lv: [2, 3], x: 1700, y: 800 },
      { fam: "hare", lv: [2, 3], x: 1100, y: 1150, time: "day" }, { fam: "worm", lv: [2, 3], x: 1000, y: 400 },
      { fam: "bat", lv: [2, 3], x: 1550, y: 500, time: "night" }, { fam: "skeleton", lv: [3, 4], x: 1800, y: 1300, time: "night" },
      { fam: "worm", lv: [3, 4], x: 1250, y: 1850 }, { fam: "worm", lv: [3, 4], x: 1650, y: 1950, nm: { id: "king_wiggles", lv: 5, chance: 0.15, time: "day" } }, { fam: "worm", lv: [3, 3], x: 1500, y: 2050 },
      { fam: "hare", lv: [3, 3], x: 1150, y: 2000, time: "day" },
      { fam: "goblin", lv: [4, 4], x: 2450, y: 900 }, { fam: "goblin", lv: [3, 4], x: 2350, y: 800 }, { fam: "goblin", lv: [4, 5], x: 2700, y: 1500 }, { fam: "goblin", lv: [4, 4], x: 2250, y: 650 },
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
      { w: 30, pts: [[2500, 1160], [2650, 1450]] },
      { w: 32, pts: [[1420, 1850], [1600, 2200], [1600, 2700]] },
      { w: 32, pts: [[1650, 1050], [1620, 500], [1300, 120], [1300, 0], [1300, -500]] }
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
      { fam: "den_goblin", lv: [7, 8], x: 1950, y: 600 }, { fam: "den_goblin", lv: [6, 7], x: 1100, y: 700 }, { fam: "den_goblin", lv: [7, 8], x: 1700, y: 900 }, { fam: "den_goblin", lv: [7, 8], x: 1950, y: 1000 }, { fam: "den_goblin", lv: [8, 8], x: 2050, y: 800 },
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
    { fam: "skeleton", lv: [9, 10], x: 800, y: 600 }, { fam: "skeleton", lv: [9, 10], x: 1000, y: 820 }, { fam: "skeleton", lv: [10, 10], x: 900, y: 700 }, { fam: "ghoul", lv: [10, 10], x: 1000, y: 560, nm: { id: "dark_elemental", lv: 12, chance: 0.07, time: "night" } },
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
const OUT_DW = 2400, OUT_DH = 1800;
const OUT_SIGNS = ["Bakery", "Tailor", "Cobbler", "Herbalist", "Candlemaker", "Cartographer", "Teahouse", "Fishmonger", "Butcher", "Potter", "Weaver", "Bookbinder", "Spice Merchant", "Glassworks", "Hatter", "Apothecary", "Cheesemonger", "Tinker", "Chandler", "Cooper", "Saddler", "Brewer", "Lacemaker", "Scribe"];
const OUT_AWNINGS = ["#b5651d", "#2e7d32", "#c0392b", "#1565c0", "#6a1b9a", "#ef8f00", "#00838f", "#5d4037"];
const OUT_FILL = {
  market: [["shop", 0.6, [100, 150], [80, 104], [2, 3]], ["home", 0.4, [96, 140], [84, 110], [2, 3]]],
  gov: [["hall", 0.45, [150, 210], [90, 120], [2, 3]], ["home", 0.55, [120, 170], [90, 120], [2, 3]]],
  res: [["home", 1, [90, 140], [80, 110], [1, 3]]],
  ind: [["warehouse", 0.4, [150, 220], [90, 120], [1, 2]], ["hall", 0.25, [130, 180], [80, 110], [1, 2]], ["home", 0.35, [90, 130], [80, 100], [1, 2]]],
  gate: [["home", 0.5, [100, 150], [84, 110], [1, 3]], ["hall", 0.3, [140, 190], [90, 110], [2, 2]], ["warehouse", 0.2, [150, 200], [90, 110], [1, 1]]]
};
const OUTPOST_PLAN = {
  gov: {
    off: [2400, 0], name: "Government District", color: "#5a86c8", icon: "🏛️", trees: true,
    streets: [{ w: 56, pts: [[1200, 1800], [1200, 330]], trees: true }, { w: 44, pts: [[200, 1050], [2200, 1050]], trees: true }, { w: 40, pts: [[450, 250], [450, 1600]] }, { w: 40, pts: [[1950, 250], [1950, 1600]] }, { w: 40, pts: [[450, 250], [1950, 250]] }, { w: 36, pts: [[450, 1550], [1950, 1550]] }],
    plazas: [{ x: 1200, y: 420, r: 150 }], fountains: [{ x: 1200, y: 420 }],
    reserve: [{ x: 520, y: 560, w: 420, h: 280 }],
    houses: [
      { key: "cityhall", x: 1200, y: 130, w: 320, h: 150, type: "cityhall", floors: 3, flag: "#c0392b" },
      { key: "barracks", x: 720, y: 360, w: 260, h: 120, type: "barracks", sign: "Barracks", flag: "#c0392b" },
      { key: "mercs", x: 1680, y: 360, w: 240, h: 120, type: "hall", sign: "Mercenary Hall", signCol: "#c0392b" },
      { key: "records", x: 720, y: 930, w: 200, h: 100, type: "hall", floors: 2, sign: "Hall of Records", signCol: "#c9a227" },
      { key: "chapel", x: 1680, y: 930, w: 180, h: 110, type: "hall", floors: 2, sign: "Chapel of the Dawn", signCol: "#f0e0a0" },
      { key: "guild", x: 720, y: 1180, w: 220, h: 100, type: "hall", sign: "Adventurers' Guild", signCol: "#5a86c8" },
      { key: "jobs", x: 1680, y: 1170, w: 180, h: 90, type: "hall", floors: 1, sign: "Job Master" }
    ],
    npcs: [{ id: "rhea", x: 900, y: 300, home: "barracks", sleep: [22, 6] }, { id: "maera", x: 900, y: 1290, home: "guild", sleep: [22.5, 6.5] }, { id: "brann", x: 1860, y: 300, home: "mercs", sleep: [23, 7.5] }, { id: "tobin", x: 1850, y: 1290, home: "jobs", sleep: [20, 7] }],
    props: [{ type: "desk", x: 900, y: 1320, r: 22 }],
    dummies: [[600, 640, 0.3], [690, 650, -0.2], [780, 640, 0.1], [870, 650, -0.3]], racks: [[600, 760, 0], [860, 760, 0]],
    benches: [[1060, 420, 1.57], [1340, 420, -1.57], [1200, 580, 0]],
    dressing: [{ t: "statue", x: 1080, y: 1680 }, { t: "statue", x: 1320, y: 1680 }, { t: "planter", x: 1060, y: 300 }, { t: "planter", x: 1340, y: 300 }, { t: "well", x: 1500, y: 700 }]
  },
  res: {
    off: [0, 1800], name: "Residential District", color: "#6fae5a", icon: "🏡", trees: true,
    streets: [{ w: 56, pts: [[2400, 900], [200, 900]], trees: true }, { w: 36, pts: [[600, 200], [600, 1600]] }, { w: 36, pts: [[1200, 200], [1200, 1600]] }, { w: 36, pts: [[1800, 200], [1800, 1600]] }, { w: 36, pts: [[200, 380], [2200, 380]] }, { w: 36, pts: [[200, 1420], [2200, 1420]] }],
    reserve: [{ x: 1240, y: 950, w: 520, h: 430 }],
    houses: [{ key: "residence", x: 2050, y: 1060, w: 140, h: 110, type: "home", tint: 0, floors: 2, rot: 2, fixed: true }],
    exits: [{ x: 2030, y: 970, w: 40, h: 26, to: "residence", tx: 200, ty: 250, label: "Your Residence", kind: "door", ask: "Enter your residence?" }],
    water: [{ x: 1500, y: 1180, r: 90 }],
    gardens: [{ x: 900, y: 650, w: 160, h: 90 }, { x: 330, y: 650, w: 140, h: 80 }, { x: 900, y: 1160, w: 160, h: 90 }, { x: 330, y: 1160, w: 140, h: 80 }, { x: 2100, y: 650, w: 140, h: 80 }],
    benches: [[1350, 1040, 0.8], [1650, 1040, -0.8], [1350, 1320, 2.3], [1650, 1320, -2.3]],
    dressing: [{ t: "tree", x: 1300, y: 1000 }, { t: "tree", x: 1700, y: 1000 }, { t: "tree", x: 1290, y: 1340 }, { t: "tree", x: 1710, y: 1340 }, { t: "tree", x: 1500, y: 1010 }, { t: "tree", x: 1380, y: 1170 }, { t: "well", x: 900, y: 520 }, { t: "well", x: 330, y: 1290 }, { t: "planter", x: 2140, y: 990 }],
    ambient: [{ type: "chicken", x: 900, y: 1160, n: 4, r: 70 }, { type: "chicken", x: 330, y: 650, n: 3, r: 60 }, { type: "cat", x: 1500, y: 1300, n: 1, r: 60, col: 0x5a5a5a }]
  },
  market: {
    off: [2400, 1800], name: "Market District", color: "#d8a838", icon: "⚖️",
    streets: [{ w: 64, pts: [[0, 900], [2400, 900]] }, { w: 56, pts: [[1200, 0], [1200, 1800]] }, { w: 40, pts: [[300, 430], [2100, 430]] }, { w: 40, pts: [[300, 1370], [2100, 1370]] }, { w: 40, pts: [[300, 430], [300, 1370]] }, { w: 40, pts: [[2100, 430], [2100, 1370]] }, { w: 34, pts: [[700, 140], [700, 430]] }, { w: 34, pts: [[1700, 140], [1700, 430]] }, { w: 34, pts: [[700, 1370], [700, 1660]] }, { w: 34, pts: [[1700, 1370], [1700, 1660]] }],
    plaza: { x: 1200, y: 900, r: 240 },
    houses: [
      { key: "markethall", x: 780, y: 770, w: 230, h: 120, type: "shop", sign: "Market Hall", awning: "#b5651d" },
      { key: "auction", x: 1600, y: 770, w: 190, h: 110, type: "auction", sign: "Auction House", flag: "#c9a227" },
      { key: "furnish", x: 1620, y: 1040, w: 150, h: 100, type: "shop", sign: "Furnishings", awning: "#7b1fa2" },
      { key: "tavern", x: 780, y: 1040, w: 190, h: 110, type: "hall", floors: 3, sign: "The Ember Mug", signCol: "#ff9a40" }
    ],
    npcs: [{ id: "crystal_town", x: 1200, y: 900 }, { id: "odette", x: 1520, y: 970, home: "furnish", sleep: [21.5, 6] }, { id: "luna", x: 1390, y: 1110 }, { id: "trade_board", x: 1010, y: 1100 }, { id: "auction_outpost", x: 1480, y: 840 }, { id: "barber_outpost", x: 1359, y: 817 }],
    stalls: [{ x: 1359, y: 826, color: "#c0392b", sign: "Barber", pole: true }, { x: 1300, y: 1043, color: "#2e7d32" }, { x: 1100, y: 1043, color: "#b5651d" }, { x: 1041, y: 826, color: "#7b1fa2" }, { x: 1100, y: 757, color: "#1565c0" }, { x: 1300, y: 757, color: "#ef8f00" }],
    benches: [[1020, 720, 0.8], [1380, 720, -0.8], [1020, 1080, 2.3], [1380, 1080, -2.3]],
    dressing: [{ t: "planter", x: 960, y: 640 }, { t: "planter", x: 1440, y: 640 }, { t: "planter", x: 960, y: 1160 }, { t: "planter", x: 1440, y: 1160 }, { t: "cart", x: 520, y: 1220, rot: 0.4 }, { t: "cart", x: 1880, y: 600, rot: -0.3 }],
    ambient: [{ type: "dog", x: 1200, y: 1150, n: 1, r: 140, col: 0x8a6a4a }]
  },
  ind: {
    off: [2400, 3600], name: "Industrial District", color: "#c4703a", icon: "⚒️",
    streets: [{ w: 56, pts: [[1200, 0], [1200, 1650]] }, { w: 44, pts: [[150, 520], [2250, 520]] }, { w: 44, pts: [[150, 1250], [2250, 1250]] }, { w: 40, pts: [[450, 520], [450, 1650]] }, { w: 40, pts: [[1950, 520], [1950, 1650]] }],
    houses: [
      { key: "smithy", x: 750, y: 380, w: 200, h: 110, type: "forge", floors: 1, sign: "Smithy", signCol: "#ff7a30" },
      { key: "wood", x: 750, y: 620, w: 160, h: 100, type: "hall", sign: "Woodworkers" },
      { key: "alch", x: 1650, y: 615, w: 150, h: 90, type: "hall", sign: "Alchemists", signCol: "#7ae0a0" },
      { key: "tannery", x: 334, y: 880, w: 140, h: 100, type: "hall", floors: 1, sign: "Tannery" },
      { key: "mill", x: 750, y: 1350, w: 170, h: 110, type: "mill" },
      { key: "warehouse", x: 1650, y: 1355, w: 220, h: 110, type: "warehouse", floors: 2 }
    ],
    npcs: [{ id: "garrick", x: 930, y: 470, home: "smithy", sleep: [22, 6.5] }],
    props: [{ type: "anvil", x: 900, y: 450, rot: 0.2, r: 26 }, { type: "barrels", x: 980, y: 760, rot: 1.2, r: 26 }, { type: "crates", x: 560, y: 760, rot: 0.4, r: 26 }, { type: "crates", x: 1850, y: 1380, rot: 0.2, r: 26 }, { type: "barrels", x: 1450, y: 1380, rot: 0.6, r: 26 }],
    dressing: [{ t: "cart", x: 1000, y: 1080, rot: 1.2 }, { t: "cart", x: 1450, y: 700, rot: -0.4 }, { t: "hay", x: 560, y: 1080 }, { t: "hay", x: 600, y: 1110 }],
    ambient: []
  },
  gate: {
    off: [4800, 1800], name: "Eastgate", color: "#a8a8a0", icon: "🛡️",
    streets: [{ w: 64, pts: [[0, 900], [2500, 900]] }, { w: 40, pts: [[800, 250], [800, 1600]] }, { w: 40, pts: [[1700, 250], [1700, 1600]] }, { w: 36, pts: [[800, 400], [1700, 400]] }, { w: 36, pts: [[800, 1400], [1700, 1400]] }],
    reserve: [{ x: 200, y: 1100, w: 480, h: 450 }],
    houses: [
      { key: "guard", x: 1900, y: 780, w: 180, h: 120, type: "guard", flag: "#9aa0a8" },
      { key: "watch", x: 1900, y: 1015, w: 220, h: 110, type: "barracks", sign: "Gate Watch", flag: "#9aa0a8" },
      { key: "stables", x: 1250, y: 1300, w: 220, h: 120, type: "home", sign: "Stables" },
      { key: "inn", x: 420, y: 780, w: 200, h: 110, type: "hall", floors: 3, sign: "Wayfarer's Inn", signCol: "#e0a050" }
    ],
    exits: [{ x: 2376, y: 850, w: 24, h: 100, to: "hollow", tx: 120, ty: 1100, label: "Rocky Hollow" }],
    npcs: [{ id: "ysolde", x: 1450, y: 1080, home: "stables", sleep: [19.5, 5.5] }, { id: "guard_east", x: 2180, y: 800 }],
    stable: { x: 1450, y: 1200, rot: -Math.PI / 2 },
    props: [{ type: "barrels", x: 300, y: 1200, rot: 0.3, r: 26 }, { type: "crates", x: 560, y: 1450, rot: 0.8, r: 26 }],
    dressing: [{ t: "cart", x: 420, y: 1320, rot: 0.2 }, { t: "cart", x: 600, y: 1260, rot: -0.6 }, { t: "hay", x: 300, y: 1450 }, { t: "hay", x: 340, y: 1480 }, { t: "hay", x: 1500, y: 1450 }, { t: "well", x: 1250, y: 650 }]
  }
};
const OUTPOST_GATES = [{ x: 2400, y: 2700, a: "res", b: "market" }, { x: 4800, y: 2700, a: "market", b: "gate" }, { x: 3600, y: 1800, a: "gov", b: "market", horiz: true }, { x: 3600, y: 3600, a: "market", b: "ind", horiz: true }];
function buildOutpostCity() {
  const rnd = seeded(hashStr("ashenreach-city-1"));
  const pick = a => a[Math.floor(rnd() * a.length)], range = r => r[0] + Math.round(rnd() * (r[1] - r[0]));
  const z = { name: "Ashenreach Outpost", w: OUT_DW * 3, h: OUT_DH * 3, safe: true, theme: "town", city: "Ashenreach", paved: true, outerWall: true, districts: [], cityWalls: [[2400, 1800, 2400, 3600], [4800, 1800, 4800, 3600], [2400, 1800, 4800, 1800], [2400, 3600, 4800, 3600]], gates: OUTPOST_GATES.map(g => Object.assign({}, g)), exits: [], npcs: [], props: [], ambient: [], spawns: [], water: [], plazas: [], fountains: [], gardens: [], dummies: [], racks: [], benches: [], paths: [], houses: [], stalls: [], lamps: [], dressing: [] };
  const keys = {}, homes = [];
  const G = (d, x, y) => [OUTPOST_PLAN[d].off[0] + x, OUTPOST_PLAN[d].off[1] + y];
  for (const did in OUTPOST_PLAN) {
    const P = OUTPOST_PLAN[did], [ox, oy] = P.off, mv = o => Object.assign({}, o, { x: o.x + ox, y: o.y + oy }), pt = q => [q[0] + ox, q[1] + oy].concat(q.slice(2));
    z.districts.push({ id: did, name: P.name, x: ox, y: oy, w: OUT_DW, h: OUT_DH, color: P.color, icon: P.icon });
    for (const s of P.streets) z.paths.push({ w: s.w, pts: s.pts.map(pt), trees: !!s.trees, district: did });
    for (const h of P.houses || []) { const c = mv(h); delete c.key; c.district = did; if (h.key) keys[h.key] = c; z.houses.push(c); }
    for (const k of ["npcs", "props", "water", "gardens", "stalls", "fountains", "plazas", "ambient", "dressing", "exits"]) for (const o of P[k] || []) { const c = mv(o); if (k === "npcs" && typeof c.home === "string") homes.push(c); z[k].push(c); }
    for (const k of ["dummies", "racks", "benches"]) for (const q of P[k] || []) z[k].push(pt(q));
    if (P.plaza) z.plaza = mv(P.plaza);
    if (P.stable) z.stable = mv(P.stable);
  }
  const signPool = {};
  for (const did in OUTPOST_PLAN) signPool[did] = OUT_SIGNS.slice().sort(() => rnd() - 0.5);
  const reserve = [];
  for (const did in OUTPOST_PLAN) for (const r of OUTPOST_PLAN[did].reserve || []) reserve.push({ x: r.x + OUTPOST_PLAN[did].off[0], y: r.y + OUTPOST_PLAN[did].off[1], w: r.w, h: r.h });
  const gateBox = g => g.horiz ? { x: g.x - 100, y: g.y - 160, w: 200, h: 320 } : { x: g.x - 160, y: g.y - 100, w: 320, h: 200 };
  const exitBox = e => e.kind === "door" ? { x: e.x - 30, y: e.y - 30, w: e.w + 60, h: e.h + 60 } : { x: e.x - 320, y: e.y - 90, w: 344, h: e.h + 180 };
  const circles = () => [].concat(z.plaza ? [z.plaza] : [], z.plazas, z.water.map(w => ({ x: w.x, y: w.y, r: w.r + 20 })), z.fountains.map(f => ({ x: f.x, y: f.y, r: 70 })));
  const hitCirc = (r, c) => Math.hypot(Math.max(r.x - c.x, 0, c.x - r.x - r.w), Math.max(r.y - c.y, 0, c.y - r.y - r.h)) < c.r + 12;
  const roadHit = (r, pad) => z.paths.some(p => p.pts.some((q, i) => i > 0 && segRect(p.pts[i - 1][0], p.pts[i - 1][1], q[0], q[1], r, p.w / 2 + pad)));
  const free = (r, did) => {
    const d = z.districts.find(q => q.id === did);
    if (r.x < d.x + 60 || r.y < d.y + 60 || r.x + r.w > d.x + d.w - 60 || r.y + r.h > d.y + d.h - 60) return false;
    if (z.houses.some(h => rectsHit(r, { x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h }, 22))) return false;
    if (reserve.some(q => rectsHit(r, q, 10)) || z.gates.some(g => rectsHit(r, gateBox(g), 0)) || z.exits.some(e => rectsHit(r, exitBox(e), 0))) return false;
    if (z.gardens.some(g => rectsHit(r, { x: g.x - g.w / 2, y: g.y - g.h / 2, w: g.w, h: g.h }, 14)) || z.stalls.some(s => rectsHit(r, { x: s.x - 26, y: s.y - 16, w: 52, h: 32 }, 14))) return false;
    if (circles().some(c => hitCirc(r, c))) return false;
    if ([].concat(z.npcs, z.props, z.dressing).some(o => inRect(o.x, o.y, r, 24))) return false;
    return !roadHit(r, 6);
  };
  for (const p of z.paths) {
    const did = p.district, fill = OUT_FILL[did];
    for (let i = 1; i < p.pts.length; i++) {
      const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L, vert = Math.abs(ux) < 0.5;
      for (const side of [-1, 1]) {
        const nx = -uy * side, ny = ux * side;
        for (let t = 50; t < L - 50;) {
          let w0 = 0, r0 = rnd(), kind = fill[fill.length - 1];
          for (const f of fill) { if (r0 < f[1]) { kind = f; break; } r0 -= f[1]; }
          const fw = range(kind[2]), fd = range(kind[3]), back = (kind[0] === "shop" ? 58 : 26) + rnd() * 10;
          const along = vert ? fw : fw, bw = vert ? fd : fw, bh = vert ? fw : fd, off = p.w / 2 + back + (vert ? bw : bh) / 2;
          const cx = ax + ux * (t + along / 2) + nx * off, cy = ay + uy * (t + along / 2) + ny * off;
          const r = { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
          if (free(r, did)) {
            const rot = vert ? (nx > 0 ? 3 : 1) : (ny > 0 ? 2 : 0), h = { x: Math.round(cx), y: Math.round(cy), w: bw, h: bh, type: kind[0], floors: range(kind[4]), rot, district: did };
            if (kind[0] === "shop") { const sg = signPool[did].pop(); if (sg) h.sign = sg; h.awning = pick(OUT_AWNINGS); }
            if (kind[0] === "hall" && rnd() < 0.3) h.sign = pick(["Guildhouse", "Counting House", "Lodge", "Assay Office", "Notary", "Bathhouse"]);
            z.houses.push(h); w0 = along;
            if ((did === "ind" || did === "gate") && rnd() < 0.5) { const sx = vert ? cx + nx * (bw / 2 + 26) : cx + ux * (bw / 2 + 24), sy = vert ? cy + uy * (bh / 2 + 24) : cy + ny * (bh / 2 + 26); z.props.push({ type: rnd() < 0.5 ? "barrels" : "crates", x: Math.round(sx), y: Math.round(sy), rot: rnd() * 6, r: 22 }); }
          }
          t += (w0 || 40) + 24 + Math.round(rnd() * 22);
        }
      }
    }
  }
  const nearRoad = (x, y, extra) => z.paths.some(p => p.pts.some((q, i) => i > 0 && distToSegPt(x, y, p.pts[i - 1], q) < p.w / 2 + extra));
  const blocked = (x, y, pad) => z.houses.some(h => Math.abs(x - h.x) < h.w / 2 + pad && Math.abs(y - h.y) < h.h / 2 + pad) || circles().some(c => Math.hypot(x - c.x, y - c.y) < c.r) || z.gates.some(g => inRect(x, y, gateBox(g), 0)) || z.exits.some(e => inRect(x, y, exitBox(e), 0)) || z.stalls.some(s => Math.hypot(x - s.x, y - s.y) < 50);
  for (const p of z.paths) for (let i = 1; i < p.pts.length; i++) {
    const [ax, ay] = p.pts[i - 1], [bx, by] = p.pts[i], L = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L, uy = (by - ay) / L;
    let k = 0;
    for (let t = 120; t < L - 60; t += 230, k++) {
      const sd = k % 2 ? 1 : -1, x = Math.round(ax + ux * t - uy * sd * (p.w / 2 + 16)), y = Math.round(ay + uy * t + ux * sd * (p.w / 2 + 16));
      if (!nearRoad(x, y, 4) && !blocked(x, y, 18)) z.lamps.push([x, y]);
    }
    if (!p.trees) continue;
    for (let t = 200; t < L - 100; t += 170) for (const sd of [-1, 1]) {
      const x = Math.round(ax + ux * t - uy * sd * (p.w / 2 + 34)), y = Math.round(ay + uy * t + ux * sd * (p.w / 2 + 34));
      if (!nearRoad(x, y, 12) && !blocked(x, y, 26) && !z.lamps.some(q => Math.hypot(q[0] - x, q[1] - y) < 50)) z.dressing.push({ t: "tree", x, y, s: 0.8 + rnd() * 0.3 });
    }
  }
  for (const n of homes) n.home = z.houses.indexOf(keys[n.home]);
  z.start = { x: G("market", 1200, 1030)[0], y: G("market", 1200, 1030)[1] };
  return z;
}
function distToSegPt(x, y, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); }
ZONES.outpost = buildOutpostCity();
ZONES.den.exits.push({ x: 1150, y: 1576, w: 100, h: 24, to: "crypt", tx: 120, ty: 700, label: "Sunken Crypt" });
ZONES.harbor = {
  name: "Saltreach Harbor", w: 1800, h: 1300, safe: true, theme: "town", city: "Saltreach", cityStyle: "harbor", paved: true, outerWall: "new",
  districts: [
    { id: "fish", name: "Fish Market", x: 24, y: 24, w: 596, h: 956, color: "#4fa0c8", icon: "🐟" },
    { id: "square", name: "Harbor Square", x: 620, y: 24, w: 560, h: 956, color: "#e0c060", icon: "⚓" },
    { id: "yard", name: "Shipwrights' Row", x: 1180, y: 24, w: 596, h: 956, color: "#a87850", icon: "🛠️" },
    { id: "docks", name: "The Docks", x: 24, y: 980, w: 1752, h: 296, color: "#3a7ab0", icon: "⛵" }
  ],
  cityWalls: [[620, 24, 620, 980], [1180, 24, 1180, 980], [24, 980, 1776, 980]],
  gates: [{ x: 620, y: 500, a: "fish", b: "square" }, { x: 1180, y: 500, a: "square", b: "yard" }, { x: 320, y: 980, a: "fish", b: "docks", horiz: true }, { x: 900, y: 980, a: "square", b: "docks", horiz: true }, { x: 1480, y: 980, a: "yard", b: "docks", horiz: true }],
  exits: [{ x: 850, y: 0, w: 100, h: 24, to: "marsh", tx: 2250, ty: 2290, label: "Ashen Marsh" }, { x: 1776, y: 450, w: 24, h: 100, to: "frost", tx: 110, ty: 1200, label: "Frostspire Pass" }],
  props: [{ type: "crates", x: 420, y: 1030, r: 30 }, { type: "barrels", x: 1120, y: 1030, r: 26 }, { type: "crates", x: 1560, y: 1035, r: 30 }],
  ambient: [{ type: "gull", x: 900, y: 1080, n: 6, r: 300 }, { type: "cat", x: 300, y: 600, n: 1, r: 60, col: 0xd08a40 }, { type: "walker", x: 900, y: 560, n: 1, path: [[800, 460], [1000, 460], [1000, 660], [800, 660]] }, { type: "walker", x: 900, y: 1035, n: 1, path: [[200, 1035], [1600, 1035]] }],
  npcs: [
    { id: "ilsa", x: 820, y: 400, home: 0, sleep: [22, 6] }, { id: "marn", x: 300, y: 430, home: 7, sleep: [20.5, 4.5] },
    { id: "crystal_harbor", x: 900, y: 560 }, { id: "ferry_harbor", x: 960, y: 1092 }, { id: "trade_board", x: 760, y: 450 }, { id: "auction_harbor", x: 1088, y: 366 }, { id: "barber_harbor", x: 1240, y: 431 }, { id: "job_harbor", x: 1200, y: 560 }, { id: "stable_harbor", x: 1420, y: 620 }, { id: "guard_north", x: 900, y: 120 }, { id: "guard_pass", x: 1700, y: 460 }
  ],
  spawns: [],
  water: [{ x: 300, y: 1520, r: 430 }, { x: 900, y: 1540, r: 440 }, { x: 1500, y: 1520, r: 430 }],
  plaza: { x: 900, y: 560, r: 140 },
  paths: [
    { w: 52, pts: [[900, -500], [900, 0], [900, 1060]] },
    { w: 40, pts: [[100, 500], [1800, 500], [2300, 500]] },
    { w: 34, pts: [[300, 420], [300, 960], [320, 1040]] },
    { w: 34, pts: [[1480, 560], [1480, 1040]] },
    { w: 40, pts: [[100, 1040], [1700, 1040]] }
  ],
  houses: [
    { x: 760, y: 300, w: 160, h: 100, type: "hall", sign: "Harbor Master", signCol: "#2f7f8f" }, { x: 1065, y: 300, w: 150, h: 100, type: "auction", sign: "Auction House", flag: "#c9a227" },
    { x: 760, y: 850, w: 160, h: 90, type: "warehouse", sign: "Customs" }, { x: 1050, y: 850, w: 160, h: 90, type: "hall", floors: 3, sign: "Sailors' Rest" },
    { x: 300, y: 320, w: 220, h: 110, type: "markethall", sign: "Fish Market", signCol: "#4fa0c8" },
    { x: 110, y: 110, w: 120, h: 90, type: "home" }, { x: 470, y: 130, w: 130, h: 100, type: "home", floors: 3 }, { x: 130, y: 700, w: 140, h: 100, type: "home" }, { x: 470, y: 720, w: 140, h: 100, type: "home" }, { x: 130, y: 890, w: 140, h: 90, type: "home" },
    { x: 1400, y: 300, w: 150, h: 100, type: "shop", sign: "Outfitters Hall", awning: "#2a6a9a" }, { x: 1300, y: 760, w: 160, h: 100, type: "hall", sign: "Shipwright" },
    { x: 1650, y: 200, w: 140, h: 100, type: "home", floors: 3 }, { x: 1690, y: 850, w: 120, h: 90, type: "home" }
  ],
  stalls: [{ x: 360, y: 460, color: "#0277bd" }, { x: 1470, y: 440, color: "#6a1b9a" }, { x: 1240, y: 440, color: "#c0392b", sign: "Barber", pole: true }],
  docks: [[560, 1070, 60, 230], [870, 1090, 60, 210], [1240, 1070, 60, 230]],
  boats: [[680, 1240, 0.2], [1080, 1250, -0.3], [1420, 1230, 0.1]],
  lighthouses: [[1700, 1060]],
  slipways: [[1560, 800, 0]],
  racks: [[230, 1030, 0], [1360, 1030, 0]],
  benches: [[780, 560, 1.57], [1020, 560, -1.57]],
  lamps: [[780, 440], [1020, 440], [780, 680], [1020, 680], [600, 1040], [1200, 1040], [300, 600], [1480, 640]],
  start: { x: 900, y: 640 }
};

ZONES.frost = {
  name: "Frostspire Pass", w: 3000, h: 2400, theme: "field", palette: "snow",
  exits: [{ x: 0, y: 1150, w: 24, h: 100, to: "harbor", tx: 1330, ty: 430, label: "Saltreach Harbor" }, { x: 2976, y: 1080, w: 24, h: 100, to: "ironvale", tx: 120, ty: 550, label: "Ironvale" }],
  npcs: [],
  walls: [{ x: 700, y: 300, w: 300, h: 260 }, { x: 1800, y: 1500, w: 360, h: 220 }, { x: 2300, y: 400, w: 220, h: 400 }, { x: 1100, y: 1900, w: 420, h: 160 }],
  ruins: {
    walls: [[2400, 1850, 2600, 1850, 1.4], [2400, 1850, 2400, 2050, 1.0], [2600, 1850, 2600, 2000, 1.8]],
    pillars: [[2300, 1750, 2.4], [2700, 1750, 1.6], [2500, 2150, 2.0], [2250, 2100, 1.2]]
  },
  landmarks: [
    { id: "gate", name: "Frost Gate", x: 250, y: 1200, r: 200, xp: 250 },
    { id: "icefall", name: "Icefall Camp", x: 1500, y: 700, r: 260, xp: 350 },
    { id: "frozenlake", name: "Frozen Lake", x: 1000, y: 1300, r: 260, xp: 300 },
    { id: "cairns", name: "Whispering Cairns", x: 2500, y: 1950, r: 260, xp: 400 },
    { id: "summit", name: "Summit Overlook", x: 2700, y: 300, r: 220, xp: 450 }
  ],
  spawns: [
    { fam: "rime_crawler", lv: [15, 17], x: 600, y: 1600 }, { fam: "rime_crawler", lv: [16, 17], x: 700, y: 1680 }, { fam: "frost_wasp", lv: [16, 17], x: 1300, y: 400, time: "day" }, { fam: "frost_wasp", lv: [16, 18], x: 1350, y: 440, time: "day" },
    { fam: "frost_lizard", lv: [16, 18], x: 1900, y: 900 }, { fam: "ice_crab", lv: [16, 17], x: 1100, y: 1100 }, { fam: "ice_crab", lv: [16, 18], x: 900, y: 1480 }, { fam: "mountain_ram", lv: [15, 16], x: 400, y: 600, time: "day" }, { fam: "mountain_ram", lv: [15, 17], x: 460, y: 650, time: "day" },
    { fam: "ice_snapper", lv: [16, 18], x: 1000, y: 1180 }, { fam: "frost_stonechucker", lv: [17, 19], x: 1620, y: 640 }, { fam: "frost_bomb", lv: [17, 19], x: 2400, y: 1200, time: "night", nm: { id: "ice_elemental", lv: 20, chance: 0.07, time: "night" } }, { fam: "rime_treant", lv: [18, 19], x: 2700, y: 700 },
    { fam: "ice_wight", lv: [19, 20], x: 2700, y: 330, nm: { id: "ashen_herald", lv: 22, chance: 0 } },
    { fam: "snow_hare", lv: [15, 16], x: 400, y: 900, time: "day" }, { fam: "snow_hare", lv: [15, 16], x: 500, y: 1500, time: "day" }, { fam: "snow_hare", lv: [16, 17], x: 1300, y: 1600, time: "day" },
    { fam: "glacier_worm", lv: [15, 16], x: 650, y: 1150 }, { fam: "glacier_worm", lv: [16, 17], x: 1250, y: 1150 }, { fam: "glacier_worm", lv: [17, 18], x: 1700, y: 1250 },
    { fam: "ice_bat", lv: [15, 17], x: 900, y: 800, time: "night" }, { fam: "ice_bat", lv: [16, 17], x: 1100, y: 600, time: "night" }, { fam: "ice_bat", lv: [17, 18], x: 2000, y: 900, time: "night" },
    { fam: "frost_goblin", lv: [16, 17], x: 1350, y: 600 }, { fam: "frost_goblin", lv: [16, 17], x: 1550, y: 550 }, { fam: "frost_goblin", lv: [17, 18], x: 1650, y: 800 },
    { fam: "frost_goblin", lv: [17, 18], x: 1450, y: 850 }, { fam: "frost_goblin", lv: [17, 18], x: 1700, y: 760 }, { fam: "frost_goblin", lv: [18, 19], x: 2200, y: 480 }, { fam: "frost_goblin", lv: [18, 19], x: 1800, y: 650, nm: { id: "rimefang", lv: 21, chance: 0.15 } },
    { fam: "ice_wight", lv: [17, 18], x: 2300, y: 1950, time: "night" }, { fam: "ice_wight", lv: [18, 19], x: 2550, y: 2100, time: "night" }, { fam: "ice_wight", lv: [18, 20], x: 2650, y: 1800, time: "night", nm: { id: "frost_wight", lv: 21, chance: 0.12 } },
    { fam: "glacier_worm", lv: [18, 19], x: 2100, y: 1300 }, { fam: "frost_goblin", lv: [19, 20], x: 2600, y: 400 }, { fam: "frost_goblin", lv: [19, 20], x: 2750, y: 600 },
    { fam: "ice_bat", lv: [19, 20], x: 2500, y: 800, time: "night" }, { fam: "glacier_worm", lv: [19, 20], x: 2700, y: 1200 }, { fam: "snow_hare", lv: [17, 18], x: 2200, y: 1100, time: "day" }
  ],
  water: [{ x: 1000, y: 1300, r: 160 }, { x: 2050, y: 2150, r: 90 }],
  paths: [
    { w: 42, pts: [[-500, 1200], [0, 1200], [400, 1150], [800, 1000], [1300, 950], [1700, 1000], [2200, 1100], [2600, 900], [2750, 450]] },
    { w: 32, pts: [[1300, 950], [1500, 700]] },
    { w: 30, pts: [[2200, 1100], [2400, 1500], [2500, 1900]] }
  ],
  gather: {
    mining: { n: 3, at: [[600, 500], [1900, 300], [2850, 1500], [300, 2000], [1500, 2200]], loot: [["iron_ore", 0.55], ["frost_shard", 0.2], ["fire_crystal", 0.12]] },
    logging: { n: 2, at: [[300, 600], [2200, 1300], [900, 2100], [2850, 2200]], loot: [["ash_log", 0.7], ["wind_crystal", 0.2]] },
    harvesting: { n: 2, at: [[800, 1500], [1600, 1500], [2400, 1300], [400, 1800]], loot: [["healing_herb", 0.6], ["frost_shard", 0.15], ["water_crystal", 0.15]] }
  },
  start: { x: 110, y: 1200 }
};

ZONES.marsh = {
  name: "Ashen Marsh", w: 2800, h: 2400, theme: "field", palette: "marsh", mist: true,
  exits: [{ x: 1350, y: 0, w: 100, h: 24, to: "hollow", tx: 1600, ty: 2110, label: "Rocky Hollow" }, { x: 2200, y: 2376, w: 100, h: 24, to: "harbor", tx: 500, ty: 95, label: "Saltreach Harbor" }, { x: 2776, y: 700, w: 24, h: 100, to: "verdant", tx: 120, ty: 1150, label: "Verdant Jungle" }],
  npcs: [],
  walls: [{ x: 300, y: 300, w: 260, h: 160 }, { x: 2300, y: 1500, w: 200, h: 320 }, { x: 900, y: 2100, w: 380, h: 140 }],
  ruins: {
    walls: [[450, 1860, 600, 1860, 2.2], [450, 1860, 450, 1990, 1.6], [700, 1860, 760, 1860, 1.2], [760, 1860, 760, 2000, 2.4], [450, 2060, 560, 2060, 1.0]],
    pillars: [[520, 1930, 2.8], [690, 1950, 1.4], [600, 2120, 2.0]]
  },
  landmarks: [
    { id: "foggate", name: "Fog Gate", x: 1400, y: 200, r: 200, xp: 120 },
    { id: "causeway", name: "Sunken Causeway", x: 1250, y: 650, r: 230, xp: 150 },
    { id: "croaker", name: "Croaker's Pool", x: 850, y: 1350, r: 240, xp: 170 },
    { id: "mirevillage", name: "Mire Village", x: 2150, y: 800, r: 260, xp: 200 },
    { id: "willow", name: "Weeping Willows", x: 1800, y: 1650, r: 230, xp: 160 },
    { id: "chapel", name: "Drowned Chapel", x: 600, y: 1960, r: 230, xp: 200 }
  ],
  spawns: [
    { fam: "longneck", lv: [11, 13], x: 1500, y: 1500, time: "day" }, { fam: "longneck", lv: [12, 13], x: 1700, y: 1600, time: "day" },
    { fam: "marsh_hare", lv: [9, 10], x: 1250, y: 330, time: "day" }, { fam: "marsh_hare", lv: [9, 10], x: 1650, y: 420, time: "day" }, { fam: "marsh_hare", lv: [10, 11], x: 1000, y: 900, time: "day" },
    { fam: "fishfolk", lv: [11, 12], x: 2500, y: 1900 }, { fam: "fishfolk", lv: [11, 13], x: 2600, y: 2000 }, { fam: "orc_grunt", lv: [13, 14], x: 720, y: 640, nm: { id: "orc_warlord", lv: 16, chance: 0.12 } }, { fam: "orc_grunt", lv: [12, 13], x: 700, y: 700 },
    { fam: "bog_crawler", lv: [10, 12], x: 1100, y: 1700 }, { fam: "bog_crawler", lv: [11, 12], x: 1200, y: 1800 }, { fam: "bog_crawler", lv: [11, 13], x: 2300, y: 1300 }, { fam: "marsh_hornet", lv: [10, 11], x: 1700, y: 500, time: "day" }, { fam: "marsh_hornet", lv: [10, 12], x: 1750, y: 540, time: "day" },
    { fam: "bog_lizard", lv: [10, 12], x: 2000, y: 1200 }, { fam: "mud_crab", lv: [10, 12], x: 1550, y: 1250 }, { fam: "mud_crab", lv: [11, 12], x: 1950, y: 1850 }, { fam: "marsh_mandrake", lv: [9, 11], x: 1100, y: 300, time: "day" }, { fam: "marsh_mandrake", lv: [9, 10], x: 1150, y: 340, time: "day" },
    { fam: "bog_shroom", lv: [10, 12], x: 500, y: 1100, time: "night" }, { fam: "marsh_snapper", lv: [10, 12], x: 900, y: 1200 }, { fam: "orc_grunt", lv: [12, 14], x: 760, y: 760 }, { fam: "orc_stonechucker", lv: [12, 14], x: 650, y: 760 },
    { fam: "treant_elder", lv: [13, 14], x: 1900, y: 1900 }, { fam: "birdfolk", lv: [12, 13], x: 300, y: 1500 }, { fam: "birdfolk", lv: [12, 14], x: 360, y: 1560 }, { fam: "birdfolk", lv: [13, 14], x: 330, y: 1620 }, { fam: "cactus", lv: [10, 12], x: 2200, y: 300 },
    { fam: "bog_toad", lv: [9, 10], x: 1100, y: 450 }, { fam: "bog_toad", lv: [9, 10], x: 1600, y: 600 }, { fam: "bog_toad", lv: [10, 11], x: 800, y: 700 },
    { fam: "bog_toad", lv: [10, 11], x: 700, y: 1200 }, { fam: "bog_toad", lv: [11, 12], x: 1000, y: 1500 }, { fam: "bog_toad", lv: [11, 12], x: 650, y: 1550, nm: { id: "old_croaker", lv: 15, chance: 0.15, time: "day" } },
    { fam: "bog_leech", lv: [10, 11], x: 1500, y: 900 }, { fam: "bog_leech", lv: [10, 12], x: 1300, y: 1200 }, { fam: "bog_leech", lv: [11, 12], x: 1700, y: 1300 }, { fam: "bog_leech", lv: [12, 13], x: 2000, y: 1900 },
    { fam: "bat", lv: [10, 11], x: 1200, y: 800, time: "night" }, { fam: "bat", lv: [10, 12], x: 900, y: 1100, time: "night" }, { fam: "bat", lv: [11, 12], x: 1900, y: 1400, time: "night" },
    { fam: "mire_goblin", lv: [11, 12], x: 1850, y: 650 }, { fam: "mire_goblin", lv: [11, 12], x: 1950, y: 950 }, { fam: "mire_goblin", lv: [12, 13], x: 2250, y: 650 },
    { fam: "mire_goblin", lv: [12, 13], x: 2400, y: 900 }, { fam: "mire_goblin", lv: [12, 13], x: 2000, y: 760 }, { fam: "mire_goblin", lv: [13, 14], x: 2300, y: 1000 }, { fam: "mire_goblin", lv: [13, 14], x: 2200, y: 1100 }, { fam: "mire_goblin", lv: [13, 14], x: 2500, y: 600, nm: { id: "mirelord_gax", lv: 16, chance: 0.15 } },
    { fam: "drowned", lv: [12, 13], x: 500, y: 1800, time: "night" }, { fam: "drowned", lv: [12, 14], x: 800, y: 2000, time: "night" }, { fam: "drowned", lv: [13, 14], x: 400, y: 2150, time: "night" },
    { fam: "drowned", lv: [13, 14], x: 1300, y: 1900, time: "night" }, { fam: "bog_toad", lv: [12, 13], x: 1600, y: 2000 }, { fam: "mire_goblin", lv: [13, 14], x: 2050, y: 2150 },
    { fam: "bog_leech", lv: [13, 14], x: 2500, y: 2100 }, { fam: "bog_toad", lv: [13, 14], x: 1500, y: 1650 }
  ],
  water: [{ x: 850, y: 1350, r: 150 }, { x: 1500, y: 1100, r: 110 }, { x: 1900, y: 1700, r: 120 }, { x: 600, y: 900, r: 90 }, { x: 1150, y: 1850, r: 100 }, { x: 2400, y: 1300, r: 90 }, { x: 1700, y: 300, r: 70 }],
  paths: [
    { w: 40, pts: [[1400, -500], [1400, 0], [1350, 300], [1250, 650], [1050, 1000], [1150, 1500], [1450, 1750], [1800, 2000], [2300, 2200]] },
    { w: 34, pts: [[1250, 650], [1700, 750], [2150, 800], [2500, 750], [2800, 750], [3300, 750]] },
    { w: 30, pts: [[1150, 1500], [800, 1700], [600, 1960]] },
    { w: 34, pts: [[2300, 2200], [2250, 2400], [2250, 2900]] }
  ],
  gather: {
    mining: { n: 2, at: [[2600, 300], [300, 1200], [2600, 1900], [1000, 2250]], loot: [["iron_ore", 0.5], ["copper_ore", 0.25], ["fire_crystal", 0.12], ["earth_crystal", 0.12]] },
    logging: { n: 3, at: [[1900, 1500], [250, 700], [2700, 1100], [1150, 250], [400, 2300]], loot: [["ash_log", 0.7], ["wind_crystal", 0.2]] },
    harvesting: { n: 4, at: [[1000, 1300], [700, 1100], [1700, 1150], [2100, 1800], [1300, 2000], [1650, 500]], loot: [["mire_reed", 0.55], ["healing_herb", 0.4], ["water_crystal", 0.15]] }
  },
  start: { x: 1400, y: 95 }
};
ZONES.marsh.npcs.push({ id: "chapel_door", x: 600, y: 2120 });

ZONES.depths = {
  name: "Chapel Depths", w: 1200, h: 900, theme: "crypt", battlefield: true,
  exits: [{ x: 0, y: 400, w: 24, h: 100, to: "marsh", tx: 640, ty: 2050, label: "Chapel Steps" }],
  npcs: [],
  walls: [{ x: 0, y: 0, w: 260, h: 220 }, { x: 0, y: 680, w: 260, h: 220 }, { x: 940, y: 0, w: 260, h: 220 }, { x: 940, y: 680, w: 260, h: 220 }, { x: 260, y: 0, w: 680, h: 60 }, { x: 260, y: 840, w: 680, h: 60 }],
  pillars: [[380, 300], [380, 600], [820, 300], [820, 600]],
  water: [{ x: 1030, y: 450, r: 110 }],
  spawns: [{ fam: "tide_priest", lv: [16, 16], x: 860, y: 450, bf: true }],
  landmarks: [],
  start: { x: 80, y: 450 }
};

ZONES.den.paths.push({ w: 34, pts: [[1250, 1120], [1200, 1400], [1200, 1600], [1200, 2100]] });

const BRAZIER_LINES = { fire: "the flame that wakes the dawn", wind: "the breath that carries the ash", earth: "the stone that keeps the dead", water: "the tide that quiets all" };
const CHEST_LOOT = {
  common: [["bone_chip", 0.9], ["crypt_dust", 0.7], ["ether", 0.5], ["hi_potion", 0.5], ["water_crystal", 0.6], ["iron_ore", 0.4]],
  vault: [["crypt_dust", 1], ["hi_potion", 0.8], ["ether", 0.8], ["iron_ingot", 0.5], ["silk_cloth", 0.5], ["bone_chip", 1], ["moonbloom_seeds", 0.3]],
  king: [["crypt_dust", 1], ["hi_potion", 1], ["ether", 1], ["iron_ingot", 0.8], ["silk_cloth", 0.8]]
};

const NPCS = {
  rhea: { name: "Captain Rhea", model: "rhea", talk: "talkRhea" },
  tobin: { name: "Tobin, Job Master", model: "tobin", talk: "talkTobin" },
  garrick: { name: "Garrick, Smith", model: "garrick", talk: "talkGarrick" },
  trade_board: { name: "Trade Board", prop: "board", talk: "talkBoard" },
  maera: { name: "Maera, Adventurers' Guild", model: "maera", talk: "talkMaera" },
  guard_east: { name: "Gate Guard Aldo", model: "guard", talk: "talkGuard" },
  guard_north: { name: "Harbor Guard Senna", model: "guard_f", talk: "talkGuard" },
  guard_pass: { name: "Harbor Guard Tomas", model: "guard", talk: "talkGuard" },
  odette: { name: "Odette, Furnishings", model: "odette", talk: "talkOdette", shop: "furniture" },
  brann: { name: "Brann, Mercenary Hall", model: "brann", talk: "talkBrann" },
  ysolde: { name: "Ysolde, Stablemaster", model: "ysolde", talk: "talkYsolde" },
  crystal_town: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  chapel_door: { name: "Sealed Chapel Door", prop: "tablet", talk: "talkChapelDoor" },
  ilsa: { name: "Ilsa, Harbor Master", model: "ilsa", talk: "talkIlsa" },
  marn: { name: "Marn, Fishmonger", model: "marn", talk: "talkMarn" },
  crystal_harbor: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
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
  tour_outpost: { name: "Know Your City", giver: "Hale", npc: "v_trade_outpost", lv: 1, check: "tour_outpost", desc: "Walk through all five districts of Ashenreach Outpost: Market, Government, Residential, Industrial and Eastgate.", reward: { xp: 150, gil: 200 },
    intro: "Customers keep asking me where the smithy is, and I've no time to point. Do us both a favour and walk every district of the Outpost once: Market, Government, Residential, Industrial and Eastgate. Then come back and I'll pay you for your time.", progress: "Still some districts you haven't walked. Use the map (M); each district is tinted and named.", turn: "Every street walked. You'll never be lost here now. Take this for your trouble." },
  tour_harbor: { name: "Harbor Rounds", giver: "Marn", npc: "marn", lv: 2, check: "tour_harbor", desc: "Visit all four districts of Saltreach Harbor: the Fish Market, Harbor Square, Shipwrights' Row and the Docks.", reward: { xp: 200, gil: 250 },
    intro: "New to Saltreach? Then you don't know where the best catch lands. Visit the Fish Market, Harbor Square, Shipwrights' Row and the Docks, and tell me what you saw. I'll make it worth your while.", progress: "You've not seen it all yet. The Docks run along the south shore, past the gate halls.", turn: "So you've seen the whole harbor. Good. Now you know where to buy fish." },
  tour_ironvale: { name: "The Ironvale Circuit", giver: "Brisa", npc: "brisa", lv: 3, check: "tour_ironvale", desc: "Visit all five districts of Ironvale: Gate Ward, the Keep, Market Square, South Ward and Smelters' Row.", reward: { xp: 250, gil: 300 },
    intro: "Quartermasters hate being asked for directions. Save us both the trouble: walk the Gate Ward, the Keep, Market Square, the South Ward and Smelters' Row, then report back.", progress: "Not all five yet. Smelters' Row is east, past the gate hall; the Keep is north.", turn: "The whole circuit. Now you know your way around Ironvale." },
  pouches: { name: "Pouches for the Captain", giver: "Captain Rhea", npc: "rhea", lv: 1, desc: "Bring Captain Rhea 3 Goblin Pouches. Goblins in Rocky Hollow carry them.", reward: { xp: 300, gil: 300, item: "multiple_ring" } },
  home: { name: "Make It Home", giver: "Odette", npc: "odette", lv: 1, check: "furniture", desc: "Buy or craft two pieces of furniture and have Pip place them in your residence (the door is on the west house of the Outpost).", reward: { xp: 100, gil: 0, items: [["flowerpot", 1], ["herb_seeds", 2]] },
    intro: "Every adventurer needs somewhere to hang their helm. The cottage by the west wall is yours; my cousin Pip keeps it. Put two pieces of furniture in it and I'll throw in something green for the windowsill.", progress: "Two pieces placed, that's all. Chairs are cheap. Talk to Pip at the cottage to arrange them.", turn: "Two pieces placed! It's a home now. Here, a flowerpot and some herb seeds; Pip will show you how to garden." },
  greenthumb: { name: "Green Thumb", giver: "Pip", npc: "pip", lv: 1, check: "harvest", desc: "Plant a seed in a Flowerpot at your residence, water it through its three stages, and harvest it.", reward: { xp: 150, gil: 0, items: [["wildgrass_seeds", 2]] },
    intro: "You've a flowerpot? Then let's grow something! Plant a seed, water it, and feed it an elemental essence if you have one. It takes a while in real time, so come back. Harvest once and I'll give you some wildgrass seeds.", progress: "Still growing? Water it at every stage; dry plants don't grow.", turn: "A harvest! You've the knack. Wildgrass grows crystals of whichever element you feed it; try these." },
  herbs: { name: "Herbs for the Stall", giver: "Hale", npc: "v_trade_outpost", lv: 1, items: { healing_herb: 3 }, desc: "Bring Hale 3 Healing Herbs for his stall. Meadow Hares and Tunnel Worms in Rocky Hollow carry them.", reward: { xp: 120, gil: 100, items: [["pickaxe", 1], ["hatchet", 1]] },
    intro: "My herb jars are empty and the hares won't deliver. Bring me 3 Healing Herbs and I'll pay in coin and tools. Hares and worms past the east gate carry them.", progress: "Still short on herbs. Hares graze by day; worms are about day and night.", turn: "Fresh herbs! Here's your coin, and a pickaxe and hatchet besides. Hang on to them; the hills are full of ore and timber." },
  nightwings: { name: "Night Wings", giver: "Brann", npc: "brann", lv: 2, kill: { fam: "bat", n: 4, name: "Cave Bat" }, desc: "Defeat 4 Cave Bats for Brann. Bats only come out in Rocky Hollow at night.", reward: { xp: 200, gil: 150 },
    intro: "My recruits keep coming back with bat bites. Cull 4 Cave Bats in the Hollow and I'll pay a bounty. They only fly at night, so bring a light heart.", progress: "Bats still flapping about out there. Night's the time.", turn: "Four bats down. That's a bounty well earned." },
  bones: { name: "Bones in the Ruins", giver: "Captain Rhea", npc: "rhea", lv: 4, pre: "pouches", kill: { fam: "skeleton", n: 5, name: "Wandering Bones" }, desc: "Defeat 5 Wandering Bones. They walk the Old Fort Ruins in eastern Rocky Hollow at night.", reward: { xp: 350, gil: 300, item: "potion", qty: 3 },
    intro: "Something's stirring the dead at the Old Fort Ruins, east along the road. Wandering Bones by night. Put 5 of them back in the ground and report to me.", progress: "The bones still walk. The ruins, at night.", turn: "Five of them laid to rest. You're becoming someone this Outpost can count on." },
  grimtooth: { name: "Grimtooth's Bounty", giver: "Captain Rhea", npc: "rhea", lv: 6, pre: "bones", kill: { fam: "grimtooth", n: 1, name: "Grimtooth" }, desc: "Defeat Grimtooth, the notorious goblin who leads the camp in eastern Rocky Hollow. He appears now and then among the goblins there.", reward: { xp: 500, gil: 400, item: "hi_potion", qty: 2 },
    intro: "There's a goblin called Grimtooth running the camp in the east of the Hollow. Red bandana, black eyes, mean as winter. He shows himself now and then among his gang. Bring him down and the bounty's yours.", progress: "Grimtooth still has his head. Watch the goblin camp; he turns up when a goblin there is replaced.", turn: "Grimtooth, finished. The camp will scatter without him. Take the bounty." },
  hollowking: { name: "The Hollow King", giver: "Captain Rhea", npc: "rhea", lv: 9, pre: "warden", kill: { fam: "hollow_king", n: 1, name: "The Hollow King" }, desc: "Defeat the Hollow King on his throne at the end of the Sunken Crypt, below the Goblin Den's Bone Pit. Light the braziers to pass the gate; the Crypt Sentinel holds the throne door's key.", reward: { xp: 2000, gil: 3000, item: "armigers_lace" },
    intro: "Under the Den's Bone Pit lies the Sunken Crypt, and on its throne sits the thing that stirs the dead: the Hollow King. The old way in is sealed by braziers, and a Sentinel holds the throne key. Bring a full party. End him, and the Outpost will give you its highest honour.", progress: "The King still sits his throne. Braziers first, then the Sentinel's key, then the throne room.", turn: "The Hollow King is dust. Wear this medallion with pride: no one in Ashenreach has earned it before." },
  warden: { name: "The Warden's Vigil", giver: "Captain Rhea", npc: "rhea", lv: 8, pre: "chieftain", kill: { fam: "ossuary_warden", n: 1, name: "Ossuary Warden" }, desc: "Defeat the Ossuary Warden, a notorious ghoul that haunts the Bone Pit of the Goblin Den.", reward: { xp: 800, gil: 800, item: "ether", qty: 3 },
    intro: "With the Chieftain gone, the Den's worst is a ghoul the scouts call the Ossuary Warden. It keeps the Bone Pit. End its vigil and I'll pay well.", progress: "The Warden still haunts the Bone Pit. It appears among the ghouls there.", turn: "The Warden is finished. The dead can rest, and so can you. Here." },
  catchday: { name: "Catch of the Day", giver: "Ilsa", npc: "ilsa", lv: 6, items: { harbor_bream: 3 }, desc: "Bring Ilsa 3 Harbor Bream from Saltreach Harbor's waters.", reward: { xp: 500, gil: 300, item: "sea_rod", qty: 1 },
    intro: "New to the harbor? Everyone here fishes, even me. Show me you can hold a rod: bring me 3 Harbor Bream from the docks and I'll give you a proper sea rod.", progress: "3 Harbor Bream. Cast from the docks; they bite best in rain.", turn: "Nice fish. Here, a real rod. Don't lose it over the side." },
  saltsteel: { name: "Salt and Steel", giver: "Ilsa", npc: "ilsa", lv: 12, kill: { fam: "mire_goblin", n: 5, name: "Mire Goblin" }, desc: "Drive back 5 Mire Goblins that raid the road between the Ashen Marsh and Saltreach Harbor.", reward: { xp: 1600, gil: 800, item: "eremites_ring", qty: 1 },
    intro: "Goblins from Mire Village keep raiding our carts on the marsh road. I can't spare sailors to guard them. Cut down five of the raiders and the harbor will owe you.", progress: "Five Mire Goblins. They roam north of here in the marsh.", turn: "The carts came through clean today. Take this ring; it was my mother's, and she'd want it on someone useful." },
  frozencargo: { name: "Frozen Cargo", giver: "Ilsa", npc: "ilsa", lv: 16, kill: { fam: "frost_goblin", n: 6, name: "Frost Goblin" }, desc: "Drive back 6 Frost Goblins raiding the caravans in Frostspire Pass, east of Saltreach.", reward: { xp: 4000, gil: 1500, item: "bone_mask", qty: 1 },
    intro: "Our ice caravans come down Frostspire Pass, east of the harbor. Goblins in fur coats have started ambushing them. Thin them out (six should do) and I'll see you warmly dressed.", progress: "Six Frost Goblins in Frostspire Pass. They see far in the snow, so pick your fights.", turn: "The caravan made it through. Here, a fur hat. You'll need it up there." },
  silk: { name: "Silk for Sale", giver: "Hale", npc: "v_trade_outpost", lv: 2, kill: { fam: "grass_crawler", n: 6, name: "Grass Crawler" }, desc: "Hale wants crawler silk. Defeat 6 Grass Crawlers in Rocky Hollow.", reward: { xp: 250, gil: 300, item: "bronze_mittens", qty: 1 },
    intro: "Every tailor in the capital wants crawler silk, and the meadow's crawling with the stuff. Literally. Put down six of those big green crawlers and I'll make it worth your while.", progress: "Six Grass Crawlers. They're slow and they won't start a fight, but mind the sticky thread.", turn: "Lovely, lovely. I'll have the cocoons spun by Firesday. Here, a pair of gloves from the first batch." },
  mire: { name: "Into the Mire", giver: "Captain Rhea", npc: "rhea", lv: 10, kill: { fam: "bog_toad", n: 6, name: "Bog Toad" }, desc: "Thin out the Bog Toads in the Ashen Marsh, south of Rocky Hollow.", reward: { xp: 1200, gil: 600, item: "bounding_boots", qty: 1 },
    intro: "Scouts found a road south of the Hollow, sunk into a marsh nobody's mapped. The toads there are big enough to swallow a goblin, and loud enough to wake the dead. Cull six of them so my scouts can work.", progress: "Six Bog Toads. They hunt by sound, so tread lightly until you're ready.", turn: "Quieter already. Take these boots; they're oiled against the bog water." },
  mirelord: { name: "The Mirelord", giver: "Brann", npc: "brann", lv: 13, pre: "mire", kill: { fam: "mirelord_gax", n: 1, name: "Mirelord Gax" }, desc: "Defeat Mirelord Gax, who rules the goblins of Mire Village in the Ashen Marsh.", reward: { xp: 2000, gil: 1200, item: "ether", qty: 3 },
    intro: "Two of my people went into the marsh and came back with stories of a goblin who calls himself the Mirelord. Gax. He's taxing the reed cutters. I'd take it personally if you put an end to that.", progress: "Gax keeps to Mire Village, east of the causeway. He shows himself now and then among his goblins.", turn: "The Mirelord's done? My people will drink to you tonight. Here, you've earned this." },
  thf: { name: "Light Fingers", giver: "Tobin", npc: "tobin", lv: 6, items: { goblin_pouch: 3, bat_wing: 1 }, desc: "Bring Tobin 3 Goblin Pouches and 1 Bat Wing to learn the Thief's trade.", reward: { xp: 300, gil: 0, item: "bronze_dagger", qty: 1, unlock: "THF" },
    intro: "A Thief lives by quick hands and quicker feet: daggers, Steal, Sneak Attack, and a nose for treasure. Prove your hands are light. Lift 3 Goblin Pouches off their owners and bring me a Bat Wing besides.", progress: "3 Goblin Pouches and a Bat Wing. Goblins carry the pouches; bats come out at night.", turn: "Not bad at all. Here's a dagger to start with. Ask me to change jobs whenever you like." },
  mnk: { name: "The Open Hand", giver: "Tobin", npc: "tobin", lv: 6, items: { bone_chip: 2, healing_herb: 3 }, desc: "Bring Tobin 2 Bone Chips and 3 Healing Herbs to begin training as a Monk.", reward: { xp: 300, gil: 0, item: "cesti", qty: 1, unlock: "MNK" },
    intro: "A Monk needs no blade. Fists, Boost and Focus, and Chakra to mend their own wounds. Training starts with a poultice: 3 Healing Herbs, and 2 Bone Chips ground into it. Don't ask why. It works.", progress: "2 Bone Chips from the undead and 3 Healing Herbs.", turn: "Good. Wrap your hands in these and hit things. That's most of it, honestly." },
  rng: { name: "Steady Aim", giver: "Tobin", npc: "tobin", lv: 6, items: { bat_wing: 3, ash_lumber: 2 }, desc: "Bring Tobin 3 Bat Wings and 2 Ash Lumber to learn the Ranger's craft.", reward: { xp: 300, gil: 0, item: "shortbow", qty: 1, unlock: "RNG" },
    intro: "A Ranger fights from afar: bow and arrow, Sharpshot and Barrage, and Shadowbind to pin a foe in place. Fletching starts with good wood and good feathers. Bring me 3 Bat Wings for the fletching and 2 Ash Lumber for the bow.", progress: "3 Bat Wings and 2 Ash Lumber. Woodworkers make lumber from Ash Logs.", turn: "Good wood, fair feathers. Here's your first bow. Keep your distance and let the arrows do the work." },
  drk: { name: "The Shadowed Path", giver: "Tobin", npc: "tobin", lv: 10, items: { crypt_dust: 2, bone_chip: 3 }, desc: "Bring Tobin 2 Crypt Dust and 3 Bone Chips to walk the Dark Knight's path.", reward: { xp: 600, gil: 0, item: "bronze_zaghnal", qty: 1, unlock: "DRK" },
    intro: "A Dark Knight trades a little of their own life for power: scythes, Drain, Blight, and Last Resort. It isn't a path for the careful. Bring me dust from the Sunken Crypt and bones from the restless dead, and I'll show you how it's done.", progress: "2 Crypt Dust and 3 Bone Chips. The Crypt has both; the Wandering Bones carry chips at night.", turn: "You carry the crypt's chill with you now. Take this scythe, and don't let it take you." },
  brd: { name: "A Traveler's Song", giver: "Tobin", npc: "tobin", lv: 10, items: { mire_reed: 3, bat_wing: 2 }, desc: "Bring Tobin 3 Mire Reeds and 2 Bat Wings so he can teach you the Bard's songs.", reward: { xp: 600, gil: 0, item: "robe", qty: 1, unlock: "BRD" },
    intro: "Bards fight with a dagger in one hand and a song in the other. Their songs lift the whole party: sharper blades, faster swings, wounds that close on their own. I'll teach you, but I need reeds for a pipe and bat wings for the drum skin.", progress: "3 Mire Reeds from the Ashen Marsh and 2 Bat Wings. Bats come out at night.", turn: "Listen to that. A little shaky, but it carries. Here's a coat fit for the road." },
  smn: { name: "The Calling", giver: "Tobin", npc: "tobin", lv: 6, items: { fire_crystal: 2, wind_crystal: 2, healing_herb: 2 }, desc: "Bring Tobin 2 Fire Essences, 2 Wind Essences and 2 Healing Herbs to learn to call sprites.", reward: { xp: 300, gil: 0, item: "ash_staff", qty: 1, unlock: "SMN" },
    intro: "A Summoner calls elemental sprites to fight for them. The sprites drink your MP while they're out, so mind it. To make the first calling, I'll need 2 Fire Essences, 2 Wind Essences, and 2 Healing Herbs to calm the sprite afterward.", progress: "2 Fire Essences, 2 Wind Essences and 2 Healing Herbs.", turn: "Listen... there. A spark answered. Take this staff and call it with Ember Sprite." },
  support: { name: "A Second Calling", giver: "Tobin", npc: "tobin", lv: 10, desc: "Reach level 10, then bring Tobin 2 Bat Wings and 1 Worm Silk. Bats only come out at night.", reward: { xp: 300, gil: 0 } },
  riding: { name: "Riding License", giver: "Ysolde", npc: "ysolde", lv: 20, desc: "Reach level 20, then bring Ysolde 300 crystals and 3 Healing Herbs. Hares and worms in Rocky Hollow drop herbs.", reward: { xp: 200, gil: 0 } },
  pld: { name: "The Oath of Steel", giver: "Tobin", npc: "tobin", lv: 6, desc: "Reach level 6, then bring Tobin 2 Bone Chips and 1 Iron Ore to take the Paladin's oath. Undead drop bone; goblin raiders in the Den carry iron.", reward: { xp: 400, gil: 0, unlock: "PLD" } },
  rdm: { name: "Scarlet Lessons", giver: "Tobin", npc: "tobin", lv: 6, desc: "Reach level 6, then bring Tobin 2 Worm Silk, 1 Fire Essence and 1 Water Essence to study the Red Mage's arts.", reward: { xp: 400, gil: 0, unlock: "RDM" } },
  chieftain: { name: "The Goblin Chieftain", giver: "Captain Rhea", npc: "rhea", lv: 7, pre: "bones", desc: "Defeat the Goblin Chieftain at the back of the Goblin Den, then report to Captain Rhea.", reward: { xp: 900, gil: 1500, item: "ether", qty: 3 } }
};

const FURNITURE_MODELS = { pot: { w: 1, h: 1 }, bed: { w: 2, h: 3 }, table: { w: 2, h: 2 }, chair: { w: 1, h: 1 }, chest: { w: 1, h: 1 }, wardrobe: { w: 2, h: 1 }, bookshelf: { w: 2, h: 1 }, plant: { w: 1, h: 1 }, lamp: { w: 1, h: 1 }, rug: { w: 2, h: 2, flat: true }, hearth: { w: 2, h: 1 }, totem: { w: 1, h: 1 } };

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
ZONES.ironvale = {
  name: "Ironvale", w: 1800, h: 1400, safe: true, theme: "town", palette: "snow", city: "Ironvale", cityStyle: "mountain", paved: true, outerWall: true,
  districts: [
    { id: "gate", name: "Gate Ward", x: 24, y: 24, w: 536, h: 1352, color: "#9aa4ac", icon: "🛡️" },
    { id: "keep", name: "The Keep", x: 560, y: 24, w: 680, h: 336, color: "#5a7090", icon: "🏰" },
    { id: "market", name: "Market Square", x: 560, y: 360, w: 680, h: 640, color: "#d8a838", icon: "⚖️" },
    { id: "south", name: "South Ward", x: 560, y: 1000, w: 680, h: 376, color: "#6fae5a", icon: "🏡" },
    { id: "forge", name: "Smelters' Row", x: 1240, y: 24, w: 536, h: 1352, color: "#c4703a", icon: "⚒️" }
  ],
  cityWalls: [[560, 24, 560, 1376], [1240, 24, 1240, 1376], [560, 360, 1240, 360], [560, 1000, 1240, 1000]],
  gates: [
    { x: 560, y: 200, a: "gate", b: "keep" }, { x: 560, y: 700, a: "gate", b: "market" }, { x: 560, y: 1200, a: "gate", b: "south" },
    { x: 1240, y: 200, a: "keep", b: "forge" }, { x: 1240, y: 700, a: "market", b: "forge" }, { x: 1240, y: 1200, a: "south", b: "forge" },
    { x: 900, y: 360, a: "keep", b: "market", horiz: true }, { x: 900, y: 1000, a: "market", b: "south", horiz: true }
  ],
  exits: [{ x: 0, y: 650, w: 24, h: 100, to: "frost", tx: 2900, ty: 1130, label: "Frostspire Pass" }, { x: 850, y: 1376, w: 100, h: 24, to: "sunscar", tx: 1500, ty: 120, label: "Sunscar Desert" }],
  props: [{ type: "crates", x: 1460, y: 860, r: 30 }, { type: "barrels", x: 1460, y: 300, r: 26 }, { type: "anvil", x: 1520, y: 590, rot: 0.3, r: 26 }],
  ambient: [{ type: "walker", x: 900, y: 680, n: 1, path: [[780, 560], [1020, 560], [1020, 800], [780, 800]] }, { type: "walker", x: 1380, y: 700, n: 1, path: [[1380, 150], [1380, 1250]] }, { type: "dog", x: 900, y: 680, n: 1, r: 120, col: 0x5a4a3a }],
  npcs: [
    { id: "brisa", x: 1150, y: 300, home: 0, sleep: [22, 6] }, { id: "haldor", x: 1480, y: 620, home: 1, sleep: [21, 5] }, { id: "auction_ironvale", x: 726, y: 531 }, { id: "barber_ironvale", x: 1200, y: 631 }, { id: "job_ironvale", x: 820, y: 560 }, { id: "stable_ironvale", x: 1350, y: 760 },
    { id: "crystal_ironvale", x: 900, y: 680 }, { id: "trade_board", x: 1040, y: 560 }, { id: "guard_ironvale", x: 200, y: 620 }
  ],
  spawns: [],
  water: [],
  plaza: { x: 900, y: 680, r: 150 },
  paths: [
    { w: 50, pts: [[-500, 700], [0, 700], [1700, 700]] },
    { w: 40, pts: [[900, 270], [900, 1400], [900, 1900]] },
    { w: 36, pts: [[450, 100], [450, 1300]] },
    { w: 36, pts: [[450, 200], [560, 200]] },
    { w: 36, pts: [[450, 1200], [1380, 1200]] },
    { w: 36, pts: [[1240, 200], [1380, 200]] },
    { w: 36, pts: [[1380, 100], [1380, 1300]] }
  ],
  houses: [
    { x: 900, y: 160, w: 320, h: 150, type: "keep", floors: 3, flag: "#90a4ae" }, { x: 1600, y: 540, w: 200, h: 110, type: "forge", floors: 1, sign: "Mythrilsmith", signCol: "#7ad0ff" },
    { x: 1600, y: 260, w: 220, h: 120, type: "smelter" }, { x: 1600, y: 1000, w: 220, h: 120, type: "smelter" },
    { x: 690, y: 470, w: 150, h: 90, type: "auction", sign: "Auction House", flag: "#c9a227" }, { x: 1110, y: 470, w: 150, h: 90, type: "shop", sign: "General Store", awning: "#37474f" }, { x: 1110, y: 900, w: 150, h: 90, type: "hall", floors: 3, sign: "Anvil & Ale", signCol: "#ff9a40" },
    { x: 250, y: 200, w: 150, h: 110, type: "home" }, { x: 250, y: 400, w: 140, h: 100, type: "home", floors: 3 }, { x: 250, y: 560, w: 140, h: 90, type: "guard", flag: "#90a4ae" }, { x: 250, y: 880, w: 140, h: 100, type: "home" }, { x: 250, y: 1100, w: 150, h: 110, type: "home" }, { x: 250, y: 1290, w: 150, h: 90, type: "home" },
    { x: 750, y: 1300, w: 120, h: 100, type: "home", floors: 3 }, { x: 1050, y: 1300, w: 110, h: 100, type: "warehouse", floors: 2 }, { x: 1600, y: 820, w: 180, h: 90, type: "warehouse", floors: 1 }
  ],
  stalls: [{ x: 1000, y: 820, color: "#5d4037" }, { x: 800, y: 820, color: "#37474f" }, { x: 1200, y: 640, color: "#c0392b", sign: "Barber", pole: true }],
  mines: [[1690, 1250, -Math.PI / 2]],
  benches: [[760, 760, 1.57], [1040, 760, -1.57]],
  lamps: [[780, 560], [1020, 560], [780, 800], [1020, 800], [450, 700], [1380, 700], [900, 1100], [900, 300]],
  start: { x: 900, y: 800 }
};

Object.assign(FAMILIES, {
  dune_lizard: tierFam("hill_lizard", { name: "Dune Lizard", color: "#c8a070", tint: 0xc8a070, tint2: 0xf0dcb0, hpMul: 1.15, attMul: 1.05, weak: { ice: 1.35, water: 1.2 }, loot: [["lizard_skin", 0.4], ["fire_crystal", 0.25], ["hi_potion", 0.06]] }),
  sand_crab: tierFam("pond_crab", { name: "Sand Crab", color: "#d8b880", tint: 0xd8b880, hpMul: 1.2, weak: { water: 1.3, lightning: 1.2 }, loot: [["crab_shell", 0.4], ["earth_crystal", 0.25], ["hi_potion", 0.06]] }),
  sun_wasp: tierFam("honey_bee", { name: "Sun Wasp", color: "#ffc040", tint: 0xffc040, tint2: 0x6a3a10, attMul: 1.1, weak: { ice: 1.4 }, loot: [["honeycomb", 0.3], ["fire_crystal", 0.25], ["hi_potion", 0.06]] }),
  dune_worm: tierFam("worm", { name: "Dune Worm", color: "#c8a878", tint: 0xc8a878, hpMul: 1.4, attMul: 1.05, weak: { water: 1.35 }, loot: [["worm_silk", 0.35], ["earth_crystal", 0.3], ["hi_potion", 0.06]] }),
  cinder_bomb: tierFam("bomb", { name: "Cinder Bomb", color: "#ff7043", hpMul: 1.15, weak: { water: 1.4, ice: 1.3 }, loot: [["bomb_ash", 0.4], ["fire_crystal", 0.35], ["hi_potion", 0.06]] })
});
NM_FAMILIES.sandmaw = { hint: "Singing Dunes, Sunscar Desert · any time", base: "worm", name: "Sandmaw", hpMul: 3.0, attMul: 1.15, scale: 1.8, aura: "#ffb74d", loot: [["garrison_boots", 0.35], ["worm_silk", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 480 };
ZONES.sunscar = {
  name: "Sunscar Desert", w: 3000, h: 2200, theme: "field", palette: "desert",
  exits: [{ x: 1450, y: 0, w: 100, h: 24, to: "ironvale", tx: 750, ty: 980, label: "Ironvale" }, { x: 2976, y: 950, w: 24, h: 100, to: "cinder", tx: 120, ty: 1200, label: "Cinder Peak" }, { x: 2600, y: 600, w: 40, h: 30, to: "spire1", tx: 110, ty: 400, label: "Red Spire", kind: "door", ask: "Climb into the Red Spire?" }, { x: 380, y: 1480, w: 40, h: 40, to: "mirage", tx: 110, ty: 500, label: "Mirage", kind: "door", weather: "sandstorm", ask: "Step into the shimmering mirage?" }],
  npcs: [],
  walls: [{ x: 600, y: 480, w: 300, h: 220 }, { x: 2000, y: 380, w: 260, h: 300 }, { x: 1250, y: 1500, w: 380, h: 200 }, { x: 2400, y: 1600, w: 240, h: 260 }],
  ruins: { walls: [[2520, 420, 2680, 420, 2.4], [2520, 420, 2520, 560, 1.6]], pillars: [[860, 1050, 3.6], [910, 1000, 4.4], [960, 1050, 4.0], [1010, 1100, 3.0], [820, 1120, 2.2]] },
  landmarks: [
    { id: "gate", name: "Sunscar Gate", x: 1500, y: 300, r: 200, xp: 60 },
    { id: "ribs", name: "Titan's Ribs", x: 920, y: 1080, r: 250, xp: 80 },
    { id: "oasis", name: "Glass Oasis", x: 2200, y: 1100, r: 260, xp: 80 },
    { id: "dunes", name: "Singing Dunes", x: 600, y: 1800, r: 280, xp: 90 },
    { id: "spire", name: "Red Spire", x: 2600, y: 520, r: 220, xp: 90 }
  ],
  spawns: [
    { fam: "dune_lizard", lv: [17, 18], x: 1100, y: 600 }, { fam: "dune_lizard", lv: [17, 19], x: 1800, y: 700, nm: { id: "air_elemental", lv: 21, chance: 0.07 } }, { fam: "dune_lizard", lv: [18, 19], x: 400, y: 1100 }, { fam: "dune_lizard", lv: [18, 20], x: 2700, y: 1100 },
    { fam: "sand_crab", lv: [17, 18], x: 2000, y: 1300 }, { fam: "sand_crab", lv: [18, 19], x: 2450, y: 1250 }, { fam: "sand_crab", lv: [18, 19], x: 1950, y: 900 },
    { fam: "sun_wasp", lv: [17, 18], x: 1400, y: 900, time: "day" }, { fam: "sun_wasp", lv: [18, 19], x: 2300, y: 800, time: "day" }, { fam: "sun_wasp", lv: [18, 19], x: 700, y: 1400, time: "day" },
    { fam: "dune_worm", lv: [18, 19], x: 1300, y: 1250 }, { fam: "dune_worm", lv: [18, 20], x: 900, y: 1700 }, { fam: "dune_worm", lv: [19, 20], x: 500, y: 1950, nm: { id: "sandmaw", lv: 21, chance: 0.12 } },
    { fam: "cactus", lv: [17, 18], x: 1700, y: 1700 }, { fam: "cactus", lv: [18, 19], x: 2100, y: 1900 }, { fam: "cactus", lv: [18, 20], x: 2700, y: 1900 }, { fam: "cactus", lv: [19, 20], x: 300, y: 600 },
    { fam: "cinder_bomb", lv: [18, 19], x: 1600, y: 1100, time: "night" }, { fam: "cinder_bomb", lv: [19, 20], x: 2600, y: 800, time: "night" }, { fam: "cinder_bomb", lv: [19, 20], x: 1000, y: 400, time: "night" },
    { fam: "skeleton", lv: [18, 19], x: 930, y: 1250, time: "night" }
  ],
  water: [{ x: 2200, y: 1100, r: 150 }],
  paths: [
    { w: 44, pts: [[1500, -500], [1500, 0], [1500, 400], [1300, 800], [920, 1080], [700, 1600], [600, 1800]] },
    { w: 34, pts: [[1300, 800], [1800, 1000], [2060, 1050]] },
    { w: 30, pts: [[1800, 1000], [2300, 700], [2600, 560]] },
    { w: 30, pts: [[2600, 560], [2850, 850], [3000, 1000], [3500, 1000]] }
  ],
  gather: {
    mining: { n: 3, at: [[700, 800], [2300, 400], [1700, 1900], [2800, 1500], [400, 1500]], loot: [["iron_ore", 0.4], ["copper_ore", 0.3], ["fire_crystal", 0.15], ["earth_crystal", 0.15]] },
    harvesting: { n: 3, at: [[2100, 1300], [2350, 950], [1200, 1100], [800, 1950]], loot: [["cactus_needle", 0.5], ["healing_herb", 0.3], ["fire_crystal", 0.12]] }
  },
  start: { x: 1500, y: 100 }
};

Object.assign(FAMILIES, {
  vine_crawler: tierFam("grass_crawler", { name: "Vine Crawler", color: "#3a7a2a", tint: 0x3a7a2a, tint2: 0xa8d060, hpMul: 1.2, attMul: 1.05, weak: { fire: 1.4 }, loot: [["crawler_cocoon", 0.4], ["worm_silk", 0.3], ["wind_crystal", 0.2], ["hi_potion", 0.06]] }),
  jade_hornet: tierFam("honey_bee", { name: "Jade Hornet", color: "#4caf50", tint: 0x4caf50, tint2: 0x1b3a1b, attMul: 1.12, weak: { ice: 1.3 }, loot: [["honeycomb", 0.35], ["wind_crystal", 0.25], ["hi_potion", 0.06]] }),
  jungle_sapling: tierFam("sapling", { name: "Strangler Sapling", color: "#2e6b2e", tint: 0x5e5a30, tint2: 0x2e6b2e, scale: 0.36, hpMul: 1.25, attMul: 1.1, aggro: { sight: 140 }, weak: { fire: 1.5 }, loot: [["heartwood", 0.15], ["ash_log", 0.4], ["earth_crystal", 0.2], ["hi_potion", 0.06]] }),
  bloom_mandrake: tierFam("mandrake", { name: "Bloom Mandrake", color: "#d070a0", tint: 0xd070a0, tint2: 0x2e6b2e, hpMul: 1.2, loot: [["mandrake_leaf", 0.5], ["healing_herb", 0.3], ["hi_potion", 0.06]] }),
  jade_toad: tierFam("bog_toad", { name: "Jade Toad", color: "#5aa05a", hpMul: 1.2, attMul: 1.05, loot: [["toad_oil", 0.4], ["water_crystal", 0.25], ["hi_potion", 0.06]] })
});
NM_FAMILIES.old_mossback = { hint: "Heart of the Canopy, Verdant Jungle · any time", base: "treant_elder", name: "Old Mossback", hpMul: 3.0, attMul: 1.15, scale: 1.6, aura: "#9ccc65", loot: [["breath_mantle", 0.35], ["heartwood", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 480 };
ZONES.verdant = {
  name: "Verdant Jungle", w: 3000, h: 2400, theme: "field", palette: "jungle", mist: true, vegK: 1.6,
  exits: [{ x: 0, y: 1100, w: 24, h: 100, to: "marsh", tx: 2700, ty: 750, label: "Ashen Marsh" }, { x: 2700, y: 2100, w: 40, h: 30, to: "underdeep", tx: 110, ty: 450, label: "Underdeep", kind: "door", ask: "Climb down into the Underdeep?" }],
  npcs: [],
  walls: [{ x: 800, y: 400, w: 260, h: 220 }, { x: 1900, y: 300, w: 300, h: 240 }, { x: 1400, y: 1700, w: 360, h: 200 }, { x: 2500, y: 1500, w: 220, h: 300 }],
  ruins: { walls: [[2200, 1000, 2420, 1000, 3.0], [2200, 1000, 2200, 1200, 2.4], [2420, 1000, 2420, 1150, 1.8], [2260, 1250, 2420, 1250, 1.2]], pillars: [[2310, 1100, 4.0], [2150, 900, 3.0], [2480, 1300, 2.6]] },
  landmarks: [
    { id: "mouth", name: "Green Mouth", x: 350, y: 1150, r: 220, xp: 60 },
    { id: "falls", name: "Hanging Falls", x: 1200, y: 800, r: 240, xp: 80 },
    { id: "temple", name: "Overgrown Temple", x: 2300, y: 1100, r: 250, xp: 90 },
    { id: "canopy", name: "Heart of the Canopy", x: 1500, y: 1350, r: 260, xp: 90 },
    { id: "ferns", name: "Fern Hollow", x: 700, y: 1900, r: 240, xp: 80 }
  ],
  spawns: [
    { fam: "vine_crawler", lv: [17, 18], x: 600, y: 900 }, { fam: "vine_crawler", lv: [18, 19], x: 1000, y: 1500 }, { fam: "vine_crawler", lv: [18, 19], x: 2700, y: 700 },
    { fam: "jade_hornet", lv: [18, 19], x: 1300, y: 500, time: "day" }, { fam: "jade_hornet", lv: [18, 20], x: 2000, y: 900, time: "day", nm: { id: "thunder_elemental", lv: 21, chance: 0.07, time: "day" } },
    { fam: "jungle_sapling", lv: [18, 19], x: 1700, y: 1100 }, { fam: "jungle_sapling", lv: [19, 20], x: 1500, y: 1250, nm: { id: "old_mossback", lv: 21, chance: 0.12 } }, { fam: "jungle_sapling", lv: [18, 20], x: 2600, y: 2000 },
    { fam: "bloom_mandrake", lv: [17, 18], x: 500, y: 1700, time: "day" }, { fam: "bloom_mandrake", lv: [18, 19], x: 900, y: 2050, time: "day" },
    { fam: "jade_toad", lv: [18, 19], x: 1150, y: 1000 }, { fam: "jade_toad", lv: [18, 20], x: 2100, y: 1900 },
    { fam: "birdfolk", lv: [19, 20], x: 2300, y: 1400 }, { fam: "birdfolk", lv: [19, 20], x: 2450, y: 1350 }
  ],
  water: [{ x: 1200, y: 950, r: 130 }, { x: 2050, y: 1950, r: 110 }, { x: 600, y: 1450, r: 90 }],
  paths: [
    { w: 40, pts: [[-500, 1150], [0, 1150], [600, 1150], [1000, 1250], [1500, 1350], [1900, 1250], [2200, 1150]] },
    { w: 30, pts: [[1000, 1250], [1050, 800], [1300, 650]] },
    { w: 30, pts: [[1500, 1350], [1100, 1700], [700, 1900]] }
  ],
  gather: {
    logging: { n: 3, at: [[400, 600], [1600, 600], [2700, 1100], [800, 2200], [2200, 2200]], loot: [["ash_log", 0.6], ["heartwood", 0.08], ["wind_crystal", 0.15]] },
    harvesting: { n: 3, at: [[700, 1300], [1300, 1100], [1800, 1600], [2500, 900]], loot: [["healing_herb", 0.6], ["mandrake_leaf", 0.2], ["water_crystal", 0.12]] }
  },
  start: { x: 100, y: 1150 }
};

Object.assign(FAMILIES, {
  magma_lizard: tierFam("hill_lizard", { name: "Magma Lizard", color: "#c0402a", tint: 0x8a2a1a, tint2: 0xff8a40, hpMul: 1.25, attMul: 1.1, weak: { water: 1.4, ice: 1.3 }, loot: [["lizard_skin", 0.4], ["fire_crystal", 0.35], ["hi_potion", 0.07]] }),
  obsidian_crab: tierFam("pond_crab", { name: "Obsidian Crab", color: "#3a3440", tint: 0x2a2630, hpMul: 1.3, defMul: 1.4, weak: { water: 1.3, lightning: 1.25 }, loot: [["crab_shell", 0.4], ["earth_crystal", 0.25], ["hi_potion", 0.07]] }),
  magma_worm: tierFam("worm", { name: "Magma Worm", color: "#a03a20", tint: 0xa03a20, hpMul: 1.45, attMul: 1.1, weak: { water: 1.4 }, loot: [["worm_silk", 0.3], ["fire_crystal", 0.35], ["hi_potion", 0.07]] }),
  ash_orc: tierFam("orc_grunt", { name: "Ashen Orc", color: "#6a6a6a", hpMul: 1.3, attMul: 1.15, loot: [["orc_tooth", 0.4], ["fire_crystal", 0.25], ["hi_potion", 0.08]] }),
  cinder_bones: tierFam("skeleton", { name: "Cinder Bones", color: "#5a4a44", hpMul: 1.25, attMul: 1.1, weak: { light: 1.5, water: 1.2 }, loot: [["bone_chip", 0.45], ["fire_crystal", 0.25], ["hi_potion", 0.07]] })
});
NM_FAMILIES.pyreclaw = { hint: "Crater Rim, Cinder Peak · night", base: "hill_lizard", name: "Pyreclaw", hpMul: 3.2, attMul: 1.2, scale: 2.0, aura: "#ff5722", loot: [["bone_ring", 0.35], ["lizard_skin", 1], ["fire_crystal", 1], ["hi_potion", 0.5]], respawn: 540 };
ZONES.cinder = {
  name: "Cinder Peak", w: 2800, h: 2400, theme: "field", palette: "volcanic",
  exits: [{ x: 0, y: 1150, w: 24, h: 100, to: "sunscar", tx: 2900, ty: 1000, label: "Sunscar Desert" }],
  npcs: [],
  walls: [{ x: 700, y: 400, w: 280, h: 260 }, { x: 1800, y: 1500, w: 300, h: 260 }, { x: 600, y: 1800, w: 360, h: 180 }, { x: 2300, y: 1100, w: 220, h: 300 }],
  ruins: { walls: [[1700, 450, 1900, 450, 2.0], [1900, 450, 1900, 600, 1.4]], pillars: [[1650, 520, 3.0], [1950, 380, 2.4]] },
  landmarks: [
    { id: "ashfall", name: "Ashfall Road", x: 400, y: 1200, r: 220, xp: 60 },
    { id: "steps", name: "Obsidian Steps", x: 1100, y: 800, r: 240, xp: 80 },
    { id: "lake", name: "Molten Lake", x: 1400, y: 1300, r: 280, xp: 90 },
    { id: "rim", name: "Crater Rim", x: 2300, y: 600, r: 260, xp: 100 },
    { id: "vent", name: "Smoking Vent", x: 1200, y: 2000, r: 220, xp: 80 }
  ],
  spawns: [
    { fam: "magma_lizard", lv: [18, 19], x: 700, y: 1000, nm: { id: "fire_elemental", lv: 22, chance: 0.07 } }, { fam: "magma_lizard", lv: [19, 20], x: 1700, y: 900 }, { fam: "magma_lizard", lv: [19, 20], x: 2400, y: 500, nm: { id: "pyreclaw", lv: 22, chance: 0.12, time: "night" } },
    { fam: "obsidian_crab", lv: [18, 19], x: 1100, y: 1500 }, { fam: "obsidian_crab", lv: [19, 20], x: 1700, y: 1250 },
    { fam: "magma_worm", lv: [18, 20], x: 1000, y: 2050 }, { fam: "magma_worm", lv: [19, 20], x: 1500, y: 1900 },
    { fam: "ash_orc", lv: [19, 20], x: 2100, y: 1900 }, { fam: "ash_orc", lv: [19, 20], x: 2250, y: 1950 },
    { fam: "cinder_bomb", lv: [18, 20], x: 1300, y: 600, time: "night" }, { fam: "cinder_bones", lv: [19, 20], x: 1800, y: 500, time: "night" }
  ],
  water: [{ x: 1400, y: 1300, r: 190 }, { x: 2150, y: 750, r: 110 }],
  paths: [
    { w: 40, pts: [[-500, 1200], [0, 1200], [500, 1200], [900, 950], [1100, 800], [1500, 700], [1900, 700], [2200, 600]] },
    { w: 30, pts: [[500, 1200], [900, 1600], [1200, 2000]] }
  ],
  gather: {
    mining: { n: 4, at: [[500, 700], [1300, 950], [2000, 1200], [900, 2200], [2500, 1800], [1600, 1700]], loot: [["iron_ore", 0.45], ["copper_ore", 0.2], ["fire_crystal", 0.25], ["earth_crystal", 0.1]] }
  },
  start: { x: 100, y: 1200 }
};

Object.assign(FAMILIES, {
  reef_crab: tierFam("pond_crab", { name: "Reef Crab", color: "#e07a5a", tint: 0xe07a5a, hpMul: 1.1, weak: { lightning: 1.3 }, loot: [["crab_shell", 0.45], ["water_crystal", 0.25], ["potion", 0.08]] }),
  shore_lizard: tierFam("hill_lizard", { name: "Shore Lizard", color: "#7a9a6a", tint: 0x7a9a6a, tint2: 0xe8dcb0, loot: [["lizard_skin", 0.4], ["wind_crystal", 0.2], ["potion", 0.08]] }),
  gale_talon: tierFam("birdfolk", { name: "Gale Talon", color: "#e8e0d0", loot: [["crag_feather", 0.4], ["wind_crystal", 0.25], ["hi_potion", 0.05]] }),
  isle_snapper: tierFam("lake_snapper", { name: "Isle Snapper", color: "#4a8aa0", tint: 0x4a8aa0, loot: [["harbor_bream", 0.3], ["water_crystal", 0.3], ["potion", 0.08]] })
});
NM_FAMILIES.old_saltjaw = { hint: "Wreck Cove, Gull Isle · any time", base: "lake_snapper", name: "Old Saltjaw", hpMul: 2.8, attMul: 1.1, scale: 1.9, aura: "#4fc3f7", loot: [["valor_earring", 0.35], ["harbor_bream", 1], ["water_crystal", 1], ["hi_potion", 0.4]], respawn: 420 };
ZONES.gullisle = {
  name: "Gull Isle", w: 2200, h: 1800, theme: "field", palette: "beach", island: true,
  exits: [],
  npcs: [{ id: "ferry_isle", x: 380, y: 900 }, { id: "wend", x: 600, y: 760 }],
  ambient: [{ type: "gull", x: 1100, y: 900, n: 6, r: 500 }, { type: "gull", x: 400, y: 900, n: 3, r: 160 }],
  walls: [{ x: 1300, y: 500, w: 240, h: 200 }, { x: 900, y: 1200, w: 200, h: 160 }],
  ruins: { walls: [[1600, 1250, 1760, 1300, 1.2], [1760, 1300, 1820, 1420, 0.8]], pillars: [[1700, 1200, 2.2]] },
  landmarks: [
    { id: "dock", name: "Gull Isle Landing", x: 420, y: 900, r: 200, xp: 50 },
    { id: "lookout", name: "Gullsrest Cliffs", x: 1400, y: 380, r: 220, xp: 70 },
    { id: "cove", name: "Wreck Cove", x: 1700, y: 1350, r: 240, xp: 80 },
    { id: "grove", name: "Palm Grove", x: 1000, y: 900, r: 240, xp: 60 }
  ],
  spawns: [
    { fam: "reef_crab", lv: [12, 13], x: 700, y: 1250 }, { fam: "reef_crab", lv: [13, 14], x: 1500, y: 1500 },
    { fam: "shore_lizard", lv: [12, 14], x: 1000, y: 600 }, { fam: "shore_lizard", lv: [13, 14], x: 1200, y: 1100 },
    { fam: "gale_talon", lv: [14, 15], x: 1550, y: 450 }, { fam: "gale_talon", lv: [14, 16], x: 1700, y: 650 },
    { fam: "fishfolk", lv: [14, 15], x: 1650, y: 1150, nm: { id: "water_elemental", lv: 17, chance: 0.07 } }, { fam: "isle_snapper", lv: [14, 16], x: 1800, y: 1300, nm: { id: "old_saltjaw", lv: 17, chance: 0.12 } }
  ],
  water: [{ x: -380, y: 900, r: 620 }, { x: 2600, y: 900, r: 640 }, { x: 1100, y: -460, r: 760 }, { x: 1100, y: 2260, r: 760 }, { x: -200, y: -200, r: 600 }, { x: 2400, y: -200, r: 600 }, { x: -200, y: 2000, r: 600 }, { x: 2400, y: 2000, r: 600 }],
  paths: [
    { w: 36, pts: [[380, 900], [700, 880], [1000, 900], [1300, 1000], [1650, 1250]] },
    { w: 28, pts: [[1000, 900], [1200, 700], [1400, 450]] }
  ],
  gather: {
    logging: { n: 2, at: [[900, 700], [1100, 1050], [800, 1000]], loot: [["ash_log", 0.6], ["wind_crystal", 0.15]] },
    harvesting: { n: 2, at: [[1200, 850], [700, 700], [1500, 1000]], loot: [["healing_herb", 0.6], ["water_crystal", 0.15]] }
  },
  start: { x: 420, y: 900 }
};

FAMILIES.spire_warden = Object.assign({}, FAMILIES.hollow_king, { name: "Spire Warden", color: "#ff7043", hpMul: 4.6, attMul: 1.4, defMul: 1.35, scale: 1.9, aura: "#ff7043", tpMove: { name: "Spire Collapse", mul: 2.3, aoe: 110 }, weak: { water: 1.35, light: 1.2 }, respawn: 900, loot: [["lucent_sword", 0.3], ["variable_cape", 0.3], ["hi_potion", 1], ["ether", 1], ["fire_crystal", 1]], gil: [80, 110] });
Object.assign(ITEMS, {
});
const SPIRE_FLOORS = [
  { lv: [17, 18], fams: ["cinder_bones", "magma_lizard", "obsidian_crab"] },
  { lv: [18, 19], fams: ["cinder_bones", "ash_orc", "cinder_bomb"] },
  { lv: [19, 20], fams: ["ash_orc", "magma_lizard", "cinder_bomb"] },
  { lv: [20, 21], fams: ["cinder_bones", "ash_orc", "obsidian_crab"] }
];
SPIRE_FLOORS.forEach((F, i) => {
  const id = "spire" + (i + 1), up = i < SPIRE_FLOORS.length - 1 ? "spire" + (i + 2) : "spire_top";
  const down = i ? "spire" + i : "sunscar";
  ZONES[id] = {
    name: "Red Spire, Floor " + (i + 1), w: 1000, h: 800, theme: "crypt",
    exits: [{ x: 0, y: 350, w: 24, h: 100, to: down, tx: i ? 880 : 2620, ty: i ? 400 : 660, label: i ? "Floor " + i : "Sunscar Desert" }, { x: 976, y: 350, w: 24, h: 100, to: up, tx: 110, ty: 400, label: up === "spire_top" ? "Summit" : "Floor " + (i + 2) }],
    npcs: [],
    walls: [{ x: 0, y: 0, w: 1000, h: 70 }, { x: 0, y: 730, w: 1000, h: 70 }, { x: 420, y: 180, w: 160, h: 120 }, { x: 420, y: 500, w: 160, h: 120 }],
    pillars: [[300, 250], [300, 550], [700, 250], [700, 550]],
    spawns: F.fams.map((f, k) => ({ fam: f, lv: F.lv, x: 260 + k * 240, y: k % 2 ? 560 : 240 })).concat([{ fam: F.fams[0], lv: F.lv, x: 760, y: 400 }]),
    landmarks: [],
    start: { x: 110, y: 400 }
  };
});
ZONES.spire_top = {
  name: "Red Spire Summit", w: 1000, h: 900, theme: "crypt",
  exits: [{ x: 0, y: 400, w: 24, h: 100, to: "spire4", tx: 880, ty: 400, label: "Floor 4" }],
  npcs: [],
  walls: [{ x: 0, y: 0, w: 260, h: 200 }, { x: 0, y: 700, w: 260, h: 200 }, { x: 740, y: 0, w: 260, h: 200 }, { x: 740, y: 700, w: 260, h: 200 }],
  pillars: [[380, 300], [380, 600], [620, 300], [620, 600]],
  spawns: [{ fam: "spire_warden", lv: [23, 23], x: 650, y: 450 }],
  landmarks: [{ id: "summit", name: "Red Spire Summit", x: 500, y: 450, r: 260, xp: 150 }],
  start: { x: 110, y: 450 }
};

Object.assign(FAMILIES, {
  glow_bat: tierFam("bat", { name: "Glow Bat", color: "#4dd0e1", tint: 0x2a6a7a, hpMul: 1.15, attMul: 1.05, loot: [["bat_wing", 0.45], ["water_crystal", 0.25], ["hi_potion", 0.06]] }),
  pale_crab: tierFam("pond_crab", { name: "Pale Crab", color: "#d8e0e8", tint: 0xd8e0e8, hpMul: 1.2, weak: { lightning: 1.3 }, loot: [["crab_shell", 0.45], ["water_crystal", 0.25], ["hi_potion", 0.06]] }),
  lumicap: tierFam("shroomling", { name: "Lumicap", color: "#80deea", hpMul: 1.25, attMul: 1.05, weak: { fire: 1.4 }, loot: [["glowcap", 0.45], ["light_crystal", 0.2], ["hi_potion", 0.06]] }),
  deep_worm: tierFam("worm", { name: "Deep Worm", color: "#8a8098", tint: 0x8a8098, hpMul: 1.45, attMul: 1.08, loot: [["worm_silk", 0.35], ["dark_crystal", 0.2], ["hi_potion", 0.06]] })
});
NM_FAMILIES.lumicap_matron = { hint: "Glimmer Grotto, Underdeep · any time", base: "shroomling", name: "Lumicap Matron", hpMul: 3.0, attMul: 1.12, scale: 2.2, aura: "#80deea", loot: [["mecurial_earring", 0.35], ["glowcap", 1], ["hi_potion", 0.5], ["ether", 0.5]], respawn: 420 };
Object.assign(ITEMS, {
  glowcap: { name: "Glowcap", kind: "mat", icon: "🍄", price: 60, stack: 12, desc: "A mushroom that glows a soft blue. Alchemists prize it." },
  glowfin: { name: "Glowfin", kind: "mat", icon: "🐟", price: 85, stack: 12, desc: "A pale fish from the Underdeep River. Its fins shine in the dark." },
  blind_eel: { name: "Blind Eel", kind: "mat", icon: "🐍", price: 120, stack: 12, desc: "A long white eel with no eyes. Strong-tasting and valuable." },
});
for (const id of ["light_crystal", "dark_crystal"]) if (!ITEMS[id]) for (const f of ["lumicap", "deep_worm"]) FAMILIES[f].loot = FAMILIES[f].loot.filter(l => l[0] !== id);
ZONES.underdeep = {
  name: "Underdeep River", w: 3200, h: 1000, theme: "cave", glow: true,
  exits: [{ x: 0, y: 400, w: 24, h: 100, to: "verdant", tx: 2720, ty: 2180, label: "Verdant Jungle" }],
  npcs: [{ id: "boat_west", x: 1360, y: 560 }, { id: "boat_east", x: 1860, y: 560 }],
  walls: [{ x: 1550, y: 0, w: 120, h: 1000 }, { x: 600, y: 120, w: 220, h: 140 }, { x: 2400, y: 150, w: 220, h: 160 }],
  spawns: [
    { fam: "glow_bat", lv: [16, 17], x: 500, y: 350 }, { fam: "pale_crab", lv: [16, 17], x: 900, y: 620 }, { fam: "lumicap", lv: [16, 18], x: 1150, y: 300 },
    { fam: "glow_bat", lv: [18, 19], x: 2100, y: 350 }, { fam: "deep_worm", lv: [18, 20], x: 2500, y: 600, nm: { id: "earth_elemental", lv: 21, chance: 0.07 } }, { fam: "lumicap", lv: [18, 19], x: 2900, y: 300, nm: { id: "lumicap_matron", lv: 21, chance: 0.12 } }
  ],
  water: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => ({ x: 150 + i * 260, y: 800 + (i % 2) * 30, r: 150 })),
  paths: [{ w: 36, pts: [[-500, 450], [0, 450], [700, 480], [1360, 520]] }, { w: 36, pts: [[1860, 520], [2500, 450], [3000, 400]] }],
  landmarks: [
    { id: "landing", name: "West Landing", x: 1300, y: 520, r: 200, xp: 60 },
    { id: "grotto", name: "Glimmer Grotto", x: 2800, y: 350, r: 260, xp: 100 },
    { id: "falls", name: "Underfalls", x: 600, y: 700, r: 220, xp: 70 }
  ],
  gather: { mining: { n: 3, at: [[400, 250], [1200, 200], [2000, 200], [2700, 650], [3000, 700]], loot: [["iron_ore", 0.45], ["copper_ore", 0.25], ["water_crystal", 0.15], ["earth_crystal", 0.15]] } },
  start: { x: 110, y: 450 }
};

Object.assign(FAMILIES, {
  plains_hare: tierFam("hare", { name: "Plains Hare", color: "#d8b888", tint: 0xd8b888, hpMul: 0.9, loot: [["hare_meat_dummy", 0], ["wind_crystal", 0.2], ["potion", 0.08]] }),
  plains_lizard: tierFam("hill_lizard", { name: "Plains Lizard", color: "#9a9a5a", tint: 0x9a9a5a, tint2: 0xe0d8a0, loot: [["lizard_skin", 0.45], ["earth_crystal", 0.2], ["potion", 0.08]] }),
  wind_wasp: tierFam("honey_bee", { name: "Wind Wasp", color: "#c8e0a0", tint: 0xc8e0a0, tint2: 0x3a5a2a, loot: [["honeycomb", 0.35], ["wind_crystal", 0.25], ["potion", 0.08]] }),
  highland_longneck: tierFam("longneck", { name: "Highland Longneck", color: "#c8a878", hpMul: 1.9, loot: [["wool_tuft", 0.3], ["earth_crystal", 0.25], ["hi_potion", 0.05]] }),
  highland_orc: tierFam("orc_grunt", { name: "Highland Orc", color: "#7a8a5a", loot: [["orc_tooth", 0.4], ["wind_crystal", 0.2], ["potion", 0.1]] })
});
for (const f of ["plains_hare"]) FAMILIES[f].loot = FAMILIES[f].loot.filter(l => l[1] > 0);
NM_FAMILIES.thunderhoof = { hint: "Stormgrass Flats, Windreach Highlands · day", base: "longneck", name: "Thunderhoof", hpMul: 2.8, attMul: 1.15, scale: 1.6, aura: "#ffee58", loot: [["enyos_leggings", 0.35], ["wool_tuft", 1], ["wind_crystal", 1], ["hi_potion", 0.4]], respawn: 420 };
Object.assign(ITEMS, {
});
ZONES.highlands = {
  name: "Windreach Highlands", w: 4000, h: 3000, theme: "field", palette: "highland", openRange: true,
  exits: [{ x: 1950, y: 2976, w: 100, h: 24, to: "hollow", tx: 1300, ty: 60, label: "Rocky Hollow" }],
  npcs: [{ id: "tarqa", x: 1900, y: 1500 }, { id: "essa", x: 2100, y: 1560 }, { id: "camp_nomad_a", x: 2000, y: 1420 }, { id: "camp_nomad_b", x: 3200, y: 700 }, { id: "nomad_rider", x: 3260, y: 760 }],
  walls: [{ x: 700, y: 600, w: 300, h: 200 }, { x: 3000, y: 2100, w: 260, h: 220 }],
  ruins: { walls: [[600, 2300, 760, 2300, 1.6]], pillars: [[700, 2220, 3.0], [820, 2380, 2.0]] },
  landmarks: [
    { id: "camp", name: "Nomad Camp", x: 2000, y: 1500, r: 260, xp: 60 },
    { id: "stones", name: "Standing Stones", x: 700, y: 2300, r: 240, xp: 80 },
    { id: "flats", name: "Stormgrass Flats", x: 3000, y: 1300, r: 320, xp: 80 },
    { id: "ridge", name: "Eagle Ridge", x: 850, y: 700, r: 260, xp: 80 },
    { id: "horsecamp", name: "Rider's Rest", x: 3200, y: 700, r: 240, xp: 70 }
  ],
  spawns: [
    { fam: "plains_hare", lv: [10, 11], x: 1500, y: 2400, time: "day" }, { fam: "plains_hare", lv: [10, 12], x: 2600, y: 2500, time: "day" },
    { fam: "plains_lizard", lv: [11, 12], x: 1200, y: 1700 }, { fam: "plains_lizard", lv: [11, 13], x: 2800, y: 1900 },
    { fam: "wind_wasp", lv: [11, 12], x: 1500, y: 900, time: "day", nm: { id: "light_elemental", lv: 14, chance: 0.07, time: "day" } }, { fam: "wind_wasp", lv: [12, 13], x: 2400, y: 600, time: "day" },
    { fam: "highland_longneck", lv: [12, 14], x: 3000, y: 1300, nm: { id: "thunderhoof", lv: 15, chance: 0.12, time: "day" } }, { fam: "highland_longneck", lv: [12, 13], x: 3500, y: 1700, nm: { id: "gloamhorn", lv: 16, chance: 0.15, time: "night" } },
    { fam: "highland_orc", lv: [13, 14], x: 600, y: 1300 }, { fam: "highland_orc", lv: [13, 14], x: 700, y: 1400 },
    { fam: "skeleton", lv: [12, 13], x: 750, y: 2150, time: "night" }
  ],
  water: [{ x: 2600, y: 1000, r: 140 }, { x: 1300, y: 2600, r: 110 }],
  paths: [
    { w: 40, pts: [[2000, 3500], [2000, 3000], [2000, 2400], [2000, 1500], [2500, 1100], [3200, 750]] },
    { w: 30, pts: [[2000, 1500], [1300, 1700], [700, 2250]] },
    { w: 30, pts: [[2000, 2400], [3000, 1300]] }
  ],
  gather: {
    harvesting: { n: 3, at: [[1600, 1300], [2400, 1900], [3300, 2300], [900, 1800]], loot: [["healing_herb", 0.6], ["wool_tuft", 0.15], ["wind_crystal", 0.15]] },
    mining: { n: 2, at: [[900, 500], [3600, 2500], [500, 2600]], loot: [["copper_ore", 0.5], ["iron_ore", 0.25], ["earth_crystal", 0.15]] }
  },
  start: { x: 2000, y: 2900 }
};

NM_FAMILIES.gloamhorn = { hint: "Eastern Windreach Highlands · night", base: "longneck", name: "Gloamhorn", hpMul: 2.9, attMul: 1.15, scale: 1.7, aura: "#7e57c2", loot: [["amber_ring", 0.35], ["wool_tuft", 1], ["dark_crystal_dummy", 0], ["hi_potion", 0.4]], respawn: 420 };
NM_FAMILIES.gloamhorn.loot = NM_FAMILIES.gloamhorn.loot.filter(l => l[1] > 0);
NM_FAMILIES.sandglass_wisp = { hint: "The Mirage (sandstorms only) · any time", base: "bomb", name: "Sandglass Wisp", hpMul: 2.8, attMul: 1.2, scale: 1.6, aura: "#ffd54f", loot: [["dhalmel_mantle", 0.35], ["fire_crystal", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 300 };
Object.assign(ITEMS, {
  moon_tonic: { name: "Moon Tonic", kind: "use", icon: "🧪", price: 900, stack: 12, heal: 250, desc: "Restores 250 HP. Brewed by moonlight." }
});
ZONES.mirage = {
  name: "The Mirage", w: 1400, h: 1000, theme: "field", palette: "desert", mist: true, element: "lightning",
  exits: [{ x: 0, y: 450, w: 24, h: 100, to: "sunscar", tx: 440, ty: 1520, label: "Sunscar Desert" }],
  npcs: [{ id: "cache_mirage", x: 1100, y: 300 }],
  walls: [{ x: 600, y: 200, w: 200, h: 160 }],
  spawns: [{ fam: "dune_lizard", lv: [20, 20], x: 500, y: 700 }, { fam: "sun_wasp", lv: [20, 20], x: 900, y: 750 }, { fam: "cinder_bomb", lv: [20, 21], x: 1000, y: 500, nm: { id: "sandglass_wisp", lv: 22, chance: 0.4 } }],
  water: [{ x: 1150, y: 700, r: 120 }],
  landmarks: [{ id: "glass", name: "Glass Garden", x: 900, y: 500, r: 260, xp: 120 }],
  paths: [{ w: 34, pts: [[-500, 500], [0, 500], [700, 520], [1100, 400]] }],
  start: { x: 110, y: 500 }
};

const ZONE_SCALE = { hollow: 1.5, frost: 1.4, marsh: 1.4 };
const ZONE_FEATURES = {
  hollow: [{ t: "plateau", x: 2150, y: 420, r: 200, h: 4.5 }, { t: "plateau", x: 300, y: 2000, r: 160, h: 3 }, { t: "ravine", pts: [[650, 560], [900, 470], [1080, 330]], w: 70, d: 3.5 }, { t: "ravine", pts: [[2200, 1950], [2500, 2050], [2800, 1980]], w: 60, d: 3 }],
  frost: [{ t: "plateau", x: 2400, y: 600, r: 240, h: 6 }, { t: "ravine", pts: [[700, 1700], [1100, 1900], [1500, 1850]], w: 80, d: 5 }],
  marsh: [{ t: "plateau", x: 2300, y: 600, r: 220, h: 3 }, { t: "ravine", pts: [[500, 900], [800, 1100], [1000, 1400]], w: 70, d: 2.5 }]
};
function scaleZone(z, k) {
  const sc = o => { if (!o) return; if (o.x != null) o.x = Math.round(o.x * k); if (o.y != null) o.y = Math.round(o.y * k); };
  z.w = Math.round(z.w * k); z.h = Math.round(z.h * k); z.cs = 15; z.vegK = k;
  for (const e of z.exits || []) {
    const side = e.x <= 0 ? "w" : e.y <= 0 ? "n" : e.x + e.w >= z.w / k - 1 ? "e" : "s";
    const cx = (e.x + e.w / 2) * k, cy = (e.y + e.h / 2) * k;
    if (side === "w" || side === "e") { e.h = Math.round(e.h * k); e.y = Math.round(cy - e.h / 2); e.x = side === "w" ? 0 : z.w - e.w; }
    else { e.w = Math.round(e.w * k); e.x = Math.round(cx - e.w / 2); e.y = side === "n" ? 0 : z.h - e.h; }
  }
  for (const w of z.walls || []) { sc(w); w.w = Math.round(w.w * k); w.h = Math.round(w.h * k); }
  for (const l of z.landmarks || []) { sc(l); if (l.r) l.r = Math.round(l.r * k); }
  for (const sp of z.spawns || []) sc(sp);
  for (const n of z.npcs || []) sc(n);
  for (const w of z.water || []) { sc(w); w.r = Math.round(w.r * k); }
  for (const p of z.paths || []) p.pts = p.pts.map(q => [Math.round(q[0] * k), Math.round(q[1] * k)]);
  if (z.ruins) { z.ruins.walls = (z.ruins.walls || []).map(r => [r[0] * k, r[1] * k, r[2] * k, r[3] * k, r[4]]); z.ruins.pillars = (z.ruins.pillars || []).map(r => [r[0] * k, r[1] * k, r[2]]); }
  for (const g in z.gather || {}) z.gather[g].at = z.gather[g].at.map(q => [Math.round(q[0] * k), Math.round(q[1] * k)]);
  sc(z.start);
  z.features = (ZONE_FEATURES[z.id || ""] || z.features || []).map(f => f.t === "ravine" ? Object.assign({}, f, { pts: f.pts.map(q => [q[0] * k, q[1] * k]), w: f.w * k }) : Object.assign({}, f, { x: f.x * k, y: f.y * k, r: f.r * k }));
}
for (const id in ZONE_SCALE) if (ZONES[id]) { ZONES[id].id = id; scaleZone(ZONES[id], ZONE_SCALE[id]); }
function zsc(id) { return ZONE_SCALE[id] || 1; }
for (const id in ZONES) if (ZONES[id].spawns.length) spreadSpawns(ZONES[id], id === "hollow" ? 170 : 120);
const AREA_NAMES = { spire: "Red Spire" };
for (const id of ["spire1", "spire2", "spire3", "spire4", "spire_top"]) if (ZONES[id]) ZONES[id].area = "spire";
const ZONE_SPLITS = {};
function areaOf(zid) { return (ZONES[zid] && ZONES[zid].area) || zid; }
function areaZones(a) { return Object.keys(ZONES).filter(id => areaOf(id) === a); }
function areaName(a) { return AREA_NAMES[a] || (ZONES[a] ? ZONES[a].name : a); }
function inArea(ref, zid) { return ref === zid || areaOf(zid) === ref; }
function areaVisited(s, a) { const d = s.discovered || []; return d.includes(a) || d.some(z => areaOf(z) === a); }
function zkey(tbl, zid) { return tbl[zid] != null ? tbl[zid] : tbl[areaOf(zid)]; }
function computeBand(z) {
  const lv = (z.spawns || []).filter(s => !s.weather && s.lv).map(s => s.lv);
  z.band = z.safe || z.indoor || !lv.length ? null : [Math.min(...lv.map(l => l[0])), Math.max(...lv.map(l => l[1]))];
}
function zoneBand(zid) { const z = ZONES[zid]; return z && z.band ? z.band : null; }
function areaBand(a) { const b = areaZones(a).map(zoneBand).filter(Boolean); return b.length ? [Math.min(...b.map(x => x[0])), Math.max(...b.map(x => x[1]))] : null; }
function bandText(b) { return b ? "Lv " + (b[0] === b[1] ? b[0] : b[0] + "–" + b[1]) : ""; }

function splitZone(src, parts) {
  const Z = ZONES[src], snap = v => Math.round(v / 50) * 50;
  const P = parts.map(p => ({ id: p.id, name: p.name, x0: snap(p.rect[0]), y0: snap(p.rect[1]), x1: Math.min(Z.w, snap(p.rect[2])), y1: Math.min(Z.h, snap(p.rect[3])), band: p.band, start: p.start }));
  for (const p of P) { if (p.x1 >= Z.w - 25) p.x1 = Z.w; if (p.y1 >= Z.h - 25) p.y1 = Z.h; }
  const inR = (p, x, y) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1;
  const partAt = (x, y) => P.find(p => inR(p, x, y)) || P.reduce((a, p) => { const d = Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.y0 - y, 0, y - p.y1)); return !a || d < a.d ? { p, d } : a; }, null).p;
  const out = {};
  for (const p of P) {
    const ox = p.x0, oy = p.y0, mine = (x, y) => partAt(x, y) === p, mv = o => Object.assign({}, o, { x: o.x - ox, y: o.y - oy });
    const nz = { name: p.name, w: p.x1 - p.x0, h: p.y1 - p.y0, theme: Z.theme, area: src, id: p.id, splitFrom: src };
    for (const k of ["palette", "mist", "openRange", "cs", "vegK", "glow", "island"]) if (Z[k] != null) nz[k] = Z[k];
    nz.spawns = (Z.spawns || []).filter(s => mine(s.x, s.y)).map(mv);
    for (const s of nz.spawns) { s.x = Math.max(80, Math.min(nz.w - 80, s.x)); s.y = Math.max(80, Math.min(nz.h - 80, s.y)); }
    nz.npcs = (Z.npcs || []).filter(s => mine(s.x, s.y)).map(mv);
    nz.landmarks = (Z.landmarks || []).filter(s => mine(s.x, s.y)).map(mv);
    nz.water = (Z.water || []).filter(s => mine(s.x, s.y)).map(mv);
    nz.walls = (Z.walls || []).filter(w => mine(w.x + w.w / 2, w.y + w.h / 2)).map(mv);
    for (const k of ["props", "ambient"]) if (Z[k]) nz[k] = Z[k].filter(s => mine(s.x, s.y)).map(mv);
    for (const k of ["torches"]) if (Z[k]) nz[k] = Z[k].filter(q => mine(q[0], q[1])).map(q => [q[0] - ox, q[1] - oy].concat(q.slice(2)));
    if (Z.pillars) nz.pillars = Z.pillars.filter(q => mine(q.x != null ? q.x : q[0], q.y != null ? q.y : q[1])).map(q => q.x != null ? mv(q) : [q[0] - ox, q[1] - oy].concat(q.slice(2)));
    if (Z.ruins) nz.ruins = { walls: (Z.ruins.walls || []).filter(r => mine((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)).map(r => [r[0] - ox, r[1] - oy, r[2] - ox, r[3] - oy, r[4]]), pillars: (Z.ruins.pillars || []).filter(r => mine(r[0], r[1])).map(r => [r[0] - ox, r[1] - oy, r[2]]) };
    nz.paths = (Z.paths || []).filter(pa => pa.pts.some(q => mine(q[0], q[1]))).map(pa => Object.assign({}, pa, { pts: pa.pts.map(q => [q[0] - ox, q[1] - oy]) }));
    nz.features = (Z.features || []).filter(f => f.t === "ravine" ? f.pts.some(q => mine(q[0], q[1])) : mine(f.x, f.y)).map(f => f.t === "ravine" ? Object.assign({}, f, { pts: f.pts.map(q => [q[0] - ox, q[1] - oy]) }) : mv(f));
    nz.gather = {};
    for (const g in Z.gather || {}) { const at = Z.gather[g].at.filter(q => mine(q[0], q[1])).map(q => [q[0] - ox, q[1] - oy]); if (at.length) nz.gather[g] = Object.assign({}, Z.gather[g], { at, n: Math.max(1, Math.min(Z.gather[g].n, Math.round(Z.gather[g].n * at.length / Z.gather[g].at.length + 0.4), at.length)) }); }
    nz.exits = (Z.exits || []).filter(e => mine(e.x + e.w / 2, e.y + e.h / 2)).map(e => { const n = mv(e); n.x = Math.max(0, Math.min(nz.w - n.w, n.x)); n.y = Math.max(0, Math.min(nz.h - n.h, n.y)); return n; });
    nz.start = p.start ? { x: p.start[0], y: p.start[1] } : inR(p, Z.start.x, Z.start.y) ? { x: Z.start.x - ox, y: Z.start.y - oy } : { x: Math.round(nz.w / 2), y: Math.round(nz.h / 2) };
    if (p.band) { nz.band = p.band; nz.bandFixed = true; } else computeBand(nz);
    out[p.id] = nz;
  }
  const L = 160, T = 24, IN = 70;
  for (const a of P) for (const b of P) {
    if (a === b) continue;
    let seg = null;
    if (a.x1 === b.x0) { const lo = Math.max(a.y0, b.y0), hi = Math.min(a.y1, b.y1); if (hi - lo >= L) seg = { v: true, at: a.x1, lo, hi }; }
    if (a.y1 === b.y0) { const lo = Math.max(a.x0, b.x0), hi = Math.min(a.x1, b.x1); if (hi - lo >= L) seg = { v: false, at: a.y1, lo, hi }; }
    if (!seg) continue;
    let c = (seg.lo + seg.hi) / 2, best = 1e9;
    for (const pa of Z.paths || []) for (let i = 1; i < pa.pts.length; i++) {
      const [p0, p1] = [pa.pts[i - 1], pa.pts[i]], k0 = seg.v ? p0[0] : p0[1], k1 = seg.v ? p1[0] : p1[1];
      if ((k0 - seg.at) * (k1 - seg.at) > 0 || k0 === k1) continue;
      const t = (seg.at - k0) / (k1 - k0), m = seg.v ? p0[1] + t * (p1[1] - p0[1]) : p0[0] + t * (p1[0] - p0[0]);
      if (m > seg.lo + L / 2 && m < seg.hi - L / 2 && Math.abs(m - c) < best) { best = Math.abs(m - c); c = m; }
    }
    c = Math.round(Math.max(seg.lo + L / 2, Math.min(seg.hi - L / 2, c)));
    const A = out[a.id], B = out[b.id];
    if (seg.v) {
      A.exits.push({ x: A.w - T, y: c - a.y0 - L / 2, w: T, h: L, to: b.id, tx: IN, ty: c - b.y0, label: b.name, edge: true });
      B.exits.push({ x: 0, y: c - b.y0 - L / 2, w: T, h: L, to: a.id, tx: A.w - IN, ty: c - a.y0, label: a.name, edge: true });
    } else {
      A.exits.push({ x: c - a.x0 - L / 2, y: A.h - T, w: L, h: T, to: b.id, tx: c - b.x0, ty: IN, label: b.name, edge: true });
      B.exits.push({ x: c - b.x0 - L / 2, y: 0, w: L, h: T, to: a.id, tx: c - a.x0, ty: A.h - IN, label: a.name, edge: true });
    }
  }
  for (const zid in ZONES) {
    if (out[zid]) continue;
    for (const e of ZONES[zid].exits || []) if (e.to === src) {
      const back = (Z.exits || []).find(x => x.to === zid), p = back ? partAt(back.x + back.w / 2, back.y + back.h / 2) : partAt(e.tx, e.ty);
      e.to = p.id;
      if (back) { e.tx = Math.round(back.x + back.w / 2 - p.x0); e.ty = Math.round(back.y + back.h / 2 - p.y0); } else { e.tx -= p.x0; e.ty -= p.y0; }
    }
  }
  if (!AREA_NAMES[src]) AREA_NAMES[src] = Z.name;
  ZONE_SPLITS[src] = { w: Z.w, h: Z.h, parts: P.map(p => ({ id: p.id, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 })) };
  for (const id in out) ZONES[id] = out[id];
  if (!out[src]) delete ZONES[src];
  return out;
}

function splitLocal(src, x, y) {
  const S0 = ZONE_SPLITS[src];
  if (!S0) return { zone: src, x, y };
  const p = S0.parts.find(q => x >= q.x0 && x < q.x1 && y >= q.y0 && y < q.y1) || S0.parts[0];
  return { zone: p.id, x: Math.round(x - p.x0), y: Math.round(y - p.y0) };
}
function migrateSplits(out) {
  out.zsplit = out.zsplit && typeof out.zsplit === "object" ? out.zsplit : {};
  for (const src in ZONE_SPLITS) {
    if (out.zsplit[src]) continue;
    out.zsplit[src] = 1;
    const S0 = ZONE_SPLITS[src], P = S0.parts;
    const partAt = (x, y) => P.find(p => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1) || P[0];
    const byNpc = id => P.find(p => ZONES[p.id] && ZONES[p.id].npcs.some(n => n.id === id));
    if (out.loc && out.loc.zone === src) { const p = partAt(out.loc.x, out.loc.y); out.loc = { zone: p.id, x: out.loc.x - p.x0, y: out.loc.y - p.y0 }; }
    if (out.home && out.home.zone === src) { const p = byNpc(out.home.npc); if (p) out.home = { zone: p.id, npc: out.home.npc }; }
    if (out.attuned) for (const k in out.attuned) if (out.attuned[k] === src) { const p = byNpc(k); if (p) out.attuned[k] = p.id; }
    if (out.landmarks) for (const key of Object.keys(out.landmarks)) {
      const [z, lm] = key.split(":");
      if (z !== src) continue;
      const p = P.find(q => ZONES[q.id] && (ZONES[q.id].landmarks || []).some(l => l.id === lm));
      if (p && p.id !== src) { out.landmarks[p.id + ":" + lm] = out.landmarks[key]; delete out.landmarks[key]; }
      if (p && Array.isArray(out.discovered) && !out.discovered.includes(p.id)) out.discovered.push(p.id);
    }
    if (out.loc && Array.isArray(out.discovered) && P.some(p => p.id === out.loc.zone) && !out.discovered.includes(out.loc.zone)) out.discovered.push(out.loc.zone);
    const ex = out.explored && out.explored[src];
    if (typeof ex === "string") {
      const cols = Math.ceil(S0.w / 50), rows = Math.ceil(S0.h / 50);
      if (ex.length === cols * rows) for (const p of P) {
        const pc = Math.ceil((p.x1 - p.x0) / 50), pr = Math.ceil((p.y1 - p.y0) / 50);
        let s = "";
        for (let r = 0; r < pr; r++) for (let c = 0; c < pc; c++) { const rr = Math.floor((p.y0 + r * 50 + 25) / 50), cc = Math.floor((p.x0 + c * 50 + 25) / 50); s += rr < rows && cc < cols ? ex[rr * cols + cc] : "0"; }
        out.explored[p.id] = s;
      }
      if (!P.some(p => p.id === src)) delete out.explored[src];
    }
  }
  return out;
}
splitZone("hollow", [
  { id: "hollow", name: "West Meadows", rect: [0, 0, 1650, 3300], band: [1, 3] },
  { id: "hollow_lake", name: "Mirror Lake", rect: [1650, 0, 3300, 3300], band: [3, 5] },
  { id: "hollow_ruins", name: "Eastern Ruins", rect: [3300, 0, 4800, 3300], band: [5, 7] }
]);
ZONES.highlands.spawns.push(
  { fam: "plains_hare", lv: [10, 11], x: 900, y: 2600, time: "day" }, { fam: "plains_lizard", lv: [11, 12], x: 3000, y: 2700 }, { fam: "wind_wasp", lv: [11, 12], x: 2300, y: 2200, time: "day" }, { fam: "highland_orc", lv: [12, 13], x: 3400, y: 2400 },
  { fam: "highland_orc", lv: [13, 14], x: 3300, y: 500 }, { fam: "highland_orc", lv: [13, 14], x: 3420, y: 580 }, { fam: "skeleton", lv: [12, 13], x: 700, y: 300, time: "night" }, { fam: "plains_hare", lv: [11, 12], x: 1200, y: 300, time: "day" }, { fam: "highland_longneck", lv: [12, 13], x: 2000, y: 350 }
);
splitZone("highlands", [
  { id: "highlands", name: "Windreach Foothills", rect: [0, 2000, 4000, 3000] },
  { id: "highlands_plateau", name: "Windreach Plateau", rect: [0, 1000, 4000, 2000] },
  { id: "highlands_ridge", name: "Eagle Ridge", rect: [0, 0, 4000, 1000] }
]);
for (const id in ZONES) if (!ZONES[id].bandFixed) computeBand(ZONES[id]);


const COMPANION_CFG = { dayMs: 86400000, wageRate: 1, contractSec: 3600, gearWage: 0.02, hqWage: 0.05, bribePerLv: 100, oldFriendsMax: 8, bondSteps: [0, 20, 60, 130, 250, 420], bondBonus: 0.03, maxBond: 5 };

const MERC_PERSONAL_GEN = ["I'm glad it's you I'm fighting beside.", "You don't leave people behind. I noticed.", "I've started to look forward to these days.", "Whatever comes, I'll be at your side.", "Partners, then. For as long as you'll have me."];
const MERC_PERSONAL = {
  kael: ["You fight like someone who means it. I like that.", "My old captain used to say a shield is a promise. I'm starting to remember why.", "I grew up two valleys past the Hollow. Goblins burned the mill. That's why I took up the axe.", "If I go down, don't stop to grieve. Finish the fight first.", "Wherever you go next, I'm coming. No fee needed for that, but I'll still take it."],
  rook: ["You keep up. Most don't.", "I count every swing. Old habit from the arena.", "The arena paid better, but nobody there watched my back.", "I've stopped counting the swings. I count the fights we walk away from now.", "Partner. That's the word, isn't it?"],
  mira: ["You're reckless, but you come back. That's something.", "I learned healing at the shrine in the west hills. The old priestess was stricter than any goblin.", "I don't mind the blood. I mind the ones I'm too slow to reach.", "When you stand in front of me, I'm never too slow.", "I'll keep you standing. That's my vow, not my job."],
  fen: ["Ooh, a fight! Let's do this!", "Did you know undead hate Banish? I say it to them. They don't laugh.", "My sister's a Black Mage. She says I'm too loud. She's right!", "You're the first person who laughs at my jokes during a fight.", "Best party ever. I'm writing it in my journal."],
  sable: ["Your timing is adequate.", "Your timing is good.", "I studied in the academy's tower for nine years. Nine years, and none of it felt as real as this.", "When you open a chain, I'm already counting. It feels like music.", "I'd follow your chains anywhere."],
  dorn: ["Stand behind me.", "I took my oath at sixteen. I've broken it once. I won't again.", "There's a chapel in the Outpost cellar. I pray there for the ones I couldn't shield.", "You make it easy to keep the oath.", "My shield is yours, until the end."],
  lisette: ["Sword, spell, cure. Pick one? Why would I?", "Red Mages get called jacks of all trades. I prefer 'useful'.", "I left the mage court because they wanted me to choose a school. I chose all of them.", "You never ask me to be less than everything. Thank you.", "Whatever comes next, we'll handle it with style."],
  wren: ["Nice pickings today.", "I only steal from monsters now. Mostly.", "My mum ran a pawn shop in the capital. I learned to tell real silver by the smell.", "You never check your pockets around me. I like that you trust me.", "Whatever we find, half's yours. I mean it."],
  corin: ["...Clean shot.", "I grew up hunting the ridges above the Hollow. Quiet work.", "My father made bows. I still use his knife to carve the arrows.", "You give me room to shoot. Not everyone does.", "I'll keep watching your back. Always."],
  tamsin: ["Ha! Good fight!", "Breathe in, punch out. That's the whole secret.", "I trained at a temple up in the cliffs. Three hundred steps every morning, carrying water.", "You hit harder than you did when we met. I noticed.", "Fists together, always."],
  mordrin: ["...", "The scythe asks a price. I pay it gladly.", "I was a knight of the capital once. They didn't like what I became.", "You don't flinch at the dark. Good.", "Whatever comes, I'll take the first cut for you."],
  lyra: ["La la! Did you hear that? Perfect pitch.", "Every town has a song. I'm collecting them.", "I learned on a reed pipe my grandmother carved. I still have it.", "You fight to my tempo now. Have you noticed?", "I'm writing a ballad about us. It doesn't end yet."],
  vesper: ["Open a chain. I'll do the rest.", "The burst is the only honest moment in a fight.", "I was thrown out of the academy for setting the library alight. Small fire. Mostly.", "You understand the rhythm. Few do.", "Every burst from now on is for us."]
};

const BESTIARY = {
  goblin: { type: "Beastman", lore: "Scavengers in patched leather who roam in loose bands. They carry pouches stuffed with stolen trinkets and throw crude bombs when cornered." },
  den_goblin: { type: "Beastman", lore: "Hardened raiders who answer to the Chieftain. Better armed than their Hollow cousins and quick to call for help." },
  chieftain: { type: "Beastman", lore: "The warlord of the Goblin Den. He rules by out-shouting, out-eating and out-fighting everyone around him." },
  bat: { type: "Vermin", lore: "Leathery wings and keen ears. They flit about in the dark and only fight if you swing first." },
  worm: { type: "Amorphous", lore: "Burrowers that feel the hum of magic through the soil. They spit grit that stings the eyes." },
  orc_grunt: { type: "Beastman", lore: "Broad, tusked raiders in scavenged mail. They roar before they charge and fight to the last." },
  orc_stonechucker: { type: "Beastman", lore: "Orcs who hang back and hurl stones the size of your head. Close the distance fast." },
  fishfolk: { type: "Beastman", lore: "Finned fish-folk of the coast and marsh who fight with coral blades. Lightning makes them shudder." },
  birdfolk: { type: "Beastman", lore: "Beaked, feathered raiders from the crags, quick on their feet and quicker with a blade." },
  sapling: { type: "Plantoid", lore: "Walking flower bulbs with root-hair beards and stubby legs. Harmless until bothered, then they lash out with the sprout on their heads. Terribly afraid of fire." },
  treant_elder: { type: "Plantoid", lore: "An ancient walking tree. It guards its grove and shakes the earth when roused." },
  cactus: { type: "Plantoid", lore: "Needle-covered cactus folk that shuffle along and fire volleys of spines at anything that comes near." },
  bomb: { type: "Elemental", lore: "A living ball of fire with a mean little face. When cornered it swells up and explodes." },
  bog_crawler: { type: "Vermin", lore: "Mud-brown crawlers of the Ashen Marsh, fatter and tougher than their meadow cousins." },
  rime_crawler: { type: "Vermin", lore: "Pale crawlers that spin frost-silk in the high pass. Their thread is cold enough to numb." },
  marsh_hornet: { type: "Vermin", lore: "Red-black hornets that nest in the dead reeds. The swarm defends its own." },
  frost_wasp: { type: "Vermin", lore: "Glassy wasps that drift on the cold wind of the pass." },
  bog_lizard: { type: "Lizard", lore: "Dark lizards that wallow in the warm marsh mud." },
  frost_lizard: { type: "Lizard", lore: "Silver-scaled lizards that bask on sunlit ice." },
  mud_crab: { type: "Aquan", lore: "Brown crabs that dig into the marsh banks." },
  ice_crab: { type: "Aquan", lore: "Crabs with shells like frosted glass, found around the frozen lake." },
  mountain_ram: { type: "Beast", lore: "Big-horned rams of the high slopes. Peaceful, stubborn, and very solid." },
  marsh_mandrake: { type: "Plantoid", lore: "Swamp-grown mandrakes with dark leaves and muddy feet." },
  bog_shroom: { type: "Plantoid", lore: "Purple-capped marsh mushrooms. The spores make your head swim." },
  marsh_snapper: { type: "Aquan", lore: "Green snappers that lurk in the marsh pools." },
  ice_snapper: { type: "Aquan", lore: "Pale snappers that break through the thin ice to bite." },
  frost_stonechucker: { type: "Beastman", lore: "Orcs of the pass who hurl chunks of ice instead of stones." },
  frost_bomb: { type: "Elemental", lore: "A bomb burning with blue cold fire. It still explodes." },
  rime_treant: { type: "Plantoid", lore: "An ancient frozen tree that walks the summit. Its roots crack the ice." },
  silkmother: { type: "Vermin", lore: "A huge crawler, pale green and wrapped in her own silk. The meadow crawlers are all her children." },
  orc_warlord: { type: "Beastman", lore: "Gorruk, war-chief of the marsh orcs. He leads from the front with a cleaver the size of a door." },
  honey_bee: { type: "Vermin", lore: "Fat yellow bees that drone over the meadow flowers. Harmless until one is swatted; then the hive comes." },
  grass_crawler: { type: "Vermin", lore: "Plump green caterpillars as long as a man is tall. They spit sticky thread that slows you down, and never start a fight." },
  meadow_sheep: { type: "Beast", lore: "Woolly and placid. The flock will charge if you bother one of them." },
  hill_lizard: { type: "Lizard", lore: "Sun-warmed lizards that bask on the rocks. A whip of the tail knocks the wind out of anyone close." },
  pond_crab: { type: "Aquan", lore: "Hard-shelled crabs that scuttle sideways along the lakeshore. Their pinch is worse than their bite." },
  mandrake: { type: "Plantoid", lore: "Root-folk with a crown of leaves. They hop about in little gangs and scatter sleepy dust when cornered." },
  shroomling: { type: "Plantoid", lore: "Walking mushrooms that bob along the damp ground. Their spore cloud stings the eyes." },
  lake_snapper: { type: "Aquan", lore: "Long-jawed fish that leap from the lakes to snap at passers-by. They tire quickly out of the water." },
  longneck: { type: "Beast", lore: "Tall, gentle grazers of the marsh. Peaceful, but a stomp from one will flatten you." },
  hare: { type: "Beast", lore: "Skittish meadow hares. Harmless unless you start it, though a frightened kick can still bruise." },
  skeleton: { type: "Undead", lore: "Bones that walk after dusk. They hear the living move and sense when a body grows weak." },
  ghoul: { type: "Undead", lore: "Hungry dead who drain the life of anything they claw. Light and fire hurt them most." },
  royal_guard: { type: "Undead", lore: "Once the Hollow King's honour guard, now raised whenever he calls. Loyal past death." },
  crypt_sentinel: { type: "Undead", lore: "A sentinel bound to guard the inner crypt. Its key opens the way deeper." },
  hollow_king: { type: "Undead", lore: "A crowned ruler who refused to stay buried. His court still kneels in the dark below the Crypt." },
  grimtooth: { type: "Beastman", lore: "A notorious goblin with a red bandana and a worse temper. Rumoured to wear a ring stolen from a raider captain." },
  duskwing: { type: "Vermin", lore: "A giant violet bat that wakes only at night. Its wing leather is prized by cobblers." },
  king_wiggles: { type: "Amorphous", lore: "An enormous worm with an absurd name and a very real bite. Silkworkers pay well for its thread." },
  snow_hare: { type: "Beast", lore: "White hares that vanish against the snow. Peaceful and very fast." },
  ice_bat: { type: "Vermin", lore: "Pale bats that roost in the ice caves. They leave travellers alone, but the whole colony answers if one is struck." },
  frost_goblin: { type: "Beastman", lore: "Goblins in thick fur who raid the ice caravans. They see a long way across the snow." },
  ice_wight: { type: "Undead", lore: "Frozen dead from the old cairns. Fire and light melt them; the cold makes them patient." },
  glacier_worm: { type: "Amorphous", lore: "Huge white worms that tunnel through packed snow and sense the warmth of magic." },
  ashen_herald: { type: "Undead", lore: "A herald of the old Ember Throne, wrapped in ash that burns without heat. It speaks of a king who will return." },
  rimefang: { type: "Beastman", lore: "The frost goblins' war leader, an axe-swinging brute who wears a wolf pelt over his armour." },
  frost_wight: { type: "Undead", lore: "A wight lord who walks the cairns at night, wrapped in a shroud of frozen mist." },
  bog_toad: { type: "Amphibian", lore: "Bloated marsh toads that hunt by sound. Their oil keeps leather supple and smells for days." },
  bog_leech: { type: "Amorphous", lore: "Fat leeches that drift through the marsh water. Harmless until disturbed; fire makes them let go." },
  mire_goblin: { type: "Beastman", lore: "Goblins who settled the marsh and grew mean on toad stew. They tax the reed cutters and guard their stilt village jealously." },
  drowned: { type: "Undead", lore: "The bog keeps what it takes. At night the drowned rise from the chapel waters, cold and grasping." },
  marsh_hare: { type: "Beast", lore: "Long-legged hares that live among the reeds. Peaceful, quick and very hard to catch." },
  old_croaker: { type: "Amphibian", lore: "A toad the size of a cart, older than the Outpost. The reed cutters leave it offerings and keep their distance." },
  mirelord_gax: { type: "Beastman", lore: "A self-crowned goblin lord who rules Mire Village with a notched cleaver and a booming laugh." },
  tide_priest: { type: "Undead", lore: "A priest who drowned holding the chapel against the rising marsh, and never stopped holding it. The sigils were his; he wants them back." },
  ossuary_warden: { type: "Undead", lore: "A ghoul draped in grave silk that keeps watch over the ossuary. It drains warmth from the air around it." }
};

const STORY = [
  { name: "Ash on the Wind", lv: 3, reward: { xp: 400, gil: 300 }, steps: [
    { type: "talk", npc: "rhea", goal: "Talk to Captain Rhea in Ashenreach Outpost.", text: ["Ash has been falling over the Outpost for three nights now. Not from any fire we can find.", "Two of my scouts went to the Old Fort Ruins to look for the source and haven't come back. Go and see what's there. Carefully."] },
    { type: "visit", zone: "hollow", lm: "fort", goal: "Search the Old Fort Ruins in Rocky Hollow.", text: ["Among the broken walls you find your scouts' camp, cold and empty. Burned into a fallen stone is a mark: a crown wreathed in flame.", "The ash here is thick, and it's still warm."] },
    { type: "talk", npc: "rhea", goal: "Report to Captain Rhea.", text: ["A burning crown? I've seen that mark once, carved over the gate of the old Den before the goblins took it.", "Whatever this is, it's older than the Outpost. You've done well. Rest, and come back when you're stronger."] }
  ] },
  { name: "Beneath the Den", lv: 7, reward: { xp: 900, gil: 600 }, steps: [
    { type: "talk", npc: "rhea", goal: "Talk to Captain Rhea.", text: ["The goblins in the Den have been hauling black stones up from the deep tunnels. My scouts saw the burning crown painted on the crates.", "Thin out their raiders, then get down to the Bone Pit and find out what they're digging for."] },
    { type: "kill", fam: "den_goblin", n: 5, goal: "Defeat 5 Goblin Raiders in the Goblin Den." },
    { type: "visit", zone: "den", lm: "pit", key: "ashen_shard", goal: "Search the Bone Pit at the bottom of the Goblin Den.", text: ["Half-buried among the bones is a sliver of black stone, warm in your hand. Letters crawl across its face, and they aren't any language you know.", "Tobin knows old scripts. He might be able to read it."] },
    { type: "talk", npc: "tobin", goal: "Show the Ashen Shard to Tobin.", text: ["Let me see that. Hm. This is the old court script, from before the kingdoms.", "'The Ember Throne sleeps beneath the hollow crown. When the crown falls silent, the Herald will walk.' The hollow crown... the Hollow King in the Sunken Crypt. Nobody's disturbed him in centuries."] }
  ] },
  { name: "The Hollow Crown", lv: 10, reward: { xp: 1500, gil: 900 }, steps: [
    { type: "talk", npc: "tobin", goal: "Talk to Tobin.", text: ["If the Hollow King is the seal, someone has to know whether it still holds. Go down into the Sunken Crypt and face him.", "If he's still keeping the throne asleep, he won't let you pass. If he isn't... well. Bring a full party."] },
    { type: "kill", fam: "hollow_king", n: 1, goal: "Defeat the Hollow King in the Sunken Crypt." },
    { type: "talk", npc: "tobin", goal: "Tell Tobin what happened.", text: ["He spoke as he fell? 'The bells have drowned, the Herald wakes.' That's no comfort at all.", "The only drowned bells I know of are in the old chapel in the Ashen Marsh. Talk to Rhea. She'll want to hear this."] }
  ] },
  { name: "Bells Under Water", lv: 12, reward: { xp: 2500, gil: 1200 }, steps: [
    { type: "talk", npc: "rhea", goal: "Talk to Captain Rhea.", text: ["Tobin told me. A herald, a throne, drowned bells. I'd laugh if the ash weren't still falling.", "Go to the Drowned Chapel in the marsh. If something's waking down there, it's yours to put back to sleep."] },
    { type: "visit", zone: "marsh", lm: "chapel", goal: "Go to the Drowned Chapel in the Ashen Marsh.", text: ["Under the black water you hear it: a slow tolling, far below, though no bell hangs in the chapel.", "The sealed door is warm. Whatever waits beyond it is listening to the bells."] },
    { type: "kill", fam: "tide_priest", n: 1, goal: "Defeat the Tidebound Priest in the Chapel Depths (needs a Chapel Sigil)." },
    { type: "talk", npc: "rhea", goal: "Report to Captain Rhea.", text: ["The priest was ringing them? For whom?", "There's a harbor south of the marsh. Saltreach. Ships have been sailing out of there loaded with black stone. Ilsa runs the docks; go and ask her where they're taking it."] }
  ] },
  { name: "The Harbor Ledger", lv: 14, reward: { xp: 3500, gil: 1500 }, steps: [
    { type: "talk", npc: "ilsa", goal: "Talk to Ilsa, the harbor master in Saltreach.", text: ["Black stone? Yes, I've logged it. Crates and crates, paid in old coin. Mire goblins bring it to the docks at night.", "Stop the smugglers and I'll show you my ledger."] },
    { type: "kill", fam: "mire_goblin", n: 6, goal: "Defeat 6 Mire Goblins in the Ashen Marsh." },
    { type: "talk", npc: "ilsa", goal: "Return to Ilsa.", text: ["That should slow them. Here, the ledger. Every crate went the same way: overland, east through Frostspire Pass, to a goblin camp under the ice.", "Rimefang's camp. If you mean to follow, dress warmly."] }
  ] },
  { name: "Into the White", lv: 16, reward: { xp: 5000, gil: 2000 }, steps: [
    { type: "visit", zone: "frost", lm: "icefall", summon: "rimefang", goal: "Find Icefall Camp in Frostspire Pass.", text: ["The camp is stacked high with black stone. Goblins are chipping it into blocks, building something.", "A roar shakes the snow off the tents. Rimefang has seen you."] },
    { type: "kill", fam: "rimefang", n: 1, goal: "Defeat Rimefang at Icefall Camp." },
    { type: "talk", npc: "ilsa", goal: "Tell Ilsa what you found.", text: ["A stair? Built from the black stone, up toward the summit?", "Then that's where the Herald is waiting. You've come this far. Don't stop now."] }
  ] },
  { name: "The Ashen Herald", lv: 19, reward: { xp: 7000, gil: 3000 }, steps: [
    { type: "visit", zone: "frost", lm: "summit", summon: "ashen_herald", goal: "Climb to the Summit Overlook in Frostspire Pass.", text: ["At the top of the black stair stands a figure wrapped in ash that burns without heat.", "'The crown is silent. The bells have drowned. The throne remembers its king.' It raises a hand, and the snow turns to cinders."] },
    { type: "kill", fam: "ashen_herald", n: 1, goal: "Defeat the Ashen Herald at the Summit Overlook." }
  ] },
  { name: "Embers Kept", lv: 19, reward: { xp: 0, gil: 5000, item: "protean_ring" }, steps: [
    { type: "talk", npc: "rhea", goal: "Return to Captain Rhea in Ashenreach Outpost.", text: ["The ash stopped falling this morning. Every soul in the Outpost walked out to watch the sky clear.", "I don't know what that throne is, or who its king was. But I know who stood between it and us. Take this. It's been kept at the Outpost since before my time, waiting for someone who earned it."] }
  ] }
];

const BUDDIES = {
  meadow_kit: { name: "Meadow Kit", icon: "🐇", model: "hare", col: 0xd8b890, scale: 0.6, lore: "A tame young hare from Shepherd's Meadow. Hops along at your heels." },
  snow_kit: { name: "Snow Kit", icon: "🐇", model: "hare", col: 0xf2f6fa, scale: 0.6, lore: "A white hare from the pass, calm as fresh snow. You rest easier with it beside you." },
  batling: { name: "Batling", icon: "🦇", model: "bat", col: 0x6a5a7a, eye: 0xff8a80, scale: 0.5, lore: "A tiny cave bat that flutters around your head and squeaks at anything sneaking up." },
  wormlet: { name: "Wormlet", icon: "🪱", model: "worm", col: 0xd8a080, scale: 0.4, lore: "A stubby tunnel worm with a nose for ore and roots. Gathering goes better with it digging alongside." },
  ember_wisp: { name: "Ember Wisp", icon: "🔥", model: "wisp", col: 0xff7043, eye: 0xfff3c0, scale: 0.55, lore: "A mote of living flame. It warms your hands at the forge and the cookfire." },
  frost_wisp: { name: "Frost Wisp", icon: "❄️", model: "wisp", col: 0x81d4fa, eye: 0xffffff, scale: 0.55, lore: "A drifting shard of cold light. Its chill keeps your thoughts sharp." },
  tide_wisp: { name: "Tide Wisp", icon: "💧", model: "wisp", col: 0x4fc3f7, eye: 0xe0f7fa, scale: 0.55, lore: "A bubble of seafoam that never pops. Fish come to it." },
  mini_gob: { name: "Pocket Goblin", icon: "👺", model: "goblin", scale: 0.5, lore: "A goblin runt who decided you were its chief. Haggles on your behalf, badly but loudly." },
  shade_kit: { name: "Shade Kit", icon: "🐈", model: "hare", col: 0x3a3a44, eye: 0xffd54f, scale: 0.6, lore: "A sleek black hare with lamp-yellow eyes. Things turn up in its wake." },
  ash_sprite: { name: "Ash Sprite", icon: "🕯️", model: "wisp", col: 0x9e9e9e, eye: 0xff7043, scale: 0.6, lore: "A cinder from the Ember Throne that chose to follow you. It remembers everything you learn." }
};
const BUDDY_PERK_TEXT_OLD = { xp: v => "+" + Math.round(v * 100) + "% experience", rest: v => "Resting heals " + Math.round(v * 100) + "% faster", eva: v => "+" + v + " evasion", gather: v => "+" + Math.round(v * 100) + "% gathering chance", craft: v => "+" + Math.round(v * 100) + "% crafting chance", mp: v => "+" + Math.round(v * 100) + "% MP", fish: v => "+" + Math.round(v * 100) + "% catch rate", sell: v => "Shops pay " + Math.round(v * 100) + "% more", drop: v => "+" + Math.round(v * 100) + "% drop chance" };
const BUDDY_SHOP = [];

const BLESSING = { baseMin: 60, perRankMin: 30, maxMin: 210 };

const RACES = {
  human: { name: "Human", icon: "🧑", sex: null, hp: 1, mp: 1, speed: 1, attrs: {}, blurb: "Balanced at everything. No strengths, no weaknesses." },
  elari: { name: "Elari", icon: "🧝", sex: null, hp: 0.88, mp: 1.15, speed: 1, attrs: { dex: 2, agi: 1, int: 2, mnd: 2, vit: -2 }, rangedAcc: 8, blurb: "Tall, long-eared and graceful. Strong magic and a sharp eye with a bow (+ranged accuracy), but frail: less HP and VIT." },
  pipkin: { name: "Pipkin", icon: "🧸", sex: null, hp: 0.8, mp: 1.3, speed: 1.08, attrs: { int: 4, mnd: 3, agi: 2, str: -3, vit: -2 }, attMul: 0.92, blurb: "Small, round and doll-like. The best spellcasters of all and quick on their feet, but weak: low HP, STR and attack." },
  ursan: { name: "Ursan", icon: "🐻", sex: 0, hp: 1.25, mp: 0.75, speed: 0.94, attrs: { str: 3, vit: 4, int: -3, mnd: -2, agi: -2 }, blurb: "Huge, shaggy and tough as stone. The most HP, STR and VIT, but poor at magic and a little slow. Always male." },
  nekari: { name: "Nekari", icon: "🐱", sex: 1, hp: 0.9, mp: 1.1, speed: 1.06, attrs: { agi: 3, dex: 2, int: 2, mnd: 1, str: -1, vit: -1 }, blurb: "Cat-eared and lithe. Fast, nimble and good with magic, but slight: a little less HP. Always female." }
};
const RACE_ORDER = ["human", "elari", "pipkin", "ursan", "nekari"];

const AH_KINDS = { town: { label: "Town", icon: "🏛", color: "#f1cf73" }, player: { label: "Players", icon: "👤", color: "#81c784" }, merc: { label: "Mercenaries", icon: "⚔", color: "#b39ddb" } };
const AH_CATS = { materials: "Materials", consumables: "Consumables", weapons: "Weapons", armor: "Armor" };
const AH_CFG = { shopRatio: 1.5, fee: 0.03, maxListings: 7, checkMs: 60000, expireMs: 3 * 3600000, tickMins: 360, townBuySec: 1200, townBuyCeil: 1.25, relistChance: 0.5, relistCap: 40, relistMarkup: 1.03, mercLotCap: 300, townBuyMaxSteps: 36 };
const AH_NEWS = {
  materials: ["The smiths of the capital are buying up ore and timber.", "A caravan of raw goods just flooded the market."],
  consumables: ["A fever in the villages has everyone buying medicine and food.", "Healers have overstocked their potions and are selling cheap."],
  weapons: ["Mercenary companies are re-arming. Blades are in demand.", "A smith's guild sale has dropped weapon prices."],
  armor: ["Winter is coming and everyone wants armor.", "Surplus armor from the old garrison is up for sale."]
};

const GUILD_RANKS = [["Copper", 0, "#b87333"], ["Bronze", 100, "#cd7f32"], ["Iron", 300, "#a0a8b0"], ["Silver", 700, "#d8dde4"], ["Gold", 1500, "#ffd54f"], ["Mythril", 3000, "#80deea"]];
const GUILD_DAILY = 3;
const GUILD_ACTIVE = 3;
const GUILD_BOUNTIES = [
  { id: "b_crawler", fam: "grass_crawler", n: 6, where: "Rocky Hollow", lv: 1, gp: 10, tier: 0 },
  { id: "b_beehive", fam: "honey_bee", n: 6, where: "Rocky Hollow (day)", lv: 1, gp: 10, tier: 0 },
  { id: "b_lizard", fam: "hill_lizard", n: 5, where: "Rocky Hollow", lv: 4, gp: 18, tier: 1 },
  { id: "b_orc", fam: "orc_grunt", n: 5, where: "Rocky Hollow (south-east)", lv: 5, gp: 22, tier: 1 },
  { id: "b_silkmother", fam: "silkmother", n: 1, where: "Burrow Flats, Rocky Hollow", lv: 5, gp: 40, tier: 1, nm: true },
  { id: "b_bogcrawler", fam: "bog_crawler", n: 6, where: "Ashen Marsh", lv: 10, gp: 28, tier: 2 },
  { id: "b_reefkin", fam: "fishfolk", n: 6, where: "Ashen Marsh (south-east shore)", lv: 11, gp: 32, tier: 2 },
  { id: "b_crag", fam: "birdfolk", n: 5, where: "Ashen Marsh (west roost)", lv: 12, gp: 36, tier: 3 },
  { id: "b_warlord", fam: "orc_warlord", n: 1, where: "Orc camp, Ashen Marsh", lv: 14, gp: 75, tier: 3, nm: true },
  { id: "b_rimecrawler", fam: "rime_crawler", n: 6, where: "Frostspire Pass", lv: 15, gp: 40, tier: 3 },
  { id: "b_frostbomb", fam: "frost_bomb", n: 4, where: "Frostspire Pass (night)", lv: 17, gp: 55, tier: 4 },
  { id: "b_hare", fam: "hare", n: 5, where: "Rocky Hollow (day)", lv: 1, gp: 10, tier: 0 },
  { id: "b_goblin", fam: "goblin", n: 5, where: "Rocky Hollow", lv: 2, gp: 12, tier: 0 },
  { id: "b_bat", fam: "bat", n: 4, where: "Rocky Hollow (night)", lv: 3, gp: 12, tier: 0 },
  { id: "b_worm", fam: "worm", n: 4, where: "Rocky Hollow", lv: 3, gp: 12, tier: 0 },
  { id: "b_den", fam: "den_goblin", n: 6, where: "Goblin Den", lv: 6, gp: 20, tier: 1 },
  { id: "b_bones", fam: "skeleton", n: 4, where: "Rocky Hollow (night)", lv: 6, gp: 20, tier: 1 },
  { id: "b_ghoul", fam: "ghoul", n: 4, where: "Goblin Den, Sunken Crypt", lv: 8, gp: 22, tier: 1 },
  { id: "b_grimtooth", fam: "grimtooth", n: 1, where: "Goblin Camp, Rocky Hollow", lv: 6, gp: 40, tier: 1, nm: true },
  { id: "b_wiggles", fam: "king_wiggles", n: 1, where: "Burrow Flats, Rocky Hollow (day)", lv: 5, gp: 35, tier: 1, nm: true },
  { id: "b_toad", fam: "bog_toad", n: 6, where: "Ashen Marsh", lv: 10, gp: 28, tier: 2 },
  { id: "b_leech", fam: "bog_leech", n: 5, where: "Ashen Marsh", lv: 10, gp: 28, tier: 2 },
  { id: "b_mire", fam: "mire_goblin", n: 6, where: "Ashen Marsh", lv: 11, gp: 30, tier: 2 },
  { id: "b_drowned", fam: "drowned", n: 4, where: "Ashen Marsh (night)", lv: 12, gp: 32, tier: 2 },
  { id: "b_duskwing", fam: "duskwing", n: 1, where: "Old Fort Ruins (night)", lv: 8, gp: 45, tier: 2, nm: true },
  { id: "b_warden", fam: "ossuary_warden", n: 1, where: "Bone Pit, Goblin Den", lv: 10, gp: 50, tier: 2, nm: true },
  { id: "b_croaker", fam: "old_croaker", n: 1, where: "Croaker's Pool, Ashen Marsh (day)", lv: 12, gp: 55, tier: 2, nm: true },
  { id: "b_guard", fam: "royal_guard", n: 4, where: "Sunken Crypt", lv: 12, gp: 40, tier: 3 },
  { id: "b_gax", fam: "mirelord_gax", n: 1, where: "Mire Village, Ashen Marsh", lv: 14, gp: 70, tier: 3, nm: true },
  { id: "b_frostgob", fam: "frost_goblin", n: 6, where: "Frostspire Pass", lv: 16, gp: 40, tier: 3 },
  { id: "b_gworm", fam: "glacier_worm", n: 4, where: "Frostspire Pass", lv: 16, gp: 40, tier: 3 },
  { id: "b_icebat", fam: "ice_bat", n: 5, where: "Frostspire Pass (night)", lv: 16, gp: 40, tier: 3 },
  { id: "b_wight", fam: "ice_wight", n: 5, where: "Whispering Cairns (night)", lv: 18, gp: 55, tier: 4 },
  { id: "b_rimefang", fam: "rimefang", n: 1, where: "Icefall Camp, Frostspire Pass", lv: 19, gp: 100, tier: 4, nm: true },
  { id: "b_frostwight", fam: "frost_wight", n: 1, where: "Whispering Cairns (night)", lv: 19, gp: 100, tier: 4, nm: true }
];
const GUILD_SHOP = [
  { id: "hi_potion", gp: 6, rank: 0 }, { id: "ether", gp: 8, rank: 0 },
  { id: "desperado_ring", gp: 60, rank: 1 }, { id: "leaping_boots", gp: 120, rank: 2 }, { id: "chapel_sigil", gp: 40, rank: 2 },
  { id: "armored_ring", gp: 220, rank: 3 }, { id: "healing_harness", gp: 400, rank: 4 }, { id: "variable_ring", gp: 600, rank: 5 }
];

const ACHIEVEMENTS = [
  { id: "first_blood", icon: "⚔️", name: "First Blood", desc: "Defeat a monster.", test: s => s.stats.kills >= 1 },
  { id: "hunter", icon: "🏹", name: "Hunter", desc: "Defeat 50 monsters.", test: s => s.stats.kills >= 50 },
  { id: "slayer", icon: "🗡️", name: "Slayer", desc: "Defeat 250 monsters.", test: s => s.stats.kills >= 250 },
  { id: "notorious", icon: "☠️", name: "Notorious", desc: "Defeat a notorious monster.", test: s => s.stats.nm >= 1 },
  { id: "nm_all", icon: "👑", name: "Most Wanted", desc: "Defeat every notorious monster.", test: s => Object.keys(NM_FAMILIES).concat(["chieftain", "crypt_sentinel", "hollow_king"]).every(k => s.nmKilled[k]) },
  { id: "chain", icon: "⛓️", name: "Chain Reaction", desc: "Close a skillchain.", test: s => s.stats.sc >= 1 },
  { id: "chain50", icon: "🔗", name: "Chain Master", desc: "Close 50 skillchains.", test: s => s.stats.sc >= 50 },
  { id: "burst", icon: "✨", name: "Burst!", desc: "Land a magic burst.", test: s => s.stats.mb >= 1 },
  { id: "lv5", icon: "⭐", name: "Finding Your Feet", desc: "Reach level 5 on any job.", test: s => Object.values(s.jobs).some(j => j.lv >= 5) },
  { id: "lv10", icon: "🌟", name: "Seasoned", desc: "Reach level 10 on any job.", test: s => Object.values(s.jobs).some(j => j.lv >= 10) },
  { id: "lv15", icon: "💫", name: "Veteran", desc: "Reach level 15 on any job.", test: s => Object.values(s.jobs).some(j => j.lv >= 15) },
  { id: "marsh", icon: "🐸", name: "Into the Mire", desc: "Set foot in the Ashen Marsh.", test: s => areaVisited(s, "marsh") },
  { id: "two_jobs", icon: "🎓", name: "Jack of Trades", desc: "Reach level 5 on two jobs.", test: s => Object.values(s.jobs).filter(j => j.lv >= 5).length >= 2 },
  { id: "adv_job", icon: "🛡️", name: "Advanced Studies", desc: "Unlock an advanced job.", test: s => Object.values(s.jobsUnlocked || {}).some(Boolean) },
  { id: "quests5", icon: "📜", name: "Helping Hand", desc: "Complete 5 quests.", test: s => Object.values(s.quests).filter(q => q === "done").length >= 5 },
  { id: "quests_all", icon: "📚", name: "Pillar of the Outpost", desc: "Complete every quest.", test: s => Object.keys(QUESTS).every(k => s.quests[k] === "done") },
  { id: "landmarks", icon: "🧭", name: "Wanderer", desc: "Discover 5 landmarks.", test: s => Object.keys(s.landmarks).length >= 5 },
  { id: "zones", icon: "🗺️", name: "Cartographer", desc: "Visit every area.", test: s => Object.keys(ZONES).every(z => (s.discovered || []).includes(z)) },
  { id: "crafter", icon: "⚒️", name: "Artisan", desc: "Complete 10 crafts.", test: s => s.stats.crafts >= 10 },
  { id: "hq", icon: "💎", name: "Masterwork", desc: "Make a high-quality item.", test: s => s.stats.hq >= 1 },
  { id: "gatherer", icon: "⛏️", name: "Forager", desc: "Gather 25 times.", test: s => s.stats.gathers >= 25 },
  { id: "gardener", icon: "🌱", name: "Green Thumb", desc: "Harvest a plant.", test: s => s.harvests >= 1 },
  { id: "homebody", icon: "🏠", name: "Homebody", desc: "Have 5 pieces of furniture placed.", test: s => s.furniture.length >= 5 },
  { id: "companion", icon: "🤝", name: "Not Alone", desc: "Hire a companion.", test: s => s.hired.length >= 1 },
  { id: "full_party", icon: "👥", name: "Full Party", desc: "Adventure with five companions.", test: s => s.hired.length >= 5 },
  { id: "bond", icon: "💞", name: "Kindred Spirits", desc: "Reach bond level 5 with a companion.", test: s => Object.values(s.bond).some(b => b >= COMPANION_CFG.bondSteps[5]) },
  { id: "bestiary10", icon: "📖", name: "Naturalist", desc: "Record 10 creatures in the bestiary.", test: s => Object.keys(s.bestiary).length >= 10 },
  { id: "bestiary_all", icon: "📕", name: "Complete Bestiary", desc: "Record every creature in the bestiary.", test: s => Object.keys(BESTIARY).every(k => s.bestiary[k]) },
  { id: "trader", icon: "📋", name: "Odd Jobs", desc: "Fill 10 trade board requests.", test: s => (s.stats.trades || 0) >= 10 },
  { id: "augment", icon: "🔨", name: "Tinkerer", desc: "Augment a piece of gear.", test: s => Object.keys(s.augments || {}).length >= 1 },
  { id: "lotwin", icon: "🎲", name: "Lucky Roll", desc: "Win a treasure pool lot.", test: s => (s.stats.lotsWon || 0) >= 1 },
  { id: "angler", icon: "🎣", name: "Angler", desc: "Catch a fish.", test: s => (s.stats.fish || 0) >= 1 },
  { id: "bigcatch", icon: "🐠", name: "The Big One", desc: "Land a Lakeking Pike or a Ghost Koi.", test: s => (s.stats.bigFish || 0) >= 1 },
  { id: "fed", icon: "🍲", name: "Well Fed", desc: "Eat a meal.", test: s => (s.stats.meals || 0) >= 1 },
  { id: "chef", icon: "🧑‍🍳", name: "Head Chef", desc: "Reach Cooking skill 10.", test: s => (s.crafts.cooking || 0) >= 10 },
  { id: "harbor", icon: "⚓", name: "Sea Air", desc: "Reach Saltreach Harbor.", test: s => areaVisited(s, "harbor") },
  { id: "tuna", icon: "🐟", name: "Tidecaller", desc: "Land a Tidecaller Tuna.", test: s => (s.stats.tuna || 0) >= 1 },
  { id: "racer", icon: "🏁", name: "Thornstrider Racer", desc: "Win gold on the Hollow Run.", test: s => s.race && s.race.medals && s.race.medals.gold },
  { id: "rider", icon: "🦖", name: "Saddle Sore", desc: "Ride 20,000 steps on your Thornstrider.", test: s => (s.stats.ride || 0) >= 20000 },
  { id: "summoner", icon: "🔮", name: "First Calling", desc: "Summon a sprite.", test: s => (s.stats.summons || 0) >= 1 },
  { id: "sniper", icon: "🏹", name: "Sharp Eye", desc: "Defeat 25 monsters as a Ranger.", test: s => (s.stats.rngKills || 0) >= 25 },
  { id: "story", icon: "🕯️", name: "Keeper of the Embers", desc: "Complete the main story.", test: s => !!(s.story && s.story.done) },
  { id: "petkeeper", icon: "🐾", name: "Pet Keeper", desc: "Own five pets.", test: s => (s.buddies || []).length >= 5 },
  { id: "auction", icon: "⚖️", name: "Market Savvy", desc: "Sell 10 lots at the auction house.", test: s => (s.stats.ahSold || 0) >= 10 },
  { id: "bounty", icon: "📜", name: "On the Books", desc: "Complete your first guild bounty.", test: s => (s.stats.bounties || 0) >= 1 },
  { id: "silver", icon: "🥈", name: "Silver Standing", desc: "Reach Silver rank in the Adventurers' Guild.", test: s => (s.guild && s.guild.total || 0) >= 700 },
  { id: "mythril", icon: "💎", name: "Mythril Legend", desc: "Reach Mythril rank in the Adventurers' Guild.", test: s => (s.guild && s.guild.total || 0) >= 3000 },
  { id: "priest", icon: "🔱", name: "Tidebreaker", desc: "Defeat the Tidebound Priest in the Chapel Depths.", test: s => (s.stats.bfWins || 0) >= 1 },
  { id: "lv20", icon: "🏔️", name: "Summit", desc: "Reach level 20 on any job.", test: s => Object.values(s.jobs).some(j => j.lv >= 20) },
  { id: "frost", icon: "❄️", name: "Cold Feet", desc: "Set foot in Frostspire Pass.", test: s => areaVisited(s, "frost") },
  { id: "rich", icon: "💠", name: "Well Off", desc: "Hold 5,000 crystals.", test: s => s.gil >= 5000 },
  { id: "ko", icon: "💀", name: "Lesson Learned", desc: "Be defeated once.", test: s => s.stats.kos >= 1 },
  { id: "jumps", icon: "🦘", name: "Spring in Your Step", desc: "Jump 100 times.", test: s => s.stats.jumps >= 100 }
];
const jobsOpenCount = s => Object.keys(JOBS).filter(j => !JOBS[j].advanced || (s.jobsUnlocked && s.jobsUnlocked[j])).length;
for (const j of Object.keys(JOB_REQ)) if (JOBS[j]) ACHIEVEMENTS.push({ id: "unlock_" + j, icon: JOBS[j].icon, name: JOBS[j].name + " Unlocked", desc: "Unlock the " + JOBS[j].name + " job.", test: s => !!(s.jobsUnlocked && s.jobsUnlocked[j]) });
ACHIEVEMENTS.push(
  { id: "jobs_bronze", icon: "🥉", name: "Bronze Student", desc: "Have 6 jobs unlocked.", test: s => jobsOpenCount(s) >= 6 },
  { id: "jobs_silver", icon: "🥈", name: "Silver Scholar", desc: "Have 12 jobs unlocked.", test: s => jobsOpenCount(s) >= 12 },
  { id: "jobs_gold", icon: "🥇", name: "Gold Master", desc: "Have 18 jobs unlocked.", test: s => jobsOpenCount(s) >= 18 },
  { id: "jobs_all", icon: "👑", name: "Every Trade", desc: "Have every job unlocked.", test: s => jobsOpenCount(s) >= Object.keys(JOBS).length }
);

const TRADE_REQUESTS = [
  { id: "t_copper", who: "The forge", items: { copper_ore: 4 }, gil: 160, xp: 60 },
  { id: "t_iron", who: "The forge", items: { iron_ore: 3 }, gil: 320, xp: 120 },
  { id: "t_logs", who: "The carpenters", items: { ash_log: 4 }, gil: 150, xp: 60 },
  { id: "t_herbs", who: "The infirmary", items: { healing_herb: 5 }, gil: 140, xp: 50 },
  { id: "t_pouch", who: "Captain Rhea's quartermaster", items: { goblin_pouch: 3 }, gil: 180, xp: 80 },
  { id: "t_wing", who: "A cobbler", items: { bat_wing: 3 }, gil: 200, xp: 80 },
  { id: "t_silk", who: "A tailor", items: { worm_silk: 3 }, gil: 220, xp: 90 },
  { id: "t_bone", who: "The chapel", items: { bone_chip: 4 }, gil: 260, xp: 110 },
  { id: "t_oil", who: "An alchemist", items: { toad_oil: 3 }, gil: 380, xp: 160 },
  { id: "t_reed", who: "The basket weavers", items: { mire_reed: 4 }, gil: 300, xp: 130 },
  { id: "t_ingot", who: "The armoury", items: { bronze_ingot: 2 }, gil: 340, xp: 140 },
  { id: "t_potion", who: "A nervous traveller", items: { potion: 3 }, gil: 150, xp: 40 },
  { id: "t_fire", who: "The lamplighters", items: { fire_crystal: 2 }, gil: 110, xp: 40 },
  { id: "t_water", who: "The well keeper", items: { water_crystal: 2 }, gil: 110, xp: 40 },
  { id: "t_carp", who: "The tavern cook", items: { moat_carp: 3 }, gil: 120, xp: 50 },
  { id: "t_eel", who: "A smokehouse", items: { mud_eel: 2 }, gil: 180, xp: 90 },
  { id: "t_stew", who: "The barracks cook", items: { carp_stew: 2 }, gil: 160, xp: 70 },
  { id: "t_bread", who: "A hungry patrol", items: { herb_bread: 3 }, gil: 120, xp: 50 }
];
const TRADE_DAILY = 3;

const AUGMENT_STATS = [["str", 1, 3], ["dex", 1, 3], ["vit", 1, 3], ["agi", 1, 3], ["int", 1, 3], ["mnd", 1, 3], ["att", 2, 6], ["def", 2, 5], ["acc", 2, 5], ["eva", 2, 5], ["hp", 6, 15], ["mp", 5, 12]];
const AUGMENT_CFG = { max: 2, gilPerLv: 60, mats: { iron_ore: 1, fire_crystal: 1 }, reforgeGilPerLv: 40 };
const STAT_LABELS = { str: "STR", dex: "DEX", vit: "VIT", agi: "AGI", int: "INT", mnd: "MND", att: "Attack", def: "Defense", acc: "Accuracy", eva: "Evasion", hp: "HP", mp: "MP" };

const FISH = {
  outpost: [["pond_minnow", 0, 10], ["moat_carp", 3, 3]],
  hollow: [["moat_carp", 0, 8], ["silver_shad", 4, 5], ["pond_minnow", 0, 3], ["lakeking_pike", 12, 0.6]],
  harbor: [["harbor_bream", 2, 8], ["sea_bass", 9, 5], ["pond_minnow", 0, 2], ["tidecaller_tuna", 16, 0.5], ["egg_tide_wisp", 10, 0.03]],
  marsh: [["mud_eel", 4, 7], ["bog_perch", 7, 5], ["moat_carp", 0, 2], ["ghost_koi", 14, 0.5, "storm"], ["ghost_koi", 14, 0.4, "rain"]]
};
const FISH_CFG = { waitMin: 3, waitMax: 9, bite: 2.4, reach: 70, cap: 20 };

const WEATHER_INFO = {
  clear: { name: "Clear", icon: "☀️", nightIcon: "🌙" },
  cloudy: { name: "Cloudy", icon: "☁️" },
  rain: { name: "Rain", icon: "🌧️", el: "water" },
  wind: { name: "Wind", icon: "🌬️", el: "wind" },
  fog: { name: "Fog", icon: "🌫️" },
  storm: { name: "Thunderstorm", icon: "⛈️", el: "lightning" },
  snow: { name: "Snow", icon: "🌨️", el: "ice" },
  blizzard: { name: "Blizzard", icon: "❄️", el: "ice" },
  sandstorm: { name: "Sandstorm", icon: "🌪️", el: "earth" }
};
const WEATHER = {
  outpost: [["clear", 6], ["cloudy", 3], ["rain", 2], ["wind", 1.5], ["storm", 0.5]],
  hollow: [["clear", 5], ["cloudy", 3], ["rain", 2], ["wind", 2], ["storm", 0.7], ["fog", 0.8]],
  marsh: [["fog", 4], ["rain", 3], ["cloudy", 2], ["clear", 1.2], ["storm", 1]],
  frost: [["snow", 5], ["clear", 3], ["blizzard", 1.5], ["cloudy", 2], ["fog", 1]],
  harbor: [["clear", 5], ["wind", 3], ["cloudy", 3], ["rain", 2], ["storm", 1], ["fog", 1.2]]
};

const SHOPS = {
  marn: ["fishing_rod", "sea_rod", "bait", "grain_flour", "rock_salt", "herb_bread", "carp_stew", "shad_skewer", "grilled_bass", "potion", "hi_potion", "ether"],
  vela: ["chapel_sigil"]
};
const MOUNT_COATS = {
  teal: { name: "Marsh Teal", main: 0x3f6f6a, dark: 0x2a4a48, glow: 0x6ff0e8, price: 0 },
  crimson: { name: "Ember Crimson", main: 0x7a2a24, dark: 0x4a1a16, glow: 0xffb040, price: 800 },
  sable: { name: "Night Sable", main: 0x2a2a34, dark: 0x18181e, glow: 0xb070ff, price: 1200 },
  gold: { name: "Dune Gold", main: 0xb08a3a, dark: 0x6a5224, glow: 0xfff0a0, price: 1500 },
  ivory: { name: "Frost Ivory", main: 0xd8d8e0, dark: 0x9a9aa8, glow: 0x80d8ff, price: 2000 }
};
const SADDLE_PRICE = 2500, SADDLE_BONUS = 1.15;
const RACE_BASE = {
  zone: "hollow", start: { x: 120, y: 1100 },
  checkpoints: [{ x: 800, y: 1010, name: "the old road" }, { x: 1450, y: 1880, name: "Burrow Flats" }, { x: 2515, y: 680, name: "the Old Fort" }, { x: 2650, y: 1440, name: "the Goblin Camp" }, { x: 3000, y: 1080, name: "the Eastern Gate" }],
  radius: 90, limit: 75, medals: [["gold", 26, 1200], ["silver", 36, 600], ["bronze", 50, 300]]
};const RACE = (() => { const k = zsc(RACE_BASE.zone), r = Object.assign({}, RACE_BASE); r.start = { x: RACE_BASE.start.x * k, y: RACE_BASE.start.y * k }; r.checkpoints = RACE_BASE.checkpoints.map(c => Object.assign({}, c, { x: c.x * k, y: c.y * k })); r.limit = Math.round(RACE_BASE.limit * k); { const ls = p => Object.assign(p, splitLocal(RACE_BASE.zone, p.x, p.y)); ls(r.start); r.checkpoints.forEach(ls); r.zone = r.start.zone; r.zones = ZONE_SPLITS[RACE_BASE.zone] ? ZONE_SPLITS[RACE_BASE.zone].parts.map(q => q.id) : [RACE_BASE.zone]; } r.medals = RACE_BASE.medals.map(m => [m[0], Math.round(m[1] * k), m[2]]); return r; })();


const PETS = {
  carbuncle: { name: "Carbuncle", el: "light", col: 0xa5d6a7, eye: 0xff5252, pact: "Searing Light", weak: "dark" },
  ember: { name: "Fire Spirit", el: "fire", col: 0xff7043, eye: 0xfff176, pact: "Flame Burst", weak: "ice" },
  frost: { name: "Ice Spirit", el: "ice", col: 0x81d4fa, eye: 0xffffff, pact: "Frost Lance", weak: "fire" },
  stone: { name: "Earth Spirit", el: "earth", col: 0xbca27a, eye: 0xffe082, pact: "Rock Throw", weak: "wind" },
  gale: { name: "Air Spirit", el: "wind", col: 0xaed581, eye: 0xf1f8e9, pact: "Cyclone", weak: "earth" },
  thunder: { name: "Thunder Spirit", el: "lightning", col: 0xfff176, eye: 0xffffff, pact: "Lightning Strike", weak: "earth" },
  water: { name: "Water Spirit", el: "water", col: 0x4fc3f7, eye: 0xe1f5fe, pact: "Aqua Burst", weak: "lightning" },
  light: { name: "Light Spirit", el: "light", col: 0xfff9c4, eye: 0xffffff, pact: "Holy Ray", weak: "dark" },
  dark: { name: "Dark Spirit", el: "dark", col: 0x7e57c2, eye: 0xd1c4e9, pact: "Shadow Bolt", weak: "light" }
};

const BATTLEFIELD = { zone: "depths", minutes: 15, rewards: ["anus_tiara", "city_staff", "kingdom_sword", "anus_doublet", "rogetsurin"], gil: 1500, xp: 3000 };

for (const id in SPELLS) {
  const sp = SPELLS[id], lv = Math.min(...Object.values(sp.jobs));
  sp.id = id; sp.minLv = lv;
  if (sp.blue) continue;
  const sid = "scroll_" + id;
  ITEMS[sid] = { name: "Scroll of " + sp.name, kind: "use", icon: "📜", spell: id, lv, price: Math.round(30 + lv * lv * 14), desc: "Read it to learn " + sp.name + ". Can be learned by " + Object.entries(sp.jobs).map(([j, l]) => j + " Lv." + l).join(", ") + "." };
  if (sp.drop) continue;
  if (lv <= 10) SHOP.push(sid); else if (lv <= 20) SHOPS.vela.push(sid);
}
SHOPS.vela.push("x_potion", "hi_ether", "super_ether", "reraiser");
const RECIPE_START = RECIPES.filter(r => r.lv === 0 && !r.id.startsWith("g_")).map(r => r.id);
for (const r of RECIPES) {
  if (RECIPE_START.includes(r.id)) continue;
  const rare = r.id.startsWith("g_"), sid = "rcp_" + r.id, o = ITEMS[r.out];
  ITEMS[sid] = { name: "Recipe: " + o.name, kind: "use", icon: "📜", recipe: r.id, lv: r.lv, price: Math.round(30 + r.lv * r.lv * 6) * (rare ? 3 : 1), desc: "Read it to learn how to craft " + o.name + " (" + CRAFTS[r.craft].name + " Lv." + r.lv + ")." + (rare ? " A rare recipe: it can come out as the +1 version." : "") };
  if (!rare) { if (r.lv <= 10) SHOP.push(sid); else SHOPS.vela.push(sid); }
}
const RARE_RECIPES = RECIPES.filter(r => r.id.startsWith("g_")).sort((a, b) => a.lv - b.lv);
{
  const free = RARE_RECIPES.slice(), qs = Object.keys(QUESTS).filter(q => QUESTS[q].reward && QUESTS[q].lv >= 3 && !/^tour_/.test(q));
  qs.forEach((q, i) => {
    if (i % 2 || !free.length) return;
    let bi = 0;
    free.forEach((r, k) => { if (Math.abs(r.lv - (QUESTS[q].lv + 2)) < Math.abs(free[bi].lv - (QUESTS[q].lv + 2))) bi = k; });
    const r = free.splice(bi, 1)[0];
    QUESTS[q].reward.items = (QUESTS[q].reward.items || []).concat([["rcp_" + r.id, 1]]);
  });
}
for (const id in GEAR_DATA) { const g = GEAR_DATA[id]; if (g.src !== "shop") continue; if (g.lv <= 10) SHOP.push(id); else SHOPS.vela.push(id); }
const VENDOR_SLOTS_ARMOR = ["head", "body", "hands", "legs", "feet", "back", "waist", "sub"];
const VENDOR_ROLES = {
  armorer: { title: "Armorer", test: it => it.kind === "equip" && VENDOR_SLOTS_ARMOR.includes(it.slot), work: "hammer", held: "hammer", hello: "Mail, caps, boots and bucklers, all fitted for beginners. Take a look." },
  weaponsmith: { title: "Weaponsmith", test: it => it.kind === "equip" && ["main", "ranged", "ammo"].includes(it.slot), work: "hammer", held: "hammer", hello: "Blades, bows, staves and shot. Every one honest steel. Mind the edges." },
  tradesman: { title: "Tradesman", test: it => it.kind === "tool" || it.kind === "mat" || it.kind === "crystal" || it.kind === "seed" || !!it.fishing, work: "work", held: "basket", hello: "Picks, hatchets, sickles, rods and raw goods. Everything a gatherer needs." },
  quartermaster: { title: "Quartermaster", test: it => it.kind === "food" || (it.kind === "use" && !it.spell && !it.recipe && !it.fishing && !it.pet), work: "count", held: "ledger", hello: "Potions, ethers and hot meals. Pack plenty before you head out." },
  spellsmith: { title: "Spellsmith", test: it => it.kind === "use" && (!!it.spell || !!it.recipe), work: "read", held: "scroll", hello: "Scrolls of every school. Read one and the spell is yours for good." },
  jeweler: { stock: 5, title: "Jeweler", test: it => it.kind === "equip" && (it.slot === "ring" || it.slot === "neck"), work: "count", held: "book", hello: "Rings and pendants, cut and set by hand. A little sparkle goes a long way." }
};
const VENDOR_STOCK = 10, VENDOR_MAXLV = 5;
const VENDOR_SOURCE = SHOP.concat(SHOPS.marn).concat(Object.keys(ITEMS).filter(id => ITEMS[id].kind === "food" && ITEMS[id].rarity !== "rare")).filter(id => ITEMS[id] && !ITEMS[id].hq).filter((id, i, a) => a.indexOf(id) === i);
const VENDOR_JEWEL_MAXLV = 11;
const VENDOR_SOURCE_JEWEL = VENDOR_SOURCE.concat(SHOPS.vela.filter(id => ITEMS[id] && !ITEMS[id].hq && ITEMS[id].kind === "equip" && (ITEMS[id].slot === "ring" || ITEMS[id].slot === "neck")));
const VENDOR_POOL = {};
for (const r in VENDOR_ROLES) VENDOR_POOL[r] = (r === "jeweler" ? VENDOR_SOURCE_JEWEL : VENDOR_SOURCE).filter(id => (ITEMS[id].lv || 0) <= (r === "jeweler" ? VENDOR_JEWEL_MAXLV : VENDOR_MAXLV) && VENDOR_ROLES[r].test(ITEMS[id]));
const VENDOR_SHOP_LOOK = { armorer: { type: "forge", signCol: "#9aa4b0" }, weaponsmith: { type: "forge", signCol: "#ff7a30" }, tradesman: { type: "shop", awning: "#2e7d32" }, quartermaster: { type: "shop", awning: "#c0392b" }, spellsmith: { type: "shop", awning: "#7b1fa2", signCol: "#b388ff" }, jeweler: { type: "shop", awning: "#0277bd", signCol: "#7ad0ff" } };
const VENDOR_TOWNS = {
  outpost: { names: { armorer: "Dorrin", weaponsmith: "Kessa", tradesman: "Hale", quartermaster: "Perrin", spellsmith: "Vesper", jeweler: "Maris" }, shops: { armorer: { x: 3950, y: 4006, w: 120, h: 72, sign: "Armory", district: "ind" }, weaponsmith: { x: 4220, y: 4006, w: 112, h: 72, sign: "Arms", district: "ind" }, tradesman: { x: 6050, y: 2310, w: 120, h: 72, sign: "Supplies", district: "gate" }, quartermaster: { x: 3300, y: 3058, w: 112, h: 72, sign: "Provisions", district: "market" }, spellsmith: { x: 3900, y: 3058, w: 100, h: 72, sign: "Scrolls", district: "market" }, jeweler: { x: 3900, y: 2342, w: 96, h: 72, sign: "Jewels", district: "market" } } },
  harbor: { names: { armorer: "Brek", weaponsmith: "Tamsin", tradesman: "Orrin", quartermaster: "Nell", spellsmith: "Corwen", jeweler: "Lysa" }, shops: { armorer: { x: 1620, y: 640, w: 120, h: 72, sign: "Armory", district: "yard" }, weaponsmith: { x: 1576, y: 430, w: 112, h: 72, sign: "Arms", district: "yard" }, tradesman: { x: 450, y: 590, w: 120, h: 72, sign: "Supplies", district: "fish" }, quartermaster: { x: 1076, y: 430, w: 112, h: 72, sign: "Provisions", district: "square" }, spellsmith: { x: 1100, y: 660, w: 100, h: 72, sign: "Scrolls", district: "square" }, jeweler: { x: 700, y: 600, w: 96, h: 72, sign: "Jewels", district: "square" } } },
  ironvale: { names: { armorer: "Gunnar", weaponsmith: "Sigrid", tradesman: "Bjorn", quartermaster: "Edda", spellsmith: "Runa", jeweler: "Thora" }, shops: { armorer: { x: 1490, y: 1280, w: 120, h: 72, sign: "Armory", district: "forge" }, weaponsmith: { x: 1470, y: 1120, w: 112, h: 72, sign: "Arms", district: "forge" }, tradesman: { x: 100, y: 420, w: 120, h: 72, sign: "Supplies", district: "gate" }, quartermaster: { x: 686, y: 626, w: 112, h: 72, sign: "Provisions", district: "market" }, spellsmith: { x: 1065, y: 285, w: 90, h: 72, sign: "Scrolls", district: "keep" }, jeweler: { x: 700, y: 830, w: 96, h: 72, sign: "Jewels", district: "market" } } }
};
const VENDOR_WORK = {};
const TOWN_SERVICES = {
  outpost: {},
  harbor: { job: "Maren", stable: "Fenn" },
  ironvale: { job: "Dagny", stable: "Hild" }
};
for (const town in TOWN_SERVICES) {
  NPCS["barber_" + town] = { name: BARBER_NAMES[town] + ", Barber", model: "barber", talk: "talkBarber" }; VENDOR_WORK["barber_" + town] = "work";
  NPCS["auction_" + town] = { name: "Auction Clerk", model: "auction_clerk", talk: "talkAuction" }; VENDOR_WORK["auction_" + town] = "count";
  const T = TOWN_SERVICES[town];
  if (T.job) { NPCS["job_" + town] = { name: T.job + ", Job Master", model: "tobin_b", talk: "talkTobin" }; VENDOR_WORK["job_" + town] = "read"; }
  if (T.stable) { NPCS["stable_" + town] = { name: T.stable + ", Stablemaster", model: "ysolde_b", talk: "talkYsolde" }; VENDOR_WORK["stable_" + town] = "work"; }
}
for (const town in VENDOR_TOWNS) {
  const T = VENDOR_TOWNS[town];
  Object.keys(VENDOR_ROLES).forEach((r, i) => {
    const id = "v_" + (r === "tradesman" ? "trade" : r) + "_" + town;
    NPCS[id] = { name: T.names[r] + ", " + VENDOR_ROLES[r].title, model: "vend_" + r, talk: "talkVendor", shop: r };
    VENDOR_WORK[id] = VENDOR_ROLES[r].work;
    const sp = T.shops[r], L = VENDOR_SHOP_LOOK[r];
    ZONES[town].houses.push({ x: sp.x, y: sp.y, w: sp.w, h: sp.h, type: L.type, floors: 1, sign: sp.sign, signCol: L.signCol, awning: L.awning, shop: id, trade: r, roof: i % 4 });
    ZONES[town].npcs.push({ id, x: sp.x, y: sp.y + sp.h / 2 + 34 });
  });
}
function exitSide(z, e) { return e.x <= 1 ? "w" : e.x + e.w >= z.w - 1 ? "e" : e.y <= 1 ? "n" : e.y + e.h >= z.h - 1 ? "s" : null; }
function exitInner(z, e) {
  const L = e.hall || 0, cx = e.x + e.w / 2, cy = e.y + e.h / 2, sd = exitSide(z, e);
  if (sd === "w") return { x: L + 60, y: cy };
  if (sd === "e") return { x: z.w - L - 60, y: cy };
  if (sd === "n") return { x: cx, y: L + 60 };
  if (sd === "s") return { x: cx, y: z.h - L - 60 };
  return null;
}
for (const zid in ZONES) {
  const z = ZONES[zid];
  if (!z.w || z.indoor || z.theme === "house") continue;
  z.walls = z.walls || [];
  for (const e of z.exits || []) {
    if (e.kind === "door") continue;
    const sd = exitSide(z, e);
    if (!sd) continue;
    const L = e.hall = z.safe ? CONFIG.hallTown : CONFIG.hallField, T = 70, cx = e.x + e.w / 2, cy = e.y + e.h / 2, half = (sd === "w" || sd === "e" ? e.h : e.w) / 2 + 60;
    e.lane = half;
    if (sd === "w") z.walls.push({ x: 0, y: cy - half - T, w: L, h: T }, { x: 0, y: cy + half, w: L, h: T });
    if (sd === "e") z.walls.push({ x: z.w - L, y: cy - half - T, w: L, h: T }, { x: z.w - L, y: cy + half, w: L, h: T });
    if (sd === "n") z.walls.push({ x: cx - half - T, y: 0, w: T, h: L }, { x: cx + half, y: 0, w: T, h: L });
    if (sd === "s") z.walls.push({ x: cx - half - T, y: z.h - L, w: T, h: L }, { x: cx + half, y: z.h - L, w: T, h: L });
  }
}
for (const zid in ZONES) {
  const z = ZONES[zid];
  const outside = q => q[0] < 0 || q[1] < 0 || q[0] > z.w || q[1] > z.h;
  for (const p of z.paths || []) for (const e of z.exits || []) {
    if (!e.hall) continue;
    const ec = { x: e.x + e.w / 2, y: e.y + e.h / 2 }, inner = exitInner(z, e);
    const dEc = q => Math.hypot(q[0] - ec.x, q[1] - ec.y);
    const dl = Math.hypot(inner.x - ec.x, inner.y - ec.y) || 1, ox = inner.x + (inner.x - ec.x) / dl * 150, oy = inner.y + (inner.y - ec.y) / dl * 150;
    for (const end of [0, 1]) {
      const i = end ? p.pts.length - 1 : 0, pt = p.pts[i], other = p.pts[end ? 0 : p.pts.length - 1];
      if (outside(pt)) {
        if (dEc(pt) > e.hall + 900 || p.done) continue;
        const pts = end ? p.pts.slice() : p.pts.slice().reverse(), tail = [];
        while (pts.length && outside(pts[pts.length - 1])) tail.unshift(pts.pop());
        if (!tail.length || !pts.length) continue;
        const crossX = tail[0];
        if (dEc(crossX) > e.hall + 900) continue;
        while (pts.length > 1 && dEc(pts[pts.length - 1]) < e.hall + 150) pts.pop();
        pts.push([Math.round(ox), Math.round(oy)], [Math.round(inner.x), Math.round(inner.y)], [Math.round(ec.x), Math.round(ec.y)], ...tail);
        p.pts = end ? pts : pts.reverse();
        p.done = true;
        continue;
      }
      if (outside(other)) continue;
      if (dEc(pt) > e.hall + 260) continue;
      const pts = end ? p.pts.slice() : p.pts.slice().reverse();
      while (pts.length > 1 && dEc(pts[pts.length - 1]) < e.hall + 120) pts.pop();
      pts.push([Math.round(inner.x), Math.round(inner.y)], [Math.round(ec.x), Math.round(ec.y)]);
      p.pts = end ? pts : pts.reverse();
    }
  }
}
for (const zid in ZONES) for (const e of ZONES[zid].exits || []) {
  const B = ZONES[e.to];
  if (!B || e.kind === "door") continue;
  const back = (B.exits || []).find(x => x.to === zid && x.kind !== "door");
  const p = back && back.hall ? exitInner(B, back) : null;
  if (p) { e.tx = Math.round(p.x); e.ty = Math.round(p.y); }
}
for (const zid in ZONES) {
  const z = ZONES[zid];
  if (!z.spawns || !z.spawns.length || !z.w) continue;
  const cell = Math.max(z.w, z.h) / 15, gap = CONFIG.spawnGapCells * cell, exitR = CONFIG.spawnExitCells * cell;
  const exitDist = sp => Math.min(...(z.exits || []).map(e => Math.hypot(sp.x - (e.x + e.w / 2), sp.y - (e.y + e.h / 2))), 1e9);
  const near = (a, b) => Math.abs(a.x - b.x) < gap && Math.abs(a.y - b.y) < gap;
  const order = z.spawns.slice().sort((a, b) => (b.nm ? 1 : 0) - (a.nm ? 1 : 0) || (b.bf ? 1 : 0) - (a.bf ? 1 : 0) || exitDist(b) - exitDist(a));
  const fixed = sp => FAMILIES[sp.fam] && (FAMILIES[sp.fam].nm || FAMILIES[sp.fam].boss);
  const kept = z.spawns.filter(fixed);
  const inWall = sp => (z.walls || []).some(q => sp.x > q.x - 24 && sp.x < q.x + q.w + 24 && sp.y > q.y - 24 && sp.y < q.y + q.h + 24) || (z.water || []).some(w => Math.hypot(sp.x - w.x, sp.y - w.y) < w.r + 20);
  for (const sp of order) if (!kept.includes(sp) && !inWall(sp) && (sp.bf || exitDist(sp) >= exitR) && !kept.some(k => near(k, sp))) kept.push(sp);
  if (!kept.length) kept.push(order[0]);
  for (const sp of z.spawns) {
    if (kept.includes(sp)) continue;
    let best = null, bd = 1e12;
    for (const k of kept) { if (!!k.bf !== !!sp.bf || fixed(k)) continue; const d = Math.hypot(k.x - sp.x, k.y - sp.y); if (d < bd) { bd = d; best = k; } }
    if (!best) best = kept[0];
    (best.alts = best.alts || []).push({ fam: sp.fam, lv: sp.lv, time: sp.time, weather: sp.weather, nm: sp.nm, passive: sp.passive });
  }
  z.spawns = z.spawns.filter(sp => kept.includes(sp));
  const critter = o => FAMILIES[o.fam] && !FAMILIES[o.fam].aggro && !FAMILIES[o.fam].nm;
  for (const sp of z.spawns) { if (critter(sp) && sp.time === "day") delete sp.time; for (const a of sp.alts || []) if (critter(a) && a.time === "day") delete a.time; }
}
const POI_LORE = {
  hollow: "Before the Outpost there was the Fort, and before the Fort there was only the Hollow and the people who herded in it. They cut these words so their children would know the safe paths: keep to the old road, drink from the mirror lake, and never sleep where the goblins dig.",
  frost: "Here the first climbers turned back. Above this stone the air grows thin and the black rock bleeds cold. Whoever reads this: the summit is not empty. Something stands there and waits for the ash to fall.",
  marsh: "The chapel bell rang for a hundred years before the water took it. They say it still rings for those who drown in the mire. Count the tolls; if you hear thirteen, turn back."
};
const POI_IDS = [];
function poiSpot(z, cx, cy, rad) {
  const segD = (px, py, a) => { const dx = a[2] - a[0], dy = a[3] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t); };
  const ok = (x, y) => x > 260 && y > 260 && x < z.w - 260 && y < z.h - 260 && !(z.exits || []).some(e => e.kind !== "door" && Math.hypot(x - e.x - e.w / 2, y - e.y - e.h / 2) < 480) && !(z.walls || []).some(q => x > q.x - 70 && x < q.x + q.w + 70 && y > q.y - 70 && y < q.y + q.h + 70) && !(z.water || []).some(w => Math.hypot(x - w.x, y - w.y) < w.r + 70) && !((z.ruins && z.ruins.walls) || []).some(a => segD(x, y, a) < 90) && !(z.spawns || []).some(sp => Math.hypot(sp.x - x, sp.y - y) < 110) && !(z.npcs || []).some(n => Math.hypot(n.x - x, n.y - y) < 140);
  for (let k = 0; k < 64; k++) { const a = k * 2.4, r = rad * (0.5 + (k % 8) / 8); const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (ok(x, y)) return { x, y }; }
  return null;
}
const POI_PLAN = { hollow: ["shrine"], hollow_lake: ["lookout"], hollow_ruins: ["tablet", "cache"], frost: ["lookout", "shrine", "tablet", "cache"], marsh: ["lookout", "shrine", "tablet", "cache"] };
for (const zid in POI_PLAN) {
  const z = ZONES[zid], L = z.landmarks || [];
  if (!L.length) continue;
  const pick = i => L[Math.min(L.length - 1, i)];
  const defs = [["lookout", "Lookout Tower", "lookout", "talkLookout", pick(0)], ["shrine", "Wayside Shrine", "shrine", "talkShrine", pick(2)], ["tablet", "Weathered Tablet", "tablet", "talkLore", pick(4)], ["cache", "Hidden Cache", "chest", "talkChest", pick(L.length - 1)]];
  let salt = 0;
  for (const [k, name, prop, talk, lm] of defs) {
    if (!POI_PLAN[zid].includes(k)) continue;
    const id = k + "_" + areaOf(zid), at = poiSpot(z, lm.x, lm.y, (lm.r || 200) + 140 + 110 * salt++);
    if (!at) continue;
    NPCS[id] = Object.assign({ name, prop, talk, poi: k }, prop === "chest" ? { chest: "vault" } : {});
    z.npcs.push({ id, x: at.x, y: at.y });
    if (k !== "cache") POI_IDS.push(id);
  }
}
ACHIEVEMENTS.push({ id: "wayfarer", icon: "🧭", name: "Wayfarer", desc: "Visit every lookout tower, wayside shrine and weathered tablet in the wilds.", test: s => POI_IDS.every(id => (s.poi || {})[id]) });
const CAMP_NAMES = { hollow: "Meadow Camp", hollow_lake: "Mirror Lake Camp", hollow_ruins: "Ruins Camp", frost: "Frostspire Camp", marsh: "Mire Camp" };
for (const zid of ["hollow", "hollow_lake", "hollow_ruins", "frost", "marsh"]) {
  const z = ZONES[zid], L = z.landmarks || [], lm = L[Math.floor(L.length / 2)] || { x: z.w / 2, y: z.h / 2, r: 200 };
  const at = poiSpot(z, lm.x, lm.y, (lm.r || 200) + 260);
  if (!at) continue;
  NPCS["camp_" + zid] = { name: CAMP_NAMES[zid], prop: "camp", talk: "talkCamp", poi: "camp" };
  z.npcs.push({ id: "camp_" + zid, x: at.x, y: at.y });
}
for (const zid in ZONES) {
  const z = ZONES[zid];
  if (z.indoor || z.theme === "house" || z.theme === "cave" || z.theme === "crypt") continue;
  (z.exits || []).forEach((e, i) => {
    if (!e.hall || e.kind === "door" || !ZONES[e.to]) return;
    const inner = exitInner(z, e), horiz = e.x <= 0 || e.x + e.w >= z.w, off = (e.lane || 110) + 45;
    const id = "sign_" + zid + "_" + i;
    NPCS[id] = { name: "Signpost", prop: "sign", talk: "talkSign", signTo: e.to };
    z.npcs.push({ id, x: Math.round(inner.x + (horiz ? 0 : off)), y: Math.round(inner.y + (horiz ? off : 0)) });
  });
}
const WARP_STONES = {
  outpost: { res: [2150, 2560], gov: [3460, 1600], market: [3380, 2980], ind: [3440, 3800], gate: [5180, 2840] },
  harbor: { fish: [324, 564], square: [900, 464], yard: [1400, 600], docks: [904, 1120] },
  ironvale: { gate: [284, 704], keep: [660, 184], market: [900, 580], south: [900, 1180], forge: [1520, 704] }
};
for (const zid in WARP_STONES) for (const did in WARP_STONES[zid]) {
  const id = "warpstone_" + zid + "_" + did, d = ZONES[zid].districts.find(q => q.id === did);
  NPCS[id] = { name: "Warp Stone: " + d.name, prop: "statue", warpstone: true, talk: "talkWarpStone", warpZone: zid, warpDistrict: did };
  ZONES[zid].npcs.push({ id, x: WARP_STONES[zid][did][0], y: WARP_STONES[zid][did][1] });
  const sid = "dsign_" + zid + "_" + did;
  NPCS[sid] = { name: "District Signpost", prop: "sign", talk: "talkDistrictSign" };
  ZONES[zid].npcs.push({ id: sid, x: WARP_STONES[zid][did][0] + 60, y: WARP_STONES[zid][did][1] + 6 });
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
const HOUSE_DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
function houseDir(h) { return HOUSE_DIRS[(h.rot || 0) & 3]; }
function houseAng(h) { return ((h.rot || 0) & 3) * Math.PI / 2; }
function houseLocal(h) { return (h.rot || 0) % 2 ? { w: h.h, d: h.w } : { w: h.w, d: h.h }; }
function houseDoor(h, off) { const [dx, dy] = houseDir(h); return { x: h.x + dx * (h.w / 2 + (off || 0)), y: h.y + dy * (h.h / 2 + (off || 0)) }; }
function houseRect(h, x, y) { return { x: (x == null ? h.x : x) - h.w / 2, y: (y == null ? h.y : y) - h.h / 2, w: h.w, h: h.h }; }
function inRect(x, y, r, pad) { return x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad; }
function rectsHit(a, b, pad) { return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad; }
function roadGap(z, x, y, noLanes) {
  let g = 1e9;
  for (const p of z.paths || []) {
    if (noLanes && p.lane) continue;
    for (let i = 0; i < p.pts.length - 1; i++) {
      const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L));
      g = Math.min(g, Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t) - p.w / 2);
    }
  }
  return g;
}
function rectOnRoad(z, r, pad, skip) {
  for (const p of z.paths || []) {
    if (p === skip) continue;
    for (let i = 0; i < p.pts.length - 1; i++) if (segRect(p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1], r, p.w / 2 + pad)) return p;
  }
  return null;
}
function doorRay(z, h, rot, maxT) {
  const [dx, dy] = HOUSE_DIRS[rot], fx = h.x + dx * h.w / 2, fy = h.y + dy * h.h / 2, T = maxT || 420;
  const ex = fx + dx * T, ey = fy + dy * T, bx0 = Math.min(fx, ex), bx1 = Math.max(fx, ex), by0 = Math.min(fy, ey), by1 = Math.max(fy, ey);
  const box = (x0, y0, x1, y1, p) => x1 + p >= bx0 && x0 - p <= bx1 && y1 + p >= by0 && y0 - p <= by1;
  const segs = [];
  for (const p of z.paths || []) for (let i = 0; i < p.pts.length - 1; i++) {
    const a = p.pts[i], b = p.pts[i + 1];
    if (box(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1]), p.w / 2)) segs.push([a, b, p.w / 2]);
  }
  const rects = (z.houses || []).filter(o => o !== h).map(o => [houseRect(o), 2]).concat(cityWallRects(z).map(r => [r, 4])).filter(([r]) => box(r.x, r.y, r.x + r.w, r.y + r.h, 4));
  for (let t = 2; t <= T; t += 4) {
    const x = fx + dx * t, y = fy + dy * t;
    for (const [a, b, r] of segs) {
      const sx = b[0] - a[0], sy = b[1] - a[1], L = sx * sx + sy * sy || 1, u = Math.max(0, Math.min(1, ((x - a[0]) * sx + (y - a[1]) * sy) / L)), ex = x - a[0] - sx * u, ey = y - a[1] - sy * u;
      if (ex * ex + ey * ey <= r * r) return { t, x, y };
    }
    if (x < 30 || y < 30 || x > z.w - 30 || y > z.h - 30) return null;
    for (const [r, pad] of rects) if (inRect(x, y, r, pad)) return null;
  }
  return null;
}
function gateZones(z) {
  if (z._gz) return z._gz;
  const out = [], A = GATE_HALF + 30;
  for (const g of z.gates || []) out.push(g.horiz ? { x: g.x - A, y: g.y - 130, w: A * 2, h: 260 } : { x: g.x - 130, y: g.y - A, w: 260, h: A * 2 });
  for (const e of z.exits || []) {
    if (e.kind === "door") continue;
    const sd = exitSide(z, e), D = (e.hall || 0) + 110;
    if (sd === "w") out.push({ x: 0, y: e.y - 60, w: D, h: e.h + 120 });
    if (sd === "e") out.push({ x: z.w - D, y: e.y - 60, w: D, h: e.h + 120 });
    if (sd === "n") out.push({ x: e.x - 60, y: 0, w: e.w + 120, h: D });
    if (sd === "s") out.push({ x: e.x - 60, y: z.h - D, w: e.w + 120, h: D });
  }
  return z._gz = out;
}
function lotFree(z, h, x, y, hard) {
  const r = houseRect(h, x, y);
  if (r.x < 40 || r.y < 40 || r.x + r.w > z.w - 40 || r.y + r.h > z.h - 40) return false;
  const dd = h.district && (z.districts || []).find(q => q.id === h.district);
  if (dd && (r.x < dd.x || r.y < dd.y || r.x + r.w > dd.x + dd.w || r.y + r.h > dd.y + dd.h)) return false;
  if ((z.houses || []).some(o => o !== h && rectsHit(r, houseRect(o), hard ? 4 : 14))) return false;
  if (cityWallRects(z).some(w => rectsHit(r, w, 24))) return false;
  if (gateZones(z).some(g => rectsHit(r, g, 0))) return false;
  if (hard) return true;
  if ((z.stalls || []).some(s => rectsHit(r, { x: s.x - 26, y: s.y - 16, w: 52, h: 32 }, 8))) return false;
  if ((z.gardens || []).some(g => rectsHit(r, { x: g.x - g.w / 2, y: g.y - g.h / 2, w: g.w, h: g.h }, 6))) return false;
  const circ = (cx, cy, rad) => Math.hypot(Math.max(r.x - cx, 0, cx - r.x - r.w), Math.max(r.y - cy, 0, cy - r.y - r.h)) < rad;
  for (const q of (z.plaza ? [z.plaza] : []).concat(z.plazas || [])) if (circ(q.x, q.y, q.r + 6)) return false;
  for (const q of z.fountains || []) if (circ(q.x, q.y, 60)) return false;
  for (const q of z.water || []) if (circ(q.x, q.y, q.r + 10)) return false;
  return !rectOnRoad(z, r, 2);
}
const SHOP_FRONT = { lo: 46, hi: 80, tgt: 56 }, HOME_FRONT = { lo: 8, hi: 60, tgt: 24 };
function frontage(z) {
  const doorTied = h => (z.exits || []).some(e => e.kind === "door" && inRect(e.x + e.w / 2, e.y + e.h / 2, houseRect(h), 40));
  for (const h of z.houses || []) { const dd = (z.districts || []).find(q => h.x >= q.x && h.x < q.x + q.w && h.y >= q.y && h.y < q.y + q.h); if (dd) h.district = dd.id; }
  for (const h of z.houses || []) {
    if (h.fixed || doorTied(h) || lotFree(z, h, h.x, h.y, true)) continue;
    let best = null;
    for (let rr = 8; rr <= 480 && !best; rr += 8) for (let k = 0; k < 32; k++) {
      const a = k / 32 * Math.PI * 2, x = Math.round(h.x + Math.cos(a) * rr), y = Math.round(h.y + Math.sin(a) * rr);
      if (lotFree(z, h, x, y)) { best = { x, y }; break; }
    }
    if (best) { h.x = best.x; h.y = best.y; }
  }
  for (const h of (z.houses || []).slice().sort((a, b) => (b.shop ? 1 : 0) - (a.shop ? 1 : 0))) {
    if (h.fixed || doorTied(h)) { h.fixed = true; continue; }
    let best = null;
    for (let s = 0; s < 4; s++) {
      const r = doorRay(z, h, s);
      if (!r) continue;
      const sc = r.t - (s === (h.rot || 0) ? 20 : 0);
      if (!best || sc < best.sc) best = { s, sc };
    }
    if (best) h.rot = best.s;
    const F = h.shop ? SHOP_FRONT : HOME_FRONT, r0 = doorRay(z, h, h.rot || 0);
    if (!r0 || (r0.t >= F.lo && r0.t <= F.hi)) continue;
    const [dx, dy] = houseDir(h), want = r0.t - F.tgt, sg = Math.sign(want);
    for (let d = want; Math.abs(d) >= 4 && Math.sign(d) === sg; d -= sg * 4) {
      if (lotFree(z, h, h.x + dx * d, h.y + dy * d)) { h.x += dx * d; h.y += dy * d; break; }
    }
  }
  for (const h of z.houses || []) {
    if (h.fixed) continue;
    const r = doorRay(z, h, h.rot || 0), F = h.shop ? SHOP_FRONT : HOME_FRONT;
    if (!r || r.t <= F.hi + 6) continue;
    const [dx, dy] = houseDir(h), d0 = houseDoor(h);
    z.paths.push({ w: 30, lane: true, pts: [[Math.round(d0.x), Math.round(d0.y)], [Math.round(r.x + dx * 10), Math.round(r.y + dy * 10)]] });
  }
  for (const h of z.houses || []) {
    if (!h.shop) continue;
    const n = z.npcs.find(q => q.id === h.shop);
    if (!n) continue;
    const [dx, dy] = houseDir(h), d0 = houseDoor(h, 34), lane = (z.paths || []).some(p => p.lane && Math.hypot(p.pts[0][0] - h.x - dx * h.w / 2, p.pts[0][1] - h.y - dy * h.h / 2) < 2);
    const spots = (lane ? [26, -26, 0] : [0, 26, -26]).map(o => ({ x: Math.round(d0.x - dy * o), y: Math.round(d0.y + dx * o) }));
    const at = spots.find(p => roadGap(z, p.x, p.y, !lane) >= 14 && !(z.stalls || []).some(s => Math.hypot(p.x - s.x, p.y - s.y) < 40)) || spots[0];
    n.x = at.x; n.y = at.y; n.face = Math.atan2(dy, dx); n.shopFront = true;
  }
}
for (const zid in ZONES) if (ZONES[zid].theme === "town" && !ZONES[zid].indoor && (ZONES[zid].houses || []).length) frontage(ZONES[zid]);
const OFFROAD_PROPS = { sign: 1, board: 1, tablet: 1, brazier: 1, shrine: 1, lookout: 1, statue: 1 };
function clearOfRoads(z, x, y, extra, plaza) {
  if (x <= 60 || y <= 60 || x >= z.w - 60 || y >= z.h - 60) return false;
  for (const p of z.paths || []) {
    const rr = (p.w / 2 + extra) * (p.w / 2 + extra), pts = p.pts;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)), ex = x - a[0] - dx * t, ey = y - a[1] - dy * t;
      if (ex * ex + ey * ey < rr) return false;
    }
  }
  if (plaza) for (const q of (z.plaza ? [z.plaza] : []).concat(z.plazas || [])) if ((x - q.x) * (x - q.x) + (y - q.y) * (y - q.y) < (q.r + extra) * (q.r + extra)) return false;
  for (const h of z.houses || []) if (Math.abs(x - h.x) < h.w / 2 + 28 && Math.abs(y - h.y) < h.h / 2 + 28) return false;
  if (z.cityWalls) for (const r of cityWallRects(z)) if (x > r.x - 20 && x < r.x + r.w + 20 && y > r.y - 20 && y < r.y + r.h + 20) return false;
  for (const g of z.gates || []) if (Math.abs(g.horiz ? x - g.x : y - g.y) < GATE_HALF + 30 && Math.abs(g.horiz ? y - g.y : x - g.x) < 140) return false;
  for (const [ox, oy, fx, fy, hw] of z._fronts || (z._fronts = (z.houses || []).filter(h => h.trade).map(h => { const fd = houseDoor(h), [fx, fy] = houseDir(h); return [fd.x, fd.y, fx, fy, ((h.rot || 0) % 2 ? h.h : h.w) / 2 + 24]; }))) {
    const al = (x - ox) * fx + (y - oy) * fy;
    if (al > -4 && al < 124 && Math.abs((x - ox) * -fy + (y - oy) * fx) < hw) return false;
  }
  for (const f of z.fountains || []) if ((x - f.x) * (x - f.x) + (y - f.y) * (y - f.y) < 8100) return false;
  return true;
}
function offRoadGroup(z, items, extra, plaza) {
  const home = items.map(q => z.districts ? districtAt(z, q.x, q.y) : null);
  const ok = (dx, dy) => items.every((q, i) => clearOfRoads(z, q.x + dx, q.y + dy, extra, plaza) && (!z.districts || districtAt(z, q.x + dx, q.y + dy) === home[i]));
  if (ok(0, 0)) return;
  for (let r = 12; r <= 480; r += 12) for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2, dx = Math.round(Math.cos(a) * r), dy = Math.round(Math.sin(a) * r);
    if (ok(dx, dy)) { for (const q of items) { q.x += dx; q.y += dy; } return; }
  }
}
for (const zid in ZONES) {
  const z = ZONES[zid];
  if (z.indoor || z.theme === "house" || z.theme === "cave" || z.theme === "crypt" || !((z.paths || []).length || z.plaza || (z.plazas || []).length)) continue;
  const one = (q, extra, plaza) => offRoadGroup(z, [q], extra, plaza);
  const grid = a => (a || []).forEach(q => { const at = { x: q[0], y: q[1] }; one(at, 24); q[0] = at.x; q[1] = at.y; });
  const folk = n => { const d = NPCS[n.id]; return d && !d.prop && !d.crystal && !d.warpstone; };
  const tables = (z.stalls || []).concat((z.props || []).filter(p => p.type === "desk"));
  for (const t of tables) offRoadGroup(z, [t].concat(z.npcs.filter(n => folk(n) && !n.shopFront && Math.hypot(n.x - t.x, n.y - t.y) < 110)), 24);
  for (const n of z.npcs) if (folk(n) && !n.shopFront) one(n, 16);
  for (const n of z.npcs) if (NPCS[n.id] && NPCS[n.id].warpstone) one(n, 30, true);
  for (const n of z.npcs) {
    const d = NPCS[n.id];
    if (!d || !d.prop || !OFFROAD_PROPS[d.prop] || d.warpstone) continue;
    const plz = n.id.startsWith("dsign_");
    if (plz) {
      const st = z.npcs.find(q => q.id === "warpstone_" + n.id.slice(6));
      if (st) { n.x = st.x + 60; n.y = st.y + 6; }
    }
    one(n, 24, plz);
  }
  grid(z.benches); grid(z.racks); grid(z.dummies);
  (z.props || []).filter(p => p.type !== "desk").forEach(p => one(p, 24));
  (z.lamps || []).forEach(q => { const at = { x: q[0], y: q[1] }; one(at, 6); q[0] = at.x; q[1] = at.y; });
}
const CITY_LIFE = {
  market: [6, 1], square: [6, 1], fish: [4, 1], docks: [4, 1], gov: [2, 2], keep: [1, 2], res: [3, 1], south: [3, 1], ind: [3, 1], yard: [3, 1], gate: [2, 2], forge: [3, 1]
};
Object.assign(QUESTS, {
  sam: { name: "The Patient Blade", giver: "Tobin", npc: "tobin", lv: 12, items: { iron_ingot: 1, ash_lumber: 2 }, desc: "Bring Tobin 1 Iron Ingot and 2 Ash Lumber to learn the Samurai's way.", reward: { xp: 700, gil: 0, item: "tachi", items: [["harpoon", 1]], qty: 1, unlock: "SAM" },
    intro: "A Samurai fights with one great blade held in both hands and a mind kept very still. They meditate in the middle of a fight to gather strength and read a foe's next blow before it lands. Bring me an iron ingot and good ash lumber, and we'll fit you a tachi.", progress: "1 Iron Ingot and 2 Ash Lumber. The smith and the carpenters' benches can make both.", turn: "Good steel, good wood. Hold the tachi high and breathe slowly; the blade will do the rest." },
  nin: { name: "Steps Without Sound", giver: "Tobin", npc: "tobin", lv: 12, items: { bat_wing: 3, worm_silk: 2 }, desc: "Bring Tobin 3 Bat Wings and 2 Worm Silk to learn the Ninja's arts.", reward: { xp: 700, gil: 0, item: "kunai", qty: 1, unlock: "NIN" },
    intro: "A Ninja hides behind shadow images, throws stars of fire and frost, and slips away when the fight turns. Quick hands, quick feet. Bring me bat wings for the shadows and worm silk for the threads.", progress: "3 Bat Wings and 2 Worm Silk. Bats fly at night; worms dig through the Hollow.", turn: "Light, quiet and sharp. Take this katana, and remember: the shadows only take a few hits each." },
  drg: { name: "Wings of the Wyrm", giver: "Tobin", npc: "tobin", lv: 12, items: { lizard_skin: 3, crag_feather: 1 }, desc: "Bring Tobin 3 Lizard Skins and 1 Crag Feather to take up the Dragoon's lance.", reward: { xp: 700, gil: 0, item: "harpoon", qty: 1, unlock: "DRG" },
    intro: "Dragoons fight with the lance and the leap. They spring high into the air and come down point first, and the spirit of the old wyrms lends them strength. Bring me lizard skins for a grip and a feather from the Crag Talons for luck.", progress: "3 Lizard Skins from the Hollow's hill lizards and 1 Crag Feather from the marsh roost.", turn: "Scale and feather. Here is your spear. Jump high, land hard." }
});
Object.assign(QUESTS, {
  bst: { name: "Call of the Wild", giver: "Tobin", npc: "tobin", lv: 14, items: { lizard_skin: 2, wool_tuft: 3 }, desc: "Bring Tobin 2 Lizard Skins and 3 Wool Tufts to learn the Beastmaster's ways.", reward: { xp: 800, gil: 0, item: "bronze_axe", qty: 1, unlock: "BST" },
    intro: "A Beastmaster never fights alone. They whistle up a beast of the wilds, feed it, and set it on their foes, then wade in after it with an axe. Bring me a lizard's skin and some sheep's wool for a beast's harness, and I'll teach you the call.", progress: "2 Lizard Skins and 3 Wool Tufts. The Hollow has both.", turn: "A good harness. Take this axe, and whistle; something will answer." },
  blu: { name: "The Borrowed Art", giver: "Tobin", npc: "tobin", lv: 14, items: { crab_shell: 2, mandrake_leaf: 2 }, desc: "Bring Tobin 2 Crab Shells and 2 Mandrake Leaves to begin the Blue Mage's study.", reward: { xp: 800, gil: 0, item: "bronze_sword", qty: 1, unlock: "BLU" },
    intro: "A Blue Mage learns magic from monsters. Watch a beast use its special move up close and survive it, and you can learn to do the same. A dangerous way to study. Bring me crab shells and mandrake leaves and I'll open your eyes to it.", progress: "2 Crab Shells and 2 Mandrake Leaves. Crabs live by the water; mandrakes come out by day.", turn: "Now stand close when the monsters strike. As a Blue Mage, every move you see might become your own." },
  cor: { name: "Lady Luck", giver: "Tobin", npc: "tobin", lv: 14, items: { harbor_bream: 2, orc_tooth: 1 }, desc: "Bring Tobin 2 Harbor Bream and 1 Orc Tooth to roll with the Corsairs.", reward: { xp: 800, gil: 0, item: "bronze_dagger", qty: 1, unlock: "COR" },
    intro: "Corsairs trust the dice. A good roll lifts the whole crew's blade or aim; a greedy one can bust. They carry daggers and a pistol for a quick shot. Bring me fresh bream from Saltreach and an orc's tooth for a lucky die, and I'll show you the game.", progress: "2 Harbor Bream from the Saltreach docks and 1 Orc Tooth from the marsh orcs.", turn: "Here's a dagger and a pair of dice. Roll well." }
});
Object.assign(QUESTS, {
  pup: { name: "Strings and Springs", giver: "Tobin", npc: "tobin", lv: 16, items: { ash_lumber: 3, bronze_ingot: 2 }, desc: "Bring Tobin 3 Ash Lumber and 2 Bronze Ingots to build your first automaton.", reward: { xp: 900, gil: 0, item: "cesti", qty: 1, unlock: "PUP" },
    intro: "A Puppetmaster fights with fists and a friend made of wood and wire. The automaton takes blows and hits back while you weave in and out. I'll need good lumber for its frame and bronze for its springs.", progress: "3 Ash Lumber and 2 Bronze Ingots.", turn: "There. Wind the key, and it'll follow you anywhere. Mind you keep it in repair." },
  dnc: { name: "The First Step", giver: "Tobin", npc: "tobin", lv: 16, items: { silk_cloth: 2, honeycomb: 2 }, desc: "Bring Tobin 2 Silk Cloth and 2 Honeycombs to learn the Dancer's steps.", reward: { xp: 900, gil: 0, item: "bronze_dagger", qty: 1, unlock: "DNC" },
    intro: "A Dancer turns the rhythm of battle into healing and openings. Steps throw a foe off balance, flourishes spend those openings, and waltzes mend your friends. Bring me silk for a costume and honey for the throat.", progress: "2 Silk Cloth and 2 Honeycombs.", turn: "Lovely. Feel the beat: every swing builds the energy you spend on a waltz." },
  sch: { name: "Ink and Insight", giver: "Tobin", npc: "tobin", lv: 16, items: { heartwood: 1, crypt_dust: 2 }, desc: "Bring Tobin 1 Heartwood and 2 Crypt Dust to begin a Scholar's studies.", reward: { xp: 900, gil: 0, item: "ash_staff", qty: 1, unlock: "SCH" },
    intro: "A Scholar studies both white and black magic, and leans into one at a time. Light Arts for healing, Dark Arts for destruction. Bring me heartwood for a quill case and crypt dust to mix the ink.", progress: "1 Heartwood (from the elder treants) and 2 Crypt Dust.", turn: "Your first grimoire. Read it twice; then read it again." }
});
Object.assign(QUESTS, {
  geo: { name: "The Shape of the Land", giver: "Tobin", npc: "tobin", lv: 18, items: { crag_feather: 2, frost_shard: 2 }, desc: "Bring Tobin 2 Crag Feathers and 2 Frost Shards to learn geomancy.", reward: { xp: 1000, gil: 0, item: "maple_wand", qty: 1, unlock: "GEO" },
    intro: "A Geomancer bends the land's own currents into auras that follow them, and plants a luopan to curse the ground under their foes. Bring me feathers from the high roost and shards of the pass's ice; they hold the currents well.", progress: "2 Crag Feathers and 2 Frost Shards.", turn: "Ring the bell and listen. The land will answer." },
  run: { name: "Carved in Steel", giver: "Tobin", npc: "tobin", lv: 18, items: { orc_tooth: 2, iron_ingot: 2 }, desc: "Bring Tobin 2 Orc Teeth and 2 Iron Ingots to become a Rune Fencer.", reward: { xp: 1000, gil: 0, item: "claymore", items: [["bronze_sword", 1]], qty: 1, unlock: "RUN" },
    intro: "A Rune Fencer carves runes into the air to turn blows aside, then hurls them at the enemy all at once. They wield the great sword and hold the line. Bring me iron for a blade and orc teeth to carve the first runes.", progress: "2 Orc Teeth and 2 Iron Ingots.", turn: "Hold the sword like a wall, and the runes like a promise." }
});
Object.assign(NPCS, {
  brisa: { name: "Brisa, Quartermaster", model: "brisa", talk: "talkBrisa" },
  haldor: { name: "Haldor, Mythrilsmith", model: "haldor", talk: "talkHaldor" },
  crystal_ironvale: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  guard_ironvale: { name: "Ironvale Guard Bram", model: "guard", talk: "talkGuard" }
});
ACHIEVEMENTS.push({ id: "spire", icon: "🗼", name: "Top of the Spire", desc: "Defeat the Spire Warden at the summit of the Red Spire.", test: s => !!(s.nmKilled && s.nmKilled.spire_warden) });
WEATHER.highlands = [["clear", 5], ["wind", 4], ["cloudy", 3], ["rain", 1.5], ["storm", 1]];
SHOPS.essa = ["potion", "hi_potion", "ether", "herb_bread", "carp_stew", "bait", "fishing_rod"].filter(id => ITEMS[id]);
ACHIEVEMENTS.push({ id: "highlands", icon: "🐎", name: "Wide Open Sky", desc: "Set foot in the Windreach Highlands.", test: s => areaVisited(s, "highlands") });
FISH.underdeep = [["glowfin", 8, 7], ["blind_eel", 14, 2], ["mud_eel", 0, 3]];
ACHIEVEMENTS.push({ id: "underdeep", icon: "🛶", name: "Down the River", desc: "Ride the boat across the Underdeep River.", test: s => !!(s.stats && s.stats.boatRides) });
WEATHER.gullisle = [["clear", 6], ["wind", 3], ["cloudy", 2], ["rain", 2], ["storm", 0.7]];
FISH.gullisle = [["sea_bass", 6, 7], ["harbor_bream", 0, 4], ["tidecaller_tuna", 14, 1.2]];
ACHIEVEMENTS.push({ id: "gullisle", icon: "🏝️", name: "Island Hopper", desc: "Take the ferry to Gull Isle.", test: s => areaVisited(s, "gullisle") });
CONFIG.ferryCost = 100;
WEATHER.cinder = [["cloudy", 4], ["clear", 3], ["fog", 2], ["wind", 2], ["storm", 0.5]];
ACHIEVEMENTS.push({ id: "cinder", icon: "🌋", name: "Trial by Fire", desc: "Set foot on Cinder Peak.", test: s => areaVisited(s, "cinder") });
WEATHER.verdant = [["rain", 5], ["cloudy", 3], ["fog", 2], ["clear", 2], ["storm", 1.2]];
ACHIEVEMENTS.push({ id: "verdant", icon: "🌴", name: "Into the Green", desc: "Set foot in the Verdant Jungle.", test: s => areaVisited(s, "verdant") });
WEATHER.sunscar = [["clear", 6], ["wind", 2.5], ["sandstorm", 2], ["cloudy", 1], ["storm", 0.3]];
WEATHER.cinder.push(["sandstorm", 1]);
ZONES.sunscar.spawns.push({ fam: "dune_worm", lv: [20, 20], x: 1500, y: 1900, weather: "sandstorm" });
ZONES.frost.spawns.push({ fam: "ice_wight", lv: [19, 20], x: Math.round(2200 * zsc("frost")), y: Math.round(1400 * zsc("frost")), weather: "blizzard" });
ZONES.marsh.spawns.push({ fam: "drowned", lv: [15, 16], x: Math.round(1700 * zsc("marsh")), y: Math.round(1400 * zsc("marsh")), weather: "fog" });
ACHIEVEMENTS.push({ id: "sunscar", icon: "🏜️", name: "Sunburnt", desc: "Set foot in the Sunscar Desert.", test: s => areaVisited(s, "sunscar") });
WEATHER.ironvale = [["clear", 4], ["snow", 3], ["cloudy", 3], ["wind", 1.5], ["fog", 0.8]];
SHOPS.haldor = Object.keys(GEAR_DATA).filter(id => GEAR_DATA[id].hq && GEAR_DATA[id].lv >= 14).concat(["iron_ingot", "potion", "hi_potion", "ether"].filter(id => ITEMS[id]));
Object.assign(QUESTS, {
  smokeline: { name: "Smoke on the Pass", giver: "Brisa", npc: "brisa", lv: 18, kill: { fam: "frost_stonechucker", n: 6, name: "Frost Stonechucker" }, desc: "Drive off 6 Frost Stonechuckers hurling rocks at Ironvale's ore carts in Frostspire Pass.", reward: { xp: 5000, gil: 2000, item: "bone_ring_hq", qty: 1 },
    intro: "Ironvale lives on the ore that comes down the pass, and the orcs up there have taken to smashing our carts with boulders. Thin them out and you'll have Ironvale's thanks.", progress: "6 Frost Stonechuckers, up in Frostspire Pass.", turn: "The carts are rolling again. Wear this ring; every guard in Ironvale will know you for a friend." },
  orerun: { name: "The Ore Run", giver: "Brisa", npc: "brisa", lv: 17, items: { iron_ore: 4, frost_shard: 3 }, desc: "Bring Brisa 4 Iron Ore and 3 Frost Shards for Ironvale's forges.", reward: { xp: 3000, gil: 1600 },
    intro: "Haldor's forges eat ore faster than the carts can bring it. If you're heading out, dig some iron and pick up frost shards; the mythril won't temper without them.", progress: "4 Iron Ore and 3 Frost Shards.", turn: "That'll keep the fires lit for a week. Here's your pay." }
});
ACHIEVEMENTS.push({ id: "ironvale", icon: "⛰️", name: "Mountain Welcome", desc: "Reach the city of Ironvale.", test: s => areaVisited(s, "ironvale") });
Object.assign(BESTIARY, {
  dune_lizard: { type: "Lizard", lore: "Sand-coloured lizards that lie half-buried in the dunes and burst out at passing feet." },
  sand_crab: { type: "Aquan", lore: "Crabs that live around the Glass Oasis and carry the desert on their backs." },
  sun_wasp: { type: "Vermin", lore: "Fat golden wasps that only fly in the full heat of the day." },
  dune_worm: { type: "Amorphous", lore: "Long worms that swim through sand as easily as soil." },
  cinder_bomb: { type: "Elemental", lore: "Bombs born of the desert's night fires. They drift between the mesas after dark." },
  sandmaw: { type: "Amorphous", lore: "A worm so large the dunes hum when it moves beneath them. Travellers call the place it hunts the Singing Dunes." }
});
Object.assign(BESTIARY, {
  vine_crawler: { type: "Vermin", lore: "Crawlers wrapped in living vines, impossible to spot until they move." },
  jade_hornet: { type: "Vermin", lore: "Green-gold hornets the size of a fist that nest in the jungle canopy." },
  jungle_sapling: { type: "Plantoid", lore: "Thorny jungle bulbs. The sprout on their heads grows fast, climbs faster, and strangles what it catches." },
  bloom_mandrake: { type: "Plantoid", lore: "Mandrakes crowned with heavy pink blooms. Their dust smells sweet and puts you to sleep." },
  jade_toad: { type: "Amphibian", lore: "Bright green toads that sit in the jungle pools and listen." },
  old_mossback: { type: "Plantoid", lore: "The oldest tree in the jungle, and it still walks. The canopy bends wherever it goes." }
});
Object.assign(BESTIARY, {
  magma_lizard: { type: "Lizard", lore: "Lizards with glowing cracks in their scales who bask on cooling lava." },
  obsidian_crab: { type: "Aquan", lore: "Crabs whose shells are black volcanic glass. Hard to crack, harder to see at night." },
  magma_worm: { type: "Amorphous", lore: "Worms that burrow through warm ash and leave smoking trails." },
  ash_orc: { type: "Beastman", lore: "Orcs who forge their axes in the mountain's heat and cover themselves in ash for war." },
  cinder_bones: { type: "Undead", lore: "The scorched remains of climbers who never came back down." },
  pyreclaw: { type: "Lizard", lore: "A lizard as big as a cart, with fire in its throat. It suns itself on the Crater Rim at night." }
});
NM_FAMILIES.fire_elemental = { hint: "Cinder Peak · any time", base: "magma_worm", name: "Fire Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#ff7043", loot: [["scroll_fire_spirit", 0.3], ["fire_crystal", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.ice_elemental = { hint: "Frostspire Pass · night", base: "glacier_worm", name: "Ice Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#81d4fa", loot: [["scroll_ice_spirit", 0.3], ["frost_shard", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.earth_elemental = { hint: "Underdeep River · any time", base: "crypt_sentinel", name: "Earth Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#bca27a", loot: [["scroll_earth_spirit", 0.3], ["earth_crystal", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.air_elemental = { hint: "Sunscar Desert · any time", base: "gale_talon", name: "Air Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#aed581", loot: [["scroll_air_spirit", 0.3], ["wind_crystal", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.thunder_elemental = { hint: "Verdant Jungle · day", base: "jade_hornet", name: "Thunder Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#fff176", loot: [["scroll_thunder_spirit", 0.3], ["wind_crystal", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.water_elemental = { hint: "Gull Isle · any time", base: "drowned", name: "Water Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#4fc3f7", loot: [["scroll_water_spirit", 0.3], ["water_crystal", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.light_elemental = { hint: "Windreach Highlands · day", base: "sun_wasp", name: "Light Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#fff9c4", loot: [["scroll_light_spirit", 0.3], ["hi_potion", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
NM_FAMILIES.dark_elemental = { hint: "Sunken Crypt · night", base: "ghoul", name: "Dark Elemental", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.6, aura: "#7e57c2", loot: [["scroll_dark_spirit", 0.3], ["bone_chip", 1], ["hi_potion", 0.5]], gil: [30, 50], respawn: 900 };
Object.assign(BESTIARY, {
  fire_elemental: { type: "Elemental", lore: "Crater Rim vents, where the heat gathers into a shape." },
  ice_elemental: { type: "Elemental", lore: "A knot of cold that walks the pass after dark." },
  earth_elemental: { type: "Elemental", lore: "Stone that remembers being a mountain, deep in the river caves." },
  air_elemental: { type: "Elemental", lore: "A whirlwind with a will, wandering the singing dunes." },
  thunder_elemental: { type: "Elemental", lore: "Lightning trapped in the jungle canopy, looking for the ground." },
  water_elemental: { type: "Elemental", lore: "The sea standing up on the shore of Gull Isle." },
  light_elemental: { type: "Elemental", lore: "Sunlight on the plateau that has learned to hunt." },
  dark_elemental: { type: "Elemental", lore: "The crypt's darkness, gathered up and given hunger." }
});
Object.assign(NPCS, {
  ferry_harbor: { name: "Ferryman Coll", model: "ferryman", talk: "talkFerry", ferryTo: "gullisle" },
  ferry_isle: { name: "Ferryman Coll's Mate", model: "ferryman", talk: "talkFerry", ferryTo: "harbor" },
  wend: { name: "Old Wend", model: "wend", talk: "talkWend" }
});
Object.assign(QUESTS, {
  isle_supper: { name: "Supper for Wend", giver: "Old Wend", npc: "wend", lv: 10, items: { sea_bass: 3 }, desc: "Bring Old Wend 3 Sea Bass. His knees won't take him to the water any more.", reward: { xp: 1800, gil: 400, item: "hope_earring", qty: 1 },
    intro: "Oh, a visitor! I've lived on this rock forty years and the gulls are still my only neighbours. Mind doing an old man a kindness? I've a fierce hunger for sea bass, and my knees won't take me down to the shore.", progress: "3 Sea Bass. They bite off the island's shores and the harbour.", turn: "Oh, that smells like the old days. Here, take my charm. The gulls will know you're a friend." }
});
Object.assign(BESTIARY, {
  reef_crab: { type: "Aquan", lore: "Red-shelled crabs that scuttle over Gull Isle's rocks at low tide." },
  shore_lizard: { type: "Lizard", lore: "Green lizards that sun on the island's warm stones." },
  gale_talon: { type: "Beastman", lore: "Crag Talons who nest on the island's cliffs and ride the sea wind." },
  isle_snapper: { type: "Aquan", lore: "Snappers that lurk in the shallows around the island's coves." },
  old_saltjaw: { type: "Aquan", lore: "A snapper older than the wreck in the cove it calls home." }
});
BESTIARY.spire_warden = { type: "Undead", lore: "The last keeper of the Red Spire. It has guarded the summit so long it has forgotten what it guards." };
Object.assign(NPCS, {
  boat_west: { name: "Boatman Ferro", model: "ferryman", talk: "talkBoat", boatTo: { x: 1880, y: 520 } },
  boat_east: { name: "Boatman Ferro's Twin", model: "ferryman", talk: "talkBoat", boatTo: { x: 1340, y: 520 } }
});
Object.assign(BESTIARY, {
  glow_bat: { type: "Vermin", lore: "Bats whose wings glow faintly from the mushrooms they roost among." },
  pale_crab: { type: "Aquan", lore: "Eyeless white crabs that feel their way along the river's banks." },
  lumicap: { type: "Plantoid", lore: "Glowing mushroom folk of the Underdeep. Their spores shine as they drift." },
  deep_worm: { type: "Amorphous", lore: "Grey worms that have never seen the sun, and never will." },
  lumicap_matron: { type: "Plantoid", lore: "A towering Lumicap that lights the whole Glimmer Grotto. The smaller caps gather around her." }
});
Object.assign(NPCS, {
  tarqa: { name: "Tarqa, Nomad Chief", model: "tarqa", talk: "talkTarqa" },
  essa: { name: "Essa, Nomad Trader", model: "essa", talk: "talkEssa" },
  nomad_rider: { name: "Nomad Rider Kael", model: "nomad", talk: "talkRider" },
  camp_nomad_a: { name: "Nomad Camp", prop: "camp", talk: "talkCamp", poi: "camp" },
  camp_nomad_b: { name: "Rider's Rest", prop: "camp", talk: "talkCamp", poi: "camp" }
});
Object.assign(QUESTS, {
  orcraid: { name: "Raiders on the Wind", giver: "Tarqa", npc: "tarqa", lv: 12, kill: { fam: "highland_orc", n: 6, name: "Highland Orc" }, desc: "Drive off 6 Highland Orcs who raid the nomads' herds from Eagle Ridge.", reward: { xp: 2400, gil: 900, item: "plate_belt", qty: 1 },
    intro: "My people follow the herds across the whole of Windreach. The orcs up on Eagle Ridge have started taking our animals. Show them the plateau has teeth.", progress: "6 Highland Orcs, camped west of the Ridge.", turn: "The herds sleep easier. Wear this sash; any nomad will share a fire with you." },
  feltwork: { name: "Felt for Winter", giver: "Tarqa", npc: "tarqa", lv: 10, items: { wool_tuft: 4, lizard_skin: 2 }, desc: "Bring Tarqa 4 Wool Tufts and 2 Lizard Skins for the camp's winter cloaks.", reward: { xp: 1600, gil: 500, item: "travelers_mantle", qty: 1 },
    intro: "Winter on the plateau is long. We felt our cloaks from wool and line them with lizard hide against the wind. Bring us some and you'll have one too.", progress: "4 Wool Tufts and 2 Lizard Skins.", turn: "Good wool. Here, this one was made for a traveller." }
});
BESTIARY.plains_hare = { type: "Beast", lore: "Long-legged hares of the open plateau, built for running." };
BESTIARY.plains_lizard = { type: "Lizard", lore: "Olive lizards that sun in the long grass." };
BESTIARY.wind_wasp = { type: "Vermin", lore: "Pale green wasps that ride the highland gusts." };
BESTIARY.highland_longneck = { type: "Beast", lore: "Tall grazers that cross the plateau in slow herds." };
BESTIARY.highland_orc = { type: "Beastman", lore: "Orcs who hunt the plateau's herds from Eagle Ridge." };
BESTIARY.thunderhoof = { type: "Beast", lore: "A huge longneck whose stamping can be heard before it is seen. The nomads call it the storm's own mount." };
const CONQUEST = {
  nations: { ash: { name: "Ashenreach League", short: "Ashenreach", color: "#e57373", town: "outpost" }, iron: { name: "Ironvale Compact", short: "Ironvale", color: "#90a4ae", town: "ironvale" }, beast: { name: "the Beastmen", short: "Beastmen", color: "#8d6e63" } },
  regions: {
    vale: { name: "The Vale", zones: ["hollow", "den", "crypt", "highlands"], start: "ash" },
    mire: { name: "The Mire", zones: ["marsh", "depths", "verdant", "underdeep"], start: "beast" },
    coast: { name: "The Coast", zones: ["gullisle"], start: "ash" },
    peaks: { name: "The Peaks", zones: ["frost"], start: "iron" },
    sands: { name: "The Sands", zones: ["sunscar", "cinder", "spire1", "spire2", "spire3", "spire4", "spire_top"], start: "iron" }
  },
  beastDaily: 30, rivalDaily: 20, holdBonus: 40
};
const EXPEDITIONS = {
  wilds: { name: "Across the Wilds", lv: 12, reward: { xp: 4000, gil: 2000, item: "holly_clogs" },
    intro: "The Guild wants a survey of the far roads. Go up through Frostspire Pass to the mountain city of Ironvale and see the Quartermaster there, then cross the Sunscar Desert to the bones the locals call Titan's Ribs. Come back and tell me what you saw.",
    steps: [
      { type: "zone", zone: "ironvale", text: "Reach the city of Ironvale, east of Frostspire Pass." },
      { type: "talk", npc: "brisa", text: "Speak with Brisa, Ironvale's quartermaster.", say: "From Ashenreach, are you? The Guild's maps of the south are years out of date. Take a look at the Ribs while you're down there; the dunes have moved." },
      { type: "visit", zone: "sunscar", lm: "ribs", text: "Find Titan's Ribs in the Sunscar Desert." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] },
  fire: { name: "Fire and Water", lv: 17, reward: { xp: 9000, gil: 4000, item: "amethyst_ring" },
    intro: "A scholar is paying well for proof of two places most people think are legends: a lake of fire on Cinder Peak and a grotto that glows under the jungle. Old Wend out on Gull Isle swears he's seen both. Find them, then ask him.",
    steps: [
      { type: "visit", zone: "cinder", lm: "lake", text: "Stand at the Molten Lake on Cinder Peak." },
      { type: "kill", fam: "magma_worm", n: 4, text: "Defeat 4 Magma Worms (Cinder Peak)." },
      { type: "visit", zone: "underdeep", lm: "grotto", text: "Find the Glimmer Grotto in the Underdeep." },
      { type: "talk", npc: "wend", text: "Tell Old Wend on Gull Isle what you found.", say: "Ha! Told them, didn't I? Fire you can drink and caves full of stars. Go on back and tell your Guild the old man was right." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] },
  ends: { name: "The Ends of the Map", lv: 19, reward: { xp: 12000, gil: 6000, item: "cotton_cape" },
    intro: "Last job I've got, and it's a big one. Three places at the very edges of every map we own: the Standing Stones on the Windreach plateau, the Overgrown Temple deep in the jungle, and the summit of the Red Spire. Bring back proof you stood in all three.",
    steps: [
      { type: "visit", zone: "highlands", lm: "stones", text: "Visit the Standing Stones in the Windreach Highlands." },
      { type: "visit", zone: "verdant", lm: "temple", text: "Reach the Overgrown Temple in the Verdant Jungle." },
      { type: "visit", zone: "spire_top", lm: "summit", text: "Climb to the Red Spire Summit." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] }
};
Object.assign(ITEMS, {
});
ACHIEVEMENTS.push({ id: "expeditions", icon: "🗺️", name: "Far Traveller", desc: "Complete every Guild expedition.", test: s => s.expDone && Object.keys(EXPEDITIONS).every(k => s.expDone[k]) });
ACHIEVEMENTS.push({ id: "atlas", icon: "🧭", name: "Cartographer", desc: "Set foot in every area on the world atlas.", test: s => ["highlands", "outpost", "hollow", "den", "crypt", "depths", "marsh", "verdant", "underdeep", "harbor", "gullisle", "frost", "ironvale", "sunscar", "cinder", "spire"].every(z => areaVisited(s, z)) });
Object.assign(NPCS, {
  luna: { name: "Luna, Moonlit Peddler", model: "luna", talk: "talkLuna", only: "night" },
  mirage_shimmer: { name: "Shimmering Air", prop: "mirage", talk: "talkMirage", only: "sandstorm", poi: "mirage" },
  cache_mirage: { name: "Mirage Cache", prop: "chest", chest: "vault", talk: "talkChest" }
});
ZONES.sunscar.npcs.push({ id: "mirage_shimmer", x: 400, y: 1460 });
SHOPS.luna = ["moon_tonic", "shield_earring", "ether", "hi_potion"];
BESTIARY.gloamhorn = { type: "Beast", lore: "A longneck with a coat like dusk. It only grazes after the sun goes down." };
BESTIARY.sandglass_wisp = { type: "Elemental", lore: "A spark of sand and heat that lives inside the mirage. When the storm passes, so does it." };
ACHIEVEMENTS.push({ id: "mirage", icon: "🏜️", name: "Seen Through", desc: "Step into the Mirage during a sandstorm.", test: s => areaVisited(s, "mirage") });

const MOB_PET_JOBS = { SMN: "Spirit", BST: "Familiar", PUP: "Puppet", GEO: "Luopan" };
const ZONE_ELEMENT = { snow: "ice", marsh: "water", beach: "water", desert: "fire", volcanic: "fire", jungle: "earth", highland: "wind", crypt: "dark", cave: "earth", town: "light", house: "light", field: "earth" };
const MOB_PET_EL = { fire: ["Fire", "ember", "water"], ice: ["Ice", "frost", "fire"], wind: ["Wind", "gale", "ice"], earth: ["Earth", "stone", "wind"], lightning: ["Thunder", "thunder", "earth"], water: ["Water", "water", "lightning"], light: ["Light", "light", "dark"], dark: ["Dark", "dark", "light"] };
const MOB_ROLLS = { phantom_roll: ["valor_roll", [4, 6, 8, 10, 16, 7]], hawk_roll: ["hawk_roll", [6, 8, 10, 16, 9, 11]] };
for (const el in MOB_PET_EL) {
  const [nm, pk, opp] = MOB_PET_EL[el], P = PETS[pk];
  FAMILIES["pet_" + el] = { name: nm + " Spirit", color: "#" + P.col.toString(16).padStart(6, "0"), radius: 11, hpMul: 0.55, attMul: 0.75, defMul: 0.8, eva: 6, delay: 3.0, speed: 120, aggro: null, link: false, tpMove: { name: P.pact, mul: 1.6, el }, weak: { [opp]: 1.3 }, loot: [], model: "wisp", tint: P.col, tint2: P.eye, summoned: true, mobPet: true };
}
const TOWN_OBJ_KEYS = ["npcs", "props", "ambient", "water", "fountains", "gardens", "stalls", "spawns", "plazas", "dressing"];
const TOWN_PT_KEYS = ["lamps", "benches", "dummies", "racks", "torches", "lighthouses", "slipways", "mines", "boats"];
const TOWN_COPY_KEYS = ["theme", "safe", "paved", "city", "cityStyle", "palette", "mist", "cs", "music"];
function splitTown(src) {
  const Z = ZONES[src], W = Z.w, H = Z.h;
  const P = Z.districts.map(d => ({ d, x0: d.x <= 30 ? 0 : d.x, y0: d.y <= 30 ? 0 : d.y, x1: d.x + d.w >= W - 30 ? W : d.x + d.w, y1: d.y + d.h >= H - 30 ? H : d.y + d.h }));
  const inP = (p, x, y) => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1;
  const partAt = (x, y) => P.find(p => inP(p, x, y)) || P.reduce((a, p) => { const d = Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.y0 - y, 0, y - p.y1)); return !a || d < a.d ? { p, d } : a; }, null).p;
  const crystal = Z.npcs.find(n => NPCS[n.id] && NPCS[n.id].crystal), keep = crystal ? partAt(crystal.x, crystal.y) : P[0];
  for (const p of P) p.id = p === keep ? src : src + "_" + p.d.id;
  const sideOn = s => typeof Z.outerWall === "string" ? Z.outerWall.includes(s) : !!Z.outerWall;
  const out = {};
  for (const p of P) {
    const ox = p.x0, oy = p.y0, mine = (x, y) => partAt(x, y) === p, mv = o => Object.assign({}, o, { x: o.x - ox, y: o.y - oy }), pt = q => [q[0] - ox, q[1] - oy].concat(q.slice(2));
    const nz = { name: Z.city + " " + p.d.name.replace(/^The /, ""), w: p.x1 - p.x0, h: p.y1 - p.y0, area: src, id: p.id, splitFrom: src, town: src, off: [ox, oy], band: null };
    for (const k of TOWN_COPY_KEYS) if (Z[k] != null) nz[k] = Z[k];
    nz.outerWall = [["n", p.y0 === 0], ["e", p.x1 === W], ["s", p.y1 === H], ["w", p.x0 === 0]].filter(([s, edge]) => !edge || sideOn(s)).map(q => q[0]).join("");
    nz.districts = [Object.assign({}, p.d, { x: 0, y: 0, w: nz.w, h: nz.h })];
    const hk = [];
    nz.houses = (Z.houses || []).map((h, i) => [h, i]).filter(([h]) => mine(h.x, h.y)).map(([h, i]) => { hk.push(i); return mv(h); });
    for (const k of TOWN_OBJ_KEYS) if (Z[k]) nz[k] = Z[k].filter(o => mine(o.x, o.y)).map(o => { const c = mv(o); if (o.path) c.path = o.path.map(pt); return c; });
    for (const n of nz.npcs) if (n.home != null) { const ni = hk.indexOf(n.home); if (ni < 0) { delete n.home; delete n.sleep; } else n.home = ni; }
    for (const k of TOWN_PT_KEYS) if (Z[k]) nz[k] = Z[k].filter(q => mine(q[0], q[1])).map(pt);
    if (Z.docks) nz.docks = Z.docks.filter(q => mine(q[0] + q[2] / 2, q[1] + q[3] / 2)).map(pt);
    nz.walls = (Z.walls || []).filter(w => mine(w.x + w.w / 2, w.y + w.h / 2)).map(mv);
    for (const k of ["plaza", "stable"]) if (Z[k] && mine(Z[k].x, Z[k].y)) nz[k] = mv(Z[k]);
    const R = { x: p.x0, y: p.y0, w: nz.w, h: nz.h };
    nz.paths = (Z.paths || []).filter(pa => pa.pts.some((q, i) => i > 0 && segRect(pa.pts[i - 1][0], pa.pts[i - 1][1], q[0], q[1], R, pa.w / 2))).map(pa => Object.assign({}, pa, { pts: pa.pts.map(pt) }));
    nz.exits = (Z.exits || []).filter(e => mine(e.x + e.w / 2, e.y + e.h / 2)).map(e => { const n = mv(e); n.x = Math.max(0, Math.min(nz.w - n.w, n.x)); n.y = Math.max(0, Math.min(nz.h - n.h, n.y)); return n; });
    const ws = nz.npcs.find(n => NPCS[n.id] && NPCS[n.id].warpstone);
    nz.start = inP(p, Z.start.x, Z.start.y) ? mv(Z.start) : ws ? { x: ws.x, y: ws.y + 70 } : { x: Math.round(nz.w / 2), y: Math.round(nz.h / 2) };
    for (const n of nz.npcs) if (NPCS[n.id] && NPCS[n.id].warpstone) NPCS[n.id].warpZone = p.id;
    out[p.id] = nz;
  }
  const T = 24, IN = 96;
  for (const g of Z.gates || []) {
    const A = g.horiz ? partAt(g.x, g.y - 20) : partAt(g.x - 20, g.y), B = g.horiz ? partAt(g.x, g.y + 20) : partAt(g.x + 20, g.y), a = out[A.id], b = out[B.id];
    if (A === B) continue;
    const lane = GATE_HALF + 20, L = GATE_HALF * 2;
    if (g.horiz) {
      a.exits.push({ x: g.x - A.x0 - GATE_HALF, y: a.h - T, w: L, h: T, to: B.id, tx: g.x - B.x0, ty: IN, label: b.name, gate: true, lane });
      b.exits.push({ x: g.x - B.x0 - GATE_HALF, y: 0, w: L, h: T, to: A.id, tx: g.x - A.x0, ty: a.h - IN, label: a.name, gate: true, lane });
    } else {
      a.exits.push({ x: a.w - T, y: g.y - A.y0 - GATE_HALF, w: T, h: L, to: B.id, tx: IN, ty: g.y - B.y0, label: b.name, gate: true, lane });
      b.exits.push({ x: 0, y: g.y - B.y0 - GATE_HALF, w: T, h: L, to: A.id, tx: a.w - IN, ty: g.y - A.y0, label: a.name, gate: true, lane });
    }
  }
  for (const zid in ZONES) {
    if (zid === src) continue;
    for (const e of ZONES[zid].exits || []) if (e.to === src) { const p = partAt(e.tx, e.ty); e.to = p.id; e.tx -= p.x0; e.ty -= p.y0; }
  }
  for (const id in NPCS) if (NPCS[id].ferryTo === src) { const p = P.find(q => out[q.id].npcs.some(n => NPCS[n.id] && NPCS[n.id].ferryTo && NPCS[n.id].ferryTo !== src)); if (p) NPCS[id].ferryTo = p.id; }
  AREA_NAMES[src] = Z.name;
  ZONE_SPLITS[src] = { w: W, h: H, town: true, parts: P.map(p => ({ id: p.id, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 })) };
  delete ZONES[src];
  for (const id in out) ZONES[id] = out[id];
  return out;
}
const TOWN_LAYOUT = { outpost: 2 };
function settleTownFolk(z) {
  const isFolk = n => { const d = NPCS[n.id]; return d && !d.prop && !d.crystal && !d.warpstone; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), GAP = 70;
  const dOf = (x, y) => districtAt(z, x, y);
  const atStall = n => (z.stalls || []).some(s => Math.hypot(s.x - n.x, s.y - n.y) < 45);
  const settled = z.npcs.filter(n => !isFolk(n) || n.shopFront || atStall(n));
  for (const n of z.npcs.filter(n => isFolk(n) && !n.shopFront && !atStall(n))) {
    if (settled.some(o => dist(o, n) < GAP)) {
      const home = dOf(n.x, n.y);
      let best = null;
      for (let r = 12; r <= 360 && !best; r += 12) for (let k = 0; k < 24; k++) {
        const a = k / 24 * Math.PI * 2, x = Math.round(n.x + Math.cos(a) * r), y = Math.round(n.y + Math.sin(a) * r);
        if (dOf(x, y) === home && clearOfRoads(z, x, y, 16) && !settled.some(o => Math.hypot(o.x - x, o.y - y) < GAP)) { best = { x, y }; break; }
      }
      if (best) { n.x = best.x; n.y = best.y; }
    }
    settled.push(n);
  }
  for (const n of z.npcs) {
    if (!isFolk(n) || n.shopFront) continue;
    const st = (z.stalls || []).find(s => Math.hypot(s.x - n.x, s.y - n.y) < 45) || (z.props || []).find(p => p.type === "desk" && Math.hypot(p.x - n.x, p.y - n.y) < 50);
    if (st) { n.face = Math.atan2(st.y - n.y, st.x - n.x); continue; }
    let bd = 1e9, bx = 0, by = 0;
    for (const p of z.paths || []) {
      if (p.lane) continue;
      for (let i = 0; i < p.pts.length - 1; i++) {
        const a = p.pts[i], b = p.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((n.x - a[0]) * dx + (n.y - a[1]) * dy) / L)), qx = a[0] + dx * t, qy = a[1] + dy * t, dd = Math.hypot(n.x - qx, n.y - qy);
        if (dd < bd) { bd = dd; bx = qx; by = qy; }
      }
    }
    if (bd < 1e9 && bd > 1) n.face = Math.atan2(by - n.y, bx - n.x);
  }
}
for (const t of ["outpost", "harbor", "ironvale"]) settleTownFolk(ZONES[t]);
for (const t of ["outpost", "harbor", "ironvale"]) splitTown(t);
for (const t of ["outpost", "harbor", "ironvale"]) for (const p of ZONE_SPLITS[t].parts) {
  const z = ZONES[p.id];
  z.ghost = { rects: [], paths: [], houses: [] };
  for (const q of ZONE_SPLITS[t].parts) {
    if (q === p) continue;
    const ox = q.x0 - p.x0, oy = q.y0 - p.y0, R = { x: ox, y: oy, w: q.x1 - q.x0, h: q.y1 - q.y0 };
    if (!rectsHit(R, { x: 0, y: 0, w: z.w, h: z.h }, 900)) continue;
    z.ghost.rects.push(R);
    const Q = ZONES[q.id];
    for (const pa of Q.paths || []) if (!pa.lane) z.ghost.paths.push({ w: pa.w, pts: pa.pts.map(c => [c[0] + ox, c[1] + oy]) });
    for (const h of Q.houses || []) { const x = h.x + ox, y = h.y + oy; if (x > -900 && y > -900 && x < z.w + 900 && y < z.h + 900) z.ghost.houses.push({ x, y, w: h.w, h: h.h, type: h.type, floors: h.floors, rot: h.rot || 0, tint: h.tint }); }
  }
  z.exits.forEach((e, i) => {
    if (!e.gate) return;
    const sd = exitSide(z, e), id = "gsign_" + p.id + "_" + i, horiz = sd === "e" || sd === "w", inX = sd === "w" ? 1 : sd === "e" ? -1 : 0, inY = sd === "n" ? 1 : sd === "s" ? -1 : 0;
    const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
    NPCS[id] = { name: "To " + ZONES[e.to].name, prop: "sign", talk: "talkSign", signTo: e.to };
    let at = null;
    for (const lat of [e.lane + 40, e.lane + 80, e.lane + 130]) for (const sd of [1, -1]) for (const dep of [70, 110, 160]) {
      if (at) break;
      const x = Math.round(cx + inX * dep + (horiz ? 0 : sd * lat)), y = Math.round(cy + inY * dep + (horiz ? sd * lat : 0));
      if (clearOfRoads(z, x, y, 10) && !z.npcs.some(n => Math.hypot(n.x - x, n.y - y) < 60)) at = { x, y };
    }
    at = at || { x: Math.round(cx + inX * 70 + (horiz ? 0 : e.lane + 40)), y: Math.round(cy + inY * 70 + (horiz ? e.lane + 40 : 0)) };
    z.npcs.push({ id, x: at.x, y: at.y });
  });
}
for (const zid in ZONES) for (const n of ZONES[zid].npcs || []) {
  if (!n.id.startsWith("sign_") || !NPCS[n.id]) continue;
  const z = ZONES[zid], e = (z.exits || []).filter(x => x.kind !== "door" && !x.gate && ZONES[x.to]).sort((a, b) => Math.hypot(a.x + a.w / 2 - n.x, a.y + a.h / 2 - n.y) - Math.hypot(b.x + b.w / 2 - n.x, b.y + b.h / 2 - n.y))[0];
  if (e) { NPCS[n.id].signTo = e.to; NPCS[n.id].name = "To " + ZONES[e.to].name; }
}
