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
  mockGetThinkingChains,
  mockSaveThinkingChains,
  mockShowMessage,
  mockLoggerError,
} = vi.hoisted(() => ({
  mockGetThinkingChains: vi.fn(async () => ({ chains: {} })),
  mockSaveThinkingChains: vi.fn(async () => undefined),
  mockShowMessage: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock("@/api", () => ({
  ragApi: {
    getThinkingChains: (...args: unknown[]) => mockGetThinkingChains(...args),
    saveThinkingChains: (...args: unknown[]) => mockSaveThinkingChains(...args),
    getAvailableClusters: vi.fn(async () => []),
  },
}));

vi.mock("@/utils", () => ({
  showMessage: mockShowMessage,
}));

vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: mockLoggerError,
  }),
}));

import { useThinkingChainsEditor } from "@/views/ThinkingChainsEditor/useThinkingChainsEditor";

describe("useThinkingChainsEditor", () => {
  beforeEach(() => {
    mockGetThinkingChains.mockReset();
    mockSaveThinkingChains.mockReset();
    mockShowMessage.mockReset();
    mockLoggerError.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("loads thinking chains with old/new formats", async () => {
    mockGetThinkingChains.mockResolvedValueOnce({
      chains: {
        legacy: ["clusterA", "clusterB"],
        modern: {
          clusters: ["clusterX"],
          kSequence: [3],
        },
      },
    });

    const state = useThinkingChainsEditor();
    await state.loadThinkingChains();

    expect(state.thinkingChains.value).toEqual([
      {
        theme: "legacy",
        clusters: ["clusterA", "clusterB"],
        kSequence: [1, 1],
      },
      {
        theme: "modern",
        clusters: ["clusterX"],
        kSequence: [3],
      },
    ]);
  });

  it("saves thinking chains with expected payload", async () => {
    const state = useThinkingChainsEditor();
    state.thinkingChains.value = [
      {
        theme: "theme-1",
        clusters: ["alpha", "beta"],
        kSequence: [2, 4],
      },
    ];

    mockSaveThinkingChains.mockResolvedValueOnce(undefined);

    await state.saveThinkingChains();

    expect(mockSaveThinkingChains).toHaveBeenCalledWith(
      {
        chains: {
          "theme-1": {
            clusters: ["alpha", "beta"],
            kSequence: [2, 4],
          },
        },
      },
      {
        loadingKey: "thinking-chains.save",
      }
    );
    expect(state.statusType.value).toBe("success");
    expect(mockShowMessage).toHaveBeenCalledWith("思维链已保存！", "success");
  });

  it("reorders clusters and kSequence together when dragging in same chain", () => {
    const state = useThinkingChainsEditor();
    state.thinkingChains.value = [
      {
        theme: "drag-theme",
        clusters: ["A", "B", "C"],
        kSequence: [1, 2, 3],
      },
    ];

    const dragStartEvent = {
      dataTransfer: { effectAllowed: "none" },
    } as unknown as DragEvent;
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: "none" },
    } as unknown as DragEvent;

    state.handleDragStart(dragStartEvent, 0, 0, "chain");
    state.handleDrop(dropEvent, 0, 2);

    expect(state.thinkingChains.value[0].clusters).toEqual(["B", "A", "C"]);
    expect(state.thinkingChains.value[0].kSequence).toEqual([2, 1, 3]);
  });

  it("adds available cluster once and avoids duplicates on drop", () => {
    const state = useThinkingChainsEditor();
    state.thinkingChains.value = [
      {
        theme: "drop-theme",
        clusters: ["base"],
        kSequence: [5],
      },
    ];

    const dragStartEvent = {
      dataTransfer: { effectAllowed: "none" },
    } as unknown as DragEvent;
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: "none" },
    } as unknown as DragEvent;

    state.handleDragStart(dragStartEvent, null, null, "available", "new-cluster");
    state.handleDrop(dropEvent, 0, 1);

    state.handleDragStart(dragStartEvent, null, null, "available", "new-cluster");
    state.handleDrop(dropEvent, 0, 2);

    expect(state.thinkingChains.value[0].clusters).toEqual(["base", "new-cluster"]);
    expect(state.thinkingChains.value[0].kSequence).toEqual([5, 1]);
  });
});
