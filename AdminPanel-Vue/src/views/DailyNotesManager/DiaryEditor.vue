<template>
  <div v-if="editingNote" class="note-editor-area card">
    <div class="editor-header">
      <div class="editor-title-section">
        <button
          class="btn-back"
          aria-label="返回日记列表"
          @click="$emit('cancelEdit')"
        >
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h3>编辑日记：{{ editingNote.file }}</h3>
      </div>
      <div class="editor-actions">
        <button
          class="btn-primary"
          :disabled="savingNote"
          @click="$emit('saveNote')"
        >
          {{ savingNote ? "保存中…" : "保存日记" }}
        </button>
        <button
          class="btn-secondary"
          :disabled="savingNote"
          @click="$emit('cancelEdit')"
        >
          取消编辑
        </button>
        <span
          v-if="editorStatus"
          :class="['status-message', editorStatusType]"
          >{{ editorStatus }}</span
        >
      </div>
    </div>

    <div class="markdown-editor-wrapper">
      <slot name="editor-textarea"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Note {
  file: string;
}

defineProps<{
  editingNote: Note | null;
  savingNote: boolean;
  editorStatus: string;
  editorStatusType: "info" | "success" | "error";
}>();

defineEmits<{
  (e: "saveNote"): void;
  (e: "cancelEdit"): void;
}>();
</script>

<style scoped>
.note-editor-area {
  padding: 20px;
  background: var(--secondary-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.editor-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.editor-title-section h3 {
  margin: 0;
  color: var(--primary-text);
  font-size: 1.2em;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--primary-text);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-back:hover {
  background: var(--accent-bg);
  border-color: var(--highlight-text);
  transform: translateX(-4px);
}

.btn-back .material-symbols-outlined {
  font-size: 20px !important;
}

.editor-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.markdown-editor-wrapper {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

:deep(.EasyMDEContainer) {
  background: var(--input-bg);
  border: none;
  color: var(--primary-text);
}

:deep(.EasyMDEContainer .editor-toolbar) {
  background: var(--tertiary-bg);
  border-bottom-color: var(--border-color);
}

:deep(.EasyMDEContainer .editor-toolbar button) {
  color: var(--primary-text) !important;
}

:deep(.EasyMDEContainer .editor-toolbar button:hover) {
  background: var(--accent-bg) !important;
}

:deep(.EasyMDEContainer .CodeMirror) {
  background: var(--input-bg);
  color: var(--primary-text);
  border: none;
  min-height: 500px;
}

:deep(.EasyMDEContainer .CodeMirror .CodeMirror-lines) {
  color: var(--primary-text);
}

:deep(.EasyMDEContainer .CodeMirror .cm-header) {
  color: var(--highlight-text);
}

:deep(.EasyMDEContainer .CodeMirror .cm-link) {
  color: var(--primary-color);
}

:deep(.EasyMDEContainer .CodeMirror-cursor) {
  border-color: var(--primary-text);
}

:deep(.EasyMDEContainer .editor-statusbar) {
  background: var(--tertiary-bg);
  border-top-color: var(--border-color);
  color: var(--secondary-text);
}

:deep(.editor-toolbar.fullscreen) {
  background: var(--secondary-bg);
}

:deep(.CodeMirror-fullscreen) {
  background: var(--secondary-bg) !important;
}

@media (max-width: 768px) {
  .note-editor-area {
    padding: 14px;
    border-radius: 10px;
  }

  .editor-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .editor-title-section {
    width: 100%;
    align-items: flex-start;
  }

  .editor-title-section h3 {
    font-size: 1rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .editor-actions {
    width: 100%;
    justify-content: flex-start;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 8px;
  }

  .editor-actions .btn-primary,
  .editor-actions .btn-secondary {
    flex: 1 1 calc(50% - 4px);
    min-height: 40px;
  }

  .editor-actions .status-message {
    width: 100%;
  }

  :deep(.EasyMDEContainer .editor-toolbar) {
    overflow-x: auto;
    white-space: nowrap;
  }

  :deep(.EasyMDEContainer .CodeMirror) {
    min-height: 320px;
  }
}
</style>
