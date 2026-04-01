<template>
  <section class="config-section active-section vcp-tavern-page">
    <div class="page-header">
      <div>
        <p class="description">
          管理上下文注入预设与规则，支持排序、启用开关和规则类型配置。
        </p>
      </div>
      <div class="header-actions">
        <button
          class="btn-secondary"
          type="button"
          :disabled="isLoading"
          @click="fetchPresets"
        >
          刷新
        </button>
      </div>
    </div>

    <div class="preset-toolbar card">
      <label for="preset-select">选择预设</label>
      <select
        id="preset-select"
        v-model="selectedPresetName"
        :disabled="isLoading"
      >
        <option value="">-- 选择一个预设 --</option>
        <option v-for="name in presetNames" :key="name" :value="name">
          {{ name }}
        </option>
      </select>

      <button
        class="btn-primary"
        type="button"
        :disabled="!selectedPresetName || isLoading"
        @click="loadPreset(selectedPresetName)"
      >
        加载
      </button>
      <button
        class="btn-secondary"
        type="button"
        :disabled="isLoading"
        @click="createNewPreset"
      >
        新建
      </button>
      <button
        class="btn-danger"
        type="button"
        :disabled="!selectedPresetName || isLoading"
        @click="deletePreset"
      >
        删除
      </button>
    </div>

    <div v-if="!isEditorVisible" class="empty-tip card">
      <p>请选择一个预设进行编辑，或点击“新建”创建预设。</p>
    </div>

    <div v-else class="editor card">
      <div class="meta-grid">
        <div class="form-group">
          <label for="preset-name">预设名称</label>
          <input
            id="preset-name"
            v-model.trim="editorState.name"
            type="text"
            placeholder="仅限字母、数字、下划线和连字符"
            :disabled="!isNewPreset"
          />
        </div>
        <div class="form-group full-width">
          <label for="preset-description">预设描述</label>
          <textarea
            id="preset-description"
            v-model="editorState.description"
            rows="3"
            placeholder="描述预设用途"
          ></textarea>
        </div>
      </div>

      <div class="rules-header">
        <h3>注入规则</h3>
        <button class="btn-secondary" type="button" @click="addRule">
          添加规则
        </button>
      </div>

      <div v-if="editorState.rules.length === 0" class="empty-rules">
        暂无规则，点击“添加规则”创建。
      </div>

      <div class="rules-list" @dragover.prevent>
        <article
          v-for="(rule, index) in editorState.rules"
          :key="rule.id"
          class="rule-card"
          :class="{ dragging: dragState.draggingIndex === index }"
          :draggable="dragState.enabledIndex === index"
          @mousedown="prepareDrag(index, $event)"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent
          @drop="onDrop(index)"
          @dragend="onDragEnd"
        >
          <div class="rule-head">
            <button
              class="drag-handle"
              type="button"
              aria-label="拖动排序"
              title="拖动排序"
            >
              ⋮⋮
            </button>
            <input
              v-model="rule.name"
              class="rule-title"
              type="text"
              placeholder="规则名称"
            />
            <label class="enabled-switch">
              <input v-model="rule.enabled" type="checkbox" />
              <span>{{ rule.enabled ? "启用" : "停用" }}</span>
            </label>
            <button
              class="btn-danger small"
              type="button"
              @click="removeRule(index)"
            >
              删除
            </button>
          </div>

          <div class="rule-body">
            <div class="form-group">
              <label>注入类型</label>
              <select v-model="rule.type">
                <option value="relative">相对注入</option>
                <option value="depth">深度注入</option>
                <option value="embed">嵌入</option>
              </select>
            </div>

            <div
              v-if="rule.type === 'relative' || rule.type === 'embed'"
              class="form-group"
            >
              <label>相对位置</label>
              <select v-model="rule.position">
                <option value="before">之前</option>
                <option value="after">之后</option>
              </select>
            </div>

            <div
              v-if="rule.type === 'relative' || rule.type === 'embed'"
              class="form-group"
            >
              <label>目标</label>
              <select v-model="rule.target">
                <option value="system">系统提示</option>
                <option value="last_user">最后的用户消息</option>
              </select>
            </div>

            <div v-if="rule.type === 'depth'" class="form-group">
              <label>深度</label>
              <input v-model.number="rule.depth" type="number" min="1" />
            </div>

            <div v-if="rule.type !== 'embed'" class="form-group">
              <label>注入角色</label>
              <select v-model="rule.content.role">
                <option value="system">system</option>
                <option value="user">user</option>
                <option value="assistant">assistant</option>
              </select>
            </div>

            <div class="form-group full-width">
              <label>注入内容</label>
              <textarea
                v-model="rule.content.content"
                rows="5"
                placeholder="请输入要注入的文本"
              ></textarea>
            </div>
          </div>
        </article>
      </div>

      <div class="editor-actions">
        <button
          class="btn-success"
          type="button"
          :disabled="isSaving"
          @click="savePreset"
        >
          {{ isSaving ? "保存中…" : "保存预设" }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useVcptavernEditor } from "./VcptavernEditor/useVcptavernEditor";

const {
  presetNames,
  selectedPresetName,
  isLoading,
  isSaving,
  isEditorVisible,
  isNewPreset,
  dragState,
  editorState,
  fetchPresets,
  loadPreset,
  createNewPreset,
  addRule,
  removeRule,
  prepareDrag,
  onDragStart,
  onDrop,
  onDragEnd,
  deletePreset,
  savePreset,
} = useVcptavernEditor();
</script>

<style scoped>
.vcp-tavern-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.page-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.preset-toolbar {
  display: grid;
  grid-template-columns: minmax(110px, auto) minmax(240px, 1fr) auto auto auto;
  gap: 10px;
  align-items: center;
}

.preset-toolbar label {
  color: var(--secondary-text);
}

.preset-toolbar select {
  width: 100%;
}

.editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  color: var(--secondary-text);
  font-size: 0.9rem;
}

input,
select,
textarea {
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--primary-text);
  border-radius: 8px;
  padding: 10px;
}

textarea {
  resize: vertical;
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible,
button:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rules-header h3 {
  margin: 0;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-card {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--tertiary-bg);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-card.dragging {
  opacity: 0.65;
}

.rule-head {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 10px;
  align-items: center;
}

.drag-handle {
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--secondary-text);
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: grab;
  font-size: 16px;
}

.drag-handle:active {
  cursor: grabbing;
}

.rule-title {
  font-weight: 600;
}

.enabled-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--secondary-text);
}

.rule-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-tip,
.empty-rules {
  color: var(--secondary-text);
}

.small {
  padding: 6px 10px;
  font-size: 0.85rem;
}

@media (max-width: 980px) {
  .preset-toolbar {
    grid-template-columns: 1fr 1fr;
  }

  .preset-toolbar label {
    grid-column: 1 / -1;
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .rule-head {
    grid-template-columns: auto 1fr;
  }

  .enabled-switch,
  .rule-head .btn-danger {
    grid-column: 1 / -1;
  }
}
</style>
