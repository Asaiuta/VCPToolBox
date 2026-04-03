<template>
  <section class="config-section active-section">
    <p v-if="pluginName" class="description">配置插件：{{ pluginName }}</p>

    <div v-if="pluginData" class="plugin-config-container">
      <div class="plugin-controls">
        <button
          @click="togglePlugin"
          class="btn-primary"
          :class="{ 'disabled-state': !pluginData.enabled }"
        >
          {{ pluginData.enabled ? '禁用插件' : '启用插件' }}
        </button>
        <span v-if="statusMessage" :class="['status-message', statusType]">{{ statusMessage }}</span>
      </div>

      <form @submit.prevent="savePluginConfig">
        <div v-if="!hasEnvContent && !hasConfigSchema" class="config-warning">
          <div class="warning-content">
            <p class="warning-title">该插件暂无配置文件</p>
            <p class="warning-text">
              插件 <code>{{ pluginName }}</code> 目录下不存在 <code>config.env</code> 文件。
            </p>
            <p class="warning-text">
              您可以在下方添加配置项，点击保存后将自动创建 <code>config.env</code> 文件。
            </p>
          </div>
        </div>

        <div v-if="hasSchemaFields" class="schema-fields-section">
          <h3>Schema 定义的配置</h3>
          <div v-for="(entry, index) in schemaEntries" :key="entry.key || `schema-${index}`" class="form-group">
            <label :for="`plugin-${entry.key}`">
              <span class="key-name">{{ entry.key }}</span>
            </label>

            <div v-if="entry.type === 'boolean'" class="switch-container">
              <label class="switch">
                <input
                  type="checkbox"
                  :id="`plugin-${entry.key}`"
                  v-model="entry.value"
                >
                <span class="slider"></span>
              </label>
              <span>{{ entry.value ? '启用' : '禁用' }}</span>
            </div>

            <input
              v-else-if="entry.type === 'integer'"
              type="number"
              :id="`plugin-${entry.key}`"
              v-model.number="entry.value"
            >

            <textarea
              v-else-if="entry.isMultilineQuoted || String(entry.value || '').length > 60"
              :id="`plugin-${entry.key}`"
              :value="entry.value as unknown as TextareaValue"
              @input="entry.value = ($event.target as HTMLTextAreaElement).value"
              rows="4"
            ></textarea>

            <div v-else-if="entry.key && isSensitiveKey(entry.key)" class="input-with-toggle">
              <input
                :type="sensitiveFields[entry.key] ? 'text' : 'password'"
                :id="`plugin-${entry.key}`"
                v-model="entry.value"
              >
              <button
                type="button"
                class="toggle-visibility-btn"
                @click="toggleSensitiveField(entry.key)"
                :aria-label="sensitiveFields[entry.key] ? '隐藏值' : '显示值'"
                :aria-pressed="sensitiveFields[entry.key]"
              >
                {{ sensitiveFields[entry.key] ? '隐藏' : '显示' }}
              </button>
            </div>

            <input
              v-else
              type="text"
              :id="`plugin-${entry.key}`"
              v-model="entry.value"
            />

            <span v-if="entry.key" class="description">
              {{ getSchemaDescription(entry.key) }}
              <span class="defined-in" v-if="isKeyInEnv(entry.key)">(当前在插件 .env 中定义)</span>
              <span class="defined-in" v-else-if="hasDefault(entry.key)">(使用插件清单默认值)</span>
              <span class="defined-in" v-else>(未设置，将继承全局或为空)</span>
            </span>
          </div>
        </div>

        <div v-if="hasCustomFields || hasCommentEntries" class="custom-fields-section">
          <h3>自定义 .env 配置项 (及注释/空行)</h3>
          <div v-for="(entry, index) in customEntries" :key="entry.key || `custom-${index}`" class="form-group">
            <div v-if="entry.isCommentOrEmpty" class="form-group-comment">
              <pre>{{ entry.value }}</pre>
            </div>

            <div v-else>
              <label :for="`plugin-${entry.key}`">
                <span class="key-name">{{ entry.key }}</span>
                <button
                  v-if="entry.key && !isKeyInSchema(entry.key)"
                  type="button"
                  class="delete-config-btn"
                  @click="removeCustomField(entry.key)"
                  :title="`删除自定义项 ${entry.key}`"
                >×</button>
              </label>

              <div v-if="entry.type === 'boolean'" class="switch-container">
                <label class="switch">
                  <input
                    type="checkbox"
                    :id="`plugin-${entry.key}`"
                    v-model="entry.value"
                  >
                  <span class="slider"></span>
                </label>
                <span>{{ entry.value ? '启用' : '禁用' }}</span>
              </div>

              <input
                v-else-if="entry.type === 'integer'"
                type="number"
                :id="`plugin-${entry.key}`"
                v-model.number="entry.value"
              >

              <textarea
                v-else-if="entry.isMultilineQuoted || String(entry.value || '').length > 60"
                :id="`plugin-${entry.key}`"
                :value="entry.value as unknown as TextareaValue"
                @input="entry.value = ($event.target as HTMLTextAreaElement).value"
                rows="4"
              ></textarea>

              <div v-else-if="entry.key && isSensitiveKey(entry.key)" class="input-with-toggle">
                <input
                  :type="sensitiveFields[entry.key] ? 'text' : 'password'"
                  :id="`plugin-${entry.key}`"
                  v-model="entry.value"
                >
                <button
                  type="button"
                  class="toggle-visibility-btn"
                  @click="toggleSensitiveField(entry.key)"
                  :aria-label="sensitiveFields[entry.key] ? '隐藏值' : '显示值'"
                  :aria-pressed="sensitiveFields[entry.key]"
                >
                  {{ sensitiveFields[entry.key] ? '隐藏' : '显示' }}
                </button>
              </div>

              <input
                v-else
                type="text"
                :id="`plugin-${entry.key}`"
                v-model="entry.value"
              />

              <span v-if="entry.key" class="description">自定义配置项：{{ entry.key }} <span class="defined-in">(当前在插件 .env 中定义)</span></span>
            </div>
          </div>
        </div>

        <div v-if="invocationCommands.length > 0" class="invocation-commands-section">
          <h3>调用命令 AI 指令编辑</h3>
          <div
            v-for="(cmd, index) in invocationCommands"
            :key="`cmd-${getCommandIdentifier(cmd) || index}`"
            class="command-item"
          >
            <h4>命令: {{ getCommandIdentifier(cmd) }}</h4>
            <div class="form-group">
              <label :for="`cmd-desc-${getCommandIdentifier(cmd)}`">指令描述 (AI Instructions):</label>
              <textarea
                :id="`cmd-desc-${getCommandIdentifier(cmd)}`"
                class="command-description-edit"
                rows="5"
                v-model="commandDescriptions[getCommandIdentifier(cmd)]"
              ></textarea>
              <button
                type="button"
                @click="saveInvocationCommandDescription(cmd)"
                class="btn-secondary command-save-btn"
              >保存此指令描述</button>
              <p :class="['status', 'command-status', commandStatuses[getCommandIdentifier(cmd)]?.type || '']">
                {{ commandStatuses[getCommandIdentifier(cmd)]?.message || '' }}
              </p>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-secondary" @click="addCustomField">添加自定义配置项</button>
          <button type="submit" class="btn-success">保存 {{ pluginName }} 配置</button>
        </div>
      </form>
    </div>

    <div v-else class="empty-state">
      <p>加载插件配置中…</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { usePluginConfigStore, type InvocationCommand } from '@/stores/pluginConfig'

type TextareaValue = string | number | readonly string[] | null

const route = useRoute()
const pluginName = computed(() => route.params.pluginName as string)
const pluginConfigStore = usePluginConfigStore()
const {
  pluginData,
  statusMessage,
  statusType,
  sensitiveFields,
  commandDescriptions,
  commandStatuses,
  hasEnvContent,
  hasConfigSchema,
  schemaEntries,
  customEntries,
  hasSchemaFields,
  hasCommentEntries,
  hasCustomFields,
  invocationCommands
} = storeToRefs(pluginConfigStore)

const {
  isSensitiveKey,
  toggleSensitiveField,
  getCommandIdentifier,
  isKeyInSchema,
  isKeyInEnv,
  hasDefault,
  getSchemaDescription,
  removeCustomField,
  addCustomField
} = pluginConfigStore

async function saveInvocationCommandDescription(cmd: InvocationCommand) {
  await pluginConfigStore.saveInvocationCommandDescription(pluginName.value, cmd)
}

async function togglePlugin() {
  await pluginConfigStore.togglePlugin(pluginName.value)
}

async function savePluginConfig() {
  await pluginConfigStore.savePluginConfig(pluginName.value)
}

watch(
  () => pluginName.value,
  () => {
    pluginConfigStore.loadPluginConfig(pluginName.value)
  },
  { immediate: true }
)
</script>

<style scoped>
.plugin-config-container {
  max-width: 900px;
}

.plugin-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.config-warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px;
  background: var(--warning-bg, #fff3cd);
  border: 1px solid var(--warning-border, #ffc107);
  border-radius: 8px;
  margin-bottom: 24px;
}

.warning-content {
  flex: 1;
}

.warning-title {
  font-weight: 600;
  color: var(--warning-text, #856404);
  margin: 0 0 8px 0;
}

.warning-text {
  margin: 4px 0;
  color: var(--warning-text, #856404);
}

.schema-fields-section,
.custom-fields-section {
  margin-bottom: 20px;
}

.defined-in {
  opacity: 0.85;
}

.invocation-commands-section {
  margin-bottom: 20px;
}

.command-item {
  margin-bottom: 16px;
}

.command-item h4 {
  margin: 6px 0 8px;
}

.command-description-edit {
  width: 100%;
}

.command-save-btn {
  margin-top: 12px;
}

.command-status {
  margin: 8px 0 0;
}

.form-group-comment pre {
  color: var(--secondary-text);
  font-family: inherit;
  white-space: pre-wrap;
  margin: 8px 0;
}

.delete-config-btn {
  margin-left: 8px;
  border: none;
  background: transparent;
  color: #d9534f;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.delete-config-btn:hover {
  color: #c9302c;
}

.input-with-toggle {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-toggle input {
  flex: 1;
  padding-right: 70px;
}

.toggle-visibility-btn {
  position: absolute;
  right: 8px;
  padding: 4px 10px;
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--primary-text);
  font-size: 12px;
  cursor: pointer;
}

.toggle-visibility-btn:hover {
  background: var(--accent-bg);
}

.disabled-state {
  opacity: 0.6;
  background: var(--secondary-text);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.7;
}
</style>
