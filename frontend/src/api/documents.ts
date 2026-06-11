import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Document, SearchQuery, ApiResponse, Collection, DocumentTypeDef, Department } from '../types'

export function useDocument(id: string | undefined) {
  return useQuery<Document>({
    queryKey: ['document', id],
    queryFn: async () => {
      const { data } = await client.get(`/documents/${id}`)
      return data.data ?? data
    },
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'Processing' ? 3000 : false,
  })
}

export function useSearchDocuments(params: SearchQuery) {
  return useQuery<Document[]>({
    queryKey: ['documents', 'search', params.q ?? '', params.collectionId ?? '', params.type ?? '', params.page ?? 1, params.pageSize ?? 20, params.dateFrom ?? '', params.dateTo ?? ''],
    queryFn: async () => {
      const { data } = await client.get('/search', { params })
      return data.data?.items ?? data.items ?? data.data ?? data
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await client.post('/documents/upload', formData)
      return data.data ?? data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUploadLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: {
      sourceUrl: string
      title: string
      collectionId: string
      isPublic: boolean
      description?: string | null
      degreeProgram?: string | null
      department?: string | null
      advisorName?: string | null
      institution?: string | null
      license?: string | null
    }) => {
      const { data } = await client.post('/documents/upload-link', payload)
      return data.data ?? data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useAiSuggestions(documentId: string) {
  return useQuery<{
    title?: string | null
    description?: string | null
    abstractEs?: string | null
    suggestedKeywords: string[]
    suggestedAuthors: { name: string; email?: string | null; orcid?: string | null; order: number }[]
    suggestedType?: string | null
  }>({
    queryKey: ['document', documentId, 'ai-suggestions'],
    queryFn: async () => {
      const { data } = await client.get(`/documents/${documentId}/ai-suggestions`)
      return data.data ?? data
    },
    enabled: false,
    retry: false,
    staleTime: Infinity,
  })
}

export function useUpdateMetadata(documentId: string) {
  const queryClient = useQueryClient()
  return useMutation<ApiResponse<Document>, Error, Record<string, unknown>>({
    mutationFn: async (body) => {
      const { data } = await client.patch(`/documents/${documentId}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', documentId] })
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDocumentTypes() {
  return useQuery<DocumentTypeDef[]>({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data } = await client.get('/document-types')
      return Array.isArray(data) ? data : data.data ?? data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await client.get('/departments')
      return Array.isArray(data) ? data : data.data ?? data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDocumentBreadcrumb(collectionId: string | undefined) {
  return useQuery<Collection[]>({
    queryKey: ['document', 'breadcrumb', collectionId],
    queryFn: async () => {
      const { data } = await client.get(`/documents/breadcrumb/${collectionId}`)
      return data.data ?? data
    },
    enabled: !!collectionId,
  })
}
