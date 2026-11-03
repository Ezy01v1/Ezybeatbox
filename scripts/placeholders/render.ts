import { type MeterConfig, loopSampleCount } from '../../src/core/audio/timing'
import { LoopBuffer, createRng, normalize } from './dsp'
import type { SoundRecipe } from './recipes'

export const PLACEHOLDER_SAMPLE_RATE = 44_100
/** Rough loudness target per loop (RMS), capped by the peak ceiling. See docs/SAMPLES.md. */
export const TARGET_RMS_DB = -18
export const PEAK_CEILING_DB = -2

export interface RenderSettings extends MeterConfig {
  loopBars: number
  sampleRate?: number
}

/** Renders one placeholder loop of exactly `loopBars` bars. */
export function renderPlaceholder(recipe: SoundRecipe, settings: RenderSettings): Float32Array {
  const sampleRate = settings.sampleRate ?? PLACEHOLDER_SAMPLE_RATE
  const length = loopSampleCount(settings, settings.loopBars, sampleRate)
  const buffer = new LoopBuffer(length, sampleRate)
  const [beatsPerBar, beatUnit] = settings.timeSignature
  const stepsPerBar = (beatsPerBar * 16) / beatUnit
  const step = 60 / settings.bpm / 4

  recipe.render({ buffer, step, stepsPerBar, rng: createRng(hashSeed(recipe.id)) })
  normalize(buffer.data, TARGET_RMS_DB, PEAK_CEILING_DB)
  return buffer.data
}

/** Stable per-sound seed so every file is reproducible. */
function hashSeed(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
