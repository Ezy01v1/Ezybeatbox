import { useTranslation } from 'react-i18next'
import { useTheme } from '@/app/useTheme'
import type { PackManifest } from '@/core/packs/schema'
import { useLocalizedText } from '@/i18n/useLocalizedText'
import { SoundIcon } from './SoundIcon'

/** Bottom tray with every sound, grouped by character. Scrolls horizontally on small screens. */
export function Palette({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const localize = useLocalizedText()
  const theme = useTheme()

  return (
    <nav
      aria-label={t('palette.label')}
      className="border-line bg-card border-t pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-6xl [scrollbar-width:thin] gap-2 overflow-x-auto px-3 py-2 sm:px-5">
        {manifest.characters.map((character) => (
          <div
            key={character.id}
            role="group"
            aria-label={localize(character.label)}
            className="border-line bg-paper flex shrink-0 flex-col gap-1 rounded-2xl border px-1 pt-1.5"
          >
            <span
              aria-hidden
              className="text-ink flex items-center gap-1.5 px-1.5 text-[11px] font-bold tracking-wider uppercase"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: theme.roles[character.role] }}
              />
              {localize(character.label)}
            </span>
            <div className="flex">
              {character.sounds.map((sound) => (
                <SoundIcon
                  key={sound.id}
                  character={character}
                  sound={sound}
                  color={theme.roles[character.role]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}
