import type { ReactNode } from 'react'
import { type AppContextValue, AppStoreContext } from './AppStoreContext'

export function AppStoreProvider({
  store,
  engine,
  children,
}: AppContextValue & { children: ReactNode }) {
  return <AppStoreContext.Provider value={{ store, engine }}>{children}</AppStoreContext.Provider>
}
