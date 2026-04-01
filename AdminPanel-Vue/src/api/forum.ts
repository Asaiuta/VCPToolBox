import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";
import type { ForumPost } from "@/views/VcpForum/types";

type ApiUiOptions = boolean | ApiFetchUiOptions;

interface ForumPostsResponse {
  posts?: ForumPost[];
}

interface ForumPostDetailResponse {
  content?: string;
}

export const forumApi = {
  async getPosts(uiOptions: ApiUiOptions = false): Promise<ForumPost[]> {
    const response = await apiFetch<ForumPostsResponse>(
      "/admin_api/forum/posts",
      {},
      uiOptions
    );
    return response.posts || [];
  },

  async getPostContent(
    uid: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const response = await apiFetch<ForumPostDetailResponse>(
      `/admin_api/forum/post/${encodeURIComponent(uid)}`,
      {},
      uiOptions
    );
    return response.content || "";
  },

  async submitReply(
    uid: string,
    payload: { maid: string; content: string },
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      `/admin_api/forum/reply/${encodeURIComponent(uid)}`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },
};
