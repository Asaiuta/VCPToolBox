import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as VueModule from "vue";

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof VueModule>("vue");
  return {
    ...actual,
    onMounted: () => {},
  };
});

const {
  mockGetAgentFiles,
  mockGetAgentMap,
  mockCreateAgentFile,
  mockGetAgentFileContent,
  mockSaveAgentMap,
  mockSaveAgentFile,
  mockShowMessage,
} = vi.hoisted(() => ({
  mockGetAgentFiles: vi.fn(async () => []),
  mockGetAgentMap: vi.fn(async () => ({})),
  mockCreateAgentFile: vi.fn(async () => undefined),
  mockGetAgentFileContent: vi.fn(async () => ""),
  mockSaveAgentMap: vi.fn(async () => undefined),
  mockSaveAgentFile: vi.fn(async () => undefined),
  mockShowMessage: vi.fn(),
}));

vi.mock("@/api", () => ({
  agentApi: {
    getAgentFiles: (...args: unknown[]) => mockGetAgentFiles(...args),
    getAgentMap: (...args: unknown[]) => mockGetAgentMap(...args),
    saveAgentMap: (...args: unknown[]) => mockSaveAgentMap(...args),
    createAgentFile: (...args: unknown[]) => mockCreateAgentFile(...args),
    getAgentFileContent: (...args: unknown[]) => mockGetAgentFileContent(...args),
    saveAgentFile: (...args: unknown[]) => mockSaveAgentFile(...args),
  },
}));

vi.mock("@/utils", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

import { useAgentFilesEditor } from "@/views/AgentFilesEditor/useAgentFilesEditor";

describe("useAgentFilesEditor", () => {
  beforeEach(() => {
    mockGetAgentFiles.mockReset();
    mockGetAgentMap.mockReset();
    mockCreateAgentFile.mockReset();
    mockGetAgentFileContent.mockReset();
    mockSaveAgentMap.mockReset();
    mockSaveAgentFile.mockReset();
    mockShowMessage.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => "MyAgent.txt"));
  });

  it("loads available files and agent map", async () => {
    mockGetAgentFiles.mockResolvedValueOnce(["A.txt", "sub/B.txt"]);
    mockGetAgentMap.mockResolvedValueOnce({ Nova: "A.txt", Atlas: "sub/B.txt" });

    const state = useAgentFilesEditor();
    await state.loadAvailableFiles();
    await state.loadAgentMap();

    expect(state.availableFiles.value).toEqual(["A.txt", "sub/B.txt"]);
    expect(state.agentMap.value).toEqual([
      { name: "Nova", file: "A.txt" },
      { name: "Atlas", file: "sub/B.txt" },
    ]);
  });

  it("supports add/remove/create/select workflows", async () => {
    const state = useAgentFilesEditor();

    state.addAgentEntry();
    expect(state.agentMap.value).toHaveLength(1);

    state.removeAgentEntry(0);
    expect(state.agentMap.value).toHaveLength(0);

    mockCreateAgentFile.mockResolvedValueOnce(undefined);
    mockGetAgentMap.mockResolvedValueOnce({ Nova: "A.txt" });
    mockGetAgentFileContent.mockResolvedValueOnce("agent-content");

    await state.createAgentFile();
    await Promise.resolve();
    expect(mockShowMessage).toHaveBeenCalled();

    await state.selectAgentFile("A.txt");
    expect(state.editingFile.value).toBe("A.txt");
    expect(state.fileContent.value).toBe("agent-content");
  });

  it("saves map and file with expected payload", async () => {
    const state = useAgentFilesEditor();

    state.agentMap.value = [
      { name: "Nova", file: "A.txt" },
      { name: "", file: "" },
    ];
    mockSaveAgentMap.mockResolvedValueOnce(undefined);

    await state.saveAgentMap();

    expect(mockSaveAgentMap).toHaveBeenCalledWith(
      { Nova: "A.txt" },
      { loadingKey: "agent-files.map.save" }
    );

    mockSaveAgentFile.mockReset();

    state.editingFile.value = "A.txt";
    state.fileContent.value = "new content";
    mockSaveAgentFile.mockResolvedValueOnce(undefined);

    await state.saveAgentFile();

    expect(mockSaveAgentFile).toHaveBeenCalledWith(
      "A.txt",
      "new content",
      { loadingKey: "agent-files.file.save" }
    );
    expect(state.fileStatusType.value).toBe("success");
  });
});
