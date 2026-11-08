import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { Logo } from '@/ui/Logo'
import { PackPicker } from './PackPicker'

/** "Toca para empezar" → loading with progress → (stage) or a visible error with retry. */
export function StartScreen() {
  const { t } = useTranslation()
  const phase = useAppStore((s) => s.phase)
  const progress = useAppStore((s) => s.progress)
  const error = useAppStore((s) => s.error)
  const manifest = useAppStore((s) => s.manifest)
  const begin = useAppStore((s) => s.begin)
  const openingSharedMix = useAppStore((s) => s.openingSharedMix)
  const catalogFailed = useAppStore((s) => s.catalog.state === 'error')

  // The pack picker is the home; a shared link skips it (the link already names its pack), and
  // without a catalog the classic "Toca para empezar" opens the default pack.
  if (phase === 'start' && !openingSharedMix && !catalogFailed) return <PackPicker />

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1>
          <Logo size="lg" />
        </h1>
        <p className="text-ink-muted text-lg sm:text-xl">{t('app.tagline')}</p>
      </div>

      {phase === 'start' && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void begin()}
            className="bg-accent shadow-accent/20 hover:bg-accent-hover min-h-14 rounded-xl px-8 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-95 motion-reduce:transition-none"
          >
            {t('start.tap')}
          </button>
          <p className="text-ink-muted text-sm">{t('start.hint')}</p>
          {catalogFailed && !openingSharedMix && (
            <p className="text-ink-muted max-w-sm text-sm">{t('picker.error')}</p>
          )}
          {openingSharedMix && (
            <p className="border-line bg-card text-accent rounded-full border px-3 py-1.5 text-sm font-medium">
              {t('start.shared')}
            </p>
          )}
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex w-full max-w-xs flex-col gap-2 text-sm font-medium" role="status">
          <span>{t('start.loading', { percent: Math.round(progress * 100) })}</span>
          <div className="bg-line h-2 overflow-hidden rounded-full">
            <div
              className="bg-accent h-full rounded-full transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'error' && error && (
        <div
          role="alert"
          className="border-danger/40 bg-danger-soft flex max-w-md flex-col items-center gap-3 rounded-2xl border p-5"
        >
          <h2 className="text-danger font-extrabold">{t('errors.title')}</h2>
          <p>
            {error.kind === 'pack'
              ? t('errors.pack')
              : error.kind === 'audio-blocked'
                ? t('errors.audioBlocked')
                : t('errors.unknown')}
          </p>
          {error.kind === 'pack' && error.details.length > 0 && (
            <details className="text-ink-muted w-full text-left text-xs">
              <summary className="cursor-pointer">{t('errors.details')}</summary>
              <ul className="mt-1 list-disc pl-5 font-mono break-all">
                {error.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </details>
          )}
          <button
            type="button"
            onClick={() => void begin()}
            className="bg-ink text-paper min-h-11 rounded-xl px-6 py-2 font-semibold"
          >
            {t('errors.retry')}
          </button>
          {manifest && (
            <button
              type="button"
              onClick={() => void begin(manifest.id)}
              className="border-line bg-card text-ink min-h-11 rounded-xl border px-6 py-2 font-semibold"
            >
              {t('picker.continue')}
            </button>
          )}
        </div>
      )}
    </main>
  )
}
