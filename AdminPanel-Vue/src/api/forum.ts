import { HttpError } from "@/platform/http/errors";
import { httpClient } from "@/platform/http/httpClient";
import type { ForumPost } from "@/features/vcp-forum/types";

type ApiUiOptions =
  | boolean
  | {
      showLoader?: boolean;
      loadingKey?: string;
      timeoutMs?: number;
      suppressErrorMessage?: boolean;
    };

interface ForumPostsResponse {
  posts?: unknown;
}

interface ForumPostDetailResponse {
  content?: unknown;
}

interface ForumEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const DEFAULT_TIMEOUT_MS = 15000;

function resolveTimeout(uiOptions: ApiUiOptions): number {
  if (
    typeof uiOptions === "object" &&
    uiOptions !== null &&
    typeof uiOptions.timeoutMs === "number" &&
    uiOptions.timeoutMs > 0
  ) {
    return uiOptions.timeoutMs;
  }

  return DEFAULT_TIMEOUT_MS;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (!isRecord(payload)) {
    return {} as T;
  }

  const envelope = payload as ForumEnvelope<T>;
  if (envelope.success === false) {
    throw new HttpError(
      envelope.error || envelope.message || "Forum request failed"
    );
  }

  if (envelope.data !== undefined) {
    return envelope.data;
  }

  return payload as T;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizePost(raw: unknown): ForumPost | null {
  if (!isRecord(raw)) {
    return null;
  }

  const uid = asString(raw.uid);
  const title = asString(raw.title);
  const author = asString(raw.author);
  const board = asString(raw.board);
  const timestamp = asString(raw.timestamp);

  if (!uid || !title || !author || !board || !timestamp) {
    return null;
  }

  return {
    uid,
    title,
    author,
    board,
    timestamp,
    lastReplyBy:
      typeof raw.lastReplyBy === "string" || raw.lastReplyBy === null
        ? raw.lastReplyBy
        : null,
    lastReplyAt:
      typeof raw.lastReplyAt === "string" || raw.lastReplyAt === null
        ? raw.lastReplyAt
        : null,
  };
}

function normalizeReplyPayload(payload: { maid: string; content: string }): {
  maid: string;
  content: string;
} {
  const maid = payload.maid.trim();
  const content = payload.content.trim();

  if (!maid) {
    throw new Error("回复昵称不能为空");
  }

  if (!content) {
    throw new Error("回复内容不能为空");
  }

  return {
    maid,
    content,
  };
}

async function requestForum<T>(
  request: {
    url: string;
    method?: "GET" | "POST";
    body?: unknown;
  },
  uiOptions: ApiUiOptions
): Promise<T> {
  const payload = await httpClient.request<unknown>({
    url: request.url,
    method: request.method,
    body: request.body,
    timeoutMs: resolveTimeout(uiOptions),
  });

  return unwrapEnvelope<T>(payload);
}

export const forumApi = {
  async getPosts(uiOptions: ApiUiOptions = false): Promise<ForumPost[]> {
    const response = await requestForum<ForumPostsResponse>(
      {
        url: "/admin_api/forum/posts",
        method: "GET",
      },
      uiOptions
    );

    const posts = Array.isArray(response.posts) ? response.posts : [];
    return posts.map((item) => normalizePost(item)).filter((item): item is ForumPost => item !== null);
  },

  async getPostContent(
    uid: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const response = await requestForum<ForumPostDetailResponse>(
      {
        url: `/admin_api/forum/post/${encodeURIComponent(uid)}`,
        method: "GET",
      },
      uiOptions
    );

    return asString(response.content);
  },

  async submitReply(
    uid: string,
    payload: { maid: string; content: string },
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    const normalizedPayload = normalizeReplyPayload(payload);

    await requestForum(
      {
        url: `/admin_api/forum/reply/${encodeURIComponent(uid)}`,
        method: "POST",
        body: normalizedPayload,
      },
      uiOptions
    );
  },
};
