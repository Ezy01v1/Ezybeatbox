import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import type { CharacterDef, SoundDef } from '@/core/packs/schema'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { RoleGlyph, readableInk } from '@/visuals'
import { useApplyDrop } from './dnd/useApplyDrop'
import { usePointerDrag } from './dnd/usePointerDrag'
import { PALETTE_KEYS_HINT_ID } from './keys'

/**
 * A palette sound. Drag it onto any character, or tap/click it (or press Enter/Space) to
 * place it where `placeSound` decides: that is the accessible fallback to drag & drop. With the
 * keyboard, 1–6 put it on that character instead (stage order), e.g. two kicks at once.
 * `character` is the sound's section (color, glyph), not where it must go.
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
  const placeSound = useAppStore((s) => s.placeSound)
  const setSound = useAppStore((s) => s.setSound)
  const characters = useAppStore((s) => s.manifest?.characters)
  // Any character may hold it (one at a time); name that one in the label.
  const holderId = useAppStore(
    (s) => Object.entries(s.slots).find(([, slot]) => slot.target === sound.id)?.[0],
  )
  const holder = useAppStore((s) => s.manifest?.characters.find((c) => c.id === holderId))
  const selected = holderId !== undefined

  const drag = usePointerDrag(
    { kind: 'sound', soundId: sound.id, characterId: character.id },
    applyDrop,
    () => placeSound(sound.id),
  )

  const label = localize(sound.label)
  const characterName = holder ? localize(holder.name ?? holder.label) : ''

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const target = characters?.[Number(event.key) - 1]
    if (!/^[1-9]$/.test(event.key) || !target) return
    event.preventDefault()
    setSound(target.id, sound.id)
  }

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={t(selected ? 'palette.selected' : 'palette.sound', {
        sound: label,
        section: localize(character.label),
        character: characterName,
      })}
      aria-keyshortcuts={characters?.map((_, i) => String(i + 1)).join(' ')}
      aria-describedby={PALETTE_KEYS_HINT_ID}
      onPointerDown={drag.onPointerDown}
      onClick={drag.onClick}
      onKeyDown={onKeyDown}
      className="flex w-[4.5rem] shrink-0 cursor-grab touch-pan-x flex-col items-center gap-1 rounded-xl p-1 select-none active:cursor-grabbing"
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
      {/* Two lines, so variations ("Clásico + remate", "Clásico swing") stay distinguishable. */}
      <span className="text-ink-muted line-clamp-2 min-h-[2.5em] w-full text-center text-[11px] leading-tight font-medium hyphens-auto">
        {label}
      </span>
    </button>
  )
}
