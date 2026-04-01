import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";

const {
  mockGetPosts,
  mockSubmitReply,
  mockShowMessage,
  mockResetPagination,
} = vi.hoisted(() => ({
  mockGetPosts: vi.fn(async () => []),
  mockSubmitReply: vi.fn(async () => undefined),
  mockShowMessage: vi.fn(),
  mockResetPagination: vi.fn(),
}));

vi.mock("@/api", () => ({
  forumApi: {
    getPosts: (...args: unknown[]) => mockGetPosts(...args),
    getPostContent: vi.fn(async () => ""),
    submitReply: (...args: unknown[]) => mockSubmitReply(...args),
  },
}));

vi.mock("@/utils", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/composables/usePagination", () => ({
  usePagination: () => ({
    items: ref([]),
    currentPage: ref(1),
    totalPages: ref(1),
    hasNext: ref(false),
    hasPrev: ref(false),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    reset: mockResetPagination,
  }),
}));

vi.mock("@/composables/useDebounceFn", () => ({
  useDebounceFn: (fn: () => void) => fn,
}));

import { useVcpForum } from "@/views/VcpForum/useVcpForum";

describe("useVcpForum", () => {
  beforeEach(() => {
    mockGetPosts.mockReset();
    mockSubmitReply.mockReset();
    mockShowMessage.mockReset();
    mockResetPagination.mockReset();
    vi.stubGlobal("prompt", vi.fn(() => ""));
  });

  it("loads posts and triggers filter reset on search/board changes", async () => {
    mockGetPosts.mockResolvedValueOnce([
      {
        uid: "1",
        title: "Alpha",
        author: "Alice",
        board: "General",
        timestamp: "t1",
      },
      {
        uid: "2",
        title: "Beta",
        author: "Bob",
        board: "Tech",
        timestamp: "t2",
      },
    ]);

    const state = useVcpForum();
    await state.loadPosts();

    state.onSearchInput("Alpha");
    state.onBoardChange("General");

    expect(mockResetPagination).toHaveBeenCalled();
    expect(state.boards.value).toContain("General");
    expect(state.boards.value).toContain("Tech");
  });

  it("validates reply content and nickname before submit", async () => {
    const state = useVcpForum();

    await state.submitReply();
    expect(mockShowMessage).toHaveBeenCalled();

    state.selectedPost.value = {
      uid: "p1",
      title: "T",
      author: "A",
      board: "B",
      timestamp: "now",
      contentHtml: "x",
      replies: 0,
      repliesList: [],
    };
    state.newReplyContent.value = "hello";
    await state.submitReply();

    expect(mockSubmitReply).not.toHaveBeenCalled();
    expect(mockShowMessage).toHaveBeenCalled();
  });
});
