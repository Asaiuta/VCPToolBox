<template>
  <section class="config-section active-section">
    <div class="schedule-manager-container">
      <div class="schedule-left-panel">
        <div class="calendar-container card">
          <div class="calendar-header">
            <button @click="prevMonth" class="icon-btn">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <h3 id="current-month-year">{{ currentMonthYear }}</h3>
            <button @click="nextMonth" class="icon-btn">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
          <div id="calendar-grid" class="calendar-grid">
            <div
              v-for="day in calendarDays"
              :key="day.date.toString()"
              :class="[
                'calendar-day',
                {
                  today: day.isToday,
                  selected: day.isSelected,
                  'other-month': day.isOtherMonth,
                },
              ]"
              @click="selectDay(day)"
            >
              <span class="day-number">{{ day.day }}</span>
              <div v-if="day.hasSchedules" class="schedule-indicator"></div>
            </div>
          </div>
        </div>
        <div class="add-schedule-form card">
          <h3>添加日程</h3>
          <div class="form-group">
            <label for="new-schedule-time">时间</label>
            <input
              id="new-schedule-time"
              v-model="newSchedule.time"
              type="datetime-local"
            />
          </div>
          <div class="form-group">
            <label for="new-schedule-content">内容</label>
            <textarea
              id="new-schedule-content"
              v-model="newSchedule.content"
              rows="3"
              placeholder="描述日程内容..."
            ></textarea>
          </div>
          <button @click="addSchedule" class="btn-primary">添加</button>
        </div>
      </div>
      <div class="schedule-right-panel">
        <div class="schedule-list-container card">
          <div class="list-header">
            <h3>日程列表</h3>
            <div class="list-filters">
              <button
                @click="filterType = 'all'"
                :class="['filter-btn', { active: filterType === 'all' }]"
              >
                全部
              </button>
              <button
                @click="filterType = 'upcoming'"
                :class="['filter-btn', { active: filterType === 'upcoming' }]"
              >
                即将进行
              </button>
            </div>
          </div>
          <div id="schedule-list" class="schedule-list">
            <div v-if="filteredSchedules.length === 0" class="empty-msg">
              <p>未找到日程。</p>
            </div>
            <div
              v-else
              v-for="schedule in filteredSchedules"
              :key="schedule.id"
              class="schedule-item"
            >
              <div class="schedule-time">{{ formatScheduleTime(schedule.time) }}</div>
              <div class="schedule-content">{{ schedule.content }}</div>
              <button
                @click="deleteSchedule(schedule.id)"
                class="btn-danger btn-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { scheduleApi } from "@/api";
import { showMessage } from "@/utils";

interface Schedule {
  id: string;
  time: string;
  content: string;
}

interface CalendarDay {
  date: Date;
  day: number;
  isToday: boolean;
  isSelected: boolean;
  isOtherMonth: boolean;
  hasSchedules: boolean;
}

const currentDate = ref(new Date());
const selectedDate = ref<Date | null>(null);
const schedules = ref<Schedule[]>([]);
const newSchedule = ref({ time: "", content: "" });
const filterType = ref<"all" | "upcoming">("all");

const currentMonthYear = computed(() =>
  currentDate.value.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  })
);

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = new Date(year, month, 1 - firstDay.getDay());
  const today = new Date();
  const days: CalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDay);
    date.setDate(startDay.getDate() + index);

    days.push({
      date: new Date(date),
      day: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      isSelected: selectedDate.value?.toDateString() === date.toDateString(),
      isOtherMonth: date.getMonth() !== month,
      hasSchedules: schedules.value.some(
        (schedule) => new Date(schedule.time).toDateString() === date.toDateString()
      ),
    });
  }

  return days;
});

const filteredSchedules = computed(() => {
  const now = new Date();
  return schedules.value.filter((schedule) => {
    const scheduleDate = new Date(schedule.time);
    const matchesFilter =
      filterType.value !== "upcoming" || scheduleDate.getTime() >= now.getTime();
    const matchesSelectedDay =
      !selectedDate.value ||
      scheduleDate.toDateString() === selectedDate.value.toDateString();
    return matchesFilter && matchesSelectedDay;
  });
});

function prevMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  );
}

function nextMonth() {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  );
}

function selectDay(day: CalendarDay) {
  selectedDate.value =
    selectedDate.value?.toDateString() === day.date.toDateString()
      ? null
      : day.date;
}

function formatScheduleTime(time: string): string {
  const date = new Date(time);
  return date.toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadSchedules() {
  try {
    const data = await scheduleApi.getSchedules(
      {
        showLoader: false,
        loadingKey: "schedule.list.load",
      }
    );
    schedules.value = data.sort(
      (left, right) =>
        new Date(left.time).getTime() - new Date(right.time).getTime()
    );
  } catch (error) {
    console.error("Failed to load schedules:", error);
  }
}

async function addSchedule() {
  if (!newSchedule.value.time || !newSchedule.value.content.trim()) {
    showMessage("Please provide both time and content.", "error");
    return;
  }

  try {
    await scheduleApi.createSchedule(
      {
        time: newSchedule.value.time,
        content: newSchedule.value.content.trim(),
      },
      {
        loadingKey: "schedule.create",
      }
    );
    showMessage("Schedule added.", "success");
    newSchedule.value = { time: "", content: "" };
    await loadSchedules();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showMessage(`Failed to add schedule: ${errorMessage}`, "error");
  }
}

async function deleteSchedule(id: string) {
  if (!confirm("Delete this schedule?")) return;

  try {
    await scheduleApi.deleteSchedule(
      id,
      {
        loadingKey: "schedule.delete",
      }
    );
    showMessage("Schedule deleted.", "success");
    await loadSchedules();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    showMessage(`Failed to delete schedule: ${errorMessage}`, "error");
  }
}

function initializeCalendarWidget(containerId?: string, isDashboard = false) {
  if (isDashboard && containerId) {
    void loadSchedules();
  }
}

defineExpose({ initializeCalendarWidget });

onMounted(() => {
  void loadSchedules();
});
</script>

<style scoped>
.schedule-manager-container {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.calendar-container {
  padding: 16px;
  margin-bottom: 16px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-header h3 {
  margin: 0;
  font-size: 1.1em;
}

.icon-btn {
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  color: var(--primary-text);
}

.icon-btn:hover {
  background: var(--accent-bg);
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
}

.calendar-day:hover {
  background: var(--accent-bg);
}

.calendar-day.today {
  background: var(--button-bg);
  color: white;
}

.calendar-day.selected {
  border: 2px solid var(--highlight-text);
}

.calendar-day.other-month {
  opacity: 0.4;
}

.day-number {
  font-size: 14px;
  font-weight: 500;
}

.schedule-indicator {
  width: 4px;
  height: 4px;
  background: var(--highlight-text);
  border-radius: 50%;
  margin-top: 4px;
}

.add-schedule-form {
  padding: 16px;
}

.add-schedule-form h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.add-schedule-form .form-group {
  margin-bottom: 12px;
}

.add-schedule-form label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
}

.add-schedule-form input,
.add-schedule-form textarea {
  width: 100%;
  padding: 8px 12px;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--primary-text);
}

.schedule-list-container {
  padding: 16px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.list-header h3 {
  margin: 0;
}

.list-filters {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 12px;
  background: var(--tertiary-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--primary-text);
}

.filter-btn.active {
  background: var(--button-bg);
  color: white;
  border-color: var(--button-bg);
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.schedule-item {
  background: var(--tertiary-bg);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.schedule-time {
  font-size: 13px;
  color: var(--secondary-text);
  min-width: 100px;
}

.schedule-content {
  flex: 1;
  font-size: 14px;
}

.empty-msg {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
}

@media (max-width: 1024px) {
  .schedule-manager-container {
    grid-template-columns: 1fr;
  }
}
</style>
