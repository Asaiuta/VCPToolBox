import { HttpError, toHttpError } from '@/platform/http/errors'
import { httpClient } from '@/platform/http/httpClient'

type ApiUiOptions =
  | boolean
  | {
      showLoader?: boolean
      loadingKey?: string
      timeoutMs?: number
      suppressErrorMessage?: boolean
    }

export interface NewApiMonitorQuery {
  startTimestamp?: number
  endTimestamp?: number
  modelName?: string
}

export interface NewApiMonitorSummary {
  source: string
  start_timestamp: number
  end_timestamp: number
  model_name: string | null
  total_requests: number
  total_tokens: number
  total_quota: number
  current_rpm: number
  current_tpm: number
}

export interface NewApiMonitorTrendItem {
  created_at: number
  requests: number
  token_used: number
  quota: number
}

export interface NewApiMonitorModelItem {
  model_name: string
  requests: number
  token_used: number
  quota: number
}

interface NewApiMonitorEnvelope<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

interface NewApiMonitorTrendPayload {
  source: string
  start_timestamp: number
  end_timestamp: number
  model_name: string | null
  items?: NewApiMonitorTrendItem[]
}

interface NewApiMonitorModelsPayload {
  source: string
  start_timestamp: number
  end_timestamp: number
  items?: NewApiMonitorModelItem[]
}

interface MonitorError extends Error {
  status?: number
}

const DEFAULT_MONITOR_TIMEOUT_MS = 10000

const DEFAULT_MONITOR_UI_OPTIONS = {
  showLoader: false,
  timeoutMs: DEFAULT_MONITOR_TIMEOUT_MS,
  suppressErrorMessage: true,
}

function buildQueryString(query: NewApiMonitorQuery = {}): string {
  const params = new URLSearchParams()

  if (query.startTimestamp != null) {
    params.set('start_timestamp', String(query.startTimestamp))
  }

  if (query.endTimestamp != null) {
    params.set('end_timestamp', String(query.endTimestamp))
  }

  if (query.modelName) {
    params.set('model_name', query.modelName)
  }

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function createMonitorError(message: string, status?: number): MonitorError {
  const error = new Error(message) as MonitorError
  error.status = status
  return error
}

function resolveTimeout(uiOptions: ApiUiOptions): number {
  if (
    typeof uiOptions === 'object' &&
    uiOptions !== null &&
    typeof uiOptions.timeoutMs === 'number' &&
    uiOptions.timeoutMs > 0
  ) {
    return uiOptions.timeoutMs
  }

  return DEFAULT_MONITOR_TIMEOUT_MS
}

async function requestMonitorData<T>(
  path: string,
  uiOptions: ApiUiOptions = DEFAULT_MONITOR_UI_OPTIONS
): Promise<T> {
  let payload: NewApiMonitorEnvelope<T> | null = null

  try {
    payload = await httpClient.request<NewApiMonitorEnvelope<T>>({
      url: path,
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      timeoutMs: resolveTimeout(uiOptions),
    })
  } catch (error) {
    const normalizedError = toHttpError(error)

    throw createMonitorError(normalizedError.message, normalizedError.status)
  }

  if (payload?.success === false) {
    throw new HttpError(payload.error || payload.message || 'NewAPI monitor request failed')
  }

  if (!payload?.data) {
    throw createMonitorError('NewAPI monitor response is missing data')
  }

  return payload.data
}

export const newApiMonitorApi = {
  async getSummary(
    query: NewApiMonitorQuery = {},
    uiOptions: ApiUiOptions = DEFAULT_MONITOR_UI_OPTIONS
  ): Promise<NewApiMonitorSummary> {
    return requestMonitorData<NewApiMonitorSummary>(
      `/admin_api/newapi-monitor/summary${buildQueryString(query)}`,
      uiOptions
    )
  },

  async getTrend(
    query: NewApiMonitorQuery = {},
    uiOptions: ApiUiOptions = DEFAULT_MONITOR_UI_OPTIONS
  ): Promise<NewApiMonitorTrendPayload> {
    const data = await requestMonitorData<NewApiMonitorTrendPayload>(
      `/admin_api/newapi-monitor/trend${buildQueryString(query)}`,
      uiOptions
    )

    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
    }
  },

  async getModels(
    query: Omit<NewApiMonitorQuery, 'modelName'> = {},
    uiOptions: ApiUiOptions = DEFAULT_MONITOR_UI_OPTIONS
  ): Promise<NewApiMonitorModelsPayload> {
    const data = await requestMonitorData<NewApiMonitorModelsPayload>(
      `/admin_api/newapi-monitor/models${buildQueryString(query)}`,
      uiOptions
    )

    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
    }
  },

  async getDashboardSnapshot(
    query: NewApiMonitorQuery = {},
    uiOptions: ApiUiOptions = DEFAULT_MONITOR_UI_OPTIONS
  ): Promise<{
    summary: NewApiMonitorSummary
    trend: NewApiMonitorTrendItem[]
    models: NewApiMonitorModelItem[]
  }> {
    const [summaryResult, trendResult, modelsResult] = await Promise.allSettled([
      this.getSummary(query, uiOptions),
      this.getTrend(query, uiOptions),
      this.getModels({
        startTimestamp: query.startTimestamp,
        endTimestamp: query.endTimestamp,
      }, uiOptions),
    ])

    if (summaryResult.status !== 'fulfilled') {
      throw summaryResult.reason
    }

    return {
      summary: summaryResult.value,
      trend: trendResult.status === 'fulfilled' ? trendResult.value.items || [] : [],
      models: modelsResult.status === 'fulfilled' ? modelsResult.value.items || [] : [],
    }
  },
}
