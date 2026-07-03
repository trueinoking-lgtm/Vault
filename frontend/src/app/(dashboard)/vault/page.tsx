'use client'

import Link from 'next/link'
import { FileText, BookOpen, MessageSquare, Brain } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'
import { AppShell } from '@/components/layout/AppShell'
import dynamic from 'next/dynamic'

const RecentLibraries = dynamic(
  () => import('@/components/vault/RecentLibraries'),
  { ssr: false }
)

const LearningPanel = dynamic(
  () => import('@/components/vault/LearningPanel'),
  { ssr: false }
)

const ContinueStudying = dynamic(
  () => import('@/components/vault/ContinueStudying'),
  { ssr: false }
)

const quickActions = [
  { icon: FileText, titleKey: 'vault.addMaterial', descKey: 'vault.addMaterialDesc', href: '/sources' },
  { icon: BookOpen, titleKey: 'vault.createLeaf', descKey: 'vault.createLeafDesc', href: '/sources' },
  { icon: MessageSquare, titleKey: 'vault.askVault', descKey: 'vault.askVaultDesc', href: '/search' },
  { icon: Brain, titleKey: 'vault.reviewMemory', descKey: 'vault.reviewMemoryDesc', href: '/notebooks' },
]

export default function VaultPage() {
  const { t } = useTranslation()

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-4xl mx-auto overflow-y-auto">
        <h1 className="text-2xl font-bold">{t('vault.title')}</h1>
        <p className="text-muted-foreground">{t('vault.description')}</p>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-3">{t('vault.quickActions')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href + action.titleKey}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{t(action.titleKey)}</div>
                  <div className="text-sm text-muted-foreground">{t(action.descKey)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Libraries */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">{t('vault.recentLibraries')}</h2>
            <Link
              href="/notebooks"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('vault.viewAll')}
            </Link>
          </div>
          <RecentLibraries />
        </section>

        {/* Learning Panel */}
        <LearningPanel />

        {/* Continue Studying */}
        <ContinueStudying />
      </div>
    </AppShell>
  )
}
