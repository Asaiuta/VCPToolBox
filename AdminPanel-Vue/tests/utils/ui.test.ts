import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { showLoading, showMessage } from '@/utils/ui'

type MockElement = HTMLElement & {
  getAttribute: (name: string) => string | undefined
}

function createMockElement(): MockElement {
  const classes = new Set<string>()
  const attributes: Record<string, string> = {}
  const dataset: Record<string, string> = {}

  const element = {
    textContent: '',
    dataset,
    setAttribute(name: string, value: string) {
      attributes[name] = value
      if (name.startsWith('data-')) {
        const datasetKey = name
          .slice(5)
          .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
        dataset[datasetKey] = value
      }
    },
    getAttribute(name: string) {
      return attributes[name]
    },
    classList: {
      add: (...tokens: string[]) => {
        tokens.forEach(token => classes.add(token))
      },
      remove: (...tokens: string[]) => {
        tokens.forEach(token => classes.delete(token))
      },
      toggle: (token: string, force?: boolean) => {
        if (force === true) {
          classes.add(token)
          return true
        }
        if (force === false) {
          classes.delete(token)
          return false
        }
        if (classes.has(token)) {
          classes.delete(token)
          return false
        }
        classes.add(token)
        return true
      },
      contains: (token: string) => classes.has(token)
    }
  } as MockElement

  Object.defineProperty(element, 'className', {
    get: () => Array.from(classes).join(' '),
    set: (value: string) => {
      classes.clear()
      value
        .split(/\s+/)
        .filter(Boolean)
        .forEach(token => classes.add(token))
    }
  })

  return element
}

describe('ui utilities', () => {
  const originalDocument = globalThis.document
  let loadingOverlay: MockElement
  let messagePopup: MockElement

  beforeEach(() => {
    vi.useFakeTimers()
    loadingOverlay = createMockElement()
    messagePopup = createMockElement()

    globalThis.document = {
      getElementById: (id: string) => {
        if (id === 'loading-overlay') return loadingOverlay
        if (id === 'message-popup') return messagePopup
        return null
      }
    } as Document
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.document = originalDocument
  })

  it('keeps loading overlay visible until all concurrent requests finish', () => {
    showLoading(true)
    showLoading(true)
    showLoading(false)

    expect(loadingOverlay.classList.contains('visible')).toBe(true)
    expect(loadingOverlay.getAttribute('aria-hidden')).toBe('false')
    expect(loadingOverlay.getAttribute('aria-busy')).toBe('true')

    showLoading(false)

    expect(loadingOverlay.classList.contains('visible')).toBe(false)
    expect(loadingOverlay.getAttribute('aria-hidden')).toBe('true')
    expect(loadingOverlay.getAttribute('aria-busy')).toBe('false')
  })

  it('only hides the latest toast message when multiple messages overlap', () => {
    showMessage('first', 'info', 1000)
    showMessage('second', 'error', 2000)

    expect(messagePopup.textContent).toBe('second')
    expect(messagePopup.classList.contains('show')).toBe(true)
    expect(messagePopup.classList.contains('error')).toBe(true)
    expect(messagePopup.getAttribute('aria-hidden')).toBe('false')

    vi.advanceTimersByTime(1000)
    expect(messagePopup.classList.contains('show')).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(messagePopup.classList.contains('show')).toBe(false)
    expect(messagePopup.getAttribute('aria-hidden')).toBe('true')
  })
})
