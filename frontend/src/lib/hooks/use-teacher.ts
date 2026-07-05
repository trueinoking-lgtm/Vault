import { useQuery } from '@tanstack/react-query'
import { teacherApi } from '@/lib/api/teacher'
import { QUERY_KEYS } from '@/lib/api/query-client'

export function useTeacherClasses() {
  return useQuery({
    queryKey: QUERY_KEYS.teacherClasses,
    queryFn: () => teacherApi.listClasses(),
  })
}

export function useClassProgress(classroomId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.classProgress(classroomId),
    queryFn: () => teacherApi.getClassProgress(classroomId),
    enabled: !!classroomId,
  })
}

export function useClassLearners(classroomId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.classLearners(classroomId),
    queryFn: () => teacherApi.listLearners(classroomId),
    enabled: !!classroomId,
  })
}

export function useClassActivity(classroomId: string, limit?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.classActivity(classroomId),
    queryFn: () => teacherApi.listActivity(classroomId, limit),
    enabled: !!classroomId,
  })
}
