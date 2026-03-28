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
  ArrowRight,
  Zap,
  Clock,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  X
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
      <div className="max-w-7xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Maintenance <span className="text-indigo-500">Tasks</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-lg">
              Track and complete upcoming maintenance for your home and vehicles.
            </p>
          </div>
          <Link 
            href="/tasks/new" 
            className="btn-premium btn-premium-primary"
          >
            <Plus className="w-5 h-5" />
            Add New Task
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 p-2 rounded-[2rem] glass-card w-fit border-white/5">
          <button 
            onClick={() => setFilter('all')}
            className={`px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            All Tasks
          </button>
          <button 
            onClick={() => setFilter('overdue')}
            className={`px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all ${filter === 'overdue' ? 'bg-rose-500/10 text-rose-400 shadow-sm border border-rose-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            Overdue
          </button>
          <button 
            onClick={() => setFilter('upcoming')}
            className={`px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all ${filter === 'upcoming' ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            Upcoming
          </button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 glass-card animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="glass-card rounded-[3rem] p-24 text-center relative overflow-hidden group">
            <div className="glow-mesh" />
            <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
              <CheckCircle2 className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">All Done!</h3>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">
              {filter === 'all' ? 'All maintenance tasks are complete. Your home is running smoothly!' : `No pending items found for the '${filter}' filter.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTasks.map((task) => {
              const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
              return (
                <div 
                  key={task.id} 
                  className="group glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center gap-8 hover:border-indigo-500/30 transition-all overflow-hidden relative"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] -z-10 group-hover:opacity-40 transition-opacity ${isOverdue ? 'bg-rose-600/10' : 'bg-indigo-600/10'}`} />
                  
                  <div className={`p-5 rounded-2xl flex-shrink-0 border transition-all group-hover:scale-110 duration-500 ${isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-lg shadow-rose-600/10' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-lg shadow-indigo-600/10'}`}>
                    <Calendar className="w-8 h-8" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-black text-white truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{task.task_name}</h3>
                      <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${isOverdue ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                        {isOverdue ? 'Critical' : 'Pending'}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-700" />
                        <span className="uppercase tracking-widest">{task.asset_name}</span>
                      </div>
                      <div className="w-[1px] h-3 bg-white/10" />
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-700" />
                        <span className="uppercase tracking-widest">{task.recurrence_type}</span>
                      </div>
                    </div>
                    {task.description && <p className="text-sm font-medium text-slate-500 mt-4 line-clamp-1 max-w-2xl">{task.description}</p>}
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>Due Date</p>
                      <p className={`text-xl font-black ${isOverdue ? 'text-rose-400' : 'text-white'}`}>
                        {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => setCompletingTaskId(task.id)}
                      className="btn-premium btn-premium-secondary group/btn border-indigo-500/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 group-hover/btn:text-white" />
                      Complete
                      <ChevronRight className="w-4 h-4" />
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12 transition-all duration-500">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setCompletingTaskId(null)}></div>
          <div className="relative glass-card w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 border-white/10">
            <div className="glow-mesh" />
            
            <div className="p-10 md:p-16 relative z-10">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Task Completion</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Record Household Maintenance</p>
                  </div>
                </div>
                <button onClick={() => setCompletingTaskId(null)} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleComplete} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Completion Notes
                  </label>
                  <textarea 
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                    placeholder="What was done? (e.g., changed oil, replaced filter...)"
                    className="input-premium py-5 px-6"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 flex items-center gap-2">
                      <TrendingDown className="w-3 h-3" />
                      Usage Metrics
                    </label>
                    <div className="relative group/input">
                      <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                      <input 
                        type="number"
                        value={completionData.mileage}
                        onChange={(e) => setCompletionData({...completionData, mileage: e.target.value})}
                        placeholder="Current Mileage"
                        className="input-premium pl-14 h-16"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 flex items-center gap-2">
                      <DollarSign className="w-3 h-3" />
                      Cost
                    </label>
                    <div className="relative group/input">
                      <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within/input:text-indigo-400 transition-colors" />
                      <input 
                        type="number"
                        step="0.01"
                        value={completionData.costUsd}
                        onChange={(e) => setCompletionData({...completionData, costUsd: e.target.value})}
                        placeholder="Total Cost (USD)"
                        className="input-premium pl-14 h-16"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    type="submit"
                    className="btn-premium btn-premium-primary w-full h-[72px] text-lg shadow-2xl group/sub"
                  >
                    Save Completion
                    <ArrowRight className="w-6 h-6 group-hover/sub:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
