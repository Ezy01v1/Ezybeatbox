import { useTranslation } from 'react-i18next'
import { setLanguage } from '@/i18n'
import { fallbackLanguage, isSupportedLanguage } from '@/i18n/resources'

export function LanguagePicker() {
  const { t, i18n } = useTranslation()

  return (
    <select
      aria-label={t('language.label')}
      value={i18n.resolvedLanguage ?? fallbackLanguage}
      onChange={({ currentTarget: { value } }) => {
        if (isSupportedLanguage(value)) void setLanguage(value)
      }}
      className="border-line bg-card text-ink min-h-11 rounded-xl border px-3 text-sm font-semibold"
    >
      <option value="es" lang="es">
        {t('language.es')}
      </option>
      <option value="en" lang="en">
        {t('language.en')}
      </option>
    </select>
  )
}
