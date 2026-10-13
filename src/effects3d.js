const FX = { ready: false, add: null, smoke: null, items: [], lights: [], circles: new Map(), auras: new Map(), runeTex: null, pillarTex: null, ringTex: null, flashEl: null, queue: [] };

class ParticleLayer {
  constructor(max, additive) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.c0 = new Float32Array(max * 3); this.c1 = new Float32Array(max * 3);
    this.age = new Float32Array(max); this.life = new Float32Array(max);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max);
    this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.a0 = new Float32Array(max);
    this.aPos = new Float32Array(max * 3); this.aCol = new Float32Array(max * 3); this.aSize = new Float32Array(max); this.aAlpha = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(this.aPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("pcolor", new THREE.BufferAttribute(this.aCol, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("psize", new THREE.BufferAttribute(this.aSize, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("palpha", new THREE.BufferAttribute(this.aAlpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: texGlow() }, scale: { value: 400 }, soft: { value: additive ? 0 : 1 } },
      vertexShader: "attribute vec3 pcolor; attribute float psize; attribute float palpha; uniform float scale; varying vec3 vC; varying float vA; void main(){ vC = pcolor; vA = palpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }",
      fragmentShader: "uniform sampler2D map; uniform float soft; varying vec3 vC; varying float vA; void main(){ vec4 t = texture2D(map, gl_PointCoord); float a = mix(t.a, smoothstep(0.0, 1.0, t.a), soft) * vA; if (a < 0.004) discard; gl_FragColor = vec4(vC, a); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}",
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 6 : 5;
  }
  spawn(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, grav, drag, a0) {
    if (this.n >= this.max) return;
    const i = this.n++, j = i * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
    this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.c0[j] = c0.r; this.c0[j + 1] = c0.g; this.c0[j + 2] = c0.b;
    const e = c1 || c0;
    this.c1[j] = e.r; this.c1[j + 1] = e.g; this.c1[j + 2] = e.b;
    this.age[i] = 0; this.life[i] = life; this.s0[i] = s0; this.s1[i] = s1;
    this.grav[i] = grav || 0; this.drag[i] = drag || 0; this.a0[i] = a0 == null ? 1 : a0;
  }
  update(dt) {
    let i = 0;
    while (i < this.n) {
      this.age[i] += dt;
      if (this.age[i] >= this.life[i]) {
        const l = --this.n;
        if (i !== l) {
          for (const arr of [this.pos, this.vel, this.c0, this.c1]) { arr[i * 3] = arr[l * 3]; arr[i * 3 + 1] = arr[l * 3 + 1]; arr[i * 3 + 2] = arr[l * 3 + 2]; }
          for (const arr of [this.age, this.life, this.s0, this.s1, this.grav, this.drag, this.a0]) arr[i] = arr[l];
        }
        continue;
      }
      const j = i * 3, d = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[j] *= d; this.vel[j + 1] = this.vel[j + 1] * d - this.grav[i] * dt; this.vel[j + 2] *= d;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      const k = this.age[i] / this.life[i];
      this.aPos[j] = this.pos[j]; this.aPos[j + 1] = this.pos[j + 1]; this.aPos[j + 2] = this.pos[j + 2];
      this.aCol[j] = this.c0[j] + (this.c1[j] - this.c0[j]) * k; this.aCol[j + 1] = this.c0[j + 1] + (this.c1[j + 1] - this.c0[j + 1]) * k; this.aCol[j + 2] = this.c0[j + 2] + (this.c1[j + 2] - this.c0[j + 2]) * k;
      this.aSize[i] = this.s0[i] + (this.s1[i] - this.s0[i]) * k;
      this.aAlpha[i] = this.a0[i] * (k < 0.1 ? k / 0.1 : 1 - Math.pow((k - 0.1) / 0.9, 1.5));
      i++;
    }
    const g = this.points.geometry;
    g.setDrawRange(0, this.n);
    for (const a of ["position", "pcolor", "psize", "palpha"]) g.attributes[a].needsUpdate = true;
  }
  clear() { this.n = 0; }
}

const C = h => new THREE.Color(h);
const rnd = (a, b) => a + Math.random() * (b - a);
const elColor = el => C(ELEMENT_COLORS[el] || "#ffffff");

function runeTexture() {
  const c = makeCanvas(256, 256), g = c.getContext("2d");
  g.translate(128, 128);
  g.strokeStyle = "#fff"; g.fillStyle = "#fff";
  g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 120, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 108, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 66, 0, Math.PI * 2); g.stroke();
  g.lineWidth = 2;
  for (const off of [0, Math.PI / 6]) {
    g.beginPath();
    for (let k = 0; k <= 3; k++) { const a = off + k * Math.PI * 2 / 3 - Math.PI / 2; const x = Math.cos(a) * 104, y = Math.sin(a) * 104; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  }
  const r = seeded(9);
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2;
    g.save(); g.rotate(a); g.translate(0, -114);
    g.lineWidth = 1.6; g.beginPath();
    const n = 2 + Math.floor(r() * 3);
    for (let s = 0; s < n; s++) { const x0 = (r() - 0.5) * 8, y0 = (r() - 0.5) * 6; g.moveTo(x0, y0); g.lineTo(x0 + (r() - 0.5) * 8, y0 + (r() - 0.5) * 6); }
    g.stroke(); g.restore();
  }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * 66, Math.sin(a) * 66, 7, 0, Math.PI * 2); g.stroke(); }
  g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function gradientTexture() {
  const c = makeCanvas(8, 128), g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.5, "rgba(255,255,255,0.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function ringTexture() {
  const c = makeCanvas(128, 128), g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 30, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.75, "rgba(255,255,255,0.9)"); gr.addColorStop(0.85, "rgba(255,255,255,1)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function initFX() {
  FX.add = new ParticleLayer(3500, true);
  FX.smoke = new ParticleLayer(1200, false);
  W3.scene.add(FX.add.points, FX.smoke.points);
  FX.runeTex = runeTexture();
  FX.pillarTex = gradientTexture();
  FX.ringTex = ringTexture();
  for (let i = 0; i < 4; i++) {
    const L = new THREE.PointLight(0xffffff, 0, 14, 1.6);
    L.userData = { t: 0, life: 1, peak: 0 };
    W3.scene.add(L);
    FX.lights.push(L);
  }
  FX.flashEl = $("flash");
  FX.ready = true;
}

function clearFX() {
  if (!FX.ready) return;
  FX.add.clear(); FX.smoke.clear();
  for (const it of FX.items) { W3.fxRoot.remove(it.obj); disposeTree(it.obj); }
  FX.items = [];
  FX.queue = [];
  for (const [, c] of FX.circles) { W3.fxRoot.remove(c); disposeTree(c); }
  FX.circles.clear();
  for (const L of FX.lights) L.intensity = 0;
}

function addItem(obj, life, update, opts) {
  W3.fxRoot.add(obj);
  FX.items.push({ obj, t: 0, life, update, opts: opts || {} });
  return obj;
}

function fxLight(pos, color, peak, life, dist) {
  let L = FX.lights[0];
  for (const l of FX.lights) if (l.userData.t / l.userData.life > L.userData.t / L.userData.life || l.intensity === 0) { L = l; if (l.intensity === 0) break; }
  L.position.copy(pos);
  L.color.copy(C(color));
  L.distance = dist || 14;
  L.userData.t = 0; L.userData.life = life; L.userData.peak = peak;
  L.intensity = peak;
}

function screenFlash(color, strength) {
  const el = FX.flashEl;
  if (!el) return;
  el.style.transition = "none";
  el.style.background = color;
  el.style.opacity = String(strength);
  void el.offsetWidth;
  el.style.transition = "opacity 0.5s ease-out";
  el.style.opacity = "0";
}

function basicMat(color, opacity, map) {
  return new THREE.MeshBasicMaterial({ color: C(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, map: map || null, toneMapped: false });
}

function anchor(e, frac) {
  const gy = groundY(e.x, e.y);
  return new THREE.Vector3(e.x * U, gy + entityHeight(e) * (frac == null ? 0.55 : frac), e.y * U);
}
function groundAt(e) { return new THREE.Vector3(e.x * U, groundY(e.x, e.y) + 0.05, e.y * U); }

function burst(layer, p, n, o) {
  const c0 = o.c0 instanceof THREE.Color ? o.c0 : C(o.c0), c1 = o.c1 ? (o.c1 instanceof THREE.Color ? o.c1 : C(o.c1)) : null;
  for (let i = 0; i < n; i++) {
    let dx = rnd(-1, 1), dy = rnd(-1, 1), dz = rnd(-1, 1);
    if (o.shape === "up") { dx *= 0.3; dz *= 0.3; dy = rnd(0.5, 1); }
    else if (o.shape === "ring") { const a = Math.random() * Math.PI * 2; dx = Math.cos(a); dz = Math.sin(a); dy = rnd(0, 0.25); }
    else if (o.shape === "dome") { dy = Math.abs(dy) + 0.2; }
    const l = Math.hypot(dx, dy, dz) || 1;
    const sp = rnd(o.speed * 0.5, o.speed);
    const r = o.radius || 0;
    layer.spawn(p.x + dx / l * r * Math.random(), p.y + (o.yJitter ? rnd(-o.yJitter, o.yJitter) : 0), p.z + dz / l * r * Math.random(),
      dx / l * sp + (o.vx || 0), dy / l * sp + (o.vy || 0), dz / l * sp + (o.vz || 0),
      rnd(o.life * 0.6, o.life), o.size, o.size2 == null ? o.size * 0.3 : o.size2, c0, c1, o.grav || 0, o.drag || 0, o.alpha);
  }
}

function shockwave(p, color, radius, life, height) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), basicMat(color, 0.9, FX.ringTex));
  m.rotation.x = -Math.PI / 2;
  m.position.copy(p);
  m.position.y += height || 0.08;
  addItem(m, life, k => { const s = 0.1 + radius * ease(k * 1.4); m.scale.set(s, s, s); m.material.opacity = 0.9 * (1 - k); });
}

function pillar(p, color, radius, height, life, spin) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.15, height, 28, 1, true), basicMat(color, 0.45, FX.pillarTex));
  m.position.set(p.x, p.y + height / 2, p.z);
  addItem(m, life, k => {
    const w = Math.min(1, k / 0.12) * (1 - ease((k - 0.55) / 0.45));
    m.material.opacity = 0.45 * w;
    m.scale.set(0.5 + 0.6 * ease(k * 2), 0.3 + 0.7 * ease(k * 3), 0.5 + 0.6 * ease(k * 2));
    m.position.y = p.y + height / 2 * m.scale.y;
    m.rotation.y += (spin || 1) * 0.06;
  });
}

function sphereFlash(p, color, radius, life) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), basicMat(color, 0.4));
  m.position.copy(p);
  addItem(m, life, k => { const s = radius * (0.2 + 0.8 * ease(k * 1.6)); m.scale.setScalar(s); m.material.opacity = 0.4 * (1 - ease(k)) * (1 - ease(k)); });
}

function sprite(p, color, size, life, grow) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: C(color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.position.copy(p);
  addItem(m, life, k => { const s = size * (1 + (grow || 0.5) * k); m.scale.set(s, s, 1); m.material.opacity = 1 - k; });
}

function slashArc(e, tgt, color, big) {
  const from = anchor(e, 0.55), to = anchor(tgt, 0.55);
  const dir = new THREE.Vector3().subVectors(to, from); dir.y = 0; dir.normalize();
  const g = new THREE.RingGeometry(0.75, big ? 1.25 : 0.95, 28, 1, -0.9, 1.8);
  const m = new THREE.Mesh(g, basicMat(color, 0.9));
  const mid = from.clone().lerp(to, 0.6);
  m.position.copy(mid);
  m.lookAt(mid.clone().add(dir));
  m.rotateZ((Math.random() - 0.5) * 1.6);
  m.rotateY(Math.PI / 2);
  addItem(m, big ? 0.35 : 0.22, k => { m.material.opacity = 0.9 * (1 - k); m.scale.setScalar(0.8 + 0.5 * k); m.rotateX(0.04); });
}

function lightningBolt(p, color) {
  const top = p.clone().add(new THREE.Vector3(rnd(-2, 2), 14, rnd(-2, 2)));
  const make = () => {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const k = i / 10; const q = top.clone().lerp(p, k); if (i > 0 && i < 10) { q.x += rnd(-0.45, 0.45); q.z += rnd(-0.45, 0.45); } pts.push(q); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.06, 5, false);
  };
  const m = new THREE.Mesh(make(), basicMat(color, 1));
  const glow = new THREE.Mesh(m.geometry, basicMat(color, 0.35));
  glow.scale.set(1, 1, 1);
  const grp = new THREE.Group(); grp.add(m);
  let last = 0;
  addItem(grp, 0.45, k => {
    if (k - last > 0.12) { last = k; m.geometry.dispose(); m.geometry = make(); }
    m.material.opacity = k < 0.7 ? (Math.random() > 0.25 ? 1 : 0.3) : 1 - (k - 0.7) / 0.3;
  });
}

function shards(p, color, n) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: C(color), emissive: C(color), emissiveIntensity: 0.6, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 });
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + rnd(-0.3, 0.3), r = rnd(0.25, 0.75);
    const c = new THREE.Mesh(new THREE.ConeGeometry(rnd(0.12, 0.22), rnd(0.8, 1.6), 5), mat);
    c.position.set(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r);
    c.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5);
    c.scale.set(1, 0.01, 1);
    grp.add(c); list.push(c);
  }
  addItem(grp, 0.9, k => {
    const g = ease(k / 0.18);
    for (const c of list) c.scale.set(1, Math.max(0.01, g), 1);
    mat.opacity = 0.85 * (1 - ease((k - 0.6) / 0.4));
    if (k > 0.6 && !grp.userData.shattered) { grp.userData.shattered = true; burst(FX.add, p.clone().add(new THREE.Vector3(0, 0.6, 0)), 40, { c0: 0xe0f8ff, c1: color, speed: 4, life: 0.7, size: 0.18, grav: 6 }); }
  });
}

function rocks(p, color) {
  const grp = new THREE.Group();
  const tex = texRock();
  const mat = new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, color: C(color) });
  const list = [];
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, r = rnd(0.3, 0.8);
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(rnd(0.15, 0.32), 0), mat);
    m.position.set(p.x + Math.cos(a) * r, p.y - 0.2, p.z + Math.sin(a) * r);
    m.userData.v = new THREE.Vector3(Math.cos(a) * rnd(0.3, 1.2), rnd(4, 7), Math.sin(a) * rnd(0.3, 1.2));
    m.userData.r = new THREE.Vector3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6));
    m.castShadow = true;
    grp.add(m); list.push(m);
  }
  addItem(grp, 1.1, (k, dt) => {
    for (const m of list) {
      m.userData.v.y -= 16 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      if (m.position.y < p.y) { m.position.y = p.y; m.userData.v.multiplyScalar(0.3); m.userData.v.y = Math.abs(m.userData.v.y); }
      m.rotation.x += m.userData.r.x * dt; m.rotation.y += m.userData.r.y * dt;
      if (k > 0.75) m.scale.setScalar(1 - (k - 0.75) / 0.25);
    }
  });
  burst(FX.smoke, p, 30, { c0: 0x8a7a60, c1: 0x5a4a3a, speed: 2.5, life: 1.0, size: 0.8, size2: 1.6, shape: "dome", drag: 2, alpha: 0.5 });
}

function swirl(p, color, life, height, rate) {
  const st = { t: 0 };
  const c0 = C(color), c1 = C(color).lerp(C(0xffffff), 0.5);
  addItem(new THREE.Object3D(), life, (k, dt) => {
    const n = Math.ceil(rate * dt);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.5, 0.9) * (1 - k * 0.4);
      const y = rnd(0, height);
      FX.add.spawn(p.x + Math.cos(a) * r, p.y + y, p.z + Math.sin(a) * r, -Math.sin(a) * 4 + Math.cos(a) * -0.5, rnd(1, 2.5), Math.cos(a) * 4 + Math.sin(a) * -0.5, 0.45, 0.22, 0.05, c1, c0, 0, 1.5, 0.9);
    }
  });
}

function projectile(from, to, color, time, onHit, trailColor) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.8 }));
  m.position.copy(from);
  m.castShadow = true;
  addItem(m, time, (k, dt) => {
    const p = from.clone().lerp(to, k);
    p.y += Math.sin(k * Math.PI) * 2.2;
    m.position.copy(p);
    FX.add.spawn(p.x, p.y + 0.12, p.z, rnd(-0.5, 0.5), rnd(0.5, 1.5), rnd(-0.5, 0.5), 0.3, 0.14, 0.02, C(trailColor || 0xffd070), C(0xff4020), 2, 1);
    if (k >= 0.98 && !m.userData.hit) { m.userData.hit = true; onHit(); }
  });
}

function fireBurst(p, scale) {
  const s = scale || 1;
  burst(FX.add, p, Math.round(70 * s), { c0: 0xffe080, c1: 0xff3010, speed: 4 * s, life: 0.7, size: 0.55 * s, size2: 0.1, drag: 2.5, grav: -1.5 });
  burst(FX.add, p, Math.round(25 * s), { c0: 0xffffff, c1: 0xffa040, speed: 7 * s, life: 0.35, size: 0.18, grav: 4 });
  burst(FX.smoke, p.clone().add(new THREE.Vector3(0, 0.4, 0)), Math.round(16 * s), { c0: 0x8a7a70, c1: 0x5a5a5a, speed: 1.5, life: 1.3, size: 0.7 * s, size2: 1.6 * s, grav: -1.2, drag: 1.5, alpha: 0.3 });
  sphereFlash(p, 0xff7030, 1.3 * s, 0.3);
  fxLight(p, 0xff8040, 30 * s, 0.5, 16);
}

function splash(p, color, scale) {
  const s = scale || 1;
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 2.4 * s, 20, 1, true), basicMat(color, 0.6, FX.pillarTex));
  col.position.set(p.x, p.y + 1.2 * s, p.z);
  addItem(col, 0.7, k => { col.scale.set(1 + k, ease(k / 0.3) * (1 - ease((k - 0.5) / 0.5)) + 0.01, 1 + k); col.material.opacity = 0.6 * (1 - k); });
  burst(FX.add, p.clone().add(new THREE.Vector3(0, 0.5, 0)), Math.round(70 * s), { c0: 0xd0f4ff, c1: color, speed: 4.5, life: 0.9, size: 0.2, grav: 9, shape: "dome" });
  shockwave(p, color, 2.2 * s, 0.6);
}

const VFX = {
  hit(d) {
    const p = anchor(d.tgt, 0.55);
    const from = anchor(d.src, 0.55);
    const dir = new THREE.Vector3().subVectors(p, from).normalize();
    burst(FX.add, p, d.crit ? 34 : 14, { c0: 0xffffff, c1: d.crit ? 0xffc040 : 0xffe0a0, speed: d.crit ? 6 : 4, life: 0.32, size: 0.12, grav: 6, vx: dir.x * 2, vz: dir.z * 2 });
    if (d.slash) slashArc(d.src, d.tgt, d.crit ? 0xfff0b0 : 0xe8f0ff, d.crit);
    else sprite(p, 0xffe8c0, d.crit ? 1.4 : 0.8, 0.18, 0.8);
    if (d.crit) { fxLight(p, 0xffd080, 14, 0.25, 8); sprite(p, 0xffd060, 2.2, 0.25, 1); }
  },
  miss(d) {
    const p = anchor(d.tgt, 0.6);
    burst(FX.smoke, p, 6, { c0: 0xd8d8d8, speed: 1.5, life: 0.4, size: 0.25, size2: 0.5, alpha: 0.35, drag: 3 });
  },
  ws(d) {
    const p = anchor(d.src, 0.6);
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(1.2, 1.8), y = rnd(-0.5, 1.2);
      FX.add.spawn(p.x + Math.cos(a) * r, p.y + y, p.z + Math.sin(a) * r, -Math.cos(a) * r * 2.6, -y * 2.6, -Math.sin(a) * r * 2.6, 0.38, 0.16, 0.04, C(0xfff2b0), C(0xffb020), 0, 0, 1);
    }
    fxLight(p, 0xffd070, 10, 0.5, 8);
  },
  wsHit(d) {
    const p = anchor(d.tgt, 0.5);
    const el = SC_PROPS[d.ws.props[0]] ? SC_PROPS[d.ws.props[0]].el[0] : "light";
    const col = C(0xffd060).lerp(elColor(el), 0.4);
    sphereFlash(p, col, 1.5, 0.35);
    burst(FX.add, p, 60, { c0: 0xffffff, c1: col, speed: 7, life: 0.55, size: 0.16, grav: 7 });
    shockwave(groundAt(d.tgt), col, 3.2, 0.55);
    slashArc(d.src, d.tgt, 0xffe8a0, true);
    fxLight(p, col, 24, 0.45, 12);
  },
  skillchain(d) {
    const g = groundAt(d.tgt), p = anchor(d.tgt, 0.5);
    const cols = d.el.map(elColor);
    pillar(g, cols[0], 0.85, 12, 1.4, 1);
    if (cols[1]) pillar(g, cols[1], 0.55, 14, 1.4, -1.6);
    shockwave(g, cols[0], 5.5, 0.9);
    setTimeout(() => FX.ready && shockwave(g, cols[1] || cols[0], 7.5, 1.0), 180);
    for (let i = 0; i < 120; i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.3, 1.4), c = cols[i % cols.length];
      FX.add.spawn(g.x + Math.cos(a) * r, g.y + rnd(0, 1), g.z + Math.sin(a) * r, -Math.sin(a) * 3, rnd(5, 11), Math.cos(a) * 3, rnd(0.8, 1.4), 0.3, 0.05, C(0xffffff), c, -1, 0.8, 1);
    }
    burst(FX.add, p, 60, { c0: 0xffffff, c1: cols[0], speed: 9, life: 0.6, size: 0.22, grav: 4 });
    fxLight(p, cols[0], 45, 1.0, 22);
    screenFlash(ELEMENT_COLORS[d.el[0]], d.lv > 1 ? 0.35 : 0.22);
  },
  burst(d) {
    const p = anchor(d.tgt, 0.5), col = elColor(d.el);
    sphereFlash(p, col, 2.3, 0.55);
    shockwave(groundAt(d.tgt), col, 6, 0.8);
    burst(FX.add, p, 140, { c0: 0xffffff, c1: col, speed: 10, life: 0.9, size: 0.3, size2: 0.05, drag: 1.2 });
    fxLight(p, col, 50, 0.8, 22);
    screenFlash(ELEMENT_COLORS[d.el], 0.3);
  },
  nuke(d) {
    const g = groundAt(d.tgt), p = anchor(d.tgt, 0.5);
    const s = d.resisted ? 0.6 : 1;
    const col = elColor(d.el);
    if (d.el === "fire") fireBurst(p, s * 1.1);
    else if (d.el === "ice") { shards(g, 0x9fe8ff, Math.round(9 * s)); burst(FX.add, p, 40, { c0: 0xffffff, c1: 0x81d4fa, speed: 3, life: 0.8, size: 0.15, grav: 1 }); shockwave(g, 0xbfefff, 2.5, 0.6); fxLight(p, 0x9fe8ff, 18, 0.6, 12); }
    else if (d.el === "earth") { rocks(g, 0xb8a080); shockwave(g, 0xd7b46a, 2.8, 0.6); fxLight(p, 0xd7b46a, 10, 0.5, 10); }
    else if (d.el === "wind") { swirl(g, 0x9ccc65, 0.8, 2.6, 260 * s); const cone = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.4, 3, 20, 1, true), basicMat(0xcff5a0, 0.35, FX.pillarTex)); cone.position.set(g.x, g.y + 1.5, g.z); addItem(cone, 0.8, k => { cone.rotation.y += 0.35; cone.material.opacity = 0.35 * (1 - k); cone.scale.set(1 + k * 0.5, 1, 1 + k * 0.5); }); fxLight(p, 0x9ccc65, 8, 0.6, 10); }
    else if (d.el === "water") { splash(g, 0x4fc3f7, s); fxLight(p, 0x4fc3f7, 12, 0.6, 12); }
    else if (d.el === "lightning") { lightningBolt(p, 0xe8d8ff); setTimeout(() => FX.ready && lightningBolt(p, 0xd0b8ff), 90); burst(FX.add, p, 50, { c0: 0xffffff, c1: 0xb080ff, speed: 8, life: 0.35, size: 0.12, grav: 5 }); fxLight(p, 0xc8b0ff, 60, 0.35, 26); screenFlash("#d8c8ff", 0.25); }
    else if (d.el === "light") {
      pillar(g, 0xfff3b0, d.dia ? 0.35 : 0.55, 12, d.dia ? 0.7 : 0.9, 0.5);
      for (let i = 0; i < (d.dia ? 30 : 60); i++) FX.add.spawn(g.x + rnd(-0.6, 0.6), g.y + rnd(2, 6), g.z + rnd(-0.6, 0.6), 0, rnd(-4, -2), 0, rnd(0.6, 1), 0.2, 0.05, C(0xffffff), C(0xffe080), 0, 0, 1);
      fxLight(p, 0xfff0c0, d.dia ? 10 : 20, 0.6, 12);
    }
    else burst(FX.add, p, 40, { c0: col, speed: 4, life: 0.6, size: 0.2 });
  },
  cast(d) {
    const p = groundAt(d.src);
    const col = d.sp.kind === "heal" ? 0x9ef5a6 : ELEMENT_COLORS[d.sp.element] || "#ffffff";
    burst(FX.add, p, 20, { c0: col, speed: 2, life: 0.6, size: 0.15, shape: "ring", radius: 0.6, vy: 1.5 });
  },
  cure(d) {
    const g = groundAt(d.tgt), p = anchor(d.tgt, 0.5);
    pillar(g, 0xa8ffc0, 0.55, 3.5, 0.9, 0.6);
    for (let i = 0; i < (d.big ? 90 : 55); i++) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.2, 0.8);
      FX.add.spawn(g.x + Math.cos(a) * r, g.y + rnd(0, 0.5), g.z + Math.sin(a) * r, -Math.sin(a) * 0.6, rnd(1.5, 3.5), Math.cos(a) * 0.6, rnd(0.8, 1.3), 0.2, 0.04, C(0xffffff), C(0x7cff9a), 0, 0.5, 1);
    }
    shockwave(g, 0x9ef5a6, 1.8, 0.7);
    fxLight(p, 0x9ef5a6, 10, 0.7, 10);
  },
  provoke(d) {
    const from = anchor(d.src, 0.7), to = anchor(d.tgt, 0.7);
    const dir = new THREE.Vector3().subVectors(to, from);
    for (let i = 0; i < 40; i++) { const k = Math.random(); const q = from.clone().addScaledVector(dir, k); FX.add.spawn(q.x, q.y, q.z, rnd(-0.6, 0.6), rnd(-0.3, 0.6), rnd(-0.6, 0.6), 0.5, 0.18, 0.05, C(0xff8070), C(0xff2020), 0, 1, 1); }
    sprite(to, 0xff4030, 1.6, 0.4, 0.6);
    shockwave(groundAt(d.src), 0xff5040, 2.2, 0.5);
  },
  buff(d) {
    const g = groundAt(d.tgt);
    const col = d.id === "berserk" ? 0xff5030 : d.id === "elemental_seal" ? 0x9070ff : 0xffe070;
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 6, 32), basicMat(col, 0.9));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g);
      addItem(ring, 0.8, k => { const kk = clamp(k * 1.2 - r * 0.2, 0, 1); ring.position.y = g.y + kk * 2.2; ring.material.opacity = 0.9 * (1 - kk); ring.scale.setScalar(1 - kk * 0.3); });
    }
    burst(FX.add, g, 30, { c0: 0xffffff, c1: col, speed: 1.5, life: 0.8, size: 0.14, shape: "up", vy: 2, radius: 0.6 });
  },
  tpmove(d) {
    const name = d.mv.name, from = anchor(d.src, 0.7), to = anchor(d.tgt, 0.5), g = groundAt(d.tgt);
    if (name === "Bomb Toss") projectile(from, to, 0xff8040, 0.42, () => { fireBurst(to, 1.2); shockwave(g, 0xff7043, (d.mv.aoe || 60) * U * 2, 0.6); });
    else if (name === "Wing Slap") { burst(FX.add, to, 50, { c0: 0xe8e0ff, c1: 0x8a70c0, speed: 5, life: 0.4, size: 0.18 }); slashArc(d.src, d.tgt, 0xc0a8ff, true); }
    else if (name === "Sand Spit") {
      for (let i = 0; i < 60; i++) { const k = Math.random() * 0.3; FX.smoke.spawn(from.x, from.y, from.z, (to.x - from.x) * rnd(1.8, 2.6), (to.y - from.y) * 2 + rnd(0, 2), (to.z - from.z) * rnd(1.8, 2.6), rnd(0.5, 0.8), 0.25, 0.7, C(0xc8a870), C(0x8a7050), 4, 0.5, 0.7); }
      setTimeout(() => FX.ready && burst(FX.smoke, g, 40, { c0: 0xc8a870, c1: 0x8a7050, speed: 3, life: 1, size: 0.6, size2: 1.4, shape: "dome", drag: 2, alpha: 0.6 }), 280);
    } else if (name === "Vampiric Claw") {
      for (let i = 0; i < 3; i++) setTimeout(() => FX.ready && slashArc(d.src, d.tgt, 0xff3040, true), i * 90);
      const back = new THREE.Vector3().subVectors(from, to);
      for (let i = 0; i < 40; i++) FX.add.spawn(to.x + rnd(-0.3, 0.3), to.y + rnd(-0.3, 0.3), to.z + rnd(-0.3, 0.3), back.x * rnd(1, 1.6), back.y * rnd(1, 1.6), back.z * rnd(1, 1.6), 0.7, 0.16, 0.05, C(0xff6060), C(0xa00010), 0, 0, 1);
    } else if (name === "Goblin Rush") {
      for (let i = 0; i < 3; i++) setTimeout(() => { if (!FX.ready) return; slashArc(d.src, d.tgt, 0xfff0d0, i === 2); burst(FX.add, to, 20, { c0: 0xffffff, c1: 0xffd080, speed: 5, life: 0.3, size: 0.12, grav: 5 }); }, i * 140);
    } else {
      burst(FX.add, to, 40, { c0: 0xffffff, c1: 0xff8a65, speed: 5, life: 0.4, size: 0.16, grav: 5 });
      sprite(to, 0xff8a65, 1.4, 0.25, 1);
      shockwave(g, 0xff8a65, 2.4, 0.45);
    }
  },
  defeat(d) {
    const p = anchor(d.tgt, 0.4);
    setTimeout(() => {
      if (!FX.ready) return;
      burst(FX.smoke, p, 26, { c0: 0x6a6a72, c1: 0x2a2a30, speed: 1.2, life: 1.4, size: 0.8, size2: 1.8, grav: -0.8, drag: 1.5, alpha: 0.5 });
      for (let i = 0; i < 18; i++) FX.add.spawn(p.x + rnd(-0.4, 0.4), p.y + rnd(0, 0.6), p.z + rnd(-0.4, 0.4), rnd(-0.2, 0.2), rnd(1, 2.2), rnd(-0.2, 0.2), rnd(1.2, 1.8), 0.16, 0.04, C(0xd8f0ff), C(0x6090ff), -0.5, 0.4, 0.9);
    }, 1400);
  },
  ko(d) { burst(FX.smoke, groundAt(d.tgt), 14, { c0: 0x9a8a70, speed: 1.5, life: 0.8, size: 0.5, size2: 1.0, shape: "ring", drag: 2, alpha: 0.4 }); },
  levelup(d) {
    const g = groundAt(d.tgt), p = anchor(d.tgt, 0.5);
    pillar(g, 0xffd54f, 0.7, 9, 1.6, 1);
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.04, 6, 36), basicMat(0xffe080, 0.9));
      ring.rotation.x = Math.PI / 2;
      ring.position.copy(g);
      addItem(ring, 1.4, k => { const kk = clamp(k * 1.3 - r * 0.15, 0, 1); ring.position.y = g.y + kk * 3; ring.material.opacity = 0.9 * (1 - kk); });
    }
    burst(FX.add, g, 120, { c0: 0xffffff, c1: 0xffc030, speed: 5, life: 1.4, size: 0.18, shape: "up", vy: 4, grav: 4, radius: 0.8 });
    fxLight(p, 0xffd060, 25, 1.4, 16);
    screenFlash("#ffe08a", 0.25);
  },
  potion(d) {
    const g = groundAt(d.tgt);
    const col = d.mp ? 0x64b5f6 : 0x8cf0a0;
    for (let i = 0; i < 30; i++) FX.add.spawn(g.x + rnd(-0.4, 0.4), g.y + rnd(0.2, 1.2), g.z + rnd(-0.4, 0.4), 0, rnd(0.8, 1.8), 0, rnd(0.7, 1.1), 0.12, 0.2, C(0xffffff), C(col), 0, 0, 0.9);
  },
  crystal(d) {
    const g = new THREE.Vector3(d.at.x * U, groundY(d.at.x, d.at.y) + 1.6, d.at.y * U);
    burst(FX.add, g, 80, { c0: 0xffffff, c1: 0x60e0ff, speed: 3, life: 1.2, size: 0.18, shape: "up", vy: 2, radius: 0.8 });
    shockwave(new THREE.Vector3(g.x, g.y - 1.55, g.z), 0x80deea, 4, 0.9);
  },
  interrupt(d) { burst(FX.smoke, anchor(d.tgt, 0.8), 10, { c0: 0xbbbbbb, speed: 1.5, life: 0.5, size: 0.3, size2: 0.6, alpha: 0.4 }); },
  mount(d) {
    const g = groundAt(d.tgt);
    burst(FX.smoke, g, 26, { c0: 0xc8b090, speed: 2.5, life: 0.9, size: 0.6, size2: 1.2, shape: "ring", drag: 2, alpha: 0.45 });
    for (let i = 0; i < 16; i++) FX.add.spawn(g.x + rnd(-0.8, 0.8), g.y + rnd(0.5, 2), g.z + rnd(-0.8, 0.8), rnd(-1, 1), rnd(0, 1.5), rnd(-1, 1), rnd(1, 1.6), 0.14, 0.06, C(0x9ff8f0), C(0x40c0b0), 1, 1, 1);
  },
  aggro() {}
};

function vfx(type, d) {
  if (!FX.ready || !VFX[type]) return;
  try { VFX[type](d); } catch (err) {}
}

function fxFootstep(e, v) {
  if (e === player && !player.mounted && S.zone.theme !== "house") sfx("step");
  else if (e.kind === "mount" && player.mounted && dist(e, player) < 40) sfx("hoof");
  if (!FX.ready || e.mounted || e.kind === "npc" || S.zone.theme === "house") return;
  if (dist(e, player) > 600) return;
  const g = groundAt(e);
  const col = S.zone.theme === "cave" ? 0x5a5550 : S.zone.theme === "town" ? 0x8a8478 : 0x9a8668;
  burst(FX.smoke, g, 3, { c0: col, speed: 0.6, life: 0.6, size: 0.25, size2: 0.6, shape: "ring", drag: 3, alpha: 0.35 });
}

function updateCastCircles(dt) {
  const seen = new Set();
  for (const e of S.party.concat(S.mobs)) {
    if (!e.casting || e.alive === false) continue;
    seen.add(e);
    let c = FX.circles.get(e);
    const sp = e.casting.sp;
    const col = sp.kind === "heal" ? 0x8cf0a0 : ELEMENT_COLORS[sp.element] || "#ffffff";
    if (!c) {
      c = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), basicMat(col, 0, FX.runeTex));
      c.rotation.x = -Math.PI / 2;
      c.renderOrder = 4;
      W3.fxRoot.add(c);
      FX.circles.set(e, c);
    }
    const k = (S.time - e.casting.start) / (e.casting.end - e.casting.start);
    c.position.set(e.x * U, groundY(e.x, e.y) + 0.06, e.y * U);
    c.rotation.z += dt * 1.2;
    c.material.opacity = Math.min(0.9, (S.time - e.casting.start) / 0.3);
    c.scale.setScalar(0.6 + 0.4 * ease(k * 3));
    if (Math.random() < dt * 30) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.4, 1.2);
      FX.add.spawn(c.position.x + Math.cos(a) * r, c.position.y, c.position.z + Math.sin(a) * r, 0, rnd(1, 2.4), 0, 0.8, 0.12, 0.03, C(0xffffff), C(col), 0, 0, 0.9);
    }
    if (Math.random() < dt * 10) {
      const v = VIEW.views.get(e);
      if (v && v.bones.handL) {
        const hp = new THREE.Vector3(); v.bones.handL.getWorldPosition(hp);
        FX.add.spawn(hp.x, hp.y, hp.z, rnd(-0.3, 0.3), rnd(0.2, 0.8), rnd(-0.3, 0.3), 0.4, 0.14, 0.02, C(0xffffff), C(col), 0, 0, 1);
      }
    }
  }
  for (const [e, c] of FX.circles) {
    if (seen.has(e)) continue;
    c.material.opacity -= dt * 3;
    c.scale.multiplyScalar(1 + dt * 2);
    if (c.material.opacity <= 0) { W3.fxRoot.remove(c); disposeTree(c); FX.circles.delete(e); }
  }
}

function updateAuras(dt) {
  for (const m of S.mobs) {
    if (!m.alive || dist(m, player) > 700) continue;
    if (m.fam.nm && m.fam.aura && Math.random() < dt * 14) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.4, 1.0) * (m.fam.scale || 1);
      const g = groundAt(m);
      FX.add.spawn(g.x + Math.cos(a) * r, g.y + rnd(0, 0.4), g.z + Math.sin(a) * r, 0, rnd(0.6, 1.6), 0, rnd(1, 1.6), 0.22, 0.05, C(0xffffff), C(m.fam.aura), -0.2, 0.3, 0.8);
    }
    if (m.readying && Math.random() < dt * 40) {
      const a = Math.random() * Math.PI * 2, r = rnd(0.6, 1.1);
      const p = anchor(m, 0.5);
      FX.add.spawn(p.x + Math.cos(a) * r, p.y + rnd(-0.6, 0.6), p.z + Math.sin(a) * r, -Math.cos(a) * r * 2, 0, -Math.sin(a) * r * 2, 0.45, 0.16, 0.04, C(0xffc080), C(0xff4020), 0, 0, 1);
    }
  }
  for (const p of S.party) {
    if (!p.alive || !p.regenerating || Math.random() > dt * 3) continue;
    const g = groundAt(p);
    FX.add.spawn(g.x + rnd(-0.4, 0.4), g.y + rnd(0.2, 1.4), g.z + rnd(-0.4, 0.4), 0, rnd(0.4, 0.9), 0, 1.2, 0.1, 0.02, C(0xd8ffd8), C(0x7cdc8a), 0, 0, 0.6);
  }
}

function updateFX(dt) {
  if (!FX.ready) return;
  const h = W3.renderer.domElement.height;
  const sc = h / (2 * Math.tan(THREE.MathUtils.degToRad(W3.camera.fov) / 2));
  FX.add.mat.uniforms.scale.value = sc;
  FX.smoke.mat.uniforms.scale.value = sc;
  for (let i = FX.items.length - 1; i >= 0; i--) {
    const it = FX.items[i];
    it.t += dt;
    const k = Math.min(1, it.t / it.life);
    it.update(k, dt);
    if (it.t >= it.life) { W3.fxRoot.remove(it.obj); disposeTree(it.obj); FX.items.splice(i, 1); }
  }
  for (const L of FX.lights) {
    if (L.intensity <= 0) continue;
    L.userData.t += dt;
    const k = L.userData.t / L.userData.life;
    L.intensity = k >= 1 ? 0 : L.userData.peak * (1 - k) * (1 - k);
  }
  updateCastCircles(dt);
  updateAuras(dt);
  FX.add.update(dt);
  FX.smoke.update(dt);
}

function updateTrail(v, e, dt) {
  const w = v.weapon;
  const an = v.an;
  const active = w && v.weaponDrawn && an && ((S.time - an.aStart) < 0.45 || (S.time - an.wsStart) < 0.75) && w.userData.kind !== "staff";
  if (!v.trail) {
    const n = 14;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 2 * 4), 4).setUsage(THREE.DynamicDrawUsage));
    const idx = [];
    for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    m.frustumCulled = false;
    W3.fxRoot.add(m);
    v.trail = { mesh: m, n, pts: [], active: false };
  }
  const T = v.trail;
  if (!active) { if (T.pts.length) { T.pts.shift(); T.pts.shift(); } }
  else {
    const tip = new THREE.Vector3(0, w.userData.tip[1], 0).applyMatrix4(w.matrixWorld);
    const base = new THREE.Vector3(0, w.userData.tip[0], 0).applyMatrix4(w.matrixWorld);
    T.pts.push([base, tip]);
    while (T.pts.length > T.n) T.pts.shift();
  }
  const pos = T.mesh.geometry.attributes.position, col = T.mesh.geometry.attributes.color;
  const gold = an && (S.time - an.wsStart) < 0.75;
  const c = gold ? C(0xffd060) : C(0xcfe4ff);
  const L = T.pts.length;
  T.mesh.visible = L > 1;
  for (let i = 0; i < T.n; i++) {
    const pr = T.pts[Math.min(i, L - 1)] || [new THREE.Vector3(), new THREE.Vector3()];
    pos.setXYZ(i * 2, pr[0].x, pr[0].y, pr[0].z);
    pos.setXYZ(i * 2 + 1, pr[1].x, pr[1].y, pr[1].z);
    const a = i < L ? (i / Math.max(1, L - 1)) * 0.8 : 0;
    col.setXYZW(i * 2, c.r, c.g, c.b, a * 0.3);
    col.setXYZW(i * 2 + 1, c.r, c.g, c.b, a);
  }
  pos.needsUpdate = true; col.needsUpdate = true;
}
