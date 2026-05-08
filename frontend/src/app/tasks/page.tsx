// frontend/src/app/tasks/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost } from '@/lib/apiClient'
import { 
  Plus, 
  CheckCircle2, 
  Zap,
  Clock,
  Settings,
  BookOpen,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { format, isBefore, parseISO } from 'date-fns'
import { clsx } from 'clsx'

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
  const [snoozingTaskId, setSnoozingTaskId] = useState<string | null>(null)
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

  async function handleSnooze(days: number) {
    if (!snoozingTaskId) return

    try {
      await apiPost(`/api/tasks/${snoozingTaskId}/snooze`, { days })
      setSnoozingTaskId(null)
      fetchTasks()
    } catch (err) {
      alert('Failed to snooze task')
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filter === 'overdue') return isBefore(parseISO(t.next_due_date), new Date())
    if (filter === 'upcoming') return !isBefore(parseISO(t.next_due_date), new Date())
    return true
  })

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Protocols<span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
              Standard operating procedures for your household infrastructure.
            </p>
          </div>
          <Link 
            href="/tasks/new" 
            className="btn-zen-primary h-16 px-10 text-lg shadow-2xl shadow-indigo-600/20"
          >
            <Plus className="w-6 h-6" />
            New Protocol
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-[2rem] w-fit shadow-inner">
          {(['all', 'overdue', 'upcoming'] as const).map((f) => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] transition-all",
                filter === f ? "bg-white text-indigo-600 shadow-md" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 border border-slate-100 animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="zen-card p-32 text-center border-dashed">
            <CheckCircle2 className="w-16 h-16 text-slate-200 mx-auto mb-8" />
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">System Optimized</h3>
            <p className="text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed">No pending protocols found for the current filter.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredTasks.map((task) => {
              const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
              return (
                <div 
                  key={task.id} 
                  className={clsx(
                    "zen-card flex flex-col md:flex-row md:items-center justify-between gap-8 group",
                    isOverdue && "border-rose-100 bg-rose-50/10"
                  )}
                >
                  <div className="flex items-center gap-8">
                    <div className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black shadow-inner transition-transform group-hover:scale-110 duration-700",
                      isOverdue ? "bg-rose-500 shadow-rose-500/20" : "bg-indigo-600 shadow-indigo-600/20"
                    )}>
                      {isOverdue ? <AlertTriangle className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                    </div>
                    
                    <div className="min-w-0">
                      <h3 className="text-2xl font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none mb-3">
                        {task.task_name}
                      </h3>
                      <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
                        <span className="text-slate-900 font-bold">{task.asset_name}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className={isOverdue ? "text-rose-500" : "text-slate-400"}>
                          Due {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span>{task.recurrence_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link 
                      href={`/knowledge/search?q=${task.task_name}`} // Dynamic guide search
                      className="btn-zen-secondary px-6 h-14"
                    >
                      <BookOpen className="w-4 h-4" />
                      Guide
                    </Link>
                    
                    <Link 
                      href={`/tasks/edit?id=${task.id}`}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                      <Settings className="w-5 h-5" />
                    </Link>

                    <button 
                      onClick={() => setSnoozingTaskId(task.id)}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                    >
                      <Clock className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={() => setCompletingTaskId(task.id)}
                      className="btn-zen-primary h-14 px-8"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Snooze Modal */}
      {snoozingTaskId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setSnoozingTaskId(null)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100 p-12 text-center">
            <Clock className="w-16 h-16 text-indigo-600 mx-auto mb-8 animate-float" />
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Pause Protocol</h2>
            <p className="text-slate-400 font-medium text-lg mb-10 leading-relaxed">Choose a resynchronization window.</p>
            
            <div className="grid gap-4">
              {[3, 7, 14].map(days => (
                <button
                  key={days}
                  onClick={() => handleSnooze(days)}
                  className="btn-zen-secondary h-16 text-slate-900 border-slate-100 hover:border-indigo-600 hover:text-indigo-600"
                >
                  Snooze {days} Days
                </button>
              ))}
              <button
                onClick={() => setSnoozingTaskId(null)}
                className="mt-6 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal - Zen Style */}
      {completingTaskId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setCompletingTaskId(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
            <div className="p-12 md:p-16 space-y-12">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Archive Protocol</h2>
                <p className="text-slate-400 text-lg font-medium">Document the execution details for the record.</p>
              </div>

              <form onSubmit={handleComplete} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-6">Final Metric (Mileage/Usage)</label>
                    <input 
                      type="number"
                      className="input-zen h-16"
                      placeholder="e.g. 52000"
                      value={completionData.mileage}
                      onChange={(e) => setCompletionData({...completionData, mileage: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-6">Execution Cost (USD)</label>
                    <input 
                      type="number"
                      className="input-zen h-16"
                      placeholder="0.00"
                      value={completionData.costUsd}
                      onChange={(e) => setCompletionData({...completionData, costUsd: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-6">Notes & Findings</label>
                  <textarea 
                    className="input-zen py-6"
                    rows={4}
                    placeholder="Document parts used or anomalies observed..."
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                  />
                </div>

                <div className="pt-8 flex flex-col md:flex-row gap-4">
                  <button 
                    type="submit"
                    className="btn-zen-primary flex-1 h-18 text-lg shadow-emerald-500/10"
                  >
                    Commit Execution
                  </button>
                  <button 
                    type="button"
                    onClick={() => setCompletingTaskId(null)}
                    className="btn-zen-secondary h-18 px-10"
                  >
                    Cancel
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
