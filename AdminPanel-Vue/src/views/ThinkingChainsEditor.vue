<template>
  <section class="config-section active-section">
    <p class="description">
      管理 RAGDiaryPlugin
      使用的元思考链。您可以创建不同的思考主题，并拖拽排序其中的思维簇模块。
    </p>
    <div id="thinking-chains-editor-controls" class="form-actions">
      <button @click="saveThinkingChains" class="btn-primary">
        保存所有更改
      </button>
      <button @click="addThinkingChain" class="btn-secondary">
        添加新主题
      </button>
      <span v-if="statusMessage" :class="['status-message', statusType]">{{
        statusMessage
      }}</span>
    </div>

    <div id="thinking-chains-container" class="thinking-chains-layout">
      <!-- 左侧：主题列表 -->
      <div class="thinking-chains-editor">
        <h3>思考主题列表</h3>
        <div
          v-for="(chain, index) in thinkingChains"
          :key="index"
          class="thinking-chain-item card"
        >
          <details open>
            <summary class="chain-header">
              <span class="theme-name">主题：{{ chain.theme }}</span>
              <button @click="removeChain(index)" class="btn-danger btn-sm">
                删除
              </button>
            </summary>
            <div class="chain-content">
              <!-- K 值序列配置 -->
              <div class="k-sequence-editor" v-if="chain.clusters.length > 0">
                <h4>K 值序列配置</h4>
                <p class="description">每个思维簇对应的检索数量（K 值）</p>
                <div class="k-sequence-inputs">
                  <div
                    v-for="(cluster, cIndex) in chain.clusters"
                    :key="cIndex"
                    class="k-value-group"
                  >
                    <label>{{ cluster }}:</label>
                    <input
                      type="number"
                      v-model.number="chain.kSequence[cIndex]"
                      min="1"
                      max="20"
                      class="k-value-input"
                    />
                    <span class="k-value-hint">检索数量</span>
                  </div>
                </div>
              </div>

              <!-- 思维簇拖拽列表 -->
              <ul
                class="draggable-list"
                @dragover="handleDragOver"
                @drop="handleDrop($event, index, chain.clusters.length)"
              >
                <li
                  v-for="(cluster, cIndex) in chain.clusters"
                  :key="cIndex"
                  class="chain-item"
                  draggable
                  @dragstart="handleDragStart($event, index, cIndex, 'chain')"
                  @dragover="handleDragOver"
                  @drop="handleDrop($event, index, cIndex)"
                >
                  <span class="drag-handle">☰</span>
                  <span class="cluster-name">{{ cluster }}</span>
                  <button
                    @click="removeCluster(index, cIndex)"
                    class="btn-danger btn-sm"
                  >
                    ×
                  </button>
                </li>
                <li v-if="chain.clusters.length === 0" class="drop-placeholder">
                  将思维簇拖拽到此处
                </li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      <!-- 右侧：可用思维簇模块 -->
      <div class="available-clusters-panel">
        <h3>可用的思维簇模块</h3>
        <p class="description">将模块从这里拖拽到左侧的主题列表中</p>
        <ul
          class="draggable-list available-clusters-list"
          @dragover="handleDragOver"
        >
          <li
            v-for="cluster in availableClusters"
            :key="cluster"
            class="chain-item"
            draggable
            @dragstart="
              handleDragStart($event, null, null, 'available', cluster)
            "
          >
            <span class="cluster-name">{{ cluster }}</span>
          </li>
          <li v-if="availableClusters.length === 0" class="no-clusters">
            未找到可用的思维簇模块
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useThinkingChainsEditor } from "./ThinkingChainsEditor/useThinkingChainsEditor";

const {
  thinkingChains,
  availableClusters,
  statusMessage,
  statusType,
  saveThinkingChains,
  addThinkingChain,
  removeChain,
  removeCluster,
  handleDragStart,
  handleDragOver,
  handleDrop,
} = useThinkingChainsEditor();
</script>

<style scoped>
.thinking-chains-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 24px;
}

.thinking-chains-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thinking-chains-editor > h3 {
  margin: 0;
  color: var(--primary-text);
}

.thinking-chain-item {
  padding: 16px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.chain-header:hover {
  color: var(--highlight-text);
}

.theme-name {
  font-weight: 600;
  font-size: 1.1em;
}

.chain-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

/* K 值序列配置 */
.k-sequence-editor {
  padding: 12px;
  background: var(--tertiary-bg);
  border-radius: 8px;
}

.k-sequence-editor h4 {
  margin: 0 0 8px;
  font-size: 0.95em;
  color: var(--primary-text);
}

.k-sequence-editor .description {
  margin: 0 0 12px;
  font-size: 0.85em;
  color: var(--secondary-text);
}

.k-sequence-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.k-value-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--input-bg);
  border-radius: 6px;
}

.k-value-group label {
  font-size: 0.85em;
  color: var(--secondary-text);
  font-weight: 600;
}

.k-value-input {
  width: 60px;
  padding: 4px 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--primary-text);
  font-size: 0.9em;
}

.k-value-hint {
  font-size: 0.8em;
  color: var(--secondary-text);
}

/* 拖拽列表 */
.draggable-list {
  list-style: none;
  padding: 0;
  margin: 0;
  min-height: 60px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 8px;
}

.draggable-list.drag-over {
  border-color: var(--highlight-text);
  background: var(--accent-bg);
}

.chain-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: move;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.chain-item:last-child {
  margin-bottom: 0;
}

.chain-item:hover {
  border-color: var(--highlight-text);
  transform: translateX(4px);
}

.chain-item.dragging {
  opacity: 0.5;
}

.drag-handle {
  color: var(--secondary-text);
  cursor: grab;
  user-select: none;
}

.cluster-name {
  flex: 1;
  font-weight: 500;
}

.drop-placeholder {
  padding: 20px;
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.9em;
}

/* 可用思维簇面板 */
.available-clusters-panel {
  padding: 16px;
  background: var(--secondary-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  height: fit-content;
}

.available-clusters-panel > h3 {
  margin: 0 0 8px;
  font-size: 1em;
  color: var(--primary-text);
}

.available-clusters-panel > .description {
  margin: 0 0 16px;
  font-size: 0.85em;
  color: var(--secondary-text);
}

.available-clusters-list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: visible;
}

.available-clusters-list .chain-item {
  cursor: grab;
}

.available-clusters-list .chain-item:hover {
  border-color: var(--highlight-text);
  background: var(--accent-bg);
}

.no-clusters {
  padding: 20px;
  text-align: center;
  color: var(--secondary-text);
  font-size: 0.9em;
}

/* 响应式 */
@media (max-width: 1024px) {
  .thinking-chains-layout {
    grid-template-columns: 1fr;
  }

  .available-clusters-panel {
    order: -1;
  }
}
</style>
