"""Sintetiza los efectos de sonido del reel de Haly's.

Uso: python3 scripts/sfx.py public/sfx

Todo es sintético (sin samples de terceros), así que no hay licencias que
cuidar. Cada efecto se guarda como WAV estéreo 48 kHz normalizado; el
volumen final de cada uno se ajusta en src/Soundtrack.tsx.
"""
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)

# Notas (Hz) de la escala pentatónica de Do, para que todo suene "afinado".
C5, D5, E5, G5, A5, C6 = 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5


def tt(dur):
    return np.arange(int(SR * dur)) / SR


def osc(freq, harmonics=(1.0,)):
    """Oscilador con frecuencia variable en el tiempo (array) y armónicos."""
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return sum(a * np.sin((k + 1) * phase) for k, a in enumerate(harmonics))


def noise(n):
    return rng.standard_normal(n)


def band(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='bandpass', fs=SR, output='sos')
    return signal.sosfilt(sos, x)


def lowpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='lowpass', fs=SR, output='sos'), x)


def highpass(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype='highpass', fs=SR, output='sos'), x)


def adsr(n, attack, tau):
    t = np.arange(n) / SR
    return (1 - np.exp(-t / max(attack, 1e-4))) * np.exp(-t / tau)


def norm(x, peak=0.89):
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[: len(p)] += p
    return out


def place(n, items):
    """items: (inicio_en_segundos, señal). Devuelve la mezcla de largo n."""
    out = np.zeros(n)
    for start, x in items:
        i = int(start * SR)
        j = min(n, i + len(x))
        out[i:j] += x[: j - i]
    return out


def stereo(x, pan=0.0):
    """pan: escalar o array en [-1, 1] (izquierda a derecha)."""
    p = (np.asarray(pan) + 1) * np.pi / 4
    return np.stack([x * np.cos(p), x * np.sin(p)], axis=1)


def save(outdir, name, x, pan=0.0):
    if x.ndim == 1:
        x = stereo(norm(x), pan)
    x = norm(x)
    fade = int(0.006 * SR)
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    wavfile.write(os.path.join(outdir, f'{name}.wav'), SR, (x * 32767).astype(np.int16))


# ---------------------------------------------------------------- efectos

def pop(f_end, dur=0.18):
    """Burbuja que sube de tono rápido: las letras al aparecer."""
    t = tt(dur)
    f = f_end * (0.45 + 0.55 * (1 - np.exp(-t / 0.011)))
    body = osc(f, (1.0, 0.22, 0.06)) * adsr(len(t), 0.0015, 0.05)
    click = highpass(noise(len(t)), 2500) * np.exp(-t / 0.0018) * 0.25
    return body + click


def whoosh(dur, f_from, f_to, peak_at=0.55, width_oct=1.1, pan=(-0.5, 0.5), air=0.0):
    """Ruido filtrado con una banda que barre de f_from a f_to."""
    n = int(SR * dur)
    f, frames, Z = signal.stft(noise(n), SR, nperseg=1024)
    prog = np.clip(frames / dur, 0, 1)
    fc = f_from * (f_to / f_from) ** prog
    logf = np.log2(np.maximum(f, 20))[:, None]
    Z *= np.exp(-0.5 * ((logf - np.log2(fc)[None, :]) / (width_oct / 2)) ** 2)
    _, y = signal.istft(Z, SR, nperseg=1024)
    y = y[:n]
    if air:
        y += air * highpass(noise(n), 5000) * np.std(y)
    p = np.linspace(0, 1, n)
    env = np.where(p < peak_at, (p / peak_at) ** 2, ((1 - p) / (1 - peak_at)) ** 1.6)
    y = norm(y * env)
    return stereo(y, np.interp(p, [0, 1], pan))


def boom(dur=1.0, f0=72, f1=36, tau=0.32):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.08)
    body = osc(f, (1.0, 0.3)) * adsr(len(t), 0.004, tau)
    hit = lowpass(noise(len(t)), 300) * np.exp(-t / 0.03) * 0.8
    return np.tanh(1.6 * (body + hit))


def thud(f0=150, f1=58, tau=0.09, grit=0.6):
    """Capa de hamburguesa que aterriza: golpe blandito."""
    t = tt(0.4)
    f = f1 + (f0 - f1) * np.exp(-t / 0.025)
    body = osc(f, (1.0, 0.35)) * adsr(len(t), 0.002, tau)
    hit = lowpass(noise(len(t)), 700) * np.exp(-t / 0.014) * grit
    return np.tanh(1.8 * (body + hit))


def splat():
    """Queso: aplastón húmedo."""
    t = tt(0.35)
    squish = band(noise(len(t)), 300, 1400) * np.exp(-t / 0.05)
    squish *= 1 + 0.6 * np.sin(2 * np.pi * 38 * t)
    f = 120 + 200 * np.exp(-t / 0.03)
    body = osc(f) * adsr(len(t), 0.002, 0.06)
    return squish * 0.9 + body * 0.8


def plip():
    """Tomate: golpecito jugoso."""
    t = tt(0.25)
    f = 330 + 420 * np.exp(-t / 0.018)
    body = osc(f, (1.0, 0.2)) * adsr(len(t), 0.0015, 0.045)
    wet = band(noise(len(t)), 900, 3000) * np.exp(-t / 0.02) * 0.4
    return body + wet + 0.6 * thud(120, 60, 0.05, 0.3)[: len(t)]


def crunch():
    """Lechuga: crujido de granitos de ruido."""
    n = int(0.28 * SR)
    grains = []
    for _ in range(46):
        start = rng.uniform(0, 0.16) ** 1.4 * 1.6
        g = int(rng.uniform(0.001, 0.004) * SR)
        burst = band(noise(g), 1800, 7500) * np.hanning(g) * rng.exponential(0.6)
        grains.append((start, burst * np.exp(-start / 0.08)))
    return place(n, grains) + 0.5 * thud(170, 80, 0.05, 0.4)[:n]


def seeds(count=14, gap=2 / 60):
    """Sésamo apareciendo: popcitos agudos en ráfaga."""
    n = int((count * gap + 0.12) * SR)
    items = [(i * gap, pop(rng.uniform(1700, 2600), 0.07) * rng.uniform(0.6, 1.0)) for i in range(count)]
    return place(n, items)


def bell(f0, dur=1.4, tau=0.55):
    t = tt(dur)
    parts = [(1, 1.0, 1.0), (2.76, 0.45, 0.6), (5.40, 0.22, 0.4), (8.93, 0.1, 0.25)]
    return sum(a * np.sin(2 * np.pi * f0 * r * t) * adsr(len(t), 0.001, tau * d) for r, a, d in parts)


def ting():
    """Brillo del pan y destellos: campanita con arpegio."""
    n = int(1.6 * SR)
    return place(n, [(0, bell(G5 * 2)), (0.05, 0.5 * bell(C6 * 2, 1.2, 0.4)), (0.1, 0.35 * bell(E5 * 4, 1.0, 0.3))])


def sizzle(dur=4.0):
    """Carne a la plancha: siseo + chasquidos."""
    n = int(dur * SR)
    t = np.arange(n) / SR
    hiss = highpass(noise(n), 4200) * 0.18
    hiss *= 0.7 + 0.3 * lowpass(np.abs(noise(n)), 3) / 0.8
    pops = []
    for start in np.cumsum(rng.exponential(1 / 70, int(dur * 90))):
        if start > dur - 0.02:
            break
        g = int(rng.uniform(0.0008, 0.003) * SR)
        pops.append((start, band(noise(g), 2000, 9000) * np.hanning(g) * rng.exponential(0.5)))
    y = hiss + place(n, pops)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.6)
    return y * env


def swoop(f_from=380, f_to=900, dur=0.45):
    """La sonrisa dibujándose: silbido que sube."""
    t = tt(dur)
    p = t / dur
    s = p * p * (3 - 2 * p)
    f = (f_from + (f_to - f_from) * s) * (1 + 0.015 * np.sin(2 * np.pi * 6 * t))
    env = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.09)
    return osc(f, (1.0, 0.0, 0.12)) * env


def boing(f0=210, dur=0.65):
    """El logo rebotando de alegría."""
    t = tt(dur)
    f = f0 * (1 + 0.32 * np.exp(-t / 0.2) * np.sin(2 * np.pi * 15 * t)) * (1 + 0.25 * np.exp(-t / 0.05))
    y = osc(f, (1.0, 0.55, 0.3, 0.18, 0.1)) * adsr(len(t), 0.003, 0.22)
    return lowpass(y, 2400)


def zip_up():
    """La hamburguesa sale disparada."""
    t = tt(0.4)
    f = 260 * (6 ** (t / 0.4) ** 1.3)
    tone = osc(f, (1.0, 0.25)) * np.minimum(1, t / 0.02) * np.exp(-t / 0.22) * 0.5
    air = whoosh(0.4, 500, 4000, peak_at=0.35, pan=(0, 0))[:, 0]
    return tone + air


def pluck(f0, dur=1.3, bright=0.5):
    """Cuerda pulsada (Karplus-Strong): para el jingle final."""
    n = int(dur * SR)
    period = int(SR / f0)
    buf = lowpass(noise(period), 2000 + 6000 * bright)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.996 * 0.5 * (buf[i % period] + buf[(i + 1) % period])
    return out * adsr(n, 0.001, 0.7)


def jingle():
    """Firma sonora del cierre: arpegio Do-Mi-Sol-Do."""
    notes = [C5, E5, G5, C6]
    n = int(1.7 * SR)
    items = [(i * 0.075, pluck(f) * (0.85 + 0.05 * i)) for i, f in enumerate(notes)]
    items.append((0.3, 0.25 * bell(C6 * 2, 1.2, 0.5)))
    return place(n, items) + 0.6 * place(n, [(0, thud(170, 70, 0.08, 0.5))])


def blip():
    """Guiño final."""
    n = int(0.22 * SR)
    note = lambda f: osc(np.full(int(0.07 * SR), f), (1.0, 0.15)) * adsr(int(0.07 * SR), 0.002, 0.03)
    return place(n, [(0, note(E5 * 2)), (0.075, note(A5 * 2))])


def main(outdir):
    os.makedirs(outdir, exist_ok=True)
    for i, f in enumerate([C5, D5, E5, G5, A5, C6]):
        save(outdir, f'pop-{i + 1}', pop(f), pan=(i - 2.5) * 0.12)
    save(outdir, 'pop-big', mix(pop(262, 0.3), 0.5 * boom(0.4, 110, 50, 0.08)))
    save(outdir, 'pop-mid', pop(392, 0.22))
    save(outdir, 'whoosh-big', whoosh(0.9, 180, 2600, peak_at=0.55, width_oct=1.3, pan=(-0.4, 0.4), air=0.15))
    save(outdir, 'whoosh-down', whoosh(0.6, 2400, 220, peak_at=0.35, width_oct=1.2, pan=(0.4, -0.2)))
    save(outdir, 'swish', whoosh(0.35, 1400, 4200, peak_at=0.5, width_oct=0.9, pan=(-0.3, 0.3)))
    save(outdir, 'boom', boom())
    save(outdir, 'boom-soft', boom(0.7, 90, 45, 0.18))
    save(outdir, 'thud', thud())
    save(outdir, 'thud-heavy', thud(130, 48, 0.12, 0.8))
    save(outdir, 'splat', splat())
    save(outdir, 'plip', plip())
    save(outdir, 'crunch', crunch())
    save(outdir, 'seeds', seeds())
    save(outdir, 'ting', ting())
    save(outdir, 'sizzle', sizzle())
    save(outdir, 'swoop', swoop())
    save(outdir, 'boing', boing())
    save(outdir, 'zip', zip_up())
    save(outdir, 'jingle', jingle())
    save(outdir, 'blip', blip())


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'public/sfx')
