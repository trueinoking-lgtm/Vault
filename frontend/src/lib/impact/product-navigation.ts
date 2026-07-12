import {
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Presentation,
  Target,
  type LucideIcon,
} from 'lucide-react'

export interface ProductNavigationItem {
  label: string
  href: string
  icon: LucideIcon
  description: string
}

export const ZIMLEARNGRAPH_NAV_ITEMS: ProductNavigationItem[] = [
  { label: 'Overview', href: '/impact', icon: BarChart3, description: 'System summary and guided workflow' },
  { label: 'Schools', href: '/impact/schools', icon: Building2, description: 'School performance and readiness' },
  { label: 'Classes', href: '/impact/classes', icon: GraduationCap, description: 'Class evidence and learner support' },
  { label: 'Assessments', href: '/impact/assessments', icon: ClipboardCheck, description: 'Questions, marks, results and support' },
  { label: 'Interventions', href: '/impact/interventions', icon: Target, description: 'Teacher-led support actions' },
  { label: 'Reports', href: '/impact/reports', icon: FileText, description: 'Print-ready evidence summaries' },
  { label: 'Stakeholder Demo', href: '/impact/stakeholder-demo', icon: Presentation, description: 'Illustrative aggregate intelligence' },
]

export const OVERVIEW_WORKFLOW = [
  { step: 1, label: 'Select a school', description: 'Choose one of the three seeded schools.', href: '/impact/schools' },
  { step: 2, label: 'Review classes', description: 'See teachers, cohorts and recent assessment status.', href: '/impact/classes' },
  { step: 3, label: 'Open an assessment', description: 'Inspect one complete teacher-marked assessment.', href: '/impact/assessments/assess-math-term1' },
  { step: 4, label: 'Identify weak topics', description: 'Trace questions to curriculum-topic evidence.', href: '/impact/assessments/assess-math-term1?view=results' },
  { step: 5, label: 'Review learner-support signals', description: 'Review anonymous codes requiring teacher verification.', href: '/impact/assessments/assess-math-term1?view=support' },
  { step: 6, label: 'Track interventions', description: 'Review deterministic, teacher-led support actions.', href: '/impact/interventions' },
  { step: 7, label: 'Export a report', description: 'Open a print-ready school evidence report.', href: '/impact/schools/school-pilot/report' },
] as const

export const STAKEHOLDER_DEMO_DISCLOSURE =
  'An illustration of how aggregated school intelligence could be presented. It is not connected to Ministry systems.'

export const getSchoolRoute = (schoolId: string) => `/impact/schools/${schoolId}`
export const getClassRoute = (classId: string) => `/impact/classes/${classId}`
export const getLearnerRoute = (classId: string) => `/impact/classes/${classId}/learners`
