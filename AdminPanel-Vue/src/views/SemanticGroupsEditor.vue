<template>
  <section class="config-section active-section">    <p class="description">管理 RAGDiaryPlugin 使用的语义组。语义组通过关键词激活，将相关的向量注入查询，以提高检索的准确性。</p>
    <div class="semantic-groups-controls">
      <button @click="saveSemanticGroups" class="btn-primary">保存所有更改</button>
      <button @click="addSemanticGroup" class="btn-secondary">添加新组</button>
      <span v-if="statusMessage" :class="['status-message', statusType]">{{ statusMessage }}</span>
    </div>
    <div id="semantic-groups-container">
      <div v-for="(group, index) in semanticGroups" :key="index" class="semantic-group-item card">
        <div class="semantic-group-header">
          <input
            type="text"
            v-model="group.name"
            placeholder="组名称"
            class="group-name-input"
          >
          <button @click="removeGroup(index)" class="btn-danger btn-sm">删除</button>
        </div>
        <div class="semantic-group-keywords">
          <label>关键词（逗号分隔）:</label>
          <textarea
            v-model="group.keywords"
              placeholder="关键词 1, 关键词 2, …"
            rows="3"
          ></textarea>
          <div class="keyword-stats">
            <span class="keyword-count">
              关键词数：{{ group.keywords ? group.keywords.split(',').filter(k => k.trim()).length : 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ragApi } from '@/api'
import { showMessage } from '@/utils'

interface SemanticGroup {
  name: string
  keywords: string
}

const semanticGroups = ref<SemanticGroup[]>([])
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')

async function loadSemanticGroups() {
  try {
    const data = await ragApi.getSemanticGroups({
      showLoader: false,
      loadingKey: 'semantic-groups.load'
    })
    // 后端返回格式：{ config: {}, groups: { "组名": { words: [], auto_learned: [], weight: 1.2, ... } } }
    // 需要转换为前端数组格式
    if (data.groups && typeof data.groups === 'object') {
      semanticGroups.value = Object.entries(data.groups).map(([name, group]) => ({
        name: name,
        keywords: group.words?.join(',') || ''  // 后端使用 words 字段
      }))
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to load semantic groups:', error)
    showMessage(`加载语义组失败：${errorMessage}`, 'error')
  }
}

async function saveSemanticGroups() {
  try {
    // 将前端数组格式转换为后端期望的对象格式
    const groupsObject: Record<string, { words: string[]; auto_learned: string[]; weight: number }> = {}
    semanticGroups.value.forEach(group => {
      groupsObject[group.name] = {
        words: group.keywords.split(',').map(k => k.trim()).filter(k => k),
        auto_learned: [],  // 自动学习的词为空，保留原有逻辑
        weight: 1.0  // 默认权重
      }
    })

    await ragApi.saveSemanticGroups({ groups: groupsObject }, {
      loadingKey: 'semantic-groups.save'
    })
    statusMessage.value = '语义组已保存！'
    statusType.value = 'success'
    showMessage('语义组已保存！', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    statusMessage.value = `保存失败：${errorMessage}`
    statusType.value = 'error'
    showMessage(`保存失败：${errorMessage}`, 'error')
  }
}

function addSemanticGroup() {
  semanticGroups.value.push({
    name: '新语义组',
    keywords: ''
  })
}

function removeGroup(index: number) {
  if (confirm('确定要删除这个语义组吗？')) {
    semanticGroups.value.splice(index, 1)
  }
}

onMounted(() => {
  loadSemanticGroups()
})
</script>

<style scoped>
.semantic-groups-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 1rem;
}

.semantic-group-item {
  margin-bottom: 16px;
}

.semantic-group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.group-name-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
}

.semantic-group-keywords {
  margin-bottom: 12px;
}

.semantic-group-keywords label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--secondary-text);
}

.semantic-group-keywords textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
}

.keyword-stats {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.keyword-count {
  font-size: 0.85em;
  color: var(--secondary-text);
  font-weight: 600;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
</style>
