// frontend/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import PushNotificationManager from '@/components/PushNotificationManager'
import { apiGet } from '@/lib/apiClient'
import { 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  LayoutDashboard,
  Timer as TimerIcon,
  BookOpen
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
}

interface Asset {
  id: string
  name: string
  asset_type: string
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [tasksRes, assetsRes] = await Promise.all([
          apiGet('/api/tasks'),
          apiGet('/api/assets')
        ])
        setTasks(tasksRes.data.tasks || [])
        setAssets(assetsRes.data.assets || [])
      } catch (err) {
        console.error('Failed to fetch dashboard data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // The Rule of Three: Today's Priorities
  const priorityTasks = tasks
    .sort((a, b) => parseISO(a.next_due_date).getTime() - parseISO(b.next_due_date).getTime())
    .slice(0, 3)

  const overdueCount = tasks.filter(t => isBefore(parseISO(t.next_due_date), new Date())).length

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-16 pb-24">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
              Daily <span className="text-indigo-600">Focus</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Exactly what your home needs today. No noise.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link href="/tasks/new" className="btn-zen-primary">
              <Plus className="w-5 h-5" />
              Add Protocol
            </Link>
          </div>
        </div>

        {/* The Core Three */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <TimerIcon className="w-4 h-4" />
              Today's Priorities
            </h2>
            {overdueCount > 0 && (
              <div className="px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-full flex items-center gap-2">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">{overdueCount} Critical Overdue</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse" />)
            ) : priorityTasks.length > 0 ? (
              priorityTasks.map((task, index) => {
                const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
                return (
                  <div key={task.id} className={clsx(
                    "zen-card flex flex-col md:flex-row md:items-center justify-between gap-8 group",
                    index === 0 && "border-indigo-100 bg-indigo-50/20"
                  )}>
                    <div className="flex items-center gap-8">
                      <div className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner transition-transform group-hover:scale-110 duration-500",
                        isOverdue ? "bg-rose-100 text-rose-600" : index === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {isOverdue ? '!' : index + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none mb-2">
                          {task.task_name}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">{task.asset_name}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-xs font-bold text-slate-400">Due {format(parseISO(task.next_due_date), 'MMM d')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link 
                        href={`/tasks?id=${task.id}`} // Mock link to action
                        className="btn-zen-secondary px-6"
                      >
                        <BookOpen className="w-4 h-4" />
                        Guide
                      </Link>
                      <button className="btn-zen-primary shadow-indigo-600/10">
                        <CheckCircle2 className="w-5 h-5" />
                        Complete
                      </button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="zen-card p-20 text-center border-dashed border-slate-200">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h3 className="text-3xl font-black text-slate-900 mb-2">Serenity Achieved</h3>
                <p className="text-slate-400 max-w-xs mx-auto font-medium leading-relaxed text-lg">All maintenance protocols are currently synchronized.</p>
              </div>
            )}
          </div>
          
          {tasks.length > 3 && (
            <Link href="/tasks" className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all pt-4">
              View all {tasks.length} protocols <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Minimal Secondary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Support Section */}
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 pl-2">
              <LayoutDashboard className="w-4 h-4" />
              System Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Assets</p>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{assets.length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Health Index</p>
                <p className="text-3xl font-black text-emerald-500 tracking-tight">100%</p>
              </div>
            </div>
            <PushNotificationManager />
          </div>

          {/* Quick Support */}
          <div className="space-y-6">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 pl-2">
              <ShieldCheck className="w-4 h-4" />
              Knowledge Library
            </h2>
            <div className="zen-card bg-indigo-600 border-none text-white p-10 overflow-hidden relative group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700" />
              <BookOpen className="w-12 h-12 text-indigo-200 mb-6" />
              <h3 className="text-2xl font-black mb-2 tracking-tight uppercase">Maintenance 101</h3>
              <p className="text-indigo-100/80 text-sm font-medium mb-10 leading-relaxed">
                Learn how to identify filter sizes, test detectors, and winterize your home properly.
              </p>
              <Link href="/knowledge" className="w-full inline-block text-center py-4 bg-white text-indigo-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:shadow-xl active:scale-95 transition-all">
                Access Archives
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
