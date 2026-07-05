/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AppSidebar } from './AppSidebar'
import { useSidebarStore } from '@/lib/stores/sidebar-store'
import { useUserRole } from '@/lib/hooks/use-user-role'

// Mock Tooltip components to avoid Radix UI async issues in tests
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock useUserRole so we can control role per test
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: vi.fn(() => ({
    role: 'learner',
    me: null,
    isLoading: false,
    error: null,
    isResolved: true,
    refetch: vi.fn(),
  })),
}))

describe('AppSidebar', () => {
  it('renders correctly when expanded for learner role', () => {
    // Default mock is learner — see test/setup.ts
    render(<AppSidebar />)

    // Learner routes
    expect(screen.getByText('vault.vaultHome')).toBeDefined()
    expect(screen.getByText('navigation.materials')).toBeDefined()
    expect(screen.getByText('navigation.libraries')).toBeDefined()

    // Teacher/owner links should NOT be visible for learners
    expect(screen.queryByText('navigation.teacherDashboard')).toBeNull()
    expect(screen.queryByText('navigation.ownerTools')).toBeNull()
  })

  it('shows teacher dashboard for teacher role', () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: 'teacher',
      me: null,
      isLoading: false,
      error: null,
      isResolved: true,
      refetch: vi.fn(),
    } as any)

    render(<AppSidebar />)

    // Learner routes still present
    expect(screen.getByText('vault.vaultHome')).toBeDefined()
    // Teacher dashboard visible
    expect(screen.getByText('navigation.teacherDashboard')).toBeDefined()
    // Owner tools NOT visible for teachers
    expect(screen.queryByText('navigation.ownerTools')).toBeNull()
  })

  it('shows teacher dashboard and owner tools for global owner', () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: 'global_owner',
      me: null,
      isLoading: false,
      error: null,
      isResolved: true,
      refetch: vi.fn(),
    } as any)

    render(<AppSidebar />)

    // Learner routes still present
    expect(screen.getByText('vault.vaultHome')).toBeDefined()
    // Teacher dashboard visible
    expect(screen.getByText('navigation.teacherDashboard')).toBeDefined()
    // Owner tools visible
    expect(screen.getByText('navigation.ownerTools')).toBeDefined()
  })

  it('does not show restricted links while role is loading', () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: null,
      me: null,
      isLoading: true,
      error: null,
      isResolved: false,
      refetch: vi.fn(),
    } as any)

    render(<AppSidebar />)

    // Learner routes present
    expect(screen.getByText('vault.vaultHome')).toBeDefined()
    // Restricted links should NOT show during loading
    expect(screen.queryByText('navigation.teacherDashboard')).toBeNull()
    expect(screen.queryByText('navigation.ownerTools')).toBeNull()
  })

  it('does not show restricted links on role fetch error', () => {
    vi.mocked(useUserRole).mockReturnValue({
      role: 'learner', // safe fallback
      me: null,
      isLoading: false,
      error: 'Failed to fetch user role',
      isResolved: true,
      refetch: vi.fn(),
    } as any)

    render(<AppSidebar />)

    // Learner routes present
    expect(screen.getByText('vault.vaultHome')).toBeDefined()
    // Restricted links should NOT show on error
    expect(screen.queryByText('navigation.teacherDashboard')).toBeNull()
    expect(screen.queryByText('navigation.ownerTools')).toBeNull()
  })

  it('toggles collapse state when clicking handle', () => {
    const toggleCollapse = vi.fn()
    vi.mocked(useSidebarStore).mockReturnValue({
      isCollapsed: false,
      toggleCollapse,
    } as any)

    render(<AppSidebar />)

    fireEvent.click(screen.getByTestId('sidebar-toggle'))

    expect(toggleCollapse).toHaveBeenCalled()
  })

  it('shows collapsed view when isCollapsed is true', () => {
    vi.mocked(useSidebarStore).mockReturnValue({
      isCollapsed: true,
      toggleCollapse: vi.fn(),
    } as any)

    render(<AppSidebar />)

    // In collapsed mode, app name shouldn't be visible (as text)
    expect(screen.queryByText('common.appName')).toBeNull()
  })
})
