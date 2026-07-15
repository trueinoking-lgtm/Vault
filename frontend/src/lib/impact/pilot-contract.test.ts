import { describe, expect, it } from 'vitest'
import {
  PILOT_DISCLOSURE,
  PILOT_REPORT_DISCLOSURE,
  PILOT_SETUP_STEPS,
  PILOT_STATUS_OPTIONS,
  PILOT_WORKFLOW,
  roleCan,
} from './pilot-contract'

describe('Phase C real pilot contract', () => {
  it('keeps the pilot disclosure distinct from demo evidence', () => {
    expect(PILOT_DISCLOSURE).toBe('Verified pilot workspace. Data entered by participating school staff.')
    expect(PILOT_DISCLOSURE).not.toMatch(/seeded|demonstration/i)
    expect(PILOT_REPORT_DISCLOSURE).toContain('does not establish causal impact')
    expect(PILOT_REPORT_DISCLOSURE).toContain('not Ministry-verified evidence')
  })

  it('covers all requested onboarding checklist steps', () => {
    expect(PILOT_SETUP_STEPS).toEqual([
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
    ])
    expect(PILOT_STATUS_OPTIONS).toEqual(['draft', 'onboarding', 'active', 'paused', 'completed'])
  })

  it('defines a complete controlled-pilot workflow without unsupported scope', () => {
    expect(PILOT_WORKFLOW.map((step) => step.label)).toEqual([
      'Create pilot school',
      'Add teacher access',
      'Create a class',
      'Import learner codes',
      'Configure subject and topics',
      'Add diagnostic assessment',
      'Import marks',
      'Verify intervention',
      'Add follow-up assessment',
      'Compare results',
      'Generate pilot report',
    ])
    expect(PILOT_WORKFLOW.some((step) => /parent|ministry|chat|automated marking/i.test(step.label))).toBe(false)
  })

  it('keeps role permissions least-privilege', () => {
    expect(roleCan('owner', 'release_controls')).toBe(true)
    expect(roleCan('pilot_admin', 'school_setup')).toBe(true)
    expect(roleCan('teacher', 'marks_write')).toBe(true)
    expect(roleCan('teacher', 'school_setup')).toBe(false)
    expect(roleCan('viewer', 'reports_read')).toBe(true)
    expect(roleCan('viewer', 'marks_write')).toBe(false)
  })
})
