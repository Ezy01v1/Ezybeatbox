import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Notice } from '@/app/store/appStore'
import { useAppStore } from '@/app/store/AppStoreContext'

/** Info notices disappear on their own; errors stay until dismissed. */
const INFO_NOTICE_MS = 5000

function NoticeItem({ notice }: { notice: Notice }) {
  const { t } = useTranslation()
  const dismiss = useAppStore((s) => s.dismissNotice)

  useEffect(() => {
    if (notice.tone !== 'info') return
    const timer = setTimeout(() => dismiss(notice.id), INFO_NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice, dismiss])

  return (
    <li
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${
        notice.tone === 'error'
          ? 'border-rose-500/60 bg-rose-950/90 text-rose-100'
          : 'border-neutral-700 bg-neutral-900/95 text-neutral-100'
      }`}
    >
      <p className="flex-1">{t(`notices.${notice.key}`, notice.params ?? {})}</p>
      <button
        type="button"
        onClick={() => dismiss(notice.id)}
        aria-label={t('notices.dismiss')}
        className="-m-1 grid size-7 place-items-center rounded-full text-neutral-400 hover:bg-neutral-800"
      >
        ✕
      </button>
    </li>
  )
}

/** Live region for app notices (shared link results, saves, exports). */
export function Notices() {
  const notices = useAppStore((s) => s.notices)
  return (
    <ul
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-36 z-30 mx-auto flex w-full max-w-md flex-col justify-end gap-2 px-3"
    >
      {notices.map((notice) => (
        <NoticeItem key={notice.id} notice={notice} />
      ))}
    </ul>
  )
}
