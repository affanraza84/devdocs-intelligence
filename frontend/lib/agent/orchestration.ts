import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, stepCountIs, type ModelMessage } from 'ai'
import {
  getGeminiApiKey,
  getGeminiModel,
  getSanityMcpUrl,
  getSanityReadToken,
  validateServerEnv,
} from '../config/env'
import { ManagedMcpSession } from './mcp-manager'
import type { AgentExecutionOptions, McpClientLike } from './types'

export const SYSTEM_PROMPT = `You are DevDocs Intelligence, a high-precision developer documentation assistant specializing in Next.js.
You have live access to the official Next.js Knowledge Base hosted in Sanity via Sanity Context MCP tools.

CRITICAL INSTRUCTIONS:
1. ALWAYS call 'initial_context' on your first step to load the active knowledge base outlines, IDs, and entry paths.
2. For specific or cross-document questions, use 'knowledge_base_read' or 'knowledge_base_search' to fetch the actual Sanity documentation.
3. Be VERSION-AWARE: Always make clear whether an API, feature, or default behavior applies to Next.js 14, Next.js 15, or Next.js 16.
4. Highlight breaking changes, migrations, and caching architecture differences.
5. Provide code examples formatted in standard markdown with language identifiers (e.g. \`\`\`tsx).
6. Never fabricate API names, version facts, or deprecations that are not in the Sanity documentation.
7. Be structured, concise, and developer-friendly.`

export interface OrchestrationDependencies {
  mcpClientFactory?: (options: any) => Promise<McpClientLike>
  modelFactory?: (modelName: string) => any
}

export interface OrchestrationResult {
  streamResult: ReturnType<typeof streamText>
  mcpSession: ManagedMcpSession
  cleanup: () => Promise<void>
}

export async function orchestrateDevDocsAgent(
  options: AgentExecutionOptions,
  deps: OrchestrationDependencies = {}
): Promise<OrchestrationResult> {
  // 1. Validate environment if using real services
  if (!deps.modelFactory) {
    validateServerEnv()
  }

  const token = getSanityReadToken()
  const apiKey = getGeminiApiKey()
  const mcpUrl = getSanityMcpUrl()
  const modelName = getGeminiModel()

  const maxSteps =
    options.maxSteps ||
    (process.env.AGENT_MAX_STEPS ? parseInt(process.env.AGENT_MAX_STEPS, 10) : 8)

  options.onStatus?.('Connecting to Sanity Context MCP endpoint...')

  // 2. Initialize MCP session with guaranteed lifecycle cleanup and cancellation
  const mcpSession = new ManagedMcpSession(
    {
      mcpUrl,
      token,
      timeoutMs: options.timeoutMs,
      signal: options.signal,
    },
    deps.mcpClientFactory
  )

  const { tools } = await mcpSession.connect()

  options.onStatus?.('Retrieving Sanity Knowledge Base tools...')

  // 3. Initialize Model
  const model = deps.modelFactory
    ? deps.modelFactory(modelName)
    : createGoogleGenerativeAI({ apiKey })(modelName)

  // 4. Cleanup helper ensuring MCP client is closed
  let isCleanedUp = false
  const cleanup = async () => {
    if (isCleanedUp) return
    isCleanedUp = true
    await mcpSession.close()
  }

  // Bind cleanup to options.signal abort
  if (options.signal) {
    options.signal.addEventListener(
      'abort',
      () => {
        cleanup().catch((err) => {
          void err
        })
      },
      { once: true }
    )
  }

  const baseStreamConfig = {
    model,
    system: SYSTEM_PROMPT,
    tools,
    stopWhen: stepCountIs(maxSteps),
    abortSignal: options.signal,
    onStepFinish: (step: any) => {
      options.onStepFinish?.(step)
    },
    onFinish: async () => {
      await cleanup()
    },
    onError: async () => {
      await cleanup()
    },
  }

  const streamResult = options.messages && options.messages.length > 0
    ? streamText({
        ...baseStreamConfig,
        messages: options.messages as ModelMessage[],
      })
    : streamText({
        ...baseStreamConfig,
        prompt: (options.prompt || '').trim(),
      })

  return {
    streamResult,
    mcpSession,
    cleanup,
  }
}
