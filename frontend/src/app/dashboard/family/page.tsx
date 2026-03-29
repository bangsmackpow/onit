'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { apiGet, apiPost, apiDelete } from '@/lib/apiClient'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Copy,
  Zap,
  Star,
  Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'
import { useAuthStore } from '@/store/authStore'

interface UserMember {
  id: string
  full_name: string
  email: string
  role: string
  is_owner: number
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  token: string
  expires_at: string
  created_at: string
}

export default function FamilyPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<UserMember[]>([])
  const [invites, setInvites] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiGet('/api/auth/members'),
        apiGet('/api/invitations')
      ])
      setMembers(membersRes.data.members || [])
      setInvites(invitesRes.data.invitations || [])
    } catch (err) {
      console.error('Failed to fetch family data', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    setFeedback(null)

    try {
      await apiPost('/api/invitations', {
        email: inviteEmail,
        role: inviteRole
      })
      setFeedback({ type: 'success', message: `Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      fetchData()
    } catch (err: any) {
      setFeedback({ 
        type: 'error', 
        message: err.response?.data?.error || 'Failed to send invitation' 
      })
    } finally {
      setIsInviting(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return
    try {
      await apiDelete(`/api/invitations/${id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to revoke invite', err)
    }
  }

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      const res = await apiPost('/api/billing/create-checkout-session')
      window.location.href = res.data.url
    } catch (err) {
      console.error('Upgrade failed', err)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Invite link copied to clipboard!')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
              <Users className="w-10 h-10 text-indigo-500" />
              Family <span className="text-indigo-500">& Members</span>
            </h1>
            <p className="text-slate-400 text-lg">Manage who has access to your household maintenance schedule.</p>
          </div>
          
          {user?.plan === 'premium' ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <Star className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Premium Household</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/5 rounded-full">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Free Account</span>
            </div>
          )}
        </div>

        {/* Premium Upgrade CTA */}
        {user?.plan !== 'premium' && (
          <div className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12 bg-gradient-to-br from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-500/20">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="w-32 h-32 text-white" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                  <Zap className="w-3 h-3 text-white fill-white" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Upgrade to Premium</span>
                </div>
                <h2 className="text-3xl font-black text-white leading-tight">Unlock Family Sharing</h2>
                <p className="text-indigo-100 font-medium max-w-md">
                  Invite your spouse, roommates, or family members to collaborate on tasks and share household assets.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Multi-user Collaboration
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Document & Media Storage
                  </div>
                </div>
              </div>
              <button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50"
              >
                {isUpgrading ? 'Loading...' : 'Go Premium — $4.99/mo'}
              </button>
            </div>
          </div>
        )}

        {/* Invite Form (Locked for Free users) */}
        <div className={clsx(
          "glass-card p-8 rounded-[2.5rem] relative overflow-hidden group transition-opacity",
          user?.plan !== 'premium' && "opacity-50"
        )}>
           {user?.plan !== 'premium' && (
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center">
              <Shield className="w-12 h-12 text-indigo-400 mb-4 opacity-50" />
              <p className="text-white font-bold max-w-[200px]">Unlock Invitations with Premium</p>
            </div>
          )}
          
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <UserPlus className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-xl font-black text-white mb-6">Invite Someone</h2>
          
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  disabled={user?.plan !== 'premium'}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                disabled={user?.plan !== 'premium'}
                className="bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              >
                <option value="member">Member (View/Edit)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
              <button
                type="submit"
                disabled={isInviting || user?.plan !== 'premium'}
                className="btn-premium btn-premium-primary px-8 py-4 disabled:opacity-50"
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
            
            {feedback && (
              <p className={clsx(
                "text-sm font-bold flex items-center gap-2",
                feedback.type === 'success' ? "text-emerald-400" : "text-rose-400"
              )}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {feedback.message}
              </p>
            )}
          </form>
        </div>

        {/* Members List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white pl-2">Current Members</h2>
          <div className="grid gap-4">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-20 glass-card animate-pulse rounded-3xl" />)
            ) : members.map((member) => (
              <div key={member.id} className="glass-card p-5 rounded-3xl flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black border border-indigo-500/20">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {member.full_name}
                      {member.is_owner === 1 && <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Owner</span>}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Role</p>
                    <p className="text-xs font-bold text-slate-300 capitalize">{member.role}</p>
                  </div>
                  {member.is_owner === 0 && (
                    <button className="p-3 text-slate-600 hover:text-rose-400 transition-colors p-2 hover:bg-rose-500/10 rounded-xl">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white pl-2">Pending Invitations</h2>
            <div className="grid gap-4">
              {invites.map((invite) => (
                <div key={invite.id} className="glass-card p-5 rounded-3xl flex items-center justify-between border-dashed">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-200">{invite.email}</h3>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Expires {format(parseISO(invite.expires_at), 'MMM d')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyInviteLink(invite.token)}
                      className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                      title="Copy Invite Link"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                      title="Revoke"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
