// frontend/src/app/assets/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import { apiPost } from '@/lib/apiClient'
import { ASSET_TEMPLATES, AssetTemplate } from '@/lib/templates'
import { 
  Car, 
  Home, 
  Zap, 
  ArrowLeft, 
  Check, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  X
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
            assignedToUserIds: [], // Current user will be handled by backend
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
      <div className="max-w-5xl mx-auto space-y-12 pb-24">
        <Link 
          href="/assets" 
          className="inline-flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-indigo-400 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-3 group-hover:-translate-x-1 transition-transform" />
          Abort Initialization
        </Link>

        {step === 1 ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Select <span className="text-indigo-500">Classification</span>
              </h1>
              <p className="text-slate-400 text-lg font-medium max-w-lg">
                Choose a pre-configured maintenance blueprint for rapid system deployment.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {ASSET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => selectTemplate(tpl)}
                  className="group glass-card p-10 rounded-[3rem] hover:border-indigo-500/30 transition-all text-center flex flex-col items-center relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[40px] group-hover:bg-indigo-600/5 transition-colors" />
                  
                  <div className="w-24 h-24 bg-slate-950 rounded-[2rem] border border-white/5 flex items-center justify-center text-5xl mb-8 shadow-inner group-hover:scale-110 group-hover:border-indigo-500/20 transition-all duration-500">
                    <span className="opacity-80 group-hover:opacity-100 transition-opacity">{tpl.icon}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:text-indigo-400 transition-colors uppercase">{tpl.name}</h3>
                  <div className="flex items-center gap-2 mb-10">
                    <Layers className="w-4 h-4 text-emerald-500/50" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{tpl.defaultTasks.length} Automated Protocols</p>
                  </div>
                  
                  <div className="mt-auto w-full py-4 bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    Initiate Blueprint
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-16 border-t border-white/5 mt-16">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-10">Manual system configuration</h3>
              <div className="flex flex-wrap justify-center gap-6">
                {[
                  { id: 'car', name: 'Other Vehicle', icon: Car, color: 'text-indigo-400' },
                  { id: 'house', name: 'Other Property', icon: Home, color: 'text-emerald-400' },
                  { id: 'appliance', name: 'Other Appliance', icon: Zap, color: 'text-amber-400' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => selectCustom(type.id as any)}
                    className="flex items-center px-8 py-4 glass-card rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-white hover:border-white/20 transition-all shadow-sm group"
                  >
                    <type.icon className={`w-4 h-4 mr-4 ${type.color} group-hover:scale-110 transition-transform`} />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in-95 duration-700 relative">
            <div className="glow-mesh" />
            
            <div className="p-10 md:p-16 relative z-10">
              <div className="flex items-center gap-8 mb-16">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-110 transition-transform duration-500">
                  {formData.assetType === 'car' ? <Car className="w-10 h-10 text-white" /> : formData.assetType === 'house' ? <Home className="w-10 h-10 text-white" /> : <Zap className="w-10 h-10 text-white" />}
                </div>
                <div>
                  <h2 className="text-4xl font-black text-white tracking-tight uppercase leading-tight">Identifier <span className="text-indigo-500">Assignment</span></h2>
                  <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-2">Unit Classification: {formData.assetType}</p>
                </div>
              </div>

              {error && (
                <div className="mb-12 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-5 text-rose-400 animate-in slide-in-from-top-4 duration-500">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-bold text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
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
                    Asset Metadata (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Identify VIN, Serial indices, or geo-spatial data..."
                    rows={4}
                    className="input-premium py-6 px-8"
                  />
                </div>

                {selectedTemplate && (
                  <div className="glass-card rounded-[2.5rem] p-8 md:p-12 border-white/5 bg-white/[0.02]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                          <Check className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-white tracking-tight uppercase">Protocol Bundling</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={formData.includeDefaultTasks} 
                          onChange={(e) => setFormData({...formData, includeDefaultTasks: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-8 bg-slate-900 border border-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 transition-colors"></div>
                        <span className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">Auto-Inject Protocols</span>
                      </label>
                    </div>
                    
                    {formData.includeDefaultTasks && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTemplate.defaultTasks.map(task => (
                          <div key={task.name} className="flex items-center bg-white/[0.03] border border-white/5 px-5 py-4 rounded-2xl group/item hover:border-white/10 transition-colors">
                            <Calendar className="w-4 h-4 text-slate-600 mr-4 group-hover/item:text-indigo-400 transition-colors" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-tight">{task.name}</span>
                            <span className="ml-auto text-[8px] font-black text-indigo-400 uppercase bg-indigo-400/10 px-2 py-1 rounded-lg border border-indigo-400/10">
                              {task.recurrenceType}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-10 flex flex-col md:flex-row gap-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-premium btn-premium-primary flex-1 h-[72px] text-lg shadow-2xl group/submit"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Synchronizing...
                      </>
                    ) : (
                      <>
                        Initialize & Commit
                        <ArrowRight className="w-6 h-6 group-hover/submit:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-premium btn-premium-secondary h-[72px] px-10 border-white/5"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                    Re-Classify
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
