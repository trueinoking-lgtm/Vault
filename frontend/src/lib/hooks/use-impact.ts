/**
 * Impact Intelligence — React Hooks
 *
 * TanStack Query hooks for the Impact Intelligence module.
 * Falls back to seeded demo data when the API backend is unavailable.
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
  impactDashboardsApi,
  impactReportsApi,
} from '@/lib/api/impact'
import type {
  ImpactSchoolCreate,
  ImpactSchoolUpdate,
  ImpactSchoolListResponse,
  ImpactClassGroupCreate,
  ImpactClassGroupUpdate,
  ImpactClassGroupListResponse,
  ImpactLearnerCreate,
  ImpactLearnerUpdate,
  ImpactLearnerListResponse,
  ImpactSubjectCreate,
  ImpactSubjectUpdate,
  ImpactSubjectListResponse,
  ImpactTopicCreate,
  ImpactTopicUpdate,
  ImpactTopicListResponse,
  ImpactAssessmentCreate,
  ImpactAssessmentUpdate,
  ImpactAssessmentListResponse,
  ImpactAssessmentQuestionCreate,
  ImpactAssessmentQuestionUpdate,
  ImpactMarkEntryCreate,
  ImpactMarkEntryUpdate,
  ImpactInterventionCreate,
  ImpactInterventionUpdate,
  ImpactInterventionListResponse,
  SchoolDashboard,
} from '@/lib/types/impact'
import {
  SEEDED_SCHOOLS,
  SEEDED_CLASSES,
  SEEDED_LEARNERS,
  SEEDED_SUBJECTS,
  SEEDED_TOPICS,
  SEEDED_ASSESSMENTS,
  SEEDED_INTERVENTIONS,
  getSeededQuestions,
  getSeededSchoolDashboard,
  getSeededAssessmentAnalytics,
  getSeededAssessment,
  getSeededAssessmentReport,
  getSeededClassGroup,
  getSeededSchool,
  getSeededSchoolReport,
  SEEDED_MINISTRY_DASHBOARD,
} from '@/lib/impact/demo-data'

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
// Fallback helper
// =========================================================================

/**
 * Wraps a query function to fall back to seeded demo data.
 *
 * Falls back in TWO cases (pre-pilot / public-demo contract):
 *   1. The API call throws (backend unreachable, network error).
 *   2. The API call SUCCEEDS but returns an empty list/dashboard
 *      (a live backend with no seeded Impact data yet, e.g.
 *      `200 { schools: [], total: 0 }`).
 *
 * The `isEmpty` predicate declares what "empty" means for each shape.
 * Without it, only thrown errors trigger the fallback — which left the
 * public demo showing "No schools yet" against a healthy-but-empty
 * backend.
 */
export function withFallback<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  isEmpty?: (data: T) => boolean,
): () => Promise<T> {
  return async () => {
    try {
      const data = await queryFn()
      if (isEmpty && isEmpty(data)) return fallback
      return data
    } catch {
      return fallback
    }
  }
}

// Empty predicates for each list/dashboard response shape.
const isEmptySchools = (r: ImpactSchoolListResponse) => !r || r.schools.length === 0
const isEmptyClassGroups = (r: ImpactClassGroupListResponse) => !r || r.class_groups.length === 0
const isEmptyLearners = (r: ImpactLearnerListResponse) => !r || r.learners.length === 0
const isEmptySubjects = (r: ImpactSubjectListResponse) => !r || r.subjects.length === 0
const isEmptyTopics = (r: ImpactTopicListResponse) => !r || r.topics.length === 0
const isEmptyAssessments = (r: ImpactAssessmentListResponse) => !r || r.assessments.length === 0
const isEmptyInterventions = (r: ImpactInterventionListResponse) => !r || r.interventions.length === 0
const isEmptySchoolDashboard = (d: SchoolDashboard | null) =>
  !d || (d.total_classes === 0 && d.total_learners_assessed === 0 && d.recent_interventions.length === 0)

// =========================================================================
// Schools Hooks
// =========================================================================

export function useImpactSchools() {
  return useQuery({
    queryKey: impactKeys.schools(),
    queryFn: withFallback(() => impactSchoolsApi.list(), SEEDED_SCHOOLS, isEmptySchools),
  })
}

export function useImpactSchool(id: string) {
  return useQuery({
    queryKey: impactKeys.school(id),
    queryFn: withFallback(() => impactSchoolsApi.get(id), getSeededSchool(id)!, (data) => !data),
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
    queryFn: withFallback(() => impactClassGroupsApi.list(schoolId), SEEDED_CLASSES, isEmptyClassGroups),
  })
}

export function useImpactClassGroup(id: string) {
  return useQuery({
    queryKey: impactKeys.classGroup(id),
    queryFn: withFallback(() => impactClassGroupsApi.get(id), getSeededClassGroup(id)!, (data) => !data),
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
    queryFn: withFallback(
      () => impactLearnersApi.list(classGroupId),
      classGroupId
        ? {
            total: SEEDED_LEARNERS.learners.filter((l) => l.class_group_id === classGroupId).length,
            learners: SEEDED_LEARNERS.learners.filter((l) => l.class_group_id === classGroupId),
          }
        : SEEDED_LEARNERS,
      isEmptyLearners,
    ),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
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
    queryFn: withFallback(() => impactSubjectsApi.list(), SEEDED_SUBJECTS, isEmptySubjects),
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
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useUpdateImpactSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ImpactSubjectUpdate }) =>
      impactSubjectsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

export function useDeleteImpactSubject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => impactSubjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
    },
  })
}

// =========================================================================
// Topics Hooks
// =========================================================================

export function useImpactTopics(subjectId?: string) {
  return useQuery({
    queryKey: impactKeys.topics(subjectId),
    queryFn: withFallback(
      () => impactTopicsApi.list(subjectId),
      subjectId
        ? {
            total: SEEDED_TOPICS.topics.filter((t) => t.subject_id === subjectId).length,
            topics: SEEDED_TOPICS.topics.filter((t) => t.subject_id === subjectId),
          }
        : SEEDED_TOPICS,
      isEmptyTopics,
    ),
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
    queryFn: withFallback(() => impactAssessmentsApi.list(params), SEEDED_ASSESSMENTS, isEmptyAssessments),
  })
}

export function useImpactAssessment(id: string) {
  return useQuery({
    queryKey: impactKeys.assessment(id),
    queryFn: withFallback(() => impactAssessmentsApi.get(id), getSeededAssessment(id)!, (data) => !data),
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
    queryFn: withFallback(
      () => impactAssessmentsApi.getAnalytics(id),
      getSeededAssessmentAnalytics(id)!,
      (d) => !d,
    ),
    enabled: !!id,
  })
}

// =========================================================================
// Questions Hooks
// =========================================================================

export function useImpactQuestions(assessmentId: string) {
  return useQuery({
    queryKey: impactKeys.questions(assessmentId),
    queryFn: withFallback(
      () => impactQuestionsApi.list(assessmentId),
      getSeededQuestions(assessmentId),
      (data) => !data || data.questions.length === 0,
    ),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: impactKeys.all })
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
    queryFn: withFallback(() => impactInterventionsApi.list(params), SEEDED_INTERVENTIONS, isEmptyInterventions),
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

// =========================================================================
// Dashboard Hooks
// =========================================================================

export function useSchoolDashboard(schoolId: string) {
  return useQuery({
    queryKey: [...impactKeys.all, 'dashboard', 'school', schoolId],
    queryFn: withFallback(
      () => impactDashboardsApi.getSchoolDashboard(schoolId),
      getSeededSchoolDashboard(schoolId) || {
        school_id: schoolId,
        school_name: 'Pilot School',
        total_classes: 0,
        total_learners: 0,
        total_learners_assessed: 0,
        total_assessments: 0,
        overall_pass_rate: 0,
        pass_rate_by_subject: [],
        pass_rate_by_class: [],
        weakest_topics: [],
        classes_needing_support: [],
        recent_interventions: [],
      },
      isEmptySchoolDashboard,
    ),
    enabled: !!schoolId,
  })
}

export function useMinistryDashboard() {
  return useQuery({
    queryKey: [...impactKeys.all, 'dashboard', 'ministry'],
    queryFn: withFallback(
      () => impactDashboardsApi.getMinistryDashboard(),
      SEEDED_MINISTRY_DASHBOARD,
      (d) => !d || (d.total_schools === 0 && d.total_learners_assessed === 0),
    ),
  })
}

// =========================================================================
// Reports Hooks
// =========================================================================

export function useAssessmentReport(assessmentId: string) {
  return useQuery({
    queryKey: [...impactKeys.all, 'reports', 'assessment', assessmentId],
    queryFn: withFallback(
      () => impactReportsApi.getAssessmentReport(assessmentId),
      getSeededAssessmentReport(assessmentId)!,
      (data) => !data,
    ),
    enabled: !!assessmentId,
  })
}

export function useSchoolReport(schoolId: string) {
  return useQuery({
    queryKey: [...impactKeys.all, 'reports', 'school', schoolId],
    queryFn: withFallback(
      () => impactReportsApi.getSchoolReport(schoolId),
      getSeededSchoolReport(schoolId)!,
      (data) => !data,
    ),
    enabled: !!schoolId,
  })
}
