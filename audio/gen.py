import numpy as np
from scipy import signal
import subprocess, os, sys, json

SR = 32000
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)

NOTE_IDX = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def hz(n):
    if isinstance(n, (int, float)):
        return 440.0 * 2 ** ((n - 69) / 12)
    name = n[:-1]
    octv = int(n[-1])
    return 440.0 * 2 ** ((NOTE_IDX[name] + 12 * (octv + 1) - 69) / 12)


def midi(n):
    name = n[:-1]
    return NOTE_IDX[name] + 12 * (int(n[-1]) + 1)


def t_arr(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a, d, s, r, sus_len=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    if sus_len is None:
        sus_len = max(0, n - a_n - d_n - r_n)
    env = np.concatenate([
        np.linspace(0, 1, max(1, a_n), endpoint=False),
        np.linspace(1, s, max(1, d_n), endpoint=False),
        np.full(max(0, sus_len), s),
        np.linspace(s, 0, max(1, r_n)),
    ])
    if len(env) < n:
        env = np.concatenate([env, np.zeros(n - len(env))])
    return env[:n]


def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc, SR / 2 - 100) / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, fc, order=2):
    b, a = signal.butter(order, fc / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def saw(f, t, harm=12):
    y = np.zeros_like(t)
    for k in range(1, harm + 1):
        if f * k > SR / 2 - 500:
            break
        y += np.sin(2 * np.pi * f * k * t) / k
    return y * 0.55


def tri(f, t):
    return 2 / np.pi * np.arcsin(np.sin(2 * np.pi * f * t))


def sq(f, t, harm=9):
    y = np.zeros_like(t)
    for k in range(1, harm + 1, 2):
        if f * k > SR / 2 - 500:
            break
        y += np.sin(2 * np.pi * f * k * t) / k
    return y * 0.8


def noise(n):
    return rng.uniform(-1, 1, n)


def pluck(f, dur, bright=0.5, decay=0.996):
    n = int(dur * SR)
    p = max(2, int(SR / f))
    buf = noise(p) * 0.8
    buf = lp(buf, 1500 + 6000 * bright)
    out = np.zeros(n)
    b = buf.copy()
    idx = 0
    for i in range(n):
        out[i] = b[idx]
        nxt = (idx + 1) % p
        b[idx] = decay * 0.5 * (b[idx] + b[nxt])
        idx = nxt
    return out * adsr(n, 0.002, 0.05, 1, 0.05)


def flute(f, dur, vib=5.0):
    t = t_arr(dur)
    n = len(t)
    v = 1 + 0.006 * np.sin(2 * np.pi * vib * t) * np.clip(t / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * v) / SR
    y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    br = lp(noise(n), 3000) * 0.05
    return (y + br) * adsr(n, 0.06, 0.1, 0.85, 0.12)


def strings(f, dur, att=0.25, cut=2500):
    t = t_arr(dur)
    y = sum(saw(f * (1 + d), t, 10) for d in (-0.004, 0.0, 0.005))
    y = lp(y / 3, cut)
    return y * adsr(len(t), att, 0.2, 0.8, min(0.4, dur * 0.4))


def pad(f, dur, att=0.8):
    t = t_arr(dur)
    y = sum(np.sin(2 * np.pi * f * (1 + d) * t) + 0.3 * np.sin(4 * np.pi * f * (1 + d) * t) for d in (-0.003, 0.003))
    return y * 0.5 * adsr(len(t), att, 0.3, 0.9, min(1.0, dur * 0.5))


def brass(f, dur, bright=1.0):
    t = t_arr(dur)
    n = len(t)
    y = saw(f, t, 14) + 0.5 * saw(f * 1.003, t, 14)
    fenv = adsr(n, 0.04, 0.2, 0.6, 0.1)
    out = np.zeros(n)
    seg = 400
    for i in range(0, n, seg):
        fc = 500 + 3200 * bright * fenv[i]
        out[i:i + seg] = lp(y[max(0, i - 200):i + seg], fc)[-len(y[i:i + seg]):]
    return out * adsr(n, 0.03, 0.15, 0.8, 0.12) * 0.7


def bell(f, dur, ratio=3.5, idx=2.5):
    t = t_arr(dur)
    me = np.exp(-t * 4)
    y = np.sin(2 * np.pi * f * t + idx * me * np.sin(2 * np.pi * f * ratio * t))
    return y * np.exp(-t * 2.2) * adsr(len(t), 0.003, 0.0, 1, 0.05)


def bass(f, dur):
    t = t_arr(dur)
    y = np.sin(2 * np.pi * f * t) + 0.35 * tri(f * 2, t) * 0.5
    return y * adsr(len(t), 0.01, 0.1, 0.7, 0.08)


def kick(dur=0.35):
    t = t_arr(dur)
    f = 110 * np.exp(-t * 18) + 45
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) + 0.3 * lp(noise(len(t)), 2000) * np.exp(-t * 60)


def snare(dur=0.25):
    t = t_arr(dur)
    return 0.6 * bp(noise(len(t)), 1200, 7000) * np.exp(-t * 18) + 0.4 * np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)


def hat(dur=0.06):
    t = t_arr(dur)
    return hp(noise(len(t)), 7000) * np.exp(-t * 70) * 0.5


def taiko(dur=0.7):
    t = t_arr(dur)
    f = 80 * np.exp(-t * 3) + 55
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.2 * lp(noise(len(t)), 600)) * np.exp(-t * 5)


def reverb(x, secs=2.2, wet=0.25, damp=3000):
    n = int(secs * SR)
    t = np.arange(n) / SR
    ir = lp(noise(n), damp) * np.exp(-t * (6.9 / secs))
    ir[:int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    w = signal.fftconvolve(x, ir)
    dry = np.zeros(len(w))
    dry[:len(x)] = x
    return dry * (1 - wet) + w * wet * 1.2


class Track:
    def __init__(self, length):
        self.length = length
        self.buf = np.zeros(int((length + 4) * SR))

    def add(self, start, y, gain=1.0):
        i = int(start * SR)
        e = min(len(self.buf), i + len(y))
        self.buf[i:e] += y[:e - i] * gain

    def render(self, rv=2.2, wet=0.25):
        full = reverb(self.buf, rv, wet)
        n = int(self.length * SR)
        loop = full[:n].copy()
        tail = full[n:]
        loop[:min(len(tail), n)] += tail[:n]
        loop = np.tanh(loop / (np.max(np.abs(loop)) + 1e-9) * 1.4) * 0.92
        return loop


def chord_notes(root, kind, octave=3):
    r = midi(root + str(octave))
    iv = {"maj": [0, 4, 7], "min": [0, 3, 7], "dom7": [0, 4, 7, 10], "sus": [0, 5, 7], "min7": [0, 3, 7, 10], "maj7": [0, 4, 7, 11]}[kind]
    return [r + i for i in iv]


def outpost():
    bpm = 92
    beat = 60 / bpm
    bar = 3 * beat
    prog = [("D", "maj"), ("B", "min"), ("G", "maj"), ("A", "maj"), ("D", "maj"), ("F#", "min"), ("G", "maj"), ("A", "dom7"),
            ("B", "min"), ("G", "maj"), ("E", "min"), ("A", "maj"), ("G", "maj"), ("A", "maj"), ("D", "maj"), ("D", "maj")]
    bars = len(prog)
    T = Track(bars * bar)
    mel = [
        [("F#5", 1), ("E5", 1), ("D5", 1)], [("F#5", 2), ("A5", 1)], [("B5", 1.5), ("A5", 0.5), ("G5", 1)], [("E5", 3)],
        [("F#5", 1), ("A5", 1), ("D6", 1)], [("C#6", 2), ("A5", 1)], [("B5", 1), ("G5", 1), ("E5", 1)], [("A5", 3)],
        [("D6", 1.5), ("C#6", 0.5), ("B5", 1)], [("G5", 2), ("B5", 1)], [("A5", 1), ("G5", 1), ("F#5", 1)], [("E5", 3)],
        [("D5", 1), ("E5", 1), ("G5", 1)], [("F#5", 1), ("E5", 1), ("C#5", 1)], [("D5", 3)], [(None, 3)],
    ]
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        ch = chord_notes(root, kind, 3)
        for nt in ch:
            T.add(t0, pad(hz(nt + 12), bar * 1.05, 0.5), 0.07)
        T.add(t0, bass(hz(ch[0] - 12), beat * 2.6), 0.32)
        arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24, ch[2] + 12, ch[1] + 12]
        for i, nt in enumerate(arp):
            T.add(t0 + i * beat / 2, pluck(hz(nt), 1.4, 0.45, 0.997), 0.22)
        tt = t0
        for nt, ln in mel[b]:
            if nt:
                T.add(tt, flute(hz(nt), ln * beat * 0.98), 0.24)
            tt += ln * beat
    return T.render(2.6, 0.3)


def hollow():
    bpm = 104
    beat = 60 / bpm
    bar = 4 * beat
    prog = [("A", "min"), ("F", "maj"), ("C", "maj"), ("G", "maj"), ("A", "min"), ("F", "maj"), ("G", "maj"), ("E", "maj"),
            ("F", "maj"), ("G", "maj"), ("E", "min"), ("A", "min"), ("D", "min"), ("F", "maj"), ("G", "sus"), ("E", "maj")]
    T = Track(len(prog) * bar)
    mel = [
        [("E5", 2), ("A5", 1), ("B5", 1)], [("C6", 3), ("A5", 1)], [("G5", 2), ("E5", 1), ("G5", 1)], [("D5", 4)],
        [("E5", 2), ("A5", 1), ("B5", 1)], [("C6", 2), ("D6", 1), ("C6", 1)], [("B5", 3), ("G5", 1)], [("G#5", 4)],
        [("A5", 1.5), ("C6", 0.5), ("F6", 2)], [("E6", 2), ("D6", 1), ("B5", 1)], [("G5", 2), ("B5", 1), ("E6", 1)], [("C6", 3), ("A5", 1)],
        [("D6", 2), ("A5", 1), ("F5", 1)], [("C6", 2), ("A5", 2)], [("D6", 2), ("C6", 1), ("D6", 1)], [("B5", 4)],
    ]
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        ch = chord_notes(root, kind, 3)
        for nt in ch:
            T.add(t0, strings(hz(nt + 12), bar * 1.02, 0.3, 1800), 0.06)
        for i in range(8):
            nt = ch[[0, 1, 2, 1][i % 4]] + 12
            T.add(t0 + i * beat / 2, strings(hz(nt + 12), beat * 0.45, 0.01, 3500), 0.05)
        for i in range(4):
            T.add(t0 + i * beat, bass(hz(ch[0] - 12 + (7 if i == 2 else 0)), beat * 0.9), 0.3)
        T.add(t0, taiko(), 0.45)
        T.add(t0 + 2 * beat, taiko(), 0.3)
        T.add(t0 + 3.5 * beat, taiko(0.4), 0.18)
        for i in range(8):
            T.add(t0 + i * beat / 2, hat(0.05), 0.1 if i % 2 else 0.05)
        tt = t0
        for nt, ln in mel[b]:
            T.add(tt, brass(hz(nt) / 2, ln * beat * 0.95, 0.8), 0.22)
            tt += ln * beat
    return T.render(2.4, 0.26)


def den():
    bpm = 66
    beat = 60 / bpm
    bar = 4 * beat
    bars = 12
    T = Track(bars * bar)
    roots = ["D", "D", "Bb", "A", "D", "D", "G", "A", "Bb", "G", "A", "A"]
    kinds = ["min", "min", "maj", "maj", "min", "min", "min", "dom7", "maj", "min", "sus", "maj"]
    motif = [("D5", 0), ("F5", 1.5), ("E5", 2.5), ("A4", 3.5)]
    for b in range(bars):
        t0 = b * bar
        ch = chord_notes(roots[b], kinds[b], 2)
        T.add(t0, pad(hz(ch[0]), bar * 1.1, 1.2), 0.22)
        for nt in ch[1:]:
            T.add(t0, pad(hz(nt + 12), bar * 1.1, 1.5), 0.06)
        T.add(t0, taiko(1.0), 0.22)
        T.add(t0 + 0.35, taiko(0.6), 0.12)
        if b % 2 == 0:
            for nt, off in motif:
                m = midi(nt) + (midi(roots[b] + "4") - midi("D4"))
                T.add(t0 + off * beat, bell(hz(m), 2.5, 3.5, 1.8), 0.16)
        else:
            T.add(t0 + 1 * beat, bell(hz(ch[2] + 24), 2.5, 2.0, 1.2), 0.1)
            T.add(t0 + 3 * beat, bell(hz(ch[1] + 24), 2.5, 2.0, 1.2), 0.08)
    t = t_arr(T.length)
    wind = lp(noise(len(t)), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * t / T.length * 3)) * 0.08
    T.add(0, wind, 1.0)
    return T.render(3.5, 0.38)


def battle():
    bpm = 152
    beat = 60 / bpm
    bar = 4 * beat
    prog = [("E", "min"), ("E", "min"), ("C", "maj"), ("D", "maj"), ("E", "min"), ("E", "min"), ("C", "maj"), ("B", "maj"),
            ("A", "min"), ("C", "maj"), ("D", "maj"), ("E", "min"), ("A", "min"), ("C", "maj"), ("D", "maj"), ("B", "dom7")]
    T = Track(len(prog) * bar)
    ost = [0, 0, 12, 0, 7, 0, 10, 12]
    mel = [
        [("B4", 1), ("E5", 1), ("F#5", 1), ("G5", 1)], [("F#5", 2), ("E5", 1), ("D5", 1)], [("E5", 3), ("G5", 1)], [("F#5", 4)],
        [("B4", 1), ("E5", 1), ("F#5", 1), ("G5", 1)], [("A5", 2), ("G5", 1), ("A5", 1)], [("B5", 3), ("G5", 1)], [("D#5", 4)],
        [("E5", 1), ("C5", 1), ("E5", 1), ("A5", 1)], [("G5", 2), ("E5", 2)], [("F#5", 1), ("D5", 1), ("F#5", 1), ("A5", 1)], [("B5", 4)],
        [("C6", 2), ("B5", 1), ("A5", 1)], [("G5", 2), ("E5", 2)], [("F#5", 2), ("A5", 2)], [("B5", 2), ("D#5", 2)],
    ]
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        ch = chord_notes(root, kind, 2)
        for i, o in enumerate(ost):
            T.add(t0 + i * beat / 2, bass(hz(ch[0] + o), beat * 0.45), 0.3)
        for i in range(4):
            T.add(t0 + i * beat, kick(), 0.5 if i % 2 == 0 else 0.3)
            if i % 2 == 1:
                T.add(t0 + i * beat, snare(), 0.32)
        for i in range(8):
            T.add(t0 + i * beat / 2, hat(), 0.12)
        for nt in ch:
            T.add(t0, brass(hz(nt + 12), beat * 0.6, 1.0), 0.07)
            T.add(t0 + 2.5 * beat, brass(hz(nt + 12), beat * 0.5, 0.9), 0.05)
        for i in range(16):
            nt = ch[i % len(ch)] + 24
            T.add(t0 + i * beat / 4, strings(hz(nt), beat * 0.22, 0.005, 4000), 0.025)
        tt = t0
        for nt, ln in mel[b]:
            T.add(tt, brass(hz(nt), ln * beat * 0.92, 1.2), 0.2)
            tt += ln * beat
    return T.render(1.6, 0.18)


def fanfare():
    beat = 60 / 120
    T = Track(4.0)
    seq = [("C5", 0, 0.33), ("C5", 0.33, 0.33), ("C5", 0.66, 0.33), ("C5", 1.0, 0.9), ("Ab4", 2.0, 0.9), ("Bb4", 3.0, 0.9), ("C5", 4.0, 0.66), ("Bb4", 4.66, 0.33), ("C5", 5.0, 2.5)]
    seq = [("E5", 0, 0.33), ("G5", 0.33, 0.33), ("C6", 0.66, 0.9), ("A5", 1.66, 0.33), ("B5", 2.0, 0.33), ("D6", 2.33, 0.9), ("E6", 3.33, 2.5)]
    for nt, st, ln in seq:
        T.add(st * beat, brass(hz(nt), ln * beat, 1.2), 0.35)
        T.add(st * beat, brass(hz(nt) / 2, ln * beat, 0.8), 0.15)
    for nt in ["C4", "E4", "G4", "C5"]:
        T.add(3.33 * beat, strings(hz(nt), 2.4, 0.05, 3000), 0.1)
    T.add(3.33 * beat, taiko(1.2), 0.4)
    full = reverb(T.buf, 1.8, 0.22)[:int(4.0 * SR)]
    full *= np.concatenate([np.ones(len(full) - 3000), np.linspace(1, 0, 3000)])
    return full / (np.max(np.abs(full)) + 1e-9) * 0.9


def env_exp(t, k):
    return np.exp(-t * k)


def norm(y, peak=0.9):
    y = y - np.mean(y)
    fade = min(len(y), int(0.01 * SR))
    y[-fade:] *= np.linspace(1, 0, fade)
    return y / (np.max(np.abs(y)) + 1e-9) * peak


def tri_ph(ph):
    return 2 / np.pi * np.arcsin(np.sin(ph))


def sweep(f0, f1, dur, wave=np.sin):
    t = t_arr(dur)
    f = f0 * (f1 / f0) ** (t / dur)
    return wave(2 * np.pi * np.cumsum(f) / SR)


def sfx_hit_slash():
    t = t_arr(0.35)
    n = len(t)
    s = bp(noise(n), 2000, 7000) * env_exp(t, 30)
    ring = (np.sin(2 * np.pi * 1340 * t) + 0.6 * np.sin(2 * np.pi * 2960 * t) + 0.3 * np.sin(2 * np.pi * 4410 * t)) * env_exp(t, 14) * 0.25
    th = np.sin(2 * np.pi * (140 * env_exp(t, 20) + 60) * t) * env_exp(t, 25) * 0.7
    return norm(s + ring + th)


def sfx_hit_blunt():
    t = t_arr(0.3)
    th = np.sin(2 * np.pi * np.cumsum(120 * env_exp(t, 12) + 55) / SR) * env_exp(t, 14)
    return norm(th + 0.35 * lp(noise(len(t)), 1500) * env_exp(t, 40))


def sfx_hit_crit():
    a = sfx_hit_slash()
    t = t_arr(0.6)
    b = np.zeros(len(t))
    b[:len(a)] += a
    boom = np.sin(2 * np.pi * np.cumsum(90 * env_exp(t, 6) + 38) / SR) * env_exp(t, 6)
    spark = bell(2200, 0.6, 2.7, 1.5) * 0.3
    return norm(b + boom * 0.8 + spark)


def sfx_miss():
    t = t_arr(0.3)
    y = noise(len(t))
    out = np.zeros(len(t))
    for i in range(0, len(t), 320):
        fc = 500 + 2500 * (i / len(t))
        out[i:i + 320] = bp(y[max(0, i - 320):i + 320], fc * 0.6, fc * 1.6)[-len(y[i:i + 320]):]
    return norm(out * np.sin(np.pi * t / 0.3) ** 2, 0.5)


def sfx_ws():
    t = t_arr(1.0)
    n = len(t)
    charge = sweep(200, 900, 0.35, tri_ph) * np.linspace(0, 1, int(0.35 * SR)) * 0.4
    y = np.zeros(n)
    y[:len(charge)] += charge
    i = int(0.35 * SR)
    t2 = t[:n - i]
    boom = np.sin(2 * np.pi * np.cumsum(100 * env_exp(t2, 5) + 40) / SR) * env_exp(t2, 4)
    crunch = bp(noise(len(t2)), 800, 6000) * env_exp(t2, 12)
    y[i:] += boom + 0.6 * crunch
    hs = sfx_hit_slash()
    y[i:i + len(hs)] += hs * 0.6
    return norm(reverb(y, 0.8, 0.2)[:n])


def sfx_skillchain():
    dur = 1.8
    y = np.zeros(int(dur * SR))
    for k, nt in enumerate(["C5", "E5", "G5", "C6", "E6", "G6"]):
        b = bell(hz(nt), 1.4, 2.0, 1.4)
        i = int(k * 0.05 * SR)
        y[i:i + len(b)] += b[:len(y) - i] * 0.3
    t = t_arr(dur)
    boom = np.sin(2 * np.pi * np.cumsum(70 * env_exp(t, 3) + 35) / SR) * env_exp(t, 3)
    y += boom * 0.9
    y += lp(noise(len(t)), 3000) * env_exp(t, 6) * 0.3
    return norm(reverb(y, 1.6, 0.3)[:len(y)])


def sfx_magic_burst():
    dur = 1.4
    t = t_arr(dur)
    y = np.sin(2 * np.pi * np.cumsum(60 * env_exp(t, 2.5) + 40) / SR) * env_exp(t, 3)
    y += bp(noise(len(t)), 300, 5000) * env_exp(t, 5) * 0.6
    for nt in ["A5", "C#6", "E6", "A6"]:
        y += bell(hz(nt), dur, 1.5, 2.0) * 0.18
    return norm(reverb(y, 1.4, 0.3)[:len(y)])


def sfx_cast():
    dur = 0.9
    t = t_arr(dur)
    y = np.zeros(len(t))
    for k in range(5):
        f = 600 + 300 * k
        y += np.sin(2 * np.pi * f * (1 + 0.5 * t) * t) * (0.5 + 0.5 * np.sin(2 * np.pi * (9 + k) * t)) * 0.2
    y *= np.sin(np.pi * t / dur)
    return norm(reverb(y, 0.9, 0.35)[:len(y)], 0.55)


def sfx_cure():
    dur = 1.2
    y = np.zeros(int(dur * SR))
    for k, nt in enumerate(["G5", "B5", "D6", "G6", "B6"]):
        b = bell(hz(nt), 0.9, 1.0, 0.6)
        i = int(k * 0.07 * SR)
        y[i:i + len(b)] += b[:len(y) - i] * 0.3
    t = t_arr(dur)
    y += hp(noise(len(t)), 6000) * np.sin(np.pi * t / dur) * 0.08
    return norm(reverb(y, 1.2, 0.35)[:len(y)])


def sfx_fire():
    dur = 0.9
    t = t_arr(dur)
    roar = lp(noise(len(t)), 900) * adsr(len(t), 0.05, 0.2, 0.6, 0.4)
    crackle = np.zeros(len(t))
    for _ in range(40):
        i = rng.integers(0, len(t) - 200)
        crackle[i:i + 120] += noise(120) * np.exp(-np.arange(120) / 20)
    whoomp = np.sin(2 * np.pi * np.cumsum(80 * env_exp(t, 4) + 50) / SR) * env_exp(t, 6)
    return norm(roar + 0.25 * hp(crackle, 2000) + 0.6 * whoomp)


def sfx_ice():
    dur = 0.9
    y = np.zeros(int(dur * SR))
    for k in range(9):
        f = rng.uniform(2500, 6500)
        b = bell(f, 0.5, 1.41, 1.0)
        i = int(rng.uniform(0, 0.25) * SR)
        y[i:i + len(b)] += b[:len(y) - i] * 0.2
    t = t_arr(dur)
    crack = hp(noise(len(t)), 3000) * env_exp(t, 25)
    return norm(reverb(y + crack * 0.5, 0.9, 0.3)[:len(y)])


def sfx_earth():
    dur = 1.0
    t = t_arr(dur)
    rumble = lp(noise(len(t)), 220) * adsr(len(t), 0.02, 0.2, 0.6, 0.6) * 2.5
    rocks = np.zeros(len(t))
    for _ in range(14):
        i = rng.integers(0, int(0.5 * SR))
        seg = lp(noise(600), 2500) * np.exp(-np.arange(600) / 120)
        rocks[i:i + 600] += seg
    return norm(rumble + 0.6 * rocks)


def sfx_wind():
    dur = 0.9
    t = t_arr(dur)
    y = noise(len(t))
    out = np.zeros(len(t))
    for i in range(0, len(t), 320):
        fc = 300 + 2200 * np.sin(np.pi * i / len(t))
        out[i:i + 320] = bp(y[max(0, i - 320):i + 320], fc * 0.7, fc * 1.4)[-len(y[i:i + 320]):]
    return norm(out * np.sin(np.pi * t / dur))


def sfx_water():
    dur = 0.9
    y = np.zeros(int(dur * SR))
    for _ in range(16):
        f0 = rng.uniform(300, 900)
        d = rng.uniform(0.04, 0.09)
        b = sweep(f0, f0 * 2.2, d) * np.sin(np.pi * t_arr(d) / d)
        i = int(rng.uniform(0, 0.55) * SR)
        y[i:i + len(b)] += b * 0.35
    t = t_arr(dur)
    splash = bp(noise(len(t)), 800, 5000) * env_exp(t, 8) * 0.6
    return norm(y + splash)


def sfx_thunder():
    dur = 1.2
    t = t_arr(dur)
    crack = hp(noise(len(t)), 1500) * env_exp(t, 30)
    rumble = lp(noise(len(t)), 160) * env_exp(t, 2.5) * 3
    zap = sq(1800, t[:int(0.08 * SR)]) * 0.3
    y = crack + rumble
    y[:len(zap)] += zap
    return norm(y)


def sfx_light():
    dur = 1.0
    y = np.zeros(int(dur * SR))
    for nt in ["E5", "G#5", "B5", "E6"]:
        y += bell(hz(nt), dur, 1.0, 0.5) * 0.25
    t = t_arr(dur)
    y += np.sin(2 * np.pi * 1320 * t) * np.sin(np.pi * t / dur) * 0.1 * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t))
    return norm(reverb(y, 1.2, 0.35)[:len(y)])


def sfx_buff():
    dur = 0.6
    t = t_arr(dur)
    y = sweep(300, 1200, dur, tri_ph) * np.sin(np.pi * t / dur) * 0.5
    y += sweep(450, 1800, dur) * np.sin(np.pi * t / dur) * 0.3
    return norm(reverb(y, 0.6, 0.25)[:len(y)], 0.7)


def sfx_provoke():
    dur = 0.45
    t = t_arr(dur)
    f = 180 * (1 + 0.15 * np.sin(2 * np.pi * 7 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(k * ph) / k for k in range(1, 15))
    y = bp(y, 400, 2400) * adsr(len(t), 0.02, 0.1, 0.8, 0.15)
    hb = sfx_hit_blunt()
    m = min(len(hb), len(y))
    y[:m] += 0.4 * hb[:m]
    return norm(y, 0.7)


def sfx_potion():
    dur = 0.7
    y = np.zeros(int(dur * SR))
    for k in range(7):
        f0 = 250 + 60 * k
        d = 0.07
        b = sweep(f0, f0 * 1.8, d) * np.sin(np.pi * t_arr(d) / d)
        i = int(k * 0.08 * SR)
        y[i:i + len(b)] += b * 0.5
    c = bell(hz("C6"), 0.5, 1.0, 0.4)
    i = int(0.55 * SR)
    y[i:] += c[:len(y) - i] * 0.25
    return norm(y, 0.7)


def sfx_aggro():
    t1 = t_arr(0.09)
    a = sq(1046, t1) * adsr(len(t1), 0.003, 0.02, 0.7, 0.03)
    b = sq(1396, t1) * adsr(len(t1), 0.003, 0.02, 0.7, 0.03)
    y = np.concatenate([a, np.zeros(int(0.03 * SR)), b, np.zeros(int(0.1 * SR))])
    return norm(lp(y, 5000), 0.55)


def sfx_tp_ready():
    dur = 0.8
    t = t_arr(dur)
    y = sweep(90, 160, dur, tri_ph) * np.linspace(0, 1, len(t)) ** 1.5
    y += lp(noise(len(t)), 400) * np.linspace(0, 1, len(t)) * 0.5
    return norm(y, 0.7)


def sfx_tp_move():
    dur = 1.0
    t = t_arr(dur)
    boom = np.sin(2 * np.pi * np.cumsum(70 * env_exp(t, 4) + 35) / SR) * env_exp(t, 4)
    y = boom + 0.7 * bp(noise(len(t)), 200, 3000) * env_exp(t, 8)
    hb = sfx_hit_blunt()
    y[:len(hb)] += hb * 0.5
    return norm(y)


def sfx_ko():
    dur = 1.0
    t = t_arr(dur)
    y = sweep(500, 90, dur, tri_ph) * env_exp(t, 2.5) * 0.6
    th = sfx_hit_blunt()
    i = int(0.55 * SR)
    y[i:i + len(th)] += th[:len(y) - i] * 0.8
    return norm(y, 0.75)


def sfx_defeat():
    dur = 0.8
    t = t_arr(dur)
    poof = bp(noise(len(t)), 300, 3000) * adsr(len(t), 0.01, 0.1, 0.4, 0.5) * 0.5
    y = poof + sweep(700, 250, dur) * env_exp(t, 5) * 0.3
    c = bell(hz("E6"), 0.6, 1.0, 0.4) * 0.3
    i = int(0.15 * SR)
    y[i:i + len(c)] += c[:len(y) - i]
    return norm(reverb(y, 0.8, 0.25)[:len(y)], 0.7)


def sfx_zone():
    dur = 1.4
    t = t_arr(dur)
    y = lp(noise(len(t)), 1200) * np.sin(np.pi * t / dur) ** 2
    y += sweep(200, 600, dur) * np.sin(np.pi * t / dur) * 0.2
    return norm(reverb(y, 1.2, 0.3)[:len(y)], 0.6)


def sfx_interrupt():
    dur = 0.35
    t = t_arr(dur)
    y = sq(220, t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 30 * t))) * env_exp(t, 8)
    return norm(lp(y, 3000), 0.5)


def sfx_step():
    dur = 0.12
    t = t_arr(dur)
    return norm(lp(noise(len(t)), 900) * env_exp(t, 45), 0.35)



def hollow_night():
    bpm = 72
    beat = 60 / bpm
    bar = 4 * beat
    prog = [("A", "min"), ("F", "maj7"), ("D", "min7"), ("E", "sus"), ("A", "min"), ("F", "maj7"), ("G", "maj"), ("E", "maj")]
    T = Track(len(prog) * 2 * bar)
    mel = [[("E5", 3), ("C5", 1)], [("A4", 4)], [("D5", 2), ("F5", 2)], [("E5", 4)], [("C5", 2), ("B4", 1), ("A4", 1)], [("C5", 4)], [("D5", 2), ("B4", 2)], [("G#4", 4)]]
    for b in range(len(prog) * 2):
        root, kind = prog[b % len(prog)]
        t0 = b * bar
        ch = chord_notes(root, kind, 3)
        for nt in ch:
            T.add(t0, pad(hz(nt + 12), bar * 1.1, 1.0), 0.07)
        T.add(t0, bass(hz(ch[0] - 12), bar * 0.9), 0.22)
        for i in range(4):
            nt = ch[[0, 2, 1, 2][i]] + 24
            T.add(t0 + i * beat, pluck(hz(nt), 1.8, 0.3, 0.998), 0.12)
        if b >= len(prog):
            tt = t0
            for nt, ln in mel[b % len(prog)]:
                T.add(tt, flute(hz(nt), ln * beat * 0.97, 4.0), 0.2)
                tt += ln * beat
        else:
            T.add(t0 + 2 * beat, bell(hz(ch[2] + 24), 2.5, 2.0, 1.0), 0.07)
    return T.render(3.2, 0.36)


def boss():
    bpm = 168
    beat = 60 / bpm
    bar = 4 * beat
    prog = [("C", "min"), ("C", "min"), ("Ab", "maj"), ("G", "maj"), ("C", "min"), ("C", "min"), ("Bb", "maj"), ("G", "dom7"),
            ("F", "min"), ("Ab", "maj"), ("Eb", "maj"), ("G", "maj"), ("F", "min"), ("Db", "maj"), ("G", "sus"), ("G", "maj")]
    T = Track(len(prog) * bar)
    ost = [0, 12, 0, 13, 0, 12, 7, 6]
    mel = [
        [("G5", 1.5), ("Eb5", 0.5), ("C5", 2)], [("D5", 1), ("Eb5", 1), ("F5", 1), ("G5", 1)], [("Ab5", 3), ("G5", 1)], [("B4", 4)],
        [("G5", 1.5), ("Eb5", 0.5), ("C5", 2)], [("Eb5", 1), ("F5", 1), ("G5", 1), ("C6", 1)], [("D6", 3), ("Bb5", 1)], [("B5", 4)],
        [("C6", 2), ("Ab5", 2)], [("Eb6", 2), ("C6", 2)], [("Bb5", 2), ("G5", 2)], [("D6", 4)],
        [("C6", 1), ("Ab5", 1), ("F5", 1), ("Ab5", 1)], [("Db6", 4)], [("C6", 2), ("D6", 2)], [("B5", 4)],
    ]
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        ch = chord_notes(root, kind, 2)
        for i, o in enumerate(ost):
            T.add(t0 + i * beat / 2, bass(hz(ch[0] + o), beat * 0.45), 0.3)
        for i in range(4):
            T.add(t0 + i * beat, kick(), 0.5)
            if i % 2 == 1:
                T.add(t0 + i * beat, snare(), 0.34)
        T.add(t0, taiko(), 0.5)
        T.add(t0 + 1.5 * beat, taiko(0.5), 0.3)
        for i in range(8):
            T.add(t0 + i * beat / 2, hat(), 0.1)
        for nt in ch:
            T.add(t0, brass(hz(nt + 12), beat * 0.9, 1.1), 0.08)
            T.add(t0, strings(hz(nt + 12), bar, 0.05, 3000), 0.04)
        tt = t0
        for nt, ln in mel[b]:
            T.add(tt, brass(hz(nt), ln * beat * 0.92, 1.3), 0.2)
            T.add(tt, strings(hz(nt) * 2, ln * beat * 0.92, 0.02, 4500), 0.07)
            tt += ln * beat
    return T.render(1.8, 0.2)


def crypt():
    bpm = 58
    beat = 60 / bpm
    bar = 4 * beat
    bars = 12
    T = Track(bars * bar)
    roots = ["E", "E", "C", "B", "E", "E", "A", "B", "C", "A", "F#", "B"]
    kinds = ["min", "min", "maj", "maj", "min", "min", "min", "dom7", "maj", "min", "min", "maj"]
    for b in range(bars):
        t0 = b * bar
        ch = chord_notes(roots[b], kinds[b], 2)
        T.add(t0, strings(hz(ch[0]), bar * 1.05, 1.0, 900), 0.2)
        for nt in ch[1:]:
            T.add(t0, pad(hz(nt + 12), bar * 1.1, 1.8), 0.05)
        T.add(t0, taiko(1.2), 0.18)
        if b % 3 == 0:
            T.add(t0 + 1 * beat, bell(hz(ch[0] + 36), 3.0, 2.71, 2.5), 0.07)
        if b % 2 == 1:
            T.add(t0 + 2.5 * beat, bell(hz(ch[1] + 24), 3.0, 1.41, 1.6), 0.08)
            T.add(t0 + 3.25 * beat, bell(hz(ch[0] + 24), 3.0, 1.41, 1.6), 0.06)
    t = t_arr(T.length)
    drone = lp(noise(len(t)), 220) * 0.12
    T.add(0, drone, 1.0)
    rng = np.random.default_rng(7)
    for i in range(18):
        d = bell(hz("C7") * (1 + rng.random() * 0.6), 0.5, 1.0, 0.3) * env_exp(t_arr(0.5), 12)
        T.add(rng.random() * (T.length - 1), d, 0.05)
    return T.render(4.2, 0.45)


def residence():
    bpm = 84
    beat = 60 / bpm
    bar = 3 * beat
    prog = [("F", "maj7"), ("D", "min7"), ("Bb", "maj7"), ("C", "dom7"), ("F", "maj7"), ("A", "min7"), ("Bb", "maj"), ("C", "sus"),
            ("D", "min7"), ("Bb", "maj7"), ("G", "min7"), ("C", "dom7"), ("A", "min7"), ("D", "min7"), ("G", "min7"), ("C", "dom7")]
    T = Track(len(prog) * bar)
    mel = [
        [("A5", 1), ("C6", 1), ("A5", 1)], [("F5", 3)], [("D5", 1), ("F5", 1), ("A5", 1)], [("G5", 3)],
        [("A5", 1), ("C6", 1), ("E6", 1)], [("D6", 2), ("C6", 1)], [("Bb5", 1), ("A5", 1), ("F5", 1)], [("G5", 3)],
        [("F5", 1), ("A5", 1), ("D6", 1)], [("C6", 2), ("A5", 1)], [("Bb5", 1), ("G5", 1), ("D5", 1)], [("E5", 3)],
        [("C6", 1.5), ("B5", 0.5), ("A5", 1)], [("F5", 2), ("A5", 1)], [("G5", 1), ("F5", 1), ("D5", 1)], [("E5", 2), (None, 1)],
    ]
    for b, (root, kind) in enumerate(prog):
        t0 = b * bar
        ch = chord_notes(root, kind, 3)
        T.add(t0, bass(hz(ch[0] - 12), beat * 1.5), 0.22)
        for i in (1, 2):
            for nt in ch[1:]:
                T.add(t0 + i * beat, pluck(hz(nt + 12), 0.9, 0.35, 0.995), 0.08)
        tt = t0
        for nt, ln in mel[b]:
            if nt:
                T.add(tt, bell(hz(nt), ln * beat * 1.4, 4.0, 1.2), 0.13)
                T.add(tt, flute(hz(nt) / 2, ln * beat * 0.95, 3.0), 0.07)
            tt += ln * beat
    return T.render(2.2, 0.28)


def amb_day():
    dur = 20.0
    t = t_arr(dur)
    y = lp(noise(len(t)), 700) * (0.55 + 0.45 * np.sin(2 * np.pi * t / dur * 2) ** 2) * 0.35
    rng = np.random.default_rng(3)
    for i in range(16):
        st = rng.random() * (dur - 1.2)
        f0 = 2600 + rng.random() * 1800
        n = rng.integers(2, 5)
        for k in range(n):
            cd = 0.07 + rng.random() * 0.06
            ct = t_arr(cd)
            ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(np.pi * ct / cd)) ) / SR) * np.sin(np.pi * ct / cd) ** 2
            i0 = int((st + k * (cd + 0.05)) * SR)
            y[i0:i0 + len(ch)] += ch[:len(y) - i0] * 0.18
    fade = int(0.5 * SR)
    y[:fade] = y[:fade] * np.linspace(0, 1, fade) + y[-fade:] * np.linspace(1, 0, fade)
    return norm(y[:len(y) - fade], 0.5)


def amb_night():
    dur = 16.0
    t = t_arr(dur)
    y = lp(noise(len(t)), 400) * 0.18
    for f, rate, ph in ((4300, 2.6, 0.0), (4700, 3.1, 1.3), (3900, 2.2, 2.1)):
        gate = (np.sin(2 * np.pi * rate * t + ph) > 0.2) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.13 * t + ph))
        trill = (np.sin(2 * np.pi * 38 * t) > 0)
        y += np.sin(2 * np.pi * f * t) * gate * trill * 0.06
    fade = int(0.5 * SR)
    y[:fade] = y[:fade] * np.linspace(0, 1, fade) + y[-fade:] * np.linspace(1, 0, fade)
    return norm(lp(y[:len(y) - fade], 6000), 0.45)


def amb_cave():
    dur = 18.0
    t = t_arr(dur)
    y = lp(noise(len(t)), 160) * 0.6
    rng = np.random.default_rng(11)
    for i in range(14):
        dd = 0.25
        dt = t_arr(dd)
        f = 900 + rng.random() * 900
        d = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * env_exp(dt, 30))) / SR) * env_exp(dt, 22)
        i0 = int(rng.random() * (dur - 1) * SR)
        y[i0:i0 + len(d)] += d * 0.25
    y = reverb(y, 2.5, 0.4)[:len(t)]
    fade = int(0.5 * SR)
    y[:fade] = y[:fade] * np.linspace(0, 1, fade) + y[-fade:] * np.linspace(1, 0, fade)
    return norm(y[:len(y) - fade], 0.5)


def sfx_whistle():
    d1 = 0.22
    t1 = t_arr(d1)
    a = np.sin(2 * np.pi * np.cumsum(1500 + 700 * t1 / d1) / SR) * np.sin(np.pi * t1 / d1)
    d2 = 0.35
    t2 = t_arr(d2)
    b = np.sin(2 * np.pi * np.cumsum(2200 - 500 * t2 / d2 + 30 * np.sin(2 * np.pi * 7 * t2)) / SR) * np.sin(np.pi * t2 / d2)
    y = np.concatenate([a, np.zeros(int(0.06 * SR)), b])
    y += bp(noise(len(y)), 1500, 3000) * 0.06
    return norm(reverb(y, 1.0, 0.25)[:len(y) + int(0.2 * SR)], 0.6)


def sfx_hoof():
    dur = 0.16
    t = t_arr(dur)
    y = np.sin(2 * np.pi * np.cumsum(140 * env_exp(t, 25) + 60) / SR) * env_exp(t, 30)
    y += lp(noise(len(t)), 1500) * env_exp(t, 50) * 0.6
    return norm(y, 0.5)


def sfx_levelup():
    beat = 0.11
    T = Track(2.0)
    for i, nt in enumerate(["C5", "E5", "G5", "C6", "E6", "G6"]):
        T.add(i * beat, bell(hz(nt), 1.4, 1.0, 0.6), 0.25)
        T.add(i * beat, pluck(hz(nt), 1.0, 0.6, 0.996), 0.15)
    for nt in ["C4", "G4", "C5", "E5"]:
        T.add(6 * beat, strings(hz(nt), 1.2, 0.05, 3500), 0.12)
    full = reverb(T.buf, 1.6, 0.3)[:int(2.0 * SR)]
    full *= np.concatenate([np.ones(len(full) - 4000), np.linspace(1, 0, 4000)])
    return norm(full, 0.85)


def sfx_quest():
    T = Track(1.4)
    for i, nt in enumerate(["G5", "C6", "E6"]):
        T.add(i * 0.12, bell(hz(nt), 1.0, 2.0, 1.0), 0.3)
    full = reverb(T.buf, 1.4, 0.3)[:int(1.4 * SR)]
    return norm(full, 0.7)


def sfx_loot():
    T = Track(0.7)
    T.add(0, bell(hz("E6"), 0.5, 3.0, 1.5), 0.3)
    T.add(0.07, bell(hz("B6"), 0.5, 3.0, 1.5), 0.25)
    full = reverb(T.buf, 0.8, 0.2)[:int(0.7 * SR)]
    return norm(full, 0.6)


def sfx_equip():
    dur = 0.3
    t = t_arr(dur)
    y = bp(noise(len(t)), 2000, 7000) * env_exp(t, 30) * 0.5
    y += bell(hz("A5"), dur, 5.1, 2.0)[:len(t)] * 0.35
    i = int(0.08 * SR)
    y[i:] += bp(noise(len(t) - i), 1500, 5000) * env_exp(t[:len(t) - i], 40) * 0.4
    return norm(y, 0.55)


def sfx_jump():
    dur = 0.28
    t = t_arr(dur)
    y = bp(noise(len(t)), 600, 3500) * np.sin(np.pi * t / dur) ** 2 * 0.6
    y += lp(noise(len(t)), 500) * env_exp(t, 35) * 0.7
    return norm(y, 0.45)


SFX = {
    "hit_slash": sfx_hit_slash, "hit_blunt": sfx_hit_blunt, "hit_crit": sfx_hit_crit, "miss": sfx_miss,
    "ws": sfx_ws, "skillchain": sfx_skillchain, "magic_burst": sfx_magic_burst, "cast": sfx_cast, "cure": sfx_cure,
    "fire": sfx_fire, "ice": sfx_ice, "earth": sfx_earth, "wind": sfx_wind, "water": sfx_water, "lightning": sfx_thunder,
    "light": sfx_light, "buff": sfx_buff, "provoke": sfx_provoke, "potion": sfx_potion, "aggro": sfx_aggro,
    "tp_ready": sfx_tp_ready, "tp_move": sfx_tp_move, "ko": sfx_ko, "defeat": sfx_defeat, "zone": sfx_zone,
    "interrupt": sfx_interrupt, "step": sfx_step,
    "whistle": sfx_whistle, "hoof": sfx_hoof, "levelup": sfx_levelup, "quest": sfx_quest, "loot": sfx_loot, "equip": sfx_equip, "jump": sfx_jump,
}

MUSIC = {"outpost": outpost, "hollow": hollow, "den": den, "battle": battle, "hollow_night": hollow_night, "boss": boss, "crypt": crypt, "residence": residence}

AMB = {"day": amb_day, "night": amb_night, "cave": amb_cave}


def write_wav(path, y):
    from scipy.io import wavfile
    wavfile.write(path, SR, (np.clip(y, -1, 1) * 32767).astype(np.int16))


def encode(src, dst, kbps):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", dst], check=True)


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    if which in ("all", "sfx"):
        for name, fn in SFX.items():
            y = fn()
            w = os.path.join(OUT, f"sfx_{name}.wav")
            write_wav(w, y)
            encode(w, w.replace(".wav", ".mp3"), 64)
        y = fanfare()
        w = os.path.join(OUT, "sfx_fanfare.wav")
        write_wav(w, y)
        encode(w, w.replace(".wav", ".mp3"), 64)
    if which in ("all", "music") or which in MUSIC:
        for name, fn in MUSIC.items():
            if which in MUSIC and which != name:
                continue
            y = fn()
            w = os.path.join(OUT, f"music_{name}.wav")
            write_wav(w, y)
            encode(w, w.replace(".wav", ".mp3"), 48)
            print(name, round(len(y) / SR, 1), "s")
    if which in ("all", "amb"):
        for name, fn in AMB.items():
            y = fn()
            w = os.path.join(OUT, f"amb_{name}.wav")
            write_wav(w, y)
            encode(w, w.replace(".wav", ".mp3"), 40)
            print(name, round(len(y) / SR, 1), "s")
