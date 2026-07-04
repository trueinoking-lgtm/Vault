'use client'

import { useState, useMemo, useEffect } from 'react'
import { NoteResponse } from '@/lib/types/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, StickyNote, Bot, User, MoreVertical, Trash2, ListChecks, ChevronDown, GraduationCap, BookOpen, HelpCircle } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/badge'
import { NoteEditorDialog } from './NoteEditorDialog'
import { LeafStudyCard } from '@/components/notebooks/LeafStudyCard'
import { getDateLocale } from '@/lib/utils/date-locale'
import { formatDistanceToNow } from 'date-fns'
import { ContextToggle } from '@/components/common/ContextToggle'
import type { NoteContextMode } from '../[id]/page'
import type { NoteContextDefault } from '@/lib/utils/source-context'
import { useDeleteNote } from '@/lib/hooks/use-notes'
import { useStudySession, useEndSession } from '@/lib/hooks/use-study'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { CollapsibleColumn, createCollapseButton } from '@/components/notebooks/CollapsibleColumn'
import { useNotebookColumnsStore } from '@/lib/stores/notebook-columns-store'
import { useTranslation } from '@/lib/hooks/use-translation'
import { isLearningMemoryLeaf } from '@/lib/notebooks/learning-memory'
import { TTSButton } from '@/components/voice/TTSButton'

interface NotesColumnProps {
  notes?: NoteResponse[]
  isLoading: boolean
  notebookId: string
  contextSelections?: Record<string, NoteContextMode>
  onContextModeChange?: (noteId: string, mode: NoteContextMode) => void
  onBulkContextModeChange?: (action: NoteContextDefault) => void
  onLeafAction?: (noteId: string, action: 'teach' | 'explain' | 'quiz') => void
  onReviewMemory?: (noteId: string) => void
}

export function NotesColumn({
  notes,
  isLoading,
  notebookId,
  contextSelections,
  onContextModeChange,
  onBulkContextModeChange,
  onLeafAction,
  onReviewMemory,
}: NotesColumnProps) {
  const { t, language } = useTranslation()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteResponse | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)

  const deleteNote = useDeleteNote()

  // ── Study session lifecycle (Debt C) ─────────────────────────────
  // Own the active study session at the column level so all LeafStudyCard
  // instances in this notebook share one session. The session is created
  // or resumed when the column mounts and completed best-effort on unmount.
  const { data: session } = useStudySession(notebookId)
  const endSession = useEndSession()

  // Best-effort completion: mark the session completed when the learner
  // navigates away from the notebook study context. Unmount is not
  // guaranteed (e.g. SPA transitions), so this is best-effort.
  useEffect(() => {
    const sessionId = session?.id
    if (!sessionId) return

    return () => {
      endSession.mutate(sessionId)
    }
  }, [session?.id, endSession])

  // Collapsible column state
  const { notesCollapsed, toggleNotes } = useNotebookColumnsStore()
  const notesLabel = t('sources.leaves')
  const collapseButton = useMemo(
    () => createCollapseButton(toggleNotes, notesLabel),
    [toggleNotes, notesLabel]
  )
  const visibleNotes = useMemo(() => {
    if (!notes) {
      return []
    }

    return [...notes].sort((a, b) => {
      const aIsMemory = isLearningMemoryLeaf(a)
      const bIsMemory = isLearningMemoryLeaf(b)

      if (aIsMemory === bIsMemory) {
        return 0
      }

      return aIsMemory ? -1 : 1
    })
  }, [notes])

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!noteToDelete) return

    try {
      await deleteNote.mutateAsync(noteToDelete)
      setDeleteDialogOpen(false)
      setNoteToDelete(null)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  return (
    <>
      <CollapsibleColumn
        isCollapsed={notesCollapsed}
        onToggle={toggleNotes}
        collapsedIcon={StickyNote}
        collapsedLabel={notesLabel}
      >
        <Card className="h-full flex flex-col flex-1 overflow-hidden">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{notesLabel}</CardTitle>
              <div className="flex items-center gap-2">
                {onBulkContextModeChange && notes && notes.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" title={t('sources.bulkContext')}>
                        <ListChecks className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onBulkContextModeChange('include')}>
                        {t('sources.includeAllInContext')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onBulkContextModeChange('exclude')}>
                        {t('sources.excludeAllFromContext')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingNote(null)
                    setShowAddDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('sources.createLeafShort')}
                </Button>
                {collapseButton}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : !notes || notes.length === 0 ? (
              <EmptyState
                icon={StickyNote}
                title={t('sources.noLeavesYet')}
                description={t('sources.createFirstLeaf')}
              />
            ) : (
              <div className="space-y-3">
                {visibleNotes.map((note) => (
                  <div key={note.id} className="space-y-1">
                    {/* Timestamp + context toggle row */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.updated), {
                          addSuffix: true,
                          locale: getDateLocale(language)
                        })}
                      </span>
                      {onContextModeChange && contextSelections?.[note.id] && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <ContextToggle
                            mode={contextSelections[note.id]}
                            hasInsights={false}
                            onChange={(mode) => onContextModeChange(note.id, mode)}
                          />
                        </div>
                      )}
                    </div>

                    <LeafStudyCard
                      note={note}
                      notebookId={notebookId}
                      studySessionId={session?.id}
                      onLeafAction={onLeafAction}
                      onReviewMemory={onReviewMemory}
                      onEdit={(n) => setEditingNote(n)}
                      onDelete={handleDeleteClick}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleColumn>

      <NoteEditorDialog
        open={showAddDialog || Boolean(editingNote)}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false)
            setEditingNote(null)
          } else {
            setShowAddDialog(true)
          }
        }}
        notebookId={notebookId}
        note={editingNote ?? undefined}
        mode="leaf"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('sources.deleteLeaf')}
        description={t('sources.deleteLeafConfirm')}
        confirmText={t('common.delete')}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteNote.isPending}
        confirmVariant="destructive"
      />
    </>
  )
}
