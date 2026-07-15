import apiClient from './client'

export interface PilotWorkspace {
  id: string
  dataset_mode: 'pilot'
  school_name: string
  district: string
  province: string
  school_type: string
  primary_contact: string
  academic_year: string
  term: string
  pilot_start_date: string
  status: 'draft' | 'onboarding' | 'active' | 'paused' | 'completed'
}

export interface ImportPreviewRow {
  row_number: number
  data: Record<string, string | number>
  errors: string[]
  accepted: boolean
}

export interface ImportPreview {
  status: 'pending_confirmation'
  accepted_count: number
  rejected_count: number
  errors: string[]
  rows: ImportPreviewRow[]
}

export interface ReadinessItem { key: string; label: string; state: string }
export interface PilotReadiness { dataset_mode: 'pilot'; state: string; progress_percent: number; blockers: string[]; items: ReadinessItem[] }

export const pilotApi = {
  mode: async () => (await apiClient.get('/impact/pilot/mode')).data,
  workspaces: async () => (await apiClient.get<Array<PilotWorkspace | { workspace: PilotWorkspace }>>('/impact/pilot/workspaces')).data,
  createWorkspace: async (data: Omit<PilotWorkspace, 'id' | 'dataset_mode'>) => (await apiClient.post<PilotWorkspace>('/impact/pilot/workspaces', data)).data,
  updateStatus: async (workspaceId: string, status: PilotWorkspace['status']) => (await apiClient.put<PilotWorkspace>(`/impact/pilot/workspaces/${workspaceId}/status`, { status })).data,
  readiness: async (workspaceId: string) => (await apiClient.get<PilotReadiness>(`/impact/pilot/workspaces/${workspaceId}/readiness`)).data,
  inviteMember: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/members/invite`, data)).data,
  createClass: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/classes`, data)).data,
  classes: async (workspaceId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/classes`)).data,
  learners: async (workspaceId: string) => (await apiClient.get<Array<Record<string, unknown>>>(`/impact/pilot/workspaces/${workspaceId}/learners`)).data,
  previewLearners: async (workspaceId: string, csv: string) => (await apiClient.post<ImportPreview>(`/impact/pilot/workspaces/${workspaceId}/learners/import/preview`, { csv_text: csv })).data,
  confirmLearners: async (workspaceId: string, csv: string) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/learners/import/confirm`, { csv_text: csv })).data,
  createSubject: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/subjects`, data)).data,
  subjects: async (workspaceId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/subjects`)).data,
  createAssessment: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/assessments`, data)).data,
  assessments: async (workspaceId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/assessments`)).data,
  previewMarks: async (workspaceId: string, assessmentId: string, csv: string) => (await apiClient.post<ImportPreview>(`/impact/pilot/workspaces/${workspaceId}/assessments/${assessmentId}/marks/import/preview`, { csv_text: csv })).data,
  confirmMarks: async (workspaceId: string, assessmentId: string, csv: string) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/assessments/${assessmentId}/marks/import/confirm`, { csv_text: csv })).data,
  saveMarkGrid: async (workspaceId: string, assessmentId: string, rows: Array<Record<string, unknown>>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/assessments/${assessmentId}/marks/grid`, { rows })).data,
  analysis: async (workspaceId: string, assessmentId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/assessments/${assessmentId}/analysis`)).data,
  createIntervention: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/interventions`, data)).data,
  verifyIntervention: async (workspaceId: string, interventionId: string, data: Record<string, unknown>) => (await apiClient.put(`/impact/pilot/workspaces/${workspaceId}/interventions/${interventionId}`, data)).data,
  comparison: async (workspaceId: string, followUpId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/assessments/${followUpId}/comparison`)).data,
  generateReport: async (workspaceId: string, data: Record<string, unknown>) => (await apiClient.post(`/impact/pilot/workspaces/${workspaceId}/reports`, data)).data,
  reports: async (workspaceId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/reports`)).data,
  downloadReportCsv: async (workspaceId: string, reportId: string, version: unknown) => {
    const response = await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/reports/${reportId}.csv`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `hivemind-pilot-report-v${String(version)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },
  audit: async (workspaceId: string) => (await apiClient.get(`/impact/pilot/workspaces/${workspaceId}/audit`)).data,
  downloadTemplate: async (name: 'learners' | 'assessment-structure' | 'marks') => {
    const response = await apiClient.get(`/impact/pilot/templates/${name}.csv`, { responseType: 'blob' })
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `hivemind-${name}.csv`
    link.click()
    URL.revokeObjectURL(url)
  },
}
