import { NextRequest, NextResponse } from 'next/server'

import {
  OWNER_ACCESS_COOKIE,
  OWNER_ACCESS_COOKIE_MAX_AGE,
} from '@/lib/auth/owner-access'

type OwnerAccessSource =
  | 'owner-password-env'
  | 'api-password-env'
  | 'backend-password-auth'
  | 'disabled'
  | 'unavailable'

interface OwnerAccessConfig {
  enabled: boolean
  source: OwnerAccessSource
  verify: (password: string) => Promise<boolean>
}

function getSameOriginUrl(request: NextRequest, pathname: string): string {
  return new URL(pathname, request.nextUrl.origin).toString()
}

async function resolveOwnerAccessConfig(request: NextRequest): Promise<OwnerAccessConfig> {
  const ownerPassword = process.env.VAULT_OWNER_PASSWORD?.trim()
  if (ownerPassword) {
    return {
      enabled: true,
      source: 'owner-password-env',
      verify: async (password: string) => password === ownerPassword,
    }
  }

  const apiPassword = process.env.VAULT_PASSWORD?.trim()
  if (apiPassword) {
    return {
      enabled: true,
      source: 'api-password-env',
      verify: async (password: string) => password === apiPassword,
    }
  }

  try {
    const statusResponse = await fetch(getSameOriginUrl(request, '/api/auth/status'), {
      cache: 'no-store',
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    })

    if (!statusResponse.ok) {
      return {
        enabled: false,
        source: 'unavailable',
        verify: async () => false,
      }
    }

    const statusData = await statusResponse.json() as { auth_enabled?: boolean }
    if (!statusData.auth_enabled) {
      return {
        enabled: false,
        source: 'disabled',
        verify: async () => false,
      }
    }

    return {
      enabled: true,
      source: 'backend-password-auth',
      verify: async (password: string) => {
        const response = await fetch(getSameOriginUrl(request, '/api/notebooks'), {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${password}`,
          },
        })

        return response.ok
      },
    }
  } catch {
    return {
      enabled: false,
      source: 'unavailable',
      verify: async () => false,
    }
  }
}

export async function GET(request: NextRequest) {
  const config = await resolveOwnerAccessConfig(request)

  return NextResponse.json({
    enabled: config.enabled,
    source: config.source,
  })
}

export async function POST(request: NextRequest) {
  const config = await resolveOwnerAccessConfig(request)

  if (!config.enabled) {
    return NextResponse.json(
      {
        detail:
          'Owner access is not configured yet. Set VAULT_OWNER_PASSWORD or enable API password auth before using /owner routes.',
      },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => null) as { password?: string } | null
  const password = body?.password?.trim()

  if (!password) {
    return NextResponse.json({ detail: 'Owner password is required.' }, { status: 400 })
  }

  const verified = await config.verify(password)
  if (!verified) {
    return NextResponse.json({ detail: 'Owner access denied.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, source: config.source })
  response.cookies.set({
    name: OWNER_ACCESS_COOKIE,
    value: 'granted',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: OWNER_ACCESS_COOKIE_MAX_AGE,
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: OWNER_ACCESS_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })

  return response
}
