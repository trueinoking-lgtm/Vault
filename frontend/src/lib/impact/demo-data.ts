/**
 * HiveMind Intelligence — Seeded Demo Data
 *
 * Consistent frontend demo dataset used across all Impact pages
 * when the API backend is unavailable (pre-pilot state).
 *
 * All data is deterministic, statically typed, and matches the
 * API response shapes from @/lib/types/impact.
 *
 * Once the backend is deployed and returns real data, these
 * values are superseded by live API responses.
 */

import type {
  ImpactSchoolListResponse,
  ImpactClassGroupListResponse,
  ImpactLearnerListResponse,
  ImpactSubjectListResponse,
  ImpactTopicListResponse,
  ImpactAssessmentListResponse,
  ImpactAssessmentQuestionListResponse,
  ImpactInterventionListResponse,
  SchoolDashboard,
  MinistryDashboard,
  AssessmentAnalytics,
  SubjectPassRate,
  ClassPassRate,
  WeakTopic,
  ClassNeedingSupport,
  RecentIntervention,
  SubjectWeakTopics,
  SchoolNeedingSupport,
  ClassNeedingSupportMinistry,
  QuestionPerformance,
  TopicPerformance,
  LearnerPerformance,
  ImpactAssessment,
  ImpactClassGroup,
  ImpactSchool,
  AssessmentReport,
  SchoolReport,
} from '@/lib/types/impact'

export const DEMO_DISCLOSURE = 'Seeded multi-school demonstration data. No learner identities. Not verified pilot evidence.'
export const HIVEMIND_SCOPE_NOTE = 'This demonstration showcases a focused set of HiveMind Intelligence capabilities using seeded multi-school data. The production platform extends beyond this preview with broader data connectivity, additional intelligence modules, and deeper governance workflows.'

// =========================================================================
// IDs (deterministic)
// =========================================================================

const IDS = {
  schools: ['school-pilot', 'school-mbare', 'school-chitungwiza'] as const,
  classes: [
    'class-pilot-1a', 'class-pilot-1b',
    'class-mbare-1a', 'class-mbare-2a',
    'class-chit-1c', 'class-chit-2b',
  ] as const,
  subjects: ['subj-math', 'subj-eng', 'subj-sci'] as const,
  topics: [
    'topic-fractions', 'topic-ratios', 'topic-percentages', 'topic-graphs', 'topic-wordprobs',
    'topic-comprehension', 'topic-grammar', 'topic-summary', 'topic-vocab',
    'topic-cells', 'topic-energy', 'topic-matter', 'topic-forces',
  ] as const,
  assessments: [
    'assess-math-term1', 'assess-math-fractions', 'assess-eng-comp',
    'assess-eng-grammar', 'assess-sci-topics', 'assess-sci-practical',
  ] as const,
}

// =========================================================================
// Schools
// =========================================================================

// =========================================================================
// Deterministic PRNG
// =========================================================================
//
// The demo must be *deterministic* — every reload has to show the same
// numbers, otherwise it contradicts the product's "deterministic = truth"
// promise. We use a seeded mulberry32 generator keyed by assessment ID.

function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function makeRng(seed: string): () => number {
  let a = hashSeed(seed)
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Thresholds kept in sync with vault_core/analytics/impact.py
const CRITICAL_TOPIC_THRESHOLD = 40
const WEAK_TOPIC_THRESHOLD = 55
const CRITICAL_QUESTION_THRESHOLD = 35

export const SEEDED_SCHOOLS: ImpactSchoolListResponse = {
  total: 3,
  schools: [
    {
      id: IDS.schools[0],
      name: 'Pilot School',
      district: 'Harare South',
      province: 'Harare',
      school_type: 'secondary',
      active: true,
      created: '2025-01-15T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.schools[1],
      name: 'Mbare Community High',
      district: 'Harare Metro',
      province: 'Harare',
      school_type: 'secondary',
      active: true,
      created: '2025-02-01T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.schools[2],
      name: 'Chitungwiza Learning Centre',
      district: 'Chitungwiza',
      province: 'Harare',
      school_type: 'secondary',
      active: true,
      created: '2025-03-01T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
  ],
}

// =========================================================================
// Classes
// =========================================================================

export const SEEDED_CLASSES: ImpactClassGroupListResponse = {
  total: 6,
  class_groups: [
    {
      id: IDS.classes[0],
      school_id: IDS.schools[0],
      name: 'Form 1A',
      grade_level: 'Form 1',
      academic_year: '2025',
      teacher_name: 'Ms. Dube',
      active: true,
      created: '2025-01-20T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.classes[1],
      school_id: IDS.schools[0],
      name: 'Form 1B',
      grade_level: 'Form 1',
      academic_year: '2025',
      teacher_name: 'Mr. Ndlovu',
      active: true,
      created: '2025-01-20T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.classes[2],
      school_id: IDS.schools[1],
      name: 'Form 1A',
      grade_level: 'Form 1',
      academic_year: '2025',
      teacher_name: 'Mrs. Sibanda',
      active: true,
      created: '2025-02-05T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.classes[3],
      school_id: IDS.schools[1],
      name: 'Form 2A',
      grade_level: 'Form 2',
      academic_year: '2025',
      teacher_name: 'Mr. Chinoda',
      active: true,
      created: '2025-02-05T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.classes[4],
      school_id: IDS.schools[2],
      name: 'Form 1C',
      grade_level: 'Form 1',
      academic_year: '2025',
      teacher_name: 'Ms. Makoni',
      active: true,
      created: '2025-03-05T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
    {
      id: IDS.classes[5],
      school_id: IDS.schools[2],
      name: 'Form 2B',
      grade_level: 'Form 2',
      academic_year: '2025',
      teacher_name: 'Mr. Gumbo',
      active: true,
      created: '2025-03-05T08:00:00Z',
      updated: '2025-06-01T10:00:00Z',
    },
  ],
}

// =========================================================================
// Learners
// =========================================================================

function generateLearners(baseCode: string, count: number, schoolId: string, classGroupId: string) {
  return Array.from({ length: count }, (_, i) => ({
    id: `learner-${baseCode}-${i + 1}`,
    school_id: schoolId,
    class_group_id: classGroupId,
    learner_code: `${baseCode.toUpperCase()}-${(i + 1).toString().padStart(3, '0')}`,
    display_name: undefined,
    status: 'active' as const,
    created: '2025-01-20T08:00:00Z',
    updated: '2025-06-01T10:00:00Z',
  }))
}

const LEARNER_COUNTS: Record<string, number> = {
  'class-pilot-1a': 30,
  'class-pilot-1b': 30,
  'class-mbare-1a': 29,
  'class-mbare-2a': 29,
  'class-chit-1c': 31,
  'class-chit-2b': 31,
}

function buildAllLearners(): ImpactLearnerListResponse {
  const learners = IDS.classes.flatMap((cid) => {
    const cls = SEEDED_CLASSES.class_groups.find((c) => c.id === cid)!
    const count = LEARNER_COUNTS[cid] || 30
    return generateLearners(cid, count, cls.school_id, cid)
  })
  return { total: learners.length, learners }
}

export const SEEDED_LEARNERS = buildAllLearners()

// =========================================================================
// Subjects
// =========================================================================

export const SEEDED_SUBJECTS: ImpactSubjectListResponse = {
  total: 3,
  subjects: [
    { id: IDS.subjects[0], name: 'Mathematics', level: 'Form 1-2', curriculum: 'ZIMSEC', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.subjects[1], name: 'English', level: 'Form 1-2', curriculum: 'ZIMSEC', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.subjects[2], name: 'Combined Science', level: 'Form 1-2', curriculum: 'ZIMSEC', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
  ],
}

// =========================================================================
// Topics
// =========================================================================

export const SEEDED_TOPICS: ImpactTopicListResponse = {
  total: 13,
  topics: [
    { id: IDS.topics[0], subject_id: IDS.subjects[0], name: 'Fractions', strand: 'Number', syllabus_code: 'MTH-1.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[1], subject_id: IDS.subjects[0], name: 'Ratios', strand: 'Number', syllabus_code: 'MTH-1.2', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[2], subject_id: IDS.subjects[0], name: 'Percentages', strand: 'Number', syllabus_code: 'MTH-1.3', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[3], subject_id: IDS.subjects[0], name: 'Graphs', strand: 'Data', syllabus_code: 'MTH-2.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[4], subject_id: IDS.subjects[0], name: 'Word Problems', strand: 'Problem Solving', syllabus_code: 'MTH-3.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[5], subject_id: IDS.subjects[1], name: 'Comprehension', strand: 'Reading', syllabus_code: 'ENG-1.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[6], subject_id: IDS.subjects[1], name: 'Grammar', strand: 'Language Use', syllabus_code: 'ENG-2.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[7], subject_id: IDS.subjects[1], name: 'Summary Writing', strand: 'Writing', syllabus_code: 'ENG-3.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[8], subject_id: IDS.subjects[1], name: 'Vocabulary', strand: 'Language Use', syllabus_code: 'ENG-2.2', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[9], subject_id: IDS.subjects[2], name: 'Cells', strand: 'Biology', syllabus_code: 'SCI-1.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[10], subject_id: IDS.subjects[2], name: 'Energy', strand: 'Physics', syllabus_code: 'SCI-2.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[11], subject_id: IDS.subjects[2], name: 'Matter', strand: 'Chemistry', syllabus_code: 'SCI-3.1', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
    { id: IDS.topics[12], subject_id: IDS.subjects[2], name: 'Forces', strand: 'Physics', syllabus_code: 'SCI-2.2', created: '2025-01-01T00:00:00Z', updated: '2025-01-01T00:00:00Z' },
  ],
}

// =========================================================================
// Assessments
// =========================================================================

export const SEEDED_ASSESSMENTS: ImpactAssessmentListResponse = {
  total: 6,
  assessments: [
    {
      id: IDS.assessments[0],
      school_id: IDS.schools[0],
      class_group_id: IDS.classes[0],
      subject_id: IDS.subjects[0],
      title: 'Term 1 Diagnostic Test',
      assessment_type: 'exam',
      term: 'Term 1',
      date_written: '2025-02-10',
      total_marks: 100,
      pass_mark: 50,
      status: 'graded',
      created: '2025-01-25T08:00:00Z',
      updated: '2025-02-15T10:00:00Z',
    },
    {
      id: IDS.assessments[1],
      school_id: IDS.schools[0],
      class_group_id: IDS.classes[0],
      subject_id: IDS.subjects[0],
      title: 'Fractions & Ratios Quiz',
      assessment_type: 'quiz',
      term: 'Term 1',
      date_written: '2025-03-05',
      total_marks: 30,
      pass_mark: 15,
      status: 'graded',
      created: '2025-02-25T08:00:00Z',
      updated: '2025-03-10T10:00:00Z',
    },
    {
      id: IDS.assessments[2],
      school_id: IDS.schools[1],
      class_group_id: IDS.classes[2],
      subject_id: IDS.subjects[1],
      title: 'Comprehension Diagnostic',
      assessment_type: 'test',
      term: 'Term 1',
      date_written: '2025-02-15',
      total_marks: 50,
      pass_mark: 25,
      status: 'graded',
      created: '2025-01-25T08:00:00Z',
      updated: '2025-02-20T10:00:00Z',
    },
    {
      id: IDS.assessments[3],
      school_id: IDS.schools[1],
      class_group_id: IDS.classes[3],
      subject_id: IDS.subjects[1],
      title: 'Grammar Check',
      assessment_type: 'test',
      term: 'Term 1',
      date_written: '2025-03-01',
      total_marks: 40,
      pass_mark: 20,
      status: 'graded',
      created: '2025-02-10T08:00:00Z',
      updated: '2025-03-05T10:00:00Z',
    },
    {
      id: IDS.assessments[4],
      school_id: IDS.schools[2],
      class_group_id: IDS.classes[4],
      subject_id: IDS.subjects[2],
      title: 'Topic Test — Cells & Energy',
      assessment_type: 'test',
      term: 'Term 2',
      date_written: '2025-04-10',
      total_marks: 60,
      pass_mark: 30,
      status: 'graded',
      created: '2025-03-20T08:00:00Z',
      updated: '2025-04-15T10:00:00Z',
    },
    {
      id: IDS.assessments[5],
      school_id: IDS.schools[2],
      class_group_id: IDS.classes[5],
      subject_id: IDS.subjects[2],
      title: 'Practical Readiness Check',
      assessment_type: 'assignment',
      term: 'Term 2',
      date_written: '2025-05-05',
      total_marks: 20,
      pass_mark: 10,
      status: 'graded',
      created: '2025-04-20T08:00:00Z',
      updated: '2025-05-10T10:00:00Z',
    },
  ],
}

// =========================================================================
// Assessment Questions (per assessment)
// =========================================================================

const QUESTIONS_BY_ASSESSMENT: Record<string, ImpactAssessmentQuestionListResponse> = {
  [IDS.assessments[0]]: {
    total: 10,
    questions: [
      { id: 'q-math-t1-1', assessment_id: IDS.assessments[0], question_number: 1, label: 'Simplify 3/4 + 1/2', max_marks: 10, topic_id: IDS.topics[0], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-t1-2', assessment_id: IDS.assessments[0], question_number: 2, label: 'Convert 0.75 to a fraction', max_marks: 5, topic_id: IDS.topics[0], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-math-t1-3', assessment_id: IDS.assessments[0], question_number: 3, label: 'Find the ratio 5:15 in simplest form', max_marks: 5, topic_id: IDS.topics[1], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-math-t1-4', assessment_id: IDS.assessments[0], question_number: 4, label: 'If A:B = 2:3 and B:C = 4:5, find A:C', max_marks: 15, topic_id: IDS.topics[1], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-math-t1-5', assessment_id: IDS.assessments[0], question_number: 5, label: 'What is 15% of 200?', max_marks: 5, topic_id: IDS.topics[2], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-math-t1-6', assessment_id: IDS.assessments[0], question_number: 6, label: 'A shirt costs $40 after 20% discount. Find original price.', max_marks: 15, topic_id: IDS.topics[2], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-math-t1-7', assessment_id: IDS.assessments[0], question_number: 7, label: 'Plot the points (1,2), (2,4), (3,6) on a graph', max_marks: 10, topic_id: IDS.topics[3], skill_type: 'comprehension', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-t1-8', assessment_id: IDS.assessments[0], question_number: 8, label: 'Interpret the line graph showing temperature over time', max_marks: 10, topic_id: IDS.topics[3], skill_type: 'analysis', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-t1-9', assessment_id: IDS.assessments[0], question_number: 9, label: 'John has 24 apples. He gives 1/3 to Mary. How many left?', max_marks: 10, topic_id: IDS.topics[4], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-t1-10', assessment_id: IDS.assessments[0], question_number: 10, label: 'A train travels 240 km in 3 hours. Average speed?', max_marks: 15, topic_id: IDS.topics[4], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
    ],
  },
  [IDS.assessments[1]]: {
    total: 5,
    questions: [
      { id: 'q-math-fr-1', assessment_id: IDS.assessments[1], question_number: 1, label: 'Add 2/5 + 3/10', max_marks: 6, topic_id: IDS.topics[0], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-fr-2', assessment_id: IDS.assessments[1], question_number: 2, label: 'Multiply 2/3 × 4/5', max_marks: 6, topic_id: IDS.topics[0], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-fr-3', assessment_id: IDS.assessments[1], question_number: 3, label: 'Divide 60 in ratio 2:3', max_marks: 6, topic_id: IDS.topics[1], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-math-fr-4', assessment_id: IDS.assessments[1], question_number: 4, label: 'Express 16:12 in simplest form', max_marks: 6, topic_id: IDS.topics[1], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-math-fr-5', assessment_id: IDS.assessments[1], question_number: 5, label: 'Word problem: mixing paint in ratio 3:2', max_marks: 6, topic_id: IDS.topics[1], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
    ],
  },
  [IDS.assessments[2]]: {
    total: 6,
    questions: [
      { id: 'q-eng-comp-1', assessment_id: IDS.assessments[2], question_number: 1, label: 'Read passage A. What is the main idea?', max_marks: 10, topic_id: IDS.topics[5], skill_type: 'comprehension', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-eng-comp-2', assessment_id: IDS.assessments[2], question_number: 2, label: 'Identify two supporting details from paragraph 2', max_marks: 10, topic_id: IDS.topics[5], skill_type: 'comprehension', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-eng-comp-3', assessment_id: IDS.assessments[2], question_number: 3, label: 'What does the author imply about the main character?', max_marks: 10, topic_id: IDS.topics[5], skill_type: 'analysis', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-eng-comp-4', assessment_id: IDS.assessments[2], question_number: 4, label: 'Summarise the passage in 3 sentences', max_marks: 10, topic_id: IDS.topics[7], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-eng-comp-5', assessment_id: IDS.assessments[2], question_number: 5, label: 'Define 5 key vocabulary words from the text', max_marks: 5, topic_id: IDS.topics[8], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-eng-comp-6', assessment_id: IDS.assessments[2], question_number: 6, label: 'Explain the authors purpose', max_marks: 5, topic_id: IDS.topics[5], skill_type: 'analysis', difficulty: 'medium', created: '', updated: '' },
    ],
  },
  [IDS.assessments[3]]: {
    total: 8,
    questions: [
      { id: 'q-eng-gr-1', assessment_id: IDS.assessments[3], question_number: 1, label: 'Identify the subject in: "The dog ran quickly."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-eng-gr-2', assessment_id: IDS.assessments[3], question_number: 2, label: 'Correct the verb tense: "She go to school."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'application', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-eng-gr-3', assessment_id: IDS.assessments[3], question_number: 3, label: 'Rewrite in passive voice: "The chef cooked the meal."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-eng-gr-4', assessment_id: IDS.assessments[3], question_number: 4, label: 'Combine sentences using a relative clause', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-eng-gr-5', assessment_id: IDS.assessments[3], question_number: 5, label: 'Identify the type of conditional: "If I had studied, I would pass."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'analysis', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-eng-gr-6', assessment_id: IDS.assessments[3], question_number: 6, label: 'Fill in the correct preposition: "She is interested __ music."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-eng-gr-7', assessment_id: IDS.assessments[3], question_number: 7, label: 'Form a question: "You like pizza."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-eng-gr-8', assessment_id: IDS.assessments[3], question_number: 8, label: 'Identify the error: "Each of the students have a book."', max_marks: 5, topic_id: IDS.topics[6], skill_type: 'analysis', difficulty: 'medium', created: '', updated: '' },
    ],
  },
  [IDS.assessments[4]]: {
    total: 6,
    questions: [
      { id: 'q-sci-cells-1', assessment_id: IDS.assessments[4], question_number: 1, label: 'Label the parts of a plant cell', max_marks: 10, topic_id: IDS.topics[9], skill_type: 'knowledge', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-sci-cells-2', assessment_id: IDS.assessments[4], question_number: 2, label: 'Describe the function of the mitochondria', max_marks: 10, topic_id: IDS.topics[9], skill_type: 'comprehension', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-sci-cells-3', assessment_id: IDS.assessments[4], question_number: 3, label: 'Difference between plant and animal cells', max_marks: 10, topic_id: IDS.topics[9], skill_type: 'analysis', difficulty: 'hard', created: '', updated: '' },
      { id: 'q-sci-energy-1', assessment_id: IDS.assessments[4], question_number: 4, label: 'Define potential energy and give an example', max_marks: 10, topic_id: IDS.topics[10], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-sci-energy-2', assessment_id: IDS.assessments[4], question_number: 5, label: 'Energy transfer in a food chain', max_marks: 10, topic_id: IDS.topics[10], skill_type: 'comprehension', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-sci-energy-3', assessment_id: IDS.assessments[4], question_number: 6, label: 'Explain the law of conservation of energy', max_marks: 10, topic_id: IDS.topics[10], skill_type: 'application', difficulty: 'hard', created: '', updated: '' },
    ],
  },
  [IDS.assessments[5]]: {
    total: 4,
    questions: [
      { id: 'q-sci-prac-1', assessment_id: IDS.assessments[5], question_number: 1, label: 'Identify the lab equipment from a diagram', max_marks: 5, topic_id: IDS.topics[11], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-sci-prac-2', assessment_id: IDS.assessments[5], question_number: 2, label: 'List safety rules for a Bunsen burner', max_marks: 5, topic_id: IDS.topics[11], skill_type: 'knowledge', difficulty: 'easy', created: '', updated: '' },
      { id: 'q-sci-prac-3', assessment_id: IDS.assessments[5], question_number: 3, label: 'Describe the experimental method to test for gravity', max_marks: 5, topic_id: IDS.topics[12], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
      { id: 'q-sci-prac-4', assessment_id: IDS.assessments[5], question_number: 4, label: 'Calculate force: mass 5kg, acceleration 2m/s²', max_marks: 5, topic_id: IDS.topics[12], skill_type: 'application', difficulty: 'medium', created: '', updated: '' },
    ],
  },
}

export function getSeededQuestions(assessmentId: string): ImpactAssessmentQuestionListResponse {
  return QUESTIONS_BY_ASSESSMENT[assessmentId] || { total: 0, questions: [] }
}

export function getAllSeededQuestions(): ImpactAssessmentQuestionListResponse {
  const all = Object.values(QUESTIONS_BY_ASSESSMENT).flatMap((r) => r.questions)
  return { total: all.length, questions: all }
}

// =========================================================================
// Interventions
// =========================================================================

export const SEEDED_INTERVENTIONS: ImpactInterventionListResponse = {
  total: 8,
  interventions: [
    { id: 'int-1', assessment_id: IDS.assessments[0], class_group_id: IDS.classes[0], topic_id: IDS.topics[1], severity: 'critical', recommendation: 'Ratios — intensive revision sessions needed. Only 28% of learners scored above 50%.', status: 'in_progress', created: '2025-02-20T10:00:00Z', updated: '2025-03-01T10:00:00Z' },
    { id: 'int-2', assessment_id: IDS.assessments[0], class_group_id: IDS.classes[0], topic_id: IDS.topics[2], severity: 'high', recommendation: 'Percentages — peer tutoring group for learners below 40%.', status: 'in_progress', created: '2025-02-20T10:00:00Z', updated: '2025-03-01T10:00:00Z' },
    { id: 'int-3', assessment_id: IDS.assessments[0], class_group_id: IDS.classes[0], topic_id: IDS.topics[4], severity: 'high', recommendation: 'Word Problems — scaffolded problem-solving worksheets.', status: 'pending', created: '2025-02-20T10:00:00Z', updated: '2025-02-20T10:00:00Z' },
    { id: 'int-4', assessment_id: IDS.assessments[2], class_group_id: IDS.classes[2], topic_id: IDS.topics[5], severity: 'high', recommendation: 'Comprehension — guided reading sessions three times per week.', status: 'in_progress', created: '2025-02-25T10:00:00Z', updated: '2025-03-05T10:00:00Z' },
    { id: 'int-5', assessment_id: IDS.assessments[2], class_group_id: IDS.classes[2], topic_id: IDS.topics[7], severity: 'critical', recommendation: 'Summary Writing — explicit instruction on paragraph structure and main idea extraction.', status: 'in_progress', created: '2025-02-25T10:00:00Z', updated: '2025-03-05T10:00:00Z' },
    { id: 'int-6', assessment_id: IDS.assessments[4], class_group_id: IDS.classes[4], topic_id: IDS.topics[10], severity: 'medium', recommendation: 'Energy — hands-on experiments to reinforce transformation concepts.', status: 'pending', created: '2025-04-20T10:00:00Z', updated: '2025-04-20T10:00:00Z' },
    { id: 'int-7', assessment_id: IDS.assessments[4], class_group_id: IDS.classes[4], topic_id: IDS.topics[9], severity: 'medium', recommendation: 'Cells — diagram labelling and cell model building.', status: 'completed', created: '2025-04-20T10:00:00Z', updated: '2025-05-10T10:00:00Z' },
    { id: 'int-8', assessment_id: IDS.assessments[0], class_group_id: IDS.classes[1], topic_id: IDS.topics[1], severity: 'medium', recommendation: 'Ratios — additional practice problems for Form 1B.', status: 'pending', created: '2025-03-01T10:00:00Z', updated: '2025-03-01T10:00:00Z' },
  ],
}

// =========================================================================
// School-level analytics (per-school dashboards)
// =========================================================================

function getSchoolById(id: string) {
  return SEEDED_SCHOOLS.schools.find((s) => s.id === id)!
}

function getClassesBySchool(schoolId: string) {
  return SEEDED_CLASSES.class_groups.filter((c) => c.school_id === schoolId)
}

function getAssessmentsBySchool(schoolId: string) {
  return SEEDED_ASSESSMENTS.assessments.filter((a) => a.school_id === schoolId)
}

function getAssessmentsByClass(classId: string) {
  return SEEDED_ASSESSMENTS.assessments.filter((a) => a.class_group_id === classId)
}

function getLearnerCountByClass(classId: string): number {
  return SEEDED_LEARNERS.learners.filter((l) => l.class_group_id === classId).length
}

function getLearnerCountBySchool(schoolId: string): number {
  const classIds = getClassesBySchool(schoolId).map((c) => c.id)
  return SEEDED_LEARNERS.learners.filter((l) => classIds.includes(l.class_group_id)).length
}

// Per-school dashboard configurations
const SCHOOL_DASHBOARDS: Record<string, SchoolDashboard> = {
  [IDS.schools[0]]: {
    school_id: IDS.schools[0],
    school_name: 'Pilot School',
    total_classes: 2,
    total_learners: getLearnerCountBySchool(IDS.schools[0]),
    total_learners_assessed: 30,
    total_assessments: 2,
    overall_pass_rate: 50,
    pass_rate_by_subject: [
      { subject_id: IDS.subjects[0], subject_name: 'Mathematics', total_learners: 30, pass_rate: 50 },
    ],
    pass_rate_by_class: [
      { class_id: IDS.classes[0], class_name: 'Form 1A', total_learners: 30, pass_rate: 50 },
      { class_id: IDS.classes[1], class_name: 'Form 1B', total_learners: 30, pass_rate: 42 },
    ],
    weakest_topics: [
      { topic_id: IDS.topics[1], topic_name: 'Ratios', percentage: 28, is_critical: true, num_questions: 3 },
      { topic_id: IDS.topics[2], topic_name: 'Percentages', percentage: 32, is_critical: true, num_questions: 2 },
      { topic_id: IDS.topics[4], topic_name: 'Word Problems', percentage: 38, is_critical: true, num_questions: 2 },
      { topic_id: IDS.topics[0], topic_name: 'Fractions', percentage: 55, is_critical: false, num_questions: 2 },
    ],
    classes_needing_support: [
      { class_id: IDS.classes[1], class_name: 'Form 1B', pass_rate: 42, total_learners: 30 },
    ],
    recent_interventions: [
      { id: 'int-1', severity: 'critical', recommendation: 'Ratios — intensive revision sessions', status: 'in_progress', created: '2025-02-20T10:00:00Z' },
      { id: 'int-2', severity: 'high', recommendation: 'Percentages — peer tutoring group', status: 'in_progress', created: '2025-02-20T10:00:00Z' },
      { id: 'int-3', severity: 'high', recommendation: 'Word Problems — scaffolded worksheets', status: 'pending', created: '2025-02-20T10:00:00Z' },
    ],
  },
  [IDS.schools[1]]: {
    school_id: IDS.schools[1],
    school_name: 'Mbare Community High',
    total_classes: 2,
    total_learners: getLearnerCountBySchool(IDS.schools[1]),
    total_learners_assessed: 29,
    total_assessments: 2,
    overall_pass_rate: 57,
    pass_rate_by_subject: [
      { subject_id: IDS.subjects[1], subject_name: 'English', total_learners: 29, pass_rate: 57 },
    ],
    pass_rate_by_class: [
      { class_id: IDS.classes[2], class_name: 'Form 1A', total_learners: 29, pass_rate: 55 },
      { class_id: IDS.classes[3], class_name: 'Form 2A', total_learners: 29, pass_rate: 60 },
    ],
    weakest_topics: [
      { topic_id: IDS.topics[5], topic_name: 'Comprehension', percentage: 35, is_critical: true, num_questions: 3 },
      { topic_id: IDS.topics[7], topic_name: 'Summary Writing', percentage: 30, is_critical: true, num_questions: 1 },
      { topic_id: IDS.topics[8], topic_name: 'Vocabulary', percentage: 60, is_critical: false, num_questions: 1 },
    ],
    classes_needing_support: [
      { class_id: IDS.classes[2], class_name: 'Form 1A', pass_rate: 55, total_learners: 29 },
    ],
    recent_interventions: [
      { id: 'int-4', severity: 'high', recommendation: 'Comprehension — guided reading sessions', status: 'in_progress', created: '2025-02-25T10:00:00Z' },
      { id: 'int-5', severity: 'critical', recommendation: 'Summary Writing — explicit instruction', status: 'in_progress', created: '2025-02-25T10:00:00Z' },
    ],
  },
  [IDS.schools[2]]: {
    school_id: IDS.schools[2],
    school_name: 'Chitungwiza Learning Centre',
    total_classes: 2,
    total_learners: getLearnerCountBySchool(IDS.schools[2]),
    total_learners_assessed: 31,
    total_assessments: 2,
    overall_pass_rate: 63,
    pass_rate_by_subject: [
      { subject_id: IDS.subjects[2], subject_name: 'Combined Science', total_learners: 31, pass_rate: 63 },
    ],
    pass_rate_by_class: [
      { class_id: IDS.classes[4], class_name: 'Form 1C', total_learners: 31, pass_rate: 60 },
      { class_id: IDS.classes[5], class_name: 'Form 2B', total_learners: 31, pass_rate: 66 },
    ],
    weakest_topics: [
      { topic_id: IDS.topics[10], topic_name: 'Energy', percentage: 40, is_critical: false, num_questions: 3 },
      { topic_id: IDS.topics[9], topic_name: 'Cells', percentage: 52, is_critical: false, num_questions: 3 },
    ],
    classes_needing_support: [],
    recent_interventions: [
      { id: 'int-6', severity: 'medium', recommendation: 'Energy — hands-on experiments', status: 'pending', created: '2025-04-20T10:00:00Z' },
      { id: 'int-7', severity: 'medium', recommendation: 'Cells — diagram labelling', status: 'completed', created: '2025-04-20T10:00:00Z' },
    ],
  },
}

export function getSeededSchoolDashboard(schoolId: string): SchoolDashboard | null {
  return SCHOOL_DASHBOARDS[schoolId] || null
}

// =========================================================================
// Assessment Analytics (per-assessment)
// =========================================================================

function getTopicName(topicId: string): string {
  const topic = SEEDED_TOPICS.topics.find((t) => t.id === topicId)
  return topic?.name || topicId
}

export function getSeededAssessmentAnalytics(assessmentId: string): AssessmentAnalytics | null {
  const assessment = SEEDED_ASSESSMENTS.assessments.find((a) => a.id === assessmentId)
  if (!assessment) return null

  const questionsRes = getSeededQuestions(assessmentId)
  const questions = questionsRes.questions
  if (questions.length === 0) return null

  // Deterministic PRNG keyed by assessment id (stable across reloads)
  const rng = makeRng(assessmentId)

  // The learners actually enrolled in this assessment's class group are the
  // population. Completion is 100% in the seed (all marks entered).
  const classGroup = SEEDED_CLASSES.class_groups.find((cg) => cg.id === assessment.class_group_id)
  const classLearners = classGroup
    ? SEEDED_LEARNERS.learners.filter((l) => l.class_group_id === classGroup.id)
    : SEEDED_LEARNERS.learners.slice(0, 30)
  const numLearners = classLearners.length || 30

  const qp: QuestionPerformance[] = questions.map((q) => {
    const avgScore = Math.round(q.max_marks * (0.35 + rng() * 0.5))
    return {
      question_id: q.id,
      question_number: q.question_number,
      label: q.label,
      max_marks: q.max_marks,
      topic_id: q.topic_id || '',
      skill_type: q.skill_type,
      difficulty: q.difficulty,
      total_score: avgScore * numLearners,
      num_learners: numLearners,
      average_score: avgScore,
      average_percentage: Math.round((avgScore / q.max_marks) * 100),
      is_critical: (avgScore / q.max_marks) < (CRITICAL_QUESTION_THRESHOLD / 100),
    }
  })

  // Aggregate topic performance
  const topicMap = new Map<string, TopicPerformance>()
  for (const q of questions) {
    const tid = q.topic_id || ''
    if (!topicMap.has(tid)) {
      topicMap.set(tid, {
        topic_id: tid,
        topic_name: getTopicName(tid),
        total_score: 0,
        total_max_marks: 0,
        percentage: 0,
        num_questions: 0,
        num_learners: numLearners,
        is_weak: false,
        is_critical: false,
      })
    }
    const tp = topicMap.get(tid)!
    const qpItem = qp.find((p) => p.question_id === q.id)
    if (qpItem) {
      tp.total_score += qpItem.total_score
      tp.total_max_marks += qpItem.max_marks * numLearners
    } else {
      tp.total_max_marks += q.max_marks * numLearners
    }
    tp.num_questions++
  }

  const topicPerformance: TopicPerformance[] = Array.from(topicMap.values()).map((tp) => {
    const pct = tp.total_max_marks > 0
      ? Math.round((tp.total_score / tp.total_max_marks) * 100)
      : 0
    return {
      ...tp,
      percentage: pct,
      is_weak: CRITICAL_TOPIC_THRESHOLD <= pct && pct < WEAK_TOPIC_THRESHOLD,
      is_critical: pct < CRITICAL_TOPIC_THRESHOLD,
    }
  })

  // Simulate learner performance (deterministic, seeded by assessment id)
  const learnerPerformance: LearnerPerformance[] = classLearners.slice(0, numLearners).map((l) => {
    const pct = 30 + Math.floor(rng() * 55)
    return {
      learner_id: l.id,
      learner_code: l.learner_code,
      display_name: l.display_name,
      total_score: Math.round((pct / 100) * assessment.total_marks),
      total_max_marks: assessment.total_marks,
      percentage: pct,
      passed: pct >= (assessment.pass_mark ?? 50),
      risk_level: pct < 40 ? 'high' : pct < (assessment.pass_mark ?? 50) ? 'medium' : 'low',
      questions_answered: questions.length,
      total_questions: questions.length,
    }
  })

  const passCount = learnerPerformance.filter((lp) => lp.passed).length
  const passRate = learnerPerformance.length > 0
    ? Math.round((passCount / learnerPerformance.length) * 100)
    : 0

  const allScores = questions.map((q) => {
    const item = qp.find((p) => p.question_id === q.id)
    return item ? item.average_percentage : 50
  })
  const classAverage = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0

  const weakTopics = topicPerformance.filter((tp) => tp.is_weak || tp.is_critical)
  const atRiskLearners = learnerPerformance.filter((lp) => lp.risk_level === 'high' || lp.risk_level === 'medium')

  return {
    assessment_id: assessmentId,
    assessment_title: assessment.title,
    assessment_type: assessment.assessment_type,
    total_marks: assessment.total_marks,
    pass_mark: assessment.pass_mark,
    term: assessment.term,
    total_learners: classLearners.length,
    learners_assessed: learnerPerformance.length,
    mark_completion_rate: 100,
    class_average_percentage: classAverage,
    pass_rate: passRate,
    failure_rate: 100 - passRate,
    question_performance: qp,
    topic_performance: topicPerformance,
    learner_performance: learnerPerformance,
    weak_topics: weakTopics,
    at_risk_learners: atRiskLearners,
    interventions: weakTopics.map((wt) => ({
      intervention_type: wt.is_critical ? 'critical' as const : 'weak' as const,
      entity_type: 'topic' as const,
      entity_id: wt.topic_id,
      entity_name: wt.topic_name,
      severity: wt.is_critical ? 'critical' as const : 'high' as const,
      recommendation: `${wt.topic_name} — targeted revision needed. ${wt.percentage}% average.`,
      percentage: wt.percentage,
    })),
  }
}

// =========================================================================
// Ministry Dashboard
// =========================================================================

export const SEEDED_MINISTRY_DASHBOARD: MinistryDashboard = {
  total_schools: 3,
  total_learners: SEEDED_LEARNERS.total,
  total_learners_assessed: 90,
  total_assessments: 6,
  average_pass_rate: 57,
  weak_topics_by_subject: [
    {
      subject_id: IDS.subjects[0],
      subject_name: 'Mathematics',
      weak_topics: [
        { topic_name: 'Ratios', percentage: 28, is_critical: true },
        { topic_name: 'Percentages', percentage: 32, is_critical: true },
        { topic_name: 'Word Problems', percentage: 38, is_critical: true },
      ],
    },
    {
      subject_id: IDS.subjects[1],
      subject_name: 'English',
      weak_topics: [
        { topic_name: 'Summary Writing', percentage: 30, is_critical: true },
        { topic_name: 'Comprehension', percentage: 35, is_critical: true },
      ],
    },
    {
      subject_id: IDS.subjects[2],
      subject_name: 'Combined Science',
      weak_topics: [
        { topic_name: 'Energy', percentage: 40, is_critical: false },
      ],
    },
  ],
  schools_needing_support: [
    { school_id: IDS.schools[0], school_name: 'Pilot School', pass_rate: 50, total_assessments: 2 },
    { school_id: IDS.schools[1], school_name: 'Mbare Community High', pass_rate: 57, total_assessments: 2 },
  ],
  classes_needing_support: [
    { class_id: IDS.classes[1], class_name: 'Form 1B', school_id: IDS.schools[0], pass_rate: 42, total_learners: 30 },
    { class_id: IDS.classes[2], class_name: 'Form 1A', school_id: IDS.schools[1], pass_rate: 55, total_learners: 29 },
  ],
}

// =========================================================================
// Canonical public-demo selectors and report builders
// =========================================================================

export function getSeededSchool(id: string): ImpactSchool | null {
  return SEEDED_SCHOOLS.schools.find((school) => school.id === id) || null
}

export function getSeededClassGroup(id: string): ImpactClassGroup | null {
  return SEEDED_CLASSES.class_groups.find((classGroup) => classGroup.id === id) || null
}

export function getSeededAssessment(id: string): ImpactAssessment | null {
  return SEEDED_ASSESSMENTS.assessments.find((assessment) => assessment.id === id) || null
}

export function getSeededAssessmentReport(assessmentId: string): AssessmentReport | null {
  const assessment = getSeededAssessment(assessmentId)
  const analytics = getSeededAssessmentAnalytics(assessmentId)
  if (!assessment || !analytics) return null

  return {
    assessment,
    questions: getSeededQuestions(assessmentId).questions,
    learners: SEEDED_LEARNERS.learners.filter((learner) => learner.class_group_id === assessment.class_group_id),
    analytics,
    school: getSeededSchool(assessment.school_id) || undefined,
    class_group: getSeededClassGroup(assessment.class_group_id) || undefined,
    subject: SEEDED_SUBJECTS.subjects.find((subject) => subject.id === assessment.subject_id),
  }
}

export function getSeededSchoolReport(schoolId: string): SchoolReport | null {
  const school = getSeededSchool(schoolId)
  const dashboard = getSeededSchoolDashboard(schoolId)
  if (!school || !dashboard) return null

  const classes = SEEDED_CLASSES.class_groups.filter((classGroup) => classGroup.school_id === schoolId)
  const assessments = SEEDED_ASSESSMENTS.assessments.filter((assessment) => assessment.school_id === schoolId)
  const subjectIds = new Set(assessments.map((assessment) => assessment.subject_id))
  const subjects = SEEDED_SUBJECTS.subjects.filter((subject) => subjectIds.has(subject.id))
  const classIds = new Set(classes.map((classGroup) => classGroup.id))
  const interventions = SEEDED_INTERVENTIONS.interventions.filter((item) => classIds.has(item.class_group_id))
  const analyticsRows = assessments
    .map((assessment) => getSeededAssessmentAnalytics(assessment.id))
    .filter((analytics): analytics is AssessmentAnalytics => analytics !== null)
  const learnersNeedingSupport = new Set(
    analyticsRows.flatMap((analytics) => analytics.at_risk_learners.map((learner) => learner.learner_id)),
  ).size
  const questions = assessments.flatMap((assessment) => getSeededQuestions(assessment.id).questions)

  return {
    school,
    classes,
    assessments,
    subjects,
    pass_rate_by_class: dashboard.pass_rate_by_class,
    recent_interventions: interventions.map((item) => ({
      id: item.id,
      severity: item.severity,
      recommendation: item.recommendation,
      status: item.status,
      created: item.created,
    })),
    total_learners: dashboard.total_learners,
    total_learners_assessed: dashboard.total_learners_assessed,
    overall_pass_rate: dashboard.overall_pass_rate,
    weak_topics: dashboard.weakest_topics,
    support_indicators: {
      learners_needing_support: learnersNeedingSupport,
      classes_needing_support: dashboard.classes_needing_support.length,
      open_interventions: interventions.filter((item) => item.status !== 'completed' && item.status !== 'dismissed').length,
    },
    data_quality: {
      status: questions.length > 0 && questions.every((question) => Boolean(question.topic_id)) ? 'ready' : 'review',
      mark_completion_rate: analyticsRows.length > 0
        ? Math.round(analyticsRows.reduce((sum, item) => sum + item.mark_completion_rate, 0) / analyticsRows.length)
        : 0,
      mapped_question_rate: questions.length > 0
        ? Math.round((questions.filter((question) => Boolean(question.topic_id)).length / questions.length) * 100)
        : 0,
    },
    disclosure: DEMO_DISCLOSURE,
    limitations: [
      'Illustrative seeded records demonstrate the evidence workflow; they are not verified school or pilot results.',
      'Support indicators require teacher review and are not diagnoses or automated decisions.',
      'Longitudinal improvement requires future follow-up assessments collected during a governed pilot.',
    ],
  }
}

export function getCanonicalDemoStats() {
  const reports = SEEDED_ASSESSMENTS.assessments
    .map((assessment) => getSeededAssessmentReport(assessment.id))
    .filter((report): report is AssessmentReport => report !== null)
  const questions = reports.reduce((sum, report) => sum + report.questions.length, 0)
  const marks = reports.reduce((sum, report) => sum + report.questions.length * report.learners.length, 0)
  const schoolPassRates = IDS.schools
    .map((schoolId) => getSeededSchoolDashboard(schoolId)?.overall_pass_rate)
    .filter((rate): rate is number => rate !== undefined)
  const supportLearners = new Set(
    reports.flatMap((report) => report.analytics.at_risk_learners.map((learner) => learner.learner_id)),
  )

  return {
    schools: SEEDED_SCHOOLS.total,
    classes: SEEDED_CLASSES.total,
    learners: SEEDED_LEARNERS.total,
    assessments: SEEDED_ASSESSMENTS.total,
    questions,
    marks,
    learnersAssessedPerAssessmentAverage: questions > 0 ? marks / questions : 0,
    averagePassRate: schoolPassRates.length > 0
      ? Math.round(schoolPassRates.reduce((sum, rate) => sum + rate, 0) / schoolPassRates.length)
      : 0,
    weakTopics: new Set(reports.flatMap((report) => report.analytics.weak_topics.map((topic) => topic.topic_id))).size,
    learnerSupportSignals: supportLearners.size,
    interventions: SEEDED_INTERVENTIONS.total,
    activeInterventions: SEEDED_INTERVENTIONS.interventions.filter((item) => item.status !== 'completed' && item.status !== 'dismissed').length,
  }
}

// =========================================================================
// Helper: Check if using demo data by catching errors in a query
// =========================================================================

/**
 * Wraps an async query function with a demo data fallback.
 * If the API call fails (backend offline), returns the seeded fallback.
 */
export async function withDemoFallback<T>(
  queryFn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    const result = await queryFn()
    return result
  } catch {
    return fallback
  }
}
