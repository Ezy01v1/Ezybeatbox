import { TWO_PI, biquad, midiToHz, onePoleHighpass, onePoleLowpass, sweepPhase } from './dsp'
import { type Voice, kick } from './instruments'

const noise = (rng: () => number) => rng() * 2 - 1

function releaseEnv(t: number, duration: number, release: number): number {
  const remaining = duration - t
  return remaining < release ? Math.max(0, remaining / release) : 1
}

/** Formant frequencies (F1, F2, F3) of sung vowels. */
const VOWELS = {
  a: [800, 1150, 2900],
  e: [400, 1700, 2600],
  i: [300, 2200, 3000],
  o: [450, 800, 2830],
  u: [325, 700, 2530],
} as const
export type Vowel = keyof typeof VOWELS

function formantAt(vowels: readonly Vowel[], t: number, duration: number, n: number): number {
  const progress = Math.min(0.999, t / duration) * Math.max(0, vowels.length - 1)
  const k = Math.floor(progress)
  const mix = progress - k
  const a = VOWELS[vowels[k] ?? 'a'][n] ?? 500
  const b = VOWELS[vowels[k + 1] ?? vowels[k] ?? 'a'][n] ?? 500
  return a * (1 - mix) + b * mix
}

/**
 * Sung voice: a glottal-like pulse train through three formant filters, gliding from vowel to
 * vowel across the note ("ah-eh-oh"), with breath noise and late vibrato. Far less "robotic"
 * than a pure "ooh" tone.
 */
export function voice(
  midi: number,
  duration: number,
  opts: { vowels?: readonly Vowel[]; breath?: number; glideFrom?: number; vibrato?: number } = {},
): Voice {
  const { vowels = ['a'], breath = 0.08, vibrato = 0.012 } = opts
  const f0 = midiToHz(midi)
  const from = opts.glideFrom === undefined ? f0 : midiToHz(opts.glideFrom)
  return {
    duration,
    create: (sr, rng) => {
      const filters = [0, 1, 2].map(() => biquad('bandpass', sr, 6))
      const gains = [1, 0.6, 0.25]
      let phase = 0
      return (t) => {
        const pitch =
          (f0 + (from - f0) * Math.exp(-t / 0.05)) *
          (1 + (t > 0.18 ? vibrato * Math.sin(TWO_PI * 5.6 * t) : 0))
        phase = (phase + pitch / sr) % 1
        // Glottal-like pulse: sharp rise, slower fall.
        const source = (phase < 0.4 ? phase / 0.4 : 1 - (phase - 0.4) / 0.6) * 2 - 1
        const excitation = source + breath * noise(rng)
        let out = 0
        filters.forEach((f, n) => {
          out += f(excitation, formantAt(vowels, t, duration, n)) * (gains[n] ?? 0)
        })
        return out * 2.2 * Math.min(1, t / 0.025) * releaseEnv(t, duration, 0.06)
      }
    },
  }
}

/** Talkbox / vocoder-ish lead: a bright saw "speaking" through moving vowel formants. */
export function talkbox(
  midi: number,
  duration: number,
  vowels: readonly Vowel[] = ['u', 'a'],
): Voice {
  const f0 = midiToHz(midi)
  return {
    duration,
    create: (sr) => {
      const filters = [0, 1].map(() => biquad('bandpass', sr, 4))
      return (t) => {
        const saw = 2 * ((f0 * t) % 1) - 1 + (2 * ((f0 * 1.005 * t) % 1) - 1)
        let out = 0
        filters.forEach((f, n) => {
          out += f(saw, formantAt(vowels, t, duration, n))
        })
        return Math.tanh(out * 1.5) * Math.min(1, t / 0.01) * releaseEnv(t, duration, 0.04)
      }
    },
  }
}

/** 808-style metallic hat: six detuned square waves, high-passed (not plain noise). */
export function metalHat(opts: { tau?: number; open?: boolean } = {}): Voice {
  const tau = opts.tau ?? (opts.open ? 0.22 : 0.025)
  const freqs = [205.3, 304.4, 369.6, 522.7, 540, 800].map((f) => f * 1.9)
  return {
    duration: tau * 6,
    create: (sr) => {
      const hp1 = onePoleHighpass(7000, sr)
      const hp2 = onePoleHighpass(7000, sr)
      return (t) => {
        let sum = 0
        for (const f of freqs) sum += Math.sign(Math.sin(TWO_PI * f * t))
        return hp2(hp1(sum / 6)) * Math.exp(-t / tau) * 2.4
      }
    },
  }
}

/** Long 808: sub sine with a pitch drop, saturation and an optional glide into the note. */
export function eight08(
  midi: number,
  duration: number,
  opts: { glideFrom?: number; drive?: number } = {},
): Voice {
  const target = midiToHz(midi)
  const gliding = opts.glideFrom !== undefined
  const from = opts.glideFrom === undefined ? target * 2.2 : midiToHz(opts.glideFrom)
  const drive = opts.drive ?? 2.2
  return {
    duration,
    create: () => (t) => {
      const body = Math.sin(sweepPhase(t, from, target, gliding ? 0.09 : 0.02))
      const env = Math.min(1, t / 0.003) * Math.exp(-t / 1.6) * releaseEnv(t, duration, 0.05)
      return (Math.tanh(body * drive) / Math.tanh(drive)) * env
    },
  }
}

/** House "909" kick: punchy pitch drop, a click and a rounder tail. */
export function kick909(opts: { tail?: number } = {}): Voice {
  return kick({
    startHz: 230,
    endHz: 52,
    pitchTau: 0.022,
    ampTau: opts.tail ?? 0.22,
    click: 0.9,
    drive: 2.4,
  })
}

/** Airhorn / bocina: stacked detuned saws with a scoop up into the note. */
export function airhorn(midi: number, duration: number): Voice {
  const f0 = midiToHz(midi)
  const partials = [
    [1, 0],
    [1, 0.007],
    [1.5, 0.003],
    [2, -0.004],
  ] as const
  return {
    duration,
    create: (sr) => {
      const lp = biquad('lowpass', sr, 1.2)
      return (t) => {
        const scoop = 1 - 0.06 * Math.exp(-t / 0.04)
        let sum = 0
        for (const [ratio, detune] of partials) {
          sum += 2 * ((f0 * ratio * (1 + detune) * scoop * t) % 1) - 1
        }
        const env = Math.min(1, t / 0.015) * releaseEnv(t, duration, 0.05)
        return Math.tanh(lp(sum * 0.4, 3200) * 2) * env
      }
    },
  }
}

/** Tape stop: a chord whose speed (pitch and time) slows down to a halt. */
export function tapeStop(midis: readonly number[], duration: number): Voice {
  const freqs = midis.map(midiToHz)
  return {
    duration,
    create: (sr) => {
      const lp = onePoleLowpass(2500, sr)
      let pos = 0
      return (t) => {
        const speed = Math.max(0, 1 - (t / duration) ** 1.6)
        pos += speed / sr
        let sum = 0
        for (const f of freqs) sum += 2 * ((f * pos) % 1) - 1
        return lp(sum / freqs.length) * Math.min(1, speed * 4)
      }
    },
  }
}

/** DJ rewind / vinyl spinback: fast backwards-sounding swirl of tone and noise. */
export function rewind(duration: number): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const bp = biquad('bandpass', sr, 2)
      let phase = 0
      return (t) => {
        const p = t / duration
        const speed = 3 + 9 * p
        phase += (TWO_PI * 220 * speed * (1 + 0.5 * Math.sin(TWO_PI * 14 * t))) / sr
        const swirl = 0.6 * Math.sin(phase) + bp(noise(rng), 400 + 3000 * p)
        return swirl * Math.sin(Math.PI * p) * 0.9
      }
    },
  }
}

/** Filter sweep: a bright saw chord through a resonant low-pass opening (or closing). */
export function filterSweep(midis: readonly number[], duration: number, opening = true): Voice {
  const freqs = midis.map(midiToHz)
  return {
    duration,
    create: (sr) => {
      const lp = biquad('lowpass', sr, 6)
      return (t) => {
        const p = opening ? t / duration : 1 - t / duration
        let sum = 0
        for (const f of freqs) sum += 2 * ((f * t) % 1) - 1
        return (
          Math.tanh(lp(sum / freqs.length, 150 + 6000 * p * p) * 1.5) *
          releaseEnv(t, duration, 0.03)
        )
      }
    },
  }
}

/** Samba / referee whistle: a sine with a fast trill and some breath. */
export function whistle(duration: number, trill = true): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const hp = onePoleHighpass(3000, sr)
      return (t) => {
        const f = 2900 * (1 + (trill ? 0.04 * Math.sign(Math.sin(TWO_PI * 24 * t)) : 0))
        return (
          (Math.sin(TWO_PI * f * t) * 0.8 + 0.15 * hp(noise(rng))) *
          Math.min(1, t / 0.01) *
          releaseEnv(t, duration, 0.02)
        )
      }
    },
  }
}

/** Talking drum: a tuned drum whose pitch bends up then back, like squeezing its strings. */
export function talkingDrum(hz: number, bendUp = 1.5): Voice {
  return {
    duration: 0.5,
    create: (sr, rng) => {
      const hp = onePoleHighpass(2000, sr)
      let phase = 0
      return (t) => {
        const bend = 1 + (bendUp - 1) * Math.sin(Math.min(1, t / 0.25) * Math.PI)
        phase += (TWO_PI * hz * bend) / sr
        return Math.sin(phase) * Math.exp(-t / 0.18) + 0.2 * hp(noise(rng)) * Math.exp(-t / 0.006)
      }
    },
  }
}

/** Siren: a tone wailing up and down. */
export function siren(duration: number, rate = 2): Voice {
  return {
    duration,
    create: (sr) => {
      let phase = 0
      return (t) => {
        const f = 700 + 500 * Math.sin(TWO_PI * rate * t - Math.PI / 2)
        phase += (TWO_PI * f) / sr
        return (
          (Math.sin(phase) + 0.3 * Math.sin(3 * phase)) *
          Math.min(1, t / 0.05) *
          releaseEnv(t, duration, 0.05)
        )
      }
    },
  }
}

/** Tight, high dembow snare: a bright tone plus a very short burst of noise. */
export function dembowSnare(): Voice {
  return {
    duration: 0.25,
    create: (sr, rng) => {
      const hp = onePoleHighpass(2500, sr)
      return (t) =>
        0.7 * Math.sin(TWO_PI * 330 * t) * Math.exp(-t / 0.03) +
        0.9 * hp(noise(rng)) * Math.exp(-t / 0.045)
    },
  }
}

/** Clap with a reverb-like tail (layered decaying bursts), for house. */
export function bigClap(): Voice {
  const bursts = [0, 0.009, 0.019, 0.03]
  return {
    duration: 0.9,
    create: (sr, rng) => {
      const bp = biquad('bandpass', sr, 1.4)
      return (t) => {
        let env = 0.45 * Math.exp(-Math.max(0, t - 0.03) / 0.28) * (t >= 0.03 ? 1 : 0)
        for (const offset of bursts) if (t >= offset) env += Math.exp(-(t - offset) / 0.007)
        return bp(noise(rng), 1300) * env * 3
      }
    },
  }
}

/** Güiro scrape: a train of tiny clicks through a band-pass, speeding up along the stroke. */
export function guiro(duration = 0.18): Voice {
  return {
    duration,
    create: (sr, rng) => {
      const bp = biquad('bandpass', sr, 3)
      return (t) => {
        const ridge = Math.sin(TWO_PI * (90 * t + 200 * t * t)) > 0.85 ? 1 : 0
        return (
          bp(ridge * noise(rng) + 0.2 * noise(rng), 3200) * 2.4 * Math.sin((Math.PI * t) / duration)
        )
      }
    },
  }
}

/** Shekere: a gourd net of beads, a short swish with a bright band of noise. */
export function shekere(accent = false): Voice {
  return {
    duration: accent ? 0.22 : 0.12,
    create: (sr, rng) => {
      const bp = biquad('bandpass', sr, 1.8)
      const swell = accent ? 0.03 : 0.012
      return (t) =>
        bp(noise(rng), 5200) * Math.min(1, t / swell) * Math.exp(-t / (accent ? 0.07 : 0.035)) * 3
    },
  }
}

/** Amapiano log drum: a woody, gliding low tone with a soft knock. */
export function logDrum(midi: number, duration = 0.45): Voice {
  const f0 = midiToHz(midi)
  return {
    duration,
    create: (sr, rng) => {
      const hp = onePoleHighpass(1500, sr)
      return (t) => {
        const body = Math.sin(sweepPhase(t, f0 * 1.6, f0, 0.03))
        const wood = 0.35 * Math.sin(sweepPhase(t, f0 * 4.1, f0 * 2.7, 0.02)) * Math.exp(-t / 0.05)
        const knock = 0.15 * hp(noise(rng)) * Math.exp(-t / 0.005)
        return (
          (Math.tanh((body + wood) * 1.8) * Math.exp(-t / 0.22) + knock) *
          releaseEnv(t, duration, 0.03)
        )
      }
    },
  }
}

/** Breakbeat snare: crisp, ringy, with a resonant shell tone like a sampled break. */
export function breakSnare(opts: { ring?: number } = {}): Voice {
  const ring = opts.ring ?? 0.11
  return {
    duration: 0.4,
    create: (sr, rng) => {
      const bp = biquad('bandpass', sr, 0.9)
      return (t) =>
        0.6 * Math.sin(sweepPhase(t, 320, 230, 0.01)) * Math.exp(-t / 0.05) +
        0.25 * Math.sin(TWO_PI * 760 * t) * Math.exp(-t / ring) +
        bp(noise(rng), 3800) * Math.exp(-t / 0.09) * 1.6
    },
  }
}

/** Dusty boom bap kick: round, low-passed, with a soft knock (like a sampled record). */
export function dustyKick(opts: { tail?: number } = {}): Voice {
  return kick({
    startHz: 110,
    endHz: 46,
    pitchTau: 0.035,
    ampTau: opts.tail ?? 0.2,
    click: 0.2,
    drive: 1.8,
  })
}
