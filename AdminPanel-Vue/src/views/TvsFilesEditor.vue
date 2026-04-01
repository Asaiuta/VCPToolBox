<template>
  <section class="config-section active-section">    <div class="tvs-editor-controls">
      <label for="tvs-file-select">选择变量文件:</label>
      <select id="tvs-file-select" v-model="selectedFile" @change="loadFileContent">
        <option value="">请选择一个文件…</option>
        <option v-for="file in files" :key="file" :value="file">{{ file }}</option>
      </select>
      <button @click="saveFile" :disabled="!selectedFile" class="btn-success">保存变量文件</button>
      <span v-if="statusMessage" :class="['status-message', statusType]">{{ statusMessage }}</span>
    </div>
    <textarea 
      id="tvs-file-content-editor" 
      v-model="fileContent" 
      spellcheck="false"
      placeholder="选择一个变量文件以编辑其内容…"
      rows="25"
    ></textarea>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { tvsApi } from '@/api'
import { showMessage } from '@/utils'

const files = ref<string[]>([])
const selectedFile = ref('')
const fileContent = ref('')
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')

async function loadFiles() {
  try {
    files.value = await tvsApi.getTvsFiles({
      showLoader: false,
      loadingKey: 'tvs-files.list.load'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showMessage(`加载文件列表失败：${errorMessage}`, 'error')
  }
}

async function loadFileContent() {
  if (!selectedFile.value) {
    fileContent.value = ''
    return
  }

  try {
    fileContent.value = await tvsApi.getTvsFileContent(selectedFile.value, {
      showLoader: false,
      loadingKey: 'tvs-files.content.load'
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    showMessage(`加载文件失败：${errorMessage}`, 'error')
  }
}

async function saveFile() {
  if (!selectedFile.value) return

  try {
    await tvsApi.saveTvsFile(selectedFile.value, fileContent.value, {
      loadingKey: 'tvs-files.content.save'
    })
    statusMessage.value = '文件已保存！'
    statusType.value = 'success'
    showMessage('文件已保存！', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    statusMessage.value = `保存失败：${errorMessage}`
    statusType.value = 'error'
  }
}

onMounted(() => {
  loadFiles()
})
</script>

<style scoped>
.tvs-editor-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.tvs-editor-controls select {
  flex: 1;
  max-width: 400px;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
}

textarea#tvs-file-content-editor {
  width: 100%;
  font-family: 'Consolas', 'Monaco', monospace;
}
</style>
