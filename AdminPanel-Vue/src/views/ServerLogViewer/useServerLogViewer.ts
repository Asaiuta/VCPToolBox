import { computed, nextTick, onMounted, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { systemApi } from '@/api'
import { usePolling } from '@/composables/usePolling'
import { useVirtualScroll } from '@/composables/useVirtualScroll'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ServerLogViewer')

const LINE_HEIGHT = 22
const OVERSCAN = 20
const LOG_RETRY_OPTIONS = {
  maxRetries: 2,
  retryDelay: 500
} as const

function normalizeLogContent(content: string): string {
  return content.replace(/\r\n/g, '\n')
}

export function useServerLogViewer() {
  const logPath = ref('加载中…')
  const logLines = ref<string[]>([])
  const filterText = ref('')
  const logLimit = ref(5000)
  const isReverse = ref(false)
  const autoScroll = ref(true)
  const showScrollToBottom = ref(false)
  const isLoading = ref(false)
  const logOffset = ref(0)
  const isIncrementalReady = ref(false)
  const pendingLineFragment = ref('')

  const logContainerRef = ref<HTMLElement | null>(null)
  let containerHeight = 600

  const filteredLines = computed(() => {
    const keyword = filterText.value.trim()
    const source = keyword
      ? logLines.value.filter(line => line.includes(keyword))
      : logLines.value

    const limited =
      source.length > logLimit.value
        ? source.slice(-logLimit.value)
        : source

    if (isReverse.value) {
      return [...limited].reverse()
    }

    return limited
  })

  const displayedLines = computed(() =>
    filteredLines.value.map((content, index) => ({ index, content }))
  )

  const {
    visibleItems: visibleLines,
    totalHeight,
    offsetY,
    onScroll,
    setScrollTop
  } = useVirtualScroll(displayedLines, {
    itemHeight: LINE_HEIGHT,
    containerHeight,
    overscan: OVERSCAN
  })

  const totalLines = computed(() => logLines.value.length)

  function handleFilter() {
    setScrollTop(0)
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = 0
    }
  }

  function handleScroll(event: Event) {
    const target = event.target as HTMLElement
    const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight)
    if (target.scrollTop > maxScroll) {
      target.scrollTop = maxScroll
    }

    onScroll(event)

    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    const isNearBottom = scrollBottom < 100
    showScrollToBottom.value = !isNearBottom && autoScroll.value
  }

  function scrollToBottom() {
    if (logContainerRef.value) {
      logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight
      showScrollToBottom.value = false
    }
  }

  function toggleAutoScroll() {
    autoScroll.value = !autoScroll.value
    if (autoScroll.value) {
      nextTick(() => scrollToBottom())
    }
  }

  function toggleReverse() {
    isReverse.value = !isReverse.value
  }

  function copyLog() {
    const text = displayedLines.value.map(line => line.content).join('\n')
    navigator.clipboard.writeText(text)
    showMessage('日志已复制到剪贴板', 'success')
  }

  function clearLog() {
    if (confirm('确定要清空日志显示吗？（这不会删除实际日志文件）')) {
      logLines.value = []
      logOffset.value = 0
      isIncrementalReady.value = false
      pendingLineFragment.value = ''
      showMessage('日志显示已清空', 'success')
    }
  }

  function getLineClass(content: string): string {
    if (content.includes('[ERROR]') || content.includes(' ERROR ') || content.includes('error:')) {
      return 'log-error'
    }
    if (content.includes('[WARN]') || content.includes(' WARN ') || content.includes('warning:')) {
      return 'log-warn'
    }
    if (content.includes('[INFO]') || content.includes(' INFO ')) {
      return 'log-info'
    }
    if (content.includes('[DEBUG]') || content.includes(' DEBUG ')) {
      return 'log-debug'
    }
    return 'log-normal'
  }

  function highlightText(text: string): string {
    if (!filterText.value) return text

    const escaped = filterText.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    const highlighted = text.replace(regex, '<mark>$1</mark>')
    return DOMPurify.sanitize(highlighted)
  }

  function trimLogLines(lines: string[]): string[] {
    return lines.length > logLimit.value
      ? lines.slice(-logLimit.value)
      : lines
  }

  function splitLogChunk(content: string, carry = ''): {
    completeLines: string[]
    displayedLines: string[]
    trailingFragment: string
  } {
    const normalized = normalizeLogContent(content)
    const combined = `${carry}${normalized}`
    const segments = combined.split('\n')
    const endsWithNewline = combined.endsWith('\n')

    if (endsWithNewline && segments[segments.length - 1] === '') {
      segments.pop()
    }

    const trailingFragment = endsWithNewline ? '' : (segments.pop() ?? '')
    const displayedLines = trailingFragment
      ? [...segments, trailingFragment]
      : segments

    return {
      completeLines: segments,
      displayedLines,
      trailingFragment
    }
  }

  function applyFullLogSnapshot(data: Awaited<ReturnType<typeof systemApi.getServerLog>>) {
    const { displayedLines, trailingFragment } = splitLogChunk(data.content || '')

    logLines.value = trimLogLines(displayedLines)
    pendingLineFragment.value = trailingFragment
    logOffset.value = data.offset ?? data.fileSize ?? normalizeLogContent(data.content || '').length
    logPath.value = data.path || '未知'
    isIncrementalReady.value = true
  }

  function appendIncrementalLogSnapshot(
    data: Awaited<ReturnType<typeof systemApi.getIncrementalServerLog>>
  ): boolean {
    logPath.value = data.path || logPath.value || '未知'
    logOffset.value = data.offset ?? data.fileSize ?? logOffset.value

    const incrementalContent = data.content || ''
    if (!incrementalContent) {
      return false
    }

    const existingLines =
      pendingLineFragment.value && logLines.value.length > 0
        ? logLines.value.slice(0, -1)
        : logLines.value
    const { displayedLines, trailingFragment } = splitLogChunk(
      incrementalContent,
      pendingLineFragment.value
    )

    pendingLineFragment.value = trailingFragment
    logLines.value = trimLogLines([...existingLines, ...displayedLines])
    return displayedLines.length > 0
  }

  async function loadFullLog(): Promise<boolean> {
    const data = await systemApi.getServerLog({}, false, LOG_RETRY_OPTIONS)
    applyFullLogSnapshot(data)
    return logLines.value.length > 0
  }

  async function loadIncrementalLog(): Promise<boolean> {
    const data = await systemApi.getIncrementalServerLog(
      logOffset.value,
      {},
      false,
      LOG_RETRY_OPTIONS
    )

    if (data.needFullReload) {
      return loadFullLog()
    }

    return appendIncrementalLogSnapshot(data)
  }

  async function loadLog() {
    isLoading.value = true
    try {
      const hasNewContent = isIncrementalReady.value
        ? await loadIncrementalLog()
        : await loadFullLog()

      if (autoScroll.value && hasNewContent) {
        await nextTick()
        scrollToBottom()
      }
    } catch (error) {
      if (logPath.value === '加载中…') {
        const errorMessage = error instanceof Error ? error.message : String(error)
        showMessage(`加载日志失败：${errorMessage}`, 'error')
      } else {
        logger.warn('Failed to load log:', error instanceof Error ? error.message : String(error))
      }
    } finally {
      isLoading.value = false
    }
  }

  watch(() => logLines.value.length, () => {
    if (logContainerRef.value) {
      const rect = logContainerRef.value.getBoundingClientRect()
      containerHeight = rect.height || 600
    }
  }, { flush: 'post' })

  const logPolling = usePolling(loadLog, {
    interval: 3000,
    immediate: true,
    onError: (error) => {
      logger.warn('polling failed:', error)
    }
  })

  onMounted(() => {
    logPolling.start()
  })

  return {
    logPath,
    logLines,
    filterText,
    logLimit,
    isReverse,
    autoScroll,
    showScrollToBottom,
    isLoading,
    logContainerRef,
    filteredLines,
    displayedLines,
    visibleLines,
    totalHeight,
    offsetY,
    totalLines,
    handleFilter,
    handleScroll,
    scrollToBottom,
    toggleAutoScroll,
    toggleReverse,
    copyLog,
    clearLog,
    getLineClass,
    highlightText,
    loadLog
  }
}
