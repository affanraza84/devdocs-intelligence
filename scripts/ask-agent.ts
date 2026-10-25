import { askDevDocsAgent } from '../src/agent/agent'

async function main() {
  const query = process.argv.slice(2).join(' ').trim()
  const prompt =
    query ||
    'In Next.js 15, what changed with GET Route Handlers caching by default, and how was it configured in Next.js 14?'

  console.log('===========================================================')
  console.log('🤖 DevDocs Intelligence Agent CLI')
  console.log('===========================================================')
  console.log(`💬 Question: "${prompt}"\n`)
  console.log('⏳ Connecting to Sanity Context MCP and querying Gemini...\n')

  const abortController = new AbortController()

  let isExiting = false
  process.on('SIGINT', () => {
    if (isExiting) process.exit(1)
    isExiting = true
    console.log('\n🛑 Cancellation requested. Cleaning up MCP session...')
    abortController.abort()
  })

  try {
    const { streamResult, cleanup } = await askDevDocsAgent({
      prompt,
      signal: abortController.signal,
      onStepFinish: (step: any) => {
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const tc of step.toolCalls) {
            console.log(`  🔧 [MCP Tool Call] ${tc.toolName}(${JSON.stringify(tc.args || {})})`)
          }
        }
      },
    })

    console.log('\n--- Agent Answer ---\n')
    try {
      for await (const chunk of streamResult.textStream) {
        if (abortController.signal.aborted) break
        process.stdout.write(chunk)
      }
    } finally {
      await cleanup()
    }

    if (!abortController.signal.aborted) {
      console.log('\n\n===========================================================')
      console.log('✨ Response streaming completed.')
      console.log('===========================================================')
    }
  } catch (err: any) {
    if (abortController.signal.aborted) {
      console.log('\nOperation cleanly aborted by user.')
      process.exit(0)
    }
    console.error('\n❌ Agent execution failed:', err.message)
    process.exit(1)
  }
}

main()
