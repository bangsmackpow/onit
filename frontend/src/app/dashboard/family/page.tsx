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
  ExternalLink
} from 'lucide-react'
import { clsx } from 'clsx'
import { format, parseISO } from 'date-fns'

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
  const [members, setMembers] = useState<UserMember[]>([])
  const [invites, setInvites] = useState<Invitation[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [loading, setLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [membersRes, invitesRes] = await Promise.all([
        apiGet('/api/auth/members'), // We need to implement this endpoint
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

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/register?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Invite link copied to clipboard!')
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10 pb-24">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
            <Users className="w-10 h-10 text-indigo-500" />
            Family <span className="text-indigo-500">& Members</span>
          </h1>
          <p className="text-slate-400 text-lg">Manage who has access to your household maintenance schedule.</p>
        </div>

        {/* Invite Form */}
        <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
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
                  className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                />
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="bg-slate-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
              >
                <option value="member">Member (View/Edit)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
              <button
                type="submit"
                disabled={isInviting}
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
