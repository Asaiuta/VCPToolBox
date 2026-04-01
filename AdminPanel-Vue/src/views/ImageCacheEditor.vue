<template>
  <section class="config-section active-section media-cache-page">
    <div class="page-header">
      <div>
        <p class="description">编辑并保存 multimodal_cache.json，支持重新识别与预览。</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" type="button" @click="loadMediaCache" :disabled="isLoading || isSaving">
          刷新
        </button>
        <button class="btn-success" type="button" @click="saveCache" :disabled="isLoading || isSaving || mediaItems.length === 0">
          {{ isSaving ? '保存中…' : '保存更改' }}
        </button>
      </div>
    </div>

    <p v-if="isLoading" class="status-tip">正在加载多媒体缓存数据…</p>
    <p v-else-if="mediaItems.length === 0" class="status-tip">缓存文件为空。</p>

    <div v-else class="media-grid">
      <article v-for="(item, index) in mediaItems" :key="item.base64Key" class="media-card">
        <div class="card-actions">
          <button
            class="icon-btn reidentify"
            type="button"
            :disabled="item.isReidentifying"
            :aria-label="item.isReidentifying ? '正在重新识别' : '重新识别媒体描述'"
            @click="reidentifyItem(item)"
          >
            {{ item.isReidentifying ? '…' : '↻' }}
          </button>
          <button class="icon-btn delete" type="button" aria-label="删除条目" @click="removeItem(index)">
            ×
          </button>
        </div>

        <h3>时间戳: {{ item.timestamp || 'N/A' }}</h3>

        <div class="media-preview-wrap">
          <button
            v-if="mediaKind(item.mimeType) === 'image' || mediaKind(item.mimeType) === 'video'"
            class="media-preview-button"
            type="button"
            @click="openPreview(item)"
            :aria-label="`预览${mediaKind(item.mimeType) === 'image' ? '图片' : '视频'}`"
          >
            <img
              v-if="mediaKind(item.mimeType) === 'image'"
              v-lazy="toDataUrl(item)"
              alt="媒体预览"
              class="media-preview"
            >
            <video
              v-else
              :src="toDataUrl(item)"
              class="media-preview"
              preload="metadata"
              muted
            ></video>
          </button>

          <audio
            v-else-if="mediaKind(item.mimeType) === 'audio'"
            :src="toDataUrl(item)"
            controls
            preload="metadata"
            class="media-audio"
          ></audio>

          <div v-else class="unsupported-media">
            <p>不支持的媒体类型</p>
            <span>{{ item.mimeType }}</span>
          </div>
        </div>

        <label class="desc-label" :for="`desc-${index}`">媒体描述 (可编辑):</label>
        <textarea
          :id="`desc-${index}`"
          v-model="item.description"
          rows="4"
          placeholder="请输入媒体描述…"
        ></textarea>

        <div class="base64-key">Base64 Key (部分): {{ item.base64Key.slice(0, 30) }}…</div>
      </article>
    </div>

    <div v-if="previewOpen" class="preview-modal" role="dialog" aria-modal="true" aria-label="媒体预览" @click.self="closePreview">
      <button class="modal-close" type="button" aria-label="关闭预览" @click="closePreview">×</button>
      <div class="modal-content">
        <img v-if="previewType === 'image'" :src="previewDataUrl" alt="放大预览图" />
        <video v-else controls autoplay :src="previewDataUrl"></video>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { mediaCacheApi, type CacheEntry } from '@/api'
import { showMessage } from '@/utils'

interface MediaItem {
  base64Key: string
  description: string
  timestamp: string
  mimeType: string
  isReidentifying: boolean
}

const mediaItems = ref<MediaItem[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const previewOpen = ref(false)
const previewDataUrl = ref('')
const previewType = ref<'image' | 'video'>('image')

function guessMimeType(base64String: string): string {
  if (base64String.startsWith('/9j/')) return 'image/jpeg'
  if (base64String.startsWith('iVBOR')) return 'image/png'
  if (base64String.startsWith('R0lGOD')) return 'image/gif'
  if (base64String.startsWith('UklGR')) return 'image/webp'
  return 'application/octet-stream'
}

function mediaKind(mimeType: string): 'image' | 'audio' | 'video' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  return 'unknown'
}

function toDataUrl(item: MediaItem): string {
  return `data:${item.mimeType};base64,${item.base64Key}`
}

function normalizeCache(rawData: Record<string, CacheEntry>): MediaItem[] {
  return Object.entries(rawData)
    .reverse()
    .map(([base64Key, entry]) => ({
      base64Key,
      description: entry.description || '',
      timestamp: entry.timestamp || '',
      mimeType: entry.mimeType || guessMimeType(base64Key),
      isReidentifying: false
    }))
}

async function loadMediaCache() {
  isLoading.value = true
  try {
    const data = await mediaCacheApi.getCache(false)
    mediaItems.value = normalizeCache(data || {})
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('加载多媒体缓存失败:', error)
    showMessage(`加载失败：${errorMessage}`, 'error')
  } finally {
    isLoading.value = false
  }
}

async function saveCache() {
  if (mediaItems.value.length === 0) {
    showMessage('没有数据可保存。', 'warning')
    return
  }

  isSaving.value = true
  try {
    const payload = mediaItems.value.reduce<Record<string, CacheEntry>>((acc, item) => {
      acc[item.base64Key] = {
        description: item.description,
        timestamp: item.timestamp,
        mimeType: item.mimeType
      }
      return acc
    }, {})

    const result = await mediaCacheApi.saveCache(payload)

    showMessage(result?.message || '多媒体缓存文件已成功保存。', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('保存多媒体缓存失败:', error)
    showMessage(`保存失败：${errorMessage}`, 'error')
  } finally {
    isSaving.value = false
  }
}

async function reidentifyItem(item: MediaItem) {
  item.isReidentifying = true
  try {
    const result = await mediaCacheApi.reidentify(item.base64Key)

    item.description = result?.newDescription || ''
    item.timestamp = result?.newTimestamp || item.timestamp
    showMessage('重新识别成功。', 'success')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('重新识别失败:', error)
    showMessage(`重新识别失败：${errorMessage}`, 'error')
  } finally {
    item.isReidentifying = false
  }
}

function removeItem(index: number) {
  if (!confirm('确定要删除这个媒体条目吗？')) {
    return
  }
  mediaItems.value.splice(index, 1)
  if (mediaItems.value.length === 0) {
    showMessage('缓存条目已全部删除，记得点击保存。', 'info')
  }
}

function openPreview(item: MediaItem) {
  const type = mediaKind(item.mimeType)
  if (type !== 'image' && type !== 'video') {
    return
  }
  previewDataUrl.value = toDataUrl(item)
  previewType.value = type
  previewOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closePreview() {
  previewOpen.value = false
  previewDataUrl.value = ''
  document.body.style.overflow = ''
}

function handleEsc(event: KeyboardEvent) {
  if (event.key === 'Escape' && previewOpen.value) {
    closePreview()
  }
}

onMounted(() => {
  loadMediaCache()
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.media-cache-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.page-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.status-tip {
  color: var(--secondary-text);
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.media-card {
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px;
  background: var(--tertiary-bg);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.media-card h3 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--secondary-text);
}

.card-actions {
  position: absolute;
  right: 10px;
  top: 10px;
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  color: #fff;
  cursor: pointer;
}

.icon-btn.reidentify {
  background: #1e8e3e;
}

.icon-btn.delete {
  background: var(--danger-color);
}

.icon-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.media-preview-wrap {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-preview-button {
  border: 0;
  background: transparent;
  padding: 0;
  width: 100%;
  cursor: zoom-in;
}

.media-preview {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--input-bg);
}

.media-audio {
  width: 100%;
}

.unsupported-media {
  width: 100%;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  color: var(--secondary-text);
}

.desc-label {
  font-size: 0.9rem;
  color: var(--secondary-text);
}

textarea {
  width: 100%;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--primary-text);
  border-radius: 8px;
  padding: 10px;
  resize: vertical;
}

textarea:focus-visible,
.media-preview-button:focus-visible,
.icon-btn:focus-visible,
.modal-close:focus-visible {
  outline: 2px solid var(--highlight-text);
  outline-offset: 2px;
}

.base64-key {
  font-size: 0.8rem;
  color: var(--secondary-text);
  word-break: break-all;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 8px;
}

.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.86);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.modal-content {
  width: min(92vw, 1200px);
  height: min(88vh, 820px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content img,
.modal-content video {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 10px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }

  .media-grid {
    grid-template-columns: 1fr;
  }
}
</style>
