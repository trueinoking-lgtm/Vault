'use client'

import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  UserCheck,
  X,
} from 'lucide-react'

import {
  useClassProgress,
  useClassLearners,
  useClassActivity,
} from '@/lib/hooks/use-teacher'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Button } from '@/components/ui/button'

function StatCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | number
  className?: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <Icon className={`h-4 w-4 ${className ?? 'text-slate-500'}`} />
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="ml-auto text-sm font-semibold text-slate-950 dark:text-slate-50">
        {value}
      </span>
    </div>
  )
}

export default function TeacherClassOverviewPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const classroomId = params.id as string

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useClassProgress(classroomId)
  const {
    data: learners,
    isLoading: learnersLoading,
    isError: learnersError,
    refetch: refetchLearners,
  } = useClassLearners(classroomId)
  const {
    data: activity,
    isLoading: activityLoading,
    isError: activityError,
    refetch: refetchActivity,
  } = useClassActivity(classroomId, 50)

  const isLoading = summaryLoading || learnersLoading || activityLoading

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        </div>
      </div>
    )
  }

  if (summaryError || !summary) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('schools.teacherLoadError')}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchSummary()}>
              {t('common.retryConnection')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Back link */}
        <button
          onClick={() => router.push('/teacher')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('schools.backToDashboard')}
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {t('schools.classroomOverview')}
          </p>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              {summary.classroom_name}
            </h1>
            {summary.data_status === 'limited_user_scoping' && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {t('schools.limitedData')}
              </span>
            )}
          </div>
          {(summary.subject || summary.grade_level) && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {[summary.subject, summary.grade_level].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* Privacy notice */}
        <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-400">
          {t('schools.privacyNotice')}
        </div>

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={Users}
            label={t('schools.learnerCount')}
            value={`${summary.active_learner_count}/${summary.learner_count}`}
          />
          <StatCard
            icon={BookOpen}
            label={t('schools.assignmentCount')}
            value={summary.active_assignment_count}
          />
          <StatCard
            icon={BarChart3}
            label={t('schools.needsPractice')}
            value={summary.needs_practice_leaf_count}
            className="text-amber-500"
          />
          <StatCard
            icon={CheckCircle}
            label={t('schools.remembered')}
            value={summary.remembered_leaf_count}
            className="text-emerald-500"
          />
          <StatCard
            icon={BarChart3}
            label={t('schools.needsReview')}
            value={summary.needs_review_leaf_count}
            className="text-orange-400"
          />
          <StatCard
            icon={Users}
            label={t('schools.activeLearnerCount')}
            value={summary.active_learner_count}
          />
          <StatCard
            icon={Clock}
            label={t('schools.lastActivity')}
            value={
              summary.last_activity_at
                ? new Date(summary.last_activity_at).toLocaleDateString()
                : '—'
            }
          />
        </div>

        {/* ================================================================ */}
        {/* Learners Section                                                  */}
        {/* ================================================================ */}

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
              <Users className="h-4 w-4" />
              {t('schools.learners')}
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchLearners()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {learnersError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-400">{t('schools.teacherLoadError')}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchLearners()}>
                {t('common.retryConnection')}
              </Button>
            </div>
          )}

          {!learnersError && learners?.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-8 dark:border-slate-700">
              <Users className="mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('schools.noLearners')}
              </p>
            </div>
          )}

          {!learnersError && learners && learners.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-2 font-medium">{t('schools.learnerId')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.enrollmentStatus')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.needsPractice')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.needsReview')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.remembered')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.lastActivity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.map((l) => (
                    <tr
                      key={l.enrollment_id}
                      className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    >
                      <td className="px-3 py-2 font-medium text-slate-950 dark:text-slate-50">
                        {l.learner_display_name || l.learner_id}
                      </td>
                      <td className="px-3 py-2">
                        {l.enrollment_active ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle className="h-3 w-3" /> {t('schools.enrolled')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <X className="h-3 w-3" /> {t('schools.deactivated')}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">{l.needs_practice_leaf_count}</td>
                      <td className="px-3 py-2">{l.needs_review_leaf_count}</td>
                      <td className="px-3 py-2">{l.remembered_leaf_count}</td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {l.last_activity_at
                          ? new Date(l.last_activity_at).toLocaleDateString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* Recent Activity Section                                           */}
        {/* ================================================================ */}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
              <Activity className="h-4 w-4" />
              {t('schools.recentActivity')}
            </h2>
            <Button variant="outline" size="sm" onClick={() => refetchActivity()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {activityError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
              <p className="text-sm text-red-700 dark:text-red-400">{t('schools.teacherLoadError')}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchActivity()}>
                {t('common.retryConnection')}
              </Button>
            </div>
          )}

          {!activityError && activity?.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-8 dark:border-slate-700">
              <Activity className="mb-3 h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('schools.noActivity')}
              </p>
            </div>
          )}

          {!activityError && activity && activity.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800">
                    <th className="px-3 py-2 font-medium">{t('schools.activityType')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.learnerId')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.eventNotebook')}</th>
                    <th className="px-3 py-2 font-medium">{t('schools.eventTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((ev) => (
                    <tr
                      key={ev.event_id}
                      className="border-b border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300"
                    >
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            ev.event_type === 'remembered'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : ev.event_type === 'needs_review'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          {ev.event_type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {ev.learner_id ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {ev.notebook_id}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {new Date(ev.event_time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
