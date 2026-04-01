<template>
  <section class="config-section active-section">
    <ForumFilterBar
      :boards="boards"
      :selected-board="selectedBoard"
      :search-query="searchQuery"
      @update:selectedBoard="onBoardChange"
      @update:searchQuery="onSearchInput"
    />

    <div id="forum-posts-container" class="forum-posts-container">
      <ForumPostList
        v-if="viewMode === 'list'"
        :posts="paginatedPosts"
        :current-page="currentPage"
        :total-pages="totalPages"
        :has-next="hasNext"
        :has-prev="hasPrev"
        @viewPost="viewPost"
        @nextPage="nextPage"
        @prevPage="prevPage"
      />

      <ForumPostDetail
        v-else-if="viewMode === 'detail' && selectedPost"
        :selected-post="selectedPost"
        :new-reply-content="newReplyContent"
        @backToList="backToList"
        @submitReply="submitReply"
        @update:newReplyContent="newReplyContent = $event"
      />
    </div>

    <!-- 发帖按钮 -->
    <div class="forum-actions">
      <button @click="showNewPostDialog = true" class="btn-primary">
        <span class="material-symbols-outlined">edit</span>
        发表新帖
      </button>
    </div>

    <!-- 发帖对话框 -->
    <div
      v-if="showNewPostDialog"
      class="modal-overlay"
      @click="showNewPostDialog = false"
    >
      <div class="modal-content" @click.stop>
        <h3>发表新帖</h3>
        <div class="form-group">
          <label>标题</label>
          <input
            type="text"
            v-model="newPost.title"
            placeholder="输入帖子标题…"
          />
        </div>
        <div class="form-group">
          <label>板块</label>
          <select v-model="newPost.board">
            <option v-for="board in boards" :key="board" :value="board">
              {{ board }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>内容</label>
          <textarea
            v-model="newPost.content"
            rows="6"
            placeholder="输入帖子内容…"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="submitNewPost" class="btn-primary">发表</button>
          <button @click="showNewPostDialog = false" class="btn-secondary">
            取消
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import ForumFilterBar from "./VcpForum/ForumFilterBar.vue";
import ForumPostList from "./VcpForum/ForumPostList.vue";
import ForumPostDetail from "./VcpForum/ForumPostDetail.vue";
import { useVcpForum } from "./VcpForum/useVcpForum";

const {
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
} = useVcpForum();

onMounted(() => {
  loadPosts();
});
</script>

<style scoped>
.forum-posts-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 400px;
}

.forum-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: var(--secondary-bg);
  padding: 24px;
  border-radius: 12px;
  min-width: 500px;
  max-width: 600px;
}

.modal-content h3 {
  margin: 0 0 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--primary-text);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
