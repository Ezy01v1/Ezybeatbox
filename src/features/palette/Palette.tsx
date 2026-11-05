import { useTranslation } from 'react-i18next'
import type { PackManifest } from '@/core/packs/schema'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { ROLE_COLORS } from '@/visuals'
import { SoundIcon } from './SoundIcon'

/** Bottom bar with every sound, grouped by character. Scrolls horizontally on small screens. */
export function Palette({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()

  return (
    <nav
      aria-label={t('palette.label')}
      className="border-t border-neutral-800 bg-neutral-900/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="flex [scrollbar-width:thin] gap-3 overflow-x-auto px-3 py-2">
        {manifest.characters.map((character) => (
          <div
            key={character.id}
            role="group"
            aria-label={localize(character.label)}
            className="flex shrink-0 flex-col gap-1 rounded-2xl bg-neutral-950/60 px-1 pt-1"
          >
            <span
              aria-hidden
              className="px-1 text-[11px] font-semibold tracking-wide uppercase"
              style={{ color: ROLE_COLORS[character.role] }}
            >
              {localize(character.label)}
            </span>
            <div className="flex">
              {character.sounds.map((sound) => (
                <SoundIcon key={sound.id} character={character} sound={sound} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
