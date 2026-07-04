'use client'

import { useMemo } from 'react'
import type { NoteResponse } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  StickyNote,
  Bot,
  User,
  MoreVertical,
  Trash2,
  GraduationCap,
  BookOpen,
  HelpCircle,
  ListChecks,
  Lightbulb,
  Target,
  ExternalLink,
} from 'lucide-react'
import { TTSButton } from '@/components/voice/TTSButton'
import { useTranslation } from '@/lib/hooks/use-translation'
import { isLearningMemoryLeaf } from '@/lib/notebooks/learning-memory'

// ── helpers ──────────────────────────────────────────────────────

/**
 * Parse markdown headings (## ...) from leaf content.
 * Returns an array of { heading, body } pairs.
 * For plain-text leaves with no headings, returns [{ heading: null, body: fullText }].
 */
function parseSections(content: string | null): Array<{ heading: string | null; body: string }> {
  if (!content) return []

  const headingRegex = /^##\s+(.+)$/gm
  const sections: Array<{ heading: string | null; body: string }> = []
  let lastIndex = 0
  let lastHeading: string | null = null
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(content)) !== null) {
    // If there was a previous heading, capture the body from after its heading
    // line up to this match.
    if (lastHeading !== null) {
      const body = content.slice(lastIndex, match.index).trim()
      sections.push({ heading: lastHeading, body })
    } else if (match.index > 0) {
      // Text before the first heading — preamble
      const preamble = content.slice(0, match.index).trim()
      if (preamble) {
        sections.push({ heading: null, body: preamble })
      }
    }

    lastHeading = match[1].trim()
    lastIndex = match.index + match[0].length
  }

  // Last section (or full content if no headings at all)
  const remaining = content.slice(lastIndex).trim()
  if (lastHeading !== null) {
    sections.push({ heading: lastHeading, body: remaining || '' })
  } else {
    // Plain text — no headings at all
    sections.push({ heading: null, body: content.trim() })
  }

  return sections
}

/**
 * Extract a material reference from the ## Source Material section.
 * Returns the material title if found, or null.
 */
function extractSourceMaterialInfo(content: string | null): string | null {
  if (!content) return null

  const sourceMatch = content.match(/^##\s+Source Material\s*$/m)
  if (!sourceMatch) return null

  // Look for "- Material:" on lines following the heading
  const match = sourceMatch as RegExpExecArray
  const afterHeading = content.slice(match.index + match[0].length)
  const materialLine = afterHeading.match(/-\s*Material:\s*(.+)/)
  return materialLine ? materialLine[1].trim() : null
}

// ── component ────────────────────────────────────────────────────

interface LeafStudyCardProps {
  note: NoteResponse
  notebookId: string
  onLeafAction?: (noteId: string, action: 'teach' | 'explain' | 'quiz') => void
  onReviewMemory?: (noteId: string) => void
  onEdit?: (note: NoteResponse) => void
  onDelete?: (noteId: string) => void
}

export function LeafStudyCard({
  note,
  notebookId,
  onLeafAction,
  onReviewMemory,
  onEdit,
  onDelete,
}: LeafStudyCardProps) {
  const { t } = useTranslation()
  const isMemoryLeaf = isLearningMemoryLeaf(note)

  const sections = useMemo(() => parseSections(note.content), [note.content])
  const hasHeadings = sections.length > 0 && sections.some((s) => s.heading !== null)
  const sourceMaterialTitle = useMemo(() => extractSourceMaterialInfo(note.content), [note.content])

  // First section heading (or null for plain text) used as "What this leaf covers"
  const firstHeading = hasHeadings ? sections.find((s) => s.heading !== null)?.heading ?? null : null

  return (
    <div
      className="p-4 border rounded-lg card-hover group relative cursor-pointer hover:border-primary/40 transition-colors"
      onClick={() => onEdit?.(note)}
    >
      {/* ── Header row ── */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {note.note_type === 'ai' ? (
            <Bot className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <Badge variant="secondary" className="text-xs">
            {isMemoryLeaf
              ? 'Memory'
              : note.note_type === 'ai'
                ? t('common.aiGenerated')
                : t('common.human')}
          </Badge>
          <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
            {t('sources.leafStudyCard')}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Context toggle and action menu — on right side */}

          {/* Ellipsis menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onLeafAction && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeafAction(note.id, 'teach')
                    }}
                  >
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Teach this Leaf
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeafAction(note.id, 'explain')
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Explain simply
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeafAction(note.id, 'quiz')
                    }}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Quiz me
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isMemoryLeaf && onReviewMemory && (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      onReviewMemory(note.id)
                    }}
                  >
                    <ListChecks className="h-4 w-4 mr-2" />
                    Review this Memory
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(note.id)
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('sources.deleteLeaf')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Title ── */}
      {note.title && (
        <h4 className="text-sm font-semibold mb-2 break-all">{note.title}</h4>
      )}

      {/* ── Sections ── */}
      {hasHeadings ? (
        <div className="space-y-3">
          {/* What this leaf covers — derived from first heading */}
          {firstHeading && (
            <div className="rounded-md bg-blue-50/50 border border-blue-100 p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                <Lightbulb className="h-3.5 w-3.5" />
                {t('sources.leafWhatItCovers')}
              </div>
              <p className="text-sm text-blue-800/80">{firstHeading}</p>
            </div>
          )}

          {/* Key points — show first few section bodies as previews */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
              <Target className="h-3.5 w-3.5" />
              {t('sources.leafKeyPoints')}
            </div>
            <div className="space-y-2">
              {sections
                .filter((s) => s.heading !== null && s.heading !== 'Source Material')
                .slice(0, 3)
                .map((s) => (
                  <div key={s.heading} className="text-sm">
                    <span className="font-medium text-foreground/90">{s.heading}</span>
                    {s.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {s.body}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {/* If more sections exist, show count */}
            {sections.filter((s) => s.heading !== null && s.heading !== 'Source Material').length > 3 && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                +{sections.filter((s) => s.heading !== null && s.heading !== 'Source Material').length - 3} more sections
              </p>
            )}
          </div>

          {/* Source material link */}
          {sourceMaterialTitle && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-2 mt-1">
              <ExternalLink className="h-3 w-3" />
              <span className="font-medium">Source:</span>
              <span>{sourceMaterialTitle}</span>
            </div>
          )}
        </div>
      ) : (
        /* ── Plain text fallback ── */
        <div>
          {note.content && (
            <p className="text-sm text-muted-foreground line-clamp-4 break-all whitespace-pre-wrap">
              {note.content}
            </p>
          )}
        </div>
      )}

      {/* ── Footer actions ── */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between gap-2">
        {/* Left: Check yourself and Listen */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Check yourself — static scaffolding, always shown */}
          {!isMemoryLeaf && (
            <div
              className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 cursor-default"
              title={t('sources.checkYourself')}
            >
              <HelpCircle className="h-3 w-3" />
              <span className="hidden sm:inline truncate max-w-[180px]">
                {t('sources.checkYourself')}
              </span>
            </div>
          )}
        </div>

        {/* Right: TTS */}
        {note.content && (
          <div onClick={(e) => e.stopPropagation()}>
            <TTSButton
              text={note.content}
              className="h-6 px-1.5 text-xs"
            />
          </div>
        )}
      </div>
    </div>
  )
}
