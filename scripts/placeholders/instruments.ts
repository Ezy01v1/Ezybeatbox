import { TWO_PI, midiToHz, onePoleHighpass, onePoleLowpass, sweepPhase } from './dsp'

/** A sound event: duration in seconds plus a per-sample generator built fresh for each hit. */
export interface Voice {
  duration: number
  create: (sampleRate: number, rng: () => number) => (t: number) => number
}

const noise = (rng: () => number) => rng() * 2 - 1

export function kick(opts: {
  startHz?: number
  endHz?: number
  pitchTau?: number
  ampTau?: number
  click?: number
  drive?: number
}): Voice {
  const {
    startHz = 150,
    endHz = 48,
    pitchTau = 0.03,
    ampTau = 0.18,
    click = 0.4,
    drive = 1.5,
  } = opts
  return {
    duration: ampTau * 5,
    create: (sr, rng) => {
      const clickFilter = onePoleHighpass(2000, sr)
      return (t) => {
        const body = Math.sin(sweepPhase(t, startHz, endHz, pitchTau)) * Math.exp(-t / ampTau)
        const transient = t < 0.004 ? clickFilter(noise(rng)) * click * (1 - t / 0.004) : 0
        return Math.tanh((body + transient) * drive) / Math.tanh(drive)
      }
    },
  }
}

export function snare(opts: {
  toneHz?: number
  toneTau?: number
  noiseTau?: number
  noiseHz?: number
}): Voice {
  const { toneHz = 185, toneTau = 0.05, noiseTau = 0.13, noiseHz = 1800 } = opts
  return {
    duration: noiseTau * 5,
    create: (sr, rng) => {
      const hp = onePoleHighpass(noiseHz, sr)
      return (t) =>
        0.55 * Math.sin(TWO_PI * toneHz * t) * Math.exp(-t / toneTau) +
        0.8 * hp(noise(rng)) * Math.exp(-t / noiseTau)
    },
  }
}

export function rimshot(): Voice {
  return {
    duration: 0.12,
    create: (sr, rng) => {
      const hp = onePoleHighpass(3000, sr)
      return (t) =>
        (0.6 * Math.sin(TWO_PI * 420 * t) + 0.4 * Math.sin(TWO_PI * 1650 * t)) *
          Math.exp(-t / 0.015) +
        0.5 * hp(noise(rng)) * Math.exp(-t / 0.02)
    },
  }
}

export function clap(): Voice {
  const burstOffsets = [0, 0.011, 0.023]
  return {
    duration: 0.5,
    create: (sr, rng) => {
      const hp = onePoleHighpass(900, sr)
      const lp = onePoleLowpass(3500, sr)
      return (t) => {
        let env = 0.6 * Math.exp(-Math.max(0, t - 0.023) / 0.11) * (t >= 0.023 ? 1 : 0)
        for (const offset of burstOffsets) {
          if (t >= offset) env += Math.exp(-(t - offset) / 0.006)
        }
        return lp(hp(noise(rng))) * env * 1.6
      }
    },
  }
}

export function hat(opts: { tau?: number; cutoffHz?: number }): Voice {
  const { tau = 0.03, cutoffHz = 7000 } = opts
  return {
    duration: tau * 6,
    create: (sr, rng) => {
      const hp1 = onePoleHighpass(cutoffHz, sr)
      const hp2 = onePoleHighpass(cutoffHz, sr)
      return (t) => hp2(hp1(noise(rng))) * Math.exp(-t / tau) * 1.8
    },
  }
}

export function shaker(): Voice {
  return {
    duration: 0.12,
    create: (sr, rng) => {
      const hp = onePoleHighpass(4000, sr)
      const lp = onePoleLowpass(9000, sr)
      return (t) => lp(hp(noise(rng))) * Math.min(1, t / 0.015) * Math.exp(-t / 0.04) * 1.4
    },
  }
}

/** Sine bass with a touch of second harmonic and saturation; optional glide from another note. */
export function bassNote(
  midi: number,
  duration: number,
  opts: { glideFrom?: number; decayTau?: number } = {},
): Voice {
  const target = midiToHz(midi)
  const from = opts.glideFrom === undefined ? target : midiToHz(opts.glideFrom)
  const decayTau = opts.decayTau ?? 0.8
  return {
    duration,
    create: () => (t) => {
      const phase = sweepPhase(t, from, target, 0.04)
      const env = Math.min(1, t / 0.006) * Math.exp(-t / decayTau) * releaseEnv(t, duration, 0.04)
      return Math.tanh((Math.sin(phase) + 0.3 * Math.sin(2 * phase)) * 1.4) * env
    },
  }
}

/** Soft "ooh" vocal-ish tone: additive harmonics shaped by two formants, with late vibrato. */
export function vocalNote(midi: number, duration: number): Voice {
  const f0 = midiToHz(midi)
  const harmonics = Array.from({ length: 10 }, (_, i) => {
    const h = i + 1
    const freq = f0 * h
    const formant =
      Math.exp(-(((freq - 400) / 180) ** 2)) + 0.6 * Math.exp(-(((freq - 850) / 250) ** 2))
    return { h, amp: (formant + 0.05) / h }
  })
  const norm = harmonics.reduce((sum, { amp }) => sum + amp, 0)
  return {
    duration,
    create: () => (t) => {
      const vibrato = t > 0.15 ? 0.004 * Math.sin(TWO_PI * 5.5 * t) : 0
      const phase = TWO_PI * f0 * t * (1 + vibrato)
      let sum = 0
      for (const { h, amp } of harmonics) sum += amp * Math.sin(h * phase)
      const env = Math.min(1, t / 0.03) * releaseEnv(t, duration, 0.08)
      return (sum / norm) * env
    },
  }
}

export function riser(duration: number): Voice {
  return {
    duration,
    create: (sr, rng) => {
      let lp = 0
      let lp2 = 0
      return (t) => {
        const progress = t / duration
        const cutoff = 300 + 7000 * progress ** 2
        const a = 1 - Math.exp((-TWO_PI * cutoff) / sr)
        lp += a * (noise(rng) - lp)
        lp2 += a * (lp - lp2)
        // Linear rise 200 → 1600 Hz over the whole event.
        const tone = 0.3 * Math.sin(TWO_PI * (200 * t + (1400 * t * t) / (2 * duration)))
        return (lp - lp2 + tone) * progress ** 2 * releaseEnv(t, duration, 0.02)
      }
    },
  }
}

export function laser(): Voice {
  return {
    duration: 0.28,
    create: () => (t) => Math.sin(sweepPhase(t, 2400, 140, 0.05)) * Math.exp(-t / 0.08),
  }
}

/** Scratch-like gesture: band-limited noise + tone whose "playback speed" swings back and forth. */
export function scratch(duration: number): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const hp = onePoleHighpass(500, sr)
      const lp = onePoleLowpass(2500, sr)
      let phase = 0
      return (t) => {
        const speed = Math.sin(TWO_PI * (2 / duration) * t)
        phase += (TWO_PI * (180 + 420 * Math.abs(speed))) / sr
        const body = 0.6 * Math.sin(phase) + 0.5 * lp(hp(noise(rng)))
        return body * Math.abs(speed) ** 0.7
      }
    },
  }
}

export function vinyl(duration: number): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const hiss = onePoleLowpass(5000, sr)
      const crackleFilter = onePoleHighpass(1500, sr)
      let crackle = 0
      return (t) => {
        if (rng() < 25 / sr) crackle = (rng() * 2 - 1) * (0.5 + rng() * 0.5)
        crackle *= 0.9
        return 0.12 * hiss(noise(rng)) + crackleFilter(crackle) + 0.05 * Math.sin(TWO_PI * 0.3 * t)
      }
    },
  }
}

export function subDrop(): Voice {
  return {
    duration: 1.4,
    create: () => (t) => Math.sin(sweepPhase(t, 140, 32, 0.35)) * Math.exp(-t / 0.5),
  }
}

/** Swelling noise (like a reversed cymbal) that peaks at its end. */
export function reverseCymbal(duration: number): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const hp = onePoleHighpass(5000, sr)
      return (t) => hp(noise(rng)) * (t / duration) ** 3 * 1.5
    },
  }
}

function releaseEnv(t: number, duration: number, release: number): number {
  const remaining = duration - t
  return remaining < release ? Math.max(0, remaining / release) : 1
}
