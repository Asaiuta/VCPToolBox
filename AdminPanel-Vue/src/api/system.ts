import {
  apiFetch,
  fetchWithRetry,
  type ApiFetchUiOptions,
  type RetryOptions,
} from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface SystemResourcesResponse {
  cpu: {
    usage: number;
    cores: number;
    model?: string;
  };
  memory: {
    used: number;
    total: number;
    free?: number;
    usage: number;
  };
  nodeProcess: {
    pid: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      [key: string]: number;
    };
    uptime: number;
    version: string;
    platform: string;
    arch: string;
  };
}

export interface PM2ProcessInfo {
  name: string;
  pid: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
  restarts: number;
}

export interface UserAuthCodeResponse {
  code: string;
}

interface RawSystemResourcesResponse {
  success?: boolean;
  system: {
    cpu: {
      usage: number;
      cores: number;
      model?: string;
    };
    memory: {
      used: number;
      total: number;
      free?: number;
    };
    nodeProcess: {
      pid: number;
      memory: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        [key: string]: number;
      };
      uptime: number;
      version: string;
      platform: string;
      arch: string;
    };
  };
}

interface PM2ProcessesResponse {
  processes?: PM2ProcessInfo[];
}

export interface ServerLogResponse {
  content?: string;
  offset?: number;
  path?: string;
  fileSize?: number;
  needFullReload?: boolean;
}

export interface ServerLogQuery {
  incremental?: boolean;
  offset?: number;
}

function buildServerLogUrl(query: ServerLogQuery = {}): string {
  const params = new URLSearchParams();

  if (query.incremental) {
    params.set("incremental", "true");
  }

  if (
    typeof query.offset === "number" &&
    Number.isFinite(query.offset) &&
    query.offset >= 0
  ) {
    params.set("offset", String(Math.floor(query.offset)));
  }

  const serialized = params.toString();
  return serialized
    ? `/admin_api/server-log?${serialized}`
    : "/admin_api/server-log";
}

async function fetchServerLog(
  query: ServerLogQuery,
  requestInit: RequestInit,
  uiOptions: ApiUiOptions,
  retryOptions?: RetryOptions
): Promise<ServerLogResponse> {
  const url = buildServerLogUrl(query);

  if (retryOptions) {
    return fetchWithRetry(url, requestInit, retryOptions) as Promise<ServerLogResponse>;
  }

  return apiFetch(url, requestInit, uiOptions);
}

function normalizeSystemResources(
  response: RawSystemResourcesResponse
): SystemResourcesResponse {
  const total = response.system.memory.total || 0;
  const used = response.system.memory.used || 0;

  return {
    cpu: response.system.cpu,
    memory: {
      ...response.system.memory,
      usage: total > 0 ? (used / total) * 100 : 0,
    },
    nodeProcess: response.system.nodeProcess,
  };
}

export const systemApi = {
  async getSystemResources(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<SystemResourcesResponse> {
    const response = await apiFetch<RawSystemResourcesResponse>(
      "/admin_api/system-monitor/system/resources",
      requestInit,
      uiOptions
    );
    return normalizeSystemResources(response);
  },

  async getPM2Processes(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<PM2ProcessInfo[]> {
    const response = await apiFetch<PM2ProcessesResponse>(
      "/admin_api/system-monitor/pm2/processes",
      requestInit,
      uiOptions
    );
    return response.processes || [];
  },

  async getUserAuthCode(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<UserAuthCodeResponse> {
    return apiFetch("/admin_api/user-auth-code", requestInit, uiOptions);
  },

  async getServerLog(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false,
    retryOptions?: RetryOptions
  ): Promise<ServerLogResponse> {
    return fetchServerLog({}, requestInit, uiOptions, retryOptions);
  },

  async getIncrementalServerLog(
    offset: number,
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false,
    retryOptions?: RetryOptions
  ): Promise<ServerLogResponse> {
    return fetchServerLog(
      {
        incremental: true,
        offset,
      },
      requestInit,
      uiOptions,
      retryOptions
    );
  },

  async restartServer(uiOptions: ApiUiOptions = true): Promise<{ message?: string }> {
    return apiFetch("/admin_api/server/restart", { method: "POST" }, uiOptions);
  },

  async logout(
    uiOptions: ApiUiOptions = true
  ): Promise<{ status?: string; message?: string }> {
    return apiFetch("/admin_api/logout", { method: "POST" }, uiOptions);
  },
};
