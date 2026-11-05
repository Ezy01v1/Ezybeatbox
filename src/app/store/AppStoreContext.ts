import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { AppActions, AppState, AppStore, EngineLike } from './appStore'

export interface AppContextValue {
  store: AppStore
  engine: EngineLike
}

export const AppStoreContext = createContext<AppContextValue | null>(null)

function useAppContext(): AppContextValue {
  const value = useContext(AppStoreContext)
  if (!value) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return value
}

/** Select a slice of app state. Keep selectors narrow to avoid needless re-renders. */
export function useAppStore<T>(selector: (state: AppState & AppActions) => T): T {
  return useStore(useAppContext().store, selector)
}

/** Direct engine access, for live level readers only (read them in rAF, never in render state). */
export function useEngine(): EngineLike {
  return useAppContext().engine
}
