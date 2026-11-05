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
      className="fixed inset-x-0 top-2 z-50 mx-auto flex w-[calc(100%-1.5rem)] max-w-md flex-col gap-2 rounded-xl border border-neutral-700 bg-neutral-900/95 p-3 text-sm shadow-xl"
    >
      {needRefresh ? (
        <>
          <p className="font-medium">{t('pwa.updateAvailable')}</p>
          <p className="text-xs text-neutral-400">{t('pwa.updateHint')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void updateServiceWorker(true)}
              className="rounded-full bg-amber-400 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-amber-300"
            >
              {t('pwa.update')}
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="rounded-full bg-neutral-800 px-4 py-1.5 hover:bg-neutral-700"
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
