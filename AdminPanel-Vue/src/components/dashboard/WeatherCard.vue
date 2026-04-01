<template>
  <div class="dashboard-card-shell dashboard-card-shell--sky weather-card">
    <h3 class="dashboard-card-title">天气预报</h3>
    <div class="weather-container">
      <div class="weather-current">
        <div class="current-main">
          <span class="material-symbols-outlined weather-icon-large">{{
            data.icon
          }}</span>
          <div class="current-temp-box">
            <div class="temp-row">
              <span class="temp">{{ data.temp }}</span>
              <span class="unit">°C</span>
            </div>
            <div class="text">{{ data.text }}</div>
          </div>
        </div>
        <div class="current-details">
          <div class="dashboard-card-panel detail-item">
            <span class="material-symbols-outlined">humidity_percentage</span>
            <span>{{ data.humidity }}%</span>
          </div>
          <div class="dashboard-card-panel detail-item">
            <span class="material-symbols-outlined">air</span>
            <span>{{ data.wind }}</span>
          </div>
          <div class="dashboard-card-panel detail-item">
            <span class="material-symbols-outlined">compress</span>
            <span>{{ data.pressure }} hPa</span>
          </div>
        </div>
      </div>
      <div class="weather-forecast">
        <div
          v-for="day in data.forecast"
          :key="day.fxDate"
          class="dashboard-card-panel forecast-item"
        >
          <span class="forecast-date">{{ day.dayName }}</span>
          <span class="material-symbols-outlined forecast-icon">{{
            day.icon
          }}</span>
          <span class="forecast-temp">{{ day.tempMin }}°/{{ day.tempMax }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ForecastDay {
  fxDate: string;
  dayName: string;
  icon: string;
  tempMin: number;
  tempMax: number;
  text: string;
}

interface WeatherData {
  icon: string;
  temp: number;
  text: string;
  humidity: number;
  wind: string;
  pressure: number;
  forecast: ForecastDay[];
}

defineProps<{
  data: WeatherData;
}>();
</script>

<style scoped>
@import "./dashboard-card.css";

/* 统一 Container Query 断点系统 */
/* 断点：768px (桌面), 520px (平板), 420px (小屏), 360px (大屏手机), 280px (小屏手机) */

.weather-card {
  min-height: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
  container-type: inline-size;
  container-name: weather-card;
  overflow: hidden;
}

.weather-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 16px;
  overflow: hidden;
}

.weather-current {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 0;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  flex-shrink: 0;
}

.current-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 16px;
}

.weather-icon-large {
  font-size: 64px !important;
  color: var(--highlight-text);
  filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.35));
  animation: weather-icon-float 3s ease-in-out infinite;
}

@keyframes weather-icon-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
}

.current-temp-box {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.temp-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.temp {
  font-size: 3em;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -1px;
  color: var(--primary-text);
}

.unit {
  font-size: 1.2em;
  color: var(--secondary-text);
}

.text {
  margin-top: 4px;
  font-size: 0.95em;
  text-transform: capitalize;
  overflow-wrap: anywhere;
  color: var(--secondary-text);
}

.current-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(116px, 1fr));
  min-width: 0;
  width: 100%;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  gap: 8px;
  padding: 8px 10px;
  font-size: 0.85em;
  overflow-wrap: anywhere;
  text-align: center;
  color: var(--secondary-text);
}

.detail-item .material-symbols-outlined {
  font-size: 18px;
  color: var(--highlight-text);
}

.weather-forecast {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  flex: 1;
  align-content: start;
  gap: 10px;
  padding-top: 2px;
  padding-bottom: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(56, 189, 248, 0.3) transparent;
}

.weather-forecast::-webkit-scrollbar {
  width: 4px;
}

.weather-forecast::-webkit-scrollbar-track {
  background: transparent;
}

.weather-forecast::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.3);
  border-radius: 2px;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 86px;
  padding: 12px 10px;
}

.forecast-date {
  font-size: 0.85em;
  font-weight: 600;
  color: var(--primary-text);
}

.forecast-icon {
  font-size: 32px !important;
  color: var(--highlight-text);
}

.forecast-temp {
  font-size: 0.9em;
  font-weight: 600;
  color: var(--secondary-text);
}

/* 断点 1: ≥520px - 双列布局 */
@container weather-card (min-width: 520px) {
  .weather-container {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(220px, 0.8fr);
    align-items: stretch;
    gap: 16px;
  }

  .weather-current {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 14px;
    padding-right: 16px;
    padding-bottom: 0;
    border-right: 1px solid rgba(148, 163, 184, 0.12);
    border-bottom: 0;
    overflow: visible;
  }

  .current-main,
  .current-temp-box {
    width: 100%;
  }

  .current-details {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    width: 100%;
    gap: 10px;
  }

  .detail-item {
    padding: 10px 12px;
  }

  .weather-forecast {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: stretch;
    gap: 12px;
    padding-top: 0;
  }

  .forecast-item {
    min-height: 100px;
    padding: 12px 10px;
  }
}

/* 断点 2: ≤420px - 紧凑布局 */
@container weather-card (max-width: 420px) {
  .weather-current {
    gap: 14px;
    padding-bottom: 14px;
  }

  .current-main {
    gap: 12px;
  }

  .weather-icon-large {
    font-size: 52px !important;
  }

  .temp {
    font-size: 2.45em;
  }

  .text {
    font-size: 0.88em;
  }

  .current-details {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .detail-item {
    padding: 8px 10px;
    font-size: 0.82em;
  }

  .weather-forecast {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }

  .forecast-item {
    min-height: 76px;
    gap: 5px;
    padding: 9px 8px;
  }

  .forecast-date,
  .forecast-temp {
    font-size: 0.78em;
  }

  .forecast-icon {
    font-size: 26px !important;
  }
}

/* 断点 3: ≤360px - 单列详情 */
@container weather-card (max-width: 360px) {
  .weather-current {
    gap: 12px;
    padding-bottom: 12px;
  }

  .weather-icon-large {
    font-size: 44px !important;
  }

  .temp {
    font-size: 2em;
  }

  .text {
    font-size: 0.84em;
  }

  .current-details {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .detail-item {
    padding: 7px 8px;
    font-size: 0.76em;
  }

  .detail-item .material-symbols-outlined {
    font-size: 16px;
  }

  .weather-forecast {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .forecast-item {
    min-height: 72px;
    gap: 4px;
    padding: 8px 6px;
  }

  .forecast-date,
  .forecast-temp {
    font-size: 0.76em;
  }

  .forecast-icon {
    font-size: 24px !important;
  }
}

/* 断点 4: ≤280px - 极简模式 */
@container weather-card (max-width: 280px) {
  .weather-container {
    gap: 12px;
  }

  .current-main {
    gap: 10px;
  }

  .weather-icon-large {
    font-size: 40px !important;
  }

  .temp {
    font-size: 1.9em;
  }

  .text {
    font-size: 0.85em;
  }

  .detail-item {
    padding: 6px 8px;
    font-size: 0.72em;
  }

  .detail-item .material-symbols-outlined {
    font-size: 14px;
  }

  .weather-forecast {
    gap: 5px;
  }

  .forecast-item {
    min-height: 68px;
    gap: 3px;
    padding: 6px 4px;
  }

  .forecast-date,
  .forecast-temp {
    font-size: 0.72em;
  }

  .forecast-icon {
    font-size: 22px !important;
  }
}
</style>
