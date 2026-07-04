'use client'

import { RefreshCw } from 'lucide-react'

import { SettingsForm } from '../../settings/components/SettingsForm'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/lib/hooks/use-settings'

export default function OwnerSettingsPage() {
  const { refetch } = useSettings()

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Owner / Processing</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Processing defaults</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <SettingsForm />
        </div>
      </div>
    </div>
  )
}
