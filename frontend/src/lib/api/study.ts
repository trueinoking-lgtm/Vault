import { apiClient } from '@/lib/api/client'
import type {
  CreateStudySessionRequest,
  StudySessionResponse,
  UpdateStudySessionRequest,
  CreateLeafReviewEventRequest,
  LeafReviewEventResponse,
  ReviewQueueResponse,
} from '@/lib/types/api'

export const studyApi = {
  /** Start or resume a study session for a notebook */
  createSession: async (data: CreateStudySessionRequest) => {
    const response = await apiClient.post<StudySessionResponse>('/study/sessions', data)
    return response.data
  },

  /** Update a study session (close it with completed/abandoned) */
  updateSession: async (id: string, data: UpdateStudySessionRequest) => {
    const response = await apiClient.patch<StudySessionResponse>(`/study/sessions/${id}`, data)
    return response.data
  },

  /** Log a leaf review event */
  createEvent: async (data: CreateLeafReviewEventRequest) => {
    const response = await apiClient.post<LeafReviewEventResponse>('/study/leaf-events', data)
    return response.data
  },

  /** Get the review queue for a notebook */
  getReviewQueue: async (params: {
    notebook_id?: string
    limit?: number
    needs_review_only?: boolean
  }) => {
    const response = await apiClient.get<ReviewQueueResponse>('/study/review-queue', { params })
    return response.data
  },

  /** List study sessions */
  listSessions: async (params?: {
    notebook_id?: string
    limit?: number
    status?: string
  }) => {
    const response = await apiClient.get<{ items: StudySessionResponse[]; total: number }>(
      '/study/sessions',
      { params },
    )
    return response.data
  },
}
