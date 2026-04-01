<template>
  <div v-if="selectedPost" class="forum-post-detail">
    <div class="post-detail-header">
      <button @click="emit('backToList')" class="btn-secondary btn-sm">
        <span class="material-symbols-outlined">arrow_back</span>
        返回列表
      </button>
      <span class="post-title">{{ selectedPost.title }}</span>
    </div>

    <div class="post-detail-meta">
      <span>作者：{{ selectedPost.author }}</span>
      <span>发布时间：{{ formatDate(selectedPost.timestamp) }}</span>
      <span>板块：{{ selectedPost.board }}</span>
    </div>

    <div class="post-detail-content card" v-html="selectedPost.contentHtml"></div>

    <!-- 回复列表 -->
    <div class="post-replies">
      <h3>回复 ({{ selectedPost.replies }})</h3>
      <div v-for="reply in selectedPost.repliesList" :key="reply.id" class="reply-item card">
        <div class="reply-header">
          <span class="reply-author">{{ reply.author }}</span>
          <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
        </div>
        <div class="reply-content">{{ reply.content }}</div>
      </div>
    </div>

    <!-- 回复表单 -->
    <div class="reply-form card">
      <h3>发表回复</h3>
      <textarea
        :value="newReplyContent"
        rows="4"
        placeholder="写下你的回复…"
        @input="emit('update:newReplyContent', ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
      <button @click="emit('submitReply')" class="btn-primary">发表回复</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '@/utils'
import type { ForumPostDetail } from './types'

defineProps<{
  selectedPost: ForumPostDetail | null
  newReplyContent: string
}>()

const emit = defineEmits<{
  backToList: []
  submitReply: []
  'update:newReplyContent': [value: string]
}>()
</script>

<style scoped>
.post-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.post-detail-header .post-title {
  font-size: 1.3em;
}

.post-detail-meta {
  display: flex;
  gap: 16px;
  font-size: 0.9em;
  color: var(--secondary-text);
  margin-bottom: 16px;
}

.post-detail-content {
  padding: 20px;
  margin-bottom: 24px;
  white-space: pre-wrap;
  line-height: 1.6;
}

.post-replies h3 {
  margin: 0 0 16px;
}

.reply-item {
  padding: 16px;
  margin-bottom: 12px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.reply-author {
  font-weight: 600;
  color: var(--primary-text);
}

.reply-time {
  color: var(--secondary-text);
}

.reply-content {
  white-space: pre-wrap;
  line-height: 1.5;
}

.reply-form {
  padding: 16px;
  margin-top: 24px;
}

.reply-form h3 {
  margin: 0 0 16px;
}

.reply-form textarea {
  width: 100%;
  padding: 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-family: inherit;
  resize: vertical;
  margin-bottom: 12px;
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
