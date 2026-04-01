/**
 * AdminPanel-Vue 全局类型定义
 * 用于替换 any 类型，提供类型安全
 */

// ==================== 插件相关类型 ====================

export interface PluginManifest {
  /** 插件名称 */
  name: string
  /** 显示名称 */
  displayName?: string
  /** 描述 */
  description?: string
  /** 版本 */
  version?: string
  /** 图标 */
  icon?: string
}

export interface PluginInfo {
  /** 插件 Manifest */
  manifest: PluginManifest
  /** 是否启用 */
  enabled: boolean
  /** 配置文件 ENV 内容 */
  configENVContent?: string
  /** 配置文件路径 */
  configPath?: string
}

// ==================== 系统监控相关类型 ====================

export interface SystemResources {
  system?: {
    cpu?: {
      usage: number
      model?: string
      speed?: number
      cores?: number
    }
    memory?: {
      used: number
      total: number
      free?: number
      percent?: number
    }
    nodeProcess?: {
      platform?: string
      arch?: string
      version?: string
      memory?: {
        rss: number
        heapUsed?: number
        heapTotal?: number
      }
      uptime?: number
    }
    disk?: {
      total?: number
      used?: number
      free?: number
      percent?: number
    }
  }
}

export interface PM2Process {
  name?: string
  pid?: number
  status?: string
  cpu?: number
  memory?: number
  uptime?: string
  error?: string
}

// ==================== 日记管理相关类型 ====================

export interface NoteItem {
  /** 文件名 */
  file: string
  /** 标题 */
  title?: string
  /** 修改时间 */
  modified: string
  /** 内容（编辑时） */
  content?: string
  /** 预览 */
  preview?: string
}

export interface NoteApiItem {
  /** 文件名 */
  name?: string
  /** 最后修改时间 */
  lastModified?: string
  /** 预览 */
  preview?: string
  /** 摘要 */
  excerpt?: string
  /** 内容预览 */
  contentPreview?: string
  /** 摘要 */
  summary?: string
}

export interface RagTagsConfig {
  /** 是否启用阈值 */
  thresholdEnabled: boolean
  /** 阈值（0-1） */
  threshold: number
  /** 标签列表 */
  tags: string[]
}

export interface RagTagsFolderConfig {
  /** 标签列表 */
  tags?: string[]
  /** 阈值 */
  threshold?: number
}

export interface RagTagsData {
  [folder: string]: RagTagsFolderConfig | string[]
}

// ==================== 日记编辑器相关类型 ====================

export interface EasyMDEEditor {
  /** 获取编辑器内容 */
  value: () => string
  /** 转换为文本区域 */
  toTextArea: () => void
  /** 获取光标位置 */
  getCursor: () => { line: number; ch: number }
  /** 设置光标位置 */
  setCursor: (line: number, ch: number) => void
  /** 获取选中内容 */
  getSelection: () => string
  /** 替换选中内容 */
  replaceSelection: (content: string) => void
  /** 设置编辑器内容（重载） */
  setValue: (content: string) => void
}

export interface EasyMDEOptions {
  element: HTMLTextAreaElement
  spellChecker?: boolean
  status?: string[] | boolean
  minHeight?: string
  maxHeight?: string
  placeholder?: string
  toolbar?: (string | { name: string; action: () => void; title: string; className?: string })[]
  renderingConfig?: {
    singleLineBreaks?: boolean
    codeSyntaxHighlighting?: boolean
  }
  autosave?: {
    enabled?: boolean
    uniqueId?: string
    delay?: number
  }
}

// ==================== 天气相关类型 ====================

export interface HourlyWeather {
  fxTime: string
  temp: string
  text: string
  icon: string
  humidity: string
  windDir: string
  windScale: string
  pressure: string
}

export interface DailyWeather {
  fxDate: string
  textDay: string
  iconDay: string
  tempMin: string
  tempMax: string
}

export interface WeatherData {
  hourly?: HourlyWeather[]
  daily?: DailyWeather[]
}

export interface WeatherDisplay {
  icon: string
  temp: number
  text: string
  humidity: number
  wind: string
  pressure: number
  forecast: ForecastDay[]
}

export interface ForecastDay {
  fxDate: string
  dayName: string
  icon: string
  tempMin: number
  tempMax: number
  text: string
}

// ==================== 新闻相关类型 ====================

export interface NewsItem {
  title: string
  url?: string
  source?: string
}

export interface NewsResponse {
  success?: boolean
  data?: NewsItem[]
}

// ==================== 日程相关类型 ====================

export interface ScheduleItem {
  id?: string
  title: string
  startTime: string
  endTime?: string
  description?: string
  completed?: boolean
}

// ==================== Agent 相关类型 ====================

export interface AgentInfo {
  name: string
  displayName?: string
  description?: string
  version?: string
  author?: string
  score?: number
  enabled?: boolean
}

export interface AgentScore {
  name: string
  score: number
  rank?: number
}

// ==================== 工具相关类型 ====================

export interface ToolInfo {
  name: string
  description?: string
  enabled?: boolean
  requiresApproval?: boolean
}

export interface ToolboxInfo {
  name: string
  tools?: ToolInfo[]
}

// ==================== 配置相关类型 ====================

export interface BaseConfig {
  [key: string]: string | number | boolean | undefined
}

export interface EnvConfigEntry {
  key: string | null
  value: string
  isCommentOrEmpty: boolean
  isMultilineQuoted: boolean
}

// ==================== API 响应类型 ====================

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
  error?: string
}

export interface LoginResponse {
  success: boolean
  message?: string
  token?: string
}

export interface TogglePluginResponse {
  message: string
}

export interface SaveConfigResponse {
  message?: string
  success?: boolean
}

// ==================== 系统日志相关类型 ====================

export interface LogData {
  content?: string
  path?: string
  size?: number
  lastModified?: string
}

export interface LogLine {
  timestamp: string
  level: string
  message: string
  source?: string
}

// ==================== 占位符相关类型 ====================

export interface PlaceholderItem {
  name: string
  description?: string
  value?: string
  category?: string
}

// ==================== 思维链相关类型 ====================

export interface ThinkingChain {
  id: string
  name: string
  steps: ThinkingStep[]
  enabled?: boolean
}

export interface ThinkingStep {
  id: string
  name: string
  prompt: string
  order: number
}

// ==================== VCP 论坛相关类型 ====================

export interface ForumPost {
  id: string
  title: string
  content: string
  contentHtml?: string
  author?: string
  createdAt: string
  updatedAt?: string
  tags?: string[]
  views?: number
  replies?: number
}

// ==================== 多媒体缓存相关类型 ====================

export interface MediaCacheItem {
  id: string
  name: string
  type: string
  size?: number
  base64Key?: string
  createdAt?: string
  updatedAt?: string
}

// ==================== 通用工具类型 ====================

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type Primitive = string | number | boolean | symbol | bigint | null | undefined

export interface RecordString<T = unknown> {
  [key: string]: T
}
