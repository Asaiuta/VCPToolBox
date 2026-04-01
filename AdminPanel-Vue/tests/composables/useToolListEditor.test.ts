import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetTools, mockShowMessage } = vi.hoisted(() => ({
  mockGetTools: vi.fn(async () => []),
  mockShowMessage: vi.fn(),
}));

vi.mock("@/api", () => ({
  toolListApi: {
    getTools: (...args: unknown[]) => mockGetTools(...args),
    getConfigs: vi.fn(async () => []),
    getConfig: vi.fn(async () => []),
    saveConfig: vi.fn(async () => undefined),
    deleteConfig: vi.fn(async () => undefined),
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

import { useToolListEditor } from "@/views/ToolListEditor/useToolListEditor";

describe("useToolListEditor", () => {
  beforeEach(() => {
    mockGetTools.mockReset();
    mockShowMessage.mockReset();
  });

  it("loads tools, supports selection, and generates preview", async () => {
    mockGetTools.mockResolvedValueOnce([
      {
        uniqueId: "p1__a",
        name: "A",
        pluginName: "P1",
        description: "descA",
      },
      {
        uniqueId: "p2__b",
        name: "B",
        pluginName: "P2",
        description: "descB",
      },
    ]);

    const state = useToolListEditor();
    await state.loadTools();

    state.toggleTool("p1__a", true);
    state.onIncludeHeaderChange(true);
    state.onIncludeExamplesChange(true);

    expect(state.selectedTools.value.has("p1__a")).toBe(true);
    expect(state.previewContent.value).toContain("# 可用工具列表");
    expect(state.previewContent.value).toContain("## A");

    state.searchQuery.value = "B";
    expect(state.filteredTools.value.length).toBe(1);
  });

  it("selectAll and deselectAll keep selection set synchronized", async () => {
    mockGetTools.mockResolvedValueOnce([
      { uniqueId: "p1__a", name: "A", pluginName: "P1" },
      { uniqueId: "p2__b", name: "B", pluginName: "P2" },
    ]);

    const state = useToolListEditor();
    await state.loadTools();

    state.selectAll();
    expect(state.selectedTools.value.size).toBe(2);

    state.deselectAll();
    expect(state.selectedTools.value.size).toBe(0);
  });
});
