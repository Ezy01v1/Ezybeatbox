import type { CharacterRole } from '@/core/packs/schema'

export function characterArt(packId: string | undefined, role: CharacterRole): string | undefined {
  if (packId === 'boom-bap-01' || packId === 'trap-01') {
    return `${import.meta.env.BASE_URL}packs/${packId}/${role}.riv`
  }
  return undefined
}
