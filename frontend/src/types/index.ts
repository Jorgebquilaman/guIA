export interface User {
  id: string
  email: string
  fullName: string
  role: 'Admin' | 'Editor' | 'Viewer'
  isActive: boolean
  createdAt: string
}

export interface Collection {
  id: string
  name: string
  description: string
  parentCollectionId: string | null
  parentCollection?: Collection
  subCollections: Collection[]
  documentCount: number
  isPublic: boolean
  createdAt: string
}

export interface AiMetadata {
  summary: string
  extendedAbstract: string
  suggestedKeywords: string[]
  suggestedType: DocumentType
  suggestedCollection: string
  language: string
  processingStatus: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  processedAt: string
  errorMessage: string | null
}

export type DocumentType = 'Article' | 'Thesis' | 'Dataset' | 'Software' | 'Link' | 'Other' | 'ConferenceDocument' | 'Book'
export type DocumentStatus = 'Draft' | 'Processing' | 'Published' | 'Rejected'

export interface DocumentFile {
  id: string
  documentId: string
  originalFileName: string
  mimeType: string
  fileSizeBytes: number
  isPrimary: boolean
  uploadedAt: string
  hasThumbnail: boolean
}

export interface DocumentAuthor {
  id: string
  name: string
  email: string | null
  orcid: string | null
  order: number
}

export interface MediaLink {
  url: string
  label: string
  type: string
}

export interface Document {
  id: string
  title: string
  description: string | null
  type: DocumentType
  status: DocumentStatus
  collectionId: string
  collectionName: string
  uploadedByUserId: string
  uploadedByName: string
  uploadedAt: string
  publishedAt: string | null
  isPublic: boolean
  hasCoverImage: boolean
  sourceUrl: string | null
  aiMetadata: AiMetadata | null
  files: DocumentFile[]
  authors: DocumentAuthor[]
  keywords: string[]
  // Dublin Core fields
  advisorName?: string | null
  institution?: string | null
  publicationDate?: string | null
  abstractEs?: string | null
  license?: string | null
  department?: string | null
  degreeProgram?: string | null
  metadataValues?: MetadataValueDisplay[]
  metadataSchemaName?: string | null
  mediaLinks?: MediaLink[]
}

export interface SearchResult {
  query: string
  items: Document[]
  totalCount: number
  page: number
  pageSize: number
  facets: Record<string, number>
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: { code: string; message: string; details: string } | null
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: User
}

export interface PaginatedRequest {
  page?: number
  pageSize?: number
}

export interface SearchQuery {
  q?: string
  keywords?: string[]
  type?: DocumentType
  collectionId?: string
  page?: number
  pageSize?: number
  dateFrom?: string
  dateTo?: string
  publicOnly?: boolean
}

export interface AiSettings {
  id: string
  apiUrl: string
  apiKey: string
  model: string
  maxTokens: number
  isActive: boolean
  systemPrompt: string | null
}

export interface DocumentTypeDef {
  id: string
  name: string
  label: string
  sortOrder: number
  metadataSchemaId: string | null
  metadataSchemaLabel: string | null
}

export interface DegreeProgram {
  id: string
  name: string
  departmentId: string
}

export interface Department {
  id: string
  name: string
  color: string
  icon: string | null
  degreePrograms: DegreeProgram[]
}

export interface SiteConfig {
  id: string
  showMessage: boolean
  messageText: string
}

export interface SmtpConfig {
  id: string
  host: string
  port: number
  username: string
  password: string
  fromEmail: string
  fromName: string
  useSsl: boolean
}

export interface StatsOverview {
  totalDocuments: number
  draftCount: number
  publishedCount: number
  processingCount: number
  rejectedCount: number
  totalUsers: number
  totalCollections: number
  recentUploads: number
}

// Metadata schema types
export interface MetadataFieldOption {
  id: string
  metadataFieldId: string
  value: string
  label: string
  isDefault: boolean
  sortOrder: number
}

export interface MetadataField {
  id: string
  metadataSchemaId: string
  dublinCoreElement: string
  qualifier: string | null
  internalName: string
  label: string
  fieldType: 'Text' | 'Textarea' | 'Date' | 'Select' | 'MultiText'
  isRequired: boolean
  obligatoriness: 'Mandatory' | 'ConditionallyMandatory' | 'Recommended' | 'Optional' | 'NotApplicable'
  isRepeatable: boolean
  isReadOnly: boolean
  isHidden: boolean
  sortOrder: number
  helpText: string | null
  options: MetadataFieldOption[]
}

export interface MetadataSchema {
  id: string
  documentTypeName: string
  label: string
  isActive: boolean
  sortOrder: number
  fields: MetadataField[]
}

export interface DocumentMetadataValue {
  id: string
  documentId: string
  metadataFieldId: string
  value: string
  repeatIndex: number
}

export interface MetadataValueDisplay {
  fieldLabel: string
  fieldInternalName: string
  dublinCoreElement: string
  qualifier?: string | null
  value: string
  repeatIndex: number
}
