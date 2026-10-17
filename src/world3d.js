const U = 0.05;
const W3 = {
  renderer: null, scene: null, camera: null, composer: null, pmrem: null,
  sky: null, skyScene: null, sun: null, hemi: null, stars: null, moon: null, clouds: null,
  zoneRoot: null, fxRoot: null, field: null, water: null, grassMats: [], torchLights: [], windowMats: [], lampLights: [],
  envRT: null, envTimer: 0, lastSunY: -9, quality: "high", envScene: null, fog: null, daylight: 1, playerLight: null
};

function p2w(px, py, h) { return new THREE.Vector3(px * U, h == null ? groundY(px, py) : h, py * U); }
function footY(field, px, py, rw) {
  const r = Math.max(0.5, rw / U);
  let m = field.heightAt(px, py);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]]) m = Math.min(m, field.heightAt(px + dx * r, py + dy * r));
  return m;
}
function groundY(px, py) { return W3.field ? W3.field.heightAt(px, py) : 0; }

function themeOf(z) { return z.theme || "field"; }

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}

function buildField(zone) { return runSteps(buildFieldSteps(zone)); }

function* scaleSteps(gen, a, b, text) {
  let r;
  while (!(r = gen.next()).done) yield { p: a + (b - a) * (typeof r.value === "number" ? r.value : 0), t: text };
  return r.value;
}

function* buildFieldSteps(zone) {
  const theme = themeOf(zone);
  const M = zone.indoor ? 40 : 640;
  const cs = zone.indoor ? 8 : (zone.cs || 12);
  const x0 = -M, y0 = -M, w = zone.w + 2 * M, h = zone.h + 2 * M;
  const cols = Math.ceil(w / cs) + 1, rows = Math.ceil(h / cs) + 1;
  const amps = { town: [0.7, 0.12, 6], field: [2.6, 0.35, 11], cave: [0.8, 0.45, 13], crypt: [0.25, 0.1, 12], house: [0, 0, 0] }[theme];
  const paths = zone.paths || [];
  const waters = zone.water || [];
  const pathW = (px, py) => {
    let best = 0;
    for (const p of paths) {
      for (let i = 0; i < p.pts.length - 1; i++) {
        const d = distToSeg(px, py, p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1]);
        const wgt = 1 - sstep(p.w * 0.32, p.w * 0.62, d + (NOISE.value(px * 0.05, py * 0.05, 0, 401) - 0.5) * p.w * 0.3);
        if (wgt > best) best = wgt;
      }
    }
    for (const q of (zone.plaza ? [zone.plaza] : []).concat(zone.plazas || [])) best = Math.max(best, 1 - sstep(q.r - 12, q.r + 12, Math.hypot(px - q.x, py - q.y)));
    return best;
  };
  const rutW = (px, py) => {
    let best = 0, mid = 0;
    if (theme !== "field") return [0, 0];
    for (const p of paths) for (let i = 0; i < p.pts.length - 1; i++) {
      const d = distToSeg(px, py, p.pts[i][0], p.pts[i][1], p.pts[i + 1][0], p.pts[i + 1][1]);
      if (d > p.w * 0.4) continue;
      const wob = (NOISE.value(px * 0.02, py * 0.02, 0, 431) - 0.5) * p.w * 0.06;
      best = Math.max(best, 1 - sstep(p.w * 0.035, p.w * 0.075, Math.abs(Math.abs(d + wob) - p.w * 0.17)));
      mid = Math.max(mid, 1 - sstep(p.w * 0.05, p.w * 0.1, Math.abs(d + wob)));
    }
    return [best, mid];
  };
  const plazaList = (zone.plaza ? [zone.plaza] : []).concat(zone.plazas || []);
  const plazaW = (px, py) => { let b = 0; for (const q of plazaList) b = Math.max(b, 1 - sstep(q.r - 12, q.r + 12, Math.hypot(px - q.x, py - q.y))); return b; };
  const walls = zone.walls || [];
  const edgeE = (px, py) => {
    const ix = Math.max(24 - px, px - (zone.w - 24), 0), iy = Math.max(24 - py, py - (zone.h - 24), 0);
    if (ix > 0 || iy > 0) return Math.hypot(ix, iy);
    return -Math.min(px - 24, zone.w - 24 - px, py - 24, zone.h - 24 - py);
  };
  const wallE = (px, py) => {
    let e = -1e9;
    for (const r of walls) {
      const dx = Math.max(r.x - px, px - (r.x + r.w)), dy = Math.max(r.y - py, py - (r.y + r.h));
      const sd = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
      if (-sd > e) e = -sd;
    }
    return e;
  };
  const outsideE = (px, py) => Math.max(edgeE(px, py), wallE(px, py));
  const exitMask = (px, py) => {
    let m = 0;
    for (const ex of zone.exits) {
      if (ex.kind === "door") continue;
      const cx = ex.x + ex.w / 2, cy = ex.y + ex.h / 2;
      const horiz = ex.x <= 0 || ex.x + ex.w >= zone.w;
      const lateral = horiz ? Math.abs(py - cy) : Math.abs(px - cx);
      const along = horiz ? (ex.x <= 0 ? -px : px - zone.w) : (ex.y <= 0 ? -py : py - zone.h);
      const lane0 = ex.lane || 70, depth = (ex.hall || 220) + 60;
      const into = Math.max(0, -along), seedK = (cx * 0.013 + cy * 0.017) % 97;
      const bend = sstep(50, 200, into);
      const wob = (NOISE.fbm(into * 0.0045 + seedK, seedK * 1.7, 2, 0, 521) - 0.5) * 2 * lane0 * 0.7 * bend;
      const lane = lane0 * (1 + (NOISE.fbm(into * 0.008 + seedK * 2, seedK, 2, 0, 523) - 0.5) * 0.7 * bend);
      const lat = Math.abs((horiz ? py - cy : px - cx) - wob) + (NOISE.value(px * 0.035, py * 0.035, 0, 525) - 0.5) * 46 * bend;
      const spread = 170 + NOISE.fbm(into * 0.006 + seedK * 3, (horiz ? py : px) * 0.004, 3, 0, 527) * 230;
      const k = 1 - sstep(lane - 15, lane + spread, lat);
      if (along > -depth) m = Math.max(m, k * k * (3 - 2 * k) * 0.35 + k * 0.65);
    }
    return m;
  };
  const low = (px, py) => (NOISE.fbm(px * 0.0012, py * 0.0012, 4, 0, 301) - 0.5) * 2 * amps[0];
  const mid = (px, py) => (NOISE.fbm(px * 0.006, py * 0.006, 3, 0, 303) - 0.5) * 2 * amps[1];
  let waterLevel = null;
  if (waters.length) {
    let acc = 0;
    for (const wt of waters) acc += low(wt.x, wt.y);
    waterLevel = acc / waters.length - 0.35;
  }
  const raw = (px, py) => {
    let hgt = low(px, py) + mid(px, py);
    const pw = pathW(px, py);
    hgt = mix(hgt, low(px, py) * 0.7, pw * 0.85);
    hgt = mix(hgt, 0.05, plazaW(px, py));
    if (theme === "town") hgt *= 0.6;
    for (const wt of waters) {
      const d = Math.hypot(px - wt.x, py - wt.y);
      const flat = sstep(wt.r + 110, wt.r + 10, d);
      hgt = mix(hgt, waterLevel + 0.35, flat);
      hgt -= (1 - sstep(wt.r * 0.45, wt.r + 22, d)) * 1.7;
    }
    for (const f of zone.features || []) {
      if (f.t === "plateau") { const d = Math.hypot(px - f.x, py - f.y) + (NOISE.value(px * 0.02, py * 0.02, 0, 411) - 0.5) * f.r * 0.25; hgt += sstep(f.r, f.r * 0.62, d) * f.h * (1 - pw * 0.8); }
      else if (f.t === "ravine") { let d = 1e9; for (let i = 0; i < f.pts.length - 1; i++) d = Math.min(d, distToSeg(px, py, f.pts[i][0], f.pts[i][1], f.pts[i + 1][0], f.pts[i + 1][1])); hgt -= sstep(f.w, f.w * 0.25, d) * f.d * (1 - pw); }
    }
    const e = edgeE(px, py);
    if (walls.length && amps[2] > 0) {
      const we = wallE(px, py);
      if (we > -10) hgt += sstep(-10, 120, we) * amps[2] * (0.75 + NOISE.ridge(px * 0.01, py * 0.01, 3, 0, 309) * 0.5) * (theme === "field" ? 0.9 : 1.1);
    }
    if (amps[2] > 0 && !zone.island) {
      let t = sstep(-60, 260, e);
      t *= 1 - exitMask(px, py) * 0.97;
      const rough = NOISE.ridge(px * 0.006, py * 0.006, 4, 0, 307);
      hgt += t * (amps[2] * (0.7 + rough * 0.6)) + sstep(150, 600, e) * amps[2] * 0.8 * (1 - exitMask(px, py));
    }
    return hgt;
  };
  const data = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) { for (let i = 0; i < cols; i++) data[j * cols + i] = raw(x0 + i * cs, y0 + j * cs); if ((j & 7) === 7) yield j / rows; }
  const heightAt = (px, py) => {
    const fx = clamp((px - x0) / cs, 0, cols - 1.001), fy = clamp((py - y0) / cs, 0, rows - 1.001);
    const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
    const a = data[j * cols + i], b = data[j * cols + i + 1], c = data[(j + 1) * cols + i], d = data[(j + 1) * cols + i + 1];
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty;
  };
  return {
    zone, x0, y0, w, h, cs, cols, rows, data, heightAt, waterLevel,
    pathWeight: pathW, plazaWeight: plazaW, cobbleHeight, rutWeight: rutW,
    shoreWeight: (px, py) => { let s = 0; for (const wt of waters) { const d = Math.hypot(px - wt.x, py - wt.y); s = Math.max(s, sstep(wt.r + 45, wt.r + 4, d)); } return s; },
    outside: (px, py) => sstep(0, 120, outsideE(px, py)) * (1 - exitMask(px, py)),
    outsideE, exitMask
  };
}

function std(params) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, params)); }

function buildTerrain(field) { return runSteps(buildTerrainSteps(field)); }

function terrainSize() { return W3.quality === "high" ? 2048 : W3.quality === "medium" ? 1536 : 1024; }
function terrainKey() { return "t|" + S.zoneId + "|" + terrainSize(); }

function* buildTerrainSteps(field) {
  const geo = new THREE.PlaneGeometry(field.w * U, field.h * U, field.cols - 1, field.rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let j = 0; j < field.rows; j++) for (let i = 0; i < field.cols; i++) {
    const k = j * field.cols + i;
    pos.setX(k, (field.x0 + i * field.cs) * U);
    pos.setZ(k, (field.y0 + j * field.cs) * U);
    pos.setY(k, field.data[k]);
  }
  geo.computeVertexNormals();
  const size = terrainSize();
  const map = yield* bakeTerrainAlbedoSteps(field, size);
  const detail = texDetailNormal();
  const nm = detail.clone();
  nm.needsUpdate = true;
  nm.repeat.set(field.w * U / 3, field.h * U / 3);
  const mat = std({ map, normalMap: nm, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95 });
  if (W3.quality !== "low" || CONFIG.terrainDetailLow) terrainDetail(mat, field);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
}

function terrainDetail(mat, field) {
  const theme = themeOf(field.zone);
  const tG = texGrassDetail(), tD = texDirtDetail(), tR = texRockDetail();
  const snow = field.zone.theme === "field" && /frost/.test(S.zoneId || "") ? 1 : 0;
  mat.onBeforeCompile = sh => {
    sh.uniforms.tGrass = { value: tG }; sh.uniforms.tDirt = { value: tD }; sh.uniforms.tRockD = { value: tR };
    sh.uniforms.uCave = { value: theme === "cave" || theme === "crypt" ? 1 : 0 };
    sh.uniforms.uSnow = { value: snow };
    sh.vertexShader = "varying vec3 vWP;\nvarying vec3 vWN;\n" + sh.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWN = normalize(mat3(modelMatrix) * objectNormal);");
    sh.fragmentShader = "uniform sampler2D tGrass;\nuniform sampler2D tDirt;\nuniform sampler2D tRockD;\nuniform float uCave;\nuniform float uSnow;\nvarying vec3 vWP;\nvarying vec3 vWN;\n" + sh.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>
{
  vec3 n = normalize(vWN);
  float slope = 1.0 - clamp(n.y, 0.0, 1.0);
  float rockW = max(smoothstep(0.22, 0.45, slope), uCave * 0.6);
  vec2 uv = vWP.xz;
  float g = texture2D(tGrass, uv * 0.42).r;
  float d = texture2D(tDirt, uv * 0.3).r;
  vec3 c = diffuseColor.rgb;
  float green = clamp((c.g - max(c.r, c.b)) * 10.0 + 0.4, 0.0, 1.0) * (1.0 - uSnow * 0.6);
  float det = mix(d, g, green);
  vec3 an = abs(n); an /= (an.x + an.y + an.z);
  float r = texture2D(tRockD, vWP.zy * 0.16).r * an.x + texture2D(tRockD, vWP.xz * 0.16).r * an.y + texture2D(tRockD, vWP.xy * 0.16).r * an.z;
  det = mix(det, r, rockW);
  float far = smoothstep(30.0, 90.0, distance(vWP, cameraPosition));
  float k = mix(1.0, 0.35, far);
  diffuseColor.rgb *= 1.0 + (det - 0.5) * 1.1 * k;
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(1.02, 0.98, 0.92), rockW * 0.45 * (1.0 - uCave * 0.5));
  float sw = texture2D(tRockD, vWP.xz * 0.035).r;
  float yb = vWP.y * 0.62 + sw * 1.1 + sin(vWP.x * 0.045 + vWP.z * 0.03) * 0.35;
  float band = fract(yb);
  float layer = fract(sin(floor(yb) * 12.9898) * 43758.5453);
  float lip = mix(0.78, 1.0, smoothstep(0.0, 0.18, band)) * mix(1.0, 1.07, smoothstep(0.88, 1.0, band));
  vec3 sc = mix(vec3(1.1, 1.02, 0.9), vec3(0.88, 0.92, 1.0), layer) * (0.9 + 0.2 * fract(layer * 7.13));
  diffuseColor.rgb *= mix(vec3(1.0), sc * lip, smoothstep(0.35, 0.65, slope) * (1.0 - uCave * 0.4));
}`);
  };
  mat.customProgramCacheKey = () => "terrainDetail";
}

function cliffChunkGeo(seed) {
  const rnd = seeded(seed), parts = [];
  const layers = 3 + Math.floor(rnd() * 3), CS = W3.quality === "low" ? 2 : W3.quality === "medium" ? 3 : 4;
  let y = 0;
  for (let i = 0; i < layers; i++) {
    const h = 0.18 + rnd() * 0.22, w = 1.1 - i * 0.08 + (rnd() - 0.5) * 0.25, d = 0.9 - i * 0.05 + (rnd() - 0.5) * 0.25;
    const g = new THREE.IcosahedronGeometry(1, CS > 2 ? 2 : 1);
    g.scale(w, h * 0.75, d);
    g.translate((rnd() - 0.5) * 0.25, y + h / 2, (rnd() - 0.5) * 0.25);
    g.rotateY((rnd() - 0.5) * 0.3);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), shade = 0.78 + rnd() * 0.3, warm = (rnd() - 0.5) * 0.08;
    for (let k = 0; k < p.count; k++) {
      const vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
      const n = NOISE.value(vx * 2.3 + seed, vy * 2.3 + i, vz * 2.3, 517) - 0.5;
      p.setXYZ(k, vx * (1 + n * 0.45), vy + n * 0.09, vz * (1 + n * 0.45));
      const lip = vy > y + h * 0.8 ? 1.12 : vy < y + h * 0.2 ? 0.82 : 1;
      col[k * 3] = shade * lip * (1 + warm); col[k * 3 + 1] = shade * lip; col[k * 3 + 2] = shade * lip * (1 - warm);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    parts.push(g);
    y += h * 0.92;
  }
  const geo = THREE.mergeGeometries(parts);
  geo.translate(0, -y * 0.35, 0);
  geo.computeVertexNormals();
  return geo;
}

function buildCliffs(field, root) {
  const z = field.zone, th = themeOf(z);
  if (th === "house" || z.indoor) return;
  const rnd = rngFor(z, "cliffs"), lists = [[], [], []];
  const cap = { low: 180, medium: 320, high: 520 }[W3.quality] || 320;
  const step = th === "cave" || th === "crypt" ? 30 : 36;
  const n = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), q = new THREE.Quaternion(), qy = new THREE.Quaternion();
  let count = 0;
  for (let py = field.y0 + step / 2; py < field.y0 + field.h && count < cap * 3; py += step) {
    for (let px = field.x0 + step / 2; px < field.x0 + field.w && count < cap * 3; px += step) {
      const jx = px + (rnd() - 0.5) * step * 0.9, jy = py + (rnd() - 0.5) * step * 0.9;
      const h0 = footY(field, jx, jy, 1.4), hx = field.heightAt(jx + 6, jy) - field.heightAt(jx - 6, jy), hy = field.heightAt(jx, jy + 6) - field.heightAt(jx, jy - 6);
      const grad = Math.hypot(hx, hy) / (12 * U);
      const out = field.outside(jx, jy);
      if (grad < 0.55 && out < 0.35) continue;
      if (field.pathWeight(jx, jy) > 0.05 || field.exitMask(jx, jy) > 0.2) continue;
      if (out < 0.35 && !placeable(field, jx, jy, { path: 0.05, water: 20, npc: 50, exit: 120 })) continue;
      if (rnd() > (out > 0.35 ? 0.55 : 0.8)) continue;
      n.set(-hx / (12 * U), 1, -hy / (12 * U)).normalize();
      q.setFromUnitVectors(up, n.clone().lerp(up, 0.45).normalize());
      qy.setFromAxisAngle(up, rnd() * 6.28);
      q.multiply(qy);
      const s = (0.9 + rnd() * 1.4) * (out > 0.35 ? 1.6 : 1) * (th === "cave" ? 0.8 : 1);
      const m = new THREE.Matrix4().compose(new THREE.Vector3(jx * U, h0 - 0.2 * s, jy * U), q, new THREE.Vector3(s * (0.8 + rnd() * 0.5), s * (0.9 + rnd() * 0.9), s * (0.8 + rnd() * 0.5)));
      lists[count % 3].push(m);
      count++;
    }
  }
  if (!count) return;
  const tex = th === "cave" || th === "crypt" ? texCaveRock() : texRock();
  const pal = (TERRAIN_THEMES[z.palette || z.theme] || TERRAIN_THEMES.field).cliff;
  const base = new THREE.Color(pal[0] / 255, pal[1] / 255, pal[2] / 255).multiplyScalar(1.9);
  const mat = std({ map: tex.map, normalMap: tex.normalMap, normalScale: new THREE.Vector2(1.3, 1.3), vertexColors: true, color: base, roughness: 0.93 });
  lists.forEach((L, i) => { if (L.length) { const im = instanced(cliffChunkGeo(hashStr(z.name) % 997 + i * 31), mat, L, true); tintInst(im, rnd, 0.22); im.name = "cliffs"; root.add(im); } });
}

function buildPathEdges(field, root) {
  const z = field.zone, th = themeOf(z);
  if (th !== "field" || !(z.paths || []).length) return;
  const rnd = rngFor(z, "edges"), list = [];
  for (const p of z.paths) for (let i = 0; i < p.pts.length - 1; i++) {
    const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1], L = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / L, dy = (by - ay) / L;
    for (let t = 0; t < L; t += 22 + rnd() * 30) {
      if (rnd() < 0.35) continue;
      const side = rnd() < 0.5 ? -1 : 1, off = p.w * (0.42 + rnd() * 0.12);
      const px = ax + dx * t - dy * off * side, py = ay + dy * t + dx * off * side;
      if (!placeable(field, px, py, { path: 1.1, water: 10, npc: 30, exit: 60 })) continue;
      const s = 0.12 + rnd() * 0.16;
      list.push(mtx(px * U, field.heightAt(px, py) - s * 0.3, py * U, s * (1.2 + rnd() * 0.6), s * (0.6 + rnd() * 0.4), s * (1 + rnd() * 0.5), rnd() * 6.28, (rnd() - 0.5) * 0.3));
    }
  }
  if (!list.length) return;
  const tex = texRock();
  const mat = std({ map: tex.map, normalMap: tex.normalMap, color: 0xc8c0b0 });
  const im = instanced(noisyGeo(new THREE.IcosahedronGeometry(1, 1), 0.25, 9), mat, list, false);
  tintInst(im, rnd, 0.25);
  root.add(im);
}

function fernGeo() {
  const parts = [];
  for (let k = 0; k < 7; k++) {
    const g = new THREE.PlaneGeometry(0.22, 0.95, 1, 4).toNonIndexed();
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.475, t = y / 0.95; p.setXYZ(i, p.getX(i) * (1 - t * 0.85) * (0.6 + Math.sin(t * Math.PI) * 0.8), y * 0.75, -t * t * 0.45); }
    g.rotateX(-0.35); g.rotateY(k / 7 * Math.PI * 2 + (k % 2) * 0.2);
    parts.push(g);
  }
  const geo = THREE.mergeGeometries(parts);
  const n = geo.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return geo;
}
function reedGeo() {
  const parts = [];
  for (let k = 0; k < 9; k++) {
    const a = k * 2.4, r = 0.05 + (k % 3) * 0.06, h = 0.8 + (k % 4) * 0.25;
    parts.push(new THREE.CylinderGeometry(0.008, 0.016, h, 3).translate(Math.cos(a) * r, h / 2, Math.sin(a) * r).rotateZ((k % 3 - 1) * 0.08).toNonIndexed());
    if (k % 3 === 0) parts.push(new THREE.CylinderGeometry(0.028, 0.028, 0.16, 5).translate(Math.cos(a) * r, h - 0.08, Math.sin(a) * r).toNonIndexed());
  }
  return THREE.mergeGeometries(parts);
}
function shroomClusterGeo() {
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const a = k * 1.9, r = k ? 0.12 + k * 0.03 : 0, h = 0.12 + (3 - k) * 0.04, cr = 0.05 + (3 - k) * 0.025;
    parts.push(new THREE.CylinderGeometry(cr * 0.3, cr * 0.4, h, 6).translate(Math.cos(a) * r, h / 2, Math.sin(a) * r).toNonIndexed());
    parts.push(new THREE.SphereGeometry(cr, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1).translate(Math.cos(a) * r, h, Math.sin(a) * r).toNonIndexed());
  }
  return THREE.mergeGeometries(parts);
}
function fenceGeo() {
  const parts = [new THREE.BoxGeometry(0.12, 1.1, 0.12).translate(-1.2, 0.55, 0), new THREE.BoxGeometry(0.12, 1.1, 0.12).translate(1.2, 0.55, 0), new THREE.BoxGeometry(2.5, 0.1, 0.06).translate(0, 0.8, 0), new THREE.BoxGeometry(2.5, 0.1, 0.06).translate(0, 0.42, 0).rotateZ(0.03)];
  return THREE.mergeGeometries(parts.map(g => g.toNonIndexed()));
}
function cartGeo() {
  const parts = [new THREE.BoxGeometry(1.6, 0.12, 1.0).translate(0, 0.62, 0), new THREE.BoxGeometry(1.6, 0.4, 0.06).translate(0, 0.86, 0.5), new THREE.BoxGeometry(1.6, 0.4, 0.06).translate(0, 0.86, -0.5), new THREE.BoxGeometry(0.06, 0.4, 1.0).translate(-0.8, 0.86, 0), new THREE.BoxGeometry(1.6, 0.06, 0.06).translate(1.5, 0.6, 0.3), new THREE.BoxGeometry(1.6, 0.06, 0.06).translate(1.5, 0.6, -0.3)];
  for (const z of [0.58, -0.58]) { parts.push(new THREE.TorusGeometry(0.42, 0.05, 5, 14).translate(0.1, 0.45, z)); for (let k = 0; k < 4; k++) parts.push(new THREE.BoxGeometry(0.04, 0.8, 0.03).rotateZ(k * Math.PI / 4).translate(0.1, 0.45, z)); }
  return THREE.mergeGeometries(parts.map(g => g.toNonIndexed()));
}
function stumpGeo() {
  return THREE.mergeGeometries([new THREE.CylinderGeometry(0.3, 0.42, 0.55, 9).translate(0, 0.27, 0).toNonIndexed(), new THREE.CylinderGeometry(0.06, 0.1, 0.5, 5).rotateZ(1.2).translate(0.35, 0.12, 0).toNonIndexed(), new THREE.CylinderGeometry(0.05, 0.09, 0.45, 5).rotateZ(-1.3).rotateY(2).translate(-0.2, 0.1, 0.25).toNonIndexed()]);
}
function skullGeo() {
  return THREE.mergeGeometries([new THREE.SphereGeometry(0.28, 9, 7).scale(1.1, 0.8, 1.3).translate(0, 0.18, 0).toNonIndexed(), new THREE.CylinderGeometry(0.035, 0.05, 0.9, 5).rotateZ(Math.PI / 2).translate(0.6, 0.06, 0.2).toNonIndexed(), new THREE.CylinderGeometry(0.03, 0.045, 0.7, 5).rotateZ(Math.PI / 2).rotateY(0.8).translate(-0.3, 0.05, 0.6).toNonIndexed()]);
}

function buildProps(field, root) {
  const z = field.zone, th = themeOf(z), q = W3.quality;
  if (th !== "field" && th !== "town") return;
  const rnd = rngFor(z, "props"), pal = z.palette || "field";
  const desert = pal === "desert", snowy = pal === "snow", volcanic = pal === "volcanic", jungle = pal === "jungle", marsh = !!z.mist || pal === "marsh";
  const K = { low: 0.4, medium: 1, high: 1.6 }[q] || 1;
  const ferns = [], reeds = [], shrooms = [], fences = [], carts = [], stumps = [], skulls = [];
  const scatter = (n, test, push) => { for (let k = 0, tr = 0; k < n && tr < n * 25; tr++) { const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h; if (test(px, py)) { push(px, py); k++; } } };
  const inPlay = (px, py, e0, e1) => { const e = field.outsideE(px, py); return e > e0 && e < e1 && field.exitMask(px, py) < 0.2; };
  if (!desert && !volcanic && !snowy && th === "field") scatter(Math.round((jungle ? 420 : 220) * K), (px, py) => inPlay(px, py, -260, 120) && placeable(field, px, py, { water: 20, npc: 50, path: 0.05 }) && NOISE.value(px * 0.004, py * 0.004, 0, 611) > 0.45, (px, py) => { const s = (0.7 + rnd() * 0.8) * (jungle ? 1.7 : 1); ferns.push(mtx(px * U, field.heightAt(px, py) - 0.03, py * U, s, s, s, rnd() * 6.28)); });
  for (const wt of z.water || []) { const n = Math.round(Math.min(160, wt.r * 0.9) * K * (marsh ? 1.6 : 1)); for (let k = 0; k < n; k++) { const a = rnd() * 6.28, r = wt.r + (rnd() - 0.35) * 26, px = wt.x + Math.cos(a) * r, py = wt.y + Math.sin(a) * r; if (field.pathWeight(px, py) > 0.1) continue; const s = 0.8 + rnd() * 0.7; reeds.push(mtx(px * U, field.heightAt(px, py) - 0.05, py * U, s, s * (0.8 + rnd() * 0.5), s, rnd() * 6.28)); } }
  if (marsh && th === "field") scatter(Math.round(200 * K), (px, py) => inPlay(px, py, -300, 60) && field.shoreWeight(px, py) < 0.2 && placeable(field, px, py, { water: 5, npc: 40, path: 0.1 }) && NOISE.value(px * 0.006, py * 0.006, 0, 613) > 0.55, (px, py) => { const s = 0.7 + rnd() * 0.6; reeds.push(mtx(px * U, field.heightAt(px, py) - 0.05, py * U, s, s, s, rnd() * 6.28)); });
  if (!desert && !volcanic && th === "field") scatter(Math.round(70 * K), (px, py) => inPlay(px, py, -280, 80) && placeable(field, px, py, { water: 20, npc: 40, path: 0.05 }), (px, py) => { const s = 0.8 + rnd() * 1.0; shrooms.push(mtx(px * U, field.heightAt(px, py) - 0.02, py * U, s, s, s, rnd() * 6.28)); });
  if (th === "field") scatter(Math.round((desert || volcanic || snowy ? 30 : 14) * K), (px, py) => inPlay(px, py, -260, 100) && placeable(field, px, py, { water: 30, npc: 60, path: 0.05 }), (px, py) => { const s = 0.8 + rnd() * 0.8; stumps.push(mtx(px * U, field.heightAt(px, py) - 0.05, py * U, s, s * (0.7 + rnd() * 0.6), s, rnd() * 6.28)); });
  if (desert) scatter(Math.round(18 * K), (px, py) => inPlay(px, py, -300, 60) && placeable(field, px, py, { water: 30, npc: 60, path: 0.05 }), (px, py) => { const s = 0.8 + rnd() * 1.6; skulls.push(mtx(px * U, field.heightAt(px, py) - 0.08 * s, py * U, s, s, s, rnd() * 6.28, (rnd() - 0.5) * 0.4)); });
  if (th === "field" && (z.paths || []).length) {
    const P = z.paths[Math.floor(rnd() * z.paths.length)];
    for (let tries = 0, made = 0; tries < 30 && made < 2; tries++) {
      const i = Math.floor(rnd() * (P.pts.length - 1)), t = rnd(), [ax, ay] = P.pts[i], [bx, by] = P.pts[i + 1];
      const L = Math.hypot(bx - ax, by - ay); if (L < 1) continue;
      const nx = -(by - ay) / L, ny = (bx - ax) / L, off = P.w * (0.7 + rnd() * 0.3) * (rnd() < 0.5 ? -1 : 1);
      const px = ax + (bx - ax) * t + nx * off, py = ay + (by - ay) * t + ny * off;
      if (!placeable(field, px, py, { water: 40, npc: 80, path: 0.3, exit: 420 }) || field.exitMask(px, py) > 0.02 || field.outsideE(px, py) > -80) continue;
      const broken = rnd() < 0.5;
      carts.push(mtx(px * U, field.heightAt(px, py) - (broken ? 0.18 : 0), py * U, 1, 1, 1, Math.atan2(by - ay, bx - ax) + (rnd() - 0.5) * 0.6, broken ? 0.18 : 0, broken ? 0.12 : 0));
      z.colliders && z.colliders.push({ x: px, y: py, r: 24 });
      made++;
    }
  }
  if (th === "field" && !desert && !volcanic && z.start) {
    const runs = 2 + Math.floor(rnd() * 2);
    for (let r = 0; r < runs; r++) {
      let px = z.start.x + (rnd() - 0.5) * 500, py = z.start.y + (rnd() - 0.5) * 500, a = rnd() * 6.28;
      for (let k = 0; k < 5 + Math.floor(rnd() * 5); k++) {
        const nx = px + Math.cos(a) * 49, ny = py + Math.sin(a) * 49, mx = (px + nx) / 2, my = (py + ny) / 2;
        if (!placeable(field, mx, my, { water: 30, npc: 60, path: 0.05, exit: 160 }) || field.outsideE(mx, my) > -40) break;
        const y0 = field.heightAt(px, py), y1 = field.heightAt(nx, ny);
        fences.push(mtx(mx * U, (y0 + y1) / 2 - 0.05, my * U, 1, 1, 1, -a, 0, Math.atan2(y1 - y0, 49 * U) * 0.9 * (k % 2 ? 1 : 1)));
        px = nx; py = ny; a += (rnd() - 0.5) * 0.5;
        if (rnd() < 0.15) k++;
      }
    }
  }
  const leaf = texFoliage("leaf", [74, 110, 48]), bark = texBark();
  const plantMat = (c, w) => { const m = std({ map: leaf.map, color: c, side: THREE.DoubleSide, roughness: 0.9 }); addWind(m, w); return m; };
  const woodMat = std({ map: bark.map, normalMap: bark.normalMap, color: 0xc8a888 });
  if (ferns.length) root.add(tintInst(instanced(fernGeo(), plantMat(jungle ? 0x7ab060 : 0x8ab870, 0.06), ferns, false), rnd, 0.25));
  if (reeds.length) root.add(tintInst(instanced(reedGeo(), plantMat(marsh ? 0xb0a868 : 0x9ab070, 0.09), reeds, false), rnd, 0.2));
  if (shrooms.length) { const im = instanced(shroomClusterGeo(), std({ color: 0xffffff, roughness: 0.7 }), shrooms, false); const pc = [0xc84a3a, 0xe8d8b8, 0xb88a5a, 0xd8a040]; shrooms.forEach((m, i) => im.setColorAt(i, new THREE.Color(pc[Math.floor(rnd() * pc.length)]))); im.instanceColor.needsUpdate = true; root.add(im); }
  if (stumps.length) root.add(tintInst(instanced(stumpGeo(), std({ map: bark.map, normalMap: bark.normalMap, color: volcanic ? 0x3a3030 : snowy ? 0xd8dce0 : desert ? 0xd8c0a0 : 0xffffff }), stumps, true), rnd, 0.2));
  if (skulls.length) root.add(tintInst(instanced(skullGeo(), std({ color: 0xf0e6d0, roughness: 0.8 }), skulls, true), rnd, 0.1));
  if (fences.length) root.add(tintInst(instanced(fenceGeo(), woodMat, fences, true), rnd, 0.18));
  if (carts.length) root.add(instanced(cartGeo(), woodMat, carts, true));
}

function wallEdges(z) {
  const out = [], walls = z.walls || [];
  const inWall = (x, y) => x < 0 || y < 0 || x > z.w || y > z.h || walls.some(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
  for (const r of walls) {
    const edges = [[r.x, r.y + r.h, r.x + r.w, r.y + r.h, 0, 1], [r.x, r.y, r.x + r.w, r.y, 0, -1], [r.x, r.y, r.x, r.y + r.h, -1, 0], [r.x + r.w, r.y, r.x + r.w, r.y + r.h, 1, 0]];
    for (const [ax, ay, bx, by, nx, ny] of edges) {
      const L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 40));
      let run = null;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
        const open = i < n && !inWall(x + (bx - ax) / n * 0.5 + nx * 8, y + (by - ay) / n * 0.5 + ny * 8);
        if (open && !run) run = [x, y];
        if ((!open || i === n) && run) { if (Math.hypot(x - run[0], y - run[1]) > 20) out.push({ ax: run[0], ay: run[1], bx: x, by: y, nx, ny }); run = null; }
      }
    }
  }
  return out;
}

function buildDungeon(field, root) {
  const z = field.zone, th = themeOf(z);
  if (th !== "crypt" && th !== "cave") return;
  const rnd = rngFor(z, "dungeon"), crypt = th === "crypt";
  const edges = wallEdges(z);
  const walls = [], pils = [], sconces = [], webs = [];
  const H = crypt ? 6.2 : 0;
  for (const e of edges) {
    const L = Math.hypot(e.bx - e.ax, e.by - e.ay), ang = Math.atan2(e.by - e.ay, e.bx - e.ax);
    const mx = (e.ax + e.bx) / 2 - e.nx * 6, my = (e.ay + e.by) / 2 - e.ny * 6, gy = field.heightAt(mx + e.nx * 14, my + e.ny * 14);
    if (crypt) {
      walls.push(mtx(mx * U, gy - 0.4 + H / 2, my * U, L * U + 0.6, H, 0.7, -ang));
      for (let d = 0; d <= L; d += 110) {
        const px = e.ax + Math.cos(ang) * d + e.nx * 2, py = e.ay + Math.sin(ang) * d + e.ny * 2;
        pils.push(mtx(px * U, gy - 0.4 + (H + 0.4) / 2, py * U, 1, H + 0.4, 1, -ang));
        if (d > 0 && d < L - 40 && Math.round(d / 110) % 2 === 1) sconces.push({ x: px + e.nx * 10, y: py + e.ny * 10, gy, ang: Math.atan2(e.nx, e.ny) });
      }
      if (rnd() < 0.5) webs.push(mtx((e.ax + e.nx * 8) * U, gy + H - 1.0, (e.ay + e.ny * 8) * U, 1.4, 1.4, 1, -ang + Math.PI / 4));
    } else if (rnd() < 0.55) {
      for (let d = 30; d < L - 30; d += 160 + rnd() * 120) {
        const px = e.ax + Math.cos(ang) * d + e.nx * 14, py = e.ay + Math.sin(ang) * d + e.ny * 14;
        if (!placeable(field, px, py, { path: 2, water: 30, npc: 50, exit: 120 })) continue;
        pils.push(mtx(px * U, field.heightAt(px, py), py * U, 1, 1, 1, -ang));
      }
    }
  }
  const stone = texBricks(), bark = texBark();
  if (crypt) {
    const boxUV = (w, h, d, k) => { const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv, nr = g.attributes.normal; for (let i = 0; i < uv.count; i++) { const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)); const su = ax > 0.5 ? d : w, sv = ay > 0.5 ? d : h; uv.setXY(i, uv.getX(i) * su / k, uv.getY(i) * sv / k); } return g; };
    if (walls.length) {
      const parts = walls.map(m => { const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); m.decompose(p, q, sc); const g = boxUV(sc.x, sc.y, sc.z, 2.2); g.applyQuaternion(q); g.translate(p.x, p.y, p.z); const c = new Float32Array(g.attributes.position.count * 3), v = 0.85 + rnd() * 0.25; c.fill(v); g.setAttribute("color", new THREE.BufferAttribute(c, 3)); return g; });
      const wmesh = new THREE.Mesh(THREE.mergeGeometries(parts), std({ map: stone.map, normalMap: stone.normalMap, color: 0x9a9cb0, roughness: 0.95, vertexColors: true }));
      wmesh.castShadow = wmesh.receiveShadow = true; root.add(wmesh);
    }
    const pg = THREE.mergeGeometries([boxUV(1, 1, 1, 0.45), boxUV(1.25, 0.08, 1.25, 1).translate(0, 0.46, 0), boxUV(1.25, 0.08, 1.25, 1).translate(0, -0.46, 0)]);
    const puv = pg.attributes.uv; for (let i = 0; i < puv.count; i++) puv.setY(i, puv.getY(i) * 3);
    if (pils.length) root.add(tintInst(instanced(pg, std({ map: stone.map, normalMap: stone.normalMap, color: 0x82808e }), pils, true), rnd, 0.1));
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb050 }), ironMat = std({ color: 0x3a3a40, metalness: 0.6, roughness: 0.5 });
    let lights = 0;
    for (const s of sconces) {
      const g = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), ironMat); arm.position.set(0, 2.6, -0.1);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.2, 8), ironMat); cup.position.set(0, 2.7, 0.15);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.38, 8), flameMat); fl.position.set(0, 2.98, 0.15);
      g.add(arm, cup, fl);
      if (lights < (W3.quality === "low" ? 4 : W3.quality === "high" ? 12 : 8) && rnd() < 0.7) { const L = new THREE.PointLight(0xff9a40, 12, 22, 1.5); L.position.set(0, 3.0, 0.3); L.userData.phase = rnd() * 6; g.add(L); W3.torchLights.push(L); lights++; }
      g.position.set(s.x * U, s.gy, s.y * U); g.rotation.y = s.ang;
      root.add(g);
    }
    if (webs.length) { const wbm = new THREE.MeshBasicMaterial({ map: webTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 0.55 }); root.add(instanced(new THREE.PlaneGeometry(1, 1), wbm, webs, false)); }
    const sarc = [], bones = [], urns = [];
    for (const lm of z.landmarks || []) {
      const n = lm.id === "vault" || lm.id === "throne" || lm.id === "sentinel" ? 3 : 1;
      for (let k = 0, tr = 0; k < n && tr < 40; tr++) { const a = rnd() * 6.28, r = lm.r * (0.45 + rnd() * 0.4), px = lm.x + Math.cos(a) * r, py = lm.y + Math.sin(a) * r; if (!placeable(field, px, py, { npc: 90, exit: 150, path: 2 }) || field.outsideE(px, py) > -30) continue; sarc.push(mtx(px * U, field.heightAt(px, py), py * U, 1, 1, 1, Math.round(rnd() * 4) * Math.PI / 2)); z.colliders && z.colliders.push({ x: px, y: py, r: 26 }); k++; }
    }
    for (let k = 0, tr = 0; k < 40 && tr < 400; tr++) { const px = rnd() * z.w, py = rnd() * z.h, e = field.outsideE(px, py); if (e < -60 || e > -12 || !placeable(field, px, py, { npc: 50, exit: 100, path: 2 })) continue; (rnd() < 0.55 ? bones : urns).push(mtx(px * U, field.heightAt(px, py), py * U, 0.8 + rnd() * 0.5, 0.8 + rnd() * 0.5, 0.8 + rnd() * 0.5, rnd() * 6.28)); k++; }
    const sg = THREE.mergeGeometries([new THREE.BoxGeometry(1.2, 0.8, 2.6).translate(0, 0.4, 0).toNonIndexed(), new THREE.BoxGeometry(1.35, 0.18, 2.75).translate(0, 0.89, 0).toNonIndexed(), new THREE.BoxGeometry(0.5, 0.12, 0.5).translate(0, 1.04, -0.9).toNonIndexed(), new THREE.BoxGeometry(0.2, 0.08, 1.4).translate(0, 1.02, 0.15).toNonIndexed()]);
    if (sarc.length) root.add(instanced(sg, std({ map: stone.map, normalMap: stone.normalMap, color: 0xa09cb0 }), sarc, true));
    if (bones.length) root.add(tintInst(instanced(skullGeo().scale(0.5, 0.5, 0.5), std({ color: 0xe8e0c8, roughness: 0.8 }), bones, false), rnd, 0.15));
    const ug = THREE.mergeGeometries([new THREE.SphereGeometry(0.25, 10, 8).scale(1, 1.2, 1).translate(0, 0.3, 0).toNonIndexed(), new THREE.CylinderGeometry(0.12, 0.16, 0.14, 10).translate(0, 0.6, 0).toNonIndexed()]);
    if (urns.length) root.add(tintInst(instanced(ug, std({ color: 0x8a6a4a, roughness: 0.7 }), urns, true), rnd, 0.25));
  } else {
    const wood = std({ map: bark.map, normalMap: bark.normalMap, color: 0xb08a68 });
    const frame = THREE.mergeGeometries([new THREE.BoxGeometry(0.25, 3.4, 0.25).translate(-1.3, 1.7, 0).toNonIndexed(), new THREE.BoxGeometry(0.25, 3.4, 0.25).translate(1.3, 1.7, 0).toNonIndexed(), new THREE.BoxGeometry(3.0, 0.28, 0.32).translate(0, 3.45, 0).toNonIndexed(), new THREE.BoxGeometry(0.12, 1.2, 0.12).rotateZ(0.8).translate(-0.9, 2.9, 0).toNonIndexed(), new THREE.BoxGeometry(0.12, 1.2, 0.12).rotateZ(-0.8).translate(0.9, 2.9, 0).toNonIndexed()]);
    if (pils.length) root.add(tintInst(instanced(frame, wood, pils, true), rnd, 0.18));
    const crates = [], barrels = [];
    for (const [tx, ty] of z.torches || []) {
      if (rnd() < 0.45) continue;
      for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) { const a = rnd() * 6.28, r = 26 + rnd() * 30, px = tx + Math.cos(a) * r, py = ty + Math.sin(a) * r; if (!placeable(field, px, py, { npc: 40, exit: 100, path: 0.6 })) continue; (rnd() < 0.5 ? crates : barrels).push(mtx(px * U, field.heightAt(px, py), py * U, 0.8 + rnd() * 0.4, 0.8 + rnd() * 0.4, 0.8 + rnd() * 0.4, rnd() * 6.28)); }
    }
    if (crates.length) root.add(tintInst(instanced(new THREE.BoxGeometry(0.9, 0.9, 0.9).translate(0, 0.45, 0), wood, crates, true), rnd, 0.2));
    if (barrels.length) root.add(tintInst(instanced(THREE.mergeGeometries([new THREE.CylinderGeometry(0.42, 0.42, 1.0, 12).translate(0, 0.5, 0).toNonIndexed(), new THREE.TorusGeometry(0.43, 0.03, 4, 14).rotateX(Math.PI / 2).translate(0, 0.2, 0).toNonIndexed(), new THREE.TorusGeometry(0.43, 0.03, 4, 14).rotateX(Math.PI / 2).translate(0, 0.8, 0).toNonIndexed()]), wood, barrels, true), rnd, 0.2));
  }
}

let WEB_TEX = null;
function webTex() {
  if (WEB_TEX) return WEB_TEX;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.strokeStyle = "rgba(235,235,245,.9)"; g.lineWidth = 1;
  for (let k = 0; k < 7; k++) { const a = k / 6 * Math.PI / 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); g.stroke(); }
  for (let r = 14; r < 128; r += 14) { g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2, rr = r * (0.92 + (k % 2) * 0.1); k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke(); }
  WEB_TEX = new THREE.CanvasTexture(c);
  return WEB_TEX;
}

function tintInst(im, rnd, amt) {
  const c = new THREE.Color();
  for (let i = 0; i < im.count; i++) { const v = 1 - amt / 2 + rnd() * amt; c.setRGB(v * (0.95 + rnd() * 0.1), v, v * (0.9 + rnd() * 0.1)); im.setColorAt(i, c); }
  if (im.instanceColor) im.instanceColor.needsUpdate = true;
  return im;
}

function rngFor(z, salt) { return seeded(hashStr(z.name + salt)); }

function placeable(field, px, py, opts) {
  const z = field.zone;
  if (field.pathWeight(px, py) > (opts.path || 0.15)) return false;
  for (const wt of z.water || []) if (Math.hypot(px - wt.x, py - wt.y) < wt.r + (opts.water || 40)) return false;
  for (const n of z.npcs || []) if (Math.hypot(px - n.x, py - n.y) < (opts.npc || 70)) return false;
  for (const r of z.houses || []) if (Math.abs(px - r.x) < r.w / 2 + 40 && Math.abs(py - r.y) < r.h / 2 + 40) return false;
  for (const ex of z.exits) if (Math.hypot(px - (ex.x + ex.w / 2), py - (ex.y + ex.h / 2)) < (opts.exit || 140)) return false;
  if (z.ruins) {
    for (const [x1, y1, x2, y2] of z.ruins.walls) if (px > Math.min(x1, x2) - 60 && px < Math.max(x1, x2) + 60 && py > Math.min(y1, y2) - 60 && py < Math.max(y1, y2) + 60) return false;
    for (const [x, y] of z.ruins.pillars) if (Math.hypot(px - x, py - y) < 60) return false;
  }
  if (z.cityWalls) for (const r of cityWallRects(z)) if (px > r.x - 40 && px < r.x + r.w + 40 && py > r.y - 40 && py < r.y + r.h + 40) return false;
  for (const g of z.gates || []) if (Math.hypot(px - g.x, py - g.y) < 120) return false;
  for (const lm of z.landmarks || []) if (lm.clear && Math.hypot(px - lm.x, py - lm.y) < lm.clear) return false;
  return true;
}

function noisyGeo(geo, amt, seed) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = NOISE.value(v.x * 3 + seed, v.y * 3, 0, 501) * 2 - 1;
    v.multiplyScalar(1 + n * amt);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function instanced(geo, mat, list, castShadow) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length));
  m.count = list.length;
  list.forEach((mx, i) => m.setMatrixAt(i, mx));
  m.instanceMatrix.needsUpdate = true;
  m.castShadow = !!castShadow;
  m.receiveShadow = true;
  return m;
}

function mtx(x, y, z, sx, sy, sz, ry, rx, rz) {
  const m = new THREE.Matrix4();
  m.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx, sy, sz));
  return m;
}

function addWind(mat, strength) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 };
    mat.userData.shader = sh;
    sh.vertexShader = "uniform float uTime;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvec4 wp0 = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);\nfloat sway = sin(uTime * 1.7 + wp0.x * 0.35 + wp0.z * 0.27) * " + strength.toFixed(3) + " * max(position.y, 0.0);\ntransformed.x += sway;\ntransformed.z += sway * 0.6;");
  };
  W3.grassMats.push(mat);
}

function buildVegetation(field, root) {
  const z = field.zone, theme = themeOf(z);
  z.colliders = [];
  if (theme === "house") return;
  const rnd = rngFor(z, "veg");
  const q = W3.quality;
  const bark = texBark();
  const pineTex = texFoliage("pine", [48, 82, 52]);
  const leafTex = texFoliage("leaf", [74, 110, 48]);
  const rockTex = theme === "cave" || theme === "crypt" ? texCaveRock() : texRock();
  const pines = [], leafy = [], leafy2 = [], rocks = [], smallRocks = [], tufts = [], stal = [], bushes = [], flowers = [], logs = [], cacti = [];
  const desert = z.palette === "desert", jungle = z.palette === "jungle", volcanic = z.palette === "volcanic";
  const want = theme === "crypt" ? { trees: 0, rocks: 60, small: 90, tufts: 0, stal: 40 } : theme === "cave" ? { trees: 0, rocks: 140, small: 220, tufts: 0, stal: 160 } : theme === "town" ? { trees: 160, rocks: 40, small: 60, tufts: 1, stal: 0 } : { trees: 420, rocks: 160, small: 260, tufts: 1, stal: 0 };
  if (z.vegK) for (const kk of ["trees", "rocks", "small"]) want[kk] = Math.round(want[kk] * z.vegK);
  if (z.palette === "highland") { want.trees = Math.round(want.trees * 0.35); want.rocks = Math.round(want.rocks * 0.8); }
  if (volcanic) { want.trees = Math.round(want.trees * 0.08); want.rocks = Math.round(want.rocks * 1.8); want.small = Math.round(want.small * 1.5); }
  const tuftCount = { low: 0, medium: 2500, high: 6000 }[q] * want.tufts * (z.vegK || 1) * (desert ? 0.25 : volcanic ? 0.06 : 1);
  for (let k = 0, tries = 0; k < want.trees && tries < want.trees * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (theme === "town" ? e < 30 : e < -170) continue;
    if (e > 560) continue;
    if (field.exitMask(px, py) > 0.2) continue;
    if (!placeable(field, px, py, { water: 50, exit: 180 })) continue;
    const y = field.heightAt(px, py), s = (0.8 + rnd() * 0.7) * (jungle ? 1.35 : 1);
    const m = mtx(px * U, y - 0.2, py * U, s, s * (0.9 + rnd() * 0.4), s, rnd() * 6.28);
    (desert ? (rnd() < 0.85 ? cacti : leafy2) : jungle ? (rnd() < 0.6 ? leafy2 : leafy) : rnd() < (theme === "town" ? 0.4 : z.palette === "snow" ? 0.85 : 0.6) ? pines : rnd() < 0.45 ? leafy2 : leafy).push(m);
    z.colliders.push({ x: px, y: py, r: 4.6 * s });
    k++;
  }
  for (let k = 0, tries = 0; k < want.rocks && tries < want.rocks * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (e < -120 || e > 600 || field.exitMask(px, py) > 0.1) continue;
    if (!placeable(field, px, py, { water: 30 })) continue;
    const s = 0.8 + rnd() * 2.6;
    const rsx = s * (0.8 + rnd() * 0.6), rsy = s * (0.5 + rnd() * 0.5), rsz = s * (0.8 + rnd() * 0.6);
    rocks.push(mtx(px * U, footY(field, px, py, Math.max(rsx, rsz) * 0.9) - s * 0.25, py * U, rsx, rsy, rsz, rnd() * 6.28, rnd() * 0.3));
    z.colliders.push({ x: px, y: py, r: Math.max(rsx, rsz) * 0.85 / U });
    k++;
  }
  for (let k = 0, tries = 0; k < want.small && tries < want.small * 20; tries++) {
    const px = 30 + rnd() * (z.w - 60), py = 30 + rnd() * (z.h - 60);
    if (!placeable(field, px, py, { water: 10, npc: 40, path: 0.5 })) continue;
    const s = 0.15 + rnd() * 0.35;
    smallRocks.push(mtx(px * U, footY(field, px, py, s * 0.8) - s * 0.2, py * U, s, s * 0.6, s, rnd() * 6.28));
    k++;
  }
  for (let k = 0, tries = 0; k < want.stal && tries < want.stal * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (e > 500) continue;
    const inside = e < 40;
    if (inside && rnd() < 0.7) continue;
    if (!placeable(field, px, py, { water: 40, npc: 60, path: 0.05, exit: 170 })) continue;
    const s = inside ? 0.35 + rnd() * 0.45 : 1 + rnd() * 2.5;
    stal.push(mtx(px * U, footY(field, px, py, s * 0.9) - 0.2, py * U, s, s * (inside ? 1 + rnd() * 1.4 : 1.5 + rnd() * 2.5), s, rnd() * 6.28));
    if (!inside) z.colliders.push({ x: px, y: py, r: s * 0.7 / U });
    k++;
  }
  const outdoors = theme === "field" || theme === "town";
  const bushN = outdoors && !volcanic ? { low: 60, medium: 160, high: 260 }[q] : 0, flowerN = outdoors && z.palette !== "snow" && !desert && !volcanic ? { low: 80, medium: 260, high: 500 }[q] : 0, logN = theme === "field" ? 18 : 0;
  for (let k = 0, tries = 0; k < bushN && tries < bushN * 20; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (e < (theme === "town" ? 10 : -260) || e > 300 || field.exitMask(px, py) > 0.2) continue;
    if (!placeable(field, px, py, { water: 25, npc: 60, path: 0.08 })) continue;
    const s = 0.5 + rnd() * 0.7;
    bushes.push(mtx(px * U, field.heightAt(px, py) - 0.1, py * U, s * (0.9 + rnd() * 0.4), s * (0.7 + rnd() * 0.4), s * (0.9 + rnd() * 0.4), rnd() * 6.28));
    k++;
  }
  for (let k = 0, tries = 0; k < flowerN && tries < flowerN * 10; tries++) {
    const cx = 40 + rnd() * (z.w - 80), cy = 40 + rnd() * (z.h - 80);
    if (field.outsideE(cx, cy) > -30 || !placeable(field, cx, cy, { water: 20, npc: 40, path: 0.06 })) continue;
    const n = 3 + Math.floor(rnd() * 5), hue = Math.floor(rnd() * 5);
    for (let i = 0; i < n && k < flowerN; i++, k++) {
      const px = cx + (rnd() - 0.5) * 40, py = cy + (rnd() - 0.5) * 40, s = 0.6 + rnd() * 0.5;
      const m = mtx(px * U, field.heightAt(px, py), py * U, s, s, s, rnd() * 6.28);
      m.hue = hue;
      flowers.push(m);
    }
  }
  for (let k = 0, tries = 0; k < logN && tries < logN * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (e < -220 || e > 60 || !placeable(field, px, py, { water: 40, npc: 80, path: 0.05, exit: 200 })) continue;
    const s = 0.8 + rnd() * 0.6;
    logs.push(mtx(px * U, field.heightAt(px, py) + 0.15 * s, py * U, s, s, s, rnd() * 6.28, 0, Math.PI / 2));
    z.colliders.push({ x: px, y: py, r: 1.4 * s / U });
    k++;
  }
  if (tuftCount) for (let k = 0, tries = 0; k < tuftCount && tries < tuftCount * 6; tries++) {
    const px = 30 + rnd() * (z.w - 60), py = 30 + rnd() * (z.h - 60);
    if (field.pathWeight(px, py) > 0.05 || field.shoreWeight(px, py) > 0.3) continue;
    if (z.plaza && Math.hypot(px - z.plaza.x, py - z.plaza.y) < z.plaza.r + 20) continue;
    let bad = false;
    for (const wt of z.water || []) if (Math.hypot(px - wt.x, py - wt.y) < wt.r + 15) bad = true;
    for (const r of z.houses || []) if (Math.abs(px - r.x) < r.w / 2 + 6 && Math.abs(py - r.y) < r.h / 2 + 6) bad = true;
    if (bad) continue;
    const s = 0.5 + rnd() * 0.6;
    tufts.push(mtx(px * U, field.heightAt(px, py) - 0.02, py * U, s, s * (0.7 + rnd() * 0.6), s, rnd() * 6.28));
    k++;
  }
  const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 2.4, 7);
  trunkGeo.translate(0, 1.2, 0);
  const pineGeo = THREE.mergeGeometries([
    new THREE.ConeGeometry(1.6, 2.6, 9).translate(0, 2.3, 0),
    new THREE.ConeGeometry(1.25, 2.2, 9).translate(0, 3.5, 0),
    new THREE.ConeGeometry(0.85, 1.8, 9).translate(0, 4.6, 0)
  ]);
  noisyGeo(pineGeo, 0.06, 2);
  const leafGeo = THREE.mergeGeometries([
    new THREE.IcosahedronGeometry(1.5, 1).translate(0, 3.2, 0),
    new THREE.IcosahedronGeometry(1.1, 1).translate(0.8, 2.8, 0.4),
    new THREE.IcosahedronGeometry(1.0, 1).translate(-0.7, 3.0, -0.5)
  ]);
  noisyGeo(leafGeo, 0.18, 7);
  const barkMat = std({ map: bark.map, normalMap: bark.normalMap });
  const snowy = z.palette === "snow";
  const pineMat = std({ map: pineTex.map, normalMap: pineTex.normalMap, color: snowy ? 0xf2f6fa : 0xd8e8d0 });
  const leafMat = std({ map: leafTex.map, normalMap: leafTex.normalMap, color: snowy ? 0xdfe6e8 : 0xffffff });
  if (snowy) { pineMat.emissive = new THREE.Color(0x3a4a50); leafMat.emissive = new THREE.Color(0x30383a); }
  addWind(pineMat, 0.02);
  addWind(leafMat, 0.03);
  if (pines.length) { root.add(instanced(trunkGeo, barkMat, pines, true)); root.add(instanced(pineGeo, pineMat, pines, true)); }
  if (cacti.length) {
    const parts = [new THREE.CylinderGeometry(0.32, 0.38, 3.2, 10).translate(0, 1.6, 0), new THREE.SphereGeometry(0.32, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 3.2, 0)];
    for (const [sx, h0, len] of [[1, 1.3, 1.1], [-1, 1.9, 0.9]]) { parts.push(new THREE.CylinderGeometry(0.17, 0.17, 0.6, 8).rotateZ(Math.PI / 2).translate(sx * 0.55, h0, 0)); parts.push(new THREE.CylinderGeometry(0.18, 0.2, len, 8).translate(sx * 0.82, h0 + len / 2, 0)); }
    const cg = THREE.mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));
    root.add(tintInst(instanced(cg, std({ color: 0x5a8a3e, roughness: 0.8 }), cacti, true), rnd, 0.12));
  }
  if (leafy.length) { root.add(instanced(trunkGeo, barkMat, leafy, true)); root.add(tintInst(instanced(leafGeo, leafMat, leafy, true), rnd, 0.14)); }
  if (leafy2.length) {
    const trunk2 = THREE.mergeGeometries([new THREE.CylinderGeometry(0.1, 0.2, 3.4, 7).translate(0, 1.7, 0), new THREE.CylinderGeometry(0.05, 0.08, 1.4, 5).rotateZ(0.8).translate(0.55, 2.6, 0), new THREE.CylinderGeometry(0.05, 0.08, 1.2, 5).rotateZ(-0.9).translate(-0.5, 2.9, 0.1)]);
    const canopy = THREE.mergeGeometries([
      new THREE.IcosahedronGeometry(1.25, 1).translate(0, 4.3, 0), new THREE.IcosahedronGeometry(1.0, 1).translate(1.0, 3.8, 0.3), new THREE.IcosahedronGeometry(0.95, 1).translate(-0.9, 3.9, -0.3),
      new THREE.IcosahedronGeometry(0.85, 1).translate(0.2, 3.5, 0.95), new THREE.IcosahedronGeometry(0.8, 1).translate(-0.3, 3.4, -0.95), new THREE.IcosahedronGeometry(0.7, 1).translate(0.1, 5.1, 0.1)
    ]);
    noisyGeo(canopy, 0.2, 13);
    root.add(instanced(trunk2, barkMat, leafy2, true));
    root.add(tintInst(instanced(canopy, leafMat, leafy2, true), rnd, 0.18));
  }
  if (bushes.length) {
    const bg = noisyGeo(THREE.mergeGeometries([new THREE.IcosahedronGeometry(0.7, 1).translate(0, 0.45, 0), new THREE.IcosahedronGeometry(0.55, 1).translate(0.5, 0.35, 0.2), new THREE.IcosahedronGeometry(0.5, 1).translate(-0.45, 0.35, -0.2)]), 0.2, 17);
    const bm = std({ map: leafTex.map, normalMap: leafTex.normalMap, color: snowy ? 0xdfe6e8 : 0x9aae86 });
    addWind(bm, 0.02);
    root.add(tintInst(instanced(bg, bm, bushes, true), rnd, 0.2));
  }
  if (flowers.length) {
    const stem = new THREE.CylinderGeometry(0.012, 0.015, 0.32, 3).translate(0, 0.16, 0).toNonIndexed();
    const head = new THREE.IcosahedronGeometry(0.06, 0).translate(0, 0.34, 0);
    const fg = THREE.mergeGeometries([stem, head.clone().translate(0.08, -0.04, 0.02), head, head.clone().translate(-0.07, -0.06, -0.05)]);
    const fm = std({ color: 0xffffff, roughness: 0.8 });
    addWind(fm, 0.06);
    const im = instanced(fg, fm, flowers, false);
    const pal = [0xf2d24a, 0xe8e8ff, 0xc890e8, 0xf08a8a, 0x8ac8f0];
    flowers.forEach((m, i) => im.setColorAt(i, new THREE.Color(pal[m.hue])));
    im.instanceColor.needsUpdate = true;
    root.add(im);
  }
  if (logs.length) {
    const lg = THREE.mergeGeometries([new THREE.CylinderGeometry(0.28, 0.32, 2.6, 9), new THREE.CylinderGeometry(0.07, 0.09, 0.6, 5).rotateZ(Math.PI / 2).translate(0.3, 0.4, 0)]);
    root.add(instanced(lg, barkMat, logs, true));
  }
  const rockGeo = noisyGeo(new THREE.IcosahedronGeometry(1, 2), 0.22, 3);
  const rockMat = std({ map: rockTex.map, normalMap: rockTex.normalMap, normalScale: new THREE.Vector2(1.2, 1.2), color: volcanic ? 0x4a4244 : desert ? 0xd8a888 : 0xffffff });
  if (rocks.length) root.add(instanced(rockGeo, rockMat, rocks, true));
  if (smallRocks.length) root.add(instanced(rockGeo, rockMat, smallRocks, false));
  if (stal.length) {
    const sg = noisyGeo(new THREE.ConeGeometry(0.5, 2, 8, 4), 0.15, 9);
    sg.translate(0, 1, 0);
    root.add(instanced(sg, rockMat, stal, true));
  }
  if (tufts.length) {
    const blade = texGrassBlade();
    const g1 = new THREE.PlaneGeometry(1, 0.8);
    g1.translate(0, 0.4, 0);
    const g2 = g1.clone().rotateY(Math.PI / 2);
    const g3 = g1.clone().rotateY(Math.PI / 4);
    const tg = THREE.mergeGeometries([g1, g2, g3]);
    const nrm = tg.attributes.normal;
    for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    const tint = theme === "town" ? 0xb8d8a0 : 0xd6dca0;
    const gm = new THREE.MeshStandardMaterial({ map: blade, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: tint });
    addWind(gm, 0.12);
    const tm = instanced(tg, gm, tufts, false);
    tm.receiveShadow = true;
    root.add(tm);
  }
}

function roofGeo(w, d, hgt) {
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.3, 0);
  shape.lineTo(0, hgt);
  shape.lineTo(w / 2 + 0.3, 0);
  shape.lineTo(-w / 2 - 0.3, 0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d + 0.6, bevelEnabled: false });
  g.translate(0, 0, -(d + 0.6) / 2);
  return g;
}

function buildTown(field, root) {
  for (const [dx, dy, dw, dh] of field.zone.docks || []) {
    const wood = std({ color: 0x7a5a3a, roughness: 0.9 }), dark = std({ color: 0x4a3420, roughness: 0.9 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(dw * U, 0.18, dh * U), wood);
    const y = Math.max(field.waterLevel || 0, field.heightAt(dx + dw / 2, dy)) + 0.35;
    deck.position.set((dx + dw / 2) * U, y, (dy + dh / 2) * U); deck.castShadow = true; deck.receiveShadow = true; root.add(deck);
    for (let k = 0; k <= 4; k++) for (const sx of [0, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.2, 6), dark); post.position.set((dx + sx * dw) * U, y - 0.9, (dy + k * dh / 4) * U); root.add(post); }
  }
  for (const [bx, by, rot] of field.zone.boats || []) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.7, 6, 10, 1, false, 0, Math.PI), std({ color: 0x5a3a24, roughness: 0.8, side: THREE.DoubleSide }));
    hull.rotation.z = Math.PI / 2; hull.rotation.y = Math.PI / 2; hull.position.y = 0.2;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5, 6), std({ color: 0x4a3420 })); mast.position.y = 2.6;
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3), std({ color: 0xe8e0cc, side: THREE.DoubleSide, roughness: 1 })); sail.position.set(0, 3, 0.1);
    g.add(hull, mast, sail);
    g.position.set(bx * U, (field.waterLevel || 0) + 0.1, by * U); g.rotation.y = rot || 0;
    root.add(g);
  }
  const z = field.zone;
  const planks = texPlanks(), bricks = texBricks(), roof = texRoof();
  const wallMat = std({ map: planks.map, normalMap: planks.normalMap });
  const stoneMat = std({ map: bricks.map, normalMap: bricks.normalMap });
  const roofMat = std({ map: roof.map, normalMap: roof.normalMap, roughness: 0.8 });
  const doorMat = std({ color: 0x3b2716 });
  const winMat = std({ color: 0x241a10, emissive: 0xffb050, emissiveIntensity: 0 });
  W3.windowMats.push(winMat);
  const plaster = texPlaster(), shingle = texShingle();
  const plasterMat = std({ map: plaster.map, normalMap: plaster.normalMap, roughness: 0.95 });
  const shingleMat = std({ map: shingle.map, normalMap: shingle.normalMap, roughness: 0.85 });
  const beamMat = std({ color: 0x3e2a1a, roughness: 0.9 });
  const frameMat = std({ color: 0x5a3e26, roughness: 0.85 });
  const lampMat = std({ color: 0x3a2a14, emissive: 0xffc070, emissiveIntensity: 0 });
  W3.windowMats.push(lampMat);
  const barrelGeo = new THREE.CylinderGeometry(0.34, 0.3, 0.9, 10).translate(0, 0.45, 0), crateGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7).translate(0, 0.35, 0);
  const barrels = [], hcrates = [];
  W3.lampGlows = W3.lampGlows || [];
  let hi = 0;
  for (const hs of z.houses || []) {
    hi++;
    if (hs.type) continue;
    const style = (hashStr(z.name + hi) % 3);
    const tg = new THREE.Group();
    const tw = hs.w * U, td = hs.h * U, tH = 3.2, bwq = hs.rot ? td : tw, bdq = hs.rot ? tw : td;
    if (style !== 0) {
      const up = new THREE.Mesh(new THREE.BoxGeometry(bwq + 0.05, tH * 0.48, bdq + 0.05), plasterMat);
      up.position.y = 0.8 + tH * 0.76;
      tg.add(up);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, tH, 0.2), beamMat); b.position.set(sx * (bwq / 2 + 0.02), 0.8 + tH / 2, sz * (bdq / 2 + 0.02)); tg.add(b); }
      const mid = new THREE.Mesh(new THREE.BoxGeometry(bwq + 0.12, 0.18, bdq + 0.12), beamMat); mid.position.y = 0.8 + tH * 0.52; tg.add(mid);
      for (let i = -1; i <= 1; i += 2) { const br = new THREE.Mesh(new THREE.BoxGeometry(0.12, tH * 0.55, 0.08), beamMat); br.position.set(i * bwq * 0.4, 0.8 + tH * 0.76, bdq / 2 + 0.04); br.rotation.z = i * 0.6; tg.add(br); }
    }
    for (const sx of [-1, 1]) {
      const fr = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.08), frameMat); fr.position.set(sx * bwq * 0.3, 0.8 + 2.0, bdq / 2 + 0.03); tg.add(fr);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.22), frameMat); sill.position.set(sx * bwq * 0.3, 0.8 + 1.52, bdq / 2 + 0.1); tg.add(sill);
      for (const s2 of [-1, 1]) { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.9, 0.05), std({ color: [0x3a5a3a, 0x5a2a2a, 0x2a3a5a][style] })); sh.position.set(sx * bwq * 0.3 + s2 * 0.72, 0.8 + 2.0, bdq / 2 + 0.06); sh.rotation.y = s2 * 0.25; tg.add(sh); }
      if (style === 1) { const fb = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.22, 0.24), frameMat); fb.position.set(sx * bwq * 0.3, 0.8 + 1.42, bdq / 2 + 0.16); tg.add(fb); for (let f = 0; f < 4; f++) { const fl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 0), std({ color: [0xf0d040, 0xe85a6a, 0xc890f0, 0xffffff][f] })); fl.position.set(sx * bwq * 0.3 - 0.36 + f * 0.24, 0.8 + 1.6, bdq / 2 + 0.17); tg.add(fl); } }
    }
    const dfr = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.1), frameMat); dfr.position.set(0, 0.8 + 1.2, bdq / 2 + 0.02); tg.add(dfr);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), lampMat); lamp.position.set(0.95, 0.8 + 2.3, bdq / 2 + 0.25); tg.add(lamp);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xffb860, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.setScalar(2.2); glow.position.copy(lamp.position); tg.add(glow); W3.lampGlows.push(glow);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.6, 0.6), stoneMat); ch.position.set(bwq * 0.28, 0.8 + tH + 1.4, -bdq * 0.15); tg.add(ch);
    tg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    tg.position.set(hs.x * U, field.heightAt(hs.x, hs.y) - 0.2, hs.y * U);
    tg.rotation.y = hs.rot ? Math.PI / 2 : 0;
    root.add(tg);
    const rnd2 = seeded(hashStr(z.name + "props" + hi));
    for (let k = 0; k < 2 + Math.floor(rnd2() * 3); k++) {
      const side = rnd2() < 0.5 ? -1 : 1, along = (rnd2() - 0.5) * hs.h * 0.8;
      const px = hs.x + side * (hs.w / 2 + 18 + rnd2() * 10), py = hs.y + along;
      if (!placeable(field, px, py, { npc: 40, path: 0.6, water: 20 })) continue;
      (rnd2() < 0.5 ? barrels : hcrates).push(mtx(px * U, field.heightAt(px, py) - 0.05, py * U, 1, 1, 1, rnd2() * 6.28));
    }
  }
  if (barrels.length) root.add(instanced(barrelGeo, std({ map: planks.map, normalMap: planks.normalMap, color: 0xb08a60 }), barrels, true));
  if (hcrates.length) root.add(instanced(crateGeo, wallMat, hcrates, true));
  roofMat.map = shingle.map; roofMat.normalMap = shingle.normalMap; roofMat.color.set(0xffffff); roofMat.needsUpdate = true;
  for (const hs of z.houses || []) {
    if (hs.type) continue;
    const g = new THREE.Group();
    const w = hs.w * U, d = hs.h * U, wallH = 3.2;
    const rot = hs.rot ? Math.PI / 2 : 0;
    const bw = hs.rot ? d : w, bd = hs.rot ? w : d;
    const base = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.8, bd), stoneMat);
    base.position.y = 0.4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bw - 0.1, wallH, bd - 0.1), wallMat);
    body.position.y = 0.8 + wallH / 2;
    const r = new THREE.Mesh(roofGeo(bw, bd, 2.2), roofMat);
    r.position.y = 0.8 + wallH;
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.12), doorMat);
    door.position.set(0, 0.8 + 1.05, bd / 2);
    g.add(base, body, r, door);
    for (const sx of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.1), winMat);
      win.position.set(sx * bw * 0.3, 0.8 + 2.0, bd / 2 + 0.01);
      g.add(win);
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(hs.x * U, field.heightAt(hs.x, hs.y) - 0.2, hs.y * U);
    g.rotation.y = rot;
    root.add(g);
  }
  const posts = [];
  const step = 26;
  const addLine = (ax, ay, bx, by) => {
    const len = Math.hypot(bx - ax, by - ay), n = Math.floor(len / step);
    for (let i = 0; i <= n; i++) {
      const px = ax + (bx - ax) * i / n, py = ay + (by - ay) * i / n;
      if (z.exits.some(ex => ex.kind !== "door" && Math.hypot(px - (ex.x + ex.w / 2), py - (ex.y + ex.h / 2)) < 70)) continue;
      const hgt = 3.2 + NOISE.hash2(i, ax | 0) * 0.8;
      posts.push(mtx(px * U, field.heightAt(px, py) - 0.3, py * U, 1, hgt / 3, 1, NOISE.hash2(i, 9) * 6));
    }
  };
  if (!z.outerWall) { addLine(10, 10, z.w - 10, 10); addLine(z.w - 10, 10, z.w - 10, z.h - 10); addLine(z.w - 10, z.h - 10, 10, z.h - 10); addLine(10, z.h - 10, 10, 10); }
  const logGeo = new THREE.CylinderGeometry(0.22, 0.26, 3, 7);
  logGeo.translate(0, 1.5, 0);
  const tipGeo = new THREE.ConeGeometry(0.22, 0.5, 7);
  tipGeo.translate(0, 3.25, 0);
  const palGeo = THREE.mergeGeometries([logGeo, tipGeo]);
  const bark = texBark();
  if (posts.length) root.add(instanced(palGeo, std({ map: bark.map, normalMap: bark.normalMap, color: 0xc8b8a0 }), posts, true));
  for (const st of z.stalls || []) {
    const g = new THREE.Group();
    const postG = new THREE.CylinderGeometry(0.07, 0.07, 2.4, 6);
    for (const [sx, sz] of [[-1.2, -0.7], [1.2, -0.7], [-1.2, 0.7], [1.2, 0.7]]) {
      const p = new THREE.Mesh(postG, wallMat);
      p.position.set(sx, 1.2, sz);
      g.add(p);
    }
    const col = new THREE.Color(st.color);
    const cloth = texCloth("cloth_" + st.color, [col.r * 255, col.g * 255, col.b * 255], [235, 225, 200]);
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.9), std({ map: cloth.map, normalMap: cloth.normalMap }));
    canopy.position.y = 2.45;
    canopy.rotation.x = 0.12;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 0.6), wallMat);
    counter.position.set(0, 0.45, 0.65);
    g.add(canopy, counter);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(st.x * U, field.heightAt(st.x, st.y), st.y * U);
    root.add(g);
  }
  for (const pr of z.props || []) {
    const g = new THREE.Group();
    const metal = std({ color: 0x4a4e56, roughness: 0.4, metalness: 0.8 }), wood = std({ color: 0x7a5432 }), dark = std({ color: 0x3a2818 }), paper = std({ color: 0xe8e0c8 });
    if (pr.type === "anvil") {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.55, 8), wood); base.position.y = 0.27;
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.22, 0.32), metal); body.position.y = 0.66;
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), metal); horn.rotation.z = Math.PI / 2; horn.position.set(0.55, 0.68, 0);
      const fire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.7, 10), std({ color: 0x5a5048, roughness: 0.95 })); fire.position.set(-1.3, 0.35, 0.3);
      const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 10), new THREE.MeshBasicMaterial({ color: 0xff6a20 })); coals.position.set(-1.3, 0.72, 0.3);
      g.add(base, body, horn, fire, coals);
    } else if (pr.type === "crates") {
      for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), k % 2 ? wood : dark); c.position.set((k % 2) * 0.65 - 0.3, 0.25 + (k > 2 ? 0.5 : 0), Math.floor(k / 2) * 0.65 - 0.3); c.rotation.y = k * 0.3; g.add(c); }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 10), wood); bar.position.set(1.0, 0.35, 0.2); g.add(bar);
    } else if (pr.type === "desk") {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.6), wood); top.position.y = 0.82;
      for (const [dx, dz] of [[-0.58, -0.25], [0.58, -0.25], [-0.58, 0.25], [0.58, 0.25]]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.8, 0.08), dark); l.position.set(dx, 0.4, dz); g.add(l); }
      const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.3), paper); book.position.set(-0.2, 0.89, 0); book.rotation.y = 0.3;
      const ink = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), dark); ink.position.set(0.35, 0.91, 0.1);
      g.add(top, book, ink);
    } else if (pr.type === "barrels") {
      for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.75, 10), wood); b.position.set(k * 0.65 - 0.65, 0.37, (k % 2) * 0.3); g.add(b); }
    }
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(pr.x * U, field.heightAt(pr.x, pr.y), pr.y * U);
    g.rotation.y = pr.rot || 0;
    root.add(g);
    z.colliders.push({ x: pr.x, y: pr.y, r: pr.r || 24 });
  }
  const crates = [];
  const rnd = rngFor(z, "crates");
  for (let i = 0; i < 26; i++) {
    const hs = (z.houses || [])[i % (z.houses || [1]).length];
    if (!hs) break;
    const px = hs.x + (rnd() - 0.5) * hs.w * 1.3, py = hs.y + hs.h / 2 + 18 + rnd() * 24;
    if (!placeable(field, px, py, { npc: 45, path: 0.5 })) continue;
    const s = 0.5 + rnd() * 0.3;
    crates.push(mtx(px * U, field.heightAt(px, py) + s / 2, py * U, s, s, s, rnd() * 6));
  }
  root.add(instanced(new THREE.BoxGeometry(1, 1, 1), wallMat, crates, true));
  const lampPostMat = std({ color: 0x2b2b2b, metalness: 0.6, roughness: 0.5 });
  const lampGlass = new THREE.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffc070, emissiveIntensity: 0 });
  W3.windowMats.push(lampGlass);
  (z.lamps || []).forEach(([lx, ly], i) => {
    if (z.colliders) z.colliders.push({ x: lx, y: ly, r: 4 });
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3, 6), lampPostMat);
    pole.position.y = 1.5;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), lampGlass);
    head.position.y = 3.15;
    g.add(pole, head);
    g.position.set(lx * U, field.heightAt(lx, ly), ly * U);
    if (i < 4) {
      const L = new THREE.PointLight(0xffc070, 0, 14, 1.6);
      L.position.y = 3.1;
      g.add(L);
      W3.lampLights.push(L);
    }
    pole.castShadow = true;
    root.add(g);
  });
}

function uvBox(w, h, d, k) {
  const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(), uv = g.attributes.uv, nr = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const ax = Math.abs(nr.getX(i)), ay = Math.abs(nr.getY(i)); const su = ax > 0.5 ? d : w, sv = ay > 0.5 ? d : h; uv.setXY(i, uv.getX(i) * su / k, uv.getY(i) * sv / k); }
  return g;
}
function texSign(text, col) {
  const key = "sign_" + text + col;
  if (TEXLIB.cache[key]) return TEXLIB.cache[key];
  const c = document.createElement("canvas"); c.width = 256; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#4a3220"; g.fillRect(0, 0, 256, 96);
  g.strokeStyle = col; g.lineWidth = 8; g.strokeRect(6, 6, 244, 84);
  g.fillStyle = "#f0e2b8"; g.font = "bold " + (text.length > 14 ? 24 : 30) + "px Georgia, serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return TEXLIB.cache[key] = t;
}
function texClock() {
  if (TEXLIB.cache.clock) return TEXLIB.cache.clock;
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#e8dcc0"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
  g.strokeStyle = "#3a2a18"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#2a2018";
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.save(); g.translate(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); g.rotate(a); g.fillRect(-2, -6, 4, i % 3 ? 8 : 13); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return TEXLIB.cache.clock = t;
}
function cityBatch() {
  const parts = new Map(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  return {
    parts,
    add(mat, geo, B, x, y, z, ry, rx, rz, sx, sy, sz) {
      const gg = geo.index ? geo.toNonIndexed() : geo.clone();
      _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
      _m.compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(sx || 1, sy || 1, sz || 1));
      gg.applyMatrix4(_m); gg.applyMatrix4(B);
      if (!gg.attributes.uv) gg.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2));
      for (const k of Object.keys(gg.attributes)) if (!["position", "normal", "uv"].includes(k)) gg.deleteAttribute(k);
      if (!parts.has(mat)) parts.set(mat, []);
      parts.get(mat).push(gg);
    },
    flush(root) {
      for (const [mat, list] of parts) { const m = new THREE.Mesh(THREE.mergeGeometries(list), mat); m.castShadow = true; m.receiveShadow = true; root.add(m); }
    }
  };
}
const CITY_TYPES = {
  home: { ground: "plaster", upper: "plaster", timber: true, shutters: true, flowers: 0.5 },
  shop: { ground: "plaster", upper: "plaster", timber: true, shutters: true, flowers: 0.3, awning: true, sign: true },
  hall: { ground: "stone", upper: "plaster", timber: true, sign: true },
  barracks: { ground: "stone", upper: "stone", flag: true, sign: true },
  guard: { ground: "stone", upper: "stone", flag: true },
  cityhall: { ground: "stone", upper: "stone", clock: true, flag: true },
  auction: { ground: "stone", upper: "plaster", portico: true, sign: true },
  forge: { ground: "stone", upper: "stone", forge: true, sign: true },
  mill: { ground: "stone", upper: "planks", sails: true },
  warehouse: { ground: "planks", upper: "planks", bigdoor: true, crane: true },
  markethall: { open: true },
  keep: { ground: "stone", upper: "stone", flat: true, flag: true },
  smelter: { ground: "stone", upper: "stone", smelter: true, bigdoor: true }
};
const CITY_STYLES = {
  default: { plaster: [0xf4ead4, 0xe8d0a0, 0xd8e0e4, 0xf0d8c8], roof: [0xb05a44, 0x6a7a90, 0x8a6040, 0x5a4a44], shutter: [0x3a5a3a, 0x5a2a2a, 0x2a3a5a, 0x6a5a2a], pitch: 0.36 },
  harbor: { plaster: [0xf8f6f0, 0xe6eef4, 0xf2e6cc, 0xdcebe4], roof: [0x2f7f8f, 0x3a5a8a, 0xc0603a, 0x4a8a9a], shutter: [0x2a6a9a, 0x2a8a8a, 0x1a4a7a, 0xc8a040], pitch: 0.3 },
  mountain: { plaster: [0xd8d0c4, 0xc8c0b4, 0xe0d8c8, 0xb8b4ac], roof: [0x3a4048, 0x4a4a52, 0x5a4a40, 0x2e343c], shutter: [0x5a3a24, 0x3a2a1a, 0x6a4a2a, 0x4a3a2a], pitch: 0.55, stoneUpper: true }
};
function buildCityBuildings(field, root) {
  const z = field.zone;
  if (!(z.houses || []).some(h => h.type)) return;
  const bricks = texBricks(), plaster = texPlaster(), shingle = texShingle(), planks = texPlanks();
  const ST = CITY_STYLES[z.cityStyle] || CITY_STYLES.default;
  const M = {
    stone: std({ map: bricks.map, normalMap: bricks.normalMap, color: 0xd8d0c4 }),
    planks: std({ map: planks.map, normalMap: planks.normalMap, color: 0xc8a888 }),
    plaster: ST.plaster.map(c => std({ map: plaster.map, normalMap: plaster.normalMap, color: c, roughness: 0.95 })),
    roof: ST.roof.map(c => std({ map: shingle.map, normalMap: shingle.normalMap, color: c, roughness: 0.85 })),
    beam: std({ color: 0x3e2a1a, roughness: 0.9 }),
    frame: std({ color: 0x5a3e26, roughness: 0.85 }),
    trim: std({ color: 0xb8b0a0, roughness: 0.85 }),
    door: std({ color: 0x4a2e18, roughness: 0.8 }),
    iron: std({ color: 0x2e2e32, roughness: 0.5, metalness: 0.7 }),
    gold: std({ color: 0xd4a840, roughness: 0.4, metalness: 0.6 }),
    leaf: std({ color: 0x4a8a3a, roughness: 0.9 }),
    soil: std({ color: 0x4a3626, roughness: 1 }),
    water: std({ color: 0x3a7ab0, roughness: 0.15, metalness: 0.2, emissive: 0x0a2030 }),
    shutter: ST.shutter.map(c => std({ color: c, roughness: 0.8 })),
    rock: std({ color: z.palette === "snow" ? 0x8a8e96 : 0x7a7068, roughness: 0.95 }),
    ore: std({ color: 0x3a3634, roughness: 0.8, metalness: 0.3 }),
    fish: std({ color: 0xb8c4cc, roughness: 0.35, metalness: 0.5 }),
    white: std({ color: 0xf2efe8, roughness: 0.8 }),
    red: std({ color: 0xb03a30, roughness: 0.8 })
  };
  const win = std({ color: 0x241a10, emissive: 0xffb050, emissiveIntensity: 0 });
  const lampMat = std({ color: 0x3a2a14, emissive: 0xffc070, emissiveIntensity: 0 });
  W3.windowMats.push(win, lampMat);
  W3.spinners = W3.spinners || []; W3.clocks = W3.clocks || [];
  const bt = cityBatch(), box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl = (a, b, h, n) => new THREE.CylinderGeometry(a, b, h, n || 8);
  const glowAt = (B, x, y, zz, s) => { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xffb860, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(s || 2); gl.position.set(x, y, zz).applyMatrix4(B); root.add(gl); W3.lampGlows.push(gl); };
  const FH = 3.0, PL = 0.6;
  (z.houses || []).forEach((hs, idx) => {
    if (!hs.type) return;
    const T = CITY_TYPES[hs.type] || CITY_TYPES.home, rnd = seeded(hashStr(z.name + "cb" + idx));
    const n = hs.floors || 2, bw = (hs.rot ? hs.h : hs.w) * U, bd = (hs.rot ? hs.w : hs.h) * U;
    const gy = field.heightAt(hs.x, hs.y) - 0.2;
    const B = new THREE.Matrix4().makeRotationY(hs.rot ? Math.PI / 2 : 0).setPosition(hs.x * U, gy, hs.y * U);
    const tint = hs.tint != null ? hs.tint : Math.floor(rnd() * 4);
    const matOf = k => k === "stone" ? M.stone : k === "planks" ? M.planks : M.plaster[tint % 4];
    if (T.open) {
      bt.add(M.stone, box(bw + 0.4, 0.3, bd + 0.4), B, 0, 0.1, 0);
      const np = Math.max(2, Math.round(bw / 3));
      for (let i = 0; i <= np; i++) for (const sz of [-1, 1]) bt.add(M.beam, cyl(0.16, 0.18, 3.4, 8), B, -bw / 2 + i * bw / np, 1.85, sz * (bd / 2 - 0.2));
      bt.add(M.beam, box(bw + 0.2, 0.22, bd), B, 0, 3.55, 0);
      bt.add(M.roof[hs.roof != null ? hs.roof : 0], roofGeo(bw + 0.6, bd + 0.4, Math.min(2.6, bd * 0.4)), B, 0, 3.6, 0, Math.PI / 2, 0, 0, bd / (bw + 0.6) * 0 + 1);
      for (let i = 0; i < np; i++) {
        const tx = -bw / 2 + (i + 0.5) * bw / np;
        bt.add(M.planks, box(2.0, 0.1, 1.0), B, tx, 0.95, 0);
        for (const sx of [-0.8, 0.8]) for (const sz of [-0.4, 0.4]) bt.add(M.frame, box(0.08, 0.85, 0.08), B, tx + sx, 0.5, sz);
        for (let k = 0; k < 5; k++) bt.add(M.fish, new THREE.SphereGeometry(0.11, 6, 4).scale(2.6, 0.7, 1), B, tx - 0.7 + k * 0.35, 1.05, -0.2 + (k % 2) * 0.35, rnd() * 0.6);
        bt.add(M.planks, box(0.6, 0.4, 0.5), B, tx + 0.6, 0.2, 0.9, rnd());
      }
      if (hs.sign) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), new THREE.MeshStandardMaterial({ map: texSign(hs.sign, hs.signCol || "#d4a840"), side: THREE.DoubleSide })); sg.position.set(0, 3.25, bd / 2 + 0.05); sg.applyMatrix4(B); root.add(sg); }
      return;
    }
    const roofM = M.roof[hs.roof != null ? hs.roof : T.ground === "stone" ? 1 : Math.floor(rnd() * 4) % 4];
    bt.add(M.stone, box(bw + 0.3, PL + 0.4, bd + 0.3), B, 0, (PL - 0.4) / 2, 0);
    let depth = bd, topY = PL;
    for (let f = 0; f < n; f++) {
      const jet = T.timber && f > 0 ? 0.22 * f : 0, d = bd + jet * 2, y0 = PL + f * FH;
      bt.add(matOf(f ? T.upper : T.ground), box(bw, FH, d), B, 0, y0 + FH / 2, 0);
      if (f > 0) bt.add(T.timber ? M.beam : M.trim, box(bw + 0.14, 0.2, d + 0.14), B, 0, y0, 0);
      if (T.timber && (f > 0 || T.ground !== "stone")) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) bt.add(M.beam, box(0.18, FH, 0.18), B, sx * (bw / 2 + 0.02), y0 + FH / 2, sz * (d / 2 + 0.02));
        for (const sx of [-1, 1]) bt.add(M.beam, box(0.12, FH * 0.9, 0.06), B, sx * bw * 0.36, y0 + FH / 2, d / 2 + 0.04, 0, 0, sx * 0.55);
      }
      const nw = Math.max(1, Math.floor((bw - 0.8) / 2.3));
      for (let i = 0; i < nw; i++) {
        const wx = (i + 0.5) / nw * bw - bw / 2;
        if (f === 0 && Math.abs(wx) < 1.0) continue;
        for (const face of [1, -1]) {
          const fz = face * (d / 2), wy = y0 + FH * 0.55;
          bt.add(M.frame, box(1.0, 1.15, 0.1), B, wx, wy, fz + face * 0.03);
          bt.add(win, box(0.8, 0.95, 0.1), B, wx, wy, fz + face * 0.05);
          bt.add(M.frame, box(0.06, 0.95, 0.12), B, wx, wy, fz + face * 0.07);
          bt.add(M.frame, box(1.1, 0.08, 0.24), B, wx, wy - 0.6, fz + face * 0.1);
          if (T.shutters && face > 0) for (const s2 of [-1, 1]) bt.add(M.shutter[(tint + idx) % 4], box(0.42, 0.95, 0.05), B, wx + s2 * 0.72, wy, fz + face * 0.08, s2 * 0.3);
          if (face > 0 && f > 0 && rnd() < (T.flowers || 0)) { bt.add(M.frame, box(0.95, 0.2, 0.24), B, wx, wy - 0.7, fz + 0.16); for (let k = 0; k < 4; k++) bt.add(M.leaf, new THREE.IcosahedronGeometry(0.11, 0), B, wx - 0.33 + k * 0.22, wy - 0.52, fz + 0.18); }
        }
      }
      if (bd > 4) for (const sx of [-1, 1]) {
        const wy = y0 + FH * 0.55, fx = sx * (bw / 2);
        bt.add(M.frame, box(0.1, 1.1, 0.9), B, fx + sx * 0.03, wy, 0);
        bt.add(win, box(0.1, 0.9, 0.7), B, fx + sx * 0.05, wy, 0);
      }
      depth = d; topY = y0 + FH;
    }
    const rh = T.flat ? 0 : Math.min(ST.pitch > 0.4 ? 4.6 : 3.4, bw * ST.pitch);
    if (T.flat) {
      bt.add(M.trim, box(bw + 0.5, 0.3, depth + 0.5), B, 0, topY + 0.15, 0);
      const per = 2 * (bw + depth), nm = Math.floor(per / 1.4);
      for (let k = 0; k < nm; k++) {
        const t = k / nm * per, sd = t < bw ? 0 : t < bw + depth ? 1 : t < 2 * bw + depth ? 2 : 3;
        const mx = sd === 0 ? -bw / 2 + t : sd === 1 ? bw / 2 : sd === 2 ? bw / 2 - (t - bw - depth) : -bw / 2, mz = sd === 0 ? -depth / 2 : sd === 1 ? -depth / 2 + (t - bw) : sd === 2 ? depth / 2 : depth / 2 - (t - 2 * bw - depth);
        bt.add(M.stone, box(0.7, 0.8, 0.7), B, mx, topY + 0.7, mz);
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const th2 = topY + 3.2;
        bt.add(M.stone, cyl(1.4, 1.5, th2, 12), B, sx * bw / 2, th2 / 2, sz * depth / 2);
        bt.add(M.roof[1], new THREE.ConeGeometry(1.75, 3.2, 12), B, sx * bw / 2, th2 + 1.6, sz * depth / 2);
        bt.add(win, box(0.3, 0.9, 0.1), B, sx * bw / 2, th2 - 1.2, sz * depth / 2 + sz * 1.42);
      }
    } else {
      bt.add(roofM, roofGeo(bw, depth, rh), B, 0, topY, 0);
      const gable = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-bw / 2, 0), new THREE.Vector2(bw / 2, 0), new THREE.Vector2(0, rh * 0.94)]));
      for (const face of [1, -1]) bt.add(ST.stoneUpper && !T.timber ? M.stone : matOf(T.upper), gable, B, 0, topY, face * (depth / 2 + 0.01), face > 0 ? 0 : Math.PI);
      if (n >= 2 && bw > 5) bt.add(win, box(0.6, 0.6, 0.1), B, 0, topY + rh * 0.4, depth / 2 + 0.04);
    }
    if (T.smelter) {
      for (const sx of [-1, 1]) {
        bt.add(M.stone, cyl(0.8, 1.0, 8, 10), B, sx * bw * 0.28, topY + 2.6, -bd * 0.12);
        const em = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0xff7030 })); em.position.set(sx * bw * 0.28, topY + 6.65, -bd * 0.12); em.applyMatrix4(B); root.add(em);
        glowAt(B, sx * bw * 0.28, topY + 7.0, -bd * 0.12, 4);
      }
      for (let k = 0; k < 3; k++) bt.add(M.ore, new THREE.ConeGeometry(1.0 + rnd() * 0.5, 1.0 + rnd() * 0.5, 7), B, -bw / 2 - 1.4, 0.5, -bd * 0.3 + k * 1.6, rnd() * 3);
      const L = new THREE.PointLight(0xff8a3a, 10, 14, 1.6); L.position.set(0, PL + 1.4, bd / 2 + 1.0).applyMatrix4(B); L.userData.phase = idx * 2.1; root.add(L); W3.torchLights.push(L);
      const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 0.1), new THREE.MeshBasicMaterial({ color: 0xff7a30 })); hearth.position.set(0, PL + 1.5, bd / 2 + 0.03); hearth.applyMatrix4(B); root.add(hearth);
    }
    if (!T.clock && !T.flat) bt.add(M.stone, box(0.7, 2.2, 0.7), B, bw * 0.26 * (rnd() < 0.5 ? -1 : 1), topY + 1.2, -bd * 0.18);
    const fz = bd / 2;
    if (T.smelter) return;
    const dw = T.bigdoor ? 3.2 : T.portico ? 1.6 : 1.3, dh = T.bigdoor ? 3.2 : 2.3;
    bt.add(M.frame, box(dw + 0.3, dh + 0.2, 0.12), B, 0, PL + dh / 2, fz + 0.04);
    bt.add(M.door, box(dw, dh, 0.1), B, 0, PL + dh / 2, fz + 0.08);
    bt.add(M.iron, box(0.08, 0.08, 0.12), B, dw * 0.32, PL + dh * 0.45, fz + 0.14);
    bt.add(M.stone, box(dw + 0.8, 0.22, 0.7), B, 0, PL - 0.09, fz + 0.35);
    bt.add(lampMat, box(0.24, 0.34, 0.24), B, dw / 2 + 0.45, PL + dh + 0.1, fz + 0.28);
    bt.add(M.iron, box(0.05, 0.05, 0.3), B, dw / 2 + 0.45, PL + dh + 0.3, fz + 0.14);
    glowAt(B, dw / 2 + 0.45, PL + dh + 0.1, fz + 0.28, 2);
    if (T.awning || hs.awning) {
      const col = new THREE.Color(hs.awning || "#a04030");
      const cloth = texCloth("cloth_" + (hs.awning || "#a04030"), [col.r * 255, col.g * 255, col.b * 255], [240, 230, 205]);
      const am = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.8, 0.06, 1.5), std({ map: cloth.map, normalMap: cloth.normalMap }));
      am.position.set(0, PL + dh + 0.55, fz + 0.75); am.rotation.x = 0.32; am.applyMatrix4(B); am.castShadow = true; root.add(am);
      for (const sx of [-1, 1]) bt.add(M.frame, cyl(0.04, 0.04, 1.6, 5), B, sx * bw * 0.38, PL + dh + 0.3, fz + 1.0, 0, 1.2);
    }
    if (hs.sign || T.sign) {
      const label = hs.sign || "", sx = -(dw / 2 + 1.0);
      bt.add(M.iron, box(1.1, 0.06, 0.06), B, sx + 0.45, PL + dh + 0.6, fz + 0.55, 0, 0, 0);
      bt.add(M.iron, box(0.06, 0.06, 0.6), B, sx + 0.95, PL + dh + 0.6, fz + 0.28);
      if (label) {
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.56), new THREE.MeshStandardMaterial({ map: texSign(label, hs.signCol || "#d4a840"), side: THREE.DoubleSide, roughness: 0.8 }));
        sg.position.set(sx + 0.1, PL + dh + 0.25, fz + 0.55); sg.rotation.y = Math.PI / 2; sg.applyMatrix4(B); root.add(sg);
        const sg2 = sg.clone(); sg2.position.set(sx + 0.1, PL + dh + 0.25, fz + 0.55); sg2.rotation.set(0, 0, 0); sg2.position.set(0, PL + dh + 0.48, fz + 0.16); sg2.scale.setScalar(Math.min(1.27, bw / 3)); sg2.applyMatrix4(B); root.add(sg2);
      }
    }
    if (T.flag || hs.flag) {
      const px = bw / 2 - 0.4, py = topY + rh * 0.3;
      bt.add(M.iron, cyl(0.05, 0.06, 4, 6), B, px, py + 2, depth / 2 - 0.4);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0, 6, 1), std({ color: new THREE.Color(hs.flag || "#c0392b"), side: THREE.DoubleSide, roughness: 0.95 }));
      fl.position.set(px + 0.82, py + 3.4, depth / 2 - 0.4); fl.applyMatrix4(B); fl.userData.flag = true; root.add(fl); W3.spinners.push(fl);
    }
    if (T.portico) {
      for (let k = 0; k < 4; k++) bt.add(M.trim, cyl(0.22, 0.26, dh + 1.4, 10), B, -bw * 0.36 + k * bw * 0.24, PL + (dh + 1.4) / 2, fz + 1.3);
      bt.add(M.trim, box(bw * 0.92, 0.35, 1.7), B, 0, PL + dh + 1.55, fz + 0.9);
      bt.add(M.trim, roofGeo(bw * 0.86, 1.1, 0.9), B, 0, PL + dh + 1.72, fz + 0.9);
      bt.add(M.stone, box(bw * 0.95, 0.25, 2.0), B, 0, PL - 0.12, fz + 1.0);
    }
    if (T.forge) {
      bt.add(M.stone, box(1.4, 4.2, 1.4), B, -bw * 0.32, topY + 1.4, 0);
      const ember = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 1.0), new THREE.MeshBasicMaterial({ color: 0xff6a20 }));
      ember.position.set(-bw * 0.32, topY + 3.55, 0); ember.applyMatrix4(B); root.add(ember);
      const hearth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 0.1), new THREE.MeshBasicMaterial({ color: 0xff7a30 }));
      hearth.position.set(bw * 0.28, PL + 0.8, fz + 0.06); hearth.applyMatrix4(B); root.add(hearth);
      bt.add(M.stone, box(2.2, 2.2, 0.3), B, bw * 0.28, PL + 1.0, fz + 0.18);
      const L = new THREE.PointLight(0xff8a3a, 12, 14, 1.6); L.position.set(bw * 0.28, PL + 1.2, fz + 1.2).applyMatrix4(B); L.userData.phase = idx; root.add(L); W3.torchLights.push(L);
    }
    if (T.sails) {
      const hub = new THREE.Group(), sm = std({ color: 0xe8dcc4, side: THREE.DoubleSide, roughness: 1 }), am = std({ color: 0x5a3e26 });
      for (let k = 0; k < 4; k++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5.6, 0.12), am); arm.position.y = 2.8;
        const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 4.4), sm); sail.position.set(0.62, 3.2, 0.02);
        const blade = new THREE.Group(); blade.add(arm, sail); blade.rotation.z = k * Math.PI / 2; hub.add(blade);
      }
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 10), am); cap.rotation.x = Math.PI / 2; hub.add(cap);
      hub.position.set(0, topY + rh * 0.45, depth / 2 + 0.45); hub.applyMatrix4(B); hub.userData.spin = 0.55; root.add(hub); W3.spinners.push(hub);
    }
    if (T.crane) {
      bt.add(M.beam, box(0.25, 0.25, 2.4), B, bw * 0.3, topY - 0.4, fz + 1.1);
      bt.add(M.iron, cyl(0.02, 0.02, 2.2, 4), B, bw * 0.3, topY - 1.6, fz + 2.2);
      bt.add(M.planks, box(0.8, 0.6, 0.8), B, bw * 0.3, topY - 2.9, fz + 2.2);
      for (let k = 0; k < 5; k++) bt.add(M.planks, box(0.75, 0.75, 0.75), B, -bw * 0.38 + (k % 3) * 0.8, PL + 0.38 + (k > 2 ? 0.75 : 0), fz + 1.4 + (k % 2) * 0.2, k * 0.2);
    }
    if (T.clock) {
      const tw = 3.6, th = 7.5, ty = topY;
      bt.add(M.stone, box(tw, th, tw), B, 0, ty + th / 2 - 1.0, 0);
      bt.add(M.trim, box(tw + 0.3, 0.3, tw + 0.3), B, 0, ty + th - 1.0, 0);
      bt.add(M.roof[1], new THREE.ConeGeometry(tw * 0.78, 4.4, 4).rotateY(Math.PI / 4), B, 0, ty + th + 1.2, 0);
      bt.add(M.gold, cyl(0.04, 0.04, 1.2, 4), B, 0, ty + th + 3.8, 0);
      for (const face of [1, -1]) {
        const cf = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), new THREE.MeshStandardMaterial({ map: texClock(), roughness: 0.7 }));
        cf.position.set(0, ty + th - 2.5, face * (tw / 2 + 0.03)); cf.rotation.y = face > 0 ? 0 : Math.PI; cf.applyMatrix4(B); root.add(cf);
        for (const [len, wid, k] of [[0.7, 0.1, "h"], [1.0, 0.06, "m"]]) {
          const hand = new THREE.Mesh(new THREE.BoxGeometry(wid, len, 0.03).translate(0, len / 2, 0), M.iron);
          hand.position.set(0, ty + th - 2.5, face * (tw / 2 + 0.06)); hand.rotation.y = face > 0 ? 0 : Math.PI; hand.applyMatrix4(B);
          hand.userData.clock = k; hand.userData.face = face; root.add(hand); W3.clocks.push(hand);
        }
      }
      for (let k = 0; k < 2; k++) for (const sx of [-1, 1]) bt.add(win, box(0.7, 1.6, 0.1), B, sx * 0.9, ty + 1.0 + k * 2.2, tw / 2 + 0.02);
    }
  });
  const col = (x, y, r) => { if (z.colliders) z.colliders.push({ x, y, r }); };
  for (const [x, y] of z.lighthouses || []) {
    col(x, y, 60);
    const B = new THREE.Matrix4().makeTranslation(x * U, field.heightAt(x, y), y * U);
    bt.add(M.stone, cyl(3.0, 3.4, 1.2, 16), B, 0, 0.4, 0);
    for (let k = 0; k < 5; k++) bt.add(k % 2 ? M.red : M.white, cyl(2.3 - k * 0.22, 2.5 - k * 0.22, 2.6, 16), B, 0, 1.0 + 1.3 + k * 2.6, 0);
    bt.add(M.iron, cyl(1.7, 1.7, 0.2, 16), B, 0, 14.1, 0);
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffd080, emissiveIntensity: 0.4, transparent: true, opacity: 0.85 }));
    lamp.position.set(0, 15.1, 0); lamp.applyMatrix4(B); root.add(lamp); W3.windowMats.push(lamp.material);
    bt.add(M.red, new THREE.ConeGeometry(1.4, 1.6, 12), B, 0, 16.8, 0);
    glowAt(B, 0, 15.1, 0, 9);
    const L = new THREE.PointLight(0xffd080, 0, 60, 1.2); L.position.set(0, 15.1, 0).applyMatrix4(B); root.add(L); W3.lampLights.push(L);
  }
  for (const [x, y, rot] of z.slipways || []) {
    col(x, y, 70);
    const B = new THREE.Matrix4().makeRotationY(rot || 0).setPosition(x * U, field.heightAt(x, y), y * U);
    for (let k = -3; k <= 3; k++) { bt.add(M.beam, box(3.2, 0.25, 0.3), B, 0, 0.12, k * 1.2); for (const sx of [-1, 1]) bt.add(M.beam, box(0.2, 1.2, 0.2), B, sx * 1.2, 0.7, k * 1.2, 0, 0, sx * 0.3); }
    const hull = new THREE.CylinderGeometry(1.5, 1.0, 8.4, 12, 1, true, 0, Math.PI);
    bt.add(M.planks, hull, B, 0, 1.7, 0, 0, Math.PI / 2, Math.PI);
    for (let k = -3; k <= 3; k++) bt.add(M.frame, new THREE.TorusGeometry(1.35, 0.08, 4, 10, Math.PI), B, 0, 1.75, k * 1.15, 0, 0, Math.PI);
    bt.add(M.beam, box(0.18, 0.18, 9.0), B, 0, 0.35, 0);
  }
  for (const [x, y, rot] of z.mines || []) {
    col(x, y, 70);
    const B = new THREE.Matrix4().makeRotationY(rot || 0).setPosition(x * U, field.heightAt(x, y), y * U);
    const rock = new THREE.DodecahedronGeometry(5.5, 1); noisyGeo(rock, 0.9, 77);
    bt.add(M.rock, rock, B, 0, 1.6, -3.8, 0, 0, 0, 1.3, 1.0, 1.0);
    for (const sx of [-1, 1]) bt.add(M.beam, box(0.45, 3.6, 0.45), B, sx * 1.6, 1.8, 0.2);
    bt.add(M.beam, box(4.2, 0.5, 0.55), B, 0, 3.7, 0.2);
    bt.add(M.ore, box(2.8, 3.2, 0.2), B, 0, 1.6, -0.1);
    for (let k = 0; k < 9; k++) { bt.add(M.beam, box(1.8, 0.1, 0.22), B, 0, 0.05, 0.6 + k * 0.9); }
    for (const sx of [-1, 1]) bt.add(M.iron, box(0.07, 0.08, 8.2), B, sx * 0.55, 0.14, 4.4);
    bt.add(M.planks, box(1.3, 0.8, 1.7), B, 0, 0.75, 3.0);
    bt.add(M.ore, new THREE.ConeGeometry(0.6, 0.5, 6), B, 0, 1.35, 3.0);
    for (const sx of [-1, 1]) for (const sz of [2.4, 3.6]) bt.add(M.iron, cyl(0.25, 0.25, 0.1, 10), B, sx * 0.62, 0.3, sz, 0, 0, Math.PI / 2);
    bt.add(lampMat, box(0.25, 0.35, 0.25), B, 1.6, 2.8, 0.6); glowAt(B, 1.6, 2.8, 0.6, 2.2);
  }
  for (const f of z.fountains || []) {
    col(f.x, f.y, 48);
    const B = new THREE.Matrix4().makeTranslation(f.x * U, field.heightAt(f.x, f.y), f.y * U);
    bt.add(M.trim, cyl(2.3, 2.5, 0.7, 20), B, 0, 0.35, 0);
    bt.add(M.stone, cyl(0.5, 0.7, 1.6, 10), B, 0, 1.4, 0);
    bt.add(M.trim, cyl(1.0, 0.6, 0.35, 14), B, 0, 2.3, 0);
    bt.add(M.trim, cyl(0.25, 0.35, 1.0, 8), B, 0, 2.9, 0);
    bt.add(M.gold, new THREE.SphereGeometry(0.3, 10, 8), B, 0, 3.5, 0);
    const wtr = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 0.05, 20), M.water); wtr.position.set(0, 0.62, 0); wtr.applyMatrix4(B); root.add(wtr);
    const spray = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.1, 14, 1, true), std({ color: 0xcfe8ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide, emissive: 0x2a4a60 }));
    spray.position.set(0, 2.25, 0); spray.rotation.x = Math.PI; spray.applyMatrix4(B); root.add(spray);
  }
  for (const gd of z.gardens || []) {
    const B = new THREE.Matrix4().makeTranslation(gd.x * U, field.heightAt(gd.x, gd.y), gd.y * U), w = gd.w * U, d = gd.h * U, r2 = seeded(hashStr("gd" + gd.x + gd.y));
    bt.add(M.soil, box(w - 0.4, 0.2, d - 0.4), B, 0, 0.08, 0);
    const rows = Math.max(2, Math.floor(d / 1.1));
    for (let i = 0; i < rows; i++) for (let k = 0; k < Math.floor(w / 0.7); k++) bt.add(M.leaf, new THREE.IcosahedronGeometry(0.18 + r2() * 0.12, 0), B, -w / 2 + 0.5 + k * 0.7, 0.3, -d / 2 + 0.6 + i * (d - 1.2) / Math.max(1, rows - 1), r2() * 3, 0, 0, 1, 0.7 + r2() * 0.6, 1);
    const pk = Math.max(2, Math.round((w + d) * 2 / 0.6));
    for (let i = 0; i < pk; i++) {
      const t = i / pk * 2 * (w + d), side = t < w ? 0 : t < w + d ? 1 : t < 2 * w + d ? 2 : 3;
      const px = side === 0 ? -w / 2 + t : side === 1 ? w / 2 : side === 2 ? w / 2 - (t - w - d) : -w / 2, pz = side === 0 ? -d / 2 : side === 1 ? -d / 2 + (t - w) : side === 2 ? d / 2 : d / 2 - (t - 2 * w - d);
      if (side === 2 && Math.abs(px) < 0.6) continue;
      bt.add(M.trim, box(0.08, 0.7, 0.08), B, px, 0.35, pz);
    }
    for (const [ax, az, bx2, bz, l] of [[0, -d / 2, 0, 0, w], [0, d / 2, 0, 0, w]]) bt.add(M.trim, box(l, 0.06, 0.04), B, ax, 0.55, az);
    for (const sx of [-1, 1]) bt.add(M.trim, box(0.04, 0.06, d), B, sx * w / 2, 0.55, 0);
  }
  for (const [x, y, rot] of z.dummies || []) {
    col(x, y, 12);
    const B = new THREE.Matrix4().makeRotationY(rot || 0).setPosition(x * U, field.heightAt(x, y), y * U);
    bt.add(M.frame, cyl(0.07, 0.08, 1.9, 6), B, 0, 0.95, 0);
    bt.add(M.frame, box(1.1, 0.08, 0.08), B, 0, 1.45, 0);
    bt.add(M.planks, new THREE.SphereGeometry(0.32, 8, 6).scale(1, 1.3, 0.8), B, 0, 1.25, 0);
    bt.add(M.planks, new THREE.SphereGeometry(0.2, 8, 6), B, 0, 1.85, 0);
  }
  for (const [x, y, rot] of z.racks || []) {
    col(x, y, 22);
    const B = new THREE.Matrix4().makeRotationY(rot || 0).setPosition(x * U, field.heightAt(x, y), y * U);
    for (const sx of [-1, 1]) bt.add(M.frame, box(0.1, 1.4, 0.1), B, sx * 0.8, 0.7, 0);
    bt.add(M.frame, box(1.8, 0.08, 0.1), B, 0, 1.2, 0);
    for (let k = 0; k < 4; k++) { bt.add(M.iron, box(0.05, 1.3, 0.02), B, -0.6 + k * 0.4, 0.75, 0.08, 0, 0.12); bt.add(M.frame, box(0.18, 0.04, 0.05), B, -0.6 + k * 0.4, 1.35, 0.08); }
  }
  for (const [x, y, rot] of z.benches || []) {
    col(x, y, 18);
    const B = new THREE.Matrix4().makeRotationY(rot || 0).setPosition(x * U, field.heightAt(x, y), y * U);
    bt.add(M.planks, box(1.6, 0.08, 0.45), B, 0, 0.45, 0);
    bt.add(M.planks, box(1.6, 0.4, 0.06), B, 0, 0.7, -0.2, 0, -0.15);
    for (const sx of [-1, 1]) bt.add(M.iron, box(0.06, 0.45, 0.4), B, sx * 0.7, 0.22, 0);
  }
  if (z.outerWall) {
    const stone = M.stone, parts = [], H = 5.2, L0 = 14;
    const segs = [[L0, L0, z.w - L0, L0], [z.w - L0, L0, z.w - L0, z.h - L0], [L0, z.h - L0, z.w - L0, z.h - L0], [L0, L0, L0, z.h - L0]];
    const gaps = (z.exits || []).filter(e => e.kind !== "door").map(e => ({ e, side: exitSide(z, e), c: e.x <= 1 || e.x + e.w >= z.w - 1 ? e.y + e.h / 2 : e.x + e.w / 2, half: (e.lane || 110) }));
    const sideOf = i => ["n", "e", "s", "w"][i];
    const sideOn = i => typeof z.outerWall !== "string" || z.outerWall.includes(sideOf(i));
    segs.forEach(([x1, y1, x2, y2], i) => {
      if (!sideOn(i)) return;
      const horiz = y1 === y2, a = horiz ? x1 : y1, b = horiz ? x2 : y2;
      const cuts = gaps.filter(g => g.side === sideOf(i)).sort((p, q) => p.c - q.c);
      let st = a;
      const piece = (s0, s1) => {
        const len = s1 - s0, nn = Math.max(1, Math.round(len / 160));
        for (let k = 0; k < nn; k++) {
          const p0 = s0 + len * k / nn, p1 = s0 + len * (k + 1) / nn, c = (p0 + p1) / 2, Lm = (p1 - p0) * U + 0.02;
          const px = horiz ? c : x1, py = horiz ? y1 : c;
          const hs2 = [p0, c, p1].map(t => field.heightAt(horiz ? t : x1, horiz ? y1 : t));
          const y0 = Math.min(...hs2) - 0.8, top = Math.max(...hs2) + H;
          bt.add(stone, uvBox(horiz ? Lm : 1.8, top - y0, horiz ? 1.8 : Lm, 2.4), new THREE.Matrix4(), px * U, (y0 + top) / 2, py * U);
          const m = Math.max(1, Math.floor(Lm / 1.5));
          for (let q = 0; q < m; q++) { const t = (q + 0.5) / m - 0.5; bt.add(stone, box(0.62, 0.72, 0.4), new THREE.Matrix4(), px * U + (horiz ? t * Lm : (i === 1 ? -1 : 1) * 0.7), top + 0.36, py * U + (horiz ? (i === 2 ? -1 : 1) * 0.7 : t * Lm)); }
        }
      };
      for (const g of cuts) { if (g.c - g.half - st > 10) piece(st, g.c - g.half); st = g.c + g.half; }
      if (b - st > 10) piece(st, b);
    });
    const tower = (x, y, h) => { const gy = field.heightAt(x, y); bt.add(stone, uvBox(3.2, h + 1, 3.2, 2.4), new THREE.Matrix4(), x * U, gy - 0.5 + h / 2, y * U); bt.add(M.trim, box(3.7, 0.35, 3.7), new THREE.Matrix4(), x * U, gy + h, y * U); bt.add(M.roof[0], new THREE.ConeGeometry(3.0, 3.2, 4).rotateY(Math.PI / 4), new THREE.Matrix4(), x * U, gy + h + 1.75, y * U); };
    [[L0, L0, 0, 3], [z.w - L0, L0, 0, 1], [L0, z.h - L0, 2, 3], [z.w - L0, z.h - L0, 1, 2]].forEach(([x, y, a1, a2]) => { if (sideOn(a1) || sideOn(a2)) tower(x, y, 9); });
    for (const g of gaps) {
      const vert = g.side === "e" || g.side === "w", ex = g.side === "e" ? z.w - L0 : g.side === "w" ? L0 : 0, ey = g.side === "s" ? z.h - L0 : g.side === "n" ? L0 : 0;
      for (const sd of [-1, 1]) tower(vert ? ex : g.c + sd * (g.half + 30), vert ? g.c + sd * (g.half + 30) : ey, 11);
      const gx = vert ? ex : g.c, gyy = vert ? g.c : ey, gy = field.heightAt(gx, gyy), span = (g.half * 2 + 60) * U;
      bt.add(stone, uvBox(vert ? 2.6 : span, 2.0, vert ? span : 2.6, 2.4), new THREE.Matrix4(), gx * U, gy + 8.0, gyy * U);
      bt.add(M.trim, box(vert ? 3.0 : span + 0.4, 0.3, vert ? span + 0.4 : 3.0), new THREE.Matrix4(), gx * U, gy + 9.1, gyy * U);
      const ban = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.0), new THREE.MeshStandardMaterial({ map: texSign(z.city || z.name, "#d4a840"), side: THREE.DoubleSide }));
      ban.position.set(gx * U + (vert ? (g.side === "e" ? -1.33 : 1.33) : 0), gy + 8.0, gyy * U + (vert ? 0 : g.side === "s" ? -1.33 : 1.33)); ban.rotation.y = vert ? (g.side === "e" ? -Math.PI / 2 : Math.PI / 2) : g.side === "s" ? Math.PI : 0; root.add(ban);
    }
  }
  bt.flush(root);
}
function updateCityAnim() {
  for (const s of W3.spinners || []) { if (s.userData.flag) { s.rotation.y = Math.sin(S.time * 1.7 + s.id) * 0.18; continue; } s.rotation.z = -S.time * (s.userData.spin || 0.5); }
  if (W3.clocks && W3.clocks.length) {
    const v = vana(), hr = (v.hour % 12 + v.minute / 60) / 12 * Math.PI * 2, mn = v.minute / 60 * Math.PI * 2;
    for (const h of W3.clocks) h.rotation.z = -(h.userData.clock === "h" ? hr : mn) * (h.userData.face || 1);
  }
}

function buildCityWalls(field, root) {
  const z = field.zone;
  if (!z.cityWalls) return;
  const bricks = texBricks(), roofT = texShingle();
  const stone = std({ map: bricks.map, normalMap: bricks.normalMap, color: 0xd8d0c0, roughness: 0.92 });
  const capMat = std({ color: 0x8a8478, roughness: 0.9 });
  const roofMat = std({ map: roofT.map, normalMap: roofT.normalMap, color: 0x9a5a48, roughness: 0.85 });
  const H = 4.4, parts = [], caps = [], merl = [];
  for (const r of cityWallRects(z)) {
    if (r.tower) continue;
    const horiz = r.w > r.h, len = horiz ? r.w : r.h, th = (horiz ? r.h : r.w) * U, n = Math.max(1, Math.round(len / 140));
    for (let i = 0; i < n; i++) {
      const a = len * i / n, b = len * (i + 1) / n, c = (a + b) / 2, L = (b - a) * U + 0.02;
      const px = horiz ? r.x + c : r.x + r.w / 2, py = horiz ? r.y + r.h / 2 : r.y + c;
      const y0 = Math.min(field.heightAt(horiz ? r.x + a : px, horiz ? py : r.y + a), field.heightAt(horiz ? r.x + b : px, horiz ? py : r.y + b)) - 0.8;
      const g = uvBox(horiz ? L : th, H + 0.8, horiz ? th : L, 2.4);
      g.translate(px * U, y0 + (H + 0.8) / 2, py * U); parts.push(g);
      const cg = new THREE.BoxGeometry(horiz ? L : th + 0.3, 0.22, horiz ? th + 0.3 : L);
      cg.translate(px * U, y0 + H + 0.9, py * U); caps.push(cg);
      const m = Math.max(1, Math.floor(L / 1.5));
      for (let k = 0; k < m; k++) for (const sd of [-1, 1]) {
        const t = (k + 0.5) / m - 0.5, ox = horiz ? t * L : sd * (th / 2 - 0.15), oz = horiz ? sd * (th / 2 - 0.15) : t * L;
        merl.push(mtx(px * U + ox, y0 + H + 1.36, py * U + oz, 1, 1, 1, 0));
      }
    }
  }
  const gates = z.gates || [];
  const bannerGeo = new THREE.PlaneGeometry(1.1, 2.6);
  for (const gt of gates) {
    const gy = field.heightAt(gt.x, gt.y);
    for (const sd of [-1, 1]) {
      const cx = gt.horiz ? gt.x + sd * (GATE_HALF + 18) : gt.x, cy = gt.horiz ? gt.y : gt.y + sd * (GATE_HALF + 18);
      const tg = uvBox(2.4, 8.2, 2.4, 2.4); tg.translate(cx * U, gy - 0.8 + 4.1, cy * U); parts.push(tg);
      const tc = new THREE.BoxGeometry(2.9, 0.3, 2.9); tc.translate(cx * U, gy + 7.45, cy * U); caps.push(tc);
      const rf = new THREE.ConeGeometry(2.3, 2.6, 4, 1); rf.rotateY(Math.PI / 4); rf.translate(cx * U, gy + 8.9, cy * U);
      const rm = new THREE.Mesh(rf, roofMat); rm.castShadow = true; root.add(rm);
      for (const face of [-1, 1]) {
        const dz = districtAt(z, gt.horiz ? gt.x : gt.x + face * 60, gt.horiz ? gt.y + face * 60 : gt.y);
        if (!dz) continue;
        const col = new THREE.Color(dz.color);
        const bm = new THREE.Mesh(bannerGeo, std({ color: col, roughness: 0.95, side: THREE.DoubleSide }));
        const trim = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.18), std({ color: 0xe8c860, metalness: 0.4, roughness: 0.5, side: THREE.DoubleSide }));
        const off = 1.24;
        if (gt.horiz) { bm.position.set(cx * U, gy + 4.4, cy * U + face * off); trim.position.set(cx * U, gy + 5.6, cy * U + face * (off + 0.01)); if (face < 0) { bm.rotation.y = Math.PI; trim.rotation.y = Math.PI; } }
        else { bm.position.set(cx * U + face * off, gy + 4.4, cy * U); trim.position.set(cx * U + face * (off + 0.01), gy + 5.6, cy * U); bm.rotation.y = trim.rotation.y = face * Math.PI / 2; }
        bm.userData.banner = true;
        root.add(bm, trim);
      }
    }
    const span = (GATE_HALF * 2 + 36) * U;
    const lt = uvBox(gt.horiz ? span : 1.9, 1.3, gt.horiz ? 1.9 : span, 2.4); lt.translate(gt.x * U, gy + 5.2, gt.y * U); parts.push(lt);
    const lc = new THREE.BoxGeometry(gt.horiz ? span + 0.3 : 2.2, 0.22, gt.horiz ? 2.2 : span + 0.3); lc.translate(gt.x * U, gy + 5.95, gt.y * U); caps.push(lc);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(GATE_HALF * U, 0.32, 6, 18, Math.PI), stone);
    arch.scale.set(1, 0.5, 2.6); arch.position.set(gt.x * U, gy + 3.2, gt.y * U); if (!gt.horiz) arch.rotation.y = Math.PI / 2;
    arch.castShadow = true; root.add(arch);
  }
  if (parts.length) { const m = new THREE.Mesh(THREE.mergeGeometries(parts), stone); m.castShadow = true; m.receiveShadow = true; root.add(m); }
  if (caps.length) { const m = new THREE.Mesh(THREE.mergeGeometries(caps.map(c => c.toNonIndexed())), capMat); m.castShadow = true; m.receiveShadow = true; root.add(m); }
  if (merl.length) root.add(instanced(new THREE.BoxGeometry(0.62, 0.72, 0.36), stone, merl, true));
}

function buildGlow(field, root) {
  const z = field.zone, rnd = rngFor(z, "glow"), caps = [], gems = [];
  for (let k = 0, tries = 0; k < 160 && tries < 3000; tries++) {
    const px = rnd() * z.w, py = rnd() * z.h;
    if (!placeable(field, px, py, { water: 20, path: 0.5 })) continue;
    const y = field.heightAt(px, py), s = 0.4 + rnd() * 0.9;
    (rnd() < 0.65 ? caps : gems).push(mtx(px * U, y, py * U, s, s * (0.8 + rnd() * 0.6), s, rnd() * 6.28));
    k++;
  }
  const stem = new THREE.CylinderGeometry(0.06, 0.09, 0.5, 6).translate(0, 0.25, 0), cap = new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.6, 1).translate(0, 0.5, 0);
  const capGeo = THREE.mergeGeometries([stem.toNonIndexed(), cap.toNonIndexed()]);
  root.add(tintInst(instanced(capGeo, new THREE.MeshStandardMaterial({ color: 0x80deea, emissive: 0x2ab0c8, emissiveIntensity: 1.3, roughness: 0.6 }), caps, false), rnd, 0.2));
  root.add(instanced(new THREE.OctahedronGeometry(0.25, 0).scale(0.6, 1.6, 0.6).translate(0, 0.35, 0), new THREE.MeshStandardMaterial({ color: 0xb388ff, emissive: 0x7c4dff, emissiveIntensity: 1.2, roughness: 0.3 }), gems, false));
  for (let i = 0; i < 4; i++) { const L = new THREE.PointLight(i % 2 ? 0x80deea : 0xb388ff, 6, 28, 1.6); const px = (i + 0.5) / 4 * z.w, py = z.h * 0.4; L.position.set(px * U, field.heightAt(px, py) + 3, py * U); root.add(L); }
}
function buildCave(field, root) {
  const z = field.zone;
  const torchMat = std({ color: 0x3b2a1a });
  const flameMat = new THREE.MeshBasicMaterial({ color: 0xffa040 });
  (z.torches || []).forEach(([tx, ty], i) => {
    if (z.colliders) z.colliders.push({ x: tx, y: ty, r: 4 });
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.8, 6), torchMat);
    post.position.y = 0.9;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), flameMat);
    flame.position.y = 2.0;
    g.add(post, flame);
    g.position.set(tx * U, field.heightAt(tx, ty), ty * U);
    if (i < (W3.quality === "low" ? 6 : 12)) {
      const L = new THREE.PointLight(0xff9a40, 16, 26, 1.4);
      L.position.y = 2.1;
      L.userData.phase = i * 1.7;
      g.add(L);
      W3.torchLights.push(L);
    }
    g.userData.flame = flame;
    root.add(g);
  });
  const rnd = rngFor(z, "crystals");
  const crystalColors = [0x4dd0e1, 0xb388ff, 0x80cbc4];
  for (let i = 0; i < (themeOf(z) === "crypt" ? 0 : 18); i++) {
    let px, py, tries = 0;
    do { px = field.x0 + rnd() * field.w; py = field.y0 + rnd() * field.h; tries++; } while (tries < 40 && !(field.outsideE(px, py) > -30 && field.outsideE(px, py) < 120));
    const c = crystalColors[i % 3];
    const cm = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.2, roughness: 0.2, metalness: 0.1 });
    const cluster = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.35 + rnd() * 0.25, 1.6 + rnd() * 1.8, 6), cm);
      m.position.set((rnd() - 0.5) * 0.8, 0.7, (rnd() - 0.5) * 0.8);
      m.rotation.set((rnd() - 0.5) * 0.9, rnd() * 6, (rnd() - 0.5) * 0.9);
      cluster.add(m);
    }
    cluster.position.set(px * U, field.heightAt(px, py), py * U);
    if (i < (W3.quality === "low" ? 2 : W3.quality === "high" ? 6 : 4)) { const L = new THREE.PointLight(c, 7, 16, 1.6); L.position.y = 1.6; L.userData.phase = i * 2.3; cluster.add(L); W3.torchLights.push(L); L.userData.crystal = true; }
    root.add(cluster);
  }
}

function buildRuins(field, root) {
  const z = field.zone;
  const R = z.ruins;
  if (!R) return;
  const bricks = texBricks(), rock = texRock();
  const stoneMat = std({ map: bricks.map, normalMap: bricks.normalMap, color: 0xb8b2a4, roughness: 0.95 });
  const mossMat = std({ map: rock.map, normalMap: rock.normalMap, color: 0x8a9a78 });
  const rnd = rngFor(z, "ruins");
  const g = new THREE.Group();
  const rubble = [];
  const groundMin = (pts) => Math.min(...pts.map(([x, y]) => field.heightAt(x, y)));
  for (const [x1, y1, x2, y2, h] of R.walls) {
    const len = Math.hypot(x2 - x1, y2 - y1) + 28;
    const n = Math.max(2, Math.round(len / 45));
    const horiz = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n;
      const ax = x1 + (x2 - x1) * t0, ay = y1 + (y2 - y1) * t0, bx = x1 + (x2 - x1) * t1, by = y1 + (y2 - y1) * t1;
      const cx = (ax + bx) / 2, cy = (ay + by) / 2;
      const base = groundMin([[ax, ay], [bx, by], [cx, cy]]) - 0.35;
      const bh = Math.max(0.5, h * (0.55 + rnd() * 0.55)) + 0.35;
      const seg = len / n * U + 0.02;
      const geo = horiz ? new THREE.BoxGeometry(seg, bh, 1.3) : new THREE.BoxGeometry(1.3, bh, seg);
      const m = new THREE.Mesh(geo, stoneMat);
      m.position.set(cx * U, base + bh / 2, cy * U);
      m.rotation.y = (rnd() - 0.5) * 0.04;
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
      if (rnd() < 0.5) {
        const cap = new THREE.Mesh(horiz ? new THREE.BoxGeometry(seg * 0.6, 0.25, 1.45) : new THREE.BoxGeometry(1.45, 0.25, seg * 0.6), mossMat);
        cap.position.set(cx * U + (rnd() - 0.5) * 0.3, base + bh + 0.08, cy * U + (rnd() - 0.5) * 0.3);
        cap.castShadow = true;
        g.add(cap);
      }
    }
    for (let k = 0; k < 6; k++) {
      const t = rnd(), side = (rnd() - 0.5) * 90;
      const px = x1 + (x2 - x1) * t + (horiz ? 0 : side), py = y1 + (y2 - y1) * t + (horiz ? side : 0);
      const s = 0.25 + rnd() * 0.45;
      rubble.push(mtx(px * U, field.heightAt(px, py) + s * 0.3, py * U, s * 1.4, s, s, rnd() * 6.28, rnd() * 0.5, rnd() * 0.5));
    }
  }
  for (const [x, y, h] of R.pillars) {
    const gy = field.heightAt(x, y) - 0.2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), stoneMat);
    base.position.set(x * U, gy + 0.25, y * U);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, h, 10), stoneMat);
    col.position.set(x * U, gy + 0.5 + h / 2, y * U);
    col.rotation.z = (rnd() - 0.5) * 0.06;
    base.castShadow = col.castShadow = true; base.receiveShadow = col.receiveShadow = true;
    g.add(base, col);
    if (h > 2.5) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 1.4), stoneMat);
      cap.position.set(x * U, gy + 0.5 + h + 0.17, y * U);
      cap.castShadow = true;
      g.add(cap);
    } else {
      const fx = x + 30 + rnd() * 20, fy = y + (rnd() - 0.5) * 40;
      const fallen = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 1.6 + rnd(), 10), stoneMat);
      fallen.rotation.set(0, rnd() * 3, Math.PI / 2);
      fallen.position.set(fx * U, field.heightAt(fx, fy) + 0.35, fy * U);
      fallen.castShadow = true;
      g.add(fallen);
    }
  }
  if (rubble.length) root.add(instanced(new THREE.BoxGeometry(1, 1, 1), stoneMat, rubble, true));
  root.add(g);
}

function buildHouse(field, root) {
  const z = field.zone;
  const planks = texPlanks(), bricks = texBricks();
  const floorMat = std({ map: planks.map, normalMap: planks.normalMap, color: 0xb08a60, roughness: 0.85 });
  const wallMat = std({ map: planks.map, normalMap: planks.normalMap, color: 0xd8c8a8, roughness: 0.9 });
  const stoneMat = std({ map: bricks.map, normalMap: bricks.normalMap, color: 0x9a9088 });
  const beamMat = std({ color: 0x4a3220, roughness: 0.9 });
  const W = z.w * U, H = z.h * U, wallH = 3.4;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W + 2, 0.3, H + 2), floorMat);
  floor.position.set(W / 2, -0.15, H / 2);
  floor.receiveShadow = true;
  root.add(floor);
  const mkWall = (x, zz, len, rot) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(len, wallH, 0.3), wallMat);
    w.position.set(x, wallH / 2 + 0.15, zz);
    w.rotation.y = rot;
    w.receiveShadow = true;
    root.add(w);
    const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.36), stoneMat);
    base.position.set(x, 0.4, zz); base.rotation.y = rot;
    root.add(base);
  };
  mkWall(W / 2, 0, W, 0);
  mkWall(0, H / 2, H, Math.PI / 2);
  mkWall(W, H / 2, H, Math.PI / 2);
  const door = z.exits.find(e => e.kind === "door");
  const dx = door ? (door.x + door.w / 2) * U : W / 2, dw = door ? door.w * U + 0.4 : 2.6;
  mkWall(dx / 2 - dw / 4, H, dx - dw / 2, 0);
  mkWall(dx + dw / 2 + (W - dx - dw / 2) / 2, H, W - dx - dw / 2, 0);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(dw, wallH - 2.3, 0.3), wallMat); lintel.position.set(dx, 2.3 + (wallH - 2.3) / 2 + 0.15, H); root.add(lintel);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.3, 2.5, 0.4), beamMat); frame.position.set(dx, 1.25, H);
  const hole = new THREE.Mesh(new THREE.BoxGeometry(dw - 0.2, 2.3, 0.5), new THREE.MeshBasicMaterial({ color: 0x1a1810 })); hole.position.set(dx, 1.15, H);
  root.add(frame, hole);
  for (const [wx, wz, rot] of [[W * 0.3, 0, 0], [W * 0.7, 0, 0], [0, H * 0.5, Math.PI / 2], [W, H * 0.5, Math.PI / 2]]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.0), new THREE.MeshStandardMaterial({ color: 0x9fc8e8, emissive: 0xfff2d0, emissiveIntensity: 0.6, side: THREE.DoubleSide }));
    win.position.set(wx + (rot ? (wx === 0 ? 0.17 : -0.17) : 0), 2.1, wz + (rot ? 0 : 0.17));
    win.rotation.y = rot;
    root.add(win);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), beamMat);
    sill.position.set(win.position.x, 1.58, win.position.z); sill.rotation.y = rot;
    root.add(sill);
    W3.windowMats.push(win.material);
  }
  const g = z.grid;
  const cw = z.w / g.cols * U, ch = z.h / g.rows * U;
  for (const [c, r] of g.blocked) {
    if (c === 0 || c === 1) continue;
    const mat = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.04, ch), std({ color: 0x8a6a48 }));
    mat.position.set((c + 0.5) * cw, 0.02, (r + 0.5) * ch);
    root.add(mat);
  }
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), std({ color: 0x6a3a3a, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(1.0 * cw, 0.02, 1.0 * ch);
  root.add(rug);
  const amb = new THREE.PointLight(0xffe2b8, 14, 26, 1.2);
  amb.position.set(W / 2, 3.0, H / 2);
  root.add(amb);
  W3.furnRoot = new THREE.Group();
  root.add(W3.furnRoot);
  W3.furnSig = null;
}

function furnitureMesh(f) {
  const it = ITEMS[f.id];
  const m = FURNITURE_MODELS[it.model] || { w: 1, h: 1 };
  const g = new THREE.Group();
  const wood = std({ color: 0x8a5a34, roughness: 0.85 }), dark = std({ color: 0x4a3220, roughness: 0.9 }), cloth = std({ color: 0xc8b090, roughness: 1 });
  const box = (w, h, d, x, y, zz, mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, zz); b.castShadow = true; b.receiveShadow = true; g.add(b); return b; };
  const Wm = m.w * 2, Dm = m.h * 2;
  switch (it.model) {
    case "bed": box(Wm - 0.3, 0.5, Dm - 0.3, 0, 0.35, 0, wood); box(Wm - 0.4, 0.25, Dm - 0.5, 0, 0.72, 0.05, std({ color: 0xe8e0d0 })); box(Wm - 0.5, 0.2, 1.0, 0, 0.9, -Dm / 2 + 0.7, std({ color: 0x8a3a3a })); box(Wm - 0.7, 0.3, 0.7, 0, 0.9, Dm / 2 - 0.6, std({ color: 0xf4f0e8 })); box(Wm - 0.3, 1.4, 0.15, 0, 0.7, -Dm / 2 + 0.15, wood); break;
    case "table": box(Wm - 0.4, 0.12, Dm - 0.4, 0, 1.0, 0, wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.14, 1.0, 0.14, sx * (Wm / 2 - 0.4), 0.5, sz * (Dm / 2 - 0.4), dark); break;
    case "chair": box(0.9, 0.1, 0.9, 0, 0.6, 0, wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.1, 0.6, 0.1, sx * 0.38, 0.3, sz * 0.38, dark); box(0.9, 1.0, 0.1, 0, 1.1, -0.4, wood); break;
    case "chest": box(1.5, 0.8, 1.0, 0, 0.4, 0, wood); box(1.5, 0.3, 1.0, 0, 0.95, 0, dark); box(0.2, 0.25, 0.1, 0, 0.7, 0.52, std({ color: 0xc8a040, metalness: 0.6 })); break;
    case "wardrobe": box(Wm - 0.3, 3.0, 1.2, 0, 1.5, 0, wood); box(0.05, 2.6, 0.05, 0, 1.5, 0.63, dark); for (const sx of [-1, 1]) box(0.08, 0.3, 0.06, sx * 0.25, 1.5, 0.64, std({ color: 0xc8a040, metalness: 0.6 })); break;
    case "bookshelf": box(Wm - 0.3, 2.6, 0.9, 0, 1.3, 0, dark); for (let i = 0; i < 4; i++) { box(Wm - 0.5, 0.06, 0.8, 0, 0.5 + i * 0.6, 0, wood); for (let k = 0; k < 7; k++) box(0.14, 0.4, 0.55, -Wm / 2 + 0.45 + k * 0.42, 0.75 + i * 0.6, 0.05, std({ color: [0x8a3a3a, 0x3a5a8a, 0x5a7a3a, 0xc8a040, 0x6a3a7a][(i + k) % 5] })); } break;
    case "pot": {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.5, 12), std({ color: 0xb0603a })); pot.position.y = 0.25;
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 12), std({ color: 0x3a2a1c })); soil.position.y = 0.5;
      g.add(pot, soil);
      g.userData.pot = true;
      break;
    }
    case "plant": { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 10), std({ color: 0xa0603a })); pot.position.y = 0.22; g.add(pot); for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 5), std({ color: 0x3a8a3a })); const a = i / 7 * Math.PI * 2; leaf.position.set(Math.cos(a) * 0.15, 0.8, Math.sin(a) * 0.15); leaf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); g.add(leaf); } break; }
    case "lamp": { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 2.0, 8), dark); post.position.y = 1.0; const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.5, 12, 1, true), std({ color: 0xe8d8a8, emissive: 0xffd080, emissiveIntensity: 0.6, side: THREE.DoubleSide })); shade.position.y = 2.1; const L = new THREE.PointLight(0xffd8a0, 8, 9, 1.5); L.position.y = 2.0; g.add(post, shade, L); break; }
    case "rug": { const r = new THREE.Mesh(new THREE.CircleGeometry(Math.min(Wm, Dm) / 2 - 0.1, 28), std({ color: 0x8a4a4a, roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; const ring = new THREE.Mesh(new THREE.RingGeometry(Math.min(Wm, Dm) / 2 - 0.4, Math.min(Wm, Dm) / 2 - 0.25, 28), std({ color: 0xd8b060, roughness: 1 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.025; g.add(r, ring); break; }
    case "hearth": { box(Wm - 0.2, 2.2, 1.0, 0, 1.1, -0.1, std({ color: 0x6a6460 })); box(Wm - 0.2, 0.3, 1.3, 0, 2.35, 0, std({ color: 0x4a4440 })); const fire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.8, 8), new THREE.MeshBasicMaterial({ color: 0xffa040 })); fire.position.set(0, 0.6, 0.25); const L = new THREE.PointLight(0xff9040, 12, 12, 1.4); L.position.set(0, 0.9, 0.6); g.add(fire, L); g.userData.flame = fire; break; }
    case "totem": { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.8, 7), std({ color: 0x6a5a34 })); t.position.y = 0.9; const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.2), std({ color: 0xff3030, emissive: 0xff3030, emissiveIntensity: 0.6 })); eyes.position.set(0, 1.3, 0.3); g.add(t, eyes); break; }
    default: box(Wm - 0.3, 0.8, Dm - 0.3, 0, 0.4, 0, wood);
  }
  return g;
}

function syncFurniture() {
  if (!W3.furnRoot || S.zoneId !== "residence") return;
  const sig = JSON.stringify(save.furniture) + JSON.stringify(save.gardens);
  if (sig !== W3.furnSig) {
    W3.furnSig = sig;
    disposeTree(W3.furnRoot);
    while (W3.furnRoot.children.length) W3.furnRoot.remove(W3.furnRoot.children[0]);
    const g = ZONES.residence.grid;
    const cw = ZONES.residence.w / g.cols * U, ch = ZONES.residence.h / g.rows * U;
    save.furniture.forEach((f, i) => {
      const { w, h } = furnFoot(f.id, f.rot || 0);
      const m = furnitureMesh(f);
      const gd = ITEMS[f.id].garden ? save.gardens[i] : null;
      if (gd) {
        const st = gd.stage, gr = ITEMS[gd.seed].grows;
        const col = gr.crystal ? 0x9ccc65 : gd.seed === "ash_sapling" ? 0x4a7a3a : gd.seed === "moonbloom_seeds" ? 0x9fa8da : 0x5a9a3a;
        if (st >= 1) for (let k = 0; k < 2 + st * 2; k++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06 + st * 0.02, 0.3 + st * 0.25, 5), std({ color: col })); const a = k / (2 + st * 2) * Math.PI * 2; leaf.position.set(Math.cos(a) * 0.12 * st, 0.55 + (0.15 + st * 0.12), Math.sin(a) * 0.12 * st); leaf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); m.add(leaf); }
        else { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.18, 4), std({ color: 0x8bc34a })); sp.position.y = 0.6; m.add(sp); }
        if (st >= 3) for (let k = 0; k < 3; k++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), std({ color: gd.seed === "moonbloom_seeds" ? 0xe3f2fd : gr.crystal ? 0xffd54f : 0xff8a65, emissive: 0x442200, emissiveIntensity: 0.4 })); fl.position.set(Math.cos(k * 2.1) * 0.2, 1.25, Math.sin(k * 2.1) * 0.2); m.add(fl); }
        if (gd.crystal) { const L = new THREE.PointLight(new THREE.Color(ELEMENT_COLORS[gd.crystal] || "#fff"), 2, 3, 2); L.position.y = 0.9; m.add(L); }
        if (st < 3 && !gd.watered) { const dry = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.4, 16), new THREE.MeshBasicMaterial({ color: 0x81d4fa, transparent: true, opacity: 0.5, side: THREE.DoubleSide })); dry.rotation.x = -Math.PI / 2; dry.position.y = 0.56; m.add(dry); }
      }
      m.position.set((f.c + w / 2) * cw, 0, (f.r + h / 2) * ch);
      m.rotation.y = -(f.rot || 0) * Math.PI / 2;
      W3.furnRoot.add(m);
    });
  }
  for (const m of W3.furnRoot.children) if (m.userData.flame) { const k = 0.9 + Math.sin(S.time * 11) * 0.12; m.userData.flame.scale.set(k, 1 + Math.sin(S.time * 7) * 0.15, k); }
}

function buildCrypt(field, root) {
  const z = field.zone;
  const bricks = texBricks();
  const stoneMat = std({ map: bricks.map, normalMap: bricks.normalMap, color: 0x8a8894, roughness: 0.95 });
  const darkMat = std({ map: bricks.map, normalMap: bricks.normalMap, color: 0x3a3842, roughness: 0.9 });
  const rnd = rngFor(z, "crypt");
  for (const [x, y] of z.pillars || []) {
    const gy = field.heightAt(x, y) - 0.2;
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.6), stoneMat);
    base.position.set(x * U, gy + 0.25, y * U);
    const h = 5.5 + rnd() * 1.5;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, h, 10), stoneMat);
    col.position.set(x * U, gy + 0.5 + h / 2, y * U);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 1.5), stoneMat);
    cap.position.set(x * U, gy + 0.5 + h + 0.2, y * U);
    base.castShadow = col.castShadow = cap.castShadow = true; base.receiveShadow = col.receiveShadow = true;
    root.add(base, col, cap);
  }
  W3.barrierMeshes = {};
  for (const b of z.barriers || []) {
    const g = new THREE.Group();
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const gy = field.heightAt(cx, cy) - 0.3;
    const horiz = b.w >= b.h;
    const span = (horiz ? b.w : b.h) * U, thick = (horiz ? b.h : b.w) * U;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(thick, 5.2, span + 1.2), darkMat);
    frame.position.y = 2.6;
    const hole = new THREE.Mesh(new THREE.BoxGeometry(thick + 0.1, 4.4, span - 0.4), new THREE.MeshBasicMaterial({ color: 0x05050a }));
    hole.position.y = 2.2;
    g.add(frame, hole);
    const barsG = new THREE.Group();
    const bars = Math.round(span / 0.6);
    for (let i = 0; i <= bars; i++) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 4.4, 6), std({ color: 0x6a6a72, metalness: 0.7, roughness: 0.5 }));
      bar.position.set(0, 2.2, -span / 2 + 0.2 + i * (span - 0.4) / bars);
      bar.castShadow = true;
      barsG.add(bar);
    }
    for (const yy of [1.0, 2.2, 3.4]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, span - 0.4), std({ color: 0x5a5a62, metalness: 0.7, roughness: 0.5 })); rail.position.y = yy; barsG.add(rail); }
    g.add(barsG);
    g.position.set(cx * U, gy, cy * U);
    if (horiz) g.rotation.y = Math.PI / 2;
    root.add(g);
    W3.barrierMeshes[b.id] = { group: g, bars: barsG, open: null };
  }
  for (const n of z.npcs) {
    if (!NPCS[n.id] || NPCS[n.id].prop !== "throne") continue;
    const gy = field.heightAt(n.x, n.y) - 0.1;
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) { const step = new THREE.Mesh(new THREE.BoxGeometry(6 - i * 1.4, 0.3, 4 - i * 0.8), stoneMat); step.position.y = 0.15 + i * 0.3; step.receiveShadow = true; g.add(step); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.2), darkMat); seat.position.set(0, 1.25, 0.2);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.0, 0.35), darkMat); back.position.set(0, 2.4, -0.45);
    for (const sgn of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 1.1), darkMat); arm.position.set(sgn * 0.68, 1.5, 0.15); g.add(arm); }
    for (const sgn of [-1, 1]) { const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 6), std({ color: 0xc8a040, metalness: 0.6, roughness: 0.4 })); spike.position.set(sgn * 0.5, 4.3, -0.45); g.add(spike); }
    seat.castShadow = back.castShadow = true;
    g.add(seat, back);
    g.position.set(n.x * U, gy, n.y * U);
    g.rotation.y = Math.PI / 2;
    root.add(g);
  }
}

function syncBarriers() {
  if (!W3.barrierMeshes || !S.zone.barriers) return;
  for (const b of S.zone.barriers) {
    const m = W3.barrierMeshes[b.id];
    if (!m) continue;
    const open = barrierOpen(b);
    if (m.open === null) { m.open = open; m.bars.position.y = open ? 4.6 : 0; continue; }
    if (open !== m.open) { m.open = open; if (open && typeof sfx === "function") sfx("unlock"); }
    const ty = m.open ? 4.6 : 0;
    m.bars.position.y += (ty - m.bars.position.y) * 0.04;
  }
}

function buildExits(field, root) {
  return;
  const z = field.zone;
  const planks = texPlanks();
  const rock = themeOf(z) === "cave" || themeOf(z) === "crypt" ? texCaveRock() : texRock();
  const woodMat = std({ map: planks.map, normalMap: planks.normalMap });
  const rockMat = std({ map: rock.map, normalMap: rock.normalMap });
  for (const ex of z.exits) {
    if (ex.kind === "door") continue;
    const cx = ex.x + ex.w / 2, cy = ex.y + ex.h / 2;
    const horiz = ex.x <= 0 || ex.x + ex.w >= z.w;
    const g = new THREE.Group();
    const span = 4.6;
    const mat = themeOf(z) === "cave" || themeOf(z) === "crypt" ? rockMat : woodMat;
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 0.5), mat);
      p.position.set(0, 2.1, s * span / 2);
      p.castShadow = true;
      g.add(p);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, span + 1.2), mat);
    top.position.y = 4.3;
    top.castShadow = true;
    g.add(top);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(span, 3.8), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
    glow.position.y = 2;
    glow.rotation.y = Math.PI / 2;
    g.add(glow);
    g.position.set(cx * U, field.heightAt(cx, cy), cy * U);
    if (!horiz) g.rotation.y = Math.PI / 2;
    root.add(g);
  }
}

function buildWater(field, root) {
  const z = field.zone;
  if (!z.water || !z.water.length) { W3.water = null; W3.waterFx = []; return; }
  const geos = z.water.map(w => {
    const g = new THREE.CircleGeometry((w.r + 26) * U, 64);
    g.translate(w.x * U, -w.y * U, 0);
    return g;
  });
  const geo = THREE.mergeGeometries(geos);
  const normals = texWaterNormals();
  const cave = themeOf(z) === "cave" || themeOf(z) === "crypt";
  let water;
  if (z.palette === "volcanic") {
    const nm = normals.clone();
    nm.needsUpdate = true;
    nm.repeat.set(3, 3);
    water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff3a08, emissiveIntensity: 1.5, roughness: 0.75, metalness: 0, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6) }));
    water.userData.lowNormal = nm;
  } else if (z.palette === "snow") {
    const nm = normals.clone();
    nm.needsUpdate = true;
    nm.repeat.set(2, 2);
    water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xd4eaf4, roughness: 0.12, metalness: 0.15, normalMap: nm, normalScale: new THREE.Vector2(0.25, 0.25) }));
  } else if (W3.quality === "low") {
    const nm = normals.clone();
    nm.needsUpdate = true;
    nm.repeat.set(4, 4);
    water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cave ? 0x0c2228 : 0x1d4c5a, roughness: 0.08, metalness: 0.2, normalMap: nm, transparent: true, opacity: 0.88 }));
    water.userData.lowNormal = nm;
  } else {
    const res = W3.quality === "high" ? 512 : 256;
    water = new THREE.Water(geo, {
      textureWidth: res, textureHeight: res, waterNormals: normals, sunDirection: new THREE.Vector3(0.7, 0.7, 0), sunColor: 0xffffff,
      waterColor: cave ? 0x0a2228 : 0x1e5a68, distortionScale: 1.6, fog: true, alpha: 0.92
    });
    water.material.uniforms.size.value = 3.5;
  }
  water.rotation.x = -Math.PI / 2;
  water.position.y = field.waterLevel;
  water.receiveShadow = false;
  water.renderOrder = 1;
  root.add(water);
  W3.water = water;
  W3.waterFx = [];
  if (z.palette === "snow") return;
  const foamT = foamTex();
  for (const wt of z.water) {
    const r0 = (wt.r + 26) * U;
    const rg = new THREE.RingGeometry(r0 - 1.6, r0 + 0.4, 72, 1);
    const fm = new THREE.MeshBasicMaterial({ map: foamT.clone(), transparent: true, depthWrite: false, opacity: cave ? 0.3 : 0.7, fog: true, side: THREE.DoubleSide });
    fm.map.needsUpdate = true; fm.map.repeat.set(10, 1);
    const ring = new THREE.Mesh(rg, fm);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(wt.x * U, field.waterLevel + 0.03, wt.y * U);
    ring.renderOrder = 2;
    root.add(ring);
    W3.waterFx.push({ kind: "foam", m: ring, ph: Math.random() * 6 });
    const rip = [];
    for (let i = 0; i < (W3.quality === "low" ? 2 : 4); i++) {
      const pm = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0, depthWrite: false, fog: true, side: THREE.DoubleSide }));
      pm.rotation.x = -Math.PI / 2;
      pm.renderOrder = 2;
      root.add(pm);
      rip.push({ m: pm, t: Math.random() * 3, cx: wt.x, cy: wt.y, r: wt.r * 0.8 });
    }
    W3.waterFx.push({ kind: "ripples", list: rip, lvl: field.waterLevel });
    const edge = Math.min(wt.x, wt.y, z.w - wt.x, z.h - wt.y);
    if (!cave && edge < wt.r + 420 && themeOf(z) === "field") {
      const sides = [[wt.x, 0, 0, -1], [wt.y, 1, 0, -1], [z.w - wt.x, 0, 1, 1], [z.h - wt.y, 1, 1, 1]].sort((a, b) => a[0] - b[0])[0];
      const dirX = sides[1] === 0 ? sides[3] : 0, dirY = sides[1] === 1 ? sides[3] : 0;
      const fx = wt.x + dirX * (wt.r + 10), fy = wt.y + dirY * (wt.r + 10);
      const top = field.heightAt(fx + dirX * 40, fy + dirY * 40), base = field.waterLevel;
      const midH = field.heightAt(fx + dirX * 22, fy + dirY * 22);
      let nearExit = false;
      for (const ex of z.exits || []) if (Math.hypot(fx - (ex.x + ex.w / 2), fy - (ex.y + ex.h / 2)) < 420) nearExit = true;
      for (let k = 0; k <= 160; k += 20) if (field.exitMask(fx + dirX * k, fy + dirY * k) > 0.05) nearExit = true;
      if (top - base > 2.5 && midH - base > (top - base) * 0.45 && !nearExit) {
        const hgt = top - base + 0.5, wid = 5;
        const ft = fallTex();
        const fg = new THREE.PlaneGeometry(wid, hgt, 1, 6);
        const pa = fg.attributes.position;
        for (let i = 0; i < pa.count; i++) { const yy = pa.getY(i) / hgt + 0.5; pa.setZ(i, -Math.pow(1 - yy, 2) * 1.8); }
        const fmat = new THREE.MeshBasicMaterial({ map: ft, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide, fog: true });
        const fall = new THREE.Mesh(fg, fmat);
        fall.position.set((fx + dirX * 16) * U, base + hgt / 2 - 0.2, (fy + dirY * 16) * U);
        fall.rotation.y = Math.atan2(dirX, dirY);
        fall.renderOrder = 3;
        root.add(fall);
        const mist = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
        mist.scale.set(9, 4, 1);
        mist.position.set(fx * U, base + 1.2, fy * U);
        root.add(mist);
        W3.waterFx.push({ kind: "fall", tex: ft, mist });
      }
    }
  }
}

function foamTex() {
  if (TEXLIB.cache.foam) return TEXLIB.cache.foam;
  const c = document.createElement("canvas"); c.width = 256; c.height = 32;
  const g = c.getContext("2d");
  for (let x = 0; x < 256; x++) for (let y = 0; y < 32; y++) {
    const n = NOISE.fbm(x / 256 * 16, y / 32 * 2, 3, 16, 77);
    const a = Math.max(0, (y / 32) * 1.2 - 0.15) * sstep(0.35, 0.7, n + y / 64);
    g.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")"; g.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  TEXLIB.cache.foam = t;
  return t;
}
function fallTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d");
  for (let x = 0; x < 64; x++) for (let y = 0; y < 256; y++) {
    const n = NOISE.fbm(x / 64 * 6, y / 256 * 2, 3, 6, 91);
    const edge = sstep(0, 10, x) * sstep(64, 54, x);
    const a = (0.35 + n * 0.6) * edge;
    const v = 200 + n * 55;
    g.fillStyle = "rgba(" + (v * 0.85 | 0) + "," + (v * 0.95 | 0) + "," + (v | 0) + "," + a.toFixed(3) + ")"; g.fillRect(x, y, 1, 1);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function updateWaterFx(dt) {
  for (const f of W3.waterFx || []) {
    if (f.kind === "foam") { f.m.material.map.offset.x += dt * 0.01; f.m.material.opacity = (f.m.material.userData.base || (f.m.material.userData.base = f.m.material.opacity)) * (0.75 + 0.25 * Math.sin(S.time * 0.8 + f.ph)); }
    else if (f.kind === "fall") { f.tex.offset.y += dt * 0.9; f.mist.material.opacity = 0.28 + Math.sin(S.time * 2) * 0.06; }
    else if (f.kind === "ripples") for (const r of f.list) {
      r.t += dt;
      if (r.t > 3.2) { r.t = 0; const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * r.r; r.m.position.set((r.cx + Math.cos(a) * d) * U, f.lvl + 0.04, (r.cy + Math.sin(a) * d) * U); }
      const k = r.t / 3.2, sc = 0.3 + k * 2.4;
      r.m.scale.set(sc, sc, sc);
      r.m.material.opacity = (1 - k) * 0.45;
    }
  }
}

function makeStars() {
  const n = 1800;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const r = seeded(77);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, th = r() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const y = Math.abs(u);
    pos[i * 3] = s * Math.cos(th) * 900; pos[i * 3 + 1] = y * 900; pos[i * 3 + 2] = s * Math.sin(th) * 900;
    const t = 0.7 + r() * 0.3;
    col[i * 3] = t; col[i * 3 + 1] = t; col[i * 3 + 2] = t + r() * 0.1;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false });
  return new THREE.Points(g, m);
}

function classicWorldChunk() {
  if (THREE.ShaderChunk.opaque_fragment.indexOf("clWorld") >= 0) return;
  THREE.ShaderChunk.opaque_fragment = "#ifdef STANDARD\n{ float clWorld = 1.0; if (diffuseColor.a > 0.98) { float dl = max(dot(diffuseColor.rgb, vec3(0.3333)), 0.04); float ll = dot(outgoingLight, vec3(0.3333)); float r = ll / dl; if (r > 0.2) { float qn = floor(r * 4.0 + 0.5) / 4.0; float rr = mix(r, qn, 0.45); outgoingLight *= rr / max(r, 0.001); } } }\n#endif\n" + THREE.ShaderChunk.opaque_fragment;
}
function initRenderer() {
  classicWorldChunk();
  const canvas = $("game");
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const saved = loadSettings();
  const lowMem = (navigator.deviceMemory && navigator.deviceMemory < 4) || (coarse && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  W3.quality = saved.quality || (lowMem ? "low" : coarse || window.innerWidth < 700 ? "medium" : "high");
  const r = new THREE.WebGLRenderer({ canvas, antialias: W3.quality !== "low", powerPreference: "high-performance" });
  W3.prCap = Math.min(window.devicePixelRatio || 1, W3.quality === "high" ? 2 : W3.quality === "medium" ? 1.5 : 1);
  W3.pr = W3.prCap;
  r.setPixelRatio(W3.pr);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.85;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = W3.quality !== "low";
  r.shadowMap.type = W3.quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  W3.renderer = r;
  TEXLIB.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
  W3.scene = new THREE.Scene();
  W3.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1600);
  W3.pmrem = new THREE.PMREMGenerator(r);
  const sky = new THREE.Sky();
  sky.scale.setScalar(1400);
  const su = sky.material.uniforms;
  su.turbidity.value = 4.5; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.005; su.mieDirectionalG.value = 0.82;
  W3.sky = sky;
  W3.scene.add(sky);
  W3.skyScene = new THREE.Scene();
  W3.skyEnv = new THREE.Sky();
  W3.skyEnv.scale.setScalar(1000);
  Object.assign(W3.skyEnv.material.uniforms.turbidity, { value: 4.5 });
  W3.skyScene.add(W3.skyEnv);
  W3.stars = makeStars();
  W3.scene.add(W3.stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xdfe8ff, transparent: true, depthWrite: false, fog: false }));
  moon.scale.setScalar(110);
  W3.moon = moon;
  W3.scene.add(moon);
  const cloudGeo = new THREE.PlaneGeometry(2600, 2600);
  cloudGeo.rotateX(Math.PI / 2);
  const ct = texClouds();
  ct.repeat.set(3, 3);
  W3.clouds = new THREE.Mesh(cloudGeo, new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.8, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  W3.clouds.position.y = 260;
  W3.scene.add(W3.clouds);
  const ct2 = texClouds();
  ct2.repeat.set(1.6, 1.6);
  W3.clouds2 = new THREE.Mesh(cloudGeo.clone(), new THREE.MeshBasicMaterial({ map: ct2, transparent: true, opacity: 0.45, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  W3.clouds2.position.y = 360;
  W3.clouds2.scale.setScalar(1.3);
  W3.scene.add(W3.clouds2);
  W3.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: 0xfff0d0, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  W3.sunGlow.scale.setScalar(220);
  W3.scene.add(W3.sunGlow);
  W3.sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex(), color: 0xfff4d8, transparent: true, depthWrite: false, fog: false }));
  W3.sunDisc.scale.setScalar(48);
  W3.scene.add(W3.sunDisc);
  W3.moonDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex(0.5), transparent: true, depthWrite: false, fog: false }));
  W3.moonDisc.scale.setScalar(50);
  W3.scene.add(W3.moonDisc);
  const hz = new THREE.CylinderGeometry(1150, 1150, 400, 48, 1, true);
  W3.haze = new THREE.Mesh(hz, new THREE.MeshBasicMaterial({ map: hazeTex(), transparent: true, depthWrite: false, fog: false, side: THREE.BackSide }));
  W3.haze.renderOrder = -1;
  W3.scene.add(W3.haze);
  W3.sun = new THREE.DirectionalLight(0xffffff, 3);
  W3.sun.castShadow = W3.quality !== "low";
  const ss = W3.quality === "high" ? 2048 : 1024;
  W3.sun.shadow.mapSize.set(ss, ss);
  const sc = W3.sun.shadow.camera;
  sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 220;
  W3.sun.shadow.bias = -0.0004;
  W3.sun.shadow.normalBias = 0.03;
  W3.sun.shadow.radius = 3;
  W3.scene.add(W3.sun, W3.sun.target);
  W3.hemi = new THREE.HemisphereLight(0xbfd8ff, 0x4a4030, 0.6);
  W3.scene.add(W3.hemi);
  W3.playerLight = new THREE.PointLight(0xffd8a8, 0, 16, 1.6);
  W3.scene.add(W3.playerLight);
  W3.fog = new THREE.Fog(0x9fb8d0, 60, 380);
  W3.scene.fog = W3.fog;
  W3.fxRoot = new THREE.Group();
  W3.scene.add(W3.fxRoot);
  if (W3.quality === "high") {
    const rt = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType, samples: r.capabilities.isWebGL2 === false ? 0 : 4 });
    const comp = new THREE.EffectComposer(r, rt);
    comp.addPass(new THREE.RenderPass(W3.scene, W3.camera));
    comp.addPass(new THREE.OutputPass());
    W3.grade = new THREE.ShaderPass(GRADE_SHADER);
    comp.addPass(W3.grade);
    W3.composer = comp;
  }
  resizeRenderer();
  window.addEventListener("resize", resizeRenderer);
}

const GRADE_SHADER = {
  uniforms: { tDiffuse: { value: null }, sat: { value: 1.08 }, con: { value: 1.05 }, tint: { value: new THREE.Vector3(1, 1, 1) }, vig: { value: 0.22 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform sampler2D tDiffuse; uniform float sat; uniform float con; uniform vec3 tint; uniform float vig; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb * tint; float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, sat); col = (col - 0.5) * con + 0.5; vec2 d = vUv - 0.5; col *= 1.0 - vig * smoothstep(0.25, 0.75, length(d) * 1.2); gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a); }"
};

function gradeTick(dayAmt, golden, gloom, cave) {
  if (!W3.grade) return;
  const u = W3.grade.uniforms;
  u.tint.value.set(1 + golden * 0.06 - (1 - dayAmt) * 0.04, 1 + golden * 0.01 - (1 - dayAmt) * 0.01, 1 - golden * 0.06 + (1 - dayAmt) * 0.06);
  u.sat.value = (cave ? 0.95 : 1.1 - gloom * 0.25 - (1 - dayAmt) * 0.12) + 0.1;
  u.con.value = 1.05 + golden * 0.03;
  u.vig.value = cave ? 0.35 : 0.2 + (1 - dayAmt) * 0.1;
}

function autoQuality(P) {
  if (P.fps >= 24 || W3.pr > 0.61) { P.slow = 0; return; }
  P.slow = (P.slow || 0) + 1;
  if (P.slow < 12) return;
  P.slow = 0;
  if (W3.composer) { W3.composer = null; W3.grade = null; if (typeof toast === "function") toast("⚙️", "Graphics", "Colour grading turned off to keep the game smooth. Pick Low in Settings for older devices."); return; }
  if (W3.sun.castShadow) { W3.sun.castShadow = false; if (typeof toast === "function") toast("⚙️", "Graphics", "Sun shadows turned off to keep the game smooth."); }
}

function resizeRenderer() {
  const c = $("game");
  const w = c.clientWidth || 800, h = c.clientHeight || 500;
  W3.renderer.setSize(w, h, false);
  W3.camera.aspect = w / h;
  W3.camera.updateProjectionMatrix();
  if (W3.composer) W3.composer.setSize(w, h);
}

function disposeTree(o) {
  o.traverse(c => {
    if (c.geometry) c.geometry.dispose();
    if (c.material) {
      const ms = Array.isArray(c.material) ? c.material : [c.material];
      for (const m of ms) {
        if (m.map && m.map.userData && m.map.userData.zone) m.map.dispose();
        m.dispose();
      }
    }
  });
}

function buildZone3D() { runSteps(buildZone3DSteps()); }

function* buildZone3DSteps() {
  const z = S.zone;
  if (W3.zoneRoot) { W3.scene.remove(W3.zoneRoot); disposeTree(W3.zoneRoot); }
  W3.grassMats = []; W3.torchLights = []; W3.windowMats = []; W3.lampLights = []; W3.lampGlows = []; W3.spinners = []; W3.clocks = [];
  const root = new THREE.Group();
  W3.zoneRoot = root;
  const field = yield* scaleSteps(buildFieldSteps(z), 0, 0.3, "Shaping the land…");
  W3.field = field;
  const terrain = yield* scaleSteps(buildTerrainSteps(field), 0.3, 0.75, "Painting the ground…");
  terrain.material.map.userData.zone = true;
  root.add(terrain);
  if (themeOf(z) === "house") terrain.visible = false;
  W3.terrain = terrain;
  yield { p: 0.78, t: "Growing trees and grass…" };
  buildVegetation(field, root);
  buildCliffs(field, root);
  buildPathEdges(field, root);
  buildProps(field, root);
  yield { p: 0.88, t: "Raising buildings…" };
  if (themeOf(z) === "town") { buildTown(field, root); buildCityWalls(field, root); buildCityBuildings(field, root); }
  if (themeOf(z) === "cave" || themeOf(z) === "crypt") buildCave(field, root);
  if (themeOf(z) === "crypt") buildCrypt(field, root);
  buildDungeon(field, root);
  if (z.glow) buildGlow(field, root);
  if (themeOf(z) === "house") buildHouse(field, root);
  buildRuins(field, root);
  buildExits(field, root);
  buildWater(field, root);
  buildBackdrop(field, root);
  buildExitBackdrops(field, root);
  yield { p: 0.94, t: "Filling the water…" };
  W3.scene.add(root);
  W3.lastSunY = -9;
  W3.envTimer = 0;
  updateSky(true);
}

const BACKDROP = {
  outpost: { h: [22, 48, 85], col: [0x5a6a48, 0x6a7a68, 0x8090a0], mark: "tower" },
  hollow: { h: [30, 60, 110], col: [0x4a5a3a, 0x60705a, 0x8a96a4], mark: "tree" },
  frost: { h: [55, 110, 190], col: [0x8a9aa8, 0xb8c8d4, 0xe4eef6], snow: true, mark: "peak" },
  marsh: { h: [14, 30, 60], col: [0x3a4a34, 0x4a5a48, 0x6a7a70], mark: "tree" },
  harbor: { h: [16, 34, 70], col: [0x5a6a50, 0x6a7a74, 0x8a9aaa], sea: true, mark: "light" },
  highlands: { h: [30, 70, 140], col: [0x6a7a50, 0x7a8a70, 0x9aa8b0], mark: "tower" },
  gullisle: { h: [8, 20, 50], col: [0x5a6a50, 0x6a7a74, 0x8a9aaa], sea: true, mark: "light" },
  cinder: { h: [60, 130, 230], col: [0x3a2a26, 0x5a443e, 0x8a7a74], mark: "peak" },
  verdant: { h: [40, 80, 140], col: [0x2e5a2a, 0x4a7050, 0x7a9488], mark: "tree" },
  sunscar: { h: [40, 85, 150], col: [0x9a6a48, 0xb48a68, 0xd8b896], mark: "peak" },
  ironvale: { h: [60, 120, 210], col: [0x7a8a96, 0xa8b8c4, 0xe0eaf2], snow: true, mark: "peak" }
};
const EXIT_TEX = {};
function exitRidgeTex(destZone) {
  const key = destZone.palette || destZone.theme || "field";
  if (EXIT_TEX[key]) return EXIT_TEX[key];
  const th = TERRAIN_THEMES[key] || TERRAIN_THEMES.field, W = 512, H = 128;
  const cv = makeCanvas(W, H), g = cv.getContext("2d");
  const haze = [200, 212, 224];
  const layers = [{ base: 0.55, amp: 0.34, mix: 0.62, col: th.cliff }, { base: 0.4, amp: 0.34, mix: 0.42, col: th.grassA }, { base: 0.22, amp: 0.3, mix: 0.2, col: th.grassB }];
  const seed = hashStr("exit" + key);
  layers.forEach((L, li) => {
    const c = L.col.map((v, i) => Math.round(v * (1 - L.mix) + haze[i] * L.mix));
    g.fillStyle = "rgb(" + c.join(",") + ")";
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const n = NOISE.fbm(x / W * 5 + li * 7, li * 3.1, 3, 0, seed % 997);
      g.lineTo(x, H * (1 - L.base - (n - 0.5) * L.amp * 2));
    }
    g.lineTo(W, H); g.closePath(); g.fill();
  });
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "rgba(255,255,255,0)"); grad.addColorStop(1, "rgba(255,255,255,0)");
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  EXIT_TEX[key] = t;
  return t;
}
function buildExitBackdrops(field, root) {
  const z = field.zone;
  W3.hazeY = null;
  if (z.indoor || themeOf(z) === "house") return;
  W3.exitPanels = [];
  const hs = [];
  for (const ex of z.exits || []) if (exitEdgeAngle(ex, z) != null) hs.push(field.heightAt(ex.x + ex.w / 2, ex.y + ex.h / 2));
  W3.hazeY = hs.length ? Math.min(...hs) : null;
  if (!CONFIG.exitPanels) return;
  for (const ex of z.exits || []) {
    const a = typeof exitEdgeAngle === "function" ? exitEdgeAngle(ex, z) : null;
    const dest = ZONES[ex.to];
    if (a == null || !dest) continue;
    const dx = Math.cos(a), dy = Math.sin(a);
    const cx = ex.x + ex.w / 2, cy = ex.y + ex.h / 2;
    const px = cx + dx * 1500, py = cy + dy * 1500;
    const tex = exitRidgeTex(dest);
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(520, 150), m);
    const gy = field.heightAt(cx + dx * 600, cy + dy * 600);
    mesh.position.set(px * U, gy + 36, py * U);
    mesh.rotation.y = Math.atan2(-dx, -dy);
    mesh.renderOrder = -1;
    mesh.name = "exitPanel";
    root.add(mesh);
  }
}

function buildBackdrop(field, root) {
  const th = themeOf(S.zone), B = zkey(BACKDROP, S.zoneId) || (th === "field" ? BACKDROP.hollow : null);
  W3.backdrop = []; W3.beacon = null;
  if (!B || th === "cave" || th === "crypt" || th === "house" || S.zone.island) return;
  const cx = (field.x0 + field.w / 2) * U, cz = (field.y0 + field.h / 2) * U, half = Math.hypot(field.w, field.h) * U / 2;
  const radii = [half + 70, half + 190, half + 380], seed = hashStr(S.zoneId + "bd");
  let es = 0, en = 0;
  for (let i = 0; i < field.cols; i++) { es += field.data[i] + field.data[(field.rows - 1) * field.cols + i]; en += 2; }
  for (let j = 0; j < field.rows; j++) { es += field.data[j * field.cols] + field.data[j * field.cols + field.cols - 1]; en += 2; }
  const lowY = es / en - 6;
  let topY = -1e9; for (const v of field.data) if (v > topY) topY = v;
  for (let L = 0; L < 3; L++) {
    const N = 384, R = radii[L], pos = [], idx = [], col = [];

    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2;
      let h = B.h[L] * (0.3 + 0.5 * NOISE.fbm(Math.cos(a) * 3 + L * 7, Math.sin(a) * 3 + seed % 97, 4, 0, seed + L) + 0.35 * NOISE.ridge(Math.cos(a) * 11 + L * 5, Math.sin(a) * 11 + seed % 89, 4, 0, seed + L + 9));
      h += Math.max(0, topY - lowY) * (R / half) * 0.9;
      if (B.sea && Math.sin(a + seed) > 0.55) h *= 0.18;
      const x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
      pos.push(x, lowY - 400, z, x, lowY + h, z);
      const tk = B.snow && h > B.h[L] * 0.62 ? 1 : 0.88;
      col.push(0.74, 0.74, 0.74, tk, tk, tk);
      if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: B.col[L], vertexColors: true, fog: false, side: THREE.DoubleSide }));
    m.renderOrder = -2 + L;
    m.frustumCulled = false;
    m.userData.layer = L;
    root.add(m);
    W3.backdrop.push(m);
  }
  if (B.mark) {
    const a = (seed % 360) / 180 * Math.PI, R = radii[1] - 6, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R, y = lowY + B.h[1] * 0.6 + Math.max(0, topY - lowY) * (R / half) * 0.9;
    const grp = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: B.col[1], fog: false });
    const add = (geo, px, py, pz) => { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); grp.add(o); };
    if (B.mark === "tower") { add(new THREE.CylinderGeometry(4, 6, 60, 10), 0, 30, 0); add(new THREE.ConeGeometry(7, 18, 10), 0, 69, 0); }
    else if (B.mark === "tree") { add(new THREE.CylinderGeometry(4, 8, 70, 10), 0, 35, 0); add(new THREE.SphereGeometry(34, 12, 8), 0, 85, 0); add(new THREE.SphereGeometry(24, 10, 7), 22, 70, 8); add(new THREE.SphereGeometry(22, 10, 7), -20, 74, -6); }
    else if (B.mark === "peak") { add(new THREE.ConeGeometry(45, 170, 7), 0, 85, 0); }
    else if (B.mark === "light") { add(new THREE.CylinderGeometry(3, 5, 40, 10), 0, 20, 0); const lamp = new THREE.Mesh(new THREE.SphereGeometry(3.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffe8a0, fog: false })); lamp.position.set(0, 43, 0); grp.add(lamp); W3.beacon = lamp; }
    grp.position.set(x, y, z);
    grp.userData.layer = 1;
    grp.userData.mark = true;
    root.add(grp);
    W3.backdrop.push(grp);
  }
}
function updateBackdrop(fogC, dayAmt) {
  if (!W3.backdrop || !W3.backdrop.length) return;
  const mixK = [0.42, 0.62, 0.8];
  for (const m of W3.backdrop) {
    const k = mixK[m.userData.layer];
    const apply = mat => {
      if (!mat.userData.base) mat.userData.base = mat.color.clone();
      mat.color.copy(mat.userData.base).multiplyScalar(0.35 + 0.65 * dayAmt).lerp(fogC, k);
    };
    if (m.isMesh) apply(m.material); else m.traverse(o => { if (o.isMesh && o !== W3.beacon) apply(o.material); });
  }
  if (W3.beacon) W3.beacon.material.color.setRGB(1, 0.9, 0.6).multiplyScalar(0.6 + 0.8 * (1 - dayAmt));
}

const ATMOS = {
  outpost: { tint: 0xffe8c8, haze: 0.12, far: 1, clouds: 0.85 },
  hollow: { tint: 0xfff0d2, haze: 0.1, far: 1.1, clouds: 0.8 },
  marsh: { tint: 0xa8c49a, haze: 0.38, far: 0.75, clouds: 1 },
  frost: { tint: 0xd2e6ff, haze: 0.25, far: 1.2, clouds: 0.55 },
  harbor: { tint: 0xc4e2ee, haze: 0.3, far: 1, clouds: 0.7 },
  highlands: { tint: 0xfff0d0, haze: 0.12, far: 1.35, clouds: 0.75 },
  gullisle: { tint: 0xc4e2ee, haze: 0.28, far: 1.1, clouds: 0.6 },
  cinder: { tint: 0xffb488, haze: 0.3, far: 0.9, clouds: 0.85 },
  verdant: { tint: 0xb8d8a0, haze: 0.32, far: 0.85, clouds: 0.9 },
  sunscar: { tint: 0xffe2b8, haze: 0.22, far: 1.25, clouds: 0.3 },
  ironvale: { tint: 0xd8e4f0, haze: 0.22, far: 1.1, clouds: 0.6 },
  depths: { tint: 0x8aa8b8, haze: 0.4, far: 0.7, clouds: 1 }
};
function sunTex() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.55, "rgba(255,255,255,1)"); gr.addColorStop(0.64, "rgba(255,255,255,.55)"); gr.addColorStop(0.8, "rgba(255,255,255,.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function moonTex(phase) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#e8eeff"; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(170,180,210,.35)";
  for (const [x, y, r] of [[22, 24, 6], [38, 40, 8], [40, 20, 4], [26, 42, 3]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  const k = Math.cos(phase * Math.PI * 2);
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "rgba(0,0,0,.92)";
  g.beginPath();
  if (phase < 0.5) { g.arc(32, 32, 29, Math.PI / 2, -Math.PI / 2, false); g.ellipse(32, 32, Math.abs(k) * 29, 29, 0, -Math.PI / 2, Math.PI / 2, k < 0); }
  else { g.arc(32, 32, 29, -Math.PI / 2, Math.PI / 2, false); g.ellipse(32, 32, Math.abs(k) * 29, 29, 0, Math.PI / 2, -Math.PI / 2, k < 0); }
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function hazeTex() {
  const c = document.createElement("canvas"); c.width = 4; c.height = 1024;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 1024);
  gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.08, "rgba(255,255,255,0)"); gr.addColorStop(0.095, "rgba(255,255,255,.35)"); gr.addColorStop(0.11, "rgba(255,255,255,.85)"); gr.addColorStop(0.13, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,1)");
  g.fillStyle = gr; g.fillRect(0, 0, 4, 1024);
  return new THREE.CanvasTexture(c);
}
function skyColors(sunY) {
  const night = new THREE.Color(0x101830), dusk = new THREE.Color(0xd8865a), day = new THREE.Color(0xa9c4dc);
  const c = new THREE.Color();
  if (sunY < -0.2) c.copy(night);
  else if (sunY < 0.06) c.copy(night).lerp(dusk, (sunY + 0.2) / 0.26);
  else if (sunY < 0.3) c.copy(dusk).lerp(day, (sunY - 0.06) / 0.24);
  else c.copy(day);
  return c;
}

function flakeTex() {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.45, "rgba(255,255,255,0.8)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

function updateSnow(amt, windy) {
  if (!amt) { if (W3.snow) W3.snow.visible = false; return; }
  const N = W3.quality === "low" ? 1400 : 3200;
  if (!W3.snow || W3.snow.userData.n !== N) {
    if (W3.snow) { W3.scene.remove(W3.snow); W3.snow.geometry.dispose(); W3.snow.material.dispose(); }
    const pos = new Float32Array(N * 3), ph = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos.set([(Math.random() - 0.5) * 50, 2 + Math.random() * 22, (Math.random() - 0.5) * 50], i * 3); ph[i] = Math.random() * 6.28; }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    W3.snow = new THREE.Points(g, new THREE.PointsMaterial({ map: flakeTex(), alphaTest: 0.05, color: 0xffffff, size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    W3.snow.frustumCulled = false;
    W3.snow.userData = { n: N, ph };
    W3.scene.add(W3.snow);
  }
  const r = W3.snow;
  r.visible = true;
  r.material.size = windy ? 0.2 : 0.16;
  r.position.set(W3.camera.position.x, W3.camera.position.y - 10, W3.camera.position.z);
  const p = r.geometry.attributes.position.array, ph = r.userData.ph, fall = windy ? 0.14 : 0.05, drift = windy ? 0.22 : 0.0;
  const t = S.time;
  for (let i = 0, j = 0; i < p.length; i += 3, j++) {
    p[i + 1] -= fall * (0.7 + 0.3 * Math.sin(ph[j]));
    p[i] += drift + Math.sin(t * 1.3 + ph[j]) * 0.012;
    p[i + 2] += Math.cos(t * 1.1 + ph[j]) * 0.01;
    if (p[i + 1] < 0 || p[i] > 25) { p[i] = (Math.random() - 0.5) * 50 - (windy ? 10 : 0); p[i + 1] = 24; p[i + 2] = (Math.random() - 0.5) * 50; }
  }
  r.geometry.attributes.position.needsUpdate = true;
}

function updateRain(amt, windy, snow) {
  updateSnow(snow ? amt : 0, windy);
  if (snow) amt = 0;
  if (!amt) { if (W3.rain) W3.rain.visible = false; return; }
  const N = W3.quality === "low" ? 700 : 1600;
  if (!W3.rain || W3.rain.userData.n !== N) {
    if (W3.rain) { W3.scene.remove(W3.rain); W3.rain.geometry.dispose(); W3.rain.material.dispose(); }
    const pos = new Float32Array(N * 6);
    for (let i = 0; i < N; i++) { const x = (Math.random() - 0.5) * 60, y = Math.random() * 30, z = (Math.random() - 0.5) * 60; pos.set([x, y, z, x, y - 0.6, z], i * 6); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    W3.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xaab8c8, transparent: true, opacity: 0.45, depthWrite: false }));
    W3.rain.frustumCulled = false;
    W3.rain.userData.n = N;
    W3.scene.add(W3.rain);
  }
  const r = W3.rain;
  r.visible = true;
  r.material.opacity = 0.35 + 0.35 * amt;
  r.material.color.setHex(snow ? 0xffffff : 0xaab8c8);
  r.position.set(W3.camera.position.x, W3.camera.position.y - 12, W3.camera.position.z);
  const p = r.geometry.attributes.position.array, fall = snow ? 0.09 : 0.55, drift = windy ? (snow ? 0.12 : 0.18) : 0.03;
  for (let i = 0; i < p.length; i += 6) {
    p[i + 1] -= fall; p[i + 4] = snow ? p[i + 1] - 0.12 : p[i + 4] - fall; p[i] += drift; p[i + 3] = snow ? p[i] + 0.05 : p[i + 3] + drift * 1.4;
    if (p[i + 4] < 0) { const x = (Math.random() - 0.5) * 60, z = (Math.random() - 0.5) * 60; p[i] = x; p[i + 1] = 30; p[i + 2] = z; p[i + 3] = x - drift * 3; p[i + 4] = 29.4; p[i + 5] = z; }
  }
  r.geometry.attributes.position.needsUpdate = true;
}

function shaftTex() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 256;
  const g = c.getContext("2d");
  for (let x = 0; x < 64; x++) {
    const t = Math.abs(x - 32) / 32, a = Math.pow(1 - t, 2.2);
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.25, "rgba(255,255,255," + (a * 0.9).toFixed(3) + ")"); gr.addColorStop(0.8, "rgba(255,255,255," + (a * 0.5).toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(x, 0, 1, 256);
  }
  return new THREE.CanvasTexture(c);
}
function initAtmosFx() {
  const tex = shaftTex();
  W3.shafts = [];
  const grp = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false, color: 0xfff0c8, opacity: 0 }));
    m.userData = { ph: Math.random() * 6.28, off: new THREE.Vector3((Math.random() - 0.5) * 44, 0, (Math.random() - 0.5) * 44), w: 1.4 + Math.random() * 2.6, h: 14 + Math.random() * 10 };
    m.renderOrder = 5;
    grp.add(m); W3.shafts.push(m);
  }
  W3.scene.add(grp); W3.shaftGroup = grp;
  const N = 260, pos = new Float32Array(N * 3), seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - 0.5) * 30; pos[i * 3 + 1] = Math.random() * 6; pos[i * 3 + 2] = (Math.random() - 0.5) * 30; seeds[i] = Math.random() * 100; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  W3.motes = new THREE.Points(pg, new THREE.PointsMaterial({ map: texGlow(), size: 0.07, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff4d8, opacity: 0, sizeAttenuation: true }));
  W3.motes.userData.seeds = seeds; W3.motes.frustumCulled = false;
  W3.scene.add(W3.motes);
}
function updateAtmosFx(dir, dayAmt, gloom, cave, indoor, golden, fogC) {
  if (!W3.shafts) initAtmosFx();
  const cam = W3.camera.position, t = S.time, field = W3.field;
  const zone = S.zone || {}, forest = themeOf(zone) === "field" && zone.palette !== "desert" && zone.palette !== "volcanic";
  let strength = cave ? 0.55 : indoor ? 0 : forest ? dayAmt * (0.7 + golden * 0.9) * (1 - gloom) * (dir.y > 0.05 ? 1 : 0) : 0;
  if (W3.quality === "low") strength *= 0.6;
  W3.shaftGroup.visible = strength > 0.01;
  const ldir = cave ? W3.shaftDirCave || (W3.shaftDirCave = new THREE.Vector3(0.25, 1, 0.15).normalize()) : dir;
  for (const m of W3.shafts) {
    if (!W3.shaftGroup.visible) break;
    const u = m.userData;
    let px = cam.x + u.off.x, pz = cam.z + u.off.z;
    const cell = 44;
    px = Math.round((px - u.off.x) / cell) * cell + u.off.x; pz = Math.round((pz - u.off.z) / cell) * cell + u.off.z;
    const gy = field ? field.heightAt(px / U, pz / U) : 0;
    m.scale.set(u.w, u.h, 1);
    m.position.set(px + ldir.x * u.h * 0.45, gy + ldir.y * u.h * 0.45, pz + ldir.z * u.h * 0.45);
    m.quaternion.setFromUnitVectors(V3Y, ldir);
    m.rotateY(Math.atan2(cam.x - m.position.x, cam.z - m.position.z));
    const d = Math.hypot(cam.x - px, cam.z - pz);
    const fade = sstep(4, 10, d) * (1 - sstep(22, 34, d));
    m.material.opacity = strength * fade * (0.15 + 0.05 * Math.sin(t * 0.4 + u.ph));
    m.material.color.copy(cave ? (W3.caveBeam || (W3.caveBeam = new THREE.Color(0x9ab8ff))) : W3.sun.color);
  }
  const mo = W3.motes;
  const moteAmt = indoor ? 0.35 : cave ? 0.7 : (forest ? 0.25 + golden * 0.5 : 0.12) * (1 - gloom) * Math.max(dayAmt, 0.4);
  mo.material.opacity = moteAmt * (W3.quality === "low" ? 0.5 : 1);
  mo.visible = moteAmt > 0.02;
  if (mo.visible) {
    const p = mo.geometry.attributes.position, sd = mo.userData.seeds, gy = field ? field.heightAt(cam.x / U, cam.z / U) : 0;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i) + Math.sin(t * 0.3 + sd[i]) * 0.004, y = p.getY(i) + 0.002 * Math.sin(t * 0.5 + sd[i] * 2), z = p.getZ(i) + Math.cos(t * 0.27 + sd[i]) * 0.004;
      const rx = x - cam.x, rz = z - cam.z;
      if (Math.abs(rx) > 15) x = cam.x - Math.sign(rx) * 14.9;
      if (Math.abs(rz) > 15) z = cam.z - Math.sign(rz) * 14.9;
      if (y < gy || y > gy + 6) y = gy + ((sd[i] * 7.31) % 6);
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    mo.material.color.copy(cave ? (W3.caveMote || (W3.caveMote = new THREE.Color(0xb8d0ff))) : W3.sun.color).lerp(fogC, 0.2);
  }
}
const V3Y = new THREE.Vector3(0, 1, 0);

function updateSky(force) {
  const z = S.zone, theme = themeOf(z);
  const v = vana();
  const ang = (v.frac * 24 - 12) / 6.5 * (Math.PI / 2);
  const dir = new THREE.Vector3(Math.sin(ang), Math.cos(ang) * 0.95, 0.38).normalize();
  const sunY = dir.y;
  const dayAmt = sstep(-0.18, 0.25, sunY);
  W3.daylight = dayAmt;
  const cave = theme === "cave" || theme === "crypt";
  const indoor = theme === "house";
  const centre = p2w(player.x, player.y);
  W3.sky.visible = !cave && !indoor;
  W3.clouds.visible = !cave && !indoor;
  W3.stars.visible = !cave && !indoor;
  W3.moon.visible = !cave && !indoor;
  W3.sky.material.uniforms.sunPosition.value.copy(dir);
  W3.sky.material.uniforms.rayleigh.value = mix(0.4, 1.6, dayAmt);
  W3.skyEnv.material.uniforms.sunPosition.value.copy(dir);
  W3.skyEnv.material.uniforms.rayleigh.value = mix(0.4, 1.6, dayAmt);
  W3.stars.material.opacity = 1 - sstep(-0.15, 0.05, sunY);
  W3.stars.position.copy(W3.camera.position);
  const moonDir = dir.clone().multiplyScalar(-1);
  const moonSky = moonDir.clone().normalize(), moonUp = sstep(-0.04, 0.08, moonSky.y);
  if (moonDir.y < 0.05) moonDir.y = 0.05;
  W3.moon.position.copy(W3.camera.position).addScaledVector(moonSky, 800);
  if (W3.moonDisc) { W3.moonDisc.position.copy(W3.moon.position); W3.moonDisc.material.opacity = moonUp * (1 - dayAmt * 0.85); }
  W3.moon.material.opacity = moonUp * (1 - dayAmt) * 0.6;
  W3.clouds.position.x = W3.camera.position.x;
  W3.clouds.position.z = W3.camera.position.z;
  const atm = zkey(ATMOS, S.zoneId) || null;
  for (const o of [W3.clouds2, W3.sunGlow, W3.sunDisc, W3.moonDisc, W3.haze]) if (o) o.visible = !cave && !indoor;
  if (W3.clouds2) { W3.clouds2.position.x = W3.camera.position.x; W3.clouds2.position.z = W3.camera.position.z; }
  if (W3.haze) { W3.haze.position.set(W3.camera.position.x, W3.hazeY != null ? W3.hazeY - 160 : W3.camera.position.y - 175, W3.camera.position.z); }
  W3.stars.rotation.y = v.frac * Math.PI * 2;
  const wx = !cave && !indoor && typeof weatherNow === "function" ? weatherNow() : null;
  const snowy = wx === "snow" || wx === "blizzard";
  const sand = wx === "sandstorm";
  const wet = wx === "rain" || wx === "storm", gloom = wet ? 0.55 : wx === "blizzard" || sand ? 0.5 : wx === "cloudy" || wx === "snow" ? 0.35 : wx === "fog" ? 0.3 : 0;
  W3.cloudOff = (W3.cloudOff || 0) + (1 / 60) * (wx === "wind" || wx === "storm" || sand ? 4 : 1);
  W3.clouds.material.map.offset.x = W3.cloudOff * 0.0018;
  W3.clouds.material.map.offset.y = W3.cloudOff * 0.0009;
  if (W3.clouds2) { W3.clouds2.material.map.offset.x = W3.cloudOff * 0.0007; W3.clouds2.material.map.offset.y = -W3.cloudOff * 0.0004; }
  updateRain(wet ? (wx === "storm" ? 1 : 0.7) : snowy ? (wx === "blizzard" ? 1 : 0.6) : 0, wx === "wind" || wx === "storm" || wx === "blizzard", snowy);
  const fogC = theme === "crypt" ? new THREE.Color(0x14141c) : cave ? new THREE.Color(0x0c0c14) : indoor ? new THREE.Color(0x1b130c) : skyColors(sunY);
  if (atm && !cave && !indoor) fogC.lerp(new THREE.Color(atm.tint).multiplyScalar(mix(0.25, 1, dayAmt)), atm.haze);
  const golden = sstep(-0.05, 0.08, sunY) * (1 - sstep(0.1, 0.32, sunY));
  const cloudC = new THREE.Color(0xffffff).lerp(fogC, 0.35).lerp(new THREE.Color(0xffa070), golden * 0.55).multiplyScalar(mix(0.18, 1, dayAmt));
  W3.clouds.material.color.copy(cloudC);
  gradeTick(dayAmt, golden, gloom, cave || indoor);
  W3.clouds.material.opacity = 0.8 * (atm ? atm.clouds : 1) * (1 + gloom * 0.25);
  if (W3.clouds2) { W3.clouds2.material.color.copy(cloudC).lerp(new THREE.Color(0xffc8a0), golden * 0.3); W3.clouds2.material.opacity = 0.42 * (atm ? atm.clouds : 1) + gloom * 0.3; }
  if (W3.sunGlow) { W3.sunGlow.position.copy(W3.camera.position).addScaledVector(dir, 900); W3.sunGlow.material.opacity = sstep(-0.08, 0.05, sunY) * (1 - gloom * 0.85) * 0.9; W3.sunGlow.material.color.setRGB(1, mix(0.94, 0.62, golden), mix(0.82, 0.4, golden)); W3.sunGlow.scale.setScalar(mix(200, 320, golden)); }
  if (W3.sunDisc) { W3.sunDisc.position.copy(W3.camera.position).addScaledVector(dir, 880); W3.sunDisc.material.opacity = sstep(-0.06, 0.04, sunY) * (1 - gloom * 0.9); W3.sunDisc.material.color.setRGB(1, mix(0.97, 0.62, golden), mix(0.88, 0.35, golden)); W3.sunDisc.scale.setScalar(mix(46, 64, golden)); }
  if (W3.moonDisc) {
    const day = Math.floor((Date.now() + S.timeShift - VANA_EPOCH) * 25 / 60000 / 1440), ph = ((day % 24) + 24) % 24 / 24;
    if (W3.moonPhase !== day) { W3.moonPhase = day; W3.moonDisc.material.map.dispose(); W3.moonDisc.material.map = moonTex(ph); W3.moonDisc.material.needsUpdate = true; }
  }
  W3.fog.color.copy(fogC);
  updateBackdrop(fogC, dayAmt);
  if (W3.haze) W3.haze.material.color.copy(fogC);
  if (sand) W3.fog.color.lerp(W3.sandFog || (W3.sandFog = new THREE.Color(0xc8a070)), 0.75);
  else if (gloom) W3.fog.color.lerp(snowy ? (W3.snowFog || (W3.snowFog = new THREE.Color(0xc4ccd4))) : W3.gloomColor || (W3.gloomColor = new THREE.Color(0x6a7078)), (snowy ? 1.4 : 1) * gloom * (0.3 + 0.7 * dayAmt));
  if (S.zone.mist) W3.fog.color.lerp(W3.mistColor || (W3.mistColor = new THREE.Color(0x8a9a8c)), 0.45 * (0.4 + 0.6 * dayAmt));
  if (theme === "crypt") { W3.fog.near = 10; W3.fog.far = 95; }
  else if (cave) { W3.fog.near = 6; W3.fog.far = 70; }
  else if (indoor) { W3.fog.near = 30; W3.fog.far = 120; }
  else if (S.zone.mist) { W3.fog.near = mix(16, 30, dayAmt); W3.fog.far = mix(110, 210, dayAmt); }
  else { const ck = 0.78; W3.fog.near = mix(30, 70, dayAmt) * (atm ? atm.far : 1) * ck; W3.fog.far = mix(180, 420, dayAmt) * (atm ? atm.far : 1) * ck; }
  if (!cave && !indoor && (wx === "fog" || wet || wx === "blizzard" || sand)) { const k = wx === "fog" ? 0.45 : wx === "blizzard" ? 0.22 : sand ? 0.2 : 0.7; W3.fog.near *= k; W3.fog.far *= k; }
  W3.scene.background = cave || indoor ? fogC : null;
  const lightDir = sunY > -0.02 ? dir : moonDir;
  const warm = 1 - sstep(0.05, 0.35, sunY);
  if (theme === "crypt") {
    W3.sun.intensity = 0.9; W3.sun.color.set(0x9aa8c8);
    W3.hemi.intensity = 1.4; W3.hemi.color.set(0x8890b8); W3.hemi.groundColor.set(0x3a3a44);
  } else if (cave) {
    W3.sun.intensity = 0.55; W3.sun.color.set(0x8a9ad0);
    W3.hemi.intensity = 0.9; W3.hemi.color.set(0x7080b0); W3.hemi.groundColor.set(0x3a2a1c);
  } else if (sunY > -0.02) {
    W3.sun.intensity = mix(0.4, 3.0, sstep(-0.02, 0.3, sunY)) * (1 - gloom * 0.6);
    W3.sun.color.setRGB(1, mix(0.92, 0.62, warm), mix(0.85, 0.42, warm));
    W3.hemi.intensity = mix(0.6, 0.75, dayAmt);
    W3.hemi.color.copy(fogC).lerp(new THREE.Color(0xbfd8ff), 0.5);
    W3.hemi.groundColor.set(0x4a4030);
  } else {
    W3.sun.intensity = 1.4; W3.sun.color.set(0x9db4ff);
    W3.hemi.intensity = 1.0; W3.hemi.color.set(0x5a6ea8); W3.hemi.groundColor.set(0x1c2028);
  }
  if (wx === "storm") {
    W3.flashT = (W3.flashT || 0) - 1 / 60;
    if (W3.flashT <= 0 && Math.random() < 0.004) { W3.flashT = 0.18; if (typeof sfx === "function") sfx("lightning"); }
    if (W3.flashT > 0) W3.hemi.intensity += 3.5 * Math.min(1, W3.flashT / 0.09);
  }
  W3.sun.position.copy(centre).addScaledVector(lightDir, 90);
  W3.sun.target.position.copy(centre);
  W3.playerLight.intensity = cave ? 6 : mix(3.5, 0, sstep(-0.15, 0.05, sunY));
  W3.playerLight.position.copy(centre).add(new THREE.Vector3(0, 2.6, 0));
  const nightGlow = 1 - dayAmt;
  for (const m of W3.windowMats) m.emissiveIntensity = nightGlow * 1.6;
  for (const g of W3.lampGlows || []) g.material.opacity = nightGlow * 0.9;
  CLASSIC.lift.value = cave ? 0.2 : mix(0.13, 0.26, dayAmt);
  for (const L of W3.lampLights) L.intensity = nightGlow * 10;
  updateCityAnim();
  for (const L of W3.torchLights) L.intensity = L.userData.crystal ? 6 + Math.sin(S.time * 1.3 + L.userData.phase) * 1.5 : 16 + Math.sin(S.time * 9 + L.userData.phase) * 1.5 + Math.sin(S.time * 23 + L.userData.phase) * 0.8;
  W3.renderer.toneMappingExposure = cave ? 1.45 : mix(1.5, 0.85, dayAmt);
  if (W3.water && W3.water.material.uniforms) {
    W3.water.material.uniforms.sunDirection.value.copy(lightDir);
    W3.water.material.uniforms.sunColor.value.copy(W3.sun.color).multiplyScalar(sunY > 0.05 ? 1 : 0.15);
    W3.water.material.uniforms.time.value = S.time * 0.4;
  } else if (W3.water && W3.water.userData.lowNormal) {
    W3.water.userData.lowNormal.offset.set(S.time * 0.01, S.time * 0.007);
  }
  for (const m of W3.grassMats) if (m.userData.shader) m.userData.shader.uniforms.uTime.value = S.time;
  updateAtmosFx(dir, dayAmt, gloom, cave, indoor, golden, fogC);
  updateWaterFx(1 / 60);
  W3.envTimer -= 1 / 60;
  if (force || W3.envTimer <= 0 || Math.abs(sunY - W3.lastSunY) > 0.03) {
    W3.envTimer = 10;
    W3.lastSunY = sunY;
    if (W3.envRT) W3.envRT.dispose();
    if (cave || indoor) {
      const s2 = new THREE.Scene();
      s2.background = new THREE.Color(cave ? 0x15151c : 0x3a2a1c);
      W3.envRT = W3.pmrem.fromScene(s2, 0.02);
    } else {
      W3.envRT = W3.pmrem.fromScene(W3.skyScene, 0, 0.1, 2000);
    }
    W3.scene.environment = W3.envRT.texture;
    W3.scene.environmentIntensity = cave ? 0.5 : mix(0.03, 0.12, dayAmt);
  }
}

const SETTINGS_DEFAULT = { outline: null, attire: "job", quality: null, aggroHints: false, autoRun: false, invertX: true, camSpeed: 1, invertY: false, autoCam: true, draw: "normal", adaptive: true, fps: false };
const DRAW_DIST = { near: 1000, normal: 1700, far: 2600 };

function perfTick() {
  const now = performance.now();
  const P = W3.perf || (W3.perf = { t0: now, n: 0, fps: 60, low: 0, high: 0 });
  P.n++;
  const el0 = (now - P.t0) / 1000;
  if (el0 < 1) return;
  P.fps = Math.round(P.n / el0);
  P.t0 = now; P.n = 0;
  const el = document.getElementById("fpsBox");
  if (el) { el.style.display = VIEW.settings.fps ? "block" : "none"; if (VIEW.settings.fps) el.textContent = P.fps + " fps · " + W3.pr.toFixed(2) + "× · " + W3.renderer.info.render.calls + " draws"; }
  if (!VIEW.settings.adaptive || VIEW.loading) { P.low = P.high = 0; return; }
  if (P.fps < 28) { P.low++; P.high = 0; } else if (P.fps > 52) { P.high++; P.low = 0; } else { P.low = P.high = 0; }
  autoQuality(P);
  if (P.low >= 2 && W3.pr > 0.6) { W3.pr = Math.max(0.6, Math.round((W3.pr - 0.15) * 100) / 100); W3.renderer.setPixelRatio(W3.pr); resizeRenderer(); P.low = 0; }
  else if (P.high >= 6 && W3.pr < W3.prCap) { W3.pr = Math.min(W3.prCap, Math.round((W3.pr + 0.1) * 100) / 100); W3.renderer.setPixelRatio(W3.pr); resizeRenderer(); P.high = 0; }
}
function loadSettings() {
  try { return Object.assign({}, SETTINGS_DEFAULT, JSON.parse(localStorage.getItem(CONFIG.settingsKey) || "{}")); } catch (e) { return Object.assign({}, SETTINGS_DEFAULT); }
}
function saveSettings(s) { try { localStorage.setItem(CONFIG.settingsKey, JSON.stringify(s)); } catch (e) {} }
