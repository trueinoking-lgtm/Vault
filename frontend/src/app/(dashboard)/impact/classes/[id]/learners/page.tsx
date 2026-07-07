'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useImpactClassGroup,
  useImpactLearners,
  useCreateImpactLearner,
} from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Class Learners Page
 *
 * Lists learners enrolled in a class and allows adding new learner codes.
 */
export default function ClassLearnersPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data: classGroup, isLoading: classLoading } = useImpactClassGroup(id)
  const { data: learnersData, isLoading: learnersLoading } = useImpactLearners(id)
  const createLearner = useCreateImpactLearner()
  const [showAddForm, setShowAddForm] = useState(false)
  const [learnerCode, setLearnerCode] = useState('')
  const [displayName, setDisplayName] = useState('')

  const isLoading = classLoading || learnersLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!learnerCode || !classGroup) return

    await createLearner.mutateAsync({
      school_id: classGroup.school_id,
      class_group_id: id,
      learner_code: learnerCode,
      display_name: displayName || undefined,
    })

    setLearnerCode('')
    setDisplayName('')
    setShowAddForm(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!classGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Class not found</h2>
          <Link href="/impact/classes" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to classes
          </Link>
        </div>
      </div>
    )
  }

  const learners = learnersData?.learners ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/impact/classes"
              className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
            >
              ← Back to classes
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">{classGroup.name}</h1>
            <p className="text-slate-600 mt-1">
              {[classGroup.grade_level, classGroup.academic_year, classGroup.teacher_name]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add learner
          </button>
        </div>

        {/* Learners List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          {learners.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No learners yet</h3>
              <p className="text-slate-600 mb-4">
                No learners yet. Add learners using codes like L001, L002, L003.
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Learner Code
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {learners.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono text-slate-900">
                      {learner.learner_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {learner.display_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          learner.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : learner.status === 'inactive'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {learner.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Learner Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Add learner</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Learner code *
                  </label>
                  <input
                    type="text"
                    value={learnerCode}
                    onChange={(e) => setLearnerCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. L001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Display name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setLearnerCode('')
                      setDisplayName('')
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLearner.isPending}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {createLearner.isPending ? 'Adding...' : 'Add learner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
