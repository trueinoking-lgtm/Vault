'use client'

import Link from 'next/link'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { BookOpen } from 'lucide-react'

export default function RecentLibraries() {
  const { t } = useTranslation()
  const { data: notebooks, isLoading } = useNotebooks(false)

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  const recent = notebooks?.slice(0, 6) ?? []

  if (recent.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {t('vault.noLibrariesYet')}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {recent.map((nb) => (
        <Link
          key={nb.id}
          href={`/notebooks/${nb.id}`}
          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
        >
          <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="font-medium truncate">{nb.name}</div>
            {nb.description && (
              <div className="text-sm text-muted-foreground truncate">
                {nb.description}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}
