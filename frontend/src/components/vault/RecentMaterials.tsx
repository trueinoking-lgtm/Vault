'use client'

import Link from 'next/link'
import { FileText, Globe, ArrowRight } from 'lucide-react'
import { useRecentSources } from '@/lib/hooks/use-vault'
import { useTranslation } from '@/lib/hooks/use-translation'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

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
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {mat.updated && (
                    <span>
                      {formatDistanceToNow(new Date(mat.updated), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href="/sources">
                  {t('vault.open')}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
