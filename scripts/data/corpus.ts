/**
 * Official Next.js Curated Knowledge Corpus
 * Source: https://nextjs.org/docs
 *
 * Designed for semantic retrieval, document-type awareness, version awareness,
 * multi-document reasoning, and dense cross-document relationships.
 */

export interface PortableTextBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3' | 'blockquote'
  children: Array<{
    _type: 'span'
    _key: string
    text: string
    marks?: string[]
  }>
  markDefs: any[]
  listItem?: 'bullet'
  level?: number
}

export function linesToPortableText(lines: string[], prefix = 'b'): PortableTextBlock[] {
  return lines.map((line, idx) => {
    let style: 'normal' | 'h2' | 'h3' | 'blockquote' = 'normal'
    let text = line
    let listItem: 'bullet' | undefined
    let level: number | undefined

    if (line.startsWith('## ')) {
      style = 'h2'
      text = line.slice(3).trim()
    } else if (line.startsWith('### ')) {
      style = 'h3'
      text = line.slice(4).trim()
    } else if (line.startsWith('- ')) {
      style = 'normal'
      listItem = 'bullet'
      level = 1
      text = line.slice(2).trim()
    } else if (line.startsWith('> ')) {
      style = 'blockquote'
      text = line.slice(2).trim()
    }

    const block: PortableTextBlock = {
      _type: 'block',
      _key: `${prefix}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
      style,
      children: [
        {
          _type: 'span',
          _key: `s_${idx}_${Math.random().toString(36).slice(2, 7)}`,
          text,
          marks: [],
        },
      ],
      markDefs: [],
    }

    if (listItem) {
      block.listItem = listItem
      block.level = level
    }

    return block
  })
}

export interface DocumentationDoc {
  id: string
  title: string
  slug: string
  product: string
  version: string
  category:
    | 'Getting Started'
    | 'Routing'
    | 'Data Fetching'
    | 'Caching'
    | 'Authentication'
    | 'Performance'
    | 'Deployment'
    | 'Configuration'
    | 'Other'
  summary: string
  contentLines: string[]
  tags: string[]
  sourceTitle: string
  sourceUrl: string
  lastUpdated: string
  relatedApis: string[]
  relatedMigrations: string[]
}

export interface ApiReferenceDoc {
  id: string
  name: string
  slug: string
  product: string
  version: string
  apiType: 'Function' | 'Component' | 'Hook' | 'Class' | 'CLI' | 'Configuration' | 'Other'
  description: string
  parameters: Array<{
    name: string
    type: string
    description: string
    required: boolean
  }>
  example: string
  limitations: string[]
  sourceTitle: string
  sourceUrl: string
  relatedDocumentation: string[]
  relatedMigrations: string[]
}

export interface MigrationGuideDoc {
  id: string
  title: string
  slug: string
  product: string
  fromVersion: string
  toVersion: string
  summary: string
  breakingChanges: string[]
  migrationStepsLines: string[]
  affectedFeatures: string[]
  sourceTitle: string
  sourceUrl: string
  affectedApis: string[]
  relatedDocumentation: string[]
  relatedReleaseNotes: string[]
}

export interface ReleaseNoteDoc {
  id: string
  title: string
  version: string
  product: string
  releaseDate: string
  summary: string
  changesLines: string[]
  breakingChanges: string[]
  deprecatedFeatures: string[]
  affectedFeatures: string[]
  sourceTitle: string
  sourceUrl: string
  affectedApis: string[]
  relatedDocumentation: string[]
  migrationGuides: string[]
}

export const documentationData: DocumentationDoc[] = [
  {
    id: 'doc-app-router',
    title: 'App Router Routing Architecture and Conventions',
    slug: 'app-router-architecture',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'Core architecture of the Next.js App Router, using folder-based routing, nested route segments, React Server Components by default, and special file conventions.',
    contentLines: [
      '## Overview of Next.js App Router',
      'The App Router is Next.js modern routing architecture built on React Server Components (RSC). It replaces the legacy Pages Router by moving routing into the app/ directory.',
      'Folders define URL route segments, and special nested files (such as page.tsx, layout.tsx, loading.tsx, error.tsx, and route.ts) define the UI and behavior for each segment.',
      '## Key Structural Conventions',
      '- Folders create URL segments: app/dashboard/settings resolves to /dashboard/settings.',
      '- Special files only map to UI when page.js or route.js is present.',
      '- Route Groups ((folderName)) organize routes logically without altering URL paths.',
      '- Parallel Routes (@slot) allow rendering multiple independent pages in the same layout simultaneously.',
      '- Intercepting Routes ((..)folder) allow previewing or masking routes within the current page context.',
      '## Server-First Component Paradigm',
      'Components in the App Router are React Server Components by default. They execute on the server during rendering and ship zero JavaScript bundle to the browser unless opted into client-side interactivity using the "use client" directive.',
      '## When to Choose App Router',
      'App Router is the recommended default for all new Next.js projects starting from Next.js 13.4 and remains the primary paradigm in Next.js 15 and 16. It offers granular streaming, automatic code splitting, server actions, and composable layout hierarchies.',
    ],
    tags: ['App Router', 'Routing', 'React Server Components', 'Route Groups', 'Conventions'],
    sourceTitle: 'Routing: Fundamentals | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing',
    lastUpdated: '2026-02-15T00:00:00.000Z',
    relatedApis: ['api-route-handler', 'api-use-client', 'api-use-server'],
    relatedMigrations: ['mig-14-to-15', 'mig-15-to-16'],
  },
  {
    id: 'doc-project-structure',
    title: 'Next.js Project Structure and Special File Conventions',
    slug: 'project-structure-file-conventions',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Getting Started',
    summary:
      'Detailed overview of the filesystem layout and reserved file conventions in Next.js App Router, including root files, routing endpoints, and edge interceptors.',
    contentLines: [
      '## Next.js Filesystem Hierarchy',
      'A standard Next.js App Router project places application code inside an optional src/ directory and an app/ routing tree, with configuration files at the repository root.',
      '## Reserved App Router Files',
      '- layout.tsx: Wraps child route segments and preserves state across navigations.',
      '- page.tsx: Declares the unique public UI for a route segment.',
      '- loading.tsx: Instant loading skeleton wrapped in a React Suspense boundary.',
      '- not-found.tsx: UI displayed when notFound() is triggered or a route does not match.',
      '- error.tsx: Client-side error boundary that isolates component failure to subtrees.',
      '- global-error.tsx: Fallback error boundary specifically targeting root layout crashes.',
      '- route.ts: HTTP REST endpoint handling Web standard Request and Response objects.',
      '- template.tsx: Similar to layout.tsx, but mounts fresh instances on each navigation.',
      '## Root Interceptor Files',
      '- proxy.ts (Next.js 16+): Root edge network interceptor replacing legacy middleware.ts.',
      '- middleware.ts (Next.js 12-15): Edge request interceptor for redirects, rewrites, and headers.',
      '- instrumentation.ts: Observability hook running when the server boots.',
      '## Colocation Principles',
      'Developers can safely colocate private components, stylesheets, utility functions, and test files inside app/ folders because only reserved file names (like page.tsx or route.ts) are publicly routable.',
    ],
    tags: ['Project Structure', 'File Conventions', 'Layout', 'Proxy', 'Middleware'],
    sourceTitle: 'Project Structure | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/getting-started/project-structure',
    lastUpdated: '2026-03-01T00:00:00.000Z',
    relatedApis: ['api-route-handler', 'api-proxy-handler', 'api-not-found'],
    relatedMigrations: ['mig-middleware-to-proxy', 'mig-15-to-16'],
  },
  {
    id: 'doc-layouts-and-pages',
    title: 'Defining Pages and Nested Layout Hierarchies',
    slug: 'pages-and-layouts',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'How to build nested UI trees using page.js and layout.js, understanding state preservation during navigation, and managing root layout requirements.',
    contentLines: [
      '## Pages',
      'A page is UI unique to a route. You define a page by exporting a React component from a page.js or page.tsx file.',
      'In Next.js 15 and 16, page component props (such as params and searchParams) are asynchronous Promises and must be awaited before accessing properties.',
      '## Layouts',
      'A layout is UI that is shared between multiple pages. On navigation, layouts preserve state, remain interactive, and do not re-render their subtrees unnecessarily.',
      'Layouts accept a children React prop representing nested segments or pages.',
      '## Root Layout Requirements',
      '- The app/ directory MUST contain a root layout (app/layout.tsx).',
      '- The root layout MUST contain the <html> and <body> tags.',
      '- The root layout cannot be a Client Component; it must be a Server Component.',
      '## Nested Layout Resolution',
      'When navigating to /dashboard/analytics, Next.js nests app/layout.tsx -> app/dashboard/layout.tsx -> app/dashboard/analytics/page.tsx into a single continuous component tree.',
      'To force re-rendering of a shared shell on navigation without state preservation, use template.tsx instead of layout.tsx.',
    ],
    tags: ['Layouts', 'Pages', 'Nested Routes', 'Root Layout', 'Templates'],
    sourceTitle: 'Routing: Pages and Layouts | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts',
    lastUpdated: '2026-01-20T00:00:00.000Z',
    relatedApis: ['api-generate-metadata', 'api-not-found', 'api-redirect'],
    relatedMigrations: ['mig-async-request-apis', 'mig-14-to-15'],
  },
  {
    id: 'doc-linking-and-navigating',
    title: 'Client Navigation, Prefetching, and Soft Navigation',
    slug: 'linking-and-navigating',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'Mechanisms of client-side navigation in Next.js, including the Link component, programmatic navigation via useRouter, viewport prefetching, and router cache behavior.',
    contentLines: [
      '## The <Link> Component',
      'The primary mechanism for navigation in Next.js is the next/link component. It extends the native HTML <a> tag with prefetching and client-side soft navigation.',
      '## Soft Navigation vs Hard Navigation',
      '- Soft Navigation: Next.js only downloads the payload for changed segments, preserves existing React state in parent layouts, and prevents full browser window refreshes.',
      '- Hard Navigation: Occurs when navigating across external URLs, triggering a complete browser page reload and cache re-evaluation.',
      '## Prefetching Strategies',
      '- Static Routes: Entire route segment payloads are preloaded when the Link enters the viewport.',
      '- Dynamic Routes: In Next.js 15+, prefetching fetches the shared layout tree and loading skeletons, leaving dynamic segment data until explicit user interaction.',
      '## Programmatic Navigation with useRouter',
      'Client Components can import useRouter from next/navigation to call router.push(), router.replace(), and router.refresh().',
      'For redirects occurring in Server Components, Route Handlers, or Server Actions, use the redirect() function instead.',
    ],
    tags: ['Link', 'Navigation', 'Prefetching', 'useRouter', 'Soft Navigation'],
    sourceTitle: 'Routing: Linking and Navigating | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating',
    lastUpdated: '2026-02-01T00:00:00.000Z',
    relatedApis: ['api-redirect', 'api-use-client'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'doc-server-and-client-components',
    title: 'Server and Client Components Composition Patterns',
    slug: 'server-and-client-components',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Getting Started',
    summary:
      'Rules and patterns for interleaving Server and Client Components, establishing boundaries with "use client", and avoiding serialization bottlenecks.',
    contentLines: [
      '## React Server Components (RSC) Foundation',
      'Server Components render exclusively on the server. They have direct access to backend resources (databases, filesystem, internal microservices) and add zero weight to the client JavaScript bundle.',
      '## The "use client" Boundary',
      'The "use client" directive marks the boundary between the server execution graph and the client bundle. Any module declaring "use client" and all modules imported by it become part of the client bundle.',
      'Use Client Components only when requiring: React hooks (useState, useEffect), event listeners (onClick, onChange), browser APIs (window, localStorage), or custom client hooks.',
      '## Composition Rule: Passing Server Components as Props',
      '- You cannot directly import a Server Component into a Client Component file.',
      '- Instead, pass the Server Component as a children prop or named slot into the Client Component.',
      '- This preserves server-side execution of the child component while allowing the parent Client Component to manage state or wrappers.',
      '## Data Serialization Across Boundaries',
      'Props passed from Server Components to Client Components must be serializable by React (JSON-compatible data, Promises, or JSX elements). Functions cannot be passed across the boundary unless declared as Server Actions.',
    ],
    tags: ['Server Components', 'Client Components', 'use client', 'RSC', 'Composition'],
    sourceTitle: 'Rendering: Composition Patterns | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns',
    lastUpdated: '2026-02-10T00:00:00.000Z',
    relatedApis: ['api-use-client', 'api-use-server'],
    relatedMigrations: ['mig-14-to-15', 'mig-15-to-16'],
  },
  {
    id: 'doc-fetching-data',
    title: 'Data Fetching Strategies and Server Actions',
    slug: 'data-fetching-and-server-actions',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Data Fetching',
    summary:
      'Modern data fetching in Next.js using async Server Components, the native fetch API, Next.js 15 uncached defaults, and mutation via Server Actions.',
    contentLines: [
      '## Async Server Component Data Fetching',
      'In the App Router, data fetching is executed directly inside Server Components using native JavaScript async/await syntax. There is no need for getServerSideProps or getStaticProps.',
      '## Next.js 15 Caching Shift',
      'Prior to Next.js 15, fetch requests were aggressively cached by default (force-cache).',
      'In Next.js 15 and 16, fetch requests are UNCACHED by default (equivalent to cache: "no-store"). To cache a fetch response, you must explicitly declare { cache: "force-cache" } or specify next: { revalidate: number }.',
      '## Request Memoization',
      'Next.js automatically deduplicates fetch requests that share the exact same URL and options within a single render pass of a server component tree.',
      '## Server Actions for Mutations',
      'Server Actions are asynchronous functions declared with the "use server" directive. They can be invoked from form action attributes, event handlers, or useEffect in Client Components.',
      'Server Actions trigger a server-side mutation, allow calling cookies() and revalidatePath(), and return fresh UI state in a single network round-trip.',
    ],
    tags: ['Data Fetching', 'Server Actions', 'fetch', 'no-store', 'Mutations'],
    sourceTitle: 'Data Fetching: Fetching, Caching, and Revalidating | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/data-fetching/fetching',
    lastUpdated: '2026-02-18T00:00:00.000Z',
    relatedApis: ['api-use-server', 'api-cookies', 'api-revalidate-path'],
    relatedMigrations: ['mig-14-to-15', 'mig-async-request-apis'],
  },
  {
    id: 'doc-loading-ui-and-streaming',
    title: 'Loading UI and Progressive Streaming with React Suspense',
    slug: 'loading-ui-and-streaming',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'Instant loading feedback and progressive server-side streaming using loading.tsx conventions and granular React Suspense boundaries.',
    contentLines: [
      '## The loading.tsx Convention',
      'Placing a loading.tsx file inside a route directory automatically wraps the corresponding page.tsx (and any children below it) inside a React Suspense boundary.',
      'When a user navigates to the route, the loading skeleton displays immediately while the server renders the page content in the background.',
      '## Streaming Architecture',
      'Streaming breaks down the page HTML into chunks and streams them progressively over an open HTTP connection using chunked transfer encoding.',
      'This allows browsers to paint fast components immediately (such as navigation bars, headers, and sidebars) without waiting for slow database queries or external API calls.',
      '## Granular Suspense Boundaries',
      'In addition to folder-level loading.tsx, developers can nest explicit <Suspense fallback={<Skeleton />}> boundaries around specific UI widgets inside a single page.',
      'This unlocks Selective Hydration: React prioritizes hydrating parts of the page that the user is actively interacting with, improving First Input Delay (FID) and Interaction to Next Paint (INP).',
    ],
    tags: ['Loading UI', 'Streaming', 'Suspense', 'Selective Hydration', 'Performance'],
    sourceTitle: 'Routing: Loading UI and Streaming | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming',
    lastUpdated: '2026-01-25T00:00:00.000Z',
    relatedApis: ['api-use-client'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'doc-error-handling',
    title: 'Error Handling, Error Boundaries, and notFound',
    slug: 'error-handling-and-recovery',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'Robust error containment in Next.js using error.tsx client error boundaries, recovery attempts with reset(), root layout global-error.tsx, and 404 triggers.',
    contentLines: [
      '## Nested Error Boundaries with error.tsx',
      'The error.js/error.tsx file convention creates a React Error Boundary wrapping a route segment and its nested children.',
      'Crucially, error.tsx MUST be a Client Component (marked with "use client"). If a child component throws an unexpected runtime error, error.tsx intercepts the failure and renders fallback UI without crashing the entire application.',
      '## Recovery with the reset() Function',
      'The error boundary component receives two props: error (the Error object) and reset (a function). Calling reset() prompts Next.js to re-render the segment content, enabling graceful retry mechanics for transient network failures.',
      '## Isolating Root Layout Failures with global-error.tsx',
      'An error.tsx inside app/ cannot catch errors thrown inside the root app/layout.tsx because the error boundary is rendered inside the layout children.',
      'To catch errors in the root layout or root template, create app/global-error.tsx. It must define its own <html> and <body> tags.',
      '## Expected Resource Misses with notFound()',
      'For expected 404 scenarios (such as an unknown product slug), invoke the notFound() function from next/navigation. This halts rendering and invokes the nearest not-found.tsx boundary.',
    ],
    tags: ['Error Handling', 'error.tsx', 'global-error.tsx', 'notFound', 'Error Boundary'],
    sourceTitle: 'Routing: Error Handling | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/error-handling',
    lastUpdated: '2026-02-12T00:00:00.000Z',
    relatedApis: ['api-not-found', 'api-redirect'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'doc-route-handlers',
    title: 'Route Handlers: REST and HTTP Endpoint Architecture',
    slug: 'route-handlers-lifecycle',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Routing',
    summary:
      'Creating server-side HTTP endpoints in Next.js App Router using route.ts, supporting standard Web APIs, streaming responses, and Next.js 15 caching changes.',
    contentLines: [
      '## The route.ts File Convention',
      'Route Handlers allow you to build custom request handlers for a given route using the Web standard Request and Response APIs. They are declared in route.js or route.ts files inside the app/ directory.',
      'Supported HTTP methods are exported as named functions: GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS.',
      '## Conflict Rules with page.ts',
      'A route.ts file cannot exist in the exact same directory as a page.ts file because both map to the same URL endpoint. Separate API endpoints into an app/api/ subdirectory.',
      '## Next.js 15 Uncached GET Defaults',
      'In Next.js 14, GET route handlers were statically cached by default unless they accessed dynamic request functions.',
      'Starting in Next.js 15, GET Route Handlers are UNCACHED by default. To make a GET route handler static and cacheable, you must explicitly declare: export const dynamic = "force-static".',
      '## Async Context in Next.js 15 and 16',
      'When receiving dynamic parameters in route handlers (e.g., app/api/users/[id]/route.ts), the context.params object is an asynchronous Promise and must be awaited before accessing params.id.',
    ],
    tags: ['Route Handlers', 'API', 'REST', 'NextResponse', 'HTTP Methods'],
    sourceTitle: 'Routing: Route Handlers | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
    lastUpdated: '2026-02-22T00:00:00.000Z',
    relatedApis: ['api-route-handler', 'api-cookies', 'api-redirect'],
    relatedMigrations: ['mig-14-to-15', 'mig-async-request-apis'],
  },
  {
    id: 'doc-proxy',
    title: 'Proxy: Edge Request Routing and Network Interception (formerly Middleware)',
    slug: 'proxy-network-interception',
    product: 'Next.js',
    version: '16.x',
    category: 'Routing',
    summary:
      'Next.js 16 evolution of Middleware into Proxy (proxy.ts), handling edge network boundaries, path rewrites, security headers, and request routing.',
    contentLines: [
      '## The Next.js 16 Proxy Convention',
      'Next.js 16 deprecates middleware.ts and introduces proxy.ts as the replacement file convention. This change clarifies its role as a network boundary and request routing layer, differentiating it from traditional Express-style middleware pipelines.',
      'The file is declared as proxy.ts (or proxy.js) in the project root or src/ directory and exports a named proxy function.',
      '## Execution Lifecycle and Matcher',
      'Proxy executes on every matching request BEFORE cached content and routes are resolved. It is configured via an exported config object containing a matcher regex or glob array.',
      'Proxy allows developers to:',
      '- Rewrite incoming URLs internally without changing browser location.',
      '- Redirect requests with HTTP 307 or 308 status codes.',
      '- Set custom request and response headers (such as Content Security Policy).',
      '- Inspect and validate incoming session cookies and authentication tokens.',
      '## Edge Constraints and Codemod',
      'Proxy runs within the Edge Runtime and cannot access Node.js native libraries (such as fs or crypto child processes).',
      'Next.js provides an automated codemod to upgrade existing codebases: npx @next/codemod@canary middleware-to-proxy.',
    ],
    tags: ['Proxy', 'Middleware', 'Edge Runtime', 'Redirects', 'Rewrites', 'Security'],
    sourceTitle: 'Routing: Proxy | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/routing/proxy',
    lastUpdated: '2026-03-05T00:00:00.000Z',
    relatedApis: ['api-proxy-handler', 'api-redirect', 'api-cookies'],
    relatedMigrations: ['mig-middleware-to-proxy', 'mig-15-to-16'],
  },
  {
    id: 'doc-caching',
    title: 'Next.js Caching Architecture and Multi-Tier Cache Invalidation',
    slug: 'caching-architecture-and-defaults',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Caching',
    summary:
      'Comprehensive guide to Next.js four caching mechanisms: Request Memoization, Data Cache, Full Route Cache, and Router Cache, highlighting Next.js 15 defaults.',
    contentLines: [
      '## The Four Caching Systems in Next.js',
      '1. Request Memoization (Server): Deduplicates identical fetch requests within a single React render pass.',
      '2. Data Cache (Server): Persistent HTTP cache across user requests and deployments.',
      '3. Full Route Cache (Server): Statically rendered HTML and RSC payloads stored on the server.',
      '4. Router Cache (Client): In-memory client-side cache storing visited and prefetched route segments.',
      '## Critical Changes in Next.js 15 Defaults',
      '- Default fetch: Changed from cached (force-cache) to UNCACHED (no-store).',
      '- GET Route Handlers: Changed from cached by default to UNCACHED by default.',
      '- Client Router Cache: Starting with Next.js 15, the default dynamic staleTime is 0 seconds; this changed from the previous 30-second default.',
      '## Choosing the Right Invalidation Strategy',
      'To cache data explicitly, pass { cache: "force-cache" } or next: { revalidate: seconds } into fetch calls. For dynamic on-demand purging, use revalidatePath() or revalidateTag() from next/cache.',
    ],
    tags: ['Caching', 'Data Cache', 'Router Cache', 'Request Memoization', 'Next.js 15'],
    sourceTitle: 'Caching in Next.js | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/caching',
    lastUpdated: '2026-02-15T00:00:00.000Z',
    relatedApis: ['api-revalidate-path', 'api-cookies'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'doc-revalidating',
    title: 'Revalidating Cached Data: Time-Based and On-Demand ISR',
    slug: 'revalidating-cached-data',
    product: 'Next.js',
    version: '15.x / 16.x',
    category: 'Caching',
    summary:
      'Techniques for refreshing cached content in Next.js, including Incremental Static Regeneration (ISR), time-based intervals, and on-demand cache tag revalidation.',
    contentLines: [
      '## What is Revalidation?',
      'Revalidation is the process of purging cached data and re-rendering route segments. It allows static pages to stay updated without rebuilding the entire application.',
      'Next.js supports two revalidation models:',
      '- Time-Based Revalidation: Automatically revalidates data after a designated duration has passed.',
      '- On-Demand Revalidation: Manually purges cached items when a specific event occurs (e.g., headless CMS webhook or user update).',
      '## Time-Based Revalidation Setup',
      'Set the revalidate option on a fetch call: fetch("https://api.example.com", { next: { revalidate: 3600 } }). Alternatively, export export const revalidate = 3600 from a page or layout.',
      'When a request comes in after the timer expires, Next.js serves stale data while asynchronously regenerating the page in the background (stale-while-revalidate pattern).',
      '## On-Demand Invalidation with revalidatePath and revalidateTag',
      'In Server Actions or Route Handlers, invoke revalidatePath("/posts/[slug]") or revalidateTag("products"). This purges matching items from the Data Cache and Full Route Cache immediately.',
    ],
    tags: ['Revalidation', 'ISR', 'revalidatePath', 'revalidateTag', 'Data Cache'],
    sourceTitle: 'Data Fetching: Incremental Static Regeneration | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration',
    lastUpdated: '2026-02-20T00:00:00.000Z',
    relatedApis: ['api-revalidate-path', 'api-use-server'],
    relatedMigrations: ['mig-14-to-15'],
  },
]

export const apiReferenceData: ApiReferenceDoc[] = [
  {
    id: 'api-use-client',
    name: "'use client' Directive",
    slug: 'directive-use-client',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Configuration',
    description:
      'Directive declared at the top of a file (before imports) to mark the module boundary between Server and Client Components.',
    parameters: [],
    example:
      "'use client'\n\nimport { useState } from 'react'\n\nexport default function Counter() {\n  const [count, setCount] = useState(0)\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>\n}",
    limitations: [
      'Must be placed at the very top of the file, before any import statements.',
      'Cannot import Server Components directly into a file with "use client"; Server Components must be passed as props/children.',
      'Increases client bundle size because the component code is delivered to the browser.',
    ],
    sourceTitle: 'Directives: use client | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/directives/use-client',
    relatedDocumentation: ['doc-server-and-client-components', 'doc-loading-ui-and-streaming'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'api-use-server',
    name: "'use server' Directive",
    slug: 'directive-use-server',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Configuration',
    description:
      'Directive that marks server-side functions as callable from client-side code, forming the foundation of Server Actions.',
    parameters: [],
    example:
      "'use server'\n\nimport { cookies } from 'next/headers'\n\nexport async function updateUsername(formData: FormData) {\n  const username = formData.get('username') as string\n  const cookieStore = await cookies()\n  cookieStore.set('username', username)\n  return { success: true }\n}",
    limitations: [
      'Can be declared at top-level of a file (all exports become Server Actions) or inline inside async functions in Server Components.',
      'All arguments and return values must be serializable by React.',
      'Server Actions are publicly accessible HTTP POST endpoints; authorization and input validation must always be verified inside the function.',
    ],
    sourceTitle: 'Directives: use server | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/directives/use-server',
    relatedDocumentation: ['doc-server-and-client-components', 'doc-fetching-data'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'api-revalidate-path',
    name: 'revalidatePath',
    slug: 'revalidate-path',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Purges cached data on-demand for a specific path, triggering background regeneration of the route on the next visit.',
    parameters: [
      {
        name: 'path',
        type: 'string',
        description: 'The filesystem path or URL path to invalidate (e.g. "/blog/[slug]" or "/feed").',
        required: true,
      },
      {
        name: 'type',
        type: "'page' | 'layout'",
        description: 'Optional flag specifying whether to purge only the specific page or the entire layout tree.',
        required: false,
      },
    ],
    example:
      "import { revalidatePath } from 'next/cache'\n\nexport async function publishPost(id: string) {\n  'use server'\n  await db.posts.update(id, { published: true })\n  revalidatePath('/posts')\n  revalidatePath(`/posts/${id}`, 'page')\n}",
    limitations: [
      'Can only be called in Server Components, Server Actions, or Route Handlers; not callable from Client Components.',
      'revalidatePath does not immediately re-render currently open client browser tabs unless paired with router.refresh() on the client.',
    ],
    sourceTitle: 'Functions: revalidatePath | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/functions/revalidatePath',
    relatedDocumentation: ['doc-revalidating', 'doc-caching'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'api-route-handler',
    name: 'route.js / Route Handlers',
    slug: 'route-js-handlers',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Standard HTTP request handler for building RESTful endpoints inside the App Router, exporting GET, POST, PUT, DELETE, and PATCH functions.',
    parameters: [
      {
        name: 'request',
        type: 'NextRequest',
        description: 'Incoming HTTP Web Request object extended with Next.js helper utilities.',
        required: true,
      },
      {
        name: 'context',
        type: '{ params: Promise<Record<string, string | string[]>> }',
        description: 'Route context containing dynamic route parameters. In Next.js 15+, params is an async Promise.',
        required: false,
      },
    ],
    example:
      "import { NextResponse } from 'next/server'\nimport type { NextRequest } from 'next/server'\n\nexport async function GET(\n  request: NextRequest,\n  context: { params: Promise<{ id: string }> }\n) {\n  const { id } = await context.params\n  return NextResponse.json({ id, status: 'active' })\n}",
    limitations: [
      'Cannot be placed in the same folder segment as a page.js file.',
      'In Next.js 15+, context.params is asynchronous and must be awaited before accessing properties.',
      'Uncached by default in Next.js 15 unless configured with force-static.',
    ],
    sourceTitle: 'File Conventions: route.js | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/route',
    relatedDocumentation: ['doc-route-handlers', 'doc-caching'],
    relatedMigrations: ['mig-async-request-apis', 'mig-14-to-15'],
  },
  {
    id: 'api-proxy-handler',
    name: 'proxy.js / Proxy (formerly middleware.js)',
    slug: 'proxy-js',
    product: 'Next.js',
    version: '16.x',
    apiType: 'Function',
    description:
      'Edge request interceptor in Next.js 16 executing before route rendering, allowing dynamic rewrites, redirects, header modification, and authentication checks.',
    parameters: [
      {
        name: 'request',
        type: 'NextRequest',
        description: 'Incoming HTTP request received at the edge proxy layer.',
        required: true,
      },
    ],
    example:
      "import { NextResponse } from 'next/server'\nimport type { NextRequest } from 'next/server'\n\nexport function proxy(request: NextRequest) {\n  const token = request.cookies.get('session')?.value\n  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {\n    return NextResponse.redirect(new URL('/login', request.url))\n  }\n  return NextResponse.next()\n}\n\nexport const config = {\n  matcher: ['/dashboard/:path*'],\n}",
    limitations: [
      'Runs in the Edge Runtime; cannot access native Node.js filesystem (fs) or native binaries.',
      'Only one proxy.ts is permitted per project root or src/ directory.',
      'Must keep execution fast to avoid introducing latency on critical request paths.',
    ],
    sourceTitle: 'File Conventions: proxy.js | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/file-conventions/proxy',
    relatedDocumentation: ['doc-proxy', 'doc-project-structure'],
    relatedMigrations: ['mig-middleware-to-proxy', 'mig-15-to-16'],
  },
  {
    id: 'api-generate-metadata',
    name: 'generateMetadata',
    slug: 'generate-metadata',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Asynchronous function exported from a layout or page to compute dynamic HTML <head> metadata (e.g., title, description, Open Graph tags).',
    parameters: [
      {
        name: 'props',
        type: '{ params: Promise<Record<string, string>>, searchParams: Promise<Record<string, string>> }',
        description: 'Page props containing params and searchParams Promises (Next.js 15+).',
        required: true,
      },
      {
        name: 'parent',
        type: 'ResolvingMetadata',
        description: 'Promise resolving to the metadata inherited from parent layout segments.',
        required: false,
      },
    ],
    example:
      "import type { Metadata, ResolvingMetadata } from 'next'\n\ntype Props = {\n  params: Promise<{ id: string }>\n}\n\nexport async function generateMetadata(\n  { params }: Props,\n  parent: ResolvingMetadata\n): Promise<Metadata> {\n  const { id } = await params\n  const product = await fetchProduct(id)\n  return {\n    title: product.name,\n    openGraph: { images: [product.imageUrl] },\n  }\n}",
    limitations: [
      'Cannot be exported from Client Components ("use client").',
      'Both params and searchParams are Promises in Next.js 15 and must be awaited.',
      'Fetch requests inside generateMetadata are automatically memoized if identical to fetches in the page component.',
    ],
    sourceTitle: 'Functions: generateMetadata | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/functions/generate-metadata',
    relatedDocumentation: ['doc-layouts-and-pages'],
    relatedMigrations: ['mig-async-request-apis'],
  },
  {
    id: 'api-redirect',
    name: 'redirect',
    slug: 'redirect',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Immediately halts rendering and redirects the client to a specified URL by throwing a framework-level NEXT_REDIRECT exception.',
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'The target destination URL (relative or absolute).',
        required: true,
      },
      {
        name: 'type',
        type: "RedirectType ('replace' | 'push')",
        description: 'Navigation history push or replace behavior (defaults to replace).',
        required: false,
      },
    ],
    example:
      "import { redirect } from 'next/navigation'\n\nexport default async function ProfilePage() {\n  const session = await getSession()\n  if (!session) {\n    redirect('/login')\n  }\n  return <div>Welcome {session.user.name}</div>\n}",
    limitations: [
      'Works by throwing an internal JavaScript error; never wrap redirect() inside a general try/catch block without re-throwing the error.',
      'Cannot be used inside Client Component lifecycle hooks; use useRouter().push() instead.',
    ],
    sourceTitle: 'Functions: redirect | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/functions/redirect',
    relatedDocumentation: ['doc-linking-and-navigating', 'doc-route-handlers', 'doc-error-handling'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'api-not-found',
    name: 'notFound',
    slug: 'not-found',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Halts component rendering, emits a 404 HTTP status code, and renders the nearest not-found.js boundary.',
    parameters: [],
    example:
      "import { notFound } from 'next/navigation'\n\nexport default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {\n  const { id } = await params\n  const item = await fetchItem(id)\n  if (!item) {\n    notFound()\n  }\n  return <h1>{item.name}</h1>\n}",
    limitations: [
      'Throws an internal NEXT_NOT_FOUND exception; do not swallow this error in catch blocks.',
      'Renders the closest not-found.js in the segment tree; if none exists, falls back to the root app/not-found.js.',
    ],
    sourceTitle: 'Functions: notFound | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/functions/not-found',
    relatedDocumentation: ['doc-error-handling', 'doc-layouts-and-pages'],
    relatedMigrations: ['mig-14-to-15'],
  },
  {
    id: 'api-cookies',
    name: 'cookies()',
    slug: 'cookies-function',
    product: 'Next.js',
    version: '15.x / 16.x',
    apiType: 'Function',
    description:
      'Reads incoming request cookies in Server Components, and reads or sets cookies in Server Actions and Route Handlers. Returns an asynchronous Promise in Next.js 15+.',
    parameters: [],
    example:
      "import { cookies } from 'next/headers'\n\nexport async function MyServerComponent() {\n  const cookieStore = await cookies()\n  const theme = cookieStore.get('theme')?.value ?? 'light'\n  return <div className={theme}>Active Theme: {theme}</div>\n}",
    limitations: [
      'In Next.js 15+, cookies() is an asynchronous function and MUST be awaited.',
      'Setting or deleting cookies is only permitted inside Server Actions and Route Handlers, not in Server Components.',
      'Calling cookies() opts the route segment into dynamic server-side rendering.',
    ],
    sourceTitle: 'Functions: cookies | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/api-reference/functions/cookies',
    relatedDocumentation: ['doc-route-handlers', 'doc-fetching-data'],
    relatedMigrations: ['mig-async-request-apis', 'mig-14-to-15'],
  },
]

export const migrationGuideData: MigrationGuideDoc[] = [
  {
    id: 'mig-14-to-15',
    title: 'Upgrading from Next.js 14 to Next.js 15',
    slug: 'upgrade-nextjs-14-to-15',
    product: 'Next.js',
    fromVersion: '14.x',
    toVersion: '15.x',
    summary:
      'Essential transition guide for migrating projects from Next.js 14 to Next.js 15, detailing React 19 support, asynchronous request APIs, and new caching defaults.',
    breakingChanges: [
      'fetch requests are no longer cached by default (now default to cache: "no-store")',
      'GET Route Handlers are no longer cached by default',
      'Runtime request APIs cookies(), headers(), params, and searchParams are now asynchronous Promises',
      'Client Router Cache default staleTime for dynamic routes changed from 30s to 0s',
      'Minimum supported React version is React 19',
    ],
    migrationStepsLines: [
      '## Step 1: Upgrade Dependencies',
      'Update Next.js, React, and React DOM in package.json to Next.js 15 and React 19.',
      'Run npm install next@15 react@19 react-dom@19 or use the official upgrade codemod.',
      '## Step 2: Run the Official Next.js 15 Codemod',
      'Execute npx @next/codemod@canary upgrade next-15 to automatically transform synchronous cookies, headers, and params access into asynchronous calls.',
      '## Step 3: Audit Data Fetching Caching',
      'Inspect your fetch requests. If your application relied on Next.js 14 default fetch caching, explicitly add { cache: "force-cache" } or next: { revalidate: 3600 }.',
      '## Step 4: Update Route Handlers',
      'If your GET route handlers need static caching, add export const dynamic = "force-static". Ensure all context.params accesses are awaited.',
      '## Step 5: Test Client Components and Form States',
      'If using useFormState from react-dom, replace it with useActionState imported from react.',
    ],
    affectedFeatures: [
      'Caching Defaults',
      'Async Request APIs',
      'React 19',
      'Route Handlers',
      'Client Router Cache',
    ],
    sourceTitle: 'Upgrading: Version 15 | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/upgrading/version-15',
    affectedApis: ['api-cookies', 'api-route-handler', 'api-revalidate-path'],
    relatedDocumentation: ['doc-caching', 'doc-fetching-data', 'doc-app-router'],
    relatedReleaseNotes: ['rel-nextjs-15-0', 'rel-react-19-nextjs'],
  },
  {
    id: 'mig-15-to-16',
    title: 'Upgrading from Next.js 15 to Next.js 16',
    slug: 'upgrade-nextjs-15-to-16',
    product: 'Next.js',
    fromVersion: '15.x',
    toVersion: '16.x',
    summary:
      'Upgrade path from Next.js 15 to Next.js 16, introducing the official Proxy convention in place of Middleware, Turbopack for production builds, and refined cache controls.',
    breakingChanges: [
      'middleware.ts file convention deprecated and replaced by proxy.ts',
      'The named function export in the interceptor file is renamed from middleware() to proxy()',
      'Turbopack is the default bundler for both development and production builds',
      'Strict runtime enforcement of asynchronous params across all page and layout components',
    ],
    migrationStepsLines: [
      '## Step 1: Update Next.js Version',
      'Upgrade dependencies to Next.js 16 using npm install next@16 react@19 react-dom@19.',
      '## Step 2: Migrate Middleware to Proxy',
      'Run the codemod npx @next/codemod@canary middleware-to-proxy. This renames middleware.ts to proxy.ts and updates the exported function signature to export function proxy().',
      '## Step 3: Validate Turbopack Build Compatibility',
      'Run next build --turbo to confirm all webpack-specific plugins have corresponding Turbopack equivalents or configurations.',
      '## Step 4: Verify Asynchronous Params Usage',
      'Ensure no legacy synchronous access to params or searchParams remains in any App Router file.',
    ],
    affectedFeatures: [
      'Proxy',
      'Middleware',
      'Turbopack Production',
      'Edge Interception',
      'Async Params',
    ],
    sourceTitle: 'Upgrading: Version 16 | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/upgrading/version-16',
    affectedApis: ['api-proxy-handler'],
    relatedDocumentation: ['doc-proxy', 'doc-project-structure', 'doc-app-router'],
    relatedReleaseNotes: ['rel-nextjs-16-0'],
  },
  {
    id: 'mig-middleware-to-proxy',
    title: 'Migrating from Middleware to Proxy in Next.js 16',
    slug: 'migrating-middleware-to-proxy',
    product: 'Next.js',
    fromVersion: '15.x',
    toVersion: '16.x',
    summary:
      'Focused guide on transitioning root edge interceptors from middleware.ts to proxy.ts, explaining rationale, codemod usage, and configuration differences.',
    breakingChanges: [
      'File name changed from middleware.ts to proxy.ts',
      'Exported handler changed from export function middleware(request) to export function proxy(request)',
    ],
    migrationStepsLines: [
      '## Why the Name Changed',
      'Next.js originally named the edge interceptor "Middleware", but developers frequently confused it with traditional server request-response pipelines (like Express middleware).',
      'In Next.js 16, it is named "Proxy" to clearly indicate that it acts as an edge proxy routing layer in front of the application server.',
      '## Automatic Migration via Codemod',
      'Run: npx @next/codemod@canary middleware-to-proxy',
      'The codemod renames middleware.ts (or src/middleware.ts) to proxy.ts and updates the export signature.',
      '## Manual Migration Checklist',
      '- Rename middleware.ts (or middleware.js) to proxy.ts (or proxy.js).',
      '- Change export function middleware(request: NextRequest) to export function proxy(request: NextRequest).',
      '- Keep your export const config = { matcher: [...] } unchanged.',
      '- Verify redirects and header manipulation tests pass under next build.',
    ],
    affectedFeatures: ['Middleware', 'Proxy', 'Edge Routing', 'Request Interception'],
    sourceTitle: 'Upgrading: Middleware to Proxy Migration | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/upgrading/version-16#middleware-to-proxy',
    affectedApis: ['api-proxy-handler'],
    relatedDocumentation: ['doc-proxy', 'doc-project-structure'],
    relatedReleaseNotes: ['rel-nextjs-16-0'],
  },
  {
    id: 'mig-async-request-apis',
    title: 'Migrating Synchronous Request APIs to Asynchronous in Next.js 15',
    slug: 'migrating-async-request-apis',
    product: 'Next.js',
    fromVersion: '14.x',
    toVersion: '15.x',
    summary:
      'Technical breakdown of why cookies(), headers(), params, and searchParams became asynchronous in Next.js 15, and how to update components and route handlers.',
    breakingChanges: [
      'cookies() returns a Promise<ReadonlyRequestCookies> instead of ReadonlyRequestCookies',
      'headers() returns a Promise<ReadonlyHeaders> instead of ReadonlyHeaders',
      'Page and Layout component props: params is now Promise<Params>',
      'Page component props: searchParams is now Promise<SearchParams>',
      'Route handler context.params is now Promise<Params>',
    ],
    migrationStepsLines: [
      '## Motivation Behind the Change',
      'Making request-specific APIs asynchronous allows Next.js to start rendering and streaming pages before request headers or cookie headers have completely finished transferring.',
      'It also unlocks partial prerendering (PPR) optimizations where static portions render ahead of request-time data.',
      '## Updating cookies() and headers()',
      '- Before: const cookieStore = cookies()',
      '- After: const cookieStore = await cookies()',
      '## Updating Page and Layout Params',
      '- Before: export default function Page({ params }: { params: { id: string } }) { return <div>{params.id}</div> }',
      '- After: export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <div>{id}</div> }',
      '## Client Component searchParams',
      'In Client Components, access query parameters using the useSearchParams() hook or unwrap the searchParams promise using React 19 React.use().',
    ],
    affectedFeatures: ['cookies()', 'headers()', 'params', 'searchParams', 'Streaming'],
    sourceTitle: 'Upgrading: Async Request APIs | Next.js Documentation',
    sourceUrl: 'https://nextjs.org/docs/app/building-your-application/upgrading/version-15#async-request-api-breaking-change',
    affectedApis: ['api-cookies', 'api-route-handler', 'api-generate-metadata'],
    relatedDocumentation: ['doc-fetching-data', 'doc-route-handlers'],
    relatedReleaseNotes: ['rel-nextjs-15-0'],
  },
]

export const releaseNoteData: ReleaseNoteDoc[] = [
  {
    id: 'rel-nextjs-15-0',
    title: 'Next.js 15.0 Release',
    version: '15.0.0',
    product: 'Next.js',
    releaseDate: '2024-10-21',
    summary:
      'Next.js 15 GA introduces support for React 19, asynchronous request APIs, uncached fetch defaults, Turbopack for development stability, and the new after() background task API.',
    changesLines: [
      '## Major Highlights of Next.js 15',
      '- React 19 Support: Full compatibility with React 19 RC and GA, including Server Actions, useActionState, and useOptimistic.',
      '- Uncached Defaults: fetch requests, GET route handlers, and client navigation are uncached by default, creating more predictable application behaviors.',
      '- Async Request APIs: cookies(), headers(), params, and searchParams transitioned to asynchronous Promises.',
      '- Turbopack Development: Declared stable for next dev, yielding up to 76.7% faster local server startup and up to 96.3% faster fast refresh.',
      '- New after() API: Introduced experimental after() function to execute background logging and analytics after a response has finished streaming.',
      '- Static Route Indicator: Visual badge displayed in development to show whether a page is statically rendered or dynamically generated.',
    ],
    breakingChanges: [
      'fetch requests are no longer cached by default',
      'In Next.js 15, GET Route Handlers changed to uncached by default.',
      'cookies(), headers(), params, and searchParams are asynchronous',
      'Client Router Cache staleTime for dynamic pages changed from 30s to 0s',
    ],
    deprecatedFeatures: ['Synchronous access to cookies() and headers()'],
    affectedFeatures: ['React 19', 'Caching', 'Turbopack Dev', 'after() API', 'Async Request APIs'],
    sourceTitle: 'Next.js 15 | Next.js Blog',
    sourceUrl: 'https://nextjs.org/blog/next-15',
    affectedApis: ['api-cookies', 'api-route-handler', 'api-use-server'],
    relatedDocumentation: ['doc-caching', 'doc-fetching-data', 'doc-app-router'],
    migrationGuides: ['mig-14-to-15', 'mig-async-request-apis'],
  },
  {
    id: 'rel-nextjs-15-1',
    title: 'Next.js 15.1 Release',
    version: '15.1.0',
    product: 'Next.js',
    releaseDate: '2024-12-19',
    summary:
      'Next.js 15.1 upgrades to React 19 General Availability, adds authorization primitives forbidden() and unauthorized(), and improves Turbopack build diagnostics.',
    changesLines: [
      '## Key Additions in Next.js 15.1',
      '- React 19 GA: Officially upgrades bundled dependencies to React 19 GA.',
      '- forbidden() and unauthorized(): New navigation functions that trigger dedicated forbidden.tsx (HTTP 403) and unauthorized.tsx (HTTP 401) boundary files.',
      '- Turbopack Memory Improvements: Reduced memory footprint during long-lived dev sessions.',
      '- Improved Error Stacks: Clearer attribution of Server Component stack traces to original source code lines.',
    ],
    breakingChanges: [],
    deprecatedFeatures: [],
    affectedFeatures: ['React 19 GA', 'forbidden()', 'unauthorized()', 'Turbopack'],
    sourceTitle: 'Next.js 15.1 | Next.js Blog',
    sourceUrl: 'https://nextjs.org/blog/next-15-1',
    affectedApis: ['api-not-found', 'api-redirect'],
    relatedDocumentation: ['doc-error-handling'],
    migrationGuides: ['mig-14-to-15'],
  },
  {
    id: 'rel-nextjs-15-2',
    title: 'Next.js 15.2 Release',
    version: '15.2.0',
    product: 'Next.js',
    releaseDate: '2025-02-26',
    summary:
      'Next.js 15.2 brings experimental View Transitions support, an overhauled developer error overlay, faster Turbopack cold starts, and enhanced streaming error diagnostics.',
    changesLines: [
      '## Highlights in Next.js 15.2',
      '- View Transitions Support: Experimental integration with browser View Transitions API for smooth animated page navigation.',
      '- Redesigned Error Overlay: Provides contextual recommendations, direct links to documentation, and hydration diff previews.',
      '- Cold Start Turbopack Tuning: Turbopack boots even faster on massive repositories with thousands of routes.',
      '- Enhanced Streaming Diagnostics: Displays helpful warning telemetry when slow database calls block Suspense streaming boundaries.',
    ],
    breakingChanges: [],
    deprecatedFeatures: [],
    affectedFeatures: ['View Transitions', 'Error Overlay', 'Turbopack', 'Streaming Diagnostics'],
    sourceTitle: 'Next.js 15.2 | Next.js Blog',
    sourceUrl: 'https://nextjs.org/blog/next-15-2',
    affectedApis: ['api-route-handler'],
    relatedDocumentation: ['doc-loading-ui-and-streaming', 'doc-error-handling'],
    migrationGuides: ['mig-14-to-15'],
  },
  {
    id: 'rel-nextjs-16-0',
    title: 'Next.js 16.0 Release',
    version: '16.0.0',
    product: 'Next.js',
    releaseDate: '2025-10-15',
    summary:
      'Next.js 16 introduces the Proxy edge network layer replacing legacy Middleware, default Turbopack build engine for production, and deep React 19 compiler optimizations.',
    changesLines: [
      '## What is New in Next.js 16',
      '- Proxy Convention: Formally replaces middleware.ts with proxy.ts to provide clearer semantics for edge network routing.',
      '- Turbopack Default: Turbopack replaces Webpack as the default compiler for next build across all projects.',
      '- React Compiler Integration: Seamless native support for automatic memoization without manual useMemo and useCallback hooks.',
      '- Strict Async Enforcement: Legacy synchronous access patterns for params and headers are fully removed.',
    ],
    breakingChanges: [
      'middleware.ts convention deprecated and replaced by proxy.ts',
      'Removal of legacy synchronous request APIs',
      'Webpack fallback requires explicit next.config configuration',
    ],
    deprecatedFeatures: ['middleware.ts convention'],
    affectedFeatures: ['Proxy', 'Turbopack Production', 'React Compiler', 'Edge Runtime'],
    sourceTitle: 'Next.js 16 | Next.js Blog',
    sourceUrl: 'https://nextjs.org/blog/next-16',
    affectedApis: ['api-proxy-handler'],
    relatedDocumentation: ['doc-proxy', 'doc-project-structure', 'doc-app-router'],
    migrationGuides: ['mig-15-to-16', 'mig-middleware-to-proxy'],
  },
  {
    id: 'rel-react-19-nextjs',
    title: 'React 19 Integration and Architecture in Next.js',
    version: '15.x / React 19',
    product: 'Next.js',
    releaseDate: '2024-10-21',
    summary:
      'Overview of React 19 primitives deeply integrated into the Next.js App Router, covering Actions, useActionState, useOptimistic, the use() hook, and hydration improvements.',
    changesLines: [
      '## React 19 Primitives in Next.js',
      '- Server Actions: Native integration with React 19 Actions for form submissions and mutation workflows.',
      '- useActionState: Replaces the older useFormState hook, managing action state, pending indicators, and optimistic rollbacks.',
      '- useOptimistic: Allows client components to optimistically display expected server mutation states immediately while the server action executes.',
      '- The use() Hook: Supports unwrapping promises directly inside React render trees in combination with Suspense.',
      '- Simplified Ref Handling: ref is now a standard prop; forwardRef is no longer required for function components.',
      '- Hydration Error Diffing: React 19 produces descriptive visual diffs highlighting exact mismatches between server-rendered HTML and client hydration.',
    ],
    breakingChanges: [
      'useFormState is deprecated in favor of useActionState',
      'forwardRef is deprecated in favor of ref as a standard prop',
    ],
    deprecatedFeatures: ['forwardRef', 'useFormState'],
    affectedFeatures: ['React 19', 'Server Actions', 'useActionState', 'useOptimistic', 'Hydration Diffing'],
    sourceTitle: 'React 19 in Next.js | Next.js Blog',
    sourceUrl: 'https://nextjs.org/blog/next-15-rc#react-19',
    affectedApis: ['api-use-client', 'api-use-server'],
    relatedDocumentation: ['doc-server-and-client-components', 'doc-fetching-data'],
    migrationGuides: ['mig-14-to-15'],
  },
]
