/**
 * Hooks for study session and leaf review event persistence.
 *
 * Delta G: wires LeafStudyCard check-yourself interactions to the backend
 * without blocking the UI. Events are non-critical; errors are silent.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { studyApi } from '@/lib/api/study'
import type { CreateLeafReviewEventRequest } from '@/lib/types/api'

/** Query keys for study/review persistence */
export const STUDY_KEYS = {
  all: ['study'] as const,
  session: (notebookId: string) => ['study', 'session', notebookId] as const,
  reviewQueue: (notebookId?: string) => ['study', 'review-queue', notebookId] as const,
}

/**
 * Get or create an active study session for a notebook.
 *
 * Uses React Query caching so that all LeafStudyCard instances for the same
 * notebook share one session. The backend POST /api/study/sessions is
 * idempotent (returns existing active session if one exists).
 */
export function useStudySession(notebookId: string | undefined) {
  return useQuery({
    queryKey: STUDY_KEYS.session(notebookId ?? ''),
    queryFn: () => studyApi.createSession({ notebook_id: notebookId! }),
    enabled: !!notebookId,
    staleTime: Infinity,     // session stays active; no re-fetch
    gcTime: 30 * 60 * 1000, // keep in cache for 30 min after last mount
    retry: 2,
    // Silent error — session creation is non-critical
  })
}

/**
 * Log a leaf review event.
 *
 * Returns a mutation that posts to POST /api/study/leaf-events.
 * On success, invalidates the review queue cache.
 * On error, logs to console only — the UI already updates locally.
 */
export function useLogReviewEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeafReviewEventRequest) => studyApi.createEvent(data),
    onSuccess: () => {
      // Invalidate review queue so Delta H sees fresh data
      queryClient.invalidateQueries({ queryKey: STUDY_KEYS.all })
    },
    onError: (error: unknown) => {
      // Non-critical — local state already reflected the action
      console.warn('[study] Failed to persist review event:', error)
    },
  })
}
