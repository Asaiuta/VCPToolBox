/**
 * EasyMDE 类型声明
 */

declare module 'easymde' {
  export interface EasyMDEOptions {
    element: HTMLTextAreaElement
    spellChecker?: boolean
    status?: string[]
    minHeight?: string
    maxHeight?: string
    placeholder?: string
    toolbar?: (string | { name: string; action: string; className: string; title: string })[]
    renderingConfig?: {
      singleLineBreaks?: boolean
      codeSyntaxHighlighting?: boolean
    }
    autosave?: {
      enabled: boolean
      uniqueId: string
      delay: number
    }
  }

  export default class EasyMDE {
    constructor(options: EasyMDEOptions)
    value(content?: string): string
    toTextArea(): void
    isPreviewActive(): boolean
    togglePreview(): void
    clearAutosavedValue(): void
    cleanup(): void
    codemirror: unknown
  }
}
