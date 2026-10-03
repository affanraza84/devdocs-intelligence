# DevDocs Intelligence — Public Web Application

DevDocs Intelligence is a production-quality, version-aware developer documentation interface grounded in structured Next.js content via the hosted **Sanity Context MCP** and **Gemini**.

## Architecture

```text
Structured Sanity Content (30 docs across 4 schemas)
        ↓
Knowledge Base (kbU7pqSq7jdK: 18 KB entries, 128 relationships)
        ↓
Sanity Context MCP (Hosted tools: initial_context, knowledge_base_read, knowledge_base_search)
        ↓
Gemini Agent (@ai-sdk/mcp + @ai-sdk/google + ai streamText)
        ↓
Grounded Answer (Streamed SSE with sources and version badges)
```

## Security Model

All sensitive credentials remain strictly server-side:
- `SANITY_API_READ_TOKEN` is never sent to the browser.
- `GEMINI_API_KEY` is never sent to the browser.
- No `NEXT_PUBLIC_` secret leaks.
- All retrieval is mediated through the Next.js server route at `/api/chat`.

## Getting Started Locally

### 1. Prerequisites
- Node.js 18+ or 20+ (Node v25 verified)
- Valid `SANITY_API_READ_TOKEN` and `GEMINI_API_KEY`

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `SANITY_API_READ_TOKEN` and `GEMINI_API_KEY` are populated.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

## Features

- **Version-Aware Intelligence**: Detects and highlights version differences across Next.js 14, 15, and 16.
- **Sanity Source Grounding**: Dynamically discovers and surfaces citations from the Sanity Knowledge Base.
- **Live Tool Invocations**: Real-time inspection of MCP tools called during generation (`initial_context`, `knowledge_base_read`).
- **Markdown & Code Highlighting**: Syntax-highlighted code blocks with one-click copy buttons and typography optimized for technical documentation.
- **Suggested Queries**: Instant one-click example prompts covering caching differences, Route Handlers, middleware migrations, and cache hierarchies.
