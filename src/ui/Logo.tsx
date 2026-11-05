import { useTranslation } from 'react-i18next'

/** Voice-wave mark + wordmark with the cobalt dot. Same on every screen and every pack. */
export function Logo({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const { t } = useTranslation()
  const large = size === 'lg'

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden
        className={`bg-ink text-paper grid shrink-0 place-items-center rounded-lg ${
          large ? 'size-12 rounded-xl p-2.5' : 'size-8 p-1.5'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="size-full"
        >
          <path d="M4 12h2M8 8v8M12 4v16M16 7v10M20 11v2" />
        </svg>
      </span>
      <span className="inline-flex items-baseline gap-1">
        <span
          className={`text-ink font-extrabold tracking-tight ${large ? 'text-4xl sm:text-5xl' : 'text-xl'}`}
        >
          {t('app.name')}
        </span>
        <span aria-hidden className={`bg-accent rounded-full ${large ? 'size-2.5' : 'size-1.5'}`} />
      </span>
    </span>
  )
}
