'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Loader2,
  Plus,
  RefreshCw,
  Users,
  GraduationCap,
  UserCheck,
  UserX,
  Check,
  X,
  ChevronRight,
} from 'lucide-react'

import {
  useSchool,
  useSchoolMembers,
  useCreateSchoolMember,
  useUpdateSchoolMember,
  useSchoolClassrooms,
  useCreateClassroom,
  useUpdateClassroom,
} from '@/lib/hooks/use-schools'
import { useTranslation } from '@/lib/hooks/use-translation'
import type {
  SchoolMembershipResponse,
  ClassroomResponse,
} from '@/lib/types/api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ActiveTab = 'members' | 'classrooms'

export default function OwnerSchoolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const schoolId = params.id as string

  const { data: school, isLoading, isError, refetch } = useSchool(schoolId)
  const {
    data: members,
    isLoading: membersLoading,
    isError: membersError,
    refetch: refetchMembers,
  } = useSchoolMembers(schoolId)
  const {
    data: classrooms,
    isLoading: classroomsLoading,
    isError: classroomsError,
    refetch: refetchClassrooms,
  } = useSchoolClassrooms(schoolId)

  const createMember = useCreateSchoolMember(schoolId)
  const updateMember = useUpdateSchoolMember(schoolId)
  const createClassroom = useCreateClassroom(schoolId)
  const updateClassroom = useUpdateClassroom(schoolId)

  const [activeTab, setActiveTab] = useState<ActiveTab>('members')

  // ── Member form state ──────────────────────────────────────────────
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [editingMember, setEditingMember] = useState<SchoolMembershipResponse | null>(null)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState<'owner' | 'teacher' | 'learner'>('learner')
  const [editMemberRole, setEditMemberRole] = useState<'owner' | 'teacher' | 'learner'>('learner')
  const [editMemberActive, setEditMemberActive] = useState(true)

  // ── Classroom form state ───────────────────────────────────────────
  const [showCreateClassroom, setShowCreateClassroom] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<ClassroomResponse | null>(null)
  const [classroomName, setClassroomName] = useState('')
  const [classroomTeacherId, setClassroomTeacherId] = useState('')
  const [classroomSubject, setClassroomSubject] = useState('')
  const [classroomGradeLevel, setClassroomGradeLevel] = useState('')
  const [editClassName, setEditClassName] = useState('')
  const [editClassroomSubject, setEditClassroomSubject] = useState('')
  const [editClassroomGradeLevel, setEditClassroomGradeLevel] = useState('')
  const [editClassroomActive, setEditClassroomActive] = useState(true)

  // ── Handlers ───────────────────────────────────────────────────────

  const handleCreateMember = async () => {
    if (!memberUserId.trim() || !memberRole) return
    await createMember.mutateAsync({
      user_id: memberUserId.trim(),
      role: memberRole,
    })
    setShowCreateMember(false)
    setMemberUserId('')
    setMemberRole('learner')
  }

  const handleEditMember = async () => {
    if (!editingMember) return
    await updateMember.mutateAsync({
      membershipId: editingMember.id,
      data: {
        role: editMemberRole,
        active: editMemberActive,
      },
    })
    setEditingMember(null)
  }

  const openEditMember = (member: SchoolMembershipResponse) => {
    setEditMemberRole(member.role as 'owner' | 'teacher' | 'learner')
    setEditMemberActive(member.active)
    setEditingMember(member)
  }

  const handleCreateClassroom = async () => {
    if (!classroomName.trim() || !classroomTeacherId.trim()) return
    await createClassroom.mutateAsync({
      name: classroomName.trim(),
      teacher_id: classroomTeacherId.trim(),
      subject: classroomSubject.trim() || undefined,
      grade_level: classroomGradeLevel.trim() || undefined,
    })
    setShowCreateClassroom(false)
    setClassroomName('')
    setClassroomTeacherId('')
    setClassroomSubject('')
    setClassroomGradeLevel('')
  }

  const handleEditClassroom = async () => {
    if (!editingClassroom) return
    await updateClassroom.mutateAsync({
      classroomId: editingClassroom.id,
      data: {
        name: editClassName.trim() || undefined,
        subject: editClassroomSubject.trim() || undefined,
        grade_level: editClassroomGradeLevel.trim() || undefined,
        active: editClassroomActive,
      },
    })
    setEditingClassroom(null)
  }

  const openEditClassroom = (cls: ClassroomResponse) => {
    setEditClassName(cls.name)
    setEditClassroomSubject(cls.subject ?? '')
    setEditClassroomGradeLevel(cls.grade_level ?? '')
    setEditClassroomActive(cls.active)
    setEditingClassroom(cls)
  }

  // ── Loading ────────────────────────────────────────────────────────

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

  // ── Error ──────────────────────────────────────────────────────────

  if (isError || !school) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-700 dark:text-red-400">
              {t('schools.loadError')}
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
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
          onClick={() => router.push('/owner/schools')}
          className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back') || 'Back to Schools'}
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Owner / Schools / {school.name}
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
                {school.name}
              </h1>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  school.active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                }`}
              >
                {school.active ? 'active' : 'inactive'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {school.slug}
            </p>
            {school.description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {school.description}
              </p>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Users className="h-4 w-4" />
            {t('schools.members')}
          </button>
          <button
            onClick={() => setActiveTab('classrooms')}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'classrooms'
                ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            {t('schools.classrooms')}
          </button>
        </div>

        {/* ================================================================ */}
        {/* Members Tab                                                       */}
        {/* ================================================================ */}
        {activeTab === 'members' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t('schools.members')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchMembers()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowCreateMember(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createMember')}
                </Button>
              </div>
            </div>

            {/* Rough edge notice */}
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
              {t('schools.userPickerDeferred')}
            </div>

            {/* Members loading */}
            {membersLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {/* Members error */}
            {membersError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t('schools.memberLoadError')}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchMembers()}>
                  {t('common.retryConnection')}
                </Button>
              </div>
            )}

            {/* Members empty */}
            {!membersLoading && !membersError && members?.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 dark:border-slate-700">
                <UserCheck className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('schools.noMembers')}
                </p>
                <Button size="sm" className="mt-4" onClick={() => setShowCreateMember(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createMember')}
                </Button>
              </div>
            )}

            {/* Members list */}
            {!membersLoading && !membersError && members && members.length > 0 && (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {member.user_id.slice(-4)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                          {member.user_id}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              member.role === 'owner'
                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                                : member.role === 'teacher'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                            }`}
                          >
                            {member.role}
                          </span>
                          {member.active ? (
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
                    <Button variant="ghost" size="sm" onClick={() => openEditMember(member)}>
                      {t('common.edit')}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Create member dialog */}
            <Dialog open={showCreateMember} onOpenChange={setShowCreateMember}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.createMember')}</DialogTitle>
                  <DialogDescription>{t('schools.createMemberDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-user-id">{t('schools.memberId')}</Label>
                    <Input
                      id="member-user-id"
                      value={memberUserId}
                      onChange={(e) => setMemberUserId(e.target.value)}
                      placeholder="e.g. user:abc123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-role">{t('schools.memberRole')}</Label>
                    <Select
                      value={memberRole}
                      onValueChange={(val: 'owner' | 'teacher' | 'learner') => setMemberRole(val)}
                    >
                      <SelectTrigger id="member-role">
                        <SelectValue placeholder={t('schools.memberRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">{t('schools.roleOwner')}</SelectItem>
                        <SelectItem value="teacher">{t('schools.roleTeacher')}</SelectItem>
                        <SelectItem value="learner">{t('schools.roleLearner')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateMember(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateMember}
                    disabled={!memberUserId.trim() || createMember.isPending}
                  >
                    {createMember.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit member dialog */}
            <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.editMember')}</DialogTitle>
                  <DialogDescription>{t('schools.editMemberDescription')}</DialogDescription>
                </DialogHeader>
                {editingMember && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="text-xs text-slate-500">{t('schools.memberId')}</p>
                      <p className="text-sm font-medium text-slate-950 dark:text-slate-50">
                        {editingMember.user_id}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-member-role">{t('schools.memberRole')}</Label>
                      <Select
                        value={editMemberRole}
                        onValueChange={(val: 'owner' | 'teacher' | 'learner') => setEditMemberRole(val)}
                      >
                        <SelectTrigger id="edit-member-role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">{t('schools.roleOwner')}</SelectItem>
                          <SelectItem value="teacher">{t('schools.roleTeacher')}</SelectItem>
                          <SelectItem value="learner">{t('schools.roleLearner')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-member-active">{t('common.active') || 'Active'}</Label>
                      <button
                        id="edit-member-active"
                        onClick={() => setEditMemberActive(!editMemberActive)}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          editMemberActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {editMemberActive ? 'active' : 'inactive'}
                      </button>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingMember(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleEditMember}
                    disabled={updateMember.isPending}
                  >
                    {updateMember.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* ================================================================ */}
        {/* Classrooms Tab                                                    */}
        {/* ================================================================ */}
        {activeTab === 'classrooms' && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t('schools.classrooms')}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetchClassrooms()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowCreateClassroom(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createClassroom')}
                </Button>
              </div>
            </div>

            {/* Rough edge notice */}
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-400">
              {t('schools.enrollmentUILater')}
            </div>

            {/* Classrooms loading */}
            {classroomsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            )}

            {/* Classrooms error */}
            {classroomsError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
                <p className="text-sm text-red-700 dark:text-red-400">
                  {t('schools.classroomLoadError')}
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchClassrooms()}>
                  {t('common.retryConnection')}
                </Button>
              </div>
            )}

            {/* Classrooms empty */}
            {!classroomsLoading && !classroomsError && classrooms?.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 dark:border-slate-700">
                <GraduationCap className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('schools.noClassrooms')}
                </p>
                <Button size="sm" className="mt-4" onClick={() => setShowCreateClassroom(true)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t('schools.createClassroom')}
                </Button>
              </div>
            )}

            {/* Classrooms list */}
            {!classroomsLoading && !classroomsError && classrooms && classrooms.length > 0 && (
              <div className="space-y-2">
                {classrooms.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => router.push(`/owner/schools/${schoolId}/classrooms/${cls.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                        <span className="text-sm font-medium text-slate-950 dark:text-slate-50">
                          {cls.name}
                        </span>
                        {!cls.active && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                            inactive
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        {cls.subject && <span>{cls.subject}</span>}
                        {cls.grade_level && <span>Grade: {cls.grade_level}</span>}
                        <span>Teacher: {cls.teacher_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditClassroom(cls); }}>
                        {t('common.edit')}
                      </Button>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create classroom dialog */}
            <Dialog open={showCreateClassroom} onOpenChange={setShowCreateClassroom}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.createClassroom')}</DialogTitle>
                  <DialogDescription>{t('schools.createClassroomDescription')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="classroom-name">{t('schools.classroomName')}</Label>
                    <Input
                      id="classroom-name"
                      value={classroomName}
                      onChange={(e) => setClassroomName(e.target.value)}
                      placeholder="e.g. Form 3A - Mathematics"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom-teacher">{t('schools.teacherId')}</Label>
                    <Input
                      id="classroom-teacher"
                      value={classroomTeacherId}
                      onChange={(e) => setClassroomTeacherId(e.target.value)}
                      placeholder="e.g. school_membership:abc123"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom-subject">{t('schools.classroomSubject')}</Label>
                    <Input
                      id="classroom-subject"
                      value={classroomSubject}
                      onChange={(e) => setClassroomSubject(e.target.value)}
                      placeholder={t('common.optional')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="classroom-grade">{t('schools.classroomGradeLevel')}</Label>
                    <Input
                      id="classroom-grade"
                      value={classroomGradeLevel}
                      onChange={(e) => setClassroomGradeLevel(e.target.value)}
                      placeholder={t('common.optional')}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateClassroom(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateClassroom}
                    disabled={!classroomName.trim() || !classroomTeacherId.trim() || createClassroom.isPending}
                  >
                    {createClassroom.isPending ? t('common.creating') : t('common.create')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit classroom dialog */}
            <Dialog open={!!editingClassroom} onOpenChange={(open) => !open && setEditingClassroom(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('schools.editClassroom')}</DialogTitle>
                  <DialogDescription>{t('schools.editClassroomDescription')}</DialogDescription>
                </DialogHeader>
                {editingClassroom && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-classroom-name">{t('schools.classroomName')}</Label>
                      <Input
                        id="edit-classroom-name"
                        value={editClassName}
                        onChange={(e) => setEditClassName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-classroom-subject">{t('schools.classroomSubject')}</Label>
                      <Input
                        id="edit-classroom-subject"
                        value={editClassroomSubject}
                        onChange={(e) => setEditClassroomSubject(e.target.value)}
                        placeholder={t('common.optional')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-classroom-grade">{t('schools.classroomGradeLevel')}</Label>
                      <Input
                        id="edit-classroom-grade"
                        value={editClassroomGradeLevel}
                        onChange={(e) => setEditClassroomGradeLevel(e.target.value)}
                        placeholder={t('common.optional')}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-classroom-active">{t('common.active') || 'Active'}</Label>
                      <button
                        id="edit-classroom-active"
                        onClick={() => setEditClassroomActive(!editClassroomActive)}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          editClassroomActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                        }`}
                      >
                        {editClassroomActive ? 'active' : 'inactive'}
                      </button>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingClassroom(null)}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    onClick={handleEditClassroom}
                    disabled={updateClassroom.isPending}
                  >
                    {updateClassroom.isPending ? t('common.saving') : t('common.save')}
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
