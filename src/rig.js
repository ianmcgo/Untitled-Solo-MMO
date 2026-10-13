const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const REGIONS = ["skin", "face", "cloth", "leather", "metal", "hair", "trim", "fur", "bone", "scale", "feather", "wood", "glow", "plain", "chain", "quilt"];
const ATLAS_SIZE = 1024, ATLAS_CELL = 256;
const RIG = { atlas: null, cache: new Map(), weaponCache: new Map(), glowMat: null, weaponMat: null };

const SKIN_TONES = [0xf3d2b8, 0xe8b894, 0xc98d64, 0x6b4128];
const HAIR_STYLES = ["short", "spiky", "long", "ponytail", "bob", "bun", "bald"];
const HAIR_BY_SEX = [["short", "spiky", "long", "ponytail", "bald"], ["long", "ponytail", "bob", "bun", "short"]];
const HAIR_STYLE_NAMES = { short: "Short", spiky: "Spiky", long: "Long", ponytail: "Ponytail", bob: "Bob", bun: "Bun", bald: "Shaved" };
const HAIR_COLORS = [0x2a1d14, 0x5a3a22, 0x8a5a2c, 0xd8b070, 0xb03a2e, 0x1d1d22, 0xe0e0f0, 0x3a5a8a];

const REGION_PAINT = {
  skin(u, v, o) { const n = NOISE.fbm(u * 8, v * 8, 3, 8, 11); o[0] = 0.93 + 0.07 * n; o[1] = n * 0.12; o[2] = 0.62; o[3] = 0; },
  face(u, v, o) { const n = NOISE.fbm(u * 8, v * 8, 3, 8, 13); o[0] = 0.94 + 0.06 * n; o[1] = n * 0.08; o[2] = 0.58; o[3] = 0; },
  cloth(u, v, o, x, y) { const w = ((x >> 1) & 1) ^ ((y >> 1) & 1); const n = NOISE.fbm(u * 10, v * 10, 3, 10, 21); o[0] = 0.8 + 0.07 * w + 0.13 * n; o[1] = 0.25 + 0.45 * w + 0.2 * n; o[2] = 0.95; o[3] = 0; },
  leather(u, v, o, x, y) {
    const n = NOISE.fbm(u * 12, v * 12, 4, 12, 31);
    const st = (x % 22 < 12 && ((y > 8 && y < 12) || (y > 244 && y < 248))) ? 1 : 0;
    o[0] = 0.68 + 0.32 * n - st * 0.3; o[1] = n * 0.6 - st * 0.4; o[2] = 0.5 + 0.25 * (1 - n); o[3] = 0;
  },
  metal(u, v, o) {
    const br = NOISE.value(u * 3, v * 140, 0, 41);
    const sc = NOISE.value(u * 30, v * 30, 0, 43) > 0.9 ? -0.12 : 0;
    o[0] = 0.8 + 0.14 * br + sc; o[1] = br * 0.2 + sc; o[2] = 0.26 + 0.18 * br; o[3] = 0.95;
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

function paintFace(g) {
  g.save();
  g.translate(ATLAS_CELL, 0);
  const ex = 64, ey = 120;
  for (const s of [-1, 1]) {
    const x = ex + s * 15;
    g.fillStyle = "rgb(250,246,240)";
    g.beginPath(); g.ellipse(x, ey + 1, 7.5, 8.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgb(70,46,32)";
    g.beginPath(); g.ellipse(x + s * 0.5, ey + 2, 5.2, 7.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "rgb(22,14,10)";
    g.beginPath(); g.ellipse(x + s * 0.5, ey + 2.5, 2.6, 3.8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(x - 1.8, ey - 1.8, 1.5, 2, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgb(30,20,16)"; g.lineWidth = 2.6; g.lineCap = "round";
    g.beginPath(); g.ellipse(x, ey + 1.5, 8.5, 9.5, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    g.lineWidth = 3.2;
    g.beginPath(); g.moveTo(x - s * 8, ey - 15); g.quadraticCurveTo(x, ey - 20, x + s * 9, ey - 16); g.stroke();
    g.fillStyle = "rgba(225,120,110,0.16)";
    g.beginPath(); g.ellipse(ex + s * 23, ey + 27, 7, 4.5, 0, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "rgba(110,70,50,0.18)";
  g.beginPath(); g.ellipse(ex, ey + 25, 3, 6, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgb(140,72,64)"; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(ex - 6, ey + 42); g.quadraticCurveTo(ex, ey + 46, ex + 6, ey + 42); g.stroke();
  g.restore();
}

function buildAtlas() {
  const N = ATLAS_SIZE;
  const alb = new Float32Array(N * N), hgt = new Float32Array(N * N), rgh = new Float32Array(N * N), mtl = new Float32Array(N * N);
  const o = [0, 0, 0, 0];
  REGIONS.forEach((name, i) => {
    const ox = (i % 4) * ATLAS_CELL, oy = Math.floor(i / 4) * ATLAS_CELL;
    const fn = REGION_PAINT[name];
    for (let y = 0; y < ATLAS_CELL; y++) for (let x = 0; x < ATLAS_CELL; x++) {
      fn(x / ATLAS_CELL, y / ATLAS_CELL, o, x, y);
      const k = (oy + y) * N + ox + x;
      alb[k] = o[0]; hgt[k] = o[1]; rgh[k] = o[2]; mtl[k] = o[3];
    }
  });
  const ca = makeCanvas(N, N), ga = ca.getContext("2d"), ia = ga.createImageData(N, N);
  const cn = makeCanvas(N, N), gn = cn.getContext("2d"), inn = gn.createImageData(N, N);
  const cm = makeCanvas(N, N), gm = cm.getContext("2d"), im = gm.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
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
  paintFace(ga);
  gn.putImageData(inn, 0, 0);
  gm.putImageData(im, 0, 0);
  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = TEXLIB.anisotropy; t.needsUpdate = true; return t; };
  RIG.atlas = { map: mk(ca, true), normal: mk(cn, false), mr: mk(cm, false) };
  RIG.glowMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.DoubleSide });
  RIG.weaponMat = charMaterial();
}

function charMaterial() {
  return new THREE.MeshStandardMaterial({
    map: RIG.atlas.map, normalMap: RIG.atlas.normal, normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: RIG.atlas.mr, metalnessMap: RIG.atlas.mr, roughness: 1, metalness: 1,
    vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 1.6
  });
}

function regionUV(geo, region) {
  const idx = Math.max(0, REGIONS.indexOf(region));
  const cx = idx % 4, cy = Math.floor(idx / 4);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const u = 0.03 + clamp(uv.getX(i), 0, 1) * 0.94, v = 0.03 + clamp(uv.getY(i), 0, 1) * 0.94;
    uv.setXY(i, (cx + u) / 4, 1 - (cy + 1 - v) / 4);
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
    (glow ? this.glow : this.pieces).push(g);
  }
  smoothJoints() {
    const J = { foreArm: [0.085, 0.5], hand: [0.05, 0.5], shin: [0.095, 0.5], foot: [0.05, 0.45], upArm: [0.075, 0.35], thigh: [0.09, 0.35], chest: [0.1, 0.35], spine: [0.09, 0.35], neck: [0.05, 0.3] };
    const info = this.defs.map(d => {
      const key = d.name.replace(/[LR]$/, "");
      const j = J[key];
      return j && d.parent != null ? { r: j[0], m: j[1], at: d.world, parent: d.parent } : null;
    });
    const kids = this.defs.map(() => []);
    info.forEach((j, i) => { if (j) kids[j.parent].push(i); });
    const v = new THREE.Vector3();
    for (const g of this.pieces) {
      const pos = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
      for (let i = 0; i < pos.count; i++) {
        const b = si.getX(i);
        v.fromBufferAttribute(pos, i);
        let other = -1, w = 0;
        const own = info[b];
        if (own) { const d = v.distanceTo(own.at); if (d < own.r) { other = own.parent; w = own.m * (1 - d / own.r); } }
        for (const k of kids[b]) {
          const j = info[k], d = v.distanceTo(j.at);
          if (d < j.r) { const wk = j.m * (1 - d / j.r); if (wk > w) { other = k; w = wk; } }
        }
        if (other < 0 || w <= 0.001) continue;
        si.setXY(i, b, other);
        sw.setXY(i, 1 - w, w);
      }
    }
  }
  finish() {
    if (this.defs.length > 6) this.smoothJoints();
    const main = this.pieces.length ? THREE.mergeGeometries(this.pieces) : null;
    const glow = this.glow.length ? THREE.mergeGeometries(this.glow) : null;
    let geo;
    if (main && glow) geo = THREE.mergeGeometries([main, glow], true);
    else { geo = main || glow; geo.clearGroups(); geo.addGroup(0, geo.attributes.position.count, main ? 0 : 1); }
    geo.computeBoundingSphere();
    geo.boundingSphere.radius *= 1.6;
    for (const g of this.pieces.concat(this.glow)) g.dispose();
    return { geo, defs: this.defs.map(d => ({ name: d.name, parent: d.parent, local: d.local })), meta: this.meta };
  }
}

function orientBetween(g, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}
function gTaper(a, b, ra, rb, seg, flat) {
  const g = new THREE.CylinderGeometry(rb, ra, Math.max(0.001, a.distanceTo(b)), seg || 10, 1);
  if (flat) g.scale(flat, 1, 1);
  return orientBetween(g, a, b);
}
function gBall(p, r, sx, sy, sz, seg) {
  const s = seg || 12;
  const g = new THREE.SphereGeometry(r, s, Math.max(6, Math.round(s * 0.7)));
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gPartSphere(p, r, gap, thetaLen, sx, sy, sz, seg, thetaStart) {
  const g = new THREE.SphereGeometry(r, seg || 16, 10, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, thetaStart || 0, thetaLen);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gFront(p, r, width, t0, t1, sx, sy, sz, seg) {
  const g = new THREE.SphereGeometry(r, seg || 12, 8, Math.PI / 2 - width / 2, width, t0, t1 - t0);
  g.scale(sx || 1, sy || 1, sz || 1);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gLathe(prof, sx, sz, seg) {
  const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(Math.max(0.002, r), y)), seg || 18);
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
  const g = new THREE.CylinderGeometry(rt, rb, h, seg || 14, 1, !!open, t0 || 0, tl || Math.PI * 2);
  g.translate(p.x, p.y, p.z);
  return g;
}
function gRing(p, R, r, axis, seg, arc, rot) {
  const g = new THREE.TorusGeometry(R, r, 6, seg || 20, arc || Math.PI * 2);
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
  MNK: { shirt: 0xd8893a, pants: 0x5a3f28, robe: 0xd8893a, trim: 0x8a3a2a }
};

const ITEM_LOOK = {
  leather_vest: { top: { type: "vest", color: 0x7a5230, region: "leather" } },
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
  brigand_vest: { top: { type: "vest", color: 0x2f2a28, region: "leather", under: 0x5a4a3a } },
  training_gi: { top: { type: "tunic", color: 0xe8e0cc, region: "cloth" }, belt: 0x2a2a2a },
  mire_mantle: { top: { type: "robe", color: 0x2f4030, trim: 0x8aa070 }, head: { type: "hood", color: 0x2f4030 } }
};

const MERC_BASE = {
  kael: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: HAIR_COLORS[1] } },
  rook: { build: 0, skin: SKIN_TONES[3], hair: { style: "spiky", color: HAIR_COLORS[5] } },
  mira: { build: 1, skin: SKIN_TONES[0], hair: { style: "long", color: HAIR_COLORS[3] } },
  fen: { build: 0, skin: SKIN_TONES[2], hair: { style: "bob", color: HAIR_COLORS[2] } },
  sable: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: 0x2a2440 } },
  dorn: { build: 0, skin: SKIN_TONES[1], hair: { style: "short", color: 0x8a8a8a }, beard: 0x8a8a8a },
  lisette: { build: 1, skin: SKIN_TONES[0], hair: { style: "bun", color: HAIR_COLORS[4] } },
  vesper: { build: 1, skin: SKIN_TONES[3], hair: { style: "long", color: HAIR_COLORS[6] } },
  wren: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[4] } },
  tamsin: { build: 1, skin: SKIN_TONES[2], hair: { style: "bun", color: HAIR_COLORS[0] } }
};

const NPC_LOOK = {
  rhea: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: 0x8a3a20 }, top: { type: "tabard", color: 0x9aa0a8, region: "chain", color2: 0x2f5c9a }, pauldrons: 0xb8bec6, cape: 0x1d3f75, legs: 0x3a3a44, boots: 0x3a2618, gloves: 0x5a3a22, belt: 0x4a2e1a, weapon: "sword" },
  tobin: { build: 0, skin: SKIN_TONES[0], hair: { style: "bald", color: 0xdedede }, beard: 0xe6e6e6, longBeard: true, top: { type: "robe", color: 0x5a3a7a, trim: 0xd8b050, sleeves: "wide" }, legs: 0x3a2a4a, weapon: "staff", alwaysDrawn: true },
  ilsa: { build: 1, skin: SKIN_TONES[1], hair: { style: "ponytail", color: HAIR_COLORS[6] }, top: { type: "coat", color: 0x1f3a5a, trim: 0xd8c070 }, head: { type: "feathered", color: 0x1f2a3a, color2: 0xd8c070 }, legs: 0x2a2a30, boots: 0x1a1410, belt: 0x3a2a1a, weapon: "sword", prop: { leg: 0.9 } },
  marn: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[2] }, beard: HAIR_COLORS[2], top: { type: "apron", color: 0x5a8aa8, color2: 0xd8d0c0 }, head: { type: "bandana", color: 0x1a5a8a }, legs: 0x3a4048, boots: 0x2a2a2a, belt: 0x3a2a1a, prop: { girth: 1.15 } },
  vela: { build: 1, skin: SKIN_TONES[0], hair: { style: "bob", color: HAIR_COLORS[4] }, top: { type: "tabard", color: 0x5a2a6a, region: "cloth", color2: 0xd8c070 }, legs: 0x2a2030, boots: 0x3a2618, gloves: 0x6a4428, belt: 0x4a2e1a },
  garrick: { build: 0, skin: SKIN_TONES[1], hair: { style: "bald", color: HAIR_COLORS[0] }, beard: 0x8a5a2c, longBeard: true, top: { type: "apron", color: 0x3a2a20, color2: 0x6a4a30 }, legs: 0x3a3028, boots: 0x2a1e14, gloves: 0x4a3020, belt: 0x2a1e14, weapon: "club", alwaysDrawn: false, prop: { girth: 1.2, shoulder: 0.215 } },
  pell: { build: 0, skin: SKIN_TONES[2], hair: { style: "short", color: HAIR_COLORS[1] }, beard: HAIR_COLORS[1], top: { type: "apron", color: 0xd6c6a0, color2: 0x7a5230 }, head: { type: "bandana", color: 0xa0302a }, legs: 0x4a4038, boots: 0x3a2a1e, belt: 0x5a3a20, prop: { girth: 1.12 } },
  brann: { build: 0, skin: SKIN_TONES[2], hair: { style: "spiky", color: 0x1d1d22 }, beard: 0x1d1d22, top: { type: "fur", color: 0x6a4a2a, region: "fur", sleeves: "none" }, pauldrons: 0x55585e, legs: 0x3a3028, legsRegion: "leather", boots: 0x2a1e14, gloves: 0x3a2a1e, belt: 0x2a1e14, weapon: "greataxe", prop: { girth: 1.15, shoulder: 0.22 } },
  ysolde: { build: 1, skin: SKIN_TONES[2], hair: { style: "ponytail", color: HAIR_COLORS[3] }, top: { type: "coat", color: 0x2f5a3a, trim: 0xc8a040 }, legs: 0x6a5238, legsRegion: "leather", boots: 0x3a2618, gloves: 0x6a4428, belt: 0x4a2e1a }
};

function lookFor(job, gear, base) {
  const tint = JOB_TINT[job] || JOB_TINT.WAR;
  const L = Object.assign({ legs: tint.pants, top: { type: "shirt", color: tint.shirt }, belt: 0x4a3020 }, base);
  for (const slot of SLOTS) {
    const id = gear[slot];
    const il = id && ITEM_LOOK[id];
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

function hairPieces(R, H, hc, hr, covered) {
  if (!H || H.style === "bald") return;
  const c = H.color, st = H.style;
  const top = V3(0, hc + 0.004, -0.004);
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
    if (st === "bun") R.add(gBall(V3(0, hc + hr * 0.7, -hr * 0.75), hr * 0.42, 1, 1, 1, 10), "head", c, "hair");
  }
  if (st === "long") R.add(gBall(V3(0, hc - hr * 1.05, -hr * 0.62), hr * 0.95, 1.0, 1.9, 0.45, 12), "head", c, "hair");
  if (st === "ponytail") {
    R.add(gBall(V3(0, hc + hr * 0.2, -hr * 0.98), hr * 0.3, 1, 1, 1, 8), "head", c, "hair");
    R.add(gTaper(V3(0, hc + hr * 0.15, -hr * 1.08), V3(0, hc - hr * 1.6, -hr * 1.35), hr * 0.3, hr * 0.08, 8), "head", c, "hair");
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
  const skin = L.skin;
  const top = L.top || { type: "shirt", color: 0x8a7a60 };
  const topC = top.color, topR = top.region || "cloth";
  const legC = L.legs != null ? L.legs : 0x4a3a2c, legR = L.legsRegion || "cloth";
  const sleeves = top.sleeves || (top.type === "robe" ? "wide" : top.type === "fur" ? "none" : "long");
  const sleeveC = top.type === "vest" ? (top.under || 0xd8cfb8) : top.type === "tabard" ? (top.region === "cloth" ? topC : 0x9aa0a8) : top.type === "apron" ? topC : top.type === "fur" ? skin : topC;
  const sleeveR = top.type === "vest" ? "cloth" : top.type === "tabard" ? (top.region === "cloth" ? "cloth" : "chain") : topR;
  const hr = pr.headR, hc = headY + hr * 0.82;
  if (!L.head && L.hat) L.head = { type: "feathered", color: L.hat, color2: 0xd8c070 };
  const headCovers = L.head && ["cap", "helm", "horned", "hood", "pointy", "feathered"].includes(L.head.type);

  R.add(gBall(V3(0, hc, 0.005), hr, 0.94, 1.04, 1.0, 20), "head", skin, L.noFace ? (L.headRegion || "skin") : "face");
  if (L.nose === "goblin") R.add(gTaper(V3(0, hc - hr * 0.05, hr * 0.85), V3(0, hc - hr * 0.35, hr * 1.85), hr * 0.22, hr * 0.06, 8), "head", skin, "skin");
  else if (!L.skull) R.add(gBall(V3(0, hc - hr * 0.13, hr * 0.93), hr * 0.13, 0.75, 1.0, 0.8, 8), "head", skin, "skin");
  for (const s of [-1, 1]) {
    if (L.ears === "goblin") R.add(gTaper(V3(s * hr * 0.8, hc + hr * 0.05, -0.02), V3(s * (hr + 0.24), hc + hr * 0.75, -0.1), hr * 0.32, 0.005, 6, 0.45), "head", skin, "skin");
    else if (!L.skull) R.add(gBall(V3(s * hr * 0.93, hc - hr * 0.05, -hr * 0.05), hr * 0.2, 0.45, 1, 0.75, 8), "head", skin, "skin");
    if (L.eyesGlow) R.add(gBall(V3(s * hr * 0.36, hc + hr * 0.08, hr * 0.84), hr * 0.15, 1.25, 0.75, 0.5, 8), "head", L.eyesGlow, "glow", true);
  }
  if (L.skull) R.add(gBox(V3(0, hc - hr * 0.75, hr * 0.35), hr * 1.1, hr * 0.45, hr * 0.9), "head", skin, "bone");
  if (L.beard) {
    R.add(gFront(V3(0, hc, 0.005), hr * 1.04, 2.3, Math.PI * 0.55, Math.PI * 0.92, 0.96, 1.04, 1.02, 14), "head", L.beard, "hair");
    if (L.longBeard) R.add(gBall(V3(0, hc - hr * 1.2, hr * 0.6), hr * 0.5, 0.9, 1.6, 0.55, 10), "head", L.beard, "hair");
  }
  hairPieces(R, L.hair, hc, hr, headCovers);

  if (!L.skull) {
    R.add(gTaper(V3(0, neckY - 0.05, 0), V3(0, headY + 0.04, 0.0), 0.05 * gi, 0.043 * gi, 10), "neck", skin, "skin");
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
    const fa1C = longS ? sleeveC : (L.skull ? skin : skin), fa1R = longS ? sleeveR : (L.skull ? "bone" : "skin");
    R.add(gTaper(V3(ex, elY, 0), V3(ex, mid, 0), L.skull ? 0.02 : 0.042 * gi, L.skull ? 0.02 : 0.038 * gi, 10), "foreArm" + sd, fa1C, fa1R);
    const fa2C = L.gloves != null ? L.gloves : fa1C, fa2R = L.gloves != null ? (L.glovesRegion || "leather") : fa1R;
    R.add(gTaper(V3(ex, mid, 0), V3(wx, wrY + 0.01, 0), L.skull ? 0.02 : 0.038 * gi, L.skull ? 0.018 : 0.033 * gi, 10), "foreArm" + sd, fa2C, fa2R);
    if (sleeves === "wide" && !bare) {
      R.add(gCyl(V3(ex, wrY + 0.07, 0), 0.05 * gi, 0.085 * gi, 0.16, 14, true), "foreArm" + sd, sleeveC, sleeveR);
      if (top.trim) R.add(gRing(V3(ex, wrY - 0.01, 0), 0.085 * gi, 0.012, "y", 18), "foreArm" + sd, top.trim, "trim", !!top.glowTrim);
    } else if (top.trim && longS) R.add(gRing(V3(wx, wrY + 0.02, 0), 0.04 * gi, 0.009, "y", 14), "foreArm" + sd, top.trim, "trim");
    const handC = L.gloves != null ? L.gloves : skin, handR = L.gloves != null ? (L.glovesRegion || "leather") : (L.skull ? "bone" : "skin");
    R.add(gBall(V3(s * (sw + 0.025), wrY - 0.055, 0.005), L.skull ? 0.03 : 0.045, 0.75, 1.15, 0.55, 10), "hand" + sd, handC, handR);
    R.add(gBall(V3(s * (sw + 0.005), wrY - 0.035, 0.035), 0.018, 1, 1.6, 1, 6), "hand" + sd, handC, handR);
    if (L.claws) for (let k = -1; k <= 1; k++) R.add(gTaper(V3(s * (sw + 0.025) + k * 0.015, wrY - 0.09, 0.01), V3(s * (sw + 0.03) + k * 0.02, wrY - 0.19, 0.05), 0.01, 0.002, 5), "hand" + sd, 0xd8d0b8, "bone");
    if (L.pauldrons) {
      R.add(gPartSphere(V3(ax * 1.04, shY + 0.01, 0), 0.085 * gi, 0, Math.PI * 0.55, 1.15, 0.8, 1.05, 14), "upArm" + sd, L.pauldrons, "metal");
      R.add(gRing(V3(ax * 1.04, shY - 0.015, 0), 0.093 * gi, 0.01, "y", 16), "upArm" + sd, 0xc8a040, "metal");
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
    const footC = L.boots != null ? L.boots : L.barefoot ? skin : L.skull ? skin : (L.shoes || 0x3a2a1e);
    const footR = L.boots != null ? "leather" : L.barefoot ? "skin" : L.skull ? "bone" : "leather";
    R.add(gBox(V3(hx, 0.042, 0.035), L.skull ? 0.06 : 0.092, 0.075, 0.2), "foot" + sd, footC, footR);
    R.add(gBall(V3(hx, 0.045, 0.13), L.skull ? 0.035 : 0.048, 1, 0.8, 1.0, 10), "foot" + sd, footC, footR);
  }

  const t = top.type;
  if ((t === "robe" || t === "coat") && !L.skull) {
    const bottom = t === "robe" ? 0.1 : knee - 0.08;
    const h = hipJ + 0.05 - bottom;
    for (const [s, sd] of [[1, "L"], [-1, "R"]]) {
      R.add(gCyl(V3(0, bottom + h / 2, 0), 0.17 * gi, 0.25 * gi, h, 12, true, s > 0 ? 0 : Math.PI, Math.PI), "thigh" + sd, topC, topR);
      if (top.trim) R.add(gCyl(V3(0, bottom + 0.035, 0), 0.248 * gi, 0.252 * gi, 0.07, 12, true, s > 0 ? 0 : Math.PI, Math.PI), "thigh" + sd, top.trim, "trim", !!top.glowTrim);
    }
    if (top.trim) R.add(gRing(V3(0, neckY - 0.02, 0.01), 0.075 * gi, 0.016, "y", 18), "chest", top.trim, "trim", !!top.glowTrim);
    R.add(gRing(V3(0, hipsY + 0.03, 0), 0.15 * gi * pr.waist + 0.01, 0.025, "y", 18), "hips", top.trim || 0x4a3020, "cloth");
    if (t === "robe") R.add(gBox(V3(0.05, hipsY - 0.12, 0.13), 0.05, 0.22, 0.015), "hips", top.trim || 0x4a3020, "cloth");
  }
  if (t === "tunic" || t === "mail" || t === "tabard" || t === "rags") {
    const c = t === "mail" ? 0x9aa0a8 : topC;
    R.add(gCyl(V3(0, hipsY - 0.09, 0), 0.155 * gi, 0.2 * gi, 0.2, 14, true), "hips", c, t === "mail" ? "metal" : topR);
  }
  if (t === "tabard") {
    R.add(gBox(V3(0, chestY - 0.12, 0.125 * gi), 0.2, 0.62, 0.012), "chest", top.color2, "cloth");
    R.add(gBox(V3(0, chestY - 0.12, -0.125 * gi), 0.2, 0.62, 0.012), "chest", top.color2, "cloth");
  }
  if (t === "apron") R.add(gBox(V3(0, hipsY - 0.05, 0.13 * gi), 0.26, 0.55, 0.012), "hips", top.color2, "leather");
  if (t === "fur") R.add(gRing(V3(0, neckY - 0.04, 0), 0.12 * gi, 0.06, "y", 14), "chest", topC, "fur");
  if (t === "rags") for (let k = 0; k < 5; k++) R.add(gBox(V3(Math.cos(k * 1.3) * 0.15, hipsY - 0.3, Math.sin(k * 1.3) * 0.12), 0.06, 0.22, 0.01, 0, k * 1.3, 0), "hips", topC, "cloth");
  if (L.belt && t !== "robe" && t !== "coat" && !L.skull) {
    R.add(gRing(V3(0, hipsY + 0.03, 0), 0.15 * gi * pr.waist + 0.01, 0.02, "y", 18), "hips", L.belt, "leather");
    R.add(gBox(V3(0, hipsY + 0.03, 0.15 * gi * pr.waist + 0.02), 0.05, 0.04, 0.015), "hips", 0xc8a040, "metal");
  }
  if (L.cape) {
    R.add(gBox(V3(0, (shY + knee) / 2 + 0.02, -0.15 * gi), sw * 2.0, shY - knee, 0.02, 0.1, 0, 0), "chest", L.cape, "cloth");
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
      R.add(gRing(V3(0, hc + hr * 0.55, 0), hr * 0.85, 0.02, "y", 18), "head", 0xd8b040, "metal");
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; R.add(gTaper(V3(Math.sin(a) * hr * 0.85, hc + hr * 0.55, Math.cos(a) * hr * 0.85), V3(Math.sin(a) * hr * 0.9, hc + hr * 0.95, Math.cos(a) * hr * 0.9), 0.025, 0.003, 5), "head", 0xd8b040, "metal"); }
    }
  }

  R.meta = { kind: "human", hipsY, chestY, headTop: hc + hr * (L.head && L.head.type === "pointy" ? 4.2 : L.head && L.head.type === "horned" ? 2.1 : 1.2), hand: "handR", wrY };
  return R.finish();
}

function goblinLook(variant) {
  const base = { noFace: true, ears: "goblin", nose: "goblin", eyesGlow: 0xffd040, barefoot: true, sack: true, legs: 0x5a4632, belt: 0x3a2a1a };
  if (variant === "chieftain") return Object.assign(base, { skin: 0x6a7a34, top: { type: "mail", color: 0x55585e, region: "chain" }, head: { type: "horned", color: 0x4a4a44, color2: 0xe8dcc0 }, cape: 0x8a1f1f, pauldrons: 0x6a6a64, weapon: "greataxe", sack: false, prop: { leg: 0.62, torso: 0.56, headR: 0.18, arm: 0.62, shoulder: 0.22, hip: 0.11, neck: 0.04, girth: 1.25 } });
  const p = { leg: 0.5, torso: 0.42, headR: 0.16, arm: 0.5, shoulder: 0.165, hip: 0.09, neck: 0.04, girth: 1.05 };
  if (variant === "raider") return Object.assign(base, { skin: 0x6a7a40, top: { type: "tunic", color: 0x4a3a2a, region: "leather" }, head: { type: "cap", color: 0x55585e }, weapon: "dagger", prop: p });
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
    R.add(gBox(V3(s * 0.1, 0.025, -0.03), 0.05, 0.04, 0.2), "legB" + sd, light, "fur");
  }
  R.add(gBall(V3(0, 0.33, -0.28), 0.06, 1, 1, 1, 8), "body", 0xf6f2ea, "fur");
  R.meta = { kind: "hare", headTop: 0.85 };
  return R.finish();
}

function thornstriderEntry() {
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
  const main = 0x3f6f6a, dark = 0x2a4a48, cream = 0xd8cba8, rust = 0xb0552a, gold = 0xd8a040, glow = 0x6ff0e8, horn = 0xcfc0a0;
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
  const iron = id && /iron/.test(id), bronze = id && /bronze/.test(id);
  const blade = iron ? 0xd0d4da : bronze ? 0xc89458 : 0xb8bcc2;
  const wood = 0x7a5432, grip = 0x3a2618, gold = 0xc8a040;
  let tip = [0.1, 0.7];
  if (kind === "sword" || kind === "dagger") {
    const L = kind === "sword" ? 0.72 : 0.26, W = kind === "sword" ? 0.05 : 0.035;
    R.add(gTaper(V3(0, -0.08, 0), V3(0, 0.08, 0), 0.018, 0.016, 8), "w", grip, "leather");
    R.add(gBall(V3(0, -0.1, 0), 0.026, 1, 1, 1, 8), "w", gold, "metal");
    R.add(gBox(V3(0, 0.09, 0), kind === "sword" ? 0.18 : 0.09, 0.025, 0.035), "w", gold, "metal");
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2 * 0.9, L * 0.82); sh.lineTo(0, L); sh.lineTo(-W / 2 * 0.9, L * 0.82); sh.closePath();
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 1 });
    bg.translate(0, 0.1, -0.004);
    const uv = bg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + W) / (2 * W), uv.getY(i) / L);
    R.add(bg, "w", blade, "metal");
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
  } else if (kind === "staff") {
    const holly = id === "holly_staff";
    R.add(gTaper(V3(0, -0.65, 0), V3(0, 0.82, 0), 0.02, 0.016, 8), "w", holly ? 0x5a3a28 : wood, "wood");
    for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; R.add(gTaper(V3(0, 0.8, 0), V3(Math.cos(a) * 0.06, 0.98, Math.sin(a) * 0.06), 0.014, 0.008, 5), "w", holly ? 0x5a3a28 : wood, "wood"); }
    R.add(gBall(V3(0, 0.96, 0), 0.05, 1, 1, 1, 10), "w", holly ? 0xb070ff : 0x7ad7ff, "glow", true);
    R.add(gRing(V3(0, 0.78, 0), 0.025, 0.008, "y", 10), "w", gold, "metal");
    tip = [0.6, 1.0];
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
    tip = [0.62, 1.02];
  }
  const e = R.finish();
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
  if (model === "goblin") return { kind: "human", look: goblinLook(m.famKey === "den_goblin" ? "raider" : m.famKey === "mire_goblin" ? "mire" : "goblin") };
  if (model === "toad") return { kind: "toad", col: key === "old_croaker" ? 0x6a8a30 : 0x5f7a3a };
  if (model === "skeleton") {
    if (key === "hollow_king") return { kind: "human", look: { skull: true, skin: 0xd8d0b8, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "cloth", color2: 0xd8b040 }, cape: 0x3a1030, legs: 0xd8d0b8, barefoot: true, head: { type: "crown" }, weapon: "sword", weaponId: "iron_sword", prop: { girth: 0.85 } } };
    if (key === "crypt_sentinel") return { kind: "human", look: { skull: true, skin: 0xc8d0c8, noFace: true, headRegion: "bone", eyesGlow: 0x80cbc4, top: { type: "mail", color: 0x4a5a5a, region: "chain" }, pauldrons: 0x5a6a6a, legs: 0xc8d0c8, barefoot: true, head: { type: "helm", color: 0x4a5a5a }, weapon: "greataxe", weaponId: "bronze_greataxe", prop: { girth: 0.85 } } };
    if (key === "royal_guard") return { kind: "human", look: { skull: true, skin: 0xe0dccc, noFace: true, headRegion: "bone", eyesGlow: 0xffd54f, top: { type: "tabard", color: 0x2a1a3a, region: "chain", color2: 0xd8b040 }, legs: 0xe0dccc, barefoot: true, head: { type: "cap", color: 0x5a5a62 }, weapon: "sword", weaponId: "bronze_sword", prop: { girth: 0.75 } } };
    return { kind: "human", look: { skull: true, skin: 0xe8e2cf, noFace: true, headRegion: "bone", eyesGlow: 0x66e0ff, top: { type: "rags", color: 0x3a3028 }, legs: 0xe8e2cf, barefoot: true, weapon: "sword", weaponId: "rusty", prop: { girth: 0.7 } } };
  }
  if (model === "ghoul") {
    const warden = key === "ossuary_warden";
    return { kind: "human", look: { skin: warden ? 0x6a8a74 : 0x8fa890, noFace: true, eyesGlow: warden ? 0x69f0ae : 0xff3030, claws: true, barefoot: true, top: { type: "rags", color: warden ? 0x1c2621 : 0x3a3a30, sleeves: "none" }, legs: 0x4a4a3e, hair: { style: "long", color: 0x6a6a60 }, head: warden ? { type: "hood", color: 0x1c2621 } : null, prop: { arm: 0.72, leg: 0.82, headR: 0.118, girth: 0.82 } } };
  }
  if (model === "bat") return { kind: "bat", col: key === "duskwing" ? 0x3a2a5a : 0x5a4a6a, eye: key === "duskwing" ? 0xd080ff : 0xff3030 };
  if (model === "worm") return { kind: "worm", col: key === "king_wiggles" ? 0xc8a050 : f.tint || 0xb8866a };
  if (model === "hare") return { kind: "hare", col: f.tint || 0xc8a27a };
  return { kind: "human", look: goblinLook("goblin") };
}

function buildEntityRig(e) {
  let sig, make, weaponKind = null, weaponId = null, alwaysDrawn = false;
  if (isMob(e)) {
    const ml = mobLook(e);
    if (ml.kind === "human") {
      sig = "m|" + stableKey(ml.look);
      make = () => humanEntry(ml.look);
      weaponKind = ml.look.weapon; weaponId = ml.look.weaponId;
      alwaysDrawn = true;
    } else if (ml.kind === "bat") { sig = "bat|" + ml.col; make = () => batEntry(ml.col, ml.eye); }
    else if (ml.kind === "worm") { sig = "worm|" + ml.col; make = () => wormEntry(ml.col); }
    else if (ml.kind === "toad") { sig = "toad|" + ml.col; make = () => toadEntry(ml.col); }
    else { sig = "hare|" + ml.col; make = () => hareEntry(ml.col); }
  } else if (e.kind === "npc") {
    const L = NPC_LOOK[e.id];
    if (!L) return null;
    sig = "n|" + e.id;
    make = () => humanEntry(L);
    weaponKind = L.weapon; alwaysDrawn = !!L.alwaysDrawn;
  } else {
    const base = e === player ? playerBase() : (MERC_BASE[e.mercId] || MERC_BASE.kael);
    const L = lookFor(e.job, e.gear, base);
    sig = "h|" + stableKey(L);
    make = () => humanEntry(L);
    weaponKind = L.weapon; weaponId = L.weaponId;
  }
  const entry = entryFor(sig, make);
  const inst = instantiate(entry);
  inst.sig = sig;
  inst.weaponKind = weaponKind;
  inst.weapon = makeWeapon(weaponKind, weaponId);
  inst.alwaysDrawn = alwaysDrawn;
  return inst;
}

const BODY_HEIGHTS = [0.9, 0.95, 1, 1.05, 1.1], BODY_GIRTHS = [0.86, 0.93, 1, 1.1, 1.22];
const BODY_HEIGHT_NAMES = ["Short", "Below average", "Average", "Tall", "Very tall"], BODY_GIRTH_NAMES = ["Slim", "Lean", "Average", "Sturdy", "Heavy"];

function bodyProp(l) {
  const hi = l.height == null ? 2 : l.height, gi = l.girth == null ? 2 : l.girth;
  if (hi === 2 && gi === 2) return null;
  const H = BODY_HEIGHTS[hi] || 1, G = BODY_GIRTHS[gi] || 1, fem = l.build === 1;
  return { leg: 0.86 * H, torso: 0.52 * H, arm: 0.6 * H, girth: (fem ? 0.9 : 1) * G, waist: (fem ? 0.8 : 0.92) * Math.pow(G, 1.4), shoulder: (fem ? 0.165 : 0.195) * (1 + (G - 1) * 0.6) * (0.5 + H * 0.5), hip: (fem ? 0.1 : 0.095) * (1 + (G - 1) * 0.7) };
}

function baseFromLook(look) {
  const l = look || {};
  const b = { build: l.build || 0, skin: SKIN_TONES[Math.min(l.skin || 0, SKIN_TONES.length - 1)], hair: { style: HAIR_STYLES[l.hairStyle || 0], color: HAIR_COLORS[l.hairColor || 0] } };
  const p = bodyProp(l);
  if (p) b.prop = p;
  return b;
}

function playerBase() { return baseFromLook(save.look); }

function rigSigFor(e) {
  if (isMob(e)) return "m|" + (e.fam.key || e.famKey);
  if (e.kind === "npc") return "n|" + e.id;
  return "p|" + e.job + "|" + SLOTS.map(s => e.gear[s] || "").join(",") + "|" + (e === player ? JSON.stringify(save.look || {}) : e.mercId);
}

function buildMount() {
  const entry = entryFor("thornstrider", thornstriderEntry);
  return instantiate(entry);
}
