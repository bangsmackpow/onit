'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, ShieldCheck, Zap } from 'lucide-react'
import { apiPost } from '@/lib/apiClient'
import { clsx } from 'clsx'

const VAPID_PUBLIC_KEY = 'BJf7iR-Fw0EkCgbLBz6RsAD86CeoUxejTd4Ghl9f4WtXGdFNIEKoTM1j0-qL9dj75OvjEdsNoFVelbKv262Z0yA'

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      checkSubscription()
    } else {
      setLoading(false)
    }
  }, [])

  async function checkSubscription() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
    setLoading(false)
  }

  async function subscribe() {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })
      
      await apiPost('/api/reminders/subscribe', { subscription: sub })
      setSubscription(sub)
    } catch (err) {
      console.error('Failed to subscribe to push notifications', err)
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
        await apiPost('/api/reminders/unsubscribe', { endpoint: subscription.endpoint })
        setSubscription(null)
      }
    } catch (err) {
      console.error('Failed to unsubscribe', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6">
        <Bell className={clsx("w-12 h-12 transition-all duration-700", subscription ? "text-indigo-500/20" : "text-slate-800")} />
      </div>
      
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3">PWA Real-Time Alerts</p>
        <h3 className="text-2xl font-black text-white mb-2">Native Push</h3>
        <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed max-w-[200px]">
          {subscription 
            ? "Your device is registered for live maintenance alerts." 
            : "Receive lock-screen notifications for overdue tasks."}
        </p>

        <button
          onClick={subscription ? unsubscribe : subscribe}
          disabled={loading}
          className={clsx(
            "w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
            subscription 
              ? "bg-white/5 text-slate-400 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20" 
              : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500"
          )}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : subscription ? (
            <><BellOff className="w-4 h-4" /> Disable Alerts</>
          ) : (
            <><Bell className="w-4 h-4" /> Enable Notifications</>
          )}
        </button>

        {subscription && (
          <div className="mt-6 flex items-center gap-2 opacity-50">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Device Handshake Verified</span>
          </div>
        )}
      </div>
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
