import { notesApi } from '@/lib/api/notes'
import type { NoteResponse } from '@/lib/types/api'

// ── constants ──────────────────────────────────────────────────────

export const MEMORY_LEAF_TITLE = '📖 Learning Memory'
export const MEMORY_MARKER = '<!-- vault:learning-memory:v1 -->'
export const GRADING_MEMORY_MARKER_PREFIX = '<!-- vault:grading-memory:'

const EXCERPT_MAX_CHARS = 400
const SUMMARY_LIST_MAX_ITEMS = 4

// ── types ──────────────────────────────────────────────────────────

export interface MemoryEntryParams {
  sourceType: 'leaf' | 'material'
  sourceTitle: string
  action: 'teach' | 'explain' | 'quiz'
  responseContent: string
}

export interface GradingMemoryEntryParams {
  messageId: string
  gradingContent: string
}

export type AppendGradingMemoryResult = 'saved' | 'already-saved' | 'skipped'

export function buildMemoryReviewPrompt(memoryContent: string): string {
  const trimmed = memoryContent.trim() || '(No Learning Memory content)'

  return [
    'Use this Learning Memory to create a practice review session.',
    'Create:',
    '5 quick recall questions',
    '3 short-answer questions',
    '1 synthesis/application prompt',
    'Do not reveal the answers yet.',
    'End by asking me to reply with my answers.',
    'Learning Memory:',
    trimmed,
  ].join('\n')
}

export function isLearningMemoryLeaf(
  note: Pick<NoteResponse, 'title' | 'content'>,
): boolean {
  if (note.content?.includes(MEMORY_MARKER)) {
    return true
  }

  return note.title === MEMORY_LEAF_TITLE
}

export function extractSavedGradingMessageIds(content: string): string[] {
  return Array.from(
    content.matchAll(/<!-- vault:grading-memory:([^>]+) -->/g),
    (match) => match[1],
  )
}

// ── lookup maps ────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  teach: 'Teach',
  explain: 'Explain Simply',
  quiz: 'Quiz',
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  leaf: 'Leaf',
  material: 'Material',
}

// ── helpers ────────────────────────────────────────────────────────

function getTimestampParts() {
  const now = new Date()

  return {
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0].slice(0, 5),
  }
}

function normalizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeListItem(line: string): string {
  return line
    .replace(/^[-*•]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/^\*\*(.*?)\*\*:?\s*/, '$1: ')
    .replace(/^#+\s+/, '')
    .trim()
}

function dedupeList(items: string[]): string[] {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function extractOverallResult(content: string): string | null {
  const patterns = [
    /\*\*Overall:\*\*\s*(?:[✅❌⚠️]\s*)?(Correct|Partial|Incorrect)/i,
    /Overall[^\n:]*:\s*(?:[✅❌⚠️]\s*)?(Correct|Partial|Incorrect)/i,
    /Grade:\s*(?:[✅❌⚠️]\s*)?(Correct|Partial|Incorrect)/i,
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match?.[1]) {
      const value = match[1].toLowerCase()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  }

  return null
}

function extractSectionItems(content: string, headings: string[]): string[] {
  const normalized = normalizeText(content)
  const lines = normalized.split('\n')
  const headingPattern = new RegExp(
    `^(?:#{1,6}\\s*|[-*]\\s*|\\*\\*)?(?:${headings.join('|')})(?:\\*\\*)?\\s*:??\\s*$`,
    'i',
  )
  const stopPattern = /^(?:#{1,6}\s+|\*\*.*\*\*:?\s*$|(?:weak areas|what to review next|review next|correct answer|overall)\s*:?)$/i
  const items: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    if (!headingPattern.test(lines[index].trim())) {
      continue
    }

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const current = lines[cursor].trim()

      if (!current) {
        if (items.length > 0) {
          break
        }
        continue
      }

      if (stopPattern.test(current) && !/^[-*•]|^\d+[.)]\s+/.test(current)) {
        break
      }

      if (/^[-*•]\s+/.test(current) || /^\d+[.)]\s+/.test(current)) {
        items.push(normalizeListItem(current))
        continue
      }

      if (items.length > 0) {
        break
      }

      items.push(normalizeListItem(current))
    }
  }

  return dedupeList(items).slice(0, SUMMARY_LIST_MAX_ITEMS)
}

function extractMissedQuestionTopics(content: string): string[] {
  const blocks = normalizeText(content)
    .split(/\n\s*---\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  const topics: string[] = []

  for (const block of blocks) {
    if (!/Grade:\s*(?:❌\s*)?(?:Partial|Incorrect)/i.test(block)) {
      continue
    }

    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean)
    const headingLine = lines.find((line) => /^\*\*.*\*\*$/.test(line) || /^#+\s+/.test(line))

    if (headingLine) {
      topics.push(
        headingLine
          .replace(/^#+\s+/, '')
          .replace(/^\*\*/, '')
          .replace(/\*\*$/, '')
          .trim(),
      )
    }
  }

  return dedupeList(topics).slice(0, SUMMARY_LIST_MAX_ITEMS)
}

function appendEntryToLearningMemory(
  existingContent: string | null | undefined,
  entry: string,
): string {
  const separator = '\n\n---\n\n'

  if (existingContent) {
    return existingContent.trimEnd() + separator + entry
  }

  return MEMORY_MARKER + '\n\n' + entry
}

async function findLearningMemoryLeaf(
  notebookId: string,
): Promise<Pick<NoteResponse, 'id' | 'title' | 'content'> | undefined> {
  const allNotes = await notesApi.list({ notebook_id: notebookId })

  return allNotes.find((note) => isLearningMemoryLeaf(note))
}

// ── entry builder ──────────────────────────────────────────────────

/**
 * Build a single structured memory entry from a tutor interaction.
 * Deterministic — no model call. Includes a short excerpt of the AI
 * response so the user can see what was covered at a glance.
 */
export function buildMemoryEntry(params: MemoryEntryParams): string {
  const { date, time } = getTimestampParts()
  const actionLabel = ACTION_LABELS[params.action] || params.action
  const sourceLabel = SOURCE_TYPE_LABELS[params.sourceType] || params.sourceType

  const excerpt = normalizeText(params.responseContent)
    .slice(0, EXCERPT_MAX_CHARS)
    .trim()

  return [
    `## ${date} ${time} — ${actionLabel} · ${sourceLabel}: "${params.sourceTitle}"`,
    '',
    `**Mode:** ${actionLabel}`,
    `**Source:** ${sourceLabel} — "${params.sourceTitle}"`,
    `**Response:** ${excerpt}`,
  ].join('\n')
}

export function buildGradingMemoryEntry(
  params: GradingMemoryEntryParams,
): string | null {
  const normalized = normalizeText(params.gradingContent)
  const overall = extractOverallResult(normalized)
  const weakSpots = extractSectionItems(normalized, ['weak areas?', 'weak spots?'])
  const reviewNext = extractSectionItems(normalized, ['what to review next', 'review next'])

  const fallbackTopics = extractMissedQuestionTopics(normalized)
  const finalWeakSpots = weakSpots.length > 0 ? weakSpots : fallbackTopics
  const finalReviewNext = reviewNext.length > 0 ? reviewNext : fallbackTopics

  if (finalWeakSpots.length === 0 && finalReviewNext.length === 0 && !overall) {
    return null
  }

  const { date, time } = getTimestampParts()
  const lines = [
    `${GRADING_MEMORY_MARKER_PREFIX}${params.messageId} -->`,
    '',
    `## ${date} ${time} — Review Grading`,
    '',
    '**Mode:** Review Grading',
    '**Source:** Review/Grading',
  ]

  if (overall) {
    lines.push(`**Overall:** ${overall}`)
  }

  if (finalWeakSpots.length > 0) {
    lines.push('', '**Weak spots:**', ...finalWeakSpots.map((item) => `- ${item}`))
  }

  if (finalReviewNext.length > 0) {
    lines.push('', '**Review next:**', ...finalReviewNext.map((item) => `- ${item}`))
  }

  return lines.join('\n')
}

// ── find / create / append ─────────────────────────────────────────

/**
 * Find the Learning Memory leaf for a notebook, create it if missing,
 * then append `entry` to its content.
 *
 * Identification strategy:
 *   1. Content marker (`<!-- vault:learning-memory:v1 -->`) — fastest
 *      and survives title edits.
 *   2. Title match (`📖 Learning Memory`) — fallback for migrated /
 *      marker-free leaves.
 *
 * Notes cache invalidation is the caller's responsibility.
 */
export async function appendMemoryEntry(
  notebookId: string,
  params: MemoryEntryParams,
): Promise<void> {
  const existingLeaf = await findLearningMemoryLeaf(notebookId)
  const entry = buildMemoryEntry(params)
  const updatedContent = appendEntryToLearningMemory(existingLeaf?.content, entry)

  if (existingLeaf) {
    await notesApi.update(existingLeaf.id, { content: updatedContent })
  } else {
    await notesApi.create({
      title: MEMORY_LEAF_TITLE,
      content: updatedContent,
      note_type: 'ai',
      notebook_id: notebookId,
    })
  }
}

export async function appendGradingMemoryEntry(
  notebookId: string,
  params: GradingMemoryEntryParams,
): Promise<AppendGradingMemoryResult> {
  const existingLeaf = await findLearningMemoryLeaf(notebookId)
  const marker = `${GRADING_MEMORY_MARKER_PREFIX}${params.messageId} -->`

  if (existingLeaf?.content?.includes(marker)) {
    return 'already-saved'
  }

  const entry = buildGradingMemoryEntry(params)

  if (!entry) {
    return 'skipped'
  }

  const updatedContent = appendEntryToLearningMemory(existingLeaf?.content, entry)

  if (existingLeaf) {
    await notesApi.update(existingLeaf.id, { content: updatedContent })
  } else {
    await notesApi.create({
      title: MEMORY_LEAF_TITLE,
      content: updatedContent,
      note_type: 'ai',
      notebook_id: notebookId,
    })
  }

  return 'saved'
}
