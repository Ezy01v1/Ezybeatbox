import type { CharacterRole } from '../../src/core/packs/schema'
import { biquad, processLoop, reverb } from './dsp'

export interface FinishContext {
  role: CharacterRole
  sampleRate: number
  /** Seconds per beat. */
  beat: number
}

/** A pack's mix "color": processing applied to a rendered loop before normalization. */
export type Finish = (data: Float32Array, ctx: FinishContext) => void

const saturate = (data: Float32Array, drive: number) =>
  processLoop(data, (x) => Math.tanh(x * drive) / Math.tanh(drive))

const addReverb = (data: Float32Array, sampleRate: number, opts: Parameters<typeof reverb>[1]) => {
  const fx = reverb(sampleRate, opts)
  processLoop(data, (x) => fx(x))
}

/** Sidechain-style pump: everything but the kick ducks on each beat and swells back. */
const pump = (data: Float32Array, { sampleRate, beat }: FinishContext, depth: number) => {
  const beatSamples = beat * sampleRate
  for (let i = 0; i < data.length; i++) {
    const phase = (i % beatSamples) / beatSamples
    data[i] = (data[i] ?? 0) * (1 - depth * Math.exp(-phase / 0.22))
  }
}

/** Warm, slightly dull "sampler" tone: low-pass and soft tape saturation. */
const dusty = (data: Float32Array, sampleRate: number, cutoff: number) => {
  const lp = biquad('lowpass', sampleRate, 0.7)
  processLoop(data, (x) => Math.tanh(lp(x, cutoff) * 1.6) / Math.tanh(1.6))
}

/** Trap: hard, saturated low end; claps and voices with a short room. */
export const trapFinish: Finish = (data, ctx) => {
  if (ctx.role === 'kick' || ctx.role === 'bass') saturate(data, 2.2)
  if (ctx.role === 'snare') addReverb(data, ctx.sampleRate, { size: 0.7, wet: 0.25 })
  if (ctx.role === 'voice') addReverb(data, ctx.sampleRate, { size: 1, wet: 0.35 })
}

/** House: everything pumps around the four-on-the-floor kick; clap and voice in a hall. */
export const houseFinish: Finish = (data, ctx) => {
  if (ctx.role !== 'kick') pump(data, ctx, ctx.role === 'hihat' ? 0.35 : 0.6)
  if (ctx.role === 'snare' || ctx.role === 'voice' || ctx.role === 'fx')
    addReverb(data, ctx.sampleRate, { size: 1.2, wet: 0.35, damp: 0.4 })
}

/** Reggaetón: dry and upfront drums, a touch of room on the voices. */
export const reggaetonFinish: Finish = (data, ctx) => {
  if (ctx.role === 'kick') saturate(data, 1.6)
  if (ctx.role === 'voice') addReverb(data, ctx.sampleRate, { size: 0.8, wet: 0.25 })
}

/** Boom bap: the whole kit through an old sampler. */
export const boomBapFinish: Finish = (data, ctx) => {
  dusty(data, ctx.sampleRate, ctx.role === 'hihat' ? 7000 : 4200)
}
