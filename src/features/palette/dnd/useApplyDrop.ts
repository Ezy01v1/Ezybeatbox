import { useAppStore } from '@/app/store/AppStoreContext'
import type { DropAction } from './resolveDrop'

export function useApplyDrop(): (action: DropAction) => void {
  const setSound = useAppStore((s) => s.setSound)
  const clearSound = useAppStore((s) => s.clearSound)
  return (action) => {
    if (action.type === 'set') setSound(action.characterId, action.soundId)
    else clearSound(action.characterId)
  }
}
