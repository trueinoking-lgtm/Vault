'use client'

import { Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTts } from '@/lib/hooks/use-tts'
import { useTranslation } from '@/lib/hooks/use-translation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface TTSButtonProps {
  text: string
  className?: string
}

export function TTSButton({ text, className }: TTSButtonProps) {
  const { t } = useTranslation()
  const { play, stop, isPlaying, isLoading, error } = useTts()

  const handleClick = () => {
    if (isPlaying) {
      stop()
    } else {
      play(text)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={className}
            onClick={handleClick}
            disabled={isLoading}
            aria-label={isPlaying ? t('tts.stop') : t('tts.listen')}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {isLoading
                ? t('tts.preparing')
                : isPlaying
                  ? t('tts.stop')
                  : t('tts.listen')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {error ? (
            <p className="text-destructive text-xs">{error}</p>
          ) : (
            <p>{isPlaying ? t('tts.stopHint') : t('tts.listenHint')}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
