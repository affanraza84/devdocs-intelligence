import * as http from 'node:http'
import { askDevDocsAgent } from './agent'
import { config, validateEnv } from './config'

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function createAgentServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    setCorsHeaders(res)

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    // Health check endpoint
    if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/api/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'ok',
          name: 'DevDocs Intelligence AI Agent Server',
          mcpEndpoint: config.sanity.mcpUrl,
          model: 'gemini-2.5-flash',
        })
      )
      return
    }

    // Chat endpoint
    if (req.method === 'POST' && (url.pathname === '/api/chat' || url.pathname === '/chat')) {
      let body = ''
      req.on('data', (chunk) => {
        body += chunk
      })

      req.on('end', async () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          const prompt = parsed.prompt || (parsed.messages && parsed.messages[parsed.messages.length - 1]?.content)

          if (!prompt || typeof prompt !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing "prompt" string in request body' }))
            return
          }

          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
          })

          const { streamResult } = await askDevDocsAgent({ prompt })

          for await (const textPart of streamResult.textStream) {
            res.write(textPart)
          }

          res.end()
        } catch (err: any) {
          console.error('[Agent Server Error]', err)
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message || 'Internal Agent Error' }))
          } else {
            res.write(`\n\n[Error: ${err.message}]`)
            res.end()
          }
        }
      })
      return
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Not found. Available endpoints: GET /api/health, POST /api/chat' }))
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
