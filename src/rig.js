const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const REGIONS = ["skin", "face", "cloth", "leather", "metal", "hair", "trim", "fur", "bone", "scale", "feather", "wood", "glow", "plain", "chain", "quilt", "face2", "face3", "face4", "face5", "face6", "face7", "face8"];
const ATLAS_COLS = 6, ATLAS_ROWS = 4;
const FACE_COUNT = 8;
const FACE_NAMES = ["Bright", "Calm", "Keen", "Freckled", "Gentle", "Fierce", "Sleepy", "Proud"];
const ATLAS_SIZE = 1024, ATLAS_CELL = 256, ATLAS_W = 1536, ATLAS_H = 1024;
const RIG = { segK: 1, atlas: null, cache: new Map(), weaponCache: new Map(), glowMat: null, weaponMat: null };

const SKIN_TONES = [0xf3d2b8, 0xe8b894, 0xc98d64, 0x6b4128];
const HAIR_STYLES = ["short", "spiky", "long", "ponytail", "bob", "bun", "bald", "braid", "mohawk", "twintails", "topknot"];
const HAIR_BY_SEX = [["short", "spiky", "long", "ponytail", "bald", "mohawk", "topknot", "braid"], ["long", "ponytail", "bob", "bun", "short", "braid", "twintails", "topknot"]];
const HAIR_STYLE_NAMES = { short: "Short", spiky: "Spiky", long: "Long", ponytail: "Ponytail", bob: "Bob", bun: "Bun", bald: "Shaved" , braid: "Braid", mohawk: "Crest", twintails: "Twin tails", topknot: "Topknot" };
const HAIR_COLORS = [0x2a1d14, 0x5a3a22, 0x8a5a2c, 0xd8b070, 0xb03a2e, 0x1d1d22, 0xe0e0f0, 0x3a5a8a];

const REGION_PAINT = {
  skin(u, v, o) { const n = NOISE.fbm(u * 8, v * 8, 3, 8, 11), f = NOISE.fbm(u * 40, v * 40, 2, 40, 12); o[0] = 0.92 + 0.06 * n + 0.02 * f; o[1] = n * 0.12 + f * 0.05; o[2] = 0.58 + 0.08 * f; o[3] = 0; },
  face(u, v, o) { const n = NOISE.fbm(u * 8, v * 8, 3, 8, 13); o[0] = 0.94 + 0.06 * n; o[1] = n * 0.08; o[2] = 0.58; o[3] = 0; },
  cloth(u, v, o, x, y) {
    const w = ((x >> 1) & 1) ^ ((y >> 1) & 1), n = NOISE.fbm(u * 10, v * 10, 3, 10, 21);
    const fold = NOISE.fbm(u * 5, v * 0.8, 3, 5, 23), fk = Math.sin((u * 7 + fold * 1.6) * Math.PI * 2) * 0.5 + 0.5;
    const hem = (v < 0.035 || v > 0.965) ? 1 : 0, st = ((v > 0.05 && v < 0.06) || (v > 0.94 && v < 0.95)) && x % 8 < 5 ? 1 : 0;
    o[0] = 0.72 + 0.06 * w + 0.1 * n + 0.14 * fk - hem * 0.1 - st * 0.12; o[1] = 0.25 + 0.4 * w + 0.15 * n + fk * 0.5 + hem * 0.3 - st * 0.3; o[2] = 0.95; o[3] = 0;
  },
  leather(u, v, o, x, y) {
    const n = NOISE.fbm(u * 12, v * 12, 4, 12, 31);
    const st = (x % 22 < 12 && ((y > 8 && y < 12) || (y > 244 && y < 248))) ? 1 : 0;
    const pore = NOISE.value(u * 90, v * 90, 0, 33) > 0.82 ? 0.06 : 0, edge = Math.max(0, 1 - Math.min(v, 1 - v) * 14);
    const crease = NOISE.ridge(u * 4, v * 6, 3, 4, 35) > 0.88 ? 0.1 : 0;
    o[0] = 0.66 + 0.3 * n - st * 0.3 - pore - crease + edge * 0.12; o[1] = n * 0.6 - st * 0.4 - pore * 2 - crease * 2; o[2] = 0.5 + 0.25 * (1 - n) - edge * 0.12; o[3] = 0;
  },
  metal(u, v, o) {
    const br = NOISE.value(u * 3, v * 140, 0, 41);
    const sc = NOISE.value(u * 30, v * 30, 0, 43) > 0.9 ? -0.12 : 0;
    const dent = NOISE.fbm(u * 9, v * 9, 2, 9, 45), edge = Math.max(0, 1 - Math.min(v, 1 - v) * 16), rust = NOISE.fbm(u * 6, v * 6, 3, 6, 47) > 0.7 ? 1 : 0;
    o[0] = 0.76 + 0.14 * br + sc + 0.08 * dent + edge * 0.12 - rust * 0.12; o[1] = br * 0.2 + sc + dent * 0.35 + edge * 0.2; o[2] = 0.24 + 0.18 * br - edge * 0.1 + rust * 0.35; o[3] = 0.95 - rust * 0.4;
  },
  hair(u, v, o) { const s = NOISE.fbm(u * 56, v * 2.2, 3, 0, 51); const sheen = Math.exp(-Math.pow((v - 0.35) * 7, 2)) * 0.15; o[0] = 0.55 + 0.4 * s + sheen; o[1] = s; o[2] = 0.42; o[3] = 0; },
  trim(u, v, o) {
    const fu = (u * 6) % 1;
    const d = Math.abs(fu - 0.5) + Math.abs(v - 0.5) * 1.2;
    const on = Math.max(d < 0.3 ? 1 : 0, v < 0.13 || v > 0.87 ? 1 : 0);
    o[0] = 0.5 + 0.5 * on; o[1] = 0.25 + 0.6 * on; o[2] = 0.55 - 0.25 * on; o[3] = on * 0.6;
  },
  fur(u, v, o) { const n = NOISE.fbm(u * 36, v * 14, 4, 0, 61); o[0] = 0.62 + 0.38 * n; o[1] = n; o[2] = 1; o[3] = 0; },
  bone(u, v, o) { const n = NOISE.fbm(u * 6, v * 6, 4, 6, 71); const crack = NOISE.ridge(u * 5, v * 5, 3, 5, 73) > 0.93 ? -0.25 : 0; o[0] = 0.84 + 0.16 * n + crack; o[1] = n * 0.4 + crack; o[2] = 0.72; o[3] = 0; },
  scale(u, v, o) {
    const rows = 14, cols = 10;
    const ry = v * rows, row = Math.floor(ry), off = row % 2 ? 0.5 : 0;
    const cx = u * cols + off, col = Math.floor(cx);
    const dx = cx - col - 0.5, dy = ry - row - 0.15;
    const d = Math.min(1, Math.hypot(dx, dy * 1.1) * 1.6);
    o[0] = 0.62 + 0.38 * (1 - d * d); o[1] = 1 - d; o[2] = 0.45 + 0.2 * d; o[3] = 0.05;
  },
  feather(u, v, o) {
    const ax = Math.abs(u - 0.5);
    const barb = (ax * 2.2 + v * 1.4) * 22 % 1;
    const shaft = ax < 0.02 ? 1 : 0;
    o[0] = 0.72 + 0.22 * barb + shaft * 0.15 - v * 0.12; o[1] = barb * 0.7 + shaft; o[2] = 0.8; o[3] = 0;
  },
  wood(u, v, o) { const n = NOISE.fbm(u * 2, v * 8, 3, 0, 81); const g = Math.sin((u * 5 + n * 3) * Math.PI * 2) * 0.5 + 0.5; o[0] = 0.66 + 0.24 * g + 0.1 * n; o[1] = g * 0.5; o[2] = 0.78; o[3] = 0; },
  glow(u, v, o) { o[0] = 1; o[1] = 0; o[2] = 1; o[3] = 0; },
  plain(u, v, o) { const n = NOISE.fbm(u * 6, v * 6, 2, 6, 91); o[0] = 0.95 + 0.05 * n; o[1] = 0; o[2] = 0.5; o[3] = 0; },
  chain(u, v, o, x, y) {
    const cs = 10;
    const gx = (x % cs) - cs / 2, gy = (y % cs) - cs / 2;
    const r = Math.hypot(gx, gy * 1.2);
    const ring = Math.abs(r - 3.3) < 1.3 ? 1 : 0;
    o[0] = 0.45 + 0.5 * ring; o[1] = ring; o[2] = 0.35 + 0.3 * (1 - ring); o[3] = 0.6 + 0.35 * ring;
  },
  quilt(u, v, o) {
    const a = (u * 6 + v * 6) % 1, b = (u * 6 - v * 6 + 10) % 1;
    const seam = Math.min(Math.abs(a - 0.5), Math.abs(b - 0.5)) < 0.04 ? 1 : 0;
    const puff = (1 - Math.abs(a - 0.5) * 2) * (1 - Math.abs(b - 0.5) * 2);
    o[0] = 0.82 + 0.15 * puff - seam * 0.2; o[1] = puff - seam; o[2] = 0.92; o[3] = 0;
  }
};

function paintFace(g, ox, oy, v) {
  v = v || 0;
  g.save();
  g.translate(ox, oy);
  const IRIS = ["rgb(70,46,32)", "rgb(58,96,150)", "rgb(58,112,70)", "rgb(118,88,40)", "rgb(104,114,126)", "rgb(160,104,32)", "rgb(96,66,130)", "rgb(42,30,24)"][v];
  const SH = [[1, 1], [1.05, 0.85], [1.1, 0.78], [1, 1.05], [0.98, 1.1], [1.12, 0.72], [1.05, 0.62], [1.06, 0.88]][v];
  const BROW = [[3.2, 0], [2.6, -2], [3.4, 3], [2.8, 0], [2.4, -3], [4.2, 5], [2.6, -1], [3.6, 2]][v];
  const ex = 64, ey = 120;
  for (const s of [-1, 1]) {
    const x = ex + s * 15, rx = 7.5 * SH[0], ry = 8.5 * SH[1];
    g.fillStyle = "rgb(250,246,240)";
    g.beginPath(); g.ellipse(x, ey + 1, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = IRIS;
    g.beginPath(); g.ellipse(x + s * 0.5, ey + 2, 5.2 * SH[0], Math.min(7.2, ry - 1), 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgb(18,12,10)";
    g.beginPath(); g.ellipse(x + s * 0.5, ey + 2.5, 2.6, 3.6 * Math.min(1, SH[1] + 0.1), 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(x - 1.8, ey - 1.8, 1.5, 2, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgb(30,20,16)"; g.lineWidth = v % 2 === 0 ? 3 : 2.4; g.lineCap = "round";
    g.beginPath(); g.ellipse(x, ey + 1.5, rx + 1, ry + 1, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (v % 2 === 0) { g.lineWidth = 1.6; for (const k of [0, 1]) { g.beginPath(); g.moveTo(x + s * (rx - 1 + k * 2), ey - ry * 0.5 + k * 2); g.lineTo(x + s * (rx + 3 + k), ey - ry * 0.8 + k * 2); g.stroke(); } }
    if (v === 6) { g.fillStyle = "rgba(200,150,130,0.55)"; g.beginPath(); g.ellipse(x, ey - ry * 0.55, rx + 1.5, ry * 0.55, 0, Math.PI, Math.PI * 2); g.fill(); }
    g.lineWidth = BROW[0];
    g.beginPath(); g.moveTo(x - s * 8, ey - 15 + BROW[1] * 0.4); g.quadraticCurveTo(x, ey - 20, x + s * 9, ey - 16 - BROW[1]); g.stroke();
    g.fillStyle = "rgba(225,120,110," + (v === 4 ? 0.26 : 0.16) + ")";
    g.beginPath(); g.ellipse(ex + s * 23, ey + 27, 7, 4.5, 0, 0, Math.PI * 2); g.fill();
  }
  if (v === 3) { g.fillStyle = "rgba(150,90,60,0.45)"; const rr = seeded(33); for (let k = 0; k < 22; k++) { g.beginPath(); g.arc(ex + (rr() - 0.5) * 50, ey + 20 + rr() * 14, 0.9 + rr() * 0.8, 0, Math.PI * 2); g.fill(); } }
  g.fillStyle = "rgba(110,70,50,0.18)";
  g.beginPath(); g.ellipse(ex, ey + 25, 3, 6, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgb(140,72,64)"; g.lineWidth = 2.2;
  g.beginPath();
  if (v === 2 || v === 5) { g.moveTo(ex - 6, ey + 43); g.lineTo(ex + 6, ey + 43); }
  else if (v === 7) { g.moveTo(ex - 6, ey + 43); g.quadraticCurveTo(ex + 2, ey + 46, ex + 7, ey + 40); }
  else if (v === 4) { g.moveTo(ex - 7, ey + 41); g.quadraticCurveTo(ex, ey + 48, ex + 7, ey + 41); }
  else { g.moveTo(ex - 6, ey + 42); g.quadraticCurveTo(ex, ey + 46, ex + 6, ey + 42); }
  g.stroke();
  g.restore();
}

function buildAtlas() {
  const N = ATLAS_W, NH = ATLAS_H;
  const alb = new Float32Array(N * NH), hgt = new Float32Array(N * NH), rgh = new Float32Array(N * NH), mtl = new Float32Array(N * NH);
  const o = [0, 0, 0, 0];
  REGIONS.forEach((name, i) => {
    const ox = (i % ATLAS_COLS) * ATLAS_CELL, oy = Math.floor(i / ATLAS_COLS) * ATLAS_CELL;
    const fn = REGION_PAINT[name] || REGION_PAINT[name.replace(/\d+$/, "")];
    for (let y = 0; y < ATLAS_CELL; y++) for (let x = 0; x < ATLAS_CELL; x++) {
      fn(x / ATLAS_CELL, y / ATLAS_CELL, o, x, y);
      const k = (oy + y) * N + ox + x;
      alb[k] = o[0]; hgt[k] = o[1]; rgh[k] = o[2]; mtl[k] = o[3];
    }
  });
  const ca = makeCanvas(N, NH), ga = ca.getContext("2d"), ia = ga.createImageData(N, NH);
  const cn = makeCanvas(N, NH), gn = cn.getContext("2d"), inn = gn.createImageData(N, NH);
  const cm = makeCanvas(N, NH), gm = cm.getContext("2d"), im = gm.createImageData(N, NH);
  for (let y = 0; y < NH; y++) for (let x = 0; x < N; x++) {
    const k = y * N + x, p = k * 4;
    const a = clamp(alb[k], 0, 1) * 255;
    ia.data[p] = a; ia.data[p + 1] = a; ia.data[p + 2] = a; ia.data[p + 3] = 255;
    const rx = Math.floor(x / ATLAS_CELL) * ATLAS_CELL, ry = Math.floor(y / ATLAS_CELL) * ATLAS_CELL;
    const lx = x - rx, ly = y - ry;
    const at = (xx, yy) => hgt[(ry + ((yy + ATLAS_CELL) % ATLAS_CELL)) * N + rx + ((xx + ATLAS_CELL) % ATLAS_CELL)];
    let nx = (at(lx - 1, ly) - at(lx + 1, ly)) * 3, ny = (at(lx, ly - 1) - at(lx, ly + 1)) * 3;
    const len = Math.hypot(nx, ny, 1);
    inn.data[p] = (nx / len * 0.5 + 0.5) * 255; inn.data[p + 1] = (ny / len * 0.5 + 0.5) * 255; inn.data[p + 2] = (1 / len * 0.5 + 0.5) * 255; inn.data[p + 3] = 255;
    im.data[p] = 255; im.data[p + 1] = clamp(rgh[k], 0.05, 1) * 255; im.data[p + 2] = clamp(mtl[k], 0, 1) * 255; im.data[p + 3] = 255;
  }
  ga.putImageData(ia, 0, 0);
  for (let f = 0; f < FACE_COUNT; f++) { const i = REGIONS.indexOf(f ? "face" + (f + 1) : "face"); paintFace(ga, (i % ATLAS_COLS) * ATLAS_CELL, Math.floor(i / ATLAS_COLS) * ATLAS_CELL, f); }
  gn.putImageData(inn, 0, 0);
  gm.putImageData(im, 0, 0);
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = TEXLIB.anisotropy; t.needsUpdate = true; return t; };
  RIG.atlas = { map: mk(ca, true), normal: mk(cn, false), mr: mk(cm, false) };
  RIG.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide });
  RIG.weaponMat = charMaterial();
}

const RIM = { color: { value: new THREE.Color(0xb8c8ff) }, str: { value: 0.35 } };
function charMaterial() {
  const m = new THREE.MeshStandardMaterial({
    map: RIG.atlas.map, normalMap: RIG.atlas.normal, normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: RIG.atlas.mr, metalnessMap: RIG.atlas.mr, roughness: 1, metalness: 1,
    vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 1.6
  });
  m.onBeforeCompile = sh => {
    sh.uniforms.rimColor = RIM.color; sh.uniforms.rimStr = RIM.str;
    sh.fragmentShader = "uniform vec3 rimColor;\nuniform float rimStr;\n" + sh.fragmentShader.replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n{ float fr = pow(1.0 - clamp(abs(dot(normalize(vNormal), normalize(vViewPosition))), 0.0, 1.0), 3.0); totalEmissiveRadiance += rimColor * fr * rimStr; }");
  };
  m.customProgramCacheKey = () => "charRim";
  return m;
}

function regionUV(geo, region) {
  const idx = Math.max(0, REGIONS.indexOf(region));
  const cx = idx % ATLAS_COLS, cy = Math.floor(idx / ATLAS_COLS);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const u = 0.03 + clamp(uv.getX(i), 0, 1) * 0.94, v = 0.03 + clamp(uv.getY(i), 0, 1) * 0.94;
    uv.setXY(i, (cx + u) / ATLAS_COLS, 1 - (cy + 1 - v) / ATLAS_ROWS);
  }
}

class RigBuilder {
  constructor() { this.defs = []; this.byName = {}; this.pieces = []; this.glow = []; this.meta = {}; }
  bone(name, parent, x, y, z) {
    const pd = parent ? this.byName[parent] : null;
    const d = { name, parent: pd ? pd.index : null, world: V3(x, y, z), local: pd ? [x - pd.world.x, y - pd.world.y, z - pd.world.z] : [x, y, z], index: this.defs.length };
    this.defs.push(d);
    this.byName[name] = d;
    return d;
  }
  add(geo, bone, color, region, glow) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    regionUV(g, glow ? "glow" : (region || "plain"));
    const n = g.attributes.position.count;
    const c = new THREE.Color(color);
    const col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    const bi = this.byName[bone] ? this.byName[bone].index : 0;
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; si[i * 4] = bi; sw[i * 4] = 1; }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
    g.clearGroups();
    g.userData.rig = { bone: bi, color, region: glow ? "glow" : (region || "plain"), glow: !!glow };
    (glow ? this.glow : this.pieces).push(g);
  }
  partPoints() {
    const by = this.defs.map(() => []);
    for (const g of this.pieces) {
      const info = g.userData.rig;
      if (!info) continue;
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) by[info.bone].push([pos.getX(i), pos.getY(i), pos.getZ(i), g]);
    }
    return by;
  }
  bridgeGaps() {
    if (this.noBridge) return;
    const by = this.partPoints();
    let lo = Infinity, hi = -Infinity;
    for (const L of by) for (const p of L) { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; }
    const H = Math.max(0.15, hi - lo), tol = 0.012 * H;
    const skip = new Set(["lids", "saddle", "hairTail"].concat(this.noBridgeBones || []));
    for (const d of this.defs) {
      if (d.parent == null || skip.has(d.name)) continue;
      let pi = d.parent;
      while (pi != null && !by[pi].length) pi = this.defs[pi].parent;
      const A = by[d.index];
      if (pi == null || !A.length) continue;
      const B = by[pi];
      const cell = tol * 4, grid = new Map(), key = (x, y, z) => x + "," + y + "," + z;
      for (const q of B) { const k = key(Math.floor(q[0] / cell), Math.floor(q[1] / cell), Math.floor(q[2] / cell)); let L = grid.get(k); if (!L) grid.set(k, L = []); L.push(q); }
      let near = false;
      for (const p of A) {
        const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
        for (let dx = -1; dx <= 1 && !near; dx++) for (let dy = -1; dy <= 1 && !near; dy++) for (let dz = -1; dz <= 1 && !near; dz++) {
          const L = grid.get(key(cx + dx, cy + dy, cz + dz));
          if (L) for (const q of L) if ((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2 < tol * tol) { near = true; break; }
        }
        if (near) break;
      }
      if (near) continue;
      const J = d.world;
      let pa = null, pb = null, da = Infinity, db = Infinity;
      for (const p of A) { const dd = (p[0] - J.x) ** 2 + (p[1] - J.y) ** 2 + (p[2] - J.z) ** 2; if (dd < da) { da = dd; pa = p; } }
      for (const q of B) { const dd = (q[0] - J.x) ** 2 + (q[1] - J.y) ** 2 + (q[2] - J.z) ** 2; if (dd < db) { db = dd; pb = q; } }
      if (Math.sqrt(da) + Math.sqrt(db) > 0.45 * H) continue;
      const ext = new THREE.Box3();
      for (const p of A) ext.expandByPoint(new THREE.Vector3(p[0], p[1], p[2]));
      const sz = ext.getSize(new THREE.Vector3());
      const thick = Math.min(sz.x, sz.y, sz.z) || 0.02;
      const r = clamp(thick * 0.32, 0.006 * H, 0.04 * H);
      const va = V3(pa[0], pa[1], pa[2]), vb = V3(pb[0], pb[1], pb[2]);
      const ia = pa[3].userData.rig, ib = pb[3].userData.rig;
      const regA = ia.region === "glow" ? "plain" : ia.region, regB = ib.region === "glow" ? "plain" : ib.region;
      this.add(gBall(J.clone(), r * 1.25, 1, 1, 1, 10), d.name, ia.color, regA);
      if (va.distanceTo(J) > r) this.add(gTaper(J.clone(), va.clone().add(va.clone().sub(J).setLength(r)), r, r * 0.9, 8), d.name, ia.color, regA);
      if (vb.distanceTo(J) > r) this.add(gTaper(vb.clone().add(vb.clone().sub(J).setLength(r)), J.clone(), r * 0.95, r, 8), this.defs[pi].name, ib.color, regB);
      this.bridges = (this.bridges || 0) + 1;
    }
  }
  findIslands() {
    let lo = Infinity, hi = -Infinity;
    for (const g of this.pieces) { const pos = g.attributes.position; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; } }
    const H = Math.max(0.15, hi - lo), tol = 0.015 * H, cell = tol * 2;
    const key = (x, y, z) => x + "," + y + "," + z;
    const grid = new Map();
    this.pieces.forEach((g, gi) => {
      const pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const k = key(Math.floor(pos.getX(i) / cell), Math.floor(pos.getY(i) / cell), Math.floor(pos.getZ(i) / cell)); let L = grid.get(k); if (!L) grid.set(k, L = new Set()); L.add(gi); }
    });
    const parent = this.pieces.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    for (const [k, L] of grid) {
      const [x, y, z] = k.split(",").map(Number);
      const here = [...L];
      for (let dx = 0; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const M = grid.get(key(x + dx, y + dy, z + dz));
        if (M) for (const b of M) for (const a of here) { const ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
      }
    }
    const sizes = new Map();
    this.pieces.forEach((g, i) => { const r = find(i); sizes.set(r, (sizes.get(r) || 0) + g.attributes.position.count); });
    let main = -1, best = -1;
    for (const [r, n] of sizes) if (n > best) { best = n; main = r; }
    const out = [];
    this.pieces.forEach((g, i) => { if (find(i) !== main) out.push(this.defs[g.userData.rig.bone].name + "#" + i); });
    this._comp = { find, main, H, tol };
    return out;
  }
  attachIslands() {
    for (let pass = 0; pass < 4; pass++) {
      const isl = this.findIslands();
      if (!isl.length) return;
      const { find, main, H, tol } = this._comp;
      const comps = new Map();
      this.pieces.forEach((g, i) => { const r = find(i); if (r === main) return; if (!comps.has(r)) comps.set(r, []); comps.get(r).push(g); });
      const M = [];
      this.pieces.forEach((g, i) => { if (find(i) !== main) return; const pos = g.attributes.position, st = Math.max(1, Math.floor(pos.count / 1500)); for (let k = 0; k < pos.count; k += st) M.push(pos.getX(k), pos.getY(k), pos.getZ(k)); });
      let moved = 0;
      for (const gs of comps.values()) {
        let best = Infinity, bp = null, bq = null;
        for (const g of gs) {
          const pos = g.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
            for (let j = 0; j < M.length; j += 3) { const d = (x - M[j]) ** 2 + (y - M[j + 1]) ** 2 + (z - M[j + 2]) ** 2; if (d < best) { best = d; bp = [x, y, z]; bq = [M[j], M[j + 1], M[j + 2]]; } }
          }
        }
        const dist = Math.sqrt(best);
        if (!bp || dist > 0.25 * H) continue;
        let gy = Infinity;
        for (const g of gs) { g.computeBoundingBox(); gy = Math.min(gy, g.boundingBox.min.y); }
        if (gy < 0.03 * H) {
          const info = gs[0].userData.rig, r = clamp(tol * 1.6, 0.004 * H, 0.03 * H);
          const a = V3(...bp), b = V3(...bq);
          this.add(gTaper(a.clone().add(a.clone().sub(b).setLength(r)), b.clone().add(b.clone().sub(a).setLength(r)), r, r, 6), this.defs[info.bone].name, info.color, info.region === "glow" ? "plain" : info.region);
          moved++;
          continue;
        }
        const k = (dist + tol * 0.6) / Math.max(dist, 1e-6);
        const dx = (bq[0] - bp[0]) * k, dy = (bq[1] - bp[1]) * k, dz = (bq[2] - bp[2]) * k;
        for (const g of gs) g.translate(dx, dy, dz);
        moved++;
      }
      if (!moved) return;
    }
  }
  smoothJoints() {
    const J = { foreArm: [0.06, 0.5, 0.1], hand: [0.04, 0.5, 0.08], shin: [0.07, 0.5, 0.12], foot: [0.04, 0.45, 0.1], upArm: [0.07, 0.4, 0.11], thigh: [0.07, 0.4, 0.16], chest: [0.08, 0.45, 0.32], spine: [0.08, 0.5, 0.32], neck: [0.04, 0.4, 0.12], head: [0.045, 0.4, 0.14], tail: [0.06, 0.5, 0.1], cape: [0.06, 0.5, 0.3] };
    const rigid = new Set(["lids", "saddle"].concat(this.rigidBones || []));
    const kidsAll = this.defs.map(() => []);
    this.defs.forEach(d => { if (d.parent != null) kidsAll[d.parent].push(d.index); });
    const info = this.defs.map(d => {
      if (d.parent == null || rigid.has(d.name)) return null;
      const P = this.defs[d.parent].world;
      const k0 = kidsAll[d.index][0];
      const axis = (k0 != null ? this.defs[k0].world.clone().sub(d.world) : d.world.clone().sub(P));
      if (axis.lengthSq() < 1e-8) axis.set(0, 1, 0);
      axis.normalize();
      const key = d.name.replace(/[LR]$/, "");
      const j = J[key], sc = this.jointScale || 1;
      if (j) return { r: j[0] * sc, m: j[1], lat: j[2] * sc, at: d.world, axis, parent: d.parent };
      const seg = d.world.distanceTo(P);
      const r = clamp(seg * 0.35, 0.025, 0.1) * sc;
      return { r, m: 0.5, lat: r * 2.2, at: d.world, axis, parent: d.parent };
    });
    const kids = this.defs.map(() => []);
    info.forEach((j, i) => { if (j) kids[j.parent].push(i); });
    const v = new THREE.Vector3(), t = new THREE.Vector3();
    const wOf = j => {
      t.copy(v).sub(j.at);
      const ax = t.dot(j.axis);
      const lat = Math.sqrt(Math.max(0, t.lengthSq() - ax * ax));
      if (lat > j.lat || Math.abs(ax) > j.r) return 0;
      return j.m * (1 - Math.abs(ax) / j.r) * (lat > j.lat * 0.7 ? (j.lat - lat) / (j.lat * 0.3) : 1);
    };
    for (const g of this.pieces) {
      const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (let i = 0; i < pos.count; i++) {
        const b = si.getX(i);
        v.fromBufferAttribute(pos, i);
        let other = -1, w = 0;
        const own = info[b];
        if (own) { const wo = wOf(own); if (wo > 0) { other = own.parent; w = wo; } }
        for (const k of kids[b]) { const wk = wOf(info[k]); if (wk > w) { other = k; w = wk; } }
        if (other < 0 || w <= 0.001) continue;
        si.setXY(i, b, other);
        sw.setXY(i, 1 - w, w);
      }
    }
  }
  bakeShade() {
    if (this.noBake) return;
    let lo = Infinity, hi = -Infinity;
    for (const g of this.pieces) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; } }
    const H = Math.max(0.1, hi - lo);
    for (const g of this.pieces) {
      const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color, w = g.attributes.skinWeight;
      if (!n) continue;
      for (let i = 0; i < p.count; i++) {
        const ny = n.getY(i), h = (p.getY(i) - lo) / H;
        let k = 0.87 + 0.18 * (0.5 + 0.5 * ny);
        k *= 0.86 + 0.14 * Math.min(1, h / 0.18);
        const bw = w.getY(i);
        if (bw > 0.05) k *= 1 - 0.12 * Math.min(1, bw * 2);
        c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
      }
    }
  }
  finish() {
    this.attachIslands();
    if (this.defs.length > 1) { this.bridgeGaps(); this.smoothJoints(); }
    this.bakeShade();
    if (typeof window !== "undefined" && window.RIG_CHECK) this.meta.islands = this.findIslands();
    const main = this.pieces.length ? THREE.mergeGeometries(this.pieces) : null;
    const glow = this.glow.length ? THREE.mergeGeometries(this.glow) : null;
    let geo;
    if (main && glow) geo = THREE.mergeGeometries([main, glow], true);
    else { geo = main || glow; geo.clearGroups(); geo.addGroup(0, geo.attributes.position.count, main ? 0 : 1); }
    geo.computeBoundingSphere();
    geo.boundingSphere.radius *= 1.6;
    let minY = Infinity;
    const pa = (main || geo).attributes.position;
    for (let i = 0; i < pa.count; i++) if (pa.getY(i) < minY) minY = pa.getY(i);
    this.meta.minY = minY;
    for (const g of this.pieces.concat(this.glow)) g.dispose();
    return { geo, defs: this.defs.map(d => ({ name: d.name, parent: d.parent, local: d.local })), meta: this.meta };
  }
}

function sgK(n, d) { return Math.max(3, Math.round((n || d) * RIG.segK)); }
function orientBetween(g, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
function gTaper(a, b, ra, rb, seg, flat) {
  const g = new THREE.CylinderGeometry(rb, ra, Math.max(0.001, a.distanceTo(b)), sgK(seg, 10), 1);
  if (flat) g.scale(flat, 1, 1);
  return orientBetween(g, a, b);
}
function gBall(p, r, sx, sy, sz, seg) {
  const s = sgK(seg, 12);
  const g = new THREE.SphereGeometry(r, s, Math.max(4, Math.round(s * 0.7)));
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gPartSphere(p, r, gap, thetaLen, sx, sy, sz, seg, thetaStart) {
  const g = new THREE.SphereGeometry(r, sgK(seg, 16), sgK(10, 10), Math.PI / 2 + gap / 2, Math.PI * 2 - gap, thetaStart || 0, thetaLen);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gFront(p, r, width, t0, t1, sx, sy, sz, seg) {
  const g = new THREE.SphereGeometry(r, sgK(seg, 12), sgK(8, 8), Math.PI / 2 - width / 2, width, t0, t1 - t0);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gLathe(prof, sx, sz, seg) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.002, r), y)), sgK(seg, 18));
  g.scale(sx, 1, sz);
  return g;
}
function gBox(p, w, h, d, rx, ry, rz) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)));
  g.translate(p.x, p.y, p.z);
  return g;
}
function gCyl(p, rt, rb, h, seg, open, t0, tl) {
  const g = new THREE.CylinderGeometry(rt, rb, h, sgK(seg, 14), 1, !!open, t0 || 0, tl || Math.PI * 2);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gRing(p, R, r, axis, seg, arc, rot) {
  const g = new THREE.TorusGeometry(R, r, sgK(6, 6), sgK(seg, 20), arc || Math.PI * 2);
  if (axis === "y") g.rotateX(Math.PI / 2);
  if (axis === "x") g.rotateY(Math.PI / 2);
  if (rot) g.applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])));
  g.translate(p.x, p.y, p.z);
  return g;
}
function gMembrane(ptsXZ, y) {
  const sh = new THREE.Shape();
  ptsXZ.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z));
  const g = new THREE.ShapeGeometry(sh);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  const uv = g.attributes.uv;
  const b = new THREE.Box2(); for (const [x, z] of ptsXZ) b.expandByPoint(new THREE.Vector2(x, -z));
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - b.min.x) / (b.max.x - b.min.x + 1e-6), (uv.getY(i) - b.min.y) / (b.max.y - b.min.y + 1e-6));
  return g;
}

const JOB_TINT = {
  WAR: { shirt: 0x8a3a2c, pants: 0x4a3a2c, robe: 0x7a4a30, trim: 0xd0a040 },
  WHM: { shirt: 0xe6e0d2, pants: 0xcfc6b6, robe: 0xeeeae0, trim: 0xb02a2a, deep: 0xe8dcc6 },
  BLM: { shirt: 0x2b3160, pants: 0x2a2a3a, robe: 0x262c5a, trim: 0xc8a040, deep: 0x3a2460 },
  PLD: { shirt: 0x3a4a7a, pants: 0x3a3a48, robe: 0x3a4a7a, trim: 0xd8c070 },
  RDM: { shirt: 0xa0242c, pants: 0x2a2a2a, robe: 0xa0242c, trim: 0xd8c070 },
  THF: { shirt: 0x4a3f36, pants: 0x2f2a26, robe: 0x4a3f36, trim: 0xa1887f },
  MNK: { shirt: 0xd8893a, pants: 0x5a3f28, robe: 0xd8893a, trim: 0x8a3a2a },
  RNG: { shirt: 0x4a6a34, pants: 0x3a3024, robe: 0x4a6a34, trim: 0xb08a50 },
  DRK: { shirt: 0x2a2232, pants: 0x1e1a22, robe: 0x2a2232, trim: 0x8e6bbf },
  GEO: { shirt: 0x2f5a3a, pants: 0x2a3028, robe: 0x2f5a3a, trim: 0x66bb6a, deep: 0x23452c },
  RUN: { shirt: 0x7a2a2a, pants: 0x2a2424, robe: 0x7a2a2a, trim: 0xef5350 },
  PUP: { shirt: 0x5a2a6a, pants: 0x2a2030, robe: 0x5a2a6a, trim: 0xab47bc },
  DNC: { shirt: 0x8a2a4a, pants: 0x3a2030, robe: 0x8a2a4a, trim: 0xf06292 },
  SCH: { shirt: 0x5a4a40, pants: 0x2a2420, robe: 0x4a3a34, trim: 0xbcaaa4, deep: 0x3a2e2a },
  BST: { shirt: 0x5a4a32, pants: 0x3a3024, robe: 0x5a4a32, trim: 0x8d6e63 },
  BLU: { shirt: 0x1f4a7a, pants: 0x2a2a3a, robe: 0x1f4a7a, trim: 0x42a5f5 },
  COR: { shirt: 0x7a1e1e, pants: 0x2a2020, robe: 0x7a1e1e, trim: 0xd8b040 },
  SAM: { shirt: 0x6a3a2a, pants: 0x2a2420, robe: 0x6a3a2a, trim: 0xe0a060 },
  NIN: { shirt: 0x2a3038, pants: 0x1e2228, robe: 0x2a3038, trim: 0x78909c },
  DRG: { shirt: 0x2a3a6a, pants: 0x2a2a34, robe: 0x2a3a6a, trim: 0x5c8adb },
  BRD: { shirt: 0x8a5a20, pants: 0x3a2e24, robe: 0x8a5a20, trim: 0xffd54f },
  SMN: { shirt: 0x2a6a78, pants: 0x2a2a38, robe: 0x2a6a78, trim: 0xd8c070, deep: 0x1f4f5f }
};

const ITEM_LOOK = {
  leather_vest: { top: { type: "vest", color: 0x7a5230, region: "leather" } },
  travelers_cape: { cape: 0x6a5a3a }, wolf_mantle: { cape: 0x5a5a62 }, mage_cape: { cape: 0x3a2a6a },
  leather_belt: { belt: 0x5a3a20 }, warriors_belt: { belt: 0x7a2a1a }, silk_sash: { belt: 0xc8b8e8 },
  buckler: { shield: { color: 0x8a6a4a, trim: 0xb08a50, emblem: 0x5a3a20 } },
  scale_mail: { top: { type: "mail", color: 0x9aa0a8, region: "chain" }, pauldrons: 0xa8aeb6 },
  kite_shield: { shield: { color: 0x8a90a0, trim: 0xc8a040, emblem: 0x2f5c9a } },
  scarlet_tabard: { top: { type: "tabard", color: 0xa0242c, region: "cloth", color2: 0xd8c070 }, hat: 0xa0242c },
  raider_helm: { head: { type: "cap", color: 0x6a6a72 } },
  scavenger_cap: { head: { type: "cap", color: 0x7a6a4a } },
  nightwing_gloves: { gloves: 0x3a2850, glovesRegion: "leather" },
  burrower_trousers: { legs: 0x7a5a3a, legsRegion: "leather" },
  gravedigger_boots: { boots: 0x2a2a2e },
  linen_robe: { top: { type: "robe" } },
  linen_robe_hq: { top: { type: "robe" } },
  cotton_robe: { top: { type: "robe", deep: true } },
  wardens_robe: { top: { type: "robe", color: 0x2b3b33, trim: 0x69f0ae, glowTrim: true } },
  bronze_cap: { head: { type: "cap", color: 0xb0804a } },
  bronze_cap_hq: { head: { type: "cap", color: 0xc8955a } },
  chieftain_cap: { head: { type: "horned", color: 0x6d6a60, color2: 0xe8dcc0 } },
  leather_gloves: { gloves: 0x6a4428 },
  silkworm_gloves: { gloves: 0xb9a6d8, glovesRegion: "cloth" },
  leather_trousers: { legs: 0x5a3c24, legsRegion: "leather" },
  leather_boots: { boots: 0x4a2e1a },
  duskwing_boots: { boots: 0x3a2850 },
  chain_mail: { top: { type: "mail", color: 0x7a8088, region: "chain" }, pauldrons: 0x8a9098 },
  wizards_robe: { top: { type: "robe", deep: true } },
  iron_helm: { head: { type: "helm", color: 0x8a9098 } },
  wool_hat: { head: { type: "pointy", color: 0x6a5a8a } },
  marsh_boots: { boots: 0x3f4a2a },
  hunters_coat: { top: { type: "coat", color: 0x3f5a2c, trim: 0xb08a50 } },
  evoker_robe: { top: { type: "robe", deep: true } },
  shadow_plate: { top: { type: "mail", color: 0x3a3442, region: "chain" }, pauldrons: 0x4a4258 },
  minstrel_coat: { top: { type: "coat", color: 0x9a6a2a, trim: 0xffd54f } },
  troubadour_coat: { top: { type: "coat", color: 0x6a2a4a, trim: 0xffd54f } },
  brigand_vest: { top: { type: "vest", color: 0x2f2a28, region: "leather", under: 0x5a4a3a } },
  training_gi: { top: { type: "tunic", color: 0xe8e0cc, region: "cloth" }, belt: 0x2a2a2a },
  mire_mantle: { top: { type: "robe", color: 0x2f4030, trim: 0x8aa070 }, head: { type: "hood", color: 0x2f4030 } },
  harbor_mail: { top: { type: "plate", color: 0x6a7a88, region: "chain", plate: 0x8a9aa8, trim: 0x2a5a7a }, pauldrons: 0x8a9aa8, gauntlets: true },
  sailcloth_robe: { top: { type: "robe", color: 0xd8d0b8, trim: 0x2a5a7a } },
  corsair_jerkin: { top: { type: "vest", color: 0x3a2a24, region: "leather", under: 0xa8382c }, belt: 0x1a1210 },
  cinder_mantle: { top: { type: "robe", color: 0x5a2418, trim: 0xff8a50, glowTrim: true }, cape: 0x3a1a12 },
  guild_greatcoat: { top: { type: "coat", color: 0x2a3a5a, trim: 0xd8c070 }, cape: 0x1f2a44 },
  priest_mantle: { top: { type: "robe", color: 0xece4d0, trim: 0xc8a040 } },
  frost_mail: { top: { type: "plate", color: 0x8aa8b8, region: "chain", plate: 0xbfe0ee, trim: 0x9fe8ff, glowTrim: true }, pauldrons: 0xbfe0ee, gauntlets: true },
  snowfur_coat: { top: { type: "coat", color: 0xe0e4e8, trim: 0x9aa8b8 }, collar: 0xf4f6f8 },
  frost_robe: { top: { type: "robe", color: 0x3a5a7a, trim: 0x9fe8ff, glowTrim: true } },
  wight_shroud: { top: { type: "robe", color: 0x3a3a44, trim: 0x8a9a8a }, head: { type: "hood", color: 0x2a2a32 } },
  silkweave_mantle: { cape: 0xb8a8d8 },
  gull_hat: { head: { type: "widebrim", color: 0x3a4a5a, color2: 0xf4f1e8 } },
  tide_crown: { head: { type: "crown", color: 0x7ad0e8, gem: 0x4fc3f7 } },
  fur_hat: { head: { type: "furhat", color: 0x8a6a4a } },
  hollow_crown: { head: { type: "crown", color: 0x8a8070, gem: 0x69f0ae } },
  pathfinder_boots: { boots: 0x5a4028 },
  silk_gloves: { gloves: 0xd8d0e8, glovesRegion: "cloth" }, silk_gloves_q: { gloves: 0xd8d0e8, glovesRegion: "cloth" },
  sentinel_greaves: { legs: 0x4a4a54, legsRegion: "cloth", greaves: 0x9aa0a8 }
};

const MAT_TINT = [[/mythril/, 0xb8d8e8], [/ironvale/, 0x4a5a6a], [/frost|rime|glacier|snow/, 0xbfe0ee], [/tide|coral|harbor|sea|gull/, 0x4a7a8a], [/cinder|ember|flame/, 0x8a3a20], [/shadow|dusk|night|wight/, 0x3a3442], [/bronze/, 0xb0804a], [/iron/, 0x7a8088], [/steel/, 0xa8b0b8], [/silk/, 0xd8d0e8], [/linen|cotton/, 0xd8d0b8], [/wool|fur/, 0x8a6a4a], [/leather|hide/, 0x6a4428]];
function autoLook(id) {
  const it = ITEMS[id];
  if (!it || !it.slot) return null;
  const n = id + " " + (it.name || "").toLowerCase();
  let col = 0x7a6a5a;
  for (const [re, c] of MAT_TINT) if (re.test(n)) { col = c; break; }
  const metal = /iron|steel|bronze|mail|plate|helm|greave|gauntlet/.test(n);
  const trim = (it.lv || 0) >= 14 ? 0xd8c070 : null;
  if (it.slot === "head") return { head: { type: /crown|circlet/.test(n) ? "crown" : /hood|cowl/.test(n) ? "hood" : /helm/.test(n) ? "helm" : /hat/.test(n) ? "widebrim" : "cap", color: col, color2: 0xf4f1e8 } };
  if (it.slot === "body") return { top: /robe|mantle|shroud|cloak/.test(n) ? { type: "robe", color: col, trim } : /coat/.test(n) ? { type: "coat", color: col, trim } : metal ? { type: /plate/.test(n) ? "plate" : "mail", color: col, region: "chain", plate: col, trim } : { type: "vest", color: col, region: "leather" } };
  if (it.slot === "hands") return metal ? { gloves: col, glovesRegion: "metal", gauntlets: true } : { gloves: col, glovesRegion: /silk|cloth|cotton|wool/.test(n) ? "cloth" : "leather" };
  if (it.slot === "legs") return metal ? { legs: 0x4a4a54, greaves: col } : { legs: col, legsRegion: /leather|hide/.test(n) ? "leather" : "cloth" };
  if (it.slot === "feet") return metal ? { boots: col, greaves: col } : { boots: col };
  if (it.slot === "back") return { cape: col };
  if (it.slot === "waist") return { belt: col };
  return null;
}

const MERC_BASE = {
  kael: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[1] } },
  rook: { build: 0, skin: SKIN_TONES[3], hair: { style: "spiky", color: HAIR_COLORS[5] } },
  mira: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[3] } },
  fen: { build: 0, skin: SKIN_TONES[2], hair: { style: "bob", color: HAIR_COLORS[2] } },
  sable: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: 0x2a2440 } },
  dorn: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: 0x8a8a8a }, beard: 0x8a8a8a },
  lisette: { build: 1, skin: SKIN_TONES[0], hair: { style: "bun", color: HAIR_COLORS[4] } },
  vesper: { build: 1, skin: SKIN_TONES[3], hair: { style: "long", color: HAIR_COLORS[6] } },
  mordrin: { build: 0, skin: SKIN_TONES[0], hair: { style: "long", color: 0x1d1d22 }, beard: 0x1d1d22 },
  lyra: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[4] } },
  corin: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[2] }, beard: HAIR_COLORS[2] },
  wren: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[4] } },
  tamsin: { build: 1, skin: SKIN_TONES[2], hair: { style: "bun", color: HAIR_COLORS[0] } }
};

const NPC_LOOK = {
  rhea: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: 0x8a3a20 }, top: { type: "tabard", color: 0x9aa0a8, region: "chain", color2: 0x2f5c9a }, pauldrons: 0xb8bec6, cape: 0x1d3f75, legs: 0x3a3a44, boots: 0x3a2618, gloves: 0x5a3a22, belt: 0x4a2e1a, weapon: "sword" },
  tobin: { build: 0, skin: SKIN_TONES[0], hair: { style: "bald", color: 0xdedede }, beard: 0xe6e6e6, longBeard: true, top: { type: "robe", color: 0x5a3a7a, trim: 0xd8b050, sleeves: "wide" }, legs: 0x3a2a4a, weapon: "staff", alwaysDrawn: true },
  ilsa: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[6] }, top: { type: "coat", color: 0x1f3a5a, trim: 0xd8c070 }, head: { type: "feathered", color: 0x1f2a3a, color2: 0xd8c070 }, legs: 0x2a2a30, boots: 0x1a1410, belt: 0x3a2a1a, weapon: "sword", prop: { leg: 0.9 } },
  marn: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[2] }, beard: HAIR_COLORS[2], top: { type: "apron", color: 0x5a8aa8, color2: 0xd8d0c0 }, head: { type: "bandana", color: 0x1a5a8a }, legs: 0x3a4048, boots: 0x2a2a2a, belt: 0x3a2a1a, prop: { girth: 1.15 } },
  guard: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[0] }, top: { type: "tabard", color: 0x2f4a7a, region: "chain", color2: 0xd8c070 }, head: { type: "helm", color: 0x8a90a0 }, pauldrons: 0x8a90a0, legs: 0x2a2a30, boots: 0x2a1a10, gloves: 0x4a3a28, belt: 0x3a2412, weapon: "sword", alwaysDrawn: false, prop: { girth: 1.08, shoulder: 0.21 } },
  guard_f: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[1] }, top: { type: "tabard", color: 0x2f4a7a, region: "chain", color2: 0xd8c070 }, head: { type: "cap", color: 0x8a90a0 }, pauldrons: 0x8a90a0, legs: 0x2a2a30, boots: 0x2a1a10, gloves: 0x4a3a28, belt: 0x3a2412, weapon: "sword", alwaysDrawn: false },
  corvin: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[5] }, beard: HAIR_COLORS[5], top: { type: "coat", color: 0x2a4a3a, trim: 0xd8c070 }, legs: 0x2a2620, boots: 0x2a1a10, belt: 0x3a2412 },
  selene: { build: 1, skin: SKIN_TONES[3], hair: { style: "long", color: 0x1d1d22 }, top: { type: "coat", color: 0x4a2a5a, trim: 0xd8c070 }, legs: 0x2a2030, boots: 0x2a1a10, belt: 0x3a2412 },
  maera: { build: 1, skin: SKIN_TONES[2], hair: { style: "bob", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x5a3a1e, trim: 0xc9a227 }, legs: 0x2e2a24, boots: 0x2a1a10, gloves: 0x5a3a20, belt: 0x3a2412, weapon: "sword" },
  vela: { build: 1, skin: SKIN_TONES[0], hair: { style: "bob", color: HAIR_COLORS[4] }, top: { type: "tabard", color: 0x5a2a6a, region: "cloth", color2: 0xd8c070 }, legs: 0x2a2030, boots: 0x3a2618, gloves: 0x6a4428, belt: 0x4a2e1a },
  garrick: { build: 0, skin: SKIN_TONES[1], hair: { style: "bald", color: HAIR_COLORS[0] }, beard: 0x8a5a2c, longBeard: true, top: { type: "apron", color: 0x3a2a20, color2: 0x6a4a30 }, legs: 0x3a3028, boots: 0x2a1e14, gloves: 0x4a3020, belt: 0x2a1e14, weapon: "club", alwaysDrawn: false, prop: { girth: 1.2, shoulder: 0.215 } },
  pell: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[1] }, beard: HAIR_COLORS[1], top: { type: "apron", color: 0xd6c6a0, color2: 0x7a5230 }, head: { type: "bandana", color: 0xa0302a }, legs: 0x4a4038, boots: 0x3a2a1e, belt: 0x5a3a20, prop: { girth: 1.12 } },
  brann: { build: 0, skin: SKIN_TONES[2], hair: { style: "spiky", color: 0x1d1d22 }, beard: 0x1d1d22, top: { type: "fur", color: 0x6a4a2a, region: "fur", sleeves: "none" }, pauldrons: 0x55585e, legs: 0x3a3028, legsRegion: "leather", boots: 0x2a1e14, gloves: 0x3a2a1e, belt: 0x2a1e14, weapon: "greataxe", prop: { girth: 1.15, shoulder: 0.22 } },
  luna: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[6] }, top: { type: "robe", color: 0x2a2a5a, trim: 0xb0c4ff, glowTrim: true }, head: { type: "hood", color: 0x1e1e44 }, legs: 0x1e1e30, boots: 0x14141e },
  tarqa: { build: 1, skin: SKIN_TONES[2], hair: { style: "braid", color: HAIR_COLORS[5] }, top: { type: "coat", color: 0x8a5a2a, trim: 0xd84a2a }, collar: 0xd8c8a8, head: { type: "furhat", color: 0x6a4a2a }, legs: 0x4a3a2a, boots: 0x3a2618, belt: 0xa03a2a },
  essa: { build: 1, skin: SKIN_TONES[1], hair: { style: "twintails", color: HAIR_COLORS[1] }, top: { type: "vest", color: 0x6a3a5a, region: "cloth", under: 0xe8d8b8 }, legs: 0x4a3a2a, boots: 0x3a2618, belt: 0xa07a2a },
  nomad: { build: 0, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[0] }, top: { type: "coat", color: 0x5a4a2a, trim: 0xa03a2a }, collar: 0xd8c8a8, legs: 0x3a3028, boots: 0x2a1a10, belt: 0x3a2412, weapon: "polearm" },
  ferryman: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[0] }, beard: HAIR_COLORS[0], top: { type: "vest", color: 0x2a4a6a, region: "cloth", under: 0xe8e0d0 }, head: { type: "bandana", color: 0xa0302a }, legs: 0x3a3a44, boots: 0x2a1e14, belt: 0x3a2412 },
  wend: { build: 0, skin: SKIN_TONES[1], hair: { style: "bald", color: 0xe0e0e0 }, beard: 0xe6e6e6, longBeard: true, top: { type: "robe", color: 0x8a7a5a, trim: 0x4a6a8a }, legs: 0x4a4a40, barefoot: true },
  brisa: { build: 1, skin: SKIN_TONES[2], hair: { style: "braid", color: HAIR_COLORS[4] }, top: { type: "coat", color: 0x4a3a2a, trim: 0xb0b8c0 }, collar: 0xe8e0d0, legs: 0x3a3028, boots: 0x2a1a10, gloves: 0x5a4030, belt: 0x2a1a10 },
  haldor: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: 0x8a8a8a }, beard: 0x9a9a9a, longBeard: true, top: { type: "apron", color: 0x3a3430, color2: 0x5a4030 }, legs: 0x2e2a26, boots: 0x1e1610, gloves: 0x3a2a1e, belt: 0x2a1a10, prop: { girth: 1.2 } },
  orla: { build: 1, skin: SKIN_TONES[0], hair: { style: "bob", color: HAIR_COLORS[1] }, top: { type: "coat", color: 0x2a3a4a, trim: 0xd8c070 }, legs: 0x2a2a30, boots: 0x1a1410, belt: 0x3a2412 },
  odette: { build: 1, skin: SKIN_TONES[1], hair: { style: "bun", color: HAIR_COLORS[6] }, top: { type: "coat", color: 0x7a3a5a, trim: 0xe8d0a0 }, collar: 0xf0e8e0, legs: 0x3a2a34, boots: 0x2a1a14, gloves: 0xe8e0d0, glovesRegion: "cloth", belt: 0x4a2a1a },
  ysolde: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x2f5a3a, trim: 0xc8a040 }, legs: 0x6a5238, legsRegion: "leather", boots: 0x3a2618, gloves: 0x6a4428, belt: 0x4a2e1a }
};

function lookFor(job, gear, base) {
  const tint = JOB_TINT[job] || JOB_TINT.WAR;
  const L = Object.assign({ legs: tint.pants, top: { type: "shirt", color: tint.shirt }, belt: 0x4a3020 }, base);
  for (const slot of SLOTS) {
    const id = gear[slot];
    const il = id && (ITEM_LOOK[id] || (ITEMS[id] && ITEMS[id].look) || autoLook(id));
    if (!il) continue;
    if (il.top) {
      const t = Object.assign({}, il.top);
      if (t.type === "robe" && !t.color) { t.color = t.deep && tint.deep ? tint.deep : tint.robe; t.trim = tint.trim; }
      if (t.type === "vest") t.under = tint.shirt;
      L.top = t;
    }
    if (il.head) L.head = il.head;
    if (il.gloves) { L.gloves = il.gloves; L.glovesRegion = il.glovesRegion; }
    if (il.legs) { L.legs = il.legs; L.legsRegion = il.legsRegion; }
    if (il.boots) L.boots = il.boots;
    if (il.pauldrons) L.pauldrons = il.pauldrons;
    if (il.shield) L.shield = il.shield;
    if (il.hat) L.hat = il.hat;
    if (il.cape) L.cape = il.cape;
    if (il.belt) L.belt = il.belt;
    if (il.gauntlets) L.gauntlets = true;
    if (il.greaves) L.greaves = il.greaves;
    if (il.collar) L.collar = il.collar;
  }
  if (!L.boots) L.shoes = 0x3a2a1e;
  L.weapon = gear.main ? ITEMS[gear.main].wtype : null;
  L.weaponId = gear.main || null;
  return L;
}

function stableKey(o) {
  const norm = v => v && typeof v === "object" && !Array.isArray(v) ? Object.keys(v).sort().reduce((acc, k) => { acc[k] = norm(v[k]); return acc; }, {}) : Array.isArray(v) ? v.map(norm) : v;
  return JSON.stringify(norm(o));
}

function hairPieces(R, H, hc, hr, covered, tailBone) {
  const TB = tailBone || "head";
  if (!H || H.style === "bald") return;
  const c = H.color, st = H.style;
  const top = V3(0, hc + 0.004, -0.004);
  if (st === "mohawk") {
    if (!covered) {
      R.add(gPartSphere(top, hr * 1.02, 0, Math.PI * 0.5, 1.0, 1.02, 1.02, 18), "head", c, "hair");
      for (let k = 0; k < 6; k++) { const a = -0.25 + k * 0.33, d = V3(0, Math.cos(a), -Math.sin(a)); const p0 = V3(0, hc, 0).addScaledVector(d, hr * 0.92); R.add(gTaper(p0, p0.clone().addScaledVector(d, hr * (0.5 + (k < 3 ? 0.15 * k : 0.15 * (5 - k)))), hr * 0.16, 0.01, 6, 0.35), "head", c, "hair"); }
    }
    return;
  }
  if (!covered) {
    const theta = st === "bob" ? Math.PI * 0.68 : st === "long" ? Math.PI * 0.62 : Math.PI * 0.55;
    R.add(gPartSphere(top, hr * 1.09, st === "bob" ? 1.9 : 1.6, theta, 1.0, 1.04, 1.04, 18), "head", c, "hair");
    R.add(gPartSphere(top, hr * 1.1, 0, Math.PI * 0.3, 1.0, 1.04, 1.04, 18), "head", c, "hair");
    R.add(gFront(V3(0, hc + 0.01, 0.004), hr * 1.1, 1.7, 0.18, 0.62, 1.0, 1.04, 1.04, 12), "head", c, "hair");
    if (st === "spiky") {
      const spikes = [[0, 1, 0.1], [0.5, 0.85, -0.25], [-0.5, 0.85, -0.25], [0.25, 0.6, -0.8], [-0.25, 0.6, -0.8], [0, 0.75, -0.6], [0.6, 0.5, 0.3], [-0.6, 0.5, 0.3]];
      for (const [x, y, z] of spikes) {
        const d = V3(x, y, z).normalize();
        const a = V3(0, hc, 0).addScaledVector(d, hr * 0.9);
        R.add(gTaper(a, a.clone().addScaledVector(d, hr * 0.75), hr * 0.32, 0.004, 6), "head", c, "hair");
      }
    }
    const fr = st === "spiky" ? 0 : st === "bob" || st === "long" ? 7 : 5;
    for (let k = 0; k < fr; k++) {
      const f = fr > 1 ? k / (fr - 1) - 0.5 : 0, a = f * 1.5, ln = hr * (0.42 + 0.12 * Math.cos(k * 2.3) + (st === "bob" ? 0.08 : 0));
      const p0 = V3(Math.sin(a) * hr * 0.98, hc + hr * 0.62, Math.cos(a) * hr * 0.86);
      const p1 = V3(Math.sin(a) * hr * 1.1, hc + hr * 0.62 - ln, Math.cos(a) * hr * 1.0);
      R.add(gTaper(p0, p1, hr * 0.17, hr * 0.03, 5, 0.3).rotateY(0), "head", c, "hair");
    }
    if (st !== "spiky") for (const s of [-1, 1]) {
      const side = st === "bob" || st === "long" ? 1.15 : 0.7;
      for (let k = 0; k < 2; k++) {
        const z = hr * (0.35 - k * 0.45);
        R.add(gTaper(V3(s * hr * 1.0, hc + hr * 0.35, z), V3(s * hr * (1.06 + k * 0.04), hc + hr * (0.35 - side), z - hr * 0.08), hr * 0.2, hr * 0.04, 5, 0.32), "head", c, "hair");
      }
    }
    if (st === "bun") R.add(gBall(V3(0, hc + hr * 0.7, -hr * 0.75), hr * 0.42, 1, 1, 1, 10), "head", c, "hair");
    if (st === "topknot") { R.add(gBall(V3(0, hc + hr * 1.12, -hr * 0.1), hr * 0.3, 1, 1.25, 1, 10), "head", c, "hair"); R.add(gRing(V3(0, hc + hr * 0.92, -hr * 0.06), hr * 0.16, hr * 0.05, "y", 10), "head", 0x6a4a2a, "leather"); }
  }
  if (st === "braid") {
    R.add(gBall(V3(0, hc + hr * 0.05, -hr * 1.0), hr * 0.28, 1, 1, 1, 8), "head", c, "hair");
    for (let k = 0; k < 6; k++) R.add(gBall(V3((k % 2 ? 0.012 : -0.012), hc - hr * (0.25 + k * 0.32), -hr * (1.08 + k * 0.05)), hr * (0.24 - k * 0.022), 1, 1.25, 0.9, 8), TB, c, "hair");
    R.add(gRing(V3(0, hc - hr * 2.1, -hr * 1.4), hr * 0.11, hr * 0.04, "y", 8), TB, 0x8a2a2a, "cloth");
  }
  if (st === "twintails") for (const s of [-1, 1]) {
    R.add(gBall(V3(s * hr * 0.85, hc + hr * 0.25, -hr * 0.45), hr * 0.24, 1, 1, 1, 8), "head", c, "hair");
    R.add(gTaper(V3(s * hr * 0.95, hc + hr * 0.15, -hr * 0.55), V3(s * hr * 1.35, hc - hr * 1.5, -hr * 0.75), hr * 0.26, hr * 0.06, 8), TB, c, "hair");
  }
  if (st === "long") {
    R.add(gBall(V3(0, hc - hr * 0.95, -hr * 0.66), hr * 0.85, 1.0, 1.75, 0.38, 12), TB, c, "hair");
    for (let k = 0; k < 7; k++) {
      const f = k / 6 - 0.5, ln = hr * (1.9 + 0.25 * Math.cos(k * 1.7));
      R.add(gTaper(V3(f * hr * 1.5, hc + hr * 0.1, -hr * 0.95), V3(f * hr * 1.9, hc + hr * 0.1 - ln, -hr * (0.95 + 0.12 * Math.abs(f))), hr * 0.26, hr * 0.05, 5, 0.3), TB, c, "hair");
    }
  }
  if (st === "ponytail") {
    R.add(gBall(V3(0, hc + hr * 0.2, -hr * 0.98), hr * 0.3, 1, 1, 1, 8), "head", c, "hair");
    R.add(gTaper(V3(0, hc + hr * 0.15, -hr * 1.08), V3(0, hc - hr * 1.6, -hr * 1.35), hr * 0.3, hr * 0.08, 8), TB, c, "hair");
  }
}

function humanEntry(L) {
  const fem = L.build === 1;
  const pr = Object.assign({ leg: 0.86, torso: 0.52, headR: 0.138, shoulder: fem ? 0.165 : 0.195, hip: fem ? 0.1 : 0.095, arm: 0.6, girth: fem ? 0.9 : 1, neck: 0.075, waist: fem ? 0.8 : 0.92 }, L.prop || {});
  const R = new RigBuilder();
  const ank = 0.08, knee = ank + pr.leg * 0.5, hipJ = ank + pr.leg;
  const hipsY = hipJ + 0.03, spineY = hipsY + pr.torso * 0.28, chestY = hipsY + pr.torso * 0.62, neckY = hipsY + pr.torso, headY = neckY + pr.neck;
  const shY = neckY - 0.05, elY = shY - pr.arm * 0.47, wrY = shY - pr.arm * 0.9;
  const sw = pr.shoulder, gi = pr.girth;
  R.bone("root", null, 0, 0, 0);
  R.bone("hips", "root", 0, hipsY, 0);
  R.bone("spine", "hips", 0, spineY, 0);
  R.bone("chest", "spine", 0, chestY, 0);
  R.bone("neck", "chest", 0, neckY, 0);
  R.bone("head", "neck", 0, headY, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("upArm" + sd, "chest", s * sw, shY, 0);
    R.bone("foreArm" + sd, "upArm" + sd, s * (sw + 0.01), elY, 0);
    R.bone("hand" + sd, "foreArm" + sd, s * (sw + 0.02), wrY, 0);
    R.bone("thigh" + sd, "hips", s * pr.hip, hipJ, 0);
    R.bone("shin" + sd, "thigh" + sd, s * pr.hip, knee, 0.01);
    R.bone("foot" + sd, "shin" + sd, s * pr.hip, ank, 0);
  }
  const skin = L.skin, SKR = L.skinRegion || "skin";
  const top = L.top || { type: "shirt", color: 0x8a7a60 };
  const topC = top.color, topR = top.region || "cloth";
  const legC = L.legs != null ? L.legs : 0x4a3a2c, legR = L.legsRegion || "cloth";
  const sleeves = top.sleeves || (top.type === "robe" ? "wide" : top.type === "fur" ? "none" : "long");
  const sleeveC = top.type === "vest" ? (top.under || 0xd8cfb8) : top.type === "tabard" ? (top.region === "cloth" ? topC : 0x9aa0a8) : top.type === "apron" ? topC : top.type === "fur" ? skin : topC;
  const sleeveR = top.type === "vest" ? "cloth" : top.type === "tabard" ? (top.region === "cloth" ? "cloth" : "chain") : topR;
  const hr = pr.headR, hc = headY + hr * 0.82;
  if (!L.head && L.hat) L.head = { type: "feathered", color: L.hat, color2: 0xd8c070 };
  const headCovers = L.head && ["cap", "helm", "horned", "hood", "pointy", "feathered", "furhat", "widebrim"].includes(L.head.type);

  R.add(gBall(V3(0, hc, 0.005), hr, 0.94, 1.04, 1.0, 20), "head", skin, L.noFace ? (L.headRegion || "skin") : (L.face ? "face" + (L.face % FACE_COUNT + 1) : "face"));
  if (L.nose === "goblin") R.add(gTaper(V3(0, hc - hr * 0.05, hr * 0.85), V3(0, hc - hr * 0.35, hr * 1.85), hr * 0.22, hr * 0.06, 8), "head", skin, SKR);
  else if (!L.skull) R.add(gBall(V3(0, hc - hr * 0.13, hr * 0.93), hr * 0.13, 0.75, 1.0, 0.8, 8), "head", skin, SKR);
  const earBone = s => { const n = "ear" + (s > 0 ? "L" : "R"); if (!R.byName[n]) R.bone(n, "head", s * hr * (L.ears === "cat" ? 0.55 : 0.88), hc + hr * (L.ears === "cat" ? 0.72 : 0.0), -hr * 0.05); return n; };
  for (const s of [-1, 1]) {
    if (L.ears === "goblin") R.add(gTaper(V3(s * hr * 0.8, hc + hr * 0.05, -0.02), V3(s * (hr + 0.24), hc + hr * 0.75, -0.1), hr * 0.32, 0.005, 6, 0.45), "head", skin, SKR);
    else if (L.ears === "elf") R.add(gTaper(V3(s * hr * 0.86, hc - hr * 0.02, -hr * 0.04), V3(s * (hr + 0.17), hc + hr * 0.62, -hr * 0.5), hr * 0.2, 0.004, 6, 0.4), earBone(s), skin, SKR);
    else if (L.ears === "ursan") R.add(gBall(V3(s * hr * 0.78, hc + hr * 0.62, -hr * 0.1), hr * 0.26, 1, 0.9, 0.6, 8), "head", L.hair.color, "hair");
    else if (L.ears === "pip") R.add(gTaper(V3(s * hr * 0.84, hc - hr * 0.08, -0.01), V3(s * (hr + 0.12), hc + hr * 0.12, -hr * 0.12), hr * 0.24, 0.006, 6, 0.42), earBone(s), skin, SKR);
    else if (L.ears === "cat") { if (!(L.head && ["helm", "hood", "horned"].includes(L.head.type))) { const eb = earBone(s); R.add(gTaper(V3(s * hr * 0.5, hc + hr * 0.7, -hr * 0.05), V3(s * hr * 0.74, hc + hr * 1.5, -hr * 0.12), hr * 0.3, 0.006, 4, 0.5), eb, L.hair.color, "hair"); R.add(gTaper(V3(s * hr * 0.52, hc + hr * 0.78, -hr * 0.01), V3(s * hr * 0.7, hc + hr * 1.32, -hr * 0.06), hr * 0.17, 0.004, 4, 0.35), eb, 0xd89a9a, "skin"); } }
    else if (L.ears === "fin") R.add(gBall(V3(s * hr * 0.9, hc + hr * 0.05, -hr * 0.1), hr * 0.45, 0.15, 1.1, 0.8, 8), "head", L.finColor || skin, "scale");
    else if (!L.skull && L.ears !== "none") R.add(gBall(V3(s * hr * 0.93, hc - hr * 0.05, -hr * 0.05), hr * 0.2, 0.45, 1, 0.75, 8), "head", skin, SKR);
    if (L.tusks) R.add(gTaper(V3(s * hr * 0.35, hc - hr * 0.55, hr * 0.75), V3(s * hr * 0.45, hc - hr * 0.1, hr * 0.95), hr * 0.1, 0.004, 6), "head", 0xf0e8d0, "bone");
    if (L.needles) for (let k = 0; k < 4; k++) R.add(gTaper(V3(s * hr * (0.3 + k * 0.2), hc + hr * (0.9 - k * 0.35), hr * 0.3 - k * 0.1), V3(s * hr * (0.5 + k * 0.3), hc + hr * (1.4 - k * 0.5), hr * 0.3 - k * 0.1), 0.012, 0.002, 4), "head", 0xf0f0d8, "bone");
    if (L.eyesGlow) R.add(gBall(V3(s * hr * 0.36, hc + hr * 0.08, hr * 0.84), hr * 0.15, 1.25, 0.75, 0.5, 8), "head", L.eyesGlow, "glow", true);
  }
  if (L.beak) { R.add(gTaper(V3(0, hc - hr * 0.1, hr * 0.8), V3(0, hc - hr * 0.3, hr * 1.9), hr * 0.3, 0.01, 8, 0.8), "head", L.beak, "bone"); R.add(gTaper(V3(0, hc - hr * 0.35, hr * 0.8), V3(0, hc - hr * 0.35, hr * 1.5), hr * 0.18, 0.01, 6, 0.8), "head", new THREE.Color(L.beak).multiplyScalar(0.7).getHex(), "bone"); }
  if (L.crest) for (let k = 0; k < 5; k++) R.add(gBall(V3((k - 2) * hr * 0.25, hc + hr * (0.9 + 0.15 * (2 - Math.abs(k - 2))), -hr * 0.3 - k * 0.02), hr * 0.22, 0.5, 1.6 + 0.4 * (2 - Math.abs(k - 2)), 0.5, 6), "head", L.crest, "feather");
  if (L.leafHead) { for (let k = 0; k < 7; k++) { const a = k * 0.9, rr = hr * 0.75; R.add(gBall(V3(Math.cos(a) * rr, hc + hr * 0.9 + (k % 2) * hr * 0.25, Math.sin(a) * rr), hr * 0.55, 1, 0.8, 1, 8), "head", L.leafHead, "plain"); } R.add(gBall(V3(0, hc + hr * 1.3, 0), hr * 0.6, 1, 0.8, 1, 8), "head", L.leafHead, "plain"); }
  if (L.skull) R.add(gBox(V3(0, hc - hr * 0.75, hr * 0.35), hr * 1.1, hr * 0.45, hr * 0.9), "head", skin, "bone");
  if (L.beard) {
    R.add(gFront(V3(0, hc, 0.005), hr * 1.04, 2.3, Math.PI * 0.55, Math.PI * 0.92, 0.96, 1.04, 1.02, 14), "head", L.beard, "hair");
    if (L.longBeard) R.add(gBall(V3(0, hc - hr * 1.2, hr * 0.6), hr * 0.5, 0.9, 1.6, 0.55, 10), "head", L.beard, "hair");
  }
  const tailed = L.hair && ["long", "ponytail", "braid", "twintails"].includes(L.hair.style);
  if (tailed) R.bone("hairTail", "head", 0, hc + hr * 0.15, -hr * 0.95);
  hairPieces(R, L.hair, hc, hr, headCovers, tailed ? "hairTail" : null);
  if (!L.noFace) {
    R.bone("lids", "head", 0, hc, 0.005);
    for (const s of [-1, 1]) {
      const g = new THREE.SphereGeometry(hr * 1.016, 6, 4, Math.PI / 2 + s * 0.4 - 0.2, 0.4, 1.467 - 0.14, 0.26);
      g.scale(0.94, 1.04, 1.0);
      g.translate(0, hc, 0.005);
      R.add(g, "lids", skin, SKR);
    }
  }

  if (!L.skull) {
    R.add(gTaper(V3(0, neckY - 0.05, 0), V3(0, headY + 0.04, 0.0), 0.05 * gi, 0.043 * gi, 10), "neck", skin, SKR);
    const W = sw / 0.195;
    const robe = top.type === "robe" || top.type === "coat";
    const hipR = fem ? 0.165 : 0.152, waistR = 0.15 * pr.waist, beltY = hipsY + 0.03;
    R.add(gLathe([[0.04, hipJ - 0.075], [0.11, hipJ - 0.06], [hipR * 0.95, hipJ - 0.01], [hipR, beltY]], gi * (fem ? 1.08 : 1.0), 0.7 * gi), "hips", robe ? topC : legC, robe ? topR : legR);
    R.add(gLathe([[hipR, beltY], [hipR * 0.97, spineY]], gi * (fem ? 1.08 : 1.0), 0.7 * gi), "hips", topC, topR);
    R.add(gLathe([[hipR * 0.97, spineY], [waistR, (spineY + chestY) / 2], [0.152, chestY - 0.04]], gi * W, 0.68 * gi), "spine", topC, topR);
    R.add(gLathe([[0.152, chestY - 0.04], [0.172, chestY + 0.05], [0.176, shY - 0.015], [0.13, neckY - 0.02], [0.055, neckY + 0.012]], gi * W * 1.04, 0.66 * gi), "chest", topC, topR);
    if (fem) for (const s of [-1, 1]) R.add(gBall(V3(s * 0.06, chestY + 0.025, 0.075), 0.06, 1, 0.9, 0.75, 10), "chest", topC, topR);
  } else {
    R.add(gTaper(V3(0, neckY - 0.05, 0), V3(0, headY + 0.03, 0), 0.025, 0.025, 6), "neck", skin, "bone");
    for (let i = 0; i < 6; i++) R.add(gBall(V3(0, hipsY + i * (neckY - hipsY) / 6, -0.04), 0.03, 1.2, 0.7, 1, 6), i < 2 ? "spine" : "chest", skin, "bone");
    for (let i = 0; i < 4; i++) R.add(gRing(V3(0, chestY + 0.08 - i * 0.055, 0.0), 0.12 - i * 0.008, 0.012, "y", 16, Math.PI * 1.5, [0, -Math.PI * 0.25 + Math.PI, 0]), "chest", skin, "bone");
    R.add(gRing(V3(0, hipsY - 0.02, 0), 0.11, 0.025, "y", 14), "hips", skin, "bone");
  }

  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    const ax = s * sw, ex = s * (sw + 0.01), wx = s * (sw + 0.02), mid = (elY + wrY) / 2;
    const bare = sleeves === "none" || L.skull;
    const armR = L.skull ? 0.022 : 0.05 * gi;
    const upC = bare ? skin : sleeveC, upR = L.skull ? "bone" : bare ? "skin" : sleeveR;
    if (!L.skull) R.add(gBall(V3(ax, shY - 0.01, 0), 0.062 * gi, 1, 1, 1, 10), "upArm" + sd, upC, upR);
    R.add(gTaper(V3(ax, shY - 0.02, 0), V3(ex, elY, 0), armR * 1.04, armR * 0.82, 10), "upArm" + sd, upC, upR);
    R.add(gBall(V3(ex, elY, 0), L.skull ? 0.03 : 0.041 * gi, 1, 1, 1, 8), "foreArm" + sd, upC, upR);
    const longS = !bare && (sleeves === "long" || sleeves === "wide");
    const fa1C = longS ? sleeveC : (L.skull ? skin : skin), fa1R = longS ? sleeveR : (L.skull ? "bone" : SKR);
    R.add(gTaper(V3(ex, elY, 0), V3(ex, mid, 0), L.skull ? 0.02 : 0.042 * gi, L.skull ? 0.02 : 0.038 * gi, 10), "foreArm" + sd, fa1C, fa1R);
    const fa2C = L.gloves != null ? L.gloves : fa1C, fa2R = L.gloves != null ? (L.glovesRegion || "leather") : fa1R;
    R.add(gTaper(V3(ex, mid, 0), V3(wx, wrY + 0.01, 0), L.skull ? 0.02 : 0.038 * gi, L.skull ? 0.018 : 0.033 * gi, 10), "foreArm" + sd, fa2C, fa2R);
    if (sleeves === "wide" && !bare) {
      R.add(gCyl(V3(ex, wrY + 0.07, 0), 0.05 * gi, 0.085 * gi, 0.16, 14, true), "foreArm" + sd, sleeveC, sleeveR);
      if (top.trim) R.add(gRing(V3(ex, wrY - 0.01, 0), 0.085 * gi, 0.012, "y", 18), "foreArm" + sd, top.trim, "trim", !!top.glowTrim);
    } else if (top.trim && longS) R.add(gRing(V3(wx, wrY + 0.02, 0), 0.04 * gi, 0.009, "y", 14), "foreArm" + sd, top.trim, "trim");
    const handC = L.gloves != null ? L.gloves : skin, handR = L.gloves != null ? (L.glovesRegion || "leather") : (L.skull ? "bone" : SKR);
    if (L.skull) {
      R.add(gBall(V3(s * (sw + 0.025), wrY - 0.055, 0.005), 0.03, 0.75, 1.15, 0.55, 10), "hand" + sd, handC, handR);
      R.add(gBall(V3(s * (sw + 0.005), wrY - 0.035, 0.035), 0.018, 1, 1.6, 1, 6), "hand" + sd, handC, handR);
    } else {
      const hk = gi * (L.doll ? 1.25 : 1), hx = s * (sw + 0.024);
      R.add(gBall(V3(hx, wrY - 0.04, 0.004), 0.038 * hk, 0.62, 1.0, 0.95, 10), "hand" + sd, handC, handR);
      R.add(gTaper(V3(hx, wrY - 0.06, 0.012), V3(hx + s * 0.004, wrY - 0.105 * hk, 0.03), 0.026 * hk, 0.017 * hk, 8, 0.55), "hand" + sd, handC, handR);
      R.add(gBall(V3(hx + s * 0.004, wrY - 0.105 * hk, 0.03), 0.0175 * hk, 0.6, 0.75, 1.0, 8), "hand" + sd, handC, handR);
      R.add(gTaper(V3(s * (sw + 0.01), wrY - 0.035, 0.03), V3(s * (sw + 0.006), wrY - 0.075 * hk, 0.06), 0.013 * hk, 0.0095 * hk, 6), "hand" + sd, handC, handR);
    }
    if (L.claws) for (let k = -1; k <= 1; k++) R.add(gTaper(V3(s * (sw + 0.025) + k * 0.015, wrY - 0.09, 0.01), V3(s * (sw + 0.03) + k * 0.02, wrY - 0.19, 0.05), 0.01, 0.002, 5), "hand" + sd, 0xd8d0b8, "bone");
    if (L.pauldrons) {
      R.add(gPartSphere(V3(ax * 1.01, shY - 0.012, 0), 0.068 * gi, 0, Math.PI * 0.55, 1.12, 0.75, 1.0, 14), "upArm" + sd, L.pauldrons, "metal");
      R.add(gRing(V3(ax * 1.01, shY - 0.03, 0), 0.072 * gi, 0.008, "y", 16).scale(1, 1, 0.92), "upArm" + sd, 0xc8a040, "metal");
    }
    if (L.gauntlets && !L.skull) {
      const gc = L.gloves != null ? L.gloves : 0x8a9098;
      R.add(gCyl(V3(ex, wrY + 0.05, 0), 0.046 * gi, 0.058 * gi, 0.08, 12, true), "foreArm" + sd, gc, "metal");
      R.add(gRing(V3(ex, wrY + 0.09, 0), 0.047 * gi, 0.007, "y", 12), "foreArm" + sd, gc, "metal");
      R.add(gBox(V3(s * (sw + 0.024), wrY - 0.075, 0.034), 0.05, 0.022, 0.016), "hand" + sd, gc, "metal");
    }
    if (L.shield && s < 0) {
      const sy = (elY + wrY) / 2, sx = ex - 0.075;
      const shG = new THREE.CylinderGeometry(0.155, 0.135, 0.022, 7);
      shG.rotateZ(Math.PI / 2);
      shG.translate(sx, sy, 0);
      R.add(shG, "foreArm" + sd, L.shield.color, "metal");
      R.add(gRing(V3(sx - 0.012, sy, 0), 0.15, 0.012, "x", 7), "foreArm" + sd, L.shield.trim || 0xc8a040, "metal");
      R.add(gBall(V3(sx - 0.02, sy, 0), 0.045, 0.5, 1, 1, 8), "foreArm" + sd, L.shield.emblem || 0x2f5c9a, "metal");
    }

    const hx = s * pr.hip;
    const legThin = L.skull ? 0.024 : 0;
    R.add(gTaper(V3(hx, hipJ + 0.03, 0), V3(hx, knee, 0.01), legThin || 0.078 * gi * (fem ? 1.05 : 1), legThin || 0.056 * gi, 12), "thigh" + sd, legC, L.skull ? "bone" : legR);
    const bootTop = knee - 0.1;
    R.add(gBall(V3(hx, knee, 0.012), L.skull ? 0.032 : 0.055 * gi, 1, 1, 1, 10), "shin" + sd, legC, L.skull ? "bone" : legR);
    R.add(gTaper(V3(hx, knee, 0.012), V3(hx, ank + 0.02, 0), legThin || 0.054 * gi, legThin || 0.04 * gi, 12), "shin" + sd, legC, L.skull ? "bone" : legR);
    if (L.boots != null) {
      R.add(gTaper(V3(hx, bootTop, 0.012), V3(hx, ank + 0.01, 0.0), 0.062 * gi, 0.048 * gi, 12), "shin" + sd, L.boots, "leather");
      R.add(gRing(V3(hx, bootTop, 0.012), 0.062 * gi, 0.012, "y", 14), "shin" + sd, L.boots, "leather");
    }
    if (L.greaves != null && !L.skull) {
      R.add(gPartSphere(V3(hx, knee + 0.005, 0.03), 0.06 * gi, 0, Math.PI * 0.62, 1, 1.05, 0.9, 12), "shin" + sd, L.greaves, "metal");
      R.add(gCyl(V3(hx, (knee + ank) / 2 + 0.01, 0.022), 0.05 * gi, 0.043 * gi, (knee - ank) * 0.66, 12, true, -Math.PI * 0.42, Math.PI * 0.84).scale(1, 1, 1.1), "shin" + sd, L.greaves, "metal");
    }
    const footC = L.boots != null ? L.boots : L.barefoot ? skin : L.skull ? skin : (L.shoes || 0x3a2a1e);
    const footR = L.boots != null ? "leather" : L.barefoot ? SKR : L.skull ? "bone" : "leather";
    R.add(gBox(V3(hx, 0.042, 0.035), L.skull ? 0.06 : 0.092, 0.075, 0.2), "foot" + sd, footC, footR);
    R.add(gBall(V3(hx, 0.045, 0.13), L.skull ? 0.035 : 0.048, 1, 0.8, 1.0, 10), "foot" + sd, footC, footR);
  }

  const t = top.type;
  if ((t === "robe" || t === "coat") && !L.skull) {
    const bottom = t === "robe" ? 0.1 : knee - 0.08;
    const h = hipJ + 0.05 - bottom;
    for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
      const skTop = 0.158 * gi * (fem ? 1.08 : 1);
      R.add(gCyl(V3(0, bottom + h / 2, 0), skTop, 0.23 * gi, h, 12, true, s > 0 ? 0 : Math.PI, Math.PI).scale(1, 1, 0.78), "thigh" + sd, topC, topR);
      if (top.trim) R.add(gCyl(V3(0, bottom + 0.035, 0), 0.228 * gi, 0.232 * gi, 0.07, 12, true, s > 0 ? 0 : Math.PI, Math.PI).scale(1, 1, 0.78), "thigh" + sd, top.trim, "trim", !!top.glowTrim);
    }
    if (top.trim) R.add(gRing(V3(0, neckY - 0.02, 0.01), 0.075 * gi, 0.016, "y", 18), "chest", top.trim, "trim", !!top.glowTrim);
    R.add(gRing(V3(0, hipsY + 0.03, 0), (fem ? 0.165 : 0.152) * gi * (fem ? 1.08 : 1) + 0.006, 0.02, "y", 18).scale(1, 1, 0.72), "hips", top.trim || 0x4a3020, "cloth");
    if (t === "robe") R.add(gBox(V3(0.05, hipsY - 0.12, 0.13), 0.05, 0.22, 0.015), "hips", top.trim || 0x4a3020, "cloth");
  }
  if (t === "tunic" || t === "mail" || t === "plate" || t === "tabard" || t === "rags") {
    const c = t === "mail" || t === "plate" ? (top.plate || 0x9aa0a8) : topC;
    R.add(gCyl(V3(0, hipsY - 0.09, 0), 0.155 * gi * (fem ? 1.08 : 1), 0.19 * gi, 0.2, 14, true).scale(1, 1, 0.76), "hips", c, t === "mail" || t === "plate" ? "metal" : topR);
  }
  if (t === "plate" && !L.skull) {
    const W2 = sw / 0.195, pc = top.plate || 0x9aa0a8;
    R.add(gFront(V3(0, chestY + 0.02, 0.0), 0.18 * gi * W2, 1.9, Math.PI * 0.18, Math.PI * 0.62, 1.0, 1.25, 0.72 * gi, 14), "chest", pc, "metal");
    R.add(gFront(V3(0, (spineY + chestY) / 2 - 0.02, 0.0), 0.165 * gi * W2, 1.7, Math.PI * 0.32, Math.PI * 0.68, 1.0, 1.0, 0.7 * gi, 12), "spine", pc, "metal");
    if (top.trim) R.add(gRing(V3(0, neckY - 0.03, 0.01), 0.08 * gi, 0.014, "y", 18), "chest", top.trim, "trim", !!top.glowTrim);
  }
  if (L.collar && !L.skull) R.add(gRing(V3(0, neckY - 0.035, 0), 0.1 * gi, 0.045, "y", 16), "chest", L.collar, "fur");
  if (t === "tabard") {
    R.add(gBox(V3(0, chestY - 0.12, 0.125 * gi), 0.2, 0.62, 0.012), "chest", top.color2, "cloth");
    R.add(gBox(V3(0, chestY - 0.12, -0.125 * gi), 0.2, 0.62, 0.012), "chest", top.color2, "cloth");
  }
  if (t === "apron") R.add(gBox(V3(0, hipsY - 0.05, 0.13 * gi), 0.26, 0.55, 0.012), "hips", top.color2, "leather");
  if (t === "fur") R.add(gRing(V3(0, neckY - 0.04, 0), 0.12 * gi, 0.06, "y", 14), "chest", topC, "fur");
  if (t === "rags") for (let k = 0; k < 5; k++) R.add(gBox(V3(Math.cos(k * 1.3) * 0.15, hipsY - 0.3, Math.sin(k * 1.3) * 0.12), 0.06, 0.22, 0.01, 0, k * 1.3, 0), "hips", topC, "cloth");
  if (L.belt && t !== "robe" && t !== "coat" && !L.skull) {
    const bR = (fem ? 0.165 : 0.152) * gi * (fem ? 1.08 : 1) + 0.006;
    R.add(gRing(V3(0, hipsY + 0.03, 0), bR, 0.018, "y", 18).scale(1, 1, 0.72), "hips", L.belt, "leather");
    R.add(gBox(V3(0, hipsY + 0.03, bR * 0.72 + 0.006), 0.05, 0.04, 0.012), "hips", 0xc8a040, "metal");
  }
  if (L.cape) {
    R.bone("cape", "chest", 0, shY, -0.15 * gi);
    R.add(gBox(V3(0, (shY + knee) / 2 + 0.02, -0.15 * gi), sw * 2.0, shY - knee, 0.02, 0.1, 0, 0), "cape", L.cape, "cloth");
    R.add(gRing(V3(0, neckY - 0.03, 0), 0.085 * gi, 0.025, "y", 16), "chest", L.cape, "cloth");
  }
  if (L.sack) {
    R.add(gBall(V3(0, chestY - 0.02, -0.2), 0.17, 1, 1.1, 0.9, 12), "chest", 0x8a7350, "leather");
    R.add(gRing(V3(0, chestY + 0.14, -0.2), 0.06, 0.02, "y", 10), "chest", 0x5a4630, "leather");
  }

  const H = L.head;
  if (H) {
    const hp = V3(0, hc + 0.005, 0);
    if (H.type === "cap" || H.type === "helm" || H.type === "horned") {
      R.add(gPartSphere(hp, hr * 1.13, 0, Math.PI * 0.37, 1, 1.05, 1.05, 18), "head", H.color, "metal");
      R.add(gRing(V3(0, hc + hr * 0.47, 0), hr * 1.07, 0.014, "y", 22), "head", H.color, "metal");
      if (H.type !== "cap") {
        R.add(gBox(V3(0, hc - hr * 0.1, hr * 1.08), 0.022, hr * 0.8, 0.02), "head", H.color, "metal");
        for (const s of [-1, 1]) R.add(gBox(V3(s * hr * 0.95, hc - hr * 0.35, 0), 0.02, hr * 0.8, hr * 1.2), "head", H.color, "metal");
      }
      if (H.type === "horned") for (const s of [-1, 1]) {
        const a = V3(s * hr * 0.9, hc + hr * 0.45, 0), b = V3(s * hr * 1.6, hc + hr * 1.0, -hr * 0.1), c = V3(s * hr * 1.7, hc + hr * 1.75, hr * 0.2);
        R.add(gTaper(a, b, hr * 0.22, hr * 0.14, 8), "head", H.color2, "bone");
        R.add(gTaper(b, c, hr * 0.14, 0.004, 8), "head", H.color2, "bone");
      }
    } else if (H.type === "hood") {
      R.add(gPartSphere(hp, hr * 1.2, 2.2, Math.PI * 0.75, 1, 1.05, 1.05, 18), "head", H.color, "cloth");
      R.add(gBall(V3(0, neckY + 0.02, -0.08), 0.13, 1.2, 1.0, 0.6, 12), "head", H.color, "cloth");
    } else if (H.type === "pointy") {
      R.add(gCyl(V3(0, hc + hr * 0.5, 0), hr * 2.3, hr * 2.3, 0.02, 22), "head", H.color, "cloth");
      R.add(gCyl(V3(0, hc + hr * 0.5 + 0.17, 0), hr * 0.5, hr * 1.08, 0.34, 16), "head", H.color, "cloth");
      R.add(gTaper(V3(0, hc + hr * 0.5 + 0.33, 0), V3(0, hc + hr * 0.5 + 0.5, -0.14), hr * 0.52, 0.01, 10), "head", H.color, "cloth");
    } else if (H.type === "bandana") {
      R.add(gPartSphere(hp, hr * 1.08, 0, Math.PI * 0.38, 1, 1.04, 1.04, 16), "head", H.color, "cloth");
      R.add(gBall(V3(0, hc + hr * 0.25, -hr * 1.05), hr * 0.22, 1.3, 1, 1, 8), "head", H.color, "cloth");
      R.add(gBox(V3(0.03, hc - hr * 0.2, -hr * 1.08), 0.04, 0.16, 0.01, 0.2, 0, 0.2), "head", H.color, "cloth");
    } else if (H.type === "feathered") {
      R.add(gCyl(V3(0, hc + hr * 0.45, 0), hr * 1.75, hr * 1.75, 0.02, 20), "head", H.color, "cloth");
      R.add(gPartSphere(V3(0, hc + hr * 0.42, 0), hr * 1.02, 0, Math.PI * 0.5, 1, 1.0, 1.0, 16), "head", H.color, "cloth");
      R.add(gRing(V3(0, hc + hr * 0.5, 0), hr * 1.02, 0.012, "y", 18), "head", H.color2 || 0xd8c070, "trim");
      R.add(gTaper(V3(hr * 0.5, hc + hr * 0.75, -hr * 0.6), V3(hr * 1.3, hc + hr * 2.0, -hr * 1.5), 0.028, 0.004, 6, 0.3), "head", 0xf4f1e8, "feather");
    } else if (H.type === "crown") {
      const cc = H.color || 0xd8b040, cr = hr * (L.hair && L.hair.style !== "bald" ? 1.04 : 0.95);
      R.add(gRing(V3(0, hc + hr * 0.55, 0), cr, 0.02, "y", 18), "head", cc, "metal");
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gTaper(V3(Math.sin(a) * cr, hc + hr * 0.55, Math.cos(a) * cr), V3(Math.sin(a) * cr * 1.05, hc + hr * 0.95, Math.cos(a) * cr * 1.05), 0.025, 0.003, 5), "head", cc, "metal"); }
      if (H.gem) R.add(gBall(V3(0, hc + hr * 0.6, cr + 0.012), 0.022, 1, 1.3, 0.6, 8), "head", H.gem, "glow", true);
    } else if (H.type === "furhat") {
      R.add(gPartSphere(hp, hr * 1.14, 0, Math.PI * 0.42, 1, 1.12, 1.05, 16), "head", H.color, "fur");
      R.add(gRing(V3(0, hc + hr * 0.4, 0), hr * 1.1, hr * 0.2, "y", 18), "head", new THREE.Color(H.color).multiplyScalar(1.25).getHex(), "fur");
      for (const s of [-1, 1]) R.add(gBall(V3(s * hr * 1.0, hc - hr * 0.2, -hr * 0.05), hr * 0.3, 0.5, 1.2, 0.9, 8), "head", H.color, "fur");
    } else if (H.type === "widebrim") {
      R.add(gCyl(V3(0, hc + hr * 0.42, 0), hr * 2.0, hr * 2.05, 0.018, 22), "head", H.color, "leather");
      R.add(gPartSphere(V3(0, hc + hr * 0.4, 0), hr * 1.04, 0, Math.PI * 0.5, 1, 0.9, 1.0, 16), "head", H.color, "leather");
      R.add(gRing(V3(0, hc + hr * 0.47, 0), hr * 1.03, 0.012, "y", 18), "head", 0x5a3a20, "leather");
      for (let k = 0; k < 2; k++) R.add(gTaper(V3(hr * (0.6 + k * 0.15), hc + hr * 0.65, -hr * 0.55), V3(hr * (1.3 + k * 0.3), hc + hr * (1.7 - k * 0.3), -hr * 1.4), 0.03, 0.004, 6, 0.3), "head", H.color2 || 0xf4f1e8, "feather");
    }
  }

  if (L.tail) {
    const cat = L.tail === "cat", tz = -(0.12 * gi * (sw / 0.195) + 0.02), tc = cat ? L.hair.color : (L.hair && L.hair.color) || skin;
    R.bone("tail", "hips", 0, hipsY - 0.04, tz);
    R.bone("tail2", "tail", 0, hipsY - (cat ? 0.32 : 0.26), tz - (cat ? 0.2 : 0.22));
    if (cat) {
      R.add(gTaper(V3(0, hipsY - 0.04, tz), V3(0, hipsY - 0.32, tz - 0.2), 0.03, 0.026, 8), "tail", tc, "hair");
      R.add(gTaper(V3(0, hipsY - 0.32, tz - 0.2), V3(0, hipsY - 0.24, tz - 0.48), 0.026, 0.012, 8), "tail2", tc, "hair");
    } else {
      R.add(gTaper(V3(0, hipsY - 0.04, tz), V3(0, hipsY - 0.26, tz - 0.22), 0.07, 0.055, 8), "tail", tc, "hair");
      R.add(gTaper(V3(0, hipsY - 0.26, tz - 0.22), V3(0, hipsY - 0.5, tz - 0.3), 0.055, 0.02, 8), "tail2", tc, "hair");
    }
  }
  R.meta = { kind: "human", race: L.doll ? "pipkin" : L.ears === "ursan" ? "ursan" : L.ears === "cat" ? "nekari" : L.ears === "elf" ? "elari" : "human", hipsY, chestY, backZ: -(0.176 * 0.66 * gi * (sw / 0.195) * 1.04 + 0.03), headTop: hc + hr * (L.head && L.head.type === "pointy" ? 4.2 : L.head && L.head.type === "horned" ? 2.1 : 1.2), hand: "handR", wrY };
  return R.finish();
}

function goblinLook(variant) {
  const base = { noFace: true, ears: "goblin", nose: "goblin", eyesGlow: 0xffd040, barefoot: true, sack: true, legs: 0x5a4632, belt: 0x3a2a1a };
  if (variant === "chieftain") return Object.assign(base, { skin: 0x6a7a34, top: { type: "mail", color: 0x55585e, region: "chain" }, head: { type: "horned", color: 0x4a4a44, color2: 0xe8dcc0 }, cape: 0x8a1f1f, pauldrons: 0x6a6a64, weapon: "greataxe", sack: false, prop: { leg: 0.62, torso: 0.56, headR: 0.18, arm: 0.62, shoulder: 0.22, hip: 0.11, neck: 0.04, girth: 1.25 } });
  const p = { leg: 0.5, torso: 0.42, headR: 0.16, arm: 0.5, shoulder: 0.165, hip: 0.09, neck: 0.04, girth: 1.05 };
  if (variant === "raider") return Object.assign(base, { skin: 0x6a7a40, top: { type: "tunic", color: 0x4a3a2a, region: "leather" }, head: { type: "cap", color: 0x55585e }, weapon: "dagger", prop: p });
  if (variant === "frost") return Object.assign(base, { skin: 0x7a8a6a, top: { type: "fur", color: 0xd8d0c0, region: "fur", sleeves: "none" }, head: { type: "hood", color: 0xc8c0b0 }, legs: 0x5a5048, boots: 0x3a3028, weapon: "dagger", prop: p });
  if (variant === "rimefang") return Object.assign(base, { skin: 0x6a7a5a, top: { type: "mail", color: 0x6a7480, region: "chain" }, cape: 0xd8d0c0, pauldrons: 0x8a94a0, head: { type: "horned", color: 0x5a6470, color2: 0xe8f4ff }, eyesGlow: 0x80d8ff, weapon: "greataxe", sack: false, prop: Object.assign({}, p, { girth: 1.2, headR: 0.17, torso: 0.47 }) });
  if (variant === "mire") return Object.assign(base, { skin: 0x5f7040, top: { type: "tunic", color: 0x3a4a30, region: "leather" }, head: { type: "hood", color: 0x4a5a3a }, legs: 0x3a3428, weapon: "dagger", prop: p });
  if (variant === "gax") return Object.assign(base, { skin: 0x56683a, top: { type: "mail", color: 0x4a5048, region: "chain" }, head: { type: "horned", color: 0x3a3f36, color2: 0xd8cca8 }, cape: 0x2f4a2a, eyesGlow: 0xffab40, weapon: "greataxe", sack: false, prop: Object.assign({}, p, { girth: 1.2, headR: 0.17, torso: 0.47 }) });
  if (variant === "grimtooth") return Object.assign(base, { skin: 0x8a8a3a, top: { type: "vest", color: 0x5a2a20, region: "leather", under: 0x3a2a1a }, head: { type: "bandana", color: 0x2a2a2a }, eyesGlow: 0xff3a2a, weapon: "dagger", prop: p });
  return Object.assign(base, { skin: 0x7f9150, top: { type: "vest", color: 0x6a4a30, region: "leather", under: 0x8a7a5a }, head: { type: "bandana", color: 0x9a2a22 }, weapon: "dagger", prop: p });
}

function batEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.35;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.07, 0.15);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("wing" + sd, "body", s * 0.09, Y + 0.02, 0);
    R.bone("wing2" + sd, "wing" + sd, s * 0.45, Y + 0.03, -0.02);
  }
  const fur = col, dark = new THREE.Color(col).multiplyScalar(0.55).getHex(), light = new THREE.Color(col).lerp(new THREE.Color(0xc8b8a0), 0.4).getHex();
  R.add(gBall(V3(0, Y, 0), 0.15, 1, 0.95, 1.25, 14), "body", fur, "fur");
  R.add(gBall(V3(0, Y - 0.03, 0.05), 0.12, 0.85, 0.85, 1.1, 12), "body", light, "fur");
  R.add(gBall(V3(0, Y + 0.08, 0.17), 0.1, 1, 0.95, 1.05, 12), "head", fur, "fur");
  R.add(gBall(V3(0, Y + 0.06, 0.26), 0.045, 1, 0.8, 1.2, 8), "head", dark, "skin");
  for (const s of [-1, 1]) {
    R.add(gTaper(V3(s * 0.05, Y + 0.13, 0.15), V3(s * 0.1, Y + 0.28, 0.11), 0.045, 0.004, 6, 0.45), "head", dark, "skin");
    R.add(gBall(V3(s * 0.042, Y + 0.1, 0.255), 0.02, 1, 1, 0.6, 6), "head", eye || 0xff3030, "glow", true);
    R.add(gTaper(V3(s * 0.016, Y + 0.035, 0.28), V3(s * 0.016, Y - 0.005, 0.285), 0.008, 0.001, 4), "head", 0xf0ece0, "bone");
    const mem1 = [[0.06, 0.07], [0.45, 0.09], [0.45, -0.24], [0.32, -0.16], [0.2, -0.26], [0.06, -0.15]].map(([x, z]) => [s * x, z]);
    const mem2 = [[0.45, 0.09], [0.92, 0.03], [0.8, -0.12], [0.68, -0.09], [0.58, -0.22], [0.45, -0.24]].map(([x, z]) => [s * x, z]);
    R.add(gMembrane(mem1, Y + 0.02), "wing" + (s > 0 ? "L" : "R"), dark, "skin");
    R.add(gMembrane(mem2, Y + 0.03), "wing2" + (s > 0 ? "L" : "R"), dark, "skin");
    R.add(gTaper(V3(s * 0.08, Y + 0.02, 0.07), V3(s * 0.45, Y + 0.03, 0.08), 0.014, 0.01, 6), "wing" + (s > 0 ? "L" : "R"), fur, "fur");
    R.add(gTaper(V3(s * 0.45, Y + 0.03, 0.08), V3(s * 0.92, Y + 0.035, 0.03), 0.01, 0.004, 6), "wing2" + (s > 0 ? "L" : "R"), fur, "fur");
    R.add(gTaper(V3(s * 0.05, Y - 0.1, -0.05), V3(s * 0.06, Y - 0.22, -0.08), 0.012, 0.006, 5), "body", dark, "skin");
  }
  R.meta = { kind: "bat", headTop: Y + 0.3 };
  return R.finish();
}

function bombEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.0;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y, 0);
  const dark = new THREE.Color(col).multiplyScalar(0.55).getHex(), light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.45).getHex();
  R.add(gBall(V3(0, Y, 0), 0.32, 1, 1, 1, 16), "body", col, "glow", true);
  R.add(gBall(V3(0, Y + 0.1, -0.1), 0.2, 1, 0.9, 1, 10), "body", light, "glow", true);
  for (const s of [-1, 1]) { R.add(gBall(V3(s * 0.12, Y + 0.08, 0.27), 0.07, 1, 1.3, 0.5, 8), "head", dark, "plain"); R.add(gBall(V3(s * 0.12, Y + 0.09, 0.31), 0.03, 1, 1, 0.5, 6), "head", eye, "glow", true); }
  R.add(gBall(V3(0, Y - 0.1, 0.28), 0.12, 1.6, 0.4, 0.5, 8), "head", dark, "plain");
  for (let k = 0; k < 4; k++) R.add(gBall(V3(0, Y - 0.12 - k * 0.08, 0.3 + (k % 2) * 0.02 - 0.03 * k), 0.03, 1, 1.2, 0.6, 5), "head", 0xf0f0e0, "bone");
  R.add(gTaper(V3(0, Y + 0.3, -0.05), V3(0.05, Y + 0.5, -0.12), 0.04, 0.025, 6), "body", 0x3a2a22, "wood");
  R.add(gBall(V3(0.06, Y + 0.54, -0.14), 0.07, 1, 1.3, 1, 8), "body", 0xffe082, "glow", true);
  R.meta = { kind: "bat", headTop: Y + 0.65 };
  return R.finish();
}

function birdEntry(col, comb, beak) {
  const R = new RigBuilder();
  const Y = 0.22;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.12, 0.09);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("leg" + sd, "body", s * 0.04, Y - 0.05, 0); R.bone("wing" + sd, "body", s * 0.08, Y + 0.03, 0); }
  const dark = new THREE.Color(col).multiplyScalar(0.75).getHex();
  R.add(gBall(V3(0, Y, 0), 0.1, 0.85, 0.85, 1.2, 10), "body", col, "feather");
  R.add(gTaper(V3(0, Y + 0.02, -0.1), V3(0, Y + 0.1, -0.18), 0.05, 0.01, 6, 0.4), "body", dark, "feather");
  R.add(gBall(V3(0, Y + 0.14, 0.1), 0.055, 1, 1, 1, 8), "head", col, "feather");
  R.add(gTaper(V3(0, Y + 0.13, 0.15), V3(0, Y + 0.12, 0.2), 0.016, 0.002, 5), "head", beak || 0xe8a030, "bone");
  if (comb) R.add(gBall(V3(0, Y + 0.2, 0.1), 0.03, 0.4, 1, 1.2, 6), "head", comb, "plain");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.035, Y + 0.155, 0.135), 0.009, 1, 1, 0.6, 5), "head", 0x111111, "plain");
    R.add(gTaper(V3(s * 0.04, Y - 0.05, 0), V3(s * 0.04, 0.01, 0.01), 0.008, 0.007, 5), "leg" + sd, 0xe8a030, "bone");
    R.add(gBall(V3(s * 0.08, Y + 0.02, -0.01), 0.07, 0.25, 0.7, 1.1, 8), "wing" + sd, dark, "feather");
  }
  R.meta = { kind: "bird", headTop: 0.45 };
  return R.finish();
}

function walkerLook(seed) {
  const r = seeded(hashStr("walker" + seed));
  const fem = r() < 0.5, pick = a => a[Math.floor(r() * a.length)];
  return { face: Math.floor(r() * FACE_COUNT), build: fem ? 1 : 0, skin: SKIN_TONES[Math.floor(r() * SKIN_TONES.length)], hair: { style: pick(HAIR_BY_SEX[fem ? 1 : 0]), color: pick(HAIR_COLORS) }, top: { type: pick(["shirt", "vest", "apron", "tunic"]), color: pick([0x8a5a3a, 0x3a5a7a, 0x6a7a3a, 0x7a3a3a, 0xc8b890, 0x5a4a6a]), color2: 0xd8d0c0, under: 0xd8cfb8 }, legs: pick([0x3a3028, 0x2a2a30, 0x4a3a2c]), boots: 0x2a1a10, belt: 0x3a2412 };
}

function wispEntry(col, eye) {
  const R = new RigBuilder();
  const Y = 1.3;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y, 0);
  const light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.5).getHex();
  R.add(gBall(V3(0, Y, 0), 0.17, 1, 1.1, 1, 14), "body", col, "glow", true);
  R.add(gBall(V3(0, Y + 0.02, 0.04), 0.1, 1, 1, 1, 10), "body", light, "glow", true);
  for (const s of [-1, 1]) R.add(gBall(V3(s * 0.06, Y + 0.03, 0.14), 0.025, 1, 1.3, 0.6, 6), "head", eye || 0xffffff, "glow", true);
  for (let i = 0; i < 3; i++) R.add(gTaper(V3(0, Y - 0.08 - i * 0.02, -0.1 - i * 0.1), V3((i - 1) * 0.06, Y - 0.3 - i * 0.08, -0.3 - i * 0.12), 0.05 - i * 0.012, 0.004, 6), "body", col, "glow", true);
  R.meta = { kind: "bat", headTop: Y + 0.25 };
  return R.finish();
}

function beeEntry(col, col2) {
  const R = new RigBuilder();
  const Y = 0.95;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.02, 0.2);
  R.bone("tail", "body", 0, Y - 0.02, -0.2);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("wing" + sd, "body", s * 0.06, Y + 0.12, 0.02); R.bone("wing2" + sd, "body", s * 0.05, Y + 0.11, -0.08); }
  const dark = 0x2a2218, light = new THREE.Color(col).lerp(new THREE.Color(0xffffff), 0.3).getHex();
  R.add(gBall(V3(0, Y, 0.02), 0.16, 1, 0.9, 1.1, 14), "body", col, "fur");
  R.add(gBall(V3(0, Y - 0.03, -0.27), 0.19, 1, 0.9, 1.7, 14), "tail", col2 || dark, "fur");
  for (let i = 0; i < 4; i++) R.add(gRing(V3(0, Y - 0.03, -0.12 - i * 0.1), 0.18 - i * 0.025, 0.022, "z", 16), "tail", i % 2 ? col : dark, "fur");
  R.add(gTaper(V3(0, Y - 0.06, -0.56), V3(0, Y - 0.1, -0.74), 0.035, 0.003, 6), "tail", dark, "bone");
  R.add(gBall(V3(0, Y + 0.02, 0.24), 0.11, 1, 0.95, 0.9, 12), "head", dark, "fur");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.07, Y + 0.05, 0.3), 0.045, 1, 1.3, 0.8, 8), "head", 0x8a1a1a, "glow", true);
    R.add(gTaper(V3(s * 0.03, Y + 0.11, 0.28), V3(s * 0.12, Y + 0.3, 0.34), 0.012, 0.004, 5), "head", dark, "bone");
    R.add(gMembrane([[0.04, 0.08], [0.42, 0.12], [0.48, 0.0], [0.32, -0.12], [0.06, -0.08]].map(([x, z]) => [s * x, z]), Y + 0.12), "wing" + sd, 0xe8f4ff, "glow");
    R.add(gMembrane([[0.03, 0.0], [0.4, -0.02], [0.45, -0.14], [0.25, -0.2], [0.05, -0.12]].map(([x, z]) => [s * x, z]), Y + 0.11), "wing2" + sd, 0xe8f4ff, "glow");
    for (let k = 0; k < 3; k++) R.add(gTaper(V3(s * 0.1, Y - 0.08, 0.12 - k * 0.1), V3(s * 0.2, Y - 0.24, 0.1 - k * 0.1), 0.012, 0.004, 5), "body", dark, "bone");
  }
  R.meta = { kind: "bee", headTop: Y + 0.35 };
  return R.finish();
}

function crawlerEntry(col, col2) {
  const R = new RigBuilder();
  const n = 6, Y0 = 0.27;
  const zs = []; for (let i = 0; i < n; i++) zs.push(-0.7 + i * 0.28);
  const lift = i => i >= n - 2 ? (i - (n - 3)) * 0.07 : 0;
  R.bone("root", null, 0, 0, 0);
  for (let i = 0; i < n; i++) R.bone("t" + i, i ? "t" + (i - 1) : "root", 0, Y0 + lift(i), zs[i]);
  R.bone("head", "t" + (n - 1), 0, Y0 + lift(n) + 0.02, zs[n - 1] + 0.22);
  const c = new THREE.Color(col), dark = c.clone().multiplyScalar(0.55).getHex(), belly = col2 || c.clone().lerp(new THREE.Color(0xf0e4b0), 0.5).getHex();
  for (let i = 0; i < n; i++) {
    const Y = Y0 + lift(i);
    const r = 0.205 + 0.025 * Math.sin(i / (n - 1) * Math.PI);
    R.add(gBall(V3(0, Y + 0.02, zs[i]), r, 1.05, 0.9, 1.0, 12), "t" + i, col, "scale");
    R.add(gBall(V3(0, Y - 0.05, zs[i]), r * 0.8, 1, 0.55, 0.9, 10), "t" + i, belly, "skin");
    R.add(gRing(V3(0, Y + 0.02, zs[i] + 0.14), r * 0.95, 0.018, "z", 16), "t" + i, dark, "scale");
    for (const s of [-1, 1]) { R.add(gTaper(V3(s * 0.14, Y - 0.06, zs[i]), V3(s * 0.26, Y0 - 0.24, zs[i] + 0.02), 0.035, 0.014, 5), "t" + i, dark, "skin"); R.add(gBall(V3(s * 0.26, Y0 - 0.25, zs[i] + 0.02), 0.032, 1, 0.6, 1, 6), "t" + i, dark, "skin"); }
    if (i % 2) R.add(gTaper(V3(0, Y + 0.17, zs[i]), V3(0, Y + 0.3, zs[i] - 0.04), 0.03, 0.004, 5), "t" + i, dark, "bone");
  }
  const hz = zs[n - 1] + 0.22, Y = Y0 + lift(n);
  R.add(gBall(V3(0, Y + 0.02, hz), 0.2, 1.1, 0.95, 1.05, 12), "head", dark, "scale");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.09, Y + 0.08, hz + 0.12), 0.05, 1, 1.2, 0.8, 8), "head", 0xffb300, "glow", true);
    R.add(gTaper(V3(s * 0.08, Y - 0.02, hz + 0.14), V3(s * 0.04, Y - 0.06, hz + 0.3), 0.03, 0.004, 5), "head", 0xf0e8d0, "bone");
    R.add(gTaper(V3(s * 0.05, Y + 0.14, hz + 0.08), V3(s * 0.18, Y + 0.34, hz + 0.16), 0.012, 0.003, 5), "head", dark, "bone");
  }
  R.meta = { kind: "crawler", headTop: 0.72 };
  return R.finish();
}

function quadEntry(o) {
  const R = new RigBuilder();
  const L = o.leg, B = o.bodyY, bl = o.bodyLen;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, B, 0);
  R.bone("neck", "body", 0, B + o.neckUp * 0.3, bl * 0.45);
  R.bone("head", "neck", 0, B + o.neckUp, bl * 0.45 + o.neckFwd);
  R.bone("tail", "body", 0, B, -bl * 0.5);
  R.bone("tail2", "tail", 0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("legF" + sd, "body", s * o.hip, B - 0.02, bl * 0.32);
    R.bone("shinF" + sd, "legF" + sd, s * o.hip, B - L * 0.5, bl * 0.32);
    R.bone("legB" + sd, "body", s * o.hip, B - 0.02, -bl * 0.32);
    R.bone("shinB" + sd, "legB" + sd, s * o.hip, B - L * 0.5, -bl * 0.32);
  }
  const col = o.col, reg = o.region || "fur", dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), light = o.belly || new THREE.Color(col).lerp(new THREE.Color(0xf2ede4), 0.45).getHex();
  R.add(gBall(V3(0, B, 0), o.bodyR, 1, o.bodyH || 0.95, bl / o.bodyR * 0.5, 16), "body", col, reg);
  if (o.wool) for (let k = 0; k < 10; k++) { const a = k * 2.4; R.add(gBall(V3(Math.sin(a) * o.bodyR * 0.7, B + o.bodyR * 0.45 + (k % 2) * 0.05, Math.cos(a) * bl * 0.4), o.bodyR * 0.45, 1, 0.9, 1, 8), "body", light, "fur"); }
  R.add(gBall(V3(0, B - o.bodyR * 0.25, 0), o.bodyR * 0.85, 0.95, 0.7, bl / o.bodyR * 0.45, 12), "body", light, reg);
  R.add(gTaper(V3(0, B + o.neckUp * 0.2, bl * 0.42), V3(0, B + o.neckUp, bl * 0.45 + o.neckFwd), o.neckR, o.neckR * 0.8, 8), "neck", col, reg);
  const hy = B + o.neckUp, hz = bl * 0.45 + o.neckFwd;
  R.add(gBall(V3(0, hy, hz + 0.04), o.headR, 1, 0.95, 1.25, 12), "head", col, reg);
  R.add(gBall(V3(0, hy - o.headR * 0.15, hz + o.headR * 1.1), o.headR * 0.55, 1, 0.75, 0.9, 8), "head", light, reg);
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * o.headR * 0.6, hy + o.headR * 0.2, hz + o.headR * 0.7), o.headR * 0.17, 1, 1, 0.7, 6), "head", o.eye || 0x111111, o.eyeGlow ? "glow" : "plain", !!o.eyeGlow);
    if (o.ears) R.add(gBall(V3(s * o.headR * 0.8, hy + o.headR * 0.6, hz - 0.02), o.headR * 0.25, 0.5, o.ears, 0.4, 6), "head", col, reg);
    if (o.horns) R.add(gTaper(V3(s * o.headR * 0.5, hy + o.headR * 0.7, hz - 0.02), V3(s * o.headR * 1.2, hy + o.headR * 0.5, hz - 0.2), o.headR * 0.18, 0.006, 6), "head", 0xd8ccb0, "bone");
    const sd = s > 0 ? "L" : "R";
    for (const [p, zz] of [["F", bl * 0.32], ["B", -bl * 0.32]]) {
      R.add(gTaper(V3(s * o.hip, B - 0.02, zz), V3(s * o.hip * 1.05, B - L * 0.5, zz), o.legR, o.legR * 0.8, 7), "leg" + p + sd, col, reg);
      R.add(gTaper(V3(s * o.hip * 1.05, B - L * 0.5, zz), V3(s * o.hip * 1.05, 0.03, zz + 0.02), o.legR * 0.8, o.legR * 0.6, 7), "shin" + p + sd, col, reg);
      R.add(gBall(V3(s * o.hip * 1.05, 0.03, zz + 0.03), o.legR * 0.95, 1.1, 0.5, 1.3, 7), "shin" + p + sd, dark, o.hoof ? "bone" : reg);
    }
  }
  if (o.tailLen > 0) {
    R.add(gTaper(V3(0, B, -bl * 0.5), V3(0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5), o.tailR, o.tailR * 0.7, 7), "tail", col, reg);
    R.add(gTaper(V3(0, B - o.tailDrop * 0.5, -bl * 0.5 - o.tailLen * 0.5), V3(0, B - o.tailDrop, -bl * 0.5 - o.tailLen), o.tailR * 0.7, o.tailR * 0.2, 7), "tail2", col, reg);
  }
  if (o.spines) for (let k = 0; k < o.spines; k++) R.add(gTaper(V3(0, B + o.bodyR * 0.85, bl * 0.35 - k * (bl * 0.7 / o.spines)), V3(0, B + o.bodyR * 0.85 + 0.12, bl * 0.35 - k * (bl * 0.7 / o.spines) - 0.04), 0.03, 0.004, 5), "body", dark, "bone");
  R.meta = { kind: "quad", headTop: hy + o.headR * 1.4, quad: { stride: o.stride || 1.2, hop: !!o.hop } };
  return R.finish();
}

function sheepEntry(col) { return quadEntry({ col, belly: 0xf4f0e6, bodyY: 0.55, bodyR: 0.3, bodyLen: 0.74, leg: 0.47, hip: 0.14, legR: 0.045, neckUp: 0.1, neckFwd: 0.18, neckR: 0.09, headR: 0.13, ears: 1.4, hoof: true, wool: true, tailLen: 0.1, tailDrop: 0.05, tailR: 0.05, stride: 1.1 }); }
function lizardEntry(col, belly) { return quadEntry({ col, belly, region: "scale", bodyY: 0.22, bodyR: 0.18, bodyLen: 0.7, leg: 0.2, hip: 0.22, legR: 0.045, neckUp: 0.04, neckFwd: 0.22, neckR: 0.1, headR: 0.13, eye: 0xffd54f, eyeGlow: true, tailLen: 0.7, tailDrop: 0.1, tailR: 0.1, spines: 5, stride: 0.9 }); }
function longneckEntry(col) { return quadEntry({ col, bodyY: 1.3, bodyR: 0.45, bodyLen: 1.5, leg: 1.1, hip: 0.22, legR: 0.08, neckUp: 1.0, neckFwd: 0.5, neckR: 0.13, headR: 0.17, ears: 1.2, hoof: true, tailLen: 0.5, tailDrop: 0.3, tailR: 0.08, stride: 2.4 }); }

function crabEntry(col, col2) {
  const R = new RigBuilder();
  const Y = 0.22;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("arm" + sd, "body", s * 0.25, Y, 0.18);
    R.bone("claw" + sd, "arm" + sd, s * 0.42, Y + 0.02, 0.32);
    for (let k = 0; k < 4; k++) R.bone("leg" + sd + k, "body", s * 0.28, Y - 0.02, 0.1 - k * 0.1);
  }
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), under = col2 || new THREE.Color(col).lerp(new THREE.Color(0xf0dcc0), 0.5).getHex();
  R.add(gBall(V3(0, Y, 0), 0.34, 1, 0.5, 0.8, 16), "body", col, "scale");
  R.add(gBall(V3(0, Y - 0.06, 0), 0.3, 0.95, 0.4, 0.75, 12), "body", under, "skin");
  for (let k = 0; k < 5; k++) R.add(gBall(V3(-0.24 + k * 0.12, Y + 0.14, 0.16), 0.035, 1, 0.8, 1, 6), "body", dark, "scale");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gTaper(V3(s * 0.06, Y + 0.1, 0.24), V3(s * 0.07, Y + 0.24, 0.26), 0.02, 0.03, 6), "body", dark, "bone");
    R.add(gBall(V3(s * 0.07, Y + 0.25, 0.26), 0.04, 1, 1, 1, 6), "body", 0x111111, "plain");
    R.add(gTaper(V3(s * 0.25, Y, 0.18), V3(s * 0.42, Y + 0.02, 0.32), 0.055, 0.05, 7), "arm" + sd, col, "scale");
    R.add(gBall(V3(s * 0.48, Y + 0.02, 0.38), 0.11, 1.4, 0.7, 1.1, 10), "claw" + sd, col, "scale");
    R.add(gTaper(V3(s * 0.52, Y + 0.06, 0.44), V3(s * 0.58, Y + 0.08, 0.62), 0.045, 0.006, 6), "claw" + sd, dark, "bone");
    R.add(gTaper(V3(s * 0.52, Y - 0.02, 0.44), V3(s * 0.56, Y - 0.04, 0.6), 0.04, 0.006, 6), "claw" + sd, dark, "bone");
    for (let k = 0; k < 4; k++) {
      const z = 0.1 - k * 0.1;
      R.add(gTaper(V3(s * 0.28, Y - 0.02, z), V3(s * 0.5, Y + 0.08, z - 0.03), 0.03, 0.022, 6), "leg" + sd + k, col, "scale");
      R.add(gTaper(V3(s * 0.5, Y + 0.08, z - 0.03), V3(s * 0.6, 0.02, z - 0.06), 0.022, 0.006, 6), "leg" + sd + k, dark, "scale");
    }
  }
  R.meta = { kind: "crab", headTop: 0.5 };
  return R.finish();
}

function mandrakeEntry(col, leaf) {
  const R = new RigBuilder();
  const Y = 0.32;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.3, 0);
  R.bone("leaf", "head", 0, Y + 0.5, -0.02);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) { R.bone("arm" + sd, "body", s * 0.17, Y + 0.08, 0.02); R.bone("leg" + sd, "body", s * 0.09, Y - 0.14, 0); }
  const dark = new THREE.Color(col).multiplyScalar(0.65).getHex(), lf = leaf || 0x5aa84a, lfd = new THREE.Color(lf).multiplyScalar(0.6).getHex();
  R.add(gBall(V3(0, Y, 0), 0.2, 1, 1.15, 0.95, 14), "body", col, "skin");
  R.add(gBall(V3(0, Y + 0.3, 0.02), 0.19, 1.05, 0.95, 1, 14), "head", col, "skin");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.08, Y + 0.33, 0.17), 0.04, 1, 1.1, 0.6, 8), "head", 0x111111, "plain");
    R.add(gBall(V3(s * 0.08, Y + 0.34, 0.19), 0.012, 1, 1, 0.6, 5), "head", 0xffffff, "plain");
    R.add(gTaper(V3(s * 0.17, Y + 0.08, 0.02), V3(s * 0.3, Y - 0.06, 0.08), 0.045, 0.02, 6), "arm" + sd, dark, "skin");
    R.add(gTaper(V3(s * 0.09, Y - 0.14, 0), V3(s * 0.1, 0.02, 0.03), 0.055, 0.045, 6), "leg" + sd, dark, "skin");
    R.add(gBall(V3(s * 0.1, 0.02, 0.06), 0.06, 1.1, 0.5, 1.4, 7), "leg" + sd, dark, "skin");
  }
  R.add(gBall(V3(0, Y + 0.22, 0.17), 0.05, 1.3, 0.35, 0.5, 8), "head", 0x4a2a2a, "plain");
  R.add(gTaper(V3(0, Y + 0.44, -0.02), V3(0, Y + 0.72, -0.04), 0.03, 0.02, 6), "leaf", lfd, "wood");
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + 0.4; R.add(gBall(V3(Math.cos(a) * 0.16, Y + 0.7, -0.04 + Math.sin(a) * 0.16), 0.14, 1.3, 0.18, 0.6, 8), "leaf", lf, "plain"); }
  R.meta = { kind: "mandrake", headTop: Y + 0.8 };
  return R.finish();
}

function shroomEntry(col, cap) {
  const R = new RigBuilder();
  const Y = 0.3;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("head", "body", 0, Y + 0.3, 0);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) R.bone("arm" + sd, "body", s * 0.16, Y + 0.05, 0);
  const capC = cap || 0xb04a3a, spots = new THREE.Color(capC).lerp(new THREE.Color(0xffffff), 0.7).getHex(), dark = new THREE.Color(col).multiplyScalar(0.7).getHex();
  R.add(gTaper(V3(0, 0.02, 0), V3(0, Y + 0.32, 0), 0.19, 0.14, 12), "body", col, "skin");
  R.add(gBall(V3(0, 0.03, 0), 0.2, 1, 0.3, 1, 10), "body", dark, "skin");
  for (const s of [-1, 1]) { R.add(gBall(V3(s * 0.07, Y + 0.08, 0.14), 0.035, 1, 1.2, 0.6, 8), "body", 0x111111, "plain"); R.add(gTaper(V3(s * 0.16, Y + 0.05, 0), V3(s * 0.3, Y - 0.06, 0.06), 0.04, 0.02, 6), "arm" + (s > 0 ? "L" : "R"), dark, "skin"); }
  R.add(gBall(V3(0, Y - 0.02, 0.15), 0.04, 1.4, 0.3, 0.5, 8), "body", 0x3a2222, "plain");
  R.add(gPartSphere(V3(0, Y + 0.28, 0), 0.42, 0, Math.PI * 0.55, 1, 0.8, 1, 16), "head", capC, "skin");
  R.add(gBall(V3(0, Y + 0.3, 0), 0.4, 1, 0.12, 1, 14), "head", spots, "skin");
  for (let k = 0; k < 6; k++) { const a = k * 1.05, r = 0.12 + (k % 3) * 0.09; R.add(gBall(V3(Math.cos(a) * r, Y + 0.3 + Math.sqrt(Math.max(0, 0.42 * 0.42 - r * r)) * 0.78, Math.sin(a) * r), 0.045, 1, 0.5, 1, 7), "head", spots, "plain"); }
  R.meta = { kind: "shroom", headTop: Y + 0.65 };
  return R.finish();
}

function fishEntry(col, belly) {
  const R = new RigBuilder();
  const Y = 0.4;
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, Y, 0);
  R.bone("tail", "body", 0, Y, -0.3);
  R.bone("tail2", "tail", 0, Y, -0.5);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) R.bone("fin" + sd, "body", s * 0.14, Y - 0.04, 0.08);
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex(), light = belly || new THREE.Color(col).lerp(new THREE.Color(0xf0f4f0), 0.55).getHex();
  R.add(gBall(V3(0, Y, 0), 0.2, 0.75, 1.15, 1.9, 14), "body", col, "scale");
  R.add(gBall(V3(0, Y - 0.06, 0.02), 0.17, 0.65, 0.7, 1.7, 10), "body", light, "scale");
  R.add(gBall(V3(0, Y + 0.18, -0.05), 0.12, 0.25, 1.4, 1.2, 8), "body", dark, "skin");
  R.add(gBall(V3(0, Y + 0.02, 0.34), 0.07, 0.9, 0.6, 1, 8), "body", light, "skin");
  for (const s of [-1, 1]) {
    R.add(gBall(V3(s * 0.11, Y + 0.05, 0.25), 0.04, 1, 1.1, 0.6, 8), "body", 0xffe082, "glow", true);
    R.add(gBall(V3(s * 0.11, Y + 0.05, 0.27), 0.02, 1, 1, 0.6, 5), "body", 0x111111, "plain");
    R.add(gBall(V3(s * 0.25, Y - 0.04, 0.04), 0.16, 0.18, 0.55, 1.15, 8), "fin" + (s > 0 ? "L" : "R"), dark, "skin");
  }
  R.add(gTaper(V3(0, Y, -0.3), V3(0, Y, -0.5), 0.1, 0.05, 8), "tail", col, "scale");
  R.add(gBall(V3(0, Y, -0.62), 0.17, 0.2, 1.3, 0.9, 8), "tail2", dark, "skin");
  R.meta = { kind: "fish", headTop: 0.7 };
  return R.finish();
}

function wormEntry(col) {
  const R = new RigBuilder();
  const Y = 0.32, n = 8;
  const zs = []; for (let i = 0; i < n; i++) zs.push(-1.5 + i * 0.29);
  R.bone("root", null, 0, 0, 0);
  for (let i = 0; i < n; i++) R.bone("t" + i, i ? "t" + (i - 1) : "root", 0, Y, zs[i]);
  const c = new THREE.Color(col), dark = c.clone().multiplyScalar(0.6).getHex(), belly = c.clone().lerp(new THREE.Color(0xf0d0b0), 0.35).getHex();
  for (let i = 0; i < n; i++) {
    const r = 0.11 + 0.17 * (i / (n - 1));
    R.add(gBall(V3(0, Y + (r - 0.28) * 0.5, zs[i]), r, 1, 0.92, 1.15, 14), "t" + i, col, "scale");
    R.add(gBall(V3(0, Y + (r - 0.28) * 0.5 - r * 0.35, zs[i]), r * 0.85, 0.95, 0.6, 1.1, 10), "t" + i, belly, "skin");
    if (i < n - 1) R.add(gRing(V3(0, Y + (r - 0.28) * 0.5, zs[i] + 0.13), r * 0.92, 0.022, "z", 18), "t" + i, dark, "scale");
  }
  const hz = zs[n - 1] + 0.2;
  R.add(gRing(V3(0, Y, hz), 0.15, 0.045, "z", 18), "t" + (n - 1), 0x6a2a2a, "skin");
  R.add(gBall(V3(0, Y, hz - 0.02), 0.14, 1, 1, 0.3, 12), "t" + (n - 1), 0x1a0a0a, "plain");
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2;
    const p = V3(Math.cos(a) * 0.15, Y + Math.sin(a) * 0.15, hz + 0.02);
    R.add(gTaper(p, V3(Math.cos(a) * 0.07, Y + Math.sin(a) * 0.07, hz + 0.08), 0.022, 0.002, 5), "t" + (n - 1), 0xeae2cc, "bone");
  }
  for (const s of [-1, 1]) R.add(gTaper(V3(s * 0.18, Y - 0.05, hz - 0.05), V3(s * 0.12, Y - 0.12, hz + 0.18), 0.035, 0.004, 6), "t" + (n - 1), dark, "bone");
  R.meta = { kind: "worm", headTop: 0.75 };
  return R.finish();
}

function hareEntry(col) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, 0.3, 0);
  R.bone("head", "body", 0, 0.42, 0.2);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("ear" + sd, "head", s * 0.04, 0.53, 0.2);
    R.bone("legF" + sd, "body", s * 0.06, 0.22, 0.15);
    R.bone("legB" + sd, "body", s * 0.09, 0.24, -0.12);
  }
  const light = new THREE.Color(col).lerp(new THREE.Color(0xf2ede4), 0.55).getHex();
  R.add(gBall(V3(0, 0.3, -0.02), 0.2, 0.85, 0.85, 1.25, 14), "body", col, "fur");
  R.add(gBall(V3(0, 0.27, 0.08), 0.15, 0.8, 0.8, 1, 12), "body", light, "fur");
  R.add(gBall(V3(0, 0.45, 0.25), 0.11, 0.9, 0.95, 1.1, 14), "head", col, "fur");
  R.add(gBall(V3(0, 0.42, 0.34), 0.05, 1.2, 0.8, 0.8, 8), "head", light, "fur");
  R.add(gBall(V3(0, 0.44, 0.37), 0.014, 1, 0.8, 1, 6), "head", 0xd88a90, "skin");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.065, 0.48, 0.32), 0.022, 1, 1, 0.7, 8), "head", 0x111111, "plain");
    R.add(gBall(V3(s * 0.05, 0.67, 0.18), 0.04, 0.7, 3.0, 0.4, 10), "ear" + sd, col, "fur");
    R.add(gBall(V3(s * 0.05, 0.67, 0.193), 0.03, 0.55, 2.6, 0.2, 8), "ear" + sd, 0xe0a8a8, "skin");
    R.add(gTaper(V3(s * 0.06, 0.22, 0.15), V3(s * 0.06, 0.03, 0.19), 0.03, 0.022, 8), "legF" + sd, col, "fur");
    R.add(gBall(V3(s * 0.06, 0.025, 0.21), 0.03, 1, 0.7, 1.3, 8), "legF" + sd, light, "fur");
    R.add(gBall(V3(s * 0.1, 0.24, -0.1), 0.1, 0.7, 1, 1.15, 10), "legB" + sd, col, "fur");
    R.add(gTaper(V3(s * 0.1, 0.2, -0.12), V3(s * 0.1, 0.04, -0.1), 0.045, 0.028, 8), "legB" + sd, col, "fur");
    R.add(gBox(V3(s * 0.1, 0.025, -0.03), 0.05, 0.04, 0.2), "legB" + sd, light, "fur");
  }
  R.add(gBall(V3(0, 0.33, -0.28), 0.06, 1, 1, 1, 8), "body", 0xf6f2ea, "fur");
  R.meta = { kind: "hare", headTop: 0.85 };
  return R.finish();
}

function thornstriderEntry(coat) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("pelvis", "root", 0, 1.05, -0.15);
  R.bone("chest", "pelvis", 0, 1.12, 0.35);
  R.bone("neck1", "chest", 0, 1.28, 0.62);
  R.bone("neck2", "neck1", 0, 1.55, 0.78);
  R.bone("head", "neck2", 0, 1.78, 0.88);
  R.bone("tail1", "pelvis", 0, 1.05, -0.55);
  R.bone("tail2", "tail1", 0, 1.0, -1.0);
  R.bone("tail3", "tail2", 0, 0.95, -1.45);
  R.bone("saddle", "pelvis", 0, 1.32, 0.05);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("arm" + sd, "chest", s * 0.16, 1.05, 0.5);
    R.bone("thigh" + sd, "pelvis", s * 0.2, 1.0, -0.15);
    R.bone("shin" + sd, "thigh" + sd, s * 0.22, 0.6, 0.08);
    R.bone("meta" + sd, "shin" + sd, s * 0.22, 0.32, -0.12);
    R.bone("toe" + sd, "meta" + sd, s * 0.22, 0.05, 0.0);
  }
  const C = coat || MOUNT_COATS.teal;
  const main = C.main, dark = C.dark, cream = 0xd8cba8, rust = 0xb0552a, gold = 0xd8a040, glow = C.glow, horn = 0xcfc0a0;
  R.add(gBall(V3(0, 1.08, -0.15), 0.32, 0.85, 0.85, 1.15, 16), "pelvis", main, "scale");
  R.add(gBall(V3(0, 0.98, 0.08), 0.26, 0.75, 0.6, 1.2, 14), "pelvis", cream, "plain");
  R.add(gBall(V3(0, 1.12, 0.32), 0.29, 0.8, 0.85, 1.0, 16), "chest", main, "scale");
  R.add(gBall(V3(0, 1.0, 0.36), 0.22, 0.72, 0.6, 0.9, 12), "chest", cream, "plain");
  R.add(gTaper(V3(0, 1.18, 0.5), V3(0, 1.38, 0.68), 0.19, 0.13, 12), "neck1", main, "scale");
  R.add(gTaper(V3(0, 1.36, 0.68), V3(0, 1.62, 0.82), 0.13, 0.1, 12), "neck2", main, "scale");
  R.add(gTaper(V3(0, 1.6, 0.81), V3(0, 1.8, 0.9), 0.1, 0.09, 12), "head", main, "scale");
  R.add(gBall(V3(0, 1.83, 0.96), 0.13, 0.85, 0.9, 1.25, 14), "head", main, "scale");
  R.add(gTaper(V3(0, 1.81, 1.06), V3(0, 1.77, 1.32), 0.09, 0.045, 10), "head", main, "scale");
  R.add(gTaper(V3(0, 1.74, 1.04), V3(0, 1.72, 1.26), 0.07, 0.035, 8), "head", cream, "plain");
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.085, 1.86, 1.03), 0.024, 1, 0.8, 0.8, 8), "head", 0xffb030, "glow", true);
    const a0 = V3(s * 0.06, 1.92, 0.9), a1 = V3(s * 0.17, 2.14, 0.82), a2 = V3(s * 0.26, 2.32, 0.7), a3 = V3(s * 0.3, 2.45, 0.56);
    R.add(gTaper(a0, a1, 0.03, 0.022, 8), "head", horn, "bone");
    R.add(gTaper(a1, a2, 0.022, 0.016, 8), "head", horn, "bone");
    R.add(gTaper(a2, a3, 0.016, 0.004, 8), "head", horn, "bone");
    R.add(gTaper(a1, V3(s * 0.22, 2.3, 0.96), 0.015, 0.003, 6), "head", horn, "bone");
    R.add(gTaper(a2, V3(s * 0.4, 2.42, 0.78), 0.012, 0.003, 6), "head", horn, "bone");
    R.add(gBall(V3(s * 0.11, 1.42, 0.72), 0.1, 0.18, 0.22, 1.25, 8), "neck2", glow, "glow", true);
    for (let j = 0; j < 3; j++) R.add(gBall(V3(s * 0.262, 1.14 - j * 0.07, -0.12 - j * 0.1), 0.12, 0.12, 0.12, 1.3, 8), "pelvis", glow, "glow", true);
    R.add(gTaper(V3(s * 0.16, 1.05, 0.5), V3(s * 0.2, 0.86, 0.62), 0.05, 0.03, 8), "arm" + sd, main, "scale");
    for (let j = 0; j < 3; j++) R.add(gTaper(V3(s * 0.19, 0.92 + j * 0.05, 0.56 - j * 0.03), V3(s * 0.22, 0.78 + j * 0.06, 0.38 - j * 0.04), 0.045, 0.005, 6, 0.3), "arm" + sd, j % 2 ? gold : rust, "feather");
    R.add(gBall(V3(s * 0.2, 0.9, -0.08), 0.16, 0.7, 1.1, 1.0, 12), "thigh" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.2, 1.0, -0.15), V3(s * 0.22, 0.6, 0.08), 0.13, 0.08, 10), "thigh" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.22, 0.6, 0.08), V3(s * 0.22, 0.32, -0.12), 0.07, 0.05, 10), "shin" + sd, main, "scale");
    R.add(gTaper(V3(s * 0.22, 0.32, -0.12), V3(s * 0.22, 0.06, 0.0), 0.045, 0.035, 8), "meta" + sd, dark, "scale");
    for (const dx of [-0.05, 0, 0.05]) {
      R.add(gTaper(V3(s * 0.22 + dx * 0.3, 0.05, 0.0), V3(s * 0.22 + dx, 0.035, 0.16), 0.028, 0.012, 6), "toe" + sd, dark, "scale");
      R.add(gTaper(V3(s * 0.22 + dx, 0.035, 0.16), V3(s * 0.22 + dx * 1.1, 0.01, 0.22), 0.012, 0.002, 5), "toe" + sd, 0x1a1a1a, "bone");
    }
  }
  for (let j = 0; j < 6; j++) {
    const z = 0.66 + j * 0.06, y = 1.36 + j * 0.09;
    R.add(gTaper(V3(0, y + 0.06, z - 0.05), V3(0, y + 0.22, z - 0.2), 0.05, 0.004, 6, 0.25), j < 3 ? "neck1" : j < 5 ? "neck2" : "head", j % 2 ? gold : rust, "feather");
  }
  R.add(gTaper(V3(0, 1.05, -0.45), V3(0, 1.0, -1.0), 0.2, 0.14, 12), "tail1", main, "scale");
  R.add(gTaper(V3(0, 1.0, -1.0), V3(0, 0.95, -1.45), 0.14, 0.08, 10), "tail2", main, "scale");
  R.add(gTaper(V3(0, 0.95, -1.45), V3(0, 0.92, -1.75), 0.08, 0.03, 8), "tail3", main, "scale");
  for (let j = -2; j <= 2; j++) R.add(gTaper(V3(0, 0.94, -1.6), V3(j * 0.12, 0.98 + Math.abs(j) * 0.02, -2.05 + Math.abs(j) * 0.08), 0.06, 0.006, 6, 0.25), "tail3", j % 2 ? gold : rust, "feather");
  R.add(gBox(V3(0, 1.3, 0.02), 0.52, 0.03, 0.62), "saddle", 0x8a1f2a, "cloth");
  R.add(gBox(V3(0, 1.305, -0.29), 0.5, 0.035, 0.05), "saddle", 0xc8a040, "trim");
  R.add(gBox(V3(0, 1.35, 0.02), 0.34, 0.07, 0.42), "saddle", 0x6a4428, "leather");
  R.add(gBox(V3(0, 1.42, -0.17), 0.3, 0.12, 0.06, -0.3, 0, 0), "saddle", 0x6a4428, "leather");
  R.add(gTaper(V3(0, 1.37, 0.2), V3(0, 1.48, 0.24), 0.03, 0.02, 6), "saddle", 0x6a4428, "leather");
  for (const s of [-1, 1]) {
    R.add(gTaper(V3(s * 0.19, 1.32, 0.05), V3(s * 0.25, 0.92, 0.07), 0.008, 0.008, 4), "saddle", 0x3a2618, "leather");
    R.add(gRing(V3(s * 0.25, 0.88, 0.07), 0.045, 0.01, "x", 10), "saddle", 0xb0b4ba, "metal");
  }
  R.add(gTaper(V3(0, 1.8, 1.12), V3(0, 1.44, 0.26), 0.008, 0.008, 4), "neck2", 0x3a2618, "leather");
  R.meta = { kind: "raptor", headTop: 2.5 };
  return R.finish();
}

function weaponEntry(kind, id) {
  const key = kind + "|" + (id || "");
  if (RIG.weaponCache.has(key)) return RIG.weaponCache.get(key);
  const R = new RigBuilder();
  R.bone("w", null, 0, 0, 0);
  const iron = id && /iron/.test(id), bronze = id && /bronze/.test(id), wlv = (id && ITEMS[id] && ITEMS[id].lv) || 1;
  const blade = !id ? 0xb8bcc2 : /frost|rime|glacier/.test(id) ? 0xc8ecf8 : /tidesteel|coral/.test(id) ? 0x9ec8d0 : /drowned|abyssal/.test(id) ? 0x5a7a88 : /kings/.test(id) ? 0xe8e0c0 : /steel/.test(id) ? 0xdfe4ea : iron ? 0xd0d4da : bronze ? 0xc89458 : 0xb8bcc2;
  const glowC = wlv >= 14 && id ? (/frost|rime|glacier/.test(id) ? 0x9fe8ff : /tide|coral|drowned|abyssal/.test(id) ? 0x4fc3f7 : /kings/.test(id) ? 0xffe080 : /warlord|gax|cleaver/.test(id) ? 0xff7043 : null) : null;
  const wood = 0x7a5432, grip = 0x3a2618, gold = 0xc8a040;
  let tip = [0.1, 0.7];
  if (kind === "sword" || kind === "dagger" || kind === "gsword") {
    const L = kind === "gsword" ? 1.05 : kind === "sword" ? 0.72 : 0.26, W = kind === "gsword" ? 0.1 : kind === "sword" ? 0.05 : 0.035;
    R.add(gTaper(V3(0, -0.08, 0), V3(0, 0.08, 0), 0.018, 0.016, 8), "w", grip, "leather");
    R.add(gBall(V3(0, -0.1, 0), 0.026, 1, 1, 1, 8), "w", gold, "metal");
    R.add(gBox(V3(0, 0.09, 0), kind === "gsword" ? 0.3 : kind === "sword" ? 0.18 : 0.09, 0.025, 0.035), "w", gold, "metal");
    if (kind === "gsword") R.add(gTaper(V3(0, -0.3, 0), V3(0, -0.08, 0), 0.02, 0.019, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2 * 0.9, L * 0.82); sh.lineTo(0, L); sh.lineTo(-W / 2 * 0.9, L * 0.82); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 1 });
    bg.translate(0, 0.1, -0.004);
    const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W) / (2 * W), uv.getY(i) / L);
    R.add(bg, "w", blade, "metal");
    R.add(gBox(V3(0, 0.1 + L * 0.4, 0), W * 0.18, L * 0.62, 0.0175), "w", glowC || new THREE.Color(blade).multiplyScalar(0.6).getHex(), glowC ? "glow" : "metal", !!glowC);
    for (let k = 0; k < 3; k++) R.add(gRing(V3(0, -0.06 + k * 0.05, 0), 0.019, 0.005, "y", 8), "w", 0x1e140c, "leather");
    if (kind === "sword" || kind === "gsword") for (const s of [-1, 1]) R.add(gBall(V3(s * (kind === "gsword" ? 0.155 : 0.095), 0.09, 0), 0.016, 1, 1, 1, 6), "w", gold, "metal");
    tip = [0.3, 0.1 + L];
  } else if (kind === "club") {
    const wand = id === "maple_wand";
    R.add(gTaper(V3(0, -0.15, 0), V3(0, 0.32, 0), 0.018, 0.026, 8), "w", wood, "wood");
    if (wand) {
      R.add(gBall(V3(0, 0.38, 0), 0.04, 1, 1.6, 1, 8), "w", 0x9fe0ff, "glow", true);
      R.add(gRing(V3(0, 0.33, 0), 0.032, 0.008, "y", 10), "w", gold, "metal");
    } else {
      R.add(gBall(V3(0, 0.38, 0), 0.065, 1, 1.15, 1, 10), "w", wood, "wood");
      R.add(gRing(V3(0, 0.36, 0), 0.066, 0.012, "y", 12), "w", 0x8a8f96, "metal");
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gTaper(V3(Math.cos(a) * 0.055, 0.4, Math.sin(a) * 0.055), V3(Math.cos(a) * 0.1, 0.42, Math.sin(a) * 0.1), 0.014, 0.002, 4), "w", 0x8a8f96, "metal"); }
    }
    tip = [0.2, 0.45];
  } else if (kind === "archery") {
    const steel = id && /steel/.test(id);
    const limb = steel ? 0x8a9098 : id && /yew/.test(id) ? 0x9a6a3a : wood;
    const pts = [];
    for (let i = 0; i <= 8; i++) { const a = (i / 8 - 0.5) * 2.1; pts.push(V3(0, Math.sin(a) * 0.55, -Math.cos(a) * 0.16 + 0.16)); }
    for (let i = 0; i < 8; i++) R.add(gTaper(pts[i], pts[i + 1], i === 3 || i === 4 ? 0.022 : 0.014, i === 3 || i === 4 ? 0.022 : 0.012, 6), "w", i === 3 || i === 4 ? grip : limb, i === 3 || i === 4 ? "leather" : steel ? "metal" : "wood");
    R.add(gTaper(pts[0], pts[8], 0.003, 0.003, 4), "w", 0xe8e0c8, "plain");
    tip = [0.2, 0.55];
  } else if (kind === "staff") {
    const holly = id === "holly_staff";
    R.add(gTaper(V3(0, -0.65, 0), V3(0, 0.82, 0), 0.02, 0.016, 8), "w", holly ? 0x5a3a28 : wood, "wood");
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; R.add(gTaper(V3(0, 0.8, 0), V3(Math.cos(a) * 0.06, 0.98, Math.sin(a) * 0.06), 0.014, 0.008, 5), "w", holly ? 0x5a3a28 : wood, "wood"); }
    R.add(gBall(V3(0, 0.96, 0), wlv >= 14 ? 0.065 : 0.05, 1, 1, 1, 10), "w", glowC || (holly ? 0xb070ff : 0x7ad7ff), "glow", true);
    if (wlv >= 11) for (let k = 0; k < 2; k++) R.add(gRing(V3(0, 0.2 - k * 0.5, 0), 0.022, 0.006, "y", 10), "w", gold, "metal");
    R.add(gRing(V3(0, 0.78, 0), 0.025, 0.008, "y", 10), "w", gold, "metal");
    tip = [0.6, 1.0];
  } else if (kind === "gkatana" || kind === "katana") {
    const big = kind === "gkatana", L = big ? 0.92 : 0.6, W = big ? 0.04 : 0.032, curve = big ? 0.06 : 0.04;
    R.add(gTaper(V3(0, big ? -0.24 : -0.12, 0), V3(0, 0.08, 0), 0.017, 0.016, 8), "w", 0x1a1418, "leather");
    for (let k = 0; k < (big ? 6 : 4); k++) R.add(gRing(V3(0, (big ? -0.22 : -0.1) + k * 0.05, 0), 0.0185, 0.004, "y", 8), "w", 0xd8d0c0, "cloth");
    R.add(gCyl(V3(0, 0.09, 0), 0.05, 0.05, 0.012, 12), "w", gold, "metal");
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.quadraticCurveTo(-W / 2 + curve * 0.4, L * 0.5, -W * 0.1 + curve, L * 0.97); sh.lineTo(W * 0.4 + curve, L); sh.quadraticCurveTo(W / 2 + curve * 0.5, L * 0.5, W / 2, 0); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 1 });
    bg.translate(0, 0.1, -0.003);
    const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W) / (2 * W + curve), uv.getY(i) / L);
    R.add(bg, "w", blade, "metal");
    R.add(gBox(V3(curve * 0.35, 0.1 + L * 0.45, 0), W * 0.12, L * 0.8, 0.0135), "w", glowC || 0xf4f6f8, glowC ? "glow" : "metal", !!glowC);
    tip = [0.3, 0.1 + L];
  } else if (kind === "axe") {
    R.add(gTaper(V3(0, -0.2, 0), V3(0, 0.42, 0), 0.018, 0.02, 8), "w", wood, "wood");
    R.add(gTaper(V3(0, -0.12, 0), V3(0, 0.02, 0), 0.022, 0.022, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.05); sh.quadraticCurveTo(0.1, 0.07, 0.17, 0.14); sh.quadraticCurveTo(0.13, 0, 0.17, -0.12); sh.quadraticCurveTo(0.1, -0.06, 0, -0.05); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    g.translate(0, 0, -0.006);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.18, (uv.getY(i) + 0.12) / 0.26);
    g.rotateY(Math.PI / 2); g.translate(0, 0.36, 0);
    R.add(g, "w", blade, "metal");
    R.add(gBox(V3(0, 0.36, 0), 0.035, 0.08, 0.05), "w", blade, "metal");
    if (glowC) R.add(gRing(V3(0, 0.3, 0), 0.026, 0.007, "y", 10), "w", glowC, "glow", true);
    tip = [0.3, 0.5];
  } else if (kind === "polearm") {
    R.add(gTaper(V3(0, -0.7, 0), V3(0, 1.0, 0), 0.02, 0.018, 8), "w", wood, "wood");
    for (let k = 0; k < 2; k++) R.add(gTaper(V3(0, 0.1 - k * 0.55, 0), V3(0, 0.25 - k * 0.55, 0), 0.024, 0.024, 8), "w", grip, "leather");
    R.add(gRing(V3(0, 1.0, 0), 0.026, 0.008, "y", 10), "w", gold, "metal");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0); sh.lineTo(0.05, 0.08); sh.lineTo(0.02, 0.32); sh.lineTo(0, 0.36); sh.lineTo(-0.02, 0.32); sh.lineTo(-0.05, 0.08); sh.closePath();
    const hg = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    hg.translate(0, 1.0, -0.006);
    const uv = hg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 0.05) / 0.1, uv.getY(i) / 0.36);
    R.add(hg, "w", blade, "metal");
    for (const s of [-1, 1]) R.add(gTaper(V3(0, 1.02, 0), V3(s * 0.09, 1.1, 0), 0.012, 0.003, 5), "w", blade, "metal");
    if (glowC) R.add(gBall(V3(0, 1.0, 0), 0.03, 1, 1, 1, 8), "w", glowC, "glow", true);
    tip = [0.9, 1.36];
  } else if (kind === "scythe") {
    R.add(gTaper(V3(0, -0.5, 0), V3(0, 1.0, 0), 0.022, 0.02, 8), "w", 0x3a2a22, "wood");
    R.add(gTaper(V3(0, 0.1, 0), V3(0, 0.22, 0), 0.026, 0.026, 8), "w", grip, "leather");
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.03); sh.quadraticCurveTo(0.3, 0.12, 0.62, -0.12); sh.quadraticCurveTo(0.3, 0.0, 0, -0.04); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1 });
    g.translate(0, 0, -0.005);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.62, (uv.getY(i) + 0.12) / 0.24);
    g.rotateY(Math.PI / 2);
    g.translate(0, 0.96, 0);
    R.add(g, "w", id && /rime/.test(id) ? 0xbfe6f5 : blade, "metal");
    R.add(gBall(V3(0, 1.0, 0), 0.03, 1, 1, 1, 8), "w", glowC || gold, glowC ? "glow" : "metal", !!glowC);
    tip = [0.7, 0.95];
  } else if (kind === "greataxe") {
    R.add(gTaper(V3(0, -0.4, 0), V3(0, 0.95, 0), 0.024, 0.022, 8), "w", wood, "wood");
    for (const s of [-1, 1]) {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0.1); sh.quadraticCurveTo(0.12, 0.12, 0.24, 0.24); sh.quadraticCurveTo(0.17, 0, 0.24, -0.24); sh.quadraticCurveTo(0.12, -0.12, 0, -0.1); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.004, bevelSegments: 1 });
      g.translate(0, 0, -0.006);
      const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 0.25, (uv.getY(i) + 0.25) / 0.5);
      g.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);
      g.translate(0, 0.78, 0);
      R.add(g, "w", blade, "metal");
    }
    R.add(gTaper(V3(0, 0.92, 0), V3(0, 1.08, 0), 0.025, 0.002, 6), "w", blade, "metal");
    R.add(gTaper(V3(0, -0.2, 0), V3(0, 0.1, 0), 0.027, 0.027, 8), "w", grip, "leather");
    if (glowC) R.add(gRing(V3(0, 0.78, 0), 0.03, 0.008, "y", 10), "w", glowC, "glow", true);
    tip = [0.62, 1.02];
  }
  const e = R.finish();
  const k = { sword: 0.86, staff: 0.84, greataxe: 0.86, scythe: 0.9, club: 0.9, gkatana: 0.86, katana: 0.9, polearm: 0.84, gsword: 0.86 }[kind] || 1;
  if (k !== 1) { e.geo.scale(k, k, k); e.geo.computeBoundingSphere(); e.geo.boundingSphere.radius *= 1.6; tip = tip.map(x => x * k); }
  e.tip = tip;
  RIG.weaponCache.set(key, e);
  return e;
}

function makeWeapon(kind, id) {
  if (!kind || kind === "h2h") return null;
  const e = weaponEntry(kind, id);
  const m = new THREE.Mesh(e.geo, [RIG.weaponMat, RIG.glowMat]);
  m.castShadow = true;
  m.userData.kind = kind;
  m.userData.tip = e.tip;
  return m;
}

function entryFor(sig, make) {
  let e = RIG.cache.get(sig);
  if (!e) { e = make(); RIG.cache.set(sig, e); }
  return e;
}

function instantiate(entry) {
  const bones = [], byName = {};
  for (const d of entry.defs) {
    const b = new THREE.Bone();
    b.name = d.name;
    b.position.set(d.local[0], d.local[1], d.local[2]);
    b.userData.rest = b.position.clone();
    if (d.parent != null) bones[d.parent].add(b);
    bones.push(b);
    byName[d.name] = b;
  }
  const mat = charMaterial();
  const mesh = new THREE.SkinnedMesh(entry.geo, [mat, RIG.glowMat]);
  mesh.add(bones[0]);
  mesh.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(bones));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, bones: byName, list: bones, mat, meta: entry.meta };
}

function toadEntry(col) {
  const R = new RigBuilder();
  R.bone("root", null, 0, 0, 0);
  R.bone("body", "root", 0, 0.26, 0);
  R.bone("head", "body", 0, 0.34, 0.2);
  for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
    R.bone("ear" + sd, "head", s * 0.09, 0.44, 0.2);
    R.bone("legF" + sd, "body", s * 0.13, 0.2, 0.16);
    R.bone("legB" + sd, "body", s * 0.17, 0.2, -0.12);
  }
  const belly = new THREE.Color(col).lerp(new THREE.Color(0xe8dcb0), 0.55).getHex();
  const dark = new THREE.Color(col).multiplyScalar(0.6).getHex();
  R.add(gBall(V3(0, 0.26, -0.02), 0.27, 1.05, 0.72, 1.15, 16), "body", col, "skin");
  R.add(gBall(V3(0, 0.2, 0.06), 0.22, 0.95, 0.55, 1.0, 14), "body", belly, "skin");
  R.add(gBall(V3(0, 0.33, 0.22), 0.17, 1.25, 0.65, 1.0, 14), "head", col, "skin");
  R.add(gBall(V3(0, 0.29, 0.32), 0.12, 1.4, 0.32, 0.6, 10), "head", belly, "skin");
  for (let k = 0; k < 7; k++) { const a = k * 1.7; R.add(gBall(V3(Math.sin(a) * 0.16, 0.36 + (k % 3) * 0.03, -0.05 + Math.cos(a) * 0.15), 0.03, 1, 0.7, 1, 6), "body", dark, "skin"); }
  for (const s of [-1, 1]) {
    const sd = s > 0 ? "L" : "R";
    R.add(gBall(V3(s * 0.09, 0.44, 0.22), 0.06, 1, 1, 1, 10), "ear" + sd, col, "skin");
    R.add(gBall(V3(s * 0.1, 0.46, 0.26), 0.038, 1, 1, 0.8, 8), "ear" + sd, 0xe8c040, "plain");
    R.add(gBall(V3(s * 0.105, 0.462, 0.29), 0.018, 1, 1.4, 0.6, 6), "ear" + sd, 0x111111, "plain");
    R.add(gTaper(V3(s * 0.13, 0.2, 0.16), V3(s * 0.15, 0.03, 0.24), 0.04, 0.03, 8), "legF" + sd, col, "skin");
    R.add(gBall(V3(s * 0.16, 0.02, 0.27), 0.05, 1.2, 0.35, 1.2, 8), "legF" + sd, dark, "skin");
    R.add(gBall(V3(s * 0.2, 0.18, -0.1), 0.12, 0.75, 0.9, 1.25, 10), "legB" + sd, col, "skin");
    R.add(gTaper(V3(s * 0.2, 0.14, -0.08), V3(s * 0.22, 0.04, -0.06), 0.05, 0.035, 8), "legB" + sd, col, "skin");
    R.add(gBox(V3(s * 0.22, 0.025, 0.0), 0.09, 0.04, 0.24), "legB" + sd, dark, "skin");
  }
  R.meta = { kind: "hare", headTop: 0.6 };
  return R.finish();
}

function mobLook(m) {
  const f = m.fam, key = f.key || m.famKey;
  const model = f.model;
  if (key === "grimtooth") return { kind: "human", look: goblinLook("grimtooth") };
  if (model === "chieftain") return { kind: "human", look: goblinLook("chieftain") };
  if (key === "mirelord_gax") return { kind: "human", look: goblinLook("gax") };
  if (key === "rimefang") return { kind: "human", look: goblinLook("rimefang") };
  if (model === "goblin") return { kind: "human", look: goblinLook(m.famKey === "den_goblin" ? "raider" : m.famKey === "mire_goblin" ? "mire" : m.famKey === "frost_goblin" ? "frost" : "goblin") };
  if (model === "toad") return { kind: "toad", col: key === "old_croaker" ? 0x6a8a30 : 0x5f7a3a };
  if (model === "skeleton") {
    if (key === "spire_warden") return { kind: "human", look: { skull: true, skin: 0x8a5a48, noFace: true, headRegion: "bone", eyesGlow: 0xff5722, top: { type: "plate", color: 0x5a2a20, region: "chain", plate: 0x8a3a24, trim: 0xffb74d, glowTrim: true }, pauldrons: 0x8a3a24, gauntlets: true, gloves: 0x5a2a20, greaves: 0x8a3a24, head: { type: "horned", color: 0x5a2a20, color2: 0xe8d8c0 }, cape: 0x3a1410, legs: 0x8a5a48, barefoot: true, weapon: "gsword", weaponId: "warden_blade", prop: { girth: 0.9 } } };
    if (key === "hollow_king") return { kind: "human", look: { skull: true, skin: 0xd8d0b8, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "cloth", color2: 0xd8b040 }, cape: 0x3a1030, legs: 0xd8d0b8, barefoot: true, head: { type: "crown" }, weapon: "sword", weaponId: "iron_sword", prop: { girth: 0.85 } } };
    if (key === "crypt_sentinel") return { kind: "human", look: { skull: true, skin: 0xc8d0c8, noFace: true, headRegion: "bone", eyesGlow: 0x80cbc4, top: { type: "mail", color: 0x4a5a5a, region: "chain" }, pauldrons: 0x5a6a6a, legs: 0xc8d0c8, barefoot: true, head: { type: "helm", color: 0x4a5a5a }, weapon: "greataxe", weaponId: "bronze_greataxe", prop: { girth: 0.85 } } };
    if (key === "royal_guard") return { kind: "human", look: { skull: true, skin: 0xe0dccc, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "chain", color2: 0xd8b040 }, legs: 0xe0dccc, barefoot: true, head: { type: "cap", color: 0x5a5a62 }, weapon: "sword", weaponId: "bronze_sword", prop: { girth: 0.75 } } };
    if (key === "ice_wight" || key === "frost_wight") return { kind: "human", look: { skull: true, skin: 0xd4eef8, noFace: true, headRegion: "bone", eyesGlow: 0x40c4ff, top: { type: key === "frost_wight" ? "robe" : "rags", color: 0x6a8aa0, trim: 0xb3e5fc, glowTrim: key === "frost_wight" }, legs: 0xd4eef8, barefoot: true, head: key === "frost_wight" ? { type: "hood", color: 0x4a6a80 } : null, weapon: "sword", weaponId: "iron_sword", prop: { girth: key === "frost_wight" ? 0.95 : 0.75 } } };
    return { kind: "human", look: { skull: true, skin: 0xe8e2cf, noFace: true, headRegion: "bone", eyesGlow: 0x66e0ff, top: { type: "rags", color: 0x3a3028 }, legs: 0xe8e2cf, barefoot: true, weapon: "sword", weaponId: "rusty", prop: { girth: 0.7 } } };
  }
  if (key === "tide_priest") return { kind: "human", look: { skull: true, skin: 0x7aa6a6, noFace: true, headRegion: "bone", eyesGlow: 0x4dd0e1, top: { type: "robe", color: 0x14303a, trim: 0x4dd0e1, glowTrim: true }, head: { type: "hood", color: 0x0f2530 }, legs: 0x14303a, barefoot: true, weapon: "staff", weaponId: "holly_staff" } };
  if (model === "orc") {
    const archer = key === "orc_stonechucker" || key === "frost_stonechucker", lord = key === "orc_warlord", frost = key.startsWith("frost_");
    const skin = lord ? 0x5a6a4a : frost ? 0x7a8a8a : 0x6f7f4f;
    return { kind: "human", look: { skin, noFace: true, eyesGlow: lord ? 0xff5030 : 0xffb040, tusks: true, barefoot: false, boots: 0x2a1e14, top: archer ? { type: "vest", color: 0x4a3a2a, region: "leather", under: skin } : { type: "mail", color: lord ? 0x3a3038 : 0x5a5048, region: "chain" }, pauldrons: lord ? 0x6a4a3a : archer ? null : 0x4a4038, head: lord ? { type: "horned", color: 0x3a3030, color2: 0xe8dcc0 } : archer ? { type: "bandana", color: 0x6a2a2a } : { type: "cap", color: 0x4a4038 }, cape: lord ? 0x6a1a1a : null, legs: 0x3a3028, belt: 0x2a1e14, hair: { style: "bald", color: 0x222 }, weapon: archer ? "archery" : lord ? "greataxe" : "club", weaponId: archer ? "shortbow" : lord ? "steel_greataxe" : null, prop: { leg: 0.86, torso: 0.6, headR: 0.15, arm: 0.66, shoulder: lord ? 0.26 : 0.23, hip: 0.12, neck: 0.04, girth: lord ? 1.4 : 1.25, waist: 1.2 } } };
  }
  if (model === "fishfolk") {
    const chief = key === "fishfolk_chief";
    return { kind: "human", look: { skin: chief ? 0x3a7a8a : 0x4a8a7a, skinRegion: "scale", noFace: true, eyesGlow: 0xffe082, ears: "fin", finColor: chief ? 0x8ad0e0 : 0x7ac0b0, barefoot: true, top: { type: "vest", color: 0x2a4a5a, region: "leather", under: 0x4a8a7a }, legs: 0x2a4a4a, belt: 0x6a5a3a, hair: { style: "bald", color: 0x222 }, head: chief ? { type: "horned", color: 0x2a5a6a, color2: 0xd8e8f0 } : null, cape: chief ? 0x1a4a5a : null, weapon: chief ? "staff" : "dagger", weaponId: chief ? "coral_staff" : "bronze_dagger", prop: { leg: 0.8, torso: 0.5, headR: 0.15, arm: 0.6, shoulder: 0.19, hip: 0.1, neck: 0.06, girth: 1.0 } } };
  }
  if (model === "birdfolk") {
    const priest = key === "birdfolk_priest" || key === "crag_oracle", oracle = key === "crag_oracle";
    const plum = oracle ? 0xd8d0e8 : priest ? 0xf0e4c8 : 0xc8a870;
    return { kind: "human", look: { skin: plum, skinRegion: "feather", noFace: true, eyesGlow: oracle ? 0xb388ff : 0xffd54f, ears: "none", beak: 0xe8c060, crest: oracle ? 0x7e57c2 : priest ? 0xd84a4a : 0x4a3a2a, barefoot: true, top: priest ? { type: "robe", color: oracle ? 0x3a2a5a : 0x8a2a2a, trim: 0xd8c070, glowTrim: oracle } : { type: "vest", color: 0x5a4a3a, region: "leather", under: plum }, legs: plum, legsRegion: "feather", belt: 0x6a4a2a, hair: { style: "bald", color: 0x222 }, weapon: priest ? "staff" : "sword", weaponId: priest ? "holly_staff" : "bronze_sword", prop: { leg: 0.9, torso: 0.5, headR: 0.14, arm: 0.62, shoulder: 0.18, hip: 0.09, neck: 0.09, girth: 0.92 } } };
  }
  if (model === "treant") {
    const elder = key === "treant_elder" || key === "old_rootfather", frost = key === "rime_treant";
    const bark = frost ? 0x6a7a80 : elder ? 0x4a3a28 : 0x6a4a30, leaf = frost ? 0xcfe8f0 : elder ? 0x3a6a2a : 0x6aa84a;
    return { kind: "human", look: { skin: bark, skinRegion: "wood", noFace: true, eyesGlow: elder ? 0xffb300 : 0x9ccc65, ears: "none", leafHead: leaf, barefoot: true, top: { type: "rags", color: bark, sleeves: "none" }, legs: bark, legsRegion: "wood", hair: { style: "bald", color: 0x222 }, claws: true, prop: elder ? { leg: 1.0, torso: 0.72, headR: 0.17, arm: 0.86, shoulder: 0.26, hip: 0.13, neck: 0.03, girth: 1.35 } : { leg: 0.6, torso: 0.4, headR: 0.14, arm: 0.5, shoulder: 0.16, hip: 0.08, neck: 0.03, girth: 0.9 } } };
  }
  if (model === "cactus") {
    const king = key === "cactus_king";
    return { kind: "human", look: { skin: king ? 0x4a8a3a : 0x5aa04a, noFace: true, eyesGlow: 0x111111, ears: "none", needles: true, barefoot: true, top: { type: "rags", color: king ? 0x4a8a3a : 0x5aa04a, sleeves: "none" }, legs: king ? 0x4a8a3a : 0x5aa04a, hair: { style: "bald", color: 0x222 }, head: king ? { type: "crown" } : null, prop: { leg: 0.7, torso: 0.5, headR: 0.13, arm: 0.45, shoulder: 0.15, hip: 0.07, neck: 0.02, girth: 0.95 } } };
  }
  if (model === "bomb") return { kind: "bomb", col: key === "frost_bomb" ? 0x81d4fa : key === "ashen_bomb" ? 0x9e9e9e : 0xff7043, eye: key === "frost_bomb" ? 0xffffff : 0xfff3c0 };
  if (model === "ghoul") {
    const warden = key === "ossuary_warden";
    return { kind: "human", look: { skin: warden ? 0x6a8a74 : 0x8fa890, noFace: true, eyesGlow: warden ? 0x69f0ae : 0xff3030, claws: true, barefoot: true, top: { type: "rags", color: warden ? 0x1c2621 : 0x3a3a30, sleeves: "none" }, legs: 0x4a4a3e, hair: { style: "long", color: 0x6a6a60 }, head: warden ? { type: "hood", color: 0x1c2621 } : null, prop: { arm: 0.72, leg: 0.82, headR: 0.118, girth: 0.82 } } };
  }
  if (model === "bat") return { kind: "bat", col: key === "duskwing" ? 0x3a2a5a : f.tint || 0x5a4a6a, eye: key === "duskwing" ? 0xd080ff : f.tint ? 0x80d8ff : 0xff3030 };
  if (model === "worm") return { kind: "worm", col: key === "king_wiggles" ? 0xc8a050 : f.tint || 0xb8866a };
  if (model === "hare") return { kind: "hare", col: f.tint || 0xc8a27a };
  if (["bee", "crawler", "sheep", "lizard", "longneck", "crab", "mandrake", "shroom", "fish"].includes(model)) return { kind: model, col: f.tint || 0x888888, col2: f.tint2 };
  return { kind: "human", look: goblinLook("goblin") };
}

function mobVariant(m) { return m.fam && m.fam.nm ? 0 : hashStr((m.famKey || "") + ":" + m.id) % 3; }
function shadeHex(c, k) { const q = new THREE.Color(c); q.multiplyScalar(k); return q.getHex(); }
function varyMobLook(ml, vr) {
  if (!vr) return ml;
  if (ml.kind !== "human") {
    const out = Object.assign({}, ml);
    if (out.col != null) out.col = vr === 1 ? shadeHex(out.col, 0.84) : new THREE.Color(out.col).lerp(new THREE.Color(0xd8b080), 0.14).getHex();
    return out;
  }
  const L = Object.assign({}, ml.look);
  if (L.top) L.top = Object.assign({}, L.top, { color: shadeHex(L.top.color || 0x6a5a4a, vr === 1 ? 0.8 : 1.15) });
  if (vr === 1 && !L.head && !L.leafHead && !L.crest) L.head = { type: L.skull ? "helm" : "cap", color: L.skull ? 0x6a6a64 : 0x5a4a3a };
  if (vr === 2 && !L.pauldrons && L.top && L.top.sleeves !== "none") L.pauldrons = L.skull ? 0x6a6a64 : 0x5a5048;
  if (vr === 2 && L.belt == null) L.belt = 0x3a2a1a;
  return { kind: "human", look: L };
}
function buildEntityRig(e) {
  let sig, make, weaponKind = null, weaponId = null, alwaysDrawn = false;
  if (isMob(e)) {
    const ml = varyMobLook(mobLook(e), mobVariant(e));
    if (ml.kind === "human") {
      sig = "m|" + stableKey(ml.look);
      make = () => humanEntry(ml.look);
      weaponKind = ml.look.weapon; weaponId = ml.look.weaponId;
      alwaysDrawn = true;
    } else if (ml.kind === "bat") { sig = "bat|" + ml.col; make = () => batEntry(ml.col, ml.eye); }
    else if (ml.kind === "worm") { sig = "worm|" + ml.col; make = () => wormEntry(ml.col); }
    else if (ml.kind === "toad") { sig = "toad|" + ml.col; make = () => toadEntry(ml.col); }
    else if (ml.kind === "bomb") { sig = "bomb|" + ml.col; make = () => bombEntry(ml.col, ml.eye); }
    else if (ml.kind === "bee") { sig = "bee|" + ml.col + ml.col2; make = () => beeEntry(ml.col, ml.col2); }
    else if (ml.kind === "crawler") { sig = "crawler|" + ml.col + ml.col2; make = () => crawlerEntry(ml.col, ml.col2); }
    else if (ml.kind === "sheep") { sig = "sheep|" + ml.col; make = () => sheepEntry(ml.col); }
    else if (ml.kind === "lizard") { sig = "lizard|" + ml.col + ml.col2; make = () => lizardEntry(ml.col, ml.col2); }
    else if (ml.kind === "longneck") { sig = "longneck|" + ml.col; make = () => longneckEntry(ml.col); }
    else if (ml.kind === "crab") { sig = "crab|" + ml.col + ml.col2; make = () => crabEntry(ml.col, ml.col2); }
    else if (ml.kind === "mandrake") { sig = "mandrake|" + ml.col + ml.col2; make = () => mandrakeEntry(ml.col, ml.col2); }
    else if (ml.kind === "shroom") { sig = "shroom|" + ml.col + ml.col2; make = () => shroomEntry(ml.col, ml.col2); }
    else if (ml.kind === "fish") { sig = "fish|" + ml.col + ml.col2; make = () => fishEntry(ml.col, ml.col2); }
    else { sig = "hare|" + ml.col; make = () => hareEntry(ml.col); }
  } else if (e.kind === "npc") {
    const nd = typeof NPCS !== "undefined" ? NPCS[e.id] : null;
    if (nd && (nd.prop || nd.crystal || nd.hidden)) return null;
    const L = NPC_LOOK[e.id] || (nd && NPC_LOOK[nd.model]) || (nd ? walkerLook(hashStr(e.id) % 997) : null);
    if (!L) return null;
    sig = "n|" + e.id;
    const LF = L.face == null && !L.noFace ? Object.assign({ face: hashStr(e.id) % FACE_COUNT }, L) : L;
    make = () => humanEntry(LF);
    weaponKind = L.weapon; alwaysDrawn = !!L.alwaysDrawn;
  } else if (e.ambient) {
    sig = "amb|" + e.type + "|" + (e.seed || 0);
    if (e.type === "walker") { const L = walkerLook(e.seed || 0); make = () => humanEntry(L); }
    else if (e.type === "chicken") make = () => birdEntry(e.col || 0xf2ece0, 0xd03020);
    else if (e.type === "gull") make = () => birdEntry(0xf0f2f4, null, 0xe8c040);
    else if (e.type === "bird") make = () => birdEntry(e.col || 0x6a5a4a, null, 0xd8a040);
    else if (e.type === "deer") make = () => quadEntry({ col: e.col || 0x8a6a48, belly: 0xe8dcc8, bodyY: 0.75, bodyR: 0.22, bodyLen: 0.8, leg: 0.68, hip: 0.12, legR: 0.035, neckUp: 0.32, neckFwd: 0.22, neckR: 0.07, headR: 0.11, ears: 1.5, hoof: true, tailLen: 0.12, tailDrop: 0.04, tailR: 0.04, stride: 1.6 });
    else if (e.type === "dog") make = () => quadEntry({ col: e.col || 0x8a6a4a, bodyY: 0.32, bodyR: 0.15, bodyLen: 0.5, leg: 0.28, hip: 0.08, legR: 0.035, neckUp: 0.12, neckFwd: 0.12, neckR: 0.06, headR: 0.09, ears: 1.6, tailLen: 0.22, tailDrop: -0.1, tailR: 0.025, stride: 0.9 });
    else make = () => quadEntry({ col: e.col || 0x5a5a5a, bodyY: 0.2, bodyR: 0.1, bodyLen: 0.36, leg: 0.17, hip: 0.05, legR: 0.022, neckUp: 0.08, neckFwd: 0.08, neckR: 0.045, headR: 0.07, ears: 1.3, eye: 0x9ccc65, tailLen: 0.3, tailDrop: -0.2, tailR: 0.018, stride: 0.6 });
  } else if (e.buddy) {
    const B = BUDDIES[e.petId];
    sig = "buddy|" + e.petId;
    if (B.model === "hare") make = () => hareEntry(B.col);
    else if (B.model === "bat") make = () => batEntry(B.col, B.eye || 0xff3030);
    else if (B.model === "wisp") make = () => wispEntry(B.col, B.eye);
    else if (B.model === "worm") make = () => wormEntry(B.col);
    else { const L = goblinLook("goblin"); L.weapon = null; L.sack = false; make = () => humanEntry(L); }
  } else if (e.pet && e.automaton) {
    sig = "automaton";
    make = () => humanEntry(Object.assign({ build: 0, hair: { style: "bald", color: 0 } }, AUTOMATON_LOOK));
  } else if (e.pet && e.beast) {
    const fk = e.beast, ml = mobLook({ fam: FAMILIES[fk], famKey: fk, id: 0 });
    sig = "beast|" + fk;
    if (ml.kind === "lizard") make = () => lizardEntry(ml.col, ml.col2);
    else if (ml.kind === "crab") make = () => crabEntry(ml.col, ml.col2);
    else if (ml.kind === "sheep") make = () => sheepEntry(ml.col);
    else make = () => hareEntry(ml.col);
  } else if (e.pet) {
    const P = PETS[e.petKey];
    sig = "pet|" + e.petKey;
    make = () => batEntry(P.col, P.eye);
  } else {
    const base = e === player ? playerBase() : e.remote ? baseFromLook(e.look || {}) : (MERC_BASE[e.mercId] || (MERCS[e.mercId] && MERCS[e.mercId].look ? baseFromLook(MERCS[e.mercId].look) : MERC_BASE.kael));
    const L = lookFor(e.job, e.gear, base);
    sig = "h|" + stableKey(L);
    make = () => humanEntry(L);
    weaponKind = L.weapon; weaponId = L.weaponId;
  }
  const entry = entryFor(sig, make);
  const inst = instantiate(entry);
  inst.sig = sig;
  inst.lodEntry = () => entryFor("lo|" + sig, () => { const k = RIG.segK; RIG.segK = 0.5; try { return make(); } finally { RIG.segK = k; } });
  inst.weaponKind = weaponKind;
  inst.weapon = makeWeapon(weaponKind, weaponId);
  inst.alwaysDrawn = alwaysDrawn;
  return inst;
}

const BODY_HEIGHTS = [0.9, 0.95, 1, 1.05, 1.1], BODY_GIRTHS = [0.86, 0.93, 1, 1.1, 1.22];
const BODY_HEIGHT_NAMES = ["Short", "Below average", "Average", "Tall", "Very tall"], BODY_GIRTH_NAMES = ["Slim", "Lean", "Average", "Sturdy", "Heavy"];

const RACE_BODY = {
  human: [{ leg: 0.86, torso: 0.52, arm: 0.6, girth: 1, waist: 0.92, shoulder: 0.195, hip: 0.095, headR: 0.138, neck: 0.075 }, { leg: 0.86, torso: 0.52, arm: 0.6, girth: 0.9, waist: 0.8, shoulder: 0.165, hip: 0.1, headR: 0.138, neck: 0.075 }],
  elari: [{ leg: 0.99, torso: 0.57, arm: 0.67, girth: 0.88, waist: 0.84, shoulder: 0.19, hip: 0.09, headR: 0.13, neck: 0.088 }, { leg: 0.97, torso: 0.55, arm: 0.65, girth: 0.82, waist: 0.74, shoulder: 0.158, hip: 0.098, headR: 0.128, neck: 0.088 }],
  pipkin: [{ leg: 0.34, torso: 0.3, arm: 0.3, girth: 1.0, waist: 1.0, shoulder: 0.125, hip: 0.072, headR: 0.2, neck: 0.03 }, { leg: 0.34, torso: 0.3, arm: 0.3, girth: 0.96, waist: 0.94, shoulder: 0.118, hip: 0.074, headR: 0.2, neck: 0.03 }],
  ursan: [{ leg: 0.94, torso: 0.78, arm: 0.84, girth: 1.45, waist: 1.32, shoulder: 0.3, hip: 0.14, headR: 0.155, neck: 0.045 }, { leg: 0.94, torso: 0.78, arm: 0.84, girth: 1.45, waist: 1.32, shoulder: 0.3, hip: 0.14, headR: 0.155, neck: 0.045 }],
  nekari: [{ leg: 0.88, torso: 0.5, arm: 0.58, girth: 0.86, waist: 0.76, shoulder: 0.16, hip: 0.098, headR: 0.134, neck: 0.075 }, { leg: 0.88, torso: 0.5, arm: 0.58, girth: 0.84, waist: 0.74, shoulder: 0.155, hip: 0.1, headR: 0.134, neck: 0.075 }]
};

function raceOfLook(l) { return l && RACE_BODY[l.race] ? l.race : "human"; }

function bodyProp(l) {
  const hi = l.height == null ? 2 : l.height, gi = l.girth == null ? 2 : l.girth, race = raceOfLook(l);
  if (race === "human" && hi === 2 && gi === 2) return null;
  const H = BODY_HEIGHTS[hi] || 1, G = BODY_GIRTHS[gi] || 1, B = RACE_BODY[race][l.build === 1 ? 1 : 0];
  return { leg: B.leg * H, torso: B.torso * H, arm: B.arm * H, girth: B.girth * G, waist: B.waist * Math.pow(G, 1.4), shoulder: B.shoulder * (1 + (G - 1) * 0.6) * (0.5 + H * 0.5), hip: B.hip * (1 + (G - 1) * 0.7), headR: B.headR, neck: B.neck };
}

function baseFromLook(look) {
  const l = look || {};
  const b = { build: l.build || 0, skin: SKIN_TONES[Math.min(l.skin || 0, SKIN_TONES.length - 1)], hair: { style: HAIR_STYLES[l.hairStyle || 0] || "short", color: HAIR_COLORS[l.hairColor || 0] }, face: l.face || 0 };
  const p = bodyProp(l);
  if (p) b.prop = p;
  const race = raceOfLook(l);
  if (race === "elari") b.ears = "elf";
  if (race === "pipkin") { b.ears = "pip"; b.doll = true; }
  if (race === "nekari") { b.ears = "cat"; b.tail = "cat"; }
  if (race === "ursan") { b.tail = "ursan"; b.beard = b.hair.color; b.ears = "ursan"; }
  return b;
}

function playerBase() { return baseFromLook(save.look); }

function rigSigFor(e) {
  if (e.pet) return "pet|" + e.petKey;
  if (e.buddy) return "buddy|" + e.petId;
  if (e.ambient) return "amb|" + e.type + "|" + (e.seed || 0);
  if (e.remote) return "r|" + e.job + "|" + SLOTS.map(s => (e.gear || {})[s] || "").join(",") + "|" + JSON.stringify(e.look || {});
  if (isMob(e)) return "m|" + (e.fam.key || e.famKey);
  if (e.kind === "npc") return "n|" + e.id;
  return "p|" + e.job + "|" + SLOTS.map(s => e.gear[s] || "").join(",") + "|" + (e === player ? JSON.stringify(save.look || {}) : e.mercId);
}

function buildMount(coatId) {
  const id = MOUNT_COATS[coatId] ? coatId : "teal";
  const entry = entryFor("thornstrider|" + id, () => thornstriderEntry(MOUNT_COATS[id]));
  return instantiate(entry);
}
