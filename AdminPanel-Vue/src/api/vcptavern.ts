import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

const API_BASE_URL = "/admin_api/vcptavern";

export type RuleType = "relative" | "depth" | "embed";
export type RulePosition = "before" | "after";
export type RuleTarget = "system" | "last_user";
export type RuleRole = "system" | "user" | "assistant";

export interface RuleContent {
  role: RuleRole;
  content: string;
}

export interface RuleUiState {
  textareaWidth?: string;
  textareaHeight?: string;
}

export interface TavernRule {
  id: string;
  name: string;
  enabled: boolean;
  type: RuleType;
  position?: RulePosition;
  target?: RuleTarget;
  depth?: number;
  content: RuleContent;
  ui?: RuleUiState;
}

export interface TavernPreset {
  description?: string;
  rules?: TavernRule[];
}

export const vcptavernApi = {
  async getPresets(uiOptions: ApiUiOptions = false): Promise<string[]> {
    const response = await apiFetch<unknown>(`${API_BASE_URL}/presets`, {}, uiOptions);
    return Array.isArray(response)
      ? response.filter((item): item is string => typeof item === "string")
      : [];
  },

  async getPreset(
    name: string,
    uiOptions: ApiUiOptions = false
  ): Promise<TavernPreset> {
    return apiFetch(
      `${API_BASE_URL}/presets/${encodeURIComponent(name)}`,
      {},
      uiOptions
    );
  },

  async savePreset(
    name: string,
    payload: TavernPreset,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `${API_BASE_URL}/presets/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },

  async deletePreset(name: string, uiOptions: ApiUiOptions = true): Promise<void> {
    await apiFetch(
      `${API_BASE_URL}/presets/${encodeURIComponent(name)}`,
      { method: "DELETE" },
      uiOptions
    );
  },
};
