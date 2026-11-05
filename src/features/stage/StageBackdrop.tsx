import { useEffect, useLayoutEffect, useRef } from 'react'
import { useEngine } from '@/app/store/AppStoreContext'
import { subscribeFrame } from '@/visuals/animationLoop'
import { paintBackdrop, ringsAt } from '@/visuals/backdrop'
import { VISUAL_CONFIG } from '@/visuals/config'
import { compensateLatency, followLevel, normalizeLevel } from '@/visuals/levels'
import { usePrefersReducedMotion } from '@/ui/usePrefersReducedMotion'

const BACKDROP_COLOR = '#fbbf24'

/** Canvas behind the characters: glow follows the master level, rings mark each beat. */
export function StageBackdrop() {
  const engine = useEngine()
  const reducedMotion = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotionRef = useRef(reducedMotion)
  useLayoutEffect(() => {
    reducedMotionRef.current = reducedMotion
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, VISUAL_CONFIG.maxDevicePixelRatio)
    const resize = () => {
      canvas.width = Math.round(canvas.clientWidth * pixelRatio)
      canvas.height = Math.round(canvas.clientHeight * pixelRatio)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const master = compensateLatency(engine.getMasterMeter(), () => engine.getOutputLatency())
    const beat = engine.getBeatClock()
    let level = 0

    const unsubscribe = subscribeFrame((_now, delta) => {
      level = followLevel(level, normalizeLevel(master.getLevel()), delta)
      paintBackdrop(ctx, {
        width: canvas.width,
        height: canvas.height,
        pixelRatio,
        level,
        rings: reducedMotionRef.current ? [] : ringsAt(beat.getBeatPosition(), beat.beatsPerBar),
        color: BACKDROP_COLOR,
      })
    })

    return () => {
      unsubscribe()
      observer.disconnect()
    }
  }, [engine])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    />
  )
}
