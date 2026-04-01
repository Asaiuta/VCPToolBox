import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface AgentInfo {
  name: string;
  baseName?: string;
  model?: string;
  personality?: string;
  systemPrompt?: string;
  maxOutputTokens?: number;
  temperature?: number;
}

export interface AgentConfigResponse {
  globalSystemPrompt?: string;
  maxHistoryRounds?: number;
  contextTtlHours?: number;
  agents?: AgentInfo[];
}

export interface AgentMapResponse {
  [agentName: string]: string;
}

interface AgentFilesResponse {
  files?: string[];
}

interface AgentScoreHistoryEntry {
  pointsDelta?: number;
  reason?: string;
  time?: string;
}

interface AgentScoreApiEntry {
  name?: string;
  totalPoints?: number;
  history?: AgentScoreHistoryEntry[];
}

export interface AgentScoreSummary {
  baseName: string;
  name: string;
  totalPoints: number;
  history: AgentScoreHistoryEntry[];
}

export const agentApi = {
  async getAgentConfig(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<AgentConfigResponse> {
    return apiFetch("/admin_api/agent-assistant/config", requestInit, uiOptions);
  },

  async saveAgentConfig(
    config: unknown,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    return apiFetch("/admin_api/agent-assistant/config", {
      method: "POST",
      body: JSON.stringify(config),
    }, uiOptions);
  },

  async getAgentMap(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<AgentMapResponse> {
    return apiFetch("/admin_api/agents/map", requestInit, uiOptions);
  },

  async saveAgentMap(
    agentMap: AgentMapResponse,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    return apiFetch("/admin_api/agents/map", {
      method: "POST",
      body: JSON.stringify(agentMap),
    }, uiOptions);
  },

  async getAgentFiles(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<string[]> {
    const response = await apiFetch<AgentFilesResponse | string[]>(
      "/admin_api/agents",
      requestInit,
      uiOptions
    );
    if (Array.isArray(response)) {
      return response;
    }
    return response.files || [];
  },

  async getAgentFileContent(
    filename: string,
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const response = await apiFetch<{ content?: string }>(
      `/admin_api/agents/${encodeURIComponent(filename)}`,
      requestInit,
      uiOptions
    );
    return response.content || "";
  },

  async saveAgentFile(
    filename: string,
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    return apiFetch(`/admin_api/agents/${encodeURIComponent(filename)}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }, uiOptions);
  },

  async createAgentFile(
    filename: string,
    folderPath?: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    return apiFetch("/admin_api/agents/new-file", {
      method: "POST",
      body: JSON.stringify({ fileName: filename, folderPath }),
    }, uiOptions);
  },

  async getAgentScores(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<AgentScoreSummary[]> {
    const response = await apiFetch<Record<string, AgentScoreApiEntry>>(
      "/admin_api/agent-assistant/scores",
      requestInit,
      uiOptions
    );

    return Object.entries(response || {}).map(([baseName, entry]) => ({
      baseName,
      name: entry.name || baseName,
      totalPoints: entry.totalPoints || 0,
      history: Array.isArray(entry.history) ? entry.history : [],
    }));
  },
};
