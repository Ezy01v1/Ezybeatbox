import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import { Modal } from '@/ui/Modal'

export function MixesDialog({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const savedMixes = useAppStore((s) => s.savedMixes)
  const saveCurrentMix = useAppStore((s) => s.saveCurrentMix)
  const loadSavedMix = useAppStore((s) => s.loadSavedMix)
  const deleteSavedMix = useAppStore((s) => s.deleteSavedMix)
  const [name, setName] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(iso),
    )

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim() || t('mixes.namePlaceholder')
    await saveCurrentMix(trimmed)
    setName('')
  }

  return (
    <Modal title={t('mixes.title')} onClose={onClose}>
      <form onSubmit={(e) => void onSave(e)} className="flex flex-col gap-2">
        <label htmlFor="mix-name" className="text-sm text-neutral-400">
          {t('mixes.nameLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="mix-name"
            value={name}
            maxLength={60}
            placeholder={t('mixes.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-full bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300"
          >
            {t('mixes.save')}
          </button>
        </div>
        <p className="text-xs text-neutral-500">{t('mixes.localOnly')}</p>
      </form>

      {savedMixes.length === 0 ? (
        <p className="text-sm text-neutral-400">{t('mixes.empty')}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-800">
          {savedMixes.map((saved) => (
            <li key={saved.id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{saved.name}</p>
                <p className="text-xs text-neutral-500">
                  {t('mixes.savedAt', { date: formatDate(saved.updatedAt) })}
                </p>
              </div>
              <button
                type="button"
                aria-label={t('mixes.loadLabel', { name: saved.name })}
                onClick={() => {
                  void loadSavedMix(saved.id)
                  onClose()
                }}
                className="rounded-full bg-neutral-800 px-3 py-1.5 text-sm hover:bg-neutral-700"
              >
                {t('mixes.load')}
              </button>
              <button
                type="button"
                aria-label={
                  confirmingId === saved.id
                    ? t('mixes.confirmDelete')
                    : t('mixes.deleteLabel', { name: saved.name })
                }
                onClick={() => {
                  if (confirmingId === saved.id) {
                    setConfirmingId(null)
                    void deleteSavedMix(saved.id)
                  } else {
                    setConfirmingId(saved.id)
                  }
                }}
                onBlur={() => setConfirmingId((id) => (id === saved.id ? null : id))}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  confirmingId === saved.id
                    ? 'bg-rose-500 text-neutral-950'
                    : 'text-rose-300 hover:bg-neutral-800'
                }`}
              >
                {confirmingId === saved.id ? t('mixes.confirmDelete') : t('mixes.delete')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
