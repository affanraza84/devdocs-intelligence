import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createMCPClient } from '@ai-sdk/mcp'
import { streamText, stepCountIs, type ModelMessage } from 'ai'
import { config, getGeminiApiKey, getSanityReadToken, validateEnv } from './config'

export interface AskAgentOptions {
  prompt?: string
  messages?: ModelMessage[]
  onStepFinish?: (step: any) => void
}

export async function askDevDocsAgent(options: AskAgentOptions) {
  validateEnv()
  const token = getSanityReadToken()
  const apiKey = getGeminiApiKey()

  // 1. Connect MCP client to hosted Sanity Context MCP endpoint
  const mcpClient = await createMCPClient({
    transport: {
      type: 'http',
      url: config.sanity.mcpUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // 2. Retrieve MCP tools (initial_context, knowledge_base_read, knowledge_base_search, etc.)
  const tools = await mcpClient.tools()

  // 3. Initialize Gemini LLM provider
  const google = createGoogleGenerativeAI({ apiKey })
  const model = google('gemini-2.5-flash')

  // 4. Stream model response with multi-step tool execution
  const baseOptions = {
    model,
    system: `You are the DevDocs Intelligence Assistant.
You have access to the Sanity Context Knowledge Base for Next.js developer documentation via MCP tools.
Always call initial_context first to inspect available knowledge base outlines and entry paths.
Then use knowledge_base_read or knowledge_base_search to ground your answers in the authentic Next.js documentation and release notes.
Always provide version-aware, accurate, and source-grounded answers.
Never invent details that are not in the Sanity documentation.`,
    tools,
    stopWhen: stepCountIs(10),
    onStepFinish: options.onStepFinish,
    onFinish: async () => {
      try {
        await mcpClient.close()
      } catch {
        // Safe ignore on already closed
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
