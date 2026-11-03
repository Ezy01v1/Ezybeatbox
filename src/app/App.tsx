import { useTranslation } from 'react-i18next'

export function App() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-2 p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight">{t('app.name')}</h1>
      <p className="text-neutral-400">{t('app.tagline')}</p>
    </main>
  )
}
