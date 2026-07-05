import apiClient from './client'
import type { SchoolResponse, SchoolCreate, SchoolUpdate } from '@/lib/types/api'

export const schoolsApi = {
  list: async () => {
    const response = await apiClient.get<SchoolResponse[]>('/schools')
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<SchoolResponse>(`/schools/${id}`)
    return response.data
  },

  create: async (data: SchoolCreate) => {
    const response = await apiClient.post<SchoolResponse>('/schools', data)
    return response.data
  },

  update: async (id: string, data: SchoolUpdate) => {
    const response = await apiClient.patch<SchoolResponse>(`/schools/${id}`, data)
    return response.data
  },
}
