'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { FileText, BookOpen, MessageSquare, Brain } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useTranslation } from '@/lib/hooks/use-translation'

const ContinueStudying = dynamic(
  () => import('@/components/vault/ContinueStudying'),
  { ssr: false }
)

const RecentMaterials = dynamic(
  () => import('@/components/vault/RecentMaterials'),
  { ssr: false }
)

const RecentLeaves = dynamic(
  () => import('@/components/vault/RecentLeaves'),
  { ssr: false }
)

const ReviewQueue = dynamic(
  () => import('@/components/vault/ReviewQueue'),
  { ssr: false }
)

const LearningPanel = dynamic(
  () => import('@/components/vault/LearningPanel'),
  { ssr: false }
)

const LearnerAssignmentsSection = dynamic(
  () => import('@/components/learner/LearnerAssignmentsSection').then(m => ({ default: m.LearnerAssignmentsSection })),
  { ssr: false }
)

const FirstStudyChecklist = dynamic(
  () => import('./components/FirstStudyChecklist'),
  { ssr: false }
)

const quickActions = [
  { icon: FileText, titleKey: 'vault.addMaterial', descKey: 'vault.addMaterialDesc', href: '/sources' },
  { icon: BookOpen, titleKey: 'vault.createLeaf', descKey: 'vault.createLeafDesc', href: '/sources' },
  { icon: MessageSquare, titleKey: 'vault.askVault', descKey: 'vault.askVaultDesc', href: '/search' },
  { icon: Brain, titleKey: 'vault.reviewLearningMemory', descKey: 'vault.reviewMemoryDesc', href: '/notebooks' },
] as const

export default function VaultPage() {
  const { t } = useTranslation()
  const { data: notebooks, isLoading: notebooksLoading } = useNotebooks(false)

  const hasLibraries = (notebooks?.length ?? 0) > 0
  const showFirstLibraryOnboarding = !notebooksLoading && !hasLibraries

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">{t('vault.title')}</h1>
        <p className="text-muted-foreground">{t('vault.description')}</p>

        <FirstStudyChecklist />

        {showFirstLibraryOnboarding ? null : (
          <>
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

            <ContinueStudying />
            <RecentMaterials />
            <RecentLeaves />
            <ReviewQueue />
            <LearningPanel />
            <LearnerAssignmentsSection />
          </>
        )}
      </div>
    </AppShell>
  )
}
