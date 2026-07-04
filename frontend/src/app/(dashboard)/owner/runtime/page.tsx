'use client'

import { RebuildEmbeddings } from '../../advanced/components/RebuildEmbeddings'
import { SystemInfo } from '../../advanced/components/SystemInfo'

export default function OwnerRuntimePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Owner / Runtime</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">Runtime tools</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            System information, rebuild jobs, and runtime-oriented maintenance live here for the owner shell.
          </p>
        </div>

        <div className="space-y-6">
          <SystemInfo />
          <RebuildEmbeddings />
        </div>
      </div>
    </div>
  )
}
