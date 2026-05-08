'use client'

import { Check } from 'lucide-react'

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const containerClasses = {
    sm: 'w-6 h-6 rounded-md',
    md: 'w-10 h-10 rounded-xl border-2',
    lg: 'w-16 h-16 rounded-2xl border-4'
  }
  
  const iconSizes = {
    sm: 12,
    md: 20,
    lg: 32
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`
        ${containerClasses[size]} 
        bg-white border-slate-200 
        flex items-center justify-center 
        shadow-sm transition-all duration-500 hover:border-indigo-500 group
      `}>
        <Check 
          size={iconSizes[size]} 
          className="text-indigo-600 stroke-[4px] transition-transform duration-500 group-hover:scale-110" 
        />
      </div>
      <span className={`
        font-black tracking-tighter text-slate-900
        ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-4xl'}
      `}>
        ONIT<span className="text-indigo-600">.</span>
      </span>
    </div>
  )
}
