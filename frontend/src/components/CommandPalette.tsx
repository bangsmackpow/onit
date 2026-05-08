'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Package, 
  CheckSquare, 
  ArrowRight,
  Command,
  Zap,
  BookOpen,
  LifeBuoy
} from 'lucide-react'
import { apiGet } from '@/lib/apiClient'
import { clsx } from 'clsx'

interface SearchResult {
  id: string
  type: 'asset' | 'task' | 'knowledge'
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
        const [assetsRes, tasksRes, knowledgeRes] = await Promise.all([
          apiGet('/api/assets'),
          apiGet('/api/tasks'),
          apiGet(`/api/knowledge/search?q=${query}`)
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
            subtitle: `Protocol • ${t.asset_name}`,
            url: `/tasks`
          }))

        const knowledge = (knowledgeRes.data.articles || [])
          .map((art: any) => ({
            id: art.id,
            type: 'knowledge',
            title: art.title,
            subtitle: `Guide • ${art.category}`,
            url: `/knowledge/detail?id=${art.id}`
          }))

        setResults([...knowledge, ...assets, ...tasks].slice(0, 10))
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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center px-8 py-6 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-6 h-6 text-slate-400 mr-4" />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-xl text-slate-900 placeholder:text-slate-400 font-bold"
            placeholder="Search protocols, assets, or guides..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {loading && !results.length ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Consulting Archives...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  className={clsx(
                    "w-full flex items-center justify-between p-5 rounded-2xl transition-all group text-left",
                    index === selectedIndex ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "hover:bg-slate-50 text-slate-400"
                  )}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-5">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                      index === selectedIndex ? "bg-white/20" : "bg-slate-100 text-slate-400"
                    )}>
                      {result.type === 'asset' ? <Package className="w-6 h-6" /> : result.type === 'task' ? <CheckSquare className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className={clsx("font-black text-lg tracking-tight", index === selectedIndex ? "text-white" : "text-slate-900")}>{result.title}</p>
                      <p className={clsx("text-[10px] font-black uppercase tracking-widest mt-0.5", index === selectedIndex ? "text-indigo-100" : "text-slate-400")}>
                        {result.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className={clsx("w-5 h-5 transition-transform", index === selectedIndex ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0")} />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                <LifeBuoy className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-2xl font-black text-slate-900 mb-2">No matching protocols</p>
              <p className="text-slate-400 font-medium">Try broadening your search criteria.</p>
            </div>
          ) : (
            <div className="py-8 space-y-10 px-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6">Common Sequences</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <QuickAction 
                    icon={Zap} 
                    title="Add Asset" 
                    subtitle="Initialize hardware" 
                    onClick={() => { router.push('/assets/new'); setIsOpen(false) }} 
                  />
                  <QuickAction 
                    icon={BookOpen} 
                    title="View Guides" 
                    subtitle="Browse library" 
                    onClick={() => { router.push('/knowledge'); setIsOpen(false) }} 
                  />
                </div>
              </div>
              
              <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 flex items-start gap-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <Command className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Neural Shortcut</p>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">
                    Press <kbd className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-xs shadow-sm mx-1">⌘K</kbd> anywhere to access the central protocol command.
                  </p>
                </div>
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
      className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all">
        <Icon className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{title}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </button>
  )
}
