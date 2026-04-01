import type { Folder, Note, RagTagsConfig } from "@/types";
import { apiFetch, type ApiFetchUiOptions } from "@/utils/api";

type ApiUiOptions = boolean | ApiFetchUiOptions;

export interface DiaryListParams {
  folder?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface DiaryListResponse {
  notes: Note[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DiaryContentResponse {
  file: string;
  content: string;
}

export interface DiarySaveResponse {
  path: string;
  message?: string;
}

export interface DiaryDeleteResponse {
  deleted: string[];
  message?: string;
}

export interface DiaryMoveTarget {
  folder: string;
  file: string;
}

export interface AssociativeDiscoveryParams {
  sourceFilePath: string;
  k: number;
  range: string[];
  tagBoost?: number;
}

export interface DiscoveryResultRaw {
  name: string;
  path: string;
  score: number;
  matchedTags?: string[];
  chunks?: string[];
}

export interface AssociativeDiscoveryResponse {
  warning?: string;
  results?: DiscoveryResultRaw[];
}

interface NoteListApiItem {
  name?: string;
  lastModified?: string;
  preview?: string;
  excerpt?: string;
  contentPreview?: string;
  summary?: string;
}

interface DailyNotesResponse {
  notes?: NoteListApiItem[];
}

type RagTagsFolderResponse =
  | {
      tags?: string[];
      threshold?: number;
    }
  | string[];

function parseDiaryPath(filePath: string): { folder: string; file: string } {
  const normalized = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (normalized.length !== 2) {
    throw new Error("Diary path must use the format <folder>/<file>.");
  }

  return {
    folder: normalized[0],
    file: normalized[1],
  };
}

function normalizeNote(note: NoteListApiItem): Note {
  const file = note.name || "";
  return {
    file,
    title: file.replace(/\.md$/i, ""),
    modified: note.lastModified || "",
    preview: note.preview || note.excerpt || note.contentPreview || note.summary || "",
  };
}

function normalizeRagTagsConfig(config: RagTagsFolderResponse | undefined): RagTagsConfig {
  if (!config) {
    return {
      thresholdEnabled: false,
      threshold: 0.7,
      tags: [],
    };
  }

  if (Array.isArray(config)) {
    return {
      thresholdEnabled: false,
      threshold: 0.7,
      tags: config,
    };
  }

  return {
    thresholdEnabled: config.threshold !== undefined,
    threshold: config.threshold ?? 0.7,
    tags: config.tags || [],
  };
}

export const diaryApi = {
  async getDiaryList(
    params: DiaryListParams = {},
    uiOptions: ApiUiOptions = false
  ): Promise<DiaryListResponse> {
    let response: DailyNotesResponse = {};

    if (params.search?.trim()) {
      const searchParams = new URLSearchParams({
        term: params.search.trim(),
      });
      if (params.folder) {
        searchParams.set("folder", params.folder);
      }
      response = await apiFetch<DailyNotesResponse>(
        `/admin_api/dailynotes/search?${searchParams.toString()}`,
        {},
        uiOptions
      );
    } else if (params.folder) {
      response = await apiFetch<DailyNotesResponse>(
        `/admin_api/dailynotes/folder/${encodeURIComponent(params.folder)}`,
        {},
        uiOptions
      );
    }

    const notes = Array.isArray(response.notes)
      ? response.notes.map((note) => normalizeNote(note))
      : [];

    return {
      notes,
      total: notes.length,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? notes.length,
    };
  },

  async getDiaryContent(
    file: string,
    uiOptions: ApiUiOptions = false
  ): Promise<string> {
    const path = parseDiaryPath(file);
    const response = await apiFetch<{ content?: string }>(
      `/admin_api/dailynotes/note/${encodeURIComponent(path.folder)}/${encodeURIComponent(path.file)}`,
      {},
      uiOptions
    );
    return response.content || "";
  },

  async saveDiary(
    file: string,
    content: string,
    uiOptions: ApiUiOptions = true
  ): Promise<DiarySaveResponse> {
    const path = parseDiaryPath(file);
    const response = await apiFetch<{ message?: string }>(
      `/admin_api/dailynotes/note/${encodeURIComponent(path.folder)}/${encodeURIComponent(path.file)}`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
      uiOptions
    );

    return {
      path: file,
      message: response.message,
    };
  },

  async deleteDiary(
    files: string[],
    uiOptions: ApiUiOptions = true
  ): Promise<DiaryDeleteResponse> {
    const notesToDelete = files.map((filePath) => {
      const path = parseDiaryPath(filePath);
      return {
        folder: path.folder,
        file: path.file,
      };
    });

    const response = await apiFetch<DiaryDeleteResponse>(
      "/admin_api/dailynotes/delete-batch",
      {
        method: "POST",
        body: JSON.stringify({ notesToDelete }),
      },
      uiOptions
    );

    return {
      deleted: response.deleted || [],
      message: response.message,
    };
  },

  async getRagTagsConfig(
    folder: string,
    uiOptions: ApiUiOptions = false
  ): Promise<RagTagsConfig> {
    const response = await apiFetch<Record<string, RagTagsFolderResponse>>(
      "/admin_api/rag-tags",
      {},
      uiOptions
    );
    return normalizeRagTagsConfig(response[folder]);
  },

  async saveRagTagsConfig(
    folder: string,
    config: RagTagsConfig,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    const payload: Record<string, { tags: string[]; threshold?: number }> = {
      [folder]: {
        tags: config.tags.filter((tag) => tag.trim()),
      },
    };

    if (config.thresholdEnabled) {
      payload[folder].threshold = config.threshold;
    }

    return apiFetch("/admin_api/rag-tags", {
      method: "POST",
      body: JSON.stringify(payload),
    }, uiOptions);
  },

  async getFolders(uiOptions: ApiUiOptions = false): Promise<Folder[]> {
    const response = await apiFetch<{ folders?: string[] }>(
      "/admin_api/dailynotes/folders",
      {},
      uiOptions
    );
    return (response.folders || []).map((name) => ({
      name,
      path: name,
    }));
  },

  async moveDiaries(
    notes: DiaryMoveTarget[],
    targetFolder: string,
    uiOptions: ApiUiOptions = true
  ): Promise<void> {
    await apiFetch(
      "/admin_api/dailynotes/move",
      {
        method: "POST",
        body: JSON.stringify({
          sourceNotes: notes,
          targetFolder,
        }),
      },
      uiOptions
    );
  },

  async associativeDiscovery(
    payload: AssociativeDiscoveryParams,
    uiOptions: ApiUiOptions = true
  ): Promise<AssociativeDiscoveryResponse> {
    return apiFetch(
      "/admin_api/dailynotes/associative-discovery",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      uiOptions
    );
  },
};
