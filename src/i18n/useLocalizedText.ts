import { useTranslation } from 'react-i18next'
import { resolveText } from '@/core/packs/loader'
import type { LocalizedText } from '@/core/packs/schema'
import { fallbackLanguage } from './resources'

/** Resolves pack texts (`"Seco"` or `{ es, en }`) for the current UI language. */
export function useLocalizedText(): (text: LocalizedText) => string {
  const { i18n } = useTranslation()
  return (text) => resolveText(text, i18n.language, fallbackLanguage)
}
