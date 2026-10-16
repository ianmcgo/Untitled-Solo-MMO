import sys, re, json, runpy, collections

src_json = sys.argv[1]
out_js = sys.argv[2]
sys.argv = ['x', src_json]
import os
HERE = os.path.dirname(os.path.abspath(__file__))
filt = runpy.run_path(os.path.join(HERE, 'gear18_filter.py'))
keep = filt['keep']
sl = filt['sl']

JOBMAP = {1: 'WAR', 2: 'MNK', 3: 'WHM', 4: 'BLM', 5: 'RDM', 6: 'THF', 7: 'PLD', 8: 'DRK', 9: 'BST', 10: 'BRD', 11: 'RNG', 12: 'SAM', 13: 'NIN', 14: 'DRG', 15: 'SMN', 16: 'BLU', 17: 'COR', 18: 'PUP', 19: 'DNC', 20: 'SCH', 21: 'GEO', 22: 'RUN'}
WTYPE = {1: 'h2h', 2: 'dagger', 3: 'sword', 4: 'gsword', 5: 'axe', 6: 'greataxe', 7: 'scythe', 8: 'polearm', 9: 'katana', 10: 'gkatana', 11: 'club', 12: 'staff', 25: 'archery', 26: 'archery', 27: 'throwing', 41: 'instrument', 42: 'instrument'}
SLOTMAP = {'main': 'main', 'sub': 'sub', 'range': 'ranged', 'ammo': 'ammo', 'head': 'head', 'body': 'body', 'hands': 'hands', 'legs': 'legs', 'feet': 'feet', 'neck': 'neck', 'waist': 'waist', 'ear': 'ear', 'ring': 'ring', 'back': 'back'}
STATMAP = {'DEF': 'def', 'HP': 'hp', 'MP': 'mp', 'STR': 'str', 'DEX': 'dex', 'VIT': 'vit', 'AGI': 'agi', 'INT': 'int', 'MND': 'mnd', 'CHR': 'chr', 'Attack': 'att', 'Accuracy': 'acc', 'Evasion': 'eva'}
SPECIAL = re.compile(r"enyo|anu's|nemain|njord|platoon|besieger|decurion|baron's|trader's|garrison|freesword|ryl\\.|lgn\\.|legionnaire|mercenary|hoshikazu|h\\.kazu|kingdom|republic|federation|san d'orian (boots|tunic|vest|sword|bow|cesti|gloves)|san\\. |bastokan (cap|harness|mittens|axe|scythe|staff|crossbow)|windurstian (slops|club|staff|bow)|rep\\. |bas\\. |fed\\. |rider|nomad|benedight|mage's|angler|trailer|phl\\.|cmp\\.|taikyoku|carbuncle|areion|destrier|mohbwa|ganko|gunromaru|gassan|kyofu|katayama|mokuto|seito|neckchopper|fuscina|misery|bouncer|monster signa|burnite|braveheart|plantreaper|estramacon|moonlight|pestle|deathbringer|surviver|beestinger|obelisk|sapara|rogetsurin|almogavar|tanegashima|assailant|orcish|rabbit stick|butterfly|hellfire|inferno|prominence|aspir|hushed|silence dagger|blind |gust|burning|flame|vulcan|jolt|felling|bee |gelong|moth|auriga|lucent|poison|python|cruel|valor|mecurial|shield earring|sol cap|lunar|eerie|rambler|tidal|key ring|safeguard|multiple|saintly|eremite|desperado|armored|protean|variable|fasting|wing pendant|armiger|bird whistle|bloodbead|pile chain|tenax|disciple|succubus|tropical|lantern|strong shield|decurion|bone pick|scentless|asbestos|rabbit charm|buffoon|justice|bfn\\.|dog collar|green scarf|focus|neckerchief|mary's|bandit|hunter's|power bow|dhalmel|breath mantle|besieger|talisman|bonze|poet|sage's|zealot|guerilla|battle gloves|white mitts|priest|entrancing|noble's|healing harness|bounding|leaping|strider|trotter|augmenting|heko|friar|runner|acrobat|barbarian|brave|samsonian|tough|purple belt|magic belt|silver obi", re.I)
SHOPBASE = re.compile(r"^(bronze|brass|copper|silver|ash|maple|willow|holly|yew|oak|elm|lauan|leather|lth\.|linen|cotton|coarse|iron|hume|elv|elvaan|tarutaru|mithran|galkan|vagabond|vgd|cuffs|slops|robe|tunic|gloves|mitts|slacks|brais|gaiters|solea|kyahan|tekko|kenpogi|sitabaki|hachimaki|headgear|faceguard|aspis|buckler|knife|dagger|sword|xiphos|spatha|claymore|axe|mace|hammer|spear|staff|wand|club|bow|crossbow|shortbow|longbow|self bow|light crossbow|musketoon|boomerang|arrow|bolt|bullet|pebble|dart|crude|wooden|stone|old|tin|iron|copper|cesti|kunai|wakizashi|tachi|uchigatana|harpoon|zaghnal|pike|scimitar|bilbo|baselard|longsword|iron sword|mace|great axe|scythe|zaghnal|flute|piccolo|maple harp|harp|cornette|gemshorn|bone|ash|bastokan ring|windurstian ring|san d'orian ring|brass ring|leather ring|silver ring|silver earring|warp ring|rabbit mantle|dhalmel mantle|lizard mantle|cape|cotton cape|traveler|leather belt|lizard belt|warrior|plate belt|silver hairpin|brass hairpin|bone hairpin|shell hairpin|copper hairpin|circlet|cap|bandana|bronze harness|harness|doublet|jerkin|vest|surcoat|sandals|clogs|boots|leggings|greaves|trousers|pants|subligar|cuisses|mittens|gauntlets|gorget|collar|pendant|belt|obe|sash|earring|ring|cuffs)", re.I)

def slug(n):
    s = n.lower().replace("'", "")
    m = re.search(r"\s\+(\d)$", s)
    hq = ''
    if m:
        hq = '_hq' if m.group(1) == '1' else '_hq' + m.group(1)
        s = s[:m.start()]
    s = re.sub(r"[^a-z0-9]+", "_", s).strip('_')
    return s + hq

def icon(r, slot, wt):
    n = r['en'].lower()
    if slot == 'main' or slot == 'ranged':
        return {'dagger': '🔪', 'sword': '🗡️', 'axe': '🪓', 'greataxe': '🪓', 'gsword': '⚔️', 'h2h': '🥊', 'club': '🏏', 'staff': '🦯', 'scythe': '🌙', 'polearm': '🔱', 'katana': '🌀', 'gkatana': '🎌', 'archery': '🏹', 'instrument': '🎵', 'throwing': '🪃'}.get(wt, '🗡️')
    if slot == 'ammo': return '➶' if re.search(r'arrow|bolt', n) else '🪨'
    if slot == 'sub': return '🛡️'
    if slot == 'head': return '🎩' if re.search(r'hat|bandana|ribbon|hairpin|circlet|headband|chapeau|beret|specs', n) else '⛑️'
    if slot == 'body': return '👘' if re.search(r'robe|kaftan|dogi|gi$|saio|separates|bodice', n) else '🛡️' if re.search(r'mail|harness|plate|breastplate', n) else '🧥'
    return {'hands': '🧤', 'legs': '👖', 'feet': '🥾', 'neck': '📿', 'ear': '🦻', 'ring': '💍', 'back': '🧣', 'waist': '🎗️'}[slot]

def price(lv, slot, hq, dmg=0):
    base = 40 + 80 * (lv ** 1.6)
    mul = {'main': 1.0, 'sub': 0.8, 'ranged': 0.9, 'ammo': 0.03, 'body': 1.0, 'head': 0.7, 'hands': 0.7, 'legs': 0.8, 'feet': 0.7, 'neck': 0.8, 'ear': 0.8, 'ring': 0.9, 'back': 0.8, 'waist': 0.8}[slot]
    p = base * mul * (1.4 if hq else 1)
    if slot == 'ammo': p = max(2, round(p / 6))
    return int(round(p, -1)) if p >= 100 else int(round(p))

FLAGS = json.load(open(os.path.join(HERE, 'gear18-flags.json')))
LV_OVERRIDE = {}
DMG_LV_K = float(os.environ.get('DMG_LV_K', '0.015'))
WTYPE_MULT = {'sword': 1.15, 'dagger': 1.5, 'club': 0.95, 'staff': 1.05, 'greataxe': 1.1, 'gsword': 0.95, 'axe': 1.05, 'h2h': 1.1, 'scythe': 0.8, 'polearm': 1.0, 'katana': 1.4, 'gkatana': 1.0, 'archery': 1.0, 'throwing': 1.0}
def gdelay(d):
    return round(1.9 * (d / 183) ** 0.75, 1)
def gdmg(d, lv, wt=None):
    return max(1, round(d * WTYPE_MULT.get(wt, 1.0) * (1 + DMG_LV_K * lv)))
items = {}
used = {}
for r in sorted(keep, key=lambda r: (r['level'], r['en'])):
    slot = SLOTMAP[sl(r) if sl(r) != 'ear' else 'ear']
    s0 = sl(r)
    slot = SLOTMAP.get(s0, s0)
    wt = WTYPE.get(r['skill']) if r['cat'] == 'Weapon' else None
    iid = slug(r['en'])
    if iid in used:
        used[iid] += 1
        iid = iid + '_' + str(used[iid])
    else:
        used[iid] = 1
    mask = r['jobs']
    jobs = [JOBMAP[i] for i in range(1, 23) if mask >> i & 1]
    allj = len(jobs) == 22
    st = {}
    for k, v in r['stats'].items():
        if k in STATMAP and v:
            st[STATMAP[k]] = v
        elif k == 'Ranged Accuracy' and slot in ('ranged', 'ammo'):
            st['acc'] = st.get('acc', 0) + v
        elif k == 'Ranged Attack' and slot in ('ranged', 'ammo'):
            st['att'] = st.get('att', 0) + v
    for k in ('dmg', 'delay'): st.pop(k, None)
    hq = bool(re.search(r"\+\d$", r['en']))
    lv = LV_OVERRIDE.get(iid, r['level'])
    it = {'name': r['en'], 'kind': 'equip', 'icon': icon(r, slot, wt), 'slot': slot}
    if hq: it['hq'] = True
    if wt:
        if wt == 'instrument' or slot == 'ammo': it['wtype'] = wt if slot != 'ammo' else None
        if slot == 'ammo' and r['damage']: it['dmg'] = r['damage']
        elif slot == 'ranged':
            it['wtype'] = wt
            if wt == 'archery' or wt == 'throwing':
                it['dmg'] = r['damage'] or 1
                it['delay'] = round((r['delay'] or 360) / 120, 1)
        elif slot == 'main' or slot == 'sub':
            it['wtype'] = wt
            if slot == 'main':
                if wt == 'h2h':
                    it['dmg'] = gdmg((r['damage'] or 1) + 3, r['level'], wt)
                    it['delay'] = 2.6
                else:
                    it['dmg'] = gdmg(r['damage'] or 1, r['level'], wt)
                    it['delay'] = gdelay(r['delay'] or 240)
    elif slot == 'ammo' and r['damage']:
        it['dmg'] = r['damage']
    if 'wtype' in it and it['wtype'] is None: del it['wtype']
    it['jobs'] = 'ALL' if allj else jobs
    it['lv'] = lv
    it['price'] = price(lv, slot, hq)
    if st: it['stats'] = st
    plain = not hq and not SPECIAL.search(r['en'])
    it['src'] = 'shop' if plain and slot != 'ammo' or (plain and slot == 'ammo') else 'drop'
    if (r['desc'] or '').find('Enchantment') >= 0 and r['en'] == 'Warp Ring':
        it['enchant'] = 'warp'
        it['desc'] = 'Enchantment: casts Warp. Returns you to your home point.'
    if iid in FLAGS:
        for k, v in FLAGS[iid].items(): it[k] = v
        it['src'] = 'drop'
    items[iid] = it

def js(v):
    if v == 'ALL': return 'ALL_J'
    return json.dumps(v, ensure_ascii=False)

lines = ['const GEAR_DATA = {']
for iid, it in items.items():
    parts = []
    for k, v in it.items():
        if k == 'jobs' and v == 'ALL': parts.append('jobs: "ALL"')
        elif k == 'stats': parts.append('stats: ' + json.dumps(v).replace('"', ''))
        else: parts.append(k + ': ' + json.dumps(v, ensure_ascii=False))
    lines.append('  ' + (iid if not iid[0].isdigit() else '"' + iid + '"') + ': { ' + ', '.join(parts) + ' },')
lines.append('};')
open(out_js, 'w', encoding='utf8').write('\n'.join(lines) + '\n')
c = collections.Counter(i['src'] for i in items.values())
print(len(items), c)
json.dump({k: {'slot': v['slot'], 'lv': v['lv'], 'wtype': v.get('wtype'), 'src': v['src'], 'name': v['name'], 'jobs': v['jobs']} for k, v in items.items()}, open(os.path.join(HERE, 'gear18-index.json'), 'w'))
