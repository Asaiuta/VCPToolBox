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
  mockGetPreprocessorOrder,
  mockSavePreprocessorOrder,
  mockShowMessage,
  mockLoggerError,
} = vi.hoisted(() => ({
  mockGetPreprocessorOrder: vi.fn(async () => []),
  mockSavePreprocessorOrder: vi.fn(async () => undefined),
  mockShowMessage: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock("@/api", () => ({
  adminConfigApi: {
    getPreprocessorOrder: (...args: unknown[]) =>
      mockGetPreprocessorOrder(...args),
    savePreprocessorOrder: (...args: unknown[]) =>
      mockSavePreprocessorOrder(...args),
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

import { usePreprocessorOrderManager } from "@/views/PreprocessorOrderManager/usePreprocessorOrderManager";

describe("usePreprocessorOrderManager", () => {
  beforeEach(() => {
    mockGetPreprocessorOrder.mockReset();
    mockSavePreprocessorOrder.mockReset();
    mockShowMessage.mockReset();
    mockLoggerError.mockReset();
  });

  it("loads preprocessors from order/newOrder", async () => {
    mockGetPreprocessorOrder
      .mockResolvedValueOnce([
        { name: "a", displayName: "A" },
        { name: "b" },
      ])
      .mockResolvedValueOnce([{ name: "c", displayName: "C" }]);

    const state = usePreprocessorOrderManager();

    await state.loadPreprocessors();
    expect(state.preprocessors.value).toEqual([
      { name: "a", displayName: "A", description: undefined },
      { name: "b", displayName: "b", description: undefined },
    ]);

    await state.loadPreprocessors();
    expect(state.preprocessors.value).toEqual([
      { name: "c", displayName: "C", description: undefined },
    ]);
  });

  it("supports drag reorder", () => {
    const state = usePreprocessorOrderManager();
    state.preprocessors.value = [
      { name: "a", displayName: "A" },
      { name: "b", displayName: "B" },
      { name: "c", displayName: "C" },
    ];

    const dragStartEvent = {
      dataTransfer: { effectAllowed: "none" },
    } as unknown as DragEvent;
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: "none" },
    } as unknown as DragEvent;

    state.onDragStart(dragStartEvent, 0);
    state.onDrop(dropEvent, 2);
    state.onDragEnd();

    expect(state.preprocessors.value.map((item) => item.name)).toEqual([
      "b",
      "c",
      "a",
    ]);
    expect(state.draggingIndex.value).toBeNull();
  });

  it("saves order with expected payload", async () => {
    const state = usePreprocessorOrderManager();
    state.preprocessors.value = [
      { name: "first", displayName: "First" },
      { name: "second", displayName: "Second" },
    ];

    mockSavePreprocessorOrder.mockResolvedValueOnce(undefined);

    await state.saveOrder();

    expect(mockSavePreprocessorOrder).toHaveBeenCalledWith(
      ["first", "second"],
      { loadingKey: "preprocessors.order.save" }
    );
    expect(state.statusType.value).toBe("success");
    expect(mockShowMessage).toHaveBeenCalledWith("顺序已保存！", "success");
  });
});
