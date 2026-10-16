const fs=require('fs');
const idx=JSON.parse(fs.readFileSync('tools/items-import/gear18-index.json','utf8'));
const rows=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const extra={dunestrider_boots:['feet',19,1],canopy_cloak:['back',19,1],pyre_ring:['ring',20,1],saltjaw_earring:['ear',15,1],gull_charm:['ear',12,0],spire_mantle:['back',20,1],lumen_earring:['ear',18,1],windrunner_boots:['feet',13,1],nomad_sash:['waist',12,0],nomad_cloak:['back',11,0],gloam_ring:['ring',15,1],mirage_veil:['back',19,1],nightglass_earring:['ear',14,1],ironvale_ring:['ring',18,1],trailblazer_boots:['feet',12,0],explorers_ring:['ring',17,0],pathfinder_mantle:['back',19,0]};
const OVR={yew_bow:'self_bow',steel_longbow:'hunters_longbow',frost_bow:'power_bow',tidebreaker_bow:'rogetsurin',bronze_greataxe:'butterfly_axe',steel_sword:'spatha',oak_staff:'gelong_staff',steel_claws:'brass_knuckles',bronze_greatsword:'claymore',iron_greatsword:'burning_claymore',steel_greatsword:'flame_claymore',frost_greatsword:'two_hand_sword',bronze_tachi:'tachi',iron_tachi:'uchigatana',steel_tachi:'nodachi',frost_tachi:'gunromaru',hunters_coat:'leather_vest_hq',brigand_vest:'tunic',training_gi:'kenpogi',minstrel_coat:'mana_tunic',troubadour_coat:'power_gi',shadow_plate:'bronze_harness_hq',evoker_robe:'robe',chain_mail:'brass_harness',wizards_robe:'robe_hq',iron_helm:'brass_cap',wool_hat:'brass_hairpin',kite_shield:'lauan_shield',scarlet_tabard:'hume_tunic',cotton_robe:'robe',leather_boots:'ash_clogs',mage_pendant:'feather_collar',spirit_torque:'scale_gorget',copper_earring:'silver_earring_hq',beetle_earring:'energy_earring',ember_earring:'onyx_earring',travelers_cape:'rabbit_mantle',wolf_mantle:'mist_silk_cape',mage_cape:'cape',silk_sash:'bronze_bandolier',buckler:'shell_shield',silkweave_mantle:'rabbit_mantle_hq',wardens_robe:'priests_robe',warlord_band:'poisona_ring',hollow_crown:'sol_cap',sentinel_greaves:'freeswords_slops',raider_helm:'lunar_cap',chieftain_cap:'legionnaires_cap',kings_blade:'bee_spatha'};
const used=new Set(Object.keys(idx).filter(k=>rows.some(r=>r[0]===k)));
const map={};
for(const v of Object.values(OVR))used.add(v);
const pickFor=(slot,wtype,lv,special)=>{
  const tries=[[1,1],[1,0],[0,1],[0,0]];
  for(const [needS,needFresh] of tries){
    let c=Object.entries(idx).filter(([k,v])=>v.slot===slot&&(slot!=='main'&&slot!=='ranged'||!wtype||v.wtype===wtype)&&!/\+/.test(v.name)&&(needS?(special?v.src==='drop':v.src==='shop'):true)&&(needFresh?!used.has(k):true));
    if(!c.length)c=Object.entries(idx).filter(([k,v])=>v.slot===slot&&(slot!=='main'&&slot!=='ranged'||!wtype||v.wtype===wtype)&&(needFresh?!used.has(k):true));
    if(c.length){c.sort((a,b)=>Math.abs(a[1].lv-lv)-Math.abs(b[1].lv-lv));return c[0][0];}
  }
};
for(const [id,o] of rows){
  if(idx[id]){map[id]=id;continue;}
  if(OVR[id]){map[id]=OVR[id];continue;}
  let slot=o.slot,wt=o.wtype,lv=o.lv,sp=!!(o.rare||o.nm||o.ex||o.price===0||o.rarity);
  if(extra[id]){[slot,lv,sp]=extra[id];wt=null;}
  if(slot==='ear1')slot='ear';
  if(wt==='archery'&&slot==='main')slot='ranged';
  const p=pickFor(slot,wt,lv,sp);map[id]=p;used.add(p);
}
const bad=Object.entries(map).filter(([k,v])=>!idx[v]);
if(bad.length){console.error('MISSING',bad);process.exit(1);}
fs.writeFileSync(process.argv[3],JSON.stringify(map,null,1));
console.log(Object.entries(map).filter(([k,v])=>k!==v).map(([k,v])=>k+' -> '+v+' ('+idx[v].lv+' '+idx[v].name+')').join('\n'));
