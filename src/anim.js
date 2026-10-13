const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const env = (k, a, b) => k < 0 || k > 1 ? 0 : Math.min(1, k / a, (1 - k) / b);

function animState(v) {
  if (!v.an) v.an = { ph: Math.random() * 6, spd: 0, lx: null, ly: null, swing: null, aStart: -9, aVar: 0, ws: null, wsStart: -9, hit: null, hitStart: -9, casting: false, relStart: -9, dead: null, t0: Math.random() * 10, fight: 0, lastStep: 0, readyStart: -9, wasReady: false };
  return v.an;
}

function trackEvents(v, e, dt) {
  const an = animState(v);
  if (an.lx == null) { an.lx = e.x; an.ly = e.y; }
  const d = Math.hypot(e.x - an.lx, e.y - an.ly) * U;
  an.lx = e.x; an.ly = e.y;
  const raw = dt > 0 ? Math.min(d / dt, 20) : 0;
  an.spd += (raw - an.spd) * Math.min(1, dt * 10);
  an.ph += d * (Math.PI * 2) / (v.stride || 1.7);
  if (e.lastSwing !== an.swing) { if (an.swing !== null && S.time - e.lastSwing < 0.3) { an.aStart = e.lastSwing; an.aVar ^= 1; } an.swing = e.lastSwing; }
  if (e.lastWS !== an.ws) { if (an.ws !== null && S.time - e.lastWS < 0.3) an.wsStart = e.lastWS; an.ws = e.lastWS; }
  if (e.lastHit !== an.hit) { if (an.hit !== null && S.time - e.lastHit < 0.3) an.hitStart = e.lastHit; an.hit = e.lastHit; }
  if (an.casting && !e.casting) an.relStart = S.time;
  an.casting = !!e.casting;
  if (e.readying && !an.wasReady) an.readyStart = S.time;
  an.wasReady = !!e.readying;
  if (e.alive === false && an.dead == null) an.dead = S.time;
  if (e.alive !== false) an.dead = null;
  return an;
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

function applyPose(v, dt, sharp) {
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
  if (w === "greataxe" || w === "scythe") return "cleave";
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
  an.fight += (fightT - an.fight) * Math.min(1, dt * 6);
  let sharp = false;

  addP(P, "chest", Math.sin(t * 1.9) * 0.025, 0, 0);
  addP(P, "upArmL", 0, 0, 0.09); addP(P, "upArmR", 0, 0, -0.09);
  addP(P, "foreArmL", -0.12, 0, 0); addP(P, "foreArmR", -0.12, 0, 0);
  addP(P, "head", Math.sin(t * 0.37) * 0.05, Math.sin(t * 0.23) * 0.3 * (1 - amp) * (1 - an.fight), 0);
  if (st.hunch) { addP(P, "spine", 0.22, 0, 0); addP(P, "chest", 0.12, 0, 0); addP(P, "head", -0.3, 0, 0); addP(P, "upArmL", -0.25, 0, 0.1); addP(P, "upArmR", -0.25, 0, -0.1); }
  if (st.prowl) { addP(P, "upArmL", -0.6, 0, 0.15); addP(P, "upArmR", -0.6, 0, -0.15); addP(P, "foreArmL", -0.3, 0, 0); addP(P, "foreArmR", -0.3, 0, 0); }

  const sw = an.fight * (1 - amp);
  if (sw > 0.01) {
    addP(P, "thighL", -0.28 * sw, 0, 0.12 * sw); addP(P, "thighR", 0.05 * sw, 0, -0.12 * sw);
    addP(P, "shinL", 0.45 * sw, 0, 0); addP(P, "shinR", 0.35 * sw, 0, 0);
    addP(P, "footL", -0.17 * sw, 0, 0); addP(P, "footR", -0.35 * sw, 0, 0);
    v.rootOff[1] -= 0.05 * sw;
    addP(P, "spine", 0.1 * sw, -0.15 * sw, 0);
    if (v.weaponKind === "greataxe" || v.weaponKind === "scythe") { addP(P, "upArmR", -0.7 * sw, 0, 0.25 * sw); addP(P, "foreArmR", -0.9 * sw, 0, 0); addP(P, "upArmL", -0.8 * sw, 0, -0.35 * sw); addP(P, "foreArmL", -0.9 * sw, 0, 0); }
    else if (v.weaponKind === "h2h" || (!v.weaponKind && v.kind === "human" && !isMob(e))) { addP(P, "upArmR", -0.85 * sw, 0, -0.25 * sw); addP(P, "foreArmR", -1.7 * sw, 0, 0); addP(P, "upArmL", -1.0 * sw, 0, 0.25 * sw); addP(P, "foreArmL", -1.8 * sw, 0, 0); }
    else if (v.weaponKind === "staff") { addP(P, "upArmR", -0.4 * sw, 0, 0); addP(P, "foreArmR", -0.8 * sw, 0, 0); addP(P, "upArmL", -0.3 * sw, 0, 0); addP(P, "foreArmL", -0.6 * sw, 0, 0); }
    else { addP(P, "upArmR", -0.55 * sw, 0, -0.1 * sw); addP(P, "foreArmR", -0.75 * sw, 0, 0); addP(P, "upArmL", -0.45 * sw, 0, 0.05 * sw); addP(P, "foreArmL", -1.0 * sw, 0, 0); }
  }

  if (amp > 0.01) {
    const lean = st.hop ? 0.22 : 0.14;
    addP(P, "thighL", s1 * 0.78 * amp, 0, 0); addP(P, "thighR", -s1 * 0.78 * amp, 0, 0);
    const kn = 1.0 + 0.35 * run;
    addP(P, "shinL", (0.16 + kn * Math.max(0, -c1) + 0.12 * Math.max(0, s1)) * amp, 0, 0); addP(P, "shinR", (0.16 + kn * Math.max(0, c1) + 0.12 * Math.max(0, -s1)) * amp, 0, 0);
    addP(P, "footL", (-s1 * 0.22 + 0.3 * Math.max(0, -c1) * Math.max(0, s1)) * amp, 0, 0); addP(P, "footR", (s1 * 0.22 + 0.3 * Math.max(0, c1) * Math.max(0, -s1)) * amp, 0, 0);
    const armSwing = an.fight > 0.5 ? 0.25 : 0.6;
    addP(P, "upArmL", -s1 * armSwing * amp, 0, 0); addP(P, "upArmR", s1 * armSwing * amp, 0, 0);
    const el = amp * (1 - an.fight * 0.6);
    addP(P, "foreArmL", -0.55 * run - (0.14 + 0.38 * Math.max(0, s1)) * el, 0, 0); addP(P, "foreArmR", -0.55 * run - (0.14 + 0.38 * Math.max(0, -s1)) * el, 0, 0);
    addP(P, "upArmL", 0, 0, 0.05 * amp); addP(P, "upArmR", 0, 0, -0.05 * amp);
    addP(P, "spine", lean * run, 0, 0);
    addP(P, "chest", 0, s1 * 0.16 * amp, 0);
    addP(P, "hips", 0, -s1 * 0.1 * amp, 0);
    v.rootOff[1] += Math.abs(c1) * (st.hop ? 0.09 : 0.055) * amp - 0.02 * run;
    const step = Math.floor(an.ph / Math.PI);
    if (step !== an.lastStep) { an.lastStep = step; if (run > 0.4 && e.alive !== false) fxFootstep(e, v); }
  }

  const ak = (S.time - an.aStart) / 0.5;
  if (ak >= 0 && ak <= 1) {
    sharp = true;
    const kind = attackKind(v, e);
    const w = Math.min(1, ak / 0.08, (1 - ak) / 0.3);
    const side = an.aVar ? 1 : -1;
    if (kind === "slash") {
      const a = ease(ak / 0.32), b = ease((ak - 0.32) / 0.22);
      setP(P, "upArmR", -2.1 * a + 1.8 * b, 0, -0.55 * a + 1.05 * b, w);
      setP(P, "foreArmR", -1.0 * a + 0.85 * b, 0, 0, w);
      setP(P, "chest", 0.05, -0.5 * a + 0.95 * b, 0, w);
      setP(P, "spine", 0.08 + 0.12 * b, 0, 0, w);
    } else if (kind === "smash" || kind === "cleave") {
      const a = ease(ak / 0.36), b = ease((ak - 0.36) / 0.2);
      setP(P, "upArmR", -2.7 * a + 2.4 * b, 0, -0.1, w);
      setP(P, "foreArmR", -0.7 * a + 0.5 * b, 0, 0, w);
      if (kind === "cleave") { setP(P, "upArmL", -2.6 * a + 2.3 * b, 0, -0.35, w); setP(P, "foreArmL", -0.8 * a + 0.6 * b, 0, 0, w); }
      setP(P, "spine", -0.15 * a + 0.45 * b, 0, 0, w);
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
  if (wk >= 0 && wk <= 1) {
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
    const bob = Math.sin(t * 7) * 0.08;
    setP(P, "upArmL", -1.25 + bob, 0, -0.42, cw); setP(P, "upArmR", -1.25 - bob, 0, 0.42, cw);
    setP(P, "foreArmL", -0.95, 0, 0, cw); setP(P, "foreArmR", -0.95, 0, 0, cw);
    setP(P, "head", 0.18, 0, 0, cw);
    setP(P, "spine", 0.04, 0, 0, cw);
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
    const w = env(hk, 0.12, 0.7);
    addP(P, "spine", -0.32 * w, 0, 0); addP(P, "head", -0.25 * w, 0, 0);
    addP(P, "upArmL", 0.35 * w, 0, 0.2 * w); addP(P, "upArmR", 0.35 * w, 0, -0.2 * w);
    v.rootOff[2] -= 0.06 * w;
  }

  const sitT = e.resting && e.alive !== false && !e.mounted ? 1 : 0;
  an.sit = (an.sit || 0) + (sitT - (an.sit || 0)) * Math.min(1, dt * 5);
  if (an.sit > 0.01) {
    const k = an.sit;
    for (const s of ["L", "R"]) {
      const sg = s === "L" ? 1 : -1;
      setP(P, "thigh" + s, -1.25, 0, sg * 0.42, k);
      setP(P, "shin" + s, 2.05, 0, 0, k);
      setP(P, "foot" + s, -0.35, 0, 0, k);
      setP(P, "upArm" + s, -0.42, 0, sg * 0.12, k);
      setP(P, "foreArm" + s, -0.75, 0, 0, k);
    }
    setP(P, "spine", 0.16 + Math.sin(t * 1.3) * 0.02, 0, 0, k);
    setP(P, "head", 0.08, 0, 0, k);
    v.rootOff[1] -= ((v.meta && v.meta.hipsY) || 0.9) * 0.78 * k;
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

  if (P.tail) {
    const wag = Math.sin(t * (1.6 + run * 3)) * (0.3 + run * 0.15);
    addP(P, "tail", 0.2 - run * 0.35, wag * 0.6, 0);
    addP(P, "tail2", -0.25 - run * 0.2, wag, 0);
  }
  if (an.dead != null) {
    const k = ease((S.time - an.dead) / 0.6);
    for (const n in P) { const p = P[n]; p[0] *= 1 - k; p[1] *= 1 - k; p[2] *= 1 - k; }
    addP(P, "upArmL", 0, 0, 1.1 * k); addP(P, "upArmR", 0, 0, -1.1 * k);
    addP(P, "thighL", -0.2 * k, 0, 0.15 * k); addP(P, "thighR", 0, 0, -0.1 * k);
    addP(P, "head", -0.25 * k, 0.5 * k, 0);
    v.rootRot[0] = -1.5 * k;
    v.rootOff[0] = 0; v.rootOff[1] = 0.14 * k; v.rootOff[2] = 0;
    sharp = false;
  }
  applyPose(v, dt, sharp);
}

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
