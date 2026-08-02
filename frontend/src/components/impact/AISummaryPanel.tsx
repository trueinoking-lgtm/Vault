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
  const [regenerating, setRegenerating] = useState<SummaryType | null>(null)

  const generateSummary = useCallback(
    async (type: SummaryType, opts?: { force?: boolean }) => {
      // Don't regenerate if already cached (unless force is set)
      if (!opts?.force && summaries[type]) return

      setRegenerating(type)
      setLoading((prev) => ({ ...prev, [type]: true }))
      setErrors((prev) => ({ ...prev, [type]: null }))
      // Clear the cached entry so the loading placeholder shows while regenerating
      if (opts?.force) {
        setSummaries((prev) => ({ ...prev, [type]: null }))
      }

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
        setRegenerating(null)
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
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">AI-Generated Insights</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Generate summaries based on the deterministic analytics above.
        Always refer to the numbers above as the source of truth.
      </p>

      {/* Tabs */}
      <div className="border-b border-[var(--border-subtle)] mb-4">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-subtle)]'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-[var(--bg-surface-raised)] rounded-lg p-4">
        {activeTab === 'teacher' && (
          <SummaryContent
            type="teacher"
            summary={summaries.teacher}
            isLoading={loading.teacher}
            isRegenerating={regenerating === 'teacher'}
            error={errors.teacher}
            onGenerate={(opts) => generateSummary('teacher', opts)}
          />
        )}

        {activeTab === 'intervention' && (
          <SummaryContent
            type="intervention"
            summary={summaries.intervention}
            isLoading={loading.intervention}
            isRegenerating={regenerating === 'intervention'}
            error={errors.intervention}
            onGenerate={(opts) => generateSummary('intervention', opts)}
          />
        )}

        {activeTab === 'remedial' && (
          <SummaryContent
            type="remedial"
            summary={summaries.remedial}
            isLoading={loading.remedial}
            isRegenerating={regenerating === 'remedial'}
            error={errors.remedial}
            onGenerate={(opts) => generateSummary('remedial', opts)}
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
  isRegenerating,
  error,
  onGenerate,
}: {
  type: SummaryType
  summary: any
  isLoading: boolean
  isRegenerating: boolean
  error: string | null
  onGenerate: (opts?: { force?: boolean }) => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
        <span className="ml-3 text-[var(--text-secondary)]">Generating {getSummaryLabel(type)}...</span>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--text-secondary)] mb-4">
          Click the button below to generate a {getSummaryLabel(type).toLowerCase()}.
        </p>
        <button
          onClick={() => onGenerate()}
          className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/90 transition-colors"
        >
          Generate {getSummaryLabel(type)}
        </button>
      </div>
    )
  }

  return (
    <div>
      {summary.source === 'fallback' && (
        <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-[var(--accent-warning)]">
            AI summaries are unavailable. Assessment analytics are still available.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-[var(--accent-warning)]">
            AI generation failed. Showing cached or fallback content.
          </p>
        </div>
      )}

      <div className="prose prose-sm max-w-none">
        {type === 'teacher' && (
          <>
            <div className="whitespace-pre-wrap text-[var(--text-primary)]">{summary.summary}</div>
            {summary.revision_sequence && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Suggested Revision Sequence</h4>
                <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                  {summary.revision_sequence}
                </div>
              </div>
            )}
          </>
        )}

        {type === 'intervention' && (
          <div className="whitespace-pre-wrap text-[var(--text-primary)]">{summary.plan}</div>
        )}

        {type === 'remedial' && (
          <>
            <div className="whitespace-pre-wrap text-[var(--text-primary)]">{summary.outline}</div>
            {summary.mini_test_idea && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                <h4 className="font-medium text-[var(--text-primary)] mb-2">Follow-up Mini-Test Idea</h4>
                <div className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                  {summary.mini_test_idea}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-[var(--text-secondary)]">
          {summary.source === 'ai-generated' ? 'Generated explanation' : 'Fallback content'}
        </div>
        <button
          onClick={() => onGenerate({ force: true })}
          disabled={isRegenerating}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegenerating ? 'Regenerating…' : 'Regenerate'}
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
