'use client'

import type { InterventionRecommendation } from '@/lib/types/impact'

interface InterventionPanelProps {
  interventions: InterventionRecommendation[]
}

/**
 * InterventionPanel — Display recommended interventions
 */
export function InterventionPanel({ interventions }: InterventionPanelProps) {
  if (interventions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No interventions needed</h3>
        <p className="text-slate-600">All learners are performing well. No urgent interventions required.</p>
      </div>
    )
  }

  // Group interventions by severity
  const critical = interventions.filter((i) => i.severity === 'critical')
  const high = interventions.filter((i) => i.severity === 'high')
  const medium = interventions.filter((i) => i.severity === 'medium')
  const low = interventions.filter((i) => i.severity === 'low')

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Recommended Interventions</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-sm text-red-600 mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-700">{critical.length}</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <p className="text-sm text-amber-600 mb-1">High</p>
          <p className="text-2xl font-bold text-amber-700">{high.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">Medium</p>
          <p className="text-2xl font-bold text-yellow-700">{medium.length}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Low</p>
          <p className="text-2xl font-bold text-slate-700">{low.length}</p>
        </div>
      </div>

      {/* Critical Interventions */}
      {critical.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-red-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Critical Interventions
          </h3>
          <div className="space-y-3">
            {critical.map((intervention, index) => (
              <InterventionCard key={index} intervention={intervention} />
            ))}
          </div>
        </div>
      )}

      {/* High Interventions */}
      {high.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-amber-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
            High Priority
          </h3>
          <div className="space-y-3">
            {high.map((intervention, index) => (
              <InterventionCard key={index} intervention={intervention} />
            ))}
          </div>
        </div>
      )}

      {/* Medium Interventions */}
      {medium.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-yellow-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            Medium Priority
          </h3>
          <div className="space-y-3">
            {medium.map((intervention, index) => (
              <InterventionCard key={index} intervention={intervention} />
            ))}
          </div>
        </div>
      )}

      {/* Low Interventions */}
      {low.length > 0 && (
        <div className="mb-8">
          <h3 className="text-md font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
            Low Priority
          </h3>
          <div className="space-y-3">
            {low.map((intervention, index) => (
              <InterventionCard key={index} intervention={intervention} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InterventionCard({ intervention }: { intervention: InterventionRecommendation }) {
  const severityStyles = {
    critical: 'bg-red-50 border-red-200',
    high: 'bg-amber-50 border-amber-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-slate-50 border-slate-200',
  }

  const iconBg = {
    critical: 'bg-red-100',
    high: 'bg-amber-100',
    medium: 'bg-yellow-100',
    low: 'bg-slate-100',
  }

  return (
    <div className={`p-4 rounded-lg border ${severityStyles[intervention.severity]}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg[intervention.severity]}`}>
          {intervention.entity_type === 'topic' ? '📚' : '👤'}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-slate-900">{intervention.entity_name}</p>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                intervention.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : intervention.severity === 'high'
                  ? 'bg-amber-100 text-amber-800'
                  : intervention.severity === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {intervention.severity}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-2">{intervention.recommendation}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="capitalize">{intervention.entity_type}</span>
            <span>{intervention.percentage}%</span>
            <span className="capitalize">{intervention.intervention_type}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
