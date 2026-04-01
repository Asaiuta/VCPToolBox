import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface NewsItem {
  title: string;
  url?: string | null;
  source: string;
  timestamp?: string;
}

export interface NewsResponse {
  success: boolean;
  data: NewsItem[];
  message?: string;
}

export const newsApi = {
  async getNews(uiOptions: ApiUiOptions = false): Promise<NewsItem[]> {
    const response = await apiFetch<NewsResponse>("/admin_api/dailyhot", {}, uiOptions);
    return response.data || [];
  },

  async getGroupedNews(
    limitPerSource = 2,
    totalLimit = 10,
    uiOptions: ApiUiOptions = false
  ): Promise<NewsItem[]> {
    const allNews = await this.getNews(uiOptions);
    const grouped: Record<string, NewsItem[]> = {};

    for (const item of allNews) {
      const source = item.source || "Other";
      if (!grouped[source]) {
        grouped[source] = [];
      }
      if (grouped[source].length < limitPerSource) {
        grouped[source].push(item);
      }
    }

    return Object.values(grouped).flat().slice(0, totalLimit);
  },
};
