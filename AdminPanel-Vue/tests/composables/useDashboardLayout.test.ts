import { describe, expect, it } from "vitest";
import {
  DEFAULT_DASHBOARD_CARD_SIZES,
  DEFAULT_DASHBOARD_CARD_ORDER,
  reorderDashboardCardOrder,
  sanitizeDashboardCardOrder,
  sanitizeDashboardCardSizes,
} from "@/composables/useDashboardLayout";

describe("sanitizeDashboardCardOrder", () => {
  it("falls back to defaults for invalid values", () => {
    expect(sanitizeDashboardCardOrder(null)).toEqual([...DEFAULT_DASHBOARD_CARD_ORDER]);
  });

  it("keeps valid unique ids and appends missing cards", () => {
    expect(
      sanitizeDashboardCardOrder(["news", "cpu", "news", "unknown", "memory"])
    ).toEqual([
      "news",
      "cpu",
      "memory",
      "newapi-monitor",
      "weather",
      "process",
      "node-info",
      "calendar",
    ]);
  });
});

describe("sanitizeDashboardCardSizes", () => {
  it("falls back to defaults for invalid values", () => {
    expect(sanitizeDashboardCardSizes(null)).toEqual(DEFAULT_DASHBOARD_CARD_SIZES);
  });

  it("clamps invalid values and restores missing cards", () => {
    expect(
      sanitizeDashboardCardSizes({
        cpu: {
          desktopCols: 99,
          tabletCols: 1,
          rows: 2,
        },
        weather: {
          desktopCols: 4.4,
          tabletCols: 8,
          rows: 25.8,
        },
      })
    ).toEqual({
      ...DEFAULT_DASHBOARD_CARD_SIZES,
      cpu: {
        desktopCols: 6,
        tabletCols: 3,
        rows: 7,
      },
      weather: {
        desktopCols: 4,
        tabletCols: 4,
        rows: 18,
      },
    });
  });
});

describe("reorderDashboardCardOrder", () => {
  it("moves a card before another card", () => {
    expect(
      reorderDashboardCardOrder(
        [...DEFAULT_DASHBOARD_CARD_ORDER],
        "news",
        "memory",
        "before"
      )
    ).toEqual([
      "newapi-monitor",
      "weather",
      "process",
      "cpu",
      "news",
      "memory",
      "node-info",
      "calendar",
    ]);
  });

  it("moves a card after another card", () => {
    expect(
      reorderDashboardCardOrder(
        [...DEFAULT_DASHBOARD_CARD_ORDER],
        "cpu",
        "process",
        "after"
      )
    ).toEqual([
      "newapi-monitor",
      "weather",
      "process",
      "cpu",
      "news",
      "memory",
      "node-info",
      "calendar",
    ]);
  });
});
