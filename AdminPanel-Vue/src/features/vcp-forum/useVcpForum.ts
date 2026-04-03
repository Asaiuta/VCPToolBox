import { ref } from "vue";
import { forumApi } from "@/api";
import { showMessage } from "@/utils";
import { createLogger } from "@/utils/logger";
import { usePagination } from "@/composables/usePagination";
import { useDebounceFn } from "@/composables/useDebounceFn";
import type * as Marked from "marked";
import type * as DOMPurifyModule from "dompurify";
import type { ForumPost, ForumPostDetail } from "@/features/vcp-forum/types";

const logger = createLogger("VcpForum");

// 动态加载 marked 和 DOMPurify（仅在实际渲染 Markdown 时加载）
let markedModule: typeof Marked | null = null;
let dompurifyModule: typeof DOMPurifyModule | null = null;

const REPLY_DELIMITER = "\n\n---\n\n## 评论区\n---";

interface NewPostForm {
  title: string;
  board: string;
  content: string;
}

export function useVcpForum() {
  const boards = ref<string[]>([]);
  const posts = ref<ForumPost[]>([]);
  const filteredPosts = ref<ForumPost[]>([]);
  const selectedBoard = ref("all");
  const searchQuery = ref("");
  const viewMode = ref<"list" | "detail">("list");
  const selectedPost = ref<ForumPostDetail | null>(null);
  const newReplyContent = ref("");
  const showNewPostDialog = ref(false);
  const newPost = ref<NewPostForm>({
    title: "",
    board: "",
    content: "",
  });

  // 使用分页处理帖子列表（每页 20 条）
  const {
    items: paginatedPosts,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    nextPage,
    prevPage,
    reset: resetPagination,
  } = usePagination(filteredPosts, { pageSize: 20 });

  // 使用防抖处理过滤（250ms 延迟）
  const debouncedFilter = useDebounceFn(
    () => {
      filterPosts();
    },
    { delay: 250 }
  );

  async function loadMarkdownLibs() {
    if (markedModule && dompurifyModule) return;

    const [marked, DOMPurify] = await Promise.all([
      import("marked"),
      import("dompurify"),
    ]);

    markedModule = marked;
    dompurifyModule = DOMPurify;
  }

  function renderMarkdown(content: string): string {
    if (!markedModule || !dompurifyModule) {
      logger.warn("Markdown libraries not loaded yet");
      return content;
    }

    const parsed = markedModule.marked.parse(content);
    const html = typeof parsed === "string" ? parsed : content;
    return dompurifyModule.default.sanitize(html);
  }

  function parsePostMeta(content: string) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const boardMatch = content.match(/\*\*板块:\*\*\s*(.+)$/m);
    const authorMatch = content.match(/\*\*作者:\*\*\s*(.+)$/m);
    const timeMatch = content.match(/\*\*发布时间:\*\*\s*(.+)$/m);

    return {
      title: titleMatch?.[1]?.trim() || "帖子详情",
      board: boardMatch?.[1]?.trim() || "",
      author: authorMatch?.[1]?.trim() || "未知",
      createdAt: timeMatch?.[1]?.trim() || "",
    };
  }

  function parseReplyItem(replyText: string, index: number) {
    const authorMatch = replyText.match(/\*\*回复者:\*\*\s*(.+)$/m);
    const timeMatch = replyText.match(/\*\*时间:\*\*\s*(.+)$/m);
    const bodyMatch = replyText.match(/\*\*时间:\*\*.+?\n\n([\s\S]*)$/m);

    return {
      id: index + 1,
      author: authorMatch?.[1]?.trim() || "未知",
      createdAt: timeMatch?.[1]?.trim() || "",
      content: bodyMatch?.[1]?.trim() || "",
    };
  }

  async function loadBoards() {
    const boardSet = new Set(posts.value.map((post) => post.board).filter(Boolean));
    boards.value = Array.from(boardSet);
  }

  async function loadPosts() {
    try {
      const data = await forumApi.getPosts(false);

      posts.value = data.map((post) => ({
        uid: post.uid,
        title: post.title,
        author: post.author,
        board: post.board,
        timestamp: post.timestamp,
        lastReplyBy: post.lastReplyBy,
        lastReplyAt: post.lastReplyAt,
      }));

      await loadBoards();
      filterPosts();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showMessage(`加载论坛帖子失败：${errorMessage}`, "error");
      posts.value = [];
      filteredPosts.value = [];
    }
  }

  function onBoardChange(value: string) {
    selectedBoard.value = value;
    filterPosts();
  }

  function onSearchInput(value: string) {
    searchQuery.value = value;
    debouncedFilter();
  }

  function filterPosts() {
    let result = [...posts.value];

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query)
      );
    }

    if (selectedBoard.value !== "all") {
      result = result.filter((post) => post.board === selectedBoard.value);
    }

    filteredPosts.value = result;
    // 过滤后重置分页到第一页
    resetPagination();
  }

  async function viewPost(post: ForumPost) {
    try {
      // 预加载 Markdown 库
      await loadMarkdownLibs();

      const content = await forumApi.getPostContent(post.uid, false);
      const splitIndex = content.indexOf(REPLY_DELIMITER);
      const mainContent = splitIndex >= 0 ? content.slice(0, splitIndex) : content;
      const repliesRaw =
        splitIndex >= 0 ? content.slice(splitIndex + REPLY_DELIMITER.length).trim() : "";

      const meta = parsePostMeta(mainContent);
      const replyItems = repliesRaw
        ? repliesRaw
            .split("\n\n---\n")
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item, index) => parseReplyItem(item, index))
        : [];

      selectedPost.value = {
        uid: post.uid,
        title: meta.title,
        author: meta.author,
        board: meta.board || post.board,
        timestamp: post.timestamp,
        lastReplyBy: post.lastReplyBy,
        lastReplyAt: post.lastReplyAt,
        contentHtml: renderMarkdown(mainContent),
        replies: replyItems.length,
        repliesList: replyItems,
      };

      viewMode.value = "detail";
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showMessage(`加载帖子详情失败：${errorMessage}`, "error");
    }
  }

  function backToList() {
    viewMode.value = "list";
    selectedPost.value = null;
    newReplyContent.value = "";
  }

  async function submitReply() {
    if (!selectedPost.value || !newReplyContent.value.trim()) {
      showMessage("请输入回复内容", "error");
      return;
    }

    const maid = prompt("请输入您的昵称：")?.trim();
    if (!maid) {
      showMessage("请输入昵称", "error");
      return;
    }

    try {
      await forumApi.submitReply(
        selectedPost.value.uid,
        {
          maid,
          content: newReplyContent.value.trim(),
        },
        {
          loadingKey: "vcp-forum.reply.submit",
        }
      );

      showMessage("回复成功", "success");
      newReplyContent.value = "";
      const currentUid = selectedPost.value.uid;
      const originalPost = posts.value.find((p) => p.uid === currentUid);
      if (originalPost) {
        await viewPost(originalPost);
      }
      await loadPosts();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showMessage(`回复失败：${errorMessage}`, "error");
    }
  }

  // 旧版 AdminPanel 未提供发帖入口，这里保留按钮但给出提示
  async function submitNewPost() {
    showMessage(
      "当前后端未开放发帖接口，请通过帖子文件或其他管理流程创建。",
      "info"
    );
    showNewPostDialog.value = false;
  }

  return {
    boards,
    selectedBoard,
    searchQuery,
    viewMode,
    paginatedPosts,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    selectedPost,
    newReplyContent,
    showNewPostDialog,
    newPost,
    nextPage,
    prevPage,
    loadPosts,
    onBoardChange,
    onSearchInput,
    viewPost,
    backToList,
    submitReply,
    submitNewPost,
  };
}
