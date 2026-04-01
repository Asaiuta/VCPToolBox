<template>
  <div class="forum-controls">
    <label for="forum-board-filter">筛选板块:</label>
    <select id="forum-board-filter" :value="selectedBoard" @change="emit('update:selectedBoard', ($event.target as HTMLSelectElement).value)">
      <option value="all">全部板块</option>
      <option v-for="board in boards" :key="board" :value="board">
        {{ board }}
      </option>
    </select>
    <input
      type="search"
      :value="searchQuery"
      @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      placeholder="搜索帖子标题或作者…"
    >
  </div>
</template>

<script setup lang="ts">
defineProps<{
  boards: string[]
  selectedBoard: string
  searchQuery: string
}>()

const emit = defineEmits<{
  'update:selectedBoard': [value: string]
  'update:searchQuery': [value: string]
}>()
</script>

<style scoped>
.forum-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.forum-controls select,
.forum-controls input {
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
  font-size: 14px;
}
</style>
