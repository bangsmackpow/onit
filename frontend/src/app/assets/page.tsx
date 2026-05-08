// frontend/src/app/assets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet } from '@/lib/apiClient'
import { 
  Plus, 
  Car, 
  Home, 
  Zap, 
  Package,
  ShieldCheck,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface Asset {
  id: string
  name: string
  asset_type: 'car' | 'house' | 'appliance'
  description?: string
  task_count: number
  overdue_count: number
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  async function fetchAssets() {
    try {
      const res = await apiGet('/api/assets')
      setAssets(res.data.assets || [])
    } catch (err) {
      console.error('Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-10 h-10" />
      case 'house': return <Home className="w-10 h-10" />
      case 'appliance': return <Zap className="w-10 h-10" />
      default: return <Package className="w-10 h-10" />
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-16 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-12">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none">
              Household<span className="text-indigo-600">.</span>
            </h1>
            <p className="text-slate-400 text-xl font-medium max-w-lg leading-relaxed">
              Managing {assets.length} core infrastructure units within your neural family grid.
            </p>
          </div>
          <Link 
            href="/assets/new" 
            className="btn-zen-primary h-16 px-10 text-lg shadow-2xl shadow-indigo-600/20"
          >
            <Plus className="w-6 h-6" />
            Initialize Asset
          </Link>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-80 bg-slate-50 border border-slate-100 animate-pulse rounded-[3rem]" />)}
          </div>
        ) : assets.length === 0 ? (
          <div className="zen-card p-32 text-center border-dashed">
            <Package className="w-20 h-20 text-slate-200 mx-auto mb-8" />
            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">No Infrastructure Detected</h3>
            <p className="text-slate-400 max-w-sm mx-auto font-medium text-lg leading-relaxed mb-10">Start by adding your home or vehicle to generate a maintenance sequence.</p>
            <Link href="/assets/new" className="btn-zen-primary inline-flex">
              Add Your First Asset
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assets.map((asset) => (
              <Link 
                key={asset.id} 
                href={`/assets/detail?id=${asset.id}`}
                className="zen-card group relative overflow-hidden flex flex-col justify-between min-h-[320px] hover:border-indigo-200"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-700">
                  {getTypeIcon(asset.asset_type)}
                </div>

                <div className="space-y-6 relative z-10">
                  <div className={clsx(
                    "w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-inner transition-all duration-700 group-hover:scale-110",
                    asset.asset_type === 'car' ? "bg-indigo-600 shadow-indigo-600/20" : 
                    asset.asset_type === 'house' ? "bg-emerald-600 shadow-emerald-600/20" : 
                    "bg-amber-500 shadow-amber-500/20"
                  )}>
                    {getTypeIcon(asset.asset_type)}
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight leading-none mb-3">
                      {asset.name}
                    </h3>
                    <p className="text-slate-400 font-medium line-clamp-1 text-sm">{asset.description || 'Standard infrastructure unit'}</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 flex items-center justify-between relative z-10 mt-auto">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Protocols</p>
                      <p className="text-xl font-black text-slate-900">{asset.task_count}</p>
                    </div>
                    <div className="w-[1px] h-6 bg-slate-100" />
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Health</p>
                      <p className={clsx("text-xl font-black", asset.overdue_count > 0 ? "text-rose-500" : "text-emerald-500")}>
                        {asset.overdue_count > 0 ? 'Critical' : 'Sync'}
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Global Household Health */}
        <div className="zen-card-priority flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black">Household Integrity</h2>
              <p className="text-slate-400 font-medium max-w-sm">All systems are currently being monitored for maintenance synchronization.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex-1 md:w-32 bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
              <p className="text-xl font-black text-emerald-400 uppercase tracking-tighter">Healthy</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
