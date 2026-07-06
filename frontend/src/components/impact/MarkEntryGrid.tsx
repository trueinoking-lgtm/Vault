'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  useImpactMarks,
  useCreateImpactMark,
  useUpdateImpactMark,
} from '@/lib/hooks/use-impact'
import type { ImpactAssessmentQuestion, ImpactLearner, ImpactMarkEntry } from '@/lib/types/impact'

interface MarkEntryGridProps {
  assessmentId: string
  assessment: {
    total_marks: number
    pass_mark?: number
  }
  learners: ImpactLearner[]
  questions: ImpactAssessmentQuestion[]
}

interface MarkCell {
  learnerId: string
  questionId: string
  score: number | null
  markEntryId?: string
}

/**
 * MarkEntryGrid — Enter marks for learners
 *
 * Features:
 * - Rows = learners, Columns = questions
 * - Score validation (<= max_marks)
 * - Row totals
 * - Mark completion percentage
 * - Keyboard-friendly entry
 * - Autosave
 * - Loading/error states
 */
export function MarkEntryGrid({
  assessmentId,
  assessment,
  learners,
  questions,
}: MarkEntryGridProps) {
  const { data: marksData, isLoading: marksLoading } = useImpactMarks({ assessment_id: assessmentId })
  const createMark = useCreateImpactMark()
  const updateMark = useUpdateImpactMark()

  const [marks, setMarks] = useState<Map<string, MarkCell>>(new Map())
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Sort questions by question number
  const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number)

  // Initialize marks from fetched data
  useEffect(() => {
    if (marksData?.mark_entries) {
      const newMarks = new Map<string, MarkCell>()
      marksData.mark_entries.forEach((entry) => {
        const key = `${entry.learner_id}-${entry.question_id}`
        newMarks.set(key, {
          learnerId: entry.learner_id,
          questionId: entry.question_id,
          score: entry.score,
          markEntryId: entry.id,
        })
      })
      setMarks(newMarks)
    }
  }, [marksData])

  // Cleanup autosave timer on unmount
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  // Get mark cell key
  const getKey = (learnerId: string, questionId: string) => `${learnerId}-${questionId}`

  // Get score for a cell
  const getScore = (learnerId: string, questionId: string): number | null => {
    const key = getKey(learnerId, questionId)
    const cell = marks.get(key)
    return cell?.score ?? null
  }

  // Get question max marks
  const getQuestionMaxMarks = (questionId: string): number => {
    return questions.find((q) => q.id === questionId)?.max_marks ?? 0
  }

  // Calculate row total for a learner
  const getRowTotal = (learnerId: string): number => {
    let total = 0
    sortedQuestions.forEach((q) => {
      const score = getScore(learnerId, q.id)
      if (score !== null) {
        total += score
      }
    })
    return total
  }

  // Calculate total marks entered
  const getTotalMarksEntered = (): number => {
    let total = 0
    marks.forEach((cell) => {
      if (cell.score !== null) {
        total += cell.score
      }
    })
    return total
  }

  // Calculate completion percentage
  const getCompletionPercentage = (): number => {
    const totalCells = learners.length * questions.length
    if (totalCells === 0) return 0
    const filledCells = marks.size
    return Math.round((filledCells / totalCells) * 100)
  }

  // Validate score
  const validateScore = (score: number | null, questionId: string): string | null => {
    if (score === null) return null
    const maxMarks = getQuestionMaxMarks(questionId)
    if (score < 0) return 'Score cannot be negative'
    if (score > maxMarks) return `Score cannot exceed ${maxMarks}`
    return null
  }

  // Handle score change
  const handleScoreChange = (learnerId: string, questionId: string, value: string) => {
    const key = getKey(learnerId, questionId)
    const newMarks = new Map(marks)

    if (value === '' || value === null) {
      newMarks.delete(key)
    } else {
      const score = parseFloat(value)
      if (!isNaN(score)) {
        const error = validateScore(score, questionId)
        setErrors((prev) => {
          const newErrors = new Map(prev)
          if (error) {
            newErrors.set(key, error)
          } else {
            newErrors.delete(key)
          }
          return newErrors
        })

        const existingCell = marks.get(key)
        newMarks.set(key, {
          learnerId,
          questionId,
          score,
          markEntryId: existingCell?.markEntryId,
        })
      }
    }

    setMarks(newMarks)
    setHasChanges(true)

    // Trigger autosave
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
    autosaveTimerRef.current = setTimeout(() => {
      handleAutosave(newMarks)
    }, 2000)
  }

  // Handle keyboard navigation
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    learnerIndex: number,
    questionIndex: number
  ) => {
    const { key } = e

    if (key === 'ArrowRight' || key === 'Tab' && !e.shiftKey) {
      e.preventDefault()
      const nextQuestionIndex = Math.min(questionIndex + 1, sortedQuestions.length - 1)
      const nextKey = getKey(learners[learnerIndex].id, sortedQuestions[nextQuestionIndex].id)
      inputRefs.current.get(nextKey)?.focus()
    } else if (key === 'ArrowLeft' || (key === 'Tab' && e.shiftKey)) {
      e.preventDefault()
      const prevQuestionIndex = Math.max(questionIndex - 1, 0)
      const prevKey = getKey(learners[learnerIndex].id, sortedQuestions[prevQuestionIndex].id)
      inputRefs.current.get(prevKey)?.focus()
    } else if (key === 'ArrowDown') {
      e.preventDefault()
      const nextLearnerIndex = Math.min(learnerIndex + 1, learners.length - 1)
      const nextKey = getKey(learners[nextLearnerIndex].id, sortedQuestions[questionIndex].id)
      inputRefs.current.get(nextKey)?.focus()
    } else if (key === 'ArrowUp') {
      e.preventDefault()
      const prevLearnerIndex = Math.max(learnerIndex - 1, 0)
      const prevKey = getKey(learners[prevLearnerIndex].id, sortedQuestions[questionIndex].id)
      inputRefs.current.get(prevKey)?.focus()
    }
  }

  // Save marks
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const promises: Promise<any>[] = []

      marks.forEach((cell) => {
        if (cell.score !== null) {
          if (cell.markEntryId) {
            // Update existing mark
            promises.push(
              updateMark.mutateAsync({
                id: cell.markEntryId,
                data: { score: cell.score },
              })
            )
          } else {
            // Create new mark
            promises.push(
              createMark.mutateAsync({
                assessment_id: assessmentId,
                question_id: cell.questionId,
                learner_id: cell.learnerId,
                score: cell.score,
                max_score: getQuestionMaxMarks(cell.questionId),
              })
            )
          }
        }
      })

      await Promise.all(promises)
      setHasChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save marks:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Autosave
  const handleAutosave = async (marksToSave: Map<string, MarkCell>) => {
    if (marksToSave.size === 0) return

    setIsSaving(true)
    try {
      const promises: Promise<any>[] = []

      marksToSave.forEach((cell) => {
        if (cell.score !== null) {
          if (cell.markEntryId) {
            promises.push(
              updateMark.mutateAsync({
                id: cell.markEntryId,
                data: { score: cell.score },
              })
            )
          } else {
            promises.push(
              createMark.mutateAsync({
                assessment_id: assessmentId,
                question_id: cell.questionId,
                learner_id: cell.learnerId,
                score: cell.score,
                max_score: getQuestionMaxMarks(cell.questionId),
              })
            )
          }
        }
      })

      await Promise.all(promises)
      setHasChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Autosave failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (marksLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Enter Marks</h2>
          <p className="text-sm text-slate-600 mt-1">
            {learners.length} learners · {questions.length} questions · {getCompletionPercentage()}% complete
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-sm text-slate-500">
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save marks'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>Marks entered</span>
          <span>{getCompletionPercentage()}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              getCompletionPercentage() === 100 ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getCompletionPercentage()}%` }}
          />
        </div>
      </div>

      {/* Marks Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 bg-slate-50 text-left py-3 px-4 text-sm font-medium text-slate-600 border-b border-r border-slate-200 min-w-[150px]">
                Learner
              </th>
              {sortedQuestions.map((q) => (
                <th
                  key={q.id}
                  className="text-center py-3 px-4 text-sm font-medium text-slate-600 border-b border-r border-slate-200 min-w-[80px]"
                >
                  <div>Q{q.question_number}</div>
                  <div className="text-xs text-slate-400 font-normal">/{q.max_marks}</div>
                </th>
              ))}
              <th className="text-center py-3 px-4 text-sm font-medium text-slate-600 border-b border-slate-200 min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {learners.map((learner, learnerIndex) => {
              const rowTotal = getRowTotal(learner.id)
              const hasError = sortedQuestions.some((q) => {
                const key = getKey(learner.id, q.id)
                return errors.has(key)
              })

              return (
                <tr
                  key={learner.id}
                  className={`hover:bg-slate-50 ${hasError ? 'bg-red-50' : ''}`}
                >
                  <td className="sticky left-0 bg-white hover:bg-slate-50 py-3 px-4 text-sm text-slate-900 border-b border-r border-slate-200">
                    <div className="font-medium">{learner.display_name || learner.learner_code}</div>
                    <div className="text-xs text-slate-500">{learner.learner_code}</div>
                  </td>
                  {sortedQuestions.map((question, questionIndex) => {
                    const score = getScore(learner.id, question.id)
                    const key = getKey(learner.id, question.id)
                    const error = errors.get(key)

                    return (
                      <td
                        key={question.id}
                        className={`py-2 px-2 border-b border-r border-slate-200 ${
                          error ? 'bg-red-50' : ''
                        }`}
                      >
                        <input
                          ref={(el) => {
                            if (el) inputRefs.current.set(key, el)
                          }}
                          type="number"
                          value={score ?? ''}
                          onChange={(e) => handleScoreChange(learner.id, question.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, learnerIndex, questionIndex)}
                          min="0"
                          max={question.max_marks}
                          step="0.5"
                          className={`w-full px-2 py-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            error
                              ? 'border-red-300 bg-red-50'
                              : score !== null
                              ? 'border-slate-300 bg-white'
                              : 'border-slate-200 bg-slate-50'
                          }`}
                          placeholder="-"
                        />
                        {error && (
                          <p className="text-xs text-red-600 mt-1">{error}</p>
                        )}
                      </td>
                    )
                  })}
                  <td
                    className={`py-3 px-4 text-center text-sm font-medium border-b border-slate-200 ${
                      assessment.pass_mark && rowTotal >= assessment.pass_mark
                        ? 'text-green-600'
                        : rowTotal > 0
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {rowTotal}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
        <div>
          Total marks entered: {getTotalMarksEntered()} / {assessment.total_marks * learners.length}
        </div>
        <div>
          {errors.size > 0 && (
            <span className="text-red-600">{errors.size} validation errors</span>
          )}
        </div>
      </div>
    </div>
  )
}
