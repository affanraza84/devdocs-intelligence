import React from 'react'
import { Sparkles, ArrowUpRight } from 'lucide-react'

export const EXAMPLE_PROMPTS = [
  {
    tag: 'Caching Diff',
    version: '14 → 15',
    prompt: 'What changed in Next.js 15 caching compared with Next.js 14?',
  },
  {
    tag: 'Migration & Middleware',
    version: '16.x',
    prompt: 'In Next.js 16, what replaces middleware.ts and how should I migrate?',
  },
  {
    tag: 'Route Handlers',
    version: '15.x',
    prompt: 'What is the default caching behavior for GET Route Handlers in Next.js 15?',
  },
  {
    tag: 'Cache Architecture',
    version: 'Deep-dive',
    prompt: 'How are Client Router Cache, fetch caching, and Full Route Cache related?',
  },
  {
    tag: 'API Surface',
    version: '15.x',
    prompt: 'Which APIs were affected by the Next.js 15 caching changes?',
  },
]

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}

export function ExamplePrompts({ onSelectPrompt, disabled }: ExamplePromptsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-4 w-4 text-indigo-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggested Framework Queries (Sanity-Grounded)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_PROMPTS.map((item) => (
          <button
            key={item.prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(item.prompt)}
            className="group relative flex flex-col justify-between rounded-lg border border-[#23283b] bg-[#121522] p-3 text-left transition-all hover:border-indigo-500/40 hover:bg-[#161a2b] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="font-mono text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {item.version}
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-400" />
            </div>
            <p className="text-xs font-medium text-slate-200 group-hover:text-white leading-snug">
              {item.prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
