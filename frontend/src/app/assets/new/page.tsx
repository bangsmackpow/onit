// frontend/src/app/assets/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiPost } from '@/lib/apiClient'
import { ASSET_TEMPLATES, AssetTemplate, TaskTemplate } from '@/lib/templates'
import { 
  Car, 
  Home, 
  Zap, 
  ArrowLeft, 
  Check, 
  Plus, 
  Info,
  Calendar,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [step, setStep] = useState(1) // 1: Pick Type/Template, 2: Details
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTemplate | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    assetType: 'car' as 'car' | 'house' | 'appliance',
    description: '',
    includeDefaultTasks: true,
  })

  function selectTemplate(template: AssetTemplate) {
    setSelectedTemplate(template)
    setFormData({
      ...formData,
      name: `My ${template.name}`,
      assetType: template.type,
      includeDefaultTasks: true
    })
    setStep(2)
  }

  function selectCustom(type: 'car' | 'house' | 'appliance') {
    setSelectedTemplate(null)
    setFormData({
      ...formData,
      name: '',
      assetType: type,
      includeDefaultTasks: false
    })
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create the Asset
      const assetRes = await apiPost('/api/assets', {
        name: formData.name,
        assetType: formData.assetType,
        description: formData.description
      })
      
      const assetId = assetRes.data.asset.id

      // 2. Create Default Tasks if requested
      if (formData.includeDefaultTasks && selectedTemplate) {
        const today = new Date().toISOString().split('T')[0]
        
        // Parallel task creation
        await Promise.all(selectedTemplate.defaultTasks.map(task => 
          apiPost('/api/tasks', {
            assetId,
            taskName: task.name,
            description: task.description,
            assignmentType: 'single',
            assignedToUserIds: [], // Current user will be handled by backend or needs ID
            reminderDaysBefore: task.reminderDaysBefore,
            recurrenceType: task.recurrenceType,
            recurrenceInterval: task.recurrenceInterval,
            nextDueDate: today
          })
        ))
      }

      router.push('/assets')
    } catch (err: any) {
      console.error('Failed to create asset', err)
      setError(err.response?.data?.error || 'Failed to create asset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/assets" 
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Assets
        </Link>

        {step === 1 ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">What are we maintaining?</h1>
              <p className="text-gray-600 mt-2 text-lg">Pick a template to auto-populate common maintenance tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ASSET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => selectTemplate(tpl)}
                  className="bg-white p-8 rounded-3xl border-2 border-transparent shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all text-center flex flex-col items-center group"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:scale-110 transition-transform">
                    {tpl.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 truncate w-full">{tpl.name}</h3>
                  <p className="text-sm text-gray-500 mb-6">{tpl.defaultTasks.length} standard tasks included</p>
                  <div className="mt-auto w-full py-2 bg-gray-50 text-gray-500 font-bold text-sm rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    Select Template
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-8 border-t border-gray-100 mt-12">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center mb-6">Or start from scratch</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  { id: 'car', name: 'Other Vehicle', icon: Car },
                  { id: 'house', name: 'Other Property', icon: Home },
                  { id: 'appliance', name: 'Other Appliance', icon: Zap },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => selectCustom(type.id as any)}
                    className="flex items-center px-6 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-all shadow-sm"
                  >
                    <type.icon className="w-5 h-5 mr-3 text-gray-400" />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                  {formData.assetType === 'car' ? <Car className="w-8 h-8" /> : formData.assetType === 'house' ? <Home className="w-8 h-8" /> : <Zap className="w-8 h-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Name your {formData.assetType}</h2>
                  <p className="text-gray-500">Provide a descriptive name to track your tasks easily.</p>
                </div>
              </div>

              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-4 text-red-700">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Blue Honda Civic, My Summer House"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-medium text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder-gray-400 text-lg shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="VIN, Serial numbers, or location details..."
                    rows={4}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl font-medium text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-all placeholder-gray-400 shadow-inner"
                  />
                </div>

                {selectedTemplate && (
                  <div className="bg-blue-50 rounded-3xl p-6 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Check className="w-6 h-6 text-blue-600" />
                        <h3 className="text-lg font-bold text-blue-900">Template applied</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={formData.includeDefaultTasks} 
                          onChange={(e) => setFormData({...formData, includeDefaultTasks: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-bold text-blue-700">Include standard tasks</span>
                      </label>
                    </div>
                    
                    {formData.includeDefaultTasks && (
                      <div className="grid gap-3">
                        {selectedTemplate.defaultTasks.map(task => (
                          <div key={task.name} className="flex items-center bg-white border border-blue-100 px-4 py-3 rounded-xl shadow-sm">
                            <Calendar className="w-4 h-4 text-blue-400 mr-3" />
                            <span className="text-sm font-bold text-gray-800">{task.name}</span>
                            <span className="ml-auto text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-lg">
                              {task.recurrenceType}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-6 flex flex-col md:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 text-xl tracking-tight"
                  >
                    {loading ? 'Setting up Assets...' : 'Save & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-5 bg-white text-gray-500 font-bold rounded-2xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Change Type
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
