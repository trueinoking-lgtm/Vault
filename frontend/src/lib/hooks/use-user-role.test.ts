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
    memberships: [],
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

  // ── Teacher derivation from memberships (Phase F3a) ──────────────────────

  it('returns teacher when active teacher membership exists', async () => {
    const meData = createMockMe({
      memberships: [
        {
          membership_id: 'm1',
          school_id: 's1',
          role: 'teacher',
          active: true,
        },
      ],
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('teacher')
  })

  it('returns teacher when active school-owner membership exists', async () => {
    const meData = createMockMe({
      memberships: [
        {
          membership_id: 'm2',
          school_id: 's2',
          role: 'owner',
          active: true,
        },
      ],
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('teacher')
  })

  it('returns learner when only inactive teacher membership exists', async () => {
    const meData = createMockMe({
      memberships: [
        {
          membership_id: 'm3',
          school_id: 's3',
          role: 'teacher',
          active: false,
        },
      ],
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    // Inactive memberships don't count
    expect(result.current.role).toBe('learner')
  })

  it('returns learner when only learner membership exists', async () => {
    const meData = createMockMe({
      memberships: [
        {
          membership_id: 'm4',
          school_id: 's4',
          role: 'learner',
          active: true,
        },
      ],
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('learner')
  })

  it('returns teacher when mixed memberships include active teacher role', async () => {
    const meData = createMockMe({
      memberships: [
        {
          membership_id: 'm5',
          school_id: 's5',
          role: 'learner',
          active: true,
        },
        {
          membership_id: 'm6',
          school_id: 's6',
          role: 'teacher',
          active: true,
        },
        {
          membership_id: 'm7',
          school_id: 's7',
          role: 'teacher',
          active: false,
        },
      ],
    })
    vi.mocked(authApi.me).mockResolvedValue(meData)

    const { result } = renderHook(() => useUserRole())

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true)
    })

    expect(result.current.role).toBe('teacher')
  })
})
