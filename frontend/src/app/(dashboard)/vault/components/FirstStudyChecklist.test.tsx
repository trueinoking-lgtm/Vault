import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the hooks used by FirstStudyChecklist
const mockUseNotebooks = vi.fn(() => ({
  data: [],
  isLoading: false,
}))

const mockUseRecentSources = vi.fn(() => ({
  data: [],
  isLoading: false,
}))

const mockUseRecentNotes = vi.fn(() => ({
  data: [],
  isLoading: false,
}))

vi.mock('@/lib/hooks/use-notebooks', () => ({
  useNotebooks: (...args: unknown[]) => mockUseNotebooks(...args),
}))

vi.mock('@/lib/hooks/use-vault', () => ({
  useRecentSources: (...args: unknown[]) => mockUseRecentSources(...args),
  useRecentNotes: (...args: unknown[]) => mockUseRecentNotes(...args),
}))

// useCreateDialogs is already mocked globally in setup.ts
// useTranslation is already mocked globally in setup.ts (t returns key string)

import FirstStudyChecklist from './FirstStudyChecklist'

describe('FirstStudyChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNotebooks.mockReturnValue({ data: [], isLoading: false })
    mockUseRecentSources.mockReturnValue({ data: [], isLoading: false })
    mockUseRecentNotes.mockReturnValue({ data: [], isLoading: false })
  })

  it('renders checklist title', () => {
    render(<FirstStudyChecklist />)
    expect(screen.getByText('vault.checklist.title')).toBeInTheDocument()
  })

  it('shows all 5 checklist steps', () => {
    render(<FirstStudyChecklist />)
    expect(screen.getByText('vault.checklist.createLibrary')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.addMaterial')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.materialReady')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.startStudying')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.reviewMissed')).toBeInTheDocument()
  })

  it('shows 0/5 progress when nothing exists', () => {
    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    expect(progressSpan?.textContent).toContain('0')
    expect(progressSpan?.textContent).toContain('5')
  })

  it('shows CTAs for incomplete steps', () => {
    render(<FirstStudyChecklist />)
    expect(screen.getByText('vault.checklist.createLibraryCta')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.addMaterialCta')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.materialReadyCta')).toBeInTheDocument()
  })

  it('marks library step complete when libraries exist', () => {
    mockUseNotebooks.mockReturnValue({
      data: [{ id: 'nb1', name: 'Test Library' }],
      isLoading: false,
    })

    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    expect(progressSpan?.textContent).toContain('1')
    expect(screen.queryByText('vault.checklist.createLibraryCta')).not.toBeInTheDocument()
  })

  it('marks material step complete when sources exist with completed status', () => {
    mockUseRecentSources.mockReturnValue({
      data: [{ id: 'src1', status: 'completed', command_id: undefined }],
      isLoading: false,
    })

    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    // material=completed + ready=completed = 2 steps
    expect(progressSpan?.textContent).toContain('2')
  })

  it('marks studying step complete when leaves exist', () => {
    mockUseRecentNotes.mockReturnValue({
      data: [{ id: 'note1' }],
      isLoading: false,
    })

    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    expect(progressSpan?.textContent).toContain('1')
  })

  it('does not show allComplete when reviewMissed is not done', () => {
    mockUseNotebooks.mockReturnValue({
      data: [{ id: 'nb1', name: 'Test Library' }],
      isLoading: false,
    })
    mockUseRecentSources.mockReturnValue({
      data: [{ id: 'src1', status: 'completed', command_id: undefined }],
      isLoading: false,
    })
    mockUseRecentNotes.mockReturnValue({
      data: [{ id: 'note1' }],
      isLoading: false,
    })

    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    expect(progressSpan?.textContent).toContain('4')
    expect(screen.queryByText('vault.checklist.allComplete')).not.toBeInTheDocument()
  })

  it('shows loading spinner when data is loading', () => {
    mockUseNotebooks.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { container } = render(<FirstStudyChecklist />)
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})
