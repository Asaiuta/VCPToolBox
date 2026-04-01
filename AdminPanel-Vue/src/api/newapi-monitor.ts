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

async function requestMonitorData<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
    },
  })

  let payload: NewApiMonitorEnvelope<T> | null = null

  try {
    payload = (await response.json()) as NewApiMonitorEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw createMonitorError(
      payload?.error || payload?.message || `NewAPI monitor request failed: ${response.status}`,
      response.status
    )
  }

  if (!payload?.data) {
    throw createMonitorError('NewAPI monitor response is missing data', response.status)
  }

  return payload.data
}

export const newApiMonitorApi = {
  async getSummary(query: NewApiMonitorQuery = {}): Promise<NewApiMonitorSummary> {
    return requestMonitorData<NewApiMonitorSummary>(
      `/admin_api/newapi-monitor/summary${buildQueryString(query)}`
    )
  },

  async getTrend(query: NewApiMonitorQuery = {}): Promise<NewApiMonitorTrendPayload> {
    const data = await requestMonitorData<NewApiMonitorTrendPayload>(
      `/admin_api/newapi-monitor/trend${buildQueryString(query)}`
    )

    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
    }
  },

  async getModels(
    query: Omit<NewApiMonitorQuery, 'modelName'> = {}
  ): Promise<NewApiMonitorModelsPayload> {
    const data = await requestMonitorData<NewApiMonitorModelsPayload>(
      `/admin_api/newapi-monitor/models${buildQueryString(query)}`
    )

    return {
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
    }
  },

  async getDashboardSnapshot(
    query: NewApiMonitorQuery = {}
  ): Promise<{
    summary: NewApiMonitorSummary
    trend: NewApiMonitorTrendItem[]
    models: NewApiMonitorModelItem[]
  }> {
    const [summaryResult, trendResult, modelsResult] = await Promise.allSettled([
      this.getSummary(query),
      this.getTrend(query),
      this.getModels({
        startTimestamp: query.startTimestamp,
        endTimestamp: query.endTimestamp,
      }),
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
