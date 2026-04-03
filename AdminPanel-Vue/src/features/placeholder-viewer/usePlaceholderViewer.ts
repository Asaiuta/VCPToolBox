import { computed, nextTick, ref } from 'vue'
import { placeholderApi } from '@/api'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'
import type * as DOMPurifyModule from 'dompurify'
import type * as Marked from 'marked'
import type {
  Placeholder,
  PlaceholderDetailTab,
  PlaceholderTypeOption,
  PlaceholderViewMode,
} from './types'

const logger = createLogger('PlaceholderViewer')

let markedModule: typeof Marked | null = null
let dompurifyModule: typeof DOMPurifyModule | null = null

const TYPE_LABELS: Record<string, string> = {
  static_plugin: '静态插件',
  async_placeholder: '动态占位符',
  agent: 'Agent',
  env_tar_var: '环境变量',
  env_sar: '模型专属指令 (SarPrompt)',
  fixed: '固定时间/Port',
  tool_description: '工具描述',
  vcp_all_tools: 'VCPAllTools',
  image_key: 'Image_Key',
  diary: '日记本',
  diary_character: '角色日记本',
}

async function loadMarkdownLibs(): Promise<void> {
  if (markedModule && dompurifyModule) {
    return
  }

  const [marked, DOMPurify] = await Promise.all([
    import('marked'),
    import('dompurify'),
  ])

  markedModule = marked
  dompurifyModule = DOMPurify
}

function renderMarkdown(content: string): string {
  if (!markedModule || !dompurifyModule) {
    logger.warn('Markdown libraries not loaded yet')
    return content
  }

  const parsed = markedModule.marked.parse(content)
  const html = typeof parsed === 'string' ? parsed : content
  return dompurifyModule.default.sanitize(html)
}

export function usePlaceholderViewer() {
  const placeholders = ref<Placeholder[]>([])
  const selectedType = ref('')
  const filterKeyword = ref('')
  const viewMode = ref<PlaceholderViewMode>('grouped')
  const selectedPlaceholder = ref<Placeholder | null>(null)
  const activeTab = ref<PlaceholderDetailTab>('raw')
  const detailContent = ref('')
  const lastFocusedElement = ref<HTMLElement | null>(null)

  function getTypeLabel(type: string): string {
    return TYPE_LABELS[type] || type
  }

  const availableTypes = computed(() => {
    const types = new Set(placeholders.value.map((placeholder) => placeholder.type))
    return Array.from(types).sort()
  })

  const groupedPlaceholders = computed(() => {
    const groups: Record<string, Placeholder[]> = {}
    placeholders.value.forEach((placeholder) => {
      if (!groups[placeholder.type]) {
        groups[placeholder.type] = []
      }

      groups[placeholder.type].push(placeholder)
    })

    return groups
  })

  function getTypeCount(type: string): number {
    return groupedPlaceholders.value[type]?.length || 0
  }

  const typeOptions = computed<PlaceholderTypeOption[]>(() =>
    availableTypes.value.map((type) => ({
      value: type,
      label: getTypeLabel(type),
      count: getTypeCount(type),
    }))
  )

  const filteredTypes = computed(() => {
    if (filterKeyword.value) {
      const keyword = filterKeyword.value.toLowerCase()
      return availableTypes.value.filter((type) => {
        const items = groupedPlaceholders.value[type] || []
        return items.some(
          (item) =>
            item.name.toLowerCase().includes(keyword) ||
            item.preview.toLowerCase().includes(keyword)
        )
      })
    }

    if (selectedType.value) {
      return [selectedType.value]
    }

    return availableTypes.value
  })

  const filteredPlaceholders = computed(() =>
    placeholders.value.filter((placeholder) => {
      if (selectedType.value && placeholder.type !== selectedType.value) {
        return false
      }

      if (!filterKeyword.value) {
        return true
      }

      const keyword = filterKeyword.value.toLowerCase()
      return (
        placeholder.name.toLowerCase().includes(keyword) ||
        placeholder.preview.toLowerCase().includes(keyword)
      )
    })
  )

  const renderedMarkdown = computed(() => {
    if (!selectedPlaceholder.value || !detailContent.value) {
      return ''
    }

    return renderMarkdown(detailContent.value)
  })

  async function loadPlaceholders(): Promise<void> {
    try {
      placeholders.value = await placeholderApi.getPlaceholders(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      showMessage(`加载占位符失败：${errorMessage}`, 'error')
    }
  }

  async function openDetail(placeholder: Placeholder): Promise<void> {
    await loadMarkdownLibs()

    lastFocusedElement.value = document.activeElement as HTMLElement
    selectedPlaceholder.value = placeholder
    activeTab.value = 'raw'
    detailContent.value = '加载中...'

    try {
      const detailValue = await placeholderApi.getPlaceholderDetail(
        placeholder.type,
        placeholder.name,
        false
      )

      detailContent.value = detailValue ?? placeholder.content ?? placeholder.preview
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      detailContent.value = `加载详情失败：${errorMessage}`
      showMessage(`加载详情失败：${errorMessage}`, 'error')
    }
  }

  function closeDetail(): void {
    selectedPlaceholder.value = null

    nextTick(() => {
      lastFocusedElement.value?.focus()
    })
  }

  return {
    viewMode,
    selectedType,
    filterKeyword,
    typeOptions,
    filteredTypes,
    groupedPlaceholders,
    filteredPlaceholders,
    selectedPlaceholder,
    activeTab,
    detailContent,
    renderedMarkdown,
    getTypeLabel,
    loadPlaceholders,
    openDetail,
    closeDetail,
  }
}
