import { type ReactNode, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

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

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    // Focus the first control of the content (not the header's close button).
    const target =
      contentRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
    target?.focus()
    return () => previous?.focus()
  }, [])

  // Escape is handled on the document: focus can leave the panel (e.g. a removed list item).
  const onCloseRef = useRef(onClose)
  useLayoutEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [])

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || !panelRef.current) return
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-end bg-neutral-950/70 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        className="flex max-h-[85dvh] w-full flex-col gap-4 overflow-y-auto rounded-t-2xl border border-neutral-800 bg-neutral-900 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-9 place-items-center rounded-full text-neutral-400 hover:bg-neutral-800"
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
