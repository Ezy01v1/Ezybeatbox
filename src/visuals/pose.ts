import type { SlotStatus } from '@/core/audio/transitions'
import { VISUAL_CONFIG } from './config'

export interface PoseInput {
  status: SlotStatus
  /** Smoothed, normalized 0–1 level of the character's channel. */
  level: number
  /** Fractional beat position from the beat clock, or `null` while stopped. */
  beatPosition: number | null
  reducedMotion: boolean
  timeSeconds: number
}

/** Renderer-agnostic pose: any art style (SVG, Rive…) can map these to its own rig. */
export interface Pose {
  /** 0 = closed, 1 = wide open. */
  mouthOpen: number
  /** Vertical head offset (negative = up), in character units. */
  headOffset: number
  /** Body scale around its base. */
  bodyScale: number
  /** 0–1 halo intensity. */
  glow: number
}

/** 1 right on the beat, decaying to 0 by the next one (cubic ease-out). */
export function beatImpulse(beatPosition: number | null): number {
  if (beatPosition === null) return 0
  const phase = beatPosition - Math.floor(beatPosition)
  return (1 - phase) ** 3
}

export function computePose({
  status,
  level,
  beatPosition,
  reducedMotion,
  timeSeconds,
}: PoseInput): Pose {
  const singing = status === 'playing' || status === 'stopping'

  if (!singing) {
    const breath = reducedMotion
      ? 0
      : Math.sin(timeSeconds * 2 * Math.PI * VISUAL_CONFIG.idleBreathHz) *
        VISUAL_CONFIG.idleBreathUnits
    return { mouthOpen: 0, headOffset: breath, bodyScale: 1, glow: 0 }
  }

  // Reduced motion: no movement, but mouth and glow still show the level (information).
  return {
    mouthOpen: level,
    glow: level,
    headOffset: reducedMotion ? 0 : -VISUAL_CONFIG.beatBobUnits * beatImpulse(beatPosition),
    bodyScale: reducedMotion ? 1 : 1 + VISUAL_CONFIG.bodyPulse * level,
  }
}
