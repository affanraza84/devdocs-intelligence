import assert from 'node:assert/strict'
import test from 'node:test'
import {
  GeminiServiceUnavailableError,
  ValidationError,
} from '../frontend/lib/agent/errors'
import { withRetry } from '../frontend/lib/agent/retry'

test('Retry: executes successfully without retrying on first attempt', async () => {
  let callCount = 0
  const result = await withRetry(async () => {
    callCount++
    return 'ok'
  })
  assert.equal(result, 'ok')
  assert.equal(callCount, 1)
})

test('Retry: retries transient errors and succeeds when cleared', async () => {
  let callCount = 0
  const retryLog: number[] = []

  const result = await withRetry(
    async (attempt) => {
      callCount++
      if (attempt === 0) {
        throw new GeminiServiceUnavailableError('Temporary high demand')
      }
      return 'recovered'
    },
    {
      maxRetries: 2,
      initialDelayMs: 20,
      onRetry: (attempt) => {
        retryLog.push(attempt)
      },
    }
  )

  assert.equal(result, 'recovered')
  assert.equal(callCount, 2)
  assert.deepEqual(retryLog, [1])
})

test('Retry: refuses to retry permanent errors', async () => {
  let callCount = 0

  await assert.rejects(
    async () => {
      await withRetry(
        async () => {
          callCount++
          throw new ValidationError('Malformed JSON payload')
        },
        { maxRetries: 3, initialDelayMs: 10 }
      )
    },
    (err: any) => {
      assert.equal(err.name, 'ValidationError')
      return true
    }
  )

  assert.equal(callCount, 1) // Must have stopped after first attempt
})

test('Retry: respects AbortSignal during backoff wait', async () => {
  const controller = new AbortController()

  // Trigger abort shortly after start
  setTimeout(() => controller.abort(), 15)

  await assert.rejects(
    async () => {
      await withRetry(
        async () => {
          throw new GeminiServiceUnavailableError('Temporary 503')
        },
        {
          maxRetries: 3,
          initialDelayMs: 100,
          signal: controller.signal,
        }
      )
    },
    /aborted/i
  )
})
