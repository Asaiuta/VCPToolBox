import { onMounted, ref } from 'vue'
import { agentApi } from '@/api'
import { showMessage } from '@/utils'
import { createLogger } from '@/utils/logger'
import type { AgentFilesStatusType, AgentMapEntry } from './types'

const logger = createLogger('AgentFilesEditor')

export function useAgentFilesEditor() {
  const agentMap = ref<AgentMapEntry[]>([])
  const availableFiles = ref<string[]>([])
  const isLoadingFiles = ref(false)
  const statusMessage = ref('')
  const statusType = ref<AgentFilesStatusType>('info')
  const editingFile = ref('')
  const fileContent = ref('')
  const fileStatusMessage = ref('')
  const fileStatusType = ref<AgentFilesStatusType>('info')

  async function loadAvailableFiles() {
    isLoadingFiles.value = true
    try {
      availableFiles.value = await agentApi.getAgentFiles({}, {
        showLoader: false,
        loadingKey: 'agent-files.available-files.load',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to load available files:', errorMessage)
      showMessage(`加载文件列表失败：${errorMessage}`, 'error')
      availableFiles.value = []
    } finally {
      isLoadingFiles.value = false
    }
  }

  async function loadAgentMap() {
    try {
      const data = await agentApi.getAgentMap({}, {
        showLoader: false,
        loadingKey: 'agent-files.map.load',
      })
      if (data && typeof data === 'object') {
        agentMap.value = Object.entries(data).map(([name, file]) => ({
          name,
          file: file as string,
        }))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Failed to load agent map:', errorMessage)
      showMessage(`加载 Agent 映射失败：${errorMessage}`, 'error')
    }
  }

  async function saveAgentMap() {
    try {
      const agentMapObject: Record<string, string> = {}
      agentMap.value.forEach((entry) => {
        if (entry.name && entry.file) {
          agentMapObject[entry.name] = entry.file
        }
      })

      await agentApi.saveAgentMap(agentMapObject, {
        loadingKey: 'agent-files.map.save',
      })
      statusMessage.value = 'Agent 映射表已保存！'
      statusType.value = 'success'
      showMessage('Agent 映射表已保存！', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      statusMessage.value = `保存失败：${errorMessage}`
      statusType.value = 'error'
      showMessage(`保存失败：${errorMessage}`, 'error')
    }
  }

  function addAgentEntry() {
    agentMap.value.push({
      name: '新 Agent',
      file: '新文件.txt',
    })
  }

  function removeAgentEntry(index: number) {
    if (confirm('确定要删除这个 Agent 映射吗？')) {
      agentMap.value.splice(index, 1)
    }
  }

  async function createAgentFile() {
    const fileName = prompt('请输入新文件名 (例如：MyAgent.txt):')
    if (!fileName) {
      return
    }

    try {
      await agentApi.createAgentFile(fileName, undefined, {
        loadingKey: 'agent-files.file.create',
      })
      showMessage(`文件 ${fileName} 已创建！`, 'success')
      loadAgentMap()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      showMessage(`创建文件失败：${errorMessage}`, 'error')
    }
  }

  async function selectAgentFile(fileName: string) {
    if (!fileName) {
      return
    }

    editingFile.value = fileName
    try {
      fileContent.value = await agentApi.getAgentFileContent(fileName, {}, {
        showLoader: false,
        loadingKey: 'agent-files.file.load',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      showMessage(`加载文件失败：${errorMessage}`, 'error')
    }
  }

  async function saveAgentFile() {
    if (!editingFile.value) {
      return
    }

    try {
      await agentApi.saveAgentFile(editingFile.value, fileContent.value, {
        loadingKey: 'agent-files.file.save',
      })
      fileStatusMessage.value = '文件已保存！'
      fileStatusType.value = 'success'
      showMessage('文件已保存！', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      fileStatusMessage.value = `保存失败：${errorMessage}`
      fileStatusType.value = 'error'
    }
  }

  onMounted(() => {
    loadAvailableFiles()
    loadAgentMap()
  })

  return {
    agentMap,
    availableFiles,
    isLoadingFiles,
    statusMessage,
    statusType,
    editingFile,
    fileContent,
    fileStatusMessage,
    fileStatusType,
    loadAvailableFiles,
    loadAgentMap,
    saveAgentMap,
    addAgentEntry,
    removeAgentEntry,
    createAgentFile,
    selectAgentFile,
    saveAgentFile,
  }
}
