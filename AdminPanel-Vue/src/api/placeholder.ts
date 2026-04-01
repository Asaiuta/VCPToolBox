import { apiFetch, type ApiFetchUiOptions } from '@/utils/api'
import type { Placeholder } from '@/views/PlaceholderViewer/types'

type ApiUiOptions = boolean | ApiFetchUiOptions

interface PlaceholderListResponse {
  data?: {
    list?: Placeholder[]
  }
}

interface PlaceholderDetailResponse {
  data?: {
    value?: string
  }
}

export const placeholderApi = {
  async getPlaceholders(uiOptions: ApiUiOptions = false): Promise<Placeholder[]> {
    const response = await apiFetch<PlaceholderListResponse>(
      '/admin_api/placeholders',
      {},
      uiOptions
    )

    return response.data?.list || []
  },

  async getPlaceholderDetail(
    type: string,
    name: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string | null> {
    const response = await apiFetch<PlaceholderDetailResponse>(
      `/admin_api/placeholders/detail?type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}`,
      {},
      uiOptions
    )

    return response.data?.value != null ? String(response.data.value) : null
  },
}
