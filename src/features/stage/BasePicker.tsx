import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/app/store/AppStoreContext'
import type { PackBase, PackManifest } from '@/core/packs/schema'
import { useLocalizedText } from '@/i18n/useLocalizedText'

/** True when every character is set (or heading) to exactly what the base asks for. */
function useIsCurrent(manifest: PackManifest, base: PackBase | null): boolean {
  return useAppStore((s) =>
    manifest.characters.every(
      ({ id }) => (s.slots[id]?.target ?? null) === (base?.sounds[id] ?? null),
    ),
  )
}

function BaseButton({ manifest, base }: { manifest: PackManifest; base: PackBase | null }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const applyBase = useAppStore((s) => s.applyBase)
  const current = useIsCurrent(manifest, base)

  return (
    <button
      type="button"
      aria-pressed={current}
      onClick={() => applyBase(base?.id ?? null)}
      className="focus-visible:outline-accent min-h-9 rounded-full border border-(--stage-outline) bg-(--stage-panel)/80 px-3.5 text-xs font-semibold transition-colors hover:bg-(--stage-panel) focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-(--stage-ink) aria-pressed:text-(--stage-bg) motion-reduce:transition-none"
    >
      {base ? localize(base.name) : t('bases.scratch')}
    </button>
  )
}

/** "Sorpréndeme": a random beat that sounds good, different from the current one. */
function SurpriseButton() {
  const { t } = useTranslation()
  const surprise = useAppStore((s) => s.surprise)

  return (
    <button
      type="button"
      onClick={surprise}
      title={t('bases.surpriseHint')}
      className="focus-visible:outline-accent inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-dashed border-(--stage-ink) bg-(--stage-panel) px-3.5 text-xs font-bold transition-transform hover:-rotate-2 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95 motion-reduce:transition-none motion-reduce:hover:rotate-0"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
        <circle cx="8.5" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="15.5" cy="15.5" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      {t('bases.surprise')}
    </button>
  )
}

/**
 * Ready-made beats for the pack, "start from scratch" and "Sorpréndeme". Changes land on the
 * next bar.
 */
export function BasePicker({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const bases = manifest.bases ?? []

  return (
    <div
      role="group"
      aria-label={t('bases.label')}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <span className="text-xs font-bold tracking-wider uppercase">{t('bases.label')}</span>
      {bases.map((base) => (
        <BaseButton key={base.id} manifest={manifest} base={base} />
      ))}
      <BaseButton manifest={manifest} base={null} />
      <SurpriseButton />
    </div>
  )
}
