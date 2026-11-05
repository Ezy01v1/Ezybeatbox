import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import type { CharacterDef, SoundDef } from '@/core/packs/schema'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { RoleGlyph, readableInk } from '@/visuals'
import { useApplyDrop } from './dnd/useApplyDrop'
import { usePointerDrag } from './dnd/usePointerDrag'

/**
 * A palette sound. Drag it onto its character, or tap/click it (or press Enter/Space) to
 * assign it directly: that is the accessible fallback to drag & drop.
 */
export function SoundIcon({
  character,
  sound,
  color,
}: {
  character: CharacterDef
  sound: SoundDef
  /** Role color from the pack theme. */
  color: string
}) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const applyDrop = useApplyDrop()
  const setSound = useAppStore((s) => s.setSound)
  const selected = useAppStore((s) => s.slots[character.id]?.target === sound.id)

  const drag = usePointerDrag(
    { kind: 'sound', soundId: sound.id, characterId: character.id },
    applyDrop,
    () => setSound(character.id, sound.id),
  )

  const label = localize(sound.label)
  const characterName = localize(character.label)

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={t(selected ? 'palette.selected' : 'palette.sound', {
        sound: label,
        character: characterName,
      })}
      onPointerDown={drag.onPointerDown}
      onClick={drag.onClick}
      className="flex w-16 shrink-0 cursor-grab touch-pan-x flex-col items-center gap-1 rounded-xl p-1 select-none active:cursor-grabbing"
    >
      <span
        className={`grid size-12 place-items-center rounded-full border-2 transition-transform motion-reduce:transition-none ${
          selected ? 'ring-accent ring-offset-paper ring-2 ring-offset-2' : ''
        }`}
        style={{
          borderColor: color,
          // Tinted when idle, solid when chosen; the glyph keeps the UI ink for contrast.
          backgroundColor: selected ? color : `color-mix(in srgb, ${color} 18%, transparent)`,
          color: selected ? readableInk(color) : 'var(--color-ink)',
        }}
      >
        <RoleGlyph role={character.role} className="size-6" />
      </span>
      <span className="text-ink-muted w-full truncate text-center text-[11px] leading-tight font-medium">
        {label}
      </span>
    </button>
  )
}
