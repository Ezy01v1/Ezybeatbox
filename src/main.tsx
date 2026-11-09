import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
// Bundled (not from a CDN) so the PWA keeps its typography offline.
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import { App } from '@/app/App'
import { AppStoreProvider } from '@/app/store/AppStoreProvider'
import { createAppStore } from '@/app/store/appStore'
import { AudioEngine } from '@/core/audio/AudioEngine'
import { LocalStorageMixRepository } from '@/core/mix/localStorageRepository'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element #root not found')
}

const engine = new AudioEngine()
let receivedHash = window.location.hash
const store = createAppStore({
  engine,
  packsBaseUrl: `${import.meta.env.BASE_URL}packs/`,
  defaultPackId: 'boom-bap-01',
  repository: new LocalStorageMixRepository(),
  shareBaseUrl: `${window.location.origin}${window.location.pathname}`,
  initialHash: receivedHash,
  onLinkConsumed: () => {
    // A newer hash may already be in the address bar before its hashchange event is delivered.
    if (window.location.hash === receivedHash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
  },
})

// Pasting a share link into a tab that already shows the app only changes the hash.
window.addEventListener('hashchange', ({ newURL }) => {
  const hash = new URL(newURL).hash
  if (hash !== window.location.hash) return
  receivedHash = hash
  store.getState().openLink(hash)
})

createRoot(rootElement).render(
  <StrictMode>
    <AppStoreProvider store={store} engine={engine}>
      <App />
    </AppStoreProvider>
  </StrictMode>,
)
