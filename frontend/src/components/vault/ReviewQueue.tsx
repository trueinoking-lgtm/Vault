'use client'

import Link from 'next/link'
import { RefreshCw, FileSignature, Bot, ArrowRight, Info } from 'lucide-react'
import { useRecentNotes } from '@/lib/hooks/use-vault'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

/**
 * Review Queue — UI shell only.
 *
 * Shows recent leaves as "Suggested review" candidates.
 * No persistence, no scoring, no weak-spot tracking.
 * Review history / spaced repetition to be added in a later Delta phase.
 *
 * LOCAL SCAFFOLDING ONLY: Reuses existing useRecentNotes hook.
 * No backend endpoints, no database writes, no localStorage.
 */
export default function ReviewQueue() {
  const { t } = useTranslation()
  const { data: leaves, isLoading } = useRecentNotes()

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.reviewQueue')}</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  const hasLeaves = leaves && leaves.length > 0

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.reviewQueue')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.reviewQueueDesc')}</p>

      {!hasLeaves ? (
        /* ── Empty state ── */
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('vault.reviewQueueEmpty')}</p>
          <p className="text-xs text-muted-foreground/70">{t('vault.reviewQueueEmptyDesc')}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notebooks">{t('vault.goToLibraries')}</Link>
          </Button>
        </div>
      ) : (
        /* ── Suggested review list ── */
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 mb-3">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {t('vault.reviewQueueSuggested')}
                </p>
                <p className="text-xs text-amber-700/70 mt-0.5">
                  {t('vault.reviewQueueSuggestedDesc')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {leaves.map((leaf) => {
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

          {/* Honest disclosure note */}
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground/60 italic">
            <Info className="h-3 w-3" />
            {t('vault.reviewQueueNote')}
          </div>
        </>
      )}
    </section>
  )
}
