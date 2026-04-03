<template>
  <div class="forum-posts-list">
    <div v-if="posts.length === 0" class="empty-state">
      <p>暂无帖子</p>
    </div>

    <div
      v-for="post in posts"
      :key="post.uid"
      class="forum-post-item"
      :class="{ 'pinned-post': post.title.includes('[置顶]') }"
      @click="emit('viewPost', post)"
    >
      <div class="forum-post-header">
        <span v-if="post.title.includes('[置顶]')" class="pin-badge">置顶</span>
        <span class="post-title" :title="post.title">
          {{ post.title.length > 50 ? post.title.slice(0, 50) + '…' : post.title }}
        </span>
      </div>
      <div class="forum-post-meta">
        <span class="post-author">作者：{{ post.author }}</span>
        <span class="post-board">板块：{{ post.board }}</span>
        <span class="post-time">最后回复：{{ formatDate(post.lastReplyAt || post.timestamp) }}</span>
        <span class="post-replies">最后回复者：{{ post.lastReplyBy || 'N/A' }}</span>
      </div>
    </div>

    <!-- 分页控件 -->
    <div v-if="totalPages > 1" class="pagination-controls">
      <button
        class="btn-secondary btn-sm"
        :disabled="!hasPrev"
        @click="emit('prevPage')"
      >
        <span class="material-symbols-outlined">chevron_left</span>
        上一页
      </button>
      <span class="pagination-info">
        第 {{ currentPage }} / {{ totalPages }} 页
      </span>
      <button
        class="btn-secondary btn-sm"
        :disabled="!hasNext"
        @click="emit('nextPage')"
      >
        下一页
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils'
import type { ForumPost } from '@/features/vcp-forum/types'

defineProps<{
  posts: ForumPost[]
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}>()

const emit = defineEmits<{
  viewPost: [post: ForumPost]
  nextPage: []
  prevPage: []
}>()
</script>

<style scoped>
.forum-posts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.forum-post-item {
  background: var(--secondary-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.forum-post-item:hover {
  background: var(--accent-bg);
  transform: translateX(4px);
}

.forum-post-item.pinned-post {
  border-left: 3px solid var(--highlight-text);
  background: var(--primary-color-translucent);
}

.forum-post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.post-title {
  font-weight: 600;
  font-size: 1.1em;
  color: var(--primary-text);
}

.pin-badge {
  background: var(--highlight-text);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: 600;
}

.forum-post-meta {
  display: flex;
  gap: 16px;
  font-size: 0.85em;
  color: var(--secondary-text);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.6;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 24px;
  padding: 16px 0;
}

.pagination-info {
  font-size: 0.9em;
  color: var(--secondary-text);
  padding: 0 12px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.material-symbols-outlined {
  font-size: 18px !important;
  vertical-align: middle;
}
</style>
