#!/bin/bash
GAME=$1; OUT=$2; TRIALS=${3:-5}
mkdir -p $OUT
JOBS=${SIM_JOBS:-"WAR WHM BLM PLD RDM THF MNK RNG SMN DRK BRD SAM NIN DRG BST BLU COR PUP DNC SCH GEO RUN"}
DIR=$(cd "$(dirname "$0")" && pwd)
printf "%s\n" $JOBS | xargs -P 8 -I{} sh -c "node $DIR/sim.js $GAME $OUT/{}.json {} $TRIALS 2>/dev/null"
node -e "const fs=require('fs');const d='$OUT';const all=[];for(const f of fs.readdirSync(d))if(f.endsWith('.json')&&f!=='all.json')all.push(...JSON.parse(fs.readFileSync(d+'/'+f)));fs.writeFileSync(d+'/all.json',JSON.stringify(all));console.log('rows',all.length)"
