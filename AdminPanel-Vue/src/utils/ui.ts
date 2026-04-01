/**
 * UI 工具函数
 */

let activeLoadingCount = 0
let latestMessageId = 0
let messageHideTimer: ReturnType<typeof globalThis.setTimeout> | null = null

function getLoadingOverlay(): HTMLElement | null {
  return document.getElementById("loading-overlay")
}

function getMessagePopup(): HTMLElement | null {
  return document.getElementById("message-popup")
}

/**
 * 显示或隐藏加载覆盖层
 */
export function showLoading(show: boolean) {
  activeLoadingCount = show
    ? activeLoadingCount + 1
    : Math.max(0, activeLoadingCount - 1)

  const loadingOverlay = getLoadingOverlay()
  if (!loadingOverlay) {
    return
  }

  const isVisible = activeLoadingCount > 0
  loadingOverlay.classList.toggle("visible", isVisible)
  loadingOverlay.setAttribute("aria-hidden", String(!isVisible))
  loadingOverlay.setAttribute("aria-busy", String(isVisible))
}

/**
 * 显示消息提示
 */
export function showMessage(
  message: string,
  type: "info" | "success" | "error" | "warning" = "info",
  duration = 3500
) {
  const messagePopup = getMessagePopup()
  if (!messagePopup) {
    return
  }

  latestMessageId += 1
  const currentMessageId = latestMessageId

  if (messageHideTimer !== null) {
    globalThis.clearTimeout(messageHideTimer)
    messageHideTimer = null
  }

  messagePopup.textContent = message
  messagePopup.className = "message-popup"
  messagePopup.classList.add(type, "show")
  messagePopup.setAttribute("data-message-id", String(currentMessageId))
  messagePopup.setAttribute("aria-hidden", "false")

  messageHideTimer = globalThis.setTimeout(() => {
    const activeMessageId = Number(messagePopup.dataset.messageId || "0")
    if (activeMessageId !== currentMessageId) {
      return
    }

    messagePopup.classList.remove("show")
    messagePopup.setAttribute("aria-hidden", "true")
    messageHideTimer = null
  }, duration)
}
