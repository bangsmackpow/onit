'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  Share2,
  Bookmark,
  CheckCircle2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Article {
  id: string
  title: string
  category: string
  content_md: string
  updated_at: string
}

function ArticleDetailContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) fetchArticle()
  }, [id])

  async function fetchArticle() {
    try {
      const res = await apiGet(`/api/knowledge/${id}`)
      setArticle(res.data.article)
    } catch (err) {
      console.error('Failed to fetch article')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-10">
      <div className="h-4 bg-slate-100 w-24 rounded" />
      <div className="h-12 bg-slate-100 w-3/4 rounded-xl" />
      <div className="h-64 bg-slate-100 rounded-[2.5rem]" />
    </div>
  )

  if (!article) return (
    <div className="max-w-4xl mx-auto text-center pt-20">
      <h2 className="text-2xl font-black text-slate-900">Protocol Not Found</h2>
      <p className="text-slate-400 mt-4">The requested guide could not be located in the archives.</p>
      <button onClick={() => router.back()} className="mt-8 btn-zen-secondary inline-flex">
        <ArrowLeft className="w-4 h-4" /> Go Back
      </button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 pt-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="group flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-all font-black uppercase tracking-widest text-[10px]"
        >
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 group-hover:-translate-x-1 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Archives
        </button>
        <div className="flex items-center gap-2">
          <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all">
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Article Header */}
      <div className="space-y-6">
        <span className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600">
          {article.category} Protocol
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Updated {new Date(article.updated_at).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            4 Min Read
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="zen-card p-10 md:p-16 relative overflow-hidden">
        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tighter prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-900 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded prose-img:rounded-[2rem]">
          <ReactMarkdown>{article.content_md}</ReactMarkdown>
        </div>
        
        <div className="mt-16 pt-12 border-t border-slate-100 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h4 className="text-xl font-black text-slate-900">Protocol Mastered?</h4>
            <p className="text-slate-400 font-medium">Ready to complete your task?</p>
          </div>
          <button 
            onClick={() => router.push('/tasks')}
            className="btn-zen-primary shadow-indigo-600/10"
          >
            Back to Protocols
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ArticleDetailPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-10">
          <div className="h-4 bg-slate-100 w-24 rounded" />
          <div className="h-12 bg-slate-100 w-3/4 rounded-xl" />
          <div className="h-64 bg-slate-100 rounded-[2.5rem]" />
        </div>
      }>
        <ArticleDetailContent />
      </Suspense>
    </DashboardLayout>
  )
}
