'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { getConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/lib/hooks/use-translation'
import { isOwnerProtectedPath } from '@/lib/auth/owner-access'
import { authApi } from '@/lib/api/auth'

interface OwnerAccessStatus {
  enabled: boolean
  source: string
}

export function LoginForm() {
  const { t, language } = useTranslation()
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const {
    login,
    isLoading,
    error,
    authRequired,
    checkAuthRequired,
    hasHydrated,
    isAuthenticated,
  } = useAuthStore()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAuthorizingOwner, setIsAuthorizingOwner] = useState(false)
  const [ownerAccessError, setOwnerAccessError] = useState<string | null>(null)
  const [ownerAccessStatus, setOwnerAccessStatus] = useState<OwnerAccessStatus | null>(null)
  const [configInfo, setConfigInfo] = useState<{ apiUrl: string; version: string; buildTime: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedPath = searchParams.get('next')
  const pilotRequested = searchParams.get('pilot') === '1' || (requestedPath?.startsWith('/impact/pilot') ?? false)
  const ownerRequested = useMemo(() => {
    return searchParams.get('owner') === '1' || isOwnerProtectedPath(requestedPath ?? '')
  }, [requestedPath, searchParams])

  // Load config info for debugging
  useEffect(() => {
    getConfig().then(cfg => {
      setConfigInfo({
        apiUrl: cfg.apiUrl,
        version: cfg.version,
        buildTime: cfg.buildTime,
      })
    }).catch(err => {
      console.error('Failed to load config:', err)
    })
  }, [])

  useEffect(() => {
    if (!ownerRequested) {
      setOwnerAccessStatus(null)
      return
    }

    let cancelled = false
    fetch('/api/owner-access', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Owner access status failed: ${response.status}`)
        }
        return response.json() as Promise<OwnerAccessStatus>
      })
      .then((status) => {
        if (!cancelled) {
          setOwnerAccessStatus(status)
        }
      })
      .catch((err) => {
        console.error('Failed to load owner access status:', err)
        if (!cancelled) {
          setOwnerAccessStatus({ enabled: false, source: 'unavailable' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [ownerRequested])

  // Check if authentication is required on mount
  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    const checkAuth = async () => {
      try {
        const required = await checkAuthRequired()

        // If auth is not required, redirect to notebooks unless the user is explicitly
        // trying to unlock the owner surface.
        if (!required && !ownerRequested) {
          router.push('/notebooks')
        }
      } catch (error) {
        console.error('Error checking auth requirement:', error)
        // On error, assume auth is required to be safe
      } finally {
        setIsCheckingAuth(false)
      }
    }

    if (authRequired !== null) {
      if (!authRequired && isAuthenticated && !ownerRequested) {
        router.push('/notebooks')
      } else {
        setIsCheckingAuth(false)
      }
    } else {
      void checkAuth()
    }
  }, [
    hasHydrated,
    authRequired,
    checkAuthRequired,
    router,
    isAuthenticated,
    ownerRequested,
  ])

  if (!hasHydrated || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    )
  }

  if (authRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>{t('common.connectionError')}</CardTitle>
            <CardDescription>
              {t('common.unableToConnect')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {error || t('auth.connectErrorHint')}
                </div>
              </div>

              {configInfo && (
                <div className="space-y-2 text-xs text-muted-foreground border-t pt-3">
                  <div className="font-medium">{t('common.diagnosticInfo')}:</div>
                  <div className="space-y-1 font-mono">
                    <div>{t('common.version')}: {configInfo.version}</div>
                    <div>{t('common.built')}: {new Date(configInfo.buildTime).toLocaleString(language === 'zh-CN' ? 'zh-CN' : language === 'zh-TW' ? 'zh-TW' : 'en-US')}</div>
                    <div className="break-all">{t('common.apiUrl')}: {configInfo.apiUrl}</div>
                    <div className="break-all">{t('common.frontendUrl')}: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                  </div>
                  <div className="text-xs pt-2">
                    {t('common.checkConsoleLogs')}
                  </div>
                </div>
              )}

              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                {t('common.retryConnection')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      return
    }

    setOwnerAccessError(null)

    if (ownerRequested) {
      setIsAuthorizingOwner(true)
      try {
        if (authRequired) {
          const authenticated = await login(password)
          if (!authenticated) {
            return
          }
        }

        const response = await fetch('/api/owner-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => null) as { detail?: string } | null
          setOwnerAccessError(data?.detail || 'Owner access verification failed.')
          return
        }

        const storedRedirect = typeof window !== 'undefined'
          ? sessionStorage.getItem('redirectAfterLogin')
          : null
        const nextPath = requestedPath || storedRedirect || '/owner'

        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('redirectAfterLogin')
        }
        router.push(nextPath)
        return
      } catch (err) {
        console.error('Owner access error:', err)
        setOwnerAccessError('Owner access verification failed.')
        return
      } finally {
        setIsAuthorizingOwner(false)
      }
    }

    try {
      const success = pilotRequested ? await login(password, email) : await login(password)
      if (success) {
        // Phase F4 — owner-cookie auto bridge.
        // After a successful login, check if the user is a global owner.
        // If so, automatically set the vault-owner-access cookie so they
        // don't need to enter the password again when visiting /owner.
        // This is best-effort and non-blocking: failures log a warning
        // and the existing owner gate will handle missing cookies.
        //
        // nav visibility is UX, not authorization — backend guards remain
        // the real security boundary (#F3b).
        let shouldBridgeOwner = false
        try {
          if (!pilotRequested) {
            const meResponse = await authApi.me()
            shouldBridgeOwner = meResponse.owner_access || meResponse.user?.is_global_owner === true
          }
          if (shouldBridgeOwner) {
            const ownerResp = await fetch('/api/owner-access', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password }),
            })
            if (!ownerResp.ok) {
              console.warn('Owner-access bridge returned non-OK:', ownerResp.status)
            }
          }
        } catch (bridgeErr) {
          // Non-blocking — don't break login if owner bridge fails
          console.warn('Owner-access bridge failed (non-blocking):', bridgeErr)
        }

        const storedRedirect = typeof window !== 'undefined'
          ? sessionStorage.getItem('redirectAfterLogin')
          : null
        const nextPath = requestedPath || storedRedirect || (pilotRequested ? '/impact/pilot' : '/notebooks')
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('redirectAfterLogin')
        }
        router.push(nextPath)
      }
    } catch (err) {
      console.error('Unhandled error during login:', err)
    }
  }

  const formDisabled = isLoading || isAuthorizingOwner || (ownerRequested && ownerAccessStatus?.enabled === false)
  const formError = ownerAccessError || error

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>{ownerRequested ? 'Owner access required' : pilotRequested ? 'Pilot workspace sign in' : t('auth.loginTitle')}</CardTitle>
          <CardDescription>
            {ownerRequested
              ? 'Re-enter the existing admin password to unlock privileged owner routes. Full RBAC is still pending.'
              : pilotRequested
                ? 'Use the email and temporary password issued by your pilot administrator.'
                : t('auth.loginDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {ownerRequested && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-950">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Owner route hardening enabled</div>
                    <div className="mt-1 text-xs leading-5">
                      This owner gate protects `/owner/*` and the legacy compatibility entry points.
                      Future authorization work still needs real owner/learner roles, then teacher and school_admin roles.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {ownerRequested && ownerAccessStatus?.enabled === false && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  Owner access is not configured yet. Set `VAULT_OWNER_PASSWORD` or enable the existing API password before using owner routes.
                </div>
              </div>
            )}

            {pilotRequested && !ownerRequested && (
              <div>
                <Input
                  type="email"
                  aria-label="Pilot account email"
                  placeholder="Pilot account email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formDisabled}
                  required
                />
              </div>
            )}

            <div>
              <Input
                type="password"
                placeholder={ownerRequested ? 'Owner password' : t('auth.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={formDisabled}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                {formError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={formDisabled || !password.trim() || (pilotRequested && !email.trim())}
            >
              {isLoading || isAuthorizingOwner
                ? (ownerRequested ? 'Verifying owner access...' : t('auth.signingIn'))
                : (ownerRequested ? 'Unlock owner routes' : t('auth.signIn'))}
            </Button>

            {configInfo && (
              <div className="text-xs text-center text-muted-foreground pt-2 border-t">
                <div>{t('common.version')} {configInfo.version}</div>
                <div className="font-mono text-[10px]">{configInfo.apiUrl}</div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
