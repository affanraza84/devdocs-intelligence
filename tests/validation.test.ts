import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MAX_MESSAGES_COUNT,
  MAX_PAYLOAD_BYTES,
  MAX_PROMPT_LENGTH,
  validateChatRequest,
  validatePayloadSize,
} from '../frontend/lib/agent/validation'

test('Validation: accepts a valid prompt', () => {
  const result = validateChatRequest({
    prompt: 'How does caching work in Next.js 15?',
  })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.prompt, 'How does caching work in Next.js 15?')
  }
})

test('Validation: accepts valid messages conversation history', () => {
  const result = validateChatRequest({
    messages: [
      { role: 'user', content: 'What is Next.js?' },
      { role: 'assistant', content: 'Next.js is a React framework.' },
      { role: 'user', content: 'What changed in Next.js 15?' },
    ],
  })
  assert.equal(result.success, true)
  if (result.success) {
    assert.equal(result.data.messages?.length, 3)
  }
})

test('Validation: rejects empty prompt and missing messages', () => {
  const result = validateChatRequest({ prompt: '' })
  assert.equal(result.success, false)
  if (!result.success) {
    assert.match(result.error, /Prompt cannot be empty|non-empty/i)
  }
})

test('Validation: rejects whitespace-only prompt', () => {
  const result = validateChatRequest({ prompt: '    \n\t  ' })
  assert.equal(result.success, false)
})

test('Validation: rejects prompt exceeding max length', () => {
  const longPrompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1)
  const result = validateChatRequest({ prompt: longPrompt })
  assert.equal(result.success, false)
  if (!result.success) {
    assert.match(result.error, /exceeds maximum length/i)
  }
})

test('Validation: rejects message content exceeding max length', () => {
  const longContent = 'x'.repeat(MAX_PROMPT_LENGTH + 10)
  const result = validateChatRequest({
    messages: [{ role: 'user', content: longContent }],
  })
  assert.equal(result.success, false)
  if (!result.success) {
    assert.match(result.error, /exceeds maximum length/i)
  }
})

test('Validation: rejects conversation exceeding 50 messages', () => {
  const messages = Array.from({ length: MAX_MESSAGES_COUNT + 1 }, (_, i) => ({
    role: 'user' as const,
    content: `Question ${i}`,
  }))
  const result = validateChatRequest({ messages })
  assert.equal(result.success, false)
  if (!result.success) {
    assert.match(result.error, /cannot exceed 50 messages/i)
  }
})

test('Validation: rejects invalid message role', () => {
  const result = validateChatRequest({
    messages: [{ role: 'hacker' as any, content: 'Hello' }],
  })
  assert.equal(result.success, false)
  if (!result.success) {
    assert.match(result.error, /Role must be "user", "assistant", or "system"/i)
  }
})

test('Validation: rejects non-object request bodies', () => {
  assert.equal(validateChatRequest(null).success, false)
  assert.equal(validateChatRequest('string payload').success, false)
  assert.equal(validateChatRequest(12345).success, false)
})

test('Validation: enforces maximum payload byte limit', () => {
  const normalPayload = JSON.stringify({ prompt: 'Normal query' })
  assert.equal(validatePayloadSize(normalPayload).valid, true)

  const hugePayload = 'b'.repeat(MAX_PAYLOAD_BYTES + 100)
  const sizeResult = validatePayloadSize(hugePayload)
  assert.equal(sizeResult.valid, false)
  assert.match(sizeResult.error || '', /exceeds maximum limit/i)
})
