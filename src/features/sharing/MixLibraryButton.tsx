import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { MixesDialog } from './MixesDialog'

export function MixLibraryButton() {
  const { t } = useTranslation()
  const refreshSavedMixes = useAppStore((s) => s.refreshSavedMixes)
  const [open, setOpen] = useState(false)

  async function openLibrary() {
    if (await refreshSavedMixes()) setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => void openLibrary()}
        className="border-line bg-card text-ink hover:border-line-strong min-h-11 w-fit rounded-xl border px-4 py-2 text-sm font-semibold shadow-xs"
      >
        {t('mixes.button')}
      </button>
      {open && <MixesDialog loadOnly onClose={() => setOpen(false)} />}
    </>
  )
}
