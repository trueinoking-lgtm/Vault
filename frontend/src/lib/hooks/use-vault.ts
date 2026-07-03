import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { sourcesApi } from '@/lib/api/sources'
import { notesApi } from '@/lib/api/notes'
import { SourceListResponse, NoteResponse } from '@/lib/types/api'

const VAULT_DEFAULT_LIMIT = 5
const VAULT_STALE_TIME = 30_000 // 30s — dashboard doesn't need real-time freshness

/**
 * Fetch most recently updated Materials across all Libraries.
 * Uses the global sources endpoint with sort_by=updated desc.
 */
export function useRecentSources(limit: number = VAULT_DEFAULT_LIMIT) {
  return useQuery<SourceListResponse[]>({
    queryKey: QUERY_KEYS.vaultRecentSources(limit),
    queryFn: () =>
      sourcesApi.list({
        sort_by: 'updated',
        sort_order: 'desc',
        limit,
      }),
    staleTime: VAULT_STALE_TIME,
  })
}

/**
 * Fetch most recently updated Leaves across all Libraries.
 * The global notes endpoint has no limit param, so we fetch all and slice.
 */
export function useRecentNotes(limit: number = VAULT_DEFAULT_LIMIT) {
  return useQuery<NoteResponse[]>({
    queryKey: QUERY_KEYS.vaultRecentNotes(limit),
    queryFn: async () => {
      const all = await notesApi.list() // no notebook_id = global, ordered by updated desc
      return all.slice(0, limit)
    },
    staleTime: VAULT_STALE_TIME,
  })
}
