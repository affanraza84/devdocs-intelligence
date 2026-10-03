'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type {
  ChatMessageData,
  AgentToolInvocation,
  GroundedSource,
} from '@/lib/agent/types'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ExamplePrompts } from './ExamplePrompts'
import { Hero } from '../ui/Hero'
import { ArchitectureSection } from '../ui/ArchitectureSection'
import { StructuredContentCards } from '../ui/StructuredContentCards'

export function ChatContainer() {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('')

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStatus, isLoading])

  const handleSendPrompt = async (promptToSend?: string) => {
    const text = (promptToSend || input).trim()
    if (!text || isLoading) return

    setErrorMessage(null)
    setLastUserPrompt(text)
    setInput('')
    setIsLoading(true)
    setCurrentStatus('Initializing Sanity Context MCP...')

    const userMessageId = `user-${Date.now()}`
    const assistantMessageId = `assistant-${Date.now()}`

    const newUserMessage: ChatMessageData = {
      id: userMessageId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }

    const initialAssistantMessage: ChatMessageData = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      toolInvocations: [],
      sources: [],
    }

    setMessages((prev) => [...prev, newUserMessage, initialAssistantMessage])

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        let errText = 'Server error'
        try {
          const errJson = await response.json()
          errText = errJson.error || errText
        } catch {
          // ignore
        }
        throw new Error(errText)
      }

      if (!response.body) {
        throw new Error('No response stream received from server.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const block of lines) {
          if (!block.trim()) continue

          const eventMatch = block.match(/^event:\s*([^\n]+)/m)
          const dataMatch = block.match(/^data:\s*(.+)$/m)

          const eventType = eventMatch ? eventMatch[1].trim() : 'message'
          const rawData = dataMatch ? dataMatch[1].trim() : ''

          let parsedData: any = {}
          try {
            parsedData = JSON.parse(rawData)
          } catch {
            // non-json payload
          }

          if (eventType === 'status') {
            setCurrentStatus(parsedData.message || null)
          } else if (eventType === 'tool_call') {
            const invocation: AgentToolInvocation = parsedData
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      toolInvocations: [...(msg.toolInvocations || []), invocation],
                    }
                  : msg
              )
            )
          } else if (eventType === 'source') {
            const source: GroundedSource = parsedData
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      sources: [...(msg.sources || []), source],
                    }
                  : msg
              )
            )
          } else if (eventType === 'text') {
            const delta = parsedData.delta || ''
            setCurrentStatus(null)
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: msg.content + delta,
                    }
                  : msg
              )
            )
          } else if (eventType === 'error') {
            throw new Error(parsedData.message || 'Stream processing error')
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setCurrentStatus(null)
        return
      }
      console.error('[Chat Error]', err)
      setErrorMessage(err.message || 'Failed to complete query.')
    } finally {
      setIsLoading(false)
      setCurrentStatus(null)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
      setIsLoading(false)
      setCurrentStatus(null)
    }
  }

  const handleRetry = () => {
    if (lastUserPrompt) {
      // Remove last assistant message if empty
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          return prev.slice(0, -1)
        }
        return prev
      })
      handleSendPrompt(lastUserPrompt)
    }
  }

  const handleClear = () => {
    handleStop()
    setMessages([])
    setErrorMessage(null)
    setCurrentStatus(null)
  }

  const hasMessages = messages.length > 0

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 py-6 space-y-6">
      {!hasMessages ? (
        // Initial Empty State
        <div className="space-y-6">
          <Hero />
          <ArchitectureSection />
          <StructuredContentCards />
          <div className="pt-2">
            <ExamplePrompts
              onSelectPrompt={(p) => handleSendPrompt(p)}
              disabled={isLoading}
            />
          </div>
        </div>
      ) : (
        // Active Conversation View
        <div className="space-y-5">
          <div className="flex items-center justify-between border-b border-[#1a1f30] pb-3">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-slate-300">
                Active Session • Grounded in Sanity Knowledge Base
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center space-x-1.5 rounded-md border border-[#23283b] bg-[#121522] px-2.5 py-1 text-xs text-slate-400 hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Reset Chat</span>
            </button>
          </div>

          <div className="space-y-4">
            {messages.map((message, idx) => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={
                  isLoading &&
                  idx === messages.length - 1 &&
                  message.role === 'assistant'
                }
              />
            ))}
          </div>

          {/* Real-time status indicator */}
          {isLoading && currentStatus && (
            <div className="flex items-center space-x-2 rounded-lg border border-[#23283b] bg-[#10131e] px-4 py-2.5 text-xs text-indigo-300 font-mono">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>{currentStatus}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-200">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center space-x-1.5 rounded bg-red-500/20 px-3 py-1 font-medium text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry Query</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      <div className="sticky bottom-4 z-20 pt-2">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={() => handleSendPrompt()}
          onStop={handleStop}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
