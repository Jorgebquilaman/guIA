import { useI18n } from '../../i18n/context'

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="bg-iupa-public-green text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-xs text-white/50">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </div>
      </div>
    </footer>
  )
}