<template>
  <section class="config-section active-section">    <p class="description">在此管理工具调用的审核机制。开启后，特定的工具调用将需要通过管理面板进行人工确认。</p>
    <div class="card">
      <form @submit.prevent="saveConfig">
        <div class="config-item">
          <label class="switch-container">
            <span>是否开启工具调用审核</span>
            <label class="switch">
              <input type="checkbox" v-model="config.enabled">
              <span class="slider"></span>
            </label>
          </label>
        </div>
        <div class="config-item">
          <label class="switch-container">
            <span>是否开启所有工具调用审核</span>
            <label class="switch">
              <input type="checkbox" v-model="config.approveAll">
              <span class="slider"></span>
            </label>
          </label>
          <p class="aa-hint">如果开启，所有工具调用都将进入审核流程，无论是否在名单中。</p>
        </div>
        <div class="config-item">
          <label for="tool-approval-timeout">设置审核最大等待时间 (分钟)</label>
          <input type="number" id="tool-approval-timeout" v-model.number="config.timeout" min="1" max="60">
          <p class="aa-hint">超时后，该审核请求将自动拒绝。</p>
        </div>
        <div class="config-item">
          <label for="tool-approval-list">被审核工具名单 (每行一个工具名称)</label>
          <textarea id="tool-approval-list" v-model="config.toolList" rows="8" placeholder="例如：&#10;SciCalculator&#10;PowerShellExecutor"></textarea>
          <p class="aa-hint">当"开启所有工具调用审核"关闭时，仅对此名单中的工具进行审核。</p>
        </div>
        <div class="config-footer">
          <button type="submit" class="btn-primary">保存审核配置</button>
          <span v-if="statusMessage" :class="['status-message', statusType]">{{ statusMessage }}</span>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminConfigApi } from '@/api'
import { showMessage } from '@/utils'

const config = ref({
  enabled: false,
  approveAll: false,
  timeout: 5,
  toolList: ''
})
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')

async function loadConfig() {
  try {
    const data = await adminConfigApi.getToolApprovalConfig({
      showLoader: false,
      loadingKey: 'tool-approval.config.load'
    })
    config.value = {
      enabled: data.enabled || false,
      approveAll: data.approveAll || false,
      timeout: data.timeout || 5,
      toolList: (data.toolList || []).join('\n')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to load config:', error)
    showMessage(`加载审核配置失败：${errorMessage}`, 'error')
  }
}

async function saveConfig() {
  try {
    await adminConfigApi.saveToolApprovalConfig({
      enabled: config.value.enabled,
      approveAll: config.value.approveAll,
      timeout: config.value.timeout,
      toolList: config.value.toolList.split('\n').filter(l => l.trim())
    }, {
      loadingKey: 'tool-approval.config.save'
    })
    statusMessage.value = '审核配置已保存！'
    statusType.value = 'success'
    showMessage('审核配置已保存！', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    statusMessage.value = `保存失败：${errorMessage}`
    statusType.value = 'error'
    showMessage(`保存失败：${errorMessage}`, 'error')
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped>
.card {
  padding: 20px;
}

.config-item {
  margin-bottom: 20px;
}

.config-item label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.config-item input[type="number"] {
  width: 100px;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
}

.config-item textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-family: 'Consolas', 'Monaco', monospace;
  resize: vertical;
}

.aa-hint {
  font-size: 13px;
  color: var(--secondary-text);
  margin-top: 6px;
}

.config-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}
</style>
