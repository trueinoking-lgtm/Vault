import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '@/lib/api/schools'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { useToast } from '@/lib/hooks/use-toast'
import { useTranslation } from '@/lib/hooks/use-translation'
import { getApiErrorMessage } from '@/lib/utils/error-handler'
import type { SchoolCreate, SchoolUpdate, SchoolResponse } from '@/lib/types/api'

export function useSchools() {
  return useQuery({
    queryKey: QUERY_KEYS.schools,
    queryFn: () => schoolsApi.list(),
  })
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.schools, id] as const,
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
