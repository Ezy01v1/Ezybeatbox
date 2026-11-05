import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'

/**
 * Shown when the browser suspends the AudioContext (iOS interruption, OS audio focus...).
 * Resuming needs a user gesture, hence the full-screen button.
 */
export function ResumeOverlay() {
  const { t } = useTranslation()
  const contextState = useAppStore((s) => s.contextState)
  const resumeAudio = useAppStore((s) => s.resumeAudio)

  if (contextState === 'running') return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-neutral-950/80 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-labelledby="resume-title"
        className="flex flex-col items-center gap-4"
      >
        <p id="resume-title" className="text-lg font-semibold">
          {t('resume.title')}
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => void resumeAudio()}
          className="rounded-full bg-amber-400 px-8 py-4 text-lg font-semibold text-neutral-950"
        >
          {t('resume.action')}
        </button>
      </div>
    </div>
  )
}
