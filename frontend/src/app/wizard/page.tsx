'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Car, 
  Calendar, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ShieldCheck,
  Droplets,
  Thermometer,
  Waves
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/store/authStore'
import { apiPost } from '@/lib/apiClient'

type WizardStep = 1 | 2 | 3 | 4 | 5

interface AssetOption {
  id: string
  name: string
  icon: React.ReactNode
  category: 'home' | 'vehicle' | 'appliance'
  defaultTasks: { name: string; frequency: string; description: string }[]
}

const ASSET_OPTIONS: AssetOption[] = [
  {
    id: 'hvac',
    name: 'HVAC / AC System',
    icon: <Thermometer className="w-5 h-5" />,
    category: 'home',
    defaultTasks: [
      { name: 'Change Air Filter', frequency: '90 days', description: 'Replace the main HVAC return air filter.' },
      { name: 'Annual Inspection', frequency: '1 year', description: 'Schedule professional maintenance.' }
    ]
  },
  {
    id: 'water_heater',
    name: 'Water Heater',
    icon: <Droplets className="w-5 h-5" />,
    category: 'home',
    defaultTasks: [
      { name: 'Flush Tank', frequency: '1 year', description: 'Remove sediment buildup from the tank.' }
    ]
  },
  {
    id: 'washer',
    name: 'Washing Machine',
    icon: <Waves className="w-5 h-5" />,
    category: 'appliance',
    defaultTasks: [
      { name: 'Clean Drum', frequency: '60 days', description: 'Run a cleaning cycle with vinegar or cleaner.' }
    ]
  },
  {
    id: 'car_main',
    name: 'Primary Vehicle',
    icon: <Car className="w-5 h-5" />,
    category: 'vehicle',
    defaultTasks: [
      { name: 'Oil Change', frequency: '180 days', description: 'Check and replace engine oil.' },
      { name: 'Tire Rotation', frequency: '180 days', description: 'Rotate tires to ensure even wear.' }
    ]
  },
  {
    id: 'roof',
    name: 'Roof & Gutters',
    icon: <ShieldCheck className="w-5 h-5" />,
    category: 'home',
    defaultTasks: [
      { name: 'Clean Gutters', frequency: '180 days', description: 'Remove leaves and debris.' }
    ]
  }
]

export default function OnboardingWizard() {
  const router = useRouter()
  const { token } = useAuthStore()
  const [step, setStep] = useState<WizardStep>(1)
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [propertyType, setPropertyType] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  // Redirect if not logged in
  useEffect(() => {
    if (!token) router.push('/login')
  }, [token, router])

  const toggleAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      // Create selected assets and their default tasks
      for (const assetId of selectedAssets) {
        const option = ASSET_OPTIONS.find(a => a.id === assetId)
        if (!option) continue

        const assetResponse = await apiPost('/api/assets', {
          name: option.name,
          type: option.category,
          status: 'active',
          metadata: { onboarded: true, propertyType }
        })

        const createdAsset = assetResponse.data
        
        // Add default tasks
        for (const task of option.defaultTasks) {
          await apiPost('/api/tasks', {
            assetId: createdAsset.id,
            name: task.name,
            frequency: task.frequency,
            description: task.description,
            status: 'pending'
          })
        }
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error during onboarding:', error)
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20 mb-6">
              <Home className="w-12 h-12 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold font-outfit text-white">Let's Get Organized</h1>
            <p className="text-slate-400 max-w-sm mx-auto">
              Welcome to ONIT. We'll help you set up your household maintenance schedule in less than 2 minutes.
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold shadow-xl shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mx-auto w-full max-w-xs"
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">What type of property?</h2>
              <p className="text-slate-400">This helps us recommend the right maintenance.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {['Single Family House', 'Apartment / Condo', 'Rental Unit', 'Townhouse'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPropertyType(type)
                    setStep(3)
                  }}
                  className={clsx(
                    "p-5 text-left rounded-2xl border-2 transition-all group flex items-center justify-between",
                    propertyType === type 
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20" 
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
                  )}
                >
                  <span className="font-semibold text-white">{type}</span>
                  <ArrowRight className={clsx(
                    "w-5 h-5 transition-all text-slate-500 group-hover:text-blue-400",
                    propertyType === type && "translate-x-1"
                  )} />
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">What do you own?</h2>
              <p className="text-slate-400">Select everything that needs maintenance.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {ASSET_OPTIONS.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => toggleAsset(asset.id)}
                  className={clsx(
                    "p-4 text-left rounded-2xl border-2 transition-all flex items-center gap-4",
                    selectedAssets.includes(asset.id)
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-800 bg-slate-900/50"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    selectedAssets.includes(asset.id) ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-500"
                  )}>
                    {asset.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">{asset.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wider">{asset.category}</p>
                  </div>
                  {selectedAssets.includes(asset.id) && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                </button>
              ))}
            </div>
            <div className="pt-4 flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-4 text-slate-400 font-semibold rounded-2xl hover:bg-white/5 transition-colors">Back</button>
              <button 
                onClick={() => setStep(4)} 
                disabled={selectedAssets.length === 0}
                className="flex-[2] py-4 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20"
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4">
                <Calendar className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Scheduling Intent</h2>
              <p className="text-slate-400 px-4">Based on your selections, we will generate {selectedAssets.reduce((acc, curr) => acc + (ASSET_OPTIONS.find(a => a.id === curr)?.defaultTasks.length || 0), 0)} recurring tasks.</p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <p className="font-semibold text-white">Daily Digest Strategy</p>
                  <p className="text-sm text-slate-500">We'll send you one email at 9:00 AM ONLY when things need attention.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 mt-1" />
                <div>
                  <p className="font-semibold text-white">Intelligent Intervals</p>
                  <p className="text-sm text-slate-500">Filters every 3 months, tank flush annually, etc. All customizable later.</p>
                </div>
              </div>
            </div>
            <div className="pt-4 flex gap-4">
              <button onClick={() => setStep(3)} className="flex-1 py-4 text-slate-400 font-semibold rounded-2xl hover:bg-white/5 transition-colors">Back</button>
              <button 
                onClick={() => setStep(5)} 
                className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20"
              >
                Almost Done
              </button>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6 text-center py-8">
            <div className="mx-auto w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-6 animate-pulse">
              <ShieldCheck className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold font-outfit text-white">Ready to Roll?</h2>
            <p className="text-slate-400 max-w-sm mx-auto">
              We'll populate your dashboard with your new assets and schedule. You can add more specifically at any time.
            </p>
            <div className="mt-8 space-y-3">
              <button
                onClick={handleFinish}
                disabled={isSubmitting}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/20 transition-all w-full max-w-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Finalizing...' : 'Take me to my Dashboard'}
              </button>
              
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all w-full max-w-xs mx-auto border border-white/10"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  Install App to Home Screen
                </button>
              )}

              <p className="text-xs text-slate-500 italic">By clicking, you agree to receive maintenance reminders.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center px-6 py-12">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-lg z-10">
        {/* Progress Bar */}
        <div className="flex justify-between mb-8 gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={clsx(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                step >= s ? "bg-blue-500" : "bg-slate-800"
              )} 
            />
          ))}
        </div>

        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] to-transparent pointer-events-none" />
          
          {renderStep()}
        </div>

        <p className="mt-8 text-center text-slate-500 text-sm">
          Secured with family-grade encryption
        </p>
      </div>
    </main>
  )
}
