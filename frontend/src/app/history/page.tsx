// frontend/src/app/history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  History as HistoryIcon,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  Layers,
  Zap,
  TrendingDown,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

interface HistoryRecord {
  id: string
  task_id: string
  task_name: string
  asset_name: string
  completed_at: string
  completed_by_name: string
  notes?: string
  mileage?: number
  hours_tracked?: number
  cost_usd?: number
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    try {
      const res = await apiGet('/api/history')
      setHistory(res.data.history || [])
    } catch (err) {
      console.error('Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter(h => 
    h.task_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
    h.notes?.toLowerCase().includes(search.toLowerCase())
  )

  const totalCost = history.reduce((acc, h) => acc + (h.cost_usd || 0), 0)

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Maintenance <span className="text-amber-500">History</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-lg">
              A complete record of all completed household maintenance and spending.
            </p>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] group-hover:bg-amber-500/10 transition-colors" />
            <div className="flex items-center gap-5">
              <div className="p-4 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-600/10 transition-transform group-hover:scale-110 duration-500">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Total Spending</p>
                <p className="text-3xl font-black text-white">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] group-hover:bg-indigo-500/10 transition-colors" />
            <div className="flex items-center gap-5">
              <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-600/10 transition-transform group-hover:scale-110 duration-500">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Tasks Completed</p>
                <p className="text-3xl font-black text-white">{history.length}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] group-hover:bg-emerald-500/10 transition-colors" />
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-600/10 transition-transform group-hover:scale-110 duration-500">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Most Maintained</p>
                <p className="text-2xl font-black text-white truncate max-w-[180px]">
                  {history.length > 0 ? (
                    (() => {
                      const counts = history.reduce((acc: any, h) => {
                        acc[h.asset_name] = (acc[h.asset_name] || 0) + 1
                        return acc
                      }, {})
                      return Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0][0]
                    })()
                  ) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Audit Log */}
        <div className="glass-card rounded-[3rem] overflow-hidden border-white/5 relative">
          <div className="glow-mesh" />
          
          <div className="p-8 border-b border-white/5 flex flex-col lg:flex-row gap-8 items-center justify-between relative z-10">
            <div className="relative w-full lg:max-w-lg group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text"
                placeholder="Search completed tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-premium pl-16 py-4 bg-slate-950/30 font-medium"
              />
            </div>
            <div className="flex items-center gap-6 px-4">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Viewing All Tasks</span>
              </div>
              <div className="w-[1px] h-4 bg-white/10" />
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Timeline View</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/20 text-slate-500 text-[9px] font-black uppercase tracking-[0.25em] border-b border-white/5">
                  <th className="px-10 py-6">Item & Task</th>
                  <th className="px-10 py-6 text-center">Date Completed</th>
                  <th className="px-10 py-6">Usage/Cost</th>
                  <th className="px-10 py-6">Completed By</th>
                  <th className="px-10 py-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-10 py-8"><div className="h-10 bg-white/5 rounded-2xl w-full"></div></td>
                    </tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center group">
                      <div className="glow-mesh" />
                      <HistoryIcon className="w-20 h-20 text-slate-800 mx-auto mb-8 transition-transform group-hover:scale-110 duration-500" />
                      <h3 className="text-2xl font-black text-white mb-2">No History Found</h3>
                      <p className="text-slate-500 font-medium mb-10 max-w-sm mx-auto uppercase tracking-widest text-[10px]">You haven't completed any tasks yet.</p>
                      <Link href="/tasks" className="btn-premium btn-premium-secondary inline-flex">
                        Go to Tasks
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-indigo-500/[0.03] transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner">
                            <Zap className="w-5 h-5 text-indigo-500/50 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500" />
                          </div>
                          <div>
                            <p className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight leading-tight">{h.task_name}</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">{h.asset_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <p className="text-sm font-black text-white">{format(parseISO(h.completed_at), 'dd MMM yyyy')}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{format(parseISO(h.completed_at), 'hh:mm a')}</p>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-3">
                          {h.cost_usd && (
                            <span className="inline-flex items-center px-4 py-1.5 bg-amber-500/10 text-amber-400 text-[10px] font-black rounded-full border border-amber-500/20 shadow-sm">
                               <DollarSign className="w-3 h-3 mr-1" />
                               {h.cost_usd.toFixed(2)}
                            </span>
                          )}
                          {h.mileage && (
                            <span className="inline-flex items-center px-4 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/20 shadow-sm">
                               <TrendingDown className="w-3 h-3 mr-1" />
                               {h.mileage.toLocaleString()}
                            </span>
                          )}
                          {!h.cost_usd && !h.mileage && <span className="text-slate-800 tracking-widest font-black">---</span>}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shadow-lg">
                            {h.completed_by_name?.charAt(0) || <User className="w-4 h-4" />}
                          </div>
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{h.completed_by_name.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8 max-w-sm">
                        <p className="text-sm font-medium text-slate-500 italic line-clamp-2 leading-relaxed group-hover:text-slate-400 transition-colors">
                          "{h.notes || 'No notes provided.'}"
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Decorative Bottom Bar */}
          <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-center gap-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500/40" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">Secure Record</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500/40" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-600">Cloud Synced</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
