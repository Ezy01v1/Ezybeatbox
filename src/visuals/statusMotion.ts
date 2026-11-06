import type { SlotStatus } from '@/core/audio/transitions'

/**
 * One-shot motion when a character's sound changes at the bar line: a hop with squash and
 * stretch when it starts singing, a small sag when it goes quiet. Transforms only, anchored at
 * the feet, so it composes with the per-frame motion inside the renderer.
 */
export const STATUS_MOTION = {
  enter: {
    keyframes: [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(0) scale(1.06, 0.92)', offset: 0.15 },
      { transform: 'translateY(-9%) scale(0.95, 1.06)', offset: 0.45 },
      { transform: 'translateY(0) scale(1.05, 0.95)', offset: 0.75 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    options: { duration: 520, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  },
  exit: {
    keyframes: [
      { transform: 'translateY(0) scale(1, 1)' },
      { transform: 'translateY(3%) scale(1.03, 0.95)', offset: 0.4 },
      { transform: 'translateY(0) scale(1, 1)' },
    ],
    options: { duration: 420, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
  },
} satisfies Record<string, { keyframes: Keyframe[]; options: KeyframeAnimationOptions }>

const singing = (status: SlotStatus) => status === 'playing' || status === 'stopping'

/** Which one-shot (if any) a status change should play. */
export function statusMotionFor(
  previous: SlotStatus,
  next: SlotStatus,
): keyof typeof STATUS_MOTION | null {
  if (!singing(previous) && next === 'playing') return 'enter'
  if (singing(previous) && next === 'empty') return 'exit'
  return null
}
