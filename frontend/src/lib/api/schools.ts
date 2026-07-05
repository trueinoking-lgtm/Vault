import apiClient from './client'
import type {
  SchoolResponse,
  SchoolCreate,
  SchoolUpdate,
  SchoolMembershipResponse,
  SchoolMembershipCreate,
  SchoolMembershipUpdate,
  ClassroomResponse,
  ClassroomCreate,
  ClassroomUpdate,
  ClassEnrollmentResponse,
  ClassEnrollmentCreate,
  ClassroomAssignmentResponse,
  ClassroomAssignmentCreate,
} from '@/lib/types/api'

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

  // ── Members ────────────────────────────────────────────────────────────

  listMembers: async (schoolId: string) => {
    const response = await apiClient.get<SchoolMembershipResponse[]>(`/schools/${schoolId}/members`)
    return response.data
  },

  createMember: async (schoolId: string, data: SchoolMembershipCreate) => {
    const response = await apiClient.post<SchoolMembershipResponse>(`/schools/${schoolId}/members`, data)
    return response.data
  },

  updateMember: async (schoolId: string, membershipId: string, data: SchoolMembershipUpdate) => {
    const response = await apiClient.patch<SchoolMembershipResponse>(`/schools/${schoolId}/members/${membershipId}`, data)
    return response.data
  },

  // ── Classrooms ─────────────────────────────────────────────────────────

  listClassrooms: async (schoolId: string) => {
    const response = await apiClient.get<ClassroomResponse[]>(`/schools/${schoolId}/classrooms`)
    return response.data
  },

  createClassroom: async (schoolId: string, data: ClassroomCreate) => {
    const response = await apiClient.post<ClassroomResponse>(`/schools/${schoolId}/classrooms`, data)
    return response.data
  },

  updateClassroom: async (schoolId: string, classroomId: string, data: ClassroomUpdate) => {
    const response = await apiClient.patch<ClassroomResponse>(`/classrooms/${classroomId}`, data)
    return response.data
  },

  // ── Classroom Enrollments ─────────────────────────────────────────────

  listEnrollments: async (classroomId: string) => {
    const response = await apiClient.get<ClassEnrollmentResponse[]>(`/classrooms/${classroomId}/enrollments`)
    return response.data
  },

  createEnrollment: async (classroomId: string, data: ClassEnrollmentCreate) => {
    const response = await apiClient.post<ClassEnrollmentResponse>(`/classrooms/${classroomId}/enrollments`, data)
    return response.data
  },

  deactivateEnrollment: async (classroomId: string, enrollmentId: string) => {
    const response = await apiClient.delete<ClassEnrollmentResponse>(`/classrooms/${classroomId}/enrollments/${enrollmentId}`)
    return response.data
  },

  // ── Classroom Assignments ─────────────────────────────────────────────

  listAssignments: async (classroomId: string) => {
    const response = await apiClient.get<ClassroomAssignmentResponse[]>(`/classrooms/${classroomId}/assignments`)
    return response.data
  },

  createAssignment: async (classroomId: string, data: ClassroomAssignmentCreate) => {
    const response = await apiClient.post<ClassroomAssignmentResponse>(`/classrooms/${classroomId}/assignments`, data)
    return response.data
  },

  deactivateAssignment: async (classroomId: string, assignmentId: string) => {
    const response = await apiClient.delete<ClassroomAssignmentResponse>(`/classrooms/${classroomId}/assignments/${assignmentId}`)
    return response.data
  },
}
