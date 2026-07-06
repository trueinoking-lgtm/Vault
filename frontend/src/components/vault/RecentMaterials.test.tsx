import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  normalizeBackendSourceStatus,
  mapBackendSourceStatusToLearnerStatus,
  isProcessingSourceStatus,
} from '@/lib/source-status'

// Mock the hooks
const mockUseRecentSources = vi.fn(() => ({
  data: [],
  isLoading: false,
}))

vi.mock('@/lib/hooks/use-vault', () => ({
  useRecentSources: (...args: unknown[]) => mockUseRecentSources(...args),
}))

// useTranslation is already mocked globally in setup.ts (t returns key string)

import RecentMaterials from '@/components/vault/RecentMaterials'

describe('RecentMaterials - Status Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecentSources.mockReturnValue({ data: [], isLoading: false })
  })

  describe('source-status utility', () => {
    it('maps new/queued status to preparing', () => {
      expect(mapBackendSourceStatusToLearnerStatus('new')).toBe('preparing')
      expect(mapBackendSourceStatusToLearnerStatus('queued')).toBe('preparing')
    })

    it('maps running status to building', () => {
      expect(mapBackendSourceStatusToLearnerStatus('running')).toBe('building')
    })

    it('maps completed status to ready', () => {
      expect(mapBackendSourceStatusToLearnerStatus('completed')).toBe('ready')
    })

    it('maps failed status to failed', () => {
      expect(mapBackendSourceStatusToLearnerStatus('failed')).toBe('failed')
    })

    it('normalizeBackendSourceStatus handles known statuses', () => {
      expect(normalizeBackendSourceStatus('new')).toBe('new')
      expect(normalizeBackendSourceStatus('queued')).toBe('queued')
      expect(normalizeBackendSourceStatus('running')).toBe('running')
      expect(normalizeBackendSourceStatus('completed')).toBe('completed')
      expect(normalizeBackendSourceStatus('failed')).toBe('failed')
    })

    it('normalizeBackendSourceStatus handles unknown statuses', () => {
      // Unknown with command_id -> new (processing)
      expect(normalizeBackendSourceStatus('unknown', true)).toBe('new')
      // Unknown without command_id -> completed (assumed done)
      expect(normalizeBackendSourceStatus('unknown', false)).toBe('completed')
    })

    it('isProcessingSourceStatus identifies processing states', () => {
      expect(isProcessingSourceStatus('new')).toBe(true)
      expect(isProcessingSourceStatus('queued')).toBe(true)
      expect(isProcessingSourceStatus('running')).toBe(true)
      expect(isProcessingSourceStatus('completed')).toBe(false)
      expect(isProcessingSourceStatus('failed')).toBe(false)
    })
  })

  describe('RecentMaterials component', () => {
    it('shows loading spinner when loading', () => {
      mockUseRecentSources.mockReturnValue({ data: undefined, isLoading: true })
      const { container } = render(<RecentMaterials />)
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no materials', () => {
      mockUseRecentSources.mockReturnValue({ data: [], isLoading: false })
      render(<RecentMaterials />)
      expect(screen.getByText('vault.noRecentMaterials')).toBeInTheDocument()
    })

    it('renders materials with status badges', () => {
      mockUseRecentSources.mockReturnValue({
        data: [
          { id: 'src1', title: 'Test Material', status: 'completed', updated: new Date().toISOString() },
        ],
        isLoading: false,
      })
      render(<RecentMaterials />)
      // Should show the ready status badge
      expect(screen.getByText('sources.statusReadyToStudy')).toBeInTheDocument()
      // Should show study CTA
      expect(screen.getByText('sources.studyThisMaterial')).toBeInTheDocument()
    })

    it('shows preparing status for new sources', () => {
      mockUseRecentSources.mockReturnValue({
        data: [
          { id: 'src1', title: 'Processing Material', status: 'new', updated: new Date().toISOString() },
        ],
        isLoading: false,
      })
      render(<RecentMaterials />)
      expect(screen.getByText('sources.statusPreparingText')).toBeInTheDocument()
    })

    it('shows building status for running sources', () => {
      mockUseRecentSources.mockReturnValue({
        data: [
          { id: 'src1', title: 'Building Material', status: 'running', updated: new Date().toISOString() },
        ],
        isLoading: false,
      })
      render(<RecentMaterials />)
      expect(screen.getByText('sources.statusBuildingStudyMemory')).toBeInTheDocument()
    })

    it('shows failed status for failed sources', () => {
      mockUseRecentSources.mockReturnValue({
        data: [
          { id: 'src1', title: 'Failed Material', status: 'failed', updated: new Date().toISOString() },
        ],
        isLoading: false,
      })
      render(<RecentMaterials />)
      expect(screen.getByText('sources.statusFailedFriendly')).toBeInTheDocument()
      // Should show retry CTA
      expect(screen.getByText('sources.retry')).toBeInTheDocument()
    })

    it('does not show operator/technical terms', () => {
      mockUseRecentSources.mockReturnValue({
        data: [
          { id: 'src1', title: 'Test Material', status: 'completed', updated: new Date().toISOString() },
        ],
        isLoading: false,
      })
      render(<RecentMaterials />)
      // Should not show technical terms
      expect(screen.queryByText(/CommandStatus/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/embedding/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/worker/i)).not.toBeInTheDocument()
    })
  })
})
