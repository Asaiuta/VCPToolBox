import type { Component } from "vue";
import ActivityChartCard from "@/components/dashboard/ActivityChartCard.vue";
import CalendarCard from "@/components/dashboard/CalendarCard.vue";
import CpuCard from "@/components/dashboard/CpuCard.vue";
import MemoryCard from "@/components/dashboard/MemoryCard.vue";
import NewApiMonitorCard from "@/components/dashboard/NewApiMonitorCard.vue";
import NewsCard from "@/components/dashboard/NewsCard.vue";
import NodeInfoCard from "@/components/dashboard/NodeInfoCard.vue";
import ProcessCard from "@/components/dashboard/ProcessCard.vue";
import WeatherCard from "@/components/dashboard/WeatherCard.vue";

export const builtinComponentMap: Record<string, Component> = {
  weather: WeatherCard,
  "newapi-monitor": NewApiMonitorCard,
  cpu: CpuCard,
  memory: MemoryCard,
  process: ProcessCard,
  news: NewsCard,
  "node-info": NodeInfoCard,
  calendar: CalendarCard,
  "activity-chart": ActivityChartCard,
};
