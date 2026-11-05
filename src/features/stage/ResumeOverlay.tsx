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
    <div className="bg-ink/40 fixed inset-0 z-40 grid place-items-center p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-labelledby="resume-title"
        className="border-line bg-card text-ink flex flex-col items-center gap-4 rounded-2xl border p-6 shadow-2xl"
      >
        <p id="resume-title" className="text-xl font-extrabold tracking-tight">
          {t('resume.title')}
        </p>
        <button
          type="button"
          autoFocus
          onClick={() => void resumeAudio()}
          className="bg-accent hover:bg-accent-hover rounded-xl px-8 py-4 text-lg font-semibold text-white"
        >
          {t('resume.action')}
        </button>
      </div>
    </div>
  )
}
