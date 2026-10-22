const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const env = (k, a, b) => k < 0 || k > 1 ? 0 : Math.min(1, k / a, (1 - k) / b);

const MOB_IDLES = { goblin: [1, 3, 4, 6], chieftain: [1, 3, 4], orc: [1, 2, 3], fishfolk: [1, 3, 6], birdfolk: [1, 6, 1], treant: [1, 3], ghoul: [1, 3, 6], skeleton: [1, 6], cactus: [1, 3], other: [1, 3] };

function animState(v) {
  if (!v.an) v.an = { ph: Math.random() * 6, spd: 0, lx: null, ly: null, swing: null, aStart: -9, aVar: 0, ws: null, wsStart: -9, hit: null, hitStart: -9, casting: false, relStart: -9, dead: null, t0: Math.random() * 10, fight: 0, lastStep: 0, readyStart: -9, wasReady: false };
  return v.an;
}

function strideEff(v, spd, ik) {
  const run = runOf(v, spd), S = (v.stride || 1.7) * (1 + 0.9 * run), B = v.bones;
  if (v.kind === "quad" && v.meta && v.meta.quad && v.meta.quad.leg) { const g = v.an && v.an.gait, q = v.meta.quad, reach = (q.Lt && q.Ls ? q.Lt + q.Ls : q.leg) * (q.digi ? 0.55 : q.sprawl ? 0.9 : 0.76) * (v.scale || 1); return Math.min(S * 1.6, reach / (g ? g.duty : 0.66)); }
  if (v.kind !== "human" || !B || !B.shinL || !B.footL) return S;
  const L = (B.shinL.position.length() + B.footL.position.length()) * (v.scale || 1), rel = Math.min(1, L / 0.86);
  const sm = 1 - rel, Sl = Math.min(S, (1.25 + 0.6 * sm * (1 - run) + 3.4 * run * sm) * L / (0.62 - 0.28 * run - 0.14 * run * sm));
  return Sl * (sm > 0 ? (0.7 + 0.3 * rel) + (0.95 - 0.7 - 0.3 * rel) * run : 1);
}
function runOf(v, spd) { return clamp((spd / Math.sqrt(legRel(v)) - 1.2) / 4, 0, 1); }
function legRel(v) {
  const B = v.bones;
  if (v.kind !== "human" || !B || !B.shinL || !B.footL) return 1;
  return Math.min(1, (B.shinL.position.length() + B.footL.position.length()) * (v.scale || 1) / 0.86);
}
function trackEvents(v, e, dt) {
  const an = animState(v);
  if (an.lx == null) { an.lx = e.x; an.ly = e.y; }
  const mdx = e.x - an.lx, mdy = e.y - an.ly, d = Math.hypot(mdx, mdy) * U;
  an.lx = e.x; an.ly = e.y;
  const raw = dt > 0 ? Math.min(d / dt, 20) : 0;
  an.spd += (raw - an.spd) * Math.min(1, dt * 10);
  if (d > 0.0005) { const rel = Math.atan2(mdy, mdx) - (e.face || 0), k = Math.min(1, dt * 8); an.mf = (an.mf == null ? 1 : an.mf) + (Math.cos(rel) - (an.mf == null ? 1 : an.mf)) * k; an.ms = (an.ms || 0) + (Math.sin(rel) - (an.ms || 0)) * k; }
  else if (an.spd < 0.2) { const m0 = an.mf == null ? 1 : an.mf; an.mf = m0 + (1 - m0) * Math.min(1, dt * 4); an.ms = (an.ms || 0) * (1 - Math.min(1, dt * 4)); }
  an.ph += (an.mf != null && an.mf < -0.3 ? -1 : 1) * d * (Math.PI * 2) / strideEff(v, an.spd);
  if (v.kind === "human" && (v.mob || e === player || e.kind === "remote" || e.mercId)) {
    if (an.spd > 0.8) an.stepping = 1;
    else if (an.stepping) { const r = Math.PI - (((an.ph % Math.PI) + Math.PI) % Math.PI), adv = Math.min(r, dt * Math.PI * 3); an.ph += adv; if (r - adv < 0.03 || e.alive === false) an.stepping = 0; }
  }
  if (e.lastSwing !== an.swing) { if (an.swing !== null && S.time - e.lastSwing < 0.3) { an.aStart = e.lastSwing; an.aVar = (an.aVar + 1) % 3; } an.swing = e.lastSwing; }
  if (e.lastWS !== an.ws) { if (an.ws !== null && S.time - e.lastWS < 0.3) { an.wsStart = e.lastWS; an.wsStyle = wsStyle(e.lastWSId); } an.ws = e.lastWS; }
  if (e.lastHit !== an.hit) { if (an.hit !== null && S.time - e.lastHit < 0.3) an.hitStart = e.lastHit; an.hit = e.lastHit; }
  if (e.lastJA !== an.ja) { if (an.ja !== null && S.time - e.lastJA < 0.3) { an.jaStart = e.lastJA; an.jaId = e.lastJAId; } an.ja = e.lastJA; }
  if (e.lastIntr !== an.intr) { if (an.intr !== null && S.time - e.lastIntr < 0.3) an.intrStart = e.lastIntr; an.intr = e.lastIntr; }
  if (an.casting && !e.casting) an.relStart = S.time;
  an.casting = !!e.casting;
  if (isMob(e) && e.state === "combat" && an.pst !== undefined && an.pst !== "combat") an.alertStart = S.time;
  an.pst = e.state;
  if (e.readying && !an.wasReady) an.readyStart = S.time;
  an.wasReady = !!e.readying;
  if (e.lastHit !== an.hit && e.lastHitAng != null) an.hitSide = Math.sin(e.lastHitAng - (e.face || 0)) > 0 ? 1 : -1;
  if (e.alive === false && an.dead == null) { an.dead = S.time; an.deadVar = [1, -1, 2][Math.floor(Math.random() * 3)]; }
  if (e.alive !== false && an.dead != null) { an.dead = null; an.rise = S.time; }
  return an;
}

function mobAlert(v, e, an, P) {
  const k = (S.time - (an.alertStart == null ? -9 : an.alertStart)) / 0.9;
  if (k < 0 || k > 1 || e.alive === false) return;
  const w = env(k, 0.2, 0.4), sh = Math.sin(S.time * 32) * 0.05 * w, B = v.bones;
  const spr = v.meta && v.meta.quad && v.meta.quad.sprawl, tl = spr ? 0.45 : 1;
  if (B.body) addP(P, "body", -0.3 * w * tl, sh, 0);
  if (B.neck) addP(P, "neck", -0.4 * w, 0, 0);
  if (B.tail && B.body) { addP(P, "tail", 0.28 * w * tl, 0, 0); if (B.tail2) addP(P, "tail2", 0.1 * w * tl, 0, 0); }
  if (spr) v.rootOff[1] += 0.05 * w;
  if (B.legFL) { addP(P, "legFL", -0.7 * w * tl, 0, 0); addP(P, "legFR", -0.7 * w * tl, 0, 0); }
  if (B.armL && B.armR && !B.upArmL) { addP(P, "armL", -1.1 * w, 0, 0.5 * w); addP(P, "armR", -1.1 * w, 0, -0.5 * w); }
  if (B.wingL) { addP(P, "wingL", 0, 0, 0.8 * w); addP(P, "wingR", 0, 0, -0.8 * w); }
  if (B.t3) { addP(P, "t3", -0.6 * w, sh, 0); addP(P, "t4", -0.55 * w, -sh, 0); addP(P, "t5", -0.4 * w, sh, 0); }
  if (B.upArmL) { addP(P, "upArmL", -0.5 * w, 0, 0.9 * w); addP(P, "upArmR", -0.5 * w, 0, -0.9 * w); addP(P, "chest", -0.25 * w, sh, 0); addP(P, "spine", -0.15 * w, 0, 0); addP(P, "head", -0.3 * w, 0, 0); }
  else if (B.head) addP(P, "head", -0.35 * w, sh, 0);
  v.rootOff[1] += 0.04 * w;
}

function normAngA(a) { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; }

let HAMMER_TUNE = null;
const HAMMER_POSE = { sA: 0.45, sF: -1.7, sH: 0.4, sS: 0.4, sZ: 0.4, rA: -2.2, rF: -1.0, rH: 0.5, rS: 0.25, rZ: 0.1 };
const NPC_WORK = { garrick: "hammer", marn: "work", odette: "work", tobin: "read", brann: "arms", ysolde: "work", maera: "read", corvin: "count", selene: "count", guard_east: "guard", guard_north: "guard", guard_pass: "guard", rhea: "arms", ilsa: "look" };

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
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.4;
  if (ak >= 0 && ak <= 1) { sharp = true; const pk = ak < 0.35 ? ease(ak / 0.35) : 1 - ease((ak - 0.35) / 0.65), dive = ak > 0.3 && ak < 0.6 ? 1 : 0; addP(P, "body", -0.3 * (1 - dive) * pk + 0.7 * dive, 0, 0); addP(P, "head", -0.4 * pk * (1 - dive) + 0.9 * dive, 0, 0); addP(P, "wingL", 0, 0, 0.6 * pk); addP(P, "wingR", 0, 0, -0.6 * pk); v.rootOff[2] += 0.25 * dive; v.rootOff[1] += 0.05 * pk; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.35 * w, 0, 0); addP(P, "wingL", 0, 0, 0.7 * w); addP(P, "wingR", 0, 0, -0.7 * w); v.rootOff[1] += 0.06 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.55); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 3.0 * k; v.rootOff[1] = -0.05 * k; addP(P, "legL", 0.8 * k, 0, 0); addP(P, "legR", 0.7 * k, 0, 0); addP(P, "wingL", 0, 0, 0.5 * k); addP(P, "wingR", 0, 0, -0.5 * k); addP(P, "head", 0.3 * k, 0.4 * k, 0); }
  applyPose(v, dt, sharp);
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

function setZ(P, b, z) { const p = P[b]; if (p) p[2] = z; }

const HIP_DRAW = { sword: 1, katana: 1, dagger: 1, axe: 1, club: 1 };
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

const LOOK_KINDS = { human: 1, quad: 1, hare: 1, rarab: 1, mandrake: 1, bird: 1 };
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
  const ty = v.tipYaw || 0, ty0 = v.tipApplied || 0, BH = v.bones.hips, BS = v.bones.spine;
  if (ty0 && BH && BS) { BH.rotation.y += ty0; BS.rotation.y -= ty0; }
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
  if (BH && BS) { BH.rotation.y -= ty; BS.rotation.y += ty; v.tipApplied = ty; }
}

const RACE_GAIT = {
  human: { bob: 1, arm: 1, roll: 0, lean: 0 },
  elari: { bob: 0.8, arm: 0.9, roll: 0, lean: -0.02 },
  pipkin: { bob: 1.7, arm: 1.35, roll: 0.04, lean: 0.04, leg: 0.6 },
  ursan: { bob: 0.7, arm: 0.85, roll: 0.12, lean: 0.06 },
  nekari: { bob: 1.15, arm: 1.05, roll: 0, lean: 0.05 }
};

const JA_CLASS = {
  provoke: "shout", warcry: "shout", feral_howl: "shout",
  steal: "grab", shield_bash: "bash",
  sneak_attack: "sneak", smoke_step: "sneak", flee: "sneak",
  meditate: "calm", chakra: "calm", focus: "calm", third_eye: "calm", hasso: "calm", convert: "calm", light_arts: "calm", dark_arts: "calm",
  jump: "leap", high_jump: "leap",
  phantom_roll: "roll", hawk_roll: "roll", double_down: "roll",
  healing_waltz: "dance", quick_step: "dance", rising_flourish: "dance", group_waltz: "dance",
  sharpshot: "aim", barrage: "aim", quick_shot: "aim", shadowbind: "aim"
};

function jaClass(id) { return JA_CLASS[id] || "power"; }
function jaDuration(id) { const c = jaClass(id); return c === "calm" ? 1.5 : c === "dance" ? 1.1 : c === "leap" ? 1.0 : 0.9; }

function jaPose(v, P, an, k, w, cls) {
  const pk = ease(k / 0.35);
  if (cls === "shout") {
    setP(P, "head", -0.5 * pk + 0.5 * ease((k - 0.4) / 0.2), 0, 0, w);
    setP(P, "spine", -0.3 * pk + 0.5 * ease((k - 0.4) / 0.2), 0, 0, w);
    setP(P, "upArmL", -1.0 - 0.8 * pk, 0, -0.9 * pk, w); setP(P, "upArmR", -1.0 - 0.8 * pk, 0, 0.9 * pk, w);
    setP(P, "foreArmL", -0.5, 0, 0, w); setP(P, "foreArmR", -0.5, 0, 0, w);
  } else if (cls === "grab") {
    const g = ease((k - 0.2) / 0.2) * (1 - ease((k - 0.55) / 0.3));
    setP(P, "upArmL", -0.5 - 1.1 * g, 0, 0.1, w); setP(P, "foreArmL", -0.5, 0, 0, w);
    setP(P, "spine", 0.1 + 0.35 * g, 0, 0, w); setP(P, "chest", 0, -0.4 * g, 0, w);
    v.rootOff[2] += 0.18 * g * w; v.rootOff[1] += -0.1 * g * w;
  } else if (cls === "bash") {
    const b = ease((k - 0.2) / 0.15) * (1 - ease((k - 0.5) / 0.3));
    setP(P, "upArmL", -0.8 - 0.7 * b, 0, -0.2, w); setP(P, "foreArmL", -1.6 + 1.4 * b, 0, 0, w);
    setP(P, "spine", 0.1 + 0.3 * b, 0, 0, w); v.rootOff[2] += 0.2 * b * w;
  } else if (cls === "sneak") {
    const c = ease(k / 0.25) * (1 - ease((k - 0.7) / 0.3));
    setP(P, "thighL", -0.9 * c, 0, 0, w); setP(P, "thighR", -0.9 * c, 0, 0, w);
    setP(P, "shinL", 1.4 * c, 0, 0, w); setP(P, "shinR", 1.4 * c, 0, 0, w);
    setP(P, "spine", 0.5 * c, 0, 0, w); setP(P, "head", -0.3 * c, 0, 0, w);
    setP(P, "upArmL", -0.5 * c, 0, 0.3, w); setP(P, "upArmR", -0.5 * c, 0, -0.3, w);
    v.rootOff[1] += -0.28 * c * w;
  } else if (cls === "calm") {
    const c = ease(k / 0.25) * (1 - ease((k - 0.8) / 0.2));
    setP(P, "upArmL", -0.8 * c, 0, -0.3 * c, w); setP(P, "upArmR", -0.8 * c, 0, 0.3 * c, w);
    setP(P, "foreArmL", -1.7 * c, 0, 0, w); setP(P, "foreArmR", -1.7 * c, 0, 0, w);
    setP(P, "head", 0.3 * c, 0, 0, w); setP(P, "spine", 0.08 * c, 0, 0, w);
    setP(P, "thighL", -0.15 * c, 0, 0, w); setP(P, "thighR", -0.15 * c, 0, 0, w);
    v.rootOff[1] += -0.04 * c * w;
  } else if (cls === "leap") {
    const c = ease(k / 0.2) * (1 - ease((k - 0.2) / 0.1)), air = k > 0.25 && k < 0.8 ? Math.sin((k - 0.25) / 0.55 * Math.PI) : 0;
    setP(P, "thighL", -0.7 * c - 0.5 * air, 0, 0, w); setP(P, "thighR", -0.5 * c - 0.2 * air, 0, 0, w);
    setP(P, "shinL", 1.0 * c + 0.8 * air, 0, 0, w); setP(P, "shinR", 0.8 * c + 0.4 * air, 0, 0, w);
    setP(P, "upArmR", -2.4 * ease(k / 0.3), 0, -0.2, w); setP(P, "upArmL", -1.6 * ease(k / 0.3), 0, 0.3, w);
    v.rootOff[1] += (-0.18 * c + 1.1 * air) * w;
  } else if (cls === "roll") {
    const f = ease((k - 0.25) / 0.2) * (1 - ease((k - 0.55) / 0.3));
    setP(P, "upArmR", -1.2 - 0.9 * ease(k / 0.25) + 0.9 * f, 0, -0.2, w); setP(P, "foreArmR", -1.0 + 0.9 * f, 0, 0, w);
    setP(P, "spine", -0.1 + 0.3 * f, 0, 0, w); setP(P, "chest", 0, -0.3 * (1 - f), 0, w);
  } else if (cls === "dance") {
    const sp = ease((k - 0.1) / 0.7);
    v.rootRot[1] += Math.PI * 2 * sp * w;
    setP(P, "upArmL", -1.2, 0, -1.1, w); setP(P, "upArmR", -1.2, 0, 1.1, w);
    setP(P, "foreArmL", -0.3, 0, 0, w); setP(P, "foreArmR", -0.3, 0, 0, w);
    setP(P, "thighR", -0.4 * Math.sin(sp * Math.PI), 0, 0, w); setP(P, "shinR", 0.6 * Math.sin(sp * Math.PI), 0, 0, w);
    v.rootOff[1] += 0.08 * Math.sin(sp * Math.PI) * w;
  } else if (cls === "aim") {
    const a = ease(k / 0.3);
    setP(P, "upArmR", -1.55 * a, 0, -0.1, w); setP(P, "foreArmR", -0.05, 0, 0, w);
    setP(P, "upArmL", -1.2 * a, 0, 0.4, w); setP(P, "foreArmL", -1.8 * a, 0, 0, w);
    setP(P, "chest", 0, 0.45 * a, 0, w);
  } else {
    const c = ease(k / 0.3) * (1 - ease((k - 0.6) / 0.3));
    setP(P, "upArmL", -1.0 * c, 0, -0.5 * c, w); setP(P, "upArmR", -1.0 * c, 0, 0.5 * c, w);
    setP(P, "foreArmL", -2.0 * c, 0, 0, w); setP(P, "foreArmR", -2.0 * c, 0, 0, w);
    setP(P, "spine", -0.2 * c, 0, 0, w); setP(P, "head", -0.2 * c, 0, 0, w);
    v.rootOff[1] += 0.04 * c * w;
  }
}

function wsClass(v) {
  const k = v.weaponKind;
  if (k === "staff") return "staff";
  if (k === "dagger") return "dagger";
  if (k === "polearm") return "polearm";
  if (k === "archery") return "bow";
  if (!k || k === "h2h") return "fist";
  return null;
}

function wsPose(v, P, wk, w, style, cls) {
  const n = style === 2 ? (cls === "dagger" ? 5 : 3) : style === 3 ? 1 : 0;
  if (n === 0) {
    if (style !== 1 || cls === "bow") return false;
    const crouch = ease(wk / 0.18) * (1 - ease((wk - 0.18) / 0.1)), spin = ease((wk - 0.2) / 0.5), wind = ease(wk / 0.2) * (1 - spin);
    v.rootRot[1] += (-0.7 * wind + Math.PI * 2 * spin) * w;
    v.rootOff[1] += -0.12 * crouch * w;
    if (cls === "fist") { setP(P, "thighR", -1.3 * Math.sin(spin * Math.PI), 0, 0, w); setP(P, "shinR", 0.3 * Math.sin(spin * Math.PI), 0, 0, w); setP(P, "upArmL", -1.0, 0, 0.5, w); setP(P, "upArmR", -1.0, 0, -0.5, w); }
    if (cls === "dagger") { setP(P, "upArmR", -1.5, 0, -1.0 * Math.sin(spin * Math.PI), w); setP(P, "foreArmR", -0.3, 0, 0, w); setP(P, "handR", 1.45, 0, 0, w); }
    return true;
  }
  const span = (wk - 0.06) / 0.8;
  if (span < 0 || span > 1) return false;
  const seg = Math.min(n - 1, Math.floor(span * n)), u = Math.min(1, span * n - seg), sd = seg % 2 ? 1 : -1;
  const fast = cls === "dagger" || cls === "fist" ? 1 : 0;
  const kf = fast ? kfMaker(u, 0.35, 0.6, 0.7, 1) : kfMaker(u, 0.45, 0.7, 0.78, 1);
  const lunge = 0.12 * ease((u - 0.4) / 0.2) * (1 - ease((u - 0.75) / 0.25)) + 0.04 * seg;
  if (cls === "staff") {
    const big = n === 1;
    setP(P, "upArmR", kf(-0.5, big ? -2.6 : -2.0, big ? -0.7 : -0.9), 0, 0, w);
    setP(P, "foreArmR", kf(-0.8, -1.1, -0.5), 0, 0, w);
    setP(P, "handR", kf(-1.15, big ? -0.3 : -0.5, big ? -0.2 : -0.1), 0, 0.3, w);
    setP(P, "upArmL", kf(-1.0, big ? -2.5 : -1.8, big ? -0.8 : -1.0), 0, -0.45, w);
    setP(P, "foreArmL", kf(-0.65, -0.9, -0.5), 0, 0, w);
    setP(P, "chest", 0, big ? 0 : sd * kf(0, -0.7, 0.6), 0, w);
    setP(P, "spine", kf(0, big ? -0.3 : -0.15, big ? 0.5 : 0.3), 0, 0, w);
    v.rootOff[2] += lunge * w;
  } else if (cls === "dagger") {
    setP(P, "upArmR", kf(-1.2, -0.9, -1.5), 0, kf(-0.1, 0.2, -0.1), w);
    setP(P, "foreArmR", kf(-0.4, -1.5, -0.1), 0, 0, w);
    setP(P, "handR", 1.45, 0, 0, w);
    setP(P, "upArmL", kf(-0.5, -0.3, -0.7), 0, 0.2, w);
    setP(P, "chest", 0, sd * kf(0, -0.3, 0.35), 0, w);
    setP(P, "spine", kf(0, -0.05, 0.2), 0, 0, w);
    v.rootOff[2] += lunge * w;
  } else if (cls === "polearm") {
    setP(P, "upArmR", kf(-0.9, -0.6, -1.2), 0, 0, w);
    setP(P, "foreArmR", kf(-0.6, -1.4, -0.2), 0, 0, w);
    setP(P, "upArmL", kf(-0.95, -0.7, -1.3), 0, -0.5, w);
    setP(P, "foreArmL", kf(-0.15, -0.9, -0.1), 0, 0, w);
    setP(P, "chest", 0, kf(0, -0.4, 0.5), 0, w);
    v.rootOff[2] += lunge * 1.5 * w;
  } else if (cls === "bow") {
    setP(P, "upArmR", -1.55, 0, -0.15, w);
    setP(P, "foreArmR", -0.05, 0, 0, w);
    setP(P, "upArmL", kf(-0.5, -1.4, -1.0), 0, kf(0.05, 0.45, 0.3), w);
    setP(P, "foreArmL", kf(-1.0, -2.1, -1.2), 0, 0, w);
    setP(P, "chest", 0, 0.45, 0, w);
  } else {
    const L = seg % 2 === 1, arm = L ? "L" : "R", sg = L ? 1 : -1, big = n === 1;
    setP(P, "upArm" + arm, kf(-0.9, big ? -2.0 : -0.6, -1.5), 0, sg * kf(0.25, 0.4, 0.05), w);
    setP(P, "foreArm" + arm, kf(-1.7, big ? -0.6 : -2.1, -0.08), 0, 0, w);
    setP(P, "chest", 0, sg * kf(0, 0.45, -0.5), 0, w);
    setP(P, "hips", 0, sg * kf(0, 0.2, -0.25), 0, w);
    setP(P, "spine", kf(0, big ? -0.3 : 0.05, big ? 0.45 : 0.1), 0, 0, w);
    v.rootOff[2] += lunge * w;
  }
  return true;
}

function kfMaker(ak, a, b, c0, c1) {
  const t1 = ease(ak / a), t2 = ease((ak - a) / (b - a)), t3 = ease((ak - c0) / (c1 - c0));
  return (S0, W0, K0) => { const q = S0 + (W0 - S0) * t1 + (K0 - W0) * t2; return q + (S0 - q) * t3; };
}

function swingKeys(ak, tw, ts, tf) {
  const w = ease(ak / tw), x = (ak - tw) / (ts - tw), st = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (2.2 - 1.2 * x), f = ease((ak - ts) / (tf - ts)), r = ease((ak - tf) / (1 - tf));
  return (S0, W0, K0, F0) => { let q = S0 + (W0 - S0) * w; q += (K0 - W0) * st; q += (F0 - K0) * f; return q + (S0 - q) * r; };
}
const SWING_KEYS = [
  { upArmR: [[-1.2, 0, -0.1], [-2.45, 0, -0.55], [-0.85, 0, 0.75], [-0.55, 0, 1.0]], foreArmR: [[-0.4, 0, 0], [-1.7, 0, 0], [-0.2, 0, 0], [-0.3, 0, 0]], handR: [[1.45, 0, 0], [0.15, 0, 0.2], [1.25, 0, -0.2], [1.55, 0, -0.3]],
    chest: [[0, 0, 0], [-0.05, -0.65, 0.08], [0.12, 0.7, -0.06], [0.18, 0.95, -0.08]], spine: [[0.06, 0, 0], [-0.1, -0.15, 0], [0.24, 0.2, 0], [0.32, 0.28, 0]], hips: [[0, 0, 0], [0, -0.28, 0], [0, 0.32, 0], [0, 0.4, 0]],
    upArmL: [[-0.5, 0, 0.05], [-0.95, 0, 0.35], [-0.35, 0, -0.1], [-0.25, 0, -0.2]], foreArmL: [[-0.6, 0, 0], [-1.1, 0, 0], [-0.4, 0, 0], [-0.3, 0, 0]], neck: [[0, 0, 0], [0, 0.25, 0], [0.05, -0.3, 0], [0.08, -0.4, 0]] },
  { upArmR: [[-1.2, 0, -0.1], [-1.35, 0, 0.95], [-1.45, 0, -0.75], [-1.3, 0, -1.15]], foreArmR: [[-0.4, 0, 0], [-1.45, 0, 0], [-0.15, 0, 0], [-0.25, 0, 0]], handR: [[1.45, 0, 0], [0.7, 0, 0.6], [1.5, 0, -0.1], [1.4, 0, -0.35]],
    chest: [[0, 0, 0], [0, 0.85, 0], [0.04, -0.75, 0], [0.06, -1.0, 0]], spine: [[0.06, 0, 0], [0.04, 0.2, 0], [0.12, -0.2, 0], [0.16, -0.28, 0]], hips: [[0, 0, 0], [0, 0.32, 0], [0, -0.32, 0], [0, -0.42, 0]],
    upArmL: [[-0.5, 0, 0.05], [-0.3, 0, -0.15], [-0.9, 0, 0.45], [-1.0, 0, 0.55]], foreArmL: [[-0.6, 0, 0], [-0.4, 0, 0], [-1.0, 0, 0], [-1.1, 0, 0]], neck: [[0, 0, 0], [0, -0.3, 0], [0, 0.3, 0], [0, 0.4, 0]] },
  { upArmR: [[-1.2, 0, -0.1], [-2.95, 0, -0.15], [-0.85, 0, 0.05], [-0.6, 0, 0.1]], foreArmR: [[-0.4, 0, 0], [-1.95, 0, 0], [-0.08, 0, 0], [-0.15, 0, 0]], handR: [[1.45, 0, 0], [-0.1, 0, 0], [1.3, 0, 0], [1.7, 0, 0]],
    chest: [[0, 0, 0], [-0.18, -0.15, 0], [0.22, 0.05, 0], [0.3, 0.08, 0]], spine: [[0.06, 0, 0], [-0.2, 0, 0], [0.32, 0, 0], [0.4, 0, 0]], hips: [[0, 0, 0], [0, -0.08, 0], [0, 0.1, 0], [0, 0.12, 0]],
    upArmL: [[-0.5, 0, 0.05], [-2.2, 0, -0.1], [-0.6, 0, 0.1], [-0.4, 0, 0.15]], foreArmL: [[-0.6, 0, 0], [-1.6, 0, 0], [-0.3, 0, 0], [-0.25, 0, 0]], neck: [[0, 0, 0], [-0.15, 0, 0], [0.12, 0, 0], [0.15, 0, 0]] }
];
const SWING_TWO = [
  { upArmL: [[-1.0, 0, 0.3], [-2.3, 0, -0.35], [-0.95, 0, 0.85], [-0.7, 0, 1.05]], foreArmL: [[-0.9, 0, 0], [-1.6, 0, 0], [-0.5, 0, 0], [-0.5, 0, 0]] },
  { upArmL: [[-1.0, 0, 0.3], [-1.3, 0, 1.15], [-1.45, 0, -0.45], [-1.35, 0, -0.8]], foreArmL: [[-0.9, 0, 0], [-1.3, 0, 0], [-0.55, 0, 0], [-0.5, 0, 0]] },
  { upArmL: [[-1.0, 0, 0.3], [-2.9, 0, 0.2], [-0.8, 0, 0.35], [-0.55, 0, 0.35]], foreArmL: [[-0.9, 0, 0], [-1.9, 0, 0], [-0.35, 0, 0], [-0.35, 0, 0]] }
];

const BLADE_KEYS = [
  [[-0.45, 0.45, -0.75], [0.3, 0.12, 0.95], [0.8, -0.4, 0.45]],
  [[0.65, 0.5, -0.55], [-0.45, 0.08, 0.9], [-0.92, -0.05, 0.38]],
  [[0, -0.35, -0.95], [0, 0.08, 1], [0, -0.6, 0.8]]
];
const BAQ = { a: null, b: null, c: null, d: null, v: null, x: null };
function bladeAim(v, e, an) {
  const w = v.weapon, h = v.bones.handR;
  if (!w || !h || !v.weaponDrawn || w.parent !== h) return;
  const kind = attackKind(v, e);
  if (kind !== "slash" && kind !== "smash" && kind !== "cleave") return;
  if (!BAQ.a) { BAQ.a = new THREE.Quaternion(); BAQ.b = new THREE.Quaternion(); BAQ.c = new THREE.Quaternion(); BAQ.d = new THREE.Quaternion(); BAQ.v = new THREE.Vector3(); BAQ.x = new THREE.Vector3(); }
  const ak = (S.time - an.aStart) / 0.5;
  if (ak < 0 || ak > 1) {
    const free = !v.wTr && !v.wEase && S.time - an.wsStart > 1.1 && !e.casting && e.alive !== false;
    an.rdyW = (an.rdyW || 0) + ((free ? 0.9 : 0) - (an.rdyW || 0)) * 0.2;
    if (an.rdyW < 0.02) return;
    const R = kind === "cleave" ? [0.1, 0.8, 0.55] : [-0.12, 0.62, 0.78];
    v.group.getWorldQuaternion(BAQ.a);
    const d = BAQ.v.set(R[0], R[1], R[2]).normalize().applyQuaternion(BAQ.a);
    h.updateWorldMatrix(true, false);
    h.getWorldQuaternion(BAQ.b);
    const cur = BAQ.x.set(0, 1, 0).applyQuaternion(w.quaternion).applyQuaternion(BAQ.b).normalize();
    BAQ.c.setFromUnitVectors(cur, d).multiply(BAQ.b);
    BAQ.b.slerp(BAQ.c, an.rdyW);
    h.parent.getWorldQuaternion(BAQ.d);
    h.quaternion.copy(BAQ.d.invert().multiply(BAQ.b));
    return;
  }
  const T = kind === "cleave" ? [0.36, 0.5, 0.64] : [0.3, 0.43, 0.57], k4 = swingKeys(ak, T[0], T[1], T[2]);
  const V = an.aVar === 2 ? 2 : an.aVar === 1 ? 1 : 0, D = BLADE_KEYS[V];
  v.group.getWorldQuaternion(BAQ.a);
  h.updateWorldMatrix(true, false);
  h.getWorldQuaternion(BAQ.b);
  const cur = BAQ.x.set(0, 1, 0).applyQuaternion(w.quaternion).applyQuaternion(BAQ.b).normalize();
  if (an.bSat !== an.aStart) { an.bSat = an.aStart; const q = BAQ.a.clone().invert(), c = cur.clone().applyQuaternion(q); an.bS = [c.x, c.y, c.z]; }
  const B = an.bS, aw = Math.min(1, ak / 0.06, (1 - ak) / 0.06);
  if (aw < 0.01) return;
  const d = BAQ.v.set(k4(B[0], D[0][0], D[1][0], D[2][0]), k4(B[1], D[0][1], D[1][1], D[2][1]), k4(B[2], D[0][2], D[1][2], D[2][2])).normalize();
  d.applyQuaternion(BAQ.a);
  BAQ.c.setFromUnitVectors(cur, d).multiply(BAQ.b);
  BAQ.b.slerp(BAQ.c, aw);
  h.parent.getWorldQuaternion(BAQ.d);
  h.quaternion.copy(BAQ.d.invert().multiply(BAQ.b));
}

function attackKind(v, e) {
  const w = v.weaponKind;
  if (v.style && v.style.claws) return "claw";
  if (w === "greataxe" || w === "scythe" || w === "gkatana" || w === "gsword") return "cleave";
  if (w === "polearm") return "thrust";
  if (w === "dagger") return "stab";
  if (w === "axe") return "chop";
  if (w === "archery") return "shoot";
  if (w === "club") return "smash";
  if (w === "staff") return "staffswing";
  if (!w || w === "h2h") return "punch";
  return "slash";
}

function gaitDynamics(v, e, an, P, amp, run, dt) {
  if (!dt || e.alive === false || e.mounted || e.resting) { an.gAcc = 0; an.gBank = 0; return; }
  const ry = v.group.rotation.y, dr = an.gRy == null ? 0 : normAngA(ry - an.gRy); an.gRy = ry;
  const acc = clamp((an.spd - (an.gSpd == null ? an.spd : an.gSpd)) / Math.max(dt, 0.001), -30, 30); an.gSpd = an.spd;
  const st = an.gst || (an.gst = {});
  const lean = sprAx(st, "acc", clamp(acc * 0.022, -0.22, 0.2), dt, 70, 9);
  const yr = Math.abs(dr) < 1 ? dr / Math.max(dt, 0.001) : 0;
  const bank = sprAx(st, "bank", clamp(an.spd * yr / 9.8 * 0.5, -0.2, 0.2) * Math.min(1, amp * 2), dt, 60, 12);
  an.gAcc = lean; an.gBank = bank;
  addP(P, "spine", lean * 0.6, 0, 0); addP(P, "chest", lean * 0.3, 0, 0); addP(P, "head", -lean * 0.5, 0, 0);
  addP(P, "upArmL", lean * 0.5 * (1 - an.fight), 0, 0); addP(P, "upArmR", lean * 0.5 * (1 - an.fight), 0, 0);
  addP(P, "hips", 0, 0, -bank); addP(P, "spine", 0, 0, -bank * 0.35); addP(P, "head", 0, 0, bank * 0.6);
  addP(P, "hips", 0, -clamp(yr * 0.05, -0.12, 0.12) * Math.min(1, amp * 2), 0); addP(P, "head", 0, clamp(yr * 0.09, -0.25, 0.25) * Math.min(1, amp * 2), 0);
  if (lean < -0.02) v.rootOff[1] += lean * 0.06;
}

function turnInPlace(v, e, an, P, amp, dt) {
  const gy = v.group.rotation.y;
  if (an.tYaw == null) { an.tYaw = gy; an.tD = 0; an.tStep = -1; an.tQuiet = 0; }
  const dy = normAngA(gy - an.tYaw); an.tYaw = gy;
  if (amp > 0.08 || e.alive === false || e.mounted || e.resting || Math.abs(dy) > 1.2) { an.tD = 0; an.tStep = -1; v.tipYaw = 0; return; }
  an.tQuiet = Math.abs(dy) > 0.002 ? 0 : an.tQuiet + dt;
  if (an.tStep < 0) an.tD = clamp(an.tD + dy, -1.1, 1.1); else an.tX = clamp(an.tX + dy, -0.6, 0.6);
  if (an.tStep < 0 && (Math.abs(an.tD) > 0.5 || (Math.abs(an.tD) > 0.12 && an.tQuiet > 0.3))) { an.tStep = 0; an.tFrom = an.tD; an.tX = 0; an.tLead = an.tD > 0 ? "L" : "R"; }
  if (an.tStep >= 0) {
    an.tStep = Math.min(1, an.tStep + dt / (0.22 + Math.abs(an.tFrom) * 0.18));
    const k = an.tStep, sm = k * k * (3 - 2 * k);
    an.tD = an.tFrom * (1 - sm) + an.tX;
    const lead = an.tLead, trail = lead === "L" ? "R" : "L";
    const l1 = Math.sin(Math.PI * clamp(k / 0.6, 0, 1)), l2 = Math.sin(Math.PI * clamp((k - 0.4) / 0.6, 0, 1));
    addP(P, "thigh" + lead, -0.32 * l1, 0, 0); addP(P, "shin" + lead, 0.6 * l1, 0, 0); addP(P, "foot" + lead, -0.25 * l1, 0, 0);
    addP(P, "thigh" + trail, -0.32 * l2, 0, 0); addP(P, "shin" + trail, 0.6 * l2, 0, 0); addP(P, "foot" + trail, -0.25 * l2, 0, 0);
    v.rootOff[1] += 0.012 * Math.sin(Math.PI * k);
    if (k >= 1) { an.tStep = -1; an.tD = an.tX; an.tX = 0; }
  }
  v.tipYaw = an.tD;
}

function poseHuman(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const st = v.style || {};
  const t = S.time + an.t0;
  const run = runOf(v, an.spd), walk = clamp(an.spd / 1.2, 0, 1) * (1 - run);
  const amp = run + walk * 0.45;
  const s1 = Math.sin(an.ph), c1 = Math.cos(an.ph);
  const fightT = (e.engaged || (isMob(e) && e.state === "combat")) && e.alive !== false ? 1 : 0;
  turnInPlace(v, e, an, P, amp, dt);
  gaitDynamics(v, e, an, P, amp, run, dt);
  if (v.mob && e.alive !== false) {
    if ((an.pAmp || 0) > 0.3 && amp < 0.12) an.settle = S.time;
    an.pAmp = amp;
    const sk = (S.time - (an.settle == null ? -9 : an.settle)) / 0.45;
    if (sk >= 0 && sk <= 1) { const sw = Math.sin(Math.PI * sk) * (1 - sk * 0.4); v.rootOff[1] -= 0.032 * sw; addP(P, "spine", 0.13 * sw, 0, 0); addP(P, "chest", 0.05 * sw, 0, 0); addP(P, "head", -0.1 * sw, 0, 0); addP(P, "upArmL", -0.22 * sw, 0, 0.06 * sw); addP(P, "upArmR", -0.22 * sw, 0, -0.06 * sw); addP(P, "thighL", -0.12 * sw, 0, 0); addP(P, "thighR", -0.12 * sw, 0, 0); addP(P, "shinL", 0.24 * sw, 0, 0); addP(P, "shinR", 0.24 * sw, 0, 0); addP(P, "footL", -0.12 * sw, 0, 0); addP(P, "footR", -0.12 * sw, 0, 0); }
  }
  const hu = (v.meta && v.meta.hunch) || 0;
  if (hu && e.alive !== false) { addP(P, "spine", hu * 0.55, 0, 0); addP(P, "chest", hu * 0.45, 0, 0); addP(P, "neck", -hu * 0.45, 0, 0); addP(P, "head", -hu * 0.4, 0, 0); addP(P, "upArmL", hu * 0.3, 0, 0); addP(P, "upArmR", hu * 0.3, 0, 0); v.rootOff[1] -= hu * 0.08; }
  an.fight += (fightT - an.fight) * Math.min(1, dt * 6);
  let sharp = false;

  addP(P, "chest", Math.sin(t * 1.9) * 0.025, 0, 0);
  addP(P, "upArmL", 0, 0, 0.09); addP(P, "upArmR", 0, 0, -0.09);
  addP(P, "foreArmL", -0.12, 0, 0); addP(P, "foreArmR", -0.12, 0, 0);
  addP(P, "head", Math.sin(t * 0.37) * 0.05, Math.sin(t * 0.23) * 0.3 * (1 - amp) * (1 - an.fight), 0);
  const mobIdle = e.kind === "mob" ? (e.state === "idle" && !e.casting && !e.readying ? (MOB_IDLES[e.fam && e.fam.model] || MOB_IDLES.other) : null) : undefined;
  const idleOk = amp < 0.05 && an.fight < 0.1 && !e.casting && !e.resting && !e.mounted && e.alive !== false && mobIdle !== null;
  if (idleOk) {
    if (!an.idleNext) an.idleNext = S.time + (mobIdle ? 1.5 + Math.random() * 4 : 6 + Math.random() * 8);
    if (S.time > an.idleNext && !an.idleAct) { an.idleAct = mobIdle ? mobIdle[Math.floor(Math.random() * mobIdle.length)] : 1 + Math.floor(Math.random() * 6); an.idleStart = S.time; an.idleNext = S.time + (mobIdle ? 4 + Math.random() * 7 : 9 + Math.random() * 10); }
  } else { an.idleAct = 0; an.idleNext = S.time + 5 + Math.random() * 6; }
  if (an.idleAct) {
    const ik = (S.time - an.idleStart) / 2.6;
    if (ik > 1) an.idleAct = 0;
    else {
      const w = env(ik, 0.2, 0.25);
      if (an.idleAct === 1) { addP(P, "head", 0, 0.9 * Math.sin(ik * Math.PI * 2) * w, 0); addP(P, "chest", 0, 0.25 * Math.sin(ik * Math.PI * 2) * w, 0); }
      else if (an.idleAct === 2) { setP(P, "upArmL", -2.6, 0, 0.35, w); setP(P, "upArmR", -2.6, 0, -0.35, w); setP(P, "foreArmL", -0.6, 0, 0, w); setP(P, "foreArmR", -0.6, 0, 0, w); addP(P, "spine", -0.18 * w, 0, 0); addP(P, "head", -0.3 * w, 0, 0); }
      else if (an.idleAct === 3) { addP(P, "hips", 0, 0, 0.08 * w); addP(P, "thighL", 0, 0, 0.1 * w); addP(P, "shinR", 0.25 * w, 0, 0); addP(P, "thighR", -0.1 * w, 0, 0); addP(P, "chest", 0, 0, -0.06 * w); v.rootOff[0] += 0.03 * w; }
      else if (an.idleAct === 5) { setP(P, "upArmL", -1.3, 0, -0.9, w); setP(P, "foreArmL", -2.0 + Math.sin(S.time * 9) * 0.12, 0, 0, w); addP(P, "head", 0.1 * w, -0.5 * w, 0); }
      else if (an.idleAct === 6) { const kk = Math.max(0, Math.sin(ik * Math.PI * 4)); addP(P, "thighR", -0.35 * kk * w, 0, 0); addP(P, "shinR", 0.2 * kk * w, 0, 0); addP(P, "head", 0.3 * w, 0, 0); addP(P, "spine", 0.06 * w, 0, 0); }
      else { setP(P, "upArmR", -2.1, 0, -0.7, w); setP(P, "foreArmR", -1.5 + Math.sin(S.time * 14) * 0.15, 0, 0, w); addP(P, "head", 0.1 * w, 0, -0.12 * w); }
    }
  }
  const em = e.emote;
  if (em && amp < 0.2 && !e.casting && e.alive !== false) {
    const len = emoteLen(em.id), ek = (S.time - em.at) / len;
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
      else if (em.id === "shrug") { const sh = Math.sin(Math.min(1, ek * 1.3) * Math.PI); setP(P, "upArmL", -0.5, 0, 0.7, w); setP(P, "upArmR", -0.5, 0, -0.7, w); setP(P, "foreArmL", -1.1, 0, 0, w); setP(P, "foreArmR", -1.1, 0, 0, w); addP(P, "chest", 0, 0, 0.05 * w); addP(P, "head", 0, 0, -0.18 * sh * w); v.rootOff[1] += 0.03 * sh * w; }
      else if (em.id === "think") { setP(P, "upArmR", -1.0, 0.3, -0.25, w); setP(P, "foreArmR", -2.1, 0, 0, w); setP(P, "upArmL", -0.8, 0, 0.1, w); setP(P, "foreArmL", -1.4, 0, 0, w); addP(P, "head", 0.1 * w, Math.sin(T * 1.6) * 0.3 * w, 0.12 * w); addP(P, "spine", 0.08 * w, 0, 0); }
      else if (em.id === "beckon") { const c = Math.sin(T * 9); setP(P, "upArmR", -1.45, 0, -0.35, w); setP(P, "foreArmR", -0.9 - c * 0.7, 0, 0, w); addP(P, "head", 0, 0, 0.1 * w); addP(P, "chest", 0, -0.15 * w, 0); }
      else if (em.id === "stretch") { const a = env(ek, 0.2, 0.25); setP(P, "upArmL", -3.0, 0, 0.45, a); setP(P, "upArmR", -3.0, 0, -0.45, a); setP(P, "foreArmL", -0.2, 0, 0, a); setP(P, "foreArmR", -0.2, 0, 0, a); addP(P, "spine", -0.3 * a, 0, 0); addP(P, "chest", -0.15 * a, 0, 0); addP(P, "head", -0.35 * a, 0, 0); addP(P, "hips", 0.1 * a, 0, 0); v.rootOff[1] += 0.03 * a; }
      else if (em.id === "kneel") { const a = env(ek, 0.18, 0.25); setP(P, "thighL", -1.5, 0, 0.1, a); setP(P, "shinL", 1.6, 0, 0, a); setP(P, "thighR", -0.1, 0, -0.1, a); setP(P, "shinR", 2.1, 0, 0, a); setP(P, "spine", 0.2, 0, 0, a); setP(P, "head", 0.3, 0, 0, a); setP(P, "upArmL", -0.5, 0, 0.1, a); setP(P, "foreArmL", -0.9, 0, 0, a); setP(P, "upArmR", -0.7, 0, -0.1, a); setP(P, "foreArmR", -0.4, 0, 0, a); v.rootOff[1] -= 0.46 * a; }
      else if (em.id === "flex") { const a = env(ek, 0.15, 0.2), pu = 0.5 + 0.5 * Math.sin(T * 6); setP(P, "upArmL", -0.3, 0, 1.45, a); setP(P, "upArmR", -0.3, 0, -1.45, a); setP(P, "foreArmL", -2.3 - pu * 0.2, 0, 0, a); setP(P, "foreArmR", -2.3 - pu * 0.2, 0, 0, a); addP(P, "chest", -0.1 * a, 0, 0); addP(P, "head", -0.1 * a, 0, 0); addP(P, "thighL", 0, 0, 0.12 * a); addP(P, "thighR", 0, 0, -0.12 * a); }
      else if (em.id === "thumbsup") { setP(P, "upArmR", -1.1, 0, -0.2, w); setP(P, "foreArmR", -1.4, 0, 0, w); addP(P, "head", -0.05 * w, 0, 0.1 * w); }
    }
  }
  if (e === player && amp < 0.2 && !e.casting && e.alive !== false && !e.mounted && !e.resting) {
    const fs = S.fish, gk = e.gatherAt != null ? (S.time - e.gatherAt) / 0.9 : 9, rk = e.reelAt != null ? (S.time - e.reelAt) / 0.8 : 9;
    if (fs || rk < 1) {
      const T = fs ? S.time - (fs.since || S.time) : 0, castK = fs ? clamp(T / 0.7, 0, 1) : 1, bite = fs && fs.state === "bite", w = fs ? 1 : 1 - ease(rk);
      const swing = castK < 1 ? Math.sin(castK * Math.PI) : 0, back = castK < 1 ? (castK < 0.5 ? castK * 2 : 1 - (castK - 0.5) * 2) : 0;
      setP(P, "upArmR", -1.0 - (bite ? 0.8 + Math.sin(S.time * 24) * 0.08 : 0) - back * 1.3, 0, -0.2, w);
      setP(P, "foreArmR", -0.7 + (rk < 1 ? Math.sin(rk * 18) * 0.5 : 0) - swing * 0.4, 0, 0, w);
      setP(P, "upArmL", -0.85 - back * 0.9, 0, 0.15, w);
      setP(P, "foreArmL", -1.0 + (rk < 1 ? Math.sin(rk * 18 + 1.5) * 0.3 : 0), 0, 0, w);
      addP(P, "spine", (0.08 + (bite ? -0.22 : 0) - back * 0.25 + (rk < 1 ? -0.15 * Math.sin(rk * Math.PI) : 0)) * w, 0, 0);
      addP(P, "head", (0.18 - (bite ? 0.1 : 0)) * w, 0, 0);
      addP(P, "hips", 0, 0, Math.sin(S.time * 0.9) * 0.015 * w);
    } else if (e.synth) {
      const sy = e.synth, T = S.time - sy.start, hit = Math.max(0, Math.sin(T * 7)), g = env((S.time - sy.start) / (sy.end - sy.start), 0.08, 0.1);
      setP(P, "upArmL", -0.85 + Math.sin(T * 7 + 1.2) * 0.12, 0, 0.1, g); setP(P, "upArmR", -0.85 - hit * 0.5, 0, -0.1, g);
      setP(P, "foreArmL", -1.2, 0, 0, g); setP(P, "foreArmR", -1.4 + hit * 0.7, 0, 0, g);
      addP(P, "spine", 0.3 * g, 0, 0); addP(P, "chest", 0.1 * g, 0, 0); addP(P, "head", 0.35 * g + Math.sin(T * 0.8) * 0.06 * g, 0, 0);
    } else if (gk >= 0 && gk < 1) {
      const gt = e.gatherType, w = env(gk, 0.1, 0.25);
      if (gt === "harvesting") { const pull = Math.sin(clamp(gk * 1.4, 0, 1) * Math.PI); setP(P, "upArmL", -0.9, 0, 0.1, w); setP(P, "upArmR", -0.9, 0, -0.1, w); setP(P, "foreArmL", -0.5 - pull * 0.8, 0, 0, w); setP(P, "foreArmR", -0.5 - pull * 0.8, 0, 0, w); addP(P, "spine", (0.55 - pull * 0.25) * w, 0, 0); addP(P, "head", 0.3 * w, 0, 0); addP(P, "thighL", -0.4 * w, 0, 0.1 * w); addP(P, "thighR", -0.4 * w, 0, -0.1 * w); addP(P, "shinL", 0.7 * w, 0, 0); addP(P, "shinR", 0.7 * w, 0, 0); v.rootOff[1] -= 0.12 * w; }
      else { const up = gk < 0.4 ? ease(gk / 0.4) : 1 - ease(clamp((gk - 0.4) / 0.2, 0, 1)); setP(P, "upArmR", -0.4 - 2.2 * up, 0, -0.25, w); setP(P, "upArmL", -0.5 - 2.0 * up, 0, 0.25, w); setP(P, "foreArmR", -0.9 - 0.5 * up + (gk >= 0.4 ? 0.6 : 0), 0, 0, w); setP(P, "foreArmL", -0.9 - 0.5 * up + (gk >= 0.4 ? 0.6 : 0), 0, 0, w); addP(P, "spine", (-0.2 * up + (gk >= 0.4 && gk < 0.7 ? 0.45 : 0)) * w, 0, 0); addP(P, "thighL", -0.2 * w, 0, 0); addP(P, "thighR", 0.1 * w, 0, 0); }
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
    const em = e.emote && S.time - e.emote.at < emoteLen(e.emote.id) ? e.emote.id : null;
    const mood = em === "laugh" || em === "cry" ? 0.5 : em === "panic" ? -0.2 : e.casting ? 0.3 : 0;
    const shut = e.alive === false ? 1 : e.resting && an.sit > 0.9 ? 0.55 : em === "panic" ? 0 : Math.max(mood, bl);
    addP(P, "lids", -0.7 * (1 - shut), 0, 0);
  }
  if (e.kind === "npc" && player && e.alive !== false) {
    const d = dist(e, player), work = e.benchSit ? null : (e.tf && e.tf.work) || NPC_WORK[e.id] || VENDOR_WORK[e.id];
    const near = d < 160 && player.target === e ? 1 : d < 130 ? 1 : 0;
    an.look = (an.look || 0) + (near - (an.look || 0)) * Math.min(1, dt * 3);
    if (an.look > 0.01) {
      const ang = normAngA(Math.atan2(player.y - e.y, player.x - e.x) - (e.face || 0));
      addP(P, "chest", 0, -clamp(ang, -1.1, 1.1) * 0.25 * an.look, 0);
    }
    const ww = (1 - an.look) * (amp < 0.1 ? 1 : 0);
    if (work && ww > 0.01) {
      if (work === "hammer") { const HT = typeof HAMMER_TUNE !== "undefined" && HAMMER_TUNE ? HAMMER_TUNE : HAMMER_POSE, c = (t * 1.3) % 1, up = HT.up != null ? HT.up : c < 0.6 ? ease(c / 0.6) : 1 - ease((c - 0.6) / 0.12); if (v.anvilGlow) { const hk = c > 0.7 ? Math.max(0, 1 - (c - 0.7) / 0.2) : 0; v.anvilGlow.color.setRGB(1, 0.45 + 0.45 * hk, 0.12 + 0.6 * hk); } const L = (k) => HT["s" + k] + (HT["r" + k] - HT["s" + k]) * up; setP(P, "upArmR", L("A"), 0, L("Z"), ww); setP(P, "foreArmR", L("F"), 0, 0, ww); setP(P, "handR", L("H"), 0, 0, ww); setP(P, "upArmL", -0.5, 0, 0.2, ww); setP(P, "foreArmL", -1.1, 0, 0, ww); setP(P, "spine", L("S"), 0, 0, ww); setP(P, "head", 0.4, 0, 0, ww); }
      else if (work === "read" || work === "count") { setP(P, "upArmL", -0.7, 0, -0.2, ww); setP(P, "upArmR", -0.7, 0, 0.2, ww); setP(P, "foreArmL", -1.3 + (work === "count" ? Math.max(0, Math.sin(t * 5)) * 0.2 : 0), 0, 0, ww); setP(P, "foreArmR", -1.3 + (work === "count" ? Math.max(0, Math.sin(t * 5 + 1.5)) * 0.25 : Math.sin(t * 0.4) * 0.1), 0, 0, ww); setP(P, "head", 0.45, Math.sin(t * 0.6) * 0.15, 0, ww); }
      else if (work === "work") { setP(P, "upArmL", -0.8 + Math.sin(t * 3) * 0.25, 0, -0.1, ww); setP(P, "upArmR", -0.8 - Math.sin(t * 3) * 0.25, 0, 0.1, ww); setP(P, "foreArmL", -1.0, 0, 0, ww); setP(P, "foreArmR", -1.0, 0, 0, ww); setP(P, "spine", 0.3, 0, 0, ww); setP(P, "head", 0.4, 0, 0, ww); }
      else if (work === "arms") { setP(P, "upArmL", -0.5, 0, -0.45, ww); setP(P, "upArmR", -0.5, 0, 0.45, ww); setP(P, "foreArmL", -1.9, 0.4, 0, ww); setP(P, "foreArmR", -1.9, -0.4, 0, ww); setP(P, "head", 0, Math.sin(t * 0.3) * 0.4, 0, ww); }
      else if (work === "guard") { setP(P, "upArmR", -0.3, 0, -0.05, ww); setP(P, "foreArmR", -0.9, 0, 0, ww); setP(P, "spine", -0.05, 0, 0, ww); setP(P, "head", 0, Math.sin(t * 0.25) * 0.7, 0, ww); }
      else if (work === "look") { const sp = Math.sin(t * 0.2) > 0.3 ? 1 : 0; setP(P, "upArmR", -1.5 * sp, 0, 0.3 * sp, ww); setP(P, "foreArmR", -1.6 * sp, 0, 0, ww); setP(P, "head", -0.1, 0.6 * Math.sin(t * 0.15), 0, ww); }
    }
  }
  if (st.hunch) { addP(P, "spine", 0.22, 0, 0); addP(P, "chest", 0.12, 0, 0); addP(P, "head", -0.3, 0, 0); addP(P, "upArmL", -0.25, 0, 0.1); addP(P, "upArmR", -0.25, 0, -0.1); }
  if (st.prowl && !st.heavy) { addP(P, "upArmL", -0.6, 0, 0.15); addP(P, "upArmR", -0.6, 0, -0.15); addP(P, "foreArmL", -0.3, 0, 0); addP(P, "foreArmR", -0.3, 0, 0); }
  if (st.heavy) { const sw = Math.sin(t * 0.9) * 0.04, rk = 1 - an.fight * 0.5; addP(P, "upArmL", -0.15 * rk, 0, 0.28 + sw); addP(P, "upArmR", -0.15 * rk, 0, -0.28 + sw); addP(P, "foreArmL", -0.2, 0, 0); addP(P, "foreArmR", -0.2, 0, 0); addP(P, "spine", 0, 0, Math.sin(t * 0.7) * 0.03 + s1 * 0.05 * amp); addP(P, "chest", 0, Math.sin(t * 0.55) * 0.04, 0); addP(P, "thighL", 0, 0, 0.12); addP(P, "thighR", 0, 0, -0.12); addP(P, "footL", 0, -0.2, 0); addP(P, "footR", 0, 0.2, 0); }

  const sw = an.fight * (1 - amp);
  if (sw > 0.01) {
    addP(P, "thighL", -0.28 * sw, 0, 0.12 * sw); addP(P, "thighR", 0.05 * sw, 0, -0.12 * sw);
    addP(P, "shinL", 0.45 * sw, 0, 0); addP(P, "shinR", 0.35 * sw, 0, 0);
    addP(P, "footL", -0.17 * sw, 0, 0); addP(P, "footR", -0.35 * sw, 0, 0);
    v.rootOff[1] -= 0.05 * sw;
    addP(P, "spine", 0.1 * sw, -0.15 * sw, 0);
    if (v.weaponKind === "greataxe" || v.weaponKind === "scythe" || v.weaponKind === "gkatana" || v.weaponKind === "gsword") { addP(P, "upArmR", -1.1 * sw, 0, 0.2 * sw); addP(P, "foreArmR", -0.5 * sw, 0, 0); addP(P, "upArmL", -1.1 * sw, 0, -0.3 * sw); addP(P, "foreArmL", -0.6 * sw, 0, 0); }
    else if (v.weaponKind === "h2h" || (!v.weaponKind && v.kind === "human" && !isMob(e))) { addP(P, "upArmR", -0.85 * sw, 0, -0.25 * sw); addP(P, "foreArmR", -1.7 * sw, 0, 0); addP(P, "upArmL", -1.0 * sw, 0, 0.25 * sw); addP(P, "foreArmL", -1.8 * sw, 0, 0); }
    else if (v.weaponKind === "staff") { addP(P, "upArmR", -0.5 * sw, 0, 0.1 * sw); addP(P, "foreArmR", -0.8 * sw, 0, 0); addP(P, "upArmL", -1.0 * sw, 0, -0.4 * sw); addP(P, "foreArmL", -0.65 * sw, 0, 0); addP(P, "handR", -1.15 * sw, 0, 0.3 * sw); addP(P, "spine", 0, 0.12 * sw, 0); }
    else if (v.weaponKind === "polearm") { addP(P, "upArmR", -0.9 * sw, 0, 0); addP(P, "foreArmR", -0.6 * sw, 0, 0); addP(P, "upArmL", -0.95 * sw, 0, -0.5 * sw); addP(P, "foreArmL", -0.15 * sw, 0, 0); }
    else { addP(P, "upArmR", -1.2 * sw, 0, -0.1 * sw); addP(P, "foreArmR", -0.4 * sw, 0, 0); addP(P, "upArmL", -0.5 * sw, 0, 0.05 * sw); addP(P, "foreArmL", -1.0 * sw, 0, 0); }
    if (v.weapon && v.weaponDrawn && !v.wEase) { const wk2 = v.weaponKind; if (wk2 === "staff" || wk2 === "polearm") v.weapon.rotation.z = Math.PI * an.fight; else if (wk2 && wk2 !== "h2h" && wk2 !== "archery") addP(P, "handR", 1.45 * sw, 0, 0); }
  }

  if (amp > 0.01) {
    const race = v.meta && v.meta.race, RG = RACE_GAIT[race] || RACE_GAIT.human;
    const mf = an.mf == null ? 1 : an.mf, ms = an.ms || 0, side = Math.abs(ms) * (1 - Math.max(0, mf)), backK = Math.max(0, -mf);
    const lean = (st.hop ? 0.22 : 0.14) * (1 - backK) - 0.1 * backK + RG.lean;
    const legK = (1 - 0.35 * side - 0.3 * backK) * (RG.leg || 1), kneeK = RG.leg || 1;
    addP(P, "thighL", s1 * 0.78 * amp * legK, 0, s1 * 0.3 * side * amp); addP(P, "thighR", -s1 * 0.78 * amp * legK, 0, s1 * 0.3 * side * amp);
    if (side > 0.05) { addP(P, "hips", 0, ms * 0.55 * side * amp, 0); addP(P, "chest", 0, -ms * 0.45 * side * amp, 0); }
    if (RG.roll) addP(P, "hips", 0, 0, s1 * RG.roll * amp);
    const wk = walk * (1 - run), stK = 1 - 0.6 * side;
    addP(P, "hips", 0, 0, c1 * 0.055 * wk * stK); addP(P, "chest", 0, 0, -c1 * 0.04 * wk * stK); addP(P, "head", 0, 0, -c1 * 0.015 * wk);
    addP(P, "spine", 0, 0, c1 * 0.025 * wk * stK);
    if (RG.arm !== 1) { addP(P, "upArmL", -s1 * 0.3 * (RG.arm - 1) * amp, 0, 0); addP(P, "upArmR", s1 * 0.3 * (RG.arm - 1) * amp, 0, 0); }
    const kn = 1.0 + 0.35 * run;
    addP(P, "shinL", (0.16 + kn * Math.max(0, -c1) + 0.12 * Math.max(0, s1)) * amp * kneeK, 0, 0); addP(P, "shinR", (0.16 + kn * Math.max(0, c1) + 0.12 * Math.max(0, -s1)) * amp * kneeK, 0, 0);
    addP(P, "footL", (-s1 * 0.22 + 0.3 * Math.max(0, -c1) * Math.max(0, s1)) * amp, 0, 0); addP(P, "footR", (s1 * 0.22 + 0.3 * Math.max(0, c1) * Math.max(0, -s1)) * amp, 0, 0);
    const aa = Math.min(1, amp), armSwing = an.fight > 0.5 ? 0.16 * aa : 0.4 * walk * (1 - run) + 0.55 * run;
    addP(P, "upArmL", -s1 * armSwing, 0, 0); addP(P, "upArmR", s1 * armSwing, 0, 0);
    const el = aa * (1 - an.fight * 0.6);
    addP(P, "foreArmL", -0.85 * run * (1 - an.fight * 0.5) - (0.12 + 0.2 * Math.max(0, s1)) * el, 0, 0); addP(P, "foreArmR", -0.85 * run * (1 - an.fight * 0.5) - (0.12 + 0.2 * Math.max(0, -s1)) * el, 0, 0);
    if (run > 0.01 && an.fight < 0.5) { addP(P, "upArmL", 0.2 * run, s1 * 0.12 * run, -0.04 * run); addP(P, "upArmR", 0.2 * run, s1 * 0.12 * run, 0.04 * run); }
    addP(P, "upArmL", 0, 0, 0.05 * amp); addP(P, "upArmR", 0, 0, -0.05 * amp);
    addP(P, "spine", lean * run + 0.05 * Math.abs(c1) * amp, s1 * 0.05 * amp, -s1 * 0.06 * amp);
    addP(P, "chest", -0.03 * Math.abs(c1) * amp, s1 * 0.08 * amp, s1 * 0.03 * amp);
    addP(P, "hips", 0, -s1 * 0.1 * amp, s1 * 0.07 * amp);
    addP(P, "neck", 0.04 * Math.abs(s1) * amp, -s1 * 0.06 * amp, 0);
    addP(P, "head", (0.07 * Math.abs(c1) - 0.04) * amp, -s1 * 0.09 * amp, -s1 * 0.04 * amp);
    const ac = Math.abs(c1), bobK = (st.hop ? 2 : 1) * RG.bob;
    v.rootOff[1] += (ac * 0.035 * walk * (1 - run) + (1 - ac) * 0.05 * run) * bobK - 0.03 * amp - 0.045 * run;
    addP(P, "hips", 0.07 * run, 0, 0);
    addP(P, "head", (ac * 0.03 * walk * (1 - run) - (1 - ac) * 0.04 * run) * bobK, 0, 0);
    const step = Math.floor(an.ph / Math.PI);
    if (step !== an.lastStep) { an.lastStep = step; if (run > 0.4 && e.alive !== false) fxFootstep(e, v); }
  }

  if (v.weapon && !v.weaponDrawn && !v.wTr && !v.wEase && v.wBaseRot) { v.weapon.rotation.x = v.wBaseRot.x + Math.sin(an.ph * 2) * 0.05 * amp; v.weapon.rotation.y = v.wBaseRot.y + Math.cos(an.ph) * 0.04 * amp; }
  { const eng = Math.sin(Math.PI * Math.min(1, Math.max(0, an.fight))); if (eng > 0.01) { addP(P, "spine", 0.1 * eng, 0, 0); addP(P, "thighL", -0.12 * eng, 0, 0); addP(P, "thighR", -0.08 * eng, 0, 0); addP(P, "shinL", 0.15 * eng, 0, 0); addP(P, "shinR", 0.1 * eng, 0, 0); v.rootOff[1] -= 0.025 * eng; } }
  if (v.wTr) {
    const wp = Math.min(1, Math.max(0, (S.time - v.wTr.t0) / v.wTr.dur));
    const r = wp < 0.5 ? ease(wp / 0.5) : 1 - ease((wp - 0.5) / 0.5);
    if (HIP_DRAW[v.weaponKind]) {
      setP(P, "upArmR", -0.35, 0.5, 0.55, r);
      setP(P, "foreArmR", -0.9, 0, 0, r);
      setP(P, "handR", 0, 0, 0, r);
      setP(P, "upArmL", -0.2, 0, 0.3, r);
      setP(P, "chest", 0.05, 0.3, 0, r);
      setP(P, "spine", 0.05, 0, 0, r);
    } else {
    setP(P, "upArmR", -2.55, 0, -0.35, r);
    setP(P, "foreArmR", -1.25, 0, 0, r);
    setP(P, "handR", 0, 0, 0, r);
    setP(P, "upArmL", -0.35, 0, 0.35, r);
    setP(P, "chest", -0.08, 0.15, 0, r);
    setP(P, "spine", -0.12, 0, 0, r);
    }
  }

  const ak0 = (S.time - an.aStart) / 0.5, ak = st.family === "undead" && ak0 >= 0 && ak0 <= 1 ? Math.round(ak0 * 5) / 5 : ak0;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const kind = attackKind(v, e);
    const w = Math.min(1, ak / 0.08, (1 - ak) / 0.3);
    const side = an.aVar ? 1 : -1;
    if (kind === "slash" || kind === "smash" || kind === "cleave") {
      const two = kind === "cleave", hv = kind === "slash" ? 0 : two ? 1 : 0.5;
      const T = two ? [0.36, 0.5, 0.64] : [0.3, 0.43, 0.57], k4 = swingKeys(ak, T[0], T[1], T[2]), sw3 = Math.min(1, ak / 0.05, (1 - ak) / 0.12);
      const V = an.aVar === 2 ? 2 : an.aVar === 1 ? 1 : 0, Y = SWING_KEYS[V];
      for (const bn in Y) setP(P, bn, k4(Y[bn][0][0], Y[bn][1][0], Y[bn][2][0], Y[bn][3][0]), k4(Y[bn][0][1], Y[bn][1][1], Y[bn][2][1], Y[bn][3][1]), k4(Y[bn][0][2], Y[bn][1][2], Y[bn][2][2], Y[bn][3][2]), sw3);
      if (two) { const L = SWING_TWO[V]; for (const bn in L) setP(P, bn, k4(L[bn][0][0], L[bn][1][0], L[bn][2][0], L[bn][3][0]), k4(L[bn][0][1], L[bn][1][1], L[bn][2][1], L[bn][3][1]), k4(L[bn][0][2], L[bn][1][2], L[bn][2][2], L[bn][3][2]), sw3); }
      const lunge = ease((ak - T[0]) / (T[1] - T[0])) * (1 - ease((ak - T[2]) / (1 - T[2]))), back = ease(ak / T[0]) * (1 - ease((ak - T[0]) / (T[1] - T[0])));
      addP(P, "thighL", -(0.34 + 0.12 * hv) * lunge * sw3, 0, 0); addP(P, "shinL", (0.4 + 0.15 * hv) * lunge * sw3, 0, 0);
      addP(P, "thighR", 0.12 * lunge * sw3 - 0.1 * back * sw3, 0, 0); addP(P, "shinR", 0.18 * back * sw3, 0, 0);
      v.rootOff[2] += ((0.15 + 0.06 * hv) * lunge - 0.05 * back) * sw3;
      v.rootOff[1] += (-0.045 * lunge + 0.015 * back * (V === 2 ? 1 : 0)) * sw3;
    } else if (kind === "thrust" && an.aVar !== 1) {
      const a = ease(ak / 0.3), b = ease((ak - 0.3) / 0.18);
      setP(P, "upArmR", -0.4 * a - 1.0 * b, 0, 0, w);
      setP(P, "foreArmR", -1.2 * a + 1.1 * b, 0, 0, w);
      setP(P, "upArmL", -0.95 - 0.5 * b, 0, -0.5, w); setP(P, "foreArmL", -0.15, 0, 0, w);
      setP(P, "chest", 0, -0.35 * a + 0.6 * b, 0, w);
    } else if (kind === "staffswing") {
      const t1 = ease(ak / 0.3), t2 = ease((ak - 0.3) / 0.18), t3 = ease((ak - 0.58) / 0.34), sw2 = Math.min(1, ak / 0.06, (1 - ak) / 0.1);
      const kf = (S0, W0, K0) => { const q = S0 + (W0 - S0) * t1 + (K0 - W0) * t2; return q + (S0 - q) * t3; };
      setP(P, "upArmR", kf(-0.5, -1.9, -1.0), 0, kf(0.1, -0.3, 0.2), sw2);
      setP(P, "foreArmR", kf(-0.8, -1.1, -0.6), 0, 0, sw2);
      setP(P, "handR", kf(-1.15, -0.5, -0.1), 0, 0.3, sw2);
      setP(P, "upArmL", kf(-1.0, -1.7, -1.05), 0, kf(-0.4, -0.5, -0.4), sw2);
      setP(P, "foreArmL", kf(-0.65, -0.9, -0.55), 0, 0, sw2);
      setP(P, "chest", 0, kf(0, -0.75, 0.65), 0, sw2);
      setP(P, "hips", 0, kf(0, -0.25, 0.3), 0, sw2);
      setP(P, "spine", kf(0, -0.15, 0.3), 0, 0, sw2);
      v.rootOff[2] += 0.08 * t2 * (1 - t3) * sw2;
    } else if (kind === "stab") {
      const kf = kfMaker(ak, 0.18, 0.32, 0.5, 0.85), sw3 = Math.min(1, ak / 0.05, (1 - ak) / 0.1), V = an.aVar;
      const kU = V === 1 ? -1.1 : V === 2 ? -1.7 : -1.5, ya = V === 2 ? 0.5 : 0.35;
      setP(P, "upArmR", kf(-1.2, -0.9, kU), 0, kf(-0.1, 0.2, V === 2 ? -0.3 : -0.1), sw3);
      setP(P, "foreArmR", kf(-0.4, -1.5, -0.1), 0, 0, sw3);
      setP(P, "handR", 1.45, 0, 0, sw3);
      setP(P, "upArmL", kf(-0.5, -0.3, -0.7), 0, kf(0.05, 0.3, 0.2), sw3);
      setP(P, "chest", 0, kf(0, -0.3, ya), 0, sw3);
      setP(P, "hips", 0, kf(0, -0.15, 0.2), 0, sw3);
      setP(P, "spine", kf(0, -0.05, 0.2), 0, 0, sw3);
      v.rootOff[2] += 0.14 * ease((ak - 0.18) / 0.14) * (1 - ease((ak - 0.5) / 0.35)) * sw3;
    } else if (kind === "chop") {
      const kf = kfMaker(ak, 0.38, 0.5, 0.62, 0.92), sw3 = Math.min(1, ak / 0.06, (1 - ak) / 0.1), diag = an.aVar === 1;
      setP(P, "upArmR", kf(-1.2, -2.6, -1.1), 0, kf(-0.1, diag ? -0.6 : -0.1, diag ? 0.3 : 0), sw3);
      setP(P, "foreArmR", kf(-0.4, -0.9, -0.3), 0, 0, sw3);
      setP(P, "handR", kf(1.45, 1.3, 1.95), 0, 0, sw3);
      setP(P, "upArmL", kf(-0.5, -0.9, -0.3), 0, kf(0.05, 0.3, 0.1), sw3);
      setP(P, "chest", 0, kf(0, diag ? -0.6 : -0.1, diag ? 0.7 : 0.1), 0, sw3);
      setP(P, "hips", 0, kf(0, diag ? -0.2 : 0, diag ? 0.25 : 0), 0, sw3);
      setP(P, "spine", kf(0, -0.28, 0.38), 0, 0, sw3);
      v.rootOff[2] += 0.1 * ease((ak - 0.38) / 0.12) * (1 - ease((ak - 0.62) / 0.3)) * sw3;
    } else if (kind === "shoot") {
      const kf = kfMaker(ak, 0.4, 0.5, 0.65, 0.95), sw3 = Math.min(1, ak / 0.08, (1 - ak) / 0.1);
      setP(P, "upArmR", kf(-1.2, -1.55, -1.5), 0, kf(-0.1, -0.15, -0.15), sw3);
      setP(P, "foreArmR", kf(-0.4, -0.05, -0.05), 0, 0, sw3);
      setP(P, "upArmL", kf(-0.5, -1.4, -1.0), 0, kf(0.05, 0.45, 0.3), sw3);
      setP(P, "foreArmL", kf(-1.0, -2.1, -1.2), 0, 0, sw3);
      setP(P, "chest", 0, kf(0, 0.45, 0.4), 0, sw3);
      setP(P, "spine", kf(0, 0.04, -0.04), 0, 0, sw3);
    } else if (kind === "thrust" && an.aVar === 1) {
      const kf = kfMaker(ak, 0.34, 0.52, 0.6, 0.92), sw3 = Math.min(1, ak / 0.06, (1 - ak) / 0.1);
      setP(P, "chest", 0, kf(0, -0.9, 0.9), 0, sw3);
      setP(P, "hips", 0, kf(0, -0.3, 0.35), 0, sw3);
      setP(P, "spine", kf(0, 0.1, 0.25), 0, 0, sw3);
      v.rootOff[2] += 0.05 * ease((ak - 0.34) / 0.18) * (1 - ease((ak - 0.6) / 0.3)) * sw3;
    } else if (kind === "punch") {
      const kf = kfMaker(ak, 0.22, 0.36, 0.55, 0.9), sw3 = Math.min(1, ak / 0.05, (1 - ak) / 0.1), V = an.aVar;
      if (V === 2) {
        setP(P, "thighR", kf(0, 0.1, -1.4), 0, kf(0, 0, 0), sw3);
        setP(P, "shinR", kf(0, 0.8, 0.2), 0, 0, sw3);
        setP(P, "spine", kf(0, 0.12, -0.2), 0, 0, sw3);
        setP(P, "chest", 0, kf(0, -0.4, 0.3), 0, sw3);
        setP(P, "upArmL", kf(-1.0, -1.3, -0.6), 0, 0.3, sw3);
        v.rootOff[1] += 0.0;
      } else {
        const L = V === 1, arm = L ? "L" : "R", sg = L ? 1 : -1;
        setP(P, "upArm" + arm, kf(-0.9, -0.6, -1.5), 0, sg * kf(0.25, 0.4, 0.05), sw3);
        setP(P, "foreArm" + arm, kf(-1.7, -2.1, -0.08), 0, 0, sw3);
        setP(P, "chest", 0, sg * kf(0, 0.45, -0.5), 0, sw3);
        setP(P, "hips", 0, sg * kf(0, 0.2, -0.25), 0, sw3);
        v.rootOff[2] += 0.07 * ease((ak - 0.22) / 0.14) * (1 - ease((ak - 0.55) / 0.35)) * sw3;
      }
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
  const wsCls = wsClass(v);
  if (wk >= 0 && wk <= 1 && wsCls && (an.wsStyle === 1 || an.wsStyle === 2 || an.wsStyle === 3) && wsPose(v, P, wk, Math.min(1, wk / 0.06, (1 - wk) / 0.2), an.wsStyle, wsCls)) {
    sharp = true;
  } else if (wk >= 0 && wk <= 1 && (an.wsStyle === 1 || an.wsStyle === 2 || an.wsStyle === 3)) {
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
    an.cSchool = school;
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
  if (rk >= 0 && rk <= 1 && !e.casting && !(S.time - (an.intrStart || -9) < 0.5)) {
    const w = env(rk, 0.15, 0.6), sc = an.cSchool || "elemental", pk = ease(rk / 0.4);
    if (sc === "heal" || sc === "buff") {
      setP(P, "upArmL", -1.3, 0, -0.95 * pk, w); setP(P, "upArmR", -1.3, 0, 0.95 * pk, w);
      setP(P, "foreArmL", -0.1, 0, 0, w); setP(P, "foreArmR", -0.1, 0, 0, w);
      setP(P, "head", -0.25, 0, 0, w); setP(P, "spine", -0.12, 0, 0, w);
    } else if (sc === "summon") {
      setP(P, "upArmL", -2.9 + 2.6 * pk, 0, 0.4, w); setP(P, "upArmR", -2.9 + 2.6 * pk, 0, -0.4, w);
      setP(P, "foreArmL", -0.1, 0, 0, w); setP(P, "foreArmR", -0.1, 0, 0, w);
      setP(P, "spine", 0.1 + 0.3 * pk, 0, 0, w); v.rootOff[1] += -0.08 * pk * w;
    } else if (sc === "dark") {
      setP(P, "upArmL", -0.8, 0, -0.2, w); setP(P, "upArmR", -0.8, 0, 0.2, w);
      setP(P, "foreArmL", -1.9, 0, 0, w); setP(P, "foreArmR", -1.9, 0, 0, w);
      setP(P, "spine", 0.35 - 0.5 * pk, 0, 0, w); setP(P, "head", 0.2 - 0.4 * pk, 0, 0, w);
    } else if (sc === "song") {
      setP(P, "upArmR", -1.0 - 0.9 * pk, 0, -0.3, w); setP(P, "foreArmR", -1.9 + 1.8 * pk, 0, 0, w);
      setP(P, "upArmL", -0.5, 0, 0.8 * pk, w); setP(P, "chest", 0, 0.3 * pk, 0, w);
    } else {
      setP(P, "upArmL", -1.9 + 0.5 * pk, 0, 0.1, w); setP(P, "upArmR", -1.9 + 0.5 * pk, 0, -0.1, w);
      setP(P, "foreArmL", -0.05, 0, 0, w); setP(P, "foreArmR", -0.05, 0, 0, w);
      setP(P, "spine", -0.12 + 0.3 * pk, 0, 0, w); setP(P, "head", -0.15 + 0.25 * pk, 0, 0, w);
      v.rootOff[2] += 0.05 * pk * w;
    }
  }

  const ik = (S.time - (an.intrStart || -9)) / 0.5;
  if (ik >= 0 && ik <= 1 && !e.casting) {
    const w = env(ik, 0.12, 0.65), sh = Math.sin(ik * 30) * 0.06 * (1 - ik);
    setP(P, "spine", -0.4, 0, 0, w); setP(P, "head", -0.35, sh * 3, 0, w);
    setP(P, "upArmL", -0.3 + sh, 0, 0.5, w); setP(P, "upArmR", -0.3 - sh, 0, -0.5, w);
    setP(P, "foreArmL", -0.5, 0, 0, w); setP(P, "foreArmR", -0.5, 0, 0, w);
    v.rootOff[2] -= 0.05 * w;
  }

  const jd = an.jaId ? jaDuration(an.jaId) : 1;
  const jk = (S.time - (an.jaStart || -9)) / jd;
  if (jk >= 0 && jk <= 1 && !e.casting) {
    jaPose(v, P, an, jk, env(jk, 0.12, 0.7), jaClass(an.jaId));
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
  if (an.sit > 0.01 && e.benchSit) {
    const k = an.sit, H = (v.meta && v.meta.hipsY) || 0.9;
    for (const s of ["L", "R"]) { const sg = s === "L" ? 1 : -1; setP(P, "thigh" + s, -1.5, 0, sg * 0.08, k); setP(P, "shin" + s, 1.45, 0, 0, k); setP(P, "foot" + s, 0.05, 0, 0, k); setP(P, "upArm" + s, -0.35, 0, sg * 0.12, k); setP(P, "foreArm" + s, -0.9, 0, 0, k); }
    setP(P, "spine", 0.05 + Math.sin(t * 1.1) * 0.02, 0, 0, k); setP(P, "head", Math.sin(t * 0.3) * 0.1, Math.sin(t * 0.2) * 0.3, 0, k);
    v.rootOff[1] -= Math.max(0, H - 0.5) * k; v.rootOff[2] -= 0.12 * k;
  } else if (an.sit > 0.01) {
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
    if (P.tail3) {
      const sw = Math.sin(t * 1.5 + 0.4) * (0.1 + run * 0.05), sw2 = Math.sin(t * 1.5 - 0.5) * (0.13 + run * 0.06);
      addP(P, "tail", 0, sw, 0); addP(P, "tail2", 0, sw2, 0); addP(P, "tail3", -0.15, wag * 0.5 + Math.sin(t * 1.5 - 1.1) * 0.18, 0);
    }
  }
  if (isMob(e)) mobAlert(v, e, an, P);
  if (an.dead != null) {
    const T = S.time - an.dead, sd = an.deadVar || 1, sg = ease(T / 0.25), kn = ease((T - 0.15) / 0.4), k = ease((T - 0.5) / 0.7), kall = ease(T / 0.5);
    for (const n in P) { const p = P[n]; p[0] *= 1 - kall; p[1] *= 1 - kall; p[2] *= 1 - kall; }
    const rec = sg * (1 - k);
    addP(P, "spine", -0.2 * rec * (sd === 2 ? -1 : 1) + 0.35 * kn * (1 - k), 0, 0); addP(P, "chest", 0.15 * kn * (1 - k), 0, 0);
    addP(P, "thighL", -1.3 * kn * (1 - k) - 0.2 * k, 0, 0.15 * k); addP(P, "thighR", -0.1 * kn * (1 - k), 0, -0.1 * k);
    addP(P, "shinL", 1.5 * kn * (1 - k), 0, 0); addP(P, "shinR", 2.0 * kn * (1 - k), 0, 0);
    addP(P, "upArmL", -0.6 * kn * (1 - k), 0, 1.1 * k); addP(P, "upArmR", -0.6 * kn * (1 - k), 0, -1.1 * k);
    addP(P, "foreArmL", -0.8 * rec, 0, 0); addP(P, "foreArmR", -0.8 * rec, 0, 0);
    addP(P, "head", (sd === 2 ? 0.3 : -0.25) * k + 0.25 * kn * (1 - k), 0.5 * k * (sd === 2 ? 0 : sd), 0);
    an.deadRot = sd === 2 ? [1.5, 0] : sd === -1 ? [-1.5, -0.35] : [-1.5, 0.15];
    v.rootRot[0] = an.deadRot[0] * k; v.rootRot[2] = an.deadRot[1] * k;
    v.rootOff[0] = 0; v.rootOff[1] = 0.14 * k - 0.45 * kn * (1 - k); v.rootOff[2] = (-0.12 * sg * (1 - kn)) * (sd === 2 ? -1 : 1);
    sharp = false;
  } else if (an.rise != null && S.time - an.rise < 1.5) {
    const rk = (S.time - an.rise) / 1.5, up = ease(rk), kneel = Math.sin(Math.PI * Math.min(1, rk * 1.2)), dr = an.deadRot || [-1.5, 0.15], push = Math.sin(Math.PI * clamp(rk / 0.4, 0, 1));
    setP(P, "thighL", -1.1 * kneel, 0, 0.1, 1); setP(P, "shinL", 1.6 * kneel, 0, 0, 1);
    setP(P, "thighR", -0.3 * kneel, 0, -0.1, 1); setP(P, "shinR", 1.9 * kneel, 0, 0, 1);
    setP(P, "spine", 0.4 * kneel, 0, 0, 1); setP(P, "head", 0.3 * kneel, 0, 0, 1);
    setP(P, "upArmL", -0.4 * kneel + 0.6 * push, 0, 0.3 + 0.5 * push, 1); setP(P, "upArmR", 0.2 * kneel + 0.6 * push, 0, -0.3 - 0.5 * push, 1);
    const lie = 1 - ease(rk / 0.35);
    v.rootRot[0] = dr[0] * lie; v.rootRot[2] = dr[1] * lie;
    v.rootOff[1] = -0.45 * kneel + 0.14 * lie * (1 - kneel);
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
  bladeAim(v, e, an);
  let w = clamp((an.spd - 0.15) / 0.45, 0, 1);
  if (an.stepping) w = 1;
  if (e.mounted || e.resting || e.alive === false || (an.sit || 0) > 0.05 || (typeof jumpPhase === "function" && jumpPhase(e)) || S.time - an.wsStart < 0.9) w = 0;
  an.ikW = (an.ikW || 0) + (w - (an.ikW || 0)) * Math.min(1, dt * 8);
  clothSprings(v, e, an, dt, t);
  bodyJiggle(v, an, dt);
  if (v.bones.mouth) {
    const em = e.emote && S.time - e.emote.at < emoteLen(e.emote.id) ? e.emote.id : null;
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
  if (an.ikW > 0.01) humanLegIK(v, an, an.ikW, runOf(v, an.spd));
}

const IKQ = { h: null, inv: null, q: null, x: null, v: null };
function sprAx(st, k, target, dt, kS, kD) {
  const o = st[k] || (st[k] = { x: target, v: 0 });
  const n = Math.max(1, Math.ceil(dt / 0.012)), h = dt / n;
  for (let i = 0; i < n; i++) { const acc = kS * (target - o.x) - kD * o.v; o.v += acc * h; o.x += o.v * h; }
  if (!isFinite(o.x)) { o.x = target; o.v = 0; }
  return o.x;
}
const JIG = { p: null, q: null, a: null };
function bodyJiggle(v, an, dt) {
  const m = v.meta && v.meta.jig, B = v.bones;
  if (!m || !dt) return;
  const off = typeof VIEW !== "undefined" && VIEW.settings && VIEW.settings.noJiggle;
  if (!JIG.p) { JIG.p = new THREE.Vector3(); JIG.q = new THREE.Quaternion(); JIG.a = new THREE.Vector3(); }
  const st = an.jig || (an.jig = {}), h = Math.min(dt, 0.05);
  for (const [g, pn, amp, lim, k, c] of [["b", "chest", m.bust, 0.011, 170, 5.2], ["g", "hips", m.glute, 0.008, 210, 6.4]]) {
    const L = B[g === "b" ? "bustL" : "gluteL"], R = B[g === "b" ? "bustR" : "gluteR"], P = B[pn];
    if (!L || !R || !P) continue;
    if (off || !amp) { L.position.copy(L.userData.rest); R.position.copy(R.userData.rest); continue; }
    P.updateWorldMatrix(true, false);
    JIG.p.setFromMatrixPosition(P.matrixWorld);
    const s0 = st[g] || (st[g] = { p: JIG.p.clone(), v: new THREE.Vector3() });
    const vx = (JIG.p.x - s0.p.x) / h, vy = (JIG.p.y - s0.p.y) / h, vz = (JIG.p.z - s0.p.z) / h;
    JIG.a.set((vx - s0.v.x) / h, (vy - s0.v.y) / h, (vz - s0.v.z) / h);
    s0.v.set(vx, vy, vz); s0.p.copy(JIG.p);
    if (JIG.a.lengthSq() > 3600) JIG.a.setLength(60);
    P.getWorldQuaternion(JIG.q).invert(); JIG.a.applyQuaternion(JIG.q);
    const sc = (v.scale || 1) * (v.group ? v.group.scale.x : 1) || 1, gain = 0.55 * amp / sc;
    const ax = ["x", "y", "z"], lm = [lim * 0.35 * amp, lim * amp, lim * 0.6 * amp], o = [];
    for (let i = 0; i < 3; i++) {
      const key = g + ax[i], ob = st[key] || (st[key] = { x: 0, v: 0 });
      ob.v -= JIG.a[ax[i]] * gain * h;
      o.push(clamp(sprAx(st, key, 0, dt, k, c), -lm[i], lm[i]));
      if (Math.abs(ob.x) > lm[i] * 1.5) { ob.x = Math.sign(ob.x) * lm[i] * 1.5; ob.v *= 0.5; }
    }
    L.position.set(L.userData.rest.x + o[0], L.userData.rest.y + o[1], L.userData.rest.z + o[2]);
    R.position.set(R.userData.rest.x + o[0], R.userData.rest.y + o[1], R.userData.rest.z + o[2] * (g === "g" ? 1 : 1));
  }
}
function clothSprings(v, e, an, dt, t) {
  const B = v.bones;
  if (!B.cape && !B.hairTail && !B.tabF && !B.robeF) return;
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
  if (B.robeF) { const hd = v.mob && v.meta && v.meta.hunch ? v.meta.hunch * 0.6 : 0; B.robeF.rotation.set(sprAx(st, "rf", -thF * 0.55 - 0.12 * run - acc * 0.3 - hd, dt, 60, 8), 0, sprAx(st, "rfz", -turn * 0.25, dt, 45, 6)); }
  if (B.robeB) B.robeB.rotation.set(sprAx(st, "rb", thB * 0.55 + 0.22 * run + bob * 0.8, dt, 55, 7), 0, sprAx(st, "rbz", -turn * 0.25, dt, 45, 6));
}

function humanLegIK(v, an, w, run) {
  const B = v.bones;
  if (!B.thighL || !B.shinL || !B.footL || !B.root || !B.hips) return;
  if (!IKQ.h) { IKQ.h = new THREE.Quaternion(); IKQ.inv = new THREE.Quaternion(); IKQ.q = new THREE.Quaternion(); IKQ.x = new THREE.Quaternion(); IKQ.v = new THREE.Vector3(); }
  const Lt = B.shinL.position.length(), Ls = B.footL.position.length(), L = Lt + Ls;
  const sc = v.scale || 1, S = strideEff(v, an.spd, true), rl = legRel(v);
  const beta = 0.62 - 0.28 * run - 0.14 * run * (1 - rl), D = beta * S / sc, lift = (0.06 + 0.17 * run) * (0.45 + 0.55 * rl) / sc, fl = 0.1 * (0.5 + 0.5 * rl) / sc, wk = 1 - run;
  const rest = B.root.userData.rest;
  const restHip = B.hips.position.y - (B.root.position.y - rest.y) + B.thighL.position.y, ank0 = restHip - L;
  IKQ.h.setFromEuler(B.hips.rotation); IKQ.inv.copy(IKQ.h).invert();
  for (const [sd, off] of [["L", 0], ["R", Math.PI]]) {
    let q = an.ph + off; q = Math.atan2(Math.sin(q), Math.cos(q));
    const bp = beta * Math.PI;
    let z, y = 0, toe = 0;
    const zf = D * 0.42, zb = zf - D;
    const off0 = 0.5 + 0.2 * run;
    if (Math.abs(q) <= bp) { const st = (q + bp) / (2 * bp); z = zf - D * st; const hs = (0.3 * wk + 0.06) * (1 - smoothRange(0, 0.2, st)), ho = off0 * smoothRange(0.62 - 0.12 * run, 1, st); toe = -hs + ho; y = fl * Math.sin(ho); }
    else { let u = (q - bp) / (2 * Math.PI - 2 * bp); if (u < 0) u += Math.PI / (Math.PI - bp); u = clamp(u, 0, 1); const e = u * u * (3 - 2 * u); z = zb + D * e; const rel = 1 - smoothRange(0, 0.35, u); y = Math.max(lift * Math.sin(Math.PI * u), fl * Math.sin(off0) * rel); toe = off0 * rel - 0.22 * Math.sin(Math.PI * u) * (1 - rel) - (0.3 * wk + 0.06) * smoothRange(0.65, 1, u); }
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
  if (e.readying) { addP(P, "body", -0.5, 0, 0); setZ(P, "wingL", 1.1 + f * 0.3); setZ(P, "wingR", -1.1 - f * 0.3); v.rootOff[1] += 0.25; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.4 * w, 0, 0.3 * w); v.rootOff[1] += 0.15 * w; }
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.55);
    if (P.wingL) P.wingL[2] = -0.6 * k + P.wingL[2] * (1 - k);
    if (P.wingR) P.wingR[2] = 0.6 * k + P.wingR[2] * (1 - k);
    setZ(P, "wing2L", -1.2 * k); setZ(P, "wing2R", 1.2 * k);
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
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.25, 0.5); addP(P, "body", 0.7 * w, 0, 0); addP(P, "tail", 0.9 * w, 0, 0); v.rootOff[2] += 0.35 * w; v.rootOff[1] -= 0.2 * w; }
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
  const mv = clamp(an.spd / 1.2, 0, 1), ml = clamp(an.spd / 0.3, 0, 1);
  const A = 0.3 + 0.35 * mv, sc = v.scale || 1;
  an.cph = (an.cph || 0) + Math.min(an.spd / (0.58 * A * 0.18 * sc), 3.2) * Math.PI * 2 * dt;
  const cyc = an.cph + t * 0.5 * (1 - ml);
  const pit = i => i < 0 ? 0 : Math.sin(cyc + (5 - i) * 0.95) * 0.06 * mv + Math.sin(t * 1.5 - i) * 0.02;
  for (let i = 0; i < 6; i++) {
    const ph = cyc + (5 - i) * 0.95;
    addP(P, "t" + i, pit(i) - pit(i - 1), Math.sin(t * 2.5 - i * 0.7) * (0.04 + 0.05 * mv), 0);
    let u = (ph / (Math.PI * 2)) % 1; if (u < 0) u += 1;
    const st = 0.62;
    const sx = u < st ? -A + 2 * A * (u / st) : A - 2 * A * ease((u - st) / (1 - st)), up = u < st ? 0 : Math.sin(Math.PI * (u - st) / (1 - st)) * (0.45 + 0.4 * mv);
    const idle = (1 - ml) * 0.7;
    addP(P, "lL" + i, sx * (1 - idle), 0, up * (1 - idle)); addP(P, "lR" + i, sx * (1 - idle), 0, -up * (1 - idle));
  }
  v.rootOff[1] = Math.max(0, Math.sin(cyc * 0.5)) * 0.015 * mv;
  addP(P, "head", Math.sin(t * 1.3) * 0.08, Math.sin(t * 0.7) * 0.3 * (1 - mv), 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.6;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const lift = ease(ak / 0.35) * (1 - 0.5 * ease((ak - 0.35) / 0.25)), strike = ak > 0.35 ? env((ak - 0.35) / 0.65, 0.2, 0.7) : 0;
    addP(P, "t3", -0.45 * lift + 0.3 * strike, 0, 0); addP(P, "t4", -0.4 * lift + 0.35 * strike, 0, 0); addP(P, "t5", -0.3 * lift + 0.3 * strike, 0, 0); addP(P, "head", -0.3 * lift + 0.5 * strike, 0, 0); v.rootOff[2] += 0.3 * strike * (1 - ease((ak - 0.7) / 0.3));
  }
  if (e.readying) { const sh = Math.sin(t * 28) * 0.06; addP(P, "t3", -0.5, sh, 0); addP(P, "t4", -0.45, -sh, 0); addP(P, "t5", -0.3, sh, 0); addP(P, "head", -0.2, 0, 0); }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "t4", -0.15 * w, 0, 0); addP(P, "t5", -0.1 * w, 0, 0); addP(P, "head", 0.3 * w, 0, 0); v.rootOff[2] -= 0.1 * w; }
  mobAlert(v, e, an, P);
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
  const G = quadGait(v, an, dt);
  addP(P, "body", Math.sin(t * 1.6) * 0.02 + G.pitch, G.roll * 0.5, G.roll);
  if (q.sprawl) { const yw = Math.sin(an.ph) * 0.05 * G.mv; addP(P, "body", 0, yw, 0); addP(P, "neck", 0, -yw * 1.6, 0); addP(P, "head", 0, -yw * 0.5, 0); addP(P, "tail", 0, -yw * 1.4, 0); addP(P, "tail2", 0, -yw * 1.2, 0); }
  v.rootOff[1] = G.bob - (q.sprawl ? 0 : (q.leg || 0.5) * 0.06) * (an.qikW == null ? 1 : an.qikW);
  const graze = (1 - mv) * (Math.sin(t * 0.35) > 0.6 ? 1 : 0);
  addP(P, "neck", graze * 0.9 + Math.sin(t * 1.1) * 0.04, Math.sin(t * 0.5) * 0.25 * (1 - mv), 0);
  addP(P, "head", graze * 0.5 + Math.sin(t * 2.3) * 0.03, Math.sin(t * 0.7) * 0.2 * (1 - mv), 0);
  const wag = Math.sin(t * (2 + mv * 4)) * 0.35;
  addP(P, "tail", 0, wag, 0); addP(P, "tail2", 0, wag * 1.3, 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const cr = ak < 0.3 ? ease(ak / 0.3) : 0, lp = ak >= 0.3 && ak < 0.75 ? Math.sin((ak - 0.3) / 0.45 * Math.PI) : 0, bite = ak > 0.45 && ak < 0.8 ? env((ak - 0.45) / 0.35, 0.3, 0.5) : 0;
    const tl = q.sprawl ? 0.55 : 1, pk = 0.12 * cr - 0.3 * lp;
    addP(P, "body", pk * tl, 0, 0); addP(P, "neck", 0.25 * cr - 0.5 * lp, 0, 0); addP(P, "head", 0.8 * bite, 0, 0);
    addP(P, "tail", -pk * tl * 0.9, 0, 0); addP(P, "tail2", -pk * tl * 0.5, 0, 0);
    addP(P, "legFL", 0.3 * cr - 0.5 * lp, 0, 0); addP(P, "legFR", 0.3 * cr - 0.5 * lp, 0, 0);
    v.rootOff[1] += (q.sprawl ? 0.02 * cr : -0.08 * cr) + 0.3 * lp * tl + (q.sprawl ? 0.06 * lp : 0); v.rootOff[2] += 0.45 * tl * (ak > 0.3 ? Math.min(1, (ak - 0.3) / 0.35) * (1 - ease((ak - 0.7) / 0.3)) : 0);
  }
  mobAlert(v, e, an, P);
  if (e.readying) { addP(P, "neck", -0.4, 0, 0); addP(P, "head", -0.3, Math.sin(t * 20) * 0.08, 0); addP(P, "legFL", -0.5, 0, 0); addP(P, "legFR", -0.5, 0, 0); if (q.sprawl) { addP(P, "body", -0.12, 0, 0); addP(P, "tail", 0.12, 0, 0); } v.rootOff[1] += 0.06; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8), tl = q.sprawl ? 0.5 : 1; addP(P, "body", -0.15 * w * tl, 0, 0.2 * w * tl); addP(P, "tail", 0.12 * w * tl, 0, -0.1 * w * tl); addP(P, "head", -0.3 * w, 0, 0); if (q.sprawl) v.rootOff[1] += 0.03 * w; }
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = (q.sprawl ? 0.9 : 1.5) * k; v.rootOff[1] = (q.sprawl ? 0.04 : 0.12) * k; for (const n of ["legFL", "legFR", "legBL", "legBR"]) addP(P, n, 0, 0, 0.6 * k); }
  applyPose(v, dt, sharp);
  an.qikW = (an.qikW == null ? 1 : an.qikW) + ((an.dead != null ? 0 : 1) - (an.qikW == null ? 1 : an.qikW)) * Math.min(1, dt * 8);
  an.qikF = (an.qikF == null ? 1 : an.qikF) + ((e.readying ? 0 : 1) - (an.qikF == null ? 1 : an.qikF)) * Math.min(1, dt * 8);
  if (an.qikW > 0.01) quadLegIK(v, an, G, an.qikW, an.qikF);
}

const QUAD_GAITS = {
  walk: { duty: 0.66, off: { BL: 0, FL: 0.25, FR: 0.75, BR: 0.5 } },
  sprawl: { duty: 0.7, off: { BL: 0, FL: 0.45, FR: 0.95, BR: 0.5 } },
  trot: { duty: 0.45, off: { BL: 0, FL: 0.5, FR: 0, BR: 0.5 } },
  gallop: { duty: 0.35, off: { BL: 0.13, FL: 0.37, FR: 0.63, BR: 0.87 } }
};
function quadGait(v, an, dt) {
  const q = v.meta.quad || {}, sc = v.scale || 1, L = (q.leg || 0.5) * sc;
  const Fr = an.spd * an.spd / (9.81 * Math.max(0.05, L));
  const want = q.sprawl ? (Fr < 6 ? "sprawl" : "trot") : Fr < 0.45 ? "walk" : Fr < 2.4 ? "trot" : "gallop";
  if (!an.gait) an.gait = { duty: QUAD_GAITS[want].duty, off: Object.assign({}, QUAD_GAITS[want].off) };
  const T = QUAD_GAITS[want], k = Math.min(1, dt / 0.3);
  an.gait.duty += (T.duty - an.gait.duty) * k;
  for (const n in T.off) { let d = T.off[n] - an.gait.off[n]; d -= Math.round(d); an.gait.off[n] = (an.gait.off[n] + d * k + 1) % 1; }
  an.gaitName = want;
  const mv = clamp(an.spd / 0.6, 0, 1), ph = an.ph / (Math.PI * 2);
  const gal = want === "gallop" ? 1 : 0, tr = want === "trot" ? 1 : 0;
  return { mv, ph, duty: an.gait.duty, off: an.gait.off, L,
    bob: mv * (0.01 + 0.015 * tr + 0.03 * gal) * Math.abs(Math.sin(an.ph * 2)) / sc,
    pitch: mv * gal * 0.03 * Math.sin(an.ph * 2),
    roll: q.sprawl ? mv * 0.035 * Math.sin(an.ph * 2) : mv * 0.012 * Math.sin(an.ph * 2) };
}
function quadLegIK(v, an, G, w, wF) {
  const B = v.bones, q = v.meta.quad || {}, sc = v.scale || 1;
  const strideLocal = strideEff(v, an.spd, true) / sc;
  for (const [n, fore] of [["FL", 1], ["FR", 1], ["BL", 0], ["BR", 0]]) {
    const th = B["leg" + n], sh = B["shin" + n];
    if (!th || !sh) continue;
    const ww = w * (fore ? wF : 1);
    if (ww < 0.01) continue;
    const Lt = q.Lt || sh.position.length(), Ls = q.Ls || (q.leg || 0.5) * 0.5;
    const reach = (Lt + Ls) * 0.995, dRest = q.hipY != null ? q.hipY + v.rootOff[1] - 0.004 : (Lt + Ls) * 0.9;
    let p = (G.ph + G.off[n]) % 1; if (p < 0) p += 1;
    const duty = G.duty, D = strideLocal * duty * G.mv;
    let z, y = 0;
    if (p < duty) z = D / 2 - D * (p / duty);
    else { const u = (p - duty) / (1 - duty), e = u * u * (3 - 2 * u); z = -D / 2 + D * e; y = Math.sin(Math.PI * u) * (q.digi ? Math.min(0.2 * (Lt + Ls), 0.02 + D * 0.22) : Math.min(0.35 * (Lt + Ls), 0.04 + D * 0.3)) * G.mv; }
    const depth = Math.max(Math.abs(Lt - Ls) + 0.01, dRest - y);
    const r = clamp(Math.hypot(z, depth), Math.abs(Lt - Ls) + 1e-3, reach);
    const a = Math.atan2(z, depth);
    const b = Math.acos(clamp((Lt * Lt + r * r - Ls * Ls) / (2 * Lt * r), -1, 1));
    const c = Math.acos(clamp((Lt * Lt + Ls * Ls - r * r) / (2 * Lt * Ls), -1, 1));
    const thA = fore ? a + b : a - b, shR = fore ? Math.PI - c : -(Math.PI - c);
    th.rotation.x += (-thA - th.rotation.x) * ww;
    sh.rotation.x += (shR - sh.rotation.x) * ww;
  }
}

function poseCrab(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.2, 0, 1), ml = clamp(an.spd / 0.4, 0, 1);
  const A = 0.3 + 0.2 * mv, yaw = 0.55 * mv, reach = 0.33 * (v.scale || 1);
  an.cph = (an.cph || 0) + Math.min(an.spd * Math.PI / (A * reach * Math.cos(yaw)), 30) * dt;
  for (const s of [1, -1]) for (let k = 0; k < 4; k++) {
    const sd = s > 0 ? "L" : "R", p = an.cph + (k % 2 ? Math.PI : 0) + (s > 0 ? 0 : Math.PI) + k * 0.25;
    const sw = Math.sin(p) * A * ml, lift = Math.max(0, Math.cos(p)) * ml;
    addP(P, "leg" + sd + k, 0, -s * sw, s * lift * 0.45);
    addP(P, "knee" + sd + k, 0, 0, s * lift * 0.7);
  }
  addP(P, "body", Math.sin(t * 2.1) * 0.02, yaw, Math.sin(an.cph) * 0.04 * ml);
  const snip = Math.sin(t * 2.7) > 0.7 ? Math.sin(t * 24) * 0.25 : 0;
  addP(P, "armL", 0, 0.15 + snip * 0.2, 0.1); addP(P, "armR", 0, -0.15 - snip * 0.2, -0.1);
  addP(P, "clawL", 0, snip, 0); addP(P, "clawR", 0, -snip, 0);
  v.rootOff[1] = Math.abs(Math.sin(an.cph)) * 0.02 * ml;
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.3, 0.6); const side = an.aVar ? 1 : -1; addP(P, side > 0 ? "armL" : "armR", -0.7 * w, side * 0.8 * w, 0); addP(P, side > 0 ? "clawL" : "clawR", 0, side * 1.0 * w, 0); addP(P, "body", 0, side * 0.3 * w, 0); v.rootOff[2] += 0.2 * w; v.rootOff[1] += 0.03 * w; }
  if (e.readying) { addP(P, "armL", -1.2, 0.5, 0); addP(P, "armR", -1.2, -0.5, 0); addP(P, "clawL", 0, 0.8 + Math.sin(t * 22) * 0.2, 0); addP(P, "clawR", 0, -0.8 - Math.sin(t * 22) * 0.2, 0); v.rootOff[1] += 0.08; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); v.rootOff[2] -= 0.15 * w; addP(P, "body", 0, 0, 0.06 * w * (an.hitSide || 1)); v.rootOff[1] += 0.03 * w; }
  mobAlert(v, e, an, P);
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
  const lg = s1 > 0 ? -s1 * 0.8 : -s1 * 0.3;
  addP(P, "legL", lg * mv, 0, 0); addP(P, "legR", lg * mv, 0, 0);
  addP(P, "armL", 0, 0, 0.4 + s1 * 0.5 * mv + Math.sin(t * 2.3) * 0.1); addP(P, "armR", 0, 0, -(0.4 + s1 * 0.5 * mv + Math.sin(t * 2.3) * 0.1));
  addP(P, "head", Math.sin(t * 1.2) * 0.08, Math.sin(t * 0.6) * 0.5 * (1 - mv), Math.sin(t * 0.9) * 0.1);
  addP(P, "leaf", Math.sin(t * 2.6) * 0.15, 0, Math.sin(t * 1.9) * 0.2);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) { sharp = true; const w = env(ak, 0.25, 0.6); addP(P, "body", 0.6 * w, 0, 0); addP(P, "head", 0.8 * w, 0, 0); v.rootOff[2] += 0.3 * w; v.rootOff[1] += 0.15 * w; }
  if (e.readying) { addP(P, "body", -0.4, 0, 0); addP(P, "head", -0.5, 0, 0); addP(P, "leaf", -0.6, 0, Math.sin(t * 25) * 0.3); v.rootOff[1] += 0.1; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0); addP(P, "head", -0.4 * w, 0, 0); v.rootOff[1] += 0.1 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.2 * k; addP(P, "leaf", 0, 0, 1.2 * k); }
  applyPose(v, dt, sharp);
}

function poseBulb(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.0, 0, 1);
  const s1 = Math.sin(an.ph * 1.2);
  v.rootOff[1] = Math.abs(s1) * 0.07 * mv;
  addP(P, "body", Math.sin(t * 1.3) * 0.03, 0, s1 * 0.16 * mv + Math.sin(t * 0.8) * 0.02);
  addP(P, "legL", s1 * 0.7 * mv, 0, 0); addP(P, "legR", -s1 * 0.7 * mv, 0, 0);
  addP(P, "sprout", Math.sin(t * 1.9) * 0.12 - s1 * 0.1 * mv, 0, Math.sin(t * 1.4) * 0.18);
  addP(P, "sprout2", Math.sin(t * 2.4 + 1) * 0.15, 0, Math.sin(t * 1.7) * 0.2);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.55;
  if (ak >= 0 && ak <= 1) { sharp = true; const back = env(ak, 0.4, 0.15), w = env(ak, 0.55, 0.35); addP(P, "sprout", -0.9 * back + 1.3 * w, 0, 0); addP(P, "sprout2", -0.7 * back + 1.5 * w, 0, 0); addP(P, "body", -0.15 * back + 0.35 * w, 0, 0); v.rootOff[2] += 0.12 * w; v.rootOff[1] += 0.06 * back; }
  if (e.readying) { addP(P, "sprout", -0.7, 0, Math.sin(t * 26) * 0.25); addP(P, "sprout2", -0.9, 0, Math.sin(t * 30) * 0.3); addP(P, "body", -0.12, 0, 0); v.rootOff[1] += 0.05; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0.15 * w); addP(P, "sprout", -0.4 * w, 0, 0); v.rootOff[2] -= 0.08 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.6); for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; } v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.12 * k; addP(P, "sprout", 0, 0, 0.9 * k); addP(P, "sprout2", 0.5 * k, 0, 0.6 * k); }
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
  const wv = an.ph * 1.2;
  const pit = i => i < 0 ? 0 : Math.sin(wv - i * Math.PI * 0.5) * 0.06 * mv + Math.sin(t * 2.4 - i * Math.PI * 0.5) * 0.05 * (1 - 0.5 * mv);
  for (let i = 0; i < 8; i++) {
    addP(P, "t" + i, pit(i) - pit(i - 1), Math.sin(wv - i * 0.9) * (0.05 + 0.15 * mv) + Math.sin(t * 0.9 - i * 0.6) * 0.03 * (1 - mv), 0);
  }
  addP(P, "t6", -0.1 * mv, 0, 0); addP(P, "t7", -0.12 * mv, 0, 0);
  v.rootOff[1] = Math.abs(Math.sin(wv)) * 0.01 * mv;
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.55;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const rear = ease(ak / 0.4);
    const strike = ak > 0.4 ? env((ak - 0.4) / 0.6, 0.25, 0.75) : 0;
    addP(P, "t4", -0.2 * rear + 0.15 * strike, 0, 0); addP(P, "t5", -0.5 * rear + 0.5 * strike, 0, 0); addP(P, "t6", -0.45 * rear + 0.5 * strike, 0, 0); addP(P, "t7", -0.3 * rear + 0.35 * strike, 0, 0);
    v.rootOff[2] += 0.2 * strike;
  }
  if (e.readying) {
    const sh = Math.sin(t * 30) * 0.05;
    addP(P, "t4", -0.25, sh, 0); addP(P, "t5", -0.45, -sh, 0); addP(P, "t6", -0.4, sh, 0); addP(P, "t7", -0.15, 0, 0);
  }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "t5", -0.15 * w, 0, 0); addP(P, "t6", -0.2 * w, 0, 0); addP(P, "t7", 0.1 * w, (an.hitSide || 1) * 0.2 * w, 0); v.rootOff[2] -= 0.1 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.8);
    for (let i = 0; i < 8; i++) { const p = P["t" + i]; p[0] *= 1 - k; p[1] = p[1] * (1 - k) + (i % 2 ? 0.08 : -0.08) * k; }
    v.rootOff[1] = -0.04 * k; v.rootRot[2] = 0.6 * k;
  }
  applyPose(v, dt, sharp);
}

function poseHare(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 1.0, 0, 1);
  let u = (an.ph * 0.9 / (Math.PI * 2)) % 1; if (u < 0) u += 1;
  const air = u < 0.55 ? Math.sin(Math.PI * u / 0.55) : 0, land = u >= 0.55 ? Math.sin(Math.PI * (u - 0.55) / 0.45) : 0;
  v.rootOff[1] = air * 0.2 * mv;
  const br = Math.sin(t * 1.4) * 0.02, thr = Math.sin(t * 4.2) * 0.015 * (1 - mv);
  addP(P, "body", (-0.25 * air + 0.15 * land) * mv + br + thr, 0, 0);
  addP(P, "legBL", (-0.9 * air + 0.05 * land) * mv, 0, 0); addP(P, "legBR", (-0.9 * air + 0.05 * land) * mv, 0, 0);
  addP(P, "legFL", (-0.5 * air + 0.08 * land) * mv, 0, 0); addP(P, "legFR", (-0.5 * air + 0.08 * land) * mv, 0, 0);
  const tw = Math.sin(t * 2.7) > 0.95 ? 0.25 : 0;
  addP(P, "earL", -0.1 + 0.3 * mv + tw, 0, -0.15); addP(P, "earR", -0.1 + 0.3 * mv, 0, 0.15 + tw);
  addP(P, "head", Math.sin(t * 6) * 0.03 * (1 - mv) - 0.15 * air * mv - thr, Math.sin(t * 0.5) * 0.4 * (1 - mv), 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.45;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const w = env(ak, 0.3, 0.6);
    addP(P, "body", 0.45 * w, 0, 0); addP(P, "legBL", -1.3 * w, 0, 0); addP(P, "legBR", -1.3 * w, 0, 0); addP(P, "legFL", -0.4 * w, 0, 0); addP(P, "legFR", -0.4 * w, 0, 0);
    v.rootOff[1] += 0.12 * w; v.rootOff[2] += 0.15 * w;
  }
  if (e.readying) { addP(P, "body", -0.2 + Math.sin(t * 24) * 0.03, 0, 0); addP(P, "legBL", 0.1, 0, 0); addP(P, "legBR", 0.1, 0, 0); addP(P, "head", -0.2, 0, 0); v.rootOff[1] += 0.03; }
  const hk = (S.time - an.hitStart) / 0.3;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.3 * w, 0, 0); v.rootOff[1] += 0.08 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) { const k = ease((S.time - an.dead) / 0.5); v.rootRot[2] = 1.5 * k; v.rootOff[1] = 0.05 * k; addP(P, "legBL", 0.5 * k, 0, 0); }
  applyPose(v, dt, sharp);
}

function poseRarab(v, e, dt) {
  const an = trackEvents(v, e, dt);
  const P = newPose(v);
  const t = S.time + an.t0;
  const mv = clamp(an.spd / 0.9, 0, 1);
  let u = (an.ph / (Math.PI * 2)) % 1; if (u < 0) u += 1;
  const air = u < 0.58 ? Math.sin(Math.PI * u / 0.58) : 0, land = u >= 0.58 ? Math.sin(Math.PI * (u - 0.58) / 0.42) : 0;
  v.rootOff[1] = air * 0.17 * mv - land * 0.03 * mv;
  const sway = Math.sin(t * 1.3) * 0.045 * (1 - mv), nod = Math.sin(t * 0.9) * 0.03 * (1 - mv), br = Math.sin(t * 3.1) * 0.012;
  addP(P, "body", (0.3 * air + 0.12 * land) * mv + nod + br, 0, sway);
  addP(P, "hips", -0.08 * land * mv, 0, -sway * 0.4);
  addP(P, "head", (-0.2 * air) * mv - nod * 0.6 + Math.sin(t * 6) * 0.02 * (1 - mv), Math.sin(t * 0.5) * 0.35 * (1 - mv), -sway * 0.7);
  addP(P, "legBL", (0.8 * air - 0.7 * land) * mv, 0, 0); addP(P, "legBR", (0.8 * air - 0.7 * land) * mv, 0, 0);
  addP(P, "footBL", (0.5 * air + 0.75 * land) * mv, 0, 0); addP(P, "footBR", (0.5 * air + 0.75 * land) * mv, 0, 0);
  const tw = Math.sin(t * 2.3) > 0.96 ? 1 : 0, tw2 = Math.sin(t * 1.7 + 2) > 0.97 ? 1 : 0;
  addP(P, "earL", -0.5 * air * mv - 0.08 * tw, 0, -0.12 - 0.12 * tw); addP(P, "earR", -0.5 * air * mv - 0.08 * tw2, 0, 0.12 + 0.12 * tw2);
  addP(P, "ear2L", -0.35 * air * mv + 0.25 * tw + Math.sin(t * 2) * 0.04, 0, -0.06); addP(P, "ear2R", -0.35 * air * mv + 0.25 * tw2 + Math.sin(t * 2 + 1) * 0.04, 0, 0.06);
  addP(P, "tail", Math.sin(t * 5) * 0.08 + 0.3 * air * mv, Math.sin(t * 3) * 0.15, 0);
  let sharp = false;
  const ak = (S.time - an.aStart) / 0.55;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const cr = ak < 0.3 ? ease(ak / 0.3) : 1 - ease((ak - 0.3) / 0.1), jp = ak >= 0.3 && ak < 0.8 ? Math.sin(Math.PI * (ak - 0.3) / 0.5) : 0;
    addP(P, "legBL", -0.7 * cr + 0.9 * jp, 0, 0); addP(P, "legBR", -0.7 * cr + 0.9 * jp, 0, 0);
    addP(P, "footBL", 0.75 * cr + 0.4 * jp, 0, 0); addP(P, "footBR", 0.75 * cr + 0.4 * jp, 0, 0);
    addP(P, "body", 0.15 * cr + 0.65 * jp, 0, 0); addP(P, "head", 0.25 * jp, 0, 0);
    addP(P, "earL", -0.7 * jp, 0, 0); addP(P, "earR", -0.7 * jp, 0, 0);
    v.rootOff[1] += -0.05 * cr + 0.2 * jp; v.rootOff[2] += 0.32 * (ak > 0.3 ? Math.min(1, (ak - 0.3) / 0.3) * (1 - ease((ak - 0.75) / 0.25)) : 0);
  }
  if (e.readying) { const sh = Math.sin(t * 26) * 0.05; addP(P, "legBL", -0.6, 0, 0); addP(P, "legBR", -0.6, 0, 0); addP(P, "footBL", 0.65, 0, 0); addP(P, "footBR", 0.65, 0, 0); addP(P, "body", 0.2, sh, 0); addP(P, "earL", -0.4, 0, 0); addP(P, "earR", -0.4, 0, 0); v.rootOff[1] -= 0.04; }
  const hk = (S.time - an.hitStart) / 0.35;
  if (hk >= 0 && hk <= 1) { const w = env(hk, 0.1, 0.8); addP(P, "body", -0.35 * w, 0, 0.1 * w); addP(P, "head", -0.2 * w, 0, 0); addP(P, "earL", 0.4 * w, 0, -0.3 * w); addP(P, "earR", 0.4 * w, 0, 0.3 * w); v.rootOff[1] += 0.05 * w; }
  mobAlert(v, e, an, P);
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.6);
    for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; }
    v.rootRot[2] = 1.45 * k; v.rootOff[1] = 0.06 * k;
    addP(P, "earL", 0.5 * k, 0, -0.4 * k); addP(P, "earR", 0.5 * k, 0, 0.2 * k); addP(P, "ear2L", 0.6 * k, 0, 0); addP(P, "ear2R", 0.6 * k, 0, 0);
    addP(P, "legBL", 0.6 * k, 0, 0); addP(P, "legBR", -0.3 * k, 0, 0);
  }
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
