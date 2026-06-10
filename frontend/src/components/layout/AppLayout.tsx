import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Toast from '../ui/Toast'
import Spinner from '../ui/Spinner'
import { useAuthStore } from '../../store/authStore'

function AppLayout() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const isLoading = useAuthStore((s) => s.isLoading)

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
    <div className="flex h-screen overflow-hidden bg-iupa-light">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-[260px]">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  )
}

export default AppLayout
