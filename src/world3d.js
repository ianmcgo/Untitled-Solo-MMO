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

function buildField(zone) {
  const theme = themeOf(zone);
  const M = zone.indoor ? 40 : 640;
  const cs = zone.indoor ? 8 : 12;
  const x0 = -M, y0 = -M, w = zone.w + 2 * M, h = zone.h + 2 * M;
  const cols = Math.ceil(w / cs) + 1, rows = Math.ceil(h / cs) + 1;
  const amps = { town: [0.7, 0.12, 6], field: [2.6, 0.35, 11], cave: [0.8, 0.45, 13], house: [0, 0, 0] }[theme];
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
  const outsideE = (px, py) => {
    const ix = Math.max(24 - px, px - (zone.w - 24), 0), iy = Math.max(24 - py, py - (zone.h - 24), 0);
    if (ix > 0 || iy > 0) return Math.hypot(ix, iy);
    return -Math.min(px - 24, zone.w - 24 - px, py - 24, zone.h - 24 - py);
  };
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
    const e = outsideE(px, py);
    if (amps[2] > 0) {
      let t = sstep(-60, 260, e);
      t *= 1 - exitMask(px, py) * 0.97;
      const rough = NOISE.ridge(px * 0.006, py * 0.006, 4, 0, 307);
      hgt += t * (amps[2] * (0.7 + rough * 0.6)) + sstep(150, 600, e) * amps[2] * 0.8 * (1 - exitMask(px, py));
    }
    return hgt;
  };
  const data = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) data[j * cols + i] = raw(x0 + i * cs, y0 + j * cs);
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

function buildTerrain(field) {
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
  const map = bakeTerrainAlbedo(field, size);
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
  if (theme === "house") return;
  const rnd = rngFor(z, "veg");
  const q = W3.quality;
  const bark = texBark();
  const pineTex = texFoliage("pine", [48, 82, 52]);
  const leafTex = texFoliage("leaf", [74, 110, 48]);
  const rockTex = theme === "cave" ? texCaveRock() : texRock();
  const pines = [], leafy = [], rocks = [], smallRocks = [], tufts = [], stal = [];
  const want = theme === "cave" ? { trees: 0, rocks: 140, small: 220, tufts: 0, stal: 160 } : theme === "town" ? { trees: 160, rocks: 40, small: 60, tufts: 1, stal: 0 } : { trees: 420, rocks: 160, small: 260, tufts: 1, stal: 0 };
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
    const inside = e < -40;
    if (inside && rnd() < 0.7) continue;
    if (!placeable(field, px, py, { water: 40, npc: 60, path: 0.05, exit: 170 })) continue;
    const s = inside ? 0.5 + rnd() * 0.8 : 1 + rnd() * 2.5;
    stal.push(mtx(px * U, field.heightAt(px, py) - 0.2, py * U, s, s * (1.5 + rnd() * 2.5), s, rnd() * 6.28));
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
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.8, 6), torchMat);
    post.position.y = 0.9;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), flameMat);
    flame.position.y = 2.0;
    g.add(post, flame);
    g.position.set(tx * U, field.heightAt(tx, ty), ty * U);
    if (i < (W3.quality === "low" ? 3 : 7)) {
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
  for (let i = 0; i < 18; i++) {
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

function buildExits(field, root) {
  const z = field.zone;
  const planks = texPlanks();
  const rock = themeOf(z) === "cave" ? texCaveRock() : texRock();
  const woodMat = std({ map: planks.map, normalMap: planks.normalMap });
  const rockMat = std({ map: rock.map, normalMap: rock.normalMap });
  for (const ex of z.exits) {
    if (ex.kind === "door") continue;
    const cx = ex.x + ex.w / 2, cy = ex.y + ex.h / 2;
    const horiz = ex.x <= 0 || ex.x + ex.w >= z.w;
    const g = new THREE.Group();
    const span = 4.6;
    const mat = themeOf(z) === "cave" ? rockMat : woodMat;
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
  const cave = themeOf(z) === "cave";
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
  W3.quality = saved.quality || (coarse || window.innerWidth < 700 ? "medium" : "high");
  const r = new THREE.WebGLRenderer({ canvas, antialias: W3.quality !== "low", powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, W3.quality === "high" ? 2 : W3.quality === "medium" ? 1.5 : 1));
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

function buildZone3D() {
  const z = S.zone;
  if (W3.zoneRoot) { W3.scene.remove(W3.zoneRoot); disposeTree(W3.zoneRoot); }
  W3.grassMats = []; W3.torchLights = []; W3.windowMats = []; W3.lampLights = [];
  const root = new THREE.Group();
  W3.zoneRoot = root;
  const field = buildField(z);
  W3.field = field;
  const terrain = buildTerrain(field);
  terrain.material.map.userData.zone = true;
  root.add(terrain);
  W3.terrain = terrain;
  buildVegetation(field, root);
  if (themeOf(z) === "town") buildTown(field, root);
  if (themeOf(z) === "cave") buildCave(field, root);
  buildExits(field, root);
  buildWater(field, root);
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

function updateSky(force) {
  const z = S.zone, theme = themeOf(z);
  const v = vana();
  const ang = (v.frac * 24 - 12) / 6.5 * (Math.PI / 2);
  const dir = new THREE.Vector3(Math.sin(ang), Math.cos(ang) * 0.95, 0.38).normalize();
  const sunY = dir.y;
  const dayAmt = sstep(-0.18, 0.25, sunY);
  W3.daylight = dayAmt;
  const cave = theme === "cave";
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
  W3.clouds.material.map.offset.x = S.time * 0.0018;
  W3.clouds.material.map.offset.y = S.time * 0.0009;
  const fogC = cave ? new THREE.Color(0x0c0c14) : indoor ? new THREE.Color(0x1b130c) : skyColors(sunY);
  W3.clouds.material.color.copy(new THREE.Color(0xffffff).lerp(fogC, 0.35).multiplyScalar(mix(0.18, 1, dayAmt)));
  W3.fog.color.copy(fogC);
  if (cave) { W3.fog.near = 6; W3.fog.far = 70; }
  else if (indoor) { W3.fog.near = 30; W3.fog.far = 120; }
  else { W3.fog.near = mix(30, 70, dayAmt); W3.fog.far = mix(180, 420, dayAmt); }
  W3.scene.background = cave || indoor ? fogC : null;
  const lightDir = sunY > -0.02 ? dir : moonDir;
  const warm = 1 - sstep(0.05, 0.35, sunY);
  if (cave) {
    W3.sun.intensity = 0.55; W3.sun.color.set(0x8a9ad0);
    W3.hemi.intensity = 0.9; W3.hemi.color.set(0x7080b0); W3.hemi.groundColor.set(0x3a2a1c);
  } else if (sunY > -0.02) {
    W3.sun.intensity = mix(0.4, 3.0, sstep(-0.02, 0.3, sunY));
    W3.sun.color.setRGB(1, mix(0.92, 0.62, warm), mix(0.85, 0.42, warm));
    W3.hemi.intensity = mix(0.6, 0.75, dayAmt);
    W3.hemi.color.copy(fogC).lerp(new THREE.Color(0xbfd8ff), 0.5);
    W3.hemi.groundColor.set(0x4a4030);
  } else {
    W3.sun.intensity = 1.4; W3.sun.color.set(0x9db4ff);
    W3.hemi.intensity = 1.0; W3.hemi.color.set(0x5a6ea8); W3.hemi.groundColor.set(0x1c2028);
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

const SETTINGS_DEFAULT = { quality: null, aggroHints: true, camSpeed: 1, invertY: false, autoCam: true };
function loadSettings() {
  try { return Object.assign({}, SETTINGS_DEFAULT, JSON.parse(localStorage.getItem(CONFIG.settingsKey) || "{}")); } catch (e) { return Object.assign({}, SETTINGS_DEFAULT); }
}
function saveSettings(s) { try { localStorage.setItem(CONFIG.settingsKey, JSON.stringify(s)); } catch (e) {} }
