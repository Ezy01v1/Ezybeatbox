import type { ComponentType } from 'react'
import type { BeatClock, LevelReader } from '@/core/audio/AudioEngine'
import type { SlotStatus } from '@/core/audio/transitions'
import type { CharacterRole } from '@/core/packs/schema'

/**
 * Everything a character renderer needs. Renderers are purely visual (`aria-hidden`): the
 * accessible name, controls and drop target live in the wrapper (features/stage).
 *
 * Swapping the art (SVG today, Rive later) means writing another component with this shape.
 * `computePose` (visuals/pose.ts) turns level + beat into a renderer-agnostic pose any rig can
 * reuse.
 */
export interface CharacterRenderProps {
  role: CharacterRole
  /** Role color from the pack theme (`#rrggbb`). */
  color: string
  /** Outline color from the pack theme (`#rrggbb`). */
  outline: string
  status: SlotStatus
  muted: boolean
  /** Live 0–1 channel level, already latency-compensated. Read it in the animation loop only. */
  level: LevelReader
  /** Live beat position. Read it in the animation loop only. */
  beat: BeatClock
  reducedMotion: boolean
}

export type CharacterRenderer = ComponentType<CharacterRenderProps>
