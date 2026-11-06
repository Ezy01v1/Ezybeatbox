import type { CharacterRole } from '@/core/packs/schema'

/** Packs drawn with the streetwear SVG characters (no Rive, so no Rive watermark). */
const STREETWEAR_PACKS = new Set(['boom-bap-01'])

/** Packs whose characters are Rive files (`public/packs/<pack>/<role>.riv`). */
const RIVE_PACKS = new Set(['trap-01'])

/** The `.riv` for a pack's character, or undefined when the pack is drawn as SVG. */
export function characterArt(packId: string | undefined, role: CharacterRole): string | undefined {
  if (packId && RIVE_PACKS.has(packId)) {
    return `${import.meta.env.BASE_URL}packs/${packId}/${role}.riv`
  }
  return undefined
}

/**
 * SVG style for a pack: the renderer for SVG packs, and what Rive packs show while their `.riv`
 * loads or if it fails.
 */
export function svgStyle(packId: string | undefined): 'streetwear' | 'classic' {
  return packId && STREETWEAR_PACKS.has(packId) ? 'streetwear' : 'classic'
}
