export type MessageRole = 'user' | 'assistant' | 'system'

export type SourceType =
  | 'documentation'
  | 'apiReference'
  | 'migrationGuide'
  | 'releaseNote'
  | 'general'

export interface GroundedSource {
  id: string
  title: string
  path: string
  type: SourceType
  version?: string
  snippet?: string
}

export interface AgentToolInvocation {
  toolName: string
  args: Record<string, unknown>
  timestamp?: string
}

export interface ChatMessageData {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
  toolInvocations?: AgentToolInvocation[]
  sources?: GroundedSource[]
  detectedVersions?: string[]
}

export interface SanitizedError {
  message: string
  code: string
  statusCode: number
}

export type StreamEvent =
  | { type: 'status'; message: string; timestamp?: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown>; timestamp?: string }
  | { type: 'source'; source: GroundedSource }
  | { type: 'text'; delta: string }
  | { type: 'versions'; versions: string[] }
  | { type: 'done'; completed: boolean; durationMs?: number; steps?: number }
  | { type: 'error'; message: string; code?: string }

export interface ChatMessageInput {
  role: MessageRole
  content: string
}

export interface ChatRequestBody {
  prompt?: string
  messages?: ChatMessageInput[]
}

export interface AgentExecutionOptions {
  prompt?: string
  messages?: ChatMessageInput[]
  signal?: AbortSignal
  timeoutMs?: number
  maxSteps?: number
  onStatus?: (status: string) => void
  onToolCall?: (invocation: AgentToolInvocation) => void
  onSourceDiscovered?: (source: GroundedSource) => void
  onStepFinish?: (step: unknown) => void
  requestId?: string
}

export interface McpClientLike {
  tools: () => Promise<any>
  close: () => Promise<void>
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetMs: number
}

export interface AgentLogContext {
  requestId: string
  durationMs?: number
  event: string
  promptLength?: number
  messageCount?: number
  model?: string
  status?: string
  error?: string
  [key: string]: unknown
}
