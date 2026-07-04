'use client'

import Link from 'next/link'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { BookOpen, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const DISPLAY_COUNT = 3

export default function ContinueStudying() {
  const { t } = useTranslation()
  const { data: notebooks, isLoading } = useNotebooks(false)

  const recent = notebooks?.slice(0, DISPLAY_COUNT) ?? []

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.continueStudying')}</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  if (recent.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-1">{t('vault.continueStudying')}</h2>
        <p className="text-sm text-muted-foreground mb-3">{t('vault.continueStudyingDesc')}</p>
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('vault.noLibrariesToStudy')}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notebooks">{t('vault.goToLibraries')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.continueStudying')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.continueStudyingDesc')}</p>
      <div className="space-y-3">
        {recent.map((nb) => (
          <div
            key={nb.id}
            className="flex items-center gap-3 p-4 rounded-lg border"
          >
            <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{nb.name}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>
                  {t('vault.materialsCount').replace('{count}', String(nb.source_count ?? 0))}
                </span>
                {nb.updated && (
                  <span>
                    {t('vault.lastUpdated').replace(
                      '{time}',
                      formatDistanceToNow(new Date(nb.updated), { addSuffix: true }),
                    )}
                  </span>
                )}
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="shrink-0">
              <Link href={`/notebooks/${nb.id}`}>
                {t('vault.continue')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
