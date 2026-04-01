import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export type ParamValue = number | number[] | Record<string, number>;
export type ParamGroup = Record<string, ParamValue>;
export type RagParams = Record<string, ParamGroup>;

export interface SemanticGroupData {
  words?: string[];
  auto_learned?: string[];
  weight?: number;
}

export interface SemanticGroupsResponse {
  config?: Record<string, unknown>;
  groups?: Record<string, SemanticGroupData>;
}

export interface ThinkingChainConfig {
  clusters?: string[];
  kSequence?: number[];
}

export interface ThinkingChainsResponse {
  chains?: Record<string, ThinkingChainConfig | string[]>;
}

interface AvailableClustersResponse {
  clusters?: string[];
}

export const ragApi = {
  async getRagParams(uiOptions: ApiUiOptions = false): Promise<RagParams> {
    return apiFetch("/admin_api/rag-params", {}, uiOptions);
  },

  async saveRagParams(
    params: RagParams,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/rag-params",
      {
        method: "POST",
        body: JSON.stringify(params),
      },
      uiOptions
    );
  },

  async getSemanticGroups(
    uiOptions: ApiUiOptions = false
  ): Promise<SemanticGroupsResponse> {
    return apiFetch("/admin_api/semantic-groups", {}, uiOptions);
  },

  async saveSemanticGroups(
    payload: SemanticGroupsResponse,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/semantic-groups",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },

  async getThinkingChains(
    uiOptions: ApiUiOptions = false
  ): Promise<ThinkingChainsResponse> {
    return apiFetch("/admin_api/thinking-chains", {}, uiOptions);
  },

  async saveThinkingChains(
    payload: ThinkingChainsResponse,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/thinking-chains",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },

  async getAvailableClusters(uiOptions: ApiUiOptions = false): Promise<string[]> {
    const response = await apiFetch<AvailableClustersResponse>(
      "/admin_api/available-clusters",
      {},
      uiOptions
    );
    return response.clusters || [];
  },
};
