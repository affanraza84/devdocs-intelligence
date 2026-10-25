import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AgentAbortError,
  AgentTimeoutError,
  GeminiRateLimitError,
  GeminiServiceUnavailableError,
  McpConnectionError,
  ValidationError,
  isTransientError,
  sanitizeError,
  stripSensitiveData,
} from '../frontend/lib/agent/errors'

test('Errors: stripSensitiveData removes Sanity tokens and Gemini keys', () => {
  const dirty =
    'Error connecting to https://api.sanity.io with token skW1dummyMOCKTOKENabcdef1234567890 and key AQ.dummyMOCKGEMINIKEYabcdef1234567890abcdef in /Users/affanraza/project'

  const cleaned = stripSensitiveData(dirty)
  assert.equal(cleaned.includes('skW1dummyMOCKTOKEN'), false)
  assert.equal(cleaned.includes('AQ.dummyMOCKGEMINIKEY'), false)
  assert.equal(cleaned.includes('affanraza'), false)
  assert.match(cleaned, /\[REDACTED_SANITY_TOKEN\]/)
  assert.match(cleaned, /\[REDACTED_GEMINI_KEY\]/)
  assert.match(cleaned, /\[REDACTED_USER\]/)
})

test('Errors: identifies transient vs permanent errors', () => {
  // Transient errors
  assert.equal(isTransientError(new GeminiRateLimitError()), true)
  assert.equal(isTransientError(new GeminiServiceUnavailableError()), true)
  assert.equal(isTransientError(new McpConnectionError()), true)
  assert.equal(isTransientError(new AgentTimeoutError()), true)
  assert.equal(isTransientError(new Error('fetch failed: ECONNRESET')), true)
  assert.equal(isTransientError(new Error('Rate limit exceeded 429')), true)

  // Permanent errors
  assert.equal(isTransientError(new ValidationError('Prompt is invalid')), false)
  assert.equal(isTransientError(new AgentAbortError()), false)
  const abortErr = new Error('The user aborted a request.')
  abortErr.name = 'AbortError'
  assert.equal(isTransientError(abortErr), false)
  assert.equal(isTransientError(new Error('Unauthorized: 401 token invalid')), false)
  assert.equal(isTransientError(new Error('Missing required environment variable')), false)
})

test('Errors: sanitizeError masks raw errors into clean user responses', () => {
  const gemini429 = new Error('Google Generative AI Resource Exhausted 429 Quota Exceeded')
  const s1 = sanitizeError(gemini429)
  assert.equal(s1.statusCode, 429)
  assert.match(s1.message, /Gemini API rate limit reached/i)
  assert.equal(s1.code, 'GEMINI_RATE_LIMIT')

  const sanityAuth = new Error('SANITY_API_READ_TOKEN skW12345678901234567890 is invalid')
  const s2 = sanitizeError(sanityAuth)
  assert.equal(s2.statusCode, 500)
  assert.match(s2.message, /Authentication with Sanity Context Knowledge Base failed/i)
  assert.equal(s2.message.includes('skW1'), false)

  const timeout = new Error('Gateway timed out after 30000ms')
  const s3 = sanitizeError(timeout)
  assert.equal(s3.statusCode, 504)
  assert.match(s3.message, /request timed out/i)

  const custom = new ValidationError('Please provide a prompt.')
  const s4 = sanitizeError(custom)
  assert.equal(s4.statusCode, 400)
  assert.equal(s4.code, 'VALIDATION_ERROR')
})
