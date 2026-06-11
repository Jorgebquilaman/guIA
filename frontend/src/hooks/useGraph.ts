import { useQuery } from '@tanstack/react-query'
import client from '../api/client'
import type { GraphData } from '../components/graph/types'

async function fetchGraph(tag?: string, author?: string): Promise<GraphData> {
  const params: Record<string, string> = {}
  if (tag) params.tag = tag
  if (author) params.author = author
  const { data } = await client.get('/graph', { params })
  if (data.success) return data.data
  throw new Error(data.error || 'Error al obtener el grafo')
}

export function useGraph(tag?: string, author?: string) {
  return useQuery({
    queryKey: ['graph', tag, author],
    queryFn: () => fetchGraph(tag, author),
    enabled: !!tag || !!author,
    staleTime: 30_000,
  })
}
