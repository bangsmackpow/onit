// frontend/src/app/wizard/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight
} from 'lucide-react'
import { apiPost } from '@/lib/apiClient'
import { ASSET_TEMPLATES } from '@/lib/templates'
import { clsx } from 'clsx'
import Logo from '@/components/Logo'

type Step = 'welcome' | 'assets' | 'tasks' | 'complete'

export default function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const toggleTemplate = (name: string) => {
    if (selectedTemplates.includes(name)) {
      setSelectedTemplates(selectedTemplates.filter(t => t !== name))
    } else {
      setSelectedTemplates([...selectedTemplates, name])
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      // Create selected assets and their default tasks
      for (const tplName of selectedTemplates) {
        const tpl = ASSET_TEMPLATES.find(t => t.name === tplName)
        if (!tpl) continue

        const assetRes = await apiPost('/api/assets', {
          name: tpl.name,
          assetType: tpl.type,
          description: `Initialized via onboarding protocol.`
        })

        const assetId = assetRes.data.asset.id

        for (const task of tpl.defaultTasks) {
          await apiPost('/api/tasks', {
            assetId,
            taskName: task.name,
            description: task.description,
            recurrenceType: task.recurrenceType,
            recurrenceInterval: task.recurrenceInterval,
            reminderDaysBefore: task.reminderDaysBefore,
            nextDueDate: new Date().toISOString().split('T')[0], // Start today
            assignmentType: 'single',
            assignedToUserIds: []
          })
        }
      }
      setStep('complete')
    } catch (err) {
      console.error('Onboarding failed', err)
      alert('Failed to complete onboarding. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 text-center">
            <div className="space-y-6">
              <div className="flex justify-center mb-8">
                <Logo size="lg" />
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none">
                Begin <span className="text-indigo-600 text-outline">Clarity.</span>
              </h1>
              <p className="text-slate-400 text-2xl font-medium max-w-xl mx-auto leading-relaxed">
                Welcome to your new household standard. Let's synchronize your infrastructure in three simple steps.
              </p>
            </div>
            <button 
              onClick={() => setStep('assets')}
              className="btn-zen-primary h-20 px-12 text-xl shadow-2xl shadow-indigo-600/20 mx-auto"
            >
              Start Synchronization
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )

      case 'assets':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="text-center space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Step 01 / 02</span>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Identify Your <span className="text-indigo-600">Inventory</span></h2>
              <p className="text-slate-400 text-lg font-medium">Select the systems you wish to monitor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {ASSET_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.name}
                  onClick={() => toggleTemplate(tpl.name)}
                  className={clsx(
                    "zen-card flex items-center gap-6 text-left group transition-all duration-500",
                    selectedTemplates.includes(tpl.name) 
                      ? "border-indigo-600 bg-indigo-50/30 shadow-xl" 
                      : "hover:border-slate-300"
                  )}
                >
                  <div className={clsx(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110 duration-700",
                    selectedTemplates.includes(tpl.name) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {tpl.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{tpl.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{tpl.defaultTasks.length} Automated Protocols</p>
                  </div>
                  {selectedTemplates.includes(tpl.name) && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center animate-in zoom-in duration-300">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button 
                disabled={selectedTemplates.length === 0}
                onClick={handleFinish}
                className="btn-zen-primary h-20 px-12 text-xl disabled:opacity-30 disabled:grayscale transition-all shadow-2xl shadow-indigo-600/20"
              >
                {loading ? 'Processing Neural Grid...' : 'Finalize Selection'}
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="space-y-12 animate-in fade-in zoom-in duration-1000 text-center max-w-2xl mx-auto">
            <div className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-10 border border-emerald-100 shadow-xl shadow-emerald-500/5 animate-float">
              <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="space-y-6">
              <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                System <span className="text-emerald-500">Live.</span>
              </h2>
              <p className="text-slate-400 text-xl font-medium leading-relaxed">
                Your household infrastructure is now synchronized. Maintenance protocols have been established and scheduled.
              </p>
            </div>
            <button 
              onClick={() => router.push('/dashboard')}
              className="btn-zen-primary h-20 px-12 text-xl bg-slate-900 mx-auto"
            >
              Enter Dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-white selection:bg-indigo-100">
      {/* Zen Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:40px_40px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="relative min-h-[600px] flex items-center justify-center">
          {renderStep()}
        </div>

        <p className="mt-20 text-center text-slate-300 text-xs font-black uppercase tracking-[0.4em]">
          Powered by Household Intelligence Protocol v2.0
        </p>
      </div>
    </main>
  )
}
