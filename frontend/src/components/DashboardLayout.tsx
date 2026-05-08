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
  Shield,
  BookOpen
} from 'lucide-react'
import MobileNav from './MobileNav'
import Logo from './Logo'

interface Props {
  children: ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout, loadFromLocalStorage, refreshUser } = useAuthStore()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    loadFromLocalStorage()
    refreshUser()
  }, [])

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/')
    }
  }, [user, router])

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Household', href: '/assets', icon: Package },
    { name: 'Protocol', href: '/tasks', icon: CheckSquare },
    { name: 'Family', href: '/dashboard/family', icon: Users },
    { name: 'History', href: '/history', icon: History },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-white text-slate-900 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-100 transform transition-transform duration-500 lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col p-8">
          {/* Logo */}
          <div className="flex items-center justify-between mb-16">
            <Link href="/dashboard">
              <Logo />
            </Link>
            <button className="lg:hidden p-2 hover:bg-slate-50 rounded-xl text-slate-400" onClick={toggleSidebar}>
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 space-y-12">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item-zen ${isActive ? 'nav-item-zen-active' : 'nav-item-zen-inactive'}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <item.icon className={`mr-4 h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="pt-8 border-t border-slate-50">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-6">Resources</p>
              <Link
                href="/knowledge"
                className={`nav-item-zen ${pathname === '/knowledge' ? 'nav-item-zen-active' : 'nav-item-zen-inactive'}`}
              >
                <BookOpen className="mr-4 h-5 w-5" />
                Knowledge Base
              </Link>
              {user.isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className={`nav-item-zen mt-2 ${pathname === '/dashboard/admin' ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                >
                  <Shield className="mr-4 h-5 w-5" />
                  Admin Console
                </Link>
              )}
            </div>
          </div>

          {/* User Section */}
          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-center gap-4 mb-6 px-2">
              <div className={clsx(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-inner",
                user.plan === 'premium' ? "bg-indigo-600" : "bg-slate-200 text-slate-500"
              )}>
                {user.plan === 'premium' ? <Star className="w-6 h-6 fill-white" /> : user.fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-slate-900 truncate">{user.fullName}</p>
                <p className={clsx(
                  "text-[10px] truncate font-black uppercase tracking-widest mt-0.5",
                  user.plan === 'premium' ? "text-indigo-600" : "text-slate-400"
                )}>
                  {user.plan === 'premium' ? 'Premium Protocol' : 'Basic Tier'}
                </p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-slate-50/30">
        {/* Top Header */}
        <header className="h-24 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-6">
            <button onClick={toggleSidebar} className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl w-80 group focus-within:bg-white focus-within:border-indigo-200 transition-all">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search protocols..." 
                className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400 w-full" 
                onFocus={() => {
                  // Trigger search palette logic if needed
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all relative">
              <Bell className="w-5 h-5" />
              <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-indigo-600 rounded-full border-4 border-white" />
            </button>
            <div className="w-[1px] h-8 bg-slate-100 mx-2" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block font-black uppercase tracking-tighter">
                <p className="text-[9px] text-slate-400 leading-none">Ready for</p>
                <p className="text-sm text-slate-900">{user.fullName.split(' ')[0]}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative overflow-y-auto overflow-x-hidden px-10 py-12 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  )
}
