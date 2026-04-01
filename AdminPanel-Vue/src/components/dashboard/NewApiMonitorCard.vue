<template>
  <div class="dashboard-card-shell dashboard-card-shell--emerald newapi-card">
    <div class="dashboard-card-header card-header">
      <div>
        <h3 class="dashboard-card-title">NewAPI 监控</h3>
        <p class="dashboard-card-subtitle card-subtitle">最近 24 小时用量总览</p>
      </div>
      <span class="dashboard-card-badge source-badge">{{ sourceLabel }}</span>
    </div>

    <div v-if="status === 'loading'" class="card-state">正在加载监控数据...</div>

    <div v-else-if="status === 'unavailable'" class="card-state card-state-warning">
      <strong>监控未配置</strong>
      <p>{{ errorMessage || "后端已提供接口，但当前实例尚未完成 NewAPI Monitor 配置。" }}</p>
    </div>

    <div v-else-if="status === 'error'" class="card-state card-state-error">
      <strong>监控加载失败</strong>
      <p>{{ errorMessage || "请检查后端日志或 NewAPI Monitor 配置。" }}</p>
    </div>

    <div v-else-if="!summary" class="card-state">暂无可展示的监控数据。</div>

    <template v-else>
      <div class="metrics-grid">
        <div class="dashboard-card-panel metric-tile">
          <span class="metric-label">请求数</span>
          <strong class="metric-value">{{ formatCompact(summary.total_requests) }}</strong>
        </div>
        <div class="dashboard-card-panel metric-tile">
          <span class="metric-label">Tokens</span>
          <strong class="metric-value">{{ formatCompact(summary.total_tokens) }}</strong>
        </div>
        <div class="dashboard-card-panel metric-tile">
          <span class="metric-label">Quota</span>
          <strong class="metric-value">{{ formatCompact(summary.total_quota) }}</strong>
        </div>
        <div class="dashboard-card-panel metric-tile">
          <span class="metric-label">实时 RPM / TPM</span>
          <strong class="metric-value">
            {{ formatCompact(summary.current_rpm) }} / {{ formatCompact(summary.current_tpm) }}
          </strong>
        </div>
      </div>

      <div class="content-grid">
        <section class="dashboard-card-panel trend-panel">
          <div class="panel-header">
            <span>请求趋势</span>
            <span class="panel-hint">{{ trendItems.length }} 个时间桶</span>
          </div>
          <div v-if="trendItems.length === 0" class="panel-empty">暂无趋势数据</div>
          <div v-else class="sparkline-wrap">
            <svg
              class="sparkline"
              viewBox="0 0 320 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="newapiSparkFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="rgba(34, 197, 94, 0.28)" />
                  <stop offset="100%" stop-color="rgba(34, 197, 94, 0.02)" />
                </linearGradient>
              </defs>
              <path :d="sparklineAreaPath" class="sparkline-area" />
              <path :d="sparklineLinePath" class="sparkline-line" />
            </svg>
            <div class="trend-caption">
              <span>峰值 {{ formatCompact(maxRequests) }}</span>
              <span>总计 {{ formatCompact(summary.total_requests) }}</span>
            </div>
          </div>
        </section>

        <section class="dashboard-card-panel models-panel">
          <div class="panel-header">
            <span>Top 模型</span>
            <span class="panel-hint">{{ topModels.length }} / {{ models.length }}</span>
          </div>
          <div v-if="topModels.length === 0" class="panel-empty">暂无模型维度数据</div>
          <ul v-else class="model-list">
            <li v-for="model in topModels" :key="model.model_name" class="model-item">
              <div class="model-meta">
                <strong class="model-name">{{ model.model_name || "unknown" }}</strong>
                <span class="model-requests">{{ formatCompact(model.requests) }} req</span>
              </div>
              <div class="model-bar-track">
                <div class="model-bar-fill" :style="{ width: `${getModelWidth(model)}%` }"></div>
              </div>
              <div class="model-detail">
                <span>{{ formatCompact(model.token_used) }} tokens</span>
                <span>{{ formatCompact(model.quota) }} quota</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  NewApiMonitorModelItem,
  NewApiMonitorSummary,
  NewApiMonitorTrendItem,
} from "@/api";

type CardStatus = "loading" | "ready" | "unavailable" | "error";

const compactNumberFormatter = new Intl.NumberFormat("zh-CN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const props = defineProps<{
  summary: NewApiMonitorSummary | null;
  trendItems: NewApiMonitorTrendItem[];
  models: NewApiMonitorModelItem[];
  status: CardStatus;
  errorMessage?: string;
}>();

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return compactNumberFormatter.format(value);
}

const topModels = computed(() => props.models.slice(0, 4));

const maxRequests = computed(() => {
  return props.trendItems.reduce((max, item) => Math.max(max, item.requests), 0);
});

const maxModelRequests = computed(() => {
  return props.models.reduce((max, item) => Math.max(max, item.requests), 0);
});

const sourceLabel = computed(() => {
  if (!props.summary?.source) {
    return "monitor";
  }

  return props.summary.source === "quota_data" ? "quota_data" : props.summary.source;
});

function getModelWidth(model: NewApiMonitorModelItem): number {
  if (maxModelRequests.value <= 0) {
    return 0;
  }

  return Math.max(8, (model.requests / maxModelRequests.value) * 100);
}

const sparklinePoints = computed(() => {
  const points = props.trendItems;
  if (points.length === 0) {
    return [];
  }

  const width = 320;
  const height = 100;
  const paddingX = 8;
  const paddingY = 10;
  const maxValue = Math.max(...points.map((item) => item.requests), 1);

  return points.map((item, index) => {
    const x =
      points.length === 1
        ? width / 2
        : paddingX + (index / (points.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - (item.requests / maxValue) * (height - paddingY * 2);
    return { x, y };
  });
});

const sparklineLinePath = computed(() => {
  if (sparklinePoints.value.length === 0) {
    return "";
  }

  return sparklinePoints.value
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
});

const sparklineAreaPath = computed(() => {
  if (sparklinePoints.value.length === 0) {
    return "";
  }

  const firstPoint = sparklinePoints.value[0];
  const lastPoint = sparklinePoints.value[sparklinePoints.value.length - 1];

  return [
    `M ${firstPoint.x} 100`,
    ...sparklinePoints.value.map((point) => `L ${point.x} ${point.y}`),
    `L ${lastPoint.x} 100`,
    "Z",
  ].join(" ");
});
</script>

<style scoped>
@import "./dashboard-card.css";

/* 统一 Container Query 断点系统 */
/* 断点：768px (桌面), 520px (平板), 420px (小屏), 360px (大屏手机), 280px (小屏手机) */

.newapi-card {
  --dashboard-accent: #22c55e;
  --dashboard-accent-soft: rgba(34, 197, 94, 0.16);
  --dashboard-accent-border: rgba(34, 197, 94, 0.3);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metric-tile {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px;
  min-height: auto;
}

.metric-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.76em;
  color: var(--secondary-text);
}

.metric-value {
  font-size: 1.15em;
  line-height: 1.2;
  color: var(--primary-text);
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  flex: 1;
  min-height: 0;
  gap: 16px;
}

.trend-panel,
.models-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 100%;
  padding: 14px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
  font-weight: 600;
  color: var(--primary-text);
}

.panel-hint {
  font-size: 0.76em;
  font-weight: 500;
  color: var(--secondary-text);
}

.sparkline-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
}

.sparkline {
  width: 100%;
  height: 120px;
}

.sparkline-area {
  fill: url(#newapiSparkFill);
}

.sparkline-line {
  fill: none;
  stroke: #22c55e;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.trend-caption,
.model-detail,
.card-state p {
  font-size: 0.84em;
  color: var(--secondary-text);
}

.trend-caption {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.model-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 12px;
  margin: 0;
  padding: 0 4px 0 0;
  list-style: none;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 197, 94, 0.3) transparent;
}

.model-list::-webkit-scrollbar {
  width: 4px;
}

.model-list::-webkit-scrollbar-track {
  background: transparent;
}

.model-list::-webkit-scrollbar-thumb {
  background: rgba(34, 197, 94, 0.3);
  border-radius: 2px;
}

.model-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.model-name {
  font-size: 0.92em;
  word-break: break-word;
  color: var(--primary-text);
}

.model-requests {
  font-size: 0.82em;
  color: var(--secondary-text);
}

.model-bar-track {
  width: 100%;
  height: 8px;
  overflow: hidden;
  border-radius: var(--radius-full, 999px);
  background: var(--tertiary-bg);
}

.model-bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #22c55e, #14b8a6);
}

.panel-empty,
.card-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 120px;
  overflow-wrap: anywhere;
  color: var(--secondary-text);
}

.model-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.card-state strong {
  margin-bottom: 8px;
  color: var(--primary-text);
}

.card-state-warning strong {
  color: #ca8a04;
}

.card-state-error strong {
  color: #dc2626;
}

/* 断点 1: ≥520px - 宽松布局 */
@container dashboard-card (min-width: 520px) {
  .metrics-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }

  .metric-tile {
    min-height: 104px;
    padding: 16px 18px;
  }

  .metric-value {
    font-size: 1.32em;
  }

  .content-grid {
    grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
    gap: 18px;
  }

  .trend-panel,
  .models-panel {
    padding: 18px;
  }

  .sparkline {
    height: 148px;
  }
}

/* 断点 2: ≤420px - 单列内容 */
@container dashboard-card (max-width: 420px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

/* 断点 3: ≤360px - 紧凑布局 */
@container dashboard-card (max-width: 360px) {
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .metric-tile,
  .trend-panel,
  .models-panel {
    padding: 14px;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .model-meta,
  .trend-caption {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* 断点 4: ≤280px - 极简模式 */
@container dashboard-card (max-width: 280px) {
  .card-header {
    flex-direction: column;
  }

  .metric-value {
    font-size: 1.05em;
  }

  .panel-header {
    gap: 10px;
  }
}
</style>
