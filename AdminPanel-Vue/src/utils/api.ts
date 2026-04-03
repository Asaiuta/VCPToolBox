/**
 * API 请求工具
 */
import { getActivePinia } from "pinia";
import { notifyAuthExpired } from "@/platform/auth/session";
import { feedbackBus } from "@/platform/feedback/feedbackBus";
import { useLoadingStore } from "@/stores/loading";
import { createAppError, type AppError } from "@/types/api";
import { createLogger } from "./logger";
import { performanceMonitor } from "./performance";

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
}

export interface ApiFetchUiOptions {
  showLoader?: boolean;
  loadingKey?: string;
  timeoutMs?: number;
  suppressErrorMessage?: boolean;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  timeoutMs: 15000,
};

const DEFAULT_API_TIMEOUT_MS = 15000;
const logger = createLogger("Api");

function createAbortError(message = "Request aborted"): DOMException {
  return new DOMException(message, "AbortError");
}

function withAbortableDelay(delayMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timer = globalThis.setTimeout(() => {
      cleanup();
      resolve();
    }, delayMs);

    const handleAbort = () => {
      globalThis.clearTimeout(timer);
      cleanup();
      reject(createAbortError());
    };

    const cleanup = () => {
      signal?.removeEventListener("abort", handleAbort);
    };

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

function mergeAbortSignals(signals: Array<AbortSignal | undefined>): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  const availableSignals = signals.filter(
    (signal): signal is AbortSignal => signal !== undefined
  );

  if (availableSignals.length === 0) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();

  const abort = () => {
    if (!controller.signal.aborted) {
      controller.abort();
    }
  };

  for (const signal of availableSignals) {
    if (signal.aborted) {
      abort();
      return { signal: controller.signal, cleanup: () => undefined };
    }
  }

  const listeners = availableSignals.map((signal) => {
    const handleAbort = () => abort();
    signal.addEventListener("abort", handleAbort, { once: true });
    return { signal, handleAbort };
  });

  return {
    signal: controller.signal,
    cleanup: () => {
      listeners.forEach(({ signal, handleAbort }) => {
        signal.removeEventListener("abort", handleAbort);
      });
    },
  };
}

function createTimeoutSignal(timeoutMs?: number): {
  signal?: AbortSignal;
  cleanup: () => void;
} {
  if (!timeoutMs || timeoutMs <= 0) {
    return { signal: undefined, cleanup: () => undefined };
  }

  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => globalThis.clearTimeout(timer),
  };
}

async function fetchWithManagedSignal(
  input: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const timeoutSignal = createTimeoutSignal(timeoutMs);
  const mergedSignals = mergeAbortSignals([
    init.signal as AbortSignal | undefined,
    timeoutSignal.signal,
  ]);

  try {
    return await fetch(input, {
      ...init,
      signal: mergedSignals.signal,
    });
  } finally {
    mergedSignals.cleanup();
    timeoutSignal.cleanup();
  }
}

function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function normalizeUiOptions(
  uiOptions: boolean | ApiFetchUiOptions
): Required<Pick<ApiFetchUiOptions, "showLoader" | "timeoutMs">> &
  Pick<ApiFetchUiOptions, "loadingKey" | "suppressErrorMessage"> {
  if (typeof uiOptions === "boolean") {
    return {
      showLoader: uiOptions,
      loadingKey: undefined,
      timeoutMs: DEFAULT_API_TIMEOUT_MS,
      suppressErrorMessage: false,
    };
  }

  return {
    showLoader: uiOptions.showLoader ?? true,
    loadingKey: uiOptions.loadingKey,
    timeoutMs: uiOptions.timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
    suppressErrorMessage: uiOptions.suppressErrorMessage ?? false,
  };
}

/**
 * 带重试机制的 fetch 请求
 * @param url 请求 URL
 * @param options fetch 选项
 * @param retryOptions 重试选项
 * @returns Promise<unknown> 响应数据
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<unknown> {
  const { maxRetries, retryDelay, backoffMultiplier, timeoutMs } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithManagedSignal(url, options, timeoutMs);

      if (!response.ok) {
        throw createAppError(`HTTP ${response.status}: ${response.statusText}`, {
          status: response.status,
        });
      }

      return await readResponseBody(response);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === "AbortError") {
        throw lastError;
      }

      const status = (lastError as AppError).status;
      if (typeof status === "number" && status >= 400 && status < 500) {
        throw lastError;
      }

      if (attempt >= maxRetries) {
        break;
      }

      const currentDelay = retryDelay * Math.pow(backoffMultiplier, attempt);
      logger.warn(
        `[fetchWithRetry] Attempt ${attempt + 1} failed. Retrying in ${currentDelay}ms...`,
        lastError
      );
      await withAbortableDelay(currentDelay, options.signal as AbortSignal | undefined);
    }
  }

  throw lastError || new Error("Unknown error occurred");
}

/**
 * 封装的 fetch 请求函数，附带性能记录、并发安全 loading 和错误分类
 * @template T - 响应数据类型
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
  uiOptions: boolean | ApiFetchUiOptions = true
): Promise<T> {
  const startTime = performance.now();
  const normalizedUiOptions = normalizeUiOptions(uiOptions);

  const pinia = getActivePinia();
  const loadingStore =
    pinia && normalizedUiOptions.loadingKey ? useLoadingStore(pinia) : null;

  if (normalizedUiOptions.showLoader) {
    feedbackBus.showLoading(true);
  }
  if (loadingStore && normalizedUiOptions.loadingKey) {
    loadingStore.start(normalizedUiOptions.loadingKey);
  }

  try {
    const defaultHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };

    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
      credentials: options.credentials || "same-origin",
    };

    const response = await fetchWithManagedSignal(
      url,
      fetchOptions,
      normalizedUiOptions.timeoutMs
    );
    const duration = performance.now() - startTime;

    performanceMonitor.recordApiRequest(duration, response.ok);

    if (!response.ok) {
      if (response.status === 401) {
        logger.warn("401 Unauthorized, forwarding auth-expired event");
        notifyAuthExpired({
          source: "apiFetch",
          requestUrl: url,
        });
        throw createAppError("Unauthorized", { code: "AUTH_REQUIRED", status: 401 });
      }

      let errorData: Record<string, unknown> = {
        error: `HTTP error ${response.status}`,
        details: response.statusText,
      };

      try {
        const responseBody = await readResponseBody(response);
        if (responseBody && typeof responseBody === "object") {
          errorData = { ...errorData, ...responseBody };
        }
      } catch {
        // Ignore body parsing failure for error responses.
      }

      throw createAppError(
        String(
          errorData.message ||
            errorData.error ||
            errorData.details ||
            `HTTP error ${response.status}`
        ),
        {
          status: response.status,
          details: errorData,
        }
      );
    }

    return (await readResponseBody(response)) as T;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof DOMException && error.name === "AbortError") {
      logger.warn("API Fetch aborted:", url);
      throw error;
    }

    if (error instanceof TypeError) {
      if (
        error.message.includes("fetch") ||
        error.message.includes("NetworkError")
      ) {
        logger.error("API Fetch Error: 网络连接失败", error);
        if (!normalizedUiOptions.suppressErrorMessage) {
          feedbackBus.showMessage("网络连接失败，请检查网络或服务状态", "error");
        }
      } else {
        logger.error("API Fetch Error:", errorMessage, error);
        if (!normalizedUiOptions.suppressErrorMessage) {
          feedbackBus.showMessage(`请求失败：${errorMessage}`, "error");
        }
      }
    } else if (
      error instanceof Error &&
      ((error as AppError).status === 401 || error.message === "Unauthorized")
    ) {
      logger.error("API Fetch Error: 认证失败", error);
    } else {
      logger.error("API Fetch Error:", errorMessage, error);
      if (!normalizedUiOptions.suppressErrorMessage) {
        feedbackBus.showMessage(`操作失败：${errorMessage}`, "error");
      }
    }

    throw error;
  } finally {
    if (normalizedUiOptions.showLoader) {
      feedbackBus.showLoading(false);
    }
    if (loadingStore && normalizedUiOptions.loadingKey) {
      loadingStore.stop(normalizedUiOptions.loadingKey);
    }
  }
}

/**
 * 安全地处理 catch 块中的错误
 * @param error - catch 块捕获的错误
 * @returns 标准化的错误对象
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof Error) {
    return error as AppError;
  }

  if (typeof error === "string") {
    return createAppError(error, { code: "UNKNOWN_ERROR" });
  }

  if (error && typeof error === "object" && "message" in error) {
    const errorRecord = error as Record<string, unknown>;
    return createAppError(String(errorRecord.message), {
      code:
        typeof errorRecord.code === "string" || typeof errorRecord.code === "number"
          ? errorRecord.code
          : undefined,
      details: errorRecord.details,
    });
  }

  return createAppError("Unknown error occurred", {
    code: "UNKNOWN_ERROR",
    details: error,
  });
}
