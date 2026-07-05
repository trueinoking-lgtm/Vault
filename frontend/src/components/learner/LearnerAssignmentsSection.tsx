'use client'

import {
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  List,
  Loader2,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useMyAssignments, useMarkAssignmentComplete } from '@/lib/hooks/use-learner-assignments'

function AssignmentCard({
  assignment,
  onComplete,
  isCompleting,
}: {
  assignment: {
    id: string
    title?: string | null
    target_type?: string | null
    target_id?: string | null
    due_at?: string | null
    assigned_at?: string | null
    status: string
    completed_at?: string | null
  }
  onComplete: () => void
  isCompleting: boolean
}) {
  const { t } = useTranslation()
  const isCompleted = assignment.status === 'completed'
  const isOverdue =
    assignment.due_at && !isCompleted && new Date(assignment.due_at) < new Date()

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {assignment.target_type === 'leaf' ? (
            <List className="mt-0.5 h-4 w-4 text-slate-500" />
          ) : (
            <FileText className="mt-0.5 h-4 w-4 text-slate-500" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
              {assignment.title || assignment.target_id || '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {assignment.target_type || 'notebook'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <CheckCircle className="h-3 w-3" />
              {t('schools.completed')}
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('schools.markComplete')
              )}
            </Button>
          )}
        </div>
      </div>

      {assignment.due_at && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          <Calendar className="h-3 w-3" />
          <span
            className={
              isOverdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-500 dark:text-slate-400'
            }
          >
            {t('schools.due')} {new Date(assignment.due_at).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  )
}

export function LearnerAssignmentsSection() {
  const { t } = useTranslation()
  const { data: assignments, isLoading, isError, refetch } = useMyAssignments()
  const markComplete = useMarkAssignmentComplete()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-sm text-red-700 dark:text-red-400">
          {t('schools.teacherLoadError')}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const pending = assignments?.filter((a) => a.status !== 'completed') || []
  const completed = assignments?.filter((a) => a.status === 'completed') || []

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
          <ClipboardList className="h-4 w-4" />
          {t('schools.assignedWork')}
        </h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-8 dark:border-slate-700">
          <ClipboardList className="mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('schools.noAssignedWork')}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('schools.pending')} ({pending.length})
              </h3>
              <div className="space-y-2">
                {pending.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onComplete={() =>
                      markComplete.mutate({
                        assignmentId: a.id,
                        data: {
                          assignment_id: a.id,
                          classroom_id: a.classroom_id,
                          learner_id: '',
                        },
                      })
                    }
                    isCompleting={
                      markComplete.isPending &&
                      markComplete.variables?.assignmentId === a.id
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('schools.completed')} ({completed.length})
              </h3>
              <div className="space-y-2">
                {completed.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onComplete={() => {}}
                    isCompleting={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
