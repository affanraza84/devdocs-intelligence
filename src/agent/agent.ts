import { orchestrateDevDocsAgent } from '../../frontend/lib/agent/orchestration'
import type { AgentExecutionOptions } from '../../frontend/lib/agent/types'

export type AskAgentOptions = AgentExecutionOptions

/**
 * Executes the DevDocs Intelligence agent with production-grade orchestration,
 * hosted Sanity Context MCP integration, and automatic client cleanup.
 */
export async function askDevDocsAgent(options: AskAgentOptions) {
  return await orchestrateDevDocsAgent(options)
}

export {
  formatPathToTitle,
  parseSourceType,
} from '../../frontend/lib/agent/sources'
