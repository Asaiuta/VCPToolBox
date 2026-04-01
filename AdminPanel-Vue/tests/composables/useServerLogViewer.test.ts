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
  mockGetServerLog,
  mockGetIncrementalServerLog,
  mockShowMessage,
  mockSetScrollTop,
  mockLoggerWarn,
} = vi.hoisted(() => ({
  mockGetServerLog: vi.fn(async () => ({})),
  mockGetIncrementalServerLog: vi.fn(async () => ({})),
  mockShowMessage: vi.fn(),
  mockSetScrollTop: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock("@/api", () => ({
  systemApi: {
    getServerLog: (...args: unknown[]) => mockGetServerLog(...args),
    getIncrementalServerLog: (...args: unknown[]) =>
      mockGetIncrementalServerLog(...args),
  },
}));

vi.mock("@/utils", () => ({
  showMessage: (...args: unknown[]) => mockShowMessage(...args),
}));

vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: vi.fn(),
  }),
}));

vi.mock("@/composables/useVirtualScroll", () => ({
  useVirtualScroll: () => ({
    visibleItems: [],
    totalHeight: 0,
    offsetY: 0,
    onScroll: vi.fn(),
    setScrollTop: mockSetScrollTop,
  }),
}));

vi.mock("@/composables/usePolling", () => ({
  usePolling: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
}));

import { useServerLogViewer } from "@/views/ServerLogViewer/useServerLogViewer";

describe("useServerLogViewer", () => {
  beforeEach(() => {
    mockGetServerLog.mockReset();
    mockGetIncrementalServerLog.mockReset();
    mockShowMessage.mockReset();
    mockSetScrollTop.mockReset();
    mockLoggerWarn.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  it("loads log content and computes line stats", async () => {
    mockGetServerLog.mockResolvedValueOnce({
      content: "line1\nline2\nline3",
      path: "/tmp/server.log",
    });

    const state = useServerLogViewer();
    await state.loadLog();

    expect(state.logPath.value).toBe("/tmp/server.log");
    expect(state.totalLines.value).toBe(3);
    expect(state.displayedLines.value).toHaveLength(3);
  });

  it("supports filter/reverse/toggle/clear interactions", async () => {
    mockGetServerLog.mockResolvedValueOnce({
      content: "[INFO] boot\n[ERROR] failed",
      path: "p",
    });

    const state = useServerLogViewer();
    await state.loadLog();

    state.filterText.value = "ERROR";
    state.handleFilter();
    expect(mockSetScrollTop).toHaveBeenCalled();
    expect(state.filteredLines.value).toHaveLength(1);

    state.toggleReverse();
    expect(state.isReverse.value).toBe(true);

    state.toggleAutoScroll();
    expect(state.autoScroll.value).toBe(false);

    state.copyLog();
    expect(mockShowMessage).toHaveBeenCalled();

    state.clearLog();
    expect(state.totalLines.value).toBe(0);
  });

  it("marks polling failures by logger warn when initial load already succeeded", async () => {
    mockGetServerLog.mockResolvedValueOnce({ content: "ok", path: "p" });
    mockGetIncrementalServerLog.mockRejectedValueOnce(new Error("network"));

    const state = useServerLogViewer();
    await state.loadLog();
    await state.loadLog();

    expect(mockLoggerWarn).toHaveBeenCalled();
  });
});
