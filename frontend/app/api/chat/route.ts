import { NextRequest } from 'next/server'
import {
  askDevDocsAgentStream,
  extractSourcesFromToolCall,
  extractSourcesFromToolResult,
} from '@/lib/agent/devdocs-agent'
import { sanitizeError } from '@/lib/agent/errors'
import { RequestLogger } from '@/lib/agent/logger'
import { globalRateLimiter } from '@/lib/agent/rate-limiter'
import type {
  AgentToolInvocation,
  StreamEvent,
} from '@/lib/agent/types'
import {
  validateChatRequest,
  validatePayloadSize,
} from '@/lib/agent/validation'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Checks if the request origin is allowed.
 */
function isOriginAllowed(origin: string | null, host: string | null): boolean {
  if (!origin) return true // Same-origin or non-browser client

  try {
    const originUrl = new URL(origin)
    // Allow localhost and local loopbacks in development
    if (
      originUrl.hostname === 'localhost' ||
      originUrl.hostname === '127.0.0.1' ||
      originUrl.hostname === '0.0.0.0'
    ) {
      return true
    }

    // Check host match
    if (host && originUrl.host === host) {
      return true
    }

    const allowedOrigin = process.env.ALLOWED_ORIGIN
    if (allowedOrigin && (allowedOrigin === '*' || allowedOrigin === origin)) {
      return true
    }
  } catch {
    return false
  }

  return false
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Request-Id, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  const requestId =
    req.headers.get('x-request-id') ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `req-${Date.now()}`)

  const logger = new RequestLogger(requestId)

  // 1. Origin verification
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!isOriginAllowed(origin, host)) {
    logger.warn('request_origin_forbidden', { origin, host })
    return new Response(
      JSON.stringify({ error: 'Forbidden: Request origin is not permitted.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    )
  }

  // 2. Rate limiting check
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous'

  const rateCheck = globalRateLimiter.check(clientIp)
  if (!rateCheck.allowed) {
    logger.warn('rate_limit_exceeded', {
      clientIp,
      limit: rateCheck.limit,
      resetMs: rateCheck.resetMs,
    })

    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateCheck.resetMs / 1000)),
          'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)),
        },
      }
    )
  }

  // 3. Body reading & payload size validation
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch (err: unknown) {
    logger.error('failed_reading_request_body', err)
    return new Response(
      JSON.stringify({ error: 'Failed to read request body.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    )
  }

  const sizeValidation = validatePayloadSize(rawBody)
  if (!sizeValidation.valid) {
    logger.warn('payload_size_limit_exceeded', {
      error: sizeValidation.error,
    })
    return new Response(
      JSON.stringify({
        error: sizeValidation.error || 'Payload size exceeds limit.',
        code: 'PAYLOAD_TOO_LARGE',
      }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    )
  }

  // 4. JSON parsing & Zod Schema Validation
  let parsedJson: unknown
  try {
    parsedJson = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    logger.warn('invalid_json_payload')
    return new Response(
      JSON.stringify({
        error: 'Invalid JSON request payload.',
        code: 'INVALID_JSON',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    )
  }

  const validation = validateChatRequest(parsedJson)
  if (!validation.success) {
    logger.warn('request_validation_failed', {
      error: validation.error,
      details: validation.details,
    })
    return new Response(
      JSON.stringify({
        error: validation.error,
        code: 'VALIDATION_ERROR',
        details: validation.details,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
      }
    )
  }

  const { prompt, messages } = validation.data
  logger.info('chat_request_received', {
    prompt,
    messages,
  })

  // 5. Configurable Timeout & Cancellation Setup
  const requestTimeoutMs = process.env.REQUEST_TIMEOUT_MS
    ? parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
    : 55_000 // 55s timeout safely inside Vercel's 60s maxDuration

  const abortController = new AbortController()

  // Propagate client disconnection to agent
  const onClientDisconnect = () => {
    logger.warn('client_disconnected_aborting')
    abortController.abort()
  }

  if (req.signal) {
    req.signal.addEventListener('abort', onClientDisconnect, { once: true })
  }

  const timeoutTimer = setTimeout(() => {
    logger.warn('request_timeout_aborting', { timeoutMs: requestTimeoutMs })
    abortController.abort()
  }, requestTimeoutMs)

  const encoder = new TextEncoder()

  // 6. Streaming SSE Response with Guaranteed Cleanup
  const stream = new ReadableStream({
    async start(controller) {
      let agentCleanup: (() => Promise<void>) | null = null

      function sendEvent(event: StreamEvent) {
        try {
          const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(payload))
        } catch {
          // Stream controller may already be closed if client disconnected
        }
      }

      try {
        sendEvent({
          type: 'status',
          message: 'Initializing Sanity Context MCP connection...',
          timestamp: new Date().toISOString(),
        })

        const { streamResult, cleanup } = await askDevDocsAgentStream({
          prompt,
          messages,
          signal: abortController.signal,
          timeoutMs: requestTimeoutMs,
          requestId,
          onStatus: (status) => {
            sendEvent({
              type: 'status',
              message: status,
              timestamp: new Date().toISOString(),
            })
          },
        })

        agentCleanup = cleanup

        sendEvent({
          type: 'status',
          message: 'Querying Sanity Knowledge Base...',
          timestamp: new Date().toISOString(),
        })

        const discoveredPaths = new Set<string>()
        const discoveredSources = new Set<string>()
        let stepCount = 0

        for await (const part of streamResult.fullStream) {
          if (abortController.signal.aborted) {
            throw new Error('Request was aborted')
          }

          if (part.type === 'tool-call') {
            const input = (part as any).args || (part as any).input || {}
            const invocation: AgentToolInvocation = {
              toolName: part.toolName,
              args: input as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            }
            sendEvent({
              type: 'tool_call',
              toolName: part.toolName,
              args: invocation.args,
              timestamp: invocation.timestamp,
            })

            // Normalize and emit sources discovered from tool calls
            const sources = extractSourcesFromToolCall(part.toolName, input, discoveredPaths)
            for (const src of sources) {
              sendEvent({ type: 'source', source: src })
            }
          } else if (part.type === 'tool-result') {
            stepCount++
            const res = (part as any).result
            // Extract grounded sources from content
            const headingSources = extractSourcesFromToolResult(
              part.toolName,
              res,
              discoveredSources
            )
            for (const src of headingSources) {
              sendEvent({ type: 'source', source: src })
            }
          } else if (part.type === 'text-delta') {
            const delta = (part as any).textDelta || (part as any).text || ''
            if (delta) {
              sendEvent({ type: 'text', delta })
            }
          } else if (part.type === 'error') {
            throw (part as any).error || new Error('Stream execution encountered error')
          }
        }

        const durationMs = logger.getElapsedMs()
        logger.info('stream_completed_successfully', { durationMs, steps: stepCount })
        sendEvent({
          type: 'done',
          completed: true,
          durationMs,
          steps: stepCount,
        })
      } catch (streamError: unknown) {
        logger.error('stream_execution_failed', streamError)
        const sanitized = sanitizeError(streamError)
        sendEvent({
          type: 'error',
          message: sanitized.message,
          code: sanitized.code,
        })
      } finally {
        clearTimeout(timeoutTimer)
        if (req.signal) {
          req.signal.removeEventListener('abort', onClientDisconnect)
        }
        if (agentCleanup) {
          try {
            await agentCleanup()
          } catch {
            // Ignore cleanup errors
          }
        }
        try {
          controller.close()
        } catch {
          // Controller might already be closed
        }
      }
    },
    async cancel() {
      // Called when consumer closes/aborts the readable stream
      logger.warn('stream_cancelled_by_reader')
      abortController.abort()
      clearTimeout(timeoutTimer)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Request-Id': requestId,
      'X-RateLimit-Limit': String(rateCheck.limit),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
    },
  })
}
