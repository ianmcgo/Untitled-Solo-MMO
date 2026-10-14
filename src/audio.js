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
const SFX_GAIN = { step: 0.35, hoof: 0.5, miss: 0.6, slash: 0.8, blunt: 0.8, xp: 0.5, click: 0.7, select: 0.7, tab: 0.6, toast: 0.6, aggro: 0.7, cast: 0.7, fanfare: 0.9, levelup: 0.9 };
const UI_SOUNDS = new Set(["xp", "unlock", "error", "notify", "coin", "click", "select", "tab", "open", "close", "toast", "equip", "loot", "quest"]);
const MUSIC_FOR = { town: "music_outpost", house: "music_residence", field: "music_hollow", cave: "music_den", crypt: "music_crypt" };

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

function sfx(name, e) {
  if (!AUDIO.ready || !AUDIO.settings || AUDIO.settings.muted) return;
  const file = SFX_FILES[name];
  if (!file) return;
  const now = performance.now();
  if (now - (AUDIO.lastAt[file] || 0) < (name === "step" || name === "hoof" ? 90 : 45)) return;
  AUDIO.lastAt[file] = now;
  const { v, pan } = sfxGainFor(name, e);
  if (v <= 0.01) return;
  if (name === "levelup" || name === "fanfare") duckMusic(name === "fanfare" ? 4.2 : 2.4);
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
  let fight = false, boss = false;
  for (const m of S.mobs) {
    if (!m.alive || m.state !== "combat") continue;
    if ([...m.enmity.keys()].some(isParty)) { fight = true; if (m.fam.nm || m.fam.boss) boss = true; }
  }
  if (player && player.engaged && player.attackTarget && player.attackTarget.alive) fight = true;
  const now = performance.now();
  if (fight) { AUDIO.combatUntil = now + 4000; AUDIO.boss = boss || (AUDIO.boss && now < AUDIO.combatUntil); }
  if (now < AUDIO.combatUntil && !S.zone.safe) return AUDIO.boss ? "music_boss" : "music_battle";
  AUDIO.boss = false;
  if (theme === "field" && isNight()) return "music_hollow_night";
  return MUSIC_FOR[theme] || null;
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
  AMBX.layers = { rain: mk("bandpass", 2600, 0.6), wind: mk("lowpass", 420, 0.8), surf: mk("lowpass", 700, 0.7) };
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
  set("wind", out ? (windy ? 0.3 : S.zoneId === "frost" ? 0.12 : 0.04) * (0.7 + 0.3 * Math.sin(now * 0.4)) : 0);
  AMBX.layers.wind.f.frequency.setTargetAtTime(windy ? 650 : 380, now, 2);
  set("surf", S.zoneId === "harbor" ? 0.16 * (0.6 + 0.4 * Math.sin(now * 0.7)) : 0);
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
    startLoop("music", m, AUDIO.bus.duck, toBattle ? 0.6 : 2.0);
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
