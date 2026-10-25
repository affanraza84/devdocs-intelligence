import { orchestrateDevDocsAgent } from './orchestration'
import {
  formatPathToTitle,
  parseSourceType,
  extractSourcesFromToolCall,
  extractSourcesFromToolResult,
} from './sources'
import type { AgentExecutionOptions } from './types'

export {
  formatPathToTitle,
  parseSourceType,
  extractSourcesFromToolCall,
  extractSourcesFromToolResult,
}

export type AskDevDocsAgentOptions = AgentExecutionOptions

/**
 * High-level streaming entry point for DevDocs Intelligence Assistant.
 * Fully integrates managed MCP sessions, Gemini model streaming,
 * step limits, and cancellation propagation.
 */
export async function askDevDocsAgentStream(options: AskDevDocsAgentOptions) {
  return await orchestrateDevDocsAgent(options)
}
