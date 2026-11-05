import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import './index.css'
import { App } from '@/app/App'
import { AppStoreProvider } from '@/app/store/AppStoreProvider'
import { createAppStore } from '@/app/store/appStore'
import { AudioEngine } from '@/core/audio/AudioEngine'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

const PACK_URL = `${import.meta.env.BASE_URL}packs/boom-bap-01/`
const engine = new AudioEngine()
const store = createAppStore({ engine, packUrl: PACK_URL })

createRoot(rootElement).render(
  <StrictMode>
    <AppStoreProvider store={store} engine={engine}>
      <App />
    </AppStoreProvider>
  </StrictMode>,
)
