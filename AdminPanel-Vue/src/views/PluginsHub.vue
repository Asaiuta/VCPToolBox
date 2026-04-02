<template>
  <section class="plugins-hub">
    <section class="hub-hero card">
      <div class="hero-copy">
        <span class="hero-eyebrow">Plugin Center</span>
        <h2>把 79+ 插件从侧边栏解放出来</h2>
        <p>
          侧边栏现在只保留稳定导航和快捷入口，完整插件清单统一在这里管理。
          常用插件可以固定到侧栏，低频插件通过搜索和筛选快速定位。
        </p>
      </div>

      <div class="hero-stats">
        <article class="stat-chip">
          <span class="stat-label">总数</span>
          <strong>{{ pluginSummary.total }}</strong>
        </article>
        <article class="stat-chip enabled">
          <span class="stat-label">已启用</span>
          <strong>{{ pluginSummary.enabled }}</strong>
        </article>
        <article class="stat-chip disabled">
          <span class="stat-label">已禁用</span>
          <strong>{{ pluginSummary.disabled }}</strong>
        </article>
        <article class="stat-chip">
          <span class="stat-label">已固定</span>
          <strong>{{ pluginSummary.pinned }}</strong>
        </article>
      </div>
    </section>

    <section class="card controls-card">
      <div class="controls-top">
        <label class="search-field">
          <span class="material-symbols-outlined">search</span>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="搜索插件名称、原始名或描述..."
            aria-label="搜索插件"
          />
        </label>

        <button
          type="button"
          class="btn-secondary refresh-button"
          :disabled="isRefreshing"
          @click="refreshPlugins()"
        >
          <span class="material-symbols-outlined">refresh</span>
          <span>{{ isRefreshing ? "刷新中..." : "刷新列表" }}</span>
        </button>
      </div>

      <div class="filter-row" role="tablist" aria-label="插件筛选">
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          type="button"
          class="filter-pill"
          :class="{ active: activeFilter === filter.value }"
          @click="activeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </section>

    <section
      v-if="pinnedPlugins.length > 0 || recentPluginVisits.length > 0"
      class="quick-grid"
    >
      <article v-if="pinnedPlugins.length > 0" class="card quick-card">
        <div class="card-header quick-card-header">
          <h3 class="card-title">
            <span class="material-symbols-outlined">keep</span>
            <span>侧栏固定插件</span>
          </h3>
        </div>

        <div class="quick-list">
          <button
            v-for="plugin in pinnedPlugins"
            :key="plugin.manifest.name"
            type="button"
            class="quick-link"
            @click="openPluginConfig(plugin.manifest.name)"
          >
            <span class="material-symbols-outlined">{{
              plugin.manifest.icon || "extension"
            }}</span>
            <span>{{ getPluginDisplayName(plugin.manifest.name) }}</span>
          </button>
        </div>
      </article>

      <article v-if="recentPluginVisits.length > 0" class="card quick-card">
        <div class="card-header quick-card-header">
          <h3 class="card-title">
            <span class="material-symbols-outlined">history</span>
            <span>最近访问插件</span>
          </h3>
        </div>

        <div class="quick-list">
          <button
            v-for="item in recentPluginVisits"
            :key="item.pluginName"
            type="button"
            class="quick-link"
            @click="openPluginConfig(item.pluginName)"
          >
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </article>
    </section>

    <section class="results-header">
      <div>
        <h3>插件列表</h3>
        <p>共展示 {{ visiblePlugins.length }} 个结果</p>
      </div>
    </section>

    <section v-if="visiblePlugins.length === 0" class="card empty-state">
      <span class="material-symbols-outlined">search_off</span>
      <h3>没有匹配的插件</h3>
      <p>试试切换筛选条件，或者搜索插件原始名称。</p>
    </section>

    <section v-else class="plugin-grid">
      <article
        v-for="plugin in visiblePlugins"
        :key="plugin.manifest.name"
        class="plugin-card"
      >
        <div class="plugin-card-top">
          <div class="plugin-identity">
            <div class="plugin-icon-shell">
              <span class="material-symbols-outlined">{{
                plugin.manifest.icon || "extension"
              }}</span>
            </div>

            <div class="plugin-heading">
              <div class="plugin-title-row">
                <h3>{{ getPluginDisplayName(plugin.manifest.name) }}</h3>
                <span
                  class="status-badge"
                  :class="plugin.enabled ? 'status-enabled' : 'status-disabled'"
                >
                  {{ plugin.enabled ? "启用中" : "已禁用" }}
                </span>
                <span v-if="plugin.isDistributed" class="status-badge status-neutral">
                  分布式
                </span>
                <span
                  v-if="isPluginPinned(plugin.manifest.name)"
                  class="status-badge status-pinned"
                >
                  已固定
                </span>
              </div>
              <p class="plugin-original-name">{{ plugin.manifest.name }}</p>
            </div>
          </div>

          <button
            type="button"
            class="pin-toggle"
            :class="{ 'is-active': isPluginPinned(plugin.manifest.name) }"
            :title="isPluginPinned(plugin.manifest.name) ? '取消固定' : '固定到侧栏'"
            :aria-label="
              isPluginPinned(plugin.manifest.name) ? '取消固定到侧栏' : '固定到侧栏'
            "
            :aria-pressed="isPluginPinned(plugin.manifest.name)"
            @click="togglePinned(plugin.manifest.name)"
          >
            <span class="material-symbols-outlined">
              {{ isPluginPinned(plugin.manifest.name) ? "keep" : "keep_off" }}
            </span>
          </button>
        </div>

        <div class="plugin-card-main">
          <p
            class="plugin-description"
            :title="getPluginDescription(plugin.manifest.name) || '该插件暂未提供描述信息。'"
          >
            {{ getPluginSummary(plugin.manifest.name) }}
          </p>

          <div class="plugin-meta">
            <span>版本 {{ plugin.manifest.version || "未标注" }}</span>
            <span>{{ plugin.enabled ? "可直接配置" : "可先查看配置再决定启用" }}</span>
          </div>

          <div class="plugin-actions">
            <button
              type="button"
              class="btn-primary"
              @click="openPluginConfig(plugin.manifest.name)"
            >
              <span class="material-symbols-outlined">open_in_new</span>
              <span>打开配置</span>
            </button>

            <button
              type="button"
              :class="plugin.enabled ? 'btn-danger' : 'btn-secondary'"
              :disabled="isPluginPending(plugin.manifest.name)"
              @click="togglePlugin(plugin)"
            >
              <span class="material-symbols-outlined">
                {{ plugin.enabled ? "power_settings_new" : "bolt" }}
              </span>
              <span>{{
                isPluginPending(plugin.manifest.name)
                  ? "处理中..."
                  : plugin.enabled
                    ? "禁用插件"
                    : "启用插件"
              }}</span>
            </button>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { pluginApi } from "@/api";
import {
  recordNavigationVisit,
  useNavigationUsage,
  useRecentVisits,
} from "@/composables/useRecentVisits";
import type { RecentVisit } from "@/composables/useRecentVisits";
import { useAppStore } from "@/stores/app";
import { showMessage } from "@/utils";
import type { PluginInfo } from "@/types/api.plugin";

type PluginFilter = "all" | "enabled" | "disabled" | "pinned" | "distributed";

const router = useRouter();
const appStore = useAppStore();

const searchQuery = ref("");
const activeFilter = ref<PluginFilter>("all");
const isRefreshing = ref(false);
const pendingPluginNames = ref<string[]>([]);
const recentVisits = useRecentVisits();
const navigationUsage = useNavigationUsage();

const plugins = computed(() => appStore.plugins);
const pinnedPlugins = computed(() => appStore.pinnedPlugins);
const pluginsLoaded = computed(() => appStore.pluginsLoaded);

const filterOptions: Array<{ value: PluginFilter; label: string }> = [
  { value: "all", label: "全部" },
  { value: "enabled", label: "已启用" },
  { value: "disabled", label: "已禁用" },
  { value: "pinned", label: "已固定" },
  { value: "distributed", label: "分布式" },
];
const PLUGIN_DESCRIPTION_MAX_LENGTH = 96;

const pluginSummary = computed(() => ({
  total: plugins.value.length,
  enabled: plugins.value.filter((plugin) => plugin.enabled).length,
  disabled: plugins.value.filter((plugin) => !plugin.enabled).length,
  pinned: pinnedPlugins.value.length,
}));

const recentPluginVisits = computed(() => {
  const seen = new Set<string>();

  return recentVisits.value
    .filter((item): item is RecentVisit & { pluginName: string } =>
      Boolean(item.pluginName)
    )
    .filter((item) => {
      if (seen.has(item.pluginName)) {
        return false;
      }
      seen.add(item.pluginName);
      return Boolean(appStore.getPluginByName(item.pluginName));
    })
    .slice(0, 6)
    .map((item) => ({
      pluginName: item.pluginName,
      label: appStore.getPluginDisplayName(item.pluginName),
      icon: appStore.getPluginIcon(item.pluginName),
    }));
});

const visiblePlugins = computed(() => {
  const normalizedQuery = searchQuery.value.trim().toLowerCase();

  return [...plugins.value]
    .filter((plugin) => matchesPlugin(plugin, normalizedQuery))
    .filter((plugin) => matchesFilter(plugin, activeFilter.value))
    .sort(comparePlugins);
});

function matchesPlugin(plugin: PluginInfo, normalizedQuery: string): boolean {
  if (!normalizedQuery) {
    return true;
  }

  const pluginName = plugin.manifest.name.toLowerCase();
  const displayName = getPluginDisplayName(plugin.manifest.name).toLowerCase();
  const description = getPluginDescription(plugin.manifest.name).toLowerCase();

  return (
    pluginName.includes(normalizedQuery) ||
    displayName.includes(normalizedQuery) ||
    description.includes(normalizedQuery)
  );
}

function matchesFilter(plugin: PluginInfo, filter: PluginFilter): boolean {
  switch (filter) {
    case "enabled":
      return plugin.enabled;
    case "disabled":
      return !plugin.enabled;
    case "pinned":
      return isPluginPinned(plugin.manifest.name);
    case "distributed":
      return Boolean(plugin.isDistributed);
    case "all":
    default:
      return true;
  }
}

function comparePlugins(a: PluginInfo, b: PluginInfo): number {
  const pinDelta =
    Number(isPluginPinned(b.manifest.name)) -
    Number(isPluginPinned(a.manifest.name));
  if (pinDelta !== 0) {
    return pinDelta;
  }

  const enabledDelta = Number(b.enabled) - Number(a.enabled);
  if (enabledDelta !== 0) {
    return enabledDelta;
  }

  return getPluginDisplayName(a.manifest.name).localeCompare(
    getPluginDisplayName(b.manifest.name),
    "zh-CN",
    { sensitivity: "base" }
  );
}

function getPluginDisplayName(pluginName: string): string {
  return appStore.getPluginDisplayName(pluginName);
}

function getPluginDescription(pluginName: string): string {
  return appStore.getPluginDescription(pluginName);
}

function getPluginSummary(pluginName: string): string {
  const description = getPluginDescription(pluginName).replace(/\s+/g, " ").trim();
  if (!description) {
    return "该插件暂未提供描述信息。";
  }

  const graphemes = Array.from(description);
  if (graphemes.length <= PLUGIN_DESCRIPTION_MAX_LENGTH) {
    return description;
  }

  return `${graphemes
    .slice(0, PLUGIN_DESCRIPTION_MAX_LENGTH)
    .join("")
    .trimEnd()}…`;
}

function isPluginPinned(pluginName: string): boolean {
  return appStore.isPluginPinned(pluginName);
}

function isPluginPending(pluginName: string): boolean {
  return pendingPluginNames.value.includes(pluginName);
}

function recordPluginVisit(pluginName: string) {
  const nextNavigationState = recordNavigationVisit({
    target: `plugin-${pluginName}-config`,
    navItems: appStore.navItems,
    plugins: appStore.plugins,
    recentVisits: recentVisits.value,
    navigationUsage: navigationUsage.value,
    pluginName,
  });
  recentVisits.value = nextNavigationState.recentVisits;
  navigationUsage.value = nextNavigationState.navigationUsage;
}

function openPluginConfig(pluginName: string) {
  recordPluginVisit(pluginName);
  router.push({ name: "PluginConfig", params: { pluginName } });
}

function togglePinned(pluginName: string) {
  const willPin = !isPluginPinned(pluginName);
  appStore.togglePinnedPlugin(pluginName);
  showMessage(
    willPin ? "已固定到侧栏快捷区。" : "已从侧栏快捷区移除。",
    "success"
  );
}

async function refreshPlugins(showSuccessMessage = true) {
  isRefreshing.value = true;

  try {
    const nextPlugins = await pluginApi.getPlugins(false);
    appStore.loadPlugins(nextPlugins);
    if (showSuccessMessage) {
      showMessage("插件列表已刷新。", "success");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showMessage(`刷新插件列表失败：${message}`, "error");
  } finally {
    isRefreshing.value = false;
  }
}

async function togglePlugin(plugin: PluginInfo) {
  const pluginName = plugin.manifest.name;
  const enable = !plugin.enabled;
  const action = enable ? "启用" : "禁用";

  if (
    !confirm(`确定要${action}插件 "${getPluginDisplayName(pluginName)}" 吗？`)
  ) {
    return;
  }

  pendingPluginNames.value = [...pendingPluginNames.value, pluginName];

  try {
    const result = await pluginApi.togglePlugin(pluginName, enable, false);
    showMessage(result.message || `${action}插件成功。`, "success");
    await refreshPlugins(false);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showMessage(`${action}插件失败：${message}`, "error");
  } finally {
    pendingPluginNames.value = pendingPluginNames.value.filter(
      (item) => item !== pluginName
    );
  }
}

onMounted(async () => {
  if (!pluginsLoaded.value || plugins.value.length === 0) {
    await refreshPlugins(false);
  }
});
</script>

<style scoped>
.plugins-hub {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hub-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  gap: 20px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.22), transparent 40%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.03), transparent 55%);
}

.hero-copy h2 {
  font-size: 1.6rem;
  line-height: 1.2;
  margin-bottom: 12px;
}

.hero-copy p {
  max-width: 56ch;
  color: var(--secondary-text);
}

.hero-eyebrow {
  display: inline-flex;
  margin-bottom: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--button-bg) 16%, transparent);
  color: var(--highlight-text);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
}

.stat-chip strong {
  font-size: 1.5rem;
}

.stat-chip.enabled strong {
  color: var(--success-color);
}

.stat-chip.disabled strong {
  color: var(--danger-color);
}

.stat-label {
  color: var(--secondary-text);
  font-size: 0.82rem;
}

.controls-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.controls-top {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-field {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--input-bg);
}

.search-field .material-symbols-outlined {
  color: var(--secondary-text);
}

.search-field input {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 14px 0;
}

.search-field input:focus {
  outline: none;
}

.refresh-button {
  white-space: nowrap;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-pill {
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: transparent;
  color: var(--secondary-text);
  padding: 8px 14px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.filter-pill:hover,
.filter-pill.active {
  background: var(--accent-bg);
  color: var(--primary-text);
  border-color: color-mix(in srgb, var(--button-bg) 36%, transparent);
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.quick-card-header {
  margin-bottom: 16px;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--primary-text);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.quick-link:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--button-bg) 36%, transparent);
  background: var(--accent-bg);
}

.results-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
}

.results-header h3 {
  font-size: 1.1rem;
}

.results-header p {
  color: var(--secondary-text);
  margin-top: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
}

.empty-state .material-symbols-outlined {
  font-size: 38px;
  color: var(--secondary-text);
}

.plugin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.plugin-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 20px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent),
    var(--secondary-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--shadow-md);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.plugin-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: color-mix(in srgb, var(--button-bg) 28%, var(--border-color));
}

.plugin-card-top {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.plugin-identity {
  display: flex;
  gap: 14px;
  min-width: 0;
}

.plugin-icon-shell {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: color-mix(in srgb, var(--button-bg) 18%, transparent);
  color: var(--highlight-text);
  flex-shrink: 0;
}

.plugin-heading {
  flex: 1;
  min-width: 0;
}

.plugin-title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.plugin-title-row h3 {
  font-size: 1.02rem;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.plugin-original-name {
  margin-top: 6px;
  color: var(--secondary-text);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  border: 1px solid transparent;
}

.status-enabled {
  color: var(--success-color);
  background: color-mix(in srgb, var(--success-color) 14%, transparent);
}

.status-disabled {
  color: var(--danger-color);
  background: color-mix(in srgb, var(--danger-color) 14%, transparent);
}

.status-neutral {
  color: var(--secondary-text);
  background: rgba(255, 255, 255, 0.06);
}

.status-pinned {
  color: var(--highlight-text);
  background: color-mix(in srgb, var(--button-bg) 16%, transparent);
}

.pin-toggle {
  display: inline-grid;
  place-items: center;
  align-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: transparent;
  color: var(--secondary-text);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.pin-toggle:hover {
  color: var(--primary-text);
  border-color: color-mix(in srgb, var(--button-bg) 30%, transparent);
  background: color-mix(in srgb, var(--button-bg) 10%, transparent);
  transform: translateY(-1px);
}

.pin-toggle.is-active {
  color: var(--highlight-text);
  border-color: color-mix(in srgb, var(--button-bg) 38%, transparent);
  background: color-mix(in srgb, var(--button-bg) 14%, transparent);
}

.plugin-card-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.plugin-description {
  color: var(--secondary-text);
  line-height: 1.55;
  min-height: calc(1.55em * 3);
  max-height: calc(1.55em * 3);
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  margin-bottom: 14px;
}

.plugin-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  color: var(--secondary-text);
  font-size: 0.84rem;
}

.plugin-meta span {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
}

.plugin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 4px;
}

@media (max-width: 1024px) {
  .hub-hero,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .controls-top {
    flex-direction: column;
    align-items: stretch;
  }

  .refresh-button {
    justify-content: center;
  }

  .plugin-grid {
    grid-template-columns: 1fr;
  }

  .plugin-card-top {
    flex-direction: column;
  }

  .pin-toggle {
    align-self: flex-start;
  }
}

@media (max-width: 480px) {
  .hub-hero {
    gap: 16px;
  }

  .hero-copy h2 {
    font-size: 1.34rem;
  }

  .hero-stats {
    grid-template-columns: 1fr 1fr;
  }

  .plugin-card {
    padding: 16px;
  }

  .plugin-actions {
    flex-direction: column;
  }

  .plugin-actions :deep(button) {
    width: 100%;
    justify-content: center;
  }
}
</style>
