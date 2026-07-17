'use client'

import { useState } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useCreateImpactQuestion,
  useDeleteImpactQuestion,
  useImpactTopics,
} from '@/lib/hooks/use-impact'
import type { ImpactAssessmentQuestion } from '@/lib/types/impact'

interface QuestionMapBuilderProps {
  assessmentId: string
  totalMarks: number
  questions: ImpactAssessmentQuestion[]
}

/**
 * QuestionMapBuilder — Add questions with topic mapping
 */
export function QuestionMapBuilder({
  assessmentId,
  totalMarks,
  questions,
}: QuestionMapBuilderProps) {
  const { data: topicsData, isLoading: topicsLoading } = useImpactTopics()
  const createQuestion = useCreateImpactQuestion()
  const deleteQuestion = useDeleteImpactQuestion()

  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    question_number: '',
    label: '',
    max_marks: '',
    topic_id: '',
    skill_type: 'knowledge' as 'knowledge' | 'comprehension' | 'application' | 'analysis',
    difficulty: '' as 'easy' | 'medium' | 'hard' | '',
  })

  const currentTotal = questions.reduce((sum, q) => sum + q.max_marks, 0)
  const remaining = totalMarks - currentTotal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.question_number || !formData.max_marks) return

    const maxMarks = parseFloat(formData.max_marks)
    if (maxMarks > remaining) {
      alert(`Max marks cannot exceed remaining marks (${remaining})`)
      return
    }

    await createQuestion.mutateAsync({
      assessment_id: assessmentId,
      question_number: parseInt(formData.question_number),
      label: formData.label || undefined,
      max_marks: maxMarks,
      topic_id: formData.topic_id || undefined,
      skill_type: formData.skill_type,
      difficulty: formData.difficulty || undefined,
    })

    setFormData({
      question_number: '',
      label: '',
      max_marks: '',
      topic_id: '',
      skill_type: 'knowledge',
      difficulty: '',
    })
    setShowAddForm(false)
  }

  const handleDelete = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      await deleteQuestion.mutateAsync(questionId)
    }
  }

  if (topicsLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Questions</h2>
          <p className="text-sm text-slate-500 mt-1">
            {questions.length} questions · {currentTotal}/{totalMarks} marks assigned
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          disabled={remaining <= 0}
          className="px-4 py-2 bg-blue-600 text-slate-900 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add question
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
          <span>Marks assigned</span>
          <span>{currentTotal} / {totalMarks}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              currentTotal === totalMarks ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${(currentTotal / totalMarks) * 100}%` }}
          />
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Add question</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Question number *
                  </label>
                  <input
                    type="number"
                    value={formData.question_number}
                    onChange={(e) => setFormData({ ...formData, question_number: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Max marks *
                  </label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                    min="0.5"
                    step="0.5"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Multiple Choice"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Topic
                </label>
                <select
                  value={formData.topic_id}
                  onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select topic</option>
                  {topicsData?.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Skill type
                  </label>
                  <select
                    value={formData.skill_type}
                    onChange={(e) => setFormData({ ...formData, skill_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="knowledge">Knowledge</option>
                    <option value="comprehension">Comprehension</option>
                    <option value="application">Application</option>
                    <option value="analysis">Analysis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuestion.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-slate-900 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {createQuestion.isPending ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <p className="text-slate-500 mb-4">No questions added yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-slate-900 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add first question
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Q#</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Label</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Max Marks</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Topic</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Skill</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Difficulty</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions
                .sort((a, b) => a.question_number - b.question_number)
                .map((question) => (
                  <tr key={question.id} className="border-b border-slate-200">
                    <td className="py-3 px-4 text-sm text-slate-900 font-medium">
                      {question.question_number}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {question.label || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {question.max_marks}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500">
                      {topicsData?.topics.find((t) => t.id === question.topic_id)?.name || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 capitalize">
                      {question.skill_type}
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-500 capitalize">
                      {question.difficulty || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
