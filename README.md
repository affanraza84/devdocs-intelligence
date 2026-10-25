# DevDocs Intelligence

DevDocs Intelligence is a version-aware developer documentation intelligence agent powered by Google Gemini, Sanity structured content, Sanity Knowledge Base, and Sanity Context MCP. It transforms technical documentation from static text into an interconnected, queryable knowledge graph capable of answering complex, multi-version framework questions about Next.js with grounded citations and live tool provenance.

## Demo

- **Repository**: [https://github.com/affanraza84/devdocs-intelligence](https://github.com/affanraza84/devdocs-intelligence)
- **Deployment**: The production web frontend is built with Next.js and deployed on Vercel, with all LLM and Sanity Context MCP interactions handled through secure server-side streaming routes.
- **Interactive Experience**: Users can run sample framework queries or enter custom questions to see real-time streaming answers, inspect live MCP tool calls (`initial_context`, `knowledge_base_read`), review grounded Sanity document citations, and explore version-specific changes across Next.js 14, 15, and 16.

## What I Built

DevDocs Intelligence is an agentic documentation assistant designed for frontend engineers navigating breaking changes, deprecated conventions, and framework evolution. Rather than treating documentation as flat markdown pages or unindexed text blobs, DevDocs Intelligence treats technical documentation as typed, relational content.

Key distinctions of this approach include:

- **Relational vs. Flat Retrieval**: Traditional documentation search relies on keyword matches or naive chunk embeddings that lack structural awareness. DevDocs Intelligence models APIs, conceptual guides, migrations, and release notes as separate entity types connected by 128 explicit references.
- **Version Discrimination**: The agent distinguishes between behavior in Next.js 14, 15, and 16. It correctly identifies when default behaviors shift (such as caching defaults in Route Handlers or dynamic fetch stale times) and traces the upgrade path through dedicated migration guides.
- **Provenance and Grounding**: Every streamed response links back to authentic Sanity documents, displaying the document type, title, and target version tag.

## Why Sanity?

Standard vector databases flatten rich technical documentation into plain text chunks, stripping away hierarchy, type semantics, and relational context. Sanity provides the foundation that makes reliable agentic retrieval possible:

- **Typed Content**: Clear schema separation ensures that API references, conceptual guides, migration steps, and release notes retain their distinct structures and validation rules.
- **Cross-Document Relationships**: First-class Sanity references (`_type: 'reference'`) link APIs directly to breaking change notices, release changelogs, and architecture guides, enabling multi-hop graph traversal.
- **Sanity Knowledge Base**: The indexed Knowledge Base (`kbU7pqSq7jdK`) provides 100% source span coverage over the curated Next.js corpus, enabling semantic search while retaining structural context.
- **Sanity Context MCP**: Hosted Model Context Protocol (MCP) server endpoints expose retrieval tools directly to the Gemini LLM, allowing the agent to inspect knowledge outlines and read full documents dynamically.
- **Content Operations**: Content updates, version additions, and relationship adjustments can be managed directly through Sanity Studio without retraining or fine-tuning models.

## Architecture

The system coordinates between the Next.js user interface, Gemini generative models, and Sanity hosted services via the Model Context Protocol:

```mermaid
flowchart TD
    User["Developer / User"] -->|"Submits Technical Question"| UI["Next.js Web Frontend / CLI"]
    UI -->|"POST Stream Request (SSE)"| ServerRoute["Next.js Route Handler (/api/chat)"]
    ServerRoute -->|"AI SDK Orchestration (streamText)"| Gemini["Gemini LLM (Agent)"]
    Gemini <-->|"MCP Protocol (HTTP Transport)"| ContextMCP["Sanity Context MCP Server"]
    ContextMCP <-->|"Semantic Search & Outline Retrieval"| KB["Sanity Knowledge Base (18 Entries)"]
    KB <-->|"Document Data & Reference Hydration"| Lake["Sanity Content Lake<br/>(30 Docs · 4 Schemas · 128 References)"]
    Gemini -->|"Streamed Answer + Tool Provenance + Sources"| ServerRoute
    ServerRoute -->|"SSE Events (status, tool_call, source, text)"| UI
    UI -->|"Markdown Rendering + Version Badges + Citations"| User
```

### Architectural Principles:

1. **Server-Side Secret Boundary**: All API keys (`GEMINI_API_KEY`, `SANITY_API_READ_TOKEN`) and MCP endpoints reside exclusively on the server runtime; zero secrets are exposed to the browser.
2. **Standardized Protocol**: Tool execution uses `@ai-sdk/mcp` over HTTP transport to connect directly to the hosted Sanity Context MCP endpoint.
3. **Multi-Step Tool Invocation**: The agent autonomously inspects outlines using `initial_context` and hydrates specific document content using `knowledge_base_read` or `knowledge_base_search`.
4. **Resilient Streaming**: The application streams responses using Server-Sent Events (SSE), streaming text deltas and tool execution metadata while isolating rate limit or demand errors.

## Structured Content Model

The Sanity schema models developer documentation across four specialized document types:

| Content Type         | Purpose                                                                                          | Key Schema Fields                                                                                                                                           | Important Relationships                                                                                                |
| :------------------- | :----------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **`documentation`**  | Conceptual architecture, guides, routing, rendering, caching, data fetching, and error recovery. | `title`, `slug`, `product`, `version`, `category`, `summary`, `content`, `tags`, `sourceTitle`, `sourceUrl`, `lastUpdated`                                  | `relatedApis` (→ `apiReference`), `relatedMigrations` (→ `migrationGuide`)                                             |
| **`apiReference`**   | Signatures, parameters, directives, return types, code examples, and known constraints.          | `name`, `slug`, `product`, `version`, `apiType`, `description`, `parameters`, `example`, `limitations`, `sourceTitle`, `sourceUrl`                          | `relatedDocumentation` (→ `documentation`), `relatedMigrations` (→ `migrationGuide`)                                   |
| **`migrationGuide`** | Version transitions, breaking changes, step-by-step migration procedures, and affected features. | `title`, `slug`, `product`, `fromVersion`, `toVersion`, `summary`, `breakingChanges`, `migrationSteps`, `affectedFeatures`, `sourceTitle`, `sourceUrl`      | `affectedApis` (→ `apiReference`), `relatedDocumentation` (→ `documentation`), `relatedReleaseNotes` (→ `releaseNote`) |
| **`releaseNote`**    | Version announcements, release dates, changelog summaries, breaking changes, and deprecations.   | `title`, `version`, `product`, `releaseDate`, `summary`, `changes`, `breakingChanges`, `deprecatedFeatures`, `affectedFeatures`, `sourceTitle`, `sourceUrl` | `affectedApis` (→ `apiReference`), `relatedDocumentation` (→ `documentation`), `migrationGuides` (→ `migrationGuide`)  |

References between these types establish **128 bidirectional reference links**, allowing the agent to navigate from a high-level guide to an exact API signature and its corresponding migration notes.

## Sanity Knowledge Base

The documentation corpus is indexed within the Sanity Knowledge Base:

- **Target Dataset**: `production` (Sanity Project ID: `0ovd9f2s`)
- **Document Count**: 30 curated documents (12 `documentation`, 9 `apiReference`, 4 `migrationGuide`, 5 `releaseNote`)
- **Knowledge Base ID**: `kbU7pqSq7jdK`
- **Knowledge Base Entries**: 18 structured entries covering core framework domains
- **Source Span Coverage**: 100% source span coverage in the successful Knowledge Base build
- **Retrieval Mechanism**: The Knowledge Base indexes document text and structure, allowing Sanity Context MCP to return concise outlines, entry paths, and content sections with reference links intact.

## How the Agent Works

The agent query workflow executes in eight steps:

1. **User Query**: The developer submits a question via the web interface or CLI.
2. **Analysis**: Gemini analyzes the question and determines the required domain knowledge (e.g., caching defaults, route handling, migration changes).
3. **MCP Handshake**: The agent connects to the Sanity Context MCP endpoint using bearer token authentication over HTTP transport.
4. **Context Discovery**: The agent calls `initial_context` to inspect available knowledge base outlines and discover relevant entry paths.
5. **Targeted Retrieval**: The agent calls `knowledge_base_read` or `knowledge_base_search` to retrieve the relevant document bodies and Portable Text blocks.
6. **Graph Traversal**: When resolving cross-version questions, the agent reads linked documents referenced across `affectedApis`, `relatedMigrations`, and `relatedDocumentation`.
7. **Grounded Synthesis**: Gemini synthesizes a version-aware answer strictly grounded in the retrieved content, avoiding hallucinated APIs or outdated conventions.
8. **UI Streaming & Attribution**: The web interface streams the markdown response in real time, displays live MCP tool invocation badges, and renders source cards linked to the referenced Sanity documents.

## Example Queries

The system has been evaluated on multi-document technical queries:

### 1. Dynamic StaleTime & Caching Defaults

> _"What is the default dynamic staleTime in Next.js 15 and how did it change from previous versions?"_

- **Structured Knowledge Required**: Traverses `documentation` (App Router Caching Architecture), `releaseNote` (Next.js 15.0 GA), and `migrationGuide` (Next.js 14 → 15 Upgrade) to explain that dynamic `staleTime` changed from 30 seconds in Next.js 14 to 0 seconds in Next.js 15 for the Client Router Cache.

### 2. Multi-Version Routing & Proxy Migration

> _"Explain the major routing changes between Next.js 15 and Next.js 16, including params, Route Handlers, and the transition from middleware.ts to proxy.ts."_

- **Structured Knowledge Required**: Requires cross-document synthesis linking `migrationGuide` (Middleware → Proxy Migration), `apiReference` (`proxy.js`, `route.js`), and `documentation` (Proxy Edge Layer, Routing Architecture) to detail the deprecation of `middleware.ts` in favor of `proxy.ts` and asynchronous request handling.

### 3. Route Handler Default Caching

> _"How did Route Handler caching behavior change in Next.js 15?"_

- **Structured Knowledge Required**: Combines `apiReference` (`route.js`), `documentation` (Route Handlers), and `migrationGuide` (Next.js 14 → 15) to describe how GET Route Handlers are no longer cached by default in Next.js 15 unless explicitly configured with `export const dynamic = 'force-static'`.

## Key Features

- **Gemini-Powered Agent**: Powered by Google Gemini (`gemini-2.5-flash` / `gemini-3.8-flash`) via the Vercel AI SDK (`@ai-sdk/google`).
- **Sanity Context MCP Integration**: Native MCP client integration (`@ai-sdk/mcp`) connected to hosted Sanity Context MCP endpoints.
- **Knowledge Base Retrieval**: High-fidelity retrieval over 18 Knowledge Base entries with 100% source span coverage.
- **Structured Content Schemas**: Four purpose-built Sanity schemas enforcing typed fields and portable text blocks.
- **Cross-Document Relationships**: 128 resolved references allowing cross-entity traversal.
- **Version-Aware Answers**: Accurate comparative discrimination across Next.js 14, 15, and 16.
- **Real-Time Streaming**: Chunked SSE streaming with live progress status and tool invocation tracking.
- **Grounded Source Attribution**: UI displays verified citations with document titles, paths, and version tags.
- **Resilient Error Handling**: Specific user-facing recovery messages for rate limits, demand surges, and network timeouts.
- **Server-Side Security**: Full protection of API tokens and endpoints with zero browser credential exposure.

## Tech Stack

| Layer                   | Technologies                                                                                                  |
| :---------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend**            | Next.js (App Router), TypeScript, Tailwind CSS, Lucide React, React Markdown, Remark GFM                      |
| **AI & Agent**          | Google Gemini (`gemini-2.5-flash`, `gemini-3.8-flash`), Vercel AI SDK (`ai`, `@ai-sdk/google`, `@ai-sdk/mcp`) |
| **Content Lake**        | Sanity Studio v3 (`sanity`, `@sanity/structure`, `@sanity/vision`, `@sanity/client`)                          |
| **Retrieval & Context** | Sanity Knowledge Base (`kbU7pqSq7jdK`), Sanity Context MCP                                                    |
| **Deployment**          | Vercel (Web Application), Sanity Managed Cloud (Studio & Content Lake)                                        |

## Project Structure

```text
devdocs-intelligence/
├── docs/
│   └── content-ingestion.md      # Detailed documentation of the ingestion pipeline
├── frontend/                     # Next.js web application
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts     # SSE streaming route with MCP agent orchestration
│   │   │   └── health/route.ts   # Agent & MCP health check endpoint
│   │   ├── globals.css           # Tailwind CSS styles and custom styling
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Main chat interface page
│   ├── components/
│   │   ├── chat/                 # Chat container, input, messages, tool badges, prompts
│   │   ├── sources/              # Grounded source cards and source drawers
│   │   └── ui/                   # Header and navigational components
│   ├── lib/
│   │   ├── agent/                # Agent streaming logic and TypeScript types
│   │   └── config/               # Server-side environment variable validation
│   ├── package.json              # Frontend dependencies and scripts
│   └── tsconfig.json             # Frontend TypeScript configuration
├── schemaTypes/                  # Sanity Studio schemas
│   ├── apiReference.ts           # API reference schema
│   ├── documentation.ts          # Conceptual documentation schema
│   ├── index.ts                  # Schema registration bundle
│   ├── migrationGuide.ts         # Version migration guide schema
│   └── releaseNote.ts            # Release note schema
├── scripts/
│   ├── data/
│   │   └── corpus.ts             # Curated Next.js documentation corpus (30 documents)
│   ├── ask-agent.ts              # Standalone CLI agent query script
│   └── seed-nextjs.ts            # 4-phase idempotent Sanity seed pipeline
├── src/
│   └── agent/                    # Standalone agent server and configuration
│       ├── agent.ts              # Agent execution logic
│       ├── config.ts             # Environment validation and config
│       ├── sanity-client.ts      # Configured Sanity client instance
│       └── server.ts             # Standalone HTTP agent server
├── .env.example                  # Environment configuration template
├── package.json                  # Root dependencies and Sanity Studio scripts
├── sanity.cli.ts                 # Sanity CLI configuration
├── sanity.config.ts              # Sanity Studio configuration
└── tsconfig.json                 # Studio TypeScript configuration
```

## Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/affanraza84/devdocs-intelligence.git
cd devdocs-intelligence
```

### 2. Configure Environment Variables

Copy `.env.example` in the project root:

```bash
cp .env.example .env
```

And in the `frontend` directory:

```bash
cp frontend/.env.example frontend/.env
```

Fill in the required server-side credentials:

```env
SANITY_API_READ_TOKEN=your_sanity_read_token
SANITY_CONTEXT_MCP_URL=https://api.sanity.io/v1/context/organizations/oyl832pn4/mcp/devdocs-gemini-agent
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies

Install root workspace dependencies (Sanity Studio, agent scripts):

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend && npm install && cd ..
```

### 4. Run Development Servers

To start the **Sanity Studio** locally (port 3333):

```bash
npm run dev
```

To start the **Next.js Web Frontend** locally (port 3000):

```bash
cd frontend
npm run dev
```

To query the agent directly via the **CLI runner**:

```bash
npm run agent:ask -- "What changed with Route Handlers in Next.js 15?"
```

To run the **standalone agent HTTP server** (port 3001):

```bash
npm run agent:server
```

### 5. Build for Production

To build the Sanity Studio bundle:

```bash
npm run build
```

To build the Next.js web application:

```bash
cd frontend
npm run build
```

## Production-Grade Agent Architecture

The agent architecture is decoupled into cohesive, maintainable modules located in `frontend/lib/agent/` and shared with the standalone agent server and CLI runner:

- **Runtime Schema Validation (`validation.ts`)**: Built with Zod to enforce strict boundary validation. Rejects empty prompts, whitespace-only queries, prompts exceeding 4,000 characters, corrupted message structures, invalid roles, and oversized payloads exceeding 64KB (mitigating memory denial-of-service).
- **MCP Client Lifecycle Management (`mcp-manager.ts`)**: Encapsulates hosted Sanity Context MCP connections within a `ManagedMcpSession`. Enforces connection timeouts, handles transient socket errors with retries, guarantees idempotent client cleanup (`close()`) across success, failure, and client abort scenarios, and cleans up active timer handles.
- **Source Normalization & Provenance (`sources.ts`)**: Parses Sanity knowledge base paths into structured `GroundedSource` instances (`migrationGuide`, `apiReference`, `releaseNote`, `documentation`), formats titles, identifies target framework versions (14.x, 15.x, 16.x), and deduplicates sources from tool calls and Markdown headings.
- **Error Categorization & Sanitization (`errors.ts`)**: Distinguishes transient errors (Gemini 429 rate limit, 503 service unavailable, network timeout, ECONNRESET) from permanent failures (400 validation, 401 unauthorized, 499 aborted). Sanitizes client-facing error payloads by stripping API keys, Sanity tokens, credentials, and internal stack traces.
- **Safe Exponential Retries (`retry.ts`)**: Provides safe retries with exponential backoff and jitter strictly for transient failures. Never retries permanent errors or aborted requests, preventing cascading failure stampedes.
- **In-Memory Rate Limiting (`rate-limiter.ts`)**: Implements sliding-window request quotas per client identifier (default 30 requests/minute) with standard HTTP headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, `Retry-After`) and automated stale record pruning.
- **Structured Server-Side Logging (`logger.ts`)**: Outputs JSON-formatted server logs with unique `x-request-id` correlation IDs, duration measurements, and metadata sanitization. Complete user conversations and prompt bodies are never logged by default.
- **Unified Model Orchestration (`orchestration.ts`)**: Connects Gemini via `@ai-sdk/google` and hosted Sanity Context MCP via `@ai-sdk/mcp`. Binds execution step bounds (`stopWhen: stepCountIs(maxSteps)`), request cancellation via `AbortSignal`, and automatic resource cleanup.

```mermaid
flowchart TD
    Req["Incoming HTTP / SSE Request"] --> Ratelimit["Rate Limiter (Sliding Window)"]
    Ratelimit -->|"Allowed"| Validator["Zod Payload & Size Validator"]
    Ratelimit -->|"Exceeded"| Err429["429 Rate Limit Response"]
    Validator -->|"Valid"| Orchestrator["Orchestrator + ManagedMcpSession"]
    Validator -->|"Invalid"| Err400["400 Validation Error"]
    Orchestrator --> Retry["Transient Retry Engine"]
    Retry --> MCP["Sanity Context MCP (Connection Timeout)"]
    Retry --> Gemini["Gemini Model (Step Limit: 8)"]
    Gemini --> Normalizer["Source Normalizer & Deduplicator"]
    Normalizer --> SSE["Typed SSE Stream (status, tool_call, source, text, done)"]
    Orchestrator -.->|"Client Disconnect / Timeout"| Cleanup["Guaranteed MCP Client Cleanup"]
```

## Environment Variables

The following environment variables are utilized across the root project and frontend. All values must remain server-side:

| Variable Name             | Required | Scope            | Default              | Purpose                                                                             |
| :------------------------ | :------- | :--------------- | :------------------- | :---------------------------------------------------------------------------------- |
| `SANITY_API_READ_TOKEN`   | Yes      | Server           | —                    | Bearer token for authenticating with the hosted Sanity Context MCP endpoint.        |
| `SANITY_CONTEXT_MCP_URL`  | Yes      | Server           | hosted endpoint      | URL endpoint for the hosted Sanity Context MCP service.                             |
| `GEMINI_API_KEY`          | Yes      | Server           | —                    | Google Generative AI API key for invoking the Gemini model.                         |
| `GEMINI_MODEL`            | Optional | Server           | `gemini-3.8-flash`   | Target Gemini model identifier.                                                     |
| `SANITY_PROJECT_ID`       | Optional | Studio / Scripts | `0ovd9f2s`           | Sanity project identifier.                                                          |
| `SANITY_DATASET`          | Optional | Studio / Scripts | `production`         | Target dataset.                                                                     |
| `SANITY_API_VERSION`      | Optional | Studio / Scripts | `2026-01-01`         | Sanity API version date.                                                            |
| `SANITY_WRITE_TOKEN`      | Optional | Seed Pipeline    | —                    | API token with write permissions for seeding corpus data.                           |
| `RATE_LIMIT_MAX_REQUESTS` | Optional | Server           | `30`                 | Maximum allowed requests per client within the rate limit window.                   |
| `RATE_LIMIT_WINDOW_MS`    | Optional | Server           | `60000`              | Rate limit window in milliseconds (1 minute).                                       |
| `SANITY_MCP_TIMEOUT_MS`   | Optional | Server           | `15000`              | Connection timeout in milliseconds for initializing the Sanity Context MCP client.  |
| `REQUEST_TIMEOUT_MS`      | Optional | Server           | `55000`              | Server-side request timeout in milliseconds (safely below Vercel's 60s maxDuration).|
| `AGENT_MAX_STEPS`         | Optional | Server           | `8`                  | Maximum multi-step execution limit for tool calling per prompt.                     |
| `ALLOWED_ORIGIN`          | Optional | Server           | `*`                  | Allowed CORS origin for cross-origin browser clients.                               |
| `PORT`                    | Optional | Agent Server     | `3001`               | Port for the standalone agent server.                                               |

_Note: None of these variables should be prefixed with `NEXT_PUBLIC_`._

## Deployment & Serverless Limitations

- **Vercel Serverless Function Execution Limits**: Next.js API route handlers have execution time bounds (`maxDuration = 60` seconds on Vercel Hobby/Pro). To prevent timeouts, the agent enforces an internal `REQUEST_TIMEOUT_MS` (default 55s) and `stopWhen: stepCountIs(8)` execution limit.
- **Streaming Transfer & Client Cancellation**: Browser tab closures and client aborts propagate through `req.signal`, triggering immediate cancellation of LLM streams and deterministic closure of Sanity MCP sessions.
- **In-Memory Rate Limiting**: The built-in rate limiter operates in-memory per serverless instance. For horizontally scaled multi-region serverless deployments, an external state store (such as Upstash Redis or Vercel KV) is recommended.
- **Outbound Network Connectivity**: The serverless runtime must have outbound HTTPS access to `api.sanity.io` and Google Generative AI endpoints.

## Automated Testing Suite

The project includes an automated test suite verifying all reliability and agent architecture requirements with mocked external dependencies (no live credentials or network access required):

```bash
# Run tests from the repository root
npm test

# Run tests from the frontend directory
cd frontend && npm test
```

### Test Coverage (33 Automated Tests):
- **Request Payload Validation (`tests/validation.test.ts`)**: Valid prompts, message histories, empty/whitespace prompt rejection, 4,000 character bounds, 50-message history bounds, invalid role rejection, 64KB payload DOS protection.
- **Source Normalization (`tests/sources.test.ts`)**: Path categorization, version extraction (14.x, 15.x, 16.x), title formatting, heading extraction from Portable Text/Markdown, deduplication.
- **Error Sanitization (`tests/errors.test.ts`)**: Token masking (`[REDACTED_SANITY_TOKEN]`, `[REDACTED_GEMINI_KEY]`), user path stripping, transient vs. permanent error classification, HTTP status code mapping (400, 429, 499, 503, 504, 500).
- **Rate Limiting (`tests/rate-limiter.test.ts`)**: Quota enforcement, decrementing tokens, header calculations, client isolation, reset operations.
- **Safe Retries (`tests/retry.test.ts`)**: Transient 503/429 retries with exponential backoff, immediate rejection of permanent errors (validation, 401), cancellation handling.
- **MCP Client Lifecycle (`tests/mcp-manager.test.ts`)**: Tool retrieval, failure wrapping, idempotent close handling, immediate cleanup on AbortSignal.
- **Timeouts & Cancellation (`tests/cancellation-timeout.test.ts`)**: AbortSignal propagation to MCP sessions, request timeout handling, resource disposal.
- **Streaming Event Sequencing (`tests/stream-events.test.ts`)**: Typed SSE event ordering (`status` → `tool_call` → `source` → `text` → `done`), terminal error events.

## Sanity Challenge

This project was built for the **DEV Community Sanity Challenge 2026** under **Path One: "Ship an agent that queries real content."**

It demonstrates how Sanity fulfills the requirements of real-world agentic retrieval:

- **Real Content in Sanity**: 30 comprehensive documents covering the architecture and evolution of Next.js 14, 15, and 16.
- **Structured Content Types**: Four distinct schemas (`documentation`, `apiReference`, `migrationGuide`, `releaseNote`) modeling technical information with semantic fidelity.
- **Sanity Knowledge Base**: 18 Knowledge Base entries with 100% source span coverage.
- **Sanity Context MCP**: Hosted MCP integration serving as the direct bridge between Gemini and Sanity content.
- **Grounded Multi-Document Answers**: Demonstrates knowledge synthesis and reference traversal rather than naive text matching.

## Future Improvements

- **Automatic Webhook Synchronization**: Trigger automated Knowledge Base re-indexing when documents are published or updated in Sanity Studio.
- **Interactive Graph Visualizer**: Render an interactive graph visualization of traversed references directly within the web interface.
- **Multi-Framework Corpus**: Expand the schema and corpus to index adjacent ecosystems such as React 19 and Sanity Studio v3 APIs.
- **Inline Citation Highlighting**: Highlight exact matching text spans within Portable Text blocks directly inside the source cards.

## License

This project is marked as `UNLICENSED` in `package.json` (Private / All Rights Reserved).
