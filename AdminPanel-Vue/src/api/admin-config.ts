import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface ToolApprovalConfig {
  enabled?: boolean;
  approveAll?: boolean;
  timeout?: number;
  toolList?: string[];
}

export interface Preprocessor {
  name: string;
  displayName?: string;
  description?: string;
}

interface MainConfigResponse {
  content?: string;
}

interface PreprocessorOrderResponse {
  order?: Preprocessor[];
  newOrder?: Preprocessor[];
}

export const adminConfigApi = {
  async getMainConfig(uiOptions: ApiUiOptions = false): Promise<string> {
    const response = await apiFetch<MainConfigResponse>(
      "/admin_api/config/main",
      {},
      uiOptions
    );
    return response.content || "";
  },

  async saveMainConfig(
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/config/main",
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      uiOptions
    );
  },

  async getToolApprovalConfig(
    uiOptions: ApiUiOptions = false
  ): Promise<ToolApprovalConfig> {
    return apiFetch("/admin_api/tool-approval-config", {}, uiOptions);
  },

  async saveToolApprovalConfig(
    config: ToolApprovalConfig,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/tool-approval-config",
      {
        method: "POST",
        body: JSON.stringify(config),
      },
      uiOptions
    );
  },

  async getPreprocessorOrder(
    uiOptions: ApiUiOptions = false
  ): Promise<Preprocessor[]> {
    const response = await apiFetch<PreprocessorOrderResponse>(
      "/admin_api/preprocessors/order",
      {},
      uiOptions
    );
    const order = response.order || response.newOrder;
    return Array.isArray(order) ? order : [];
  },

  async savePreprocessorOrder(
    order: string[],
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/preprocessors/order",
      {
        method: "POST",
        body: JSON.stringify({ order }),
      },
      uiOptions
    );
  },
};
