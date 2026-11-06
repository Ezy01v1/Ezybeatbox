import type { PackTheme } from '../core/packs/schema'

/** Patterns drawn from markup strings (the vinyl one is a React component in svg/StagePattern). */
export type MarkupPattern = 'sun' | 'lights' | 'speed' | 'kente'

/** Every pattern is drawn in a 1200 × 600 box, kept near the edges, away from the faces. */
export const PATTERN_BOX = { width: 1200, height: 600 } as const

/**
 * SVG markup (no outer `<svg>`) for a stage pattern. Colors come from a validated theme
 * (`#rrggbb` only, see core/packs/schema), so the result is safe to inject as HTML.
 */
export function patternMarkup(pattern: MarkupPattern, { stage, roles }: PackTheme): string {
  switch (pattern) {
    case 'sun': {
      // Sunset with rays behind the left corner and palm leaves on the right.
      const rays = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        const x = 120 + Math.cos(a) * 260
        const y = 110 + Math.sin(a) * 260
        return `<path d="M120 110 L${x.toFixed(0)} ${y.toFixed(0)}" stroke="${stage.glow}" stroke-width="22" stroke-linecap="round" opacity="${i % 2 ? 0.35 : 0.6}"/>`
      }).join('')
      const leaf = (x: number, y: number, r: number) =>
        `<path transform="translate(${x} ${y}) rotate(${r})" d="M0 0q80-60 170-10-90-10-170 10Zm40-14 30 26m30-36 26 30m30-34 18 30" fill="${roles.voice}" stroke="${stage.outline}" stroke-width="5" opacity="0.8"/>`
      return `<g>${rays}<circle cx="120" cy="110" r="95" fill="${roles.voice}" opacity="0.85"/><circle cx="120" cy="110" r="70" fill="${stage.glow}"/></g>
<g>${leaf(1200, 40, 160)}${leaf(1190, 120, 200)}${leaf(1210, 210, 175)}</g>
<g opacity="0.5">${[0, 1, 2].map((i) => `<path d="M0 ${520 + i * 30}q100-30 200 0t200 0" fill="none" stroke="${stage.outline}" stroke-width="8"/>`).join('')}</g>`
    }
    case 'lights': {
      // Club light beams from the top edge and a dotted dance floor along the bottom.
      const beams = [80, 300, 900, 1120]
        .map(
          (x, i) =>
            `<path d="M${x} -10 L${x - 160 + i * 60} 600 L${x + 40 + i * 60} 600 Z" fill="${[roles.kick, roles.hihat, roles.bass, roles.fx][i]}" opacity="0.16"/>`,
        )
        .join('')
      const dots = Array.from({ length: 22 }, (_, i) =>
        Array.from(
          { length: 3 },
          (_, j) =>
            `<circle cx="${30 + i * 55 + (j % 2) * 27}" cy="${520 + j * 30}" r="5" fill="${[roles.kick, roles.hihat, roles.fx][(i + j) % 3]}" opacity="0.55"/>`,
        ).join(''),
      ).join('')
      return `<g>${beams}</g><g>${dots}</g><circle cx="600" cy="-40" r="90" fill="${stage.glow}" opacity="0.25"/>`
    }
    case 'speed': {
      // Fast diagonal streaks and a waveform, like a jungle flyer.
      const streaks = Array.from({ length: 9 }, (_, i) => {
        const y = 40 + i * 62
        const left = i % 2 === 0
        const x = left ? -40 : 900
        return `<path d="M${x} ${y + 40} l${left ? 300 : 340} -80" stroke="${[roles.kick, roles.hihat, stage.glow][i % 3]}" stroke-width="${6 + (i % 3) * 4}" stroke-linecap="round" opacity="0.5"/>`
      }).join('')
      const wave = Array.from({ length: 60 }, (_, i) => {
        const h = 10 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 60
        return `<rect x="${20 + i * 20}" y="${580 - h}" width="10" height="${h.toFixed(0)}" rx="5" fill="${stage.glow}" opacity="0.3"/>`
      }).join('')
      return `<g>${streaks}</g><g>${wave}</g>`
    }
    case 'kente': {
      // Woven strips in the side columns, inspired by West African textiles.
      const strip = (x: number) =>
        Array.from({ length: 10 }, (_, i) => {
          const y = i * 60
          const color = [roles.snare, roles.kick, roles.hihat, roles.bass][i % 4]
          return `<rect x="${x}" y="${y}" width="140" height="60" fill="${color}"/>
<path d="M${x} ${y + 30}h140" stroke="${stage.outline}" stroke-width="6"/>
<path d="M${x + 20} ${y + 8}l20 14 20-14 20 14 20-14 20 14" fill="none" stroke="${stage.panel}" stroke-width="4"/>`
        }).join('')
      return `<g opacity="0.55">${strip(0)}${strip(1060)}</g>
<g opacity="0.35">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${300 + i * 150}" cy="40" r="14" fill="none" stroke="${stage.glow}" stroke-width="5"/>`).join('')}</g>`
    }
  }
}
