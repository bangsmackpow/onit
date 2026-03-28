// frontend/src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error, user } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLocalError('')

    if (!email || !password) {
      setLocalError('Please fill in all fields')
      return
    }

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden">
      {/* Immersive Background */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[120px] -z-10" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none -z-10" />

      <div className="w-full max-w-[480px] relative">
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 blur-2xl -z-10 rounded-[3rem]" />
        
        <div className="glass-card rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden">
          <div className="glow-mesh" />
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-[2rem] mb-8 shadow-2xl shadow-indigo-600/40 relative group overflow-hidden">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Zap className="w-10 h-10 text-white relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
              ONIT<span className="text-indigo-500">.</span>
            </h1>
            <p className="text-slate-400 font-medium text-sm tracking-wide">Sign in to manage your household</p>
          </div>

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-200 text-xs font-semibold leading-relaxed">{error || localError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="input-premium pl-14"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-4">
                <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Password
                </label>
                <Link href="/forgot" className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-premium pl-14"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-premium btn-premium-primary w-full h-[64px] text-base group mt-4 shadow-xl"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing In...
                </div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.1em]">
              Family Dashboard Access
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Secure Family Storage Enabled</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm font-medium">
            New here?{' '}
            <Link href="/register" className="text-indigo-400 font-black hover:text-white transition-all underline decoration-indigo-500/30 underline-offset-4">
              Create New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
