import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRegisterSW } from 'virtual:pwa-register/react'

const OFFLINE_READY_MS = 5000

/**
 * Registers the service worker and tells the user when a new version is ready. Updating
 * reloads the page (and stops the music), so it waits for the user's OK.
 */
export function UpdatePrompt() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (!offlineReady) return
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_READY_MS)
    return () => clearTimeout(timer)
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      role="status"
      className="border-line bg-card text-ink fixed inset-x-0 top-2 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-md flex-col gap-2 rounded-2xl border p-4 text-sm shadow-xl"
    >
      {needRefresh ? (
        <>
          <p className="font-medium">{t('pwa.updateAvailable')}</p>
          <p className="text-ink-muted text-xs">{t('pwa.updateHint')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="bg-accent hover:bg-accent-hover min-h-10 rounded-xl px-4 py-1.5 font-semibold text-white"
            >
              {t('pwa.update')}
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="border-line hover:border-line-strong min-h-10 rounded-xl border px-4 py-1.5 font-semibold"
            >
              {t('pwa.later')}
            </button>
          </div>
        </>
      ) : (
        <p>{t('pwa.offlineReady')}</p>
      )}
    </div>
  )
}
