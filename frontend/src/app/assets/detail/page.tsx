'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient'
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Trash2, 
  Upload,
  ExternalLink,
  AlertCircle,
  Car,
  Home,
  Zap,
  ChevronRight
} from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

function AssetDetailsContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [asset, setAsset] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [id])

  async function fetchData() {
    try {
      const [assetRes, tasksRes, mediaRes] = await Promise.all([
        apiGet(`/api/assets/${id}`),
        apiGet(`/api/tasks`),
        apiGet(`/api/media/asset/${id}`)
      ])
      
      setAsset(assetRes.data.asset)
      // Filter tasks for this asset
      const assetTasks = (tasksRes.data.tasks || []).filter((t: any) => t.asset_id === id)
      setTasks(assetTasks)
      setMedia(mediaRes.data.media || [])
    } catch (err) {
      console.error('Failed to fetch asset details', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('assetId', id as string)

    try {
      await apiPost('/api/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      fetchData() // Refresh gallery
    } catch (err) {
      console.error('Upload failed', err)
      alert('Failed to upload file.')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAsset = async () => {
    if (!confirm('Are you sure you want to delete this asset?')) return
    try {
      await apiDelete(`/api/assets/${id}`)
      router.push('/assets')
    } catch (err) {
      console.error('Delete failed', err)
    }
  }

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'car': return <Car className="w-8 h-8" />
      case 'house': return <Home className="w-8 h-8" />
      case 'appliance': return <Zap className="w-8 h-8" />
      default: return <Settings className="w-8 h-8" />
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'car': return 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/20'
      case 'house': return 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20'
      case 'appliance': return 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20'
      default: return 'from-slate-500/20 to-slate-600/5 text-slate-400 border-slate-500/20'
    }
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-8">
      <div className="h-8 bg-white/5 w-48 rounded" />
      <div className="h-64 bg-white/5 rounded-[3rem]" />
    </div>
  )

  if (!asset) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <AlertCircle className="w-16 h-16 text-rose-500/50" />
      <h2 className="text-2xl font-bold text-white">Asset not found</h2>
      <Link href="/assets" className="text-indigo-400 hover:text-white transition-colors flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Assets
      </Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24">
      {/* Navigation / Actions */}
      <div className="flex items-center justify-between">
        <Link 
          href="/assets" 
          className="group flex items-center gap-3 text-slate-400 hover:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:-translate-x-1 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Household
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleDeleteAsset}
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl text-rose-400 transition-all border border-rose-500/10"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className={clsx(
        "relative overflow-hidden rounded-[3rem] border border-white/10 p-10 md:p-16 flex flex-col md:flex-row md:items-center gap-10",
        "bg-gradient-to-br",
        getTypeColor(asset.asset_type)
      )}>
        <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl flex-shrink-0">
          {getTypeIcon(asset.asset_type)}
        </div>
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3">
            <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
              {asset.asset_type}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Healthy</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
            {asset.name}
          </h1>
          {asset.description && (
            <p className="text-white/60 text-lg font-medium max-w-2xl leading-relaxed">
              {asset.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Upcoming Tasks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pl-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-500" />
              Maintenance Schedule
            </h2>
          </div>
          
          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="glass-card p-10 rounded-[2.5rem] text-center border-dashed">
                <p className="text-slate-500 font-medium italic">No maintenance tasks scheduled for this item.</p>
              </div>
            ) : tasks.map((task) => (
              <div key={task.id} className="glass-card p-6 rounded-3xl flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">{task.task_name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Due {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                      </p>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-600">{task.recurrence_type}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            ))}
          </div>
        </div>

        {/* Media & Gallery */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pl-2">
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-emerald-500" />
              Documents & Media
            </h2>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-premium py-2 px-5 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
            >
              {uploading ? 'Uploading...' : <><Upload className="w-3.5 h-3.5" /> Upload</>}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {media.length === 0 ? (
              <div className="col-span-2 glass-card p-10 rounded-[2.5rem] text-center border-dashed">
                <p className="text-slate-500 font-medium italic">No manuals, photos, or receipts uploaded.</p>
              </div>
            ) : media.map((item) => (
              <div key={item.id} className="relative group overflow-hidden rounded-3xl aspect-[4/3] bg-slate-900 border border-white/5">
                {item.file_type.includes('image') ? (
                  <img 
                    src={item.url} 
                    alt={item.file_name} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <FileText className="w-10 h-10 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    <p className="text-[10px] font-bold text-slate-500 truncate w-full">{item.file_name}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="flex items-center justify-between w-full">
                    <p className="text-[10px] text-white font-black uppercase tracking-tight truncate max-w-[100px]">
                      {item.file_name}
                    </p>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 transition-colors hover:text-emerald-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AssetDetailsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse p-8">
          <div className="h-8 bg-white/5 w-48 rounded" />
          <div className="h-64 bg-white/5 rounded-[3rem]" />
        </div>
      }>
        <AssetDetailsContent />
      </Suspense>
    </DashboardLayout>
  )
}
