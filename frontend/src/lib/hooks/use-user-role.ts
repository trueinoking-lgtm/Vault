'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { AuthMeResponse, UserRole } from '@/lib/types/api'

export interface UserRoleState {
  /** Resolved frontend role. Null while loading or when role has not been fetched. */
  role: UserRole | null
  /** Raw response from /api/auth/me, if available. */
  me: AuthMeResponse | null
  /** True while the initial role fetch is in progress. */
  isLoading: boolean
  /** Error message if the fetch failed, null otherwise. */
  error: string | null
  /** True when the role was fetched at least once. */
  isResolved: boolean
  /** Refetch the role from the backend. */
  refetch: () => Promise<void>
}

/**
 * Derive a frontend role from the /api/auth/me response.
 *
 * Rules:
 *  1. Not authenticated → anonymous
 *  2. owner_access or user.is_global_owner → global_owner
 *  3. Any active membership with role 'teacher' or 'owner' → teacher
 *  4. Otherwise authenticated → learner
 */
function deriveRole(me: AuthMeResponse): UserRole {
  if (!me.authenticated) {
    return 'anonymous'
  }

  // Global owner check — both the top-level flag and the user sub-object
  if (me.owner_access || me.user?.is_global_owner) {
    return 'global_owner'
  }

  // Teacher / school-owner check — active memberships
  if (me.memberships && me.memberships.length > 0) {
    const hasTeacherRole = me.memberships.some(
      (m) => m.active && (m.role === 'teacher' || m.role === 'owner'),
    )
    if (hasTeacherRole) {
      return 'teacher'
    }
  }

  // Conservative fallback
  return 'learner'
}

export function useUserRole(): UserRoleState {
  const { token, isAuthenticated, hasHydrated } = useAuthStore()
  const [role, setRole] = useState<UserRole | null>(null)
  const [me, setMe] = useState<AuthMeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isResolved, setIsResolved] = useState(false)
  const mountedRef = useRef(true)
  const inflightRef = useRef<Promise<void> | null>(null)
  const fetchCountRef = useRef(0)

  const fetchRole = useCallback(async () => {
    // If the store says we're not authenticated, skip the API call
    if (hasHydrated && !isAuthenticated) {
      setIsLoading(false)
      setRole('anonymous')
      setMe(null)
      setError(null)
      setIsResolved(true)
      return
    }

    // Deduplicate concurrent requests within this hook instance
    if (inflightRef.current) {
      await inflightRef.current
      return
    }

    const thisFetch = fetchCountRef.current + 1
    fetchCountRef.current = thisFetch

    inflightRef.current = (async () => {
      try {
        const result = await authApi.me()
        const derivedRole = deriveRole(result)

        if (mountedRef.current && fetchCountRef.current === thisFetch) {
          setRole(derivedRole)
          setMe(result)
          setError(null)
          setIsResolved(true)
        }
      } catch (err) {
        if (mountedRef.current && fetchCountRef.current === thisFetch) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch user role'
          setError(message)
          // On error, keep previous role if we had one, otherwise safe fallback
          setRole((prev) => prev ?? 'learner')
          setIsResolved(true)
        }
      } finally {
        if (mountedRef.current && fetchCountRef.current === thisFetch) {
          setIsLoading(false)
        }
        inflightRef.current = null
      }
    })()

    await inflightRef.current
  }, [hasHydrated, isAuthenticated])

  // Fetch on mount and when auth state changes
  useEffect(() => {
    mountedRef.current = true

    if (hasHydrated) {
      void fetchRole()
    }

    return () => {
      mountedRef.current = false
    }
  }, [hasHydrated, isAuthenticated, fetchRole])

  return { role, me, isLoading, error, isResolved, refetch: fetchRole }
}
