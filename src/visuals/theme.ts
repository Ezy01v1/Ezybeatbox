import type { PackManifest, PackTheme } from '@/core/packs/schema'

/** Shared UI ink (also defined as `--color-ink` in index.css). */
const DARK_INK = '#202124'
const LIGHT_INK = '#ffffff'

/**
 * Theme for packs that do not declare one: a neutral stage that sits quietly inside the
 * editorial UI. Role colors are dark enough to read on light cards.
 */
export const DEFAULT_THEME: PackTheme = {
  id: 'default',
  stage: {
    background: '#ebe7de',
    panel: '#fbfaf7',
    outline: '#c9c3b6',
    ink: DARK_INK,
    glow: '#1a56db',
    pattern: 'none',
  },
  roles: {
    kick: '#ea580c',
    snare: '#db2777',
    hihat: '#ca8a04',
    bass: '#7c3aed',
    voice: '#16a34a',
    fx: '#0e7490',
  },
}

export function resolveTheme(manifest: PackManifest | null | undefined): PackTheme {
  return manifest?.theme ?? DEFAULT_THEME
}

/** Color for a character in its "no sound" state. */
export const IDLE_COLOR = '#9a948a'

function channel(value: number): number {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a `#rrggbb` color. */
export function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16)
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  )
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** Dark or light ink, whichever contrasts more with `background` (for text on role colors). */
export function readableInk(background: string): string {
  return contrastRatio(background, DARK_INK) >= contrastRatio(background, LIGHT_INK)
    ? DARK_INK
    : LIGHT_INK
}
