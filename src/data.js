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
  xpTable: [0, 150, 330, 540, 780, 1050, 1350, 1680, 2040, 2430],
  respawn: 30,
  leash: 520,
  linkRange: 150,
  inventorySize: 30,
  storageBase: 20,
  itemRecast: 3,
  deathXpLossPct: 0.1,
  regenDelay: 3,
  regenHp: 0.03,
  regenMp: 0.04,
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
const ALL_JOBS = ["WAR", "WHM", "BLM"];

const JOBS = {
  WAR: { name: "Warrior", color: "#e57373", icon: "⚔️", hp: [70, 14], mp: [0, 0], str: [9, 0.9], dex: [8, 0.8], vit: [9, 0.8], agi: [7, 0.7], int: [6, 0.5], mnd: [6, 0.5] },
  WHM: { name: "White Mage", color: "#eeeeee", icon: "✚", hp: [52, 10], mp: [22, 7], str: [7, 0.6], dex: [7, 0.6], vit: [7, 0.7], agi: [7, 0.6], int: [7, 0.7], mnd: [10, 1.0] },
  BLM: { name: "Black Mage", color: "#9575cd", icon: "✦", hp: [46, 9], mp: [26, 8], str: [6, 0.5], dex: [7, 0.6], vit: [6, 0.5], agi: [7, 0.7], int: [10, 1.0], mnd: [7, 0.6] }
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
  elemental_seal: { name: "Elemental Seal", job: "BLM", lv: 3, recast: 60, target: "self", buff: "elemental_seal", dur: 60, desc: "Your next nuke deals 50% more damage." }
};

const BUFF_NAMES = { berserk: "Berserk", divine_seal: "Divine Seal", elemental_seal: "Elemental Seal", dia: "Dia" };
const BUFF_ICONS = { berserk: "💢", divine_seal: "✚", elemental_seal: "✦", dia: "☀" };

const SPELLS = {
  cure: { name: "Cure", jobs: { WHM: 1 }, mp: 8, cast: 2.0, recast: 5, kind: "heal", power: 22, mnd: 1.0, target: "ally", desc: "Restores HP." },
  cure2: { name: "Cure II", jobs: { WHM: 6 }, mp: 22, cast: 2.25, recast: 6, kind: "heal", power: 60, mnd: 1.5, target: "ally", desc: "Restores a lot of HP." },
  dia: { name: "Dia", jobs: { WHM: 1 }, mp: 6, cast: 1.0, recast: 6, kind: "dot", element: "light", power: 5, target: "enemy", desc: "Light damage over time and lowers defense." },
  banish: { name: "Banish", jobs: { WHM: 4 }, mp: 12, cast: 1.5, recast: 10, kind: "nuke", element: "light", power: 22, stat: "mnd", target: "enemy", desc: "Light damage. Strong against undead." },
  stone: { name: "Stone", jobs: { BLM: 1 }, mp: 4, cast: 1.0, recast: 5, kind: "nuke", element: "earth", power: 12, stat: "int", target: "enemy", desc: "Earth damage." },
  water: { name: "Water", jobs: { BLM: 3 }, mp: 5, cast: 1.25, recast: 5, kind: "nuke", element: "water", power: 15, stat: "int", target: "enemy", desc: "Water damage." },
  aero: { name: "Aero", jobs: { BLM: 5 }, mp: 6, cast: 1.5, recast: 6, kind: "nuke", element: "wind", power: 19, stat: "int", target: "enemy", desc: "Wind damage." },
  fire: { name: "Fire", jobs: { BLM: 6 }, mp: 8, cast: 1.75, recast: 6, kind: "nuke", element: "fire", power: 24, stat: "int", target: "enemy", desc: "Fire damage." },
  blizzard: { name: "Blizzard", jobs: { BLM: 8 }, mp: 10, cast: 2.0, recast: 7, kind: "nuke", element: "ice", power: 30, stat: "int", target: "enemy", desc: "Ice damage." },
  thunder: { name: "Thunder", jobs: { BLM: 10 }, mp: 12, cast: 2.25, recast: 8, kind: "nuke", element: "lightning", power: 37, stat: "int", target: "enemy", desc: "Lightning damage." }
};

const SKILL_NAMES = { sword: "Sword", club: "Club", staff: "Staff", greataxe: "Great Axe", h2h: "Hand-to-Hand", healing: "Healing Magic", divine: "Divine Magic", elemental: "Elemental Magic" };
const COMBAT_SKILLS = ["sword", "club", "staff", "greataxe", "h2h"];
const MAGIC_SKILLS = ["healing", "divine", "elemental"];
const SKILL_RATINGS = {
  WAR: { sword: "B", club: "B", staff: "B", greataxe: "A", h2h: "D" },
  WHM: { club: "B", staff: "C", h2h: "E", healing: "B", divine: "C" },
  BLM: { club: "D", staff: "C", h2h: "E", elemental: "B" }
};
const RATING_CAP = { A: [3, 5.5], B: [3, 5], C: [2, 4.5], D: [2, 4], E: [1, 3.5] };
const SPELL_SKILL = { heal: "healing", dot: "divine", nuke: null };

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
  bronze_sword: { name: "Bronze Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 6, delay: 2.4, jobs: ["WAR"], lv: 1, price: 80 },
  bronze_sword_hq: { name: "Bronze Sword +1", kind: "equip", icon: "🗡️", hq: true, slot: "main", wtype: "sword", dmg: 7, delay: 2.4, jobs: ["WAR"], lv: 1, price: 200, stats: { acc: 2 } },
  iron_sword: { name: "Iron Sword", kind: "equip", icon: "🗡️", slot: "main", wtype: "sword", dmg: 10, delay: 2.4, jobs: ["WAR"], lv: 6, price: 900 },
  iron_sword_hq: { name: "Iron Sword +1", kind: "equip", icon: "🗡️", hq: true, slot: "main", wtype: "sword", dmg: 11, delay: 2.4, jobs: ["WAR"], lv: 6, price: 1800, stats: { acc: 3, att: 3 } },
  ash_club: { name: "Ash Club", kind: "equip", icon: "🏏", slot: "main", wtype: "club", dmg: 5, delay: 2.6, jobs: ["WAR", "WHM"], lv: 1, price: 60 },
  maple_wand: { name: "Maple Wand", kind: "equip", icon: "🪄", slot: "main", wtype: "club", dmg: 8, delay: 2.6, jobs: ["WHM", "BLM"], lv: 5, price: 700, stats: { mnd: 2, int: 1 } },
  ash_staff: { name: "Ash Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 7, delay: 3.4, jobs: ALL_J, lv: 1, price: 70 },
  ash_staff_hq: { name: "Ash Staff +1", kind: "equip", icon: "🦯", hq: true, slot: "main", wtype: "staff", dmg: 8, delay: 3.4, jobs: ALL_J, lv: 1, price: 180, stats: { int: 1, mnd: 1 } },
  holly_staff: { name: "Holly Staff", kind: "equip", icon: "🦯", slot: "main", wtype: "staff", dmg: 11, delay: 3.6, jobs: ALL_J, lv: 6, price: 950, stats: { int: 2, mnd: 2, mp: 8 } },
  bronze_greataxe: { name: "Bronze Greataxe", kind: "equip", icon: "🪓", slot: "main", wtype: "greataxe", dmg: 14, delay: 4.0, jobs: ["WAR"], lv: 1, price: 150 },
  bronze_cap: { name: "Bronze Cap", kind: "equip", icon: "⛑️", slot: "head", jobs: ALL_J, lv: 1, price: 50, stats: { def: 2 } },
  bronze_cap_hq: { name: "Bronze Cap +1", kind: "equip", icon: "⛑️", hq: true, slot: "head", jobs: ALL_J, lv: 1, price: 130, stats: { def: 3, hp: 5 } },
  chieftain_cap: { name: "Chieftain's Cap", kind: "equip", icon: "👑", slot: "head", jobs: ALL_J, lv: 5, price: 2000, stats: { def: 4, hp: 10, str: 2, dex: 2, int: 2, mnd: 2 } },
  leather_vest: { name: "Leather Vest", kind: "equip", icon: "🦺", slot: "body", jobs: ALL_J, lv: 1, price: 120, stats: { def: 4, hp: 6 } },
  scale_mail: { name: "Scale Mail", kind: "equip", icon: "🛡️", slot: "body", jobs: ["WAR"], lv: 5, price: 1100, stats: { def: 9, hp: 15 } },
  linen_robe: { name: "Linen Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM"], lv: 1, price: 110, stats: { def: 3, mp: 10 } },
  linen_robe_hq: { name: "Linen Robe +1", kind: "equip", icon: "👘", hq: true, slot: "body", jobs: ["WHM", "BLM"], lv: 1, price: 260, stats: { def: 4, mp: 15 } },
  cotton_robe: { name: "Cotton Robe", kind: "equip", icon: "👘", slot: "body", jobs: ["WHM", "BLM"], lv: 5, price: 1000, stats: { def: 6, mp: 18, int: 1, mnd: 1 } },
  leather_gloves: { name: "Leather Gloves", kind: "equip", icon: "🧤", slot: "hands", jobs: ALL_J, lv: 2, price: 90, stats: { def: 2, dex: 1 } },
  leather_trousers: { name: "Leather Trousers", kind: "equip", icon: "👖", slot: "legs", jobs: ALL_J, lv: 2, price: 110, stats: { def: 3 } },
  leather_boots: { name: "Leather Boots", kind: "equip", icon: "🥾", slot: "feet", jobs: ALL_J, lv: 3, price: 100, stats: { def: 2, agi: 1 } },
  captains_ring: { name: "Captain's Ring", kind: "equip", icon: "💍", slot: "ring", jobs: ALL_J, lv: 1, price: 0, stats: { hp: 12, mp: 12, acc: 5, att: 5 } },
  raiders_ring: { name: "Raider's Ring", kind: "equip", icon: "💍", rare: true, slot: "ring", jobs: ALL_J, lv: 4, price: 0, stats: { str: 2, acc: 4, att: 4 } },
  duskwing_boots: { name: "Duskwing Boots", kind: "equip", icon: "🥾", rare: true, slot: "feet", jobs: ALL_J, lv: 4, price: 0, stats: { def: 3, agi: 3, eva: 4 } },
  silkworm_gloves: { name: "Silkworm Gloves", kind: "equip", icon: "🧤", rare: true, slot: "hands", jobs: ["WHM", "BLM"], lv: 4, price: 0, stats: { def: 2, int: 2, mnd: 2, mp: 10 } },
  wardens_robe: { name: "Warden's Robe", kind: "equip", icon: "👘", rare: true, slot: "body", jobs: ["WHM", "BLM"], lv: 8, price: 0, stats: { def: 8, mp: 25, int: 3, mnd: 3 } },
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
  goblin_totem: { name: "Goblin Totem", kind: "furniture", icon: "🗿", fp: [1, 1], price: 0, model: "totem", desc: "Trophy from the Goblin Chieftain." }
};

const SHOP = ["potion", "ether", "pickaxe", "hatchet", "sickle", "fire_crystal", "wind_crystal", "earth_crystal", "water_crystal", "copper_ore", "ash_log", "healing_herb", "bronze_sword", "ash_club", "ash_staff", "leather_vest", "linen_robe", "leather_gloves", "leather_trousers", "leather_boots", "maple_wand", "cotton_robe", "scale_mail", "iron_sword", "holly_staff"];
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
  dorn: { name: "Dorn", job: "PLD", role: "tank", fee: 260, color: "#90caf9", requires: { job: "PLD" }, desc: "A stalwart Paladin. Flash, Provoke and self-Cures keep him standing." },
  lisette: { name: "Lisette", job: "RDM", role: "hybrid", fee: 260, color: "#f48fb1", requires: { job: "RDM" }, desc: "A quick Red Mage. Melee, Dia, nukes and backup Cures." },
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

const FEATURES = { crafting: false, gathering: false, residence: false, nms: false, water: true, mounts: false };

const FAMILIES = {
  goblin: { name: "Goblin", color: "#8a9a5b", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 140 }, link: true, tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.55], ["fire_crystal", 0.3], ["copper_ore", 0.25], ["potion", 0.1], ["bronze_cap", 0.04]], gil: [3, 6], model: "goblin" },
  bat: { name: "Cave Bat", color: "#6d5a8a", radius: 11, hpMul: 0.7, attMul: 0.9, defMul: 0.8, eva: 10, delay: 2.4, speed: 125, aggro: { sound: 110 }, link: false, tpMove: { name: "Wing Slap", mul: 1.9 }, weak: { ice: 1.25 }, loot: [["bat_wing", 0.6], ["wind_crystal", 0.35]], model: "bat" },
  worm: { name: "Tunnel Worm", color: "#b8866a", radius: 14, hpMul: 1.2, attMul: 0.85, defMul: 1.1, delay: 3.4, speed: 55, int: 4, aggro: { magic: 130 }, link: false, tpMove: { name: "Sand Spit", mul: 1.5, aoe: 60 }, weak: { wind: 1.25 }, loot: [["worm_silk", 0.5], ["earth_crystal", 0.35], ["healing_herb", 0.3], ["ether", 0.05]], model: "worm" },
  ghoul: { name: "Ghoul", color: "#9fbfa0", radius: 15, hpMul: 1.1, attMul: 1.1, defMul: 1.0, delay: 3.0, speed: 85, aggro: { sound: 120, lowhp: 200 }, link: true, tpMove: { name: "Vampiric Claw", mul: 1.8, drain: true }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.5], ["water_crystal", 0.35], ["ether", 0.1]], model: "ghoul" },
  den_goblin: { name: "Goblin Raider", color: "#6f7f45", radius: 15, hpMul: 1, attMul: 1, defMul: 1, delay: 3.0, speed: 95, aggro: { sight: 140 }, link: true, linkGroup: "goblin", tpMove: { name: "Bomb Toss", mul: 1.6, aoe: 70 }, weak: { ice: 1.2 }, loot: [["goblin_pouch", 0.4], ["fire_crystal", 0.3], ["iron_ore", 0.25], ["ash_log", 0.2]], gil: [3, 6], model: "goblin" },
  skeleton: { name: "Wandering Bones", color: "#e8e2cf", radius: 15, hpMul: 1.0, attMul: 1.05, defMul: 1.1, delay: 3.0, speed: 80, aggro: { sound: 120, lowhp: 180 }, link: true, tpMove: { name: "Bone Crunch", mul: 1.8 }, weak: { light: 1.5, fire: 1.2 }, loot: [["bone_chip", 0.45], ["water_crystal", 0.25]], model: "skeleton" },
  hare: { name: "Meadow Hare", color: "#c8a27a", radius: 11, hpMul: 0.6, attMul: 0.8, defMul: 0.8, eva: 6, delay: 2.6, speed: 115, aggro: null, link: false, tpMove: { name: "Hind Kick", mul: 1.6 }, weak: { ice: 1.1 }, loot: [["healing_herb", 0.35], ["earth_crystal", 0.2]], model: "hare" },
  chieftain: { name: "Goblin Chieftain", color: "#7d8a3a", radius: 20, hpMul: 1.8, attMul: 1.0, defMul: 1.0, delay: 3.2, speed: 100, aggro: { sight: 170 }, link: true, linkGroup: "goblin", tpMove: { name: "Goblin Rush", mul: 0.7, hits: 3 }, weak: { ice: 1.2 }, nm: true, respawn: 180, loot: [["chieftain_cap", 0.6], ["goblin_totem", 0.5], ["goblin_pouch", 1], ["ether", 0.5], ["iron_ore", 0.8]], gil: [30, 40], model: "chieftain" }
};

const NM_FAMILIES = {
  grimtooth: { base: "goblin", name: "Grimtooth", hpMul: 2.4, attMul: 1.15, defMul: 1.1, scale: 1.3, aura: "#ff5252", loot: [["raiders_ring", 0.6], ["goblin_pouch", 1], ["fire_crystal", 1]], gil: [12, 16], respawn: 300 },
  duskwing: { base: "bat", name: "Duskwing", hpMul: 2.2, attMul: 1.1, eva: 18, scale: 1.6, aura: "#b388ff", loot: [["duskwing_boots", 0.6], ["bat_wing", 1], ["wind_crystal", 1]], respawn: 300 },
  king_wiggles: { base: "worm", name: "King Wiggles", hpMul: 2.6, attMul: 1.05, scale: 1.5, aura: "#ffd54f", loot: [["silkworm_gloves", 0.6], ["worm_silk", 1], ["earth_crystal", 1]], respawn: 300 },
  ossuary_warden: { base: "ghoul", name: "Ossuary Warden", hpMul: 2.3, attMul: 1.15, scale: 1.35, aura: "#69f0ae", loot: [["wardens_robe", 0.6], ["bone_chip", 1], ["water_crystal", 1]], respawn: 360 }
};

const DAY_NAMES = ["Emberday", "Stoneday", "Tideday", "Galeday", "Frostday", "Stormday", "Dawnday", "Duskday"];
const DAY_ELEMENTS = ["fire", "earth", "water", "wind", "ice", "lightning", "light", "dark"];

const ZONES = {
  outpost: {
    name: "Ashenreach Outpost", w: 1100, h: 800, safe: true, theme: "town",
    exits: [
      { x: 1076, y: 350, w: 24, h: 100, to: "hollow", tx: 120, ty: 500, label: "Rocky Hollow" }
    ],
    npcs: [
      { id: "rhea", x: 560, y: 210 }, { id: "tobin", x: 840, y: 250 }, { id: "pell", x: 380, y: 520 },
      { id: "brann", x: 780, y: 560 }, { id: "crystal_town", x: 560, y: 420 }, { id: "ysolde", x: 890, y: 500 }
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
    stalls: [{ x: 380, y: 560, color: "#b5651d" }, { x: 780, y: 600, color: "#7b1fa2" }],
    lamps: [[470, 330], [650, 330], [470, 510], [650, 510]],
    stable: { x: 970, y: 500, rot: -Math.PI / 2 },
    start: { x: 610, y: 440 }
  },
  residence: {
    name: "Your Residence", w: 400, h: 320, safe: true, theme: "house", indoor: true,
    exits: [{ x: 176, y: 296, w: 48, h: 24, to: "outpost", tx: 190, ty: 250, label: "Outpost", kind: "door" }],
    npcs: [{ id: "pip", x: 60, y: 60 }],
    spawns: [],
    start: { x: 200, y: 250 },
    grid: { cols: 10, rows: 8, blocked: [[0, 0], [1, 0], [0, 1], [1, 1], [4, 7], [5, 7], [4, 6], [5, 6]] }
  },
  hollow: {
    name: "Rocky Hollow", w: 1600, h: 1000, theme: "field",
    exits: [
      { x: 0, y: 450, w: 24, h: 100, to: "outpost", tx: 990, ty: 400, label: "Outpost" },
      { x: 1576, y: 450, w: 24, h: 100, to: "den", tx: 120, ty: 450, label: "Goblin Den" }
    ],
    npcs: [{ id: "crystal_hollow", x: 1460, y: 560 }],
    spawns: [
      { fam: "goblin", lv: [2, 3], x: 700, y: 330 }, { fam: "goblin", lv: [2, 3], x: 750, y: 370 }, { fam: "goblin", lv: [1, 2], x: 380, y: 260 },
      { fam: "goblin", lv: [3, 4], x: 900, y: 720 }, { fam: "goblin", lv: [3, 4], x: 950, y: 690 },
      { fam: "goblin", lv: [5, 5], x: 1350, y: 760, nm: { id: "grimtooth", lv: 6, chance: 0.15 } },
      { fam: "bat", lv: [1, 2], x: 700, y: 230, time: "night" }, { fam: "bat", lv: [2, 3], x: 1180, y: 380, time: "night", nm: { id: "duskwing", lv: 6, chance: 0.12 } }, { fam: "bat", lv: [1, 1], x: 320, y: 820, time: "night" },
      { fam: "skeleton", lv: [4, 5], x: 1050, y: 250, time: "night" }, { fam: "skeleton", lv: [4, 5], x: 1300, y: 860, time: "night" },
      { fam: "hare", lv: [1, 2], x: 300, y: 600, time: "day" }, { fam: "hare", lv: [1, 2], x: 640, y: 240, time: "day" }, { fam: "hare", lv: [2, 3], x: 1200, y: 760, time: "day" },
      { fam: "worm", lv: [1, 2], x: 600, y: 640 }, { fam: "worm", lv: [2, 3], x: 1100, y: 860, nm: { id: "king_wiggles", lv: 5, chance: 0.15, time: "day" } }, { fam: "worm", lv: [1, 2], x: 1380, y: 200 }
    ],
    water: [{ x: 800, y: 440, r: 110 }, { x: 1180, y: 600, r: 55 }],
    paths: [{ w: 46, pts: [[-500, 500], [0, 500], [300, 520], [560, 640], [800, 645], [1000, 700], [1250, 700], [1420, 560], [1600, 500], [2100, 500]] }],
    gather: {
      mining: { n: 2, at: [[300, 150], [1000, 140], [1500, 880], [200, 940], [1250, 930]], loot: [["copper_ore", 0.6], ["iron_ore", 0.08], ["fire_crystal", 0.1], ["earth_crystal", 0.1]] },
      logging: { n: 2, at: [[140, 300], [560, 880], [1500, 300], [880, 100], [1300, 420]], loot: [["ash_log", 0.75], ["wind_crystal", 0.15]] },
      harvesting: { n: 2, at: [[250, 650], [650, 420], [1050, 520], [1450, 640], [380, 520]], loot: [["healing_herb", 0.7], ["worm_silk", 0.1], ["water_crystal", 0.12]] }
    },
    start: { x: 70, y: 500 }
  },
  den: {
    name: "Goblin Den", w: 1400, h: 900, theme: "cave",
    exits: [{ x: 0, y: 400, w: 24, h: 100, to: "hollow", tx: 1480, ty: 500, label: "Rocky Hollow" }],
    npcs: [],
    spawns: [
      { fam: "den_goblin", lv: [6, 7], x: 400, y: 250 }, { fam: "den_goblin", lv: [6, 7], x: 440, y: 290 },
      { fam: "den_goblin", lv: [7, 8], x: 700, y: 620 }, { fam: "den_goblin", lv: [7, 8], x: 750, y: 660 }, { fam: "den_goblin", lv: [7, 8], x: 800, y: 610 },
      { fam: "bat", lv: [5, 6], x: 300, y: 700 }, { fam: "bat", lv: [5, 6], x: 620, y: 150 },
      { fam: "ghoul", lv: [7, 8], x: 1000, y: 230 }, { fam: "ghoul", lv: [7, 8], x: 1050, y: 290 }, { fam: "ghoul", lv: [8, 9], x: 1000, y: 720, nm: { id: "ossuary_warden", lv: 10, chance: 0.15 } },
      { fam: "chieftain", lv: [11, 11], x: 1260, y: 450 }
    ],
    water: [{ x: 600, y: 430, r: 80 }],
    paths: [{ w: 40, pts: [[-500, 450], [0, 450], [300, 560], [700, 590], [1000, 520], [1260, 450]] }],
    torches: [[200, 300], [200, 620], [520, 200], [820, 760], [1100, 420], [1200, 300], [1200, 620]],
    gather: {
      mining: { n: 3, at: [[200, 120], [520, 800], [900, 120], [1150, 820], [860, 460], [300, 450]], loot: [["iron_ore", 0.45], ["copper_ore", 0.3], ["fire_crystal", 0.15]] }
    },
    start: { x: 70, y: 450 }
  }
};

const NPCS = {
  rhea: { name: "Captain Rhea", model: "rhea", talk: "talkRhea" },
  tobin: { name: "Tobin, Job Master", model: "tobin", talk: "talkTobin" },
  pell: { name: "Pell, Merchant", model: "pell", talk: "talkPell" },
  odette: { name: "Odette, Furnishings", model: "odette", talk: "talkOdette" },
  brann: { name: "Brann, Mercenary Hall", model: "brann", talk: "talkBrann" },
  ysolde: { name: "Ysolde, Stablemaster", model: "ysolde", talk: "talkYsolde" },
  crystal_town: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  crystal_hollow: { name: "Home Point Crystal", model: "crystal", crystal: true, talk: "talkCrystal" },
  pip: { name: "Pip the Nubbin", model: "nubbin", talk: "talkPip" }
};

const QUESTS = {
  pouches: { name: "Pouches for the Captain", giver: "Captain Rhea", desc: "Bring Captain Rhea 3 Goblin Pouches. Goblins in Rocky Hollow carry them.", reward: { xp: 300, gil: 300, item: "captains_ring" } },
  support: { name: "A Second Calling", giver: "Tobin", desc: "Reach level 5, then bring Tobin 2 Bat Wings and 1 Worm Silk. Bats only come out at night.", reward: { xp: 300, gil: 0 } },
  riding: { name: "Riding License", giver: "Ysolde", desc: "Reach level 5, then bring Ysolde 300 gil and 3 Healing Herbs. Hares and worms in Rocky Hollow drop herbs.", reward: { xp: 200, gil: 0 } },
  chieftain: { name: "The Goblin Chieftain", giver: "Captain Rhea", desc: "Defeat the Goblin Chieftain at the back of the Goblin Den, then report to Captain Rhea.", reward: { xp: 900, gil: 1500, item: "ether", qty: 3 } }
};
