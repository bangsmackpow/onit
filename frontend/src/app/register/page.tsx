// frontend/src/app/register/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Mail, Lock, User, Building, AlertCircle, ArrowRight, ShieldCheck, UserPlus } from 'lucide-react'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  const { register, loading, error, user } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    tenantName: '',
  })
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

    if (!formData.email || !formData.password || !formData.fullName) {
      setLocalError('Please fill in all required fields')
      return
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters')
      return
    }

    try {
      await register(formData.tenantName, formData.fullName, formData.email, formData.password, inviteToken || undefined)
      router.push('/dashboard')
    } catch (err: any) {
      setLocalError(err.response?.data?.error || 'Registration failed')
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
              <User className="w-10 h-10 text-white relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
              {inviteToken ? 'JOIN HOUSEHOLD' : 'CREATE ACCOUNT'}
            </h1>
            <p className="text-slate-400 font-medium text-sm tracking-wide">
              {inviteToken ? 'You have been invited to join a household.' : 'Enter your information below to get started'}
            </p>
          </div>

          {/* Invitation Badge */}
          {inviteToken && (
            <div className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-3">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              <p className="text-indigo-200 text-xs font-bold">Invitation Active</p>
            </div>
          )}

          {/* Error Message */}
          {(error || localError) && (
            <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-rose-200 text-xs font-semibold leading-relaxed">{error || localError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">
                Name *
              </label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="input-premium pl-14"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">
                Email Address *
              </label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="input-premium pl-14"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Household Name (Only if NOT joining) */}
            {!inviteToken && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">
                  Household Name (Optional)
                </label>
                <div className="relative group">
                  <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    placeholder="The Smith Home"
                    className="input-premium pl-14"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-4">
                Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  Creating Account...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.1em]">
              Secure Registration Protected
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500/50" />
              <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">TLS 1.3 Encryption Active</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Link */}
        <div className="mt-8 text-center text-slate-400 text-sm font-medium">
          Already have an account?{' '}
          <Link href="/" className="text-indigo-400 font-black hover:text-white transition-all underline decoration-indigo-500/30 underline-offset-4">
            Log In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  )
}
