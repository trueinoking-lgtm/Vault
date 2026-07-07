import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function LoginFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="animate-pulse text-slate-400">Loading...</div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </ErrorBoundary>
  )
}
