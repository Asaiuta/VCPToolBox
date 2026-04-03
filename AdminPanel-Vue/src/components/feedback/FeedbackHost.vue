<template>
  <div
    class="loading-overlay"
    :class="{ visible: loadingVisible }"
    role="status"
    aria-live="polite"
    :aria-hidden="!loadingVisible"
    :aria-busy="loadingVisible"
  >
    <div class="spinner"></div>
    <p>正在加载…</p>
  </div>

  <div
    class="message-popup"
    :class="[messageState.type, { show: messageState.visible }]"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :aria-hidden="!messageState.visible"
  >
    {{ messageState.text }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { feedbackState, isLoadingVisible } from "@/platform/feedback/feedbackState";

const loadingVisible = isLoadingVisible;
const messageState = computed(() => feedbackState.message);
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.loading-overlay.visible {
  opacity: 1;
  visibility: visible;
}

.loading-overlay .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top-color: var(--highlight-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-overlay p {
  margin-top: 16px;
  color: var(--primary-text);
  font-size: 1em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.message-popup {
  position: fixed;
  top: 80px;
  right: 30px;
  max-width: 400px;
  padding: 14px 20px;
  background-color: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  opacity: 0;
  visibility: hidden;
  transform: translateX(20px);
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
}

.message-popup.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.message-popup.info {
  border-left: 4px solid var(--highlight-text);
}

.message-popup.success {
  border-left: 4px solid #10b981;
}

.message-popup.error {
  border-left: 4px solid var(--danger-color, #ef4444);
}

.message-popup.warning {
  border-left: 4px solid #f59e0b;
}

@media (max-width: 768px) {
  .message-popup {
    top: 72px;
    left: 12px;
    right: 12px;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .message-popup {
    top: 68px;
    left: 10px;
    right: 10px;
    padding: 12px 14px;
    border-radius: 10px;
  }
}
</style>
