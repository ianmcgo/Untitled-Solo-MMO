function styleFor(e) {
  if (isMob(e)) {
    const m = e.fam.model;
    if (m === "goblin" || m === "chieftain") return { hunch: true, hop: true };
    if (m === "ghoul") return { hunch: true, prowl: true, claws: true };
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

function viewFor(e) {
  let v = VIEW.views.get(e);
  const sig = rigSigFor(e);
  if (v && v.sig === sig) return v;
  if (v) { destroyView(v); VIEW.views.delete(e); }
  const inst = buildEntityRig(e);
  if (!inst) return null;
  const group = new THREE.Group();
  group.add(inst.mesh);
  const s = isMob(e) ? (e.fam.scale || 1) : 1;
  group.scale.setScalar(s);
  const hitR = Math.max(0.55, (e.radius || 14) * U * 1.1 / s);
  const top = inst.meta.headTop || 2;
  const pick = new THREE.Mesh(new THREE.CylinderGeometry(hitR, hitR, top, 8), new THREE.MeshBasicMaterial({ visible: false }));
  pick.position.y = top / 2;
  pick.userData.entity = e;
  group.add(pick);
  const kind = inst.meta.kind;
  v = {
    group, mesh: inst.mesh, bones: inst.bones, mat: inst.mat, meta: inst.meta, sig, pick, kind,
    weapon: inst.weapon, weaponKind: inst.weaponKind, alwaysDrawn: inst.alwaysDrawn, weaponDrawn: null,
    style: styleFor(e), stride: kind === "hare" ? 1.2 : 1.7, scale: s, mount: null, sink: 0
  };
  if (isMob(e)) v.an = null;
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
    else if (k === "greataxe") w.rotation.set(Math.PI / 2 - 0.5, 0, 0);
    else w.rotation.set(Math.PI / 2 - 0.25, 0, 0);
  } else {
    v.bones.chest.add(w);
    if (k === "staff" || k === "greataxe") { w.position.set(0, -0.05, -0.19); w.rotation.set(0, 0, 0.65); }
    else { w.position.set(0.04, 0.0, -0.18); w.rotation.set(0, 0, Math.PI + 0.55); }
  }
}

function syncEntity(e, dt) {
  const v = viewFor(e);
  if (!v) return;
  const g = v.group;
  const gy = groundY(e.x, e.y) + (e === player && typeof jumpHeight === "function" ? jumpHeight(e) : 0);
  const dead = e.alive === false;
  if (!dead || e.kind === "npc") {
    const yawT = Math.PI / 2 - (e.face || 0);
    g.rotation.y += normAng(yawT - g.rotation.y) * Math.min(1, dt * 12);
  }
  if (e.mounted && !dead) {
    if (!v.mount) {
      const mi = buildMount();
      const mg = new THREE.Group();
      mg.add(mi.mesh);
      v.mount = { group: mg, mesh: mi.mesh, bones: mi.bones, mat: mi.mat, meta: mi.meta };
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
    g.position.set(e.x * U, gy, e.y * U);
  }
  if (isMob(e) && dead) {
    const k = (S.time - e.deadAt - 1.4) / 1.0;
    g.position.y -= clamp(k, 0, 1) * 1.2;
    g.visible = !e.despawned && k < 1;
  } else g.visible = !(e === player && VIEW.first);
  if (v.kind === "human") poseHuman(v, e, dt);
  else if (v.kind === "bat") poseBat(v, e, dt);
  else if (v.kind === "worm") poseWorm(v, e, dt);
  else if (v.kind === "hare") poseHare(v, e, dt);
  placeWeapon(v, e);
  if (v.weapon && v.weaponKind !== "staff") updateTrail(v, e, dt);
  const flash = e.flash > 0 ? e.flash / 0.15 : 0;
  v.mat.emissive.setRGB(flash, flash * 0.95, flash * 0.9);
  v.mat.emissiveIntensity = flash * 0.5;
}

function entityHeight(e) {
  const v = VIEW.views.get(e);
  if (e.kind === "npc" && e.crystal) return 3.4;
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

function syncNpc(n, dt) {
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

function syncDecor(dt) {
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
