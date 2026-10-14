function styleFor(e) {
  if (isMob(e)) {
    const m = e.fam.model;
    if (m === "goblin" || m === "chieftain") return { hunch: true, hop: true };
    if (m === "ghoul") return { hunch: true, prowl: true, claws: true };
    if (m === "treant") return { hunch: true, prowl: true, claws: true };
    if (m === "fishfolk") return { hunch: true };
    if (m === "orc") return { hunch: true, hop: false };
  }
  return {};
}

function destroyView(v) {
  W3.scene.remove(v.group);
  if (v.crystal) { disposeTree(v.group); return; }
  if (v.mat) v.mat.dispose();
  if (v.pick) { v.pick.geometry.dispose(); v.pick.material.dispose(); }
  if (v.trail) { W3.fxRoot.remove(v.trail.mesh); v.trail.mesh.geometry.dispose(); v.trail.mesh.material.dispose(); }
  if (v.mount) { W3.scene.remove(v.mount.group); v.mount.mat.dispose(); }
}

function blobGeo() { return VIEW.blobGeo || (VIEW.blobGeo = new THREE.PlaneGeometry(2, 2)); }
function blobMat() {
  if (VIEW.blobMat) return VIEW.blobMat;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  gr.addColorStop(0, "rgba(0,0,0,0.75)"); gr.addColorStop(0.55, "rgba(0,0,0,0.4)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  VIEW.blobMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, opacity: W3.quality === "low" ? 0.7 : 0.35, polygonOffset: true, polygonOffsetFactor: -2 });
  return VIEW.blobMat;
}

function viewFor(e) {
  let v = VIEW.views.get(e);
  const sig = rigSigFor(e);
  if (v && v.sig === sig) return v;
  if (v) { destroyView(v); VIEW.views.delete(e); }
  const inst = buildEntityRig(e);
  if (!inst) return null;
  const group = new THREE.Group();
  group.add(inst.mesh);
  const s = isMob(e) ? (e.fam.scale || 1) * (e.fam.nm ? 1 : 1 + ((hashStr("sz" + e.id) % 13) - 6) / 100) : e.buddy ? (BUDDIES[e.petId].scale || 0.6) : e.ambient ? (e.scale || 1) : 1;
  group.scale.setScalar(s);
  const hitR = Math.max(0.55, (e.radius || 14) * U * 1.1 / s);
  const top = inst.meta.headTop || 2;
  const pick = new THREE.Mesh(new THREE.CylinderGeometry(hitR, hitR, top, 8), new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.y = top / 2;
  pick.userData.entity = e;
  group.add(pick);
  if (!(e.kind === "npc" && (e.prop || e.crystal)) && inst.meta.kind !== "bat" && inst.meta.kind !== "bee") {
    const br = Math.max(0.35, (e.radius || 14) * U * 1.25 / s);
    const blob = new THREE.Mesh(blobGeo(), blobMat());
    blob.rotation.x = -Math.PI / 2;
    blob.position.y = 0.03;
    blob.scale.set(br, br * (inst.meta.kind === "crawler" || inst.meta.kind === "worm" || inst.meta.kind === "quad" ? 1.8 : 1), 1);
    blob.renderOrder = 1;
    group.add(blob);
  }
  const kind = inst.meta.kind;
  v = {
    group, mesh: inst.mesh, bones: inst.bones, mat: inst.mat, meta: inst.meta, sig, pick, kind,
    lodEntry: inst.lodEntry, lo: null,
    weapon: inst.weapon, weaponKind: inst.weaponKind, alwaysDrawn: inst.alwaysDrawn, weaponDrawn: null,
    style: styleFor(e), stride: inst.meta.race === "pipkin" ? 1.05 : inst.meta.race === "ursan" ? 2.05 : inst.meta.race === "elari" ? 1.85 : kind === "bird" ? 0.4 : kind === "hare" ? 1.2 : kind === "quad" ? (inst.meta.quad.stride || 1.2) : kind === "crawler" || kind === "crab" ? 0.9 : 1.7, scale: s, mount: null, sink: 0
  };
  if (isMob(e) || e.buddy) v.an = null;
  if (e.buddy || e.ambient) { v.pick.visible = false; v.pick.userData.entity = null; }
  W3.scene.add(group);
  VIEW.views.set(e, v);
  return v;
}

function clearViews() {
  for (const v of VIEW.views.values()) destroyView(v);
  VIEW.views.clear();
  for (const el of VIEW.labels.values()) el.remove();
  VIEW.labels.clear();
  for (const f of VIEW.floaters.keys()) if (f.el) f.el.remove();
  VIEW.floaters.clear();
  if (VIEW.decor) { W3.scene.remove(VIEW.decor.group); VIEW.decor.mat.dispose(); VIEW.decor = null; }
  clearFX();
}

function placeWeapon(v, e) {
  if (!v.weapon || !v.bones.handR) return;
  const an = v.an;
  const busy = an && (S.time - an.aStart < 0.6 || S.time - an.wsStart < 1.1);
  const drawn = e.alive !== false && (v.alwaysDrawn || e.engaged || !!e.casting || busy || (isMob(e) && e.state === "combat") || isMob(e)) && !e.mounted;
  if (drawn === v.weaponDrawn) return;
  v.weaponDrawn = drawn;
  const w = v.weapon, k = w.userData.kind;
  if (drawn) {
    v.bones.handR.add(w);
    w.position.set(0, -0.06, 0.01);
    if (k === "staff") w.rotation.set(0.2, 0, 0);
    else if (k === "archery") w.rotation.set(0, 0, 0.1);
    else if (k === "greataxe" || k === "scythe") w.rotation.set(Math.PI / 2 - 0.5, 0, 0);
    else w.rotation.set(Math.PI / 2 - 0.25, 0, 0);
  } else {
    v.bones.chest.add(w);
    const bz = v.meta.backZ || -0.15;
    if (k === "staff" || k === "greataxe" || k === "scythe") { w.position.set(0, -0.05, bz); w.rotation.set(0, 0, 0.65); }
    else { w.position.set(0.04, 0.0, bz); w.rotation.set(0, 0, Math.PI + 0.55); }
  }
}

const SLOPE_KINDS = { crawler: 1, worm: 1, quad: 1, crab: 1, fish: 1, hare: 1 };
function footGround(e) {
  const r = Math.max(4, (e.radius || 14) * 0.55);
  let g = groundY(e.x, e.y);
  for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const h = groundY(e.x + dx, e.y + dy); if (h > g) g = h; }
  return g;
}

const LOD_DIST = { low: 16, medium: 24, high: 32 };
function updateLod(v, e) {
  if (!v.lodEntry || e === player || !W3.camera) return;
  const dx = v.group.position.x - W3.camera.position.x, dz = v.group.position.z - W3.camera.position.z;
  const lim = (LOD_DIST[W3.quality] || 24) * (v.scale || 1), d2 = dx * dx + dz * dz;
  const far = v.lo && v.lo.visible ? d2 > (lim * 0.9) * (lim * 0.9) : d2 > lim * lim;
  if (far && !v.lo) {
    try {
      const entry = v.lodEntry();
      if (entry.defs.length !== v.mesh.skeleton.bones.length) { v.lodEntry = null; return; }
      const m = new THREE.SkinnedMesh(entry.geo, v.mesh.material);
      m.bind(v.mesh.skeleton, v.mesh.bindMatrix);
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = v.mesh.frustumCulled;
      v.mesh.parent.add(m);
      v.lo = m;
    } catch (err) { v.lodEntry = null; return; }
  }
  if (v.lo) { v.lo.visible = far; v.mesh.visible = !far; }
}
function syncEntity(e, dt) {
  const v = viewFor(e);
  if (!v) return;
  const g = v.group;
  if (isMob(e) && player && player.target !== e && dist(e, player) > DRAW_DIST[(VIEW.settings && VIEW.settings.draw) || "normal"]) { g.visible = false; return; }
  updateLod(v, e);
  const gy = footGround(e) + (e === player && typeof jumpHeight === "function" ? jumpHeight(e) : 0);
  const dead = e.alive === false;
  if (!dead || e.kind === "npc") {
    const yawT = Math.PI / 2 - (e.face || 0);
    g.rotation.y += normAng(yawT - g.rotation.y) * Math.min(1, dt * 12);
  }
  if (e.mounted && !dead) {
    const coat = e.coat || save.mountCoat || "teal";
    if (v.mount && v.mount.coat !== coat) { W3.scene.remove(v.mount.group); v.mount.mat.dispose(); v.mount = null; }
    if (!v.mount) {
      const mi = buildMount(coat);
      const mg = new THREE.Group();
      mg.add(mi.mesh);
      v.mount = { group: mg, mesh: mi.mesh, bones: mi.bones, mat: mi.mat, meta: mi.meta, coat };
      W3.scene.add(mg);
    }
    const M = v.mount;
    M.group.position.set(e.x * U, gy, e.y * U);
    M.group.rotation.y = g.rotation.y;
    poseRaptor(M, v.an ? v.an.spd : 0, dt);
    M.group.updateMatrixWorld(true);
    const sp = new THREE.Vector3();
    M.bones.saddle.getWorldPosition(sp);
    g.position.set(sp.x, sp.y - v.meta.hipsY + 0.08, sp.z);
    if (v.an && v.an.spd > 3 && Math.random() < dt * 6) fxFootstep({ x: e.x, y: e.y, kind: "mount", mounted: false }, M);
  } else {
    if (v.mount) { W3.scene.remove(v.mount.group); v.mount.mat.dispose(); v.mount = null; }
    let y = gy;
    if (SLOPE_KINDS[v.kind] && !dead) {
      if (v.halfLen == null) { const geo = v.mesh && v.mesh.geometry; if (geo) { if (!geo.boundingBox) geo.computeBoundingBox(); v.halfLen = Math.max(0.2, (geo.boundingBox.max.z - geo.boundingBox.min.z) * 0.42 * (v.scale || 1)); } else v.halfLen = 0.4; }
      const hl = v.halfLen / U, cf = Math.cos(e.face || 0), sf = Math.sin(e.face || 0);
      const gf = groundY(e.x + cf * hl, e.y + sf * hl), gb = groundY(e.x - cf * hl, e.y - sf * hl);
      const pitch = clamp(-Math.atan2(gf - gb, 2 * v.halfLen), -0.6, 0.6);
      g.rotation.order = "YXZ";
      g.rotation.x += (pitch - g.rotation.x) * Math.min(1, dt * 8);
      y = Math.max(gy - 0.02, Math.max(gf, gb) - Math.abs(Math.sin(g.rotation.x)) * v.halfLen * 0.9);
    } else if (g.rotation.x) g.rotation.x *= 0.8;
    g.position.set(e.x * U, y, e.y * U);
  }
  if (isMob(e) && dead) {
    const k = (S.time - e.deadAt - 1.4) / 1.0;
    g.position.y -= clamp(k, 0, 1) * 1.2;
    g.visible = !e.despawned && k < 1;
  } else g.visible = !(e === player && VIEW.first) && !((e.kind === "npc" || e.ambient) && e.away);
  if (e.fly) g.position.y += e.fly + Math.sin(S.time * 0.8 + (e.home ? e.home.x : 0)) * 0.6;
  if (v.kind === "human") poseHuman(v, e, dt);
  else if (v.kind === "bat") poseBat(v, e, dt);
  else if (v.kind === "worm") poseWorm(v, e, dt);
  else if (v.kind === "hare") poseHare(v, e, dt);
  else if (v.kind === "bee") poseBee(v, e, dt);
  else if (v.kind === "bird") poseBird(v, e, dt);
  else if (v.kind === "crawler") poseCrawler(v, e, dt);
  else if (v.kind === "quad") poseQuad(v, e, dt);
  else if (v.kind === "crab") poseCrab(v, e, dt);
  else if (v.kind === "mandrake") poseMandrake(v, e, dt);
  else if (v.kind === "shroom") poseShroom(v, e, dt);
  else if (v.kind === "fish") poseFish(v, e, dt);
  placeWeapon(v, e);
  if (v.weapon && v.weaponKind !== "staff") updateTrail(v, e, dt);
  const flash = e.flash > 0 ? e.flash / 0.15 : 0;
  v.mat.emissive.setRGB(flash, flash * 0.95, flash * 0.9);
  v.mat.emissiveIntensity = flash * 0.5;
}

function entityHeight(e) {
  const v = VIEW.views.get(e);
  if (e.kind === "npc" && e.crystal) return 3.4;
  if (e.kind === "npc" && e.prop) { const v = VIEW.views.get(e); return v ? v.meta.headTop : 2; }
  let h = v ? v.meta.headTop * v.scale : 2.0;
  if (e.mounted && v && v.mount) h += v.group.position.y - groundY(e.x, e.y);
  return h;
}

function npcCrystalView(e) {
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: 0x9ff3ff, emissive: 0x40d8ff, emissiveIntensity: 0.55, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.9 }));
  c.scale.y = 1.7;
  c.position.y = 2.0;
  const bt = texBricks();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8), std({ map: bt.map, normalMap: bt.normalMap }));
  base.position.y = 0.2;
  base.receiveShadow = true;
  const L = new THREE.PointLight(0x60e0ff, 4, 12, 1.6);
  L.position.y = 2;
  g.add(c, base, L);
  return { g, spin: c };
}

function propView(n) {
  const g = new THREE.Group();
  const bt = texBricks();
  const stone = std({ map: bt.map, normalMap: bt.normalMap, color: 0x8a8894 });
  const v = { group: g, meta: { headTop: 2.0 }, scale: 1, sig: "prop:" + n.prop, prop: true, mat: null };
  if (n.prop === "brazier") {
    const col = new THREE.Color(ELEMENT_COLORS[n.element] || "#ffa040");
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.1, 8), stone); ped.position.y = 0.55; ped.castShadow = true;
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.45, 0.5, 12, 1, true), std({ color: { fire: 0x3a2a22, wind: 0xa8a8b0, earth: 0x6a6258, water: 0x3a6a62 }[n.element] || 0x444, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide })); bowl.position.y = 1.3;
    const coals = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.1, 12), std({ color: 0x2a2420 })); coals.position.y = 1.35;
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 10), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 })); flame.position.y = 2.1;
    const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 8), new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.85 })); flame2.position.y = 2.0;
    const L = new THREE.PointLight(col, 10, 16, 1.5); L.position.y = 2.2;
    g.add(ped, bowl, coals, flame, flame2, L);
    v.flame = [flame, flame2]; v.light = L; v.meta.headTop = 2.6;
  } else if (n.prop === "board") {
    const wood = std({ color: 0x6a4a2a, roughness: 0.85 });
    for (const sx of [-0.8, 0.8]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.2, 0.14), wood); post.position.set(sx, 1.1, 0); post.castShadow = true; g.add(post); }
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 0.08), std({ color: 0x8a6a42, roughness: 0.9 })); plank.position.set(0, 1.55, 0.04); plank.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.45), wood); roof.position.set(0, 2.2, 0.08); roof.rotation.x = -0.25;
    g.add(plank, roof);
    const cols = [0xf2ead8, 0xe8dcc0, 0xf8f0e0, 0xead8b8, 0xf0e4cc];
    for (let i = 0; i < 6; i++) { const note = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.42), std({ color: cols[i % cols.length], roughness: 1 })); note.position.set(-0.6 + (i % 3) * 0.6, 1.8 - Math.floor(i / 3) * 0.5, 0.09); note.rotation.z = (i * 0.37 % 0.3) - 0.15; g.add(note); }
    v.meta.headTop = 2.4;
  } else if (n.prop === "tablet") {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.3), stone); slab.position.y = 1.1; slab.castShadow = true;
    const runes = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.6), new THREE.MeshBasicMaterial({ color: 0x80cbc4, transparent: true, opacity: 0.35 })); runes.position.set(0, 1.15, 0.16);
    const L = new THREE.PointLight(0x80cbc4, 3, 8, 1.6); L.position.set(0, 1.2, 0.6);
    g.add(slab, runes, L);
    v.meta.headTop = 2.4;
  } else if (n.prop === "chest") {
    const wood = std({ color: n.chest === "king" ? 0x5a3a2a : 0x6a4a2a, roughness: 0.8 });
    const metal = std({ color: n.chest === "king" ? 0xd8b040 : 0x8a8a90, metalness: 0.7, roughness: 0.4 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.7, 0.8), wood); box.position.y = 0.35; box.castShadow = true;
    const lid = new THREE.Group();
    const lidM = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.3, 10, 1, false, 0, Math.PI), wood); lidM.rotation.z = Math.PI / 2; lidM.position.set(0, 0, 0.4);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.41, 0.03, 6, 14, Math.PI), metal); band.rotation.y = Math.PI / 2; band.position.set(0, 0, 0.4);
    lid.add(lidM, band);
    lid.position.set(0, 0.7, -0.4);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.08), metal); lock.position.set(0, 0.55, 0.42);
    for (const sgn of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.84), metal); strap.position.set(sgn * 0.45, 0.35, 0); g.add(strap); }
    g.add(box, lid, lock);
    v.lid = lid; v.meta.headTop = 1.4;
    if (n.chest === "king") { const chain = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 6, 20), std({ color: 0xcfd8dc, emissive: 0x80cbc4, emissiveIntensity: 0.4 })); chain.rotation.x = Math.PI / 2; chain.position.y = 0.8; chain.scale.set(1.1, 1, 0.7); g.add(chain); v.chain = chain; }
  } else if (n.prop === "lookout") {
    const wood = std({ color: 0x6a4a2a, roughness: 0.9 });
    for (const [px, pz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 4.6, 6), wood); post.position.set(px, 2.3, pz); post.castShadow = true; g.add(post); }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.14, 2.3), wood); deck.position.y = 3.6; deck.castShadow = true;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.1, 4), std({ color: 0x5a3a2a })); roof.position.y = 5.1; roof.rotation.y = Math.PI / 4; roof.castShadow = true;
    for (let i = 0; i < 9; i++) { const rung = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.06), wood); rung.position.set(0, 0.35 + i * 0.38, 1.0); g.add(rung); }
    for (const sx of [-0.3, 0.3]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3.6, 0.06), wood); rail.position.set(sx, 1.8, 1.0); g.add(rail); }
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), std({ color: 0xa0302a, side: THREE.DoubleSide })); flag.position.set(0.35, 5.9, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), wood); pole.position.y = 5.6;
    g.add(deck, roof, flag, pole);
    v.meta.headTop = 6.2; v.flag = flag;
  } else if (n.prop === "shrine") {
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.0), stone); base.position.y = 0.25; base.castShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.3), stone); back.position.set(0, 1.2, -0.35); back.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.15, 0.7), stone); cap.position.set(0, 1.95, -0.25);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe8a0 })); orb.position.set(0, 0.85, -0.05);
    const L = new THREE.PointLight(0xffd080, 4, 8, 1.6); L.position.set(0, 1.0, 0.4);
    g.add(base, back, cap, orb, L);
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 6), std({ color: 0xf0e8d0 })); c.position.set(-0.5 + i * 0.25, 0.59, 0.3); g.add(c); const fl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffc060 })); fl.position.set(-0.5 + i * 0.25, 0.71, 0.3); g.add(fl); }
    v.meta.headTop = 2.4; v.light = L;
  } else if (n.prop === "sign") {
    const wood = std({ color: 0x7a5432, roughness: 0.9 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 6), wood); post.position.y = 1.1; post.castShadow = true;
    g.add(post);
    for (let i = 0; i < 2; i++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.05), std({ color: 0x9a7448, roughness: 0.9 })); arm.position.set(i ? -0.35 : 0.35, 1.75 - i * 0.35, 0.06); arm.rotation.y = i ? 0.4 : -0.3; arm.castShadow = true; g.add(arm); }
    v.meta.headTop = 2.3;
  } else if (n.prop === "camp") {
    const canvas = std({ color: 0xc8b890, roughness: 1, side: THREE.DoubleSide });
    const tent = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.6, 4, 1, true), canvas); tent.position.set(0, 0.8, -0.6); tent.rotation.y = Math.PI / 4; tent.castShadow = true;
    const stones = std({ color: 0x6a6660 });
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.13, 0), stones); st.position.set(1.2 + Math.cos(a) * 0.38, 0.08, 0.6 + Math.sin(a) * 0.38); g.add(st); }
    const fire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 7), new THREE.MeshBasicMaterial({ color: 0xff9a40, transparent: true, opacity: 0.9 })); fire.position.set(1.2, 0.3, 0.6);
    const L = new THREE.PointLight(0xff9a50, 6, 10, 1.6); L.position.set(1.2, 0.8, 0.6);
    for (let i = 0; i < 2; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 7), std({ color: 0x5a3a22 })); log.rotation.z = Math.PI / 2; log.position.set(1.2 + (i ? 0 : 0), 0.12, 1.35 - i * 1.5); g.add(log); }
    g.add(tent, fire, L);
    v.campFire = fire; v.light = L; v.meta.headTop = 2.0;
  } else if (n.prop === "throne") {
    v.meta.headTop = 4.5;
  } else if (n.prop === "gather") {
    if (n.gtype === "mining") {
      const rt = texRock();
      const rock = new THREE.Mesh(noisyGeo(new THREE.IcosahedronGeometry(0.8, 1), 0.2, 11), std({ map: rt.map, normalMap: rt.normalMap }));
      rock.position.y = 0.55; rock.castShadow = true;
      g.add(rock);
      for (let i = 0; i < 5; i++) { const ore = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), std({ color: 0xd8a040, emissive: 0xd8a040, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.3 })); const a = i / 5 * Math.PI * 2; ore.position.set(Math.cos(a) * 0.62, 0.5 + Math.sin(i * 2.1) * 0.25, Math.sin(a) * 0.62); g.add(ore); }
      v.meta.headTop = 1.4;
    } else if (n.gtype === "logging") {
      const bark = texBark();
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.7, 10), std({ map: bark.map, normalMap: bark.normalMap })); stump.position.y = 0.35; stump.castShadow = true;
      const top = new THREE.Mesh(new THREE.CircleGeometry(0.42, 10), std({ color: 0xc8a070 })); top.rotation.x = -Math.PI / 2; top.position.y = 0.71;
      g.add(stump, top);
      for (let i = 0; i < 3; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 1.4, 8), std({ map: bark.map, normalMap: bark.normalMap })); lg.rotation.set(0, i * 0.7, Math.PI / 2); lg.position.set(0.5 + i * 0.1, 0.16 + i * 0.26, 0.3 - i * 0.2); g.add(lg); }
      v.meta.headTop = 1.2;
    } else {
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 0.25 + (i % 3) * 0.14; const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9 + (i % 2) * 0.3, 5), std({ color: i % 3 === 0 ? 0x7cb342 : 0x558b2f })); leaf.position.set(Math.cos(a) * r, 0.45, Math.sin(a) * r); leaf.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(leaf); }
      for (let i = 0; i < 4; i++) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), std({ color: [0xffeb3b, 0xf48fb1, 0xffffff, 0xce93d8][i], emissive: 0x332200, emissiveIntensity: 0.3 })); const a = i * 1.6; fl.position.set(Math.cos(a) * 0.3, 0.95 + (i % 2) * 0.15, Math.sin(a) * 0.3); g.add(fl); }
      v.meta.headTop = 1.3;
    }
  } else if (n.prop === "nubbin") {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), std({ color: 0x5a8a3a, roughness: 1 }));
    body.position.y = 0.55; body.castShadow = true;
    const fuzz = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), std({ color: 0x6a9a44, roughness: 1, transparent: true, opacity: 0.45 }));
    fuzz.position.y = 0.55;
    const eyeMat = std({ color: 0x101010 }), whiteMat = std({ color: 0xffffff });
    for (const sgn of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), whiteMat); w.position.set(sgn * 0.18, 0.65, 0.42);
      const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat); p.position.set(sgn * 0.18, 0.66, 0.53);
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), std({ color: 0x4a6a2a })); foot.position.set(sgn * 0.2, 0.1, 0.1); foot.scale.set(1, 0.6, 1.3);
      g.add(w, p, foot);
    }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 10, Math.PI), eyeMat); mouth.position.set(0, 0.45, 0.48); mouth.rotation.x = Math.PI; g.add(mouth);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), std({ color: 0x3a6a2a })); stem.position.y = 1.15;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), std({ color: 0x7ac050 })); leaf.position.set(0.1, 1.3, 0); leaf.scale.set(1.4, 0.5, 0.9);
    g.add(body, fuzz, stem, leaf);
    v.bob = body; v.parts = [fuzz, stem, leaf]; v.meta.headTop = 1.5;
  }
  return v;
}

function syncNpc(n, dt) {
  if (n.prop) {
    let v = VIEW.views.get(n);
    if (!v) {
      v = propView(n);
      const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, v.meta.headTop, 8), new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.y = v.meta.headTop / 2;
      pick.userData.entity = n;
      v.group.add(pick);
      v.pick = pick;
      v.crystal = true;
      W3.scene.add(v.group);
      VIEW.views.set(n, v);
    }
    v.group.position.set(n.x * U, groundY(n.x, n.y), n.y * U);
    if (v.flame) {
      const lit = brazierLit(n.element);
      const k = 0.85 + Math.sin(S.time * 9 + n.x) * 0.1 + Math.sin(S.time * 23) * 0.05;
      v.flame[0].visible = v.flame[1].visible = lit;
      v.flame[0].scale.set(k, 0.9 + Math.sin(S.time * 7) * 0.12, k);
      v.light.intensity = lit ? 8 + Math.sin(S.time * 11) * 2 : 0;
    }
    if (v.campFire) { const k = 0.85 + Math.sin(S.time * 9 + n.x) * 0.12; v.campFire.scale.set(k, 0.9 + Math.sin(S.time * 7) * 0.15, k); v.light.intensity = 5 + Math.sin(S.time * 11) * 1.5; }
    if (v.bob) {
      const b = Math.sin(S.time * 3 + n.x) * 0.05;
      v.group.position.y += Math.max(0, b * 2);
      v.group.scale.set(1 + b * 0.5, 1 - b * 0.5, 1 + b * 0.5);
      const face = Math.atan2(player.y - n.y, player.x - n.x);
      v.group.rotation.y = Math.PI / 2 - face;
    }
    if (v.lid) {
      const st = chestState(n);
      const t = st === "empty" ? -1.9 : 0;
      v.lid.rotation.x += (t - v.lid.rotation.x) * 0.08;
      if (v.chain) v.chain.visible = st === "sealed";
    }
    return;
  }
  if (n.crystal) {
    let v = VIEW.views.get(n);
    if (!v) {
      const cv = npcCrystalView(n);
      const pick = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.4, 8), new THREE.MeshBasicMaterial({ visible: false }));
      pick.position.y = 1.7;
      pick.userData.entity = n;
      cv.g.add(pick);
      v = { group: cv.g, spin: cv.spin, meta: { headTop: 3.4 }, scale: 1, sig: "crystal", pick, crystal: true, mat: null };
      W3.scene.add(cv.g);
      VIEW.views.set(n, v);
    }
    v.group.position.set(n.x * U, groundY(n.x, n.y), n.y * U);
    v.spin.rotation.y += dt * 0.8;
    v.spin.position.y = 2 + Math.sin(S.time * 1.5) * 0.12;
    return;
  }
  syncEntity(n, dt);
}

function syncBeacon() {
  const cp = S.race && RACE.checkpoints[S.race.next];
  if (!cp) { if (VIEW.beacon) VIEW.beacon.visible = false; return; }
  if (!VIEW.beacon || !VIEW.beacon.parent) {
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(RACE.radius * U * 0.5, RACE.radius * U * 0.5, 14, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
    col.position.y = 7;
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(RACE.radius * U * 0.5, 0.12, 6, 32), new THREE.MeshBasicMaterial({ color: 0xffe082 }));
    ringM.rotation.x = Math.PI / 2; ringM.position.y = 0.3;
    g.add(col, ringM);
    VIEW.beacon = g;
    W3.scene.add(g);
  }
  VIEW.beacon.visible = true;
  VIEW.beacon.position.set(cp.x * U, groundY(cp.x, cp.y), cp.y * U);
  VIEW.beacon.children[1].scale.setScalar(1 + Math.sin(S.time * 4) * 0.05);
}

function syncDecor(dt) {
  syncBeacon();
  const st = S.zone.stable;
  if (!st) return;
  if (!VIEW.decor) {
    const mi = buildMount();
    const g = new THREE.Group();
    g.add(mi.mesh);
    g.position.set(st.x * U, groundY(st.x, st.y), st.y * U);
    g.rotation.y = st.rot || 0;
    W3.scene.add(g);
    VIEW.decor = { group: g, mesh: mi.mesh, bones: mi.bones, mat: mi.mat, meta: mi.meta };
  }
  poseRaptor(VIEW.decor, 0, dt);
}

const THUMBS = { cache: new Map(), queue: [], busy: false, studio: null };

function thumbStudio() {
  if (THUMBS.studio) return THUMBS.studio;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x3a4058, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 5, 4); sc.add(key);
  const rim = new THREE.DirectionalLight(0x9fd0ff, 1.2); rim.position.set(-4, 3, -3); sc.add(rim);
  const cam = new THREE.PerspectiveCamera(28, 1, 0.05, 100);
  const T = 128;
  const rt = new THREE.WebGLRenderTarget(T, T, { samples: 4 });
  THUMBS.studio = { sc, cam, rt, T, buf: new Uint8Array(T * T * 4) };
  return THUMBS.studio;
}

function renderThumb(famKey) {
  const st = thumbStudio(), R = W3.renderer;
  const m = buildMob(famKey, 5, 0, 0, null);
  const inst = buildEntityRig(m);
  if (!inst) return null;
  const g = new THREE.Group();
  g.add(inst.mesh);
  if (inst.weapon) inst.mesh.add(inst.weapon);
  g.rotation.y = 0.55;
  st.sc.add(g);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inst.mesh, true);
  const c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const r = Math.max(sz.x * 0.85, sz.y, sz.z * 0.85) * 0.52 + 0.02;
  const d = r / Math.tan(14 * Math.PI / 180);
  st.cam.position.set(c.x + d * 0.35, c.y + d * 0.2, c.z + d * 0.92);
  st.cam.lookAt(c);
  const prev = R.getRenderTarget(), pc = R.getClearColor(new THREE.Color()), pa = R.getClearAlpha(), pe = R.toneMappingExposure;
  R.toneMappingExposure = 1.25;
  R.setRenderTarget(st.rt); R.setClearColor(0x000000, 0); R.clear(); R.render(st.sc, st.cam);
  R.readRenderTargetPixels(st.rt, 0, 0, st.T, st.T, st.buf);
  R.setRenderTarget(prev); R.setClearColor(pc, pa); R.toneMappingExposure = pe;
  st.sc.remove(g);
  inst.mat.dispose();
  const cv = document.createElement("canvas");
  cv.width = cv.height = st.T;
  const g2 = cv.getContext("2d"), img = g2.createImageData(st.T, st.T), T = st.T;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const si = ((T - 1 - y) * T + x) * 4, di = (y * T + x) * 4; img.data[di] = st.buf[si]; img.data[di + 1] = st.buf[si + 1]; img.data[di + 2] = st.buf[si + 2]; img.data[di + 3] = st.buf[si + 3]; }
  g2.putImageData(img, 0, 0);
  return cv.toDataURL("image/png");
}

function beastThumb(famKey, onReady) {
  if (THUMBS.cache.has(famKey)) return THUMBS.cache.get(famKey);
  if (!THUMBS.queue.includes(famKey)) THUMBS.queue.push(famKey);
  if (!THUMBS.busy) {
    THUMBS.busy = true;
    const next = () => {
      const k = THUMBS.queue.shift();
      if (!k) { THUMBS.busy = false; if (onReady) onReady(); return; }
      let url = null;
      try { url = renderThumb(k); } catch (e) { url = null; THUMBS.err = String(e && e.message || e); }
      THUMBS.cache.set(k, url);
      THUMBS.done = (THUMBS.done || 0) + 1;
      if (onReady && (THUMBS.done % 3 === 0 || !THUMBS.queue.length)) onReady();
      if (!THUMBS.queue.length) { THUMBS.busy = false; return; }
      setTimeout(next, 16);
    };
    setTimeout(next, 30);
  }
  return null;
}
