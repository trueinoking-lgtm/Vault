'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useNotebookChat } from '@/lib/hooks/useNotebookChat'
import { useNotes } from '@/lib/hooks/use-notes'
import { ChatPanel } from '@/components/source/ChatPanel'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { ContextSelections } from '../[id]/page'
import { useTranslation } from '@/lib/hooks/use-translation'
import { SourceListResponse } from '@/lib/types/api'

interface ChatColumnProps {
  notebookId: string
  contextSelections: ContextSelections
  sources: SourceListResponse[]
  sourcesLoading: boolean
  teachingPrompt?: string | null
  onTeachingPromptHandled?: () => void
  onTeachingResponse?: (responseContent: string) => void
}

export function ChatColumn({ notebookId, contextSelections, sources, sourcesLoading, teachingPrompt, onTeachingPromptHandled, onTeachingResponse }: ChatColumnProps) {
  const { t } = useTranslation()

  // Fetch notes for this notebook
  const { data: notes = [], isLoading: notesLoading } = useNotes(notebookId)

  // Initialize notebook chat hook
  const chat = useNotebookChat({
    notebookId,
    sources,
    notes,
    contextSelections
  })

  // Calculate context stats for indicator
  const contextStats = useMemo(() => {
    let sourcesInsights = 0
    let sourcesFull = 0
    let notesCount = 0

    // Count sources by mode
    sources.forEach(source => {
      const mode = contextSelections.sources[source.id]
      if (mode === 'insights') {
        sourcesInsights++
      } else if (mode === 'full') {
        sourcesFull++
      }
    })

    // Count notes that are included (not 'off')
    notes.forEach(note => {
      const mode = contextSelections.notes[note.id]
      if (mode === 'full') {
        notesCount++
      }
    })

    return {
      sourcesInsights,
      sourcesFull,
      notesCount,
      tokenCount: chat.tokenCount,
      charCount: chat.charCount
    }
  }, [sources, notes, contextSelections, chat.tokenCount, chat.charCount])

  // Auto-send a teaching prompt when "Teach this Leaf" etc. is clicked.
  // The prompt is a self-contained user message with the Leaf content
  // inline, so it reuses the existing notebook chat infrastructure.
  // After the AI responds, fire onTeachingResponse so the parent can
  // update the Learning Memory leaf.
  const prevTeachingRef = useRef<string | null>(null)
  const teachingSentRef = useRef(false)
  const messagesLenAtTeachTimeRef = useRef(0)
  useEffect(() => {
    if (teachingPrompt && teachingPrompt !== prevTeachingRef.current && !chat.isSending) {
      prevTeachingRef.current = teachingPrompt
      messagesLenAtTeachTimeRef.current = chat.messages.length
      teachingSentRef.current = true
      chat.sendMessage(teachingPrompt)
      onTeachingPromptHandled?.()
    }
  }, [teachingPrompt, chat.isSending, chat.sendMessage, onTeachingPromptHandled])

  // Watch for the AI response to arrive after a teaching prompt was sent.
  // Fires onTeachingResponse with the response content exactly once per
  // teaching action.  Guards: (a) a teach was actually sent, (b) sending
  // has finished, (c) messages have grown, and (d) the last message is AI.
  useEffect(() => {
    if (
      teachingSentRef.current &&
      !chat.isSending &&
      chat.messages.length > messagesLenAtTeachTimeRef.current
    ) {
      const lastMsg = chat.messages[chat.messages.length - 1]
      if (lastMsg.type === 'ai') {
        teachingSentRef.current = false
        onTeachingResponse?.(lastMsg.content)
      }
    }
  }, [chat.messages, chat.isSending, onTeachingResponse])

  // Show loading state while sources/notes are being fetched
  if (sourcesLoading || notesLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    )
  }

  // Show error state if data fetch failed (unlikely but good to handle)
  if (!sources && !notes) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">{t('chat.unableToLoadChat')}</p>
            <p className="text-xs mt-2">{t('common.refreshPage') || 'Please try refreshing the page'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <ChatPanel
      title={t('chat.chatWithNotebook')}
      contextType="notebook"
      messages={chat.messages}
      isStreaming={chat.isSending}
      contextIndicators={null}
      onSendMessage={(message, modelOverride) => chat.sendMessage(message, modelOverride)}
      modelOverride={chat.currentSession?.model_override ?? chat.pendingModelOverride ?? undefined}
      onModelChange={(model) => chat.setModelOverride(model ?? null)}
      sessions={chat.sessions}
      currentSessionId={chat.currentSessionId}
      onCreateSession={(title) => chat.createSession(title)}
      onSelectSession={chat.switchSession}
      onUpdateSession={(sessionId, title) => chat.updateSession(sessionId, { title })}
      onDeleteSession={chat.deleteSession}
      loadingSessions={chat.loadingSessions}
      notebookContextStats={contextStats}
      notebookId={notebookId}
    />
  )
}
