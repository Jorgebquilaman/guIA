import { NavLink, useLocation } from 'react-router-dom'
import { BookOpen, Network, Files, CloudUpload, LogIn, FolderOpen } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const TABS = [
  { to: '/tesauro', label: 'Tesauro', icon: BookOpen, match: (p: string) => p.startsWith('/tesauro') },
  { to: '/relaciones', label: 'Relaciones', icon: Network, match: (p: string) => p.startsWith('/relaciones') },
  { to: '/buscar', label: 'Documentos', icon: Files, match: (p: string) => p.startsWith('/buscar') || p.startsWith('/documentos') },
  { to: '/app/upload', label: 'Subir', icon: CloudUpload, match: (p: string) => p.startsWith('/app/upload') },
  { to: '/login', label: 'Ingresar', icon: LogIn, match: (p: string) => p.startsWith('/login') || p.startsWith('/app') },
]

/**
 * Barra inferior estilo aplicación iOS para el sitio público (solo mobile).
 * Reemplaza al menú hamburguesa: Tesauro, Relaciones, Documentos, Subir e Ingresar.
 */
export default function MobileTabBar() {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-gray-200 bg-white/90 backdrop-blur-lg lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const to = tab.label === 'Ingresar' && user ? '/app' : tab.to
          const active = tab.match(pathname) || (tab.label === 'Ingresar' && !!user && pathname.startsWith('/app'))
          const Icon = tab.label === 'Ingresar' && user ? FolderOpen : tab.icon
          return (
            <li key={tab.label} className="flex-1">
              <NavLink
                to={to}
                className={`flex flex-col items-center gap-0.5 px-1 pb-2 pt-2.5 transition-colors ${
                  active ? 'text-iupa-green' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${active ? 'bg-iupa-green' : 'bg-transparent'}`}
                />
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
