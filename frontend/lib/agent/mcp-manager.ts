import { createMCPClient } from '@ai-sdk/mcp'
import { McpConnectionError } from './errors'
import { withRetry } from './retry'
import type { McpClientLike } from './types'

export interface McpManagerOptions {
  mcpUrl: string
  token: string
  timeoutMs?: number
  signal?: AbortSignal
  onLog?: (event: string, meta?: Record<string, unknown>) => void
}

export class ManagedMcpSession {
  private client: McpClientLike | null = null
  private isClosed = false
  private abortHandler?: () => void

  constructor(
    private readonly options: McpManagerOptions,
    private readonly clientFactory?: (options: McpManagerOptions) => Promise<McpClientLike>
  ) {}

  public async connect(): Promise<{ client: McpClientLike; tools: any }> {
    if (this.options.signal?.aborted) {
      throw new Error('Connection aborted before MCP client initialization.')
    }

    const timeoutMs =
      this.options.timeoutMs ||
      (process.env.SANITY_MCP_TIMEOUT_MS
        ? parseInt(process.env.SANITY_MCP_TIMEOUT_MS, 10)
        : 15_000)

    try {
      this.client = await withRetry(
        async () => {
          return await this.createClientWithTimeout(timeoutMs)
        },
        {
          maxRetries: 1,
          initialDelayMs: 400,
          signal: this.options.signal,
          onRetry: (attempt, err) => {
            this.options.onLog?.('mcp_connection_retry', {
              attempt,
              error: err instanceof Error ? err.message : String(err),
            })
          },
        }
      )

      // Bind abort listener to close client immediately if client disconnects
      if (this.options.signal) {
        this.abortHandler = () => {
          this.close().catch((err) => {
            void err
          })
        }
        this.options.signal.addEventListener('abort', this.abortHandler, { once: true })
      }

      // Retrieve tools with timeout
      const tools = await this.client.tools()

      return {
        client: this.client,
        tools,
      }
    } catch (err: unknown) {
      // Ensure any partially created client is closed
      await this.close()
      throw new McpConnectionError(
        'Failed to establish connection with Sanity Context Knowledge Base endpoint.',
        err
      )
    }
  }

  private async createClientWithTimeout(timeoutMs: number): Promise<McpClientLike> {
    let timer: NodeJS.Timeout | undefined

    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Sanity MCP connection timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      if (this.options.signal) {
        this.options.signal.addEventListener(
          'abort',
          () => {
            if (timer) clearTimeout(timer)
            reject(new Error('Sanity MCP connection aborted'))
          },
          { once: true }
        )
      }
    })

    const connectPromise = this.clientFactory
      ? this.clientFactory(this.options)
      : createMCPClient({
          transport: {
            type: 'http',
            url: this.options.mcpUrl,
            headers: {
              Authorization: `Bearer ${this.options.token}`,
            },
          },
        })

    try {
      return await Promise.race([connectPromise, timeoutPromise])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  public async close(): Promise<void> {
    if (this.isClosed) return
    this.isClosed = true

    if (this.options.signal && this.abortHandler) {
      this.options.signal.removeEventListener('abort', this.abortHandler)
    }

    if (this.client) {
      const target = this.client
      this.client = null
      try {
        await target.close()
      } catch {
        // Safe ignore on already closed or broken transport
      }
    }
  }

  public getClient(): McpClientLike | null {
    return this.client
  }

  public isClientClosed(): boolean {
    return this.isClosed
  }
}
