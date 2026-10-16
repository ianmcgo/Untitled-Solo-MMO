import json,collections,re,sys
d=json.load(open(sys.argv[1] if len(sys.argv)>1 and sys.argv[1].endswith('.json') else 'gear.json'))
SL={0:'main',1:'sub',2:'range',3:'ammo',4:'head',5:'body',6:'hands',7:'legs',8:'feet',9:'neck',10:'waist',11:'ear',12:'ear',13:'ring',14:'ring',15:'back'}
def sl(r):
    for i in range(16):
        if r['slots']>>i&1: return SL[i]
    return '?'
lv=[r for r in d if r['level'] is not None and 1<=r['level']<=20]
drop=re.compile(r"\bsuit\b|masque|\btank\b|\begg\b|egg helm|pumpkin|horror head|skeleton robe|snowman|bunny|ghost cape|jester|witch|coven|dream |chocobo|choco\.|kupo|moogle|moggie|mog\. belt|yukata|decennial|novennial|undecennial|wedding|shorts|trunks|boxers|gilet|maillot|\btop\b|(marine|woodsy|creek|river|dune|custom|magna|wonder|savage|elder|fancy|track|cossie|swimming) |chef's|anniversary|jubilee|duodec|matrimony|tavnazian mask|craft|smith|carpenter|tanner|weaver|alchemist|culinarian|fisherman|fsh\.|artificer|confectioner|patissiere|drover|field |worker |work gloves|bonewrk|boneworker|joiner|jo\. |smythe|sm\. |toreutic|tr\. |plaiter|pl\. |beveler|bev\. |bv\. |ossifier|os\. |brewer|br\. |\bspecs|trainee|fish|rod\b|lure|rig\b|bait|minnow|worm|ball$|crayfish|sardine|trout|carp|bluetail|lobster|cod$|shell bug|scoop|calamary|pugil|\bmmm|waders|return ring|homing ring|sneak ring|deodor|invisible ring|reraise ring|pearl|name tag|stable|stars cap|laurel crown|portafurnace|castor|pollux|albatross|heron|pelican|penguin|seagull|puffin|noddy|duck ring|echad|caliber|chariot band|emperor|empress|dcl|shell (ring|earring)|manashell|astral|shinai|baghnakhs|judge|sacoche|soul|trapper|animator|abyssal|onion|chaosbringer|ceremonial|grapnel|gobbie|trick staff|treat staff|signet|unity shirt|race silks|livery|jack coat|happi|aketon|rusty|slime|spriggan|uchiwa|hagoita|ethereal|aern|ark |cassie|raising earring|tajawwul|swimming|overalls|straw hat|hatchling|mundus|glinting|leafkin|sandogasa|ziamet|sapphire|jadeite|diamond|emerald|ruby|apathy|rage |cowardice|envy|arrogance|shirt|garb|pupil|agent |starlet|alliance|morass|woodland|thatch|prishe|ilm |delegate|councilor|kachina|dinner|rhapsody|crustacean|esthete|poroggo|morbol|cait sith|sheep cap|corolla|corolla|she-|metal slime|heart apron|ta moko|cancrine|aucuba|vaquero|knit cap|kakai|subu|tlahtlamah|carbie|midras|curm\.|gazer|retching|crab cap|rarab|arthro|denim|pink subligar|ashen subligar|stinky|spriggan|iratsu|kengyu|shokujo|hanmomohiki|mandragora|mandraguard|janus|dullahan|kam'lanaut|twinned|cactuar|troth|ageist|regis|jody|kupofried|naji|beast collar|miner's|pullus|redeyes|cache-nez|eyepatch|spelunker|noble poulaines|talaria|sprinter|red sash|dash sash|gyokuto|blood stone|white belt|ascetic's|hermit's|premium|escritorio|ohakari|battledore|club hammer|lady bell|maestro|melomane|miracle wand|charm wand|colibri|caver|ram staff|fourth|cobra|pilgrim|b\. gauger|blank f|pet |dried squid|sea dragon|leafkin|pamama|grudge|marvelous|troll gun|decazoom|matre|artemis|silver gun|mizukage|clothespole|__noharp__|bomb|mumeito|wooden katana|hardwood katana|lotus|pitchfork",re.I)
EXCL=re.compile(r"aphelion|dazbog|tokkosho|sowilo|bridal corsage|blissful|trump crown|frosty cap|windshear|cornette \+2",re.I)
keep=[]
for r in lv:
    n=r['en']
    if n=='Warp Ring': keep.append(r); continue
    if drop.search(n) or EXCL.search(n): continue
    st={k:v for k,v in r['stats'].items() if k not in('latent','special')}
    real=[k for k in st if k not in('DEF','DMG','Delay')]
    if r['cat']=='Armor' and not st: continue
    if r['level']==1:
        if r['cat']=='Weapon' and (r['damage'] or 0)<=2 and r['skill'] not in (41,42): continue
        if r['cat']=='Armor':
            if r['slots']&0b1111 and not r['damage']:
                pass
            if st.get('DEF',0)<2 and not real and not re.search(r'hume|elv|tarutaru|mithran|galkan|bronze|brz|brass|ash |copper|vagabond|vgd|lauan|circlet|cuffs|slops|robe|bronze',n,re.I): continue
    keep.append(r)
if __name__=='__main__':
    print(len(keep)); json.dump([r['id'] for r in keep],open('keep.json','w'))
    by=collections.defaultdict(list)
    for r in keep: by[sl(r)].append(r)
    print({k:len(v) for k,v in by.items()})
    print(collections.Counter(r['level'] for r in keep if r['level']==1), sum(1 for r in keep if r['level']>1))
    for s,L in by.items():
        print('\n##',s,len(L)); print(', '.join(f"{r['en']}{'' if r['level']<2 else ' '+str(r['level'])}" for r in sorted(L,key=lambda r:(r['level'],r['en']))))

def write_list():
    out=['EQUIPMENT LIST - level 1-20 - %d pieces\n'%len(keep)]
    by=collections.defaultdict(list)
    for r in keep: by[sl(r)].append(r)
    for s in ['main','sub','range','ammo','head','body','hands','legs','feet','neck','waist','ear','ring','back']:
        L=sorted(by[s],key=lambda r:(r['level'],r['en']))
        out.append('\n== %s (%d) =='%(s.upper(),len(L)))
        out+=['L%-2d %s'%(r['level'],r['en']) for r in L]
    open('equipment_list.txt','w').write('\n'.join(out))
