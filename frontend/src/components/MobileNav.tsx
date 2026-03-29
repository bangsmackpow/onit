'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, List, Shield, Settings, PlusCircle } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Assets', href: '/assets', icon: Shield },
  { name: 'Add', href: '/wizard', icon: PlusCircle, highlight: true },
  { name: 'Tasks', href: '/tasks', icon: List },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      <div className="mx-4 mb-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-[2rem] px-2 py-2 flex items-center justify-around shadow-2xl shadow-black/50">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center py-2 px-1 transition-all rounded-2xl relative",
                item.highlight ? "text-blue-400 -mt-10" : isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {item.highlight ? (
                <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 border-4 border-slate-900 border-opacity-80 scale-110 active:scale-90 transition-transform">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
              ) : (
                <>
                  <item.icon className={clsx("w-6 h-6 mb-1", isActive && "animate-pulse")} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
                </>
              )}
              {isActive && !item.highlight && (
                <div className="absolute -bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
