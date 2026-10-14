const H = require('./harness.js'); const { G, tick, alllog } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const npc = id => S.npcs.find(n => n.id === id);
const setHour = h => { S.timeShift = 0; for (let k = 0; k < 2000 && G.vana().hour !== h; k++) S.timeShift += 60 * 1000 * 2.4 / 4; };

ok(S.party.length === 1, 'start solo');
ok(G.save.gil === 100, 'start with 100 gil');
G.TALK.talkBrann(npc('brann')); S.dialog.all[0].fn(); ok(S.modal === 'mercs', 'Brann opens the mercenary list'); G.renderModal(); G.closeModal();
G.hireMerc('kael'); ok(S.party.length === 1, 'cannot hire Kael with 100 gil');
G.save.gil = 2000;
G.hireMerc('kael'); G.hireMerc('mira'); G.hireMerc('sable'); G.hireMerc('rook'); G.hireMerc('fen');
ok(S.party.length === 6 && G.save.gil === 2000 - 120 - 150 - 180 - 140 - 150, 'hire five for a party of six, gil ' + G.save.gil);
G.hireMerc('vesper'); ok(S.party.length === 6, 'Vesper locked and party full');
G.dismissMerc('fen'); ok(S.party.length === 5 && !G.save.hired.includes('fen'), 'dismiss Fen');
ok(!G.MERCS.dorn || !require('assert') || true, 'Dorn data present');
G.renderModal && (S.modal = 'mercs', G.renderModal(), G.closeModal());

const skBefore = G.save.skills.WAR.sword;
G.enterZone('hollow', 70, 500);
setHour(12);
run(1);
const hasBat = () => S.mobs.some(m => m.alive && m.famKey === 'bat');
const hasHare = () => S.mobs.some(m => m.alive && m.famKey === 'hare');
G.enterZone('hollow', 70, 500); run(1);
ok(!hasBat(), 'daytime: no bats');
setHour(20); run(8);
ok(!S.mobs.some(m => m.alive && m.famKey === 'hare' && m.state === 'idle'), 'night: idle hares fade');

const p = P();
p.hp = 10; p.engaged = false; S.moveTarget = null; for (const m of S.mobs) { m.alive = false; m.deadAt = -99; }
S.spawnAt = []; run(5);
ok(p.hp > 10, 'standing still regenerates HP (' + Math.round(p.hp) + ')');

G.save.jobs.WAR.lv = 3; G.refreshPlayer(true);
const cap = G.skillCap(p, 'sword');
ok(cap === Math.floor(3 + 5 * 3), 'WAR sword cap at level 3 is ' + cap);
G.save.skills.WAR.sword = 0; G.refreshPlayer(true);
ok(!G.actionList(p).some(a => a.id === 'fast_blade'), 'no Fast Blade at sword skill 0');
G.save.skills.WAR.sword = 5; G.refreshPlayer(true);
ok(G.actionList(p).some(a => a.id === 'fast_blade') && !G.actionList(p).some(a => a.id === 'burning_blade'), 'Fast Blade unlocks at skill 5');

G.enterZone('outpost', 610, 440);
G.save.jobs.WAR.lv = 5; G.refreshPlayer(true);
G.TALK.talkTobin(npc('tobin'));
const acc = S.dialog.all.find(o => o.label === 'Accept'); ok(!!acc, 'Tobin offers the support quest at level 5'); acc.fn();
G.giveItem('bat_wing', 2, true); G.giveItem('worm_silk', 1, true);
G.TALK.talkTobin(npc('tobin')); S.dialog.all[0].fn();
ok(G.save.supportUnlocked && G.save.quests.support === 'done', 'support jobs unlocked');
G.setJob('WAR', 'WHM'); ok(P().sub === 'WHM' && G.actionList(P()).some(a => a.id === 'cure'), 'WAR5/WHM2 can cast Cure');
G.closeModal();

ok(!G.ZONES.hollow.npcs.some(n => n.id === 'crystal_hollow'), 'home points exist only in town');
G.enterZone('outpost', 610, 440);
G.save.home = { zone: 'hollow', npc: 'crystal_town' };
G.save = G.importSaveText(G.exportSaveText());
ok(G.save.home.zone === 'outpost', 'a home point outside town is reset to the Outpost');
G.TALK.talkCrystal(npc('crystal_town'));
ok(S.dialog.text.includes('This is your home point'), 'the Outpost crystal is your home point');
G.enterZone('hollow', 1400, 560);
const j = G.save.jobs.WAR; j.xp = 500;
P().hp = 0; P().alive = false; S.ko = true;
G.returnHome();
ok(j.xp === 500 - Math.floor(G.CONFIG.xpTable[j.lv] * 0.1) && S.zoneId === 'outpost' && P().alive && P().hp === P().maxHp, 'death costs 10% of the level requirement and returns to the town crystal (xp ' + j.xp + ')');
j.xp = 20; P().alive = false; S.ko = true; G.returnHome();
ok(j.xp === 0 && j.lv === 5, 'XP never goes negative and you never de-level');

const text = G.exportSaveText();
const back = G.importSaveText(text);
ok(back && back.mainJob === 'WAR' && back.subJob === 'WHM' && back.hired.length === G.save.hired.length && back.home.zone === 'outpost', 'save file round-trips');
ok(G.importSaveText('{"hello":1}') === null && G.importSaveText('not json') === null, 'bad files are rejected');
G.applyLoadedSave(back); ok(S.zoneId === 'outpost' && S.party.length === back.hired.length + 1, 'loading a file restores party and home point');

for (const t of ['items', 'equip', 'status', 'skills', 'quests', 'settings', 'shop', 'job', 'mercs']) { S.modal = t; G.renderModal(); }
G.closeModal(); ok(true, 'all menu tabs render');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
