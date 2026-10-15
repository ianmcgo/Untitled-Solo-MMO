import re, json, sys

def load(path):
    return open(path, encoding='utf8').read()

def parse_items(text):
    out = {}
    for m in re.finditer(r'\[(\d+)\] = \{(.*)\},?\s*$', text, re.M):
        body = m.group(2)
        row = {}
        for k, v in re.findall(r'(\w+)=("(?:[^"\\]|\\.)*"|-?\d+)', body):
            row[k] = v[1:-1] if v.startswith('"') else int(v)
        out[int(m.group(1))] = row
    return out

def parse_desc(text):
    out = {}
    for m in re.finditer(r'\[(\d+)\] = \{id=\d+,en="((?:[^"\\]|\\.)*)"', text):
        out[int(m.group(1))] = m.group(2).replace('\\n', ' ').replace('\\"', '"')
    return out

STATS = ['STR','DEX','VIT','AGI','INT','MND','CHR','HP','MP','Accuracy','Attack','Evasion','Defense','Magic Accuracy','Magic Atk. Bonus','Magic Def. Bonus','Haste','Enmity','Ranged Accuracy','Ranged Attack']

def parse_stats(desc):
    s = {}
    m = re.search(r'DEF:(\d+)', desc)
    if m: s['DEF'] = int(m.group(1))
    m = re.search(r'DMG:\+?(-?\d+)', desc)
    if m: s['DMG'] = int(m.group(1))
    m = re.search(r'Delay:\+?(-?\d+)', desc)
    if m: s['Delay'] = int(m.group(1))
    for name in STATS:
        for m in re.finditer(re.escape(name) + r'([+-]\d+)(%?)', desc):
            key = name + ('%' if m.group(2) else '')
            s[key] = s.get(key, 0) + int(m.group(1))
    for m in re.finditer(r'"?([A-Z][a-z]+(?: [A-Z][a-z]+)?) (?:skill|Skill) ([+-]\d+)', desc):
        s['skill:' + m.group(1)] = int(m.group(2))
    s['latent'] = 'Latent effect' in desc
    s['special'] = bool(re.search(r'Additional effect|Enhances|Set:|Augments|Adds|Occ\.|Unique|Effect', desc))
    return s

def main(items_path, desc_path, out_path):
    items = parse_items(load(items_path))
    desc = parse_desc(load(desc_path))
    rows = []
    for i, it in items.items():
        if it.get('category') not in ('Weapon', 'Armor'):
            continue
        d = desc.get(i, '')
        rows.append({'id': i, 'en': it['en'], 'cat': it['category'], 'level': it.get('level'), 'jobs': it.get('jobs'), 'slots': it.get('slots'), 'races': it.get('races'), 'skill': it.get('skill'), 'damage': it.get('damage'), 'delay': it.get('delay'), 'item_level': it.get('item_level'), 'stats': parse_stats(d), 'desc': d})
    json.dump(rows, open(out_path, 'w'), ensure_ascii=False)
    print(len(items), len(rows))

if __name__ == '__main__':
    main(*sys.argv[1:4])
