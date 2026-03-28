// frontend/src/components/DashboardLayout.tsx
'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { 
  LayoutDashboard, 
  Package, 
  CheckSquare, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  PlusCircle
} from 'lucide-react'
import { useState } from 'react'

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
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Assets', href: '/assets', icon: Package },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'History', href: '/history', icon: History },
  ]

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar for Desktop & Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
            <span className="text-2xl font-black text-blue-600 tracking-tight">ONIT.</span>
            <button className="lg:hidden" onClick={toggleSidebar}>
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {user.fullName.charAt(0)}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all"
            >
              <LogOut className="mr-3 h-5 w-5 opacity-50" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:hidden">
          <button onClick={toggleSidebar} className="p-2 -ml-2 text-gray-500">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-xl font-bold text-blue-600">ONIT.</span>
          <div className="w-10"></div> {/* Spacer for symmetry */}
        </header>

        <main className="flex-1 relative overflow-y-auto focus:outline-none p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
