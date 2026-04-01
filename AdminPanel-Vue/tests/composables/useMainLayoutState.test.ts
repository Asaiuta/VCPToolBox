import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as VueModule from "vue";

vi.mock("vue", async () => {
  const actual = await vi.importActual<typeof VueModule>("vue");
  return {
    ...actual,
    onMounted: () => {},
    onUnmounted: () => {},
  };
});

import { useMainLayoutState } from "@/composables/useMainLayoutState";

const mockPush = vi.fn();
const mockApiFetch = vi.fn();

const mockRoute = {
  path: "/dashboard",
  name: "Dashboard",
  params: {} as Record<string, string>,
};

const mockAppStore = {
  navItems: [
    { target: "dashboard", label: "仪表盘" },
    { pluginName: "demo", label: "Demo 插件" },
  ],
  loadPlugins: vi.fn(),
};

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

vi.mock("@/stores/app", () => ({
  useAppStore: () => mockAppStore,
}));

vi.mock("@/utils", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  showMessage: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("useMainLayoutState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.path = "/dashboard";
    mockRoute.name = "Dashboard";
    mockRoute.params = {};
    mockAppStore.navItems = [
      { target: "dashboard", label: "仪表盘" },
      { pluginName: "demo", label: "Demo 插件" },
    ];
  });

  it("computes page title and handles navigation side effects", () => {
    const state = useMainLayoutState();

    expect(state.currentPageTitle.value).toBe("仪表盘");

    state.toggleMobileMenu();
    state.toggleSystemMenu();

    state.navigateTo("base-config");

    expect(mockPush).toHaveBeenCalledWith({ path: "/base-config" });
    expect(state.isMobileMenuOpen.value).toBe(false);
    expect(state.isSystemMenuOpen.value).toBe(false);
    expect(state.isUserMenuOpen.value).toBe(false);
  });

  it("resolves plugin title when route name is PluginConfig", () => {
    mockRoute.path = "/plugin/demo/config";
    mockRoute.name = "PluginConfig";
    mockRoute.params = { pluginName: "demo" };

    const state = useMainLayoutState();

    expect(state.currentPageTitle.value).toBe("Demo 插件");

    state.navigateTo("ignored", "demo");
    expect(mockPush).toHaveBeenCalledWith({
      name: "PluginConfig",
      params: { pluginName: "demo" },
    });
  });

  it("resets hover-enabled flag after sidebar expands back", () => {
    const state = useMainLayoutState();

    state.toggleSidebarCollapse();
    state.isHoverEnabled.value = true;
    state.toggleSidebarCollapse();

    expect(state.isSidebarCollapsed.value).toBe(false);
    expect(state.isHoverEnabled.value).toBe(false);
  });

  it("handles mobile menu and dropdown states consistently", () => {
    const state = useMainLayoutState();

    expect(state.isMobileMenuOpen.value).toBe(false);
    state.toggleMobileMenu();
    expect(state.isMobileMenuOpen.value).toBe(true);

    state.toggleSystemMenu();
    expect(state.isSystemMenuOpen.value).toBe(true);
    expect(state.isUserMenuOpen.value).toBe(false);

    state.toggleUserMenu();
    expect(state.isUserMenuOpen.value).toBe(true);
    expect(state.isSystemMenuOpen.value).toBe(false);

    state.closeMobileMenu();
    expect(state.isMobileMenuOpen.value).toBe(false);

    state.toggleSidebarCollapse();
    const collapsedState = state.isSidebarCollapsed.value;

    state.toggleMobileMenu();
    state.closeMobileMenu();

    expect(state.isSidebarCollapsed.value).toBe(collapsedState);
  });
});
