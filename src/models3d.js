function styleFor(e) {
  if (isMob(e)) {
    const m = e.fam.model;
    if (m === "goblin" || m === "chieftain") return { hunch: true, hop: true };
    if (m === "ghoul") return { hunch: true, prowl: true, claws: true };
    if (m === "treant") return { hunch: true, heavy: true, claws: true };
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
  if (v.anvilGlow) v.anvilGlow.dispose();
}

function anvilParts() {
  if (VIEW.anvil) return VIEW.anvil;
  const L = c => new THREE.MeshLambertMaterial({ color: c });
  const horn = new THREE.ConeGeometry(0.045, 0.15, 10); horn.rotateZ(-Math.PI / 2);
  return (VIEW.anvil = {
    stump: new THREE.CylinderGeometry(0.13, 0.155, 1, 12), base: new THREE.BoxGeometry(0.26, 0.06, 0.16), waist: new THREE.BoxGeometry(0.13, 0.07, 0.09), face: new THREE.BoxGeometry(0.32, 0.055, 0.14), horn,
    bar: new THREE.BoxGeometry(0.15, 0.022, 0.034), tongs: new THREE.BoxGeometry(0.2, 0.012, 0.012),
    wood: L(0x5a3e28), iron: L(0x3c3e44), dark: L(0x26282c)
  });
}
function addAnvil(group, meta) {
  const P = anvilParts(), g = new THREE.Group(), top = Math.max(0.22, (meta.hipsY || 0.97) * 0.74), sh = top - 0.18;
  const st = new THREE.Mesh(P.stump, P.wood); st.scale.y = sh; st.position.y = sh / 2; g.add(st);
  const b = new THREE.Mesh(P.base, P.iron); b.position.y = sh + 0.03; g.add(b);
  const w = new THREE.Mesh(P.waist, P.dark); w.position.y = sh + 0.095; g.add(w);
  const f = new THREE.Mesh(P.face, P.iron); f.position.y = sh + 0.157; g.add(f);
  const h = new THREE.Mesh(P.horn, P.iron); h.position.set(0.23, sh + 0.16, 0); g.add(h);
  const gm = new THREE.MeshBasicMaterial({ color: 0xff7a20 });
  const bar = new THREE.Mesh(P.bar, gm); bar.position.set(-0.02, sh + 0.196, 0.01); bar.rotation.y = 0.25; g.add(bar);
  const tg = new THREE.Mesh(P.tongs, P.dark); tg.position.set(-0.17, sh + 0.2, 0.03); tg.rotation.y = 0.25; g.add(tg);
  const k = (meta.hipsY || 0.97) / 0.97;
  g.position.set(-0.13 * k, 0, 0.4 * k);
  g.rotation.y = -0.25;
  g.scale.set(1.55, 1, 1.55);
  for (const m of [b, w, f, h]) { m.scale.y = 1.35; }
  b.position.y = sh + 0.03 * 1.35 - 0.08; w.position.y = sh + 0.095 * 1.35 - 0.08 * 0.6; f.position.y = sh + 0.157; h.position.y = sh + 0.16;
  group.add(g);
  return gm;
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
    style: styleFor(e), stride: inst.meta.race === "pipkin" ? 1.3 : inst.meta.race === "ursan" ? 1.65 : inst.meta.race === "elari" ? 1.55 : kind === "bird" ? 0.4 : kind === "hare" ? 1.2 : kind === "rarab" ? 1.1 : kind === "quad" ? (inst.meta.quad.stride || 1.2) : kind === "crawler" || kind === "crab" ? 0.9 : 1.4, scale: s, mount: null, sink: 0, mob: isMob(e)
  };
  if (e.kind === "npc" && (NPC_WORK[e.id] || VENDOR_WORK[e.id]) === "hammer" && kind === "human") v.anvilGlow = addAnvil(group, inst.meta);
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

function lookTargetOf(e) {
  if (!player || e.alive === false) return null;
  const near = (t, r) => t && t !== e && t.alive !== false && !t.away && dist(e, t) < r;
  if (e === player) return near(player.target, 900) ? player.target : null;
  if (e.kind === "npc") return (player.target === e || S.pendingTalk === e || e.talkUntil > S.time) && near(player, 700) || near(player, 130) ? player : null;
  if (isMob(e)) { if (near(e.target, 1200)) return e.target; return player.target === e && near(player, 600) ? player : null; }
  const t = e.attackTarget || e.target;
  if (near(t, 900)) return t;
  return e !== player && player.target === e && near(player, 500) ? player : null;
}

const WEAPON_DRAW_TIME = 0.35, WEAPON_SHEATHE_TIME = 0.45;

function weaponBodyK(v) {
  const rb = RACE_BODY[v.meta && v.meta.race];
  if (!rb) return 1;
  return Math.max(0.7, Math.min(1.15, Math.sqrt((rb[0].leg + rb[0].torso) / 1.38)));
}

const WEAPON_HALF_T = { staff: 0.02, polearm: 0.018, greataxe: 0.024, scythe: 0.02, gsword: 0.022, gkatana: 0.016, sword: 0.018, katana: 0.014, dagger: 0.014, axe: 0.022, club: 0.022, archery: 0.02 };
const HIP_KINDS = { sword: 0.5, katana: 0.55, dagger: 0.3, axe: 0.35, club: 0.35 };
function carryBone(v) { return HIP_KINDS[v.weapon.userData.kind] != null && v.bones.hips ? v.bones.hips : v.bones.chest; }
function weaponPose(v, drawn) {
  const k = v.weapon.userData.kind, pos = new THREE.Vector3(), rot = new THREE.Euler();
  if (drawn) {
    pos.set(0.016, -0.074, 0.012);
    if (k === "staff" || k === "polearm") rot.set(0.2, 0, 0);
    else if (k === "archery") rot.set(0, 0, 0.1);
    else if (k === "greataxe" || k === "scythe" || k === "gkatana" || k === "gsword") rot.set(Math.PI / 2 - 0.5, 0, 0);
    else rot.set(Math.PI / 2 - 0.25, 0, 0);
  } else {
    const bz = v.meta.backZ || -0.15;
    const th = WEAPON_HALF_T[k] || 0.02;
    if (k === "staff") { pos.set(0, -0.1, bz - th); rot.set(0, 0, 1.2); }
    else if (k === "greataxe" || k === "scythe" || k === "gkatana" || k === "polearm" || k === "gsword") { pos.set(0, 0.0, bz - th); rot.set(0, 0, 0.78); }
    else if (HIP_KINDS[k] != null && v.bones.hips) { const hx = v.bones.thighL ? v.bones.thighL.position.x : 0.1; pos.set(hx + 0.07, -0.03, 0.0); rot.set(HIP_KINDS[k], 0, Math.PI + 0.14); }
    else { pos.set(0.04, 0.0, bz - th); rot.set(0, 0, Math.PI + 0.55); }
  }
  return { pos, quat: new THREE.Quaternion().setFromEuler(rot), rot };
}

function holdForShow(inst) {
  if (!inst.weapon) return;
  if (inst.bones && inst.bones.handR) { const pv = { weapon: inst.weapon, bones: inst.bones, meta: inst.meta }; inst.weapon.scale.setScalar(weaponBodyK(pv)); snapWeapon(pv, true); }
  else inst.mesh.add(inst.weapon);
}
function snapWeapon(v, drawn) {
  const w = v.weapon, t = weaponPose(v, drawn);
  (drawn ? v.bones.handR : carryBone(v)).add(w);
  w.position.copy(t.pos); w.rotation.copy(t.rot);
  v.wBaseRot = t.rot.clone();
  v.weaponDrawn = drawn; v.wTr = null; v.wEase = null;
}

function placeWeapon(v, e) {
  if (!v.weapon || !v.bones.handR) return;
  const an = v.an;
  const busy = an && (S.time - an.aStart < 0.6 || S.time - an.wsStart < 1.1);
  const drawn = e.alive !== false && (v.alwaysDrawn || e.engaged || !!e.casting || busy || (isMob(e) && e.state === "combat") || isMob(e)) && !e.mounted;
  const w = v.weapon;
  if (v.weaponDrawn == null) { w.scale.setScalar(weaponBodyK(v)); snapWeapon(v, drawn); v.wTarget = drawn; return; }
  if (drawn !== v.wTarget) {
    v.wTarget = drawn;
    if (v.wTr) snapWeapon(v, v.wTr.to);
    const instant = e.alive === false || e.mounted || isMob(e) || (drawn && busy) || v.alwaysDrawn || !an;
    if (instant) { snapWeapon(v, drawn); return; }
    v.wTr = { to: drawn, t0: S.time, dur: drawn ? WEAPON_DRAW_TIME : WEAPON_SHEATHE_TIME, switched: false };
  }
  const tr = v.wTr;
  if (tr && tr.to && busy && S.time - tr.t0 > 0.05) { snapWeapon(v, true); return; }
  if (tr) {
    const p = (S.time - tr.t0) / tr.dur;
    if (!tr.switched && p >= 0.5) {
      tr.switched = true;
      w.updateWorldMatrix(true, false);
      (tr.to ? v.bones.handR : carryBone(v)).attach(w);
      v.weaponDrawn = tr.to;
      v.wEase = { t0: S.time, dur: tr.dur * 0.35, pos: w.position.clone(), quat: w.quaternion.clone() };
    }
    if (p >= 1) { snapWeapon(v, tr.to); return; }
  }
  const bl = v.wEase;
  if (bl) {
    const t = weaponPose(v, v.weaponDrawn), k = Math.min(1, (S.time - bl.t0) / bl.dur), s = k * k * (3 - 2 * k);
    w.position.lerpVectors(bl.pos, t.pos, s);
    w.quaternion.slerpQuaternions(bl.quat, t.quat, s);
    if (k >= 1) v.wEase = null;
  }
}

const TOOL_MATS = {};
function toolMat(c) { return TOOL_MATS[c] || (TOOL_MATS[c] = new THREE.MeshLambertMaterial({ color: c })); }
function toolPart(geo, col, x, y, z, rx, ry, rz) { const m = new THREE.Mesh(geo, toolMat(col)); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; return m; }
function buildTool(kind) {
  const g = new THREE.Group(), wood = 0x7a5230, steel = 0xb9c2cc, dark = 0x4a3420;
  const cyl = (r1, r2, h) => new THREE.CylinderGeometry(r2, r1, h, 7);
  if (kind === "pickaxe") {
    g.add(toolPart(cyl(0.02, 0.016, 0.62), wood, 0, 0.26, 0));
    g.add(toolPart(new THREE.BoxGeometry(0.05, 0.05, 0.07), steel, 0, 0.58, 0));
    g.add(toolPart(new THREE.CylinderGeometry(0.003, 0.026, 0.2, 6), steel, 0.12, 0.58, 0, 0, 0, -Math.PI / 2 + 0.2));
    g.add(toolPart(new THREE.CylinderGeometry(0.003, 0.026, 0.2, 6), steel, -0.12, 0.58, 0, 0, 0, Math.PI / 2 - 0.2));
  } else if (kind === "hatchet") {
    g.add(toolPart(cyl(0.02, 0.016, 0.5), wood, 0, 0.2, 0));
    g.add(toolPart(new THREE.BoxGeometry(0.03, 0.14, 0.05), dark, 0, 0.43, 0));
    g.add(toolPart(new THREE.BoxGeometry(0.15, 0.16, 0.022), steel, 0.08, 0.42, 0));
    g.add(toolPart(new THREE.BoxGeometry(0.02, 0.2, 0.012), 0xe8eef4, 0.16, 0.42, 0));
  } else if (kind === "sickle") {
    g.add(toolPart(cyl(0.02, 0.017, 0.3), wood, 0, 0.1, 0));
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.013, 6, 14, Math.PI * 1.15), toolMat(steel));
    arc.position.set(0.11, 0.34, 0); arc.rotation.set(0, 0, Math.PI * 0.55); arc.castShadow = true; g.add(arc);
  } else {
    const hand = new THREE.Group(); g.add(hand);
    hand.add(toolPart(cyl(0.022, 0.019, 0.34), dark, 0, 0.0, 0));
    hand.add(toolPart(new THREE.CylinderGeometry(0.004, 0.018, 1.3, 6), wood, 0, 0.98, 0));
    hand.add(toolPart(new THREE.TorusGeometry(0.03, 0.005, 5, 10), steel, 0, 0.5, 0.0, Math.PI / 2, 0, 0));
    hand.add(toolPart(new THREE.SphereGeometry(0.02, 8, 6), 0xb0b8c0, 0, 0.1, 0.03));
    g.userData.tipLocal = new THREE.Vector3(0, 1.64, 0);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 1, 4), toolMat(0xf4f4f0)); line.visible = false; g.userData.line = line;
    const fl = new THREE.Group();
    fl.add(toolPart(new THREE.SphereGeometry(0.035, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xe53935, 0, 0, 0));
    fl.add(toolPart(new THREE.SphereGeometry(0.035, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xf5f5f5, 0, 0, 0));
    fl.add(toolPart(cyl(0.004, 0.004, 0.07), 0xf5f5f5, 0, 0.06, 0));
    fl.visible = false; g.userData.float = fl;
  }
  return g;
}
function toolWant(v, e) {
  if (e !== player || e.alive === false || e.mounted || e.resting) return null;
  if (S.fish || (e.reelAt != null && S.time - e.reelAt < 0.8)) return "rod";
  if (e.gatherAt != null && S.time - e.gatherAt < 0.9) return e.gatherType === "mining" ? "pickaxe" : e.gatherType === "logging" ? "hatchet" : "sickle";
  return null;
}
function placeTool(v, e) {
  if (v.kind !== "human" || !v.bones.handR) return;
  const want = toolWant(v, e), cur = v.tool;
  if (want !== (cur && cur.kind)) {
    if (cur) { cur.g.parent && cur.g.parent.remove(cur.g); if (cur.g.userData.line) { cur.g.userData.line.parent && cur.g.userData.line.parent.remove(cur.g.userData.line); cur.g.userData.float.parent && cur.g.userData.float.parent.remove(cur.g.userData.float); } v.tool = null; }
    if (want) {
      const g = (v.toolCache || (v.toolCache = {}))[want] || (v.toolCache[want] = buildTool(want));
      v.bones.handR.add(g);
      if (want === "rod") { g.position.set(0.016, -0.06, 0.012); g.rotation.set(2.45, 0, 0); v.group.add(g.userData.line); v.group.add(g.userData.float); }
      else { g.position.set(0.016, -0.074, 0.012); g.rotation.set(Math.PI / 2 - 0.25, 0, 0); }
      v.tool = { kind: want, g, t0: S.time };
    }
  }
  const tl = v.tool;
  if (v.weapon && v.weaponDrawn && tl) v.weapon.visible = false; else if (v.weapon) v.weapon.visible = true;
  if (!tl) return;
  const k = Math.min(1, (S.time - tl.t0) / 0.18), sc = weaponBodyK(v) * (0.3 + 0.7 * k * k * (3 - 2 * k));
  tl.g.scale.setScalar(sc);
  if (tl.kind !== "rod") return;
  const ud = tl.g.userData, fs = S.fish, line = ud.line, fl = ud.float;
  tl.g.updateWorldMatrix(true, false);
  const tipW = tl.g.localToWorld(ud.tipLocal.clone()), tip = v.group.worldToLocal(tipW.clone());
  const sy = v.group.scale.y || 1, rk = e.reelAt != null ? (S.time - e.reelAt) / 0.8 : 9;
  const T = fs ? S.time - (fs.since || S.time) : 0.7;
  const reach = fs ? 1.5 / sy : (1.5 - 1.2 * ease(rk)) / sy;
  const show = fs ? T > 0.45 : rk < 1;
  line.visible = fl.visible = show;
  if (!show) return;
  const flyK = fs ? ease((T - 0.45) / 0.3) : 1, bite = fs && fs.state === "bite";
  const bob = Math.sin(S.time * 2.2) * 0.008 / sy + (bite ? -0.05 / sy + Math.sin(S.time * 30) * 0.015 / sy : 0);
  const fx = tip.x * (1 - flyK), fz = tip.z + (reach - tip.z) * flyK, fy = tip.y * (1 - flyK) + (-0.01 / sy + bob) * flyK + Math.sin(flyK * Math.PI) * 0.5 / sy;
  fl.position.set(fx, fy, fz);
  const dx = fx - tip.x, dy = fy + 0.06 - tip.y, dz = fz - tip.z, len = Math.hypot(dx, dy, dz) || 1e-3;
  line.position.set(tip.x + dx / 2, tip.y + dy / 2, tip.z + dz / 2);
  line.scale.set(1 / sy, len, 1 / sy);
  line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
}

const SLOPE_KINDS = { crawler: 1, worm: 1, quad: 1, crab: 1, fish: 1, hare: 1, rarab: 1 };
function footGround(e) {
  if (e.prop && e.kind === "npc") {
    let m = groundY(e.x, e.y);
    for (let k = 0; k < 8; k++) m = Math.min(m, groundY(e.x + Math.cos(k * Math.PI / 4) * 14, e.y + Math.sin(k * Math.PI / 4) * 14));
    return m;
  }
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
  if (e.flyer) {
    const tY = g.position.y + (e.fly || 0), up = (e.fly || 0) > 0.3;
    v.airY = v.airY == null ? tY : v.airY + (tY - v.airY) * Math.min(1, dt * (up ? 1.4 : 10));
    g.position.y = Math.max(g.position.y, v.airY) + (up ? Math.sin(S.time * 0.8 + (e.seed || 0) * 3) * 0.25 : 0);
    g.rotation.z += (clamp(-(e.bank || 0) * 0.32, -0.55, 0.55) * (up ? 1 : 0) - g.rotation.z) * Math.min(1, dt * 4);
  } else if (e.fly) g.position.y += e.fly + Math.sin(S.time * 0.8 + (e.home ? e.home.x : 0)) * 0.6;
  v.lookTgt = lookTargetOf(e);
  if (v.kind === "human") poseHuman(v, e, dt);
  else if (v.kind === "bat") poseBat(v, e, dt);
  else if (v.kind === "worm") poseWorm(v, e, dt);
  else if (v.kind === "hare") poseHare(v, e, dt);
  else if (v.kind === "rarab") poseRarab(v, e, dt);
  else if (v.kind === "bee") poseBee(v, e, dt);
  else if (v.kind === "bird") poseBird(v, e, dt);
  else if (v.kind === "crawler") poseCrawler(v, e, dt);
  else if (v.kind === "quad") poseQuad(v, e, dt);
  else if (v.kind === "raptor") { const sp = v.rLast ? Math.hypot(e.x - v.rLast.x, e.y - v.rLast.y) * U / Math.max(dt, 1e-3) : 0; v.rLast = { x: e.x, y: e.y }; poseRaptor(v, sp, dt); }
  else if (v.kind === "crab") poseCrab(v, e, dt);
  else if (v.kind === "mandrake") poseMandrake(v, e, dt);
  else if (v.kind === "shroom") poseShroom(v, e, dt);
  else if (v.kind === "bulb") poseBulb(v, e, dt);
  else if (v.kind === "fish") poseFish(v, e, dt);
  placeWeapon(v, e);
  placeTool(v, e);
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

function crystalShardGeo(kind) {
  if (kind === 0) { const g = new THREE.OctahedronGeometry(0.55, 0); g.scale(1, 1.8, 1); return g; }
  if (kind === 1) { const pts = [[0, -0.9], [0.32, -0.45], [0.36, 0.45], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 6); }
  if (kind === 2) { const g = new THREE.LatheGeometry([[0, -1.0], [0.18, -0.6], [0.5, 0], [0.18, 0.6], [0, 1.0]].map(([x, y]) => new THREE.Vector2(x, y)), 5); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = y * 1.4, x = p.getX(i), z = p.getZ(i); p.setXYZ(i, x * Math.cos(t) - z * Math.sin(t), y, x * Math.sin(t) + z * Math.cos(t)); } g.computeVertexNormals(); return g; }
  const g = new THREE.DodecahedronGeometry(0.6, 0); g.scale(0.9, 1.3, 0.9); return g;
}
function npcCrystalView(e) {
  const g = new THREE.Group();
  const el = typeof zoneElement === "function" ? zoneElement(S.zone) : "water";
  const col = new THREE.Color(ELEMENT_COLORS[el] || "#4fc3f7"), deep = col.clone().multiplyScalar(0.55);
  const kind = hashStr(e.id || "c") % 4;
  const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 1.1, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85, flatShading: true });
  const coreM = new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xffffff), 0.6) });
  const spin = new THREE.Group();
  const main = new THREE.Mesh(crystalShardGeo(kind), mat);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), coreM);
  spin.add(main, core);
  if (kind === 1) for (let k = 0; k < 4; k++) { const sh = new THREE.Mesh(crystalShardGeo(1), mat); const a = k / 4 * Math.PI * 2 + 0.4; sh.scale.setScalar(0.5); sh.position.set(Math.cos(a) * 0.38, -0.35, Math.sin(a) * 0.38); sh.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); spin.add(sh); }
  const orbit = new THREE.Group();
  const nOrb = [4, 0, 3, 6][kind];
  for (let k = 0; k < nOrb; k++) { const sh = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), mat); const a = k / nOrb * Math.PI * 2; sh.scale.y = 1.8; sh.position.set(Math.cos(a) * 1.0, Math.sin(a * 2) * 0.25, Math.sin(a) * 1.0); orbit.add(sh); }
  const ringM = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  if (kind === 2 || kind === 3) for (const [r, tx] of [[0.85, 1.2], [1.05, -0.9]]) { const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.025, 6, 40), ringM); ring.rotation.x = tx; orbit.add(ring); }
  spin.add(orbit);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow(), color: col, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(3.6); spin.add(halo);
  spin.position.y = 2.0;
  const bt = texBricks(), stone = std({ map: bt.map, normalMap: bt.normalMap, color: 0x9a96a4 }), dark = std({ color: 0x3a3844, roughness: 0.6, metalness: 0.4 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.3, 8), stone); base.position.y = 0.15;
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.85, 0.35, 8), stone); mid.position.y = 0.47;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.12, 8), dark); cap.position.y = 0.7;
  const runeM = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9 });
  const rune = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.03, 4, 8), runeM); rune.rotation.x = Math.PI / 2; rune.position.y = 0.31;
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8, gl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.02), runeM); gl.position.set(Math.cos(a) * 0.74, 0.47, Math.sin(a) * 0.74); gl.rotation.y = Math.PI / 2 - a; gl.rotation.x = -0.4; g.add(gl); }
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2 + Math.PI / 4, pr = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.5, 4), dark); pr.position.set(Math.cos(a) * 0.45, 0.98, Math.sin(a) * 0.45); pr.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); g.add(pr); }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 1.4, 16, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); beam.position.y = 1.35;
  for (const o of [base, mid, cap]) { o.receiveShadow = true; o.castShadow = true; }
  const L = new THREE.PointLight(col, 9, 16, 1.5); L.position.y = 2;
  g.add(spin, base, mid, cap, rune, beam, L);
  g.userData.crystal = { orbit, halo, core, L, deep };
  return { g, spin };
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
  } else if (n.prop === "kiosk") {
    const wood = std({ color: 0x5a3e24, roughness: 0.85 }), trim = std({ color: 0xc9a227, metalness: 0.6, roughness: 0.4 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.3), std({ color: 0x4a3420, roughness: 0.9 })); base.position.y = 0.55; base.castShadow = true;
    const counter = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.5), wood); counter.position.set(0, 1.15, 0.1);
    for (const sx of [-1.05, 1.05]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), wood); post.position.set(sx, 1.8, 0.6); post.castShadow = true; g.add(post); const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), wood); back.position.set(sx, 1.8, -0.55); g.add(back); }
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.08), std({ color: 0x3a2a1a, roughness: 0.9 })); backWall.position.set(0, 1.8, -0.55);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.7), new THREE.MeshBasicMaterial({ color: 0x9ad0ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide })); glass.position.set(0, 1.95, 0.62);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.06), trim); bar.position.set(0, 1.6, 0.62);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 1.9), std({ color: 0x7a2a22, roughness: 0.8 })); roof.position.set(0, 2.5, 0.05); roof.castShadow = true;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.36, 0.08), std({ color: 0x1e1a14, emissive: 0xc9a227, emissiveIntensity: 0.35 })); sign.position.set(0, 2.78, 0.9);
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 14), trim); coin.rotation.x = Math.PI / 2; coin.position.set(0, 2.78, 0.96);
    const lamp = new THREE.PointLight(0xffd890, 4, 9, 1.6); lamp.position.set(0, 2.2, 0.8);
    g.add(base, counter, backWall, glass, bar, roof, sign, coin, lamp);
    v.meta.headTop = 3.1;
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
    const lidM = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.2, 0.84), wood); lidM.position.set(0, 0.1, 0.4);
    const lidTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.7), wood); lidTop.position.set(0, 0.27, 0.4);
    lid.add(lidM, lidTop);
    for (const sgn of [-1, 1]) { const ls = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.36, 0.88), metal); ls.position.set(sgn * 0.45, 0.18, 0.4); lid.add(ls); }
    lid.position.set(0, 0.7, -0.4);
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.08), metal); lock.position.set(0, 0.55, 0.42);
    for (const sgn of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.84), metal); strap.position.set(sgn * 0.45, 0.35, 0); g.add(strap); }
    g.add(box, lid, lock);
    v.lid = lid; v.meta.headTop = 1.4;
    if (n.talk === "talkDeliveryBox") {
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.position.y = 0.5; halo.scale.set(1.2, 0.8, 1);
      const L = new THREE.PointLight(0xffd070, 0, 7, 1.6); L.position.set(0, 1.2, 0.6);
      g.add(halo, L);
      v.delivGlow = { halo, L, metal };
    }
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
  } else if (n.prop === "mirage") {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 4.5, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false }));
    sh.position.y = 2.25;
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), new THREE.MeshBasicMaterial({ color: 0xfff3c0 }));
    core.position.y = 2.2;
    const L = new THREE.PointLight(0xffd580, 5, 14, 1.6); L.position.y = 2.4;
    g.add(sh, core, L);
    v.light = L; v.bob = true; v.meta.headTop = 4.8;
  } else if (n.prop === "sign") {
    const wood = std({ color: 0x7a5432, roughness: 0.9 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 2.2, 6), wood); post.position.y = 1.1; post.castShadow = true;
    g.add(post);
    for (let i = 0; i < 2; i++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.24, 0.05), std({ color: 0x9a7448, roughness: 0.9 })); arm.position.set(i ? -0.35 : 0.35, 1.75 - i * 0.35, 0.06); arm.rotation.y = i ? 0.4 : -0.3; arm.castShadow = true; g.add(arm); }
    v.meta.headTop = 2.3;
  } else if (n.prop === "wayshrine") {
    const moss = std({ color: 0x6a7a58, roughness: 1 }), pale = std({ color: 0xb8b2a6, roughness: 0.9 }), wax = std({ color: 0xf2ead4, roughness: 0.6 }), petal = [0xf2d24a, 0xe890a8, 0xffffff, 0xc890e8].map(c => std({ color: c, roughness: 0.8 }));
    const add = (geo, m, x, y, z, ry, rx) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, 0); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    add(new THREE.CylinderGeometry(1.6, 1.75, 0.22, 16), stone, 0, 0.11); add(new THREE.CylinderGeometry(1.25, 1.35, 0.22, 16), pale, 0, 0.33); add(new THREE.CylinderGeometry(0.9, 1.0, 0.2, 12), stone, 0, 0.54);
    for (let i = 0; i < 7; i++) { const a = i * 0.9; add(new THREE.SphereGeometry(0.22, 6, 4).scale(1.4, 0.35, 1), moss, Math.sin(a) * 1.5, 0.2, Math.cos(a) * 1.5, a); }
    add(new THREE.CylinderGeometry(0.28, 0.36, 1.7, 4), pale, 0, 1.49, 0, Math.PI / 4);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; add(new THREE.BoxGeometry(0.22, 0.6, 0.03), new THREE.MeshBasicMaterial({ color: 0xffe2a0 }), Math.sin(a) * 0.27, 1.55, Math.cos(a) * 0.27, a); }
    add(new THREE.ConeGeometry(0.42, 0.5, 4), stone, 0, 2.6, 0, Math.PI / 4);
    const orb = add(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe8a0 }), 0, 3.05);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = 0.78, h = 0.12 + (i % 3) * 0.07; add(new THREE.CylinderGeometry(0.035, 0.04, h, 6), wax, Math.sin(a) * r, 0.64 + h / 2, Math.cos(a) * r); add(new THREE.SphereGeometry(0.028, 5, 4).scale(1, 1.6, 1), new THREE.MeshBasicMaterial({ color: 0xffc860 }), Math.sin(a) * r, 0.68 + h, Math.cos(a) * r); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; add(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 6), stone, Math.sin(a) * 1.45, 0.85, Math.cos(a) * 1.45); add(new THREE.BoxGeometry(0.2, 0.24, 0.2), new THREE.MeshBasicMaterial({ color: 0xffd080 }), Math.sin(a) * 1.45, 1.6, Math.cos(a) * 1.45, a); add(new THREE.ConeGeometry(0.18, 0.16, 4), stone, Math.sin(a) * 1.45, 1.8, Math.cos(a) * 1.45, Math.PI / 4); }
    for (let i = 0; i < 6; i++) { const a = i * 1.05 + 0.4; add(new THREE.IcosahedronGeometry(0.07, 0), petal[i % 4], Math.sin(a) * 0.55, 0.69, Math.cos(a) * 0.55); }
    const L = new THREE.PointLight(0xffd080, 5, 10, 1.6); L.position.set(0, 1.6, 0); g.add(L);
    v.orb = orb; v.orbY = 3.05; v.light = L; v.meta.headTop = 3.4;
  } else if (n.prop === "statue" && NPCS[n.id] && NPCS[n.id].warpstone) {
    warpStoneView(g, n, v, stone);
  } else if (n.prop === "statue") {
    const pale = std({ color: 0xc9c7d1, roughness: 0.85 });
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.7, 8), stone); pl.position.y = 0.35; pl.castShadow = pl.receiveShadow = true;
    const pl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.25, 8), pale); pl2.position.y = 0.82;
    const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.36, 1.45, 8), pale); rb.position.y = 1.65; rb.castShadow = true;
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 8, 6), pale); sh.position.y = 2.28; sh.scale.set(1.15, 0.55, 0.8);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 8), pale); hd.position.y = 2.55;
    const hood = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.36, 8), pale); hood.position.y = 2.72;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6), pale); arm.position.set(0.31, 2.5, 0.235); arm.rotation.x = 0.75;
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), new THREE.MeshStandardMaterial({ color: 0x9ff3ff, emissive: 0x40d8ff, emissiveIntensity: 0.9, roughness: 0.1, transparent: true, opacity: 0.92 }));
    orb.position.set(0.34, 2.78, 0.46);
    const L = new THREE.PointLight(0x60e0ff, 3.5, 11, 1.6); L.position.set(0.34, 2.78, 0.46);
    g.add(pl, pl2, rb, sh, hd, hood, arm, orb, L);
    v.orb = orb; v.meta.headTop = 3.4;
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
    if (!v.bob && n.idleFace != null) v.group.rotation.y = Math.PI / 2 - n.idleFace;
    if (v.flame) {
      const lit = brazierLit(n.element);
      const k = 0.85 + Math.sin(S.time * 9 + n.x) * 0.1 + Math.sin(S.time * 23) * 0.05;
      v.flame[0].visible = v.flame[1].visible = lit;
      v.flame[0].scale.set(k, 0.9 + Math.sin(S.time * 7) * 0.12, k);
      v.light.intensity = lit ? 8 + Math.sin(S.time * 11) * 2 : 0;
    }
    if (v.delivGlow) { const on = deliveryWaiting(), k = on ? 0.6 + Math.sin(S.time * 3) * 0.4 : 0; v.delivGlow.halo.material.opacity = 0.22 * k; v.delivGlow.L.intensity = 6 * k; v.delivGlow.metal.emissive.setHex(on ? 0xffb030 : 0); v.delivGlow.metal.emissiveIntensity = 0.6 * k; }
    if (v.orb) { v.orb.rotation.y += dt * 0.9; v.orb.position.y = (v.orbY || 2.78) + Math.sin(S.time * 1.5 + n.x) * 0.08; }
    if (v.rings) v.rings.forEach((r, i) => { r.rotation.x += dt * (0.4 + i * 0.25); r.rotation.z += dt * (0.3 - i * 0.2); });
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
    const cd = v.group.userData.crystal;
    if (cd) { cd.orbit.rotation.y -= dt * 2.2; const p = 0.5 + 0.5 * Math.sin(S.time * 2.3); cd.halo.material.opacity = 0.55 + 0.35 * p; cd.halo.scale.setScalar(3.2 + 0.8 * p); cd.core.scale.setScalar(0.85 + 0.35 * p); cd.L.intensity = 7 + 4 * p; }
    return;
  }
  syncEntity(n, dt);
}

function syncBeacon() {
  const cp = S.race && RACE.checkpoints[S.race.next];
  if (!cp || cp.zone !== S.zoneId) { if (VIEW.beacon) VIEW.beacon.visible = false; return; }
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
  if (!st || (S.zone.pens || []).some(p => p.kind === "raptor")) return;
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

function warpStoneView(g, n, v, stone) {
  const d = NPCS[n.id], Z = ZONES[d.warpZone] || S.zone, dd = (Z && (Z.districts || []).find(q => q.id === d.warpDistrict)) || null;
  const acc = new THREE.Color(dd && dd.color || "#60e0ff"), glow = acc.clone().lerp(new THREE.Color(0xffffff), 0.35);
  const variant = hashStr(n.id) % 6, pale = std({ color: 0xd4d0da, roughness: 0.8 }), dark = std({ color: 0x4a4852, roughness: 0.9 }), gold = std({ color: 0xc8a040, metalness: 0.7, roughness: 0.35 });
  const crystalM = new THREE.MeshStandardMaterial({ color: glow, emissive: acc, emissiveIntensity: 1.1, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.9 });
  const runeM = new THREE.MeshBasicMaterial({ color: glow });
  const add = (geo, m, x, y, z, rx, ry, rz) => { const o = new THREE.Mesh(geo, m); o.position.set(x || 0, y || 0, z || 0); o.rotation.set(rx || 0, ry || 0, rz || 0); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  const step = (r, h, y, m) => add(new THREE.CylinderGeometry(r, r * 1.06, h, 10), m || stone, 0, y + h / 2, 0);
  const runes = (r, y, n2) => { for (let i = 0; i < n2; i++) { const a = i / n2 * Math.PI * 2; add(new THREE.BoxGeometry(0.05, 0.22, 0.02), runeM, Math.sin(a) * r, y, Math.cos(a) * r, 0, a, (i % 3 - 1) * 0.4); } };
  let orbY = 2.8, crystal;
  step(1.25, 0.25, 0); step(1.0, 0.25, 0.25, pale); runes(1.02, 0.38, 14);
  if (variant === 0) {
    add(new THREE.CylinderGeometry(0.28, 0.45, 2.6, 4), stone, 0, 1.8, 0, 0, Math.PI / 4);
    runes(0.4, 1.2, 4); runes(0.33, 2.0, 4);
    add(new THREE.ConeGeometry(0.3, 0.5, 4), gold, 0, 3.35, 0, 0, Math.PI / 4);
    crystal = add(new THREE.OctahedronGeometry(0.32, 0).scale(1, 1.6, 1), crystalM, 0, 4.1, 0); orbY = 4.1;
  } else if (variant === 1) {
    for (const sx of [-1, 1]) { add(new THREE.BoxGeometry(0.42, 3.0, 0.42), stone, sx * 0.75, 2.0, 0); add(new THREE.BoxGeometry(0.55, 0.2, 0.55), pale, sx * 0.75, 3.6, 0); }
    add(new THREE.TorusGeometry(0.75, 0.13, 6, 16, Math.PI), pale, 0, 3.6, 0);
    crystal = add(new THREE.OctahedronGeometry(0.3, 0).scale(1, 1.5, 1), crystalM, 0, 2.3, 0); orbY = 2.3;
  } else if (variant === 2) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, h = 1.3 + (i % 2) * 0.5; add(new THREE.BoxGeometry(0.26, h, 0.18), stone, Math.sin(a) * 0.85, 0.5 + h / 2, Math.cos(a) * 0.85, 0, a, (i % 3 - 1) * 0.05); add(new THREE.BoxGeometry(0.05, 0.2, 0.02), runeM, Math.sin(a) * 0.94, 0.5 + h * 0.6, Math.cos(a) * 0.94, 0, a); }
    crystal = add(new THREE.IcosahedronGeometry(0.4, 0), crystalM, 0, 1.9, 0); orbY = 1.9;
  } else if (variant === 3) {
    add(new THREE.CylinderGeometry(0.22, 0.32, 2.2, 8), pale, 0, 1.6, 0);
    add(new THREE.CylinderGeometry(0.5, 0.3, 0.35, 8), gold, 0, 2.85, 0);
    crystal = add(new THREE.DodecahedronGeometry(0.34, 0), crystalM, 0, 3.4, 0); orbY = 3.4;
    v.rings = [0, 1].map(i => add(new THREE.TorusGeometry(0.62 + i * 0.18, 0.03, 4, 28), gold, 0, 3.4, 0, i * 1.2, 0, 0.6));
  } else if (variant === 4) {
    const rock = std({ color: 0x6a6872, roughness: 0.95 });
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, h = 1.2 + (i * 37 % 7) / 7 * 1.2; add(new THREE.CylinderGeometry(0.06, 0.2, h, 5), crystalM, Math.sin(a) * 0.35, 0.5 + h / 2, Math.cos(a) * 0.35, Math.cos(a) * 0.35, 0, -Math.sin(a) * 0.35); }
    add(new THREE.DodecahedronGeometry(0.6, 0), rock, 0, 0.7, 0);
    crystal = add(new THREE.OctahedronGeometry(0.28, 0).scale(1, 2, 1), crystalM, 0, 2.6, 0); orbY = 2.6;
  } else {
    add(new THREE.BoxGeometry(0.9, 0.9, 0.9), stone, 0, 0.95, 0, 0, Math.PI / 4);
    add(new THREE.BoxGeometry(0.7, 1.6, 0.7), pale, 0, 2.15, 0, 0, Math.PI / 4);
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) add(new THREE.BoxGeometry(0.06, 1.2, 0.02), runeM, Math.sin(a + Math.PI / 4) * 0.5, 2.15, Math.cos(a + Math.PI / 4) * 0.5, 0, a + Math.PI / 4);
    add(new THREE.ConeGeometry(0.6, 0.6, 4), dark, 0, 3.25, 0, 0, Math.PI / 4);
    crystal = add(new THREE.OctahedronGeometry(0.26, 0), crystalM, 0, 3.95, 0); orbY = 3.95;
  }
  const L = new THREE.PointLight(acc.getHex(), 4, 12, 1.6); L.position.y = orbY; g.add(L);
  v.orb = crystal; v.orbY = orbY; v.meta.headTop = orbY + 0.8;
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

function renderThumb(famKey, ent) {
  const st = thumbStudio(), R = W3.renderer;
  const m = ent || buildMob(famKey, 5, 0, 0, null);
  const inst = buildEntityRig(m);
  if (!inst) return null;
  const g = new THREE.Group();
  g.add(inst.mesh);
  holdForShow(inst);
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

function examineOpen(famKey, ent, title) {
  examineClose();
  const ov = document.createElement("div"); ov.id = "exam";
  ov.innerHTML = '<div class="exW"><div class="exH"><b></b><button class="exX">✕</button></div><canvas></canvas><div class="exT">Drag to spin · scroll or pinch to zoom</div></div>';
  ov.querySelector(".exH b").textContent = title || "";
  document.body.appendChild(ov);
  const cv = ov.querySelector("canvas"), R2 = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
  R2.outputColorSpace = THREE.SRGBColorSpace; R2.toneMapping = W3.renderer.toneMapping; R2.toneMappingExposure = 1.25; R2.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x3a4058, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 5, 4); sc.add(key);
  const rim = new THREE.DirectionalLight(0x9fd0ff, 1.2); rim.position.set(-4, 3, -3); sc.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
  const m = ent || buildMob(famKey, 5, 0, 0, null), inst = buildEntityRig(m);
  if (!inst) { ov.remove(); R2.dispose(); return; }
  const g = new THREE.Group(); g.add(inst.mesh); holdForShow(inst); sc.add(g);
  g.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inst.mesh, true), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const rad = Math.max(sz.x, sz.y, sz.z) * 0.6 + 0.05;
  floor.scale.setScalar(Math.max(sz.x, sz.z) * 0.8 + 0.2); floor.position.y = box.min.y + 0.005;
  const cam = new THREE.PerspectiveCamera(30, 1, 0.02, 200);
  const E = { yaw: 0.6, pitch: 0.18, dist: rad / Math.tan(15 * Math.PI / 180), min: rad * 0.9, max: rad / Math.tan(15 * Math.PI / 180) * 2.2, auto: true, drag: null, pinch: null, raf: 0, last: performance.now() };
  const size = () => { const w = cv.clientWidth, h = cv.clientHeight; if (w && h) { R2.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); } };
  const pts = new Map();
  cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); E.auto = false; });
  cv.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    const p0 = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { E.yaw -= (e.clientX - p0[0]) * 0.01; E.pitch = Math.max(-0.5, Math.min(1.2, E.pitch + (e.clientY - p0[1]) * 0.006)); }
    else if (pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (E.pinch) E.dist = Math.max(E.min, Math.min(E.max, E.dist * E.pinch / d)); E.pinch = d; }
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) E.pinch = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); E.dist = Math.max(E.min, Math.min(E.max, E.dist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
  ov.addEventListener("click", e => { if (e.target === ov || e.target.closest(".exX")) examineClose(); });
  const loop = () => {
    const now = performance.now(), dt = Math.min(0.05, (now - E.last) / 1000); E.last = now;
    if (E.auto) E.yaw += dt * 0.5;
    size();
    const cp = Math.cos(E.pitch);
    cam.position.set(c.x + Math.sin(E.yaw) * cp * E.dist, c.y + Math.sin(E.pitch) * E.dist, c.z + Math.cos(E.yaw) * cp * E.dist);
    cam.lookAt(c);
    R2.render(sc, cam);
    E.raf = requestAnimationFrame(loop);
  };
  VIEW.exam = { ov, R2, inst, E };
  loop();
  if (typeof sfx === "function") sfx("open");
}
function examineClose() {
  const X = VIEW.exam; if (!X) return;
  cancelAnimationFrame(X.E.raf);
  try { X.inst.mat.dispose(); } catch (e) {}
  X.R2.dispose(); try { X.R2.forceContextLoss(); } catch (e) {}
  X.ov.remove(); VIEW.exam = null;
}

function beastThumb(famKey, onReady, ent) {
  if (THUMBS.cache.has(famKey)) return THUMBS.cache.get(famKey);
  if (ent) (THUMBS.ent = THUMBS.ent || {})[famKey] = ent;
  if (!THUMBS.queue.includes(famKey)) THUMBS.queue.push(famKey);
  if (!THUMBS.busy) {
    THUMBS.busy = true;
    const next = () => {
      const k = THUMBS.queue.shift();
      if (!k) { THUMBS.busy = false; if (onReady) onReady(); return; }
      let url = null;
      try { url = renderThumb(k, THUMBS.ent && THUMBS.ent[k]); } catch (e) { url = null; THUMBS.err = String(e && e.message || e); }
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
