import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { defaultNS, fallbackLanguage, resources } from './resources'

void i18n.use(initReactI18next).init({
  resources,
  lng: fallbackLanguage,
  fallbackLng: fallbackLanguage,
  defaultNS,
  ns: [defaultNS],
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
