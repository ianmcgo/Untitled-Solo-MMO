const CONFIG = {
  levelCap: 20,
  bowRange: 230,
  foodMinutes: 30,
  poolTime: 45,
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

const BUFF_NAMES = { blessing: "City Blessing", last_resort: "Last Resort", soulfire: "Soulfire", blood_blade: "Blood Blade", encore: "Encore", minuet: "Minuet", paeon: "Paeon", ballad: "Ballad", madrigal: "Madrigal", march: "March", blight: "Blight", sleep: "Asleep", stun: "Stunned", warcry: "Warcry", sharpshot: "Sharpshot", barrage: "Barrage", bind: "Bound", food: "Well Fed", sneak_attack: "Sneak Attack", flee: "Flee", boost: "Boost", focus: "Focus", berserk: "Berserk", divine_seal: "Divine Seal", elemental_seal: "Elemental Seal", dia: "Dia", sentinel: "Sentinel", flash: "Flash", slow: "Slow", paralyze: "Paralyze", protect: "Protect" };
const BUFF_ICONS = { blessing: "🏰", last_resort: "🩸", soulfire: "🔥", blood_blade: "🗡️", encore: "🎶", minuet: "🎵", paeon: "💚", ballad: "💧", madrigal: "🎯", march: "🥁", blight: "☠️", sleep: "💤", stun: "💫", warcry: "📣", sharpshot: "🎯", barrage: "🏹", bind: "⛓️", food: "🍲", sneak_attack: "🗡️", flee: "💨", boost: "👊", focus: "🎯", berserk: "💢", divine_seal: "✚", elemental_seal: "✦", dia: "☀", sentinel: "🛡️", flash: "✨", slow: "🐌", paralyze: "⚡", protect: "🔰" };

const SPELLS = {
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
  ether_hq: { name: "Ether +1", kind: "use", icon: "💧", hq: true, mpRestore: 55, price: 140, stack: 12, desc: "Restores 55 MP." },
  fire_crystal: { name: "Fire Essence", kind: "crystal", icon: "🔥", element: "fire", price: 30, stack: 12, desc: "Used in Smithing synthesis." },
  wind_crystal: { name: "Wind Essence", kind: "crystal", icon: "🌪️", element: "wind", price: 30, stack: 12, desc: "Used in Woodworking synthesis." },
  earth_crystal: { name: "Earth Essence", kind: "crystal", icon: "🪨", element: "earth", price: 30, stack: 12, desc: "Used in Clothcraft synthesis." },
  water_crystal: { name: "Water Essence", kind: "crystal", icon: "🌊", element: "water", price: 30, stack: 12, desc: "Used in Alchemy synthesis." },
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
  croaker_charm: { name: "Croaker Charm", kind: "equip", icon: "🐸", slot: "ring", jobs: ALL_J, lv: 12, rare: true, nm: true, stats: { hp: 30, vit: 3, def: 3 }, desc: "Carved from the Old Croaker's throat stone." },
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

const SHOP = ["bronze_scythe", "iron_scythe", "steel_scythe", "shadow_plate", "minstrel_coat", "potion", "ether", "pickaxe", "hatchet", "sickle", "fire_crystal", "wind_crystal", "earth_crystal", "water_crystal", "copper_ore", "ash_log", "healing_herb", "bronze_sword", "ash_club", "ash_staff", "leather_vest", "linen_robe", "leather_gloves", "leather_trousers", "leather_boots", "maple_wand", "cotton_robe", "scale_mail", "kite_shield", "scarlet_tabard", "iron_sword", "holly_staff", "steel_sword", "steel_greataxe", "oak_staff", "oak_club", "chain_mail", "wizards_robe", "iron_helm", "wool_hat", "bronze_dagger", "iron_dagger", "steel_dagger", "leather_cesti", "iron_knuckles", "steel_claws", "brigand_vest", "training_gi", "fishing_rod", "bait", "grain_flour", "rock_salt", "shortbow", "yew_bow", "steel_longbow", "hunters_coat", "sprite_staff", "evoker_robe"];
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
  bat: { name: "Cave Bat", color: "#6d5a8a", radius: 11, hpMul: 0.7, attMul: 0.9, defMul: 0.8, eva: 10, delay: 2.4, speed: 125, aggro: { sound: 110 }, link: false, tpMove: { name: "Wing Slap", mul: 1.9 }, weak: { ice: 1.25 }, loot: [["egg_batling", 0.004], ["bat_wing", 0.4], ["wind_crystal", 0.3], ["ether", 0.05]], model: "bat" },
  worm: { name: "Tunnel Worm", color: "#b8866a", radius: 14, hpMul: 1.2, attMul: 0.85, defMul: 1.1, delay: 3.4, speed: 55, int: 4, aggro: { magic: 130, sound: 90 }, link: false, tpMove: { name: "Sand Spit", mul: 1.5, aoe: 60 }, weak: { wind: 1.25 }, loot: [["egg_wormlet", 0.004], ["worm_silk", 0.35], ["earth_crystal", 0.3], ["healing_herb", 0.25], ["ether", 0.06]], model: "worm" },
  ghoul: { name: "Ghoul", color: "#9fbfa0", radius: 15, hpMul: 1.1, attMul: 1.1, defMul: 1.0, delay: 3.0, speed: 85, aggro: { sound: 120, lowhp: 200 }, link: true, tpMove: { name: "Vampiric Claw", mul: 1.8, drain: true }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.3], ["ether", 0.08], ["hi_potion", 0.05]], model: "ghoul" },
  den_goblin: { name: "Goblin Raider", color: "#6f7f45", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 165 }, link: true, linkGroup: "goblin", tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["fire_crystal", 0.3], ["iron_ore", 0.15], ["ash_log", 0.2], ["hi_potion", 0.05]], gil: [3, 6], model: "goblin" },
  skeleton: { name: "Wandering Bones", color: "#e8e2cf", radius: 15, hpMul: 1.0, attMul: 1.05, defMul: 1.1, delay: 3.0, speed: 80, aggro: { sound: 120, lowhp: 180 }, link: true, tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.35], ["water_crystal", 0.25], ["ether", 0.06]], model: "skeleton" },
  hare: { name: "Meadow Hare", color: "#c8a27a", radius: 11, hpMul: 0.6, attMul: 0.8, defMul: 0.8, eva: 6, delay: 2.6, speed: 115, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["egg_meadow_kit", 0.004], ["healing_herb", 0.35], ["earth_crystal", 0.2], ["potion", 0.06]], model: "hare" },
  crypt_sentinel: { name: "Crypt Sentinel", color: "#80cbc4", radius: 17, hpMul: 3.0, attMul: 1.25, defMul: 1.3, delay: 3.2, speed: 85, aggro: { sight: 170, sound: 150 }, link: true, linkGroup: "undead", tpMove: { name: "Grave Sweep", mul: 1.7, aoe: 80 }, weak: { light: 1.5, fire: 1.2 }, nm: true, scale: 1.5, aura: "#80cbc4", respawn: 600, loot: [["crypt_key", 1], ["bone_chip", 1], ["ether", 0.6], ["sentinel_greaves", 0.3]], gil: [20, 30], model: "skeleton" },
  royal_guard: { name: "Royal Guard", color: "#c0c8d8", radius: 15, hpMul: 1.1, attMul: 1.15, defMul: 1.1, delay: 3.0, speed: 95, aggro: null, link: true, linkGroup: "undead", tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.5], ["water_crystal", 0.3]], model: "skeleton", summoned: true },
  hollow_king: { name: "Hollow King", color: "#ffd54f", radius: 20, hpMul: 3.8, attMul: 1.3, defMul: 1.25, delay: 3.4, speed: 90, aggro: { sight: 200 }, link: false, tpMove: { name: "Sovereign's Wrath", mul: 2.1, aoe: 100 }, weak: { light: 1.4, fire: 1.15 }, nm: true, boss: true, scale: 1.75, aura: "#ffd54f", respawn: 600, loot: [["hollow_crown", 0.3], ["kings_blade", 0.3], ["bone_chip", 1], ["hi_potion", 0.8], ["ether", 0.8]], gil: [60, 80], model: "skeleton", phases: [0.66, 0.33], enrage: 0.2 },
  bog_toad: { name: "Bog Toad", color: "#5f7a3a", radius: 14, hpMul: 1.15, attMul: 1.0, defMul: 1.0, delay: 3.0, speed: 90, aggro: { sound: 120 }, link: false, tpMove: { name: "Tongue Lash", mul: 1.8 }, weak: { ice: 1.25 }, loot: [["toad_oil", 0.45], ["water_crystal", 0.3], ["healing_herb", 0.2], ["hi_potion", 0.05]], gil: [6, 10], model: "toad" },
  bog_leech: { name: "Bog Leech", color: "#5a2a2a", radius: 13, hpMul: 1.1, attMul: 0.95, defMul: 1.1, delay: 3.2, speed: 60, int: 4, aggro: { magic: 140, lowhp: 170 }, link: false, tpMove: { name: "Blood Drain", mul: 1.6, drain: true }, weak: { fire: 1.3 }, loot: [["worm_silk", 0.3], ["water_crystal", 0.3], ["ether", 0.08]], model: "worm", tint: 0x4a2226 },
  mire_goblin: { name: "Mire Goblin", color: "#58663a", radius: 15, hpMul: 1.05, attMul: 1.05, defMul: 1.05, delay: 3.0, speed: 95, aggro: { sight: 175 }, link: true, linkGroup: "mire", tpMove: { name: "Bog Bomb", mul: 1.7, aoe: 75 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.25], ["mire_reed", 0.3], ["fire_crystal", 0.2], ["hi_potion", 0.06]], gil: [8, 14], model: "goblin" },
  drowned: { name: "Drowned One", color: "#6f9a9a", radius: 15, hpMul: 1.2, attMul: 1.1, defMul: 1.05, delay: 3.0, speed: 85, aggro: { sound: 130, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Sodden Grasp", mul: 1.9, drain: true }, weak: { light: 1.5, lightning: 1.2 }, loot: [["chapel_sigil", 0.12], ["bone_chip", 0.35], ["water_crystal", 0.35], ["ether", 0.1], ["hi_potion", 0.06]], model: "ghoul" },
  marsh_hare: { name: "Reed Hare", color: "#8a7a5a", radius: 11, hpMul: 0.7, attMul: 0.85, defMul: 0.85, eva: 8, delay: 2.6, speed: 120, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["healing_herb", 0.4], ["mire_reed", 0.2], ["potion", 0.08]], model: "hare", tint: 0x8a7a5a },
  tide_priest: { name: "Tidebound Priest", color: "#4dd0e1", radius: 20, hpMul: 3.2, attMul: 1.1, defMul: 1.2, delay: 3.6, speed: 80, int: 6, aggro: { sight: 240, sound: 220 }, link: false, tpMove: { name: "Drowning Tide", mul: 1.6, aoe: 110 }, weak: { lightning: 1.4, light: 1.3 }, nm: true, boss: true, scale: 1.6, aura: "#4dd0e1", respawn: 30, phases: [0.65], adds: "drowned", addsText: "calls the drowned up from the water!", enrage: 0.2, pulse: { at: 0.5, every: 22, dmg: 4, r: 170, name: "Maelstrom", el: "water" }, loot: [], gil: [40, 60], model: "ghoul" },
  snow_hare: { name: "Snow Hare", color: "#e8eef2", radius: 11, hpMul: 0.75, attMul: 0.85, defMul: 0.85, eva: 10, delay: 2.6, speed: 125, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { fire: 1.2 }, loot: [["healing_herb", 0.4], ["wind_crystal", 0.2], ["potion", 0.1]], model: "hare", tint: 0xeef2f6 },
  ice_bat: { name: "Ice Bat", color: "#9fd8ff", radius: 11, hpMul: 0.85, attMul: 1.0, defMul: 0.9, eva: 12, delay: 2.4, speed: 130, aggro: { sound: 130 }, link: true, linkGroup: "icebat", tpMove: { name: "Frost Wing", mul: 1.9 }, weak: { fire: 1.3 }, loot: [["egg_frost_wisp", 0.005], ["bat_wing", 0.4], ["frost_shard", 0.25], ["ether", 0.08]], model: "bat", tint: 0x8ab8d8 },
  frost_goblin: { name: "Frost Goblin", color: "#9aa8a0", radius: 15, hpMul: 1.15, attMul: 1.1, defMul: 1.1, delay: 3.0, speed: 95, aggro: { sight: 185 }, link: true, linkGroup: "frostgob", tpMove: { name: "Ice Bomb", mul: 1.8, aoe: 80 }, weak: { fire: 1.3 }, loot: [["goblin_pouch", 0.3], ["iron_ore", 0.3], ["frost_shard", 0.3], ["hi_potion", 0.08]], gil: [10, 16], model: "goblin" },
  ice_wight: { name: "Ice Wight", color: "#b8e0f0", radius: 15, hpMul: 1.25, attMul: 1.15, defMul: 1.15, delay: 3.1, speed: 85, aggro: { sound: 140, lowhp: 220 }, link: true, linkGroup: "undead", tpMove: { name: "Rime Grasp", mul: 2.0, drain: true }, weak: { fire: 1.4, light: 1.4 }, loot: [["bone_chip", 0.35], ["frost_shard", 0.35], ["ether", 0.1]], model: "skeleton" },
  glacier_worm: { name: "Glacier Worm", color: "#cfe8f2", radius: 15, hpMul: 1.35, attMul: 1.0, defMul: 1.2, delay: 3.4, speed: 60, int: 5, aggro: { magic: 150 }, link: false, tpMove: { name: "Hail Spit", mul: 1.7, aoe: 70 }, weak: { fire: 1.35 }, loot: [["worm_silk", 0.35], ["frost_shard", 0.25], ["water_crystal", 0.3]], model: "worm", tint: 0xc8e4f0 },
  chieftain: { name: "Goblin Chieftain", color: "#7d8a3a", radius: 20, hpMul: 1.8, attMul: 1.0, defMul: 1.0, delay: 3.2, speed: 100, aggro: { sight: 170 }, link: true, linkGroup: "goblin", tpMove: { name: "Goblin Rush", mul: 0.7, hits: 3 }, weak: { ice: 1.2 }, nm: true, respawn: 180, loot: [["chieftain_cap", 0.3], ["goblin_totem", 0.3], ["raider_helm", 0.25], ["iron_sword", 0.2], ["goblin_pouch", 1], ["ether", 0.5], ["iron_ore", 0.8]], gil: [30, 40], model: "chieftain" }
};

const NM_FAMILIES = {
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
      { id: "garrick", x: 690, y: 640, home: 2, sleep: [22, 6.5] }, { id: "trade_board", x: 640, y: 300 }, { id: "maera", x: 455, y: 255, home: 4, sleep: [22.5, 6.5] }, { id: "corvin", x: 430, y: 430 }, { id: "guard_east", x: 985, y: 345 }
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
    exits: [{ x: 176, y: 296, w: 48, h: 24, to: "outpost", tx: 288, ty: 420, label: "Outpost", kind: "door" }],
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
      { x: 1550, y: 2176, w: 100, h: 24, to: "marsh", tx: 1400, ty: 95, label: "Ashen Marsh" }
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
      { fam: "honey_bee", lv: [1, 2], x: 300, y: 1050, time: "day" }, { fam: "honey_bee", lv: [1, 2], x: 340, y: 1080, time: "day" }, { fam: "grass_crawler", lv: [1, 3], x: 520, y: 1600 }, { fam: "grass_crawler", lv: [2, 3], x: 470, y: 1650 }, { fam: "grass_crawler", lv: [2, 4], x: 900, y: 1500 },
      { fam: "meadow_sheep", lv: [1, 2], x: 250, y: 1400, time: "day" }, { fam: "meadow_sheep", lv: [1, 3], x: 300, y: 1450, time: "day" }, { fam: "mandrake", lv: [2, 3], x: 650, y: 1000, time: "day" }, { fam: "mandrake", lv: [2, 4], x: 700, y: 1040, time: "day" },
      { fam: "hill_lizard", lv: [4, 5], x: 1500, y: 1500 }, { fam: "hill_lizard", lv: [4, 6], x: 1850, y: 1100 }, { fam: "pond_crab", lv: [3, 5], x: 1150, y: 850 }, { fam: "pond_crab", lv: [4, 5], x: 1950, y: 1620 },
      { fam: "shroomling", lv: [4, 6], x: 2050, y: 1900 }, { fam: "shroomling", lv: [5, 6], x: 2150, y: 1950, time: "night" }, { fam: "lake_snapper", lv: [3, 5], x: 1120, y: 500 }, { fam: "honey_bee", lv: [3, 4], x: 1050, y: 1250, time: "day" }, { fam: "grass_crawler", lv: [4, 5], x: 1600, y: 1750 },
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
      { w: 30, pts: [[2500, 1160], [2650, 1450]] },
      { w: 32, pts: [[1420, 1850], [1600, 2200], [1600, 2700]] }
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
  npcs: [
    { id: "ilsa", x: 700, y: 330, home: 4, sleep: [22, 6] }, { id: "marn", x: 480, y: 600, home: 2, sleep: [20.5, 4.5] }, { id: "vela", x: 930, y: 600, home: 3, sleep: [21, 7] },
    { id: "crystal_harbor", x: 700, y: 460 }, { id: "trade_board", x: 860, y: 380 }, { id: "selene", x: 560, y: 420 }, { id: "guard_north", x: 530, y: 80 }, { id: "guard_pass", x: 1330, y: 340 }
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
  exits: [{ x: 0, y: 1150, w: 24, h: 100, to: "harbor", tx: 1330, ty: 430, label: "Saltreach Harbor" }],
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
  exits: [{ x: 1350, y: 0, w: 100, h: 24, to: "hollow", tx: 1600, ty: 2110, label: "Rocky Hollow" }, { x: 2200, y: 2376, w: 100, h: 24, to: "harbor", tx: 500, ty: 95, label: "Saltreach Harbor" }],
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
    { w: 34, pts: [[1250, 650], [1700, 750], [2150, 800], [2500, 750]] },
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
for (const id in ZONES) if (ZONES[id].spawns.length) spreadSpawns(ZONES[id], id === "hollow" ? 170 : 120);


const COMPANION_CFG = { dayMs: 3456000, wageRate: 0.15, bondSteps: [0, 20, 60, 130, 250, 420], bondBonus: 0.03, maxBond: 5 };

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
  bat: { type: "Vermin", lore: "Leathery wings and keen ears. They hunt by sound, so slow footsteps are your friend in the dark." },
  worm: { type: "Amorphous", lore: "Burrowers that feel the hum of magic through the soil. They spit grit that stings the eyes." },
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
  ice_bat: { type: "Vermin", lore: "Pale bats that roost in the ice caves. They hunt in packs and hear everything." },
  frost_goblin: { type: "Beastman", lore: "Goblins in thick fur who raid the ice caravans. They see a long way across the snow." },
  ice_wight: { type: "Undead", lore: "Frozen dead from the old cairns. Fire and light melt them; the cold makes them patient." },
  glacier_worm: { type: "Amorphous", lore: "Huge white worms that tunnel through packed snow and sense the warmth of magic." },
  ashen_herald: { type: "Undead", lore: "A herald of the old Ember Throne, wrapped in ash that burns without heat. It speaks of a king who will return." },
  rimefang: { type: "Beastman", lore: "The frost goblins' war leader, an axe-swinging brute who wears a wolf pelt over his armour." },
  frost_wight: { type: "Undead", lore: "A wight lord who walks the cairns at night, wrapped in a shroud of frozen mist." },
  bog_toad: { type: "Amphibian", lore: "Bloated marsh toads that hunt by sound. Their oil keeps leather supple and smells for days." },
  bog_leech: { type: "Amorphous", lore: "Fat leeches that taste magic and blood in the water. Fire makes them let go." },
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
const BUDDY_PERK_TEXT_OLD = { xp: v => "+" + Math.round(v * 100) + "% experience", rest: v => "Resting heals " + Math.round(v * 100) + "% faster", eva: v => "+" + v + " evasion", gather: v => "+" + Math.round(v * 100) + "% gathering chance", craft: v => "+" + Math.round(v * 100) + "% synthesis chance", mp: v => "+" + Math.round(v * 100) + "% MP", fish: v => "+" + Math.round(v * 100) + "% catch rate", sell: v => "Shops pay " + Math.round(v * 100) + "% more", drop: v => "+" + Math.round(v * 100) + "% drop chance" };
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
  { id: "crafter", icon: "⚒️", name: "Artisan", desc: "Complete 10 syntheses.", test: s => s.stats.crafts >= 10 },
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
  blizzard: { name: "Blizzard", icon: "❄️", el: "ice" }
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
  vela: ["tidesteel_sword", "boarding_axe", "coral_staff", "tidesteel_dagger", "shark_claws", "harbor_mail", "sailcloth_robe", "corsair_jerkin", "gull_hat", "steel_sword", "oak_staff", "chain_mail", "wizards_robe", "chapel_sigil", "frost_sword", "frost_greataxe", "glacier_staff", "rime_dagger", "frost_claws", "frost_bow", "frost_mail", "snowfur_coat", "frost_robe", "fur_hat", "rime_scythe", "troubadour_coat"]
};
const MOUNT_COATS = {
  teal: { name: "Marsh Teal", main: 0x3f6f6a, dark: 0x2a4a48, glow: 0x6ff0e8, price: 0 },
  crimson: { name: "Ember Crimson", main: 0x7a2a24, dark: 0x4a1a16, glow: 0xffb040, price: 800 },
  sable: { name: "Night Sable", main: 0x2a2a34, dark: 0x18181e, glow: 0xb070ff, price: 1200 },
  gold: { name: "Dune Gold", main: 0xb08a3a, dark: 0x6a5224, glow: 0xfff0a0, price: 1500 },
  ivory: { name: "Frost Ivory", main: 0xd8d8e0, dark: 0x9a9aa8, glow: 0x80d8ff, price: 2000 }
};
const SADDLE_PRICE = 2500, SADDLE_BONUS = 1.15;
const RACE = {
  zone: "hollow", start: { x: 120, y: 1100 },
  checkpoints: [{ x: 800, y: 1010, name: "the old road" }, { x: 1450, y: 1880, name: "Burrow Flats" }, { x: 2515, y: 680, name: "the Old Fort" }, { x: 2650, y: 1440, name: "the Goblin Camp" }, { x: 3000, y: 1080, name: "the Eastern Gate" }],
  radius: 90, limit: 75, medals: [["gold", 26, 1200], ["silver", 36, 600], ["bronze", 50, 300]]
};
const SHOP_NAMES = { pell: "Pell", marn: "Marn", vela: "Vela" };

const PETS = {
  ember: { name: "Ember Sprite", el: "fire", col: 0xff7043, eye: 0xfff176, pact: "Flame Burst", weak: "ice" },
  frost: { name: "Frost Sprite", el: "ice", col: 0x81d4fa, eye: 0xffffff, pact: "Frost Lance", weak: "fire" },
  stone: { name: "Stone Sprite", el: "earth", col: 0xbca27a, eye: 0xffe082, pact: "Rock Throw", weak: "wind" },
  gale: { name: "Gale Sprite", el: "wind", col: 0xaed581, eye: 0xf1f8e9, pact: "Cyclone", weak: "earth" }
};

const BATTLEFIELD = { zone: "depths", minutes: 15, rewards: ["tide_crown", "abyssal_staff", "drowned_blade", "priest_mantle", "tidebreaker_bow"], gil: 1500, xp: 3000 };
