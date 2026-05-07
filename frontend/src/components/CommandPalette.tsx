'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Package, 
  CheckSquare, 
  ArrowRight,
  Command,
  X,
  Zap
} from 'lucide-react'
import { apiGet } from '@/lib/apiClient'
import { clsx } from 'clsx'

interface SearchResult {
  id: string
  type: 'asset' | 'task' | 'history'
  title: string
  subtitle: string
  url: string
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  const toggle = useCallback(() => setIsOpen(open => !open), [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggle])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [assetsRes, tasksRes] = await Promise.all([
          apiGet('/api/assets'),
          apiGet('/api/tasks')
        ])

        const assets = (assetsRes.data.assets || [])
          .filter((a: any) => a.name.toLowerCase().includes(query.toLowerCase()))
          .map((a: any) => ({
            id: a.id,
            type: 'asset',
            title: a.name,
            subtitle: `Asset • ${a.asset_type}`,
            url: `/assets/detail?id=${a.id}`
          }))

        const tasks = (tasksRes.data.tasks || [])
          .filter((t: any) => t.task_name.toLowerCase().includes(query.toLowerCase()))
          .map((t: any) => ({
            id: t.id,
            type: 'task',
            title: t.task_name,
            subtitle: `Task • Due ${t.next_due_date}`,
            url: `/tasks`
          }))

        setResults([...assets, ...tasks].slice(0, 8))
        setSelectedIndex(0)
      } catch (err) {
        console.error('Search failed', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    router.push(result.url)
    setIsOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-[#0a0f1d] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400 mr-4" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 font-medium"
            placeholder="Search assets, tasks, or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ESC to close</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {loading && !results.length ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Searching Neural Grid...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={clsx(
                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left",
                    index === selectedIndex ? "bg-indigo-600 text-white" : "hover:bg-white/5 text-slate-400"
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      index === selectedIndex ? "bg-white/20" : "bg-white/5 text-slate-500"
                    )}>
                      {result.type === 'asset' ? <Package className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={clsx("font-bold", index === selectedIndex ? "text-white" : "text-white")}>{result.title}</p>
                      <p className={clsx("text-[10px] font-black uppercase tracking-widest mt-0.5", index === selectedIndex ? "text-indigo-200" : "text-slate-500")}>
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={clsx("w-4 h-4 transition-transform", index === selectedIndex ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <X className="w-8 h-8 text-slate-700" />
              </div>
              <p className="text-xl font-black text-white mb-2">No results found</p>
              <p className="text-slate-500 font-medium">Try searching for something else.</p>
            </div>
          ) : (
            <div className="py-8 space-y-8 px-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6">Quick Actions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QuickAction 
                    icon={Zap} 
                    title="Add New Asset" 
                    subtitle="Initialize hardware" 
                    onClick={() => { router.push('/assets/new'); setIsOpen(false) }} 
                  />
                  <QuickAction 
                    icon={CheckSquare} 
                    title="Create Task" 
                    subtitle="Schedule protocol" 
                    onClick={() => { router.push('/tasks/new'); setIsOpen(false) }} 
                  />
                </div>
              </div>
              
              <div className="p-6 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10">
                <div className="flex items-center gap-4 mb-3">
                  <Command className="w-5 h-5 text-indigo-400" />
                  <p className="text-xs font-black text-white uppercase tracking-widest">Power User Tip</p>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">⌘K</kbd> anywhere in the app to open this command bar instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon: Icon, title, subtitle, onClick }: { icon: any, title: string, subtitle: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.07] transition-all group text-left"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 group-hover:bg-indigo-600 transition-colors">
        <Icon className="w-5 h-5 text-indigo-400 group-hover:text-white" />
      </div>
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </button>
  )
}
