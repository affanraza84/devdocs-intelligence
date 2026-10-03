import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Validates that all required environment variables are present and non-empty.
 * Throws an error mentioning only the variable names (never values) if any are missing.
 */
export function validateEnv(): void {
  const missing: string[] = []

  const sanityToken = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_READ_TOKEN
  if (!sanityToken || sanityToken.trim() === '') {
    missing.push('SANITY_API_READ_TOKEN')
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!geminiKey || geminiKey.trim() === '') {
    missing.push('GEMINI_API_KEY')
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. Please set them in your environment or .env file.`
    )
  }
}

export function getSanityReadToken(): string {
  const envToken = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_READ_TOKEN
  if (envToken && envToken.trim() !== '') {
    return envToken.trim()
  }

  throw new Error('SANITY_API_READ_TOKEN is required but was not provided in the environment.')
}

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (apiKey && apiKey.trim() !== '') {
    return apiKey.trim()
  }

  throw new Error('GEMINI_API_KEY is required but was not provided in the environment.')
}

export const config = {
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID || '0ovd9f2s',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: process.env.SANITY_API_VERSION || '2026-01-01',
    mcpUrl:
      process.env.SANITY_CONTEXT_MCP_URL ||
      'https://api.sanity.io/v1/context/organizations/oyl832pn4/mcp/devdocs-gemini-agent',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
  },
}
