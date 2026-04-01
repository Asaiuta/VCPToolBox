/**
 * AdminPanel-Vue 类型定义文件
 * 
 * 整合了所有类型定义，包括：
 * - API 响应类型
 * - 系统监控类型
 * - 用户和认证类型
 * - 业务数据类型
 */

// 导入 ENV 工具类型
import type { EnvEntry } from '@/utils/env'

// 导入 API 类型（详细定义）
export type * from './api'

// ========== API 响应类型 ==========

/**
 * API 响应基础类型（简化版，详细版本见 types/api.ts）
 */
export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 认证响应
 */
export interface AuthResponse {
  success: boolean
  message?: string
}

/**
 * 分页响应结构
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ========== 系统监控类型 ==========

/**
 * 系统监控数据
 */
export interface SystemResources {
  system: {
    cpu: {
      usage: number
    }
    memory: {
      used: number
      total: number
    }
    nodeProcess: {
      platform: string
      arch: string
      pid: number
      version: string
      memory: {
        rss: number
        heapUsed: number
        heapTotal: number
      }
      uptime: number
    }
  }
}

/**
 * PM2 进程信息
 */
export interface PM2Process {
  pid: number
  name: string
  status: 'online' | 'stopped' | 'launching' | 'errored'
  cpu: number
  memory: number
  uptime: number
  restarted: number
}

// ========== 天气和新闻类型 ==========

/**
 * 天气数据
 */
export interface WeatherData {
  city: string
  temp: number
  text: string
  icon: string
  humidity: number
  wind: string
  forecast: Array<{
    date: string
    icon: string
    low: number
    high: number
    text: string
  }>
}

/**
 * 新闻条目
 */
export interface NewsItem {
  title: string
  url: string
  source: string
}

// ========== 日记和知识库类型 ==========

/**
 * 日记数据
 */
export interface Note {
  file: string
  title?: string
  modified: string
  content?: string
  preview?: string
}

/**
 * 知识库文件夹
 */
export interface Folder {
  name: string
  path: string
  noteCount?: number
  createdAt?: string
  modifiedAt?: string
}

/**
 * RAG Tags 配置
 */
export interface RagTagsConfig {
  thresholdEnabled: boolean
  threshold: number
  tags: string[]
}

// ========== Agent 相关类型 ==========

/**
 * Agent 映射条目
 */
export interface AgentMapEntry {
  name: string
  file: string
}

/**
 * 插件信息
 */
export interface PluginInfo {
  name: string
  displayName: string
  enabled: boolean
  description?: string
  version?: string
  configEnvContent?: string
  manifest: {
    name: string
    displayName: string
    description?: string
    version?: string
  }
}

/**
 * Agent 助手配置
 */
export interface AgentAssistantConfig {
  maxHistoryRounds: number
  contextTtlHours: number
  globalSystemPrompt: string
  agents: Array<{
    baseName: string
    chineseName: string
    modelId: string
    description: string
    systemPrompt: string
    maxOutputTokens: number
    temperature: number
  }>
}

/**
 * Agent 积分
 */
export interface AgentScore {
  name: string
  score: number
  rank: number
}

// ========== 论坛类型 ==========

/**
 * 论坛帖子
 */
export interface ForumPost {
  uid: string
  title: string
  author: string
  board: string
  timestamp: string
  lastReplyBy?: string | null
  lastReplyAt?: string | null
  pinned?: boolean
  replies?: number
}

/**
 * 论坛回复
 */
export interface ForumReply {
  id: number
  author: string
  createdAt: string
  content: string
}

/**
 * 论坛帖子详情
 */
export interface ForumPostDetail {
  uid: string
  title: string
  author: string
  board: string
  createdAt: string
  contentHtml: string
  replies: number
  repliesList: ForumReply[]
}

// ========== 工具类型 ==========

/**
 * Toolbox 条目
 */
export interface ToolboxEntry {
  alias: string
  file: string
  description: string
}

/**
 * 工具审核配置
 */
export interface ToolApprovalConfig {
  enabled: boolean
  autoApprovePatterns: string[]
  denyPatterns: string[]
}

/**
 * 预处理器配置
 */
export interface PreprocessorConfig {
  name: string
  order: number
  enabled: boolean
}

// ========== 配置类型 ==========

/**
 * ENV 配置条目（从工具函数导入）
 */
export type { EnvEntry }

/**
 * TVS 变量
 */
export interface TvsVariable {
  key: string
  value: string
  description?: string
}

/**
 * 思维链配置
 */
export interface ThinkingChain {
  id: string
  name: string
  steps: Array<{
    prompt: string
    model?: string
    temperature?: number
  }>
}

/**
 * 语义组配置
 */
export interface SemanticGroup {
  id: string
  name: string
  keywords: string[]
  weight: number
}

// ========== 日程和梦境类型 ==========

/**
 * 日程数据
 */
export interface Schedule {
  id: string
  title: string
  description: string
  startTime: string
  endTime: string
  location?: string
  reminder?: boolean
}

/**
 * 梦境日志
 */
export interface DreamLog {
  id: string
  title: string
  content: string
  timestamp: string
  tags?: string[]
  rating?: number
}

// ========== 其他类型 ==========

/**
 * 占位符数据
 */
export interface Placeholder {
  name: string
  value: string
  description?: string
}

/**
 * 服务器日志
 */
export interface ServerLog {
  timestamp: string
  level: string
  message: string
  source?: string
}

/**
 * 多媒体缓存
 */
export interface MultimodalCache {
  id: string
  url: string
  base64: string
  timestamp: string
}

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  pageLoadTime: number
  domContentLoaded: number
  firstPaint?: number
  firstContentfulPaint?: number
  apiRequests: {
    total: number
    success: number
    failed: number
    avgResponseTime: number
  }
  resources: {
    total: number
    cached: number
    totalSize: number
  }
}
