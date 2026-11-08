import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  defaultNS,
  fallbackLanguage,
  isSupportedLanguage,
  resources,
  type SupportedLanguage,
} from './resources'

const languageKey = 'ezybeatbox:language'

function preferredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(languageKey)
    if (isSupportedLanguage(stored)) return stored
  } catch {
    // The app also runs when browser storage is unavailable.
  }
  return fallbackLanguage
}

export async function setLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language)
  try {
    localStorage.setItem(languageKey, language)
  } catch {
    // The new language still applies for this visit.
  }
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n.use(initReactI18next).init({
  resources,
  lng: preferredLanguage(),
  supportedLngs: Object.keys(resources),
  fallbackLng: fallbackLanguage,
  defaultNS,
  ns: [defaultNS],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
