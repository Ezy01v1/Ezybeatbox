/**
 * Tiny offline DSP toolkit for placeholder loops. Deterministic (seeded noise) so running
 * the generator twice produces identical files.
 */

/** Seeded PRNG (mulberry32) returning floats in [0, 1). */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const TWO_PI = Math.PI * 2

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export function dbToGain(db: number): number {
  return 10 ** (db / 20)
}

/** One-pole low-pass filter factory. */
export function onePoleLowpass(cutoffHz: number, sampleRate: number): (x: number) => number {
  const a = 1 - Math.exp((-TWO_PI * cutoffHz) / sampleRate)
  let y = 0
  return (x) => (y += a * (x - y))
}

/** One-pole high-pass filter factory (input minus its low-passed copy). */
export function onePoleHighpass(cutoffHz: number, sampleRate: number): (x: number) => number {
  const lp = onePoleLowpass(cutoffHz, sampleRate)
  return (x) => x - lp(x)
}

/**
 * Phase (radians) of a sine whose frequency glides exponentially from `f0` to `f1` with time
 * constant `tau`. Closed form, so pitch sweeps need no state.
 */
export function sweepPhase(t: number, f0: number, f1: number, tau: number): number {
  return TWO_PI * (f1 * t + (f0 - f1) * tau * (1 - Math.exp(-t / tau)))
}

/** Edge fade applied to every event so nothing clicks, even when it wraps around the loop. */
const EDGE_FADE_SECONDS = 0.003
const ATTACK_SECONDS = 0.0005

/**
 * Fixed-length buffer that represents exactly one loop. Events that run past the end wrap
 * around to the start, so tails ring into the next repetition and the loop is seamless.
 */
export class LoopBuffer {
  readonly data: Float32Array
  readonly length: number
  readonly sampleRate: number

  constructor(length: number, sampleRate: number) {
    this.length = length
    this.sampleRate = sampleRate
    this.data = new Float32Array(length)
  }

  /** Mixes `generate(t)` for `durationSeconds` starting at `startSeconds`. */
  add(
    startSeconds: number,
    durationSeconds: number,
    generate: (t: number) => number,
    gain = 1,
  ): void {
    const sr = this.sampleRate
    const start = Math.round(startSeconds * sr)
    const count = Math.round(durationSeconds * sr)
    const attack = Math.max(1, Math.round(ATTACK_SECONDS * sr))
    const release = Math.max(1, Math.min(Math.round(EDGE_FADE_SECONDS * sr), count >> 1))

    for (let i = 0; i < count; i++) {
      let value = generate(i / sr) * gain
      if (i < attack) value *= i / attack
      const remaining = count - i
      if (remaining < release) value *= remaining / release
      const index = (start + i) % this.length
      this.data[index] = (this.data[index] ?? 0) + value
    }
  }
}

export function peakOf(data: Float32Array): number {
  let peak = 0
  for (const v of data) peak = Math.max(peak, Math.abs(v))
  return peak
}

export function rmsOf(data: Float32Array): number {
  let sum = 0
  for (const v of data) sum += v * v
  return Math.sqrt(sum / data.length)
}

/**
 * Scales towards a target RMS level but never above the peak ceiling. A rough stand-in for
 * loudness normalization; real recordings should follow docs/SAMPLES.md.
 */
export function normalize(data: Float32Array, targetRmsDb: number, peakCeilingDb: number): void {
  const rms = rmsOf(data)
  const peak = peakOf(data)
  if (rms === 0 || peak === 0) return
  const gain = Math.min(dbToGain(targetRmsDb) / rms, dbToGain(peakCeilingDb) / peak)
  for (let i = 0; i < data.length; i++) data[i] = (data[i] ?? 0) * gain
}

/** RBJ biquad (band-pass or low-pass) whose cutoff can change per sample. */
export function biquad(type: 'bandpass' | 'lowpass', sampleRate: number, q = 0.707) {
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  return (x: number, freqHz: number): number => {
    const w = (TWO_PI * Math.min(freqHz, sampleRate * 0.45)) / sampleRate
    const cos = Math.cos(w)
    const alpha = Math.sin(w) / (2 * q)
    const a0 = 1 + alpha
    const [b0, b1, b2] =
      type === 'bandpass' ? [alpha, 0, -alpha] : [(1 - cos) / 2, 1 - cos, (1 - cos) / 2]
    // a1 = -2·cos(w), a2 = 1 - alpha
    const y = (b0 * x + b1 * x1 + b2 * x2 + 2 * cos * y1 - (1 - alpha) * y2) / a0
    x2 = x1
    x1 = x
    y2 = y1
    y1 = y
    return y
  }
}

/**
 * Runs a stateful per-sample effect over a loop seamlessly: one warm-up pass so filter and
 * reverb tails coming from the end of the loop are already present at its start.
 */
export function processLoop(data: Float32Array, effect: (x: number, i: number) => number): void {
  for (let i = 0; i < data.length; i++) effect(data[i] ?? 0, i)
  for (let i = 0; i < data.length; i++) data[i] = effect(data[i] ?? 0, i)
}

/** Small Schroeder reverb (4 combs + 2 all-passes) mixed in with `wet`. */
export function reverb(sampleRate: number, { size = 1, wet = 0.25, damp = 0.3 } = {}) {
  const combs = [1557, 1617, 1491, 1422].map((n) => {
    const buf = new Float32Array(Math.round(n * size * (sampleRate / 44_100)))
    let i = 0
    let low = 0
    return (x: number) => {
      const out = buf[i] ?? 0
      low = out * (1 - damp) + low * damp
      buf[i] = x + low * 0.82
      i = (i + 1) % buf.length
      return out
    }
  })
  const allpasses = [225, 556].map((n) => {
    const buf = new Float32Array(Math.round(n * (sampleRate / 44_100)))
    let i = 0
    return (x: number) => {
      const delayed = buf[i] ?? 0
      buf[i] = x + delayed * 0.5
      i = (i + 1) % buf.length
      return delayed - x * 0.5
    }
  })
  return (x: number) => {
    let sum = 0
    for (const comb of combs) sum += comb(x)
    let y = sum * 0.25
    for (const ap of allpasses) y = ap(y)
    return x + y * wet
  }
}
