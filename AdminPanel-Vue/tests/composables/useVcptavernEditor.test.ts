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
  mockGetPresets,
  mockGetPreset,
  mockSavePreset,
  mockShowMessage,
  mockLoggerError,
} = vi.hoisted(() => ({
  mockGetPresets: vi.fn(async () => []),
  mockGetPreset: vi.fn(async () => ({})),
  mockSavePreset: vi.fn(async () => undefined),
  mockShowMessage: vi.fn(),
  mockLoggerError: vi.fn(),
}));

vi.mock("@/api", () => ({
  vcptavernApi: {
    getPresets: (...args: unknown[]) => mockGetPresets(...args),
    getPreset: (...args: unknown[]) => mockGetPreset(...args),
    savePreset: (...args: unknown[]) => mockSavePreset(...args),
    deletePreset: vi.fn(async () => undefined),
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

import { useVcptavernEditor } from "@/views/VcptavernEditor/useVcptavernEditor";

describe("useVcptavernEditor", () => {
  beforeEach(() => {
    mockGetPresets.mockReset();
    mockGetPreset.mockReset();
    mockSavePreset.mockReset();
    mockShowMessage.mockReset();
    mockLoggerError.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("loads presets and preset detail correctly", async () => {
    mockGetPresets.mockResolvedValueOnce(["p1", "p2"]);
    mockGetPreset.mockResolvedValueOnce({
      description: "desc",
      rules: [
        {
          id: "r1",
          name: "R",
          enabled: true,
          type: "relative",
          position: "before",
          target: "system",
          content: { role: "user", content: "hello" },
        },
      ],
    });

    const state = useVcptavernEditor();
    await state.fetchPresets();
    await state.loadPreset("p1");

    expect(state.presetNames.value).toEqual(["p1", "p2"]);
    expect(state.editorState.name).toBe("p1");
    expect(state.editorState.description).toBe("desc");
    expect(state.editorState.rules).toHaveLength(1);
    expect(state.isEditorVisible.value).toBe(true);
    expect(state.isNewPreset.value).toBe(false);
  });

  it("supports new preset, rule add/remove and drag reorder", () => {
    const state = useVcptavernEditor();

    state.createNewPreset();
    expect(state.isEditorVisible.value).toBe(true);
    expect(state.isNewPreset.value).toBe(true);

    state.addRule();
    state.addRule();
    state.editorState.rules[0].name = "A";
    state.editorState.rules[1].name = "B";

    state.prepareDrag(0, { target: { closest: () => ({}) } } as unknown as MouseEvent);
    state.onDragStart(
      0,
      {
        preventDefault: vi.fn(),
        dataTransfer: { effectAllowed: "none" },
      } as unknown as DragEvent
    );
    state.onDrop(1);
    state.onDragEnd();

    expect(state.editorState.rules[0].name).toBe("B");
    expect(state.editorState.rules[1].name).toBe("A");

    state.removeRule(1);
    expect(state.editorState.rules).toHaveLength(1);
  });

  it("validates and saves preset with normalized payload", async () => {
    const state = useVcptavernEditor();

    state.editorState.name = "invalid name";
    await state.savePreset();
    expect(mockShowMessage).toHaveBeenCalledWith(
      "预设名称只能包含字母、数字、下划线和连字符",
      "error"
    );

    mockShowMessage.mockReset();
    mockSavePreset.mockReset();
    mockGetPresets.mockReset();
    mockGetPreset.mockReset();

    state.editorState.name = "valid_name";
    state.editorState.description = "  test desc  ";
    state.editorState.rules = [
      {
        id: "r-depth",
        name: "depth-rule",
        enabled: true,
        type: "depth",
        depth: 2,
        position: "before",
        target: "system",
        content: { role: "assistant", content: "depth-content" },
      },
      {
        id: "r-embed",
        name: "embed-rule",
        enabled: true,
        type: "embed",
        position: "after",
        target: "last_user",
        content: { role: "user", content: "embed-content" },
      },
    ] as never;

    mockSavePreset.mockResolvedValueOnce(undefined);
    mockGetPresets.mockResolvedValueOnce(["valid_name"]);
    mockGetPreset.mockResolvedValueOnce({ description: "test desc", rules: [] });

    await state.savePreset();

    expect(mockSavePreset).toHaveBeenCalledTimes(1);
    const saveCall = mockSavePreset.mock.calls[0] as [
      string,
      { description?: string; rules?: Array<Record<string, unknown>> }
    ];
    expect(saveCall[0]).toBe("valid_name");
    expect(saveCall[1].description).toBe("test desc");
    expect(saveCall[1].rules?.[0]?.position).toBeUndefined();
    expect(saveCall[1].rules?.[0]?.target).toBeUndefined();
    expect(saveCall[1].rules?.[1]?.content).toMatchObject({ role: "system" });

    expect(state.selectedPresetName.value).toBe("valid_name");
    expect(state.isNewPreset.value).toBe(false);
  });
});
