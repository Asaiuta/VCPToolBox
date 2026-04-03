import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";
import type { Tool } from "@/features/tool-list/types";

type ApiUiOptions = boolean | ApiFetchUiOptions;

interface ToolsResponse {
  tools?: Tool[];
}

interface ConfigsResponse {
  configs?: string[];
}

interface ConfigResponse {
  tools?: string[];
}

export const toolListApi = {
  async getTools(uiOptions: ApiUiOptions = false): Promise<Tool[]> {
    const response = await apiFetch<ToolsResponse>(
      "/admin_api/tool-list-editor/tools",
      {},
      uiOptions
    );
    return response.tools || [];
  },

  async getConfigs(uiOptions: ApiUiOptions = false): Promise<string[]> {
    const response = await apiFetch<ConfigsResponse>(
      "/admin_api/tool-list-editor/configs",
      {},
      uiOptions
    );
    return response.configs || [];
  },

  async getConfig(
    name: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string[]> {
    const response = await apiFetch<ConfigResponse>(
      `/admin_api/tool-list-editor/config/${encodeURIComponent(name)}`,
      {},
      uiOptions
    );
    return response.tools || [];
  },

  async saveConfig(
    name: string,
    tools: string[],
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/tool-list-editor/config/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify({ tools }),
      },
      uiOptions
    );
  },

  async deleteConfig(name: string, uiOptions: ApiUiOptions = true): Promise<void> {
    await apiFetch(
      `/admin_api/tool-list-editor/config/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      uiOptions
    );
  },
};
