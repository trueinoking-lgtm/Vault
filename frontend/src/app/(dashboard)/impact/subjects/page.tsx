'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useImpactSubjects, useCreateImpactSubject, useImpactTopics, useCreateImpactTopic } from '@/lib/hooks/use-impact'

/**
 * Impact Intelligence — Subjects & Topics Page
 */
export default function ImpactSubjectsPage() {
  const { data: subjectsData, isLoading } = useImpactSubjects()
  const createSubject = useCreateImpactSubject()
  const createTopic = useCreateImpactTopic()
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showTopicForm, setShowTopicForm] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [subjectForm, setSubjectForm] = useState({ name: '', level: '', curriculum: '' })
  const [topicForm, setTopicForm] = useState({ subject_id: '', name: '', strand: '', syllabus_code: '' })

  const { data: topicsData } = useImpactTopics(selectedSubject || undefined)

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subjectForm.name) return
    await createSubject.mutateAsync({
      name: subjectForm.name,
      level: subjectForm.level || undefined,
      curriculum: subjectForm.curriculum || undefined,
    })
    setSubjectForm({ name: '', level: '', curriculum: '' })
    setShowSubjectForm(false)
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicForm.subject_id || !topicForm.name) return
    await createTopic.mutateAsync({
      subject_id: topicForm.subject_id,
      name: topicForm.name,
      strand: topicForm.strand || undefined,
      syllabus_code: topicForm.syllabus_code || undefined,
    })
    setTopicForm({ subject_id: '', name: '', strand: '', syllabus_code: '' })
    setShowTopicForm(false)
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
          <h1 className="text-3xl font-bold text-slate-900">Subjects &amp; Topics</h1>
          <p className="text-slate-600 mt-1">Manage subjects and their syllabus topics</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowTopicForm(true)
              setTopicForm({ ...topicForm, subject_id: selectedSubject || '' })
            }}
            className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Add topic
          </button>
          <button
            onClick={() => setShowSubjectForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add subject
          </button>
        </div>
      </div>

      {/* Create Subject Form Modal */}
      {showSubjectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create subject</h2>
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject name *</label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
                <input
                  type="text"
                  value={subjectForm.level}
                  onChange={(e) => setSubjectForm({ ...subjectForm, level: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Ordinary Level"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Curriculum</label>
                <input
                  type="text"
                  value={subjectForm.curriculum}
                  onChange={(e) => setSubjectForm({ ...subjectForm, curriculum: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Cambridge IGCSE"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSubjectForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubject.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createSubject.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Topic Form Modal */}
      {showTopicForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Create topic</h2>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                <select
                  value={topicForm.subject_id}
                  onChange={(e) => setTopicForm({ ...topicForm, subject_id: e.target.value })}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic name *</label>
                <input
                  type="text"
                  value={topicForm.name}
                  onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Algebra"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Strand</label>
                <input
                  type="text"
                  value={topicForm.strand}
                  onChange={(e) => setTopicForm({ ...topicForm, strand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Number and Algebra"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Syllabus code</label>
                <input
                  type="text"
                  value={topicForm.syllabus_code}
                  onChange={(e) => setTopicForm({ ...topicForm, syllabus_code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. MTH.ALG.01"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTopicForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTopic.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createTopic.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subjects Grid */}
      <div className="space-y-4">
        {subjectsData?.subjects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No subjects yet</h3>
            <p className="text-slate-600 mb-4">Create your first subject to get started</p>
            <button
              onClick={() => setShowSubjectForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsData?.subjects.map((subject) => (
              <div
                key={subject.id}
                className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 ${
                  selectedSubject === subject.id
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:shadow-md hover:border-slate-300'
                }`}
                onClick={() => setSelectedSubject(selectedSubject === subject.id ? null : subject.id)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{subject.name}</h3>
                    {subject.level && <p className="text-sm text-slate-500">{subject.level}</p>}
                  </div>
                </div>
                {subject.curriculum && (
                  <p className="text-xs text-slate-400">{subject.curriculum}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics for Selected Subject */}
      {selectedSubject && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Topics for {subjectsData?.subjects.find((s) => s.id === selectedSubject)?.name || 'subject'}
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            {topicsData?.topics.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-600">No topics yet for this subject.</p>
                <button
                  onClick={() => {
                    setShowTopicForm(true)
                    setTopicForm({ ...topicForm, subject_id: selectedSubject })
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Add topic
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {topicsData?.topics.map((topic) => (
                  <div key={topic.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-900">{topic.name}</h4>
                        <p className="text-sm text-slate-500">
                          {[topic.strand, topic.syllabus_code].filter(Boolean).join(' · ') || 'No additional info'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
