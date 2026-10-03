import { Header } from '@/components/ui/Header'
import { ChatContainer } from '@/components/chat/ChatContainer'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f] text-slate-100">
      <Header />
      <main className="flex flex-1 flex-col">
        <ChatContainer />
      </main>
      <footer className="border-t border-[#1a1f30] bg-[#07080c] py-4 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6">
          <div className="flex items-center space-x-2">
            <span>DevDocs Intelligence</span>
            <span>•</span>
            <span className="text-slate-400">Sanity Challenge 2026</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Powered by Gemini &amp; Sanity Knowledge Base
          </div>
        </div>
      </footer>
    </div>
  )
}
