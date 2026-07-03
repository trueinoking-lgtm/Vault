import { useState, useCallback, useRef } from 'react'
import { ttsApi } from '@/lib/api/tts'

export function useTts() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const play = useCallback(async (text: string) => {
    // Stop any currently playing audio
    stop()
    setIsLoading(true)
    setError(null)

    try {
      const blob = await ttsApi.generate(text)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setError('Failed to play audio.')
        URL.revokeObjectURL(url)
        audioRef.current = null
      }

      await audio.play()
      setIsPlaying(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Text-to-speech failed.'
      // Extract detail from API error responses
      if (message.includes('400') || message.includes('not configured')) {
        setError('Text-to-speech is not configured yet.')
      } else {
        setError(message)
      }
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [stop])

  return { play, stop, isPlaying, isLoading, error }
}
