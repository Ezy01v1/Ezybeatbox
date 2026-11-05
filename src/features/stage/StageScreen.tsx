import { useTranslation } from 'react-i18next'
import type { PackManifest } from '@/core/packs/schema'
import { DragLayer } from '@/features/palette/DragLayer'
import { Palette } from '@/features/palette/Palette'
import { TransportBar } from '@/features/transport/TransportBar'
import { CharacterSlot } from './CharacterSlot'
import { ResumeOverlay } from './ResumeOverlay'
import { StageBackdrop } from './StageBackdrop'

export function StageScreen({ manifest }: { manifest: PackManifest }) {
  const { t } = useTranslation()

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <TransportBar beatsPerBar={manifest.timeSignature[0]} />

      <main
        aria-label={t('stage.label')}
        className="relative isolate flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-3"
      >
        <StageBackdrop />
        <div className="grid min-h-0 w-full max-w-5xl flex-1 grid-cols-3 grid-rows-2 gap-x-2 gap-y-3 sm:grid-cols-6 sm:grid-rows-1 sm:items-end">
          {manifest.characters.map((character) => (
            <CharacterSlot key={character.id} character={character} />
          ))}
        </div>
        <p className="text-center text-xs text-neutral-500">{t('stage.hint')}</p>
      </main>

      <Palette manifest={manifest} />
      <DragLayer manifest={manifest} />
      <ResumeOverlay />
    </div>
  )
}
