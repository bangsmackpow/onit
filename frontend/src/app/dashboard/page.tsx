// frontend/src/app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  ChevronRight,
  ArrowRight,
  Zap,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { format, isBefore, addDays, parseISO } from 'date-fns'

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

  const overdueTasks = tasks.filter(t => isBefore(parseISO(t.next_due_date), new Date()))
  const upcomingTasks = tasks.filter(t => {
    const dueDate = parseISO(t.next_due_date)
    return !isBefore(dueDate, new Date()) && isBefore(dueDate, addDays(new Date(), 30))
  })

  const stats = [
    { name: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { name: 'Upcoming', value: upcomingTasks.length, icon: Timer, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { name: 'Total Assets', value: assets.length, icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ]

  // Re-importing Timer and Package because they were missing from the stats map but available in lucide
  function Timer(props: any) { return <Clock {...props} /> }
  function Package(props: any) { return <ShieldCheck {...props} /> }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-24">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Household <span className="text-indigo-500">Dashboard</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-lg">
              Manage your home maintenance and track your family's tasks.
            </p>
          </div>
          <div className="flex gap-4">
            <Link 
              href="/tasks/new" 
              className="btn-premium btn-premium-primary"
            >
              <Plus className="w-5 h-5" />
              Add Task
            </Link>
            <Link 
              href="/assets/new" 
              className="btn-premium btn-premium-secondary"
            >
              <Zap className="w-5 h-5 text-indigo-400" />
              Add Item
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="glass-card p-6 rounded-[2rem] flex items-center group hover:scale-[1.02] transition-transform duration-500">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} ${stat.border} border mr-5 transition-colors group-hover:bg-white/10`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.name}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-white">{stat.value}</p>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Task List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between pl-2">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <Calendar className="w-6 h-6 text-indigo-500" />
                Upcoming Tasks
              </h2>
              <Link href="/tasks" className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-2 group">
                Full Schedule
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 glass-card animate-pulse rounded-[2rem]" />)}
              </div>
            ) : assets.length === 0 ? (
              <div className="glass-card rounded-[3rem] p-16 text-center relative overflow-hidden group border border-indigo-500/20 bg-indigo-500/[0.02]">
                <div className="glow-mesh opacity-30" />
                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-700">
                  <Zap className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Welcome to ONIT</h3>
                <p className="text-slate-400 mb-10 max-w-sm mx-auto text-lg leading-relaxed">Let's set up your household maintenance schedule. It takes less than 2 minutes.</p>
                <Link 
                  href="/wizard" 
                  className="btn-premium btn-premium-primary inline-flex px-12 py-5 text-lg"
                >
                  Start Onboarding
                  <ChevronRight className="w-6 h-6" />
                </Link>
              </div>
            ) : tasks.length === 0 ? (
              <div className="glass-card rounded-[3rem] p-16 text-center relative overflow-hidden group">
                <div className="glow-mesh" />
                <CheckCircle2 className="w-16 h-16 text-slate-800 mx-auto mb-6 transition-transform group-hover:scale-110 duration-500" />
                <h3 className="text-2xl font-black text-white mb-2">All Tasks Complete</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">Great job! All your household maintenance is up to date.</p>
                <Link 
                  href="/tasks/new" 
                  className="btn-premium btn-premium-primary inline-flex"
                >
                  <Plus className="w-5 h-5" />
                  Add New Task
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.slice(0, 5).map((task) => {
                  const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
                  return (
                    <div 
                      key={task.id} 
                      className="group glass-card p-6 rounded-[2rem] flex items-center justify-between hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[40px] -z-10 group-hover:bg-indigo-600/10 transition-colors" />
                      <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${isOverdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{task.task_name}</h4>
                          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">{task.asset_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}>
                            {isOverdue ? 'Overdue' : 'Due On'}
                          </p>
                          <p className={`text-lg font-black ${isOverdue ? 'text-rose-400' : 'text-white'}`}>
                            {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <ChevronRight className="w-5 h-5 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-8">
            <h2 className="text-xl font-black text-white pl-2">Quick Actions</h2>
            <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <TrendingUp className="w-12 h-12 text-white/5" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3">Common Tasks</p>
              <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">Quickly add common household maintenance tasks.</p>
              
              <div className="grid gap-4">
                {[
                  { name: 'A/C Filter Change', asset: 'Primary Residence', icon: '❄️' },
                  { name: 'Oil Change', asset: 'Primary Vehicle', icon: '🛢️' },
                  { name: 'Smoke Detector Test', asset: 'Household', icon: '🔔' },
                ].map((tpl) => (
                  <button 
                    key={tpl.name}
                    className="flex items-center p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-indigo-500/20 transition-all text-left w-full group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center text-xl mr-4 shadow-inner">
                      {tpl.icon}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-black text-white truncate group-hover:text-indigo-400 transition-colors">{tpl.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{tpl.asset}</p>
                    </div>
                  </button>
                ))}
              </div>

              <Link href="/tasks/new" className="mt-8 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center justify-center gap-2 transition-colors">
                View All Templates
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro Tips */}
            <div className="relative group overflow-hidden rounded-[2.5rem] p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-2xl shadow-indigo-600/20">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-[60px]" />
              <ShieldCheck className="w-12 h-12 text-white mb-6" />
              <h3 className="text-2xl font-black text-white mb-2 leading-tight">Home Maintenance</h3>
              <p className="text-indigo-100/80 text-sm font-medium mb-8 leading-relaxed">
                Regular maintenance can extend the life of your appliances and vehicles by years.
              </p>
              <Link href="/history" className="w-full inline-block text-center py-4 bg-white text-indigo-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg active:scale-95">
                View History
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
