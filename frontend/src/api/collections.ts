import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from './client'
import type { Collection } from '../types'

export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data } = await client.get('/collections')
      return data.data ?? data
    },
  })
}

export function useCollection(id: string | undefined) {
  return useQuery<Collection>({
    queryKey: ['collection', id],
    queryFn: async () => {
      const { data } = await client.get(`/collections/${id}`)
      return data.data ?? data
    },
    enabled: !!id,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string; parentCollectionId?: string | null; isPublic?: boolean }) => {
      const { data } = await client.post('/collections', body)
      return data.data ?? data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; name?: string; description?: string; isPublic?: boolean }) => {
      const { data } = await client.put(`/collections/${id}`, body)
      return data.data ?? data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await client.delete(`/collections/${id}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collections'] }),
  })
}
