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
        <label htmlFor="mix-name" className="text-ink text-sm font-semibold">
          {t('mixes.nameLabel')}
        </label>
        <div className="flex gap-2">
          <input
            id="mix-name"
            value={name}
            maxLength={60}
            placeholder={t('mixes.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className="border-line text-ink placeholder:text-ink-muted/70 min-h-11 min-w-0 flex-1 rounded-xl border bg-white px-3 py-2"
          />
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover min-h-11 rounded-xl px-4 py-2 font-semibold text-white"
          >
            {t('mixes.save')}
          </button>
        </div>
        <p className="text-ink-muted text-xs">{t('mixes.localOnly')}</p>
      </form>

      {savedMixes.length === 0 ? (
        <p className="border-line-strong text-ink-muted rounded-xl border border-dashed p-4 text-center text-sm">
          {t('mixes.empty')}
        </p>
      ) : (
        <ul className="divide-line border-line flex flex-col divide-y rounded-xl border bg-white px-3">
          {savedMixes.map((saved) => (
            <li key={saved.id} className="flex items-center gap-2 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{saved.name}</p>
                <p className="text-ink-muted text-xs">
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
                className="border-line bg-card hover:border-accent hover:text-accent min-h-10 rounded-xl border px-3 py-1.5 text-sm font-semibold"
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
                className={`min-h-10 rounded-xl px-3 py-1.5 text-sm font-semibold ${
                  confirmingId === saved.id
                    ? 'bg-danger text-white'
                    : 'text-danger hover:bg-danger-soft'
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
