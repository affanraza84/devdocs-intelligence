import React from 'react'
import { FileText, Code2, GitFork, Tag, ArrowLeftRight } from 'lucide-react'

const schemas = [
  {
    type: 'Documentation',
    schema: 'documentation',
    icon: FileText,
    accent: 'border-blue-500/20 text-blue-400',
    description: 'Conceptual architecture, 4-layer caching models, server/client component rules.',
    examples: ['caching_architecture', 'server_and_client_components'],
  },
  {
    type: 'API Reference',
    schema: 'apiReference',
    icon: Code2,
    accent: 'border-emerald-500/20 text-emerald-400',
    description: 'Exact signatures, parameters, return types, and route segment configs.',
    examples: ['route_handlers', 'revalidateTag', 'generateMetadata'],
  },
  {
    type: 'Migration Guide',
    schema: 'migrationGuide',
    icon: GitFork,
    accent: 'border-purple-500/20 text-purple-400',
    description: 'Breaking change diffs, codemods, and step-by-step upgrade instructions.',
    examples: ['upgrade_guides', 'v14_to_v15_caching', 'middleware_migration'],
  },
  {
    type: 'Release Note',
    schema: 'releaseNote',
    icon: Tag,
    accent: 'border-amber-500/20 text-amber-400',
    description: 'Framework version milestones, deprecations, and release changelogs.',
    examples: ['v15_0_0_release', 'v16_0_0_canary'],
  },
]

export function StructuredContentCards() {
  return (
    <div className="rounded-xl border border-[#23283b] bg-[#0c0e17] p-5 shadow-lg shadow-black/40">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a1f30] pb-3">
        <div className="flex items-center space-x-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Sanity Structured Content Foundation
          </h2>
        </div>
        {/* Verified Statistics */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-300">
          <span className="rounded bg-[#161926] px-2 py-0.5 border border-[#23283b]">
            <strong className="text-indigo-400">30</strong> structured documents
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="rounded bg-[#161926] px-2 py-0.5 border border-[#23283b]">
            <strong className="text-indigo-400">18</strong> KB entries
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="rounded bg-[#161926] px-2 py-0.5 border border-[#23283b]">
            <strong className="text-indigo-400">128</strong> relationships
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {schemas.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.schema}
              className={`rounded-lg border ${item.accent} bg-[#121522] p-3.5 transition-all hover:bg-[#161a2b]`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-white">{item.type}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                {item.description}
              </p>
              <div className="mt-3 pt-2.5 border-t border-[#1a1f30] flex flex-wrap gap-1">
                {item.examples.map((ex) => (
                  <span
                    key={ex}
                    className="font-mono text-[10px] text-slate-400 bg-[#090a0f] px-1.5 py-0.5 rounded border border-[#23283b]"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Cross-document relationship connection banner */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-[#1a1f30] bg-[#10131e] px-4 py-2.5 text-xs text-slate-300">
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
          <span className="font-medium text-slate-200">
            Bidirectional Knowledge Graph:
          </span>
          <span className="text-slate-400">
            Every document is cross-linked across types to enable multi-hop reasoning.
          </span>
        </div>
        <div className="flex items-center space-x-1 font-mono text-[11px] text-indigo-300">
          <span>Documentation</span>
          <span className="text-slate-500">↔</span>
          <span>APIs</span>
          <span className="text-slate-500">↔</span>
          <span>Migrations</span>
          <span className="text-slate-500">↔</span>
          <span>Releases</span>
        </div>
      </div>
    </div>
  )
}
