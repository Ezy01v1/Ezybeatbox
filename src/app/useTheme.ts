import { useMemo } from 'react'
import type { PackTheme } from '@/core/packs/schema'
import { resolveTheme } from '@/visuals'
import { useAppStore } from './store/AppStoreContext'

/** Theme of the loaded pack (or the neutral default before a pack is loaded). */
export function useTheme(): PackTheme {
  const manifest = useAppStore((s) => s.manifest)
  return useMemo(() => resolveTheme(manifest), [manifest])
}

/** CSS custom properties for the stage, so Tailwind classes can use `bg-(--stage-panel)` etc. */
export function stageCssVars(theme: PackTheme): React.CSSProperties {
  const { stage } = theme
  return {
    ['--stage-bg' as string]: stage.background,
    ['--stage-panel' as string]: stage.panel,
    ['--stage-outline' as string]: stage.outline,
    ['--stage-ink' as string]: stage.ink,
  }
}
