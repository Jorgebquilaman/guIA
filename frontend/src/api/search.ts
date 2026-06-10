import { useQuery } from '@tanstack/react-query'
import apiClient from './client'
import type { ApiResponse } from '../types'

export function useKeywordSuggestions(query: string) {
  return useQuery({
    queryKey: ['search', 'keywords', query],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<string[]>>('/search/keywords', {
        params: { q: query },
      })
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.error?.message ?? 'Failed to fetch keyword suggestions')
      }
      return res.data.data
    },
    enabled: query.length > 0,
  })
}
