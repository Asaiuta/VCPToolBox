import { onMounted, ref } from 'vue'
import { adminConfigApi } from '@/api'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'
import type { Preprocessor } from '@/api'

interface PreprocessorApiItem {
  name: string
  displayName?: string
  description?: string
}

const logger = createLogger('PreprocessorOrderManager')

export function usePreprocessorOrderManager() {
  const preprocessors = ref<Preprocessor[]>([])
  const draggingIndex = ref<number | null>(null)
  const statusMessage = ref('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  async function loadPreprocessors() {
    try {
      logger.debug('Loading preprocessors...')

      const order = await adminConfigApi.getPreprocessorOrder({
        showLoader: false,
        loadingKey: 'preprocessors.order.load'
      })
      logger.debug('Preprocessor order data:', order)

      if (!Array.isArray(order)) {
        logger.error('Preprocessor order API did not return an array:', order)
        showMessage('获取预处理器列表失败：返回数据格式错误', 'error')
        preprocessors.value = []
        return
      }

      if (order.length === 0) {
        showMessage('未找到预处理器插件。', 'info')
        preprocessors.value = []
        return
      }

      logger.debug(`Found ${order.length} preprocessors:`, order)

      preprocessors.value = order.map((item: PreprocessorApiItem) => ({
        name: item.name,
        displayName: item.displayName || item.name,
        description: item.description
      }))

      logger.debug('Final preprocessors:', preprocessors.value)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to load preprocessors:', error)
      showMessage(`加载预处理器列表失败：${errorMessage}`, 'error')
      preprocessors.value = []
    }
  }

  function onDragStart(event: DragEvent, index: number) {
    draggingIndex.value = index
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function onDrop(event: DragEvent, toIndex: number) {
    event.preventDefault()
    const fromIndex = draggingIndex.value
    if (fromIndex === null || fromIndex === toIndex) return

    const item = preprocessors.value[fromIndex]
    preprocessors.value.splice(fromIndex, 1)
    preprocessors.value.splice(toIndex, 0, item)
  }

  function onDragEnd() {
    draggingIndex.value = null
  }

  async function saveOrder() {
    try {
      await adminConfigApi.savePreprocessorOrder(preprocessors.value.map(p => p.name), {
        loadingKey: 'preprocessors.order.save'
      })
      statusMessage.value = '顺序已保存！'
      statusType.value = 'success'
      showMessage('顺序已保存！', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      statusMessage.value = `保存失败：${errorMessage}`
      statusType.value = 'error'
    }
  }

  onMounted(() => {
    loadPreprocessors()
  })

  return {
    preprocessors,
    draggingIndex,
    statusMessage,
    statusType,
    loadPreprocessors,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    saveOrder
  }
}
