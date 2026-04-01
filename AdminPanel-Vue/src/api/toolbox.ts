import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface ToolboxValue {
  file?: string;
  description?: string;
}

interface ToolboxFileResponse {
  content?: string;
}

export const toolboxApi = {
  async getToolboxMap(
    uiOptions: ApiUiOptions = false
  ): Promise<Record<string, ToolboxValue>> {
    return apiFetch("/admin_api/toolbox/map", {}, uiOptions);
  },

  async saveToolboxMap(
    payload: Record<string, { file: string; description: string }>,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/toolbox/map",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },

  async createToolboxFile(
    fileName: string,
    folderPath?: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/toolbox/new-file",
      {
        method: "POST",
        body: JSON.stringify({ fileName, folderPath }),
      },
      uiOptions
    );
  },

  async getToolboxFile(
    fileName: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const response = await apiFetch<ToolboxFileResponse>(
      `/admin_api/toolbox/file/${encodeURIComponent(fileName)}`,
      {},
      uiOptions
    );
    return response.content || "";
  },

  async saveToolboxFile(
    fileName: string,
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/toolbox/file/${encodeURIComponent(fileName)}`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      uiOptions
    );
  },
};
