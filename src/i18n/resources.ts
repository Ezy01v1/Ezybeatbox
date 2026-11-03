import esCommon from './locales/es/common.json'

export const defaultNS = 'common'

export const resources = {
  es: { common: esCommon },
} as const

export type SupportedLanguage = keyof typeof resources

export const fallbackLanguage: SupportedLanguage = 'es'
