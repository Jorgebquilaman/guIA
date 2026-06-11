import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Navbar from '../../components/public/Navbar'
import HeroSection from '../../components/public/HeroSection'
import DepartmentSection from '../../components/public/DepartmentSection'
import RecentWorks from '../../components/public/RecentWorks'
import SidebarSection from '../../components/public/SidebarSection'
import Footer from '../../components/public/Footer'

export default function PublicHome() {
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
      <HeroSection />
      <DepartmentSection />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <SidebarSection />
          </div>
          <div className="lg:col-span-2">
            <RecentWorks />
          </div>
        </div>
      </section>
      <Footer />
    </div>
  )
}
