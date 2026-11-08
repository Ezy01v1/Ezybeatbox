import enCommon from './locales/en/common.json'
import esCommon from './locales/es/common.json'

export const defaultNS = 'common'

export const resources = {
  es: { common: esCommon },
  en: { common: enCommon satisfies typeof esCommon },
} as const

export type SupportedLanguage = keyof typeof resources

export const fallbackLanguage: SupportedLanguage = 'es'

export function isSupportedLanguage(language: string | null): language is SupportedLanguage {
  return language !== null && Object.hasOwn(resources, language)
}
