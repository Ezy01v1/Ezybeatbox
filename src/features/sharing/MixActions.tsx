import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { downloadBlob, exportFileName } from './download'
import { MixesDialog } from './MixesDialog'
import { ShareDialog } from './ShareDialog'

const buttonClass =
  'flex items-center gap-1.5 rounded-full bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700 disabled:opacity-60'

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
      <button type="button" onClick={() => setDialog('mixes')} className={buttonClass}>
        <Icon d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6" />
        {t('mixes.button')}
      </button>
      <button type="button" onClick={() => setDialog('share')} className={buttonClass}>
        <Icon d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        {t('share.button')}
      </button>
      <button
        type="button"
        onClick={() => void onExport()}
        disabled={exportStatus.state !== 'idle'}
        aria-live="polite"
        className={`${buttonClass} ${exportStatus.state === 'recording' ? 'text-rose-300' : ''}`}
      >
        {exportStatus.state === 'recording' ? (
          <span
            className="size-2.5 animate-pulse rounded-full bg-rose-500 motion-reduce:animate-none"
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
