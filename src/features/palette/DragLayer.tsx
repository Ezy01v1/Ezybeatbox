import type { PackManifest } from '@/core/packs/schema'
import { ROLE_COLORS, RoleGlyph } from '@/visuals'
import { registerGhost, useDragState } from './dnd/dragStore'

/** The icon that follows the pointer while dragging. Positioned imperatively (see dragStore). */
export function DragLayer({ manifest }: { manifest: PackManifest }) {
  const payload = useDragState((s) => s.payload)
  if (!payload) return null

  const character = manifest.characters.find((c) => c.id === payload.characterId)
  if (!character) return null
  const color = ROLE_COLORS[character.role]

  return (
    <div
      ref={registerGhost}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
    >
      <span
        className="grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-xl"
        style={{
          backgroundColor: payload.kind === 'sound' ? color : '#3f3f46',
          color: payload.kind === 'sound' ? '#0a0a0a' : color,
        }}
      >
        <RoleGlyph role={character.role} className="size-7" />
      </span>
    </div>
  )
}
