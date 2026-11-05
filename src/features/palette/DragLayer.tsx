import type { PackManifest } from '@/core/packs/schema'
import { useTheme } from '@/app/useTheme'
import { RoleGlyph, readableInk } from '@/visuals'
import { registerGhost, useDragState } from './dnd/dragStore'

/** The icon that follows the pointer while dragging. Positioned imperatively (see dragStore). */
export function DragLayer({ manifest }: { manifest: PackManifest }) {
  const payload = useDragState((s) => s.payload)
  const theme = useTheme()
  if (!payload) return null

  const character = manifest.characters.find((c) => c.id === payload.characterId)
  if (!character) return null
  const color = theme.roles[character.role]

  return (
    <div
      ref={registerGhost}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-50 will-change-transform"
    >
      <span
        className="grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-xl"
        style={{
          // Removing a sound shows a neutral chip with the role color as the glyph.
          backgroundColor: payload.kind === 'sound' ? color : 'var(--color-ink)',
          color: payload.kind === 'sound' ? readableInk(color) : 'var(--color-paper)',
        }}
      >
        <RoleGlyph role={character.role} className="size-7" />
      </span>
    </div>
  )
}
