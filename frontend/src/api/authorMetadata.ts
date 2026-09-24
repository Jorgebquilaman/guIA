import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse } from '../types'

export interface AuthorFieldOption {
  id?: string
  value: string
  label: string
  isDefault: boolean
  sortOrder: number
}

export interface AuthorField {
  id: string
  accessCategoryId?: string
  categoryName?: string | null
  internalName: string
  label: string
  fieldType: 'Text' | 'Textarea' | 'Date' | 'Select' | 'MultiText'
  obligatoriness: 'Mandatory' | 'ConditionallyMandatory' | 'Recommended' | 'Optional' | 'NotApplicable'
  isRepeatable: boolean
  isHidden: boolean
  sortOrder: number
  helpText: string | null
  options: AuthorFieldOption[]
}

export interface MyAuthorProfile {
  categoryId: string | null
  categoryName: string | null
  authorizesPublication: boolean
  dataConsentAt: string | null
  consentText: string
  fields: (AuthorField & { values: string[] })[]
}

export interface AuthorMetadataInput {
  fieldId: string
  value: string
  repeatIndex: number
}

export function useAuthorFieldsForCategory(categoryId: string | null | undefined) {
  return useQuery({
    queryKey: ['author-metadata', 'category', categoryId],
    queryFn: async () => {
      if (!categoryId) return []
      const res = await apiClient.get<AuthorField[]>(`/author-metadata/categories/${categoryId}/fields`)
      return res.data ?? []
    },
    enabled: !!categoryId,
  })
}

export function useConsentSettings() {
  return useQuery({
    queryKey: ['author-metadata', 'settings'],
    queryFn: async () => {
      const res = await apiClient.get<{ consentText: string }>('/author-metadata/settings')
      return res.data
    },
  })
}

export function useUpdateConsentSettings() {
  return useMutation({
    mutationFn: async (consentText: string) => {
      await apiClient.put('/author-metadata/settings', { consentText })
    },
  })
}

export function useAuthorFields() {
  return useQuery({
    queryKey: ['author-metadata', 'fields'],
    queryFn: async () => {
      const res = await apiClient.get<AuthorField[]>('/author-metadata/fields')
      return res.data ?? []
    },
  })
}

export interface UpsertAuthorField {
  internalName: string
  label: string
  fieldType: AuthorField['fieldType']
  obligatoriness: AuthorField['obligatoriness']
  isRepeatable: boolean
  isHidden: boolean
  sortOrder: number
  helpText: string
  optionsPipe?: string
}

export function useCreateAuthorField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ categoryId, ...data }: UpsertAuthorField & { categoryId: string }) => {
      const res = await apiClient.post(`/author-metadata/${categoryId}/fields`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}

export function useUpdateAuthorField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: UpsertAuthorField & { id: string; isRequired: boolean }) => {
      const res = await apiClient.put(`/author-metadata/fields/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}

export function useDeleteAuthorField() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/author-metadata/fields/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}

export function useUpdateAuthorFieldOptions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, options }: { id: string; options: AuthorFieldOption[] }) => {
      await apiClient.put(`/author-metadata/fields/${id}/options`, { options })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}

export function useMyAuthorMetadata() {
  return useQuery({
    queryKey: ['author-metadata', 'my-profile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<MyAuthorProfile>>('/auth/my-author-metadata')
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to load profile')
      }
      return res.data.data
    },
  })
}

export function useUpdateMyAuthorMetadata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { values: AuthorMetadataInput[]; authorizesPublication?: boolean }) => {
      const res = await apiClient.put<ApiResponse<null>>('/auth/my-author-metadata', data)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Failed to save profile')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}

export function useUserAuthorMetadata(userId: string | null) {
  return useQuery({
    queryKey: ['author-metadata', 'user', userId],
    queryFn: async () => {
      if (!userId) return null
      const res = await apiClient.get<{
        userId: string
        fullName: string
        email: string | null
        categoryName: string | null
        authorizesPublication: boolean
        dataConsentAt: string | null
        dataConsentText: string | null
        fields: (AuthorField & { values: string[] })[]
      }>(`/author-metadata/users/${userId}/values`)
      return res.data
    },
    enabled: !!userId,
  })
}

export function useUpdateUserAuthorMetadata() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, values }: { userId: string; values: AuthorMetadataInput[] }) => {
      const res = await apiClient.put<ApiResponse<null>>(`/author-metadata/users/${userId}/values`, { values })
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Failed to save')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['author-metadata'] })
    },
  })
}
