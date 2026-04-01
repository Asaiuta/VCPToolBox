<template>
  <div class="sidebar-header" :class="{ 'sidebar-collapsed': isSidebarCollapsed && !isHoveringSidebar }">
    <h1 :class="{ 'fade-label-hidden': !isExpandedState }">控制中心</h1>
    <div class="search-wrapper" :class="{ 'search-expanded': !isSidebarCollapsed || isHoveringSidebar }">
      <span class="material-symbols-outlined search-icon">search</span>
      <input
        id="sidebar-search"
        ref="searchInputRef"
        type="search"
        :placeholder="isSidebarCollapsed && !isHoveringSidebar ? '' : '搜索功能…'"
        :value="searchQuery"
        aria-label="搜索功能页面"
        autocomplete="off"
        @input="onInput"
        @keydown.ctrl.k.prevent="focusInput"
      >
      <kbd class="search-shortcut" :class="{ 'fade-label-hidden': !isExpandedState }">Ctrl+K</kbd>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDebounceFn } from '@/composables/useDebounceFn'

defineProps<{
  isExpandedState: boolean
  isSidebarCollapsed: boolean
  isHoveringSidebar: boolean
  searchQuery: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'filterSidebar'): void
}>()

const searchInputRef = ref<HTMLInputElement | null>(null)

// 使用防抖处理搜索输入（200ms 延迟，减少频繁过滤）
const debouncedFilter = useDebounceFn(() => {
  emit('filterSidebar')
}, { delay: 200 })

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  emit('update:searchQuery', value)
  // 使用防抖调用过滤，减少计算次数
  debouncedFilter()
}

function focusInput() {
  if (searchInputRef.value) {
    searchInputRef.value.focus()
  }
}

defineExpose({
  focusInput
})
</script>

<style scoped>
.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
  transition: padding 0.25s ease;
}

.sidebar-header.sidebar-collapsed {
  padding: 24px 10px;
}

.sidebar-header h1 {
  font-size: 1.2em;
  color: var(--primary-text);
  margin: 0 0 16px 0;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  max-height: 40px;
  overflow: hidden;
  white-space: nowrap;
  transition: opacity 0.2s ease, transform 0.22s ease, max-height 0.22s ease, margin-bottom 0.22s ease;
}

.sidebar-header h1.fade-label-hidden {
  opacity: 0;
  transform: translateX(-8px);
  max-height: 0;
  margin-bottom: 0;
  pointer-events: none;
}

.sidebar-header h1::before {
  content: '';
  display: block;
  width: 4px;
  height: 18px;
  background: var(--highlight-text);
  border-radius: 2px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  transition: width 0.3s;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--secondary-text);
  font-size: 18px;
  pointer-events: none;
}

.search-wrapper input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--input-bg);
  color: var(--primary-text);
  font-size: 0.9em;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.search-wrapper input:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
  border-color: var(--highlight-text);
  box-shadow: 0 0 0 2px var(--highlight-text);
}

.search-wrapper input:focus:not(:focus-visible) {
  border-color: var(--highlight-text);
  box-shadow: 0 0 0 2px var(--highlight-text);
}

.search-shortcut {
  position: absolute;
  right: 10px;
  padding: 2px 6px;
  font-size: 0.75em;
  color: var(--secondary-text);
  background: var(--accent-bg);
  border-radius: 4px;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.22s ease;
}

.search-shortcut.fade-label-hidden {
  opacity: 0;
  transform: translateX(-6px);
}
</style>
