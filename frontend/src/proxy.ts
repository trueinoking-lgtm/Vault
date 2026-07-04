import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import {
  OWNER_ACCESS_COOKIE,
  buildOwnerLoginRedirect,
  isOwnerProtectedPath,
  resolveOwnerCanonicalPath,
} from '@/lib/auth/owner-access'

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Owner-route hardening only: block privileged owner/admin compatibility entry
  // points until the browser has completed the explicit owner gate.
  // Full role-based authorization is still pending and should eventually support
  // at minimum owner + learner, then teacher + school_admin.
  if (isOwnerProtectedPath(pathname)) {
    const ownerCookie = request.cookies.get(OWNER_ACCESS_COOKIE)?.value

    if (ownerCookie !== 'granted') {
      const nextPath = resolveOwnerCanonicalPath(pathname, search)
      const redirectUrl = new URL(buildOwnerLoginRedirect(nextPath), request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
