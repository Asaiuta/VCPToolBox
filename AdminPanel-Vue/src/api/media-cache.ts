import { apiFetch, type ApiFetchUiOptions } from '@/utils/api'

type ApiUiOptions = boolean | ApiFetchUiOptions

export interface CacheEntry {
  description?: string
  timestamp?: string
  mimeType?: string
}

export interface MediaCacheReidentifyResponse {
  message?: string
  newDescription?: string
  newTimestamp?: string
}

export const mediaCacheApi = {
  async getCache(uiOptions: ApiUiOptions = false): Promise<Record<string, CacheEntry>> {
    return apiFetch('/admin_api/multimodal-cache', {}, uiOptions)
  },

  async saveCache(
    data: Record<string, CacheEntry>,
    uiOptions: ApiUiOptions = true
  ): Promise<{ message?: string }> {
    return apiFetch(
      '/admin_api/multimodal-cache',
      {
        method: 'POST',
        body: JSON.stringify({ data }),
      },
      uiOptions
    )
  },

  async reidentify(
    base64Key: string,
    uiOptions: ApiUiOptions = true
  ): Promise<MediaCacheReidentifyResponse> {
    return apiFetch(
      '/admin_api/multimodal-cache/reidentify',
      {
        method: 'POST',
        body: JSON.stringify({ base64Key }),
      },
      uiOptions
    )
  },
}
