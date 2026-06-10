import { useMemo, useState } from 'react'
import type { Document } from '../../types'

interface Props {
  document: Document
  onClose: () => void
}

const typeLabels: Record<string, string> = {
  Article: 'Artículo',
  Thesis: 'Tesis de Licenciatura',
  Dataset: 'Dataset',
  Software: 'Software',
  Other: 'Otro',
}

export default function DublinCorePreview({ document, onClose }: Props) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const baseUrl = window.location.origin
  const docUrl = `${baseUrl}/documents/${document.id}`
  const pubDate = document.publicationDate
    ? new Date(document.publicationDate).toISOString().split('T')[0]
    : document.publishedAt
    ? new Date(document.publishedAt).toISOString().split('T')[0]
    : ''

  const authorNames = document.authors
    .sort((a, b) => a.order - b.order)
    .map((a) => {
      const parts = a.name.trim().split(' ')
      const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
      const firstNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
      return lastName ? `${lastName}, ${firstNames}` : a.name
    })

  const dcMapping = useMemo(() => [
    { dc: 'dc.title', value: document.title, required: true },
    { dc: 'dc.creator', value: authorNames.join('; '), required: true },
    { dc: 'dc.contributor.advisor', value: document.advisorName || '—', required: true },
    { dc: 'dc.publisher', value: document.institution || 'IUPA', required: true },
    { dc: 'dc.date.issued', value: pubDate || '—', required: true },
    { dc: 'dc.type', value: typeLabels[document.type] || document.type, required: true },
    { dc: 'dc.description.abstract', value: document.abstractEs || document.description || '—', required: true },
    { dc: 'dc.subject', value: document.keywords.join('; ') || '—', required: true },
    { dc: 'dc.language', value: document.aiMetadata?.language || 'Español', required: true },
    { dc: 'dc.rights.license', value: document.license || 'CC BY-NC-ND 4.0', required: true },
    { dc: 'dc.identifier.uri', value: docUrl, required: true },
    { dc: 'dc.coverage.spatial', value: document.department || '—', required: false },
    { dc: 'dc.relation.ispartofseries', value: document.degreeProgram || '—', required: false },
  ], [document, authorNames, pubDate, docUrl])

  const htmlMetaTags = useMemo(() => {
    const lines: string[] = []
    lines.push('<!-- Metadatos para Google Scholar -->')
    lines.push(`<meta name="citation_title" content="${document.title}">`)
    authorNames.forEach((name) => {
      lines.push(`<meta name="citation_author" content="${name}">`)
    })
    if (pubDate) lines.push(`<meta name="citation_publication_date" content="${pubDate}">`)
    if (document.files[0]?.originalFileName.endsWith('.pdf')) {
      lines.push(`<meta name="citation_pdf_url" content="${docUrl}">`)
    }
    lines.push(`<meta name="citation_institution" content="${document.institution || 'IUPA'}">`)
    lines.push(`<meta name="citation_language" content="${(document.aiMetadata?.language || 'es').toLowerCase().substring(0, 2)}">`)
    if (document.keywords.length > 0) {
      lines.push(`<meta name="citation_keywords" content="${document.keywords.join('; ')}">`)
    }
    lines.push('')
    lines.push('<!-- Dublin Core para interoperabilidad -->')
    lines.push(`<meta name="dc.title" content="${document.title}">`)
    authorNames.forEach((name) => {
      lines.push(`<meta name="dc.creator" content="${name}">`)
    })
    if (document.advisorName) lines.push(`<meta name="dc.contributor.advisor" content="${document.advisorName}">`)
    lines.push(`<meta name="dc.publisher" content="${document.institution || 'IUPA'}">`)
    if (pubDate) lines.push(`<meta name="dc.date.issued" content="${pubDate}">`)
    lines.push(`<meta name="dc.type" content="${typeLabels[document.type] || document.type}">`)
    const abstractText = document.abstractEs || document.description || ''
    if (abstractText) lines.push(`<meta name="dc.description.abstract" content="${abstractText}">`)
    document.keywords.forEach((kw) => {
      lines.push(`<meta name="dc.subject" content="${kw}">`)
    })
    lines.push(`<meta name="dc.rights.license" content="${document.license || 'CC BY-NC-ND 4.0'}">`)
    lines.push(`<meta name="dc.identifier.uri" content="${docUrl}">`)
    return lines.join('\n')
  }, [document, authorNames, pubDate, docUrl])

  const jsonLd = useMemo(() => {
    const obj: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: document.title,
      author: authorNames.map((name) => ({ '@type': 'Person', name })),
      datePublished: pubDate,
      publisher: { '@type': 'Organization', name: document.institution || 'IUPA' },
      inLanguage: (document.aiMetadata?.language || 'es').toLowerCase().substring(0, 2),
      license: `https://creativecommons.org/licenses/by-nc-nd/4.0/`,
      isAccessibleForFree: true,
    }
    if (document.description) obj.description = document.description
    if (document.keywords.length > 0) obj.keywords = document.keywords.join(', ')
    return JSON.stringify(obj, null, 2)
  }, [document, authorNames, pubDate])

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-iupa-light px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-iupa-dark">Metadatos Dublin Core</h2>
            <p className="text-xs text-iupa-medium">Estándar DCMI — Ley 26.899</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-iupa-medium hover:bg-iupa-light hover:text-iupa-dark transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">
              Mapeo Dublin Core
            </h3>
            <div className="overflow-hidden rounded-lg border border-iupa-light">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-iupa-light/50">
                    <th className="px-4 py-2 text-left font-medium text-iupa-dark">Campo DCMI</th>
                    <th className="px-4 py-2 text-left font-medium text-iupa-dark">Valor</th>
                    <th className="px-4 py-2 text-center font-medium text-iupa-dark w-16">Ley</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-iupa-light">
                  {dcMapping.map((row) => (
                    <tr key={row.dc} className="hover:bg-iupa-light/30">
                      <td className="px-4 py-2 font-mono text-xs text-iupa-green">{row.dc}</td>
                      <td className={`px-4 py-2 text-iupa-dark ${row.value === '—' ? 'text-iupa-medium/50 italic' : ''}`}>
                        {row.value}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.required ? (
                          <span className="text-xs font-medium text-emerald-600">Sí</span>
                        ) : (
                          <span className="text-xs text-iupa-medium">Rec.</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-iupa-medium">
                Meta tags HTML
              </h3>
              <button
                onClick={() => copyToClipboard(htmlMetaTags, 'html')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-dark hover:bg-iupa-light transition-colors"
              >
                {copiedSection === 'html' ? (
                  <>✓ Copiado</>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-green-400 leading-relaxed">
              {htmlMetaTags}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-iupa-medium">
                JSON-LD Structured Data
              </h3>
              <button
                onClick={() => copyToClipboard(jsonLd, 'json')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-dark hover:bg-iupa-light transition-colors"
              >
                {copiedSection === 'json' ? (
                  <>✓ Copiado</>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-amber-300 leading-relaxed">
              {jsonLd}
            </pre>
          </div>
        </div>

        <div className="border-t border-iupa-light px-6 py-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-iupa-light px-5 py-2 text-sm font-medium text-iupa-dark hover:bg-iupa-light transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
