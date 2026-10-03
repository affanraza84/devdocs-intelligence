import { NextResponse } from 'next/server'
import { getGeminiModel, getSanityMcpUrl } from '@/lib/config/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'DevDocs Intelligence',
    knowledgeBase: 'Next.js Developer Documentation Intelligence',
    mcpEndpoint: getSanityMcpUrl(),
    model: getGeminiModel(),
    timestamp: new Date().toISOString(),
  })
}
