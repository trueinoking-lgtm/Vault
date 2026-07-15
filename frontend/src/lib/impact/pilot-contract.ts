export const PILOT_DISCLOSURE = 'Verified pilot workspace. Data entered by participating school staff.'

export const PILOT_REPORT_DISCLOSURE = 'This report summarizes data entered during a controlled school pilot. It does not establish causal impact and is not Ministry-verified evidence.'

export const PILOT_STATUS_OPTIONS = ['draft', 'onboarding', 'active', 'paused', 'completed'] as const

export const PILOT_SETUP_STEPS = [
  'School created',
  'Teacher added',
  'Class created',
  'Learners imported',
  'Subject/topics configured',
  'Diagnostic assessment added',
  'Marks entered',
  'Intervention recorded',
  'Follow-up assessment completed',
  'Report generated',
] as const

export const PILOT_WORKFLOW = [
  { step: 1, label: 'Create pilot school', id: 'school' },
  { step: 2, label: 'Add teacher access', id: 'teacher' },
  { step: 3, label: 'Create a class', id: 'class' },
  { step: 4, label: 'Import learner codes', id: 'learners' },
  { step: 5, label: 'Configure subject and topics', id: 'subject' },
  { step: 6, label: 'Add diagnostic assessment', id: 'diagnostic' },
  { step: 7, label: 'Import marks', id: 'marks' },
  { step: 8, label: 'Verify intervention', id: 'intervention' },
  { step: 9, label: 'Add follow-up assessment', id: 'follow-up' },
  { step: 10, label: 'Compare results', id: 'comparison' },
  { step: 11, label: 'Generate pilot report', id: 'report' },
] as const

const ROLE_PERMISSIONS: Record<string, readonly string[]> = {
  owner: ['*'],
  pilot_admin: ['school_setup', 'members_manage', 'classes_write', 'learners_write', 'assessments_write', 'marks_write', 'intervention_update', 'reports_read', 'reports_generate'],
  teacher: ['assigned_classes_read', 'assessments_write', 'marks_write', 'support_indicators_write', 'intervention_update', 'reports_read'],
  viewer: ['dashboards_read', 'reports_read'],
}

export function roleCan(role: string, permission: string) {
  const permissions = ROLE_PERMISSIONS[role] ?? []
  return permissions.includes('*') || permissions.includes(permission)
}

export type PilotReadinessState = 'Not started' | 'In progress' | 'Ready' | 'Blocked' | 'Completed'
