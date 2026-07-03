import type { SourceResponse } from '@/lib/types/api'

export interface LeafDraft {
  initialTitle: string
  initialContent: string
}

export type LeafTemplateId =
  | 'summary'
  | 'lesson'
  | 'quiz'
  | 'brief'
  | 'action'
  | 'explanation'

export interface LeafTemplateDefinition {
  id: LeafTemplateId
  label: string
  description: string
  buildDraft: (source: SourceResponse, sourceText?: string) => LeafDraft
}

// ── excerpt utility ──────────────────────────────────────────────

const DEFAULT_EXCERPT_CHARS = 280

/**
 * Splits `fullText` into `partCount` roughly-equal excerpts suitable for
 * placing under individual section headings.  Each excerpt is capped at
 * `maxChars` and gets ellipsis markers when it represents the middle of
 * the source text.
 *
 * Returns an empty array when `fullText` is falsy, making callers in the
 * template builders naturally fall back to empty-section behaviour.
 */
export function extractExcerpts(
  fullText: string | undefined | null,
  partCount: number,
  maxChars: number = DEFAULT_EXCERPT_CHARS,
): string[] {
  if (!fullText || partCount < 1) return Array.from({ length: partCount }).fill('') as string[]

  const text = fullText.trim()
  if (!text) return Array.from({ length: partCount }).fill('') as string[]

  // Optimistic char-budget: try to give each section roughly equal text
  // but never exceed `maxChars` per section.
  const sectionBudget = Math.min(maxChars, Math.ceil(text.length / partCount))
  const excerpts: string[] = []

  for (let i = 0; i < partCount; i++) {
    const start = i * sectionBudget
    const end = Math.min(start + sectionBudget, text.length)

    let excerpt = text.slice(start, end).trim()

    // Add ellipsis when excerpt is cut in the middle of the source
    if (start > 0 && excerpt.length > 0) excerpt = `…${excerpt}`
    if (end < text.length && excerpt.length > 0) excerpt = `${excerpt}…`

    excerpts.push(excerpt)
  }

  return excerpts
}

// ── helpers ──────────────────────────────────────────────────────

function getMaterialMetadata(source: SourceResponse) {
  const sourceTitle = source.title?.trim() || 'Untitled Material'
  const sourceUrl = source.asset?.url?.trim()
  const sourceFile = source.asset?.file_path?.trim()
  const sourceType = sourceUrl ? 'Link' : sourceFile ? 'File' : 'Text'

  const metadataLines = [
    `- Material: ${sourceTitle}`,
    `- Type: ${sourceType}`,
    sourceUrl ? `- URL: ${sourceUrl}` : null,
    sourceFile ? `- File: ${sourceFile}` : null,
  ].filter((line): line is string => Boolean(line))

  return { sourceTitle, metadataLines }
}

function buildLeafContent(title: string, metadataLines: string[], sections: string[]) {
  return [
    `# ${title}`,
    '',
    '## Source Material',
    ...metadataLines,
    '',
    ...sections.flatMap((section) => [section, '']),
  ].join('\n')
}

/** Wraps a bare section heading so it includes an excerpt when one exists. */
function sectionWithExcerpt(heading: string, excerpt: string): string {
  return excerpt ? `${heading}\n\n${excerpt}` : heading
}

// ── template builders ────────────────────────────────────────────

export function buildSummaryLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Leaf from ${sourceTitle}`
  const ex = extractExcerpts(sourceText, 6)

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      sectionWithExcerpt('## Summary', ex[0]),
      sectionWithExcerpt('## Key Ideas', ex[1]),
      sectionWithExcerpt('## Explanation', ex[2]),
      sectionWithExcerpt('## Insights', ex[3]),
      sectionWithExcerpt('## Questions', ex[4]),
      sectionWithExcerpt('## Next Steps', ex[5]),
    ]),
  }
}

export function buildLessonLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Lesson Leaf from ${sourceTitle}`
  const ex = extractExcerpts(sourceText, 5)

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      sectionWithExcerpt('## Core Lesson', ex[0]),
      sectionWithExcerpt('## Why It Matters', ex[1]),
      sectionWithExcerpt('## Supporting Evidence', ex[2]),
      sectionWithExcerpt('## Real-World Takeaways', ex[3]),
      sectionWithExcerpt('## Open Questions', ex[4]),
    ]),
  }
}

export function buildQuizLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Quiz Leaf from ${sourceTitle}`

  let quickRecallSection = '## Quick Recall Questions\n\n1. \n2. \n3. '
  let shortAnswerSection = '## Short Answer Questions\n\n1. \n2. '
  let answerKeySection = '## Answer Key'

  if (sourceText) {
    const ex = extractExcerpts(sourceText, 3, DEFAULT_EXCERPT_CHARS)
    quickRecallSection = sectionWithExcerpt('## Quick Recall Questions', ex[0])
    shortAnswerSection = sectionWithExcerpt('## Short Answer Questions', ex[1])
    answerKeySection = sectionWithExcerpt('## Answer Key', ex[2])
  }

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      quickRecallSection,
      shortAnswerSection,
      answerKeySection,
    ]),
  }
}

export function buildBriefLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Brief Leaf from ${sourceTitle}`
  const ex = extractExcerpts(sourceText, 4)

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      sectionWithExcerpt('## One-Paragraph Brief', ex[0]),
      sectionWithExcerpt('## Critical Facts', ex[1]),
      sectionWithExcerpt('## Risks / Caveats', ex[2]),
      sectionWithExcerpt('## Bottom Line', ex[3]),
    ]),
  }
}

export function buildActionLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Action Leaf from ${sourceTitle}`

  let keyActionsSection = '## Key Actions\n\n- [ ] '
  const rest = extractExcerpts(sourceText, 3, DEFAULT_EXCERPT_CHARS)

  if (sourceText) {
    keyActionsSection = sectionWithExcerpt('## Key Actions', rest[0])
  }

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      keyActionsSection,
      sectionWithExcerpt('## Recommended Next Steps', rest[0] ? rest[1] : ''),
      sectionWithExcerpt('## Dependencies', rest[0] ? rest[2] : ''),
      sectionWithExcerpt('## Follow-Up Questions', ''),
    ]),
  }
}

export function buildExplanationLeafDraftFromMaterial(
  source: SourceResponse,
  sourceText?: string,
): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Explanation Leaf from ${sourceTitle}`
  const ex = extractExcerpts(sourceText, 5)

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      sectionWithExcerpt('## What This Means', ex[0]),
      sectionWithExcerpt('## Step-by-Step Explanation', ex[1]),
      sectionWithExcerpt('## Example', ex[2]),
      sectionWithExcerpt('## Common Misunderstandings', ex[3]),
      sectionWithExcerpt('## Questions to Explore', ex[4]),
    ]),
  }
}

// ── template catalogue ───────────────────────────────────────────

export const LEAF_TEMPLATES: LeafTemplateDefinition[] = [
  {
    id: 'summary',
    label: 'Summary Leaf',
    description: 'Capture the main ideas, explanation, insights, and next steps from a material.',
    buildDraft: buildSummaryLeafDraftFromMaterial,
  },
  {
    id: 'lesson',
    label: 'Lesson Leaf',
    description: 'Focus on the core lesson, why it matters, and takeaways worth retaining.',
    buildDraft: buildLessonLeafDraftFromMaterial,
  },
  {
    id: 'quiz',
    label: 'Quiz Leaf',
    description: 'Turn the material into recall and short-answer questions with an answer key.',
    buildDraft: buildQuizLeafDraftFromMaterial,
  },
  {
    id: 'brief',
    label: 'Brief Leaf',
    description: 'Condense the material into a short brief, critical facts, and bottom line.',
    buildDraft: buildBriefLeafDraftFromMaterial,
  },
  {
    id: 'action',
    label: 'Action Leaf',
    description: 'Extract practical actions, dependencies, and follow-up questions.',
    buildDraft: buildActionLeafDraftFromMaterial,
  },
  {
    id: 'explanation',
    label: 'Explanation Leaf',
    description: 'Explain what the material means step by step, with examples and pitfalls.',
    buildDraft: buildExplanationLeafDraftFromMaterial,
  },
]

export const DEFAULT_LEAF_TEMPLATE_ID: LeafTemplateId = 'summary'

export function getLeafTemplateById(templateId: LeafTemplateId) {
  return LEAF_TEMPLATES.find((template) => template.id === templateId) ?? LEAF_TEMPLATES[0]
}
