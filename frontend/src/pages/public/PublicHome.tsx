import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import Navbar from '../../components/public/Navbar'
import HeroSection from '../../components/public/HeroSection'
import DepartmentSection from '../../components/public/DepartmentSection'
import RecentWorks from '../../components/public/RecentWorks'
import SidebarSection from '../../components/public/SidebarSection'
import Footer from '../../components/public/Footer'

export default function PublicHome() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const visitTracked = useRef(false)
  const keyBuffer = useRef('')

  useEffect(() => {
    if (visitTracked.current) return
    visitTracked.current = true
    fetch('/api/stats/visit', { method: 'POST' }).catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        navigate('/dev')
        return
      }
      keyBuffer.current = (keyBuffer.current + e.key.toLowerCase()).slice(-4)
      if (keyBuffer.current === 'guia') {
        keyBuffer.current = ''
        navigate('/dev')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

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
