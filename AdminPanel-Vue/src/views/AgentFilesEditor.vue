<template>
  <section class="config-section active-section">
    <p class="description">
      管理 Agent 的定义名称与对应的 .txt 文件。在这里可以添加、删除和修改 Agent
      映射，并直接编辑关联的文本文件。
    </p>

    <DualPaneEditor
      left-title="Agent 映射表"
      right-title="Agent 文件内容"
      :initial-left-width="450"
      :min-left-width="350"
      :max-left-width="600"
    >
      <template #left-actions>
        <div class="header-actions">
          <button
            @click="addAgentEntry"
            class="btn-primary btn-sm"
            aria-label="添加新 Agent"
            title="添加新 Agent"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >add</span
            >
          </button>
          <button
            @click="createAgentFile"
            class="btn-secondary btn-sm"
            aria-label="新建 Agent 文件"
            title="新建 Agent 文件"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >create_new_folder</span
            >
          </button>
          <button
            @click="saveAgentMap"
            class="btn-success btn-sm"
            aria-label="保存映射表"
            title="保存映射表"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >save</span
            >
          </button>
        </div>
      </template>

      <template #left-content>
        <div class="agent-map-list">
          <div
            v-for="(entry, index) in agentMap"
            :key="index"
            class="agent-map-entry card"
          >
            <div class="agent-entry-row">
              <label>Agent 名称:</label>
              <input
                type="text"
                v-model="entry.name"
                placeholder="Agent 名称"
              />
            </div>
            <div class="agent-entry-row">
              <label>关联文件:</label>
              <select
                v-model="entry.file"
                class="file-select"
                :disabled="isLoadingFiles"
              >
                <option value="">-- 选择文件 --</option>
                <option
                  v-for="file in availableFiles"
                  :key="file"
                  :value="file"
                >
                  {{ file }}
                </option>
              </select>
              <span v-if="isLoadingFiles" class="loading-hint">
                <span class="material-symbols-outlined spinning">sync</span>
                加载文件列表中…
              </span>
            </div>
            <div class="agent-entry-actions">
              <button
                @click="selectAgentFile(entry.file)"
                :disabled="!entry.file"
                class="btn-secondary btn-sm"
              >
                <span class="material-symbols-outlined">edit</span>
                编辑文件
              </button>
              <button
                @click="removeAgentEntry(index)"
                class="btn-danger btn-sm"
              >
                <span class="material-symbols-outlined">delete</span>
                删除
              </button>
            </div>
          </div>

          <div v-if="agentMap.length === 0" class="empty-state">
            <span class="material-symbols-outlined">smart_toy</span>
            <p>暂无 Agent 映射</p>
            <button @click="addAgentEntry" class="btn-primary">
              添加第一个 Agent
            </button>
          </div>
        </div>
      </template>

      <template #right-content>
        <div class="agent-file-editor">
          <div class="agent-editor-controls">
            <span class="editing-file-display">
              <span class="material-symbols-outlined">description</span>
              {{ editingFile || "未选择文件" }}
            </span>
          </div>
          <textarea
            v-model="fileContent"
            spellcheck="false"
            rows="20"
            placeholder="从左侧选择一个 Agent 以编辑其关联的 .txt 文件…"
            class="file-content-editor"
          ></textarea>
          <div class="editor-actions">
            <button
              @click="saveAgentFile"
              :disabled="!editingFile"
              class="btn-success"
            >
              <span class="material-symbols-outlined">save</span>
              保存文件内容
            </button>
            <span
              v-if="fileStatusMessage"
              :class="['status-message', fileStatusType]"
              >{{ fileStatusMessage }}</span
            >
          </div>
        </div>
      </template>
    </DualPaneEditor>

    <span
      v-if="statusMessage"
      :class="['status-message', 'floating-status', statusType]"
      >{{ statusMessage }}</span
    >
  </section>
</template>

<script setup lang="ts">
import DualPaneEditor from "@/components/DualPaneEditor.vue";
import { useAgentFilesEditor } from "./AgentFilesEditor/useAgentFilesEditor";

const {
  agentMap,
  availableFiles,
  isLoadingFiles,
  statusMessage,
  statusType,
  editingFile,
  fileContent,
  fileStatusMessage,
  fileStatusType,
  saveAgentMap,
  addAgentEntry,
  removeAgentEntry,
  createAgentFile,
  selectAgentFile,
  saveAgentFile,
} = useAgentFilesEditor();
</script>
<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 13px;
  min-width: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-sm .material-symbols-outlined {
  font-size: 16px !important;
}

.agent-map-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 8px;
}

.agent-map-entry {
  padding: 16px;
}

.agent-entry-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.agent-entry-row label {
  font-size: 13px;
  color: var(--secondary-text);
  font-weight: 500;
}

.agent-entry-row input,
.agent-entry-row select {
  width: 100%;
  padding: 10px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--primary-text);
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1a6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
  cursor: pointer;
}

.agent-entry-row select:hover {
  border-color: var(--highlight-text);
}

.agent-entry-row select:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
  box-shadow: 0 0 0 2px var(--primary-color-translucent);
}

.agent-entry-row select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-image: none;
}

.loading-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--secondary-text);
  margin-top: 4px;
}

.loading-hint .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.agent-entry-row input::placeholder {
  color: var(--secondary-text);
}

.agent-entry-row input:focus-visible,
.agent-entry-row select:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
}

.agent-entry-row input:focus:not(:focus-visible),
.agent-entry-row select:focus:not(:focus-visible) {
  border-color: var(--highlight-text);
}

.agent-entry-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.agent-file-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 260px);
}

.agent-editor-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--tertiary-bg);
  border-radius: 8px;
}

.editing-file-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--secondary-text);
  font-weight: 500;
}

.editing-file-display .material-symbols-outlined {
  font-size: 18px !important;
}

.file-content-editor {
  flex: 1;
  width: 100%;
  font-family: "Consolas", "Monaco", monospace;
  resize: none;
  padding: 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--primary-text);
  font-size: 14px;
  line-height: 1.6;
}

.file-content-editor:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
}

.editor-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
  padding: 12px;
  background: var(--tertiary-bg);
  border-radius: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--secondary-text);
  gap: 16px;
}

.empty-state .material-symbols-outlined {
  font-size: 64px !important;
  opacity: 0.3;
}

.empty-state p {
  font-size: 1em;
  opacity: 0.8;
}

.floating-status {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 12px 20px;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .agent-map-list {
    max-height: none;
  }

  .agent-file-editor {
    height: auto;
  }

  .file-content-editor {
    min-height: 300px;
  }
}
</style>
