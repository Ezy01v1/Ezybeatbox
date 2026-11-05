import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore, useEngine } from '@/app/store/AppStoreContext'
import { useTheme } from '@/app/useTheme'
import type { CharacterDef } from '@/core/packs/schema'
import { useApplyDrop } from '@/features/palette/dnd/useApplyDrop'
import { useDragState } from '@/features/palette/dnd/dragStore'
import { acceptsDrop } from '@/features/palette/dnd/resolveDrop'
import { DROP_TARGET_ATTR, usePointerDrag } from '@/features/palette/dnd/usePointerDrag'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { usePrefersReducedMotion } from '@/ui/usePrefersReducedMotion'
import { ActiveCharacterRenderer, readableInk } from '@/visuals'
import { compensateLatency } from '@/visuals/levels'

/**
 * Round M / S / ✕ controls: 44 px on wide screens. On phones three cards share a row, so they
 * shrink to 32 px to fit (still separated, and the whole card is the drop target).
 */
const controlClass =
  'grid size-8 place-items-center rounded-full text-sm font-bold transition-colors motion-reduce:transition-none sm:size-9 lg:size-11'
const controlIdle =
  'bg-(--stage-ink)/8 text-(--stage-ink) hover:bg-(--stage-ink)/15 disabled:opacity-30 disabled:hover:bg-(--stage-ink)/8'

export function CharacterSlot({ character, color }: { character: CharacterDef; color: string }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const engine = useEngine()
  const theme = useTheme()
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
  const singing = slot.status === 'playing' || slot.status === 'stopping'
  const onRole = readableInk(color)

  // Card edge tells the state at a glance: solid role color while singing, dashed while
  // waiting for the bar line, the theme outline otherwise.
  const cardStyle: React.CSSProperties = {
    borderColor: singing || slot.status === 'queued' || accepts ? color : undefined,
    borderStyle: slot.status === 'queued' ? 'dashed' : 'solid',
    boxShadow:
      singing && !slot.muted
        ? `0 0 0 3px ${color}33, 0 10px 28px -8px ${color}99`
        : accepts && isOver
          ? `0 0 0 4px ${color}55`
          : undefined,
  }

  return (
    <section
      aria-label={
        sound
          ? t('character.labelWithSound', { name, sound: localize(sound.label), status })
          : t('character.label', { name, status })
      }
      className={`flex min-h-0 flex-col items-center gap-1.5 rounded-2xl border-2 border-(--stage-outline)/25 bg-(--stage-panel) p-1.5 transition-[opacity,box-shadow] motion-reduce:transition-none sm:p-2 ${
        dimmed ? 'opacity-40' : ''
      }`}
      style={cardStyle}
    >
      <div
        {...{ [DROP_TARGET_ATTR]: character.id }}
        onPointerDown={drag.onPointerDown}
        title={target ? t('character.dragOutHint') : undefined}
        className={`relative aspect-[100/130] max-h-[34dvh] w-full p-1 select-none ${
          target ? 'cursor-grab touch-none active:cursor-grabbing' : ''
        }`}
      >
        <ActiveCharacterRenderer
          role={character.role}
          color={color}
          outline={theme.stage.outline}
          status={slot.status}
          muted={slot.muted}
          level={level}
          beat={beat}
          reducedMotion={reducedMotion}
        />
        {accepts && (
          <span
            className={`absolute inset-x-0 bottom-2 mx-auto w-fit rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${
              isOver ? '' : 'opacity-80'
            }`}
            style={{ backgroundColor: color, color: onRole }}
          >
            {t('character.dropHere')}
          </span>
        )}
      </div>

      <p className="text-sm font-extrabold tracking-tight">{name}</p>
      <p
        className={`max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
          singing
            ? 'border-transparent'
            : slot.status === 'empty'
              ? 'border-transparent opacity-80'
              : 'border-dashed border-current'
        }`}
        style={singing ? { backgroundColor: color, color: onRole } : undefined}
      >
        {sound ? `${localize(sound.label)} · ${status}` : status}
      </p>

      <div className="flex gap-0.5 sm:gap-1">
        <button
          type="button"
          aria-pressed={slot.muted}
          aria-label={t('character.mute', { name })}
          onClick={() => toggleMute(character.id)}
          className={`${controlClass} ${
            slot.muted ? 'bg-(--stage-ink) text-(--stage-panel)' : controlIdle
          }`}
        >
          M
        </button>
        <button
          type="button"
          aria-pressed={slot.solo}
          aria-label={t('character.solo', { name })}
          onClick={() => toggleSolo(character.id)}
          className={`${controlClass} ${slot.solo ? 'bg-accent text-white' : controlIdle}`}
        >
          S
        </button>
        <button
          type="button"
          aria-label={t('character.remove', { name })}
          disabled={!target}
          onClick={() => clearSound(character.id)}
          className={`${controlClass} ${controlIdle}`}
        >
          ✕
        </button>
      </div>
    </section>
  )
}
