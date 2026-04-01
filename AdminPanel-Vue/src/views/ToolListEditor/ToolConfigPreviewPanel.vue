<template>
  <div class="right-panel">
    <!-- 配置文件管理 -->
    <div class="config-manager card">
      <h2 class="section-header">📁 配置管理</h2>

      <div class="config-selector">
        <select
          :value="selectedConfig"
          @change="
            emit(
              'update:selectedConfig',
              ($event.target as HTMLSelectElement).value
            )
          "
        >
          <option value="">-- 新建配置文件 --</option>
          <option
            v-for="config in availableConfigs"
            :key="config"
            :value="config"
          >
            {{ config }}
          </option>
        </select>
      </div>

      <div class="config-actions">
        <button
          @click="emit('loadConfig')"
          :disabled="!selectedConfig"
          class="btn-primary"
        >
          加载
        </button>
        <button @click="emit('createConfig')" class="btn-primary">新建</button>
        <button
          @click="emit('deleteConfig')"
          :disabled="!selectedConfig"
          class="btn-danger"
        >
          删除
        </button>
        <button @click="emit('saveConfig')" class="btn-success">💾 保存</button>
      </div>

      <span v-if="statusMessage" :class="['status-message', statusType]">
        {{ statusMessage }}
      </span>
    </div>

    <!-- 预览区域 -->
    <div class="preview-section card">
      <h2 class="section-header">📝 生成预览</h2>

      <div class="preview-controls">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="includeHeader"
            @change="
              emit(
                'update:includeHeader',
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          <span>包含文件头</span>
        </label>
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="includeExamples"
            @change="
              emit(
                'update:includeExamples',
                ($event.target as HTMLInputElement).checked
              )
            "
          />
          <span>包含示例</span>
        </label>
        <button @click="emit('copyPreview')" class="btn-copy">📋 复制</button>
      </div>

      <textarea
        id="preview-output"
        readonly
        :value="previewContent"
        placeholder="选择工具后将在此显示配置内容…"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  availableConfigs: string[];
  selectedConfig: string;
  statusMessage: string;
  statusType: "info" | "success" | "error";
  includeHeader: boolean;
  includeExamples: boolean;
  previewContent: string;
}>();

const emit = defineEmits<{
  "update:selectedConfig": [value: string];
  loadConfig: [];
  createConfig: [];
  deleteConfig: [];
  saveConfig: [];
  "update:includeHeader": [value: boolean];
  "update:includeExamples": [value: boolean];
  copyPreview: [];
}>();
</script>

<style scoped>
.right-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.config-manager,
.preview-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.config-manager {
  flex-shrink: 0;
}

.preview-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.section-header {
  margin: 0 0 20px;
  font-size: 1.2em;
  color: var(--primary-text);
  display: flex;
  align-items: center;
  gap: 10px;
}

.config-selector {
  margin-bottom: 20px;
}

.config-selector select {
  width: 100%;
  padding: 10px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 0.95em;
  box-sizing: border-box;
}

.config-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 15px;
}

.config-actions button {
  flex: 1;
  min-width: 80px;
}

.status-message {
  font-size: 0.9em;
  padding: 8px 12px;
  border-radius: 6px;
}

.status-message.success {
  background: rgba(30, 142, 62, 0.1);
  color: var(--success-color);
}

.status-message.error {
  background: rgba(217, 48, 37, 0.1);
  color: var(--danger-color);
}

.status-message.info {
  background: rgba(14, 165, 233, 0.1);
  color: var(--highlight-text);
}

.preview-controls {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  color: var(--secondary-text);
  cursor: pointer;
}

#preview-output {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-family: "Consolas", "Monaco", monospace;
  font-size: 0.9em;
  resize: none;
  box-sizing: border-box;
}

.btn-copy {
  padding: 8px 16px;
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.btn-copy:hover {
  background: var(--accent-bg);
  border-color: var(--highlight-text);
}

@media (max-width: 1024px) {
  .right-panel {
    overflow: visible;
  }

  .config-manager,
  .preview-section {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .section-header {
    margin-bottom: 14px;
    gap: 8px;
    flex-wrap: wrap;
  }

  .config-actions,
  .preview-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .config-actions button,
  .btn-copy {
    width: 100%;
  }

  .checkbox-label {
    width: 100%;
  }
}
</style>
