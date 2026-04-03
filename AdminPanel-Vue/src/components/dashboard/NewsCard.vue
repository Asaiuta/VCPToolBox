<template>
  <div class="dashboard-card-shell dashboard-card-shell--rose news-card">
    <div class="news-header">
      <h3 class="dashboard-card-title">滚动新闻</h3>
      <div class="source-filter">
        <select
          v-model="selectedSource"
          class="source-select"
          aria-label="筛选新闻来源"
        >
          <option :value="null">全部来源</option>
          <option v-for="source in availableSources" :key="source" :value="source">
            {{ source }}
          </option>
        </select>
        <button
          v-if="selectedSource"
          type="button"
          class="clear-filter-btn"
          @click="selectedSource = null"
          aria-label="清除筛选"
        >
          ✕
        </button>
      </div>
    </div>
    <div class="news-container">
      <div class="news-scroller" :style="{ animationDuration }">
        <div v-if="filteredItems.length === 0" class="dashboard-card-empty empty-state">
          {{ items.length === 0 ? '正在加载实时热点...' : '该来源暂无新闻' }}
        </div>
        <template v-else>
          <component
            :is="entry.item.url ? 'a' : 'div'"
            v-for="entry in duplicatedFilteredItems"
            :key="`${getStableItemId(entry.item)}-${entry.cycle}`"
            :href="entry.item.url || undefined"
            :target="entry.item.url ? '_blank' : undefined"
            :rel="entry.item.url ? 'noopener noreferrer' : undefined"
            class="dashboard-card-panel news-item"
            :class="{ 'news-item-disabled': !entry.item.url }"
            :role="entry.item.url ? undefined : 'note'"
            :aria-label="entry.item.url ? undefined : '该新闻链接不可用'"
          >
            <span class="news-source">{{ entry.item.source }}</span>
            <span class="news-title">{{ entry.item.title }}</span>
          </component>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

interface NewsItem {
  title: string;
  url?: string | null;
  source: string;
}

const props = defineProps<{
  items: NewsItem[];
}>();

// 选中的来源筛选
const selectedSource = ref<string | null>(null);

// 获取所有可用来源
const availableSources = computed(() => {
  const sources = new Set(props.items.map(item => item.source));
  return Array.from(sources).sort();
});

// 根据来源筛选的新闻
const filteredItems = computed(() => {
  if (!selectedSource.value) {
    return props.items;
  }
  return props.items.filter(item => item.source === selectedSource.value);
});

// 用于无限滚动的重复列表
const duplicatedFilteredItems = computed(() => [
  ...filteredItems.value.map((item) => ({ item, cycle: 0 as const })),
  ...filteredItems.value.map((item) => ({ item, cycle: 1 as const })),
]);

// 加快滚动速度：从 4s 改为 2s
const animationDuration = computed(() => `${Math.max(filteredItems.value.length, 1) * 2}s`);

// 生成稳定的 key，使用 URL 的 hash 作为唯一标识
function getStableItemId(item: NewsItem): string {
  if (item.url) {
    return `url-${item.url}`;
  }

  return `note-${item.source}-${item.title.slice(0, 20)}`;
}
</script>

<style scoped>
@import "./dashboard-card.css";

/* 统一 Container Query 断点系统 */
/* 断点：768px (桌面), 520px (平板), 420px (小屏), 360px (大屏手机), 280px (小屏手机) */

.news-card {
  min-height: 0;
}

.news-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.news-header .dashboard-card-title {
  margin-bottom: 0;
}

.source-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-select {
  padding: 6px 28px 6px 12px;
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  background: rgba(249, 115, 22, 0.08);
  color: var(--primary-text);
  font-size: 0.85em;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23fb923c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: all 0.2s ease;
}

.source-select:hover {
  background-color: rgba(249, 115, 22, 0.15);
  border-color: rgba(249, 115, 22, 0.5);
}

.source-select:focus {
  outline: none;
  border-color: rgba(249, 115, 22, 0.6);
  box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.2);
}

.source-select option {
  background: var(--secondary-bg);
  color: var(--primary-text);
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 6px;
  background: rgba(249, 115, 22, 0.08);
  color: #fb923c;
  font-size: 0.85em;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-filter-btn:hover {
  background: rgba(249, 115, 22, 0.2);
  border-color: rgba(249, 115, 22, 0.5);
}

.news-container {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    black 5%,
    black 95%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent,
    black 5%,
    black 95%,
    transparent
  );
}

.news-scroller {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  gap: 10px;
  animation: scroll-news linear infinite;
}

.news-container:hover .news-scroller {
  animation-play-state: paused;
}

@keyframes scroll-news {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(calc(-50% - 5px));
  }
}

.news-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  min-height: 78px;
  padding: 14px 16px;
  text-decoration: none;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast),
    box-shadow var(--transition-fast);
}

.news-item:hover {
  transform: translateX(6px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.news-item:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
}

.news-item-disabled {
  cursor: default;
  opacity: 0.75;
}

.news-item-disabled:hover {
  transform: none;
  box-shadow: none;
}

.news-source {
  display: inline-block;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: var(--radius-full, 999px);
  background: rgba(249, 115, 22, 0.14);
  font-size: 0.75em;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: #fb923c;
  opacity: 0.95;
}

.news-title {
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.96em;
  line-height: 1.55;
  font-weight: 500;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
  color: var(--primary-text);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.empty-state {
  opacity: 0.6;
  font-size: 0.9em;
}

/* 断点 1: ≥520px - 宽松布局 */
@container dashboard-card (min-width: 520px) {
  .news-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .source-select {
    min-width: 120px;
  }

  .news-scroller {
    gap: 12px;
  }

  .news-item {
    min-height: 92px;
    padding: 16px 18px;
  }

  .news-title {
    font-size: 1em;
    line-height: 1.6;
    -webkit-line-clamp: 4;
  }
}

/* 断点 2: ≤420px - 紧凑布局 */
@container dashboard-card (max-width: 420px) {
  .news-item {
    min-height: 64px;
    padding: 12px 14px;
  }

  .news-source {
    font-size: 0.7em;
  }

  .news-title {
    font-size: 0.9em;
    line-height: 1.45;
    -webkit-line-clamp: 2;
  }
}

/* 断点 3: ≤280px - 极简模式 */
@container dashboard-card (max-width: 280px) {
  .news-item {
    min-height: 56px;
    padding: 10px 12px;
  }

  .news-source {
    font-size: 0.68em;
  }

  .news-title {
    font-size: 0.86em;
    line-height: 1.4;
    -webkit-line-clamp: 2;
  }
}
</style>
