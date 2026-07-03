import apiClient from './client'

export interface TTSRequest {
  text: string
  voice?: string
}

export const ttsApi = {
  /**
   * Generate speech audio from text via backend-mediated TTS.
   * Returns audio blob (audio/mpeg). Credentials stay server-side.
   */
  generate: async (text: string, voice?: string): Promise<Blob> => {
    const response = await apiClient.post<Blob>('/tts', { text, voice }, {
      responseType: 'blob',
    })
    return response.data
  },
}
