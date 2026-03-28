// frontend/src/app/history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  History as HistoryIcon,
  Search,
  ChevronRight,
  Filter,
  DollarSign,
  Activity,
  User,
  Tool
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

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
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Maintenance History</h1>
            <p className="text-gray-600">Audit trail of all completed tasks and repairs</p>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Investment</p>
                <p className="text-2xl font-black text-gray-900">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <HistoryIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Tasks Logged</p>
                <p className="text-2xl font-black text-gray-900">{history.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Most Maintained</p>
                <p className="text-2xl font-black text-gray-900 truncate">
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

        {/* Search & List */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search history by task, asset, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
              <Filter className="w-4 h-4 text-gray-400" />
              <span>Filtering: All Time</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-gray-400 text-[11px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                  <th className="px-8 py-4">Task & Asset</th>
                  <th className="px-8 py-4">Completed At</th>
                  <th className="px-8 py-4">Metrics</th>
                  <th className="px-8 py-4">Logged By</th>
                  <th className="px-8 py-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6"><div className="h-6 bg-gray-100 rounded-lg w-full"></div></td>
                    </tr>
                  ))
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <HistoryIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">No history available yet.</p>
                      <Link href="/tasks" className="text-blue-600 hover:underline mt-2 inline-block">Review pending tasks</Link>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{h.task_name}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{h.asset_name}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-900">{format(parseISO(h.completed_at), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-gray-400">{format(parseISO(h.completed_at), 'h:mm a')}</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {h.cost_usd && (
                            <span className="inline-flex items-center px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg border border-amber-100 italic">
                               ${h.cost_usd.toFixed(2)}
                            </span>
                          )}
                          {h.mileage && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100">
                               {h.mileage.toLocaleString()} mi
                            </span>
                          )}
                          {!h.cost_usd && !h.mileage && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {h.completed_by_name?.charAt(0) || <User className="w-3 h-3" />}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{h.completed_by_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-gray-500 line-clamp-2 max-w-xs">{h.notes || 'No notes provided.'}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
