<template>
  <aside
    class="sidebar"
    :class="{
      'mobile-active': isMobileMenuOpen,
      collapsed: isSidebarCollapsed,
      hovering: isHoveringSidebar,
    }"
    @mouseenter="handleSidebarHover(true)"
    @mouseleave="handleSidebarHover(false)"
  >
    <SidebarSearch
      :is-expanded-state="isExpandedState"
      :is-sidebar-collapsed="isSidebarCollapsed"
      :is-hovering-sidebar="isHoveringSidebar"
      :search-query="searchQuery"
      @update:search-query="searchQuery = $event"
      @filterSidebar="filterSidebar"
    />

    <SidebarRecentVisits
      :recent-visits="recentVisits"
      :is-sidebar-collapsed="isSidebarCollapsed"
      :is-hovering-sidebar="isHoveringSidebar"
      :is-recent-visits-collapsed="isRecentVisitsCollapsed"
      @toggleRecent="toggleRecentVisits"
      @navigateTo="navigateTo"
    />

    <SidebarNavList
      :filtered-nav-items="filteredNavItems"
      :is-expanded-state="isExpandedState"
      :is-sidebar-collapsed="isSidebarCollapsed"
      :is-hovering-sidebar="isHoveringSidebar"
      :is-active-route="isActiveRoute"
      @navigateTo="navigateTo"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useLocalStorage } from "@/composables/useLocalStorage";
import SidebarSearch from "./sidebar/SidebarSearch.vue";
import SidebarRecentVisits from "./sidebar/SidebarRecentVisits.vue";
import SidebarNavList from "./sidebar/SidebarNavList.vue";

interface Props {
  isMobileMenuOpen: boolean;
  isSidebarCollapsed: boolean;
  isHoveringSidebar: boolean;
  isHoverEnabled: boolean;
}

const props = defineProps<Props>();

interface Emits {
  (e: "navigateTo", target: string, pluginName?: string): void;
  (e: "update:isHoveringSidebar", value: boolean): void;
}

const emit = defineEmits<Emits>();

const route = useRoute();
const appStore = useAppStore();

const navItems = computed(() => appStore.navItems);
const isExpandedState = computed(
  () => !props.isSidebarCollapsed || props.isHoveringSidebar
);
const searchQuery = ref("");
const filteredNavItems = ref(navItems.value);

// 使用 useLocalStorage 统一管理
const RECENT_VISITS_STORAGE_KEY = "sidebarRecentVisits";
type RecentVisit = {
  target: string;
  label: string;
  icon?: string;
  pluginName?: string;
};
const recentVisits = useLocalStorage<RecentVisit[]>(
  RECENT_VISITS_STORAGE_KEY,
  []
);
const isRecentVisitsCollapsed = useLocalStorage<boolean>(
  "sidebarRecentCollapsed",
  false
);

// 监听导航项变化，重新过滤
watch(
  navItems,
  () => {
    filterSidebar();
  },
  { immediate: true }
);

function filterSidebar() {
  const searchTerm = searchQuery.value.toLowerCase().trim();
  const items = navItems.value.filter((item) => {
    if (item.category) return true;
    return item.label?.toLowerCase().includes(searchTerm);
  });
  filteredNavItems.value = items;
}

function navigateTo(target: string | undefined, pluginName?: string) {
  if (!target) return;

  // 添加到最近访问（useLocalStorage 会自动持久化）
  const navItem = navItems.value.find((item) => item.target === target);
  if (navItem && navItem.label) {
    recentVisits.value = recentVisits.value.filter(
      (item) => item.target !== target
    );
    recentVisits.value.unshift({
      target,
      label: navItem.label,
      icon: navItem.icon,
      pluginName: navItem.pluginName,
    });
    recentVisits.value = recentVisits.value.slice(0, 5);
  }

  emit("navigateTo", target, pluginName);
}

function isActiveRoute(
  target: string | undefined,
  pluginName?: string
): boolean {
  if (!target) return false;
  if (pluginName) {
    return (
      route.name === "PluginConfig" &&
      String(route.params.pluginName || "") === pluginName
    );
  }
  const currentPath = route.path.replace("/AdminPanel", "");
  if (target === "dashboard") {
    return currentPath === "/" || currentPath === "/dashboard";
  }
  return currentPath === `/${target}`;
}

function handleSidebarHover(entering: boolean) {
  if (props.isHoverEnabled) {
    emit("update:isHoveringSidebar", entering);
  }
}

function toggleRecentVisits() {
  isRecentVisitsCollapsed.value = !isRecentVisitsCollapsed.value;
  // useLocalStorage 会自动持久化
}

// 暴露方法供父组件调用
defineExpose({
  filteredNavItems,
  recentVisits,
});
</script>

<style scoped>
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background-color: var(--secondary-bg);
  backdrop-filter: var(--glass-blur, blur(12px));
  -webkit-backdrop-filter: var(--glass-blur, blur(12px));
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.collapsed {
  width: 72px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    width: min(280px, calc(100vw - 20px));
    max-width: calc(100vw - 20px);
    transform: translateX(-100%);
    z-index: 999;
    box-shadow: 12px 0 30px rgba(0, 0, 0, 0.28);
  }

  .sidebar.mobile-active {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: min(280px, calc(100vw - 20px));
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: min(260px, calc(100vw - 16px));
    max-width: calc(100vw - 16px);
  }

  .sidebar.collapsed {
    width: min(260px, calc(100vw - 16px));
  }
}
</style>
