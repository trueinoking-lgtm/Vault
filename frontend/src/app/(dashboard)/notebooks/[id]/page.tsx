'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { NotebookHeader } from '../components/NotebookHeader'
import { SourcesColumn } from '../components/SourcesColumn'
import { NotesColumn } from '../components/NotesColumn'
import { ChatColumn } from '../components/ChatColumn'
import { NoteEditorDialog } from '../components/NoteEditorDialog'
import { LeafTemplateDialog } from '../components/LeafTemplateDialog'
import { useNotebook } from '@/lib/hooks/use-notebooks'
import { useNotebookSources } from '@/lib/hooks/use-sources'
import { useNotes } from '@/lib/hooks/use-notes'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useNotebookColumnsStore } from '@/lib/stores/notebook-columns-store'
import { useIsDesktop } from '@/lib/hooks/use-media-query'
import { useTranslation } from '@/lib/hooks/use-translation'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, StickyNote, MessageSquare } from 'lucide-react'
import {
  applyBulkSourceContext,
  applyBulkNoteContext,
  computeSourceSelections,
  computeNoteSelections,
  type SourceContextDefault,
  type SourceBulkAction,
  type NoteContextDefault,
} from '@/lib/utils/source-context'
import {
  getLeafTemplateById,
  type LeafDraft,
  type LeafTemplateId,
} from '@/lib/notebooks/leaf-templates'
import { sourcesApi } from '@/lib/api/sources'
import { useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { appendMemoryEntry } from '@/lib/notebooks/learning-memory'

// Re-exported from the shared types module for backward compatibility; several
// components historically import these from this route file.
import type { ContextMode, ContextSelections, NoteContextMode } from '@/lib/types/notebook-context'
import type { SourceResponse } from '@/lib/types/api'
export type { ContextMode, ContextSelections, NoteContextMode }

// ── polling helper for Phase 5 second commit ──────────────────────

const POLL_INTERVAL_MS = 1500
const MAX_POLL_DURATION_MS = 8000

/**
 * Polls GET /sources/{id} for a non-null full_text up to
 * MAX_POLL_DURATION_MS.  Returns the full_text when it becomes
 * available, or undefined on timeout so the caller falls back to
 * empty-section scaffolds (Phase 4/5 behaviour).
 */
async function waitForSourceText(sourceId: string): Promise<string | undefined> {
  const deadline = Date.now() + MAX_POLL_DURATION_MS

  while (Date.now() < deadline) {
    try {
      const detail = await sourcesApi.get(sourceId)
      if (detail.full_text) {
        return detail.full_text
      }
    } catch {
      // Transient network error — keep polling
    }

    const remaining = deadline - Date.now()
    if (remaining <= 0) break

    await new Promise<void>((resolve) => setTimeout(resolve, Math.min(POLL_INTERVAL_MS, remaining)))
  }

  return undefined
}

export default function NotebookPage() {
  const { t } = useTranslation()
  const params = useParams()

  // Ensure the notebook ID is properly decoded from URL
  const notebookId = params?.id ? decodeURIComponent(params.id as string) : ''

  const { data: notebook, isLoading: notebookLoading } = useNotebook(notebookId)
  const {
    sources,
    isLoading: sourcesLoading,
    refetch: refetchSources,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotebookSources(notebookId)
  const { data: notes, isLoading: notesLoading } = useNotes(notebookId)

  // Get collapse states for dynamic layout
  const { sourcesCollapsed, notesCollapsed } = useNotebookColumnsStore()

  // Detect desktop to avoid double-mounting ChatColumn
  const isDesktop = useIsDesktop()

  // Mobile tab state (Sources, Notes, or Chat)
  const [mobileActiveTab, setMobileActiveTab] = useState<'sources' | 'notes' | 'chat'>('chat')
  const [leafTemplateDialogOpen, setLeafTemplateDialogOpen] = useState(false)
  const [leafComposerOpen, setLeafComposerOpen] = useState(false)
  const [leafDraft, setLeafDraft] = useState<LeafDraft | null>(null)
  const [pendingLeafSource, setPendingLeafSource] = useState<SourceResponse | null>(null)
  const [isPreparingDraft, setIsPreparingDraft] = useState(false)

  // Teaching state for Phase 6 — "Teach this Leaf"
  const [teachingPrompt, setTeachingPrompt] = useState<string | null>(null)

  // Metadata about the current teaching action, used by the Learning
  // Memory callback when the AI response arrives.
  interface TeachingMeta {
    sourceTitle: string
    sourceType: 'leaf' | 'material'
    action: 'teach' | 'explain' | 'quiz'
  }
  const [teachingMeta, setTeachingMeta] = useState<TeachingMeta | null>(null)
  const queryClient = useQueryClient()

  // Context selection state
  const [contextSelections, setContextSelections] = useState<ContextSelections>({
    sources: {},
    notes: {}
  })

  // The default context mode applied to sources as they load. A bulk
  // include/exclude updates this so sources loaded later via pagination follow
  // the same intent instead of reverting to "included" (#223/#915).
  const [sourceContextDefault, setSourceContextDefault] = useState<SourceContextDefault>('include')

  // Same idea for notes loaded later (notes are binary: included/off).
  const [noteContextDefault, setNoteContextDefault] = useState<NoteContextDefault>('include')

  // Initialize and update selections when sources load or change
  useEffect(() => {
    if (sources && sources.length > 0) {
      setContextSelections(prev => ({
        ...prev,
        sources: computeSourceSelections(prev.sources, sources, sourceContextDefault),
      }))
    }
  }, [sources, sourceContextDefault])

  useEffect(() => {
    if (notes && notes.length > 0) {
      setContextSelections(prev => ({
        ...prev,
        notes: computeNoteSelections(prev.notes, notes, noteContextDefault),
      }))
    }
  }, [notes, noteContextDefault])

  const handleSourceContextModeChange = (sourceId: string, mode: ContextMode) => {
    setContextSelections(prev => ({
      ...prev,
      sources: {
        ...prev.sources,
        [sourceId]: mode
      }
    }))
  }

  const handleNoteContextModeChange = (noteId: string, mode: NoteContextMode) => {
    setContextSelections(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [noteId]: mode
      }
    }))
  }

  // Bulk-apply a context action (insights-only / full / exclude) to every
  // source at once (#223). Also records the action as the default for sources
  // loaded later (#915).
  const handleBulkSourceContext = (action: SourceBulkAction) => {
    setSourceContextDefault(action)
    setContextSelections(prev => ({
      ...prev,
      sources: applyBulkSourceContext(prev.sources, sources ?? [], action),
    }))
  }

  // Bulk include/exclude every note from the chat context at once (#223).
  const handleBulkNoteContext = (action: NoteContextDefault) => {
    setNoteContextDefault(action)
    setContextSelections(prev => ({
      ...prev,
      notes: applyBulkNoteContext(prev.notes, notes ?? [], action),
    }))
  }

  const handleSourceCreated = (source: SourceResponse) => {
    setPendingLeafSource(source)
    setLeafTemplateDialogOpen(true)
    setMobileActiveTab('notes')
  }

  const handleLeafAction = (noteId: string, action: 'teach' | 'explain' | 'quiz') => {
    const note = notes?.find((n) => n.id === noteId)
    if (!note) return

    const title = note.title?.trim() || 'Untitled Leaf'
    const content = note.content?.trim() || '(No content)'
    const truncated = content.length > 4000 ? content.slice(0, 4000) + '\n\n[...content truncated]' : content

    const promptBody = `\n\nLeaf title:\n${title}\n\nLeaf content:\n${truncated}`

    const prompts: Record<string, string> = {
      teach: `Teach me this Leaf step by step. Start by explaining the core idea simply, then break it into key points, give an example, and end with a short check-for-understanding question.${promptBody}`,
      explain: `Explain this Leaf in simple language for a beginner. Avoid jargon where possible. Use a short example or analogy, then summarize the main point in 3 bullets.${promptBody}`,
      quiz: `Quiz me on this Leaf. Create 5 questions: 3 quick recall questions and 2 short-answer questions. Do not reveal the answers immediately. End by asking me to reply with my answers.${promptBody}`,
    }

    const prompt = prompts[action] || prompts.teach
    setTeachingMeta({ sourceTitle: title, sourceType: 'leaf', action })
    setTeachingPrompt(prompt)
    setMobileActiveTab('chat')
  }

  const handleSourceAction = async (sourceId: string, action: 'teach' | 'explain' | 'quiz') => {
    try {
      const source = await sourcesApi.get(sourceId)
      const title = source.title?.trim() || 'Untitled Material'
      const content = source.full_text?.trim() || '(No content available)'
      const truncated = content.length > 4000 ? content.slice(0, 4000) + '\n\n[...content truncated]' : content

      const promptBody = `\n\nMaterial title:\n${title}\n\nMaterial content:\n${truncated}`

      const prompts: Record<string, string> = {
        teach: `Teach me about this source material step by step. Start by summarizing the core content, then break it into key points, give an example or context, and end with a short check-for-understanding question.${promptBody}`,
        explain: `Explain this source material in simple language for a beginner. Avoid jargon where possible. Use a short example or analogy, then summarize the main point in 3 bullets.${promptBody}`,
        quiz: `Quiz me on this source material. Create 5 questions: 3 quick recall questions and 2 short-answer questions. Do not reveal the answers immediately. End by asking me to reply with my answers.${promptBody}`,
      }

      const prompt = prompts[action] || prompts.teach
      setTeachingMeta({ sourceTitle: title, sourceType: 'material', action })
      setTeachingPrompt(prompt)
      setMobileActiveTab('chat')
    } catch (error) {
      console.error('Failed to teach material:', error)
    }
  }

  const handleTeachingPromptHandled = () => {
    setTeachingPrompt(null)
  }

  const handleTeachingResponse = async (responseContent: string) => {
    if (!teachingMeta) return
    const meta = teachingMeta
    setTeachingMeta(null)

    try {
      await appendMemoryEntry(notebookId, {
        sourceType: meta.sourceType,
        sourceTitle: meta.sourceTitle,
        action: meta.action,
        responseContent,
      })
      // Invalidate notes so the Learning Memory leaf appears/updates
      // in the Leaves column without a manual refresh.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notes(notebookId) })
    } catch (error) {
      // Silent failure — never break the chat experience for a
      // background memory update.
      console.error('Failed to update learning memory:', error)
    }
  }

  const handleLeafTemplateConfirm = async (templateId: LeafTemplateId) => {
    if (!pendingLeafSource) {
      return
    }

    setIsPreparingDraft(true)

    // Poll briefly for source full_text — gives async processing a chance
    // to finish so template builders can prefill sections with actual
    // excerpts from the material.  Falls back cleanly when processing
    // hasn't completed within the timeout window.
    const sourceText = await waitForSourceText(pendingLeafSource.id)

    const template = getLeafTemplateById(templateId)
    setLeafDraft(template.buildDraft(pendingLeafSource, sourceText))
    setLeafTemplateDialogOpen(false)
    setLeafComposerOpen(true)
    setIsPreparingDraft(false)
  }

  const handleLeafTemplateDialogOpenChange = (open: boolean) => {
    setLeafTemplateDialogOpen(open)
    if (!open) {
      setPendingLeafSource(null)
    }
  }

  const handleLeafComposerOpenChange = (open: boolean) => {
    setLeafComposerOpen(open)
    if (!open) {
      setLeafDraft(null)
      setPendingLeafSource(null)
    }
  }

  if (notebookLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!notebook) {
    return (
      <AppShell>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">{t('notebooks.notFound')}</h1>
          <p className="text-muted-foreground">{t('notebooks.notFoundDesc')}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-shrink-0 p-6 pb-0">
          <NotebookHeader notebook={notebook} />
        </div>

        <div className="flex-1 p-6 pt-6 overflow-x-auto flex flex-col">
          {/* Mobile: Tabbed interface - only render on mobile to avoid double-mounting */}
          {!isDesktop && (
            <>
              <div className="lg:hidden mb-4">
                <Tabs value={mobileActiveTab} onValueChange={(value) => setMobileActiveTab(value as 'sources' | 'notes' | 'chat')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sources" className="gap-2">
                      <FileText className="h-4 w-4" />
                      {t('navigation.sources')}
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2">
                      <StickyNote className="h-4 w-4" />
                      {t('sources.leaves')}
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      {t('common.chat')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Mobile: Show only active tab */}
              <div className="flex-1 overflow-hidden lg:hidden">
                {mobileActiveTab === 'sources' && (
                  <SourcesColumn
                    sources={sources}
                    isLoading={sourcesLoading}
                    notebookId={notebookId}
                    notebookName={notebook?.name}
                    onRefresh={refetchSources}
                    contextSelections={contextSelections.sources}
                    onContextModeChange={handleSourceContextModeChange}
                    onBulkContextModeChange={handleBulkSourceContext}
                    onSourceCreated={handleSourceCreated}
                    onSourceAction={handleSourceAction}
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                )}
                {mobileActiveTab === 'notes' && (
                  <NotesColumn
                    notes={notes}
                    isLoading={notesLoading}
                    notebookId={notebookId}
                    contextSelections={contextSelections.notes}
                    onContextModeChange={handleNoteContextModeChange}
                    onBulkContextModeChange={handleBulkNoteContext}
                    onLeafAction={handleLeafAction}
                  />
                )}
                {mobileActiveTab === 'chat' && (
                  <ChatColumn
                    notebookId={notebookId}
                    contextSelections={contextSelections}
                    sources={sources}
                    sourcesLoading={sourcesLoading}
                    teachingPrompt={teachingPrompt}
                    onTeachingPromptHandled={handleTeachingPromptHandled}
                    onTeachingResponse={handleTeachingResponse}
                  />
                )}
              </div>
            </>
          )}

          {/* Desktop: Collapsible columns layout */}
          <div className={cn(
            'hidden lg:flex h-full min-h-0 gap-6 transition-all duration-150',
            'flex-row'
          )}>
            {/* Sources Column */}
            <div className={cn(
              'transition-all duration-150',
              sourcesCollapsed ? 'w-12 flex-shrink-0' : 'flex-none basis-1/3'
            )}>
              <SourcesColumn
                sources={sources}
                isLoading={sourcesLoading}
                notebookId={notebookId}
                notebookName={notebook?.name}
                onRefresh={refetchSources}
                contextSelections={contextSelections.sources}
                onContextModeChange={handleSourceContextModeChange}
                onBulkContextModeChange={handleBulkSourceContext}
                onSourceCreated={handleSourceCreated}
                onSourceAction={handleSourceAction}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            </div>

            {/* Notes Column */}
            <div className={cn(
              'transition-all duration-150',
              notesCollapsed ? 'w-12 flex-shrink-0' : 'flex-none basis-1/3'
            )}>
              <NotesColumn
                notes={notes}
                isLoading={notesLoading}
                notebookId={notebookId}
                contextSelections={contextSelections.notes}
                onContextModeChange={handleNoteContextModeChange}
                onBulkContextModeChange={handleBulkNoteContext}
                onLeafAction={handleLeafAction}
              />
            </div>

            {/* Chat Column - always expanded, takes remaining space */}
            <div className="transition-all duration-150 flex-1 min-w-0 lg:pr-6 lg:-mr-6">
              <ChatColumn
                notebookId={notebookId}
                contextSelections={contextSelections}
                sources={sources}
                sourcesLoading={sourcesLoading}
                teachingPrompt={teachingPrompt}
                onTeachingPromptHandled={handleTeachingPromptHandled}
                onTeachingResponse={handleTeachingResponse}
              />
            </div>
          </div>
        </div>

        <LeafTemplateDialog
          open={leafTemplateDialogOpen}
          source={pendingLeafSource}
          onOpenChange={handleLeafTemplateDialogOpenChange}
          onConfirm={handleLeafTemplateConfirm}
          disabled={isPreparingDraft}
        />

        <NoteEditorDialog
          open={leafComposerOpen}
          onOpenChange={handleLeafComposerOpenChange}
          notebookId={notebookId}
          mode="leaf"
          initialTitle={leafDraft?.initialTitle}
          initialContent={leafDraft?.initialContent}
        />
      </div>
    </AppShell>
  )
}
