/**
 * 应用状态管理 Store
 * 管理主题、动画、固定导航与插件数据
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { buildSidebarNavItems } from "@/app/routes/manifest";
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

  const navItems = ref<NavItem[]>(buildSidebarNavItems());

  const plugins = ref<PluginInfo[]>([]);
  const pluginsLoaded = ref(false);

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
