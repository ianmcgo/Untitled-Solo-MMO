const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const z = S.zone, keep = z.colliders;
const fence = [];
for (let t = 0; t <= 6; t++) fence.push({ x: P().x + 60, y: P().y - 24 + t * 8, r: 4, fence: 1 });
z.colliders = fence.concat([{ x: P().x - 60, y: P().y, r: 9 }]);
const sx = P().x, sy = P().y;
P().x = sx + 62; P().y = sy + 3; G.keepOutOfColliders(P());
ok(P().x - (sx + 60) >= 4 && Math.abs(P().y - sy - 3) < 12, 'a fence pushes you out to the side you came from');
P().x = sx - 60 + 3; P().y = sy; G.keepOutOfColliders(P());
ok(Math.hypot(P().x - (sx - 60), P().y - sy) >= 9, 'a stump pushes you out');
let crossed = false; P().x = sx + 30; P().y = sy;
for (let i = 0; i < 60; i++) { P().x += 1.5; G.keepOutOfColliders(P()); if (P().x > sx + 70) crossed = true; }
ok(!crossed, 'walking straight into a fence does not pass through it');
z.colliders = [{ x: P().x + 500, y: P().y, r: 5 }];
P().x += 498; G.keepOutOfColliders(P());
ok(Math.abs(P().x - z.colliders[0].x) >= 5, 'grid rebuilds when the collider list is replaced');
const big = []; for (let i = 0; i < 20000; i++) big.push({ x: Math.random() * 4000, y: Math.random() * 3000, r: 6 });
z.colliders = big; const t0 = Date.now(); for (let i = 0; i < 20000; i++) { P().x = Math.random() * 4000; P().y = Math.random() * 3000; G.keepOutOfColliders(P()); }
ok(Date.now() - t0 < 400, '20000 push checks against 20000 colliders stay fast (' + (Date.now() - t0) + ' ms)');
z.colliders = keep; P().x = sx; P().y = sy;
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
