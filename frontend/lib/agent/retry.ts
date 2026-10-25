import { isTransientError } from './errors'

export interface RetryOptions {
  maxRetries?: number
  initialDelayMs?: number
  backoffFactor?: number
  maxDelayMs?: number
  signal?: AbortSignal
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void
}

/**
 * Safely executes an async operation with exponential backoff retry for transient errors.
 * Never retries permanent errors or operations whose signal was aborted.
 */
export async function withRetry<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2
  const initialDelay = options.initialDelayMs ?? 500
  const backoffFactor = options.backoffFactor ?? 2
  const maxDelay = options.maxDelayMs ?? 5000
  const signal = options.signal

  let attempt = 0

  while (true) {
    if (signal?.aborted) {
      throw new Error('Operation aborted prior to execution')
    }

    try {
      return await operation(attempt)
    } catch (err: unknown) {
      attempt++

      if (attempt > maxRetries || !isTransientError(err) || signal?.aborted) {
        throw err
      }

      // Calculate exponential backoff with jitter
      const rawDelay = initialDelay * Math.pow(backoffFactor, attempt - 1)
      const jitter = Math.random() * 100
      const delay = Math.min(rawDelay + jitter, maxDelay)

      options.onRetry?.(attempt, err, delay)

      // Wait for delay or abort
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          if (signal) {
            signal.removeEventListener('abort', onAbort)
          }
          resolve()
        }, delay)

        function onAbort() {
          clearTimeout(timer)
          reject(new Error('Operation aborted during retry backoff'))
        }

        if (signal) {
          signal.addEventListener('abort', onAbort, { once: true })
        }
      })
    }
  }
}
