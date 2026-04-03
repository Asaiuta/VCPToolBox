import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { pluginApi } from "@/api";
import { useMainLayoutShellEffects } from "@/app/shell/useMainLayoutShellEffects";
import {
  recordNavigationVisit,
  useNavigationUsage,
  useRecentVisits,
} from "@/composables/useRecentVisits";
import { useAppStore } from "@/stores/app";
import { navigateByTarget } from "@/app/routes/navigation";
import { showMessage } from "@/utils";
import { createLogger } from "@/utils/logger";
import { resolveRouteTitle } from "@/utils/navigation";

const logger = createLogger("MainLayout");

export function useMainLayoutState() {
  const router = useRouter();
  const route = useRoute();
  const appStore = useAppStore();

  // 侧边栏状态
  const isMobileMenuOpen = ref(false);
  const isImmersiveMode = ref(false);
  const isSidebarCollapsed = ref(false);
  const isHoveringSidebar = ref(false);
  const isHoverEnabled = ref(false);
  const isCommandPaletteOpen = ref(false);

  // 下拉菜单状态
  const isSystemMenuOpen = ref(false);
  const isUserMenuOpen = ref(false);
  const hasNotifications = ref(false);

  // 返回顶部
  const showBackToTop = ref(false);
  const contentRef = ref<HTMLElement | null>(null);
  const recentVisits = useRecentVisits();
  const navigationUsage = useNavigationUsage();

  const currentPageTitle = computed(() =>
    resolveRouteTitle(route, appStore.navItems, appStore.plugins)
  );

  function navigateTo(target: string, pluginName?: string) {
    const nextNavigationState = recordNavigationVisit({
      target,
      navItems: appStore.navItems,
      plugins: appStore.plugins,
      recentVisits: recentVisits.value,
      navigationUsage: navigationUsage.value,
      pluginName,
    });
    recentVisits.value = nextNavigationState.recentVisits;
    navigationUsage.value = nextNavigationState.navigationUsage;

    navigateByTarget(router, target, pluginName);
    closeCommandPalette();
    closeMobileMenu();
    closeAllMenus();
  }

  function openCommandPalette() {
    isCommandPaletteOpen.value = true;
    closeMobileMenu();
    closeAllMenus();
  }

  function closeCommandPalette() {
    isCommandPaletteOpen.value = false;
  }

  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value;
  }

  function closeMobileMenu() {
    isMobileMenuOpen.value = false;
  }

  function toggleSidebarCollapse() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    if (!isSidebarCollapsed.value) {
      isHoverEnabled.value = false;
    }
  }

  function toggleSystemMenu() {
    isSystemMenuOpen.value = !isSystemMenuOpen.value;
    isUserMenuOpen.value = false;
  }

  function toggleUserMenu() {
    isUserMenuOpen.value = !isUserMenuOpen.value;
    isSystemMenuOpen.value = false;
  }

  function closeAllMenus() {
    isSystemMenuOpen.value = false;
    isUserMenuOpen.value = false;
  }

  function scrollToTop() {
    if (contentRef.value) {
      contentRef.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleScroll() {
    showBackToTop.value = (contentRef.value?.scrollTop || 0) > 300;
  }

  async function loadPluginNavigation() {
    try {
      const plugins = await pluginApi.getPlugins(false);
      appStore.loadPlugins(plugins);
    } catch (error) {
      appStore.markPluginsLoaded();
      logger.error("Failed to load plugin navigation:", error);
      showMessage("插件列表加载失败，已使用默认导航。", "warning");
    }
  }

  const shellEffects = useMainLayoutShellEffects({
    contentRef,
    isImmersiveMode,
    isCommandPaletteOpen,
    getRouteFullPath: () => route.fullPath,
    onOpenCommandPalette: openCommandPalette,
    onCloseCommandPalette: closeCommandPalette,
    onCloseMobileMenu: closeMobileMenu,
    onCloseAllMenus: closeAllMenus,
    onRouteChanged: () => {
      closeCommandPalette();
      closeMobileMenu();
      closeAllMenus();
    },
    onEnterImmersiveMode: enterImmersiveMode,
    onExitImmersiveMode: exitImmersiveMode,
    onScroll: handleScroll,
    onLoadPluginNavigation: loadPluginNavigation,
  });

  function enterImmersiveMode() {
    isImmersiveMode.value = true;
    shellEffects.activateImmersiveDomState();
  }

  function exitImmersiveMode() {
    isImmersiveMode.value = false;
    shellEffects.deactivateImmersiveDomState();
  }

  return {
    isMobileMenuOpen,
    isImmersiveMode,
    isSidebarCollapsed,
    isHoveringSidebar,
    isHoverEnabled,
    isCommandPaletteOpen,
    isSystemMenuOpen,
    isUserMenuOpen,
    hasNotifications,
    showBackToTop,
    contentRef,
    recentVisits,
    navigationUsage,
    currentPageTitle,
    navigateTo,
    openCommandPalette,
    closeCommandPalette,
    toggleMobileMenu,
    closeMobileMenu,
    toggleSidebarCollapse,
    toggleSystemMenu,
    toggleUserMenu,
    closeAllMenus,
    exitImmersiveMode,
    scrollToTop,
  };
}
