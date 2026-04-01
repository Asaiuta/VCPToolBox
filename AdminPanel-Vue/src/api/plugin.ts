import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";
import type {
  PluginInfo,
  PluginListResponse,
} from "@/types/api.plugin";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export const pluginApi = {
  async getPlugins(uiOptions: ApiUiOptions = false): Promise<PluginInfo[]> {
    const response = await apiFetch<PluginListResponse | PluginInfo[]>(
      "/admin_api/plugins",
      {},
      uiOptions
    );
    if (Array.isArray(response)) {
      return response;
    }
    return response.plugins || [];
  },

  async savePluginConfig(
    pluginName: string,
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    return apiFetch(`/admin_api/plugins/${encodeURIComponent(pluginName)}/config`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }, uiOptions);
  },

  async togglePlugin(
    pluginName: string,
    enable: boolean,
    uiOptions: ApiUiOptions = true
  ): Promise<{ success: boolean; message?: string }> {
    return apiFetch(`/admin_api/plugins/${encodeURIComponent(pluginName)}/toggle`, {
      method: "POST",
      body: JSON.stringify({ enable }),
    }, uiOptions);
  },

  async saveInvocationCommandDescription(
    pluginName: string,
    commandIdentifier: string,
    description: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/plugins/${encodeURIComponent(pluginName)}/commands/${encodeURIComponent(commandIdentifier)}/description`,
      {
        method: "POST",
        body: JSON.stringify({ description }),
      },
      uiOptions
    );
  },
};
