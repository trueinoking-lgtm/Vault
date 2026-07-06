/**
 * Impact Intelligence — React Hooks
 *
 * TanStack Query hooks for the Impact Intelligence module.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  impactSchoolsApi,
  impactClassGroupsApi,
  impactLearnersApi,
  impactSubjectsApi,
  impactTopicsApi,
  impactAssessmentsApi,
  impactQuestionsApi,
  impactMarksApi,
  impactInterventionsApi,
} from '@/lib/api/impact'
import type {
  ImpactSchoolCreate,
  ImpactSchoolUpdate,
  ImpactClassGroupCreate,
  ImpactClassGroupUpdate,
  ImpactLearnerCreate,
  ImpactLearnerUpdate,
  ImpactSubjectCreate,
  ImpactSubjectUpdate,
  ImpactTopicCreate,
  ImpactTopicUpdate,
  ImpactAssessmentCreate,
  ImpactAssessmentUpdate,
  ImpactAssessmentQuestionCreate,
  ImpactAssessmentQuestionUpdate,
  ImpactMarkEntryCreate,
  ImpactMarkEntryUpdate,
  ImpactInterventionCreate,
  ImpactInterventionUpdate,
} from '@/lib/types/impact'

// =========================================================================
// Query Keys
// =========================================================================

export const impactKeys = {
  all: ['impact'] as const,
  schools: () => [...impactKeys.all, 'schools'] as const,
  school: (id: string) => [...impactKeys.schools(), id] as const,
  classGroups: (schoolId?: string) => [...impactKeys.all, 'classGroups', { schoolId }] as const,
  classGroup: (id: string) => [...impactKeys.all, 'classGroups', id] as const,
  learners: (classGroupId?: string) => [...impactKeys.all, 'learners', { classGroupId }] as const,
  learner: (id: string) => [...impactKeys.all, 'learners', id] as const,
  subjects: () => [...impactKeys.all, 'subjects'] as const,
  subject: (id: string) => [...impactKeys.subjects(), id] as const,
  topics: (subjectId?: string) => [...impactKeys.all, 'topics', { subjectId }] as const,
  topic: (id: string) => [...impactKeys.all, 'topics', id] as const,
  assessments: (params?: { class_group_id?: string; subject_id?: string }) =>
    [...impactKeys.all, 'assessments', params] as const,
  assessment: (id: string) => [...impactKeys.all, 'assessments', id] as const,
  analytics: (id: string) => [...impactKeys.assessment(id), 'analytics'] as const,
  questions: (assessmentId: string) => [...impactKeys.all, 'questions', { assessmentId }] as const,
  question: (id: string) => [...impactKeys.all, 'questions', id] as const,
  marks: (params?: { assessment_id?: string; learner_id?: string }) =>
    [...impactKeys.all, 'marks', params] as const,
  mark: (id: string) => [...impactKeys.all, 'marks', id] as const,
  interventions: (params?: { class_group_id?: string; severity?: string }) =>
    [...impactKeys.all, 'interventions', params] as const,
  intervention: (id: string) => [...impactKeys.all, 'interventions', id] as const,
}

// =========================================================================
// Schools Hooks
// =========================================================================

export function useImpactSchools() {
  return useQuery({
    queryKey: impactKeys.schools(),
    queryFn: () => impactSchoolsApi.list(),
  })
}

export function useImpactSchool(id: string) {
  return useQuery({
    queryKey: impactKeys.school(id),
    queryFn: () => impactSchoolsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactSchool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactSchoolCreate) => impactSchoolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.schools() })
    },
  })
}

export function useUpdateImpactSchool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactSchoolUpdate }) =>
      impactSchoolsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.schools() })
      queryClient.invalidateQueries({ queryKey: impactKeys.school(id) })
    },
  })
}

export function useDeleteImpactSchool() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactSchoolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.schools() })
    },
  })
}

// =========================================================================
// Class Groups Hooks
// =========================================================================

export function useImpactClassGroups(schoolId?: string) {
  return useQuery({
    queryKey: impactKeys.classGroups(schoolId),
    queryFn: () => impactClassGroupsApi.list(schoolId),
  })
}

export function useImpactClassGroup(id: string) {
  return useQuery({
    queryKey: impactKeys.classGroup(id),
    queryFn: () => impactClassGroupsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactClassGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactClassGroupCreate) => impactClassGroupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactClassGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactClassGroupUpdate }) =>
      impactClassGroupsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.classGroup(id) })
    },
  })
}

export function useDeleteImpactClassGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactClassGroupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Learners Hooks
// =========================================================================

export function useImpactLearners(classGroupId?: string) {
  return useQuery({
    queryKey: impactKeys.learners(classGroupId),
    queryFn: () => impactLearnersApi.list(classGroupId),
  })
}

export function useImpactLearner(id: string) {
  return useQuery({
    queryKey: impactKeys.learner(id),
    queryFn: () => impactLearnersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactLearner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactLearnerCreate) => impactLearnersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactLearner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactLearnerUpdate }) =>
      impactLearnersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.learner(id) })
    },
  })
}

export function useDeleteImpactLearner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactLearnersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Subjects Hooks
// =========================================================================

export function useImpactSubjects() {
  return useQuery({
    queryKey: impactKeys.subjects(),
    queryFn: () => impactSubjectsApi.list(),
  })
}

export function useImpactSubject(id: string) {
  return useQuery({
    queryKey: impactKeys.subject(id),
    queryFn: () => impactSubjectsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactSubjectCreate) => impactSubjectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.subjects() })
    },
  })
}

export function useUpdateImpactSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactSubjectUpdate }) =>
      impactSubjectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.subjects() })
      queryClient.invalidateQueries({ queryKey: impactKeys.subject(id) })
    },
  })
}

export function useDeleteImpactSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactSubjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.subjects() })
    },
  })
}

// =========================================================================
// Topics Hooks
// =========================================================================

export function useImpactTopics(subjectId?: string) {
  return useQuery({
    queryKey: impactKeys.topics(subjectId),
    queryFn: () => impactTopicsApi.list(subjectId),
  })
}

export function useImpactTopic(id: string) {
  return useQuery({
    queryKey: impactKeys.topic(id),
    queryFn: () => impactTopicsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactTopicCreate) => impactTopicsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactTopicUpdate }) =>
      impactTopicsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.topic(id) })
    },
  })
}

export function useDeleteImpactTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactTopicsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Assessments Hooks
// =========================================================================

export function useImpactAssessments(params?: { class_group_id?: string; subject_id?: string }) {
  return useQuery({
    queryKey: impactKeys.assessments(params),
    queryFn: () => impactAssessmentsApi.list(params),
  })
}

export function useImpactAssessment(id: string) {
  return useQuery({
    queryKey: impactKeys.assessment(id),
    queryFn: () => impactAssessmentsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactAssessmentCreate) => impactAssessmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactAssessmentUpdate }) =>
      impactAssessmentsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.assessment(id) })
    },
  })
}

export function useDeleteImpactAssessment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactAssessmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useAssessmentAnalytics(id: string) {
  return useQuery({
    queryKey: impactKeys.analytics(id),
    queryFn: () => impactAssessmentsApi.getAnalytics(id),
    enabled: !!id,
  })
}

// =========================================================================
// Questions Hooks
// =========================================================================

export function useImpactQuestions(assessmentId: string) {
  return useQuery({
    queryKey: impactKeys.questions(assessmentId),
    queryFn: () => impactQuestionsApi.list(assessmentId),
    enabled: !!assessmentId,
  })
}

export function useImpactQuestion(id: string) {
  return useQuery({
    queryKey: impactKeys.question(id),
    queryFn: () => impactQuestionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactAssessmentQuestionCreate) => impactQuestionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactAssessmentQuestionUpdate }) =>
      impactQuestionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.question(id) })
    },
  })
}

export function useDeleteImpactQuestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactQuestionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Mark Entries Hooks
// =========================================================================

export function useImpactMarks(params?: { assessment_id?: string; learner_id?: string }) {
  return useQuery({
    queryKey: impactKeys.marks(params),
    queryFn: () => impactMarksApi.list(params),
  })
}

export function useImpactMark(id: string) {
  return useQuery({
    queryKey: impactKeys.mark(id),
    queryFn: () => impactMarksApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactMark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactMarkEntryCreate) => impactMarksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactMark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactMarkEntryUpdate }) =>
      impactMarksApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.mark(id) })
    },
  })
}

export function useDeleteImpactMark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactMarksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Interventions Hooks
// =========================================================================

export function useImpactInterventions(params?: { class_group_id?: string; severity?: string }) {
  return useQuery({
    queryKey: impactKeys.interventions(params),
    queryFn: () => impactInterventionsApi.list(params),
  })
}

export function useImpactIntervention(id: string) {
  return useQuery({
    queryKey: impactKeys.intervention(id),
    queryFn: () => impactInterventionsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateImpactIntervention() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ImpactInterventionCreate) => impactInterventionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactIntervention() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactInterventionUpdate }) =>
      impactInterventionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
      queryClient.invalidateQueries({ queryKey: impactKeys.intervention(id) })
    },
  })
}

export function useDeleteImpactIntervention() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactInterventionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}
