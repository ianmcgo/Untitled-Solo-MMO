const H=require('./harness.js');const {G,tick,alllog}=H;const S=G.S;
console.log('hour',G.vana().hour,G.period());
G.enterZone('hollow',70,500);
let deaths=[];let last=0;
for(let i=0;i<3600*10;i++){tick(1000/60);
 if(S.ko){const tail=alllog.slice(-12).filter(x=>/hits you|uses|notices/.test(x));deaths.push(tail.slice(-3).join(' / '));G.returnHome();G.enterZone('hollow',70,500);continue;}
 if(i%6)continue;const p=G.player;
 if(p.engaged)continue;
 const inC=S.mobs.some(m=>m.alive&&m.state==='combat'&&m.enmity.size);
 if(!inC&&p.hp<p.maxHp*0.85)continue;
 let best=null,bd=1e9;for(const m of S.mobs){if(!m.alive||m.lv>p.lv+1)continue;const d=G.dist(m,p);if(d<bd){bd=d;best=m}}
 const t=inC?S.mobs.find(m=>m.alive&&m.state==='combat'&&m.enmity.size):best; if(t){p.target=t;G.toggleEngage(true)}}
console.log(deaths.length);console.log(deaths.slice(0,8).join('\n'));
