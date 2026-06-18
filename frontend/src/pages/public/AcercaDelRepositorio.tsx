import { useState } from 'react'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'
import { ArrowLeft, BookOpen, Search, Globe, Shield, Lightbulb } from 'lucide-react'
import { useI18n } from '../../i18n/context'

export default function AcercaDelRepositorio() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t } = useI18n()

  return (
    <div className="min-h-screen bg-iupa-light" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />

      <section className="bg-iupa-green py-12 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('acerca.volver')}
          </a>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            {t('acerca.titulo')}
          </h1>
          <p className="mt-3 text-base text-white/80">
            {t('acerca.subtitulo')}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <BookOpen className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('acerca.queEs')}
              </h2>
            </div>
            <p className="leading-relaxed text-iupa-medium">
              {t('acerca.queEsTexto')}
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Search className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('acerca.utilidad')}
              </h2>
            </div>
            <ul className="space-y-4 text-iupa-medium">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">{t('acerca.accesoAbierto')}</strong>
                  <p className="mt-1">{t('acerca.accesoAbiertoTexto')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">{t('acerca.visibilidad')}</strong>
                  <p className="mt-1">{t('acerca.visibilidadTexto')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">{t('acerca.preservacion')}</strong>
                  <p className="mt-1">{t('acerca.preservacionTexto')}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">{t('acerca.apoyoInvestigacion')}</strong>
                  <p className="mt-1">{t('acerca.apoyoInvestigacionTexto')}</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Shield className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('acerca.beneficios')}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">{t('acerca.paraEstudiantes')}</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">{t('acerca.paraEstudiantesTexto')}</p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">{t('acerca.paraDocentes')}</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">{t('acerca.paraDocentesTexto')}</p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">{t('acerca.paraInvestigadores')}</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">{t('acerca.paraInvestigadoresTexto')}</p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">{t('acerca.paraSociedad')}</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">{t('acerca.paraSociedadTexto')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Globe className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t('acerca.estandares')}
              </h2>
            </div>
            <p className="leading-relaxed text-iupa-medium">
              {t('acerca.estandaresTexto')}
            </p>
          </div>

          <div className="rounded-xl bg-iupa-green p-8 text-center text-white shadow-sm">
            <Lightbulb className="mx-auto mb-4 h-8 w-8" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t('acerca.cta')}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              {t('acerca.ctaTexto')}
            </p>
            <a
              href="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-iupa-green transition-colors hover:bg-iupa-light"
            >
              {t('acerca.iniciarSesion')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
