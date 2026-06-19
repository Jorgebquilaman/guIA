import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const devs = [
  { name: 'Jorge B. Quilamán', role: 'Desarrollador Principal', github: 'https://github.com/Jorgebquilaman' },
  { name: 'Carolina Zimmermann', role: 'Product Owner', email: 'czimmermann@iupa.edu.ar' },
]

const stack = [
  { name: '.NET 8', type: 'Backend — C# API REST' },
  { name: 'React + Vite', type: 'Frontend SPA' },
  { name: 'PostgreSQL', type: 'Base de datos relacional' },
  { name: 'Entity Framework Core', type: 'ORM' },
  { name: 'Tailwind CSS v4', type: 'Estilos utilitarios' },
  { name: 'Claude API / DeepSeek', type: 'Procesamiento de IA para metadatos' },
  { name: 'jsPDF', type: 'Exportación a PDF' },
  { name: 'D3.js', type: 'Visualización de grafos' },
  { name: 'Docker', type: 'Contenedor de base de datos' },
  { name: 'Nginx', type: 'Proxy inverso en producción' },
]

const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF<>/{}[]|&^%$#@!'

export default function DevInfo() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let drops: number[] = []
    let columns = 0

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      columns = Math.floor(canvas!.width / 14)
      drops = Array.from({ length: columns }, () => Math.random() * -100)
    }

    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx!.fillStyle = 'rgba(5, 5, 5, 0.06)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)

      ctx!.font = '13px monospace'

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * 14
        const y = drops[i] * 14

        ctx!.fillStyle = '#00ff41'
        ctx!.fillText(char, x, y)

        if (Math.random() > 0.98) {
          ctx!.fillStyle = '#ffffff'
          ctx!.fillText(char, x, y)
        }

        if (y > canvas!.height && Math.random() > 0.98) {
          drops[i] = 0
        }
        drops[i]++
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-neutral-950 text-neutral-100" style={{ fontFamily: 'Inter, sans-serif' }}>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 opacity-40" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 flex items-center gap-6">
          <img src="/img/logo.png" alt="GuIA Logo" className="h-20 w-20 animate-pulse rounded-2xl object-cover shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/30" />
          <div>
            <h1 className="glitch text-3xl font-bold tracking-tight" data-text="GuIA">GuIA</h1>
            <p className="mt-1 text-sm text-neutral-400">Repositorio Institucional IUPA — v1.0.0</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">Equipo de Desarrollo</h2>
          <div className="space-y-3">
            {devs.map((d) => (
              <div key={d.name} className="group rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all duration-500 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:backdrop-blur-sm">
                <p className="font-medium">{d.name}</p>
                <p className="mt-0.5 text-sm text-neutral-400">{d.role}</p>
                {'email' in d ? (
                  <p className="mt-1 text-xs text-neutral-500">{d.email}</p>
                ) : (
                  <a
                    href={d.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-neutral-500 underline underline-offset-2 hover:text-emerald-400"
                  >
                    {d.github}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-400">Stack Tecnológico</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stack.map((s, i) => (
              <div
                key={s.name}
                className="animate-in rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 transition-all duration-500 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-sm font-medium">{s.name}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{s.type}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="text-xs text-neutral-600">Presioná ESC para volver al inicio.</p>
      </div>

      <style>{`
        @keyframes glitch {
          0% { text-shadow: 0 0 #00ff41, 0 0 #ff00ff; }
          20% { text-shadow: -2px 0 #00ff41, 2px 0 #ff00ff; }
          40% { text-shadow: 2px 0 #00ff41, -2px 0 #ff00ff; }
          60% { text-shadow: -1px 0 #00ff41, 1px 0 #ff00ff; }
          80% { text-shadow: 1px 0 #00ff41, -1px 0 #ff00ff; }
          100% { text-shadow: 0 0 #00ff41, 0 0 #ff00ff; }
        }
        .glitch {
          animation: glitch 3s infinite;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-in {
          animation: fadeSlideUp 0.5s ease-out both;
        }
      `}</style>
    </div>
  )
}
