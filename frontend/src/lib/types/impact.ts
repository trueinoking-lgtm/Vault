/**
 * Impact Intelligence — TypeScript Types
 *
 * Type definitions for the Impact Intelligence module.
 */

// =========================================================================
// Base Types
// =========================================================================

export interface ImpactSchool {
  id: string
  name: string
  district?: string
  province?: string
  school_type?: 'primary' | 'secondary' | 'tertiary'
  active: boolean
  created: string
  updated: string
}

export interface ImpactClassGroup {
  id: string
  school_id: string
  name: string
  grade_level?: string
  academic_year?: string
  teacher_name?: string
  active: boolean
  created: string
  updated: string
}

export interface ImpactLearner {
  id: string
  school_id: string
  class_group_id: string
  learner_code: string
  display_name?: string
  status: 'active' | 'inactive' | 'transferred'
  created: string
  updated: string
}

export interface ImpactSubject {
  id: string
  name: string
  level?: string
  curriculum?: string
  created: string
  updated: string
}

export interface ImpactTopic {
  id: string
  subject_id: string
  name: string
  strand?: string
  syllabus_code?: string
  created: string
  updated: string
}

export interface ImpactAssessment {
  id: string
  school_id: string
  class_group_id: string
  subject_id: string
  title: string
  assessment_type: 'test' | 'exam' | 'quiz' | 'assignment'
  term?: string
  date_written?: string
  total_marks: number
  pass_mark?: number
  status: 'draft' | 'published' | 'graded'
  created: string
  updated: string
}

export interface ImpactAssessmentQuestion {
  id: string
  assessment_id: string
  question_number: number
  label?: string
  max_marks: number
  topic_id?: string
  skill_type: 'knowledge' | 'comprehension' | 'application' | 'analysis'
  difficulty?: 'easy' | 'medium' | 'hard'
  created: string
  updated: string
}

export interface ImpactMarkEntry {
  id: string
  assessment_id: string
  question_id: string
  learner_id: string
  score: number
  max_score: number
  created: string
  updated: string
}

export interface ImpactIntervention {
  id: string
  assessment_id: string
  class_group_id: string
  topic_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  created: string
  updated: string
}

// =========================================================================
// Request Types
// =========================================================================

export interface ImpactSchoolCreate {
  name: string
  district?: string
  province?: string
  school_type?: 'primary' | 'secondary' | 'tertiary'
}

export interface ImpactSchoolUpdate {
  name?: string
  district?: string
  province?: string
  school_type?: 'primary' | 'secondary' | 'tertiary'
  active?: boolean
}

export interface ImpactClassGroupCreate {
  school_id: string
  name: string
  grade_level?: string
  academic_year?: string
  teacher_name?: string
}

export interface ImpactClassGroupUpdate {
  name?: string
  grade_level?: string
  academic_year?: string
  teacher_name?: string
  active?: boolean
}

export interface ImpactLearnerCreate {
  school_id: string
  class_group_id: string
  learner_code: string
  display_name?: string
  status?: 'active' | 'inactive' | 'transferred'
}

export interface ImpactLearnerUpdate {
  display_name?: string
  status?: 'active' | 'inactive' | 'transferred'
}

export interface ImpactSubjectCreate {
  name: string
  level?: string
  curriculum?: string
}

export interface ImpactSubjectUpdate {
  name?: string
  level?: string
  curriculum?: string
}

export interface ImpactTopicCreate {
  subject_id: string
  name: string
  strand?: string
  syllabus_code?: string
}

export interface ImpactTopicUpdate {
  name?: string
  strand?: string
  syllabus_code?: string
}

export interface ImpactAssessmentCreate {
  school_id: string
  class_group_id: string
  subject_id: string
  title: string
  assessment_type: 'test' | 'exam' | 'quiz' | 'assignment'
  term?: string
  date_written?: string
  total_marks: number
  pass_mark?: number
  status?: 'draft' | 'published' | 'graded'
}

export interface ImpactAssessmentUpdate {
  title?: string
  assessment_type?: 'test' | 'exam' | 'quiz' | 'assignment'
  term?: string
  date_written?: string
  total_marks?: number
  pass_mark?: number
  status?: 'draft' | 'published' | 'graded'
}

export interface ImpactAssessmentQuestionCreate {
  assessment_id: string
  question_number: number
  label?: string
  max_marks: number
  topic_id?: string
  skill_type: 'knowledge' | 'comprehension' | 'application' | 'analysis'
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface ImpactAssessmentQuestionUpdate {
  question_number?: number
  label?: string
  max_marks?: number
  topic_id?: string
  skill_type?: 'knowledge' | 'comprehension' | 'application' | 'analysis'
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface ImpactMarkEntryCreate {
  assessment_id: string
  question_id: string
  learner_id: string
  score: number
  max_score: number
}

export interface ImpactMarkEntryUpdate {
  score?: number
}

export interface ImpactInterventionCreate {
  assessment_id: string
  class_group_id: string
  topic_id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
}

export interface ImpactInterventionUpdate {
  severity?: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  status?: 'pending' | 'in_progress' | 'completed' | 'dismissed'
}

// =========================================================================
// Response Types
// =========================================================================

export interface ImpactSchoolListResponse {
  schools: ImpactSchool[]
  total: number
}

export interface ImpactClassGroupListResponse {
  class_groups: ImpactClassGroup[]
  total: number
}

export interface ImpactLearnerListResponse {
  learners: ImpactLearner[]
  total: number
}

export interface ImpactSubjectListResponse {
  subjects: ImpactSubject[]
  total: number
}

export interface ImpactTopicListResponse {
  topics: ImpactTopic[]
  total: number
}

export interface ImpactAssessmentListResponse {
  assessments: ImpactAssessment[]
  total: number
}

export interface ImpactAssessmentQuestionListResponse {
  questions: ImpactAssessmentQuestion[]
  total: number
}

export interface ImpactMarkEntryListResponse {
  mark_entries: ImpactMarkEntry[]
  total: number
}

export interface ImpactInterventionListResponse {
  interventions: ImpactIntervention[]
  total: number
}

// =========================================================================
// Analytics Types
// =========================================================================

export interface QuestionPerformance {
  question_id: string
  question_number: number
  label?: string
  max_marks: number
  topic_id?: string
  skill_type: string
  difficulty?: string
  total_score: number
  num_learners: number
  average_score: number
  average_percentage: number
  is_critical: boolean
}

export interface TopicPerformance {
  topic_id: string
  topic_name: string
  total_score: number
  total_max_marks: number
  percentage: number
  num_questions: number
  num_learners: number
  is_weak: boolean
  is_critical: boolean
}

export interface LearnerPerformance {
  learner_id: string
  learner_code: string
  display_name?: string
  total_score: number
  total_max_marks: number
  percentage: number
  passed: boolean
  risk_level: 'low' | 'medium' | 'high'
  questions_answered: number
  total_questions: number
}

export interface InterventionRecommendation {
  intervention_type: 'critical' | 'weak' | 'stable'
  entity_type: 'topic' | 'learner'
  entity_id: string
  entity_name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation: string
  percentage: number
}

export interface AssessmentAnalytics {
  assessment_id: string
  assessment_title: string
  assessment_type: string
  total_marks: number
  pass_mark?: number
  term?: string

  // Summary statistics
  total_learners: number
  learners_assessed: number
  mark_completion_rate: number
  class_average_percentage: number
  pass_rate: number
  failure_rate: number

  // Detailed performance
  question_performance: QuestionPerformance[]
  topic_performance: TopicPerformance[]
  learner_performance: LearnerPerformance[]

  // Weaknesses and interventions
  weak_topics: TopicPerformance[]
  at_risk_learners: LearnerPerformance[]
  interventions: InterventionRecommendation[]
}

// =========================================================================
// Dashboard Types
// =========================================================================

export interface SchoolDashboard {
  school_id: string
  school_name: string
  total_classes: number
  total_learners: number
  total_learners_assessed: number
  total_assessments: number
  overall_pass_rate: number
  pass_rate_by_subject: SubjectPassRate[]
  pass_rate_by_class: ClassPassRate[]
  weakest_topics: WeakTopic[]
  classes_needing_support: ClassNeedingSupport[]
  recent_interventions: RecentIntervention[]
}

export interface SubjectPassRate {
  subject_id: string
  subject_name: string
  total_learners: number
  pass_rate: number
}

export interface ClassPassRate {
  class_id: string
  class_name: string
  total_learners: number
  pass_rate: number
}

export interface WeakTopic {
  topic_id: string
  topic_name: string
  percentage: number
  is_critical: boolean
  num_questions: number
}

export interface ClassNeedingSupport {
  class_id: string
  class_name: string
  pass_rate: number
  total_learners: number
}

export interface RecentIntervention {
  id: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed'
  created: string
}

export interface MinistryDashboard {
  total_schools: number
  total_learners: number
  total_learners_assessed: number
  total_assessments: number
  average_pass_rate: number
  weak_topics_by_subject: SubjectWeakTopics[]
  schools_needing_support: SchoolNeedingSupport[]
  classes_needing_support: ClassNeedingSupportMinistry[]
}

export interface SubjectWeakTopics {
  subject_id: string
  subject_name: string
  weak_topics: WeakTopicMinistry[]
}

export interface WeakTopicMinistry {
  topic_name: string
  percentage: number
  is_critical: boolean
}

export interface SchoolNeedingSupport {
  school_id: string
  school_name: string
  pass_rate: number
  total_assessments: number
}

export interface ClassNeedingSupportMinistry {
  class_id: string
  class_name: string
  school_id: string
  pass_rate: number
  total_learners: number
}

// =========================================================================
// Report Types
// =========================================================================

export interface AssessmentReport {
  assessment: ImpactAssessment
  questions: ImpactAssessmentQuestion[]
  learners: ImpactLearner[]
  analytics: AssessmentAnalytics
  school?: ImpactSchool
  class_group?: ImpactClassGroup
  subject?: ImpactSubject
}

export interface SchoolReport {
  school: ImpactSchool
  classes: ImpactClassGroup[]
  assessments: ImpactAssessment[]
  pass_rate_by_class: ClassPassRate[]
  recent_interventions: RecentIntervention[]
  total_learners: number
  total_learners_assessed: number
  overall_pass_rate: number
  subjects: ImpactSubject[]
  weak_topics: WeakTopic[]
  support_indicators: {
    learners_needing_support: number
    classes_needing_support: number
    open_interventions: number
  }
  data_quality: {
    status: 'ready' | 'review'
    mark_completion_rate: number
    mapped_question_rate: number
  }
  disclosure: string
  limitations: string[]
}

// =========================================================================
// AI Summary Types
// =========================================================================

export interface TeacherSummary {
  summary: string
  revision_sequence: string
  source: 'ai-generated' | 'fallback'
  error?: string
}

export interface InterventionPlan {
  plan: string
  source: 'ai-generated' | 'fallback'
  error?: string
}

export interface RemedialLesson {
  outline: string
  mini_test_idea: string
  source: 'ai-generated' | 'fallback'
  error?: string
}
