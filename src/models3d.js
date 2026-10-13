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

function footGround(e) {
  const r = Math.max(4, (e.radius || 14) * 0.55);
  let g = groundY(e.x, e.y);
  for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) { const h = groundY(e.x + dx, e.y + dy); if (h > g) g = h; }
  return g;
}

function syncEntity(e, dt) {
  const v = viewFor(e);
  if (!v) return;
  const g = v.group;
  if (isMob(e) && player && player.target !== e && dist(e, player) > 1700) { g.visible = false; return; }
  const gy = footGround(e) + (e === player && typeof jumpHeight === "function" ? jumpHeight(e) : 0);
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
  } else g.visible = !(e === player && VIEW.first) && !(e.kind === "npc" && e.away);
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
  } else if (n.prop === "throne") {
    v.meta.headTop = 4.5;
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
