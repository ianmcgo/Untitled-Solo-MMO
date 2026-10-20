const H = require('./harness.js'); const { G } = H; const S = G.S; let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
G.save.story.done = true;
G.enterZone('outpost');
const sv = G.townServices('outpost');
const labels = new Set(sv.map(v => v.label));
for (const k of ['Armorer', 'Weaponsmith', 'Tradesman', 'Quartermaster', 'Spellsmith', 'Jeweler', 'Auction House', 'Mercenary Hall', 'Job Master', "Adventurers' Guild"]) ok(labels.has(k), 'Ashenreach has ' + k);
ok(sv.every(v => v.district), 'every service has a district');
ok(sv.find(v => v.label === 'Armorer').district === 'Industrial District' || /Industrial/.test(sv.find(v => v.label === 'Armorer').district), 'armorer is in the industrial district: ' + sv.find(v => v.label === 'Armorer').district);
const sign = S.npcs.find(n => n.prop === 'sign' && /^dsign_/.test(n.id));
G.TALK.talkDistrictSign(sign);
ok(/Here: .*Quartermaster/.test(S.dialog.text), 'market signpost lists its shops');
ok(/Industrial District: .*\n.*Armorer/.test(S.dialog.text), 'signpost lists other districts shops');
const guard = { name: 'Gate Guard Aldo', x: 0, y: 0 };
G.guardWhere(guard, 'Armorer');
ok(/Armorer\) is in the .*of here, about \d+ yalms/.test(S.dialog.text), 'guard gives directions: ' + S.dialog.text);
G.guardMenu(guard); ok(S.dialog.all.length > 5 && S.dialog.all.length < 12, 'guard menu lists kinds (' + S.dialog.all.length + ')');
ok(G.compassWord(10, 0) === 'east' && G.compassWord(0, -10) === 'north' && G.compassWord(-10, 10) === 'south-west', 'compass words');
for (const a of ['harbor', 'ironvale']) { const l = new Set(G.townServices(a).map(v => v.label)); ok(['Armorer', 'Weaponsmith', 'Quartermaster', 'Auction House'].every(k => l.has(k)), a + ' has core services'); }
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
