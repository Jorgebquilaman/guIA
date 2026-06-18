import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type {
  ApiResponse,
  MetadataSchema,
  DocumentMetadataValue,
  MetadataField,
  MetadataFieldOption,
} from '../types'

export function useMetadataSchemas() {
  return useQuery({
    queryKey: ['metadata-schemas'],
    queryFn: async () => {
      const res = await client.get<ApiResponse<MetadataSchema[]>>('/MetadataSchemas')
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch schemas')
      }
      return res.data.data
    },
  })
}

export function useMetadataSchemaByType(documentType: string | null) {
  return useQuery({
    queryKey: ['metadata-schema', documentType],
    queryFn: async () => {
      const res = await client.get<ApiResponse<MetadataSchema>>(`/MetadataSchemas/${documentType}`)
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch schema')
      }
      return res.data.data
    },
    enabled: !!documentType,
    staleTime: 60_000,
  })
}

export function useUpdateMetadataSchema() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; label: string; isActive: boolean; sortOrder: number }) => {
      const res = await client.put(`/MetadataSchemas/${id}`, data)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to update schema')
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] }),
  })
}

export function useCreateMetadataSchema() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { documentTypeName: string; label: string; isActive: boolean; sortOrder: number; cloneFromSchemaId?: string | null }) => {
      const res = await client.post('/MetadataSchemas', data)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to create schema')
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] }),
  })
}

export function useCreateMetadataField(schemaId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<MetadataField>) => {
      const res = await client.post(`/MetadataSchemas/${schemaId}/fields`, data)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to create field')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] })
      queryClient.invalidateQueries({ queryKey: ['metadata-schema'] })
    },
  })
}

export function useUpdateMetadataField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ fieldId, ...data }: { fieldId: string; label: string; isRequired: boolean; obligatoriness: string; sortOrder: number; isHidden: boolean; helpText: string | null }) => {
      const res = await client.put(`/MetadataSchemas/fields/${fieldId}`, data)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to update field')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] })
      queryClient.invalidateQueries({ queryKey: ['metadata-schema'] })
    },
  })
}

export function useDeleteMetadataField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await client.delete(`/MetadataSchemas/fields/${fieldId}`)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to delete field')
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata-schemas'] })
      queryClient.invalidateQueries({ queryKey: ['metadata-schema'] })
    },
  })
}

export function useUpdateFieldOptions(fieldId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (options: { value: string; label: string; isDefault: boolean; sortOrder: number }[]) => {
      const res = await client.put(`/MetadataSchemas/fields/${fieldId}/options`, options)
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to update options')
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metadata-schema'] }),
  })
}

export function useDocumentMetadata(documentId: string | null) {
  return useQuery({
    queryKey: ['document-metadata', documentId],
    queryFn: async () => {
      const res = await client.get<ApiResponse<DocumentMetadataValue[]>>(`/documents/${documentId}/metadata-values`)
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch document metadata')
      }
      return res.data.data
    },
    enabled: !!documentId,
  })
}

export function useSaveDocumentMetadata(documentId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: { fieldId: string; value: string; repeatIndex: number }[]) => {
      const res = await client.put(`/documents/${documentId}/metadata-values`, { values })
      if (!res.data.success) throw new Error(res.data.error?.message ?? 'Failed to save metadata')
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['document-metadata', documentId] }),
  })
}
