'use client'

import Link from 'next/link'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import LibraryMemoryCard from './LibraryMemoryCard'

const SCAN_COUNT = 3

export default function LearningPanel() {
  const { t } = useTranslation()
  const { data: notebooks, isLoading } = useNotebooks(false)

  const recent = notebooks?.slice(0, SCAN_COUNT) ?? []

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.learningPanel')}</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  if (recent.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.learningPanel')}</h2>
        <div className="text-center py-8 space-y-3">
          <p className="text-sm font-medium">{t('vault.noLearningMemory')}</p>
          <p className="text-sm text-muted-foreground">{t('vault.noLearningMemoryDesc')}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notebooks">{t('vault.goToLibraries')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.learningPanel')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.learningPanelDesc')}</p>
      <div className="space-y-3">
        {recent.map((nb) => (
          <LibraryMemoryCard key={nb.id} notebook={nb} />
        ))}
      </div>
    </section>
  )
}
