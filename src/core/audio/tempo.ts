import { AUDIO_CONFIG } from './config'

/**
 * Live tempo. Loops are recorded at the pack's BPM, so a new tempo plays them faster or slower
 * (like a turntable: pitch follows speed). That keeps them sample-accurate and artifact-free,
 * and the range stays narrow so the pitch change stays subtle.
 */
export interface TempoRange {
  min: number
  max: number
}

export function tempoRange(packBpm: number): TempoRange {
  return {
    min: Math.ceil(packBpm * AUDIO_CONFIG.tempoMinRatio),
    max: Math.floor(packBpm * AUDIO_CONFIG.tempoMaxRatio),
  }
}

/** A whole BPM inside the pack's range. */
export function clampTempo(bpm: number, packBpm: number): number {
  const { min, max } = tempoRange(packBpm)
  const rounded = Number.isFinite(bpm) ? Math.round(bpm) : packBpm
  return Math.min(max, Math.max(min, rounded))
}

/** Playback rate of the pack's loops at `bpm`. */
export function playbackRateFor(bpm: number, packBpm: number): number {
  return bpm / packBpm
}
