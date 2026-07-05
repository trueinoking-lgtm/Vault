import { apiClient } from '@/lib/api/client'
import type { AuthMeResponse } from '@/lib/types/api'

export const authApi = {
  /** Get information about the currently authenticated user.
   *
   * Returns the user's profile, auth mode, and whether they have
   * global owner access. Used by useUserRole() to derive the
   * frontend role classification.
   */
  me: async () => {
    const response = await apiClient.get<AuthMeResponse>('/auth/me')
    return response.data
  },
}
