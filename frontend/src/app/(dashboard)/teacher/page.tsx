'use client'

import {
  GraduationCap,
  Loader2,
  RefreshCw,
  Users,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from 'lucide-react'

import { useTeacherClasses } from '@/lib/hooks/use-teacher'
import { useTranslation } from '@/lib/hooks/use-translation'
import type { TeacherClassSummary } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

function ClassCard({ cls }: { cls: TeacherClassSummary }) {
  const { t } = useTranslation()

  return (
    <Link href={`/teacher/classes/${cls.classroom_id}`}>
      <div className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-slate-700 dark:text-slate-200" />
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                {cls.classroom_name}
              </h2>
            </div>
            {(cls.subject || cls.grade_level) && (
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                {[cls.subject, cls.grade_level].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {cls.data_status === 'limited_user_scoping' && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {t('schools.limitedData')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatCard
            icon={Users}
            label={t('schools.learnerCount')}
            value={`${cls.active_learner_count}/${cls.learner_count}`}
          />
          <StatCard
            icon={BookOpen}
            label={t('schools.assignmentCount')}
            value={cls.active_assignment_count}
          />
          <StatCard
            icon={BarChart3}
            label={t('schools.needsPractice')}
            value={cls.needs_practice_leaf_count}
            className="text-amber-500"
          />
          <StatCard
            icon={CheckCircle}
            label={t('schools.remembered')}
            value={cls.remembered_leaf_count}
            className="text-emerald-500"
          />
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t('schools.lastActivity')}:
            {' '}
            {cls.last_activity_at
              ? new Date(cls.last_activity_at).toLocaleDateString()
              : '—'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TeacherDashboardPage() {
  const { t } = useTranslation()
  const { data: classes, isLoading, isError, refetch } = useTeacherClasses()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {t('schools.teacherDashboard')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t('schools.teacherDashboard')}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t('schools.teacherDashboardDescription')}
          </p>
        </div>

        {/* Privacy notice */}
        <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-400">
          {t('schools.privacyNotice')}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('schools.teacherLoadError')}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              {t('common.retryConnection')}
            </Button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !isError && classes?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 dark:border-slate-700">
            <GraduationCap className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('schools.noClassesYet')}
            </p>
          </div>
        )}

        {/* Class cards */}
        {!isLoading && !isError && classes && classes.length > 0 && (
          <div className="grid gap-4">
            {classes.map((cls) => (
              <ClassCard key={cls.classroom_id} cls={cls} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
