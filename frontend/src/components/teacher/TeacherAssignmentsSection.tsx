'use client'

import { useState } from 'react'
import {
  ClipboardList,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '@/lib/api/schools'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Button } from '@/components/ui/button'
import type {
  ClassroomAssignmentResponse,
  ClassroomAssignmentCreate,
} from '@/lib/types/api'

function CreateAssignmentDialog({
  classroomId,
  onClose,
}: {
  classroomId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [targetType, setTargetType] = useState<'material' | 'leaf'>('material')
  const [targetId, setTargetId] = useState('')
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueAt, setDueAt] = useState('')

  const createMutation = useMutation({
    mutationFn: (data: ClassroomAssignmentCreate) =>
      schoolsApi.createAssignment(classroomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classroomAssignments(classroomId),
      })
      onClose()
    },
  })

  const handleSubmit = () => {
    if (!targetId.trim()) return
    createMutation.mutate({
      target_type: targetType,
      target_id: targetId.trim(),
      title: title.trim() || undefined,
      instructions: instructions.trim() || undefined,
      due_at: dueAt || undefined,
      assigned_by: '', // Backend resolves from auth
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold text-slate-950 dark:text-slate-50">
          {t('schools.createAssignment')}
        </h3>

        <div className="space-y-4">
          {/* Target type */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('schools.assignmentType')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTargetType('material')}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  targetType === 'material'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <FileText className="h-3 w-3" />
                {t('schools.material')}
              </button>
              <button
                onClick={() => setTargetType('leaf')}
                className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  targetType === 'leaf'
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <List className="h-3 w-3" />
                {t('schools.leaf')}
              </button>
            </div>
          </div>

          {/* Target ID */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('schools.targetId')}
            </label>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder={t('schools.targetIdPlaceholder')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('schools.assignmentTitle')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('schools.assignmentTitlePlaceholder')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('schools.instructions')}
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={t('schools.instructionsPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('schools.dueDate')}
            </label>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!targetId.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('schools.createAssignment')
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function TeacherAssignmentsSection({
  classroomId,
}: {
  classroomId: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const {
    data: assignments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.classroomAssignments(classroomId),
    queryFn: () => schoolsApi.listAssignments(classroomId),
    enabled: !!classroomId,
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentId: string) =>
      schoolsApi.deactivateAssignment(classroomId, assignmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.classroomAssignments(classroomId),
      })
    },
  })

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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
          <ClipboardList className="h-4 w-4" />
          {t('schools.assignments')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('schools.createAssignment')}
          </Button>
        </div>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-8 dark:border-slate-700">
          <ClipboardList className="mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('schools.noAssignments')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                {a.target_type === 'leaf' ? (
                  <List className="h-4 w-4 text-slate-500" />
                ) : (
                  <FileText className="h-4 w-4 text-slate-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                    {a.title || a.target_id || a.notebook_id || '—'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {a.target_type || 'notebook'}
                    {a.due_at && (
                      <span className="ml-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(a.due_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(a.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-slate-400" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateAssignmentDialog
          classroomId={classroomId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
