const NOISE = (() => {
  const P = new Uint8Array(512);
  const r = seeded(1337);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  const fade = t => t * t * (3 - 2 * t);
  const h = (x, y, s) => P[(P[(x & 255) + (s & 255)] + (y & 255)) & 511] / 255;
  function value(x, y, period, s) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const p = period || 0;
    const w = v => p ? ((v % p) + p) % p : v;
    const a = h(w(xi), w(yi), s || 0), b = h(w(xi + 1), w(yi), s || 0), c = h(w(xi), w(yi + 1), s || 0), d = h(w(xi + 1), w(yi + 1), s || 0);
    const u = fade(xf), v = fade(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct, period, s) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < oct; o++) {
      sum += amp * value(x * f, y * f, period ? period * f : 0, (s || 0) + o * 31);
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }
  function ridge(x, y, oct, period, s) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < oct; o++) {
      sum += amp * (1 - Math.abs(value(x * f, y * f, period ? period * f : 0, (s || 0) + o * 17) * 2 - 1));
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }
  function hash2(x, y) { return h(x | 0, y | 0, 7); }
  return { value, fbm, ridge, hash2 };
})();

const TEXLIB = { cache: {}, anisotropy: 4 };

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}

function* paintPixelsSteps(w, h, fn) {
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  const img = g.createImageData(w, h);
  const d = img.data;
  const out = [0, 0, 0, 255];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      fn(x, y, out);
      const i = (y * w + x) * 4;
      d[i] = out[0]; d[i + 1] = out[1]; d[i + 2] = out[2]; d[i + 3] = out[3];
    }
    if ((y & 15) === 15) yield y / h;
  }
  g.putImageData(img, 0, 0);
  return c;
}
function runSteps(gen) { let r; while (!(r = gen.next()).done); return r.value; }
function paintPixels(w, h, fn) { return runSteps(paintPixelsSteps(w, h, fn)); }

function heightToNormalCanvas(w, h, hf, strength) {
  return paintPixels(w, h, (x, y, o) => {
    const l = hf[y * w + ((x - 1 + w) % w)], r = hf[y * w + ((x + 1) % w)];
    const u = hf[((y - 1 + h) % h) * w + x], d = hf[((y + 1) % h) * w + x];
    let nx = (l - r) * strength, ny = (u - d) * strength, nz = 1;
    const len = Math.hypot(nx, ny, nz);
    nx /= len; ny /= len; nz /= len;
    o[0] = (nx * 0.5 + 0.5) * 255; o[1] = (ny * 0.5 + 0.5) * 255; o[2] = (nz * 0.5 + 0.5) * 255; o[3] = 255;
  });
}

function posterCanvas(c, lv, alv) {
  const g = c.getContext("2d"), img = g.getImageData(0, 0, c.width, c.height), d = img.data, k = lv - 1, ak = alv - 1;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    if (l > 1) { const q = Math.round(l / 255 * k) / k * 255, f = Math.max(q, 14) / l; d[i] = Math.min(255, d[i] * f); d[i + 1] = Math.min(255, d[i + 1] * f); d[i + 2] = Math.min(255, d[i + 2] * f); }
    if (alv && d[i + 3] < 250) d[i + 3] = Math.round(d[i + 3] / 255 * ak) / ak * 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function toTexture(canvas, color, repeat) {
  if (color) posterCanvas(canvas, 18, 12);
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = TEXLIB.anisotropy;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.needsUpdate = true;
  return t;
}

function heightField(w, h, fn) {
  const hf = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hf[y * w + x] = fn(x, y);
  return hf;
}

function texPair(key, w, h, heightFn, colorFn, strength) {
  if (TEXLIB.cache[key]) return TEXLIB.cache[key];
  const hf = heightField(w, h, heightFn);
  const albedo = paintPixels(w, h, (x, y, o) => colorFn(x, y, hf[y * w + x], o));
  const normal = heightToNormalCanvas(w, h, hf, (strength || 4) * 0.5);
  const pair = { map: toTexture(albedo, true), normalMap: toTexture(normal, false) };
  TEXLIB.cache[key] = pair;
  return pair;
}

function mix(a, b, t) { return a + (b - a) * t; }
function sstep(e0, e1, x) { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
function setRGB(o, r, g, b) { o[0] = clamp(r, 0, 255); o[1] = clamp(g, 0, 255); o[2] = clamp(b, 0, 255); o[3] = 255; }

function texDetailNormal() {
  if (TEXLIB.cache.detail) return TEXLIB.cache.detail;
  const S2 = 256, P = 16;
  const hf = heightField(S2, S2, (x, y) => NOISE.fbm(x / S2 * P, y / S2 * P, 4, P, 3) * 0.7 + NOISE.value(x / S2 * P * 4, y / S2 * P * 4, P * 4, 9) * 0.3);
  const t = toTexture(heightToNormalCanvas(S2, S2, hf, 6), false);
  TEXLIB.cache.detail = t;
  return t;
}

function texGray(key, S2, fn) {
  if (TEXLIB.cache[key]) return TEXLIB.cache[key];
  const vals = new Float32Array(S2 * S2);
  let sum = 0;
  for (let y = 0; y < S2; y++) for (let x = 0; x < S2; x++) { const v = fn(x, y); vals[y * S2 + x] = v; sum += v; }
  const mean = sum / vals.length;
  const c = paintPixels(S2, S2, (x, y, o) => { const v = clamp(128 + (vals[y * S2 + x] - mean) * 255, 0, 255); o[0] = o[1] = o[2] = v; o[3] = 255; });
  posterCanvas(c, 12, 0);
  const t = toTexture(c, false);
  TEXLIB.cache[key] = t;
  return t;
}
function texGrassDetail() {
  return texGray("dgrass", 256, (x, y) => {
    const P = 256;
    let v = NOISE.fbm(x / P * 8, y / P * 8, 3, 8, 41) * 0.35;
    v += NOISE.value(x / P * 64, y / P * 18, 64, 43) * 0.35 + NOISE.value(x / P * 96, y / P * 28, 96, 44) * 0.25;
    return v * 0.9;
  });
}
function texDirtDetail() {
  return texGray("ddirt", 256, (x, y) => {
    const P = 256;
    const n = NOISE.fbm(x / P * 6, y / P * 6, 4, 6, 51) * 0.45;
    const peb = sstep(0.68, 0.74, NOISE.value(x / P * 40, y / P * 40, 40, 52)) * 0.35 - sstep(0.7, 0.76, NOISE.value(x / P * 40 + 0.07, y / P * 40 + 0.07, 40, 52)) * 0.15;
    return n + peb + NOISE.value(x / P * 128, y / P * 128, 128, 53) * 0.12;
  });
}
function texRockDetail() {
  return texGray("drock", 256, (x, y) => NOISE.ridge(x / 256 * 5, y / 256 * 5, 5, 5, 61) * 0.6 + NOISE.fbm(x / 256 * 20, y / 256 * 20, 2, 20, 62) * 0.3);
}

function texRock() {
  return texPair("rock", 256, 256,
    (x, y) => { const P = 256, strata = Math.sin((y / P * 6 + NOISE.fbm(x / P * 3, y / P * 3, 2, 3, 13) * 0.9) * Math.PI * 2) * 0.12, crack = 1 - sstep(0.0, 0.06, Math.abs(NOISE.fbm(x / P * 5, y / P * 5, 3, 5, 15) - 0.5)); return NOISE.ridge(x / P * 6, y / P * 6, 5, 6, 11) * 0.75 + NOISE.fbm(x / P * 24, y / P * 24, 2, 24, 5) * 0.18 + strata - crack * 0.4; },
    (x, y, hv, o) => { const P = 256, n = NOISE.fbm(x / P * 10, y / P * 10, 3, 10, 2), tint = NOISE.fbm(x / P * 3, y / P * 3, 2, 3, 17), lich = sstep(0.7, 0.78, NOISE.fbm(x / P * 14, y / P * 14, 3, 14, 19)) * (hv > 0.2 ? 1 : 0.3), spk = NOISE.value(x / P * 128, y / P * 128, 128, 21) > 0.86 ? 14 : 0; let v = (hv < -0.1 ? 52 : 82) + hv * 72 + n * 28 + spk + (hv > 0.55 ? 16 : 0); setRGB(o, v * (0.96 + tint * 0.12) * (1 - lich * 0.12), v * (0.95 + tint * 0.05) * (1 + lich * 0.04), v * (1.0 - tint * 0.12) * (1 - lich * 0.22)); }, 8);
}

function texCaveRock() {
  return texPair("caverock", 256, 256,
    (x, y) => NOISE.ridge(x / 256 * 5, y / 256 * 5, 5, 5, 21),
    (x, y, hv, o) => { const n = NOISE.fbm(x / 256 * 8, y / 256 * 8, 3, 8, 4); const v = 50 + hv * 55 + n * 20; const moss = sstep(0.62, 0.75, n) * 0.6; setRGB(o, v * (1 - moss * 0.3), v * (1 + moss * 0.25), v * (1.05 - moss * 0.3)); }, 7);
}

function barkH(x, y) {
  const W = 256, H = 512, wx = x / W + NOISE.fbm(x / W * 3, y / H * 2, 2, 3, 33) * 0.08, plate = NOISE.ridge(wx * 9, y / H * 2.2, 3, 9, 31), fis = 1 - sstep(0.0, 0.18, Math.abs(Math.sin(wx * Math.PI * 9 + NOISE.fbm(x / W * 2, y / H * 4, 2, 2, 35) * 2.2)));
  return plate * 0.55 + NOISE.fbm(x / W * 24, y / H * 8, 2, 24, 37) * 0.2 - fis * 0.55 + NOISE.value(x / W * 64, y / H * 30, 64, 39) * 0.08;
}
function texBark() {
  return texPair("bark", 256, 512,
    (x, y) => barkH(x, y),
    (x, y, hv, o) => { const W = 256, H = 512, li = sstep(0.68, 0.8, NOISE.fbm(x / W * 7, y / H * 5, 3, 7, 41)), warm = NOISE.fbm(x / W * 3, y / H * 2, 2, 3, 43), deep = hv < -0.15; let v = deep ? 26 + (hv + 0.6) * 40 : 58 + hv * 75 + (hv > 0.35 ? 18 : 0); v *= 0.9 + warm * 0.25; setRGB(o, v * (1.12 - li * 0.12), v * (0.84 + li * 0.14), v * (0.6 + li * 0.08)); }, 7);
}

function leafDabs(x, y, N, C, seed) {
  const cs = N / C, cx = Math.floor(x / cs), cy = Math.floor(y / cs);
  let best = -1, sec = -1, tone = 0.5;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = cx + i, gy = cy + j, wx = ((gx % C) + C) % C, wy = ((gy % C) + C) % C;
    for (let k = 0; k < 2; k++) {
      const h1 = NOISE.hash2(wx * 7 + k * 31 + seed, wy * 13 + k * 17), h2 = NOISE.hash2(wx * 11 + k * 5 + seed, wy * 3 + k * 41), h3 = NOISE.hash2(wx * 19 + k + seed, wy * 23 + k * 7);
      const px = (gx + h1) * cs, py = (gy + h2) * cs, a = h3 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), dx = x - px, dy = y - py, u = (dx * ca + dy * sa) / (cs * 0.62), v = (-dx * sa + dy * ca) / (cs * 0.34), d = u * u + v * v;
      const val = d < 1 ? (1 - d) * (0.75 + 0.25 * h1) + (dy < 0 ? 0.12 : 0) : -1;
      if (val > best) { sec = best; best = val; tone = h2; } else if (val > sec) sec = val;
    }
  }
  return [best, sec, tone];
}
function texFoliage(key, base) {
  const N = 256, C = 14;
  return texPair(key, N, N,
    (x, y) => { const [b] = leafDabs(x, y, N, C, 3); return b < 0 ? -0.35 : b * 0.9 + NOISE.fbm(x / N * 8, y / N * 8, 2, 8, 41) * 0.25; },
    (x, y, hv, o) => {
      const [b, s2, tone] = leafDabs(x, y, N, C, 3), gap = b < 0, edge = !gap && b - Math.max(0, s2) < 0.08, n = NOISE.fbm(x / N * 6, y / N * 6, 2, 6, 47);
      let v = gap ? 0.38 + n * 0.15 : 0.62 + b * 0.42 + (tone - 0.5) * 0.22 - (edge ? 0.12 : 0);
      const warm = gap ? 0 : Math.max(0, b - 0.55) * 0.5, cool = gap ? 0.08 : 0;
      setRGB(o, base[0] * v * (1 + warm * 0.55), base[1] * v * (1 + warm * 0.25), base[2] * v * (1 - warm * 0.3 + cool));
    }, 5);
}

function plankInfo(x, y) {
  const board = Math.floor(y / 32), by = y % 32, kx = NOISE.hash2(board, 7) * 256, ky = 8 + NOISE.hash2(board, 9) * 16, dk = Math.hypot(((x - kx + 384) % 256) - 128, (by - ky) * 2.2) / 7, knot = NOISE.hash2(board, 13) > 0.45 ? dk : 99;
  const warp = knot < 4 ? Math.sin(knot * 3) * 0.6 / (knot + 0.5) : 0, grain = Math.sin((by / 32 * 9 + NOISE.fbm(x / 256 * 3 + board, by / 32, 2, 0, 55) * 2.5 + warp) * Math.PI * 2), nail = ((x % 128) < 6 || (x % 128) > 121) && Math.hypot(((x + 3) % 128) - 3, by - 16) < 2.2;
  return { board, by, knot, grain, nail };
}
function texPlanks() {
  return texPair("planks", 256, 256,
    (x, y) => { const p = plankInfo(x, y); const edge = p.by < 2 ? -0.7 : p.by > 29 ? -0.25 : 0; return p.grain * 0.12 + NOISE.fbm(x / 256 * 2 + p.board * 3.1, y / 256 * 40, 3, 0, 51) * 0.4 + edge + (p.knot < 1.2 ? -0.35 : p.knot < 2 ? 0.1 : 0) + (p.nail ? 0.5 : 0); },
    (x, y, hv, o) => { const p = plankInfo(x, y); if (p.nail) { setRGB(o, 60, 58, 62); return; } const tint = 0.82 + NOISE.hash2(p.board, 3) * 0.34, wear = (p.by < 4 || p.by > 27 ? 0.12 : 0) * NOISE.value(x / 256 * 40, p.board, 0, 57), kn = p.knot < 1.2 ? -45 : p.knot < 2.5 ? -15 : 0; const v = (88 + hv * 70 + p.grain * 10 + kn) * tint * (1 + wear); setRGB(o, v * 1.15, v * 0.86, v * 0.6); }, 6);
}

function texBricks() {
  return texPair("bricks", 256, 256,
    (x, y) => {
      const row = Math.floor(y / 32), off = row % 2 ? 32 : 0;
      const bx = (x + off) % 64, by = y % 32;
      const mortar = bx < 3 || by < 3 ? -0.7 : 0;
      return mortar + NOISE.fbm(x / 256 * 16, y / 256 * 16, 3, 16, 61) * 0.4;
    },
    (x, y, hv, o) => {
      const row = Math.floor(y / 32), off = row % 2 ? 32 : 0;
      const id = Math.floor((x + off) / 64) + row * 7;
      const tint = 0.85 + NOISE.hash2(id, 11) * 0.3;
      const v = hv < -0.3 ? 70 : (120 + hv * 60) * tint;
      setRGB(o, v * 1.02, v * 0.97, v * 0.9);
    }, 5);
}

function texRoof() {
  return texPair("roof", 256, 256,
    (x, y) => { const row = Math.floor(y / 24), off = row % 2 ? 16 : 0; const sx = (x + off) % 32, sy = y % 24; return (sy / 24) * 0.6 + (sx < 2 ? -0.4 : 0) + NOISE.fbm(x / 256 * 20, y / 256 * 20, 2, 20, 71) * 0.2; },
    (x, y, hv, o) => { const row = Math.floor(y / 24), off = row % 2 ? 16 : 0; const id = Math.floor((x + off) / 32) + row * 9; const t = 0.8 + NOISE.hash2(id, 5) * 0.35; const v = (70 + hv * 60) * t; setRGB(o, v * 1.25, v * 0.62, v * 0.48); }, 5);
}

function texPlaster() {
  return texPair("plaster", 256, 256,
    (x, y) => NOISE.fbm(x / 256 * 10, y / 256 * 10, 4, 10, 91) * 0.6 + NOISE.value(x / 256 * 80, y / 256 * 80, 80, 92) * 0.15,
    (x, y, hv, o) => { const stain = sstep(0.55, 0.8, NOISE.fbm(x / 256 * 3, y / 256 * 3, 3, 3, 93)) * 0.18; const v = 205 + hv * 30; setRGB(o, v * (1 - stain * 0.6), v * (0.95 - stain * 0.7), v * (0.84 - stain * 0.8)); }, 3);
}
function texShingle() {
  return texPair("shingle", 256, 256,
    (x, y) => { const row = Math.floor(y / 16), off = row % 2 ? 16 : 0, col = Math.floor((x + off) / 32); const u = ((x + off) % 32) / 32, v = (y % 16) / 16; return 0.3 + v * 0.5 - (u < 0.06 ? 0.4 : 0) + NOISE.hash2(col, row) * 0.15; },
    (x, y, hv, o) => { const row = Math.floor(y / 16), col = Math.floor((x + (row % 2 ? 16 : 0)) / 32); const t = 0.85 + NOISE.hash2(col * 7, row * 3) * 0.3; setRGB(o, (120 + hv * 60) * t, (58 + hv * 30) * t, (42 + hv * 20) * t); }, 6);
}

function texCloth(key, c1, c2) {
  return texPair(key, 128, 128,
    (x, y) => ((x % 4 < 2) !== (y % 4 < 2) ? 0.6 : 0.4) + NOISE.fbm(x / 128 * 8, y / 128 * 8, 2, 8, 81) * 0.2 + Math.sin((x / 128 * 3 + NOISE.fbm(x / 128 * 2, y / 128 * 2, 2, 2, 83) * 0.8) * Math.PI * 2) * 0.12,
    (x, y, hv, o) => { const stripe = Math.floor(x / 32) % 2 ? c1 : c2, sx = x % 32, seam = sx < 1 || sx > 30 ? 0.82 : 1, mot = 0.92 + NOISE.fbm(x / 128 * 5, y / 128 * 5, 2, 5, 85) * 0.16; const v = (0.78 + hv * 0.32) * seam * mot; setRGB(o, stripe[0] * v, stripe[1] * v, stripe[2] * v); }, 3);
}

function texCobble() {
  return texPair("cobble", 256, 256,
    (x, y) => {
      const cs = 32;
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs);
      let best = 9, second = 9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const gx = cx + i, gy = cy + j;
        const px = (gx + NOISE.hash2(((gx % 8) + 8) % 8, ((gy % 8) + 8) % 8)) * cs, py = (gy + NOISE.hash2(((gy % 8) + 8) % 8 + 40, ((gx % 8) + 8) % 8)) * cs;
        const d = Math.hypot(x - px, y - py) / cs;
        if (d < best) { second = best; best = d; } else if (d < second) second = d;
      }
      return clamp((second - best) * 3, 0, 1) * 0.8 + NOISE.fbm(x / 256 * 16, y / 256 * 16, 2, 16, 91) * 0.2;
    },
    (x, y, hv, o) => { const v = hv < 0.15 ? 60 : 100 + hv * 70; setRGB(o, v * 1.0, v * 0.97, v * 0.92); }, 6);
}

function texGrassBlade() {
  if (TEXLIB.cache.blade) return TEXLIB.cache.blade;
  const c = makeCanvas(64, 64);
  const g = c.getContext("2d");
  g.clearRect(0, 0, 64, 64);
  const r = seeded(5);
  for (let i = 0; i < 14; i++) {
    const x0 = 6 + r() * 52, lean = (r() - 0.5) * 18, hgt = 30 + r() * 32;
    const grd = g.createLinearGradient(0, 64, 0, 64 - hgt);
    grd.addColorStop(0, "rgb(52,74,30)");
    grd.addColorStop(1, r() < 0.3 ? "rgb(170,170,90)" : "rgb(120,150,62)");
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(x0 - 2, 64);
    g.quadraticCurveTo(x0 + lean * 0.4, 64 - hgt * 0.6, x0 + lean, 64 - hgt);
    g.quadraticCurveTo(x0 + lean * 0.4 + 1, 64 - hgt * 0.6, x0 + 2, 64);
    g.closePath();
    g.fill();
  }
  const t = toTexture(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  TEXLIB.cache.blade = t;
  return t;
}

function texWaterNormals() {
  if (TEXLIB.cache.water) return TEXLIB.cache.water;
  const S2 = 256, P = 8;
  const hf = heightField(S2, S2, (x, y) => NOISE.fbm(x / S2 * P, y / S2 * P, 4, P, 101) + 0.5 * NOISE.fbm(x / S2 * P * 3 + 0.5, y / S2 * P * 3, 3, P * 3, 103));
  const t = toTexture(heightToNormalCanvas(S2, S2, hf, 10), false);
  TEXLIB.cache.water = t;
  return t;
}

function texClouds() {
  if (TEXLIB.cache.clouds) return TEXLIB.cache.clouds;
  const S2 = 512, P = 6;
  const c = paintPixels(S2, S2, (x, y, o) => {
    const n = NOISE.fbm(x / S2 * P, y / S2 * P, 5, P, 111);
    const a = sstep(0.48, 0.72, n);
    o[0] = 255; o[1] = 255; o[2] = 255; o[3] = a * 230;
  });
  const t = toTexture(c, true);
  TEXLIB.cache.clouds = t;
  return t;
}

function texGlow() {
  if (TEXLIB.cache.glow) return TEXLIB.cache.glow;
  const c = makeCanvas(64, 64);
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.3, "rgba(255,255,255,0.5)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  TEXLIB.cache.glow = t;
  return t;
}

const TERRAIN_THEMES = {
  town: { grassA: [74, 104, 44], grassB: [98, 122, 52], dirt: [120, 96, 66], rock: [118, 112, 104], sand: [170, 158, 120], cliff: [104, 100, 92] },
  field: { grassA: [92, 108, 50], grassB: [124, 128, 62], dirt: [128, 104, 74], rock: [116, 110, 102], sand: [176, 162, 124], cliff: [110, 104, 96] },
  cave: { grassA: [78, 76, 80], grassB: [96, 90, 92], dirt: [110, 92, 74], rock: [96, 92, 100], sand: [120, 110, 96], cliff: [80, 78, 88], moss: [62, 92, 58] },
  crypt: { grassA: [70, 68, 76], grassB: [84, 82, 90], dirt: [92, 86, 96], rock: [80, 78, 88], sand: [96, 92, 100], cliff: [60, 58, 68], moss: [52, 70, 56] },
  snow: { grassA: [214, 222, 230], grassB: [236, 240, 246], dirt: [168, 160, 150], rock: [130, 136, 146], sand: [200, 205, 212], cliff: [120, 128, 140] },
  highland: { grassA: [124, 128, 62], grassB: [158, 146, 76], dirt: [140, 112, 76], rock: [124, 118, 108], sand: [180, 166, 126], cliff: [116, 110, 100] },
  beach: { grassA: [104, 132, 64], grassB: [128, 146, 72], dirt: [170, 150, 110], rock: [140, 132, 120], sand: [232, 214, 170], cliff: [130, 122, 110] },
  volcanic: { grassA: [62, 56, 54], grassB: [80, 70, 64], dirt: [100, 62, 44], rock: [66, 62, 64], sand: [92, 80, 74], cliff: [52, 48, 50] },
  jungle: { grassA: [52, 92, 36], grassB: [74, 118, 44], dirt: [92, 70, 46], rock: [92, 96, 84], sand: [130, 116, 84], cliff: [76, 84, 66], moss: [44, 86, 40] },
  desert: { grassA: [204, 176, 126], grassB: [222, 196, 146], dirt: [184, 140, 96], rock: [170, 124, 92], sand: [230, 206, 160], cliff: [160, 108, 78] },
  marsh: { grassA: [70, 84, 50], grassB: [96, 100, 60], dirt: [92, 80, 58], rock: [96, 98, 90], sand: [104, 96, 70], cliff: [84, 88, 80], moss: [58, 82, 48] },
  city_frontier: { grassA: [84, 106, 46], grassB: [112, 120, 56], dirt: [118, 92, 62], rock: [118, 112, 104], sand: [170, 158, 120], cliff: [104, 100, 92] },
  city_harbor: { grassA: [110, 124, 62], grassB: [146, 140, 82], dirt: [190, 170, 128], rock: [150, 140, 122], sand: [226, 210, 168], cliff: [140, 132, 118] },
  house: { grassA: [120, 92, 62], grassB: [128, 98, 66], dirt: [110, 84, 58], rock: [100, 90, 80], sand: [120, 100, 80], cliff: [80, 70, 60] }
};

function* bakeTerrainAlbedoSteps(field, size, keyOver) {
  const z = field.zone, th = TERRAIN_THEMES["city_" + z.cityStyle] || TERRAIN_THEMES[z.palette || z.theme] || TERRAIN_THEMES.field, CS = z.cityStyle;
  const W = size, H = Math.max(64, Math.round(size * field.h / field.w));
  const sx = field.w / W, sy = field.h / H;
  const cob = z.theme === "town";
  const tkey = keyOver || terrainKey(), pre = !keyOver && W3.terrainPre && W3.terrainPre.key === tkey ? W3.terrainPre.img : null;
  if (!keyOver) W3.terrainPre = null;
  if (pre) {
    const hc = makeCanvas(W, H);
    hc.getContext("2d").drawImage(pre, 0, 0, W, H);
    if (pre.close) pre.close();
    const ht = toTexture(hc, false);
    ht.colorSpace = THREE.SRGBColorSpace;
    ht.wrapS = ht.wrapT = THREE.ClampToEdgeWrapping;
    PERF.slice("terrain cache hit", 0);
    return ht;
  }
  const c = yield* paintPixelsSteps(W, H, (ix, iy, o) => {
    const px = field.x0 + (ix + 0.5) * sx, py = field.y0 + (iy + 0.5) * sy;
    const hgt = field.heightAt(px, py);
    const slope = Math.min(1, Math.hypot(field.heightAt(px + 8, py) - hgt, field.heightAt(px, py + 8) - hgt) / 0.4 * 0.5);
    const n1 = NOISE.fbm(px * 0.0035, py * 0.0035, 4, 0, 201);
    const n2 = NOISE.fbm(px * 0.02, py * 0.02, 3, 0, 203);
    const n3 = NOISE.value(px * 0.25, py * 0.25, 0, 207);
    let r = mix(th.grassA[0], th.grassB[0], n1), g = mix(th.grassA[1], th.grassB[1], n1), b = mix(th.grassA[2], th.grassB[2], n1);
    if (th.moss) { const m = sstep(0.55, 0.7, n1); r = mix(r, th.moss[0], m); g = mix(g, th.moss[1], m); b = mix(b, th.moss[2], m); }
    const patch = CS === "harbor" ? Math.max(sstep(0.48, 0.66, n2) * 0.9, sstep(0.55, 0.7, n1) * 0.6) : sstep(0.6, 0.72, n2) * 0.7;
    r = mix(r, th.dirt[0], patch); g = mix(g, th.dirt[1], patch); b = mix(b, th.dirt[2], patch);
    const pw = field.pathWeight(px, py);
    if (pw > 0) {
      const plz = field.plazaWeight(px, py);
      if (cob && CS === "harbor" && (z.paved || plz > 0.5)) {
        const row = Math.floor(py / 26), qx = px / 34 + NOISE.hash2(row & 255, 31) * 3, col = Math.floor(qx), fx = qx - col, fy = py / 26 - row, mort = Math.min(fx * 34, (1 - fx) * 34, fy * 26, (1 - fy) * 26), id = NOISE.hash2((col & 255), (row & 255));
        const t2 = z.paved ? pw : pw * plz, tv = 0.86 + id * 0.24 + (n3 - 0.5) * 0.1, wear = sstep(0.4, 0.9, n2) * 0.12;
        let cr = 214 * tv, cg = 196 * tv, cb2 = 158 * tv; if (mort < 1.6) { cr = 128; cg = 116; cb2 = 96; }
        r = mix(r, cr * (1 + wear), t2); g = mix(g, cg * (1 + wear), t2); b = mix(b, cb2 * (1 + wear * 0.6), t2);
      } else if (cob && CS === "mountain" && (z.paved || plz > 0.5)) {
        const cx = ((px * 4) % 256 + 256) % 256 | 0, cy = ((py * 4) % 256 + 256) % 256 | 0, cb = field.cobbleHeight(cx, cy);
        const t2 = z.paved ? pw : pw * plz, slush = sstep(0.45, 0.75, n2) * 0.5;
        let v = 72 + cb * 58, cr = v * 0.96, cg = v * 0.98, cb2 = v * 1.05;
        if (cb < 0.18) { cr = 224; cg = 230; cb2 = 236; }
        cr = mix(cr, 150, slush); cg = mix(cg, 148, slush); cb2 = mix(cb2, 146, slush);
        r = mix(r, cr, t2); g = mix(g, cg, t2); b = mix(b, cb2, t2);
      } else if (cob && CS === "frontier" && z.paved && plz < 0.5) {
        const t2 = pw * (0.88 + 0.12 * n2), grav = n3 > 0.82 ? 1.25 : n3 < 0.12 ? 0.75 : 1, rut = 1 - sstep(0.1, 0.35, Math.abs(NOISE.value(px * 0.012, py * 0.012, 0, 461) - 0.5)) * 0.18;
        r = mix(r, th.dirt[0] * grav * rut, t2); g = mix(g, th.dirt[1] * grav * rut, t2); b = mix(b, th.dirt[2] * grav * rut, t2);
      } else if (cob && (z.paved || plz > 0.5)) {
        const cx = ((px * 4) % 256 + 256) % 256 | 0, cy = ((py * 4) % 256 + 256) % 256 | 0;
        const cb = field.cobbleHeight(cx, cy);
        const v = cb < 0.15 ? 70 : 105 + cb * 60;
        const t2 = z.paved ? pw : pw * plz;
        r = mix(r, v, t2); g = mix(g, v * 0.97, t2); b = mix(b, v * 0.92, t2);
      } else {
        const t2 = pw * (0.85 + 0.15 * n2);
        const gr0 = r, gg0 = g, gb0 = b;
        r = mix(r, th.dirt[0] * (0.9 + n3 * 0.2), t2); g = mix(g, th.dirt[1] * (0.9 + n3 * 0.2), t2); b = mix(b, th.dirt[2] * (0.9 + n3 * 0.2), t2);
        if (field.rutWeight) { const [rw, mw] = field.rutWeight(px, py); const md = mw * 0.4 * pw; r = mix(r, gr0, md); g = mix(g, gg0, md); b = mix(b, gb0, md); const k = 1 - rw * 0.32 * pw; r *= k; g *= k * 0.98; b *= k * 0.95; }
      }
    }
    const shore = field.shoreWeight(px, py);
    if (shore > 0) { r = mix(r, th.sand[0], shore); g = mix(g, th.sand[1], shore); b = mix(b, th.sand[2], shore); const wet = sstep(0.55, 0.95, shore) * 0.32; r *= 1 - wet; g *= 1 - wet * 0.92; b *= 1 - wet * 0.8; }
    const rock = clamp(sstep(0.25, 0.6, slope) + field.outside(px, py) * 0.8, 0, 1);
    if (rock > 0) {
      const rv = 0.75 + NOISE.ridge(px * 0.03, py * 0.03, 3, 0, 209) * 0.5;
      r = mix(r, th.cliff[0] * rv, rock); g = mix(g, th.cliff[1] * rv, rock); b = mix(b, th.cliff[2] * rv, rock);
    }
    if (z.theme === "crypt" && field.outside(px, py) < 0.5) {
      const S0 = 46, row = Math.floor(py / S0), qx = px / S0 + (row % 2) * 0.5 + (NOISE.value(row * 3.1, 0, 0, 451) - 0.5) * 0.3, cx = qx - Math.floor(qx), cy = py / S0 - row;
      const mort = Math.min(cx, 1 - cx, cy, 1 - cy), id = NOISE.value(Math.floor(qx) * 7.3, row * 3.7, 0, 453);
      const k = (mort < 0.035 ? 0.55 : 0.82 + id * 0.3) * (1 - field.outside(px, py));
      const stv = 0.6 + id * 0.25;
      r = mix(r, 118 * stv, k); g = mix(g, 114 * stv, k); b = mix(b, 124 * stv, k);
      if (mort < 0.035) { r *= 0.6; g *= 0.6; b *= 0.6; }
    }
    const speck = 0.88 + n3 * 0.24;
    setRGB(o, r * speck, g * speck, b * speck);
  });
  cacheStoreCanvas(tkey, c, "image/webp", 0.95);
  const t = toTexture(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

let COBBLE_HF = null;
function cobbleHeight(x, y) {
  if (!COBBLE_HF) {
    texCobble();
    const cs = 32;
    COBBLE_HF = heightField(256, 256, (px, py) => {
      const cx = Math.floor(px / cs), cy = Math.floor(py / cs);
      let best = 9, second = 9;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const gx = cx + i, gy = cy + j;
        const qx = (gx + NOISE.hash2(((gx % 8) + 8) % 8, ((gy % 8) + 8) % 8)) * cs, qy = (gy + NOISE.hash2(((gy % 8) + 8) % 8 + 40, ((gx % 8) + 8) % 8)) * cs;
        const d = Math.hypot(px - qx, py - qy) / cs;
        if (d < best) { second = best; best = d; } else if (d < second) second = d;
      }
      return clamp((second - best) * 3, 0, 1);
    });
  }
  return COBBLE_HF[(y & 255) * 256 + (x & 255)];
}

function bakeTerrainAlbedo(field, size) { return runSteps(bakeTerrainAlbedoSteps(field, size)); }

function thatchInfo(y, x) {
  const row = Math.floor(y / 32), v = (y % 32) / 32, jit = NOISE.hash2(Math.floor(x / 8) + row * 37, row) * 0.18;
  const vv = v - jit * (1 - v), str = NOISE.value(x / 256 * 128, y / 256 * 5 + row * 0.7, 128, 101 + row % 3), str2 = NOISE.value(x / 256 * 64 + 0.3, y / 256 * 9, 64, 103);
  return { row, v: vv, str, str2 };
}
function texThatch() {
  return texPair("thatch", 256, 256,
    (x, y) => { const t = thatchInfo(x, y), bulge = Math.sin(clamp(t.v, 0, 1) * Math.PI * 0.9) * 0.35, lip = t.v > 0.86 ? -0.45 * (t.v - 0.86) / 0.14 : 0; return bulge + lip + t.str * 0.35 + t.str2 * 0.15 + NOISE.fbm(x / 256 * 6, y / 256 * 6, 2, 6, 105) * 0.15; },
    (x, y, hv, o) => {
      const t = thatchInfo(x, y), age = NOISE.fbm(x / 256 * 3, y / 256 * 3, 3, 3, 107), moss = sstep(0.62, 0.75, NOISE.fbm(x / 256 * 7, y / 256 * 7, 3, 7, 109)), dark = t.v > 0.82 ? 0.62 : 1, fleck = t.str > 0.78 ? 1.18 : t.str < 0.22 ? 0.8 : 1;
      const v = (84 + hv * 64) * dark * fleck * (0.86 + age * 0.26), grey = sstep(0.4, 0.8, age) * 0.45;
      const r = v * (1.16 - grey * 0.22), g = v * (0.98 - grey * 0.1), b = v * (0.64 + grey * 0.2);
      setRGB(o, r * (1 - moss * 0.18), g * (1 - moss * 0.04), b * (1 - moss * 0.12));
    }, 7);
}
function texTiles() {
  return texPair("tiles", 256, 256,
    (x, y) => { const row = Math.floor(y / 32), off = row % 2 ? 0 : 0, u = ((x + off) % 32) / 32, v = (y % 32) / 32, col = Math.floor((x + off) / 32); const barrel = Math.cos((u - 0.5) * Math.PI) * 0.7, step = v > 0.9 ? -0.5 : 0, chip = NOISE.hash2(col, row) > 0.92 && v > 0.75 ? -0.3 : 0; return barrel * (0.75 + v * 0.35) + step + chip + NOISE.fbm(x / 256 * 20, y / 256 * 20, 2, 20, 111) * 0.12; },
    (x, y, hv, o) => {
      const row = Math.floor(y / 32), col = Math.floor(x / 32), t = 0.8 + NOISE.hash2(col * 5, row * 3) * 0.4, burn = NOISE.hash2(col * 13, row * 7), lich = sstep(0.68, 0.8, NOISE.fbm(x / 256 * 9, y / 256 * 9, 3, 9, 113)), salt = sstep(0.6, 0.85, NOISE.fbm(x / 256 * 4, y / 256 * 4, 2, 4, 115)) * 0.25;
      const v = (hv < -0.2 ? 52 : 92 + hv * 62) * t;
      let r = v * (1.42 - burn * 0.2), g = v * (0.68 + burn * 0.08), b = v * (0.44 + burn * 0.06);
      r = mix(r, 210, salt); g = mix(g, 200, salt); b = mix(b, 186, salt);
      setRGB(o, r * (1 - lich * 0.2), g * (1 + lich * 0.12), b * (1 - lich * 0.1));
    }, 6);
}
function slateInfo(x, y) {
  const row = Math.floor(y / 21.3333), rv = (y - row * 21.3333) / 21.3333, off = NOISE.hash2(row, 3) * 32, xx = x + off, col = Math.floor(xx / 32), u = (xx % 32) / 32;
  return { row, rv, col, u };
}
function texSlate() {
  return texPair("slate", 256, 256,
    (x, y) => { const s = slateInfo(x, y), gap = s.u < 0.05 ? -0.45 : 0, edge = s.rv > 0.9 ? -0.55 : 0, chip = NOISE.hash2(s.col, s.row * 3) > 0.85 && s.rv > 0.7 && s.u > 0.7 ? -0.4 : 0; return 0.25 + s.rv * 0.45 + gap + edge + chip + NOISE.ridge(x / 256 * 14, y / 256 * 28, 2, 14, 121) * 0.12; },
    (x, y, hv, o) => {
      const s = slateInfo(x, y), t = 0.78 + NOISE.hash2(s.col * 7, s.row * 5) * 0.42, warm = NOISE.hash2(s.col * 3, s.row * 11), sheen = NOISE.value(x / 256 * 40, y / 256 * 12, 40, 123) > 0.8 ? 1.12 : 1;
      const v = (hv < -0.2 ? 30 : 62 + hv * 52) * t * sheen;
      setRGB(o, v * (0.92 + warm * 0.12), v * (0.96 + warm * 0.02), v * (1.1 - warm * 0.1));
    }, 7);
}
const ASHLAR_ROWS = [0, 36, 64, 104, 136, 172, 200, 232, 256];
function ashlarInfo(x, y) {
  let r = 0; while (ASHLAR_ROWS[r + 1] <= y) r++;
  const y0 = ASHLAR_ROWS[r], h = ASHLAR_ROWS[r + 1] - y0, off = NOISE.hash2(r, 5) * 64, xx = (x + off) % 256, cuts = [0];
  for (let k = 0; cuts[cuts.length - 1] < 256; k++) cuts.push(Math.min(256, cuts[cuts.length - 1] + 34 + Math.floor(NOISE.hash2(r * 9 + k, 7) * 40)));
  let c = 0; while (cuts[c + 1] <= xx) c++;
  const bx = xx - cuts[c], bw = cuts[c + 1] - cuts[c], by = y - y0;
  return { id: r * 31 + c, bx, bw, by, h, d: Math.min(bx, bw - bx, by, h - by) };
}
function texAshlar() {
  return texPair("ashlar", 256, 256,
    (x, y) => { const a = ashlarInfo(x, y), mortar = a.d < 2.5 ? -0.75 : 0, bev = a.d < 7 ? -(7 - a.d) * 0.035 : 0; return mortar + bev + NOISE.fbm(x / 256 * 12, y / 256 * 12, 3, 12, 131) * 0.32 + NOISE.ridge(x / 256 * 30, y / 256 * 30, 2, 30, 133) * 0.12 + (NOISE.hash2(a.id, 9) - 0.5) * 0.2; },
    (x, y, hv, o) => {
      const a = ashlarInfo(x, y), t = 0.82 + NOISE.hash2(a.id, 11) * 0.34, warm = NOISE.hash2(a.id, 13), soot = sstep(0.6, 0.85, NOISE.fbm(x / 256 * 4, y / 256 * 4, 3, 4, 135)) * 0.3;
      if (a.d < 2.5) { setRGB(o, 92, 88, 80); return; }
      const v = (128 + hv * 66) * t * (1 - soot);
      setRGB(o, v * (1.0 + warm * 0.1), v * (0.97 + warm * 0.03), v * (0.94 - warm * 0.06));
    }, 7);
}
function texWhitewash() {
  return texPair("whitewash", 256, 256,
    (x, y) => NOISE.fbm(x / 256 * 8, y / 256 * 8, 4, 8, 141) * 0.5 + NOISE.value(x / 256 * 60, y / 256 * 60, 60, 142) * 0.18 - sstep(0.8, 0.86, NOISE.fbm(x / 256 * 5, y / 256 * 5, 3, 5, 143)) * 0.3,
    (x, y, hv, o) => {
      const peel = sstep(0.8, 0.86, NOISE.fbm(x / 256 * 5, y / 256 * 5, 3, 5, 143)), drip = sstep(0.6, 0.9, NOISE.fbm(x / 256 * 14, y / 256 * 2, 2, 14, 145)) * 0.12, v = 228 + hv * 22;
      if (peel > 0.5) { const s = 196 + hv * 30; setRGB(o, s * 1.04, s * 0.97, s * 0.88); return; }
      setRGB(o, v * (1 - drip * 0.5), v * (0.99 - drip * 0.6), v * (0.97 - drip * 0.8));
    }, 3);
}
function texShakes() {
  return texPair("shakes", 256, 256,
    (x, y) => { const row = Math.floor(x / 21.3333), u = (x - row * 21.3333) / 21.3333, off = NOISE.hash2(row, 17) * 24, yy = y + off, col = Math.floor(yy / 24), v = (yy % 24) / 24, grain = NOISE.value(x / 256 * 6, yy / 256 * 90, 6, 151 + row % 4); return 0.25 + u * 0.5 - (v < 0.07 ? 0.45 : 0) + grain * 0.25 + NOISE.hash2(col, row) * 0.15 - (u > 0.92 ? 0.4 : 0); },
    (x, y, hv, o) => { const row = Math.floor(x / 21.3333), off = NOISE.hash2(row, 17) * 24, col = Math.floor((y + off) / 24), t = 0.78 + NOISE.hash2(col * 3, row * 7) * 0.42, grey = sstep(0.4, 0.8, NOISE.fbm(x / 256 * 3, y / 256 * 3, 3, 3, 155)) * 0.5, moss = sstep(0.7, 0.8, NOISE.fbm(x / 256 * 8, y / 256 * 8, 3, 8, 157)); const v = (70 + hv * 64) * t; setRGB(o, v * (1.12 - grey * 0.18) * (1 - moss * 0.2), v * (0.92 - grey * 0.02), v * (0.7 + grey * 0.2) * (1 - moss * 0.15)); }, 6);
}
