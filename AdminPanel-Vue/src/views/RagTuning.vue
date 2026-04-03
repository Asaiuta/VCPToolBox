<template>
  <section class="config-section active-section">    <p class="description">在这里，您可以实时调整 TagMemo 算法的各项核心参数。所有更改将立即生效，无需重启服务器。</p>

    <div class="rag-tuning-container">
      <form @submit.prevent="saveParams">
        <!-- 参数分组显示 -->
        <div v-for="(groupParams, groupName) in params" :key="groupName" class="param-group card">
          <h3 class="group-title">
            <span class="material-symbols-outlined">settings_input_component</span>
            {{ groupName }}
          </h3>
          
          <div class="param-grid-container">
            <div v-for="(value, paramKey) in groupParams" :key="paramKey" class="param-item">
              <div class="param-label-row">
                <label :for="`param-${groupName}-${paramKey}`">{{ paramKey }}</label>
                <span class="param-chinese-name">{{ getParamMeta(groupName, paramKey).name }}</span>
              </div>
              
              <div class="param-info-box">
                <div v-if="getParamMeta(groupName, paramKey).meaning" class="param-meaning">
                  <strong>物理意义：</strong>{{ getParamMeta(groupName, paramKey).meaning }}
                </div>
                <div v-if="getParamMeta(groupName, paramKey).logic" class="param-logic">
                  <strong>调优逻辑：</strong>{{ getParamMeta(groupName, paramKey).logic }}
                </div>
                <div v-if="getParamMeta(groupName, paramKey).range" class="param-range-hint">
                  <strong>建议区间：</strong>{{ getParamMeta(groupName, paramKey).range }}
                </div>
              </div>
              
              <div class="param-input-row">
                <!-- 数组类型 -->
                <div v-if="Array.isArray(value)" class="param-range-inputs">
                  <input
                    v-for="(_val, index) in value"
                    :key="`${String(paramKey)}-${index}`"
                    type="number"
                    step="0.001"
                    v-model.number="(groupParams[paramKey] as number[])[index]"
                    :placeholder="`值${index + 1}`"
                  >
                </div>

                <!-- 嵌套对象类型 -->
                <div v-else-if="typeof value === 'object' && value !== null" class="param-nested-group">
                  <div v-for="(_subVal, subKey) in value" :key="subKey" class="sub-param-item">
                    <label>{{ subKey }}</label>
                    <input
                      type="number"
                      step="0.001"
                      v-model.number="(groupParams[paramKey] as Record<string, number>)[subKey]"
                    >
                  </div>
                </div>

                <!-- 普通数字类型 -->
                <input
                  v-else-if="typeof value === 'number'"
                  type="number"
                  step="0.001"
                  v-model.number="groupParams[paramKey]"
                >

                <!-- 其他类型 -->
                <input
                  v-else
                  type="text"
                  v-model="groupParams[paramKey]"
                >
              </div>
            </div>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-primary">保存参数配置</button>
          <button type="button" @click="resetParams" class="btn-secondary">重置更改</button>
          <span v-if="statusMessage" :class="['status-message', statusType]">{{ statusMessage }}</span>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ragApi, type RagParams } from '@/api'
import { showMessage } from '@/utils'

interface ParamMeta {
  name: string
  meaning?: string
  logic?: string
  range?: string
}

// 定义参数类型
const params = ref<RagParams>({})
const originalParams = ref<RagParams>({})
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error'>('info')

// 参数元数据定义
const PARAM_METADATA: Record<string, Record<string, ParamMeta>> = {
  "RAGDiaryPlugin": {
    "noise_penalty": {
      "name": "语义宽度惩罚",
      "meaning": "抵消'语义宽度 (S)'带来的噪音。当用户说话非常发散时，该值决定了我们要多大程度上抑制标签增强。",
      "logic": "调高：算法会变得非常'挑剔'，只有语义非常聚焦时才会触发强增强；调低：算法更宽容，即使对话发散也会尝试寻找关联。",
      "range": "建议区间：0.01 ~ 0.20"
    },
    "tagWeightRange": {
      "name": "标签权重映射区间",
      "meaning": "决定了'标签语义'在最终检索向量中占据的最大能量比例。",
      "logic": "上限调高：检索结果极度向标签靠拢，感应准确时惊艳，偏差时跑题；上限调低：检索更稳健，更依赖原始文本向量。",
      "range": "建议区间：下限 0.01~0.10；上限 0.30~0.60"
    },
    "tagTruncationBase": {
      "name": "标签截断基准",
      "meaning": "在感应阶段，保留前百分之多少的标签。",
      "logic": "调高：保留更多长尾标签，增加召回多样性但可能引入噪音；调低：极度精简，只保留核心标签，检索精度最高。",
      "range": "建议区间：0.4 ~ 0.8"
    },
    "tagTruncationRange": {
      "name": "标签截断动态范围",
      "meaning": "标签截断的上下限范围。",
      "logic": "用于控制标签截断的动态调整空间。",
      "range": "建议区间：0.5 ~ 0.9"
    },
    "timeDecay": {
      "name": "时间衰减控制",
      "meaning": "实现'近因效应'，让越久的记忆权重衰减越快。",
      "logic": "halfLifeDays (半衰期)：记忆分数减半的天数。支持精准衰减：::TimeDecay[天数]/[最小分数]/[目标 Tags]，仅包含目标标签的内容（如 Box）才会衰减，其余（如 Wiki）保持原分。",
      "range": "建议区间：半衰期 15~90 天；最小分数 0.5。此处仅作为全局回退值。"
    },
    "mainSearchWeights": {
      "name": "主搜索权重分配",
      "meaning": "决定了主对话搜索时，用户输入和 AI 意图在最终向量中的占比。",
      "logic": "第一个值是用户权重，第二个是 AI 权重。调高用户权重会让检索更贴合当前问题；调高 AI 权重则更贴合 AI 的上下文意图。",
      "range": "建议区间：[0.7, 0.3] 或 [0.8, 0.2]"
    },
    "refreshWeights": {
      "name": "流内刷新权重分配",
      "meaning": "工具调用刷新日记区块时，用户、AI 和工具结果的占比。",
      "logic": "依次为 [用户，AI, 工具]。调高工具权重会让刷新内容更贴合刚执行完的任务结果。",
      "range": "建议区间：[0.5, 0.35, 0.15]"
    },
    "metaThinkingWeights": {
      "name": "元思考递归权重",
      "meaning": "元思考链推理时，原始查询与上一轮推理结果的融合比例。",
      "logic": "第一个值是原始查询权重，第二个是推理结果权重。调高推理结果权重会增强递归深度，但可能导致语义漂移。",
      "range": "建议区间：[0.8, 0.2]"
    }
  },
  "KnowledgeBaseManager": {
    "activationMultiplier": {
      "name": "金字塔激活增益",
      "meaning": "决定了残差金字塔发现的'新颖特征'对最终权重的贡献度。",
      "logic": "缩放值调高：对对话中的'新信息'反应更剧烈，检索结果迅速转向新出现的关键词；缩放值调低：算法更迟钝，倾向于维持长期语义重心。",
      "range": "建议区间：基础值 0.2~0.8；缩放值 1.0~2.5"
    },
    "dynamicBoostRange": {
      "name": "动态增强修正",
      "meaning": "后端根据 EPA（逻辑深度/共振）分析结果，对前端传入权重的二次修正。",
      "logic": "上限调高：在逻辑严密或产生强烈共振时，允许标签权重突破天际；下限调低：在对话逻辑混乱时，几乎完全关闭标签增强。",
      "range": "建议区间：下限 0.1~0.5；上限 1.5~3.0"
    },
    "coreBoostRange": {
      "name": "核心标签聚光灯",
      "meaning": "对用户手动指定的 coreTags 的额外能量加权。",
      "logic": "调高：给予手动标签'特权'，检索结果强行向该标签对齐；调低：手动标签仅作为参考，不破坏整体语义平衡。",
      "range": "建议区间：1.10 ~ 2.00"
    },
    "deduplicationThreshold": {
      "name": "语义去重阈值",
      "meaning": "两个标签之间余弦相似度超过多少时合并。",
      "logic": "调高：几乎不去重，保留所有细微差别的词，标签云会很拥挤；调低：强力去重，语义接近的词会被大量合并，标签云更清爽。",
      "range": "建议区间：0.80 ~ 0.95"
    },
    "techTagThreshold": {
      "name": "技术噪音门槛",
      "meaning": "英文/技术词汇在非技术语境下的生存门槛。",
      "logic": "调高：强力过滤，对话中偶尔出现的代码片段、文件名等不会干扰 RAG；调低：允许更多技术词汇参与检索。",
      "range": "建议区间：0.02 ~ 0.20"
    },
    "normalTagThreshold": {
      "name": "普通标签门槛",
      "meaning": "普通词汇参与 RAG 增强的最低激活阈值。",
      "logic": "用于过滤低相关性的普通词汇。",
      "range": "建议区间：0.01 ~ 0.05"
    },
    "languageCompensator": {
      "name": "语言补偿器",
      "meaning": "针对跨语言或领域不匹配时的惩罚系数，主要用于抑制非技术语境下的技术词汇噪音。",
      "logic": "值越小惩罚越重。penaltyUnknown 用于无法识别语境时；penaltyCrossDomain 用于语境明确但与标签领域冲突时。",
      "range": "建议区间：0.01 ~ 0.50 (默认 0.05/0.10)"
    }
  }
}

function getParamMeta(groupName: string, paramKey: string): ParamMeta {
  return PARAM_METADATA[groupName]?.[paramKey] || {
    name: paramKey,
    meaning: '',
    logic: '',
    range: ''
  }
}

async function loadParams() {
  try {
    const data = await ragApi.getRagParams({
      showLoader: false,
      loadingKey: 'rag-tuning.params.load'
    })
    params.value = structuredClone(data)
    originalParams.value = structuredClone(data)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Failed to load RAG params:', error)
    showMessage(`加载参数失败：${errorMessage}`, 'error')
  }
}

async function saveParams() {
  try {
    await ragApi.saveRagParams(params.value, {
      loadingKey: 'rag-tuning.params.save'
    })
    statusMessage.value = 'RAG 参数已保存！'
    statusType.value = 'success'
    showMessage('RAG 参数已保存！', 'success')
    originalParams.value = structuredClone(params.value)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    statusMessage.value = `保存失败：${errorMessage}`
    statusType.value = 'error'
    showMessage(`保存失败：${errorMessage}`, 'error')
  }
}

function resetParams() {
  params.value = JSON.parse(JSON.stringify(originalParams.value))
  statusMessage.value = '已重置为原始值'
  statusType.value = 'info'
}

onMounted(() => {
  loadParams()
})
</script>

<style scoped>
.rag-tuning-container {
  width: 100%;
  max-width: 100%;
}

.param-group {
  margin-bottom: 24px;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 1.2em;
  color: var(--primary-text);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: 12px;
}

.group-title .material-symbols-outlined {
  font-size: 24px !important;
  color: var(--highlight-text);
}

.param-grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  width: 100%;
  align-items: stretch;
}

.param-item {
  padding: 16px;
  background: var(--tertiary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.param-item:hover {
  border-color: var(--highlight-text);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
}

.param-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
  flex-shrink: 0;
}

.param-label-row label {
  font-weight: 600;
  color: var(--primary-text);
  font-size: 0.95em;
}

.param-chinese-name {
  font-size: 0.85em;
  color: var(--secondary-text);
  font-weight: 500;
  white-space: nowrap;
}

.param-info-box {
  margin-bottom: 12px;
  padding: 10px;
  background: var(--input-bg);
  border-radius: 6px;
  font-size: 0.85em;
  line-height: 1.5;
  flex-shrink: 0;
}

.param-meaning,
.param-logic,
.param-range-hint {
  margin-bottom: 6px;
  color: var(--secondary-text);
}

.param-meaning:last-child,
.param-logic:last-child,
.param-range-hint:last-child {
  margin-bottom: 0;
}

.param-meaning strong,
.param-logic strong,
.param-range-hint strong {
  color: var(--primary-text);
}

.param-input-row {
  margin-top: auto;
  flex-shrink: 0;
}

.param-input-row input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 0.9em;
  font-family: inherit;
  box-sizing: border-box;
}

.param-input-row input:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
  box-shadow: 0 0 0 2px var(--primary-color-translucent);
}

.param-input-row input:focus:not(:focus-visible) {
  border-color: var(--highlight-text);
  box-shadow: 0 0 0 2px var(--primary-color-translucent);
}

.param-range-inputs {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.param-range-inputs input {
  flex: 1;
  text-align: center;
}

.param-nested-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-param-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-param-item label {
  font-size: 0.85em;
  color: var(--secondary-text);
  font-weight: 600;
  min-width: 80px;
}

.sub-param-item input {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .param-grid-container {
    grid-template-columns: 1fr;
  }
  
  .param-label-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .param-range-inputs {
    flex-direction: column;
  }
}
</style>
