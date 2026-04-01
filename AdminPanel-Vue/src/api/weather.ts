import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface HourlyWeather {
  fxTime: string;
  temp: string;
  icon: string;
  text: string;
  humidity: string;
  windDir: string;
  windScale: string;
  pressure: string;
}

export interface DailyWeather {
  fxDate: string;
  tempMax: string;
  tempMin: string;
  iconDay: string;
  textDay: string;
}

export interface WeatherData {
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  updateTime?: string;
}

export const weatherApi = {
  async getWeather(
    requestInit: RequestInit = {},
    uiOptions: ApiUiOptions = false
  ): Promise<WeatherData> {
    return apiFetch("/admin_api/weather", requestInit, uiOptions);
  },
};
