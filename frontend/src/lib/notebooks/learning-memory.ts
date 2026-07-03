import { notesApi } from '@/lib/api/notes'
import type { NoteResponse } from '@/lib/types/api'

// ── constants ──────────────────────────────────────────────────────

export const MEMORY_LEAF_TITLE = '📖 Learning Memory'
export const MEMORY_MARKER = '<!-- vault:learning-memory:v1 -->'

const EXCERPT_MAX_CHARS = 400

// ── types ──────────────────────────────────────────────────────────

export interface MemoryEntryParams {
  sourceType: 'leaf' | 'material'
  sourceTitle: string
  action: 'teach' | 'explain' | 'quiz'
  responseContent: string
}

export function isLearningMemoryLeaf(
  note: Pick<NoteResponse, 'title' | 'content'>,
): boolean {
  if (note.content?.includes(MEMORY_MARKER)) {
    return true
  }

  return note.title === MEMORY_LEAF_TITLE
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

// ── entry builder ──────────────────────────────────────────────────

/**
 * Build a single structured memory entry from a tutor interaction.
 * Deterministic — no model call.  Includes a short excerpt of the AI
 * response so the user can see what was covered at a glance.
 */
export function buildMemoryEntry(params: MemoryEntryParams): string {
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  const time = now.toTimeString().split(' ')[0].slice(0, 5)
  const actionLabel = ACTION_LABELS[params.action] || params.action
  const sourceLabel = SOURCE_TYPE_LABELS[params.sourceType] || params.sourceType

  // Strip HTML tags, collapse excessive newlines, clamp length
  const excerpt = params.responseContent
    .replace(/<[^>]*>/g, '')
    .replace(/\n{3,}/g, '\n\n')
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
 * Notes cache invalidation is the caller's responsibility
 * (pass the queryClient from the calling component).
 */
export async function appendMemoryEntry(
  notebookId: string,
  params: MemoryEntryParams,
): Promise<void> {
  const allNotes = await notesApi.list({ notebook_id: notebookId })

  // Prefer marker match, fall back to title match
  const existingLeaf = allNotes.find((n) => isLearningMemoryLeaf(n))

  const entry = buildMemoryEntry(params)

  if (existingLeaf) {
    // Append — avoid an empty first line when the existing content
    // already ends with a blank line.
    const separator = '\n\n---\n\n'
    const updatedContent = existingLeaf.content
      ? existingLeaf.content.trimEnd() + separator + entry
      : MEMORY_MARKER + '\n\n' + entry
    await notesApi.update(existingLeaf.id, { content: updatedContent })
  } else {
    await notesApi.create({
      title: MEMORY_LEAF_TITLE,
      content: MEMORY_MARKER + '\n\n' + entry,
      note_type: 'ai',
      notebook_id: notebookId,
    })
  }
}
