import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUiStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

const breadcrumbLabels: Record<string, string> = {
  '': 'Home',
  search: 'Search',
  collections: 'Collections',
  upload: 'Upload',
  admin: 'Admin',
  documents: 'Documents',
  users: 'Users',
}

function Header() {
  const { toggleSidebar } = useUiStore()
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, i) => ({
    label: breadcrumbLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    path: '/' + pathSegments.slice(0, i + 1).join('/'),
  }))

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-iupa-dark bg-iupa-dark px-4 lg:px-6">
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <nav className="flex items-center gap-1 text-sm text-white/70">
        {breadcrumbs.length === 0 ? (
          <span className="text-white">Home</span>
        ) : (
          breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="flex items-center gap-1">
              {i > 0 && <span className="text-white/50">/</span>}
              <button onClick={() => navigate(crumb.path)} className="hover:text-white">
                {crumb.label}
              </button>
            </span>
          ))
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <a
          href="/"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          title="Ver sitio público"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.25a1.5 1.5 0 01-1.042-1.956l.317-.831a1.5 1.5 0 011.43-.978L3 8.5h6l.99 1.233a1.5 1.5 0 001.43.978l1.08-.027a1.5 1.5 0 011.43.978l.317.831a1.5 1.5 0 01-1.042 1.956l-.93.186a1.5 1.5 0 01-1.247-.478L12 14.5H8l-.996-1.242a1.5 1.5 0 00-1.247-.478l-.93.186z" />
          </svg>
          Vista pública
        </a>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-sm text-white hover:bg-white/10"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-iupa-green-light text-sm font-medium text-iupa-green">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline text-white">{user?.fullName}</span>
            <svg className="h-4 w-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-white/10 bg-iupa-dark py-1 shadow-lg">
              <div className="border-b border-white/10 px-4 py-2">
                <p className="text-sm font-medium text-white">{user?.fullName}</p>
                <p className="text-xs text-white/50">{user?.email}</p>
              </div>
              <button
                onClick={() => { logout(); setDropdownOpen(false) }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
