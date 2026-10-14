const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const mockLogin = require('./mocklogin');
(async () => {
  const [html, out, only] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await page.addInitScript(() => { try { localStorage.setItem('ashenreach_settings_v1', JSON.stringify({ quality: 'low' })); } catch (e) {} });
  await page.addInitScript(() => { window.RIG_CHECK = true; });
  await mockLogin(page, html);
  const res = await page.evaluate(async (only) => {
    const out = [];
    const tmp = new THREE.Vector3();
    function groups(mesh) {
      const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, n = si.count;
      const by = new Map();
      for (let i = 0; i < n; i++) {
        let b = si.getX(i), w = sw.getX(i);
        for (const k of [1, 2, 3]) { const wk = sw.getComponent(i, k); if (wk > w) { w = wk; b = si.getComponent(i, k); } }
        if (!by.has(b)) by.set(b, []);
        by.get(b).push(i);
      }
      return by;
    }
    function gapGrid(A, B, cell) {
      const grid = new Map(), key = (x, y, z) => x + "," + y + "," + z;
      for (const q of B) { const k = key(Math.floor(q.x / cell), Math.floor(q.y / cell), Math.floor(q.z / cell)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(q); }
      let best = Infinity;
      for (const p of A) {
        const cx = Math.floor(p.x / cell), cy = Math.floor(p.y / cell), cz = Math.floor(p.z / cell);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
          const L = grid.get(key(cx + dx, cy + dy, cz + dz)); if (!L) continue;
          for (const q of L) { const d = p.distanceToSquared(q); if (d < best) best = d; }
        }
      }
      return best === Infinity ? cell : Math.sqrt(best);
    }
    function snapshot(v) {
      const mesh = v.mesh;
      v.group.updateMatrixWorld(true);
      mesh.skeleton.update();
      if (!v._lab) v._lab = groups(mesh);
      const pts = new Map(), wp = new THREE.Vector3();
      let minY = 1e9, maxY = -1e9, minAbove = 1e9;
      for (const [b, idxs] of v._lab) {
        const P = [];
        for (const i of idxs) {
          mesh.getVertexPosition(i, tmp);
          P.push(tmp.clone());
          wp.copy(tmp).applyMatrix4(mesh.matrixWorld);
          if (wp.y < minY) minY = wp.y;
          if (wp.y > maxY) maxY = wp.y;
          const above = wp.y - groundY(wp.x / U, wp.z / U);
          if (above < minAbove) minAbove = above;
        }
        pts.set(b, P);
      }
      return { pts, H: Math.max(0.2, maxY - minY), minAbove };
    }
    function pairGaps(v, snap, H) {
      const bones = v.mesh.skeleton.bones, res = {};
      const cell = 0.06 * H / v.group.scale.x;
      for (const [b, P] of snap.pts) {
        let pb = bones[b].parent;
        while (pb && pb.isBone && !snap.pts.has(bones.indexOf(pb))) pb = pb.parent;
        if (!pb || !pb.isBone) continue;
        res[bones[b].name + "<" + pb.name] = gapGrid(P, snap.pts.get(bones.indexOf(pb)), cell) * v.group.scale.x / H;
      }
      return res;
    }
    function restGaps(v) {
      const saved = v.mesh.skeleton.bones.map(b => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
      for (const b of v.mesh.skeleton.bones) { if (b.userData.rest) b.position.copy(b.userData.rest); b.quaternion.identity(); b.scale.set(1, 1, 1); }
      const sn = snapshot(v);
      const g = pairGaps(v, sn, sn.H);
      v.mesh.skeleton.bones.forEach((b, i) => { b.position.copy(saved[i][0]); b.quaternion.copy(saved[i][1]); b.scale.copy(saved[i][2]); });
      return { g, H: sn.H };
    }
    function measure(v, rest) {
      const sn = snapshot(v);
      const g = pairGaps(v, sn, rest.H);
      let worst = { d: 0, bone: "" }, built = { d: 0, bone: "" };
      for (const k in g) { const d = g[k] - (rest.g[k] || 0); if (d > worst.d) worst = { d, bone: k }; if ((rest.g[k] || 0) > built.d) built = { d: rest.g[k], bone: k }; }
      return { gap: +worst.d.toFixed(3), bone: worst.bone, built: +built.d.toFixed(3), builtBone: built.bone, above: +(sn.minAbove / rest.H).toFixed(3), H: +rest.H.toFixed(2) };
    }
    function frames(e, n, dt, f) { for (let i = 0; i < n; i++) { S.time += dt; if (f) f(i); syncEntity(e, dt); } }
    function trial(label, e) {
      const v = viewFor(e);
      if (!v) { out.push({ label, err: "no view" }); return; }
      if (e !== player) { e.x = X; e.y = Y; }
      const R = [];
      v.group.updateMatrixWorld(true);
      const rest = restGaps(v);
      const rec = pose => { const m = measure(v, rest); m.pose = pose; R.push(m); };
      e.moving = false; frames(e, 30, 0.033); rec("idle");
      frames(e, 25, 0.033); rec("idle2");
      for (let k = 0; k < 4; k++) { frames(e, 6, 0.033, () => { e.px = e.x; e.x += 4; e.moving = true; }); rec("walk" + k); }
      for (let k = 0; k < 3; k++) { frames(e, 4, 0.033, () => { e.px = e.x; e.x += 9; e.moving = true; }); rec("run" + k); }
      e.moving = false; e.engaged = true; e.state = "combat";
      e.lastSwing = S.time; frames(e, 5, 0.033); rec("swing-a"); frames(e, 6, 0.033); rec("swing-b");
      e.lastWS = S.time; e.lastWSId = isMob(e) ? null : "fast_blade"; frames(e, 8, 0.033); rec("ws");
      e.lastHit = S.time; frames(e, 3, 0.033); rec("hit");
      if (!isMob(e)) { e.casting = { id: "cure", sp: SPELLS.cure, start: S.time, end: S.time + 2 }; frames(e, 10, 0.033); rec("cast"); e.casting = null; }
      e.engaged = false; e.state = "idle";
      const worst = R.reduce((a, b) => (b.gap > a.gap ? b : a), R[0]);
      const pen = Math.min(...R.map(r => r.above)), idleAbove = Math.min(R[0].above, R[1].above);
      out.push({ label, islands: (v.meta.islands || []).join(" "), kind: v.kind, worstGap: worst.gap, at: worst.pose, bone: worst.bone, built: R[0].built, builtBone: R[0].builtBone, sink: pen, idleAbove, H: R[0].H, poses: R.map(r => r.pose + ":" + r.gap + ":" + r.bone + ":" + r.above).join(" ") });
    }
    const X = player.x + 40, Y = player.y + 10;
    const want = s => !only || s.includes(only);
    if (want("player")) {
      for (const race of Object.keys(RACES)) for (const job of ["WAR", "BLM", "WHM"]) {
        const e = makeChar ? null : null;
        save.look.race = race; save.look.build = race === "ursan" ? 0 : race === "nekari" ? 1 : save.look.build;
        player.job = job; VIEW.views.delete(player);
        trial("player:" + race + ":" + job, player);
      }
    }
    if (want("npc")) for (const id of Object.keys(NPC_LOOK)) { const n = { kind: "npc", id, x: X, y: Y, face: 0, radius: 14, buffs: {}, alive: true, lastSwing: -9, lastHit: -9, lastWS: -9, hp: 1, maxHp: 1, tp: 0 }; Object.assign(n, NPCS[id] || {}); n.kind = "npc"; n.id = id; trial("npc:" + id, n); VIEW.views.delete(n); }
    if (want("mob")) for (const fk of Object.keys(FAMILIES).concat(Object.keys(NM_FAMILIES))) { const m = buildMob(fk, 5, X, Y, null); player.target = m; trial("mob:" + fk, m); const vv = VIEW.views.get(m); if (vv) { destroyView(vv); VIEW.views.delete(m); } }
    if (want("amb")) for (const t of ["walker", "chicken", "gull", "dog", "cat"]) { const a = { kind: "ambient", ambient: true, type: t, seed: 3, x: X, y: Y, face: 0, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9 }; trial("amb:" + t, a); }
    if (want("pet")) for (const id of Object.keys(BUDDIES)) { const b = { kind: "buddy", buddy: true, petId: id, x: X, y: Y, face: 0, radius: 8, buffs: {}, alive: true, hp: 1, maxHp: 1, tp: 0, lastSwing: -9, lastHit: -9, lastWS: -9 }; trial("pet:" + id, b); }
    return out;
  }, only || "");
  require('fs').writeFileSync(out, JSON.stringify(res, null, 1));
  const bad = res.filter(r => r.err || r.islands || r.worstGap > 0.012 || r.built > 0.05 || r.sink < -0.015 || r.idleAbove > 0.03);
  console.log('measured', res.length, 'flagged', bad.length);
  for (const r of bad) { const c = Object.assign({}, r); delete c.poses; console.log(JSON.stringify(c)); }
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5).join(' || ') : 'no page errors');
  await browser.close();
})();
