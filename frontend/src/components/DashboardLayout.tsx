// frontend/src/components/DashboardLayout.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  Package, 
  CheckSquare, 
  History, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  Users,
  Star,
  Zap,
  Shield
} from 'lucide-react'
import MobileNav from './MobileNav'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, loadFromLocalStorage } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/')
    }
  }, [user, router])

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets', href: '/assets', icon: Package },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Family', href: '/dashboard/family', icon: Users },
    { name: 'Activity', href: '/history', icon: History },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#020617] text-slate-300 flex overflow-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-indigo-600/5 blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-0 w-full h-[500px] bg-emerald-600/5 blur-[120px] -z-10" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 glass-sidebar transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-6">
          {/* Logo */}
          <div className="flex items-center justify-between mb-10 pl-2">
            <span className="text-3xl font-black text-white tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/40" />
              ONIT<span className="text-indigo-500">.</span>
            </span>
            <button className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400" onClick={toggleSidebar}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 ml-4">Main Menu</p>
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {user.isAdmin && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-4 ml-4">System</p>
                <nav className="space-y-1">
                  <Link
                    href="/dashboard/admin"
                    className={`nav-item ${pathname === '/dashboard/admin' ? 'bg-rose-500/10 text-white' : 'text-slate-400 hover:bg-rose-500/5 hover:text-rose-400'}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Shield className={`mr-3 h-5 w-5 transition-colors ${pathname === '/dashboard/admin' ? 'text-rose-400' : 'text-slate-500'}`} />
                    Admin Console
                  </Link>
                </nav>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className="pt-6 border-t border-white/5 mx-[-1.5rem] px-6">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
              <div className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shadow-lg",
                user.plan === 'premium' ? "bg-gradient-to-br from-indigo-500 to-indigo-700" : "bg-slate-700"
              )}>
                {user.plan === 'premium' ? <Star className="w-5 h-5 fill-white" /> : user.fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                <p className={clsx(
                  "text-[10px] truncate font-black uppercase tracking-widest mt-0.5",
                  user.plan === 'premium' ? "text-indigo-400" : "text-slate-500"
                )}>
                  {user.plan === 'premium' ? 'Premium Plan' : 'Free Account'}
                </p>
              </div>
            </div>
            
            {user.plan !== 'premium' && (
              <Link 
                href="/dashboard/family" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all mb-4 group"
              >
                <Zap className="w-4 h-4 fill-indigo-400 group-hover:scale-125 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest">Upgrade Now</span>
              </Link>
            )}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-slate-950/20 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-xl w-64 text-slate-500 focus-within:border-indigo-500/40 focus-within:text-slate-300 transition-all">
              <Search className="w-4 h-4" />
              <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-xs flex-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all relative group">
              <Bell className="w-5 h-5" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-[#020617]" />
            </button>
            <div className="w-[1px] h-6 bg-white/10 mx-1" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 line-height-1">Welcome back,</p>
                <p className="text-xs font-bold text-white">{user.fullName.split(' ')[0]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto overflow-x-hidden p-8 lg:p-12 bg-dashboard-radial">
          {children}
        </main>
      </div>

      {/* Global Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
