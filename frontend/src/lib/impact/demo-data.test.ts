import { describe, expect, it } from 'vitest'

import {
  DEMO_DISCLOSURE,
  SEEDED_ASSESSMENTS,
  SEEDED_CLASSES,
  SEEDED_LEARNERS,
  SEEDED_SCHOOLS,
  getCanonicalDemoStats,
  getSeededAssessment,
  getSeededAssessmentReport,
  getSeededClassGroup,
  getSeededSchool,
  getSeededSchoolReport,
} from './demo-data'

describe('canonical HiveMind Intelligence demo evidence', () => {
  it('has one reconciling multi-school baseline', () => {
    const stats = getCanonicalDemoStats()

    expect(stats).toMatchObject({
      schools: 3,
      classes: 6,
      learners: 180,
      assessments: 6,
    })
    expect(SEEDED_SCHOOLS.total).toBe(stats.schools)
    expect(SEEDED_CLASSES.total).toBe(stats.classes)
    expect(SEEDED_LEARNERS.total).toBe(stats.learners)
    expect(SEEDED_ASSESSMENTS.total).toBe(stats.assessments)
    expect(stats.questions).toBe(39)
    expect(stats.marks).toBe(1166)
    expect(stats.marks).toBe(stats.questions * stats.learnersAssessedPerAssessmentAverage)
    expect(stats.averagePassRate).toBe(57)
    expect(stats.weakTopics).toBe(5)
    expect(stats.learnerSupportSignals).toBe(39)
    expect(stats.interventions).toBe(8)
    expect(stats.activeInterventions).toBe(7)
    expect(stats.averagePassRate).toBeGreaterThan(0)
  })

  it('resolves every seeded entity by stable id', () => {
    for (const school of SEEDED_SCHOOLS.schools) {
      expect(getSeededSchool(school.id)).toEqual(school)
    }
    for (const classGroup of SEEDED_CLASSES.class_groups) {
      expect(getSeededClassGroup(classGroup.id)).toEqual(classGroup)
    }
    for (const assessment of SEEDED_ASSESSMENTS.assessments) {
      expect(getSeededAssessment(assessment.id)).toEqual(assessment)
    }
  })

  it('builds a complete report for every seeded assessment', () => {
    for (const assessment of SEEDED_ASSESSMENTS.assessments) {
      const report = getSeededAssessmentReport(assessment.id)
      expect(report?.assessment.id).toBe(assessment.id)
      expect(report?.school?.id).toBe(assessment.school_id)
      expect(report?.class_group?.id).toBe(assessment.class_group_id)
      expect(report?.questions.length).toBeGreaterThan(0)
      expect(report?.learners.length).toBeGreaterThan(0)
      expect(report?.analytics.learners_assessed).toBe(report?.analytics.total_learners)
      expect(report?.analytics.mark_completion_rate).toBe(100)
      expect(report?.analytics.question_performance.length).toBe(report?.questions.length)
      expect(report?.analytics.topic_performance.length).toBeGreaterThan(0)
      expect(report?.analytics.interventions).toBeDefined()
    }
  })

  it('builds a complete report for every seeded school', () => {
    for (const school of SEEDED_SCHOOLS.schools) {
      const report = getSeededSchoolReport(school.id)
      expect(report?.school.id).toBe(school.id)
      expect(report?.classes).toHaveLength(2)
      expect(report?.assessments).toHaveLength(2)
      expect(report?.subjects.length).toBeGreaterThan(0)
      expect(report?.total_learners).toBeGreaterThan(0)
      expect(report?.weak_topics.length).toBeGreaterThan(0)
      expect(report?.support_indicators).toBeDefined()
      expect(report?.recent_interventions).toBeDefined()
      expect(report?.data_quality.status).toBeTruthy()
      expect(report?.disclosure).toBe(DEMO_DISCLOSURE)
      expect(report?.limitations.length).toBeGreaterThan(0)
    }
  })

  it('does not resolve unknown ids to contradictory fallback entities', () => {
    expect(getSeededSchool('missing')).toBeNull()
    expect(getSeededClassGroup('missing')).toBeNull()
    expect(getSeededAssessment('missing')).toBeNull()
    expect(getSeededAssessmentReport('missing')).toBeNull()
    expect(getSeededSchoolReport('missing')).toBeNull()
  })
})
