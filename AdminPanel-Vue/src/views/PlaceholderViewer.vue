<template>
  <section class="config-section active-section">
    <p class="description">
      当前可用的系统提示词占位符列表，按类型分类展示。点击「查看详情」可查看完整内容。
    </p>

    <PlaceholderFilterBar
      :view-mode="viewMode"
      :selected-type="selectedType"
      :filter-keyword="filterKeyword"
      :type-options="typeOptions"
      @update:viewMode="viewMode = $event"
      @update:selectedType="selectedType = $event"
      @update:filterKeyword="filterKeyword = $event"
    />

    <!-- 分组视图 -->
    <div v-if="viewMode === 'grouped'" class="placeholder-grouped-view">
      <div
        v-for="type in filteredTypes"
        :key="type"
        :id="`type-group-${type}`"
        class="placeholder-type-group"
      >
        <div class="type-group-header">
          <h3>
            <span class="material-symbols-outlined">folder</span>
            {{ getTypeLabel(type) }}
            <span class="type-count">{{
              groupedPlaceholders[type]?.length || 0
            }}</span>
          </h3>
        </div>
        <div class="type-group-content">
          <div
            v-for="placeholder in groupedPlaceholders[type]"
            :key="placeholder.name"
            class="placeholder-item card"
          >
            <div class="placeholder-header">
              <span class="placeholder-name" :title="placeholder.name">{{
                placeholder.name
              }}</span>
            </div>
            <div class="placeholder-preview" :title="placeholder.preview">
              {{ placeholder.preview }}
            </div>
            <div v-if="placeholder.description" class="placeholder-description">
              {{ placeholder.description }}
            </div>
            <div class="placeholder-footer">
              <span class="placeholder-charcount">
                {{
                  placeholder.charCount ? `${placeholder.charCount} 字符` : "—"
                }}
              </span>
              <button
                @click="openDetail(placeholder)"
                class="btn-secondary btn-sm"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="placeholder-list-view">
      <div
        v-for="placeholder in filteredPlaceholders"
        :key="placeholder.name"
        class="placeholder-item card"
      >
        <div class="placeholder-header">
          <span class="placeholder-name" :title="placeholder.name">{{
            placeholder.name
          }}</span>
          <span class="placeholder-type" :title="placeholder.type">
            {{ getTypeLabel(placeholder.type) }}
          </span>
        </div>
        <div class="placeholder-preview" :title="placeholder.preview">
          {{ placeholder.preview }}
        </div>
        <div v-if="placeholder.description" class="placeholder-description">
          {{ placeholder.description }}
        </div>
        <div class="placeholder-footer">
          <span class="placeholder-charcount">
            {{ placeholder.charCount ? `${placeholder.charCount} 字符` : "—" }}
          </span>
          <button @click="openDetail(placeholder)" class="btn-secondary btn-sm">
            查看详情
          </button>
        </div>
      </div>
    </div>

    <PlaceholderDetailModal
      :selected-placeholder="selectedPlaceholder"
      :active-tab="activeTab"
      :detail-content="detailContent"
      :rendered-markdown="renderedMarkdown"
      :get-type-label="getTypeLabel"
      @close="closeDetail"
      @update:activeTab="activeTab = $event"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import PlaceholderFilterBar from "./PlaceholderViewer/PlaceholderFilterBar.vue";
import PlaceholderDetailModal from "./PlaceholderViewer/PlaceholderDetailModal.vue";
import { usePlaceholderViewer } from "./PlaceholderViewer/usePlaceholderViewer";

const {
  viewMode,
  selectedType,
  filterKeyword,
  typeOptions,
  filteredTypes,
  groupedPlaceholders,
  filteredPlaceholders,
  selectedPlaceholder,
  activeTab,
  detailContent,
  renderedMarkdown,
  getTypeLabel,
  loadPlaceholders,
  openDetail,
  closeDetail,
} = usePlaceholderViewer();

onMounted(() => {
  loadPlaceholders();
});
</script>

<style scoped>
/* 分组视图 */
.placeholder-grouped-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.placeholder-type-group {
  background: var(--secondary-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.type-group-header {
  padding: 16px 20px;
  background: var(--tertiary-bg);
  border-bottom: 1px solid var(--border-color);
}

.type-group-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1em;
  color: var(--primary-text);
}

.type-group-header .material-symbols-outlined {
  font-size: 22px !important;
  color: var(--highlight-text);
}

.type-count {
  font-size: 0.85em;
  padding: 2px 10px;
  background: var(--button-bg);
  color: white;
  border-radius: 12px;
  font-weight: 600;
}

.type-group-content {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-items: stretch;
}

/* 列表视图 */
.placeholder-list-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-items: stretch;
}

/* 卡片样式 */
.placeholder-item {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 210px;
}

.placeholder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.placeholder-name {
  font-weight: 600;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 14px;
  color: var(--primary-text);
  word-break: break-all;
}

.placeholder-type {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--tertiary-bg);
  border-radius: 4px;
  color: var(--secondary-text);
  white-space: nowrap;
  flex-shrink: 0;
}

.placeholder-preview {
  font-size: 13px;
  color: var(--secondary-text);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

.placeholder-description {
  font-size: 13px;
  color: var(--secondary-text);
  padding: 8px;
  background: var(--tertiary-bg);
  border-radius: 6px;
  line-height: 1.5;
}

.placeholder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.placeholder-charcount {
  font-size: 12px;
  color: var(--secondary-text);
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .type-group-content {
    grid-template-columns: 1fr;
  }

  .placeholder-list-view {
    grid-template-columns: 1fr;
  }
}
</style>
