import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMCPClient } from '@ai-sdk/mcp'
import { streamText, stepCountIs, type ModelMessage } from 'ai'
import {
  getGeminiApiKey,
  getGeminiModel,
  getSanityMcpUrl,
  getSanityReadToken,
  validateServerEnv,
} from '../config/env'
import type { AgentToolInvocation, GroundedSource } from './types'

export interface AskDevDocsAgentOptions {
  prompt?: string
  messages?: ModelMessage[]
  onStatus?: (status: string) => void
  onToolCall?: (invocation: AgentToolInvocation) => void
  onSourceDiscovered?: (source: GroundedSource) => void
  onStepFinish?: (step: any) => void
}

export function parseSourceType(path: string): GroundedSource['type'] {
  const p = path.toLowerCase()
  if (p.includes('upgrade') || p.includes('migration')) return 'migrationGuide'
  if (p.includes('route_handlers') || p.includes('server_actions') || p.includes('api')) return 'apiReference'
  if (p.includes('changelog') || p.includes('release')) return 'releaseNote'
  return 'documentation'
}

export function formatPathToTitle(path: string): string {
  const segments = path.split('/')
  const last = segments[segments.length - 1] || path
  return last
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function askDevDocsAgentStream(options: AskDevDocsAgentOptions) {
  validateServerEnv()
  const token = getSanityReadToken()
  const apiKey = getGeminiApiKey()
  const mcpUrl = getSanityMcpUrl()
  const modelName = getGeminiModel()

  options.onStatus?.('Connecting to Sanity Context MCP endpoint...')

  // 1. Connect to hosted Sanity Context MCP
  const mcpClient = await createMCPClient({
    transport: {
      type: 'http',
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // 2. Retrieve MCP tools
  options.onStatus?.('Retrieving Sanity Knowledge Base tools...')
  const tools = await mcpClient.tools()

  // 3. Initialize Gemini model
  const google = createGoogleGenerativeAI({ apiKey })
  const model = google(modelName)

  const systemPrompt = `You are DevDocs Intelligence, a high-precision developer documentation assistant specializing in Next.js.
You have live access to the official Next.js Knowledge Base hosted in Sanity via Sanity Context MCP tools.

CRITICAL INSTRUCTIONS:
1. ALWAYS call 'initial_context' on your first step to load the active knowledge base outlines, IDs, and entry paths.
2. For specific or cross-document questions, use 'knowledge_base_read' or 'knowledge_base_search' to fetch the actual Sanity documentation.
3. Be VERSION-AWARE: Always make clear whether an API, feature, or default behavior applies to Next.js 14, Next.js 15, or Next.js 16.
4. Highlight breaking changes, migrations, and caching architecture differences.
5. Provide code examples formatted in standard markdown with language identifiers (e.g. \`\`\`tsx).
6. Never fabricate API names, version facts, or deprecations that are not in the Sanity documentation.
7. Be structured, concise, and developer-friendly.`

  const baseOptions = {
    model,
    system: systemPrompt,
    tools,
    stopWhen: stepCountIs(8),
    onStepFinish: (step: any) => {
      options.onStepFinish?.(step)
    },
    onFinish: async () => {
      try {
        await mcpClient.close()
      } catch {
        // Safe ignore
      }
    },
    onError: async () => {
      try {
        await mcpClient.close()
      } catch {
        // Safe ignore
      }
    },
  }

  const streamResult = options.messages
    ? streamText({ ...baseOptions, messages: options.messages })
    : streamText({ ...baseOptions, prompt: options.prompt || '' })

  return {
    streamResult,
    mcpClient,
  }
}
