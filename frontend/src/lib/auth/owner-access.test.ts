import { describe, expect, it } from 'vitest'

import {
  buildOwnerLoginRedirect,
  isOwnerProtectedPath,
  resolveOwnerCanonicalPath,
} from './owner-access'

describe('owner access helpers', () => {
  it('matches owner and legacy compatibility routes', () => {
    expect(isOwnerProtectedPath('/owner')).toBe(true)
    expect(isOwnerProtectedPath('/owner/ai')).toBe(true)
    expect(isOwnerProtectedPath('/admin')).toBe(true)
    expect(isOwnerProtectedPath('/admin/api-keys')).toBe(true)
    expect(isOwnerProtectedPath('/settings/api-keys')).toBe(true)
  })

  it('does not match learner routes', () => {
    expect(isOwnerProtectedPath('/')).toBe(false)
    expect(isOwnerProtectedPath('/vault')).toBe(false)
    expect(isOwnerProtectedPath('/sources')).toBe(false)
    expect(isOwnerProtectedPath('/notebooks')).toBe(false)
    expect(isOwnerProtectedPath('/search')).toBe(false)
    expect(isOwnerProtectedPath('/podcasts')).toBe(false)
  })

  it('maps legacy compatibility routes to canonical owner destinations', () => {
    expect(resolveOwnerCanonicalPath('/admin')).toBe('/owner')
    expect(resolveOwnerCanonicalPath('/admin/api-keys')).toBe('/owner/ai')
    expect(resolveOwnerCanonicalPath('/settings/api-keys')).toBe('/owner/ai')
    expect(resolveOwnerCanonicalPath('/owner/ai', '?tab=models')).toBe('/owner/ai?tab=models')
  })

  it('builds login redirects that preserve the requested route', () => {
    expect(buildOwnerLoginRedirect('/owner/ai?tab=models')).toBe(
      '/login?owner=1&next=%2Fowner%2Fai%3Ftab%3Dmodels'
    )
  })
})
