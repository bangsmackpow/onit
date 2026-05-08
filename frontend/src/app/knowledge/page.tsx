'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  BookOpen, 
  Search, 
  ArrowRight,
  LifeBuoy
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface Article {
  id: string
  title: string
  category: string
  related_task_keywords: string
}

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [activeCategory])

  async function fetchArticles() {
    try {
      const url = activeCategory 
        ? `/api/knowledge?category=${activeCategory}`
        : '/api/knowledge'
      const res = await apiGet(url)
      setArticles(res.data.articles || [])
    } catch (err) {
      console.error('Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.related_task_keywords.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const categories = [
    { id: 'hvac', label: 'Air & Climate', icon: '❄️' },
    { id: 'safety', label: 'Home Safety', icon: '🛡️' },
    { id: 'lawn', label: 'Lawn & Garden', icon: '🌿' },
    { id: 'vehicle', label: 'Automotive', icon: '🚗' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-16 pb-24">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
            <LifeBuoy className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Support Archives</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
            Knowledge <span className="text-indigo-600">Base.</span>
          </h1>
          <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto">
            Step-by-step guidance for every maintenance protocol in your home.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-10">
          <div className="max-w-3xl mx-auto relative group">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Search guides (e.g. 'filter size', 'smoke detector')..."
              className="input-zen h-20 pl-20 text-xl shadow-2xl shadow-slate-100 border-slate-100"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => setActiveCategory(null)}
              className={clsx(
                "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all",
                !activeCategory ? "bg-slate-900 text-white shadow-xl" : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300"
              )}
            >
              All Guides
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  "px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3",
                  activeCategory === cat.id ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "bg-white border border-slate-100 text-slate-400 hover:border-slate-300"
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse" />)
          ) : filteredArticles.length > 0 ? (
            filteredArticles.map(article => (
              <Link 
                key={article.id} 
                href={`/knowledge/${article.id}`}
                className="zen-card group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BookOpen className="w-24 h-24 text-slate-900" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {article.category}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h3>
                  <div className="pt-4 flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                    Read Protocol <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <LifeBuoy className="w-16 h-16 text-slate-200 mx-auto" />
              <p className="text-slate-400 font-medium text-lg">No guides found matching your search.</p>
            </div>
          )}
        </div>

        {/* Suggestion CTA */}
        <div className="zen-card-priority flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Missing a guide?</h2>
            <p className="text-slate-400 font-medium">Our librarians are constantly documenting new protocols.</p>
          </div>
          <button className="btn-zen-primary bg-white text-slate-900 hover:bg-slate-100">
            Request Article
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
