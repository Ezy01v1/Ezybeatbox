import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { useTheme } from '@/app/useTheme'
import { AUDIO_CONFIG } from '@/core/audio/config'
import type { PackManifest } from '@/core/packs/schema'
import { MixActions } from '@/features/sharing/MixActions'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { Logo } from '@/ui/Logo'

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
              playing && i === beat ? (i === 0 ? 'bg-accent' : 'bg-ink') : 'bg-line-strong'
            }`}
          />
        ))}
      </div>
      <span className="text-ink-muted text-xs font-semibold tabular-nums">
        {t('transport.bar', { bar: bar + 1 })}
      </span>
    </div>
  )
}

/** Which pack is loaded: name, tempo and the theme's stage color as a dot. */
function PackChip({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const theme = useTheme()

  return (
    <span className="border-line bg-card text-ink hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex">
      <span
        aria-hidden
        className="size-2 rounded-full"
        style={{ backgroundColor: theme.roles.kick }}
      />
      {t('transport.pack', { name: localize(manifest.name), bpm: manifest.bpm })}
    </span>
  )
}

export function TransportBar({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const playing = useAppStore((s) => s.playing)
  const togglePlay = useAppStore((s) => s.togglePlay)
  const masterVolumeDb = useAppStore((s) => s.masterVolumeDb)
  const setMasterVolume = useAppStore((s) => s.setMasterVolume)

  return (
    <header className="border-line bg-paper flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-5">
      <div className="flex items-center gap-3">
        <h1>
          <Logo />
        </h1>
        <PackChip manifest={manifest} />
      </div>

      <button
        type="button"
        onClick={() => void togglePlay()}
        aria-label={playing ? t('transport.pause') : t('transport.play')}
        className="bg-ink text-paper grid size-11 place-items-center rounded-full shadow-sm transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none"
      >
        <PlayIcon playing={playing} />
      </button>

      <BeatIndicator beatsPerBar={manifest.timeSignature[0]} />

      <label className="text-ink-muted ml-auto flex items-center gap-2">
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
          className="accent-accent w-28"
        />
      </label>

      <MixActions />
    </header>
  )
}
