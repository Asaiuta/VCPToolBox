import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { pluginApi } from "@/api";
import { useAppStore } from "@/stores/app";
import { showMessage } from "@/utils";
import { createLogger } from "@/utils/logger";

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

  // 下拉菜单状态
  const isSystemMenuOpen = ref(false);
  const isUserMenuOpen = ref(false);
  const hasNotifications = ref(false);

  // 返回顶部
  const showBackToTop = ref(false);
  const contentRef = ref<HTMLElement | null>(null);
  let originalBodyOverflow = "";

  const currentPageTitle = computed(() => {
    const pathTarget =
      route.path.replace(/^\//, "").split("/")[0] || "dashboard";
    const navMatch = appStore.navItems.find(
      (item) => item.target === pathTarget && item.label
    );

    if (navMatch?.label) {
      return navMatch.label;
    }

    if (route.name === "PluginConfig") {
      const pluginName = String(route.params.pluginName || "");
      const pluginNav = appStore.navItems.find(
        (item) => item.pluginName === pluginName && item.label
      );
      return pluginNav?.label || `${pluginName} 插件配置`;
    }

    return "控制台";
  });

  function navigateTo(target: string, pluginName?: string) {
    if (pluginName) {
      router.push({ name: "PluginConfig", params: { pluginName } });
    } else {
      router.push({ path: `/${target}` });
    }
    closeMobileMenu();
    closeAllMenus();
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

  function enterImmersiveMode() {
    isImmersiveMode.value = true;
    document.documentElement.classList.add("ui-hidden-immersive");
    document.body.style.overflow = "hidden";
  }

  function exitImmersiveMode() {
    isImmersiveMode.value = false;
    document.documentElement.classList.remove("ui-hidden-immersive");
    document.body.style.overflow = originalBodyOverflow;
  }

  function scrollToTop() {
    if (contentRef.value) {
      contentRef.value.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleScroll() {
    showBackToTop.value = (contentRef.value?.scrollTop || 0) > 300;
  }

  let logoClickCount = 0;
  let logoClickTimer: number | null = null;

  function handleLogoClick() {
    logoClickCount++;
    if (logoClickCount === 1) {
      logoClickTimer = window.setTimeout(() => {
        logoClickCount = 0;
        if (logoClickTimer) {
          logoClickTimer = null;
        }
      }, 3000);
    } else if (logoClickCount >= 5) {
      enterImmersiveMode();
      logoClickCount = 0;
      if (logoClickTimer) {
        clearTimeout(logoClickTimer);
        logoClickTimer = null;
      }
    }
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest(".dropdown")) {
      closeAllMenus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      const searchInput = document.getElementById(
        "sidebar-search"
      ) as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }

    if (event.key === "Escape") {
      if (isImmersiveMode.value) {
        exitImmersiveMode();
      }
      closeAllMenus();
      closeMobileMenu();
    }
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

  watch(
    () => route.fullPath,
    () => {
      closeMobileMenu();
      closeAllMenus();
      if (contentRef.value) {
        contentRef.value.scrollTop = 0;
      }
    }
  );

  onMounted(async () => {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);

    await nextTick();
    if (contentRef.value) {
      contentRef.value.addEventListener("scroll", handleScroll, {
        passive: true,
      });
    }

    const brandElement = document.querySelector(".brand");
    if (brandElement) {
      brandElement.addEventListener("click", handleLogoClick);
    }

    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    await loadPluginNavigation();
  });

  onUnmounted(() => {
    if (contentRef.value) {
      contentRef.value.removeEventListener("scroll", handleScroll);
    }
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeydown);
    document.body.style.overflow = originalBodyOverflow;

    const brandElement = document.querySelector(".brand");
    if (brandElement) {
      brandElement.removeEventListener("click", handleLogoClick);
    }

    if (logoClickTimer) {
      clearTimeout(logoClickTimer);
    }
  });

  return {
    isMobileMenuOpen,
    isImmersiveMode,
    isSidebarCollapsed,
    isHoveringSidebar,
    isHoverEnabled,
    isSystemMenuOpen,
    isUserMenuOpen,
    hasNotifications,
    showBackToTop,
    contentRef,
    currentPageTitle,
    navigateTo,
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
