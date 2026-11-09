import { type ReactNode, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const FOCUSABLE =
  ':is(button, [href], input, select, textarea, [tabindex]):not(:disabled):not([tabindex="-1"])'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Accessible modal dialog: labelled, focus moves in on open and back on close, Tab stays
 * inside, Escape and the backdrop close it.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)

  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    return () => previous?.focus()
  }, [])

  useLayoutEffect(() => {
    onCloseRef.current = onClose
    const panel = panelRef.current
    if (!panel || panel.contains(document.activeElement)) return
    // Focus the content on open and recover when the focused control is removed.
    const target =
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      const panel = panelRef.current
      if (event.key !== 'Tab' || !panel) return
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)]
      const first = items[0]
      const last = items.at(-1)
      const active = document.activeElement
      if (!panel.contains(active) || active === (event.shiftKey ? first : last)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      className="bg-ink/40 fixed inset-0 z-40 grid place-items-end p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-line bg-card text-ink flex max-h-[85dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl border p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="text-ink-muted hover:bg-paper hover:text-ink grid size-10 place-items-center rounded-full"
          >
            ✕
          </button>
        </div>
        <div ref={contentRef} className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  )
}
