'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost } from '@/lib/apiClient'
import { 
  Users, 
  Shield, 
  Search, 
  Zap, 
  Star, 
  TrendingUp,
  Layout,
  Database,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'

interface Tenant {
  id: string
  name: string
  plan: 'free' | 'premium'
  owner_email: string
  created_at: string
}

interface Stats {
  totalTenants: number
  totalUsers: number
  totalAssets: number
  totalTasks: number
  growth: { day: string, count: number }[]
  distribution: { plan: string, count: number }[]
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [tenantsRes, statsRes] = await Promise.all([
        apiGet('/api/admin/tenants'),
        apiGet('/api/admin/stats')
      ])
      setTenants(tenantsRes.data.tenants || [])
      setStats(statsRes.data.stats || null)
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePlan = async (tenantId: string, currentPlan: string) => {
    const nextPlan = currentPlan === 'premium' ? 'free' : 'premium'
    setIsUpdating(tenantId)
    try {
      await apiPost(`/api/admin/tenants/${tenantId}/plan`, { plan: nextPlan })
      setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, plan: nextPlan as any } : t))
    } catch (err) {
      console.error('Failed to update plan', err)
      alert('Failed to update plan')
    } finally {
      setIsUpdating(null)
    }
  }

  const filteredTenants = tenants.filter(t => 
    t.name?.toLowerCase().includes(search.toLowerCase()) || 
    t.owner_email?.toLowerCase().includes(search.toLowerCase()) ||
    t.id.includes(search)
  )

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-10 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              <Shield className="w-10 h-10 text-rose-500" />
              Admin <span className="text-rose-500">Console</span>
            </h1>
            <p className="text-slate-400 text-lg">System-wide monitoring and household administration.</p>
          </div>
          
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-300 hover:bg-white/10 transition-all font-bold"
          >
            <RefreshCcw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Households" 
            value={stats?.totalTenants || 0} 
            icon={Layout} 
            color="indigo" 
          />
          <StatCard 
            title="Active Users" 
            value={stats?.totalUsers || 0} 
            icon={Users} 
            color="emerald" 
          />
          <StatCard 
            title="Assets Managed" 
            value={stats?.totalAssets || 0} 
            icon={Database} 
            color="amber" 
          />
          <StatCard 
            title="Tasks Completed" 
            value={stats?.totalTasks || 0} 
            icon={CheckCircle2} 
            color="rose" 
          />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Growth Chart */}
          <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
              <TrendingUp className="w-12 h-12 text-white/5 group-hover:text-indigo-500/10 transition-colors duration-700" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  Household Growth
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest">Last 7 Days</span>
                </h2>
                <p className="text-slate-400 font-medium">Daily registration velocity.</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-end gap-2 md:gap-4 relative px-4">
              <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-px bg-white/[0.03]" />)}
              </div>

              {stats?.growth.map((point, index) => {
                const maxCount = Math.max(...stats.growth.map(g => g.count), 5)
                const heightPercentage = (point.count / maxCount) * 100
                return (
                  <div key={point.day} className="flex-1 flex flex-col items-center gap-4 group/bar">
                    <div className="relative w-full flex flex-col items-center justify-end h-48">
                      <div className="absolute -top-10 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 scale-90 group-hover/bar:scale-100 z-10 bg-white text-[#020617] px-3 py-1.5 rounded-xl font-black text-xs shadow-xl shadow-indigo-600/20 pointer-events-none after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-white">
                        {point.count} Added
                      </div>
                      <div 
                        style={{ height: `${Math.max(heightPercentage, 4)}%` }}
                        className={clsx(
                          "w-full max-w-[40px] rounded-t-xl transition-all duration-1000 ease-out relative group-hover/bar:max-w-[45px]",
                          point.count > 0 ? "bg-gradient-to-t from-indigo-600/20 to-indigo-500" : "bg-white/5"
                        )}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity rounded-t-xl" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/bar:text-indigo-400 transition-colors">
                        {index === stats.growth.length - 1 ? 'Today' : format(parseISO(point.day), 'EEE')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Distribution Circle */}
          <div className="glass-card p-10 rounded-[3rem] flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="space-y-1 mb-10 w-full text-left">
              <h2 className="text-2xl font-black text-white">Plan Mix</h2>
              <p className="text-slate-400 font-medium">Free vs Premium tier split.</p>
            </div>

            <div className="relative w-48 h-48 mb-10">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-white/5"
                />
                {/* Premium Segment */}
                {(() => {
                  const premiumCount = stats?.distribution.find(d => d.plan === 'premium')?.count || 0
                  const total = stats?.totalTenants || 1
                  const percentage = (premiumCount / total) * 100
                  const circumference = 2 * Math.PI * 40
                  const offset = circumference - (percentage / 100) * circumference
                  
                  return (
                    <circle
                      cx="50" cy="50" r="40"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      strokeLinecap="round"
                      className="text-indigo-500 transition-all duration-1000 ease-in-out"
                    />
                  )
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-black text-white">
                  {Math.round(((stats?.distribution.find(d => d.plan === 'premium')?.count || 0) / (stats?.totalTenants || 1)) * 100)}%
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Premium</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Free</p>
                </div>
                <p className="text-xl font-black text-white">{stats?.distribution.find(d => d.plan === 'free')?.count || 0}</p>
              </div>
              <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Premium</p>
                </div>
                <p className="text-xl font-black text-white">{stats?.distribution.find(d => d.plan === 'premium')?.count || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Households List */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h2 className="text-2xl font-black text-white pl-2 flex items-center gap-3">
              Manage Households
              <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{filteredTenants.length} results</span>
            </h2>
            
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {loading && tenants.length === 0 ? (
              [1, 2, 3].map(i => <div key={i} className="h-24 glass-card animate-pulse rounded-3xl" />)
            ) : filteredTenants.map((tenant) => (
              <div key={tenant.id} className="glass-card p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-white/20 transition-all">
                <div className="flex items-center gap-5">
                  <div className={clsx(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg",
                    tenant.plan === 'premium' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-slate-800 text-slate-500"
                  )}>
                    {tenant.plan === 'premium' ? <Star className="w-8 h-8 fill-indigo-400" /> : <Layout className="w-8 h-8" />}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-3">
                      {tenant.name || 'Unnamed Household'}
                      {tenant.plan === 'premium' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] rounded-full uppercase tracking-tighter">
                          <Zap className="w-2 h-2 fill-indigo-300" /> Premium
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" /> {tenant.owner_email || 'No Owner'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Created {format(parseISO(tenant.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-right hidden lg:block mr-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Tenant ID</p>
                    <p className="text-[10px] font-mono text-slate-400">{tenant.id}</p>
                  </div>
                  <button
                    onClick={() => togglePlan(tenant.id, tenant.plan)}
                    disabled={isUpdating === tenant.id}
                    className={clsx(
                      "w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50",
                      tenant.plan === 'premium' 
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20" 
                        : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500"
                    )}
                  >
                    {isUpdating === tenant.id ? 'Updating...' : tenant.plan === 'premium' ? 'Revoke Premium' : 'Grant Premium'}
                  </button>
                </div>
              </div>
            ))}
            
            {!loading && filteredTenants.length === 0 && (
              <div className="py-20 text-center glass-card rounded-[3rem] border-dashed">
                <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400">No households found</h3>
                <p className="text-slate-500">Try searching for a different name or email.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: 'indigo' | 'emerald' | 'amber' | 'rose' }) {
  const colors = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    rose: "text-rose-400 bg-rose-500/10 border-rose-500/20"
  }

  return (
    <div className="glass-card p-6 rounded-[2.5rem] space-y-4">
      <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border", colors[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  )
}
