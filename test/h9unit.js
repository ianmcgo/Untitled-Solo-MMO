const H = require('./harness.js'); const { G, tick, alllog } = H; const S = G.S; const P = () => G.player;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
G.enterZone('hollow', G.ZONES.hollow.start.x, G.ZONES.hollow.start.y); run(0.5);
const p = P();
const mk = fam => { const m = G.buildMob(fam, 5, p.x + 40, p.y, null); m.aggro = null; m.link = false; S.mobs.push(m); return m; };

const sk = G.FAMILIES.skeleton, w = G.FAMILIES.worm, gob = G.FAMILIES.goblin;
const tsk = G.hateTemper(sk), tw = G.hateTemper(w), tg = G.hateTemper(gob);
ok(/Resents steel/.test(tsk) && /shrugs off spells/.test(tsk), 'skeleton temper: ' + tsk);
ok(/Resents spells/.test(tw) && /shrugs off steel/.test(tw), 'worm temper: ' + tw);
ok(/Resents job abilities/.test(tg) && !/shrugs/.test(tg), 'goblin temper names abilities and nothing shrugged: ' + tg);
const flat = G.hateTemper({ model: 'nothing' });
ok(/No particular grudge/.test(flat), 'a family with no profile has no particular grudge: ' + flat);

ok(/Fight it more/.test(G.temperLine(sk, null)) && /5 more/.test(G.temperLine(sk, null)), 'no kills: fight it more (5 more)');
ok(/2 more/.test(G.temperLine(sk, { kills: 3 })), 'three kills: 2 more');
ok(/^Temper: Resents/.test(G.temperLine(sk, { kills: 5 })), 'five kills unlock the temper line');
ok(/^Temper:/.test(G.temperLine(Object.assign({}, sk, { nm: true }), { kills: 1 })), 'a notorious monster needs one kill');

S.mobs = [];
const m = mk('goblin'); m.state = 'combat';
const mate = { kind: 'ally', name: 'Tank', role: 'tank', alive: true, hp: 300, maxHp: 300, mp: 0, maxMp: 0, buffs: {}, x: p.x + 20, y: p.y + 20, stats: {}, lv: 5, recasts: {}, inventory: [] };
S.party = [p, mate];
G.addEnmity(m, mate, 100, { kind: 'phys' }); m.target = mate; m.swapAt = -9;
const n0 = alllog.length, f0 = S.floaters.length, e0 = S.effects.length;
G.hateSwap(m, mate, p);
ok(m.swapAt === S.time && m.swapFrom === mate, 'a swap records when and from whom');
ok(alllog.length > n0 && /turns on you/.test(alllog[alllog.length - 1]), 'turning on you is logged: ' + alllog[alllog.length - 1]);
ok(S.floaters.length === f0 + 1 && S.floaters[S.floaters.length - 1].text === '‼', 'a double mark pops over the monster when it turns on you');
ok(S.effects.length === e0 + 1, 'a ring pulses on the swap');
const n1 = alllog.length;
G.hateSwap(m, p, mate);
ok(/turns on Tank/.test(alllog[alllog.length - 1]), 'turning on a companion is logged with their name');
G.hateSwap(m, mate, p); G.hateSwap(m, p, mate);
const n2 = alllog.length;
G.hateSwap(m, mate, p); G.hateSwap(m, p, mate);
ok(alllog.length - n2 === 1, 'companion swaps are throttled to one log line per 2 s while swaps onto you always log');
ok(S.floaters[S.floaters.length - 1].text === '!', 'a companion swap pops a single mark');

console.log(fails ? fails + ' FAILED' : 'ALL PASS');
