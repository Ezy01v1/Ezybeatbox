import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { downloadBlob, exportFileName } from './download'
import { MixesDialog } from './MixesDialog'
import { ShareDialog } from './ShareDialog'

/** Shared shape; color comes from `secondaryClass` or `primaryClass` so they never compete. */
const baseClass =
  'inline-flex min-h-10 items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold shadow-xs transition-colors disabled:opacity-60 motion-reduce:transition-none'
const secondaryClass = `${baseClass} border-line bg-card text-ink hover:border-line-strong`
const recordingClass = `${baseClass} border-line bg-card text-danger`
const primaryClass = `${baseClass} border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover`

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Header actions: saved mixes, share link and audio export. */
export function MixActions() {
  const { t } = useTranslation()
  const [dialog, setDialog] = useState<'mixes' | 'share' | null>(null)
  const exportStatus = useAppStore((s) => s.exportStatus)
  const exportAudio = useAppStore((s) => s.exportAudio)
  const packId = useAppStore((s) => s.manifest?.id ?? 'mix')

  async function onExport() {
    const blob = await exportAudio()
    if (blob) downloadBlob(blob, exportFileName(packId, blob.type))
  }

  const exportLabel =
    exportStatus.state === 'waiting'
      ? t('export.waiting')
      : exportStatus.state === 'recording'
        ? t('export.recording', { done: exportStatus.barsDone, total: exportStatus.barsTotal })
        : t('export.button')

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setDialog('mixes')} className={secondaryClass}>
        <Icon d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />
        {t('mixes.button')}
      </button>
      <button type="button" onClick={() => setDialog('share')} className={secondaryClass}>
        <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        {t('share.button')}
      </button>
      <button
        type="button"
        onClick={() => void onExport()}
        disabled={exportStatus.state !== 'idle'}
        aria-live="polite"
        className={exportStatus.state === 'recording' ? recordingClass : primaryClass}
      >
        {exportStatus.state === 'recording' ? (
          <span
            className="bg-danger size-2.5 animate-pulse rounded-full motion-reduce:animate-none"
            aria-hidden
          />
        ) : (
          <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" />
        )}
        <span
          aria-label={
            exportStatus.state === 'recording'
              ? t('export.recordingLabel', {
                  done: exportStatus.barsDone,
                  total: exportStatus.barsTotal,
                })
              : undefined
          }
        >
          {exportLabel}
        </span>
      </button>

      {dialog === 'mixes' && <MixesDialog onClose={() => setDialog(null)} />}
      {dialog === 'share' && <ShareDialog onClose={() => setDialog(null)} />}
    </div>
  )
}
