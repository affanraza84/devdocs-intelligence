import { FileText, Code2, GitFork, Tag } from 'lucide-react'
import type { GroundedSource } from '@/lib/agent/types'

interface SourceCardProps {
  source: GroundedSource
}

function getSourceIcon(type: GroundedSource['type']) {
  switch (type) {
    case 'apiReference':
      return Code2
    case 'migrationGuide':
      return GitFork
    case 'releaseNote':
      return Tag
    case 'documentation':
    default:
      return FileText
  }
}

function formatTypeBadge(type: GroundedSource['type']) {
  switch (type) {
    case 'apiReference':
      return { label: 'API Reference', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
    case 'migrationGuide':
      return { label: 'Migration Guide', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
    case 'releaseNote':
      return { label: 'Release Note', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
    case 'documentation':
    default:
      return { label: 'Documentation', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
  }
}

export function SourceCard({ source }: SourceCardProps) {
  const Icon = getSourceIcon(source.type)
  const badge = formatTypeBadge(source.type)

  return (
    <div className="flex flex-col justify-between rounded-lg border border-[#23283b] bg-[#121522] p-3 text-xs transition-colors hover:border-indigo-500/30">
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <span
            className={`inline-flex items-center space-x-1 rounded px-1.5 py-0.5 text-[10px] font-medium border ${badge.color}`}
          >
            <Icon className="h-3 w-3" />
            <span>{badge.label}</span>
          </span>

          {source.version && (
            <span className="font-mono text-[10px] text-slate-400 bg-[#090a0f] px-1.5 py-0.5 rounded border border-[#23283b]">
              Next.js {source.version}
            </span>
          )}
        </div>

        <h4 className="font-semibold text-slate-200 line-clamp-1">
          {source.title}
        </h4>

        {source.snippet && (
          <p className="mt-1 text-[11px] text-slate-400 line-clamp-2 leading-relaxed font-sans">
            {source.snippet}
          </p>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-[#1a1f30] flex items-center justify-between font-mono text-[10px] text-slate-500">
        <span className="truncate max-w-[200px]" title={source.path}>
          {source.path}
        </span>
        <span className="text-indigo-400/80">Sanity KB</span>
      </div>
    </div>
  )
}
