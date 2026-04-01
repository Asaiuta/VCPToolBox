<template>
  <div v-if="modelValue" class="card-manager-overlay" @click.self="close">
    <div class="card-manager">
      <div class="card-manager-header">
        <div>
          <h2>卡片管理</h2>
          <p>官方卡片和插件卡片都通过同一套布局系统管理。</p>
        </div>
        <button type="button" class="card-manager-close" @click="close">关闭</button>
      </div>

      <section class="card-manager-section">
        <div class="card-manager-section-header">
          <h3>可添加卡片</h3>
          <button type="button" class="card-manager-reset" @click="emit('reset-layout')">
            恢复默认布局
          </button>
        </div>
        <div class="card-manager-grid">
          <article
            v-for="card in contributions"
            :key="card.typeId"
            class="card-manager-item"
          >
            <div class="card-manager-item-copy">
              <h4>{{ card.title }}</h4>
              <p>{{ card.description || "暂无描述" }}</p>
              <span class="card-manager-meta">
                {{ card.source === "builtin" ? "官方卡片" : `插件 · ${card.pluginName}` }}
              </span>
            </div>
            <button
              type="button"
              class="card-manager-add"
              :disabled="card.singleton && existingTypeIds.has(card.typeId)"
              @click="emit('add-card', card.typeId)"
            >
              {{ card.singleton && existingTypeIds.has(card.typeId) ? "已添加" : "添加" }}
            </button>
          </article>
        </div>
      </section>

      <section class="card-manager-section">
        <h3>当前布局</h3>
        <div class="card-manager-list">
          <article
            v-for="instance in instances"
            :key="instance.instanceId"
            class="card-manager-instance"
          >
            <div class="card-manager-item-copy">
              <h4>{{ getInstanceTitle(instance) }}</h4>
              <p>{{ instance.typeId }}</p>
            </div>
            <div class="card-manager-instance-actions">
              <button
                type="button"
                class="card-manager-toggle"
                @click="emit('toggle-instance', { instanceId: instance.instanceId, enabled: !instance.enabled })"
              >
                {{ instance.enabled ? "隐藏" : "显示" }}
              </button>
              <button
                type="button"
                class="card-manager-remove"
                @click="emit('remove-instance', instance.instanceId)"
              >
                删除
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DashboardCardContribution, DashboardCardInstance } from "@/dashboard/core/types";

const props = defineProps<{
  modelValue: boolean;
  contributions: DashboardCardContribution[];
  instances: DashboardCardInstance[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "add-card": [typeId: string];
  "toggle-instance": [payload: { instanceId: string; enabled: boolean }];
  "remove-instance": [instanceId: string];
  "reset-layout": [];
}>();

const existingTypeIds = computed(() => new Set(props.instances.map((instance) => instance.typeId)));

function close() {
  emit("update:modelValue", false);
}

function getInstanceTitle(instance: DashboardCardInstance): string {
  return props.contributions.find((card) => card.typeId === instance.typeId)?.title ?? instance.typeId;
}
</script>

<style scoped>
.card-manager-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(16px);
}

.card-manager {
  width: min(980px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  padding: 24px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02)),
    var(--secondary-bg);
  box-shadow: 0 28px 60px -28px rgba(15, 23, 42, 0.65);
}

.card-manager-header,
.card-manager-section-header,
.card-manager-item,
.card-manager-instance {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-manager-header {
  margin-bottom: 24px;
}

.card-manager-header h2,
.card-manager-section h3,
.card-manager-item h4,
.card-manager-instance h4 {
  margin: 0;
}

.card-manager-header p,
.card-manager-item p,
.card-manager-instance p {
  margin: 8px 0 0;
  color: var(--secondary-text);
}

.card-manager-close,
.card-manager-reset,
.card-manager-add,
.card-manager-toggle,
.card-manager-remove {
  flex-shrink: 0;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: var(--primary-text);
  cursor: pointer;
}

.card-manager-close:hover,
.card-manager-reset:hover,
.card-manager-add:hover,
.card-manager-toggle:hover,
.card-manager-remove:hover {
  border-color: rgba(56, 189, 248, 0.38);
}

.card-manager-instance-actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.card-manager-add:disabled {
  opacity: 0.58;
  cursor: not-allowed;
}

.card-manager-section + .card-manager-section {
  margin-top: 28px;
}

.card-manager-grid,
.card-manager-list {
  display: grid;
  gap: 14px;
  margin-top: 16px;
}

.card-manager-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.card-manager-item,
.card-manager-instance {
  padding: 16px 18px;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
}

.card-manager-item-copy,
.card-manager-instance > :first-child {
  min-width: 0;
}

.card-manager-meta {
  display: inline-flex;
  margin-top: 12px;
  color: var(--highlight-text);
  font-size: 0.82rem;
  font-weight: 600;
}

@media (max-width: 640px) {
  .card-manager-overlay {
    padding: 12px;
  }

  .card-manager {
    padding: 18px;
    border-radius: 18px;
  }

  .card-manager-header,
  .card-manager-section-header,
  .card-manager-item,
  .card-manager-instance {
    flex-direction: column;
  }

  .card-manager-close,
  .card-manager-reset,
  .card-manager-add,
  .card-manager-toggle,
  .card-manager-remove {
    width: 100%;
  }

  .card-manager-instance-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>
