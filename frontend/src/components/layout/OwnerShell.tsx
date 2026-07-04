'use client'

import { ShieldAlert } from 'lucide-react'

import { OwnerSidebar } from './OwnerSidebar'
import { SetupBanner } from './SetupBanner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface OwnerShellProps {
  children: React.ReactNode
}

export function OwnerShell({ children }: OwnerShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <OwnerSidebar />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        <SetupBanner />
        <div className="border-b border-slate-200 bg-slate-100/90 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/80">
          <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Owner route hardening enabled</AlertTitle>
            <AlertDescription>
              Beta B adds an explicit owner gate around this command room, but this is still
              not production-grade RBAC. Future authorization should include at least owner
              and learner roles, then later teacher and school_admin roles with server-side
              enforcement.
            </AlertDescription>
          </Alert>
        </div>
        {children}
      </main>
    </div>
  )
}
