import re, json, sys

GAME_JOBS = {3: 'WHM', 4: 'BLM', 5: 'RDM', 7: 'PLD', 8: 'DRK', 10: 'BRD', 15: 'SMN'}
ELEMENTS = {0: 'fire', 1: 'ice', 2: 'wind', 3: 'earth', 4: 'lightning', 5: 'water', 6: 'light', 7: 'dark'}
LEVEL_CAP = 20

def load_spells(path):
    text = open(path, encoding='utf8').read()
    out = {}
    for m in re.finditer(r'\[(\d+)\] = \{(.*)\},?\s*$', text, re.M):
        body = m.group(2)
        d = {}
        for k in ('en', 'type', 'element', 'mp_cost', 'cast_time', 'recast', 'duration'):
            mm = re.search(r'\b' + k + r'=("[^"]*"|-?[\d.]+)', body)
            if mm:
                v = mm.group(1)
                d[k] = v.strip('"') if v.startswith('"') else float(v)
        lv = re.search(r'levels=\{([^}]*)\}', body)
        levels = {}
        if lv:
            for k, v in re.findall(r'\[(\d+)\]=(\d+)', lv.group(1)):
                if int(k) in GAME_JOBS and int(v) <= LEVEL_CAP:
                    levels[GAME_JOBS[int(k)]] = int(v)
        d['levels'] = levels
        out[d['en']] = d
    return out

def num(v):
    return int(v) if float(v) == int(v) else float(v)

def js(v):
    if isinstance(v, dict):
        return '{ ' + ', '.join(k + ': ' + js(x) for k, x in v.items()) + ' }'
    if isinstance(v, list):
        return '[' + ', '.join(js(x) for x in v) + ']'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, str):
        return json.dumps(v, ensure_ascii=False)
    if v is None:
        return 'null'
    return repr(v) if isinstance(v, float) else str(v)

CURE1 = {'min': 10, 't': [[20, 4, 10, 0], [40, 1.3333, 15, 20], [125, 8.5, 30, 40], [200, 15, 40, 125], [600, 20, 40, 200], [1e9, 999999, 65, 0]]}
CURE2 = {'min': 60, 't': [[70, 1, 60, 40], [125, 5.5, 90, 70], [200, 7.5, 100, 125], [400, 10, 110, 200], [700, 20, 130, 400], [1e9, 999999, 145, 0]]}

def nuke(power, k, k2, stat='int'):
    return {'kind': 'nuke', 'power': power, 'k': k, 'k2': k2, 'stat': stat}

SPEC = [
    ('cure', 'Cure', {'kind': 'heal', 'cure': CURE1, 'target': 'ally', 'desc': 'Restores HP. Healing power comes from half your MND, a quarter of your VIT and your Healing Magic skill.'}),
    ('cure2', 'Cure II', {'kind': 'heal', 'cure': CURE2, 'target': 'ally', 'desc': 'Restores a good amount of HP.'}),
    ('dia', 'Dia', {'kind': 'dot', 'element': 'light', 'power': 1, 'dot': {'dur': 60, 'tick': 1}, 'buff': 'dia', 'target': 'enemy', 'desc': 'Light damage, then 1 damage every 3 s for 60 s. Lowers the target\'s defense by 10%. Replaces Bio.'}),
    ('banish', 'Banish', {'kind': 'nuke', 'element': 'light', 'power': 14, 'k': 1, 'k2': 1, 'stat': 'mnd', 'target': 'enemy', 'skill': 'divine', 'desc': 'Light damage. Undead take 50% more.'}),
    ('protect', 'Protect', {'kind': 'buff', 'buff': 'protect', 'pow': 15, 'target': 'ally', 'desc': 'Defense +15 for 30 minutes.'}),
    ('shell', 'Shell', {'kind': 'buff', 'buff': 'shell', 'pow': 0.11, 'target': 'ally', 'desc': 'Elemental damage taken -11% for 30 minutes.'}),
    ('slow', 'Slow', {'kind': 'debuff', 'element': 'earth', 'buff': 'slow', 'stat': 'mnd', 'enmity': 80, 'target': 'enemy', 'desc': 'Slows the target\'s attacks by 7% to 29% (more when your MND beats its MND).'}),
    ('paralyze', 'Paralyze', {'kind': 'debuff', 'element': 'ice', 'buff': 'paralyze', 'stat': 'mnd', 'enmity': 80, 'target': 'enemy', 'desc': 'The target loses 5% to 25% of its attacks to paralysis (more when your MND beats its MND).'}),
    ('stone', 'Stone', dict(nuke(10, 2, 1), element='earth', target='enemy', desc='Earth damage. Grows with how far your INT is above the target\'s.')),
    ('water', 'Water', dict(nuke(25, 1.8, 1), element='water', target='enemy', desc='Water damage.')),
    ('aero', 'Aero', dict(nuke(40, 1.6, 1), element='wind', target='enemy', desc='Wind damage.')),
    ('fire', 'Fire', dict(nuke(55, 1.4, 1), element='fire', target='enemy', desc='Fire damage.')),
    ('blizzard', 'Blizzard', dict(nuke(70, 1.2, 1), element='ice', target='enemy', desc='Ice damage.')),
    ('poison', 'Poison', {'kind': 'dot', 'element': 'water', 'power': 0, 'dot': {'dur': 90, 'skill': 'enfeebling', 'div': 25, 'min': 1}, 'buff': 'poison', 'target': 'enemy', 'skill': 'enfeebling', 'desc': 'Poisons the target: damage every 3 s for 90 s, stronger with Enfeebling Magic skill.'}),
    ('bio', 'Bio', {'kind': 'dot', 'element': 'dark', 'power': 10, 'dot': {'dur': 60, 'skill': 'dark', 'div': 40, 'ceil': True, 'min': 1, 'max': 3}, 'buff': 'blight', 'target': 'enemy', 'skill': 'dark', 'desc': 'Dark damage, then up to 3 damage every 3 s for 60 s. Lowers the target\'s attack by 10%. Replaces Dia.'}),
    ('drain', 'Drain', {'kind': 'drain', 'element': 'dark', 'absorb': [1, 20], 'target': 'enemy', 'skill': 'dark', 'desc': 'Steals HP from the target. Ineffective against undead.'}),
    ('aspir', 'Aspir', {'kind': 'aspir', 'element': 'dark', 'absorb': [0.3, 20], 'target': 'enemy', 'skill': 'dark', 'desc': 'Steals MP from the target. Ineffective against undead.'}),
    ('blind', 'Blind', {'kind': 'debuff', 'element': 'dark', 'buff': 'flash', 'stat': 'int', 'enmity': 60, 'target': 'enemy', 'desc': 'Lowers the target\'s accuracy by 5% to 50% (more when your INT beats its INT).'}),
    ('bind', 'Bind', {'kind': 'debuff', 'element': 'ice', 'buff': 'bind', 'enmity': 60, 'target': 'enemy', 'desc': 'Holds the target in place.'}),
    ('sleep', 'Sleep', {'kind': 'debuff', 'element': 'dark', 'buff': 'sleep', 'enmity': 60, 'target': 'enemy', 'desc': 'Puts the target to sleep. Any damage wakes it. Bosses are immune.'}),
    ('knights_minne', "Knight's Minne", {'kind': 'song', 'song': 'minne', 'base': 8, 'sreq': 0, 'cap': 30, 'mult': 3, 'div': 10, 'target': 'self', 'skill': 'singing', 'desc': 'Party song: defense +8, rising with Singing skill.'}),
    ('valor_minuet', 'Valor Minuet', {'kind': 'song', 'song': 'minuet', 'base': 5, 'sreq': 50, 'cap': 32, 'mult': 3, 'div': 4.3, 'target': 'self', 'skill': 'singing', 'desc': 'Party song: attack +5, rising with Singing skill.'}),
    ('armys_paeon', "Army's Paeon", {'kind': 'song', 'song': 'paeon', 'base': 1, 'sreq': 100, 'cap': 2, 'mult': 1, 'div': 0, 'target': 'self', 'skill': 'singing', 'desc': 'Party song: restores 1 HP every 3 s.'}),
    ('armys_paeon2', "Army's Paeon II", {'kind': 'song', 'song': 'paeon', 'base': 2, 'sreq': 150, 'cap': 3, 'mult': 1, 'div': 0, 'target': 'self', 'skill': 'singing', 'desc': 'Party song: restores 2 HP every 3 s.'}),
    ('sword_madrigal', 'Sword Madrigal', {'kind': 'song', 'song': 'madrigal', 'base': 5, 'sreq': 85, 'cap': 45, 'mult': 4.5, 'div': 18, 'target': 'self', 'skill': 'singing', 'desc': 'Party song: accuracy +5, rising with Singing skill.'}),
    ('foe_lullaby', 'Foe Lullaby', {'kind': 'debuff', 'element': 'light', 'buff': 'sleep', 'enmity': 60, 'target': 'enemy', 'skill': 'singing', 'desc': 'Lulls the target to sleep. Any damage wakes it. Bosses are immune.'}),
]

SPIRITS = [('fire_spirit', 'Fire Spirit', 'ember'), ('ice_spirit', 'Ice Spirit', 'frost'), ('air_spirit', 'Air Spirit', 'gale'), ('earth_spirit', 'Earth Spirit', 'stone'), ('thunder_spirit', 'Thunder Spirit', 'thunder'), ('water_spirit', 'Water Spirit', 'water'), ('light_spirit', 'Light Spirit', 'light'), ('dark_spirit', 'Dark Spirit', 'dark')]

def build(spells_path):
    src = load_spells(spells_path)
    lines = []
    for sid, name, extra in SPEC:
        w = src[name]
        if not w['levels']:
            raise SystemExit('no game job for ' + name)
        o = {'name': name, 'jobs': w['levels'], 'mp': num(w['mp_cost']), 'cast': num(w['cast_time']), 'recast': num(w['recast'])}
        e = dict(extra)
        if 'dot' in e:
            e['dot'] = dict(e['dot'])
        if 'buff' in e and e['kind'] in ('buff', 'debuff') and 'duration' in w:
            e['dur'] = num(w['duration'])
        if e['kind'] == 'song':
            e['dur'] = num(w['duration'])
        if e['kind'] == 'debuff' and 'duration' in w and 'dur' not in e:
            e['dur'] = num(w['duration'])
        if e['kind'] == 'dot':
            e['dot']['dur'] = num(w['duration'])
        o.update(e)
        lines.append('  ' + sid + ': ' + js(o))
    for sid, name, pet in SPIRITS:
        w = src[name]
        o = {'name': name, 'jobs': w['levels'], 'mp': num(w['mp_cost']), 'cast': num(w['cast_time']), 'recast': num(w['recast']), 'kind': 'summon', 'element': ELEMENTS[int(w['element'])], 'pet': pet, 'target': 'self', 'desc': 'Calls a ' + name.split()[0].lower() + ' spirit to fight beside you. It slowly drains your MP.'}
        lines.append('  ' + sid + ': ' + js(o))
    return 'const SPELLS = {\n' + ',\n'.join(lines) + '\n};\n'

if __name__ == '__main__':
    sys.stdout.write(build(sys.argv[1]))
