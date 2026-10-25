import assert from 'node:assert/strict'
import test from 'node:test'
import { McpConnectionError } from '../frontend/lib/agent/errors'
import { ManagedMcpSession } from '../frontend/lib/agent/mcp-manager'
import type { McpClientLike } from '../frontend/lib/agent/types'

test('MCP Manager: connects successfully and retrieves tools', async () => {
  let closed = false
  const mockClient: McpClientLike = {
    tools: async () => ({
      initial_context: { description: 'Get outline' },
      knowledge_base_read: { description: 'Read docs' },
    }),
    close: async () => {
      closed = true
    },
  }

  const session = new ManagedMcpSession(
    {
      mcpUrl: 'https://mock.mcp.endpoint',
      token: 'mock-token',
      timeoutMs: 1000,
    },
    async () => mockClient
  )

  const { client, tools } = await session.connect()
  assert.equal(client, mockClient)
  assert.ok(tools.initial_context)

  await session.close()
  assert.equal(closed, true)
  assert.equal(session.isClientClosed(), true)
})

test('MCP Manager: handles initialization failure and wraps as McpConnectionError', async () => {
  let closeCalled = false
  const mockFailingClient: McpClientLike = {
    tools: async () => {
      throw new Error('Endpoint unreachable 503')
    },
    close: async () => {
      closeCalled = true
    },
  }

  const session = new ManagedMcpSession(
    {
      mcpUrl: 'https://broken.mcp.endpoint',
      token: 'mock-token',
      timeoutMs: 500,
    },
    async () => mockFailingClient
  )

  await assert.rejects(
    async () => {
      await session.connect()
    },
    (err: unknown) => {
      assert.ok(err instanceof McpConnectionError)
      return true
    }
  )

  // Client should be cleaned up on failure
  assert.equal(closeCalled, true)
  assert.equal(session.isClientClosed(), true)
})

test('MCP Manager: guarantees idempotency of close()', async () => {
  let closeCount = 0
  const mockClient: McpClientLike = {
    tools: async () => ({}),
    close: async () => {
      closeCount++
    },
  }

  const session = new ManagedMcpSession(
    { mcpUrl: 'https://mock.mcp', token: 'token' },
    async () => mockClient
  )

  await session.connect()
  await session.close()
  await session.close() // Second close should be safe no-op

  assert.equal(closeCount, 1)
})

test('MCP Manager: triggers close immediately when AbortSignal fires', async () => {
  let closed = false
  const controller = new AbortController()

  const mockClient: McpClientLike = {
    tools: async () => ({}),
    close: async () => {
      closed = true
    },
  }

  const session = new ManagedMcpSession(
    {
      mcpUrl: 'https://mock.mcp',
      token: 'token',
      signal: controller.signal,
    },
    async () => mockClient
  )

  await session.connect()
  assert.equal(closed, false)

  // Abort controller
  controller.abort()

  // Wait a microtask for listener to execute
  await new Promise((resolve) => setTimeout(resolve, 10))

  assert.equal(closed, true)
  assert.equal(session.isClientClosed(), true)
})
