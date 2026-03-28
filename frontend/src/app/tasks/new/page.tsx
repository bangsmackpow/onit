// frontend/src/app/tasks/new/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost } from '@/lib/apiClient'
import { 
  ArrowLeft, 
  Calendar, 
  FileText,
  AlertCircle,
  ArrowRight,
  Zap,
  Clock,
  Layout,
  Database,
  Timer,
  X,
  Bell
} from 'lucide-react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
}

function NewTaskForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assetIdParam = searchParams.get('assetId')

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    assetId: assetIdParam || '',
    taskName: '',
    description: '',
    recurrenceType: 'monthly' as 'once' | 'monthly' | 'quarterly' | 'biannual' | 'annual',
    recurrenceInterval: 1,
    reminderDaysBefore: 7,
    nextDueDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await apiGet('/api/assets')
        setAssets(res.data.assets || [])
        if (!formData.assetId && res.data.assets?.length > 0) {
          setFormData(prev => ({ ...prev, assetId: res.data.assets[0].id }))
        }
      } catch (err) {
        console.error('Failed to fetch assets')
      }
    }
    fetchAssets()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiPost('/api/tasks', {
        ...formData,
        assignmentType: 'single',
        assignedToUserIds: [], // handled by api side
      })
      router.push('/tasks')
    } catch (err: any) {
      console.error('Failed to create task', err)
      setError(err.response?.data?.error || 'Failed to create task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <Link 
        href="/tasks" 
        className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
        Discard Pipeline Addition
      </Link>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Schedule <span className="text-indigo-500">Protocol</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-lg">
          Initialize a new maintenance routine for specific hardware objects.
        </p>
      </div>

      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-5 text-rose-400 animate-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-[3.5rem] overflow-hidden p-10 md:p-16 space-y-12 relative">
        <div className="glow-mesh" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
          {/* Target Asset Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Layout className="w-3 h-3" />
              Target Target Unit
            </label>
            <div className="relative group">
              <select 
                value={formData.assetId}
                onChange={(e) => setFormData({...formData, assetId: e.target.value})}
                required
                className="input-premium py-5 px-8"
              >
                <option value="" disabled className="bg-slate-900">Select an infrastructure unit...</option>
                {assets.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>)}
              </select>
              <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-slate-500 rotate-90" />
              </div>
            </div>
            {assets.length === 0 && (
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-2 ml-4">
                No units detected. <Link href="/assets/new" className="text-white underline">Initialize Unit</Link>
              </p>
            )}
          </div>

          {/* Task Name Input */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Operation Identifier
            </label>
            <div className="relative group/input">
              <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                required
                value={formData.taskName}
                onChange={(e) => setFormData({...formData, taskName: e.target.value})}
                placeholder="e.g. Engine Calibration"
                className="input-premium pl-16 py-5"
              />
            </div>
          </div>

          {/* Recurrence Pattern Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Frequency Pattern
            </label>
            <div className="relative group">
              <select 
                value={formData.recurrenceType}
                onChange={(e) => setFormData({...formData, recurrenceType: e.target.value as any})}
                className="input-premium py-5 px-8"
              >
                <option value="once" className="bg-slate-900">Single Instance (Once)</option>
                <option value="monthly" className="bg-slate-900">Monthly Array</option>
                <option value="quarterly" className="bg-slate-900">Quarterly Re-sync</option>
                <option value="biannual" className="bg-slate-900">Semi-Annual Cycle</option>
                <option value="annual" className="bg-slate-900">Annual Calibration</option>
              </select>
              <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2">
                <ArrowRight className="w-4 h-4 text-slate-500 rotate-90" />
              </div>
            </div>
          </div>

          {/* Target Due Date Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Timer className="w-3 h-3" />
              Execution Target
            </label>
            <div className="relative group/input">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
              <input 
                type="date" 
                required
                value={formData.nextDueDate}
                onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                className="input-premium pl-16 py-5 [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Reminder Array Settings */}
        <div className="space-y-6 pt-6 border-t border-white/5 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
            <Bell className="w-3 h-3 text-indigo-500" />
            Alert Notification Buffer
          </label>
          <div className="flex flex-wrap gap-4">
            {[0, 3, 7, 14].map(days => (
              <button
                key={days}
                type="button"
                onClick={() => setFormData({...formData, reminderDaysBefore: days})}
                className={`px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${
                  formData.reminderDaysBefore === days 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {days === 0 ? 'Zero Buffer' : `${days} Day Lead`}
              </button>
            ))}
          </div>
        </div>

        {/* Descriptive Metadata Input */}
        <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
            <Database className="w-3 h-3" />
            Procedure Schematics (Optional)
          </label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Document parts indices, fluid specifications, or tactical steps..."
            rows={4}
            className="input-premium py-6 px-8"
          />
        </div>

        {/* Control Array Actions */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row gap-6 relative z-10">
          <button
            type="submit"
            disabled={loading || assets.length === 0}
            className="btn-premium btn-premium-primary flex-1 h-[72px] text-lg shadow-2xl group/submit"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing Ops...
              </>
            ) : (
              <>
                Confirm Schedule Commit
                <ArrowRight className="w-6 h-6 group-hover/submit:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-premium btn-premium-secondary h-[72px] px-10 border-white/5"
          >
            <X className="w-5 h-5 text-slate-500" />
            Abort Operation
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewTaskPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="max-w-4xl mx-auto p-32 text-center group">
          <div className="glow-mesh" />
          <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Application State...</p>
        </div>
      }>
        <NewTaskForm />
      </Suspense>
    </DashboardLayout>
  )
}
