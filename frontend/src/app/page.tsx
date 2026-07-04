'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { LanguageToggle } from '@/components/common/LanguageToggle'
import { useTranslation } from '@/lib/hooks/use-translation'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center text-center space-y-8 max-w-md">
        {/* Logo */}
        <Image
          src="/logo.svg"
          alt="Vault"
          width={80}
          height={80}
          className="drop-shadow-sm"
        />

        {/* Welcome text */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('modeEntry.welcome')}
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('modeEntry.description')}
          </p>
        </div>

        {/* Start Learning CTA */}
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          {t('modeEntry.startLearning')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Footer: theme + language */}
      <div className="absolute bottom-6 flex items-center gap-3">
        <ThemeToggle />
        <LanguageToggle />
      </div>
    </div>
  )
}
