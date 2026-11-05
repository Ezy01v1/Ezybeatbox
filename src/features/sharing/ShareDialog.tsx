import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { Modal } from '@/ui/Modal'

type CopyState = 'idle' | 'copied' | 'failed'

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const getShareUrl = useAppStore((s) => s.getShareUrl)
  const hasSounds = useAppStore((s) => Object.values(s.slots).some((slot) => slot.target))
  // Snapshot when the dialog opens; changes made afterwards need a new link.
  const url = useMemo(() => getShareUrl(), [getShareUrl])
  const [copy, setCopy] = useState<CopyState>('idle')
  const canNativeShare = typeof navigator.share === 'function'

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <Modal title={t('share.title')} onClose={onClose}>
      <p className="text-ink-muted text-sm">{t('share.hint')}</p>
      {!hasSounds && (
        <p className="bg-paper text-warning rounded-xl px-3 py-2 text-sm font-medium">
          {t('share.emptyWarning')}
        </p>
      )}
      <label className="flex flex-col gap-1 text-sm">
        <span className="sr-only">{t('share.linkLabel')}</span>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="border-line text-ink min-h-11 w-full rounded-xl border bg-white px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="bg-accent hover:bg-accent-hover min-h-11 rounded-xl px-4 py-2 font-semibold text-white"
        >
          {t('share.copy')}
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={() =>
              void navigator.share({ title: t('share.nativeTitle'), url }).catch(() => {})
            }
            className="border-line bg-card hover:border-line-strong min-h-11 rounded-xl border px-4 py-2 font-semibold"
          >
            {t('share.native')}
          </button>
        )}
        <span role="status" className="text-sm">
          {copy === 'copied' && (
            <span className="text-success font-semibold">{t('share.copied')}</span>
          )}
          {copy === 'failed' && (
            <span className="text-danger font-semibold">{t('share.copyFailed')}</span>
          )}
        </span>
      </div>
    </Modal>
  )
}
