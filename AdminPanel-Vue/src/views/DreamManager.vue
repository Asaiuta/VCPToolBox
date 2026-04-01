<template>
  <section class="config-section active-section">
    <p class="description">
      在梦境操作触及日记文件前进行审核。
    </p>
    <div id="dream-manager-content">
      <div v-if="dreams.length === 0" class="dream-empty-state">
        <p>暂无梦境日志。</p>
      </div>
      <div
        v-else
        v-for="dream in dreams"
        :key="dream.id"
        class="dream-log-card"
        :class="{ 'has-pending': dream.hasPending }"
      >
        <div class="dream-log-header" @click="dream.expanded = !dream.expanded">
          <div class="dream-log-title">
            <span class="dream-badge" :class="dream.status">
              {{ dream.status }}
            </span>
            <span>{{ dream.title }}</span>
          </div>
          <div class="dream-log-meta">
            <span>{{ formatDate(dream.timestamp) }}</span>
            <span>{{ dream.agent }}</span>
          </div>
        </div>
        <div v-if="dream.expanded" class="dream-log-detail">
          <div class="dream-narrative-block">
            <h4>叙述</h4>
            <div class="dream-narrative-text">{{ dream.narrative }}</div>
          </div>
          <div
            v-for="op in dream.operations"
            :key="op.id"
            class="dream-op-card"
            :class="op.status"
          >
            <div class="dream-op-header">
              <span class="dream-op-type">{{ op.type }}</span>
              <span class="dream-op-status" :class="op.status">
                {{ op.status }}
              </span>
            </div>
            <div class="dream-op-body">
              <div class="dream-op-field">
                <label>文件</label>
                <span class="dream-file-path">{{ op.file }}</span>
              </div>
              <div v-if="op.content" class="dream-op-field">
                <label>预览</label>
                <div class="dream-content-preview">{{ op.content }}</div>
              </div>
            </div>
            <div v-if="op.status === 'pending_review'" class="dream-op-actions">
              <button
                @click="approveOperation(dream.id, op.id)"
                class="dream-action-btn approve"
              >
                批准
              </button>
              <button
                @click="rejectOperation(dream.id, op.id)"
                class="dream-action-btn reject"
              >
                拒绝
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { dreamApi } from "@/api";
import { formatDate, showMessage } from "@/utils";

interface DreamOperation {
  id: string;
  type: string;
  status: string;
  file: string;
  content?: string;
}

interface DreamLogSummary {
  filename: string;
  agentName?: string;
  timestamp?: string;
  pendingCount?: number;
}

interface RawDreamOperation {
  operationId?: string | number;
  id?: string | number;
  type?: string;
  status?: string;
  targetDiary?: string;
  sourceDiaries?: string[];
  newContent?: string;
  insightContent?: string;
  targetContent?: string;
}

interface RawDreamDetail {
  agentName?: string;
  timestamp?: string;
  dreamNarrative?: string;
  operations?: RawDreamOperation[];
}

interface Dream {
  id: string;
  title: string;
  timestamp: string;
  agent: string;
  status: string;
  hasPending: boolean;
  narrative: string;
  operations: DreamOperation[];
  expanded: boolean;
}

const dreams = ref<Dream[]>([]);

function extractFileName(filePath: string): string {
  if (!filePath) return "";
  const normalized = filePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || filePath;
}

function mapOperation(operation: RawDreamOperation): DreamOperation {
  return {
    id: String(operation.operationId ?? operation.id ?? ""),
    type: operation.type || "unknown",
    status: operation.status || "unknown",
    file: extractFileName(
      operation.targetDiary || operation.sourceDiaries?.[0] || ""
    ),
    content:
      operation.newContent ||
      operation.insightContent ||
      operation.targetContent ||
      "",
  };
}

function mapDream(summary: DreamLogSummary, detail: RawDreamDetail): Dream {
  const operations = Array.isArray(detail.operations)
    ? detail.operations.map((operation) => mapOperation(operation))
    : [];
  const hasPending =
    operations.some((operation) => operation.status === "pending_review") ||
    (summary.pendingCount ?? 0) > 0;
  const agentName = detail.agentName || summary.agentName || "Unknown";

  return {
    id: summary.filename,
    title: `${agentName} dream`,
    timestamp: detail.timestamp || summary.timestamp || "",
    agent: agentName,
    status: hasPending ? "pending_review" : "done",
    hasPending,
    narrative: detail.dreamNarrative || "",
    operations,
    expanded: false,
  };
}

async function loadDreams() {
  try {
    const summaries = await dreamApi.getDreamLogSummaries(false);
    const detailResults = await Promise.allSettled(
      summaries.map(async (summary) => {
        const detail = await dreamApi.getDreamLogDetail(summary.filename, false);
        return mapDream(summary, detail);
      })
    );

    const items = detailResults
      .filter(
        (result): result is PromiseFulfilledResult<Dream> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    const failedCount = detailResults.length - items.length;
    if (failedCount > 0) {
      showMessage(
        `加载失败，共 ${failedCount} 条梦境日志详细信息。`,
        "info"
      );
    }

    dreams.value = items.sort((left, right) => {
      const leftTime = new Date(left.timestamp || 0).getTime();
      const rightTime = new Date(right.timestamp || 0).getTime();
      return rightTime - leftTime;
    });
  } catch (error) {
    console.error("Failed to load dreams:", error);
    dreams.value = [];
  }
}

async function reviewOperation(
  dreamId: string,
  operationId: string,
  action: "approve" | "reject"
) {
  try {
    await dreamApi.reviewDreamOperation(
      dreamId,
      operationId,
      action,
      {
        loadingKey: `dream-manager.operation.${action}`,
      }
    );

    showMessage(
      action === "approve" ? "操作已批准。" : "操作已拒绝。",
      "success"
    );
    await loadDreams();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showMessage(
      `无法${action === "approve" ? "批准" : "拒绝"}操作：${errorMessage}`,
      "error"
    );
  }
}

async function approveOperation(dreamId: string, operationId: string) {
  await reviewOperation(dreamId, operationId, "approve");
}

async function rejectOperation(dreamId: string, operationId: string) {
  await reviewOperation(dreamId, operationId, "reject");
}

onMounted(() => {
  loadDreams();
});
</script>

<style scoped>
.dream-empty-state {
  text-align: center;
  padding: 60px 20px;
  opacity: 0.7;
}

.dream-log-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 12px;
}

.dream-log-card.has-pending {
  border-left: 3px solid #f0a500;
}

.dream-log-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
}

.dream-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;
  background: var(--tertiary-bg);
}

.dream-log-header:hover {
  background: var(--accent-bg);
}

.dream-log-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95em;
}

.dream-log-meta {
  display: flex;
  gap: 16px;
  font-size: 0.82em;
  opacity: 0.6;
}

.dream-badge {
  font-size: 0.75em;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.dream-badge.pending,
.dream-badge.pending_review {
  background: rgba(240, 165, 0, 0.2);
  color: #f0a500;
}

.dream-badge.done,
.dream-badge.approved {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.dream-badge.rejected {
  background: rgba(244, 67, 54, 0.2);
  color: var(--danger-color);
}

.dream-log-detail {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.dream-narrative-block {
  background: var(--secondary-bg);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
}

.dream-narrative-block h4 {
  margin: 0 0 8px;
  font-size: 0.9em;
}

.dream-narrative-text {
  white-space: pre-wrap;
  font-size: 0.9em;
  line-height: 1.6;
  max-height: 300px;
  overflow-y: auto;
}

.dream-op-card {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 10px;
  overflow: hidden;
}

.dream-op-card.approved {
  border-left: 3px solid #4caf50;
}

.dream-op-card.rejected {
  border-left: 3px solid var(--danger-color);
  opacity: 0.7;
}

.dream-op-card.pending_review {
  border-left: 3px solid #f0a500;
}

.dream-op-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--tertiary-bg);
}

.dream-op-type {
  font-weight: 600;
  font-size: 0.9em;
}

.dream-op-status {
  font-size: 0.8em;
  padding: 2px 8px;
  border-radius: 4px;
}

.dream-op-body {
  padding: 10px 12px;
}

.dream-op-field {
  margin-bottom: 8px;
}

.dream-op-field label {
  font-size: 0.8em;
  opacity: 0.6;
  display: block;
  margin-bottom: 4px;
}

.dream-file-path {
  font-size: 0.85em;
  background: var(--chip-bg, rgba(255, 255, 255, 0.08));
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Consolas", "Monaco", monospace;
}

.dream-content-preview {
  background: rgba(0, 0, 0, 0.15);
  padding: 10px;
  border-radius: 4px;
  font-size: 0.85em;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 250px;
  overflow-y: auto;
  margin: 4px 0;
}

.dream-op-actions {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--border-color);
}

.dream-action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  transition: opacity 0.15s;
}

.dream-action-btn:hover {
  opacity: 0.85;
}

.dream-action-btn.approve {
  background: #4caf50;
  color: #fff;
}

.dream-action-btn.reject {
  background: var(--danger-color);
  color: #fff;
}
</style>
