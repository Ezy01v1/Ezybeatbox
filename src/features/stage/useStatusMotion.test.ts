import { renderHook } from '@testing-library/react'
import type { SlotStatus } from '@/core/audio/transitions'
import { STATUS_MOTION } from '@/visuals/statusMotion'
import { useStatusMotion } from './useStatusMotion'

function setup(reducedMotion = false) {
  const element = document.createElement('div')
  const animate = vi.fn()
  element.animate = animate
  const ref = { current: element }
  const view = renderHook(
    ({ status, playing }: { status: SlotStatus; playing: string | null }) =>
      useStatusMotion(ref, status, playing, reducedMotion),
    { initialProps: { status: 'queued' as SlotStatus, playing: null as string | null } },
  )
  return { animate, view }
}

describe('useStatusMotion', () => {
  it('hops on enter, on a sound swap, and sags on exit', () => {
    const { animate, view } = setup()
    view.rerender({ status: 'playing', playing: 'kick-1' })
    expect(animate).toHaveBeenLastCalledWith(
      STATUS_MOTION.enter.keyframes,
      STATUS_MOTION.enter.options,
    )
    view.rerender({ status: 'playing', playing: 'kick-2' })
    expect(animate).toHaveBeenCalledTimes(2)
    view.rerender({ status: 'empty', playing: null })
    expect(animate).toHaveBeenLastCalledWith(
      STATUS_MOTION.exit.keyframes,
      STATUS_MOTION.exit.options,
    )
  })

  it('does nothing with reduced motion', () => {
    const { animate, view } = setup(true)
    view.rerender({ status: 'playing', playing: 'kick-1' })
    expect(animate).not.toHaveBeenCalled()
  })
})
