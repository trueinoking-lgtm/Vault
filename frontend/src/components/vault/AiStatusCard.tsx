'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Mic, MicOff } from 'lucide-react'
import { useTranslation } from '@/lib/hooks/use-translation'
import { useCredentialStatus } from '@/lib/hooks/use-credentials'
import { useModels } from '@/lib/hooks/use-models'

export function AiStatusCard() {
  const { t } = useTranslation()
  const { data: credentialStatus, isLoading: statusLoading } = useCredentialStatus()
  const { data: models, isLoading: modelsLoading } = useModels()

  const isLoading = statusLoading || modelsLoading

  // Check if any language model is configured
  const hasLanguageModels = models?.some((m) => m.type === 'language')

  // Check if any TTS model is configured
  const hasTtsModels = models?.some((m) => m.type === 'text_to_speech')

  // credentialStatus.configured is a Record<string, boolean> — check if any provider is configured
  const hasConfiguredCredentials =
    credentialStatus?.configured && Object.values(credentialStatus.configured).some(Boolean)
  const aiReady = hasConfiguredCredentials || hasLanguageModels === true

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Bot className="h-4 w-4 animate-pulse" />
            <span>{t('common.loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {t('vault.aiStatus.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('vault.aiStatus.ready')}
          </span>
          <Badge variant={aiReady ? 'default' : 'secondary'}>
            {aiReady ? t('common.success') : t('common.error')}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            {hasTtsModels ? (
              <Mic className="h-3 w-3" />
            ) : (
              <MicOff className="h-3 w-3" />
            )}
            {hasTtsModels ? t('vault.aiStatus.voiceReady') : t('vault.aiStatus.voiceNotConfigured')}
          </span>
          <Badge variant={hasTtsModels ? 'default' : 'outline'}>
            {hasTtsModels ? '✓' : '—'}
          </Badge>
        </div>

        {!aiReady && (
          <p className="text-xs text-muted-foreground pt-1">
            {t('vault.aiStatus.askAdmin')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
