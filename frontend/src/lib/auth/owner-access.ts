export const OWNER_ACCESS_COOKIE = 'vault-owner-access'
export const OWNER_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 12 // 12 hours

/**
 * Owner-route hardening only. This is NOT full RBAC.
 *
 * Today we only have a coarse owner boundary for privileged routes. Future
 * authorization work should replace this with role-aware checks for at least:
 * owner, learner, teacher, and school_admin.
 */
export function isOwnerProtectedPath(pathname: string): boolean {
  return (
    pathname === '/owner' ||
    pathname.startsWith('/owner/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/settings/api-keys'
  )
}

export function resolveOwnerCanonicalPath(pathname: string, search = ''): string {
  if (pathname === '/admin') {
    return '/owner'
  }

  if (pathname === '/admin/api-keys' || pathname === '/settings/api-keys') {
    return '/owner/ai'
  }

  return `${pathname}${search}`
}

export function buildOwnerLoginRedirect(nextPath: string): string {
  const params = new URLSearchParams({
    owner: '1',
    next: nextPath,
  })

  return `/login?${params.toString()}`
}
