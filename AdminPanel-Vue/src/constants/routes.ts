/**
 * 路由常量定义
 * 统一管理所有路由路径，避免魔法字符串
 */

export const ROUTES = {
  // 基础路径（不带尾部斜杠，Vue Router 会自动处理）
  BASE: '/AdminPanel',
  
  // 认证路由
  LOGIN: '/login',
  
  // 主路由
  DASHBOARD: '/dashboard',
  
  // 配置页面
  BASE_CONFIG: '/base-config',
  PLUGIN_CONFIG: '/plugin/:pluginName/config',
  
  // 日记和论坛
  DAILY_NOTES: '/daily-notes-manager',
  VCP_FORUM: '/vcp-forum',
  
  // 编辑器页面
  IMAGE_CACHE: '/image-cache-editor',
  SEMANTIC_GROUPS: '/semantic-groups-editor',
  VCP_TAVERN: '/vcptavern-editor',

  // Agent 相关
  AGENT_FILES: '/agent-files-editor',
  AGENT_ASSISTANT: '/agent-assistant-config',
  AGENT_SCORES: '/agent-scores',
  
  // 工具相关
  TOOLBOX: '/toolbox-manager',
  TVS_FILES: '/tvs-files-editor',
  TOOL_LIST: '/tool-list-editor',
  PREPROCESSOR_ORDER: '/preprocessor-order-manager',
  TOOL_APPROVAL: '/tool-approval-manager',
  
  // RAG 和思维链
  THINKING_CHAINS: '/thinking-chains-editor',
  RAG_TUNING: '/rag-tuning',
  
  // 其他页面
  SCHEDULE: '/schedule-manager',
  DREAM: '/dream-manager',
  SERVER_LOG: '/server-log-viewer',
  PLACEHOLDER: '/placeholder-viewer'
} as const

export type RouteName = typeof ROUTES[keyof typeof ROUTES]

/**
 * 获取完整路径（带基础路径前缀）
 */
export function getFullPath(path: string): string {
  if (path.startsWith('/')) {
    return `${ROUTES.BASE}${path}`
  }
  return `${ROUTES.BASE}/${path}`
}

/**
 * 路由名称映射（用于面包屑等）
 */
export const ROUTE_LABELS: Record<string, string> = {
  [ROUTES.DASHBOARD]: '仪表盘',
  [ROUTES.BASE_CONFIG]: '全局基础配置',
  [ROUTES.DAILY_NOTES]: '日记知识库管理',
  [ROUTES.VCP_FORUM]: 'VCP 论坛',
  [ROUTES.IMAGE_CACHE]: '多媒体 Base64 编辑器',
  [ROUTES.SEMANTIC_GROUPS]: '语义组编辑器',
  [ROUTES.VCP_TAVERN]: 'VCPTavern 预设编辑',
  [ROUTES.AGENT_FILES]: 'Agent 管理器',
  [ROUTES.AGENT_ASSISTANT]: 'Agent 助手配置',
  [ROUTES.AGENT_SCORES]: 'Agent 积分排行榜',
  [ROUTES.TOOLBOX]: 'Toolbox 管理器',
  [ROUTES.TVS_FILES]: '高级变量编辑器',
  [ROUTES.TOOL_LIST]: '工具列表配置编辑器',
  [ROUTES.PREPROCESSOR_ORDER]: '预处理器顺序管理',
  [ROUTES.TOOL_APPROVAL]: '插件调用审核管理',
  [ROUTES.THINKING_CHAINS]: '思维链编辑器',
  [ROUTES.RAG_TUNING]: '浪潮 RAG 调参',
  [ROUTES.SCHEDULE]: '日程管理',
  [ROUTES.DREAM]: '梦境审批',
  [ROUTES.SERVER_LOG]: '服务器日志',
  [ROUTES.PLACEHOLDER]: '占位符查看器'
}
