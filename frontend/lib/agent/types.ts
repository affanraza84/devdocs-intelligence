export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessageData {
  id: string
  role: MessageRole
  content: string
  createdAt?: string
  toolInvocations?: AgentToolInvocation[]
  sources?: GroundedSource[]
  detectedVersions?: string[]
}

export interface AgentToolInvocation {
  toolName: string
  args: Record<string, any>
  timestamp?: string
}

export interface GroundedSource {
  id: string
  title: string
  path: string
  type: 'documentation' | 'apiReference' | 'migrationGuide' | 'releaseNote' | 'general'
  version?: string
  snippet?: string
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'tool_call'; toolName: string; args: Record<string, any> }
  | { type: 'source'; source: GroundedSource }
  | { type: 'text'; delta: string }
  | { type: 'versions'; versions: string[] }
  | { type: 'done' }
  | { type: 'error'; message: string }
