import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { AUDIO_CONFIG } from '@/core/audio/config'

function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      {playing ? (
        <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
      ) : (
        <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
      )}
    </svg>
  )
}

/** Beat dots + bar number. Re-renders once per beat, nothing per frame. */
function BeatIndicator({ beatsPerBar }: { beatsPerBar: number }) {
  const { t } = useTranslation()
  const playing = useAppStore((s) => s.playing)
  const { bar, beat } = useAppStore((s) => s.position)

  return (
    <div
      className="flex items-center gap-2"
      role="img"
      aria-label={t('transport.position', { bar: bar + 1, beat: beat + 1 })}
    >
      <div className="flex gap-1.5">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full ${
              playing && i === beat
                ? i === 0
                  ? 'bg-amber-400'
                  : 'bg-neutral-200'
                : 'bg-neutral-700'
            }`}
          />
        ))}
      </div>
      <span className="font-mono text-xs text-neutral-400 tabular-nums">
        {t('transport.bar', { bar: bar + 1 })}
      </span>
    </div>
  )
}

export function TransportBar({ beatsPerBar }: { beatsPerBar: number }) {
  const { t } = useTranslation()
  const playing = useAppStore((s) => s.playing)
  const togglePlay = useAppStore((s) => s.togglePlay)
  const masterVolumeDb = useAppStore((s) => s.masterVolumeDb)
  const setMasterVolume = useAppStore((s) => s.setMasterVolume)

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-800 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <h1 className="text-lg font-bold tracking-tight">{t('app.name')}</h1>

      <button
        type="button"
        onClick={() => void togglePlay()}
        aria-label={playing ? t('transport.pause') : t('transport.play')}
        className="grid size-11 place-items-center rounded-full bg-amber-400 text-neutral-950 hover:bg-amber-300"
      >
        <PlayIcon playing={playing} />
      </button>

      <BeatIndicator beatsPerBar={beatsPerBar} />

      <label className="ml-auto flex items-center gap-2 text-xs text-neutral-400">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          <path
            d="M16 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">{t('transport.masterVolume')}</span>
        <input
          type="range"
          min={AUDIO_CONFIG.minVolumeDb}
          max={AUDIO_CONFIG.maxVolumeDb}
          step={1}
          value={masterVolumeDb}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          className="w-28 accent-amber-400"
        />
      </label>
    </header>
  )
}
