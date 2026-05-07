'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPut } from '@/lib/apiClient'
import { 
  ArrowLeft, 
  Save, 
  X,
  AlertCircle,
  Car,
  Home,
  Zap,
  Cpu,
  Database
} from 'lucide-react'
import Link from 'next/link'

function EditAssetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    assetType: 'car' as 'car' | 'house' | 'appliance',
    description: '',
  })

  useEffect(() => {
    if (!id) return
    async function fetchAsset() {
      try {
        const res = await apiGet(`/api/assets/${id}`)
        const { asset } = res.data
        setFormData({
          name: asset.name,
          assetType: asset.asset_type,
          description: asset.description || '',
        })
      } catch (err) {
        console.error('Failed to fetch asset', err)
        setError('Failed to load asset data')
      } finally {
        setLoading(false)
      }
    }
    fetchAsset()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await apiPut(`/api/assets/${id}`, {
        name: formData.name,
        assetType: formData.assetType,
        description: formData.description
      })
      router.push(`/assets/detail?id=${id}`)
    } catch (err: any) {
      console.error('Failed to update asset', err)
      setError(err.response?.data?.error || 'Failed to update asset. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto p-32 text-center group">
      <div className="glow-mesh" />
      <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-8"></div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Application State...</p>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <Link 
        href={`/assets/detail?id=${id}`}
        className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
        Discard Changes
      </Link>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
          Modify <span className="text-indigo-500">Infrastructure</span>
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-lg">
          Update identifiers and metadata for your household assets.
        </p>
      </div>

      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-5 text-rose-400 animate-in slide-in-from-top-4 duration-500">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card rounded-[3.5rem] overflow-hidden p-10 md:p-16 space-y-12 relative">
        <div className="glow-mesh" />
        
        <div className="space-y-12 relative z-10">
          <div className="flex items-center gap-8 mb-4">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              {formData.assetType === 'car' ? <Car className="w-10 h-10 text-white" /> : formData.assetType === 'house' ? <Home className="w-10 h-10 text-white" /> : <Zap className="w-10 h-10 text-white" />}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">Unit <span className="text-indigo-500">Re-Configuration</span></h2>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Class: {formData.assetType}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Cpu className="w-3 h-3" />
              Operational Callsign
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Unit-01 Primis"
              className="input-premium py-6 px-8 text-xl"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-6 flex items-center gap-2">
              <Database className="w-3 h-3" />
              Asset Metadata
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Identify VIN, Serial indices, or geo-spatial data..."
              rows={4}
              className="input-premium py-6 px-8"
            />
          </div>

          <div className="pt-10 flex flex-col md:flex-row gap-6">
            <button
              type="submit"
              disabled={saving}
              className="btn-premium btn-premium-primary flex-1 h-[72px] text-lg shadow-2xl group/submit"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Synchronizing...
                </>
              ) : (
                <>
                  Save Changes
                  <Save className="w-6 h-6 group-hover/submit:scale-110 transition-transform" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-premium btn-premium-secondary h-[72px] px-10 border-white/5"
            >
              <X className="w-5 h-5 text-slate-500" />
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function EditAssetPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <EditAssetForm />
      </Suspense>
    </DashboardLayout>
  )
}
