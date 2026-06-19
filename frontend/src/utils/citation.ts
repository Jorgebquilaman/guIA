import type { Document } from '../types'

function formatAuthorsBibtex(authors: Document['authors']): string {
  return authors
    .sort((a, b) => a.order - b.order)
    .map((a) => {
      const parts = a.name.trim().split(/\s+/)
      const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
      const firstNames = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
      return lastName ? `${lastName}, ${firstNames}` : a.name
    })
    .join(' and ')
}

function formatAuthorsApa(authors: Document['authors']): string {
  const sorted = authors.sort((a, b) => a.order - b.order)
  return sorted
    .map((a) => {
      const parts = a.name.trim().split(/\s+/)
      const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
      const firstNames = parts.length > 1 ? parts.slice(0, -1) : [parts[0]]
      const initials = firstNames.map((n) => `${n[0]}.`).join(' ')
      return lastName ? `${lastName}, ${initials}` : a.name
    })
    .join(', ')
    .replace(/, ([^,]+)$/, (_, last) => ` & ${last}`)
}

function getYear(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return dateStr.split('-')[0] || ''
}

function getDateApa(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  return parts[0] || ''
}

function generateBibtexKey(doc: Document): string {
  const authors = doc.authors.sort((a, b) => a.order - b.order)
  const firstAuthorLast = authors.length > 0
    ? (() => {
        const parts = authors[0].name.trim().split(/\s+/)
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '') : parts[0].toLowerCase()
      })()
    : 'unknown'
  const year = getYear(doc.publicationDate) || getYear(doc.publishedAt) || 'nodate'
  const titleWords = doc.title.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 3).join('')
  return `${firstAuthorLast}${year}${titleWords}`
}

function getBibtexType(docType: string): string {
  switch (docType) {
    case 'Article': return '@article'
    case 'Thesis': return '@phdthesis'
    case 'Book': return '@book'
    case 'ConferenceDocument': return '@inproceedings'
    default: return '@misc'
  }
}

export function generateBibtex(doc: Document): string {
  const key = generateBibtexKey(doc)
  const type = getBibtexType(doc.type)
  const year = getYear(doc.publicationDate) || getYear(doc.publishedAt)
  const url = `${window.location.origin}/documentos/${doc.id}`
  const authorStr = formatAuthorsBibtex(doc.authors)

  const fields: string[] = [
    `  author = {${authorStr}}`,
    `  title = {${doc.title}}`,
  ]

  if (doc.abstractEs) fields.push(`  abstract = {${doc.abstractEs}}`)
  if (year) fields.push(`  year = {${year}}`)
  if (doc.institution) {
    if (doc.type === 'Thesis') fields.push(`  school = {${doc.institution}}`)
    else fields.push(`  publisher = {${doc.institution}}`)
  }
  if (doc.collectionName) fields.push(`  journal = {${doc.collectionName}}`)
  if (doc.keywords.length > 0) fields.push(`  keywords = {${doc.keywords.join(', ')}}`)
  if (doc.advisorName) fields.push(`  advisor = {${doc.advisorName}}`)
  fields.push(`  url = {${url}}`)

  return `${type}{${key},\n${fields.join(',\n')}\n}`
}

export function generateApa(doc: Document): string {
  const authorStr = formatAuthorsApa(doc.authors)
  const year = getDateApa(doc.publicationDate) || getDateApa(doc.publishedAt)
  const url = `${window.location.origin}/documentos/${doc.id}`
  const title = doc.title

  switch (doc.type) {
    case 'Article': {
      const parts = [`${authorStr} (${year || 's.f.'}).`]
      parts.push(`${title}.`)
      if (doc.collectionName) parts.push(`*${doc.collectionName}*.`)
      parts.push(`${doc.institution || 'IUPA'}.`)
      parts.push(`${url}`)
      return parts.join(' ')
    }
    case 'Thesis': {
      const parts = [`${authorStr} (${year || 's.f.'}).`]
      parts.push(`*${title}*`)
      parts.push(`[Tesis de ${doc.degreeProgram || 'grado'}, ${doc.institution || 'IUPA'}].`)
      parts.push(url)
      return parts.join(' ')
    }
    case 'Book': {
      const parts = [`${authorStr} (${year || 's.f.'}).`]
      parts.push(`*${title}*.`)
      parts.push(`${doc.institution || 'IUPA'}.`)
      parts.push(url)
      return parts.join(' ')
    }
    default: {
      const parts = [`${authorStr} (${year || 's.f.'}).`]
      parts.push(`*${title}*.`)
      if (doc.institution) parts.push(`${doc.institution}.`)
      parts.push(url)
      return parts.join(' ')
    }
  }
}

export type CitationFormat = 'bibtex' | 'apa'

export function generateCitation(doc: Document, format: CitationFormat): string {
  return format === 'bibtex' ? generateBibtex(doc) : generateApa(doc)
}
