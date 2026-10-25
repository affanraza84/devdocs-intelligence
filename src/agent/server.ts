import * as http from 'node:http'
import { sanitizeError } from '../../frontend/lib/agent/errors'
import { RequestLogger } from '../../frontend/lib/agent/logger'
import { globalRateLimiter } from '../../frontend/lib/agent/rate-limiter'
import {
  MAX_PAYLOAD_BYTES,
  validateChatRequest,
} from '../../frontend/lib/agent/validation'
import { askDevDocsAgent } from './agent'
import { config, validateEnv } from './config'

function setCorsHeaders(res: http.ServerResponse, originHeader?: string) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : originHeader || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Request-Id'
  )
}

export function createAgentServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin as string | undefined
    setCorsHeaders(res, origin)

    const requestId =
      (req.headers['x-request-id'] as string) ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `req-${Date.now()}`)

    const logger = new RequestLogger(requestId)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    // 1. Health check endpoint
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      })
      res.end(
        JSON.stringify({
          status: 'ok',
          name: 'DevDocs Intelligence AI Agent Server',
          mcpEndpoint: config.sanity.mcpUrl,
          model: 'gemini-2.5-flash',
          requestId,
        })
      )
      return
    }

    // 2. Chat endpoint
    if (req.method === 'POST' && (url.pathname === '/api/chat' || url.pathname === '/chat')) {
      // Rate limiting
      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'anonymous'

      const rateCheck = globalRateLimiter.check(clientIp)
      if (!rateCheck.allowed) {
        logger.warn('rate_limit_exceeded', { clientIp })
        res.writeHead(429, {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          'X-RateLimit-Limit': String(rateCheck.limit),
          'X-RateLimit-Remaining': '0',
          'Retry-After': String(Math.ceil(rateCheck.resetMs / 1000)),
        })
        res.end(
          JSON.stringify({
            error: 'Too many requests. Please wait a moment before trying again.',
            code: 'RATE_LIMIT_EXCEEDED',
          })
        )
        return
      }

      let body = ''
      let bytesReceived = 0
      let isBodyTooLarge = false

      req.on('data', (chunk) => {
        bytesReceived += chunk.length
        if (bytesReceived > MAX_PAYLOAD_BYTES) {
          isBodyTooLarge = true
          req.destroy()
        } else {
          body += chunk
        }
      })

      req.on('close', () => {
        if (isBodyTooLarge && !res.headersSent) {
          res.writeHead(413, {
            'Content-Type': 'application/json',
            'X-Request-Id': requestId,
          })
          res.end(
            JSON.stringify({
              error: `Payload exceeds maximum limit of ${MAX_PAYLOAD_BYTES} bytes.`,
              code: 'PAYLOAD_TOO_LARGE',
            })
          )
        }
      })

      req.on('end', async () => {
        if (isBodyTooLarge) return

        const abortController = new AbortController()
        req.on('aborted', () => {
          logger.warn('client_aborted_connection')
          abortController.abort()
        })

        try {
          let parsed: unknown = {}
          try {
            parsed = body ? JSON.parse(body) : {}
          } catch {
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'X-Request-Id': requestId,
            })
            res.end(JSON.stringify({ error: 'Invalid JSON request payload.', code: 'INVALID_JSON' }))
            return
          }

          const validation = validateChatRequest(parsed)
          if (!validation.success) {
            res.writeHead(400, {
              'Content-Type': 'application/json',
              'X-Request-Id': requestId,
            })
            res.end(
              JSON.stringify({
                error: validation.error,
                code: 'VALIDATION_ERROR',
                details: validation.details,
              })
            )
            return
          }

          const { prompt, messages } = validation.data
          logger.info('standalone_chat_request', { prompt, messages })

          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
            'X-Request-Id': requestId,
          })

          const { streamResult, cleanup } = await askDevDocsAgent({
            prompt,
            messages,
            signal: abortController.signal,
            requestId,
          })

          try {
            for await (const textPart of streamResult.textStream) {
              if (abortController.signal.aborted) break
              res.write(textPart)
            }
          } finally {
            await cleanup()
          }

          res.end()
        } catch (err: unknown) {
          logger.error('standalone_agent_error', err)
          const sanitized = sanitizeError(err)

          if (!res.headersSent) {
            res.writeHead(sanitized.statusCode, {
              'Content-Type': 'application/json',
              'X-Request-Id': requestId,
            })
            res.end(JSON.stringify({ error: sanitized.message, code: sanitized.code }))
          } else {
            res.write(`\n\n[Error: ${sanitized.message}]`)
            res.end()
          }
        }
      })
      return
    }

    // Default 404
    res.writeHead(404, {
      'Content-Type': 'application/json',
      'X-Request-Id': requestId,
    })
    res.end(
      JSON.stringify({
        error: 'Not found. Available endpoints: GET /api/health, POST /api/chat',
      })
    )
  })

  return server
}

// Start standalone server if executed directly
if (require.main === module || process.argv[1]?.endsWith('server.ts')) {
  try {
    validateEnv()
  } catch (err: any) {
    console.error(`❌ Startup Error: ${err.message}`)
    process.exit(1)
  }

  const port = config.server.port
  const server = createAgentServer()
  server.listen(port, () => {
    console.log(`🤖 DevDocs Intelligence Agent Server running at http://localhost:${port}`)
    console.log(`   - Health check: GET  http://localhost:${port}/api/health`)
    console.log(`   - Chat endpoint: POST http://localhost:${port}/api/chat`)
    console.log(`   - Connected to Sanity Context MCP: ${config.sanity.mcpUrl}`)
  })
}
