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

/** Ready-made beats for the pack plus "start from scratch". Changes land on the next bar. */
export function BasePicker({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  if (!manifest.bases?.length) return null

  return (
    <div
      role="group"
      aria-label={t('bases.label')}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <span className="text-xs font-bold tracking-wider uppercase">{t('bases.label')}</span>
      {manifest.bases.map((base) => (
        <BaseButton key={base.id} manifest={manifest} base={base} />
      ))}
      <BaseButton manifest={manifest} base={null} />
    </div>
  )
}
