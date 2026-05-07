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
  X,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'

interface Member {
  id: string
  full_name: string
  email: string
  role: 'admin' | 'member'
  is_owner: number
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: string
  expires_at: string
  created_at: string
}

export default function FamilySettingsPage() {
  const { user } = useAuthStore()
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', role: 'member' })
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [sendingInvite, setSendingInvite] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      const [membersRes, invitesRes] = await Promise.all([
        apiGet('/api/auth/members'),
        apiGet('/api/invitations')
      ])
      setMembers(membersRes.data.members || [])
      setInvitations(invitesRes.data.invitations || [])
    } catch (err) {
      console.error('Failed to fetch family data', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    setSendingInvite(true)
    setInviteError(null)
    try {
      await apiPost('/api/invitations', inviteData)
      setIsInviteModalOpen(false)
      setInviteData({ email: '', role: 'member' })
      fetchData()
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleRevokeInvite(id: string) {
    if (!confirm('Revoke this invitation?')) return
    try {
      await apiDelete(`/api/invitations/${id}`)
      setInvitations(invitations.filter(i => i.id !== id))
    } catch (err) {
      alert('Failed to revoke invitation')
    }
  }

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await apiPost('/api/billing/create-checkout-session', {})
      if (res.data.url) {
        window.location.href = res.data.url
      }
    } catch (err) {
      console.error('Failed to create checkout session', err)
      alert('Failed to initiate upgrade. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Household <span className="text-indigo-500">Members</span>
            </h1>
            <p className="text-slate-400 text-lg font-medium max-w-lg">
              Manage your family and team members for shared maintenance.
            </p>
          </div>
          {user?.isOwner && (
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="btn-premium btn-premium-primary"
            >
              <UserPlus className="w-5 h-5" />
              Invite Member
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Members List */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-white flex items-center gap-3 pl-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Active Members
              </h2>
              
              <div className="grid gap-4">
                {loading ? (
                  [1, 2].map(i => <div key={i} className="h-24 glass-card animate-pulse rounded-3xl" />)
                ) : members.map((member) => (
                  <div key={member.id} className="glass-card p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-5">
                      <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black",
                        member.is_owner ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500"
                      )}>
                        {member.is_owner ? <Star className="w-6 h-6 fill-white" /> : member.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                          {member.full_name}
                          {member.is_owner === 1 && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Owner</span>}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Role</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{member.role}</p>
                      </div>
                      {user?.isOwner && !member.is_owner && (
                        <button className="p-3 text-slate-600 hover:text-rose-400 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Management */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-white flex items-center gap-3 pl-2">
                <Star className="w-5 h-5 text-indigo-500" />
                Household Plan
              </h2>
              
              <div className="glass-card p-10 rounded-[3rem] relative overflow-hidden group border border-indigo-500/20 bg-indigo-500/[0.02]">
                <div className="glow-mesh opacity-30" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em]",
                        user?.plan === 'premium' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-slate-500 border-white/5"
                      )}>
                        {user?.plan === 'premium' ? 'Premium Protocol Active' : 'Basic Tier'}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black text-white">
                      {user?.plan === 'premium' ? 'Unlimited Family Access' : 'Personal Maintenance'}
                    </h3>
                    <p className="text-slate-400 font-medium max-w-md leading-relaxed">
                      {user?.plan === 'premium' 
                        ? 'Your household is optimized with full family collaboration, unlimited assets, and priority push alerts.' 
                        : 'Upgrade to the Premium tier to unlock multi-user collaboration and advanced maintenance automation.'}
                    </p>
                  </div>
                  
                  {user?.isOwner && user?.plan !== 'premium' && (
                    <button 
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="btn-premium btn-premium-primary px-10 py-5 text-lg shadow-2xl group/upgrade"
                    >
                      {loading ? 'Initializing...' : 'Upgrade Household'}
                      <Zap className="w-6 h-6 fill-white group-hover/upgrade:scale-125 transition-transform" />
                    </button>
                  )}
                  
                  {user?.plan === 'premium' && (
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified Premium</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Invitations */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-white flex items-center gap-3 pl-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Invites
            </h2>
            
            {invitations.length === 0 ? (
              <div className="glass-card p-10 rounded-[2.5rem] text-center border-dashed border-white/5">
                <Mail className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-600 leading-relaxed">No pending invitations.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invitations.map((invite) => (
                  <div key={invite.id} className="glass-card p-6 rounded-[2rem] space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-white truncate max-w-[140px]">{invite.email}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-0.5">{invite.role}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-2.5 h-2.5" />
                        Expires {format(parseISO(invite.expires_at), 'MMM d')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setIsInviteModalOpen(false)}></div>
          <div className="relative glass-card w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500 border-white/10">
            <div className="glow-mesh" />
            
            <div className="p-10 md:p-16 relative z-10">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Invite Family</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Add Household Member</p>
                  </div>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-3 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {inviteError && (
                <div className="mb-8 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <p className="text-rose-200 text-xs font-semibold">{inviteError}</p>
                </div>
              )}

              <form onSubmit={handleSendInvite} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5">Recipient Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                      type="email"
                      required
                      value={inviteData.email}
                      onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                      placeholder="spouse@family.com"
                      className="input-premium pl-14 h-16"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5">Assigned Role</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setInviteData({ ...inviteData, role: 'member' })}
                      className={clsx(
                        "p-5 rounded-2xl border transition-all text-left group",
                        inviteData.role === 'member' ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      <CheckCircle2 className={clsx("w-5 h-5 mb-3", inviteData.role === 'member' ? "text-white" : "text-slate-600")} />
                      <p className="text-xs font-black uppercase tracking-widest">Member</p>
                      <p className={clsx("text-[8px] font-medium mt-1 uppercase tracking-tighter", inviteData.role === 'member' ? "text-indigo-200" : "text-slate-500")}>View & Complete</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteData({ ...inviteData, role: 'admin' })}
                      className={clsx(
                        "p-5 rounded-2xl border transition-all text-left group",
                        inviteData.role === 'admin' ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                      )}
                    >
                      <Shield className={clsx("w-5 h-5 mb-3", inviteData.role === 'admin' ? "text-white" : "text-slate-600")} />
                      <p className="text-xs font-black uppercase tracking-widest">Admin</p>
                      <p className={clsx("text-[8px] font-medium mt-1 uppercase tracking-tighter", inviteData.role === 'admin' ? "text-indigo-200" : "text-slate-500")}>Full Access</p>
                    </button>
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    type="submit"
                    disabled={sendingInvite}
                    className="btn-premium btn-premium-primary w-full h-[72px] text-lg shadow-2xl group/sub"
                  >
                    {sendingInvite ? 'Sending Protocol...' : 'Dispatch Invitation'}
                    <ArrowRight className="w-6 h-6 group-hover/sub:translate-x-1 transition-transform" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Invite Link</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
