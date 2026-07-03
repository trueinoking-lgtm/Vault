'use client'

import { Volume2, VolumeX, Loader2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTts } from '@/lib/hooks/use-tts'
import { useTranslation } from '@/lib/hooks/use-translation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MAX_TTS_CHARS = 5000

interface TTSButtonProps {
  text: string
  className?: string
}

export function TTSButton({ text, className }: TTSButtonProps) {
  const { t } = useTranslation()
  const {
    play,
    replay,
    stop,
    isPlaying,
    isLoading,
    hasCachedAudio,
    isTruncated,
    error,
  } = useTts()

  const handleClick = () => {
    if (isPlaying) {
      stop()
    } else if (hasCachedAudio && !isLoading) {
      replay()
    } else {
      play(text)
    }
  }

  const tooltipText = error
    ? error
    : isPlaying
      ? t('tts.stopHint')
      : hasCachedAudio
        ? t('tts.replayHint')
        : isTruncated
          ? `${t('tts.listenHint')} (${t('tts.truncated')} ${MAX_TTS_CHARS.toLocaleString()})`
          : t('tts.listenHint')

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
            aria-label={
              isLoading
                ? t('tts.preparing')
                : isPlaying
                  ? t('tts.stop')
                  : hasCachedAudio
                    ? t('tts.replay')
                    : t('tts.listen')
            }
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="h-4 w-4" />
            ) : hasCachedAudio ? (
              <RotateCcw className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span className="ml-1 text-xs">
              {isLoading
                ? t('tts.preparing')
                : isPlaying
                  ? t('tts.stop')
                  : hasCachedAudio
                    ? t('tts.replay')
                    : t('tts.listen')}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className={error ? 'text-destructive text-xs max-w-[240px]' : 'text-xs'}>
            {tooltipText}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
