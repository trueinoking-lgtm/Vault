'use client'

import Link from 'next/link'
import { useNotes } from '@/lib/hooks/use-notes'
import { useTranslation } from '@/lib/hooks/use-translation'
import { isLearningMemoryLeaf, extractSavedGradingMessageIds } from '@/lib/notebooks/learning-memory'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ExternalLink, Brain } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { NotebookResponse } from '@/lib/types/api'

interface LibraryMemoryCardProps {
  notebook: NotebookResponse
}

export default function LibraryMemoryCard({ notebook }: LibraryMemoryCardProps) {
  const { t } = useTranslation()
  const { data: notes, isLoading } = useNotes(notebook.id)

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border">
        <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{notebook.name}</div>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  const memoryLeaf = notes?.find(isLearningMemoryLeaf)
  const hasMemory = !!memoryLeaf
  const content = memoryLeaf?.content ?? ''

  const weakSpotsCount = hasMemory ? extractSavedGradingMessageIds(content).length : 0
  const entriesCount = hasMemory
    ? (content.match(/^## /gm) ?? []).length
    : 0

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border">
      <BookOpen className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{notebook.name}</span>
          {hasMemory ? (
            <Badge variant="default" className="text-xs shrink-0">
              {t('vault.learningMemoryActive')}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs shrink-0">
              {t('vault.noLearningMemory')}
            </Badge>
          )}
        </div>

        {hasMemory && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {weakSpotsCount > 0 && (
              <span>{t('vault.weakSpotsCount').replace('{count}', String(weakSpotsCount))}</span>
            )}
            {entriesCount > 0 && (
              <span>{t('vault.entriesCount').replace('{count}', String(entriesCount))}</span>
            )}
            {memoryLeaf.updated && (
              <span>
                {t('vault.lastUpdated').replace(
                  '{time}',
                  formatDistanceToNow(new Date(memoryLeaf.updated), { addSuffix: true }),
                )}
              </span>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link href={`/notebooks/${notebook.id}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              {t('vault.openLibrary')}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link href={`/notebooks/${notebook.id}`}>
              <Brain className="h-3 w-3 mr-1" />
              {t('vault.reviewMemory')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
