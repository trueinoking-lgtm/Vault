import apiClient from './client'
import type {
  TeacherClassSummary,
  ClassProgressSummary,
  LearnerProgressSummary,
  ClassActivityEntry,
} from '@/lib/types/api'

export const teacherApi = {
  listClasses: async () => {
    const response = await apiClient.get<TeacherClassSummary[]>('/teacher/classes')
    return response.data
  },

  getClassProgress: async (classroomId: string) => {
    const response = await apiClient.get<ClassProgressSummary>(`/teacher/classes/${classroomId}`)
    return response.data
  },

  listLearners: async (classroomId: string) => {
    const response = await apiClient.get<LearnerProgressSummary[]>(`/teacher/classes/${classroomId}/learners`)
    return response.data
  },

  listActivity: async (classroomId: string, limit?: number) => {
    const params = limit ? `?limit=${limit}` : ''
    const response = await apiClient.get<ClassActivityEntry[]>(`/teacher/classes/${classroomId}/activity${params}`)
    return response.data
  },
}
