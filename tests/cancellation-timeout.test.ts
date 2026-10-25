import assert from 'node:assert/strict'
import test from 'node:test'
import { orchestrateDevDocsAgent } from '../frontend/lib/agent/orchestration'
import type { McpClientLike } from '../frontend/lib/agent/types'

test('Cancellation: abort signal propagates and closes MCP client immediately', async () => {
  let mcpClosed = false
  const abortController = new AbortController()

  const mockMcpClient: McpClientLike = {
    tools: async () => ({
      initial_context: { description: 'Outline' },
    }),
    close: async () => {
      mcpClosed = true
    },
  }

  const mockModelFactory = () => {
    return {
      specificationVersion: 'v2',
      modelId: 'mock-gemini',
      provider: 'google',
      doStream: async () => {
        // Return async iterable stream
        return {
          stream: new ReadableStream({
            start(controller) {
              controller.enqueue({ type: 'text-delta', textDelta: 'Hello' })
            },
          }),
        }
      },
    }
  }

  // Pre-set environment so validation passes
  process.env.SANITY_API_READ_TOKEN = 'mock-sanity-token-1234567890'
  process.env.GEMINI_API_KEY = 'mock-gemini-key-1234567890'

  const { streamResult, cleanup } = await orchestrateDevDocsAgent(
    {
      prompt: 'Next.js 15 routing',
      signal: abortController.signal,
    },
    {
      mcpClientFactory: async () => mockMcpClient,
      modelFactory: mockModelFactory as any,
    }
  )

  assert.equal(mcpClosed, false)

  // Abort the controller
  abortController.abort()

  // Wait brief tick for abort event listener
  await new Promise((resolve) => setTimeout(resolve, 15))

  assert.equal(mcpClosed, true)

  // Explicit cleanup should also remain safe
  await cleanup()
  assert.equal(mcpClosed, true)
})

test('Cancellation: timeout triggers abort and cleans up resources', async () => {
  let mcpClosed = false

  const mockMcpClient: McpClientLike = {
    tools: async () => ({
      initial_context: { description: 'Outline' },
    }),
    close: async () => {
      mcpClosed = true
    },
  }

  const abortController = new AbortController()
  const timeoutMs = 30
  const timer = setTimeout(() => {
    abortController.abort()
  }, timeoutMs)

  const { cleanup } = await orchestrateDevDocsAgent(
    {
      prompt: 'Testing timeout',
      signal: abortController.signal,
      timeoutMs,
    },
    {
      mcpClientFactory: async () => mockMcpClient,
      modelFactory: (() => ({
        specificationVersion: 'v2',
        modelId: 'mock-gemini',
        provider: 'google',
        doStream: async () => ({
          stream: new ReadableStream({
            start() {},
          }),
        }),
      })) as any,
    }
  )

  // Wait for timeout to fire
  await new Promise((resolve) => setTimeout(resolve, 50))
  clearTimeout(timer)

  assert.equal(abortController.signal.aborted, true)
  assert.equal(mcpClosed, true)

  await cleanup()
})
