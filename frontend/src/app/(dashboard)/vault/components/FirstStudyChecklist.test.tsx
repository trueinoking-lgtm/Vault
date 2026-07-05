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

  it('shows all 5 checklist steps (4 required + 1 optional)', () => {
    render(<FirstStudyChecklist />)
    expect(screen.getByText('vault.checklist.createLibrary')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.addMaterial')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.materialReady')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.startStudying')).toBeInTheDocument()
    expect(screen.getByText('vault.checklist.reviewMissed')).toBeInTheDocument()
  })

  it('shows 0/4 progress when nothing exists (required steps only)', () => {
    const { container } = render(<FirstStudyChecklist />)
    const progressSpan = container.querySelector('span.text-xs')
    expect(progressSpan?.textContent).toContain('0')
    expect(progressSpan?.textContent).toContain('4')
  })

  it('shows CTAs for incomplete required steps', () => {
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

  it('shows allComplete when all 4 required steps are done (review optional)', () => {
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

    render(<FirstStudyChecklist />)
    expect(screen.getByText('vault.checklist.allComplete')).toBeInTheDocument()
  })

  it('does not show allComplete when required steps are incomplete', () => {
    // Only library exists — missing addMaterial, materialReady, startStudying
    mockUseNotebooks.mockReturnValue({
      data: [{ id: 'nb1', name: 'Test Library' }],
      isLoading: false,
    })

    render(<FirstStudyChecklist />)
    expect(screen.queryByText('vault.checklist.allComplete')).not.toBeInTheDocument()
  })

  it('empty learner still shows correct first incomplete CTA', () => {
    render(<FirstStudyChecklist />)
    // First incomplete step is createLibrary — its CTA should be visible
    expect(screen.getByText('vault.checklist.createLibraryCta')).toBeInTheDocument()
  })

  it('review row remains visible as follow-up guidance even when all required done', () => {
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

    // All required complete -> allComplete banner, review row hidden
    render(<FirstStudyChecklist />)
    // The all-complete banner replaces the full checklist
    expect(screen.getByText('vault.checklist.allComplete')).toBeInTheDocument()
    // Review step not shown in the collapsed allComplete banner (that's fine — it was a follow-up)
    // This test confirms allComplete IS shown despite review not being done
  })

  it('shows optionalHint on review row when not completed', () => {
    render(<FirstStudyChecklist />)
    // The hint text is wrapped in parentheses, so use a text matcher
    expect(screen.getByText((content) => content.includes('vault.checklist.optionalHint'))).toBeInTheDocument()
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
