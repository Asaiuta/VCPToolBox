import type { RouteLocationNormalizedLoaded } from "vue-router";
import type { PluginInfo } from "@/types/api.plugin";
import type { NavItem } from "@/stores/app";

function getLegacyPluginNavLabel(
  pluginName: string,
  navItems: readonly NavItem[] = []
): string | undefined {
  return navItems.find(
    (item) => item.pluginName === pluginName && item.label
  )?.label;
}

function getPluginRouteLabel(
  pluginName: string,
  plugins: readonly PluginInfo[] = [],
  navItems: readonly NavItem[] = []
): string {
  if (!pluginName) {
    return "插件配置";
  }

  const plugin = plugins.find(
    (item) => item.manifest.name === pluginName || item.name === pluginName
  );

  return (
    plugin?.manifest.displayName?.trim() ||
    getLegacyPluginNavLabel(pluginName, navItems) ||
    pluginName
  );
}

export function resolveRouteTitle(
  route: RouteLocationNormalizedLoaded,
  navItems: readonly NavItem[] = [],
  plugins: readonly PluginInfo[] = []
): string {
  if (route.name === "PluginConfig") {
    return getPluginRouteLabel(
      String(route.params.pluginName || ""),
      plugins,
      navItems
    );
  }

  const pathTarget = route.path.replace(/^\//, "").split("/")[0] || "dashboard";
  const navMatch = navItems.find(
    (item) => item.target === pathTarget && item.label
  );

  return navMatch?.label || "控制台";
}
