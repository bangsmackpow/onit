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
  Tool
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
    { name: 'Overdue', value: overdueTasks.length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { name: 'Due Next 30 Days', value: upcomingTasks.length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { name: 'Total Assets', value: assets.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your maintenance schedule</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/assets/new" 
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Link>
            <Link 
              href="/tasks/new" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2 text-blue-200" />
              New Task
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Task List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upcoming Maintenance</h2>
              <Link href="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                <p className="text-gray-500 mt-1 mb-6">You don't have any maintenance tasks scheduled.</p>
                <Link 
                  href="/tasks/new" 
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md"
                >
                  Schedule First Task
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.slice(0, 5).map((task) => {
                  const isOverdue = isBefore(parseISO(task.next_due_date), new Date())
                  return (
                    <div 
                      key={task.id} 
                      className="group bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between hover:border-blue-300 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{task.task_name}</h4>
                          <p className="text-sm text-gray-500">{task.asset_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {format(parseISO(task.next_due_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{task.recurrence_type}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-all" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar Area: Quick Templates */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Templates</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <p className="text-sm text-gray-500">Popular maintenance tasks for households.</p>
              
              <div className="grid gap-3">
                {[
                  { name: 'HVAC Filter Change', icon: '❄️', asset: 'House' },
                  { name: 'Smoke Detector Test', icon: '🔔', asset: 'House' },
                  { name: 'Oil Change', icon: '🛢️', asset: 'Vehicle' },
                  { name: 'Car Registration', icon: '📋', asset: 'Vehicle' },
                ].map((tpl) => (
                  <button 
                    key={tpl.name}
                    className="flex items-center p-3 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-100 transition-all text-left w-full group"
                  >
                    <span className="text-xl mr-3">{tpl.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{tpl.name}</p>
                      <p className="text-xs text-gray-500">For {tpl.asset}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <Link href="/templates" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center justify-center">
                  View All Templates <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Recently Completed */}
            <div className="bg-blue-600 p-6 rounded-2xl shadow-xl text-white">
              <h3 className="font-bold flex items-center mb-2">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Stay on track
              </h3>
              <p className="text-blue-100 text-sm mb-4 leading-relaxed">
                Regular maintenance extends the life of your home and car by up to 30%.
              </p>
              <button className="w-full py-2 bg-blue-500 hover:bg-blue-400 font-bold rounded-xl text-sm transition-all shadow-inner">
                View Maintenance Tips
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
