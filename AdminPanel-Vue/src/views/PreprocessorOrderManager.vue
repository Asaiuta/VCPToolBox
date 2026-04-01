<template>
  <section class="config-section active-section">
    <p class="description">
      在这里，您可以拖动消息预处理器插件来调整它们的执行顺序。顺序越靠上，执行越优先。
    </p>
    <div class="preprocessor-order-controls">
      <button @click="saveOrder" class="btn-primary">保存顺序并热重载</button>
      <span v-if="statusMessage" :class="['status-message', statusType]">{{
        statusMessage
      }}</span>
    </div>
    <ul id="preprocessor-list" class="draggable-list">
      <li
        v-for="(plugin, index) in preprocessors"
        :key="plugin.name"
        class="draggable-item"
        :class="{ dragging: draggingIndex === index }"
        draggable
        @dragstart="onDragStart($event, index)"
        @dragover="onDragOver($event)"
        @drop="onDrop($event, index)"
        @dragend="onDragEnd"
      >
        <span class="drag-handle">☰</span>
        <span class="plugin-index">{{ index + 1 }}.</span>
        <span class="plugin-name">{{ plugin.displayName || plugin.name }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { usePreprocessorOrderManager } from "./PreprocessorOrderManager/usePreprocessorOrderManager";

const {
  preprocessors,
  draggingIndex,
  statusMessage,
  statusType,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  saveOrder,
} = usePreprocessorOrderManager();
</script>

<style scoped>
.preprocessor-order-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.draggable-list {
  list-style: none;
  padding: 0;
}

.draggable-item {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: grab;
  transition: background 0.2s ease, transform 0.2s ease;
}

.draggable-item:hover {
  background: var(--accent-bg);
}

.draggable-item.dragging {
  opacity: 0.6;
  background: var(--primary-color-translucent);
}

.drag-handle {
  color: var(--secondary-text);
  font-size: 18px;
  cursor: grab;
}

.plugin-index {
  color: var(--secondary-text);
  font-weight: 600;
  min-width: 30px;
}
.plugin-name {
  font-weight: 500;
  color: var(--primary-text);
}
</style>
