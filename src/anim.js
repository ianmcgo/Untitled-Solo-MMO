const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const env = (k, a, b) => k < 0 || k > 1 ? 0 : Math.min(1, k / a, (1 - k) / b);

function animState(v) {
  if (!v.an) v.an = { ph: Math.random() * 6, spd: 0, lx: null, ly: null, swing: null, aStart: -9, aVar: 0, ws: null, wsStart: -9, hit: null, hitStart: -9, casting: false, relStart: -9, dead: null, t0: Math.random() * 10, fight: 0, lastStep: 0, readyStart: -9, wasReady: false };
  return v.an;
}

function strideEff(v, spd) {
  const run = clamp((spd - 1.2) / 4, 0, 1), S = (v.stride || 1.7) * (1 + 0.9 * run), B = v.bones;
  if (v.kind !== "human" || !B || !B.shinL || !B.footL) return S;
  const L = (B.shinL.position.length() + B.footL.position.length()) * (v.scale || 1);
  return Math.min(S, 1.25 * L / (0.62 - 0.28 * run));
}
function trackEvents(v, e, dt) {
  const an = animState(v);
  if (an.lx == null) { an.lx = e.x; an.ly = e.y; }
  const d = Math.hypot(e.x - an.lx, e.y - an.ly) * U;
  an.lx = e.x; an.ly = e.y;
  const raw = dt > 0 ? Math.min(d / dt, 20) : 0;
  an.spd += (raw - an.spd) * Math.min(1, dt * 10);
  an.ph += d * (Math.PI * 2) / strideEff(v, an.spd);
  if (e.lastSwing !== an.swing) { if (an.swing !== null && S.time - e.lastSwing < 0.3) { an.aStart = e.lastSwing; an.aVar = (an.aVar + 1) % 3; } an.swing = e.lastSwing; }
  if (e.lastWS !== an.ws) { if (an.ws !== null && S.time - e.lastWS < 0.3) { an.wsStart = e.lastWS; an.wsStyle = wsStyle(e.lastWSId); } an.ws = e.lastWS; }
  if (e.lastHit !== an.hit) { if (an.hit !== null && S.time - e.lastHit < 0.3) an.hitStart = e.lastHit; an.hit = e.lastHit; }
  if (an.casting && !e.casting) an.relStart = S.time;
  an.casting = !!e.casting;
  if (e.readying && !an.wasReady) an.readyStart = S.time;
  an.wasReady = !!e.readying;
  if (e.lastHit !== an.hit && e.lastHitAng != null) an.hitSide = Math.sin(e.lastHitAng - (e.face || 0)) > 0 ? 1 : -1;
  if (e.alive === false && an.dead == null) { an.dead = S.time; an.deadVar = Math.random() < 0.5 ? 1 : -1; }
  if (e.alive !== false && an.dead != null) { an.dead = null; an.rise = S.time; }
  return an;
}

function normAngA(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

const NPC_WORK = { garrick: "hammer", pell: "count", marn: "work", odette: "work", tobin: "read", brann: "arms", ysolde: "work", vela: "work", maera: "read", corvin: "count", selene: "count", guard_east: "guard", guard_north: "guard", guard_pass: "guard", rhea: "arms", ilsa: "look" };

function poseBird(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 0.8, 0, 1);
  const s1 = Math.sin(an.ph * 2.2);
  addP(P, "legL", s1 * 0.7 * mv, 0, 0); addP(P, "legR", -s1 * 0.7 * mv, 0, 0);
  addP(P, "head", Math.sin(t * 9) * 0.25 * mv, 0, 0);
  const peck = (1 - mv) * (Math.sin(t * 0.9) > 0.4 ? Math.max(0, Math.sin(t * 9)) : 0);
  addP(P, "body", 0.5 * peck, 0, 0); addP(P, "head", 0.6 * peck, Math.sin(t * 0.7) * 0.5 * (1 - mv), 0);
  const fl = e.fly ? Math.sin(t * 16) * 0.9 : Math.sin(t * 0.5) > 0.95 ? Math.sin(t * 30) * 0.6 : 0;
  addP(P, "wingL", 0, 0, 0.1 + fl); addP(P, "wingR", 0, 0, -0.1 - fl);
  if (e.fly) { addP(P, "legL", 0.9, 0, 0); addP(P, "legR", 0.9, 0, 0); }
  v.rootOff[1] = e.fly ? 0 : Math.abs(s1) * 0.02 * mv;
  applyPose(v, dt, false);
}

function wsStyle(id) {
  if (!id || typeof WEAPON_SKILLS === "undefined" || !WEAPON_SKILLS[id]) return 0;
  const w = WEAPON_SKILLS[id];
  return w.skill >= 75 ? 0 : w.skill >= 40 ? 1 : w.skill >= 22 ? 2 : 3;
}

function castSchool(e) {
  const sp = e.casting && e.casting.sp;
  if (!sp) return "elemental";
  if (sp.kind === "song") return "song";
  if (sp.kind === "summon") return "summon";
  if (sp.kind === "heal") return "heal";
  if (sp.kind === "buff") return "buff";
  if (sp.skill === "dark") return "dark";
  if (sp.kind === "debuff" || sp.kind === "dot") return "debuff";
  return "elemental";
}

function newPose(v) {
  if (!v.pose) { v.pose = {}; for (const n in v.bones) v.pose[n] = [0, 0, 0]; v.rootOff = [0, 0, 0]; v.rootRot = [0, 0, 0]; }
  for (const n in v.pose) { const p = v.pose[n]; p[0] = 0; p[1] = 0; p[2] = 0; }
  v.rootOff[0] = v.rootOff[1] = v.rootOff[2] = 0;
  v.rootRot[0] = v.rootRot[1] = v.rootRot[2] = 0;
  return v.pose;
}

function addP(P, b, x, y, z) { const p = P[b]; if (!p) return; p[0] += x; p[1] += y; p[2] += z; }
function setP(P, b, x, y, z, w) { const p = P[b]; if (!p || w <= 0) return; p[0] += (x - p[0]) * w; p[1] += (y - p[1]) * w; p[2] += (z - p[2]) * w; }

function sitPlan(v) {
  if (v._sit) return v._sit;
  const B = v.bones, H = (v.meta && v.meta.hipsY) || 0.9;
  const len = n => B[n] ? B[n].position.length() : 0;
  const Lt = len("shinL") || H * 0.46, Ls = len("footL") || H * 0.44;
  const hipJ = H + (B.thighL ? B.thighL.position.y : -0.03), ank = Math.max(0.02, hipJ - Lt - Ls), seat = ank + H * 0.1, a = -1.85;
  const rise = hipJ - seat - Lt * (1 - Math.cos(a)) + ank * 1.1 + H * 0.03;
  let c = 1 - rise / Ls;
  c = Math.max(-1, Math.min(1, c));
  const ab = -Math.acos(Math.max(Math.cos(1.45), c));
  const drop = hipJ - seat;
  return (v._sit = { a, b: ab - a, f: 0.15 - ab, drop, back: -0.02 * H });
}

const LOOK_KINDS = { human: 1, quad: 1, hare: 1, mandrake: 1, bird: 1 };
const LOOK_V = { a: null, b: null };
function headLook(v, dt) {
  const B = v.bones, P = v.pose;
  if (!B || !B.head || !P.head || !LOOK_KINDS[v.kind]) return;
  if (!LOOK_V.a) { LOOK_V.a = new THREE.Vector3(); LOOK_V.b = new THREE.Vector3(); }
  let yaw = 0, pitch = 0, want = 0;
  const t = v.lookTgt;
  if (t) {
    const tv = VIEW.views.get(t), a = LOOK_V.a, b = LOOK_V.b;
    if (tv && tv.bones && tv.bones.head && tv.group.visible !== false) tv.bones.head.getWorldPosition(a);
    else a.set(t.x * U, groundY(t.x, t.y) + (t.kind === "npc" || t.chest || t.crystal ? 1.0 : 1.3), t.y * U);
    B.head.getWorldPosition(b);
    v.group.worldToLocal(a); v.group.worldToLocal(b);
    const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z, hz = Math.hypot(dx, dz);
    const twist = (P.hips ? P.hips[1] : 0) + (P.spine ? P.spine[1] : 0) + (P.chest ? P.chest[1] : 0);
    yaw = Math.atan2(dx, dz) - twist;
    if (Math.abs(yaw) < 2.1 && hz > 0.05) { want = 1; yaw = clamp(yaw, -1.25, 1.25); pitch = clamp(-Math.atan2(dy, hz), -0.55, 0.5); }
  }
  v.lookW = (v.lookW || 0) + (want - (v.lookW || 0)) * Math.min(1, dt * 4);
  if (v.lookW < 0.01) return;
  const w = v.lookW;
  v.lookYaw = (v.lookYaw || 0) + ((want ? yaw : v.lookYaw || 0) - (v.lookYaw || 0)) * Math.min(1, dt * 7);
  v.lookPitch = (v.lookPitch || 0) + ((want ? pitch : 0) - (v.lookPitch || 0)) * Math.min(1, dt * 7);
  const hasNeck = !!(B.neck && P.neck), hs = hasNeck ? 0.62 : 1;
  P.head[1] += (v.lookYaw * hs - P.head[1] * 0.5) * w;
  P.head[0] += v.lookPitch * hs * w;
  if (hasNeck) { P.neck[1] += v.lookYaw * (1 - hs) * w; P.neck[0] += v.lookPitch * (1 - hs) * w; }
}

function applyPose(v, dt, sharp) {
  headLook(v, dt);
  const k = 1 - Math.exp(-dt * (sharp ? 26 : 15));
  for (const n in v.pose) {
    const b = v.bones[n], p = v.pose[n];
    if (!b || n === "root") continue;
    b.rotation.x += (p[0] - b.rotation.x) * k;
    b.rotation.y += (p[1] - b.rotation.y) * k;
    b.rotation.z += (p[2] - b.rotation.z) * k;
  }
  const r = v.bones.root;
  if (r) {
    const rest = r.userData.rest;
    r.position.x += (rest.x + v.rootOff[0] - r.position.x) * k;
    r.position.y += (rest.y + v.rootOff[1] - r.position.y) * k;
    r.position.z += (rest.z + v.rootOff[2] - r.position.z) * k;
    r.rotation.x += (v.rootRot[0] - r.rotation.x) * k;
    r.rotation.y += (v.rootRot[1] - r.rotation.y) * k;
    r.rotation.z += (v.rootRot[2] - r.rotation.z) * k;
  }
}

function attackKind(v, e) {
  const w = v.weaponKind;
  if (v.style && v.style.claws) return "claw";
  if (w === "greataxe" || w === "scythe" || w === "gkatana" || w === "gsword") return "cleave";
  if (w === "polearm") return "thrust";
  if (w === "club") return "smash";
  if (w === "staff") return "thrust";
  if (!w || w === "h2h") return "punch";
  return "slash";
}

function poseHuman(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const st = v.style || {};
  const t = S.time + an.t0;
  const run = clamp((an.spd - 1.2) / 4, 0, 1), walk = clamp(an.spd / 1.2, 0, 1) * (1 - run);
  const amp = run + walk * 0.45;
  const s1 = Math.sin(an.ph), c1 = Math.cos(an.ph);
  const fightT = (e.engaged || (isMob(e) && e.state === "combat")) && e.alive !== false ? 1 : 0;
  const hu = (v.meta && v.meta.hunch) || 0;
  if (hu && e.alive !== false) { addP(P, "spine", hu * 0.55, 0, 0); addP(P, "chest", hu * 0.45, 0, 0); addP(P, "neck", -hu * 0.45, 0, 0); addP(P, "head", -hu * 0.4, 0, 0); addP(P, "upArmL", hu * 0.3, 0, 0); addP(P, "upArmR", hu * 0.3, 0, 0); v.rootOff[1] -= hu * 0.08; }
  an.fight += (fightT - an.fight) * Math.min(1, dt * 6);
  let sharp = false;

  addP(P, "chest", Math.sin(t * 1.9) * 0.025, 0, 0);
  addP(P, "upArmL", 0, 0, 0.09); addP(P, "upArmR", 0, 0, -0.09);
  addP(P, "foreArmL", -0.12, 0, 0); addP(P, "foreArmR", -0.12, 0, 0);
  addP(P, "head", Math.sin(t * 0.37) * 0.05, Math.sin(t * 0.23) * 0.3 * (1 - amp) * (1 - an.fight), 0);
  const idleOk = amp < 0.05 && an.fight < 0.1 && !e.casting && !e.resting && !e.mounted && e.alive !== false && e.kind !== "mob";
  if (idleOk) {
    if (!an.idleNext) an.idleNext = S.time + 6 + Math.random() * 8;
    if (S.time > an.idleNext && !an.idleAct) { an.idleAct = 1 + Math.floor(Math.random() * 4); an.idleStart = S.time; an.idleNext = S.time + 9 + Math.random() * 10; }
  } else { an.idleAct = 0; an.idleNext = S.time + 5 + Math.random() * 6; }
  if (an.idleAct) {
    const ik = (S.time - an.idleStart) / 2.6;
    if (ik > 1) an.idleAct = 0;
    else {
      const w = env(ik, 0.2, 0.25);
      if (an.idleAct === 1) { addP(P, "head", 0, 0.9 * Math.sin(ik * Math.PI * 2) * w, 0); addP(P, "chest", 0, 0.25 * Math.sin(ik * Math.PI * 2) * w, 0); }
      else if (an.idleAct === 2) { setP(P, "upArmL", -2.6, 0, 0.35, w); setP(P, "upArmR", -2.6, 0, -0.35, w); setP(P, "foreArmL", -0.6, 0, 0, w); setP(P, "foreArmR", -0.6, 0, 0, w); addP(P, "spine", -0.18 * w, 0, 0); addP(P, "head", -0.3 * w, 0, 0); }
      else if (an.idleAct === 3) { addP(P, "hips", 0, 0, 0.08 * w); addP(P, "thighL", 0, 0, 0.1 * w); addP(P, "shinR", 0.25 * w, 0, 0); addP(P, "thighR", -0.1 * w, 0, 0); addP(P, "chest", 0, 0, -0.06 * w); v.rootOff[0] += 0.03 * w; }
      else { setP(P, "upArmR", -2.3, 0, 0.6, w); setP(P, "foreArmR", -1.9 + Math.sin(S.time * 14) * 0.15, 0, 0, w); addP(P, "head", 0.1 * w, 0, 0.15 * w); }
    }
  }
  const em = e.emote;
  if (em && amp < 0.2 && !e.casting && e.alive !== false) {
    const len = em.id === "dance" ? 5 : em.id === "panic" ? 3 : 2.4, ek = (S.time - em.at) / len;
    if (ek > 1) e.emote = null;
    else {
      const w = env(ek, 0.12, 0.2), T = S.time - em.at, osc = Math.sin(T * 8);
      if (em.id === "wave") { setP(P, "upArmR", -2.6, 0, -0.5, w); setP(P, "foreArmR", -0.6, 0, osc * 0.5, w); addP(P, "head", 0, 0, -0.1 * w); }
      else if (em.id === "bow") { const b = Math.sin(Math.min(1, ek * 1.6) * Math.PI) * w; addP(P, "spine", 0.7 * b, 0, 0); addP(P, "chest", 0.3 * b, 0, 0); addP(P, "head", 0.2 * b, 0, 0); setP(P, "upArmR", 0.2, 0, 0.3, b); setP(P, "foreArmR", -1.5, 0, 0, b); }
      else if (em.id === "cheer") { const j = Math.abs(Math.sin(T * 6)); setP(P, "upArmL", -2.9, 0, 0.3, w); setP(P, "upArmR", -2.9, 0, -0.3, w); setP(P, "foreArmL", -0.2, 0, 0, w); setP(P, "foreArmR", -0.2, 0, 0, w); v.rootOff[1] += j * 0.12 * w; }
      else if (em.id === "dance") { addP(P, "hips", 0, Math.sin(T * 5) * 0.4 * w, Math.sin(T * 5) * 0.12 * w); addP(P, "chest", 0, -Math.sin(T * 5) * 0.3 * w, 0); setP(P, "upArmL", -1.6 + Math.sin(T * 5) * 0.8, 0, 0.6, w); setP(P, "upArmR", -1.6 - Math.sin(T * 5) * 0.8, 0, -0.6, w); setP(P, "foreArmL", -1.2, 0, 0, w); setP(P, "foreArmR", -1.2, 0, 0, w); addP(P, "thighL", Math.max(0, Math.sin(T * 5)) * -0.5 * w, 0, 0); addP(P, "thighR", Math.max(0, -Math.sin(T * 5)) * -0.5 * w, 0, 0); addP(P, "shinL", Math.max(0, Math.sin(T * 5)) * 0.8 * w, 0, 0); addP(P, "shinR", Math.max(0, -Math.sin(T * 5)) * 0.8 * w, 0, 0); v.rootOff[1] += Math.abs(Math.sin(T * 10)) * 0.04 * w; }
      else if (em.id === "laugh") { addP(P, "spine", -0.15 * w + Math.sin(T * 16) * 0.05 * w, 0, 0); addP(P, "head", -0.25 * w, 0, 0); setP(P, "upArmL", 0.1, 0, 0.5, w); setP(P, "foreArmL", -1.6, 0, 0, w); setP(P, "upArmR", 0.1, 0, -0.5, w); setP(P, "foreArmR", -1.6, 0, 0, w); }
      else if (em.id === "nod") addP(P, "head", Math.max(0, Math.sin(T * 7)) * 0.35 * w, 0, 0);
      else if (em.id === "clap") { const c = Math.sin(T * 14); setP(P, "upArmL", -1.0, 0.6, 0.15, w); setP(P, "upArmR", -1.0, -0.6, -0.15, w); setP(P, "foreArmL", -0.9, 0, -0.4 - c * 0.25, w); setP(P, "foreArmR", -0.9, 0, 0.4 + c * 0.25, w); }
      else if (em.id === "point") { setP(P, "upArmR", -1.55, 0, -0.1, w); setP(P, "foreArmR", -0.1, 0, 0, w); addP(P, "head", 0.05 * w, 0, 0); }
      else if (em.id === "salute") { setP(P, "upArmR", -1.5, 0, -0.9, w); setP(P, "foreArmR", -2.2, 0, 0, w); addP(P, "spine", -0.08 * w, 0, 0); }
      else if (em.id === "panic") { setP(P, "upArmL", -2.7, 0, 0.6 + osc * 0.3, w); setP(P, "upArmR", -2.7, 0, -0.6 - osc * 0.3, w); addP(P, "head", 0, Math.sin(T * 11) * 0.5 * w, 0); v.rootOff[1] += Math.abs(Math.sin(T * 9)) * 0.06 * w; }
      else if (em.id === "cry") { addP(P, "spine", 0.3 * w, 0, 0); addP(P, "head", 0.4 * w, 0, 0); setP(P, "upArmL", -1.3, 0.5, 0.1, w); setP(P, "upArmR", -1.3, -0.5, -0.1, w); setP(P, "foreArmL", -2.1, 0, 0, w); setP(P, "foreArmR", -2.1, 0, 0, w); addP(P, "chest", Math.sin(T * 9) * 0.04 * w, 0, 0); }
      else if (em.id === "thumbsup") { setP(P, "upArmR", -1.1, 0, -0.2, w); setP(P, "foreArmR", -1.4, 0, 0, w); addP(P, "head", -0.05 * w, 0, 0.1 * w); }
    }
  }
  if (e.jumpAt != null && S.time - e.jumpAt < 0.9) {
    const jk = (S.time - e.jumpAt) / 0.9, up = Math.sin(jk * Math.PI) * (e.jumpHigh ? 3.2 : 2.2), w = env(jk, 0.1, 0.15);
    v.rootOff[1] += up;
    setP(P, "thighL", -1.2, 0, 0.1, w); setP(P, "thighR", -0.6, 0, -0.1, w); setP(P, "shinL", 1.6, 0, 0, w); setP(P, "shinR", 1.2, 0, 0, w);
    setP(P, "upArmR", jk < 0.5 ? -2.6 : -0.6, 0, -0.2, w); setP(P, "foreArmR", -0.3, 0, 0, w); setP(P, "upArmL", jk < 0.5 ? -2.4 : -0.5, 0, 0.2, w);
    addP(P, "spine", (jk < 0.5 ? -0.2 : 0.35) * w, 0, 0);
  }
  if (!an.lastYaw) an.lastYaw = e.face || 0;
  const dyaw = Math.abs(normAngA((e.face || 0) - an.lastYaw));
  an.lastYaw = e.face || 0;
  an.turn = (an.turn || 0) * Math.exp(-dt * 6) + (amp < 0.1 ? Math.min(1, dyaw / Math.max(dt, 0.001) / 3) : 0) * Math.min(1, dt * 8);
  if (an.turn > 0.05 && !e.mounted && !e.resting) {
    const sp = Math.sin(t * 14) * an.turn;
    addP(P, "thighL", -Math.max(0, sp) * 0.35, 0, 0); addP(P, "shinL", Math.max(0, sp) * 0.6, 0, 0);
    addP(P, "thighR", -Math.max(0, -sp) * 0.35, 0, 0); addP(P, "shinR", Math.max(0, -sp) * 0.6, 0, 0);
  }
  if (P.lids) {
    if (!an.blinkAt || S.time > an.blinkAt + 0.2) an.blinkAt = S.time + (an.blinkAt && Math.random() < 0.2 ? 0.25 : 2.5 + Math.random() * 3.5);
    const bt = (S.time - an.blinkAt) / 0.16, bl = bt >= 0 && bt <= 1 ? Math.sin(bt * Math.PI) : 0;
    const em = e.emote && S.time - e.emote.at < 2.4 ? e.emote.id : null;
    const mood = em === "laugh" || em === "cry" ? 0.5 : em === "panic" ? -0.2 : e.casting ? 0.3 : 0;
    const shut = e.alive === false ? 1 : e.resting && an.sit > 0.9 ? 0.55 : em === "panic" ? 0 : Math.max(mood, bl);
    addP(P, "lids", -0.55 * (1 - shut), 0, 0);
  }
  if (e.kind === "npc" && player && e.alive !== false) {
    const d = dist(e, player), work = NPC_WORK[e.id];
    const near = d < 160 && player.target === e ? 1 : d < 130 ? 1 : 0;
    an.look = (an.look || 0) + (near - (an.look || 0)) * Math.min(1, dt * 3);
    if (an.look > 0.01) {
      const ang = normAngA(Math.atan2(player.y - e.y, player.x - e.x) - (e.face || 0));
      addP(P, "chest", 0, -clamp(ang, -1.1, 1.1) * 0.25 * an.look, 0);
    }
    const ww = (1 - an.look) * (amp < 0.1 ? 1 : 0);
    if (work && ww > 0.01) {
      if (work === "hammer") { const c = (t * 1.3) % 1, up = c < 0.6 ? ease(c / 0.6) : 1 - ease((c - 0.6) / 0.12); setP(P, "upArmR", -0.6 - 1.6 * up, 0, -0.15, ww); setP(P, "foreArmR", -1.2 + 0.6 * up, 0, 0, ww); setP(P, "upArmL", -0.8, 0, 0.15, ww); setP(P, "foreArmL", -0.9, 0, 0, ww); setP(P, "spine", 0.25, 0, 0, ww); setP(P, "head", 0.35, 0, 0, ww); }
      else if (work === "read" || work === "count") { setP(P, "upArmL", -0.7, 0, -0.2, ww); setP(P, "upArmR", -0.7, 0, 0.2, ww); setP(P, "foreArmL", -1.3 + (work === "count" ? Math.max(0, Math.sin(t * 5)) * 0.2 : 0), 0, 0, ww); setP(P, "foreArmR", -1.3 + (work === "count" ? Math.max(0, Math.sin(t * 5 + 1.5)) * 0.25 : Math.sin(t * 0.4) * 0.1), 0, 0, ww); setP(P, "head", 0.45, Math.sin(t * 0.6) * 0.15, 0, ww); }
      else if (work === "work") { setP(P, "upArmL", -0.8 + Math.sin(t * 3) * 0.25, 0, -0.1, ww); setP(P, "upArmR", -0.8 - Math.sin(t * 3) * 0.25, 0, 0.1, ww); setP(P, "foreArmL", -1.0, 0, 0, ww); setP(P, "foreArmR", -1.0, 0, 0, ww); setP(P, "spine", 0.3, 0, 0, ww); setP(P, "head", 0.4, 0, 0, ww); }
      else if (work === "arms") { setP(P, "upArmL", -0.5, 0, -0.45, ww); setP(P, "upArmR", -0.5, 0, 0.45, ww); setP(P, "foreArmL", -1.9, 0.4, 0, ww); setP(P, "foreArmR", -1.9, -0.4, 0, ww); setP(P, "head", 0, Math.sin(t * 0.3) * 0.4, 0, ww); }
      else if (work === "guard") { setP(P, "upArmR", -0.3, 0, -0.05, ww); setP(P, "foreArmR", -0.9, 0, 0, ww); setP(P, "spine", -0.05, 0, 0, ww); setP(P, "head", 0, Math.sin(t * 0.25) * 0.7, 0, ww); }
      else if (work === "look") { const sp = Math.sin(t * 0.2) > 0.3 ? 1 : 0; setP(P, "upArmR", -1.5 * sp, 0, 0.3 * sp, ww); setP(P, "foreArmR", -1.6 * sp, 0, 0, ww); setP(P, "head", -0.1, 0.6 * Math.sin(t * 0.15), 0, ww); }
    }
  }
  if (st.hunch) { addP(P, "spine", 0.22, 0, 0); addP(P, "chest", 0.12, 0, 0); addP(P, "head", -0.3, 0, 0); addP(P, "upArmL", -0.25, 0, 0.1); addP(P, "upArmR", -0.25, 0, -0.1); }
  if (st.prowl) { addP(P, "upArmL", -0.6, 0, 0.15); addP(P, "upArmR", -0.6, 0, -0.15); addP(P, "foreArmL", -0.3, 0, 0); addP(P, "foreArmR", -0.3, 0, 0); }

  const sw = an.fight * (1 - amp);
  if (sw > 0.01) {
    addP(P, "thighL", -0.28 * sw, 0, 0.12 * sw); addP(P, "thighR", 0.05 * sw, 0, -0.12 * sw);
    addP(P, "shinL", 0.45 * sw, 0, 0); addP(P, "shinR", 0.35 * sw, 0, 0);
    addP(P, "footL", -0.17 * sw, 0, 0); addP(P, "footR", -0.35 * sw, 0, 0);
    v.rootOff[1] -= 0.05 * sw;
    addP(P, "spine", 0.1 * sw, -0.15 * sw, 0);
    if (v.weaponKind === "greataxe" || v.weaponKind === "scythe" || v.weaponKind === "gkatana" || v.weaponKind === "gsword") { addP(P, "upArmR", -0.7 * sw, 0, 0.25 * sw); addP(P, "foreArmR", -0.9 * sw, 0, 0); addP(P, "upArmL", -0.8 * sw, 0, -0.35 * sw); addP(P, "foreArmL", -0.9 * sw, 0, 0); }
    else if (v.weaponKind === "h2h" || (!v.weaponKind && v.kind === "human" && !isMob(e))) { addP(P, "upArmR", -0.85 * sw, 0, -0.25 * sw); addP(P, "foreArmR", -1.7 * sw, 0, 0); addP(P, "upArmL", -1.0 * sw, 0, 0.25 * sw); addP(P, "foreArmL", -1.8 * sw, 0, 0); }
    else if (v.weaponKind === "staff" || v.weaponKind === "polearm") { addP(P, "upArmR", -0.4 * sw, 0, 0); addP(P, "foreArmR", -0.8 * sw, 0, 0); addP(P, "upArmL", -0.3 * sw, 0, 0); addP(P, "foreArmL", -0.6 * sw, 0, 0); }
    else { addP(P, "upArmR", -0.55 * sw, 0, -0.1 * sw); addP(P, "foreArmR", -0.75 * sw, 0, 0); addP(P, "upArmL", -0.45 * sw, 0, 0.05 * sw); addP(P, "foreArmL", -1.0 * sw, 0, 0); }
  }

  if (amp > 0.01) {
    const lean = st.hop ? 0.22 : 0.14;
    addP(P, "thighL", s1 * 0.78 * amp, 0, 0); addP(P, "thighR", -s1 * 0.78 * amp, 0, 0);
    const kn = 1.0 + 0.35 * run;
    addP(P, "shinL", (0.16 + kn * Math.max(0, -c1) + 0.12 * Math.max(0, s1)) * amp, 0, 0); addP(P, "shinR", (0.16 + kn * Math.max(0, c1) + 0.12 * Math.max(0, -s1)) * amp, 0, 0);
    addP(P, "footL", (-s1 * 0.22 + 0.3 * Math.max(0, -c1) * Math.max(0, s1)) * amp, 0, 0); addP(P, "footR", (s1 * 0.22 + 0.3 * Math.max(0, c1) * Math.max(0, -s1)) * amp, 0, 0);
    const aa = Math.min(1, amp), armSwing = (an.fight > 0.5 ? 0.16 : 0.3 + 0.12 * run) * aa;
    addP(P, "upArmL", -s1 * armSwing, 0, 0); addP(P, "upArmR", s1 * armSwing, 0, 0);
    const el = aa * (1 - an.fight * 0.6);
    addP(P, "foreArmL", -0.4 * run - (0.12 + 0.2 * Math.max(0, s1)) * el, 0, 0); addP(P, "foreArmR", -0.4 * run - (0.12 + 0.2 * Math.max(0, -s1)) * el, 0, 0);
    addP(P, "upArmL", 0, 0, 0.05 * amp); addP(P, "upArmR", 0, 0, -0.05 * amp);
    addP(P, "spine", lean * run + 0.05 * Math.abs(c1) * amp, s1 * 0.05 * amp, -s1 * 0.06 * amp);
    addP(P, "chest", -0.03 * Math.abs(c1) * amp, s1 * 0.08 * amp, s1 * 0.03 * amp);
    addP(P, "hips", 0, -s1 * 0.1 * amp, s1 * 0.07 * amp);
    addP(P, "neck", 0.04 * Math.abs(s1) * amp, -s1 * 0.06 * amp, 0);
    addP(P, "head", (0.07 * Math.abs(c1) - 0.04) * amp, -s1 * 0.09 * amp, -s1 * 0.04 * amp);
    v.rootOff[1] += Math.abs(c1) * (st.hop ? 0.07 : 0.035) * amp - 0.03 * amp - 0.03 * run;
    const step = Math.floor(an.ph / Math.PI);
    if (step !== an.lastStep) { an.lastStep = step; if (run > 0.4 && e.alive !== false) fxFootstep(e, v); }
  }

  const ak = (S.time - an.aStart) / 0.5;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const kind = attackKind(v, e);
    const w = Math.min(1, ak / 0.08, (1 - ak) / 0.3);
    const side = an.aVar ? 1 : -1;
    if (kind === "slash" && an.aVar === 2) {
      const a = ease(ak / 0.3), b = ease((ak - 0.3) / 0.2);
      setP(P, "upArmR", -0.4 * a - 1.6 * b, 0, 0.9 * a - 0.9 * b, w);
      setP(P, "foreArmR", -1.3 * a + 1.1 * b, 0, 0, w);
      setP(P, "chest", 0.05, 0.55 * a - 0.8 * b, 0, w);
      setP(P, "spine", 0.1 * b, 0, 0, w);
      addP(P, "thighL", -0.3 * b * w, 0, 0); addP(P, "shinL", 0.3 * b * w, 0, 0);
      setP(P, "handR", -0.3 * a + 2.7 * b, 0, 0, w);
    } else if (kind === "slash" && an.aVar === 1) {
      const a = ease(ak / 0.28), b = ease((ak - 0.28) / 0.2);
      setP(P, "upArmR", -1.3 * a + 0.2 * b, 0, -1.2 * a + 1.7 * b, w);
      setP(P, "foreArmR", -0.5 * a + 0.3 * b, 0, 0, w);
      setP(P, "chest", 0, -0.7 * a + 1.1 * b, 0, w);
      setP(P, "hips", 0, -0.2 * a + 0.3 * b, 0, w);
      setP(P, "handR", 1.5 * a, 0, 0, w);
    } else if (kind === "slash") {
      const a = ease(ak / 0.32), b = ease((ak - 0.32) / 0.22);
      setP(P, "upArmR", -2.1 * a + 1.8 * b, 0, -0.55 * a + 1.05 * b, w);
      setP(P, "foreArmR", -1.0 * a + 0.85 * b, 0, 0, w);
      setP(P, "chest", 0.05, -0.5 * a + 0.95 * b, 0, w);
      setP(P, "spine", 0.08 + 0.12 * b, 0, 0, w);
      setP(P, "handR", 0.5 * a - 1.7 * b, 0, 0, w);
    } else if ((kind === "smash" || kind === "cleave") && an.aVar === 1) {
      const a = ease(ak / 0.34), b = ease((ak - 0.34) / 0.22);
      setP(P, "upArmR", -1.4, 0, -1.3 * a + 1.9 * b, w);
      setP(P, "foreArmR", -0.4, 0, 0, w);
      if (kind === "cleave") { setP(P, "upArmL", -1.3, 0, -1.1 * a + 1.7 * b, w); setP(P, "foreArmL", -0.5, 0, 0, w); }
      setP(P, "chest", 0, -0.8 * a + 1.3 * b, 0, w);
      setP(P, "hips", 0, -0.3 * a + 0.4 * b, 0, w);
      addP(P, "thighL", -0.25 * w, 0, 0); addP(P, "shinL", 0.35 * w, 0, 0);
    } else if (kind === "smash" || kind === "cleave") {
      const a = ease(ak / 0.36), b = ease((ak - 0.36) / 0.2);
      setP(P, "upArmR", -2.7 * a + 2.4 * b, 0, -0.1, w);
      setP(P, "foreArmR", -0.7 * a + 0.5 * b, 0, 0, w);
      if (kind === "cleave") { setP(P, "upArmL", -2.6 * a + 2.3 * b, 0, -0.35, w); setP(P, "foreArmL", -0.8 * a + 0.6 * b, 0, 0, w); }
      setP(P, "spine", -0.15 * a + 0.45 * b, 0, 0, w);
      setP(P, "handR", 0.6 * a - 1.3 * b, 0, 0, w);
      setP(P, "chest", 0, -0.15 * a, 0, w);
    } else if (kind === "thrust") {
      const a = ease(ak / 0.3), b = ease((ak - 0.3) / 0.18);
      setP(P, "upArmR", -0.4 * a - 1.0 * b, 0, 0, w);
      setP(P, "foreArmR", -1.2 * a + 1.1 * b, 0, 0, w);
      setP(P, "upArmL", -0.5 - 0.8 * b, 0, -0.2, w);
      setP(P, "chest", 0, -0.35 * a + 0.6 * b, 0, w);
    } else if (kind === "claw") {
      const a = ease(ak / 0.3), b = ease((ak - 0.3) / 0.2);
      const arm = side > 0 ? "R" : "L", s = side > 0 ? -1 : 1;
      setP(P, "upArm" + arm, -2.4 * a + 1.9 * b, 0, s * (0.5 * a - 0.9 * b), w);
      setP(P, "foreArm" + arm, -0.6 * a + 0.3 * b, 0, 0, w);
      setP(P, "spine", 0.3 * b, 0, 0, w);
    } else {
      const arm = side > 0 ? "R" : "L";
      const a = ease(ak / 0.25), b = ease((ak - 0.25) / 0.15);
      setP(P, "upArm" + arm, -0.4 * a - 1.1 * b, 0, 0, w);
      setP(P, "foreArm" + arm, -1.6 * a + 1.5 * b, 0, 0, w);
      setP(P, "chest", 0, side * (0.3 * a - 0.6 * b), 0, w);
    }
  }

  const wk = (S.time - an.wsStart) / 1.05;
  if (wk >= 0 && wk <= 1 && (an.wsStyle === 1 || an.wsStyle === 2 || an.wsStyle === 3)) {
    sharp = true;
    const w = Math.min(1, wk / 0.06, (1 - wk) / 0.25);
    if (an.wsStyle === 1) {
      const spin = ease((wk - 0.15) / 0.55), wind = ease(wk / 0.15) * (1 - spin);
      setP(P, "upArmR", -1.5, 0, -1.2 * wind + 0.4, w); setP(P, "foreArmR", -0.3, 0, 0, w);
      setP(P, "upArmL", -1.2, 0, 0.9, w);
      setP(P, "thighL", -0.4, 0, 0.2, w); setP(P, "shinL", 0.6, 0, 0, w); setP(P, "thighR", -0.2, 0, -0.25, w); setP(P, "shinR", 0.4, 0, 0, w);
      v.rootRot[1] += (-0.6 * wind + Math.PI * 2 * spin) * w;
      v.rootOff[1] += -0.15 * w;
    } else if (an.wsStyle === 2) {
      const n = 3, seg = Math.min(n - 1, Math.floor(wk * n * 1.1)), sk = (wk * n * 1.1) % 1;
      const a = ease(sk / 0.45), b = ease((sk - 0.45) / 0.3), sd = seg % 2 ? 1 : -1;
      setP(P, "upArmR", -1.9 * a + 1.5 * b, 0, sd * (0.8 * a - 1.2 * b), w);
      setP(P, "foreArmR", -0.9 * a + 0.7 * b, 0, 0, w);
      setP(P, "chest", 0, sd * (-0.6 * a + 0.9 * b), 0, w);
      setP(P, "upArmL", -0.8, 0, 0.4, w);
      v.rootOff[2] += 0.08 * seg * w;
    } else {
      const a = ease(wk / 0.35), b = ease((wk - 0.35) / 0.18);
      setP(P, "upArmR", -2.9 * a + 2.7 * b, 0, -0.2, w); setP(P, "foreArmR", -0.6 * a + 0.4 * b, 0, 0, w);
      setP(P, "upArmL", -1.0 * a, 0, 0.6 * a, w);
      setP(P, "spine", -0.3 * a + 0.6 * b, 0, 0, w);
      setP(P, "thighL", -0.6 * b, 0, 0, w); setP(P, "shinL", 0.7 * b, 0, 0, w); setP(P, "thighR", 0.3 * b, 0, 0, w);
      v.rootOff[1] += -0.12 * b * w; v.rootOff[2] += 0.15 * b * w;
    }
  } else if (wk >= 0 && wk <= 1) {
    sharp = true;
    const w = Math.min(1, wk / 0.06, (1 - wk) / 0.25);
    const crouch = ease(wk / 0.22) * (1 - ease((wk - 0.22) / 0.12));
    const air = wk > 0.25 && wk < 0.62 ? Math.sin((wk - 0.25) / 0.37 * Math.PI) : 0;
    const raise = ease(wk / 0.3), slam = ease((wk - 0.45) / 0.14);
    setP(P, "thighL", -0.7 * crouch - 0.6 * air, 0, 0.15, w); setP(P, "thighR", -0.4 * crouch - 0.2 * air, 0, -0.15, w);
    setP(P, "shinL", 1.1 * crouch + 0.9 * air, 0, 0, w); setP(P, "shinR", 0.9 * crouch + 0.4 * air, 0, 0, w);
    setP(P, "upArmR", -2.9 * raise + 2.6 * slam, 0, -0.2, w);
    setP(P, "upArmL", -2.6 * raise + 2.2 * slam, 0, 0.2, w);
    setP(P, "foreArmR", -0.5 * raise, 0, 0, w); setP(P, "foreArmL", -0.6 * raise, 0, 0, w);
    setP(P, "spine", 0.3 * crouch - 0.25 * raise * (1 - slam) + 0.55 * slam, 0, 0, w);
    setP(P, "chest", 0, -Math.PI * 2 * ease((wk - 0.25) / 0.3) * (1 - slam) * 0.5, 0, w);
    v.rootOff[1] += (-0.18 * crouch + 0.75 * air) * w;
  }

  const jp = typeof jumpPhase === "function" ? jumpPhase(e) : null;
  if (jp && jp.phase !== "done" && !e.mounted) {
    sharp = true;
    const k = jp.k;
    let crouch = 0, tuck = 0, reach = 0, land = 0, lean = 0, fall = 0;
    if (jp.phase === "windup") { crouch = ease(k); lean = crouch; }
    else if (jp.phase === "air") { const up = 1 - ease((k - 0.35) / 0.35), dn = ease((k - 0.55) / 0.45); crouch = (1 - ease(k / 0.12)) * 0.6; tuck = Math.sin(Math.PI * Math.min(1, k / 0.8)); reach = up; fall = dn; lean = 0.5 * (1 - dn) - 0.25 * dn; }
    else { land = Math.sin(Math.PI * k); crouch = land * 0.9; lean = land * 0.8; }
    const w = 0.92;
    setP(P, "thighL", -0.75 * crouch - 1.15 * tuck - 0.25 * fall, 0, 0.12, w);
    setP(P, "thighR", -0.65 * crouch - 0.75 * tuck - 0.1 * fall, 0, -0.12, w);
    setP(P, "shinL", 1.25 * crouch + 1.7 * tuck + 0.35 * fall, 0, 0, w);
    setP(P, "shinR", 1.1 * crouch + 1.3 * tuck + 0.25 * fall, 0, 0, w);
    setP(P, "footL", -0.35 * tuck - 0.3 * fall + 0.2 * crouch, 0, 0, w);
    setP(P, "footR", -0.3 * tuck - 0.3 * fall + 0.2 * crouch, 0, 0, w);
    setP(P, "upArmL", 0.75 * crouch - 1.9 * reach - 0.4 * fall, 0, 0.35 * reach + 0.55 * fall + 0.15, w);
    setP(P, "upArmR", 0.75 * crouch - 1.9 * reach - 0.4 * fall, 0, -0.35 * reach - 0.55 * fall - 0.15, w);
    setP(P, "foreArmL", -0.35 * crouch - 0.5 * reach - 0.3 * fall, 0, 0, w);
    setP(P, "foreArmR", -0.35 * crouch - 0.5 * reach - 0.3 * fall, 0, 0, w);
    setP(P, "spine", 0.38 * lean - 0.12 * reach, 0, 0, w);
    setP(P, "chest", 0.1 * lean, 0, 0, w);
    setP(P, "head", -0.2 * lean + 0.12 * fall, 0, 0, w);
    setP(P, "hips", 0.05 * tuck, 0, 0, w);
    v.rootOff[1] += -0.22 * crouch + 0.1 * tuck;
  }

  if (e.casting) {
    const cw = Math.min(1, (S.time - e.casting.start) / 0.25);
    const bob = Math.sin(t * 7) * 0.08, school = castSchool(e);
    if (school === "heal" || school === "buff") {
      setP(P, "upArmL", -1.7 + bob, 0, -0.35, cw); setP(P, "upArmR", -1.7 - bob, 0, 0.35, cw);
      setP(P, "foreArmL", -0.7, 0, 0, cw); setP(P, "foreArmR", -0.7, 0, 0, cw);
      setP(P, "head", -0.25, 0, 0, cw); setP(P, "spine", -0.08, 0, 0, cw);
    } else if (school === "song") {
      setP(P, "upArmR", -1.2, 0, -0.1, cw); setP(P, "foreArmR", -1.9, 0, 0, cw);
      setP(P, "upArmL", -0.9 + Math.sin(t * 3) * 0.3, 0, 0.9, cw); setP(P, "foreArmL", -0.4, 0, 0, cw);
      setP(P, "chest", 0, Math.sin(t * 2.2) * 0.15, Math.sin(t * 2.2) * 0.06, cw); setP(P, "head", -0.15, Math.sin(t * 2.2) * 0.2, 0, cw);
      v.rootOff[1] += Math.abs(Math.sin(t * 4.4)) * 0.03 * cw;
    } else if (school === "summon") {
      setP(P, "upArmL", -2.7 + bob, 0, 0.6, cw); setP(P, "upArmR", -2.7 - bob, 0, -0.6, cw);
      setP(P, "foreArmL", -0.2, 0, 0, cw); setP(P, "foreArmR", -0.2, 0, 0, cw);
      setP(P, "head", -0.35, 0, 0, cw); setP(P, "spine", -0.12, 0, 0, cw);
    } else if (school === "dark") {
      setP(P, "upArmL", -0.6, 0, -0.5, cw); setP(P, "upArmR", -0.6, 0, 0.5, cw);
      setP(P, "foreArmL", -1.5 + bob, 0, 0, cw); setP(P, "foreArmR", -1.5 - bob, 0, 0, cw);
      setP(P, "spine", 0.3, 0, 0, cw); setP(P, "head", 0.25, 0, 0, cw);
    } else if (school === "debuff") {
      setP(P, "upArmR", -1.55, 0, 0.1, cw); setP(P, "foreArmR", -0.15 + bob, 0, 0, cw);
      setP(P, "upArmL", -0.5, 0, 0.3, cw); setP(P, "foreArmL", -1.3, 0, 0, cw);
      setP(P, "chest", 0, -0.35, 0, cw); setP(P, "head", 0.05, 0.3, 0, cw);
    } else {
      setP(P, "upArmL", -1.25 + bob, 0, -0.42, cw); setP(P, "upArmR", -1.25 - bob, 0, 0.42, cw);
      setP(P, "foreArmL", -0.95, 0, 0, cw); setP(P, "foreArmR", -0.95, 0, 0, cw);
      setP(P, "head", 0.18, 0, 0, cw);
      setP(P, "spine", 0.04, 0, 0, cw);
    }
    v.rootOff[1] += Math.sin(t * 3.5) * 0.015 * cw;
  }
  const rk = (S.time - an.relStart) / 0.45;
  if (rk >= 0 && rk <= 1 && !e.casting) {
    const w = env(rk, 0.15, 0.6);
    setP(P, "upArmL", -1.9, 0, 0.25, w); setP(P, "upArmR", -1.9, 0, -0.25, w);
    setP(P, "foreArmL", -0.05, 0, 0, w); setP(P, "foreArmR", -0.05, 0, 0, w);
    setP(P, "spine", -0.12, 0, 0, w); setP(P, "head", -0.15, 0, 0, w);
  }

  if (e.readying) {
    const shake = Math.sin(t * 40) * 0.04;
    setP(P, "upArmL", -2.4, 0, 0.5 + shake, 0.85); setP(P, "upArmR", -2.4, 0, -0.5 - shake, 0.85);
    setP(P, "spine", -0.25, 0, 0, 0.85);
  }

  const hk = (S.time - an.hitStart) / 0.32;
  if (hk >= 0 && hk <= 1) {
    const w = env(hk, 0.12, 0.7), hs = an.hitSide || 0;
    addP(P, "spine", -0.32 * w, -0.25 * hs * w, -0.12 * hs * w); addP(P, "head", -0.25 * w, -0.3 * hs * w, 0);
    addP(P, "upArmL", 0.35 * w, 0, 0.2 * w); addP(P, "upArmR", 0.35 * w, 0, -0.2 * w);
    addP(P, "chest", 0, -0.2 * hs * w, 0);
    v.rootOff[2] -= 0.06 * w; v.rootOff[0] -= 0.04 * hs * w;
  }

  const sitT = e.resting && e.alive !== false && !e.mounted ? 1 : 0;
  an.sit = (an.sit || 0) + (sitT - (an.sit || 0)) * Math.min(1, dt * 5);
  if (an.sit > 0.01) {
    const k = an.sit, sp = sitPlan(v);
    for (const s of ["L", "R"]) {
      const sg = s === "L" ? 1 : -1;
      setP(P, "thigh" + s, sp.a, 0, sg * 0.12, k);
      setP(P, "shin" + s, sp.b, 0, 0, k);
      setP(P, "foot" + s, sp.f, 0, 0, k);
      setP(P, "upArm" + s, -0.62, 0, sg * 0.2, k);
      setP(P, "foreArm" + s, -0.95, 0, 0, k);
    }
    setP(P, "hips", 0, 0, 0, k);
    setP(P, "spine", 0.2 + Math.sin(t * 1.3) * 0.02, 0, 0, k);
    setP(P, "chest", 0.06, 0, 0, k);
    setP(P, "head", -0.05, 0, 0, k);
    v.rootOff[1] -= sp.drop * k;
    v.rootOff[2] += sp.back * k;
    if (P.tail) { addP(P, "tail", 0.8 * k, 0, 0); addP(P, "tail2", 0.4 * k, 0, 0); }
  }

  if (e.mounted) {
    for (const s of ["L", "R"]) {
      const sg = s === "L" ? 1 : -1;
      setP(P, "thigh" + s, -1.3, 0, sg * 0.5, 1);
      setP(P, "shin" + s, 1.45, 0, 0, 1);
      setP(P, "foot" + s, -0.25, 0, 0, 1);
      setP(P, "upArm" + s, -0.55, 0, sg * 0.08, 1);
      setP(P, "foreArm" + s, -0.95, 0, 0, 1);
    }
    setP(P, "spine", 0.14 + run * 0.12, 0, 0, 1);
    setP(P, "chest", 0, 0, 0, 1);
    setP(P, "hips", 0, 0, 0, 1);
    v.rootOff[0] = 0; v.rootOff[1] = 0; v.rootOff[2] = 0;
  }

  const race = v.meta && v.meta.race;
  if (race && race !== "human" && !e.mounted && e.alive !== false && !e.resting) {
    if (race === "pipkin") { v.rootOff[1] += Math.abs(s1) * 0.045 * amp; addP(P, "head", 0, 0, s1 * 0.08 * amp); addP(P, "upArmL", -s1 * 0.25 * amp, 0, 0.12 * amp); addP(P, "upArmR", s1 * 0.25 * amp, 0, -0.12 * amp); if (amp < 0.05) addP(P, "hips", 0, 0, Math.sin(t * 1.4) * 0.03); }
    else if (race === "ursan") { addP(P, "spine", 0.08 * amp + 0.04, 0, 0); addP(P, "chest", 0, s1 * 0.12 * amp, -s1 * 0.05 * amp); addP(P, "head", -0.06 * amp, 0, 0); v.rootOff[1] -= Math.abs(c1) * 0.03 * amp; addP(P, "upArmL", 0, 0, 0.08); addP(P, "upArmR", 0, 0, -0.08); }
    else if (race === "nekari") { addP(P, "hips", 0, s1 * 0.1 * amp, 0); addP(P, "spine", 0.05 * amp, -s1 * 0.06 * amp, 0); if (an.fight > 0.3) addP(P, "spine", 0.08 * an.fight, 0, 0); }
    else if (race === "elari") { addP(P, "spine", -0.04, 0, 0); addP(P, "head", -0.05, 0, 0); addP(P, "upArmL", s1 * 0.08 * amp, 0, -0.03); addP(P, "upArmR", -s1 * 0.08 * amp, 0, 0.03); }
  }
  if (P.earL) {
    if (!an.earAt || S.time > an.earAt + 0.3) an.earAt = S.time + 2 + Math.random() * 5;
    const tw = S.time > an.earAt ? Math.sin((S.time - an.earAt) / 0.3 * Math.PI) : 0, side = an.earAt % 2 < 1;
    const back = an.fight * 0.5 + (S.time - an.hitStart < 0.6 ? 0.6 : 0) + run * 0.3;
    addP(P, "earL", -back * 0.6 + (side ? tw * 0.4 : 0), 0, back * 0.3);
    addP(P, "earR", -back * 0.6 + (side ? 0 : tw * 0.4), 0, -back * 0.3);
  }
  if (P.tail) {
    const lash = an.fight * (0.4 + 0.3 * Math.sin(t * 7));
    const wag = Math.sin(t * (1.6 + run * 3 + an.fight * 2)) * (0.3 + run * 0.15 + an.fight * 0.2);
    addP(P, "tail", 0.2 - run * 0.35 - lash * 0.6, wag * 0.6, 0);
    addP(P, "tail2", -0.25 - run * 0.2 - lash * 0.5, wag, 0);
  }
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.9), kn = ease((S.time - an.dead) / 0.35), sd = an.deadVar || 1;
    for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; }
    addP(P, "thighL", -0.9 * kn * (1 - k) - 0.2 * k, 0, 0.15 * k); addP(P, "thighR", -0.6 * kn * (1 - k), 0, -0.1 * k);
    addP(P, "shinL", 1.4 * kn * (1 - k), 0, 0); addP(P, "shinR", 1.1 * kn * (1 - k), 0, 0);
    addP(P, "upArmL", 0, 0, 1.1 * k); addP(P, "upArmR", 0, 0, -1.1 * k);
    addP(P, "head", -0.25 * k, 0.5 * k * sd, 0);
    v.rootRot[0] = -1.5 * k; v.rootRot[2] = 0.15 * sd * k;
    v.rootOff[0] = 0; v.rootOff[1] = 0.14 * k - 0.35 * kn * (1 - k); v.rootOff[2] = 0;
    sharp = false;
  } else if (an.rise != null && S.time - an.rise < 1.4) {
    const rk = (S.time - an.rise) / 1.4, up = ease(rk), kneel = Math.sin(Math.PI * Math.min(1, rk * 1.2));
    setP(P, "thighL", -1.1 * kneel, 0, 0.1, 1); setP(P, "shinL", 1.6 * kneel, 0, 0, 1);
    setP(P, "thighR", -0.3 * kneel, 0, -0.1, 1); setP(P, "shinR", 1.9 * kneel, 0, 0, 1);
    setP(P, "spine", 0.4 * kneel, 0, 0, 1); setP(P, "head", 0.3 * kneel, 0, 0, 1);
    setP(P, "upArmL", -0.4 * kneel, 0, 0.3, 1); setP(P, "upArmR", 0.2 * kneel, 0, -0.3, 1);
    v.rootRot[0] = -1.5 * (1 - ease(rk / 0.35));
    v.rootOff[1] = -0.45 * kneel;
    sharp = false;
  }
  if (P.fingersR) {
    const wk = v.weaponKind, held = v.weapon && v.weaponDrawn, two = held && ["greataxe", "scythe", "gkatana", "gsword", "staff", "polearm", "archery"].includes(wk);
    const fist = (wk === "h2h" || (!wk && !isMob(e))) && an.fight > 0.5;
    const relax = e.alive === false ? 0.15 : 0.35 + 0.08 * Math.sin(t * 0.7);
    const cR = fist ? 1.55 : held ? 1.3 : relax, cL = fist ? 1.55 : two ? 1.2 : relax;
    setP(P, "fingersR", 0, 0, cR, 1); setP(P, "fingersL", 0, 0, -cL, 1);
    setP(P, "thumbR", 0.3 * cR, 0, 0.4 * cR, 1); setP(P, "thumbL", 0.3 * cL, 0, -0.4 * cL, 1);
  }
  applyPose(v, dt, sharp);
  let w = clamp((an.spd - 0.15) / 0.45, 0, 1);
  if (e.mounted || e.resting || e.alive === false || (an.sit || 0) > 0.05 || (typeof jumpPhase === "function" && jumpPhase(e)) || S.time - an.wsStart < 0.9) w = 0;
  an.ikW = (an.ikW || 0) + (w - (an.ikW || 0)) * Math.min(1, dt * 8);
  clothSprings(v, e, an, dt, t);
  if (v.bones.mouth) {
    const em = e.emote && S.time - e.emote.at < (e.emote.id === "dance" ? 5 : 2.4) ? e.emote.id : null;
    let m = 0;
    if (e.alive === false) m = 0.35;
    else if (e.talkUntil > S.time) m = 0.25 + 0.55 * Math.abs(Math.sin(t * 13 + Math.sin(t * 5.3) * 2));
    else if (S.time - an.wsStart < 0.55) m = 0.9;
    else if (em === "laugh" || em === "cheer") m = 0.35 + 0.5 * Math.abs(Math.sin(t * 11));
    else if (em === "panic" || em === "surprised") m = 0.8;
    else if (em === "cry") m = 0.3 + 0.15 * Math.sin(t * 6);
    else if (S.time - an.hitStart < 0.3) m = 0.5;
    else if (e.casting) m = 0.15 + 0.25 * Math.abs(Math.sin(t * 9));
    else if (an.fight > 0.5 && S.time - an.aStart < 0.35) m = 0.3;
    an.mouth = (an.mouth || 0) + (m - (an.mouth || 0)) * Math.min(1, dt * 18);
    v.bones.mouth.scale.set(1, 0.04 + an.mouth, 1);
    if (v.bones.jaw) v.bones.jaw.rotation.x = an.mouth * 0.16;
  }
  if (an.ikW > 0.01) humanLegIK(v, an, an.ikW, clamp((an.spd - 1.2) / 4, 0, 1));
}

const IKQ = { h: null, inv: null, q: null, x: null, v: null };
function sprAx(st, k, target, dt, kS, kD) {
  const o = st[k] || (st[k] = { x: target, v: 0 });
  const n = Math.max(1, Math.ceil(dt / 0.012)), h = dt / n;
  for (let i = 0; i < n; i++) { const acc = kS * (target - o.x) - kD * o.v; o.v += acc * h; o.x += o.v * h; }
  if (!isFinite(o.x)) { o.x = target; o.v = 0; }
  return o.x;
}
function clothSprings(v, e, an, dt, t) {
  const B = v.bones;
  if (!B.cape && !B.hairTail && !B.tabF) return;
  const st = an.spr || (an.spr = {}), run = clamp((an.spd - 1.2) / 4, 0, 1), walk = clamp(an.spd / 1.2, 0, 1);
  const acc = clamp(((an.spd - (an.prevSpd || 0)) / Math.max(dt, 0.001)) * 0.06, -0.6, 0.6); an.prevSpd = an.spd;
  const yaw = e.face || 0, dy = Math.atan2(Math.sin(yaw - (an.sprYaw == null ? yaw : an.sprYaw)), Math.cos(yaw - (an.sprYaw == null ? yaw : an.sprYaw))); an.sprYaw = yaw;
  const turn = clamp(dy / Math.max(dt, 0.001) * 0.12, -0.5, 0.5);
  const bob = Math.abs(Math.cos(an.ph)) * (walk + run) * 0.06, dead = e.alive === false;
  if (B.cape) {
    const lift = dead ? 0 : 0.04 + 0.38 * run + 0.14 * walk + acc * 0.7 + Math.sin(t * 9 + an.ph) * 0.05 * run;
    const c1 = sprAx(st, "c1", lift, dt, 55, 7), z1 = sprAx(st, "cz", -turn * 0.6, dt, 40, 6);
    B.cape.rotation.set(c1, 0, z1);
    if (B.cape2) B.cape2.rotation.set(sprAx(st, "c2", c1 * 0.2 + bob + Math.sin(t * 11 + 1) * 0.06 * run, dt, 45, 5), 0, sprAx(st, "cz2", -turn * 0.3, dt, 35, 5));
    if (B.cape3) B.cape3.rotation.set(sprAx(st, "c3", c1 * 0.15 + bob * 1.4 + Math.sin(t * 13 + 2) * 0.08 * run, dt, 38, 4), 0, sprAx(st, "cz3", -turn * 0.3, dt, 30, 4));
  }
  if (B.hairTail) {
    const hx = sprAx(st, "h1", 0.08 + 0.45 * run + 0.12 * walk + acc * 0.8 + bob, dt, 50, 6), hz = sprAx(st, "hz", -turn * 0.8 + Math.sin(an.ph) * 0.08 * (walk + run), dt, 40, 5);
    B.hairTail.rotation.set(hx, sprAx(st, "hy", -turn * 0.4, dt, 40, 6), hz);
  }
  const thF = Math.max(0, -(B.thighL ? B.thighL.rotation.x : 0), -(B.thighR ? B.thighR.rotation.x : 0)), thB = Math.max(0, B.thighL ? B.thighL.rotation.x : 0, B.thighR ? B.thighR.rotation.x : 0);
  if (B.tabF) B.tabF.rotation.set(sprAx(st, "tf", -thF * 0.9 - 0.15 * run - acc * 0.4, dt, 70, 8), 0, sprAx(st, "tfz", -turn * 0.3, dt, 50, 6));
  if (B.tabB) B.tabB.rotation.set(sprAx(st, "tb", thB * 0.9 + 0.3 * run + bob, dt, 60, 7), 0, sprAx(st, "tbz", -turn * 0.3, dt, 50, 6));
}

function humanLegIK(v, an, w, run) {
  const B = v.bones;
  if (!B.thighL || !B.shinL || !B.footL || !B.root || !B.hips) return;
  if (!IKQ.h) { IKQ.h = new THREE.Quaternion(); IKQ.inv = new THREE.Quaternion(); IKQ.q = new THREE.Quaternion(); IKQ.x = new THREE.Quaternion(); IKQ.v = new THREE.Vector3(); }
  const Lt = B.shinL.position.length(), Ls = B.footL.position.length(), L = Lt + Ls;
  const sc = v.scale || 1, S = strideEff(v, an.spd);
  const beta = 0.62 - 0.28 * run, D = beta * S / sc, lift = (0.06 + 0.1 * run) / sc;
  const rest = B.root.userData.rest;
  const restHip = B.hips.position.y - (B.root.position.y - rest.y) + B.thighL.position.y, ank0 = restHip - L;
  IKQ.h.setFromEuler(B.hips.rotation); IKQ.inv.copy(IKQ.h).invert();
  for (const [sd, off] of [["L", 0], ["R", Math.PI]]) {
    let q = an.ph + off; q = Math.atan2(Math.sin(q), Math.cos(q));
    const bp = beta * Math.PI;
    let z, y = 0, toe = 0;
    const zf = D * 0.42, zb = zf - D;
    if (Math.abs(q) <= bp) { const st = (q + bp) / (2 * bp); z = zf - D * st; }
    else { let u = (q - bp) / (2 * Math.PI - 2 * bp); if (u < 0) u += Math.PI / (Math.PI - bp); u = clamp(u, 0, 1); const e = u * u * (3 - 2 * u); z = zb + D * e; y = lift * Math.sin(Math.PI * u); toe = -0.25 * Math.sin(Math.PI * u); }
    const t = B["thigh" + sd], k = B["shin" + sd], f = B["foot" + sd];
    const hj = IKQ.v.copy(t.position).applyQuaternion(IKQ.h).add(B.hips.position).add(B.root.position).sub(rest);
    const dz = z - hj.z;
    let depth = hj.y + rest.y - (ank0 + y);
    const reach = L * 0.995;
    let raise = 0;
    if (Math.hypot(dz, depth) > reach) { const nd = Math.sqrt(Math.max(0.0001, reach * reach - Math.min(reach * 0.98, Math.abs(dz)) ** 2)); raise = depth - nd; depth = nd; }
    const d = Math.min(reach, Math.hypot(dz, depth));
    const al = Math.atan2(dz, depth);
    const bt = Math.acos(clamp((Lt * Lt + d * d - Ls * Ls) / (2 * Lt * d), -1, 1));
    const thigh = -(al + bt);
    const shin = Math.PI - Math.acos(clamp((Lt * Lt + Ls * Ls - d * d) / (2 * Lt * Ls), -1, 1));
    const foot = -(thigh + shin) + toe + clamp(raise / (0.06 / sc), 0, 1) * 0.55;
    IKQ.x.setFromAxisAngle(V3X, thigh);
    IKQ.q.copy(IKQ.inv).multiply(IKQ.x);
    t.quaternion.slerp(IKQ.q, w);
    k.rotation.set(k.rotation.x + (shin - k.rotation.x) * w, k.rotation.y * (1 - w), k.rotation.z * (1 - w));
    f.rotation.set(f.rotation.x + (foot - f.rotation.x) * w, f.rotation.y * (1 - w), f.rotation.z * (1 - w));
  }
}
const V3X = new THREE.Vector3(1, 0, 0);

function poseBat(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const moving = an.spd > 0.5;
  const fr = moving ? 11 : 8;
  const f = Math.sin(t * fr);
  const f2 = Math.sin(t * fr - 0.8);
  addP(P, "wingL", 0, 0, 0.25 + f * 0.95); addP(P, "wingR", 0, 0, -(0.25 + f * 0.95));
  addP(P, "wing2L", 0, 0, 0.15 + f2 * 0.65); addP(P, "wing2R", 0, 0, -(0.15 + f2 * 0.65));
  addP(P, "body", moving ? 0.35 : 0.08, 0, 0);
  addP(P, "head", moving ? -0.25 : 0, Math.sin(t * 0.8) * 0.2, 0);
  v.rootOff[1] = -f * 0.06 + Math.sin(t * 1.3) * 0.08;
  const ak = (S.time - an.aStart) / 0.45;
  let sharp = false;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const w = env(ak, 0.3, 0.5);
    addP(P, "body", 0.6 * w, 0, 0);
    v.rootOff[2] += 0.4 * w; v.rootOff[1] -= 0.35 * w;
  }
  if (e.readying) { addP(P, "body", -0.5, 0, 0); P.wingL[2] = 1.1 + f * 0.3; P.wingR[2] = -1.1 - f * 0.3; v.rootOff[1] += 0.25; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.4 * w, 0, 0.3 * w); v.rootOff[1] += 0.15 * w; }
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.55);
    P.wingL[2] = -0.6 * k + P.wingL[2] * (1 - k); P.wingR[2] = 0.6 * k + P.wingR[2] * (1 - k);
    P.wing2L[2] = -1.2 * k; P.wing2R[2] = 1.2 * k;
    v.rootOff[1] = -1.22 * k; v.rootRot[2] = 1.4 * k; v.rootOff[2] = 0;
  }
  applyPose(v, dt, sharp);
}

function poseBee(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.5, 0, 1);
  const f = Math.sin(t * 40);
  addP(P, "wingL", 0, 0, 0.3 + f * 0.6); addP(P, "wingR", 0, 0, -(0.3 + f * 0.6));
  addP(P, "wing2L", 0, 0, 0.2 - f * 0.5); addP(P, "wing2R", 0, 0, -(0.2 - f * 0.5));
  addP(P, "body", mv * 0.4, 0, Math.sin(t * 3) * 0.08);
  addP(P, "tail", -mv * 0.2 + Math.sin(t * 5) * 0.05, 0, 0);
  addP(P, "head", Math.sin(t * 2.2) * 0.1, Math.sin(t * 1.1) * 0.3 * (1 - mv), 0);
  v.rootOff[1] = Math.sin(t * 2.6) * 0.07 + Math.sin(t * 7.3) * 0.02;
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.4;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.25, 0.5); addP(P, "body", 0.9 * w, 0, 0); addP(P, "tail", 1.2 * w, 0, 0); v.rootOff[2] += 0.35 * w; v.rootOff[1] -= 0.2 * w; }
  if (e.readying) { addP(P, "body", -0.6, 0, 0); addP(P, "tail", -0.5, Math.sin(t * 25) * 0.1, 0); v.rootOff[1] += 0.2; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.4 * w, 0, 0.4 * w); v.rootOff[2] -= 0.15 * w; }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.5); v.rootOff[1] = -0.85 * k; v.rootRot[2] = 2.6 * k; P.wingL[2] = 0.1; P.wingR[2] = -0.1; }
  applyPose(v, dt, sharp);
}

function poseCrawler(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.2, 0, 1);
  for (let i = 0; i < 6; i++) addP(P, "t" + i, Math.sin(t * 7 - i * 1.1) * 0.08 * mv + Math.sin(t * 1.5 - i) * 0.02, Math.sin(t * 2.5 - i * 0.7) * (0.04 + 0.1 * mv), 0);
  addP(P, "head", Math.sin(t * 1.3) * 0.08, Math.sin(t * 0.7) * 0.3 * (1 - mv), 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.6;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const lift = ease(ak / 0.35) * (1 - ease((ak - 0.35) / 0.25)), strike = ak > 0.35 ? env((ak - 0.35) / 0.65, 0.2, 0.7) : 0;
    addP(P, "t3", -0.5 * lift + 0.3 * strike, 0, 0); addP(P, "t4", -0.45 * lift + 0.35 * strike, 0, 0); addP(P, "t5", -0.35 * lift + 0.3 * strike, 0, 0); addP(P, "head", -0.3 * lift + 0.5 * strike, 0, 0);
  }
  if (e.readying) { const sh = Math.sin(t * 28) * 0.06; addP(P, "t3", -0.55, sh, 0); addP(P, "t4", -0.5, -sh, 0); addP(P, "t5", -0.3, sh, 0); addP(P, "head", -0.2, 0, 0); }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "t4", 0.2 * w, 0, 0); addP(P, "head", 0.3 * w, 0, 0); }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.7); for (let i = 0; i < 6; i++) { const p = P["t" + i]; p[0] *= 1 - k; p[1] = p[1] * (1 - k) + (i % 2 ? 0.12 : -0.12) * k; } v.rootRot[2] = 1.2 * k; v.rootOff[1] = 0.1 * k; }
  applyPose(v, dt, sharp);
}

function poseQuad(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const q = v.meta.quad || {};
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.3, 0, 1);
  const s1 = Math.sin(an.ph), c1 = Math.cos(an.ph);
  addP(P, "legFL", c1 * 0.7 * mv, 0, 0); addP(P, "legBR", c1 * 0.7 * mv, 0, 0);
  addP(P, "legFR", -c1 * 0.7 * mv, 0, 0); addP(P, "legBL", -c1 * 0.7 * mv, 0, 0);
  addP(P, "shinFL", Math.max(0, -s1) * 0.9 * mv, 0, 0); addP(P, "shinBR", Math.max(0, -s1) * 0.9 * mv, 0, 0);
  addP(P, "shinFR", Math.max(0, s1) * 0.9 * mv, 0, 0); addP(P, "shinBL", Math.max(0, s1) * 0.9 * mv, 0, 0);
  addP(P, "body", Math.sin(t * 1.6) * 0.02 + c1 * 0.04 * mv, 0, 0);
  v.rootOff[1] = Math.abs(s1) * 0.04 * mv;
  const graze = (1 - mv) * (Math.sin(t * 0.35) > 0.6 ? 1 : 0);
  addP(P, "neck", graze * 0.9 + Math.sin(t * 1.1) * 0.04, Math.sin(t * 0.5) * 0.25 * (1 - mv), 0);
  addP(P, "head", graze * 0.5 + Math.sin(t * 2.3) * 0.03, Math.sin(t * 0.7) * 0.2 * (1 - mv), 0);
  const wag = Math.sin(t * (2 + mv * 4)) * 0.35;
  addP(P, "tail", 0, wag, 0); addP(P, "tail2", 0, wag * 1.3, 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.3, 0.6); addP(P, "neck", -0.5 * w, 0, 0); addP(P, "head", 0.8 * w, 0, 0); addP(P, "body", -0.15 * w, 0, 0); v.rootOff[2] += 0.2 * w; }
  if (e.readying) { addP(P, "neck", -0.4, 0, 0); addP(P, "head", -0.3, Math.sin(t * 20) * 0.08, 0); addP(P, "legFL", -0.5, 0, 0); addP(P, "legFR", -0.5, 0, 0); v.rootOff[1] += 0.06; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.15 * w, 0, 0.2 * w); addP(P, "head", -0.3 * w, 0, 0); }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.12 * k; for (const n of ["legFL", "legFR", "legBL", "legBR"]) addP(P, n, 0, 0, 0.6 * k); }
  applyPose(v, dt, sharp);
}

function poseCrab(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.2, 0, 1);
  const ph = an.ph * 1.6;
  for (const s of ["L", "R"]) for (let k = 0; k < 4; k++) { const f = Math.sin(ph + k * 1.6 + (s === "L" ? 0 : Math.PI)); addP(P, "leg" + s + k, Math.max(0, f) * 0.5 * mv, 0, (s === "L" ? 1 : -1) * f * 0.25 * mv); }
  addP(P, "body", Math.sin(t * 2.1) * 0.03, 0, Math.sin(ph) * 0.05 * mv);
  const snip = Math.sin(t * 2.7) > 0.7 ? Math.sin(t * 24) * 0.25 : 0;
  addP(P, "armL", 0, 0.15 + snip * 0.2, 0.1); addP(P, "armR", 0, -0.15 - snip * 0.2, -0.1);
  addP(P, "clawL", 0, snip, 0); addP(P, "clawR", 0, -snip, 0);
  v.rootOff[1] = Math.abs(Math.sin(ph)) * 0.03 * mv;
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.3, 0.6); const side = an.aVar ? 1 : -1; addP(P, side > 0 ? "armL" : "armR", -0.9 * w, side * 0.8 * w, 0); addP(P, side > 0 ? "clawL" : "clawR", 0, side * 1.0 * w, 0); addP(P, "body", -0.2 * w, side * 0.3 * w, 0); v.rootOff[2] += 0.2 * w; }
  if (e.readying) { addP(P, "armL", -1.2, 0.5, 0); addP(P, "armR", -1.2, -0.5, 0); addP(P, "clawL", 0, 0.8 + Math.sin(t * 22) * 0.2, 0); addP(P, "clawR", 0, -0.8 - Math.sin(t * 22) * 0.2, 0); v.rootOff[1] += 0.08; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); v.rootOff[2] -= 0.15 * w; addP(P, "body", -0.2 * w, 0, 0); }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[0] = 3.1 * k; v.rootOff[1] = 0.35 * k; }
  applyPose(v, dt, sharp);
}

function poseMandrake(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.2, 0, 1);
  const s1 = Math.sin(an.ph * 1.3);
  v.rootOff[1] = Math.max(0, s1) * 0.22 * mv;
  addP(P, "body", -s1 * 0.2 * mv + Math.sin(t * 1.7) * 0.03, 0, 0);
  addP(P, "legL", -s1 * 0.8 * mv, 0, 0); addP(P, "legR", -s1 * 0.8 * mv, 0, 0);
  addP(P, "armL", 0, 0, 0.4 + s1 * 0.5 * mv + Math.sin(t * 2.3) * 0.1); addP(P, "armR", 0, 0, -(0.4 + s1 * 0.5 * mv + Math.sin(t * 2.3) * 0.1));
  addP(P, "head", Math.sin(t * 1.2) * 0.08, Math.sin(t * 0.6) * 0.5 * (1 - mv), Math.sin(t * 0.9) * 0.1);
  addP(P, "leaf", Math.sin(t * 2.6) * 0.15, 0, Math.sin(t * 1.9) * 0.2);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.25, 0.6); addP(P, "body", 0.6 * w, 0, 0); addP(P, "head", 0.8 * w, 0, 0); v.rootOff[2] += 0.3 * w; v.rootOff[1] += 0.15 * w; }
  if (e.readying) { addP(P, "body", -0.4, 0, 0); addP(P, "head", -0.5, 0, 0); addP(P, "leaf", -0.6, 0, Math.sin(t * 25) * 0.3); v.rootOff[1] += 0.1; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0); addP(P, "head", -0.4 * w, 0, 0); v.rootOff[1] += 0.1 * w; }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.2 * k; addP(P, "leaf", 0, 0, 1.2 * k); }
  applyPose(v, dt, sharp);
}

function poseShroom(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.0, 0, 1);
  const s1 = Math.sin(an.ph * 1.4);
  v.rootOff[1] = Math.max(0, s1) * 0.18 * mv;
  addP(P, "body", -s1 * 0.15 * mv + Math.sin(t * 1.4) * 0.03, 0, Math.sin(t * 0.9) * 0.05);
  addP(P, "head", Math.sin(t * 1.1) * 0.06, Math.sin(t * 0.4) * 0.3 * (1 - mv), Math.sin(t * 1.6) * 0.08);
  addP(P, "armL", 0, 0, 0.3 + Math.sin(t * 2.1) * 0.15); addP(P, "armR", 0, 0, -(0.3 + Math.sin(t * 2.1) * 0.15));
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.5;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.3, 0.5); addP(P, "head", 0.7 * w, 0, 0); addP(P, "body", 0.3 * w, 0, 0); v.rootOff[1] += 0.12 * w; }
  if (e.readying) { addP(P, "head", -0.4 + Math.sin(t * 30) * 0.08, 0, 0); addP(P, "body", -0.2, 0, 0); v.rootOff[1] += 0.08; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0.2 * w); addP(P, "head", -0.3 * w, 0, 0); }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[0] = 1.5 * k; v.rootOff[1] = 0.1 * k; }
  applyPose(v, dt, sharp);
}

function poseFish(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.3, 0, 1);
  const flap = Math.sin(t * (4 + mv * 6));
  addP(P, "tail", 0, flap * 0.35, 0); addP(P, "tail2", 0, flap * 0.5, 0);
  addP(P, "finL", 0, 0, 0.3 + Math.sin(t * 5) * 0.3); addP(P, "finR", 0, 0, -(0.3 + Math.sin(t * 5) * 0.3));
  addP(P, "body", Math.sin(t * 1.8) * 0.05 - mv * 0.2, flap * 0.08, Math.sin(t * 1.2) * 0.05);
  v.rootOff[1] = 0.1 + Math.sin(t * 2.2) * 0.08 + Math.abs(Math.sin(an.ph * 0.8)) * 0.25 * mv;
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.3, 0.6); addP(P, "body", 0.5 * w, 0, 0); v.rootOff[2] += 0.4 * w; v.rootOff[1] += 0.3 * w; }
  if (e.readying) { addP(P, "body", -0.5, 0, 0); addP(P, "tail", 0, Math.sin(t * 24) * 0.4, 0); v.rootOff[1] += 0.25; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); v.rootOff[2] -= 0.15 * w; addP(P, "body", 0, 0, 0.5 * w); }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 1.5 * k; v.rootOff[1] = -0.15 * k; addP(P, "tail2", 0, 0.3 * k, 0); }
  applyPose(v, dt, sharp);
}

function poseWorm(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.5, 0, 1);
  for (let i = 0; i < 8; i++) {
    addP(P, "t" + i, Math.sin(t * 6 - i * 1.0) * 0.1 * mv, Math.sin(t * 2.4 - i * 0.8) * (0.1 + 0.12 * mv), 0);
  }
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.55;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const lift = ease(ak / 0.4) * (1 - ease((ak - 0.4) / 0.2));
    const strike = ak > 0.4 ? env((ak - 0.4) / 0.6, 0.2, 0.8) : 0;
    addP(P, "t5", -0.45 * lift + 0.3 * strike, 0, 0); addP(P, "t6", -0.4 * lift + 0.3 * strike, 0, 0); addP(P, "t7", -0.25 * lift + 0.25 * strike, 0, 0);
  }
  if (e.readying) {
    const sh = Math.sin(t * 30) * 0.05;
    addP(P, "t4", -0.25, sh, 0); addP(P, "t5", -0.45, -sh, 0); addP(P, "t6", -0.4, sh, 0); addP(P, "t7", -0.15, 0, 0);
  }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "t6", 0.2 * w, 0, 0); addP(P, "t7", 0.25 * w, 0, 0); }
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.8);
    for (let i = 0; i < 8; i++) { const p = P["t" + i]; p[0] *= 1 - k; p[1] = p[1] * (1 - k) + (i % 2 ? 0.08 : -0.08) * k; }
    v.rootOff[1] = -0.12 * k; v.rootRot[2] = 0.6 * k;
  }
  applyPose(v, dt, sharp);
}

function poseHare(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.0, 0, 1);
  const s1 = Math.sin(an.ph * 0.9), c1 = Math.cos(an.ph * 0.9);
  v.rootOff[1] = Math.max(0, s1) * 0.26 * mv;
  addP(P, "body", -c1 * 0.25 * mv + Math.sin(t * 1.4) * 0.02, 0, 0);
  addP(P, "legBL", c1 * 0.95 * mv, 0, 0); addP(P, "legBR", c1 * 0.95 * mv, 0, 0);
  addP(P, "legFL", -c1 * 0.6 * mv, 0, 0); addP(P, "legFR", -c1 * 0.6 * mv, 0, 0);
  const tw = Math.sin(t * 2.7) > 0.95 ? 0.25 : 0;
  addP(P, "earL", -0.1 + 0.55 * mv + tw, 0, 0.15); addP(P, "earR", -0.1 + 0.55 * mv, 0, -0.15 - tw);
  addP(P, "head", Math.sin(t * 6) * 0.03 * (1 - mv) + 0.1 * mv, Math.sin(t * 0.5) * 0.4 * (1 - mv), 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const w = env(ak, 0.3, 0.6);
    addP(P, "body", 0.45 * w, 0, 0); addP(P, "legBL", -1.3 * w, 0, 0); addP(P, "legBR", -1.3 * w, 0, 0);
    v.rootOff[1] += 0.12 * w; v.rootOff[2] += 0.15 * w;
  }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0); v.rootOff[1] += 0.08 * w; }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.5); v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.05 * k; addP(P, "legBL", 0.5 * k, 0, 0); }
  applyPose(v, dt, sharp);
}

function poseRaptor(v, spd, dt, phRef) {
  const P = newPose(v);
  const an = v.an || (v.an = { ph: 0, t0: Math.random() * 10, spd: 0 });
  an.spd += (spd - an.spd) * Math.min(1, dt * 8);
  an.ph = phRef != null ? phRef : an.ph + an.spd * dt * (Math.PI * 2) / 3.2;
  const t = S.time + an.t0;
  const run = clamp(an.spd / 8, 0, 1), walk = clamp(an.spd / 1.5, 0, 1) * (1 - run);
  const amp = run + walk * 0.5;
  const s1 = Math.sin(an.ph), c1 = Math.cos(an.ph);
  for (const [sd, sg] of [["L", 1], ["R", -1]]) {
    const s = s1 * sg, c = c1 * sg;
    addP(P, "thigh" + sd, s * 0.7 * amp, 0, 0);
    addP(P, "shin" + sd, -0.55 * Math.max(0, c) * amp, 0, 0);
    addP(P, "meta" + sd, 0.6 * Math.max(0, c) * amp, 0, 0);
    addP(P, "toe" + sd, -0.4 * Math.max(0, -s) * amp, 0, 0);
    addP(P, "arm" + sd, 0.3 + Math.sin(t * 1.1) * 0.05, 0, 0);
  }
  addP(P, "pelvis", 0.04 * run, Math.sin(an.ph) * 0.05 * amp, 0);
  v.rootOff[1] = Math.abs(c1) * 0.09 * amp;
  addP(P, "chest", Math.sin(t * 1.5) * 0.02, 0, 0);
  addP(P, "tail1", -0.1 * run, s1 * 0.12 * amp + Math.sin(t * 1.3) * 0.12 * (1 - amp), 0);
  addP(P, "tail2", 0, Math.sin(an.ph - 0.6) * 0.15 * amp + Math.sin(t * 1.3 - 0.6) * 0.15 * (1 - amp), 0);
  addP(P, "tail3", 0.05, Math.sin(an.ph - 1.2) * 0.2 * amp + Math.sin(t * 1.3 - 1.2) * 0.2 * (1 - amp), 0);
  addP(P, "neck1", 0.18 * run, -s1 * 0.05 * amp, 0);
  addP(P, "neck2", -0.12 * run, Math.sin(t * 0.4) * 0.25 * (1 - amp), 0);
  addP(P, "head", -0.06 * run + Math.sin(an.ph * 2) * 0.05 * amp, Math.sin(t * 0.33) * 0.3 * (1 - amp), 0);
  applyPose(v, dt, false);
}
