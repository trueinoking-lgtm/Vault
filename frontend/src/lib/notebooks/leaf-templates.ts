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
  buildDraft: (source: SourceResponse) => LeafDraft
}

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

export function buildSummaryLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## Summary',
      '## Key Ideas',
      '## Explanation',
      '## Insights',
      '## Questions',
      '## Next Steps',
    ]),
  }
}

export function buildLessonLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Lesson Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## Core Lesson',
      '## Why It Matters',
      '## Supporting Evidence',
      '## Real-World Takeaways',
      '## Open Questions',
    ]),
  }
}

export function buildQuizLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Quiz Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## Quick Recall Questions\n\n1. \n2. \n3. ',
      '## Short Answer Questions\n\n1. \n2. ',
      '## Answer Key',
    ]),
  }
}

export function buildBriefLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Brief Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## One-Paragraph Brief',
      '## Critical Facts',
      '## Risks / Caveats',
      '## Bottom Line',
    ]),
  }
}

export function buildActionLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Action Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## Key Actions\n\n- [ ] ',
      '## Recommended Next Steps',
      '## Dependencies',
      '## Follow-Up Questions',
    ]),
  }
}

export function buildExplanationLeafDraftFromMaterial(source: SourceResponse): LeafDraft {
  const { sourceTitle, metadataLines } = getMaterialMetadata(source)
  const title = `Explanation Leaf from ${sourceTitle}`

  return {
    initialTitle: title,
    initialContent: buildLeafContent(title, metadataLines, [
      '## What This Means',
      '## Step-by-Step Explanation',
      '## Example',
      '## Common Misunderstandings',
      '## Questions to Explore',
    ]),
  }
}

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
