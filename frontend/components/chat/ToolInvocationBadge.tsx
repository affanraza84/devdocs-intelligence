import React, { useState } from 'react'
import { Terminal, Database, Search, ChevronDown, ChevronRight, Check } from 'lucide-react'
import type { AgentToolInvocation } from '@/lib/agent/types'

interface ToolInvocationBadgeProps {
  invocations: AgentToolInvocation[]
}

export function ToolInvocationBadge({ invocations }: ToolInvocationBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!invocations || invocations.length === 0) return null

  return (
    <div className="my-2.5 rounded-lg border border-[#23283b] bg-[#0c0e17] text-xs overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-slate-300 hover:bg-[#121522] transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-[11px] font-semibold text-slate-200">
            Sanity Context MCP Retrieval
          </span>
          <span className="rounded bg-[#161926] px-1.5 py-0.5 font-mono text-[10px] text-slate-400 border border-[#23283b]">
            {invocations.length} tool {invocations.length === 1 ? 'call' : 'calls'}
          </span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400">
          <span className="text-[10px]">inspect</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Pill summary when collapsed */}
      {!isExpanded && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {invocations.map((inv, idx) => {
            const isRead = inv.toolName === 'knowledge_base_read'
            const isSearch = inv.toolName === 'knowledge_base_search'
            const isInit = inv.toolName === 'initial_context'

            return (
              <span
                key={`${inv.toolName}-${idx}`}
                className="inline-flex items-center space-x-1 rounded bg-[#131622] px-2 py-0.5 font-mono text-[10px] text-slate-300 border border-[#1f2438]"
              >
                {isInit && <Terminal className="h-2.5 w-2.5 text-sky-400" />}
                {isRead && <Database className="h-2.5 w-2.5 text-emerald-400" />}
                {isSearch && <Search className="h-2.5 w-2.5 text-amber-400" />}
                <span>{inv.toolName}</span>
                <Check className="h-2.5 w-2.5 text-emerald-400" />
              </span>
            )
          })}
        </div>
      )}

      {/* Detailed accordion when expanded */}
      {isExpanded && (
        <div className="border-t border-[#1a1f30] px-3 py-2 space-y-2 bg-[#090b12]">
          {invocations.map((inv, idx) => (
            <div key={`detail-${inv.toolName}-${idx}`} className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-indigo-400">
                <span>🔧 {inv.toolName}()</span>
                <span className="text-[10px] text-slate-500">
                  {inv.timestamp ? new Date(inv.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              {inv.args && Object.keys(inv.args).length > 0 && (
                <pre className="overflow-x-auto rounded bg-[#05060a] p-2 text-[10px] font-mono text-slate-400 border border-[#1a1f30]">
                  {JSON.stringify(inv.args, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
