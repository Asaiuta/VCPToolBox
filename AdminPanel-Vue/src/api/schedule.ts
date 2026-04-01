import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface Schedule {
  id: string;
  time: string;
  content: string;
}

type SchedulesResponse =
  | Schedule[]
  | {
      schedules?: Schedule[];
    };

function normalizeSchedulesResponse(response: SchedulesResponse): Schedule[] {
  return Array.isArray(response) ? response : response.schedules || [];
}

export const scheduleApi = {
  async getSchedules(uiOptions: ApiUiOptions = false): Promise<Schedule[]> {
    const response = await apiFetch<SchedulesResponse>(
      "/admin_api/schedules",
      {},
      uiOptions
    );
    return normalizeSchedulesResponse(response);
  },

  async createSchedule(
    payload: Pick<Schedule, "time" | "content">,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/schedules",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },

  async deleteSchedule(id: string, uiOptions: ApiUiOptions = true): Promise<void> {
    await apiFetch(
      `/admin_api/schedules/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      uiOptions
    );
  },
};
