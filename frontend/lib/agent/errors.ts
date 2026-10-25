import type { SanitizedError } from './types'

export class DevDocsError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isTransient: boolean

  constructor(
    message: string,
    options: {
      code: string
      statusCode?: number
      isTransient?: boolean
      cause?: unknown
    }
  ) {
    super(message)
    this.name = 'DevDocsError'
    this.code = options.code
    this.statusCode = options.statusCode ?? 500
    this.isTransient = options.isTransient ?? false
    if (options.cause) {
      this.cause = options.cause
    }
  }
}

export class ValidationError extends DevDocsError {
  constructor(message: string, cause?: unknown) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      isTransient: false,
      cause,
    })
    this.name = 'ValidationError'
  }
}

export class RateLimitError extends DevDocsError {
  constructor(
    message = 'Too many requests. Please wait a moment before trying again.',
    cause?: unknown
  ) {
    super(message, {
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      isTransient: true,
      cause,
    })
    this.name = 'RateLimitError'
  }
}

export class McpConnectionError extends DevDocsError {
  constructor(
    message = 'Failed to connect to the Sanity Context Knowledge Base endpoint.',
    cause?: unknown
  ) {
    super(message, {
      code: 'MCP_CONNECTION_ERROR',
      statusCode: 503,
      isTransient: true,
      cause,
    })
    this.name = 'McpConnectionError'
  }
}

export class GeminiRateLimitError extends DevDocsError {
  constructor(
    message = 'Gemini model rate limit reached. Please wait 15-30 seconds before retrying.',
    cause?: unknown
  ) {
    super(message, {
      code: 'GEMINI_RATE_LIMIT',
      statusCode: 429,
      isTransient: true,
      cause,
    })
    this.name = 'GeminiRateLimitError'
  }
}

export class GeminiServiceUnavailableError extends DevDocsError {
  constructor(
    message = 'The AI model service is currently experiencing high demand. Please try again shortly.',
    cause?: unknown
  ) {
    super(message, {
      code: 'GEMINI_UNAVAILABLE',
      statusCode: 503,
      isTransient: true,
      cause,
    })
    this.name = 'GeminiServiceUnavailableError'
  }
}

export class AgentTimeoutError extends DevDocsError {
  constructor(
    message = 'The documentation request timed out while retrieving content.',
    cause?: unknown
  ) {
    super(message, {
      code: 'AGENT_TIMEOUT',
      statusCode: 504,
      isTransient: true,
      cause,
    })
    this.name = 'AgentTimeoutError'
  }
}

export class AgentAbortError extends DevDocsError {
  constructor(message = 'The request was cancelled by the client.', cause?: unknown) {
    super(message, {
      code: 'AGENT_ABORTED',
      statusCode: 499,
      isTransient: false,
      cause,
    })
    this.name = 'AgentAbortError'
  }
}

/**
 * Determines whether an error is transient (safe to retry) or permanent (never retry).
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof DevDocsError) {
    return error.isTransient
  }

  if (!error) return false

  const rawMessage = error instanceof Error ? error.message : String(error)
  const lower = rawMessage.toLowerCase()

  // Permanent errors - DO NOT RETRY
  if (
    lower.includes('validation') ||
    lower.includes('unauthorized') ||
    lower.includes('forbidden') ||
    lower.includes('missing required') ||
    lower.includes('api_key') ||
    lower.includes('read_token') ||
    lower.includes('invalid json') ||
    lower.includes('abort') ||
    (error as any)?.name === 'AbortError'
  ) {
    return false
  }

  // Transient network / rate limit / unavailable errors
  if (
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted') ||
    lower.includes('429') ||
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('econnreset') ||
    lower.includes('econnrefused') ||
    lower.includes('etimedout') ||
    lower.includes('fetch failed')
  ) {
    return true
  }

  return false
}

/**
 * Strips secret tokens, keys, URLs with tokens, and file system paths from any string.
 */
export function stripSensitiveData(text: string): string {
  if (!text) return ''

  return text
    // Strip Sanity tokens
    .replace(/sk[A-Za-z0-9_-]{20,}/g, '[REDACTED_SANITY_TOKEN]')
    // Strip Gemini / Google keys
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GEMINI_KEY]')
    .replace(/AQ\.[A-Za-z0-9_-]{40,}/g, '[REDACTED_GEMINI_KEY]')
    // Strip Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED]')
    // Strip absolute home paths
    .replace(/\/Users\/[^\s/]+/g, '/[REDACTED_USER]')
    .replace(/\/home\/[^\s/]+/g, '/[REDACTED_USER]')
}

/**
 * Returns a stable, sanitized error response suitable for sending to clients.
 * Never leaks API keys, Sanity tokens, stack traces, or internal URLs.
 */
export function sanitizeError(error: unknown): SanitizedError {
  if (error instanceof DevDocsError) {
    return {
      message: stripSensitiveData(error.message),
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return {
      message: 'The request was aborted.',
      code: 'REQUEST_ABORTED',
      statusCode: 499,
    }
  }

  const rawMessage = error instanceof Error ? error.message : String(error)
  const lower = rawMessage.toLowerCase()

  // Match known failure modes to sanitized user-facing messages
  if (
    lower.includes('quota') ||
    lower.includes('429') ||
    lower.includes('resource_exhausted')
  ) {
    return {
      message: 'Gemini API rate limit reached. Please wait 15-30 seconds before retrying.',
      code: 'GEMINI_RATE_LIMIT',
      statusCode: 429,
    }
  }

  if (
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable')
  ) {
    return {
      message:
        'The Gemini model is experiencing high demand. Please retry your question in a few moments.',
      code: 'GEMINI_UNAVAILABLE',
      statusCode: 503,
    }
  }

  if (
    lower.includes('sanity_api_read_token') ||
    lower.includes('sanity_read_token') ||
    lower.includes('unauthorized')
  ) {
    return {
      message: 'Authentication with Sanity Context Knowledge Base failed. Please verify server token.',
      code: 'SANITY_AUTH_ERROR',
      statusCode: 500,
    }
  }

  if (lower.includes('gemini_api_key')) {
    return {
      message: 'Gemini API key is missing or invalid on the server.',
      code: 'GEMINI_AUTH_ERROR',
      statusCode: 500,
    }
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('econnrefused') ||
    lower.includes('context endpoint') ||
    lower.includes('failed to connect')
  ) {
    return {
      message:
        'Failed to connect to the Sanity Context MCP endpoint. Please check service connectivity.',
      code: 'MCP_UNREACHABLE',
      statusCode: 503,
    }
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return {
      message: 'The request timed out while contacting upstream documentation services.',
      code: 'REQUEST_TIMEOUT',
      statusCode: 504,
    }
  }

  // Generic fallback with sanitized text
  return {
    message: 'An error occurred while processing your request. Please try again.',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }
}
