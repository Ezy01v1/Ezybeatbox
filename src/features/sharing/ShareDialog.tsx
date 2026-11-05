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
      <p className="text-sm text-neutral-400">{t('share.hint')}</p>
      {!hasSounds && <p className="text-sm text-amber-300">{t('share.emptyWarning')}</p>}
      <label className="flex flex-col gap-1 text-sm">
        <span className="sr-only">{t('share.linkLabel')}</span>
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300"
        >
          {t('share.copy')}
        </button>
        {canNativeShare && (
          <button
            type="button"
            onClick={() =>
              void navigator.share({ title: t('share.nativeTitle'), url }).catch(() => {})
            }
            className="rounded-full bg-neutral-800 px-4 py-2 font-semibold hover:bg-neutral-700"
          >
            {t('share.native')}
          </button>
        )}
        <span role="status" className="text-sm">
          {copy === 'copied' && <span className="text-emerald-300">{t('share.copied')}</span>}
          {copy === 'failed' && <span className="text-rose-300">{t('share.copyFailed')}</span>}
        </span>
      </div>
    </Modal>
  )
}
