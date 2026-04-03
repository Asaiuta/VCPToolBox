<template>
  <section class="config-section active-section">
    <p class="description">
      维护 toolbox_map.json（alias→file+description），并编辑 TVStxt 下映射文件内容。
    </p>

    <DualPaneEditor
      left-title="Toolbox 映射表"
      right-title="Toolbox 文件内容"
      :initial-left-width="450"
      :min-left-width="350"
      :max-left-width="600"
    >
      <template #left-actions>
        <div class="header-actions">
          <button @click="addToolboxEntry" class="btn-primary btn-sm" title="添加新 Toolbox">
            <span class="material-symbols-outlined">add</span>
          </button>
          <button @click="createToolboxFile" class="btn-secondary btn-sm" title="新建 Toolbox 文件">
            <span class="material-symbols-outlined">create_new_folder</span>
          </button>
          <button @click="saveToolboxMap" class="btn-success btn-sm" title="保存 Toolbox 映射表">
            <span class="material-symbols-outlined">save</span>
          </button>
        </div>
      </template>

      <template #left-content>
        <div class="toolbox-map-list">
          <div v-for="(entry, index) in toolboxMap" :key="entry.alias || entry.file || `toolbox-${index}`" class="toolbox-map-entry card">
            <div class="toolbox-entry-row">
              <label>别名 (Alias):</label>
              <input
                type="text"
                v-model="entry.alias"
                placeholder="例如：my-tool"
              >
            </div>
            <div class="toolbox-entry-row">
              <label>文件名:</label>
              <input
                type="text"
                v-model="entry.file"
                placeholder="例如：MyTool.txt"
              >
            </div>
            <div class="toolbox-entry-row">
              <label>描述:</label>
              <input
                type="text"
                v-model="entry.description"
                placeholder="工具描述…"
              >
            </div>
            <div class="toolbox-entry-actions">
              <button @click="selectToolboxFile(entry.file)" class="btn-secondary btn-sm">
                <span class="material-symbols-outlined">edit</span>
                编辑
              </button>
              <button @click="removeToolboxEntry(index)" class="btn-danger btn-sm">
                <span class="material-symbols-outlined">delete</span>
                删除
              </button>
            </div>
          </div>
          
          <div v-if="toolboxMap.length === 0" class="empty-state">
            <span class="material-symbols-outlined">inventory_2</span>
            <p>暂无 Toolbox 映射</p>
            <button @click="addToolboxEntry" class="btn-primary">添加第一个 Toolbox</button>
          </div>
        </div>
      </template>

      <template #right-content>
        <div class="toolbox-file-editor">
          <div class="toolbox-editor-controls">
            <span class="editing-file-display">
              <span class="material-symbols-outlined">description</span>
              {{ editingFile || '未选择文件' }}
            </span>
          </div>
          <textarea
            v-model="fileContent"
            spellcheck="false"
            rows="20"
            placeholder="从左侧选择一个 Toolbox 以编辑其关联文件…"
            class="file-content-editor"
          ></textarea>
          <div class="editor-actions">
            <button @click="saveToolboxFile" :disabled="!editingFile" class="btn-success">
              <span class="material-symbols-outlined">save</span>
              保存文件
            </button>
            <span v-if="fileStatus" :class="['status-message', fileStatusType]">{{ fileStatus }}</span>
          </div>
        </div>
      </template>
    </DualPaneEditor>

    <span v-if="mapStatus" :class="['status-message', 'floating-status', mapStatusType]">{{ mapStatus }}</span>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toolboxApi } from '@/api'
import { showMessage } from '@/utils'
import DualPaneEditor from '@/components/DualPaneEditor.vue'

interface ToolboxEntry {
  alias: string
  file: string
  description: string
}

const toolboxMap = ref<ToolboxEntry[]>([])
const editingFile = ref('')
const fileContent = ref('')
const mapStatus = ref('')
const mapStatusType = ref<'info' | 'success' | 'error'>('info')
const fileStatus = ref('')
const fileStatusType = ref<'info' | 'success' | 'error'>('info')

// 加载 Toolbox 映射
async function loadToolboxMap() {
  try {
    const data = await toolboxApi.getToolboxMap({
      showLoader: false,
      loadingKey: 'toolbox.map.load'
    })
    toolboxMap.value = Object.entries(data || {}).map(([alias, value]) => ({
      alias,
      file: value?.file || '',
      description: value?.description || ''
    }))
  } catch (error) {
    console.error('Failed to load toolbox map:', error)
    toolboxMap.value = []
  }
}

// 添加 Toolbox 条目
function addToolboxEntry() {
  toolboxMap.value.push({
    alias: '新工具',
    file: '新文件.txt',
    description: ''
  })
}

// 删除 Toolbox 条目
function removeToolboxEntry(index: number) {
  if (confirm('确定要删除这个 Toolbox 映射吗？')) {
    toolboxMap.value.splice(index, 1)
  }
}

// 保存 Toolbox 映射
async function saveToolboxMap() {
  try {
    const payload = toolboxMap.value.reduce<Record<string, { file: string; description: string }>>((acc, entry) => {
      const alias = entry.alias.trim()
      if (!alias) return acc
      acc[alias] = {
        file: entry.file.trim(),
        description: entry.description || ''
      }
      return acc
    }, {})

    await toolboxApi.saveToolboxMap(payload, {
      loadingKey: 'toolbox.map.save'
    })

    mapStatus.value = 'Toolbox 映射表已保存！'
    mapStatusType.value = 'success'
    showMessage('Toolbox 映射表已保存！', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    mapStatus.value = `保存失败：${errorMessage}`
    mapStatusType.value = 'error'
  }
}

// 创建 Toolbox 文件
async function createToolboxFile() {
  const fileName = prompt('请输入新文件名 (例如：MyTool.txt):')
  if (!fileName) return

  try {
    await toolboxApi.createToolboxFile(fileName, undefined, {
      loadingKey: 'toolbox.file.create'
    })

    showMessage(`文件 ${fileName} 已创建！`, 'success')
    loadToolboxMap()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showMessage(`创建文件失败：${errorMessage}`, 'error')
  }
}

// 选择 Toolbox 文件进行编辑
async function selectToolboxFile(fileName: string) {
  if (!fileName) return

  editingFile.value = fileName
  try {
    fileContent.value = await toolboxApi.getToolboxFile(fileName, {
      showLoader: false,
      loadingKey: 'toolbox.file.load'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showMessage(`加载文件失败：${errorMessage}`, 'error')
  }
}

// 保存 Toolbox 文件
async function saveToolboxFile() {
  if (!editingFile.value) return
  try {
    await toolboxApi.saveToolboxFile(editingFile.value, fileContent.value, {
      loadingKey: 'toolbox.file.save'
    })

    fileStatus.value = '文件已保存！'
    fileStatusType.value = 'success'
    showMessage('文件已保存！', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    fileStatus.value = `保存失败：${errorMessage}`
    fileStatusType.value = 'error'
  }
}

onMounted(() => {
  loadToolboxMap()
})
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

.toolbox-map-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  padding-right: 8px;
}

.toolbox-map-entry {
  padding: 16px;
}

.toolbox-entry-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.toolbox-entry-row label {
  font-size: 13px;
  color: var(--secondary-text);
  font-weight: 500;
}

.toolbox-entry-row input {
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
}

.toolbox-entry-row input:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
}

.toolbox-entry-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.toolbox-file-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 260px);
}

.toolbox-editor-controls {
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
  font-family: 'Consolas', 'Monaco', monospace;
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
  .toolbox-map-list {
    max-height: none;
  }
  
  .toolbox-file-editor {
    height: auto;
  }
  
  .file-content-editor {
    min-height: 300px;
  }
}
</style>
