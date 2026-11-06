import type { CharacterRole } from '@/core/packs/schema'

export function characterArt(packId: string | undefined, role: CharacterRole): string | undefined {
  if (packId === 'boom-bap-01' || packId === 'trap-01') {
    return `${import.meta.env.BASE_URL}packs/${packId}/${role}.riv`
  }
  return undefined
}

/** Packs whose Rive art is the streetwear rig, which has a matching static SVG. */
const STREETWEAR_PACKS = new Set(['boom-bap-01'])

/** Art style shown while the pack's Rive art loads, or if it fails: same style when possible. */
export function fallbackStyle(packId: string | undefined): 'streetwear' | 'classic' {
  return packId && STREETWEAR_PACKS.has(packId) ? 'streetwear' : 'classic'
}
