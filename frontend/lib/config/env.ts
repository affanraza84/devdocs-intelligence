import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

export function validateServerEnv(): void {
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
      `Missing required server environment variable(s): ${missing.join(', ')}. Please verify your server environment configuration.`
    )
  }
}

export function getSanityReadToken(): string {
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_READ_TOKEN
  if (token && token.trim() !== '') {
    return token.trim()
  }
  throw new Error('SANITY_API_READ_TOKEN is missing in server environment.')
}

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (key && key.trim() !== '') {
    return key.trim()
  }
  throw new Error('GEMINI_API_KEY is missing in server environment.')
}

export function getSanityMcpUrl(): string {
  return (
    process.env.SANITY_CONTEXT_MCP_URL ||
    'https://api.sanity.io/v1/context/organizations/oyl832pn4/mcp/devdocs-gemini-agent'
  )
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.6-flash'
}

export const serverConfig = {
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID || '0ovd9f2s',
    dataset: process.env.SANITY_DATASET || 'production',
    mcpUrl: getSanityMcpUrl(),
  },
  agent: {
    model: getGeminiModel(),
  },
}
