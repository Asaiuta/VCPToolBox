import { onMounted, ref } from 'vue'
import { ragApi } from '@/api'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'
import { reorderByDragIndex } from './reorderClusters'

interface ThinkingChain {
  theme: string
  clusters: string[]
  kSequence: number[]
}

const logger = createLogger('ThinkingChainsEditor')

export function useThinkingChainsEditor() {
  const thinkingChains = ref<ThinkingChain[]>([])
  const availableClusters = ref<string[]>([])
  const statusMessage = ref('')
  const statusType = ref<'info' | 'success' | 'error'>('info')

  const draggingItem = ref<{
    type: 'chain' | 'available'
    chainIndex?: number
    clusterIndex?: number
    clusterName?: string
  } | null>(null)

  async function loadThinkingChains() {
    try {
      const data = await ragApi.getThinkingChains({
        showLoader: false,
        loadingKey: 'thinking-chains.load'
      })
      const chainsObj = data.chains || {}

      thinkingChains.value = Object.entries(chainsObj).map(([theme, config]) => {
        let clusters: string[]
        let kSequence: number[]

        if (Array.isArray(config)) {
          clusters = config
          kSequence = new Array(clusters.length).fill(1)
        } else if (config?.clusters) {
          clusters = config.clusters || []
          kSequence = config.kSequence || new Array(clusters.length).fill(1)
        } else {
          clusters = []
          kSequence = []
        }

        return { theme, clusters, kSequence }
      })
    } catch (error) {
      logger.error('Failed to load thinking chains:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      showMessage(`加载思维链失败：${errorMessage}`, 'error')
    }
  }

  async function loadAvailableClusters() {
    try {
      availableClusters.value = await ragApi.getAvailableClusters({
        showLoader: false,
        loadingKey: 'thinking-chains.available-clusters.load'
      })
    } catch (error) {
      logger.error('Failed to load available clusters:', error)
    }
  }

  async function saveThinkingChains() {
    try {
      const chainsObj: Record<string, { clusters: string[]; kSequence: number[] }> = {}
      thinkingChains.value.forEach(chain => {
        chainsObj[chain.theme] = {
          clusters: chain.clusters,
          kSequence: chain.kSequence
        }
      })

      await ragApi.saveThinkingChains(
        { chains: chainsObj },
        {
          loadingKey: 'thinking-chains.save'
        }
      )
      statusMessage.value = '思维链已保存！'
      statusType.value = 'success'
      showMessage('思维链已保存！', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      statusMessage.value = `保存失败：${errorMessage}`
      statusType.value = 'error'
      showMessage(`保存失败：${errorMessage}`, 'error')
    }
  }

  function addThinkingChain() {
    thinkingChains.value.push({
      theme: '新主题',
      clusters: [],
      kSequence: []
    })
  }

  function removeChain(index: number) {
    if (confirm('确定要删除这个思维链主题吗？')) {
      thinkingChains.value.splice(index, 1)
    }
  }

  function removeCluster(chainIndex: number, clusterIndex: number) {
    thinkingChains.value[chainIndex].clusters.splice(clusterIndex, 1)
    thinkingChains.value[chainIndex].kSequence.splice(clusterIndex, 1)
  }

  function addCluster(chainIndex: number, clusterName: string) {
    thinkingChains.value[chainIndex].clusters.push(clusterName)
    thinkingChains.value[chainIndex].kSequence.push(1)
  }

  function handleDragStart(
    event: DragEvent,
    chainIndex: number | null,
    clusterIndex: number | null,
    type: 'chain' | 'available',
    clusterName?: string
  ) {
    draggingItem.value = {
      type,
      chainIndex: chainIndex ?? undefined,
      clusterIndex: clusterIndex ?? undefined,
      clusterName
    }

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function handleDrop(
    event: DragEvent,
    targetChainIndex: number,
    targetClusterIndex: number
  ) {
    event.preventDefault()

    if (!draggingItem.value) return

    const { type, chainIndex, clusterIndex, clusterName } = draggingItem.value

    if (type === 'available' && clusterName) {
      const targetChain = thinkingChains.value[targetChainIndex]
      if (!targetChain.clusters.includes(clusterName)) {
        addCluster(targetChainIndex, clusterName)
      }
    } else if (
      type === 'chain' &&
      chainIndex === targetChainIndex &&
      clusterIndex !== undefined
    ) {
      const targetChain = thinkingChains.value[targetChainIndex]
      const reorderedClusters = reorderByDragIndex(
        targetChain.clusters,
        clusterIndex,
        targetClusterIndex
      )

      if (reorderedClusters.moved) {
        const reorderedKSequence = reorderByDragIndex(
          targetChain.kSequence,
          clusterIndex,
          targetClusterIndex
        )

        targetChain.clusters = reorderedClusters.items
        targetChain.kSequence = reorderedKSequence.items
      }
    }

    draggingItem.value = null
  }

  onMounted(() => {
    loadThinkingChains()
    loadAvailableClusters()
  })

  return {
    thinkingChains,
    availableClusters,
    statusMessage,
    statusType,
    loadThinkingChains,
    loadAvailableClusters,
    saveThinkingChains,
    addThinkingChain,
    removeChain,
    removeCluster,
    addCluster,
    handleDragStart,
    handleDragOver,
    handleDrop
  }
}
