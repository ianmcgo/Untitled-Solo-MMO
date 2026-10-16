const fs=require('fs');
const S=process.argv[2];
const map=JSON.parse(fs.readFileSync(S+'map.json','utf8'));
const old=JSON.parse(fs.readFileSync(S+'oldids.json','utf8'));
const oldSet=new Set(old);
const rw=Object.entries(map).filter(([k,v])=>k!==v).sort((a,b)=>b[0].length-a[0].length);
const re=new RegExp('(?<![a-zA-Z0-9_])('+rw.map(x=>x[0]).join('|')+')(?![a-zA-Z0-9_])','g');
const def1=/^\s*([a-z0-9_]+): \{ name: "[^"]*", kind: "equip"/, def2=/^ITEMS\.([a-z0-9_]+) = \{ name: "[^"]*", kind: "equip"/;
let d=fs.readFileSync('src/data.js','utf8').split('\n');
d=d.filter(l=>!(def1.test(l)||def2.test(l)));
fs.writeFileSync('src/data.js',d.join('\n'));
const files=['src/data.js','src/game.js','src/rig.js','src/main4.js','src/menu4.js','src/hud4.js','src/net.js','src/view3d.js','src/models3d.js','src/icons.js','src/world3d.js'].concat(fs.readdirSync('test').filter(f=>f.endsWith('.js')).map(f=>'test/'+f));
let total=0;
for(const f of files){
  let t=fs.readFileSync(f,'utf8');
  if(f==='src/rig.js'){
    t=t.split('\n').filter(l=>{const m=/^  ([a-z0-9_]+): \{ /.exec(l);return !(m&&oldSet.has(m[1])&&map[m[1]]!==m[1]);}).join('\n');
  }
  let n=0;
  t=t.replace(re,(m)=>{n++;return map[m];});
  if(n){total+=n;console.log(f,n);fs.writeFileSync(f,t);}
}
console.log('replacements',total);
