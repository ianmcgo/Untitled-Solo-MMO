const U = 0.05;
const W3 = {
  renderer: null, scene: null, camera: null, composer: null, bloom: null, pmrem: null,
  sky: null, skyScene: null, sun: null, hemi: null, stars: null, moon: null, clouds: null,
  zoneRoot: null, fxRoot: null, field: null, water: null, grassMats: [], torchLights: [], windowMats: [], lampLights: [],
  envRT: null, envTimer: 0, lastSunY: -9, quality: "high", envScene: null, fog: null, daylight: 1, playerLight: null
};

function p2w(px, py, h) { return new THREE.Vector3(px * U, h == null ? groundY(px, py) : h, py * U); }
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
  const cs = zone.indoor ? 8 : 12;
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
    if (zone.plaza) best = Math.max(best, 1 - sstep(zone.plaza.r - 12, zone.plaza.r + 12, Math.hypot(px - zone.plaza.x, py - zone.plaza.y)));
    return best;
  };
  const plazaW = (px, py) => zone.plaza ? 1 - sstep(zone.plaza.r - 12, zone.plaza.r + 12, Math.hypot(px - zone.plaza.x, py - zone.plaza.y)) : 0;
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
      if (along > -260) m = Math.max(m, 1 - sstep(70, 130, lateral));
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
    const e = edgeE(px, py);
    if (walls.length && amps[2] > 0) {
      const we = wallE(px, py);
      if (we > -10) hgt += sstep(-10, 120, we) * amps[2] * (0.75 + NOISE.ridge(px * 0.01, py * 0.01, 3, 0, 309) * 0.5) * (theme === "field" ? 0.9 : 1.1);
    }
    if (amps[2] > 0) {
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
    pathWeight: pathW, plazaWeight: plazaW, cobbleHeight,
    shoreWeight: (px, py) => { let s = 0; for (const wt of waters) { const d = Math.hypot(px - wt.x, py - wt.y); s = Math.max(s, sstep(wt.r + 45, wt.r + 4, d)); } return s; },
    outside: (px, py) => sstep(0, 120, outsideE(px, py)) * (1 - exitMask(px, py)),
    outsideE, exitMask
  };
}

function std(params) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, params)); }

function buildTerrain(field) { return runSteps(buildTerrainSteps(field)); }

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
  const size = W3.quality === "high" ? 2048 : W3.quality === "medium" ? 1536 : 1024;
  const map = yield* bakeTerrainAlbedoSteps(field, size);
  const detail = texDetailNormal();
  const nm = detail.clone();
  nm.needsUpdate = true;
  nm.repeat.set(field.w * U / 3, field.h * U / 3);
  const mat = std({ map, normalMap: nm, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.95 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
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
  const pines = [], leafy = [], rocks = [], smallRocks = [], tufts = [], stal = [];
  const want = theme === "crypt" ? { trees: 0, rocks: 60, small: 90, tufts: 0, stal: 40 } : theme === "cave" ? { trees: 0, rocks: 140, small: 220, tufts: 0, stal: 160 } : theme === "town" ? { trees: 160, rocks: 40, small: 60, tufts: 1, stal: 0 } : { trees: 420, rocks: 160, small: 260, tufts: 1, stal: 0 };
  const tuftCount = { low: 0, medium: 2500, high: 6000 }[q] * want.tufts;
  for (let k = 0, tries = 0; k < want.trees && tries < want.trees * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (theme === "town" ? e < 30 : e < -170) continue;
    if (e > 560) continue;
    if (field.exitMask(px, py) > 0.2) continue;
    if (!placeable(field, px, py, { water: 50, exit: 180 })) continue;
    const y = field.heightAt(px, py), s = 0.8 + rnd() * 0.7;
    const m = mtx(px * U, y - 0.2, py * U, s, s * (0.9 + rnd() * 0.4), s, rnd() * 6.28);
    (rnd() < (theme === "town" ? 0.4 : 0.6) ? pines : leafy).push(m);
    z.colliders.push({ x: px, y: py, r: 4.6 * s });
    k++;
  }
  for (let k = 0, tries = 0; k < want.rocks && tries < want.rocks * 30; tries++) {
    const px = field.x0 + rnd() * field.w, py = field.y0 + rnd() * field.h;
    const e = field.outsideE(px, py);
    if (e < -120 || e > 600 || field.exitMask(px, py) > 0.3) continue;
    if (!placeable(field, px, py, { water: 30 })) continue;
    const s = 0.8 + rnd() * 2.6;
    rocks.push(mtx(px * U, field.heightAt(px, py) - s * 0.25, py * U, s * (0.8 + rnd() * 0.6), s * (0.5 + rnd() * 0.5), s * (0.8 + rnd() * 0.6), rnd() * 6.28, rnd() * 0.3));
    k++;
  }
  for (let k = 0, tries = 0; k < want.small && tries < want.small * 20; tries++) {
    const px = 30 + rnd() * (z.w - 60), py = 30 + rnd() * (z.h - 60);
    if (!placeable(field, px, py, { water: 10, npc: 40, path: 0.5 })) continue;
    const s = 0.15 + rnd() * 0.35;
    smallRocks.push(mtx(px * U, field.heightAt(px, py) - s * 0.2, py * U, s, s * 0.6, s, rnd() * 6.28));
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
    stal.push(mtx(px * U, field.heightAt(px, py) - 0.2, py * U, s, s * (inside ? 1 + rnd() * 1.4 : 1.5 + rnd() * 2.5), s, rnd() * 6.28));
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
  const pineMat = std({ map: pineTex.map, normalMap: pineTex.normalMap, color: 0xd8e8d0 });
  const leafMat = std({ map: leafTex.map, normalMap: leafTex.normalMap });
  addWind(pineMat, 0.02);
  addWind(leafMat, 0.03);
  if (pines.length) { root.add(instanced(trunkGeo, barkMat, pines, true)); root.add(instanced(pineGeo, pineMat, pines, true)); }
  if (leafy.length) { root.add(instanced(trunkGeo, barkMat, leafy, true)); root.add(instanced(leafGeo, leafMat, leafy, true)); }
  const rockGeo = noisyGeo(new THREE.IcosahedronGeometry(1, 2), 0.22, 3);
  const rockMat = std({ map: rockTex.map, normalMap: rockTex.normalMap, normalScale: new THREE.Vector2(1.2, 1.2) });
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
  const z = field.zone;
  const planks = texPlanks(), bricks = texBricks(), roof = texRoof();
  const wallMat = std({ map: planks.map, normalMap: planks.normalMap });
  const stoneMat = std({ map: bricks.map, normalMap: bricks.normalMap });
  const roofMat = std({ map: roof.map, normalMap: roof.normalMap, roughness: 0.8 });
  const doorMat = std({ color: 0x3b2716 });
  const winMat = std({ color: 0x241a10, emissive: 0xffb050, emissiveIntensity: 0 });
  W3.windowMats.push(winMat);
  for (const hs of z.houses || []) {
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
  addLine(10, 10, z.w - 10, 10); addLine(z.w - 10, 10, z.w - 10, z.h - 10); addLine(z.w - 10, z.h - 10, 10, z.h - 10); addLine(10, z.h - 10, 10, 10);
  const logGeo = new THREE.CylinderGeometry(0.22, 0.26, 3, 7);
  logGeo.translate(0, 1.5, 0);
  const tipGeo = new THREE.ConeGeometry(0.22, 0.5, 7);
  tipGeo.translate(0, 3.25, 0);
  const palGeo = THREE.mergeGeometries([logGeo, tipGeo]);
  const bark = texBark();
  root.add(instanced(palGeo, std({ map: bark.map, normalMap: bark.normalMap, color: 0xc8b8a0 }), posts, true));
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
  if (!z.water || !z.water.length) { W3.water = null; return; }
  const geos = z.water.map(w => {
    const g = new THREE.CircleGeometry((w.r + 26) * U, 64);
    g.translate(w.x * U, -w.y * U, 0);
    return g;
  });
  const geo = THREE.mergeGeometries(geos);
  const normals = texWaterNormals();
  const cave = themeOf(z) === "cave" || themeOf(z) === "crypt";
  let water;
  if (W3.quality === "low") {
    const nm = normals.clone();
    nm.needsUpdate = true;
    nm.repeat.set(4, 4);
    water = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cave ? 0x0c2228 : 0x1d4c5a, roughness: 0.08, metalness: 0.2, normalMap: nm, transparent: true, opacity: 0.88 }));
    water.userData.lowNormal = nm;
  } else {
    const res = W3.quality === "high" ? 512 : 256;
    water = new THREE.Water(geo, {
      textureWidth: res, textureHeight: res, waterNormals: normals, sunDirection: new THREE.Vector3(0.7, 0.7, 0), sunColor: 0xffffff,
      waterColor: cave ? 0x061418 : 0x0f3a45, distortionScale: 2.2, fog: true, alpha: 0.94
    });
    water.material.uniforms.size.value = 3.5;
  }
  water.rotation.x = -Math.PI / 2;
  water.position.y = field.waterLevel;
  water.receiveShadow = false;
  water.renderOrder = 1;
  root.add(water);
  W3.water = water;
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

function initRenderer() {
  const canvas = $("game");
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const saved = loadSettings();
  const lowMem = navigator.deviceMemory && navigator.deviceMemory < 4;
  W3.quality = saved.quality || (lowMem ? "low" : coarse || window.innerWidth < 700 ? "medium" : "high");
  const r = new THREE.WebGLRenderer({ canvas, antialias: W3.quality !== "low", powerPreference: "high-performance" });
  W3.prCap = Math.min(window.devicePixelRatio || 1, W3.quality === "high" ? 2 : W3.quality === "medium" ? 1.5 : 1);
  W3.pr = W3.prCap;
  r.setPixelRatio(W3.pr);
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 0.85;
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.shadowMap.enabled = W3.quality !== "low";
  r.shadowMap.type = THREE.PCFShadowMap;
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
  moon.scale.setScalar(70);
  W3.moon = moon;
  W3.scene.add(moon);
  const cloudGeo = new THREE.PlaneGeometry(2600, 2600);
  cloudGeo.rotateX(Math.PI / 2);
  const ct = texClouds();
  ct.repeat.set(3, 3);
  W3.clouds = new THREE.Mesh(cloudGeo, new THREE.MeshBasicMaterial({ map: ct, transparent: true, opacity: 0.8, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  W3.clouds.position.y = 260;
  W3.scene.add(W3.clouds);
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
    const comp = new THREE.EffectComposer(r);
    comp.addPass(new THREE.RenderPass(W3.scene, W3.camera));
    W3.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 0.95);
    comp.addPass(W3.bloom);
    comp.addPass(new THREE.OutputPass());
    W3.composer = comp;
  }
  resizeRenderer();
  window.addEventListener("resize", resizeRenderer);
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
  W3.grassMats = []; W3.torchLights = []; W3.windowMats = []; W3.lampLights = [];
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
  yield { p: 0.88, t: "Raising buildings…" };
  if (themeOf(z) === "town") buildTown(field, root);
  if (themeOf(z) === "cave" || themeOf(z) === "crypt") buildCave(field, root);
  if (themeOf(z) === "crypt") buildCrypt(field, root);
  if (themeOf(z) === "house") buildHouse(field, root);
  buildRuins(field, root);
  buildExits(field, root);
  buildWater(field, root);
  yield { p: 0.94, t: "Filling the water…" };
  W3.scene.add(root);
  W3.lastSunY = -9;
  W3.envTimer = 0;
  updateSky(true);
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

function updateRain(amt, windy) {
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
  r.position.set(W3.camera.position.x, W3.camera.position.y - 12, W3.camera.position.z);
  const p = r.geometry.attributes.position.array, fall = 0.55, drift = windy ? 0.18 : 0.03;
  for (let i = 0; i < p.length; i += 6) {
    p[i + 1] -= fall; p[i + 4] -= fall; p[i] += drift; p[i + 3] += drift * 1.4;
    if (p[i + 4] < 0) { const x = (Math.random() - 0.5) * 60, z = (Math.random() - 0.5) * 60; p[i] = x; p[i + 1] = 30; p[i + 2] = z; p[i + 3] = x - drift * 3; p[i + 4] = 29.4; p[i + 5] = z; }
  }
  r.geometry.attributes.position.needsUpdate = true;
}

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
  if (moonDir.y < 0.05) moonDir.y = 0.05;
  W3.moon.position.copy(W3.camera.position).addScaledVector(moonDir.normalize(), 800);
  W3.moon.material.opacity = 1 - dayAmt;
  W3.clouds.position.x = W3.camera.position.x;
  W3.clouds.position.z = W3.camera.position.z;
  const wx = !cave && !indoor && typeof weatherNow === "function" ? weatherNow() : null;
  const wet = wx === "rain" || wx === "storm", gloom = wet ? 0.55 : wx === "cloudy" ? 0.35 : wx === "fog" ? 0.3 : 0;
  W3.cloudOff = (W3.cloudOff || 0) + (1 / 60) * (wx === "wind" || wx === "storm" ? 4 : 1);
  W3.clouds.material.map.offset.x = W3.cloudOff * 0.0018;
  W3.clouds.material.map.offset.y = W3.cloudOff * 0.0009;
  updateRain(wet ? (wx === "storm" ? 1 : 0.7) : 0, wx === "wind" || wx === "storm");
  const fogC = theme === "crypt" ? new THREE.Color(0x14141c) : cave ? new THREE.Color(0x0c0c14) : indoor ? new THREE.Color(0x1b130c) : skyColors(sunY);
  W3.clouds.material.color.copy(new THREE.Color(0xffffff).lerp(fogC, 0.35).multiplyScalar(mix(0.18, 1, dayAmt)));
  W3.fog.color.copy(fogC);
  if (gloom) W3.fog.color.lerp(W3.gloomColor || (W3.gloomColor = new THREE.Color(0x6a7078)), gloom * (0.3 + 0.7 * dayAmt));
  if (S.zone.mist) W3.fog.color.lerp(W3.mistColor || (W3.mistColor = new THREE.Color(0x8a9a8c)), 0.45 * (0.4 + 0.6 * dayAmt));
  if (theme === "crypt") { W3.fog.near = 10; W3.fog.far = 95; }
  else if (cave) { W3.fog.near = 6; W3.fog.far = 70; }
  else if (indoor) { W3.fog.near = 30; W3.fog.far = 120; }
  else if (S.zone.mist) { W3.fog.near = mix(16, 30, dayAmt); W3.fog.far = mix(110, 210, dayAmt); }
  else { W3.fog.near = mix(30, 70, dayAmt); W3.fog.far = mix(180, 420, dayAmt); }
  if (!cave && !indoor && (wx === "fog" || wet)) { const k = wx === "fog" ? 0.45 : 0.7; W3.fog.near *= k; W3.fog.far *= k; }
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
  for (const L of W3.lampLights) L.intensity = nightGlow * 10;
  for (const L of W3.torchLights) L.intensity = 16 + Math.sin(S.time * 9 + L.userData.phase) * 1.5 + Math.sin(S.time * 23 + L.userData.phase) * 0.8;
  W3.renderer.toneMappingExposure = cave ? 1.45 : mix(1.5, 0.85, dayAmt);
  if (W3.water && W3.water.material.uniforms) {
    W3.water.material.uniforms.sunDirection.value.copy(lightDir);
    W3.water.material.uniforms.sunColor.value.copy(W3.sun.color).multiplyScalar(sunY > 0.05 ? 1 : 0.15);
    W3.water.material.uniforms.time.value = S.time * 0.4;
  } else if (W3.water && W3.water.userData.lowNormal) {
    W3.water.userData.lowNormal.offset.set(S.time * 0.01, S.time * 0.007);
  }
  for (const m of W3.grassMats) if (m.userData.shader) m.userData.shader.uniforms.uTime.value = S.time;
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

const SETTINGS_DEFAULT = { quality: null, aggroHints: false, camSpeed: 1, invertY: false, autoCam: true, draw: "normal", adaptive: true, fps: false };
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
  if (P.low >= 2 && W3.pr > 0.6) { W3.pr = Math.max(0.6, Math.round((W3.pr - 0.15) * 100) / 100); W3.renderer.setPixelRatio(W3.pr); resizeRenderer(); P.low = 0; }
  else if (P.high >= 6 && W3.pr < W3.prCap) { W3.pr = Math.min(W3.prCap, Math.round((W3.pr + 0.1) * 100) / 100); W3.renderer.setPixelRatio(W3.pr); resizeRenderer(); P.high = 0; }
}
function loadSettings() {
  try { return Object.assign({}, SETTINGS_DEFAULT, JSON.parse(localStorage.getItem(CONFIG.settingsKey) || "{}")); } catch (e) { return Object.assign({}, SETTINGS_DEFAULT); }
}
function saveSettings(s) { try { localStorage.setItem(CONFIG.settingsKey, JSON.stringify(s)); } catch (e) {} }
