import type { GroundedSource, SourceType } from './types'

/**
 * Categorizes a document path into a specific SourceType based on path patterns.
 */
export function parseSourceType(path: string): SourceType {
  const p = (path || '').toLowerCase()
  if (p.includes('upgrad') || p.includes('migration')) return 'migrationGuide'
  if (
    p.includes('route_handlers') ||
    p.includes('server_actions') ||
    p.includes('api') ||
    p.includes('reference')
  ) {
    return 'apiReference'
  }
  if (p.includes('changelog') || p.includes('release')) return 'releaseNote'
  return 'documentation'
}

/**
 * Converts a raw Sanity context path or slug to a readable document title.
 */
export function formatPathToTitle(path: string): string {
  if (!path) return 'Documentation'
  const segments = path.split('/')
  const last = segments[segments.length - 1] || path
  return last
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * Extracts version indicator (e.g., 14.x, 15.x, 16.x) from path or title if present.
 */
export function extractVersionFromPath(path: string): string | undefined {
  const p = (path || '').toLowerCase()
  if (p.includes('15') || p.includes('next-15')) return '15.x'
  if (p.includes('14') || p.includes('next-14')) return '14.x'
  if (p.includes('16') || p.includes('next-16')) return '16.x'
  return undefined
}

/**
 * Normalizes tool invocation arguments to discover grounded documentation paths.
 */
export function extractSourcesFromToolCall(
  toolName: string,
  args: Record<string, unknown> | undefined,
  seenPaths: Set<string>
): GroundedSource[] {
  if (!args || typeof args !== 'object') return []

  const sources: GroundedSource[] = []

  if (toolName === 'knowledge_base_read' || toolName === 'knowledge_base_search') {
    const rawPaths: unknown =
      (args as any).paths ||
      (args as any).entry_paths ||
      (args as any).path ||
      (args as any).query

    const paths: string[] = []
    if (Array.isArray(rawPaths)) {
      for (const item of rawPaths) {
        if (typeof item === 'string') paths.push(item)
      }
    } else if (typeof rawPaths === 'string' && toolName === 'knowledge_base_read') {
      paths.push(rawPaths)
    }

    for (const path of paths) {
      const cleanPath = path.trim()
      if (!cleanPath || seenPaths.has(cleanPath)) continue

      seenPaths.add(cleanPath)
      const title = formatPathToTitle(cleanPath)
      const type = parseSourceType(cleanPath)
      const version = extractVersionFromPath(cleanPath)

      sources.push({
        id: `source-${cleanPath.replace(/[/_#:]/g, '-')}`,
        title,
        path: cleanPath,
        type,
        version,
      })
    }
  }

  return sources
}

/**
 * Extracts grounded sources from MCP tool results (e.g., document headings and snippets).
 */
export function extractSourcesFromToolResult(
  toolName: string,
  result: unknown,
  seenIds: Set<string>
): GroundedSource[] {
  if (!result || typeof result !== 'object') return []

  const sources: GroundedSource[] = []
  const res = result as { content?: Array<{ type?: string; text?: string }> }

  if (Array.isArray(res.content)) {
    for (const item of res.content) {
      if (item && item.type === 'text' && typeof item.text === 'string') {
        const text = item.text
        const firstHeadingMatch = text.match(/^#\s+(.+)$/m)
        if (firstHeadingMatch && firstHeadingMatch[1]) {
          const heading = firstHeadingMatch[1].trim()
          const sourceId = `heading-${heading.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

          if (!seenIds.has(sourceId)) {
            seenIds.add(sourceId)
            sources.push({
              id: sourceId,
              title: heading,
              path: 'Sanity Knowledge Base (Next.js)',
              type: parseSourceType(heading),
              snippet: text.length > 200 ? text.slice(0, 200).trim() + '...' : text.trim(),
              version: extractVersionFromPath(heading) || extractVersionFromPath(text),
            })
          }
        }
      }
    }
  }

  return sources
}
