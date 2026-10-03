import React from 'react'
import { Database, ShieldCheck } from 'lucide-react'
import { SourceCard } from './SourceCard'
import type { GroundedSource } from '@/lib/agent/types'

interface SourcesListProps {
  sources: GroundedSource[]
}

export function SourcesList({ sources }: SourcesListProps) {
  if (!sources || sources.length === 0) return null

  // Deduplicate by path or title
  const uniqueSources = sources.filter(
    (s, index, self) =>
      index === self.findIndex((t) => t.path === s.path || t.title === s.title)
  )

  return (
    <div className="mt-4 pt-3 border-t border-[#1a1f30] space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Database className="h-3.5 w-3.5 text-indigo-400" />
          <span>Grounded Sanity Sources</span>
          <span className="rounded-full bg-[#161926] px-1.5 py-0.2 font-mono text-[10px] text-slate-400 border border-[#23283b]">
            {uniqueSources.length}
          </span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[10px] text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Sanity Context MCP Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueSources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>
    </div>
  )
}
