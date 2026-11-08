import { UpdatePrompt } from '@/features/pwa/UpdatePrompt'
import { Notices } from '@/features/sharing/Notices'
import { StageScreen } from '@/features/stage/StageScreen'
import { StartScreen } from '@/features/start/StartScreen'
import { useAppStore } from './store/AppStoreContext'

export function App() {
  const phase = useAppStore((s) => s.phase)
  const manifest = useAppStore((s) => s.manifest)

  return (
    <>
      {phase === 'ready' && manifest ? <StageScreen manifest={manifest} /> : <StartScreen />}
      <Notices />
      <UpdatePrompt />
    </>
  )
}
