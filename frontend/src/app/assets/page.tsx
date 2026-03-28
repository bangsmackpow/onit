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
  ChevronRight
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
      case 'car': return 'bg-blue-50 text-blue-600'
      case 'house': return 'bg-emerald-50 text-emerald-600'
      case 'appliance': return 'bg-amber-50 text-amber-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
            <p className="text-gray-600">Manage your vehicles, property, and appliances</p>
          </div>
          <Link 
            href="/assets/new" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Asset
          </Link>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex gap-4 text-sm font-medium text-gray-500">
            <span>{assets.length} Total Assets</span>
            <span className="text-gray-300">|</span>
            <span>{assets.filter(a => a.asset_type === 'car').length} Cars</span>
            <span className="text-gray-300">|</span>
            <span>{assets.filter(a => a.asset_type === 'house').length} Properties</span>
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-2xl" />)}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No assets found</h3>
            <p className="text-gray-500 mt-2 mb-8 max-w-sm mx-auto">
              Start by adding your first vehicle or property to get personalized maintenance reminders.
            </p>
            <Link 
              href="/assets/new" 
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              Add Your First Asset
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <div 
                key={asset.id} 
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all overflow-hidden flex flex-col"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${getTypeColor(asset.asset_type)}`}>
                      {getTypeIcon(asset.asset_type)}
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize mb-4 flex items-center">
                    {asset.asset_type}
                    <span className="mx-2 text-gray-200">•</span>
                    Added {new Date(asset.created_at).toLocaleDateString()}
                  </p>
                  
                  {asset.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {asset.description}
                    </p>
                  )}
                </div>

                <Link 
                  href={`/assets/${asset.id}`} 
                  className="bg-gray-50 px-6 py-4 flex items-center justify-between text-sm font-bold text-gray-700 hover:bg-blue-600 hover:text-white transition-all border-t border-gray-100"
                >
                  View Details
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
