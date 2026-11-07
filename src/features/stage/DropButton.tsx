import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'

/**
 * Drop: one bar of only kick and bass from the next bar line, then everyone is back. Only
 * while playing; the label follows the engine (waiting for the bar line, then sounding).
 */
export function DropButton() {
  const { t } = useTranslation()
  const drop = useAppStore((s) => s.drop)
  const dropState = useAppStore((s) => s.dropState)
  const playing = useAppStore((s) => s.playing)
  const busy = dropState !== 'idle'

  return (
    <button
      type="button"
      onClick={drop}
      disabled={!playing || busy}
      title={t(playing ? 'drop.hint' : 'drop.needsPlay')}
      className={`focus-visible:outline-accent inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-(--stage-ink) px-3.5 text-xs font-bold transition-[transform,background-color,color] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 disabled:cursor-not-allowed motion-reduce:transition-none ${
        busy ? 'bg-(--stage-ink) text-(--stage-bg)' : 'bg-(--stage-panel) disabled:opacity-50'
      } ${dropState === 'dropping' ? 'scale-105 motion-reduce:scale-100' : ''}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 4v13M6 11l6 6 6-6M5 20h14" />
      </svg>
      <span aria-live="polite">{t(`drop.${dropState}`)}</span>
    </button>
  )
}
