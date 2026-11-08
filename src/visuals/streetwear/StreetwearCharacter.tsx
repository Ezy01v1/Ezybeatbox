import { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react'
import { subscribeFrame } from '../animationLoop'
import type { CharacterRenderProps } from '../CharacterRenderer'
import { beatImpulse } from '../pose'
import { followRiveLevel } from '../rive/motion'
import { GenrePatch } from './GenrePatch'
import {
  BROWS_SVG,
  EYES_CENTER_Y,
  EYES_SVG,
  QUEUED_MOUTH_SVG,
  SINGING_MOUTH_SVG,
  SMILE_SVG,
  blinkScale,
  bodySvg,
  headSvg,
  paletteFor,
} from './art'
import {
  BOOM_BAP_EYES,
  boomBapBody,
  boomBapBrows,
  boomBapHead,
  boomBapPatchTransform,
} from './boomBapArt'
import { KICK_PILOT_BROWS, KICK_PILOT_EYES, kickPilotBody, kickPilotHead } from './kickPilot'

/** Same framing as the old Rive artboard: 120 × 158, art space from y = -6, cut at the hips. */
const VIEW_BOX = '0 -6 120 158'
const HIPS = { x: 60, y: 152 }

/**
 * Motion at full level / on the beat. Same numbers as the Rive rig it replaces
 * (scripts/rive/build-streetwear.ts), so both renderers move alike.
 */
const MOTION = {
  /** Body squash around the hips. */
  squashX: 0.03,
  squashY: 0.03,
  /** Head bounce on each beat (art units, up). */
  headBob: 4,
  /** Singing mouth radii at rest and their growth at full level. */
  mouthRx: 4,
  mouthRxGrowth: 0.5,
  mouthRy: 0.8,
  mouthRyGrowth: 7,
  glow: 0.55,
} as const

type Expression = 'resting' | 'queued' | 'singing'

function expressionSvg(expression: Expression, face?: { brows: string; eyes: string }): string {
  const brows = face?.brows ?? BROWS_SVG
  const eyes = `<g data-eyes="">${face?.eyes ?? EYES_SVG}</g>`
  if (expression === 'resting') return brows + (face ? eyes : '') + SMILE_SVG
  if (expression === 'queued') return brows + eyes + QUEUED_MOUTH_SVG
  return brows + eyes + SINGING_MOUTH_SVG.replace('<ellipse', '<ellipse data-mouth=""')
}

/**
 * The streetwear characters, drawn as plain SVG. React renders the base art only when
 * the role, color or expression changes; per-frame motion (squash, head bounce, mouth, glow and
 * the staggered blink) is written straight to SVG attributes from the shared animation loop.
 *
 * The markup comes from our own art constants plus pack colors validated as `#rrggbb`
 * (core/packs/schema), so injecting it as HTML is safe.
 */
export function StreetwearCharacter(props: CharacterRenderProps & { packId?: string | undefined }) {
  const { role, color, status, muted, packId } = props
  const boomBap = packId === 'boom-bap-01'
  const glowId = useId()
  const singing = status === 'playing' || status === 'stopping'
  const expression: Expression = singing ? 'singing' : status === 'queued' ? 'queued' : 'resting'

  const { head, body, patchTransform } = useMemo(() => {
    const palette = paletteFor(color)
    if (!boomBap) {
      return {
        head: headSvg(role, palette, expressionSvg(expression)),
        body: bodySvg(role, palette),
      }
    }
    if (role === 'kick') {
      const face = expressionSvg(expression, { brows: KICK_PILOT_BROWS, eyes: KICK_PILOT_EYES })
      return {
        head: kickPilotHead(palette, face),
        body: kickPilotBody(palette),
        patchTransform: 'translate(79 99) rotate(8) scale(.72)',
      }
    }
    const face = expressionSvg(expression, { brows: boomBapBrows(role), eyes: BOOM_BAP_EYES })
    return {
      head: boomBapHead(role, palette, face),
      body: boomBapBody(role, palette),
      patchTransform: boomBapPatchTransform[role],
    }
  }, [role, color, expression, boomBap])

  const live = useRef(props)
  useLayoutEffect(() => {
    live.current = props
  })

  const pivotRef = useRef<SVGGElement>(null)
  const headRef = useRef<SVGGElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    const eyes = headRef.current?.querySelector('[data-eyes]')
    const mouth = headRef.current?.querySelector('[data-mouth]')
    let level = 0
    return subscribeFrame((now, delta) => {
      const current = live.current
      const playing = current.status === 'playing' || current.status === 'stopping'
      const moving = playing && !current.muted && !current.reducedMotion
      level = moving ? followRiveLevel(current.role, level, current.level.getLevel(), delta) : 0
      const bob = moving ? beatImpulse(current.beat.getBeatPosition()) * MOTION.headBob : 0

      pivotRef.current?.setAttribute(
        'transform',
        `translate(${HIPS.x} ${HIPS.y}) scale(${(1 + level * MOTION.squashX).toFixed(4)} ${(1 - level * MOTION.squashY).toFixed(4)}) translate(${-HIPS.x} ${-HIPS.y})`,
      )
      headRef.current?.setAttribute('transform', `translate(0 ${(-bob).toFixed(2)})`)
      glowRef.current?.setAttribute('opacity', (level * MOTION.glow).toFixed(3))
      mouth?.setAttribute('rx', (MOTION.mouthRx * (1 + level * MOTION.mouthRxGrowth)).toFixed(2))
      mouth?.setAttribute('ry', (MOTION.mouthRy * (1 + level * MOTION.mouthRyGrowth)).toFixed(2))

      if (eyes) {
        const scale = current.reducedMotion ? 1 : blinkScale(current.role, now / 1000)
        eyes.setAttribute(
          'transform',
          `translate(0 ${(EYES_CENTER_Y * (1 - scale)).toFixed(2)}) scale(1 ${scale.toFixed(3)})`,
        )
      }
    })
  }, [head])

  // Matches the old rig: dimmed while empty ("Presence") and further while muted.
  const opacity = (muted ? 0.35 : 1) * (status === 'empty' ? 0.65 : 1)

  return (
    <svg
      viewBox={VIEW_BOX}
      preserveAspectRatio="xMidYMax meet"
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {singing && (
        <circle ref={glowRef} cx="60" cy="76" r="80" fill={`url(#${glowId})`} opacity="0" />
      )}
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
      <g opacity={opacity}>
        <g ref={pivotRef}>
          <g ref={headRef} dangerouslySetInnerHTML={{ __html: head }} />
          <g dangerouslySetInnerHTML={{ __html: body }} />
          <GenrePatch packId={packId} transform={patchTransform} />
        </g>
      </g>
    </svg>
  )
}
