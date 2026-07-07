'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useImpactAssessments,
  useCreateImpactAssessment,
  useImpactSchools,
  useImpactClassGroups,
  useImpactSubjects,
} from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Assessments Page
 */
export default function ImpactAssessmentsPage() {
  const { data: assessmentsData, isLoading } = useImpactAssessments()
  const { data: schoolsData } = useImpactSchools()
  const { data: classesData } = useImpactClassGroups()
  const { data: subjectsData } = useImpactSubjects()
  const createAssessment = useCreateImpactAssessment()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    school_id: '',
    class_group_id: '',
    subject_id: '',
    title: '',
    assessment_type: 'exam' as 'test' | 'exam' | 'quiz' | 'assignment',
    term: '',
    total_marks: '',
    pass_mark: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.school_id || !formData.class_group_id || !formData.subject_id || !formData.title || !formData.total_marks) return

    await createAssessment.mutateAsync({
      school_id: formData.school_id,
      class_group_id: formData.class_group_id,
      subject_id: formData.subject_id,
      title: formData.title,
      assessment_type: formData.assessment_type,
      term: formData.term || undefined,
      total_marks: parseInt(formData.total_marks),
      pass_mark: formData.pass_mark ? parseInt(formData.pass_mark) : undefined,
    })

    setFormData({
      school_id: '',
      class_group_id: '',
      subject_id: '',
      title: '',
      assessment_type: 'exam',
      term: '',
      total_marks: '',
      pass_mark: '',
    })
    setShowCreateForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/impact" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to Impact Intelligence
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Assessments</h1>
          <p className="text-slate-600 mt-1">Create and manage assessments</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create assessment
        </button>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create assessment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  School *
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select school</option>
                  {schoolsData?.schools.map((school) => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Class *
                </label>
                <select
                  value={formData.class_group_id}
                  onChange={(e) => setFormData({ ...formData, class_group_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select class</option>
                  {classesData?.class_groups.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select subject</option>
                  {subjectsData?.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mid-Term Exam"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.assessment_type}
                    onChange={(e) => setFormData({ ...formData, assessment_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Term
                  </label>
                  <input
                    type="text"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Term 1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total marks *
                  </label>
                  <input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 100"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pass mark
                  </label>
                  <input
                    type="number"
                    value={formData.pass_mark}
                    onChange={(e) => setFormData({ ...formData, pass_mark: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 50"
                    min="0"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAssessment.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createAssessment.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assessments List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {assessmentsData?.assessments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No assessments yet</h3>
            <p className="text-slate-600 mb-4">Get started by creating your first assessment</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create assessment
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {assessmentsData?.assessments.map((assessment) => (
              <Link
                key={assessment.id}
                href={`/impact/assessments/${assessment.id}`}
                className="block p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-slate-900">{assessment.title}</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      {assessment.assessment_type} · {assessment.total_marks} marks
                      {assessment.pass_mark && ` · Pass: ${assessment.pass_mark}`}
                      {assessment.term && ` · ${assessment.term}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        assessment.status === 'graded'
                          ? 'bg-green-100 text-green-800'
                          : assessment.status === 'published'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {assessment.status}
                    </span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
