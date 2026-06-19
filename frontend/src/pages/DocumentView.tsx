import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useDocument, useSearchDocuments } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import type { Document } from '../types'
import MetadataEditor from '../components/documents/MetadataEditor'
import DublinCorePreview from '../components/documents/DublinCorePreview'
import Spinner from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Navbar from '../components/public/Navbar'
import Footer from '../components/public/Footer'
import { getGoogleDriveEmbedUrl } from '../utils/gdrive'
import MediaLinkPlayer from '../components/ui/MediaLinkPlayer'
import { generateCitation, type CitationFormat } from '../utils/citation'

const typeLabels: Record<string, string> = {
  Article: 'Artículo',
  Thesis: 'Tesis',
  Dataset: 'Dataset',
  Software: 'Software',
  Link: 'Enlace',
  Other: 'Otro',
}

const statusConfig: Record<string, { label: string; class: string }> = {
  Published: { label: 'Publicado', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Draft: { label: 'Borrador', class: 'bg-amber-50 text-amber-700 border-amber-200' },
  Processing: { label: 'En proceso', class: 'bg-sky-50 text-sky-700 border-sky-200' },
  Rejected: { label: 'Rechazado', class: 'bg-red-50 text-red-700 border-red-200' },
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function AIAnalysisSection({ doc }: { doc: Document }) {
  const [abstractExpanded, setAbstractExpanded] = useState(false)
  const ai = doc.aiMetadata
  if (!ai) return null

  return (
    <div className="rounded-xl border border-iupa-green-light bg-iupa-green-light/40 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md bg-iupa-green/10 px-2 py-0.5 text-xs font-medium text-iupa-green">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813 2.846a4.5 4.5 0 01-3.09 3.09L2.25 22.5l.375-.375L2.25 22.5l1.846-.813A4.5 4.5 0 019 18.75l.813-2.846" />
          </svg>
          Analizado por IA
        </span>
      </div>

      {ai.summary && (
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen</h4>
          <p className="text-sm text-iupa-medium leading-relaxed">{ai.summary}</p>
        </div>
      )}

      {ai.extendedAbstract && (
        <div className="mb-4">
          <h4 className="mb-1 text-sm font-semibold text-iupa-dark">Resumen extendido</h4>
          <p className={`text-sm text-iupa-medium leading-relaxed ${abstractExpanded ? '' : 'line-clamp-3'}`}>
            {ai.extendedAbstract}
          </p>
          <button
            onClick={() => setAbstractExpanded((p) => !p)}
            className="mt-1 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
          >
            {abstractExpanded ? 'Mostrar menos' : 'Mostrar más'}
          </button>
        </div>
      )}

      {ai.suggestedKeywords && ai.suggestedKeywords.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 text-sm font-semibold text-iupa-dark">Palabras clave sugeridas</h4>
          <div className="flex flex-wrap gap-2">
            {ai.suggestedKeywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-iupa-dark shadow-sm ring-1 ring-iupa-light"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 text-sm">
        {ai.suggestedType && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Tipo sugerido</span>
            <p className="text-iupa-dark">{ai.suggestedType}</p>
          </div>
        )}
        {ai.suggestedCollection && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Colección sugerida</span>
            <p className="text-iupa-dark">{ai.suggestedCollection}</p>
          </div>
        )}
        {ai.language && (
          <div>
            <span className="text-xs font-medium text-iupa-medium">Idioma</span>
            <p className="text-iupa-dark">{ai.language}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AuthorsSection({ authors }: { authors: Document['authors'] }) {
  if (!authors || authors.length === 0) return null
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Autores</h3>
      <div className="space-y-2">
        {authors
          .sort((a, b) => a.order - b.order)
          .map((author) => (
            <div key={author.id} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-iupa-green-light text-xs font-medium text-iupa-green">
                {author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <Link to={`/autor/${encodeURIComponent(author.name)}`} className="text-sm font-medium text-iupa-dark hover:text-iupa-green hover:underline">{author.name}</Link>
                {author.orcid && (
                  <p className="text-xs text-iupa-medium">ORCID: {author.orcid}</p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

function DocumentMetaTags({ doc }: { doc: Document }) {
  const baseUrl = window.location.origin
  const docUrl = `${baseUrl}/documentos/${doc.id}`
  const pubDate = doc.publicationDate
    ? new Date(doc.publicationDate).toISOString().split('T')[0]
    : doc.publishedAt
    ? new Date(doc.publishedAt).toISOString().split('T')[0]
    : ''

  const authorNames = doc.authors
    .sort((a, b) => a.order - b.order)
    .map((a) => {
      const parts = a.name.trim().split(' ')
      const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
      const firstNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
      return lastName ? `${lastName}, ${firstNames}` : a.name
    })

  const primary = doc.files[0]
  const pdfUrl = primary && primary.originalFileName.endsWith('.pdf')
    ? `${baseUrl}/api/documents/${doc.id}/download/${primary.id}`
    : null

  const abstractText = doc.abstractEs || doc.description || ''
  const language = (doc.aiMetadata?.language || 'es').toLowerCase().substring(0, 2)

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: doc.title,
    author: authorNames.map((name) => ({ '@type': 'Person', name })),
    datePublished: pubDate || undefined,
    publisher: { '@type': 'Organization', name: doc.institution || 'IUPA' },
    inLanguage: language,
    license: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
    isAccessibleForFree: true,
  }
  if (doc.description) jsonLd.description = doc.description
  if (doc.keywords.length > 0) jsonLd.keywords = doc.keywords.join(', ')
  if (pdfUrl) jsonLd.url = pdfUrl

  return (
    <Helmet>
      <title>{doc.title} — GuIA</title>
      <link rel="canonical" href={docUrl} />

      {/* Google Scholar Highwire */}
      <meta name="citation_title" content={doc.title} />
      {authorNames.map((name) => (
        <meta key={name} name="citation_author" content={name} />
      ))}
      {pubDate && <meta name="citation_publication_date" content={pubDate} />}
      {doc.type === 'Article' && <meta name="citation_journal_title" content={doc.collectionName || doc.institution || 'IUPA'} />}
      {doc.type === 'Thesis' && doc.institution && <meta name="citation_dissertation_institution" content={doc.institution} />}
      {pdfUrl && <meta name="citation_pdf_url" content={pdfUrl} />}
      <meta name="citation_abstract_html_url" content={`${baseUrl}/api/crawl/documents/${doc.id}`} />
      <meta name="citation_institution" content={doc.institution || 'IUPA'} />
      <meta name="citation_language" content={language} />
      {doc.keywords.length > 0 && <meta name="citation_keywords" content={doc.keywords.join('; ')} />}

      {/* Dublin Core */}
      <meta name="dc.title" content={doc.title} />
      {authorNames.map((name) => (
        <meta key={`dc-${name}`} name="dc.creator" content={name} />
      ))}
      {doc.advisorName && <meta name="dc.contributor.advisor" content={doc.advisorName} />}
      <meta name="dc.publisher" content={doc.institution || 'IUPA'} />
      {pubDate && <meta name="dc.date.issued" content={pubDate} />}
      <meta name="dc.type" content={doc.type} />
      {abstractText && <meta name="dc.description.abstract" content={abstractText} />}
      {doc.keywords.map((kw) => (
        <meta key={`dc-subject-${kw}`} name="dc.subject" content={kw} />
      ))}
      <meta name="dc.rights.license" content={doc.license || 'CC BY-NC-ND 4.0'} />
      <meta name="dc.identifier.uri" content={docUrl} />
      <meta name="dc.format" content={primary?.mimeType || 'application/pdf'} />

      {/* JSON-LD */}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}

export default function DocumentView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data: doc, isLoading, isError, error } = useDocument(id)
  const [editing, setEditing] = useState(false)
  const [showDublinCore, setShowDublinCore] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const relatedParams = useMemo(() => ({
    keywords: doc?.keywords,
    pageSize: 5,
  }), [doc?.keywords])

  const { data: relatedDocs } = useSearchDocuments(
    doc?.keywords && doc.keywords.length > 0
      ? relatedParams
      : { pageSize: 0 }
  )

  const isOwner = user?.id === doc?.uploadedByUserId
  const isAdmin = user?.role === 'Admin'

  const relatedList = useMemo(
    () => doc ? ((Array.isArray(relatedDocs) ? relatedDocs : []) as Document[]).filter((d) => d.id !== doc.id) : [],
    [relatedDocs, doc?.id],
  )

  {doc && <DocumentMetaTags doc={doc} />}

  const [exporting, setExporting] = useState(false)
  const [showCitation, setShowCitation] = useState(false)
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('apa')
  const [copied, setCopied] = useState(false)
  const citationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showCitation) return
    const handleClick = (e: MouseEvent) => {
      if (citationRef.current && !citationRef.current.contains(e.target as Node)) {
        setShowCitation(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showCitation])

  const exportPdf = useCallback(async () => {
    if (!doc) return
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageW = 190
      const margin = 10
      let y = 15

      function addText(text: string, opts: { size?: number; bold?: boolean; color?: string; mono?: boolean; maxW?: number } = {}) {
        const size = opts.size || 10
        pdf.setFontSize(size)
        pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal')
        if (opts.mono) pdf.setFont('courier', opts.bold ? 'bold' : 'normal')
        if (opts.color) pdf.setTextColor(opts.color)
        const lines = pdf.splitTextToSize(text || '—', opts.maxW || pageW)
        for (const line of lines) {
          if (y > 280) { pdf.addPage(); y = 15 }
          pdf.text(line, margin, y)
          y += size * 0.45
        }
        pdf.setTextColor('#1a1a1a')
      }

      function addLine(px: number, py: number, w: number) {
        pdf.setDrawColor('#ddd')
        pdf.line(px, py, px + w, py)
      }

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor('#1B4D3E')
      addText('REPOSITORIO INSTITUCIONAL IUPA', { size: 14, bold: true, color: '#1B4D3E' })
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor('#666')
      addText('Acceso abierto al conocimiento académico y artístico', { size: 9, color: '#666' })
      addLine(margin, y + 1, pageW)
      y += 6

      addText(doc.title, { size: 14, bold: true, color: '#1B4D3E' })
      if (doc.description) addText(doc.description, { size: 9, color: '#666' })
      y += 3

      const typeLabels: Record<string, string> = {
        Article: 'Artículo', Thesis: 'Tesis de Licenciatura', Dataset: 'Dataset',
        Software: 'Software', Other: 'Otro', ConferenceDocument: 'Documento de conferencia', Book: 'Libro',
      }
      const pubDate = doc.publicationDate
        ? new Date(doc.publicationDate).toISOString().split('T')[0]
        : doc.publishedAt ? new Date(doc.publishedAt).toISOString().split('T')[0] : ''
      const authorNames = (doc.authors || [])
        .sort((a, b) => a.order - b.order)
        .map((a) => { const p = a.name.trim().split(' '); return p.length > 1 ? `${p[p.length-1]}, ${p.slice(0,-1).join(' ')}` : a.name })

      const dcMapping = [
        { dc: 'dc.title', value: doc.title },
        { dc: 'dc.creator', value: authorNames.join('; ') || '—' },
        { dc: 'dc.contributor.advisor', value: doc.advisorName || '—' },
        { dc: 'dc.publisher', value: doc.institution || 'IUPA' },
        { dc: 'dc.date.issued', value: pubDate || '—' },
        { dc: 'dc.type', value: typeLabels[doc.type] || doc.type },
        { dc: 'dc.description.abstract', value: doc.abstractEs || doc.description || '—' },
        { dc: 'dc.subject', value: (doc.keywords || []).join('; ') || '—' },
        { dc: 'dc.language', value: doc.aiMetadata?.language || 'Español' },
        { dc: 'dc.rights.license', value: doc.license || 'CC BY-NC-ND 4.0' },
        { dc: 'dc.identifier.uri', value: `${window.location.origin}/documentos/${doc.id}` },
        { dc: 'dc.coverage.spatial', value: doc.department || '—' },
        { dc: 'dc.relation.ispartofseries', value: doc.degreeProgram || '—' },
      ]

      addText('Metadatos Dublin Core', { size: 11, bold: true, color: '#1B4D3E' })
      y += 2
      for (const row of dcMapping) {
        const val = row.value || '—'
        pdf.setFontSize(8)
        pdf.setFont('courier', 'normal')
        pdf.setTextColor('#1B4D3E')
        const dcLines = pdf.splitTextToSize(row.dc, 45)
        const valLines = pdf.splitTextToSize(val, pageW - 50)
        const rowH = Math.max(dcLines.length, valLines.length) * 3.5
        if (y + rowH > 285) { pdf.addPage(); y = 15 }
        pdf.setFont('courier', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor('#1B4D3E')
        dcLines.forEach((line: string, i: number) => pdf.text(line, margin, y + i * 3.5))
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8)
        pdf.setTextColor('#1a1a1a')
        valLines.forEach((line: string, i: number) => pdf.text(line, margin + 50, y + i * 3.5))
        y += rowH + 1
      }

      if (doc.metadataValues && doc.metadataValues.length > 0) {
        y += 2
        addText(`Metadatos SNRD${doc.metadataSchemaName ? ` — ${doc.metadataSchemaName}` : ''}`, { size: 11, bold: true, color: '#1B4D3E' })
        y += 2

        const colW = [35, 55, 100]
        pdf.setFillColor('#f5f5f5')
        pdf.rect(margin, y - 3, colW.reduce((a, b) => a + b, 0), 6, 'F')
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'bold')
        pdf.setTextColor('#1B4D3E')
        pdf.text('DC Element', margin, y)
        pdf.text('Campo', margin + colW[0], y)
        pdf.text('Valor', margin + colW[0] + colW[1], y)
        y += 6

        let lastLabel = ''
        for (const mv of doc.metadataValues) {
          const dc = mv.qualifier ? `${mv.dublinCoreElement}.${mv.qualifier}` : mv.dublinCoreElement
          const dcLines = pdf.splitTextToSize(mv.fieldLabel === lastLabel ? '' : dc, colW[0] - 2)
          const labelLines = pdf.splitTextToSize(mv.fieldLabel === lastLabel ? '' : mv.fieldLabel, colW[1] - 2)
          const valLines = pdf.splitTextToSize(mv.value || '—', colW[2] - 2)
          const rowH = Math.max(dcLines.length, labelLines.length, valLines.length) * 3.5
          if (y + rowH > 285) { pdf.addPage(); y = 15 }
          pdf.setFontSize(7.5)
          pdf.setFont('courier', 'normal')
          pdf.setTextColor('#2D7A6B')
          dcLines.forEach((line: string, i: number) => pdf.text(line, margin, y + i * 3.5))
          pdf.setFont('helvetica', mv.fieldLabel === lastLabel ? 'normal' : 'bold')
          pdf.setTextColor(mv.fieldLabel === lastLabel ? '#999' : '#1a1a1a')
          labelLines.forEach((line: string, i: number) => pdf.text(line, margin + colW[0], y + i * 3.5))
          pdf.setFont('helvetica', 'normal')
          pdf.setTextColor('#1a1a1a')
          valLines.forEach((line: string, i: number) => pdf.text(line, margin + colW[0] + colW[1], y + i * 3.5))
          y += rowH + 1
          lastLabel = mv.fieldLabel
        }
      }

      y = Math.max(y, 275)
      addLine(margin, y + 3, pageW)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor('#999')
      pdf.text(`Generado desde el Repositorio Institucional IUPA — ${new Date().toLocaleDateString('es-AR')}`, margin, y + 9)

      pdf.save(`${doc.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`)
    } catch (e) {
      console.error('PDF export error:', e)
    } finally {
      setExporting(false)
    }
  }, [doc])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
        <div className="flex items-center justify-center p-24">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError || !doc) {
    const is404 = error && 'response' in error && (error as { response: { status: number } }).response?.status === 404
    return (
      <div className="min-h-screen bg-white">
        <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <svg className="mx-auto mb-4 h-16 w-16 text-iupa-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              {is404 ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              )}
            </svg>
            <p className="text-lg font-medium text-iupa-medium">
              {is404 ? 'Documento no encontrado' : 'Error al cargar el documento'}
            </p>
            <p className="mt-1 text-sm text-iupa-medium">
              {is404 ? 'El documento que buscas no existe o ha sido eliminado' : error instanceof Error ? error.message : 'Ocurrió un error inesperado'}
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
              Volver
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const hasSourceUrl = !!doc.sourceUrl
  const primary = hasSourceUrl ? null : (doc.files.find((f) => f.isPrimary) ?? doc.files[0])
  const isPdf = primary?.mimeType === 'application/pdf'
  const isImage = primary?.mimeType.startsWith('image/')
  const previewUrl = primary ? `/api/documents/${doc.id}/preview/${primary.id}` : null
  const downloadUrl = primary ? `/api/documents/${doc.id}/download/${primary.id}` : null
  const status = statusConfig[doc.status] ?? statusConfig.Draft

  return (
    <div className="min-h-screen bg-gradient-to-b from-iupa-green-light/30 via-white to-white">
      <Navbar onMenuToggle={() => setMenuOpen((p) => !p)} menuOpen={menuOpen} />

      <div className="sticky top-0 z-10 border-b border-iupa-light/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-iupa-medium">
            <button onClick={() => navigate(-1)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-iupa-medium hover:bg-iupa-light transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver
            </button>
            <span className="text-iupa-light">/</span>
            <Link to="/buscar" className="hover:text-iupa-green transition-colors">Buscar</Link>
            <span className="text-iupa-light">/</span>
            <span className="text-iupa-dark font-medium truncate max-w-[200px]">{doc.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDublinCore(true)}
              className="flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-medium hover:border-iupa-green hover:text-iupa-green transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dublin Core
            </button>
            {(isOwner || isAdmin) && !editing && (
              <>
                {doc.status !== 'Published' && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-iupa-green px-3 py-1.5 text-xs font-bold text-white hover:bg-iupa-green-secondary transition-colors shadow-sm"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    EDITAR
                  </button>
                )}
              </>
            )}
            {hasSourceUrl && (
              <a
                href={doc.sourceUrl ?? ''}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                ABRIR ENLACE
              </a>
            )}
            {downloadUrl && (
              <a
                href={downloadUrl}
                className="flex items-center gap-1.5 rounded-lg bg-iupa-green px-4 py-1.5 text-xs font-bold text-white hover:bg-iupa-green-secondary transition-colors shadow-sm"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                DESCARGAR
              </a>
            )}
            <button
              onClick={exportPdf}
              disabled={exporting}
              className="flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-medium hover:border-iupa-green hover:text-iupa-green disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              )}
              EXPORTAR PDF
            </button>
            <div className="relative">
              <button
                onClick={() => setShowCitation(!showCitation)}
                className="flex items-center gap-1.5 rounded-lg border border-iupa-light px-3 py-1.5 text-xs font-medium text-iupa-medium hover:border-iupa-green hover:text-iupa-green transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CITAR
              </button>
              {showCitation && (
                <div className="absolute right-0 top-full mt-2 z-50 w-96">
                  <div className="overflow-hidden rounded-xl border border-iupa-light bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 border-b border-iupa-light bg-iupa-light/30 p-1">
                      <button
                        onClick={() => setCitationFormat('apa')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${citationFormat === 'apa' ? 'bg-white text-iupa-dark shadow-sm' : 'text-iupa-medium hover:text-iupa-dark'}`}
                      >
                        APA
                      </button>
                      <button
                        onClick={() => setCitationFormat('bibtex')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${citationFormat === 'bibtex' ? 'bg-white text-iupa-dark shadow-sm' : 'text-iupa-medium hover:text-iupa-dark'}`}
                      >
                        BibTeX
                      </button>
                    </div>
                    <div className="p-3">
                      <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-all rounded-lg bg-neutral-900 p-3 font-mono text-[11px] leading-relaxed text-gray-100">
                        {doc && generateCitation(doc, citationFormat)}
                      </pre>
                    </div>
                    <div className="flex justify-end border-t border-iupa-light px-3 py-2">
                      <button
                        onClick={() => {
                          if (!doc) return
                          const text = generateCitation(doc, citationFormat)
                          navigator.clipboard.writeText(text).then(() => {
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          })
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-iupa-green px-3 py-1.5 text-xs font-bold text-white hover:bg-iupa-green-secondary transition-colors"
                      >
                        {copied ? (
                          <>COPIADO</>
                        ) : (
                          <>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                            COPIAR
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {editing ? (
          <div className="overflow-hidden rounded-2xl border border-iupa-light bg-white shadow-sm">
            <div className="p-8">
              <MetadataEditor
                document={doc}
                onCancel={() => setEditing(false)}
                onSaved={() => setEditing(false)}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-iupa-light bg-white shadow-sm">
              <div className="relative bg-gradient-to-br from-[#2D7A6B] to-iupa-green px-8 py-10 text-white">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative" ref={citationRef}>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${status.class.includes('emerald') ? 'border-emerald-400/50 bg-emerald-500/20 text-white' : status.class.includes('amber') ? 'border-amber-400/50 bg-amber-500/20 text-white' : status.class.includes('sky') ? 'border-sky-400/50 bg-sky-500/20 text-white' : 'border-red-400/50 bg-red-500/20 text-white'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.class.includes('emerald') ? 'bg-emerald-400' : status.class.includes('amber') ? 'bg-amber-400' : status.class.includes('sky') ? 'bg-sky-400' : 'bg-red-400'}`} />
                      {status.label}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                      {typeLabels[doc.type] || doc.type}
                    </span>
                    <span className="ml-auto text-xs text-white/50">
                      ID: {doc.id.slice(0, 8)}...
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight">{doc.title}</h1>
                  {doc.description && (
                    <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/75">{doc.description}</p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-5 text-sm text-white/60">
                    {doc.uploadedByName && (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        {doc.uploadedByName}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      Subido {formatDate(doc.uploadedAt)}
                    </span>
                    {doc.publishedAt && (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Publicado {formatDate(doc.publishedAt)}
                      </span>
                    )}
                    {doc.collectionName && (
                      <span className="flex items-center gap-1.5">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                        </svg>
                        {doc.collectionName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                {doc.keywords && doc.keywords.length > 0 && (
                  <div className="mb-8 flex flex-wrap gap-2">
                    {doc.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 rounded-full bg-iupa-green-light/60 px-3 py-1 text-xs font-medium text-iupa-green ring-1 ring-iupa-green/20"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-8">
                  {doc.abstractEs && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Resumen</h3>
                      <div className="rounded-xl border border-iupa-light bg-iupa-light/30 p-5">
                        <p className="text-sm text-iupa-dark leading-relaxed whitespace-pre-line">{doc.abstractEs}</p>
                      </div>
                    </div>
                  )}

              <AIAnalysisSection doc={doc} />

              {hasSourceUrl ? (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Enlace externo</h3>
                  <div className="overflow-hidden rounded-xl border border-iupa-light bg-iupa-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <svg className="h-5 w-5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        <span className="truncate text-sm font-medium text-iupa-dark">{doc.sourceUrl}</span>
                      </div>
                      <a
                        href={doc.sourceUrl ?? ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        Abrir enlace externo
                      </a>
                    </div>
                    <div className="bg-iupa-white">
                      {(() => {
                        const gdriveEmbedUrl = getGoogleDriveEmbedUrl(doc.sourceUrl!)
                        if (gdriveEmbedUrl) {
                          return (
                            <iframe
                              src={gdriveEmbedUrl}
                              className="h-[600px] w-full"
                              title="Vista previa de Google Drive"
                              allow="autoplay"
                            />
                          )
                        }
                        return (
                          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-iupa-medium">
                            <svg className="h-16 w-16 text-iupa-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                            </svg>
                            <p className="text-sm">Vista previa no disponible para este enlace</p>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              ) : doc.files && doc.files.length > 0 && primary && (
                <div>
                      <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Archivos</h3>
                      <div className="overflow-hidden rounded-xl border border-iupa-light bg-iupa-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <svg className="h-5 w-5 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="truncate text-sm font-medium text-iupa-dark">{primary.originalFileName}</span>
                            <span className="shrink-0 text-xs text-iupa-medium">({(primary.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
                          </div>
                          <a
                            href={downloadUrl!}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-iupa-green px-3 py-1.5 text-xs font-medium text-white hover:bg-iupa-green-secondary transition-colors"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Descargar
                          </a>
                        </div>
                        <div className="bg-iupa-white">
                          {isPdf ? (
                            <iframe src={previewUrl!} className="h-[600px] w-full" title="Vista previa del documento" />
                          ) : isImage ? (
                            <img src={previewUrl!} alt={primary.originalFileName} className="mx-auto max-h-[600px] object-contain p-4" />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-iupa-medium">
                              <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <p className="text-sm">Vista previa no disponible para este tipo de archivo</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {doc.files.length > 1 && (
                        <div className="mt-3 space-y-1">
                          {doc.files.filter((f) => f.id !== primary.id).map((file) => (
                            <div key={file.id} className="flex items-center justify-between rounded-lg border border-iupa-light bg-iupa-white px-4 py-2.5 text-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <svg className="h-4 w-4 shrink-0 text-iupa-medium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="truncate text-iupa-dark">{file.originalFileName}</span>
                                <span className="shrink-0 text-xs text-iupa-medium">({(file.fileSizeBytes / 1024 / 1024).toFixed(1)} MB)</span>
                              </div>
                              <a
                                href={`/api/documents/${doc.id}/download/${file.id}`}
                                className="shrink-0 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
                              >
                                Descargar
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {doc.mediaLinks && doc.mediaLinks.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-lg font-semibold text-iupa-dark">Enlaces multimedia</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {doc.mediaLinks.map((ml, i) => (
                          <div key={i} className="overflow-hidden rounded-xl border border-iupa-light bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-iupa-light bg-iupa-light/50 px-4 py-2.5">
                              <span className="truncate text-sm font-medium text-iupa-dark">{ml.label || ml.url}</span>
                              <a
                                href={ml.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 text-xs font-medium text-iupa-green hover:text-iupa-green-secondary"
                              >
                                Abrir
                              </a>
                            </div>
                            <div className={ml.type === 'audio' ? 'px-3 py-2' : 'aspect-video'}>
                              <MediaLinkPlayer link={ml} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <AuthorsSection authors={doc.authors} />

                  {doc.metadataValues && doc.metadataValues.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-iupa-medium">Metadatos SNRD{doc.metadataSchemaName ? ` — ${doc.metadataSchemaName}` : ''}</h3>
                      <div className="overflow-hidden rounded-xl border border-iupa-light bg-white shadow-sm">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-iupa-light/50">
                              <th className="px-4 py-2 text-left font-medium text-iupa-dark">DC Element</th>
                              <th className="px-4 py-2 text-left font-medium text-iupa-dark">Campo</th>
                              <th className="px-4 py-2 text-left font-medium text-iupa-dark">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-iupa-light">
                            {(() => {
                              let lastLabel = ''
                              return doc.metadataValues.map((mv, i) => {
                                const isSame = mv.fieldLabel === lastLabel
                                lastLabel = mv.fieldLabel
                                const dcElement = mv.qualifier ? `${mv.dublinCoreElement}.${mv.qualifier}` : mv.dublinCoreElement
                                return (
                                  <tr key={i} className={isSame ? 'bg-iupa-light/20' : ''}>
                                    {isSame ? (
                                      <td className="px-4 py-2.5" />
                                    ) : (
                                      <td className="px-4 py-2.5 font-mono text-xs text-iupa-green">{dcElement}</td>
                                    )}
                                    <td className={`px-4 py-2.5 text-iupa-dark ${isSame ? 'text-iupa-medium/60 text-xs' : 'font-medium'}`}>
                                      {isSame ? '' : mv.fieldLabel}
                                    </td>
                                    <td className={`px-4 py-2.5 text-iupa-dark ${mv.value ? '' : 'text-iupa-medium/50 italic'}`}>{mv.value || '—'}</td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-iupa-medium">Metadatos Dublin Core</h3>
                      <span className="text-xs text-iupa-medium">Estándar DCMI — Ley 26.899</span>
                    </div>
                    {(() => {
                      const typeLabels: Record<string, string> = {
                        Article: 'Artículo', Thesis: 'Tesis de Licenciatura', Dataset: 'Dataset',
                        Software: 'Software', Other: 'Otro',
                      }
                      const pubDate = doc.publicationDate
                        ? new Date(doc.publicationDate).toISOString().split('T')[0]
                        : doc.publishedAt ? new Date(doc.publishedAt).toISOString().split('T')[0] : ''
                      const authorNames = (doc.authors || [])
                        .sort((a, b) => a.order - b.order)
                        .map((a) => { const p = a.name.trim().split(' '); return p.length > 1 ? `${p[p.length-1]}, ${p.slice(0,-1).join(' ')}` : a.name })
                      const dcMapping = [
                        { dc: 'dc.title', value: doc.title, required: true },
                        { dc: 'dc.creator', value: authorNames.join('; ') || '—', required: true },
                        { dc: 'dc.contributor.advisor', value: doc.advisorName || '—', required: true },
                        { dc: 'dc.publisher', value: doc.institution || 'IUPA', required: true },
                        { dc: 'dc.date.issued', value: pubDate || '—', required: true },
                        { dc: 'dc.type', value: typeLabels[doc.type] || doc.type, required: true },
                        { dc: 'dc.description.abstract', value: doc.abstractEs || doc.description || '—', required: true },
                        { dc: 'dc.subject', value: (doc.keywords || []).join('; ') || '—', required: true },
                        { dc: 'dc.language', value: doc.aiMetadata?.language || 'Español', required: true },
                        { dc: 'dc.rights.license', value: doc.license || 'CC BY-NC-ND 4.0', required: true },
                        { dc: 'dc.identifier.uri', value: `${window.location.origin}/documentos/${doc.id}`, required: true },
                        { dc: 'dc.coverage.spatial', value: doc.department || '—', required: false },
                        { dc: 'dc.relation.ispartofseries', value: doc.degreeProgram || '—', required: false },
                      ]
                      return (
                        <div className="overflow-hidden rounded-xl border border-iupa-light bg-white shadow-sm">
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
                                  <td className={`px-4 py-2 text-iupa-dark ${row.value === '—' ? 'text-iupa-medium/50 italic' : ''}`}>{row.value}</td>
                                  <td className="px-4 py-2 text-center">
                                    {row.required
                                      ? <span className="text-xs font-medium text-emerald-600">Sí</span>
                                      : <span className="text-xs text-iupa-medium">Rec.</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {relatedList.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-iupa-light bg-white shadow-sm">
                <div className="border-b border-iupa-light bg-iupa-light/30 px-8 py-4">
                  <h2 className="text-lg font-bold text-iupa-dark">Documentos relacionados</h2>
                </div>
                <div className="divide-y divide-iupa-light">
                  {relatedList.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(`/documentos/${r.id}`)}
                      className="flex w-full items-center justify-between px-8 py-4 text-left transition-colors hover:bg-iupa-green-light/50"
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="text-sm font-medium text-iupa-dark group-hover:text-iupa-green">{r.title}</p>
                        <p className="mt-0.5 text-xs text-iupa-medium">
                          {r.uploadedByName} · {formatDate(r.uploadedAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-iupa-light px-3 py-1 text-[11px] font-medium text-iupa-medium">
                        {r.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDublinCore && (
        <DublinCorePreview
          document={doc}
          onClose={() => setShowDublinCore(false)}
          metadataValues={doc.metadataValues}
        />
      )}

      <Footer />
    </div>
  )
}
