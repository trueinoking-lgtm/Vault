'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { schoolsApi } from '@/lib/api/schools'
import { QUERY_KEYS } from '@/lib/api/query-client'
import type {
  LearnerAssignmentResponse,
  AssignmentProgressCreate,
} from '@/lib/types/api'

export function useMyAssignments() {
  return useQuery({
    queryKey: QUERY_KEYS.myAssignments,
    queryFn: () => schoolsApi.listMyAssignments(),
  })
}

export function useMarkAssignmentComplete() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      assignmentId,
      data,
    }: {
      assignmentId: string
      data: AssignmentProgressCreate
    }) => schoolsApi.markAssignmentComplete(assignmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myAssignments })
    },
  })
}
