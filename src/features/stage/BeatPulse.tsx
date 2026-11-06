import { type ReactNode, useEffect, useLayoutEffect, useRef } from 'react'
import { useEngine } from '@/app/store/AppStoreContext'
import { usePrefersReducedMotion } from '@/ui/usePrefersReducedMotion'
import { subscribeFrame } from '@/visuals/animationLoop'
import { beatImpulse } from '@/visuals/pose'

/** How much the stage decorations swell and brighten right on each beat. */
const PULSE = { scale: 0.018, dim: 0.25 } as const

/**
 * Makes the stage decorations breathe with the beat: a small swell and brighten on every beat,
 * still while stopped or with reduced motion. Written per frame, no React renders.
 */
export function BeatPulse({ children }: { children: ReactNode }) {
  const engine = useEngine()
  const reducedMotion = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const reducedRef = useRef(reducedMotion)
  useLayoutEffect(() => {
    reducedRef.current = reducedMotion
  })

  useEffect(() => {
    const beat = engine.getBeatClock()
    return subscribeFrame(() => {
      const element = ref.current
      if (!element) return
      const impulse = reducedRef.current ? 0 : beatImpulse(beat.getBeatPosition())
      element.style.transform = `scale(${(1 + impulse * PULSE.scale).toFixed(4)})`
      element.style.opacity = (1 - PULSE.dim + impulse * PULSE.dim).toFixed(3)
    })
  }, [engine])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 -z-20">
      {children}
    </div>
  )
}
