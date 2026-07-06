'use client'

import Link from 'next/link'
import { FileText, Globe, ArrowRight, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useRecentSources } from '@/lib/hooks/use-vault'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import {
  normalizeBackendSourceStatus,
  mapBackendSourceStatusToLearnerStatus,
  type LearnerSourceStatus,
} from '@/lib/source-status'

function StatusBadge({ status }: { status: LearnerSourceStatus }) {
  const { t } = useTranslation()

  const config = {
    preparing: {
      label: t('sources.statusPreparingText'),
      variant: 'secondary' as const,
      icon: Clock,
      className: 'text-muted-foreground',
    },
    building: {
      label: t('sources.statusBuildingStudyMemory'),
      variant: 'secondary' as const,
      icon: Loader2,
      className: 'text-blue-600 dark:text-blue-400',
    },
    ready: {
      label: t('sources.statusReadyToStudy'),
      variant: 'default' as const,
      icon: CheckCircle2,
      className: 'text-green-600 dark:text-green-400',
    },
    failed: {
      label: t('sources.statusFailedFriendly'),
      variant: 'destructive' as const,
      icon: AlertCircle,
      className: 'text-destructive',
    },
  }[status]

  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`text-xs gap-1 ${config.className}`}>
      <Icon className={`h-3 w-3 ${status === 'building' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  )
}

export default function RecentMaterials() {
  const { t } = useTranslation()
  const { data: materials, isLoading } = useRecentSources()

  if (isLoading) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-3">{t('vault.recentMaterials')}</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </section>
    )
  }

  if (!materials || materials.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold mb-1">{t('vault.recentMaterials')}</h2>
        <p className="text-sm text-muted-foreground mb-3">{t('vault.recentMaterialsDesc')}</p>
        <div className="text-center py-4 space-y-3">
          <p className="text-sm text-muted-foreground">{t('vault.noRecentMaterials')}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/sources">{t('vault.addMaterial')}</Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-1">{t('vault.recentMaterials')}</h2>
      <p className="text-sm text-muted-foreground mb-3">{t('vault.recentMaterialsDesc')}</p>
      <div className="space-y-3">
        {materials.map((mat) => {
          // Determine source type indicator
          const isUrl = mat.asset?.url && !mat.asset?.file_path
          const TypeIcon = isUrl ? Globe : FileText

          // Compute learner-friendly status
          const backendStatus = normalizeBackendSourceStatus(mat.status, !!mat.command_id)
          const learnerStatus = mapBackendSourceStatusToLearnerStatus(backendStatus)
          const isReady = learnerStatus === 'ready'

          return (
            <div
              key={mat.id}
              className="flex items-center gap-3 p-4 rounded-lg border"
            >
              <TypeIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">
                  {mat.title || t('vault.untitledMaterial')}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                  <StatusBadge status={learnerStatus} />
                  {mat.updated && (
                    <span>
                      {formatDistanceToNow(new Date(mat.updated), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              {isReady ? (
                <Button asChild variant="default" size="sm" className="shrink-0">
                  <Link href={`/sources/${mat.id}`}>
                    {t('sources.studyThisMaterial')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : learnerStatus === 'failed' ? (
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link href={`/sources/${mat.id}`}>
                    {t('sources.retry')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="shrink-0">
                  <Link href={`/sources/${mat.id}`}>
                    {t('vault.open')}
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
