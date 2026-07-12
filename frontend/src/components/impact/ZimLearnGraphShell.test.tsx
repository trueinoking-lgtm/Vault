import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ZimLearnGraphShell } from './ZimLearnGraphShell'

const pathname = vi.hoisted(() => ({ value: '/impact/classes' }))

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}))

describe('ZimLearnGraphShell', () => {
  beforeEach(() => {
    pathname.value = '/impact/classes'
  })

  it('renders the standalone product identity and required navigation', () => {
    render(<ZimLearnGraphShell><p>Page content</p></ZimLearnGraphShell>)

    expect(screen.getAllByText('ZimLearnGraph').length).toBeGreaterThan(0)
    expect(screen.getByText('Assessment and learning intelligence for schools.')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'ZimLearnGraph primary navigation' })).toBeInTheDocument()
    expect(screen.queryByText(/notebooks|materials|AI providers/i)).not.toBeInTheDocument()
  })

  it('marks the current route and opens a reachable mobile menu', () => {
    render(<ZimLearnGraphShell><p>Page content</p></ZimLearnGraphShell>)

    expect(screen.getAllByRole('link', { name: /Classes/ })[0]).toHaveAttribute('aria-current', 'page')
    const toggle = screen.getByRole('button', { name: 'Open product navigation' })
    fireEvent.click(toggle)
    expect(screen.getByRole('dialog', { name: 'Product navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close product navigation' })).toBeInTheDocument()
  })

  it('keeps the Phase A disclosure visible', () => {
    render(<ZimLearnGraphShell><p>Page content</p></ZimLearnGraphShell>)
    expect(screen.getByText('Seeded multi-school demonstration data. No learner identities. Not verified pilot evidence.')).toBeInTheDocument()
  })
})
