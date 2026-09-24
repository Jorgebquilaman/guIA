import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from './client'
import type { AccessCategory } from '../types'

interface UpsertAccessCategory {
  name: string
  description: string
  sortOrder: number
  isActive: boolean
}

export function useActiveAccessCategories() {
  return useQuery({
    queryKey: ['access-categories', 'active'],
    queryFn: async () => {
      const res = await apiClient.get<AccessCategory[]>('/access-categories/active')
      return res.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useAccessCategories() {
  return useQuery({
    queryKey: ['access-categories'],
    queryFn: async () => {
      const res = await apiClient.get<AccessCategory[]>('/access-categories')
      return res.data ?? []
    },
  })
}

export function useCreateAccessCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: UpsertAccessCategory) => {
      const res = await apiClient.post<AccessCategory>('/access-categories', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-categories'] })
      queryClient.invalidateQueries({ queryKey: ['access-categories', 'active'] })
    },
  })
}

export function useUpdateAccessCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpsertAccessCategory) => {
      const res = await apiClient.put<AccessCategory>(`/access-categories/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-categories'] })
      queryClient.invalidateQueries({ queryKey: ['access-categories', 'active'] })
    },
  })
}

export function useDeleteAccessCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/access-categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-categories'] })
      queryClient.invalidateQueries({ queryKey: ['access-categories', 'active'] })
    },
  })
}
