import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { ROUTES } from "@/constants/routes";
import { createLogger } from "@/utils/logger";
const VcptavernEditor = () => import("../views/VcptavernEditor.vue");
const logger = createLogger("Router");

const routes: RouteRecordRaw[] = [
  {
    path: ROUTES.LOGIN,
    name: "Login",
    component: () => import(/* webpackChunkName: "auth" */ "@/views/Login.vue"),
  },
  {
    path: "/",
    name: "Main",
    component: () =>
      import(/* webpackChunkName: "layout" */ "@/layouts/MainLayout.vue"),
    redirect: ROUTES.DASHBOARD,
    children: [
      // 核心页面（优先加载）
      {
        path: "dashboard",
        name: "Dashboard",
        component: () =>
          import(/* webpackChunkName: "dashboard" */ "@/views/Dashboard.vue"),
      },
      {
        path: "base-config",
        name: "BaseConfig",
        component: () =>
          import(/* webpackChunkName: "config" */ "@/views/BaseConfig.vue"),
      },

      // 日记和论坛（大文件，独立 chunk）
      {
        path: "daily-notes-manager",
        name: "DailyNotesManager",
        component: () =>
          import(
            /* webpackChunkName: "daily-notes" */ "@/views/DailyNotesManager.vue"
          ),
      },
      {
        path: "vcp-forum",
        name: "VcpForum",
        component: () =>
          import(/* webpackChunkName: "forum" */ "@/views/VcpForum.vue"),
      },

      // 编辑器页面（共享 chunk）
      {
        path: "image-cache-editor",
        name: "ImageCacheEditor",
        component: () =>
          import(
            /* webpackChunkName: "editors" */ "@/views/ImageCacheEditor.vue"
          ),
      },
      {
        path: "semantic-groups-editor",
        name: "SemanticGroupsEditor",
        component: () =>
          import(
            /* webpackChunkName: "editors" */ "@/views/SemanticGroupsEditor.vue"
          ),
      },
      {
        path: "vcptavern-editor",
        name: "VcptavernEditor",
        component: VcptavernEditor,
        meta: { requiresAuth: true },
      },

      // Agent 相关（共享 chunk）
      {
        path: "agent-files-editor",
        name: "AgentFilesEditor",
        component: () =>
          import(
            /* webpackChunkName: "agent" */ "@/views/AgentFilesEditor.vue"
          ),
      },
      {
        path: "agent-assistant-config",
        name: "AgentAssistantConfig",
        component: () =>
          import(
            /* webpackChunkName: "agent" */ "@/views/AgentAssistantConfig.vue"
          ),
      },
      {
        path: "agent-scores",
        name: "AgentScores",
        component: () =>
          import(/* webpackChunkName: "agent" */ "@/views/AgentScores.vue"),
      },

      // 工具和配置（共享 chunk）
      {
        path: "toolbox-manager",
        name: "ToolboxManager",
        component: () =>
          import(/* webpackChunkName: "tools" */ "@/views/ToolboxManager.vue"),
      },
      {
        path: "tvs-files-editor",
        name: "TvsFilesEditor",
        component: () =>
          import(/* webpackChunkName: "tools" */ "@/views/TvsFilesEditor.vue"),
      },
      {
        path: "tool-list-editor",
        name: "ToolListEditor",
        component: () =>
          import(
            /* webpackChunkName: "editors" */ "@/views/ToolListEditor.vue"
          ),
      },
      {
        path: "preprocessor-order-manager",
        name: "PreprocessorOrderManager",
        component: () =>
          import(
            /* webpackChunkName: "tools" */ "@/views/PreprocessorOrderManager.vue"
          ),
      },
      {
        path: "tool-approval-manager",
        name: "ToolApprovalManager",
        component: () =>
          import(
            /* webpackChunkName: "tools" */ "@/views/ToolApprovalManager.vue"
          ),
      },

      // RAG 和思维链（共享 chunk）
      {
        path: "thinking-chains-editor",
        name: "ThinkingChainsEditor",
        component: () =>
          import(
            /* webpackChunkName: "rag" */ "@/views/ThinkingChainsEditor.vue"
          ),
      },
      {
        path: "rag-tuning",
        name: "RagTuning",
        component: () =>
          import(/* webpackChunkName: "rag" */ "@/views/RagTuning.vue"),
      },

      // 其他页面（共享 chunk）
      {
        path: "schedule-manager",
        name: "ScheduleManager",
        component: () =>
          import(
            /* webpackChunkName: "others" */ "@/views/ScheduleManager.vue"
          ),
      },
      {
        path: "dream-manager",
        name: "DreamManager",
        component: () =>
          import(/* webpackChunkName: "others" */ "@/views/DreamManager.vue"),
      },
      {
        path: "server-log-viewer",
        name: "ServerLogViewer",
        component: () =>
          import(
            /* webpackChunkName: "others" */ "@/views/ServerLogViewer.vue"
          ),
      },
      {
        path: "placeholder-viewer",
        name: "PlaceholderViewer",
        component: () =>
          import(
            /* webpackChunkName: "others" */ "@/views/PlaceholderViewer.vue"
          ),
      },
      {
        path: ROUTES.PLUGIN_CONFIG.replace(/^\//, ""),
        name: "PluginConfig",
        component: () =>
          import(/* webpackChunkName: "plugin" */ "@/views/PluginConfig.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(ROUTES.BASE),
  routes,
});

function isPublicRoute(to: {
  name?: string | symbol | null;
  meta: Record<string, unknown>;
}): boolean {
  return to.meta.requiresAuth === false || to.name === "Login";
}

function normalizeRedirectPath(target?: string | null): string {
  if (!target || !target.startsWith("/")) {
    return ROUTES.DASHBOARD;
  }

  const resolved = router.resolve(target);
  if (!resolved.matched.length || resolved.name === "Login") {
    return ROUTES.DASHBOARD;
  }

  return resolved.fullPath.startsWith("/")
    ? resolved.fullPath
    : ROUTES.DASHBOARD;
}

function getSafeRedirectTarget(to: { fullPath: string }): string {
  return normalizeRedirectPath(to.fullPath);
}

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  try {
    if (isPublicRoute(to)) {
      // 已登录用户访问登录页时跳转到目标页或首页
      if (to.name === "Login") {
        const isAuthenticated =
          authStore.isAuthenticated || (await authStore.checkAuth());
        if (isAuthenticated) {
          const redirect = normalizeRedirectPath(
            typeof to.query.redirect === "string" ? to.query.redirect : null
          );
          next(redirect);
          return;
        }
      }

      next();
      return;
    }

    const isAuthenticated =
      authStore.isAuthenticated || (await authStore.checkAuth());
    if (!isAuthenticated) {
      next({
        name: "Login",
        query: {
          redirect: getSafeRedirectTarget(to),
        },
      });
      return;
    }

    next();
  } catch (error) {
    logger.error("Navigation guard error:", error);

    // 异常时允许公开页继续访问，受保护页回退到登录页
    if (isPublicRoute(to)) {
      next();
      return;
    }

    next({
      name: "Login",
      query: {
        redirect: getSafeRedirectTarget(to),
      },
    });
  }
});

export default router;
