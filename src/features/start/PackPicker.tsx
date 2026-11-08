import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import type { PackSummary } from '@/core/packs/catalog'
import { MixLibraryButton } from '@/features/sharing/MixLibraryButton'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { Logo } from '@/ui/Logo'
import { DEFAULT_THEME } from '@/visuals'
import { LanguagePicker } from './LanguagePicker'

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 5l7 7-7 7M21 12H3" />
    </svg>
  )
}

/** One pack: its artwork, tempo and a single button (the whole card is its hit area). */
function PackCard({ pack, current }: { pack: PackSummary; current: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const begin = useAppStore((s) => s.begin)
  const { manifest } = pack
  const name = localize(manifest.name)
  const theme = manifest.theme ?? DEFAULT_THEME

  return (
    <article className="group border-line bg-card focus-within:border-accent hover:border-line-strong relative flex flex-col overflow-hidden rounded-2xl border shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div
        className="border-line relative aspect-video w-full overflow-hidden border-b"
        style={{ backgroundColor: theme.stage.background }}
      >
        {pack.coverUrl && (
          <img
            src={pack.coverUrl}
            alt={t('picker.coverAlt', { name })}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        <span className="bg-ink/85 absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: theme.roles.kick }}
          />
          {name}
        </span>
        {current && (
          <span className="text-ink absolute right-3 bottom-3 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase">
            {t('picker.current')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
            <span className="border-line bg-paper text-ink-muted shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold">
              {t('picker.details', { bpm: manifest.bpm, count: manifest.characters.length })}
            </span>
          </div>
          {manifest.description && (
            <p className="text-ink-muted">{localize(manifest.description)}</p>
          )}
        </div>

        <div className="border-line mt-auto flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={() => void begin(pack.id)}
            className="border-line text-ink group-hover:border-accent group-hover:bg-accent inline-flex min-h-11 items-center gap-2 rounded-xl border bg-white px-5 py-2.5 text-sm font-semibold transition-colors group-hover:text-white after:absolute after:inset-0 after:content-[''] motion-reduce:transition-none"
          >
            {current ? t('picker.backToStage') : t('picker.choose', { name })}
            <ArrowIcon />
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * The beat left on the stage keeps sounding on the home screen: this bar plays/pauses it and goes
 * back to it ("Continuar mi beat") without reloading anything.
 */
function ContinueBanner() {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const manifest = useAppStore((s) => s.manifest)
  const playing = useAppStore((s) => s.playing)
  const togglePlay = useAppStore((s) => s.togglePlay)
  const begin = useAppStore((s) => s.begin)
  if (!manifest) return null
  const theme = manifest.theme ?? DEFAULT_THEME

  return (
    <section
      aria-label={t('picker.continue')}
      className="border-line bg-card flex flex-wrap items-center gap-4 rounded-2xl border p-4 shadow-xs sm:p-5"
    >
      <button
        type="button"
        onClick={() => void togglePlay()}
        aria-label={playing ? t('transport.pause') : t('transport.play')}
        className="bg-ink text-paper grid size-12 shrink-0 place-items-center rounded-full transition active:scale-95 motion-reduce:transition-none"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          {playing ? (
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          ) : (
            <path d="M8 5.5v13l11-6.5z" />
          )}
        </svg>
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-bold">{t('picker.continueTitle', { name: localize(manifest.name) })}</p>
        <p className="text-ink-muted inline-flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className={`size-2 rounded-full ${playing ? 'motion-safe:animate-pulse' : ''}`}
            style={{ backgroundColor: playing ? theme.roles.kick : 'currentColor' }}
          />
          {playing ? t('picker.continuePlaying') : t('picker.continuePaused')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void begin(manifest.id)}
        className="bg-accent hover:bg-accent-hover inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors motion-reduce:transition-none"
      >
        {t('picker.continue')}
        <ArrowIcon />
      </button>
    </section>
  )
}

/** "¿Qué vas a crear hoy?": the editorial home. Choosing a pack is the gesture that unlocks audio. */
export function PackPicker() {
  const { t } = useTranslation()
  const catalog = useAppStore((s) => s.catalog)
  const loadCatalog = useAppStore((s) => s.loadCatalog)
  const currentId = useAppStore((s) => s.manifest?.id ?? null)

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Logo />
          <LanguagePicker />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-8 sm:py-12">
        <section className="flex max-w-2xl flex-col gap-3">
          <span className="border-line inline-flex w-fit items-center gap-2 rounded-full border bg-white px-2.5 py-1 text-[11px] font-bold tracking-widest uppercase">
            <span aria-hidden className="bg-accent size-1.5 rounded-full" />
            {t('picker.eyebrow')}
          </span>
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
            {t('picker.title')}
          </h1>
          <p className="text-ink-muted text-lg sm:text-xl">{t('picker.subtitle')}</p>
          <MixLibraryButton />
        </section>

        <ContinueBanner />

        {catalog.state === 'ready' ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {catalog.packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} current={pack.id === currentId} />
            ))}
          </section>
        ) : (
          <p role="status" className="text-ink-muted">
            {t('picker.loading')}
          </p>
        )}
      </main>

      <footer className="border-line border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-sm">
          <p className="font-medium">{t('picker.footer')}</p>
          <p className="border-line text-ink-muted inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs font-semibold">
            <svg
              viewBox="0 0 24 24"
              className="text-ink size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H4a1 1 0 0 0-1 1zm18 0a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h1a1 1 0 0 1 1 1z" />
            </svg>
            {t('picker.headphones')}
          </p>
        </div>
      </footer>
    </div>
  )
}
