import { useState, useCallback, useRef, useEffect } from 'react'
import { ttsApi } from '@/lib/api/tts'

const MAX_TTS_CHARS = 5000

/**
 * Global audio singleton — only one TTS clip plays at a time across the app.
 * When any useTts() instance starts playing, all other instances stop.
 */
let currentAudio: HTMLAudioElement | null = null
let globalStopListeners: Array<() => void> = []

function stopAllAudio() {
  // Notify all registered hooks to clear their state
  for (const listener of globalStopListeners) {
    listener()
  }

  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
}

export function useTts() {
  const instanceIdRef = useRef(crypto.randomUUID())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedBlobUrl, setCachedBlobUrl] = useState<string | null>(null)
  const [isTruncated, setIsTruncated] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current = null
    }
    setIsPlaying(false)
  }, [])

  // Register this instance as a global stop listener
  useEffect(() => {
    const listener = () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlaying(false)
    }
    globalStopListeners.push(listener)
    return () => {
      globalStopListeners = globalStopListeners.filter((l) => l !== listener)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current = null
      }
    }
  }, [])

  const play = useCallback(async (text: string) => {
    // Stop any globally playing audio
    stopAllAudio()

    // Client-side truncation
    const truncated = text.length > MAX_TTS_CHARS
    const textToSend = truncated ? text.slice(0, MAX_TTS_CHARS) : text
    setIsTruncated(truncated)

    if (truncated) {
      setError(`Text is long (${text.length.toLocaleString()} chars). First ${MAX_TTS_CHARS.toLocaleString()} characters will be read.`)
    } else {
      setError(null)
    }

    setIsLoading(true)

    try {
      const blob = await ttsApi.generate(textToSend)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      currentAudio = audio

      audio.onended = () => {
        setIsPlaying(false)
        // Keep blob URL cached for replay
        setCachedBlobUrl(url)
        audioRef.current = null
        currentAudio = null
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setError('Failed to play audio.')
        URL.revokeObjectURL(url)
        audioRef.current = null
        currentAudio = null
      }

      await audio.play()
      setIsPlaying(true)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Text-to-speech failed.'

      if (message.includes('400') || message.includes('not configured')) {
        setError('Text-to-speech is not configured. Set a default TTS model in Settings → Models.')
      } else if (message.includes('422') || message.includes('at most')) {
        setError('Text is too long. Please shorten the content.')
      } else {
        setError(message.length > 200 ? message.slice(0, 200) + '…' : message)
      }
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const replay = useCallback(async () => {
    if (!cachedBlobUrl) return

    // Stop any globally playing audio
    stopAllAudio()

    try {
      const audio = new Audio(cachedBlobUrl)
      audioRef.current = audio
      currentAudio = audio

      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
        currentAudio = null
        // blob URL stays cached for another replay
      }

      audio.onerror = () => {
        setIsPlaying(false)
        setError('Failed to replay audio.')
        URL.revokeObjectURL(cachedBlobUrl)
        setCachedBlobUrl(null)
        audioRef.current = null
        currentAudio = null
      }

      await audio.play()
      setIsPlaying(true)
      setError(null)
    } catch {
      setError('Failed to replay audio.')
    }
  }, [cachedBlobUrl])

  return {
    play,
    replay,
    stop,
    isPlaying,
    isLoading,
    hasCachedAudio: !!cachedBlobUrl,
    isTruncated,
    error,
  }
}
