const H = require('./harness.js'); const { G, tick } = H; const S = G.S; const P = () => G.player; G.save.story.done = true;
let fails = 0; const ok = (c, m) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const run = sec => { for (let i = 0; i < sec * 60; i++) tick(1000 / 60); };
const jobs = Object.keys(G.JOBS);
let bad = [];
for (const j of jobs) for (const lv of [1, 5, 10, 15, 20, 25]) {
  const k = G.mobKit(j, lv);
  if (k.spells.length > 4) bad.push(j + lv + ' too many spells');
  for (const s of k.spells) if (!G.SPELLS[s.id] || !(G.SPELLS[s.id].jobs[j] <= lv)) bad.push(j + lv + ' ' + s.id);
  for (const a of k.abil) if (G.ABILITIES[a].job !== j || G.ABILITIES[a].lv > lv) bad.push(j + lv + ' abil ' + a);
  if (!k.big) bad.push(j + lv + ' no big move');
}
ok(!bad.length, 'every job at every level gets a legal kit (' + bad.slice(0, 5).join('; ') + ')');
ok(G.mobKit('BLM', 10).big.startsWith('sp:'), 'a Dark Mage big move is a spell');
ok(G.mobKit('WAR', 10).big.startsWith('ws:'), 'a Knight big move is a weapon skill');
ok(G.mobKit('WHM', 1).spells.some(s => s.heal) && !G.mobKit('WHM', 1).spells.some(s => s.id === 'cure2'), 'a level 1 Light Mage knows Cure but not Cure II');
ok(G.mobKit('WAR', 5).abil.includes('berserk') && !G.mobKit('WAR', 5).abil.includes('warcry'), 'a level 5 Knight has Frenzy but not Battle Shout');
const x = P().x + 100, y = P().y;
const gob = G.buildMob('goblin', 5, x, y, null);
ok(gob.job && G.JOBS[gob.job] && gob.kit, 'a goblin rolls a job');
ok(!G.buildMob('bat', 5, x, y, null).job, 'a bat never gets a job');
ok(!G.buildMob('chieftain', 8, x, y, null).job, 'a notorious monster keeps its own kit');
ok(G.buildMob('orc_grunt', 8, x, y, null, 'NIN').job === 'NIN', 'a job can be forced');
ok(!G.buildMob('goblin', 5, x, y, null, false).job, 'false forces no job');
ok(G.buildMob('goblin', 10, x, y, null, 'PLD').maxHp > G.buildMob('goblin', 10, x, y, null, 'BLM').maxHp, 'a Holy Knight goblin is tougher than a Dark Mage goblin');
const seenJobs = new Set(); for (let i = 0; i < 600; i++) seenJobs.add(G.rollMobJob());
ok(seenJobs.size === jobs.length, 'any job can be rolled (' + seenJobs.size + '/' + jobs.length + ')');
for (const id of Object.keys(G.MOB_RENAMED)) ok(!G.FAMILIES[id], id + ' removed');
let missing = []; for (const z of Object.values(G.ZONES)) for (const sp of z.spawns || []) { const opts = sp.opts || [sp]; for (const o of opts) if (o.fam && !G.FAMILIES[o.fam] && !G.NM_FAMILIES[o.fam]) missing.push(o.fam); }
ok(!missing.length, 'every spawn uses an existing family (' + missing.slice(0, 4).join(',') + ')');
const sv = G.normalizeSave(Object.assign({}, G.save, { bestiary: { den_conjurer: { seen: 1, kills: 4, zones: [] }, den_goblin: { seen: 1, kills: 3, zones: [] } } }));
ok(sv.bestiary.den_goblin.kills === 7 && !sv.bestiary.den_conjurer, 'old caster kills move to the plain goblin entry');
const war = G.buildMob('goblin', 10, x, y, null, 'WAR');
let fam = 0, ws = 0; for (let i = 0; i < 400; i++) { G.mobReady(war, P()); if (war.readying.move === war.fam.tpMove) fam++; else if (war.readying.move.code && war.readying.move.code.startsWith('ws:')) ws++; }
ok(fam > 140 && ws > 140 && fam + ws === 400, 'big moves split about 50/50 (' + fam + ' family, ' + ws + ' weapon skill)');
ok(G.mobMoveName(war) === war.readying.move.name, 'the readied move name is shown');
ok(G.mobBigMove(war, 'ws:fast_blade').name === 'Quick Slash' && G.mobBigMove(war, 'zz:nope') === war.fam.tpMove, 'move codes from the server resolve');
S.mobs = []; P().buffs = {}; P().hp = P().maxHp;
G.enterZone('hollow', 1200, 900); run(0.2); S.mobs = []; S.spawnAt = S.spawnAt.map(() => null);
const blm = G.buildMob('goblin', 10, P().x + 120, P().y, null, 'BLM'); S.mobs.push(blm); blm.readying = { t: 0, target: P(), start: S.time, move: G.mobBigMove(blm, blm.kit.big) };
const hp0 = P().hp; G.execTpMove(blm);
ok(P().hp < hp0, 'a spell big move hurts you (' + blm.kit.big + ')');
P().hp = P().maxHp; S.mobs = [];
const caster = G.buildMob('goblin', 12, P().x + 150, P().y, null, 'BLM'); S.mobs.push(caster); caster.nextCast = 0; G.aggro(caster, P());
const cast = {}; for (let i = 0; i < 60 * 30 && P().alive; i++) { tick(1000 / 60); if (caster.casting) cast[caster.casting.id] = 1; caster.hp = caster.maxHp; P().hp = P().maxHp; }
ok(Object.keys(cast).length >= 2, 'a Dark Mage goblin casts different spells (' + Object.keys(cast).join(',') + ')');
S.mobs = []; P().buffs = {};
const fighter = G.buildMob('goblin', 8, P().x + 30, P().y, null, 'WAR'); S.mobs.push(fighter); G.aggro(fighter, P());
let used = false; for (let i = 0; i < 60 * 25 && P().alive; i++) { tick(1000 / 60); if (fighter.buffs.berserk) used = true; fighter.hp = fighter.maxHp; P().hp = P().maxHp; }
ok(used, 'a Knight goblin uses Frenzy');
S.mobs = [];
const healer = G.buildMob('goblin', 12, P().x + 150, P().y, null, 'WHM'), hurt = G.buildMob('goblin', 12, P().x + 160, P().y + 20, null, 'WAR');
S.mobs.push(healer, hurt); G.aggro(healer, P()); G.aggro(hurt, P()); healer.nextCast = 0;
let healed = false; for (let i = 0; i < 60 * 30 && P().alive; i++) { hurt.hp = Math.min(hurt.hp, Math.floor(hurt.maxHp * 0.3)); const h0 = hurt.hp; tick(1000 / 60); if (hurt.hp > h0 + 1) healed = true; P().hp = P().maxHp; }
ok(healed, 'a Light Mage goblin cures a hurt friend');
S.mobs = [];
const slp = G.buildMob('goblin', 20, P().x + 150, P().y, null, 'BLM'); slp.spells = [{ id: 'sleep', status: ['sleep', 8] }]; S.mobs.push(slp); G.aggro(slp, P()); slp.nextCast = 0;
ok(!G.startMobCast(slp, P()), 'monsters do not cast Sleep on you');
console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
