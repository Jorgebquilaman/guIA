import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Toast from '../ui/Toast'
import Spinner from '../ui/Spinner'
import SessionExpiredModal from '../auth/SessionExpiredModal'
import { useAuthStore } from '../../store/authStore'
import { useUiStore } from '../../store/uiStore'
import { useThemeStore } from '../../store/themeStore'

function AppLayout() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const isLoading = useAuthStore((s) => s.isLoading)
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed)
  const dark = useThemeStore((s) => s.dark)

  useEffect(() => {
    fetchUser()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden bg-iupa-light ${dark ? 'app-dark' : ''}`}>
      <Sidebar />
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-[260px]'
        }`}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toast />
      <SessionExpiredModal />
    </div>
  )
}

export default AppLayout
