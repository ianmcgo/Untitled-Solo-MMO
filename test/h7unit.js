const H = require('./harness.js'); const { G, tick } = H;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
G.enterZone('outpost'); for (let i = 0; i < 30; i++) tick(1000 / 60);
for (const t of ['outpost', 'harbor', 'ironvale']) {
  const Z = G.ZONES[G.zoneOfNpc('barber_' + t)], b = (Z.npcs || []).find(n => /^barber_/.test(n.id));
  ok(b && G.NPCS[b.id].talk === 'talkBarber', t + ' has a barber');
  ok((Z.stalls || []).some(s => s.sign === 'Barber' && Math.abs(s.x - b.x) < 5 && s.y > b.y), t + ' barber stands behind a signed stall');
}
G.save.gil = 500;
G.TALK.talkBarber({ name: 'Corrin, Barber', x: 0, y: 0 });
ok(!G.S.dialog || G.S.dialog.opts.length === 0, 'poor player gets no barber option');
G.save.gil = 1500;
G.TALK.talkBarber({ name: 'Corrin, Barber', x: 0, y: 0 });
ok(G.S.dialog && G.S.dialog.opts.length === 1 && /1000/.test(G.S.dialog.opts[0].label), 'rich player is offered the change for 1000 crystals');
ok(G.save.gil === 1500, 'talking charges nothing');
process.exit(fails ? 1 : 0);
