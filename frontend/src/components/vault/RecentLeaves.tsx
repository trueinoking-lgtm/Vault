'use client'

import Link from 'next/link'
import { FileSignature, Bot, ArrowRight } from 'lucide-react'
import { useRecentNotes } from '@/lib/hooks/use-vault'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

export default function RecentLeaves() {
  const { t } = useTranslation()
  const { data: leaves, isLoading } = useRecentNotes()

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.recentLeaves')}</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  if (!leaves || leaves.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-1">{t('vault.recentLeaves')}</h2>
        <p className="text-sm text-muted-foreground mb-3">{t('vault.recentLeavesDesc')}</p>
        <div className="text-center py-8 space-y-3">
          <p className="text-sm text-muted-foreground">{t('vault.noRecentLeaves')}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notebooks">{t('vault.goToLibraries')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.recentLeaves')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.recentLeavesDesc')}</p>
      <div className="space-y-3">
        {leaves.map((leaf) => {
          // Note: NoteResponse has no notebook_id, so we link to /notebooks
          // TODO: direct Leaf navigation needs parent Library context later
          const isAi = leaf.note_type === 'ai'
          const TypeIcon = isAi ? Bot : FileSignature

          return (
            <div
              key={leaf.id}
              className="flex items-center gap-3 p-4 rounded-lg border"
            >
              <TypeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {leaf.title || t('vault.untitledLeaf')}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>{isAi ? t('vault.aiGenerated') : t('vault.humanCreated')}</span>
                  {leaf.updated && (
                    <span>
                      {formatDistanceToNow(new Date(leaf.updated), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/notebooks">
                  {t('vault.openLibrary')}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
