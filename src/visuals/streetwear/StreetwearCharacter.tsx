import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { subscribeFrame } from '../animationLoop'
import type { CharacterRenderProps } from '../CharacterRenderer'
import { followLevel, normalizeLevel } from '../levels'
import {
  BROWS_SVG,
  EYES_SVG,
  QUEUED_MOUTH_SVG,
  SINGING_MOUTH_SVG,
  SMILE_SVG,
  bodySvg,
  headSvg,
  paletteFor,
} from './art'

/** Same framing as the Rive artboard (120 × 158, art space starts at y = -6, cut at the hips). */
const VIEW_BOX = '0 -6 120 158'
/** Singing mouth radius at rest; the Rive rig scales it up to 8× on a hit. */
const MOUTH_RY = 0.8
const MOUTH_MAX_SCALE = 8

type Expression = 'resting' | 'queued' | 'singing'

function expressionSvg(expression: Expression): string {
  if (expression === 'resting') return BROWS_SVG + SMILE_SVG
  if (expression === 'queued') return BROWS_SVG + EYES_SVG + QUEUED_MOUTH_SVG
  return BROWS_SVG + EYES_SVG + SINGING_MOUTH_SVG.replace('<ellipse', '<ellipse data-mouth')
}

/**
 * Static SVG version of the streetwear Rive rig. Shown while the `.riv` loads, or instead of it
 * when Rive fails, so the stage never switches art style. Only the mouth follows the audio.
 *
 * The markup comes from our own art constants plus pack colors validated as `#rrggbb`
 * (core/packs/schema), so injecting it as HTML is safe.
 */
export function StreetwearCharacter(props: CharacterRenderProps) {
  const { role, color, status, muted } = props
  const singing = status === 'playing' || status === 'stopping'
  const expression: Expression = singing ? 'singing' : status === 'queued' ? 'queued' : 'resting'

  const markup = useMemo(() => {
    const palette = paletteFor(color)
    return headSvg(role, palette, expressionSvg(expression)) + bodySvg(role, palette)
  }, [role, color, expression])

  const live = useRef(props)
  useLayoutEffect(() => {
    live.current = props
  })

  const artRef = useRef<SVGGElement>(null)
  useEffect(() => {
    if (!singing) return
    const mouth = artRef.current?.querySelector('[data-mouth]')
    if (!mouth) return
    let level = 0
    return subscribeFrame((_, delta) => {
      const current = live.current
      const moving = !current.muted && !current.reducedMotion
      level = moving ? followLevel(level, normalizeLevel(current.level.getLevel()), delta) : 0
      const scale = 1 + level * (MOUTH_MAX_SCALE - 1)
      mouth.setAttribute('ry', (MOUTH_RY * scale).toFixed(2))
    })
  }, [singing, markup])

  // Matches the rig: dimmed while empty ("Presence") and further while muted.
  const opacity = (muted ? 0.35 : 1) * (status === 'empty' ? 0.65 : 1)

  return (
    <svg
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full"
      aria-hidden
    >
      {status === 'queued' && (
        <ellipse
          cx="60"
          cy="74"
          rx="54"
          ry="73"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 6"
          opacity="0.85"
        />
      )}
      <g ref={artRef} opacity={opacity} dangerouslySetInnerHTML={{ __html: markup }} />
    </svg>
  )
}
