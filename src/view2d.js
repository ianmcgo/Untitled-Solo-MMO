const VW = 800, VH = 500;
const canvas = $("game");
const ctx = canvas.getContext("2d");
const VIEW = { cam: { x: 0, y: 0 } };
const THEME2D = {
  town: { floor: "#34402f", tile: "#3b4935", wall: "#1d2618" },
  field: { floor: "#3a332b", tile: "#433a31", wall: "#1f1b17" },
  cave: { floor: "#2d2a33", tile: "#34303b", wall: "#16141a" },
  house: { floor: "#5a4632", tile: "#634d37", wall: "#2a1f15" }
};

function onZoneEntered() {}
function vfx() {}

function inputVector() {
  if (S.modal || S.dialog) return { x: 0, y: 0 };
  const k = S.keys;
  let x = 0, y = 0;
  if (k.w || k.arrowup) y -= 1;
  if (k.s || k.arrowdown) y += 1;
  if (k.a || k.arrowleft) x -= 1;
  if (k.d || k.arrowright) x += 1;
  return { x, y };
}

function drawZone() {
  const z = S.zone, c = VIEW.cam, th = THEME2D[z.theme] || THEME2D.field;
  ctx.fillStyle = th.floor;
  ctx.fillRect(0, 0, z.w, z.h);
  ctx.fillStyle = th.tile;
  const tile = 40;
  const x0 = Math.floor(c.x / tile) * tile, y0 = Math.floor(c.y / tile) * tile;
  for (let y = y0; y < c.y + VH + tile; y += tile)
    for (let x = x0; x < c.x + VW + tile; x += tile)
      if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (const r of S.decor) { ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.7, r.a, 0, Math.PI * 2); ctx.fill(); }
  for (const w of z.water || []) {
    ctx.fillStyle = "#2f6d8f";
    ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = th.wall;
  ctx.fillRect(0, 0, z.w, 24);
  ctx.fillRect(0, z.h - 24, z.w, 24);
  ctx.fillRect(0, 0, 24, z.h);
  ctx.fillRect(z.w - 24, 0, 24, z.h);
  for (const ex of z.exits) {
    ctx.fillStyle = "rgba(255,213,79,0.35)";
    ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
    ctx.fillStyle = "#ffd54f";
    ctx.font = "12px system-ui";
    ctx.textAlign = ex.x === 0 ? "left" : "right";
    ctx.fillText(ex.x === 0 ? "← " + ex.label : ex.label + " →", ex.x === 0 ? 32 : z.w - 32, ex.y + ex.h / 2 + 4);
  }
}

function drawAggroHints() {
  for (const m of S.mobs) {
    if (!m.alive || m.state !== "idle" || !m.fam.aggro) continue;
    const near = dist(m, player) < 320;
    const focused = player.target === m;
    if (!near && !focused) continue;
    const a = m.fam.aggro;
    const alpha = focused ? 0.22 : 0.09;
    if (a.sight) {
      ctx.fillStyle = "rgba(255,90,60," + alpha + ")";
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.arc(m.x, m.y, a.sight, m.face - Math.PI / 3, m.face + Math.PI / 3);
      ctx.closePath();
      ctx.fill();
    }
    for (const [k, col] of [["sound", "rgba(120,180,255,"], ["magic", "rgba(200,140,255,"], ["lowhp", "rgba(255,120,120,"]]) {
      if (!a[k]) continue;
      ctx.strokeStyle = col + (alpha * 2.5) + ")";
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(m.x, m.y, a[k], 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

function drawNpc(n) {
  ctx.save();
  ctx.translate(n.x, n.y);
  if (n.crystal) { ctx.rotate(S.time * 0.8); ctx.shadowColor = "#80deea"; ctx.shadowBlur = 16; }
  ctx.fillStyle = n.crystal ? "#80deea" : "#e8d9b0";
  ctx.beginPath();
  ctx.moveTo(0, -16); ctx.lineTo(12, 0); ctx.lineTo(0, 16); ctx.lineTo(-12, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#e8d9b0";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(n.name, n.x, n.y - 24);
  if (questMarker(n)) {
    ctx.fillStyle = "#ffd54f";
    ctx.font = "bold 20px system-ui";
    ctx.fillText("!", n.x, n.y - 40 + Math.sin(S.time * 4) * 3);
  }
  if (player.target === n) {
    ctx.strokeStyle = "#ffd54f"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(n.x, n.y, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
}

function drawEntity(e) {
  const fade = isMob(e) && !e.alive ? clamp(1 - (S.time - e.deadAt) / 2.5, 0, 1) * 0.5 : e.alive ? 1 : 0.35;
  if (e.despawned) return;
  ctx.globalAlpha = fade;
  ctx.fillStyle = e.flash > 0 ? "#ffffff" : e.color;
  ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
  if (e === player) { ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1; }
  ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(e.face) * e.radius, e.y + Math.sin(e.face) * e.radius); ctx.stroke();
  ctx.lineWidth = 1;
  if (isMob(e) && e.fam.nm) { ctx.strokeStyle = e.fam.aura || "#ffd54f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 3, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; }
  ctx.fillStyle = isMob(e) ? conOf(e)[1] : "#cfe6ff";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(e === player ? "You" : e.name, e.x, e.y - e.radius - 8);
  ctx.globalAlpha = 1;
}

function drawBar(e, y, pct, col) {
  const w = 38, x = e.x - w / 2;
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(x - 1, y - 1, w + 2, 6);
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w * clamp(pct, 0, 1), 4);
}

function draw() {
  const z = S.zone;
  VIEW.cam.x = clamp(player.x - VW / 2, 0, Math.max(0, z.w - VW));
  VIEW.cam.y = clamp(player.y - VH / 2, 0, Math.max(0, z.h - VH));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, VW, VH);
  ctx.save();
  if (S.shake > 0) ctx.translate(rand(-4, 4), rand(-4, 4));
  ctx.translate(-VIEW.cam.x, -VIEW.cam.y);
  drawZone();
  drawAggroHints();
  for (const n of S.npcs) drawNpc(n);
  if (S.moveTarget) { ctx.strokeStyle = "rgba(91,192,222,0.6)"; ctx.beginPath(); ctx.arc(S.moveTarget.x, S.moveTarget.y, 6, 0, Math.PI * 2); ctx.stroke(); }
  const t = player.target;
  if (t && t.alive !== false && t.kind !== "npc") {
    ctx.strokeStyle = isMob(t) ? (player.engaged && player.attackTarget === t ? "#ff5252" : "#ffd54f") : "#8ec5ff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(t.x, t.y, t.radius + 7, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
  for (const m of S.mobs) drawEntity(m);
  for (const p of S.party) drawEntity(p);
  for (const fx of S.effects) {
    const k = fx.t / fx.life;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = fx.color;
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(fx.x, fx.y, fx.r0 + (fx.r1 - fx.r0) * k, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  for (const e of S.party.concat(S.mobs)) {
    if (!e.alive) continue;
    const showHp = !isMob(e) || player.target === e || e.state === "combat";
    let y = e.y + e.radius + 6;
    if (showHp) { drawBar(e, y, e.hp / e.maxHp, isMob(e) ? "#d9534f" : "#9ad06b"); y += 7; }
    if (e.casting) drawBar(e, y, (S.time - e.casting.start) / (e.casting.end - e.casting.start), "#64b5f6");
    if (e.readying) drawBar(e, y, 1 - e.readying.t, "#ff7043");
  }
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  for (const f of S.floaters) {
    const k = f.t / f.life;
    const pop = k < 0.12 ? 1 + (0.12 - k) * 3 : 1;
    ctx.globalAlpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
    ctx.font = "bold " + Math.round(f.size * pop) + "px system-ui";
    const y = f.y - f.h - 34 * k;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(f.text, f.x, y);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, y);
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1;
  ctx.restore();
  if (!z.indoor && z.theme !== "cave" && isNight()) {
    ctx.fillStyle = "rgba(10,20,60,0.35)";
    ctx.fillRect(0, 0, VW, VH);
  }
}

function canvasPoint(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: (ev.clientX - r.left) * VW / r.width + VIEW.cam.x, y: (ev.clientY - r.top) * VH / r.height + VIEW.cam.y };
}

function pickAt(p) {
  const hit = e => Math.hypot(p.x - e.x, p.y - e.y) <= e.radius + 10;
  return S.mobs.find(m => m.alive && hit(m)) || S.npcs.find(hit) || S.party.find(hit) || null;
}

function onWorldTap(p) {
  if (S.ko || S.modal) return;
  const e = pickAt(p);
  if (!e) { S.moveTarget = p; S.chase = false; S.pendingTalk = null; return; }
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

function initView() {
  canvas.addEventListener("pointerdown", ev => onWorldTap(canvasPoint(ev)));
}
