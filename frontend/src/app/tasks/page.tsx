// frontend/src/app/tasks/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost } from '@/lib/apiClient'
import { 
  Plus, 
  CheckCircle2, 
  Calendar,
  DollarSign,
  Activity,
} from 'lucide-react'
import Link from 'next/link'
import { format, isBefore, parseISO } from 'date-fns'

interface Task {
  id: string
  task_name: string
  asset_name: string
  next_due_date: string
  recurrence_type: string
  description?: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming'>('all')
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)
  const [completionData, setCompletionData] = useState({
    notes: '',
    mileage: '',
    costUsd: '',
    hoursTracked: ''
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    try {
      const res = await apiGet('/api/tasks')
      setTasks(res.data.tasks || [])
    } catch (err) {
      console.error('Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault()
    if (!completingTaskId) return

    try {
      await apiPost(`/api/tasks/${completingTaskId}/complete`, {
        notes: completionData.notes,
        mileage: completionData.mileage ? parseInt(completionData.mileage) : undefined,
        costUsd: completionData.costUsd ? parseFloat(completionData.costUsd) : undefined,
        hoursTracked: completionData.hoursTracked ? parseFloat(completionData.hoursTracked) : undefined,
      })
      setCompletingTaskId(null)
      setCompletionData({ notes: '', mileage: '', costUsd: '', hoursTracked: '' })
      fetchTasks()
    } catch (err) {
      alert('Failed to complete task')
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'overdue') return isBefore(parseISO(t.next_due_date), new Date())
    if (filter === 'upcoming') return !isBefore(parseISO(t.next_due_date), new Date())
    return true
  })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Maintenance Pipeline</h1>
            <p className="text-gray-600">Track and complete your scheduled tasks</p>
          </div>
          <Link 
            href="/tasks/new" 
            className="inline-flex items-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <Plus className="w-5 h-5 mr-2" />
            Schedule New Task
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex bg-white p-2 rounded-2xl border border-gray-200 shadow-sm w-fit">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setFilter('overdue')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'overdue' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Overdue
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${filter === 'upcoming' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Upcoming
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No tasks found</h3>
            <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto">
              {filter === 'all' ? 'Your maintenance pipeline is empty. Add an asset and schedule some tasks.' : `No ${filter} tasks found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
              return (
                <div 
                  key={task.id} 
                  className={`group bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col md:flex-row md:items-center gap-6`}
                >
                  <div className={`p-4 rounded-2xl flex-shrink-0 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform`}>
                    <Calendar className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-gray-900 truncate">{task.task_name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isOverdue ? 'Overdue' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 flex items-center">
                      {task.asset_name}
                      <span className="mx-2 text-gray-200">•</span>
                      Recurrence: <span className="text-blue-600 ml-1 capitalize">{task.recurrence_type}</span>
                    </p>
                    {task.description && <p className="text-sm text-gray-400 mt-2 line-clamp-1">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-black ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Next Due Date</p>
                    </div>
                    
                    <button 
                      onClick={() => setCompletingTaskId(task.id)}
                      className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl font-black transition-all shadow-sm active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Complete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {completingTaskId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setCompletingTaskId(null)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-8 md:p-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Task Completion</h2>
                <button onClick={() => setCompletingTaskId(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleComplete} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Completion Notes</label>
                  <textarea 
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                    placeholder="e.g. Changed oil, verified levels are good."
                    className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all placeholder-gray-400 shadow-inner"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Mileage (optional)</label>
                    <div className="relative">
                      <Activity className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input 
                        type="number"
                        value={completionData.mileage}
                        onChange={(e) => setCompletionData({...completionData, mileage: e.target.value})}
                        placeholder="75,042"
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Cost USD (optional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                      <input 
                        type="number"
                        step="0.01"
                        value={completionData.costUsd}
                        onChange={(e) => setCompletionData({...completionData, costUsd: e.target.value})}
                        placeholder="45.99"
                        className="w-full pl-12 pr-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-3xl shadow-xl hover:shadow-2xl transition-all text-xl mt-4"
                >
                  Mark as Complete
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
