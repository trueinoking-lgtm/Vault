import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { LoginForm } from './LoginForm'
import { useAuthStore } from '@/lib/stores/auth-store'
import { authApi } from '@/lib/api/auth'
import type { AuthMeResponse } from '@/lib/types/api'

// Mock authApi
vi.mock('@/lib/api/auth', () => ({
  authApi: {
    me: vi.fn(),
  },
}))

// Mock auth store
vi.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: vi.fn(),
}))

// Mock config
vi.mock('@/lib/config', () => ({
  getConfig: vi.fn().mockResolvedValue({
    apiUrl: 'http://localhost:5055',
    version: '1.0.0',
    buildTime: '2026-01-01T00:00:00Z',
  }),
}))

const mockAuthStore = vi.mocked(useAuthStore)
const mockAuthApiMe = vi.mocked(authApi.me)

function createDefaultStore() {
  return {
    isAuthenticated: false,
    token: null,
    isLoading: false,
    error: null,
    lastAuthCheck: null,
    isCheckingAuth: false,
    hasHydrated: true,
    authRequired: true,
    setHasHydrated: vi.fn(),
    checkAuthRequired: vi.fn().mockResolvedValue(true),
    login: vi.fn().mockResolvedValue(true),
    logout: vi.fn(),
    checkAuth: vi.fn().mockResolvedValue(false),
  }
}

function createOwnerMeResponse(): AuthMeResponse {
  return {
    authenticated: true,
    auth_mode: 'session',
    user: {
      id: 'user:owner1',
      display_name: 'Global Owner',
      email: 'owner@example.com',
      is_global_owner: true,
      active: true,
    },
    owner_access: true,
    memberships: [],
  }
}

function createLearnerMeResponse(): AuthMeResponse {
  return {
    authenticated: true,
    auth_mode: 'session',
    user: {
      id: 'user:learner1',
      display_name: 'Learner',
      email: 'learner@example.com',
      is_global_owner: false,
      active: true,
    },
    owner_access: false,
    memberships: [],
  }
}

// Helper to wait for the form to be ready (hydration + auth check completes)
async function waitForFormReady() {
  await waitFor(() => {
    expect(screen.getByPlaceholderText('auth.passwordPlaceholder')).toBeInTheDocument()
  })
}

describe('LoginForm — Phase F4 owner-cookie bridge', () => {
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    vi.clearAllMocks()

    // Default: hydrated, auth required, not yet authenticated
    mockAuthStore.mockReturnValue(createDefaultStore())

    // Default fetch mock — capture calls to /api/owner-access
    originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/owner-access' && options?.method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      // Default pass-through for any other fetch (e.g. GET /api/owner-access for status)
      const resp = new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
      return resp
    })
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  // ── Phase F4: owner-cookie bridge ──────────────────────────────────

  it('bridges owner access after global owner normal login', async () => {
    // Auth store: login succeeds
    const mockLogin = vi.fn().mockResolvedValue(true)
    mockAuthStore.mockReturnValue({ ...createDefaultStore(), login: mockLogin })

    // Auth API: me says global owner
    mockAuthApiMe.mockResolvedValue(createOwnerMeResponse())

    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/owner-access' && options?.method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy

    render(<LoginForm />)
    await waitForFormReady()

    const passwordInput = screen.getByPlaceholderText('auth.passwordPlaceholder')
    fireEvent.change(passwordInput, { target: { value: 'owner-password' } })
    fireEvent.click(screen.getByRole('button', { name: /auth.signIn/ }))

    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('owner-password')
    })

    // Should have called authApi.me() to check owner status
    await waitFor(() => {
      expect(mockAuthApiMe).toHaveBeenCalled()
    })

    // Should have bridged owner access with the password
    await waitFor(() => {
      // Find the POST to /api/owner-access
      const ownerCalls = fetchSpy.mock.calls.filter(
        ([url, opts]: [string, RequestInit]) =>
          url === '/api/owner-access' && opts?.method === 'POST',
      )
      expect(ownerCalls.length).toBeGreaterThanOrEqual(1)
      // Verify the password was passed
      const body = JSON.parse(ownerCalls[0][1].body as string)
      expect(body.password).toBe('owner-password')
    })
  })

  it('does NOT bridge owner access when user is not a global owner', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true)
    mockAuthStore.mockReturnValue({ ...createDefaultStore(), login: mockLogin })

    // Auth API: me says learner (not owner)
    mockAuthApiMe.mockResolvedValue(createLearnerMeResponse())

    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      return new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy

    render(<LoginForm />)
    await waitForFormReady()

    const passwordInput = screen.getByPlaceholderText('auth.passwordPlaceholder')
    fireEvent.change(passwordInput, { target: { value: 'learner-password' } })
    fireEvent.click(screen.getByRole('button', { name: /auth.signIn/ }))

    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('learner-password')
    })

    await waitFor(() => {
      expect(mockAuthApiMe).toHaveBeenCalled()
    })

    // Should NOT have called POST /api/owner-access
    const ownerPostCalls = fetchSpy.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) =>
        url === '/api/owner-access' && opts?.method === 'POST',
    )
    expect(ownerPostCalls.length).toBe(0)
  })

  it('does NOT bridge owner access when me API fails', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true)
    mockAuthStore.mockReturnValue({ ...createDefaultStore(), login: mockLogin })

    // Auth API: me fails
    mockAuthApiMe.mockRejectedValue(new Error('Network error'))

    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      return new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy

    render(<LoginForm />)
    await waitForFormReady()

    const passwordInput = screen.getByPlaceholderText('auth.passwordPlaceholder')
    fireEvent.change(passwordInput, { target: { value: 'test-password' } })
    fireEvent.click(screen.getByRole('button', { name: /auth.signIn/ }))

    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-password')
    })

    await waitFor(() => {
      expect(mockAuthApiMe).toHaveBeenCalled()
    })

    // Should NOT have called POST /api/owner-access (bridge was skipped due to error)
    const ownerPostCalls = fetchSpy.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) =>
        url === '/api/owner-access' && opts?.method === 'POST',
    )
    expect(ownerPostCalls.length).toBe(0)
  })

  it('login still works when owner-access bridge returns non-OK', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true)
    mockAuthStore.mockReturnValue({ ...createDefaultStore(), login: mockLogin })

    // Auth API: me says global owner
    mockAuthApiMe.mockResolvedValue(createOwnerMeResponse())

    // Owner access POST returns 500
    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/owner-access' && options?.method === 'POST') {
        return new Response(JSON.stringify({ detail: 'Server error' }), { status: 500 })
      }
      return new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy

    render(<LoginForm />)
    await waitForFormReady()

    const passwordInput = screen.getByPlaceholderText('auth.passwordPlaceholder')
    fireEvent.change(passwordInput, { target: { value: 'owner-password' } })
    fireEvent.click(screen.getByRole('button', { name: /auth.signIn/ }))

    // Wait for login to complete
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('owner-password')
    })

    // Bridge was attempted (since me said owner)
    await waitFor(() => {
      expect(mockAuthApiMe).toHaveBeenCalled()
    })

    // POST was called (bridge attempted even though it failed)
    const ownerPostCalls = fetchSpy.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) =>
        url === '/api/owner-access' && opts?.method === 'POST',
    )
    expect(ownerPostCalls.length).toBeGreaterThanOrEqual(1)

    // Login itself should have succeeded — no error shown
    await waitFor(() => {
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument()
    })
  })

  it('bridges owner access when owner_access flag is true (legacy password mode)', async () => {
    const mockLogin = vi.fn().mockResolvedValue(true)
    mockAuthStore.mockReturnValue({ ...createDefaultStore(), login: mockLogin })

    // Legacy password auth mode — no user object, but owner_access=true
    const legacyOwnerMe: AuthMeResponse = {
      authenticated: true,
      auth_mode: 'password',
      user: null,
      owner_access: true,
      memberships: [],
    }
    mockAuthApiMe.mockResolvedValue(legacyOwnerMe)

    const fetchSpy = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url === '/api/owner-access' && options?.method === 'POST') {
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(JSON.stringify({ enabled: true, source: 'owner-password-env' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    globalThis.fetch = fetchSpy

    render(<LoginForm />)
    await waitForFormReady()

    const passwordInput = screen.getByPlaceholderText('auth.passwordPlaceholder')
    fireEvent.change(passwordInput, { target: { value: 'owner-password' } })
    fireEvent.click(screen.getByRole('button', { name: /auth.signIn/ }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('owner-password')
    })

    await waitFor(() => {
      expect(mockAuthApiMe).toHaveBeenCalled()
    })

    const ownerPostCalls = fetchSpy.mock.calls.filter(
      ([url, opts]: [string, RequestInit]) =>
        url === '/api/owner-access' && opts?.method === 'POST',
    )
    expect(ownerPostCalls.length).toBeGreaterThanOrEqual(1)
  })
})
