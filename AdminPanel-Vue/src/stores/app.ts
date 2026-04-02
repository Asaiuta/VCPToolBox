/**
 * 应用状态管理 Store
 * 管理主题、动画、固定导航与插件数据
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useLocalStorage } from "@/composables/useLocalStorage";
import type { PluginInfo } from "@/types/api.plugin";

export interface NavItem {
  target?: string;
  label?: string;
  icon?: string;
  category?: string;
  pluginName?: string;
  enabled?: boolean;
}

const PINNED_PLUGINS_STORAGE_KEY = "pinnedPlugins";

function getPluginName(plugin: PluginInfo): string {
  return plugin.manifest.name || plugin.name;
}

function getPluginLabel(plugin: PluginInfo): string {
  return plugin.manifest.displayName?.trim() || getPluginName(plugin);
}

function comparePluginLabels(a: PluginInfo, b: PluginInfo): number {
  return getPluginLabel(a).localeCompare(getPluginLabel(b), "zh-CN", {
    sensitivity: "base",
  });
}

export const useAppStore = defineStore("app", () => {
  const theme = useLocalStorage<"dark" | "light">("theme", "dark");
  const animationsEnabled = useLocalStorage<boolean>("animationsEnabled", true);
  const pinnedPluginNames = useLocalStorage<string[]>(
    PINNED_PLUGINS_STORAGE_KEY,
    []
  );

  const navItems = ref<NavItem[]>([
    { target: "dashboard", label: "仪表盘", icon: "dashboard" },
    { category: "———— 核 心 功 能 ————" },
    { target: "base-config", label: "全局基础配置", icon: "settings" },
    {
      target: "daily-notes-manager",
      label: "日记知识库管理",
      icon: "description",
    },
    { target: "vcp-forum", label: "VCP 论坛", icon: "forum" },
    {
      target: "image-cache-editor",
      label: "多媒体 Base64 编辑器",
      icon: "photo_library",
    },
    {
      target: "semantic-groups-editor",
      label: "语义组编辑器",
      icon: "hub",
    },
    {
      target: "vcptavern-editor",
      label: "VCPTavern 预设编辑",
      icon: "casino",
    },
    {
      target: "agent-files-editor",
      label: "Agent 管理器",
      icon: "smart_toy",
    },
    {
      target: "toolbox-manager",
      label: "Toolbox 管理器",
      icon: "inventory_2",
    },
    {
      target: "agent-assistant-config",
      label: "Agent 助手配置",
      icon: "diversity_3",
    },
    {
      target: "agent-scores",
      label: "Agent 积分排行榜",
      icon: "leaderboard",
    },
    {
      target: "tvs-files-editor",
      label: "高级变量编辑器",
      icon: "data_object",
    },
    {
      target: "tool-list-editor",
      label: "工具列表配置编辑器",
      icon: "construction",
    },
    {
      target: "preprocessor-order-manager",
      label: "预处理器顺序管理",
      icon: "sort",
    },
    {
      target: "tool-approval-manager",
      label: "插件调用审核管理",
      icon: "verified_user",
    },
    {
      target: "thinking-chains-editor",
      label: "思维链编辑器",
      icon: "psychology",
    },
    {
      target: "schedule-manager",
      label: "日程管理",
      icon: "calendar_month",
    },
    { target: "dream-manager", label: "梦境审批", icon: "nights_stay" },
    { target: "rag-tuning", label: "浪潮 RAG 调参", icon: "tune" },
    { target: "server-log-viewer", label: "服务器日志", icon: "terminal" },
    {
      target: "placeholder-viewer",
      label: "占位符查看器",
      icon: "view_list",
    },
    { category: "———— 插 件 中 心 ————" },
    { target: "plugins", label: "插件中心", icon: "extension" },
  ]);

  const plugins = ref<PluginInfo[]>([]);
  const pluginsLoaded = ref(false);

  const currentTheme = computed(() => theme.value);
  const isAnimationsEnabled = computed(() => animationsEnabled.value);
  const pluginMap = computed(
    () => new Map(plugins.value.map((plugin) => [getPluginName(plugin), plugin]))
  );
  const pinnedPlugins = computed(() =>
    pinnedPluginNames.value
      .map((pluginName) => pluginMap.value.get(pluginName))
      .filter((plugin): plugin is PluginInfo => plugin !== undefined)
  );

  function setTheme(newTheme: "dark" | "light") {
    theme.value = newTheme;
    document.documentElement.setAttribute("data-theme", newTheme);
  }

  function toggleAnimations() {
    animationsEnabled.value = !animationsEnabled.value;
  }

  function loadPlugins(pluginList: PluginInfo[]) {
    const sortedPlugins = [...pluginList].sort(comparePluginLabels);
    plugins.value = sortedPlugins;
    pluginsLoaded.value = true;

    const validPluginNames = new Set(sortedPlugins.map(getPluginName));
    pinnedPluginNames.value = pinnedPluginNames.value.filter((pluginName) =>
      validPluginNames.has(pluginName)
    );
  }

  function markPluginsLoaded() {
    pluginsLoaded.value = true;
  }

  function getNavLabel(target: string): string | undefined {
    return navItems.value.find((item) => item.target === target)?.label;
  }

  function getPluginByName(pluginName: string): PluginInfo | undefined {
    return pluginMap.value.get(pluginName);
  }

  function getPluginDisplayName(pluginName: string): string {
    const plugin = getPluginByName(pluginName);
    return plugin ? getPluginLabel(plugin) : pluginName;
  }

  function getPluginDescription(pluginName: string): string {
    return getPluginByName(pluginName)?.manifest.description?.trim() || "";
  }

  function getPluginIcon(pluginName: string): string {
    return getPluginByName(pluginName)?.manifest.icon || "extension";
  }

  function isPluginPinned(pluginName: string): boolean {
    return pinnedPluginNames.value.includes(pluginName);
  }

  function pinPlugin(pluginName: string) {
    if (!pluginMap.value.has(pluginName) || isPluginPinned(pluginName)) {
      return;
    }

    pinnedPluginNames.value = [...pinnedPluginNames.value, pluginName];
  }

  function unpinPlugin(pluginName: string) {
    pinnedPluginNames.value = pinnedPluginNames.value.filter(
      (item) => item !== pluginName
    );
  }

  function togglePinnedPlugin(pluginName: string) {
    if (isPluginPinned(pluginName)) {
      unpinPlugin(pluginName);
      return;
    }

    pinPlugin(pluginName);
  }

  return {
    theme,
    animationsEnabled,
    navItems,
    plugins,
    pluginsLoaded,
    pinnedPluginNames,
    pinnedPlugins,
    currentTheme,
    isAnimationsEnabled,
    setTheme,
    toggleAnimations,
    loadPlugins,
    markPluginsLoaded,
    getNavLabel,
    getPluginByName,
    getPluginDisplayName,
    getPluginDescription,
    getPluginIcon,
    isPluginPinned,
    pinPlugin,
    unpinPlugin,
    togglePinnedPlugin,
  };
});
