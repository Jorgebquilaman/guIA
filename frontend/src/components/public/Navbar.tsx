import { Upload, ChevronDown } from 'lucide-react'
import { menuItems } from '../../data/mockData'
import CollectionNavDropdown from './CollectionNavDropdown'
import MobileTabBar from './MobileTabBar'
import { useI18n } from '../../i18n/context'
import type { Lang } from '../../i18n/context'

interface NavbarProps {
  /** Sin uso: el menú hamburguesa fue reemplazado por MobileTabBar (barra inferior). */
  onMenuToggle?: () => void
  menuOpen?: boolean
}

export default function Navbar(_props: NavbarProps) {
  const { t, lang, setLang } = useI18n()

  function toggleLang() {
    setLang(lang === 'es' ? 'en' : 'es' as Lang)
  }

  return (
    <>
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/img/logo-iupa.svg" alt="IUPA" className="h-9 w-auto" />
            <div className="hidden md:block">
              <p className="text-xs font-semibold leading-tight text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('nav.repositorio')}
              </p>
              <p className="text-[11px] text-iupa-medium">
                {t('nav.accesoAbierto')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CollectionNavDropdown />
            <button
              onClick={toggleLang}
              className="hidden text-xs text-iupa-medium hover:text-iupa-dark md:block"
            >
              <span className="flex items-center gap-1">
                {t('nav.idioma')} <ChevronDown className="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <nav className="hidden bg-iupa-public-green lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </div>
          <a
            href="/login"
            className="flex items-center gap-2 rounded-b-lg bg-iupa-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            <Upload className="h-4 w-4" />
            {t('nav.subirTrabajo')}
          </a>
        </div>
      </nav>
    </header>

    {/* Navegación inferior estilo app (mobile) — el body reserva espacio con padding-bottom en index.css */}
    <MobileTabBar />
    </>
  )
}
