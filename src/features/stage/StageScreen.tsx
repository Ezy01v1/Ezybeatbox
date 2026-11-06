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
        {/* The only themed area: background, decorations, floor and characters come from the pack. */}
        <div className="relative isolate mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-2 overflow-hidden rounded-3xl bg-(--stage-bg) p-2 text-(--stage-ink) sm:p-4">
          <StagePattern theme={theme} />
          <StageBackdrop color={theme.stage.glow} />
          {/*
           * Characters stand side by side, cut at the waist by the stage floor: a strip of
           * height --floor at the bottom of every row (one row on wide screens, two on phones),
           * drawn as the grid's background so it runs continuously behind names and controls.
           * Rows have no gap so each background tile matches its row exactly.
           */}
          <div
            className="grid min-h-0 w-full flex-1 grid-cols-3 grid-rows-2 gap-x-1 gap-y-0 bg-size-[100%_50%] [--floor:5.75rem] sm:grid-cols-6 sm:grid-rows-1 sm:gap-x-2 sm:bg-size-[100%_100%] lg:[--floor:6.75rem]"
            style={{
              backgroundImage: [
                'linear-gradient(to bottom, transparent calc(100% - var(--floor)), var(--stage-outline) calc(100% - var(--floor)), var(--stage-outline) calc(100% - var(--floor) + 3px), transparent calc(100% - var(--floor) + 3px))',
                'linear-gradient(to bottom, transparent calc(100% - var(--floor)), var(--stage-panel) calc(100% - var(--floor)))',
              ].join(', '),
            }}
          >
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
