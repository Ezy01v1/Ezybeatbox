import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, useEngine } from '@/app/store/AppStoreContext'
import type { CharacterDef } from '@/core/packs/schema'
import { useApplyDrop } from '@/features/palette/dnd/useApplyDrop'
import { useDragState } from '@/features/palette/dnd/dragStore'
import { acceptsDrop } from '@/features/palette/dnd/resolveDrop'
import { DROP_TARGET_ATTR, usePointerDrag } from '@/features/palette/dnd/usePointerDrag'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { usePrefersReducedMotion } from '@/ui/usePrefersReducedMotion'
import { ActiveCharacterRenderer, ROLE_COLORS } from '@/visuals'
import { compensateLatency } from '@/visuals/levels'

const toggleClass = (on: boolean, onClass: string) =>
  `min-w-9 rounded-md px-2 py-1 text-sm font-semibold transition-colors motion-reduce:transition-none ${
    on ? onClass : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
  }`

export function CharacterSlot({ character }: { character: CharacterDef }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const engine = useEngine()
  const reducedMotion = usePrefersReducedMotion()
  const applyDrop = useApplyDrop()

  const slot = useAppStore((s) => s.slots[character.id])
  const clearSound = useAppStore((s) => s.clearSound)
  const toggleMute = useAppStore((s) => s.toggleMute)
  const toggleSolo = useAppStore((s) => s.toggleSolo)

  const dragPayload = useDragState((s) => s.payload)
  const isOver = useDragState((s) => s.overCharacterId === character.id)
  const accepts = dragPayload !== null && acceptsDrop(dragPayload, character.id)
  const dimmed = dragPayload?.kind === 'sound' && !accepts

  const level = useMemo(
    () => compensateLatency(engine.getMeter(character.id), () => engine.getOutputLatency()),
    [engine, character.id],
  )
  const beat = useMemo(() => engine.getBeatClock(), [engine])

  const target = slot?.target ?? null
  const drag = usePointerDrag(
    target ? { kind: 'remove', characterId: character.id } : null,
    applyDrop,
  )

  if (!slot) return null

  const name = localize(character.label)
  const status = t(`character.status.${slot.status}`)
  // While stopping, the old sound is still audible until the bar line, so keep naming it.
  const shownSoundId = target ?? slot.playing
  const sound = character.sounds.find((s) => s.id === shownSoundId)
  const color = ROLE_COLORS[character.role]

  return (
    <section
      aria-label={
        sound
          ? t('character.labelWithSound', { name, sound: localize(sound.label), status })
          : t('character.label', { name, status })
      }
      className={`flex h-full min-h-0 flex-col items-center justify-end gap-1 transition-opacity motion-reduce:transition-none ${
        dimmed ? 'opacity-40' : ''
      }`}
    >
      <div
        {...{ [DROP_TARGET_ATTR]: character.id }}
        onPointerDown={drag.onPointerDown}
        title={target ? t('character.dragOutHint') : undefined}
        className={`relative max-h-80 min-h-0 w-full flex-1 rounded-3xl p-1 select-none ${
          target ? 'cursor-grab touch-none active:cursor-grabbing' : ''
        } ${accepts ? 'ring-2 ring-offset-2 ring-offset-neutral-950' : ''}`}
        style={accepts ? { ['--tw-ring-color' as string]: color } : undefined}
      >
        <ActiveCharacterRenderer
          role={character.role}
          status={slot.status}
          muted={slot.muted}
          level={level}
          beat={beat}
          reducedMotion={reducedMotion}
        />
        {accepts && (
          <span
            className={`absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full px-2 py-0.5 text-xs font-semibold text-neutral-950 ${
              isOver ? '' : 'opacity-70'
            }`}
            style={{ backgroundColor: color }}
          >
            {t('character.dropHere')}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold" style={{ color }}>
        {name}
      </p>
      <p
        className={`max-w-full truncate text-xs ${
          slot.status === 'queued' || slot.status === 'stopping'
            ? 'text-amber-300'
            : 'text-neutral-400'
        }`}
      >
        {sound ? `${localize(sound.label)} · ${status}` : status}
      </p>

      <div className="flex gap-1">
        <button
          type="button"
          aria-pressed={slot.muted}
          aria-label={t('character.mute', { name })}
          onClick={() => toggleMute(character.id)}
          className={toggleClass(slot.muted, 'bg-rose-500 text-neutral-950')}
        >
          M
        </button>
        <button
          type="button"
          aria-pressed={slot.solo}
          aria-label={t('character.solo', { name })}
          onClick={() => toggleSolo(character.id)}
          className={toggleClass(slot.solo, 'bg-amber-400 text-neutral-950')}
        >
          S
        </button>
        <button
          type="button"
          aria-label={t('character.remove', { name })}
          disabled={!target}
          onClick={() => clearSound(character.id)}
          className="min-w-9 rounded-md bg-neutral-800 px-2 py-1 text-sm text-neutral-300 hover:bg-neutral-700 disabled:opacity-30"
        >
          ✕
        </button>
      </div>
    </section>
  )
}
