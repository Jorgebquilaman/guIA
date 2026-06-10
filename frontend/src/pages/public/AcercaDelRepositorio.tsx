import { useState } from 'react'
import Navbar from '../../components/public/Navbar'
import Footer from '../../components/public/Footer'
import { ArrowLeft, BookOpen, Search, Globe, Shield, Lightbulb } from 'lucide-react'

export default function AcercaDelRepositorio() {
  const [menuOpen, setMenuOpen] = useState(false)

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
            Volver al inicio
          </a>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Acerca del Repositorio Digital
          </h1>
          <p className="mt-3 text-base text-white/80">
            ¿Qué es un repositorio digital y por qué es importante para la comunidad del IUPA?
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <BookOpen className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                ¿Qué es un Repositorio Digital?
              </h2>
            </div>
            <p className="leading-relaxed text-iupa-medium">
              Un repositorio digital es una plataforma en línea que permite almacenar, organizar, preservar y
              difundir la producción académica, científica y artística de una institución. En el caso del
              Instituto Universitario Patagónico de las Artes (IUPA), nuestro repositorio reúne trabajos
              finales, tesis, proyectos artísticos, artículos y demás producciones de nuestra comunidad
              educativa.
            </p>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Search className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Utilidad del Repositorio
              </h2>
            </div>
            <ul className="space-y-4 text-iupa-medium">
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">Acceso abierto al conocimiento:</strong>
                  <p className="mt-1">
                    Cualquier persona puede consultar y descargar los trabajos publicados, sin
                    restricciones ni barreras económicas, fomentando la democratización del saber.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">Visibilidad institucional:</strong>
                  <p className="mt-1">
                    La producción del IUPA trasciende las aulas y llega a la comunidad global,
                    posicionando a la institución como referente en la educación artística.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">Preservación a largo plazo:</strong>
                  <p className="mt-1">
                    Los documentos digitales se almacenan de forma segura, garantizando su
                    disponibilidad para futuras generaciones de estudiantes e investigadores.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-iupa-green" />
                <div>
                  <strong className="text-iupa-dark">Apoyo a la investigación:</strong>
                  <p className="mt-1">
                    Facilita la consulta de trabajos previos, evitando la duplicación de esfuerzos
                    y promoviendo nuevas líneas de investigación.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Shield className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Beneficios para la Comunidad del IUPA
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">Para estudiantes</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">
                  Acceso a trabajos de referencia, inspiración para proyectos propios y visibilidad
                  para sus producciones académicas.
                </p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">Para docentes</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">
                  Material didáctico disponible, seguimiento de la producción académica y
                  herramienta para la evaluación de trabajos finales.
                </p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">Para investigadores</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">
                  Fuente de consulta para estudios sobre educación artística y producción cultural
                  en la región patagónica.
                </p>
              </div>
              <div className="rounded-lg border border-iupa-light p-4">
                <h3 className="mb-2 text-sm font-bold text-iupa-dark">Para la sociedad</h3>
                <p className="text-xs leading-relaxed text-iupa-medium">
                  Acceso gratuito a la producción cultural y académica de una institución pública,
                  fomentando la transparencia y el intercambio cultural.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3 text-iupa-green">
              <Globe className="h-6 w-6" />
              <h2 className="text-xl font-bold text-iupa-dark" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Estándares y Buenas Prácticas
              </h2>
            </div>
            <p className="leading-relaxed text-iupa-medium">
              Nuestro repositorio sigue los lineamientos internacionales para repositorios
              institucionales, utilizando el estándar Dublin Core para la descripción de metadatos
              y promoviendo el uso de licencias Creative Commons para facilitar la reutilización
              responsable de los contenidos.
            </p>
          </div>

          <div className="rounded-xl bg-iupa-green p-8 text-center text-white shadow-sm">
            <Lightbulb className="mx-auto mb-4 h-8 w-8" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              ¿Querés aportar tu trabajo?
            </h2>
            <p className="mt-2 text-sm text-white/80">
              Si sos parte de la comunidad del IUPA, podés subir tus trabajos académicos y
              artísticos al repositorio. Ingresá con tu cuenta y seguí los pasos para publicar.
            </p>
            <a
              href="/login"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-iupa-green transition-colors hover:bg-iupa-light"
            >
              Iniciar sesión
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
