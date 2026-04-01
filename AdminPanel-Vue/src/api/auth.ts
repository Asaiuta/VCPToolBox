import type { AuthCheckResponse, LoginRequest, LoginResponse } from '@/types/api'
import { createLogger } from '@/utils/logger'

export type AuthUserInfo = NonNullable<AuthCheckResponse['user']>

const logger = createLogger('AuthApi')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractAuthUser(payload: unknown): AuthUserInfo | null {
  if (!isRecord(payload)) {
    return null
  }

  const user = payload.user
  if (!isRecord(user)) {
    return null
  }

  const username = user.username
  const role = user.role

  if (typeof username !== 'string' || username.length === 0) {
    return null
  }

  return {
    username,
    role: typeof role === 'string' ? role : undefined,
  }
}

async function requestAuth(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: init.credentials ?? 'same-origin',
  })
}

async function parseJsonBody<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return null
  }

  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function requestVerifyLogin(credentials?: LoginRequest): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (credentials) {
    headers.Authorization = `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
  }

  return requestAuth('/admin_api/verify-login', {
    method: 'POST',
    headers,
  })
}

export const authApi = {
  async verifyLogin(): Promise<boolean> {
    try {
      const response = await requestVerifyLogin()
      return response.ok
    } catch (error) {
      logger.error('verify-login check failed:', error)
      return false
    }
  },

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await requestAuth('/admin_api/check-auth', {
        method: 'GET',
      })

      if (response.status === 404) {
        logger.warn('check-auth not found, falling back to verify-login')
        return await authApi.verifyLogin()
      }

      return response.ok
    } catch (error) {
      logger.warn('check-auth failed, falling back to verify-login:', error)
      return await authApi.verifyLogin()
    }
  },

  async getCurrentUserInfo(): Promise<AuthUserInfo | null> {
    try {
      const response = await requestAuth('/admin_api/check-auth', {
        method: 'GET',
      })

      if (!response.ok) {
        return null
      }

      const data = await parseJsonBody<AuthCheckResponse>(response)
      return extractAuthUser(data)
    } catch (error) {
      logger.warn('fetch user info failed at /admin_api/check-auth:', error)
      return null
    }
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await requestVerifyLogin(credentials)

      if (response.ok) {
        return { success: true }
      }

      if (response.status === 429) {
        const data = await parseJsonBody<{ message?: string }>(response)
        return {
          success: false,
          message: data?.message || '登录尝试过于频繁，请稍后再试',
        }
      }

      return {
        success: false,
        message: '用户名或密码错误',
      }
    } catch (error) {
      logger.error('login request failed:', error)
      return {
        success: false,
        message: '连接服务器失败，请检查网络',
      }
    }
  },
}
