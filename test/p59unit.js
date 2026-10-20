const H = require('./harness.js'); const { G } = H; const S = G.S;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const reg = G.meet('registrar_outpost');
ok(reg && S.zoneId === 'outpost_gov', 'the Registrar stands in the Government District');
G.talkTo(reg);
ok(S.dialog && S.dialog.all.some(o => /Change my name/.test(o.label)), 'the Registrar offers a name change');
G.closeDialog();
const old = G.save.name;
G.save.gil = 500;
let err; G.renameChar('Zephyr').then(e => { err = e; });
setTimeout(() => {
  ok(/crystals/.test(err) && G.save.name === old, 'you need 10,000 crystals');
  G.save.gil = 25000;
  G.renameChar('a').then(e => {
    ok(!!e && G.save.name === old, 'a one-letter name is refused');
    G.renameChar('Bad Name').then(e2 => {
      ok(!!e2, 'names with spaces are refused');
      G.renameChar(old).then(e3 => {
        ok(!!e3, 'your current name is refused');
        G.renameChar('zephyr').then(e4 => {
          ok(!e4 && G.save.name === 'Zephyr' && G.save.gil === 15000 && G.player.name === 'Zephyr', 'renaming takes 10,000 crystals and capitalises the name');
          const sv = G.normalizeSave(JSON.parse(JSON.stringify(G.save)));
          ok(sv.name === 'Zephyr', 'the new name is saved');
          for (const [zid, id] of [['outpost_gate', 'rhea'], ['outpost_gate', 'ysolde'], ['outpost_gate', 'guard_east'], ['harbor_ngate', 'ilsa'], ['harbor_ngate', 'stable_harbor'], ['harbor_egate', 'guard_pass'], ['harbor_egate', 'stable_harbor_e'], ['ironvale_gate', 'brisa'], ['ironvale_gate', 'stable_ironvale'], ['ironvale_sgate', 'guard_ironvale_s'], ['ironvale_sgate', 'stable_ironvale_s'], ['outpost_res', 'odette'], ['outpost_res', 'barber_outpost'], ['ironvale_south', 'barber_ironvale'], ['ironvale_keep', 'registrar_ironvale']]) ok(G.ZONES[zid].npcs.some(n => n.id === id), id + ' is in ' + zid);
          for (const zid of ['outpost_gate', 'harbor_ngate', 'harbor_egate', 'ironvale_gate', 'ironvale_sgate']) { const z = G.ZONES[zid]; ok(z.w * z.h <= 1000 * 800 && z.houses.length <= 2, zid + ' is a small gate zone'); }
          for (const t of ['outpost', 'harbor', 'ironvale']) { const z = G.ZONES[t], n = z.npcs.find(q => q.id === 'auction_' + t), h = z.houses.find(q => q.type === 'auction'); const d = G.houseDoor(h, 34); ok(Math.hypot(n.x - d.x, n.y - d.y) < 30, 'the ' + t + ' auction clerk stands at the Auction House door'); }
          const r = G.ZONES.outpost_res, door = r.exits.find(e => e.to === 'residence'), g = r.exits.find(e => e.gate);
          ok(Math.hypot(door.x - g.tx, door.y - g.ty) > 0 && Math.hypot(door.x - (g.x > r.w / 2 ? r.w - 96 : 96), door.y - (g.y + g.h / 2)) < 400, 'your residence is close to where you enter the Residential District');
          for (const zid of Object.keys(G.ZONES).filter(k => G.ZONES[k].town)) { const z = G.ZONES[zid], st = z.npcs.find(n => G.NPCS[n.id] && G.NPCS[n.id].warpstone); const gp = G.roadGap(z, st.x, st.y); ok(st && gp >= 30 && gp <= 50 && st.face != null && Math.hypot(st.x - z.w / 2, st.y - z.h / 2) < Math.hypot(z.w, z.h) / 4, zid + ' warp stone stands beside a road near the middle, facing it'); }
          console.log(fails ? fails + ' FAILED' : 'ALL PASSED'); process.exit(fails ? 1 : 0);
        });
      });
    });
  });
}, 10);
