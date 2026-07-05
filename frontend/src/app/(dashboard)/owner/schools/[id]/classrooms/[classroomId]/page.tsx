'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  BookOpen,
  Trash2,
  Check,
  X,
} from 'lucide-react'

import {
  useSchool,
  useClassroomEnrollments,
  useCreateClassEnrollment,
  useDeleteClassEnrollment,
  useClassroomAssignments,
  useCreateClassroomAssignment,
  useDeleteClassroomAssignment,
} from '@/lib/hooks/use-schools'
import { useTranslation } from '@/lib/hooks/use-translation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ActiveTab = 'enrollments' | 'assignments'

export default function OwnerClassroomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const classroomId = params.classroomId as string
  const schoolId = params.id as string

  const { data: school } = useSchool(schoolId)

  // Enrollments
  const {
    data: enrollments,
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useClassroomEnrollments(classroomId)
  const createEnrollment = useCreateClassEnrollment(classroomId)
  const deleteEnrollment = useDeleteClassEnrollment(classroomId)

  // Assignments
  const {
    data: assignments,
    isLoading: assignmentsLoading,
    isError: assignmentsError,
    refetch: refetchAssignments,
  } = useClassroomAssignments(classroomId)
  const createAssignment = useCreateClassroomAssignment(classroomId)
  const deleteAssignment = useDeleteClassroomAssignment(classroomId)

  const [activeTab, setActiveTab] = useState<ActiveTab>('enrollments')

  // ── Enrollment form state ─────────────────────────────────────────
  const [showCreateEnrollment, setShowCreateEnrollment] = useState(false)
  const [enrollmentLearnerId, setEnrollmentLearnerId] = useState('')

  // ── Assignment form state ─────────────────────────────────────────
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)
  const [assignmentNotebookId, setAssignmentNotebookId] = useState('')
  const [assignmentAssignedBy, setAssignmentAssignedBy] = useState('')

  // ── Handlers ──────────────────────────────────────────────────────

  const handleCreateEnrollment = async () => {
    if (!enrollmentLearnerId.trim()) return
    await createEnrollment.mutateAsync({
      learner_id: enrollmentLearnerId.trim(),
    })
    setShowCreateEnrollment(false)
    setEnrollmentLearnerId('')
  }

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    await deleteEnrollment.mutateAsync(enrollmentId)
  }

  const handleCreateAssignment = async () => {
    if (!assignmentNotebookId.trim() || !assignmentAssignedBy.trim()) return
    await createAssignment.mutateAsync({
      notebook_id: assignmentNotebookId.trim(),
      assigned_by: assignmentAssignedBy.trim(),
    })
    setShowCreateAssignment(false)
    setAssignmentNotebookId('')
    setAssignmentAssignedBy('')
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    await deleteAssignment.mutateAsync(assignmentId)
  }

  // Derive classroom name from URL or school data
  const classroomName = classroomId ? `Classroom ${classroomId.slice(0, 8)}` : ''

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Back link */}
        <button
          onClick={() => router.push(`/owner/schools/${schoolId}`)}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('schools.backToSchool') || 'Back to School'}
        </button>

        {/* Header */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Owner / Schools / {school?.name ?? '...'} / {classroomName}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t('schools.classroomDetail') || 'Classroom Detail'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('schools.enrollmentUILater')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'enrollments'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="h-4 w-4" />
            {t('schools.enrollments')}
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'assignments'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            {t('schools.assignments')}
          </button>
        </div>

        {/* ================================================================ */}
        {/* Enrollments Tab                                                   */}
        {/* ================================================================ */}
        {activeTab === 'enrollments' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t('schools.enrollments')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchEnrollments()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowCreateEnrollment(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createEnrollment')}
                </Button>
              </div>
            </div>

            {/* Rough edge notice */}
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
              {t('schools.userPickerDeferred')}
            </div>

            {/* Loading */}
            {enrollmentsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {/* Error */}
            {enrollmentsError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t('schools.enrollmentLoadError')}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchEnrollments()}>
                  {t('common.retryConnection')}
                </Button>
              </div>
            )}

            {/* Empty */}
            {!enrollmentsLoading && !enrollmentsError && enrollments?.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 dark:border-slate-700">
                <Users className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('schools.noEnrollments')}
                </p>
                <Button size="sm" className="mt-4" onClick={() => setShowCreateEnrollment(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createEnrollment')}
                </Button>
              </div>
            )}

            {/* List */}
            {!enrollmentsLoading && !enrollmentsError && enrollments && enrollments.length > 0 && (
              <div className="space-y-2">
                {enrollments.map((enr) => (
                  <div
                    key={enr.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {enr.learner_id.slice(-4)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                          {enr.learner_id}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {enr.active ? (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="h-3 w-3" /> active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400">
                              <X className="h-3 w-3" /> inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {enr.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEnrollment(enr.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create enrollment dialog */}
            <Dialog open={showCreateEnrollment} onOpenChange={setShowCreateEnrollment}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.createEnrollment')}</DialogTitle>
                  <DialogDescription>{t('schools.createEnrollmentDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="enrollment-learner-id">{t('schools.learnerId')}</Label>
                    <Input
                      id="enrollment-learner-id"
                      value={enrollmentLearnerId}
                      onChange={(e) => setEnrollmentLearnerId(e.target.value)}
                      placeholder="e.g. school_membership:abc123"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateEnrollment(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateEnrollment}
                    disabled={!enrollmentLearnerId.trim() || createEnrollment.isPending}
                  >
                    {createEnrollment.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ================================================================ */}
        {/* Assignments Tab                                                  */}
        {/* ================================================================ */}
        {activeTab === 'assignments' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t('schools.assignments')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchAssignments()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowCreateAssignment(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createAssignment')}
                </Button>
              </div>
            </div>

            {/* Rough edge notice */}
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
              {t('schools.libraryPickerDeferred')}
            </div>

            {/* Loading */}
            {assignmentsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {/* Error */}
            {assignmentsError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t('schools.assignmentLoadError')}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchAssignments()}>
                  {t('common.retryConnection')}
                </Button>
              </div>
            )}

            {/* Empty */}
            {!assignmentsLoading && !assignmentsError && assignments?.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 dark:border-slate-700">
                <BookOpen className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('schools.noAssignments')}
                </p>
                <Button size="sm" className="mt-4" onClick={() => setShowCreateAssignment(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createAssignment')}
                </Button>
              </div>
            )}

            {/* List */}
            {!assignmentsLoading && !assignmentsError && assignments && assignments.length > 0 && (
              <div className="space-y-2">
                {assignments.map((assn) => (
                  <div
                    key={assn.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                        <span className="text-sm font-medium text-slate-950 dark:text-slate-50">
                          {assn.notebook_id}
                        </span>
                        {assn.active ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <Check className="h-3 w-3" /> active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <X className="h-3 w-3" /> inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {t('schools.assignedBy')}: {assn.assigned_by}
                      </p>
                    </div>
                    {assn.active && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assn.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Create assignment dialog */}
            <Dialog open={showCreateAssignment} onOpenChange={setShowCreateAssignment}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.createAssignment')}</DialogTitle>
                  <DialogDescription>{t('schools.createAssignmentDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-notebook-id">{t('schools.notebookId')}</Label>
                    <Input
                      id="assignment-notebook-id"
                      value={assignmentNotebookId}
                      onChange={(e) => setAssignmentNotebookId(e.target.value)}
                      placeholder="e.g. notebook:abc123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignment-assigned-by">{t('schools.assignedBy')}</Label>
                    <Input
                      id="assignment-assigned-by"
                      value={assignmentAssignedBy}
                      onChange={(e) => setAssignmentAssignedBy(e.target.value)}
                      placeholder="e.g. school_membership:abc123"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateAssignment(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateAssignment}
                    disabled={
                      !assignmentNotebookId.trim() ||
                      !assignmentAssignedBy.trim() ||
                      createAssignment.isPending
                    }
                  >
                    {createAssignment.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  )
}
