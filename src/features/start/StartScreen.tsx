import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'

/** "Toca para empezar" → loading with progress → (stage) or a visible error with retry. */
export function StartScreen() {
  const { t } = useTranslation()
  const phase = useAppStore((s) => s.phase)
  const progress = useAppStore((s) => s.progress)
  const error = useAppStore((s) => s.error)
  const begin = useAppStore((s) => s.begin)
  const openingSharedMix = useAppStore((s) => s.openingSharedMix)

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('app.name')}</h1>
        <p className="text-neutral-400">{t('app.tagline')}</p>
      </div>

      {phase === 'start' && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => void begin()}
            className="rounded-full bg-amber-400 px-8 py-4 text-lg font-semibold text-neutral-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 active:scale-95 motion-reduce:transition-none"
          >
            {t('start.tap')}
          </button>
          <p className="text-sm text-neutral-500">{t('start.hint')}</p>
          {openingSharedMix && <p className="text-sm text-amber-300">{t('start.shared')}</p>}
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex w-full max-w-xs flex-col gap-2" role="status">
          <span>{t('start.loading', { percent: Math.round(progress * 100) })}</span>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'error' && error && (
        <div
          role="alert"
          className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-rose-500/60 bg-rose-950/30 p-4"
        >
          <h2 className="font-semibold text-rose-300">{t('errors.title')}</h2>
          <p>
            {error.kind === 'pack'
              ? t('errors.pack')
              : error.kind === 'audio-blocked'
                ? t('errors.audioBlocked')
                : t('errors.unknown')}
          </p>
          {error.kind === 'pack' && error.details.length > 0 && (
            <details className="w-full text-left text-xs text-neutral-400">
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
            className="rounded-full bg-neutral-100 px-6 py-2 font-semibold text-neutral-950"
          >
            {t('errors.retry')}
          </button>
        </div>
      )}
    </main>
  )
}
