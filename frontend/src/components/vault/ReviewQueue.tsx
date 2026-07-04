'use client'

import Link from 'next/link'
import {
  RefreshCw,
  FileSignature,
  Bot,
  ArrowRight,
  Info,
  BookmarkCheck,
  CheckCircle,
  AlertCircle,
  Target,
} from 'lucide-react'
import { useReviewQueue } from '@/lib/hooks/use-study'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

/**
 * Review Queue — powered by persisted review state (Delta H).
 *
 * Three sections (Delta K):
 *   1. Needs practice  — items where is_weak_spot === true
 *   2. Needs review    — remaining items with needs_review === true
 *   3. Recently remembered — items with needs_review === false
 *
 * Falls back to an honest empty/error state when no data is available.
 */
export default function ReviewQueue() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch } = useReviewQueue()

  // ── Loading state ──
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

  // ── Error state ──
  if (isError) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.reviewQueue')}</h2>
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-700">
            {t('vault.reviewQueueError') || "Couldn't load your review history."}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </section>
    )
  }

  const items = data?.items ?? []

  // Three-way classification (Delta K)
  const needsPractice = items.filter((i) => i.is_weak_spot === true)
  const needsReview = items.filter((i) => i.needs_review === true && i.is_weak_spot !== true)
  const remembered = items.filter((i) => i.needs_review === false)

  // ── Empty state — no review data yet ──
  if (items.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-1">{t('vault.reviewQueue')}</h2>
        <p className="text-sm text-muted-foreground mb-3">{t('vault.reviewQueueDesc')}</p>

        <div className="text-center py-6 space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-amber-50 p-3">
              <BookmarkCheck className="h-6 w-6 text-amber-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground/80">
            {t('vault.reviewQueueEmptyNew') || "Nothing to review yet"}
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {t('vault.reviewQueueEmptyNewDesc') ||
              'Use Check yourself on a leaf and Vault will start building your review queue.'}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/notebooks">{t('vault.goToLibraries')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  // ── Items exist — show review queue ──
  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.reviewQueue')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.reviewQueueDesc')}</p>

      {/* Needs practice section — weak-spot items */}
      {needsPractice.length > 0 && (
        <div className="mb-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50/30 p-3 mb-3">
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  {t('vault.needsPractice') || 'Needs practice'}
                </p>
                <p className="text-xs text-orange-700/70 mt-0.5">
                  {t('vault.needsPracticeDesc') ||
                    'You have marked these leaves for review more than once. Revisit them when you are ready.'}
                </p>
                <p className="text-xs text-orange-700/50 mt-0.5">
                  {needsPractice.length === 1
                    ? (t('vault.needsPracticeSingle') || '1 leaf needs extra practice.')
                    : (t('vault.needsPracticeMultiple') ||
                        `${needsPractice.length} leaves need extra practice.`)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {needsPractice.map((item) => (
              <ReviewQueueItemCard
                key={item.note_id}
                item={item}
                variant="needs_practice"
              />
            ))}
          </div>
        </div>
      )}

      {/* Needs review section — regular needs-review items only */}
      {needsReview.length > 0 && (
        <div className="mb-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3 mb-3">
            <div className="flex items-start gap-2">
              <RefreshCw className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {t('vault.reviewQueueNeedsReview') || 'Needs review'}
                </p>
                <p className="text-xs text-amber-700/70 mt-0.5">
                  {needsReview.length === 1
                    ? (t('vault.reviewQueueNeedsReviewSingle') || '1 leaf needs another look.')
                    : (t('vault.reviewQueueNeedsReviewMultiple') ||
                        `${needsReview.length} leaves need another look.`)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {needsReview.map((item) => (
              <ReviewQueueItemCard
                key={item.note_id}
                item={item}
                variant="needs_review"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently remembered section */}
      {remembered.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t('vault.reviewQueueRemembered') || 'Recently remembered'}
          </h3>
          <div className="space-y-2">
            {remembered.map((item) => (
              <ReviewQueueItemCard
                key={item.note_id}
                item={item}
                variant="remembered"
              />
            ))}
          </div>
        </div>
      )}

      {/* Honest disclosure note */}
      <div className="flex items-center gap-1.5 mt-4 text-xs text-muted-foreground/60 italic">
        <Info className="h-3 w-3" />
        {t('vault.reviewQueueNote')}
      </div>
    </section>
  )
}

// ── Sub-component: a single review queue item card ──

interface ReviewQueueItemCardProps {
  item: {
    note_id: string
    notebook_id?: string
    title?: string | null
    content_preview?: string | null
    needs_review: boolean
    last_reviewed?: string | null
    review_count: number
    is_weak_spot?: boolean
  }
  variant: 'needs_practice' | 'needs_review' | 'remembered'
}

function ReviewQueueItemCard({ item, variant }: ReviewQueueItemCardProps) {
  const { t } = useTranslation()

  const TypeIcon = variant === 'needs_practice'
    ? Target
    : variant === 'needs_review'
      ? RefreshCw
      : CheckCircle

  const iconColor = variant === 'needs_practice'
    ? 'text-orange-500'
    : variant === 'needs_review'
      ? 'text-amber-500'
      : 'text-green-500'

  const linkHref = item.notebook_id
    ? `/notebooks/${item.notebook_id}`
    : '/notebooks'

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border">
      <TypeIcon className={`h-5 w-5 shrink-0 ${iconColor}`} />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate">
          {item.title || t('vault.untitledLeaf')}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
          {item.last_reviewed && (
            <span>
              {formatDistanceToNow(new Date(item.last_reviewed), { addSuffix: true })}
            </span>
          )}
          {item.review_count > 1 && (
            <span>
              {t('vault.reviewCount') || 'Reviewed'} {item.review_count}x
            </span>
          )}
        </div>
      </div>
      <Button asChild variant="ghost" size="sm" className="shrink-0">
        <Link href={linkHref}>
          {t('vault.openLibrary')}
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </Button>
    </div>
  )
}
