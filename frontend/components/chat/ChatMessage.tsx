'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User,
  Copy,
  Check,
  Cpu,
} from 'lucide-react'
import type { ChatMessageData } from '@/lib/agent/types'
import { ToolInvocationBadge } from './ToolInvocationBadge'
import { SourcesList } from '../sources/SourcesList'
import { VersionTimeline } from '../ui/VersionBadge'

interface ChatMessageProps {
  message: ChatMessageData
  isStreaming?: boolean
}

function CodeBlock({
  language,
  value,
}: {
  language: string
  value: string
}) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="relative my-3 rounded-lg border border-[#23283b] bg-[#0c0e17] overflow-hidden text-xs">
      <div className="flex items-center justify-between border-b border-[#1f2438] bg-[#121522] px-3.5 py-1.5">
        <span className="font-mono text-[11px] text-slate-400 lowercase">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center space-x-1 rounded bg-[#161a2b] px-2 py-0.5 font-mono text-[10px] text-slate-300 hover:text-white transition-colors border border-[#23283b]"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-slate-200">
        <code>{value}</code>
      </pre>
    </div>
  )
}

function detectNextJsVersions(text: string): string[] {
  const versions: string[] = []
  if (/next\.?js\s*14/i.test(text) || /\bv14\b/i.test(text)) versions.push('14')
  if (/next\.?js\s*15/i.test(text) || /\bv15\b/i.test(text)) versions.push('15')
  if (/next\.?js\s*16/i.test(text) || /\bv16\b/i.test(text)) versions.push('16')
  return versions
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const versions = !isUser ? detectNextJsVersions(message.content) : []

  return (
    <div
      className={`group relative flex w-full flex-col rounded-xl border p-4 sm:p-5 transition-all ${
        isUser
          ? 'border-[#23283b] bg-[#10131e] text-slate-100'
          : 'border-[#1f2538] bg-[#0c0e17] text-slate-200 shadow-xl shadow-black/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1a1f30] pb-2.5 mb-3">
        <div className="flex items-center space-x-2.5">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md ${
              isUser
                ? 'bg-slate-800 text-slate-300'
                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Cpu className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-white">
                {isUser ? 'Developer' : 'DevDocs Intelligence'}
              </span>
              {!isUser && (
                <span className="rounded bg-indigo-500/10 px-1.5 py-0.2 font-mono text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                  Grounded Agent
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Detected Versions or timestamp */}
        {!isUser && versions.length > 0 && (
          <VersionTimeline versions={versions} />
        )}
      </div>

      {/* Tool invocations (MCP steps) */}
      {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
        <ToolInvocationBadge invocations={message.toolInvocations} />
      )}

      {/* Message content */}
      <div className="prose-dark max-w-none text-sm leading-relaxed">
        {isUser ? (
          <p className="whitespace-pre-wrap font-medium text-slate-100">
            {message.content}
          </p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                const value = String(children).replace(/\n$/, '')
                if (!inline && (match || value.includes('\n'))) {
                  return (
                    <CodeBlock
                      language={match ? match[1] : ''}
                      value={value}
                    />
                  )
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* Streaming cursor indicator */}
      {isStreaming && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-indigo-400 font-mono">
          <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
          <span>Streaming response from Sanity Context MCP...</span>
        </div>
      )}

      {/* Grounded Sources */}
      {!isUser && message.sources && message.sources.length > 0 && (
        <SourcesList sources={message.sources} />
      )}
    </div>
  )
}
