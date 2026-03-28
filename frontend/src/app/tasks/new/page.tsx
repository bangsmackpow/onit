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
  AlertCircle
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
        assignedToUserIds: [], // handled by api side check
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
    <div className="max-w-3xl mx-auto space-y-8">
      <Link 
        href="/tasks" 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Tasks
      </Link>

      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Schedule Task</h1>
        <p className="text-gray-600">Add a new recurring maintenance task to an asset</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden p-8 md:p-10 space-y-8">
        <div className="space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Target Asset</label>
            <select 
              value={formData.assetId}
              onChange={(e) => setFormData({...formData, assetId: e.target.value})}
              required
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 shadow-inner"
            >
              <option value="" disabled>Select an asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            {assets.length === 0 && (
              <p className="text-xs text-amber-600 font-bold mt-2">
                No assets found. <Link href="/assets/new" className="underline">Add an asset first</Link>.
              </p>
            )}
          </div>

          {/* Task Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Task Name</label>
            <div className="relative">
              <FileText className="absolute left-5 top-4 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                required
                value={formData.taskName}
                onChange={(e) => setFormData({...formData, taskName: e.target.value})}
                placeholder="e.g. Engine Oil Change"
                className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 shadow-inner"
              />
            </div>
          </div>

          {/* Recurrence Selection */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Recurrence</label>
              <select 
                value={formData.recurrenceType}
                onChange={(e) => setFormData({...formData, recurrenceType: e.target.value as any})}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 shadow-inner"
              >
                <option value="once">Once</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannual">Every 6 Months</option>
                <option value="annual">Every Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">First Due Date</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-4 w-5 h-5 text-gray-400" />
                <input 
                  type="date" 
                  required
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Reminder Options */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Remind me before</label>
            <div className="grid grid-cols-4 gap-3">
              {[0, 3, 7, 14].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFormData({...formData, reminderDaysBefore: days})}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                    formData.reminderDaysBefore === days 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-blue-200'
                  }`}
                >
                  {days === 0 ? 'Due Day' : `${days} Days`}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Notes & Instructions (Optional)</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Include parts numbers, fluid types, or special steps..."
              rows={4}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 shadow-inner"
            />
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex gap-4">
          <button
            type="submit"
            disabled={loading || assets.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 text-xl tracking-tight"
          >
            {loading ? 'Scheduling...' : 'Confirm Schedule'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-5 bg-white text-gray-500 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
          >
            Cancel
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
        <div className="max-w-3xl mx-auto p-20 text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-bold">Loading form...</p>
        </div>
      }>
        <NewTaskForm />
      </Suspense>
    </DashboardLayout>
  )
}
