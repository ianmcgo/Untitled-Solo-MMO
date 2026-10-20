let AUDIO_DATA = null;
function audioData() {
  if (!AUDIO_DATA) { const el = document.getElementById("audioData"); try { AUDIO_DATA = el ? JSON.parse(el.textContent) : {}; } catch (e) { AUDIO_DATA = {}; } }
  return AUDIO_DATA;
}
const AUDIO_DEFAULTS = { master: 0.8, music: 0.55, sfx: 0.85, amb: 0.5, ui: 0.6, muted: false };
const AUDIO = {
  ctx: null, ready: false, fallback: false, raw: {}, buffers: {}, decoding: {}, bus: {}, settings: null,
  music: null, amb: null, lastAt: {}, voices: 0, combatUntil: 0, duckUntil: 0, wantMusic: null, wantAmb: null, html: {}
};
const SFX_FILES = {
  miss: "sfx_miss", slash: "sfx_hit_slash", blunt: "sfx_hit_blunt", crit: "sfx_hit_crit", defeat: "sfx_defeat", ko: "sfx_ko",
  levelup: "sfx_levelup", ws: "sfx_ws", skillchain: "sfx_skillchain", provoke: "sfx_provoke", buff: "sfx_buff", cast: "sfx_cast",
  interrupt: "sfx_interrupt", cure: "sfx_cure", fire: "sfx_fire", ice: "sfx_ice", earth: "sfx_earth", wind: "sfx_wind",
  water: "sfx_water", lightning: "sfx_lightning", light: "sfx_light", dark: "sfx_earth", burst: "sfx_magic_burst", potion: "sfx_potion",
  tpmove: "sfx_tp_move", tpready: "sfx_tp_ready", aggro: "sfx_aggro", zone: "sfx_zone", mount: "sfx_whistle", step: "sfx_step",
  hoof: "sfx_hoof", jump: "sfx_jump", quest: "sfx_quest", loot: "sfx_loot", equip: "sfx_equip", fanfare: "sfx_fanfare",
  xp: "ui_xp", unlock: "ui_unlock", error: "ui_error", notify: "ui_notify", coin: "ui_coin", click: "ui_click", select: "ui_select",
  tab: "ui_tab", open: "ui_open", close: "ui_close", toast: "ui_toast"
};
const SFX_GAIN = { step_grass: 0.45, step_stone: 0.4, step_wood: 0.45, step_snow: 0.45, step_sand: 0.4, swing_light: 0.7, swing_heavy: 0.75, swing_claw: 0.6, drip: 0.5, step: 0.35, hoof: 0.5, miss: 0.6, slash: 0.8, blunt: 0.8, xp: 0.5, click: 0.7, select: 0.7, tab: 0.6, toast: 0.6, aggro: 0.7, cast: 0.7, fanfare: 0.9, levelup: 0.9 };
const UI_SOUNDS = new Set(["xp", "unlock", "error", "notify", "coin", "click", "select", "tab", "open", "close", "toast", "equip", "loot", "quest", "cursor", "tell", "pchat", "target", "page", "buy"]);
const MUSIC_FOR = { town: "music_outpost", house: "music_residence", field: "music_hollow", cave: "music_den", crypt: "music_crypt" };
const MUSIC_MOOD = {
  music_outpost: { night: "music_outpost_night", rain: "music_outpost_rain", storm: "music_outpost_rain", snow: "music_outpost_snow", blizzard: "music_outpost_snow" },
  music_hollow: { night: "music_hollow_night", rain: "music_hollow_rain", storm: "music_hollow_storm", snow: "music_hollow_snow", blizzard: "music_hollow_snow", fog: "music_hollow_fog" },
  music_residence: { night: "music_residence_night", rain: "music_residence_rain", storm: "music_residence_rain" }
};
function areaMusic(theme) {
  const base = MUSIC_FOR[theme], tbl = base && MUSIC_MOOD[base];
  if (!tbl) return base || null;
  const wx = typeof weatherNow === "function" ? weatherNow() : null;
  return (wx && tbl[wx]) || (isNight() && tbl.night) || base;
}

function loadAudioSettings() {
  try { return Object.assign({}, AUDIO_DEFAULTS, JSON.parse(localStorage.getItem("ashenreach_audio_v1") || "{}")); } catch (e) { return Object.assign({}, AUDIO_DEFAULTS); }
}
function saveAudioSettings() { try { localStorage.setItem("ashenreach_audio_v1", JSON.stringify(AUDIO.settings)); } catch (e) {} }

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function initAudio() {
  AUDIO.settings = loadAudioSettings();
  const unlock = () => {
    startAudio();
    const c = AUDIO.ctx;
    if (c && c.state !== "running") { try { c.resume(); } catch (e) {} }
    if (c && !AUDIO.kicked) { AUDIO.kicked = true; try { const b = c.createBuffer(1, 1, 22050), src = c.createBufferSource(); src.buffer = b; src.connect(c.destination); src.start(0); } catch (e) {} }
  };
  for (const ev of ["pointerdown", "keydown", "touchend"]) window.addEventListener(ev, unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!AUDIO.ctx) return;
    if (document.hidden) AUDIO.ctx.suspend && AUDIO.ctx.suspend(); else AUDIO.ctx.resume && AUDIO.ctx.resume();
  });
}

function startAudio() {
  if (AUDIO.ready) { if (AUDIO.ctx && AUDIO.ctx.state === "suspended") AUDIO.ctx.resume(); return; }
  AUDIO.ready = true;
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { AUDIO.fallback = true; return; }
  const ctx = new AC();
  AUDIO.ctx = ctx;
  const g = () => ctx.createGain();
  const b = AUDIO.bus;
  b.master = g(); b.master.connect(ctx.destination);
  b.music = g(); b.music.connect(b.master);
  b.duck = g(); b.duck.connect(b.music);
  b.sfx = g(); b.sfx.connect(b.master);
  b.amb = g(); b.amb.connect(b.master);
  b.ui = g(); b.ui.connect(b.master);
  applyVolumes();
  if (ctx.state === "suspended") ctx.resume();
  for (const k in SFX_FILES) decodeClip(SFX_FILES[k]);
}

function applyVolumes() {
  const s = AUDIO.settings;
  if (AUDIO.fallback) { for (const k in AUDIO.html) AUDIO.html[k].forEach(a => { a.volume = s.muted ? 0 : s.master * (k.startsWith("music") ? s.music : k.startsWith("amb") ? s.amb : s.sfx); }); return; }
  if (!AUDIO.ctx) return;
  const t = AUDIO.ctx.currentTime;
  const set = (node, v) => { node.gain.cancelScheduledValues(t); node.gain.setTargetAtTime(v, t, 0.05); };
  set(AUDIO.bus.master, s.muted ? 0 : s.master);
  set(AUDIO.bus.music, s.music);
  set(AUDIO.bus.sfx, s.sfx);
  set(AUDIO.bus.amb, s.amb);
  set(AUDIO.bus.ui, s.ui);
}

function decodeClip(name) {
  if (AUDIO.buffers[name]) return Promise.resolve(AUDIO.buffers[name]);
  if (AUDIO.decoding[name]) return AUDIO.decoding[name];
  const b64 = audioData()[name];
  if (!b64 || !AUDIO.ctx) return Promise.resolve(null);
  const bytes = b64ToBytes(b64).buffer;
  const p = new Promise(res => {
    try {
      const r = AUDIO.ctx.decodeAudioData(bytes, buf => { AUDIO.buffers[name] = buf; res(buf); }, () => res(null));
      if (r && r.catch) r.catch(() => res(null));
    } catch (e) { res(null); }
  });
  AUDIO.decoding[name] = p;
  return p;
}

function loopBounds(name, buf) {
  const dur = (typeof AUDIO_LOOP !== "undefined" && AUDIO_LOOP[name]) || buf.duration;
  const d = buf.getChannelData(0);
  let lead = 0;
  const lim = Math.min(d.length, Math.floor(buf.sampleRate * 0.12));
  for (let i = 0; i < lim; i++) if (Math.abs(d[i]) > 0.0008) { lead = i; break; }
  const start = lead / buf.sampleRate;
  return { start, end: Math.min(buf.duration, start + dur), dur: Math.min(dur, buf.duration - start) };
}

function sfxGainFor(name, e) {
  let v = SFX_GAIN[name] || 1;
  let pan = 0;
  if (e && typeof player !== "undefined" && player && e !== player && e.x !== undefined) {
    const d = Math.hypot(e.x - player.x, e.y - player.y);
    v *= clamp(1 - (d - 160) / 700, 0, 1);
    if (typeof VIEW !== "undefined" && d > 20) {
      const a = Math.atan2(e.y - player.y, e.x - player.x) - VIEW.yaw;
      pan = clamp(Math.sin(a) * Math.min(1, d / 300), -0.8, 0.8);
    }
  }
  return { v, pan };
}

function victoryDef(v) {
  const d = [], B = 0.12;
  const N = { C3: 130.8, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392, A4: 440, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784, A5: 880, B5: 987.8, C6: 1046.5 };
  const lead = (f, at, dur, g) => { d.push(["brass", f, f, at, dur, g, 2800]); d.push(["brass", f * 2, f * 2, at, dur, g * 0.35, 3600]); d.push(["sine", f, f, at, dur * 0.9, g * 0.5]); };
  const chord = (fs, at, dur, g) => { for (const f of fs) d.push(["brass", f, f, at, dur, g, 1800]); };
  if (v === 2) {
    N.D5 = 587.3; N.Fs5 = 740; N.Fs4 = 370; N.D6 = 1174.7; N.E6 = 1318.5; N.A3 = 220; N.D3 = 146.8;
    lead(N.D5, 0, 0.14, 0.2); lead(N.Fs5, 0.14, 0.14, 0.2); lead(N.A5, 0.28, 0.14, 0.22); lead(N.D6, 0.42, 0.5, 0.28);
    chord([N.D4, N.Fs4, N.A4], 0.42, 0.5, 0.07); d.push(["brass", N.D3, N.D3, 0.42, 0.5, 0.12, 700]);
    lead(N.E5, 1.0, 0.14, 0.2); lead(N.G5, 1.14, 0.14, 0.2); lead(N.B5, 1.28, 0.14, 0.22); lead(N.E6, 1.42, 0.5, 0.28);
    chord([N.E4, N.G4, N.B4], 1.42, 0.5, 0.07); d.push(["brass", N.A3, N.A3, 1.42, 0.5, 0.12, 700]);
    lead(N.A5, 2.0, 0.2, 0.22); lead(N.D6, 2.2, 0.2, 0.24); lead(N.Fs5 * 2, 2.4, 1.6, 0.3);
    chord([N.D4, N.Fs4, N.A4, N.D5], 2.0, 1.9, 0.08); d.push(["brass", N.D3, N.D3, 2.0, 1.9, 0.14, 700]);
    d.push(["bell", N.D6 * 2, N.D6 * 2, 2.45, 1.3, 0.1]);
    return d;
  }
  if (v === 3) {
    N.Bb4 = 466.2; N.Bb5 = 932.3; N.G3 = 196; N.D6 = 1174.7; N.Eb5 = 622.3;
    lead(N.G5, 0, 0.3, 0.24); lead(N.G5, 0.3, 0.14, 0.2); lead(N.Bb5, 0.44, 0.5, 0.27);
    chord([N.G4, N.Bb4, N.D5], 0, 0.95, 0.07); d.push(["brass", N.G3, N.G3, 0, 0.95, 0.12, 700]);
    lead(N.A5, 1.0, 0.3, 0.24); lead(N.A5, 1.3, 0.14, 0.2); lead(N.C6, 1.44, 0.5, 0.27);
    chord([N.F4, N.A4, N.C5], 1.0, 0.95, 0.07); d.push(["brass", N.C3, N.C3, 1.0, 0.95, 0.12, 700]);
    lead(N.G5, 2.0, 0.14, 0.22); lead(N.Bb5, 2.14, 0.14, 0.22); lead(N.D6, 2.28, 0.14, 0.24);
    lead(N.G5 * 2, 2.42, 1.6, 0.3); chord([N.G4, N.Bb4, N.D5, N.G4 * 2], 2.0, 2.0, 0.08); d.push(["brass", N.G3, N.G3, 2.0, 2.0, 0.14, 700]);
    d.push(["bell", N.G5 * 4, N.G5 * 4, 2.45, 1.3, 0.1]);
    return d;
  }
  lead(N.E5, 0, B, 0.2); lead(N.E5, B, B, 0.2); lead(N.E5, B * 2, B, 0.2); lead(N.G5, B * 3, 0.62, 0.26);
  chord([N.C4, N.E4, N.G4], B * 3, 0.62, 0.07); d.push(["brass", N.C3, N.C3, B * 3, 0.62, 0.12, 700]);
  lead(N.F5, 0.98, B, 0.2); lead(N.F5, 0.98 + B, B, 0.2); lead(N.F5, 0.98 + B * 2, B, 0.2); lead(N.A5, 0.98 + B * 3, 0.62, 0.26);
  chord([N.F4, N.A4, N.C5], 0.98 + B * 3, 0.62, 0.07); d.push(["brass", N.C3 * 0.8, N.C3 * 0.8, 0.98 + B * 3, 0.62, 0.12, 700]);
  lead(N.G5, 1.96, 0.16, 0.22); lead(N.A5, 2.12, 0.16, 0.22); lead(N.B5, 2.28, 0.16, 0.24);
  chord([N.G4, N.B4, N.D5], 1.96, 0.48, 0.07);
  lead(N.C6, 2.44, 1.5, 0.3); chord([N.C4, N.E4, N.G4, N.C5], 2.44, 1.5, 0.08); d.push(["brass", N.C3, N.C3, 2.44, 1.5, 0.14, 700]);
  d.push(["bell", N.C6 * 2, N.C6 * 2, 2.5, 1.3, 0.1]);
  return d;
}
const UI_SYNTH = {
  victory: victoryDef(1),
  victory2: victoryDef(2),
  victory3: victoryDef(3),
  cursor: [["sine", 2350, 2250, 0, 0.032, 0.32], ["square", 1175, 1175, 0, 0.018, 0.05]],
  tab: [["sine", 1975, 1865, 0, 0.04, 0.28], ["noise", 4200, 0, 0, 0.012, 0.1]],
  select: [["sine", 1568, 1568, 0, 0.16, 0.34], ["sine", 2349, 2349, 0.018, 0.2, 0.26], ["sine", 3136, 3136, 0.03, 0.12, 0.08]],
  click: [["sine", 1760, 1700, 0, 0.06, 0.3], ["triangle", 880, 880, 0, 0.05, 0.12]],
  close: [["triangle", 1175, 784, 0, 0.09, 0.32], ["sine", 1568, 1046, 0.01, 0.07, 0.12]],
  open: [["sine", 1046, 1046, 0, 0.06, 0.22], ["sine", 1318, 1318, 0.035, 0.06, 0.22], ["sine", 1760, 1760, 0.07, 0.12, 0.24], ["noise", 6000, 0, 0, 0.09, 0.03]],
  error: [["square", 196, 180, 0, 0.09, 0.16, 900], ["square", 185, 170, 0.11, 0.12, 0.16, 900]],
  notify: [["bell", 1318, 1318, 0, 0.5, 0.26], ["bell", 1760, 1760, 0.12, 0.6, 0.24]],
  tell: [["bell", 1568, 1568, 0, 0.45, 0.24], ["bell", 2093, 2093, 0.1, 0.5, 0.22], ["bell", 1568, 1568, 0.2, 0.6, 0.16]],
  pchat: [["bell", 1174, 1174, 0, 0.35, 0.18], ["bell", 1568, 1568, 0.08, 0.45, 0.16]],
  coin: [["bell", 2637, 2637, 0, 0.18, 0.2], ["bell", 3520, 3520, 0.06, 0.3, 0.2]],
  equip: [["noise", 3200, 0, 0, 0.06, 0.22], ["square", 660, 520, 0, 0.05, 0.08, 2400], ["bell", 1975, 1975, 0.02, 0.2, 0.12]],
  target: [["sine", 1760, 2200, 0, 0.05, 0.3], ["sine", 3520, 3520, 0.01, 0.05, 0.08]],
  page: [["noise", 2500, 0, 0, 0.09, 0.14], ["sine", 1318, 1480, 0.01, 0.05, 0.12]],
  buy: [["bell", 2093, 2093, 0, 0.16, 0.2], ["bell", 2637, 2637, 0.06, 0.16, 0.2], ["bell", 3136, 3136, 0.12, 0.35, 0.2]],
  quest: [["bell", 1046, 1046, 0, 0.3, 0.2], ["bell", 1318, 1318, 0.09, 0.3, 0.2], ["bell", 1568, 1568, 0.18, 0.3, 0.2], ["bell", 2093, 2093, 0.27, 0.7, 0.22]],
  unlock: [["bell", 1568, 1568, 0, 0.3, 0.2], ["bell", 2093, 2093, 0.08, 0.3, 0.2], ["bell", 2637, 2637, 0.16, 0.6, 0.22]],
  toast: [["bell", 1760, 1760, 0, 0.3, 0.16]],
  xp: [["sine", 1318, 1760, 0, 0.12, 0.18]]
};
const WORLD_SYNTH = {
  step_grass: [["noise", 900, 0, 0, 0.08, 0.32], ["noise", 2600, 0, 0.012, 0.05, 0.1]],
  step_stone: [["noise", 2800, 0, 0, 0.035, 0.32], ["sine", 300, 170, 0, 0.045, 0.14]],
  step_wood: [["triangle", 220, 140, 0, 0.07, 0.32], ["noise", 1500, 0, 0, 0.04, 0.14]],
  step_snow: [["noise", 3400, 0, 0, 0.12, 0.26], ["noise", 1100, 0, 0.025, 0.09, 0.16]],
  step_sand: [["noise", 5200, 0, 0, 0.1, 0.2], ["noise", 1700, 0, 0, 0.07, 0.1]],
  swing_light: [["sweep", 1300, 3800, 0, 0.15, 0.32]],
  swing_heavy: [["sweep", 450, 1500, 0, 0.26, 0.42], ["sine", 120, 80, 0.02, 0.2, 0.08]],
  swing_claw: [["sweep", 2200, 5200, 0, 0.1, 0.26]],
  v_growl: [["sawtooth", 115, 82, 0, 0.5, 0.26, 650], ["noise", 380, 0, 0, 0.45, 0.12]],
  v_squeak: [["sine", 1700, 2700, 0, 0.08, 0.2], ["sine", 2600, 1500, 0.09, 0.1, 0.16]],
  v_buzz: [["sawtooth", 205, 235, 0, 0.55, 0.16, 1600], ["sawtooth", 209, 238, 0, 0.55, 0.1, 1600]],
  v_hiss: [["noise", 5400, 0, 0, 0.45, 0.28]],
  v_croak: [["square", 96, 78, 0, 0.15, 0.24, 700], ["square", 96, 78, 0.19, 0.15, 0.24, 700]],
  v_bleat: [["sawtooth", 430, 370, 0, 0.42, 0.16, 1900], ["sawtooth", 436, 366, 0, 0.42, 0.1, 1900]],
  v_clatter: [["noise", 3200, 0, 0, 0.04, 0.3], ["noise", 2700, 0, 0.07, 0.04, 0.26], ["noise", 3500, 0, 0.13, 0.04, 0.24], ["noise", 2900, 0, 0.2, 0.05, 0.2]],
  v_goblin: [["square", 520, 720, 0, 0.08, 0.13, 2100], ["square", 660, 470, 0.1, 0.1, 0.13, 2100], ["square", 560, 780, 0.22, 0.09, 0.11, 2100]],
  v_orc: [["sawtooth", 150, 92, 0, 0.62, 0.3, 850], ["sawtooth", 154, 95, 0, 0.62, 0.16, 850]],
  v_screech: [["sine", 3300, 2300, 0, 0.18, 0.16], ["sawtooth", 1650, 1250, 0, 0.18, 0.05, 4200]],
  v_moan: [["sine", 185, 138, 0, 0.9, 0.24], ["sine", 190, 141, 0, 0.9, 0.18], ["noise", 600, 0, 0.1, 0.7, 0.05]],
  v_gurgle: [["noise", 650, 0, 0, 0.35, 0.22], ["sine", 300, 220, 0, 0.32, 0.12]],
  v_creak: [["sawtooth", 72, 54, 0, 0.85, 0.24, 320], ["noise", 900, 0, 0.1, 0.55, 0.08]],
  v_chirp: [["sine", 2600, 3400, 0, 0.07, 0.18], ["sine", 3000, 2200, 0.08, 0.09, 0.16]],
  v_rumble: [["noise", 260, 0, 0, 0.6, 0.3], ["sine", 70, 50, 0, 0.6, 0.16]],
  v_crackle: [["noise", 4200, 0, 0, 0.05, 0.3], ["noise", 2500, 0, 0.06, 0.05, 0.25], ["noise", 3800, 0, 0.12, 0.08, 0.22], ["sine", 90, 60, 0, 0.3, 0.12]],
  chest: [["sawtooth", 150, 260, 0, 0.38, 0.1, 900], ["bell", 2093, 2093, 0.35, 0.3, 0.14], ["bell", 2637, 2637, 0.42, 0.4, 0.12]],
  craft: [["bell", 2200, 2200, 0, 0.12, 0.2], ["noise", 3000, 0, 0, 0.03, 0.15], ["bell", 2350, 2350, 0.28, 0.12, 0.18], ["noise", 3000, 0, 0.28, 0.03, 0.13], ["bell", 2100, 2100, 0.56, 0.18, 0.18], ["noise", 3000, 0, 0.56, 0.03, 0.12]],
  cast_line: [["sweep", 900, 3000, 0, 0.3, 0.2], ["noise", 1500, 0, 0.35, 0.18, 0.18]],
  splash: [["sweep", 1800, 400, 0, 0.45, 0.32], ["sine", 520, 240, 0, 0.2, 0.08]],
  drip: [["sine", 1900, 1150, 0, 0.05, 0.12], ["sine", 1900, 1150, 0.22, 0.05, 0.04]]
};
const MOB_VOICE = { goblin: "v_goblin", chieftain: "v_goblin", orc: "v_orc", fishfolk: "v_gurgle", birdfolk: "v_chirp", treant: "v_creak", skeleton: "v_clatter", ghoul: "v_moan", cactus: "v_creak", bomb: "v_crackle", bat: "v_screech", worm: "v_rumble", hare: "v_squeak", mandrake: "v_squeak", bulb: "v_creak", shroom: "v_squeak", bee: "v_buzz", crawler: "v_hiss", lizard: "v_hiss", sheep: "v_bleat", longneck: "v_bleat", crab: "v_gurgle", toad: "v_croak", fish: "v_gurgle" };
function mobVoice(m, mode) {
  if (!m || !m.fam) return;
  const key = MOB_VOICE[m.fam.model];
  if (!key) return;
  const sz = (m.fam.scale || 1) * (m.fam.nm ? 1.1 : 1);
  sfx(key, m, { mul: (mode === "die" ? 0.72 : mode === "hurt" ? 1.12 : 1) / Math.sqrt(sz), len: mode === "die" ? 1.6 : mode === "hurt" ? 0.6 : 1, vol: mode === "hurt" ? 0.6 : 1 });
}
function surfaceAt(e) {
  const z = S.zone || {}, th = z.theme;
  if (th === "house") return "wood";
  if (th === "cave" || th === "crypt" || th === "town") return "stone";
  const wx = typeof weatherNow === "function" ? weatherNow() : null;
  if (th === "snow" || z.palette === "snow" || areaOf(S.zoneId) === "frost" || wx === "snow" || wx === "blizzard") return "snow";
  if (z.palette === "desert" || areaOf(S.zoneId) === "cinder") return "sand";
  return "grass";
}
let UI_NOISE = null;
function uiNoise(ctx) {
  if (UI_NOISE) return UI_NOISE;
  const b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (UI_NOISE = b);
}
function uiSynth(name, vol, o) {
  const def = UI_SYNTH[name] || WORLD_SYNTH[name], ctx = AUDIO.ctx;
  if (!def || !ctx) return false;
  o = o || {};
  const t0 = ctx.currentTime + 0.005, out = ctx.createGain(), mul = o.mul || 1, len = o.len || 1;
  out.gain.value = vol;
  let node = out;
  if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; out.connect(p); node = p; }
  node.connect(UI_SYNTH[name] ? AUDIO.bus.ui : AUDIO.bus.sfx);
  let end = 0;
  for (let [type, f0, f1, at, dur, g, lp] of def) {
    f0 *= mul; f1 *= mul; at *= len; dur *= len;
    const t = t0 + at, env = ctx.createGain();
    const brass = type === "brass";
    env.gain.setValueAtTime(0, t);
    if (brass) { env.gain.linearRampToValueAtTime(g, t + Math.min(0.03, dur * 0.25)); env.gain.setValueAtTime(g * 0.85, t + dur * 0.6); env.gain.exponentialRampToValueAtTime(0.0008, t + dur); }
    else { env.gain.linearRampToValueAtTime(g, t + Math.min(0.006, dur * 0.2)); env.gain.exponentialRampToValueAtTime(0.0008, t + dur); }
    let src;
    if (type === "noise" || type === "sweep") {
      src = ctx.createBufferSource(); src.buffer = uiNoise(ctx); src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.setValueAtTime(f0, t); bp.Q.value = type === "sweep" ? 2.2 : 1.2;
      if (type === "sweep") bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      src.connect(bp); bp.connect(env);
    } else if (type === "bell") {
      src = ctx.createOscillator(); src.type = "sine"; src.frequency.value = f0;
      const mod = ctx.createOscillator(), mg = ctx.createGain();
      mod.frequency.value = f0 * 3.5; mg.gain.setValueAtTime(f0 * 0.9, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
      mod.connect(mg); mg.connect(src.frequency); mod.start(t); mod.stop(t + dur + 0.02);
      src.connect(env);
    } else {
      src = ctx.createOscillator(); src.type = brass ? "sawtooth" : type;
      src.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) src.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      if (lp) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = lp; src.connect(f); f.connect(env); } else src.connect(env);
    }
    env.connect(out);
    src.start(t); src.stop(t + dur + 0.02);
    end = Math.max(end, at + dur);
  }
  setTimeout(() => { try { out.disconnect(); if (node !== out) node.disconnect(); } catch (e) {} }, (end + 0.2) * 1000);
  return true;
}

function sfx(name, e, o) {
  if (!AUDIO.ready || !AUDIO.settings || AUDIO.settings.muted) return;
  const file = SFX_FILES[name] || (UI_SYNTH[name] || WORLD_SYNTH[name] ? "syn_" + name : null);
  if (!file) return;
  const now = performance.now();
  if (now - (AUDIO.lastAt[file] || 0) < (name === "step" || name === "hoof" ? 90 : name === "cursor" ? 35 : 45)) return;
  AUDIO.lastAt[file] = now;
  const { v, pan } = sfxGainFor(name, e);
  if (v <= 0.01) return;
  const win = name === "victory" || name === "victory2" || name === "victory3";
  if (win) { AUDIO.victoryUntil = now + 4200; AUDIO.combatUntil = 0; AUDIO.boss = false; AUDIO.tier = 0; updateAudio(); }
  else if (name === "levelup" || name === "fanfare") duckMusic(name === "fanfare" ? 4.2 : 2.4);
  if ((UI_SYNTH[name] || WORLD_SYNTH[name]) && !AUDIO.fallback && AUDIO.ctx && uiSynth(name, v * ((o && o.vol) || 1), Object.assign({ pan }, o || {}, o && o.mul ? { mul: o.mul * (0.96 + Math.random() * 0.08) } : name.startsWith("step_") || name.startsWith("swing_") ? { mul: 0.92 + Math.random() * 0.16 } : {}))) return;
  if (AUDIO.fallback) { playHtml(file, v); return; }
  const buf = AUDIO.buffers[file];
  if (!buf) { decodeClip(file); return; }
  if (AUDIO.voices >= 28) return;
  const ctx = AUDIO.ctx;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  if (["slash", "blunt", "crit", "miss", "step", "hoof", "defeat", "click"].includes(name)) src.playbackRate.value = 0.93 + Math.random() * 0.14;
  const gn = ctx.createGain();
  gn.gain.value = v;
  let node = src;
  node.connect(gn);
  node = gn;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = pan; node.connect(p); node = p; }
  node.connect(UI_SOUNDS.has(name) ? AUDIO.bus.ui : AUDIO.bus.sfx);
  AUDIO.voices++;
  src.onended = () => { AUDIO.voices--; try { gn.disconnect(); } catch (e) {} };
  src.start();
}

function playHtml(file, v) {
  const pool = AUDIO.html[file] || (AUDIO.html[file] = []);
  let a = pool.find(x => x.paused || x.ended);
  if (!a) {
    if (pool.length >= 4) return;
    a = new Audio("data:audio/mpeg;base64," + audioData()[file]);
    pool.push(a);
  }
  const s = AUDIO.settings;
  a.volume = clamp(s.master * s.sfx * v, 0, 1);
  try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}

function duckMusic(secs) {
  AUDIO.duckUntil = performance.now() + secs * 1000;
  if (!AUDIO.ctx) return;
  const t = AUDIO.ctx.currentTime;
  const g = AUDIO.bus.duck.gain;
  g.cancelScheduledValues(t);
  g.setTargetAtTime(0.22, t, 0.08);
  g.setTargetAtTime(1, t + secs, 0.6);
}

function startLoop(slot, name, bus, fade) {
  const cur = AUDIO[slot];
  if (cur && cur.name === name) return;
  if (cur) {
    if (cur.src) {
      const t = AUDIO.ctx.currentTime;
      cur.gain.gain.cancelScheduledValues(t);
      cur.gain.gain.setValueAtTime(cur.gain.gain.value, t);
      cur.gain.gain.linearRampToValueAtTime(0, t + fade);
      try { cur.src.stop(t + fade + 0.05); } catch (e) {}
      const memo = AUDIO.memo || (AUDIO.memo = {});
      memo[cur.name] = { pos: (cur.offset + (t - cur.started)) % cur.bounds.dur, at: performance.now() };
    } else if (cur.el) { const el = cur.el; fadeHtml(el, 0, fade * 1000, () => el.pause()); }
  }
  AUDIO[slot] = null;
  if (!name) return;
  const entry = { name, src: null, gain: null };
  AUDIO[slot] = entry;
  if (AUDIO.fallback) {
    const el = new Audio("data:audio/mpeg;base64," + audioData()[name]);
    el.loop = true; el.volume = 0;
    entry.el = el;
    const p = el.play(); if (p && p.catch) p.catch(() => {});
    const s = AUDIO.settings;
    fadeHtml(el, s.muted ? 0 : s.master * (slot === "music" ? s.music : s.amb), fade * 1000);
    return;
  }
  decodeClip(name).then(buf => {
    if (!buf || AUDIO[slot] !== entry) return;
    const ctx = AUDIO.ctx;
    const bounds = loopBounds(name, buf);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = bounds.start;
    src.loopEnd = bounds.end;
    const gn = ctx.createGain();
    gn.gain.value = 0;
    src.connect(gn); gn.connect(bus);
    const t = ctx.currentTime;
    gn.gain.linearRampToValueAtTime(1, t + fade);
    const memo = AUDIO.memo && AUDIO.memo[name];
    const offset = memo && performance.now() - memo.at < 120000 && !name.includes("battle") && !name.includes("boss") ? memo.pos : 0;
    src.start(t, bounds.start + offset);
    Object.assign(entry, { src, gain: gn, started: t, offset, bounds });
  });
}

function fadeHtml(el, to, ms, done) {
  const from = el.volume, t0 = performance.now();
  const stepF = () => {
    const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
    el.volume = clamp(from + (to - from) * k, 0, 1);
    if (k < 1) requestAnimationFrame(stepF); else if (done) done();
  };
  stepF();
}

function desiredMusic() {
  if (!S.zone) return null;
  const theme = S.zone.theme;
  let fight = false, boss = false, tier = 0;
  const tierOf = m => { const c = conOf(m)[0]; return c === "Too Weak" || c === "Easy Prey" ? 1 : c === "Decent Challenge" || c === "Even Match" ? 2 : c === "Tough" || c === "Very Tough" ? 3 : 4; };
  for (const m of S.mobs) {
    if (!m.alive || m.state !== "combat") continue;
    if ([...m.enmity.keys()].some(isParty)) { fight = true; tier = Math.max(tier, tierOf(m)); if (m.fam.nm || m.fam.boss) boss = true; }
  }
  if (player && player.engaged && player.attackTarget && player.attackTarget.alive) { fight = true; tier = Math.max(tier, tierOf(player.attackTarget)); }
  const now = performance.now();
  if (AUDIO.victoryUntil && now < AUDIO.victoryUntil) return null;
  if (fight) { AUDIO.combatUntil = now + 4000; AUDIO.boss = boss || (AUDIO.boss && now < AUDIO.combatUntil); AUDIO.tier = Math.max(now < (AUDIO.tierUntil || 0) ? AUDIO.tier || 0 : 0, tier); AUDIO.tierUntil = now + 4000; }
  if (now < AUDIO.combatUntil && !S.zone.safe) return AUDIO.boss ? "music_boss" : ["music_battle_easy", "music_battle", "music_battle_tough", "music_battle_deadly"][Math.max(1, AUDIO.tier || 2) - 1];
  AUDIO.boss = false; AUDIO.tier = 0;
  return areaMusic(theme);
}

function desiredAmb() {
  if (!S.zone) return null;
  const th = S.zone.theme;
  if (th === "house") return null;
  if (th === "cave" || th === "crypt") return "amb_cave";
  return isNight() ? "amb_night" : "amb_day";
}

const AMBX = { on: false, layers: {}, nextCritter: 0 };
function ambxInit() {
  const ctx = AUDIO.ctx, N = ctx.sampleRate * 2, buf = ctx.createBuffer(1, N, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  const mk = (type, freq, q) => {
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(AUDIO.bus.amb); src.start();
    return { g, f };
  };
  AMBX.layers = { rain: mk("bandpass", 2600, 0.6), wind: mk("lowpass", 420, 0.8), surf: mk("lowpass", 700, 0.7), crowd: mk("bandpass", 520, 1.4) };
  AMBX.on = true;
}
function ambxCritter(kind) {
  const ctx = AUDIO.ctx, t0 = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(AUDIO.bus.amb);
  if (kind === "frog") { o.type = "square"; o.frequency.setValueAtTime(320, t0); o.frequency.exponentialRampToValueAtTime(180, t0 + 0.18); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.035, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.2); o.start(t0); o.stop(t0 + 0.22); }
  else if (kind === "bird") { o.type = "sine"; const f = 2400 + Math.random() * 1600; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.4, t0 + 0.08); o.frequency.exponentialRampToValueAtTime(f * 0.9, t0 + 0.16); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.02, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t0 + 0.18); o.start(t0); o.stop(t0 + 0.2); }
  else { o.type = "sine"; o.frequency.value = 4200 + Math.random() * 800; g.gain.setValueAtTime(0, t0); for (let k = 0; k < 3; k++) { g.gain.linearRampToValueAtTime(0.008, t0 + k * 0.07 + 0.01); g.gain.linearRampToValueAtTime(0, t0 + k * 0.07 + 0.05); } o.start(t0); o.stop(t0 + 0.25); }
}
function ambxTick() {
  if (AUDIO.fallback || !AUDIO.ctx || !AUDIO.bus.amb) return;
  if (!AMBX.on) ambxInit();
  const th = S.zone ? S.zone.theme : "house", out = th !== "cave" && th !== "crypt" && th !== "house";
  const wx = out && typeof weatherNow === "function" ? weatherNow() : null, now = AUDIO.ctx.currentTime;
  if (now - (AMBX.last || 0) < 0.5) return;
  AMBX.last = now;
  const set = (k, v) => AMBX.layers[k].g.gain.setTargetAtTime(v, now, 1.2);
  set("rain", wx === "storm" ? 0.32 : wx === "rain" ? 0.22 : 0);
  const windy = wx === "wind" || wx === "storm" || wx === "blizzard";
  set("wind", out ? (windy ? 0.3 : areaOf(S.zoneId) === "frost" ? 0.12 : 0.04) * (0.7 + 0.3 * Math.sin(now * 0.4)) : 0);
  AMBX.layers.wind.f.frequency.setTargetAtTime(windy ? 650 : 380, now, 2);
  const dm = S.district || "";
  const surfMul = dm === "docks" ? 1.4 : dm === "fish" ? 1 : dm === "square" ? 0.6 : 0.35;
  set("surf", areaOf(S.zoneId) === "harbor" ? 0.16 * surfMul * (0.6 + 0.4 * Math.sin(now * 0.7)) : 0);
  const night0 = typeof isNight === "function" && isNight();
  const crowdMul = { market: 1.7, square: 1.7, fish: 1.5, docks: 1.1, res: 0.55, south: 0.55, gov: 0.7, keep: 0.5, ind: 0.8, yard: 0.8, gate: 0.9, forge: 0.8, gov_: 1 }[dm] || 1;
  set("crowd", th === "town" ? crowdMul * (night0 ? 0.025 : 0.07) * (0.7 + 0.3 * Math.sin(now * 0.23) * Math.sin(now * 0.61)) : 0);
  AMBX.layers.crowd.f.frequency.setTargetAtTime(480 + 120 * Math.sin(now * 0.37), now, 0.8);
  if ((th === "cave" || th === "crypt") && now > (AMBX.nextDrip || 0)) { AMBX.nextDrip = now + 1.2 + Math.random() * 3.5; uiSynth("drip", 0.35 + Math.random() * 0.3, { mul: 0.8 + Math.random() * 0.5, pan: Math.random() * 1.2 - 0.6 }); }
  if (out && now > AMBX.nextCritter && !/rain|storm|blizzard/.test(wx || "")) {
    AMBX.nextCritter = now + 1.5 + Math.random() * 4;
    const night = typeof isNight === "function" && isNight();
    if (S.zone.mist && night) ambxCritter("frog");
    else if (night && th === "field") ambxCritter("cricket");
    else if (!night && th === "field" && S.zone.palette !== "snow") ambxCritter("bird");
  }
}
function updateAudio() {
  if (!AUDIO.ready) return;
  if (AUDIO.ctx && AUDIO.ctx.state === "suspended") return;
  try { ambxTick(); } catch (err) {}
  const m = desiredMusic();
  const a = desiredAmb();
  const cur = AUDIO.music && AUDIO.music.name;
  if (m !== cur) {
    const toBattle = m && (m.includes("battle") || m.includes("boss"));
    startLoop("music", m, AUDIO.bus.duck, toBattle ? 0.6 : AUDIO.victoryUntil && performance.now() < AUDIO.victoryUntil ? 0.15 : 2.0);
  }
  if (a !== (AUDIO.amb && AUDIO.amb.name)) startLoop("amb", a, AUDIO.bus.amb, 2.5);
}

function audioSettingsHTML() {
  const s = AUDIO.settings || loadAudioSettings();
  const row = (k, label) => '<label class="vol"><span>' + label + '</span><input type="range" min="0" max="100" step="5" data-vol="' + k + '" value="' + Math.round(s[k] * 100) + '"><b>' + Math.round(s[k] * 100) + "</b></label>";
  return "<h3>Sound</h3>" + row("master", "Master") + row("music", "Music") + row("sfx", "Effects") + row("amb", "Ambience") + row("ui", "Interface") +
    '<div class="opt"><button data-a="mute" data-v="">' + (s.muted ? "Sound off · tap to unmute" : "Sound on · tap to mute") + "</button></div>" +
    '<div class="sub">Sound starts after your first tap or key press. On iPhone and iPad the volume buttons and ring switch also apply.</div>';
}

function setVolume(k, v) {
  AUDIO.settings[k] = clamp(v, 0, 1);
  saveAudioSettings();
  applyVolumes();
}

function toggleMute() {
  AUDIO.settings.muted = !AUDIO.settings.muted;
  saveAudioSettings();
  applyVolumes();
  if (!AUDIO.ready) startAudio();
}
