import { NextRequest } from 'next/server'
import {
  askDevDocsAgentStream,
  formatPathToTitle,
  parseSourceType,
} from '@/lib/agent/devdocs-agent'
import type { AgentToolInvocation, GroundedSource } from '@/lib/agent/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const prompt: string | undefined =
      body.prompt ||
      (Array.isArray(body.messages) &&
        body.messages[body.messages.length - 1]?.content)

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Please provide a non-empty question or prompt.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: any) {
          try {
            const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(payload))
          } catch {
            // Controller might be closed
          }
        }

        try {
          sendEvent('status', { message: 'Initializing Sanity Context MCP connection...' })

          const { streamResult } = await askDevDocsAgentStream({
            prompt: prompt.trim(),
            onStatus: (status) => {
              sendEvent('status', { message: status })
            },
          })

          sendEvent('status', { message: 'Querying Sanity Knowledge Base...' })

          const discoveredPaths = new Set<string>()

          for await (const part of streamResult.fullStream) {
            if (part.type === 'tool-call') {
              const input = (part as any).args || (part as any).input || {}
              const invocation: AgentToolInvocation = {
                toolName: part.toolName,
                args: input,
                timestamp: new Date().toISOString(),
              }
              sendEvent('tool_call', invocation)

              // Extract paths from knowledge_base_read
              if (part.toolName === 'knowledge_base_read') {
                const paths: string[] = Array.isArray(input.paths)
                  ? input.paths
                  : Array.isArray(input.entry_paths)
                    ? input.entry_paths
                    : []

                for (const path of paths) {
                  if (path && !discoveredPaths.has(path)) {
                    discoveredPaths.add(path)
                    const title = formatPathToTitle(path)
                    const type = parseSourceType(path)
                    const source: GroundedSource = {
                      id: `source-${path.replace(/[/_]/g, '-')}`,
                      title,
                      path,
                      type,
                      version: path.includes('15')
                        ? '15.x'
                        : path.includes('14')
                          ? '14.x'
                          : path.includes('16')
                            ? '16.x'
                            : undefined,
                    }
                    sendEvent('source', source)
                  }
                }
              }
            } else if (part.type === 'tool-result') {
              const res = (part as any).result
              if (part.toolName === 'knowledge_base_read' && res?.content) {
                for (const item of res.content) {
                  if (item.type === 'text' && typeof item.text === 'string') {
                    const firstHeading = item.text.match(/^#\s+(.+)$/m)
                    if (firstHeading && firstHeading[1]) {
                      const heading = firstHeading[1].trim()
                      const source: GroundedSource = {
                        id: `heading-${heading.toLowerCase().replace(/\s+/g, '-')}`,
                        title: heading,
                        path: 'Sanity Knowledge Base (kbU7pqSq7jdK)',
                        type: 'documentation',
                        snippet: item.text.slice(0, 200).trim() + '...',
                      }
                      sendEvent('source', source)
                    }
                  }
                }
              }
            } else if (part.type === 'text-delta') {
              const delta = (part as any).textDelta || (part as any).text || ''
              if (delta) {
                sendEvent('text', { delta })
              }
            } else if (part.type === 'error') {
              throw (part as any).error || new Error('Stream execution error')
            }
          }

          sendEvent('done', { completed: true })
          controller.close()
        } catch (streamError: any) {
          console.error('[API /api/chat Stream Error]', streamError)

          let userFriendlyMessage =
            'An error occurred while retrieving documentation from Sanity Context MCP.'
          const rawMessage = streamError?.message || ''

          if (
            rawMessage.includes('quota') ||
            rawMessage.includes('429') ||
            rawMessage.includes('RESOURCE_EXHAUSTED')
          ) {
            userFriendlyMessage =
              'Gemini API rate limit reached. Please wait 15-30 seconds before retrying.'
          } else if (
            rawMessage.includes('503') ||
            rawMessage.includes('high demand') ||
            rawMessage.includes('UNAVAILABLE')
          ) {
            userFriendlyMessage =
              'Gemini model is currently experiencing temporary high demand from Google. Please click Retry in a few seconds.'
          } else if (
            rawMessage.includes('SANITY_API_READ_TOKEN') ||
            rawMessage.includes('Unauthorized')
          ) {
            userFriendlyMessage =
              'Authentication with Sanity Context MCP failed. Please check server configuration.'
          } else if (rawMessage.includes('GEMINI_API_KEY')) {
            userFriendlyMessage =
              'Gemini API key is missing or invalid on the server.'
          } else if (
            rawMessage.includes('fetch failed') ||
            rawMessage.includes('ECONNREFUSED')
          ) {
            userFriendlyMessage =
              'Failed to connect to the hosted Sanity Context MCP service. Please verify network access.'
          }

          sendEvent('error', { message: userFriendlyMessage })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err: any) {
    console.error('[API /api/chat Error]', err)
    return new Response(
      JSON.stringify({
        error:
          'Failed to process chat request. Secrets and credentials have been kept secure.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
