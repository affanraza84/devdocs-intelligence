import { stripSensitiveData } from './errors'

export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

export interface StructuredLog {
  timestamp: string
  level: LogLevel
  requestId: string
  event: string
  durationMs?: number
  metadata?: Record<string, unknown>
}

function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> {
  if (!metadata) return {}
  const clean: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(metadata)) {
    // Mask sensitive fields
    if (
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('key') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('auth')
    ) {
      clean[key] = '[REDACTED]'
      continue
    }

    // Do NOT log full user conversation or prompts by default
    if (key === 'prompt' && typeof val === 'string') {
      clean.promptLength = val.length
      clean.promptPreview = val.slice(0, 60) + (val.length > 60 ? '...' : '')
      continue
    }

    if (key === 'messages' && Array.isArray(val)) {
      clean.messageCount = val.length
      continue
    }

    if (typeof val === 'string') {
      clean[key] = stripSensitiveData(val)
    } else {
      clean[key] = val
    }
  }

  return clean
}

export function writeLog(
  level: LogLevel,
  requestId: string,
  event: string,
  metadata?: Record<string, unknown>,
  durationMs?: number
): void {
  const logEntry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    requestId,
    event,
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(metadata ? { metadata: sanitizeMetadata(metadata) } : {}),
  }

  const serialized = JSON.stringify(logEntry)

  switch (level) {
    case 'error':
      console.error(serialized)
      break
    case 'warn':
      console.warn(serialized)
      break
    case 'debug':
      if (process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true') {
        console.debug(serialized)
      }
      break
    default:
      console.log(serialized)
      break
  }
}

export class RequestLogger {
  private readonly requestId: string
  private readonly startTime: number

  constructor(requestId?: string) {
    this.requestId = requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`)
    this.startTime = Date.now()
  }

  public getRequestId(): string {
    return this.requestId
  }

  public getElapsedMs(): number {
    return Date.now() - this.startTime
  }

  public info(event: string, metadata?: Record<string, unknown>): void {
    writeLog('info', this.requestId, event, metadata, this.getElapsedMs())
  }

  public warn(event: string, metadata?: Record<string, unknown>): void {
    writeLog('warn', this.requestId, event, metadata, this.getElapsedMs())
  }

  public error(event: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const errMessage = error instanceof Error ? error.message : String(error || '')
    const merged = {
      ...metadata,
      errorMessage: stripSensitiveData(errMessage),
    }
    writeLog('error', this.requestId, event, merged, this.getElapsedMs())
  }
}
