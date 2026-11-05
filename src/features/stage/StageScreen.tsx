import { useTranslation } from 'react-i18next'
import { stageCssVars, useTheme } from '@/app/useTheme'
import type { PackManifest } from '@/core/packs/schema'
import { DragLayer } from '@/features/palette/DragLayer'
import { Palette } from '@/features/palette/Palette'
import { Notices } from '@/features/sharing/Notices'
import { TransportBar } from '@/features/transport/TransportBar'
import { StagePattern } from '@/visuals'
import { CharacterSlot } from './CharacterSlot'
import { ResumeOverlay } from './ResumeOverlay'
import { StageBackdrop } from './StageBackdrop'

export function StageScreen({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()
  const theme = useTheme()

  return (
    <div className="flex h-dvh flex-col overflow-hidden" style={stageCssVars(theme)}>
      <TransportBar manifest={manifest} />

      <main aria-label={t('stage.label')} className="flex min-h-0 flex-1 flex-col p-2 sm:p-4">
        {/* The only themed area: background, decorations and character cards come from the pack. */}
        <div className="relative isolate mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden rounded-3xl bg-(--stage-bg) p-2 text-(--stage-ink) sm:p-4">
          <StagePattern theme={theme} />
          <StageBackdrop color={theme.stage.glow} />
          <div className="grid min-h-0 w-full flex-1 grid-cols-3 content-center items-center gap-2 sm:grid-cols-6 sm:gap-3">
            {manifest.characters.map((character) => (
              <CharacterSlot
                key={character.id}
                character={character}
                color={theme.roles[character.role]}
              />
            ))}
          </div>
          <p className="text-center text-xs font-medium">{t('stage.hint')}</p>
        </div>
      </main>

      <Palette manifest={manifest} />
      <DragLayer manifest={manifest} />
      <Notices />
      <ResumeOverlay />
    </div>
  )
}
