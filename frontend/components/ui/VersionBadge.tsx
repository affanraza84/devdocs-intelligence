import React from 'react'
import { ArrowRight, Layers } from 'lucide-react'

interface VersionTimelineProps {
  versions: string[]
}

export function VersionTimeline({ versions }: VersionTimelineProps) {
  if (!versions || versions.length === 0) return null

  return (
    <div className="inline-flex items-center space-x-1.5 rounded-md border border-[#23283b] bg-[#121522] px-2.5 py-1 text-xs">
      <Layers className="h-3 w-3 text-indigo-400 mr-1" />
      <span className="text-[11px] font-medium text-slate-400">Version Timeline:</span>
      {versions.map((ver, idx) => (
        <React.Fragment key={ver}>
          <span className="font-mono text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            Next.js {ver}
          </span>
          {idx < versions.length - 1 && (
            <ArrowRight className="h-3 w-3 text-slate-500" />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export function VersionBadge({ version }: { version: string }) {
  const isV15 = version.includes('15')
  const isV14 = version.includes('14')
  const isV16 = version.includes('16')

  const colorClass = isV16
    ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    : isV15
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : isV14
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-300'
        : 'border-slate-700 bg-slate-800 text-slate-300'

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-medium border ${colorClass}`}
    >
      Next.js {version}
    </span>
  )
}
