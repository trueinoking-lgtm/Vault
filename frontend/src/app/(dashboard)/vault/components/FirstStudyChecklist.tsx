'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, BookOpen, FileText, Brain, ArrowRight, Loader2 } from 'lucide-react'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useRecentSources } from '@/lib/hooks/use-vault'
import { useRecentNotes } from '@/lib/hooks/use-vault'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useCreateDialogs } from '@/lib/hooks/use-create-dialogs'
import { mapBackendSourceStatusToLearnerStatus, normalizeBackendSourceStatus } from '@/lib/source-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

/**
 * FirstStudyChecklist — learner onboarding checklist for the /vault dashboard.
 *
 * Infers completion from existing data (notebooks, sources, leaves).
 * Shows CTAs for incomplete steps. Collapses once required steps are done.
 *
 * Phase I2b: honest completion — 4 required steps + 1 optional follow-up.
 * "Review what you missed" is a follow-up action, not a required gate.
 * The all-complete banner appears when the 4 required steps are done.
 *
 * Phase I2: no backend changes, no persistence, no new routes.
 */

interface ChecklistStep {
  key: string
  labelKey: string
  completed: boolean
  ctaLabelKey?: string
  ctaHref?: string
  ctaAction?: 'openNotebookDialog' | 'openSourceDialog'
  icon: typeof CheckCircle2
  /** If true, this step is optional — counted in display but not in required completion. */
  optional?: boolean
}

export default function FirstStudyChecklist() {
  const { t } = useTranslation()
  const { openNotebookDialog, openSourceDialog } = useCreateDialogs()

  const { data: notebooks, isLoading: notebooksLoading } = useNotebooks(false)
  const { data: sources, isLoading: sourcesLoading } = useRecentSources(50)
  const { data: leaves, isLoading: leavesLoading } = useRecentNotes(50)

  const isLoading = notebooksLoading || sourcesLoading || leavesLoading

  // ── Completion logic ──
  const hasLibrary = (notebooks?.length ?? 0) > 0
  const hasMaterial = (sources?.length ?? 0) > 0

  // A material is "ready" if any source has learner status 'ready'
  const hasReadyMaterial = (sources ?? []).some((s) => {
    const backendStatus = normalizeBackendSourceStatus(s.status, !!s.command_id)
    const learnerStatus = mapBackendSourceStatusToLearnerStatus(backendStatus)
    return learnerStatus === 'ready'
  })

  // "Started studying" = has at least one leaf (study card created from material)
  const hasStartedStudying = (leaves?.length ?? 0) > 0

  // Review is a follow-up — not a required gate for checklist completion.
  // We don't have a reliable global review queue check, so we show it as
  // gentle follow-up guidance that never blocks the all-complete state.
  const hasReviewData = false

  const steps: ChecklistStep[] = [
    {
      key: 'createLibrary',
      labelKey: 'vault.checklist.createLibrary',
      completed: hasLibrary,
      ctaLabelKey: 'vault.checklist.createLibraryCta',
      ctaAction: 'openNotebookDialog',
      icon: BookOpen,
    },
    {
      key: 'addMaterial',
      labelKey: 'vault.checklist.addMaterial',
      completed: hasMaterial,
      ctaLabelKey: 'vault.checklist.addMaterialCta',
      ctaHref: '/sources',
      icon: FileText,
    },
    {
      key: 'materialReady',
      labelKey: 'vault.checklist.materialReady',
      completed: hasReadyMaterial,
      ctaLabelKey: 'vault.checklist.materialReadyCta',
      ctaHref: '/sources',
      icon: Loader2,
    },
    {
      key: 'startStudying',
      labelKey: 'vault.checklist.startStudying',
      completed: hasStartedStudying,
      ctaLabelKey: 'vault.checklist.startStudyingCta',
      ctaHref: hasLibrary ? `/notebooks` : undefined,
      icon: Brain,
    },
    {
      key: 'reviewMissed',
      labelKey: 'vault.checklist.reviewMissed',
      completed: hasReviewData,
      ctaLabelKey: 'vault.checklist.reviewMissedCta',
      ctaHref: '/notebooks',
      icon: CheckCircle2,
      optional: true,
    },
  ]

  const requiredSteps = steps.filter((s) => !s.optional)
  const optionalSteps = steps.filter((s) => s.optional)
  const requiredCompletedCount = requiredSteps.filter((s) => s.completed).length
  const allRequiredComplete = requiredCompletedCount === requiredSteps.length

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // ── All required done — collapse to a subtle summary ──
  if (allRequiredComplete) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          <p className="text-sm font-medium text-green-700 dark:text-green-300">
            {t('vault.checklist.allComplete')}
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Active checklist ──
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('vault.checklist.title')}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {requiredCompletedCount}/{requiredSteps.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.key}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                step.completed
                  ? 'bg-green-50/50 dark:bg-green-950/20'
                  : 'hover:bg-accent/50',
              )}
            >
              {/* Status icon */}
              {step.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}

              {/* Label */}
              <span
                className={cn(
                  'text-sm flex-1',
                  step.completed ? 'text-muted-foreground line-through' : 'font-medium',
                  step.optional && !step.completed ? 'text-muted-foreground italic' : '',
                )}
              >
                {t(step.labelKey)}
                {step.optional && !step.completed ? (
                  <span className="ml-1 text-xs normal-case not-italic">
                    ({t('vault.checklist.optionalHint')})
                  </span>
                ) : null}
              </span>

              {/* CTA button — show for incomplete required steps, or for optional follow-up */}
              {!step.completed && step.ctaLabelKey && (
                <>
                  {step.ctaAction === 'openNotebookDialog' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={openNotebookDialog}
                    >
                      {t(step.ctaLabelKey)}
                    </Button>
                  ) : step.ctaAction === 'openSourceDialog' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={openSourceDialog}
                    >
                      {t(step.ctaLabelKey)}
                    </Button>
                  ) : step.ctaHref ? (
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                      <Link href={step.ctaHref}>
                        {t(step.ctaLabelKey)}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
