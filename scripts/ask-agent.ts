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

  try {
    const { streamResult } = await askDevDocsAgent({
      prompt,
      onStepFinish: (step) => {
        if (step.toolCalls && step.toolCalls.length > 0) {
          for (const tc of step.toolCalls) {
            console.log(`  🔧 [MCP Tool Call] ${tc.toolName}(${JSON.stringify(tc.args || {})})`)
          }
        }
      },
    })

    console.log('\n--- Agent Answer ---\n')
    for await (const chunk of streamResult.textStream) {
      process.stdout.write(chunk)
    }
    console.log('\n\n===========================================================')
    console.log('✨ Response streaming completed.')
    console.log('===========================================================')
  } catch (err: any) {
    console.error('\n❌ Agent execution failed:', err.message)
    process.exit(1)
  }
}

main()
