import { z } from 'zod'
import type { ChatRequestBody } from './types'

export const MAX_PROMPT_LENGTH = 4000
export const MAX_MESSAGES_COUNT = 50
export const MAX_PAYLOAD_BYTES = 64 * 1024 // 64 KB

export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system'], {
    message: 'Role must be "user", "assistant", or "system"',
  }),
  content: z
    .string({ message: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(
      MAX_PROMPT_LENGTH,
      `Message content exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
    ),
})

export const ChatRequestSchema = z
  .object({
    prompt: z
      .string()
      .trim()
      .min(1, 'Prompt cannot be empty')
      .max(
        MAX_PROMPT_LENGTH,
        `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`
      )
      .optional(),
    messages: z
      .array(ChatMessageSchema)
      .max(
        MAX_MESSAGES_COUNT,
        `Conversation history cannot exceed ${MAX_MESSAGES_COUNT} messages`
      )
      .optional(),
  })
  .refine(
    (data) => {
      const hasPrompt = typeof data.prompt === 'string' && data.prompt.length > 0
      const hasMessages = Array.isArray(data.messages) && data.messages.length > 0
      return hasPrompt || hasMessages
    },
    {
      message: 'Either a non-empty "prompt" or "messages" array must be provided.',
      path: ['prompt'],
    }
  )

export interface ValidationSuccess {
  success: true
  data: ChatRequestBody
}

export interface ValidationFailure {
  success: false
  error: string
  details?: Record<string, string[]>
}

export type ValidationResult = ValidationSuccess | ValidationFailure

/**
 * Validates the parsed JSON body against the chat request schema.
 */
export function validateChatRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return {
      success: false,
      error: 'Invalid request body: Expected a JSON object.',
    }
  }

  const result = ChatRequestSchema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues
    const firstMessage = issues[0]?.message || 'Invalid chat request payload.'
    const details: Record<string, string[]> = {}

    for (const issue of issues) {
      const key = issue.path.join('.') || 'root'
      if (!details[key]) details[key] = []
      details[key].push(issue.message)
    }

    return {
      success: false,
      error: firstMessage,
      details,
    }
  }

  return {
    success: true,
    data: result.data as ChatRequestBody,
  }
}

/**
 * Validates that raw payload string or buffer does not exceed the allowed byte limit.
 */
export function validatePayloadSize(
  rawContent: string | Buffer | null | undefined
): { valid: boolean; error?: string } {
  if (!rawContent) return { valid: true }

  const size =
    typeof rawContent === 'string'
      ? Buffer.byteLength(rawContent, 'utf8')
      : rawContent.length

  if (size > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      error: `Payload size (${size} bytes) exceeds maximum limit of ${MAX_PAYLOAD_BYTES} bytes.`,
    }
  }

  return { valid: true }
}
