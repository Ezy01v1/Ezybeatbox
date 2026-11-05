import type { CharacterRenderProps } from '../CharacterRenderer'
import { IDLE_COLOR, ROLE_COLORS } from '../theme'
import { RoleGlyph } from './RoleGlyph'

/**
 * Placeholder SVG character. Phase 2: static poses per status. Phase 3 animates the mouth and
 * body from `level` inside requestAnimationFrame.
 */
export function SvgCharacter({ role, status, muted, reducedMotion }: CharacterRenderProps) {
  const active = status === 'playing' || status === 'stopping'
  const color = status === 'empty' ? IDLE_COLOR : ROLE_COLORS[role]
  const pulse = reducedMotion ? '' : 'animate-pulse'

  return (
    <svg viewBox="0 0 100 130" className="h-full w-full overflow-visible" aria-hidden>
      {status === 'queued' && (
        <circle
          cx="50"
          cy="68"
          r="49"
          fill="none"
          stroke={ROLE_COLORS[role]}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          className={pulse}
        />
      )}

      <g opacity={muted ? 0.35 : 1}>
        {/* Body */}
        <rect x="18" y="62" width="64" height="62" rx="26" fill={color} />
        <RoleGlyph role={role} x="38" y="80" width="24" height="24" color="rgb(9 9 11 / 0.55)" />

        {/* Head */}
        <circle cx="50" cy="42" r="30" fill={color} />

        {/* Eyes */}
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

        {/* Mouth */}
        {active ? (
          <ellipse cx="50" cy="56" rx="9" ry="6" fill="#18181b" />
        ) : status === 'queued' ? (
          <circle cx="50" cy="56" r="3.5" fill="#18181b" />
        ) : (
          <path d="M44 56h12" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
        )}
      </g>
    </svg>
  )
}
