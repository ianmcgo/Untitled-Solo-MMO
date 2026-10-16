const VIEW = {
  yaw: 0, pitch: 0.34, dist: 8, first: false, lastManual: -99, pointers: new Map(), pinch: null,
  joy: { active: false, id: null, x: 0, y: 0, cx: 0, cy: 0 }, views: new Map(), npcViews: new Map(), fx: new Map(),
  labels: new Map(), floaters: new Map(), raycaster: null, settings: null, cursor: null, groundRing: null, moveRing: null,
  aggroPool: [], camPos: null, camTarget: null, touch: false, decor: null
};

function screenOf(px, py, hMeters) {
  const v = new THREE.Vector3(px * U, groundY(px, py) + hMeters, py * U);
  v.project(W3.camera);
  if (v.z > 1 || v.z < -1) return null;
  const c = $("game");
  return { x: (v.x * 0.5 + 0.5) * c.clientWidth, y: (-v.y * 0.5 + 0.5) * c.clientHeight };
}


function labelFor(e) {
  let el = VIEW.labels.get(e);
  if (!el) {
    el = document.createElement("div");
    el.className = "plate";
    el.innerHTML = '<div class="pn"></div><div class="pb"><div></div></div><div class="pc"><div></div></div>';
    $("overlay").appendChild(el);
    VIEW.labels.set(e, el);
  }
  return el;
}

function occluders() {
  const z = S.zone;
  if (VIEW.occZone === z) return VIEW.occ;
  const out = [];
  for (const h of z.houses || []) out.push({ x: h.x - h.w / 2, y: h.y - h.h / 2, w: h.w, h: h.h, top: 0.6 + (h.type ? (h.floors || 2) * 3 : 3.2) + 1.2 });
  if (z.cityWalls) for (const r of cityWallRects(z)) out.push({ x: r.x, y: r.y, w: r.w, h: r.h, top: r.tower ? 8.2 : 4.6 });
  VIEW.occZone = z; VIEW.occ = out;
  return out;
}
function segRectT(x1, y1, x2, y2, r) {
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy], q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] < 0) return -1; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return -1; if (t > t0) t0 = t; } else { if (t < t0) return -1; if (t < t1) t1 = t; }
  }
  return t0;
}
function labelHidden(e) {
  if (e === player || player.target === e) return false;
  const occ = occluders();
  if (!occ.length) return false;
  const c = W3.camera.position, cx = c.x / U, cy = c.z / U, ex = e.x, ey = e.y, ty = groundY(ex, ey) + entityHeight(e);
  for (const r of occ) {
    if (ex > r.x && ex < r.x + r.w && ey > r.y && ey < r.y + r.h) continue;
    const t = segRectT(cx, cy, ex, ey, r);
    if (t <= 0 || t >= 1) continue;
    const hx = cx + (ex - cx) * t, hy = cy + (ey - cy) * t;
    if (c.y + (ty - c.y) * t < groundY(hx, hy) + r.top) return true;
  }
  return false;
}
function updateLabels() {
  const seen = new Set();
  const all = S.party.concat(S.mobs, S.npcs, S.buddy ? [S.buddy] : [], S.others ? [...S.others.values()].filter(o => o.placed) : []);
  for (const e of all) {
    if (e.buddy) continue;
    if (e === player && VIEW.first) continue;
    if (isMob(e) && (!e.alive || e.despawned)) continue;
    if (e.kind === "npc" && e.away) continue;
    const d = dist(e, player);
    const lim = Math.min(e.kind === "npc" ? 260 : isMob(e) ? 450 : 700, DRAW_DIST[VIEW.settings.draw || "normal"] * 0.6);
    if (d > lim && player.target !== e && !(isParty(e) && e !== player)) continue;
    const sc = screenOf(e.x, e.y, entityHeight(e) + 0.25);
    if (!sc) continue;
    if ((e._occT || 0) < S.time) { e._occT = S.time + 0.15; e._occ = labelHidden(e); }
    if (e._occ) continue;
    const el = labelFor(e);
    seen.add(e);
    el.style.transform = "translate(" + sc.x.toFixed(1) + "px," + sc.y.toFixed(1) + "px) translate(-50%,-100%)";
    const nameEl = el.firstChild, bar = el.children[1], cbar = el.children[2];
    const isT = player.target === e;
    const plates = VIEW.settings.plates !== false;
    let name = e === player ? save.name : e.name, col = "#ffffff", kind = "pc";
    if (isMob(e)) { kind = "mob"; const cs = claimState(e); col = ffMobAttacking(e) || (e.aggro && !e.passive) ? "#ff5a48" : cs === "other" ? "#c77dff" : "#ffffff"; }
    if (e.kind === "npc") { kind = "npc"; col = "#8cff98"; if (questMarker(e)) name = "❗ " + name; }
    if (e.buddy || e.pet || (e.kind === "ally" && e.mercId)) { kind = "ally"; col = "#ffe45c"; }
    if (e.remote) { kind = "pc"; name = e.name; col = typeof isMate === "function" && isMate(e) ? "#7ee8ff" : "#ffffff"; if (isMate && isMate(e)) kind = "party"; }
    if (isParty(e) && e !== player && !e.mercId && !e.pet && !e.remote) { kind = "party"; col = "#7ee8ff"; }
    if (isT && (e.kind === "npc" || e.remote)) col = "#ffffff";
    if (e.alive === false || (d > 600 && !isT)) col = "#a0a0a8";
    const other = isMob(e) || e.kind === "npc";
    if (!plates && other && !isT) name = e.kind === "npc" && questMarker(e) ? "❗" : "";
    if (!plates && !other && e !== player && !isT && !isParty(e)) name = "";
    if (e === player && !plates) name = "";
    nameEl.style.display = name ? "" : "none";
    if (nameEl.textContent !== name) nameEl.textContent = name;
    nameEl.style.color = col;
    if (el.dataset.k !== kind) { el.dataset.k = kind; el.classList.remove("k-pc", "k-npc", "k-mob", "k-ally", "k-party"); el.classList.add("k-" + kind); }
    el.classList.toggle("tgt", isT);
    const showHp = e.kind !== "npc" && !e.buddy && (isParty(e) || isT || e.state === "combat");
    bar.style.display = showHp ? "block" : "none";
    if (showHp) { bar.firstChild.style.width = clamp(100 * e.hp / e.maxHp, 0, 100) + "%"; bar.firstChild.style.background = isMob(e) ? "#e05050" : "#7fd06b"; }
    const cast = e.casting ? (S.time - e.casting.start) / (e.casting.end - e.casting.start) : e.readying ? 1 - e.readying.t : -1;
    cbar.style.display = cast >= 0 ? "block" : "none";
    if (cast >= 0) { cbar.firstChild.style.width = clamp(cast * 100, 0, 100) + "%"; cbar.firstChild.style.background = e.readying ? "#ff7043" : "#64b5f6"; }
    el.style.opacity = d > 600 && !isT ? 0.6 : 1;
  }
  for (const [e, el] of VIEW.labels) if (!seen.has(e)) { el.remove(); VIEW.labels.delete(e); }
}

function updateFloaters() {
  const nums = !VIEW.settings || VIEW.settings.dmgNums !== false;
  for (const f of S.floaters) {
    if (f.dmg && !nums) { if (f.el) { f.el.remove(); f.el = null; VIEW.floaters.delete(f); } continue; }
    if (!f.el) {
      f.el = document.createElement("div");
      f.el.className = f.dmg ? "floater dmg cl" : "floater cl";
      f.el.textContent = f.text;
      f.el.style.color = f.color;
      f.el.style.fontSize = f.size + "px";
      $("overlay").appendChild(f.el);
      VIEW.floaters.set(f, true);
    }
    const k = f.t / f.life;
    const rise = f.dmg ? (k < 0.18 ? 0.5 * Math.sin(k / 0.18 * Math.PI / 2) : 0.5 + (k - 0.18) * 0.55) : k * 1.1;
    const sc = screenOf(f.x, f.y, (f.dmg ? 1.25 : 2.0) + (f.h - 18) * U * 0.6 + rise);
    if (!sc) { f.el.style.display = "none"; continue; }
    f.el.style.display = "block";
    if (f.dmg) {
      const pop = k < 0.08 ? 0.4 + 1.1 * (k / 0.08) : k < 0.2 ? 1.5 - 0.5 * ((k - 0.08) / 0.12) : 1;
      const fz = k > 0.62 ? (k - 0.62) / 0.38 : 0;
      const dx = (f.drift || 0) * 14 * k;
      f.el.style.transform = "translate(" + (sc.x + dx).toFixed(1) + "px," + sc.y.toFixed(1) + "px) translate(-50%,-50%) scale(" + (pop * (1 + fz * 0.35)).toFixed(2) + "," + (pop * (1 - fz * 0.5)).toFixed(2) + ")";
      f.el.style.opacity = fz ? (Math.max(0, 1 - fz * 1.1) * (0.7 + 0.3 * Math.sin(f.t * 70))).toFixed(2) : 1;
      f.el.style.letterSpacing = fz ? (fz * 0.35).toFixed(2) + "em" : "";
      continue;
    }
    const pop = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
    f.el.style.transform = "translate(" + sc.x.toFixed(1) + "px," + sc.y.toFixed(1) + "px) translate(-50%,-50%) scale(" + pop.toFixed(2) + ")";
    f.el.style.opacity = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
  }
  for (const f of VIEW.floaters.keys()) if (!S.floaters.includes(f)) { if (f.el) f.el.remove(); VIEW.floaters.delete(f); }
}

function makeCursor() {
  const c = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xd8a070, depthTest: false, transparent: true });
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), mat);
  gem.scale.set(0.75, 1.25, 0.75); gem.position.y = 0.2; gem.renderOrder = 10;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 4), mat);
  tip.rotation.x = Math.PI; tip.scale.set(1, 1, 0.45); tip.position.y = -0.08; tip.renderOrder = 10;
  const notch = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.18, 4), new THREE.MeshBasicMaterial({ color: 0x2a1a10, depthTest: false, transparent: true }));
  notch.rotation.x = Math.PI; notch.scale.set(1, 1, 0.5); notch.position.set(0, 0.03, 0.02); notch.renderOrder = 11;
  c.add(gem, tip, notch);
  c.material = mat;
  W3.scene.add(c);
  VIEW.cursor = c;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.86, 40), new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  W3.scene.add(ring);
  VIEW.groundRing = ring;
  const mr = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.34, 24), new THREE.MeshBasicMaterial({ color: 0x5bc0de, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  mr.rotation.x = -Math.PI / 2;
  W3.scene.add(mr);
  VIEW.moveRing = mr;
}

function updateCursor() {
  const t = player.target;
  const ok = t && (t.kind === "npc" || t.alive);
  VIEW.cursor.visible = !!ok;
  VIEW.groundRing.visible = !!ok && t.kind !== "npc";
  if (ok) {
    let col = 0xd8a070;
    if (isMob(t) || (t.kind === "remote" && UI.cmd && UI.cmd.page === "ma")) {
      const range = UI.cmd && UI.cmd.page === "ma" ? CONFIG.castRange : isMob(t) ? reach(player) + (UI.cmd && UI.cmd.page !== "root" ? 0 : 0) : CONFIG.castRange;
      const d = dist(player, t);
      col = d <= range * 0.85 ? 0x7a8cff : d <= range * 1.08 ? 0xffe050 : 0xff4a3a;
    }
    VIEW.cursor.material.color.setHex(col);
    VIEW.groundRing.material.color.setHex(isMob(t) ? (ffMobAttacking(t) ? 0xff4a3a : 0x7dff8a) : col);
    const base = groundY(t.x, t.y);
    VIEW.cursor.position.set(t.x * U, base + entityHeight(t) + 0.55 + Math.sin(S.time * 4) * 0.08, t.y * U);
    VIEW.cursor.rotation.y += 0.04;
    const rr = Math.max(0.6, (t.radius || 14) * U * 1.4);
    VIEW.groundRing.scale.setScalar(rr);
    VIEW.groundRing.position.set(t.x * U, groundY(t.x, t.y) + 0.06, t.y * U);
  }
  VIEW.moveRing.visible = !!S.moveTarget;
  if (S.moveTarget) VIEW.moveRing.position.set(S.moveTarget.x * U, groundY(S.moveTarget.x, S.moveTarget.y) + 0.06, S.moveTarget.y * U);
}

function aggroDecal(i) {
  if (VIEW.aggroPool[i]) return VIEW.aggroPool[i];
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.CircleGeometry(1, 32, -Math.PI / 3, (2 * Math.PI) / 3), new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  cone.rotation.x = -Math.PI / 2;
  const circ = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0x78b4ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }));
  circ.rotation.x = -Math.PI / 2;
  g.add(cone, circ);
  g.userData = { cone, circ };
  W3.scene.add(g);
  VIEW.aggroPool[i] = g;
  return g;
}

function updateAggroHints() {
  let n = 0;
  if (false) {
    for (const m of S.mobs) {
      if (!m.alive || m.state !== "idle" || !m.fam.aggro) continue;
      if (dist(m, player) > 320 && player.target !== m) continue;
      const a = m.fam.aggro;
      const g = aggroDecal(n++);
      g.visible = true;
      g.position.set(m.x * U, groundY(m.x, m.y) + 0.12, m.y * U);
      const { cone, circ } = g.userData;
      cone.visible = !!a.sight;
      if (a.sight) { cone.scale.setScalar(a.sight * U); cone.rotation.z = -m.face; cone.material.opacity = player.target === m ? 0.2 : 0.1; }
      const r = a.sound || a.magic || a.lowhp;
      circ.visible = !!r;
      if (r) { circ.scale.setScalar(r * U); circ.material.color.setHex(a.sound ? 0x78b4ff : a.magic ? 0xc88cff : 0xff7878); }
    }
  }
  for (let i = n; i < VIEW.aggroPool.length; i++) VIEW.aggroPool[i].visible = false;
}

function camForward() { return { x: Math.cos(VIEW.yaw), y: Math.sin(VIEW.yaw) }; }

function inputVector() {
  if (S.modal || S.dialog) return { x: 0, y: 0 };
  const k = S.keys;
  let fwd = (k.w ? 1 : 0) - (k.s ? 1 : 0), right = (k.d ? 1 : 0) - (k.a ? 1 : 0);
  if (VIEW.joy.active) { fwd += -VIEW.joy.y; right += VIEW.joy.x; }
  if (!fwd && !right) return { x: 0, y: 0 };
  const f = camForward();
  const r = { x: -f.y, y: f.x };
  const v = { x: f.x * fwd + r.x * right, y: f.y * fwd + r.y * right };
  const len = Math.hypot(v.x, v.y);
  if (len > 1) { v.x /= len; v.y /= len; }
  return v;
}

function updateCamera(dt) {
  const k = S.keys;
  const rot = VIEW.settings.camSpeed || 1;
  const kx = VIEW.settings.keyInvertX ? -1 : 1, ky = VIEW.settings.keyInvertY ? -1 : 1;
  if (k.arrowleft) { VIEW.yaw -= kx * 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.arrowright) { VIEW.yaw += kx * 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.arrowup) VIEW.pitch = clamp(VIEW.pitch + ky * 1.2 * dt, -0.25, 1.25);
  if (k.arrowdown) VIEW.pitch = clamp(VIEW.pitch - ky * 1.2 * dt, -0.25, 1.25);
  if (k.q) { VIEW.yaw -= kx * 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.e) { VIEW.yaw += kx * 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (VIEW.settings.autoCam && player.moving && S.time - VIEW.lastManual > 1.2 && !VIEW.first) {
    const mv = inputVector();
    const backward = (k.s && !k.w) || (VIEW.joy.active && VIEW.joy.y > 0.5);
    if (!backward) {
      const d = normAng(player.face - VIEW.yaw);
      if (Math.abs(d) < 2.4) VIEW.yaw += d * Math.min(1, dt * (mv.x || mv.y ? 1.2 : 2.2));
    }
  }
  const tgt = new THREE.Vector3(player.x * U, groundY(player.x, player.y) + 1.55, player.y * U);
  if (!VIEW.camTarget) VIEW.camTarget = tgt.clone();
  VIEW.camTarget.lerp(tgt, Math.min(1, dt * 12));
  const cam = W3.camera;
  if (VIEW.first) {
    cam.position.set(VIEW.camTarget.x, VIEW.camTarget.y + 0.1, VIEW.camTarget.z);
    const f = camForward();
    cam.lookAt(cam.position.x + f.x, cam.position.y - Math.sin(VIEW.pitch - 0.34), cam.position.z + f.y);
  } else {
    const f = camForward();
    let want = VIEW.dist;
    const h0 = Math.cos(VIEW.pitch), v0 = Math.sin(VIEW.pitch);
    for (let i = 1; i <= 16; i++) {
      const d = VIEW.dist * i / 16;
      const sx = VIEW.camTarget.x - f.x * h0 * d, sz = VIEW.camTarget.z - f.y * h0 * d;
      const inW = S.zone.indoor && (sx / U < 14 || sz / U < 14 || sx / U > S.zone.w - 14 || sz / U > S.zone.h - 14 || VIEW.camTarget.y + v0 * d > 3.1);
      const inHouse = !S.zone.indoor && VIEW.camTarget.y + v0 * d < groundY(sx / U, sz / U) + 6 && (S.zone.houses || []).some(h => Math.abs(sx / U - h.x) < (h.rot ? h.h : h.w) / 2 + 10 && Math.abs(sz / U - h.y) < (h.rot ? h.w : h.h) / 2 + 10);
      if (inW || inHouse || groundY(sx / U, sz / U) + 0.45 > VIEW.camTarget.y + v0 * d) { want = Math.max(S.zone.indoor ? 0.9 : 1.6, d - VIEW.dist / 16); break; }
    }
    if (VIEW.camEff == null) VIEW.camEff = want;
    VIEW.camEff = want < VIEW.camEff ? want : VIEW.camEff + (want - VIEW.camEff) * Math.min(1, dt * 2.5);
    const horiz = h0 * VIEW.camEff, vert = v0 * VIEW.camEff;
    let cx = VIEW.camTarget.x - f.x * horiz, cz = VIEW.camTarget.z - f.y * horiz, cy = VIEW.camTarget.y + vert;
    const ground = groundY(cx / U, cz / U) + 0.6;
    if (cy < ground) cy = ground;
    cam.position.set(cx, cy, cz);
    cam.lookAt(VIEW.camTarget);
  }
  if (S.shake > 0) { cam.position.x += rand(-0.08, 0.08); cam.position.y += rand(-0.08, 0.08); }
}

function canvasXY(ev) {
  const r = $("game").getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top, w: r.width, h: r.height };
}

function pickScreen(x, y, w, h) {
  const ndc = new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1);
  VIEW.raycaster.setFromCamera(ndc, W3.camera);
  const picks = [];
  for (const [e, v] of VIEW.views) if (v.group.visible && (e.alive !== false || e.kind === "npc") && !(e === player && VIEW.first)) picks.push(v.pick);
  const hit = VIEW.raycaster.intersectObjects(picks, false)[0];
  if (hit) return { entity: hit.object.userData.entity };
  const t = VIEW.raycaster.intersectObject(W3.terrain, false)[0];
  if (t) return { point: { x: t.point.x / U, y: t.point.z / U } };
  return null;
}

function onPointerDown(ev) {
  const p = canvasXY(ev);
  const isTouch = ev.pointerType === "touch";
  if (isTouch) VIEW.touch = true;
  if (isTouch && !VIEW.joy.active && p.x < p.w * 0.42 && p.y > p.h * 0.45) {
    VIEW.joy = { active: true, id: ev.pointerId, x: 0, y: 0, cx: p.x, cy: p.y };
    showJoystick(p.x, p.y, 0, 0);
    ev.preventDefault();
    return;
  }
  VIEW.pointers.set(ev.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, t: ev.timeStamp, moved: false, button: ev.button });
  if (VIEW.pointers.size === 2) {
    const [a, b] = [...VIEW.pointers.values()];
    VIEW.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), dist: VIEW.dist };
  }
  $("game").setPointerCapture && $("game").setPointerCapture(ev.pointerId);
}

function onPointerMove(ev) {
  const p = canvasXY(ev);
  if (VIEW.joy.active && ev.pointerId === VIEW.joy.id) {
    let dx = p.x - VIEW.joy.cx, dy = p.y - VIEW.joy.cy;
    const R = 46, len = Math.hypot(dx, dy);
    if (len > R) { dx *= R / len; dy *= R / len; }
    VIEW.joy.x = dx / R; VIEW.joy.y = dy / R;
    if (Math.hypot(VIEW.joy.x, VIEW.joy.y) < 0.15) { VIEW.joy.x = 0; VIEW.joy.y = 0; }
    showJoystick(VIEW.joy.cx, VIEW.joy.cy, dx, dy);
    return;
  }
  const ptr = VIEW.pointers.get(ev.pointerId);
  if (!ptr) return;
  const dx = p.x - ptr.x, dy = p.y - ptr.y;
  ptr.x = p.x; ptr.y = p.y;
  if (Math.hypot(p.x - ptr.sx, p.y - ptr.sy) > 8) ptr.moved = true;
  if (VIEW.pointers.size === 2 && VIEW.pinch) {
    const [a, b] = [...VIEW.pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    VIEW.dist = clamp(VIEW.pinch.dist * VIEW.pinch.d / Math.max(10, d), 2.5, 16);
    return;
  }
  if (ptr.moved) {
    const sp = VIEW.settings.camSpeed || 1;
    VIEW.yaw += dx * 0.006 * sp * (VIEW.settings.invertX === false ? 1 : -1);
    VIEW.pitch = clamp(VIEW.pitch + dy * 0.004 * sp * (VIEW.settings.invertY ? -1 : 1), -0.25, 1.25);
    VIEW.lastManual = S.time;
  }
}

function onPointerUp(ev) {
  if (VIEW.joy.active && ev.pointerId === VIEW.joy.id) {
    VIEW.joy = { active: false, id: null, x: 0, y: 0, cx: 0, cy: 0 };
    hideJoystick();
    return;
  }
  const ptr = VIEW.pointers.get(ev.pointerId);
  VIEW.pointers.delete(ev.pointerId);
  if (VIEW.pointers.size < 2) VIEW.pinch = null;
  if (!ptr || ptr.moved || ev.timeStamp - ptr.t > 450 || ptr.button === 2) return;
  const p = canvasXY(ev);
  const hit = pickScreen(p.x, p.y, p.w, p.h);
  if (!hit) return;
  if (hit.entity) onWorldTap({ x: hit.entity.x, y: hit.entity.y }, hit.entity);
  else onWorldTap(hit.point, null);
}

function showJoystick(cx, cy, dx, dy) {
  const j = $("joy"), k = $("knob");
  j.style.display = "block";
  j.style.left = cx + "px"; j.style.top = cy + "px";
  k.style.transform = "translate(" + dx + "px," + dy + "px)";
}
function hideJoystick() { $("joy").style.display = "none"; }

function onWorldTap(p, ent) {
  if (S.ko || S.modal) return;
  const e = ent;
  if (!e) {
    if (!p) return;
    const z = S.zone;
    S.moveTarget = { x: clamp(p.x, 30, z.w - 30), y: clamp(p.y, 30, z.h - 30) };
    S.chase = false; S.pendingTalk = null;
    return;
  }
  if (isMob(e)) {
    if (player.engaged && player.attackTarget === e && autoRunOn()) S.chase = true;
    if (player.target === e && UI.cmd && UI.cmd.t === e) { tgtCmdClose(); return; }
    setTarget(e);
    if (!UI.cmd) uiEvent("target", e);
    return;
  }
  if (e === player) { setTarget(player); tgtCmdOpen(player); return; }
  if (e.kind === "remote") {
    if (player.target === e && UI.cmd && UI.cmd.t === e) { tgtCmdClose(); return; }
    setTarget(e);
    tgtCmdOpen(e);
    return;
  }
  if (e.kind === "npc") {
    if (dist(player, e) <= CONFIG.talkRange) { talkTo(e); return; }
    player.target = e;
    S.pendingTalk = e;
    S.moveTarget = { x: e.x, y: e.y };
    return;
  }
  setTarget(e);
}

const frames = n => new Promise(res => { let k = n; const f = () => (--k <= 0 ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
function loaderShow(title, sub) {
  const el = $("loading");
  if (!el) return;
  el.classList.add("on");
  el.classList.toggle("zone", !VIEW.booting);
  $("ldTitle").textContent = title;
  $("ldSub").textContent = sub || "";
  loaderProgress(0.05, "");
}
function loaderProgress(p, text) {
  const f = $("ldFill");
  if (!f) return;
  f.style.width = Math.round(clamp(p, 0, 1) * 100) + "%";
  if (text != null) $("ldText").textContent = text;
}
function loaderHide() { const el = $("loading"); if (el) el.classList.remove("on"); if (typeof stopShowcase === "function") stopShowcase(); }
const PERF = {
  boot: [], zones: [], cur: null, t0: 0,
  mark(name) { this.boot.push([name, Math.round(performance.now() - this.t0)]); },
  zoneStart(name) { this.cur = { zone: name, t0: performance.now(), steps: {}, gap: 0, frames: 0, last: performance.now(), phases: [] }; this.zones.push(this.cur); if (this.zones.length > 12) this.zones.shift(); },
  phase(name) { const c = this.cur; if (c) c.phases.push([name, Math.round(performance.now() - c.t0)]); },
  slice(label, ms) { const c = this.cur; if (!c) return; const e = c.steps[label] || (c.steps[label] = { ms: 0, n: 0, max: 0 }); e.ms += ms; e.n++; if (ms > e.max) e.max = ms; },
  frame() { const c = this.cur; if (!c || c.done) return; const n = performance.now(); const g = n - c.last; c.last = n; c.frames++; if (g > c.gap) c.gap = g; },
  zoneEnd() { const c = this.cur; if (!c) return; c.total = Math.round(performance.now() - c.t0); c.done = true; },
  props() {
    const out = [], f = W3.field;
    if (!f || !W3.zoneRoot) return out;
    const m = new THREE.Matrix4(), v = new THREE.Vector3();
    W3.zoneRoot.traverse(o => {
      if (!o.isInstancedMesh) return;
      let hi = 0, n = 0, worst = null;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m);
        v.setFromMatrixPosition(m);
        const gy = f.heightAt(v.x / U, v.z / U), d = v.y - gy;
        if (d > 2.5) { n++; if (d > hi) { hi = d; worst = { x: Math.round(v.x / U), y: Math.round(v.z / U), d: Math.round(d * 10) / 10, edge: Math.round(f.outsideE(v.x / U, v.z / U)) }; } }
      }
      if (n) out.push({ mesh: o.name || o.geometry.type, count: o.count, high: n, maxAbove: Math.round(hi * 10) / 10, worst });
    });
    return out.sort((a, b) => b.maxAbove - a.maxAbove);
  },
  report() {
    const z = this.zones.map(c => ({ zone: c.zone, total: c.total, worstFrameGap: Math.round(c.gap), phases: c.phases, steps: Object.fromEntries(Object.entries(c.steps).map(([k, e]) => [k, { ms: Math.round(e.ms), slices: e.n, maxSlice: Math.round(e.max) }])) }));
    return { boot: this.boot, zones: z };
  },
  table() {
    const r = this.report(), L = [];
    L.push("Boot: " + r.boot.map(b => b[0] + " " + b[1] + "ms").join(", "));
    for (const c of r.zones) {
      L.push(c.zone + ": " + c.total + "ms, worst gap " + c.worstFrameGap + "ms");
      for (const [k, e] of Object.entries(c.steps)) L.push("  " + k + " " + e.ms + "ms (" + e.slices + " slices, max " + e.maxSlice + "ms)");
      L.push("  " + c.phases.map(p => p[0] + " " + p[1]).join(", "));
    }
    return L;
  }
};
function buildZoneNow() {
  clearViews();
  buildZone3D();
  if (!RIG.atlas) buildAtlas();
  VIEW.yaw = player.face || 0;
  VIEW.camTarget = null;
}
async function buildZoneAsync(job, p0, p1) {
  clearViews();
  const gen = buildZone3DSteps();
  let last = performance.now(), r, lab = "start", sl = last;
  while (!(r = gen.next()).done) {
    const v = r.value || {};
    PERF.slice(v.t || lab, performance.now() - sl);
    if (v.t) lab = v.t;
    if (performance.now() - last < 28) { sl = performance.now(); continue; }
    loaderProgress(p0 + (p1 - p0) * (v.p || 0), v.t);
    await frames(1);
    if (job !== VIEW.zoneJob) return false;
    last = performance.now();
    sl = last;
  }
  PERF.slice("tail", performance.now() - sl);
  const ta = performance.now();
  if (!RIG.atlas) buildAtlas();
  PERF.slice("atlas", performance.now() - ta);
  VIEW.yaw = player.face || 0;
  VIEW.camTarget = null;
  VIEW.camEff = null;
  return true;
}
function onZoneEntered() {
  if (!W3.renderer) return;
  if (!$("loading")) { buildZoneNow(); return; }
  const job = VIEW.zoneJob = (VIEW.zoneJob || 0) + 1;
  VIEW.loading = true;
  if (!VIEW.booting) loaderShow(S.zone.name, S.zone.theme === "house" ? "Home" : "Entering");
  if (typeof startShowcase === "function") try { startShowcase(); } catch (e) {}
  loadZoneAsync(job);
}
async function loadZoneAsync(job) {
  try { await loadZoneInner(job); } catch (e) {
    reportError(e, "zone");
    if (job === VIEW.zoneJob) { VIEW.loading = false; try { loaderHide(); } catch (e2) {} const ws = VIEW.zoneWaiters || []; VIEW.zoneWaiters = []; for (const f of ws) try { f(); } catch (e3) {} }
  }
}
async function loadZoneInner(job) {
  const t0 = performance.now();
  PERF.zoneStart(S.zone.name);
  await frames(2);
  if (job !== VIEW.zoneJob) return;
  PERF.phase("frames");
  loaderProgress(VIEW.booting ? 0.6 : 0.1, "Shaping the land…");
  await frames(1);
  if (job !== VIEW.zoneJob) return;
  if (!(await buildZoneAsync(job, VIEW.booting ? 0.6 : 0.1, VIEW.booting ? 0.85 : 0.85))) return;
  PERF.phase("built");
  loaderProgress(0.88, "Warming up…");
  try { if (W3.renderer.compileAsync) await Promise.race([W3.renderer.compileAsync(W3.scene, W3.camera), new Promise(r => setTimeout(r, 6000))]); } catch (e) {}
  if (job !== VIEW.zoneJob) return;
  PERF.phase("compiled");
  loaderProgress(0.9, "Gathering everyone…");
  await frames(1);
  if (job !== VIEW.zoneJob) return;
  draw(1 / 60);
  PERF.phase("firstDraw");
  loaderProgress(1, "Ready");
  await frames(1);
  const wait = (VIEW.booting ? 0 : 450) - (performance.now() - t0);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  if (job !== VIEW.zoneJob) return;
  PERF.zoneEnd();
  VIEW.loading = false;
  if (!VIEW.booting) loaderHide();
  const ws = VIEW.zoneWaiters || [];
  VIEW.zoneWaiters = [];
  ws.forEach(f => f());
}
function zoneReady() { return VIEW.loading ? new Promise(r => (VIEW.zoneWaiters = VIEW.zoneWaiters || []).push(r)) : Promise.resolve(); }

const JUMP = { windup: 0.11, air: 0.64, land: 0.22 };
function jumpPhase(e) {
  if (e !== player || VIEW.jumpStart == null) return null;
  const t = S.time - VIEW.jumpStart;
  const m = player.mounted;
  const wu = m ? 0.04 : JUMP.windup, air = m ? 0.7 : JUMP.air, land = m ? 0.12 : JUMP.land;
  if (t < 0) return null;
  if (t < wu) return { phase: "windup", k: t / wu, air: 0, wu, airT: air, land };
  if (t < wu + air) return { phase: "air", k: (t - wu) / air, air: Math.sin(Math.PI * (t - wu) / air), wu, airT: air, land };
  if (t < wu + air + land) return { phase: "land", k: (t - wu - air) / land, air: 0, wu, airT: air, land };
  return { phase: "done", k: 1, air: 0 };
}
function jumpHeight(e) {
  const j = jumpPhase(e);
  if (!j) return 0;
  if (j.phase === "done") { VIEW.jumpStart = null; return 0; }
  if (j.phase === "land" && !VIEW.jumpLanded) { VIEW.jumpLanded = true; if (typeof sfx === "function") sfx(player.mounted ? "hoof" : "step"); if (typeof fxFootstep === "function") { const v = VIEW.views.get(player); if (v) { fxFootstep(player, v); fxFootstep(player, v); } } }
  return j.air * (player.mounted ? 1.1 : 0.9);
}
function tryJump() {
  if (S.ko || S.modal || S.dialog || !player.alive || player.casting || VIEW.jumpStart != null || player.resting) return;
  VIEW.jumpStart = S.time;
  VIEW.jumpLanded = false;
  if (save.stats) save.stats.jumps++;
  if (typeof sfx === "function") sfx("jump");
}

function graphicsSettingsHTML() {
  const s = VIEW.settings;
  const q = W3.quality;
  const btn = (a, v, label, on) => '<button data-a="' + a + '" data-v="' + v + '"' + (on ? ' class="on"' : "") + ">" + label + "</button>";
  return "<h3>Graphics</h3><div class=\"opt\">" + btn("quality", "low", "Low", q === "low") + btn("quality", "medium", "Medium", q === "medium") + btn("quality", "high", "High", q === "high") + '</div><div class="opt">' + btn("gfx", "outline:" + (outlineOn() ? "off" : "on"), "Outlines " + (outlineOn() ? "on" : "off"), outlineOn()) + btn("gfx", "attire:" + (jobStyleOn() ? "gear" : "job"), jobStyleOn() ? "Job style" : "Show gear", jobStyleOn()) + '</div><div class="sub">Job style dresses every adventurer in their job\'s signature outfit, which grows grander at levels 5, 10 and 16. Show gear draws the armour you have equipped instead. Weapons and shields always show.</div><div class="sub">High adds colour grading that follows the time of day, smoother edges, sharper shadows and full-resolution water reflections. If the game stays slow, it turns off colour grading and then sun shadows by itself. Characters far from the camera always use simpler models (sooner on Low). Changing quality reloads the 3D scene.</div>' +
    "<h3>Performance</h3><div class=\"opt\">" + btn("draw", "near", "Draw near", s.draw === "near") + btn("draw", "normal", "Draw normal", (s.draw || "normal") === "normal") + btn("draw", "far", "Draw far", s.draw === "far") + btn("toggle", "adaptive", "Auto resolution " + (s.adaptive !== false ? "on" : "off"), s.adaptive !== false) + btn("toggle", "fps", "FPS counter " + (s.fps ? "on" : "off"), s.fps) + '</div><div class="sub">Draw distance hides far monsters and name plates. Auto resolution lowers the render scale when the frame rate drops and raises it again when there is headroom. Use Low graphics on older phones.</div>' +
    "<h3>Camera</h3><div class=\"opt\">" + btn("toggle", "autoCam", "Auto-follow " + (s.autoCam ? "on" : "off"), s.autoCam) + btn("toggle", "invertX", "Mouse invert horizontal " + (s.invertX !== false ? "on" : "off"), s.invertX !== false) + btn("toggle", "invertY", "Mouse invert vertical " + (s.invertY ? "on" : "off"), s.invertY) + btn("toggle", "keyInvertX", "Keyboard invert horizontal " + (s.keyInvertX ? "on" : "off"), !!s.keyInvertX) + btn("toggle", "keyInvertY", "Keyboard invert vertical " + (s.keyInvertY ? "on" : "off"), !!s.keyInvertY) + btn("camspeed", "", "Sensitivity ×" + s.camSpeed, false) + btn("toggle", "first", "First person " + (VIEW.first ? "on" : "off"), VIEW.first) + '</div><div class="opt">' + btn("toggle", "autoRun", "Auto-run to target " + (s.autoRun ? "on" : "off"), !!s.autoRun) + '</div><div class="sub">Off by default: attacking or engaging an enemy leaves you where you stand, so you choose when to move in. On makes you run to your target when you attack.</div>' +

    appearanceHTML();
}

function appearanceHTML() { return ""; }

function handleSettingAction(a, v) {
  const s = VIEW.settings;
  if (a === "look") {
    const l = save.look;
    const n = { build: 2, skin: SKIN_TONES.length, hairStyle: HAIR_STYLES.length, hairColor: HAIR_COLORS.length }[v];
    if (n) { l[v] = ((l[v] || 0) + 1) % n; saveGame(); }
    return true;
  }
  if (a === "quality") { s.quality = v; saveSettings(s); location.reload(); return true; }
  if (a === "gfx") {
    const kv = String(v).split(":");
    if (kv[0] === "outline") s.outline = kv[1] === "on";
    else if (kv[0] === "attire") s.attire = kv[1] === "gear" ? "gear" : "job";
    saveSettings(s);
    location.reload();
    return true;
  }
  if (a === "toggle") {
    if (v === "first") VIEW.first = !VIEW.first;
    else s[v] = !s[v];
    saveSettings(s);
    return true;
  }
  if (a === "draw") { s.draw = v; saveSettings(s); return true; }
  if (a === "camspeed") { s.camSpeed = s.camSpeed >= 2 ? 0.5 : Math.round((s.camSpeed + 0.5) * 10) / 10; saveSettings(s); return true; }
  return false;
}

function initViewA() {
  VIEW.settings = loadSettings();
  initRenderer();
}
function initViewB() {
  buildAtlas();
  initFX();
  VIEW.raycaster = new THREE.Raycaster();
  makeCursor();
  const c = $("game");
  c.addEventListener("pointerdown", onPointerDown);
  c.addEventListener("pointermove", onPointerMove);
  c.addEventListener("pointerup", onPointerUp);
  c.addEventListener("pointercancel", onPointerUp);
  c.addEventListener("contextmenu", e => e.preventDefault());
  c.addEventListener("wheel", e => { e.preventDefault(); VIEW.dist = clamp(VIEW.dist * (e.deltaY > 0 ? 1.1 : 0.9), 2.5, 16); }, { passive: false });
  window.addEventListener("keydown", e => { if (e.key.toLowerCase() === "v" && !S.modal && !S.dialog) VIEW.first = !VIEW.first; });
}
function initView() {
  initViewA();
  initViewB();
}

function draw(dt) {
  dt = dt || 1 / 60;
  perfTick(dt);
  updateCamera(dt);
  updateSky(false);
  for (const p of S.party) syncEntity(p, dt);
  for (const m of S.mobs) syncEntity(m, dt);
  for (const n of S.npcs) syncNpc(n, dt);
  if (S.buddy) syncEntity(S.buddy, dt);
  for (const a of S.ambient || []) syncEntity(a, dt);
  if (S.others) for (const o of S.others.values()) if (o.placed) syncEntity(o, dt);
  syncDecor(dt);
  syncBarriers();
  syncFurniture();
  for (const [e, v] of VIEW.views) {
    const alive = S.party.includes(e) || S.mobs.includes(e) || S.npcs.includes(e) || e === S.buddy || (S.ambient && S.ambient.includes(e)) || (S.others && S.others.get(e.id) === e);
    if (!alive) { destroyView(v); VIEW.views.delete(e); }
  }
  updateCursor();
  updateAggroHints();
  updateFX(dt);
  if (W3.composer) W3.composer.render(); else W3.renderer.render(W3.scene, W3.camera);
  updateLabels();
  updateFloaters();
}
