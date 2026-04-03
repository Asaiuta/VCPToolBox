import { ref, shallowRef, computed } from "vue";
import { toolListApi } from "@/api";
import { showMessage } from "@/utils";
import { createLogger } from "@/utils/logger";
import type { Tool } from "@/features/tool-list/types";

const logger = createLogger("ToolListEditor");

export function useToolListEditor() {
  const loading = ref(true);
  const allTools = ref<Tool[]>([]);
  // 使用 shallowRef 优化 Set 响应式，减少不必要的深度追踪开销
  const selectedTools = shallowRef<Set<string>>(new Set());
  const availableConfigs = ref<string[]>([]);
  const selectedConfig = ref("");
  const searchQuery = ref("");
  const showSelectedOnly = ref(false);
  const includeHeader = ref(true);
  const includeExamples = ref(true);
  const previewContent = ref("");
  const statusMessage = ref("");
  const statusType = ref<"info" | "success" | "error">("info");

  const filteredTools = computed(() => {
    let tools = allTools.value;

    // 搜索过滤
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.pluginName.toLowerCase().includes(query)
      );
    }

    // 已选过滤
    if (showSelectedOnly.value) {
      tools = tools.filter((tool) => selectedTools.value.has(tool.uniqueId));
    }

    return tools;
  });

  function syncSelectedTools(mutator: (set: Set<string>) => void) {
    const nextSet = new Set(selectedTools.value);
    mutator(nextSet);
    selectedTools.value = nextSet;
  }

  async function loadTools() {
    try {
      loading.value = true;
      const toolList = await toolListApi.getTools(false);
      allTools.value = toolList.map((tool, index) => ({
        ...tool,
        uniqueId: tool.uniqueId || `${tool.pluginName}__${tool.name}__${index}`,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("加载工具列表失败:", errorMessage);
      showMessage(`加载失败：${errorMessage}`, "error");
    } finally {
      loading.value = false;
    }
  }

  async function loadConfigs() {
    try {
      availableConfigs.value = await toolListApi.getConfigs(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("加载配置列表失败:", errorMessage);
    }
  }

  function toggleTool(uniqueId: string, checked: boolean) {
    if (checked) {
      syncSelectedTools((set) => set.add(uniqueId));
    } else {
      syncSelectedTools((set) => set.delete(uniqueId));
    }
    updatePreview();
  }

  function selectAll() {
    syncSelectedTools((set) => {
      filteredTools.value.forEach((tool) => {
        set.add(tool.uniqueId);
      });
    });
    updatePreview();
    showMessage("已全选", "success");
  }

  function deselectAll() {
    selectedTools.value = new Set();
    updatePreview();
    showMessage("已清空", "success");
  }

  function onConfigSelectionChange(value: string) {
    selectedConfig.value = value;
    if (value) {
      loadConfig();
    }
  }

  function onIncludeHeaderChange(value: boolean) {
    includeHeader.value = value;
    updatePreview();
  }

  function onIncludeExamplesChange(value: boolean) {
    includeExamples.value = value;
    updatePreview();
  }

  async function loadConfig() {
    if (!selectedConfig.value) return;

    try {
      const tools = await toolListApi.getConfig(selectedConfig.value, {
        showLoader: false,
        loadingKey: "tool-list.config.load",
      });

      selectedTools.value = new Set(tools);
      updatePreview();
      statusMessage.value = "配置已加载";
      statusType.value = "success";
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage.value = `加载失败：${errorMessage}`;
      statusType.value = "error";
    }
  }

  function createConfig() {
    selectedConfig.value = "";
    selectedTools.value = new Set();
    updatePreview();
    statusMessage.value = "请输入新配置名称";
    statusType.value = "info";
  }

  async function deleteConfig() {
    if (!selectedConfig.value) return;
    if (!confirm(`确定要删除配置 "${selectedConfig.value}" 吗？`)) return;

    try {
      await toolListApi.deleteConfig(selectedConfig.value, {
        loadingKey: "tool-list.config.delete",
      });

      await loadConfigs();
      selectedConfig.value = "";
      selectedTools.value = new Set();
      updatePreview();

      statusMessage.value = "配置已删除";
      statusType.value = "success";
      showMessage("配置已删除", "success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage.value = `删除失败：${errorMessage}`;
      statusType.value = "error";
    }
  }

  async function saveConfig() {
    const configName = prompt("请输入配置文件名:", selectedConfig.value || "");
    if (!configName) return;

    try {
      await toolListApi.saveConfig(configName, Array.from(selectedTools.value), {
        loadingKey: "tool-list.config.save",
      });

      await loadConfigs();
      selectedConfig.value = configName;

      statusMessage.value = "配置已保存";
      statusType.value = "success";
      showMessage("配置已保存", "success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      statusMessage.value = `保存失败：${errorMessage}`;
      statusType.value = "error";
    }
  }

  function updatePreview() {
    const tools = allTools.value.filter((tool) => selectedTools.value.has(tool.uniqueId));

    let content = "";

    if (includeHeader.value) {
      content += "# 可用工具列表\n\n";
      content += "以下是当前可用的所有工具：\n\n";
    }

    tools.forEach((tool) => {
      content += `## ${tool.name}\n`;
      content += `**插件**: ${tool.pluginName}\n`;
      if (tool.description) {
        content += `**描述**: ${tool.description}\n`;
      }
      content += "\n";
    });

    if (includeExamples.value) {
      content += "## 使用示例\n\n";
      content += "```\n";
      content += `使用工具：${tools.map((t) => t.name).join(", ")}\n`;
      content += "```\n";
    }

    previewContent.value = content;
  }

  async function copyPreview() {
    try {
      await navigator.clipboard.writeText(previewContent.value);
      showMessage("已复制到剪贴板", "success");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showMessage(`复制失败：${errorMessage}`, "error");
    }
  }

  return {
    loading,
    filteredTools,
    selectedTools,
    searchQuery,
    showSelectedOnly,
    toggleTool,
    selectAll,
    deselectAll,
    availableConfigs,
    selectedConfig,
    statusMessage,
    statusType,
    includeHeader,
    includeExamples,
    previewContent,
    onConfigSelectionChange,
    loadConfig,
    createConfig,
    deleteConfig,
    saveConfig,
    onIncludeHeaderChange,
    onIncludeExamplesChange,
    copyPreview,
    loadTools,
    loadConfigs,
  };
}
