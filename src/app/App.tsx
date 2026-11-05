import { StageScreen } from '@/features/stage/StageScreen'
import { StartScreen } from '@/features/start/StartScreen'
import { useAppStore } from './store/AppStoreContext'

export function App() {
  const phase = useAppStore((s) => s.phase)
  const manifest = useAppStore((s) => s.manifest)

  if (phase === 'ready' && manifest) return <StageScreen manifest={manifest} />
  return <StartScreen />
}
