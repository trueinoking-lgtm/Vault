import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useUserRole } from './use-user-role'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { AuthMeResponse } from '@/lib/types/api'

// Mock the auth API module
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    me: vi.fn(),
  },
}))

// Mock the auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

const mockAuthStore = vi.mocked(useAuthStore)

function createMockMe(
  overrides: Partial<AuthMeResponse> = {},
): AuthMeResponse {
  return {
    authenticated: true,
    auth_mode: 'session',
    user: {
      id: 'user:abc123',
      display_name: 'Test User',
      email: 'test@example.com',
      is_global_owner: false,
      active: true,
    },
    owner_access: false,
    ...overrides,
  }
}

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated user with session, hydrated
    mockAuthStore.mockReturnValue({
      token: 'test-token',
      isAuthenticated: true,
      hasHydrated: true,
    })
  })

  it('returns anonymous when not authenticated', async () => {
    mockAuthStore.mockReturnValue({
      token: null,
      isAuthenticated: false,
      hasHydrated: true,
    })

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('anonymous')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    // Should not have called the API
    expect(authApi.me).not.toHaveBeenCalled()
  })

  it('returns global_owner when owner_access is true', async () => {
    const meData = createMockMe({ owner_access: true })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('global_owner')
    expect(authApi.me).toHaveBeenCalledTimes(1)
  })

  it('returns global_owner when user.is_global_owner is true', async () => {
    const meData = createMockMe({
      owner_access: false,
      user: {
        id: 'user:abc123',
        display_name: 'Owner',
        email: 'owner@example.com',
        is_global_owner: true,
        active: true,
      },
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('global_owner')
    expect(authApi.me).toHaveBeenCalledTimes(1)
  })

  it('returns learner for regular authenticated user', async () => {
    const meData = createMockMe()
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')
    expect(authApi.me).toHaveBeenCalledTimes(1)
  })

  it('returns learner when auth mode is disabled', async () => {
    const meData = createMockMe({
      auth_mode: 'disabled',
      user: null,
      owner_access: false,
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')
  })

  it('returns learner when auth mode is password (no user record)', async () => {
    const meData = createMockMe({
      auth_mode: 'password',
      user: null,
      owner_access: false,
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')
  })

  it('handles API error gracefully and falls back to learner', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')
    expect(result.current.error).toBe('Network error')
    expect(result.current.isLoading).toBe(false)
  })

  it('exposes raw me response', async () => {
    const meData = createMockMe()
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.me).toEqual(meData)
  })

  it('refetch returns updated role', async () => {
    const meData = createMockMe()
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')

    // Now change the backend response
    const ownerMeData = createMockMe({ owner_access: true })
    vi.mocked(authApi.me).mockResolvedValue(ownerMeData)

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.role).toBe('global_owner')
    // Two calls: one on mount, one on refetch
    expect(authApi.me).toHaveBeenCalledTimes(2)
  })

  it('does not call API when not authenticated', async () => {
    mockAuthStore.mockReturnValue({
      token: null,
      isAuthenticated: false,
      hasHydrated: true,
    })

    renderHook(() => useUserRole())

    // Wait a tick to ensure no API call is made
    await new Promise((r) => setTimeout(r, 50))
    expect(authApi.me).not.toHaveBeenCalled()
  })
})
