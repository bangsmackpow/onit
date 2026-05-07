'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPut } from '@/lib/apiClient'
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Zap,
  Clock,
  Layout,
  Database,
  Timer,
  Bell
} from 'lucide-react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
}

function EditTaskForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    assetId: '',
    taskName: '',
    description: '',
    recurrenceType: 'monthly' as 'once' | 'monthly' | 'quarterly' | 'biannual' | 'annual',
    recurrenceInterval: 1,
    reminderDaysBefore: 7,
    nextDueDate: ''
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [assetsRes, taskRes] = await Promise.all([
          apiGet('/api/assets'),
          apiGet(`/api/tasks/${id}`)
        ])
        
        setAssets(assetsRes.data.assets || [])
        
        const { task } = taskRes.data
        setFormData({
          assetId: task.asset_id,
          taskName: task.task_name,
          description: task.description || '',
          recurrenceType: task.recurrence_type,
          recurrenceInterval: task.recurrence_interval || 1,
          reminderDaysBefore: task.reminder_days_before || 7,
          nextDueDate: task.next_due_date.split('T')[0]
        })
      } catch (err) {
        console.error('Failed to fetch data', err)
        setError('Failed to load task data')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await apiPut(`/api/tasks/${id}`, {
        ...formData,
        assignmentType: 'single',
        assignedToUserIds: [], // backend handles
      })
      router.push('/tasks')
    } catch (err: any) {
      console.error('Failed to update task', err)
      setError(err.response?.data?.error || 'Failed to update task. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-32 text-center group">
      <div className="glow-mesh" />
      <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Application State...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <Link 
        href="/tasks" 
        className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
        Discard Changes
      </Link>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Update <span className="text-indigo-500">Protocol</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-lg">
          Modify the schedule or identifier for this maintenance routine.
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
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Layout className="w-3 h-3" />
              Target Unit
            </label>
            <select 
              value={formData.assetId}
              onChange={(e) => setFormData({...formData, assetId: e.target.value})}
              required
              className="input-premium py-5 px-8"
            >
              {assets.map(a => <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Operation Identifier
            </label>
            <input 
              type="text" 
              required
              value={formData.taskName}
              onChange={(e) => setFormData({...formData, taskName: e.target.value})}
              placeholder="e.g. Engine Calibration"
              className="input-premium py-5 px-8"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Frequency Pattern
            </label>
            <select 
              value={formData.recurrenceType}
              onChange={(e) => setFormData({...formData, recurrenceType: e.target.value as any})}
              className="input-premium py-5 px-8"
            >
              <option value="once" className="bg-slate-900">Single Instance</option>
              <option value="monthly" className="bg-slate-900">Monthly Array</option>
              <option value="quarterly" className="bg-slate-900">Quarterly Re-sync</option>
              <option value="biannual" className="bg-slate-900">Semi-Annual Cycle</option>
              <option value="annual" className="bg-slate-900">Annual Calibration</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Timer className="w-3 h-3" />
              Execution Target
            </label>
            <input 
              type="date" 
              required
              value={formData.nextDueDate}
              onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
              className="input-premium px-8 py-5 [color-scheme:dark]"
            />
          </div>
        </div>

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

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row gap-6 relative z-10">
          <button
            type="submit"
            disabled={saving}
            className="btn-premium btn-premium-primary flex-1 h-[72px] text-lg shadow-2xl group/submit"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Synchronizing...
              </>
            ) : (
              <>
                Commit Changes
                <Save className="w-6 h-6 group-hover/submit:scale-110 transition-transform" />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-premium btn-premium-secondary h-[72px] px-10 border-white/5"
          >
            <X className="w-5 h-5 text-slate-500" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default function EditTaskPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <EditTaskForm />
      </Suspense>
    </DashboardLayout>
  )
}
