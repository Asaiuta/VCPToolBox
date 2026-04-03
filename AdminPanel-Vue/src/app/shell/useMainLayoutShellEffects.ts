import { nextTick, onMounted, onUnmounted, watch, type Ref } from "vue";

interface MainLayoutShellEffectsOptions {
  contentRef: Ref<HTMLElement | null>;
  isImmersiveMode: Ref<boolean>;
  isCommandPaletteOpen: Ref<boolean>;
  getRouteFullPath: () => string;
  onOpenCommandPalette: () => void;
  onCloseCommandPalette: () => void;
  onCloseMobileMenu: () => void;
  onCloseAllMenus: () => void;
  onRouteChanged: () => void;
  onEnterImmersiveMode: () => void;
  onExitImmersiveMode: () => void;
  onScroll: () => void;
  onLoadPluginNavigation: () => Promise<void>;
}

interface MainLayoutShellEffects {
  activateImmersiveDomState: () => void;
  deactivateImmersiveDomState: () => void;
}

function restoreSavedTheme(): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  const savedTheme = window.localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
}

export function useMainLayoutShellEffects(
  options: MainLayoutShellEffectsOptions
): MainLayoutShellEffects {
  let originalBodyOverflow = "";
  let brandElement: Element | null = null;
  let logoClickCount = 0;
  let logoClickTimer: number | null = null;

  function clearLogoClickTimer(): void {
    if (logoClickTimer !== null) {
      globalThis.clearTimeout(logoClickTimer);
      logoClickTimer = null;
    }
  }

  function handleLogoClick(): void {
    logoClickCount += 1;

    if (logoClickCount === 1) {
      logoClickTimer = window.setTimeout(() => {
        logoClickCount = 0;
        logoClickTimer = null;
      }, 3000);
      return;
    }

    if (logoClickCount >= 5) {
      logoClickCount = 0;
      clearLogoClickTimer();
      options.onEnterImmersiveMode();
    }
  }

  function activateImmersiveDomState(): void {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.add("ui-hidden-immersive");
    document.body.style.overflow = "hidden";
  }

  function deactivateImmersiveDomState(): void {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.classList.remove("ui-hidden-immersive");
    document.body.style.overflow = originalBodyOverflow;
  }

  function handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest(".dropdown")) {
      options.onCloseAllMenus();
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === "k") {
      event.preventDefault();
      options.onOpenCommandPalette();
      return;
    }

    if (event.key !== "Escape") {
      return;
    }

    if (options.isCommandPaletteOpen.value) {
      options.onCloseCommandPalette();
      return;
    }

    if (options.isImmersiveMode.value) {
      options.onExitImmersiveMode();
    }

    options.onCloseAllMenus();
    options.onCloseMobileMenu();
  }

  watch(
    () => options.getRouteFullPath(),
    () => {
      options.onRouteChanged();
      if (options.contentRef.value) {
        options.contentRef.value.scrollTop = 0;
      }
    }
  );

  onMounted(async () => {
    if (typeof document !== "undefined") {
      originalBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      document.addEventListener("click", handleClickOutside);
      document.addEventListener("keydown", handleKeydown);

      await nextTick();
      options.contentRef.value?.addEventListener("scroll", options.onScroll, {
        passive: true,
      });

      brandElement = document.querySelector(".brand");
      brandElement?.addEventListener("click", handleLogoClick);

      restoreSavedTheme();
    }

    await options.onLoadPluginNavigation();
  });

  onUnmounted(() => {
    options.contentRef.value?.removeEventListener("scroll", options.onScroll);

    if (typeof document !== "undefined") {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.classList.remove("ui-hidden-immersive");
    }

    brandElement?.removeEventListener("click", handleLogoClick);
    brandElement = null;
    logoClickCount = 0;
    clearLogoClickTimer();
  });

  return {
    activateImmersiveDomState,
    deactivateImmersiveDomState,
  };
}
