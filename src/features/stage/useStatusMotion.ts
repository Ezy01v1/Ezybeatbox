import { type RefObject, useEffect, useRef } from 'react'
import type { SlotStatus } from '@/core/audio/transitions'
import { STATUS_MOTION, statusMotionFor } from '@/visuals/statusMotion'

/**
 * Plays the enter/exit one-shot on `ref` when the slot status changes, and a hop when the sound
 * playing is swapped for another one. Uses the Web Animations API, so nothing re-renders.
 */
export function useStatusMotion(
  ref: RefObject<HTMLElement | null>,
  status: SlotStatus,
  playing: string | null,
  reducedMotion: boolean,
) {
  const previous = useRef({ status, playing })

  useEffect(() => {
    const before = previous.current
    previous.current = { status, playing }
    const element = ref.current
    if (reducedMotion || !element || typeof element.animate !== 'function') return

    const swapped =
      status === 'playing' &&
      before.playing !== null &&
      playing !== null &&
      before.playing !== playing
    const motion = swapped ? 'enter' : statusMotionFor(before.status, status)
    if (!motion) return
    const { keyframes, options } = STATUS_MOTION[motion]
    element.animate(keyframes, options)
  }, [ref, status, playing, reducedMotion])
}
