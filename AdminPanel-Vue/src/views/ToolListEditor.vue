<template>
  <section class="config-section active-section">
    <p class="description">快速制作工具列表配置文件，用于 Agent 的提示词中。</p>

    <div class="tool-list-editor">
      <ToolSelectionPanel
        :loading="loading"
        :filtered-tools="filteredTools"
        :selected-tools="selectedTools"
        :search-query="searchQuery"
        :show-selected-only="showSelectedOnly"
        @update:searchQuery="searchQuery = $event"
        @update:showSelectedOnly="showSelectedOnly = $event"
        @toggleTool="toggleTool"
        @selectAll="selectAll"
        @deselectAll="deselectAll"
      />

      <ToolConfigPreviewPanel
        :available-configs="availableConfigs"
        :selected-config="selectedConfig"
        :status-message="statusMessage"
        :status-type="statusType"
        :include-header="includeHeader"
        :include-examples="includeExamples"
        :preview-content="previewContent"
        @update:selectedConfig="onConfigSelectionChange"
        @loadConfig="loadConfig"
        @createConfig="createConfig"
        @deleteConfig="deleteConfig"
        @saveConfig="saveConfig"
        @update:includeHeader="onIncludeHeaderChange"
        @update:includeExamples="onIncludeExamplesChange"
        @copyPreview="copyPreview"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ToolSelectionPanel from "./ToolListEditor/ToolSelectionPanel.vue";
import ToolConfigPreviewPanel from "./ToolListEditor/ToolConfigPreviewPanel.vue";
import { useToolListEditor } from "./ToolListEditor/useToolListEditor";

const {
  loading,
  filteredTools,
  selectedTools,
  searchQuery,
  showSelectedOnly,
  toggleTool,
  selectAll,
  deselectAll,
  availableConfigs,
  selectedConfig,
  statusMessage,
  statusType,
  includeHeader,
  includeExamples,
  previewContent,
  onConfigSelectionChange,
  loadConfig,
  createConfig,
  deleteConfig,
  saveConfig,
  onIncludeHeaderChange,
  onIncludeExamplesChange,
  copyPreview,
  loadTools,
  loadConfigs,
} = useToolListEditor();

onMounted(() => {
  loadTools();
  loadConfigs();
});
</script>

<style scoped>
.tool-list-editor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: calc(100vh - 140px);
  min-height: 600px;
}

@media (max-width: 1024px) {
  .tool-list-editor {
    grid-template-columns: 1fr;
    height: auto;
  }
}
</style>
