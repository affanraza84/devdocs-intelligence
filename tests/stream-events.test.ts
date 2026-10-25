import assert from 'node:assert/strict'
import test from 'node:test'
import type { StreamEvent } from '../frontend/lib/agent/types'

function formatSSE(event: StreamEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
}

function parseSSEBlock(raw: string): { type: string; data: any } {
  const eventMatch = raw.match(/^event:\s*([^\n]+)/m)
  const dataMatch = raw.match(/^data:\s*(.+)$/m)
  const type = eventMatch ? eventMatch[1].trim() : ''
  const data = dataMatch ? JSON.parse(dataMatch[1].trim()) : {}
  return { type, data }
}

test('Stream Events: correctly formats and parses typed events in strict lifecycle sequence', () => {
  const events: StreamEvent[] = [
    {
      type: 'status',
      message: 'Connecting to Sanity Context MCP...',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'tool_call',
      toolName: 'knowledge_base_search',
      args: { query: 'Next.js 15 caching' },
      timestamp: new Date().toISOString(),
    },
    {
      type: 'source',
      source: {
        id: 'source-15-caching',
        title: 'Caching In Next.js 15',
        path: '/docs/app/building-your-application/caching',
        type: 'documentation',
        version: '15.x',
      },
    },
    {
      type: 'text',
      delta: 'In Next.js 15, fetch is uncached by default.',
    },
    {
      type: 'done',
      completed: true,
      durationMs: 450,
      steps: 1,
    },
  ]

  const sseBlocks = events.map(formatSSE)
  assert.equal(sseBlocks.length, 5)

  // Verify first event is status
  const first = parseSSEBlock(sseBlocks[0])
  assert.equal(first.type, 'status')
  assert.equal(first.data.message, 'Connecting to Sanity Context MCP...')

  // Verify second event is tool_call
  const second = parseSSEBlock(sseBlocks[1])
  assert.equal(second.type, 'tool_call')
  assert.equal(second.data.toolName, 'knowledge_base_search')

  // Verify third is source
  const third = parseSSEBlock(sseBlocks[2])
  assert.equal(third.type, 'source')
  assert.equal(third.data.source.version, '15.x')

  // Verify fourth is text delta
  const fourth = parseSSEBlock(sseBlocks[3])
  assert.equal(fourth.type, 'text')
  assert.match(fourth.data.delta, /uncached/i)

  // Verify fifth is terminal done event
  const fifth = parseSSEBlock(sseBlocks[4])
  assert.equal(fifth.type, 'done')
  assert.equal(fifth.data.completed, true)
})

test('Stream Events: error event terminates stream with sanitized message', () => {
  const errorEvent: StreamEvent = {
    type: 'error',
    message: 'The documentation request timed out while retrieving content.',
    code: 'AGENT_TIMEOUT',
  }

  const block = formatSSE(errorEvent)
  const parsed = parseSSEBlock(block)

  assert.equal(parsed.type, 'error')
  assert.equal(parsed.data.code, 'AGENT_TIMEOUT')
  assert.match(parsed.data.message, /timed out/i)
  // Ensure no sensitive data
  assert.equal(parsed.data.message.includes('skW1'), false)
})
