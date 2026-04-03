import type { RouteLocationRaw, Router } from "vue-router";
import { getAppRouteMetaById, isAppRouteId } from "@/app/routes/manifest";

export function resolveNavigationLocation(
  target: string,
  pluginName?: string
): RouteLocationRaw {
  if (pluginName) {
    return {
      name: "PluginConfig",
      params: { pluginName },
    };
  }

  if (isAppRouteId(target)) {
    return {
      name: getAppRouteMetaById(target).routeName,
    };
  }

  if (target.startsWith("/")) {
    return { path: target };
  }

  return { path: `/${target}` };
}

export function navigateByTarget(
  router: Router,
  target: string,
  pluginName?: string
) {
  return router.push(resolveNavigationLocation(target, pluginName));
}
