import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HiveMindShell } from './HiveMindShell'

const pathname = vi.hoisted(() => ({ value: '/impact/classes' }))

vi.mock('next/navigation', () => ({
  usePathname: () => pathname.value,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
}))

describe('HiveMindShell', () => {
  beforeEach(() => {
    pathname.value = '/impact/classes'
  })

  it('renders the standalone product identity and required navigation', () => {
    render(<HiveMindShell><p>Page content</p></HiveMindShell>)

    expect(screen.getAllByText('HiveMind Intelligence').length).toBeGreaterThan(0)
    expect(screen.getByText('Assessment and learning intelligence for schools.')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'HiveMind Intelligence primary navigation' })).toBeInTheDocument()
    expect(screen.queryByText(/notebooks|materials|AI providers/i)).not.toBeInTheDocument()
  })

  it('marks the current route and opens a reachable mobile menu', () => {
    render(<HiveMindShell><p>Page content</p></HiveMindShell>)

    expect(screen.getAllByRole('link', { name: /Classes/ })[0]).toHaveAttribute('aria-current', 'page')
    const toggle = screen.getByRole('button', { name: 'Open product navigation' })
    fireEvent.click(toggle)
    expect(screen.getByRole('dialog', { name: 'Product navigation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close product navigation' })).toBeInTheDocument()
  })

  it('keeps the merged Phase A disclosure visible', () => {
    render(<HiveMindShell><p>Page content</p></HiveMindShell>)
    // Disclosure was merged into one compact bar during the declutter pass.
    expect(screen.getByText(/Seeded multi-school demonstration data/)).toBeInTheDocument()
    expect(screen.getByText(/Focused preview of production capabilities/)).toBeInTheDocument()
  })
})
