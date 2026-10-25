import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractSourcesFromToolCall,
  extractSourcesFromToolResult,
  extractVersionFromPath,
  formatPathToTitle,
  parseSourceType,
} from '../frontend/lib/agent/sources'

test('Source Normalizer: categorizes source types accurately', () => {
  assert.equal(parseSourceType('/docs/upgrading/version-15'), 'migrationGuide')
  assert.equal(parseSourceType('/docs/migration/app-router'), 'migrationGuide')
  assert.equal(parseSourceType('/api/route_handlers/caching'), 'apiReference')
  assert.equal(parseSourceType('/docs/api/server_actions'), 'apiReference')
  assert.equal(parseSourceType('/releases/v15-0-0-changelog'), 'releaseNote')
  assert.equal(parseSourceType('/docs/getting-started/overview'), 'documentation')
  assert.equal(parseSourceType(''), 'documentation')
})

test('Source Normalizer: formats raw paths to readable titles', () => {
  assert.equal(
    formatPathToTitle('app/building-your-application/routing/route_handlers'),
    'Route Handlers'
  )
  assert.equal(formatPathToTitle('caching-in-nextjs-15'), 'Caching In Nextjs 15')
  assert.equal(formatPathToTitle(''), 'Documentation')
})

test('Source Normalizer: extracts version indicators', () => {
  assert.equal(extractVersionFromPath('/next-15/caching'), '15.x')
  assert.equal(extractVersionFromPath('/upgrading/upgrade-guide-next-14'), '14.x')
  assert.equal(extractVersionFromPath('/next-16/canary'), '16.x')
  assert.equal(extractVersionFromPath('/general/intro'), undefined)
})

test('Source Normalizer: extracts and deduplicates sources from tool call arguments', () => {
  const seen = new Set<string>()

  const toolCall1 = extractSourcesFromToolCall(
    'knowledge_base_read',
    { paths: ['/docs/app/routing/route_handlers', '/docs/upgrading/next-15'] },
    seen
  )

  assert.equal(toolCall1.length, 2)
  assert.equal(toolCall1[0]?.title, 'Route Handlers')
  assert.equal(toolCall1[0]?.type, 'apiReference')
  assert.equal(toolCall1[1]?.version, '15.x')
  assert.equal(toolCall1[1]?.type, 'migrationGuide')

  // Calling again with duplicate path should be skipped
  const toolCall2 = extractSourcesFromToolCall(
    'knowledge_base_read',
    { paths: ['/docs/app/routing/route_handlers'] },
    seen
  )
  assert.equal(toolCall2.length, 0)
})

test('Source Normalizer: extracts headings and snippets from tool results', () => {
  const seen = new Set<string>()

  const mockResult = {
    content: [
      {
        type: 'text',
        text: '# Next.js 15 Caching Default Changes\nIn Next.js 15, fetch requests and GET handlers are uncached by default.',
      },
    ],
  }

  const sources = extractSourcesFromToolResult('knowledge_base_read', mockResult, seen)

  assert.equal(sources.length, 1)
  assert.equal(sources[0]?.title, 'Next.js 15 Caching Default Changes')
  assert.equal(sources[0]?.version, '15.x')
  assert.match(sources[0]?.snippet || '', /uncached by default/i)

  // Duplicate extraction should be prevented
  const duplicate = extractSourcesFromToolResult('knowledge_base_read', mockResult, seen)
  assert.equal(duplicate.length, 0)
})
