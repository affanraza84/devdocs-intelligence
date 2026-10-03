'use client'

import React, { useRef, useEffect } from 'react'
import { ArrowUp, Square } from 'lucide-react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: () => void
  onStop?: () => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({
  input,
  setInput,
  onSubmit,
  onStop,
  isLoading,
  placeholder = 'Ask a complex Next.js question (e.g., Next.js 15 caching changes, route handlers, or v16 migrations)...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`
    }
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && input.trim()) {
        onSubmit()
      }
    }
  }

  return (
    <div className="relative w-full rounded-2xl border border-[#23283b] bg-[#0c0e17] p-2.5 shadow-2xl shadow-black/60 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={isLoading}
        className="w-full resize-none bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: '44px' }}
      />

      <div className="flex items-center justify-between px-2 pt-1 border-t border-[#1a1f30]/60 text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
          <span className="hidden sm:inline">Press</span>
          <kbd className="rounded bg-[#161926] px-1.5 py-0.5 text-[10px] text-slate-400 border border-[#23283b]">
            Enter ↵
          </kbd>
          <span className="hidden sm:inline">to send</span>
          <span className="text-slate-700 hidden sm:inline">•</span>
          <kbd className="rounded bg-[#161926] px-1.5 py-0.5 text-[10px] text-slate-400 border border-[#23283b] hidden sm:inline">
            Shift + Enter
          </kbd>
          <span className="hidden sm:inline">for newline</span>
        </div>

        <div>
          {isLoading ? (
            <button
              type="button"
              onClick={onStop}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 font-medium text-red-400 hover:bg-red-500/30 border border-red-500/30 transition-colors"
            >
              <Square className="h-3 w-3 fill-current" />
              <span className="text-xs">Stop</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!input.trim()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-[#1a1f30] disabled:text-slate-600 disabled:shadow-none transition-all"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
