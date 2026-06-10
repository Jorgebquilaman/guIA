import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse, User, SearchResult, StatsOverview, DocumentStatus, AiSettings, DocumentTypeDef, Department, SiteConfig, SmtpConfig } from '../types'

export function useUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<User[]>>('/admin/users')
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch users')
      }
      return res.data.data
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { email: string; fullName: string; password: string; role: User['role'] }) => {
      const res = await apiClient.post<ApiResponse<User>>('/admin/users', data)
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to create user')
      }
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; email?: string; fullName?: string; role?: User['role'] }) => {
      const res = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, data)
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to update user')
      }
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<ApiResponse<null>>(`/admin/users/${id}/deactivate`)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Failed to deactivate user')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useAdminDocuments(status?: DocumentStatus, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['admin', 'documents', { status, page, pageSize }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, pageSize }
      if (status) params.status = status
      const res = await apiClient.get<ApiResponse<SearchResult>>('/admin/documents', { params })
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch admin documents')
      }
      return res.data.data
    },
  })
}

export function useAiSettings() {
  return useQuery({
    queryKey: ['admin', 'ai-settings'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AiSettings>>('/admin/ai-settings')
      return res.data.data
    },
  })
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { apiUrl: string; apiKey: string; model: string; maxTokens: number }) => {
      const res = await apiClient.put<ApiResponse<AiSettings>>('/admin/ai-settings', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-settings'] })
    },
  })
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['admin', 'document-types'],
    queryFn: async () => {
      const res = await apiClient.get<DocumentTypeDef[]>('/document-types')
      return res.data
    },
  })
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; label: string; sortOrder: number }) => {
      const res = await apiClient.post<DocumentTypeDef>('/document-types', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'document-types'] })
    },
  })
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; label: string; sortOrder: number }) => {
      const res = await apiClient.put<DocumentTypeDef>(`/document-types/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'document-types'] })
    },
  })
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/document-types/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'document-types'] })
    },
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<Department[]>('/departments')
      return res.data
    },
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; color?: string; degreePrograms?: string[] }) => {
      const res = await apiClient.post<Department>('/departments', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; color?: string; degreePrograms?: string[] }) => {
      const res = await apiClient.put<Department>(`/departments/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
    },
  })
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/departments/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
    },
  })
}

export function useAddDegreeProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ departmentId, name }: { departmentId: string; name: string }) => {
      const res = await apiClient.post<Department>(`/departments/${departmentId}/degree-programs`, { name })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
    },
  })
}

export function useRemoveDegreeProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ departmentId, programId }: { departmentId: string; programId: string }) => {
      await apiClient.delete(`/departments/${departmentId}/degree-programs/${programId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] })
    },
  })
}

export function useSiteConfig() {
  return useQuery({
    queryKey: ['admin', 'site-config'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SiteConfig>>('/admin/site-config')
      return res.data.data
    },
  })
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { showMessage: boolean; messageText: string }) => {
      const res = await apiClient.put<ApiResponse<SiteConfig>>('/admin/site-config', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-config'] })
    },
  })
}

export function useSmtpConfig() {
  return useQuery({
    queryKey: ['admin', 'smtp-config'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SmtpConfig>>('/admin/smtp-config')
      return res.data.data
    },
  })
}

export function useUpdateSmtpConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { host: string; port: number; username: string; password: string; fromEmail: string; fromName: string; useSsl: boolean }) => {
      const res = await apiClient.put<ApiResponse<SmtpConfig>>('/admin/smtp-config', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'smtp-config'] })
    },
  })
}

export function usePendingUsers() {
  return useQuery({
    queryKey: ['admin', 'users', 'pending'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<User[]>>('/admin/users/pending')
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch pending users')
      }
      return res.data.data
    },
  })
}

export function useApproveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<ApiResponse<null>>(`/admin/users/${id}/approve`)
      if (!res.data.success) {
        throw new Error(res.data.error?.message ?? 'Failed to approve user')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StatsOverview>>('/admin/stats/overview')
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch stats')
      }
      return res.data.data
    },
  })
}
