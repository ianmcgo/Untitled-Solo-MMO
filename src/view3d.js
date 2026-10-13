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

function updateLabels() {
  const seen = new Set();
  const all = S.party.concat(S.mobs, S.npcs);
  for (const e of all) {
    if (e === player && VIEW.first) continue;
    if (isMob(e) && (!e.alive || e.despawned)) continue;
    const d = dist(e, player);
    if (d > 900 && player.target !== e) continue;
    const sc = screenOf(e.x, e.y, entityHeight(e) + 0.25);
    if (!sc) continue;
    const el = labelFor(e);
    seen.add(e);
    el.style.transform = "translate(" + sc.x.toFixed(1) + "px," + sc.y.toFixed(1) + "px) translate(-50%,-100%)";
    const nameEl = el.firstChild, bar = el.children[1], cbar = el.children[2];
    const isT = player.target === e;
    let name = e === player ? save.name : e.name, col = "#cfe6ff";
    if (isMob(e)) { col = conOf(e)[1]; if (e.fam.nm) name = "☠ " + name; }
    if (e.kind === "npc") { col = "#e8d9b0"; if (questMarker(e)) name = "❗ " + name; }
    if (nameEl.textContent !== name) nameEl.textContent = name;
    nameEl.style.color = col;
    el.classList.toggle("tgt", isT);
    const showHp = e.kind !== "npc" && (isParty(e) || isT || e.state === "combat");
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
  for (const f of S.floaters) {
    if (!f.el) {
      f.el = document.createElement("div");
      f.el.className = "floater";
      f.el.textContent = f.text;
      f.el.style.color = f.color;
      f.el.style.fontSize = f.size + "px";
      $("overlay").appendChild(f.el);
      VIEW.floaters.set(f, true);
    }
    const k = f.t / f.life;
    const sc = screenOf(f.x, f.y, 2.0 + (f.h - 18) * U * 0.6 + k * 1.1);
    if (!sc) { f.el.style.display = "none"; continue; }
    f.el.style.display = "block";
    const pop = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
    f.el.style.transform = "translate(" + sc.x.toFixed(1) + "px," + sc.y.toFixed(1) + "px) translate(-50%,-50%) scale(" + pop.toFixed(2) + ")";
    f.el.style.opacity = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
  }
  for (const f of VIEW.floaters.keys()) if (!S.floaters.includes(f)) { if (f.el) f.el.remove(); VIEW.floaters.delete(f); }
}

function makeCursor() {
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 4), new THREE.MeshBasicMaterial({ color: 0xffd54f, depthTest: false, transparent: true }));
  c.rotation.x = Math.PI;
  c.renderOrder = 10;
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
    const col = isMob(t) ? (player.engaged && player.attackTarget === t ? 0xff4d4d : 0xffd54f) : t.kind === "npc" ? 0xffd54f : 0x8ec5ff;
    VIEW.cursor.material.color.setHex(col);
    VIEW.groundRing.material.color.setHex(col);
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
  if (VIEW.settings.aggroHints) {
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
  if (k.arrowleft) { VIEW.yaw -= 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.arrowright) { VIEW.yaw += 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.arrowup) VIEW.pitch = clamp(VIEW.pitch + 1.2 * dt, -0.25, 1.25);
  if (k.arrowdown) VIEW.pitch = clamp(VIEW.pitch - 1.2 * dt, -0.25, 1.25);
  if (k.q) { VIEW.yaw -= 2.2 * rot * dt; VIEW.lastManual = S.time; }
  if (k.e) { VIEW.yaw += 2.2 * rot * dt; VIEW.lastManual = S.time; }
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
    const horiz = Math.cos(VIEW.pitch) * VIEW.dist, vert = Math.sin(VIEW.pitch) * VIEW.dist;
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
    VIEW.yaw += dx * 0.006 * sp;
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
    if (player.target === e) {
      if (player.engaged && player.attackTarget === e) S.chase = true;
      else toggleEngage(true);
    } else setTarget(e);
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
function loaderHide() { const el = $("loading"); if (el) el.classList.remove("on"); }
function buildZoneNow() {
  clearViews();
  buildZone3D();
  if (!RIG.atlas) buildAtlas();
  VIEW.yaw = player.face || 0;
  VIEW.camTarget = null;
}
function onZoneEntered() {
  if (!W3.renderer) return;
  if (!$("loading")) { buildZoneNow(); return; }
  const job = VIEW.zoneJob = (VIEW.zoneJob || 0) + 1;
  VIEW.loading = true;
  if (!VIEW.booting) loaderShow(S.zone.name, S.zone.theme === "house" ? "Home" : "Entering");
  loadZoneAsync(job);
}
async function loadZoneAsync(job) {
  const t0 = performance.now();
  await frames(2);
  if (job !== VIEW.zoneJob) return;
  loaderProgress(VIEW.booting ? 0.6 : 0.3, "Shaping the land…");
  await frames(1);
  if (job !== VIEW.zoneJob) return;
  buildZoneNow();
  loaderProgress(VIEW.booting ? 0.8 : 0.7, "Gathering everyone…");
  await frames(1);
  if (job !== VIEW.zoneJob) return;
  draw(1 / 60);
  loaderProgress(1, "Ready");
  await frames(1);
  const wait = (VIEW.booting ? 0 : 450) - (performance.now() - t0);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  if (job !== VIEW.zoneJob) return;
  VIEW.loading = false;
  if (!VIEW.booting) loaderHide();
  const ws = VIEW.zoneWaiters || [];
  VIEW.zoneWaiters = [];
  ws.forEach(f => f());
}
function zoneReady() { return VIEW.loading ? new Promise(r => (VIEW.zoneWaiters = VIEW.zoneWaiters || []).push(r)) : Promise.resolve(); }

function jumpHeight(e) {
  if (e !== player || VIEW.jumpStart == null) return 0;
  const k = (S.time - VIEW.jumpStart) / 0.62;
  if (k >= 1 || k < 0) { if (k >= 1) { VIEW.jumpStart = null; if (typeof sfx === "function") sfx(player.mounted ? "hoof" : "step"); } return 0; }
  return Math.sin(Math.PI * k) * (player.mounted ? 1.1 : 0.85);
}
function tryJump() {
  if (S.ko || S.modal || S.dialog || !player.alive || player.casting || VIEW.jumpStart != null) return;
  VIEW.jumpStart = S.time;
  if (typeof sfx === "function") sfx("jump");
}

function graphicsSettingsHTML() {
  const s = VIEW.settings;
  const q = W3.quality;
  const btn = (a, v, label, on) => '<button data-a="' + a + '" data-v="' + v + '"' + (on ? ' class="on"' : "") + ">" + label + "</button>";
  return "<h3>Graphics</h3><div class=\"opt\">" + btn("quality", "low", "Low", q === "low") + btn("quality", "medium", "Medium", q === "medium") + btn("quality", "high", "High", q === "high") + '</div><div class="sub">High adds bloom, sharper shadows and full-resolution water reflections. Changing quality reloads the 3D scene.</div>' +
    "<h3>Camera</h3><div class=\"opt\">" + btn("toggle", "autoCam", "Auto-follow " + (s.autoCam ? "on" : "off"), s.autoCam) + btn("toggle", "invertY", "Invert vertical " + (s.invertY ? "on" : "off"), s.invertY) + btn("camspeed", "", "Sensitivity ×" + s.camSpeed, false) + btn("toggle", "first", "First person " + (VIEW.first ? "on" : "off"), VIEW.first) + "</div>" +
    "<h3>Display</h3><div class=\"opt\">" + btn("toggle", "aggroHints", "Aggro ranges " + (s.aggroHints ? "shown" : "hidden"), s.aggroHints) + "</div>" +
    appearanceHTML();
}

function appearanceHTML() {
  const l = save.look;
  const sw = c => '<span class="sw" style="background:#' + c.toString(16).padStart(6, "0") + '"></span>';
  const btn = (k, label) => '<button data-a="look" data-v="' + k + '">' + label + "</button>";
  return "<h3>Appearance</h3><div class=\"opt\">" +
    btn("build", "Build: " + (l.build ? "B" : "A")) +
    btn("skin", "Skin " + sw(SKIN_TONES[l.skin])) +
    btn("hairStyle", "Hair: " + HAIR_STYLE_NAMES[HAIR_STYLES[l.hairStyle]]) +
    btn("hairColor", "Hair colour " + sw(HAIR_COLORS[l.hairColor])) +
    '</div><div class="sub">Changes show on your character right away.</div>';
}

function handleSettingAction(a, v) {
  const s = VIEW.settings;
  if (a === "look") {
    const l = save.look;
    const n = { build: 2, skin: SKIN_TONES.length, hairStyle: HAIR_STYLES.length, hairColor: HAIR_COLORS.length }[v];
    if (n) { l[v] = ((l[v] || 0) + 1) % n; saveGame(); }
    return true;
  }
  if (a === "quality") { s.quality = v; saveSettings(s); location.reload(); return true; }
  if (a === "toggle") {
    if (v === "first") VIEW.first = !VIEW.first;
    else s[v] = !s[v];
    saveSettings(s);
    return true;
  }
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
  updateCamera(dt);
  updateSky(false);
  for (const p of S.party) syncEntity(p, dt);
  for (const m of S.mobs) syncEntity(m, dt);
  for (const n of S.npcs) syncNpc(n, dt);
  syncDecor(dt);
  for (const [e, v] of VIEW.views) {
    const alive = S.party.includes(e) || S.mobs.includes(e) || S.npcs.includes(e);
    if (!alive) { destroyView(v); VIEW.views.delete(e); }
  }
  updateCursor();
  updateAggroHints();
  updateFX(dt);
  if (W3.composer) W3.composer.render(); else W3.renderer.render(W3.scene, W3.camera);
  updateLabels();
  updateFloaters();
}
