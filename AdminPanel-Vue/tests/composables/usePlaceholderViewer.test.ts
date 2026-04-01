import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPlaceholders, mockGetPlaceholderDetail, mockShowMessage } =
  vi.hoisted(() => ({
    mockGetPlaceholders: vi.fn(async () => []),
    mockGetPlaceholderDetail: vi.fn(async () => null),
    mockShowMessage: vi.fn(),
  }));

vi.mock("marked", () => ({
  marked: {
    parse: (content: string) => content,
  },
}));

vi.mock("dompurify", () => ({
  default: {
    sanitize: (html: string) => html,
  },
}));

vi.mock("@/api", () => ({
  placeholderApi: {
    getPlaceholders: (...args: unknown[]) => mockGetPlaceholders(...args),
    getPlaceholderDetail: (...args: unknown[]) =>
      mockGetPlaceholderDetail(...args),
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

import { usePlaceholderViewer } from "@/views/PlaceholderViewer/usePlaceholderViewer";

describe("usePlaceholderViewer", () => {
  beforeEach(() => {
    mockGetPlaceholders.mockReset();
    mockGetPlaceholderDetail.mockReset();
    mockShowMessage.mockReset();
    vi.stubGlobal("document", {
      activeElement: {
        focus: vi.fn(),
      },
    });
  });

  it("loads list, filters by keyword, and opens detail", async () => {
    mockGetPlaceholders.mockResolvedValueOnce([
      { type: "agent", name: "alpha", preview: "first", content: "c1" },
      {
        type: "tool_description",
        name: "beta",
        preview: "second",
        content: "c2",
      },
    ]);
    mockGetPlaceholderDetail.mockResolvedValueOnce("detail-content");

    const state = usePlaceholderViewer();

    await state.loadPlaceholders();
    expect(state.filteredPlaceholders.value.length).toBe(2);

    state.filterKeyword.value = "alpha";
    expect(state.filteredPlaceholders.value.length).toBe(1);

    const placeholder = state.filteredPlaceholders.value[0];
    expect(placeholder?.name).toBe("alpha");

    if (!placeholder) {
      throw new Error("placeholder should exist");
    }

    await state.openDetail(placeholder);
    expect(state.selectedPlaceholder.value?.name).toBe("alpha");
    expect(state.detailContent.value).toBe("detail-content");

    state.closeDetail();
    expect(state.selectedPlaceholder.value).toBeNull();
  });

  it("shows error message when loadPlaceholders fails", async () => {
    mockGetPlaceholders.mockRejectedValueOnce(new Error("network down"));

    const state = usePlaceholderViewer();
    await state.loadPlaceholders();

    expect(mockShowMessage).toHaveBeenCalled();
  });
});
