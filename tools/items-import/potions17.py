import sys

HP = [('potion', 'Potion', [50, 60, 75, 100], 130, '🧪'), ('hi_potion', 'Hi-Potion', [100, 110, 120, 130], 250, '⚗️'), ('x_potion', 'X-Potion', [150, 160, 170, 180], 362, '⚗️'), ('max_potion', 'Max-Potion', [500, 550, 650, 700], 5162, '⚗️')]
MP = [('ether', 'Ether', [20, 25, 30, 40], 604, '💧'), ('hi_ether', 'Hi-Ether', [50, 55, 60, 70], 1000, '💧'), ('super_ether', 'Super Ether', [100, 105, 110, 120], 1325, '💧'), ('pro_ether', 'Pro-Ether', [250, 280, 310, 350], 1450, '💧')]
SUFFIX = ['', '_hq', '_hq2', '_hq3']
LABEL = ['', ' +1', ' +2', ' +3']
FACTOR = 40 / 130

def line(iid, name, icon, fields, price, desc, hq):
    f = ', '.join(k + ': ' + (str(v) if not isinstance(v, str) else '"' + v + '"') for k, v in fields)
    return '  ' + iid + ': { name: "' + name + '", kind: "use", icon: "' + icon + '", ' + ('hq: true, ' if hq else '') + f + ', price: ' + str(price) + ', stack: 12, desc: "' + desc + '" },'

def build():
    out = []
    for iid, name, vals, base, icon in HP:
        for i in range(4):
            price = round(base * FACTOR * vals[i] / vals[0])
            out.append(line(iid + SUFFIX[i], name + LABEL[i], icon, [('heal', vals[i])], price, 'Restores ' + str(vals[i]) + ' HP.', i > 0))
    for iid, name, vals, base, icon in MP:
        for i in range(4):
            price = round(base * FACTOR * vals[i] / vals[0])
            out.append(line(iid + SUFFIX[i], name + LABEL[i], icon, [('mpRestore', vals[i])], price, 'Restores ' + str(vals[i]) + ' MP.', i > 0))
    out.append(line('elixir', 'Elixir', '🍷', [('healPct', 0.25), ('mpPct', 0.25)], round(7000 * FACTOR), 'Restores 25% of your HP and MP.', False))
    out.append(line('hi_elixir', 'Hi-Elixir', '🍷', [('healPct', 0.5), ('mpPct', 0.5)], round(9500 * FACTOR), 'Restores 50% of your HP and MP.', False))
    out.append(line('reraiser', 'Reraiser', '🪽', [('reraise', 0.5), ('rrSecs', 3600)], 400, 'Reraise for 60 minutes: if you are KO\'d you stand back up with half your HP. Not sold yet.', False))
    out.append(line('hi_reraiser', 'Hi-Reraiser', '🪽', [('reraise', 1), ('rrSecs', 5400)], 1200, 'A stronger Reraise for 90 minutes: you stand back up with full HP. Not sold yet.', False))
    out.append(line('super_reraiser', 'Super Reraiser', '🪽', [('reraise', 1), ('rrSecs', 3600)], 3000, 'The strongest Reraise for 60 minutes. Not sold yet.', False))
    return '\n'.join(out) + '\n'

if __name__ == '__main__':
    sys.stdout.write(build())
