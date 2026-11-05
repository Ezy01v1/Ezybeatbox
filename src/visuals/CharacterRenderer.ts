import type { ComponentType } from 'react'
import type { LevelReader } from '@/core/audio/AudioEngine'
import type { SlotStatus } from '@/core/audio/transitions'
import type { CharacterRole } from '@/core/packs/schema'

/**
 * Everything a character renderer needs. Renderers are purely visual (`aria-hidden`): the
 * accessible name, controls and drop target live in the wrapper (features/stage).
 *
 * Swapping the art (SVG today, Rive later) means writing another component with this shape.
 */
export interface CharacterRenderProps {
  role: CharacterRole
  status: SlotStatus
  muted: boolean
  /** Live 0–1 channel level. Read it in `requestAnimationFrame`, never in React state. */
  level: LevelReader
  reducedMotion: boolean
}

export type CharacterRenderer = ComponentType<CharacterRenderProps>
