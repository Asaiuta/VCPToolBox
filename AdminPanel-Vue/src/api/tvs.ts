import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

interface TvsFilesResponse {
  files?: string[];
}

interface TvsFileContentResponse {
  content?: string;
}

export const tvsApi = {
  async getTvsFiles(uiOptions: ApiUiOptions = false): Promise<string[]> {
    const response = await apiFetch<TvsFilesResponse>(
      "/admin_api/tvsvars",
      {},
      uiOptions
    );
    return response.files || [];
  },

  async getTvsFileContent(
    fileName: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const response = await apiFetch<TvsFileContentResponse>(
      `/admin_api/tvsvars/${encodeURIComponent(fileName)}`,
      {},
      uiOptions
    );
    return response.content || "";
  },

  async saveTvsFile(
    fileName: string,
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/tvsvars/${encodeURIComponent(fileName)}`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      uiOptions
    );
  },
};
