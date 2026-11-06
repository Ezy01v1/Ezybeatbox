import type { PackTheme } from '@/core/packs/schema'
import { PATTERN_BOX, patternMarkup } from '../patterns'

function Vinyl({
  x,
  y,
  r,
  color,
  label,
}: {
  x: number
  y: number
  r: number
  color: string
  label: string
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={color} />
      {[0.82, 0.66, 0.5].map((k) => (
        <circle
          key={k}
          cx={x}
          cy={y}
          r={r * k}
          fill="none"
          stroke={label}
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.3} fill={label} />
      <circle cx={x} cy={y} r={r * 0.06} fill={color} />
    </g>
  )
}

/**
 * Decorative shapes on the stage background, kept near the edges so they never sit behind a
 * character's face. Scales with the stage (`slice`), purely visual.
 */
export function StagePattern({ theme }: { theme: PackTheme }) {
  const { stage, roles } = theme
  if (!stage.pattern || stage.pattern === 'none') return null
  if (stage.pattern !== 'vinyl') {
    // Markup from our own pattern code plus validated #rrggbb theme colors: safe to inject.
    return (
      <svg
        aria-hidden
        focusable="false"
        viewBox={`0 0 ${PATTERN_BOX.width} ${PATTERN_BOX.height}`}
        preserveAspectRatio="xMidYMid slice"
        className="pointer-events-none absolute inset-0 -z-20 h-full w-full"
        dangerouslySetInnerHTML={{ __html: patternMarkup(stage.pattern, theme) }}
      />
    )
  }

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-20 h-full w-full"
    >
      <g opacity={0.9}>
        <Vinyl x={70} y={70} r={120} color={stage.outline} label={stage.panel} />
        <Vinyl x={1150} y={560} r={150} color={stage.outline} label={roles.fx} />
      </g>
      {/* Geometric tiles, like the record sleeves in the hip hop artwork. */}
      <g opacity={0.55}>
        <rect x={1040} y={30} width={70} height={70} fill={stage.panel} />
        <path d="M1110 30h70v70z" fill={roles.voice} />
        <rect x={1110} y={100} width={70} height={70} fill={roles.fx} />
        <path d="M1040 100h70v70h-70z" fill={stage.outline} opacity={0.5} />
        <rect x={20} y={470} width={60} height={60} fill={stage.panel} />
        <path d="M80 470a60 60 0 0 1 60 60h-60z" fill={roles.voice} />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M${20 + i * 18} 600l30 -60`}
            stroke={stage.outline}
            strokeWidth={6}
            opacity={0.6}
          />
        ))}
      </g>
    </svg>
  )
}
