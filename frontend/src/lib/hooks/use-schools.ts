import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '@/lib/api/schools'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { useToast } from '@/lib/hooks/use-toast'
import { useTranslation } from '@/lib/hooks/use-translation'
import { getApiErrorMessage } from '@/lib/utils/error-handler'
import type {
  SchoolCreate,
  SchoolUpdate,
  SchoolResponse,
  SchoolMembershipCreate,
  SchoolMembershipUpdate,
  ClassroomCreate,
  ClassroomUpdate,
} from '@/lib/types/api'

export function useSchools() {
  return useQuery({
    queryKey: QUERY_KEYS.schools,
    queryFn: () => schoolsApi.list(),
  })
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.school(id),
    queryFn: () => schoolsApi.get(id),
    enabled: !!id,
  })
}

export function useCreateSchool() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: SchoolCreate) => schoolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schools })
      toast({
        title: t('common.success'),
        description: t('schools.createSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateSchool() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SchoolUpdate }) =>
      schoolsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schools })
      toast({
        title: t('common.success'),
        description: t('schools.updateSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}

// ── Members ──────────────────────────────────────────────────────────

export function useSchoolMembers(schoolId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.schoolMembers(schoolId),
    queryFn: () => schoolsApi.listMembers(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreateSchoolMember(schoolId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: SchoolMembershipCreate) =>
      schoolsApi.createMember(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schoolMembers(schoolId) })
      toast({
        title: t('common.success'),
        description: t('schools.memberCreateSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateSchoolMember(schoolId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ membershipId, data }: { membershipId: string; data: SchoolMembershipUpdate }) =>
      schoolsApi.updateMember(schoolId, membershipId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schoolMembers(schoolId) })
      toast({
        title: t('common.success'),
        description: t('schools.memberUpdateSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}

// ── Classrooms ───────────────────────────────────────────────────────

export function useSchoolClassrooms(schoolId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.schoolClassrooms(schoolId),
    queryFn: () => schoolsApi.listClassrooms(schoolId),
    enabled: !!schoolId,
  })
}

export function useCreateClassroom(schoolId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (data: ClassroomCreate) =>
      schoolsApi.createClassroom(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schoolClassrooms(schoolId) })
      toast({
        title: t('common.success'),
        description: t('schools.classroomCreateSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateClassroom(schoolId: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ classroomId, data }: { classroomId: string; data: ClassroomUpdate }) =>
      schoolsApi.updateClassroom(schoolId, classroomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schoolClassrooms(schoolId) })
      toast({
        title: t('common.success'),
        description: t('schools.classroomUpdateSuccess'),
      })
    },
    onError: (error: unknown) => {
      toast({
        title: t('common.error'),
        description: getApiErrorMessage(error, (key) => t(key), 'common.error'),
        variant: 'destructive',
      })
    },
  })
}
