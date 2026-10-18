const fs = require('fs'), vm = require('vm'), path = require('path');
const s = fs.readFileSync(path.join(__dirname, '../src/rig.js'), 'utf8');
const a = s.indexOf('const HAIR_STYLES'), b = s.indexOf('function faceHairEntry'), e = s.indexOf('\n}\n', b) + 3;
const c = vm.createContext({});
vm.runInContext(s.slice(a, e) + ';this.X={HAIR_STYLES,HAIR_COLORS,HAIR_TONES,faceHairEntry};', c);
const G = c.X;
let fails = 0; const ok = (t, m) => { if (!t) fails++; console.log((t ? 'PASS ' : 'FAIL ') + m); };
for (const race of ['human', 'elari', 'pipkin', 'nekari', 'ursan']) {
  const sexes = race === 'nekari' ? [1] : race === 'ursan' ? [0] : [0, 1];
  for (const b of sexes) for (let f = 0; f < 9; f++) {
    const e = G.faceHairEntry(race, b, f);
    ok(G.HAIR_STYLES.indexOf(e.style) >= 0 && e.colors.length === 3 && e.colors.every(x => typeof x === 'number' && x > 0), race + ' ' + b + ' face ' + (f + 1) + ' ' + e.style);
  }
}
const sw = G.faceHairEntry('human', 0, 2);
const ex = G.faceHairEntry('human', 0, 4), ur = G.faceHairEntry('ursan', 0, 0), plain = G.faceHairEntry('human', 1, 0);
ok(ex.extras.includes('tattoo') && ex.extras.includes('goatee') && ur.extras.includes('beard') && plain.extras.length === 0, 'face extras parse (tattoo and goatee, Ursan beard, none on plain faces)');
ok(sw.style === 'spiky' && sw.colors[1] === G.HAIR_TONES.copper, 'human male face 3 is spiky with copper second colour');
process.exit(fails ? 1 : 0);
