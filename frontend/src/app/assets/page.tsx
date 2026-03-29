// frontend/src/app/assets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiDelete } from '@/lib/apiClient'
import { 
  Plus, 
  Car, 
  Home, 
  Zap, 
  Trash2, 
  Search,
  ChevronRight,
  Filter,
  LayoutGrid
} from 'lucide-react'
import Link from 'next/link'

interface Asset {
  id: string
  name: string
  asset_type: 'car' | 'house' | 'appliance'
  description?: string
  created_at: string
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this asset? All associated tasks will be removed.')) return
    try {
      await apiDelete(`/api/assets/${id}`)
      setAssets(assets.filter(a => a.id !== id))
    } catch (err) {
      alert('Failed to delete asset')
    }
  }

  const filteredAssets = assets.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.asset_type.toLowerCase().includes(search.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'car': return <Car className="w-6 h-6" />
      case 'house': return <Home className="w-6 h-6" />
      case 'appliance': return <Zap className="w-6 h-6" />
      default: return <Plus className="w-6 h-6" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'car': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      case 'house': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'appliance': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Household <span className="text-emerald-500">Assets</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-lg">
              Keep track of your cars, appliances, and home systems.
            </p>
          </div>
          <Link 
            href="/assets/new" 
            className="btn-premium btn-premium-primary"
          >
            <Plus className="w-5 h-5" />
            Add Asset
          </Link>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between glass-card p-4 rounded-[2rem]">
          <div className="relative w-full lg:max-w-md group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Filter assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-premium pl-14 py-3 bg-slate-950/30"
            />
          </div>
          
          <div className="flex items-center gap-8 px-6">
            <div className="flex items-center gap-3">
              <LayoutGrid className="w-4 h-4 text-slate-500" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                <span className="text-white">{assets.length}</span> Items
              </p>
            </div>
            <div className="w-[1px] h-4 bg-white/10" />
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-slate-500" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                 Categorized
              </p>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-48 glass-card animate-pulse rounded-[2.5rem]" />)}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="glass-card rounded-[3rem] p-24 text-center relative overflow-hidden group">
            <div className="glow-mesh" />
            <div className="w-24 h-24 bg-slate-950 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-white/5 group-hover:scale-110 transition-transform duration-500">
              <Plus className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">No Assets Found</h3>
            <p className="text-slate-400 mb-10 max-w-sm mx-auto font-medium">
              Add your first car, house, or appliance unit to start tracking maintenance.
            </p>
            <Link 
              href="/assets/new" 
              className="btn-premium btn-premium-primary inline-flex"
            >
              <Plus className="w-5 h-5" />
              Add Your First Item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="group glass-card rounded-[2.5rem] hover:border-indigo-500/30 transition-all flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] -z-10 group-hover:bg-indigo-600/5 transition-colors" />
                
                <div className="p-8 flex-1">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`p-4 rounded-2xl border ${getTypeColor(asset.asset_type)} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                      {getTypeIcon(asset.asset_type)}
                    </div>
                    <button 
                      onClick={() => handleDelete(asset.id)}
                      className="p-3 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tight group-hover:text-indigo-400 transition-colors">
                    {asset.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-6 text-slate-500">
                    <p className="text-[10px] font-black uppercase tracking-widest py-1 px-3 bg-white/5 rounded-full border border-white/5 text-slate-400">
                      {asset.asset_type}
                    </p>
                  </div>
                  
                  {asset.description && (
                    <p className="text-sm font-medium text-slate-400 line-clamp-2 leading-relaxed h-10">
                      {asset.description}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/5 group-hover:bg-indigo-600 transition-all">
                  <Link 
                    href={`/assets/detail?id=${asset.id}`} 
                    className="flex items-center justify-between px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-300 group-hover:text-white"
                  >
                    View Item Details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
