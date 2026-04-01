import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface DreamLogSummary {
  filename: string;
  agentName?: string;
  timestamp?: string;
  pendingCount?: number;
}

export interface RawDreamOperation {
  operationId?: string | number;
  id?: string | number;
  type?: string;
  status?: string;
  targetDiary?: string;
  sourceDiaries?: string[];
  newContent?: string;
  insightContent?: string;
  targetContent?: string;
}

export interface RawDreamDetail {
  agentName?: string;
  timestamp?: string;
  dreamNarrative?: string;
  operations?: RawDreamOperation[];
}

interface DreamLogsResponse {
  logs?: DreamLogSummary[];
}

export const dreamApi = {
  async getDreamLogSummaries(
    uiOptions: ApiUiOptions = false
  ): Promise<DreamLogSummary[]> {
    const response = await apiFetch<DreamLogsResponse>(
      "/admin_api/dream-logs",
      {},
      uiOptions
    );
    return Array.isArray(response.logs) ? response.logs : [];
  },

  async getDreamLogDetail(
    filename: string,
    uiOptions: ApiUiOptions = false
  ): Promise<RawDreamDetail> {
    return apiFetch(
      `/admin_api/dream-logs/${encodeURIComponent(filename)}`,
      {},
      uiOptions
    );
  },

  async reviewDreamOperation(
    filename: string,
    operationId: string,
    action: "approve" | "reject",
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/dream-logs/${encodeURIComponent(filename)}/operations/${encodeURIComponent(operationId)}`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      },
      uiOptions
    );
  },
};
