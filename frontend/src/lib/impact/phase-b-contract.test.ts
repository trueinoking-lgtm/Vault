import { describe, expect, it } from 'vitest'
import {
  OVERVIEW_WORKFLOW,
  STAKEHOLDER_DEMO_DISCLOSURE,
  HIVEMIND_NAV_ITEMS,
  getClassRoute,
  getSchoolRoute,
} from './product-navigation'

describe('Phase B standalone product navigation', () => {
  it('exposes every required product destination without Vault navigation', () => {
    expect(HIVEMIND_NAV_ITEMS.map((item) => [item.label, item.href])).toEqual([
      ['Overview', '/impact'],
      ['Schools', '/impact/schools'],
      ['Classes', '/impact/classes'],
      ['Assessments', '/impact/assessments'],
      ['Interventions', '/impact/interventions'],
      ['Reports', '/impact/reports'],
      ['Stakeholder Demo', '/impact/stakeholder-demo'],
    ])

    expect(HIVEMIND_NAV_ITEMS.some((item) => /vault|notebook|provider/i.test(item.label))).toBe(false)
  })

  it('links every guided overview step to a functioning product route', () => {
    expect(OVERVIEW_WORKFLOW.map((step) => step.label)).toEqual([
      'Select a school',
      'Review classes',
      'Open an assessment',
      'Identify weak topics',
      'Review learner-support signals',
      'Track interventions',
      'Export a report',
    ])

    expect(OVERVIEW_WORKFLOW.every((step) => step.href.startsWith('/impact'))).toBe(true)
    expect(new Set(OVERVIEW_WORKFLOW.map((step) => step.href)).size).toBeGreaterThan(4)
  })

  it('uses stable detail routes for school and class workflows', () => {
    expect(getSchoolRoute('school-pilot')).toBe('/impact/schools/school-pilot')
    expect(getClassRoute('class-pilot-1a')).toBe('/impact/classes/class-pilot-1a')
  })

  it('keeps the stakeholder demo limitation explicit', () => {
    expect(STAKEHOLDER_DEMO_DISCLOSURE).toBe(
      'An illustration of how aggregated school intelligence could be presented. It is not connected to Ministry systems.'
    )
  })
})
