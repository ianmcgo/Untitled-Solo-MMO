const CONFIG = {
  terrainDetailLow: true,
  hallField: 380,
  hallTown: 180,
  spawnGapCells: 3,
  spawnExitCells: 2,
  mobRegen: 0.04,
  mercDaily: 5,
  mercPermadeath: true,
  scrollDrop: 0.05,
  levelCap: 20,
  bowRange: 230,
  foodMinutes: 30, warpCost: 50, roadBonus: 1.15,
  poolTime: 45, partyMax: 6, partyRange: 900, partyShare: [1, 1, 0.6, 0.45, 0.37, 0.32, 0.28], tradeRange: 250, tradeSlots: 8,
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
  supportUnlockLevel: 5,
  synthTime: 3,
  craftCap: 20,
  tile: 40,
  saveKey: "ashenreach_save_v2",
  settingsKey: "ashenreach_settings_v1",
  startGil: 100,
  mountSpeed: 2.2,
  runSpeed: 100,
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
const ADVANCED_JOBS = { PLD: { quest: "pld", lv: 6 }, RDM: { quest: "rdm", lv: 6 }, THF: { quest: "thf", lv: 6 }, MNK: { quest: "mnk", lv: 6 }, RNG: { quest: "rng", lv: 6 }, SMN: { quest: "smn", lv: 6 }, DRK: { quest: "drk", lv: 10 }, BRD: { quest: "brd", lv: 10 } };

const JOBS = {
  WAR: { name: "Warrior", color: "#e57373", icon: "⚔️", hp: [70, 14], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [9, 0.8], agi: [7, 0.7], int: [6, 0.5], mnd: [6, 0.5] },
  WHM: { name: "White Mage", color: "#eeeeee", icon: "✚", hp: [52, 10], mp: [22, 7], str: [7, 0.6], dex: [7, 0.6], vit: [7, 0.7], agi: [7, 0.6], int: [7, 0.7], mnd: [10, 1.0] },
  BLM: { name: "Black Mage", color: "#9575cd", icon: "✦", hp: [46, 9], mp: [26, 8], str: [6, 0.5], dex: [7, 0.6], vit: [6, 0.5], agi: [7, 0.7], int: [10, 1.0], mnd: [7, 0.6] },
  PLD: { name: "Paladin", color: "#90caf9", icon: "🛡️", hp: [68, 13], mp: [12, 4], str: [8, 0.8], dex: [7, 0.7], vit: [10, 1.0], agi: [6, 0.6], int: [5, 0.4], mnd: [8, 0.8], advanced: true },
  RDM: { name: "Red Mage", color: "#f48fb1", icon: "🎩", hp: [56, 11], mp: [20, 6], str: [7, 0.7], dex: [8, 0.8], vit: [7, 0.6], agi: [7, 0.7], int: [8, 0.8], mnd: [8, 0.8], advanced: true },
  THF: { name: "Thief", color: "#a1887f", icon: "🗝️", hp: [58, 11], mp: [0, 0], str: [7, 0.7], dex: [10, 1.0], vit: [7, 0.6], agi: [10, 1.0], int: [6, 0.6], mnd: [6, 0.5], advanced: true },
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

const SPELLS = {
  raise: { name: "Raise", jobs: { WHM: 12, RDM: 17, PLD: 18 }, mp: 50, cast: 8.0, recast: 30, kind: "raise", pow: 0.25, target: "dead", desc: "Revives a KO'd party member with a quarter of their HP. Nobody loses experience when raised." },
  raise2: { name: "Raise II", jobs: { WHM: 18 }, mp: 90, cast: 8.0, recast: 45, kind: "raise", pow: 0.5, target: "dead", desc: "Revives a KO'd party member with half of their HP." },
  cure: { name: "Cure", jobs: { WHM: 1, PLD: 5, RDM: 3 }, mp: 8, cast: 2.0, recast: 5, kind: "heal", power: 22, mnd: 1.0, target: "ally", desc: "Restores HP." },
  cure2: { name: "Cure II", jobs: { WHM: 6, PLD: 11, RDM: 14 }, mp: 22, cast: 2.25, recast: 6, kind: "heal", power: 60, mnd: 1.5, target: "ally", desc: "Restores a lot of HP." },
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
  cure3: { name: "Cure III", jobs: { WHM: 13 }, mp: 42, cast: 2.5, recast: 7, kind: "heal", power: 120, mnd: 2.0, target: "ally", desc: "Restores a great deal of HP." },
  banish2: { name: "Banish II", jobs: { WHM: 15 }, mp: 36, cast: 2.0, recast: 14, kind: "nuke", element: "light", power: 62, stat: "mnd", target: "enemy", desc: "Heavy light damage. Strong against undead." },
  stone2: { name: "Stone II", jobs: { BLM: 11, RDM: 15 }, mp: 22, cast: 2.0, recast: 7, kind: "nuke", element: "earth", power: 46, stat: "int", target: "enemy", desc: "Heavy earth damage." },
  water2: { name: "Water II", jobs: { BLM: 12 }, mp: 25, cast: 2.25, recast: 7, kind: "nuke", element: "water", power: 52, stat: "int", target: "enemy", desc: "Heavy water damage." },
  aero2: { name: "Aero II", jobs: { BLM: 13 }, mp: 28, cast: 2.25, recast: 8, kind: "nuke", element: "wind", power: 58, stat: "int", target: "enemy", desc: "Heavy wind damage." },
  fire2: { name: "Fire II", jobs: { BLM: 14 }, mp: 32, cast: 2.5, recast: 8, kind: "nuke", element: "fire", power: 65, stat: "int", target: "enemy", desc: "Heavy fire damage." },
  blizzard2: { name: "Blizzard II", jobs: { BLM: 15 }, mp: 36, cast: 2.75, recast: 9, kind: "nuke", element: "ice", power: 73, stat: "int", target: "enemy", desc: "Heavy ice damage." },
  ember_sprite: { name: "Ember Sprite", jobs: { SMN: 1 }, mp: 12, cast: 3.0, recast: 10, kind: "summon", element: "fire", pet: "ember", target: "self", desc: "Calls a fire sprite to fight beside you. It slowly drains your MP." },
  frost_sprite: { name: "Frost Sprite", jobs: { SMN: 5 }, mp: 14, cast: 3.0, recast: 10, kind: "summon", element: "ice", pet: "frost", target: "self", desc: "Calls an ice sprite to fight beside you. It slowly drains your MP." },
  gale_sprite: { name: "Gale Sprite", jobs: { SMN: 10 }, mp: 16, cast: 3.0, recast: 10, kind: "summon", element: "wind", pet: "gale", target: "self", desc: "Calls a wind sprite to fight beside you. It slowly drains your MP." },
  cure4: { name: "Cure IV", jobs: { WHM: 19 }, mp: 70, cast: 2.75, recast: 8, kind: "heal", power: 200, mnd: 2.5, target: "ally", desc: "Restores a huge amount of HP." },
  thunder2: { name: "Thunder II", jobs: { BLM: 17 }, mp: 40, cast: 3.0, recast: 10, kind: "nuke", element: "lightning", power: 82, stat: "int", target: "enemy", desc: "Heavy lightning damage." },
  fire3: { name: "Fire III", jobs: { BLM: 20 }, mp: 62, cast: 3.5, recast: 14, kind: "nuke", element: "fire", power: 120, stat: "int", target: "enemy", desc: "Massive fire damage." },
  stone_sprite: { name: "Stone Sprite", jobs: { SMN: 15 }, mp: 18, cast: 3.0, recast: 10, kind: "summon", element: "earth", pet: "stone", target: "self", desc: "Calls a sturdy earth sprite. It slowly drains your MP." },
  blight: { name: "Blight", jobs: { DRK: 3 }, mp: 8, cast: 1.5, recast: 8, kind: "dot", element: "dark", buff: "blight", power: 6, target: "enemy", skill: "dark", desc: "Dark damage over time and lowers the target's attack." },
  drain: { name: "Drain", jobs: { DRK: 5 }, mp: 12, cast: 2.5, recast: 20, kind: "drain", element: "dark", power: 16, target: "enemy", skill: "dark", desc: "Steals HP from the target." },
  mind_drain: { name: "Mind Drain", jobs: { DRK: 12 }, mp: 4, cast: 2.5, recast: 30, kind: "aspir", element: "dark", power: 10, target: "enemy", skill: "dark", desc: "Steals MP from the target." },
  stun: { name: "Stun", jobs: { DRK: 17 }, mp: 10, cast: 0.5, recast: 30, kind: "debuff", element: "dark", buff: "stun", dur: 4, enmity: 150, target: "enemy", skill: "dark", desc: "Stuns the target for 4 s and stops a readied move." },
  battle_minuet: { name: "Battle Minuet", jobs: { BRD: 1 }, mp: 6, cast: 2.0, recast: 8, kind: "song", song: "minuet", pow: 0.12, dur: 120, target: "self", skill: "singing", desc: "Party song: attack +12% for 2 minutes." },
  mending_paeon: { name: "Mending Paeon", jobs: { BRD: 3 }, mp: 6, cast: 2.0, recast: 8, kind: "song", song: "paeon", pow: 1, dur: 120, target: "self", skill: "singing", desc: "Party song: restores a little HP every 3 s." },
  drowsy_lullaby: { name: "Drowsy Lullaby", jobs: { BRD: 5 }, mp: 8, cast: 2.0, recast: 20, kind: "debuff", element: "light", buff: "sleep", dur: 30, enmity: 60, target: "enemy", skill: "singing", desc: "Puts the target to sleep for up to 30 s. Any damage wakes it. Bosses are immune." },
  wellspring_ballad: { name: "Wellspring Ballad", jobs: { BRD: 7 }, mp: 4, cast: 2.0, recast: 8, kind: "song", song: "ballad", pow: 1, dur: 120, target: "self", skill: "singing", desc: "Party song: restores a little MP every 3 s." },
  keen_madrigal: { name: "Keen Madrigal", jobs: { BRD: 9 }, mp: 8, cast: 2.0, recast: 8, kind: "song", song: "madrigal", pow: 15, dur: 120, target: "self", skill: "singing", desc: "Party song: accuracy +15 for 2 minutes." },
  swift_march: { name: "Swift March", jobs: { BRD: 11 }, mp: 10, cast: 2.0, recast: 8, kind: "song", song: "march", pow: 0.12, dur: 120, target: "self", skill: "singing", desc: "Party song: attack speed +12% for 2 minutes." },
  mending_paeon2: { name: "Mending Paeon II", jobs: { BRD: 13 }, mp: 10, cast: 2.0, recast: 8, kind: "song", song: "paeon", pow: 2, dur: 120, target: "self", skill: "singing", desc: "Party song: restores more HP every 3 s." },
  battle_minuet2: { name: "Battle Minuet II", jobs: { BRD: 17 }, mp: 12, cast: 2.0, recast: 8, kind: "song", song: "minuet", pow: 0.2, dur: 120, target: "self", skill: "singing", desc: "Party song: attack +20% for 2 minutes." },
  protect: { name: "Protect", jobs: { WHM: 7, PLD: 9, RDM: 9 }, mp: 9, cast: 2.0, recast: 10, kind: "buff", buff: "protect", dur: 600, target: "ally", desc: "Defense +15% for 10 minutes." }
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
  potion: { name: "Potion", kind: "use", icon: "🧪", heal: 60, price: 40, stack: 12, desc: "Restores 60 HP." },
  potion_hq: { name: "Potion +1", kind: "use", icon: "🧪", hq: true, heal: 85, price: 60, stack: 12, desc: "Restores 85 HP." },
  hi_potion: { name: "Hi-Potion", kind: "use", icon: "⚗️", heal: 150, price: 160, stack: 12, desc: "Restores 150 HP." },
  ether: { name: "Ether", kind: "use", icon: "💧", mpRestore: 40, price: 100, stack: 12, desc: "Restores 40 MP." },
  ember_plume: { name: "Ember Plume", kind: "use", icon: "🪶", revive: 0.2, price: 1200, stack: 12, desc: "A warm red feather that rekindles the fallen. Target a KO'd party member and use it to revive them with a fifth of their HP." },
  ether_hq: { name: "Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 55, price: 140, stack: 12, desc: "Restores 55 MP." },
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
  bronze_sword: { name: "Bronze Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 6, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 1, price: 80 },
  bronze_sword_hq: { name: "Bronze Sword +1", kind: "equip", icon: "🗡️", hq: true, slot: "main", wtype: "sword", dmg: 7, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 1, price: 200, stats: { acc: 2 } },
  shortbow: { name: "Shortbow", kind: "equip", icon: "🏹", slot: "main", wtype: "archery", dmg: 6, delay: 3.0, jobs: ["RNG", "WAR", "THF"], lv: 1, price: 90 },
  yew_bow: { name: "Yew Bow", kind: "equip", icon: "🏹", slot: "main", wtype: "archery", dmg: 10, delay: 3.0, jobs: ["RNG", "WAR", "THF"], lv: 6, price: 950, stats: { agi: 1 } },
  steel_longbow: { name: "Steel Longbow", kind: "equip", icon: "🏹", slot: "main", wtype: "archery", dmg: 15, delay: 3.1, jobs: ["RNG", "WAR", "THF"], lv: 11, price: 2700, stats: { agi: 2, acc: 3 } },
  hunters_coat: { name: "Hunter's Coat", kind: "equip", icon: "🧥", slot: "body", jobs: ["RNG", "THF"], lv: 5, price: 1000, stats: { def: 6, agi: 2, acc: 3 } },
  bronze_scythe: { name: "Bronze Scythe", kind: "equip", icon: "🌙", slot: "main", wtype: "scythe", dmg: 11, delay: 4.4, jobs: ["DRK"], lv: 1, price: 140 },
  iron_scythe: { name: "Iron Scythe", kind: "equip", icon: "🌙", slot: "main", wtype: "scythe", dmg: 17, delay: 4.4, jobs: ["DRK"], lv: 6, price: 1200, stats: { str: 1 } },
  steel_scythe: { name: "Steel Scythe", kind: "equip", icon: "🌙", slot: "main", wtype: "scythe", dmg: 25, delay: 4.5, jobs: ["DRK"], lv: 11, price: 3200, stats: { str: 2, acc: 2 } },
  rime_scythe: { name: "Rimefrost Scythe", kind: "equip", icon: "🌙", slot: "main", wtype: "scythe", dmg: 36, delay: 4.5, jobs: ["DRK"], lv: 17, price: 10400, stats: { str: 4, acc: 4 } },
  shadow_plate: { name: "Shadow Plate", kind: "equip", icon: "🛡️", slot: "body", jobs: ["DRK", "WAR"], lv: 5, price: 1100, stats: { def: 8, str: 2, int: 1 } },
  minstrel_coat: { name: "Minstrel's Coat", kind: "equip", icon: "🧥", slot: "body", jobs: ["BRD", "RDM"], lv: 5, price: 1000, stats: { def: 5, mp: 15, mnd: 1, agi: 1 } },
  troubadour_coat: { name: "Troubadour's Coat", kind: "equip", icon: "🧥", slot: "body", jobs: ["BRD"], lv: 14, price: 6200, stats: { def: 12, mp: 35, mnd: 3, agi: 2, hp: 15 } },
  sprite_staff: { name: "Sprite Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 8, delay: 3.6, jobs: ["SMN", "WHM", "BLM"], lv: 1, price: 120, stats: { mp: 10, mnd: 1 } },
  evoker_robe: { name: "Evoker's Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["SMN"], lv: 5, price: 1000, stats: { def: 5, mp: 25, mnd: 2, int: 1 } },
  bronze_dagger: { name: "Bronze Dagger", kind: "equip", icon: "🔪", slot: "main", wtype: "dagger", dmg: 4, delay: 1.9, jobs: ["WAR", "RDM", "THF", "BLM"], lv: 1, price: 70 },
  iron_dagger: { name: "Iron Dagger", kind: "equip", icon: "🔪", slot: "main", wtype: "dagger", dmg: 7, delay: 1.9, jobs: ["WAR", "RDM", "THF", "BLM"], lv: 6, price: 820, stats: { dex: 1 } },
  steel_dagger: { name: "Steel Dagger", kind: "equip", icon: "🔪", slot: "main", wtype: "dagger", dmg: 10, delay: 1.9, jobs: ["WAR", "RDM", "THF", "BLM"], lv: 11, price: 2300, stats: { dex: 2, acc: 2 } },
  leather_cesti: { name: "Leather Cesti", kind: "equip", icon: "🥊", slot: "main", wtype: "h2h", dmg: 4, delay: 2.6, jobs: ["MNK", "WAR"], lv: 1, price: 80 },
  iron_knuckles: { name: "Iron Knuckles", kind: "equip", icon: "🥊", slot: "main", wtype: "h2h", dmg: 7, delay: 2.6, jobs: ["MNK", "WAR"], lv: 6, price: 850, stats: { str: 1 } },
  steel_claws: { name: "Steel Claws", kind: "equip", icon: "🥊", slot: "main", wtype: "h2h", dmg: 11, delay: 2.6, jobs: ["MNK", "WAR"], lv: 11, price: 2400, stats: { str: 2, att: 3 } },
  brigand_vest: { name: "Brigand Vest", kind: "equip", icon: "🦺", slot: "body", jobs: ["THF", "RDM"], lv: 5, price: 1000, stats: { def: 6, dex: 2, agi: 2 } },
  training_gi: { name: "Training Gi", kind: "equip", icon: "🥋", slot: "body", jobs: ["MNK"], lv: 5, price: 1000, stats: { def: 6, str: 2, vit: 2, hp: 10 } },
  steel_sword: { name: "Steel Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 14, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 11, price: 2600, stats: { acc: 2 } },
  steel_greataxe: { name: "Steel Greataxe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 25, delay: 4.0, jobs: ["WAR"], lv: 11, price: 2800 },
  oak_staff: { name: "Oak Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 15, delay: 3.6, jobs: ALL_J, lv: 11, price: 2400, stats: { int: 4, mnd: 4, mp: 15 } },
  oak_club: { name: "Oak Club", kind: "equip", icon: "🏏", slot: "main", wtype: "club", dmg: 12, delay: 2.9, jobs: ["WAR", "WHM", "PLD", "BLM", "RDM"], lv: 11, price: 2200, stats: { mnd: 2 } },
  chain_mail: { name: "Chain Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR", "PLD"], lv: 11, price: 3000, stats: { def: 15, hp: 30 } },
  wizards_robe: { name: "Wizard's Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 11, price: 2800, stats: { def: 9, mp: 35, int: 3, mnd: 3 } },
  iron_helm: { name: "Iron Helm", kind: "equip", icon: "⛑️", slot: "head", jobs: ["WAR", "PLD"], lv: 12, price: 1800, stats: { def: 6, hp: 12 } },
  wool_hat: { name: "Wool Hat", kind: "equip", icon: "🎩", slot: "head", jobs: ALL_J, lv: 10, price: 900, stats: { def: 3, mp: 10 } },
  marsh_boots: { name: "Marsh Boots", kind: "equip", icon: "🥾", slot: "feet", jobs: ALL_J, lv: 10, rare: true, stats: { def: 4, agi: 3, eva: 4 }, desc: "Waterproofed with toad oil. A reward from Captain Rhea." },
  croaker_charm: { name: "Croaker Charm", kind: "equip", icon: "🐸", slot: "neck", jobs: ALL_J, lv: 12, rare: true, nm: true, stats: { hp: 30, vit: 3, def: 3 }, desc: "Carved from the Old Croaker's throat stone." },
  gax_cleaver: { name: "Gax's Cleaver", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 29, delay: 4.0, jobs: ["WAR"], lv: 14, rare: true, nm: true, stats: { str: 4, att: 8 }, desc: "The Mirelord's notched axe." },
  mire_mantle: { name: "Mire Mantle", kind: "equip", icon: "🧥", slot: "body", jobs: ALL_J, lv: 14, rare: true, nm: true, stats: { def: 12, hp: 20, mp: 20, eva: 5 }, desc: "A hooded mantle that drips no matter how long it hangs to dry." },
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
  tidesteel_sword: { name: "Tidesteel Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 17, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 14, price: 5200, stats: { acc: 3, str: 1 } },
  boarding_axe: { name: "Boarding Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 30, delay: 4.0, jobs: ["WAR"], lv: 14, price: 5600, stats: { str: 2 } },
  coral_staff: { name: "Coral Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 18, delay: 3.6, jobs: ALL_J, lv: 14, price: 5000, stats: { int: 6, mnd: 6, mp: 25 } },
  tidesteel_dagger: { name: "Tidesteel Dagger", kind: "equip", icon: "🔪", slot: "main", wtype: "dagger", dmg: 12, delay: 1.9, jobs: ["WAR", "RDM", "THF", "BLM"], lv: 14, price: 4800, stats: { dex: 3, acc: 3 } },
  shark_claws: { name: "Shark Claws", kind: "equip", icon: "🥊", slot: "main", wtype: "h2h", dmg: 13, delay: 2.6, jobs: ["MNK", "WAR"], lv: 14, price: 4900, stats: { str: 3, att: 5 } },
  harbor_mail: { name: "Harbor Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR", "PLD"], lv: 13, price: 5400, stats: { def: 19, hp: 40, vit: 2 } },
  sailcloth_robe: { name: "Sailcloth Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 13, price: 5000, stats: { def: 11, mp: 45, int: 4, mnd: 4 } },
  corsair_jerkin: { name: "Corsair Jerkin", kind: "equip", icon: "🦺", slot: "body", jobs: ["THF", "MNK", "RDM"], lv: 13, price: 5000, stats: { def: 13, dex: 3, agi: 3, hp: 20 } },
  gull_hat: { name: "Gull Feather Hat", kind: "equip", icon: "👒", slot: "head", jobs: ALL_J, lv: 13, price: 2600, stats: { def: 5, agi: 2, mp: 10 } },
  tide_ring: { name: "Tide Ring", kind: "equip", icon: "💍", slot: "ring", jobs: ALL_J, lv: 12, rare: true, stats: { hp: 20, mp: 20, mnd: 2 }, desc: "A gift from the harbor master." },
  ashen_shard: { name: "Ashen Shard", kind: "key", icon: "🕯️", desc: "A sliver of black stone, warm to the touch. Faint letters crawl across it." },
  cinder_mantle: { name: "Cinderweave Mantle", kind: "equip", icon: "🧥", rare: true, nm: true, rarity: "epic", slot: "body", jobs: ALL_J, lv: 19, stats: { def: 24, hp: 40, mp: 40, str: 3, int: 3 }, desc: "Woven from ash that never settles. Faintly warm." },
  ember_ring: { name: "Ember of Ashenreach", kind: "equip", icon: "💍", ex: true, rarity: "epic", slot: "ring", jobs: ALL_J, lv: 19, price: 0, stats: { hp: 50, mp: 50, str: 5, int: 5, mnd: 5, att: 8, acc: 8 }, desc: "A ring set with a coal that never cools. Given to the one who kept the embers." },
  egg_meadow_kit: { name: "Meadow Kit (pet)", kind: "pet", pet: "meadow_kit", icon: "🐇", rare: true, price: 0, desc: "A tiny hare that followed you home. Use it to make it your pet." },
  egg_batling: { name: "Batling (pet)", kind: "pet", pet: "batling", icon: "🦇", rare: true, price: 0, desc: "A bat pup clinging to your sleeve. Use it to make it your pet." },
  egg_wormlet: { name: "Wormlet (pet)", kind: "pet", pet: "wormlet", icon: "🪱", rare: true, price: 0, desc: "A stubby worm curled in a pot. Use it to make it your pet." },
  egg_snow_kit: { name: "Snow Kit (pet)", kind: "pet", pet: "snow_kit", icon: "🐇", rare: true, price: 0, desc: "A shivering white kit. Use it to make it your pet." },
  egg_tide_wisp: { name: "Tide Wisp (pet)", kind: "pet", pet: "tide_wisp", icon: "💧", rare: true, price: 0, desc: "A bubble of seafoam in a jar. Use it to make it your pet." },
  egg_shade_kit: { name: "Shade Kit (pet)", kind: "pet", pet: "shade_kit", icon: "🐈", rare: true, price: 0, desc: "A black kit curled in a basket. Use it to make it your pet." },
  egg_mini_gob: { name: "Pocket Goblin (pet)", kind: "pet", pet: "mini_gob", icon: "👺", rare: true, price: 0, desc: "A goblin runt in a sack, surprisingly cheerful. Use it to make it your pet." },
  egg_ember_wisp: { name: "Ember Wisp (pet)", kind: "pet", pet: "ember_wisp", icon: "🔥", rare: true, price: 0, desc: "A mote of flame in a lantern. Use it to make it your pet." },
  egg_frost_wisp: { name: "Frost Wisp (pet)", kind: "pet", pet: "frost_wisp", icon: "❄️", rare: true, price: 0, desc: "A shard of cold light in a jar. Use it to make it your pet." },
  guild_ring: { name: "Guild Ring", kind: "equip", icon: "💍", ex: true, slot: "ring", jobs: ALL_J, lv: 5, price: 0, stats: { hp: 15, mp: 10, acc: 3, att: 3 }, desc: "Bronze-rank token of the Adventurers' Guild." },
  pathfinder_boots: { name: "Pathfinder Boots", kind: "equip", icon: "👢", ex: true, slot: "feet", jobs: ALL_J, lv: 10, price: 0, stats: { def: 7, agi: 3, eva: 4, hp: 10 }, desc: "Iron-rank boots. Made for long roads." },
  silver_insignia: { name: "Silver Insignia", kind: "equip", icon: "💍", ex: true, rarity: "rare", slot: "ring", jobs: ALL_J, lv: 14, price: 0, stats: { hp: 25, mp: 20, str: 2, int: 2, mnd: 2 }, desc: "Silver-rank insignia of the Adventurers' Guild." },
  guild_greatcoat: { name: "Guild Greatcoat", kind: "equip", icon: "🧥", ex: true, rarity: "rare", slot: "body", jobs: ALL_J, lv: 18, price: 0, stats: { def: 22, hp: 45, mp: 30, vit: 2, mnd: 2 }, desc: "Gold-rank coat with the guild's crossed swords on the back." },
  mythril_crest: { name: "Mythril Crest", kind: "equip", icon: "💍", ex: true, rarity: "epic", slot: "ring", jobs: ALL_J, lv: 20, price: 0, stats: { hp: 40, mp: 40, str: 4, int: 4, acc: 6, att: 6 }, desc: "Worn only by Mythril-rank adventurers." },
  chapel_sigil: { name: "Chapel Sigil", kind: "mat", icon: "🔱", price: 400, stack: 3, rarity: "rare", desc: "A tarnished sigil that opens the sealed door of the Drowned Chapel. Used up on entry." },
  tide_crown: { name: "Tide Crown", kind: "equip", icon: "👑", slot: "head", jobs: ALL_J, lv: 15, rare: true, nm: true, rarity: "epic", stats: { def: 8, hp: 25, mp: 25, int: 3, mnd: 3 }, desc: "Taken from the Tidebound Priest." },
  abyssal_staff: { name: "Abyssal Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 20, delay: 3.6, jobs: ALL_J, lv: 15, rare: true, nm: true, rarity: "epic", stats: { int: 8, mnd: 6, mp: 30 }, desc: "Still dripping seawater." },
  drowned_blade: { name: "Drowned Blade", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 19, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 15, rare: true, nm: true, rarity: "epic", stats: { acc: 5, str: 3 }, desc: "Its edge never dries." },
  priest_mantle: { name: "Priest's Mantle", kind: "equip", icon: "🧥", slot: "body", jobs: ALL_J, lv: 15, rare: true, nm: true, rarity: "epic", stats: { def: 16, hp: 30, mp: 30, eva: 6 }, desc: "Heavy with the weight of the tide." },
  tidebreaker_bow: { name: "Tidebreaker Bow", kind: "equip", icon: "🏹", slot: "main", wtype: "archery", dmg: 17, delay: 3.0, jobs: ["RNG", "WAR", "THF"], lv: 15, rare: true, nm: true, rarity: "epic", stats: { agi: 3, acc: 5 }, desc: "Strung with kelp that never snaps." },
  frost_shard: { name: "Frost Shard", kind: "mat", icon: "🧊", price: 60, stack: 12, desc: "A shard of ice that never melts." },
  frost_sword: { name: "Frostforged Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 21, delay: 2.4, jobs: ["WAR", "PLD", "RDM"], lv: 17, price: 9800, stats: { acc: 4, str: 2 } },
  frost_greataxe: { name: "Frostforged Greataxe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 36, delay: 4.0, jobs: ["WAR"], lv: 17, price: 10400, stats: { str: 3 } },
  glacier_staff: { name: "Glacier Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 22, delay: 3.6, jobs: ALL_J, lv: 17, price: 9400, stats: { int: 9, mnd: 9, mp: 40 } },
  rime_dagger: { name: "Rime Dagger", kind: "equip", icon: "🔪", slot: "main", wtype: "dagger", dmg: 15, delay: 1.9, jobs: ["WAR", "RDM", "THF", "BLM"], lv: 17, price: 9000, stats: { dex: 4, acc: 4 } },
  frost_claws: { name: "Frost Claws", kind: "equip", icon: "🥊", slot: "main", wtype: "h2h", dmg: 16, delay: 2.6, jobs: ["MNK", "WAR"], lv: 17, price: 9200, stats: { str: 4, att: 6 } },
  frost_bow: { name: "Frostwood Bow", kind: "equip", icon: "🏹", slot: "main", wtype: "archery", dmg: 20, delay: 3.0, jobs: ["RNG", "WAR", "THF"], lv: 17, price: 9600, stats: { agi: 4, acc: 5 } },
  frost_mail: { name: "Frostforged Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR", "PLD"], lv: 17, price: 10200, stats: { def: 24, hp: 55, vit: 3 } },
  snowfur_coat: { name: "Snowfur Coat", kind: "equip", icon: "🧥", slot: "body", jobs: ["THF", "MNK", "RNG", "RDM"], lv: 17, price: 9600, stats: { def: 17, dex: 4, agi: 4, hp: 30 } },
  frost_robe: { name: "Frostweave Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM", "SMN"], lv: 17, price: 9400, stats: { def: 13, mp: 60, int: 5, mnd: 5 } },
  fur_hat: { name: "Fur Hat", kind: "equip", icon: "🎩", slot: "head", jobs: ALL_J, lv: 16, price: 4200, stats: { def: 7, hp: 15, mp: 15 } },
  rimefang_axe: { name: "Rimefang's Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 39, delay: 4.0, jobs: ["WAR"], lv: 19, rare: true, nm: true, rarity: "epic", stats: { str: 5, att: 10 }, desc: "Frost creeps along the blade." },
  frost_ring: { name: "Frost Ring", kind: "equip", icon: "💍", slot: "ring", jobs: ALL_J, lv: 18, rare: true, nm: true, stats: { hp: 30, mp: 30, int: 3, str: 3 }, desc: "Cold to the touch, always." },
  wight_shroud: { name: "Wight's Shroud", kind: "equip", icon: "🧥", slot: "body", jobs: ALL_J, lv: 19, rare: true, nm: true, rarity: "epic", stats: { def: 20, hp: 45, mp: 45, eva: 8, int: 3, mnd: 3 }, desc: "It weighs nothing at all." },
  toad_oil: { name: "Toad Oil", kind: "mat", icon: "🫙", price: 40, stack: 12, desc: "Slick and smelly. Alchemists use it in salves." },
  orc_tooth: { name: "Orc Tooth", kind: "mat", icon: "🦷", price: 40, stack: 12, desc: "A chipped orc tusk. Carvers pay for them." },
  reef_scale: { name: "Reefkin Scale", kind: "mat", icon: "🐚", price: 48, stack: 12, desc: "An iridescent scale from a Reefkin. Makes fine lacquer." },
  crag_feather: { name: "Crag Feather", kind: "mat", icon: "🪶", price: 44, stack: 12, desc: "A stiff tawny feather. Fletchers love them." },
  heartwood: { name: "Heartwood", kind: "mat", icon: "🪵", price: 160, stack: 6, desc: "Dense wood from an elder treant. Nearly as hard as iron." },
  cactus_needle: { name: "Cactus Needle", kind: "mat", icon: "📍", price: 30, stack: 12, desc: "A long green needle, sharp as a pin." },
  bomb_ash: { name: "Bomb Ash", kind: "mat", icon: "🌋", price: 55, stack: 12, desc: "Still-warm ash from a burst bomb. Volatile." },
  silkweave_mantle: { name: "Silkweave Mantle", kind: "equip", icon: "🧥", rare: true, nm: true, slot: "body", jobs: ALL_J, lv: 5, stats: { def: 6, hp: 18, mp: 18, agi: 2 }, desc: "Woven from the Silkmother's own thread. Light as air." },
  silk_gloves_q: { name: "Crawler Silk Gloves", kind: "equip", icon: "🧤", slot: "hands", jobs: ALL_J, lv: 2, price: 120, stats: { def: 2, dex: 1 } },
  silk_gloves: { name: "Silk Gloves", kind: "equip", icon: "🧤", rare: true, nm: true, slot: "hands", jobs: ALL_J, lv: 4, stats: { def: 3, dex: 2, acc: 3 } },
  warlord_cleaver: { name: "Warlord's Cleaver", kind: "equip", icon: "🪓", rare: true, nm: true, rarity: "epic", slot: "main", wtype: "greataxe", dmg: 33, delay: 4.0, jobs: ["WAR", "DRK"], lv: 15, stats: { str: 4, att: 8 }, desc: "Gorruk's notched cleaver. Still smells of smoke." },
  warlord_band: { name: "Warlord's Band", kind: "equip", icon: "💍", rare: true, nm: true, slot: "ring", jobs: ALL_J, lv: 14, stats: { str: 3, vit: 3, hp: 25 } },
  honeycomb: { name: "Honeycomb", kind: "mat", icon: "🍯", price: 28, stack: 12, desc: "Sweet comb cut from a hive. Cooks and alchemists want it." },
  wool_tuft: { name: "Wool Tuft", kind: "mat", icon: "🧶", price: 22, stack: 12, desc: "Soft sheep's wool. Spins into cloth." },
  lizard_skin: { name: "Lizard Skin", kind: "mat", icon: "🦎", price: 45, stack: 12, desc: "Tough scaled hide. Good for boots and gloves." },
  crab_shell: { name: "Crab Shell", kind: "mat", icon: "🦀", price: 40, stack: 12, desc: "A hard plate of shell. Smiths use it like light armor." },
  crawler_cocoon: { name: "Crawler Cocoon", kind: "mat", icon: "🧵", price: 50, stack: 12, desc: "A bundle of crawler silk. Prized by weavers." },
  mandrake_leaf: { name: "Mandrake Leaf", kind: "mat", icon: "🍃", price: 24, stack: 12, desc: "A fragrant leaf from a mandrake's crown. Soothing when steeped." },
  spore_cap: { name: "Spore Cap", kind: "mat", icon: "🍄", price: 36, stack: 12, desc: "A dried mushroom cap, dusty with spores. Alchemists are careful with it." },
  longneck_hide: { name: "Longneck Hide", kind: "mat", icon: "🟫", price: 90, stack: 6, desc: "A broad, supple hide. Enough for a whole coat." },
  mire_reed: { name: "Mire Reed", kind: "mat", icon: "🌾", price: 25, stack: 12, desc: "Tough marsh reed for weaving." },
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
  kite_shield: { name: "Kite Shield", kind: "equip", icon: "🛡️", slot: "sub", jobs: ["PLD", "WAR"], lv: 3, price: 450, stats: { def: 5, hp: 6 }, shield: true, desc: "Worn on the off hand. Counts as your accessory slot." },
  scarlet_tabard: { name: "Scarlet Tabard", kind: "equip", icon: "👘", slot: "body", jobs: ["RDM"], lv: 5, price: 1050, stats: { def: 6, mp: 10, int: 1, mnd: 1, str: 1 } },
  scale_mail: { name: "Scale Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR", "PLD"], lv: 5, price: 1100, stats: { def: 9, hp: 15 } },
  linen_robe: { name: "Linen Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 1, price: 110, stats: { def: 3, mp: 10 } },
  linen_robe_hq: { name: "Linen Robe +1", kind: "equip", icon: "👘", hq: true, slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 1, price: 260, stats: { def: 4, mp: 15 } },
  cotton_robe: { name: "Cotton Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 5, price: 1000, stats: { def: 6, mp: 18, int: 1, mnd: 1 } },
  leather_gloves: { name: "Leather Gloves", kind: "equip", icon: "🧤", slot: "hands", jobs: ALL_J, lv: 2, price: 90, stats: { def: 2, dex: 1 } },
  leather_trousers: { name: "Leather Trousers", kind: "equip", icon: "👖", slot: "legs", jobs: ALL_J, lv: 2, price: 110, stats: { def: 3 } },
  leather_gorget: { name: "Leather Gorget", kind: "equip", icon: "📿", slot: "neck", jobs: ALL_J, lv: 3, price: 220, stats: { def: 2, hp: 6 } },
  mage_pendant: { name: "Mage's Pendant", kind: "equip", icon: "📿", slot: "neck", jobs: ["WHM", "BLM", "RDM", "SMN", "BRD"], lv: 6, price: 640, stats: { int: 2, mp: 8 } },
  spirit_torque: { name: "Spirit Torque", kind: "equip", icon: "📿", slot: "neck", jobs: ALL_J, lv: 11, price: 1500, stats: { mnd: 2, hp: 10, res_dark: 6 } },
  copper_earring: { name: "Copper Earring", kind: "equip", icon: "🔸", slot: "ear", jobs: ALL_J, lv: 2, price: 150, stats: { str: 1 } },
  beetle_earring: { name: "Beetle Earring", kind: "equip", icon: "🔸", slot: "ear", jobs: ALL_J, lv: 5, price: 380, stats: { def: 2, vit: 1 } },
  silver_earring: { name: "Silver Earring", kind: "equip", icon: "🔹", slot: "ear", jobs: ALL_J, lv: 9, price: 900, stats: { mp: 6, int: 1 } },
  ember_earring: { name: "Ember Earring", kind: "equip", icon: "🔥", slot: "ear", jobs: ALL_J, lv: 13, price: 1400, stats: { att: 3, res_fire: 10 } },
  travelers_cape: { name: "Traveler's Cape", kind: "equip", icon: "🧣", slot: "back", jobs: ALL_J, lv: 1, price: 120, stats: { def: 2, eva: 1 } },
  wolf_mantle: { name: "Wolf Mantle", kind: "equip", icon: "🧣", slot: "back", jobs: ["WAR", "PLD", "THF", "MNK", "RNG", "DRK", "BRD", "RDM"], lv: 9, price: 1100, stats: { att: 4, def: 2, res_ice: 5 } },
  mage_cape: { name: "Mage's Cape", kind: "equip", icon: "🧣", slot: "back", jobs: ["WHM", "BLM", "RDM", "SMN", "BRD"], lv: 7, price: 820, stats: { int: 2, mnd: 2, res_wind: 5 } },
  leather_belt: { name: "Leather Belt", kind: "equip", icon: "🪢", slot: "waist", jobs: ALL_J, lv: 2, price: 140, stats: { hp: 8 } },
  warriors_belt: { name: "Warrior's Belt", kind: "equip", icon: "🪢", slot: "waist", jobs: ["WAR", "PLD", "THF", "MNK", "RNG", "DRK", "BRD", "RDM"], lv: 8, price: 900, stats: { str: 2, att: 2 } },
  silk_sash: { name: "Silk Sash", kind: "equip", icon: "🪢", slot: "waist", jobs: ALL_J, lv: 8, price: 880, stats: { mp: 10, res_water: 5 } },
  buckler: { name: "Buckler", kind: "equip", icon: "🛡️", slot: "sub", jobs: ["WAR", "PLD", "RDM", "THF", "DRK", "BRD"], lv: 2, price: 260, stats: { def: 4 } },
  sling: { name: "Sling", kind: "equip", icon: "🪃", slot: "ranged", jobs: ["WAR", "WHM", "MNK", "THF", "RDM", "BRD", "PLD", "DRK"], lv: 1, price: 90, stats: { acc: 3 } },
  pebble_pouch: { name: "Pebble Pouch", kind: "equip", icon: "🪨", slot: "ammo", jobs: ALL_J, lv: 1, price: 40, stats: { att: 1 } },
  wooden_arrows: { name: "Wooden Arrows", kind: "equip", icon: "➶", slot: "ammo", jobs: ["RNG", "WAR", "THF"], lv: 3, price: 120, stats: { att: 3 } },
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
  ashen_medallion: { name: "Ashen Medallion", kind: "equip", icon: "🏅", ex: true, rarity: "epic", slot: "neck", jobs: ALL_J, lv: 9, price: 0, stats: { hp: 20, mp: 20, acc: 6, att: 6, def: 4 } },
  crypt_dust: { name: "Crypt Dust", kind: "mat", icon: "⚱️", rarity: "uncommon", price: 140, stack: 12, desc: "Grave dust that glitters faintly. Alchemists pay well for it." },
  wardens_robe: { name: "Warden's Robe", kind: "equip", icon: "👘", rare: true, slot: "body", jobs: ["WHM", "BLM", "RDM"], lv: 8, price: 0, stats: { def: 8, mp: 25, int: 3, mnd: 3 } },
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
  bronze_tachi: { name: "Bronze Tachi", kind: "equip", icon: "🎌", slot: "main", wtype: "gkatana", dmg: 13, delay: 3.8, jobs: ["SAM"], lv: 1, price: 150 },
  iron_tachi: { name: "Iron Tachi", kind: "equip", icon: "🎌", slot: "main", wtype: "gkatana", dmg: 18, delay: 3.8, jobs: ["SAM"], lv: 6, price: 1150, stats: { str: 1 } },
  steel_tachi: { name: "Steel Tachi", kind: "equip", icon: "🎌", slot: "main", wtype: "gkatana", dmg: 24, delay: 3.8, jobs: ["SAM"], lv: 11, price: 3000, stats: { str: 1, acc: 2 } },
  frost_tachi: { name: "Frostforged Tachi", kind: "equip", icon: "🎌", slot: "main", wtype: "gkatana", dmg: 34, delay: 3.8, jobs: ["SAM"], lv: 17, price: 10200, stats: { str: 3, acc: 3 } },
  bronze_katana: { name: "Bronze Katana", kind: "equip", icon: "🌀", slot: "main", wtype: "katana", dmg: 6, delay: 2.2, jobs: ["NIN"], lv: 1, price: 90 },
  iron_katana: { name: "Iron Katana", kind: "equip", icon: "🌀", slot: "main", wtype: "katana", dmg: 10, delay: 2.2, jobs: ["NIN"], lv: 6, price: 950, stats: { agi: 1 } },
  steel_katana: { name: "Steel Katana", kind: "equip", icon: "🌀", slot: "main", wtype: "katana", dmg: 14, delay: 2.2, jobs: ["NIN"], lv: 11, price: 2700, stats: { agi: 1, acc: 2 } },
  rime_katana: { name: "Rimefrost Katana", kind: "equip", icon: "🌀", slot: "main", wtype: "katana", dmg: 20, delay: 2.2, jobs: ["NIN"], lv: 17, price: 9800, stats: { agi: 3, acc: 4 } },
  bronze_spear: { name: "Bronze Spear", kind: "equip", icon: "🔱", slot: "main", wtype: "polearm", dmg: 13, delay: 3.9, jobs: ["DRG"], lv: 1, price: 140 },
  iron_lance: { name: "Iron Lance", kind: "equip", icon: "🔱", slot: "main", wtype: "polearm", dmg: 18, delay: 3.9, jobs: ["DRG"], lv: 6, price: 1150, stats: { str: 1 } },
  steel_halberd: { name: "Steel Halberd", kind: "equip", icon: "🔱", slot: "main", wtype: "polearm", dmg: 25, delay: 4.0, jobs: ["DRG"], lv: 11, price: 3100, stats: { str: 2 } },
  frost_lance: { name: "Frostforged Lance", kind: "equip", icon: "🔱", slot: "main", wtype: "polearm", dmg: 35, delay: 4.0, jobs: ["DRG"], lv: 17, price: 10300, stats: { str: 3, acc: 3 } }
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
  bronze_axe: { name: "Bronze Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "axe", dmg: 8, delay: 2.8, jobs: ["BST"], lv: 1, price: 110 },
  iron_axe: { name: "Iron Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "axe", dmg: 12, delay: 2.8, jobs: ["BST"], lv: 6, price: 980, stats: { str: 1 } },
  steel_axe: { name: "Steel Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "axe", dmg: 17, delay: 2.8, jobs: ["BST"], lv: 11, price: 2800, stats: { str: 1, acc: 2 } },
  frost_axe: { name: "Frostforged Axe", kind: "equip", icon: "🪓", slot: "main", wtype: "axe", dmg: 24, delay: 2.8, jobs: ["BST"], lv: 17, price: 9900, stats: { str: 3, acc: 3 } }
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
  bronze_greatsword: { name: "Bronze Greatsword", kind: "equip", icon: "⚔️", slot: "main", wtype: "gsword", dmg: 13, delay: 4.0, jobs: ["RUN"], lv: 1, price: 150 },
  iron_greatsword: { name: "Iron Greatsword", kind: "equip", icon: "⚔️", slot: "main", wtype: "gsword", dmg: 18, delay: 4.0, jobs: ["RUN"], lv: 6, price: 1150, stats: { vit: 1 } },
  steel_greatsword: { name: "Steel Greatsword", kind: "equip", icon: "⚔️", slot: "main", wtype: "gsword", dmg: 24, delay: 4.0, jobs: ["RUN"], lv: 11, price: 3000, stats: { vit: 1, acc: 2 } },
  frost_greatsword: { name: "Frostforged Greatsword", kind: "equip", icon: "⚔️", slot: "main", wtype: "gsword", dmg: 34, delay: 4.0, jobs: ["RUN"], lv: 17, price: 10200, stats: { vit: 3, acc: 3 } }
});
for (const id in ITEMS) {
  const it = ITEMS[id];
  if (!it.jobs) continue;
  if (it.slot === "main") { if (it.wtype === "club" && !it.jobs.includes("GEO")) it.jobs.push("GEO"); continue; }
  if ((it.jobs.includes("WHM") || it.jobs.includes("BLM")) && !it.jobs.includes("GEO")) it.jobs.push("GEO");
  if ((it.jobs.includes("PLD") || it.jobs.includes("WAR")) && !it.jobs.includes("RUN")) it.jobs.push("RUN");
}
const SHOP = ["ember_plume", "leather_gorget", "mage_pendant", "copper_earring", "beetle_earring", "travelers_cape", "mage_cape", "leather_belt", "buckler", "sling", "pebble_pouch", "wooden_arrows", "bronze_scythe", "iron_scythe", "steel_scythe", "shadow_plate", "minstrel_coat", "potion", "ether", "pickaxe", "hatchet", "sickle", "fire_crystal", "wind_crystal", "earth_crystal", "water_crystal", "copper_ore", "ash_log", "healing_herb", "bronze_sword", "ash_club", "ash_staff", "leather_vest", "linen_robe", "leather_gloves", "leather_trousers", "leather_boots", "maple_wand", "cotton_robe", "scale_mail", "kite_shield", "scarlet_tabard", "iron_sword", "holly_staff", "steel_sword", "steel_greataxe", "oak_staff", "oak_club", "chain_mail", "wizards_robe", "iron_helm", "wool_hat", "bronze_dagger", "iron_dagger", "steel_dagger", "leather_cesti", "iron_knuckles", "steel_claws", "brigand_vest", "training_gi", "fishing_rod", "bait", "grain_flour", "rock_salt", "shortbow", "yew_bow", "steel_longbow", "hunters_coat", "sprite_staff", "evoker_robe"];
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
  { id: "r_leather_boots", craft: "clothcraft", lv: 4, mats: { bat_wing: 2, silk_cloth: 1 }, out: "leather_boots" },
  { id: "r_round_rug", craft: "clothcraft", lv: 5, mats: { silk_cloth: 3 }, out: "round_rug" },
  { id: "r_cotton_robe", craft: "clothcraft", lv: 8, mats: { silk_cloth: 4, bone_chip: 1 }, out: "cotton_robe" },
  { id: "r_potion", craft: "alchemy", lv: 0, mats: { healing_herb: 2 }, out: "potion", qty: 2, hq: "potion_hq" },
  { id: "r_potted_plant", craft: "alchemy", lv: 2, mats: { healing_herb: 3 }, out: "potted_plant" },
  { id: "r_ether", craft: "alchemy", lv: 3, mats: { healing_herb: 1, bat_wing: 1 }, out: "ether", hq: "ether_hq" },
  { id: "r_hi_potion", craft: "alchemy", lv: 6, mats: { potion: 2, bone_chip: 1 }, out: "hi_potion" },
  { id: "r_grilled_minnow", craft: "cooking", lv: 0, mats: { pond_minnow: 1, rock_salt: 1 }, out: "grilled_minnow", qty: 2 },
  { id: "r_herb_bread", craft: "cooking", lv: 2, mats: { grain_flour: 2, healing_herb: 1 }, out: "herb_bread", qty: 2 },
  { id: "r_carp_stew", craft: "cooking", lv: 4, mats: { moat_carp: 1, healing_herb: 1, rock_salt: 1 }, out: "carp_stew", qty: 2 },
  { id: "r_shad_skewer", craft: "cooking", lv: 7, mats: { silver_shad: 2, rock_salt: 1 }, out: "shad_skewer", qty: 2 },
  { id: "r_eel_pie", craft: "cooking", lv: 10, mats: { mud_eel: 1, grain_flour: 2 }, out: "eel_pie", qty: 2 },
  { id: "r_perch_chowder", craft: "cooking", lv: 13, mats: { bog_perch: 1, grain_flour: 1, healing_herb: 1 }, out: "perch_chowder", qty: 2 },
  { id: "r_grilled_bass", craft: "cooking", lv: 12, mats: { sea_bass: 1, rock_salt: 1 }, out: "grilled_bass", qty: 2 },
  { id: "r_pike_feast", craft: "cooking", lv: 16, mats: { lakeking_pike: 1, grain_flour: 2, healing_herb: 2 }, out: "pike_feast", qty: 3 }
];

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

const FEATURES = { crafting: true, gathering: true, residence: true, nms: true, water: true, mounts: true };

const FAMILIES = {
  goblin: { name: "Goblin", color: "#8a9a5b", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 165 }, link: true, tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.4], ["fire_crystal", 0.3], ["copper_ore", 0.25], ["potion", 0.08]], gil: [3, 6], model: "goblin" },
  honey_bee: { name: "Honey Bee", color: "#f2c230", radius: 10, hpMul: 0.55, attMul: 0.85, defMul: 0.75, eva: 10, delay: 2.2, speed: 135, aggro: null, link: true, linkGroup: "bees", tpMove: { name: "Final Sting", mul: 2.2 }, weak: { ice: 1.2 }, loot: [["honeycomb", 0.4], ["wind_crystal", 0.2], ["potion", 0.05]], model: "bee", tint: 0xf2c230, tint2: 0x2a2218, scale: 1.15 },
  grass_crawler: { name: "Grass Crawler", color: "#7fb04a", radius: 14, hpMul: 0.9, attMul: 0.8, defMul: 1.1, eva: 2, delay: 3.4, speed: 70, aggro: null, link: false, tpMove: { name: "Sticky Thread", mul: 1.3, slow: true }, weak: { fire: 1.3 }, loot: [["crawler_cocoon", 0.3], ["worm_silk", 0.25], ["earth_crystal", 0.2], ["potion", 0.05]], model: "crawler", tint: 0x7fb04a },
  meadow_sheep: { name: "Meadow Sheep", color: "#e8e2d6", radius: 15, hpMul: 0.9, attMul: 0.8, defMul: 0.9, eva: 2, delay: 3.0, speed: 100, aggro: null, link: true, linkGroup: "sheep", tpMove: { name: "Rampant Butt", mul: 1.7 }, weak: { fire: 1.1 }, loot: [["wool_tuft", 0.45], ["earth_crystal", 0.2], ["healing_herb", 0.15]], model: "sheep", tint: 0xd8cfc0 },
  hill_lizard: { name: "Hill Lizard", color: "#8a9a4a", radius: 14, hpMul: 1.0, attMul: 1.0, defMul: 1.0, eva: 6, delay: 2.9, speed: 110, aggro: null, link: false, tpMove: { name: "Tail Whip", mul: 1.6, aoe: 60 }, weak: { ice: 1.2 }, loot: [["lizard_skin", 0.35], ["fire_crystal", 0.2], ["potion", 0.06]], model: "lizard", tint: 0x8a9a4a, tint2: 0xd8d4a0, scale: 1.3 },
  pond_crab: { name: "Pond Crab", color: "#b86a4a", radius: 14, hpMul: 1.0, attMul: 0.9, defMul: 1.3, eva: 0, delay: 3.2, speed: 80, aggro: null, link: false, tpMove: { name: "Big Pinch", mul: 1.8 }, weak: { lightning: 1.3 }, loot: [["crab_shell", 0.35], ["water_crystal", 0.25], ["potion", 0.05]], model: "crab", tint: 0xb86a4a },
  mandrake: { name: "Mandrake", color: "#d8b46a", radius: 11, hpMul: 0.7, attMul: 0.85, defMul: 0.85, eva: 8, delay: 2.5, speed: 125, aggro: null, link: true, linkGroup: "mandrake", tpMove: { name: "Dream Dust", mul: 1.2, sleepy: true }, weak: { fire: 1.3 }, loot: [["mandrake_leaf", 0.4], ["healing_herb", 0.25], ["earth_crystal", 0.15]], model: "mandrake", tint: 0xd8b46a, tint2: 0x5aa84a },
  shroomling: { name: "Shroomling", color: "#c8b8a0", radius: 13, hpMul: 1.1, attMul: 0.9, defMul: 1.0, eva: 0, delay: 3.3, speed: 60, int: 7, aggro: null, link: false, tpMove: { name: "Spore Cloud", mul: 1.1, aoe: 70 }, weak: { fire: 1.4 }, loot: [["spore_cap", 0.35], ["water_crystal", 0.2], ["ether", 0.05]], model: "shroom", tint: 0xd8c8b0, tint2: 0xb04a3a },
  lake_snapper: { name: "Lake Snapper", color: "#5a8ab0", radius: 12, hpMul: 0.9, attMul: 1.05, defMul: 0.9, eva: 8, delay: 2.6, speed: 120, aggro: null, link: false, tpMove: { name: "Snapjaw", mul: 1.9 }, weak: { lightning: 1.3 }, loot: [["moat_carp", 0.3], ["water_crystal", 0.25], ["potion", 0.05]], model: "fish", tint: 0x5a8ab0 },
  longneck: { name: "Marsh Longneck", color: "#b09070", radius: 20, hpMul: 1.8, attMul: 1.1, defMul: 1.1, eva: 2, delay: 3.6, speed: 105, aggro: null, link: false, tpMove: { name: "Stomp", mul: 1.9, aoe: 80 }, weak: { lightning: 1.2 }, loot: [["longneck_hide", 0.35], ["earth_crystal", 0.3], ["hi_potion", 0.06]], model: "longneck", tint: 0xb09070 },
  bat: { name: "Cave Bat", color: "#6d5a8a", radius: 11, hpMul: 0.7, attMul: 0.9, defMul: 0.8, eva: 10, delay: 2.4, speed: 125, aggro: null, link: false, tpMove: { name: "Wing Slap", mul: 1.9 }, weak: { ice: 1.25 }, loot: [["egg_batling", 0.004], ["bat_wing", 0.4], ["wind_crystal", 0.3], ["ether", 0.05]], model: "bat" },
  worm: { name: "Tunnel Worm", color: "#b8866a", radius: 14, hpMul: 1.2, attMul: 0.85, defMul: 1.1, delay: 3.4, speed: 55, int: 4, aggro: { magic: 130, sound: 90 }, link: false, tpMove: { name: "Sand Spit", mul: 1.5, aoe: 60 }, weak: { wind: 1.25 }, loot: [["egg_wormlet", 0.004], ["worm_silk", 0.35], ["earth_crystal", 0.3], ["healing_herb", 0.25], ["ether", 0.06]], model: "worm" },
  ghoul: { name: "Ghoul", color: "#9fbfa0", radius: 15, hpMul: 1.1, attMul: 1.1, defMul: 1.0, delay: 3.0, speed: 85, aggro: { sound: 120, lowhp: 200 }, link: true, tpMove: { name: "Vampiric Claw", mul: 1.8, drain: true }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.3], ["ether", 0.08], ["hi_potion", 0.05]], model: "ghoul" },
  den_goblin: { name: "Goblin Raider", color: "#6f7f45", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 165 }, link: true, linkGroup: "goblin", tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["fire_crystal", 0.3], ["iron_ore", 0.15], ["ash_log", 0.2], ["hi_potion", 0.05]], gil: [3, 6], model: "goblin" },
  orc_grunt: { name: "Orc Grunt", color: "#6f7f4f", radius: 16, hpMul: 1.3, attMul: 1.2, defMul: 1.1, delay: 3.2, speed: 95, aggro: { sight: 190 }, link: true, linkGroup: "orc", tpMove: { name: "Battle Roar", mul: 1.9, aoe: 70 }, weak: { ice: 1.2, light: 1.1 }, loot: [["orc_tooth", 0.3], ["iron_ore", 0.3], ["fire_crystal", 0.25], ["hi_potion", 0.06]], gil: [10, 16], model: "orc" },
  orc_stonechucker: { name: "Orc Stonechucker", color: "#7f8f5f", radius: 15, hpMul: 1.05, attMul: 1.15, defMul: 0.95, delay: 3.6, speed: 100, aggro: { sight: 220 }, link: true, linkGroup: "orc", range: 200, tpMove: { name: "Boulder Toss", mul: 2.1 }, weak: { ice: 1.2, light: 1.1 }, loot: [["orc_tooth", 0.3], ["ash_log", 0.25], ["wind_crystal", 0.25], ["ether", 0.06]], gil: [10, 16], model: "orc" },
  fishfolk: { name: "Reefkin", color: "#4a8a7a", radius: 15, hpMul: 1.1, attMul: 1.05, defMul: 1.05, eva: 6, delay: 2.9, speed: 105, aggro: { sight: 170, sound: 120 }, link: true, linkGroup: "reefkin", tpMove: { name: "Water Lance", mul: 1.8 }, weak: { lightning: 1.4 }, loot: [["reef_scale", 0.3], ["water_crystal", 0.3], ["harbor_bream", 0.2], ["potion", 0.08]], gil: [8, 14], model: "fishfolk" },
  birdfolk: { name: "Crag Talon", color: "#c8a870", radius: 14, hpMul: 1.0, attMul: 1.1, defMul: 0.95, eva: 10, delay: 2.6, speed: 120, aggro: { sight: 200 }, link: true, linkGroup: "crag", tpMove: { name: "Talon Dive", mul: 1.9 }, weak: { wind: 1.2, ice: 1.2 }, loot: [["crag_feather", 0.35], ["wind_crystal", 0.3], ["potion", 0.08]], gil: [9, 15], model: "birdfolk" },
  birdfolk_priest: { name: "Crag Chanter", color: "#f0e4c8", radius: 14, hpMul: 0.95, attMul: 0.95, defMul: 0.9, eva: 8, delay: 3.0, speed: 110, int: 9, aggro: { sight: 200, magic: 150 }, link: true, linkGroup: "crag", tpMove: { name: "Shrieking Chant", mul: 1.5, aoe: 80 }, weak: { wind: 1.2, ice: 1.2 }, loot: [["crag_feather", 0.35], ["ether", 0.15], ["fire_crystal", 0.25]], gil: [10, 16], model: "birdfolk" },
  sapling: { name: "Wandering Sapling", color: "#6aa84a", radius: 13, hpMul: 0.9, attMul: 0.8, defMul: 1.1, delay: 3.2, speed: 85, aggro: null, link: false, tpMove: { name: "Leaf Lash", mul: 1.5 }, weak: { fire: 1.6 }, loot: [["ash_log", 0.35], ["healing_herb", 0.25], ["earth_crystal", 0.2]], model: "treant", tint: 0x6aa84a },
  treant_elder: { name: "Elder Treant", color: "#4a3a28", radius: 20, hpMul: 2.0, attMul: 1.2, defMul: 1.4, delay: 3.8, speed: 70, aggro: { sight: 160 }, link: false, tpMove: { name: "Root Quake", mul: 2.0, aoe: 90 }, weak: { fire: 1.6 }, loot: [["heartwood", 0.3], ["ash_log", 0.5], ["earth_crystal", 0.4], ["hi_potion", 0.08]], gil: [12, 20], model: "treant", scale: 1.3 },
  cactus: { name: "Needlekin", color: "#5aa04a", radius: 12, hpMul: 0.9, attMul: 1.0, defMul: 1.2, eva: 4, delay: 3.0, speed: 90, aggro: { sight: 150 }, link: false, range: 170, tpMove: { name: "Thousand Needles", mul: 2.4 }, weak: { fire: 1.3 }, loot: [["cactus_needle", 0.35], ["earth_crystal", 0.25], ["potion", 0.08]], gil: [8, 14], model: "cactus" },
  bomb: { name: "Ember Bomb", color: "#ff7043", radius: 14, hpMul: 0.85, attMul: 1.3, defMul: 0.8, eva: 6, delay: 3.0, speed: 100, aggro: { sight: 160 }, link: false, tpMove: { name: "Self-Destruct", mul: 3.2, aoe: 90, explode: true }, weak: { water: 1.5, ice: 1.4 }, loot: [["bomb_ash", 0.4], ["fire_crystal", 0.4], ["ether", 0.06]], gil: [8, 14], model: "bomb" },
  skeleton: { name: "Wandering Bones", color: "#e8e2cf", radius: 15, hpMul: 1.0, attMul: 1.05, defMul: 1.1, delay: 3.0, speed: 80, aggro: { sound: 120, lowhp: 180 }, link: true, tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.25], ["ether", 0.06]], model: "skeleton" },
  hare: { name: "Meadow Hare", color: "#c8a27a", radius: 11, hpMul: 0.6, attMul: 0.8, defMul: 0.8, eva: 6, delay: 2.6, speed: 115, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["egg_meadow_kit", 0.004], ["healing_herb", 0.35], ["earth_crystal", 0.2], ["potion", 0.06]], model: "hare" },
  crypt_sentinel: { name: "Crypt Sentinel", color: "#80cbc4", radius: 17, hpMul: 3.0, attMul: 1.25, defMul: 1.3, delay: 3.2, speed: 85, aggro: { sight: 170, sound: 150 }, link: true, linkGroup: "undead", tpMove: { name: "Grave Sweep", mul: 1.7, aoe: 80 }, weak: { light: 1.5, fire: 1.2 }, nm: true, scale: 1.5, aura: "#80cbc4", respawn: 600, loot: [["crypt_key", 1], ["bone_chip", 1], ["ether", 0.6], ["sentinel_greaves", 0.3]], gil: [20, 30], model: "skeleton" },
  royal_guard: { name: "Royal Guard", color: "#c0c8d8", radius: 15, hpMul: 1.1, attMul: 1.15, defMul: 1.1, delay: 3.0, speed: 95, aggro: null, link: true, linkGroup: "undead", tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.5], ["water_crystal", 0.3]], model: "skeleton", summoned: true },
  hollow_king: { name: "Hollow King", color: "#ffd54f", radius: 20, hpMul: 3.8, attMul: 1.3, defMul: 1.25, delay: 3.4, speed: 90, aggro: { sight: 200 }, link: false, tpMove: { name: "Sovereign's Wrath", mul: 2.1, aoe: 100 }, weak: { light: 1.4, fire: 1.15 }, nm: true, boss: true, scale: 1.75, aura: "#ffd54f", respawn: 600, loot: [["hollow_crown", 0.3], ["kings_blade", 0.3], ["bone_chip", 1], ["hi_potion", 0.8], ["ether", 0.8]], gil: [60, 80], model: "skeleton", phases: [0.66, 0.33], enrage: 0.2 },
  bog_toad: { name: "Bog Toad", color: "#5f7a3a", radius: 14, hpMul: 1.15, attMul: 1.0, defMul: 1.0, delay: 3.0, speed: 90, aggro: { sound: 120 }, link: false, tpMove: { name: "Tongue Lash", mul: 1.8 }, weak: { ice: 1.25 }, loot: [["toad_oil", 0.45], ["water_crystal", 0.3], ["healing_herb", 0.2], ["hi_potion", 0.05]], gil: [6, 10], model: "toad" },
  bog_leech: { name: "Bog Leech", color: "#5a2a2a", radius: 13, hpMul: 1.1, attMul: 0.95, defMul: 1.1, delay: 3.2, speed: 60, int: 4, aggro: null, link: false, tpMove: { name: "Blood Drain", mul: 1.6, drain: true }, weak: { fire: 1.3 }, loot: [["worm_silk", 0.3], ["water_crystal", 0.3], ["ether", 0.08]], model: "worm", tint: 0x4a2226 },
  mire_goblin: { name: "Mire Goblin", color: "#58663a", radius: 15, hpMul: 1.05, attMul: 1.05, defMul: 1.05, delay: 3.0, speed: 95, aggro: { sight: 175 }, link: true, linkGroup: "mire", tpMove: { name: "Bog Bomb", mul: 1.7, aoe: 75 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.25], ["mire_reed", 0.3], ["fire_crystal", 0.2], ["hi_potion", 0.06]], gil: [8, 14], model: "goblin" },
  drowned: { name: "Drowned One", color: "#6f9a9a", radius: 15, hpMul: 1.2, attMul: 1.1, defMul: 1.05, delay: 3.0, speed: 85, aggro: { sound: 130, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Sodden Grasp", mul: 1.9, drain: true }, weak: { light: 1.5, lightning: 1.2 }, loot: [["chapel_sigil", 0.12], ["bone_chip", 0.35], ["water_crystal", 0.35], ["ether", 0.1], ["hi_potion", 0.06]], model: "ghoul" },
  marsh_hare: { name: "Reed Hare", color: "#8a7a5a", radius: 11, hpMul: 0.7, attMul: 0.85, defMul: 0.85, eva: 8, delay: 2.6, speed: 120, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["healing_herb", 0.4], ["mire_reed", 0.2], ["potion", 0.08]], model: "hare", tint: 0x8a7a5a },
  tide_priest: { name: "Tidebound Priest", color: "#4dd0e1", radius: 20, hpMul: 3.2, attMul: 1.1, defMul: 1.2, delay: 3.6, speed: 80, int: 6, aggro: { sight: 240, sound: 220 }, link: false, tpMove: { name: "Drowning Tide", mul: 1.6, aoe: 110 }, weak: { lightning: 1.4, light: 1.3 }, nm: true, boss: true, scale: 1.6, aura: "#4dd0e1", respawn: 30, phases: [0.65], adds: "drowned", addsText: "calls the drowned up from the water!", enrage: 0.2, pulse: { at: 0.5, every: 22, dmg: 4, r: 170, name: "Maelstrom", el: "water" }, loot: [], gil: [40, 60], model: "ghoul" },
  snow_hare: { name: "Snow Hare", color: "#e8eef2", radius: 11, hpMul: 0.75, attMul: 0.85, defMul: 0.85, eva: 10, delay: 2.6, speed: 125, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { fire: 1.2 }, loot: [["healing_herb", 0.4], ["wind_crystal", 0.2], ["potion", 0.1]], model: "hare", tint: 0xeef2f6 },
  ice_bat: { name: "Ice Bat", color: "#9fd8ff", radius: 11, hpMul: 0.85, attMul: 1.0, defMul: 0.9, eva: 12, delay: 2.4, speed: 130, aggro: null, link: true, linkGroup: "icebat", tpMove: { name: "Frost Wing", mul: 1.9 }, weak: { fire: 1.3 }, loot: [["egg_frost_wisp", 0.005], ["bat_wing", 0.4], ["frost_shard", 0.25], ["ether", 0.08]], model: "bat", tint: 0x8ab8d8 },
  frost_goblin: { name: "Frost Goblin", color: "#9aa8a0", radius: 15, hpMul: 1.15, attMul: 1.1, defMul: 1.1, delay: 3.0, speed: 95, aggro: { sight: 185 }, link: true, linkGroup: "frostgob", tpMove: { name: "Ice Bomb", mul: 1.8, aoe: 80 }, weak: { fire: 1.3 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.3], ["frost_shard", 0.3], ["hi_potion", 0.08]], gil: [10, 16], model: "goblin" },
  ice_wight: { name: "Ice Wight", color: "#b8e0f0", radius: 15, hpMul: 1.25, attMul: 1.15, defMul: 1.15, delay: 3.1, speed: 85, aggro: { sound: 140, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Rime Grasp", mul: 2.0, drain: true }, weak: { fire: 1.4, light: 1.4 }, loot: [["bone_chip", 0.35], ["frost_shard", 0.35], ["ether", 0.1]], model: "skeleton" },
  glacier_worm: { name: "Glacier Worm", color: "#cfe8f2", radius: 15, hpMul: 1.35, attMul: 1.0, defMul: 1.2, delay: 3.4, speed: 60, int: 5, aggro: { magic: 150 }, link: false, tpMove: { name: "Hail Spit", mul: 1.7, aoe: 70 }, weak: { fire: 1.35 }, loot: [["worm_silk", 0.35], ["frost_shard", 0.25], ["water_crystal", 0.3]], model: "worm", tint: 0xc8e4f0 },
  chieftain: { name: "Goblin Chieftain", color: "#7d8a3a", radius: 20, hpMul: 1.8, attMul: 1.0, defMul: 1.0, delay: 3.2, speed: 100, aggro: { sight: 170 }, link: true, linkGroup: "goblin", tpMove: { name: "Goblin Rush", mul: 0.7, hits: 3 }, weak: { ice: 1.2 }, nm: true, respawn: 180, loot: [["chieftain_cap", 0.3], ["goblin_totem", 0.3], ["raider_helm", 0.25], ["iron_sword", 0.2], ["goblin_pouch", 1], ["ether", 0.5], ["iron_ore", 0.8]], gil: [30, 40], model: "chieftain" }
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

const NM_FAMILIES = {
  silkmother: { hint: "Burrow Flats, Rocky Hollow · any time", base: "grass_crawler", name: "Silkmother", hpMul: 2.6, attMul: 1.1, defMul: 1.3, scale: 1.7, aura: "#c5e1a5", loot: [["silkweave_mantle", 0.3], ["silk_gloves", 0.35], ["crawler_cocoon", 1], ["potion", 0.6]], gil: [20, 30], respawn: 480 },
  orc_warlord: { hint: "Orc camp, Ashen Marsh · any time", base: "orc_grunt", name: "Gorruk the Warlord", hpMul: 3.4, attMul: 1.3, defMul: 1.2, scale: 1.35, aura: "#ff7043", loot: [["warlord_cleaver", 0.3], ["warlord_band", 0.35], ["orc_tooth", 1], ["hi_potion", 0.6]], gil: [40, 60], respawn: 600 },
  ashen_herald: { hint: "Summit Overlook, Frostspire Pass · story", base: "ice_wight", name: "The Ashen Herald", hpMul: 5.5, attMul: 1.35, defMul: 1.3, scale: 1.7, aura: "#ff7043", loot: [["cinder_mantle", 0.3], ["egg_ember_wisp", 0.08], ["frost_shard", 1], ["hi_potion", 1], ["ether", 1]], gil: [200, 260], respawn: 60 },
  rimefang: { hint: "Icefall Camp, Frostspire Pass · any time", base: "frost_goblin", name: "Rimefang", hpMul: 3.4, attMul: 1.25, defMul: 1.2, scale: 1.4, aura: "#80d8ff", loot: [["rimefang_axe", 0.3], ["frost_ring", 0.35], ["egg_snow_kit", 0.04], ["frost_shard", 1], ["ether", 0.6]], gil: [50, 70], respawn: 600 },
  frost_wight: { hint: "Whispering Cairns, Frostspire Pass · night", base: "ice_wight", name: "The Frost Wight", hpMul: 3.6, attMul: 1.25, defMul: 1.25, scale: 1.45, aura: "#b3e5fc", loot: [["wight_shroud", 0.3], ["frost_ring", 0.3], ["bone_chip", 1], ["hi_potion", 0.6]], gil: [50, 70], respawn: 720 },
  old_croaker: { hint: "Croaker's Pool, Ashen Marsh · day", base: "bog_toad", name: "Old Croaker", hpMul: 3.0, attMul: 1.2, defMul: 1.15, scale: 1.9, aura: "#9ccc65", loot: [["croaker_charm", 0.35], ["toad_oil", 1], ["water_crystal", 1], ["hi_potion", 0.5]], gil: [30, 45], respawn: 480 },
  mirelord_gax: { hint: "Mire Village, Ashen Marsh · any time", base: "mire_goblin", name: "Mirelord Gax", hpMul: 3.4, attMul: 1.25, defMul: 1.2, scale: 1.45, aura: "#ffab40", loot: [["gax_cleaver", 0.3], ["egg_mini_gob", 0.03], ["mire_mantle", 0.3], ["goblin_pouch", 1], ["iron_ore", 1], ["ether", 0.5]], gil: [40, 60], respawn: 600 },
  grimtooth: { hint: "Goblin Camp, eastern Rocky Hollow · any time", base: "goblin", name: "Grimtooth", hpMul: 2.4, attMul: 1.15, defMul: 1.1, scale: 1.3, aura: "#ff5252", loot: [["raiders_ring", 0.3], ["scavenger_cap", 0.35], ["goblin_pouch", 1], ["fire_crystal", 1], ["hi_potion", 0.3]], gil: [12, 16], respawn: 300 },
  duskwing: { hint: "Old Fort Ruins, Rocky Hollow · night", base: "bat", name: "Duskwing", hpMul: 2.2, attMul: 1.1, eva: 18, scale: 1.6, aura: "#b388ff", loot: [["duskwing_boots", 0.3], ["egg_shade_kit", 0.03], ["nightwing_gloves", 0.35], ["bat_wing", 1], ["wind_crystal", 1], ["ether", 0.3]], respawn: 300 },
  king_wiggles: { hint: "Burrow Flats, southern Rocky Hollow · day", base: "worm", name: "King Wiggles", hpMul: 2.6, attMul: 1.05, scale: 1.5, aura: "#ffd54f", loot: [["silkworm_gloves", 0.3], ["moonbloom_seeds", 0.4], ["burrower_trousers", 0.35], ["hare_charm", 0.3], ["worm_silk", 1], ["earth_crystal", 1], ["ether", 0.3]], respawn: 300 },
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
      { x: 222, y: 400, w: 26, h: 40, to: "residence", tx: 200, ty: 250, label: "Your Residence", kind: "door", ask: "Enter your residence?" }
    ],
    npcs: [
      { id: "rhea", x: 560, y: 210, home: 4, sleep: [22, 6] }, { id: "tobin", x: 840, y: 250, home: 1, sleep: [20, 7] }, { id: "pell", x: 380, y: 520, home: 0, sleep: [21, 6.5] },
      { id: "brann", x: 780, y: 560, home: 2, sleep: [23, 7.5] }, { id: "crystal_town", x: 560, y: 420 }, { id: "ysolde", x: 890, y: 500, home: 2, sleep: [19.5, 5.5] },
      { id: "odette", x: 330, y: 330, home: 0, sleep: [21.5, 6] },
      { id: "luna", x: 660, y: 470 }, { id: "garrick", x: 690, y: 640, home: 2, sleep: [22, 6.5] }, { id: "trade_board", x: 640, y: 300 }, { id: "maera", x: 455, y: 255, home: 4, sleep: [22.5, 6.5] }, { id: "corvin", x: 430, y: 430 }, { id: "guard_east", x: 985, y: 345 }
    ],
    props: [{ type: "anvil", x: 690, y: 690, rot: 0.2, r: 26 }, { type: "desk", x: 455, y: 290, r: 22 }, { type: "desk", x: 430, y: 465, r: 22 }, { type: "barrels", x: 900, y: 560, rot: 1.2, r: 26 }],
    ambient: [{ type: "chicken", x: 400, y: 600, n: 4, r: 70 }, { type: "dog", x: 640, y: 470, n: 1, r: 120, col: 0x8a6a4a }, { type: "cat", x: 300, y: 330, n: 1, r: 50, col: 0x5a5a5a }, { type: "walker", x: 560, y: 420, n: 1, path: [[560, 300], [820, 410], [700, 520], [480, 500]] }, { type: "walker", x: 600, y: 450, n: 1, path: [[380, 470], [560, 560], [760, 470], [620, 330]] }],
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
    exits: [{ x: 176, y: 296, w: 48, h: 24, to: "outpost", tx: 288, ty: 420, label: "Outpost", kind: "door", ask: "Leave your residence?", yes: "Leave" }],
    npcs: [{ id: "pip", x: 60, y: 60 }],
    spawns: [],
    start: { x: 200, y: 250 },
    grid: { cols: 10, rows: 8, blocked: [[0, 0], [1, 0], [0, 1], [1, 1], [4, 7], [5, 7], [4, 6], [5, 6]] }
  },
  hollow: {
    name: "Rocky Hollow", w: 3200, h: 2200, theme: "field",
    exits: [
      { x: 0, y: 1050, w: 24, h: 100, to: "outpost", tx: 990, ty: 400, label: "Outpost" },
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
ZONES.harbor = {
  name: "Saltreach Harbor", w: 1400, h: 1000, safe: true, theme: "town",
  exits: [{ x: 450, y: 0, w: 100, h: 24, to: "marsh", tx: 2250, ty: 2290, label: "Ashen Marsh" }, { x: 1376, y: 380, w: 24, h: 100, to: "frost", tx: 110, ty: 1200, label: "Frostspire Pass" }],
  props: [{ type: "crates", x: 440, y: 640, r: 30 }, { type: "desk", x: 560, y: 455, r: 22 }, { type: "barrels", x: 960, y: 640, r: 26 }],
  ambient: [{ type: "gull", x: 700, y: 700, n: 5, r: 160 }, { type: "cat", x: 500, y: 560, n: 1, r: 60, col: 0xd08a40 }, { type: "walker", x: 700, y: 500, n: 1, path: [[500, 300], [900, 300], [900, 620], [500, 620]] }, { type: "walker", x: 700, y: 500, n: 1, path: [[700, 200], [700, 640], [1000, 500]] }],
  npcs: [
    { id: "ilsa", x: 700, y: 330, home: 4, sleep: [22, 6] }, { id: "marn", x: 480, y: 600, home: 2, sleep: [20.5, 4.5] }, { id: "vela", x: 930, y: 600, home: 3, sleep: [21, 7] },
    { id: "crystal_harbor", x: 700, y: 460 }, { id: "ferry_harbor", x: 560, y: 760 }, { id: "trade_board", x: 860, y: 380 }, { id: "selene", x: 560, y: 420 }, { id: "guard_north", x: 530, y: 80 }, { id: "guard_pass", x: 1330, y: 340 }
  ],
  spawns: [],
  water: [{ x: 300, y: 1180, r: 360 }, { x: 900, y: 1230, r: 420 }, { x: 1350, y: 1100, r: 260 }],
  plaza: { x: 700, y: 460, r: 140 },
  paths: [
    { w: 52, pts: [[500, -500], [500, 0], [560, 260], [700, 460]] },
    { w: 40, pts: [[700, 460], [700, 760]] },
    { w: 34, pts: [[700, 460], [480, 600]] },
    { w: 34, pts: [[700, 460], [930, 600]] },
    { w: 40, pts: [[700, 460], [1050, 430], [1400, 430], [1900, 430]] }
  ],
  houses: [{ x: 280, y: 260, w: 150, h: 110, rot: 0 }, { x: 1100, y: 260, w: 150, h: 110, rot: 0 }, { x: 250, y: 560, w: 120, h: 140, rot: 1 }, { x: 1160, y: 580, w: 120, h: 140, rot: 1 }, { x: 860, y: 170, w: 170, h: 90, rot: 0 }],
  stalls: [{ x: 480, y: 650, color: "#0277bd" }, { x: 930, y: 650, color: "#6a1b9a" }],
  docks: [[470, 770, 60, 210], [880, 780, 60, 200]],
  boats: [[300, 965, 0.2], [1000, 985, -0.4]],
  lamps: [[600, 360], [800, 360], [600, 560], [800, 560], [700, 760]],
  start: { x: 500, y: 90 }
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
    { fam: "ice_snapper", lv: [16, 18], x: 1000, y: 1180 }, { fam: "frost_stonechucker", lv: [17, 19], x: 1620, y: 640 }, { fam: "frost_bomb", lv: [17, 19], x: 2400, y: 1200, time: "night" }, { fam: "rime_treant", lv: [18, 19], x: 2700, y: 700 },
    { fam: "ice_wight", lv: [19, 20], x: 2700, y: 330, nm: { id: "ashen_herald", lv: 22, chance: 0 } },
    { fam: "snow_hare", lv: [15, 16], x: 400, y: 900, time: "day" }, { fam: "snow_hare", lv: [15, 16], x: 500, y: 1500, time: "day" }, { fam: "snow_hare", lv: [16, 17], x: 1300, y: 1600, time: "day" },
    { fam: "glacier_worm", lv: [15, 16], x: 650, y: 1150 }, { fam: "glacier_worm", lv: [16, 17], x: 1250, y: 1150 }, { fam: "glacier_worm", lv: [17, 18], x: 1700, y: 1250 },
    { fam: "ice_bat", lv: [15, 17], x: 900, y: 800, time: "night" }, { fam: "ice_bat", lv: [16, 17], x: 1100, y: 600, time: "night" }, { fam: "ice_bat", lv: [17, 18], x: 2000, y: 900, time: "night" },
    { fam: "frost_goblin", lv: [16, 17], x: 1350, y: 600 }, { fam: "frost_goblin", lv: [16, 17], x: 1550, y: 550 }, { fam: "frost_goblin", lv: [17, 18], x: 1650, y: 800 },
    { fam: "frost_goblin", lv: [17, 18], x: 1450, y: 850 }, { fam: "frost_goblin", lv: [18, 19], x: 1800, y: 650, nm: { id: "rimefang", lv: 21, chance: 0.15 } },
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
    { fam: "treant_elder", lv: [13, 14], x: 1900, y: 1900 }, { fam: "birdfolk", lv: [12, 13], x: 300, y: 1500 }, { fam: "birdfolk", lv: [12, 14], x: 360, y: 1560 }, { fam: "birdfolk_priest", lv: [13, 14], x: 330, y: 1620 }, { fam: "cactus", lv: [10, 12], x: 2200, y: 300 },
    { fam: "bog_toad", lv: [9, 10], x: 1100, y: 450 }, { fam: "bog_toad", lv: [9, 10], x: 1600, y: 600 }, { fam: "bog_toad", lv: [10, 11], x: 800, y: 700 },
    { fam: "bog_toad", lv: [10, 11], x: 700, y: 1200 }, { fam: "bog_toad", lv: [11, 12], x: 1000, y: 1500 }, { fam: "bog_toad", lv: [11, 12], x: 650, y: 1550, nm: { id: "old_croaker", lv: 15, chance: 0.15, time: "day" } },
    { fam: "bog_leech", lv: [10, 11], x: 1500, y: 900 }, { fam: "bog_leech", lv: [10, 12], x: 1300, y: 1200 }, { fam: "bog_leech", lv: [11, 12], x: 1700, y: 1300 }, { fam: "bog_leech", lv: [12, 13], x: 2000, y: 1900 },
    { fam: "bat", lv: [10, 11], x: 1200, y: 800, time: "night" }, { fam: "bat", lv: [10, 12], x: 900, y: 1100, time: "night" }, { fam: "bat", lv: [11, 12], x: 1900, y: 1400, time: "night" },
    { fam: "mire_goblin", lv: [11, 12], x: 1850, y: 650 }, { fam: "mire_goblin", lv: [11, 12], x: 1950, y: 950 }, { fam: "mire_goblin", lv: [12, 13], x: 2250, y: 650 },
    { fam: "mire_goblin", lv: [12, 13], x: 2400, y: 900 }, { fam: "mire_goblin", lv: [13, 14], x: 2200, y: 1100 }, { fam: "mire_goblin", lv: [13, 14], x: 2500, y: 600, nm: { id: "mirelord_gax", lv: 16, chance: 0.15 } },
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
  pell: { name: "Pell, Merchant", model: "pell", talk: "talkPell" },
  garrick: { name: "Garrick, Smith", model: "garrick", talk: "talkGarrick" },
  trade_board: { name: "Trade Board", prop: "board", talk: "talkBoard" },
  maera: { name: "Maera, Adventurers' Guild", model: "maera", talk: "talkMaera" },
  guard_east: { name: "Gate Guard Aldo", model: "guard", talk: "talkGuard" },
  guard_north: { name: "Harbor Guard Senna", model: "guard_f", talk: "talkGuard" },
  guard_pass: { name: "Harbor Guard Tomas", model: "guard", talk: "talkGuard" },
  corvin: { name: "Corvin, Auction House", model: "corvin", talk: "talkAuction" },
  selene: { name: "Selene, Auction House", model: "selene", talk: "talkAuction" },
  odette: { name: "Odette, Furnishings", model: "odette", talk: "talkOdette", shop: "furniture" },
  brann: { name: "Brann, Mercenary Hall", model: "brann", talk: "talkBrann" },
  ysolde: { name: "Ysolde, Stablemaster", model: "ysolde", talk: "talkYsolde" },
  crystal_town: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  chapel_door: { name: "Sealed Chapel Door", prop: "tablet", talk: "talkChapelDoor" },
  ilsa: { name: "Ilsa, Harbor Master", model: "ilsa", talk: "talkIlsa" },
  marn: { name: "Marn, Fishmonger", model: "marn", talk: "talkMarn" },
  vela: { name: "Vela, Outfitter", model: "vela", talk: "talkVela" },
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
  pouches: { name: "Pouches for the Captain", giver: "Captain Rhea", npc: "rhea", lv: 1, desc: "Bring Captain Rhea 3 Goblin Pouches. Goblins in Rocky Hollow carry them.", reward: { xp: 300, gil: 300, item: "captains_ring" } },
  home: { name: "Make It Home", giver: "Odette", npc: "odette", lv: 1, check: "furniture", desc: "Buy or craft two pieces of furniture and have Pip place them in your residence (the door is on the west house of the Outpost).", reward: { xp: 100, gil: 0, items: [["flowerpot", 1], ["herb_seeds", 2]] },
    intro: "Every adventurer needs somewhere to hang their helm. The cottage by the west wall is yours; my cousin Pip keeps it. Put two pieces of furniture in it and I'll throw in something green for the windowsill.", progress: "Two pieces placed, that's all. Chairs are cheap. Talk to Pip at the cottage to arrange them.", turn: "Two pieces placed! It's a home now. Here, a flowerpot and some herb seeds; Pip will show you how to garden." },
  greenthumb: { name: "Green Thumb", giver: "Pip", npc: "pip", lv: 1, check: "harvest", desc: "Plant a seed in a Flowerpot at your residence, water it through its three stages, and harvest it.", reward: { xp: 150, gil: 0, items: [["wildgrass_seeds", 2]] },
    intro: "You've a flowerpot? Then let's grow something! Plant a seed, water it, and feed it an elemental essence if you have one. It takes a while in real time, so come back. Harvest once and I'll give you some wildgrass seeds.", progress: "Still growing? Water it at every stage; dry plants don't grow.", turn: "A harvest! You've the knack. Wildgrass grows crystals of whichever element you feed it; try these." },
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
  catchday: { name: "Catch of the Day", giver: "Ilsa", npc: "ilsa", lv: 6, items: { harbor_bream: 3 }, desc: "Bring Ilsa 3 Harbor Bream from Saltreach Harbor's waters.", reward: { xp: 500, gil: 300, item: "sea_rod", qty: 1 },
    intro: "New to the harbor? Everyone here fishes, even me. Show me you can hold a rod: bring me 3 Harbor Bream from the docks and I'll give you a proper sea rod.", progress: "3 Harbor Bream. Cast from the docks; they bite best in rain.", turn: "Nice fish. Here, a real rod. Don't lose it over the side." },
  saltsteel: { name: "Salt and Steel", giver: "Ilsa", npc: "ilsa", lv: 12, kill: { fam: "mire_goblin", n: 5, name: "Mire Goblin" }, desc: "Drive back 5 Mire Goblins that raid the road between the Ashen Marsh and Saltreach Harbor.", reward: { xp: 1600, gil: 800, item: "tide_ring", qty: 1 },
    intro: "Goblins from Mire Village keep raiding our carts on the marsh road. I can't spare sailors to guard them. Cut down five of the raiders and the harbor will owe you.", progress: "Five Mire Goblins. They roam north of here in the marsh.", turn: "The carts came through clean today. Take this ring; it was my mother's, and she'd want it on someone useful." },
  frozencargo: { name: "Frozen Cargo", giver: "Ilsa", npc: "ilsa", lv: 16, kill: { fam: "frost_goblin", n: 6, name: "Frost Goblin" }, desc: "Drive back 6 Frost Goblins raiding the caravans in Frostspire Pass, east of Saltreach.", reward: { xp: 4000, gil: 1500, item: "fur_hat", qty: 1 },
    intro: "Our ice caravans come down Frostspire Pass, east of the harbor. Goblins in fur coats have started ambushing them. Thin them out (six should do) and I'll see you warmly dressed.", progress: "Six Frost Goblins in Frostspire Pass. They see far in the snow, so pick your fights.", turn: "The caravan made it through. Here, a fur hat. You'll need it up there." },
  silk: { name: "Silk for Sale", giver: "Pell", npc: "pell", lv: 2, kill: { fam: "grass_crawler", n: 6, name: "Grass Crawler" }, desc: "Pell wants crawler silk. Defeat 6 Grass Crawlers in Rocky Hollow.", reward: { xp: 250, gil: 300, item: "silk_gloves_q", qty: 1 },
    intro: "Every tailor in the capital wants crawler silk, and the meadow's crawling with the stuff. Literally. Put down six of those big green crawlers and I'll make it worth your while.", progress: "Six Grass Crawlers. They're slow and they won't start a fight, but mind the sticky thread.", turn: "Lovely, lovely. I'll have the cocoons spun by Firesday. Here, a pair of gloves from the first batch." },
  mire: { name: "Into the Mire", giver: "Captain Rhea", npc: "rhea", lv: 10, kill: { fam: "bog_toad", n: 6, name: "Bog Toad" }, desc: "Thin out the Bog Toads in the Ashen Marsh, south of Rocky Hollow.", reward: { xp: 1200, gil: 600, item: "marsh_boots", qty: 1 },
    intro: "Scouts found a road south of the Hollow, sunk into a marsh nobody's mapped. The toads there are big enough to swallow a goblin, and loud enough to wake the dead. Cull six of them so my scouts can work.", progress: "Six Bog Toads. They hunt by sound, so tread lightly until you're ready.", turn: "Quieter already. Take these boots; they're oiled against the bog water." },
  mirelord: { name: "The Mirelord", giver: "Brann", npc: "brann", lv: 13, pre: "mire", kill: { fam: "mirelord_gax", n: 1, name: "Mirelord Gax" }, desc: "Defeat Mirelord Gax, who rules the goblins of Mire Village in the Ashen Marsh.", reward: { xp: 2000, gil: 1200, item: "ether", qty: 3 },
    intro: "Two of my people went into the marsh and came back with stories of a goblin who calls himself the Mirelord. Gax. He's taxing the reed cutters. I'd take it personally if you put an end to that.", progress: "Gax keeps to Mire Village, east of the causeway. He shows himself now and then among his goblins.", turn: "The Mirelord's done? My people will drink to you tonight. Here, you've earned this." },
  thf: { name: "Light Fingers", giver: "Tobin", npc: "tobin", lv: 6, items: { goblin_pouch: 3, bat_wing: 1 }, desc: "Bring Tobin 3 Goblin Pouches and 1 Bat Wing to learn the Thief's trade.", reward: { xp: 300, gil: 0, item: "bronze_dagger", qty: 1, unlock: "THF" },
    intro: "A Thief lives by quick hands and quicker feet: daggers, Steal, Sneak Attack, and a nose for treasure. Prove your hands are light. Lift 3 Goblin Pouches off their owners and bring me a Bat Wing besides.", progress: "3 Goblin Pouches and a Bat Wing. Goblins carry the pouches; bats come out at night.", turn: "Not bad at all. Here's a dagger to start with. Ask me to change jobs whenever you like." },
  mnk: { name: "The Open Hand", giver: "Tobin", npc: "tobin", lv: 6, items: { bone_chip: 2, healing_herb: 3 }, desc: "Bring Tobin 2 Bone Chips and 3 Healing Herbs to begin training as a Monk.", reward: { xp: 300, gil: 0, item: "leather_cesti", qty: 1, unlock: "MNK" },
    intro: "A Monk needs no blade. Fists, Boost and Focus, and Chakra to mend their own wounds. Training starts with a poultice: 3 Healing Herbs, and 2 Bone Chips ground into it. Don't ask why. It works.", progress: "2 Bone Chips from the undead and 3 Healing Herbs.", turn: "Good. Wrap your hands in these and hit things. That's most of it, honestly." },
  rng: { name: "Steady Aim", giver: "Tobin", npc: "tobin", lv: 6, items: { bat_wing: 3, ash_lumber: 2 }, desc: "Bring Tobin 3 Bat Wings and 2 Ash Lumber to learn the Ranger's craft.", reward: { xp: 300, gil: 0, item: "shortbow", qty: 1, unlock: "RNG" },
    intro: "A Ranger fights from afar: bow and arrow, Sharpshot and Barrage, and Shadowbind to pin a foe in place. Fletching starts with good wood and good feathers. Bring me 3 Bat Wings for the fletching and 2 Ash Lumber for the bow.", progress: "3 Bat Wings and 2 Ash Lumber. Woodworkers make lumber from Ash Logs.", turn: "Good wood, fair feathers. Here's your first bow. Keep your distance and let the arrows do the work." },
  drk: { name: "The Shadowed Path", giver: "Tobin", npc: "tobin", lv: 10, items: { crypt_dust: 2, bone_chip: 3 }, desc: "Bring Tobin 2 Crypt Dust and 3 Bone Chips to walk the Dark Knight's path.", reward: { xp: 600, gil: 0, item: "bronze_scythe", qty: 1, unlock: "DRK" },
    intro: "A Dark Knight trades a little of their own life for power: scythes, Drain, Blight, and Last Resort. It isn't a path for the careful. Bring me dust from the Sunken Crypt and bones from the restless dead, and I'll show you how it's done.", progress: "2 Crypt Dust and 3 Bone Chips. The Crypt has both; the Wandering Bones carry chips at night.", turn: "You carry the crypt's chill with you now. Take this scythe, and don't let it take you." },
  brd: { name: "A Traveler's Song", giver: "Tobin", npc: "tobin", lv: 10, items: { mire_reed: 3, bat_wing: 2 }, desc: "Bring Tobin 3 Mire Reeds and 2 Bat Wings so he can teach you the Bard's songs.", reward: { xp: 600, gil: 0, item: "minstrel_coat", qty: 1, unlock: "BRD" },
    intro: "Bards fight with a dagger in one hand and a song in the other. Their songs lift the whole party: sharper blades, faster swings, wounds that close on their own. I'll teach you, but I need reeds for a pipe and bat wings for the drum skin.", progress: "3 Mire Reeds from the Ashen Marsh and 2 Bat Wings. Bats come out at night.", turn: "Listen to that. A little shaky, but it carries. Here's a coat fit for the road." },
  smn: { name: "The Calling", giver: "Tobin", npc: "tobin", lv: 6, items: { fire_crystal: 2, wind_crystal: 2, healing_herb: 2 }, desc: "Bring Tobin 2 Fire Essences, 2 Wind Essences and 2 Healing Herbs to learn to call sprites.", reward: { xp: 300, gil: 0, item: "sprite_staff", qty: 1, unlock: "SMN" },
    intro: "A Summoner calls elemental sprites to fight for them. The sprites drink your MP while they're out, so mind it. To make the first calling, I'll need 2 Fire Essences, 2 Wind Essences, and 2 Healing Herbs to calm the sprite afterward.", progress: "2 Fire Essences, 2 Wind Essences and 2 Healing Herbs.", turn: "Listen... there. A spark answered. Take this staff and call it with Ember Sprite." },
  support: { name: "A Second Calling", giver: "Tobin", npc: "tobin", lv: 5, desc: "Reach level 5, then bring Tobin 2 Bat Wings and 1 Worm Silk. Bats only come out at night.", reward: { xp: 300, gil: 0 } },
  riding: { name: "Riding License", giver: "Ysolde", npc: "ysolde", lv: 5, desc: "Reach level 5, then bring Ysolde 300 crystals and 3 Healing Herbs. Hares and worms in Rocky Hollow drop herbs.", reward: { xp: 200, gil: 0 } },
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
  name: "Ironvale", w: 1400, h: 1100, safe: true, theme: "town", palette: "snow",
  exits: [{ x: 0, y: 500, w: 24, h: 100, to: "frost", tx: 2900, ty: 1130, label: "Frostspire Pass" }, { x: 700, y: 1076, w: 100, h: 24, to: "sunscar", tx: 1500, ty: 120, label: "Sunscar Desert" }],
  props: [{ type: "crates", x: 1000, y: 760, r: 30 }, { type: "barrels", x: 520, y: 760, r: 26 }, { type: "desk", x: 900, y: 440, r: 22 }],
  ambient: [{ type: "walker", x: 750, y: 550, n: 1, path: [[500, 400], [1000, 400], [1000, 700], [500, 700]] }, { type: "walker", x: 750, y: 550, n: 1, path: [[750, 250], [750, 900], [1100, 560]] }, { type: "dog", x: 820, y: 620, n: 1, r: 120, col: 0x5a4a3a }],
  npcs: [
    { id: "brisa", x: 600, y: 430, home: 1, sleep: [22, 6] }, { id: "haldor", x: 900, y: 690, home: 2, sleep: [21, 5] }, { id: "orla", x: 900, y: 410 },
    { id: "crystal_ironvale", x: 750, y: 550 }, { id: "trade_board", x: 600, y: 690 }, { id: "guard_ironvale", x: 420, y: 470 }
  ],
  spawns: [],
  water: [],
  plaza: { x: 750, y: 550, r: 150 },
  paths: [
    { w: 50, pts: [[-500, 550], [0, 550], [420, 550], [750, 550]] },
    { w: 40, pts: [[750, 550], [750, 950], [750, 1100], [750, 1600]] },
    { w: 40, pts: [[750, 550], [750, 160]] },
    { w: 36, pts: [[750, 550], [1150, 550]] }
  ],
  houses: [{ x: 240, y: 180, w: 160, h: 110, rot: 0 }, { x: 1050, y: 170, w: 170, h: 110, rot: 0 }, { x: 240, y: 840, w: 150, h: 120, rot: 1 }, { x: 1100, y: 840, w: 160, h: 120, rot: 1 }, { x: 1180, y: 430, w: 120, h: 150, rot: 1 }],
  stalls: [{ x: 900, y: 740, color: "#5d4037" }, { x: 600, y: 740, color: "#37474f" }],
  lamps: [[640, 440], [860, 440], [640, 660], [860, 660], [750, 900]],
  start: { x: 120, y: 550 }
};

Object.assign(FAMILIES, {
  dune_lizard: tierFam("hill_lizard", { name: "Dune Lizard", color: "#c8a070", tint: 0xc8a070, tint2: 0xf0dcb0, hpMul: 1.15, attMul: 1.05, weak: { ice: 1.35, water: 1.2 }, loot: [["lizard_skin", 0.4], ["fire_crystal", 0.25], ["hi_potion", 0.06]] }),
  sand_crab: tierFam("pond_crab", { name: "Sand Crab", color: "#d8b880", tint: 0xd8b880, hpMul: 1.2, weak: { water: 1.3, lightning: 1.2 }, loot: [["crab_shell", 0.4], ["earth_crystal", 0.25], ["hi_potion", 0.06]] }),
  sun_wasp: tierFam("honey_bee", { name: "Sun Wasp", color: "#ffc040", tint: 0xffc040, tint2: 0x6a3a10, attMul: 1.1, weak: { ice: 1.4 }, loot: [["honeycomb", 0.3], ["fire_crystal", 0.25], ["hi_potion", 0.06]] }),
  dune_worm: tierFam("worm", { name: "Dune Worm", color: "#c8a878", tint: 0xc8a878, hpMul: 1.4, attMul: 1.05, weak: { water: 1.35 }, loot: [["worm_silk", 0.35], ["earth_crystal", 0.3], ["hi_potion", 0.06]] }),
  cinder_bomb: tierFam("bomb", { name: "Cinder Bomb", color: "#ff7043", hpMul: 1.15, weak: { water: 1.4, ice: 1.3 }, loot: [["bomb_ash", 0.4], ["fire_crystal", 0.35], ["hi_potion", 0.06]] })
});
NM_FAMILIES.sandmaw = { hint: "Singing Dunes, Sunscar Desert · any time", base: "worm", name: "Sandmaw", hpMul: 3.0, attMul: 1.15, scale: 1.8, aura: "#ffb74d", loot: [["dunestrider_boots", 0.35], ["worm_silk", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 480 };
ITEMS.dunestrider_boots = { name: "Dunestrider Boots", kind: "equip", icon: "👢", rare: true, nm: true, rarity: "epic", slot: "feet", jobs: ALL_JOBS, lv: 19, price: 0, stats: { def: 7, agi: 4, eva: 5, hp: 20 }, desc: "Sandmaw's hide, stitched into boots that never sink." };
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
    { fam: "dune_lizard", lv: [17, 18], x: 1100, y: 600 }, { fam: "dune_lizard", lv: [17, 19], x: 1800, y: 700 }, { fam: "dune_lizard", lv: [18, 19], x: 400, y: 1100 }, { fam: "dune_lizard", lv: [18, 20], x: 2700, y: 1100 },
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
  jungle_sapling: tierFam("sapling", { name: "Strangler Sapling", color: "#2e6b2e", hpMul: 1.25, attMul: 1.1, aggro: { sight: 140 }, weak: { fire: 1.5 }, loot: [["heartwood", 0.15], ["ash_log", 0.4], ["earth_crystal", 0.2], ["hi_potion", 0.06]] }),
  bloom_mandrake: tierFam("mandrake", { name: "Bloom Mandrake", color: "#d070a0", tint: 0xd070a0, tint2: 0x2e6b2e, hpMul: 1.2, loot: [["mandrake_leaf", 0.5], ["healing_herb", 0.3], ["hi_potion", 0.06]] }),
  jade_toad: tierFam("bog_toad", { name: "Jade Toad", color: "#5aa05a", hpMul: 1.2, attMul: 1.05, loot: [["toad_oil", 0.4], ["water_crystal", 0.25], ["hi_potion", 0.06]] })
});
NM_FAMILIES.old_mossback = { hint: "Heart of the Canopy, Verdant Jungle · any time", base: "treant_elder", name: "Old Mossback", hpMul: 3.0, attMul: 1.15, scale: 1.6, aura: "#9ccc65", loot: [["canopy_cloak", 0.35], ["heartwood", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 480 };
ITEMS.canopy_cloak = { name: "Canopy Cloak", kind: "equip", icon: "🧣", rare: true, nm: true, rarity: "epic", slot: "back", jobs: ALL_JOBS, lv: 19, price: 0, stats: { def: 4, hp: 25, mp: 25, mnd: 3, eva: 3 }, desc: "Woven from Old Mossback's living bark. It still smells of rain." };
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
    { fam: "jade_hornet", lv: [18, 19], x: 1300, y: 500, time: "day" }, { fam: "jade_hornet", lv: [18, 20], x: 2000, y: 900, time: "day" },
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
NM_FAMILIES.pyreclaw = { hint: "Crater Rim, Cinder Peak · night", base: "hill_lizard", name: "Pyreclaw", hpMul: 3.2, attMul: 1.2, scale: 2.0, aura: "#ff5722", loot: [["pyre_ring", 0.35], ["lizard_skin", 1], ["fire_crystal", 1], ["hi_potion", 0.5]], respawn: 540 };
ITEMS.pyre_ring = { name: "Pyre Ring", kind: "equip", icon: "💍", rare: true, nm: true, rarity: "epic", slot: "ring", jobs: ALL_JOBS, lv: 20, price: 0, stats: { str: 4, att: 8, acc: 4, res_fire: 10 }, desc: "Cut from Pyreclaw's heartstone. Warm to the touch, always." };
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
    { fam: "magma_lizard", lv: [18, 19], x: 700, y: 1000 }, { fam: "magma_lizard", lv: [19, 20], x: 1700, y: 900 }, { fam: "magma_lizard", lv: [19, 20], x: 2400, y: 500, nm: { id: "pyreclaw", lv: 22, chance: 0.12, time: "night" } },
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
NM_FAMILIES.old_saltjaw = { hint: "Wreck Cove, Gull Isle · any time", base: "lake_snapper", name: "Old Saltjaw", hpMul: 2.8, attMul: 1.1, scale: 1.9, aura: "#4fc3f7", loot: [["saltjaw_earring", 0.35], ["harbor_bream", 1], ["water_crystal", 1], ["hi_potion", 0.4]], respawn: 420 };
ITEMS.saltjaw_earring = { name: "Saltjaw Earring", kind: "equip", icon: "🦷", rare: true, nm: true, rarity: "epic", slot: "ear", jobs: ALL_JOBS, lv: 15, price: 0, stats: { acc: 5, att: 5, res_water: 10 }, desc: "A tooth from Old Saltjaw, bound in silver." };
ITEMS.gull_charm = { name: "Gull Charm", kind: "equip", icon: "🪶", rare: true, slot: "ear", jobs: ALL_JOBS, lv: 12, price: 0, stats: { agi: 2, eva: 3, mp: 10 }, desc: "Old Wend's lucky charm. Gulls follow whoever wears it." };
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
    { fam: "fishfolk", lv: [14, 15], x: 1650, y: 1150 }, { fam: "isle_snapper", lv: [14, 16], x: 1800, y: 1300, nm: { id: "old_saltjaw", lv: 17, chance: 0.12 } }
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

FAMILIES.spire_warden = Object.assign({}, FAMILIES.hollow_king, { name: "Spire Warden", color: "#ff7043", hpMul: 4.6, attMul: 1.4, defMul: 1.35, scale: 1.9, aura: "#ff7043", tpMove: { name: "Spire Collapse", mul: 2.3, aoe: 110 }, weak: { water: 1.35, light: 1.2 }, respawn: 900, loot: [["warden_blade", 0.3], ["spire_mantle", 0.3], ["hi_potion", 1], ["ether", 1], ["fire_crystal", 1]], gil: [80, 110] });
Object.assign(ITEMS, {
  warden_blade: { name: "Warden's Greatsword", kind: "equip", icon: "⚔️", rare: true, nm: true, rarity: "epic", slot: "main", wtype: "gsword", dmg: 46, delay: 4.0, jobs: ["RUN"], lv: 20, price: 0, stats: { vit: 4, str: 3, acc: 5, def: 6 } },
  spire_mantle: { name: "Spire Mantle", kind: "equip", icon: "🧣", rare: true, nm: true, rarity: "epic", slot: "back", jobs: ALL_JOBS, lv: 20, price: 0, stats: { hp: 30, mp: 30, str: 3, int: 3, mnd: 3, def: 5 }, desc: "Torn from the Spire Warden's shoulders. It smells of old smoke." }
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
NM_FAMILIES.lumicap_matron = { hint: "Glimmer Grotto, Underdeep · any time", base: "shroomling", name: "Lumicap Matron", hpMul: 3.0, attMul: 1.12, scale: 2.2, aura: "#80deea", loot: [["lumen_earring", 0.35], ["glowcap", 1], ["hi_potion", 0.5], ["ether", 0.5]], respawn: 420 };
Object.assign(ITEMS, {
  glowcap: { name: "Glowcap", kind: "mat", icon: "🍄", price: 60, stack: 12, desc: "A mushroom that glows a soft blue. Alchemists prize it." },
  glowfin: { name: "Glowfin", kind: "mat", icon: "🐟", price: 85, stack: 12, desc: "A pale fish from the Underdeep River. Its fins shine in the dark." },
  blind_eel: { name: "Blind Eel", kind: "mat", icon: "🐍", price: 120, stack: 12, desc: "A long white eel with no eyes. Strong-tasting and valuable." },
  lumen_earring: { name: "Lumen Earring", kind: "equip", icon: "💠", rare: true, nm: true, rarity: "epic", slot: "ear", jobs: ALL_JOBS, lv: 18, price: 0, stats: { mp: 20, int: 3, mnd: 3, res_dark: 10 }, desc: "A glowing cap-stone from the Lumicap Matron." }
});
for (const id of ["light_crystal", "dark_crystal"]) if (!ITEMS[id]) for (const f of ["lumicap", "deep_worm"]) FAMILIES[f].loot = FAMILIES[f].loot.filter(l => l[0] !== id);
ZONES.underdeep = {
  name: "Underdeep River", w: 3200, h: 1000, theme: "cave", glow: true,
  exits: [{ x: 0, y: 400, w: 24, h: 100, to: "verdant", tx: 2720, ty: 2180, label: "Verdant Jungle" }],
  npcs: [{ id: "boat_west", x: 1360, y: 560 }, { id: "boat_east", x: 1860, y: 560 }],
  walls: [{ x: 1550, y: 0, w: 120, h: 1000 }, { x: 600, y: 120, w: 220, h: 140 }, { x: 2400, y: 150, w: 220, h: 160 }],
  spawns: [
    { fam: "glow_bat", lv: [16, 17], x: 500, y: 350 }, { fam: "pale_crab", lv: [16, 17], x: 900, y: 620 }, { fam: "lumicap", lv: [16, 18], x: 1150, y: 300 },
    { fam: "glow_bat", lv: [18, 19], x: 2100, y: 350 }, { fam: "deep_worm", lv: [18, 20], x: 2500, y: 600 }, { fam: "lumicap", lv: [18, 19], x: 2900, y: 300, nm: { id: "lumicap_matron", lv: 21, chance: 0.12 } }
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
NM_FAMILIES.thunderhoof = { hint: "Stormgrass Flats, Windreach Highlands · day", base: "longneck", name: "Thunderhoof", hpMul: 2.8, attMul: 1.15, scale: 1.6, aura: "#ffee58", loot: [["windrunner_boots", 0.35], ["wool_tuft", 1], ["wind_crystal", 1], ["hi_potion", 0.4]], respawn: 420 };
Object.assign(ITEMS, {
  windrunner_boots: { name: "Windrunner Boots", kind: "equip", icon: "👢", rare: true, nm: true, rarity: "epic", slot: "feet", jobs: ALL_JOBS, lv: 13, price: 0, stats: { def: 5, agi: 3, eva: 4, hp: 15 }, desc: "Soled with Thunderhoof's hide. The grass barely bends under them." },
  nomad_sash: { name: "Nomad Sash", kind: "equip", icon: "🪢", rare: true, slot: "waist", jobs: ALL_JOBS, lv: 12, price: 0, stats: { hp: 20, str: 2, agi: 2 }, desc: "Woven by the Windreach nomads for those they trust." },
  nomad_cloak: { name: "Nomad Cloak", kind: "equip", icon: "🧣", rare: true, slot: "back", jobs: ALL_JOBS, lv: 11, price: 0, stats: { def: 4, hp: 15, mp: 15, eva: 2 }, desc: "A felted wool cloak that keeps out the highland wind." }
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
    { fam: "wind_wasp", lv: [11, 12], x: 1500, y: 900, time: "day" }, { fam: "wind_wasp", lv: [12, 13], x: 2400, y: 600, time: "day" },
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

NM_FAMILIES.gloamhorn = { hint: "Eastern Windreach Highlands · night", base: "longneck", name: "Gloamhorn", hpMul: 2.9, attMul: 1.15, scale: 1.7, aura: "#7e57c2", loot: [["gloam_ring", 0.35], ["wool_tuft", 1], ["dark_crystal_dummy", 0], ["hi_potion", 0.4]], respawn: 420 };
NM_FAMILIES.gloamhorn.loot = NM_FAMILIES.gloamhorn.loot.filter(l => l[1] > 0);
NM_FAMILIES.sandglass_wisp = { hint: "The Mirage (sandstorms only) · any time", base: "bomb", name: "Sandglass Wisp", hpMul: 2.8, attMul: 1.2, scale: 1.6, aura: "#ffd54f", loot: [["mirage_veil", 0.35], ["fire_crystal", 1], ["earth_crystal", 1], ["hi_potion", 0.5]], respawn: 300 };
Object.assign(ITEMS, {
  gloam_ring: { name: "Gloam Ring", kind: "equip", icon: "💍", rare: true, nm: true, rarity: "epic", slot: "ring", jobs: ALL_JOBS, lv: 15, price: 0, stats: { mp: 20, int: 3, eva: 4 }, desc: "Darker than the night it was found in." },
  mirage_veil: { name: "Mirage Veil", kind: "equip", icon: "🧣", rare: true, nm: true, rarity: "epic", slot: "back", jobs: ALL_JOBS, lv: 19, price: 0, stats: { eva: 8, agi: 4, hp: 20 }, desc: "It shimmers at the edges, as if it isn't quite there." },
  nightglass_earring: { name: "Nightglass Earring", kind: "equip", icon: "🔮", rarity: "rare", slot: "ear", jobs: ALL_JOBS, lv: 14, price: 12000, stats: { eva: 4, agi: 2, mp: 10 }, desc: "Sold only under the moon." },
  moon_tonic: { name: "Moon Tonic", kind: "use", icon: "🧪", price: 900, stack: 12, heal: 250, desc: "Restores 250 HP. Brewed by moonlight." }
});
ZONES.mirage = {
  name: "The Mirage", w: 1400, h: 1000, theme: "field", palette: "desert", mist: true,
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


const COMPANION_CFG = { dayMs: 86400000, wageRate: 1, bondSteps: [0, 20, 60, 130, 250, 420], bondBonus: 0.03, maxBond: 5 };

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
  birdfolk_priest: { type: "Beastman", lore: "Crag Talons who chant for the flock. Their shriek rattles everyone nearby." },
  sapling: { type: "Plantoid", lore: "Young treants that wander the woods on root-feet. Harmless until bothered, and terribly afraid of fire." },
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
  { name: "Embers Kept", lv: 19, reward: { xp: 0, gil: 5000, item: "ember_ring" }, steps: [
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

const AH_CATS = { materials: "Materials", consumables: "Consumables", weapons: "Weapons", armor: "Armor" };
const AH_CFG = { fee: 0.03, maxListings: 7, checkMs: 60000, expireMs: 3 * 3600000, tickMins: 360 };
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
  { id: "guild_ring", gp: 60, rank: 1 }, { id: "pathfinder_boots", gp: 120, rank: 2 }, { id: "chapel_sigil", gp: 40, rank: 2 },
  { id: "silver_insignia", gp: 220, rank: 3 }, { id: "guild_greatcoat", gp: 400, rank: 4 }, { id: "mythril_crest", gp: 600, rank: 5 }
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
  { id: "marsh", icon: "🐸", name: "Into the Mire", desc: "Set foot in the Ashen Marsh.", test: s => (s.discovered || []).includes("marsh") },
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
  { id: "harbor", icon: "⚓", name: "Sea Air", desc: "Reach Saltreach Harbor.", test: s => (s.discovered || []).includes("harbor") },
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
  { id: "frost", icon: "❄️", name: "Cold Feet", desc: "Set foot in Frostspire Pass.", test: s => (s.discovered || []).includes("frost") },
  { id: "rich", icon: "💠", name: "Well Off", desc: "Hold 5,000 crystals.", test: s => s.gil >= 5000 },
  { id: "ko", icon: "💀", name: "Lesson Learned", desc: "Be defeated once.", test: s => s.stats.kos >= 1 },
  { id: "jumps", icon: "🦘", name: "Spring in Your Step", desc: "Jump 100 times.", test: s => s.stats.jumps >= 100 }
];

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
  vela: ["spirit_torque", "silver_earring", "ember_earring", "wolf_mantle", "warriors_belt", "silk_sash", "tidesteel_sword", "boarding_axe", "coral_staff", "tidesteel_dagger", "shark_claws", "harbor_mail", "sailcloth_robe", "corsair_jerkin", "gull_hat", "steel_sword", "oak_staff", "chain_mail", "wizards_robe", "chapel_sigil", "frost_sword", "frost_greataxe", "glacier_staff", "rime_dagger", "frost_claws", "frost_bow", "frost_mail", "snowfur_coat", "frost_robe", "fur_hat", "rime_scythe", "troubadour_coat"]
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
};const RACE = (() => { const k = zsc(RACE_BASE.zone), r = Object.assign({}, RACE_BASE); r.start = { x: RACE_BASE.start.x * k, y: RACE_BASE.start.y * k }; r.checkpoints = RACE_BASE.checkpoints.map(c => Object.assign({}, c, { x: c.x * k, y: c.y * k })); r.limit = Math.round(RACE_BASE.limit * k); r.medals = RACE_BASE.medals.map(m => [m[0], Math.round(m[1] * k), m[2]]); return r; })();

const SHOP_NAMES = { pell: "Pell", marn: "Marn", vela: "Vela" };

const PETS = {
  ember: { name: "Ember Sprite", el: "fire", col: 0xff7043, eye: 0xfff176, pact: "Flame Burst", weak: "ice" },
  frost: { name: "Frost Sprite", el: "ice", col: 0x81d4fa, eye: 0xffffff, pact: "Frost Lance", weak: "fire" },
  stone: { name: "Stone Sprite", el: "earth", col: 0xbca27a, eye: 0xffe082, pact: "Rock Throw", weak: "wind" },
  gale: { name: "Gale Sprite", el: "wind", col: 0xaed581, eye: 0xf1f8e9, pact: "Cyclone", weak: "earth" }
};

const BATTLEFIELD = { zone: "depths", minutes: 15, rewards: ["tide_crown", "abyssal_staff", "drowned_blade", "priest_mantle", "tidebreaker_bow"], gil: 1500, xp: 3000 };

for (const id in SPELLS) {
  const sp = SPELLS[id], lv = Math.min(...Object.values(sp.jobs));
  sp.id = id; sp.minLv = lv;
  if (sp.blue) continue;
  const sid = "scroll_" + id;
  ITEMS[sid] = { name: "Scroll of " + sp.name, kind: "use", icon: "📜", spell: id, lv, price: Math.round(30 + lv * lv * 14), desc: "Read it to learn " + sp.name + ". Can be learned by " + Object.entries(sp.jobs).map(([j, l]) => j + " Lv." + l).join(", ") + "." };
  if (lv <= 10) SHOP.push(sid); else if (lv <= 17) SHOPS.vela.push(sid);
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
  for (const sp of order) if (!kept.includes(sp) && (sp.bf || exitDist(sp) >= exitR) && !kept.some(k => near(k, sp))) kept.push(sp);
  if (!kept.length) kept.push(order[0]);
  for (const sp of z.spawns) {
    if (kept.includes(sp)) continue;
    let best = null, bd = 1e12;
    for (const k of kept) { if (!!k.bf !== !!sp.bf || fixed(k)) continue; const d = Math.hypot(k.x - sp.x, k.y - sp.y); if (d < bd) { bd = d; best = k; } }
    if (!best) best = kept[0];
    (best.alts = best.alts || []).push({ fam: sp.fam, lv: sp.lv, time: sp.time, weather: sp.weather, nm: sp.nm, passive: sp.passive });
  }
  z.spawns = z.spawns.filter(sp => kept.includes(sp));
}
const POI_LORE = {
  hollow: "Before the Outpost there was the Fort, and before the Fort there was only the Hollow and the people who herded in it. They cut these words so their children would know the safe paths: keep to the old road, drink from the mirror lake, and never sleep where the goblins dig.",
  frost: "Here the first climbers turned back. Above this stone the air grows thin and the black rock bleeds cold. Whoever reads this: the summit is not empty. Something stands there and waits for the ash to fall.",
  marsh: "The chapel bell rang for a hundred years before the water took it. They say it still rings for those who drown in the mire. Count the tolls; if you hear thirteen, turn back."
};
const POI_IDS = [];
function poiSpot(z, cx, cy, rad) {
  const segD = (px, py, a) => { const dx = a[2] - a[0], dy = a[3] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t); };
  const ok = (x, y) => x > 160 && y > 160 && x < z.w - 160 && y < z.h - 160 && !(z.walls || []).some(q => x > q.x - 70 && x < q.x + q.w + 70 && y > q.y - 70 && y < q.y + q.h + 70) && !(z.water || []).some(w => Math.hypot(x - w.x, y - w.y) < w.r + 70) && !((z.ruins && z.ruins.walls) || []).some(a => segD(x, y, a) < 90) && !(z.spawns || []).some(sp => Math.hypot(sp.x - x, sp.y - y) < 110) && !(z.npcs || []).some(n => Math.hypot(n.x - x, n.y - y) < 140);
  for (let k = 0; k < 64; k++) { const a = k * 2.4, r = rad * (0.5 + (k % 8) / 8); const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); if (ok(x, y)) return { x, y }; }
  return null;
}
for (const zid of ["hollow", "frost", "marsh"]) {
  const z = ZONES[zid], L = z.landmarks || [];
  if (!L.length) continue;
  const pick = i => L[Math.min(L.length - 1, i)];
  const defs = [["lookout", "Lookout Tower", "lookout", "talkLookout", pick(0)], ["shrine", "Wayside Shrine", "shrine", "talkShrine", pick(2)], ["tablet", "Weathered Tablet", "tablet", "talkLore", pick(4)], ["cache", "Hidden Cache", "chest", "talkChest", pick(L.length - 1)]];
  for (const [k, name, prop, talk, lm] of defs) {
    const id = k + "_" + zid, at = poiSpot(z, lm.x, lm.y, (lm.r || 200) + 140);
    if (!at) continue;
    NPCS[id] = Object.assign({ name, prop, talk, poi: k }, prop === "chest" ? { chest: "vault" } : {});
    z.npcs.push({ id, x: at.x, y: at.y });
    if (k !== "cache") POI_IDS.push(id);
  }
}
ACHIEVEMENTS.push({ id: "wayfarer", icon: "🧭", name: "Wayfarer", desc: "Visit every lookout tower, wayside shrine and weathered tablet in the wilds.", test: s => POI_IDS.every(id => (s.poi || {})[id]) });
const CAMP_NAMES = { hollow: "Hollow Camp", frost: "Frostspire Camp", marsh: "Mire Camp" };
for (const zid of ["hollow", "frost", "marsh"]) {
  const z = ZONES[zid], L = z.landmarks || [], lm = L[Math.floor(L.length / 2)] || { x: z.w / 2, y: z.h / 2, r: 200 };
  const at = poiSpot(z, lm.x, lm.y, (lm.r || 200) + 260);
  if (!at) continue;
  const cid = "campcrystal_" + zid;
  NPCS[cid] = { name: CAMP_NAMES[zid] + " Crystal", model: "crystal", crystal: true, talk: "talkCrystal", camp: zid };
  z.npcs.push({ id: cid, x: at.x, y: at.y });
  NPCS["camp_" + zid] = { name: CAMP_NAMES[zid], prop: "camp", talk: "talkCamp", poi: "camp" };
  z.npcs.push({ id: "camp_" + zid, x: at.x + 90, y: at.y + 10 });
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
Object.assign(QUESTS, {
  sam: { name: "The Patient Blade", giver: "Tobin", npc: "tobin", lv: 12, items: { iron_ingot: 1, ash_lumber: 2 }, desc: "Bring Tobin 1 Iron Ingot and 2 Ash Lumber to learn the Samurai's way.", reward: { xp: 700, gil: 0, item: "bronze_tachi", qty: 1, unlock: "SAM" },
    intro: "A Samurai fights with one great blade held in both hands and a mind kept very still. They meditate in the middle of a fight to gather strength and read a foe's next blow before it lands. Bring me an iron ingot and good ash lumber, and we'll fit you a tachi.", progress: "1 Iron Ingot and 2 Ash Lumber. The smith and the carpenters' benches can make both.", turn: "Good steel, good wood. Hold the tachi high and breathe slowly; the blade will do the rest." },
  nin: { name: "Steps Without Sound", giver: "Tobin", npc: "tobin", lv: 12, items: { bat_wing: 3, worm_silk: 2 }, desc: "Bring Tobin 3 Bat Wings and 2 Worm Silk to learn the Ninja's arts.", reward: { xp: 700, gil: 0, item: "bronze_katana", qty: 1, unlock: "NIN" },
    intro: "A Ninja hides behind shadow images, throws stars of fire and frost, and slips away when the fight turns. Quick hands, quick feet. Bring me bat wings for the shadows and worm silk for the threads.", progress: "3 Bat Wings and 2 Worm Silk. Bats fly at night; worms dig through the Hollow.", turn: "Light, quiet and sharp. Take this katana, and remember: the shadows only take a few hits each." },
  drg: { name: "Wings of the Wyrm", giver: "Tobin", npc: "tobin", lv: 12, items: { lizard_skin: 3, crag_feather: 1 }, desc: "Bring Tobin 3 Lizard Skins and 1 Crag Feather to take up the Dragoon's lance.", reward: { xp: 700, gil: 0, item: "bronze_spear", qty: 1, unlock: "DRG" },
    intro: "Dragoons fight with the lance and the leap. They spring high into the air and come down point first, and the spirit of the old wyrms lends them strength. Bring me lizard skins for a grip and a feather from the Crag Talons for luck.", progress: "3 Lizard Skins from the Hollow's hill lizards and 1 Crag Feather from the marsh roost.", turn: "Scale and feather. Here is your spear. Jump high, land hard." }
});
SHOP.push("bronze_tachi", "iron_tachi", "steel_tachi", "bronze_katana", "iron_katana", "steel_katana", "bronze_spear", "iron_lance", "steel_halberd");
if (SHOPS.vela) SHOPS.vela.push("frost_tachi", "rime_katana", "frost_lance");
Object.assign(QUESTS, {
  bst: { name: "Call of the Wild", giver: "Tobin", npc: "tobin", lv: 14, items: { lizard_skin: 2, wool_tuft: 3 }, desc: "Bring Tobin 2 Lizard Skins and 3 Wool Tufts to learn the Beastmaster's ways.", reward: { xp: 800, gil: 0, item: "bronze_axe", qty: 1, unlock: "BST" },
    intro: "A Beastmaster never fights alone. They whistle up a beast of the wilds, feed it, and set it on their foes, then wade in after it with an axe. Bring me a lizard's skin and some sheep's wool for a beast's harness, and I'll teach you the call.", progress: "2 Lizard Skins and 3 Wool Tufts. The Hollow has both.", turn: "A good harness. Take this axe, and whistle; something will answer." },
  blu: { name: "The Borrowed Art", giver: "Tobin", npc: "tobin", lv: 14, items: { crab_shell: 2, mandrake_leaf: 2 }, desc: "Bring Tobin 2 Crab Shells and 2 Mandrake Leaves to begin the Blue Mage's study.", reward: { xp: 800, gil: 0, item: "iron_sword", qty: 1, unlock: "BLU" },
    intro: "A Blue Mage learns magic from monsters. Watch a beast use its special move up close and survive it, and you can learn to do the same. A dangerous way to study. Bring me crab shells and mandrake leaves and I'll open your eyes to it.", progress: "2 Crab Shells and 2 Mandrake Leaves. Crabs live by the water; mandrakes come out by day.", turn: "Now stand close when the monsters strike. As a Blue Mage, every move you see might become your own." },
  cor: { name: "Lady Luck", giver: "Tobin", npc: "tobin", lv: 14, items: { harbor_bream: 2, orc_tooth: 1 }, desc: "Bring Tobin 2 Harbor Bream and 1 Orc Tooth to roll with the Corsairs.", reward: { xp: 800, gil: 0, item: "iron_dagger", qty: 1, unlock: "COR" },
    intro: "Corsairs trust the dice. A good roll lifts the whole crew's blade or aim; a greedy one can bust. They carry daggers and a pistol for a quick shot. Bring me fresh bream from Saltreach and an orc's tooth for a lucky die, and I'll show you the game.", progress: "2 Harbor Bream from the Saltreach docks and 1 Orc Tooth from the marsh orcs.", turn: "Here's a dagger and a pair of dice. Roll well." }
});
SHOP.push("bronze_axe", "iron_axe", "steel_axe");
if (SHOPS.vela) SHOPS.vela.push("frost_axe");
Object.assign(QUESTS, {
  pup: { name: "Strings and Springs", giver: "Tobin", npc: "tobin", lv: 16, items: { ash_lumber: 3, bronze_ingot: 2 }, desc: "Bring Tobin 3 Ash Lumber and 2 Bronze Ingots to build your first automaton.", reward: { xp: 900, gil: 0, item: "leather_cesti", qty: 1, unlock: "PUP" },
    intro: "A Puppetmaster fights with fists and a friend made of wood and wire. The automaton takes blows and hits back while you weave in and out. I'll need good lumber for its frame and bronze for its springs.", progress: "3 Ash Lumber and 2 Bronze Ingots.", turn: "There. Wind the key, and it'll follow you anywhere. Mind you keep it in repair." },
  dnc: { name: "The First Step", giver: "Tobin", npc: "tobin", lv: 16, items: { silk_cloth: 2, honeycomb: 2 }, desc: "Bring Tobin 2 Silk Cloth and 2 Honeycombs to learn the Dancer's steps.", reward: { xp: 900, gil: 0, item: "iron_dagger", qty: 1, unlock: "DNC" },
    intro: "A Dancer turns the rhythm of battle into healing and openings. Steps throw a foe off balance, flourishes spend those openings, and waltzes mend your friends. Bring me silk for a costume and honey for the throat.", progress: "2 Silk Cloth and 2 Honeycombs.", turn: "Lovely. Feel the beat: every swing builds the energy you spend on a waltz." },
  sch: { name: "Ink and Insight", giver: "Tobin", npc: "tobin", lv: 16, items: { heartwood: 1, crypt_dust: 2 }, desc: "Bring Tobin 1 Heartwood and 2 Crypt Dust to begin a Scholar's studies.", reward: { xp: 900, gil: 0, item: "holly_staff", qty: 1, unlock: "SCH" },
    intro: "A Scholar studies both white and black magic, and leans into one at a time. Light Arts for healing, Dark Arts for destruction. Bring me heartwood for a quill case and crypt dust to mix the ink.", progress: "1 Heartwood (from the elder treants) and 2 Crypt Dust.", turn: "Your first grimoire. Read it twice; then read it again." }
});
Object.assign(QUESTS, {
  geo: { name: "The Shape of the Land", giver: "Tobin", npc: "tobin", lv: 18, items: { crag_feather: 2, frost_shard: 2 }, desc: "Bring Tobin 2 Crag Feathers and 2 Frost Shards to learn geomancy.", reward: { xp: 1000, gil: 0, item: "maple_wand", qty: 1, unlock: "GEO" },
    intro: "A Geomancer bends the land's own currents into auras that follow them, and plants a luopan to curse the ground under their foes. Bring me feathers from the high roost and shards of the pass's ice; they hold the currents well.", progress: "2 Crag Feathers and 2 Frost Shards.", turn: "Ring the bell and listen. The land will answer." },
  run: { name: "Carved in Steel", giver: "Tobin", npc: "tobin", lv: 18, items: { orc_tooth: 2, iron_ingot: 2 }, desc: "Bring Tobin 2 Orc Teeth and 2 Iron Ingots to become a Rune Fencer.", reward: { xp: 1000, gil: 0, item: "bronze_greatsword", qty: 1, unlock: "RUN" },
    intro: "A Rune Fencer carves runes into the air to turn blows aside, then hurls them at the enemy all at once. They wield the great sword and hold the line. Bring me iron for a blade and orc teeth to carve the first runes.", progress: "2 Orc Teeth and 2 Iron Ingots.", turn: "Hold the sword like a wall, and the runes like a promise." }
});
SHOP.push("bronze_greatsword", "iron_greatsword", "steel_greatsword");
if (SHOPS.vela) SHOPS.vela.push("frost_greatsword");
Object.assign(NPCS, {
  brisa: { name: "Brisa, Quartermaster", model: "brisa", talk: "talkBrisa" },
  haldor: { name: "Haldor, Mythrilsmith", model: "haldor", talk: "talkHaldor" },
  orla: { name: "Orla, Auction House", model: "orla", talk: "talkAuction" },
  crystal_ironvale: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  guard_ironvale: { name: "Ironvale Guard Bram", model: "guard", talk: "talkGuard" }
});
ACHIEVEMENTS.push({ id: "spire", icon: "🗼", name: "Top of the Spire", desc: "Defeat the Spire Warden at the summit of the Red Spire.", test: s => !!(s.nmKilled && s.nmKilled.spire_warden) });
WEATHER.highlands = [["clear", 5], ["wind", 4], ["cloudy", 3], ["rain", 1.5], ["storm", 1]];
SHOPS.essa = ["potion", "hi_potion", "ether", "herb_bread", "carp_stew", "bait", "fishing_rod"].filter(id => ITEMS[id]);
ACHIEVEMENTS.push({ id: "highlands", icon: "🐎", name: "Wide Open Sky", desc: "Set foot in the Windreach Highlands.", test: s => (s.discovered || []).includes("highlands") });
FISH.underdeep = [["glowfin", 8, 7], ["blind_eel", 14, 2], ["mud_eel", 0, 3]];
ACHIEVEMENTS.push({ id: "underdeep", icon: "🛶", name: "Down the River", desc: "Ride the boat across the Underdeep River.", test: s => !!(s.stats && s.stats.boatRides) });
WEATHER.gullisle = [["clear", 6], ["wind", 3], ["cloudy", 2], ["rain", 2], ["storm", 0.7]];
FISH.gullisle = [["sea_bass", 6, 7], ["harbor_bream", 0, 4], ["tidecaller_tuna", 14, 1.2]];
ACHIEVEMENTS.push({ id: "gullisle", icon: "🏝️", name: "Island Hopper", desc: "Take the ferry to Gull Isle.", test: s => (s.discovered || []).includes("gullisle") });
CONFIG.ferryCost = 100;
WEATHER.cinder = [["cloudy", 4], ["clear", 3], ["fog", 2], ["wind", 2], ["storm", 0.5]];
ACHIEVEMENTS.push({ id: "cinder", icon: "🌋", name: "Trial by Fire", desc: "Set foot on Cinder Peak.", test: s => (s.discovered || []).includes("cinder") });
WEATHER.verdant = [["rain", 5], ["cloudy", 3], ["fog", 2], ["clear", 2], ["storm", 1.2]];
ACHIEVEMENTS.push({ id: "verdant", icon: "🌴", name: "Into the Green", desc: "Set foot in the Verdant Jungle.", test: s => (s.discovered || []).includes("verdant") });
WEATHER.sunscar = [["clear", 6], ["wind", 2.5], ["sandstorm", 2], ["cloudy", 1], ["storm", 0.3]];
WEATHER.cinder.push(["sandstorm", 1]);
ZONES.sunscar.spawns.push({ fam: "dune_worm", lv: [20, 20], x: 1500, y: 1900, weather: "sandstorm" });
ZONES.frost.spawns.push({ fam: "ice_wight", lv: [19, 20], x: Math.round(2200 * zsc("frost")), y: Math.round(1400 * zsc("frost")), weather: "blizzard" });
ZONES.marsh.spawns.push({ fam: "drowned", lv: [15, 16], x: Math.round(1700 * zsc("marsh")), y: Math.round(1400 * zsc("marsh")), weather: "fog" });
ACHIEVEMENTS.push({ id: "sunscar", icon: "🏜️", name: "Sunburnt", desc: "Set foot in the Sunscar Desert.", test: s => (s.discovered || []).includes("sunscar") });
WEATHER.ironvale = [["clear", 4], ["snow", 3], ["cloudy", 3], ["wind", 1.5], ["fog", 0.8]];
const MYTHRIL_GEAR = [];
for (const id of Object.keys(ITEMS)) {
  const it = ITEMS[id];
  if (!id.startsWith("steel_") || it.slot !== "main") continue;
  const nid = "mythril_" + id.slice(6);
  if (ITEMS[nid]) continue;
  ITEMS[nid] = Object.assign({}, it, { name: "Mythril " + it.name.replace(/^Steel /, ""), dmg: Math.round(it.dmg * 1.45), lv: 19, price: Math.round(it.price * 4.5), stats: Object.assign({}, it.stats || {}, { acc: ((it.stats || {}).acc || 0) + 3, str: ((it.stats || {}).str || 0) + 2 }), jobs: it.jobs.slice() });
  MYTHRIL_GEAR.push(nid);
}
const scaleStats = (st, k) => { const o = {}; for (const key in st) o[key] = Math.round(st[key] * k); return o; };
Object.assign(ITEMS, {
  mythril_mail: Object.assign({}, ITEMS.chain_mail, { name: "Mythril Mail", lv: 18, price: 13500, stats: scaleStats(ITEMS.chain_mail.stats, 1.5), jobs: ITEMS.chain_mail.jobs.slice() }),
  mythril_helm: Object.assign({}, ITEMS.iron_helm, { name: "Mythril Helm", lv: 18, price: 8200, stats: scaleStats(ITEMS.iron_helm.stats, 1.6), jobs: ITEMS.iron_helm.jobs.slice() }),
  ironvale_robe: Object.assign({}, ITEMS.wizards_robe, { name: "Ironvale Robe", lv: 18, price: 12800, stats: scaleStats(ITEMS.wizards_robe.stats, 1.5), jobs: ITEMS.wizards_robe.jobs.slice() }),
  ironvale_ring: { name: "Ironvale Ring", kind: "equip", icon: "💍", slot: "ring", jobs: ALL_JOBS, lv: 18, price: 0, rare: true, stats: { hp: 30, vit: 3, def: 4 }, desc: "Brisa's thanks for clearing the pass." }
});
MYTHRIL_GEAR.push("mythril_mail", "mythril_helm", "ironvale_robe");
SHOPS.haldor = MYTHRIL_GEAR.concat(["iron_ingot", "potion", "hi_potion", "ether"].filter(id => ITEMS[id]));
Object.assign(QUESTS, {
  smokeline: { name: "Smoke on the Pass", giver: "Brisa", npc: "brisa", lv: 18, kill: { fam: "frost_stonechucker", n: 6, name: "Frost Stonechucker" }, desc: "Drive off 6 Frost Stonechuckers hurling rocks at Ironvale's ore carts in Frostspire Pass.", reward: { xp: 5000, gil: 2000, item: "ironvale_ring", qty: 1 },
    intro: "Ironvale lives on the ore that comes down the pass, and the orcs up there have taken to smashing our carts with boulders. Thin them out and you'll have Ironvale's thanks.", progress: "6 Frost Stonechuckers, up in Frostspire Pass.", turn: "The carts are rolling again. Wear this ring; every guard in Ironvale will know you for a friend." },
  orerun: { name: "The Ore Run", giver: "Brisa", npc: "brisa", lv: 17, items: { iron_ore: 4, frost_shard: 3 }, desc: "Bring Brisa 4 Iron Ore and 3 Frost Shards for Ironvale's forges.", reward: { xp: 3000, gil: 1600 },
    intro: "Haldor's forges eat ore faster than the carts can bring it. If you're heading out, dig some iron and pick up frost shards; the mythril won't temper without them.", progress: "4 Iron Ore and 3 Frost Shards.", turn: "That'll keep the fires lit for a week. Here's your pay." }
});
ACHIEVEMENTS.push({ id: "ironvale", icon: "⛰️", name: "Mountain Welcome", desc: "Reach the city of Ironvale.", test: s => (s.discovered || []).includes("ironvale") });
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
  jungle_sapling: { type: "Plantoid", lore: "Young treants of the jungle. They grow fast, climb faster, and strangle what they catch." },
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
Object.assign(NPCS, {
  ferry_harbor: { name: "Ferryman Coll", model: "ferryman", talk: "talkFerry", ferryTo: "gullisle" },
  ferry_isle: { name: "Ferryman Coll's Mate", model: "ferryman", talk: "talkFerry", ferryTo: "harbor" },
  wend: { name: "Old Wend", model: "wend", talk: "talkWend" }
});
Object.assign(QUESTS, {
  isle_supper: { name: "Supper for Wend", giver: "Old Wend", npc: "wend", lv: 10, items: { sea_bass: 3 }, desc: "Bring Old Wend 3 Sea Bass. His knees won't take him to the water any more.", reward: { xp: 1800, gil: 400, item: "gull_charm", qty: 1 },
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
  orcraid: { name: "Raiders on the Wind", giver: "Tarqa", npc: "tarqa", lv: 12, kill: { fam: "highland_orc", n: 6, name: "Highland Orc" }, desc: "Drive off 6 Highland Orcs who raid the nomads' herds from Eagle Ridge.", reward: { xp: 2400, gil: 900, item: "nomad_sash", qty: 1 },
    intro: "My people follow the herds across the whole of Windreach. The orcs up on Eagle Ridge have started taking our animals. Show them the plateau has teeth.", progress: "6 Highland Orcs, camped west of the Ridge.", turn: "The herds sleep easier. Wear this sash; any nomad will share a fire with you." },
  feltwork: { name: "Felt for Winter", giver: "Tarqa", npc: "tarqa", lv: 10, items: { wool_tuft: 4, lizard_skin: 2 }, desc: "Bring Tarqa 4 Wool Tufts and 2 Lizard Skins for the camp's winter cloaks.", reward: { xp: 1600, gil: 500, item: "nomad_cloak", qty: 1 },
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
  wilds: { name: "Across the Wilds", lv: 12, reward: { xp: 4000, gil: 2000, item: "trailblazer_boots" },
    intro: "The Guild wants a survey of the far roads. Go up through Frostspire Pass to the mountain city of Ironvale and see the Quartermaster there, then cross the Sunscar Desert to the bones the locals call Titan's Ribs. Come back and tell me what you saw.",
    steps: [
      { type: "zone", zone: "ironvale", text: "Reach the city of Ironvale, east of Frostspire Pass." },
      { type: "talk", npc: "brisa", text: "Speak with Brisa, Ironvale's quartermaster.", say: "From Ashenreach, are you? The Guild's maps of the south are years out of date. Take a look at the Ribs while you're down there; the dunes have moved." },
      { type: "visit", zone: "sunscar", lm: "ribs", text: "Find Titan's Ribs in the Sunscar Desert." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] },
  fire: { name: "Fire and Water", lv: 17, reward: { xp: 9000, gil: 4000, item: "explorers_ring" },
    intro: "A scholar is paying well for proof of two places most people think are legends: a lake of fire on Cinder Peak and a grotto that glows under the jungle. Old Wend out on Gull Isle swears he's seen both. Find them, then ask him.",
    steps: [
      { type: "visit", zone: "cinder", lm: "lake", text: "Stand at the Molten Lake on Cinder Peak." },
      { type: "kill", fam: "magma_worm", n: 4, text: "Defeat 4 Magma Worms (Cinder Peak)." },
      { type: "visit", zone: "underdeep", lm: "grotto", text: "Find the Glimmer Grotto in the Underdeep." },
      { type: "talk", npc: "wend", text: "Tell Old Wend on Gull Isle what you found.", say: "Ha! Told them, didn't I? Fire you can drink and caves full of stars. Go on back and tell your Guild the old man was right." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] },
  ends: { name: "The Ends of the Map", lv: 19, reward: { xp: 12000, gil: 6000, item: "pathfinder_mantle" },
    intro: "Last job I've got, and it's a big one. Three places at the very edges of every map we own: the Standing Stones on the Windreach plateau, the Overgrown Temple deep in the jungle, and the summit of the Red Spire. Bring back proof you stood in all three.",
    steps: [
      { type: "visit", zone: "highlands", lm: "stones", text: "Visit the Standing Stones in the Windreach Highlands." },
      { type: "visit", zone: "verdant", lm: "temple", text: "Reach the Overgrown Temple in the Verdant Jungle." },
      { type: "visit", zone: "spire_top", lm: "summit", text: "Climb to the Red Spire Summit." },
      { type: "talk", npc: "maera", text: "Return to Maera in Ashenreach Outpost.", final: true }
    ] }
};
Object.assign(ITEMS, {
  trailblazer_boots: { name: "Trailblazer Boots", kind: "equip", icon: "👢", rare: true, slot: "feet", jobs: ALL_JOBS, lv: 12, price: 0, stats: { def: 5, agi: 2, hp: 20 }, desc: "Guild-issue boots for those who've walked the far roads." },
  explorers_ring: { name: "Explorer's Ring", kind: "equip", icon: "💍", rare: true, slot: "ring", jobs: ALL_JOBS, lv: 17, price: 0, stats: { hp: 25, mp: 25, acc: 4, eva: 4 }, desc: "Engraved with a compass rose." },
  pathfinder_mantle: { name: "Pathfinder's Mantle", kind: "equip", icon: "🧣", rare: true, slot: "back", jobs: ALL_JOBS, lv: 19, price: 0, stats: { def: 6, hp: 30, str: 2, int: 2, agi: 2 }, desc: "Given only to those who have stood at the edges of every map." }
});
ACHIEVEMENTS.push({ id: "expeditions", icon: "🗺️", name: "Far Traveller", desc: "Complete every Guild expedition.", test: s => s.expDone && Object.keys(EXPEDITIONS).every(k => s.expDone[k]) });
ACHIEVEMENTS.push({ id: "atlas", icon: "🧭", name: "Cartographer", desc: "Set foot in every area on the world atlas.", test: s => ["highlands", "outpost", "hollow", "den", "crypt", "depths", "marsh", "verdant", "underdeep", "harbor", "gullisle", "frost", "ironvale", "sunscar", "cinder", "spire1"].every(z => (s.discovered || []).includes(z)) });
Object.assign(NPCS, {
  luna: { name: "Luna, Moonlit Peddler", model: "luna", talk: "talkLuna", only: "night" },
  mirage_shimmer: { name: "Shimmering Air", prop: "mirage", talk: "talkMirage", only: "sandstorm", poi: "mirage" },
  cache_mirage: { name: "Mirage Cache", prop: "chest", chest: "vault", talk: "talkChest" }
});
ZONES.sunscar.npcs.push({ id: "mirage_shimmer", x: 400, y: 1460 });
SHOPS.luna = ["moon_tonic", "nightglass_earring", "ether", "hi_potion"];
BESTIARY.gloamhorn = { type: "Beast", lore: "A longneck with a coat like dusk. It only grazes after the sun goes down." };
BESTIARY.sandglass_wisp = { type: "Elemental", lore: "A spark of sand and heat that lives inside the mirage. When the storm passes, so does it." };
ACHIEVEMENTS.push({ id: "mirage", icon: "🏜️", name: "Seen Through", desc: "Step into the Mirage during a sandstorm.", test: s => (s.discovered || []).includes("mirage") });
