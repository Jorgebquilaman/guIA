import { NavLink } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

const mainLinks = [
  { to: '/app', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { to: '/app/search', label: 'Buscar', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { to: '/app/browse', label: 'Explorar Colecciones', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/app/upload', label: 'Subir', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
]

const adminLinks = [
  { to: '/app/admin', label: 'Panel', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/app/admin/documents', label: 'Documentos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/app/admin/collections', label: 'Colecciones', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/app/admin/users', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { to: '/app/admin/ai-settings', label: 'Configuración IA', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/app/admin/site-config', label: 'Configuración Sitio', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { to: '/app/admin/smtp-config', label: 'Configuración SMTP', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/app/admin/document-types', label: 'Tipos de documento', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { to: '/app/admin/departments', label: 'Departamentos', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z' },
]

function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={toggleSidebar} />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden text-iupa-green-light transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
        style={{ width: '260px' }}
      >
        <div className="absolute inset-0 bg-[url('/img/bg-sidebar.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-iupa-green/85" />
        <div className="relative z-10 flex h-full flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-iupa-green-secondary text-sm font-bold">
            G
          </div>
          <span className="text-lg font-semibold">GuIA</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {mainLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive ? 'bg-iupa-green-secondary text-white' : 'text-iupa-green-light hover:bg-iupa-green-secondary/50 hover:text-white'
                    }`
                  }
                >
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {user?.role === 'Admin' && (
            <>
              <div className="my-4 border-t border-iupa-green-secondary" />
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-iupa-green-light/60">
                Administración
              </p>
              <ul className="space-y-1">
                {adminLinks.map((link) => (
                  <li key={link.to}>
                    <NavLink
                      to={link.to}
                      end={link.to === '/admin'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive ? 'bg-iupa-green-secondary text-white' : 'text-iupa-green-light hover:bg-iupa-green-secondary/50 hover:text-white'
                        }`
                      }
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                      </svg>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {user && (
          <div className="border-t border-iupa-green-secondary px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-iupa-green-secondary text-sm font-medium">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.fullName}</p>
                <p className="truncate text-xs text-iupa-green-light/60">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-1.5 text-iupa-green-light/60 hover:bg-iupa-green-secondary/50 hover:text-white"
                title="Logout"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
        </div>{/* end z-10 wrapper */}
      </aside>
    </>
  )
}

export default Sidebar
