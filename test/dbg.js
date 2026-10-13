const H=require('./harness.js');const {G,alllog}=H;G.save.gil=2000;
for(const id of ['kael','mira','sable','rook','fen']){try{G.hireMerc(id)}catch(e){console.log('ERR',e.stack.split('\n').slice(0,3).join(' | '))}console.log(id,G.save.gil,G.S.party.length)}
