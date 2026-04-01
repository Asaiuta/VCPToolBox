<template>
  <div class="dashboard-card-shell dashboard-card-shell--emerald memory-card">
    <h3 class="dashboard-card-title">内存使用情况</h3>
    <div class="status-card-content">
      <div class="progress-circle">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle class="progress-bg" cx="60" cy="60" r="54"></circle>
          <circle
            class="progress-bar"
            cx="60"
            cy="60"
            r="54"
            :style="{ strokeDashoffset: mainStrokeOffset }"
          ></circle>
          <circle
            class="progress-bar-secondary"
            cx="60"
            cy="60"
            r="54"
            :style="{ strokeDashoffset: secondaryStrokeOffset }"
          ></circle>
        </svg>
        <span class="progress-text">{{ usage.toFixed(1) }}%</span>
      </div>
      <div class="info-section">
        <p class="info-text">{{ info }}</p>
        <p
          class="info-text-secondary"
          v-if="vcpUsage !== undefined && vcpUsage > 0"
        >
          VCP 占用：{{ vcpUsage.toFixed(1) }}%
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  usage: number;
  info: string;
  vcpUsage?: number;
}>();

const circumference = 2 * Math.PI * 54;
const mainStrokeOffset = computed(() => {
  return circumference - (circumference * props.usage) / 100;
});

const secondaryStrokeOffset = computed(() => {
  if (props.vcpUsage === undefined) {
    return circumference;
  }

  return circumference - (circumference * props.vcpUsage) / 100;
});
</script>

<style scoped>
@import "./dashboard-card.css";

/* 统一 Container Query 断点系统 */
/* 断点：768px (桌面), 520px (平板), 420px (小屏), 360px (大屏手机), 280px (小屏手机) */

.memory-card {
  --dashboard-accent: var(--memory-color, #4ade80);
  --dashboard-accent-soft: rgba(74, 222, 128, 0.18);
  --dashboard-accent-border: rgba(74, 222, 128, 0.32);
}

.status-card-content {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  min-height: 0;
  gap: 20px;
}

.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: var(--tertiary-bg);
  stroke-width: 10;
}

.progress-bar {
  fill: none;
  stroke: var(--memory-color, #4ade80);
  stroke-width: 10;
  stroke-linecap: round;
  /* 使用 CSS 变量计算圆环周长：2 * π * 54 ≈ 339.292 */
  --circle-circumference: 339.292;
  stroke-dasharray: var(--circle-circumference);
  transition: stroke-dashoffset 0.5s ease-out;
}

.progress-bar-secondary {
  fill: none;
  stroke: #f9ab00;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-dasharray: var(--circle-circumference);
  transition: stroke-dashoffset 0.5s ease-out;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5em;
  font-weight: 700;
  color: var(--primary-text);
}

.info-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 10px;
}

.info-text {
  margin: 0;
  font-size: 0.9em;
  line-height: 1.4;
  word-break: break-word;
  color: var(--secondary-text);
}

.info-text-secondary {
  margin-top: 8px;
  font-size: 0.85em;
  line-height: 1.5;
  word-break: break-word;
  color: var(--secondary-text);
  opacity: 0.8;
}

/* 断点 1: ≥520px - 网格布局 */
@container dashboard-card (min-width: 520px) {
  .status-card-content {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .progress-circle {
    width: 128px;
    height: 128px;
  }

  .progress-circle svg {
    width: 128px;
    height: 128px;
  }

  .progress-text {
    font-size: 1.65em;
  }

  .info-section {
    padding-top: 12px;
  }

  .info-text-secondary {
    margin-top: 10px;
  }
}

/* 断点 2: ≤360px - 垂直堆叠 */
@container dashboard-card (max-width: 360px) {
  .status-card-content {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .progress-circle {
    width: 108px;
    height: 108px;
  }

  .progress-circle svg {
    width: 108px;
    height: 108px;
  }

  .progress-text {
    font-size: 1.35em;
  }

  .info-section {
    width: 100%;
  }
}

/* 断点 3: ≤280px - 紧凑模式 */
@container dashboard-card (max-width: 280px) {
  .status-card-content {
    gap: 14px;
  }

  .progress-circle {
    width: 96px;
    height: 96px;
  }

  .progress-circle svg {
    width: 96px;
    height: 96px;
  }

  .progress-text {
    font-size: 1.2em;
  }

  .info-text {
    font-size: 0.85em;
  }

  .info-text-secondary {
    font-size: 0.8em;
  }
}
</style>
