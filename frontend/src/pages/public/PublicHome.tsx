import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
  const visitTracked = useRef(false)

  useEffect(() => {
    if (visitTracked.current) return
    visitTracked.current = true
    fetch('/api/stats/visit', { method: 'POST' }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      {isAuthenticated && (
        <div className="bg-iupa-green px-4 py-2 text-center text-sm text-white">
          Estás logueado —{' '}
          <Link to="/app" className="font-semibold underline hover:no-underline">Ir al panel de administración</Link>
          {' · '}
          <Link to="/app/documents" className="font-semibold underline hover:no-underline">Mis documentos</Link>
        </div>
      )}
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
