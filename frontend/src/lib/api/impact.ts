/**
 * Impact Intelligence — API Client
 *
 * API functions for the Impact Intelligence module.
 */

import apiClient from './client'
import type {
  ImpactSchool,
  ImpactSchoolCreate,
  ImpactSchoolUpdate,
  ImpactSchoolListResponse,
  ImpactClassGroup,
  ImpactClassGroupCreate,
  ImpactClassGroupUpdate,
  ImpactClassGroupListResponse,
  ImpactLearner,
  ImpactLearnerCreate,
  ImpactLearnerUpdate,
  ImpactLearnerListResponse,
  ImpactSubject,
  ImpactSubjectCreate,
  ImpactSubjectUpdate,
  ImpactSubjectListResponse,
  ImpactTopic,
  ImpactTopicCreate,
  ImpactTopicUpdate,
  ImpactTopicListResponse,
  ImpactAssessment,
  ImpactAssessmentCreate,
  ImpactAssessmentUpdate,
  ImpactAssessmentListResponse,
  ImpactAssessmentQuestion,
  ImpactAssessmentQuestionCreate,
  ImpactAssessmentQuestionUpdate,
  ImpactAssessmentQuestionListResponse,
  ImpactMarkEntry,
  ImpactMarkEntryCreate,
  ImpactMarkEntryUpdate,
  ImpactMarkEntryListResponse,
  ImpactIntervention,
  ImpactInterventionCreate,
  ImpactInterventionUpdate,
  ImpactInterventionListResponse,
  AssessmentAnalytics,
} from '@/lib/types/impact'

// =========================================================================
// Schools API
// =========================================================================

export const impactSchoolsApi = {
  list: async () => {
    const response = await apiClient.get<ImpactSchoolListResponse>('/impact/schools')
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactSchool>(`/impact/schools/${id}`)
    return response.data
  },

  create: async (data: ImpactSchoolCreate) => {
    const response = await apiClient.post<ImpactSchool>('/impact/schools', data)
    return response.data
  },

  update: async (id: string, data: ImpactSchoolUpdate) => {
    const response = await apiClient.put<ImpactSchool>(`/impact/schools/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/schools/${id}`)
    return response.data
  },
}

// =========================================================================
// Class Groups API
// =========================================================================

export const impactClassGroupsApi = {
  list: async (schoolId?: string) => {
    const params = schoolId ? { school_id: schoolId } : {}
    const response = await apiClient.get<ImpactClassGroupListResponse>('/impact/classes', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactClassGroup>(`/impact/classes/${id}`)
    return response.data
  },

  create: async (data: ImpactClassGroupCreate) => {
    const response = await apiClient.post<ImpactClassGroup>('/impact/classes', data)
    return response.data
  },

  update: async (id: string, data: ImpactClassGroupUpdate) => {
    const response = await apiClient.put<ImpactClassGroup>(`/impact/classes/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/classes/${id}`)
    return response.data
  },
}

// =========================================================================
// Learners API
// =========================================================================

export const impactLearnersApi = {
  list: async (classGroupId?: string) => {
    const params = classGroupId ? { class_group_id: classGroupId } : {}
    const response = await apiClient.get<ImpactLearnerListResponse>('/impact/learners', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactLearner>(`/impact/learners/${id}`)
    return response.data
  },

  create: async (data: ImpactLearnerCreate) => {
    const response = await apiClient.post<ImpactLearner>('/impact/learners', data)
    return response.data
  },

  update: async (id: string, data: ImpactLearnerUpdate) => {
    const response = await apiClient.put<ImpactLearner>(`/impact/learners/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/learners/${id}`)
    return response.data
  },
}

// =========================================================================
// Subjects API
// =========================================================================

export const impactSubjectsApi = {
  list: async () => {
    const response = await apiClient.get<ImpactSubjectListResponse>('/impact/subjects')
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactSubject>(`/impact/subjects/${id}`)
    return response.data
  },

  create: async (data: ImpactSubjectCreate) => {
    const response = await apiClient.post<ImpactSubject>('/impact/subjects', data)
    return response.data
  },

  update: async (id: string, data: ImpactSubjectUpdate) => {
    const response = await apiClient.put<ImpactSubject>(`/impact/subjects/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/subjects/${id}`)
    return response.data
  },
}

// =========================================================================
// Topics API
// =========================================================================

export const impactTopicsApi = {
  list: async (subjectId?: string) => {
    const params = subjectId ? { subject_id: subjectId } : {}
    const response = await apiClient.get<ImpactTopicListResponse>('/impact/topics', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactTopic>(`/impact/topics/${id}`)
    return response.data
  },

  create: async (data: ImpactTopicCreate) => {
    const response = await apiClient.post<ImpactTopic>('/impact/topics', data)
    return response.data
  },

  update: async (id: string, data: ImpactTopicUpdate) => {
    const response = await apiClient.put<ImpactTopic>(`/impact/topics/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/topics/${id}`)
    return response.data
  },
}

// =========================================================================
// Assessments API
// =========================================================================

export const impactAssessmentsApi = {
  list: async (params?: { class_group_id?: string; subject_id?: string }) => {
    const response = await apiClient.get<ImpactAssessmentListResponse>('/impact/assessments', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactAssessment>(`/impact/assessments/${id}`)
    return response.data
  },

  create: async (data: ImpactAssessmentCreate) => {
    const response = await apiClient.post<ImpactAssessment>('/impact/assessments', data)
    return response.data
  },

  update: async (id: string, data: ImpactAssessmentUpdate) => {
    const response = await apiClient.put<ImpactAssessment>(`/impact/assessments/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/assessments/${id}`)
    return response.data
  },

  getAnalytics: async (id: string) => {
    const response = await apiClient.get<AssessmentAnalytics>(`/impact/assessments/${id}/analytics`)
    return response.data
  },
}

// =========================================================================
// Assessment Questions API
// =========================================================================

export const impactQuestionsApi = {
  list: async (assessmentId: string) => {
    const response = await apiClient.get<ImpactAssessmentQuestionListResponse>(
      `/impact/assessments/${assessmentId}/questions`
    )
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactAssessmentQuestion>(`/impact/questions/${id}`)
    return response.data
  },

  create: async (data: ImpactAssessmentQuestionCreate) => {
    const response = await apiClient.post<ImpactAssessmentQuestion>('/impact/questions', data)
    return response.data
  },

  update: async (id: string, data: ImpactAssessmentQuestionUpdate) => {
    const response = await apiClient.put<ImpactAssessmentQuestion>(`/impact/questions/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/questions/${id}`)
    return response.data
  },
}

// =========================================================================
// Mark Entries API
// =========================================================================

export const impactMarksApi = {
  list: async (params?: { assessment_id?: string; learner_id?: string }) => {
    const response = await apiClient.get<ImpactMarkEntryListResponse>('/impact/mark-entries', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactMarkEntry>(`/impact/mark-entries/${id}`)
    return response.data
  },

  create: async (data: ImpactMarkEntryCreate) => {
    const response = await apiClient.post<ImpactMarkEntry>('/impact/mark-entries', data)
    return response.data
  },

  update: async (id: string, data: ImpactMarkEntryUpdate) => {
    const response = await apiClient.put<ImpactMarkEntry>(`/impact/mark-entries/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/mark-entries/${id}`)
    return response.data
  },
}

// =========================================================================
// Interventions API
// =========================================================================

export const impactInterventionsApi = {
  list: async (params?: { class_group_id?: string; severity?: string }) => {
    const response = await apiClient.get<ImpactInterventionListResponse>('/impact/interventions', { params })
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<ImpactIntervention>(`/impact/interventions/${id}`)
    return response.data
  },

  create: async (data: ImpactInterventionCreate) => {
    const response = await apiClient.post<ImpactIntervention>('/impact/interventions', data)
    return response.data
  },

  update: async (id: string, data: ImpactInterventionUpdate) => {
    const response = await apiClient.put<ImpactIntervention>(`/impact/interventions/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/impact/interventions/${id}`)
    return response.data
  },
}
