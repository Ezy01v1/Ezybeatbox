import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { subscribeFrame } from '../animationLoop'
import type { CharacterRenderProps } from '../CharacterRenderer'
import { followLevel, normalizeLevel } from '../levels'
import { computePose } from '../pose'
import { IDLE_COLOR, ROLE_COLORS } from '../theme'
import { RoleGlyph } from './RoleGlyph'

/** Body scales from its feet so it "stomps" instead of floating. */
const BODY_ORIGIN = { x: 50, y: 124 }

/**
 * Placeholder SVG character. React renders the shapes only when `status`/`muted` change;
 * per-frame motion (mouth, bob, pulse, glow) is written straight to SVG attributes from the
 * shared animation loop, so animating causes zero React renders.
 */
export function SvgCharacter(props: CharacterRenderProps) {
  const { role, status, muted, reducedMotion } = props
  const glowId = useId()

  // Latest props for the animation loop, without re-subscribing on every render.
  const live = useRef(props)
  useLayoutEffect(() => {
    live.current = props
  })

  const headRef = useRef<SVGGElement>(null)
  const bodyRef = useRef<SVGGElement>(null)
  const mouthRef = useRef<SVGEllipseElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let level = 0
    return subscribeFrame((now, delta) => {
      const { status, level: levelReader, beat, reducedMotion } = live.current
      level = followLevel(level, normalizeLevel(levelReader.getLevel()), delta)
      const pose = computePose({
        status,
        level,
        beatPosition: beat.getBeatPosition(),
        reducedMotion,
        timeSeconds: now / 1000,
      })

      headRef.current?.setAttribute('transform', `translate(0 ${pose.headOffset.toFixed(2)})`)
      bodyRef.current?.setAttribute(
        'transform',
        `translate(${BODY_ORIGIN.x} ${BODY_ORIGIN.y}) scale(${pose.bodyScale.toFixed(3)}) translate(${-BODY_ORIGIN.x} ${-BODY_ORIGIN.y})`,
      )
      mouthRef.current?.setAttribute('ry', (1.5 + pose.mouthOpen * 8.5).toFixed(2))
      mouthRef.current?.setAttribute('rx', (6 + pose.mouthOpen * 4).toFixed(2))
      glowRef.current?.setAttribute('opacity', (pose.glow * 0.7).toFixed(3))
    })
  }, [])

  const singing = status === 'playing' || status === 'stopping'
  const roleColor = ROLE_COLORS[role]
  const color = status === 'empty' ? IDLE_COLOR : roleColor
  const pulse = reducedMotion ? '' : 'animate-pulse'

  return (
    <svg viewBox="0 0 100 130" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor={roleColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={roleColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {singing && (
        <circle ref={glowRef} cx="50" cy="70" r="62" fill={`url(#${glowId})`} opacity="0" />
      )}

      {status === 'queued' && (
        <circle
          cx="50"
          cy="68"
          r="49"
          fill="none"
          stroke={roleColor}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className={pulse}
        />
      )}

      <g opacity={muted ? 0.35 : 1}>
        <g ref={bodyRef}>
          <rect x="18" y="62" width="64" height="62" rx="26" fill={color} />
          <RoleGlyph role={role} x="38" y="80" width="24" height="24" color="rgb(9 9 11 / 0.55)" />
        </g>

        <g ref={headRef}>
          <circle cx="50" cy="42" r="30" fill={color} />

          {status === 'empty' ? (
            <g stroke="#18181b" strokeWidth="3" strokeLinecap="round">
              <path d="M36 40h8M56 40h8" />
            </g>
          ) : (
            <g>
              <circle cx="40" cy="38" r="6" fill="#fafafa" />
              <circle cx="60" cy="38" r="6" fill="#fafafa" />
              <circle cx="41" cy="39" r="3" fill="#18181b" />
              <circle cx="61" cy="39" r="3" fill="#18181b" />
            </g>
          )}

          {singing ? (
            <ellipse ref={mouthRef} cx="50" cy="56" rx="6" ry="1.5" fill="#18181b" />
          ) : status === 'queued' ? (
            <circle cx="50" cy="56" r="3.5" fill="#18181b" />
          ) : (
            <path d="M44 56h12" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
          )}
        </g>
      </g>
    </svg>
  )
}
