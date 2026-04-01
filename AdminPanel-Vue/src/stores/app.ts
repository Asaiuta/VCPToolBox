/**
 * 应用状态管理 Store
 * 管理主题、动画、导航菜单和插件状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'
import type { PluginInfo } from '@/types/api.plugin'

/**
 * 导航菜单项
 */
export interface NavItem {
  /** 路由目标 */
  target?: string
  /** 显示标签 */
  label?: string
  /** 图标名称 */
  icon?: string
  /** 分类标题 */
  category?: string
  /** 插件名称（如果是插件） */
  pluginName?: string
  /** 是否启用 */
  enabled?: boolean
}

/**
 * 插件 Manifest 信息
 */
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

// 注意：PluginInfo 已从 types/models 导入，避免重复定义

export const useAppStore = defineStore('app', () => {
  // ==================== State ====================
  
  /** 主题（暗色/亮色） - 使用 useLocalStorage */
  const theme = useLocalStorage<'dark' | 'light'>('theme', 'dark')
  
  /** 动画是否启用 - 使用 useLocalStorage */
  const animationsEnabled = useLocalStorage<boolean>('animationsEnabled', true)

  /**
   * 导航菜单项
   * 包含核心功能和动态加载的插件
   */
  const navItems = ref<NavItem[]>([
    { target: 'dashboard', label: '仪表盘', icon: 'dashboard' },
    { category: '———— 核 心 功 能 ————' },
    { target: 'base-config', label: '全局基础配置', icon: 'settings' },
    { target: 'daily-notes-manager', label: '日记知识库管理', icon: 'description' },
    { target: 'vcp-forum', label: 'VCP 论坛', icon: 'forum' },
    { target: 'image-cache-editor', label: '多媒体 Base64 编辑器', icon: 'photo_library' },
    { target: 'semantic-groups-editor', label: '语义组编辑器', icon: 'hub' },
    { target: 'vcptavern-editor', label: 'VCPTavern 预设编辑', icon: 'casino' },
    { target: 'agent-files-editor', label: 'Agent 管理器', icon: 'smart_toy' },
    { target: 'toolbox-manager', label: 'Toolbox 管理器', icon: 'inventory_2' },
    { target: 'agent-assistant-config', label: 'Agent 助手配置', icon: 'diversity_3' },
    { target: 'agent-scores', label: 'Agent 积分排行榜', icon: 'leaderboard' },
    { target: 'tvs-files-editor', label: '高级变量编辑器', icon: 'data_object' },
    { target: 'tool-list-editor', label: '工具列表配置编辑器', icon: 'construction' },
    { target: 'preprocessor-order-manager', label: '预处理器顺序管理', icon: 'sort' },
    { target: 'tool-approval-manager', label: '插件调用审核管理', icon: 'verified_user' },
    { target: 'thinking-chains-editor', label: '思维链编辑器', icon: 'psychology' },
    { target: 'schedule-manager', label: '日程管理', icon: 'calendar_month' },
    { target: 'dream-manager', label: '梦境审批', icon: 'nights_stay' },
    { target: 'rag-tuning', label: '浪潮 RAG 调参', icon: 'tune' },
    { target: 'server-log-viewer', label: '服务器日志', icon: 'terminal' },
    { target: 'placeholder-viewer', label: '占位符查看器', icon: 'view_list' },
    { category: '———— 插 件 管 理 ————' }
    // 插件列表将动态加载
  ])

  /** 插件列表 */
  const plugins = ref<PluginInfo[]>([])
  const pluginsLoaded = ref(false)

  // ==================== Getters ====================
  
  const currentTheme = computed(() => theme.value)
  const isAnimationsEnabled = computed(() => animationsEnabled.value)

  // ==================== Actions ====================
  
  /**
   * 设置主题
   * @param newTheme - 新主题（dark/light）
   */
  function setTheme(newTheme: 'dark' | 'light') {
    theme.value = newTheme
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  /**
   * 切换动画开关
   */
  function toggleAnimations() {
    animationsEnabled.value = !animationsEnabled.value
  }

  /**
   * 加载插件列表并更新导航菜单
   * @param pluginList - 插件列表数据
   */
  function loadPlugins(pluginList: PluginInfo[]) {
    plugins.value = pluginList
    pluginsLoaded.value = true
    
    // 分类插件
    const enabledPlugins = pluginList.filter(p => p.enabled)
    const disabledPlugins = pluginList.filter(p => !p.enabled)

    // 清空现有插件导航项（保留核心功能和分类标题）
    navItems.value = navItems.value.filter(item => item.category || !item.pluginName)

    // 添加已启用插件
    if (enabledPlugins.length > 0) {
      navItems.value.push({ category: '———— 已启用插件 ————' })
      enabledPlugins.forEach(plugin => {
        navItems.value.push({
          target: `plugin-${plugin.manifest.name}-config`,
          label: plugin.manifest.displayName || plugin.manifest.name,
          icon: plugin.manifest.icon || 'extension',
          pluginName: plugin.manifest.name,
          enabled: true
        })
      })
    }

    // 添加已禁用插件
    if (disabledPlugins.length > 0) {
      navItems.value.push({ category: '———— 已禁用插件 ————' })
      disabledPlugins.forEach(plugin => {
        navItems.value.push({
          target: `plugin-${plugin.manifest.name}-config`,
          label: plugin.manifest.displayName || plugin.manifest.name,
          icon: plugin.manifest.icon || 'extension',
          pluginName: plugin.manifest.name,
          enabled: false
        })
      })
    }
  }

  function markPluginsLoaded() {
    pluginsLoaded.value = true
  }

  // ==================== Export ====================
  
  return {
    // State
    theme,
    animationsEnabled,
    navItems,
    plugins,
    pluginsLoaded,
    // Getters
    currentTheme,
    isAnimationsEnabled,
    // Actions
    setTheme,
    toggleAnimations,
    loadPlugins,
    markPluginsLoaded
  }
})
