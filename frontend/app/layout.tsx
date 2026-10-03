import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevDocs Intelligence — Next.js Structured Documentation Agent',
  description:
    'Ask complex Next.js questions and get version-aware, source-grounded answers retrieved through Sanity Context MCP and Gemini.',
  keywords: [
    'Next.js',
    'Sanity',
    'MCP',
    'Gemini',
    'Developer Documentation',
    'Knowledge Base',
    'Version-aware',
    'Next.js 15',
    'Next.js 16',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a0f] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="relative min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  )
}
