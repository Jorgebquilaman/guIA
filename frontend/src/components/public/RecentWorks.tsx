import { useEffect, useState } from 'react'
import { FileText, Eye, ArrowRight, Download, FileVideo, Link as LinkIcon } from 'lucide-react'

interface Work {
  id: string
  title: string
  type: string
  authors: { name: string }[]
  degreeProgram: string | null
  publishedAt: string | null
  files: { mimeType: string }[]
  sourceUrl: string | null
  department: string | null
}

const MIME_ICON: Record<string, string> = {
  'application/pdf': 'PDF',
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'audio/mpeg': 'MP3',
}

function getTypeLabel(files: { mimeType: string }[], sourceUrl: string | null): string {
  if (sourceUrl) return 'LINK'
  for (const f of files) {
    const label = MIME_ICON[f.mimeType]
    if (label) return label
  }
  return 'PDF'
}

function getTypeIcon(type: string) {
  if (type === 'LINK') return LinkIcon
  return type === 'PDF' ? FileText : FileVideo
}

export default function RecentWorks() {
  const [works, setWorks] = useState<Work[]>([])

  useEffect(() => {
    fetch('/api/search?pageSize=4&publicOnly=true')
      .then((res) => res.json())
      .then((data) => {
        const d = data.data ?? data
        setWorks(d.items ?? [])
      })
      .catch(() => {})
  }, [])

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-iupa-green" />
          <h2
            className="text-xl font-bold text-iupa-dark"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Trabajos Recientes
          </h2>
        </div>
        <a
          href="/buscar"
          className="flex items-center gap-1 text-sm font-semibold text-iupa-accent hover:text-orange-700"
        >
          VER TODOS
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="space-y-3">
        {works.map((work) => {
          const type = getTypeLabel(work.files, work.sourceUrl)
          const Icon = getTypeIcon(type)
          const author = work.authors?.map((a) => a.name).join(', ') || 'Sin autor'
          const year = work.publishedAt
            ? new Date(work.publishedAt).getFullYear()
            : ''
          return (
            <div
              key={work.id}
              className="flex items-start gap-4 rounded-xl border border-iupa-light bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase ${
                  type === 'PDF' || type === 'LINK'
                    ? 'bg-iupa-green-light text-iupa-green'
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                <Icon className="h-3 w-3" />
                {type}
              </span>

              <div className="min-w-0 flex-1">
                <a
                  href={`/documentos/${work.id}`}
                  className="text-sm font-semibold text-iupa-dark transition-colors hover:text-iupa-green hover:underline"
                >
                  {work.title}
                </a>
                <p className="mt-0.5 text-xs text-iupa-medium">
                  {author}{work.degreeProgram ? ` — ${work.degreeProgram}` : ''}{year ? ` — ${year}` : ''}
                </p>
              </div>

              <a
                href={`/documentos/${work.id}`}
                className="shrink-0 rounded-lg border border-iupa-green px-4 py-2 text-xs font-semibold text-iupa-green transition-colors hover:bg-iupa-green hover:text-white"
              >
                <span className="flex items-center gap-1">
                  {work.sourceUrl ? (
                    <LinkIcon className="h-3.5 w-3.5" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {work.sourceUrl ? 'ABRIR ENLACE' : 'VER / DESCARGAR'}
                </span>
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}
