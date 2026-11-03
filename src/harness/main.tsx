/**
 * Dev-only engine harness (Phase 1). Served by `npm run dev` at /harness.html and not part of
 * the production build. Texts are intentionally not translated: this is a developer tool,
 * replaced by the real stage in Phase 2.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { EngineHarness } from './EngineHarness'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

createRoot(rootElement).render(
  <StrictMode>
    <EngineHarness />
  </StrictMode>,
)
