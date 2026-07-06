'use client'

import { useState, useCallback } from 'react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { impactReportsApi } from '@/lib/api/impact'

type SummaryType = 'teacher' | 'intervention' | 'remedial'

interface AISummaryPanelProps {
  assessmentId: string
}

/**
 * AISummaryPanel — displays AI-generated summaries for assessment analytics.
 *
 * Features:
 * - Manual generation buttons (no auto-trigger on page load)
 * - Timeout handling (30 seconds)
 * - Graceful fallback if AI fails
 * - Hides provider/model details from UI
 * - Caches results by assessment_id
 */
export function AISummaryPanel({ assessmentId }: AISummaryPanelProps) {
  const [activeTab, setActiveTab] = useState<SummaryType>('teacher')
  const [summaries, setSummaries] = useState<Record<SummaryType, any>>({
    teacher: null,
    intervention: null,
    remedial: null,
  })
  const [loading, setLoading] = useState<Record<SummaryType, boolean>>({
    teacher: false,
    intervention: false,
    remedial: false,
  })
  const [errors, setErrors] = useState<Record<SummaryType, string | null>>({
    teacher: null,
    intervention: null,
    remedial: null,
  })

  const generateSummary = useCallback(
    async (type: SummaryType) => {
      // Don't regenerate if already cached
      if (summaries[type]) return

      setLoading((prev) => ({ ...prev, [type]: true }))
      setErrors((prev) => ({ ...prev, [type]: null }))

      try {
        let result: any

        // Create a timeout promise (30 seconds)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI summary request timed out')), 30000)
        )

        // Race between API call and timeout
        const apiPromise = (async () => {
          switch (type) {
            case 'teacher':
              return await impactReportsApi.generateTeacherSummary(assessmentId)
            case 'intervention':
              return await impactReportsApi.generateInterventionPlan(assessmentId)
            case 'remedial':
              return await impactReportsApi.generateRemedialLesson(assessmentId)
          }
        })()

        result = await Promise.race([apiPromise, timeoutPromise])

        setSummaries((prev) => ({ ...prev, [type]: result }))
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to generate AI summary'
        setErrors((prev) => ({ ...prev, [type]: errorMessage }))
        // Set fallback summary
        setSummaries((prev) => ({
          ...prev,
          [type]: getFallbackSummary(type),
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [type]: false }))
      }
    },
    [assessmentId, summaries]
  )

  const tabs: { id: SummaryType; label: string; icon: string }[] = [
    { id: 'teacher', label: 'Teacher Summary', icon: '📝' },
    { id: 'intervention', label: 'Intervention Plan', icon: '🎯' },
    { id: 'remedial', label: 'Remedial Lesson', icon: '📚' },
  ]

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-2">AI-Generated Insights</h3>
      <p className="text-sm text-slate-600 mb-4">
        Generate summaries based on the deterministic analytics above.
        Always refer to the numbers above as the source of truth.
      </p>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-4">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-slate-50 rounded-lg p-4">
        {activeTab === 'teacher' && (
          <SummaryContent
            type="teacher"
            summary={summaries.teacher}
            isLoading={loading.teacher}
            error={errors.teacher}
            onGenerate={() => generateSummary('teacher')}
          />
        )}

        {activeTab === 'intervention' && (
          <SummaryContent
            type="intervention"
            summary={summaries.intervention}
            isLoading={loading.intervention}
            error={errors.intervention}
            onGenerate={() => generateSummary('intervention')}
          />
        )}

        {activeTab === 'remedial' && (
          <SummaryContent
            type="remedial"
            summary={summaries.remedial}
            isLoading={loading.remedial}
            error={errors.remedial}
            onGenerate={() => generateSummary('remedial')}
          />
        )}
      </div>
    </div>
  )
}

// =========================================================================
// Summary Content Component
// =========================================================================

function SummaryContent({
  type,
  summary,
  isLoading,
  error,
  onGenerate,
}: {
  type: SummaryType
  summary: any
  isLoading: boolean
  error: string | null
  onGenerate: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-3 text-slate-600">Generating {getSummaryLabel(type)}...</span>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600 mb-4">
          Click the button below to generate a {getSummaryLabel(type).toLowerCase()}.
        </p>
        <button
          onClick={onGenerate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Generate {getSummaryLabel(type)}
        </button>
      </div>
    )
  }

  return (
    <div>
      {summary.source === 'fallback' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            AI summaries are unavailable. Assessment analytics are still available.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-amber-800">
            AI generation failed. Showing cached or fallback content.
          </p>
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        {type === 'teacher' && (
          <>
            <div className="whitespace-pre-wrap text-slate-800">{summary.summary}</div>
            {summary.revision_sequence && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">Suggested Revision Sequence</h4>
                <div className="whitespace-pre-wrap text-sm text-slate-700">
                  {summary.revision_sequence}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'intervention' && (
          <div className="whitespace-pre-wrap text-slate-800">{summary.plan}</div>
        )}

        {type === 'remedial' && (
          <>
            <div className="whitespace-pre-wrap text-slate-800">{summary.outline}</div>
            {summary.mini_test_idea && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-900 mb-2">Follow-up Mini-Test Idea</h4>
                <div className="whitespace-pre-wrap text-sm text-slate-700">
                  {summary.mini_test_idea}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {summary.source === 'ai-generated' ? 'Generated explanation' : 'Fallback content'}
        </div>
        <button
          onClick={onGenerate}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Regenerate
        </button>
      </div>
    </div>
  )
}

// =========================================================================
// Helper Functions
// =========================================================================

function getSummaryLabel(type: SummaryType): string {
  switch (type) {
    case 'teacher':
      return 'Teacher Summary'
    case 'intervention':
      return 'Intervention Plan'
    case 'remedial':
      return 'Remedial Lesson'
  }
}

function getFallbackSummary(type: SummaryType): any {
  switch (type) {
    case 'teacher':
      return {
        summary: 'AI summary unavailable. Please review the analytics data above.',
        revision_sequence: '',
        source: 'fallback',
      }
    case 'intervention':
      return {
        plan: 'AI intervention plan unavailable. Please review the interventions above.',
        source: 'fallback',
      }
    case 'remedial':
      return {
        outline: 'AI remedial lesson unavailable. Please review the weak topics above.',
        mini_test_idea: '',
        source: 'fallback',
      }
  }
}
