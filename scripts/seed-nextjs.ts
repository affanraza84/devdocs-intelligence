import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import {
  documentationData,
  apiReferenceData,
  migrationGuideData,
  releaseNoteData,
  linesToPortableText,
} from './data/corpus'

// Load environment variables
dotenv.config()

interface DocumentSummary {
  _id: string
  _type: string
  title?: string
  name?: string
  refCount: number
}

async function getAuthToken(): Promise<string> {
  const envToken = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
  if (envToken && envToken.trim() !== '') {
    return envToken.trim()
  }

  // Graceful fallback to local Sanity CLI session if authenticated
  try {
    const cliConfigPath = path.join(os.homedir(), '.config', 'sanity', 'config.json')
    if (fs.existsSync(cliConfigPath)) {
      const cliConfig = JSON.parse(fs.readFileSync(cliConfigPath, 'utf8'))
      if (cliConfig.authToken) {
        console.log('ℹ️  Using authenticated Sanity CLI token from ~/.config/sanity/config.json')
        return cliConfig.authToken
      }
    }
  } catch {
    // Ignore error reading CLI config
  }

  const projectId = process.env.SANITY_PROJECT_ID || '0ovd9f2s'
  console.error(`
❌ Error: No Sanity authentication write token found!
Please provide a write token using one of the following methods:

1. Create or open your .env file in the devdocs-intelligence root:
   SANITY_WRITE_TOKEN=your_token_here

2. Or run "npx sanity login" to authenticate the local CLI.

To generate a new token manually in Sanity Management:
1. Navigate to: https://sanity.io/manage/project/${projectId}/api#tokens
2. Click "Add API token"
3. Select "Editor" or "Administrator" permissions
4. Paste the token into your .env file
`)
  process.exit(1)
  throw new Error('No Sanity write token available')
}

async function main() {
  console.log('===========================================================')
  console.log('🚀 Next.js Curated Documentation Ingestion Pipeline')
  console.log('   Target Project: DevDocs Intelligence')
  console.log('===========================================================\n')

  const projectId = process.env.SANITY_PROJECT_ID || '0ovd9f2s'
  const dataset = process.env.SANITY_DATASET || 'production'
  const apiVersion = process.env.SANITY_API_VERSION || '2026-01-01'
  const token = await getAuthToken()

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })

  // -------------------------------------------------------------
  // DISCOVERY
  // -------------------------------------------------------------
  console.log('📦 Discovery Phase: Scanning Curated Corpus...')
  console.log(`   - Documentation records:   ${documentationData.length}`)
  console.log(`   - API Reference records:   ${apiReferenceData.length}`)
  console.log(`   - Migration Guide records: ${migrationGuideData.length}`)
  console.log(`   - Release Note records:    ${releaseNoteData.length}`)
  const totalDiscovered =
    documentationData.length +
    apiReferenceData.length +
    migrationGuideData.length +
    releaseNoteData.length
  console.log(`   Total documents discovered: ${totalDiscovered}\n`)

  // Check pre-existing documents in dataset to distinguish created vs updated
  const existingIds = new Set<string>(
    await client.fetch<string[]>('*[_type in ["documentation", "apiReference", "migrationGuide", "releaseNote"]]._id')
  )

  let createdCount = 0
  let updatedCount = 0
  let failureCount = 0

  // -------------------------------------------------------------
  // PHASE A: Ingest Base Documents Without Unresolved References
  // -------------------------------------------------------------
  console.log('--- PHASE A: Creating / Updating Base Documents (Without References) ---')

  // A.1: Documentation Documents
  for (const doc of documentationData) {
    const isUpdate = existingIds.has(doc.id)
    try {
      await client.createOrReplace({
        _id: doc.id,
        _type: 'documentation',
        title: doc.title,
        slug: { _type: 'slug', current: doc.slug },
        product: doc.product,
        version: doc.version,
        category: doc.category,
        summary: doc.summary,
        content: linesToPortableText(doc.contentLines, 'doc'),
        tags: doc.tags,
        sourceTitle: doc.sourceTitle,
        sourceUrl: doc.sourceUrl,
        lastUpdated: doc.lastUpdated,
      })
      if (isUpdate) updatedCount++
      else createdCount++
      console.log(`  ✓ [documentation] ${doc.id} (${isUpdate ? 'updated' : 'created'})`)
    } catch (err: any) {
      failureCount++
      console.error(`  ✗ [documentation] Failed ${doc.id}: ${err.message}`)
    }
  }

  // A.2: API Reference Documents
  for (const api of apiReferenceData) {
    const isUpdate = existingIds.has(api.id)
    try {
      await client.createOrReplace({
        _id: api.id,
        _type: 'apiReference',
        name: api.name,
        slug: { _type: 'slug', current: api.slug },
        product: api.product,
        version: api.version,
        apiType: api.apiType,
        description: api.description,
        parameters: api.parameters.map((p, idx) => ({
          _key: `param_${idx}`,
          name: p.name,
          type: p.type,
          description: p.description,
          required: p.required,
        })),
        example: api.example,
        limitations: api.limitations,
        sourceTitle: api.sourceTitle,
        sourceUrl: api.sourceUrl,
      })
      if (isUpdate) updatedCount++
      else createdCount++
      console.log(`  ✓ [apiReference] ${api.id} (${isUpdate ? 'updated' : 'created'})`)
    } catch (err: any) {
      failureCount++
      console.error(`  ✗ [apiReference] Failed ${api.id}: ${err.message}`)
    }
  }

  // A.3: Migration Guide Documents
  for (const mig of migrationGuideData) {
    const isUpdate = existingIds.has(mig.id)
    try {
      await client.createOrReplace({
        _id: mig.id,
        _type: 'migrationGuide',
        title: mig.title,
        slug: { _type: 'slug', current: mig.slug },
        product: mig.product,
        fromVersion: mig.fromVersion,
        toVersion: mig.toVersion,
        summary: mig.summary,
        breakingChanges: mig.breakingChanges,
        migrationSteps: linesToPortableText(mig.migrationStepsLines, 'mig'),
        affectedFeatures: mig.affectedFeatures,
        sourceTitle: mig.sourceTitle,
        sourceUrl: mig.sourceUrl,
      })
      if (isUpdate) updatedCount++
      else createdCount++
      console.log(`  ✓ [migrationGuide] ${mig.id} (${isUpdate ? 'updated' : 'created'})`)
    } catch (err: any) {
      failureCount++
      console.error(`  ✗ [migrationGuide] Failed ${mig.id}: ${err.message}`)
    }
  }

  // A.4: Release Note Documents
  for (const rel of releaseNoteData) {
    const isUpdate = existingIds.has(rel.id)
    try {
      await client.createOrReplace({
        _id: rel.id,
        _type: 'releaseNote',
        title: rel.title,
        version: rel.version,
        product: rel.product,
        releaseDate: rel.releaseDate,
        summary: rel.summary,
        changes: linesToPortableText(rel.changesLines, 'rel'),
        breakingChanges: rel.breakingChanges,
        deprecatedFeatures: rel.deprecatedFeatures,
        affectedFeatures: rel.affectedFeatures,
        sourceTitle: rel.sourceTitle,
        sourceUrl: rel.sourceUrl,
      })
      if (isUpdate) updatedCount++
      else createdCount++
      console.log(`  ✓ [releaseNote] ${rel.id} (${isUpdate ? 'updated' : 'created'})`)
    } catch (err: any) {
      failureCount++
      console.error(`  ✗ [releaseNote] Failed ${rel.id}: ${err.message}`)
    }
  }

  console.log(`\nPhase A Completed: ${createdCount} created, ${updatedCount} updated, ${failureCount} failures.\n`)

  // -------------------------------------------------------------
  // PHASE B: Build ID and Slug Resolution Mapping
  // -------------------------------------------------------------
  console.log('--- PHASE B: Building Identifier and Slug Resolution Map ---')
  const lookupMap = new Map<string, string>()

  // Map deterministic IDs directly
  for (const doc of documentationData) {
    lookupMap.set(doc.id, doc.id)
    lookupMap.set(doc.slug, doc.id)
  }
  for (const api of apiReferenceData) {
    lookupMap.set(api.id, api.id)
    lookupMap.set(api.slug, api.id)
  }
  for (const mig of migrationGuideData) {
    lookupMap.set(mig.id, mig.id)
    lookupMap.set(mig.slug, mig.id)
  }
  for (const rel of releaseNoteData) {
    lookupMap.set(rel.id, rel.id)
  }

  console.log(`  ✓ Resolution map constructed with ${lookupMap.size} routing entries.\n`)

  // -------------------------------------------------------------
  // PHASE C: Patch and Resolve Cross-Document Relationships
  // -------------------------------------------------------------
  console.log('--- PHASE C: Resolving and Patching Cross-Document Relationships ---')
  let totalReferencesResolved = 0

  function createRefList(keys: string[], fieldName: string, sourceId: string) {
    const refs: Array<{ _type: 'reference'; _ref: string; _key: string }> = []
    for (const key of keys) {
      const targetId = lookupMap.get(key)
      if (targetId) {
        refs.push({
          _type: 'reference',
          _ref: targetId,
          _key: `ref_${targetId.replace(/[^a-zA-Z0-9_-]/g, '_')}_${refs.length}`,
        })
        totalReferencesResolved++
      } else {
        console.warn(`  ⚠️ Warning: Unresolved reference "${key}" in field "${fieldName}" on document "${sourceId}"`)
      }
    }
    return refs
  }

  // C.1 Patch documentation references
  for (const doc of documentationData) {
    const patches: Record<string, any> = {}
    if (doc.relatedApis?.length) {
      patches.relatedApis = createRefList(doc.relatedApis, 'relatedApis', doc.id)
    }
    if (doc.relatedMigrations?.length) {
      patches.relatedMigrations = createRefList(doc.relatedMigrations, 'relatedMigrations', doc.id)
    }

    if (Object.keys(patches).length > 0) {
      await client.patch(doc.id).set(patches).commit()
      console.log(`  ✓ Linked references for [documentation] ${doc.id}`)
    }
  }

  // C.2 Patch apiReference references
  for (const api of apiReferenceData) {
    const patches: Record<string, any> = {}
    if (api.relatedDocumentation?.length) {
      patches.relatedDocumentation = createRefList(api.relatedDocumentation, 'relatedDocumentation', api.id)
    }
    if (api.relatedMigrations?.length) {
      patches.relatedMigrations = createRefList(api.relatedMigrations, 'relatedMigrations', api.id)
    }

    if (Object.keys(patches).length > 0) {
      await client.patch(api.id).set(patches).commit()
      console.log(`  ✓ Linked references for [apiReference] ${api.id}`)
    }
  }

  // C.3 Patch migrationGuide references
  for (const mig of migrationGuideData) {
    const patches: Record<string, any> = {}
    if (mig.affectedApis?.length) {
      patches.affectedApis = createRefList(mig.affectedApis, 'affectedApis', mig.id)
    }
    if (mig.relatedDocumentation?.length) {
      patches.relatedDocumentation = createRefList(mig.relatedDocumentation, 'relatedDocumentation', mig.id)
    }
    if (mig.relatedReleaseNotes?.length) {
      patches.relatedReleaseNotes = createRefList(mig.relatedReleaseNotes, 'relatedReleaseNotes', mig.id)
    }

    if (Object.keys(patches).length > 0) {
      await client.patch(mig.id).set(patches).commit()
      console.log(`  ✓ Linked references for [migrationGuide] ${mig.id}`)
    }
  }

  // C.4 Patch releaseNote references
  for (const rel of releaseNoteData) {
    const patches: Record<string, any> = {}
    if (rel.affectedApis?.length) {
      patches.affectedApis = createRefList(rel.affectedApis, 'affectedApis', rel.id)
    }
    if (rel.relatedDocumentation?.length) {
      patches.relatedDocumentation = createRefList(rel.relatedDocumentation, 'relatedDocumentation', rel.id)
    }
    if (rel.migrationGuides?.length) {
      patches.migrationGuides = createRefList(rel.migrationGuides, 'migrationGuides', rel.id)
    }

    if (Object.keys(patches).length > 0) {
      await client.patch(rel.id).set(patches).commit()
      console.log(`  ✓ Linked references for [releaseNote] ${rel.id}`)
    }
  }

  console.log(`\nPhase C Completed: ${totalReferencesResolved} references successfully resolved and committed.\n`)

  // -------------------------------------------------------------
  // PHASE D: Verify Production Dataset Content & Counts
  // -------------------------------------------------------------
  console.log('--- PHASE D: Verifying Production Dataset Integrity ---')

  const countsQuery = `
  {
    "documentation": count(*[_type == "documentation"]),
    "apiReference": count(*[_type == "apiReference"]),
    "migrationGuide": count(*[_type == "migrationGuide"]),
    "releaseNote": count(*[_type == "releaseNote"]),
    "total": count(*[_type in ["documentation", "apiReference", "migrationGuide", "releaseNote"]])
  }
  `
  const counts = await client.fetch<Record<string, number>>(countsQuery)

  console.log('📊 Verified Dataset Document Counts:')
  console.log(`   - documentation:  ${counts.documentation}`)
  console.log(`   - apiReference:   ${counts.apiReference}`)
  console.log(`   - migrationGuide: ${counts.migrationGuide}`)
  console.log(`   - releaseNote:    ${counts.releaseNote}`)
  console.log(`   -----------------------------`)
  console.log(`   - TOTAL:          ${counts.total}\n`)

  // Sample check reference hydration
  const sample = await client.fetch<any>(`
    *[_type == "documentation" && _id == "doc-caching"][0]{
      title,
      "relatedApis": relatedApis[]->name,
      "relatedMigrations": relatedMigrations[]->title
    }
  `)

  if (sample) {
    console.log('🔍 Verified Reference Hydration Sample (doc-caching):')
    console.log(`   Title: ${sample.title}`)
    console.log(`   Related APIs: ${JSON.stringify(sample.relatedApis)}`)
    console.log(`   Related Migrations: ${JSON.stringify(sample.relatedMigrations)}\n`)
  }

  console.log('===========================================================')
  console.log('✨ Seed Ingestion Completed Successfully!')
  console.log('===========================================================')
}

main().catch((err) => {
  console.error('\n❌ Fatal Seed Error:', err)
  process.exit(1)
})
