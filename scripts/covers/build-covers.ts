/**
 * Draws the pack picker covers (public/packs/<packId>/cover.jpg) from our own art: the stage
 * pattern of the pack's theme plus three streetwear characters in its role colors.
 *
 *   npx tsx scripts/covers/build-covers.ts                 # every pack listed in COVER_PACKS
 *   npx tsx scripts/covers/build-covers.ts house-01        # a single pack
 *
 * Boom Bap and Trap keep their illustrated covers; they are not in COVER_PACKS.
 */
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import type { CharacterRole, PackTheme } from '../../src/core/packs/schema'
import { PATTERN_BOX, patternMarkup } from '../../src/visuals/patterns'
import { BROWS_SVG, EYES_SVG, bodySvg, headSvg, paletteFor } from '../../src/visuals/streetwear/art'
import { PLACEHOLDER_PACKS } from '../placeholders/packs'

export const COVER_PACKS = ['reggaeton-01', 'house-01', 'dnb-01', 'afrobeat-01']

const WIDTH = 1280
const HEIGHT = 720
/** Character art box (same as the stage renderer): 120 × 158 from y = -6. */
const ART = { width: 120, height: 158, top: -6 }

/** Who poses on each cover, left to right; the middle one is bigger and in front. */
const LINEUP: Record<string, [CharacterRole, CharacterRole, CharacterRole]> = {
  'reggaeton-01': ['snare', 'kick', 'voice'],
  'house-01': ['hihat', 'voice', 'bass'],
  'dnb-01': ['bass', 'kick', 'fx'],
  'afrobeat-01': ['voice', 'hihat', 'snare'],
}

const SINGING = `<ellipse cx="60" cy="60" rx="5" ry="4" fill="#211722" stroke="#5e3433" stroke-width="1"/>`

function place(x: number, scale: number): string {
  const y = HEIGHT - (ART.height + ART.top) * scale
  return `translate(${(x - (ART.width / 2) * scale).toFixed(1)} ${y.toFixed(1)}) scale(${scale})`
}

/** Glow behind a character; all glows go first so none tints another character's face. */
function glow(color: string, x: number, scale: number): string {
  return `<circle transform="${place(x, scale)}" cx="60" cy="70" r="70" fill="${color}" opacity="0.35"/>`
}

function character(role: CharacterRole, color: string, x: number, scale: number): string {
  const palette = paletteFor(color)
  const head = headSvg(role, palette, BROWS_SVG + EYES_SVG + SINGING)
  const body = bodySvg(role, palette)
  return `<g transform="${place(x, scale)}">${head}${body}</g>`
}

export function coverSvg(packId: string, theme: PackTheme): string {
  const lineup = LINEUP[packId] ?? ['snare', 'kick', 'bass']
  const pattern = theme.stage.pattern
  const patternSvg =
    pattern && pattern !== 'none' && pattern !== 'vinyl'
      ? `<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${PATTERN_BOX.width} ${PATTERN_BOX.height}" preserveAspectRatio="xMidYMid slice">${patternMarkup(pattern, theme)}</svg>`
      : ''
  const [left, middle, right] = lineup
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
<rect width="${WIDTH}" height="${HEIGHT}" fill="${theme.stage.background}"/>
${patternSvg}
${glow(theme.roles[left], 330, 3.4)}${glow(theme.roles[right], 950, 3.4)}${glow(theme.roles[middle], 640, 4.2)}
${character(left, theme.roles[left], 330, 3.4)}
${character(right, theme.roles[right], 950, 3.4)}
${character(middle, theme.roles[middle], 640, 4.2)}
</svg>`
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const only = process.argv[2]
  const ids = only ? [only] : COVER_PACKS
  for (const id of ids) {
    const pack = PLACEHOLDER_PACKS.find((p) => p.meta.id === id)
    if (!pack?.meta.theme) throw new Error(`Unknown pack or pack without theme: ${id}`)
    const out = join(root, 'public', 'packs', id, 'cover.jpg')
    const jpg = await sharp(Buffer.from(coverSvg(id, pack.meta.theme)))
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    writeFileSync(out, jpg)
    console.log(`✓ ${id}/cover.jpg (${(jpg.byteLength / 1024).toFixed(0)} KB)`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
