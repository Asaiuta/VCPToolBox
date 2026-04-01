<template>
  <!-- 视图切换 -->
  <div class="placeholder-view-mode">
    <button
      :class="['view-mode-btn', { active: viewMode === 'grouped' }]"
      @click="emit('update:viewMode', 'grouped')"
    >
      <span class="material-symbols-outlined">view_agenda</span>
      分组视图
    </button>
    <button
      :class="['view-mode-btn', { active: viewMode === 'list' }]"
      @click="emit('update:viewMode', 'list')"
    >
      <span class="material-symbols-outlined">view_list</span>
      列表视图
    </button>
  </div>

  <!-- 筛选器 -->
  <div class="placeholder-viewer-filters">
    <label for="placeholder-filter-type">快速跳转：</label>
    <select
      id="placeholder-filter-type"
      :value="selectedType"
      class="placeholder-filter-select"
      @change="
        emit('update:selectedType', ($event.target as HTMLSelectElement).value)
      "
    >
      <option value="">全部类型</option>
      <option
        v-for="option in typeOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }} ({{ option.count }})
      </option>
    </select>
    <label for="placeholder-filter-keyword">搜索：</label>
    <input
      type="text"
      id="placeholder-filter-keyword"
      :value="filterKeyword"
      class="placeholder-filter-input"
      placeholder="搜索占位符名称或预览…"
      @input="
        emit('update:filterKeyword', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<script setup lang="ts">
import type { PlaceholderTypeOption, PlaceholderViewMode } from "./types";

defineProps<{
  viewMode: PlaceholderViewMode;
  selectedType: string;
  filterKeyword: string;
  typeOptions: PlaceholderTypeOption[];
}>();

const emit = defineEmits<{
  "update:viewMode": [mode: PlaceholderViewMode];
  "update:selectedType": [value: string];
  "update:filterKeyword": [value: string];
}>();
</script>

<style scoped>
.placeholder-view-mode {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.view-mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--secondary-text);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.view-mode-btn:hover {
  background: var(--accent-bg);
  color: var(--primary-text);
}

.view-mode-btn.active {
  background: var(--button-bg);
  color: white;
  border-color: var(--button-bg);
}

.view-mode-btn .material-symbols-outlined {
  font-size: 18px !important;
}

.placeholder-viewer-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.placeholder-viewer-filters label {
  font-size: 14px;
  color: var(--secondary-text);
  font-weight: 500;
}

.placeholder-filter-select,
.placeholder-filter-input {
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
  min-width: 150px;
}
.placeholder-filter-input {
  flex: 1;
  min-width: 180px;
}

@media (max-width: 768px) {
  .placeholder-view-mode {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .view-mode-btn {
    justify-content: center;
    min-height: 40px;
    padding: 8px 10px;
  }

  .placeholder-viewer-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .placeholder-viewer-filters label {
    margin-bottom: 2px;
  }

  .placeholder-filter-select,
  .placeholder-filter-input {
    width: 100%;
    min-width: 0;
  }
}
</style>
