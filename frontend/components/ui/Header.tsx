'use client'

import React, { useEffect, useState } from 'react'
import { Terminal, Cpu, Database, AlertCircle } from 'lucide-react'

export function Header() {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => setHealthStatus('healthy'))
      .catch(() => setHealthStatus('error'))
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-[#23283b] bg-[#090a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold tracking-tight text-white sm:text-lg">
                DevDocs Intelligence
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Sanity Context MCP • Next.js Knowledge Base
            </p>
          </div>
        </div>

        {/* Live Integrations & Links */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* MCP Health Pill */}
          <div className="flex items-center space-x-2 rounded-full border border-[#23283b] bg-[#0f111a] px-3 py-1 text-xs">
            {healthStatus === 'healthy' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-mono text-emerald-400">MCP Active</span>
              </>
            ) : healthStatus === 'checking' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="font-mono text-slate-400">Connecting...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-amber-500" />
                <span className="font-mono text-amber-400">Server Standby</span>
              </>
            )}
          </div>

          {/* Technology Badges */}
          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400">
            <span className="inline-flex items-center space-x-1 rounded bg-[#161926] px-2 py-1 border border-[#23283b]">
              <Database className="h-3 w-3 text-red-400" />
              <span>Sanity</span>
            </span>
            <span className="inline-flex items-center space-x-1 rounded bg-[#161926] px-2 py-1 border border-[#23283b]">
              <Cpu className="h-3 w-3 text-sky-400" />
              <span>Gemini</span>
            </span>
          </div>

          {/* Sanity Knowledge Base Link */}
          <a
            href="http://localhost:3333"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#23283b] bg-[#161926] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-indigo-500/40 hover:text-white"
          >
            Sanity Knowledge Base
          </a>
        </div>
      </div>
    </header>
  )
}
