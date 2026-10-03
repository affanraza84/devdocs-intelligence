import React from 'react'
import { Database, BookOpen, Network, Cpu, CheckCircle } from 'lucide-react'

const stages = [
  {
    step: '1',
    label: 'Structured Sanity Content',
    desc: '30 docs across 4 schemas',
    icon: Database,
    badge: 'Sanity Studio',
    color: 'text-rose-400',
    borderColor: 'border-rose-500/20',
  },
  {
    step: '2',
    label: 'Knowledge Base',
    desc: '18 KB entries & 128 relations',
    icon: BookOpen,
    badge: 'kbU7pqSq7jdK',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
  {
    step: '3',
    label: 'Sanity Context MCP',
    desc: 'Hosted tools & context API',
    icon: Network,
    badge: '@ai-sdk/mcp',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  {
    step: '4',
    label: 'Gemini Agent',
    desc: 'Multi-step tool reasoning',
    icon: Cpu,
    badge: 'Gemini 3 Flash',
    color: 'text-sky-400',
    borderColor: 'border-sky-500/20',
  },
  {
    step: '5',
    label: 'Grounded Answer',
    desc: 'Version-aware with sources',
    icon: CheckCircle,
    badge: 'Verified',
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/20',
  },
]

export function ArchitectureSection() {
  return (
    <div className="rounded-xl border border-[#23283b] bg-[#0c0e17] p-5 shadow-lg shadow-black/40">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a1f30] pb-3">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Technical Architecture • Retrieval Pipeline
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Verified Sanity Context MCP Architecture
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {stages.map((stage, idx) => {
          const Icon = stage.icon
          return (
            <div
              key={stage.step}
              className={`relative rounded-lg border ${stage.borderColor} bg-[#121522] p-3 transition-all hover:bg-[#161a2b]`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-md bg-black/40 ${stage.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono text-slate-500">#{stage.step}</span>
              </div>
              <h3 className="text-xs font-semibold text-white leading-tight">
                {stage.label}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                {stage.desc}
              </p>
              <div className="mt-2.5">
                <span className="inline-block rounded bg-[#090a0f] px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-[#23283b]">
                  {stage.badge}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
