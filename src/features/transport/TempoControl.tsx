import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { AUDIO_CONFIG } from '@/core/audio/config'
import { tempoRange } from '@/core/audio/tempo'
import type { PackManifest } from '@/core/packs/schema'

const stepButton =
  'grid size-8 place-items-center rounded-full text-base font-bold leading-none transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none'

/**
 * Live tempo: − / BPM / +. The number shows the tempo asked for; until the next bar line it is
 * highlighted as waiting. Tapping the number goes back to the pack tempo.
 */
export function TempoControl({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const { bpm, target } = useAppStore((s) => s.tempo)
  const setTempo = useAppStore((s) => s.setTempo)
  const nudgeTempo = useAppStore((s) => s.nudgeTempo)
  const { min, max } = tempoRange(manifest.bpm)
  const step = AUDIO_CONFIG.tempoStep
  const waiting = target !== bpm
  const changed = target !== manifest.bpm

  return (
    <div
      role="group"
      aria-label={t('tempo.label')}
      className="border-line bg-card inline-flex items-center rounded-full border p-0.5"
    >
      <button
        type="button"
        onClick={() => nudgeTempo(-step)}
        disabled={target <= min}
        aria-label={t('tempo.slower')}
        className={stepButton}
      >
        −
      </button>
      <button
        type="button"
        onClick={() => setTempo(manifest.bpm)}
        disabled={!changed}
        aria-label={t(changed ? 'tempo.reset' : 'tempo.current', {
          bpm: target,
          packBpm: manifest.bpm,
        })}
        title={waiting ? t('tempo.waiting') : changed ? t('tempo.resetHint') : undefined}
        className={`min-w-16 rounded-full px-1.5 text-center text-xs font-bold tabular-nums disabled:cursor-default ${
          waiting ? 'text-accent' : ''
        }`}
      >
        <span aria-live="polite">{t('tempo.value', { bpm: target })}</span>
      </button>
      <button
        type="button"
        onClick={() => nudgeTempo(step)}
        disabled={target >= max}
        aria-label={t('tempo.faster')}
        className={stepButton}
      >
        +
      </button>
    </div>
  )
}
