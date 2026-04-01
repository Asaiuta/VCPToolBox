import { onMounted, reactive, ref } from 'vue'
import { vcptavernApi } from '@/api'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'
import type {
  RuleRole,
  TavernPreset,
  TavernRule
} from '@/api'
const logger = createLogger('VcptavernEditor')

export function useVcptavernEditor() {
  const presetNames = ref<string[]>([])
  const selectedPresetName = ref('')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isEditorVisible = ref(false)
  const isNewPreset = ref(false)

  const dragState = reactive({
    enabledIndex: -1,
    draggingIndex: -1
  })

  const editorState = reactive({
    name: '',
    description: '',
    rules: [] as TavernRule[]
  })

  function newRule(): TavernRule {
    return {
      id: `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: '新规则',
      enabled: true,
      type: 'relative',
      position: 'before',
      target: 'system',
      depth: 1,
      content: {
        role: 'system',
        content: ''
      },
      ui: {
        textareaWidth: '',
        textareaHeight: ''
      }
    }
  }

  function normalizeRule(rule: Partial<TavernRule>): TavernRule {
    const base = newRule()
    return {
      ...base,
      ...rule,
      id: rule.id || base.id,
      content: {
        role: (rule.content?.role as RuleRole) || base.content.role,
        content: rule.content?.content || ''
      }
    }
  }

  async function fetchPresets() {
    isLoading.value = true
    try {
      const list = await vcptavernApi.getPresets({
        showLoader: false,
        loadingKey: 'vcptavern.presets.load'
      })
      presetNames.value = list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('获取预设列表失败:', error)
      showMessage(`获取预设列表失败：${errorMessage}`, 'error')
    } finally {
      isLoading.value = false
    }
  }

  async function loadPreset(name: string) {
    if (!name) {
      return
    }

    isLoading.value = true
    try {
      const data = await vcptavernApi.getPreset(name, {
        showLoader: false,
        loadingKey: 'vcptavern.preset.load'
      })
      editorState.name = name
      editorState.description = data.description || ''
      editorState.rules = (data.rules || []).map((rule) => normalizeRule(rule))
      isEditorVisible.value = true
      isNewPreset.value = false
      showMessage(`已加载预设：${name}`, 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('加载预设失败:', error)
      showMessage(`加载预设失败：${errorMessage}`, 'error')
    } finally {
      isLoading.value = false
    }
  }

  function createNewPreset() {
    selectedPresetName.value = ''
    editorState.name = ''
    editorState.description = ''
    editorState.rules = []
    isEditorVisible.value = true
    isNewPreset.value = true
  }

  function addRule() {
    editorState.rules.push(newRule())
  }

  function removeRule(index: number) {
    editorState.rules.splice(index, 1)
  }

  function prepareDrag(index: number, event: MouseEvent) {
    const target = event.target as HTMLElement | null
    dragState.enabledIndex = target?.closest('.drag-handle') ? index : -1
  }

  function onDragStart(index: number, event: DragEvent) {
    if (dragState.enabledIndex !== index) {
      event.preventDefault()
      return
    }
    dragState.draggingIndex = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function onDrop(targetIndex: number) {
    const sourceIndex = dragState.draggingIndex
    if (sourceIndex < 0 || sourceIndex === targetIndex) {
      return
    }

    const dragged = editorState.rules[sourceIndex]
    editorState.rules.splice(sourceIndex, 1)
    editorState.rules.splice(targetIndex, 0, dragged)
  }

  function onDragEnd() {
    dragState.enabledIndex = -1
    dragState.draggingIndex = -1
  }

  async function deletePreset() {
    const name = selectedPresetName.value
    if (!name) {
      return
    }

    if (!confirm(`确定要删除预设 "${name}" 吗？此操作不可撤销。`)) {
      return
    }

    isLoading.value = true
    try {
      await vcptavernApi.deletePreset(name, {
        loadingKey: 'vcptavern.preset.delete'
      })
      showMessage('预设删除成功', 'success')
      createNewPreset()
      isEditorVisible.value = false
      await fetchPresets()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('删除预设失败:', error)
      showMessage(`删除预设失败：${errorMessage}`, 'error')
    } finally {
      isLoading.value = false
    }
  }

  function validatePresetName(name: string): boolean {
    return /^[a-zA-Z0-9_-]+$/.test(name)
  }

  async function savePreset() {
    const name = editorState.name.trim()
    if (!name) {
      showMessage('请输入预设名称', 'error')
      return
    }

    if (!validatePresetName(name)) {
      showMessage('预设名称只能包含字母、数字、下划线和连字符', 'error')
      return
    }

    isSaving.value = true
    try {
      const payload: TavernPreset = {
        description: editorState.description.trim(),
        rules: editorState.rules.map((rule) => {
          const normalized = normalizeRule(rule)
          if (normalized.type !== 'depth') {
            delete normalized.depth
          }
          if (normalized.type === 'depth') {
            delete normalized.position
            delete normalized.target
          }
          if (normalized.type === 'embed') {
            normalized.content.role = 'system'
          }
          return normalized
        })
      }

      await vcptavernApi.savePreset(name, payload, {
        loadingKey: 'vcptavern.preset.save'
      })

      showMessage('预设保存成功', 'success')
      selectedPresetName.value = name
      isNewPreset.value = false
      await fetchPresets()
      await loadPreset(name)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('保存预设失败:', error)
      showMessage(`保存预设失败：${errorMessage}`, 'error')
    } finally {
      isSaving.value = false
    }
  }

  onMounted(async () => {
    await fetchPresets()
  })

  return {
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
    savePreset
  }
}
