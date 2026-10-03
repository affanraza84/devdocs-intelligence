import { Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <div className="relative pt-8 pb-6 text-center">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 flex justify-center overflow-hidden">
        <div className="h-64 w-[500px] rounded-full bg-gradient-to-tr from-indigo-600/15 to-purple-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Challenge badge */}
        <div className="mb-4 inline-flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          <span className="font-medium">Sanity Context MCP Challenge</span>
          <span className="text-indigo-400/50">•</span>
          <span className="text-slate-300">Next.js Developer Intelligence</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-5xl">
          DevDocs Intelligence
        </h1>

        <p className="mt-3 text-lg font-medium text-slate-200 sm:text-xl">
          Your AI interface for structured Next.js documentation.
        </p>

        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-400 sm:text-base leading-relaxed">
          Ask complex framework questions and get version-aware answers grounded in
          documentation, API references, migration guides, and release notes.
        </p>
      </div>
    </div>
  )
}
